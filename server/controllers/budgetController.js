const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

exports.getBudgets = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own budgets
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const budgets = await Budget.find({ userId });

    // Get expenses for spending calculation
    const expenses = await Expense.find({ 
      userId,
      date: {
        $gte: new Date(new Date().setDate(1)), // First day of current month
        $lte: new Date()
      }
    });

    // Calculate spending by category
    const spending = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {});

    // Add spending data to each budget
    const budgetsWithSpending = budgets.map(budget => ({
      ...budget.toObject(),
      spent: spending[budget.category] || 0
    }));

    res.json(budgetsWithSpending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createBudget = async (req, res) => {
  try {
    // Ensure budget is created for authenticated user only
    if (req.user.id !== req.body.userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const budget = new Budget(req.body);
    const savedBudget = await budget.save();
    res.status(201).json(savedBudget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    
    // Ensure user can only update their own budgets
    if (!budget || budget.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const updatedBudget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    res.json(updatedBudget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findByIdAndDelete(id);
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json({ message: 'Budget deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBudgetSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get all budgets
    const budgets = await Budget.find({ userId });
    
    // Get current month's expenses
    const expenses = await Expense.find({
      userId,
      date: {
        $gte: new Date(new Date().setDate(1)),
        $lte: new Date()
      }
    });

    // Calculate totals and spending by category
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const spendingByCategory = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {});

    res.json({
      totalBudget,
      totalSpent,
      spendingByCategory,
      budgetCount: budgets.length,
      expenseCount: expenses.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};