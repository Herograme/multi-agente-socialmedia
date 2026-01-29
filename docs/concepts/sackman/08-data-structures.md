# Data Structures Document: Sackman

## 1. Tipos Compartilhados

### 1.1 PlayerTypes.lua

```lua
--!strict

-- Role do jogador na partida
export type PlayerRole = "Survivor" | "Sackman"

-- Estado do jogador durante o jogo
export type PlayerState =
    | "Alive"        -- Normal, pode se mover
    | "Running"      -- Correndo (consumindo O2)
    | "Hiding"       -- Escondido em armario/caixa
    | "Captured"     -- No saco, sendo carregado
    | "Imprisoned"   -- Na prisao
    | "Struggling"   -- Tentando escapar
    | "Desmaiado"    -- O2 = 0, inconsciente
    | "Eliminated"   -- HP = 0, fora do jogo
    | "Escaped"      -- Conseguiu fugir
    | "Spectating"   -- Assistindo (apos eliminacao/escape)

-- Dados em tempo real do jogador
export type PlayerRuntimeData = {
    -- Identidade
    userId: number,
    name: string,
    role: PlayerRole,
    classId: string,

    -- Estado
    state: PlayerState,
    previousState: PlayerState?,

    -- Vitais
    o2: number,
    o2Max: number,
    hp: number,
    hpMax: number,

    -- Movimento
    isRunning: boolean,
    canRun: boolean,
    speed: number,
    baseSpeed: number,

    -- Captura
    capturedBy: number?,     -- UserId do Sackman
    prisonId: string?,       -- ID da prisao
    carryingPlayer: number?, -- Para Sackman: quem esta carregando

    -- Habilidade
    abilityCooldownEnd: number,
    abilityCharges: number?,
    abilityActive: boolean,

    -- Inventario
    keysCollected: {string},  -- Cores das chaves
    puzzlePiecesCollected: number,

    -- Temporarios
    invulnerableUntil: number,
    stunUntil: number,
    slowMultiplier: number,
}

-- Dados persistentes do jogador (DataStore)
export type PlayerSaveData = {
    version: number,

    -- Progresso
    level: number,
    experience: number,
    gamesPlayed: number,
    survivorWins: number,
    sackmanWins: number,

    -- Estatisticas
    stats: PlayerStats,

    -- Desbloqueios
    unlockedClasses: {string},
    unlockedSkins: {string},
    unlockedEmotes: {string},

    -- Preferencias
    settings: PlayerSettings,

    -- Compras
    purchaseHistory: {string},

    -- Metadata
    firstPlayDate: number,
    lastPlayDate: number,
    totalPlayTime: number,
}

-- Estatisticas do jogador
export type PlayerStats = {
    -- Survivor
    totalEscapes: number,
    totalRescues: number,
    totalKeysCollected: number,
    totalPuzzlesSolved: number,
    totalAbilitiesUsed: number,
    longestSurvivalTime: number,

    -- Sackman
    totalCaptures: number,
    totalPerfectCaptures: number,
    totalEliminations: number,
    fastestFullCapture: number, -- Tempo para capturar todos

    -- Geral
    totalTimePlayed: number,
    totalDistanceWalked: number,
}

-- Configuracoes do jogador
export type PlayerSettings = {
    preferredRole: "Survivor" | "Sackman" | "Any",
    favoriteClass: {
        survivor: string?,
        sackman: string?,
    },

    -- Audio
    masterVolume: number,
    musicVolume: number,
    sfxVolume: number,

    -- Video
    graphicsQuality: "Low" | "Medium" | "High" | "Auto",
    showFPS: boolean,

    -- Controles
    sensitivity: number,
    invertY: boolean,

    -- Interface
    hudScale: number,
    showTips: boolean,

    -- Acessibilidade
    subtitles: boolean,
    colorblindMode: "None" | "Deuteranopia" | "Protanopia" | "Tritanopia",
    reduceMotion: boolean,
    jumpscareWarning: boolean,
}

return {
    PlayerRole = nil :: PlayerRole,
    PlayerState = nil :: PlayerState,
    PlayerRuntimeData = nil :: PlayerRuntimeData,
    PlayerSaveData = nil :: PlayerSaveData,
    PlayerStats = nil :: PlayerStats,
    PlayerSettings = nil :: PlayerSettings,
}
```

