# Social Content Agent — Front-End Specification

> Especificação de UI/UX para o sistema multi-agente de automação de conteúdo

---

## Introdução

Este documento define a especificação completa de front-end para o Social Content Agent, incluindo design system, componentes, fluxos de usuário, acessibilidade e padrões visuais. O objetivo é criar uma interface de **command center** que transmita transparência, controle e eficiência para desenvolvedores.

### Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2025-01-28 | 1.0 | Especificação inicial | Uma (UX Design Expert) |

---

## UX Goals & Principles

### Objetivos de Experiência

| Objetivo | Descrição | Métrica de Sucesso |
|----------|-----------|-------------------|
| **Transparência** | Usuário entende exatamente o que cada agente está fazendo | 90% dos usuários identificam agente ativo sem ajuda |
| **Eficiência** | Mínimo de cliques para obter posts prontos | ≤ 3 cliques para download de post aprovado |
| **Controle** | Aprovar/rejeitar outputs antes de considerar prontos | 100% dos posts passam por decisão explícita |
| **Confiança** | Sistema transmite profissionalismo e confiabilidade | Score de confiança > 8/10 em pesquisa |
| **Dev-friendly** | Visual que ressoa com desenvolvedores | 80% dos devs preferem ao Canva |

### Princípios de Design

#### 1. Show, Don't Tell

```
✅ Visualização do pipeline com agentes conectados
✅ Progress bar mostrando etapa atual
✅ Log em tempo real estilo terminal

❌ Texto genérico "Processando..."
❌ Spinner sem contexto
❌ Estimativas de tempo vagas
```

#### 2. Progressive Disclosure

```
Dashboard → Visão geral (métricas, status)
    └→ Posts → Lista com preview
         └→ Post Detail → Conteúdo completo + assets
              └→ Download → Seleção de formato
```

#### 3. Fail Gracefully

```
┌─────────────────────────────────────┐
│ ⚠️ Agente Curador falhou            │
│                                     │
│ O sistema tentará novamente em 5s   │
│ Usando provider alternativo...      │
│                                     │
│ [Ver detalhes] [Cancelar pipeline]  │
└─────────────────────────────────────┘
```

#### 4. Respect Developer Time

- Zero onboarding obrigatório
- Defaults inteligentes pré-configurados
- Keyboard shortcuts para ações frequentes
- Bulk actions para aprovar/rejeitar múltiplos posts

### Personas de Uso

#### Lucas (Dev Pleno - Primário)

- **Contexto:** Usa depois do trabalho, quer resultados rápidos
- **Expectativa:** Disparar pipeline, revisar em 5 min, baixar
- **Pain points:** Interfaces lentas, muitos cliques, falta de feedback

#### Ana (Tech Lead - Secundário)

- **Contexto:** Usa semanalmente para manter presença online
- **Expectativa:** Ver histórico, entender padrões, ajustar qualidade
- **Pain points:** Falta de métricas, impossibilidade de comparar

---

## Information Architecture

### Sitemap

```
Social Content Agent
│
├── / (Dashboard)
│   ├── Métricas agregadas
│   ├── Status do pipeline
│   ├── Posts recentes
│   └── Quick actions
│
├── /execution
│   ├── Pipeline visualization
│   ├── Agent status cards
│   ├── Log viewer
│   └── Cancel/pause controls
│
├── /posts
│   ├── Filtros (status, plataforma, data)
│   ├── Grid/List view toggle
│   ├── Bulk actions
│   └── Post cards
│
├── /posts/:id
│   ├── Texto (Instagram/LinkedIn)
│   ├── Carousel viewer
│   ├── PDF viewer
│   ├── Score breakdown
│   ├── Approve/Reject actions
│   └── Download options
│
├── /history
│   ├── Lista de execuções
│   ├── Gráficos de tendência
│   └── Export data
│
└── /settings
    ├── Fontes de tendências
    ├── Providers (LLM/Image)
    ├── Quality threshold
    ├── Templates de carrossel
    └── Branding (handle, cores)
```

### Navigation Structure

```
┌─────────────────────────────────────────────────────────────┐
│  ☰  Social Content Agent                    🔔 ⚙️ [Status] │
├─────────┬───────────────────────────────────────────────────┤
│         │                                                   │
│ 📊 Dash │                   CONTENT AREA                    │
│ ▶️ Exec │                                                   │
│ 📝 Posts│                                                   │
│ 📜 Hist │                                                   │
│ ⚙️ Set  │                                                   │
│         │                                                   │
│─────────│                                                   │
│         │                                                   │
│ [Nova   │                                                   │
│ Execução│                                                   │
│ ]       │                                                   │
│         │                                                   │
└─────────┴───────────────────────────────────────────────────┘
```

### Content Hierarchy

| Nível | Conteúdo | Ação Principal |
|-------|----------|----------------|
| **L1** | Dashboard metrics | Iniciar nova execução |
| **L2** | Posts list | Filtrar, aprovar em batch |
| **L3** | Post detail | Download, approve/reject |
| **L4** | Asset viewer | Download individual |

---

## User Flows

### Flow 1: Gerar Novos Posts

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Dashboard  │────▶│  Config     │────▶│  Execution  │
│             │     │  Modal      │     │  View       │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┘
                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Posts      │◀────│  Complete   │◀────│  Pipeline   │
│  List       │     │  Toast      │     │  Running    │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Detalhamento:**

1. **Dashboard** → Clica em "Nova Execução"
2. **Config Modal**:
   - Número de posts (1-5)
   - Plataformas (Instagram/LinkedIn/Ambos)
   - Incluir visual (checkbox)
   - Quality threshold (slider 1-10)
