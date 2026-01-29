# Technical Architecture Document: Sackman

## 1. Visao Geral da Arquitetura

### 1.1 Principios Fundamentais

| Principio | Descricao | Aplicacao |
|-----------|-----------|-----------|
| **Server Authority** | Servidor e fonte unica de verdade | Toda logica de jogo no servidor |
| **Single-Script Architecture (SSA)** | Um entry point por contexto | Main.server.lua + Main.client.lua |
| **Type Safety** | Codigo tipado com --!strict | Todos os modulos |
| **Security by Design** | Nunca confiar no cliente | Validacao em todas as remotes |
| **Modularity** | Sistemas desacoplados | Service Pattern |
| **Performance First** | Otimizar desde o inicio | Object pooling, caching |

### 1.2 Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ROBLOX SERVERS                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    SERVER (Authority)                         │   │
│  │                                                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │   │
│  │  │ GameService │  │MatchService │  │PlayerService│          │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │   │
│  │         │                │                │                   │   │
│  │  ┌──────┴────────────────┴────────────────┴──────┐           │   │
│  │  │              SERVICE CONTROLLER                │           │   │
│  │  └───────────────────────┬───────────────────────┘           │   │
│  │                          │                                    │   │
│  │  ┌─────────────┐  ┌──────┴──────┐  ┌─────────────┐          │   │
│  │  │CaptureSystem│  │  O2System   │  │ObjectivesSys│          │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │   │
│  │                                                               │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │              DATA LAYER                              │    │   │
│  │  │  DataStoreService │ MemoryStoreService              │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                          │                                          │
│                  ┌───────┴───────┐                                  │
│                  │ RemoteEvents  │                                  │
│                  │RemoteFunctions│                                  │
│                  └───────┬───────┘                                  │
│                          │                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    CLIENT (Display Only)                      │   │
│  │                                                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │   │
│  │  │InputContrlr │  │ UIContrlr   │  │CameraContrlr│          │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │   │
│  │         │                │                │                   │   │
│  │  ┌──────┴────────────────┴────────────────┴──────┐           │   │
│  │  │            CONTROLLER MANAGER                  │           │   │
│  │  └───────────────────────┬───────────────────────┘           │   │
│  │                          │                                    │   │
│  │  ┌─────────────┐  ┌──────┴──────┐  ┌─────────────┐          │   │
│  │  │  HUD/UI     │  │   Effects   │  │   Audio     │          │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Estrutura de Pastas

### 2.1 Organizacao do Projeto

```
game/
├── ServerScriptService/
│   └── Main.server.lua           -- Entry point do servidor
│
├── ReplicatedStorage/
│   ├── Shared/                   -- Codigo compartilhado
│   │   ├── Types/                -- Definicoes de tipos
│   │   │   ├── PlayerTypes.lua
│   │   │   ├── GameTypes.lua
│   │   │   ├── ClassTypes.lua
│   │   │   └── NetworkTypes.lua
│   │   ├── Utils/                -- Utilitarios
│   │   │   ├── Math.lua
│   │   │   ├── Table.lua
│   │   │   ├── Signal.lua
│   │   │   └── Promise.lua
│   │   ├── Constants.lua         -- Constantes do jogo
│   │   └── Config.lua            -- Configuracoes
│   │
│   ├── Assets/                   -- Assets replicados
│   │   ├── UI/                   -- Templates de UI
│   │   ├── Effects/              -- Particulas, sons
│   │   └── Models/               -- Modelos compartilhados
│   │
│   └── Remotes/                  -- RemoteEvents/Functions
│       └── init.lua              -- Centralizador de remotes
│
├── ServerStorage/
│   ├── Services/                 -- Services do servidor
│   │   ├── GameService.lua
│   │   ├── MatchService.lua
│   │   ├── PlayerService.lua
│   │   ├── CaptureService.lua
│   │   ├── O2Service.lua
│   │   ├── ObjectiveService.lua
│   │   ├── ClassService.lua
│   │   └── init.lua              -- Service Controller
│   │
│   ├── Systems/                  -- Sistemas de jogo
│   │   ├── AI/
│   │   │   └── SackmanAI.lua
│   │   ├── Combat/
│   │   │   ├── CaptureSystem.lua
│   │   │   └── StunSystem.lua
│   │   ├── Objectives/
│   │   │   ├── KeySystem.lua
│   │   │   ├── PuzzleSystem.lua
│   │   │   └── ExitSystem.lua
│   │   └── Player/
│   │       ├── O2System.lua
│   │       ├── MovementSystem.lua
│   │       └── StruggleSystem.lua
│   │
│   ├── Data/                     -- Dados e configs
│   │   ├── ClassData.lua
│   │   ├── MapData.lua
│   │   └── ItemData.lua
│   │
│   └── Maps/                     -- Mapas do jogo
│       └── Celeiro/
│
└── StarterPlayer/
    ├── StarterPlayerScripts/
    │   └── Main.client.lua       -- Entry point do cliente
    │
    └── StarterCharacterScripts/
        └── Animate.client.lua    -- Animacoes customizadas
```

### 2.2 Convencoes de Nomenclatura

