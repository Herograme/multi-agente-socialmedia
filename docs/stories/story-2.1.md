# Story 2.1: Agente Curador - Skeleton

> Epic 2: Curador Agent

---

## Story

**Como** desenvolvedor,
**Quero** ter a estrutura base do Agente Curador implementada,
**Para que** eu possa construir as funcionalidades de curadoria de conteudo sobre uma base solida.

---

## Status

`QA Passed - Ready to Merge`

---

## Acceptance Criteria

| # | Criterio | Validacao |
|---|----------|-----------|
| AC1 | Classe `CuradorAgent` implementada em `packages/agents/` | Classe existe e instancia corretamente |
| AC2 | Interface `CuratedContent` definida com campos obrigatorios | Interface exportada e tipada |
| AC3 | Interface `ContentSource` definida para fontes de conteudo | Interface exportada e tipada |
| AC4 | Interface `CurationResult` definida para resultado da curadoria | Interface exportada e tipada |
| AC5 | Ciclo de vida do agente implementado (idle, running, success, error) | Estados mudam corretamente |
| AC6 | Factory function `createCuradorAgent()` exportada | Funcao cria instancia valida |
| AC7 | Integracao com tipos compartilhados de `@social-content/shared` | Usa Trend e outros tipos do shared |
| AC8 | Testes unitarios para estrutura base | `pnpm test` passa |

---

## Tasks

- [x] **Task 1:** Criar interfaces TypeScript do Curador
  - [x] Criar `packages/agents/src/agents/curador/types.ts`
  - [x] Definir interface `CuratedContent`
  - [x] Definir interface `ContentSource`
  - [x] Definir interface `CurationResult`
  - [x] Definir interface `CuradorConfig`
  - [x] Definir enum `AgentState` (idle, running, success, error)

- [x] **Task 2:** Implementar classe base CuradorAgent
  - [x] Criar `packages/agents/src/agents/curador/curador-agent.ts`
  - [x] Implementar interface `Agent<CuradorInput, CuradorOutput>`
  - [x] Implementar gestao de estado (lifecycle)
  - [x] Implementar metodos `start()`, `stop()`, `getState()`
  - [x] Adicionar event emitter para mudancas de estado

- [x] **Task 3:** Criar factory function
  - [x] Criar `packages/agents/src/agents/curador/factory.ts`
  - [x] Implementar `createCuradorAgent(config?: CuradorConfig)`
  - [x] Validar configuracao de entrada
  - [x] Retornar instancia configurada

- [x] **Task 4:** Integrar com @social-content/shared
  - [x] Importar tipo `Trend` do shared
  - [x] Usar `RateLimiter` do shared se necessario
  - [x] Garantir compatibilidade de tipos

- [x] **Task 5:** Criar barrel exports
  - [x] Criar `packages/agents/src/agents/curador/index.ts`
  - [x] Atualizar `packages/agents/src/agents/index.ts`
  - [x] Atualizar `packages/agents/src/index.ts`

- [x] **Task 6:** Escrever testes unitarios
  - [x] Criar `packages/agents/src/__tests__/curador.test.ts`
  - [x] Testar instanciacao do agente
  - [x] Testar ciclo de vida (state transitions)
  - [x] Testar factory function
  - [x] Testar integracao com tipos shared

---

## Dev Notes

### Estrutura do Agente

```
packages/agents/
├── src/
│   ├── agents/
│   │   ├── curador/
│   │   │   ├── curador-agent.ts
│   │   │   ├── factory.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── researcher.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── __tests__/
│   │   ├── curador.test.ts
│   │   ├── researcher.test.ts
│   │   └── sources.test.ts
│   └── index.ts
```

### Interfaces TypeScript

