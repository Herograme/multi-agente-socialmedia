---
workflow: Idea to Concept
name: idea-to-concept
description: Workflow completo para transformar uma ideia em conceito de game documentado
trigger: "*idea-to-concept"
aliases: ["*new-game", "*game-concept", "*concept"]
elicit: true
agents:
  - market-analyst
  - monetization-strategist
  - game-designer
  - lua-scripter
  - ui-ux-designer
outputs:
  - briefing.md
  - market-analysis.md
  - monetization-strategy.md
  - gdd.md
  - architecture.md
  - ui-style-guide.md
estimated_phases: 6
---

# *idea-to-concept

Workflow completo para transformar uma ideia bruta em um conceito de game documentado, utilizando todos os agentes do squad em sequência.

## Overview do Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        IDEA TO CONCEPT WORKFLOW                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FASE 1: BRIEFING                                                       │
│  ┌─────────────┐                                                        │
│  │   Usuário   │ ──→ Coleta de informações da ideia                     │
│  └─────────────┘                                                        │
│         │                                                               │
│         ▼                                                               │
│  FASE 2: MARKET ANALYSIS                                                │
│  ┌─────────────┐                                                        │
│  │ 📊 Prism    │ ──→ Análise de mercado, tendências, validação          │
│  └─────────────┘                                                        │
│         │                                                               │
│         ▼                                                               │
│  FASE 3: MONETIZATION STRATEGY                                          │
│  ┌─────────────┐                                                        │
│  │ 💰 Coin     │ ──→ Estratégia de monetização ética                    │
│  └─────────────┘     Pricing, conversão, Game Passes                    │
│         │                                                               │
│         ▼                                                               │
│  FASE 4: GAME DESIGN (em colaboração com 💰)                            │
│  ┌─────────────┐                                                        │
│  │ 🎮 Mecha    │ ──→ GDD completo com mecânicas e loops                 │
│  └─────────────┘     Alinhado com monetização ética                     │
│         │                                                               │
│         ▼                                                               │
│  FASE 5: ARCHITECTURE                                                   │
│  ┌─────────────┐                                                        │
│  │ ⚡ Luau     │ ──→ Arquitetura técnica e sistemas                     │
│  └─────────────┘                                                        │
│         │                                                               │
│         ▼                                                               │
│  FASE 6: UI/UX STYLE                                                    │
│  ┌─────────────┐                                                        │
│  │ 🎨 Pixel    │ ──→ Style guide e direção visual                       │
│  └─────────────┘                                                        │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    📦 CONCEPT PACKAGE                            │    │
│  │  briefing.md | market-analysis.md | monetization-strategy.md    │    │
│  │  gdd.md | architecture.md | ui-style-guide.md                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## FASE 1: BRIEFING DA IDEIA

### Objetivo
Coletar todas as informações necessárias sobre a ideia do usuário.

### Elicitação

```yaml
elicit: true
questions:
  - id: game_name
    question: "Qual o nome (ou nome provisório) do seu game?"
    type: text
    required: true

  - id: one_liner
    question: "Descreva seu game em UMA frase (elevator pitch):"
    type: text
    required: true
    example: "Um simulador de fazenda com pets que evoluem e batalham"

  - id: genre
    question: "Qual o gênero principal?"
    type: select
    options:
      - Simulator
      - Tycoon
      - RPG/Adventure
      - Horror
      - Roleplay
      - FPS/Combat
      - Obby/Parkour
      - Racing
      - Puzzle
      - Social/Hangout
      - Hybrid (especificar)
    required: true

  - id: secondary_genre
    question: "Tem algum gênero secundário? (opcional)"
    type: select
    options:
      - Nenhum
      - Simulator
      - Tycoon
      - RPG
      - Horror
      - PvP
      - Social
      - Collection
      - Building

  - id: target_age
    question: "Qual a idade principal do público-alvo?"
    type: select
    options:
      - "Crianças (< 13 anos)"
      - "Adolescentes (13-17 anos)"
      - "Jovens adultos (17-24 anos)"
      - "Todos (all ages)"
    required: true

  - id: inspiration
    question: "Quais jogos te inspiraram? (no Roblox ou fora)"
    type: text
    example: "Adopt Me, Stardew Valley, Pokemon"

  - id: unique_feature
    question: "O que vai fazer seu game ser DIFERENTE dos outros?"
    type: text
    required: true

  - id: core_loop
    question: "Descreva o que o jogador FAZ repetidamente (core loop):"
    type: text
    example: "Planta sementes → Colhe → Vende → Compra upgrades → Repete"

  - id: monetization
    question: "Como pretende monetizar?"
    type: multiselect
    options:
      - Game Passes (compra única)
      - Dev Products (consumíveis)
      - Premium Payouts
      - Cosméticos/Skins
      - Ainda não decidi

  - id: team_size
    question: "Tamanho do time de desenvolvimento?"
    type: select
    options:
      - "Solo (1 pessoa)"
      - "Pequeno (2-3 pessoas)"
      - "Médio (4-6 pessoas)"
      - "Grande (7+ pessoas)"

  - id: timeline
    question: "Prazo esperado para lançamento?"
    type: select
    options:
      - "1-2 meses"
      - "3-4 meses"
      - "5-6 meses"
      - "6+ meses"
      - "Sem prazo definido"

  - id: additional_info
    question: "Algo mais que queira adicionar sobre sua ideia?"
    type: text
    required: false
```

### Output: briefing.md

