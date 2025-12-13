import React from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <Loader2 className={clsx('animate-spin text-blue-600', sizeClasses[size])} />
      {text && (
        <span className="ml-2 text-sm text-gray-600">{text}</span>
      )}
    </div>
  );
};

export default LoadingSpinner;