# Social Content Agent — Product Requirements Document (PRD)

> Sistema multi-agente para automação de conteúdo em redes sociais para desenvolvedores

---

## Objetivos e Contexto

### Goals

- **G1:** Automatizar pesquisa de tendências tech para geração de tópicos relevantes
- **G2:** Gerar textos otimizados para Instagram e LinkedIn com mínimo esforço do usuário
- **G3:** Produzir assets visuais (imagens de fundo, carrosséis, PDFs) de qualidade profissional
- **G4:** Implementar quality gate (QA Agent) que garanta padrão mínimo antes da entrega
- **G5:** Validar viabilidade usando exclusivamente IAs gratuitas (custo zero)
- **G6:** Permitir que o criador (dogfooding) publique 3+ posts/semana em < 30 min

### Background Context

Desenvolvedores enfrentam uma realidade paradoxal: precisam de visibilidade online para crescer na carreira, mas seu trabalho diário consome toda energia disponível. Entre sprints, code reviews e estudos, criar conteúdo para redes sociais fica em segundo plano — resultando em perfis estagnados e oportunidades perdidas de networking e personal branding.

Este projeto propõe um sistema multi-agente que automatiza o pipeline completo de criação de conteúdo: desde a pesquisa de tendências tech até a geração de posts prontos com texto e assets visuais. A abordagem de MVP utiliza exclusivamente ferramentas gratuitas, permitindo validação de viabilidade antes de qualquer investimento. O próprio criador será o primeiro usuário (dogfooding), garantindo feedback honesto sobre a utilidade real do sistema.

### Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2025-01-28 | 1.0 | Criação inicial do PRD | Morgan (PM Agent) |

---

## Requisitos

### Requisitos Funcionais

#### Pipeline de Conteúdo

| ID | Requisito |
|----|-----------|
| FR1 | O sistema deve pesquisar tendências tech em fontes configuráveis (Dev.to, HN, Reddit, Twitter) via RSS/scraping |
| FR2 | O sistema deve gerar lista de 5-10 tópicos relevantes baseados nas tendências pesquisadas |
| FR3 | O sistema deve buscar e curar conteúdo de referência (artigos, códigos, exemplos) para cada tópico selecionado |
| FR4 | O sistema deve gerar texto otimizado para Instagram (legenda até 2200 chars) e LinkedIn (post até 3000 chars) |
| FR5 | O sistema deve gerar imagem de fundo usando IA gratuita (Leonardo.ai, Ideogram, ou similar) |

#### Geração Visual

| ID | Requisito |
|----|-----------|
| FR6 | O sistema deve renderizar slides de carrossel usando templates HTML/CSS com a imagem de fundo gerada |
| FR7 | Cada slide deve suportar: título, texto, código com syntax highlighting, e footer com branding |
| FR8 | O sistema deve gerar carrosséis de até 10 slides para Instagram (formato imagem) |
| FR9 | O sistema deve gerar PDFs formatados para LinkedIn a partir dos mesmos slides |
| FR10 | O sistema deve aplicar overlay semi-transparente sobre imagem de fundo para garantir legibilidade |

#### Qualidade e Orquestração

| ID | Requisito |
|----|-----------|
| FR11 | O agente QA deve analisar todo output (texto, imagens, PDFs) e atribuir score de 0-10 |
| FR12 | O orquestrador deve coordenar a execução sequencial dos agentes e gerenciar retry em falhas |
| FR13 | O sistema deve salvar outputs em diretório local estruturado (output/{data}/{topico}/) |
| FR14 | O sistema deve gerar relatório resumido de cada execução (tópicos gerados, scores, tempo) |

#### Configuração

| ID | Requisito |
|----|-----------|
| FR15 | O usuário deve poder configurar fontes de tendências via arquivo de configuração |
| FR16 | O usuário deve poder configurar API keys de serviços via variáveis de ambiente (.env) |
| FR17 | O sistema deve suportar templates HTML/CSS customizáveis para carrosséis |

#### Interface de Usuário

| ID | Requisito |
|----|-----------|
| FR18 | O sistema deve ter interface web para visualização em tempo real do status dos agentes |
| FR19 | A UI deve exibir log de execução com indicador visual de qual agente está ativo |
| FR20 | A UI deve listar todos os posts gerados com preview (texto + imagem/carrossel) |
| FR21 | A UI deve exibir score do QA para cada post com breakdown de critérios |
| FR22 | A UI deve permitir download de assets (imagens, carrossel, PDF) individualmente |
| FR23 | A UI deve exibir histórico de execuções anteriores com métricas |
| FR24 | A UI deve permitir aprovar/rejeitar posts antes de considerar "prontos" |
| FR25 | A UI deve exibir estatísticas agregadas (total posts, score médio, tempo médio) |

### Requisitos Não-Funcionais

#### Custo e Recursos

| ID | Requisito |
|----|-----------|
| NFR1 | O sistema deve utilizar exclusivamente IAs com tier gratuito (custo zero de APIs) |
| NFR2 | O sistema deve respeitar rate limits de cada serviço gratuito sem falhar |
| NFR3 | O sistema deve rodar em máquina local sem dependências de cloud |

#### Performance

| ID | Requisito |
|----|-----------|
| NFR4 | O pipeline completo (pesquisa → output) deve executar em menos de 10 minutos |
| NFR5 | O sistema deve suportar geração de pelo menos 3 posts por execução |
| NFR6 | O sistema deve cachear resultados de pesquisa para evitar requests duplicados |

#### Qualidade

| ID | Requisito |
|----|-----------|
| NFR7 | Score mínimo do QA para output válido: 6/10 (configurável) |
| NFR8 | Imagens de carrossel devem ter resolução mínima de 1080x1080px |
| NFR9 | PDFs devem ter formatação consistente e legível em dispositivos móveis |

#### Manutenibilidade

| ID | Requisito |
|----|-----------|
| NFR10 | Código deve seguir padrões de linting (ESLint/Prettier ou equivalente Python) |
| NFR11 | Cada agente deve ser implementado em módulo separado para fácil manutenção |
| NFR12 | Sistema deve ter logs estruturados para debug de falhas |

#### Confiabilidade

| ID | Requisito |
|----|-----------|
| NFR13 | Sistema deve ter fallback para serviços alternativos quando um falhar |
| NFR14 | Sistema deve salvar estado parcial para permitir retry de etapas específicas |

