/**
 * RejectDialog Component
 * Story 5.5 - Fluxo de Aprovacao de Posts
 *
 * Dialog for rejecting a post with an optional reason.
 */

import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { usePostApproval } from '../../hooks/usePostApproval';

export interface RejectDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Post ID to reject */
  postId: string;
  /** Callback after successful rejection */
  onSuccess?: () => void;
}

/**
 * RejectDialog - Modal for rejecting posts with optional reason
 *
 * Features:
 * - Optional textarea for rejection reason
 * - Auto-focus on textarea when opened
 * - Enter to confirm (Shift+Enter for new line)
 * - Loading state during submission
 */
export function RejectDialog({
  open,
  onOpenChange,
  postId,
  onSuccess,
}: RejectDialogProps) {
  const [reason, setReason] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { rejectPost, isRejecting } = usePostApproval();

  // Auto-focus textarea when dialog opens
  useEffect(() => {
    if (open && textareaRef.current) {
      // Small delay to ensure dialog is rendered
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Reset reason when dialog closes
  useEffect(() => {
    if (!open) {
      setReason('');
    }
  }, [open]);

  const handleReject = async () => {
    try {
      await rejectPost.mutateAsync({
        postId,
        reason: reason.trim() || undefined,
      });
      setReason('');
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Error handling is done in the hook
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift submits the form
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReject();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rejeitar Post</DialogTitle>
          <DialogDescription>
            Informe o motivo da rejeicao (opcional). Isso ajuda a melhorar
            futuras geracoes de conteudo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea
              id="reason"
              ref={textareaRef}
              placeholder="Ex: Texto muito generico, falta de exemplos de codigo, tom inadequado..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              disabled={isRejecting}
            />
            <p className="text-xs text-muted-foreground">
              Pressione Enter para confirmar ou Shift+Enter para nova linha
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRejecting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isRejecting}
          >
            {isRejecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rejeitando...
              </>
            ) : (
              'Rejeitar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