### 1.2 GameTypes.lua

```lua
--!strict

-- Modos de jogo
export type GameMode = "Classic" | "Chaos"

-- Estado da partida
export type MatchState =
    | "Lobby"       -- Aguardando jogadores
    | "Starting"    -- Countdown iniciado
    | "Playing"     -- Jogo em andamento
    | "EndGame"     -- Timer acabou ou condicao de vitoria
    | "Finished"    -- Mostrando resultados

-- Configuracao de partida
export type MatchConfig = {
    mode: GameMode,

    -- Jogadores
    minPlayers: number,
    maxPlayers: number,
    sackmanCount: number,
    survivorCount: number,

    -- Tempo
    lobbyWaitTime: number,
    startCountdown: number,
    matchDuration: number,
    gracePeriod: number,

    -- Objetivos
    keyCount: number,
    puzzlePieceCount: number,
    exitCount: number,

    -- Condicoes de vitoria
    survivorsToWin: number, -- Minimo para survivors vencerem
}

-- Configuracoes pre-definidas
export type MatchConfigs = {
    Classic: MatchConfig,
    Chaos: MatchConfig,
}

-- Dados da partida em andamento
export type MatchData = {
    id: string,
    mode: GameMode,
    state: MatchState,
    config: MatchConfig,

    -- Jogadores
    players: {number},           -- UserIds
    sackmen: {number},
    survivors: {number},

    -- Progresso
    capturedCount: number,
    escapedCount: number,
    eliminatedCount: number,

    -- Timing
    lobbyStartTime: number,
    matchStartTime: number?,
    matchEndTime: number?,
    gracePeriodEnd: number?,

    -- Mapa
    mapId: string,
    mapObjectives: MapObjectiveState,

    -- Resultado
    result: MatchResult?,
}

-- Resultado da partida
export type MatchResult = {
    winner: "Survivors" | "Sackman" | "Draw",
    duration: number,
    escapedCount: number,
    capturedCount: number,
    eliminatedCount: number,

    -- MVP
    mvpSurvivor: number?,    -- UserId
    mvpSackman: number?,     -- UserId

    -- Recompensas por jogador
    playerRewards: {[number]: PlayerReward},
}

-- Recompensa individual
export type PlayerReward = {
    userId: number,
    xpEarned: number,
    coinsEarned: number,
    badges: {string}?,
    achievements: {string}?,
}

return {
    GameMode = nil :: GameMode,
    MatchState = nil :: MatchState,
    MatchConfig = nil :: MatchConfig,
    MatchData = nil :: MatchData,
    MatchResult = nil :: MatchResult,
    PlayerReward = nil :: PlayerReward,
}
```

### 1.3 ClassTypes.lua

