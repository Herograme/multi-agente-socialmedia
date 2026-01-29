# Story 5.5: Fluxo de Aprovacao de Posts

> Epic 5: Dashboard UI

---

## Story

**Como** usuario,
**Quero** aprovar ou rejeitar posts facilmente,
**Para que** eu controle o que sera publicado.

---

## Status

`Ready for Review`

---

## Acceptance Criteria

| # | Criterio | Validacao |
|---|----------|-----------|
| AC1 | Posts com status: `pending`, `approved`, `rejected` | Posts exibem status corretamente e atualizacao reflete no banco |
| AC2 | Botoes de aprovar (check) e rejeitar (X) em cada post | Botoes visiveis e funcionais em cada PostCard |
| AC3 | Acao de aprovar move para lista "Prontos para Publicar" | Post com status `approved` aparece na aba/filtro correspondente |
| AC4 | Acao de rejeitar pede motivo (opcional) | Modal/dialog exibe campo opcional para motivo antes de confirmar |
| AC5 | Opcao "Regenerar" para posts rejeitados | Botao disponivel apenas para posts com status `rejected` |
| AC6 | Filtro por status na lista de posts | Filtros `pending`, `approved`, `rejected`, `all` funcionam corretamente |
| AC7 | Bulk actions: aprovar todos, rejeitar todos | Acoes em lote afetam todos os posts selecionados/visiveis |
| AC8 | Contador de posts pendentes no menu | Badge no Sidebar exibe quantidade de posts `pending` |
| AC9 | Keyboard shortcuts: A para aprovar, R para rejeitar | Atalhos funcionam quando post esta focado/selecionado |

---

## Tasks

- [x] **Task 1:** Atualizar modelo de Post com campo de motivo de rejeicao
  - [x] Adicionar campo `rejectionReason` opcional no schema do banco (`packages/api/src/db/schema.ts`)
  - [x] Atualizar interface `Post` em `packages/shared/src/types/entities.ts`
  - [x] Criar migration para adicionar coluna `rejection_reason`
  - [x] Atualizar repository `post.repo.ts` com metodos de aprovacao/rejeicao

- [x] **Task 2:** Implementar API endpoints de aprovacao
  - [x] Criar `POST /api/posts/:id/approve` que atualiza status para `approved`
  - [x] Criar `POST /api/posts/:id/reject` que atualiza status para `rejected` e salva motivo
  - [x] Criar `POST /api/posts/:id/regenerate` que dispara regeneracao do post
  - [x] Criar `POST /api/posts/bulk-approve` para aprovar multiplos posts
  - [x] Criar `POST /api/posts/bulk-reject` para rejeitar multiplos posts
  - [x] Criar `GET /api/posts/pending-count` que retorna contagem de pendentes

- [x] **Task 3:** Implementar ApprovalButtons component
  - [x] Criar `packages/ui/src/components/posts/ApprovalButtons.tsx`
  - [x] Botao de aprovar com icone Check (verde)
  - [x] Botao de rejeitar com icone X (vermelho)
  - [x] Estados de loading durante requisicao
  - [x] Tooltips indicando acao e atalho de teclado

- [x] **Task 4:** Implementar RejectDialog component
  - [x] Criar `packages/ui/src/components/posts/RejectDialog.tsx`
  - [x] Dialog/modal com textarea para motivo (opcional)
  - [x] Botao "Rejeitar" e "Cancelar"
  - [x] Foco automatico no textarea ao abrir
  - [x] Suporte a Enter para confirmar (com Shift+Enter para nova linha)

- [x] **Task 5:** Implementar RegenerateButton component
  - [x] Criar `packages/ui/src/components/posts/RegenerateButton.tsx`
  - [x] Botao com icone RefreshCw visivel apenas para posts rejeitados
  - [x] Estado de loading durante regeneracao
  - [x] Feedback visual apos iniciar regeneracao

- [x] **Task 6:** Implementar StatusFilter component
  - [x] Criar `packages/ui/src/components/posts/StatusFilter.tsx`
  - [x] Tabs ou toggle group com opcoes: Todos, Pendentes, Aprovados, Rejeitados
  - [x] Contadores em cada aba mostrando quantidade
  - [x] Sincronizacao com query params na URL

