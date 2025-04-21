const Expense = require('../models/Expense');

/**
 * Statistical anomaly detection based on Z-score
 * @param {Number} value - The value to check
 * @param {Number} mean - The mean of the dataset
 * @param {Number} stdDev - The standard deviation of the dataset
 * @param {Number} threshold - The threshold for considering an anomaly (default: 2)
 * @returns {Boolean} - Whether the value is an anomaly
 */
const isStatisticalAnomaly = (value, mean, stdDev, threshold = 2) => {
  if (stdDev === 0) return false; // Avoid division by zero
  const zScore = Math.abs((value - mean) / stdDev);
  return zScore > threshold;
};

/**
 * Detect anomalies in a user's expenses within a category
 * @param {string} userId - The user ID
 * @param {string} category - The expense category
 * @param {Number} amount - The amount to check
 * @returns {Object} - Anomaly detection result
 */
exports.detectCategoryAnomaly = async (userId, category, amount) => {
  try {
    // Get historical data for this category (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const expenses = await Expense.find({
      userId,
      category,
      date: { $gte: sixMonthsAgo.toISOString().slice(0, 10) }
    });
    
    if (expenses.length < 3) {
      // Not enough data for meaningful detection
      return {
        isAnomaly: false,
        reason: 'Not enough historical data for detection',
        confidence: 0
      };
    }
    
    // Calculate statistics
    const amounts = expenses.map(exp => exp.amount);
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    
    // Z-score based detection
    const zScore = (amount - mean) / stdDev;
    const isAnomaly = isStatisticalAnomaly(amount, mean, stdDev, 2.5);
    
    // Calculate confidence based on z-score and data quantity
    const confidenceBase = Math.min(Math.abs(zScore) / 5, 1); // Scale to max 1
    const dataQualityFactor = Math.min(expenses.length / 10, 1); // More data = more confidence
    const confidence = confidenceBase * dataQualityFactor;
    
    return {
      isAnomaly,
      zScore,
      mean,
      stdDev,
      reason: isAnomaly 
        ? `Amount $${amount} is ${amount > mean ? 'higher' : 'lower'} than typical spending in ${category} (average: $${mean.toFixed(2)})`
        : null,
      confidence: isAnomaly ? confidence : 0,
      dataPoints: expenses.length
    };
  } catch (error) {
    console.error('Error in detectCategoryAnomaly:', error);
    throw error;
  }
};

/**
 * Detect time-based anomalies (unusual timing)
 * @param {string} userId - The user ID
 * @param {string} category - The expense category
 * @param {Date} date - The date to check
 * @returns {Object} - Anomaly detection result
 */
exports.detectTimingAnomaly = async (userId, category, date) => {
  try {
    // Get historical data for this category
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const expenses = await Expense.find({
      userId,
      category,
      date: { $gte: oneYearAgo.toISOString().slice(0, 10) }
    }).sort({ date: 1 });
    
    if (expenses.length < 5) {
      // Not enough data for meaningful detection
      return {
        isAnomaly: false,
        reason: 'Not enough historical data for timing detection',
        confidence: 0
      };
    }
    
    // Convert to date objects
    const dates = expenses.map(exp => new Date(exp.date));
    
    // Calculate time intervals between transactions
    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24)); // Convert to days
    }
    
    // Calculate average interval and standard deviation
    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate days since last transaction
    const daysSinceLastTransaction = (new Date(date) - dates[dates.length - 1]) / (1000 * 60 * 60 * 24);
    
    // Detect timing anomaly
    const isAnomaly = isStatisticalAnomaly(daysSinceLastTransaction, avgInterval, stdDev, 3);
    
    return {
      isAnomaly,
      reason: isAnomaly 
        ? `Unusual timing for ${category} expense. Average interval is ${avgInterval.toFixed(1)} days, but it's been ${daysSinceLastTransaction.toFixed(1)} days`
        : null,
      confidence: isAnomaly ? Math.min(Math.abs(daysSinceLastTransaction - avgInterval) / avgInterval, 0.9) : 0,
      avgInterval,
      stdDev
    };
  } catch (error) {
    console.error('Error in detectTimingAnomaly:', error);
    throw error;
  }
};

/**
 * Detect frequency anomalies (unusual number of transactions in a period)
 * @param {string} userId - The user ID
 * @param {string} category - The expense category
 * @returns {Object} - Anomaly detection result
 */
