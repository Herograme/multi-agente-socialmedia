# Systems Specification Document: Sackman

## 1. Sistema de Oxigenio (O2)

### 1.1 Configuracao

```lua
--!strict

export type O2Config = {
    -- Valores maximos
    o2_maximo: number,
    hp_maximo: number,

    -- Consumo de O2
    consumo_no_saco: number,        -- Sendo carregado
    consumo_na_prisao: number,      -- Largado na prisao
    consumo_correndo: number,       -- Ao correr
    consumo_maximo_corrida: number, -- % maximo que corrida pode usar

    -- Recuperacao
    recuperacao_parado: number,     -- Por segundo parado
    recuperacao_andando: number,    -- Por segundo andando

    -- Limites
    minimo_para_correr: number,     -- % para poder correr novamente

    -- Desmaiado
    consumo_hp_desmaiado: number,   -- HP/s quando desmaiado
}

local O2Config: O2Config = {
    o2_maximo = 100,
    hp_maximo = 100,

    consumo_no_saco = 5,          -- 20s para desmaiar
    consumo_na_prisao = 3,        -- 33s para desmaiar
    consumo_correndo = 2,         -- Por segundo
    consumo_maximo_corrida = 20,  -- Corrida para em 80%

    recuperacao_parado = 3,       -- 33s para recuperar 100%
    recuperacao_andando = 1,      -- 100s para recuperar 100%

    minimo_para_correr = 50,      -- Precisa 50% para correr

    consumo_hp_desmaiado = 2,     -- 50s para morrer
}
```

### 1.2 Maquina de Estados O2

```
                    ┌──────────────┐
                    │    CHEIO     │
                    │   100-80%    │
                    └──────┬───────┘
                           │
          Correndo/No saco │
                           ▼
                    ┌──────────────┐
                    │   NORMAL     │
                    │   80-50%     │
                    └──────┬───────┘
                           │
                Continua consumindo
                           ▼
                    ┌──────────────┐
                    │   CANSADO    │◄────── Corrida PARA
                    │   50-20%     │        automaticamente
                    └──────┬───────┘
                           │
              Ainda no saco│
                           ▼
                    ┌──────────────┐
                    │  SEM FOLEGO  │
                    │   20-1%      │
                    └──────┬───────┘
                           │
                      O2 = 0%
                           ▼
                    ┌──────────────┐
                    │  DESMAIADO   │──────► HP comeca a cair
                    │    O2 = 0    │
                    └──────┬───────┘
                           │
                      HP = 0%
                           ▼
                    ┌──────────────┐
                    │  ELIMINADO   │
                    └──────────────┘
```

### 1.3 Interface do Sistema

```lua
--!strict

export type O2State = "Full" | "Normal" | "Tired" | "Breathless" | "Desmaiado" | "Eliminated"

export type O2Data = {
    current: number,
    max: number,
    state: O2State,
    isRunning: boolean,
    canRun: boolean,
    hp: number,
    hpMax: number,
}

export type O2Service = {
    -- Getters
    GetO2: (player: Player) -> number,
    GetO2Data: (player: Player) -> O2Data,
    GetState: (player: Player) -> O2State,
    CanRun: (player: Player) -> boolean,
    IsDesmaiado: (player: Player) -> boolean,

    -- Setters
    SetO2: (player: Player, value: number) -> (),
    AddO2: (player: Player, amount: number) -> (),
    RemoveO2: (player: Player, amount: number) -> (),

    -- Actions
    StartRunning: (player: Player) -> boolean,
    StopRunning: (player: Player) -> (),
    StartSacoDrain: (player: Player) -> (),
    StopSacoDrain: (player: Player) -> (),
    StartPrisaoDrain: (player: Player) -> (),
    StopPrisaoDrain: (player: Player) -> (),
    StartHPDrain: (player: Player) -> (),
    StopHPDrain: (player: Player) -> (),

    -- Events
    OnO2Changed: Signal<Player, number, O2State>,
    OnStateChanged: Signal<Player, O2State, O2State>,
    OnDesmaiado: Signal<Player>,
    OnEliminated: Signal<Player>,
}
```

### 1.4 Logica de Update (Server)

```lua
--!strict

local function updateO2(player: Player, dt: number)
    local data = getO2Data(player)
    if not data then return end

    local state = getPlayerState(player)
    local deltaO2 = 0

    -- Consumo baseado no estado
    if state == "Captured" then
        -- No saco sendo carregado
        deltaO2 = -O2Config.consumo_no_saco * dt

    elseif state == "Imprisoned" then
        -- Na prisao
        deltaO2 = -O2Config.consumo_na_prisao * dt

    elseif state == "Running" then
        -- Correndo
        local maxConsumption = data.max * (O2Config.consumo_maximo_corrida / 100)
        local consumed = data.max - data.current

        if consumed < maxConsumption then
            deltaO2 = -O2Config.consumo_correndo * dt
        else
            -- Hit max consumption, force stop running
            stopRunning(player)
        end

    elseif state == "Alive" or state == "Hiding" then
        -- Recuperando
        if isMoving(player) then
            deltaO2 = O2Config.recuperacao_andando * dt
        else
            deltaO2 = O2Config.recuperacao_parado * dt
        end
    end

    -- Apply delta
    local newO2 = math.clamp(data.current + deltaO2, 0, data.max)
    setO2(player, newO2)

    -- Check for state transitions
    if newO2 <= 0 and data.state ~= "Desmaiado" then
        transitionToDesmaiado(player)
    end

    -- Check can run
    if newO2 < O2Config.minimo_para_correr then
        data.canRun = false
    elseif newO2 >= O2Config.minimo_para_correr then
        data.canRun = true
    end
end

local function updateHP(player: Player, dt: number)
    local data = getO2Data(player)
    if not data then return end

    if getPlayerState(player) ~= "Desmaiado" then return end

    local deltaHP = -O2Config.consumo_hp_desmaiado * dt
    local newHP = math.clamp(data.hp + deltaHP, 0, data.hpMax)
    setHP(player, newHP)

    if newHP <= 0 then
        eliminatePlayer(player)
    end
end
```