| Tipo | Convencao | Exemplo |
|------|-----------|---------|
| **Services** | PascalCase + Service | `GameService`, `CaptureService` |
| **Systems** | PascalCase + System | `O2System`, `KeySystem` |
| **Types** | PascalCase | `PlayerData`, `CaptureConfig` |
| **Functions** | camelCase | `processCapture()`, `validateInput()` |
| **Constants** | UPPER_SNAKE | `MAX_O2`, `CAPTURE_RANGE` |
| **Private** | _prefixo | `_internalFunction()` |
| **Remotes** | Verb + Noun | `RequestCapture`, `UpdateO2` |

---

## 3. Arquitetura Server-Side

### 3.1 Service Controller

```lua
--!strict
-- ServerStorage/Services/init.lua

local Services = {}

-- Service interface
export type ServiceInterface = {
    Name: string,
    Priority: number,
    Initialize: (self: ServiceInterface) -> (),
    Start: (self: ServiceInterface) -> (),
    Stop: (self: ServiceInterface) -> (),
}

-- Service registry
local registeredServices: {[string]: ServiceInterface} = {}
local initializationOrder: {ServiceInterface} = {}
local started = false

function Services.Register(service: ServiceInterface)
    if registeredServices[service.Name] then
        warn(`Service already registered: {service.Name}`)
        return
    end

    registeredServices[service.Name] = service
    table.insert(initializationOrder, service)

    -- Sort by priority
    table.sort(initializationOrder, function(a, b)
        return a.Priority < b.Priority
    end)
end

function Services.Get(name: string): ServiceInterface?
    return registeredServices[name]
end

function Services.InitializeAll()
    for _, service in ipairs(initializationOrder) do
        print(`[Services] Initializing: {service.Name}`)
        service:Initialize()
    end
end

function Services.StartAll()
    if started then return end
    started = true

    for _, service in ipairs(initializationOrder) do
        print(`[Services] Starting: {service.Name}`)
        service:Start()
    end
end

function Services.StopAll()
    if not started then return end

    -- Stop in reverse order
    for i = #initializationOrder, 1, -1 do
        local service = initializationOrder[i]
        print(`[Services] Stopping: {service.Name}`)
        service:Stop()
    end

    started = false
end

return Services
```

### 3.2 Main Server Entry Point

```lua
--!strict
-- ServerScriptService/Main.server.lua

local ServerStorage = game:GetService("ServerStorage")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

-- Load services
local Services = require(ServerStorage.Services)

-- Register all services (order by priority)
Services.Register(require(ServerStorage.Services.PlayerService))    -- Priority 1
Services.Register(require(ServerStorage.Services.ClassService))     -- Priority 2
Services.Register(require(ServerStorage.Services.O2Service))        -- Priority 3
Services.Register(require(ServerStorage.Services.MatchService))     -- Priority 4
Services.Register(require(ServerStorage.Services.ObjectiveService)) -- Priority 5
Services.Register(require(ServerStorage.Services.CaptureService))   -- Priority 6
Services.Register(require(ServerStorage.Services.GameService))      -- Priority 10

-- Initialize
Services.InitializeAll()

-- Start when first player joins or immediately
if #Players:GetPlayers() > 0 then
    Services.StartAll()
else
    Players.PlayerAdded:Once(function()
        Services.StartAll()
    end)
end

-- Cleanup on server shutdown
game:BindToClose(function()
    Services.StopAll()
end)

print("[Sackman] Server initialized successfully")
```

### 3.3 Exemplo de Service: CaptureService

