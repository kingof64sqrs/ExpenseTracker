import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Budget from './pages/Budget';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import { RootState } from './store';
import { setTheme } from './store/themeSlice';

function App() {
  const dispatch = useDispatch();
  const { theme } = useSelector((state: RootState) => state.theme);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Apply theme class to the document body
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  // Check for saved theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    dispatch(setTheme(savedTheme as 'light' | 'dark'));
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/signup" element={isAuthenticated ? <Navigate to="/" /> : <Signup />} />
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={isAuthenticated ? <Dashboard /> : <Login />} />
          <Route path="expenses" element={isAuthenticated ? <Expenses /> : <Login />} />
          <Route path="budget" element={isAuthenticated ? <Budget /> : <Login />} />
          <Route path="profile" element={isAuthenticated ? <Profile /> : <Login />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;