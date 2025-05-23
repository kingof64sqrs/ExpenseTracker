import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { AnomalyAlert } from '../utils/anomalyDetection';
import { deleteExpense, updateExpense, addExpense, Expense, fetchExpenses } from '../store/expenseSlice';
import { AppDispatch } from '../store';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CreditCard, Filter, Search, Trash, Edit, Plus, X, AlertTriangle } from 'lucide-react';
import Input from '../components/common/Input';
import axios from 'axios';

const ExpenseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense;
  userId: string;
}> = ({ isOpen, onClose, expense, userId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const initialState = expense || {
    userId,
    amount: 0,
    category: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: '',
    isRecurring: false,
  };

  const [formData, setFormData] = useState(initialState);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Ensure amount is a number
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount.toString()),
        userId: user?.id
      };

      if (expense?._id) {
        // Update existing expense
        const response = await axios.put(`/api/expenses/${expense._id}`, expenseData);
        dispatch(updateExpense(response.data));
        // Fetch all expenses after update
        if (user?.id) {
          dispatch(fetchExpenses(user.id));
        }
      } else {
        // Add new expense
        const response = await axios.post('/api/expenses', expenseData);
        // Dispatch the addExpense action with the response data
        dispatch(addExpense(response.data));
        if (user?.id) {
          dispatch(fetchExpenses(user.id));
        }
      }
      onClose();
    } catch (error) {
      console.error('Failed to save expense:', error);
      alert('Failed to save expense. Please try again.');
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={overlayVariants}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <motion.div
          className="relative z-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
          variants={modalVariants}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {expense ? 'Edit Expense' : 'Add New Expense'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="input-group">
                <label htmlFor="amount" className="input-label">
                  Amount ({user?.currency || '$'})
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  className="w-full"
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="category" className="input-label">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                >
                  <option value="">Select a category</option>
                  {user?.preferredCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label htmlFor="description" className="input-label">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="date" className="input-label">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="paymentMethod" className="input-label">
                  Payment Method
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  required
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                >
                  <option value="">Select payment method</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Mobile Wallet">Mobile Wallet</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  name="isRecurring"
                  checked={formData.isRecurring}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isRecurring" className="input-label">
                  This is a recurring expense
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1">
                {expense ? 'Update' : 'Add'} Expense
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const ExpenseItem: React.FC<{
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  isAnomaly?: boolean;
  anomalyDetails?: AnomalyAlert;
}> = ({ expense, onEdit, onDelete, isAnomaly, anomalyDetails }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Use either the passed isAnomaly prop or the expense's own isAnomaly property
  const showAsAnomaly = isAnomaly || expense.isAnomaly;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className={`${showAsAnomaly ? 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'} rounded-lg shadow-sm border overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg bg-${getCategoryColor(expense.category)}-100 dark:bg-${getCategoryColor(expense.category)}-900`}>
              {getCategoryIcon(expense.category)}
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="font-medium text-gray-900 dark:text-white">{expense.description}</h3>
                {showAsAnomaly && (
                  <div className="ml-2 flex items-center">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-error-100 dark:bg-error-800 text-error-800 dark:text-error-200">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Anomaly
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{expense.category}</p>
              {showAsAnomaly && expense.anomalyReason && (
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
              <span className={`text-lg font-semibold ${isAnomaly ? 'text-error-600 dark:text-error-400' : 'text-gray-900 dark:text-white'}`}>
                {user?.currency || '$'}{expense.amount.toFixed(2)}
              </span>
              {isAnomaly && anomalyDetails && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  vs normal {user?.currency || '$'}{anomalyDetails.normalAmount.toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(expense)} // Pass the entire expense object
                className="p-1.5 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(expense._id)} // Use _id instead of id
                className="p-1.5 text-gray-500 hover:text-error-600 dark:text-gray-400 dark:hover:text-error-400"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Helper function to get category color
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Food: 'success',
    Transport: 'primary',
    Entertainment: 'warning',
    Utilities: 'error',
    Shopping: 'accent',
    Other: 'gray',
  };
  return colors[category] || 'gray';
}

// Helper function to get category icon
function getCategoryIcon(category: string) {
  switch (category) {
    case 'Food':
      return <span className="text-success-600 dark:text-success-400">🍔</span>;
    case 'Transport':
      return <span className="text-primary-600 dark:text-primary-400">🚗</span>;
    case 'Entertainment':
      return <span className="text-warning-600 dark:text-warning-400">🎬</span>;
    case 'Utilities':
      return <span className="text-error-600 dark:text-error-400">💡</span>;
    case 'Shopping':
      return <span className="text-accent-600 dark:text-accent-400">🛍️</span>;
    default:
      return <span className="text-gray-600 dark:text-gray-400">📝</span>;
  }
}

const Expenses: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { expenses, anomalies } = useSelector((state: RootState) => state.expenses);
  const { user } = useSelector((state: RootState) => state.auth);

  // Fetch expenses when component mounts and user is available
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchExpenses(user.id));
    }
  }, [dispatch, user?.id]); // Added user?.id as dependency
  
  const [modalOpen, setModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');
  
  const handleAddExpense = () => {
    setCurrentExpense(undefined);
    setModalOpen(true);
  };
  
  const handleEditExpense = (expense: Expense) => {
    try {
      // Validate the MongoDB ObjectId format
      if (!expense._id || typeof expense._id !== 'string' || expense._id.length !== 24) {
        throw new Error('Invalid expense ID format');
      }
  
      // Find the expense in the current state to verify it exists
      const expenseToEdit = expenses.find(exp => exp._id === expense._id);
      if (!expenseToEdit) {
        throw new Error('Expense not found');
      }
  
      setCurrentExpense(expenseToEdit);
      setModalOpen(true);
    } catch (error: any) {
      console.error('Failed to edit expense:', error);
      alert(error.message || 'Failed to edit expense. Please try again.');
    }
  };
  
  const handleDeleteExpense = async (id: string) => {
    try {
      // Validate the MongoDB ObjectId format (24 characters)
      if (!id || typeof id !== 'string' || id.length !== 24) {
        throw new Error('Invalid expense ID format');
      }
  
      // Find the expense in the current state to verify it exists
      const expenseToDelete = expenses.find(exp => exp._id === id);
      if (!expenseToDelete) {
        throw new Error('Expense not found');
      }
  
      if (window.confirm('Are you sure you want to delete this expense?')) {
        const result = await dispatch(deleteExpense(id)).unwrap();
        
        if (result) {
          alert('Expense deleted successfully');
          if (user?.id) {
            dispatch(fetchExpenses(user.id));
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to delete expense:', error);
      alert(error.message || 'Failed to delete expense. Please try again.');
    }
  };
  
  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentExpense(undefined);
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setDateFilter({ start: '', end: '' });
    setPaymentMethodFilter('');
  };
  
  // Count anomalies for display
  const anomalyCount = expenses.filter(exp => exp.isAnomaly).length;

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    // Search term filter
    if (
      searchTerm &&
      !expense.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !expense.category.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    
    // Category filter
    if (categoryFilter && expense.category !== categoryFilter) {
      return false;
    }
    
    // Date range filter
    if (dateFilter.start && new Date(expense.date) < new Date(dateFilter.start)) {
      return false;
    }
    if (dateFilter.end && new Date(expense.date) > new Date(dateFilter.end)) {
      return false;
    }
    
    // Payment method filter
    if (paymentMethodFilter && expense.paymentMethod !== paymentMethodFilter) {
      return false;
    }
    
    return true;
  });
  
  // Sort expenses to show anomalies first
  filteredExpenses.sort((a, b) => {
    // First sort by anomaly status (anomalies first)
    if (a.isAnomaly && !b.isAnomaly) return -1;
    if (!a.isAnomaly && b.isAnomaly) return 1;
    
    // Then sort by date (newest first)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  // Get unique payment methods
  const uniquePaymentMethods = Array.from(new Set(expenses.map((e) => e.paymentMethod)));
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Track and manage your expenses
          </p>
          {anomalyCount > 0 && (
            <div className="flex items-center mt-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-error-100 dark:bg-error-800 text-error-800 dark:text-error-200 rounded-full flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {anomalyCount} {anomalyCount === 1 ? 'anomaly' : 'anomalies'} detected
              </span>
            </div>
          )}
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={handleAddExpense}
        >
          Add Expense
        </Button>
      </div>
      
      <Card className="p-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative w-full md:w-64">
            <Input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              className="pl-10"
              fullWidth
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Filter className="h-4 w-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
              {(categoryFilter || dateFilter.start || dateFilter.end || paymentMethodFilter) && (
                <span className="ml-2 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100 text-xs px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </Button>
            {(categoryFilter || dateFilter.start || dateFilter.end || paymentMethodFilter) && (
              <Button variant="error" onClick={resetFilters} size="sm">
                Clear
              </Button>
            )}
          </div>
        </div>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <label className="input-label">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                  >
                    <option value="">All Categories</option>
                    {user?.preferredCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="input-label">Payment Method</label>
                  <select
                    value={paymentMethodFilter}
                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                  >
                    <option value="">All Payment Methods</option>
                    {uniquePaymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="input-label">From</label>
                    <input
                      type="date"
                      value={dateFilter.start}
                      onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="input-label">To</label>
                    <input
                      type="date"
                      value={dateFilter.end}
                      onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
      
      <div className="space-y-4">
        <AnimatePresence>
          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((expense) => {
              const anomaly = anomalies.find(a => a.id === `anomaly-${expense._id}`);
              const isAnomaly = !!anomaly;
              
              return (
                <ExpenseItem
                  key={expense._id} // Use _id as key
                  expense={expense}
                  onEdit={(exp) => handleEditExpense(exp)} // Pass the entire expense object
                  onDelete={() => handleDeleteExpense(expense._id)} // Use _id for deletion
                  isAnomaly={isAnomaly}
                  anomalyDetails={anomaly}
                />
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 text-center text-gray-500 dark:text-gray-400"
            >
              <p className="text-lg">No expenses found</p>
              <p className="mt-2">
                {expenses.length > 0
                  ? 'Try adjusting your filters'
                  : 'Add your first expense to get started'}
              </p>
              {expenses.length === 0 && (
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={handleAddExpense}
                >
                  Add First Expense
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <ExpenseModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        expense={currentExpense}
        userId={user?.id || ''}
      />
    </div>
  );
};

export default Expenses;