```lua
--!strict
-- ServerStorage/Services/CaptureService.lua

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")

local Types = require(ReplicatedStorage.Shared.Types.GameTypes)
local Config = require(ReplicatedStorage.Shared.Config)
local Signal = require(ReplicatedStorage.Shared.Utils.Signal)

-- Types
export type CaptureResult = {
    success: boolean,
    perfect: boolean,
    reason: string?,
}

-- Service definition
local CaptureService = {
    Name = "CaptureService",
    Priority = 6,
}

-- Private state
local captureAttempts: {[Player]: number} = {}
local captureCooldowns: {[Player]: number} = {}

-- Events
CaptureService.OnCapture = Signal.new() -- (sackman: Player, survivor: Player, perfect: boolean)
CaptureService.OnCaptureFailed = Signal.new() -- (sackman: Player, reason: string)

function CaptureService:Initialize()
    -- Setup remotes
    local Remotes = require(ReplicatedStorage.Remotes)

    Remotes.RequestCapture.OnServerEvent:Connect(function(player, targetUserId, timing)
        self:_handleCaptureRequest(player, targetUserId, timing)
    end)
end

function CaptureService:Start()
    -- Nothing to start
end

function CaptureService:Stop()
    -- Cleanup
    table.clear(captureAttempts)
    table.clear(captureCooldowns)
end

-- Check if player can attempt capture
function CaptureService:CanCapture(sackman: Player): (boolean, string?)
    -- Check cooldown
    local cooldownEnd = captureCooldowns[sackman]
    if cooldownEnd and os.clock() < cooldownEnd then
        local remaining = cooldownEnd - os.clock()
        return false, `Cooldown: {string.format("%.1f", remaining)}s`
    end

    -- Check if player is Sackman
    local PlayerService = require(ServerStorage.Services.PlayerService)
    if not PlayerService:IsSackman(sackman) then
        return false, "Not Sackman"
    end

    return true, nil
end

-- Validate capture target
function CaptureService:ValidateTarget(sackman: Player, survivor: Player): (boolean, string?)
    local PlayerService = require(ServerStorage.Services.PlayerService)

    -- Check if target is valid survivor
    if PlayerService:IsSackman(survivor) then
        return false, "Cannot capture another Sackman"
    end

    -- Check if already captured
    if PlayerService:IsCaptured(survivor) then
        return false, "Already captured"
    end

    -- Check if desmaiado (cannot recapture)
    local O2Service = require(ServerStorage.Services.O2Service)
    if O2Service:IsDesmaiado(survivor) then
        return false, "Cannot capture desmaiado"
    end

    -- Check distance
    local sackmanChar = sackman.Character
    local survivorChar = survivor.Character

    if not sackmanChar or not survivorChar then
        return false, "Invalid characters"
    end

    local sackmanRoot = sackmanChar:FindFirstChild("HumanoidRootPart")
    local survivorRoot = survivorChar:FindFirstChild("HumanoidRootPart")

    if not sackmanRoot or not survivorRoot then
        return false, "Invalid characters"
    end

    local distance = (sackmanRoot.Position - survivorRoot.Position).Magnitude
    if distance > Config.CAPTURE_RANGE then
        return false, `Out of range ({string.format("%.1f", distance)} studs)`
    end

    return true, nil
end

-- Process capture timing
function CaptureService:ProcessTiming(timing: number): CaptureResult
    local config = Config.CaptureConfig

    -- timing is 0-1, where 0.5 is perfect
    local deviation = math.abs(timing - 0.5)

    -- Perfect zone: within zona_perfeita
    local perfectZone = config.zona_perfeita / config.janela_timing
    if deviation <= perfectZone then
        return {
            success = true,
            perfect = true,
        }
    end

    -- Good zone: within janela_timing
    local goodZone = 0.5 -- half the bar
    if deviation <= goodZone then
        return {
            success = true,
            perfect = false,
        }
    end

    -- Failed
    return {
        success = false,
        perfect = false,
        reason = "Missed timing",
    }
end

-- Handle capture request from client
function CaptureService:_handleCaptureRequest(sackman: Player, targetUserId: number, timing: number)
    -- Validate timing value
    if typeof(timing) ~= "number" or timing < 0 or timing > 1 then
        warn(`[CaptureService] Invalid timing from {sackman.Name}: {timing}`)
        return
    end

    -- Can capture?
    local canCapture, reason = self:CanCapture(sackman)
    if not canCapture then
        self.OnCaptureFailed:Fire(sackman, reason)
        return
    end

    -- Find target
    local Players = game:GetService("Players")
    local survivor = Players:GetPlayerByUserId(targetUserId)
    if not survivor then
        self.OnCaptureFailed:Fire(sackman, "Invalid target")
        return
    end

    -- Validate target
    local validTarget, targetReason = self:ValidateTarget(sackman, survivor)
    if not validTarget then
        self.OnCaptureFailed:Fire(sackman, targetReason)
        return
    end

    -- Process timing
    local result = self:ProcessTiming(timing)

    if result.success then
        -- Execute capture
        self:_executeCapture(sackman, survivor, result.perfect)
    else
        -- Apply failure penalty
        self:_applyFailurePenalty(sackman)
        self.OnCaptureFailed:Fire(sackman, result.reason)
    end
end

-- Execute successful capture
function CaptureService:_executeCapture(sackman: Player, survivor: Player, perfect: boolean)
    local PlayerService = require(ServerStorage.Services.PlayerService)

    -- Mark as captured
    PlayerService:SetCaptured(survivor, true, sackman)

    -- Start O2 drain
    local O2Service = require(ServerStorage.Services.O2Service)
    O2Service:StartSacoDrain(survivor)

    -- Apply perfect bonus (extra stun)
    if perfect then
        -- TODO: Apply stun bonus
    end

    -- Fire event
    self.OnCapture:Fire(sackman, survivor, perfect)

    -- Notify clients
    local Remotes = require(ReplicatedStorage.Remotes)
    Remotes.CaptureExecuted:FireAllClients(sackman.UserId, survivor.UserId, perfect)
end

-- Apply failure penalty
function CaptureService:_applyFailurePenalty(sackman: Player)
    local config = Config.CaptureConfig

    -- Set cooldown
    captureCooldowns[sackman] = os.clock() + config.falha_cooldown

    -- Apply slowdown
    local character = sackman.Character
    local humanoid = character and character:FindFirstChildOfClass("Humanoid")
    if humanoid then
        local originalSpeed = humanoid.WalkSpeed
        humanoid.WalkSpeed = originalSpeed * config.falha_slowdown

        task.delay(1, function()
            if humanoid and humanoid.Parent then
                humanoid.WalkSpeed = originalSpeed
            end
        end)
    end

    -- Notify client
    local Remotes = require(ReplicatedStorage.Remotes)
    Remotes.CaptureFailed:FireClient(sackman, config.falha_cooldown)
end

return CaptureService
```

---

## 4. Arquitetura Client-Side

### 4.1 Controller Manager

