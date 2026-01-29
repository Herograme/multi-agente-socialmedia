/**
 * RecentPosts Component
 * Story 5.3: Dashboard Principal com Metricas
 *
 * Grid of recent post preview cards with empty state.
 */

import { Link } from 'react-router-dom';
import { PostPreviewCard } from './PostPreviewCard';
import { FileText } from 'lucide-react';
import type { RecentPost } from '@social-content/shared';

export interface RecentPostsProps {
  /** List of recent posts to display */
  posts: RecentPost[];
}

/**
 * Displays a responsive grid of recent post preview cards.
 * Shows an empty state when no posts are available.
 */
export function RecentPosts({ posts }: RecentPostsProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Nenhum post ainda</h3>
        <p className="text-muted-foreground">
          Execute o pipeline para gerar seus primeiros posts.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {posts.map((post) => (
        <Link key={post.id} to={`/posts/${post.id}`}>
          <PostPreviewCard post={post} />
        </Link>
      ))}
    </div>
  );
}
