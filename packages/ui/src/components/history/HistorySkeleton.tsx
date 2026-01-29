import { Card, CardContent, CardHeader } from '../ui/card';

interface HistorySkeletonProps {
  variant?: 'list' | 'chart';
  count?: number;
}

/**
 * Skeleton loading component for history page
 */
export function HistorySkeleton({ variant = 'list', count = 3 }: HistorySkeletonProps) {
  if (variant === 'chart') {
    return (
      <div className="h-[300px] w-full animate-pulse">
        <div className="flex items-end justify-between h-full gap-2 px-4">
          {/* Fake bar chart bars */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="bg-muted rounded-t flex-1"
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <ExecutionItemSkeleton key={i} />
      ))}
    </div>
  );
}

function ExecutionItemSkeleton() {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Status badge skeleton */}
          <div className="h-6 w-20 rounded-full bg-muted" />
          <div className="space-y-2">
            {/* Date skeleton */}
            <div className="h-5 w-40 rounded bg-muted" />
            {/* Relative time skeleton */}
            <div className="h-4 w-24 rounded bg-muted" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* Duration skeleton */}
          <div className="h-4 w-16 rounded bg-muted" />
          {/* Posts skeleton */}
          <div className="h-4 w-20 rounded bg-muted" />
          {/* Score skeleton */}
          <div className="h-4 w-16 rounded bg-muted" />
          {/* Chevron skeleton */}
          <div className="h-5 w-5 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-4 w-24 rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
