import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { format, subDays } from 'date-fns';
import { AlertTriangle, ArrowUpRight, Banknote, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
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
  const { expenses } = useSelector((state: RootState) => state.expenses);
  const { budgets, recommendations, anomalies } = useSelector((state: RootState) => state.budgets);
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Calculate total spent this month
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate total budget
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  
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
  
  // Generate spending data for the last 7 days
  const dailySpending = last7Days.map((day, index) => {
    // This is just for the demo - normally would filter expenses by date
    return (Math.random() * 100 + 20).toFixed(2);
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
            return `$${context.raw}`;
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
            return `$${value}`;
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
            return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
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
                  <span>12% decrease</span>
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
                  28%
                </h3>
                <p className="mt-1 text-sm text-success-600 dark:text-success-400 flex items-center">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  <span>4% increase</span>
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
                  {anomalies.length}
                </h3>
                <p className="mt-1 text-sm text-error-600 dark:text-error-400 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  <span>New alerts</span>
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
              <span className="badge-primary">AI Powered</span>
            </div>
            {recommendations.length > 0 ? (
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
              <span className="badge-error">Alerts</span>
            </div>
            {anomalies.length > 0 ? (
              <ul className="space-y-3">
                {anomalies.map((anomaly) => (
                  <li key={anomaly.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-error-500">
                    <div className="flex justify-between">
                      <span className="font-medium">{anomaly.category}</span>
                      <span className={`text-${anomaly.severity === 'high' ? 'error' : anomaly.severity === 'medium' ? 'warning' : 'gray'}-600 dark:text-${anomaly.severity === 'high' ? 'error' : anomaly.severity === 'medium' ? 'warning' : 'gray'}-400 text-sm font-medium`}>
                        {anomaly.severity.charAt(0).toUpperCase() + anomaly.severity.slice(1)} severity
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{anomaly.description}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <div className="flex items-center space-x-1">
                        <span className="text-error-600 dark:text-error-400 font-medium">
                          ${anomaly.amount.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          vs normal ${anomaly.normalAmount.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {anomaly.date}
                      </span>
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