3. **Execution View**:
   - Pipeline com agentes
   - Logs em tempo real
   - Botão cancelar
4. **Complete Toast** → "5 posts gerados! Ver posts"
5. **Posts List** → Posts novos destacados

### Flow 2: Aprovar/Rejeitar Posts

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Posts      │────▶│  Post       │────▶│  Approve    │
│  List       │     │  Detail     │     │  Action     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┴──────────────────┐
                    │                                             │
                    ▼                                             ▼
           ┌─────────────┐                               ┌─────────────┐
           │  Move to    │                               │  Reject     │
           │  Approved   │                               │  Modal      │
           └─────────────┘                               └──────┬──────┘
                                                                │
                                              ┌─────────────────┴───────┐
                                              ▼                         ▼
                                       ┌───────────┐           ┌─────────────┐
                                       │  Archive  │           │  Regenerate │
                                       └───────────┘           └─────────────┘
```

### Flow 3: Download de Assets

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Post       │────▶│  Select     │────▶│  Download   │
│  Detail     │     │  Format     │     │  Initiated  │
└─────────────┘     └─────────────┘     └─────────────┘

Opções de download:
├── Imagem de fundo (PNG)
├── Carrossel completo (ZIP com PNGs)
├── Slide individual (PNG)
├── PDF para LinkedIn
├── Texto Instagram (TXT)
└── Texto LinkedIn (TXT)
```

### Flow 4: Configurar Sistema

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Settings   │────▶│  Edit       │────▶│  Save       │
│  Page       │     │  Section    │     │  Changes    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Toast:     │
                                        │  "Saved!"   │
                                        └─────────────┘
```

---

## Wireframes

### Dashboard (/)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ☰  Social Content Agent                      🔔 ⚙️ [● Conectado]   │
├────────┬────────────────────────────────────────────────────────────┤
│        │                                                            │
│ 📊     │  ┌──────────────────────────────────────────────────────┐  │
│ Dash   │  │                   MÉTRICAS DO DIA                    │  │
│        │  ├──────────┬──────────┬──────────┬──────────┬─────────┤  │
│ ▶️     │  │ Posts    │ Score    │ Tempo    │ Aprovação│ Pendente│  │
│ Exec   │  │   12     │  8.2/10  │  4:32    │   85%    │    3    │  │
│        │  └──────────┴──────────┴──────────┴──────────┴─────────┘  │
│ 📝     │                                                            │
│ Posts  │  ┌──────────────────────────────────────────────────────┐  │
│        │  │               PIPELINE STATUS                         │  │
│ 📜     │  │  ○ Idle                                              │  │
│ Hist   │  │                                                       │  │
│        │  │  ┌────────────────────────────────────────────────┐  │  │
│ ⚙️     │  │  │ Pesquisador → Tópicos → Curador → Redator →   │  │  │
│ Config │  │  │ → Imagem → Carrossel → PDF → QA               │  │  │
│        │  │  └────────────────────────────────────────────────┘  │  │
│────────│  │                                                       │  │
│        │  │  [▶️ Nova Execução]                                   │  │
│ [Nova  │  └──────────────────────────────────────────────────────┘  │
│ Exec]  │                                                            │
│        │  ┌──────────────────────────────────────────────────────┐  │
│        │  │               POSTS RECENTES                         │  │
│        │  ├──────────────────────────────────────────────────────┤  │
│        │  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │  │
│        │  │ │ [img]   │ │ [img]   │ │ [img]   │ │ [img]   │     │  │
│        │  │ │ React19 │ │ Node22  │ │ TypeScr │ │ TailCSS │     │  │
│        │  │ │ ⭐ 8.5  │ │ ⭐ 7.2  │ │ ⭐ 9.1  │ │ ⭐ 6.8  │     │  │
│        │  │ │ ✅ IG   │ │ ✅ LI   │ │ ✅ Both │ │ ⏳ Pend │     │  │
│        │  │ └─────────┘ └─────────┘ └─────────┘ └─────────┘     │  │
│        │  │                                  [Ver todos →]       │  │
│        │  └──────────────────────────────────────────────────────┘  │
│        │                                                            │
│        │  ┌──────────────────────────────────────────────────────┐  │
│        │  │               LOGS RECENTES                          │  │
│        │  ├──────────────────────────────────────────────────────┤  │
│        │  │ [14:32:01] Pipeline finalizado - 5 posts gerados     │  │
│        │  │ [14:31:48] QA: Score médio 8.2/10                    │  │
│        │  │ [14:29:15] Imagens geradas com Ideogram              │  │
│        │  │ [14:28:02] Usando Groq (Llama 3.1)                   │  │
│        │  └──────────────────────────────────────────────────────┘  │
└────────┴────────────────────────────────────────────────────────────┘
```

