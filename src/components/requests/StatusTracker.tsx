import React from 'react';
import { Check, Clock, X, AlertTriangle } from 'lucide-react';
import { PurchaseRequest } from '../../types';
import { cn } from '../../utils/cn';

interface StatusTrackerProps {
  request: PurchaseRequest;
}

export const StatusTracker: React.FC<StatusTrackerProps> = ({ request }) => {
  const getRequiredLevel = (amount: number): number => {
    if (amount <= 5000) return 1;
    if (amount <= 25000) return 2;
    return 3;
  };

  const requiredLevel = getRequiredLevel(request.amount);
  const currentLevel = request.approvalHistory.length;
  const isCompleted = request.status === 'Approved' || request.status === 'Rejected';
  const isRejected = request.status === 'Rejected';

  const steps = [
    { level: 1, label: 'Manager Approval', description: 'Direct manager review' },
    { level: 2, label: 'Department Head', description: 'Department head approval' },
    { level: 3, label: 'Executive Approval', description: 'Executive level approval' },
  ];

  const visibleSteps = steps.slice(0, requiredLevel);

  const getStepStatus = (stepLevel: number) => {
    if (isRejected) {
      if (stepLevel <= currentLevel) {
        const historyStep = request.approvalHistory[stepLevel - 1];
        return historyStep?.action === 'Rejected' ? 'rejected' : 'completed';
      }
      return 'inactive';
    }

    if (stepLevel < currentLevel || (stepLevel === currentLevel && isCompleted)) {
      return 'completed';
    }
    if (stepLevel === currentLevel + 1 && !isCompleted) {
      return 'current';
    }
    return 'inactive';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-white" />;
      case 'rejected':
        return <X className="h-4 w-4 text-white" />;
      case 'current':
        return <Clock className="h-4 w-4 text-white" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const getStepClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'current':
        return 'bg-blue-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getLineClasses = (index: number) => {
    const nextStepStatus = getStepStatus(visibleSteps[index + 1]?.level);
    return cn(
      'flex-1 h-0.5 mx-4',
      nextStepStatus === 'completed' || nextStepStatus === 'rejected' ? 'bg-green-500' :
      nextStepStatus === 'current' ? 'bg-blue-500' : 'bg-gray-300'
    );
  };

  return (
    <div>
      <h4 className="font-medium text-gray-900 mb-4">Approval Progress</h4>
      
      {/* Progress indication */}
      <div className="mb-4 bg-gray-200 rounded-full h-2">
        <div 
          className={cn(
            'h-2 rounded-full transition-all duration-500',
            isRejected ? 'bg-red-500' : 'bg-blue-500'
          )}
          style={{ 
            width: `${isCompleted ? 100 : ((currentLevel) / requiredLevel) * 100}%` 
          }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-center">
        {visibleSteps.map((step, index) => {
          const status = getStepStatus(step.level);
          const approvalStep = request.approvalHistory[step.level - 1];

          return (
            <React.Fragment key={step.level}>
              <div className="flex flex-col items-center">
                {/* Step circle */}
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  getStepClasses(status)
                )}>
                  {getStepIcon(status)}
                </div>
                
                {/* Step info */}
                <div className="mt-3 text-center max-w-24">
                  <p className="text-sm font-medium text-gray-900">{step.label}</p>
                  <p className="text-xs text-gray-600">{step.description}</p>
                  
                  {approvalStep && (
                    <div className="mt-1">
                      <p className="text-xs font-medium text-gray-700">
                        {approvalStep.approverName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(approvalStep.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  {status === 'current' && (
                    <div className="mt-1 flex items-center justify-center">
                      <AlertTriangle className="h-3 w-3 text-yellow-500 mr-1" />
                      <span className="text-xs text-yellow-700">Pending</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Connecting line */}
              {index < visibleSteps.length - 1 && (
                <div className={getLineClasses(index)} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Final status */}
      <div className="mt-6 p-4 rounded-lg border-2 border-dashed">
        <div className="flex items-center justify-center">
          {isCompleted ? (
            <div className={cn(
              'flex items-center px-4 py-2 rounded-full',
              isRejected ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            )}>
              {isRejected ? (
                <X className="h-5 w-5 mr-2" />
              ) : (
                <Check className="h-5 w-5 mr-2" />
              )}
              <span className="font-medium">
                Request {isRejected ? 'Rejected' : 'Approved'}
              </span>
            </div>
          ) : (
            <div className="flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800">
              <Clock className="h-5 w-5 mr-2" />
              <span className="font-medium">Approval In Progress</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};