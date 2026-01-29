/**
 * Pending Count Hook
 * Story 5.5 - Fluxo de Aprovacao de Posts
 *
 * Provides count of pending posts for sidebar badge.
 */

import { useQuery } from '@tanstack/react-query';
import type { PendingCountResponse, PostStatusCounts } from '@social-content/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Fetch pending posts count
 */
async function fetchPendingCount(): Promise<number> {
  const response = await fetch(`${API_BASE}/api/posts/pending-count`);
  if (!response.ok) {
    throw new Error('Failed to fetch pending count');
  }
  const data: PendingCountResponse = await response.json();
  return data.count;
}

/**
 * Fetch all status counts
 */
async function fetchStatusCounts(): Promise<PostStatusCounts> {
  const response = await fetch(`${API_BASE}/api/posts/status-counts`);
  if (!response.ok) {
    throw new Error('Failed to fetch status counts');
  }
  return response.json();
}

/**
 * Hook for fetching pending posts count
 * Useful for sidebar badge
 */
export function usePendingCount() {
  return useQuery({
    queryKey: ['pendingCount'],
    queryFn: fetchPendingCount,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider stale after 10 seconds
  });
}

/**
 * Hook for fetching all status counts
 * Useful for status filter tabs
 */
export function useStatusCounts() {
  return useQuery({
    queryKey: ['statusCounts'],
    queryFn: fetchStatusCounts,
    refetchInterval: 30000,
    staleTime: 10000,
  });
}