### Execution View (/execution)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ☰  Social Content Agent                      🔔 ⚙️ [● Pipeline]   │
├────────┬────────────────────────────────────────────────────────────┤
│        │                                                            │
│ 📊     │  Execução #exec-abc123                        [Cancelar]   │
│ Dash   │  Iniciada: 14:28:02 | Duração: 4:32                       │
│        │                                                            │
│ ▶️     │  ┌──────────────────────────────────────────────────────┐  │
│ Exec ● │  │               PIPELINE DE AGENTES                    │  │
│        │  ├──────────────────────────────────────────────────────┤  │
│ 📝     │  │                                                       │  │
│ Posts  │  │   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐             │  │
│        │  │   │ ✅  │──▶│ ✅  │──▶│ ✅  │──▶│ 🔄  │             │  │
│ 📜     │  │   │Pesq.│   │Tópi.│   │Cura.│   │Reda.│             │  │
│ Hist   │  │   │ 45s │   │ 12s │   │ 1:23│   │     │             │  │
│        │  │   └─────┘   └─────┘   └─────┘   └──┬──┘             │  │
│ ⚙️     │  │                                    │                 │  │
│ Config │  │   ┌─────┐   ┌─────┐   ┌─────┐   ┌──▼──┐             │  │
│        │  │   │ ⏳  │◀──│ ⏳  │◀──│ ⏳  │◀──│ ⏳  │             │  │
│────────│  │   │ QA  │   │ PDF │   │Carro│   │Imag.│             │  │
│        │  │   └─────┘   └─────┘   └─────┘   └─────┘             │  │
│        │  │                                                       │  │
│        │  │   ████████████████████░░░░░░░░░░  58%                │  │
│        │  │                                                       │  │
│        │  └──────────────────────────────────────────────────────┘  │
│        │                                                            │
│        │  ┌──────────────────────────────────────────────────────┐  │
│        │  │               AGENTE ATIVO: REDATOR                  │  │
│        │  ├──────────────────────────────────────────────────────┤  │
│        │  │ Provider: Groq (Llama 3.1)                           │  │
│        │  │ Tópico: "React 19 - O que muda para devs"            │  │
│        │  │ Gerando texto para: Instagram + LinkedIn              │  │
│        │  └──────────────────────────────────────────────────────┘  │
│        │                                                            │
│        │  ┌──────────────────────────────────────────────────────┐  │
│        │  │               LOG DE EXECUÇÃO                        │  │
│        │  ├──────────────────────────────────────────────────────┤  │
│        │  │ $ [14:32:01] redator: Iniciando geração...           │  │
│        │  │ $ [14:31:48] curador: 5 referências encontradas      │  │
│        │  │ $ [14:31:45] curador: Buscando artigos sobre React19 │  │
│        │  │ $ [14:31:30] topicos: Selecionado: React 19 Updates  │  │
│        │  │ $ [14:31:15] topicos: Analisando 23 tendências       │  │
│        │  │ $ [14:30:30] pesquisador: Dev.to: 12 trends          │  │
│        │  │ $ [14:30:15] pesquisador: HackerNews: 8 trends       │  │
│        │  │ $ [14:30:02] pipeline: Iniciando execução            │  │
│        │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │  │
│        │  └──────────────────────────────────────────────────────┘  │
└────────┴────────────────────────────────────────────────────────────┘
```

### Posts List (/posts)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ☰  Social Content Agent                      🔔 ⚙️ [● Conectado]   │
├────────┬────────────────────────────────────────────────────────────┤
│        │                                                            │
│ 📊     │  Posts Gerados                                            │
│ Dash   │                                                            │
│        │  ┌──────────────────────────────────────────────────────┐  │
│ ▶️     │  │ [Todos ▼] [Instagram] [LinkedIn]    🔍 Buscar...     │  │
│ Exec   │  │ [Pendentes: 3] [Aprovados] [Rejeitados]              │  │
│        │  │                                                       │  │
│ 📝     │  │ □ Selecionar todos    [✅ Aprovar] [❌ Rejeitar]     │  │
│ Posts ●│  └──────────────────────────────────────────────────────┘  │
│        │                                                            │
│ 📜     │  ┌──────────────────────────────────────────────────────┐  │
│ Hist   │  │                                                       │  │
│        │  │ □ ┌─────────────────────────────────────────────────┐│  │
│ ⚙️     │  │   │ ┌──────┐                                        ││  │
│ Config │  │   │ │[img] │  React 19 - O que muda para devs       ││  │
│        │  │   │ │      │  ⭐ 8.5/10 | 📸 Instagram | 🕐 Hoje     ││  │
│────────│  │   │ └──────┘                                        ││  │
│        │  │   │  "React 19 chegou e trouxe mudanças que vão..." ││  │
│        │  │   │                                                  ││  │
│        │  │   │  [Ver detalhes]     [✅ Aprovar] [❌ Rejeitar]  ││  │
│        │  │   └─────────────────────────────────────────────────┘│  │
│        │  │                                                       │  │
│        │  │ □ ┌─────────────────────────────────────────────────┐│  │
│        │  │   │ ┌──────┐                                        ││  │
│        │  │   │ │[img] │  Node.js 22 - Performance Boost        ││  │
│        │  │   │ │      │  ⭐ 7.2/10 | 💼 LinkedIn | 🕐 Hoje      ││  │
│        │  │   │ └──────┘                                        ││  │
│        │  │   │  "A nova versão do Node.js traz melhorias..."   ││  │
│        │  │   │                                                  ││  │
│        │  │   │  [Ver detalhes]     [✅ Aprovar] [❌ Rejeitar]  ││  │
│        │  │   └─────────────────────────────────────────────────┘│  │
│        │  │                                                       │  │
│        │  │ □ ┌─────────────────────────────────────────────────┐│  │
│        │  │   │ ┌──────┐                                        ││  │
│        │  │   │ │[img] │  TypeScript 5.4 - Novidades            ││  │
│        │  │   │ │      │  ⭐ 9.1/10 | 📸💼 Ambos | 🕐 Ontem     ││  │
│        │  │   │ └──────┘  ✅ Aprovado                           ││  │
│        │  │   │  "TypeScript continua evoluindo e a versão..."  ││  │
│        │  │   │                                                  ││  │
│        │  │   │  [Ver detalhes]     [📥 Download]               ││  │
│        │  │   └─────────────────────────────────────────────────┘│  │
│        │  │                                                       │  │
│        │  │                    [Carregar mais...]                │  │
│        │  └──────────────────────────────────────────────────────┘  │
└────────┴────────────────────────────────────────────────────────────┘
```

