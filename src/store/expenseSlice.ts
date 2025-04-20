import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { format } from 'date-fns';

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
  isRecurring: boolean;
}

interface ExpenseState {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  filters: {
    category: string | null;
    dateRange: { start: string | null; end: string | null };
    paymentMethod: string | null;
    search: string;
  };
}

const initialState: ExpenseState = {
  expenses: [],
  loading: false,
  error: null,
  filters: {
    category: null,
    dateRange: { start: null, end: null },
    paymentMethod: null,
    search: '',
  },
};

// Mock data for frontend demo
const mockExpenses: Expense[] = [
  {
    id: '1',
    userId: '1',
    amount: 52.30,
    category: 'Food',
    description: 'Grocery shopping',
    date: '2025-03-01',
    paymentMethod: 'Credit Card',
    isRecurring: false,
  },
  {
    id: '2',
    userId: '1',
    amount: 12.99,
    category: 'Entertainment',
    description: 'Movie subscription',
    date: '2025-03-02',
    paymentMethod: 'Debit Card',
    isRecurring: true,
  },
  {
    id: '3',
    userId: '1',
    amount: 45.00,
    category: 'Transport',
    description: 'Uber rides',
    date: '2025-03-03',
    paymentMethod: 'Mobile Wallet',
    isRecurring: false,
  },
  {
    id: '4',
    userId: '1',
    amount: 120.00,
    category: 'Utilities',
    description: 'Electricity bill',
    date: '2025-03-04',
    paymentMethod: 'Bank Transfer',
    isRecurring: true,
  },
  {
    id: '5',
    userId: '1',
    amount: 85.75,
    category: 'Shopping',
    description: 'New clothes',
    date: '2025-03-05',
    paymentMethod: 'Credit Card',
    isRecurring: false,
  },
  {
    id: '6',
    userId: '1',
    amount: 35.50,
    category: 'Food',
    description: 'Restaurant dinner',
    date: '2025-03-06',
    paymentMethod: 'Cash',
    isRecurring: false,
  },
  {
    id: '7',
    userId: '1',
    amount: 9.99,
    category: 'Entertainment',
    description: 'Music streaming',
    date: '2025-03-07',
    paymentMethod: 'Debit Card',
    isRecurring: true,
  }
];

const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    fetchExpensesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchExpensesSuccess: (state, action: PayloadAction<Expense[]>) => {
      state.expenses = action.payload;
      state.loading = false;
    },
    fetchExpensesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addExpense: (state, action: PayloadAction<Omit<Expense, 'id'>>) => {
      const newExpense = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.expenses.push(newExpense as Expense);
    },
    updateExpense: (state, action: PayloadAction<Expense>) => {
      const index = state.expenses.findIndex(e => e.id === action.payload.id);
      if (index !== -1) {
        state.expenses[index] = action.payload;
      }
    },
    deleteExpense: (state, action: PayloadAction<string>) => {
      state.expenses = state.expenses.filter(e => e.id !== action.payload);
    },
    setFilter: (state, action: PayloadAction<{ key: keyof ExpenseState['filters']; value: any }>) => {
      const { key, value } = action.payload;
      // @ts-ignore - We know these properties exist
      state.filters[key] = value;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    // For development/demo only
    loadMockData: (state) => {
      state.expenses = mockExpenses;
    },
  },
});

export const {
  addExpense,
  updateExpense,
  deleteExpense,
  setFilter,
  clearFilters,
  loadMockData
} = expenseSlice.actions;

export default expenseSlice.reducer;