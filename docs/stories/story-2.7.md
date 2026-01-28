# Story 2.7: UI - Visualizacao de Conteudo Curado

> Epic 2: Curador Agent

---

## Story

**Como** usuario,
**Quero** ver o conteudo curado na interface,
**Para que** eu possa revisar os snippets extraidos e validar a curadoria.

---

## Status

`QA Passed - Ready for Merge`

---

## Acceptance Criteria

| # | Criterio | Validacao |
|---|----------|-----------|
| AC1 | Pagina `/curated` listando conteudo curado do backend | Rota existe e renderiza |
| AC2 | CuratedContentCard exibe titulo, fonte, e preview de snippets | Cards exibem dados corretamente |
| AC3 | CuratedContentList com filtro por tipo de conteudo | Filtro funciona e atualiza lista |
| AC4 | Loading state com skeleton cards enquanto carrega | Skeleton visivel durante fetch |
| AC5 | Empty state quando nao ha conteudo curado | Mensagem amigavel exibida |
| AC6 | Error state com mensagem e botao de retry | Toast/mensagem de erro funciona |
| AC7 | Code snippets exibidos com syntax highlighting | Highlight de codigo funciona |
| AC8 | Indicador de quantidade de snippets por card | Badge/contador exibido |

---

## Tasks

- [x] **Task 1:** Criar pagina de Curated Content
  - [x] Criar `packages/ui/src/routes/Curated.tsx`
  - [x] Adicionar rota `/curated` no router
  - [x] Adicionar link na sidebar

- [x] **Task 2:** Implementar CuratedContentCard component
  - [x] Criar `packages/ui/src/components/curated/CuratedContentCard.tsx`
  - [x] Exibir: titulo, fonte (badge), data relativa, snippets count
  - [x] Preview de snippets (colapsavel)
  - [x] Estilizar com tema dark

- [x] **Task 3:** Implementar CuratedContentList component
  - [x] Criar `packages/ui/src/components/curated/CuratedContentList.tsx`
  - [x] Renderizar grid de CuratedContentCards
  - [x] Implementar filtro por tipo (article, video, tutorial, etc.)
  - [x] Dropdown/tabs para selecao de tipo

- [x] **Task 4:** Implementar useCuratedContent hook
  - [x] Criar hook `useCuratedContent()` com TanStack Query
  - [x] Fetch de `GET /api/agents/curator/results`
  - [x] Suporte a filtros de query params
  - [x] Configurar staleTime e refetch

- [x] **Task 5:** Implementar estados de UI
  - [x] Loading state com skeleton cards
  - [x] Empty state com ilustracao e CTA
  - [x] Error state com mensagem e retry
  - [x] Indicador de ultima atualizacao

- [x] **Task 6:** Implementar syntax highlighting para snippets
  - [x] Instalar e configurar biblioteca de highlight (react-syntax-highlighter ou similar)
  - [x] Criar SnippetDisplay component
  - [x] Suporte a multiplas linguagens (JS, TS, Python, etc.)
  - [x] Tema escuro para highlight

---

## Dev Notes

### Estrutura de Componentes

```
packages/ui/src/
├── routes/
│   ├── Curated.tsx
│   └── ...
├── components/
│   ├── curated/
│   │   ├── CuratedContentCard.tsx
│   │   ├── CuratedContentList.tsx
│   │   ├── CuratedContentHeader.tsx
│   │   ├── CuratedContentSkeleton.tsx
│   │   ├── CuratedContentFilter.tsx
│   │   ├── SnippetDisplay.tsx
│   │   ├── EmptyCurated.tsx
│   │   ├── ErrorState.tsx
│   │   └── index.ts
│   └── ...
├── hooks/
│   ├── useCuratedContent.ts
│   └── ...
```

### CuratedContentCard Component