- [x] **Task 7:** Implementar BulkActions component
  - [x] Criar `packages/ui/src/components/posts/BulkActions.tsx`
  - [x] Checkbox para selecionar todos
  - [x] Contador de posts selecionados
  - [x] Botao "Aprovar Selecionados"
  - [x] Botao "Rejeitar Selecionados"
  - [x] Confirmacao antes de executar acao em lote

- [x] **Task 8:** Implementar PendingBadge no Sidebar
  - [x] Criar `packages/ui/src/components/layout/PendingBadge.tsx`
  - [x] Badge numerico ao lado do item "Posts" no Sidebar
  - [x] Atualizacao em tempo real via WebSocket ou polling
  - [x] Ocultar badge quando contagem for 0

- [x] **Task 9:** Implementar keyboard shortcuts
  - [x] Criar `packages/ui/src/hooks/useApprovalShortcuts.ts`
  - [x] Tecla "A" aprova post selecionado/focado
  - [x] Tecla "R" abre dialog de rejeicao para post selecionado
  - [x] Tecla "Escape" cancela acao em andamento
  - [x] Indicador visual de post com foco

- [x] **Task 10:** Atualizar PostCard com acoes de aprovacao
  - [x] Modificar `packages/ui/src/components/posts/PostCard.tsx`
  - [x] Integrar ApprovalButtons no footer do card
  - [x] Exibir StatusBadge indicando status atual
  - [x] Exibir motivo de rejeicao quando aplicavel
  - [x] Suporte a selecao para bulk actions

- [x] **Task 11:** Atualizar pagina Posts com novo fluxo
  - [x] Modificar `packages/ui/src/routes/Posts.tsx`
  - [x] Integrar StatusFilter no header
  - [x] Integrar BulkActions quando houver selecao
  - [x] Implementar logica de selecao de posts
  - [x] Atualizar lista apos acoes de aprovacao

- [x] **Task 12:** Implementar hooks customizados
  - [x] Criar `packages/ui/src/hooks/usePostApproval.ts`
  - [x] Mutacoes para approve, reject, regenerate
  - [x] Mutacoes para bulk approve/reject
  - [x] Invalidacao de cache apos mutacoes
  - [x] Atualizacao otimista de UI

- [x] **Task 13:** Criar testes
  - [x] Testes para ApprovalButtons component
  - [x] Testes para RejectDialog component
  - [x] Testes para RegenerateButton component
  - [x] Testes para StatusFilter component
  - [x] Testes para BulkActions component
  - [x] Testes para useApprovalShortcuts hook
  - [x] Testes para usePostApproval hook
  - [x] Testes de integracao da API

---

## Dev Notes

### Estrutura de Componentes

```
packages/ui/src/
├── routes/
│   ├── Posts.tsx (modified)
│   └── ...
├── components/
│   ├── posts/
│   │   ├── PostCard.tsx (modified)
│   │   ├── ApprovalButtons.tsx (new)
│   │   ├── RejectDialog.tsx (new)
│   │   ├── RegenerateButton.tsx (new)
│   │   ├── StatusFilter.tsx (new)
│   │   ├── BulkActions.tsx (new)
│   │   ├── PostStatusBadge.tsx (new)
│   │   └── index.ts (modified)
│   ├── layout/
│   │   ├── Sidebar.tsx (modified)
│   │   ├── PendingBadge.tsx (new)
│   │   └── ...
│   └── ...
├── hooks/
│   ├── usePostApproval.ts (new)
│   ├── useApprovalShortcuts.ts (new)
│   ├── usePendingCount.ts (new)
│   └── ...
```

### Interfaces TypeScript

```typescript
// packages/shared/src/types/entities.ts

export type PostStatus = 'pending' | 'approved' | 'rejected';

export interface Post {
  id: string;
  executionId: string;
  topic: Topic;
  textInstagram?: string;
  textLinkedin?: string;
  status: PostStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  assets: Asset[];
  score?: Score;
}

export interface ApprovePostRequest {
  postId: string;
}

export interface RejectPostRequest {
  postId: string;
  reason?: string;
}

export interface BulkApproveRequest {
  postIds: string[];
}

export interface BulkRejectRequest {
  postIds: string[];
  reason?: string;
}

export interface RegeneratePostRequest {
  postId: string;
}

export interface PendingCountResponse {
  count: number;
}
```