```lua
--!strict
-- StarterPlayerScripts/Controllers/init.lua

local Controllers = {}

export type ControllerInterface = {
    Name: string,
    Priority: number,
    Initialize: (self: ControllerInterface) -> (),
    Start: (self: ControllerInterface) -> (),
    Stop: (self: ControllerInterface) -> (),
}

local registeredControllers: {[string]: ControllerInterface} = {}
local initializationOrder: {ControllerInterface} = {}
local started = false

function Controllers.Register(controller: ControllerInterface)
    if registeredControllers[controller.Name] then
        warn(`Controller already registered: {controller.Name}`)
        return
    end

    registeredControllers[controller.Name] = controller
    table.insert(initializationOrder, controller)

    table.sort(initializationOrder, function(a, b)
        return a.Priority < b.Priority
    end)
end

function Controllers.Get(name: string): ControllerInterface?
    return registeredControllers[name]
end

function Controllers.InitializeAll()
    for _, controller in ipairs(initializationOrder) do
        print(`[Controllers] Initializing: {controller.Name}`)
        controller:Initialize()
    end
end

function Controllers.StartAll()
    if started then return end
    started = true

    for _, controller in ipairs(initializationOrder) do
        print(`[Controllers] Starting: {controller.Name}`)
        controller:Start()
    end
end

return Controllers
```

### 4.2 Main Client Entry Point

```lua
--!strict
-- StarterPlayerScripts/Main.client.lua

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local Controllers = require(script.Parent.Controllers)

-- Wait for character
local player = Players.LocalPlayer
player.CharacterAdded:Wait()

-- Register controllers
Controllers.Register(require(script.Parent.Controllers.InputController))     -- Priority 1
Controllers.Register(require(script.Parent.Controllers.CameraController))    -- Priority 2
Controllers.Register(require(script.Parent.Controllers.UIController))        -- Priority 3
Controllers.Register(require(script.Parent.Controllers.AudioController))     -- Priority 4
Controllers.Register(require(script.Parent.Controllers.EffectsController))   -- Priority 5

-- Initialize and start
Controllers.InitializeAll()
Controllers.StartAll()

print("[Sackman] Client initialized successfully")
```

### 4.3 Exemplo de Controller: InputController

```lua
--!strict
-- StarterPlayerScripts/Controllers/InputController.lua

local UserInputService = game:GetService("UserInputService")
local ContextActionService = game:GetService("ContextActionService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Signal = require(ReplicatedStorage.Shared.Utils.Signal)

local InputController = {
    Name = "InputController",
    Priority = 1,
}

-- Input events
InputController.OnMove = Signal.new()       -- (direction: Vector3)
InputController.OnJump = Signal.new()       -- ()
InputController.OnCrouch = Signal.new()     -- (crouching: boolean)
InputController.OnInteract = Signal.new()   -- ()
InputController.OnAbility = Signal.new()    -- ()
InputController.OnCapture = Signal.new()    -- (timing: number)

-- State
local moveDirection = Vector3.zero
local isCrouching = false
local isMobile = UserInputService.TouchEnabled

function InputController:Initialize()
    -- Setup input bindings
    self:_setupKeyboardBindings()

    if isMobile then
        self:_setupMobileBindings()
    end
end

function InputController:Start()
    -- Start input processing loop
    task.spawn(function()
        while true do
            self.OnMove:Fire(moveDirection)
            task.wait()
        end
    end)
end

function InputController:Stop()
    ContextActionService:UnbindAllActions()
end

function InputController:_setupKeyboardBindings()
    -- Movement
    UserInputService.InputBegan:Connect(function(input, gameProcessed)
        if gameProcessed then return end

        if input.KeyCode == Enum.KeyCode.W then
            moveDirection = Vector3.new(0, 0, -1)
        elseif input.KeyCode == Enum.KeyCode.S then
            moveDirection = Vector3.new(0, 0, 1)
        elseif input.KeyCode == Enum.KeyCode.A then
            moveDirection = Vector3.new(-1, 0, 0)
        elseif input.KeyCode == Enum.KeyCode.D then
            moveDirection = Vector3.new(1, 0, 0)
        elseif input.KeyCode == Enum.KeyCode.Space then
            self.OnJump:Fire()
        elseif input.KeyCode == Enum.KeyCode.LeftControl then
            isCrouching = true
            self.OnCrouch:Fire(true)
        elseif input.KeyCode == Enum.KeyCode.E then
            self.OnInteract:Fire()
        elseif input.KeyCode == Enum.KeyCode.Q then
            self.OnAbility:Fire()
        end
    end)

    UserInputService.InputEnded:Connect(function(input, gameProcessed)
        if input.KeyCode == Enum.KeyCode.W or input.KeyCode == Enum.KeyCode.S then
            moveDirection = Vector3.new(moveDirection.X, 0, 0)
        elseif input.KeyCode == Enum.KeyCode.A or input.KeyCode == Enum.KeyCode.D then
            moveDirection = Vector3.new(0, 0, moveDirection.Z)
        elseif input.KeyCode == Enum.KeyCode.LeftControl then
            isCrouching = false
            self.OnCrouch:Fire(false)
        end
    end)

    -- Mouse click for capture
    UserInputService.InputBegan:Connect(function(input, gameProcessed)
        if gameProcessed then return end

        if input.UserInputType == Enum.UserInputType.MouseButton1 then
            -- Calculate timing based on UI indicator
            local UIController = require(script.Parent.UIController)
            local timing = UIController:GetCaptureTimingValue()
            self.OnCapture:Fire(timing)
        end
    end)
end

function InputController:_setupMobileBindings()
    -- Virtual joystick is handled by default Roblox controls
    -- Custom buttons are in UIController
end

return InputController
```

