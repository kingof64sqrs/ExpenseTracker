import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
  preferredCategories: string[];
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    // For development/demo only - auto login
    autoLogin: (state) => {
      state.user = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        currency: 'INR',
        preferredCategories: ['Food', 'Transport', 'Entertainment', 'Utilities', 'Shopping', 'Investment', 'Healthcare', 'Education'],
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      };
      state.isAuthenticated = true;
    },
  },
});

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  updateUser,
  autoLogin
} = authSlice.actions;

export default authSlice.reducer;