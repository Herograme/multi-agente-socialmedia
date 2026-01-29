/**
 * PostStatusBadge Component
 * Story 5.5 - Fluxo de Aprovacao de Posts
 *
 * Badge displaying post approval status.
 */

import { Check, Clock, XCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import type { PostStatus } from '@social-content/shared';

export interface PostStatusBadgeProps {
  /** Post status */
  status: PostStatus;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
}

/**
 * Status configuration
 */
const statusConfig: Record<
  PostStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  pending: {
    label: 'Pendente',
    icon: Clock,
    className: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  },
  approved: {
    label: 'Aprovado',
    icon: Check,
    className: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
  },
  rejected: {
    label: 'Rejeitado',
    icon: XCircle,
    className: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  },
};

/**
 * Size classes
 */
const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

/**
 * Icon size classes
 */
const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

/**
 * PostStatusBadge - Displays post approval status
 *
 * Features:
 * - Color-coded by status
 * - Icon indicator
 * - Multiple size variants
 */
export function PostStatusBadge({
  status,
  size = 'md',
  className,
}: PostStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        config.className,
        sizeClasses[size],
        'inline-flex items-center gap-1.5 font-medium',
        className
      )}
    >
      <Icon className={iconSizeClasses[size]} />
      <span>{config.label}</span>
    </Badge>
  );
}
