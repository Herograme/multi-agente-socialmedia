import { useContext, useCallback } from 'react';
import { ToastContext, ToastType, Toast } from '../components/ui/toast-provider';

/**
 * Hook to access toast notifications
 * Provides convenience methods for showing different toast types.
 *
 * Story 5.8: Toast Notifications
 *
 * @example
 * const toast = useToast();
 *
 * // Simple usage
 * toast.success('Post aprovado!');
 * toast.error('Erro ao salvar', 'Verifique sua conexao');
 *
 * // With action
 * toast.custom({
 *   type: 'success',
 *   title: 'Post aprovado',
 *   action: { label: 'Desfazer', onClick: handleUndo }
 * });
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { addToast, removeToast, toasts } = context;

  const success = useCallback(
    (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) =>
      addToast({ type: 'success', title, message, ...options }),
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) =>
      addToast({ type: 'error', title, message, ...options }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) =>
      addToast({ type: 'warning', title, message, ...options }),
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) =>
      addToast({ type: 'info', title, message, ...options }),
    [addToast]
  );

  const custom = useCallback(
    (toast: Omit<Toast, 'id'>) => addToast(toast),
    [addToast]
  );

  const dismiss = useCallback(
    (id: string) => removeToast(id),
    [removeToast]
  );

  const dismissAll = useCallback(() => {
    toasts.forEach((toast) => removeToast(toast.id));
  }, [toasts, removeToast]);

  return {
    /** Show success toast (green) */
    success,
    /** Show error toast (red) */
    error,
    /** Show warning toast (yellow) */
    warning,
    /** Show info toast (blue) */
    info,
    /** Show custom toast with full control */
    custom,
    /** Dismiss a specific toast by ID */
    dismiss,
    /** Dismiss all toasts */
    dismissAll,
    /** Current toasts array */
    toasts,
  };
}

/**
 * Pre-configured toast messages for common actions
 * Use these for consistent messaging across the app.
 */
export const toastMessages = {
  // Post actions
  postApproved: {
    type: 'success' as ToastType,
    title: 'Post aprovado!',
    message: 'O post foi marcado como aprovado para publicacao.',
  },
  postRejected: {
    type: 'success' as ToastType,
    title: 'Post rejeitado',
    message: 'O post foi removido da fila de publicacao.',
  },
  postApprovalError: {
    type: 'error' as ToastType,
    title: 'Erro ao atualizar post',
    message: 'Nao foi possivel atualizar o status do post.',
  },

  // Settings actions
  settingsSaved: {
    type: 'success' as ToastType,
    title: 'Configuracoes salvas!',
    message: 'Suas preferencias foram atualizadas.',
  },
  settingsReset: {
    type: 'info' as ToastType,
    title: 'Configuracoes restauradas',
    message: 'As configuracoes foram restauradas para os valores padrao.',
  },
  settingsError: {
    type: 'error' as ToastType,
    title: 'Erro ao salvar',
    message: 'Nao foi possivel salvar as configuracoes.',
  },

  // Pipeline actions
  pipelineStarted: {
    type: 'info' as ToastType,
    title: 'Pipeline iniciado',
    message: 'A execucao foi iniciada. Acompanhe o progresso abaixo.',
  },
  pipelineCompleted: {
    type: 'success' as ToastType,
    title: 'Pipeline concluido!',
    message: 'Novos posts foram gerados com sucesso.',
  },
  pipelineError: {
    type: 'error' as ToastType,
    title: 'Erro no pipeline',
    message: 'Ocorreu um erro durante a execucao.',
  },

  // Connection
  connectionLost: {
    type: 'warning' as ToastType,
    title: 'Conexao perdida',
    message: 'Tentando reconectar ao servidor...',
    duration: 0, // Don't auto-dismiss
  },
  connectionRestored: {
    type: 'success' as ToastType,
    title: 'Conexao restaurada',
    message: 'Voce esta conectado novamente.',
  },

  // Generic
  genericError: {
    type: 'error' as ToastType,
    title: 'Erro',
    message: 'Ocorreu um erro inesperado. Tente novamente.',
  },
  copied: {
    type: 'success' as ToastType,
    title: 'Copiado!',
    message: 'Conteudo copiado para a area de transferencia.',
    duration: 2000,
  },
  downloadStarted: {
    type: 'info' as ToastType,
    title: 'Download iniciado',
    message: 'Seu arquivo esta sendo preparado.',
  },
} as const;
