---
title: "Luau Performance Cookbook"
agent: lua-scripter
category: performance-optimization
version: 1.0.0
last_updated: 2025-01-28
tags: [performance, optimization, profiling, memory, cpu, network, rendering]
---

# Luau Performance Cookbook

A comprehensive guide to optimizing Roblox games for maximum performance across all aspects: CPU, memory, network, and rendering.

---

## Table of Contents

1. [Profiling Tools and Usage](#profiling-tools-and-usage)
2. [Memory Optimization Patterns](#memory-optimization-patterns)
3. [CPU Optimization Patterns](#cpu-optimization-patterns)
4. [Network Optimization](#network-optimization)
5. [Render Optimization](#render-optimization)
6. [Instance Management](#instance-management)
7. [Common Performance Anti-Patterns](#common-performance-anti-patterns)
8. [Benchmarking Methodology](#benchmarking-methodology)

---

## Profiling Tools and Usage

### MicroProfiler

The MicroProfiler is Roblox's built-in profiling tool for analyzing frame-by-frame performance.

```lua
--!strict

-- Enable MicroProfiler labels in your code
local function expensiveOperation()
    debug.profilebegin("ExpensiveOperation")

    -- Your code here
    for i = 1, 10000 do
        math.sin(i)
    end

    debug.profileend()
end

-- Nested profiling for detailed breakdown
local function complexSystem()
    debug.profilebegin("ComplexSystem")

    debug.profilebegin("Phase1_DataGathering")
    -- Data gathering code
    task.wait(0.001)
    debug.profileend()

    debug.profilebegin("Phase2_Processing")
    -- Processing code
    task.wait(0.002)
    debug.profileend()

    debug.profilebegin("Phase3_Rendering")
    -- Rendering code
    task.wait(0.001)
    debug.profileend()

    debug.profileend()
end

-- Using debug.profilebegin/end in a scope-safe way
local function safeProfile<T>(name: string, fn: () -> T): T
    debug.profilebegin(name)
    local success, result = pcall(fn)
    debug.profileend()

    if success then
        return result
    else
        error(result)
    end
end
```

### Script Performance API

```lua
--!strict

local Stats = game:GetService("Stats")
local RunService = game:GetService("RunService")

-- Monitor frame time
local frameTimeHistory: {number} = {}
local MAX_HISTORY = 60

RunService.Heartbeat:Connect(function(deltaTime)
    table.insert(frameTimeHistory, deltaTime)
    if #frameTimeHistory > MAX_HISTORY then
        table.remove(frameTimeHistory, 1)
    end
end)

local function getAverageFrameTime(): number
    if #frameTimeHistory == 0 then return 0 end

    local sum = 0
    for _, dt in ipairs(frameTimeHistory) do
        sum += dt
    end
    return sum / #frameTimeHistory
end

local function getFPS(): number
    local avgTime = getAverageFrameTime()
    return avgTime > 0 and (1 / avgTime) or 0
end

-- Memory monitoring
local function getMemoryUsage(): {[string]: number}
    return {
        total = Stats:GetTotalMemoryUsageMb(),
        -- Individual categories
        instances = Stats:GetMemoryUsageMbForTag(Enum.DeveloperMemoryTag.Instances),
        signals = Stats:GetMemoryUsageMbForTag(Enum.DeveloperMemoryTag.Signals),
        luaHeap = Stats:GetMemoryUsageMbForTag(Enum.DeveloperMemoryTag.LuaHeap),
        physics = Stats:GetMemoryUsageMbForTag(Enum.DeveloperMemoryTag.PhysicsParts),
        graphics = Stats:GetMemoryUsageMbForTag(Enum.DeveloperMemoryTag.GraphicsMeshParts),
    }
end

-- Performance stats display
local function createPerformanceHUD()
    local screenGui = Instance.new("ScreenGui")
    local textLabel = Instance.new("TextLabel")

    textLabel.Size = UDim2.new(0, 200, 0, 100)
    textLabel.Position = UDim2.new(0, 10, 0, 10)
    textLabel.BackgroundTransparency = 0.5
    textLabel.TextColor3 = Color3.new(1, 1, 1)
    textLabel.TextXAlignment = Enum.TextXAlignment.Left
    textLabel.Parent = screenGui

    RunService.Heartbeat:Connect(function()
        local mem = getMemoryUsage()
        textLabel.Text = string.format(
            "FPS: %.1f\nMemory: %.1f MB\nInstances: %.1f MB",
            getFPS(),
            mem.total,
            mem.instances
        )
    end)

    return screenGui
end
```

### Custom Profiling System

```lua
--!strict

type ProfileEntry = {
    name: string,
    startTime: number,
    endTime: number?,
    children: {ProfileEntry},
    parent: ProfileEntry?,
}

type Profiler = {
    rootEntry: ProfileEntry,
    currentEntry: ProfileEntry,
    begin: (self: Profiler, name: string) -> (),
    finish: (self: Profiler) -> (),
    reset: (self: Profiler) -> (),
    getReport: (self: Profiler) -> string,
}

local function createProfiler(): Profiler
    local root: ProfileEntry = {
        name = "Root",
        startTime = os.clock(),
        endTime = nil,
        children = {},
        parent = nil,
    }

    local profiler: Profiler = {
        rootEntry = root,
        currentEntry = root,

        begin = function(self, name)
            local entry: ProfileEntry = {
                name = name,
                startTime = os.clock(),
                endTime = nil,
                children = {},
                parent = self.currentEntry,
            }
            table.insert(self.currentEntry.children, entry)
            self.currentEntry = entry
        end,

        finish = function(self)
            self.currentEntry.endTime = os.clock()
            if self.currentEntry.parent then
                self.currentEntry = self.currentEntry.parent
            end
        end,

        reset = function(self)
            self.rootEntry = {
                name = "Root",
                startTime = os.clock(),
                endTime = nil,
                children = {},
                parent = nil,
            }
            self.currentEntry = self.rootEntry
        end,

        getReport = function(self): string
            local lines: {string} = {}

            local function formatEntry(entry: ProfileEntry, indent: number)
                local duration = (entry.endTime or os.clock()) - entry.startTime
                local prefix = string.rep("  ", indent)
                table.insert(lines, `{prefix}{entry.name}: {duration * 1000:.3f}ms`)

                for _, child in ipairs(entry.children) do
                    formatEntry(child, indent + 1)
                end
            end

            for _, child in ipairs(self.rootEntry.children) do
                formatEntry(child, 0)
            end

            return table.concat(lines, "\n")
        end,
    }

    return profiler
end

-- Usage
local profiler = createProfiler()

local function simulateGameLoop()
    profiler:begin("GameLoop")

    profiler:begin("Input")
    task.wait(0.001)
    profiler:finish()

    profiler:begin("Physics")
    task.wait(0.005)
    profiler:finish()

    profiler:begin("AI")
    task.wait(0.003)
    profiler:finish()

    profiler:begin("Render")
    task.wait(0.008)
    profiler:finish()

    profiler:finish()

    print(profiler:getReport())
end
```

---

## Memory Optimization Patterns

### Table Pool Pattern

```lua
--!strict

type TablePool<T> = {
    available: {T & {}},
    inUse: {[T & {}]: boolean},
    factory: () -> T,
    reset: ((T) -> ())?,
    acquire: (self: TablePool<T>) -> T,
    release: (self: TablePool<T>, item: T) -> (),
    getStats: (self: TablePool<T>) -> {available: number, inUse: number},
}

local function createTablePool<T>(
    factory: () -> T,
    initialSize: number?,
    resetFn: ((T) -> ())?
): TablePool<T>
    local pool: TablePool<T> = {
        available = {},
        inUse = {},
        factory = factory,
        reset = resetFn,

        acquire = function(self)
            local item: T
            if #self.available > 0 then
                item = table.remove(self.available) :: T
            else
                item = self.factory()
            end
            self.inUse[item :: T & {}] = true
            return item
        end,

        release = function(self, item)
            if self.inUse[item :: T & {}] then
                self.inUse[item :: T & {}] = nil
                if self.reset then
                    self.reset(item)
                end
                table.insert(self.available, item)
            end
        end,

        getStats = function(self)
            local inUseCount = 0
            for _ in pairs(self.inUse) do
                inUseCount += 1
            end
            return {
                available = #self.available,
                inUse = inUseCount,
            }
        end,
    }

    -- Pre-populate pool
    for _ = 1, initialSize or 0 do
        table.insert(pool.available, factory())
    end

    return pool
end

-- Example: Vector pool
type VectorData = {
    x: number,
    y: number,
    z: number,
}

local vectorPool = createTablePool<VectorData>(
    function(): VectorData
        return { x = 0, y = 0, z = 0 }
    end,
    100,
    function(v: VectorData)
        v.x, v.y, v.z = 0, 0, 0
    end
)

-- Example: Bullet pool for games
type Bullet = {
    position: VectorData,
    velocity: VectorData,
    damage: number,
    active: boolean,
}

local bulletPool = createTablePool<Bullet>(
    function(): Bullet
        return {
            position = { x = 0, y = 0, z = 0 },
            velocity = { x = 0, y = 0, z = 0 },
            damage = 0,
            active = false,
        }
    end,
    50,
    function(b: Bullet)
        b.position.x, b.position.y, b.position.z = 0, 0, 0
        b.velocity.x, b.velocity.y, b.velocity.z = 0, 0, 0
        b.damage = 0
        b.active = false
    end
)
```

### Memory-Efficient Data Structures

```lua
--!strict

-- Compact array instead of dictionary for sequential data
-- Bad: { [1] = data1, [2] = data2 } uses more memory
-- Good: { data1, data2 } uses less memory

-- Flyweight pattern for shared data
type EnemyType = {
    name: string,
    maxHealth: number,
    damage: number,
    speed: number,
    model: Model,
}

type Enemy = {
    typeData: EnemyType,
    currentHealth: number,
    position: Vector3,
    targetId: number?,
}

local EnemyTypes: {[string]: EnemyType} = {
    Zombie = {
        name = "Zombie",
        maxHealth = 100,
        damage = 10,
        speed = 8,
        model = nil :: any, -- Loaded separately
    },
    Skeleton = {
        name = "Skeleton",
        maxHealth = 60,
        damage = 15,
        speed = 12,
        model = nil :: any,
    },
}

local function createEnemy(typeName: string, position: Vector3): Enemy?
    local typeData = EnemyTypes[typeName]
    if not typeData then return nil end

    return {
        typeData = typeData, -- Reference, not copy
        currentHealth = typeData.maxHealth,
        position = position,
        targetId = nil,
    }
end

-- Struct-of-Arrays for cache-friendly iteration
type EnemySystem = {
    count: number,
    maxCount: number,
    -- Parallel arrays
    typeNames: {string},
    health: {number},
    posX: {number},
    posY: {number},
    posZ: {number},
    targetIds: {number?},

    add: (self: EnemySystem, typeName: string, x: number, y: number, z: number) -> number?,
    remove: (self: EnemySystem, index: number) -> (),
    updatePositions: (self: EnemySystem, deltaTime: number) -> (),
}

local function createEnemySystem(maxCount: number): EnemySystem
    return {
        count = 0,
        maxCount = maxCount,
        typeNames = table.create(maxCount, ""),
        health = table.create(maxCount, 0),
        posX = table.create(maxCount, 0),
        posY = table.create(maxCount, 0),
        posZ = table.create(maxCount, 0),
        targetIds = table.create(maxCount),

        add = function(self, typeName, x, y, z)
            if self.count >= self.maxCount then return nil end
            self.count += 1
            local i = self.count

            local typeData = EnemyTypes[typeName]
            if not typeData then
                self.count -= 1
                return nil
            end

            self.typeNames[i] = typeName
            self.health[i] = typeData.maxHealth
            self.posX[i] = x
            self.posY[i] = y
            self.posZ[i] = z
            self.targetIds[i] = nil

            return i
        end,

        remove = function(self, index)
            if index < 1 or index > self.count then return end

            -- Swap with last element
            local last = self.count
            self.typeNames[index] = self.typeNames[last]
            self.health[index] = self.health[last]
            self.posX[index] = self.posX[last]
            self.posY[index] = self.posY[last]
            self.posZ[index] = self.posZ[last]
            self.targetIds[index] = self.targetIds[last]

            self.count -= 1
        end,

        updatePositions = function(self, deltaTime)
            -- Cache-friendly iteration
            for i = 1, self.count do
                local typeData = EnemyTypes[self.typeNames[i]]
                if typeData then
                    -- Simple movement toward origin
                    local speed = typeData.speed * deltaTime
                    local dx = -self.posX[i]
                    local dz = -self.posZ[i]
                    local len = math.sqrt(dx * dx + dz * dz)
                    if len > 0.1 then
                        self.posX[i] += (dx / len) * speed
                        self.posZ[i] += (dz / len) * speed
                    end
                end
            end
        end,
    }
end
```

### Garbage Collection Management

```lua
--!strict

-- Minimize allocations in hot paths
-- Bad: Creates new table every frame
local function badUpdate()
    local results = {} -- New allocation!
    for i = 1, 100 do
        table.insert(results, i * 2)
    end
    return results
end

-- Good: Reuse table
local resultCache: {number} = {}
local function goodUpdate(): {number}
    table.clear(resultCache)
    for i = 1, 100 do
        resultCache[i] = i * 2
    end
    return resultCache
end

-- String concatenation optimization
-- Bad: Creates many intermediate strings
local function badStringBuild(items: {string}): string
    local result = ""
    for _, item in ipairs(items) do
        result = result .. item .. ", " -- Many allocations!
    end
    return result
end

-- Good: Use table.concat
local function goodStringBuild(items: {string}): string
    return table.concat(items, ", ")
end

-- Avoid closures in hot paths when possible
-- Bad: Creates new closure every call
local function badEventHandler()
    local connection
    connection = game.Players.PlayerAdded:Connect(function(player)
        -- Closure captures 'connection'
    end)
end

-- Good: Use method pattern
local EventHandler = {}

function EventHandler.onPlayerAdded(player: Player)
    print("Player joined:", player.Name)
end

function EventHandler.init()
    game.Players.PlayerAdded:Connect(EventHandler.onPlayerAdded)
end
```

---

## CPU Optimization Patterns

### Loop Optimization

```lua
--!strict
--!native

-- Cache array length
-- Bad:
local function badLoop(array: {number})
    for i = 1, #array do -- #array called every iteration
        array[i] *= 2
    end
end

-- Good:
local function goodLoop(array: {number})
    local len = #array
    for i = 1, len do
        array[i] *= 2
    end
end

-- Use ipairs for sequential arrays (optimized in Luau)
local function iterateArray(array: {number})
    for i, value in ipairs(array) do
        -- Luau optimizes ipairs for arrays
    end
end

-- Avoid pairs when possible
-- pairs iterates in undefined order and is slower
local function countEntries(dict: {[string]: number}): number
    local count = 0
    for _ in pairs(dict) do
        count += 1
    end
    return count
end

-- Unroll small loops for performance
local function dotProduct3(a: {number}, b: {number}): number
    return a[1] * b[1] + a[2] * b[2] + a[3] * b[3]
end

-- Batch operations
local function batchProcess(data: {number}, batchSize: number)
    local len = #data
    local i = 1

    -- Process in batches
    while i <= len - batchSize + 1 do
        -- Process batch
        local sum = 0
        sum += data[i]
        sum += data[i + 1]
        sum += data[i + 2]
        sum += data[i + 3]
        i += batchSize
    end

    -- Handle remainder
    while i <= len do
        -- Process remaining
        i += 1
    end
end
```

### Caching Expensive Operations

```lua
--!strict

-- Memoization pattern
type MemoizedFn<Args..., Ret...> = (Args...) -> Ret...

local function memoize<T>(fn: (number) -> T): (number) -> T
    local cache: {[number]: T} = {}

    return function(arg: number): T
        local cached = cache[arg]
        if cached ~= nil then
            return cached
        end

        local result = fn(arg)
        cache[arg] = result
        return result
    end
end

-- Example: Expensive calculation
local calculateFibonacci = memoize(function(n: number): number
    if n <= 1 then return n end
    return calculateFibonacci(n - 1) + calculateFibonacci(n - 2)
end)

-- Cache with expiration
type CacheEntry<T> = {
    value: T,
    expiry: number,
}

type ExpiringCache<K, V> = {
    entries: {[K]: CacheEntry<V>},
    defaultTTL: number,
    get: (self: ExpiringCache<K, V>, key: K) -> V?,
    set: (self: ExpiringCache<K, V>, key: K, value: V, ttl: number?) -> (),
    cleanup: (self: ExpiringCache<K, V>) -> (),
}

local function createExpiringCache<K, V>(defaultTTL: number): ExpiringCache<K, V>
    return {
        entries = {},
        defaultTTL = defaultTTL,

        get = function(self, key)
            local entry = self.entries[key]
            if entry and os.clock() < entry.expiry then
                return entry.value
            end
            self.entries[key] = nil
            return nil
        end,

        set = function(self, key, value, ttl)
            self.entries[key] = {
                value = value,
                expiry = os.clock() + (ttl or self.defaultTTL),
            }
        end,

        cleanup = function(self)
            local now = os.clock()
            for key, entry in pairs(self.entries) do
                if now >= entry.expiry then
                    self.entries[key] = nil
                end
            end
        end,
    }
end

-- Spatial caching for position-based lookups
type SpatialCache<T> = {
    cellSize: number,
    cells: {[string]: {T}},
    getCell: (self: SpatialCache<T>, x: number, z: number) -> {T},
    insert: (self: SpatialCache<T>, x: number, z: number, item: T) -> (),
    queryRadius: (self: SpatialCache<T>, x: number, z: number, radius: number) -> {T},
}

local function createSpatialCache<T>(cellSize: number): SpatialCache<T>
    local function getCellKey(cellX: number, cellZ: number): string
        return `{cellX},{cellZ}`
    end

    return {
        cellSize = cellSize,
        cells = {},

        getCell = function(self, x, z)
            local cellX = math.floor(x / self.cellSize)
            local cellZ = math.floor(z / self.cellSize)
            local key = getCellKey(cellX, cellZ)
            return self.cells[key] or {}
        end,

        insert = function(self, x, z, item)
            local cellX = math.floor(x / self.cellSize)
            local cellZ = math.floor(z / self.cellSize)
            local key = getCellKey(cellX, cellZ)

            if not self.cells[key] then
                self.cells[key] = {}
            end
            table.insert(self.cells[key], item)
        end,

        queryRadius = function(self, x, z, radius)
            local results: {T} = {}
            local cellRadius = math.ceil(radius / self.cellSize)
            local centerCellX = math.floor(x / self.cellSize)
            local centerCellZ = math.floor(z / self.cellSize)

            for dx = -cellRadius, cellRadius do
                for dz = -cellRadius, cellRadius do
                    local key = getCellKey(centerCellX + dx, centerCellZ + dz)
                    local cell = self.cells[key]
                    if cell then
                        for _, item in ipairs(cell) do
                            table.insert(results, item)
                        end
                    end
                end
            end

            return results
        end,
    }
end
```

### Work Distribution

```lua
--!strict

-- Spread work across frames
type WorkQueue<T> = {
    items: {T},
    processor: (T) -> (),
    maxPerFrame: number,
    currentIndex: number,
    isProcessing: boolean,
    add: (self: WorkQueue<T>, item: T) -> (),
    addBatch: (self: WorkQueue<T>, items: {T}) -> (),
    start: (self: WorkQueue<T>) -> (),
    stop: (self: WorkQueue<T>) -> (),
}

local RunService = game:GetService("RunService")

local function createWorkQueue<T>(processor: (T) -> (), maxPerFrame: number): WorkQueue<T>
    local connection: RBXScriptConnection? = nil

    local queue: WorkQueue<T> = {
        items = {},
        processor = processor,
        maxPerFrame = maxPerFrame,
        currentIndex = 1,
        isProcessing = false,

        add = function(self, item)
            table.insert(self.items, item)
        end,

        addBatch = function(self, items)
            for _, item in ipairs(items) do
                table.insert(self.items, item)
            end
        end,

        start = function(self)
            if self.isProcessing then return end
            self.isProcessing = true

            connection = RunService.Heartbeat:Connect(function()
                local processed = 0
                while processed < self.maxPerFrame and self.currentIndex <= #self.items do
                    self.processor(self.items[self.currentIndex])
                    self.currentIndex += 1
                    processed += 1
                end

                if self.currentIndex > #self.items then
                    table.clear(self.items)
                    self.currentIndex = 1
                end
            end)
        end,

        stop = function(self)
            self.isProcessing = false
            if connection then
                connection:Disconnect()
                connection = nil
            end
        end,
    }

    return queue
end

-- Time-sliced processing
local function timeSlicedProcess<T>(
    items: {T},
    processor: (T) -> (),
    maxTimeMs: number
): thread
    return task.spawn(function()
        local startTime = os.clock()
        local index = 1

        while index <= #items do
            processor(items[index])
            index += 1

            local elapsed = (os.clock() - startTime) * 1000
            if elapsed >= maxTimeMs then
                task.wait() -- Yield to next frame
                startTime = os.clock()
            end
        end
    end)
end

-- Coroutine-based iterator for large datasets
local function chunkedIterator<T>(items: {T}, chunkSize: number): () -> ({T}?, number?)
    local index = 1
    local total = #items

    return function(): ({T}?, number?)
        if index > total then
            return nil, nil
        end

        local chunk: {T} = {}
        local endIndex = math.min(index + chunkSize - 1, total)

        for i = index, endIndex do
            table.insert(chunk, items[i])
        end

        local currentIndex = index
        index = endIndex + 1

        return chunk, currentIndex
    end
end
```

---

## Network Optimization

### Batching Remote Events

```lua
--!strict

-- Server-side batch processor
type BatchedRemote<T> = {
    queue: {[Player]: {T}},
    remoteEvent: RemoteEvent,
    flushInterval: number,
    maxBatchSize: number,
    add: (self: BatchedRemote<T>, player: Player, data: T) -> (),
    flush: (self: BatchedRemote<T>) -> (),
    start: (self: BatchedRemote<T>) -> (),
}

local function createBatchedRemote<T>(
    remoteEvent: RemoteEvent,
    flushInterval: number?,
    maxBatchSize: number?
): BatchedRemote<T>
    local batch: BatchedRemote<T> = {
        queue = {},
        remoteEvent = remoteEvent,
        flushInterval = flushInterval or 0.1,
        maxBatchSize = maxBatchSize or 50,

        add = function(self, player, data)
            if not self.queue[player] then
                self.queue[player] = {}
            end
            table.insert(self.queue[player], data)

            -- Flush if batch is full
            if #self.queue[player] >= self.maxBatchSize then
                self.remoteEvent:FireClient(player, self.queue[player])
                self.queue[player] = {}
            end
        end,

        flush = function(self)
            for player, data in pairs(self.queue) do
                if #data > 0 and player.Parent then
                    self.remoteEvent:FireClient(player, data)
                end
            end
            table.clear(self.queue)
        end,

        start = function(self)
            task.spawn(function()
                while true do
                    task.wait(self.flushInterval)
                    self:flush()
                end
            end)
        end,
    }

    return batch
end

-- Delta compression for state updates
type EntityState = {
    id: number,
    x: number,
    y: number,
    z: number,
    health: number,
    state: number,
}

type DeltaCompressor = {
    lastStates: {[number]: EntityState},
    compress: (self: DeltaCompressor, current: EntityState) -> {[string]: any}?,
    decompress: (self: DeltaCompressor, id: number, delta: {[string]: any}) -> EntityState?,
}

local function createDeltaCompressor(): DeltaCompressor
    return {
        lastStates = {},

        compress = function(self, current)
            local last = self.lastStates[current.id]

            if not last then
                self.lastStates[current.id] = table.clone(current)
                return current :: any -- Send full state first time
            end

            local delta: {[string]: any} = { id = current.id }
            local hasChanges = false

            -- Only include changed fields
            if math.abs(current.x - last.x) > 0.01 then
                delta.x = current.x
                hasChanges = true
            end
            if math.abs(current.y - last.y) > 0.01 then
                delta.y = current.y
                hasChanges = true
            end
            if math.abs(current.z - last.z) > 0.01 then
                delta.z = current.z
                hasChanges = true
            end
            if current.health ~= last.health then
                delta.health = current.health
                hasChanges = true
            end
            if current.state ~= last.state then
                delta.state = current.state
                hasChanges = true
            end

            if hasChanges then
                self.lastStates[current.id] = table.clone(current)
                return delta
            end

            return nil -- No changes
        end,

        decompress = function(self, id, delta)
            local state = self.lastStates[id]
            if not state then
                -- Need full state
                return nil
            end

            -- Apply delta
            if delta.x then state.x = delta.x end
            if delta.y then state.y = delta.y end
            if delta.z then state.z = delta.z end
            if delta.health then state.health = delta.health end
            if delta.state then state.state = delta.state end

            return state
        end,
    }
end
```

### Binary Protocol with Buffers

```lua
--!strict

-- Efficient binary serialization for network data
local PACKET_TYPES = {
    POSITION_UPDATE = 1,
    HEALTH_UPDATE = 2,
    STATE_CHANGE = 3,
    CHAT_MESSAGE = 4,
}

type PositionPacket = {
    entityId: number,
    x: number,
    y: number,
    z: number,
    yaw: number,
}

local POSITION_PACKET_SIZE = 18 -- 2 + 4 + 4 + 4 + 4

local function serializePositionPacket(packet: PositionPacket): buffer
    local buf = buffer.create(POSITION_PACKET_SIZE)

    buffer.writeu8(buf, 0, PACKET_TYPES.POSITION_UPDATE)
    buffer.writeu8(buf, 1, packet.entityId)
    buffer.writef32(buf, 2, packet.x)
    buffer.writef32(buf, 6, packet.y)
    buffer.writef32(buf, 10, packet.z)
    buffer.writef32(buf, 14, packet.yaw)

    return buf
end

local function deserializePositionPacket(buf: buffer): PositionPacket
    return {
        entityId = buffer.readu8(buf, 1),
        x = buffer.readf32(buf, 2),
        y = buffer.readf32(buf, 6),
        z = buffer.readf32(buf, 10),
        yaw = buffer.readf32(buf, 14),
    }
end

-- Batch multiple packets
local function serializePacketBatch(packets: {buffer}): buffer
    local totalSize = 2 -- 2 bytes for count
    for _, packet in ipairs(packets) do
        totalSize += buffer.len(packet) + 2 -- +2 for size prefix
    end

    local buf = buffer.create(totalSize)
    buffer.writeu16(buf, 0, #packets)

    local offset = 2
    for _, packet in ipairs(packets) do
        local packetLen = buffer.len(packet)
        buffer.writeu16(buf, offset, packetLen)
        buffer.copy(buf, offset + 2, packet, 0, packetLen)
        offset += packetLen + 2
    end

    return buf
end

local function deserializePacketBatch(buf: buffer): {buffer}
    local count = buffer.readu16(buf, 0)
    local packets: {buffer} = table.create(count)

    local offset = 2
    for i = 1, count do
        local packetLen = buffer.readu16(buf, offset)
        local packet = buffer.create(packetLen)
        buffer.copy(packet, 0, buf, offset + 2, packetLen)
        packets[i] = packet
        offset += packetLen + 2
    end

    return packets
end
```

### Rate Limiting

```lua
--!strict

type RateLimiter = {
    maxRequests: number,
    windowSeconds: number,
    requests: {[Player]: {number}},
    check: (self: RateLimiter, player: Player) -> boolean,
    cleanup: (self: RateLimiter) -> (),
}

local function createRateLimiter(maxRequests: number, windowSeconds: number): RateLimiter
    return {
        maxRequests = maxRequests,
        windowSeconds = windowSeconds,
        requests = {},

        check = function(self, player)
            local now = os.clock()
            local playerRequests = self.requests[player]

            if not playerRequests then
                self.requests[player] = {now}
                return true
            end

            -- Remove old requests
            local cutoff = now - self.windowSeconds
            local validRequests: {number} = {}
            for _, timestamp in ipairs(playerRequests) do
                if timestamp > cutoff then
                    table.insert(validRequests, timestamp)
                end
            end

            if #validRequests >= self.maxRequests then
                self.requests[player] = validRequests
                return false -- Rate limited
            end

            table.insert(validRequests, now)
            self.requests[player] = validRequests
            return true
        end,

        cleanup = function(self)
            local now = os.clock()
            local cutoff = now - self.windowSeconds

            for player, requests in pairs(self.requests) do
                if not player.Parent then
                    self.requests[player] = nil
                else
                    local valid: {number} = {}
                    for _, timestamp in ipairs(requests) do
                        if timestamp > cutoff then
                            table.insert(valid, timestamp)
                        end
                    end
                    self.requests[player] = valid
                end
            end
        end,
    }
end

-- Usage
local fireRateLimiter = createRateLimiter(10, 1) -- 10 requests per second

local function onFireWeapon(player: Player)
    if not fireRateLimiter:check(player) then
        warn("Rate limited:", player.Name)
        return
    end

    -- Process weapon fire
end
```

---

## Render Optimization

### Level of Detail (LOD) System

```lua
--!strict

type LODLevel = {
    distance: number,
    meshId: string?,
    transparency: number,
    castShadow: boolean,
}

type LODObject = {
    model: Model,
    levels: {LODLevel},
    currentLevel: number,
    basePart: BasePart,
}

type LODManager = {
    objects: {LODObject},
    camera: Camera,
    updateInterval: number,
    register: (self: LODManager, model: Model, levels: {LODLevel}) -> (),
    update: (self: LODManager) -> (),
    start: (self: LODManager) -> (),
}

local function createLODManager(camera: Camera): LODManager
    local manager: LODManager = {
        objects = {},
        camera = camera,
        updateInterval = 0.25,

        register = function(self, model, levels)
            local basePart = model:FindFirstChild("BasePart")
            if not basePart or not basePart:IsA("BasePart") then
                return
            end

            table.insert(self.objects, {
                model = model,
                levels = levels,
                currentLevel = 1,
                basePart = basePart,
            })
        end,

        update = function(self)
            local cameraPos = self.camera.CFrame.Position

            for _, obj in ipairs(self.objects) do
                if not obj.model.Parent then continue end

                local distance = (obj.basePart.Position - cameraPos).Magnitude
                local newLevel = 1

                for i, level in ipairs(obj.levels) do
                    if distance <= level.distance then
                        newLevel = i
                        break
                    end
                end

                if newLevel ~= obj.currentLevel then
                    local level = obj.levels[newLevel]
                    obj.currentLevel = newLevel

                    -- Apply LOD changes
                    for _, part in ipairs(obj.model:GetDescendants()) do
                        if part:IsA("BasePart") then
                            part.Transparency = level.transparency
                            part.CastShadow = level.castShadow
                        elseif part:IsA("MeshPart") and level.meshId then
                            part.MeshId = level.meshId
                        end
                    end
                end
            end
        end,

        start = function(self)
            task.spawn(function()
                while true do
                    self:update()
                    task.wait(self.updateInterval)
                end
            end)
        end,
    }

    return manager
end
```

### Occlusion Culling

```lua
--!strict

local Workspace = game:GetService("Workspace")

type OcclusionSystem = {
    camera: Camera,
    maxDistance: number,
    objects: {Model},
    visibleObjects: {[Model]: boolean},
    raycastParams: RaycastParams,
    update: (self: OcclusionSystem) -> (),
}

local function createOcclusionSystem(camera: Camera, maxDistance: number): OcclusionSystem
    local params = RaycastParams.new()
    params.FilterType = Enum.RaycastFilterType.Exclude
    params.IgnoreWater = true

    return {
        camera = camera,
        maxDistance = maxDistance,
        objects = {},
        visibleObjects = {},
        raycastParams = params,

        update = function(self)
            local cameraPos = self.camera.CFrame.Position
            local cameraLook = self.camera.CFrame.LookVector

            for _, model in ipairs(self.objects) do
                if not model.Parent then continue end

                local primaryPart = model.PrimaryPart
                if not primaryPart then continue end

                local objectPos = primaryPart.Position
                local toObject = objectPos - cameraPos
                local distance = toObject.Magnitude

                -- Check if within max distance
                if distance > self.maxDistance then
                    self:setVisible(model, false)
                    continue
                end

                -- Check if in front of camera (basic frustum check)
                local dot = toObject.Unit:Dot(cameraLook)
                if dot < 0 then
                    self:setVisible(model, false)
                    continue
                end

                -- Raycast for occlusion
                self.raycastParams.FilterDescendantsInstances = {model}
                local result = Workspace:Raycast(cameraPos, toObject, self.raycastParams)

                if result then
                    self:setVisible(model, false)
                else
                    self:setVisible(model, true)
                end
            end
        end,
    }
end

function OcclusionSystem:setVisible(model: Model, visible: boolean)
    if self.visibleObjects[model] == visible then return end

    self.visibleObjects[model] = visible

    for _, part in ipairs(model:GetDescendants()) do
        if part:IsA("BasePart") then
            part.Transparency = visible and 0 or 1
        end
    end
end
```

### Particle System Optimization

```lua
--!strict

type ParticlePool = {
    emitters: {ParticleEmitter},
    available: {ParticleEmitter},
    inUse: {[ParticleEmitter]: Attachment},
    template: ParticleEmitter,
    acquire: (self: ParticlePool, parent: Attachment) -> ParticleEmitter?,
    release: (self: ParticlePool, emitter: ParticleEmitter) -> (),
    setLOD: (self: ParticlePool, level: number) -> (),
}

local function createParticlePool(template: ParticleEmitter, poolSize: number): ParticlePool
    local pool: ParticlePool = {
        emitters = {},
        available = {},
        inUse = {},
        template = template,

        acquire = function(self, parent)
            local emitter: ParticleEmitter

            if #self.available > 0 then
                emitter = table.remove(self.available) :: ParticleEmitter
            elseif #self.emitters < poolSize then
                emitter = self.template:Clone()
                table.insert(self.emitters, emitter)
            else
                return nil -- Pool exhausted
            end

            emitter.Parent = parent
            emitter.Enabled = true
            self.inUse[emitter] = parent

            return emitter
        end,

        release = function(self, emitter)
            local parent = self.inUse[emitter]
            if not parent then return end

            emitter.Enabled = false
            emitter.Parent = nil
            self.inUse[emitter] = nil
            table.insert(self.available, emitter)
        end,

        setLOD = function(self, level)
            local rateMultiplier = 1 / level
            local lifetimeMultiplier = 1 / level

            for _, emitter in ipairs(self.emitters) do
                emitter.Rate = self.template.Rate * rateMultiplier
            end
        end,
    }

    return pool
end

-- Distance-based particle quality
local function updateParticleQuality(
    emitter: ParticleEmitter,
    cameraDistance: number,
    maxDistance: number
)
    if cameraDistance > maxDistance then
        emitter.Enabled = false
        return
    end

    local quality = 1 - (cameraDistance / maxDistance)
    emitter.Rate = emitter:GetAttribute("BaseRate") * quality
end
```

---

## Instance Management

### Instance Pooling

```lua
--!strict

type InstancePool<T> = {
    template: T & Instance,
    available: {T},
    inUse: {[T]: boolean},
    parent: Instance,
    maxSize: number,
    acquire: (self: InstancePool<T>) -> T?,
    release: (self: InstancePool<T>, instance: T) -> (),
    warmup: (self: InstancePool<T>, count: number) -> (),
    getStats: (self: InstancePool<T>) -> {available: number, inUse: number, total: number},
}

local function createInstancePool<T>(
    template: T & Instance,
    parent: Instance,
    maxSize: number
): InstancePool<T>
    local pool: InstancePool<T> = {
        template = template,
        available = {},
        inUse = {},
        parent = parent,
        maxSize = maxSize,

        acquire = function(self)
            local instance: T

            if #self.available > 0 then
                instance = table.remove(self.available) :: T
            else
                local totalCount = #self.available
                for _ in pairs(self.inUse) do
                    totalCount += 1
                end

                if totalCount >= self.maxSize then
                    return nil
                end

                instance = self.template:Clone() :: T
            end

            (instance :: Instance).Parent = self.parent
            self.inUse[instance] = true

            return instance
        end,

        release = function(self, instance)
            if not self.inUse[instance] then return end

            self.inUse[instance] = nil
            (instance :: Instance).Parent = nil

            -- Reset instance state
            if (instance :: any).Anchored ~= nil then
                (instance :: any).Anchored = true
            end

            table.insert(self.available, instance)
        end,

        warmup = function(self, count)
            for _ = 1, count do
                local instance = self.template:Clone() :: T
                (instance :: Instance).Parent = nil
                table.insert(self.available, instance)
            end
        end,

        getStats = function(self)
            local inUseCount = 0
            for _ in pairs(self.inUse) do
                inUseCount += 1
            end

            return {
                available = #self.available,
                inUse = inUseCount,
                total = #self.available + inUseCount,
            }
        end,
    }

    return pool
end

-- Usage example: Bullet pool
local bulletTemplate = Instance.new("Part")
bulletTemplate.Size = Vector3.new(0.2, 0.2, 1)
bulletTemplate.Anchored = false
bulletTemplate.CanCollide = false
bulletTemplate.Name = "PooledBullet"

local bulletPool = createInstancePool(bulletTemplate, workspace, 200)
bulletPool:warmup(50)
```

### StreamingEnabled Best Practices

```lua
--!strict

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")

-- Monitor streaming state
local function setupStreamingCallbacks(model: Model)
    local function onStreamIn()
        -- Re-initialize model state
        print("Model streamed in:", model:GetFullName())

        -- Reconnect any necessary connections
        -- Re-apply visual effects
    end

    local function onStreamOut()
        -- Clean up resources
        print("Model streamed out:", model:GetFullName())

        -- Disconnect connections
        -- Stop sounds/effects
    end

    -- These events fire when streaming state changes
    model.DescendantAdded:Connect(function(descendant)
        if descendant == model.PrimaryPart then
            onStreamIn()
        end
    end)

    model.DescendantRemoving:Connect(function(descendant)
        if descendant == model.PrimaryPart then
            onStreamOut()
        end
    end)
end

-- Request streaming for important objects
local function ensureLoaded(model: Model, player: Player)
    if not model.PrimaryPart then return end

    local character = player.Character
    if not character then return end

    local humanoidRootPart = character:FindFirstChild("HumanoidRootPart")
    if not humanoidRootPart then return end

    -- Move player closer to trigger streaming
    -- Or use StreamingEnabled APIs
end

-- Persistent models (important NPCs, objectives)
local function makePersistent(model: Model)
    model:SetAttribute("StreamingPriority", 1000)

    -- Tag for streaming system
    local streamingTag = Instance.new("Configuration")
    streamingTag.Name = "StreamingConfig"
    streamingTag:SetAttribute("Persistent", true)
    streamingTag.Parent = model
end
```

---

## Common Performance Anti-Patterns

### Anti-Pattern Catalog

```lua
--!strict

-- ANTI-PATTERN 1: FindFirstChild in loops
-- Bad:
local function badFindPattern(parent: Instance)
    for i = 1, 1000 do
        local child = parent:FindFirstChild("Target") -- Called 1000 times!
        if child then
            -- Do something
        end
    end
end

-- Good:
local function goodFindPattern(parent: Instance)
    local child = parent:FindFirstChild("Target") -- Called once
    if child then
        for i = 1, 1000 do
            -- Do something
        end
    end
end

-- ANTI-PATTERN 2: GetChildren in tight loops
-- Bad:
local function badGetChildren(parent: Instance)
    while true do
        for _, child in ipairs(parent:GetChildren()) do -- Allocates new table every frame!
            -- Process child
        end
        task.wait()
    end
end

-- Good:
local function goodGetChildren(parent: Instance)
    local children = parent:GetChildren()
    local childCount = #children

    parent.ChildAdded:Connect(function(child)
        children = parent:GetChildren()
        childCount = #children
    end)

    parent.ChildRemoved:Connect(function()
        children = parent:GetChildren()
        childCount = #children
    end)

    while true do
        for i = 1, childCount do
            local child = children[i]
            -- Process child
        end
        task.wait()
    end
end

-- ANTI-PATTERN 3: Connecting events in loops
-- Bad:
local function badEventConnection()
    for _, player in ipairs(game.Players:GetPlayers()) do
        game.Players.PlayerRemoving:Connect(function(removedPlayer) -- Creates connection per player!
            if removedPlayer == player then
                -- Handle removal
            end
        end)
    end
end

-- Good:
local function goodEventConnection()
    local playerData: {[Player]: any} = {}

    game.Players.PlayerAdded:Connect(function(player)
        playerData[player] = {} -- Initialize
    end)

    game.Players.PlayerRemoving:Connect(function(player)
        playerData[player] = nil -- Cleanup
    end)
end

-- ANTI-PATTERN 4: Inefficient string operations
-- Bad:
local function badStringOps()
    local result = ""
    for i = 1, 1000 do
        result = result .. tostring(i) .. "," -- O(n^2) complexity!
    end
    return result
end

-- Good:
local function goodStringOps()
    local parts = table.create(1000)
    for i = 1, 1000 do
        parts[i] = tostring(i)
    end
    return table.concat(parts, ",") -- O(n) complexity
end

-- ANTI-PATTERN 5: WaitForChild without timeout
-- Bad:
local function badWaitForChild(parent: Instance)
    local child = parent:WaitForChild("MightNotExist") -- Can hang forever!
    return child
end

-- Good:
local function goodWaitForChild(parent: Instance): Instance?
    local child = parent:WaitForChild("MightNotExist", 5) -- 5 second timeout
    if not child then
        warn("Child not found within timeout")
    end
    return child
end

-- ANTI-PATTERN 6: Creating functions inside loops
-- Bad:
local function badFunctionCreation()
    local results = {}
    for i = 1, 100 do
        table.insert(results, function() -- New function allocation each iteration!
            return i * 2
        end)
    end
    return results
end

-- Good:
local function multiplier(value: number): number
    return value * 2
end

local function goodFunctionCreation()
    local results = {}
    for i = 1, 100 do
        results[i] = multiplier(i) -- Reuse existing function
    end
    return results
end

-- ANTI-PATTERN 7: Not disconnecting events
-- Bad:
local function badEventCleanup(part: Part)
    part.Touched:Connect(function(hit) -- Never disconnected!
        print("Touched")
    end)
end

-- Good:
local function goodEventCleanup(part: Part): () -> ()
    local connection = part.Touched:Connect(function(hit)
        print("Touched")
    end)

    return function()
        connection:Disconnect()
    end
end

-- ANTI-PATTERN 8: Unthrottled input handling
-- Bad:
local function badInputHandling()
    game:GetService("UserInputService").InputBegan:Connect(function()
        -- Heavy processing every single input!
        for i = 1, 10000 do
            math.sin(i)
        end
    end)
end

-- Good:
local function goodInputHandling()
    local lastProcessTime = 0
    local THROTTLE_TIME = 0.1

    game:GetService("UserInputService").InputBegan:Connect(function()
        local now = os.clock()
        if now - lastProcessTime < THROTTLE_TIME then
            return -- Throttled
        end
        lastProcessTime = now

        -- Process input
    end)
end
```

---

## Benchmarking Methodology

### Benchmarking Framework

```lua
--!strict

type BenchmarkResult = {
    name: string,
    iterations: number,
    totalTime: number,
    averageTime: number,
    minTime: number,
    maxTime: number,
    opsPerSecond: number,
}

type Benchmark = {
    name: string,
    fn: () -> (),
    setup: (() -> ())?,
    teardown: (() -> ())?,
}

local function runBenchmark(
    benchmark: Benchmark,
    iterations: number,
    warmupIterations: number?
): BenchmarkResult
    local warmup = warmupIterations or 10

    -- Setup
    if benchmark.setup then
        benchmark.setup()
    end

    -- Warmup phase
    for _ = 1, warmup do
        benchmark.fn()
    end

    -- Measurement phase
    local times: {number} = table.create(iterations)

    for i = 1, iterations do
        local startTime = os.clock()
        benchmark.fn()
        times[i] = os.clock() - startTime
    end

    -- Teardown
    if benchmark.teardown then
        benchmark.teardown()
    end

    -- Calculate statistics
    local totalTime = 0
    local minTime = math.huge
    local maxTime = 0

    for _, time in ipairs(times) do
        totalTime += time
        minTime = math.min(minTime, time)
        maxTime = math.max(maxTime, time)
    end

    local averageTime = totalTime / iterations

    return {
        name = benchmark.name,
        iterations = iterations,
        totalTime = totalTime,
        averageTime = averageTime,
        minTime = minTime,
        maxTime = maxTime,
        opsPerSecond = 1 / averageTime,
    }
end

local function compareBenchmarks(
    benchmarks: {Benchmark},
    iterations: number
): {BenchmarkResult}
    local results: {BenchmarkResult} = {}

    for _, benchmark in ipairs(benchmarks) do
        table.insert(results, runBenchmark(benchmark, iterations))
    end

    -- Sort by average time
    table.sort(results, function(a, b)
        return a.averageTime < b.averageTime
    end)

    return results
end

local function formatResults(results: {BenchmarkResult}): string
    local lines: {string} = {}

    table.insert(lines, "Benchmark Results:")
    table.insert(lines, string.rep("-", 80))
    table.insert(lines, string.format(
        "%-30s %12s %12s %12s %12s",
        "Name", "Avg (ms)", "Min (ms)", "Max (ms)", "Ops/sec"
    ))
    table.insert(lines, string.rep("-", 80))

    local baseline = results[1].averageTime

    for _, result in ipairs(results) do
        local ratio = result.averageTime / baseline
        table.insert(lines, string.format(
            "%-30s %12.4f %12.4f %12.4f %12.0f (%.2fx)",
            result.name,
            result.averageTime * 1000,
            result.minTime * 1000,
            result.maxTime * 1000,
            result.opsPerSecond,
            ratio
        ))
    end

    return table.concat(lines, "\n")
end

-- Example usage
local function benchmarkTableOperations()
    local benchmarks: {Benchmark} = {
        {
            name = "table.insert",
            fn = function()
                local t = {}
                for i = 1, 1000 do
                    table.insert(t, i)
                end
            end,
        },
        {
            name = "array index",
            fn = function()
                local t = {}
                for i = 1, 1000 do
                    t[i] = i
                end
            end,
        },
        {
            name = "table.create",
            fn = function()
                local t = table.create(1000, 0)
                for i = 1, 1000 do
                    t[i] = i
                end
            end,
        },
    }

    local results = compareBenchmarks(benchmarks, 1000)
    print(formatResults(results))
end
```

### Memory Benchmarking

```lua
--!strict

local function measureMemory<T>(fn: () -> T): (T, number)
    collectgarbage("collect")
    local beforeMem = collectgarbage("count")

    local result = fn()

    collectgarbage("collect")
    local afterMem = collectgarbage("count")

    return result, afterMem - beforeMem
end

local function benchmarkMemory(name: string, fn: () -> any, iterations: number)
    local totalMemory = 0

    for _ = 1, iterations do
        local _, memUsed = measureMemory(fn)
        totalMemory += memUsed
    end

    local avgMemory = totalMemory / iterations
    print(`{name}: {avgMemory:.2f} KB average per call`)
end

-- Example
benchmarkMemory("Create 1000 tables", function()
    local tables = {}
    for i = 1, 1000 do
        tables[i] = { value = i }
    end
    return tables
end, 100)
```

### Real-World Performance Testing

```lua
--!strict

type PerformanceTest = {
    name: string,
    targetFPS: number,
    testDuration: number,
    setup: () -> (),
    update: (deltaTime: number) -> (),
    cleanup: () -> (),
}

type PerformanceTestResult = {
    name: string,
    averageFPS: number,
    minFPS: number,
    maxFPS: number,
    frameDrops: number,
    passed: boolean,
}

local RunService = game:GetService("RunService")

local function runPerformanceTest(test: PerformanceTest): PerformanceTestResult
    local frameCount = 0
    local totalDeltaTime = 0
    local minDeltaTime = math.huge
    local maxDeltaTime = 0
    local frameDrops = 0
    local targetDeltaTime = 1 / test.targetFPS

    test.setup()

    local connection: RBXScriptConnection
    local startTime = os.clock()

    local completed = false

    connection = RunService.Heartbeat:Connect(function(deltaTime)
        if os.clock() - startTime >= test.testDuration then
            completed = true
            connection:Disconnect()
            return
        end

        test.update(deltaTime)

        frameCount += 1
        totalDeltaTime += deltaTime
        minDeltaTime = math.min(minDeltaTime, deltaTime)
        maxDeltaTime = math.max(maxDeltaTime, deltaTime)

        if deltaTime > targetDeltaTime * 1.5 then
            frameDrops += 1
        end
    end)

    while not completed do
        task.wait()
    end

    test.cleanup()

    local avgDeltaTime = totalDeltaTime / frameCount

    return {
        name = test.name,
        averageFPS = 1 / avgDeltaTime,
        minFPS = 1 / maxDeltaTime,
        maxFPS = 1 / minDeltaTime,
        frameDrops = frameDrops,
        passed = (1 / avgDeltaTime) >= test.targetFPS,
    }
end
```

---

## Performance Checklist

### Before Release

| Category | Check | Priority |
|----------|-------|----------|
| Memory | No memory leaks in long sessions | High |
| Memory | Instance pools for frequently created objects | High |
| CPU | No expensive operations in Heartbeat | High |
| CPU | Cached frequently accessed values | Medium |
| Network | Batched remote events | High |
| Network | Rate limiting on all remotes | High |
| Render | LOD system for complex models | Medium |
| Render | Particle systems distance-culled | Medium |

### Quick Wins

1. Use `table.create()` for known-size arrays
2. Cache `#array` outside loops
3. Use `task.spawn` instead of `spawn`
4. Batch RemoteEvent calls
5. Pool frequently instantiated objects
6. Use `--!native` for math-heavy code
7. Disconnect unused event connections
8. Use spatial partitioning for proximity checks