#### UI

| ID | Requisito |
|----|-----------|
| NFR15 | A UI deve atualizar em tempo real via WebSocket ou SSE (sem refresh manual) |
| NFR16 | A UI deve ser responsiva (funcionar em desktop e mobile) |
| NFR17 | A UI deve carregar em menos de 3 segundos |
| NFR18 | A UI deve funcionar offline para visualização de posts já gerados |

---

## User Interface Design Goals

### Visão Geral de UX

Uma interface de **command center** que permite ao desenvolvedor acompanhar a "mágica acontecendo" em tempo real. O design deve transmitir:

- **Transparência:** Ver exatamente o que cada agente está fazendo
- **Controle:** Aprovar/rejeitar outputs antes de considerar prontos
- **Eficiência:** Mínimo de cliques para obter posts prontos
- **Tech-friendly:** Visual que ressoa com desenvolvedores (dark mode, monospace, terminais)

### Paradigmas de Interação

| Paradigma | Descrição |
|-----------|-----------|
| **Dashboard Central** | Visão única com todas as informações essenciais |
| **Real-time Updates** | Atualizações automáticas via WebSocket sem refresh |
| **Card-based Posts** | Posts exibidos como cards com preview visual |
| **Terminal-like Logs** | Logs de execução estilo terminal para devs |
| **One-click Download** | Download direto de assets prontos |
| **Approve/Reject Flow** | Ação binária simples para cada post |

### Telas e Views Principais

| # | Tela | Propósito |
|---|------|-----------|
| 1 | **Dashboard Principal** | Status atual, métricas agregadas, ações rápidas |
| 2 | **Execução em Tempo Real** | Pipeline view com agentes, progresso, logs |
| 3 | **Posts Gerados** | Lista/grid de posts com preview, score, ações |
| 4 | **Detalhe do Post** | Visualização completa: texto, carrossel, PDF, score breakdown |
| 5 | **Histórico** | Execuções anteriores, métricas de tendência |
| 6 | **Configurações** | Fontes, templates, thresholds, API keys |

### Wireframe Conceitual — Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  🚀 Social Content Agent                    [▶ Nova Execução]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Posts Hoje   │  │ Score Médio  │  │ Tempo Médio  │          │
│  │     12       │  │    8.2/10    │  │   4:32 min   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌─ Pipeline Status ─────────────────────────────────────────┐ │
│  │ ✅ Pesquisador → ✅ Tópicos → 🔄 Curador → ⏳ Redator → ... │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Posts Recentes ──────────────────────────────────────────┐ │
│  │ ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │ │
│  │ │ [img]   │  │ [img]   │  │ [img]   │  │ [img]   │       │ │
│  │ │ 8.5/10  │  │ 7.2/10  │  │ 9.1/10  │  │ 6.8/10  │       │ │
│  │ │ ✅ 📥   │  │ ✅ 📥   │  │ ✅ 📥   │  │ ❌ 🔄  │       │ │
│  │ └─────────┘  └─────────┘  └─────────┘  └─────────┘       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Logs ────────────────────────────────────────────────────┐ │
│  │ [14:32:01] Pesquisador: Encontradas 23 tendências         │ │
│  │ [14:32:15] Gerador: Selecionados 5 tópicos               │ │
│  │ [14:32:48] Curador: Buscando referências para "React 19" │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Acessibilidade

**Nível:** WCAG AA (básico)

- Contraste adequado (especialmente importante em dark mode)
- Navegação por teclado funcional
- Textos alternativos em imagens de preview

### Branding

| Elemento | Especificação |
|----------|---------------|
| **Tema** | Dark mode como padrão (dev-friendly) |
| **Cores** | Tons de azul/roxo tech + acentos verdes para sucesso |
| **Tipografia** | Sans-serif moderna (Inter, Geist) + Monospace para código/logs |
| **Ícones** | Lucide ou similar (clean, minimalista) |
| **Personalidade** | Profissional mas não corporativo, tech-savvy |

### Plataformas-Alvo

**Primária:** Web Responsiva (Desktop-first)

| Plataforma | Prioridade | Notas |
|------------|------------|-------|
| Desktop (Chrome/Firefox) | Alta | Desenvolvimento e uso principal |
| Tablet | Média | Visualização de posts |
| Mobile | Média | Verificação rápida de status |

---

## Technical Assumptions

### Estrutura de Repositório

**Decisão:** Monorepo

| Aspecto | Especificação | Rationale |
|---------|---------------|-----------|
| **Estrutura** | Monorepo com workspaces | Projeto único, facilita desenvolvimento solo |
| **Workspaces** | `packages/agents`, `packages/ui`, `packages/api`, `packages/shared` | Separação lógica sem overhead de múltiplos repos |
| **Package Manager** | pnpm | Eficiente para monorepo |

### Arquitetura de Serviços

**Decisão:** Monolito Modular com Backend + Frontend separados

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│                   (Vite + React)                            │
│                    WebSocket Client                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ WebSocket / REST
┌──────────────────────────┴──────────────────────────────────┐
│                        BACKEND                              │
│                    (Node.js / Fastify)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ORQUESTRADOR DE AGENTES                │   │
│  │                   (LangGraph.js)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Agent 1 │ │ Agent 2 │ │ Agent 3 │ │ Agent N │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Stack Tecnológica

| Camada | Tecnologia | Rationale |
|--------|------------|-----------|
| **Linguagem Backend** | TypeScript (Node.js) | Ecossistema unificado com frontend |
| **Framework Backend** | Fastify | Performance + TypeScript nativo |
| **Linguagem Frontend** | TypeScript | Type safety, DX |
| **Framework Frontend** | Vite + React 18 | Build rápido, SPA simples |
| **Routing** | React Router v6 | Maduro, bem documentado |
| **Styling** | Tailwind CSS | Rapid prototyping, utility-first |
| **Componentes UI** | shadcn/ui | Acessibilidade + customização |
| **Estado Frontend** | Zustand | Simples, menos boilerplate |
| **Data Fetching** | TanStack Query | Cache, refetch, loading states |
| **Real-time** | WebSocket nativo | Leve, sem dependências extras |

### Stack de Agentes