```typescript
// types.ts - Interfaces do Curador

import { Trend } from '@social-content/shared';

/**
 * Estados do ciclo de vida do agente
 */
export enum AgentState {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error'
}

/**
 * Fonte de conteudo para curadoria
 */
export interface ContentSource {
  id: string;
  name: string;
  type: 'rss' | 'api' | 'scraper';
  url: string;
  enabled: boolean;
  priority: number; // 1-10, higher = more important
}

/**
 * Conteudo curado e processado
 */
export interface CuratedContent {
  id: string;
  originalTrend: Trend;
  title: string;
  summary: string;
  relevanceScore: number; // 0-100
  categories: string[];
  tags: string[];
  sourceId: string;
  curatedAt: Date;
  metadata: {
    wordCount: number;
    readingTime: number; // minutes
    language: string;
  };
}

/**
 * Resultado da operacao de curadoria
 */
export interface CurationResult {
  success: boolean;
  content: CuratedContent[];
  stats: {
    totalProcessed: number;
    totalCurated: number;
    totalFiltered: number;
    processingTimeMs: number;
  };
  errors: CurationError[];
  timestamp: Date;
}

/**
 * Erro durante curadoria
 */
export interface CurationError {
  sourceId: string;
  trendId?: string;
  message: string;
  code: string;
}

/**
 * Configuracao do agente curador
 */
export interface CuradorConfig {
  sources: ContentSource[];
  minRelevanceScore: number; // Threshold para incluir conteudo
  maxResults: number;
  categories: string[]; // Categorias de interesse
  rateLimitPerMinute: number;
}

/**
 * Input para o agente curador
 */
export interface CuradorInput {
  trends: Trend[];
  options?: {
    forceRefresh?: boolean;
    filterCategories?: string[];
    minScore?: number;
  };
}

/**
 * Output do agente curador
 */
export interface CuradorOutput {
  result: CurationResult;
  state: AgentState;
}
```

### Classe CuradorAgent

```typescript
// curador-agent.ts

import { EventEmitter } from 'events';
import { Agent } from '../types';
import {
  AgentState,
  CuradorConfig,
  CuradorInput,
  CuradorOutput,
  CurationResult
} from './types';

export class CuradorAgent
  extends EventEmitter
  implements Agent<CuradorInput, CuradorOutput> {

  readonly name = 'CuradorAgent';
  private state: AgentState = AgentState.IDLE;
  private config: CuradorConfig;

  constructor(config: CuradorConfig) {
    super();
    this.config = config;
  }

  getState(): AgentState {
    return this.state;
  }

  private setState(newState: AgentState): void {
    const previousState = this.state;
    this.state = newState;
    this.emit('stateChange', { previous: previousState, current: newState });
  }

  async run(input: CuradorInput): Promise<CuradorOutput> {
    this.setState(AgentState.RUNNING);

    try {
      // Skeleton - actual implementation in future stories
      const result: CurationResult = {
        success: true,
        content: [],
        stats: {
          totalProcessed: input.trends.length,
          totalCurated: 0,
          totalFiltered: 0,
          processingTimeMs: 0
        },
        errors: [],
        timestamp: new Date()
      };

      this.setState(AgentState.SUCCESS);
      return { result, state: this.state };
    } catch (error) {
      this.setState(AgentState.ERROR);
      throw error;
    }
  }

  start(): void {
    if (this.state === AgentState.IDLE) {
      this.setState(AgentState.RUNNING);
    }
  }

  stop(): void {
    this.setState(AgentState.IDLE);
  }
}
```

### Factory Function

```typescript
// factory.ts

import { CuradorAgent } from './curador-agent';
import { CuradorConfig, ContentSource } from './types';

const DEFAULT_CONFIG: CuradorConfig = {
  sources: [],
  minRelevanceScore: 50,
  maxResults: 20,
  categories: ['tech', 'programming', 'ai'],
  rateLimitPerMinute: 60
};

export function createCuradorAgent(
  config?: Partial<CuradorConfig>
): CuradorAgent {
  const mergedConfig: CuradorConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    sources: config?.sources ?? DEFAULT_CONFIG.sources
  };

  validateConfig(mergedConfig);

  return new CuradorAgent(mergedConfig);
}

function validateConfig(config: CuradorConfig): void {
  if (config.minRelevanceScore < 0 || config.minRelevanceScore > 100) {
    throw new Error('minRelevanceScore must be between 0 and 100');
  }

  if (config.maxResults < 1) {
    throw new Error('maxResults must be at least 1');
  }

  if (config.rateLimitPerMinute < 1) {
    throw new Error('rateLimitPerMinute must be at least 1');
  }
}
```

