# Story 1.6: Agente Pesquisador — Core

> Epic 1: Foundation & Pesquisador

---

## Story

**Como** usuário,
**Quero** que o sistema pesquise tendências tech automaticamente,
**Para que** eu tenha tópicos relevantes para criar conteúdo.

---

## Status

`Ready for Review`

---

## Acceptance Criteria

| # | Critério | Validação |
|---|----------|-----------|
| AC1 | Agente `Researcher` implementado no package `agents` | Classe existe e instancia |
| AC2 | Busca tendências do Dev.to via RSS feed | Retorna trends do Dev.to |
| AC3 | Busca tendências do Hacker News via API pública | Retorna trends do HN |
| AC4 | Busca tendências do Reddit r/programming via RSS | Retorna trends do Reddit |
| AC5 | Normalização dos dados em formato `Trend` unificado | Todos seguem mesma interface |
| AC6 | Deduplicação de tendências similares | Sem duplicatas óbvias |
| AC7 | Respeito a rate limits das fontes | Não faz requests excessivos |
| AC8 | Retorno de lista ordenada por relevância/recência | Lista ordenada |
| AC9 | Testes unitários com mocks das fontes | `pnpm test` passa |

---

## Tasks

- [x] **Task 1:** Estruturar package agents
  - [x] Criar `packages/agents/src/agents/` directory
  - [x] Criar interface base `Agent`
  - [x] Criar `packages/agents/src/agents/researcher.ts`

- [x] **Task 2:** Implementar fetcher do Dev.to
  - [x] Criar `src/services/sources/devto.ts`
  - [x] Parsear RSS feed do Dev.to
  - [x] Normalizar para formato `Trend`

- [x] **Task 3:** Implementar fetcher do Hacker News
  - [x] Criar `src/services/sources/hackernews.ts`
  - [x] Usar API pública do HN (top stories)
  - [x] Normalizar para formato `Trend`

- [x] **Task 4:** Implementar fetcher do Reddit
  - [x] Criar `src/services/sources/reddit.ts`
  - [x] Parsear RSS feed r/programming
  - [x] Normalizar para formato `Trend`

- [x] **Task 5:** Implementar Researcher Agent
  - [x] Agregar resultados de todas as fontes
  - [x] Implementar deduplicação por título similar
  - [x] Ordenar por data (mais recente primeiro)
  - [x] Respeitar rate limits

- [x] **Task 6:** Escrever testes
  - [x] Mock de RSS feeds
  - [x] Mock de HN API
  - [x] Teste de deduplicação
  - [x] Teste de ordenação

---

## Dev Notes

### Estrutura do Agente

```
packages/agents/
├── src/
│   ├── agents/
│   │   ├── researcher.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── sources/
│   │   │   ├── devto.ts
│   │   │   ├── hackernews.ts
│   │   │   ├── reddit.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── __tests__/
│   │   ├── researcher.test.ts
│   │   └── sources.test.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Interface do Agente

```typescript
// Base Agent interface
export interface Agent<TInput, TOutput> {
  name: string;
  run(input: TInput): Promise<TOutput>;
}

// Researcher specific
export interface ResearcherInput {
  sources: string[];  // ['devto', 'hackernews', 'reddit']
  limit?: number;     // Max trends to return
}

export interface ResearcherOutput {
  trends: Trend[];
  metadata: {
    sourcesQueried: string[];
    totalFound: number;
    timestamp: Date;
  };
}
```

### Dev.to RSS Feed

```typescript
// Feed URL: https://dev.to/feed
// Parse with: rss-parser or similar

interface DevToArticle {
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  categories: string[];
}

function normalizeDevTo(article: DevToArticle): Trend {
  return {
    id: generateId(),
    title: article.title,
    source: 'devto',
    url: article.link,
    discoveredAt: new Date(article.pubDate),
  };
}
```

### Hacker News API

```typescript
// Top stories: https://hacker-news.firebaseio.com/v0/topstories.json
// Item detail: https://hacker-news.firebaseio.com/v0/item/{id}.json

