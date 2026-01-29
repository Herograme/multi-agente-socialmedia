import { Skeleton } from '../ui/skeleton';

export function SettingsSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-44" />
        </div>
      </div>

      <Skeleton className="h-[1px] w-full" />

      {/* Settings sections skeletons */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border rounded-lg px-4 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <div>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64 mt-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
