import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
} = ({
  children,
  className,
  padding = 'md',
  shadow = 'md',
  hover = false,
  clickable = false,
  onClick,
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-lg border border-gray-200 transition-all duration-200',
        paddingClasses[padding],
        shadowClasses[shadow],
        {
          'hover:shadow-lg hover:border-gray-300': hover,
          'cursor-pointer': clickable,
        },
        className
      )}
      onClick={clickable}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className,
  title,
  subtitle,
  action,
}) => {
  return (
    <div className={clsx('mb-4', className)}>
      {title && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

const CardBody: React.FC<CardBodyProps> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => {
  return (
    <div className={clsx('mt-4 pt-4 border-t border-gray-200', className)}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;