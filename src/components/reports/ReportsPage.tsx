import React, { useState, useMemo } from 'react';
import { useRequests } from '../../contexts/RequestsContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { 
  Download, 
  Filter, 
  Calendar,
  FileText,
  TrendingUp,
  DollarSign
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { requests } = useRequests();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('30');
  const [reportType, setReportType] = useState('summary');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const departments = useMemo(() => {
    return [...new Set(requests.map(req => req.department))];
  }, [requests]);

  const reportData = useMemo(() => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - parseInt(dateRange) * 24 * 60 * 60 * 1000);
    
    let filteredRequests = requests.filter(req => new Date(req.createdAt) >= daysAgo);
    
    // Filter by department if not executive
    if (user?.role !== 'Executive') {
      filteredRequests = filteredRequests.filter(req => req.department === user?.department);
    } else if (selectedDepartment !== 'all') {
      filteredRequests = filteredRequests.filter(req => req.department === selectedDepartment);
    }

    const totalValue = filteredRequests.reduce((sum, req) => sum + req.amount, 0);
    const approvedValue = filteredRequests
      .filter(req => req.status === 'Approved')
      .reduce((sum, req) => sum + req.amount, 0);
    
    const statusBreakdown = filteredRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryBreakdown = filteredRequests.reduce((acc, req) => {
      if (!acc[req.category]) {
        acc[req.category] = { count: 0, value: 0 };
      }
      acc[req.category].count += 1;
      acc[req.category].value += req.amount;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    const departmentBreakdown = filteredRequests.reduce((acc, req) => {
      if (!acc[req.department]) {
        acc[req.department] = { count: 0, value: 0 };
      }
      acc[req.department].count += 1;
      acc[req.department].value += req.amount;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    return {
      totalRequests: filteredRequests.length,
      totalValue,
      approvedValue,
      statusBreakdown,
      categoryBreakdown,
      departmentBreakdown,
      requests: filteredRequests
    };
  }, [requests, dateRange, selectedDepartment, user, departments]);

  const exportToCSV = () => {
    const headers = [
      'ID', 'Requester', 'Department', 'Category', 'Description', 
      'Amount', 'Status', 'Created Date', 'Updated Date'
    ];
    
    const csvData = reportData.requests.map(req => [
      req.id,
      req.requesterName,
      req.department,
      req.category,
      req.description.replace(/,/g, ';'),
      req.amount,
      req.status,
      formatDate(req.createdAt),
      formatDate(req.updatedAt)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase-requests-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const SummaryReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.totalRequests}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totalValue)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.approvedValue)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(reportData.statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge 
                      variant={
                        status === 'Approved' ? 'success' :
                        status === 'Rejected' ? 'error' : 'warning'
                      }
                      className="mr-2"
                    >
                      {status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Category Analysis</h3>
            <div className="space-y-3">
              {Object.entries(reportData.categoryBreakdown)
                .sort(([,a], [,b]) => b.value - a.value)
                .map(([category, data]) => (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{category}</span>
                      <span>{formatCurrency(data.value)} ({data.count} requests)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ 
                          width: `${(data.value / reportData.totalValue) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const DetailedReport = () => (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Request List</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {request.description}
                      </div>
                      <div className="text-sm text-gray-500">{request.category}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.requesterName}</div>
                    <div className="text-sm text-gray-500">{request.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(request.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      variant={
                        request.status === 'Approved' ? 'success' :
                        request.status === 'Rejected' ? 'error' : 'warning'
                      }
                    >
                      {request.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(request.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and export purchase request reports</p>
        </div>
        <Button onClick={exportToCSV} className="flex items-center">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="summary">Summary</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>

          {user?.role === 'Executive' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Report Content */}
      {reportType === 'summary' ? <SummaryReport /> : <DetailedReport />}
    </div>
  );
};