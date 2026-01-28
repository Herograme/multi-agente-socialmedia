# Story 1.5: Serviço de Configuração e Environment

> Epic 1: Foundation & Pesquisador

---

## Story

**Como** desenvolvedor,
**Quero** um sistema centralizado de configuração,
**Para que** eu possa gerenciar API keys e settings de forma segura.

---

## Status

`Ready for Review`

---

## Acceptance Criteria

| # | Critério | Validação |
|---|----------|-----------|
| AC1 | Arquivo de configuração `config.ts` no package `shared` | Arquivo existe e exporta config |
| AC2 | Validação de variáveis de ambiente obrigatórias no startup | Erro claro se faltando |
| AC3 | Configuração de fontes de tendências (Dev.to, HN, Reddit) via config | Sources configuráveis |
| AC4 | Configuração de LLM providers (Groq, Gemini) via env | Providers configuráveis |
| AC5 | Configuração de Image providers (Ideogram, Leonardo) via env | Providers configuráveis |
| AC6 | Fallback para valores default quando env não definida | Defaults funcionam |
| AC7 | Log de configuração carregada (sem expor secrets) | Log não mostra API keys |
| AC8 | Testes para validação de config | `pnpm test` passa |

---

## Tasks

- [x] **Task 1:** Criar estrutura de configuração
  - [x] Criar `packages/shared/src/config/index.ts`
  - [x] Definir interface `AppConfig`
  - [x] Implementar função `loadConfig()`

- [x] **Task 2:** Implementar validação de ambiente
  - [x] Criar `validateEnv()` que verifica variáveis obrigatórias
  - [x] Lançar erro descritivo se variável faltando
  - [x] Listar todas as variáveis necessárias

- [x] **Task 3:** Configurar fontes de tendências
  - [x] Definir interface `SourceConfig`
  - [x] Implementar config para Dev.to, HN, Reddit
  - [x] Permitir habilitar/desabilitar cada fonte

- [x] **Task 4:** Configurar LLM providers
  - [x] Definir interface `LLMConfig`
  - [x] Configurar Groq (primary)
  - [x] Configurar Gemini (fallback)
  - [x] Validar API keys presentes

- [x] **Task 5:** Configurar Image providers
  - [x] Definir interface `ImageConfig`
  - [x] Configurar Ideogram (primary)
  - [x] Configurar Leonardo (fallback)
  - [x] Validar API keys presentes

- [x] **Task 6:** Implementar logging seguro
  - [x] Criar função `logConfig()` que não expõe secrets
  - [x] Mascarar API keys nos logs
  - [x] Log de providers ativos

- [x] **Task 7:** Escrever testes
  - [x] Teste de validação com env faltando
  - [x] Teste de defaults
  - [x] Teste de mascaramento de secrets

---

## Dev Notes

### Interface de Configuração

```typescript
// packages/shared/src/config/types.ts

export interface AppConfig {
  server: {
    port: number;
    nodeEnv: 'development' | 'production';
  };
  database: {
    url: string;
  };
  llm: LLMConfig;
  image: ImageConfig;
  sources: SourceConfig;
  quality: {
    threshold: number;
    autoRetry: boolean;
  };
}

export interface LLMConfig {
  primary: {
    provider: 'groq' | 'gemini';
    apiKey: string;
    model: string;
  };
  fallback: {
    provider: 'groq' | 'gemini';
    apiKey: string;
    model: string;
  };
}

export interface ImageConfig {
  primary: {
    provider: 'ideogram' | 'leonardo';
    apiKey: string;
  };
  fallback: {
    provider: 'ideogram' | 'leonardo';
    apiKey: string;
  };
}

export interface SourceConfig {
  devto: { enabled: boolean; feedUrl: string };
  hackernews: { enabled: boolean; apiUrl: string };
  reddit: { enabled: boolean; feedUrl: string };
}
```

### Validação de Ambiente

```typescript
const REQUIRED_VARS = [
  'GROQ_API_KEY',
  'IDEOGRAM_API_KEY',
];

const OPTIONAL_VARS = [
  'GEMINI_API_KEY',
  'LEONARDO_API_KEY',
  'PORT',
  'DATABASE_URL',
];

export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}
```

### Mascaramento de Secrets

```typescript
function maskSecret(value: string): string {
  if (value.length <= 8) return '****';
  return value.slice(0, 4) + '****' + value.slice(-4);
}
```

---

## Testing

### Testes Unitários

```typescript
describe('config', () => {
  it('should throw on missing required vars', () => {
    delete process.env.GROQ_API_KEY;
    expect(() => validateEnv()).toThrow('Missing required env vars');
  });

  it('should use defaults for optional vars', () => {
    const config = loadConfig();
    expect(config.server.port).toBe(3001);
  });

  it('should mask secrets in logs', () => {
    const masked = maskSecret('sk-abc123def456');
    expect(masked).toBe('sk-a****f456');
  });
});
```

---

## References

- [PRD](../prd.md) - Story 1.5
- [Architecture](../architecture.md) - Environment Variables

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Created | `packages/shared/src/config/types.ts` | AppConfig, LLMConfig, ImageConfig, SourcesConfig interfaces |
| Created | `packages/shared/src/config/defaults.ts` | DEFAULT_SERVER, DEFAULT_SOURCES, DEFAULT_QUALITY constants |
| Created | `packages/shared/src/config/validation.ts` | validateEnv, checkEnv, getEnv, getEnvNumber, getEnvBoolean |
| Created | `packages/shared/src/config/loader.ts` | loadConfig, getConfig, clearConfigCache, logConfig, getProviderSummary |
| Created | `packages/shared/src/config/index.ts` | Config module exports |
| Modified | `packages/shared/src/index.ts` | Added config module export |
| Modified | `packages/shared/src/types/config.ts` | Reduced to only PipelineConfig, CriteriaWeight (removed duplicates) |
| Created | `packages/shared/src/__tests__/config.test.ts` | 33 tests for config validation and loading |
| Modified | `.env.example` | Expanded with all env vars, better documentation |

### Debug Log

- Fixed duplicate export conflict between `types/config.ts` and `config/types.ts`
- Fixed test expecting 'development' when vitest sets NODE_ENV='test'

### Completion Notes

All acceptance criteria validated:
- AC1: Config file exports loadConfig, getConfig, validateEnv
- AC2: validateEnv throws descriptive error listing all missing vars
- AC3: Sources configured (Dev.to, HN, Reddit) with enable/disable via env
- AC4: LLM providers configured (Groq primary, Gemini fallback)
- AC5: Image providers configured (Ideogram primary, Leonardo fallback)
- AC6: Defaults work via DEFAULT_SERVER, DEFAULT_SOURCES, DEFAULT_QUALITY
- AC7: logConfig masks all API keys, getProviderSummary shows active providers
- AC8: 33 tests covering validation, defaults, secrets masking - all pass

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-28 | Story created | River (SM Agent) |
| 2025-01-28 | Implementation completed | Dex (Dev Agent) |
