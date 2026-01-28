# Story 2.6: Agente Curador — Backend Integration

> Epic 2: Curador Agent

---

## Story

**Como** usuário,
**Quero** disparar a curadoria via API e ver os resultados,
**Para que** eu possa testar o agente Curador funcionando de forma integrada.

---

## Status

`QA Approved`

---

## Acceptance Criteria

| # | Criterio | Validacao |
|---|----------|-----------|
| AC1 | Endpoint `POST /api/agents/curador/run` dispara o agente | Response 202 Accepted |
| AC2 | Endpoint `GET /api/agents/curador/results` retorna ultimos resultados curados | Response 200 com conteudo curado |
| AC3 | Resultados salvos em arquivo JSON em `output/curated/` | Arquivo criado |
| AC4 | Resposta inclui metadata: timestamp, trends processadas, total de conteudo curado | Metadata presente |
| AC5 | Tratamento de erros com mensagens claras | Erros retornam JSON estruturado |
| AC6 | Log de execucao do agente | Logs no console |
| AC7 | Teste de integracao do fluxo completo | `pnpm test` passa |

---

## Tasks

- [x] **Task 1:** Criar rotas do Curador
  - [x] Criar `packages/api/src/routes/agents/curador.ts`
  - [x] Implementar `POST /api/agents/curador/run`
  - [x] Implementar `GET /api/agents/curador/results`
  - [x] Implementar `GET /api/agents/curador/status`

- [x] **Task 2:** Criar CuradorService
  - [x] Criar `packages/api/src/services/curador.service.ts`
  - [x] Instanciar e executar Curador agent
  - [x] Gerenciar estado de execucao assincrona
  - [x] Integrar com ResearcherService para obter trends

- [x] **Task 3:** Implementar persistencia de resultados
  - [x] Criar diretorio `output/curated/`
  - [x] Salvar resultados como JSON timestamped
  - [x] Implementar leitura do ultimo resultado
  - [x] Cache do resultado mais recente em memoria

- [x] **Task 4:** Implementar tratamento de erros
  - [x] Reutilizar error handler de agents existente
  - [x] Retornar erros em formato JSON estruturado
  - [x] Log de erros detalhado
  - [x] Tratamento de falhas do LLM

- [x] **Task 5:** Adicionar logging
  - [x] Log de inicio de execucao
  - [x] Log de trends sendo processadas
  - [x] Log de conteudo curado gerado
  - [x] Log de erros e retries

- [x] **Task 6:** Escrever testes de integracao
  - [x] Teste do endpoint POST
  - [x] Teste do endpoint GET
  - [x] Teste do endpoint STATUS
  - [x] Teste de erro handling
  - [x] Teste de integracao com Researcher

---

## Dev Notes

### Estrutura de Rotas

```
packages/api/src/
├── routes/
│   ├── agents/
│   │   ├── researcher.ts
│   │   ├── curador.ts      # NEW
│   │   └── index.ts
│   ├── health.ts
│   └── index.ts
├── services/
│   ├── researcher.service.ts
│   └── curador.service.ts  # NEW
```

### API Endpoints

