# Story 1.4: Package Shared com Types e Utils

> Epic 1: Foundation & Pesquisador

---

## Story

**Como** desenvolvedor,
**Quero** tipos e utilitários compartilhados entre packages,
**Para que** eu mantenha consistência e evite duplicação.

---

## Status

`Ready for Review`

---

## Acceptance Criteria

| # | Critério | Validação |
|---|----------|-----------|
| AC1 | Package `shared` criado e buildando corretamente | `pnpm build` passa |
| AC2 | Tipos base definidos: `Agent`, `AgentResult`, `Trend`, `Topic` | Interfaces exportadas |
| AC3 | Tipos de configuração: `AppConfig`, `LLMConfig`, `SourceConfig` | Interfaces exportadas |
| AC4 | Enum de status: `AgentStatus` (idle, running, success, error) | Enum exportado |
| AC5 | Utils: `logger`, `retry`, `rateLimiter` | Funções exportadas e funcionais |
| AC6 | Exports corretos para consumo pelos outros packages | Import funciona em api/ui |
| AC7 | Testes unitários para utils principais | `pnpm test` passa |

---

## Tasks

- [x] **Task 1:** Configurar package shared
  - [x] Criar estrutura de diretórios
  - [x] Configurar `package.json` com exports
  - [x] Configurar `tsconfig.json` para build

- [x] **Task 2:** Definir tipos de entidades core
  - [x] Criar `src/types/entities.ts` (Execution, Post, Asset, Score)
  - [x] Criar `src/types/agents.ts` (Agent, AgentResult, Trend, Topic)
  - [x] Criar `src/types/events.ts` (WSEvent, WSEventType)

- [x] **Task 3:** Definir tipos de configuração
  - [x] Criar `src/types/config.ts` (AppConfig, LLMConfig, SourceConfig)
  - [x] Definir enums: `AgentStatus`, `ExecutionStatus`, `PostStatus`, `Platform`

- [x] **Task 4:** Implementar utilitários
  - [x] Criar `src/utils/logger.ts` - wrapper de console estruturado
  - [x] Criar `src/utils/retry.ts` - retry com backoff exponencial
  - [x] Criar `src/utils/rate-limiter.ts` - limitador de requisições

- [x] **Task 5:** Configurar exports
  - [x] Criar `src/index.ts` exportando tudo
  - [x] Configurar `package.json` exports field
  - [x] Testar import em outros packages

- [x] **Task 6:** Escrever testes
  - [x] Testes para `retry` utility
  - [x] Testes para `rateLimiter` utility
  - [x] Testes para helpers utility

---

## Dev Notes

### Estrutura do Package Shared

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── agents.ts
│   │   ├── entities.ts
│   │   ├── events.ts
│   │   ├── config.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── retry.ts
│   │   ├── rate-limiter.ts
│   │   └── index.ts
│   ├── constants/
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### Tipos Principais (da Architecture)

```typescript
// Enums
export enum AgentStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error'
}

export enum Platform {
  INSTAGRAM = 'instagram',
  LINKEDIN = 'linkedin'
}

// Core Types
export interface Trend {
  id: string;
  title: string;
  description?: string;
  source: string;
  url: string;
  discoveredAt: Date;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  engagementPotential: number;
  basedOnTrends: string[];
}
```

### Retry Utility

```typescript
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  }
): Promise<T>
```

### Rate Limiter

```typescript
export class RateLimiter {
  constructor(options: {
    maxRequests: number;
    windowMs: number;
  });

  async acquire(): Promise<void>;
  release(): void;
}
```

---

## Testing

### Testes Unitários

```typescript
describe('retry', () => {
  it('should retry on failure', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) throw new Error('fail');
      return 'success';
    };

    const result = await retry(fn, { maxAttempts: 3 });
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });
});
```

---

## References

- [PRD](../prd.md) - Story 1.4
- [Architecture](../architecture.md) - Data Models, TypeScript Interfaces

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Modified | `packages/shared/package.json` | Added exports field, type: module |
| Modified | `packages/shared/tsconfig.json` | Enabled declaration, sourceMap, proper build config |
| Modified | `packages/shared/src/index.ts` | Export types, utils, constants |
| Modified | `packages/shared/src/types/index.ts` | Export from all type files |
| Created | `packages/shared/src/types/agents.ts` | Agent, AgentResult, AgentStatus, Trend, Topic |
| Created | `packages/shared/src/types/entities.ts` | Execution, Post, Asset, Score, enums |
| Created | `packages/shared/src/types/events.ts` | WSEvent, WSEventType, AgentEvent, PipelineEvent |
| Created | `packages/shared/src/types/config.ts` | AppConfig, LLMConfig, SourceConfig, QualityConfig |
| Modified | `packages/shared/src/utils/index.ts` | Export from all utility files |
| Created | `packages/shared/src/utils/logger.ts` | Logger class with levels, child loggers |
| Created | `packages/shared/src/utils/retry.ts` | retry(), withRetry(), sleep() |
| Created | `packages/shared/src/utils/rate-limiter.ts` | RateLimiter class, withRateLimit() |
| Created | `packages/shared/src/utils/helpers.ts` | generateId, maskSecret, pick, omit, etc. |
| Created | `packages/shared/src/constants/index.ts` | AGENT_NAMES, TREND_SOURCES, DEFAULT_CONFIG |
| Created | `packages/shared/vitest.config.ts` | Vitest configuration |
| Created | `packages/shared/src/__tests__/retry.test.ts` | 10 tests for retry utility |
| Created | `packages/shared/src/__tests__/rate-limiter.test.ts` | 8 tests for rate limiter |
| Created | `packages/shared/src/__tests__/helpers.test.ts` | 16 tests for helper functions |

### Debug Log

- Reorganized types from single index.ts into separate files (agents, entities, events, config)
- Added comprehensive helper utilities (pick, omit, safeJsonParse, truncate, isDefined)
- Added eslint-disable for console statements in logger (intentional usage)

### Completion Notes

All acceptance criteria validated:
- AC1: Package builds correctly - `tsc` completes successfully
- AC2: Agent types defined - Agent, AgentResult, Trend, Topic in agents.ts
- AC3: Config types defined - AppConfig, LLMConfig, SourceConfig in config.ts
- AC4: AgentStatus enum exported with idle, running, success, error values
- AC5: Utils implemented - logger, retry, rateLimiter all functional
- AC6: Exports work - verified imports in api and ui packages pass typecheck
- AC7: Unit tests pass - 34 tests covering retry, rate-limiter, and helpers

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-28 | Story created | River (SM Agent) |
| 2025-01-28 | Implementation completed | Dex (Dev Agent) |
