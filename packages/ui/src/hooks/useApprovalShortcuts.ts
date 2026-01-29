/**
 * Approval Shortcuts Hook
 * Story 5.5 - Fluxo de Aprovacao de Posts
 *
 * Keyboard shortcuts for post approval workflow.
 * - 'A' key: Approve selected post
 * - 'R' key: Open reject dialog for selected post
 * - 'Escape' key: Cancel current action
 */

import { useEffect, useCallback } from 'react';

export interface UseApprovalShortcutsOptions {
  /** Callback when 'A' key is pressed */
  onApprove: () => void;
  /** Callback when 'R' key is pressed */
  onReject: () => void;
  /** Callback when 'Escape' key is pressed */
  onEscape?: () => void;
  /** Whether shortcuts are enabled */
  enabled?: boolean;
}

/**
 * Hook for keyboard shortcuts in approval workflow
 *
 * @example
 * ```tsx
 * useApprovalShortcuts({
 *   onApprove: () => handleApprove(selectedPost),
 *   onReject: () => setRejectDialogOpen(true),
 *   onEscape: () => setSelectedPost(null),
 *   enabled: !!selectedPost,
 * });
 * ```
 */
export function useApprovalShortcuts({
  onApprove,
  onReject,
  onEscape,
  enabled = true,
}: UseApprovalShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[role="dialog"]')
      ) {
        return;
      }

      // Ignore if any modifier key is pressed (except for Escape)
      if (event.key !== 'Escape' && (event.ctrlKey || event.metaKey || event.altKey)) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'a':
          event.preventDefault();
          onApprove();
          break;
        case 'r':
          event.preventDefault();
          onReject();
          break;
        case 'escape':
          event.preventDefault();
          onEscape?.();
          break;
      }
    },
    [onApprove, onReject, onEscape]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

/**
 * Utility to check if shortcuts should be disabled
 * (e.g., when user is typing in an input)
 */
export function isInputFocused(): boolean {
  const activeElement = document.activeElement as HTMLElement;
  return (
    activeElement?.tagName === 'INPUT' ||
    activeElement?.tagName === 'TEXTAREA' ||
    activeElement?.isContentEditable ||
    !!activeElement?.closest('[role="dialog"]')
  );
}
