# Game Design Document: Sackman

## Visao Geral

**Nome:** Sackman
**Genero:** Horror / Assimetrico Multiplayer (1v4)
**One-liner:** Sobreviva ao Sackman ou capture todas as criancas no celeiro amaldicoado
**Target:** Todas as idades (horror atmosferico, captura em vez de morte)
**Inspiracao:** Dead by Daylight, Piggy, Identity V, Propnight

---

## Conceito Central

**Sackman** e um jogo de horror assimetrico em larga escala:

### Modos de Jogo

| Modo | Survivors | Sackmen | Objetivos | Duracao |
|------|-----------|---------|-----------|---------|
| **Classico** | 7 | 1 | 5 geradores | 12-15 min |
| **Caos** | 16 | 2 | 8 geradores | 15-20 min |

**Por que captura em sacos?**
- Tematico com o nome "Sackman" (homem do saco)
- Family-friendly (sem morte explicita)
- Permite resgate por outros survivors
- Tensao sem violencia grafica
- Com 7-16 survivors, resgates sao mais frequentes e estrategicos

---

## 1. Core Loop

### Loop dos Survivors (Criancas)

```
┌─────────────────────────────────────────────────────────────┐
│                  SURVIVOR LOOP - CRIANCAS                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   [1] SPAWN → Escondido no mapa                              │
│        │                                                     │
│        ▼                                                     │
│   [2] COMPLETAR OBJETIVOS                                    │
│        │  (reparar geradores, encontrar chaves, etc)         │
│        │                                                     │
│        ├──────────────────┐                                  │
│        ▼                  │                                  │
│   [3] FUGIR/ESCONDER  ◄───┼──── SACKMAN PERSEGUE             │
│        │                  │          ▲                       │
│        ▼                  │          │                       │
│   [CAPTURADO?]            │     Se visto                     │
│      │    │               │                                  │
│     SIM  NAO              │                                  │
│      │    │               │                                  │
│      ▼    └───────────────┘                                  │
│   PRESO EM SACO                                              │
│      │                                                       │
│      ├── Espera resgate (outro survivor)                     │
│      └── Struggle (mini-game para atrasar)                   │
│                                                              │
│   [4] OBJETIVOS COMPLETOS → PORTAO ABERTO                    │
│        │                                                     │
│        ▼                                                     │
│   [5] ESCAPAR! (ou ser capturado tentando)                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Loop do Hunter (Sackman)

```
┌─────────────────────────────────────────────────────────────┐
│                    HUNTER LOOP - SACKMAN                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   [1] SPAWN → Centro do mapa (delay de 10s)                  │
│        │                                                     │
│        ▼                                                     │
│   [2] PATRULHAR / USAR HABILIDADE                            │
│        │                                                     │
│        ├── Ouviu barulho? → INVESTIGAR                       │
│        ├── Viu survivor? → PERSEGUIR                         │
│        └── Perdeu rastro? → VOLTAR A PATRULHAR               │
│                                                              │
│   [3] CAPTURAR SURVIVOR                                      │
│        │  (tocar no survivor = colocar no saco)              │
│        │                                                     │
│        ▼                                                     │
│   [4] CARREGAR ATE O GANCHO/JAULA                            │
│        │  (survivor pode struggle para atrasar)              │
│        │                                                     │
│        ▼                                                     │
│   [5] PRENDER NO GANCHO                                      │
│        │                                                     │
│        └── Outros survivors podem resgatar                   │
│                                                              │
│   [WIN] Capturar todas as 4 criancas                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Timing de Partida

| Fase | Modo Classico (1v7) | Modo Caos (2v16) |
|------|---------------------|------------------|
| **Lobby** | 30-60s | 60-90s |
| **Match Start** | 15s (Sackman delay) | 20s (Sackmen delay) |
| **Mid-Game** | 10-12 min | 12-18 min |
| **End-Game** | 2-3 min | 3-5 min |
| **Total** | 12-15 min | 15-20 min |

### Condicoes de Vitoria

#### Modo Classico (1v7)

| Lado | Vitoria | Empate | Derrota |
|------|---------|--------|---------|
| **Survivors** | 5+ escapam | 3-4 escapam | 0-2 escapam |
| **Sackman** | 5+ capturados | 3-4 escapam | 5+ escapam |

#### Modo Caos (2v16)

| Lado | Vitoria | Empate | Derrota |
|------|---------|--------|---------|
| **Survivors** | 10+ escapam | 6-9 escapam | 0-5 escapam |
| **Sackmen** | 10+ capturados | 6-9 escapam | 10+ escapam |

### Balanceamento por Escala

```
MODO CLASSICO (1v7)
├── 1 Sackman vs 7 Criancas
├── 5 Salas coloridas (5 chaves)
├── 5 Pecas de puzzle
├── 3 Saidas (1 abre)
├── 4 Ganchos no mapa
└── Mapa medio

MODO CAOS (2v16)
├── 2 Sackmen vs 16 Criancas
├── 8 Salas coloridas (8 chaves)
├── 8 Pecas de puzzle
├── 5 Saidas (2 abrem)
├── 8 Ganchos no mapa
├── Mapa grande
└── Sackmen podem coordenar via pings
```

