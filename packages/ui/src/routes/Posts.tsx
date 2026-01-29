/**
 * Posts Page
 * Story 5.5 - Fluxo de Aprovacao de Posts
 *
 * Displays posts with approval workflow.
 */

import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { TooltipProvider } from '../components/ui/tooltip';
import {
  ApprovalButtons,
  RejectDialog,
  RegenerateButton,
  StatusFilter,
  BulkActions,
  PostStatusBadge,
  type FilterValue,
} from '../components/posts';
import { Checkbox } from '../components/ui/checkbox';
import { usePosts } from '../hooks/usePost';
import { useStatusCounts } from '../hooks/usePendingCount';
import { useApprovalShortcuts } from '../hooks/useApprovalShortcuts';
import { usePostApproval } from '../hooks/usePostApproval';
import { cn } from '../lib/utils';
import type { Post } from '@social-content/shared';

export function Posts() {
  const [searchParams] = useSearchParams();
  const statusFilter = (searchParams.get('status') as FilterValue) || 'all';

  // Posts query
  const { data: postsData, isLoading } = usePosts({
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  // Status counts for filter badges
  const { data: statusCounts } = useStatusCounts();

  // Local state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [focusedPostId, setFocusedPostId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectPostId, setRejectPostId] = useState<string | null>(null);

  // Approval hook for shortcuts
  const { approvePost } = usePostApproval();

  const posts = postsData?.posts || [];
  const allSelected = posts.length > 0 && selectedIds.length === posts.length;

  // Handlers
  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedIds(posts.map((p) => p.id));
      } else {
        setSelectedIds([]);
      }
    },
    [posts]
  );

  const handleToggleSelect = useCallback((postId: string) => {
    setSelectedIds((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const handleRejectClick = useCallback((postId: string) => {
    setRejectPostId(postId);
    setRejectDialogOpen(true);
  }, []);

  const handleApproveShortcut = useCallback(() => {
    if (focusedPostId) {
      const post = posts.find((p) => p.id === focusedPostId);
      if (post?.status === 'pending') {
        approvePost.mutate({ postId: focusedPostId });
      }
    }
  }, [focusedPostId, posts, approvePost]);

  const handleRejectShortcut = useCallback(() => {
    if (focusedPostId) {
      const post = posts.find((p) => p.id === focusedPostId);
      if (post?.status === 'pending') {
        handleRejectClick(focusedPostId);
      }
    }
  }, [focusedPostId, posts, handleRejectClick]);

  const handleEscapeShortcut = useCallback(() => {
    setFocusedPostId(null);
    setSelectedIds([]);
  }, []);

  // Keyboard shortcuts
  useApprovalShortcuts({
    onApprove: handleApproveShortcut,
    onReject: handleRejectShortcut,
    onEscape: handleEscapeShortcut,
    enabled: !!focusedPostId && !rejectDialogOpen,
  });

  const defaultCounts = {
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Posts</h1>
            <p className="text-muted-foreground">
              Gerencie seus posts gerados - aprove, rejeite ou regenere
            </p>
          </div>
        </div>

        {/* Status Filter */}
        <StatusFilter counts={statusCounts || defaultCounts} />

        {/* Bulk Actions */}
        <BulkActions
          selectedIds={selectedIds}
          totalCount={posts.length}
          onSelectAll={handleSelectAll}
          allSelected={allSelected}
          onClearSelection={handleClearSelection}
        />

        {/* Posts Grid */}
        <div className="grid gap-4">
          {isLoading ? (
            // Loading state
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 w-48 bg-muted rounded" />
                  <div className="h-4 w-32 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-3/4 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : posts.length === 0 ? (
            // Empty state
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">Nenhum post encontrado</p>
                <p className="text-sm mt-1">
                  {statusFilter !== 'all'
                    ? `Nao ha posts com status "${statusFilter}"`
                    : 'Execute o pipeline para gerar novos posts'}
                </p>
              </CardContent>
            </Card>
          ) : (
            // Posts list
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isSelected={selectedIds.includes(post.id)}
                isFocused={focusedPostId === post.id}
                onToggleSelect={() => handleToggleSelect(post.id)}
                onFocus={() => setFocusedPostId(post.id)}
                onRejectClick={() => handleRejectClick(post.id)}
              />
            ))
          )}
        </div>

        {/* Reject Dialog */}
        {rejectPostId && (
          <RejectDialog
            open={rejectDialogOpen}
            onOpenChange={setRejectDialogOpen}
            postId={rejectPostId}
            onSuccess={() => setRejectPostId(null)}
          />
        )}

        {/* Keyboard shortcuts hint */}
        {focusedPostId && (
          <div className="fixed bottom-4 right-4 bg-background border rounded-lg px-4 py-2 shadow-lg text-sm text-muted-foreground">
            <span className="font-medium">Atalhos:</span>{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">A</kbd> Aprovar{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">R</kbd> Rejeitar{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Esc</kbd> Limpar
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// Post Card Component
interface PostCardProps {
  post: Post;
  isSelected: boolean;
  isFocused: boolean;
  onToggleSelect: () => void;
  onFocus: () => void;
  onRejectClick: () => void;
}

function PostCard({
  post,
  isSelected,
  isFocused,
  onToggleSelect,
  onFocus,
  onRejectClick,
}: PostCardProps) {
  return (
    <Card
      className={cn(
        'transition-all cursor-pointer',
        isFocused && 'ring-2 ring-primary',
        isSelected && 'bg-muted/50'
      )}
      onClick={onFocus}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect()}
              onClick={(e) => e.stopPropagation()}
              className="mt-1"
            />
            <div>
              <CardTitle className="text-base">
                {post.topicId || 'Post sem topico'}
              </CardTitle>
              <CardDescription className="mt-1">
                Criado em {new Date(post.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </CardDescription>
            </div>
          </div>
          <PostStatusBadge status={post.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Post content preview */}
        {post.textInstagram && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Instagram
            </p>
            <p className="text-sm line-clamp-3">{post.textInstagram}</p>
          </div>
        )}

        {post.textLinkedin && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              LinkedIn
            </p>
            <p className="text-sm line-clamp-3">{post.textLinkedin}</p>
          </div>
        )}

        {/* Rejection reason */}
        {post.status === 'rejected' && post.rejectionReason && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
              Motivo da rejeicao
            </p>
            <p className="text-sm text-muted-foreground">
              {post.rejectionReason}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div
          className="flex items-center justify-end gap-2 pt-2 border-t"
          onClick={(e) => e.stopPropagation()}
        >
          <ApprovalButtons
            postId={post.id}
            status={post.status}
            onRejectClick={onRejectClick}
          />
          <RegenerateButton postId={post.id} status={post.status} />
        </div>
      </CardContent>
    </Card>
  );
}
