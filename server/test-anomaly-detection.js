// Test script for anomaly detection
const anomalyDetector = require('./utils/anomalyDetection');
const mongoose = require('mongoose');
const Expense = require('./models/Expense');
const Budget = require('./models/Budget');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Test function for budget threshold anomaly detection
async function testBudgetThresholdAnomaly() {
  try {
    console.log('\n--- Testing Budget Threshold Anomaly Detection ---');
    
    // Create a test user ID
    const testUserId = 'test-user-' + Date.now();
    
    // Create a test budget
    const testBudget = new Budget({
      userId: testUserId,
      category: 'Food',
      amount: 500, // $500 budget
      period: 'monthly'
    });
    await testBudget.save();
    console.log('Created test budget:', testBudget);
    
    // Test with 60% of budget (should be anomaly)
    const highExpenseAmount = 300;
    const highExpenseResult = await anomalyDetector.detectBudgetThresholdAnomaly(
      testUserId,
      'Food',
      highExpenseAmount
    );
    console.log('High expense test (60% of budget):', highExpenseResult);
    
    // Test with 40% of budget (should be anomaly)
    const mediumExpenseAmount = 200;
    const mediumExpenseResult = await anomalyDetector.detectBudgetThresholdAnomaly(
      testUserId,
      'Food',
      mediumExpenseAmount
    );
    console.log('Medium expense test (40% of budget):', mediumExpenseResult);
    
    // Test with 20% of budget (should not be anomaly)
    const normalExpenseAmount = 100;
    const normalExpenseResult = await anomalyDetector.detectBudgetThresholdAnomaly(
      testUserId,
      'Food',
      normalExpenseAmount
    );
    console.log('Normal expense test (20% of budget):', normalExpenseResult);
    
    // Clean up test data
    await Budget.deleteOne({ userId: testUserId });
    console.log('Test data cleaned up');
    
  } catch (error) {
    console.error('Error in testBudgetThresholdAnomaly:', error);
  }
}

// Test function for rapid succession anomaly detection
async function testRapidSuccessionAnomaly() {
  try {
    console.log('\n--- Testing Rapid Succession Anomaly Detection ---');
    
    // Create a test user ID
    const testUserId = 'test-user-' + Date.now();
    
    // Create multiple test expenses in the same day
    const today = new Date().toISOString().slice(0, 10);
    
    // Create 3 expenses in the same category on the same day
    const testExpenses = [
      new Expense({
        userId: testUserId,
        amount: 20,
        category: 'Entertainment',
        description: 'Test expense 1',
        date: today,
        paymentMethod: 'Credit Card'
      }),
      new Expense({
        userId: testUserId,
        amount: 30,
        category: 'Entertainment',
        description: 'Test expense 2',
        date: today,
        paymentMethod: 'Credit Card'
      }),
      new Expense({
        userId: testUserId,
        amount: 25,
        category: 'Entertainment',
        description: 'Test expense 3',
        date: today,
        paymentMethod: 'Credit Card'
      })
    ];
    
    for (const expense of testExpenses) {
      await expense.save();
    }
    console.log(`Created ${testExpenses.length} test expenses for today`);
    
    // Test rapid succession detection
    const rapidSuccessionResult = await anomalyDetector.detectRapidSuccessionAnomaly(
      testUserId,
      'Entertainment',
      today
    );
    console.log('Rapid succession test result:', rapidSuccessionResult);
    
    // Clean up test data
    await Expense.deleteMany({ userId: testUserId });
    console.log('Test data cleaned up');
    
  } catch (error) {
    console.error('Error in testRapidSuccessionAnomaly:', error);
  }
}

// Test function for budget depletion anomaly detection
async function testBudgetDepletionAnomaly() {
  try {
    console.log('\n--- Testing Budget Depletion Anomaly Detection ---');
    
    // Create a test user ID
    const testUserId = 'test-user-' + Date.now();
    
    // Create a test budget
    const testBudget = new Budget({
      userId: testUserId,
      category: 'Shopping',
      amount: 400, // $400 budget
      period: 'monthly'
    });
    await testBudget.save();
    console.log('Created test budget:', testBudget);
    
    // Create some existing expenses that use up 70% of the budget
    const today = new Date().toISOString().slice(0, 10);
    const testExpense = new Expense({
      userId: testUserId,
      amount: 280, // 70% of budget
      category: 'Shopping',
      description: 'Existing expense',
      date: today,
      paymentMethod: 'Credit Card'
    });
    await testExpense.save();
    console.log('Created test expense using 70% of budget');
    
    // Test with an expense that would push total to 95% of budget
    const newExpenseAmount = 100; // This will push total to 95% of budget
    const depletionResult = await anomalyDetector.detectBudgetDepletionAnomaly(
      testUserId,
      'Shopping',
      newExpenseAmount
    );
    console.log('Budget depletion test result:', depletionResult);
    
    // Clean up test data
    await Budget.deleteOne({ userId: testUserId });
    await Expense.deleteMany({ userId: testUserId });
    console.log('Test data cleaned up');
    
  } catch (error) {
    console.error('Error in testBudgetDepletionAnomaly:', error);
  }
}

// Test comprehensive anomaly detection
async function testComprehensiveDetection() {
  try {
    console.log('\n--- Testing Comprehensive Anomaly Detection ---');
    
    // Create a test user ID
    const testUserId = 'test-user-' + Date.now();
    
    // Create a test budget
    const testBudget = new Budget({
      userId: testUserId,
      category: 'Travel',
      amount: 1000, // $1000 budget
      period: 'monthly'
    });
    await testBudget.save();
    console.log('Created test budget:', testBudget);
    
    // Create a test expense that's 60% of the budget
    const today = new Date().toISOString().slice(0, 10);
    const testExpense = {
      userId: testUserId,
      amount: 600, // 60% of budget
      category: 'Travel',
      description: 'Large travel expense',
      date: today,
      paymentMethod: 'Credit Card'
    };
    
    // Run comprehensive detection
    const detectionResult = await anomalyDetector.detectAnomalies(testExpense);
    console.log('Comprehensive detection result:', JSON.stringify(detectionResult, null, 2));
    
    // Clean up test data
    await Budget.deleteOne({ userId: testUserId });
    console.log('Test data cleaned up');
    
  } catch (error) {
    console.error('Error in testComprehensiveDetection:', error);
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testBudgetThresholdAnomaly();
    await testRapidSuccessionAnomaly();
    await testBudgetDepletionAnomaly();
    await testComprehensiveDetection();
    
    console.log('\nAll tests completed');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error running tests:', error);
    mongoose.disconnect();
  }
}

// Run the tests
runAllTests();