```markdown
# Game Briefing: {game_name}

## Conceito
**One-liner:** {one_liner}
**Gênero:** {genre} {secondary_genre ? "+ " + secondary_genre : ""}
**Target:** {target_age}

## Inspirações
{inspiration}

## Diferencial (USP)
{unique_feature}

## Core Loop
{core_loop}

## Monetização Planejada
{monetization}

## Time & Timeline
- **Tamanho do time:** {team_size}
- **Prazo esperado:** {timeline}

## Notas Adicionais
{additional_info}

---
*Briefing gerado em {date} via workflow idea-to-concept*
```

---

## FASE 2: MARKET ANALYSIS

### Agente: @market-analyst (Prism) 📊

### Objetivo
Analisar o mercado, validar a ideia e identificar oportunidades/riscos.

### Prompt para o Agente

```
Com base no briefing coletado:
- Game: {game_name}
- Gênero: {genre}
- Diferencial: {unique_feature}

Execute as seguintes análises:

1. **Análise de Gênero**
   - Tamanho do mercado (CCU médio, revenue estimado)
   - Top 5 competidores diretos
   - Tendência (crescendo/estável/declinando)

2. **Validação da Ideia**
   - Score de viabilidade (1-10)
   - Gaps de mercado identificados
   - Alinhamento com trends 2025

3. **Análise Competitiva**
   - O que os competidores fazem bem
   - O que está faltando no mercado
   - Como o diferencial proposto se compara

4. **SWOT da Ideia**
   - Strengths, Weaknesses, Opportunities, Threats

5. **Recomendações**
   - Ajustes sugeridos no conceito
   - Oportunidades de diferenciação
   - Riscos a mitigar

6. **Veredicto**
   - 🟢 GO / 🟡 PIVOT / 🔴 NO-GO
   - Justificativa
```

### Output: market-analysis.md

```markdown
# Análise de Mercado: {game_name}

## Executive Summary
[2-3 parágrafos com principais findings]

## 1. Análise do Gênero: {genre}

### Tamanho do Mercado
| Métrica | Valor |
|---------|-------|
| CCU Médio do Gênero | X |
| Revenue Estimado | $Y |
| Número de Competidores | Z |
| Tendência | 📈/📊/📉 |

### Top 5 Competidores
| Game | CCU | Visits | Like% | Diferencial |
|------|-----|--------|-------|-------------|
| 1. | | | | |
| 2. | | | | |
| 3. | | | | |
| 4. | | | | |
| 5. | | | | |

## 2. Validação da Ideia

### Score de Viabilidade: X/10

| Critério | Score | Comentário |
|----------|-------|------------|
| Demanda de Mercado | /10 | |
| Nível de Competição | /10 | |
| Diferenciação | /10 | |
| Viabilidade Técnica | /10 | |
| Potencial de Revenue | /10 | |

### Alinhamento com Trends 2025
- ✅ Trend 1: [como se alinha]
- ✅ Trend 2: [como se alinha]
- ⚠️ Trend 3: [atenção necessária]

## 3. Análise Competitiva

### O que competidores fazem bem:
1. [Ponto forte 1]
2. [Ponto forte 2]
3. [Ponto forte 3]

### Gaps no mercado (oportunidades):
1. [Gap 1] → Oportunidade: [descrição]
2. [Gap 2] → Oportunidade: [descrição]
3. [Gap 3] → Oportunidade: [descrição]

### Análise do Diferencial Proposto
- **Diferencial:** {unique_feature}
- **Originalidade:** [Alta/Média/Baixa]
- **Defensabilidade:** [Fácil/Médio/Difícil de copiar]
- **Apelo para o target:** [Forte/Médio/Fraco]

## 4. SWOT

### Strengths (Forças)
- [S1]
- [S2]

### Weaknesses (Fraquezas)
- [W1]
- [W2]

### Opportunities (Oportunidades)
- [O1]
- [O2]

### Threats (Ameaças)
- [T1]
- [T2]

## 5. Recomendações

### Ajustes Sugeridos no Conceito
1. [Recomendação 1]
2. [Recomendação 2]

### Oportunidades de Diferenciação Adicional
1. [Oportunidade 1]
2. [Oportunidade 2]

### Riscos a Mitigar
| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| | | | |

## 6. Veredicto

### 🟢 GO / 🟡 PIVOT / 🔴 NO-GO

**Justificativa:**
[Explicação detalhada do veredicto]

**Próximos passos recomendados:**
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

---
*Análise realizada por @market-analyst (Prism) em {date}*
```

### Checkpoint
```
Antes de prosseguir para a Fase 3:
- [ ] Usuário revisou a análise de mercado
- [ ] Veredicto é GO ou PIVOT aceito
- [ ] Ajustes no conceito foram discutidos (se necessário)
```

---

## FASE 3: MONETIZATION STRATEGY

### Agente: @monetization-strategist (Coin) 💰

### Objetivo
Criar estratégia de monetização ética ANTES do GDD, para que o Game Designer já trabalhe com essas diretrizes.

### Prompt para o Agente

