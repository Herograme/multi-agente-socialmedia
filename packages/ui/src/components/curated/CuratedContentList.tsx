import type { CuratedContent } from '@social-content/shared';
import { CuratedContentCard } from './CuratedContentCard';
import { CuratedContentSkeleton } from './CuratedContentSkeleton';
import { EmptyCurated } from './EmptyCurated';
import { CuratedErrorState } from './CuratedErrorState';

interface CuratedContentListProps {
  contents: CuratedContent[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
}

export function CuratedContentList({
  contents,
  isLoading,
  isError,
  error,
  onRetry,
}: CuratedContentListProps) {
  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CuratedContentSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <CuratedErrorState
        message={error?.message || 'Erro ao carregar conteudo curado'}
        onRetry={onRetry}
      />
    );
  }

  // Show empty state
  if (contents.length === 0) {
    return <EmptyCurated />;
  }

  // Show content grid
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {contents.map((content) => (
        <CuratedContentCard key={content.id} content={content} />
      ))}
    </div>
  );
}