interface HNItem {
  id: number;
  title: string;
  url?: string;
  score: number;
  time: number;
}
```

### Deduplicação

```typescript
function deduplicateTrends(trends: Trend[]): Trend[] {
  const seen = new Set<string>();
  return trends.filter(trend => {
    const normalized = trend.title.toLowerCase().trim();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}
```

---

## Testing

### Mocks

```typescript
// Mock RSS feed response
const mockDevToFeed = `
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>React 19 New Features</title>
      <link>https://dev.to/post/123</link>
      <pubDate>Mon, 28 Jan 2025 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>
`;

// Mock HN API response
const mockHNTopStories = [12345, 12346, 12347];
const mockHNItem = {
  id: 12345,
  title: 'Show HN: My new project',
  url: 'https://example.com',
  score: 150,
  time: 1706436000
};
```

---

## References

- [PRD](../prd.md) - Story 1.6
- [Architecture](../architecture.md) - Agent Layer
- [Brief](../brief.md) - Agente Pesquisador

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Created | `packages/agents/src/services/sources/types.ts` | Source fetcher types (FetchOptions, TrendSource, DevToRawArticle, HackerNewsItem, RedditRawEntry) |
| Created | `packages/agents/src/services/sources/devto.ts` | Dev.to RSS feed fetcher with XML parsing |
| Created | `packages/agents/src/services/sources/hackernews.ts` | Hacker News API fetcher (top stories + items) |
| Created | `packages/agents/src/services/sources/reddit.ts` | Reddit Atom feed fetcher for r/programming |
| Created | `packages/agents/src/services/sources/index.ts` | Source exports barrel file |
| Created | `packages/agents/src/services/index.ts` | Services exports barrel file |
| Created | `packages/agents/src/agents/researcher.ts` | ResearcherAgent with deduplication, sorting, rate limiting |
| Modified | `packages/agents/src/agents/index.ts` | Added ResearcherAgent exports |
| Modified | `packages/agents/src/index.ts` | Added services exports |
| Created | `packages/agents/src/__tests__/sources.test.ts` | Unit tests for DevTo, HN, Reddit sources (11 tests) |
| Created | `packages/agents/src/__tests__/researcher.test.ts` | Unit tests for ResearcherAgent (19 tests) |
| Created | `packages/agents/vitest.config.ts` | Vitest configuration for agents package |
| Modified | `packages/agents/package.json` | Added type: module, exports, @types/node |
| Modified | `packages/agents/tsconfig.json` | Updated for ESNext module, bundler resolution |

### Debug Log

_No debug entries_

### Completion Notes

**Implementation Summary:**

1. **ResearcherAgent** - Core agent that orchestrates trend discovery from multiple sources:
   - Fetches trends from Dev.to, Hacker News, and Reddit in parallel
   - Implements title similarity detection using Levenshtein distance algorithm
   - Deduplicates trends across sources (80% similarity threshold)
   - Sorts results by discovery date (most recent first)
   - Uses RateLimiter from @social-content/shared to respect API limits
   - Returns metadata with source statistics

2. **Source Implementations:**
   - `DevToSource` - Parses RSS feed from dev.to/feed
   - `HackerNewsSource` - Uses Firebase API (topstories + item details)
   - `RedditSource` - Parses Atom feed from r/programming

3. **Test Coverage:** 30 tests total
   - 11 tests for individual sources (parsing, normalization, error handling)
   - 19 tests for ResearcherAgent (deduplication, sorting, aggregation, failures)

4. **Validations Passed:**
   - TypeScript: `pnpm typecheck` - passed
   - Linting: `pnpm lint` - passed
   - Tests: `pnpm test` - 30/30 passed
   - Build: `pnpm build` - passed

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-28 | Story created | River (SM Agent) |
| 2026-01-28 | Implementation complete - all tasks done | Dex (Dev Agent) |