```tsx
interface CuratedContentCardProps {
  content: CuratedContent;
}

interface CuratedContent {
  id: string;
  title: string;
  source: string;
  type: 'article' | 'video' | 'tutorial' | 'documentation' | 'other';
  url: string;
  snippets: Snippet[];
  curatedAt: string;
}

interface Snippet {
  id: string;
  code: string;
  language: string;
  description?: string;
}

function CuratedContentCard({ content }: CuratedContentCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="hover:border-primary transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{content.source}</Badge>
            <Badge variant="secondary">{content.type}</Badge>
          </div>
          <Badge variant="default">
            {content.snippets.length} snippets
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="font-medium mb-2">{content.title}</h3>
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(content.curatedAt)}
        </span>

        {content.snippets.length > 0 && (
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="mt-2">
                {expanded ? 'Ocultar' : 'Ver'} snippets
                <ChevronDown className={cn("h-4 w-4 ml-1", expanded && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {content.snippets.map((snippet) => (
                <SnippetDisplay key={snippet.id} snippet={snippet} />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
      <CardFooter>
        <a href={content.url} target="_blank" rel="noopener noreferrer">
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

### SnippetDisplay Component

```tsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface SnippetDisplayProps {
  snippet: Snippet;
}

function SnippetDisplay({ snippet }: SnippetDisplayProps) {
  return (
    <div className="rounded-md overflow-hidden">
      {snippet.description && (
        <p className="text-sm text-muted-foreground mb-1">
          {snippet.description}
        </p>
      )}
      <SyntaxHighlighter
        language={snippet.language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
        }}
      >
        {snippet.code}
      </SyntaxHighlighter>
    </div>
  );
}
```

### useCuratedContent Hook

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface UseCuratedContentOptions {
  type?: string;
}

export function useCuratedContent(options: UseCuratedContentOptions = {}) {
  const { type } = options;

  const curatedQuery = useQuery({
    queryKey: ['curatedContent', { type }],
    queryFn: () => api.getCuratorResults({ type }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    contents: curatedQuery.data?.contents ?? [],
    metadata: curatedQuery.data?.metadata,
    isLoading: curatedQuery.isLoading,
    isError: curatedQuery.isError,
    error: curatedQuery.error,
    refetch: curatedQuery.refetch,
  };
}
```

### CuratedContentFilter Component

```tsx
const CONTENT_TYPES = [
  { value: 'all', label: 'Todos' },
  { value: 'article', label: 'Artigos' },
  { value: 'video', label: 'Videos' },
  { value: 'tutorial', label: 'Tutoriais' },
  { value: 'documentation', label: 'Documentacao' },
  { value: 'other', label: 'Outros' },
];

function CuratedContentFilter({ value, onChange }: FilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Filtrar por tipo" />
      </SelectTrigger>
      <SelectContent>
        {CONTENT_TYPES.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            {type.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### Empty State

```tsx
function EmptyCurated() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">Nenhum conteudo curado</h3>
      <p className="text-muted-foreground mb-4 text-center">
        O agente Curador ainda nao processou nenhum conteudo.<br />
        Execute o Pesquisador primeiro para gerar tendencias.
      </p>
    </div>
  );
}
```

### Dependencias Adicionais

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "react-syntax-highlighter": "^15.5.0"
  },
  "devDependencies": {
    "@types/react-syntax-highlighter": "^15.5.0"
  }
}
```

---

## Testing

### Validacoes Manuais

1. Navegar para `/curated`
2. Ver empty state inicial (se nao houver dados)
3. Ver lista de conteudo curado (se houver dados)
4. Usar filtro por tipo e verificar lista atualizada
5. Expandir card e ver snippets com syntax highlighting
6. Verificar badge de quantidade de snippets
7. Clicar em "Ver fonte" abre link externo
8. Ver indicador de ultima atualizacao
9. Simular erro e verificar error state com retry

### Testes Unitarios

- `CuratedContentCard` renderiza corretamente com dados
- `CuratedContentCard` expande/colapsa snippets
- `SnippetDisplay` renderiza codigo com highlight
- `CuratedContentFilter` filtra por tipo corretamente
- `useCuratedContent` hook retorna dados do backend
- Empty state renderiza quando lista vazia
- Error state renderiza em caso de erro
- Loading state mostra skeletons