---

## 2. Sistema de Classes

### 2.1 Classes de Survivors (Criancas)

Cada crianca tem uma **habilidade unica** e **stats diferentes**.

| Classe | Nome | Habilidade | Cooldown | Descricao |
|--------|------|------------|----------|-----------|
| **Scout** | Lila | **Quick Peek** | 30s | Ve a aura do Sackman por 3s |
| **Mechanic** | Guto | **Fast Hands** | Passiva | Repara objetivos 15% mais rapido |
| **Medic** | Nina | **First Aid** | 45s | Cura a si ou aliado (tira do estado "ferido") |
| **Athlete** | Davi | **Sprint Burst** | 40s | Boost de velocidade de 3s ao correr |
| **Trickster** | Zoe | **Decoy** | 60s | Cria uma copia falsa que corre em linha reta |
| **Leader** | Max | **Rally** | 90s | Aliados proximos ganham 10% velocidade por 5s |

#### Stats Base por Classe

| Classe | Velocidade | Reparo | Stealth | HP |
|--------|------------|--------|---------|-----|
| Scout | Media | Media | Alta | 2 hits |
| Mechanic | Baixa | Alta | Media | 2 hits |
| Medic | Media | Media | Media | 3 hits |
| Athlete | Alta | Baixa | Baixa | 2 hits |
| Trickster | Media | Media | Alta | 2 hits |
| Leader | Media | Media | Media | 2 hits |

#### Sistema de HP (Hits)

- **Saudavel (2 hits):** Normal
- **Ferido (1 hit):** Deixa rastro de sangue, gemidos ocasionais
- **Incapacitado (0 hits):** Cai no chao, precisa de resgate
- **Capturado:** Colocado no saco, levado ao gancho

### 2.2 Classes de Sackman (Hunters)

Cada variante do Sackman tem **habilidades e playstyle unicos**.

| Classe | Nome | Poder Especial | Descricao |
|--------|------|----------------|-----------|
| **The Collector** | Sackman Classico | **Bag Toss** | Joga saco a distancia para capturar (skill shot) |
| **The Stalker** | Sackman Sombra | **Shadow Step** | Fica invisivel por 5s, mais lento |
| **The Brute** | Sackman Gigante | **Ground Pound** | Atordoa survivors em area |
| **The Trapper** | Sackman Cacador | **Sack Trap** | Coloca armadilhas de saco no chao |
| **The Mimic** | Sackman Falso | **Disguise** | Transforma-se em objeto por 10s |

#### Detalhamento das Classes de Sackman

##### The Collector (Sackman Classico)
```
Poder: BAG TOSS
├── Carrega 2 sacos
├── Joga a media distancia (15 studs)
├── Se acertar, survivor fica "ensacado" imediatamente
├── Se errar, saco fica no chao por 10s
└── Cooldown: 8s por saco

Dificuldade: ★★☆☆☆ (Iniciante)
Playstyle: Balanced, bom para aprender
```

##### The Stalker (Sackman Sombra)
```
Poder: SHADOW STEP
├── Ativa invisibilidade por 5s
├── Velocidade reduzida em 30% enquanto invisivel
├── Som de "whoosh" ao ativar (aviso)
├── Atacar cancela invisibilidade
└── Cooldown: 20s

Dificuldade: ★★★☆☆ (Intermediario)
Playstyle: Emboscadas, mind games
```

##### The Brute (Sackman Gigante)
```
Poder: GROUND POUND
├── Carga de 1.5s
├── Atordoa survivors em raio de 8 studs por 2s
├── Nao causa dano, apenas stun
├── Pode ser usado para interromper resgates
└── Cooldown: 15s

Dificuldade: ★★★☆☆ (Intermediario)
Playstyle: Controle de area, pressao
```

##### The Trapper (Sackman Cacador)
```
Poder: SACK TRAP
├── Coloca armadilhas (maximo 5 no mapa)
├── Survivor que pisa fica preso por 3s
├── Outros survivors podem libertar
├── Traps sao visiveis se olhar com atencao
└── Cooldown: 3s entre colocacoes

Dificuldade: ★★★★☆ (Avancado)
Playstyle: Setup, controle de mapa
```

##### The Mimic (Sackman Falso)
```
Poder: DISGUISE
├── Transforma em objeto do mapa (caixa, barril, etc)
├── Pode ver ao redor mesmo transformado
├── Atacar cancela disfarce
├── Survivors atentos podem notar objeto "estranho"
└── Cooldown: 25s

Dificuldade: ★★★★★ (Expert)
Playstyle: Mind games, paciencia
```

#### Stats Base dos Sackman

