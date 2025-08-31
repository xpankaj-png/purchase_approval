import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRequests } from '../../contexts/RequestsContext';
import { QuickStats } from './QuickStats';
import { ActivityFeed } from './ActivityFeed';
import { BudgetTracker } from './BudgetTracker';
import { formatCurrency } from '../../utils/formatters';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Users,
  FileText,
  AlertTriangle
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { requests } = useRequests();

  const userRequests = requests.filter(req => req.requesterId === user?.id);
  const pendingApprovals = requests.filter(req => req.currentApprover === user?.id);
  
  const stats = {
    totalRequests: userRequests.length,
    pendingRequests: userRequests.filter(req => req.status.includes('Pending')).length,
    approvedRequests: userRequests.filter(req => req.status === 'Approved').length,
    rejectedRequests: userRequests.filter(req => req.status === 'Rejected').length,
    totalAmount: userRequests.reduce((sum, req) => sum + req.amount, 0),
    pendingAmount: userRequests
      .filter(req => req.status.includes('Pending'))
      .reduce((sum, req) => sum + req.amount, 0),
  };

  const managerStats = {
    pendingApprovals: pendingApprovals.length,
    teamRequests: requests.filter(req => {
      // For demo purposes, consider all requests in same department as team requests
      return req.department === user?.department && req.requesterId !== user?.id;
    }).length,
    totalApproved: requests.filter(req => 
      req.approvalHistory.some(step => step.approverId === user?.id && step.action === 'Approved')
    ).length,
  };

  // Generate activity feed data
  const recentActivities = requests
    .slice(0, 10)
    .map(request => ({
      id: request.id,
      type: request.status === 'Approved' ? 'request_approved' as const :
            request.status === 'Rejected' ? 'request_rejected' as const :
            'request_created' as const,
      title: request.description,
      description: `${request.requesterName} • ${request.department}`,
      user: request.requesterName,
      amount: request.amount,
      timestamp: new Date(request.updatedAt),
      status: request.status,
    }));

  // Generate budget data
  const budgetData = [
    {
      department: 'Engineering',
      allocated: 50000,
      spent: 32000,
      pending: 8000,
      category: 'IT Equipment & Software',
    },
    {
      department: 'Marketing',
      allocated: 30000,
      spent: 18000,
      pending: 5000,
      category: 'Marketing & Events',
    },
    {
      department: 'Operations',
      allocated: 25000,
      spent: 15000,
      pending: 3000,
      category: 'Office & Supplies',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of your purchase request activity.
        </p>
      </div>

      {/* Employee Dashboard */}
      {user?.role === 'Employee' && (
        <>
          <QuickStats
            stats={[
              {
                title: "Total Requests",
                value: stats.totalRequests,
                icon: FileText,
                color: 'blue',
              },
              {
                title: "Pending Requests",
                value: stats.pendingRequests,
                icon: Clock,
                color: 'yellow',
              },
              {
                title: "Approved Requests",
                value: stats.approvedRequests,
                icon: CheckCircle,
                color: 'green',
              },
              {
                title: "Total Amount",
                value: formatCurrency(stats.totalAmount),
                icon: DollarSign,
                color: 'purple',
              },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivityFeed activities={recentActivities} />
            <BudgetTracker budgets={budgetData.filter(b => b.department === user?.department)} />
          </div>
        </>
      )}

      {/* Manager/Executive Dashboard */}
      {(user?.role === 'Manager' || user?.role === 'Executive') && (
        <>
          <QuickStats
            stats={[
              {
                title: "Pending Approvals",
                value: managerStats.pendingApprovals,
                icon: Clock,
                color: 'yellow',
              },
              {
                title: "Team Requests",
                value: managerStats.teamRequests,
                icon: Users,
                color: 'blue',
              },
              {
                title: "Approved by Me",
                value: managerStats.totalApproved,
                icon: CheckCircle,
                color: 'green',
              },
              {
                title: "Personal Requests",
                value: stats.totalRequests,
                icon: FileText,
                color: 'purple',
              },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivityFeed activities={recentActivities} />
            <BudgetTracker 
              budgets={user?.role === 'Executive' ? budgetData : budgetData.filter(b => b.department === user?.department)} 
              title="Total Requests"
            />
          </div>
        </>
      )}
    </div>
  );
};