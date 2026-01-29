/**
 * useExecution Hook - Story 5.4
 * Manages execution state and API interactions for the real-time view
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface StartExecutionConfig {
  numPosts?: number;
  sources?: Array<'devto' | 'hackernews' | 'reddit'>;
}

/**
 * Hook to start a new pipeline execution
 */
export function useStartExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: StartExecutionConfig = {}) => {
      const response = await api.startResearchCuratePipeline({
        sources: config.sources,
        limit: config.numPosts,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions'] });
    },
  });
}

/**
 * Hook to cancel a running execution
 */
export function useCancelExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (executionId: string) => {
      await api.cancelPipeline(executionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions'] });
    },
  });
}
