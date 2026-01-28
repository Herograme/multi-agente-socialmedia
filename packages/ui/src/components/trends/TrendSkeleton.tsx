import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';

export function TrendSkeleton() {
  return (
    <Card className="flex flex-col h-full animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {/* Source badge skeleton */}
          <div className="h-5 w-16 rounded-full bg-muted" />
          {/* Date skeleton */}
          <div className="h-4 w-20 rounded bg-muted" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        {/* Title skeleton - 3 lines */}
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-5/6 rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
      </CardContent>
      <CardFooter className="pt-3">
        {/* Button skeleton */}
        <div className="h-9 w-full rounded-md bg-muted" />
      </CardFooter>
    </Card>
  );
}
