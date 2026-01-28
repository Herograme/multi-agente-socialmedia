# Luau Patterns & Best Practices for Roblox

> Comprehensive guide to Luau programming patterns for Roblox development
> Last Updated: January 2025

---

## Type System & Strict Mode

### Enabling Type Checking

```lua
--!strict
-- Enables strict type checking for this script
-- Catches type errors at edit time, not runtime

--!nonstrict
-- Default mode, more permissive
-- Good for gradual migration

--!nocheck
-- Disables type checking entirely
-- NOT recommended for new code
```

### Basic Type Annotations

```lua
--!strict

-- Variable types
local playerName: string = "Player1"
local playerHealth: number = 100
local isAlive: boolean = true
local items: {string} = {"Sword", "Shield", "Potion"}

-- Function types
local function calculateDamage(baseDamage: number, multiplier: number): number
    return baseDamage * multiplier
end

-- Optional types (can be nil)
local function findPlayer(name: string): Player?
    return Players:FindFirstChild(name) :: Player?
end

-- Union types
local function processInput(value: string | number): string
    if type(value) == "number" then
        return tostring(value)
    end
    return value
end
```

### Type Definitions

```lua
--!strict

-- Define custom types
type PlayerData = {
    id: number,
    name: string,
    level: number,
    inventory: {string},
    stats: {
        health: number,
        mana: number,
        strength: number
    }
}

-- Use the type
local function loadPlayerData(player: Player): PlayerData
    return {
        id = player.UserId,
        name = player.Name,
        level = 1,
        inventory = {},
        stats = {
            health = 100,
            mana = 50,
            strength = 10
        }
    }
end

-- Generic types
type Array<T> = {T}
type Dictionary<K, V> = {[K]: V}

local names: Array<string> = {"Alice", "Bob", "Charlie"}
local scores: Dictionary<string, number> = {Alice = 100, Bob = 85}
```

### Class Pattern with Types

```lua
--!strict

-- Type definition for the class
type WeaponClass = {
    name: string,
    damage: number,
    durability: number,
    attack: (self: WeaponClass, target: Humanoid) -> number,
    repair: (self: WeaponClass, amount: number) -> (),
    getDurabilityPercentage: (self: WeaponClass) -> number
}

-- Class implementation
local Weapon = {}
Weapon.__index = Weapon

function Weapon.new(name: string, damage: number): WeaponClass
    local self = setmetatable({}, Weapon)

    self.name = name
    self.damage = damage
    self.durability = 100

    return self :: WeaponClass
end

-- Use dot notation with explicit self for type safety
function Weapon.attack(self: WeaponClass, target: Humanoid): number
    if self.durability <= 0 then
        return 0
    end

    self.durability -= 1
    target:TakeDamage(self.damage)
    return self.damage
end

function Weapon.repair(self: WeaponClass, amount: number): ()
    self.durability = math.min(100, self.durability + amount)
end

function Weapon.getDurabilityPercentage(self: WeaponClass): number
    return self.durability / 100
end

return Weapon
```

---

## Single-Script Architecture (SSA)

### Overview
SSA uses ModuleScripts to organize code, with minimal LocalScripts/Scripts as entry points.

### Project Structure
```
game/
├── ServerScriptService/
│   └── Server.server.lua          -- Entry point
├── StarterPlayer/
│   └── StarterPlayerScripts/
│       └── Client.client.lua      -- Entry point
└── ReplicatedStorage/
    └── Modules/
        ├── Shared/                 -- Shared between client/server
        │   ├── Constants.lua
        │   ├── Utils.lua
        │   └── Types.lua
        ├── Server/                 -- Server-only modules
        │   ├── DataManager.lua
        │   ├── GameManager.lua
        │   └── Services/
        │       ├── CombatService.lua
        │       └── InventoryService.lua
        └── Client/                 -- Client-only modules
            ├── UIManager.lua
            ├── InputHandler.lua
            └── Controllers/
                ├── CameraController.lua
                └── CharacterController.lua
```

### Server Entry Point

```lua
--!strict
-- Server.server.lua

-- Services
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")

-- Load all server modules
local Modules = ReplicatedStorage.Modules
local DataManager = require(Modules.Server.DataManager)
local GameManager = require(Modules.Server.GameManager)
local CombatService = require(Modules.Server.Services.CombatService)
local InventoryService = require(Modules.Server.Services.InventoryService)

-- Initialize services in order
local function init()
    DataManager:Initialize()
    InventoryService:Initialize()
    CombatService:Initialize()
    GameManager:Initialize()

    print("[Server] All services initialized")
end

init()
```

