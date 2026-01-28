---
title: "Luau Architecture Patterns Guide"
agent: lua-scripter
category: architecture
version: 1.0.0
last_updated: 2025-01-28
tags: [architecture, patterns, services, events, state-machines, organization]
---

# Luau Architecture Patterns Guide

A comprehensive guide to software architecture patterns for building maintainable, scalable Roblox games using Luau.

---

## Table of Contents

1. [Service Pattern Implementations](#service-pattern-implementations)
2. [Event-Driven Architecture](#event-driven-architecture)
3. [State Machines](#state-machines)
4. [Command Pattern](#command-pattern)
5. [Observer Pattern](#observer-pattern)
6. [Factory Pattern](#factory-pattern)
7. [Dependency Injection](#dependency-injection)
8. [Code Organization for Large Games](#code-organization-for-large-games)

---

## Service Pattern Implementations

### Basic Service Pattern

The Service Pattern provides a centralized way to manage game systems with consistent interfaces.

```lua
--!strict

-- Base service interface
type ServiceInterface = {
    Name: string,
    Priority: number,
    Initialize: (self: ServiceInterface) -> (),
    Start: (self: ServiceInterface) -> (),
    Stop: (self: ServiceInterface) -> (),
}

-- Service controller that manages all services
type ServiceController = {
    services: {[string]: ServiceInterface},
    initialized: boolean,
    started: boolean,

    RegisterService: (self: ServiceController, service: ServiceInterface) -> (),
    GetService: (self: ServiceController, name: string) -> ServiceInterface?,
    InitializeAll: (self: ServiceController) -> (),
    StartAll: (self: ServiceController) -> (),
    StopAll: (self: ServiceController) -> (),
}

local function createServiceController(): ServiceController
    local controller: ServiceController = {
        services = {},
        initialized = false,
        started = false,

        RegisterService = function(self, service)
            if self.services[service.Name] then
                warn(`Service already registered: {service.Name}`)
                return
            end
            self.services[service.Name] = service
        end,

        GetService = function(self, name)
            return self.services[name]
        end,

        InitializeAll = function(self)
            if self.initialized then return end

            -- Sort by priority
            local sorted: {ServiceInterface} = {}
            for _, service in pairs(self.services) do
                table.insert(sorted, service)
            end
            table.sort(sorted, function(a, b)
                return a.Priority < b.Priority
            end)

            -- Initialize in order
            for _, service in ipairs(sorted) do
                print(`Initializing service: {service.Name}`)
                service:Initialize()
            end

            self.initialized = true
        end,

        StartAll = function(self)
            if not self.initialized then
                self:InitializeAll()
            end
            if self.started then return end

            for name, service in pairs(self.services) do
                print(`Starting service: {name}`)
                service:Start()
            end

            self.started = true
        end,

        StopAll = function(self)
            if not self.started then return end

            for name, service in pairs(self.services) do
                print(`Stopping service: {name}`)
                service:Stop()
            end

            self.started = false
        end,
    }

    return controller
end

-- Global service controller
local Services = createServiceController()

-- Example: Player Data Service
type PlayerDataService = ServiceInterface & {
    playerData: {[Player]: PlayerData},
    GetData: (self: PlayerDataService, player: Player) -> PlayerData?,
    SetData: (self: PlayerDataService, player: Player, data: PlayerData) -> (),
    SaveData: (self: PlayerDataService, player: Player) -> boolean,
}

type PlayerData = {
    coins: number,
    level: number,
    inventory: {string},
    settings: {[string]: any},
}

local function createPlayerDataService(): PlayerDataService
    local service: PlayerDataService = {
        Name = "PlayerDataService",
        Priority = 1, -- Load early
        playerData = {},

        Initialize = function(self)
            -- Setup DataStore connections
            print("PlayerDataService initialized")
        end,

        Start = function(self)
            -- Connect to player events
            game.Players.PlayerAdded:Connect(function(player)
                self:loadPlayerData(player)
            end)

            game.Players.PlayerRemoving:Connect(function(player)
                self:SaveData(player)
                self.playerData[player] = nil
            end)

            -- Load data for existing players
            for _, player in ipairs(game.Players:GetPlayers()) do
                self:loadPlayerData(player)
            end
        end,

        Stop = function(self)
            -- Save all player data
            for player in pairs(self.playerData) do
                self:SaveData(player)
            end
        end,

        GetData = function(self, player)
            return self.playerData[player]
        end,

        SetData = function(self, player, data)
            self.playerData[player] = data
        end,

        SaveData = function(self, player)
            local data = self.playerData[player]
            if not data then return false end

            -- Save to DataStore
            -- ... DataStore logic here
            return true
        end,
    }

    -- Private method
    function service:loadPlayerData(player: Player)
        -- Load from DataStore or create default
        self.playerData[player] = {
            coins = 0,
            level = 1,
            inventory = {},
            settings = {},
        }
    end

    return service
end

-- Register services
Services:RegisterService(createPlayerDataService())
```

### Singleton Service Pattern

```lua
--!strict

-- Singleton pattern for services
type SingletonService<T> = {
    instance: T?,
    GetInstance: () -> T,
}

local function createSingleton<T>(factory: () -> T): SingletonService<T>
    local singleton: SingletonService<T> = {
        instance = nil,
        GetInstance = function()
            if not singleton.instance then
                singleton.instance = factory()
            end
            return singleton.instance :: T
        end,
    }
    return singleton
end

-- Example: AudioService singleton
type AudioServiceImpl = {
    masterVolume: number,
    musicVolume: number,
    sfxVolume: number,
    currentMusic: Sound?,

    PlayMusic: (self: AudioServiceImpl, soundId: string, fadeIn: number?) -> (),
    StopMusic: (self: AudioServiceImpl, fadeOut: number?) -> (),
    PlaySFX: (self: AudioServiceImpl, soundId: string, position: Vector3?) -> (),
    SetMasterVolume: (self: AudioServiceImpl, volume: number) -> (),
}

local AudioService = createSingleton<AudioServiceImpl>(function()
    local service: AudioServiceImpl = {
        masterVolume = 1,
        musicVolume = 0.8,
        sfxVolume = 1,
        currentMusic = nil,

        PlayMusic = function(self, soundId, fadeIn)
            if self.currentMusic then
                self:StopMusic(0.5)
            end

            local sound = Instance.new("Sound")
            sound.SoundId = soundId
            sound.Volume = 0
            sound.Looped = true
            sound.Parent = game:GetService("SoundService")
            sound:Play()

            self.currentMusic = sound

            -- Fade in
            local targetVolume = self.masterVolume * self.musicVolume
            local tweenInfo = TweenInfo.new(fadeIn or 1)
            game:GetService("TweenService"):Create(sound, tweenInfo, {
                Volume = targetVolume
            }):Play()
        end,

        StopMusic = function(self, fadeOut)
            if not self.currentMusic then return end

            local sound = self.currentMusic
            self.currentMusic = nil

            local tweenInfo = TweenInfo.new(fadeOut or 1)
            local tween = game:GetService("TweenService"):Create(sound, tweenInfo, {
                Volume = 0
            })
            tween.Completed:Connect(function()
                sound:Destroy()
            end)
            tween:Play()
        end,

        PlaySFX = function(self, soundId, position)
            local sound = Instance.new("Sound")
            sound.SoundId = soundId
            sound.Volume = self.masterVolume * self.sfxVolume

            if position then
                local attachment = Instance.new("Attachment")
                attachment.WorldPosition = position
                attachment.Parent = workspace.Terrain
                sound.Parent = attachment
                sound.Ended:Connect(function()
                    attachment:Destroy()
                end)
            else
                sound.Parent = game:GetService("SoundService")
                sound.Ended:Connect(function()
                    sound:Destroy()
                end)
            end

            sound:Play()
        end,

        SetMasterVolume = function(self, volume)
            self.masterVolume = math.clamp(volume, 0, 1)
            if self.currentMusic then
                self.currentMusic.Volume = self.masterVolume * self.musicVolume
            end
        end,
    }

    return service
end)

-- Usage
local audio = AudioService.GetInstance()
audio:PlayMusic("rbxassetid://123456789")
audio:PlaySFX("rbxassetid://987654321", Vector3.new(0, 10, 0))
```

---

## Event-Driven Architecture

### Custom Event System

```lua
--!strict

-- Type-safe event system
type Connection = {
    Connected: boolean,
    Disconnect: (self: Connection) -> (),
}

type Signal<T...> = {
    connections: {(...T...) -> ()},
    Connect: (self: Signal<T...>, callback: (T...) -> ()) -> Connection,
    Once: (self: Signal<T...>, callback: (T...) -> ()) -> Connection,
    Fire: (self: Signal<T...>, T...) -> (),
    Wait: (self: Signal<T...>) -> T...,
    DisconnectAll: (self: Signal<T...>) -> (),
}

local function createSignal<T...>(): Signal<T...>
    local signal: Signal<T...> = {
        connections = {},

        Connect = function(self, callback)
            table.insert(self.connections, callback)

            local connection: Connection = {
                Connected = true,
                Disconnect = function(conn)
                    conn.Connected = false
                    local index = table.find(self.connections, callback)
                    if index then
                        table.remove(self.connections, index)
                    end
                end,
            }

            return connection
        end,

        Once = function(self, callback)
            local connection: Connection
            connection = self:Connect(function(...)
                connection:Disconnect()
                callback(...)
            end)
            return connection
        end,

        Fire = function(self, ...)
            for _, callback in ipairs(self.connections) do
                task.spawn(callback, ...)
            end
        end,

        Wait = function(self)
            local thread = coroutine.running()
            local connection: Connection
            connection = self:Connect(function(...)
                connection:Disconnect()
                task.spawn(thread, ...)
            end)
            return coroutine.yield()
        end,

        DisconnectAll = function(self)
            table.clear(self.connections)
        end,
    }

    return signal
end

-- Event bus for decoupled communication
type EventBus = {
    events: {[string]: Signal<...any>},

    GetEvent: (self: EventBus, name: string) -> Signal<...any>,
    Subscribe: (self: EventBus, name: string, callback: (...any) -> ()) -> Connection,
    Publish: (self: EventBus, name: string, ...any) -> (),
    Unsubscribe: (self: EventBus, name: string) -> (),
}

local function createEventBus(): EventBus
    return {
        events = {},

        GetEvent = function(self, name)
            if not self.events[name] then
                self.events[name] = createSignal()
            end
            return self.events[name]
        end,

        Subscribe = function(self, name, callback)
            return self:GetEvent(name):Connect(callback)
        end,

        Publish = function(self, name, ...)
            local event = self.events[name]
            if event then
                event:Fire(...)
            end
        end,

        Unsubscribe = function(self, name)
            local event = self.events[name]
            if event then
                event:DisconnectAll()
            end
        end,
    }
end

-- Global event bus
local GameEvents = createEventBus()

-- Usage examples
GameEvents:Subscribe("PlayerDamaged", function(player: Player, damage: number, source: string)
    print(`{player.Name} took {damage} damage from {source}`)
end)

GameEvents:Subscribe("EnemyKilled", function(enemyId: string, killer: Player?)
    print(`Enemy {enemyId} was killed`)
end)

-- Publishing events
GameEvents:Publish("PlayerDamaged", somePlayer, 25, "Fire")
GameEvents:Publish("EnemyKilled", "enemy_001", killerPlayer)
```

### Reactive Data Binding

```lua
--!strict

-- Observable value with automatic updates
type Observable<T> = {
    value: T,
    onChange: Signal<T, T>,

    Get: (self: Observable<T>) -> T,
    Set: (self: Observable<T>, newValue: T) -> (),
    Bind: (self: Observable<T>, callback: (newValue: T, oldValue: T) -> ()) -> Connection,
    Map: <U>(self: Observable<T>, transform: (T) -> U) -> Observable<U>,
}

local function createObservable<T>(initialValue: T): Observable<T>
    local onChange = createSignal<T, T>()

    local observable: Observable<T> = {
        value = initialValue,
        onChange = onChange,

        Get = function(self)
            return self.value
        end,

        Set = function(self, newValue)
            if self.value == newValue then return end
            local oldValue = self.value
            self.value = newValue
            self.onChange:Fire(newValue, oldValue)
        end,

        Bind = function(self, callback)
            -- Call immediately with current value
            callback(self.value, self.value)
            -- Then subscribe to changes
            return self.onChange:Connect(callback)
        end,

        Map = function(self, transform)
            local mapped = createObservable(transform(self.value))
            self.onChange:Connect(function(newValue)
                mapped:Set(transform(newValue))
            end)
            return mapped
        end,
    }

    return observable
end

-- Computed observable that depends on other observables
local function createComputed<T>(compute: () -> T, dependencies: {Observable<any>}): Observable<T>
    local computed = createObservable(compute())

    for _, dep in ipairs(dependencies) do
        dep.onChange:Connect(function()
            computed:Set(compute())
        end)
    end

    return computed
end

-- Example usage
local health = createObservable(100)
local maxHealth = createObservable(100)

local healthPercent = createComputed(function()
    return health:Get() / maxHealth:Get() * 100
end, {health, maxHealth})

-- Bind to UI
healthPercent:Bind(function(percent)
    -- Update health bar
    healthBar.Size = UDim2.fromScale(percent / 100, 1)
end)

-- When health changes, UI updates automatically
health:Set(75) -- Health bar updates to 75%
```

---

## State Machines

### Finite State Machine

```lua
--!strict

type StateDefinition<Context> = {
    enter: ((context: Context) -> ())?,
    update: ((context: Context, dt: number) -> ())?,
    exit: ((context: Context) -> ())?,
    transitions: {[string]: (context: Context) -> boolean}?,
}

type StateMachine<Context> = {
    states: {[string]: StateDefinition<Context>},
    currentState: string?,
    context: Context,
    onStateChanged: Signal<string?, string>,

    AddState: (self: StateMachine<Context>, name: string, state: StateDefinition<Context>) -> (),
    SetState: (self: StateMachine<Context>, name: string) -> (),
    Update: (self: StateMachine<Context>, dt: number) -> (),
    GetCurrentState: (self: StateMachine<Context>) -> string?,
    CanTransitionTo: (self: StateMachine<Context>, name: string) -> boolean,
}

local function createStateMachine<Context>(context: Context): StateMachine<Context>
    local onStateChanged = createSignal<string?, string>()

    local machine: StateMachine<Context> = {
        states = {},
        currentState = nil,
        context = context,
        onStateChanged = onStateChanged,

        AddState = function(self, name, state)
            self.states[name] = state
        end,

        SetState = function(self, name)
            local newState = self.states[name]
            if not newState then
                warn(`Unknown state: {name}`)
                return
            end

            local oldStateName = self.currentState
            local oldState = oldStateName and self.states[oldStateName]

            -- Exit old state
            if oldState and oldState.exit then
                oldState.exit(self.context)
            end

            self.currentState = name

            -- Enter new state
            if newState.enter then
                newState.enter(self.context)
            end

            self.onStateChanged:Fire(oldStateName, name)
        end,

        Update = function(self, dt)
            if not self.currentState then return end

            local state = self.states[self.currentState]
            if not state then return end

            -- Run update
            if state.update then
                state.update(self.context, dt)
            end

            -- Check transitions
            if state.transitions then
                for targetState, condition in pairs(state.transitions) do
                    if condition(self.context) then
                        self:SetState(targetState)
                        break
                    end
                end
            end
        end,

        GetCurrentState = function(self)
            return self.currentState
        end,

        CanTransitionTo = function(self, name)
            if not self.currentState then return true end

            local state = self.states[self.currentState]
            if not state or not state.transitions then return false end

            local condition = state.transitions[name]
            return condition ~= nil and condition(self.context)
        end,
    }

    return machine
end

-- Example: Enemy AI State Machine
type EnemyContext = {
    enemy: Model,
    target: Model?,
    health: number,
    attackRange: number,
    chaseRange: number,
    lastAttackTime: number,
}

local function createEnemyAI(enemy: Model): StateMachine<EnemyContext>
    local context: EnemyContext = {
        enemy = enemy,
        target = nil,
        health = 100,
        attackRange = 5,
        chaseRange = 30,
        lastAttackTime = 0,
    }

    local machine = createStateMachine(context)

    machine:AddState("idle", {
        enter = function(ctx)
            -- Play idle animation
        end,
        update = function(ctx, dt)
            -- Look for players
            ctx.target = findNearestPlayer(ctx.enemy, ctx.chaseRange)
        end,
        transitions = {
            chase = function(ctx)
                return ctx.target ~= nil
            end,
            dead = function(ctx)
                return ctx.health <= 0
            end,
        },
    })

    machine:AddState("chase", {
        enter = function(ctx)
            -- Play run animation
        end,
        update = function(ctx, dt)
            if not ctx.target then return end
            moveTowards(ctx.enemy, ctx.target, dt)
        end,
        transitions = {
            attack = function(ctx)
                if not ctx.target then return false end
                local distance = getDistance(ctx.enemy, ctx.target)
                return distance <= ctx.attackRange
            end,
            idle = function(ctx)
                if not ctx.target then return true end
                local distance = getDistance(ctx.enemy, ctx.target)
                return distance > ctx.chaseRange
            end,
            dead = function(ctx)
                return ctx.health <= 0
            end,
        },
    })

    machine:AddState("attack", {
        enter = function(ctx)
            -- Play attack animation
            ctx.lastAttackTime = os.clock()
        end,
        update = function(ctx, dt)
            if os.clock() - ctx.lastAttackTime > 1 then
                -- Deal damage
                if ctx.target then
                    dealDamage(ctx.target, 10)
                end
                ctx.lastAttackTime = os.clock()
            end
        end,
        transitions = {
            chase = function(ctx)
                if not ctx.target then return true end
                local distance = getDistance(ctx.enemy, ctx.target)
                return distance > ctx.attackRange
            end,
            dead = function(ctx)
                return ctx.health <= 0
            end,
        },
    })

    machine:AddState("dead", {
        enter = function(ctx)
            -- Play death animation
            -- Disable collision
            -- Drop loot
        end,
    })

    machine:SetState("idle")
    return machine
end
```

### Hierarchical State Machine

```lua
--!strict

type HierarchicalState<Context> = StateDefinition<Context> & {
    subMachine: StateMachine<Context>?,
    defaultSubState: string?,
}

type HierarchicalStateMachine<Context> = StateMachine<Context> & {
    AddHierarchicalState: (
        self: HierarchicalStateMachine<Context>,
        name: string,
        state: HierarchicalState<Context>
    ) -> (),
}

local function createHierarchicalStateMachine<Context>(context: Context): HierarchicalStateMachine<Context>
    local baseMachine = createStateMachine(context)

    local hierarchical: HierarchicalStateMachine<Context> = baseMachine :: any

    hierarchical.AddHierarchicalState = function(self, name, state)
        local wrappedState: StateDefinition<Context> = {
            enter = function(ctx)
                if state.enter then
                    state.enter(ctx)
                end
                if state.subMachine and state.defaultSubState then
                    state.subMachine:SetState(state.defaultSubState)
                end
            end,
            update = function(ctx, dt)
                if state.update then
                    state.update(ctx, dt)
                end
                if state.subMachine then
                    state.subMachine:Update(dt)
                end
            end,
            exit = function(ctx)
                if state.exit then
                    state.exit(ctx)
                end
            end,
            transitions = state.transitions,
        }

        self:AddState(name, wrappedState)
    end

    return hierarchical
end
```

---

## Command Pattern

### Basic Command Pattern

```lua
--!strict

type Command = {
    Execute: (self: Command) -> (),
    Undo: (self: Command) -> (),
    GetDescription: (self: Command) -> string,
}

type CommandHistory = {
    commands: {Command},
    currentIndex: number,
    maxHistory: number,

    Execute: (self: CommandHistory, command: Command) -> (),
    Undo: (self: CommandHistory) -> boolean,
    Redo: (self: CommandHistory) -> boolean,
    CanUndo: (self: CommandHistory) -> boolean,
    CanRedo: (self: CommandHistory) -> boolean,
    GetHistory: (self: CommandHistory) -> {string},
}

local function createCommandHistory(maxHistory: number?): CommandHistory
    return {
        commands = {},
        currentIndex = 0,
        maxHistory = maxHistory or 50,

        Execute = function(self, command)
            -- Remove any redo history
            while #self.commands > self.currentIndex do
                table.remove(self.commands)
            end

            -- Execute the command
            command:Execute()

            -- Add to history
            table.insert(self.commands, command)
            self.currentIndex = #self.commands

            -- Trim old history
            while #self.commands > self.maxHistory do
                table.remove(self.commands, 1)
                self.currentIndex -= 1
            end
        end,

        Undo = function(self)
            if not self:CanUndo() then return false end

            local command = self.commands[self.currentIndex]
            command:Undo()
            self.currentIndex -= 1

            return true
        end,

        Redo = function(self)
            if not self:CanRedo() then return false end

            self.currentIndex += 1
            local command = self.commands[self.currentIndex]
            command:Execute()

            return true
        end,

        CanUndo = function(self)
            return self.currentIndex > 0
        end,

        CanRedo = function(self)
            return self.currentIndex < #self.commands
        end,

        GetHistory = function(self)
            local history: {string} = {}
            for i, command in ipairs(self.commands) do
                local prefix = i == self.currentIndex and "> " or "  "
                table.insert(history, prefix .. command:GetDescription())
            end
            return history
        end,
    }
end

-- Example commands
type MoveCommand = Command & {
    object: Model,
    oldPosition: CFrame,
    newPosition: CFrame,
}

local function createMoveCommand(object: Model, newPosition: CFrame): MoveCommand
    local command: MoveCommand = {
        object = object,
        oldPosition = object:GetPivot(),
        newPosition = newPosition,

        Execute = function(self)
            self.object:PivotTo(self.newPosition)
        end,

        Undo = function(self)
            self.object:PivotTo(self.oldPosition)
        end,

        GetDescription = function(self)
            return `Move {self.object.Name}`
        end,
    }

    return command
end

type ChangePropertyCommand<T> = Command & {
    instance: Instance,
    property: string,
    oldValue: T,
    newValue: T,
}

local function createPropertyCommand<T>(
    instance: Instance,
    property: string,
    newValue: T
): ChangePropertyCommand<T>
    local oldValue = (instance :: any)[property]

    return {
        instance = instance,
        property = property,
        oldValue = oldValue,
        newValue = newValue,

        Execute = function(self)
            (self.instance :: any)[self.property] = self.newValue
        end,

        Undo = function(self)
            (self.instance :: any)[self.property] = self.oldValue
        end,

        GetDescription = function(self)
            return `Change {self.instance.Name}.{self.property}`
        end,
    }
end

-- Usage
local history = createCommandHistory()

history:Execute(createMoveCommand(somePart, CFrame.new(10, 0, 0)))
history:Execute(createPropertyCommand(somePart, "Color", Color3.new(1, 0, 0)))

history:Undo() -- Reverts color change
history:Undo() -- Reverts move
history:Redo() -- Re-applies move
```

---

## Observer Pattern

### Subject-Observer Implementation

```lua
--!strict

type Observer<T> = {
    Update: (self: Observer<T>, data: T) -> (),
}

type Subject<T> = {
    observers: {Observer<T>},

    Attach: (self: Subject<T>, observer: Observer<T>) -> (),
    Detach: (self: Subject<T>, observer: Observer<T>) -> (),
    Notify: (self: Subject<T>, data: T) -> (),
}

local function createSubject<T>(): Subject<T>
    return {
        observers = {},

        Attach = function(self, observer)
            if table.find(self.observers, observer) then return end
            table.insert(self.observers, observer)
        end,

        Detach = function(self, observer)
            local index = table.find(self.observers, observer)
            if index then
                table.remove(self.observers, index)
            end
        end,

        Notify = function(self, data)
            for _, observer in ipairs(self.observers) do
                observer:Update(data)
            end
        end,
    }
end

-- Example: Game state subject
type GameStateData = {
    phase: string,
    timeRemaining: number,
    scores: {[string]: number},
}

local GameStateSubject = createSubject<GameStateData>()

-- Observer implementations
type ScoreboardObserver = Observer<GameStateData> & {
    gui: ScreenGui,
}

local function createScoreboardObserver(gui: ScreenGui): ScoreboardObserver
    return {
        gui = gui,

        Update = function(self, data)
            -- Update scoreboard UI
            for playerName, score in pairs(data.scores) do
                -- Update score display
            end
        end,
    }
end

type TimerObserver = Observer<GameStateData> & {
    label: TextLabel,
}

local function createTimerObserver(label: TextLabel): TimerObserver
    return {
        label = label,

        Update = function(self, data)
            self.label.Text = string.format("%02d:%02d",
                math.floor(data.timeRemaining / 60),
                data.timeRemaining % 60
            )
        end,
    }
end

-- Usage
local scoreboardObserver = createScoreboardObserver(scoreboardGui)
local timerObserver = createTimerObserver(timerLabel)

GameStateSubject:Attach(scoreboardObserver)
GameStateSubject:Attach(timerObserver)

-- When game state changes
GameStateSubject:Notify({
    phase = "playing",
    timeRemaining = 300,
    scores = { Player1 = 10, Player2 = 15 },
})
```

---

## Factory Pattern

### Object Factory

```lua
--!strict

-- Abstract factory for game entities
type EntityFactory<T> = {
    Create: (self: EntityFactory<T>, config: {[string]: any}) -> T,
    CreateFromTemplate: (self: EntityFactory<T>, templateName: string) -> T?,
    RegisterTemplate: (self: EntityFactory<T>, name: string, config: {[string]: any}) -> (),
}

-- Enemy factory example
type EnemyConfig = {
    name: string,
    health: number,
    damage: number,
    speed: number,
    modelId: string,
    ai: string,
}

type Enemy = {
    config: EnemyConfig,
    model: Model?,
    stateMachine: StateMachine<EnemyContext>?,

    Spawn: (self: Enemy, position: Vector3) -> (),
    Destroy: (self: Enemy) -> (),
    TakeDamage: (self: Enemy, amount: number) -> (),
}

local function createEnemyFactory(): EntityFactory<Enemy>
    local templates: {[string]: EnemyConfig} = {}

    return {
        Create = function(self, config: {[string]: any})
            local enemyConfig: EnemyConfig = {
                name = config.name or "Enemy",
                health = config.health or 100,
                damage = config.damage or 10,
                speed = config.speed or 16,
                modelId = config.modelId or "",
                ai = config.ai or "basic",
            }

            local enemy: Enemy = {
                config = enemyConfig,
                model = nil,
                stateMachine = nil,

                Spawn = function(enemySelf, position)
                    -- Clone model
                    -- Setup AI
                    -- Set position
                end,

                Destroy = function(enemySelf)
                    if enemySelf.model then
                        enemySelf.model:Destroy()
                    end
                end,

                TakeDamage = function(enemySelf, amount)
                    enemySelf.config.health -= amount
                end,
            }

            return enemy
        end,

        CreateFromTemplate = function(self, templateName)
            local config = templates[templateName]
            if not config then
                warn(`Unknown template: {templateName}`)
                return nil
            end
            return self:Create(config)
        end,

        RegisterTemplate = function(self, name, config)
            templates[name] = config :: EnemyConfig
        end,
    }
end

-- Usage
local EnemyFactory = createEnemyFactory()

EnemyFactory:RegisterTemplate("Zombie", {
    name = "Zombie",
    health = 100,
    damage = 10,
    speed = 8,
    modelId = "rbxassetid://12345",
    ai = "melee",
})

EnemyFactory:RegisterTemplate("Skeleton", {
    name = "Skeleton",
    health = 60,
    damage = 15,
    speed = 12,
    modelId = "rbxassetid://67890",
    ai = "ranged",
})

local zombie = EnemyFactory:CreateFromTemplate("Zombie")
local skeleton = EnemyFactory:CreateFromTemplate("Skeleton")
```

---

## Dependency Injection

### Simple DI Container

```lua
--!strict

type ServiceProvider = () -> any
type ServiceFactory<T> = (container: DIContainer) -> T

type DIContainer = {
    services: {[string]: any},
    factories: {[string]: ServiceFactory<any>},
    singletons: {[string]: boolean},

    Register: <T>(self: DIContainer, name: string, factory: ServiceFactory<T>, singleton: boolean?) -> (),
    RegisterInstance: (self: DIContainer, name: string, instance: any) -> (),
    Resolve: <T>(self: DIContainer, name: string) -> T?,
    CreateScope: (self: DIContainer) -> DIContainer,
}

local function createDIContainer(): DIContainer
    local container: DIContainer = {
        services = {},
        factories = {},
        singletons = {},

        Register = function(self, name, factory, singleton)
            self.factories[name] = factory
            self.singletons[name] = singleton or false
        end,

        RegisterInstance = function(self, name, instance)
            self.services[name] = instance
        end,

        Resolve = function(self, name)
            -- Check if already instantiated
            if self.services[name] then
                return self.services[name]
            end

            -- Get factory
            local factory = self.factories[name]
            if not factory then
                warn(`Service not registered: {name}`)
                return nil
            end

            -- Create instance
            local instance = factory(self)

            -- Store if singleton
            if self.singletons[name] then
                self.services[name] = instance
            end

            return instance
        end,

        CreateScope = function(self)
            local scoped = createDIContainer()
            scoped.factories = self.factories
            scoped.singletons = self.singletons
            -- Don't copy singleton instances - they remain in parent
            return scoped
        end,
    }

    return container
end

-- Example usage
local Container = createDIContainer()

-- Register services
Container:Register("Logger", function(c)
    return {
        Log = function(message: string)
            print("[LOG]", message)
        end,
    }
end, true) -- Singleton

Container:Register("PlayerService", function(c)
    local logger = c:Resolve("Logger")
    return {
        logger = logger,
        players = {},
        AddPlayer = function(self, player: Player)
            self.logger.Log(`Player joined: {player.Name}`)
            self.players[player] = {}
        end,
    }
end, true)

Container:Register("CombatService", function(c)
    local logger = c:Resolve("Logger")
    local playerService = c:Resolve("PlayerService")
    return {
        ProcessAttack = function(self, attacker: Player, target: Player)
            logger.Log(`{attacker.Name} attacked {target.Name}`)
        end,
    }
end, true)

-- Resolve and use
local combat = Container:Resolve("CombatService")
```

---

## Code Organization for Large Games

### Recommended Project Structure

```
src/
├── Server/
│   ├── Services/
│   │   ├── PlayerDataService.lua
│   │   ├── CombatService.lua
│   │   ├── MatchmakingService.lua
│   │   └── init.lua (service registration)
│   ├── Systems/
│   │   ├── AI/
│   │   │   ├── BehaviorTree.lua
│   │   │   └── Pathfinding.lua
│   │   ├── Combat/
│   │   │   ├── DamageCalculator.lua
│   │   │   └── HitDetection.lua
│   │   └── Economy/
│   │       ├── Currency.lua
│   │       └── Shop.lua
│   ├── Data/
│   │   ├── ItemDatabase.lua
│   │   ├── EnemyDatabase.lua
│   │   └── ConfigLoader.lua
│   └── Main.server.lua
├── Client/
│   ├── Controllers/
│   │   ├── InputController.lua
│   │   ├── CameraController.lua
│   │   └── UIController.lua
│   ├── UI/
│   │   ├── Components/
│   │   │   ├── Button.lua
│   │   │   ├── HealthBar.lua
│   │   │   └── Inventory.lua
│   │   ├── Screens/
│   │   │   ├── MainMenu.lua
│   │   │   ├── GameHUD.lua
│   │   │   └── SettingsMenu.lua
│   │   └── UIManager.lua
│   ├── Effects/
│   │   ├── ParticleManager.lua
│   │   └── SoundManager.lua
│   └── Main.client.lua
└── Shared/
    ├── Types/
    │   ├── PlayerTypes.lua
    │   ├── ItemTypes.lua
    │   └── GameTypes.lua
    ├── Utils/
    │   ├── Math.lua
    │   ├── Table.lua
    │   └── String.lua
    ├── Constants.lua
    └── Remotes.lua
```

### Module Loader Pattern

```lua
--!strict

-- Shared/ModuleLoader.lua
type ModuleLoader = {
    modules: {[string]: any},

    Require: (self: ModuleLoader, path: string) -> any,
    PreloadFolder: (self: ModuleLoader, folder: Folder) -> (),
}

local function createModuleLoader(): ModuleLoader
    return {
        modules = {},

        Require = function(self, path)
            if self.modules[path] then
                return self.modules[path]
            end

            local module = require(path) -- Actual path would be resolved
            self.modules[path] = module
            return module
        end,

        PreloadFolder = function(self, folder)
            for _, child in ipairs(folder:GetDescendants()) do
                if child:IsA("ModuleScript") then
                    self:Require(child:GetFullName())
                end
            end
        end,
    }
end

-- Main.server.lua
local Loader = createModuleLoader()

-- Preload all shared modules
Loader:PreloadFolder(ReplicatedStorage.Shared)

-- Initialize services in order
local ServiceRegistry = Loader:Require("Server.Services")
ServiceRegistry:InitializeAll()
ServiceRegistry:StartAll()
```

### Namespace Pattern

```lua
--!strict

-- Organized namespace for game systems
local Game = {
    Services = {},
    Systems = {},
    Data = {},
    Utils = {},
}

-- Server/Services/init.lua
Game.Services.PlayerData = require(script.PlayerDataService)
Game.Services.Combat = require(script.CombatService)
Game.Services.Matchmaking = require(script.MatchmakingService)

-- Server/Systems/init.lua
Game.Systems.AI = require(script.AI)
Game.Systems.Combat = require(script.Combat)
Game.Systems.Economy = require(script.Economy)

-- Shared/Utils/init.lua
Game.Utils.Math = require(script.Math)
Game.Utils.Table = require(script.Table)
Game.Utils.String = require(script.String)

-- Usage anywhere
local playerData = Game.Services.PlayerData:GetData(player)
local damage = Game.Systems.Combat.CalculateDamage(attacker, target)
local rounded = Game.Utils.Math.Round(value, 2)

return Game
```

---

## Summary

| Pattern | Use Case | Benefits |
|---------|----------|----------|
| Service Pattern | Centralized game systems | Clear boundaries, testable |
| Event-Driven | Decoupled communication | Loose coupling, extensible |
| State Machine | AI, game phases, UI flows | Predictable behavior |
| Command Pattern | Undo/redo, action replay | Reversible operations |
| Observer Pattern | UI updates, notifications | Reactive updates |
| Factory Pattern | Object creation | Flexible instantiation |
| Dependency Injection | Service dependencies | Testable, maintainable |

**Best Practices:**

- Keep modules focused and single-purpose
- Use clear naming conventions
- Document public interfaces
- Write unit tests for core systems
- Use type annotations throughout
- Separate server and client logic strictly