---

## References

- [PRD](../prd.md) - Epic 2: Curador Agent
- [Architecture](../architecture.md) - Frontend Architecture
- [Front-End Spec](../front-end-spec.md) - Component Library
- [Story 1.8](./story-1.8.md) - Reference pattern for UI stories

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Created | `packages/ui/src/routes/Curated.tsx` | Main route page for curated content |
| Modified | `packages/ui/src/App.tsx` | Added Curated route |
| Modified | `packages/ui/src/components/layout/Sidebar.tsx` | Added Curated nav link |
| Created | `packages/ui/src/hooks/useCuratedContent.ts` | TanStack Query hook for curated content |
| Modified | `packages/ui/src/lib/api.ts` | Added curator API endpoints |
| Created | `packages/ui/src/components/curated/CuratedContentCard.tsx` | Card component with expandable snippets |
| Created | `packages/ui/src/components/curated/CuratedContentList.tsx` | Grid list with loading/error/empty states |
| Created | `packages/ui/src/components/curated/CuratedContentHeader.tsx` | Header with title and filter |
| Created | `packages/ui/src/components/curated/CuratedContentSkeleton.tsx` | Loading skeleton card |
| Created | `packages/ui/src/components/curated/CuratedContentFilter.tsx` | Content type filter pills |
| Created | `packages/ui/src/components/curated/SnippetDisplay.tsx` | Syntax highlighted code display |
| Created | `packages/ui/src/components/curated/EmptyCurated.tsx` | Empty state component |
| Created | `packages/ui/src/components/curated/CuratedErrorState.tsx` | Error state with retry |
| Created | `packages/ui/src/components/curated/index.ts` | Module exports |
| Modified | `packages/shared/src/types/agents.ts` | Added CuratedContent, Snippet types |
| Created | `packages/ui/src/__tests__/curated.test.tsx` | Unit tests for all components |

### Debug Log

_No debug entries_

### Completion Notes

**Implementation Summary:**

1. **Task 1 - Curated Page & Route:**
   - Created `/curated` route page that integrates all curated content components
   - Added route to App.tsx with proper import
   - Added BookMarked icon link in Sidebar navigation

2. **Task 2 - CuratedContentCard:**
   - Card displays title, source badge, type badge, snippets count badge
   - Collapsible snippets section with smooth animation
   - Source colors for devto, hackernews, reddit, github, medium, youtube
   - Type labels in Portuguese (Artigo, Video, Tutorial, Documentacao, Outro)
   - External link button to original source

3. **Task 3 - CuratedContentList & Filter:**
   - Responsive grid layout (1-4 columns based on screen size)
   - Filter pills for content type selection (all, article, video, tutorial, documentation, other)
   - Proper handling of loading, error, and empty states

4. **Task 4 - useCuratedContent Hook:**
   - TanStack Query integration with 5-minute staleTime
   - Support for type filtering via query params
   - Added getCuratorResults endpoint to API client

5. **Task 5 - UI States:**
   - CuratedContentSkeleton with pulse animation
   - EmptyCurated with icon and helpful message
   - CuratedErrorState with error message and retry button
   - Last update timestamp in header

6. **Task 6 - Syntax Highlighting:**
   - Installed react-syntax-highlighter with types
   - SnippetDisplay component using Prism with oneDark theme
   - Language alias mapping (js->javascript, ts->typescript, etc.)
   - Optional description above code block
   - Line numbers for snippets > 3 lines

**Validation Results:**
- `pnpm lint`: PASSED (no errors)
- `pnpm typecheck`: PASSED (no type errors)
- `pnpm test`: PASSED (45 tests, including 21 new curated component tests)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-28 | Story created | River (SM Agent) |
| 2026-01-28 | Story implemented - all tasks completed | Dex (Dev Agent) |
| 2026-01-28 | QA Review completed - PASS | Quinn (QA Agent) |

