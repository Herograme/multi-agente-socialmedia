/**
 * PostPreviewCard Component
 * Story 5.3: Dashboard Principal com Metricas
 *
 * Compact card showing a post preview with thumbnail, topic, platform, and score.
 */

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Instagram, Linkedin, Star, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { RecentPost } from '@social-content/shared';

export interface PostPreviewCardProps {
  /** Post data to display */
  post: RecentPost;
}

/**
 * Status badge styles
 */
const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  approved: 'bg-green-500/10 text-green-500',
  rejected: 'bg-red-500/10 text-red-500',
  needs_review: 'bg-orange-500/10 text-orange-500',
};

/**
 * Status labels in Portuguese
 */
const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  needs_review: 'Revisao',
};

/**
 * Displays a compact preview card for a post.
 * Shows thumbnail, topic, platform icon, score, and status.
 */
export function PostPreviewCard({ post }: PostPreviewCardProps) {
  const PlatformIcon = post.platform === 'instagram' ? Instagram : Linkedin;

  return (
    <Card className="hover:border-primary transition-colors cursor-pointer">
      <CardContent className="p-3">
        {/* Thumbnail */}
        <div className="aspect-square rounded-md bg-muted mb-3 flex items-center justify-center overflow-hidden">
          {post.thumbnailUrl ? (
            <img
              src={post.thumbnailUrl}
              alt={post.topic}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <PlatformIcon className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className={cn('text-xs', statusStyles[post.status])}>
              {statusLabels[post.status]}
            </Badge>
          </div>

          <p className="text-sm font-medium line-clamp-2" title={post.topic}>
            {post.topic}
          </p>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {post.score !== null && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>{post.score.toFixed(1)}</span>
              </div>
            )}
            <span>
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
