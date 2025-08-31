import React, { useState, useMemo } from 'react';
import { SortAsc, SortDesc } from 'lucide-react';
import { useRequests } from '../../contexts/RequestsContext';
import { useAuth } from '../../contexts/AuthContext';
import { PurchaseRequest } from '../../types';
import { RequestCard } from './RequestCard';
import { RequestFilters } from './RequestFilters';
import { DataTable } from '../ui/DataTable';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface RequestsListProps {
  title: string;
  filterFn: (request: PurchaseRequest) => boolean;
  showActions?: boolean;
}

export const RequestsList: React.FC<RequestsListProps> = ({ 
  title, 
  filterFn, 
  showActions = false 
}) => {
  const { requests, loading } = useRequests();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    urgency: 'all',
    department: 'all',
    dateRange: 'all',
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredRequests = useMemo(() => {
    let filtered = requests.filter(filterFn);

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(request => request.status === filters.status);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(request => request.category === filters.category);
    }

    if (filters.urgency !== 'all') {
      filtered = filtered.filter(request => request.urgency === filters.urgency);
    }

    if (filters.department !== 'all') {
      filtered = filtered.filter(request => request.department === filters.department);
    }

    if (filters.dateRange !== 'all') {
      const days = parseInt(filters.dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter(request => new Date(request.createdAt) >= cutoffDate);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof PurchaseRequest];
      let bValue: any = b[sortBy as keyof PurchaseRequest];

      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortBy === 'amount') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [requests, filterFn, filters, sortBy, sortOrder]);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      category: 'all',
      urgency: 'all',
      department: 'all',
      dateRange: 'all',
    });
    setCurrentPage(1);
  };

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'Pending_L1', label: 'Pending L1' },
    { value: 'Pending_L2', label: 'Pending L2' },
    { value: 'Pending_L3', label: 'Pending L3' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'IT Equipment', label: 'IT Equipment' },
    { value: 'Office Supplies', label: 'Office Supplies' },
    { value: 'Software', label: 'Software' },
    { value: 'Services', label: 'Services' },
    { value: 'Travel', label: 'Travel' },
    { value: 'Other', label: 'Other' },
  ];

  const urgencyOptions = [
    { value: 'all', label: 'All Urgency' },
    { value: 'Normal', label: 'Normal' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' },
  ];

  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    ...Array.from(new Set(requests.map(req => req.department))).map(dept => ({
      value: dept,
      label: dept,
    })),
  ];

  // Table columns for table view
  const tableColumns = [
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      render: (request: PurchaseRequest) => (
        <div>
          <div className="font-medium text-gray-900 truncate max-w-xs">
            {request.description}
          </div>
          <div className="text-sm text-gray-500">{request.category}</div>
        </div>
      ),
    },
    {
      key: 'requesterName',
      header: 'Requester',
      sortable: true,
      render: (request: PurchaseRequest) => (
        <div>
          <div className="text-sm text-gray-900">{request.requesterName}</div>
          <div className="text-sm text-gray-500">{request.department}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (request: PurchaseRequest) => (
        <span className="font-medium">{formatCurrency(request.amount)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (request: PurchaseRequest) => (
        <Badge
          variant={
            request.status === 'Approved' ? 'success' :
            request.status === 'Rejected' ? 'error' : 'warning'
          }
        >
          {request.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (request: PurchaseRequest) => formatDate(request.createdAt),
    },
  ];

  const handleRowClick = (request: PurchaseRequest) => {
    // Handle row click - could open modal or navigate to detail view
    console.log('Row clicked:', request);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600">
            {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'cards' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            Cards
          </Button>
          <Button
            variant={viewMode === 'table' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Table
          </Button>
        </div>
      </div>

      {/* Filters */}
      <RequestFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        statusOptions={statusOptions}
        categoryOptions={categoryOptions}
        urgencyOptions={urgencyOptions}
        departmentOptions={departmentOptions}
      />

      {/* Results */}
      {viewMode === 'cards' ? (
        <div className="space-y-4">
          {paginatedRequests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
              <p className="text-gray-600">
                Try adjusting your filters to see more results
              </p>
            </div>
          ) : (
            paginatedRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                showActions={showActions}
              />
            ))
          )}
        </div>
      ) : (
        <DataTable
          data={filteredRequests}
          columns={tableColumns}
          onRowClick={handleRowClick}
          searchable={true}
          filterable={false}
          pageSize={itemsPerPage}
        />
      )}
    </div>
  );
};