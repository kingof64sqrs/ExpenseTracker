const Expense = require('../models/Expense');
const anomalyDetector = require('../utils/anomalyDetection');

// Get all anomalous expenses for a user
exports.getAnomalies = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find all expenses marked as anomalies
    const anomalies = await Expense.find({ 
      userId, 
      isAnomaly: true 
    }).sort({ date: -1 }); // Sort by date, newest first
    
    res.status(200).json(anomalies);
  } catch (err) {
    console.error('Error in getAnomalies:', err);
    res.status(500).json({ message: 'Failed to fetch anomalies', error: err.message });
  }
};

// Get anomaly statistics
exports.getAnomalyStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Count total anomalies
    const totalAnomalies = await Expense.countDocuments({ 
      userId, 
      isAnomaly: true 
    });
    
    // Get anomalies by category
    const anomaliesByCategory = await Expense.aggregate([
      { $match: { userId, isAnomaly: true } },
      { $group: { 
          _id: "$category", 
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Calculate total amount of anomalous expenses
    const totalAnomalyAmount = anomaliesByCategory.reduce(
      (sum, category) => sum + category.totalAmount, 0
    );
    
    // Get high-confidence anomalies
    const highConfidenceAnomalies = await Expense.find({
      userId,
      isAnomaly: true,
      anomalyConfidence: { $gt: 0.7 }
    }).sort({ anomalyConfidence: -1 }).limit(5);
    
    // Calculate % of total expenses that are anomalies
    const totalExpenseCount = await Expense.countDocuments({ userId });
    const anomalyPercentage = totalExpenseCount > 0 
      ? (totalAnomalies / totalExpenseCount) * 100 
      : 0;
    
    // Get total amount of all expenses for comparison
    const totalExpenseAmount = await Expense.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const totalAmount = totalExpenseAmount.length > 0 ? totalExpenseAmount[0].total : 0;
    const anomalyAmountPercentage = totalAmount > 0 
      ? (totalAnomalyAmount / totalAmount) * 100 
      : 0;
    
    res.status(200).json({
      totalAnomalies,
      totalAnomalyAmount,
      anomaliesByCategory,
      anomalyPercentage: parseFloat(anomalyPercentage.toFixed(2)),
      anomalyAmountPercentage: parseFloat(anomalyAmountPercentage.toFixed(2)),
      highConfidenceAnomalies,
      totalExpenseCount,
      totalAmount
    });
  } catch (err) {
    console.error('Error in getAnomalyStats:', err);
    res.status(500).json({ message: 'Failed to fetch anomaly statistics', error: err.message });
  }
};

// New endpoint for detailed analysis of a specific anomaly
exports.getAnomalyDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the anomalous expense
    const expense = await Expense.findById(id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    if (!expense.isAnomaly) {
      return res.status(400).json({ message: 'This expense is not marked as an anomaly' });
    }
    
    // Re-run anomaly detection to get fresh detailed analysis
    const anomalyAnalysis = await anomalyDetector.detectAnomalies(expense);
    
    // Get similar expenses for comparison
    const similarExpenses = await Expense.find({
      userId: expense.userId,
      category: expense.category,
      _id: { $ne: expense._id }
    }).sort({ date: -1 }).limit(5);
    
    res.status(200).json({
      expense,
      anomalyAnalysis,
      similarExpenses
    });
  } catch (err) {
    console.error('Error in getAnomalyDetails:', err);
    res.status(500).json({ message: 'Failed to fetch anomaly details', error: err.message });
  }
};

// New endpoint to detect anomalies by time period
exports.getTimeBasedAnomalies = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Validate required parameters
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Build query
    const query = { userId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }
    
    // Get expenses in the time period
    const expenses = await Expense.find(query);
    
    // Run batch anomaly detection
    const analyzedExpenses = await anomalyDetector.batchDetectAnomalies(expenses);
    
    // Filter to just the anomalies
    const anomalies = analyzedExpenses.filter(exp => exp.isAnomaly);
    
    // Group by category for analysis
    const categoryCounts = {};
    anomalies.forEach(anomaly => {
      if (!categoryCounts[anomaly.category]) {
        categoryCounts[anomaly.category] = 0;
      }
      categoryCounts[anomaly.category]++;
    });
    
    res.status(200).json({
      totalExpenses: expenses.length,
      anomaliesFound: anomalies.length,
      anomalyPercentage: expenses.length > 0 ? (anomalies.length / expenses.length) * 100 : 0,
      anomalies,
      categoryCounts
    });
  } catch (err) {
    console.error('Error in getTimeBasedAnomalies:', err);
    res.status(500).json({ message: 'Failed to analyze time-based anomalies', error: err.message });
  }
};