---

## Testing

### Testes de Instanciacao

```typescript
import { describe, it, expect } from 'vitest';
import {
  CuradorAgent,
  createCuradorAgent,
  AgentState
} from '../agents/curador';

describe('CuradorAgent', () => {
  describe('instantiation', () => {
    it('should create agent with default config', () => {
      const agent = createCuradorAgent();
      expect(agent).toBeInstanceOf(CuradorAgent);
      expect(agent.name).toBe('CuradorAgent');
    });

    it('should create agent with custom config', () => {
      const agent = createCuradorAgent({
        minRelevanceScore: 70,
        maxResults: 50
      });
      expect(agent).toBeInstanceOf(CuradorAgent);
    });
  });
});
```

### Testes de Ciclo de Vida

```typescript
describe('CuradorAgent lifecycle', () => {
  it('should start in IDLE state', () => {
    const agent = createCuradorAgent();
    expect(agent.getState()).toBe(AgentState.IDLE);
  });

  it('should transition to RUNNING on start()', () => {
    const agent = createCuradorAgent();
    agent.start();
    expect(agent.getState()).toBe(AgentState.RUNNING);
  });

  it('should emit stateChange event', () => {
    const agent = createCuradorAgent();
    const stateChanges: any[] = [];

    agent.on('stateChange', (change) => {
      stateChanges.push(change);
    });

    agent.start();

    expect(stateChanges).toHaveLength(1);
    expect(stateChanges[0]).toEqual({
      previous: AgentState.IDLE,
      current: AgentState.RUNNING
    });
  });

  it('should return to IDLE on stop()', () => {
    const agent = createCuradorAgent();
    agent.start();
    agent.stop();
    expect(agent.getState()).toBe(AgentState.IDLE);
  });
});
```

### Testes da Factory

```typescript
describe('createCuradorAgent factory', () => {
  it('should throw on invalid minRelevanceScore', () => {
    expect(() => createCuradorAgent({ minRelevanceScore: -1 }))
      .toThrow('minRelevanceScore must be between 0 and 100');

    expect(() => createCuradorAgent({ minRelevanceScore: 101 }))
      .toThrow('minRelevanceScore must be between 0 and 100');
  });

  it('should throw on invalid maxResults', () => {
    expect(() => createCuradorAgent({ maxResults: 0 }))
      .toThrow('maxResults must be at least 1');
  });

  it('should merge config with defaults', () => {
    const agent = createCuradorAgent({ maxResults: 100 });
    expect(agent).toBeInstanceOf(CuradorAgent);
  });
});
```

---

## References

- [PRD](../prd.md) - Epic 2: Curador Agent
- [Architecture](../architecture.md) - Agent Layer
- [Brief](../brief.md) - Agente Curador
- [Story 1.6](./story-1.6.md) - Researcher Agent (reference implementation)

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Created | `packages/agents/src/agents/curador/types.ts` | Interfaces: CuratedContent, ContentSource, CurationResult, CuradorConfig, CurationError, CuradorInput, CuradorOutput, StateChangeEvent, enum AgentState |
| Created | `packages/agents/src/agents/curador/curador-agent.ts` | CuradorAgent class with lifecycle management, event emitter |
| Created | `packages/agents/src/agents/curador/factory.ts` | createCuradorAgent() factory function with validation |
| Created | `packages/agents/src/agents/curador/index.ts` | Barrel exports for curador module |
| Modified | `packages/agents/src/agents/index.ts` | Added curador exports |
| Created | `packages/agents/src/__tests__/curador.test.ts` | 34 unit tests covering all acceptance criteria |

### Debug Log

_No debug entries_

### Completion Notes

Story 2.1 implemented successfully. All acceptance criteria met:

