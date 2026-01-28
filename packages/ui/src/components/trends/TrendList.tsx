import type { Trend } from '@social-content/shared';
import { TrendCard } from './TrendCard';
import { TrendSkeleton } from './TrendSkeleton';
import { EmptyTrends } from './EmptyTrends';
import { ErrorState } from './ErrorState';

interface TrendListProps {
  trends: Trend[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isRunning: boolean;
  onResearch: () => void;
  onRetry: () => void;
}

export function TrendList({
  trends,
  isLoading,
  isError,
  error,
  isRunning,
  onResearch,
  onRetry,
}: TrendListProps) {
  // Show skeleton while loading or running
  if (isLoading || isRunning) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <TrendSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <ErrorState
        message={error?.message || 'Erro ao carregar tendências'}
        onRetry={onRetry}
      />
    );
  }

  // Show empty state
  if (trends.length === 0) {
    return <EmptyTrends onResearch={onResearch} />;
  }

  // Show trends grid
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {trends.map((trend) => (
        <TrendCard key={trend.id} trend={trend} />
      ))}
    </div>
  );
}
