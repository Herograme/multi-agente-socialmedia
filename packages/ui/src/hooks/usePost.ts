import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../lib/api';
import type { Post, Asset } from '@social-content/shared';

// Response types for post endpoints
export interface PostDetailResponse {
  post: Post;
  assets: {
    carousel: Asset[];
    pdf: Asset | null;
  };
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
}

// Extend api with post-related methods
const postApi = {
  getPost: async (postId: string): Promise<PostDetailResponse> => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/posts/${postId}`
    );
    if (!response.ok) {
      throw new ApiError(response.status, `Failed to fetch post: ${response.statusText}`);
    }
    return response.json();
  },

  getPosts: async (params?: { page?: number; limit?: number; status?: string }): Promise<PostListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);

    const queryString = searchParams.toString();
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/posts${
      queryString ? `?${queryString}` : ''
    }`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new ApiError(response.status, `Failed to fetch posts: ${response.statusText}`);
    }
    return response.json();
  },

  updatePostStatus: async (postId: string, status: 'approved' | 'rejected'): Promise<Post> => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/posts/${postId}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }
    );
    if (!response.ok) {
      throw new ApiError(response.status, `Failed to update post status: ${response.statusText}`);
    }
    return response.json();
  },
};

/**
 * Hook for fetching a single post with its assets
 */
export function usePost(postId: string | undefined) {
  const queryClient = useQueryClient();

  const postQuery = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postApi.getPost(postId!),
    enabled: !!postId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: 'approved' | 'rejected') =>
      postApi.updatePostStatus(postId!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  return {
    post: postQuery.data?.post,
    carouselAssets: postQuery.data?.assets.carousel ?? [],
    pdfAsset: postQuery.data?.assets.pdf,
    isLoading: postQuery.isLoading,
    isError: postQuery.isError,
    error: postQuery.error,
    refetch: postQuery.refetch,
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
    hasAssets:
      (postQuery.data?.assets.carousel?.length ?? 0) > 0 ||
      !!postQuery.data?.assets.pdf,
  };
}

/**
 * Hook for fetching a list of posts
 */
export function usePosts(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: () => postApi.getPosts(params),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook for invalidating post queries after visual generation
 */
export function useInvalidatePost() {
  const queryClient = useQueryClient();

  return (postId: string) => {
    queryClient.invalidateQueries({ queryKey: ['post', postId] });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };
}