| Classe | Velocidade | Ataque | Deteccao | Poder |
|--------|------------|--------|----------|-------|
| Collector | Media | Media | Media | Versatil |
| Stalker | Media | Media | Alta | Emboscada |
| Brute | Baixa | Alta | Baixa | Area |
| Trapper | Media | Media | Media | Setup |
| Mimic | Alta | Baixa | Baixa | Surpresa |

---

## 3. Mecanicas Principais

### 3.1 Movimento

#### Survivors

| Mecanica | Descricao | Tecla |
|----------|-----------|-------|
| **Andar** | Movimento base, silencioso | WASD |
| **Correr** | Mais rapido, deixa rastros | Shift |
| **Agachar** | Passar por espacos baixos, silencioso | Ctrl |
| **Interagir** | Reparar, resgatar, abrir | E |
| **Habilidade** | Poder da classe | Q |
| **Olhar para tras** | Ver atras sem virar | Segurar Alt |

#### Sackman

| Mecanica | Descricao | Tecla |
|----------|-----------|-------|
| **Andar** | Movimento padrao | WASD |
| **Capturar** | Timing-based, precisa acertar janela | LMB |
| **Poder Especial** | Habilidade da classe | RMB |
| **Largar** | Soltar survivor do saco | E |
| **Trancar Prisão** | Trancar survivor na prisão | E (perto da prisão) |

**Captura NÃO é automática** - Sackman precisa acertar o timing do click quando está no range (4 studs). Errar = cooldown de 2s + fica mais lento.

### 3.2 Sistema de Captura e Oxigênio

#### Fluxo Completo de Captura

**NÃO HÁ SISTEMA DE HITS** - Captura requer **TIMING** do Sackman!

```
SISTEMA DE CAPTURA - SKILL BASED
================================

[SACKMAN] persegue [SURVIVOR]
         │
         │ Quando está PERTO o suficiente...
         ▼
[JANELA DE CAPTURA] ← Indicador visual aparece
         │
         │ Sackman precisa CLICAR no momento certo!
         │
         ├── ACERTOU o timing → CAPTURA com sucesso!
         │
         └── ERROU o timing → Cooldown de 2s, survivor ganha distância


[CAPTURA BEM SUCEDIDA]
         │
         ▼
[DENTRO DO SACO - SENDO CARREGADO]
```

### Mecânica de Captura do Sackman

```lua
CaptureConfig = {
    -- Distância para ativar janela de captura
    distancia_captura = 4,           -- studs

    -- Janela de timing
    janela_timing = 0.5,             -- segundos (janela para clicar)
    zona_perfeita = 0.15,            -- segundos (centro da janela)

    -- Resultados
    captura_perfeita_bonus = true,   -- Survivor atordoado por mais tempo
    falha_cooldown = 2,              -- segundos até poder tentar de novo
    falha_slowdown = 0.8,            -- Sackman fica 20% mais lento por 1s

    -- Visual
    indicador_distancia = true,      -- Mostra quando está no range
    indicador_timing = true,         -- Mostra a janela de click
}
```

### Como Funciona para o Sackman

```
INDICADOR DE CAPTURA (HUD do Sackman)
=====================================

Longe do survivor:
[░░░░░░░░░░] ← Barra vazia

Entrando no range:
[████░░░░░░] ← Barra enchendo

No range de captura (4 studs):
[██████████] ← PRONTO! Aparecem indicador de timing

Janela de timing:
    ┌─────────────────────────────┐
    │    [    |████|    ]         │  ← Click quando na zona verde!
    │         ▲                   │
    │    Zona perfeita            │
    └─────────────────────────────┘

RESULTADOS:
├── Click na zona PERFEITA → Captura + survivor atordoado 1s extra
├── Click na zona VERDE → Captura normal
├── Click FORA da zona → FALHA! Cooldown 2s + slowdown
└── Não clicou a tempo → Survivor escapa, precisa aproximar de novo
```
         │
         ├── Saco FECHADO = Sem ar = O2 diminui
         │
         ├── [STRUGGLE] → Tenta escapar
         │       │
         │       ├── SUCESSO → Saco abre, cai no chão, O2 para de cair
         │       │              Volta a ser [CONSCIENTE] mas atordoado 2s
         │       │
         │       └── FALHA → Continua no saco, O2 continua caindo
         │
         ▼
[O2 CHEGA A 0%]
         │
         ▼
[DESMAIADO] ← Tela escura, só vê quem está MUITO perto
         │
         ├── HP começa a cair (em vez de O2)
         │
         ├── Sackman NÃO PODE recapturar (só conscientes)
         │
         ├── Aliado pode LIBERTAR + precisa AJUDAR a levantar
         │
         └── HP chega a 0% → [ELIMINADO]


SACKMAN LARGA NA PRISÃO
=======================

[SURVIVOR NO SACO] → Sackman larga na prisão
         │
         ▼
