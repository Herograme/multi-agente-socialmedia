# UI/UX Design Document: Sackman

## 1. Filosofia de Design

### Principios Fundamentais

| Principio | Descricao | Aplicacao |
|-----------|-----------|-----------|
| **Mobile-First** | 70% dos jogadores estao no celular | Thumb zones, botoes grandes, gestos |
| **Clareza sob Pressao** | Horror = estresse, UI precisa ser legivel | Alto contraste, icones simples |
| **Feedback Imediato** | Cada acao tem resposta visual/sonora | Animacoes, sons, particulas |
| **Minimalismo Funcional** | Menos e mais em horror | HUD enxuto, informacao essencial |
| **Consistencia** | Mesma linguagem visual em todo lugar | Sistema de cores, tipografia |

### Design para Horror

```
REGRA DE OURO: A UI NAO deve COMPETIR com o medo

┌─────────────────────────────────────────────────────────┐
│  ✓ CERTO                    ✗ ERRADO                    │
├─────────────────────────────────────────────────────────┤
│  HUD translucido            HUD solido/opaco            │
│  Cores desaturadas          Cores vibrantes             │
│  Aparecer quando necessario Sempre visivel              │
│  Sutileza nos efeitos       Efeitos chamativos          │
│  Integrado ao ambiente      Descolado do mundo          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Sistema de Cores

### Paleta Principal

| Elemento | Cor | Hex | Uso |
|----------|-----|-----|-----|
| **Background UI** | Preto translucido | #000000 (60% opacity) | Paineis, menus |
| **Texto Primario** | Branco sujo | #E8E4E0 | Titulos, informacoes |
| **Texto Secundario** | Cinza | #9A9590 | Subtextos, hints |
| **Accent Positivo** | Verde palido | #7CB342 | Sucesso, progresso |
| **Accent Negativo** | Vermelho escuro | #C62828 | Perigo, dano |
| **Accent Neutro** | Amarelo queimado | #F9A825 | Avisos, atencao |
| **O2/Stamina** | Azul claro | #4FC3F7 | Barra de oxigenio |
| **HP** | Vermelho sangue | #B71C1C | Barra de vida |

### Cores das Chaves e Portas

| Cor | Hex | Visual |
|-----|-----|--------|
| Vermelha | #E53935 | Saturada, vibrante |
| Azul | #1E88E5 | Media saturacao |
| Verde | #43A047 | Media saturacao |
| Amarela | #FDD835 | Saturada |
| Roxa | #8E24AA | Media saturacao |

---

## 3. Tipografia

### Fontes

| Tipo | Fonte | Uso |
|------|-------|-----|
| **Display** | Creepster / Horror-style | Logo, titulos de tela |
| **Headlines** | Oswald Bold | Titulos de secao |
| **Body** | Source Sans Pro | Texto corrido |
| **UI Numbers** | Roboto Mono | Timers, contadores |

### Hierarquia

```
TITULO DE TELA    → 48px, Display, MAIUSCULAS
Titulo de Secao   → 32px, Headlines, Title Case
Subtitulo         → 24px, Body Bold
Texto Normal      → 18px, Body Regular
Texto Pequeno     → 14px, Body Light
HUD Numbers       → 20px, UI Numbers Bold
```

---

## 4. Layout Mobile-First

### Thumb Zones (Zonas de Alcance)

```
MAPEAMENTO DE ZONAS - MOBILE (Portrait Reference)
=================================================

           ZONA DIFICIL
    ┌─────────────────────────┐
    │    (Informacoes HUD)    │  ← Status, minimapa
    │                         │
    ├─────────────────────────┤
    │                         │
    │      ZONA MEDIA         │  ← Area de jogo
    │   (Visualizacao)        │     (nao interativo)
    │                         │
    │                         │
    ├─────────────────────────┤
    │                         │
    │     ZONA NATURAL        │  ← Controles principais
    │   (Controles Touch)     │     Joystick + Botoes
    │                         │
    └─────────────────────────┘
         MAO ESQUERDA              MAO DIREITA


MOBILE LANDSCAPE (Durante Jogo)
===============================

