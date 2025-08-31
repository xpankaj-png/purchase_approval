import React, { useMemo } from 'react';
import { useRequests } from '../../contexts/RequestsContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  BarChart3,
  PieChart,
  Calendar,
  Users
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const { requests } = useRequests();
  const { user } = useAuth();

  const analytics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Filter requests based on user role
    const relevantRequests = user?.role === 'Executive' 
      ? requests 
      : requests.filter(req => req.department === user?.department);

    const recentRequests = relevantRequests.filter(req => 
      new Date(req.createdAt) >= thirtyDaysAgo
    );
    const previousPeriodRequests = relevantRequests.filter(req => 
      new Date(req.createdAt) >= sixtyDaysAgo && new Date(req.createdAt) < thirtyDaysAgo
    );

    // Calculate metrics
    const totalValue = recentRequests.reduce((sum, req) => sum + req.amount, 0);
    const previousTotalValue = previousPeriodRequests.reduce((sum, req) => sum + req.amount, 0);
    const valueChange = previousTotalValue > 0 ? ((totalValue - previousTotalValue) / previousTotalValue) * 100 : 0;

    const approvedRequests = recentRequests.filter(req => req.status === 'Approved');
    const rejectedRequests = recentRequests.filter(req => req.status === 'Rejected');
    const pendingRequests = recentRequests.filter(req => req.status.includes('Pending'));

    const approvalRate = recentRequests.length > 0 
      ? (approvedRequests.length / (approvedRequests.length + rejectedRequests.length)) * 100 
      : 0;

    // Average approval time
    const completedRequests = [...approvedRequests, ...rejectedRequests];
    const avgApprovalTime = completedRequests.length > 0
      ? completedRequests.reduce((sum, req) => {
          const created = new Date(req.createdAt);
          const completed = new Date(req.updatedAt);
          return sum + (completed.getTime() - created.getTime());
        }, 0) / completedRequests.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    // Category breakdown
    const categoryBreakdown = recentRequests.reduce((acc, req) => {
      acc[req.category] = (acc[req.category] || 0) + req.amount;
      return acc;
    }, {} as Record<string, number>);

    // Department breakdown (for executives)
    const departmentBreakdown = user?.role === 'Executive' 
      ? recentRequests.reduce((acc, req) => {
          acc[req.department] = (acc[req.department] || 0) + req.amount;
          return acc;
        }, {} as Record<string, number>)
      : {};

    return {
      totalRequests: recentRequests.length,
      totalValue,
      valueChange,
      approvalRate,
      avgApprovalTime,
      approvedCount: approvedRequests.length,
      rejectedCount: rejectedRequests.length,
      pendingCount: pendingRequests.length,
      categoryBreakdown,
      departmentBreakdown,
      recentRequests: recentRequests.slice(0, 10)
    };
  }, [requests, user]);

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    format = 'number' 
  }: {
    title: string;
    value: number;
    change?: number;
    icon: React.ComponentType<any>;
    format?: 'number' | 'currency' | 'percentage' | 'days';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency': return formatCurrency(val);
        case 'percentage': return `${val.toFixed(1)}%`;
        case 'days': return `${val.toFixed(1)} days`;
        default: return val.toString();
      }
    };

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatValue(value)}
            </p>
            {change !== undefined && (
              <div className="flex items-center mt-2">
                {change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(change).toFixed(1)}% vs last month
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </Card>
    );
  };

  const CategoryChart = () => (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <PieChart className="h-5 w-5 mr-2" />
          Spending by Category
        </h3>
        <div className="space-y-4">
          {Object.entries(analytics.categoryBreakdown)
            .sort(([,a], [,b]) => b - a)
            .map(([category, amount]) => {
              const percentage = (amount / analytics.totalValue) * 100;
              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{category}</span>
                    <span className="text-gray-600">
                      {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </Card>
  );

  const DepartmentChart = () => (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Spending by Department
        </h3>
        <div className="space-y-4">
          {Object.entries(analytics.departmentBreakdown)
            .sort(([,a], [,b]) => b - a)
            .map(([department, amount]) => {
              const percentage = (amount / analytics.totalValue) * 100;
              return (
                <div key={department} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{department}</span>
                    <span className="text-gray-600">
                      {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </Card>
  );

  const RecentActivity = () => (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Recent Activity
        </h3>
        <div className="space-y-4">
          {analytics.recentRequests.map((request) => (
            <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {request.description}
                </p>
                <p className="text-xs text-gray-600">
                  {request.requesterName} • {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(request.amount)}
                </span>
                <Badge 
                  variant={
                    request.status === 'Approved' ? 'success' :
                    request.status === 'Rejected' ? 'error' : 'warning'
                  }
                  size="sm"
                >
                  {request.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">
          Purchase request analytics and insights for the last 30 days
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Requests"
          value={analytics.totalRequests}
          icon={BarChart3}
        />
        <MetricCard
          title="Total Value"
          value={analytics.totalValue}
          change={analytics.valueChange}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Approval Rate"
          value={analytics.approvalRate}
          icon={CheckCircle}
          format="percentage"
        />
        <MetricCard
          title="Avg. Approval Time"
          value={analytics.avgApprovalTime}
          icon={Clock}
          format="days"
        />
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-800">Approved</p>
              <p className="text-2xl font-bold text-green-900">{analytics.approvedCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-800">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{analytics.pendingCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-red-800">Rejected</p>
              <p className="text-2xl font-bold text-red-900">{analytics.rejectedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart />
        {user?.role === 'Executive' && Object.keys(analytics.departmentBreakdown).length > 0 && (
          <DepartmentChart />
        )}
        <RecentActivity />
      </div>
    </div>
  );
};