[PRESO NA PRISÃO]
         │
         ├── O2 continua caindo (ainda no saco)
         │
         ├── Pode tentar STRUGGLE para sair
         │
         └── Se O2 = 0 → [DESMAIADO] na prisão
                │
                └── HP cai até resgate ou morte
```

#### Sistema de Oxigênio (O2)

```lua
OxygenConfig = {
    -- Barra de O2
    o2_maximo = 100,

    -- Consumo no saco (sendo carregado)
    consumo_no_saco = 5,          -- por segundo (20s até desmaiar)

    -- Consumo na prisão (largado no saco)
    consumo_na_prisao = 3,        -- por segundo (33s até desmaiar)

    -- Consumo ao correr
    consumo_correndo = 2,         -- por segundo
    consumo_maximo_corrida = 20,  -- % máximo que corrida pode consumir

    -- Recuperação
    recuperacao_parado = 3,       -- por segundo
    recuperacao_andando = 1,      -- por segundo

    -- Limites de corrida
    minimo_para_correr = 50,      -- % mínimo para poder correr novamente

    -- Desmaiado
    hp_maximo = 100,
    consumo_hp_desmaiado = 2,     -- por segundo (50s até morte)
}
```

#### Estados do Survivor

| Estado | O2 | HP | Visão | Ações | Capturável? |
|--------|----|----|-------|-------|-------------|
| **Consciente (cheio)** | 50-100% | 100% | Normal | Todas + Correr | SIM |
| **Consciente (cansado)** | 21-49% | 100% | Normal | Todas (sem correr) | SIM |
| **Sem fôlego** | 1-20% | 100% | Levemente turva | Andar lento apenas | SIM |
| **No Saco (carregado)** | Caindo rápido | 100% | Escura | Struggle apenas | Já está |
| **No Saco (prisão)** | Caindo lento | 100% | Escura | Struggle | Já está |
| **Desmaiado** | 0% | Caindo | Muito escura | Nenhuma | **NÃO** |
| **Eliminado** | - | 0% | Espectador | Nenhuma | - |

**IMPORTANTE:** Captura é INSTANTÂNEA no toque. Não há sistema de "2 hits".

#### Mecânica de Corrida e O2

```
O2 E CORRIDA
============

100% ████████████████████ ← O2 cheio, pode correr
 80% ████████████████░░░░ ← Correndo, consumindo O2
 50% ██████████░░░░░░░░░░ ← MÍNIMO para voltar a correr
 20% ████░░░░░░░░░░░░░░░░ ← LIMITE! Corrida para automaticamente
  0% ░░░░░░░░░░░░░░░░░░░░ ← Desmaia (se no saco)

REGRAS:
├── Corrida consome O2 (2% por segundo)
├── Corrida só pode consumir ATÉ 20% do O2 total
├── Ao atingir 80% (100-20), corrida PARA automaticamente
├── Corrida só VOLTA quando O2 atinge 50%
├── O2 recupera parado (3%/s) ou andando (1%/s)
└── Se no saco, O2 cai independente de ação
```

#### Struggle (Tentativa de Fuga)

| Situação | Chance de Sucesso | Cooldown |
|----------|-------------------|----------|
| **Sendo carregado** | 15% por tentativa | 3s entre tentativas |
| **Na prisão** | 25% por tentativa | 5s entre tentativas |
| **Com aliado ajudando** | 50% | 2s entre tentativas |

**Mecânica de Struggle:**
- Apertar tecla rapidamente (QTE)
- Quanto mais rápido, maior a chance
- Sucesso = saco abre, survivor cai
- Atordoado por 2s após cair

#### Resgate de Desmaiado

```
RESGATE DE PESSOA DESMAIADA
===========================

[ALIADO] encontra [DESMAIADO]
         │
         ▼
[1] ABRIR O SACO (3 segundos)
         │
         ▼
[2] REANIMAR (5 segundos) ← Precisa ficar perto
         │
         ├── Durante reanimação, O2 do desmaiado para de cair
         │
         └── HP para de cair também

         ▼
[3] AJUDAR A LEVANTAR (3 segundos)
         │
         ▼
[CONSCIENTE] mas com apenas 30% O2 e 50% HP
         │
         └── Precisa recuperar antes de correr
```

#### Prisão (Substituindo Ganchos)

- **4-6 prisões** espalhadas pelo mapa (jaulas/celas)
- Sackman carrega survivor até a prisão
- Ao largar na prisão, survivor continua no saco
- Survivor pode tentar struggle para escapar do saco
- Aliados podem abrir a prisão + ajudar a sair do saco

```lua
PrisonConfig = {
    quantidade_classico = 4,    -- 1v7
    quantidade_caos = 6,        -- 2v16

    tempo_trancar = 1,          -- segundos para Sackman trancar
    tempo_abrir_aliado = 4,     -- segundos para aliado abrir

    -- Após sair da prisão
    invulnerabilidade = 3,      -- segundos de invulnerabilidade
}

### 3.3 Sistema de Objetivos

