import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import type { ExecutionFilters } from '@social-content/shared';

interface HistoryFiltersProps {
  filters: ExecutionFilters;
  onChange: (filters: ExecutionFilters) => void;
}

const periodOptions = [
  { value: 'today', label: 'Hoje' },
  { value: '7days', label: 'Ultimos 7 dias' },
  { value: '30days', label: 'Ultimos 30 dias' },
  { value: '90days', label: 'Ultimos 90 dias' },
  { value: 'custom', label: 'Personalizado' },
];

const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'completed', label: 'Sucesso' },
  { value: 'partial', label: 'Parcial' },
  { value: 'failed', label: 'Falha' },
];

export function HistoryFilters({ filters, onChange }: HistoryFiltersProps) {
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const handlePeriodChange = (value: string) => {
    if (value === 'custom') {
      onChange({ ...filters, period: value });
    } else {
      onChange({
        ...filters,
        period: value,
        startDate: null,
        endDate: null,
      });
    }
    setShowPeriodDropdown(false);
  };

  const handleStatusChange = (value: string) => {
    onChange({ ...filters, status: value });
    setShowStatusDropdown(false);
  };

  const handleDateChange = (type: 'startDate' | 'endDate', value: string) => {
    onChange({
      ...filters,
      period: 'custom',
      [type]: value || null,
    });
  };

  const selectedPeriodLabel = periodOptions.find(p => p.value === filters.period)?.label || 'Periodo';
  const selectedStatusLabel = statusOptions.find(s => s.value === filters.status)?.label || 'Status';

  return (
    <div className="flex flex-wrap gap-4">
      {/* Period filter */}
      <div className="relative">
        <Button
          variant="outline"
          className="w-[180px] justify-between"
          onClick={() => {
            setShowPeriodDropdown(!showPeriodDropdown);
            setShowStatusDropdown(false);
          }}
        >
          {selectedPeriodLabel}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
        {showPeriodDropdown && (
          <div className="absolute top-full left-0 mt-1 w-[180px] bg-popover border rounded-md shadow-lg z-50">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-accent',
                  filters.period === option.value && 'bg-accent'
                )}
                onClick={() => handlePeriodChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom date range picker */}
      {filters.period === 'custom' && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="px-3 py-2 text-sm border rounded-md bg-background"
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            className="px-3 py-2 text-sm border rounded-md bg-background"
          />
        </div>
      )}

      {/* Status filter */}
      <div className="relative">
        <Button
          variant="outline"
          className="w-[150px] justify-between"
          onClick={() => {
            setShowStatusDropdown(!showStatusDropdown);
            setShowPeriodDropdown(false);
          }}
        >
          {selectedStatusLabel}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
        {showStatusDropdown && (
          <div className="absolute top-full left-0 mt-1 w-[150px] bg-popover border rounded-md shadow-lg z-50">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-accent',
                  filters.status === option.value && 'bg-accent'
                )}
                onClick={() => handleStatusChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(showPeriodDropdown || showStatusDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowPeriodDropdown(false);
            setShowStatusDropdown(false);
          }}
        />
      )}
    </div>
  );
}
