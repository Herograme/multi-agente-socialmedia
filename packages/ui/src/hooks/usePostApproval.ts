/**
 * Post Approval Hook
 * Story 5.5 - Fluxo de Aprovacao de Posts
 *
 * Provides mutations for approving, rejecting, and regenerating posts.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './useToast';
import type {
  ApprovePostRequest,
  RejectPostRequest,
  BulkApproveRequest,
  BulkRejectRequest,
  RegeneratePostRequest,
  BulkOperationResponse,
} from '@social-content/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * API client for post approval operations
 */
const approvalApi = {
  approvePost: async (data: ApprovePostRequest) => {
    const response = await fetch(`${API_BASE}/api/posts/${data.postId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
      throw new Error(error.error?.message || 'Failed to approve post');
    }
    return response.json();
  },

  rejectPost: async (data: RejectPostRequest) => {
    const response = await fetch(`${API_BASE}/api/posts/${data.postId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: data.reason }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
      throw new Error(error.error?.message || 'Failed to reject post');
    }
    return response.json();
  },

  regeneratePost: async (data: RegeneratePostRequest) => {
    const response = await fetch(`${API_BASE}/api/posts/${data.postId}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
      throw new Error(error.error?.message || 'Failed to regenerate post');
    }
    return response.json();
  },

  bulkApprove: async (data: BulkApproveRequest): Promise<BulkOperationResponse> => {
    const response = await fetch(`${API_BASE}/api/posts/bulk-approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
      throw new Error(error.error?.message || 'Failed to bulk approve posts');
    }
    return response.json();
  },

  bulkReject: async (data: BulkRejectRequest): Promise<BulkOperationResponse> => {
    const response = await fetch(`${API_BASE}/api/posts/bulk-reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
      throw new Error(error.error?.message || 'Failed to bulk reject posts');
    }
    return response.json();
  },
};

/**
 * Hook for post approval operations
 */
export function usePostApproval() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const invalidatePosts = () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    queryClient.invalidateQueries({ queryKey: ['post'] });
    queryClient.invalidateQueries({ queryKey: ['pendingCount'] });
    queryClient.invalidateQueries({ queryKey: ['statusCounts'] });
  };

  const approvePost = useMutation({
    mutationFn: approvalApi.approvePost,
    onSuccess: () => {
      toast.success('Post aprovado', 'O post foi movido para "Prontos para Publicar"');
      invalidatePosts();
    },
    onError: (error: Error) => {
      toast.error('Erro ao aprovar', error.message);
    },
  });

  const rejectPost = useMutation({
    mutationFn: approvalApi.rejectPost,
    onSuccess: () => {
      toast.success('Post rejeitado', 'O post foi marcado como rejeitado');
      invalidatePosts();
    },
    onError: (error: Error) => {
      toast.error('Erro ao rejeitar', error.message);
    },
  });

  const regeneratePost = useMutation({
    mutationFn: approvalApi.regeneratePost,
    onSuccess: () => {
      toast.success('Regeneracao iniciada', 'O post sera regenerado em breve');
      invalidatePosts();
    },
    onError: (error: Error) => {
      toast.error('Erro ao regenerar', error.message);
    },
  });

  const bulkApprove = useMutation({
    mutationFn: approvalApi.bulkApprove,
    onSuccess: (data, variables) => {
      toast.success(
        'Posts aprovados',
        `${data.updated} de ${variables.postIds.length} post(s) aprovado(s)`
      );
      invalidatePosts();
    },
    onError: (error: Error) => {
      toast.error('Erro ao aprovar posts', error.message);
    },
  });

  const bulkReject = useMutation({
    mutationFn: approvalApi.bulkReject,
    onSuccess: (data, variables) => {
      toast.success(
        'Posts rejeitados',
        `${data.updated} de ${variables.postIds.length} post(s) rejeitado(s)`
      );
      invalidatePosts();
    },
    onError: (error: Error) => {
      toast.error('Erro ao rejeitar posts', error.message);
    },
  });

  return {
    approvePost,
    rejectPost,
    regeneratePost,
    bulkApprove,
    bulkReject,
    isApproving: approvePost.isPending,
    isRejecting: rejectPost.isPending,
    isRegenerating: regeneratePost.isPending,
    isBulkApproving: bulkApprove.isPending,
    isBulkRejecting: bulkReject.isPending,
  };
}