```lua
--!strict

-- Classes de Survivor
export type SurvivorClassId =
    | "scout"
    | "mechanic"
    | "medic"
    | "athlete"
    | "trickster"
    | "leader"

-- Classes de Sackman
export type SackmanClassId =
    | "collector"
    | "stalker"
    | "brute"
    | "trapper"
    | "mimic"

-- Tipo de habilidade
export type AbilityType = "Active" | "Passive" | "Toggle"

-- Definicao de habilidade
export type AbilityDefinition = {
    id: string,
    name: string,
    description: string,
    icon: string,

    -- Tipo
    abilityType: AbilityType,

    -- Cooldown
    cooldown: number,
    charges: number?,
    chargeRegenTime: number?,

    -- Duracao (para habilidades com efeito prolongado)
    duration: number?,

    -- Efeitos
    effects: {AbilityEffect}?,
}

-- Efeito de habilidade
export type AbilityEffect = {
    effectType: "SpeedBoost" | "Invisibility" | "Reveal" | "Heal" | "Stun" | "Spawn" | "Transform",
    value: number?,
    duration: number?,
    radius: number?,
    targetType: "Self" | "Ally" | "Enemy" | "Area",
}

-- Definicao de classe Survivor
export type SurvivorClassDefinition = {
    id: SurvivorClassId,
    name: string,
    characterName: string,
    description: string,
    icon: string,
    model: string,

    -- Stats (multiplicadores, 1.0 = base)
    stats: {
        speed: number,
        repairSpeed: number,
        stealth: number,
        o2Efficiency: number,
    },

    -- Habilidade
    ability: AbilityDefinition,

    -- Desbloqueio
    unlockRequirement: string?,
    unlockCost: number?,
    isDefault: boolean,
}

-- Definicao de classe Sackman
export type SackmanClassDefinition = {
    id: SackmanClassId,
    name: string,
    title: string,
    description: string,
    icon: string,
    model: string,
    difficulty: number, -- 1-5

    -- Stats
    stats: {
        speed: number,
        captureSpeed: number,
        detection: number,
        carrySpeed: number,
    },

    -- Habilidade
    ability: AbilityDefinition,

    -- Desbloqueio
    unlockRequirement: string?,
    unlockCost: number?,
    isDefault: boolean,
}

return {
    SurvivorClassId = nil :: SurvivorClassId,
    SackmanClassId = nil :: SackmanClassId,
    AbilityType = nil :: AbilityType,
    AbilityDefinition = nil :: AbilityDefinition,
    AbilityEffect = nil :: AbilityEffect,
    SurvivorClassDefinition = nil :: SurvivorClassDefinition,
    SackmanClassDefinition = nil :: SackmanClassDefinition,
}
```

### 1.4 MapTypes.lua

```lua
--!strict

-- Tipos de objetos interativos
export type InteractableType =
    | "Key"          -- Chave colorida
    | "Door"         -- Porta colorida
    | "PuzzlePiece"  -- Peca do puzzle
    | "PuzzlePanel"  -- Painel do puzzle final
    | "Exit"         -- Saida
    | "Prison"       -- Prisao
    | "Hiding"       -- Esconderijo (armario, caixa)

-- Dados de chave
export type KeyData = {
    id: string,
    color: KeyColor,
    position: Vector3,
    rotation: Vector3,
    roomId: string?,
    collected: boolean,
    collectedBy: number?,
    collectedAt: number?,
}

-- Dados de porta
export type DoorData = {
    id: string,
    color: KeyColor,
    position: Vector3,
    rotation: Vector3,
    isOpen: boolean,
    openedBy: number?,
    openedAt: number?,
    leadsToRoomId: string,
}

-- Dados de peca de puzzle
export type PuzzlePieceData = {
    id: string,
    position: Vector3,
    rotation: Vector3,
    roomId: string,
    collected: boolean,
    collectedBy: number?,
}

-- Dados do painel de puzzle
export type PuzzlePanelData = {
    id: string,
    position: Vector3,
    rotation: Vector3,
    puzzleType: PuzzleType,
    isSolved: boolean,
    solvedBy: number?,
    solvedAt: number?,
}

-- Dados de saida
export type ExitData = {
    id: string,
    position: Vector3,
    rotation: Vector3,
    isActive: boolean,
    isOpen: boolean,
    openedAt: number?,
    closesAt: number?,
}

-- Dados de prisao
export type PrisonData = {
    id: string,
    position: Vector3,
    rotation: Vector3,
    capacity: number,
    prisoners: {number}, -- UserIds
}

-- Dados de esconderijo
export type HidingSpotData = {
    id: string,
    hidingType: "Closet" | "Box" | "Barrel",
    position: Vector3,
    rotation: Vector3,
    isOccupied: boolean,
    occupiedBy: number?,
}

-- Cores de chave/porta
export type KeyColor = "Red" | "Blue" | "Green" | "Yellow" | "Purple"

-- Tipos de puzzle
export type PuzzleType = "Gears" | "Jigsaw" | "Sequence" | "Symbols"

-- Dados de sala
export type RoomData = {
    id: string,
    name: string,
    color: KeyColor,
    bounds: {
        min: Vector3,
        max: Vector3,
    },
    connectedRooms: {string},
    spawnPoints: {Vector3},
    interactables: {string}, -- IDs
}

-- Estado completo do mapa
export type MapState = {
    mapId: string,
    mapName: string,

    -- Salas
    rooms: {[string]: RoomData},

    -- Interativos
    keys: {[string]: KeyData},
    doors: {[string]: DoorData},
    puzzlePieces: {[string]: PuzzlePieceData},
    puzzlePanel: PuzzlePanelData,
    exits: {[string]: ExitData},
    prisons: {[string]: PrisonData},
    hidingSpots: {[string]: HidingSpotData},

    -- Progresso
    keysCollected: number,
    totalKeys: number,
    doorsOpened: number,
    totalDoors: number,
    puzzlePiecesCollected: number,
    totalPuzzlePieces: number,
    isPuzzleSolved: boolean,
    activeExitId: string?,

    -- Spawn
    survivorSpawns: {Vector3},
    sackmanSpawns: {Vector3},
}

return {
    InteractableType = nil :: InteractableType,
    KeyData = nil :: KeyData,
    DoorData = nil :: DoorData,
    PuzzlePieceData = nil :: PuzzlePieceData,
    PuzzlePanelData = nil :: PuzzlePanelData,
    ExitData = nil :: ExitData,
    PrisonData = nil :: PrisonData,
    HidingSpotData = nil :: HidingSpotData,
    KeyColor = nil :: KeyColor,
    PuzzleType = nil :: PuzzleType,
    RoomData = nil :: RoomData,
    MapState = nil :: MapState,
}
```