---

## 2. Sistema de Captura

### 2.1 Configuracao

```lua
--!strict

export type CaptureConfig = {
    -- Distancia
    distancia_captura: number,      -- Studs para ativar captura

    -- Timing
    janela_timing: number,          -- Segundos da janela
    zona_perfeita: number,          -- Segundos da zona perfeita

    -- Resultados
    captura_perfeita_bonus: number, -- Stun extra (segundos)

    -- Falha
    falha_cooldown: number,         -- Cooldown apos falha
    falha_slowdown: number,         -- Multiplicador de velocidade
    falha_slowdown_duracao: number, -- Duracao do slowdown

    -- Visual
    indicador_range_start: number,  -- Distancia para mostrar indicador
}

local CaptureConfig: CaptureConfig = {
    distancia_captura = 4,
    janela_timing = 0.5,
    zona_perfeita = 0.15,
    captura_perfeita_bonus = 1,
    falha_cooldown = 2,
    falha_slowdown = 0.8,
    falha_slowdown_duracao = 1,
    indicador_range_start = 8,
}
```

### 2.2 Fluxo de Captura

```
SACKMAN                           SERVER                          SURVIVOR
   │                                │                                │
   │  Aproxima do survivor          │                                │
   │─────────────────────────────►  │                                │
   │                                │                                │
   │  Indicador de range aparece    │                                │
   │◄─────────────────────────────  │                                │
   │                                │                                │
   │  Entra no range (4 studs)      │                                │
   │─────────────────────────────►  │                                │
   │                                │                                │
   │  Janela de timing ativa        │                                │
   │◄─────────────────────────────  │                                │
   │                                │                                │
   │  Click (RequestCapture)        │                                │
   │─────────────────────────────►  │                                │
   │                                │                                │
   │                         Validate:                               │
   │                         - Rate limit                            │
   │                         - Is Sackman?                           │
   │                         - Target valid?                         │
   │                         - In range?                             │
   │                         - Timing OK?                            │
   │                                │                                │
   │                        ┌───────┴───────┐                       │
   │                        │               │                        │
   │                      SUCCESS         FAIL                       │
   │                        │               │                        │
   │                        ▼               ▼                        │
   │  CaptureExecuted       │      CaptureFailed                    │
   │◄───────────────────────┤      │                                │
   │                        │      │─────────►Cooldown + Slow       │
   │                        │                                        │
   │                        │  PlayerStateChanged                    │
   │                        │─────────────────────────────────────► │
   │                        │                                        │
   │                        │  StartO2Drain                          │
   │                        │─────────────────────────────────────► │
```

### 2.3 Calculo de Timing

```lua
--!strict

-- O timing vem do cliente como valor 0-1
-- 0.5 = centro perfeito
-- A janela se move da esquerda (0) para direita (1)

export type TimingResult = {
    success: boolean,
    perfect: boolean,
    accuracy: number,    -- 0-1, onde 1 = perfeito
    deviation: number,   -- Desvio do centro
}

local function calculateTiming(clientTiming: number): TimingResult
    -- Validate input
    local timing = math.clamp(clientTiming, 0, 1)

    -- Calculate deviation from center
    local deviation = math.abs(timing - 0.5)

    -- Perfect zone check
    local perfectThreshold = CaptureConfig.zona_perfeita / CaptureConfig.janela_timing
    local isPerfect = deviation <= perfectThreshold

    -- Success zone check (anything within the bar)
    local successThreshold = 0.4 -- 80% of the bar is "good"
    local isSuccess = deviation <= successThreshold

    -- Calculate accuracy (1 = perfect, 0 = edge)
    local accuracy = 1 - (deviation / 0.5)

    return {
        success = isSuccess,
        perfect = isPerfect,
        accuracy = accuracy,
        deviation = deviation,
    }
end
```

### 2.4 UI do Indicador de Captura (Client)

```lua
--!strict

-- Timing indicator que o Sackman ve
-- Barra que se move da esquerda para direita
-- Centro verde = zona de sucesso
-- Centro dourado = zona perfeita

export type CaptureIndicatorState = {
    visible: boolean,
    progress: number,       -- 0-1 posicao do indicador
    inRange: boolean,       -- Survivor esta no range
    targetUserId: number?,  -- Quem esta no range
}

local INDICATOR_SPEED = 2 -- Ciclos por segundo

local function updateIndicator(dt: number, state: CaptureIndicatorState)
    if not state.visible or not state.inRange then
        return
    end

    -- Move indicator left to right, then reset
    state.progress = (state.progress + dt * INDICATOR_SPEED) % 1

    -- Update UI
    updateIndicatorUI(state.progress)
end

local function getTimingValue(state: CaptureIndicatorState): number
    return state.progress
end
```

