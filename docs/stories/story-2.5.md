# Story 2.5: Reference Aggregator

> Epic 2: Curador Agent

---

## Story

**Como** criador de conteudo,
**Quero** que o sistema agregue e organize todas as referencias curadas de multiplas fontes,
**Para que** eu tenha uma lista unificada e enriquecida de conteudo relevante sem duplicatas.

---

## Status

`QA Passed - Ready to Merge`

---

## Acceptance Criteria

| # | Criterio | Validacao |
|---|----------|-----------|
| AC1 | Classe `ReferenceAggregator` implementada no package `agents` | Classe existe e instancia corretamente |
| AC2 | Deduplicacao por URL identifica e remove referencias duplicadas | URLs identicas retornam apenas uma referencia |
| AC3 | Deduplicacao por similaridade de titulo detecta conteudo similar | Titulos 85%+ similares sao agrupados |
| AC4 | Agrupamento por tipo de conteudo (article, code, tutorial, video) | Referencias organizadas por categoria |
| AC5 | Enriquecimento de metadados (author, date, source, readTime) | Todas referencias tem metadados completos |
| AC6 | Estrutura de saida final padronizada `CuratedOutput` | Output segue interface definida |
| AC7 | Ordenacao por relevancia e recencia dentro de cada grupo | Grupos ordenados corretamente |
| AC8 | Testes unitarios cobrindo todos os cenarios de agregacao | `pnpm test` passa com coverage > 80% |

---

## Tasks

- [x] **Task 1:** Criar estrutura base do ReferenceAggregator
  - [x] Criar `packages/agents/src/services/aggregator/types.ts`
  - [x] Criar `packages/agents/src/services/aggregator/reference-aggregator.ts`
  - [x] Criar `packages/agents/src/services/aggregator/index.ts`

- [x] **Task 2:** Implementar deduplicacao por URL
  - [x] Criar metodo `deduplicateByUrl()`
  - [x] Normalizar URLs (remover trailing slash, query params opcionais)
  - [x] Manter primeira ocorrencia, descartar duplicatas

- [x] **Task 3:** Implementar deduplicacao por similaridade de titulo
  - [x] Criar metodo `deduplicateByTitleSimilarity()`
  - [x] Reutilizar algoritmo Levenshtein do ResearcherAgent
  - [x] Configurar threshold de 85% para similaridade
  - [x] Merge de metadados quando duplicatas encontradas

- [x] **Task 4:** Implementar agrupamento por tipo de conteudo
  - [x] Criar enum `ContentType` (article, code, tutorial, video, other)
  - [x] Criar metodo `groupByContentType()`
  - [x] Implementar deteccao de tipo baseado em URL patterns e metadados
  - [x] Fallback para 'article' quando tipo indeterminado

- [x] **Task 5:** Implementar enriquecimento de metadados
  - [x] Criar metodo `enrichMetadata()`
  - [x] Extrair author de diferentes formatos de fonte
  - [x] Normalizar datas para ISO format
  - [x] Calcular estimativa de readTime baseado em content length
  - [x] Adicionar source domain e favicon URL

- [x] **Task 6:** Implementar estrutura de saida final
  - [x] Criar interface `CuratedOutput`
  - [x] Criar metodo `aggregate()` que orquestra todo o pipeline
  - [x] Implementar ordenacao por score (relevancia + recencia)
  - [x] Incluir estatisticas de agregacao no output

- [x] **Task 7:** Escrever testes unitarios
  - [x] Testes de deduplicacao por URL
  - [x] Testes de deduplicacao por titulo similar
  - [x] Testes de agrupamento por tipo
  - [x] Testes de enriquecimento de metadados
  - [x] Testes do pipeline completo de agregacao
  - [x] Testes de edge cases (lista vazia, fonte unica)

---

## Dev Notes

### Estrutura do Agregador

```
packages/agents/
├── src/
│   ├── services/
│   │   ├── aggregator/
│   │   │   ├── types.ts
│   │   │   ├── reference-aggregator.ts
│   │   │   └── index.ts
│   │   ├── sources/
│   │   │   └── ... (existing)
│   │   └── index.ts
│   └── ...
```

### Interfaces TypeScript