┌─────────────────────────────────────────────────────────┐
│ [O2] [HP]                              [Objetivos]      │
│                                                         │
│                                                         │
│   ◯                                              [Q]    │
│  ╱│╲                    GAMEPLAY                        │
│   │                       AREA                   [E]    │
│  ╱ ╲                                                    │
│ Joystick                                     Habilidade │
│                                              Interagir  │
└─────────────────────────────────────────────────────────┘
```

### Touch Target Sizes

| Elemento | Tamanho Minimo | Tamanho Ideal |
|----------|----------------|---------------|
| Botao Primario | 44x44 px | 56x56 px |
| Botao Secundario | 36x36 px | 44x44 px |
| Joystick | 100x100 px | 120x120 px |
| Icones de Acao | 48x48 px | 64x64 px |

---

## 5. HUD - Survivors (Criancas)

### Layout Completo

```
SURVIVOR HUD - MOBILE
=====================

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────┐                           ┌──────────────┐   │
│  │ O2: 78%  │                           │ OBJETIVOS    │   │
│  │ ████████░░│                          │              │   │
│  │ HP: 100% │                           │ Chaves: 2/5  │   │
│  │ ██████████│                          │ 🔴✓ 🔵✓ 🟢░   │   │
│  └──────────┘                           │ 🟡░ 🟣░      │   │
│                                          │              │   │
│                                          │ Puzzle: 1/5  │   │
│                                          └──────────────┘   │
│                                                             │
│                                                             │
│                      GAMEPLAY AREA                          │
│                                                             │
│                                                             │
│   ┌─────┐                                                   │
│   │  ◯  │                                     ┌────┐       │
│   │ ╱│╲ │                                     │ Q  │       │
│   │  │  │                                     └────┘       │
│   │ ╱ ╲ │                                     ┌────┐       │
│   └─────┘                                     │ E  │       │
│  Joystick                                     └────┘       │
│                                              Habilidade    │
│                                              Interagir     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

ESTADOS DA BARRA DE O2
======================

