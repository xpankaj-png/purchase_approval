import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RequestsProvider } from './contexts/RequestsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LoginForm } from './components/auth/LoginForm';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { RequestForm } from './components/forms/RequestForm';
import { RequestsList } from './components/requests/RequestsList';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { UserProfile } from './components/profile/UserProfile';
import { ReportsPage } from './components/reports/ReportsPage';
import { BulkApprovalPage } from './components/bulk/BulkApprovalPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { HelpCenter } from './components/help/HelpCenter';
import { ToastContainer } from './components/ui/Toast';
import { useToast } from './hooks/useToast';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toasts, removeToast } = useToast();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      
      case 'new-request':
        return (
          <RequestForm 
            onSuccess={() => {
              setActiveTab('my-requests');
            }}
          />
        );
      
      case 'my-requests':
        return (
          <RequestsList
            title="My Requests"
            filterFn={(request) => request.requesterId === user?.id}
          />
        );
      
      case 'pending-approvals':
        return (
          <RequestsList
            title="Pending Approvals"
            filterFn={(request) => request.currentApprover === user?.id}
            showActions={true}
          />
        );
      
      case 'approved-requests':
        return (
          <RequestsList
            title="Approved Requests"
            filterFn={(request) => 
              request.status === 'Approved' && 
              request.approvalHistory.some(step => step.approverId === user?.id)
            }
          />
        );
      
      case 'all-requests':
        return (
          <RequestsList
            title="All Requests"
            filterFn={(request) => user?.role === 'Executive'}
          />
        );
      
      case 'analytics':
        return (
          <AnalyticsDashboard />
        );
      
      case 'bulk-approval':
        return <BulkApprovalPage />;
      
      case 'reports':
        return <ReportsPage />;
      
      case 'profile':
        return <UserProfile />;
      
      case 'settings':
        return <SettingsPage />;
      
      case 'notifications':
        return <NotificationCenter />;
      
      case 'help':
        return <HelpCenter />;
      
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        isOpen={isMobileMenuOpen}
      />
      
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderContent()}
        </main>
        
        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RequestsProvider>
          <AppContent />
        </RequestsProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;