---

## 5. Sistema de Networking

### 5.1 Centralizador de Remotes

```lua
--!strict
-- ReplicatedStorage/Remotes/init.lua

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Remotes = {}

-- Remote definitions
local remoteDefinitions = {
    -- Game flow
    { name = "GameStateChanged", type = "Event" },
    { name = "MatchStarted", type = "Event" },
    { name = "MatchEnded", type = "Event" },

    -- Player actions (Client -> Server)
    { name = "RequestCapture", type = "Event" },
    { name = "RequestInteract", type = "Event" },
    { name = "RequestAbility", type = "Event" },
    { name = "RequestStruggle", type = "Event" },

    -- Game updates (Server -> Client)
    { name = "CaptureExecuted", type = "Event" },
    { name = "CaptureFailed", type = "Event" },
    { name = "O2Updated", type = "Event" },
    { name = "ObjectiveCompleted", type = "Event" },
    { name = "KeyCollected", type = "Event" },
    { name = "DoorOpened", type = "Event" },
    { name = "PuzzleSolved", type = "Event" },
    { name = "ExitOpened", type = "Event" },

    -- Player state
    { name = "PlayerStateChanged", type = "Event" },
    { name = "GetPlayerData", type = "Function" },

    -- Class abilities
    { name = "AbilityActivated", type = "Event" },
    { name = "AbilityEnded", type = "Event" },
}

-- Create remotes folder
local remotesFolder = ReplicatedStorage:FindFirstChild("RemotesFolder")

if RunService:IsServer() then
    -- Server creates remotes
    if not remotesFolder then
        remotesFolder = Instance.new("Folder")
        remotesFolder.Name = "RemotesFolder"
        remotesFolder.Parent = ReplicatedStorage
    end

    for _, def in ipairs(remoteDefinitions) do
        local remote
        if def.type == "Event" then
            remote = Instance.new("RemoteEvent")
        else
            remote = Instance.new("RemoteFunction")
        end
        remote.Name = def.name
        remote.Parent = remotesFolder
        Remotes[def.name] = remote
    end
else
    -- Client waits for remotes
    remotesFolder = ReplicatedStorage:WaitForChild("RemotesFolder", 10)

    if remotesFolder then
        for _, def in ipairs(remoteDefinitions) do
            local remote = remotesFolder:WaitForChild(def.name, 5)
            if remote then
                Remotes[def.name] = remote
            else
                warn(`[Remotes] Failed to find: {def.name}`)
            end
        end
    end
end

return Remotes
```

### 5.2 Network Security Layer

```lua
--!strict
-- ServerStorage/Security/NetworkValidator.lua

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Types = require(ReplicatedStorage.Shared.Types.NetworkTypes)

local NetworkValidator = {}

-- Rate limiting
local requestCounts: {[Player]: {[string]: {number}}} = {}
local RATE_LIMITS: {[string]: number} = {
    RequestCapture = 5,      -- 5 per second
    RequestInteract = 10,    -- 10 per second
    RequestAbility = 3,      -- 3 per second
    RequestStruggle = 20,    -- 20 per second (QTE)
}

-- Validation schemas
local schemas: {[string]: (any) -> (boolean, any?)} = {}

function NetworkValidator.RegisterSchema(eventName: string, validator: (any) -> (boolean, any?))
    schemas[eventName] = validator
end

function NetworkValidator.CheckRateLimit(player: Player, eventName: string): boolean
    local limit = RATE_LIMITS[eventName]
    if not limit then return true end

    local now = os.clock()

    if not requestCounts[player] then
        requestCounts[player] = {}
    end

    if not requestCounts[player][eventName] then
        requestCounts[player][eventName] = {}
    end

    -- Clean old requests (1 second window)
    local requests = requestCounts[player][eventName]
    local validRequests: {number} = {}

    for _, timestamp in ipairs(requests) do
        if now - timestamp < 1 then
            table.insert(validRequests, timestamp)
        end
    end

    if #validRequests >= limit then
        return false
    end

    table.insert(validRequests, now)
    requestCounts[player][eventName] = validRequests

    return true
end

function NetworkValidator.Validate(eventName: string, data: any): (boolean, any?)
    local validator = schemas[eventName]
    if not validator then
        return true, data
    end

    return validator(data)
end

function NetworkValidator.CleanupPlayer(player: Player)
    requestCounts[player] = nil
end

-- Register default schemas
NetworkValidator.RegisterSchema("RequestCapture", function(data)
    if typeof(data) ~= "table" then
        return false, nil
    end

    if typeof(data.targetUserId) ~= "number" then
        return false, nil
    end

    if typeof(data.timing) ~= "number" or data.timing < 0 or data.timing > 1 then
        return false, nil
    end

    return true, data
end)

NetworkValidator.RegisterSchema("RequestInteract", function(data)
    if typeof(data) ~= "table" then
        return false, nil
    end

    if typeof(data.objectId) ~= "string" then
        return false, nil
    end

    return true, data
end)

return NetworkValidator
```

---

## 6. Sistema de Estados

### 6.1 State Machine para Match