---

## 3. Sistema de Classes

### 3.1 Definicao de Classes - Survivors

```lua
--!strict

export type SurvivorAbility = {
    name: string,
    description: string,
    cooldown: number,
    duration: number?,
    isPassive: boolean,
    execute: (player: Player) -> boolean,
}

export type SurvivorClass = {
    id: string,
    name: string,
    characterName: string,
    description: string,

    -- Stats (multipliers, 1.0 = base)
    speed: number,
    repairSpeed: number,
    stealth: number,

    -- Ability
    ability: SurvivorAbility,

    -- Unlock
    unlockRequirement: string?,
    unlockCost: number?,
}

local SurvivorClasses: {[string]: SurvivorClass} = {
    Scout = {
        id = "scout",
        name = "Scout",
        characterName = "Lila",
        description = "A exploradora. Ve o perigo antes que ele chegue.",

        speed = 1.0,
        repairSpeed = 1.0,
        stealth = 1.2,

        ability = {
            name = "Quick Peek",
            description = "Ve a aura do Sackman por 3 segundos",
            cooldown = 30,
            duration = 3,
            isPassive = false,
            execute = function(player)
                -- Reveal Sackman aura to this player
                return revealSackmanAura(player, 3)
            end,
        },

        unlockRequirement = nil, -- Default unlocked
    },

    Mechanic = {
        id = "mechanic",
        name = "Mechanic",
        characterName = "Guto",
        description = "O tecnico. Resolve puzzles mais rapido.",

        speed = 0.9,
        repairSpeed = 1.15,
        stealth = 1.0,

        ability = {
            name = "Fast Hands",
            description = "Repara objetivos 15% mais rapido",
            cooldown = 0,
            isPassive = true,
            execute = function(player)
                return true -- Passive, always active
            end,
        },

        unlockRequirement = nil,
    },

    Medic = {
        id = "medic",
        name = "Medic",
        characterName = "Nina",
        description = "A curandeira. Ajuda aliados em perigo.",

        speed = 1.0,
        repairSpeed = 1.0,
        stealth = 1.0,

        ability = {
            name = "First Aid",
            description = "Cura a si ou aliado proximo",
            cooldown = 45,
            duration = nil,
            isPassive = false,
            execute = function(player)
                return healPlayerOrAlly(player)
            end,
        },

        unlockRequirement = "Play 10 games",
        unlockCost = 500,
    },

    Athlete = {
        id = "athlete",
        name = "Athlete",
        characterName = "Davi",
        description = "O atleta. Corre mais rapido quando precisa.",

        speed = 1.1,
        repairSpeed = 0.9,
        stealth = 0.9,

        ability = {
            name = "Sprint Burst",
            description = "Boost de velocidade por 3 segundos",
            cooldown = 40,
            duration = 3,
            isPassive = false,
            execute = function(player)
                return applySpeedBoost(player, 1.5, 3)
            end,
        },

        unlockRequirement = nil,
    },

    Trickster = {
        id = "trickster",
        name = "Trickster",
        characterName = "Zoe",
        description = "A trapaceira. Engana o Sackman com ilusoes.",

        speed = 1.0,
        repairSpeed = 1.0,
        stealth = 1.2,

        ability = {
            name = "Decoy",
            description = "Cria uma copia falsa que corre em linha reta",
            cooldown = 60,
            duration = 5,
            isPassive = false,
            execute = function(player)
                return spawnDecoy(player)
            end,
        },

        unlockRequirement = "Win 5 games as Survivor",
        unlockCost = 750,
    },

    Leader = {
        id = "leader",
        name = "Leader",
        characterName = "Max",
        description = "O lider. Inspira aliados a correr mais rapido.",

        speed = 1.0,
        repairSpeed = 1.0,
        stealth = 1.0,

        ability = {
            name = "Rally",
            description = "Aliados proximos ganham 10% velocidade por 5s",
            cooldown = 90,
            duration = 5,
            isPassive = false,
            execute = function(player)
                return rallyNearbyAllies(player, 10, 1.1, 5)
            end,
        },

        unlockRequirement = "Rescue 20 allies",
        unlockCost = 1000,
    },
}
```

### 3.2 Definicao de Classes - Sackman