| Componente | Tecnologia | Rationale |
|------------|------------|-----------|
| **Orquestração** | LangGraph.js | TypeScript nativo, melhor integração |
| **LLM Provider** | Groq (Llama 3) | Free tier generoso, rápido |
| **LLM Fallback** | Google Gemini Free | Backup quando Groq estiver lento |
| **Geração de Imagem** | Ideogram API | Free tier, qualidade boa |
| **Imagem Fallback** | Leonardo.ai | Alternativa gratuita |
| **Renderização HTML** | Puppeteer | Maduro, screenshot confiável |
| **PDF Generation** | Puppeteer PDF | Mesmo engine, consistência |
| **Syntax Highlight** | Shiki | Server-side, temas bonitos |

### Requisitos de Teste

**Decisão:** Unit + Integration (sem E2E no MVP)

| Tipo | Ferramenta | Cobertura Alvo |
|------|------------|----------------|
| **Unit Tests** | Vitest | > 70% dos agentes |
| **Integration Tests** | Vitest + Supertest | API endpoints principais |
| **E2E Tests** | (pós-MVP) Playwright | - |
| **Linting** | ESLint + Prettier | 100% do código |
| **Type Check** | TypeScript strict | Sem any |

### Estrutura de Diretórios

```
social-content-agent/
├── packages/
│   ├── agents/                 # Core dos agentes
│   │   ├── src/
│   │   │   ├── agents/
│   │   │   │   ├── researcher.ts
│   │   │   │   ├── topic-generator.ts
│   │   │   │   ├── curator.ts
│   │   │   │   ├── writer.ts
│   │   │   │   ├── image-designer.ts
│   │   │   │   ├── carousel-builder.ts
│   │   │   │   ├── pdf-maker.ts
│   │   │   │   └── qa-analyst.ts
│   │   │   ├── services/
│   │   │   │   ├── llm.ts
│   │   │   │   ├── image-gen.ts
│   │   │   │   └── renderer.ts
│   │   │   ├── orchestrator.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── ui/                     # Frontend Vite + React
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── routes/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   └── lib/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── api/                    # Backend Fastify
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── websocket/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── shared/                 # Tipos e utils compartilhados
│       ├── src/
│       │   ├── types/
│       │   └── utils/
│       └── package.json
│
├── templates/                  # Templates HTML/CSS carrossel
│   ├── carousel/
│   └── pdf/
│
├── output/                     # Posts gerados
├── .env.example
├── pnpm-workspace.yaml
└── package.json
```

### Premissas Técnicas Adicionais

| # | Premissa | Impacto |
|---|----------|---------|
| 1 | **Node.js 20+** será usado | Suporte a features modernas |
| 2 | **pnpm** como package manager | Eficiência em monorepo |
| 3 | **Docker opcional** no MVP | Simplifica setup inicial |
| 4 | **SQLite** para persistência local | Zero config, portável |
| 5 | **File-based storage** para outputs | Imagens/PDFs no filesystem |
| 6 | **Variáveis de ambiente** para secrets | .env não commitado |
| 7 | **LangGraph.js sobre CrewAI** | Evita bridge Python |

---

## Epic List

| # | Épico | Objetivo | Valor Entregue |
|---|-------|----------|----------------|
| 1 | **Foundation & Pesquisador** | Setup do projeto + primeiro agente funcional | Pipeline mínimo rodando end-to-end |
| 2 | **Pipeline de Conteúdo** | Agentes de geração de texto completos | Textos prontos para Instagram/LinkedIn |
| 3 | **Geração Visual** | Assets visuais (imagem, carrossel, PDF) | Posts completos com visual |
| 4 | **Qualidade & Orquestração** | QA Agent + Orquestrador completo | Pipeline automatizado com quality gate |
| 5 | **Dashboard UI** | Interface de monitoramento e gestão | Acompanhamento real-time e downloads |

---

## Epic 1: Foundation & Pesquisador

### Objetivo

Estabelecer a infraestrutura técnica do projeto e implementar o primeiro agente (Pesquisador) funcionando end-to-end. Este épico prova a viabilidade técnica do sistema multi-agente e estabelece os padrões de código, testes e estrutura que serão seguidos nos épicos subsequentes.

### Stories

#### Story 1.1: Setup do Monorepo e Estrutura Base

**Como** desenvolvedor,
**Quero** um monorepo configurado com workspaces,
**Para que** eu possa desenvolver backend, frontend e agentes de forma organizada.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Monorepo criado com pnpm workspaces |
| AC2 | Estrutura de packages: `agents`, `api`, `ui`, `shared` |
| AC3 | TypeScript configurado com strict mode em todos os packages |
| AC4 | ESLint + Prettier configurados com regras consistentes |
| AC5 | Scripts de build/dev/lint funcionando na raiz |
| AC6 | .env.example criado com variáveis necessárias documentadas |
| AC7 | .gitignore configurado (node_modules, .env, output/) |
| AC8 | README.md com instruções de setup inicial |

---

#### Story 1.2: Backend API Base com Health Check

**Como** desenvolvedor,
**Quero** um servidor Fastify rodando com endpoint de health check,
**Para que** eu tenha a base para adicionar rotas dos agentes.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Package `api` com Fastify configurado |
| AC2 | Servidor rodando na porta configurável via env (default 3001) |
| AC3 | Endpoint `GET /health` retornando `{ status: "ok", timestamp }` |
| AC4 | CORS configurado para desenvolvimento local |
| AC5 | Logging estruturado com Pino (integrado ao Fastify) |
| AC6 | Graceful shutdown implementado |
| AC7 | Script `pnpm dev:api` funcionando com hot reload (tsx) |
| AC8 | Teste de integração do endpoint health passando |

---

#### Story 1.3: Frontend Shell com Vite + React

**Como** desenvolvedor,
**Quero** uma aplicação React básica rodando,
**Para que** eu tenha a base para construir o dashboard.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Package `ui` com Vite + React 18 configurado |
| AC2 | TypeScript strict habilitado |
| AC3 | Tailwind CSS configurado e funcionando |
| AC4 | shadcn/ui inicializado com tema dark |
| AC5 | React Router v6 configurado com rotas básicas |
| AC6 | Layout base com sidebar/header placeholder |
| AC7 | Página inicial exibindo "Social Content Agent" + status do backend |
| AC8 | Script `pnpm dev:ui` funcionando com HMR |
| AC9 | Zustand store básico configurado |

---

#### Story 1.4: Package Shared com Types e Utils

