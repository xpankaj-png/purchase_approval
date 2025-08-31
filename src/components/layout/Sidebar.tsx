import React from 'react';
import { 
  LayoutDashboard, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  BarChart3,
  Settings,
  Users,
  FileBarChart,
  User
} from 'lucide-react';
import { Bell, HelpCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { cn } from '../../utils/cn';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const navigationItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['Employee', 'Manager', 'Executive'],
    },
    {
      id: 'new-request',
      name: 'New Request',
      icon: Plus,
      roles: ['Employee'],
    },
    {
      id: 'my-requests',
      name: 'My Requests',
      icon: FileText,
      roles: ['Employee'],
    },
    {
      id: 'pending-approvals',
      name: 'Pending Approvals',
      icon: Clock,
      roles: ['Manager', 'Executive'],
    },
    {
      id: 'approved-requests',
      name: 'Approved Requests',
      icon: CheckCircle,
      roles: ['Manager', 'Executive'],
    },
    {
      id: 'all-requests',
      name: 'All Requests',
      icon: FileText,
      roles: ['Executive'],
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: BarChart3,
      roles: ['Manager', 'Executive'],
    },
    {
      id: 'bulk-approval',
      name: 'Bulk Approval',
      icon: Users,
      roles: ['Manager', 'Executive'],
    },
    {
      id: 'reports',
      name: 'Reports',
      icon: FileBarChart,
      roles: ['Manager', 'Executive'],
    },
    {
      id: 'profile',
      name: 'Profile',
      icon: User,
      roles: ['Employee', 'Manager', 'Executive'],
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell,
      roles: ['Employee', 'Manager', 'Executive'],
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: 'help',
      name: 'Help Center',
      icon: HelpCircle,
      roles: ['Employee', 'Manager', 'Executive'],
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: Settings,
      roles: ['Executive'],
    },
  ];

  const visibleItems = navigationItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center px-6">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="ml-3 text-lg font-semibold text-white">
            PurchaseFlow
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-4">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  activeTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                )}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-300">{user?.department}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};