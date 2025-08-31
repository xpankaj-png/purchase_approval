import React, { createContext, useContext, useState, useEffect } from 'react';
import { PurchaseRequest, RequestsState, ApprovalStep } from '../types';
import { mockRequests } from '../data/mockData';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

const RequestsContext = createContext<RequestsState | undefined>(undefined);

export const useRequests = () => {
  const context = useContext(RequestsContext);
  if (!context) {
    throw new Error('useRequests must be used within a RequestsProvider');
  }
  return context;
};

export const RequestsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setRequests(mockRequests);
      setError(null);
    } catch (err) {
      setError('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const getRequiredApprovalLevel = (amount: number): number => {
    if (amount <= 5000) return 1;
    if (amount <= 25000) return 2;
    return 3;
  };

  const getNextApprover = (request: PurchaseRequest): string | undefined => {
    const requiredLevel = getRequiredApprovalLevel(request.amount);
    const currentLevel = request.approvalHistory.length + 1;
    
    if (currentLevel <= requiredLevel) {
      // For demo purposes, assign to current user if they're a manager/executive
      if (user?.role === 'Manager' && currentLevel === 1) return user.id;
      if (user?.role === 'Executive' && (currentLevel === 2 || currentLevel === 3)) return user.id;
    }
    
    return undefined;
  };

  const createRequest = (requestData: Omit<PurchaseRequest, 'id' | 'createdAt' | 'updatedAt' | 'approvalHistory'>) => {
    if (!user) return;

    const newRequest: PurchaseRequest = {
      ...requestData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
      approvalHistory: [],
      status: 'Pending_L1',
      currentApprover: getNextApprover({...requestData, approvalHistory: []} as PurchaseRequest),
    };

    setRequests(prev => [newRequest, ...prev]);
    
    addNotification({
      title: 'Request Submitted',
      message: `Purchase request for $${requestData.amount.toLocaleString()} has been submitted for approval.`,
      type: 'success',
      requestId: newRequest.id,
    });
  };

  const approveRequest = (requestId: string, comments: string) => {
    if (!user) return;

    setRequests(prev => prev.map(request => {
      if (request.id !== requestId) return request;

      const approvalStep: ApprovalStep = {
        level: (request.approvalHistory.length + 1) as 1 | 2 | 3,
        approverId: user.id,
        approverName: user.name,
        action: 'Approved',
        comments,
        timestamp: new Date(),
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      const newApprovalHistory = [...request.approvalHistory, approvalStep];
      const requiredLevel = getRequiredApprovalLevel(request.amount);
      const isFullyApproved = newApprovalHistory.length >= requiredLevel;

      const updatedRequest = {
        ...request,
        approvalHistory: newApprovalHistory,
        status: isFullyApproved ? 'Approved' as const : `Pending_L${newApprovalHistory.length + 1}` as const,
        currentApprover: isFullyApproved ? undefined : getNextApprover(request),
        updatedAt: new Date(),
      };

      addNotification({
        title: 'Request Approved',
        message: `Purchase request for $${request.amount.toLocaleString()} has been approved${isFullyApproved ? ' and is now complete' : ' and moved to next level'}.`,
        type: 'success',
        requestId: request.id,
      });

      return updatedRequest;
    }));
  };

  const rejectRequest = (requestId: string, comments: string) => {
    if (!user) return;

    setRequests(prev => prev.map(request => {
      if (request.id !== requestId) return request;

      const approvalStep: ApprovalStep = {
        level: (request.approvalHistory.length + 1) as 1 | 2 | 3,
        approverId: user.id,
        approverName: user.name,
        action: 'Rejected',
        comments,
        timestamp: new Date(),
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const updatedRequest = {
        ...request,
        approvalHistory: [...request.approvalHistory, approvalStep],
        status: 'Rejected' as const,
        currentApprover: undefined,
        updatedAt: new Date(),
      };

      addNotification({
        title: 'Request Rejected',
        message: `Purchase request for $${request.amount.toLocaleString()} has been rejected.`,
        type: 'error',
        requestId: request.id,
      });

      return updatedRequest;
    }));
  };

  const value: RequestsState = {
    requests,
    loading,
    error,
    createRequest,
    approveRequest,
    rejectRequest,
    fetchRequests,
  };

  return (
    <RequestsContext.Provider value={value}>
      {children}
    </RequestsContext.Provider>
  );
};