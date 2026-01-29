/**
 * StatusFilter Component
 * Story 5.5 - Fluxo de Aprovacao de Posts
 *
 * Tabs for filtering posts by status.
 */

import { useSearchParams } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import type { PostStatusCounts } from '@social-content/shared';

export type FilterValue = 'all' | 'pending' | 'approved' | 'rejected';

export interface StatusFilterProps {
  /** Status counts for badges */
  counts: PostStatusCounts;
  /** Optional controlled value */
  value?: FilterValue;
  /** Callback when value changes (for controlled mode) */
  onChange?: (value: FilterValue) => void;
}

const filterOptions: Array<{
  value: FilterValue;
  label: string;
  badgeVariant: 'default' | 'secondary' | 'success' | 'destructive';
}> = [
  { value: 'all', label: 'Todos', badgeVariant: 'secondary' },
  { value: 'pending', label: 'Pendentes', badgeVariant: 'default' },
  { value: 'approved', label: 'Aprovados', badgeVariant: 'success' },
  { value: 'rejected', label: 'Rejeitados', badgeVariant: 'destructive' },
];

/**
 * StatusFilter - Tabs for filtering posts by status
 *
 * Features:
 * - All / Pending / Approved / Rejected tabs
 * - Badge with count for each status
 * - Syncs with URL query params
 * - Controlled or uncontrolled mode
 */
export function StatusFilter({ counts, value, onChange }: StatusFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Use URL param if not controlled
  const currentStatus = value ?? (searchParams.get('status') as FilterValue) ?? 'all';

  const handleChange = (newValue: FilterValue) => {
    if (onChange) {
      onChange(newValue);
    } else {
      const newParams = new URLSearchParams(searchParams);
      if (newValue === 'all') {
        newParams.delete('status');
      } else {
        newParams.set('status', newValue);
      }
      setSearchParams(newParams);
    }
  };

  const getCount = (filterValue: FilterValue): number => {
    switch (filterValue) {
      case 'all':
        return counts.all;
      case 'pending':
        return counts.pending;
      case 'approved':
        return counts.approved;
      case 'rejected':
        return counts.rejected;
      default:
        return 0;
    }
  };

  const getBadgeClasses = (
    filterValue: FilterValue,
    isActive: boolean
  ): string => {
    const baseClasses = 'ml-1.5';

    if (filterValue === 'approved') {
      return cn(
        baseClasses,
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      );
    }

    if (filterValue === 'rejected') {
      return cn(
        baseClasses,
        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      );
    }

    if (filterValue === 'pending' && getCount('pending') > 0) {
      return cn(baseClasses, 'bg-primary text-primary-foreground');
    }

    return cn(baseClasses, isActive ? '' : 'bg-muted text-muted-foreground');
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
      {filterOptions.map((option) => {
        const isActive = currentStatus === option.value;
        const count = getCount(option.value);

        return (
          <button
            key={option.value}
            onClick={() => handleChange(option.value)}
            className={cn(
              'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
            <Badge
              variant="secondary"
              className={getBadgeClasses(option.value, isActive)}
            >
              {count}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
