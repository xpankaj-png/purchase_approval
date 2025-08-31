import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { 
  Settings, 
  Bell, 
  Shield, 
  Users, 
  DollarSign,
  Clock,
  Mail,
  Smartphone
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
      digest: true,
    },
    approvalLimits: {
      level1: 5000,
      level2: 25000,
      level3: 100000,
    },
    deadlines: {
      level1: 24,
      level2: 48,
      level3: 72,
    },
    autoEscalation: true,
    requireComments: true,
    allowBulkApproval: true,
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };

  const handleApprovalLimitChange = (level: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      approvalLimits: {
        ...prev.approvalLimits,
        [level]: value,
      },
    }));
  };

  const handleDeadlineChange = (level: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      deadlines: {
        ...prev.deadlines,
        [level]: value,
      },
    }));
  };

  const handleSave = () => {
    // In a real app, this would save to backend
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };

  const ToggleSwitch = ({ 
    checked, 
    onChange, 
    label, 
    description 
  }: {
    checked: boolean;
    onChange: (value: boolean) => void;
    label: string;
    description: string;
  }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600">Configure approval workflows and system preferences</p>
      </div>

      {/* Notification Settings */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notification Preferences
          </h3>
          <div className="space-y-4">
            <ToggleSwitch
              checked={settings.notifications.email}
              onChange={(value) => handleNotificationChange('email', value)}
              label="Email Notifications"
              description="Receive email alerts for request status changes"
            />
            <ToggleSwitch
              checked={settings.notifications.push}
              onChange={(value) => handleNotificationChange('push', value)}
              label="Push Notifications"
              description="Get browser push notifications for urgent items"
            />
            <ToggleSwitch
              checked={settings.notifications.sms}
              onChange={(value) => handleNotificationChange('sms', value)}
              label="SMS Notifications"
              description="Receive text messages for critical approvals"
            />
            <ToggleSwitch
              checked={settings.notifications.digest}
              onChange={(value) => handleNotificationChange('digest', value)}
              label="Daily Digest"
              description="Get a daily summary of pending approvals"
            />
          </div>
        </div>
      </Card>

      {/* Approval Limits */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Approval Limits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level 1 (Manager) - Up to
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={settings.approvalLimits.level1}
                  onChange={(e) => handleApprovalLimitChange('level1', parseInt(e.target.value))}
                  className="pl-8 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level 2 (Department Head) - Up to
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={settings.approvalLimits.level2}
                  onChange={(e) => handleApprovalLimitChange('level2', parseInt(e.target.value))}
                  className="pl-8 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level 3 (Executive) - Above
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={settings.approvalLimits.level3}
                  onChange={(e) => handleApprovalLimitChange('level3', parseInt(e.target.value))}
                  className="pl-8 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Deadline Settings */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Approval Deadlines
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level 1 Deadline (hours)
              </label>
              <input
                type="number"
                value={settings.deadlines.level1}
                onChange={(e) => handleDeadlineChange('level1', parseInt(e.target.value))}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level 2 Deadline (hours)
              </label>
              <input
                type="number"
                value={settings.deadlines.level2}
                onChange={(e) => handleDeadlineChange('level2', parseInt(e.target.value))}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level 3 Deadline (hours)
              </label>
              <input
                type="number"
                value={settings.deadlines.level3}
                onChange={(e) => handleDeadlineChange('level3', parseInt(e.target.value))}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Workflow Settings */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Workflow Settings
          </h3>
          <div className="space-y-4">
            <ToggleSwitch
              checked={settings.autoEscalation}
              onChange={(value) => setSettings(prev => ({ ...prev, autoEscalation: value }))}
              label="Auto-Escalation"
              description="Automatically escalate overdue requests to the next level"
            />
            <ToggleSwitch
              checked={settings.requireComments}
              onChange={(value) => setSettings(prev => ({ ...prev, requireComments: value }))}
              label="Require Comments"
              description="Require approval comments for all decisions"
            />
            <ToggleSwitch
              checked={settings.allowBulkApproval}
              onChange={(value) => setSettings(prev => ({ ...prev, allowBulkApproval: value }))}
              label="Bulk Approval"
              description="Allow managers to approve multiple requests at once"
            />
          </div>
        </div>
      </Card>

      {/* System Information */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            System Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-700">System Version</p>
              <p className="text-gray-900">v2.1.0</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Last Updated</p>
              <p className="text-gray-900">January 15, 2025</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Active Users</p>
              <p className="text-gray-900">247 users</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Database Status</p>
              <Badge variant="success">Healthy</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save Settings
        </Button>
      </div>
    </div>
  );
};