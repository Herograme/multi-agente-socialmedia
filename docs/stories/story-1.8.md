# Story 1.8: Visualização de Tendências na UI

> Epic 1: Foundation & Pesquisador

---

## Story

**Como** usuário,
**Quero** ver as tendências pesquisadas na interface,
**Para que** eu possa validar que o sistema está funcionando.

---

## Status

`Ready for Review`

---

## Acceptance Criteria

| # | Critério | Validação |
|---|----------|-----------|
| AC1 | Página `/trends` listando tendências do backend | Rota existe e renderiza |
| AC2 | Card para cada tendência: título, fonte, data, link | Cards exibem dados |
| AC3 | Botão "Pesquisar Agora" que dispara o agente | Botão funciona |
| AC4 | Loading state enquanto agente executa | Spinner visível |
| AC5 | Atualização automática da lista após execução | Lista atualiza |
| AC6 | Indicador de última atualização | Timestamp exibido |
| AC7 | Empty state quando não há tendências | Mensagem amigável |
| AC8 | Tratamento de erro com mensagem amigável | Toast de erro |

---

## Tasks

- [x] **Task 1:** Criar página de Trends
  - [x] Criar `packages/ui/src/routes/Trends.tsx`
  - [x] Adicionar rota `/trends` no router
  - [x] Adicionar link na sidebar

- [x] **Task 2:** Implementar TrendCard component
  - [x] Criar `packages/ui/src/components/trends/TrendCard.tsx`
  - [x] Exibir: título, fonte (badge), data relativa, link externo
  - [x] Estilizar com tema dark

- [x] **Task 3:** Implementar listagem de trends
  - [x] Criar hook `useTrends()` com TanStack Query
  - [x] Fetch de `GET /api/agents/researcher/results`
  - [x] Renderizar grid de TrendCards

- [x] **Task 4:** Implementar botão de pesquisa
  - [x] Criar botão "Pesquisar Agora"
  - [x] Implementar mutation para `POST /api/agents/researcher/run`
  - [x] Invalidar query após sucesso

- [x] **Task 5:** Implementar estados de UI
  - [x] Loading state com skeleton cards
  - [x] Empty state com ilustração e CTA
  - [x] Error state com mensagem e retry
  - [x] Indicador de última atualização

- [x] **Task 6:** Integrar com TanStack Query
  - [x] Configurar QueryClient no App
  - [x] Implementar stale time e refetch
  - [x] Tratar erros globalmente

---

## Dev Notes

### Estrutura de Componentes

```
packages/ui/src/
├── routes/
│   ├── Trends.tsx
│   └── ...
├── components/
│   ├── trends/
│   │   ├── TrendCard.tsx
│   │   ├── TrendList.tsx
│   │   ├── TrendSkeleton.tsx
│   │   └── index.ts
│   └── ...
├── hooks/
│   ├── useTrends.ts
│   └── ...
```

### TrendCard Component

```tsx
interface TrendCardProps {
  trend: Trend;
}

function TrendCard({ trend }: TrendCardProps) {
  return (
    <Card className="hover:border-primary transition-colors">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{trend.source}</Badge>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(trend.discoveredAt)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="font-medium">{trend.title}</h3>
      </CardContent>
      <CardFooter>
        <a href={trend.url} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver fonte
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
}
```

### useTrends Hook

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useTrends() {
  const queryClient = useQueryClient();

  const trendsQuery = useQuery({
    queryKey: ['trends'],
    queryFn: () => api.getResearcherResults(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const runResearcherMutation = useMutation({
    mutationFn: () => api.runResearcher(),
    onSuccess: () => {
      // Refetch after a delay (agent takes time)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['trends'] });
      }, 5000);
    },
  });

  return {
    trends: trendsQuery.data?.trends ?? [],
    metadata: trendsQuery.data?.metadata,
    isLoading: trendsQuery.isLoading,
    isError: trendsQuery.isError,
    error: trendsQuery.error,
    runResearcher: runResearcherMutation.mutate,
    isRunning: runResearcherMutation.isPending,
  };
}
```

### Empty State

```tsx
function EmptyTrends({ onResearch }: { onResearch: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <SearchX className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">Nenhuma tendência encontrada</h3>
      <p className="text-muted-foreground mb-4">
        Execute uma pesquisa para descobrir tendências tech
      </p>
      <Button onClick={onResearch}>
        <Search className="h-4 w-4 mr-2" />
        Pesquisar Agora
      </Button>
    </div>
  );
}
```

### Dependências Adicionais

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0"
  }
}
```

---

## Testing

### Validações Manuais

1. Navegar para `/trends`
2. Ver empty state inicial
3. Clicar "Pesquisar Agora"
4. Ver loading state
5. Ver lista de tendências após execução
6. Clicar em "Ver fonte" abre link externo
7. Ver indicador de última atualização

---

## References

- [PRD](../prd.md) - Story 1.8
- [Architecture](../architecture.md) - Frontend Architecture
- [Front-End Spec](../front-end-spec.md) - Component Library

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Created | `packages/ui/src/routes/Trends.tsx` | Main Trends page component |
| Created | `packages/ui/src/components/trends/TrendCard.tsx` | Card component for individual trends |
| Created | `packages/ui/src/components/trends/TrendList.tsx` | Grid list of TrendCards with states |
| Created | `packages/ui/src/components/trends/TrendHeader.tsx` | Header with title and "Pesquisar Agora" button |
| Created | `packages/ui/src/components/trends/TrendSkeleton.tsx` | Loading skeleton for cards |
| Created | `packages/ui/src/components/trends/EmptyTrends.tsx` | Empty state component |
| Created | `packages/ui/src/components/trends/ErrorState.tsx` | Error state with retry button |
| Created | `packages/ui/src/components/trends/index.ts` | Barrel exports for trends components |
| Created | `packages/ui/src/hooks/useTrends.ts` | TanStack Query hook for trends data |
| Created | `packages/ui/src/lib/date.ts` | Date formatting utilities |
| Created | `packages/ui/src/__tests__/date.test.ts` | Tests for date utilities |
| Created | `packages/ui/src/__tests__/trends.test.tsx` | Tests for trend components |
| Created | `packages/ui/src/__tests__/setup.ts` | Vitest test setup |
| Created | `packages/ui/vitest.config.ts` | Vitest configuration |
| Modified | `packages/ui/src/App.tsx` | Added QueryClientProvider and /trends route |
| Modified | `packages/ui/src/components/layout/Sidebar.tsx` | Added Trends nav item |
| Modified | `packages/ui/src/lib/api.ts` | Added researcher API methods |
| Modified | `packages/ui/package.json` | Added testing dependencies |
| Modified | `packages/ui/tsconfig.json` | Added vitest and testing-library types |

### Debug Log

_No debug entries_

### Completion Notes

- All acceptance criteria implemented
- AC1: Page `/trends` exists and renders correctly
- AC2: TrendCard displays title, source badge, relative date, and external link
- AC3: "Pesquisar Agora" button triggers researcher agent via POST mutation
- AC4: Loading state shows skeleton cards while loading/running
- AC5: Auto-refetch implemented with polling after agent execution
- AC6: Last update timestamp indicator shown in header
- AC7: Empty state with friendly message and CTA button
- AC8: Error state with retry button for error handling

**Note:** This story depends on Stories 1.6 and 1.7 for full functionality (backend endpoints). The UI is complete and ready to integrate once the backend is implemented.

### Test Results

```
 Test Files  2 passed (2)
      Tests  24 passed (24)
```

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-28 | Story created | River (SM Agent) |
| 2025-01-28 | Story implemented | Dex (Dev Agent) |
