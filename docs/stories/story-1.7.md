# Story 1.7: Agente Pesquisador — Integração com Backend

> Epic 1: Foundation & Pesquisador

---

## Story

**Como** usuário,
**Quero** disparar a pesquisa via API e ver os resultados,
**Para que** eu possa testar o agente funcionando.

---

## Status

`Ready for Review`

---

## Acceptance Criteria

| # | Critério | Validação |
|---|----------|-----------|
| AC1 | Endpoint `POST /api/agents/researcher/run` dispara o agente | Response 202 Accepted |
| AC2 | Endpoint `GET /api/agents/researcher/results` retorna últimos resultados | Response 200 com trends |
| AC3 | Resultados salvos em arquivo JSON em `output/trends/` | Arquivo criado |
| AC4 | Resposta inclui metadata: timestamp, fontes consultadas, total de trends | Metadata presente |
| AC5 | Tratamento de erros com mensagens claras | Erros retornam JSON estruturado |
| AC6 | Log de execução do agente | Logs no console |
| AC7 | Teste de integração do fluxo completo | `pnpm test` passa |

---

## Tasks

- [x] **Task 1:** Criar rotas do Researcher
  - [x] Criar `packages/api/src/routes/agents/researcher.ts`
  - [x] Implementar `POST /api/agents/researcher/run`
  - [x] Implementar `GET /api/agents/researcher/results`

- [x] **Task 2:** Criar serviço de integração
  - [x] Criar `packages/api/src/services/researcher.service.ts`
  - [x] Instanciar e executar Researcher agent
  - [x] Gerenciar estado de execução

- [x] **Task 3:** Implementar persistência de resultados
  - [x] Criar diretório `output/trends/`
  - [x] Salvar resultados como JSON timestamped
  - [x] Implementar leitura do último resultado

- [x] **Task 4:** Implementar tratamento de erros
  - [x] Criar error handler específico para agents
  - [x] Retornar erros em formato JSON estruturado
  - [x] Log de erros detalhado

- [x] **Task 5:** Adicionar logging
  - [x] Log de início de execução
  - [x] Log de fontes sendo consultadas
  - [x] Log de resultados encontrados
  - [x] Log de erros

- [x] **Task 6:** Escrever testes de integração
  - [x] Teste do endpoint POST
  - [x] Teste do endpoint GET
  - [x] Teste de erro handling

---

## Dev Notes

### Estrutura de Rotas

```
packages/api/src/
├── routes/
│   ├── agents/
│   │   ├── researcher.ts
│   │   └── index.ts
│   ├── health.ts
│   └── index.ts
├── services/
│   └── researcher.service.ts
```

### API Endpoints

```typescript
// POST /api/agents/researcher/run
// Request body (optional):
{
  "sources": ["devto", "hackernews", "reddit"],
  "limit": 20
}

// Response 202:
{
  "status": "started",
  "executionId": "exec-123",
  "timestamp": "2025-01-28T14:00:00Z"
}

// GET /api/agents/researcher/results
// Response 200:
{
  "trends": [...],
  "metadata": {
    "executionId": "exec-123",
    "sourcesQueried": ["devto", "hackernews", "reddit"],
    "totalFound": 45,
    "timestamp": "2025-01-28T14:00:00Z",
    "duration": 3500
  }
}
```

### Persistência de Resultados

```typescript
// Output file: output/trends/2025-01-28T14-00-00.json
{
  "executionId": "exec-123",
  "timestamp": "2025-01-28T14:00:00Z",
  "trends": [...],
  "metadata": {...}
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

// Example:
{
  "error": {
    "code": "AGENT_EXECUTION_ERROR",
    "message": "Failed to fetch trends from Dev.to",
    "details": {
      "source": "devto",
      "reason": "Network timeout"
    },
    "timestamp": "2025-01-28T14:00:00Z"
  }
}
```

---

## Testing

### Testes de Integração

