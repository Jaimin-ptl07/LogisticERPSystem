import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 active:bg-gray-300',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 active:bg-gray-100',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        {
          'w-full': fullWidth,
          'opacity-50': loading,
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2
          className={clsx(
            'animate-spin',
            iconPosition === 'right' ? 'mr-2' : 'ml-2'
          )}
          size={iconSize[size]}
        />
      )}

      {icon && !loading && iconPosition === 'left' && (
        <span className="mr-2" style={{ fontSize: iconSize[size] }}>
          {icon}
        </span>
      )}

      {children}

      {icon && !loading && iconPosition === 'right' && (
        <span className="ml-2" style={{ fontSize: iconSize[size] }}>
          {icon}
        </span>
      )}
    </button>
  );
};

export default Button;