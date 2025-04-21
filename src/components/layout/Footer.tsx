import React from 'react';
import { Github, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="py-4 px-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} ExpenseTracker. All rights reserved.
        </div>
        <div className="mt-2 md:mt-0 flex items-center space-x-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Developed by Krishna Paresh Raichura
          </span>
          <a 
            href="https://www.linkedin.com/in/krishna-raichura" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
            aria-label="LinkedIn Profile"
          >
            <Linkedin size={18} />
          </a>
          <a 
            href="https://github.com/kingof64sqrs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
            aria-label="GitHub Profile"
          >
            <Github size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