```lua
--!strict

export type SackmanAbility = {
    name: string,
    description: string,
    cooldown: number,
    duration: number?,
    charges: number?,
    execute: (player: Player, targetPos: Vector3?) -> boolean,
}

export type SackmanClass = {
    id: string,
    name: string,
    title: string,
    description: string,
    difficulty: number, -- 1-5 stars

    -- Stats (multipliers)
    speed: number,
    attackSpeed: number,
    detection: number,

    -- Ability
    ability: SackmanAbility,

    -- Unlock
    unlockRequirement: string?,
    unlockCost: number?,
}

local SackmanClasses: {[string]: SackmanClass} = {
    Collector = {
        id = "collector",
        name = "The Collector",
        title = "Sackman Classico",
        description = "O cacador original. Versatil e letal.",
        difficulty = 2,

        speed = 1.0,
        attackSpeed = 1.0,
        detection = 1.0,

        ability = {
            name = "Bag Toss",
            description = "Joga sacos a distancia para capturar",
            cooldown = 8,
            charges = 2,
            execute = function(player, targetPos)
                return throwBag(player, targetPos)
            end,
        },

        unlockRequirement = nil, -- Default
    },

    Stalker = {
        id = "stalker",
        name = "The Stalker",
        title = "Sackman Sombra",
        description = "O fantasma. Ataca das sombras.",
        difficulty = 3,

        speed = 1.0,
        attackSpeed = 1.0,
        detection = 1.2,

        ability = {
            name = "Shadow Step",
            description = "Fica invisivel por 5 segundos",
            cooldown = 20,
            duration = 5,
            execute = function(player)
                return activateInvisibility(player, 5, 0.7) -- 30% slower
            end,
        },

        unlockRequirement = "Capture 20 survivors",
        unlockCost = 1000,
    },

    Brute = {
        id = "brute",
        name = "The Brute",
        title = "Sackman Gigante",
        description = "A forca bruta. Atordoa em area.",
        difficulty = 3,

        speed = 0.85,
        attackSpeed = 1.2,
        detection = 0.9,

        ability = {
            name = "Ground Pound",
            description = "Atordoa survivors em area por 2s",
            cooldown = 15,
            duration = 2,
            execute = function(player)
                return groundPound(player, 8, 2) -- 8 studs, 2s stun
            end,
        },

        unlockRequirement = "Win 10 games as Sackman",
        unlockCost = 1500,
    },

    Trapper = {
        id = "trapper",
        name = "The Trapper",
        title = "Sackman Cacador",
        description = "O estrategista. Prepara armadilhas.",
        difficulty = 4,

        speed = 1.0,
        attackSpeed = 1.0,
        detection = 1.0,

        ability = {
            name = "Sack Trap",
            description = "Coloca armadilha que prende por 3s",
            cooldown = 3, -- Between placements
            charges = 5, -- Max traps on map
            execute = function(player, position)
                return placeTrap(player, position, 3)
            end,
        },

        unlockRequirement = "Play 30 games as Sackman",
        unlockCost = 2000,
    },

    Mimic = {
        id = "mimic",
        name = "The Mimic",
        title = "Sackman Falso",
        description = "O enganador. Se transforma em objetos.",
        difficulty = 5,

        speed = 1.1,
        attackSpeed = 0.9,
        detection = 0.8,

        ability = {
            name = "Disguise",
            description = "Transforma em objeto do mapa por 10s",
            cooldown = 25,
            duration = 10,
            execute = function(player)
                return disguiseAsObject(player, 10)
            end,
        },

        unlockRequirement = "Capture 50 survivors total",
        unlockCost = 3000,
    },
}
```

### 3.3 Sistema de Habilidades

```lua
--!strict

export type AbilityState = {
    classId: string,
    cooldownEnd: number,
    charges: number?,
    isActive: boolean,
    activeEnd: number?,
}

export type AbilityService = {
    -- State
    GetAbilityState: (player: Player) -> AbilityState?,
    GetCooldownRemaining: (player: Player) -> number,
    GetCharges: (player: Player) -> number?,
    IsAbilityActive: (player: Player) -> boolean,
    CanUseAbility: (player: Player) -> boolean,

    -- Actions
    UseAbility: (player: Player, targetPos: Vector3?) -> (boolean, string?),
    CancelAbility: (player: Player) -> boolean,

    -- Events
    OnAbilityUsed: Signal<Player, string>,
    OnAbilityEnded: Signal<Player, string>,
    OnCooldownComplete: Signal<Player, string>,
}

local function useAbility(player: Player, targetPos: Vector3?): (boolean, string?)
    local state = getAbilityState(player)
    if not state then
        return false, "No ability state"
    end

    -- Check cooldown
    if os.clock() < state.cooldownEnd then
        local remaining = state.cooldownEnd - os.clock()
        return false, `Cooldown: {string.format("%.1f", remaining)}s`
    end

    -- Check charges
    if state.charges ~= nil and state.charges <= 0 then
        return false, "No charges"
    end

    -- Check if already active
    if state.isActive then
        return false, "Ability already active"
    end

    -- Get class data
    local role = getPlayerRole(player)
    local classId = state.classId
    local classData

    if role == "Survivor" then
        classData = SurvivorClasses[classId]
    else
        classData = SackmanClasses[classId]
    end

    if not classData then
        return false, "Invalid class"
    end

    -- Execute ability
    local success = classData.ability.execute(player, targetPos)

    if success then
        -- Start cooldown
        state.cooldownEnd = os.clock() + classData.ability.cooldown

        -- Consume charge
        if state.charges ~= nil then
            state.charges -= 1
        end

        -- Set active duration
        if classData.ability.duration then
            state.isActive = true
            state.activeEnd = os.clock() + classData.ability.duration

            task.delay(classData.ability.duration, function()
                state.isActive = false
                state.activeEnd = nil
                fireAbilityEnded(player, classId)
            end)
        end

        fireAbilityUsed(player, classId)
    end

    return success, nil
end
```

---

## 4. Sistema de Objetivos

### 4.1 Configuracao

