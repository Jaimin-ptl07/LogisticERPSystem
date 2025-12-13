import React from 'react';
import clsx from 'clsx';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

const Input: React.FC<InputProps> = ({
  className,
  containerClassName,
  label,
  error,
  helperText,
  required = false,
  leftIcon,
  rightIcon,
  type = 'text',
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{leftIcon}</span>
          </div>
        )}

        <input
          type={inputType}
          className={clsx(
            'block w-full rounded-lg border transition-colors duration-200',
            {
              'pl-10': leftIcon,
              'pr-10': rightIcon || (isPassword && type === 'password'),
              'pl-4': !leftIcon,
              'pr-4': !rightIcon && !(isPassword && type === 'password'),
            },
            {
              'border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500': error,
              'border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500': !error && !isFocused,
              'border-blue-500 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500': !error && isFocused,
            },
            'shadow-sm focus:outline-none',
            className
          )}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />

        {(rightIcon || isPassword) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isPassword ? (
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            ) : (
              <span className="text-gray-400">{rightIcon}</span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-1 flex items-center text-sm text-red-600">
          <AlertCircle size={16} className="mr-1" />
          {error}
        </div>
      )}

      {!error && helperText && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;