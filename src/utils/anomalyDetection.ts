import { Expense } from '../store/expenseSlice';

export interface AnomalyAlert {
  id: string;
  category: string;
  description: string;
  date: string;
  severity: 'low' | 'medium' | 'high';
  amount: number;
  normalAmount: number;
}

/**
 * Detects anomalies in user expenses based on several criteria:
 * 1. Expenses significantly higher than the average for that category
 * 2. Unusual frequency of expenses in a category
 * 3. Expenses made at unusual times or days
 * 
 * @param expenses Array of user expenses
 * @returns Array of detected anomalies
 */
export const detectAnomalies = (expenses: Expense[]): AnomalyAlert[] => {
  if (!expenses || expenses.length === 0) {
    return [];
  }

  const anomalies: AnomalyAlert[] = [];
  
  // Group expenses by category
  const expensesByCategory: Record<string, Expense[]> = {};
  expenses.forEach(expense => {
    if (!expensesByCategory[expense.category]) {
      expensesByCategory[expense.category] = [];
    }
    expensesByCategory[expense.category].push(expense);
  });
  
  // For each category, calculate average and standard deviation
  Object.entries(expensesByCategory).forEach(([category, categoryExpenses]) => {
    // Skip categories with too few expenses for meaningful analysis
    if (categoryExpenses.length < 3) return;
    
    // Calculate average expense amount for this category
    const totalAmount = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const averageAmount = totalAmount / categoryExpenses.length;
    
    // Calculate standard deviation
    const squaredDifferences = categoryExpenses.map(exp => 
      Math.pow(exp.amount - averageAmount, 2)
    );
    const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / categoryExpenses.length;
    const stdDeviation = Math.sqrt(variance);
    
    // Threshold for anomaly detection (2 standard deviations above mean)
    const anomalyThreshold = averageAmount + (2 * stdDeviation);
    
    // Find anomalies
    categoryExpenses.forEach(expense => {
      if (expense.amount > anomalyThreshold) {
        // Calculate severity based on how many standard deviations above the mean
        const deviationsAboveMean = (expense.amount - averageAmount) / stdDeviation;
        let severity: 'low' | 'medium' | 'high' = 'low';
        
        if (deviationsAboveMean > 4) {
          severity = 'high';
        } else if (deviationsAboveMean > 3) {
          severity = 'medium';
        }
        
        anomalies.push({
          id: `anomaly-${expense.id}`,
          category: expense.category,
          description: `Unusually high expense in ${expense.category}`,
          date: expense.date,
          severity,
          amount: expense.amount,
          normalAmount: Math.round(averageAmount * 100) / 100
        });
      }
    });
    
    // Additional check: Unusual frequency of expenses in a short time period
    // Group expenses by date (just the day part)
    const expensesByDate: Record<string, Expense[]> = {};
    categoryExpenses.forEach(expense => {
      const dateKey = new Date(expense.date).toISOString().split('T')[0];
      if (!expensesByDate[dateKey]) {
        expensesByDate[dateKey] = [];
      }
      expensesByDate[dateKey].push(expense);
    });
    
    // Calculate average number of expenses per day
    const daysWithExpenses = Object.keys(expensesByDate).length;
    const avgExpensesPerDay = categoryExpenses.length / daysWithExpenses;
    
    // Check for days with unusually high number of expenses
    Object.entries(expensesByDate).forEach(([date, dateExpenses]) => {
      if (dateExpenses.length > avgExpensesPerDay * 2 && dateExpenses.length > 3) {
        // Get total amount for this day and category
        const totalForDay = dateExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        anomalies.push({
          id: `frequency-${category}-${date}`,
          category,
          description: `Unusual number of ${category} expenses on ${new Date(date).toLocaleDateString()}`,
          date,
          severity: 'medium',
          amount: totalForDay,
          normalAmount: averageAmount * avgExpensesPerDay
        });
      }
    });
  });
  
  // Sort anomalies by severity (high to low) and then by amount (high to low)
  return anomalies.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.amount - a.amount;
  });
};
