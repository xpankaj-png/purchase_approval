import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRequests } from '../../contexts/RequestsContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { budgetCodes } from '../../data/mockData';
import { Upload, X } from 'lucide-react';
import { validateForm, commonRules } from '../../utils/validationUtils';
import { useToast } from '../../hooks/useToast';

export const RequestForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { user } = useAuth();
  const { createRequest } = useRequests();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    category: 'IT Equipment' as const,
    description: '',
    vendor: '',
    vendorContact: '',
    amount: '',
    urgency: 'Normal' as const,
    budgetCode: budgetCodes[0],
    justification: '',
    expectedDelivery: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateRequestForm = () => {
    const validationRules = {
      description: commonRules.description,
      vendor: commonRules.vendor,
      vendorContact: commonRules.email,
      amount: commonRules.currency,
      justification: commonRules.justification,
      expectedDelivery: { required: true },
    };

    const validationData = {
      ...formData,
      amount: parseFloat(formData.amount) || 0,
    };

    const newErrors = validateForm(validationData, validationRules);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRequestForm()) return;
    if (!user) return;

    setLoading(true);
    
    try {
      // Calculate deadline based on amount
      const amount = parseFloat(formData.amount);
      const hoursToAdd = amount <= 5000 ? 24 : amount <= 25000 ? 48 : 72;
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + hoursToAdd);

      createRequest({
        requesterId: user.id,
        requesterName: user.name,
        department: user.department,
        category: formData.category,
        description: formData.description,
        vendor: formData.vendor,
        vendorContact: formData.vendorContact,
        amount: parseFloat(formData.amount),
        urgency: formData.urgency,
        budgetCode: formData.budgetCode,
        justification: formData.justification,
        expectedDelivery: new Date(formData.expectedDelivery),
        attachments,
        status: 'Pending_L1',
        deadlineDate: deadline,
      });

      // Reset form
      setFormData({
        category: 'IT Equipment',
        description: '',
        vendor: '',
        vendorContact: '',
        amount: '',
        urgency: 'Normal',
        budgetCode: budgetCodes[0],
        justification: '',
        expectedDelivery: '',
      });
      setAttachments([]);
      
      toast.success('Request Submitted', 'Your purchase request has been submitted for approval');
      onSuccess?.();
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Submission Failed', 'There was an error submitting your request');
    } finally {
      setLoading(false);
    }
  };

  const addAttachment = () => {
    const fileName = prompt('Enter attachment filename (simulation):');
    if (fileName) {
      setAttachments(prev => [...prev, fileName]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const categories = ['IT Equipment', 'Office Supplies', 'Software', 'Services', 'Travel', 'Other'] as const;
  const urgencyLevels = ['Normal', 'High', 'Critical'] as const;

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">New Purchase Request</h2>
        <p className="text-gray-600">Fill out the form below to submit a new purchase request for approval.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
              Urgency Level
            </label>
            <select
              id="urgency"
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {urgencyLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Item Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Provide a detailed description of the item or service..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Vendor Name"
            name="vendor"
            value={formData.vendor}
            onChange={handleChange}
            error={errors.vendor}
            placeholder="e.g., Apple Inc."
          />

          <Input
            label="Vendor Contact"
            name="vendorContact"
            type="email"
            value={formData.vendorContact}
            onChange={handleChange}
            error={errors.vendorContact}
            placeholder="e.g., sales@vendor.com"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Total Amount"
            name="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            error={errors.amount}
            placeholder="0.00"
          />

          <div>
            <label htmlFor="budgetCode" className="block text-sm font-medium text-gray-700 mb-1">
              Budget Code
            </label>
            <select
              id="budgetCode"
              name="budgetCode"
              value={formData.budgetCode}
              onChange={handleChange}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {budgetCodes.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Expected Delivery Date"
          name="expectedDelivery"
          type="date"
          value={formData.expectedDelivery}
          onChange={handleChange}
          error={errors.expectedDelivery}
        />

        <div>
          <label htmlFor="justification" className="block text-sm font-medium text-gray-700 mb-1">
            Business Justification
          </label>
          <textarea
            id="justification"
            name="justification"
            rows={4}
            value={formData.justification}
            onChange={handleChange}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Explain the business need and how this purchase will benefit the organization..."
          />
          {errors.justification && (
            <p className="mt-1 text-sm text-red-600">{errors.justification}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments (Simulated)
          </label>
          <div className="space-y-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{attachment}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addAttachment}
              className="flex items-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Attachment
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline">
            Save as Draft
          </Button>
          <Button type="submit" loading={loading}>
            Submit for Approval
          </Button>
        </div>
      </form>
    </Card>
  );
};