```lua
--!strict

export type ObjectiveConfig = {
    -- Cores
    cores_disponiveis: {string},
    max_cores_por_mapa: number,

    -- Chaves
    chaves_em_areas_abertas: number,

    -- Puzzle
    pecas_puzzle: number,
    tipos_puzzle: {string},

    -- Saidas
    saidas_total: number,
    saidas_ativas: number,

    -- Timers
    tempo_abrir_porta: number,
    tempo_coletar_chave: number,
    tempo_puzzle_final: number,
    tempo_saida_aberta: number,
}

local ObjectiveConfig: ObjectiveConfig = {
    cores_disponiveis = {"Vermelha", "Azul", "Verde", "Amarela", "Roxa"},
    max_cores_por_mapa = 5,

    chaves_em_areas_abertas = 2,

    pecas_puzzle = 5,
    tipos_puzzle = {"Engrenagens", "Quebra-cabeca", "Sequencia", "Simbolos"},

    saidas_total = 3,
    saidas_ativas = 1,

    tempo_abrir_porta = 2,
    tempo_coletar_chave = 1,
    tempo_puzzle_final = 30,
    tempo_saida_aberta = 60,
}
```

### 4.2 Estado do Mapa

```lua
--!strict

export type KeyData = {
    id: string,
    color: string,
    position: Vector3,
    roomId: string?,     -- nil = area aberta
    collected: boolean,
    collectedBy: number?, -- UserId
}

export type DoorData = {
    id: string,
    color: string,
    position: Vector3,
    isOpen: boolean,
    openedBy: number?,
}

export type PuzzlePieceData = {
    id: string,
    position: Vector3,
    roomId: string,
    collected: boolean,
    collectedBy: number?,
}

export type ExitData = {
    id: string,
    position: Vector3,
    isActive: boolean,
    isOpen: boolean,
}

export type MapObjectiveState = {
    matchId: string,

    -- Keys
    keys: {[string]: KeyData},
    keysCollected: {[string]: boolean}, -- By color
    totalKeys: number,
    collectedKeys: number,

    -- Doors
    doors: {[string]: DoorData},
    doorsOpened: number,
    totalDoors: number,

    -- Puzzle
    puzzleType: string,
    puzzlePieces: {[string]: PuzzlePieceData},
    puzzlePiecesCollected: number,
    totalPuzzlePieces: number,
    puzzleSolved: boolean,

    -- Exits
    exits: {[string]: ExitData},
    activeExitId: string?,
    exitOpenTime: number?,
}
```

### 4.3 Fluxo de Objetivos

```lua
--!strict

export type ObjectiveService = {
    -- State
    GetMapState: () -> MapObjectiveState,
    GetKeyStatus: (color: string) -> boolean,
    GetDoorStatus: (doorId: string) -> boolean,
    GetPuzzleProgress: () -> (number, number),
    GetActiveExit: () -> ExitData?,

    -- Actions
    CollectKey: (player: Player, keyId: string) -> (boolean, string?),
    OpenDoor: (player: Player, doorId: string) -> (boolean, string?),
    CollectPuzzlePiece: (player: Player, pieceId: string) -> (boolean, string?),
    SolvePuzzle: (player: Player) -> (boolean, string?),
    UseExit: (player: Player, exitId: string) -> (boolean, string?),

    -- Events
    OnKeyCollected: Signal<Player, string, string>,  -- player, keyId, color
    OnDoorOpened: Signal<Player, string, string>,    -- player, doorId, color
    OnPuzzlePieceCollected: Signal<Player, string>,  -- player, pieceId
    OnPuzzleSolved: Signal<Player>,
    OnExitOpened: Signal<string>,                     -- exitId
    OnPlayerEscaped: Signal<Player>,
}

local function collectKey(player: Player, keyId: string): (boolean, string?)
    local state = getMapState()
    local key = state.keys[keyId]

    if not key then
        return false, "Invalid key"
    end

    if key.collected then
        return false, "Key already collected"
    end

    -- Check player is near key
    local character = player.Character
    if not character then
        return false, "No character"
    end

    local rootPart = character:FindFirstChild("HumanoidRootPart")
    if not rootPart then
        return false, "No root part"
    end

    local distance = (rootPart.Position - key.position).Magnitude
    if distance > 5 then
        return false, "Too far from key"
    end

    -- Check if key is in a room that's not open
    if key.roomId then
        local door = getDoorForRoom(key.roomId)
        if door and not door.isOpen then
            return false, "Room is locked"
        end
    end

    -- Collect the key
    key.collected = true
    key.collectedBy = player.UserId
    state.collectedKeys += 1
    state.keysCollected[key.color] = true

    -- Fire event
    fireKeyCollected(player, keyId, key.color)

    -- Notify all clients
    Remotes.KeyCollected:FireAllClients(player.UserId, keyId, key.color)

    return true, nil
end

local function openDoor(player: Player, doorId: string): (boolean, string?)
    local state = getMapState()
    local door = state.doors[doorId]

    if not door then
        return false, "Invalid door"
    end

    if door.isOpen then
        return false, "Door already open"
    end

    -- Check player has the right key
    if not state.keysCollected[door.color] then
        return false, `Need {door.color} key`
    end

    -- Check player is near door
    local character = player.Character
    if not character then
        return false, "No character"
    end

    local rootPart = character:FindFirstChild("HumanoidRootPart")
    if not rootPart then
        return false, "No root part"
    end

    local distance = (rootPart.Position - door.position).Magnitude
    if distance > 5 then
        return false, "Too far from door"
    end

    -- Open the door
    door.isOpen = true
    door.openedBy = player.UserId
    state.doorsOpened += 1

    -- Fire event
    fireDoorOpened(player, doorId, door.color)

    -- Notify clients
    Remotes.DoorOpened:FireAllClients(player.UserId, doorId, door.color)

    return true, nil
end

local function solvePuzzle(player: Player): (boolean, string?)
    local state = getMapState()

    if state.puzzleSolved then
        return false, "Puzzle already solved"
    end

    -- Check all pieces collected
    if state.puzzlePiecesCollected < state.totalPuzzlePieces then
        local remaining = state.totalPuzzlePieces - state.puzzlePiecesCollected
        return false, `Need {remaining} more pieces`
    end

    -- Check player is at puzzle location
    -- ... distance check ...

    -- Solve puzzle
    state.puzzleSolved = true

    -- Open random exit
    local exitIds = {}
    for id, _ in pairs(state.exits) do
        table.insert(exitIds, id)
    end

    local randomExitId = exitIds[math.random(#exitIds)]
    state.exits[randomExitId].isActive = true
    state.exits[randomExitId].isOpen = true
    state.activeExitId = randomExitId
    state.exitOpenTime = os.clock()

    -- Fire events
    firePuzzleSolved(player)
    fireExitOpened(randomExitId)

    -- Notify clients
    Remotes.PuzzleSolved:FireAllClients(player.UserId)
    Remotes.ExitOpened:FireAllClients(randomExitId)

    -- Start exit timer
    task.delay(ObjectiveConfig.tempo_saida_aberta, function()
        if state.exits[randomExitId].isOpen then
            state.exits[randomExitId].isOpen = false
            -- Notify clients exit closed
        end
    end)

    return true, nil
end
```

