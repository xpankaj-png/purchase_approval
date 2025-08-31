import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Dropdown } from '../ui/Dropdown';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface RequestFiltersProps {
  filters: {
    status: string;
    category: string;
    urgency: string;
    department: string;
    dateRange: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  statusOptions: FilterOption[];
  categoryOptions: FilterOption[];
  urgencyOptions: FilterOption[];
  departmentOptions: FilterOption[];
}

export const RequestFilters: React.FC<RequestFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  statusOptions,
  categoryOptions,
  urgencyOptions,
  departmentOptions,
}) => {
  const activeFiltersCount = Object.values(filters).filter(value => value !== 'all').length;

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: '365', label: 'Last year' },
  ];

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {activeFiltersCount > 0 && (
            <Badge variant="info" size="sm">
              {activeFiltersCount} active
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Status
          </label>
          <Dropdown
            options={statusOptions}
            value={filters.status}
            onChange={(value) => onFilterChange('status', value)}
            placeholder="All Status"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Category
          </label>
          <Dropdown
            options={categoryOptions}
            value={filters.category}
            onChange={(value) => onFilterChange('category', value)}
            placeholder="All Categories"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Urgency
          </label>
          <Dropdown
            options={urgencyOptions}
            value={filters.urgency}
            onChange={(value) => onFilterChange('urgency', value)}
            placeholder="All Urgency"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Department
          </label>
          <Dropdown
            options={departmentOptions}
            value={filters.department}
            onChange={(value) => onFilterChange('department', value)}
            placeholder="All Departments"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <Dropdown
            options={dateRangeOptions}
            value={filters.dateRange}
            onChange={(value) => onFilterChange('dateRange', value)}
            placeholder="All Time"
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
          {Object.entries(filters).map(([key, value]) => {
            if (value === 'all') return null;
            
            const getFilterLabel = (key: string, value: string) => {
              switch (key) {
                case 'status':
                  return statusOptions.find(opt => opt.value === value)?.label || value;
                case 'category':
                  return categoryOptions.find(opt => opt.value === value)?.label || value;
                case 'urgency':
                  return urgencyOptions.find(opt => opt.value === value)?.label || value;
                case 'department':
                  return departmentOptions.find(opt => opt.value === value)?.label || value;
                case 'dateRange':
                  return dateRangeOptions.find(opt => opt.value === value)?.label || value;
                default:
                  return value;
              }
            };

            return (
              <Badge
                key={key}
                variant="default"
                className="flex items-center space-x-1 cursor-pointer hover:bg-gray-200"
                onClick={() => onFilterChange(key, 'all')}
              >
                <span className="text-xs">
                  {key}: {getFilterLabel(key, value)}
                </span>
                <X className="h-3 w-3" />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};