```typescript
// Content type enum
export enum ContentType {
  ARTICLE = 'article',
  CODE = 'code',
  TUTORIAL = 'tutorial',
  VIDEO = 'video',
  OTHER = 'other'
}

// Input reference from curators
export interface CuratedReference {
  id: string;
  title: string;
  url: string;
  source: string;           // 'devto' | 'hackernews' | 'reddit' | etc
  discoveredAt: Date;
  rawMetadata?: Record<string, unknown>;
}

// Enriched reference after aggregation
export interface EnrichedReference {
  id: string;
  title: string;
  url: string;
  normalizedUrl: string;
  source: string;
  contentType: ContentType;
  discoveredAt: Date;
  metadata: ReferenceMetadata;
  relevanceScore: number;
}

// Metadata structure
export interface ReferenceMetadata {
  author: string | null;
  publishedAt: Date | null;
  sourceDomain: string;
  faviconUrl: string;
  estimatedReadTime: number | null;  // in minutes
  tags: string[];
  language: string;
}

// Grouped output structure
export interface ContentGroup {
  type: ContentType;
  references: EnrichedReference[];
  count: number;
}

// Final curated output
export interface CuratedOutput {
  groups: ContentGroup[];
  totalReferences: number;
  duplicatesRemoved: number;
  aggregatedAt: Date;
  sources: string[];
  statistics: AggregationStats;
}

// Aggregation statistics
export interface AggregationStats {
  bySource: Record<string, number>;
  byContentType: Record<ContentType, number>;
  urlDuplicates: number;
  titleDuplicates: number;
  processingTimeMs: number;
}
```

### ReferenceAggregator Class

```typescript
export interface AggregatorOptions {
  titleSimilarityThreshold?: number;  // default 0.85
  includeRawMetadata?: boolean;       // default false
  maxReferencesPerGroup?: number;     // default unlimited
}

export class ReferenceAggregator {
  private options: Required<AggregatorOptions>;

  constructor(options?: AggregatorOptions);

  // Main aggregation pipeline
  aggregate(references: CuratedReference[]): Promise<CuratedOutput>;

  // Individual pipeline steps (exposed for testing)
  deduplicateByUrl(refs: CuratedReference[]): CuratedReference[];
  deduplicateByTitleSimilarity(refs: CuratedReference[]): CuratedReference[];
  groupByContentType(refs: EnrichedReference[]): ContentGroup[];
  enrichMetadata(ref: CuratedReference): EnrichedReference;
  calculateRelevanceScore(ref: EnrichedReference): number;
}
```

### URL Normalization

```typescript
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slash
    let normalized = parsed.origin + parsed.pathname.replace(/\/$/, '');
    // Keep essential query params, remove tracking params
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'ref'];
    const params = new URLSearchParams(parsed.search);
    trackingParams.forEach(p => params.delete(p));
    const search = params.toString();
    if (search) normalized += '?' + search;
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}
```

### Content Type Detection

```typescript
const typePatterns: Record<ContentType, RegExp[]> = {
  [ContentType.CODE]: [
    /github\.com/i,
    /gitlab\.com/i,
    /gist\./i,
    /codepen\.io/i,
    /codesandbox\.io/i,
  ],
  [ContentType.VIDEO]: [
    /youtube\.com/i,
    /youtu\.be/i,
    /vimeo\.com/i,
    /twitch\.tv/i,
  ],
  [ContentType.TUTORIAL]: [
    /tutorial/i,
    /how-to/i,
    /guide/i,
    /learn/i,
    /course/i,
  ],
  [ContentType.ARTICLE]: [
    /blog/i,
    /article/i,
    /post/i,
    /news/i,
  ],
};

function detectContentType(url: string, title: string): ContentType {
  for (const [type, patterns] of Object.entries(typePatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(url) || pattern.test(title)) {
        return type as ContentType;
      }
    }
  }
  return ContentType.OTHER;
}
```

### Relevance Score Calculation