```
Com base no briefing e análise de mercado:
- Game: {game_name}
- Gênero: {genre}
- Target: {target_age}
- Monetização preferida: {monetization_preference}
- Revenue benchmarks do gênero: {market_revenue_data}

Desenvolva a estratégia de monetização:

1. **Filosofia de Monetização**
   - Definir princípios éticos
   - Estabelecer o que NUNCA faremos (P2W, etc.)
   - Alinhar com valores do game

2. **Estrutura de Ofertas**
   - Game Passes planejados
   - Dev Products planejados
   - Battle Pass (se aplicável)
   - Premium Payouts strategy

3. **Pricing Strategy**
   - Tiers de preço
   - Justificativa de cada preço
   - Comparação com competidores

4. **Métricas Target**
   - Conversion rate esperado
   - ARPU/ARPPU target
   - Revenue projection

5. **Diretrizes para Game Design**
   - O que pode ser monetizado
   - O que DEVE ser grátis
   - Como progressão interage com monetização
   - Regras de balanceamento

6. **Ethical Review**
   - Checklist de ética
   - Potenciais problemas
   - Mitigações

Para cada decisão, apresente opções ao usuário.
```

### Elicitação Interativa

```
💰 COIN: Vamos definir a filosofia de monetização para {game_name}.

Com base no target ({target_age}) e gênero ({genre}), recomendo:

1. 🎨 COSMÉTICO PURO
   - Apenas skins, pets visuais, efeitos
   - Zero impacto no gameplay
   - Ideal para: jogos competitivos, PvP
   - Conversion esperado: 2-3%

2. ⚡ CONVENIÊNCIA + COSMÉTICO
   - Cosméticos + aceleradores opcionais
   - Tudo grindável sem pagar
   - Ideal para: simulators, tycoons
   - Conversion esperado: 3-5%

3. 📦 BATTLE PASS + COSMÉTICO
   - Season Pass com free/premium track
   - Cosméticos exclusivos sazonais
   - Ideal para: jogos com updates regulares
   - Conversion esperado: 4-6%

4. 🎯 HÍBRIDO BALANCEADO
   - Mix de todas as opções
   - Customizado para o jogo
   - Ideal para: jogos complexos
   - Conversion esperado: 3-5%

Qual modelo se alinha com sua visão?
```

### Output: monetization-strategy.md

```markdown
# Monetization Strategy: {game_name}

## 1. Filosofia

### Princípios Éticos
1. **{princípio_1}** - [descrição]
2. **{princípio_2}** - [descrição]
3. **{princípio_3}** - [descrição]

### O Que NUNCA Faremos
- ❌ [Item 1 - ex: Vender vantagem competitiva]
- ❌ [Item 2 - ex: Paywalls em conteúdo core]
- ❌ [Item 3 - ex: FOMO predatório]

### Modelo Escolhido
**{modelo}** - [justificativa]

---

## 2. Game Passes

| Pass | Preço | Benefício | Tier | Justificativa |
|------|-------|-----------|------|---------------|
| | R$ | | | |

### Detalhamento
[Para cada pass:]

#### {Pass Name}
- **Preço:** X Robux
- **O que dá:** [lista de benefícios]
- **Por que esse preço:** [justificativa]
- **Target:** [quem compra]
- **É P2W?:** Não - [explicação]

---

## 3. Dev Products

| Product | Preço | O que dá | Recorrência |
|---------|-------|----------|-------------|
| | R$ | | |

### Currency Packs (se aplicável)
| Pack | Preço | Quantidade | Bonus |
|------|-------|------------|-------|
| Small | R$ | X | - |
| Medium | R$ | Y | +10% |
| Large | R$ | Z | +25% |

---

## 4. Battle Pass (se aplicável)

### Estrutura
- **Duração:** X semanas
- **Preço Premium:** Y Robux
- **Níveis:** Z

### Free Track (40% das recompensas)
| Nível | Recompensa | Valor |
|-------|------------|-------|

### Premium Track (60% das recompensas)
| Nível | Recompensa | Valor |
|-------|------------|-------|

### Regras
- ✅ Completável jogando normalmente
- ✅ Sem compra de níveis excessiva
- ✅ Free track tem itens bons

---

## 5. Pricing Strategy

### Tiers
```
TIER 1 (Impulso):    {range} Robux → {exemplos}
TIER 2 (Casual):     {range} Robux → {exemplos}
TIER 3 (Engajado):   {range} Robux → {exemplos}
TIER 4 (Premium):    {range} Robux → {exemplos}
```

### Comparação com Competidores
| Item Tipo | Nosso | Comp. A | Comp. B | Posição |
|-----------|-------|---------|---------|---------|
| VIP Pass | R$ | R$ | R$ | Competitivo |

---

## 6. Métricas Target

| Métrica | Mês 1 | Mês 3 | Mês 6 |
|---------|-------|-------|-------|
| Conversion Rate | % | % | % |
| ARPU | R$ | R$ | R$ |
| ARPPU | R$ | R$ | R$ |

### Revenue Projection
| Cenário | CCU | Conv. | ARPPU | Revenue/Mês |
|---------|-----|-------|-------|-------------|
| Pessimista | | % | R$ | R$ |
| Realista | | % | R$ | R$ |
| Otimista | | % | R$ | R$ |

---

## 7. Diretrizes para Game Design

### ✅ PODE ser monetizado
- [Item 1]
- [Item 2]
- [Item 3]

### ❌ DEVE ser grátis
- [Item 1 - ex: Todo conteúdo de história]
- [Item 2 - ex: Mecânicas core]
- [Item 3 - ex: Progressão básica]

### Regras de Balanceamento
1. [Regra 1 - ex: Pagantes ganham no máximo 20% mais rápido]
2. [Regra 2 - ex: Nenhum item pago afeta PvP]
3. [Regra 3 - ex: Tudo comprável também é grindável]

### Interação Progressão x Monetização
```
Progressão Grátis:     [0%]████████████████████[100%]
Progressão Com Passe:  [0%]████████████████████[100%]
                       Mesma velocidade, apenas QoL diferente
