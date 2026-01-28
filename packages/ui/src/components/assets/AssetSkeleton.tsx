import { Card } from '../ui/card';

export interface GallerySkeletonProps {
  /** Number of thumbnail skeletons to show */
  thumbnailCount?: number;
}

/**
 * Skeleton loading state for CarouselGallery component
 */
export function GallerySkeleton({ thumbnailCount = 5 }: GallerySkeletonProps) {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Main preview skeleton */}
      <div className="aspect-square bg-muted rounded-lg" />

      {/* Thumbnails skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: thumbnailCount }).map((_, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-16 h-16 rounded-md bg-muted"
          />
        ))}
      </div>

      {/* Download buttons skeleton */}
      <div className="flex gap-2">
        <div className="h-10 w-32 rounded-md bg-muted" />
        <div className="h-10 w-44 rounded-md bg-muted" />
      </div>
    </div>
  );
}

/**
 * Skeleton loading state for PDFViewer component
 */
export function PDFSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-8 w-8 rounded bg-muted" />
      </div>

      {/* PDF content skeleton */}
      <div className="border rounded-lg overflow-hidden bg-muted h-[600px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded bg-muted-foreground/20" />
          <div className="h-4 w-24 rounded bg-muted-foreground/20" />
        </div>
      </div>

      {/* Download button skeleton */}
      <div className="h-10 w-32 rounded-md bg-muted" />
    </div>
  );
}

/**
 * Skeleton for post detail page - combines gallery and PDF skeletons
 */
export function PostAssetsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Carousel section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-6 w-24 rounded bg-muted animate-pulse" />
          <GallerySkeleton />
        </div>
      </Card>

      {/* PDF section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-6 w-16 rounded bg-muted animate-pulse" />
          <PDFSkeleton />
        </div>
      </Card>
    </div>
  );
}

/**
 * Compact skeleton for asset card in list view
 */
export function AssetCardSkeleton() {
  return (
    <Card className="p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-md bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
        <div className="h-8 w-20 rounded bg-muted" />
      </div>
    </Card>
  );
}
