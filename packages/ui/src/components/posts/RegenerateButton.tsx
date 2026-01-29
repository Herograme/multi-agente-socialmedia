/**
 * RegenerateButton Component
 * Story 5.5 - Fluxo de Aprovacao de Posts
 *
 * Button to regenerate rejected posts.
 */

import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip';
import { usePostApproval } from '../../hooks/usePostApproval';
import type { PostStatus } from '@social-content/shared';

export interface RegenerateButtonProps {
  /** Post ID to regenerate */
  postId: string;
  /** Current post status */
  status: PostStatus;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'default';
  /** Show label text */
  showLabel?: boolean;
}

/**
 * RegenerateButton - Button to queue post regeneration
 *
 * Features:
 * - Only visible for rejected posts
 * - Loading state during regeneration request
 * - Tooltip with action description
 */
export function RegenerateButton({
  postId,
  status,
  disabled = false,
  size = 'sm',
  showLabel = true,
}: RegenerateButtonProps) {
  const { regeneratePost, isRegenerating } = usePostApproval();

  // Only show for rejected posts
  if (status !== 'rejected') {
    return null;
  }

  const handleRegenerate = async () => {
    await regeneratePost.mutateAsync({ postId });
  };

  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          size={size}
          variant="outline"
          onClick={handleRegenerate}
          disabled={disabled || isRegenerating}
          className="gap-2"
        >
          {isRegenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {showLabel && <span>Regenerar</span>}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Gerar novo conteudo para este topico</p>
      </TooltipContent>
    </Tooltip>
  );
}