```

---

## 8. Ethical Review

### Checklist
- [x] Jogo completo sem pagar
- [x] Sem vantagem competitiva paga
- [x] Preços justos para o target
- [x] Sem FOMO predatório
- [x] Prompts não intrusivos
- [x] Odds transparentes (se houver gacha)

### Score Ético: X/10

### Potenciais Preocupações
| Área | Risco | Mitigação |
|------|-------|-----------|
| | | |

---

## 9. Colaboração com Game Designer

### Pontos de Alinhamento Necessários
1. [ ] Economia de currencies
2. [ ] Sistema de progressão
3. [ ] Balance de itens pagos
4. [ ] Conteúdo grátis vs premium
5. [ ] Update roadmap

### Regra de Veto
> Game Design tem poder de VETO sobre qualquer decisão de monetização
> que prejudique a experiência do jogador.

---

*Estratégia criada por @monetization-strategist (Coin) em {date}*
*Versão: 1.0*
```

### Checkpoint
```
Antes de prosseguir para a Fase 4 (Game Design):
- [ ] Usuário aprovou modelo de monetização
- [ ] Princípios éticos definidos
- [ ] Game Passes e Dev Products planejados
- [ ] Diretrizes para Game Designer documentadas
- [ ] Ethical review passou
```

---

## FASE 4: GAME DESIGN DOCUMENT

### Agente: @game-designer (Mecha) 🎮
### Colaboração: @monetization-strategist (Coin) 💰

### Objetivo
Criar um GDD completo e interativo, refinando mecânicas e sistemas com o usuário, **respeitando as diretrizes de monetização ética**.

### Prompt para o Agente

```
Com base no briefing, análise de mercado E estratégia de monetização:
- Game: {game_name}
- Gênero: {genre}
- Core Loop: {core_loop}
- Diferencial: {unique_feature}
- Recomendações do Market Analyst: {recommendations}
- Diretrizes de Monetização: {monetization_guidelines}
- O que pode ser monetizado: {can_monetize}
- O que DEVE ser grátis: {must_be_free}

Conduza uma sessão interativa de Game Design:

⚠️ IMPORTANTE: Todas as decisões de design devem respeitar
as diretrizes de monetização ética definidas na Fase 3.
O jogo deve ser completo e divertido SEM gastar Robux.

1. **Refinar Vision Statement**
   - Validar/ajustar one-liner
   - Definir pillars do game (3 palavras-chave)
   - Estabelecer target emotions (MDA Aesthetics)

2. **Detalhar Core Loop**
   - Mapear ações do jogador
   - Definir feedback para cada ação
   - Estabelecer ciclo de recompensas

3. **Projetar Sistemas**
   - Listar sistemas necessários
   - Priorizar por importância
   - Definir interações entre sistemas

4. **Definir Progressão**
   - Curva de dificuldade
   - Unlocks e milestones
   - Long-term goals

5. **Planejar Monetização**
   - Definir Game Passes
   - Definir Dev Products
   - Estabelecer economia virtual

6. **Estabelecer Métricas de Sucesso**
   - KPIs target (D1, D7, D30 retention)
   - Revenue goals
   - Engagement metrics

Para cada seção, apresente opções e pergunte ao usuário.
```

### Elicitação Interativa

O Game Designer deve fazer perguntas como:

```
🎮 MECHA: Vamos refinar seu core loop. Você mencionou:
"{core_loop}"

Qual dessas variações faz mais sentido?

1. Loop Rápido (sessões de 5-10 min)
   Ação → Recompensa Imediata → Upgrade → Repetir

2. Loop Médio (sessões de 15-30 min)
   Missão → Progresso → Milestone → Nova Missão

3. Loop Longo (sessões de 30+ min)
   Exploração → Descoberta → Construção → Expansão

4. Híbrido (combinar elementos)

Qual prefere? (ou descreva sua visão)
```

### Output: gdd.md

```markdown
# Game Design Document: {game_name}

## 1. Vision

### One-Liner
{refined_one_liner}

### Pillars
1. **{pillar_1}** - [descrição]
2. **{pillar_2}** - [descrição]
3. **{pillar_3}** - [descrição]

### Target Aesthetics (MDA)
- **Primary:** {primary_aesthetic}
- **Secondary:** {secondary_aesthetic}

### Target Audience
- **Idade:** {target_age}
- **Plataforma Principal:** {platform}
- **Player Types:** {bartle_types}

---

## 2. Gameplay

### Core Loop
```
[Diagrama visual do core loop]
```

| Fase | Ação | Feedback | Recompensa |
|------|------|----------|------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

### Meta Loop
```
[Diagrama do meta loop]
```

### Session Flow
- **Sessão típica:** X minutos
- **Hook inicial:** [o que prende nos primeiros 30s]
- **Razão para voltar:** [daily rewards, progresso, social]

---

## 3. Mechanics

### Core Mechanics
| Mecânica | Input | Feedback | Propósito |
|----------|-------|----------|-----------|
| | | | |

### Secondary Mechanics
| Mecânica | Unlock | Propósito |
|----------|--------|-----------|
| | | |

### Mecânica Diferencial
**{unique_mechanic}**
- Descrição: [como funciona]
- Por que é único: [diferenciação]
- Impacto no gameplay: [como muda a experiência]

---

## 4. Systems

### System Map
```
[Diagrama de sistemas e interações]
```

### Sistemas Principais
| Sistema | Prioridade | Dependências | Descrição |
|---------|------------|--------------|-----------|
| | P0 | | |
| | P1 | | |
| | P2 | | |

### Detalhamento por Sistema
[Para cada sistema P0/P1, incluir:]
- Objetivo do sistema
- Regras principais
- Interação com outros sistemas
- Configuráveis (valores que podem ser ajustados)

---

## 5. Progression

### Curva de Progressão
```
Poder/Conteúdo
    │
    │                    ╭────
    │               ╭────╯
    │          ╭────╯
    │     ╭────╯
    │╭────╯
    └────────────────────────→ Tempo
     0h   5h   20h   50h   100h+
