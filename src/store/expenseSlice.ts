import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { detectAnomalies, AnomalyAlert } from '../utils/anomalyDetection';

// ✅ Set the Axios base URL if backend runs on a different port
axios.defaults.baseURL = 'http://localhost:5000'; // change to your backend port if needed

// ✅ Expense Interface
export interface Expense {
  _id: string;  // MongoDB uses _id
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
  isRecurring: boolean;
  isAnomaly: boolean;
  anomalyReason: string | null;
}

// ✅ State Interface
interface ExpenseState {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  anomalies: AnomalyAlert[];
  filters: {
    category: string | null;
    dateRange: { start: string | null; end: string | null };
    paymentMethod: string | null;
    search: string;
  };
}

// ✅ Initial State
const initialState: ExpenseState = {
  expenses: [],
  loading: false,
  error: null,
  anomalies: [],
  filters: {
    category: null,
    dateRange: { start: null, end: null },
    paymentMethod: null,
    search: '',
  },
};

// ✅ Async Thunks
export const fetchExpenses = createAsyncThunk(
  'expenses/fetchExpenses',
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No authentication token found');
      }

      const response = await axios.get(`/api/expenses/user/${userId}`, {
        headers: {
          'x-auth-token': token
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expenses');
    }
  }
);

export const addExpense = createAsyncThunk(
  'expenses/addExpense',
  async (expenseData: Omit<Expense, 'id' | 'userId'>, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No authentication token found');
      }

      const response = await axios.post('/api/expenses', expenseData, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });
      return response.data as Expense;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add expense');
    }
  }
);

export const updateExpense = createAsyncThunk(
  'expenses/updateExpense',
  async (expense: Expense, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No authentication token found');
      }

      const response = await axios.put(`/api/expenses/${expense._id}`, expense, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });
      return response.data as Expense;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update expense');
    }
  }
);

export const deleteExpense = createAsyncThunk(
  'expenses/deleteExpense',
  async (id: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No authentication token found');
      }

      // Validate the expense ID format (assuming MongoDB ObjectId)
      if (!id || typeof id !== 'string' || id.length !== 24) {
        return rejectWithValue('Invalid expense ID format');
      }

      const response = await axios.delete(`/api/expenses/${id}`, {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.status === 200) {
        return id;
      } else {
        return rejectWithValue('Failed to delete expense');
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue('Expense not found');
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to delete expense');
    }
  }
);

// ✅ Slice
const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<{ key: keyof ExpenseState['filters']; value: any }>) => {
      const { key, value } = action.payload;
      // @ts-ignore
      state.filters[key] = value;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    loadMockData: (state) => {
      state.expenses = [
        {
          _id: '1',
          userId: '1',
          amount: 52.3,
          category: 'Food',
          description: 'Grocery shopping',
          date: '2025-03-01',
          paymentMethod: 'Credit Card',
          isRecurring: false,
          isAnomaly: false,
          anomalyReason: null,
        },
        {
          _id: '2',
          userId: '1',
          amount: 12.99,
          category: 'Entertainment',
          description: 'Movie subscription',
          date: '2025-03-02',
          paymentMethod: 'Debit Card',
          isRecurring: true,
          isAnomaly: false,
          anomalyReason: null,
        },
        {
          _id: '3',
          userId: '1',
          amount: 150.0,
          category: 'Food',
          description: 'Expensive restaurant',
          date: '2025-03-03',
          paymentMethod: 'Credit Card',
          isRecurring: false,
          isAnomaly: true,
          anomalyReason: 'This expense is 187% higher than your average Food expense of $52.30',
        },
      ];
    },
    clearExpenses: (state) => {
      state.expenses = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.expenses = action.payload;
        // Detect anomalies whenever expenses are loaded
        state.anomalies = detectAnomalies(action.payload);
        state.loading = false;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Add
      .addCase(addExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addExpense.fulfilled, (state, action) => {
        state.expenses.push(action.payload);
        // Update anomalies when a new expense is added
        state.anomalies = detectAnomalies(state.expenses);
        state.loading = false;
      })
      .addCase(addExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update
      .addCase(updateExpense.fulfilled, (state, action) => {
        const index = state.expenses.findIndex(e => e._id === action.payload._id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
        // Update anomalies when an expense is updated
        state.anomalies = detectAnomalies(state.expenses);
      })
      .addCase(deleteExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter(expense => expense._id !== action.payload);
        state.loading = false;
        // Update anomalies after deletion
        state.anomalies = detectAnomalies(state.expenses);
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// ✅ Actions
export const {
  setFilter,
  clearFilters,
  loadMockData,
  clearExpenses,
} = expenseSlice.actions;

// ✅ Reducer
export default expenseSlice.reducer;

const handleDeleteExpense = async (id: string) => {
  try {
    // Validate ID before attempting deletion
    if (!id || typeof id !== 'string' || id.length !== 24) {
      throw new Error('Invalid expense ID format');
    }

    if (window.confirm('Are you sure you want to delete this expense?')) {
      const result = await dispatch(deleteExpense(id)).unwrap();
      
      if (result) {
        // Show success notification
        alert('Expense deleted successfully');
        
        // Refresh expenses list
        if (user?.id) {
          await dispatch(fetchExpenses(user.id));
        }
      }
    }
  } catch (error: any) {
    console.error('Failed to delete expense:', error);
    // Show user-friendly error message
    alert(
      error.message || 
      (typeof error === 'string' ? error : 'Failed to delete expense. Please try again.')
    );
  }
};