### Post Detail (/posts/:id)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ☰  Social Content Agent                      🔔 ⚙️ [● Conectado]   │
├────────┬────────────────────────────────────────────────────────────┤
│        │                                                            │
│ 📊     │  ← Voltar para Posts                                      │
│ Dash   │                                                            │
│        │  React 19 - O que muda para devs                          │
│ ▶️     │  ⭐ 8.5/10 | 📸 Instagram | ⏳ Pendente | 🕐 28 Jan 2025   │
│ Exec   │                                                            │
│        │  ┌───────────────────────┬──────────────────────────────┐  │
│ 📝     │  │     TEXTO DO POST     │      CARROSSEL PREVIEW       │  │
│ Posts ●│  ├───────────────────────┼──────────────────────────────┤  │
│        │  │                       │                              │  │
│ 📜     │  │  📸 Instagram         │  ┌────────────────────────┐ │  │
│ Hist   │  │  ─────────────────    │  │                        │ │  │
│        │  │                       │  │   ┌──────────────┐     │ │  │
│ ⚙️     │  │  React 19 chegou e    │  │   │              │     │ │  │
│ Config │  │  trouxe mudanças que  │  │   │   REACT 19   │     │ │  │
│        │  │  vão transformar a    │  │   │   O que      │     │ │  │
│────────│  │  forma como           │  │   │   muda?      │     │ │  │
│        │  │  desenvolvemos apps.  │  │   │              │     │ │  │
│        │  │                       │  │   └──────────────┘     │ │  │
│        │  │  Nesse post, vou      │  │                        │ │  │
│        │  │  compartilhar as 5    │  │   [◀] Slide 1/8 [▶]   │ │  │
│        │  │  principais           │  │                        │ │  │
│        │  │  novidades...         │  └────────────────────────┘ │  │
│        │  │                       │                              │  │
│        │  │  #react #javascript   │  [📥 Baixar Carrossel]      │  │
│        │  │  #frontend #dev       │  [📄 Baixar PDF]            │  │
│        │  │                       │  [🖼️ Baixar Imagem]         │  │
│        │  │  [📋 Copiar texto]    │                              │  │
│        │  │                       │                              │  │
│        │  │  1847 caracteres      │                              │  │
│        │  └───────────────────────┴──────────────────────────────┘  │
│        │                                                            │
│        │  ┌──────────────────────────────────────────────────────┐  │
│        │  │                 SCORE DE QUALIDADE                   │  │
│        │  ├──────────────────────────────────────────────────────┤  │
│        │  │  Overall: ⭐ 8.5/10                                   │  │
│        │  │                                                       │  │
│        │  │  Clareza        ████████░░  8.0                      │  │
│        │  │  Relevância     █████████░  9.0                      │  │
│        │  │  Engajamento    ████████░░  8.0                      │  │
│        │  │  Gramática      █████████░  9.0                      │  │
│        │  │  Visual         ████████░░  8.0                      │  │
│        │  │                                                       │  │
│        │  │  💡 Feedback: "Bom conteúdo técnico. Considere      │  │
│        │  │     adicionar um exemplo de código mais prático."    │  │
│        │  └──────────────────────────────────────────────────────┘  │
│        │                                                            │
│        │  ┌──────────────────────────────────────────────────────┐  │
│        │  │                                                       │  │
│        │  │  [✅ Aprovar Post]        [❌ Rejeitar]  [🔄 Regenerar]│  │
│        │  │                                                       │  │
│        │  └──────────────────────────────────────────────────────┘  │
└────────┴────────────────────────────────────────────────────────────┘
```

### Settings (/settings)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ☰  Social Content Agent                      🔔 ⚙️ [● Conectado]   │
├────────┬────────────────────────────────────────────────────────────┤
│        │                                                            │
│ 📊     │  Configurações                                            │
│ Dash   │                                                            │
│        │  ┌──────────────────────────────────────────────────────┐  │
│ ▶️     │  │  📡 FONTES DE TENDÊNCIAS                             │  │
│ Exec   │  ├──────────────────────────────────────────────────────┤  │
│        │  │                                                       │  │
│ 📝     │  │  [✓] Dev.to              Artigos e tutoriais         │  │
│ Posts  │  │  [✓] Hacker News         Notícias e discussões       │  │
│        │  │  [✓] Reddit r/programming  Comunidade tech           │  │
│ 📜     │  │  [ ] Twitter/X           Posts e threads (em breve)  │  │
│ Hist   │  │                                                       │  │
│        │  └──────────────────────────────────────────────────────┘  │
│ ⚙️     │                                                            │
│ Config●│  ┌──────────────────────────────────────────────────────┐  │
│        │  │  🤖 PROVIDERS DE LLM                                 │  │
│────────│  ├──────────────────────────────────────────────────────┤  │
│        │  │                                                       │  │
│        │  │  Primário:    [Groq (Llama 3.1) ▼]                   │  │
│        │  │  Fallback:    [Google Gemini ▼]                      │  │
│        │  │                                                       │  │
│        │  │  Status: ✅ Groq OK | ✅ Gemini OK                   │  │
│        │  └──────────────────────────────────────────────────────┘  │
│        │                                                            │
│        │  ┌──────────────────────────────────────────────────────┐  │
│        │  │  🎨 PROVIDERS DE IMAGEM                              │  │
│        │  ├──────────────────────────────────────────────────────┤  │
│        │  │                                                       │  │
│        │  │  Primário:    [Ideogram ▼]                           │  │
│        │  │  Fallback:    [Leonardo.ai ▼]                        │  │
│        │  │                                                       │  │
│        │  │  Status: ✅ Ideogram OK | ⚠️ Leonardo: 5 credits     │  │
│        │  └──────────────────────────────────────────────────────┘  │
│        │                                                            │
│        │  ┌──────────────────────────────────────────────────────┐  │
│        │  │  📊 QUALIDADE                                        │  │
│        │  ├──────────────────────────────────────────────────────┤  │
│        │  │                                                       │  │
│        │  │  Threshold mínimo: [═══════●═══] 6.0                 │  │
│        │  │                                                       │  │
│        │  │  [✓] Retry automático para posts < threshold         │  │
│        │  │  [ ] Auto-aprovar posts > 8.0                        │  │
│        │  └──────────────────────────────────────────────────────┘  │
│        │                                                            │
│        │  ┌──────────────────────────────────────────────────────┐  │
│        │  │  🎨 BRANDING                                         │  │
│        │  ├──────────────────────────────────────────────────────┤  │
│        │  │                                                       │  │
│        │  │  Handle: [@________]                                 │  │
│        │  │  Cor de destaque: [#6366F1] 🟣                       │  │
│        │  │                                                       │  │
│        │  │  [Editar templates de carrossel →]                   │  │
│        │  └──────────────────────────────────────────────────────┘  │
│        │                                                            │
│        │  [💾 Salvar Alterações]  [↺ Restaurar Padrões]            │
└────────┴────────────────────────────────────────────────────────────┘
```