### Client Entry Point

```lua
--!strict
-- Client.client.lua

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local player = Players.LocalPlayer

-- Load client modules
local Modules = ReplicatedStorage.Modules
local UIManager = require(Modules.Client.UIManager)
local InputHandler = require(Modules.Client.InputHandler)
local CameraController = require(Modules.Client.Controllers.CameraController)
local CharacterController = require(Modules.Client.Controllers.CharacterController)

-- Wait for character
local function onCharacterAdded(character)
    CharacterController:Setup(character)
    CameraController:Setup(character)
end

-- Initialize
local function init()
    UIManager:Initialize()
    InputHandler:Initialize()

    player.CharacterAdded:Connect(onCharacterAdded)
    if player.Character then
        onCharacterAdded(player.Character)
    end

    print("[Client] All controllers initialized")
end

init()
```

---

## Service Pattern

### Server Service Template

```lua
--!strict
-- CombatService.lua

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

-- Types
type CombatService = {
    _initialized: boolean,
    _combatants: {[Player]: CombatantData},
    Initialize: (self: CombatService) -> (),
    Attack: (self: CombatService, attacker: Player, target: Player) -> boolean,
    TakeDamage: (self: CombatService, player: Player, damage: number) -> ()
}

type CombatantData = {
    health: number,
    maxHealth: number,
    lastAttack: number
}

-- Service
local CombatService = {} :: CombatService
CombatService._initialized = false
CombatService._combatants = {}

-- Private functions
local function createCombatant(): CombatantData
    return {
        health = 100,
        maxHealth = 100,
        lastAttack = 0
    }
end

-- Public methods
function CombatService:Initialize()
    if self._initialized then
        warn("[CombatService] Already initialized")
        return
    end

    -- Setup remote events
    local remotes = ReplicatedStorage:WaitForChild("Remotes")
    local attackRemote = remotes:WaitForChild("Attack")

    attackRemote.OnServerEvent:Connect(function(player, targetId)
        local target = Players:GetPlayerByUserId(targetId)
        if target then
            self:Attack(player, target)
        end
    end)

    -- Track players
    Players.PlayerAdded:Connect(function(player)
        self._combatants[player] = createCombatant()
    end)

    Players.PlayerRemoving:Connect(function(player)
        self._combatants[player] = nil
    end)

    -- Initialize existing players
    for _, player in Players:GetPlayers() do
        self._combatants[player] = createCombatant()
    end

    self._initialized = true
    print("[CombatService] Initialized")
end

function CombatService:Attack(attacker: Player, target: Player): boolean
    local attackerData = self._combatants[attacker]
    local targetData = self._combatants[target]

    if not attackerData or not targetData then
        return false
    end

    -- Cooldown check
    local now = tick()
    if now - attackerData.lastAttack < 1 then
        return false
    end

    attackerData.lastAttack = now
    self:TakeDamage(target, 10)

    return true
end

function CombatService:TakeDamage(player: Player, damage: number)
    local data = self._combatants[player]
    if not data then return end

    data.health = math.max(0, data.health - damage)

    if data.health <= 0 then
        -- Handle death
        local character = player.Character
        if character then
            local humanoid = character:FindFirstChild("Humanoid")
            if humanoid then
                humanoid.Health = 0
            end
        end
    end
end

return CombatService
```

---

## RemoteEvent Security

### Never Trust the Client

```lua
--!strict
-- INSECURE - DON'T DO THIS
remote.OnServerEvent:Connect(function(player, damage)
    -- Attacker sends damage amount - they could send 999999!
    target:TakeDamage(damage)
end)

-- SECURE - DO THIS
remote.OnServerEvent:Connect(function(player, targetId)
    -- Server calculates damage
    local attacker = player
    local target = Players:GetPlayerByUserId(targetId)

    -- Validate target exists
    if not target then return end

    -- Validate attacker can hit target (distance, line of sight, etc.)
    if not canAttack(attacker, target) then return end

    -- Server-controlled damage calculation
    local damage = calculateDamage(attacker)
    target:TakeDamage(damage)
end)
```