### 1.5 NetworkTypes.lua

```lua
--!strict

-- Tipos de eventos de rede
export type NetworkEventType =
    -- Game flow
    | "GameStateChanged"
    | "MatchStarted"
    | "MatchEnded"
    -- Player actions
    | "RequestCapture"
    | "RequestInteract"
    | "RequestAbility"
    | "RequestStruggle"
    | "RequestRescue"
    -- Updates
    | "PlayerStateChanged"
    | "O2Updated"
    | "CaptureExecuted"
    | "CaptureFailed"
    | "KeyCollected"
    | "DoorOpened"
    | "PuzzleSolved"
    | "ExitOpened"
    | "RescueStarted"
    | "RescueComplete"
    | "StruggleStarted"
    | "StruggleResult"
    | "AbilityActivated"
    | "AbilityEnded"

-- Payload de RequestCapture
export type RequestCapturePayload = {
    targetUserId: number,
    timing: number, -- 0-1
}

-- Payload de RequestInteract
export type RequestInteractPayload = {
    interactableId: string,
    interactableType: string,
}

-- Payload de RequestAbility
export type RequestAbilityPayload = {
    targetPosition: Vector3?,
    targetUserId: number?,
}

-- Payload de CaptureExecuted
export type CaptureExecutedPayload = {
    sackmanUserId: number,
    survivorUserId: number,
    perfect: boolean,
}

-- Payload de PlayerStateChanged
export type PlayerStateChangedPayload = {
    userId: number,
    oldState: string,
    newState: string,
    metadata: {[string]: any}?,
}

-- Payload de O2Updated
export type O2UpdatedPayload = {
    userId: number,
    o2: number,
    o2Max: number,
    hp: number,
    hpMax: number,
    state: string,
}

-- Payload de KeyCollected
export type KeyCollectedPayload = {
    userId: number,
    keyId: string,
    color: string,
}

-- Validacao de payload
export type PayloadValidator<T> = (data: unknown) -> (boolean, T?)

return {
    NetworkEventType = nil :: NetworkEventType,
    RequestCapturePayload = nil :: RequestCapturePayload,
    RequestInteractPayload = nil :: RequestInteractPayload,
    RequestAbilityPayload = nil :: RequestAbilityPayload,
    CaptureExecutedPayload = nil :: CaptureExecutedPayload,
    PlayerStateChangedPayload = nil :: PlayerStateChangedPayload,
    O2UpdatedPayload = nil :: O2UpdatedPayload,
    KeyCollectedPayload = nil :: KeyCollectedPayload,
}
```

---

## 2. Configuracoes

