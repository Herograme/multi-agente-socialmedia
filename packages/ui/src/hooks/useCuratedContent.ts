import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CuratedContentType } from '@social-content/shared';

export function useCuratedContent() {
  const [selectedType, setSelectedType] = useState<CuratedContentType | 'all'>('all');

  const curatedQuery = useQuery({
    queryKey: ['curatedContent', { type: selectedType }],
    queryFn: () => api.getCuratorResults({ type: selectedType === 'all' ? undefined : selectedType }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
  });

  return {
    contents: curatedQuery.data?.contents ?? [],
    metadata: curatedQuery.data?.metadata,
    isLoading: curatedQuery.isLoading,
    isError: curatedQuery.isError,
    error: curatedQuery.error,
    refetch: curatedQuery.refetch,
    selectedType,
    setSelectedType,
  };
}
