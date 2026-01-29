/**
 * ExecutionSkeleton Component
 * Loading skeleton for the execution page
 */

import { Card, CardContent, CardHeader } from '../ui/card';

export function ExecutionSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
      </div>

      {/* Pipeline Flow Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 py-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="w-24 h-32 bg-muted rounded-xl animate-pulse" />
                {i < 7 && <div className="w-8 h-4 bg-muted rounded mx-2 animate-pulse" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logs and Preview Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-[400px] bg-muted rounded-lg animate-pulse" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-6 w-24 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-[400px] bg-muted rounded-lg animate-pulse" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