### ApprovalButtons Component

```tsx
// packages/ui/src/components/posts/ApprovalButtons.tsx

import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePostApproval } from '@/hooks/usePostApproval';

interface ApprovalButtonsProps {
  postId: string;
  status: PostStatus;
  onRejectClick: () => void;
  disabled?: boolean;
}

export function ApprovalButtons({
  postId,
  status,
  onRejectClick,
  disabled = false,
}: ApprovalButtonsProps) {
  const { approvePost, isApproving } = usePostApproval();

  const handleApprove = async () => {
    await approvePost.mutateAsync({ postId });
  };

  if (status !== 'pending') {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
            onClick={handleApprove}
            disabled={disabled || isApproving}
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span className="sr-only">Aprovar</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Aprovar (A)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={onRejectClick}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Rejeitar</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Rejeitar (R)</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
```

### RejectDialog Component

```tsx
// packages/ui/src/components/posts/RejectDialog.tsx

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { usePostApproval } from '@/hooks/usePostApproval';

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  onSuccess?: () => void;
}

export function RejectDialog({
  open,
  onOpenChange,
  postId,
  onSuccess,
}: RejectDialogProps) {
  const [reason, setReason] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { rejectPost, isRejecting } = usePostApproval();

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  const handleReject = async () => {
    await rejectPost.mutateAsync({
      postId,
      reason: reason.trim() || undefined,
    });
    setReason('');
    onOpenChange(false);
    onSuccess?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
            futuras geracoes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea
              id="reason"
              ref={textareaRef}
              placeholder="Ex: Texto muito generico, falta de exemplos de codigo..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
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
```

### RegenerateButton Component

```tsx
// packages/ui/src/components/posts/RegenerateButton.tsx

import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePostApproval } from '@/hooks/usePostApproval';
import type { PostStatus } from '@social-content/shared';

interface RegenerateButtonProps {
  postId: string;
  status: PostStatus;
  disabled?: boolean;
}

export function RegenerateButton({
  postId,
  status,
  disabled = false,
}: RegenerateButtonProps) {
  const { regeneratePost, isRegenerating } = usePostApproval();

  if (status !== 'rejected') {
    return null;
  }

  const handleRegenerate = async () => {
    await regeneratePost.mutateAsync({ postId });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRegenerate}
          disabled={disabled || isRegenerating}
        >
          {isRegenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Regenerar</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Gerar novo conteudo para este topico</p>
      </TooltipContent>
    </Tooltip>
  );
}
```

### StatusFilter Component

```tsx
// packages/ui/src/components/posts/StatusFilter.tsx

import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { PostStatus } from '@social-content/shared';

interface StatusFilterProps {
  counts: {
    all: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

type FilterValue = 'all' | PostStatus;

export function StatusFilter({ counts }: StatusFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = (searchParams.get('status') || 'all') as FilterValue;

  const handleChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', value);
    }
    setSearchParams(newParams);
  };

  return (
    <Tabs value={currentStatus} onValueChange={handleChange}>
      <TabsList>
        <TabsTrigger value="all" className="gap-2">
          Todos
          <Badge variant="secondary" className="ml-1">
            {counts.all}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="pending" className="gap-2">
          Pendentes
          <Badge
            variant={counts.pending > 0 ? 'default' : 'secondary'}
            className="ml-1"
          >
            {counts.pending}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="approved" className="gap-2">
          Aprovados
          <Badge variant="secondary" className="ml-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            {counts.approved}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="rejected" className="gap-2">
          Rejeitados
          <Badge variant="secondary" className="ml-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            {counts.rejected}
          </Badge>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
```

### BulkActions Component