```typescript
describe('Researcher API', () => {
  describe('POST /api/agents/researcher/run', () => {
    it('should start researcher agent', async () => {
      const response = await request(app)
        .post('/api/agents/researcher/run')
        .send({ sources: ['devto'], limit: 5 });

      expect(response.status).toBe(202);
      expect(response.body.status).toBe('started');
    });
  });

  describe('GET /api/agents/researcher/results', () => {
    it('should return latest results', async () => {
      const response = await request(app)
        .get('/api/agents/researcher/results');

      expect(response.status).toBe(200);
      expect(response.body.trends).toBeDefined();
      expect(response.body.metadata).toBeDefined();
    });
  });
});
```

---

## References

- [PRD](../prd.md) - Story 1.7
- [Architecture](../architecture.md) - API Specification

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Created | packages/api/src/routes/agents/researcher.ts | Researcher API routes (POST /run, GET /results, GET /status) |
| Created | packages/api/src/routes/agents/index.ts | Agent routes index export |
| Created | packages/api/src/services/researcher.service.ts | Researcher service with execution management and persistence |
| Modified | packages/api/src/routes/index.ts | Added researcher routes export |
| Modified | packages/api/src/server.ts | Registered researcher routes |
| Created | packages/api/src/__tests__/researcher.test.ts | Integration tests for researcher API |
| Created | packages/agents/src/services/sources/types.ts | Trend source types |
| Created | packages/agents/src/services/sources/devto.ts | Dev.to RSS feed fetcher |
| Created | packages/agents/src/services/sources/hackernews.ts | Hacker News API fetcher |
| Created | packages/agents/src/services/sources/reddit.ts | Reddit RSS feed fetcher |
| Created | packages/agents/src/services/sources/index.ts | Sources index export |
| Created | packages/agents/src/services/index.ts | Services index export |
| Created | packages/agents/src/agents/researcher.ts | Researcher agent implementation |
| Modified | packages/agents/src/agents/index.ts | Added researcher exports |
| Modified | packages/agents/src/index.ts | Added services export |
| Created | packages/agents/src/__tests__/researcher.test.ts | Unit tests for researcher agent |
| Created | packages/agents/vitest.config.ts | Vitest configuration for agents |
| Modified | packages/agents/tsconfig.json | Updated TypeScript config for bundler mode |
| Modified | packages/api/tsconfig.json | Updated TypeScript config for bundler mode |

### Debug Log

_No significant issues encountered during implementation._

### Completion Notes

**Implementation Summary:**

1. **Researcher Agent Core (Story 1.6 prerequisite)**:
   - Implemented three trend source fetchers: Dev.to (RSS), Hacker News (API), Reddit (Atom)
   - Each source handles timeouts, rate limiting, and error recovery
   - Simple XML/Atom parsing without external dependencies
   - Trends normalized to common `Trend` interface from shared package

2. **Researcher Agent**:
   - Aggregates trends from all sources in parallel
   - Implements deduplication using Levenshtein distance for similar titles
   - Sorts by discovery date (most recent first)
   - Uses RateLimiter from shared package to respect rate limits
   - Returns structured AgentResult with success/error states

3. **API Integration**:
   - POST /api/agents/researcher/run: Starts async execution, returns 202 Accepted
   - GET /api/agents/researcher/results: Returns latest persisted results
   - GET /api/agents/researcher/status: Returns current execution status
   - Input validation for sources and limit parameters
   - Structured JSON error responses with error codes

4. **Result Persistence**:
   - Results saved to output/trends/ with timestamped filenames
   - JSON format includes trends, metadata, and persistence info
   - Service caches latest result for quick retrieval
   - Can load results from disk on startup

5. **Testing**:
   - 30 tests for agents package (sources + researcher)
   - 17 tests for API package (health + researcher routes)
   - All tests pass with mocked fetch responses

**Validation Results:**
- `pnpm typecheck`: All packages pass
- `pnpm lint`: No errors
- `pnpm test`: All 138 tests pass across all packages

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-28 | Story created | River (SM Agent) |
| 2026-01-28 | Implementation complete | Dex (Dev Agent) |