#### Objetivo Principal: Chaves + Salas Coloridas + Puzzle Final

O mapa tem **salas com portas coloridas** que requerem **chaves da cor correspondente**.

```
ESTRUTURA DO MAPA
=================

┌─────────────────────────────────────────────────────────────┐
│                         MAPA                                 │
│                                                              │
│   [SALA VERMELHA]     [SALA AZUL]      [SALA VERDE]         │
│   🔴 Porta             🔵 Porta         🟢 Porta            │
│   └── Chave Amarela    └── Chave Verde  └── Chave Roxa      │
│                                                              │
│   [SALA AMARELA]      [SALA ROXA]      [AREA CENTRAL]       │
│   🟡 Porta            🟣 Porta          │                   │
│   └── Chave Azul      └── Chave Vermelha│                   │
│                                          │                   │
│                        ┌─────────────────┘                   │
│                        ▼                                     │
│              ╔═══════════════════════╗                       │
│              ║   PORTA FINAL         ║                       │
│              ║   🔧 Puzzle de        ║                       │
│              ║   Engrenagens/Peças   ║                       │
│              ╚═══════════════════════╝                       │
│                        │                                     │
│            ┌───────────┼───────────┐                         │
│            ▼           ▼           ▼                         │
│       [SAIDA 1]   [SAIDA 2]   [SAIDA 3]                      │
│       (aleatoria) (aleatoria) (aleatoria)                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Sistema de Cores e Chaves

| Cor da Porta | Cor da Chave | Onde a Chave Pode Estar |
|--------------|--------------|-------------------------|
| 🔴 Vermelha | 🔴 Vermelha | Qualquer sala aberta ou sala de outra cor |
| 🔵 Azul | 🔵 Azul | Qualquer sala aberta ou sala de outra cor |
| 🟢 Verde | 🟢 Verde | Qualquer sala aberta ou sala de outra cor |
| 🟡 Amarela | 🟡 Amarela | Qualquer sala aberta ou sala de outra cor |
| 🟣 Roxa | 🟣 Roxa | Qualquer sala aberta ou sala de outra cor |

**Regras:**
- Maximo **5 cores diferentes** por mapa
- Chaves podem estar em salas de **outras cores** (requer progresso)
- Algumas chaves estao em **areas abertas** (acessiveis desde o inicio)
- Cada sala pode conter **itens para o puzzle final**

#### Puzzle da Porta Final

Apos coletar todas as chaves e abrir todas as salas, survivors devem resolver o **puzzle final**:

| Tipo de Puzzle | Descricao | Tempo p/ Resolver |
|----------------|-----------|-------------------|
| **Engrenagens** | Encaixar 5 engrenagens nos slots corretos | 30-45s |
| **Quebra-cabeça** | Montar imagem com 9 peças | 20-30s |
| **Sequencia** | Pressionar botoes na ordem correta (pistas no mapa) | 15-20s |
| **Simbolos** | Combinar simbolos encontrados pelo mapa | 25-35s |

**O puzzle e selecionado ALEATORIAMENTE a cada partida.**

#### Saidas

- **3 saidas** espalhadas pelo mapa
- Posicao das saidas e **aleatoria** a cada partida
- Apenas **1 saida** abre quando o puzzle e resolvido
- Qual saida abre e **revelado** apos completar o puzzle

```lua
ObjectiveConfig = {
    -- Salas coloridas
    cores = {"Vermelha", "Azul", "Verde", "Amarela", "Roxa"},
    max_cores_por_mapa = 5,

    -- Chaves
    chaves_total = 5,  -- 1 por cor
    chaves_em_areas_abertas = 2,  -- Pelo menos 2 acessiveis de inicio

    -- Itens do puzzle
    pecas_puzzle = 5,  -- Espalhadas nas salas

    -- Saidas
    saidas_total = 3,
    saidas_ativas = 1,  -- Apenas 1 abre

    -- Timers
    tempo_abrir_porta_colorida = 2,  -- segundos com a chave
    tempo_puzzle_final = 30,  -- segundos para resolver
    tempo_saida_aberta = 60,  -- segundos ate a saida fechar

    -- Randomizacao
    randomizar_chaves = true,
    randomizar_puzzle = true,
    randomizar_saida = true
}
```

#### Fluxo de Objetivos

```
INICIO DA PARTIDA
       │
       ▼
[1] Encontrar chaves em areas abertas (2 chaves acessiveis)
       │
       ▼
[2] Abrir salas coloridas com as chaves encontradas
       │
       ▼
[3] Dentro das salas: mais chaves + peças do puzzle
       │
       ▼
[4] Repetir ate ter TODAS as chaves + TODAS as peças
       │
       ▼
[5] Ir a PORTA FINAL e resolver o puzzle
       │
       ▼
[6] Puzzle resolvido → 1 das 3 SAIDAS abre
       │
       ▼
[7] Correr ate a saida aberta e ESCAPAR!
       │
       └── Timer de 60s ate a saida fechar