**Como** desenvolvedor,
**Quero** tipos e utilitários compartilhados entre packages,
**Para que** eu mantenha consistência e evite duplicação.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Package `shared` criado e buildando corretamente |
| AC2 | Tipos base definidos: `Agent`, `AgentResult`, `Trend`, `Topic` |
| AC3 | Tipos de configuração: `AppConfig`, `LLMConfig`, `SourceConfig` |
| AC4 | Enum de status: `AgentStatus` (idle, running, success, error) |
| AC5 | Utils: `logger`, `retry`, `rateLimiter` |
| AC6 | Exports corretos para consumo pelos outros packages |
| AC7 | Testes unitários para utils principais |

---

#### Story 1.5: Serviço de Configuração e Environment

**Como** desenvolvedor,
**Quero** um sistema centralizado de configuração,
**Para que** eu possa gerenciar API keys e settings de forma segura.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Arquivo de configuração `config.ts` no package `shared` |
| AC2 | Validação de variáveis de ambiente obrigatórias no startup |
| AC3 | Configuração de fontes de tendências (Dev.to, HN, Reddit) via config |
| AC4 | Configuração de LLM providers (Groq, Gemini) via env |
| AC5 | Configuração de Image providers (Ideogram, Leonardo) via env |
| AC6 | Fallback para valores default quando env não definida |
| AC7 | Log de configuração carregada (sem expor secrets) |
| AC8 | Testes para validação de config |

---

#### Story 1.6: Agente Pesquisador — Core

**Como** usuário,
**Quero** que o sistema pesquise tendências tech automaticamente,
**Para que** eu tenha tópicos relevantes para criar conteúdo.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Agente `Researcher` implementado no package `agents` |
| AC2 | Busca tendências do Dev.to via RSS feed |
| AC3 | Busca tendências do Hacker News via API pública |
| AC4 | Busca tendências do Reddit r/programming via RSS |
| AC5 | Normalização dos dados em formato `Trend` unificado |
| AC6 | Deduplicação de tendências similares |
| AC7 | Respeito a rate limits das fontes |
| AC8 | Retorno de lista ordenada por relevância/recência |
| AC9 | Testes unitários com mocks das fontes |

---

#### Story 1.7: Agente Pesquisador — Integração com Backend

**Como** usuário,
**Quero** disparar a pesquisa via API e ver os resultados,
**Para que** eu possa testar o agente funcionando.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Endpoint `POST /api/agents/researcher/run` dispara o agente |
| AC2 | Endpoint `GET /api/agents/researcher/results` retorna últimos resultados |
| AC3 | Resultados salvos em arquivo JSON em `output/trends/` |
| AC4 | Resposta inclui metadata: timestamp, fontes consultadas, total de trends |
| AC5 | Tratamento de erros com mensagens claras |
| AC6 | Log de execução do agente |
| AC7 | Teste de integração do fluxo completo |

---

#### Story 1.8: Visualização de Tendências na UI

**Como** usuário,
**Quero** ver as tendências pesquisadas na interface,
**Para que** eu possa validar que o sistema está funcionando.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Página `/trends` listando tendências do backend |
| AC2 | Card para cada tendência: título, fonte, data, link |
| AC3 | Botão "Pesquisar Agora" que dispara o agente |
| AC4 | Loading state enquanto agente executa |
| AC5 | Atualização automática da lista após execução |
| AC6 | Indicador de última atualização |
| AC7 | Empty state quando não há tendências |
| AC8 | Tratamento de erro com mensagem amigável |

---

## Epic 2: Pipeline de Conteúdo

### Objetivo

Implementar a cadeia completa de geração de texto: Gerador de Tópicos → Curador → Redator. Este épico transforma tendências brutas em posts textuais prontos para Instagram e LinkedIn, integrando com LLMs gratuitos (Groq/Gemini) e estabelecendo padrões de prompt engineering e fallback entre providers.

### Stories

#### Story 2.1: Serviço de LLM com Groq

**Como** desenvolvedor,
**Quero** um serviço abstrato para chamadas de LLM,
**Para que** os agentes possam gerar texto sem conhecer detalhes do provider.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Serviço `LLMService` criado no package `agents/services` |
| AC2 | Interface abstrata `LLMProvider` definida |
| AC3 | Implementação `GroqProvider` usando Llama 3 |
| AC4 | Suporte a mensagens de sistema e usuário |
| AC5 | Configuração de temperature, max_tokens via parâmetros |
| AC6 | Rate limiting respeitando limites do Groq (30 req/min) |
| AC7 | Logging de requests/responses (sem expor conteúdo completo) |
| AC8 | Tratamento de erros com retry exponencial |
| AC9 | Testes unitários com mock do Groq |

---

#### Story 2.2: Fallback de LLM com Gemini

**Como** desenvolvedor,
**Quero** fallback automático para Gemini quando Groq falhar,
**Para que** o sistema continue funcionando mesmo com instabilidade.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Implementação `GeminiProvider` usando Gemini Free API |
| AC2 | `LLMService` configurado com lista ordenada de providers |
| AC3 | Fallback automático após N falhas consecutivas |
| AC4 | Circuit breaker para provider com muitas falhas |
| AC5 | Log indicando qual provider está sendo usado |
| AC6 | Métricas de uso por provider (para análise) |
| AC7 | Teste de integração simulando falha e fallback |

---

#### Story 2.3: Agente Gerador de Tópicos

**Como** usuário,
**Quero** que o sistema selecione os melhores tópicos das tendências,
**Para que** eu tenha sugestões relevantes para criar conteúdo.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Agente `TopicGenerator` implementado |
| AC2 | Recebe lista de tendências do Pesquisador como input |
| AC3 | Usa LLM para analisar e ranquear tendências |
| AC4 | Seleciona 5-10 tópicos mais relevantes para devs |
| AC5 | Para cada tópico: título, descrição curta, potencial de engajamento |
| AC6 | Filtra tópicos repetidos ou muito similares |
| AC7 | Output no formato `Topic` definido em shared |
| AC8 | Prompt engineering otimizado para seleção de tópicos |
| AC9 | Testes com cenários variados de tendências |

---

#### Story 2.4: Agente Curador de Conteúdo

