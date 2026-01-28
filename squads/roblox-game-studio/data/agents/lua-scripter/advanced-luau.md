---
title: "Advanced Luau Programming Guide"
agent: lua-scripter
category: language-deep-dive
version: 1.0.0
last_updated: 2025-01-28
tags: [luau, types, metatables, coroutines, performance, strict-mode]
---

# Advanced Luau Programming Guide

This comprehensive guide covers advanced Luau programming concepts for Roblox development, focusing on type safety, metaprogramming, and high-performance patterns.

---

## Table of Contents

1. [Advanced Type System](#advanced-type-system)
2. [Metatables and Metamethods](#metatables-and-metamethods)
3. [Coroutines and Task Library](#coroutines-and-task-library)
4. [Buffer and Memory Manipulation](#buffer-and-memory-manipulation)
5. [Native Code Generation](#native-code-generation)
6. [Compiler Directives](#compiler-directives)
7. [Strict Mode Best Practices](#strict-mode-best-practices)
8. [Debugging Type Errors](#debugging-type-errors)

---

## Advanced Type System

### Generics

Generics allow you to create reusable, type-safe components that work with multiple types.

```lua
--!strict

-- Basic generic function
local function identity<T>(value: T): T
    return value
end

local str: string = identity("hello")
local num: number = identity(42)

-- Generic with multiple type parameters
local function swap<T, U>(a: T, b: U): (U, T)
    return b, a
end

local x, y = swap(1, "hello") -- x: string, y: number

-- Generic with constraints using type functions
type Numeric = number | Vector3 | Vector2 | CFrame

local function lerp<T>(a: T, b: T, alpha: number): T
    -- Type narrowing needed for arithmetic
    return a + (b - a) * alpha :: any
end

-- Generic container types
type Stack<T> = {
    items: {T},
    push: (self: Stack<T>, item: T) -> (),
    pop: (self: Stack<T>) -> T?,
    peek: (self: Stack<T>) -> T?,
    size: (self: Stack<T>) -> number,
}

local function createStack<T>(): Stack<T>
    local stack: Stack<T> = {
        items = {},
        push = function(self, item)
            table.insert(self.items, item)
        end,
        pop = function(self)
            return table.remove(self.items)
        end,
        peek = function(self)
            return self.items[#self.items]
        end,
        size = function(self)
            return #self.items
        end,
    }
    return stack
end

-- Usage
local numberStack = createStack<number>()
numberStack:push(10)
numberStack:push(20)
local top = numberStack:pop() -- number?
```

### Advanced Generic Patterns

```lua
--!strict

-- Generic class pattern with type constraints
type Comparable = {
    compare: (self: Comparable, other: Comparable) -> number
}

type SortedList<T> = {
    items: {T},
    comparator: (a: T, b: T) -> number,
    insert: (self: SortedList<T>, item: T) -> (),
    remove: (self: SortedList<T>, item: T) -> boolean,
    find: (self: SortedList<T>, item: T) -> number?,
}

local function createSortedList<T>(comparator: (a: T, b: T) -> number): SortedList<T>
    local list: SortedList<T> = {
        items = {},
        comparator = comparator,

        insert = function(self, item)
            local insertIndex = 1
            for i, existing in ipairs(self.items) do
                if self.comparator(item, existing) < 0 then
                    break
                end
                insertIndex = i + 1
            end
            table.insert(self.items, insertIndex, item)
        end,

        remove = function(self, item)
            for i, existing in ipairs(self.items) do
                if self.comparator(item, existing) == 0 then
                    table.remove(self.items, i)
                    return true
                end
            end
            return false
        end,

        find = function(self, item)
            -- Binary search for sorted list
            local low, high = 1, #self.items
            while low <= high do
                local mid = math.floor((low + high) / 2)
                local cmp = self.comparator(item, self.items[mid])
                if cmp == 0 then
                    return mid
                elseif cmp < 0 then
                    high = mid - 1
                else
                    low = mid + 1
                end
            end
            return nil
        end,
    }
    return list
end

-- Generic map function
local function map<T, U>(array: {T}, transform: (T) -> U): {U}
    local result: {U} = {}
    for i, value in ipairs(array) do
        result[i] = transform(value)
    end
    return result
end

-- Generic filter function
local function filter<T>(array: {T}, predicate: (T) -> boolean): {T}
    local result: {T} = {}
    for _, value in ipairs(array) do
        if predicate(value) then
            table.insert(result, value)
        end
    end
    return result
end

-- Generic reduce function
local function reduce<T, U>(array: {T}, initial: U, reducer: (U, T) -> U): U
    local accumulator = initial
    for _, value in ipairs(array) do
        accumulator = reducer(accumulator, value)
    end
    return accumulator
end
```

### Intersection Types

Intersection types combine multiple types into one that has all properties of each.

```lua
--!strict

-- Basic intersection types
type Named = { name: string }
type Aged = { age: number }
type Person = Named & Aged

local person: Person = {
    name = "Alice",
    age = 30,
}

-- Intersection with methods
type Serializable = {
    serialize: (self: Serializable) -> string,
}

type Deserializable = {
    deserialize: (self: Deserializable, data: string) -> (),
}

type Persistable = Serializable & Deserializable

-- Practical example: Component system
type Transform = {
    position: Vector3,
    rotation: Vector3,
    scale: Vector3,
}

type Renderable = {
    model: Model?,
    visible: boolean,
    render: (self: Renderable) -> (),
}

type Collidable = {
    hitbox: BasePart?,
    collisionGroup: string,
    onCollision: (self: Collidable, other: BasePart) -> (),
}

type PhysicalEntity = Transform & Renderable & Collidable

local function createPhysicalEntity(): PhysicalEntity
    local entity: PhysicalEntity = {
        -- Transform
        position = Vector3.zero,
        rotation = Vector3.zero,
        scale = Vector3.one,

        -- Renderable
        model = nil,
        visible = true,
        render = function(self)
            if self.visible and self.model then
                self.model:PivotTo(CFrame.new(self.position) * CFrame.Angles(
                    math.rad(self.rotation.X),
                    math.rad(self.rotation.Y),
                    math.rad(self.rotation.Z)
                ))
            end
        end,

        -- Collidable
        hitbox = nil,
        collisionGroup = "Default",
        onCollision = function(self, other)
            print("Collision detected with:", other.Name)
        end,
    }
    return entity
end
```

### Union Types

Union types allow a value to be one of several types.

```lua
--!strict

-- Basic union types
type StringOrNumber = string | number

local function formatValue(value: StringOrNumber): string
    if type(value) == "string" then
        return value
    else
        return tostring(value)
    end
end

-- Discriminated unions (tagged unions)
type LoadingState = { status: "loading" }
type SuccessState<T> = { status: "success", data: T }
type ErrorState = { status: "error", message: string }
type AsyncState<T> = LoadingState | SuccessState<T> | ErrorState

local function handleState<T>(state: AsyncState<T>): string
    if state.status == "loading" then
        return "Loading..."
    elseif state.status == "success" then
        return `Success: {state.data}`
    else
        return `Error: {state.message}`
    end
end

-- Result type pattern (like Rust's Result)
type Ok<T> = { ok: true, value: T }
type Err<E> = { ok: false, error: E }
type Result<T, E> = Ok<T> | Err<E>

local function ok<T>(value: T): Ok<T>
    return { ok = true, value = value }
end

local function err<E>(error: E): Err<E>
    return { ok = false, error = error }
end

local function divide(a: number, b: number): Result<number, string>
    if b == 0 then
        return err("Division by zero")
    end
    return ok(a / b)
end

local result = divide(10, 2)
if result.ok then
    print("Result:", result.value)
else
    print("Error:", result.error)
end

-- Optional type pattern
type Option<T> = { some: true, value: T } | { some: false }

local function some<T>(value: T): Option<T>
    return { some = true, value = value }
end

local function none<T>(): Option<T>
    return { some = false }
end

local function findPlayer(name: string): Option<Player>
    local player = game.Players:FindFirstChild(name)
    if player and player:IsA("Player") then
        return some(player)
    end
    return none()
end
```

### Type Narrowing and Guards

```lua
--!strict

-- Type guard functions
type Animal = { species: string, sound: string }
type Dog = Animal & { breed: string, bark: (self: Dog) -> () }
type Cat = Animal & { indoor: boolean, meow: (self: Cat) -> () }

local function isDog(animal: Animal): boolean
    return (animal :: any).breed ~= nil
end

local function isCat(animal: Animal): boolean
    return (animal :: any).indoor ~= nil
end

-- Using typeof for runtime type checking
local function processValue(value: unknown): string
    if typeof(value) == "string" then
        return value:upper()
    elseif typeof(value) == "number" then
        return tostring(value * 2)
    elseif typeof(value) == "Vector3" then
        return `({value.X}, {value.Y}, {value.Z})`
    elseif typeof(value) == "Instance" then
        return value:GetFullName()
    else
        return "Unknown type"
    end
end

-- Exhaustive type checking pattern
type Direction = "north" | "south" | "east" | "west"

local function getOpposite(dir: Direction): Direction
    if dir == "north" then
        return "south"
    elseif dir == "south" then
        return "north"
    elseif dir == "east" then
        return "west"
    elseif dir == "west" then
        return "east"
    else
        -- This should never happen with proper types
        error(`Invalid direction: {dir}`)
    end
end
```

---

## Metatables and Metamethods

### Understanding Metatables

Metatables allow you to customize the behavior of tables.

```lua
--!strict

-- Basic metatable setup
local vector = { x = 1, y = 2 }
local mt = {
    __tostring = function(self): string
        return `Vector({self.x}, {self.y})`
    end,
}
setmetatable(vector, mt)
print(tostring(vector)) -- "Vector(1, 2)"

-- Complete Vector2D implementation with metatables
type Vector2D = typeof(setmetatable({} :: {
    x: number,
    y: number,
}, {} :: Vector2DMeta))

type Vector2DMeta = {
    __index: Vector2DMeta,
    __add: (self: Vector2D, other: Vector2D) -> Vector2D,
    __sub: (self: Vector2D, other: Vector2D) -> Vector2D,
    __mul: (self: Vector2D, scalar: number) -> Vector2D,
    __div: (self: Vector2D, scalar: number) -> Vector2D,
    __unm: (self: Vector2D) -> Vector2D,
    __eq: (self: Vector2D, other: Vector2D) -> boolean,
    __tostring: (self: Vector2D) -> string,
    __len: (self: Vector2D) -> number,
    magnitude: (self: Vector2D) -> number,
    normalized: (self: Vector2D) -> Vector2D,
    dot: (self: Vector2D, other: Vector2D) -> number,
    lerp: (self: Vector2D, other: Vector2D, alpha: number) -> Vector2D,
}

local Vector2D = {} :: Vector2DMeta
Vector2D.__index = Vector2D

function Vector2D.__add(self, other)
    return setmetatable({ x = self.x + other.x, y = self.y + other.y }, Vector2D)
end

function Vector2D.__sub(self, other)
    return setmetatable({ x = self.x - other.x, y = self.y - other.y }, Vector2D)
end

function Vector2D.__mul(self, scalar)
    return setmetatable({ x = self.x * scalar, y = self.y * scalar }, Vector2D)
end

function Vector2D.__div(self, scalar)
    return setmetatable({ x = self.x / scalar, y = self.y / scalar }, Vector2D)
end

function Vector2D.__unm(self)
    return setmetatable({ x = -self.x, y = -self.y }, Vector2D)
end

function Vector2D.__eq(self, other)
    return self.x == other.x and self.y == other.y
end

function Vector2D.__tostring(self)
    return `Vector2D({self.x}, {self.y})`
end

function Vector2D.__len(self)
    return math.sqrt(self.x * self.x + self.y * self.y)
end

function Vector2D.magnitude(self)
    return math.sqrt(self.x * self.x + self.y * self.y)
end

function Vector2D.normalized(self)
    local mag = self:magnitude()
    if mag == 0 then
        return setmetatable({ x = 0, y = 0 }, Vector2D)
    end
    return self / mag
end

function Vector2D.dot(self, other)
    return self.x * other.x + self.y * other.y
end

function Vector2D.lerp(self, other, alpha)
    return self + (other - self) * alpha
end

-- Constructor
local function newVector2D(x: number, y: number): Vector2D
    return setmetatable({ x = x, y = y }, Vector2D)
end

-- Usage
local v1 = newVector2D(3, 4)
local v2 = newVector2D(1, 2)
local v3 = v1 + v2
print(v3) -- Vector2D(4, 6)
print(v1:magnitude()) -- 5
```

### Proxy Tables

```lua
--!strict

-- Read-only proxy
local function readonly<T>(t: T & {}): T
    local proxy = {}
    local mt = {
        __index = t,
        __newindex = function()
            error("Attempt to modify read-only table")
        end,
        __metatable = "locked",
    }
    return setmetatable(proxy, mt) :: T
end

local config = readonly({
    maxHealth = 100,
    speed = 16,
    jumpPower = 50,
})

-- print(config.maxHealth) -- 100
-- config.maxHealth = 200 -- Error!

-- Observable proxy (for reactive updates)
type Observer<T> = (key: string, oldValue: T, newValue: T) -> ()

local function observable<T>(
    t: {[string]: T},
    observer: Observer<T>
): {[string]: T}
    local proxy = {}
    local mt = {
        __index = t,
        __newindex = function(_, key: string, value: T)
            local oldValue = t[key]
            if oldValue ~= value then
                t[key] = value
                observer(key, oldValue, value)
            end
        end,
    }
    return setmetatable(proxy, mt)
end

local playerStats = observable({
    health = 100,
    mana = 50,
}, function(key, old, new)
    print(`{key} changed from {old} to {new}`)
end)

playerStats.health = 80 -- "health changed from 100 to 80"

-- Default values proxy
local function withDefaults<T>(defaults: T & {}): T
    local data = {}
    local mt = {
        __index = function(_, key)
            local value = data[key]
            if value == nil then
                return (defaults :: any)[key]
            end
            return value
        end,
        __newindex = data,
    }
    return setmetatable({}, mt) :: T
end

type PlayerConfig = {
    name: string,
    level: number,
    class: string,
}

local defaultConfig: PlayerConfig = {
    name = "Unknown",
    level = 1,
    class = "Warrior",
}

local player = withDefaults(defaultConfig)
print(player.level) -- 1 (from defaults)
player.name = "Hero"
print(player.name) -- "Hero" (overridden)
```

### Advanced Metamethod Patterns

```lua
--!strict

-- __call metamethod for callable tables
type Callable<Args..., Ret...> = typeof(setmetatable({}, {
    __call = function(self, ...: Args...): Ret...
        return ... :: any
    end,
}))

-- Event emitter with __call
type EventCallback<T...> = (T...) -> ()

type Event<T...> = {
    connections: {EventCallback<T...>},
    connect: (self: Event<T...>, callback: EventCallback<T...>) -> () -> (),
    fire: (self: Event<T...>, T...) -> (),
}

local function createEvent<T...>(): Event<T...>
    local event = {
        connections = {},
    }

    function event:connect(callback)
        table.insert(self.connections, callback)
        return function()
            local index = table.find(self.connections, callback)
            if index then
                table.remove(self.connections, index)
            end
        end
    end

    function event:fire(...)
        for _, callback in ipairs(self.connections) do
            task.spawn(callback, ...)
        end
    end

    return setmetatable(event, {
        __call = function(self, ...)
            self:fire(...)
        end,
    }) :: any
end

local onDamage = createEvent<number, string>()
onDamage:connect(function(amount, source)
    print(`Took {amount} damage from {source}`)
end)
onDamage(10, "Fire") -- Using __call

-- __index function for computed properties
type Entity = {
    _health: number,
    _maxHealth: number,
}

local EntityMT = {
    __index = function(self: Entity, key: string): any
        if key == "health" then
            return self._health
        elseif key == "maxHealth" then
            return self._maxHealth
        elseif key == "healthPercent" then
            return self._health / self._maxHealth * 100
        elseif key == "isAlive" then
            return self._health > 0
        end
        return nil
    end,
    __newindex = function(self: Entity, key: string, value: any)
        if key == "health" then
            self._health = math.clamp(value, 0, self._maxHealth)
        elseif key == "maxHealth" then
            self._maxHealth = math.max(value, 1)
            self._health = math.min(self._health, self._maxHealth)
        end
    end,
}
```

---

## Coroutines and Task Library

### Understanding Coroutines

```lua
--!strict

-- Basic coroutine creation and usage
local function counter(max: number): () -> number?
    return coroutine.wrap(function()
        for i = 1, max do
            coroutine.yield(i)
        end
    end)
end

local count = counter(5)
print(count()) -- 1
print(count()) -- 2
print(count()) -- 3

-- Iterator pattern with coroutines
local function range(start: number, stop: number, step: number?): () -> number?
    local actualStep = step or 1
    return coroutine.wrap(function()
        local current = start
        while (actualStep > 0 and current <= stop) or (actualStep < 0 and current >= stop) do
            coroutine.yield(current)
            current += actualStep
        end
    end)
end

for num in range(1, 10, 2) do
    print(num) -- 1, 3, 5, 7, 9
end

-- Coroutine state management
type CoroutineState = "running" | "suspended" | "normal" | "dead"

local function getCoroutineInfo(co: thread): (CoroutineState, string?)
    local status = coroutine.status(co)
    local running = coroutine.running()

    if co == running then
        return "running", nil
    end

    return status :: CoroutineState, nil
end
```

### Task Library Deep Dive

```lua
--!strict

-- task.spawn - Immediate execution in new thread
local function spawnExample()
    print("1 - Before spawn")
    task.spawn(function()
        print("2 - Inside spawn")
        task.wait(1)
        print("4 - After wait in spawn")
    end)
    print("3 - After spawn call")
end

-- task.defer - Execute after current thread yields
local function deferExample()
    print("1 - Before defer")
    task.defer(function()
        print("3 - Inside defer") -- Runs after current execution
    end)
    print("2 - After defer call")
end

-- task.delay - Execute after time delay
local function delayExample()
    task.delay(2, function()
        print("This runs after 2 seconds")
    end)

    -- With arguments
    task.delay(1, function(message: string, count: number)
        print(message, count)
    end, "Hello", 42)
end

-- task.wait vs wait()
local function waitComparison()
    -- task.wait returns actual time waited
    local startTime = os.clock()
    local actualWait = task.wait(0.5)
    local elapsed = os.clock() - startTime
    print(`Requested: 0.5, Actual: {actualWait}, Elapsed: {elapsed}`)
end

-- task.cancel - Cancel scheduled tasks
local function cancelExample()
    local thread = task.delay(5, function()
        print("This will never print")
    end)

    task.wait(1)
    task.cancel(thread) -- Cancel before it runs
end

-- Practical async pattern
type AsyncResult<T> = {
    status: "pending" | "resolved" | "rejected",
    value: T?,
    error: string?,
    thread: thread?,
}

local function async<T>(fn: () -> T): AsyncResult<T>
    local result: AsyncResult<T> = {
        status = "pending",
        value = nil,
        error = nil,
        thread = nil,
    }

    result.thread = task.spawn(function()
        local success, value = pcall(fn)
        if success then
            result.status = "resolved"
            result.value = value
        else
            result.status = "rejected"
            result.error = tostring(value)
        end
    end)

    return result
end

local function await<T>(result: AsyncResult<T>, timeout: number?): (boolean, T?)
    local maxTime = timeout or 30
    local startTime = os.clock()

    while result.status == "pending" do
        if os.clock() - startTime > maxTime then
            if result.thread then
                task.cancel(result.thread)
            end
            return false, nil
        end
        task.wait()
    end

    if result.status == "resolved" then
        return true, result.value
    else
        return false, nil
    end
end
```

### Advanced Async Patterns

```lua
--!strict

-- Promise-like pattern
type Promise<T> = {
    _status: "pending" | "fulfilled" | "rejected",
    _value: T?,
    _reason: string?,
    _callbacks: {(T) -> ()},
    _errbacks: {(string) -> ()},
    andThen: (self: Promise<T>, callback: (T) -> ()) -> Promise<T>,
    catch: (self: Promise<T>, errback: (string) -> ()) -> Promise<T>,
    await: (self: Promise<T>) -> (boolean, T?),
}

local function createPromise<T>(executor: (resolve: (T) -> (), reject: (string) -> ()) -> ()): Promise<T>
    local promise: Promise<T> = {
        _status = "pending",
        _value = nil,
        _reason = nil,
        _callbacks = {},
        _errbacks = {},

        andThen = function(self, callback)
            if self._status == "fulfilled" then
                task.spawn(callback, self._value :: T)
            elseif self._status == "pending" then
                table.insert(self._callbacks, callback)
            end
            return self
        end,

        catch = function(self, errback)
            if self._status == "rejected" then
                task.spawn(errback, self._reason :: string)
            elseif self._status == "pending" then
                table.insert(self._errbacks, errback)
            end
            return self
        end,

        await = function(self)
            while self._status == "pending" do
                task.wait()
            end
            return self._status == "fulfilled", self._value
        end,
    }

    local function resolve(value: T)
        if promise._status ~= "pending" then return end
        promise._status = "fulfilled"
        promise._value = value
        for _, callback in ipairs(promise._callbacks) do
            task.spawn(callback, value)
        end
    end

    local function reject(reason: string)
        if promise._status ~= "pending" then return end
        promise._status = "rejected"
        promise._reason = reason
        for _, errback in ipairs(promise._errbacks) do
            task.spawn(errback, reason)
        end
    end

    task.spawn(executor, resolve, reject)

    return promise
end

-- Usage example
local function fetchData(): Promise<string>
    return createPromise(function(resolve, reject)
        task.wait(1) -- Simulate network delay
        if math.random() > 0.2 then
            resolve("Data loaded successfully")
        else
            reject("Network error")
        end
    end)
end

fetchData()
    :andThen(function(data)
        print("Got data:", data)
    end)
    :catch(function(err)
        warn("Error:", err)
    end)
```

---

## Buffer and Memory Manipulation

### Buffer Basics

```lua
--!strict

-- Creating and using buffers
local function bufferBasics()
    -- Create a buffer of 100 bytes
    local buf = buffer.create(100)

    -- Write different data types
    buffer.writeu8(buf, 0, 255)         -- Unsigned 8-bit at offset 0
    buffer.writei16(buf, 1, -1000)      -- Signed 16-bit at offset 1
    buffer.writeu32(buf, 3, 4294967295) -- Unsigned 32-bit at offset 3
    buffer.writef32(buf, 7, 3.14159)    -- Float 32-bit at offset 7
    buffer.writef64(buf, 11, 2.718281828) -- Float 64-bit at offset 11

    -- Read data back
    local u8 = buffer.readu8(buf, 0)
    local i16 = buffer.readi16(buf, 1)
    local u32 = buffer.readu32(buf, 3)
    local f32 = buffer.readf32(buf, 7)
    local f64 = buffer.readf64(buf, 11)

    print(`u8: {u8}, i16: {i16}, u32: {u32}, f32: {f32}, f64: {f64}`)
end

-- String operations with buffers
local function bufferStrings()
    local str = "Hello, Roblox!"
    local buf = buffer.create(#str)

    -- Write string to buffer
    buffer.writestring(buf, 0, str)

    -- Read string back
    local readStr = buffer.readstring(buf, 0, #str)
    print(readStr) -- "Hello, Roblox!"

    -- Get buffer length
    local length = buffer.len(buf)
    print("Buffer length:", length)
end

-- Copy between buffers
local function bufferCopy()
    local source = buffer.create(10)
    local dest = buffer.create(10)

    -- Fill source with data
    for i = 0, 9 do
        buffer.writeu8(source, i, i * 10)
    end

    -- Copy from source to dest
    buffer.copy(dest, 0, source, 0, 10)

    -- Verify copy
    for i = 0, 9 do
        print(buffer.readu8(dest, i)) -- 0, 10, 20, 30...
    end
end
```

### Binary Serialization with Buffers

```lua
--!strict

-- Efficient binary serialization
type SerializedPlayer = {
    id: number,      -- u32
    health: number,  -- f32
    x: number,       -- f32
    y: number,       -- f32
    z: number,       -- f32
    flags: number,   -- u8 (bitfield)
}

local PLAYER_SIZE = 21 -- 4 + 4 + 4 + 4 + 4 + 1

local function serializePlayer(player: SerializedPlayer): buffer
    local buf = buffer.create(PLAYER_SIZE)

    buffer.writeu32(buf, 0, player.id)
    buffer.writef32(buf, 4, player.health)
    buffer.writef32(buf, 8, player.x)
    buffer.writef32(buf, 12, player.y)
    buffer.writef32(buf, 16, player.z)
    buffer.writeu8(buf, 20, player.flags)

    return buf
end

local function deserializePlayer(buf: buffer): SerializedPlayer
    return {
        id = buffer.readu32(buf, 0),
        health = buffer.readf32(buf, 4),
        x = buffer.readf32(buf, 8),
        y = buffer.readf32(buf, 12),
        z = buffer.readf32(buf, 16),
        flags = buffer.readu8(buf, 20),
    }
end

-- Batch serialization for network efficiency
local function serializePlayers(players: {SerializedPlayer}): buffer
    local count = #players
    local buf = buffer.create(4 + count * PLAYER_SIZE)

    buffer.writeu32(buf, 0, count)

    for i, player in ipairs(players) do
        local offset = 4 + (i - 1) * PLAYER_SIZE
        buffer.writeu32(buf, offset, player.id)
        buffer.writef32(buf, offset + 4, player.health)
        buffer.writef32(buf, offset + 8, player.x)
        buffer.writef32(buf, offset + 12, player.y)
        buffer.writef32(buf, offset + 16, player.z)
        buffer.writeu8(buf, offset + 20, player.flags)
    end

    return buf
end

local function deserializePlayers(buf: buffer): {SerializedPlayer}
    local count = buffer.readu32(buf, 0)
    local players = table.create(count)

    for i = 1, count do
        local offset = 4 + (i - 1) * PLAYER_SIZE
        players[i] = {
            id = buffer.readu32(buf, offset),
            health = buffer.readf32(buf, offset + 4),
            x = buffer.readf32(buf, offset + 8),
            y = buffer.readf32(buf, offset + 12),
            z = buffer.readf32(buf, offset + 16),
            flags = buffer.readu8(buf, offset + 20),
        }
    end

    return players
end
```

---

## Native Code Generation

### Enabling Native Code

```lua
--!native
--!strict

-- The --!native directive enables native code generation for this module
-- This can significantly improve performance for compute-intensive code

-- Functions that benefit from native code:
-- 1. Math-heavy computations
-- 2. Tight loops
-- 3. Array/buffer operations
-- 4. Physics calculations

-- Example: Fast noise generation with native code
local function noise2D(x: number, y: number, seed: number): number
    local n = bit32.bxor(
        bit32.bxor(x * 374761393, y * 668265263) + seed,
        seed
    )
    n = bit32.band(n, 0x7FFFFFFF)
    n = bit32.bxor(n, bit32.rshift(n, 13))
    n = n * 1274126177
    n = bit32.bxor(n, bit32.rshift(n, 16))
    return (n % 1000000) / 1000000
end

-- Example: Fast vector operations
local function dotProduct(
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number
): number
    return ax * bx + ay * by + az * bz
end

local function crossProduct(
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number
): (number, number, number)
    return
        ay * bz - az * by,
        az * bx - ax * bz,
        ax * by - ay * bx
end

local function normalize(x: number, y: number, z: number): (number, number, number)
    local len = math.sqrt(x * x + y * y + z * z)
    if len == 0 then
        return 0, 0, 0
    end
    return x / len, y / len, z / len
end

-- Example: Fast matrix multiplication
local function multiplyMatrix4x4(a: {number}, b: {number}): {number}
    local result = table.create(16, 0)

    for row = 0, 3 do
        for col = 0, 3 do
            local sum = 0
            for k = 0, 3 do
                sum += a[row * 4 + k + 1] * b[k * 4 + col + 1]
            end
            result[row * 4 + col + 1] = sum
        end
    end

    return result
end
```

### Native Code Best Practices

```lua
--!native
--!strict

-- DO: Use primitive types in hot loops
local function goodPattern(data: {number}, multiplier: number): {number}
    local result = table.create(#data)
    for i = 1, #data do
        result[i] = data[i] * multiplier
    end
    return result
end

-- DON'T: Use complex types in tight loops (prevents optimization)
-- local function badPattern(data: {Vector3}): {Vector3}
--     -- Vector3 operations prevent full native optimization
-- end

-- DO: Inline small functions for better optimization
local function processPixels(pixels: buffer, width: number, height: number)
    local total = width * height
    for i = 0, total - 1 do
        local offset = i * 4
        local r = buffer.readu8(pixels, offset)
        local g = buffer.readu8(pixels, offset + 1)
        local b = buffer.readu8(pixels, offset + 2)

        -- Grayscale conversion
        local gray = math.floor(r * 0.299 + g * 0.587 + b * 0.114)

        buffer.writeu8(pixels, offset, gray)
        buffer.writeu8(pixels, offset + 1, gray)
        buffer.writeu8(pixels, offset + 2, gray)
    end
end

-- DO: Use buffer for bulk data operations
local function sumBuffer(buf: buffer): number
    local sum = 0
    local len = buffer.len(buf) // 4 -- Assuming f32 values
    for i = 0, len - 1 do
        sum += buffer.readf32(buf, i * 4)
    end
    return sum
end
```

---

## Compiler Directives

### Available Directives

```lua
-- Type checking modes
--!strict    -- Full type checking, recommended for production
--!nonstrict -- Partial type checking (default)
--!nocheck   -- Disable type checking entirely

-- Code generation
--!native    -- Enable native code generation
--!optimize 2 -- Optimization level (0, 1, or 2)

-- Combining directives
--!native
--!strict
--!optimize 2

-- Module-level example
--!strict
--!native

local MyModule = {}

function MyModule.calculate(x: number, y: number): number
    return x * y + math.sin(x)
end

return MyModule
```

### Optimization Levels

```lua
--!optimize 0
-- No optimizations, fastest compilation, best for debugging

--!optimize 1
-- Basic optimizations (default), good balance

--!optimize 2
-- Full optimizations, may increase compile time
-- Best for production code

-- Example showing when to use each level:

-- Development/debugging: optimize 0
--!optimize 0
local function debugFunction()
    -- Easier to debug, line numbers more accurate
end

-- Most code: optimize 1 (default)
-- No directive needed

-- Performance-critical: optimize 2 + native
--!native
--!optimize 2
local function criticalPath(data: {number}): number
    local sum = 0
    for _, v in ipairs(data) do
        sum += v
    end
    return sum
end
```

---

## Strict Mode Best Practices

### Enabling Strict Mode

```lua
--!strict

-- Strict mode requirements:
-- 1. All variables must have types (inferred or explicit)
-- 2. All function parameters must have types
-- 3. All return values must have types
-- 4. No implicit any types

-- Good: Explicit types
local playerHealth: number = 100
local playerName: string = "Hero"
local isAlive: boolean = true

-- Good: Type inference works
local count = 0 -- Inferred as number
local items = {} :: {string} -- Explicit table type

-- Functions must have typed parameters
local function damage(player: Player, amount: number): number
    -- Implementation
    return amount
end
```

### Common Strict Mode Patterns

```lua
--!strict

-- Pattern 1: Typed table constructors
type Config = {
    name: string,
    value: number,
    enabled: boolean,
}

local config: Config = {
    name = "default",
    value = 100,
    enabled = true,
}

-- Pattern 2: Optional parameters with defaults
local function greet(name: string, greeting: string?): string
    local actualGreeting = greeting or "Hello"
    return `{actualGreeting}, {name}!`
end

-- Pattern 3: Variadic functions
local function sum(...: number): number
    local total = 0
    for _, v in ipairs({...}) do
        total += v
    end
    return total
end

-- Pattern 4: Type narrowing
local function processValue(value: string | number): string
    if type(value) == "string" then
        return value:upper()
    else
        return tostring(value)
    end
end

-- Pattern 5: Instance type checking
local function getCharacter(player: Player): Model?
    local character = player.Character
    if character and character:IsA("Model") then
        return character
    end
    return nil
end

-- Pattern 6: Callback types
type Callback<T> = (value: T) -> ()
type Predicate<T> = (value: T) -> boolean

local function forEach<T>(array: {T}, callback: Callback<T>)
    for _, value in ipairs(array) do
        callback(value)
    end
end

local function filter<T>(array: {T}, predicate: Predicate<T>): {T}
    local result: {T} = {}
    for _, value in ipairs(array) do
        if predicate(value) then
            table.insert(result, value)
        end
    end
    return result
end
```

### Handling External APIs

```lua
--!strict

-- When dealing with untyped external data, use explicit casts

-- Pattern 1: JSON parsing
local HttpService = game:GetService("HttpService")

type ApiResponse = {
    success: boolean,
    data: {
        id: number,
        name: string,
    }?,
    error: string?,
}

local function parseApiResponse(json: string): ApiResponse?
    local success, decoded = pcall(function()
        return HttpService:JSONDecode(json)
    end)

    if success then
        return decoded :: ApiResponse
    end
    return nil
end

-- Pattern 2: Instance finding with type guards
local function findPartInWorkspace(name: string): Part?
    local found = workspace:FindFirstChild(name)
    if found and found:IsA("Part") then
        return found
    end
    return nil
end

-- Pattern 3: Attribute access
local function getAttribute<T>(instance: Instance, name: string, default: T): T
    local value = instance:GetAttribute(name)
    if value ~= nil then
        return value :: T
    end
    return default
end
```

---

## Debugging Type Errors

### Common Type Errors and Solutions

```lua
--!strict

-- Error: Type 'nil' could not be converted into 'string'
-- Solution: Handle nil case
local function getName(player: Player): string
    local name = player:GetAttribute("CustomName")
    if type(name) == "string" then
        return name
    end
    return player.Name -- Fallback
end

-- Error: Type '{number}' could not be converted into '{string}'
-- Solution: Create properly typed table
local function createNames(): {string}
    local names: {string} = {} -- Explicit type
    table.insert(names, "Alice")
    table.insert(names, "Bob")
    return names
end

-- Error: Cannot call non-function type
-- Solution: Check if method exists
local function safeCall(obj: any, method: string, ...: any): any
    if type(obj) == "table" and type(obj[method]) == "function" then
        return obj[method](obj, ...)
    end
    return nil
end

-- Error: Type 'number?' could not be converted into 'number'
-- Solution: Assert or default
local function getHealth(humanoid: Humanoid?): number
    if humanoid then
        return humanoid.Health
    end
    return 0
end

-- Alternative with assert
local function getHealthAssert(humanoid: Humanoid?): number
    assert(humanoid, "Humanoid is nil")
    return humanoid.Health
end
```

### Type Error Debugging Techniques

```lua
--!strict

-- Technique 1: Use intermediate variables to identify issues
local function debugTypes()
    local player = game.Players.LocalPlayer
    local character = player.Character -- May be nil!

    -- Add type annotation to see what's expected
    local char: Model = character -- Error shows here if nil
end

-- Technique 2: Print types at runtime
local function printType(value: unknown, label: string?)
    local prefix = label and `{label}: ` or ""
    print(`{prefix}typeof={typeof(value)}, type={type(value)}`)
end

-- Technique 3: Use assertion functions
local function assertType<T>(value: unknown, expectedType: string): T
    assert(typeof(value) == expectedType,
        `Expected {expectedType}, got {typeof(value)}`)
    return value :: T
end

-- Technique 4: Create type guard functions
local function isStringArray(value: unknown): boolean
    if type(value) ~= "table" then
        return false
    end
    for _, item in ipairs(value :: {unknown}) do
        if type(item) ~= "string" then
            return false
        end
    end
    return true
end

-- Technique 5: Use pcall for runtime type safety
local function safeIndex<T>(tbl: {[string]: T}, key: string): T?
    local success, result = pcall(function()
        return tbl[key]
    end)
    if success then
        return result
    end
    return nil
end
```

### Working with Complex Type Hierarchies

```lua
--!strict

-- Define base types
type Entity = {
    id: string,
    name: string,
    position: Vector3,
}

type Character = Entity & {
    health: number,
    maxHealth: number,
    team: string,
}

type Player = Character & {
    userId: number,
    inventory: {string},
}

type NPC = Character & {
    aiType: string,
    spawnPoint: Vector3,
}

-- Type guard functions
local function isPlayer(entity: Entity): boolean
    return (entity :: any).userId ~= nil
end

local function isNPC(entity: Entity): boolean
    return (entity :: any).aiType ~= nil
end

-- Processing with type guards
local function processEntity(entity: Entity)
    print(`Processing {entity.name}`)

    if isPlayer(entity) then
        local player = entity :: Player
        print(`  Player ID: {player.userId}`)
    elseif isNPC(entity) then
        local npc = entity :: NPC
        print(`  AI Type: {npc.aiType}`)
    end
end

-- Generic entity factory
type EntityConstructor<T> = (data: {[string]: any}) -> T

local function createEntity<T>(constructor: EntityConstructor<T>, data: {[string]: any}): T
    return constructor(data)
end
```

---

## Summary

This guide covered advanced Luau programming concepts essential for professional Roblox development:

| Topic | Key Takeaways |
|-------|--------------|
| Type System | Use generics, unions, and intersections for type-safe code |
| Metatables | Enable OOP patterns and proxy behaviors |
| Coroutines | Implement async patterns and iterators |
| Buffers | Efficient binary data handling |
| Native Code | Optimize compute-heavy operations |
| Strict Mode | Catch errors at compile time |

**Best Practices Checklist:**

- [ ] Always use `--!strict` for new modules
- [ ] Define types for all public APIs
- [ ] Use type guards for runtime safety
- [ ] Enable `--!native` for performance-critical code
- [ ] Handle nil cases explicitly
- [ ] Use discriminated unions for state management
- [ ] Prefer composition over inheritance with intersection types