```tsx
// packages/ui/src/components/posts/BulkActions.tsx

import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePostApproval } from '@/hooks/usePostApproval';

interface BulkActionsProps {
  selectedIds: string[];
  totalCount: number;
  onSelectAll: (selected: boolean) => void;
  allSelected: boolean;
  onClearSelection: () => void;
}

export function BulkActions({
  selectedIds,
  totalCount,
  onSelectAll,
  allSelected,
  onClearSelection,
}: BulkActionsProps) {
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const { bulkApprove, bulkReject, isBulkApproving, isBulkRejecting } = usePostApproval();

  const handleBulkApprove = async () => {
    await bulkApprove.mutateAsync({ postIds: selectedIds });
    onClearSelection();
    setConfirmAction(null);
  };

  const handleBulkReject = async () => {
    await bulkReject.mutateAsync({ postIds: selectedIds });
    onClearSelection();
    setConfirmAction(null);
  };

  const isLoading = isBulkApproving || isBulkRejecting;
  const hasSelection = selectedIds.length > 0;

  return (
    <>
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all"
            checked={allSelected}
            onCheckedChange={(checked) => onSelectAll(!!checked)}
          />
          <label htmlFor="select-all" className="text-sm font-medium">
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
                className="text-green-600"
                onClick={() => setConfirmAction('approve')}
                disabled={isLoading}
              >
                <Check className="h-4 w-4 mr-2" />
                Aprovar Selecionados
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="text-red-600"
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

      <AlertDialog open={confirmAction !== null} onOpenChange={() => setConfirmAction(null)}>
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
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction === 'approve' ? handleBulkApprove : handleBulkReject}
              disabled={isLoading}
              className={confirmAction === 'reject' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
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
```

### PendingBadge Component

```tsx
// packages/ui/src/components/layout/PendingBadge.tsx

import { usePendingCount } from '@/hooks/usePendingCount';

export function PendingBadge() {
  const { data: count, isLoading } = usePendingCount();

  if (isLoading || !count || count === 0) {
    return null;
  }

  return (
    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
      {count > 99 ? '99+' : count}
    </span>
  );
}
```

### usePostApproval Hook

```typescript
// packages/ui/src/hooks/usePostApproval.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type {
  ApprovePostRequest,
  RejectPostRequest,
  BulkApproveRequest,
  BulkRejectRequest,
  RegeneratePostRequest,
} from '@social-content/shared';

export function usePostApproval() {
  const queryClient = useQueryClient();

  const invalidatePosts = () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    queryClient.invalidateQueries({ queryKey: ['pendingCount'] });
  };

  const approvePost = useMutation({
    mutationFn: async (data: ApprovePostRequest) => {
      return api.post(`/api/posts/${data.postId}/approve`);
    },
    onSuccess: () => {
      toast.success('Post aprovado com sucesso');
      invalidatePosts();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao aprovar post: ${error.message}`);
    },
  });

  const rejectPost = useMutation({
    mutationFn: async (data: RejectPostRequest) => {
      return api.post(`/api/posts/${data.postId}/reject`, {
        reason: data.reason,
      });
    },
    onSuccess: () => {
      toast.success('Post rejeitado');
      invalidatePosts();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao rejeitar post: ${error.message}`);
    },
  });

  const regeneratePost = useMutation({
    mutationFn: async (data: RegeneratePostRequest) => {
      return api.post(`/api/posts/${data.postId}/regenerate`);
    },
    onSuccess: () => {
      toast.success('Regeneracao iniciada. O post sera atualizado em breve.');
      invalidatePosts();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao regenerar post: ${error.message}`);
    },
  });

  const bulkApprove = useMutation({
    mutationFn: async (data: BulkApproveRequest) => {
      return api.post('/api/posts/bulk-approve', data);
    },
    onSuccess: (_, variables) => {
      toast.success(`${variables.postIds.length} post(s) aprovado(s)`);
      invalidatePosts();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao aprovar posts: ${error.message}`);
    },
  });

  const bulkReject = useMutation({
    mutationFn: async (data: BulkRejectRequest) => {
      return api.post('/api/posts/bulk-reject', data);
    },
    onSuccess: (_, variables) => {
      toast.success(`${variables.postIds.length} post(s) rejeitado(s)`);
      invalidatePosts();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao rejeitar posts: ${error.message}`);
    },
  });

  return {
    approvePost,
    rejectPost,
    regeneratePost,
    bulkApprove,
    bulkReject,
    isApproving: approvePost.isPending,
    isRejecting: rejectPost.isPending,
    isRegenerating: regeneratePost.isPending,
    isBulkApproving: bulkApprove.isPending,
    isBulkRejecting: bulkReject.isPending,
  };
}
```

### useApprovalShortcuts Hook

```typescript
// packages/ui/src/hooks/useApprovalShortcuts.ts

