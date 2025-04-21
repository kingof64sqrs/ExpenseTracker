import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  CreditCard, 
  PieChart, 
  User,
  LogOut,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label, active }) => {
  return (
    <Link to={to}>
      <motion.div
        whileHover={{ x: 5 }}
        className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
          active 
            ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100 font-medium' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <div className={active ? 'text-primary-600 dark:text-primary-400' : ''}>{icon}</div>
        <span>{label}</span>
      </motion.div>
    </Link>
  );
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  
  const handleLogout = () => {
    dispatch(logout());
  };
  
  return (
    <aside className="w-64 hidden md:flex flex-col h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-5">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">ExpenseTrack</h1>
        </div>
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-1">
        <SidebarLink
          to="/"
          icon={<Home size={20} />}
          label="Dashboard"
          active={location.pathname === '/'}
        />
        <SidebarLink
          to="/expenses"
          icon={<CreditCard size={20} />}
          label="Expenses"
          active={location.pathname === '/expenses'}
        />
        <SidebarLink
          to="/budget"
          icon={<PieChart size={20} />}
          label="Budget"
          active={location.pathname === '/budget'}
        />
        <SidebarLink
          to="/anomalies"
          icon={<AlertTriangle size={20} />}
          label="Anomalies"
          active={location.pathname === '/anomalies'}
        />
        <SidebarLink
          to="/profile"
          icon={<User size={20} />}
          label="Profile"
          active={location.pathname === '/profile'}
        />
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;