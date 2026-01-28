import { TrendList } from '../components/trends/TrendList';
import { TrendHeader } from '../components/trends/TrendHeader';
import { useTrends } from '../hooks/useTrends';

export function Trends() {
  const {
    trends,
    metadata,
    isLoading,
    isError,
    error,
    runResearcher,
    isRunning,
    refetch,
  } = useTrends();

  return (
    <div className="space-y-6">
      <TrendHeader
        metadata={metadata}
        isRunning={isRunning}
        onResearch={runResearcher}
      />

      <TrendList
        trends={trends}
        isLoading={isLoading}
        isError={isError}
        error={error}
        isRunning={isRunning}
        onResearch={runResearcher}
        onRetry={refetch}
      />
    </div>
  );
}
