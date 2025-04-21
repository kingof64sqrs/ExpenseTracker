// Test script to create anomalous expenses
const axios = require('axios');

// Configure axios
axios.defaults.baseURL = 'http://localhost:5000';

// Sample user ID - replace with an actual user ID from your database
const userId = '1'; // Replace with a valid user ID

// Function to create a normal expense
async function createNormalExpense() {
  try {
    const response = await axios.post('/api/expenses', {
      userId,
      amount: 25.50,
      category: 'Food',
      description: 'Regular lunch',
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Credit Card',
      isRecurring: false
    });
    console.log('Normal expense created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating normal expense:', error.response?.data || error.message);
  }
}

// Function to create an anomalous expense (much higher amount)
async function createAnomalousExpense() {
  try {
    const response = await axios.post('/api/expenses', {
      userId,
      amount: 150.00, // Much higher than normal for this category
      category: 'Food',
      description: 'Expensive restaurant',
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Credit Card',
      isRecurring: false
    });
    console.log('Anomalous expense created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating anomalous expense:', error.response?.data || error.message);
  }
}

// Function to get all expenses
async function getAllExpenses() {
  try {
    const response = await axios.get(`/api/expenses/user/${userId}`);
    console.log('All expenses:', response.data);
    
    // Count anomalies
    const anomalies = response.data.filter(exp => exp.isAnomaly);
    console.log(`Found ${anomalies.length} anomalies:`, anomalies);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching expenses:', error.response?.data || error.message);
  }
}

// Run the test
async function runTest() {
  console.log('Creating normal expenses to establish baseline...');
  
  // Create several normal expenses to establish a baseline
  for (let i = 0; i < 5; i++) {
    await createNormalExpense();
  }
  
  console.log('\nCreating an anomalous expense...');
  await createAnomalousExpense();
  
  console.log('\nFetching all expenses to check for anomalies...');
  await getAllExpenses();
}

runTest().catch(console.error);
