import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/authSlice';
import { isTokenExpired } from './tokenManager';

const axiosInstance = axios.create();

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    if (isTokenExpired(token)) {
      store.dispatch(logout());
      throw new Error('Token expired');
    }
    config.headers['x-auth-token'] = token;
  }
  
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;