```

### Milestones
| Milestone | Trigger | Unlock | Tempo Estimado |
|-----------|---------|--------|----------------|
| Tutorial Complete | | | 5 min |
| First Achievement | | | 15 min |
| | | | |

### Unlocks
| Item/Feature | Requisito | Impacto |
|--------------|-----------|---------|
| | | |

---

## 6. Economy

### Currencies
| Moeda | Obtida via | Gasta em | Sink |
|-------|------------|----------|------|
| Soft Currency | Gameplay | Upgrades básicos | Consumíveis |
| Hard Currency | IAP/Robux | Premium items | Limiteds |

### Economy Balance
```lua
-- Configurações de economia
ECONOMY = {
    softCurrencyPerMinute = X,
    averageItemCost = Y,
    targetPlaytimePerPurchase = Z, -- minutos
}
```

### Monetization
#### Game Passes
| Pass | Preço (Robux) | Benefício | Target |
|------|---------------|-----------|--------|
| | | | |

#### Dev Products
| Product | Preço (Robux) | O que dá | Frequência esperada |
|---------|---------------|----------|---------------------|
| | | | |

---

## 7. Content Roadmap

### MVP (Launch)
- [ ] Feature 1
- [ ] Feature 2
- [ ] Feature 3

### Update 1 (Week 2-4)
- [ ] Feature 4
- [ ] Feature 5

### Update 2 (Month 2)
- [ ] Feature 6
- [ ] Feature 7

---

## 8. Success Metrics

### KPI Targets
| Métrica | Target Launch | Target Month 1 | Target Month 3 |
|---------|---------------|----------------|----------------|
| D1 Retention | % | % | % |
| D7 Retention | % | % | % |
| D30 Retention | % | % | % |
| Avg Session | min | min | min |
| ARPU | R$ | R$ | R$ |
| CCU Peak | | | |

### North Star Metric
**{north_star}** - [por que essa métrica]

---

## 9. Risks & Mitigations

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| | | | |

---

*GDD criado por @game-designer (Mecha) em {date}*
*Versão: 1.0*
```

### Checkpoint
```
Antes de prosseguir para a Fase 5:
- [ ] Usuário aprovou Vision e Pillars
- [ ] Core Loop está claro e validado
- [ ] Sistemas principais estão definidos
- [ ] Progressão faz sentido
- [ ] Economia alinhada com monetização ética
- [ ] Game Designer e Monetization Strategist em acordo
```

---

## FASE 5: TECHNICAL ARCHITECTURE

### Agente: @lua-scripter (Luau) ⚡

### Objetivo
Propor arquitetura técnica, estrutura de código e sistemas baseado no GDD.

### Prompt para o Agente

```
Com base no GDD aprovado:
- Game: {game_name}
- Sistemas: {systems_list}
- Escopo: {team_size}, {timeline}

Proponha a arquitetura técnica:

1. **Estrutura de Projeto**
   - Organização de pastas no Roblox Studio
   - Single-Script Architecture setup

2. **Sistemas Técnicos**
   - Para cada sistema do GDD, propor estrutura
   - Definir módulos necessários
   - Mapear dependências

3. **Comunicação Client-Server**
   - Listar RemoteEvents necessários
   - Definir payloads
   - Security considerations

4. **Data Management**
   - Estrutura do DataStore
   - Schema de dados do player
   - Backup/recovery strategy

5. **Recomendações de Performance**
   - Object pooling necessário?
   - Onde usar Parallel Lua?
   - Otimizações específicas

6. **Tech Stack**
   - Bibliotecas recomendadas
   - Ferramentas de desenvolvimento
   - Práticas de CI/CD
```

### Output: architecture.md

```markdown
# Technical Architecture: {game_name}

## 1. Project Structure

### Roblox Studio Hierarchy
```
game/
├── ServerScriptService/
│   ├── Main.server.lua              # Entry point
│   └── Systems/                      # Server systems
│       ├── GameManager.lua
│       ├── DataManager.lua
│       ├── {System1}System.lua
│       └── {System2}System.lua
│
├── ReplicatedStorage/
│   ├── Shared/                       # Shared modules
│   │   ├── Types.lua                 # Type definitions
│   │   ├── Config.lua                # Game config
│   │   ├── Utils.lua                 # Utilities
│   │   └── Constants.lua             # Game constants
│   ├── Modules/                      # Client-accessible modules
│   │   └── {SharedModule}.lua
│   └── Remotes/                      # RemoteEvents/Functions
│       └── (created at runtime)
│
├── StarterPlayer/
│   └── StarterPlayerScripts/
│       ├── Main.client.lua           # Client entry point
│       └── Controllers/              # Client controllers
│           ├── UIController.lua
│           ├── InputController.lua
│           └── {Feature}Controller.lua
│
├── StarterGui/
│   └── {UI Screens}
│
├── ServerStorage/
│   ├── Assets/                       # Server-only assets
│   └── Templates/                    # Object templates
│
└── Workspace/
    ├── Map/
    └── {Game Objects}