### Parameter Validation

```lua
--!strict

local function validateParameters(player: Player, ...: any): boolean
    local args = {...}

    for i, arg in args do
        -- Check for nil
        if arg == nil then
            warn(string.format("[Security] Nil parameter from %s", player.Name))
            return false
        end

        -- Type checking
        local expectedType = getExpectedType(i)
        if typeof(arg) ~= expectedType then
            warn(string.format(
                "[Security] Wrong type from %s: expected %s, got %s",
                player.Name, expectedType, typeof(arg)
            ))
            return false
        end
    end

    return true
end

-- Usage
remote.OnServerEvent:Connect(function(player, action, amount)
    if not validateParameters(player, action, amount) then
        return
    end

    if typeof(action) ~= "string" or typeof(amount) ~= "number" then
        return
    end

    if amount < 0 or amount > 100 then
        return -- Reject out-of-range values
    end

    -- Process valid request
end)
```

### Rate Limiting

```lua
--!strict

local rateLimits: {[Player]: {[string]: number}} = {}
local RATE_LIMIT = 1 -- Minimum seconds between requests

local function checkRateLimit(player: Player, action: string): boolean
    if not rateLimits[player] then
        rateLimits[player] = {}
    end

    local lastTime = rateLimits[player][action] or 0
    local now = tick()

    if now - lastTime < RATE_LIMIT then
        warn(string.format("[RateLimit] %s exceeded limit for %s", player.Name, action))
        return false
    end

    rateLimits[player][action] = now
    return true
end

-- Cleanup on player leave
Players.PlayerRemoving:Connect(function(player)
    rateLimits[player] = nil
end)

-- Usage
remote.OnServerEvent:Connect(function(player, action)
    if not checkRateLimit(player, action) then
        return
    end
    -- Process action
end)
```

### Sanity Checks

```lua
--!strict

local function validateAction(player: Player, action: string, data: any): boolean
    -- Check player state
    local character = player.Character
    if not character then
        return false
    end

    local humanoid = character:FindFirstChildOfClass("Humanoid")
    if not humanoid or humanoid.Health <= 0 then
        return false -- Dead players can't act
    end

    -- Action-specific validation
    if action == "purchase" then
        local item = data.item
        local cost = getItemCost(item)
        local playerMoney = getPlayerMoney(player)

        if playerMoney < cost then
            return false -- Can't afford
        end
    end

    if action == "attack" then
        local target = data.target
        local distance = getDistance(character, target)

        if distance > 10 then
            return false -- Too far away
        end
    end

    return true
end
```

---

## DataStore Patterns

### ProfileService-Style Pattern

```lua
--!strict
-- DataManager.lua

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

type PlayerProfile = {
    data: PlayerData,
    loaded: boolean,
    sessionLock: string
}

type PlayerData = {
    coins: number,
    level: number,
    inventory: {string},
    settings: {[string]: any}
}

local DataManager = {}
DataManager._dataStore = DataStoreService:GetDataStore("PlayerData_v1")
DataManager._profiles: {[Player]: PlayerProfile} = {}
DataManager._sessionId = game.JobId .. "_" .. tostring(tick())

local DEFAULT_DATA: PlayerData = {
    coins = 0,
    level = 1,
    inventory = {},
    settings = {}
}

-- Deep copy utility
local function deepCopy(original: any): any
    if type(original) ~= "table" then
        return original
    end

    local copy = {}
    for key, value in original do
        copy[key] = deepCopy(value)
    end
    return copy
end

-- Load player data
function DataManager:LoadProfile(player: Player): PlayerProfile?
    local userId = player.UserId
    local key = "Player_" .. userId

    local success, result = pcall(function()
        return self._dataStore:GetAsync(key)
    end)

    if not success then
        warn("[DataManager] Failed to load data for", player.Name, result)
        return nil
    end

    -- Use default data if none exists
    local data: PlayerData = result and result.data or deepCopy(DEFAULT_DATA)

    -- Check session lock
    if result and result.sessionLock and result.sessionLock ~= self._sessionId then
        -- Data might be in use elsewhere - implement session lock logic
        warn("[DataManager] Session conflict for", player.Name)
    end

    local profile: PlayerProfile = {
        data = data,
        loaded = true,
        sessionLock = self._sessionId
    }

    self._profiles[player] = profile

    -- Save session lock
    self:SaveProfile(player)

    return profile
end

-- Save player data
function DataManager:SaveProfile(player: Player): boolean
    local profile = self._profiles[player]
    if not profile or not profile.loaded then
        return false
    end

    local key = "Player_" .. player.UserId

    local success, result = pcall(function()
        self._dataStore:SetAsync(key, {
            data = profile.data,
            sessionLock = profile.sessionLock,
            lastSave = os.time()
        })
    end)

    if not success then
        warn("[DataManager] Failed to save data for", player.Name, result)
        return false
    end

    return true
end

-- Get player data (read-only access)
function DataManager:GetData(player: Player): PlayerData?
    local profile = self._profiles[player]
    if not profile or not profile.loaded then
        return nil
    end
    return profile.data
end

-- Update player data
function DataManager:UpdateData(player: Player, callback: (PlayerData) -> ()): boolean
    local profile = self._profiles[player]
    if not profile or not profile.loaded then
        return false
    end

    callback(profile.data)
    return true
end

-- Initialize
function DataManager:Initialize()
    -- Auto-save loop
    task.spawn(function()
        while true do
            task.wait(60) -- Save every 60 seconds
            for player, profile in self._profiles do
                if profile.loaded then
                    self:SaveProfile(player)
                end
            end
        end
    end)

    -- Player connections
    Players.PlayerAdded:Connect(function(player)
        self:LoadProfile(player)
    end)

    Players.PlayerRemoving:Connect(function(player)
        self:SaveProfile(player)
        self._profiles[player] = nil
    end)

    -- Handle server shutdown
    game:BindToClose(function()
        for player in self._profiles do
            self:SaveProfile(player)
        end
    end)
end

return DataManager
```