100-80%:  ██████████  Azul (#4FC3F7)
 80-50%:  ████████░░  Azul
 50-20%:  █████░░░░░  Amarelo (#F9A825) + Pulse lento
 20-0%:   ██░░░░░░░░  Vermelho (#C62828) + Pulse rapido + Borda vermelha

INDICADOR DE CORRIDA
====================

Pode correr:     O2 > 50%  → Icone de corrida normal
Nao pode correr: O2 < 50%  → Icone de corrida com X vermelho
Corrida ativa:   O2 > 80%  → Borda brilhante no joystick
```

### Elementos do HUD Survivor

| Elemento | Posicao | Visibilidade | Descricao |
|----------|---------|--------------|-----------|
| **Barra O2** | Top-left | Sempre | Azul, diminui ao correr/no saco |
| **Barra HP** | Top-left (abaixo O2) | Quando relevante | So aparece se HP < 100% |
| **Chaves** | Top-right | Sempre | Icones das 5 cores com check |
| **Puzzle** | Top-right | Sempre | Contador de pecas X/5 |
| **Classe** | Top-left (icone) | Sempre | Icone da classe atual |
| **Cooldown** | Bottom-right | Quando ativo | Timer circular da habilidade |
| **Joystick** | Bottom-left | Sempre (mobile) | Controle de movimento |
| **Botoes Acao** | Bottom-right | Sempre | Q (habilidade) + E (interagir) |

### Indicadores Contextuais

```
INDICADOR DE PROXIMIDADE DO SACKMAN
===================================

Longe (30+ studs):    Nada
Medio (20-30 studs):  Borda da tela levemente vermelha
Perto (10-20 studs):  Heartbeat visual (pulso na tela)
Muito perto (<10):    Tela treme levemente + vermelho intenso


INDICADOR DE INTERACAO
======================

Quando perto de objeto interativo:

  ┌─────────────────┐
  │    [E] Abrir    │  ← Aparece acima do objeto
  │    Armario      │
  └─────────────────┘

  ┌─────────────────┐
  │  [E] Resgatar   │  ← Quando perto de aliado
  │     Nina        │
  │   ████████░░    │  ← Barra de progresso
  └─────────────────┘
```

---

## 6. HUD - Sackman (Hunter)

### Layout Completo

```
SACKMAN HUD - MOBILE
====================

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────┐                       ┌──────────────┐   │
│  │ COLLECTOR    │                       │ CAPTURADOS   │   │
│  │ ⚫⚫⚫⚫⚫⚫⚫      │                       │              │   │
│  │ Cooldown: --  │                       │ 2/7 👤👤░░░░░  │   │
│  └──────────────┘                       │              │   │
│                                          │ Na Prisao: 1 │   │
│                                          └──────────────┘   │
│                                                             │
│                                                             │
│                      GAMEPLAY AREA                          │
│                                                             │
│            ┌─────────────────────────────┐                 │
│            │     INDICADOR DE CAPTURA     │                 │
│            │   [░░░░░░░░░░░░░░░░░░░░░░░]  │                 │
│            │      ^ Fora do range         │                 │
│            └─────────────────────────────┘                 │
│                                                             │
│   ┌─────┐                                                   │
│   │  ◯  │                                     ┌────┐       │
│   │ ╱│╲ │                                     │RMB │       │
│   │  │  │                                     └────┘       │
│   │ ╱ ╲ │                                     ┌────┐       │
│   └─────┘                                     │LMB │       │
│  Joystick                                     └────┘       │
│                                              Poder         │
│                                              Captura       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Sistema de Captura - UI

```
INDICADOR DE CAPTURA (Skill-Based)
==================================

FORA DO RANGE (>4 studs):
┌─────────────────────────────────────┐
│  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]   │  Barra cinza vazia
│             Aproxime-se              │
└─────────────────────────────────────┘

ENTRANDO NO RANGE (4-6 studs):
┌─────────────────────────────────────┐
│  [████████░░░░░░░░░░░░░░░░░░░░░░]   │  Barra enchendo (amarela)
│             Aproximando...           │
└─────────────────────────────────────┘

NO RANGE - JANELA DE TIMING (4 studs):
┌─────────────────────────────────────┐
│                                     │
│  ━━━━━━━━━━━[███]━━━━━━━━━━━        │  Indicador move da esquerda
│             ▲                        │  para direita
│        ZONA VERDE                    │
│     (Click aqui!)                    │
│                                     │
│  ══════════[█]══════════            │  Centro = Perfeito (dourado)
│                                     │
└─────────────────────────────────────┘

RESULTADOS:

✓ CAPTURA PERFEITA:
  - Flash dourado na tela
  - Som satisfatorio
  - "+1s Stun" aparece

✓ CAPTURA NORMAL:
  - Flash verde
  - Som de sucesso
  - Survivor capturado

✗ FALHA:
  - Flash vermelho
  - Som de erro
  - "Cooldown 2s" aparece
  - Sackman fica 20% mais lento
```

### Elementos do HUD Sackman

| Elemento | Posicao | Visibilidade | Descricao |
|----------|---------|--------------|-----------|
| **Classe/Poder** | Top-left | Sempre | Nome + icone do poder |
| **Cooldown Poder** | Top-left | Quando ativo | Timer do poder especial |
| **Capturados** | Top-right | Sempre | Contador X/7 ou X/16 |
| **Na Prisao** | Top-right | Sempre | Quantos na prisao |
| **Indicador Captura** | Centro-baixo | Perto de survivor | Barra de timing |
| **Deteccao** | Bordas | Quando detecta | Direcao do barulho |
| **Joystick** | Bottom-left | Sempre (mobile) | Movimento |
| **Botao Captura** | Bottom-right | Sempre | LMB / Tap |
| **Botao Poder** | Bottom-right | Sempre | RMB / Hold |

### Indicadores de Deteccao

```
INDICADOR DE BARULHO
====================

Quando survivor faz barulho (corre, interage):

        ┌───┐
        │ ! │ ← Aparece na direcao do som
        └───┘
          │
    ◄─────┼─────►
          │
        SACKMAN

Intensidade do indicador:
- Fraco (andando): Branco translucido
- Medio (correndo): Amarelo
- Forte (interacao): Vermelho pulsante


INDICADOR DE VISAO
==================

Quando survivor esta na linha de visao:

  ┌──────────────────────┐
  │  👁 SURVIVOR VISTO   │
  │      PERSIGA!        │
  └──────────────────────┘

  + Contorno vermelho no survivor
  + Som de "alerta"
```

---

## 7. Estados Especiais - UI

### Capturado (No Saco)

```
TELA DO SURVIVOR CAPTURADO
==========================

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────────────────────────────┐                  │
│  │          VOCE FOI CAPTURADO!          │                  │
│  │                                        │                  │
│  │           O2: 45%                      │                  │
│  │        ████████░░░░░░                  │                  │
│  │                                        │                  │
│  │    Aperte [SPACE] rapidamente          │                  │
│  │        para tentar fugir!              │                  │
│  │                                        │                  │
│  │         Progresso: 35%                 │                  │
│  │         ███████░░░░░░░░░               │                  │
│  └──────────────────────────────────────┘                  │
│                                                             │
│                  VISAO ESCURECIDA                           │
│              (mal da pra ver o mapa)                        │
│                                                             │
│                                                             │
│           ┌─────────────────────┐                          │
│           │    [SPACE/TAP]      │                          │
│           │     STRUGGLE!       │                          │
│           └─────────────────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Desmaiado

```
TELA DO SURVIVOR DESMAIADO
==========================

┌─────────────────────────────────────────────────────────────┐
│█████████████████████████████████████████████████████████████│
│████                                                    █████│
│████        VOCE DESMAIOU!                              █████│
│████                                                    █████│
│████        HP: 78%                                     █████│
│████        ████████████░░░░░                           █████│
│████                                                    █████│
│████        Esperando resgate...                        █████│
│████                                                    █████│
│████   ┌─────────────────────────────────┐             █████│
│████   │                                 │             █████│
│████   │    (Visao turva, so ve quem     │             █████│
│████   │     esta MUITO perto)           │             █████│
│████   │                                 │             █████│
│████   └─────────────────────────────────┘             █████│
│████                                                    █████│
│█████████████████████████████████████████████████████████████│
└─────────────────────────────────────────────────────────────┘

Efeitos visuais:
- Bordas muito escuras (vignette pesado)
- Centro levemente visivel
- Pulso lento na tela (heartbeat)
- HP diminuindo visivelmente
```

### Resgatando Aliado

```
TELA DE RESGATE
===============

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│              [ALIADO DESMAIADO]                             │
│                    👤                                        │
│                   Nina                                       │
│                                                             │
│         ┌────────────────────────────┐                     │
│         │   [1] Abrir Saco           │                     │
│         │   ███████░░░░░░  3s        │                     │
│         │                            │                     │
│         │   [2] Reanimar             │  ← Proximo passo    │
│         │   ░░░░░░░░░░░░░  5s        │                     │
│         │                            │                     │
│         │   [3] Ajudar Levantar      │                     │
│         │   ░░░░░░░░░░░░░  3s        │                     │
│         └────────────────────────────┘                     │
│                                                             │
│            Segure [E] para continuar                        │
│                                                             │
│            ! Soltar cancela o progresso                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Telas do Jogo

### 8.1 Menu Principal

```
MENU PRINCIPAL
==============

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                      ╔═══════════╗                         │
│                      ║ SACKMAN   ║                         │
│                      ╚═══════════╝                         │
│                                                             │
│                 (Background: Celeiro com                    │
│                  Sackman ao fundo, subtil)                  │
│                                                             │
│                                                             │
│               ┌─────────────────────┐                      │
│               │       JOGAR         │                      │
│               └─────────────────────┘                      │
│                                                             │
│               ┌─────────────────────┐                      │
│               │    PERSONAGENS      │                      │
│               └─────────────────────┘                      │
│                                                             │
│               ┌─────────────────────┐                      │
│               │       LOJA          │                      │
│               └─────────────────────┘                      │
│                                                             │
│               ┌─────────────────────┐                      │
│               │    CONFIGURACOES    │                      │
│               └─────────────────────┘                      │
│                                                             │
│  [?] Ajuda                              [Volume] [Creditos] │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Selecao de Modo

```
SELECAO DE MODO
===============

┌─────────────────────────────────────────────────────────────┐
│                     ESCOLHA O MODO                          │
│                                                             │
│   ┌───────────────────────┐   ┌───────────────────────┐   │
│   │                       │   │                       │   │
│   │      CLASSICO         │   │        CAOS           │   │
│   │        1v7            │   │        2v16           │   │
│   │                       │   │                       │   │
│   │   ┌───────────────┐   │   │   ┌───────────────┐   │   │
│   │   │      👤       │   │   │   │   👤👤 vs    │   │   │
│   │   │    vs 👥x7    │   │   │   │    👥x16     │   │   │
│   │   └───────────────┘   │   │   └───────────────┘   │   │
│   │                       │   │                       │   │
│   │   12-15 minutos       │   │   15-20 minutos       │   │
│   │   Partida Padrao      │   │   Caos Total          │   │
│   │                       │   │                       │   │
│   │  ┌─────────────────┐  │   │  ┌─────────────────┐  │   │
│   │  │     JOGAR       │  │   │  │     JOGAR       │  │   │
│   │  └─────────────────┘  │   │  └─────────────────┘  │   │
│   └───────────────────────┘   └───────────────────────┘   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐ │
│   │ PREFERENCIA DE ROLE:  ( ) Survivor  ( ) Sackman  (•) Qualquer │
│   └─────────────────────────────────────────────────────┘ │
│                                                             │
│                        [< VOLTAR]                           │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Selecao de Classe

```
SELECAO DE CLASSE - SURVIVOR
============================

┌─────────────────────────────────────────────────────────────┐
│                   ESCOLHA SUA CLASSE                        │
│                                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐         │
│  │Scout│ │Mech │ │Medic│ │Athlt│ │Trick│ │Lead │         │
│  │ 👁  │ │ 🔧  │ │ 💚  │ │ 🏃  │ │ 🎭  │ │ 📢  │         │
│  │Lila │ │Guto │ │Nina │ │Davi │ │Zoe  │ │Max  │         │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘         │
│     ▲                                                       │
│     │ SELECIONADO                                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SCOUT - LILA                                       │   │
│  │                                                     │   │
│  │  "A exploradora. Ve o perigo antes que ele chegue." │   │
│  │                                                     │   │
│  │  HABILIDADE: Quick Peek                             │   │
│  │  Ve a aura do Sackman por 3 segundos                │   │
│  │  Cooldown: 30s                                      │   │
│  │                                                     │   │
│  │  STATS:                                             │   │
│  │  Velocidade: ████░░  Media                          │   │
│  │  Reparo:     ████░░  Media                          │   │
│  │  Stealth:    ██████  Alta                           │   │
│  │  HP:         ████░░  2 Hits                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────┐        ┌────────────────────┐      │
│  │      VOLTAR        │        │     CONFIRMAR      │      │
│  └────────────────────┘        └────────────────────┘      │
└─────────────────────────────────────────────────────────────┘


SELECAO DE CLASSE - SACKMAN
===========================

┌─────────────────────────────────────────────────────────────┐
│                   ESCOLHA SEU SACKMAN                       │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐│
│  │Collector│ │ Stalker │ │  Brute  │ │ Trapper │ │ Mimic ││
│  │   🎒    │ │   👻    │ │   💪    │ │   🪤    │ │  🎭   ││
│  │  ★★☆   │ │  ★★★   │ │  ★★★   │ │  ★★★★  │ │ ★★★★★ ││
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────┘│
│       ▲                                                     │
│       │ SELECIONADO                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  THE COLLECTOR - SACKMAN CLASSICO                   │   │
│  │                                                     │   │
│  │  "O cacador original. Versátil e letal."            │   │
│  │                                                     │   │
│  │  PODER: Bag Toss                                    │   │
│  │  Joga sacos a distancia (15 studs)                  │   │
│  │  Se acertar, captura instantanea                    │   │
│  │  Cooldown: 8s por saco (maximo 2)                   │   │
│  │                                                     │   │
│  │  DIFICULDADE: ★★☆☆☆ (Iniciante)                    │   │
│  │                                                     │   │
│  │  STATS:                                             │   │
│  │  Velocidade: ████░░  Media                          │   │
│  │  Ataque:     ████░░  Media                          │   │
│  │  Deteccao:   ████░░  Media                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────┐        ┌────────────────────┐      │
│  │      VOLTAR        │        │     CONFIRMAR      │      │
│  └────────────────────┘        └────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 8.4 Lobby de Partida

```
LOBBY - ESPERANDO JOGADORES
===========================

┌─────────────────────────────────────────────────────────────┐
│                  MODO CLASSICO - 1v7                        │
│                                                             │
│  SACKMAN                         SURVIVORS                  │
│  ┌─────────┐                     ┌─────────┐ ┌─────────┐  │
│  │         │                     │  Scout  │ │  Medic  │  │
│  │ Player1 │                     │ Player2 │ │ Player3 │  │
│  │Collector│                     │  Lila   │ │  Nina   │  │
│  │  ★★☆   │                     │  PRONTO │ │ PRONTO  │  │
│  └─────────┘                     └─────────┘ └─────────┘  │
│                                   ┌─────────┐ ┌─────────┐  │
│                                   │ Athlete │ │ Mechanic│  │
│                                   │ Player4 │ │ Player5 │  │
│                                   │  Davi   │ │  Guto   │  │
│                                   │  PRONTO │ │  ...    │  │
│                                   └─────────┘ └─────────┘  │
│                                   ┌─────────┐ ┌─────────┐  │
│                                   │   ???   │ │   ???   │  │
│                                   │ Vazio   │ │ Vazio   │  │
│                                   │         │ │         │  │
│                                   └─────────┘ └─────────┘  │
│                                   ┌─────────┐              │
│                                   │   ???   │              │
│                                   │ Vazio   │              │
│                                   └─────────┘              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              JOGADORES: 5/8                          │   │
│  │              ████████████████░░░░░░░░                │   │
│  │              Iniciando em 45s...                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────┐        ┌────────────────────┐      │
│  │   MUDAR CLASSE     │        │      PRONTO        │      │
│  └────────────────────┘        └────────────────────┘      │
│                                                             │
│                      [SAIR DO LOBBY]                        │
└─────────────────────────────────────────────────────────────┘
```

### 8.5 Loading / Transicao

```
TELA DE LOADING
===============

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                                                             │
│                      ╔═══════════╗                         │
│                      ║ SACKMAN   ║                         │
│                      ╚═══════════╝                         │
│                                                             │
│                                                             │
│            ┌───────────────────────────────┐               │
│            │  "O Sackman sempre observa..." │               │
│            │         - Lore hint            │               │
│            └───────────────────────────────┘               │
│                                                             │
│                                                             │
│               ████████████████████░░░░░░░                   │
│                    Carregando... 78%                        │
│                                                             │
│                                                             │
│            ┌───────────────────────────────┐               │
│            │  DICA: Correr consome O2!     │               │
│            │  Gerencie sua stamina.        │               │
│            └───────────────────────────────┘               │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.6 Tela de Resultado

```
TELA DE RESULTADO - SURVIVORS VENCEM
====================================

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                   ╔═══════════════════╗                    │
│                   ║  SURVIVORS VENCEM! ║                    │
│                   ╚═══════════════════╝                    │
│                                                             │
│         ESCAPARAM: 5/7          CAPTURADOS: 2/7            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PLACAR                                             │   │
│  │                                                     │   │
│  │  #1 Player3 (Nina)     1250 XP  - 2 Resgates       │   │
│  │  #2 Player2 (Lila)     1100 XP  - First Escape     │   │
│  │  #3 Player4 (Davi)      950 XP  - 3 Chaves         │   │
│  │  #4 Player5 (Guto)      900 XP  - Puzzle Master    │   │
│  │  #5 Player6 (Zoe)       850 XP  - Escaped          │   │
│  │  ──────────────────────────────────────────────    │   │
│  │  X  Player7 (Max)       400 XP  - Capturado        │   │
│  │  X  Player8 (Lila)      350 XP  - Capturado        │   │
│  │  ──────────────────────────────────────────────    │   │
│  │  👹 Player1 (Collector) 600 XP  - 2 Capturas       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SEUS GANHOS                                        │   │
│  │                                                     │   │
│  │  +1250 XP          Nivel: 12 → 13                   │   │
│  │  +50 Coins         Total: 1,250                     │   │
│  │  Badge: "First Aid Master"                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────┐        ┌────────────────────┐      │
│  │   JOGAR NOVAMENTE  │        │   MENU PRINCIPAL   │      │
│  └────────────────────┘        └────────────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘


TELA DE RESULTADO - SACKMAN VENCE
=================================

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                   ╔═══════════════════╗                    │
│                   ║   SACKMAN VENCE!   ║                    │
│                   ╚═══════════════════╝                    │
│                                                             │
│                (Silhueta do Sackman vitoriosa)              │
│                                                             │
│         ESCAPARAM: 2/7          CAPTURADOS: 5/7            │
│                                                             │
│  ... (resto similar)                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Componentes UI

### Botoes

```
ESTILOS DE BOTAO
================

PRIMARIO (Acoes principais):
┌─────────────────────────────┐
│                             │
│          JOGAR              │  Background: #7CB342
│                             │  Border: 2px #5B8C2C
└─────────────────────────────┘  Text: #FFFFFF

SECUNDARIO (Acoes secundarias):
┌─────────────────────────────┐
│                             │
│          VOLTAR             │  Background: #424242
│                             │  Border: 2px #303030
└─────────────────────────────┘  Text: #E8E4E0

PERIGO (Acoes destrutivas):
┌─────────────────────────────┐
│                             │
│       SAIR DO LOBBY         │  Background: #C62828
│                             │  Border: 2px #8B1C1C
└─────────────────────────────┘  Text: #FFFFFF

DISABLED:
┌─────────────────────────────┐
│                             │
│          AGUARDE            │  Background: #616161
│                             │  Border: none
└─────────────────────────────┘  Text: #9E9E9E
```

### Barras de Progresso

```
ESTILOS DE BARRA
================

PADRAO:
Background: #424242
Fill: Cor correspondente
Border-radius: 4px

O2/STAMINA:
┌─────────────────────────────┐
│████████████████░░░░░░░░░░░░ │  80%
└─────────────────────────────┘
Fill: #4FC3F7 (Azul)

HP:
┌─────────────────────────────┐
│██████████░░░░░░░░░░░░░░░░░░ │  40%
└─────────────────────────────┘
Fill: #C62828 (Vermelho)

PROGRESSO/LOADING:
┌─────────────────────────────┐
│█████████████████████░░░░░░░ │  75%
└─────────────────────────────┘
Fill: #7CB342 (Verde) com animacao

INTERACAO (Hold E):
┌─────────────────────────────┐
│██████████████░░░░░░░░░░░░░░ │  Segurando...
└─────────────────────────────┘
Fill: #F9A825 (Amarelo) com glow
```

### Icones

| Acao | Icone | Descricao |
|------|-------|-----------|
| Interagir | [E] | Letra E em circulo |
| Habilidade | [Q] | Letra Q em quadrado |
| Correr | 🏃 | Silhueta correndo |
| Agachar | ↓ | Seta para baixo |
| Lanterna | 🔦 | Lanterna simples |
| Chave | 🔑 | Chave colorida |
| Puzzle | 🧩 | Peca de puzzle |
| Alerta | ⚠️ | Triangulo |
| Capturado | 👜 | Saco |
| Resgate | 🤝 | Maos unidas |

---

## 10. Animacoes e Transicoes

### Principios

| Tipo | Duracao | Easing | Uso |
|------|---------|--------|-----|
| **Micro** | 100-200ms | ease-out | Botoes, hover |
| **Feedback** | 200-300ms | ease-in-out | Barras, progress |
| **Transicao** | 300-500ms | ease-in-out | Telas, paineis |
| **Dramatica** | 500-1000ms | custom | Resultados, mortes |

### Animacoes Especificas

```
CAPTURA (Sackman acerta timing):
================================
0ms:     Flash branco rapido
50ms:    Tela escurece 50%
100ms:   Texto "CAPTURADO!" aparece (scale 0 → 1)
300ms:   Transicao para visao do saco
500ms:   UI de struggle aparece

RESGATE (Aliado salva):
=======================
0ms:     Som de liberacao
100ms:   Flash verde suave
200ms:   Tela clareia gradualmente
400ms:   "RESGATADO!" aparece
600ms:   HUD normal retorna

FUGA (Survivor escapa):
=======================
0ms:     Som de vitoria
100ms:   Flash dourado
200ms:   "ESCAPED!" em grande
500ms:   Fade out para resultado

MORTE (HP chega a 0):
=====================
0ms:     Tela congela
100ms:   Efeito de sangue nas bordas (sutil)
200ms:   Fade to black lento
500ms:   "ELIMINADO" aparece
1000ms:  Transicao para espectador
```

---

## 11. Sistema de Notificacoes

### Tipos de Notificacao

```
EVENTO DE JOGO (Top-center):
┌─────────────────────────────────────┐
│  🔑 Player2 encontrou a CHAVE AZUL  │
└─────────────────────────────────────┘
Duracao: 3s
Prioridade: Media

ALERTA URGENTE (Top-center, maior):
┌─────────────────────────────────────┐
│ ⚠️ SAIDA ABERTA! Corram para saida 2! │
└─────────────────────────────────────┘
Duracao: 5s
Prioridade: Alta

CAPTURA (Center-screen):
┌─────────────────────────────────────┐
│      👜 Player3 foi CAPTURADO!      │
└─────────────────────────────────────┘
Duracao: 2s
Prioridade: Alta

PROGRESSO (Bottom-right, pequeno):
┌─────────────────────────────────────┐
│  +100 XP                            │
└─────────────────────────────────────┘
Duracao: 2s
Prioridade: Baixa
```

### Hierarquia de Notificacoes

| Prioridade | Tipo | Comportamento |
|------------|------|---------------|
| **Critica** | Morte, Captura | Interrompe outras, center |
| **Alta** | Saida aberta, Objetivo | Stack no top, persiste |
| **Media** | Chave encontrada, Resgate | Stack no top, fade |
| **Baixa** | XP, Achievements | Corner, fade rapido |

---

## 12. Acessibilidade

### Opcoes de Acessibilidade

| Opcao | Default | Descricao |
|-------|---------|-----------|
| **Legendas** | ON | Descricao de sons importantes |
| **Tamanho de Texto** | 100% | 75% a 150% |
| **Alto Contraste** | OFF | Aumenta contraste de cores |
| **Daltonismo** | OFF | Filtros para diferentes tipos |
| **Reducao de Movimento** | OFF | Remove screen shake |
| **Aviso de Jumpscare** | OFF | Mostra aviso antes |

### Indicadores Visuais para Audio

```
LEGENDA DE SONS
===============

Passos proximos:     [👣 PASSOS - PERTO]
Respiracao Sackman:  [💨 RESPIRACAO - ATRAS]
Barulho de corrida:  [🏃 ALGUEM CORRENDO - ESQUERDA]
Alarme de saida:     [🚨 ALARME - SAIDA ABERTA]
Grito de captura:    [😱 GRITO - Player3]
```

### Daltonismo

| Modo | Ajustes |
|------|---------|
| **Deuteranopia** | Verde → Azul, Vermelho → Amarelo |
| **Protanopia** | Vermelho → Amarelo, Verde → Azul |
| **Tritanopia** | Azul → Rosa, Amarelo → Vermelho |

Chaves usam **formas** alem de cores:
- Vermelha: Circulo
- Azul: Quadrado
- Verde: Triangulo
- Amarela: Estrela
- Roxa: Hexagono

---

## 13. Responsividade

### Breakpoints

| Dispositivo | Resolucao | Ajustes |
|-------------|-----------|---------|
| **Mobile Portrait** | < 480px | Nao suportado (forcar landscape) |
| **Mobile Landscape** | 480-768px | Layout mobile, botoes grandes |
| **Tablet** | 768-1024px | Layout hibrido |
| **Desktop** | > 1024px | Layout completo, mouse/teclado |

### Ajustes por Plataforma

```
MOBILE:
├── Joystick virtual (esquerda)
├── Botoes de acao (direita)
├── HUD compacto
├── Tap para interagir
└── Swipe para olhar

TABLET:
├── Joystick virtual (opcional)
├── Botoes maiores
├── HUD semi-expandido
└── Suporte a controle

DESKTOP:
├── WASD + Mouse
├── Teclas para acoes
├── HUD completo
├── Mouse para menus
└── Suporte a teclado completo
```

---

## 14. Fluxo de Usuario

### Primeiro Acesso

```
[1] Menu Principal
      │
      ▼
[2] Tutorial Obrigatorio (skip apos primeira vez)
      │
      ├── Movimento basico
      ├── Uso de lanterna
      ├── Sistema de O2
      ├── Interacao/Chaves
      └── Encontro com Sackman (scripted)
      │
      ▼
[3] Selecao de Modo
      │
      ▼
[4] Selecao de Classe
      │
      ▼
[5] Queue/Matchmaking
      │
      ▼
[6] Lobby
      │
      ▼
[7] Partida
```

### Fluxo de Partida

```
[1] Loading Screen (Dicas)
      │
      ▼
[2] Spawn (10-15s de grace period)
      │
      ▼
[3] Gameplay Loop
      │
      ├── [Se Capturado] → Tela de Struggle → [Se Liberado] → Gameplay
      │                                     → [Se Eliminado] → Espectador
      │
      ├── [Se Completou Objetivo] → Notificacao → Gameplay
      │
      └── [Se Escapou] → Tela de Sucesso → Aguarda fim
      │
      ▼
[4] Fim de Partida (Timer ou todos capturados/escaparam)
      │
      ▼
[5] Tela de Resultado
      │
      ├── [Jogar Novamente] → Queue
      │
      └── [Menu Principal] → Menu
```

---

## 15. Prototipagem

### Wireframes Necessarios

1. [x] Menu Principal
2. [x] Selecao de Modo
3. [x] Selecao de Classe (Survivor)
4. [x] Selecao de Classe (Sackman)
5. [x] Lobby
6. [x] HUD Survivor
7. [x] HUD Sackman
8. [x] Tela de Captura
9. [x] Tela de Desmaiado
10. [x] Tela de Resgate
11. [x] Tela de Resultado

### Proximos Passos

| Fase | Entregavel | Responsavel |
|------|------------|-------------|
| 1 | Wireframes em alta fidelidade | UI/UX Designer |
| 2 | Style guide Roblox | UI/UX Designer |
| 3 | Assets de UI (icones, botoes) | UI/UX Designer |
| 4 | Implementacao da UI | Lua Scripter |
| 5 | Testes de usabilidade | QA |

---

## Resumo Executivo

| Aspecto | Decisao |
|---------|---------|
| **Abordagem** | Mobile-First com suporte Desktop |
| **Estilo** | Minimalista, horror atmosferico |
| **HUD** | Contextual, aparece quando necessario |
| **Controles Mobile** | Joystick virtual + botoes de acao |
| **Acessibilidade** | Completa (legendas, daltonismo, etc) |
| **Prioridade MVP** | HUD funcional + Menus basicos |

---

*UI/UX Design Document criado por @ui-ux-designer (Pixel) em 2026-01-28*
*Squad: roblox-game-studio*
*Versao: 1.0.0*