```

## 2. System Architecture

### System Dependency Graph
```
                    ┌─────────────┐
                    │ GameManager │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ DataManager │   │ {System1}   │   │ {System2}   │
└─────────────┘   └─────────────┘   └─────────────┘
```

### System Specifications

#### DataManager
```lua
--!strict
export type PlayerData = {
    -- Core
    odUserId: number,
    joinDate: number,
    lastLogin: number,

    -- Progression
    level: number,
    experience: number,

    -- Economy
    softCurrency: number,
    hardCurrency: number,

    -- Game-specific
    {game_specific_fields}

    -- Settings
    settings: {
        musicVolume: number,
        sfxVolume: number,
        -- ...
    }
}
```

#### {System1}System
```lua
-- Purpose: {purpose}
-- Dependencies: {dependencies}
-- Exposes: {public_methods}
```

[Repetir para cada sistema]

## 3. Network Architecture

### RemoteEvents
| Name | Direction | Payload | Rate Limit |
|------|-----------|---------|------------|
| | C→S | | |
| | S→C | | |

### RemoteFunctions
| Name | Request | Response | Timeout |
|------|---------|----------|---------|
| | | | |

### Security Measures
```lua
-- Validação padrão para todos os remotes
local function validateRequest(player, action, data)
    -- 1. Rate limiting
    if not RateLimiter:Check(player, action) then
        return false, "RATE_LIMITED"
    end

    -- 2. Data validation
    if not Validator:Validate(action, data) then
        return false, "INVALID_DATA"
    end

    -- 3. Permission check
    if not Permissions:CanDo(player, action) then
        return false, "NO_PERMISSION"
    end

    return true
end
```

## 4. Data Management

### DataStore Strategy
```lua
local DATA_STORE_NAME = "{game_name}_PlayerData_v1"
local BACKUP_STORE_NAME = "{game_name}_Backup_v1"

-- Auto-save interval
local AUTO_SAVE_INTERVAL = 300 -- 5 minutes

-- Retry configuration
local MAX_RETRIES = 3
local RETRY_DELAY = 1
```

### Data Migration
```lua
local DATA_VERSION = 1

local Migrations = {
    [1] = function(data)
        -- v0 → v1 migration
        return data
    end,
}
```

## 5. Performance Recommendations

### Object Pooling
| Object Type | Pool Size | Justificativa |
|-------------|-----------|---------------|
| | | |

### Parallel Lua Candidates
| Task | Benefit | Implementation |
|------|---------|----------------|
| | | |

### Optimization Checklist
- [ ] Services localizados no topo dos scripts
- [ ] Eventos desconectados quando não usados
- [ ] Object pooling para spawns frequentes
- [ ] Batch updates para UI (max 30fps)
- [ ] Throttle em operações de rede

## 6. Tech Stack

### Libraries Recomendadas
| Library | Purpose | Link |
|---------|---------|------|
| Promise | Async handling | |
| Roact | UI framework | |
| Rodux | State management | |

### Development Tools
- **Version Control:** Git + GitHub
- **Testing:** TestEZ
- **Linting:** Selene
- **Build:** Rojo

### Folder Structure (External)
```
project/
├── src/
│   ├── server/
│   ├── client/
│   ├── shared/
│   └── types/
├── tests/
├── docs/
├── default.project.json
└── selene.toml
```

## 7. Implementation Roadmap

### Sprint 1: Foundation
- [ ] Project setup (Rojo, Git)
- [ ] Core architecture (SSA)
- [ ] DataManager implementation
- [ ] Basic networking

### Sprint 2: Core Systems
- [ ] {System1} implementation
- [ ] {System2} implementation
- [ ] Integration tests

### Sprint 3: Features
- [ ] Feature 1
- [ ] Feature 2
- [ ] Feature 3

---

*Architecture designed by @lua-scripter (Luau) em {date}*
```

### Checkpoint
```
Antes de prosseguir para a Fase 6:
- [ ] Arquitetura aprovada pelo time
- [ ] Sistemas técnicos mapeados
- [ ] Estrutura de dados definida
- [ ] Performance considerations documentadas
```

---

## FASE 6: UI/UX STYLE GUIDE

### Agente: @ui-ux-designer (Pixel) 🎨

### Objetivo
Criar um style guide visual que combine com o conceito do game.

### Prompt para o Agente

```
Com base no GDD e arquitetura:
- Game: {game_name}
- Gênero: {genre}
- Pillars: {pillars}
- Target: {target_age}
- Aesthetics: {target_aesthetics}

Proponha o estilo visual:

1. **Mood & Theme**
   - Mood board direction
   - Color psychology
   - Visual references

2. **Color Palette**
   - Primary, secondary, accent colors
   - Semantic colors (success, error, etc.)
   - Accessibility compliance

3. **Typography**
   - Font recommendations
   - Escala tipográfica
   - Hierarquia visual

4. **UI Components**
   - Estilo de botões
   - Cards e containers
   - Ícones e símbolos

5. **Motion Design**
   - Princípios de animação
   - Timing e easing
   - Feedback visual

6. **Screens Overview**
   - Main Menu
   - HUD
   - Telas principais

Apresente opções de estilo para o usuário escolher.
```

### Elicitação de Estilo

