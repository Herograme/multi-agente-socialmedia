// Quality Metrics Hooks - Social Content Agent
// Story 4.6: Quality Gate e Threshold

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Metrics period type
 */
export type MetricsPeriod = '24h' | '7d' | '30d' | 'all';

/**
 * Score distribution by bucket
 */
export interface ScoreDistribution {
  '0-2': number;
  '2-4': number;
  '4-6': number;
  '6-8': number;
  '8-10': number;
}

/**
 * Quality metrics response
 */
export interface QualityMetrics {
  totalPosts: number;
  approvedCount: number;
  needsReviewCount: number;
  approvalRate: number;
  averageScore: number;
  scoreDistribution: ScoreDistribution;
  period: MetricsPeriod;
  calculatedAt: string;
  cached: boolean;
}

/**
 * Threshold configuration
 */
export interface ThresholdConfig {
  threshold: number;
  autoRegenerate: boolean;
  maxRegenerations: number;
}

/**
 * Update threshold response
 */
export interface UpdateThresholdResponse {
  success: boolean;
  threshold: number;
  message: string;
}

// API base URL
const API_BASE = import.meta.env['VITE_API_URL'] || 'http://localhost:3001';

/**
 * Fetches quality metrics from the API
 */
async function fetchQualityMetrics(period: MetricsPeriod): Promise<QualityMetrics> {
  const response = await fetch(`${API_BASE}/api/metrics/quality?period=${period}`);
  if (!response.ok) {
    throw new Error('Failed to fetch quality metrics');
  }
  return response.json();
}

/**
 * Fetches threshold configuration from the API
 */
async function fetchThresholdConfig(): Promise<ThresholdConfig> {
  const response = await fetch(`${API_BASE}/api/config/threshold`);
  if (!response.ok) {
    throw new Error('Failed to fetch threshold config');
  }
  return response.json();
}

/**
 * Updates the quality threshold
 */
async function updateThreshold(threshold: number): Promise<UpdateThresholdResponse> {
  const response = await fetch(`${API_BASE}/api/config/threshold`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ threshold }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update threshold');
  }
  return response.json();
}

interface UseQualityMetricsOptions {
  /** Time period for metrics */
  period?: MetricsPeriod;
  /** Whether the query is enabled */
  enabled?: boolean;
}

/**
 * Hook for fetching quality metrics
 *
 * @example
 * ```tsx
 * const { metrics, isLoading, error } = useQualityMetrics({ period: '7d' });
 * ```
 */
export function useQualityMetrics(options: UseQualityMetricsOptions = {}) {
  const { period = '7d', enabled = true } = options;

  const query = useQuery({
    queryKey: ['qualityMetrics', period],
    queryFn: () => fetchQualityMetrics(period),
    staleTime: 5 * 60 * 1000, // 5 minutes (matches backend cache)
    enabled,
  });

  return {
    metrics: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

/**
 * Hook for managing quality threshold configuration
 *
 * @example
 * ```tsx
 * const { threshold, updateThreshold, isUpdating } = useQualityThreshold();
 *
 * // Update threshold
 * await updateThreshold(7.5);
 * ```
 */
export function useQualityThreshold() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['qualityThreshold'],
    queryFn: fetchThresholdConfig,
    staleTime: 60 * 1000, // 1 minute
  });

  const mutation = useMutation({
    mutationFn: updateThreshold,
    onSuccess: () => {
      // Invalidate both threshold config and metrics queries
      queryClient.invalidateQueries({ queryKey: ['qualityThreshold'] });
      queryClient.invalidateQueries({ queryKey: ['qualityMetrics'] });
    },
  });

  return {
    threshold: query.data?.threshold ?? 6.0,
    autoRegenerate: query.data?.autoRegenerate ?? true,
    maxRegenerations: query.data?.maxRegenerations ?? 1,
    config: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updateThreshold: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for score distribution data (useful for charts)
 *
 * @example
 * ```tsx
 * const { distribution, labels, total, isLoading } = useScoreDistribution();
 * ```
 */
export function useScoreDistribution() {
  const { metrics, isLoading, isError, error } = useQualityMetrics({ period: 'all' });

  const distribution = metrics?.scoreDistribution;
  const labels = ['0-2', '2-4', '4-6', '6-8', '8-10'] as const;

  const data = distribution
    ? labels.map((label) => distribution[label])
    : [];

  return {
    distribution,
    labels,
    data,
    total: metrics?.totalPosts ?? 0,
    isLoading,
    isError,
    error,
  };
}
