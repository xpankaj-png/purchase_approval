import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';

interface QuickStatsProps {
  stats: Array<{
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: React.ComponentType<any>;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  }>;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ stats }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  const getTrendIcon = (change?: number) => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    if (change < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = (change?: number) => {
    if (change === undefined) return 'text-gray-500';
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </p>
                {stat.change !== undefined && (
                  <div className={cn(
                    'flex items-center text-sm font-medium',
                    getTrendColor(stat.change)
                  )}>
                    {getTrendIcon(stat.change)}
                    <span className="ml-1">
                      {Math.abs(stat.change)}%
                    </span>
                    {stat.changeLabel && (
                      <span className="ml-1 text-gray-500">
                        {stat.changeLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className={cn(
                'p-3 rounded-lg',
                colorClasses[stat.color || 'blue']
              )}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};