```
🎨 PIXEL: Com base nos pillars "{pillars}" e target "{target_age}",
sugiro estes estilos visuais:

1. 🌟 VIBRANT & PLAYFUL
   - Cores saturadas e alegres
   - Cantos arredondados
   - Animações bouncy
   - Ideal para: kids, casual games

2. 🎮 MODERN & CLEAN
   - Paleta minimalista
   - Tipografia bold
   - Transições suaves
   - Ideal para: teens, simulators

3. 🌙 DARK & IMMERSIVE
   - Dark mode dominant
   - Accents de neon
   - Efeitos de glow
   - Ideal para: RPG, horror, combat

4. 🎨 STYLIZED & UNIQUE
   - Paleta customizada ao tema
   - Elementos temáticos
   - Identidade forte
   - Ideal para: jogos com lore forte

Qual direção combina mais com sua visão?
```

### Output: ui-style-guide.md

```markdown
# UI/UX Style Guide: {game_name}

## 1. Brand Foundation

### Mood & Theme
**Direção Visual:** {chosen_style}
**Palavras-chave:** {keywords}
**Referências:** {references}

### Design Principles
1. **{principle_1}** - [descrição]
2. **{principle_2}** - [descrição]
3. **{principle_3}** - [descrição]

---

## 2. Color System

### Primary Palette
```lua
local Colors = {
    -- Brand
    primary = Color3.fromRGB(R, G, B),      -- #{hex}
    primary_light = Color3.fromRGB(R, G, B), -- #{hex}
    primary_dark = Color3.fromRGB(R, G, B),  -- #{hex}

    -- Secondary
    secondary = Color3.fromRGB(R, G, B),     -- #{hex}

    -- Accent
    accent = Color3.fromRGB(R, G, B),        -- #{hex}
}
```

### Semantic Colors
```lua
local SemanticColors = {
    success = Color3.fromRGB(R, G, B),  -- #{hex}
    warning = Color3.fromRGB(R, G, B),  -- #{hex}
    error = Color3.fromRGB(R, G, B),    -- #{hex}
    info = Color3.fromRGB(R, G, B),     -- #{hex}
}
```

### Background Colors
```lua
local Backgrounds = {
    bg_primary = Color3.fromRGB(R, G, B),
    bg_secondary = Color3.fromRGB(R, G, B),
    bg_elevated = Color3.fromRGB(R, G, B),
    bg_overlay = Color3.fromRGB(R, G, B), -- 80% opacity
}
```

### Text Colors
```lua
local TextColors = {
    text_primary = Color3.fromRGB(R, G, B),
    text_secondary = Color3.fromRGB(R, G, B),
    text_disabled = Color3.fromRGB(R, G, B),
    text_inverse = Color3.fromRGB(R, G, B),
}
```

### Accessibility
- Primary on Background: X:1 ✅
- Text on Primary: X:1 ✅
- All combinations meet WCAG AA (4.5:1)

---

## 3. Typography

### Font Stack
- **Primary:** {font_name}
- **Secondary:** {font_name}
- **Monospace:** {font_name} (para números)

### Type Scale
```lua
local Typography = {
    display = {size = 48, weight = Enum.FontWeight.Bold},
    h1 = {size = 36, weight = Enum.FontWeight.Bold},
    h2 = {size = 28, weight = Enum.FontWeight.SemiBold},
    h3 = {size = 22, weight = Enum.FontWeight.SemiBold},
    body_large = {size = 18, weight = Enum.FontWeight.Regular},
    body = {size = 16, weight = Enum.FontWeight.Regular},
    caption = {size = 14, weight = Enum.FontWeight.Regular},
    small = {size = 12, weight = Enum.FontWeight.Regular},
}
```

---

## 4. Spacing & Layout

### Spacing Scale (8px base)
```lua
local Spacing = {
    xs = 4,
    sm = 8,
    md = 16,
    lg = 24,
    xl = 32,
    xxl = 48,
}
```

### Border Radius
```lua
local Radius = {
    none = 0,
    sm = 4,
    md = 8,
    lg = 12,
    xl = 16,
    full = 9999,
}
```

### Shadows
```lua
local Shadows = {
    sm = {offset = Vector2.new(0, 1), blur = 2, opacity = 0.1},
    md = {offset = Vector2.new(0, 2), blur = 4, opacity = 0.15},
    lg = {offset = Vector2.new(0, 4), blur = 8, opacity = 0.2},
}
```

---

## 5. Components

### Buttons
```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  PRIMARY BTN    │   │  SECONDARY BTN  │   │  GHOST BTN      │
│  [bg: primary]  │   │  [bg: secondary]│   │  [bg: none]     │
│  [text: white]  │   │  [text: primary]│   │  [text: primary]│
└─────────────────┘   └─────────────────┘   └─────────────────┘

States: Default → Hover (+brightness) → Pressed (+scale 0.95) → Disabled (50% opacity)
```

### Cards
```
┌──────────────────────────┐
│  ┌────┐                  │
│  │icon│  Title           │
│  └────┘  Description     │  bg: bg_elevated
│                          │  radius: lg
│  [Action Button]         │  padding: md
└──────────────────────────┘
```

### Input Fields
```
┌────────────────────────────┐
│ 🔍 Placeholder text...     │  bg: bg_secondary
└────────────────────────────┘  border: 1px primary (focus)
                                radius: md