```typescript
function calculateRelevanceScore(ref: EnrichedReference): number {
  let score = 0;

  // Recency bonus (max 40 points)
  const ageInHours = (Date.now() - ref.discoveredAt.getTime()) / (1000 * 60 * 60);
  score += Math.max(0, 40 - (ageInHours * 0.5));

  // Source weight (max 30 points)
  const sourceWeights: Record<string, number> = {
    hackernews: 30,
    reddit: 25,
    devto: 20,
    github: 30,
    default: 15,
  };
  score += sourceWeights[ref.source] || sourceWeights.default;

  // Has author bonus (10 points)
  if (ref.metadata.author) score += 10;

  // Has tags bonus (max 10 points)
  score += Math.min(ref.metadata.tags.length * 2, 10);

  // Content type bonus (max 10 points)
  const typeBonus: Record<ContentType, number> = {
    [ContentType.TUTORIAL]: 10,
    [ContentType.CODE]: 8,
    [ContentType.ARTICLE]: 6,
    [ContentType.VIDEO]: 5,
    [ContentType.OTHER]: 0,
  };
  score += typeBonus[ref.contentType];

  return Math.round(score);
}
```

---

## Testing

### Test Cases

```typescript
describe('ReferenceAggregator', () => {
  describe('deduplicateByUrl', () => {
    it('should remove exact URL duplicates');
    it('should normalize URLs before comparison');
    it('should keep first occurrence');
    it('should handle URLs with different protocols');
    it('should ignore tracking parameters');
  });

  describe('deduplicateByTitleSimilarity', () => {
    it('should detect similar titles above threshold');
    it('should keep distinct titles below threshold');
    it('should merge metadata from duplicates');
    it('should handle empty titles');
  });

  describe('groupByContentType', () => {
    it('should group references by detected type');
    it('should detect code repositories');
    it('should detect video content');
    it('should detect tutorials');
    it('should fallback to article for unknown types');
  });

  describe('enrichMetadata', () => {
    it('should extract author from raw metadata');
    it('should normalize dates to ISO format');
    it('should calculate read time estimate');
    it('should extract source domain');
    it('should generate favicon URL');
  });

  describe('aggregate (full pipeline)', () => {
    it('should process empty input');
    it('should process single reference');
    it('should aggregate multiple sources');
    it('should return correct statistics');
    it('should order by relevance within groups');
  });
});
```

### Mock Data

```typescript
const mockReferences: CuratedReference[] = [
  {
    id: 'ref-1',
    title: 'React 19 New Features Guide',
    url: 'https://dev.to/react-19-features',
    source: 'devto',
    discoveredAt: new Date('2026-01-28T10:00:00Z'),
    rawMetadata: { author: 'johndoe', tags: ['react', 'javascript'] }
  },
  {
    id: 'ref-2',
    title: 'React 19: New Features Guide',  // Similar title
    url: 'https://hackernews.com/react-19',
    source: 'hackernews',
    discoveredAt: new Date('2026-01-28T08:00:00Z'),
    rawMetadata: { by: 'janedoe' }
  },
  {
    id: 'ref-3',
    title: 'Building a CLI with Node.js',
    url: 'https://github.com/example/cli-tutorial',
    source: 'github',
    discoveredAt: new Date('2026-01-27T15:00:00Z'),
    rawMetadata: {}
  }
];
```

---

## References

- [PRD](../prd.md) - Story 2.5
- [Architecture](../architecture.md) - Curador Agent
- [Brief](../brief.md) - Agente Curador
- [Story 1.6](./story-1.6.md) - ResearcherAgent (deduplication algorithm reference)

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Created | packages/agents/src/services/aggregator/types.ts | All type definitions (ContentType enum, CuratedReference, EnrichedReference, ReferenceMetadata, ContentGroup, CuratedOutput, AggregatorOptions, AggregationStats) |
| Created | packages/agents/src/services/aggregator/reference-aggregator.ts | ReferenceAggregator class with deduplicateByUrl, deduplicateByTitleSimilarity, groupByContentType, enrichMetadata, calculateRelevanceScore, aggregate methods |
| Created | packages/agents/src/services/aggregator/index.ts | Module exports |
| Modified | packages/agents/src/services/index.ts | Added aggregator export |
| Created | packages/agents/src/__tests__/aggregator.test.ts | 65 unit tests covering all aggregator functionality |

### Debug Log

_No debug entries_

### Completion Notes