```typescript
// POST /api/agents/curador/run
// Request body (optional):
{
  "trendIds": ["trend-1", "trend-2"],  // Optional: specific trends to curate
  "useLatestTrends": true,              // Default: use latest researcher results
  "platforms": ["instagram", "linkedin", "twitter"],
  "language": "pt-BR"
}

// Response 202:
{
  "status": "started",
  "executionId": "exec-curador-456",
  "timestamp": "2025-01-28T15:00:00Z",
  "message": "Curadoria iniciada para X trends"
}

// GET /api/agents/curador/results
// Query params: ?executionId=exec-curador-456 (optional)
// Response 200:
{
  "curatedContent": [
    {
      "trendId": "trend-1",
      "trendTitle": "AI in 2025",
      "platforms": {
        "instagram": {
          "caption": "...",
          "hashtags": ["#AI", "#Tech"],
          "imagePrompt": "..."
        },
        "linkedin": {
          "post": "...",
          "hashtags": ["#AI", "#Innovation"]
        },
        "twitter": {
          "thread": ["Tweet 1...", "Tweet 2..."],
          "hashtags": ["#AI"]
        }
      },
      "curatedAt": "2025-01-28T15:05:00Z"
    }
  ],
  "metadata": {
    "executionId": "exec-curador-456",
    "trendsProcessed": 5,
    "contentGenerated": 15,
    "platforms": ["instagram", "linkedin", "twitter"],
    "timestamp": "2025-01-28T15:05:00Z",
    "duration": 12500
  }
}

// GET /api/agents/curador/status
// Response 200:
{
  "status": "running" | "completed" | "failed" | "idle",
  "executionId": "exec-curador-456",
  "progress": {
    "trendsTotal": 5,
    "trendsProcessed": 3,
    "percentComplete": 60
  },
  "startedAt": "2025-01-28T15:00:00Z"
}
```

### Persistencia de Resultados

```typescript
// Output file: output/curated/2025-01-28T15-05-00.json
{
  "executionId": "exec-curador-456",
  "timestamp": "2025-01-28T15:05:00Z",
  "curatedContent": [...],
  "metadata": {...},
  "sourceExecution": {
    "researcherExecutionId": "exec-123",
    "trendsUsed": 5
  }
}
```

### CuradorService Structure

```typescript
// packages/api/src/services/curador.service.ts

interface CuradorServiceConfig {
  outputDir: string;
  researcherService: ResearcherService;
}

interface CuradorExecutionState {
  status: 'idle' | 'running' | 'completed' | 'failed';
  executionId: string | null;
  startedAt: Date | null;
  progress: {
    trendsTotal: number;
    trendsProcessed: number;
  };
  result: CuratedResult | null;
  error: Error | null;
}

class CuradorService {
  constructor(config: CuradorServiceConfig);

  // Start async execution
  async startExecution(options: CuradorOptions): Promise<ExecutionInfo>;

  // Get current status
  getStatus(): CuradorExecutionState;

  // Get latest results (from memory or disk)
  async getResults(executionId?: string): Promise<CuratedResult | null>;

  // Internal: run the curador agent
  private async runCurador(trends: Trend[], options: CuradorOptions): Promise<void>;

  // Internal: persist results to disk
  private async persistResults(result: CuratedResult): Promise<string>;

  // Internal: load results from disk
  private async loadLatestResults(): Promise<CuratedResult | null>;
}
```

### Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
  };
}

// Example errors:
{
  "error": {
    "code": "CURADOR_EXECUTION_ERROR",
    "message": "Failed to generate curated content",
    "details": {
      "trendId": "trend-1",
      "reason": "LLM rate limit exceeded"
    },
    "timestamp": "2025-01-28T15:00:00Z"
  }
}

{
  "error": {
    "code": "NO_TRENDS_AVAILABLE",
    "message": "No trends available for curation. Run researcher first.",
    "timestamp": "2025-01-28T15:00:00Z"
  }
}

{
  "error": {
    "code": "CURADOR_ALREADY_RUNNING",
    "message": "Curador is already running. Check status endpoint.",
    "details": {
      "executionId": "exec-curador-456"
    },
    "timestamp": "2025-01-28T15:00:00Z"
  }
}
```

### Integration with Researcher

```typescript
// CuradorService integrates with ResearcherService
const curadorService = new CuradorService({
  outputDir: 'output/curated',
  researcherService: researcherService  // Inject existing service
});

