import React, { useState } from 'react';
import { HelpCircle, Book, MessageCircle, Phone, Mail, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { SearchInput } from '../ui/SearchInput';
import { Badge } from '../ui/Badge';

export const HelpCenter: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const faqs = [
    {
      id: '1',
      question: 'How do I submit a purchase request?',
      answer: 'To submit a purchase request, navigate to the "New Request" section from the sidebar. Fill out all required fields including item description, vendor information, amount, and business justification. Once submitted, your request will be automatically routed to the appropriate approver based on the amount.',
      category: 'Getting Started',
    },
    {
      id: '2',
      question: 'What are the approval limits for each level?',
      answer: 'Approval limits are: Level 1 (Manager) - $0 to $5,000, Level 2 (Department Head) - $5,001 to $25,000, Level 3 (Executive) - $25,001 and above. Requests are automatically routed based on these thresholds.',
      category: 'Approval Process',
    },
    {
      id: '3',
      question: 'How long does the approval process take?',
      answer: 'Standard approval deadlines are: Level 1 - 24 hours, Level 2 - 48 hours, Level 3 - 72 hours. Urgent requests may be expedited. If a deadline is missed, the request automatically escalates to the next level.',
      category: 'Approval Process',
    },
    {
      id: '4',
      question: 'Can I edit a request after submission?',
      answer: 'Once submitted, requests cannot be edited. If changes are needed, you can withdraw the request and submit a new one, or contact your approver to discuss the changes in the comments section.',
      category: 'Request Management',
    },
    {
      id: '5',
      question: 'How do I track my request status?',
      answer: 'You can track your requests in the "My Requests" section. Each request shows its current status, approval progress, and any comments from approvers. You\'ll also receive notifications for status changes.',
      category: 'Request Management',
    },
    {
      id: '6',
      question: 'What happens if my request is rejected?',
      answer: 'If your request is rejected, you\'ll receive a notification with the reason. You can review the feedback, make necessary adjustments, and submit a new request if appropriate.',
      category: 'Approval Process',
    },
  ];

  const guides = [
    {
      title: 'Getting Started Guide',
      description: 'Learn the basics of using the purchase approval system',
      duration: '5 min read',
    },
    {
      title: 'Approval Workflow Overview',
      description: 'Understand how the three-tier approval process works',
      duration: '3 min read',
    },
    {
      title: 'Best Practices for Request Submission',
      description: 'Tips for creating effective purchase requests',
      duration: '4 min read',
    },
    {
      title: 'Manager Approval Guide',
      description: 'How to efficiently review and approve requests',
      duration: '6 min read',
    },
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <HelpCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Find answers to common questions and learn how to make the most of the purchase approval system
        </p>
      </div>

      {/* Search */}
      <Card className="p-6">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search for help articles, FAQs, or guides..."
          className="max-w-md mx-auto"
        />
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
          <Book className="h-8 w-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-2">User Guides</h3>
          <p className="text-sm text-gray-600">Step-by-step instructions and tutorials</p>
        </Card>
        <Card className="p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
          <MessageCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-2">Live Chat</h3>
          <p className="text-sm text-gray-600">Get instant help from our support team</p>
        </Card>
        <Card className="p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
          <Phone className="h-8 w-8 text-purple-600 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-2">Contact Support</h3>
          <p className="text-sm text-gray-600">Reach out for personalized assistance</p>
        </Card>
      </div>

      {/* User Guides */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guides.map((guide, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
                <h3 className="font-medium text-gray-900 mb-2">{guide.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{guide.description}</p>
                <Badge variant="info" size="sm">{guide.duration}</Badge>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* FAQs */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {filteredFaqs.map((faq) => (
              <div key={faq.id} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{faq.question}</h3>
                    <Badge variant="default" size="sm" className="mt-1">
                      {faq.category}
                    </Badge>
                  </div>
                  {expandedFaq === faq.id ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-4 pb-4">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {filteredFaqs.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <p className="text-gray-600">No FAQs found matching your search.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Contact Information */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Still Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">Email Support</h3>
                <p className="text-sm text-gray-600 mt-1">support@company.com</p>
                <p className="text-xs text-gray-500 mt-1">Response within 24 hours</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Phone className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">Phone Support</h3>
                <p className="text-sm text-gray-600 mt-1">1-800-SUPPORT</p>
                <p className="text-xs text-gray-500 mt-1">Mon-Fri, 9AM-5PM EST</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};