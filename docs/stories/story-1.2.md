# Story 1.2: Backend API Base com Health Check

> Epic 1: Foundation & Pesquisador

---

## Story

**Como** desenvolvedor,
**Quero** um servidor Fastify rodando com endpoint de health check,
**Para que** eu tenha a base para adicionar rotas dos agentes.

---

## Status

`Ready for Review`

---

## Acceptance Criteria

| # | Critério | Validação |
|---|----------|-----------|
| AC1 | Package `api` com Fastify configurado | Server inicia sem erros |
| AC2 | Servidor rodando na porta configurável via env (default 3001) | `curl localhost:3001` responde |
| AC3 | Endpoint `GET /health` retornando `{ status: "ok", timestamp }` | Response correto |
| AC4 | CORS configurado para desenvolvimento local | Headers CORS presentes |
| AC5 | Logging estruturado com Pino (integrado ao Fastify) | Logs no formato JSON |
| AC6 | Graceful shutdown implementado | SIGTERM handled corretamente |
| AC7 | Script `pnpm dev:api` funcionando com hot reload (tsx) | Auto-reload ao salvar |
| AC8 | Teste de integração do endpoint health passando | `pnpm test` passa |

---

## Tasks

- [x] **Task 1:** Configurar Fastify no package api
  - [x] Instalar dependências: `fastify`, `@fastify/cors`, `pino`
  - [x] Criar `src/server.ts` com setup do Fastify
  - [x] Configurar CORS para localhost

- [x] **Task 2:** Implementar Health Check endpoint
  - [x] Criar `src/routes/health.ts`
  - [x] Implementar `GET /health` retornando status e timestamp
  - [x] Registrar rota no server

- [x] **Task 3:** Configurar logging
  - [x] Configurar Pino logger integrado ao Fastify
  - [x] Definir níveis de log por ambiente (dev: debug, prod: info)

- [x] **Task 4:** Implementar graceful shutdown
  - [x] Handler para SIGTERM e SIGINT
  - [x] Fechar conexões corretamente

- [x] **Task 5:** Configurar desenvolvimento
  - [x] Instalar `tsx` para hot reload
  - [x] Criar script `dev:api` no package.json raiz
  - [x] Criar `src/index.ts` como entry point

- [x] **Task 6:** Escrever testes
  - [x] Instalar `vitest` e `supertest`
  - [x] Criar `src/__tests__/health.test.ts`
  - [x] Testar response do health check

---

## Dev Notes

### Estrutura do Package API

```
packages/api/
├── src/
│   ├── routes/
│   │   ├── health.ts
│   │   └── index.ts
│   ├── middleware/
│   │   └── error-handler.ts
│   ├── server.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### Dependências

```json
{
  "dependencies": {
    "fastify": "^4.24.0",
    "@fastify/cors": "^8.4.0"
  },
  "devDependencies": {
    "tsx": "^4.6.0",
    "vitest": "^1.0.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^2.0.0"
  }
}
```

### Health Check Response

```typescript
interface HealthResponse {
  status: 'ok';
  timestamp: string;
  uptime: number;
}
```

---

## Testing

### Teste de Integração

```typescript
describe('GET /health', () => {
  it('should return status ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
  });
});
```

### Validações Manuais

1. `pnpm dev:api` - servidor inicia
2. `curl http://localhost:3001/health` - retorna JSON correto
3. Ctrl+C - graceful shutdown

---

## References

- [PRD](../prd.md) - Story 1.2
- [Architecture](../architecture.md) - Backend Architecture

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Modified | packages/api/package.json | Added pino, pino-pretty, supertest deps |
| Modified | packages/api/src/server.ts | Full Fastify setup with CORS, logging |
| Modified | packages/api/src/index.ts | Entry point with graceful shutdown |
| Added | packages/api/src/routes/health.ts | Health check endpoint |
| Added | packages/api/src/routes/index.ts | Routes barrel export |
| Added | packages/api/src/middleware/error-handler.ts | Error handling middleware |
| Added | packages/api/src/__tests__/health.test.ts | Integration tests (6 tests) |
| Added | packages/api/vitest.config.ts | Vitest configuration |

### Debug Log

_No issues encountered_

### Completion Notes

- All 6 tasks completed successfully
- Fastify server configured with Pino logging (pretty print in dev)
- CORS configured for localhost development
- Health endpoint returns: status, timestamp, uptime, environment
- Graceful shutdown handles SIGTERM and SIGINT
- 6 integration tests passing with supertest
- Server ready on port 3001 (configurable via PORT env)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-28 | Story created | River (SM Agent) |
| 2025-01-28 | Story implemented | Dex (Dev Agent) |
