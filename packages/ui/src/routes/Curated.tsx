import { CuratedContentList } from '../components/curated/CuratedContentList';
import { CuratedContentHeader } from '../components/curated/CuratedContentHeader';
import { useCuratedContent } from '../hooks/useCuratedContent';

export function Curated() {
  const {
    contents,
    metadata,
    isLoading,
    isError,
    error,
    refetch,
    selectedType,
    setSelectedType,
  } = useCuratedContent();

  return (
    <div className="space-y-6">
      <CuratedContentHeader
        metadata={metadata}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
      />

      <CuratedContentList
        contents={contents}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
      />
    </div>
  );
}
