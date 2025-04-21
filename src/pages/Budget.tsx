import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { Link } from 'react-router-dom';
import { createBudget, editBudget, removeBudget, Budget as BudgetType } from '../store/budgetSlice';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreVertical, Edit, Trash, AlertTriangle, Check, X } from 'lucide-react';
import Input from '../components/common/Input';

const BudgetModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  budget?: BudgetType;
  userId: string;
}> = ({ isOpen, onClose, budget, userId }) => {
  const dispatch = useDispatch();
  const initialState = budget || {
    userId,
    category: '',
    amount: 0,
    period: 'monthly' as const,
    color: getRandomColor(),
  };

  const [formData, setFormData] = useState(initialState);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'amount' ? parseFloat(value) : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (budget) {
      dispatch(editBudget({ ...formData, id: budget.id } as BudgetType) as any);
    } else {
      dispatch(createBudget(formData) as any);
    }
    onClose();
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
              {budget ? 'Edit Budget' : 'Add New Budget'}
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
                <label htmlFor="amount" className="input-label">
                  Budget Amount ({user?.currency || '$'})
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
                <label htmlFor="period" className="input-label">
                  Period
                </label>
                <select
                  id="period"
                  name="period"
                  value={formData.period}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              
              <div className="input-group">
                <label htmlFor="color" className="input-label">
                  Color
                </label>
                <div className="flex space-x-2">
                  {['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map((color) => (
                    <div
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`h-8 w-8 rounded-full cursor-pointer transition-all duration-200 ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    ></div>
                  ))}
                </div>
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
                {budget ? 'Update' : 'Add'} Budget
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const BudgetCard: React.FC<{
  budget: BudgetType;
  spent: number;
  onEdit: (budget: BudgetType) => void;
  onDelete: (id: string) => void;
}> = ({ budget, spent, onEdit, onDelete }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const percentage = Math.min(100, Math.round((spent / budget.amount) * 100));
  
  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-error-500';
    if (percent >= 80) return 'bg-warning-500';
    return 'bg-success-500';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
    >
      <Card className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <span
                className="inline-block w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: budget.color }}
              ></span>
              {budget.category}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} Budget
            </p>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit(budget)}
              className="p-1.5 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(budget.id)}
              className="p-1.5 text-gray-500 hover:text-error-600 dark:text-gray-400 dark:hover:text-error-400"
            >
              <Trash className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.currency || '$'}{spent.toFixed(2)} of {user?.currency || '$'}{budget.amount.toFixed(2)}
            </span>
            <span
              className={`text-sm font-medium ${
                percentage >= 100
                  ? 'text-error-600 dark:text-error-400'
                  : percentage >= 80
                  ? 'text-warning-600 dark:text-warning-400'
                  : 'text-success-600 dark:text-success-400'
              }`}
            >
              {percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-2.5 rounded-full ${getProgressColor(percentage)}`}
            ></motion.div>
          </div>
        </div>
        
        {percentage >= 100 && (
          <div className="mt-3 flex items-start space-x-2 text-error-600 dark:text-error-400">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <span className="text-sm">Budget exceeded</span>
          </div>
        )}
        {percentage >= 80 && percentage < 100 && (
          <div className="mt-3 flex items-start space-x-2 text-warning-600 dark:text-warning-400">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <span className="text-sm">Approaching budget limit</span>
          </div>
        )}
        {percentage < 80 && (
          <div className="mt-3 flex items-start space-x-2 text-success-600 dark:text-success-400">
            <Check className="h-4 w-4 mt-0.5" />
            <span className="text-sm">On track</span>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

// Helper function to get a random color
function getRandomColor() {
  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  return colors[Math.floor(Math.random() * colors.length)];
}

const Budget: React.FC = () => {
  const dispatch = useDispatch();
  const { budgets } = useSelector((state: RootState) => state.budgets);
  const { anomalies } = useSelector((state: RootState) => state.expenses);
  const { expenses } = useSelector((state: RootState) => state.expenses);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [currentBudget, setCurrentBudget] = useState<BudgetType | undefined>(undefined);
  
  const handleAddBudget = () => {
    setCurrentBudget(undefined);
    setModalOpen(true);
  };
  
  const handleEditBudget = (budget: BudgetType) => {
    setCurrentBudget(budget);
    setModalOpen(true);
  };
  
  const handleDeleteBudget = (id: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      dispatch(removeBudget(id) as any);
    }
  };
  
  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentBudget(undefined);
  };
  
  // Calculate spending by category
  const spendingByCategory = expenses.reduce((acc: Record<string, number>, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += expense.amount;
    return acc;
  }, {});
  
  // Total budget amount
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  
  // Total spent
  const totalSpent = Object.values(spendingByCategory).reduce((sum, amount) => sum + (amount as number), 0);
  
  // Budget progress percentage
  const totalPercentage = Math.min(100, Math.round((totalSpent / totalBudget) * 100) || 0);
  
  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-error-500';
    if (percent >= 80) return 'bg-warning-500';
    return 'bg-success-500';
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budget</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Set and manage your budget limits
          </p>
          {anomalies.length > 0 && (
            <Link to="/dashboard" className="flex items-center mt-2 text-error-600 dark:text-error-400 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 mr-1" />
              {anomalies.length} {anomalies.length === 1 ? 'anomaly' : 'anomalies'} detected
            </Link>
          )}
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={handleAddBudget}
        >
          Add Budget
        </Button>
      </div>
      
      {budgets.length > 0 && (
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Overall Budget</h2>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.currency || '$'}{totalSpent.toFixed(2)} of {user?.currency || '$'}{totalBudget.toFixed(2)}
            </span>
            <span
              className={`text-sm font-medium ${
                totalPercentage >= 100
                  ? 'text-error-600 dark:text-error-400'
                  : totalPercentage >= 80
                  ? 'text-warning-600 dark:text-warning-400'
                  : 'text-success-600 dark:text-success-400'
              }`}
            >
              {totalPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-2.5 rounded-full ${getProgressColor(totalPercentage)}`}
            ></motion.div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {totalPercentage >= 100 ? (
              <div className="flex items-center text-error-600 dark:text-error-400">
                <AlertTriangle className="h-4 w-4 mr-2" />
                You have exceeded your total budget limit.
              </div>
            ) : totalPercentage >= 80 ? (
              <div className="flex items-center text-warning-600 dark:text-warning-400">
                <AlertTriangle className="h-4 w-4 mr-2" />
                You are approaching your total budget limit.
              </div>
            ) : (
              <div className="flex items-center text-success-600 dark:text-success-400">
                <Check className="h-4 w-4 mr-2" />
                You are within your budget limits.
              </div>
            )}
          </div>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            spent={spendingByCategory[budget.category] || 0}
            onEdit={handleEditBudget}
            onDelete={handleDeleteBudget}
          />
        ))}
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden"
        >
          <Card
            className="p-5 border-dashed border-2 flex flex-col items-center justify-center h-full min-h-[200px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-300"
            onClick={handleAddBudget}
            hover
          >
            <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
              <Plus className="h-10 w-10 mb-4" />
              <p className="text-center">Add a new budget category</p>
            </div>
          </Card>
        </motion.div>
      </div>
      
      <BudgetModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        budget={currentBudget}
        userId={user?.id || ''}
      />
    </div>
  );
};

export default Budget;