**Como** usuário,
**Quero** que o sistema busque referências para cada tópico,
**Para que** os posts tenham embasamento e exemplos reais.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Agente `Curator` implementado |
| AC2 | Recebe tópico como input |
| AC3 | Busca artigos relacionados via web search (se disponível) ou LLM knowledge |
| AC4 | Extrai exemplos de código relevantes (se aplicável) |
| AC5 | Compila lista de referências: título, url, resumo |
| AC6 | Identifica pontos-chave para abordar no post |
| AC7 | Output estruturado: `CuratedContent` com refs, code_examples, key_points |
| AC8 | Limite de tempo/recursos por tópico (evitar loops longos) |
| AC9 | Testes com diferentes tipos de tópicos |

---

#### Story 2.5: Agente Redator — Posts para Instagram

**Como** usuário,
**Quero** textos otimizados para Instagram,
**Para que** eu tenha legendas prontas para publicar.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Agente `Writer` implementado com modo Instagram |
| AC2 | Recebe tópico + conteúdo curado como input |
| AC3 | Gera legenda de até 2200 caracteres |
| AC4 | Inclui hook forte na primeira linha |
| AC5 | Usa emojis de forma estratégica (não excessiva) |
| AC6 | Inclui call-to-action no final |
| AC7 | Gera 5-10 hashtags relevantes |
| AC8 | Tom: informativo mas acessível para devs |
| AC9 | Prompt templates configuráveis |
| AC10 | Testes validando formato e limites |

---

#### Story 2.6: Agente Redator — Posts para LinkedIn

**Como** usuário,
**Quero** textos otimizados para LinkedIn,
**Para que** eu tenha posts profissionais prontos.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Modo LinkedIn adicionado ao agente `Writer` |
| AC2 | Gera post de até 3000 caracteres |
| AC3 | Estrutura: hook → contexto → insights → conclusão → CTA |
| AC4 | Tom mais profissional que Instagram |
| AC5 | Usa quebras de linha para escaneabilidade |
| AC6 | Sem hashtags excessivos (máximo 3-5) |
| AC7 | Opção de gerar versão curta (para feed) e longa (para artigo) |
| AC8 | Testes comparando output Instagram vs LinkedIn |

---

#### Story 2.7: Integração do Pipeline de Texto

**Como** usuário,
**Quero** executar o pipeline completo de texto via API,
**Para que** eu possa gerar posts de ponta a ponta.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Endpoint `POST /api/pipeline/text` executa Tópicos → Curador → Redator |
| AC2 | Aceita parâmetros: número de posts, plataforma (ig/linkedin/ambos) |
| AC3 | Execução sequencial dos agentes com passagem de contexto |
| AC4 | Cada etapa salva resultado intermediário |
| AC5 | Resposta final inclui todos os posts gerados |
| AC6 | Status de cada agente disponível via endpoint separado |
| AC7 | Output salvo em `output/posts/{data}/{topico}/` |
| AC8 | Teste de integração do pipeline completo |

---

#### Story 2.8: Visualização de Posts de Texto na UI

**Como** usuário,
**Quero** ver os posts de texto gerados na interface,
**Para que** eu possa revisar a qualidade antes de adicionar visual.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Página `/posts` listando posts gerados |
| AC2 | Preview do texto com formatação (quebras, emojis) |
| AC3 | Indicador de plataforma (Instagram/LinkedIn) |
| AC4 | Botão para copiar texto |
| AC5 | Visualização do conteúdo curado usado como base |
| AC6 | Contagem de caracteres |
| AC7 | Filtro por data e plataforma |
| AC8 | Empty state e loading states |

---

## Epic 3: Geração Visual

### Objetivo

Adicionar a camada visual ao sistema: geração de imagens de fundo com IA, criação de carrosséis HTML/CSS renderizados como imagens para Instagram, e PDFs formatados para LinkedIn. Este épico transforma posts de texto em conteúdo visual completo, pronto para publicação.

### Stories

#### Story 3.1: Serviço de Geração de Imagem

**Como** desenvolvedor,
**Quero** um serviço abstrato para geração de imagens,
**Para que** os agentes possam criar visuais sem conhecer detalhes do provider.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Serviço `ImageGenService` criado no package `agents/services` |
| AC2 | Interface abstrata `ImageProvider` definida |
| AC3 | Implementação `IdeogramProvider` usando API gratuita |
| AC4 | Implementação `LeonardoProvider` como fallback |
| AC5 | Suporte a parâmetros: prompt, style, aspect_ratio, size |
| AC6 | Download e salvamento da imagem gerada localmente |
| AC7 | Rate limiting respeitando limites free tier |
| AC8 | Fallback automático entre providers |
| AC9 | Testes unitários com mocks |

---

#### Story 3.2: Agente Designer de Imagens

**Como** usuário,
**Quero** imagens de fundo geradas automaticamente para cada post,
**Para que** meu conteúdo tenha visual atraente.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Agente `ImageDesigner` implementado |
| AC2 | Recebe tópico/conteúdo como input |
| AC3 | Gera prompt otimizado para imagem de fundo tech |
| AC4 | Prompt inclui: tema abstrato, cores tech, sem texto na imagem |
| AC5 | Solicita imagem via `ImageGenService` |
| AC6 | Valida qualidade da imagem recebida (dimensões, formato) |
| AC7 | Salva imagem em `output/images/{post_id}/background.png` |
| AC8 | Retry com prompt alternativo se qualidade insuficiente |
| AC9 | Output: path da imagem + metadata |

---

#### Story 3.3: Templates HTML/CSS para Slides

**Como** desenvolvedor,
**Quero** templates HTML/CSS para slides de carrossel,
**Para que** os posts tenham layout profissional e consistente.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Diretório `templates/carousel/` criado com templates base |
| AC2 | Template de slide capa: título grande + imagem de fundo |
| AC3 | Template de slide conteúdo: título + texto + código opcional |
| AC4 | Template de slide código: syntax highlighting com Shiki |
| AC5 | Template de slide CTA: call-to-action + handle |
| AC6 | Overlay semi-transparente configurável |
| AC7 | Suporte a variáveis: `{{title}}`, `{{content}}`, `{{code}}`, `{{handle}}` |
| AC8 | Estilos responsivos para 1080x1080 (Instagram) |
| AC9 | Dark theme como padrão |
| AC10 | Preview de templates via rota de desenvolvimento |

---

#### Story 3.4: Serviço de Renderização HTML → Imagem

