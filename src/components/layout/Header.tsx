import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Menu, X, User, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import { RootState } from '../../store';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const menuVariants = {
    closed: {
      x: '-100%',
      transition: {
        type: 'tween',
        duration: 0.3,
      },
    },
    open: {
      x: 0,
      transition: {
        type: 'tween',
        duration: 0.3,
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 z-50 shadow-lg flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">ExpenseTrack</span>
              </Link>
              <button onClick={onClose}>
                <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-4">
              <Link
                to="/"
                className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={onClose}
              >
                Dashboard
              </Link>
              <Link
                to="/expenses"
                className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={onClose}
              >
                Expenses
              </Link>
              <Link
                to="/budget"
                className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={onClose}
              >
                Budget
              </Link>
              <Link
                to="/profile"
                className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={onClose}
              >
                Profile
              </Link>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const { anomalies } = useSelector((state: RootState) => state.budgets);
  
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex-1 flex justify-end md:justify-between items-center">
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              
              <div className="relative">
                <button className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Bell className="h-5 w-5" />
                  {anomalies.length > 0 && (
                    <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-error-600 ring-2 ring-white dark:ring-gray-800"></span>
                  )}
                </button>
              </div>
              
              <div className="flex items-center">
                <Link to="/profile" className="flex items-center space-x-2">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="User avatar"
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                  )}
                  <span className="hidden md:inline-block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.name || 'User'}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </header>
  );
};

export default Header;