- AC1: `CuradorAgent` class implemented with full lifecycle management
- AC2: `CuratedContent` interface defined with all required fields
- AC3: `ContentSource` interface defined for content sources
- AC4: `CurationResult` interface defined for curation results
- AC5: Lifecycle states (idle, running, success, error) with state change events
- AC6: `createCuradorAgent()` factory function with config validation
- AC7: Integration with `@social-content/shared` Trend type
- AC8: 34 unit tests passing (pnpm test)

Validations:
- `npx eslint packages/agents/src/agents/curador --ext .ts` - PASSED
- `npx tsc --noEmit --project packages/agents/tsconfig.json` - PASSED
- `npx vitest run` - 75 tests passed (34 curador + 41 existing)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story created | River (SM Agent) |
| 2026-01-28 | Story implemented - all tasks complete | Dex (Dev Agent) |
| 2026-01-28 | QA Review completed - PASS | Quinn (QA Agent) |

---

## QA Results

### Gate Decision: PASS

Story 2.1 successfully meets all acceptance criteria and is ready to merge.

### Test Results Summary

| Test Suite | Tests | Status |
|------------|-------|--------|
| curador.test.ts | 34 | PASSED |
| All agents package tests | 352 | PASSED |
| ESLint | - | PASSED (no errors) |
| TypeScript (noEmit) | - | PASSED (no errors) |

**Execution time:** 1.31s for curador tests, 12.45s for full agents suite

### Acceptance Criteria Verification

| AC | Criteria | Status | Notes |
|----|----------|--------|-------|
| AC1 | `CuradorAgent` class implemented | PASS | Class exists in `packages/agents/src/agents/curador/curador-agent.ts`, instantiates correctly with `name = 'CuradorAgent'` |
| AC2 | `CuratedContent` interface defined | PASS | Interface exported with all required fields: id, originalTrend, title, summary, relevanceScore, categories, tags, sourceId, curatedAt, metadata |
| AC3 | `ContentSource` interface defined | PASS | Interface exported with fields: id, name, type, url, enabled, priority |
| AC4 | `CurationResult` interface defined | PASS | Interface exported with fields: success, content, stats, errors, timestamp |
| AC5 | Lifecycle implemented (idle, running, success, error) | PASS | `AgentState` enum with all states, `stateChange` events emitted on transitions |
| AC6 | `createCuradorAgent()` factory exported | PASS | Factory function with config validation (minRelevanceScore, maxResults, rateLimitPerMinute, sources) |
| AC7 | Integration with `@social-content/shared` | PASS | Uses `Trend` type from shared package, verified in tests with real Trend objects |
| AC8 | Unit tests for base structure | PASS | 34 tests covering instantiation, lifecycle, factory, and type integration |

### Code Quality Review

**Strengths:**
- Clean, well-documented TypeScript code with JSDoc comments
- Proper separation of concerns (types, agent class, factory)
- Comprehensive input validation in factory function with descriptive error messages
- Follows existing ResearcherAgent patterns (consistent architecture)
- EventEmitter integration for state change notifications
- Immutable config via `getConfig()` returning copies
- Proper error handling in `run()` method

**No Issues Found:**
- No security vulnerabilities (no eval, innerHTML, or unsafe patterns)
- No code smells detected
- TypeScript strict mode compliant
- ESLint clean (no warnings or errors)

### Files Reviewed

| File | Lines | Status |
|------|-------|--------|
| `packages/agents/src/agents/curador/types.ts` | 114 | OK |
| `packages/agents/src/agents/curador/curador-agent.ts` | 159 | OK |
| `packages/agents/src/agents/curador/factory.ts` | 106 | OK |
| `packages/agents/src/agents/curador/index.ts` | 24 | OK |
| `packages/agents/src/agents/index.ts` | 27 | OK (updated with exports) |
| `packages/agents/src/__tests__/curador.test.ts` | 398 | OK |

### Recommendations

None. Implementation is complete and follows project standards.

---

_QA Review completed by Quinn (QA Agent) - 2026-01-28_