**Como** desenvolvedor,
**Quero** renderizar HTML/CSS como imagens PNG,
**Para que** os slides possam ser usados no Instagram.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Serviço `RendererService` criado usando Puppeteer |
| AC2 | Método `renderToImage(html, options)` retorna PNG buffer |
| AC3 | Suporte a dimensões configuráveis (default 1080x1080) |
| AC4 | Injeção de CSS externo nos templates |
| AC5 | Suporte a imagem de fundo via path local |
| AC6 | Configuração de qualidade/compressão |
| AC7 | Cleanup de browser instances após uso |
| AC8 | Pool de browsers para performance (opcional MVP) |
| AC9 | Testes com templates reais |

---

#### Story 3.5: Agente Carousel Builder

**Como** usuário,
**Quero** carrosséis de imagens gerados automaticamente,
**Para que** eu possa postar conteúdo longo no Instagram.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Agente `CarouselBuilder` implementado |
| AC2 | Recebe: conteúdo do post, imagem de fundo, número de slides |
| AC3 | Divide conteúdo em slides (máximo 10 para Instagram) |
| AC4 | Slide 1: capa com título impactante |
| AC5 | Slides 2-8: conteúdo distribuído logicamente |
| AC6 | Slide com código: syntax highlighting aplicado |
| AC7 | Slide final: CTA + handle do autor |
| AC8 | Renderiza cada slide via `RendererService` |
| AC9 | Output: array de paths das imagens + metadata |
| AC10 | Salva em `output/posts/{id}/carousel/` |

---

#### Story 3.6: Agente PDF Maker

**Como** usuário,
**Quero** PDFs formatados para LinkedIn,
**Para que** eu possa compartilhar carrosséis nativos na plataforma.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Agente `PDFMaker` implementado |
| AC2 | Recebe: slides do carrossel já renderizados |
| AC3 | Compila imagens em PDF único |
| AC4 | Alternativa: renderiza HTML direto para PDF via Puppeteer |
| AC5 | PDF otimizado para visualização mobile |
| AC6 | Metadata do PDF: título, autor |
| AC7 | Output: path do PDF + tamanho do arquivo |
| AC8 | Salva em `output/posts/{id}/document.pdf` |
| AC9 | Testes validando PDF gerado |

---

#### Story 3.7: Integração Pipeline Visual

**Como** usuário,
**Quero** executar geração visual via API,
**Para que** posts de texto ganhem assets visuais automaticamente.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Endpoint `POST /api/pipeline/visual` executa ImageDesigner → Carousel → PDF |
| AC2 | Aceita: post_id de post já gerado, ou conteúdo direto |
| AC3 | Parâmetros: gerar_carousel (bool), gerar_pdf (bool), num_slides |
| AC4 | Execução sequencial com status em cada etapa |
| AC5 | Atualiza post no banco com paths dos assets |
| AC6 | Endpoint `GET /api/posts/{id}/assets` retorna lista de assets |
| AC7 | Tratamento de erros com cleanup de arquivos parciais |
| AC8 | Teste de integração do pipeline visual |

---

#### Story 3.8: Visualização e Download de Assets na UI

**Como** usuário,
**Quero** ver e baixar os assets visuais na interface,
**Para que** eu possa publicar nas redes sociais.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Página de detalhe do post exibe carrossel como galeria |
| AC2 | Preview de cada slide com navegação (prev/next) |
| AC3 | Preview do PDF com visualizador inline |
| AC4 | Botão download individual por slide |
| AC5 | Botão download do carrossel como ZIP |
| AC6 | Botão download do PDF |
| AC7 | Indicador de tamanho de cada arquivo |
| AC8 | Loading states durante geração visual |
| AC9 | Botão "Gerar Visual" para posts só com texto |

---

## Epic 4: Qualidade & Orquestração

### Objetivo

Implementar o quality gate (QA Agent) e o orquestrador completo usando LangGraph. Este épico unifica todos os agentes em um pipeline automatizado com scoring de qualidade, retry inteligente, persistência em SQLite e logging estruturado.

### Stories

#### Story 4.1: Persistência com SQLite

**Como** desenvolvedor,
**Quero** persistência estruturada em SQLite,
**Para que** execuções, posts e scores sejam salvos e consultáveis.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | SQLite configurado no package `api` |
| AC2 | Schema definido: `executions`, `posts`, `assets`, `scores` |
| AC3 | Tabela `executions`: id, started_at, finished_at, status, config |
| AC4 | Tabela `posts`: id, execution_id, topic, text_ig, text_linkedin, created_at |
| AC5 | Tabela `assets`: id, post_id, type (image/carousel/pdf), path, size |
| AC6 | Tabela `scores`: id, post_id, overall_score, criteria_breakdown (JSON) |
| AC7 | Migrations automáticas no startup |
| AC8 | Repository pattern para acesso aos dados |
| AC9 | Testes de CRUD para cada tabela |

---

#### Story 4.2: Agente QA Analyst — Critérios de Qualidade

**Como** usuário,
**Quero** que o sistema avalie a qualidade de cada post,
**Para que** eu receba apenas conteúdo que atende um padrão mínimo.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Agente `QAAnalyst` implementado |
| AC2 | Recebe: post completo (texto + assets) como input |
| AC3 | Critérios de texto: clareza, relevância, engajamento, gramática |
| AC4 | Critérios de código: sintaxe correta, explicação adequada |
| AC5 | Critérios visuais: legibilidade, contraste, composição |
| AC6 | Score de 0-10 para cada critério |
| AC7 | Score geral calculado como média ponderada |
| AC8 | Feedback textual para cada critério abaixo de 7 |
| AC9 | Output: `QAResult` com scores, feedback, approved (bool) |

---

#### Story 4.3: Agente QA Analyst — Análise de Imagens

**Como** usuário,
**Quero** que o QA analise também as imagens geradas,
**Para que** a qualidade visual seja garantida.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | QA analisa imagens usando LLM multimodal (se disponível) |
| AC2 | Fallback: análise heurística (dimensões, tamanho, formato) |
| AC3 | Verifica legibilidade do texto sobre a imagem |
| AC4 | Verifica se código está visível e formatado |
| AC5 | Verifica consistência entre slides do carrossel |
| AC6 | Score visual separado do score de texto |
| AC7 | Feedback específico para problemas visuais |
| AC8 | Testes com imagens de qualidade variada |

---

#### Story 4.4: Orquestrador LangGraph — Setup Base

