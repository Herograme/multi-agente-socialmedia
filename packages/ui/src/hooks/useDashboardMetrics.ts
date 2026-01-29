/**
 * useDashboardMetrics Hook
 * Story 5.3: Dashboard Principal com Metricas
 *
 * Manages dashboard metrics data fetching with real-time updates.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { api } from '../lib/api';
import type { DashboardMetrics, ChartData, RecentPost } from '@social-content/shared';

/**
 * Combined dashboard data response.
 */
export interface DashboardData {
  /** Aggregated metrics */
  metrics: DashboardMetrics;
  /** Chart data for visualizations */
  chartData: ChartData;
  /** Recent posts for preview */
  recentPosts: RecentPost[];
}

/**
 * Hook options
 */
export interface UseDashboardMetricsOptions {
  /** How often to refetch in milliseconds (default: 60000) */
  refetchInterval?: number;
  /** Whether to enable automatic refetching */
  enabled?: boolean;
}

/**
 * Fetches all dashboard data in parallel.
 */
async function fetchDashboardData(): Promise<DashboardData> {
  const [metricsRes, chartsRes, postsRes] = await Promise.all([
    api.getDashboardMetrics(),
    api.getDashboardCharts(),
    api.getRecentPosts(5),
  ]);

  return {
    metrics: metricsRes.metrics,
    chartData: chartsRes.chartData,
    recentPosts: postsRes.posts,
  };
}

/**
 * Hook for managing dashboard metrics with caching and real-time updates.
 *
 * Features:
 * - Fetches metrics, charts, and recent posts in parallel
 * - Caches data for 30 seconds (staleTime)
 * - Auto-refetches every minute
 * - Provides refetch callback for manual refresh
 *
 * @param options - Hook configuration options
 * @returns Query result with dashboard data and refetch function
 */
export function useDashboardMetrics(options: UseDashboardMetricsOptions = {}) {
  const { refetchInterval = 60 * 1000, enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: enabled ? refetchInterval : false,
    refetchIntervalInBackground: false,
    enabled,
  });

  // Manual refetch function
  const refetch = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);

  // Invalidate cache when pipeline completes (for future WebSocket integration)
  const handlePipelineComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);

  return {
    ...query,
    refetch,
    handlePipelineComplete,
  };
}

/**
 * Hook specifically for metrics data.
 */
export function useMetrics(options: UseDashboardMetricsOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => api.getDashboardMetrics(),
    staleTime: 30 * 1000,
    enabled,
  });
}

/**
 * Hook specifically for chart data.
 */
export function useChartData(options: UseDashboardMetricsOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['dashboard', 'charts'],
    queryFn: () => api.getDashboardCharts(),
    staleTime: 30 * 1000,
    enabled,
  });
}

/**
 * Hook specifically for recent posts.
 */
export function useRecentPosts(limit: number = 5, options: UseDashboardMetricsOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['dashboard', 'recent-posts', limit],
    queryFn: () => api.getRecentPosts(limit),
    staleTime: 30 * 1000,
    enabled,
  });
}