### Atomic Updates with UpdateAsync

```lua
--!strict

local function atomicUpdate(dataStore, key: string, transform: (any) -> any)
    local success, result = pcall(function()
        return dataStore:UpdateAsync(key, function(currentData)
            if currentData == nil then
                return nil -- Don't create if doesn't exist
            end
            return transform(currentData)
        end)
    end)

    return success, result
end

-- Usage: Add coins atomically
atomicUpdate(dataStore, "Player_123", function(data)
    data.coins = (data.coins or 0) + 100
    return data
end)
```

---

## Performance Optimization

### Object Pooling

```lua
--!strict

type Pool<T> = {
    _available: {T},
    _inUse: {[T]: boolean},
    _create: () -> T,
    _reset: (T) -> (),
    Acquire: (self: Pool<T>) -> T,
    Release: (self: Pool<T>, obj: T) -> ()
}

local function createPool<T>(create: () -> T, reset: (T) -> (), initialSize: number): Pool<T>
    local pool: Pool<T> = {
        _available = {},
        _inUse = {},
        _create = create,
        _reset = reset,
        Acquire = nil :: any,
        Release = nil :: any
    }

    -- Pre-populate
    for i = 1, initialSize do
        table.insert(pool._available, create())
    end

    function pool:Acquire(): T
        local obj: T
        if #self._available > 0 then
            obj = table.remove(self._available) :: T
        else
            obj = self._create()
        end
        self._inUse[obj] = true
        return obj
    end

    function pool:Release(obj: T)
        if self._inUse[obj] then
            self._inUse[obj] = nil
            self._reset(obj)
            table.insert(self._available, obj)
        end
    end

    return pool
end

-- Usage: Bullet pool
local bulletPool = createPool(
    function()
        local part = Instance.new("Part")
        part.Size = Vector3.new(0.5, 0.5, 2)
        part.Anchored = true
        part.CanCollide = false
        return part
    end,
    function(bullet)
        bullet.Parent = nil
        bullet.CFrame = CFrame.new(0, -1000, 0)
    end,
    50 -- Pre-create 50 bullets
)

local function fireBullet(origin: CFrame)
    local bullet = bulletPool:Acquire()
    bullet.CFrame = origin
    bullet.Parent = workspace

    task.delay(3, function()
        bulletPool:Release(bullet)
    end)
end
```

### Efficient Loops

```lua
--!strict

-- BAD: Creates garbage
for i, v in pairs(someTable) do end

-- GOOD: Use generalized iteration
for i, v in someTable do end

-- BAD: String concatenation in loop
local result = ""
for i = 1, 1000 do
    result = result .. tostring(i) -- Creates 1000 strings!
end

-- GOOD: Use table.concat
local parts = {}
for i = 1, 1000 do
    parts[i] = tostring(i)
end
local result = table.concat(parts)
```