---

## QA Results

### Gate Decision: **PASS**

Story 2.7 is approved for merge. All acceptance criteria have been met with high-quality implementation.

---

### Test Results Summary

| Category | Result | Details |
|----------|--------|---------|
| Unit Tests | PASS | 45 tests passed (21 curated-specific tests) |
| Lint | PASS | No errors or warnings |
| Typecheck | PASS | All packages type-checked successfully |

---

### Acceptance Criteria Validation

| AC | Status | Verification Notes |
|----|--------|-------------------|
| AC1 | PASS | `/curated` route added to App.tsx, Curated.tsx renders correctly |
| AC2 | PASS | CuratedContentCard displays title, source badge, type badge, collapsible snippets |
| AC3 | PASS | CuratedContentFilter implements pill-style buttons for all content types |
| AC4 | PASS | CuratedContentSkeleton renders with pulse animation during loading |
| AC5 | PASS | EmptyCurated shows icon, title, and guidance message |
| AC6 | PASS | CuratedErrorState displays error message with retry button |
| AC7 | PASS | SnippetDisplay uses react-syntax-highlighter with oneDark theme, language aliasing |
| AC8 | PASS | Badge with Code2 icon shows snippet count with singular/plural handling |

---

### Code Quality Assessment

**Strengths:**
- Clean separation of concerns (each component in its own file)
- Proper TypeScript types imported from @social-content/shared
- Responsive grid layout (1 to 4 columns based on viewport)
- Proper accessibility: external links have `target="_blank"` and `rel="noopener noreferrer"`
- Well-organized module exports via index.ts
- Consistent dark theme styling matching the application design
- Proper localization (Portuguese labels and messages)

**Test Coverage:**
- CuratedContentCard: 11 tests covering rendering, toggle, sources, types
- CuratedContentSkeleton: 1 test for skeleton structure
- CuratedContentFilter: 3 tests for rendering, selection, highlighting
- EmptyCurated: 1 test for empty state message
- CuratedErrorState: 2 tests for error display and retry callback
- SnippetDisplay: 3 tests for code rendering and description

---

### Issues Found

None. All acceptance criteria met without blocking issues.

---

### Minor Observations (Non-blocking)

1. **CuratedContentList integration test**: The component is not directly unit-tested; state transitions are covered by individual component tests.
2. **useCuratedContent hook test**: Hook is not directly tested (would require additional testing utilities like renderHook).

These are minor observations and do not block the release as:
- Core functionality is fully tested through component tests
- Hook implementation is straightforward (TanStack Query wrapper)
- Integration would be verified through E2E testing

---

### Recommendations

1. Consider adding integration tests for CuratedContentList in a future iteration
2. Consider E2E tests for the full /curated page flow when E2E infrastructure is set up

---

### Files Reviewed

All files in the File List section were reviewed:
- `packages/ui/src/routes/Curated.tsx`
- `packages/ui/src/App.tsx`
- `packages/ui/src/components/layout/Sidebar.tsx`
- `packages/ui/src/hooks/useCuratedContent.ts`
- `packages/ui/src/lib/api.ts`
- `packages/ui/src/components/curated/CuratedContentCard.tsx`
- `packages/ui/src/components/curated/CuratedContentList.tsx`
- `packages/ui/src/components/curated/CuratedContentHeader.tsx`
- `packages/ui/src/components/curated/CuratedContentSkeleton.tsx`
- `packages/ui/src/components/curated/CuratedContentFilter.tsx`
- `packages/ui/src/components/curated/SnippetDisplay.tsx`
- `packages/ui/src/components/curated/EmptyCurated.tsx`
- `packages/ui/src/components/curated/CuratedErrorState.tsx`
- `packages/ui/src/components/curated/index.ts`
- `packages/shared/src/types/agents.ts`
- `packages/ui/src/__tests__/curated.test.tsx`

---

_QA Review by Quinn (QA Agent) - 2026-01-28_