---

## 5. Sistema de Struggle (Fuga)

### 5.1 Configuracao

```lua
--!strict

export type StruggleConfig = {
    -- Chances base
    chance_carregado: number,     -- % por tentativa
    chance_prisao: number,        -- % por tentativa
    chance_aliado: number,        -- % com ajuda

    -- Cooldowns
    cooldown_carregado: number,   -- Segundos entre tentativas
    cooldown_prisao: number,
    cooldown_aliado: number,

    -- QTE
    qte_duration: number,         -- Duracao do QTE
    qte_target_presses: number,   -- Presses necessarios
    qte_bonus_per_press: number,  -- Bonus % por press extra

    -- Resultado
    stun_apos_fuga: number,       -- Segundos de stun ao fugir
}

local StruggleConfig: StruggleConfig = {
    chance_carregado = 15,
    chance_prisao = 25,
    chance_aliado = 50,

    cooldown_carregado = 3,
    cooldown_prisao = 5,
    cooldown_aliado = 2,

    qte_duration = 2,
    qte_target_presses = 10,
    qte_bonus_per_press = 2,

    stun_apos_fuga = 2,
}
```

### 5.2 Fluxo de Struggle

```lua
--!strict

export type StruggleState = {
    isStruggling: boolean,
    lastAttempt: number,
    pressCount: number,
    startTime: number,
}

export type StruggleService = {
    -- State
    GetStruggleState: (player: Player) -> StruggleState?,
    CanStruggle: (player: Player) -> (boolean, string?),

    -- Actions
    StartStruggle: (player: Player) -> (boolean, string?),
    RecordPress: (player: Player) -> (),
    EndStruggle: (player: Player) -> (boolean, boolean), -- (attempted, success)

    -- Events
    OnStruggleStarted: Signal<Player>,
    OnStruggleSuccess: Signal<Player>,
    OnStruggleFailed: Signal<Player>,
}

local function startStruggle(player: Player): (boolean, string?)
    local playerState = getPlayerState(player)

    if playerState ~= "Captured" and playerState ~= "Imprisoned" then
        return false, "Cannot struggle in this state"
    end

    local state = getStruggleState(player)
    if state.isStruggling then
        return false, "Already struggling"
    end

    -- Check cooldown
    local cooldown = playerState == "Captured"
        and StruggleConfig.cooldown_carregado
        or StruggleConfig.cooldown_prisao

    if os.clock() - state.lastAttempt < cooldown then
        local remaining = cooldown - (os.clock() - state.lastAttempt)
        return false, `Wait {string.format("%.1f", remaining)}s`
    end

    -- Start struggle
    state.isStruggling = true
    state.pressCount = 0
    state.startTime = os.clock()
    state.lastAttempt = os.clock()

    -- Notify client to show QTE
    Remotes.StruggleStarted:FireClient(player)

    -- Auto-end after duration
    task.delay(StruggleConfig.qte_duration, function()
        if state.isStruggling then
            endStruggle(player)
        end
    end)

    return true, nil
end

local function recordPress(player: Player)
    local state = getStruggleState(player)
    if not state or not state.isStruggling then return end

    state.pressCount += 1
end

local function endStruggle(player: Player): (boolean, boolean)
    local state = getStruggleState(player)
    if not state or not state.isStruggling then
        return false, false
    end

    state.isStruggling = false

    local playerState = getPlayerState(player)

    -- Calculate success chance
    local baseChance = playerState == "Captured"
        and StruggleConfig.chance_carregado
        or StruggleConfig.chance_prisao

    -- Bonus for extra presses
    local extraPresses = math.max(0, state.pressCount - StruggleConfig.qte_target_presses)
    local bonus = extraPresses * StruggleConfig.qte_bonus_per_press
    local finalChance = math.min(100, baseChance + bonus)

    -- Roll for success
    local roll = math.random(100)
    local success = roll <= finalChance

    if success then
        -- Escape!
        escapeFromCapture(player)
        fireStruggleSuccess(player)
    else
        fireStruggleFailed(player)
    end

    return true, success
end

local function escapeFromCapture(player: Player)
    -- Drop the sack, player falls out
    local capturedBy = getCapturedBy(player)

    if capturedBy then
        -- Drop animation for Sackman
        playSackDropAnimation(capturedBy)
    end

    -- Player recovers
    setPlayerState(player, "Alive")

    -- Stop O2 drain
    stopO2Drain(player)

    -- Apply stun (can't move briefly)
    applyStun(player, StruggleConfig.stun_apos_fuga)

    -- Recover some O2
    addO2(player, 20)
end
```

