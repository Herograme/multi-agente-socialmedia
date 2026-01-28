---
title: "Roblox Security Patterns Guide"
agent: lua-scripter
category: security
version: 1.0.0
last_updated: 2025-01-28
tags: [security, anti-exploit, validation, server-authority, remotes]
---

# Roblox Security Patterns Guide

A comprehensive guide to implementing secure Roblox games, covering server authority, input validation, anti-exploit measures, and security best practices.

---

## Table of Contents

1. [Server Authority Patterns](#server-authority-patterns)
2. [Input Validation Comprehensive Guide](#input-validation-comprehensive-guide)
3. [Rate Limiting Implementation](#rate-limiting-implementation)
4. [Anti-Exploit Detection](#anti-exploit-detection)
5. [Secure Remote Communication](#secure-remote-communication)
6. [Data Integrity Verification](#data-integrity-verification)
7. [Common Exploit Vectors](#common-exploit-vectors)
8. [Security Audit Checklist](#security-audit-checklist)

---

## Server Authority Patterns

### Core Principle: Never Trust the Client

The fundamental rule of Roblox security is that the server must be the single source of truth. Clients can be compromised, so all game-critical logic must run on the server.

```lua
--!strict

-- SERVER SCRIPT: All authoritative game logic lives here

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

-- Game state is ONLY stored on server
local GameState = {
    players: {[Player]: PlayerData} = {},
    items: {[string]: ItemData} = {},
    matches: {[string]: MatchData} = {},
}

type PlayerData = {
    id: number,
    coins: number,
    inventory: {string},
    position: Vector3,
    health: number,
    lastAction: number,
}

type ItemData = {
    id: string,
    ownerId: number?,
    position: Vector3,
    active: boolean,
}

type MatchData = {
    id: string,
    players: {number},
    state: "waiting" | "playing" | "finished",
    startTime: number,
}

-- Server-authoritative action handler
local function processPlayerAction(player: Player, action: string, data: any): (boolean, string?)
    local playerData = GameState.players[player]
    if not playerData then
        return false, "Player not initialized"
    end

    -- All validation happens on server
    if action == "purchase" then
        return processPurchase(player, playerData, data)
    elseif action == "attack" then
        return processAttack(player, playerData, data)
    elseif action == "move" then
        return processMove(player, playerData, data)
    end

    return false, "Unknown action"
end

local function processPurchase(player: Player, playerData: PlayerData, itemId: string): (boolean, string?)
    -- Validate item exists
    local item = getItemConfig(itemId)
    if not item then
        return false, "Item does not exist"
    end

    -- Validate player can afford
    if playerData.coins < item.price then
        return false, "Insufficient funds"
    end

    -- Server performs the transaction
    playerData.coins -= item.price
    table.insert(playerData.inventory, itemId)

    -- Notify client of result (client display only)
    updateClientDisplay(player, playerData)

    return true, nil
end
```

### Movement Validation

```lua
--!strict

-- SERVER: Movement validation system
local MAX_SPEED = 50 -- studs per second
local MAX_TELEPORT_DISTANCE = 10 -- studs
local POSITION_HISTORY_SIZE = 10

type MovementValidator = {
    positionHistory: {[Player]: {Vector3}},
    lastUpdateTime: {[Player]: number},
    violations: {[Player]: number},

    validatePosition: (self: MovementValidator, player: Player, newPosition: Vector3) -> (boolean, string?),
    recordPosition: (self: MovementValidator, player: Player, position: Vector3) -> (),
    getAverageSpeed: (self: MovementValidator, player: Player) -> number,
}

local function createMovementValidator(): MovementValidator
    local validator: MovementValidator = {
        positionHistory = {},
        lastUpdateTime = {},
        violations = {},

        validatePosition = function(self, player, newPosition)
            local history = self.positionHistory[player]
            local lastTime = self.lastUpdateTime[player]

            if not history or #history == 0 then
                return true, nil -- First position
            end

            local lastPosition = history[#history]
            local now = os.clock()
            local deltaTime = now - (lastTime or now)

            if deltaTime < 0.01 then
                deltaTime = 0.01 -- Prevent division by zero
            end

            local distance = (newPosition - lastPosition).Magnitude
            local speed = distance / deltaTime

            -- Check for teleportation
            if distance > MAX_TELEPORT_DISTANCE and deltaTime < 0.5 then
                self.violations[player] = (self.violations[player] or 0) + 1
                return false, "Teleport detected"
            end

            -- Check for speed hacking
            if speed > MAX_SPEED * 1.5 then -- 50% tolerance for lag
                self.violations[player] = (self.violations[player] or 0) + 1
                return false, "Speed violation"
            end

            return true, nil
        end,

        recordPosition = function(self, player, position)
            if not self.positionHistory[player] then
                self.positionHistory[player] = {}
            end

            table.insert(self.positionHistory[player], position)

            if #self.positionHistory[player] > POSITION_HISTORY_SIZE then
                table.remove(self.positionHistory[player], 1)
            end

            self.lastUpdateTime[player] = os.clock()
        end,

        getAverageSpeed = function(self, player)
            local history = self.positionHistory[player]
            if not history or #history < 2 then
                return 0
            end

            local totalDistance = 0
            for i = 2, #history do
                totalDistance += (history[i] - history[i-1]).Magnitude
            end

            return totalDistance / #history
        end,
    }

    return validator
end

-- Usage
local movementValidator = createMovementValidator()

local function onPositionUpdate(player: Player, position: Vector3)
    local valid, reason = movementValidator:validatePosition(player, position)

    if not valid then
        warn(`[Security] Player {player.Name} movement violation: {reason}`)

        -- Correct player position
        local character = player.Character
        if character and character.PrimaryPart then
            local lastValidPosition = getLastValidPosition(player)
            character:PivotTo(CFrame.new(lastValidPosition))
        end

        return
    end

    movementValidator:recordPosition(player, position)
end
```

### Combat System Security

```lua
--!strict

-- SERVER: Secure combat system
type CombatValidator = {
    lastAttackTime: {[Player]: number},
    attackCooldown: number,
    maxAttackRange: number,

    canAttack: (self: CombatValidator, attacker: Player) -> boolean,
    validateAttack: (self: CombatValidator, attacker: Player, target: Player, weaponId: string) -> (boolean, string?),
    processAttack: (self: CombatValidator, attacker: Player, target: Player, weaponId: string) -> number,
}

local function createCombatValidator(cooldown: number, maxRange: number): CombatValidator
    return {
        lastAttackTime = {},
        attackCooldown = cooldown,
        maxAttackRange = maxRange,

        canAttack = function(self, attacker)
            local lastAttack = self.lastAttackTime[attacker] or 0
            return os.clock() - lastAttack >= self.attackCooldown
        end,

        validateAttack = function(self, attacker, target, weaponId)
            -- Check cooldown
            if not self:canAttack(attacker) then
                return false, "Attack on cooldown"
            end

            -- Validate attacker is alive
            local attackerHumanoid = getHumanoid(attacker)
            if not attackerHumanoid or attackerHumanoid.Health <= 0 then
                return false, "Attacker is dead"
            end

            -- Validate target is alive
            local targetHumanoid = getHumanoid(target)
            if not targetHumanoid or targetHumanoid.Health <= 0 then
                return false, "Target is dead"
            end

            -- Validate weapon ownership (SERVER checks inventory)
            if not playerOwnsWeapon(attacker, weaponId) then
                return false, "Weapon not owned"
            end

            -- Validate range (SERVER calculates positions)
            local attackerPos = getPlayerPosition(attacker)
            local targetPos = getPlayerPosition(target)

            if not attackerPos or not targetPos then
                return false, "Invalid positions"
            end

            local distance = (attackerPos - targetPos).Magnitude
            local weaponRange = getWeaponRange(weaponId)

            if distance > weaponRange + 5 then -- 5 stud tolerance for lag
                return false, "Target out of range"
            end

            -- Validate line of sight
            if not hasLineOfSight(attackerPos, targetPos) then
                return false, "No line of sight"
            end

            return true, nil
        end,

        processAttack = function(self, attacker, target, weaponId)
            -- Record attack time
            self.lastAttackTime[attacker] = os.clock()

            -- Calculate damage (SERVER controls all values)
            local baseDamage = getWeaponDamage(weaponId)
            local attackerStats = getPlayerStats(attacker)
            local targetStats = getPlayerStats(target)

            local finalDamage = calculateDamage(baseDamage, attackerStats, targetStats)

            -- Apply damage (SERVER only)
            applyDamage(target, finalDamage, attacker)

            return finalDamage
        end,
    }
end

-- Helper functions (all server-side)
local function getHumanoid(player: Player): Humanoid?
    local character = player.Character
    return character and character:FindFirstChildOfClass("Humanoid")
end

local function getPlayerPosition(player: Player): Vector3?
    local character = player.Character
    local rootPart = character and character:FindFirstChild("HumanoidRootPart")
    return rootPart and (rootPart :: BasePart).Position
end

local function hasLineOfSight(from: Vector3, to: Vector3): boolean
    local params = RaycastParams.new()
    params.FilterType = Enum.RaycastFilterType.Exclude

    local result = workspace:Raycast(from, to - from, params)
    return result == nil
end
```

---

## Input Validation Comprehensive Guide

### Type Validation

```lua
--!strict

-- Comprehensive type validation system
type ValidationResult = {
    valid: boolean,
    error: string?,
    sanitized: any?,
}

type Validator<T> = (value: unknown) -> ValidationResult

-- Primitive validators
local function validateString(minLen: number?, maxLen: number?): Validator<string>
    return function(value: unknown): ValidationResult
        if type(value) ~= "string" then
            return { valid = false, error = "Expected string" }
        end

        local str = value :: string

        if minLen and #str < minLen then
            return { valid = false, error = `String too short (min {minLen})` }
        end

        if maxLen and #str > maxLen then
            return { valid = false, error = `String too long (max {maxLen})` }
        end

        -- Sanitize: remove control characters
        local sanitized = str:gsub("[%c]", "")

        return { valid = true, sanitized = sanitized }
    end
end

local function validateNumber(min: number?, max: number?, integer: boolean?): Validator<number>
    return function(value: unknown): ValidationResult
        if type(value) ~= "number" then
            return { valid = false, error = "Expected number" }
        end

        local num = value :: number

        if num ~= num then -- NaN check
            return { valid = false, error = "Invalid number (NaN)" }
        end

        if math.abs(num) == math.huge then
            return { valid = false, error = "Invalid number (Infinity)" }
        end

        if integer and num % 1 ~= 0 then
            return { valid = false, error = "Expected integer" }
        end

        if min and num < min then
            return { valid = false, error = `Number below minimum ({min})` }
        end

        if max and num > max then
            return { valid = false, error = `Number above maximum ({max})` }
        end

        return { valid = true, sanitized = num }
    end
end

local function validateBoolean(): Validator<boolean>
    return function(value: unknown): ValidationResult
        if type(value) ~= "boolean" then
            return { valid = false, error = "Expected boolean" }
        end
        return { valid = true, sanitized = value }
    end
end

local function validateVector3(maxMagnitude: number?): Validator<Vector3>
    return function(value: unknown): ValidationResult
        if typeof(value) ~= "Vector3" then
            return { valid = false, error = "Expected Vector3" }
        end

        local vec = value :: Vector3

        -- Check for NaN components
        if vec.X ~= vec.X or vec.Y ~= vec.Y or vec.Z ~= vec.Z then
            return { valid = false, error = "Vector3 contains NaN" }
        end

        -- Check magnitude
        if maxMagnitude and vec.Magnitude > maxMagnitude then
            return { valid = false, error = `Vector3 magnitude too large (max {maxMagnitude})` }
        end

        return { valid = true, sanitized = vec }
    end
end

-- Enum validator
local function validateEnum<T>(validValues: {T}): Validator<T>
    local valueSet: {[T]: boolean} = {}
    for _, v in ipairs(validValues) do
        valueSet[v] = true
    end

    return function(value: unknown): ValidationResult
        if not valueSet[value :: T] then
            return { valid = false, error = "Invalid enum value" }
        end
        return { valid = true, sanitized = value }
    end
end

-- Array validator
local function validateArray<T>(itemValidator: Validator<T>, maxLength: number?): Validator<{T}>
    return function(value: unknown): ValidationResult
        if type(value) ~= "table" then
            return { valid = false, error = "Expected array" }
        end

        local arr = value :: {T}

        if maxLength and #arr > maxLength then
            return { valid = false, error = `Array too long (max {maxLength})` }
        end

        local sanitized: {T} = {}
        for i, item in ipairs(arr) do
            local result = itemValidator(item)
            if not result.valid then
                return { valid = false, error = `Invalid item at index {i}: {result.error}` }
            end
            sanitized[i] = result.sanitized
        end

        return { valid = true, sanitized = sanitized }
    end
end

-- Object validator
type SchemaDefinition = {[string]: Validator<any>}

local function validateObject(schema: SchemaDefinition): Validator<{[string]: any}>
    return function(value: unknown): ValidationResult
        if type(value) ~= "table" then
            return { valid = false, error = "Expected object" }
        end

        local obj = value :: {[string]: any}
        local sanitized: {[string]: any} = {}

        for key, validator in pairs(schema) do
            local result = validator(obj[key])
            if not result.valid then
                return { valid = false, error = `Invalid field "{key}": {result.error}` }
            end
            sanitized[key] = result.sanitized
        end

        return { valid = true, sanitized = sanitized }
    end
end
```

### Remote Event Validation

```lua
--!strict

-- Secure remote event handler
type RemoteSchema = {
    validator: Validator<any>,
    rateLimit: number?, -- requests per second
    requiresAuth: boolean?,
}

type SecureRemoteHandler = {
    schemas: {[string]: RemoteSchema},
    rateLimits: {[Player]: {[string]: {number}}},

    register: (self: SecureRemoteHandler, name: string, schema: RemoteSchema) -> (),
    handleRequest: (self: SecureRemoteHandler, player: Player, eventName: string, data: any) -> (boolean, any?),
    checkRateLimit: (self: SecureRemoteHandler, player: Player, eventName: string) -> boolean,
}

local function createSecureRemoteHandler(): SecureRemoteHandler
    return {
        schemas = {},
        rateLimits = {},

        register = function(self, name, schema)
            self.schemas[name] = schema
        end,

        handleRequest = function(self, player, eventName, data)
            local schema = self.schemas[eventName]

            if not schema then
                warn(`[Security] Unknown remote event: {eventName}`)
                return false, "Unknown event"
            end

            -- Check rate limit
            if not self:checkRateLimit(player, eventName) then
                warn(`[Security] Rate limited: {player.Name} on {eventName}`)
                return false, "Rate limited"
            end

            -- Validate data
            local result = schema.validator(data)
            if not result.valid then
                warn(`[Security] Validation failed for {player.Name} on {eventName}: {result.error}`)
                return false, result.error
            end

            return true, result.sanitized
        end,

        checkRateLimit = function(self, player, eventName)
            local schema = self.schemas[eventName]
            if not schema or not schema.rateLimit then
                return true
            end

            if not self.rateLimits[player] then
                self.rateLimits[player] = {}
            end

            if not self.rateLimits[player][eventName] then
                self.rateLimits[player][eventName] = {}
            end

            local timestamps = self.rateLimits[player][eventName]
            local now = os.clock()
            local windowStart = now - 1 -- 1 second window

            -- Remove old timestamps
            local validTimestamps: {number} = {}
            for _, ts in ipairs(timestamps) do
                if ts > windowStart then
                    table.insert(validTimestamps, ts)
                end
            end

            if #validTimestamps >= schema.rateLimit then
                return false
            end

            table.insert(validTimestamps, now)
            self.rateLimits[player][eventName] = validTimestamps

            return true
        end,
    }
end

-- Usage example
local remoteHandler = createSecureRemoteHandler()

-- Register schemas
remoteHandler:register("PurchaseItem", {
    validator = validateObject({
        itemId = validateString(1, 50),
        quantity = validateNumber(1, 99, true),
    }),
    rateLimit = 5, -- 5 purchases per second max
})

remoteHandler:register("SendChat", {
    validator = validateObject({
        message = validateString(1, 200),
        channel = validateEnum({"global", "team", "whisper"}),
    }),
    rateLimit = 3, -- 3 messages per second
})

remoteHandler:register("MoveRequest", {
    validator = validateObject({
        targetPosition = validateVector3(10000),
        timestamp = validateNumber(0, math.huge),
    }),
    rateLimit = 60, -- 60 move requests per second
})

-- Handle incoming remote event
local RemoteEvent = ReplicatedStorage.Events.GameAction

RemoteEvent.OnServerEvent:Connect(function(player: Player, eventName: string, data: any)
    local success, sanitizedData = remoteHandler:handleRequest(player, eventName, data)

    if not success then
        -- Optionally notify client of failure
        return
    end

    -- Process with sanitized data
    processGameAction(player, eventName, sanitizedData)
end)
```

---

## Rate Limiting Implementation

### Tiered Rate Limiting

```lua
--!strict

type RateLimitTier = {
    requestsPerSecond: number,
    requestsPerMinute: number,
    burstAllowance: number,
}

type TieredRateLimiter = {
    tiers: {[string]: RateLimitTier},
    playerTiers: {[Player]: string},
    secondCounts: {[Player]: {[string]: number}},
    minuteCounts: {[Player]: {[string]: number}},
    lastSecond: {[Player]: number},
    lastMinute: {[Player]: number},
    burstTokens: {[Player]: {[string]: number}},

    setPlayerTier: (self: TieredRateLimiter, player: Player, tier: string) -> (),
    checkLimit: (self: TieredRateLimiter, player: Player, action: string) -> (boolean, number?),
    recordRequest: (self: TieredRateLimiter, player: Player, action: string) -> (),
    getRemainingRequests: (self: TieredRateLimiter, player: Player, action: string) -> number,
}

local function createTieredRateLimiter(tiers: {[string]: RateLimitTier}): TieredRateLimiter
    return {
        tiers = tiers,
        playerTiers = {},
        secondCounts = {},
        minuteCounts = {},
        lastSecond = {},
        lastMinute = {},
        burstTokens = {},

        setPlayerTier = function(self, player, tier)
            if not self.tiers[tier] then
                warn(`Unknown tier: {tier}`)
                return
            end
            self.playerTiers[player] = tier
        end,

        checkLimit = function(self, player, action)
            local tierName = self.playerTiers[player] or "default"
            local tier = self.tiers[tierName]

            if not tier then
                return false, 0
            end

            local now = os.clock()
            local currentSecond = math.floor(now)
            local currentMinute = math.floor(now / 60)

            -- Reset counters if time window changed
            if self.lastSecond[player] ~= currentSecond then
                self.secondCounts[player] = {}
                self.lastSecond[player] = currentSecond

                -- Regenerate burst tokens
                if not self.burstTokens[player] then
                    self.burstTokens[player] = {}
                end
                local currentBurst = self.burstTokens[player][action] or tier.burstAllowance
                self.burstTokens[player][action] = math.min(currentBurst + 1, tier.burstAllowance)
            end

            if self.lastMinute[player] ~= currentMinute then
                self.minuteCounts[player] = {}
                self.lastMinute[player] = currentMinute
            end

            -- Check second limit
            local secondCount = (self.secondCounts[player] or {})[action] or 0
            local burstTokens = (self.burstTokens[player] or {})[action] or tier.burstAllowance

            if secondCount >= tier.requestsPerSecond and burstTokens <= 0 then
                local retryAfter = 1 - (now % 1)
                return false, retryAfter
            end

            -- Check minute limit
            local minuteCount = (self.minuteCounts[player] or {})[action] or 0
            if minuteCount >= tier.requestsPerMinute then
                local retryAfter = 60 - (now % 60)
                return false, retryAfter
            end

            return true, nil
        end,

        recordRequest = function(self, player, action)
            if not self.secondCounts[player] then
                self.secondCounts[player] = {}
            end
            if not self.minuteCounts[player] then
                self.minuteCounts[player] = {}
            end
            if not self.burstTokens[player] then
                self.burstTokens[player] = {}
            end

            local tierName = self.playerTiers[player] or "default"
            local tier = self.tiers[tierName]

            local secondCount = self.secondCounts[player][action] or 0
            self.secondCounts[player][action] = secondCount + 1

            local minuteCount = self.minuteCounts[player][action] or 0
            self.minuteCounts[player][action] = minuteCount + 1

            -- Use burst token if over second limit
            if tier and secondCount >= tier.requestsPerSecond then
                local burstTokens = self.burstTokens[player][action] or tier.burstAllowance
                self.burstTokens[player][action] = math.max(0, burstTokens - 1)
            end
        end,

        getRemainingRequests = function(self, player, action)
            local tierName = self.playerTiers[player] or "default"
            local tier = self.tiers[tierName]

            if not tier then return 0 end

            local secondCount = (self.secondCounts[player] or {})[action] or 0
            return math.max(0, tier.requestsPerSecond - secondCount)
        end,
    }
end

-- Usage
local rateLimiter = createTieredRateLimiter({
    default = {
        requestsPerSecond = 10,
        requestsPerMinute = 300,
        burstAllowance = 5,
    },
    premium = {
        requestsPerSecond = 20,
        requestsPerMinute = 600,
        burstAllowance = 10,
    },
    admin = {
        requestsPerSecond = 100,
        requestsPerMinute = 3000,
        burstAllowance = 50,
    },
})
```

### Adaptive Rate Limiting

```lua
--!strict

type AdaptiveRateLimiter = {
    baseLimit: number,
    currentMultiplier: {[Player]: number},
    violationCounts: {[Player]: number},
    lastViolation: {[Player]: number},

    checkAndRecord: (self: AdaptiveRateLimiter, player: Player) -> boolean,
    recordViolation: (self: AdaptiveRateLimiter, player: Player) -> (),
    getEffectiveLimit: (self: AdaptiveRateLimiter, player: Player) -> number,
    resetPlayer: (self: AdaptiveRateLimiter, player: Player) -> (),
}

local function createAdaptiveRateLimiter(baseLimit: number): AdaptiveRateLimiter
    local requestCounts: {[Player]: {number}} = {}

    return {
        baseLimit = baseLimit,
        currentMultiplier = {},
        violationCounts = {},
        lastViolation = {},

        checkAndRecord = function(self, player)
            local now = os.clock()

            -- Initialize if needed
            if not requestCounts[player] then
                requestCounts[player] = {}
            end

            -- Clean old requests (1 second window)
            local validRequests: {number} = {}
            for _, ts in ipairs(requestCounts[player]) do
                if now - ts < 1 then
                    table.insert(validRequests, ts)
                end
            end
            requestCounts[player] = validRequests

            -- Check limit
            local effectiveLimit = self:getEffectiveLimit(player)
            if #validRequests >= effectiveLimit then
                self:recordViolation(player)
                return false
            end

            -- Record request
            table.insert(requestCounts[player], now)

            -- Gradually restore multiplier
            local lastViol = self.lastViolation[player]
            if lastViol and now - lastViol > 30 then
                local mult = self.currentMultiplier[player] or 1
                self.currentMultiplier[player] = math.min(1, mult + 0.1)
            end

            return true
        end,

        recordViolation = function(self, player)
            local count = (self.violationCounts[player] or 0) + 1
            self.violationCounts[player] = count
            self.lastViolation[player] = os.clock()

            -- Reduce rate limit for repeat offenders
            local mult = self.currentMultiplier[player] or 1
            self.currentMultiplier[player] = math.max(0.1, mult * 0.8)

            -- Take action for excessive violations
            if count >= 10 then
                -- Could kick player or take other action
                warn(`[Security] Excessive rate limit violations from {player.Name}`)
            end
        end,

        getEffectiveLimit = function(self, player)
            local mult = self.currentMultiplier[player] or 1
            return math.floor(self.baseLimit * mult)
        end,

        resetPlayer = function(self, player)
            self.currentMultiplier[player] = 1
            self.violationCounts[player] = 0
            self.lastViolation[player] = nil
            requestCounts[player] = nil
        end,
    }
end
```

---

## Anti-Exploit Detection

### Anomaly Detection System

```lua
--!strict

type PlayerMetrics = {
    actionCounts: {[string]: number},
    averageResponseTime: number,
    positionDeltas: {number},
    damageDealt: number,
    damageTaken: number,
    resourcesGained: number,
}

type AnomalyDetector = {
    playerMetrics: {[Player]: PlayerMetrics},
    thresholds: {[string]: number},

    recordAction: (self: AnomalyDetector, player: Player, action: string, value: number?) -> (),
    checkAnomalies: (self: AnomalyDetector, player: Player) -> {string}?,
    getAnomalyScore: (self: AnomalyDetector, player: Player) -> number,
    reset: (self: AnomalyDetector, player: Player) -> (),
}

local function createAnomalyDetector(): AnomalyDetector
    return {
        playerMetrics = {},
        thresholds = {
            maxActionsPerMinute = 1000,
            maxDamageRatio = 10, -- damage dealt vs taken
            maxResourceRate = 1000, -- resources per minute
            maxSpeedDeviation = 2, -- times average
        },

        recordAction = function(self, player, action, value)
            if not self.playerMetrics[player] then
                self.playerMetrics[player] = {
                    actionCounts = {},
                    averageResponseTime = 0,
                    positionDeltas = {},
                    damageDealt = 0,
                    damageTaken = 0,
                    resourcesGained = 0,
                }
            end

            local metrics = self.playerMetrics[player]
            metrics.actionCounts[action] = (metrics.actionCounts[action] or 0) + 1

            if action == "damage_dealt" and value then
                metrics.damageDealt += value
            elseif action == "damage_taken" and value then
                metrics.damageTaken += value
            elseif action == "resource_gain" and value then
                metrics.resourcesGained += value
            elseif action == "position_delta" and value then
                table.insert(metrics.positionDeltas, value)
                if #metrics.positionDeltas > 100 then
                    table.remove(metrics.positionDeltas, 1)
                end
            end
        end,

        checkAnomalies = function(self, player)
            local metrics = self.playerMetrics[player]
            if not metrics then return nil end

            local anomalies: {string} = {}

            -- Check action rate
            local totalActions = 0
            for _, count in pairs(metrics.actionCounts) do
                totalActions += count
            end
            if totalActions > self.thresholds.maxActionsPerMinute then
                table.insert(anomalies, "Excessive action rate")
            end

            -- Check damage ratio
            if metrics.damageTaken > 0 then
                local ratio = metrics.damageDealt / metrics.damageTaken
                if ratio > self.thresholds.maxDamageRatio then
                    table.insert(anomalies, "Abnormal damage ratio")
                end
            elseif metrics.damageDealt > 100 then
                table.insert(anomalies, "No damage taken while dealing damage")
            end

            -- Check resource rate
            if metrics.resourcesGained > self.thresholds.maxResourceRate then
                table.insert(anomalies, "Excessive resource gain")
            end

            -- Check movement patterns
            if #metrics.positionDeltas >= 10 then
                local sum = 0
                for _, delta in ipairs(metrics.positionDeltas) do
                    sum += delta
                end
                local avg = sum / #metrics.positionDeltas

                local variance = 0
                for _, delta in ipairs(metrics.positionDeltas) do
                    variance += (delta - avg) ^ 2
                end
                variance = variance / #metrics.positionDeltas

                -- Very low variance suggests automation
                if variance < 0.01 and avg > 0 then
                    table.insert(anomalies, "Suspicious movement pattern")
                end
            end

            return #anomalies > 0 and anomalies or nil
        end,

        getAnomalyScore = function(self, player)
            local anomalies = self:checkAnomalies(player)
            return anomalies and #anomalies or 0
        end,

        reset = function(self, player)
            self.playerMetrics[player] = nil
        end,
    }
end
```

### Behavioral Analysis

```lua
--!strict

type BehaviorPattern = {
    inputIntervals: {number},
    actionSequences: {string},
    responseVariance: number,
}

type BehaviorAnalyzer = {
    patterns: {[Player]: BehaviorPattern},
    suspicionScores: {[Player]: number},

    recordInput: (self: BehaviorAnalyzer, player: Player, inputType: string) -> (),
    analyzePattern: (self: BehaviorAnalyzer, player: Player) -> number,
    isLikelyBot: (self: BehaviorAnalyzer, player: Player) -> boolean,
}

local function createBehaviorAnalyzer(): BehaviorAnalyzer
    local lastInputTime: {[Player]: number} = {}

    return {
        patterns = {},
        suspicionScores = {},

        recordInput = function(self, player, inputType)
            if not self.patterns[player] then
                self.patterns[player] = {
                    inputIntervals = {},
                    actionSequences = {},
                    responseVariance = 0,
                }
            end

            local pattern = self.patterns[player]
            local now = os.clock()
            local lastTime = lastInputTime[player]

            if lastTime then
                local interval = now - lastTime
                table.insert(pattern.inputIntervals, interval)

                if #pattern.inputIntervals > 50 then
                    table.remove(pattern.inputIntervals, 1)
                end
            end

            lastInputTime[player] = now

            table.insert(pattern.actionSequences, inputType)
            if #pattern.actionSequences > 100 then
                table.remove(pattern.actionSequences, 1)
            end
        end,

        analyzePattern = function(self, player)
            local pattern = self.patterns[player]
            if not pattern or #pattern.inputIntervals < 20 then
                return 0 -- Not enough data
            end

            local score = 0

            -- Analyze input intervals
            local intervals = pattern.inputIntervals
            local sum = 0
            for _, interval in ipairs(intervals) do
                sum += interval
            end
            local avgInterval = sum / #intervals

            local variance = 0
            for _, interval in ipairs(intervals) do
                variance += (interval - avgInterval) ^ 2
            end
            variance = variance / #intervals

            -- Very consistent timing is suspicious
            if variance < 0.001 then
                score += 30
            elseif variance < 0.01 then
                score += 15
            end

            -- Check for repeating action sequences
            local sequences = pattern.actionSequences
            local repeatCount = 0

            for i = 1, #sequences - 10 do
                local subseq = table.concat(sequences, "", i, i + 4)
                for j = i + 5, #sequences - 4 do
                    local compare = table.concat(sequences, "", j, j + 4)
                    if subseq == compare then
                        repeatCount += 1
                    end
                end
            end

            if repeatCount > 10 then
                score += 20
            end

            self.suspicionScores[player] = score
            return score
        end,

        isLikelyBot = function(self, player)
            local score = self:analyzePattern(player)
            return score > 40
        end,
    }
end
```

---

## Secure Remote Communication

### Encrypted Data Protocol

```lua
--!strict

-- Simple obfuscation for remote data (not true encryption, but adds a layer)
-- True encryption would require more complex implementation

type SecureProtocol = {
    sessionKeys: {[Player]: number},
    messageCounters: {[Player]: number},

    initSession: (self: SecureProtocol, player: Player) -> number,
    encodeMessage: (self: SecureProtocol, player: Player, data: {[string]: any}) -> {[string]: any}?,
    decodeMessage: (self: SecureProtocol, player: Player, encoded: {[string]: any}) -> {[string]: any}?,
    validateMessage: (self: SecureProtocol, player: Player, encoded: {[string]: any}) -> boolean,
}

local function createSecureProtocol(): SecureProtocol
    return {
        sessionKeys = {},
        messageCounters = {},

        initSession = function(self, player)
            -- Generate session-specific key
            local key = math.random(100000, 999999)
            self.sessionKeys[player] = key
            self.messageCounters[player] = 0
            return key
        end,

        encodeMessage = function(self, player, data)
            local key = self.sessionKeys[player]
            if not key then return nil end

            local counter = self.messageCounters[player] + 1
            self.messageCounters[player] = counter

            -- Create checksum
            local checksum = 0
            for k, v in pairs(data) do
                checksum += #tostring(k) + #tostring(v)
            end
            checksum = (checksum * key + counter) % 1000000

            return {
                d = data,
                c = counter,
                h = checksum,
            }
        end,

        decodeMessage = function(self, player, encoded)
            if not self:validateMessage(player, encoded) then
                return nil
            end
            return encoded.d
        end,

        validateMessage = function(self, player, encoded)
            local key = self.sessionKeys[player]
            if not key then return false end

            local data = encoded.d
            local counter = encoded.c
            local receivedChecksum = encoded.h

            if type(data) ~= "table" or type(counter) ~= "number" then
                return false
            end

            -- Verify counter is sequential (prevent replay attacks)
            local expectedCounter = self.messageCounters[player] + 1
            if counter ~= expectedCounter then
                -- Could be packet loss or replay attack
                if counter <= self.messageCounters[player] then
                    warn(`[Security] Possible replay attack from {player.Name}`)
                    return false
                end
            end

            -- Verify checksum
            local checksum = 0
            for k, v in pairs(data) do
                checksum += #tostring(k) + #tostring(v)
            end
            checksum = (checksum * key + counter) % 1000000

            if checksum ~= receivedChecksum then
                warn(`[Security] Checksum mismatch from {player.Name}`)
                return false
            end

            self.messageCounters[player] = counter
            return true
        end,
    }
end

-- Usage
local secureProtocol = createSecureProtocol()

-- On player join, send them their session key
Players.PlayerAdded:Connect(function(player)
    local sessionKey = secureProtocol:initSession(player)
    -- Send key to client via secure channel (e.g., initial handshake)
end)

-- Handle incoming messages
RemoteEvent.OnServerEvent:Connect(function(player, encodedData)
    local data = secureProtocol:decodeMessage(player, encodedData)
    if not data then
        warn(`[Security] Invalid message from {player.Name}`)
        return
    end

    -- Process validated data
    processAction(player, data)
end)
```

### Request Signing

```lua
--!strict

type RequestSigner = {
    secrets: {[Player]: string},
    timestamps: {[Player]: number},

    generateSecret: (self: RequestSigner, player: Player) -> string,
    signRequest: (self: RequestSigner, player: Player, action: string, data: any) -> string,
    verifySignature: (self: RequestSigner, player: Player, action: string, data: any, signature: string, timestamp: number) -> boolean,
}

local function createRequestSigner(): RequestSigner
    local function simpleHash(input: string): string
        local hash = 0
        for i = 1, #input do
            local char = string.byte(input, i)
            hash = ((hash * 31) + char) % 2147483647
        end
        return tostring(hash)
    end

    return {
        secrets = {},
        timestamps = {},

        generateSecret = function(self, player)
            local secret = `{player.UserId}-{os.clock()}-{math.random(1000000)}`
            self.secrets[player] = simpleHash(secret)
            return self.secrets[player]
        end,

        signRequest = function(self, player, action, data)
            local secret = self.secrets[player]
            if not secret then return "" end

            local payload = `{action}:{tostring(data)}:{secret}`
            return simpleHash(payload)
        end,

        verifySignature = function(self, player, action, data, signature, timestamp)
            local secret = self.secrets[player]
            if not secret then return false end

            -- Check timestamp freshness (5 second window)
            local now = os.clock()
            if math.abs(now - timestamp) > 5 then
                return false
            end

            local expectedSignature = self:signRequest(player, action, data)
            return signature == expectedSignature
        end,
    }
end
```

---

## Data Integrity Verification

### Inventory Validation

```lua
--!strict

type InventoryItem = {
    id: string,
    quantity: number,
    acquiredAt: number,
    source: string,
}

type InventoryValidator = {
    validSources: {[string]: boolean},
    maxQuantities: {[string]: number},
    acquisitionRates: {[string]: number}, -- max items per hour

    playerAcquisitions: {[Player]: {[string]: {number}}},

    validateItem: (self: InventoryValidator, item: InventoryItem) -> (boolean, string?),
    validateInventory: (self: InventoryValidator, player: Player, inventory: {InventoryItem}) -> (boolean, {string}?),
    recordAcquisition: (self: InventoryValidator, player: Player, itemId: string) -> (),
    checkAcquisitionRate: (self: InventoryValidator, player: Player, itemId: string) -> boolean,
}

local function createInventoryValidator(): InventoryValidator
    return {
        validSources = {
            purchase = true,
            drop = true,
            quest = true,
            trade = true,
            admin = true,
        },
        maxQuantities = {
            common_item = 9999,
            rare_item = 100,
            legendary_item = 10,
            currency = 1000000,
        },
        acquisitionRates = {
            common_item = 100,
            rare_item = 10,
            legendary_item = 1,
            currency = 10000,
        },
        playerAcquisitions = {},

        validateItem = function(self, item)
            -- Check source validity
            if not self.validSources[item.source] then
                return false, `Invalid source: {item.source}`
            end

            -- Check quantity
            if item.quantity < 0 then
                return false, "Negative quantity"
            end

            -- Get item category for max quantity check
            local category = getItemCategory(item.id)
            local maxQty = self.maxQuantities[category]
            if maxQty and item.quantity > maxQty then
                return false, `Exceeds max quantity for {category}`
            end

            -- Check acquisition timestamp
            if item.acquiredAt > os.time() then
                return false, "Future acquisition timestamp"
            end

            return true, nil
        end,

        validateInventory = function(self, player, inventory)
            local errors: {string} = {}
            local itemCounts: {[string]: number} = {}

            for _, item in ipairs(inventory) do
                local valid, err = self:validateItem(item)
                if not valid then
                    table.insert(errors, `Item {item.id}: {err}`)
                end

                -- Track total quantities
                itemCounts[item.id] = (itemCounts[item.id] or 0) + item.quantity
            end

            -- Check for duplicates that exceed limits
            for itemId, totalQty in pairs(itemCounts) do
                local category = getItemCategory(itemId)
                local maxQty = self.maxQuantities[category]
                if maxQty and totalQty > maxQty then
                    table.insert(errors, `Total {itemId} ({totalQty}) exceeds max ({maxQty})`)
                end
            end

            return #errors == 0, #errors > 0 and errors or nil
        end,

        recordAcquisition = function(self, player, itemId)
            if not self.playerAcquisitions[player] then
                self.playerAcquisitions[player] = {}
            end
            if not self.playerAcquisitions[player][itemId] then
                self.playerAcquisitions[player][itemId] = {}
            end

            table.insert(self.playerAcquisitions[player][itemId], os.time())
        end,

        checkAcquisitionRate = function(self, player, itemId)
            local acquisitions = self.playerAcquisitions[player]
            if not acquisitions or not acquisitions[itemId] then
                return true
            end

            local oneHourAgo = os.time() - 3600
            local recentCount = 0

            for _, timestamp in ipairs(acquisitions[itemId]) do
                if timestamp > oneHourAgo then
                    recentCount += 1
                end
            end

            local category = getItemCategory(itemId)
            local maxRate = self.acquisitionRates[category]

            return not maxRate or recentCount < maxRate
        end,
    }
end

-- Helper function
local function getItemCategory(itemId: string): string
    -- Would look up item category from item database
    if itemId:match("^legendary_") then
        return "legendary_item"
    elseif itemId:match("^rare_") then
        return "rare_item"
    elseif itemId == "coins" or itemId == "gems" then
        return "currency"
    else
        return "common_item"
    end
end
```

---

## Common Exploit Vectors

### Exploit Vector Reference

| Exploit Type | Description | Prevention |
|--------------|-------------|------------|
| RemoteEvent Spam | Flooding server with requests | Rate limiting |
| Invalid Data Types | Sending wrong types to remotes | Type validation |
| Negative Values | Buying items with negative currency | Range validation |
| Speed Hacking | Moving faster than allowed | Server-side movement validation |
| Teleportation | Instant position changes | Position delta checks |
| Damage Hacking | Dealing impossible damage | Server calculates all damage |
| Inventory Manipulation | Duplicating or spawning items | Server-authoritative inventory |
| Time Manipulation | Exploiting time-based features | Server timestamps |
| Replay Attacks | Re-sending valid packets | Message counters/nonces |
| Object Manipulation | Modifying game objects | Server validates all changes |

### Exploit Detection Patterns

```lua
--!strict

type ExploitDetector = {
    detectors: {[string]: (Player, any) -> boolean},
    violationCounts: {[Player]: {[string]: number}},

    registerDetector: (self: ExploitDetector, name: string, detector: (Player, any) -> boolean) -> (),
    check: (self: ExploitDetector, player: Player, exploitType: string, data: any) -> boolean,
    getViolationCount: (self: ExploitDetector, player: Player, exploitType: string?) -> number,
    handleViolation: (self: ExploitDetector, player: Player, exploitType: string) -> (),
}

local function createExploitDetector(): ExploitDetector
    local detector: ExploitDetector = {
        detectors = {},
        violationCounts = {},

        registerDetector = function(self, name, detectorFn)
            self.detectors[name] = detectorFn
        end,

        check = function(self, player, exploitType, data)
            local detectorFn = self.detectors[exploitType]
            if not detectorFn then return false end

            local isExploit = detectorFn(player, data)

            if isExploit then
                self:handleViolation(player, exploitType)
            end

            return isExploit
        end,

        getViolationCount = function(self, player, exploitType)
            local counts = self.violationCounts[player]
            if not counts then return 0 end

            if exploitType then
                return counts[exploitType] or 0
            end

            local total = 0
            for _, count in pairs(counts) do
                total += count
            end
            return total
        end,

        handleViolation = function(self, player, exploitType)
            if not self.violationCounts[player] then
                self.violationCounts[player] = {}
            end

            local count = (self.violationCounts[player][exploitType] or 0) + 1
            self.violationCounts[player][exploitType] = count

            -- Log violation
            warn(`[Exploit] {player.Name} - {exploitType} (#{count})`)

            -- Take action based on severity
            local totalViolations = self:getViolationCount(player)

            if totalViolations >= 50 then
                player:Kick("Suspicious activity detected")
            elseif totalViolations >= 20 then
                -- Restrict player actions
                restrictPlayer(player)
            elseif totalViolations >= 5 then
                -- Warn player
                warnPlayer(player)
            end
        end,
    }

    -- Register common detectors
    detector:registerDetector("speed_hack", function(player, data)
        local speed = data.speed :: number?
        return speed ~= nil and speed > 100 -- Max allowed speed
    end)

    detector:registerDetector("teleport", function(player, data)
        local distance = data.distance :: number?
        local time = data.time :: number?
        if not distance or not time then return false end
        return distance > 50 and time < 0.1 -- 50 studs in 0.1 seconds
    end)

    detector:registerDetector("damage_hack", function(player, data)
        local damage = data.damage :: number?
        local maxPossible = data.maxPossible :: number?
        if not damage or not maxPossible then return false end
        return damage > maxPossible * 1.1 -- 10% tolerance
    end)

    return detector
end
```

---

## Security Audit Checklist

### Pre-Release Security Audit

```lua
--!strict

type AuditResult = {
    category: string,
    item: string,
    status: "pass" | "fail" | "warning",
    details: string?,
}

type SecurityAuditor = {
    results: {AuditResult},

    auditRemotes: (self: SecurityAuditor) -> (),
    auditDataStores: (self: SecurityAuditor) -> (),
    auditServerScripts: (self: SecurityAuditor) -> (),
    auditClientScripts: (self: SecurityAuditor) -> (),
    generateReport: (self: SecurityAuditor) -> string,
}

local function createSecurityAuditor(): SecurityAuditor
    return {
        results = {},

        auditRemotes = function(self)
            local ReplicatedStorage = game:GetService("ReplicatedStorage")

            -- Check all RemoteEvents
            for _, remote in ipairs(ReplicatedStorage:GetDescendants()) do
                if remote:IsA("RemoteEvent") or remote:IsA("RemoteFunction") then
                    -- Check if remote has server-side handler
                    local hasHandler = checkRemoteHasHandler(remote)

                    table.insert(self.results, {
                        category = "Remotes",
                        item = remote:GetFullName(),
                        status = hasHandler and "pass" or "warning",
                        details = not hasHandler and "No handler found - may be vulnerable" or nil,
                    })
                end
            end
        end,

        auditDataStores = function(self)
            -- Check DataStore usage patterns
            -- This would be a static analysis in practice

            table.insert(self.results, {
                category = "DataStores",
                item = "DataStore Validation",
                status = "warning",
                details = "Manually verify all DataStore writes are validated",
            })
        end,

        auditServerScripts = function(self)
            local ServerScriptService = game:GetService("ServerScriptService")

            for _, script in ipairs(ServerScriptService:GetDescendants()) do
                if script:IsA("Script") then
                    -- Basic checks (would need more sophisticated analysis)
                    table.insert(self.results, {
                        category = "Server Scripts",
                        item = script:GetFullName(),
                        status = "pass",
                        details = "Exists in ServerScriptService",
                    })
                end
            end
        end,

        auditClientScripts = function(self)
            -- Check for sensitive logic in client scripts
            local StarterPlayerScripts = game:GetService("StarterPlayer"):FindFirstChild("StarterPlayerScripts")

            if StarterPlayerScripts then
                for _, script in ipairs(StarterPlayerScripts:GetDescendants()) do
                    if script:IsA("LocalScript") then
                        table.insert(self.results, {
                            category = "Client Scripts",
                            item = script:GetFullName(),
                            status = "warning",
                            details = "Verify no sensitive logic in client script",
                        })
                    end
                end
            end
        end,

        generateReport = function(self)
            local lines: {string} = {
                "=== SECURITY AUDIT REPORT ===",
                `Generated: {os.date()}`,
                "",
            }

            local categories: {[string]: {AuditResult}} = {}
            for _, result in ipairs(self.results) do
                if not categories[result.category] then
                    categories[result.category] = {}
                end
                table.insert(categories[result.category], result)
            end

            local passCount, failCount, warnCount = 0, 0, 0

            for category, items in pairs(categories) do
                table.insert(lines, `[{category}]`)

                for _, result in ipairs(items) do
                    local icon = result.status == "pass" and "[OK]"
                        or result.status == "fail" and "[FAIL]"
                        or "[WARN]"

                    table.insert(lines, `  {icon} {result.item}`)
                    if result.details then
                        table.insert(lines, `       -> {result.details}`)
                    end

                    if result.status == "pass" then passCount += 1
                    elseif result.status == "fail" then failCount += 1
                    else warnCount += 1 end
                end

                table.insert(lines, "")
            end

            table.insert(lines, "=== SUMMARY ===")
            table.insert(lines, `Passed: {passCount}`)
            table.insert(lines, `Failed: {failCount}`)
            table.insert(lines, `Warnings: {warnCount}`)

            return table.concat(lines, "\n")
        end,
    }
end
```

### Security Checklist

| Category | Item | Priority | Verified |
|----------|------|----------|----------|
| **Server Authority** | All game logic on server | Critical | [ ] |
| **Server Authority** | Client cannot modify game state | Critical | [ ] |
| **Server Authority** | Server validates all actions | Critical | [ ] |
| **Input Validation** | All remote inputs validated | Critical | [ ] |
| **Input Validation** | Type checking on all data | High | [ ] |
| **Input Validation** | Range validation on numbers | High | [ ] |
| **Rate Limiting** | All remotes rate limited | High | [ ] |
| **Rate Limiting** | Adaptive limits for abuse | Medium | [ ] |
| **Anti-Exploit** | Movement validation | High | [ ] |
| **Anti-Exploit** | Damage validation | High | [ ] |
| **Anti-Exploit** | Resource validation | High | [ ] |
| **Data Integrity** | Inventory validation | High | [ ] |
| **Data Integrity** | Transaction logging | Medium | [ ] |
| **Network Security** | No sensitive data to client | Critical | [ ] |
| **Network Security** | Message validation | High | [ ] |
