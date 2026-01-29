// ApprovalBadge Component - Social Content Agent
// Story 4.6: Quality Gate e Threshold

import { Check, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

/**
 * Approval status for quality gate evaluation
 */
export enum PostApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  NEEDS_REVIEW = 'needs_review',
  REJECTED = 'rejected',
}

interface ApprovalBadgeProps {
  /** Current approval status */
  status: PostApprovalStatus;
  /** QA score (0-10) */
  score?: number;
  /** Quality threshold used */
  threshold?: number;
  /** Whether to show score instead of label */
  showScore?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
}

/**
 * Configuration for each approval status
 */
const statusConfig = {
  [PostApprovalStatus.APPROVED]: {
    label: 'Aprovado',
    icon: Check,
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  [PostApprovalStatus.NEEDS_REVIEW]: {
    label: 'Revisao Necessaria',
    icon: AlertTriangle,
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  [PostApprovalStatus.PENDING]: {
    label: 'Pendente',
    icon: Clock,
    className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  },
  [PostApprovalStatus.REJECTED]: {
    label: 'Rejeitado',
    icon: XCircle,
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
};

/**
 * Size classes for the badge
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
 * ApprovalBadge - Displays approval status with visual indicator
 *
 * Features:
 * - Color-coded status (green=approved, yellow=needs_review, gray=pending, red=rejected)
 * - Icon indicator for each status
 * - Optional score display
 * - Tooltip with score/threshold details (when score is provided)
 * - Three size variants
 */
export function ApprovalBadge({
  status,
  score,
  threshold = 6.0,
  showScore = false,
  size = 'md',
  className,
}: ApprovalBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const badge = (
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
      {showScore && score !== undefined ? (
        <span>{score.toFixed(1)}</span>
      ) : (
        <span>{config.label}</span>
      )}
    </Badge>
  );

  // If we have score data, wrap with tooltip
  if (score !== undefined) {
    return (
      <div className="group relative inline-block">
        {badge}
        <div
          className={cn(
            'absolute bottom-full left-1/2 -translate-x-1/2 mb-2',
            'bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            'pointer-events-none z-50',
            'shadow-lg border border-gray-700'
          )}
        >
          <div className="space-y-1">
            <p>
              <span className="font-medium">Score:</span> {score.toFixed(1)}/10
            </p>
            <p>
              <span className="font-medium">Threshold:</span> {threshold.toFixed(1)}
            </p>
            <p>
              <span className="font-medium">Status:</span> {config.label}
            </p>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      </div>
    );
  }

  return badge;
}

/**
 * ApprovalIndicator - Compact icon-only indicator for lists
 */
export function ApprovalIndicator({
  status,
  className,
}: {
  status: PostApprovalStatus;
  className?: string;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center',
        config.className.split(' ').find((c) => c.startsWith('text-')),
        className
      )}
      title={config.label}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

/**
 * Score badge showing just the numeric score with color coding
 */
export function ScoreBadge({
  score,
  threshold = 6.0,
  size = 'md',
  className,
}: {
  score: number;
  threshold?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const status =
    score >= threshold
      ? PostApprovalStatus.APPROVED
      : PostApprovalStatus.NEEDS_REVIEW;

  return (
    <ApprovalBadge
      status={status}
      score={score}
      threshold={threshold}
      showScore
      size={size}
      className={className}
    />
  );
}
