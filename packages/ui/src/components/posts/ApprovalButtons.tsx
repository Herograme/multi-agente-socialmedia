/**
 * ApprovalButtons Component
 * Story 5.5 - Fluxo de Aprovacao de Posts
 *
 * Displays approve (check) and reject (X) buttons for pending posts.
 */

import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip';
import { usePostApproval } from '../../hooks/usePostApproval';
import type { PostStatus } from '@social-content/shared';

export interface ApprovalButtonsProps {
  /** Post ID to approve/reject */
  postId: string;
  /** Current post status */
  status: PostStatus;
  /** Callback when reject button is clicked (to open dialog) */
  onRejectClick: () => void;
  /** Whether buttons are disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'default';
}

/**
 * ApprovalButtons - Approve and reject buttons for pending posts
 *
 * Features:
 * - Green check button for approve
 * - Red X button for reject
 * - Loading states during API calls
 * - Tooltips with keyboard shortcuts
 * - Only visible for pending posts
 */
export function ApprovalButtons({
  postId,
  status,
  onRejectClick,
  disabled = false,
  size = 'sm',
}: ApprovalButtonsProps) {
  const { approvePost, isApproving } = usePostApproval();

  const handleApprove = async () => {
    await approvePost.mutateAsync({ postId });
  };

  // Only show buttons for pending posts
  if (status !== 'pending') {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size={size}
            variant="outline"
            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 border-green-200 dark:border-green-800"
            onClick={handleApprove}
            disabled={disabled || isApproving}
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span className="hidden sm:inline ml-1">Aprovar</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Aprovar post (A)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size={size}
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-800"
            onClick={onRejectClick}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Rejeitar</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Rejeitar post (R)</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