```lua
--!strict
-- ServerStorage/Systems/MatchStateMachine.lua

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Signal = require(ReplicatedStorage.Shared.Utils.Signal)

export type MatchState = "Lobby" | "Starting" | "Playing" | "EndGame" | "Finished"

export type MatchContext = {
    matchId: string,
    mode: "Classic" | "Chaos",
    players: {Player},
    sackmen: {Player},
    survivors: {Player},
    capturedCount: number,
    escapedCount: number,
    startTime: number,
    endTime: number?,
}

local MatchStateMachine = {}
MatchStateMachine.__index = MatchStateMachine

function MatchStateMachine.new(context: MatchContext)
    local self = setmetatable({}, MatchStateMachine)

    self.context = context
    self.currentState = "Lobby" :: MatchState
    self.onStateChanged = Signal.new()

    return self
end

function MatchStateMachine:GetState(): MatchState
    return self.currentState
end

function MatchStateMachine:TransitionTo(newState: MatchState)
    local oldState = self.currentState

    -- Validate transition
    if not self:_canTransition(oldState, newState) then
        warn(`[MatchStateMachine] Invalid transition: {oldState} -> {newState}`)
        return
    end

    -- Exit old state
    self:_exitState(oldState)

    -- Enter new state
    self.currentState = newState
    self:_enterState(newState)

    -- Fire event
    self.onStateChanged:Fire(oldState, newState)
end

function MatchStateMachine:_canTransition(from: MatchState, to: MatchState): boolean
    local validTransitions: {[MatchState]: {MatchState}} = {
        Lobby = {"Starting"},
        Starting = {"Playing"},
        Playing = {"EndGame"},
        EndGame = {"Finished"},
        Finished = {"Lobby"}, -- For restart
    }

    local valid = validTransitions[from]
    return valid and table.find(valid, to) ~= nil
end

function MatchStateMachine:_enterState(state: MatchState)
    if state == "Lobby" then
        -- Reset context
        self.context.capturedCount = 0
        self.context.escapedCount = 0

    elseif state == "Starting" then
        -- Countdown, spawn players
        self.context.startTime = os.clock()

    elseif state == "Playing" then
        -- Game active

    elseif state == "EndGame" then
        -- Timer ended or objectives complete
        self.context.endTime = os.clock()

    elseif state == "Finished" then
        -- Show results
    end
end

function MatchStateMachine:_exitState(state: MatchState)
    -- Cleanup for each state
end

function MatchStateMachine:Destroy()
    self.onStateChanged:DisconnectAll()
end

return MatchStateMachine
```

### 6.2 State Machine para Player

```lua
--!strict
-- ServerStorage/Systems/PlayerStateMachine.lua

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Signal = require(ReplicatedStorage.Shared.Utils.Signal)

export type PlayerState =
    "Alive" |           -- Normal state
    "Running" |         -- Correndo (consuming O2)
    "Hiding" |          -- Escondido
    "Captured" |        -- No saco sendo carregado
    "Imprisoned" |      -- Na prisao
    "Struggling" |      -- Tentando escapar
    "Desmaiado" |       -- Unconscious
    "Eliminated" |      -- Out of game
    "Escaped"           -- Won

export type PlayerContext = {
    player: Player,
    role: "Survivor" | "Sackman",
    class: string,
    o2: number,
    hp: number,
    capturedBy: Player?,
    rescuedBy: Player?,
}

local PlayerStateMachine = {}
PlayerStateMachine.__index = PlayerStateMachine

function PlayerStateMachine.new(context: PlayerContext)
    local self = setmetatable({}, PlayerStateMachine)

    self.context = context
    self.currentState = "Alive" :: PlayerState
    self.onStateChanged = Signal.new()

    return self
end

function PlayerStateMachine:GetState(): PlayerState
    return self.currentState
end

function PlayerStateMachine:TransitionTo(newState: PlayerState, metadata: {[string]: any}?)
    local oldState = self.currentState

    if not self:_canTransition(oldState, newState) then
        warn(`[PlayerStateMachine] Invalid transition: {oldState} -> {newState}`)
        return false
    end

    self:_exitState(oldState)
    self.currentState = newState
    self:_enterState(newState, metadata)

    self.onStateChanged:Fire(oldState, newState, metadata)
    return true
end

function PlayerStateMachine:_canTransition(from: PlayerState, to: PlayerState): boolean
    local validTransitions: {[PlayerState]: {PlayerState}} = {
        Alive = {"Running", "Hiding", "Captured", "Escaped"},
        Running = {"Alive", "Captured", "Escaped"},
        Hiding = {"Alive", "Captured"},
        Captured = {"Struggling", "Imprisoned", "Desmaiado", "Alive"}, -- Alive if rescued while being carried
        Imprisoned = {"Struggling", "Desmaiado", "Alive"},
        Struggling = {"Captured", "Imprisoned", "Alive"}, -- Alive if escape successful
        Desmaiado = {"Alive", "Eliminated"}, -- Alive if rescued
        Eliminated = {}, -- Terminal state
        Escaped = {}, -- Terminal state
    }

    local valid = validTransitions[from]
    return valid and table.find(valid, to) ~= nil
end

function PlayerStateMachine:_enterState(state: PlayerState, metadata: {[string]: any}?)
    if state == "Captured" then
        self.context.capturedBy = metadata and metadata.capturedBy

    elseif state == "Desmaiado" then
        -- O2 hit 0

    elseif state == "Alive" and self.context.capturedBy then
        -- Rescued
        self.context.rescuedBy = metadata and metadata.rescuedBy
        self.context.capturedBy = nil
    end
end

function PlayerStateMachine:_exitState(state: PlayerState)
    if state == "Running" then
        -- Stop O2 consumption from running
    end
end

function PlayerStateMachine:Destroy()
    self.onStateChanged:DisconnectAll()
end

return PlayerStateMachine
```

