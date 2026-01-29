/**
 * Post Approval Hook
 * Story 5.5 - Fluxo de Aprovacao de Posts
 *
 * Provides mutations for approving, rejecting, and regenerating posts.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/ui/toast';
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
  const { addToast } = useToast();

  const invalidatePosts = () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    queryClient.invalidateQueries({ queryKey: ['post'] });
    queryClient.invalidateQueries({ queryKey: ['pendingCount'] });
    queryClient.invalidateQueries({ queryKey: ['statusCounts'] });
  };

  const approvePost = useMutation({
    mutationFn: approvalApi.approvePost,
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Post aprovado',
        description: 'O post foi movido para "Prontos para Publicar"',
      });
      invalidatePosts();
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        title: 'Erro ao aprovar',
        description: error.message,
      });
    },
  });

  const rejectPost = useMutation({
    mutationFn: approvalApi.rejectPost,
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Post rejeitado',
        description: 'O post foi marcado como rejeitado',
      });
      invalidatePosts();
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        title: 'Erro ao rejeitar',
        description: error.message,
      });
    },
  });

  const regeneratePost = useMutation({
    mutationFn: approvalApi.regeneratePost,
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Regeneracao iniciada',
        description: 'O post sera regenerado em breve',
      });
      invalidatePosts();
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        title: 'Erro ao regenerar',
        description: error.message,
      });
    },
  });

  const bulkApprove = useMutation({
    mutationFn: approvalApi.bulkApprove,
    onSuccess: (data, variables) => {
      addToast({
        type: 'success',
        title: 'Posts aprovados',
        description: `${data.updated} de ${variables.postIds.length} post(s) aprovado(s)`,
      });
      invalidatePosts();
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        title: 'Erro ao aprovar posts',
        description: error.message,
      });
    },
  });

  const bulkReject = useMutation({
    mutationFn: approvalApi.bulkReject,
    onSuccess: (data, variables) => {
      addToast({
        type: 'success',
        title: 'Posts rejeitados',
        description: `${data.updated} de ${variables.postIds.length} post(s) rejeitado(s)`,
      });
      invalidatePosts();
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        title: 'Erro ao rejeitar posts',
        description: error.message,
      });
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
