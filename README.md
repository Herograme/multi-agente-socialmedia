# Social Content Agent

Sistema multi-agente para automacao de conteudo em redes sociais, focado em desenvolvedores.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](/)
[![License](https://img.shields.io/badge/license-private-blue)](/)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-green)](/)

## Visao Geral

O Social Content Agent automatiza todo o pipeline de criacao de conteudo para Instagram e LinkedIn:

- **Pesquisa de tendencias** em fontes tech (Dev.to, Hacker News, Reddit)
- **Geracao de topicos** relevantes usando IA
- **Curadoria de conteudo** com referencias e exemplos
- **Redacao otimizada** para cada plataforma
- **Geracao visual** de carrosseis e PDFs
- **Quality assurance** automatico com scoring

## Quick Start

### Requisitos

- Node.js 20+
- pnpm 8+
- Git

### 1. Clone o Repositorio

```bash
git clone https://github.com/your-org/social-content-agent.git
cd social-content-agent
```

### 2. Instale as Dependencias

```bash
pnpm install
```

### 3. Configure as Variaveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione suas API keys:

```env
# LLM Providers
GROQ_API_KEY=your_groq_api_key_here
GOOGLE_AI_KEY=your_gemini_api_key_here (opcional)

# Image Providers
IDEOGRAM_API_KEY=your_ideogram_api_key_here
LEONARDO_API_KEY=your_leonardo_api_key_here (opcional)

# Database
DATABASE_URL=file:./dev.db

# Server
PORT=3001
NODE_ENV=development
```

### 4. Inicie o Desenvolvimento

```bash
# Inicia todos os servicos (API + UI)
pnpm dev

# Ou individualmente:
pnpm dev:api   # Backend (porta 3001)
pnpm dev:ui    # Frontend (porta 5173)
```

### 5. Acesse a Aplicacao

Abra [http://localhost:5173](http://localhost:5173) no navegador.

## Estrutura do Projeto

```
social-content-agent/
├── packages/
│   ├── agents/      # Core dos agentes de IA
│   ├── api/         # Backend Fastify
│   ├── ui/          # Frontend React
│   ├── shared/      # Tipos e utilidades compartilhados
│   └── e2e/         # Testes end-to-end (Playwright)
├── templates/       # Templates HTML/CSS para carrosseis
├── output/          # Conteudo gerado (gitignored)
└── docs/            # Documentacao do projeto
```

## Scripts Disponiveis

| Comando | Descricao |
|---------|-----------|
| `pnpm dev` | Inicia todos os servicos em modo desenvolvimento |
| `pnpm dev:api` | Inicia apenas o backend |
| `pnpm dev:ui` | Inicia apenas o frontend |
| `pnpm build` | Build de producao |
| `pnpm lint` | Executa ESLint |
| `pnpm lint:fix` | Corrige problemas de lint automaticamente |
| `pnpm typecheck` | Verifica tipos TypeScript |
| `pnpm test` | Executa testes unitarios |
| `pnpm test:e2e` | Executa testes E2E (Playwright) |
| `pnpm clean` | Limpa node_modules e dist |

## Fluxo de Uso Basico

### 1. Pesquisar Tendencias

Na pagina **Trends**, clique em "Pesquisar Agora" para buscar as ultimas tendencias tech de fontes como Dev.to, Hacker News e Reddit.

### 2. Curar Conteudo

Na pagina **Curated**, o agente Curador processa as tendencias e gera resumos com insights relevantes para seu publico.

### 3. Executar Pipeline

Na pagina **Pipeline**, inicie uma execucao completa que:
- Gera texto para Instagram e LinkedIn
- Cria carrosseis visuais
- Gera PDFs de conteudo
- Avalia a qualidade automaticamente

### 4. Revisar e Aprovar Posts

Na pagina **Posts**, revise os posts gerados:
- Visualize o texto para cada plataforma
- Confira o carrossel gerado
- Veja o score de qualidade
- Aprove ou rejeite cada post

### 5. Download de Assets

Para posts aprovados, faca download:
- Carrossel em formato ZIP
- PDF para distribuicao

## Stack Tecnologica

### Backend
- **Fastify** - Framework HTTP performatico
- **LangGraph.js** - Orquestracao de agentes
- **SQLite + Drizzle** - Persistencia
- **WebSocket** - Comunicacao em tempo real

### Frontend
- **Vite + React 18** - Build e UI
- **Tailwind CSS + shadcn/ui** - Styling
- **Zustand** - State management
- **TanStack Query** - Data fetching
- **Framer Motion** - Animacoes
- **PWA** - Suporte offline

### IA
- **Groq (Llama 3)** - LLM primario (free tier)
- **Google Gemini** - LLM fallback
- **Ideogram** - Geracao de imagens (free tier)
- **Leonardo.ai** - Imagens fallback

## Variaveis de Ambiente

| Variavel | Obrigatorio | Descricao |
|----------|-------------|-----------|
| `GROQ_API_KEY` | Sim | API key do Groq para LLM |
| `IDEOGRAM_API_KEY` | Sim | API key do Ideogram para imagens |
| `GOOGLE_AI_KEY` | Nao | API key do Google Gemini (fallback) |
| `LEONARDO_API_KEY` | Nao | API key do Leonardo.ai (fallback) |
| `DATABASE_URL` | Nao | URL do banco de dados (default: SQLite local) |
| `PORT` | Nao | Porta do backend (default: 3001) |
| `NODE_ENV` | Nao | Ambiente: development, production |

## Obtendo API Keys

### Groq (Obrigatorio)
1. Acesse [console.groq.com](https://console.groq.com)
2. Crie uma conta gratuita
3. Gere uma API key em Settings > API Keys

### Ideogram (Obrigatorio)
1. Acesse [ideogram.ai](https://ideogram.ai)
2. Crie uma conta
3. Gere uma API key em seu perfil

### Google Gemini (Opcional)
1. Acesse [makersuite.google.com](https://makersuite.google.com)
2. Crie uma API key

### Leonardo.ai (Opcional)
1. Acesse [leonardo.ai](https://leonardo.ai)
2. Crie uma conta
3. Obtenha sua API key

## Troubleshooting

### Erro: "Cannot connect to backend"

1. Verifique se o backend esta rodando:
   ```bash
   pnpm dev:api
   ```
2. Confirme que a porta 3001 esta livre
3. Verifique o console do terminal para erros

### Erro: "API key invalid"

1. Verifique se as API keys estao corretas no `.env`
2. Confirme que nao ha espacos extras
3. Reinicie o servidor apos alterar `.env`

### Erro: "Failed to generate images"

1. Verifique sua cota na API de imagens
2. Tente com o provider alternativo (Leonardo.ai)
3. Verifique a conexao com a internet

### Erro: "Database locked"

1. Pare todos os processos usando o banco:
   ```bash
   pnpm clean
   ```
2. Remova o arquivo `dev.db` e reinicie
3. O banco sera recriado automaticamente

### Performance lenta

1. Verifique se esta em modo desenvolvimento
2. Para producao, use:
   ```bash
   pnpm build
   pnpm preview
   ```
3. Habilite o Service Worker para cache

## Contribuindo

1. Crie uma branch: `git checkout -b feature/minha-feature`
2. Faca commits: `git commit -m 'feat: minha feature'`
3. Push: `git push origin feature/minha-feature`
4. Abra um Pull Request

### Convencoes de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nova funcionalidade
- `fix:` - Correcao de bug
- `docs:` - Documentacao
- `style:` - Formatacao
- `refactor:` - Refatoracao
- `test:` - Testes
- `chore:` - Tarefas de manutencao

## Documentacao Adicional

- [Brief do Projeto](docs/brief.md)
- [PRD](docs/prd.md)
- [Arquitetura](docs/architecture.md)
- [Especificacao de UI](docs/front-end-spec.md)
- [Stories](docs/stories/)

## Licenca

Projeto privado - uso pessoal.

---

Desenvolvido com AI by Synkra AIOS