---

## Component Library

### Design Tokens

```typescript
// packages/ui/src/lib/tokens.ts

export const tokens = {
  colors: {
    // Background
    background: {
      primary: '#0F0F12',      // Main background
      secondary: '#18181B',    // Cards, elevated surfaces
      tertiary: '#27272A',     // Hover states, borders
    },

    // Foreground
    foreground: {
      primary: '#FAFAFA',      // Primary text
      secondary: '#A1A1AA',    // Secondary text
      muted: '#71717A',        // Disabled, placeholder
    },

    // Brand
    brand: {
      primary: '#6366F1',      // Indigo - primary actions
      secondary: '#8B5CF6',    // Violet - accents
      gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    },

    // Semantic
    success: '#22C55E',        // Green - approved, success
    warning: '#F59E0B',        // Amber - warnings, pending
    error: '#EF4444',          // Red - errors, rejected
    info: '#3B82F6',           // Blue - info, links

    // Status
    status: {
      idle: '#71717A',
      running: '#6366F1',
      success: '#22C55E',
      error: '#EF4444',
    }
  },

  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, sans-serif',
      mono: 'JetBrains Mono, Fira Code, monospace',
    },
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
  },

  borderRadius: {
    none: '0',
    sm: '0.25rem',  // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem',   // 8px
    xl: '0.75rem',  // 12px
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    glow: '0 0 20px rgb(99 102 241 / 0.3)',
  },

  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },
};
```

### Core Components

#### Button

```tsx
// packages/ui/src/components/ui/button.tsx

interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

// Visual States:
// - Default: Brand primary bg
// - Hover: Lighter shade + subtle glow
// - Active: Darker shade
// - Disabled: Muted colors, no pointer
// - Loading: Spinner replaces content
```

**Variantes:**

| Variante | Uso | Visual |
|----------|-----|--------|
| `primary` | Ação principal | Bg indigo, text white |
| `secondary` | Ação secundária | Bg transparent, border indigo |
| `ghost` | Ação terciária | Bg transparent, text indigo |
| `danger` | Ação destrutiva | Bg red, text white |

#### Card

```tsx
// packages/ui/src/components/ui/card.tsx

interface CardProps {
  variant: 'default' | 'interactive' | 'highlight';
  padding?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

// Visual:
// - Background: secondary
// - Border: 1px tertiary
// - Border radius: lg
// - Interactive: hover scale 1.01 + shadow
```

#### Badge

```tsx
// packages/ui/src/components/ui/badge.tsx

interface BadgeProps {
  variant: 'default' | 'success' | 'warning' | 'error' | 'info';
  size: 'sm' | 'md';
  children: ReactNode;
}

// Uso: Status de posts, indicadores, tags
```

#### Score Indicator

```tsx
// packages/ui/src/components/metrics/ScoreIndicator.tsx

interface ScoreIndicatorProps {
  score: number;        // 0-10
  size: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

// Visual:
// - Circular progress ring
// - Color: red < 5 < amber < 7 < green
// - Number no centro
// - Label "Score" abaixo (opcional)
```

### Domain Components

#### Post Card

```tsx
// packages/ui/src/components/posts/PostCard.tsx

interface PostCardProps {
  post: Post;
  onApprove?: () => void;
  onReject?: () => void;
  onView?: () => void;
  selectable?: boolean;
  selected?: boolean;
}

// Layout:
// ┌─────────────────────────────────────┐
// │ □ ┌──────┐ Título do Post           │
// │   │[img] │ ⭐ 8.5 | 📸 IG | ⏳ Pend │
// │   └──────┘                          │
// │   "Preview do texto do post..."     │
// │                                     │
// │   [Ver] [✅ Aprovar] [❌ Rejeitar]  │
// └─────────────────────────────────────┘
```

