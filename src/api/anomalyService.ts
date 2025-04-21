import axios from 'axios';

// Set the base URL for API requests
axios.defaults.baseURL = 'http://localhost:5000';

// Get all anomalies for a user
export const getAnomalies = async (userId: string) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(`/api/anomalies/user/${userId}`, {
      headers: {
        'x-auth-token': token
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching anomalies:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch anomalies');
  }
};

// Get anomaly statistics for a user
export const getAnomalyStats = async (userId: string) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(`/api/anomalies/stats/user/${userId}`, {
      headers: {
        'x-auth-token': token
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching anomaly statistics:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch anomaly statistics');
  }
};
