import React from 'react';
import { User, DollarSign, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { PurchaseRequest } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface WorkflowVisualizationProps {
  request: PurchaseRequest;
}

export const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({ request }) => {
  const getRequiredLevels = (amount: number) => {
    if (amount <= 5000) return 1;
    if (amount <= 25000) return 2;
    return 3;
  };

  const requiredLevels = getRequiredLevels(request.amount);
  const currentLevel = request.approvalHistory.length;
  const isCompleted = request.status === 'Approved' || request.status === 'Rejected';
  const isRejected = request.status === 'Rejected';

  const levels = [
    {
      level: 1,
      title: 'Manager Approval',
      description: 'Direct manager review',
      icon: User,
      threshold: '$0 - $5,000',
    },
    {
      level: 2,
      title: 'Department Head',
      description: 'Department head approval',
      icon: User,
      threshold: '$5,001 - $25,000',
    },
    {
      level: 3,
      title: 'Executive Approval',
      description: 'Executive level approval',
      icon: User,
      threshold: '$25,001+',
    },
  ];

  const getStepStatus = (level: number) => {
    if (isRejected) {
      const rejectionStep = request.approvalHistory.find(step => step.action === 'Rejected');
      if (rejectionStep && rejectionStep.level === level) return 'rejected';
      if (level < (rejectionStep?.level || 0)) return 'completed';
      return 'inactive';
    }

    if (level <= currentLevel) return 'completed';
    if (level === currentLevel + 1 && !isCompleted) return 'current';
    if (level <= requiredLevels) return 'pending';
    return 'inactive';
  };

  const getStepIcon = (level: number, status: string) => {
    const LevelIcon = levels[level - 1]?.icon || User;
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-6 w-6 text-red-600" />;
      case 'current':
        return <Clock className="h-6 w-6 text-blue-600 animate-pulse" />;
      case 'pending':
        return <LevelIcon className="h-6 w-6 text-gray-400" />;
      default:
        return <LevelIcon className="h-6 w-6 text-gray-300" />;
    }
  };

  const getStepClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      case 'current':
        return 'bg-blue-50 border-blue-200 ring-2 ring-blue-500 ring-opacity-50';
      case 'pending':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-100 opacity-50';
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Approval Workflow</h3>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">
              {formatCurrency(request.amount)} • {requiredLevels} level{requiredLevels > 1 ? 's' : ''} required
            </span>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="space-y-4">
          {levels.slice(0, requiredLevels).map((level, index) => {
            const status = getStepStatus(level.level);
            const approvalStep = request.approvalHistory.find(step => step.level === level.level);
            const isOverdue = status === 'current' && new Date() > new Date(request.deadlineDate);

            return (
              <div
                key={level.level}
                className={cn(
                  'relative p-4 rounded-lg border-2 transition-all duration-200',
                  getStepClasses(status)
                )}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getStepIcon(level.level, status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        Level {level.level}: {level.title}
                      </h4>
                      <Badge
                        variant={
                          status === 'completed' ? 'success' :
                          status === 'rejected' ? 'error' :
                          status === 'current' ? 'warning' : 'default'
                        }
                        size="sm"
                      >
                        {status === 'completed' ? 'Approved' :
                         status === 'rejected' ? 'Rejected' :
                         status === 'current' ? 'In Review' :
                         status === 'pending' ? 'Pending' : 'Not Required'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {level.description} • {level.threshold}
                    </p>

                    {approvalStep && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-900">
                            {approvalStep.approverName}
                          </span>
                          <span className="text-gray-500">
                            {formatDateTime(approvalStep.timestamp)}
                          </span>
                        </div>
                        {approvalStep.comments && (
                          <p className="text-sm text-gray-700 mt-2 italic">
                            "{approvalStep.comments}"
                          </p>
                        )}
                      </div>
                    )}

                    {status === 'current' && (
                      <div className="mt-3 flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className={cn(
                          'text-sm',
                          isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
                        )}>
                          Due: {formatDateTime(request.deadlineDate)}
                          {isOverdue && (
                            <span className="ml-2 inline-flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Overdue
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Connection line to next step */}
                {index < requiredLevels - 1 && (
                  <div className="absolute left-7 -bottom-4 w-0.5 h-8 bg-gray-200"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Final Status */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center">
            {isCompleted ? (
              <div className={cn(
                'flex items-center px-4 py-2 rounded-full',
                isRejected ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              )}>
                {isRejected ? (
                  <XCircle className="h-5 w-5 mr-2" />
                ) : (
                  <CheckCircle className="h-5 w-5 mr-2" />
                )}
                <span className="font-medium">
                  Request {isRejected ? 'Rejected' : 'Fully Approved'}
                </span>
              </div>
            ) : (
              <div className="flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800">
                <Clock className="h-5 w-5 mr-2" />
                <span className="font-medium">
                  Approval in Progress ({currentLevel}/{requiredLevels} completed)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};