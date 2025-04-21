import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

export interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  color: string;
}

export interface BudgetRecommendation {
  id?: string;
  category: string;
  percentage?: number;
  message: string;
  isPositive?: boolean;
}

export interface AnomalyAlert {
  id: string;
  category: string;
  description: string;
  date: string;
  severity: 'low' | 'medium' | 'high';
  amount: number;
  normalAmount: number;
}

interface BudgetState {
  budgets: Budget[];
  loading: boolean;
  error: string | null;
  recommendations: BudgetRecommendation[];
  anomalies: AnomalyAlert[];
}

const initialState: BudgetState = {
  budgets: [],
  loading: false,
  error: null,
  recommendations: [],
  anomalies: [],
};

// Async thunk for fetching budgets
export const fetchBudgets = createAsyncThunk(
  'budgets/fetchBudgets',
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No authentication token found');
      }

      const response = await axios.get(`/api/budgets/user/${userId}`, {
        headers: {
          'x-auth-token': token
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch budgets');
    }
  }
);

export const createBudget = createAsyncThunk(
  'budgets/createBudget',
  async (budgetData: Omit<Budget, 'id'>, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No authentication token found');
      }

      const response = await axios.post('/api/budgets', budgetData, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create budget');
    }
  }
);

export const editBudget = createAsyncThunk(
  'budgets/editBudget',
  async (budget: Budget, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No authentication token found');
      }

      const response = await axios.put(`/api/budgets/${budget.id}`, budget, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update budget');
    }
  }
);

export const removeBudget = createAsyncThunk(
  'budgets/removeBudget',
  async (id: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No authentication token found');
      }

      await axios.delete(`/api/budgets/${id}`, {
        headers: {
          'x-auth-token': token
        }
      });
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete budget');
    }
  }
);

// Mock data for frontend demo
const mockBudgets: Budget[] = [
  {
    id: '1',
    userId: '1',
    category: 'Food',
    amount: 500,
    period: 'monthly',
    color: '#10B981',
  },
  {
    id: '2',
    userId: '1',
    category: 'Transport',
    amount: 200,
    period: 'monthly',
    color: '#3B82F6',
  },
  {
    id: '3',
    userId: '1',
    category: 'Entertainment',
    amount: 150,
    period: 'monthly',
    color: '#F59E0B',
  },
  {
    id: '4',
    userId: '1',
    category: 'Utilities',
    amount: 300,
    period: 'monthly',
    color: '#EF4444',
  },
  {
    id: '5',
    userId: '1',
    category: 'Shopping',
    amount: 250,
    period: 'monthly',
    color: '#8B5CF6',
  },
];

const mockRecommendations: BudgetRecommendation[] = [
  {
    id: '1',
    category: 'Food',
    percentage: 10,
    message: "You're overspending on Food. Reduce it by 10% to stay within your ₹5000 budget.",
    isPositive: false,
  },
  {
    id: '2',
    category: 'Transport',
    percentage: 25,
    message: "You're overspending on Transport. Reduce it by 25% to stay within your ₹2000 budget.",
    isPositive: false,
  },
  {
    id: '3',
    category: 'Overall',
    percentage: 0,
    message: "You did a fantastic job with your budget this month!",
    isPositive: true,
  },
];

const mockAnomalies: AnomalyAlert[] = [
  {
    id: '1',
    category: 'Shopping',
    description: 'Unusual spending on shopping detected',
    date: '2025-03-05',
    severity: 'medium',
    amount: 85.75,
    normalAmount: 40,
  },
  {
    id: '2',
    category: 'Entertainment',
    description: 'Subscription amount increased significantly',
    date: '2025-03-02',
    severity: 'low',
    amount: 12.99,
    normalAmount: 9.99,
  },
];

const budgetSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    fetchBudgetsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchBudgetsSuccess: (state, action: PayloadAction<Budget[]>) => {
      state.budgets = action.payload;
      state.loading = false;
    },
    fetchBudgetsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Local budget actions (these will be replaced with API calls)
    addBudget: (state, action: PayloadAction<Omit<Budget, 'id'>>) => {
      // This is now just a fallback - we should use createBudget thunk instead
      const newBudget = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.budgets.push(newBudget as Budget);
    },
    updateBudget: (state, action: PayloadAction<Budget>) => {
      const index = state.budgets.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.budgets[index] = action.payload;
      }
    },
    deleteBudget: (state, action: PayloadAction<string>) => {
      state.budgets = state.budgets.filter(b => b.id !== action.payload);
    },
    setRecommendations: (state, action: PayloadAction<BudgetRecommendation[]>) => {
      state.recommendations = action.payload;
    },
    setAnomalies: (state, action: PayloadAction<AnomalyAlert[]>) => {
      state.anomalies = action.payload;
    },
    // For development/demo only
    loadMockData: (state) => {
      state.budgets = mockBudgets;
      state.recommendations = mockRecommendations;
      state.anomalies = mockAnomalies;
    },
  },
  extraReducers: (builder) => {
    // Handle fetchBudgets
    builder.addCase(fetchBudgets.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBudgets.fulfilled, (state, action) => {
      state.loading = false;
      state.budgets = action.payload;
    });
    builder.addCase(fetchBudgets.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Handle createBudget
    builder.addCase(createBudget.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createBudget.fulfilled, (state, action) => {
      state.loading = false;
      state.budgets.push(action.payload);
    });
    builder.addCase(createBudget.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Handle editBudget
    builder.addCase(editBudget.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(editBudget.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.budgets.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.budgets[index] = action.payload;
      }
    });
    builder.addCase(editBudget.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Handle removeBudget
    builder.addCase(removeBudget.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(removeBudget.fulfilled, (state, action) => {
      state.loading = false;
      state.budgets = state.budgets.filter(b => b.id !== action.payload);
    });
    builder.addCase(removeBudget.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const {
  fetchBudgetsStart,
  fetchBudgetsSuccess,
  fetchBudgetsFailure,
  addBudget,
  updateBudget,
  deleteBudget,
  setRecommendations,
  setAnomalies,
  loadMockData
} = budgetSlice.actions;

export default budgetSlice.reducer;