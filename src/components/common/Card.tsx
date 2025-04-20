import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false,
  onClick
}) => {
  const baseClasses = `card ${className}`;
  
  if (hover) {
    return (
      <motion.div 
        className={baseClasses}
        whileHover={{ 
          scale: 1.02,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }
  
  return (
    <div className={baseClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;