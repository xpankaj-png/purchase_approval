import React from 'react';
import { CheckCircle, Clock, XCircle, AlertTriangle, Circle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StatusIndicatorProps {
  status: 'success' | 'pending' | 'error' | 'warning' | 'inactive';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  label?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  showIcon = true,
  label,
  className,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const statusConfig = {
    success: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      label: 'Success',
    },
    pending: {
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      label: 'Pending',
    },
    error: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      label: 'Error',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      label: 'Warning',
    },
    inactive: {
      icon: Circle,
      color: 'text-gray-400',
      bgColor: 'bg-gray-100',
      label: 'Inactive',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {showIcon && (
        <div className={cn(
          'rounded-full p-1',
          config.bgColor
        )}>
          <Icon className={cn(sizeClasses[size], config.color)} />
        </div>
      )}
      {label && (
        <span className={cn('text-sm font-medium', config.color)}>
          {label}
        </span>
      )}
    </div>
  );
};