**Como** desenvolvedor,
**Quero** um orquestrador usando LangGraph,
**Para que** o fluxo entre agentes seja gerenciado de forma robusta.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | LangGraph.js configurado no package `agents` |
| AC2 | Grafo definido com todos os agentes como nodes |
| AC3 | Edges definindo fluxo: Pesquisador → Tópicos → Curador → Redator → Visual → QA |
| AC4 | State compartilhado entre nodes tipado |
| AC5 | Checkpoints para retomada em caso de falha |
| AC6 | Configuração de paralelismo onde possível |
| AC7 | Logging de transições entre nodes |
| AC8 | Testes do grafo com mocks dos agentes |

---

#### Story 4.5: Orquestrador — Retry e Error Handling

**Como** usuário,
**Quero** que o sistema tente novamente em caso de falhas,
**Para que** problemas temporários não interrompam a geração.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Retry automático configurável por agente (default: 3 tentativas) |
| AC2 | Backoff exponencial entre tentativas |
| AC3 | Fallback para provider alternativo após N falhas |
| AC4 | Erros categorizados: retriable vs fatal |
| AC5 | State preservado entre retries |
| AC6 | Timeout configurável por agente |
| AC7 | Log detalhado de erros e tentativas |
| AC8 | Notificação ao final se houve degradação (fallback usado) |
| AC9 | Testes simulando falhas e validando recovery |

---

#### Story 4.6: Quality Gate e Threshold

**Como** usuário,
**Quero** configurar score mínimo para aprovação,
**Para que** eu controle o nível de qualidade aceitável.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Threshold configurável via env/config (default: 6.0) |
| AC2 | Posts abaixo do threshold marcados como `needs_review` |
| AC3 | Posts acima do threshold marcados como `approved` |
| AC4 | Opção de regenerar posts reprovados automaticamente (1x) |
| AC5 | Métricas: % aprovados, score médio, distribuição de scores |
| AC6 | Endpoint para ajustar threshold dinamicamente |
| AC7 | UI mostra indicador visual de aprovação/reprovação |
| AC8 | Testes com posts de diferentes qualidades |

---

#### Story 4.7: Pipeline Completo End-to-End

**Como** usuário,
**Quero** executar o pipeline completo com um comando,
**Para que** eu obtenha posts prontos de ponta a ponta.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Endpoint `POST /api/pipeline/run` executa pipeline completo |
| AC2 | Parâmetros: num_posts, platforms, include_visual, quality_threshold |
| AC3 | Cria registro de execução no banco antes de iniciar |
| AC4 | Atualiza status em tempo real (via WebSocket) |
| AC5 | Salva todos os posts e assets no banco ao finalizar |
| AC6 | Retorna resumo: total gerados, aprovados, scores |
| AC7 | Endpoint `GET /api/pipeline/status/{execution_id}` |
| AC8 | Suporte a cancelamento de execução em andamento |
| AC9 | Teste de integração do pipeline completo |

---

#### Story 4.8: Histórico de Execuções na UI

**Como** usuário,
**Quero** ver histórico de todas as execuções,
**Para que** eu possa analisar tendências e performance.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Página `/history` listando execuções |
| AC2 | Cada execução mostra: data, duração, posts gerados, score médio |
| AC3 | Status visual: sucesso, parcial, falha |
| AC4 | Clique expande para ver posts daquela execução |
| AC5 | Gráfico de score médio ao longo do tempo |
| AC6 | Gráfico de posts gerados por dia/semana |
| AC7 | Filtro por período e status |
| AC8 | Export de dados para CSV |

---

## Epic 5: Dashboard UI

### Objetivo

Completar a interface web com dashboard de métricas, monitoramento real-time via WebSocket, fluxo de aprovação de posts e configurações. Este épico transforma o sistema em uma experiência visual completa.

### Stories

#### Story 5.1: WebSocket Server para Real-Time

**Como** desenvolvedor,
**Quero** um servidor WebSocket integrado ao backend,
**Para que** a UI receba atualizações em tempo real.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | WebSocket server configurado no Fastify |
| AC2 | Eventos definidos: `pipeline:start`, `agent:start`, `agent:complete`, `agent:error`, `pipeline:complete` |
| AC3 | Payload inclui: agent_id, status, progress, timestamp, data |
| AC4 | Suporte a múltiplas conexões simultâneas |
| AC5 | Heartbeat para manter conexões vivas |
| AC6 | Reconexão automática no cliente |
| AC7 | Logging de conexões/desconexões |
| AC8 | Testes de eventos WebSocket |

---

#### Story 5.2: Hook de WebSocket no React

**Como** desenvolvedor,
**Quero** um hook React para consumir WebSocket,
**Para que** componentes recebam updates de forma reativa.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Hook `useWebSocket` implementado |
| AC2 | Gerencia conexão, reconexão e cleanup |
| AC3 | Retorna: `isConnected`, `lastMessage`, `subscribe(event, callback)` |
| AC4 | Integração com Zustand store para estado global |
| AC5 | Hook `usePipelineStatus` específico para pipeline |
| AC6 | Indicador visual de conexão na UI |
| AC7 | Fallback graceful se WebSocket indisponível |
| AC8 | Testes do hook com mock WebSocket |

---

#### Story 5.3: Dashboard Principal com Métricas

**Como** usuário,
**Quero** um dashboard com visão geral do sistema,
**Para que** eu tenha métricas importantes em um só lugar.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Página `/` (home) como dashboard principal |
| AC2 | Cards de métricas: posts hoje, score médio, tempo médio, aprovação % |
| AC3 | Métricas atualizadas em tempo real |
| AC4 | Gráfico de posts gerados últimos 7 dias |
| AC5 | Gráfico de distribuição de scores |
| AC6 | Lista de posts recentes (últimos 5) com quick preview |
| AC7 | Botão "Nova Execução" em destaque |
| AC8 | Indicador de status do pipeline (idle/running) |
| AC9 | Responsivo para desktop e tablet |

---

#### Story 5.4: View de Execução Real-Time

**Como** usuário,
**Quero** acompanhar a execução do pipeline ao vivo,
**Para que** eu veja exatamente o que está acontecendo.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Página `/execution` ou modal de execução |
| AC2 | Visualização do pipeline como fluxo: agentes conectados |
| AC3 | Cada agente mostra: ícone, nome, status (waiting/running/done/error) |
| AC4 | Animação de "pulsing" no agente ativo |
| AC5 | Tempo decorrido em cada agente |
| AC6 | Log de eventos em tempo real (estilo terminal) |
| AC7 | Preview parcial de outputs conforme são gerados |
| AC8 | Botão de cancelar execução |
| AC9 | Transição automática para posts quando finaliza |

