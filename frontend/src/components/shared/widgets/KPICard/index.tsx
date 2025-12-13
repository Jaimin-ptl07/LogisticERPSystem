import React from 'react';
import Card from '@/components/shared/ui/Card';
import clsx from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  subtitle?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  color = 'blue',
  subtitle,
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      icon: 'text-blue-600',
      changePositive: 'text-blue-600',
      changeNegative: 'text-blue-600',
    },
    green: {
      bg: 'bg-green-100',
      icon: 'text-green-600',
      changePositive: 'text-green-600',
      changeNegative: 'text-red-600',
    },
    yellow: {
      bg: 'bg-yellow-100',
      icon: 'text-yellow-600',
      changePositive: 'text-yellow-600',
      changeNegative: 'text-red-600',
    },
    purple: {
      bg: 'bg-purple-100',
      icon: 'text-purple-600',
      changePositive: 'text-purple-600',
      changeNegative: 'text-red-600',
    },
    red: {
      bg: 'bg-red-100',
      icon: 'text-red-600',
      changePositive: 'text-red-600',
      changeNegative: 'text-red-600',
    },
  };

  const currentColor = colorClasses[color];

  return (
    <Card padding="md" hover className="h-full">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {changeType !== 'neutral' && (
                <>
                  {changeType === 'increase' ? (
                    <TrendingUp
                      size={16}
                      className={clsx('mr-1', currentColor.changePositive)}
                    />
                  ) : (
                    <TrendingDown
                      size={16}
                      className={clsx('mr-1', currentColor.changeNegative)}
                    />
                  )}
                </>
              )}
              <span
                className={clsx(
                  'text-sm font-medium',
                  {
                    [currentColor.changePositive]: changeType === 'increase',
                    [currentColor.changeNegative]: changeType === 'decrease',
                    'text-gray-500': changeType === 'neutral',
                  }
                )}
              >
                {change > 0 && '+'}
                {change}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last period</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={clsx('p-3 rounded-full', currentColor.bg)}>
            <div className={currentColor.icon}>{icon}</div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default KPICard;