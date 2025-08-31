import React from 'react';
import { Clock, User, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatCurrency, getRelativeTime } from '../../utils/formatters';

interface Activity {
  id: string;
  type: 'request_created' | 'request_approved' | 'request_rejected' | 'request_updated';
  title: string;
  description: string;
  user: string;
  amount?: number;
  timestamp: Date;
  status?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  activities, 
  maxItems = 10 
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'request_created':
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      case 'request_approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'request_rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'request_created':
        return 'border-blue-200 bg-blue-50';
      case 'request_approved':
        return 'border-green-200 bg-green-50';
      case 'request_rejected':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {displayActivities.map((activity, index) => (
            <div
              key={activity.id}
              className={`flex items-start space-x-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
            >
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <span className="text-xs text-gray-500">
                    {getRelativeTime(activity.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {activity.user}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {activity.amount && (
                      <span className="text-xs font-medium text-gray-700">
                        {formatCurrency(activity.amount)}
                      </span>
                    )}
                    {activity.status && (
                      <Badge
                        variant={
                          activity.status === 'Approved' ? 'success' :
                          activity.status === 'Rejected' ? 'error' : 'warning'
                        }
                        size="sm"
                      >
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {displayActivities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No recent activity to display
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};