```

#### Indicadores Visuais

| Elemento | Indicador |
|----------|-----------|
| **Chave** | Brilho + particulas da cor |
| **Porta trancada** | Luz vermelha + icone de cadeado |
| **Porta aberta** | Luz verde |
| **Peça de puzzle** | Brilho dourado |
| **Porta final** | Slots visiveis para as peças |
| **Saida ativa** | Luz intensa + som de alarme |

### 3.4 Sistema de Esconderijos

| Local | Capacidade | Tempo Max | Detectavel |
|-------|------------|-----------|------------|
| **Armario** | 1 | 20s | Sackman pode abrir |
| **Sob Mesa** | 1 | Infinito | Se olhar embaixo |
| **Fardos de Palha** | 2 | 15s | Mais facil de achar |
| **Barril** | 1 | Infinito | Pode ser chutado |

**Regras:**
- Sackman **pode abrir** esconderijos (0.5s delay)
- Scratch marks (rastros) desaparecem apos 5s
- Respiracao e audivel se Sackman estiver muito perto

### 3.5 Sistema de Puzzles

#### Tipos de Puzzle

| Tipo | Complexidade | Exemplo |
|------|--------------|---------|
| **Coleta** | Facil | Encontrar 3 engrenagens |
| **Sequencia** | Medio | Pressionar botoes na ordem correta |
| **Logica** | Medio | Simbolos que se conectam |
| **Ambiente** | Dificil | Mover objetos para criar caminho |
| **Combinacao** | Dificil | Usar item A no objeto B |

#### Design de Puzzles

1. **Comunicacao visual clara** - Jogador entende o objetivo sem texto
2. **Feedback imediato** - Som/visual ao progresso
3. **Interruptiveis** - Sackman pode aparecer no meio
4. **Sem bloqueio** - Sempre ha caminho de fuga

### 2.4 O Sackman - AI do Vilao

#### Comportamentos

| Estado | Descricao | Trigger |
|--------|-----------|---------|
| **Patrulha** | Anda por rota pre-definida | Default |
| **Alerta** | Ouviu barulho, investiga | Jogador corre, quebra algo |
| **Perseguicao** | Viu o jogador, caca ativamente | Linha de visao |
| **Busca** | Perdeu o jogador, procura | Jogador escapou |
| **Idle** | Para e observa | Chegou em area de interesse |

#### Parametros do Sackman

```lua
SackmanConfig = {
    -- Movimento
    velocidade_patrulha = 8,
    velocidade_perseguicao = 14, -- Jogador correndo = 16

    -- Deteccao
    campo_visao = 60, -- graus
    distancia_visao = 40, -- studs
    distancia_audicao = 25, -- studs (se correndo)

    -- Comportamento
    tempo_busca = 15, -- segundos antes de voltar a patrulhar
    tempo_minimo_entre_spawns = 30, -- segundos

    -- Dificuldade (escalona por capitulo)
    multiplicador_velocidade = {1.0, 1.1, 1.2, 1.3},
    multiplicador_deteccao = {1.0, 1.1, 1.15, 1.2}
}
```

#### Fairness Rules

1. **Jogador sempre pode escapar** - Velocidade maxima = Sackman +2
2. **Aviso antes de spawn** - Som/luz 3 segundos antes
3. **Nao spawna em cima do jogador** - Distancia minima de spawn
4. **Grace period apos morte** - 5 segundos de invulnerabilidade

---

## 3. Progressao

### 3.1 Estrutura de Capitulos

```
CAPITULO 1: O Celeiro (Tutorial)
├── Introducao ao movimento
├── Primeiro puzzle simples
├── Primeiro encontro com Sackman (scripted)
└── Escape

CAPITULO 2: A Casa da Fazenda
├── Puzzles de coleta
├── Novos esconderijos
├── Sackman mais ativo
└── Escape

CAPITULO 3: O Silo
├── Puzzles de ambiente
├── Verticality (escadas, plataformas)
├── Sackman + armadilhas
└── Escape

CAPITULO 4: O Subsolo (Final)
├── Puzzles combinados
├── Lore reveal
├── Confronto final
└── Ending
```

### 3.2 Curva de Dificuldade

```
Dificuldade
    ▲
    │                              ╱───╲
    │                            ╱      ╲ Cap 4
    │                     ╱───╲╱
    │               ╱───╲╱      Cap 3
    │         ╱───╲╱
    │   ╱───╲╱      Cap 2
    │  ╱
    │ ╱  Cap 1 (Tutorial)
    └──────────────────────────────────► Tempo
