export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Employee' | 'Manager' | 'Executive';
  department: string;
  managerId?: string;
  avatar?: string;
}

export interface PurchaseRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  department: string;
  category: 'IT Equipment' | 'Office Supplies' | 'Software' | 'Services' | 'Travel' | 'Other';
  description: string;
  vendor: string;
  vendorContact: string;
  amount: number;
  urgency: 'Normal' | 'High' | 'Critical';
  budgetCode: string;
  justification: string;
  expectedDelivery: Date;
  attachments: string[];
  status: 'Draft' | 'Pending_L1' | 'Pending_L2' | 'Pending_L3' | 'Approved' | 'Rejected';
  currentApprover?: string;
  approvalHistory: ApprovalStep[];
  createdAt: Date;
  updatedAt: Date;
  deadlineDate: Date;
}

export interface ApprovalStep {
  level: 1 | 2 | 3;
  approverId: string;
  approverName: string;
  action: 'Approved' | 'Rejected' | 'Pending';
  comments: string;
  timestamp: Date;
  deadline: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: Date;
  requestId?: string;
}

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

export type RequestsState = {
  requests: PurchaseRequest[];
  loading: boolean;
  error: string | null;
  createRequest: (request: Omit<PurchaseRequest, 'id' | 'createdAt' | 'updatedAt' | 'approvalHistory'>) => void;
  approveRequest: (requestId: string, comments: string) => void;
  rejectRequest: (requestId: string, comments: string) => void;
  fetchRequests: () => void;
};