---

## 7. Sistema de Dados

### 7.1 DataStore Pattern

```lua
--!strict
-- ServerStorage/Data/PlayerDataStore.lua

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

local Promise = require(game.ReplicatedStorage.Shared.Utils.Promise)

local PlayerDataStore = {}

local DATA_VERSION = 1
local AUTOSAVE_INTERVAL = 60

-- DataStore reference
local store = DataStoreService:GetDataStore("SackmanPlayerData_v1")

-- Session data cache
local sessionData: {[Player]: PlayerSaveData} = {}
local dataLocks: {[number]: boolean} = {}

export type PlayerSaveData = {
    version: number,

    -- Progress
    level: number,
    experience: number,
    gamesPlayed: number,
    survivorWins: number,
    sackmanWins: number,

    -- Stats
    totalCaptures: number,
    totalEscapes: number,
    totalRescues: number,

    -- Unlocks
    unlockedClasses: {string},
    unlockedSkins: {string},

    -- Preferences
    preferredRole: "Survivor" | "Sackman" | "Any",
    favoriteClass: string?,

    -- Purchases
    purchaseHistory: {string},

    -- Metadata
    firstPlayDate: number,
    lastPlayDate: number,
    totalPlayTime: number,
}

local DEFAULT_DATA: PlayerSaveData = {
    version = DATA_VERSION,
    level = 1,
    experience = 0,
    gamesPlayed = 0,
    survivorWins = 0,
    sackmanWins = 0,
    totalCaptures = 0,
    totalEscapes = 0,
    totalRescues = 0,
    unlockedClasses = {"Scout", "Collector"}, -- Default unlocked
    unlockedSkins = {},
    preferredRole = "Any",
    favoriteClass = nil,
    purchaseHistory = {},
    firstPlayDate = 0,
    lastPlayDate = 0,
    totalPlayTime = 0,
}

-- Load player data
function PlayerDataStore.Load(player: Player): Promise.Promise<PlayerSaveData>
    return Promise.new(function(resolve, reject)
        local userId = player.UserId
        local key = `player_{userId}`

        -- Check if already locked
        if dataLocks[userId] then
            reject("Data already being loaded")
            return
        end

        dataLocks[userId] = true

        local success, data = pcall(function()
            return store:GetAsync(key)
        end)

        if not success then
            dataLocks[userId] = nil
            reject(`DataStore error: {data}`)
            return
        end

        -- Apply defaults and migrations
        local playerData = PlayerDataStore._reconcile(data)
        playerData.lastPlayDate = os.time()

        if playerData.firstPlayDate == 0 then
            playerData.firstPlayDate = os.time()
        end

        -- Cache in session
        sessionData[player] = playerData

        resolve(playerData)
    end)
end

-- Save player data
function PlayerDataStore.Save(player: Player): Promise.Promise<boolean>
    return Promise.new(function(resolve, reject)
        local data = sessionData[player]
        if not data then
            reject("No data to save")
            return
        end

        local key = `player_{player.UserId}`

        local success, err = pcall(function()
            store:SetAsync(key, data)
        end)

        if success then
            resolve(true)
        else
            reject(`Save failed: {err}`)
        end
    end)
end

-- Get cached data
function PlayerDataStore.Get(player: Player): PlayerSaveData?
    return sessionData[player]
end

-- Update cached data
function PlayerDataStore.Update(player: Player, updates: {[string]: any})
    local data = sessionData[player]
    if not data then return end

    for key, value in pairs(updates) do
        if DEFAULT_DATA[key] ~= nil then
            data[key] = value
        end
    end
end

-- Reconcile with defaults
function PlayerDataStore._reconcile(data: any?): PlayerSaveData
    if not data then
        return table.clone(DEFAULT_DATA)
    end

    local reconciled = table.clone(DEFAULT_DATA)

    for key, value in pairs(data) do
        if reconciled[key] ~= nil then
            reconciled[key] = value
        end
    end

    -- Run migrations if needed
    if reconciled.version < DATA_VERSION then
        reconciled = PlayerDataStore._migrate(reconciled)
    end

    return reconciled
end

-- Data migrations
function PlayerDataStore._migrate(data: PlayerSaveData): PlayerSaveData
    -- Add migration logic here as versions increase
    data.version = DATA_VERSION
    return data
end

-- Cleanup on player leave
function PlayerDataStore.Cleanup(player: Player)
    local userId = player.UserId

    -- Save before cleanup
    PlayerDataStore.Save(player):catch(function(err)
        warn(`[PlayerDataStore] Failed to save on cleanup: {err}`)
    end):finally(function()
        sessionData[player] = nil
        dataLocks[userId] = nil
    end)
end

-- Auto-save loop
task.spawn(function()
    while true do
        task.wait(AUTOSAVE_INTERVAL)

        for player, _ in pairs(sessionData) do
            PlayerDataStore.Save(player):catch(function(err)
                warn(`[PlayerDataStore] Auto-save failed for {player.Name}: {err}`)
            end)
        end
    end
end)

-- Bind to player leaving
Players.PlayerRemoving:Connect(function(player)
    PlayerDataStore.Cleanup(player)
end)

-- Bind to server shutdown
game:BindToClose(function()
    local promises = {}

    for player, _ in pairs(sessionData) do
        table.insert(promises, PlayerDataStore.Save(player))
    end

    Promise.all(promises):await()
end)

return PlayerDataStore
```

