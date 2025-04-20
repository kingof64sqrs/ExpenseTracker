import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Sidebar from './Sidebar';
import Header from './Header';
import { autoLogin } from '../../store/authSlice';
import { loadMockData as loadExpenseMockData } from '../../store/expenseSlice';
import { loadMockData as loadBudgetMockData } from '../../store/budgetSlice';

const Layout: React.FC = () => {
  const dispatch = useDispatch();
  
  // Auto login and load mock data for demonstration purposes
  useEffect(() => {
    dispatch(autoLogin());
    dispatch(loadExpenseMockData());
    dispatch(loadBudgetMockData());
  }, [dispatch]);
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <Header />
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50 dark:bg-gray-900">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;