#### Agent Node

```tsx
// packages/ui/src/components/pipeline/AgentNode.tsx

interface AgentNodeProps {
  agent: {
    id: string;
    name: string;
    status: AgentStatus;
    duration?: number;
    progress?: number;
  };
  isActive?: boolean;
}

// Visual States:
// - idle:    Gray icon, no animation
// - running: Pulsing border, spinner
// - success: Green checkmark
// - error:   Red X, shake animation
```

#### Pipeline Visualization

```tsx
// packages/ui/src/components/pipeline/PipelineVisualization.tsx

interface PipelineVisualizationProps {
  agents: Agent[];
  currentAgent?: string;
  orientation?: 'horizontal' | 'vertical';
}

// Layout horizontal:
// ┌───┐   ┌───┐   ┌───┐   ┌───┐
// │ ✅ │──▶│ ✅ │──▶│ 🔄 │──▶│ ⏳ │
// └───┘   └───┘   └───┘   └───┘
//  Pesq.   Tóp.    Cur.    Red.

// Connector: linha com animação de fluxo quando running
```

#### Log Viewer

```tsx
// packages/ui/src/components/pipeline/LogViewer.tsx

interface LogViewerProps {
  logs: LogEntry[];
  maxHeight?: number;
  autoScroll?: boolean;
}

// Visual:
// - Font monospace
// - Background mais escuro
// - Timestamp em cor muted
// - Log level com cor (info=blue, warn=amber, error=red)
// - Auto-scroll para bottom
```

#### Carousel Viewer

```tsx
// packages/ui/src/components/posts/CarouselViewer.tsx

interface CarouselViewerProps {
  slides: Asset[];
  initialSlide?: number;
  onDownload?: (slide: Asset) => void;
  onDownloadAll?: () => void;
}

// Layout:
// ┌────────────────────────────────┐
// │                                │
// │     ┌──────────────────┐       │
// │ ◀   │    [SLIDE IMG]   │   ▶   │
// │     └──────────────────┘       │
// │                                │
// │        ● ○ ○ ○ ○ ○ ○ ○         │
// │      Slide 1 de 8              │
// │                                │
// │ [📥 Este slide] [📦 Todos ZIP]│
// └────────────────────────────────┘
```

#### Metrics Card

```tsx
// packages/ui/src/components/metrics/MetricsCard.tsx

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: ReactNode;
}

// Layout:
// ┌──────────────────┐
// │ 📊               │
// │ Posts Hoje       │
// │ 12               │
// │ ↑ +3 vs ontem    │
// └──────────────────┘
```

---

## Branding & Style Guide

### Color Palette

```
PRIMARY PALETTE
═══════════════════════════════════════════════════════════════

Background
┌────────────┬────────────┬────────────┐
│ #0F0F12    │ #18181B    │ #27272A    │
│ Primary    │ Secondary  │ Tertiary   │
│ Main bg    │ Cards      │ Hover      │
└────────────┴────────────┴────────────┘

Foreground
┌────────────┬────────────┬────────────┐
│ #FAFAFA    │ #A1A1AA    │ #71717A    │
│ Primary    │ Secondary  │ Muted      │
│ Headings   │ Body text  │ Disabled   │
└────────────┴────────────┴────────────┘

Brand
┌────────────┬────────────┐
│ #6366F1    │ #8B5CF6    │
│ Indigo     │ Violet     │
│ Primary    │ Accent     │
└────────────┴────────────┘

Semantic
┌────────────┬────────────┬────────────┬────────────┐
│ #22C55E    │ #F59E0B    │ #EF4444    │ #3B82F6    │
│ Success    │ Warning    │ Error      │ Info       │
│ Green      │ Amber      │ Red        │ Blue       │
└────────────┴────────────┴────────────┴────────────┘
```

### Typography Scale

```
TYPOGRAPHY
═══════════════════════════════════════════════════════════════

Font Families:
- Sans: Inter (headings, UI)
- Mono: JetBrains Mono (code, logs)

Scale:
┌───────────┬────────┬────────────────────────────────────┐
│ Token     │ Size   │ Usage                              │
├───────────┼────────┼────────────────────────────────────┤
│ 3xl       │ 30px   │ Page titles                        │
│ 2xl       │ 24px   │ Section headings                   │
│ xl        │ 20px   │ Card titles                        │
│ lg        │ 18px   │ Emphasized text                    │
│ base      │ 16px   │ Body text, buttons                 │
│ sm        │ 14px   │ Secondary text, labels             │
│ xs        │ 12px   │ Captions, timestamps               │
└───────────┴────────┴────────────────────────────────────┘

Weights:
- Normal (400): Body text
- Medium (500): Labels, buttons
- Semibold (600): Headings, emphasis
- Bold (700): Page titles
```

### Iconography

```
ICONS
═══════════════════════════════════════════════════════════════

Library: Lucide React
Style: Stroke width 1.5-2px, rounded corners

Navigation:
- LayoutDashboard → Dashboard
- Play → Execution
- FileText → Posts
- History → History
- Settings → Settings

Actions:
- Check → Approve
- X → Reject/Close
- Download → Download
- RefreshCw → Regenerate
- Copy → Copy text

Status:
- CheckCircle2 → Success
- AlertCircle → Warning
- XCircle → Error
- Loader2 → Loading (animated)

Platform:
- Instagram → Instagram
- Linkedin → LinkedIn
```

### Component Examples