---

## 6. Sistema de Resgate

### 6.1 Configuracao

```lua
--!strict

export type RescueConfig = {
    -- Etapas
    tempo_abrir_saco: number,    -- Segundos
    tempo_reanimar: number,      -- Segundos
    tempo_levantar: number,      -- Segundos

    -- Recuperacao
    o2_apos_resgate: number,     -- % de O2
    hp_apos_resgate: number,     -- % de HP

    -- Distancia
    distancia_resgate: number,   -- Studs

    -- Invulnerabilidade
    invulnerabilidade_tempo: number, -- Segundos apos resgate
}

local RescueConfig: RescueConfig = {
    tempo_abrir_saco = 3,
    tempo_reanimar = 5,
    tempo_levantar = 3,

    o2_apos_resgate = 30,
    hp_apos_resgate = 50,

    distancia_resgate = 5,

    invulnerabilidade_tempo = 3,
}
```

### 6.2 Fluxo de Resgate

```
RESCUER                         SERVER                         VICTIM
   │                               │                              │
   │  Aproxima do desmaiado        │                              │
   │──────────────────────────────►│                              │
   │                               │                              │
   │  RequestRescue(victimId)      │                              │
   │──────────────────────────────►│                              │
   │                               │                              │
   │                        Validate:                             │
   │                        - Distance OK?                        │
   │                        - Victim is Desmaiado?                │
   │                        - Rescuer can rescue?                 │
   │                               │                              │
   │  RescueStarted                │  BeingRescued                │
   │◄──────────────────────────────┤─────────────────────────────►│
   │                               │                              │
   │  [Stage 1: Abrir Saco - 3s]   │                              │
   │  ████████░░░░░░░░             │                              │
   │                               │                              │
   │  Stage1Complete               │                              │
   │──────────────────────────────►│                              │
   │                               │                              │
   │  [Stage 2: Reanimar - 5s]     │                              │
   │  ████████████░░░░░            │  O2 para de cair             │
   │                               │  HP para de cair             │
   │                               │                              │
   │  Stage2Complete               │                              │
   │──────────────────────────────►│                              │
   │                               │                              │
   │  [Stage 3: Levantar - 3s]     │                              │
   │  ████████████████░░           │                              │
   │                               │                              │
   │  RescueComplete               │  RescueComplete              │
   │◄──────────────────────────────┤─────────────────────────────►│
   │                               │                              │
   │                               │  State = Alive               │
   │                               │  O2 = 30%                    │
   │                               │  HP = 50%                    │
   │                               │  Invulnerable 3s             │
```

### 6.3 Sistema de Resgate

