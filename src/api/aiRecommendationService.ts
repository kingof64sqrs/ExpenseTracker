import axios from 'axios';
import { BudgetRecommendation } from '../store/budgetSlice';

// Flask API endpoint - try multiple options to ensure connectivity
const FLASK_API_URLS = [
  'http://localhost:5001',
  'http://127.0.0.1:5001',
  'http://0.0.0.0:5001'
];

// Default URL to use
let FLASK_API_URL = FLASK_API_URLS[0];

// Test if the Flask API is accessible
export const testFlaskApiConnection = async (): Promise<boolean> => {
  // Try each URL in sequence
  for (const url of FLASK_API_URLS) {
    try {
      console.log(`Testing Flask API connection to ${url}`);
      const response = await axios.get(`${url}`, { timeout: 3000 });
      
      if (response.status === 200) {
        console.log(`Successfully connected to Flask API at ${url}`);
        FLASK_API_URL = url; // Set the working URL as the default
        return true;
      }
    } catch (error) {
      console.warn(`Failed to connect to Flask API at ${url}:`, error);
      // Continue to the next URL
    }
  }
  
  console.error('Failed to connect to any Flask API endpoint');
  return false;
};

// Get AI budget recommendations from Flask API
export const getAIRecommendations = async (): Promise<BudgetRecommendation[]> => {
  try {
    // First test the connection
    const isConnected = await testFlaskApiConnection();
    
    if (!isConnected) {
      console.error('Could not establish connection to Flask API');
      return [];
    }
    
    // Now try to get the recommendations
    const response = await axios.get(`${FLASK_API_URL}/get-latest-recommendation`, {
      timeout: 5000
    });
    
    if (response.data && response.data.recommendations) {
      return response.data.recommendations;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    return [];
  }
};