```
VISUAL EXAMPLES
═══════════════════════════════════════════════════════════════

Primary Button:
┌─────────────────────┐
│   Nova Execução     │  ← bg: #6366F1, text: white
└─────────────────────┘    border-radius: 8px, padding: 12px 24px

Secondary Button:
┌─────────────────────┐
│   Cancelar          │  ← bg: transparent, border: #6366F1
└─────────────────────┘    text: #6366F1

Post Card:
┌─────────────────────────────────────────────────┐
│                                                 │  ← bg: #18181B
│  React 19 - O que muda                          │    border: 1px #27272A
│  ⭐ 8.5/10 | 📸 Instagram | ⏳ Pendente         │    border-radius: 12px
│                                                 │
│  "React 19 chegou e trouxe mudanças..."         │
│                                                 │
│  [Ver detalhes] [✅ Aprovar] [❌ Rejeitar]      │
│                                                 │
└─────────────────────────────────────────────────┘

Score Badge:
┌──────┐
│ 8.5  │  ← bg: #22C55E (green for >7)
└──────┘    text: white, font: semibold
```

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

| Critério | Requisito | Implementação |
|----------|-----------|---------------|
| **1.1.1** | Text Alternatives | Alt text em todas as imagens |
| **1.3.1** | Info and Relationships | Semantic HTML (header, nav, main) |
| **1.4.3** | Contrast (Minimum) | 4.5:1 para texto normal |
| **1.4.11** | Non-text Contrast | 3:1 para componentes UI |
| **2.1.1** | Keyboard | Tudo acessível via teclado |
| **2.4.1** | Bypass Blocks | Skip to main content link |
| **2.4.4** | Link Purpose | Links descritivos |
| **2.4.7** | Focus Visible | Focus ring em todos os elementos |
| **3.2.1** | On Focus | Sem mudanças inesperadas |
| **4.1.2** | Name, Role, Value | ARIA labels em componentes |

### Keyboard Navigation

```
KEYBOARD SHORTCUTS
═══════════════════════════════════════════════════════════════

Global:
┌─────────┬─────────────────────────────────────┐
│ Key     │ Action                              │
├─────────┼─────────────────────────────────────┤
│ /       │ Focus search                        │
│ G + D   │ Go to Dashboard                     │
│ G + E   │ Go to Execution                     │
│ G + P   │ Go to Posts                         │
│ G + H   │ Go to History                       │
│ G + S   │ Go to Settings                      │
│ N       │ New Execution (when available)      │
│ ?       │ Show keyboard shortcuts             │
└─────────┴─────────────────────────────────────┘

Posts List:
┌─────────┬─────────────────────────────────────┐
│ J / K   │ Navigate up/down                    │
│ Enter   │ Open selected post                  │
│ A       │ Approve selected                    │
│ R       │ Reject selected                     │
│ Space   │ Toggle selection                    │
│ Shift+A │ Approve all selected                │
└─────────┴─────────────────────────────────────┘

Post Detail:
┌─────────┬─────────────────────────────────────┐
│ ← / →   │ Previous/Next carousel slide        │
│ A       │ Approve post                        │
│ R       │ Reject post                         │
│ D       │ Download assets                     │
│ C       │ Copy text                           │
│ Esc     │ Go back to list                     │
└─────────┴─────────────────────────────────────┘
```

### Focus Management

```tsx
// Focus ring style (Tailwind)
const focusRing = `
  focus:outline-none
  focus-visible:ring-2
  focus-visible:ring-indigo-500
  focus-visible:ring-offset-2
  focus-visible:ring-offset-background
`;

// Focus trap for modals
// Using @radix-ui/react-focus-scope or similar
```

### Screen Reader Support

```tsx
// Announce status changes
<div role="status" aria-live="polite" className="sr-only">
  {pipelineStatus === 'running' && 'Pipeline em execução'}
  {pipelineStatus === 'completed' && 'Pipeline concluído'}
</div>

// Accessible labels
<button aria-label="Aprovar post sobre React 19">
  <CheckIcon />
</button>

// Progress announcements
<div
  role="progressbar"
  aria-valuenow={58}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Progresso do pipeline: 58%"
/>
```

---

## Responsiveness Strategy

### Breakpoints

```typescript
// packages/ui/src/lib/breakpoints.ts

export const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape / Small desktop
  xl: '1280px',  // Desktop
  '2xl': '1536px', // Large desktop
};

// Tailwind config
// sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
```

### Layout Adaptations

#### Desktop (≥1024px)

```
┌────────────────────────────────────────────────────────────┐
│  Header                                                    │
├────────┬───────────────────────────────────────────────────┤
│        │                                                   │
│ Side   │                                                   │
│ bar    │              Content Area                         │
│        │                                                   │
│ (240px)│              (flex-1)                             │
│        │                                                   │
└────────┴───────────────────────────────────────────────────┘
```

#### Tablet (768px - 1023px)

```
┌────────────────────────────────────────────────────────────┐
│  Header                               [☰ Menu]             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                                                            │
│                    Content Area                            │
│                    (full width)                            │
│                                                            │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  Bottom Nav:  [📊] [▶️] [📝] [📜] [⚙️]                     │
└────────────────────────────────────────────────────────────┘
```

#### Mobile (<768px)

```
┌───────────────────────┐
│  Header    [☰]        │
├───────────────────────┤
│                       │
│                       │
│    Content Area       │
│    (full width)       │
│    (simplified)       │
│                       │
│                       │
├───────────────────────┤
│ [📊][▶️][📝][📜][⚙️]  │
└───────────────────────┘
```

