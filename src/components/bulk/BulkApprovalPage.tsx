import React, { useState, useMemo } from 'react';
import { useRequests } from '../../contexts/RequestsContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Users,
  AlertTriangle
} from 'lucide-react';

export const BulkApprovalPage: React.FC = () => {
  const { requests, approveRequest, rejectRequest } = useRequests();
  const { user } = useAuth();
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject'>('approve');
  const [bulkComments, setBulkComments] = useState('');
  const [processing, setProcessing] = useState(false);

  const pendingRequests = useMemo(() => {
    return requests.filter(req => req.currentApprover === user?.id);
  }, [requests, user]);

  const selectedRequestsData = useMemo(() => {
    return pendingRequests.filter(req => selectedRequests.includes(req.id));
  }, [pendingRequests, selectedRequests]);

  const totalSelectedValue = useMemo(() => {
    return selectedRequestsData.reduce((sum, req) => sum + req.amount, 0);
  }, [selectedRequestsData]);

  const handleSelectAll = () => {
    if (selectedRequests.length === pendingRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(pendingRequests.map(req => req.id));
    }
  };

  const handleSelectRequest = (requestId: string) => {
    setSelectedRequests(prev => 
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleBulkAction = async () => {
    if (!bulkComments.trim() && bulkAction === 'reject') return;
    
    setProcessing(true);
    try {
      for (const requestId of selectedRequests) {
        if (bulkAction === 'approve') {
          approveRequest(requestId, bulkComments || 'Bulk approval');
        } else {
          rejectRequest(requestId, bulkComments);
        }
      }
      setSelectedRequests([]);
      setShowBulkModal(false);
      setBulkComments('');
    } catch (error) {
      console.error('Bulk action error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const openBulkModal = (action: 'approve' | 'reject') => {
    setBulkAction(action);
    setShowBulkModal(true);
    setBulkComments('');
  };

  if (user?.role === 'Employee') {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-600">Bulk approval is only available for Managers and Executives.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Approvals</h1>
          <p className="text-gray-600">
            Review and approve multiple requests at once
          </p>
        </div>
        {selectedRequests.length > 0 && (
          <div className="flex space-x-3">
            <Button
              variant="primary"
              onClick={() => openBulkModal('approve')}
              className="flex items-center"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Selected ({selectedRequests.length})
            </Button>
            <Button
              variant="destructive"
              onClick={() => openBulkModal('reject')}
              className="flex items-center"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Selected ({selectedRequests.length})
            </Button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(pendingRequests.reduce((sum, req) => sum + req.amount, 0))}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Selected</p>
              <p className="text-2xl font-bold text-gray-900">{selectedRequests.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Selected Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSelectedValue)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Pending Requests</h3>
            <Button
              variant="outline"
              onClick={handleSelectAll}
              size="sm"
            >
              {selectedRequests.length === pendingRequests.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Approvals</h3>
              <p className="text-gray-600">All caught up! No requests require your approval at this time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRequests.length === pendingRequests.length && pendingRequests.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
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
                      Urgency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingRequests.map((request) => {
                    const isOverdue = new Date() > new Date(request.deadlineDate);
                    const isSelected = selectedRequests.includes(request.id);
                    
                    return (
                      <tr 
                        key={request.id} 
                        className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRequest(request.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="text-sm font-medium text-gray-900 truncate">
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
                              request.urgency === 'Critical' ? 'error' :
                              request.urgency === 'High' ? 'warning' : 'default'
                            }
                          >
                            {request.urgency}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            {formatDate(request.deadlineDate)}
                            {isOverdue && (
                              <div className="flex items-center mt-1">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                <span className="text-xs">Overdue</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Bulk Action Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title={`Bulk ${bulkAction === 'approve' ? 'Approve' : 'Reject'} Requests`}
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              {bulkAction === 'approve' ? 'Approving' : 'Rejecting'} {selectedRequests.length} requests
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Total value: {formatCurrency(totalSelectedValue)}
            </p>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {selectedRequestsData.map((request) => (
                <div key={request.id} className="flex justify-between text-sm">
                  <span className="truncate">{request.description}</span>
                  <span className="font-medium">{formatCurrency(request.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="bulkComments" className="block text-sm font-medium text-gray-700 mb-1">
              Comments {bulkAction === 'reject' ? '(Required)' : '(Optional)'}
            </label>
            <textarea
              id="bulkComments"
              rows={4}
              value={bulkComments}
              onChange={(e) => setBulkComments(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder={`Add your ${bulkAction} comments here...`}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowBulkModal(false)}>
              Cancel
            </Button>
            <Button
              variant={bulkAction === 'approve' ? 'primary' : 'destructive'}
              onClick={handleBulkAction}
              loading={processing}
              disabled={bulkAction === 'reject' && !bulkComments.trim()}
            >
              {bulkAction === 'approve' ? 'Approve All' : 'Reject All'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};