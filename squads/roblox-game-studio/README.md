# Roblox Game Studio Squad

Squad especializado em desenvolvimento de jogos para a plataforma Roblox.

## Agentes

| Agente | Comando | Especialidade |
|--------|---------|---------------|
| Lua Scripter | `@lua-scripter` | Scripts Lua, sistemas de jogo, otimização |
| Game Designer | `@game-designer` | Mecânicas, balanceamento, gameplay loops |
| UI/UX Designer | `@ui-ux-designer` | Interfaces, experiência do jogador, menus |
| Market Analyst | `@market-analyst` | Análise de mercado, tendências, competidores |
| Monetization Strategist | `@monetization-strategist` | Monetização ética, conversão, pricing |

## Quick Start

```bash
# Ativar um agente
@lua-scripter

# Comandos disponíveis
*create-script       # Criar novo script
*debug-script        # Debugar script existente
*optimize-script     # Otimizar performance

# Análise de mercado
@market-analyst
*market-overview     # Overview do mercado Roblox
*trend-report        # Tendências atuais
*analyze-genre       # Análise de gênero
```

## Workflows

### *idea-to-concept (Ideia para Conceito)

Workflow completo que transforma uma ideia bruta em conceito documentado:

```bash
*idea-to-concept
# ou
*new-game
*game-concept
```

**Fases:**
1. **Briefing** → Coleta informações da ideia
2. **Market Analysis** → @market-analyst valida e analisa mercado
3. **Monetization** → @monetization-strategist cria estratégia ética
4. **Game Design** → @game-designer cria GDD (alinhado com monetização)
5. **Architecture** → @lua-scripter propõe arquitetura técnica
6. **UI/UX Style** → @ui-ux-designer cria style guide visual

**Outputs:**
- `briefing.md` - Ideia documentada
- `market-analysis.md` - Análise de mercado e validação
- `monetization-strategy.md` - Estratégia de monetização ética
- `gdd.md` - Game Design Document completo
- `architecture.md` - Arquitetura técnica
- `ui-style-guide.md` - Guia de estilo visual

---

## Arquitetura Task-First

Este squad segue a arquitetura task-first do AIOS:

1. **Tasks** são o ponto de entrada principal
2. **Agentes** executam as tasks conforme sua especialidade
3. **Workflows** orquestram múltiplas tasks

## Estrutura

```
roblox-game-studio/
├── squad.yaml          # Manifesto do squad
├── agents/             # Definições de agentes
│   ├── lua-scripter.md
│   ├── game-designer.md
│   ├── ui-ux-designer.md
│   ├── market-analyst.md
│   └── monetization-strategist.md
├── tasks/              # Tasks executáveis
│   └── create-game-system.md
├── workflows/          # Workflows multi-step
│   └── idea-to-concept.md
├── templates/          # Templates de código
└── tools/              # Ferramentas customizadas
```

## Tecnologias

- **Linguagem:** Lua 5.1 (Luau)
- **Plataforma:** Roblox Studio
- **APIs:** Roblox Engine API, DataStore, RemoteEvents

## Uso

### Criar um sistema de jogo
```bash
@lua-scripter
*create-script combat-system
```

### Projetar mecânica
```bash
@game-designer
*design-mechanic inventory
```

### Criar interface
```bash
@ui-ux-designer
*create-ui main-menu
```

### Analisar mercado
```bash
@market-analyst
*analyze-genre horror
*validate-idea "Tower Defense com pets"
```

## Contribuindo

1. Siga os padrões de código Lua do Roblox
2. Documente todos os scripts
3. Teste no Roblox Studio antes de commitar
