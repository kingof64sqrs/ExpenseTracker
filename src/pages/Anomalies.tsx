import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { getAnomalies, getAnomalyStats } from '../api/anomalyService';
import { Expense } from '../store/expenseSlice';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Calendar, CreditCard, PieChart, DollarSign } from 'lucide-react';
import Input from '../components/common/Input';

// Interface for anomaly statistics
interface AnomalyStats {
  totalAnomalies: number;
  totalAnomalyAmount: number;
  anomaliesByCategory: {
    _id: string;
    count: number;
    totalAmount: number;
  }[];
}

const AnomalyItem: React.FC<{
  expense: Expense;
}> = ({ expense }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className="bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800 rounded-lg shadow-sm border overflow-hidden"
    >
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-error-100 dark:bg-error-900">
              <AlertTriangle className="w-6 h-6 text-error-600 dark:text-error-400" />
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="font-medium text-gray-900 dark:text-white">{expense.description}</h3>
                <div className="ml-2 flex items-center">
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-error-100 dark:bg-error-800 text-error-800 dark:text-error-200">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    Anomaly
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{expense.category}</p>
              {expense.anomalyReason && (
                <p className="text-xs text-error-600 dark:text-error-400 mt-1">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  {expense.anomalyReason}
                </p>
              )}
              <div className="flex items-center mt-1 space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {expense.date}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <CreditCard className="h-3 w-3 mr-1" />
                  {expense.paymentMethod}
                </span>
                {expense.isRecurring && (
                  <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100 text-xs px-2 py-0.5 rounded-full">
                    Recurring
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto mt-4 sm:mt-0">
            <div className="flex flex-col items-end mr-4">
              <span className="text-lg font-semibold text-error-600 dark:text-error-400">
                {user?.currency || '$'}{expense.amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Anomalies: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [anomalies, setAnomalies] = useState<Expense[]>([]);
  const [stats, setStats] = useState<AnomalyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAnomalies = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch anomalies and stats in parallel
        const [anomaliesData, statsData] = await Promise.all([
          getAnomalies(user.id),
          getAnomalyStats(user.id)
        ]);
        
        setAnomalies(anomaliesData);
        setStats(statsData);
      } catch (err: any) {
        console.error('Error fetching anomalies:', err);
        setError(err.message || 'Failed to fetch anomalies');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnomalies();
  }, [user?.id]);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expense Anomalies</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Unusual spending patterns that may require your attention
        </p>
        {stats && (
          <div className="flex items-center mt-2">
            <span className="px-2 py-1 text-xs font-medium bg-error-100 dark:bg-error-800 text-error-800 dark:text-error-200 rounded-full flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {stats.totalAnomalies} {stats.totalAnomalies === 1 ? 'anomaly' : 'anomalies'} detected
            </span>
          </div>
        )}
      </div>
      
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Anomalies</p>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{stats.totalAnomalies}</h3>
              </div>
              <div className="p-3 bg-error-100 dark:bg-error-900 rounded-full">
                <AlertTriangle className="w-5 h-5 text-error-600 dark:text-error-400" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {user?.currency || '$'}{stats.totalAnomalyAmount.toFixed(2)}
                </h3>
              </div>
              <div className="p-3 bg-error-100 dark:bg-error-900 rounded-full">
                <DollarSign className="w-5 h-5 text-error-600 dark:text-error-400" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Top Category</p>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {stats.anomaliesByCategory.length > 0 ? stats.anomaliesByCategory[0]._id : 'None'}
                </h3>
              </div>
              <div className="p-3 bg-error-100 dark:bg-error-900 rounded-full">
                <PieChart className="w-5 h-5 text-error-600 dark:text-error-400" />
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Anomaly List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Anomalous Expenses</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Loading anomalies...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-error-600 dark:text-error-400">{error}</p>
            <Button 
              variant="primary" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        ) : anomalies.length > 0 ? (
          <AnimatePresence>
            {anomalies.map((anomaly) => (
              <AnomalyItem key={anomaly.id} expense={anomaly} />
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <AlertTriangle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-lg text-gray-700 dark:text-gray-300">No anomalies detected</p>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Great job! Your spending appears to be within normal ranges.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Anomalies;