exports.detectFrequencyAnomaly = async (userId, category) => {
  try {
    // Calculate current month's transaction count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const currentMonthCount = await Expense.countDocuments({
      userId,
      category,
      date: { $gte: startOfMonth.toISOString().slice(0, 10) }
    });
    
    // Get historical monthly counts (last 6 months)
    const monthlyCounts = [];
    for (let i = 1; i <= 6; i++) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - i);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() - i + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
      
      const count = await Expense.countDocuments({
        userId,
        category,
        date: { 
          $gte: startDate.toISOString().slice(0, 10),
          $lte: endDate.toISOString().slice(0, 10)
        }
      });
      
      monthlyCounts.push(count);
    }
    
    if (monthlyCounts.length === 0) {
      return {
        isAnomaly: false,
        reason: 'No historical data',
        confidence: 0
      };
    }
    
    // Calculate average and standard deviation
    const avgCount = monthlyCounts.reduce((sum, val) => sum + val, 0) / monthlyCounts.length;
    const variance = monthlyCounts.reduce((sum, val) => sum + Math.pow(val - avgCount, 2), 0) / monthlyCounts.length;
    const stdDev = Math.sqrt(variance);
    
    // Scale current month count to full month
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysPassed = today.getDate();
    const projectedCount = (currentMonthCount / daysPassed) * daysInMonth;
    
    // Detect frequency anomaly
    const isAnomaly = isStatisticalAnomaly(projectedCount, avgCount, stdDev, 2);
    
    return {
      isAnomaly,
      reason: isAnomaly 
        ? `Unusual number of ${category} transactions this month. Projected ${projectedCount.toFixed(1)} vs average ${avgCount.toFixed(1)}`
        : null,
      confidence: isAnomaly ? Math.min(Math.abs(projectedCount - avgCount) / (avgCount || 1), 0.9) : 0,
      currentMonthCount,
      projectedCount,
      avgCount,
      monthlyCounts
    };
  } catch (error) {
    console.error('Error in detectFrequencyAnomaly:', error);
    throw error;
  }
};

/**
 * Comprehensive anomaly detection combining multiple techniques
 * @param {Object} expense - The expense object to analyze
 * @returns {Object} - Comprehensive anomaly detection result
 */
exports.detectAnomalies = async (expense) => {
  try {
    const { userId, category, amount, date } = expense;
    
    // Run all detection algorithms
    const [amountAnomaly, timingAnomaly, frequencyAnomaly] = await Promise.all([
      this.detectCategoryAnomaly(userId, category, amount),
      this.detectTimingAnomaly(userId, category, date),
      this.detectFrequencyAnomaly(userId, category)
    ]);
    
    // Combine results with weighted approach
    const isAnomaly = amountAnomaly.isAnomaly || 
                     (timingAnomaly.isAnomaly && timingAnomaly.confidence > 0.7) || 
                     (frequencyAnomaly.isAnomaly && frequencyAnomaly.confidence > 0.8);
    
    // Determine primary reason
    let reason = null;
    let confidence = 0;
    
    if (amountAnomaly.isAnomaly) {
      reason = amountAnomaly.reason;
      confidence = amountAnomaly.confidence;
    } else if (timingAnomaly.isAnomaly && timingAnomaly.confidence > 0.7) {
      reason = timingAnomaly.reason;
      confidence = timingAnomaly.confidence;
    } else if (frequencyAnomaly.isAnomaly && frequencyAnomaly.confidence > 0.8) {
      reason = frequencyAnomaly.reason;
      confidence = frequencyAnomaly.confidence;
    }
    
    return {
      isAnomaly,
      reason,
      confidence,
      details: {
        amountAnomaly,
        timingAnomaly,
        frequencyAnomaly
      }
    };
  } catch (error) {
    console.error('Error in detectAnomalies:', error);
    throw error;
  }
};

/**
 * Process a batch of expenses for anomaly detection
 * @param {Array} expenses - Array of expense objects
 * @returns {Array} - The same expenses with anomaly detection results
 */
exports.batchDetectAnomalies = async (expenses) => {
  try {
    const results = [];
    
    for (const expense of expenses) {
      const anomalyResult = await this.detectAnomalies(expense);
      
      results.push({
        ...expense,
        isAnomaly: anomalyResult.isAnomaly,
        anomalyReason: anomalyResult.reason,
        anomalyConfidence: anomalyResult.confidence,
        anomalyDetails: anomalyResult.details
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error in batchDetectAnomalies:', error);
    throw error;
  }
}; 