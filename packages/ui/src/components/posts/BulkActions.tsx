/**
 * BulkActions Component
 * Story 5.5 - Fluxo de Aprovacao de Posts
 *
 * Bulk selection and actions for posts.
 */

import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { usePostApproval } from '../../hooks/usePostApproval';

export interface BulkActionsProps {
  /** Array of selected post IDs */
  selectedIds: string[];
  /** Total count of posts in current view */
  totalCount: number;
  /** Callback when select all is toggled */
  onSelectAll: (selected: boolean) => void;
  /** Whether all posts are selected */
  allSelected: boolean;
  /** Callback to clear selection */
  onClearSelection: () => void;
}

type ConfirmAction = 'approve' | 'reject' | null;

/**
 * BulkActions - Bulk selection and action controls
 *
 * Features:
 * - Select all checkbox
 * - Counter showing selection count
 * - Approve selected button
 * - Reject selected button
 * - Confirmation dialog before bulk operations
 */
export function BulkActions({
  selectedIds,
  totalCount,
  onSelectAll,
  allSelected,
  onClearSelection,
}: BulkActionsProps) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const { bulkApprove, bulkReject, isBulkApproving, isBulkRejecting } = usePostApproval();

  const handleBulkApprove = async () => {
    try {
      await bulkApprove.mutateAsync({ postIds: selectedIds });
      onClearSelection();
    } finally {
      setConfirmAction(null);
    }
  };

  const handleBulkReject = async () => {
    try {
      await bulkReject.mutateAsync({ postIds: selectedIds });
      onClearSelection();
    } finally {
      setConfirmAction(null);
    }
  };

  const isLoading = isBulkApproving || isBulkRejecting;
  const hasSelection = selectedIds.length > 0;

  // Don't render if no posts
  if (totalCount === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all"
            checked={allSelected}
            onCheckedChange={(checked) => onSelectAll(!!checked)}
          />
          <label
            htmlFor="select-all"
            className="text-sm font-medium cursor-pointer"
          >
            {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
          </label>
        </div>

        {hasSelection && (
          <>
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} de {totalCount} selecionado(s)
            </span>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                size="sm"
                variant="outline"
                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                onClick={() => setConfirmAction('approve')}
                disabled={isLoading}
              >
                <Check className="h-4 w-4 mr-2" />
                Aprovar Selecionados
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => setConfirmAction('reject')}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Rejeitar Selecionados
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={() => setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'approve' ? 'Aprovar Posts' : 'Rejeitar Posts'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'approve'
                ? `Voce esta prestes a aprovar ${selectedIds.length} post(s). Esta acao ira mover os posts para "Prontos para Publicar".`
                : `Voce esta prestes a rejeitar ${selectedIds.length} post(s). Os posts rejeitados poderao ser regenerados posteriormente.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (confirmAction === 'approve') {
                  handleBulkApprove();
                } else {
                  handleBulkReject();
                }
              }}
              disabled={isLoading}
              className={
                confirmAction === 'reject'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : confirmAction === 'approve' ? (
                'Aprovar'
              ) : (
                'Rejeitar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
