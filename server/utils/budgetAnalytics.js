const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

/**
 * Calculate spending patterns for a user
 * @param {string} userId - The user ID
 * @param {Date} startDate - The start date for analysis
 * @param {Date} endDate - The end date for analysis
 * @returns {Object} - Spending patterns by category
 */
exports.calculateSpendingPatterns = async (userId, startDate, endDate) => {
  try {
    const expenses = await Expense.find({
      userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    // Group expenses by category
    const spendingByCategory = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = {
          totalAmount: 0,
          count: 0,
          expenses: []
        };
      }
      acc[expense.category].totalAmount += expense.amount;
      acc[expense.category].count += 1;
      acc[expense.category].expenses.push(expense);
      return acc;
    }, {});

    // Calculate statistics for each category
    const spendingPatterns = {};
    for (const [category, data] of Object.entries(spendingByCategory)) {
      const amounts = data.expenses.map(exp => exp.amount);
      const mean = data.totalAmount / data.count;
      const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.count;
      const stdDev = Math.sqrt(variance);

      spendingPatterns[category] = {
        totalSpent: data.totalAmount,
        transactionCount: data.count,
        averageExpense: mean,
        stdDev: stdDev,
        maxExpense: Math.max(...amounts),
        minExpense: Math.min(...amounts)
      };
    }

    return spendingPatterns;
  } catch (error) {
    console.error('Error calculating spending patterns:', error);
    throw error;
  }
};

/**
 * Generate AI-based budget recommendations
 * @param {string} userId - The user ID
 * @returns {Object} - Budget recommendations by category
 */
exports.generateBudgetRecommendations = async (userId) => {
  try {
    // Get last 3 months of data
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const spendingPatterns = await this.calculateSpendingPatterns(
      userId,
      threeMonthsAgo,
      new Date()
    );

    // Get existing budgets
    const existingBudgets = await Budget.find({ userId });
    const budgetByCategory = existingBudgets.reduce((acc, budget) => {
      acc[budget.category] = budget.amount;
      return acc;
    }, {});

    // Generate recommendations
    const recommendations = {};
    
    for (const [category, stats] of Object.entries(spendingPatterns)) {
      const currentBudget = budgetByCategory[category] || 0;
      
      // Calculate recommended budget using the average spending plus buffer
      const averageMonthlySpend = stats.totalSpent / 3; // Three months of data
      const recommendedBudget = Math.ceil(averageMonthlySpend * 1.1); // 10% buffer
      
      // Intelligent recommendation based on spending patterns
      let recommendation;
      
      if (currentBudget === 0) {
        // New budget recommendation
        recommendation = {
          action: 'create',
          amount: recommendedBudget,
          reason: `Based on your average spending of $${averageMonthlySpend.toFixed(2)} per month on ${category}`
        };
      } else if (currentBudget < stats.totalSpent / 3 * 0.9) {
        // Budget is too low
        recommendation = {
          action: 'increase',
          amount: recommendedBudget,
          reason: `Your current budget of $${currentBudget.toFixed(2)} is 
                  lower than your average spending of $${averageMonthlySpend.toFixed(2)} per month`
        };
      } else if (currentBudget > stats.totalSpent / 3 * 1.3) {
        // Budget is unnecessarily high
        recommendation = {
          action: 'decrease',
          amount: recommendedBudget,
          reason: `Your current budget of $${currentBudget.toFixed(2)} is much higher 
                  than your average spending of $${averageMonthlySpend.toFixed(2)} per month`
        };
      } else {
        // Budget is reasonable
        recommendation = {
          action: 'maintain',
          amount: currentBudget,
          reason: `Your current budget of $${currentBudget.toFixed(2)} is appropriate 
                  for your average spending of $${averageMonthlySpend.toFixed(2)} per month`
        };
      }
      
      recommendations[category] = {
        currentBudget,
        averageMonthlySpend,
        recommendation
      };
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error generating budget recommendations:', error);
    throw error;
  }
};

/**
 * Analyze budget execution and provide insights
 * @param {string} userId - The user ID
 * @returns {Object} - Budget execution insights
 */
exports.analyzeExecution = async (userId) => {
  try {
    // Get current month data
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const spendingPatterns = await this.calculateSpendingPatterns(
      userId,
      startOfMonth,
      new Date()
    );
    
    const budgets = await Budget.find({ userId });
    
    // Calculate days passed and days in month
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysPassed = today.getDate();
    const monthProgress = daysPassed / daysInMonth;
    
    // Analyze execution
    const executionAnalysis = [];
    
    budgets.forEach(budget => {
      const categorySpending = spendingPatterns[budget.category] || { totalSpent: 0 };
      const spent = categorySpending.totalSpent || 0;
      const spendingRate = spent / budget.amount;
      
      let status, message, alert;
      
      if (spendingRate > monthProgress + 0.1) {
        // Overspending
        status = 'at_risk';
        const projectedTotal = (spent / monthProgress).toFixed(2);
        message = `You're spending too quickly. At this rate, you'll spend $${projectedTotal} by the end of the month, exceeding your budget of $${budget.amount}.`;
        alert = true;
      } else if (spendingRate < monthProgress - 0.2) {
        // Underspending
        status = 'under_budget';
        message = `You're spending less than planned. You've only used ${(spendingRate * 100).toFixed(0)}% of your budget while ${(monthProgress * 100).toFixed(0)}% of the month has passed.`;
        alert = false;
      } else {
        // On track
        status = 'on_track';
        message = `You're on track with your ${budget.category} budget.`;
        alert = false;
      }
      
      executionAnalysis.push({
        category: budget.category,
        budgetAmount: budget.amount,
        spent,
        remaining: budget.amount - spent,
        spendingRate,
        monthProgress,
        status,
        message,
        alert
      });
    });
    
    return {
      executionAnalysis,
      overallStatus: executionAnalysis.some(item => item.status === 'at_risk') ? 'at_risk' : 'on_track'
    };
  } catch (error) {
    console.error('Error analyzing budget execution:', error);
    throw error;
  }
}; 