```

---

## 6. Animation

### Timing
```lua
local AnimationTiming = {
    instant = 0.1,
    fast = 0.15,
    normal = 0.25,
    slow = 0.4,
    very_slow = 0.6,
}
```

### Easing
```lua
local Easing = {
    default = Enum.EasingStyle.Quad,
    bounce = Enum.EasingStyle.Back,
    smooth = Enum.EasingStyle.Sine,
    sharp = Enum.EasingStyle.Exponential,
}
```

### Animation Patterns
| Action | Animation | Duration | Easing |
|--------|-----------|----------|--------|
| Screen Enter | SlideUp + FadeIn | 0.3s | Quad Out |
| Screen Exit | FadeOut | 0.2s | Quad In |
| Button Hover | Scale 1.05 | 0.15s | Quad |
| Button Press | Scale 0.95 | 0.1s | Quad |
| Notification | SlideIn + Pop | 0.4s | Back Out |
| Achievement | Scale + Glow | 0.5s | Elastic |

---

## 7. Screen Layouts

### Main Menu
```
┌─────────────────────────────────────┐
│              LOGO                    │
│                                      │
│         [{game_name}]                │
│                                      │
│      ┌─────────────────┐            │
│      │     PLAY        │            │
│      └─────────────────┘            │
│      ┌─────────────────┐            │
│      │     SHOP        │            │
│      └─────────────────┘            │
│      ┌─────────────────┐            │
│      │   SETTINGS      │            │
│      └─────────────────┘            │
│                                      │
│  [Social] [News]      [v1.0.0]      │
└─────────────────────────────────────┘
```

### HUD Layout
```
┌─────────────────────────────────────┐
│ [Health]  [Currency]    [Settings]  │
│                                      │
│                                      │
│              GAME                    │
│              AREA                    │
│                                      │
│                                      │
│ [Skill1][Skill2][Skill3]  [Interact]│
└─────────────────────────────────────┘
```

### Key Screens Checklist
- [ ] Main Menu
- [ ] HUD (gameplay)
- [ ] Inventory/Backpack
- [ ] Shop
- [ ] Settings
- [ ] {game_specific_screen}

---

## 8. Iconography

### Icon Style
- **Estilo:** {outlined/filled/duotone}
- **Tamanho base:** 24x24px
- **Stroke:** 2px
- **Corner:** rounded

### Required Icons
| Icon | Uso | Notes |
|------|-----|-------|
| Home | Navigation | |
| Settings | Menu | |
| Currency | HUD | |
| {custom} | | |

---

## 9. Responsive Guidelines

### Mobile Considerations
- Touch targets: mínimo 44x44px
- Font size mínimo: 14px
- Bottom navigation para ações principais
- Notch/safe area: 44px margin

### Breakpoints
```lua
local Breakpoints = {
    mobile_portrait = 600,
    mobile_landscape = 900,
    tablet = 1200,
    desktop = 1920,
}
```

---

## 10. Accessibility

### Checklist
- [ ] Contraste WCAG AA (4.5:1) para texto
- [ ] Contraste WCAG AA (3:1) para elementos
- [ ] Informação não depende só de cor
- [ ] Touch targets adequados
- [ ] Text scaling support
- [ ] Color blind friendly palette

### Color Blind Alternatives
```lua
local ColorBlindPalette = {
    -- Deuteranopia-safe alternatives
    success_alt = Color3.fromRGB(R, G, B),
    error_alt = Color3.fromRGB(R, G, B),
}
```

---

*Style Guide criado por @ui-ux-designer (Pixel) em {date}*
*Versão: 1.0*
```

---

## CONCLUSÃO DO WORKFLOW

### Deliverables Finais

Ao completar o workflow, o usuário terá:

```
docs/concepts/{game_name}/
├── 01-briefing.md               # Ideia documentada
├── 02-market-analysis.md        # Análise de mercado
├── 03-monetization-strategy.md  # Estratégia de monetização ética
├── 04-gdd.md                    # Game Design Document
├── 05-architecture.md           # Arquitetura técnica
└── 06-ui-style-guide.md         # Guia de estilo visual
```

### Summary Card

```markdown
# 📦 Concept Package: {game_name}

## Status: COMPLETE ✅

### Documents
| Doc | Status | Agent |
|-----|--------|-------|
| Briefing | ✅ | - |
| Market Analysis | ✅ | @market-analyst |
| Monetization Strategy | ✅ | @monetization-strategist |
| GDD | ✅ | @game-designer |
| Architecture | ✅ | @lua-scripter |
| UI Style Guide | ✅ | @ui-ux-designer |

### Key Decisions
- **Gênero:** {genre}
- **Target:** {target_age}
- **Diferencial:** {unique_feature}
- **Veredicto Market:** {verdict}
- **Modelo Monetização:** {monetization_model}
- **Ético Score:** {ethical_score}/10
- **Estilo Visual:** {style}

### Next Steps
1. [ ] Criar projeto no Roblox Studio
2. [ ] Setup de repositório (Git)
3. [ ] Implementar foundation (Sprint 1)
4. [ ] Criar UI base
5. [ ] First playable prototype

### Team Assignment
| Role | Assigned | Focus |
|------|----------|-------|
| Lead/PM | | Coordenação |
| Programmer | | Core systems |
| Designer | | Content |
| Artist | | UI/Assets |

---
*Concept finalizado em {date}*
*Workflow: idea-to-concept v1.0*
```

---

## Uso do Workflow

```bash
# Iniciar o workflow
@squad-creator
*run-workflow idea-to-concept

# Ou atalho direto
*idea-to-concept

# Ou aliases
*new-game
*game-concept
```

---

*Workflow criado para o squad roblox-game-studio*
*Versão: 1.0*