### Avoiding Common Performance Pitfalls

```lua
--!strict

-- BAD: FindFirstChild in loops
for _, player in Players:GetPlayers() do
    local character = workspace:FindFirstChild(player.Name)
    if character then
        -- ...
    end
end

-- GOOD: Use player.Character
for _, player in Players:GetPlayers() do
    local character = player.Character
    if character then
        -- ...
    end
end

-- BAD: Repeated service access
for i = 1, 100 do
    game:GetService("Players") -- Called 100 times
end

-- GOOD: Cache service reference
local Players = game:GetService("Players")
for i = 1, 100 do
    -- Use cached reference
end

-- BAD: Frequent Instance creation
RunService.Heartbeat:Connect(function()
    local part = Instance.new("Part") -- Every frame!
    -- ...
end)

-- GOOD: Reuse or pool instances
local cachedPart = Instance.new("Part")
RunService.Heartbeat:Connect(function()
    cachedPart.CFrame = newCFrame
    -- ...
end)
```

---

## Memory Management

### Cleaning Up Connections

```lua
--!strict

-- Use a cleanup table pattern
type Cleaner = {
    _items: {RBXScriptConnection | Instance | () -> ()},
    Add: (self: Cleaner, item: RBXScriptConnection | Instance | () -> ()) -> (),
    Clean: (self: Cleaner) -> ()
}

local function createCleaner(): Cleaner
    local cleaner: Cleaner = {
        _items = {},
        Add = nil :: any,
        Clean = nil :: any
    }

    function cleaner:Add(item)
        table.insert(self._items, item)
    end

    function cleaner:Clean()
        for _, item in self._items do
            if typeof(item) == "RBXScriptConnection" then
                item:Disconnect()
            elseif typeof(item) == "Instance" then
                item:Destroy()
            elseif typeof(item) == "function" then
                item()
            end
        end
        table.clear(self._items)
    end

    return cleaner
end

-- Usage
local cleaner = createCleaner()

cleaner:Add(someEvent:Connect(function() end))
cleaner:Add(Instance.new("Part"))
cleaner:Add(function()
    print("Custom cleanup")
end)

-- Later...
cleaner:Clean() -- Disconnects, destroys, and runs functions
```

### Weak Tables for Caching

```lua
--!strict

-- Cache that doesn't prevent garbage collection
local cache = setmetatable({}, {__mode = "v"})

local function getCachedData(key: string): any?
    return cache[key]
end

local function setCachedData(key: string, value: any)
    cache[key] = value
end

-- Values will be garbage collected if not referenced elsewhere
```

---

## Modern Luau Features

### If-Then-Else Expressions

```lua
--!strict

-- OLD: and/or pattern (unsafe)
local value = condition and trueValue or falseValue
-- BUG: Fails if trueValue is false or nil!

-- NEW: if-then-else expression
local value = if condition then trueValue else falseValue

-- Chained
local tier = if level >= 100 then "Master"
    elseif level >= 50 then "Expert"
    elseif level >= 20 then "Intermediate"
    else "Beginner"
```

### Type Checking Functions

```lua
--!strict

-- typeof() for Roblox types
local function process(value: any)
    if typeof(value) == "Vector3" then
        return value.Magnitude
    elseif typeof(value) == "Instance" then
        return value.Name
    elseif typeof(value) == "Color3" then
        return value.R + value.G + value.B
    end
end

-- type() for Lua primitives
local function isTable(value: any): boolean
    return type(value) == "table"
end
```

### Continue Statement

```lua
--!strict

for _, player in Players:GetPlayers() do
    if player.Team == nil then
        continue -- Skip players without a team
    end

    -- Process team players
    processTeamPlayer(player)
end
```

---

## References

- [Luau Documentation](https://luau-lang.org)
- [Roblox Creator Documentation](https://create.roblox.com/docs)
- [Kampfkarren's Luau Guidelines](https://github.com/Kampfkarren/kampfkarren-luau-guidelines)
- [Roblox Lua Style Guide](https://roblox.github.io/lua-style-guide/)
- [ProfileService](https://madstudioroblox.github.io/ProfileService/)