### 2.1 GameConfig.lua

```lua
--!strict

local GameConfig = {}

-- Configuracoes por modo
GameConfig.Modes = {
    Classic = {
        mode = "Classic",
        minPlayers = 4,
        maxPlayers = 8,
        sackmanCount = 1,
        survivorCount = 7,

        lobbyWaitTime = 60,
        startCountdown = 10,
        matchDuration = 12 * 60, -- 12 minutos
        gracePeriod = 15,

        keyCount = 5,
        puzzlePieceCount = 5,
        exitCount = 3,

        survivorsToWin = 4, -- Mais da metade
    },

    Chaos = {
        mode = "Chaos",
        minPlayers = 8,
        maxPlayers = 18,
        sackmanCount = 2,
        survivorCount = 16,

        lobbyWaitTime = 90,
        startCountdown = 15,
        matchDuration = 18 * 60, -- 18 minutos
        gracePeriod = 20,

        keyCount = 8,
        puzzlePieceCount = 8,
        exitCount = 5,

        survivorsToWin = 9,
    },
}

-- Cores disponiveis
GameConfig.KeyColors = {
    "Red",
    "Blue",
    "Green",
    "Yellow",
    "Purple",
}

-- Tipos de puzzle
GameConfig.PuzzleTypes = {
    "Gears",
    "Jigsaw",
    "Sequence",
    "Symbols",
}

return GameConfig
```

### 2.2 O2Config.lua

```lua
--!strict

local O2Config = {}

-- Valores maximos
O2Config.O2_MAX = 100
O2Config.HP_MAX = 100

-- Consumo de O2 (por segundo)
O2Config.Consumption = {
    InSack = 5,          -- Sendo carregado: 20s para desmaiar
    InPrison = 3,        -- Na prisao: 33s para desmaiar
    Running = 2,         -- Correndo: 50s para gastar tudo (mas para em 80%)
    MaxRunConsumption = 20, -- % maximo que corrida consome
}

-- Recuperacao de O2 (por segundo)
O2Config.Recovery = {
    Standing = 3,        -- Parado: 33s para recuperar 100%
    Walking = 1,         -- Andando: 100s para recuperar 100%
}

-- Limites
O2Config.Limits = {
    MinToRun = 50,       -- Precisa 50% para poder correr novamente
}

-- HP (quando desmaiado)
O2Config.HPDrain = {
    WhenDesmaiado = 2,   -- HP/s: 50s para morrer
}

-- Estados de O2
O2Config.States = {
    Full = {min = 80, max = 100},
    Normal = {min = 50, max = 80},
    Tired = {min = 20, max = 50},
    Breathless = {min = 1, max = 20},
    Desmaiado = {min = 0, max = 0},
}

return O2Config
```

### 2.3 CaptureConfig.lua

```lua
--!strict

local CaptureConfig = {}

-- Distancias
CaptureConfig.Range = {
    Capture = 4,           -- Studs para capturar
    IndicatorStart = 8,    -- Studs para mostrar indicador
}

-- Timing
CaptureConfig.Timing = {
    Window = 0.5,          -- Segundos da janela
    PerfectZone = 0.15,    -- Segundos da zona perfeita
    Speed = 2,             -- Ciclos por segundo do indicador
}

-- Resultados
CaptureConfig.Results = {
    PerfectStunBonus = 1,  -- Segundos extras de stun
}

-- Falha
CaptureConfig.Failure = {
    Cooldown = 2,          -- Segundos de cooldown
    SlowdownMultiplier = 0.8, -- 20% mais lento
    SlowdownDuration = 1,  -- Segundos
}

-- Carregar
CaptureConfig.Carry = {
    SpeedMultiplier = 0.7, -- 30% mais lento carregando
    DropTime = 1,          -- Segundos para largar
}

return CaptureConfig
```

### 2.4 StruggleConfig.lua

