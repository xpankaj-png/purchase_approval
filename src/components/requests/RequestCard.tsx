import React, { useState } from 'react';
import { Calendar, DollarSign, User, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { PurchaseRequest } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useRequests } from '../../contexts/RequestsContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatDate, getRelativeTime } from '../../utils/formatters';
import { StatusTracker } from './StatusTracker';
import { WorkflowVisualization } from '../workflow/WorkflowVisualization';

interface RequestCardProps {
  request: PurchaseRequest;
  showActions?: boolean;
}

export const RequestCard: React.FC<RequestCardProps> = ({ request, showActions = false }) => {
  const { user } = useAuth();
  const { approveRequest, rejectRequest } = useRequests();
  const [showDetails, setShowDetails] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  const canApprove = showActions && request.currentApprover === user?.id;
  const isOverdue = new Date() > new Date(request.deadlineDate);

  const getStatusColor = () => {
    switch (request.status) {
      case 'Approved': return 'success';
      case 'Rejected': return 'error';
      case 'Draft': return 'default';
      default: return isOverdue ? 'error' : 'warning';
    }
  };

  const getUrgencyColor = () => {
    switch (request.urgency) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      default: return 'default';
    }
  };

  const handleApproval = async () => {
    if (!comments.trim()) return;
    
    setProcessing(true);
    try {
      if (approvalAction === 'approve') {
        approveRequest(request.id, comments);
      } else {
        rejectRequest(request.id, comments);
      }
      setShowApprovalModal(false);
      setComments('');
    } catch (error) {
      console.error('Approval error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const openApprovalModal = (action: 'approve' | 'reject') => {
    setApprovalAction(action);
    setShowApprovalModal(true);
    setComments('');
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowDetails(true)}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
                {request.description}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{request.category}</p>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge variant={getStatusColor() as any}>
                {request.status.replace('_', ' ')}
              </Badge>
              {isOverdue && request.status.includes('Pending') && (
                <Badge variant="error" size="sm">
                  Overdue
                </Badge>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <DollarSign className="h-4 w-4 mr-1" />
              {formatCurrency(request.amount)}
            </div>
            <div className="flex items-center text-gray-600">
              <User className="h-4 w-4 mr-1" />
              {request.requesterName}
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(request.createdAt)}
            </div>
            <div className="flex items-center justify-end">
              <Badge variant={getUrgencyColor() as any} size="sm">
                {request.urgency}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          {canApprove && (
            <div className="flex space-x-3 pt-4 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="primary"
                size="sm"
                onClick={() => openApprovalModal('approve')}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button 
                variant="destructive"
                size="sm"
                onClick={() => openApprovalModal('reject')}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}

          {/* Deadline warning */}
          {request.status.includes('Pending') && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-1" />
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                Due {getRelativeTime(request.deadlineDate)}
                {isOverdue && ' (Overdue)'}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Details Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="Purchase Request Details"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Request Information</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Requester:</strong> {request.requesterName}</div>
                <div><strong>Department:</strong> {request.department}</div>
                <div><strong>Category:</strong> {request.category}</div>
                <div><strong>Amount:</strong> {formatCurrency(request.amount)}</div>
                <div><strong>Urgency:</strong> 
                  <Badge variant={getUrgencyColor() as any} size="sm" className="ml-2">
                    {request.urgency}
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Vendor Information</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Vendor:</strong> {request.vendor}</div>
                <div><strong>Contact:</strong> {request.vendorContact}</div>
                <div><strong>Expected Delivery:</strong> {formatDate(request.expectedDelivery)}</div>
                <div><strong>Budget Code:</strong> {request.budgetCode}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Description</h4>
            <p className="text-sm text-gray-700">{request.description}</p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Business Justification</h4>
            <p className="text-sm text-gray-700">{request.justification}</p>
          </div>

          {request.attachments.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Attachments</h4>
              <div className="space-y-1">
                {request.attachments.map((attachment, index) => (
                  <div key={index} className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
                    📎 {attachment}
                  </div>
                ))}
              </div>
            </div>
          )}

          <StatusTracker request={request} />

          <WorkflowVisualization request={request} />

          {request.approvalHistory.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Approval History</h4>
              <div className="space-y-3">
                {request.approvalHistory.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`mt-1 h-2 w-2 rounded-full ${
                      step.action === 'Approved' ? 'bg-green-500' : 
                      step.action === 'Rejected' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{step.approverName}</span>
                        <span className="text-sm text-gray-600">{formatDate(step.timestamp)}</span>
                      </div>
                      <div className="text-sm text-gray-700 mt-1">
                        <Badge 
                          variant={step.action === 'Approved' ? 'success' : step.action === 'Rejected' ? 'error' : 'warning'}
                          size="sm"
                          className="mr-2"
                        >
                          {step.action}
                        </Badge>
                        Level {step.level} Approval
                      </div>
                      {step.comments && (
                        <p className="text-sm text-gray-600 mt-2 italic">"{step.comments}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title={`${approvalAction === 'approve' ? 'Approve' : 'Reject'} Request`}
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900">{request.description}</h4>
            <p className="text-sm text-gray-600 mt-1">
              {formatCurrency(request.amount)} • {request.requesterName}
            </p>
          </div>

          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
              Comments {approvalAction === 'reject' ? '(Required)' : '(Optional)'}
            </label>
            <textarea
              id="comments"
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder={`Add your ${approvalAction === 'approve' ? 'approval' : 'rejection'} comments here...`}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setShowApprovalModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant={approvalAction === 'approve' ? 'primary' : 'destructive'}
              onClick={handleApproval}
              loading={processing}
              disabled={approvalAction === 'reject' && !comments.trim()}
            >
              {approvalAction === 'approve' ? 'Approve' : 'Reject'} Request
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};