import { useEffect, useCallback } from 'react';

interface UseApprovalShortcutsOptions {
  onApprove: () => void;
  onReject: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

export function useApprovalShortcuts({
  onApprove,
  onReject,
  onEscape,
  enabled = true,
}: UseApprovalShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
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
```

### usePendingCount Hook

```typescript
// packages/ui/src/hooks/usePendingCount.ts

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function usePendingCount() {
  return useQuery({
    queryKey: ['pendingCount'],
    queryFn: async () => {
      const response = await api.get<{ count: number }>('/api/posts/pending-count');
      return response.data.count;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider stale after 10 seconds
  });
}
```

### Backend API Endpoints

```typescript
// packages/api/src/routes/posts/approval.ts

import { FastifyPluginAsync } from 'fastify';
import { getPostRepository } from '../../repositories/post.repo';
import { z } from 'zod';

const rejectBodySchema = z.object({
  reason: z.string().optional(),
});

const bulkApproveSchema = z.object({
  postIds: z.array(z.string()).min(1),
});

const bulkRejectSchema = z.object({
  postIds: z.array(z.string()).min(1),
  reason: z.string().optional(),
});

export const approvalRoutes: FastifyPluginAsync = async (fastify) => {
  const repo = getPostRepository();

  /**
   * POST /api/posts/:id/approve
   * Approve a single post
   */
  fastify.post<{ Params: { id: string } }>(
    '/api/posts/:id/approve',
    async (request, reply) => {
      const { id } = request.params;

      const post = await repo.findById(id);
      if (!post) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Post not found' },
        });
      }

      if (post.status !== 'pending') {
        return reply.status(400).send({
          error: {
            code: 'INVALID_STATUS',
            message: 'Only pending posts can be approved',
          },
        });
      }

      await repo.updateStatus(id, 'approved');

      return reply.send({ success: true, status: 'approved' });
    }
  );

  /**
   * POST /api/posts/:id/reject
   * Reject a single post with optional reason
   */
  fastify.post<{ Params: { id: string }; Body: z.infer<typeof rejectBodySchema> }>(
    '/api/posts/:id/reject',
    {
      schema: {
        body: rejectBodySchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { reason } = request.body;

      const post = await repo.findById(id);
      if (!post) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Post not found' },
        });
      }

      if (post.status !== 'pending') {
        return reply.status(400).send({
          error: {
            code: 'INVALID_STATUS',
            message: 'Only pending posts can be rejected',
          },
        });
      }

      await repo.updateStatus(id, 'rejected', reason);

      return reply.send({ success: true, status: 'rejected' });
    }
  );

  /**
   * POST /api/posts/:id/regenerate
   * Queue regeneration of a rejected post
   */
  fastify.post<{ Params: { id: string } }>(
    '/api/posts/:id/regenerate',
    async (request, reply) => {
      const { id } = request.params;

      const post = await repo.findById(id);
      if (!post) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Post not found' },
        });
      }

      if (post.status !== 'rejected') {
        return reply.status(400).send({
          error: {
            code: 'INVALID_STATUS',
            message: 'Only rejected posts can be regenerated',
          },
        });
      }

      // Queue regeneration (implementation depends on orchestrator)
      // For now, just reset status to pending
      await repo.updateStatus(id, 'pending');

      // TODO: Trigger actual regeneration via orchestrator
      // await orchestrator.regeneratePost(id);

      return reply.status(202).send({
        success: true,
        message: 'Regeneration queued',
      });
    }
  );

  /**
   * POST /api/posts/bulk-approve
   * Approve multiple posts at once
   */
  fastify.post<{ Body: z.infer<typeof bulkApproveSchema> }>(
    '/api/posts/bulk-approve',
    {
      schema: {
        body: bulkApproveSchema,
      },
    },
    async (request, reply) => {
      const { postIds } = request.body;

      const results = await repo.bulkUpdateStatus(postIds, 'approved');

      return reply.send({
        success: true,
        updated: results.updated,
        failed: results.failed,
      });
    }
  );

  /**
   * POST /api/posts/bulk-reject
   * Reject multiple posts at once
   */
  fastify.post<{ Body: z.infer<typeof bulkRejectSchema> }>(
    '/api/posts/bulk-reject',
    {
      schema: {
        body: bulkRejectSchema,
      },
    },
    async (request, reply) => {
      const { postIds, reason } = request.body;

      const results = await repo.bulkUpdateStatus(postIds, 'rejected', reason);

      return reply.send({
        success: true,
        updated: results.updated,
        failed: results.failed,
      });
    }
  );

  /**
   * GET /api/posts/pending-count
   * Get count of pending posts
   */
  fastify.get('/api/posts/pending-count', async (request, reply) => {
    const count = await repo.countByStatus('pending');

    return reply.send({ count });
  });
};
```

### Dependencias Adicionais

```json
{
  "dependencies": {
    "sonner": "^1.4.0"
  }
}
```

A biblioteca `sonner` e utilizada para toast notifications. Se o projeto ja usa outra solucao de toast (ex: react-hot-toast, shadcn toast), adaptar o codigo para usar a existente.

---

## Testing

### Testes Unitarios

```typescript
// packages/ui/src/__tests__/approval.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ApprovalButtons } from '../components/posts/ApprovalButtons';
import { RejectDialog } from '../components/posts/RejectDialog';
import { RegenerateButton } from '../components/posts/RegenerateButton';
import { StatusFilter } from '../components/posts/StatusFilter';
import { BulkActions } from '../components/posts/BulkActions';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

