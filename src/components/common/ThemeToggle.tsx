import { Moon, Sun } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../store/themeSlice';
import { RootState } from '../../store';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
  const dispatch = useDispatch();
  const { theme } = useSelector((state: RootState) => state.theme);

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => dispatch(toggleTheme())}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </motion.button>
  );
};

export default ThemeToggle;