---

## 8. Performance Considerations

### 8.1 Object Pooling

```lua
--!strict
-- ReplicatedStorage/Shared/Utils/ObjectPool.lua

export type ObjectPool<T> = {
    available: {T},
    inUse: {T},
    factory: () -> T,
    reset: (T) -> (),
    maxSize: number,

    Get: (self: ObjectPool<T>) -> T,
    Return: (self: ObjectPool<T>, object: T) -> (),
    Prewarm: (self: ObjectPool<T>, count: number) -> (),
    Clear: (self: ObjectPool<T>) -> (),
}

local function createObjectPool<T>(
    factory: () -> T,
    reset: (T) -> (),
    maxSize: number?
): ObjectPool<T>
    local pool: ObjectPool<T> = {
        available = {},
        inUse = {},
        factory = factory,
        reset = reset,
        maxSize = maxSize or 100,

        Get = function(self)
            local object: T

            if #self.available > 0 then
                object = table.remove(self.available) :: T
            else
                object = self.factory()
            end

            table.insert(self.inUse, object)
            return object
        end,

        Return = function(self, object)
            local index = table.find(self.inUse, object)
            if index then
                table.remove(self.inUse, index)
            end

            if #self.available < self.maxSize then
                self.reset(object)
                table.insert(self.available, object)
            else
                -- Destroy excess objects
                if typeof(object) == "Instance" then
                    (object :: Instance):Destroy()
                end
            end
        end,

        Prewarm = function(self, count)
            for _ = 1, count do
                if #self.available >= self.maxSize then break end
                local object = self.factory()
                table.insert(self.available, object)
            end
        end,

        Clear = function(self)
            for _, object in ipairs(self.available) do
                if typeof(object) == "Instance" then
                    (object :: Instance):Destroy()
                end
            end
            table.clear(self.available)

            for _, object in ipairs(self.inUse) do
                if typeof(object) == "Instance" then
                    (object :: Instance):Destroy()
                end
            end
            table.clear(self.inUse)
        end,
    }

    return pool
end

return {
    new = createObjectPool,
}
```

### 8.2 Batch Updates

```lua
--!strict
-- ReplicatedStorage/Shared/Utils/Batcher.lua

export type Batcher<T> = {
    items: {T},
    batchSize: number,
    interval: number,
    processor: ({T}) -> (),

    Add: (self: Batcher<T>, item: T) -> (),
    Flush: (self: Batcher<T>) -> (),
    Start: (self: Batcher<T>) -> (),
    Stop: (self: Batcher<T>) -> (),
}

local function createBatcher<T>(
    processor: ({T}) -> (),
    batchSize: number?,
    interval: number?
): Batcher<T>
    local running = false

    local batcher: Batcher<T> = {
        items = {},
        batchSize = batchSize or 10,
        interval = interval or 0.1,
        processor = processor,

        Add = function(self, item)
            table.insert(self.items, item)

            if #self.items >= self.batchSize then
                self:Flush()
            end
        end,

        Flush = function(self)
            if #self.items == 0 then return end

            local batch = self.items
            self.items = {}

            self.processor(batch)
        end,

        Start = function(self)
            if running then return end
            running = true

            task.spawn(function()
                while running do
                    task.wait(self.interval)
                    self:Flush()
                end
            end)
        end,

        Stop = function(self)
            running = false
            self:Flush()
        end,
    }

    return batcher
end

return {
    new = createBatcher,
}
```

---

## 9. Checklist de Implementacao

### 9.1 MVP (Alpha)

| Sistema | Status | Prioridade |
|---------|--------|------------|
| Service Controller | [ ] | 1 |
| PlayerService | [ ] | 1 |
| ClassService | [ ] | 1 |
| MatchService | [ ] | 1 |
| CaptureService | [ ] | 2 |
| O2Service | [ ] | 2 |
| ObjectiveService (Keys/Puzzle) | [ ] | 2 |
| Input Controller | [ ] | 2 |
| HUD Controller | [ ] | 2 |
| Network Validation | [ ] | 2 |
| DataStore | [ ] | 3 |
| Audio Controller | [ ] | 3 |

### 9.2 Metricas de Performance Target

| Metrica | Target | Critico |
|---------|--------|---------|
| Server Heartbeat | < 20ms | > 50ms |
| Network Latency | < 100ms | > 200ms |
| Memory Usage | < 500MB | > 800MB |
| Client FPS | 60 fps | < 30 fps |
| DataStore Requests | < 5/min/player | Budget limit |

---

*Technical Architecture Document criado por @lua-scripter (Luau) em 2026-01-28*
*Squad: roblox-game-studio*
*Versao: 1.0.0*