Implementation complete with all acceptance criteria met:
- AC1: ReferenceAggregator class implemented with factory function
- AC2: URL deduplication with normalization (trailing slash, tracking params)
- AC3: Title similarity deduplication using Levenshtein distance (85% threshold configurable)
- AC4: ContentType enum and groupByContentType with URL/title pattern detection
- AC5: Metadata enrichment (author, publishedAt, sourceDomain, faviconUrl, readTime, tags, language)
- AC6: CuratedOutput with groups, statistics, and metadata
- AC7: Relevance scoring with recency, source weight, author/tags bonuses
- AC8: 65 unit tests covering all scenarios (all passing)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story created | River (SM Agent) |
| 2026-01-28 | Implementation complete - all tasks done | Dex (Dev Agent) |
| 2026-01-28 | QA Review completed - PASS | Quinn (QA Agent) |

---

## QA Results

### Gate Decision: PASS

All acceptance criteria have been verified and the implementation is ready to merge.

### Test Results Summary

| Metric | Result |
|--------|--------|
| Total Tests | 65 |
| Passed | 65 |
| Failed | 0 |
| Test Duration | ~115ms |
| TypeScript Compilation | No errors |
| ESLint | No errors |

### Acceptance Criteria Verification

| # | Criterio | Status | Notes |
|---|----------|--------|-------|
| AC1 | Classe `ReferenceAggregator` implementada | PASS | Class exists at `packages/agents/src/services/aggregator/reference-aggregator.ts` with factory function `createReferenceAggregator()` |
| AC2 | Deduplicacao por URL | PASS | `normalizeUrl()` removes trailing slashes, tracking params (utm_*, fbclid, gclid, etc.), and normalizes to lowercase. 4 tests verify this. |
| AC3 | Deduplicacao por similaridade de titulo (85%) | PASS | Uses Levenshtein distance algorithm with configurable threshold (default 0.85). Merges metadata from duplicates. 4 tests verify this. |
| AC4 | Agrupamento por tipo de conteudo | PASS | `ContentType` enum with ARTICLE, CODE, TUTORIAL, VIDEO, OTHER. Pattern detection for GitHub/GitLab (CODE), YouTube/Vimeo (VIDEO), tutorial keywords (TUTORIAL). Fallback to ARTICLE. |
| AC5 | Enriquecimento de metadados | PASS | `enrichMetadata()` extracts: author (multiple field names), publishedAt (string/timestamp), sourceDomain, faviconUrl, estimatedReadTime, tags, language |
| AC6 | Estrutura de saida `CuratedOutput` | PASS | Interface defined with groups, totalReferences, duplicatesRemoved, aggregatedAt, sources, and statistics |
| AC7 | Ordenacao por relevancia e recencia | PASS | `calculateRelevanceScore()` considers: recency (max 40pts), source weight (max 30pts), author bonus (10pts), tags bonus (max 10pts), content type bonus (max 10pts) |
| AC8 | Testes unitarios (coverage > 80%) | PASS | 65 comprehensive unit tests covering all methods, edge cases (empty input, single reference, malformed URLs), and the full aggregation pipeline |

### Code Quality Assessment

**Strengths:**
- Clean, well-documented TypeScript code
- All types properly exported from `types.ts`
- Comprehensive helper functions (normalizeUrl, normalizeTitle, levenshteinDistance, calculateSimilarity, etc.)
- Good separation of concerns with modular design
- Proper error handling for malformed URLs
- Configurable options via `AggregatorOptions` interface
- Factory function pattern for easy instantiation
- Logging integrated via shared logger

**Test Coverage:**
- URL normalization: 6 tests
- Title normalization: 4 tests
- Levenshtein distance: 3 tests
- Similarity calculation: 4 tests
- Content type detection: 7 tests
- Domain extraction: 2 tests
- Favicon URL generation: 1 test
- Read time estimation: 2 tests
- Author extraction: 2 tests
- Date extraction: 3 tests
- Tag extraction: 3 tests
- URL deduplication: 4 tests
- Title similarity deduplication: 4 tests
- Content type grouping: 2 tests
- Metadata enrichment: 5 tests
- Relevance scoring: 4 tests
- Full pipeline: 9 tests

### Issues Found

None. Implementation meets all requirements.

### Recommendations

None. The implementation is complete and well-tested. Ready for merge.
