# Social Content Agent

Sistema multi-agente para automação de conteúdo em redes sociais, focado em desenvolvedores.

## Visão Geral

O Social Content Agent automatiza todo o pipeline de criação de conteúdo para Instagram e LinkedIn:

- **Pesquisa de tendências** em fontes tech (Dev.to, Hacker News, Reddit)
- **Geração de tópicos** relevantes usando IA
- **Curadoria de conteúdo** com referências e exemplos
- **Redação otimizada** para cada plataforma
- **Geração visual** de carrosséis e PDFs
- **Quality assurance** automático com scoring

## Requisitos

- Node.js 20+
- pnpm 8+

## Setup

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` e adicione suas API keys:

- `GROQ_API_KEY` - [Obter em console.groq.com](https://console.groq.com)
- `IDEOGRAM_API_KEY` - [Obter em ideogram.ai](https://ideogram.ai)

### 3. Iniciar desenvolvimento

```bash
# Iniciar todos os serviços
pnpm dev

# Ou individualmente:
pnpm dev:api   # Backend (porta 3001)
pnpm dev:ui    # Frontend (porta 5173)
```

## Estrutura do Projeto

```
social-content-agent/
├── packages/
│   ├── agents/    # Core dos agentes de IA
│   ├── api/       # Backend Fastify
│   ├── ui/        # Frontend React
│   └── shared/    # Tipos e utilitários compartilhados
├── templates/     # Templates HTML/CSS para carrosséis
├── output/        # Conteúdo gerado (gitignored)
└── docs/          # Documentação do projeto
```

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Inicia todos os serviços em modo desenvolvimento |
| `pnpm dev:api` | Inicia apenas o backend |
| `pnpm dev:ui` | Inicia apenas o frontend |
| `pnpm build` | Build de produção |
| `pnpm lint` | Executa ESLint |
| `pnpm typecheck` | Verifica tipos TypeScript |
| `pnpm test` | Executa testes |
| `pnpm clean` | Limpa node_modules e dist |

## Stack Tecnológica

### Backend
- **Fastify** - Framework HTTP performático
- **LangGraph.js** - Orquestração de agentes
- **SQLite + Drizzle** - Persistência

### Frontend
- **Vite + React 18** - Build e UI
- **Tailwind CSS + shadcn/ui** - Styling
- **Zustand** - State management
- **TanStack Query** - Data fetching

### IA
- **Groq (Llama 3)** - LLM primário (free tier)
- **Ideogram** - Geração de imagens (free tier)

## Documentação

- [Brief do Projeto](docs/brief.md)
- [PRD](docs/prd.md)
- [Arquitetura](docs/architecture.md)
- [Especificação de UI](docs/front-end-spec.md)

## Licença

Projeto privado - uso pessoal.