// When running:
// 1. Get latest trends from ResearcherService
// 2. Pass to Curador agent
// 3. Save curated results
// 4. Track source execution for traceability
```

---

## Testing

### Testes de Integracao

```typescript
describe('Curador API', () => {
  describe('POST /api/agents/curador/run', () => {
    it('should start curador agent', async () => {
      const response = await request(app)
        .post('/api/agents/curador/run')
        .send({ useLatestTrends: true, platforms: ['instagram'] });

      expect(response.status).toBe(202);
      expect(response.body.status).toBe('started');
      expect(response.body.executionId).toBeDefined();
    });

    it('should reject if no trends available', async () => {
      // Mock empty researcher results
      const response = await request(app)
        .post('/api/agents/curador/run')
        .send({ useLatestTrends: true });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('NO_TRENDS_AVAILABLE');
    });

    it('should reject if already running', async () => {
      // Start first execution
      await request(app).post('/api/agents/curador/run');

      // Try to start second
      const response = await request(app)
        .post('/api/agents/curador/run');

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CURADOR_ALREADY_RUNNING');
    });
  });

  describe('GET /api/agents/curador/results', () => {
    it('should return latest results', async () => {
      const response = await request(app)
        .get('/api/agents/curador/results');

      expect(response.status).toBe(200);
      expect(response.body.curatedContent).toBeDefined();
      expect(response.body.metadata).toBeDefined();
    });

    it('should return 404 if no results', async () => {
      const response = await request(app)
        .get('/api/agents/curador/results');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NO_RESULTS_FOUND');
    });
  });

  describe('GET /api/agents/curador/status', () => {
    it('should return current execution status', async () => {
      const response = await request(app)
        .get('/api/agents/curador/status');

      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
    });

    it('should show progress during execution', async () => {
      // Start execution
      await request(app).post('/api/agents/curador/run');

      const response = await request(app)
        .get('/api/agents/curador/status');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('running');
      expect(response.body.progress).toBeDefined();
    });
  });

  describe('Integration with Researcher', () => {
    it('should use trends from researcher results', async () => {
      // First run researcher
      await request(app).post('/api/agents/researcher/run');
      await waitForCompletion('researcher');

      // Then run curador
      const response = await request(app)
        .post('/api/agents/curador/run')
        .send({ useLatestTrends: true });

      expect(response.status).toBe(202);

      // Wait and check results
      await waitForCompletion('curador');
      const results = await request(app).get('/api/agents/curador/results');

      expect(results.body.metadata.sourceExecution).toBeDefined();
    });
  });
});
```

### Testes Unitarios do Service

```typescript
describe('CuradorService', () => {
  it('should persist results to output/curated/', async () => {
    const service = new CuradorService({ outputDir: 'output/curated' });
    await service.startExecution({ trends: mockTrends });

    const files = await fs.readdir('output/curated');
    expect(files.length).toBeGreaterThan(0);
  });

  it('should cache latest result in memory', async () => {
    const service = new CuradorService({ outputDir: 'output/curated' });
    await service.startExecution({ trends: mockTrends });

    const result = await service.getResults();
    expect(result).toBeDefined();
  });

  it('should track execution progress', async () => {
    const service = new CuradorService({ outputDir: 'output/curated' });
    service.startExecution({ trends: mockTrends });

    const status = service.getStatus();
    expect(status.status).toBe('running');
    expect(status.progress.trendsTotal).toBe(mockTrends.length);
  });
});
```

---

## References

- [PRD](../prd.md) - Story 2.6
- [Architecture](../architecture.md) - API Specification
- [Story 1.7](./story-1.7.md) - Researcher Backend Integration (reference pattern)
- [Story 2.5](./story-2.5.md) - Curador Agent Core (prerequisite)

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Created | `packages/api/src/routes/agents/curador.ts` | Curador API routes with POST /run, GET /results, GET /status |
| Created | `packages/api/src/services/curador.service.ts` | CuradorService with async execution, state management, persistence |
| Created | `packages/api/src/__tests__/curador.test.ts` | Integration tests for Curador API endpoints |
| Modified | `packages/api/src/routes/agents/index.ts` | Export curadorRoutes |
| Modified | `packages/api/src/routes/index.ts` | Export curadorRoutes |
| Modified | `packages/api/src/server.ts` | Register curadorRoutes plugin |

### Debug Log

- 2026-01-28: Implementation started by Dev Agent (Dex)
- 2026-01-28: Created CuradorService with async execution pattern following ResearcherService
- 2026-01-28: Created curador routes with full validation and error handling
- 2026-01-28: Added comprehensive integration tests (15 tests)
- 2026-01-28: All validations passed: `pnpm lint`, `pnpm typecheck`, `pnpm test`

### Completion Notes

Implementation complete. The Curador API backend integration includes:

**Endpoints:**
- `POST /api/agents/curador/run` - Starts curador execution (202 Accepted)
- `GET /api/agents/curador/results` - Returns latest curated content (200 OK)
- `GET /api/agents/curador/status` - Returns execution status with progress

**Features:**
- Async execution with state management (idle/running/completed/failed)
- Integration with ResearcherService to fetch trends
- Result persistence to `output/curated/` with timestamped JSON files
- Memory caching of latest results
- Structured JSON error responses with codes: CURADOR_ALREADY_RUNNING, NO_TRENDS_AVAILABLE, NO_RESULTS_FOUND, etc.
- Comprehensive logging at all stages

**Test Results:**
- 15 integration tests passing
- 32 total API tests passing (including researcher tests)
- 309 total tests passing across all packages

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story created | River (SM Agent) |
| 2026-01-28 | QA Review completed | Quinn (QA Agent) |

---

## QA Results

### Gate Decision: PASS

All acceptance criteria have been verified and met. The implementation is ready to merge.

### Test Results Summary

| Test Suite | Tests | Status |
|------------|-------|--------|
| curador.test.ts | 15 | PASSED |
| researcher.test.ts | 11 | PASSED |
| pipeline.integration.test.ts | 12 | PASSED |
| health.test.ts | 6 | PASSED |
| **Total** | **44** | **PASSED** |

**Linting:** PASSED (no errors)
**Type Check:** PASSED (no errors)

### Acceptance Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| AC1 | POST /api/agents/curador/run returns 202 Accepted | VERIFIED | Routes file line 91-172, test "should start curador agent with 202 Accepted" |
| AC2 | GET /api/agents/curador/results returns 200 with curated content | VERIFIED | Routes file line 178-226, test "should return latest results with 200" |
| AC3 | Results saved in output/curated/ as JSON | VERIFIED | Service file line 456-476, test confirms file creation and cleanup |
| AC4 | Response includes metadata (timestamp, trends, total) | VERIFIED | Service file line 388-403, test "should include metadata with execution details" |
| AC5 | Errors return structured JSON responses | VERIFIED | Routes file line 66-74, error-handler middleware, test "should return error response with required fields" |
| AC6 | Execution logging | VERIFIED | Service file uses logger throughout (lines 172, 225, 247, 287, etc.) |
| AC7 | Integration test passes | VERIFIED | `pnpm test --filter=api` - 44 tests passing |

### Code Review Findings

**Strengths:**
1. Well-structured code following existing patterns from ResearcherService
2. Comprehensive error handling with custom error classes (CuradorAlreadyRunningError, NoTrendsAvailableError, NoResultsFoundError)
3. Proper async execution pattern with state management
4. Memory caching of latest results for performance
5. Full integration with ResearcherService for trend retrieval
6. Good separation of concerns between routes and service layer
7. Complete TypeScript types and interfaces
8. 15 integration tests covering all endpoints and error scenarios

**Architecture:**
- `packages/api/src/routes/agents/curador.ts` - API routes (279 lines)
- `packages/api/src/services/curador.service.ts` - Business logic (625 lines)
- `packages/api/src/__tests__/curador.test.ts` - Integration tests (396 lines)

**File Registration:**
- Routes properly exported in `packages/api/src/routes/agents/index.ts`
- Routes properly exported in `packages/api/src/routes/index.ts`
- Routes properly registered in `packages/api/src/server.ts`

### Issues Found

None. The implementation is complete and follows all specified requirements.

### Recommendations

1. Consider adding rate limiting for the POST endpoint in production
2. Consider adding request validation schema using Fastify's schema validation for additional type safety
3. The output directory path resolution uses `process.cwd()` which may need adjustment for different deployment scenarios

### Reviewed By

**Quinn (QA Agent)** - 2026-01-28
