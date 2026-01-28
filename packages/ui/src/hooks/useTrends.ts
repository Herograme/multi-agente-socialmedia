import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useTrends() {
  const queryClient = useQueryClient();

  const trendsQuery = useQuery({
    queryKey: ['trends'],
    queryFn: () => api.getResearcherResults(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
  });

  const runResearcherMutation = useMutation({
    mutationFn: () => api.runResearcher(),
    onSuccess: () => {
      // Invalidate and refetch after a delay (agent takes time to execute)
      // We poll for updates
      const pollInterval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['trends'] });
      }, 3000);

      // Stop polling after 30 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
        queryClient.invalidateQueries({ queryKey: ['trends'] });
      }, 30000);
    },
  });

  return {
    trends: trendsQuery.data?.trends ?? [],
    metadata: trendsQuery.data?.metadata,
    isLoading: trendsQuery.isLoading,
    isError: trendsQuery.isError,
    error: trendsQuery.error,
    refetch: trendsQuery.refetch,
    runResearcher: runResearcherMutation.mutate,
    isRunning: runResearcherMutation.isPending,
    runError: runResearcherMutation.error,
  };
}