```lua
--!strict

local StruggleConfig = {}

-- Chances base (%)
StruggleConfig.BaseChance = {
    WhenCarried = 15,      -- Sendo carregado
    WhenImprisoned = 25,   -- Na prisao
    WithAllyHelp = 50,     -- Com ajuda de aliado
}

-- Cooldowns (segundos)
StruggleConfig.Cooldown = {
    WhenCarried = 3,
    WhenImprisoned = 5,
    WithAllyHelp = 2,
}

-- QTE
StruggleConfig.QTE = {
    Duration = 2,          -- Segundos para fazer QTE
    TargetPresses = 10,    -- Numero de presses necessarios
    BonusPerPress = 2,     -- % de bonus por press extra
}

-- Resultado
StruggleConfig.Result = {
    StunAfterEscape = 2,   -- Segundos de stun apos fugir
    O2RecoveryOnEscape = 20, -- % de O2 recuperado
}

return StruggleConfig
```

### 2.5 RescueConfig.lua

```lua
--!strict

local RescueConfig = {}

-- Etapas (segundos)
RescueConfig.Stages = {
    OpenSack = 3,          -- Abrir o saco
    Revive = 5,            -- Reanimar
    LiftUp = 3,            -- Levantar
}

-- Recuperacao
RescueConfig.Recovery = {
    O2Percent = 30,        -- % de O2 apos resgate
    HPPercent = 50,        -- % de HP apos resgate
}

-- Distancia
RescueConfig.Distance = {
    MaxRescue = 5,         -- Studs maximo
}

-- Protecao
RescueConfig.Protection = {
    InvulnerabilityTime = 3, -- Segundos de invulnerabilidade
}

return RescueConfig
```

### 2.6 PrisonConfig.lua

```lua
--!strict

local PrisonConfig = {}

-- Quantidade por modo
PrisonConfig.Count = {
    Classic = 4,
    Chaos = 6,
}

-- Tempos (segundos)
PrisonConfig.Times = {
    LockDuration = 1,      -- Tempo para Sackman trancar
    UnlockDuration = 4,    -- Tempo para aliado abrir
}

-- Protecao
PrisonConfig.Protection = {
    InvulnerabilityAfterRelease = 3,
}

return PrisonConfig
```

---

## 3. Constantes

### 3.1 Constants.lua

```lua
--!strict

local Constants = {}

-- Velocidades base
Constants.BaseSpeed = {
    Survivor = 16,
    Sackman = 18,
    SackmanCarrying = 12.6, -- 18 * 0.7
}

-- Interacao
Constants.Interaction = {
    KeyCollectTime = 1,
    DoorOpenTime = 2,
    PuzzlePieceCollectTime = 1.5,
    PuzzleSolveTime = 30,
    ExitTime = 3,
}

-- XP e Recompensas
Constants.XP = {
    -- Survivor
    Escape = 500,
    Rescue = 200,
    KeyCollect = 50,
    PuzzlePieceCollect = 75,
    PuzzleSolve = 300,
    SurviveTime = 10, -- Por minuto

    -- Sackman
    Capture = 100,
    PerfectCapture = 150,
    Elimination = 250,
    CaptureTime = 15, -- Por minuto com alguem capturado

    -- Ambos
    GameComplete = 100,
    Win = 300,
}

-- Coins
Constants.Coins = {
    Escape = 100,
    Rescue = 50,
    Capture = 30,
    Elimination = 75,
    Win = 150,
    Loss = 25,
}

-- Level
Constants.Level = {
    XPPerLevel = 1000,
    MaxLevel = 100,
}

-- Networking
Constants.Network = {
    UpdateRate = 20,       -- Updates por segundo
    PositionUpdateRate = 10,
    StateSyncRate = 5,
}

-- Audio
Constants.Audio = {
    HeartbeatStartDistance = 20, -- Studs
    HeartbeatMaxDistance = 10,
    FootstepVolume = 0.5,
    AmbientVolume = 0.3,
}

return Constants
```

---

## 4. Enums

### 4.1 Enums.lua

