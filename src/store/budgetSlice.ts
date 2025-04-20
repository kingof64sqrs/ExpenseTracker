import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  color: string;
}

export interface BudgetRecommendation {
  id: string;
  category: string;
  currentBudget: number;
  recommendedBudget: number;
  reason: string;
  impact: 'increase' | 'decrease' | 'maintain';
  confidence: number;
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
    currentBudget: 500,
    recommendedBudget: 450,
    reason: 'Based on your last 3 months of spending, you could reduce your food budget by $50.',
    impact: 'decrease',
    confidence: 0.85,
  },
  {
    id: '2',
    category: 'Transport',
    currentBudget: 200,
    recommendedBudget: 250,
    reason: 'Your transportation costs have increased by 25% in the last month.',
    impact: 'increase',
    confidence: 0.72,
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
    addBudget: (state, action: PayloadAction<Omit<Budget, 'id'>>) => {
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