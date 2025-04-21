import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { fetchUserProfile } from '../../store/authSlice';
import { fetchExpenses } from '../../store/expenseSlice';
import { fetchBudgets } from '../../store/budgetSlice';

const Layout: React.FC = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Load user profile data
  useEffect(() => {
    dispatch(fetchUserProfile() as any);
  }, [dispatch]);
  
  // Load user's expenses and budgets when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      dispatch(fetchExpenses(user.id) as any);
      dispatch(fetchBudgets(user.id) as any);
    }
  }, [dispatch, isAuthenticated, user?.id]);
  
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
        <Footer />
      </div>
    </div>
  );
};

export default Layout;