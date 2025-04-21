import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { format, subDays } from 'date-fns';
import { AlertTriangle, ArrowUpRight, Banknote, TrendingDown, TrendingUp, Wallet, RefreshCw } from 'lucide-react';
import { getAIRecommendations } from '../api/aiRecommendationService';
import { setRecommendations } from '../store/budgetSlice';
import Card from '../components/common/Card';
import { motion } from 'framer-motion';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { expenses } = useSelector((state: RootState) => state.expenses);
  const { budgets, recommendations } = useSelector((state: RootState) => state.budgets);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // Count anomalies from the backend data
  const anomalyCount = expenses.filter(exp => exp.isAnomaly).length;
  
  // Fetch AI recommendations from Flask API
  useEffect(() => {
    const fetchAIRecommendations = async () => {
      try {
        setLoadingRecommendations(true);
        setAiError(null);
        
        // Get recommendations with improved error handling
        const aiRecommendations = await getAIRecommendations();
        
        if (aiRecommendations.length > 0) {
          dispatch(setRecommendations(aiRecommendations));
        } else {
          // If no recommendations were returned but no error was thrown,
          // we'll set a more specific error message
          setAiError('No recommendations available from the AI service');
        }
      } catch (error) {
        console.error('Error fetching AI recommendations:', error);
        setAiError('Failed to connect to the AI recommendation service');
      } finally {
        setLoadingRecommendations(false);
      }
    };
    
    // Initial fetch
    fetchAIRecommendations();
    
    // Refresh recommendations every 30 seconds
    const intervalId = setInterval(fetchAIRecommendations, 30000);
    
    return () => clearInterval(intervalId);
  }, [dispatch]);
  
  // Function to manually refresh recommendations
  const handleRefreshRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      setAiError(null);
      const aiRecommendations = await getAIRecommendations();
      
      if (aiRecommendations.length > 0) {
        dispatch(setRecommendations(aiRecommendations));
      }
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      setAiError('Failed to fetch AI recommendations');
    } finally {
      setLoadingRecommendations(false);
    }
  };
  
  // Calculate total spent this month
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate total budget
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  
  // Calculate savings rate (if budget > 0)
  const savingsRate = totalBudget > 0 ? Math.max(0, Math.min(100, Math.round(((totalBudget - totalSpent) / totalBudget) * 100))) : 0;
  
  // Determine if savings rate has increased or decreased (for demo purposes)
  // In a real app, this would compare with previous period data
  const savingsRateChange = Math.round((Math.random() * 10) - 5); // Random number between -5 and 5
  
  // Calculate spending by category for pie chart
  const spendingByCategory = expenses.reduce((acc: Record<string, number>, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += expense.amount;
    return acc;
  }, {});
  
  // Generate last 7 days for the chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return format(date, 'MMM dd');
  });
  
  // Generate spending data for the last 7 days based on actual expenses
  const dailySpending = last7Days.map((day) => {
    // Convert day string back to date for comparison
    const dayDate = new Date(day + ', ' + new Date().getFullYear());
    const dayStart = new Date(dayDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(dayDate.setHours(23, 59, 59, 999));
    
    // Filter expenses for this day
    const dayExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= dayStart && expenseDate <= dayEnd;
    });
    
    // Sum expenses for this day
    const dayTotal = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    return dayTotal.toFixed(2);
  });
  
  // Chart data for spending trend
  const spendingTrendData = {
    labels: last7Days,
    datasets: [
      {
        label: 'Daily Spending',
        data: dailySpending,
        fill: 'start',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 1)',
        tension: 0.4,
      },
    ],
  };
  
  // Get currency symbol from user settings
  const currencySymbol = user?.currency || '$';
  
  // Chart options for spending trend
  const spendingTrendOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${currencySymbol}${context.raw}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value: any) {
            return `${currencySymbol}${value}`;
          }
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    },
  };
  
  // Chart data for category distribution
  const categoryData = {
    labels: Object.keys(spendingByCategory),
    datasets: [
      {
        data: Object.values(spendingByCategory),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const categoryOptions = {
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${currencySymbol}${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    },
  };

  // Animation variants for the cards
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Welcome back, {user?.name}! Here's an overview of your finances.
        </p>
      </div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}>
          <Card className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Spent</p>
                <h3 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {user?.currency || '$'}{totalSpent.toFixed(2)}
                </h3>
                <p className="mt-1 text-sm text-success-600 dark:text-success-400 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>8% from last month</span>
                </p>
              </div>
              <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full">
                <Wallet className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Budget Left</p>
                <h3 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {user?.currency || '$'}{(totalBudget - totalSpent).toFixed(2)}
                </h3>
                <p className="mt-1 text-sm text-warning-600 dark:text-warning-400 flex items-center">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  <span>{totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% used</span>
                </p>
              </div>
              <div className="p-3 bg-warning-100 dark:bg-warning-900 rounded-full">
                <Banknote className="w-6 h-6 text-warning-600 dark:text-warning-400" />
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Savings Rate</p>
                <h3 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {savingsRate}%
                </h3>
                <p className={`mt-1 text-sm ${savingsRateChange >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'} flex items-center`}>
                  {savingsRateChange >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  <span>{Math.abs(savingsRateChange)}% {savingsRateChange >= 0 ? 'increase' : 'decrease'}</span>
                </p>
              </div>
              <div className="p-3 bg-success-100 dark:bg-success-900 rounded-full">
                <TrendingUp className="w-6 h-6 text-success-600 dark:text-success-400" />
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Anomalies</p>
                <h3 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {anomalyCount}
                </h3>
                <p className="mt-1 text-sm text-error-600 dark:text-error-400 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  <span>{anomalyCount > 0 ? 'Unusual expenses detected' : 'No anomalies detected'}</span>
                </p>
              </div>
              <div className="p-3 bg-error-100 dark:bg-error-900 rounded-full">
                <AlertTriangle className="w-6 h-6 text-error-600 dark:text-error-400" />
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Spending Trend</h3>
            <div className="h-64">
              <Line data={spendingTrendData} options={spendingTrendOptions} />
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Distribution</h3>
            <div className="h-64 flex items-center justify-center">
              <Doughnut data={categoryData} options={categoryOptions} />
            </div>
          </Card>
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Budget Recommendations</h3>
              <div className="flex items-center space-x-2">
                <span className="badge-primary">AI Powered</span>
                <button 
                  onClick={handleRefreshRecommendations} 
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  disabled={loadingRecommendations}
                  title="Refresh recommendations"
                >
                  <RefreshCw 
                    className={`h-4 w-4 text-gray-500 dark:text-gray-400 ${loadingRecommendations ? 'animate-spin' : ''}`} 
                  />
                </button>
              </div>
            </div>
            {loadingRecommendations && recommendations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-8 w-8 mb-4 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-4 w-48 mb-2 rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <p className="mt-4">Loading AI recommendations...</p>
              </div>
            ) : aiError ? (
              <div className="text-center py-8 text-error-500 dark:text-error-400">
                <p>{aiError}</p>
                <button 
                  onClick={handleRefreshRecommendations}
                  className="mt-4 px-4 py-2 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : recommendations.length > 0 ? (
              <ul className="space-y-3">
                {recommendations.map((rec) => (
                  <li key={rec.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex justify-between">
                      <span className="font-medium">{rec.category}</span>
                      <div className="flex items-center space-x-1">
                        <span 
                          className={`${
                            rec.impact === 'increase' 
                              ? 'text-error-600 dark:text-error-400' 
                              : rec.impact === 'decrease' 
                                ? 'text-success-600 dark:text-success-400' 
                                : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {rec.impact === 'increase' 
                            ? '+' 
                            : rec.impact === 'decrease' 
                              ? '-' 
                              : ''}
                          ${Math.abs(rec.recommendedBudget - rec.currentBudget).toFixed(2)}
                        </span>
                        {rec.impact === 'increase' ? (
                          <TrendingUp className="w-4 h-4 text-error-600 dark:text-error-400" />
                        ) : rec.impact === 'decrease' ? (
                          <TrendingDown className="w-4 h-4 text-success-600 dark:text-success-400" />
                        ) : null}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.reason}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <div className="flex space-x-2 text-xs">
                        <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                          Current: ${rec.currentBudget}
                        </span>
                        <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100 rounded-full">
                          Recommended: ${rec.recommendedBudget}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {(rec.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No recommendations available at this time</p>
                <button 
                  onClick={handleRefreshRecommendations}
                  className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Check for Recommendations
                </button>
              </div>
            )}
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Unusual Spending Alerts</h3>
              <span className="px-2 py-1 text-xs font-medium bg-error-100 dark:bg-error-800 text-error-800 dark:text-error-200 rounded-full">
                {anomalyCount} {anomalyCount === 1 ? 'Alert' : 'Alerts'}
              </span>
            </div>
            {anomalyCount > 0 ? (
              <ul className="space-y-3">
                {expenses.filter(exp => exp.isAnomaly).map((expense) => (
                  <li key={expense.id} className="p-3 bg-error-50 dark:bg-error-900/20 rounded-lg border border-error-200 dark:border-error-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{expense.category}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{expense.description}</p>
                        <p className="text-xs text-error-600 dark:text-error-400 mt-1">{expense.anomalyReason}</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-error-100 dark:bg-error-800 text-error-800 dark:text-error-200 rounded-full">
                        {user?.currency || '$'}{expense.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{expense.date}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No anomalies detected</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;