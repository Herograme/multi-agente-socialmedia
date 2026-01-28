# Story 1.1: Setup do Monorepo e Estrutura Base

> Epic 1: Foundation & Pesquisador

---

## Story

**Como** desenvolvedor,
**Quero** um monorepo configurado com workspaces,
**Para que** eu possa desenvolver backend, frontend e agentes de forma organizada.

---

## Status

`Ready for Review`

---

## Acceptance Criteria

| # | Critério | Validação |
|---|----------|-----------|
| AC1 | Monorepo criado com pnpm workspaces | `pnpm install` executa sem erros |
| AC2 | Estrutura de packages: `agents`, `api`, `ui`, `shared` | Diretórios existem com package.json |
| AC3 | TypeScript configurado com strict mode em todos os packages | `pnpm typecheck` passa |
| AC4 | ESLint + Prettier configurados com regras consistentes | `pnpm lint` passa |
| AC5 | Scripts de build/dev/lint funcionando na raiz | `pnpm dev`, `pnpm build`, `pnpm lint` funcionam |
| AC6 | .env.example criado com variáveis necessárias documentadas | Arquivo existe com todas as vars |
| AC7 | .gitignore configurado (node_modules, .env, output/) | Arquivos ignorados corretamente |
| AC8 | README.md com instruções de setup inicial | Arquivo existe com instruções claras |

---

## Tasks

- [x] **Task 1:** Inicializar repositório e configurar pnpm workspaces
  - [x] Criar `package.json` raiz com workspaces config
  - [x] Criar `pnpm-workspace.yaml`
  - [x] Configurar scripts na raiz (dev, build, lint, typecheck)

- [x] **Task 2:** Criar estrutura de packages
  - [x] Criar `packages/agents/package.json`
  - [x] Criar `packages/api/package.json`
  - [x] Criar `packages/ui/package.json`
  - [x] Criar `packages/shared/package.json`

- [x] **Task 3:** Configurar TypeScript
  - [x] Criar `tsconfig.base.json` na raiz com configurações compartilhadas
  - [x] Criar `tsconfig.json` em cada package extendendo base
  - [x] Configurar strict mode e paths

- [x] **Task 4:** Configurar ESLint + Prettier
  - [x] Criar `.eslintrc.js` na raiz
  - [x] Criar `.prettierrc` na raiz
  - [x] Adicionar scripts de lint em cada package

- [x] **Task 5:** Criar arquivos de configuração
  - [x] Criar `.env.example` com todas as variáveis documentadas
  - [x] Criar `.gitignore` completo
  - [x] Criar `README.md` com instruções de setup

- [x] **Task 6:** Validar setup
  - [x] Executar `pnpm install`
  - [x] Executar `pnpm lint`
  - [x] Executar `pnpm typecheck`

---

## Dev Notes

### Estrutura de Diretórios Final

```
social-content-agent/
├── packages/
│   ├── agents/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── api/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── ui/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── .env.example
├── .eslintrc.js
├── .gitignore
├── .prettierrc
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

### Variáveis de Ambiente (.env.example)

```bash
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=file:./data/social-content.db

# LLM Providers
GROQ_API_KEY=
GEMINI_API_KEY=

# Image Providers
IDEOGRAM_API_KEY=
LEONARDO_API_KEY=

# Defaults
DEFAULT_LLM_PROVIDER=groq
DEFAULT_IMAGE_PROVIDER=ideogram
QUALITY_THRESHOLD=6.0
```

### Dependências Raiz

```json
{
  "devDependencies": {
    "typescript": "^5.3.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  }
}
```

---

## Testing

### Validações Manuais

1. `pnpm install` - deve instalar todas as dependências
2. `pnpm lint` - deve passar sem erros
3. `pnpm typecheck` - deve passar sem erros
4. Verificar que cada package pode ser buildado independentemente

---

## References

- [PRD](../prd.md) - Story 1.1
- [Architecture](../architecture.md) - Repository Structure, Development Workflow

---

## Dev Agent Record

### File List

| Status | File | Changes |
|--------|------|---------|
| Added | package.json | Root package with workspaces config |
| Added | pnpm-workspace.yaml | Workspace definition |
| Added | tsconfig.base.json | Shared TypeScript config |
| Added | .eslintrc.js | ESLint configuration |
| Added | .prettierrc | Prettier configuration |
| Added | .prettierignore | Prettier ignore patterns |
| Added | .env.example | Environment variables template |
| Added | .gitignore | Git ignore patterns |
| Added | README.md | Project documentation |
| Added | packages/shared/package.json | Shared package config |
| Added | packages/shared/tsconfig.json | Shared TypeScript config |
| Added | packages/shared/src/index.ts | Shared exports |
| Added | packages/shared/src/types/index.ts | Type definitions |
| Added | packages/shared/src/utils/index.ts | Utility functions |
| Added | packages/agents/package.json | Agents package config |
| Added | packages/agents/tsconfig.json | Agents TypeScript config |
| Added | packages/agents/src/index.ts | Agents exports |
| Added | packages/agents/src/agents/index.ts | Agent exports |
| Added | packages/agents/src/agents/types.ts | Agent type definitions |
| Added | packages/api/package.json | API package config |
| Added | packages/api/tsconfig.json | API TypeScript config |
| Added | packages/api/src/index.ts | API entry point |
| Added | packages/api/src/server.ts | Fastify server setup |
| Added | packages/ui/package.json | UI package config |
| Added | packages/ui/tsconfig.json | UI TypeScript config |
| Added | packages/ui/vite.config.ts | Vite configuration |
| Added | packages/ui/tailwind.config.js | Tailwind configuration |
| Added | packages/ui/postcss.config.js | PostCSS configuration |
| Added | packages/ui/index.html | HTML template |
| Added | packages/ui/src/main.tsx | UI entry point |
| Added | packages/ui/src/App.tsx | App component |
| Added | packages/ui/src/styles/globals.css | Global styles |
| Added | output/.gitkeep | Output directory placeholder |
| Added | templates/carousel/.gitkeep | Carousel templates dir |
| Added | templates/pdf/.gitkeep | PDF templates dir |

### Debug Log

- Installed pnpm via npx due to global permission restrictions
- Fixed TypeScript configuration for monorepo (removed project references, simplified paths)
- Duplicated AgentStatus enum in agents package temporarily (will be unified in Story 1.4)

### Completion Notes

- All 6 tasks completed successfully
- `pnpm install` executes without errors
- `pnpm lint` passes with 1 warning (console.log in api/index.ts - acceptable for dev)
- `pnpm typecheck` passes in all 4 packages
- Monorepo structure ready for development

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-28 | Story created | River (SM Agent) |
| 2025-01-28 | Story implemented | Dex (Dev Agent) |
