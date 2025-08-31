import React from 'react';
import { DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatters';

interface BudgetData {
  department: string;
  allocated: number;
  spent: number;
  pending: number;
  category: string;
}

interface BudgetTrackerProps {
  budgets: BudgetData[];
  title?: string;
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({ 
  budgets, 
  title = "Budget Utilization" 
}) => {
  const totalAllocated = budgets.reduce((sum, budget) => sum + budget.allocated, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalPending = budgets.reduce((sum, budget) => sum + budget.pending, 0);
  const totalUtilization = ((totalSpent + totalPending) / totalAllocated) * 100;

  const getBudgetStatus = (spent: number, pending: number, allocated: number) => {
    const utilization = ((spent + pending) / allocated) * 100;
    if (utilization >= 90) return 'critical';
    if (utilization >= 75) return 'warning';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      default: return 'success';
    }
  };

  const getProgressVariant = (status: string) => {
    switch (status) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      default: return 'success';
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            {title}
          </h3>
          <Badge
            variant={getStatusColor(getBudgetStatus(totalSpent, totalPending, totalAllocated))}
          >
            {totalUtilization.toFixed(1)}% Utilized
          </Badge>
        </div>

        {/* Overall Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600">Allocated</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(totalAllocated)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Spent</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-lg font-semibold text-yellow-600">
              {formatCurrency(totalPending)}
            </p>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="space-y-4">
          {budgets.map((budget, index) => {
            const utilization = ((budget.spent + budget.pending) / budget.allocated) * 100;
            const status = getBudgetStatus(budget.spent, budget.pending, budget.allocated);
            const remaining = budget.allocated - budget.spent - budget.pending;

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {budget.department}
                    </h4>
                    <p className="text-xs text-gray-600">{budget.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(budget.spent + budget.pending)} / {formatCurrency(budget.allocated)}
                      </span>
                      {status === 'critical' && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {formatCurrency(remaining)} remaining
                    </p>
                  </div>
                </div>
                
                <ProgressBar
                  value={budget.spent + budget.pending}
                  max={budget.allocated}
                  variant={getProgressVariant(status)}
                  size="sm"
                />
                
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Spent: {formatCurrency(budget.spent)}</span>
                  <span>Pending: {formatCurrency(budget.pending)}</span>
                  <span>{utilization.toFixed(1)}% used</span>
                </div>
              </div>
            );
          })}
        </div>

        {budgets.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No budget data available
          </div>
        )}
      </div>
    </Card>
  );
};