```lua
--!strict

local Enums = {}

-- Estados do jogo
Enums.GameState = {
    Menu = 1,
    Lobby = 2,
    Loading = 3,
    Playing = 4,
    EndGame = 5,
    Results = 6,
}

-- Resultado da partida
Enums.MatchResult = {
    SurvivorsWin = 1,
    SackmanWins = 2,
    Draw = 3,
}

-- Tipo de notificacao
Enums.NotificationType = {
    Info = 1,
    Warning = 2,
    Error = 3,
    Success = 4,
    Capture = 5,
    Objective = 6,
}

-- Prioridade de notificacao
Enums.NotificationPriority = {
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4,
}

-- Tipo de som
Enums.SoundType = {
    Music = 1,
    SFX = 2,
    Ambient = 3,
    UI = 4,
    Voice = 5,
}

-- Direcao
Enums.Direction = {
    North = 1,
    South = 2,
    East = 3,
    West = 4,
    Up = 5,
    Down = 6,
}

-- Input type
Enums.InputType = {
    Keyboard = 1,
    Mouse = 2,
    Touch = 3,
    Gamepad = 4,
}

return Enums
```

---

## 5. Utilidades

### 5.1 Signal.lua

```lua
--!strict

export type Connection = {
    Disconnect: (self: Connection) -> (),
    Connected: boolean,
}

export type Signal<T...> = {
    Connect: (self: Signal<T...>, callback: (T...) -> ()) -> Connection,
    Once: (self: Signal<T...>, callback: (T...) -> ()) -> Connection,
    Fire: (self: Signal<T...>, T...) -> (),
    Wait: (self: Signal<T...>) -> T...,
    DisconnectAll: (self: Signal<T...>) -> (),
}

local function createSignal<T...>(): Signal<T...>
    local connections: {[(T...) -> ()]: boolean} = {}

    local signal: Signal<T...> = {
        Connect = function(self, callback)
            connections[callback] = true

            return {
                Connected = true,
                Disconnect = function(conn)
                    connections[callback] = nil
                    conn.Connected = false
                end,
            }
        end,

        Once = function(self, callback)
            local connection: Connection

            local wrappedCallback = function(...)
                connection:Disconnect()
                callback(...)
            end

            connection = self:Connect(wrappedCallback)
            return connection
        end,

        Fire = function(self, ...)
            for callback, _ in pairs(connections) do
                task.spawn(callback, ...)
            end
        end,

        Wait = function(self)
            local thread = coroutine.running()

            self:Once(function(...)
                task.spawn(thread, ...)
            end)

            return coroutine.yield()
        end,

        DisconnectAll = function(self)
            table.clear(connections)
        end,
    }

    return signal
end

return {
    new = createSignal,
}
```

---

## 6. Resumo de Arquivos

| Arquivo | Descricao | Localizacao |
|---------|-----------|-------------|
| `PlayerTypes.lua` | Tipos de jogador | `ReplicatedStorage/Shared/Types/` |
| `GameTypes.lua` | Tipos de jogo/partida | `ReplicatedStorage/Shared/Types/` |
| `ClassTypes.lua` | Tipos de classes | `ReplicatedStorage/Shared/Types/` |
| `MapTypes.lua` | Tipos de mapa/interativos | `ReplicatedStorage/Shared/Types/` |
| `NetworkTypes.lua` | Tipos de rede | `ReplicatedStorage/Shared/Types/` |
| `GameConfig.lua` | Config de modos | `ReplicatedStorage/Shared/` |
| `O2Config.lua` | Config de O2 | `ReplicatedStorage/Shared/` |
| `CaptureConfig.lua` | Config de captura | `ReplicatedStorage/Shared/` |
| `StruggleConfig.lua` | Config de struggle | `ReplicatedStorage/Shared/` |
| `RescueConfig.lua` | Config de resgate | `ReplicatedStorage/Shared/` |
| `PrisonConfig.lua` | Config de prisao | `ReplicatedStorage/Shared/` |
| `Constants.lua` | Constantes globais | `ReplicatedStorage/Shared/` |
| `Enums.lua` | Enumeracoes | `ReplicatedStorage/Shared/` |
| `Signal.lua` | Sistema de eventos | `ReplicatedStorage/Shared/Utils/` |

---

*Data Structures Document criado por @lua-scripter (Luau) em 2026-01-28*
*Squad: roblox-game-studio*
*Versao: 1.0.0*
