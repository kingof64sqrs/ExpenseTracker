import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  prefix?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  icon,
  fullWidth = false,
  prefix,
  className = '',
  ...props
}) => {
  return (
    <div className={`input-group ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label htmlFor={props.id} className="input-label">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            {icon}
          </div>
        )}
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            {prefix}
          </div>
        )}
        <input
          className={`${icon || prefix ? 'pl-10' : ''} ${
            error ? 'border-error-500 focus:ring-error-500' : ''
          } ${fullWidth ? 'w-full' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-error-600">{error}</p>}
      {helper && !error && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helper}</p>}
    </div>
  );
};

export default Input;