```lua
--!strict

export type RescueStage = "None" | "OpenSack" | "Revive" | "LiftUp"

export type RescueState = {
    rescuer: Player?,
    victim: Player?,
    stage: RescueStage,
    progress: number,       -- 0-1
    stageStartTime: number,
}

export type RescueService = {
    -- State
    GetRescueState: (player: Player) -> RescueState?,
    IsBeingRescued: (player: Player) -> boolean,
    IsRescuing: (player: Player) -> boolean,

    -- Actions
    StartRescue: (rescuer: Player, victimId: number) -> (boolean, string?),
    CancelRescue: (rescuer: Player) -> (),
    UpdateRescue: (rescuer: Player, dt: number) -> (),

    -- Events
    OnRescueStarted: Signal<Player, Player>,
    OnRescueStageComplete: Signal<Player, Player, RescueStage>,
    OnRescueComplete: Signal<Player, Player>,
    OnRescueCancelled: Signal<Player, Player>,
}

local function updateRescue(rescuer: Player, dt: number)
    local state = getRescueState(rescuer)
    if not state or state.stage == "None" then return end

    -- Check distance
    local victim = state.victim
    if not victim then
        cancelRescue(rescuer)
        return
    end

    local rescuerChar = rescuer.Character
    local victimChar = victim.Character

    if not rescuerChar or not victimChar then
        cancelRescue(rescuer)
        return
    end

    local distance = getDistance(rescuerChar, victimChar)
    if distance > RescueConfig.distancia_resgate then
        cancelRescue(rescuer)
        return
    end

    -- Get stage duration
    local stageDuration = 0
    if state.stage == "OpenSack" then
        stageDuration = RescueConfig.tempo_abrir_saco
    elseif state.stage == "Revive" then
        stageDuration = RescueConfig.tempo_reanimar
    elseif state.stage == "LiftUp" then
        stageDuration = RescueConfig.tempo_levantar
    end

    -- Update progress
    local elapsed = os.clock() - state.stageStartTime
    state.progress = math.min(1, elapsed / stageDuration)

    -- Check stage complete
    if state.progress >= 1 then
        completeStage(rescuer, state)
    end
end

local function completeStage(rescuer: Player, state: RescueState)
    local victim = state.victim
    if not victim then return end

    fireRescueStageComplete(rescuer, victim, state.stage)

    if state.stage == "OpenSack" then
        -- Move to revive stage
        state.stage = "Revive"
        state.progress = 0
        state.stageStartTime = os.clock()

        -- Stop HP drain during revive
        stopHPDrain(victim)

    elseif state.stage == "Revive" then
        -- Move to lift up stage
        state.stage = "LiftUp"
        state.progress = 0
        state.stageStartTime = os.clock()

    elseif state.stage == "LiftUp" then
        -- Rescue complete!
        completeRescue(rescuer, victim)
    end
end

local function completeRescue(rescuer: Player, victim: Player)
    local state = getRescueState(rescuer)
    if state then
        state.stage = "None"
        state.victim = nil
        state.rescuer = nil
    end

    -- Restore victim
    setPlayerState(victim, "Alive")
    setO2(victim, O2Config.o2_maximo * (RescueConfig.o2_apos_resgate / 100))
    setHP(victim, O2Config.hp_maximo * (RescueConfig.hp_apos_resgate / 100))

    -- Apply invulnerability
    applyInvulnerability(victim, RescueConfig.invulnerabilidade_tempo)

    -- Fire event
    fireRescueComplete(rescuer, victim)

    -- Notify clients
    Remotes.RescueComplete:FireAllClients(rescuer.UserId, victim.UserId)

    -- Stats tracking
    incrementStat(rescuer, "totalRescues")
end
```

---

## 7. Sistema de Prisao

### 7.1 Configuracao

```lua
--!strict

export type PrisonConfig = {
    quantidade_classico: number,   -- 1v7
    quantidade_caos: number,       -- 2v16

    tempo_trancar: number,         -- Segundos para Sackman trancar
    tempo_abrir_aliado: number,    -- Segundos para aliado abrir

    invulnerabilidade: number,     -- Segundos apos sair
}

local PrisonConfig: PrisonConfig = {
    quantidade_classico = 4,
    quantidade_caos = 6,

    tempo_trancar = 1,
    tempo_abrir_aliado = 4,

    invulnerabilidade = 3,
}
```

### 7.2 Estado da Prisao

```lua
--!strict

export type PrisonData = {
    id: string,
    position: Vector3,
    isOccupied: boolean,
    prisoner: number?,      -- UserId
    lockedAt: number?,      -- Timestamp
}

export type PrisonService = {
    -- State
    GetPrison: (prisonId: string) -> PrisonData?,
    GetAllPrisons: () -> {[string]: PrisonData},
    FindNearestEmptyPrison: (position: Vector3) -> PrisonData?,
    GetPrisonerPrison: (player: Player) -> PrisonData?,

    -- Sackman Actions
    LockPrisoner: (sackman: Player, survivor: Player, prisonId: string) -> (boolean, string?),

    -- Ally Actions
    UnlockPrison: (ally: Player, prisonId: string) -> (boolean, string?),

    -- Events
    OnPrisonerLocked: Signal<Player, Player, string>,  -- sackman, survivor, prisonId
    OnPrisonerFreed: Signal<Player, Player, string>,   -- ally, survivor, prisonId
}
```

---

## 8. Resumo de Integracao

### 8.1 Dependencias entre Sistemas

```
                    ┌──────────────┐
                    │  MatchService │
                    └───────┬──────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ PlayerService │  │ObjectiveService│  │ ClassService  │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                   │                   │
        │          ┌────────┴────────┐         │
        │          │                 │         │
        ▼          ▼                 ▼         ▼
┌───────────────┐  ┌──────────────┐  ┌───────────────┐
│  O2Service    │  │ PrisonService│  │ AbilityService│
└───────┬───────┘  └──────┬───────┘  └───────────────┘
        │                 │
        │    ┌────────────┤
        │    │            │
        ▼    ▼            ▼
┌───────────────┐  ┌───────────────┐
│CaptureService │  │ RescueService │
└───────────────┘  └───────────────┘
        │                 │
        └────────┬────────┘
                 ▼
        ┌───────────────┐
        │StruggleService│
        └───────────────┘
```

### 8.2 Eventos Cross-System

| Evento | Origem | Consumidores |
|--------|--------|--------------|
| `OnCapture` | CaptureService | O2Service, PlayerService, MatchService |
| `OnDesmaiado` | O2Service | RescueService, MatchService |
| `OnEliminated` | O2Service | MatchService |
| `OnRescueComplete` | RescueService | O2Service, PlayerService |
| `OnStruggleSuccess` | StruggleService | CaptureService, O2Service |
| `OnPuzzleSolved` | ObjectiveService | MatchService |
| `OnPlayerEscaped` | ObjectiveService | MatchService |

---

*Systems Specification Document criado por @lua-scripter (Luau) em 2026-01-28*
*Squad: roblox-game-studio*
*Versao: 1.0.0*