describe('ApprovalButtons', () => {
  it('should render approve and reject buttons for pending posts', () => {
    const onRejectClick = vi.fn();
    render(
      <ApprovalButtons
        postId="1"
        status="pending"
        onRejectClick={onRejectClick}
      />,
      { wrapper }
    );

    expect(screen.getByRole('button', { name: /aprovar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rejeitar/i })).toBeInTheDocument();
  });

  it('should not render buttons for approved posts', () => {
    render(
      <ApprovalButtons
        postId="1"
        status="approved"
        onRejectClick={vi.fn()}
      />,
      { wrapper }
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should not render buttons for rejected posts', () => {
    render(
      <ApprovalButtons
        postId="1"
        status="rejected"
        onRejectClick={vi.fn()}
      />,
      { wrapper }
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should call onRejectClick when reject button is clicked', () => {
    const onRejectClick = vi.fn();
    render(
      <ApprovalButtons
        postId="1"
        status="pending"
        onRejectClick={onRejectClick}
      />,
      { wrapper }
    );

    fireEvent.click(screen.getByRole('button', { name: /rejeitar/i }));
    expect(onRejectClick).toHaveBeenCalled();
  });
});

describe('RejectDialog', () => {
  it('should render dialog when open', () => {
    render(
      <RejectDialog
        open={true}
        onOpenChange={vi.fn()}
        postId="1"
      />,
      { wrapper }
    );

    expect(screen.getByText('Rejeitar Post')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/texto muito generico/i)).toBeInTheDocument();
  });

  it('should not render dialog when closed', () => {
    render(
      <RejectDialog
        open={false}
        onOpenChange={vi.fn()}
        postId="1"
      />,
      { wrapper }
    );

    expect(screen.queryByText('Rejeitar Post')).not.toBeInTheDocument();
  });

  it('should allow entering rejection reason', () => {
    render(
      <RejectDialog
        open={true}
        onOpenChange={vi.fn()}
        postId="1"
      />,
      { wrapper }
    );

    const textarea = screen.getByPlaceholderText(/texto muito generico/i);
    fireEvent.change(textarea, { target: { value: 'Motivo de teste' } });

    expect(textarea).toHaveValue('Motivo de teste');
  });
});

describe('RegenerateButton', () => {
  it('should render button for rejected posts', () => {
    render(
      <RegenerateButton postId="1" status="rejected" />,
      { wrapper }
    );

    expect(screen.getByRole('button', { name: /regenerar/i })).toBeInTheDocument();
  });

  it('should not render button for pending posts', () => {
    render(
      <RegenerateButton postId="1" status="pending" />,
      { wrapper }
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should not render button for approved posts', () => {
    render(
      <RegenerateButton postId="1" status="approved" />,
      { wrapper }
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('StatusFilter', () => {
  const mockCounts = {
    all: 10,
    pending: 5,
    approved: 3,
    rejected: 2,
  };

  it('should render all filter tabs', () => {
    render(<StatusFilter counts={mockCounts} />, { wrapper });

    expect(screen.getByRole('tab', { name: /todos/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /pendentes/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /aprovados/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /rejeitados/i })).toBeInTheDocument();
  });

  it('should display counts in badges', () => {
    render(<StatusFilter counts={mockCounts} />, { wrapper });

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});

describe('BulkActions', () => {
  it('should render select all checkbox', () => {
    render(
      <BulkActions
        selectedIds={[]}
        totalCount={10}
        onSelectAll={vi.fn()}
        allSelected={false}
        onClearSelection={vi.fn()}
      />,
      { wrapper }
    );

    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText(/selecionar todos/i)).toBeInTheDocument();
  });

  it('should show action buttons when items are selected', () => {
    render(
      <BulkActions
        selectedIds={['1', '2', '3']}
        totalCount={10}
        onSelectAll={vi.fn()}
        allSelected={false}
        onClearSelection={vi.fn()}
      />,
      { wrapper }
    );

    expect(screen.getByText('3 de 10 selecionado(s)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aprovar selecionados/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rejeitar selecionados/i })).toBeInTheDocument();
  });

  it('should not show action buttons when no items are selected', () => {
    render(
      <BulkActions
        selectedIds={[]}
        totalCount={10}
        onSelectAll={vi.fn()}
        allSelected={false}
        onClearSelection={vi.fn()}
      />,
      { wrapper }
    );

    expect(screen.queryByRole('button', { name: /aprovar selecionados/i })).not.toBeInTheDocument();
  });
});
```

### Testes de Hook de Atalhos

```typescript
// packages/ui/src/__tests__/useApprovalShortcuts.test.ts

import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useApprovalShortcuts } from '../hooks/useApprovalShortcuts';

describe('useApprovalShortcuts', () => {
  it('should call onApprove when A key is pressed', () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();

    renderHook(() =>
      useApprovalShortcuts({
        onApprove,
        onReject,
        enabled: true,
      })
    );

    const event = new KeyboardEvent('keydown', { key: 'a' });
    document.dispatchEvent(event);

    expect(onApprove).toHaveBeenCalled();
    expect(onReject).not.toHaveBeenCalled();
  });

  it('should call onReject when R key is pressed', () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();

    renderHook(() =>
      useApprovalShortcuts({
        onApprove,
        onReject,
        enabled: true,
      })
    );

    const event = new KeyboardEvent('keydown', { key: 'r' });
    document.dispatchEvent(event);

    expect(onReject).toHaveBeenCalled();
    expect(onApprove).not.toHaveBeenCalled();
  });

  it('should call onEscape when Escape key is pressed', () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    const onEscape = vi.fn();

    renderHook(() =>
      useApprovalShortcuts({
        onApprove,
        onReject,
        onEscape,
        enabled: true,
      })
    );

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    expect(onEscape).toHaveBeenCalled();
  });

  it('should not call handlers when disabled', () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();

    renderHook(() =>
      useApprovalShortcuts({
        onApprove,
        onReject,
        enabled: false,
      })
    );

    const event = new KeyboardEvent('keydown', { key: 'a' });
    document.dispatchEvent(event);

    expect(onApprove).not.toHaveBeenCalled();
  });
});
```

### Validacoes Manuais

1. Navegar para `/posts`
2. Ver lista de posts com StatusBadge indicando status
3. Clicar no botao de aprovar (check verde) em post pendente
4. Verificar que status muda para "approved"
5. Verificar que post aparece na aba "Aprovados"
6. Clicar no botao de rejeitar (X vermelho) em post pendente
7. Verificar que dialog de motivo aparece
8. Preencher motivo opcional e confirmar
9. Verificar que status muda para "rejected"
10. Verificar que botao "Regenerar" aparece para posts rejeitados
11. Clicar em "Regenerar" e verificar feedback
12. Testar filtros por status (Todos, Pendentes, Aprovados, Rejeitados)
13. Selecionar multiplos posts usando checkboxes
14. Testar "Aprovar Selecionados" e "Rejeitar Selecionados"
15. Verificar contador de pendentes no Sidebar
16. Testar atalhos de teclado: A para aprovar, R para rejeitar
17. Verificar que atalhos nao funcionam quando digitando em inputs
18. Testar em diferentes tamanhos de tela (responsividade)

---

## References

- [PRD](../prd.md) - Story 5.5 (FR24)
- [Architecture](../architecture.md) - Post Approval Flow
- [Front-End Spec](../front-end-spec.md) - Component Library
- [Story 5.4](./story-5.4.md) - View de Execucao Real-Time (referencia de padrao)
- [Story 4.6](./story-4.6.md) - Quality Gate e Threshold (relacionado)
- [Story 2.8](./story-2.8.md) - Visualizacao de Posts (base)

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Modified | `packages/shared/src/types/entities.ts` | Added rejectionReason, updatedAt fields to Post; Added approval types |
| Modified | `packages/api/src/database/types.ts` | Added rejection_reason, updated_at fields to Post |
| Modified | `packages/api/src/database/repositories/post-repository.ts` | Added approve, reject, bulkApprove, bulkReject methods |
| Modified | `packages/api/src/database/migrate.ts` | Updated test migrations with new fields |
| Created | `packages/api/src/database/migrations/003_post_rejection_reason.sql` | Migration for new columns |
| Created | `packages/api/src/routes/posts/approval.ts` | API endpoints for approval workflow |
| Modified | `packages/api/src/routes/index.ts` | Export approval routes |
| Modified | `packages/api/src/server.ts` | Register approval routes |
| Created | `packages/ui/src/components/ui/dialog.tsx` | Dialog component |
| Created | `packages/ui/src/components/ui/textarea.tsx` | Textarea component |
| Created | `packages/ui/src/components/posts/ApprovalButtons.tsx` | Approve/Reject buttons |
| Created | `packages/ui/src/components/posts/RejectDialog.tsx` | Rejection dialog with reason |
| Created | `packages/ui/src/components/posts/RegenerateButton.tsx` | Regenerate button for rejected posts |
| Created | `packages/ui/src/components/posts/StatusFilter.tsx` | Status filter tabs |
| Created | `packages/ui/src/components/posts/BulkActions.tsx` | Bulk approve/reject actions |
| Created | `packages/ui/src/components/posts/PostStatusBadge.tsx` | Status badge component |
| Modified | `packages/ui/src/components/posts/index.ts` | Barrel exports |
| Created | `packages/ui/src/components/layout/PendingBadge.tsx` | Pending count badge for sidebar |
| Modified | `packages/ui/src/components/layout/Sidebar.tsx` | Integrated PendingBadge |
| Created | `packages/ui/src/hooks/usePostApproval.ts` | Approval mutations hook |
| Created | `packages/ui/src/hooks/usePendingCount.ts` | Pending count query hook |
| Created | `packages/ui/src/hooks/useApprovalShortcuts.ts` | Keyboard shortcuts hook |
| Modified | `packages/ui/src/routes/Posts.tsx` | Complete approval workflow UI |
| Created | `packages/ui/src/__tests__/approval.test.tsx` | Component tests |
| Created | `packages/api/src/__tests__/approval.test.ts` | API integration tests |

### Debug Log

_No debug entries_

### Completion Notes

All tasks completed successfully. The post approval workflow is fully implemented:

**Backend:**
- Added `rejection_reason` and `updated_at` fields to the Post model
- Created API endpoints for approve, reject, regenerate, bulk-approve, bulk-reject, pending-count, and status-counts
- Added database migration for new columns
- Implemented repository methods with proper status validation

**Frontend:**
- Created ApprovalButtons component with approve (green check) and reject (red X) buttons
- Created RejectDialog with optional reason input and Enter/Shift+Enter support
- Created RegenerateButton visible only for rejected posts
- Created StatusFilter tabs with counts (All, Pending, Approved, Rejected)
- Created BulkActions for selecting and bulk approving/rejecting posts
- Created PendingBadge for sidebar showing pending post count
- Created PostStatusBadge for displaying post status
- Implemented keyboard shortcuts (A=approve, R=reject, Escape=clear)
- Integrated all components into Posts page with full workflow

**Tests:**
- Component tests for ApprovalButtons, RejectDialog, RegenerateButton, StatusFilter, BulkActions, PostStatusBadge, PendingBadge
- API integration tests for all approval endpoints

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-29 | Story created | River (SM Agent) |
| 2026-01-29 | Implementation complete | Dex (Dev Agent) |

---