### Component Responsiveness

| Componente | Desktop | Tablet | Mobile |
|------------|---------|--------|--------|
| Sidebar | Fixed 240px | Hidden (bottom nav) | Hidden (bottom nav) |
| Metrics Grid | 5 columns | 3 columns | 2 columns |
| Post Cards | Grid 3 cols | Grid 2 cols | Stack 1 col |
| Pipeline View | Horizontal | Horizontal (scroll) | Vertical |
| Carousel Viewer | Side-by-side text | Tabs | Tabs |
| Log Viewer | 300px height | 200px height | Collapsed (expand) |

### Touch Considerations

```tsx
// Minimum touch target: 44x44px
const touchTarget = 'min-h-11 min-w-11';

// Swipe gestures for carousel
// Using react-swipeable or similar

// Pull to refresh on mobile
// Using @tanstack/react-virtual or similar
```

---

## Animation & Micro-interactions

### Animation Principles

1. **Purpose over decoration** - Animações devem comunicar status ou guiar atenção
2. **Respect user preferences** - Respeitar `prefers-reduced-motion`
3. **Keep it snappy** - Animações < 300ms para UI, < 500ms para transições

### Animation Library

```typescript
// Using Framer Motion for complex animations
// CSS transitions for simple state changes

// Reduced motion support
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;
```

### Transition Definitions

```typescript
// packages/ui/src/lib/animations.ts

export const transitions = {
  // Entrances
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },

  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.2 },
  },

  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.15 },
  },

  // Status changes
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: { duration: 0.3 },
    },
  },

  shake: {
    animate: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.4 },
    },
  },
};
```

### Specific Animations

#### Pipeline Agent Status

```typescript
// Agent node animations
const agentVariants = {
  idle: {
    borderColor: '#71717A',
    scale: 1,
  },
  running: {
    borderColor: ['#6366F1', '#8B5CF6', '#6366F1'],
    scale: 1,
    transition: {
      borderColor: { repeat: Infinity, duration: 1.5 },
    },
  },
  success: {
    borderColor: '#22C55E',
    scale: [1, 1.1, 1],
    transition: { scale: { duration: 0.3 } },
  },
  error: {
    borderColor: '#EF4444',
    x: [0, -5, 5, -5, 5, 0],
    transition: { x: { duration: 0.4 } },
  },
};
```

#### Progress Bar

```css
/* Animated progress bar */
.progress-bar {
  background: linear-gradient(
    90deg,
    #6366F1 0%,
    #8B5CF6 50%,
    #6366F1 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

#### Toast Notifications

```typescript
// Toast entrance from bottom-right
const toastVariants = {
  initial: { opacity: 0, y: 50, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
};
```

#### Loading States

```typescript
// Skeleton loader
const skeletonPulse = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'easeInOut',
    },
  },
};

// Spinner
const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      duration: 1,
      ease: 'linear',
    },
  },
};
```

#### Hover States

```css
/* Interactive card hover */
.card-interactive {
  transition: transform 150ms ease, box-shadow 150ms ease;
}

.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

/* Button hover glow */
.btn-primary:hover {
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
}
```

### Reduced Motion

```tsx
// Framer Motion respects prefers-reduced-motion by default

// For CSS, use media query
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Implementation Checklist

### Phase 1: Foundation

- [ ] Setup Tailwind CSS com tokens customizados
- [ ] Configurar shadcn/ui com tema dark
- [ ] Implementar Layout base (Sidebar, Header)
- [ ] Criar componentes core (Button, Card, Badge)
- [ ] Configurar roteamento com React Router

### Phase 2: Core Components

- [ ] MetricsCard
- [ ] PostCard
- [ ] ScoreIndicator
- [ ] LogViewer
- [ ] CarouselViewer

### Phase 3: Pipeline

- [ ] AgentNode
- [ ] PipelineVisualization
- [ ] WebSocket integration
- [ ] Real-time updates

### Phase 4: Pages

- [ ] Dashboard
- [ ] Execution View
- [ ] Posts List
- [ ] Post Detail
- [ ] History
- [ ] Settings

### Phase 5: Polish

- [ ] Animações e transições
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Keyboard navigation
- [ ] Accessibility audit

---

## Checklist de Validação

| # | Item | Status |
|---|------|--------|
| 1 | UX Goals definidos | ✅ |
| 2 | Information Architecture completa | ✅ |
| 3 | User Flows documentados | ✅ |
| 4 | Wireframes de todas as telas | ✅ |
| 5 | Design tokens definidos | ✅ |
| 6 | Component library especificada | ✅ |
| 7 | Branding & Style Guide completo | ✅ |
| 8 | Acessibilidade WCAG AA | ✅ |
| 9 | Responsiveness strategy | ✅ |
| 10 | Animations definidas | ✅ |
| 11 | Keyboard shortcuts documentados | ✅ |
| 12 | Implementation checklist | ✅ |

---

## Next Steps

### Handoff para Desenvolvimento

```
Este documento de especificação de front-end está pronto para implementação.

Próximos passos recomendados:
1. @dev - Iniciar setup do frontend (Story 1.3)
2. Implementar design tokens no Tailwind
3. Configurar shadcn/ui com customizações

Documentos de referência:
- docs/brief.md - Contexto do projeto
- docs/prd.md - Requisitos e stories
- docs/architecture.md - Arquitetura técnica
- docs/front-end-spec.md - Este documento
```

---

*Documento gerado com auxílio da Uma (UX Design Expert Agent) — Synkra AIOS*
