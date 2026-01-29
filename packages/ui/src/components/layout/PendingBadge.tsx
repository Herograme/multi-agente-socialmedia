/**
 * PendingBadge Component
 * Story 5.5 - Fluxo de Aprovacao de Posts
 *
 * Badge showing pending posts count in sidebar.
 */

import { usePendingCount } from '../../hooks/usePendingCount';
import { cn } from '../../lib/utils';

export interface PendingBadgeProps {
  /** Additional class names */
  className?: string;
}

/**
 * PendingBadge - Shows count of pending posts
 *
 * Features:
 * - Auto-updates via polling
 * - Hidden when count is 0
 * - Shows 99+ for large counts
 */
export function PendingBadge({ className }: PendingBadgeProps) {
  const { data: count, isLoading } = usePendingCount();

  // Don't show if loading, no data, or count is 0
  if (isLoading || !count || count === 0) {
    return null;
  }

  const displayCount = count > 99 ? '99+' : count;

  return (
    <span
      className={cn(
        'ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground',
        className
      )}
    >
      {displayCount}
    </span>
  );
}