---

#### Story 5.5: Fluxo de Aprovação de Posts

**Como** usuário,
**Quero** aprovar ou rejeitar posts facilmente,
**Para que** eu controle o que será publicado.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Posts com status: `pending`, `approved`, `rejected` |
| AC2 | Botões de aprovar (✓) e rejeitar (✗) em cada post |
| AC3 | Ação de aprovar move para lista "Prontos para Publicar" |
| AC4 | Ação de rejeitar pede motivo (opcional) |
| AC5 | Opção "Regenerar" para posts rejeitados |
| AC6 | Filtro por status na lista de posts |
| AC7 | Bulk actions: aprovar todos, rejeitar todos |
| AC8 | Contador de posts pendentes no menu |
| AC9 | Keyboard shortcuts: A para aprovar, R para rejeitar |

---

#### Story 5.6: Página de Configurações

**Como** usuário,
**Quero** ajustar configurações pela interface,
**Para que** eu não precise editar arquivos manualmente.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Página `/settings` com formulário de configurações |
| AC2 | Seção "Fontes": toggle para cada fonte de tendências |
| AC3 | Seção "LLM": seleção de provider preferido, fallback order |
| AC4 | Seção "Imagem": seleção de provider, estilo preferido |
| AC5 | Seção "Qualidade": threshold de score, retry automático |
| AC6 | Seção "Output": diretório de saída, formatos habilitados |
| AC7 | Botão "Salvar" persiste configurações |
| AC8 | Botão "Restaurar Padrões" |
| AC9 | Validação de campos antes de salvar |
| AC10 | Toast de confirmação ao salvar |

---

#### Story 5.7: Editor de Templates de Carrossel

**Como** usuário,
**Quero** visualizar e customizar templates de slides,
**Para que** meu visual seja único.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Página `/settings/templates` listando templates disponíveis |
| AC2 | Preview visual de cada template |
| AC3 | Edição de cores principais (background, text, accent) |
| AC4 | Edição de fontes (título, corpo, código) |
| AC5 | Edição do handle/branding no footer |
| AC6 | Preview ao vivo das alterações |
| AC7 | Salvar como novo template ou sobrescrever |
| AC8 | Template "default" não pode ser deletado |
| AC9 | Import/export de templates como JSON |

---

#### Story 5.8: Polish e Otimizações Finais

**Como** usuário,
**Quero** uma experiência polida e performática,
**Para que** usar o sistema seja prazeroso.

**Acceptance Criteria:**

| # | Critério |
|---|----------|
| AC1 | Loading skeletons em todas as páginas |
| AC2 | Transições suaves entre páginas (Framer Motion ou similar) |
| AC3 | Toast notifications para ações importantes |
| AC4 | Empty states com ilustrações e CTAs |
| AC5 | Error boundaries com fallback amigável |
| AC6 | Lazy loading de imagens e componentes pesados |
| AC7 | Service Worker para cache de assets estáticos |
| AC8 | Lighthouse score > 80 em Performance |
| AC9 | Testes E2E dos fluxos principais (Playwright) |
| AC10 | Documentação de uso básico no README |

---

## Checklist de Validação

| # | Critério | Status |
|---|----------|--------|
| 1 | Goals são SMART e mensuráveis | ✅ |
| 2 | Requisitos rastreáveis (FR/NFR numerados) | ✅ |
| 3 | Público-alvo definido | ✅ |
| 4 | MVP scope claro | ✅ |
| 5 | Épicos sequenciais e incrementais | ✅ |
| 6 | Stories dimensionadas para AI agent | ✅ |
| 7 | Acceptance criteria testáveis | ✅ |
| 8 | Dependências entre stories explícitas | ✅ |
| 9 | Cross-cutting concerns distribuídos | ✅ |
| 10 | UI/UX goals definidos | ✅ |
| 11 | Stack técnica justificada | ✅ |
| 12 | Riscos identificados | ✅ |
| 13 | Sem ambiguidades bloqueantes | ✅ |
| 14 | Pronto para handoff ao Architect | ✅ |

---

## Métricas do PRD

| Métrica | Valor |
|---------|-------|
| **Total de Épicos** | 5 |
| **Total de Stories** | 40 |
| **Requisitos Funcionais** | 25 |
| **Requisitos Não-Funcionais** | 18 |
| **Acceptance Criteria** | ~320 |

---

## Next Steps

### UX Expert Prompt

```
Olá! Preciso criar o design system e wireframes para o Social Content Agent.

Contexto: Sistema multi-agente para geração automática de posts para Instagram/LinkedIn, focado em desenvolvedores.

Referência: docs/prd.md (seção UI Goals)

Requisitos:
- 6 telas principais: Dashboard, Execução Real-Time, Posts, Post Detail, History, Settings
- Dark theme como padrão
- Tech-friendly (monospace, terminal-like logs)
- Responsivo desktop-first
- shadcn/ui como base de componentes

Entregáveis esperados:
1. Design tokens (cores, tipografia, espaçamento)
2. Wireframes das 6 telas
3. Componentes-chave (cards de post, pipeline view, score indicator)
```

### Architect Prompt

```
Olá! Preciso criar a arquitetura técnica para o Social Content Agent.

Contexto: Sistema multi-agente com 9 agentes orquestrados por LangGraph,
gerando posts para Instagram/LinkedIn com assets visuais.

Referência: docs/prd.md (seção Technical Assumptions)

Stack definida:
- Monorepo (pnpm workspaces): agents, api, ui, shared
- Backend: Fastify + TypeScript
- Frontend: Vite + React + Tailwind + shadcn/ui
- Agentes: LangGraph.js
- LLM: Groq (Llama 3) + Gemini fallback
- Imagem: Ideogram + Leonardo fallback
- Renderização: Puppeteer
- Persistência: SQLite
- Real-time: WebSocket

Entregáveis esperados:
1. Diagrama de arquitetura de alto nível
2. Diagrama de fluxo dos agentes
3. Schema do banco de dados
4. Estrutura de diretórios detalhada
5. ADRs para decisões arquiteturais chave
```

---

*Documento gerado com auxílio do Morgan (PM Agent) — Synkra AIOS*
