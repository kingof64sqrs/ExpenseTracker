const Expense = require('../models/Expense');
const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const anomalyDetector = require('../utils/anomalyDetection');
const budgetAnalytics = require('../utils/budgetAnalytics');

// Advanced anomaly detection will replace the simple helper function
// The old function is retained as a comment for reference
/*
async function detectAnomalies(newExpense) {
  try {
    // Find the user's budget for this category
    const budget = await Budget.findOne({
      userId: newExpense.userId,
      category: newExpense.category
    });
    
    // If no budget exists for this category, check if it's a large expense
    if (!budget) {
      // Get user's expenses to determine if this is unusually large
      const userExpenses = await Expense.find({ userId: newExpense.userId });
      if (userExpenses.length > 0) {
        const averageExpense = userExpenses.reduce((sum, exp) => sum + exp.amount, 0) / userExpenses.length;
        if (newExpense.amount > averageExpense * 3) {
          return {
            isAnomaly: true,
            reason: `This expense is unusually large (${Math.round(newExpense.amount / averageExpense)}x your average expense) and has no budget category`
          };
        }
      }
      return { isAnomaly: false, reason: null };
    }
    
    // Calculate what percentage of the budget this expense represents
    const percentOfBudget = (newExpense.amount / budget.amount) * 100;
    
    // If the expense is more than 50% of the budget, mark it as an anomaly
    if (percentOfBudget > 50) {
      return {
        isAnomaly: true,
        reason: `This expense is ${Math.round(percentOfBudget)}% of your ${newExpense.category} budget of $${budget.amount.toFixed(2)}`
      };
    }
    
    return { isAnomaly: false, reason: null };
  } catch (err) {
    console.error('Error detecting anomalies:', err);
    return { isAnomaly: false, reason: null };
  }
}
*/

// Enhanced createExpense with AI-powered anomaly detection
exports.createExpense = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Validate userId
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Create expense object but don't save yet
    const expenseData = {
      ...req.body,
      userId
    };

    // Check if this expense is an anomaly using advanced detection
    const anomalyResult = await anomalyDetector.detectAnomalies(expenseData);
    
    // Add anomaly information to the expense
    expenseData.isAnomaly = anomalyResult.isAnomaly;
    expenseData.anomalyReason = anomalyResult.reason;
    expenseData.anomalyConfidence = anomalyResult.confidence;

    // Now create and save the expense with anomaly information
    const newExpense = new Expense(expenseData);
    const savedExpense = await newExpense.save();
    
    // If this is an anomaly with high confidence, we could add additional actions here,
    // such as notifications or alerts (future enhancement)
    
    res.status(201).json({
      ...savedExpense.toObject(),
      anomalyDetails: anomalyResult.details // Include detailed anomaly analysis in response
    });
  } catch (err) {
    console.error('Error in createExpense:', err);
    res.status(400).json({ message: 'Failed to create expense', error: err.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const expenses = await Expense.find({ userId }).sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch expenses', error: err });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the expense data before updating
    const expenseData = { ...req.body };
    
    // Check if this expense is an anomaly using advanced detection
    const anomalyResult = await anomalyDetector.detectAnomalies(expenseData);
    
    // Add anomaly information to the expense
    expenseData.isAnomaly = anomalyResult.isAnomaly;
    expenseData.anomalyReason = anomalyResult.reason;
    expenseData.anomalyConfidence = anomalyResult.confidence;
    
    // Update the expense with anomaly information
    const updated = await Expense.findByIdAndUpdate(id, expenseData, { new: true });
    
    res.status(200).json({
      ...updated.toObject(),
      anomalyDetails: anomalyResult.details // Include detailed anomaly analysis in response
    });
  } catch (err) {
    console.error('Error in updateExpense:', err);
    res.status(500).json({ message: 'Failed to update expense', error: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Expense ID is required' });
    }

    console.log('Attempting to delete expense with ID:', id);
    
    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid expense ID format:', id);
      return res.status(400).json({ message: 'Invalid expense ID format' });
    }

    const deletedExpense = await Expense.findByIdAndDelete(id);
    
    if (!deletedExpense) {
      console.log('Expense not found with ID:', id);
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    console.log('Successfully deleted expense with ID:', id);
    res.status(200).json({ message: 'Expense deleted successfully', id });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ message: 'Failed to delete expense', error: err.message });
  }
};

// New endpoint to get budget insights
exports.getBudgetInsights = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Generate budget recommendations
    const recommendations = await budgetAnalytics.generateBudgetRecommendations(userId);
    
    // Analyze budget execution
    const executionAnalysis = await budgetAnalytics.analyzeExecution(userId);
    
    res.status(200).json({
      recommendations,
      executionAnalysis
    });
  } catch (err) {
    console.error('Error generating budget insights:', err);
    res.status(500).json({ message: 'Failed to generate budget insights', error: err.message });
  }
};

// New endpoint to reanalyze anomalies in all expenses
exports.reanalyzeAnomalies = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get all expenses for the user
    const expenses = await Expense.find({ userId });
    
    // Batch detect anomalies
    const analyzedExpenses = await anomalyDetector.batchDetectAnomalies(expenses);
    
    // Update each expense with new anomaly information
    const updatePromises = analyzedExpenses.map(async (expense) => {
      return Expense.findByIdAndUpdate(expense._id, {
        isAnomaly: expense.isAnomaly,
        anomalyReason: expense.anomalyReason,
        anomalyConfidence: expense.anomalyConfidence
      });
    });
    
    await Promise.all(updatePromises);
    
    // Count updated anomalies
    const anomaliesCount = analyzedExpenses.filter(exp => exp.isAnomaly).length;
    
    res.status(200).json({
      message: `Reanalyzed ${expenses.length} expenses and found ${anomaliesCount} anomalies`,
      anomaliesCount,
      totalExpenses: expenses.length
    });
  } catch (err) {
    console.error('Error reanalyzing anomalies:', err);
    res.status(500).json({ message: 'Failed to reanalyze anomalies', error: err.message });
  }
};