```

### 3.3 Checkpoints

- **Auto-save** ao completar puzzle major
- **Checkpoint visual** (vela acesa, lanterna recarregada)
- **Morte = volta ao ultimo checkpoint** (nao reinicia capitulo)
- **Maximo 5 checkpoints por capitulo**

---

## 4. Sistemas de Suporte

### 4.1 Inventario

| Slot | Tipo | Exemplo |
|------|------|---------|
| **Item Chave** | Puzzle | Engrenagem, Chave, Fusivel |
| **Lanterna** | Permanente | Sempre equipada |
| **Item Uso** | Consumivel | Isca para distrair Sackman |

**Regras:**
- Maximo 1 item-chave por vez
- Drop automatico se pegar outro
- Itens brilham suavemente para indicar coletabilidade

### 4.2 Lanterna

```lua
FlashlightConfig = {
    bateria_max = 100,
    consumo_por_segundo = 1, -- 100 segundos ligada
    recarga_por_segundo = 2, -- 50 segundos para recarregar
    alcance = 30, -- studs
    angulo = 45, -- graus

    -- A bateria so acaba se ficar ligada muito tempo
    -- Recarrega automaticamente quando desligada
    recarga_automatica = true
}
```

**Design Rationale:**
- Lanterna e ferramenta de conforto, nao de stress
- Jogador nunca fica no escuro completo
- Luz ambiente minima sempre existe

### 4.3 Sistema de Morte

1. **Sackman toca no jogador** → Tela escurece
2. **Cutscene curta** (1-2s) → Silhueta do Sackman
3. **Respawn no checkpoint** → Breve invulnerabilidade
4. **Contador de mortes** → Para achievements (nao afeta gameplay)

**NAO punir demais:**
- Sem perda de itens coletados pos-checkpoint
- Sem timer de penalidade
- Sem limite de vidas

---

## 5. Audio Design

### Paisagem Sonora

| Elemento | Funcao | Exemplo |
|----------|--------|---------|
| **Ambiente** | Imersao | Vento, rangidos, animais |
| **Sackman Proximo** | Aviso | Passos pesados, respiracao |
| **Puzzle Feedback** | Progresso | Click, engrenagem girando |
| **Tensao** | Emocao | Heartbeat, strings dissonantes |
| **Sucesso** | Recompensa | Ding satisfatorio, alivio musical |

### Audio Cues do Sackman

| Distancia | Som |
|-----------|-----|
| 40+ studs | Silencio |
| 30-40 studs | Passos distantes |
| 20-30 studs | Passos + respiracao |
| 10-20 studs | Heartbeat do jogador |
| <10 studs | MUSICA DE PERSEGUICAO |

---

## 6. Visual Design

### Paleta de Cores

| Elemento | Cor | Hex |
|----------|-----|-----|
| **Ambiente** | Marrom escuro | #3D2817 |
| **Madeira** | Marrom medio | #6B4423 |
| **Luz** | Amarelo quente | #FFD93D |
| **Perigo** | Vermelho | #8B0000 |
| **Interativo** | Azul suave | #4A90A4 |

### Estilo Visual

- **Low-poly estilizado** (performance + estetica)
- **Iluminacao dramatica** (sombras fortes)
- **Particulas sutis** (poeira, neblina)
- **Silhuetas reconheciveis** (Sackman sempre identificavel)

### O Sackman - Design Visual

Baseado na arte conceitual:
- **Cabeca:** Saco de estopa com 1 buraco de olho
- **Corpo:** Desproporcional, bracos longos
- **Roupas:** Trapos esfarrapados, sujos
- **Maos:** Garras escuras
- **Animacao:** Movimentos erraticos, head tilt

---

## 7. Level Design

### Principios

1. **Layout Legivel** - Jogador nunca se perde completamente
2. **Multiplos Caminhos** - Sempre opcao de fuga
3. **Pontos de Referencia** - Elementos visuais unicos por area
4. **Espacos Negativos** - Areas seguras para respirar

### Estrutura de Mapa Tipico

```
┌─────────────────────────────────────────────┐
│  ENTRADA                                     │
│    │                                         │
│    ▼                                         │
│  ┌─────┐    ┌─────┐    ┌─────┐             │
│  │SALA │────│SALA │────│SALA │             │
│  │  A  │    │  B  │    │  C  │             │
│  └──┬──┘    └──┬──┘    └──┬──┘             │
│     │          │          │                 │
│     └────┬─────┴──────────┘                 │
│          │                                   │
│          ▼                                   │
│       ┌─────┐                               │
│       │SAFE │  ← Checkpoint                 │
│       │ROOM │                               │
│       └──┬──┘                               │
│          │                                   │
│          ▼                                   │
│    [PUZZLE AREA]                            │
│          │                                   │
│          ▼                                   │
│       SAIDA                                  │
└─────────────────────────────────────────────┘
```

### Densidade de Elementos

| Elemento | Por Sala | Total por Capitulo |
|----------|----------|-------------------|
| Esconderijos | 1-2 | 8-12 |
| Itens coletaveis | 0-2 | 5-8 |
| Puzzles | 0-1 | 3-5 |
| Checkpoints | 0-1 | 3-5 |

---

## 8. Multiplayer (Core Feature)

### Sackman e MULTIPLAYER por natureza

| Modo | Jogadores | Descricao |
|------|-----------|-----------|
| **Classico** | 8 (1v7) | Experiencia padrao |
| **Caos** | 18 (2v16) | Partidas epicas |
| **Ranqueado** | 8 (1v7) | Competitivo com MMR |
| **Personalizado** | 2-18 | Lobby privado |

### Sistema de Matchmaking

```lua
MatchmakingConfig = {
    -- Modo Classico
    classico = {
        min_players = 6,      -- 1 Sackman + 5 Survivors
        max_players = 8,      -- 1 Sackman + 7 Survivors
        ideal_players = 8,
        queue_timeout = 60    -- segundos
    },

    -- Modo Caos
    caos = {
        min_players = 12,     -- 2 Sackmen + 10 Survivors
        max_players = 18,     -- 2 Sackmen + 16 Survivors
        ideal_players = 18,
        queue_timeout = 90
    },

    -- Selecao de role
    role_selection = "preference", -- Jogadores indicam preferencia
    role_guarantee = false,        -- Nao garantido (evita queue longo)
    sackman_priority = "rotation"  -- Quem jogou menos de Sackman tem prioridade
}
```

### Comunicacao

| Tipo | Survivors | Sackman |
|------|-----------|---------|
| **Voice Chat** | Proximity (10 studs) | Nao tem |
| **Text Chat** | Team only | Nao tem |
| **Pings** | Sim (marcar locais) | Sim (com outro Sackman) |
| **Emotes** | Sim (limitados) | Sim (intimidar) |

### Anti-Grief

- **AFK Detection:** Kick apos 60s parado
- **Intentional Feeding:** Report + ban temporario
- **Rage Quit Penalty:** Cooldown de queue
- **Sackman Camping:** Crows aparecem apos 30s parado

---

## 9. Acessibilidade

### Features Obrigatorias

| Feature | Descricao |
|---------|-----------|
| **Legendas** | Todos os sons importantes descritos |
| **Color Blind** | Indicadores nao dependem so de cor |
| **Remap de Teclas** | Todas as acoes remapeeaveis |
| **Sensibilidade** | Camera ajustavel |
| **Reducao de Motion** | Desligar screen shake |

### Horror Accessibility

- **Opcao de reduzir jumpscares** (warning antes)
- **Modo "Tension Only"** (menos aparicoes do Sackman)
- **Brightness slider** (ambiente nunca 100% escuro)

---

## 10. Metricas de Sucesso

### KPIs de Game Design

| Metrica | Target | Critico |
|---------|--------|---------|
| **Retention D1** | 25%+ | <15% |
| **Session Length** | 15-20 min | <10 min |
| **Completion Rate Cap 1** | 70%+ | <50% |
| **Deaths per Chapter** | 3-5 | >10 |
| **Puzzle Completion Time** | 2-3 min avg | >5 min |

### Balanceamento

Se metricas fora do target:
- **Muitas mortes** → Aumentar avisos, reduzir velocidade Sackman
- **Puzzle muito longo** → Adicionar hints visuais
- **Sessao curta** → Melhorar hook inicial, mais recompensas

---

## 11. Escopo MVP

### Incluido no MVP

- **Modo Classico (1v7)** funcional
- **1 Mapa** (Celeiro)
- **3 Classes de Survivor** (Scout, Mechanic, Athlete)
- **2 Classes de Sackman** (Collector, Stalker)
- Sistema de captura/resgate completo
- Matchmaking basico
- 5 Geradores + 4 Ganchos
- Audio essencial
- UI de lobby e partida

### Nao incluido no MVP

- Modo Caos (2v16)
- Outras classes de Survivor (Medic, Trickster, Leader)
- Outras classes de Sackman (Brute, Trapper, Mimic)
- Mapas adicionais
- Ranqueado/MMR
- Battlepass/Cosmeticos
- Lore/Historia
- Achievements

---

## 12. Roadmap de Conteudo

| Versao | Conteudo |
|--------|----------|
| **0.1 (Alpha)** | 1v7, 1 mapa, 3 survivors, 2 sackmen |
| **0.2 (Beta)** | +3 survivors, +2 sackmen, balanceamento |
| **0.3** | +1 mapa, Modo Caos (2v16) |
| **1.0 (Launch)** | Ranqueado, Battlepass, cosmeticas |
| **1.1** | +1 mapa, eventos sazonais |
| **1.2** | Novas classes, ranked seasons |
| **2.0** | Modo historia (PvE opcional) |

---

## Aprovacao de Design

Este GDD define as regras fundamentais do Sackman. Qualquer feature de monetizacao que viole esses principios de design sera **vetada** por este documento.

**Principio fundamental:** O jogo deve ser desafiador, justo e completamente jogavel sem gastar Robux.

---

*GDD criado por @game-designer (Mecha) em 2026-01-28*
*Squad: roblox-game-studio*
*Versao: 1.0.0*
