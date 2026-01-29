import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ExecutionFilters } from '@social-content/shared';

/**
 * Hook to fetch paginated list of executions
 */
export function useExecutions(filters: ExecutionFilters) {
  return useQuery({
    queryKey: ['executions', filters],
    queryFn: async () => {
      const executions = await api.getExecutions(filters);
      return executions;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch single execution with posts
 */
export function useExecution(executionId: string) {
  return useQuery({
    queryKey: ['execution', executionId],
    queryFn: async () => {
      const execution = await api.getExecution(executionId);
      return execution;
    },
    enabled: !!executionId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch aggregated statistics
 */
export function useExecutionStats(filters: ExecutionFilters) {
  return useQuery({
    queryKey: ['executionStats', filters],
    queryFn: async () => {
      const stats = await api.getExecutionStats(filters);
      return stats;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
