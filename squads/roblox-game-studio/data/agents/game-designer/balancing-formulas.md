---
title: "Balancing Formulas - Deep Knowledge"
agent: game-designer
alias: Mecha
category: balancing
version: 1.0.0
last_updated: 2025-01-28
tags: [balancing, formulas, economy, progression, math, combat]
---

# Game Balancing Formulas and Systems

This document provides comprehensive formulas, calculations, and systems for balancing Roblox games. These formulas are battle-tested across multiple game genres and can be adapted to your specific needs.

---

## Table of Contents

1. [Combat Formulas](#combat-formulas)
2. [Progression Curves](#progression-curves)
3. [Economy Balancing](#economy-balancing)
4. [Time-To-Kill Calculations](#time-to-kill-calculations)
5. [Level Scaling](#level-scaling)
6. [Drop Rate Systems](#drop-rate-systems)
7. [Matchmaking Rating](#matchmaking-rating)
8. [Spreadsheet Templates](#spreadsheet-templates)

---

## Combat Formulas

### Basic Damage Calculation

The foundation of any combat system.

```lua
-- Simple damage formula
local function calculateDamage(attacker, defender)
    local baseDamage = attacker.Attack
    local defense = defender.Defense

    -- Linear reduction (simple)
    local damage = baseDamage - defense

    -- Ensure minimum damage
    return math.max(damage, 1)
end
```

### Advanced Damage Reduction Formulas

#### Percentage-Based Reduction

```lua
-- Defense reduces damage by percentage
-- Formula: FinalDamage = BaseDamage * (100 / (100 + Defense))
local function calculateDamagePercentage(baseDamage, defense)
    local reduction = 100 / (100 + defense)
    return baseDamage * reduction
end

-- Example values:
-- Defense 0:   100 / 100 = 100% damage taken
-- Defense 50:  100 / 150 = 66.7% damage taken
-- Defense 100: 100 / 200 = 50% damage taken
-- Defense 200: 100 / 300 = 33.3% damage taken
-- Defense 400: 100 / 500 = 20% damage taken
```

#### Armor/Resistance Formula (WoW-style)

```lua
-- Armor reduces damage based on level difference
-- Good for RPGs with level-based combat
local function calculateArmorReduction(armor, attackerLevel, defenderLevel)
    local levelDiff = attackerLevel - defenderLevel
    local armorConstant = 400 + (85 * defenderLevel)

    -- Adjust for level difference
    if levelDiff > 0 then
        armorConstant = armorConstant * (1 - (levelDiff * 0.1))
    end

    local reduction = armor / (armor + armorConstant)
    return math.min(reduction, 0.75) -- Cap at 75% reduction
end
```

### Critical Hit System

```lua
local CritSystem = {}

-- Standard crit calculation
function CritSystem:CalculateCrit(attacker, baseDamage)
    local critChance = attacker.CritChance or 0.05 -- 5% base
    local critMultiplier = attacker.CritDamage or 1.5 -- 150% damage

    local roll = math.random()
    local isCrit = roll < critChance

    if isCrit then
        return baseDamage * critMultiplier, true
    else
        return baseDamage, false
    end
end

-- Diminishing returns on crit chance
function CritSystem:GetEffectiveCritChance(rawCritChance)
    -- Soft cap at 50%, hard cap at 75%
    if rawCritChance <= 0.5 then
        return rawCritChance
    else
        local excess = rawCritChance - 0.5
        local diminished = excess * 0.5 -- 50% efficiency past soft cap
        return math.min(0.5 + diminished, 0.75)
    end
end
```

### Damage Type System

```lua
-- Element/type effectiveness matrix
local DamageTypes = {
    Physical = {},
    Fire = {weak = "Water", strong = "Nature"},
    Water = {weak = "Nature", strong = "Fire"},
    Nature = {weak = "Fire", strong = "Water"},
    Light = {weak = "Dark", strong = "Dark"},
    Dark = {weak = "Light", strong = "Light"}
}

local TYPE_ADVANTAGE = 1.5  -- 50% more damage
local TYPE_DISADVANTAGE = 0.5  -- 50% less damage

function calculateTypedDamage(baseDamage, attackType, defenderType)
    local typeData = DamageTypes[attackType]

    if typeData.strong == defenderType then
        return baseDamage * TYPE_ADVANTAGE, "Super Effective!"
    elseif typeData.weak == defenderType then
        return baseDamage * TYPE_DISADVANTAGE, "Not Very Effective..."
    else
        return baseDamage, nil
    end
end
```

### Complete Combat Formula

```lua
local CombatCalculator = {}

function CombatCalculator:CalculateDamage(attacker, defender, skill)
    -- Base damage from attack stat and skill
    local baseDamage = attacker.Attack * skill.DamageMultiplier

    -- Add flat damage from skill
    baseDamage = baseDamage + (skill.FlatDamage or 0)

    -- Apply attack buffs/debuffs
    baseDamage = baseDamage * self:GetAttackMultiplier(attacker)

    -- Calculate defense reduction
    local defenseValue = defender.Defense * self:GetDefenseMultiplier(defender)
    local afterDefense = baseDamage * (100 / (100 + defenseValue))

    -- Apply type effectiveness
    local afterType, typeMessage = calculateTypedDamage(
        afterDefense,
        skill.DamageType,
        defender.Type
    )

    -- Critical hit check
    local afterCrit, isCrit = CritSystem:CalculateCrit(attacker, afterType)

    -- Apply damage variance (±10%)
    local variance = 0.9 + (math.random() * 0.2)
    local finalDamage = afterCrit * variance

    -- Round and ensure minimum
    finalDamage = math.floor(math.max(finalDamage, 1))

    return {
        damage = finalDamage,
        isCritical = isCrit,
        typeMessage = typeMessage,
        breakdown = {
            base = baseDamage,
            afterDefense = afterDefense,
            afterType = afterType,
            afterCrit = afterCrit,
            variance = variance
        }
    }
end
```

---

## Progression Curves

### Linear Progression

Simple and predictable. Best for casual games.

```lua
-- Linear XP curve
-- XP needed = BaseXP + (Level * Increment)
local function getXPForLevel_Linear(level, baseXP, increment)
    return baseXP + (level * increment)
end

-- Example: Base 100, Increment 50
-- Level 1: 150 XP
-- Level 10: 600 XP
-- Level 50: 2600 XP
-- Level 100: 5100 XP
```

### Exponential Progression

Creates meaningful level differences. Best for RPGs.

```lua
-- Exponential XP curve
-- XP needed = BaseXP * (Multiplier ^ Level)
local function getXPForLevel_Exponential(level, baseXP, multiplier)
    return math.floor(baseXP * (multiplier ^ level))
end

-- Example: Base 100, Multiplier 1.15
-- Level 1: 115 XP
-- Level 10: 405 XP
-- Level 50: 108,366 XP
-- Level 100: 1,174,313,451 XP (too extreme!)
```

### Polynomial Progression (Recommended)

Balanced growth. Best for most games.

```lua
-- Polynomial XP curve
-- XP needed = BaseXP * (Level ^ Exponent)
local function getXPForLevel_Polynomial(level, baseXP, exponent)
    return math.floor(baseXP * (level ^ exponent))
end

-- Example: Base 100, Exponent 2 (quadratic)
-- Level 1: 100 XP
-- Level 10: 10,000 XP
-- Level 50: 250,000 XP
-- Level 100: 1,000,000 XP

-- Example: Base 100, Exponent 2.5
-- Level 1: 100 XP
-- Level 10: 31,623 XP
-- Level 50: 1,767,767 XP
-- Level 100: 10,000,000 XP
```

### S-Curve Progression (Soft Cap)

Fast early, slow middle, faster end. Great for retention.

```lua
-- S-Curve using logistic function
local function getXPForLevel_SCurve(level, maxLevel, totalXP)
    -- Normalized position (0 to 1)
    local x = level / maxLevel

    -- Logistic function parameters
    local steepness = 10
    local midpoint = 0.5

    -- S-curve value
    local sValue = 1 / (1 + math.exp(-steepness * (x - midpoint)))

    -- Scale to total XP
    return math.floor(totalXP * sValue)
end

-- Cumulative XP at each level (for level-up thresholds)
local function getXPThreshold_SCurve(level, maxLevel, totalXP)
    local prevXP = level > 1 and getXPForLevel_SCurve(level - 1, maxLevel, totalXP) or 0
    local currentXP = getXPForLevel_SCurve(level, maxLevel, totalXP)
    return currentXP - prevXP
end
```

### Comparison Chart

```lua
-- Generate comparison data
local function generateProgressionComparison()
    local levels = {1, 5, 10, 25, 50, 75, 100}
    local results = {}

    for _, level in ipairs(levels) do
        results[level] = {
            linear = getXPForLevel_Linear(level, 100, 100),
            exponential = getXPForLevel_Exponential(level, 100, 1.1),
            polynomial = getXPForLevel_Polynomial(level, 100, 2),
            scurve = getXPThreshold_SCurve(level, 100, 1000000)
        }
    end

    return results
end

--[[
Results Table:
Level | Linear  | Exponential | Polynomial | S-Curve
------+---------+-------------+------------+---------
1     | 200     | 110         | 100        | 4
5     | 600     | 161         | 2,500      | 67
10    | 1,100   | 259         | 10,000     | 1,228
25    | 2,600   | 1,083       | 62,500     | 16,435
50    | 5,100   | 11,739      | 250,000    | 50,000
75    | 7,600   | 127,189     | 562,500    | 16,435
100   | 10,100  | 1,378,061   | 1,000,000  | 1,228
]]
```

### Stat Progression Per Level

```lua
local StatProgression = {}

-- Linear stat growth
function StatProgression:LinearGrowth(baseValue, level, growthPerLevel)
    return baseValue + (level * growthPerLevel)
end

-- Percentage-based growth (compounds)
function StatProgression:PercentageGrowth(baseValue, level, growthPercent)
    return baseValue * ((1 + growthPercent) ^ level)
end

-- Stepped growth (increases every N levels)
function StatProgression:SteppedGrowth(baseValue, level, stepSize, stepAmount)
    local steps = math.floor(level / stepSize)
    return baseValue + (steps * stepAmount)
end

-- Complete stat calculator
function StatProgression:CalculateStats(baseStats, level)
    return {
        Health = self:LinearGrowth(baseStats.Health, level, 50),
        Attack = self:PercentageGrowth(baseStats.Attack, level, 0.05),
        Defense = self:SteppedGrowth(baseStats.Defense, level, 5, 10),
        Speed = baseStats.Speed -- Some stats don't scale
    }
end
```

---

## Economy Balancing

### Currency Earn Rates

```lua
local EconomyBalance = {}

-- Calculate hourly earn rate
function EconomyBalance:CalculateHourlyEarnRate(playerLevel, activities)
    local totalPerHour = 0

    for _, activity in ipairs(activities) do
        local reward = activity.baseReward * (1 + (playerLevel * 0.1))
        local completionsPerHour = 60 / activity.averageMinutes
        totalPerHour = totalPerHour + (reward * completionsPerHour)
    end

    return totalPerHour
end

-- Example activities
local gameActivities = {
    {name = "Kill Monster", baseReward = 10, averageMinutes = 0.5},
    {name = "Complete Quest", baseReward = 100, averageMinutes = 10},
    {name = "Win PvP Match", baseReward = 50, averageMinutes = 5},
    {name = "Daily Login", baseReward = 500, averageMinutes = 1440} -- Once per day
}

-- Level 1 player: ~1,300 coins/hour
-- Level 50 player: ~7,800 coins/hour
```

### Item Pricing Formula

```lua
-- Price items based on earn rate and desired time investment
function EconomyBalance:CalculateItemPrice(earnRatePerHour, desiredHours)
    return earnRatePerHour * desiredHours
end

-- Tier-based pricing
local ItemTiers = {
    Common = {minHours = 0.5, maxHours = 2},
    Uncommon = {minHours = 2, maxHours = 8},
    Rare = {minHours = 8, maxHours = 24},
    Epic = {minHours = 24, maxHours = 72},
    Legendary = {minHours = 72, maxHours = 168}, -- 1 week max
}

function EconomyBalance:PriceItemByTier(tier, earnRate, position)
    local tierData = ItemTiers[tier]
    local hours = tierData.minHours +
        ((tierData.maxHours - tierData.minHours) * position)
    return math.floor(earnRate * hours)
end
```

### Currency Sinks

```lua
-- Balance between earning and spending
local CurrencySinks = {}

-- Calculate sink efficiency
function CurrencySinks:CalculateSinkRatio(playerData)
    local totalEarned = playerData.lifetimeEarned
    local totalSpent = playerData.lifetimeSpent

    local sinkRatio = totalSpent / totalEarned

    -- Healthy ratio is 70-90% (players spend most but can save)
    return {
        ratio = sinkRatio,
        health = sinkRatio >= 0.7 and sinkRatio <= 0.9 and "healthy" or
                 sinkRatio < 0.7 and "too much saving" or "too expensive"
    }
end

-- Types of sinks
local SinkTypes = {
    -- Consumables (repeatable)
    Consumables = {
        healthPotions = {cost = 50, consumptionRate = "per combat"},
        teleports = {cost = 100, consumptionRate = "per use"},
        buffs = {cost = 200, consumptionRate = "per hour"}
    },

    -- Upgrades (one-time with scaling)
    Upgrades = {
        weaponEnhance = {baseCost = 100, multiplier = 2.0}, -- Doubles each level
        skillUnlock = {baseCost = 500, increment = 500}, -- +500 each
        inventorySlot = {baseCost = 1000, multiplier = 1.5}
    },

    -- Cosmetics (one-time)
    Cosmetics = {
        -- Priced by rarity and desirability
        skins = {min = 500, max = 10000},
        emotes = {min = 200, max = 2000},
        effects = {min = 1000, max = 5000}
    },

    -- Fees (percentage-based)
    Fees = {
        tradingFee = 0.05, -- 5% of trade value
        auctionFee = 0.10, -- 10% of sale
        repairCost = 0.02 -- 2% of item value per death
    }
}

-- Calculate upgrade cost
function CurrencySinks:GetUpgradeCost(upgradeType, currentLevel)
    local upgrade = SinkTypes.Upgrades[upgradeType]

    if upgrade.multiplier then
        return math.floor(upgrade.baseCost * (upgrade.multiplier ^ currentLevel))
    else
        return upgrade.baseCost + (upgrade.increment * currentLevel)
    end
end
```

### Dual Currency System

```lua
-- Soft currency (earned) vs Hard currency (purchased)
local DualCurrency = {}

DualCurrency.SoftCurrency = {
    name = "Coins",
    earnedBy = {"gameplay", "quests", "daily_rewards"},
    usedFor = {"consumables", "basic_gear", "repairs"}
}

DualCurrency.HardCurrency = {
    name = "Gems",
    earnedBy = {"achievements", "events", "special_quests", "purchase"},
    usedFor = {"cosmetics", "convenience", "premium_gear"}
}

-- Conversion rate (should be one-way or expensive)
function DualCurrency:GetConversionRate()
    -- Gems to Coins only (not reversible)
    return {
        gemsToCoins = 100, -- 1 Gem = 100 Coins
        coinsToGems = nil -- Cannot convert
    }
end

-- Premium pricing example
function DualCurrency:CalculatePremiumPrice(usdValue)
    -- $1 = 100 Gems baseline
    local gems = usdValue * 100

    -- Bonus for larger purchases
    if usdValue >= 99.99 then
        gems = gems * 2.0 -- 100% bonus
    elseif usdValue >= 49.99 then
        gems = gems * 1.6 -- 60% bonus
    elseif usdValue >= 19.99 then
        gems = gems * 1.3 -- 30% bonus
    elseif usdValue >= 9.99 then
        gems = gems * 1.1 -- 10% bonus
    end

    return math.floor(gems)
end
```

---

## Time-To-Kill Calculations

### Basic TTK Formula

```lua
-- Time to kill = Target HP / (DPS)
-- DPS = (Damage * Hits Per Second) * Hit Chance
local function calculateTTK(attacker, defender)
    local damage = calculateDamage(attacker, defender)
    local attackSpeed = attacker.AttackSpeed -- Attacks per second
    local hitChance = attacker.Accuracy - defender.Evasion
    hitChance = math.clamp(hitChance, 0.1, 1.0)

    local dps = damage * attackSpeed * hitChance
    local ttk = defender.Health / dps

    return ttk
end
```

### TTK Balancing Guidelines

```lua
local TTKGuidelines = {
    -- PvE encounters
    PvE = {
        TrashMob = {min = 1, max = 3, average = 2},
        EliteMob = {min = 10, max = 30, average = 20},
        MiniBoss = {min = 60, max = 180, average = 120},
        RaidBoss = {min = 300, max = 600, average = 450}
    },

    -- PvP encounters
    PvP = {
        Arena = {min = 5, max = 15, average = 10},
        OpenWorld = {min = 3, max = 10, average = 6},
        TeamFight = {min = 8, max = 20, average = 12}
    }
}

-- Check if TTK is in acceptable range
function checkTTKBalance(attackerLevel, defenderLevel, gameMode)
    local attacker = createTestCharacter(attackerLevel)
    local defender = createTestCharacter(defenderLevel)

    local ttk = calculateTTK(attacker, defender)
    local guidelines = TTKGuidelines[gameMode]

    local isBalanced = ttk >= guidelines.min and ttk <= guidelines.max
    local deviation = math.abs(ttk - guidelines.average) / guidelines.average

    return {
        ttk = ttk,
        isBalanced = isBalanced,
        deviation = deviation,
        suggestion = not isBalanced and
            (ttk < guidelines.min and "Increase defender HP or reduce attacker damage" or
             "Reduce defender HP or increase attacker damage") or
            "Balanced"
    }
end
```

### TTK Adjustment Formula

```lua
-- Adjust stats to achieve target TTK
local function adjustForTargetTTK(attacker, defender, targetTTK)
    local currentTTK = calculateTTK(attacker, defender)
    local ratio = currentTTK / targetTTK

    -- Options to adjust
    local adjustments = {
        -- Adjust damage (most impactful)
        damage = {
            newValue = attacker.Attack / ratio,
            impact = "high",
            sideEffects = "Affects all damage dealt"
        },

        -- Adjust health (straightforward)
        health = {
            newValue = defender.Health / ratio,
            impact = "high",
            sideEffects = "Affects survivability vs all sources"
        },

        -- Adjust attack speed (less impactful)
        attackSpeed = {
            newValue = attacker.AttackSpeed / ratio,
            impact = "medium",
            sideEffects = "Affects DPS and feel of combat"
        },

        -- Adjust defense (diminishing returns)
        defense = {
            -- More complex calculation for defense
            newValue = calculateRequiredDefense(attacker, defender, targetTTK),
            impact = "medium",
            sideEffects = "Affects damage from all sources"
        }
    }

    return adjustments
end
```

---

## Level Scaling

### Monster Level Scaling

```lua
local MonsterScaling = {}

-- Scale monster to player level
function MonsterScaling:ScaleToPlayer(baseMonster, playerLevel, scalingMode)
    local scaled = table.clone(baseMonster)

    if scalingMode == "linear" then
        -- Simple linear scaling
        local levelDiff = playerLevel - baseMonster.Level
        scaled.Health = baseMonster.Health * (1 + levelDiff * 0.1)
        scaled.Attack = baseMonster.Attack * (1 + levelDiff * 0.08)
        scaled.Defense = baseMonster.Defense * (1 + levelDiff * 0.05)

    elseif scalingMode == "percentage" then
        -- Percentage-based scaling
        local scaleFactor = playerLevel / baseMonster.Level
        scaled.Health = baseMonster.Health * scaleFactor
        scaled.Attack = baseMonster.Attack * (scaleFactor ^ 0.8)
        scaled.Defense = baseMonster.Defense * (scaleFactor ^ 0.6)

    elseif scalingMode == "bracketed" then
        -- Scale within level brackets
        local bracket = math.floor(playerLevel / 10) * 10
        local baseBracket = math.floor(baseMonster.Level / 10) * 10
        local bracketDiff = (bracket - baseBracket) / 10

        scaled.Health = baseMonster.Health * (1.5 ^ bracketDiff)
        scaled.Attack = baseMonster.Attack * (1.3 ^ bracketDiff)
        scaled.Defense = baseMonster.Defense * (1.2 ^ bracketDiff)
    end

    scaled.Level = playerLevel
    return scaled
end

-- Calculate appropriate reward scaling
function MonsterScaling:ScaleReward(baseReward, monsterLevel, playerLevel)
    local levelDiff = playerLevel - monsterLevel

    if levelDiff > 10 then
        -- Player is much higher, reduce reward
        return baseReward * 0.1 -- 10% reward for trivial content
    elseif levelDiff > 5 then
        return baseReward * 0.5
    elseif levelDiff >= -5 then
        return baseReward -- Full reward for appropriate level
    else
        -- Monster is higher level, bonus reward
        return baseReward * (1 + math.abs(levelDiff) * 0.1)
    end
end
```

### Zone Level Scaling

```lua
local ZoneScaling = {}

-- Define zone level ranges
ZoneScaling.Zones = {
    StartingArea = {minLevel = 1, maxLevel = 10, scalingType = "fixed"},
    Forest = {minLevel = 10, maxLevel = 25, scalingType = "ranged"},
    Mountain = {minLevel = 20, maxLevel = 40, scalingType = "ranged"},
    Dungeon = {minLevel = 30, maxLevel = 50, scalingType = "scaled"},
    EndGame = {minLevel = 50, maxLevel = 100, scalingType = "scaled"}
}

-- Get effective zone level for player
function ZoneScaling:GetZoneLevel(zoneName, playerLevel)
    local zone = self.Zones[zoneName]

    if zone.scalingType == "fixed" then
        -- Zone doesn't scale
        return zone.minLevel

    elseif zone.scalingType == "ranged" then
        -- Scale within zone's range
        return math.clamp(playerLevel, zone.minLevel, zone.maxLevel)

    elseif zone.scalingType == "scaled" then
        -- Full scaling to player
        if playerLevel >= zone.minLevel then
            return playerLevel
        else
            return zone.minLevel -- Minimum floor
        end
    end
end
```

---

## Drop Rate Systems

### Basic Drop Rate

```lua
local LootSystem = {}

-- Simple drop roll
function LootSystem:RollDrop(dropTable)
    local roll = math.random()
    local cumulative = 0

    for _, item in ipairs(dropTable) do
        cumulative = cumulative + item.chance
        if roll <= cumulative then
            return item
        end
    end

    return nil -- No drop
end

-- Example drop table
local GoblinDropTable = {
    {name = "Gold", chance = 0.50, min = 10, max = 50},
    {name = "Potion", chance = 0.20},
    {name = "Goblin Ear", chance = 0.15},
    {name = "Rare Dagger", chance = 0.04},
    {name = "Epic Ring", chance = 0.01},
    -- Total: 90% - 10% chance of no drop
}
```

### Weighted Rarity System

```lua
local RarityWeights = {
    Common = 1000,
    Uncommon = 400,
    Rare = 100,
    Epic = 20,
    Legendary = 4,
    Mythic = 1
}

function LootSystem:RollRarity(luckBonus)
    luckBonus = luckBonus or 0

    -- Apply luck (increases rare chances)
    local adjustedWeights = {}
    local totalWeight = 0

    for rarity, weight in pairs(RarityWeights) do
        local adjusted = weight

        -- Luck boosts rarer items more
        if rarity ~= "Common" then
            adjusted = weight * (1 + luckBonus)
        end

        adjustedWeights[rarity] = adjusted
        totalWeight = totalWeight + adjusted
    end

    -- Roll
    local roll = math.random() * totalWeight
    local cumulative = 0

    for rarity, weight in pairs(adjustedWeights) do
        cumulative = cumulative + weight
        if roll <= cumulative then
            return rarity
        end
    end

    return "Common"
end
```

### Pity Timer Implementation

```lua
local PityTimer = {}

-- Track attempts per player per item type
function PityTimer:GetPityChance(player, itemId, baseChance)
    local key = "Pity_" .. itemId
    local attempts = player:GetAttribute(key) or 0

    -- Increase chance by 1% per attempt after threshold
    local threshold = math.floor(1 / baseChance) -- Expected attempts
    local bonusAttempts = math.max(0, attempts - threshold)
    local bonusChance = bonusAttempts * 0.01

    return math.min(baseChance + bonusChance, 1.0)
end

function PityTimer:RecordAttempt(player, itemId, success)
    local key = "Pity_" .. itemId

    if success then
        player:SetAttribute(key, 0) -- Reset on success
    else
        local current = player:GetAttribute(key) or 0
        player:SetAttribute(key, current + 1)
    end
end

-- Guaranteed drop after max attempts
function PityTimer:GetGuaranteedAttempt(baseChance)
    -- Guarantee at 2x expected attempts
    return math.floor(2 / baseChance)
end
```

### Loot Table Generator

```lua
-- Generate balanced loot tables
local LootTableGenerator = {}

function LootTableGenerator:GenerateTable(config)
    local table = {}
    local remainingChance = 1.0

    -- Add items by rarity
    for rarity, items in pairs(config.itemsByRarity) do
        local rarityChance = self:GetRarityChance(rarity, config.dropLevel)
        local chancePerItem = rarityChance / #items

        for _, item in ipairs(items) do
            table.insert(table, {
                name = item.name,
                rarity = rarity,
                chance = chancePerItem,
                minStack = item.minStack or 1,
                maxStack = item.maxStack or 1
            })
            remainingChance = remainingChance - chancePerItem
        end
    end

    -- Remaining chance = nothing
    table.nothingChance = remainingChance

    return table
end

function LootTableGenerator:GetRarityChance(rarity, dropLevel)
    local baseChances = {
        Common = 0.40,
        Uncommon = 0.25,
        Rare = 0.10,
        Epic = 0.04,
        Legendary = 0.01
    }

    -- Higher level content = better drops
    local levelMultiplier = 1 + (dropLevel * 0.01)

    return baseChances[rarity] * levelMultiplier
end
```

---

## Matchmaking Rating

### ELO System

```lua
local ELOSystem = {}

ELOSystem.KFactor = {
    New = 40, -- First 30 games
    Regular = 20, -- Normal play
    Veteran = 10 -- 1000+ games, high rating
}

function ELOSystem:CalculateExpectedScore(ratingA, ratingB)
    return 1 / (1 + 10 ^ ((ratingB - ratingA) / 400))
end

function ELOSystem:UpdateRating(player, opponent, actualScore)
    local expected = self:CalculateExpectedScore(player.Rating, opponent.Rating)
    local kFactor = self:GetKFactor(player)

    local newRating = player.Rating + kFactor * (actualScore - expected)

    return math.max(newRating, 100) -- Minimum rating floor
end

function ELOSystem:GetKFactor(player)
    local games = player.TotalGames or 0
    local rating = player.Rating or 1000

    if games < 30 then
        return self.KFactor.New
    elseif rating > 2000 and games > 1000 then
        return self.KFactor.Veteran
    else
        return self.KFactor.Regular
    end
end

-- Match example
function ELOSystem:ProcessMatch(winner, loser)
    local winnerNew = self:UpdateRating(winner, loser, 1.0)
    local loserNew = self:UpdateRating(loser, winner, 0.0)

    return winnerNew, loserNew
end
```

### Glicko-2 System (More Accurate)

```lua
local Glicko2 = {}

-- Glicko-2 constants
Glicko2.TAU = 0.5 -- System constant (0.3 to 1.2)
Glicko2.EPSILON = 0.000001

function Glicko2:ScaleRating(rating)
    return (rating - 1500) / 173.7178
end

function Glicko2:ScaleRD(rd)
    return rd / 173.7178
end

function Glicko2:CalculateG(phi)
    return 1 / math.sqrt(1 + 3 * phi^2 / math.pi^2)
end

function Glicko2:CalculateE(mu, muJ, phiJ)
    return 1 / (1 + math.exp(-self:CalculateG(phiJ) * (mu - muJ)))
end

function Glicko2:UpdatePlayer(player, opponents, scores)
    -- Convert to Glicko-2 scale
    local mu = self:ScaleRating(player.Rating)
    local phi = self:ScaleRD(player.RD)
    local sigma = player.Volatility

    -- Calculate variance and improvement
    local variance = 0
    local improvement = 0

    for i, opponent in ipairs(opponents) do
        local muJ = self:ScaleRating(opponent.Rating)
        local phiJ = self:ScaleRD(opponent.RD)
        local gPhiJ = self:CalculateG(phiJ)
        local e = self:CalculateE(mu, muJ, phiJ)

        variance = variance + gPhiJ^2 * e * (1 - e)
        improvement = improvement + gPhiJ * (scores[i] - e)
    end

    variance = 1 / variance

    -- Update volatility, RD, and rating
    -- (Simplified - full implementation more complex)
    local phiStar = math.sqrt(phi^2 + sigma^2)
    local newPhi = 1 / math.sqrt(1/phiStar^2 + 1/variance)
    local newMu = mu + newPhi^2 * improvement

    -- Convert back
    return {
        Rating = newMu * 173.7178 + 1500,
        RD = newPhi * 173.7178,
        Volatility = sigma -- Volatility update omitted for brevity
    }
end
```

### Matchmaking Queue

```lua
local MatchmakingQueue = {}

function MatchmakingQueue:FindMatch(player, maxWaitTime)
    local startTime = os.time()
    local ratingRange = 100 -- Start with ±100 rating

    while os.time() - startTime < maxWaitTime do
        -- Expand search range over time
        local waitTime = os.time() - startTime
        ratingRange = 100 + (waitTime * 10) -- +10 rating per second

        -- Search for opponent
        local minRating = player.Rating - ratingRange
        local maxRating = player.Rating + ratingRange

        local opponent = self:FindPlayerInRange(minRating, maxRating, player.Id)

        if opponent then
            -- Check if RD suggests confidence in match
            local quality = self:CalculateMatchQuality(player, opponent)

            if quality > 0.5 or waitTime > maxWaitTime * 0.5 then
                return opponent
            end
        end

        task.wait(1)
    end

    return nil -- No match found
end

function MatchmakingQueue:CalculateMatchQuality(playerA, playerB)
    local ratingDiff = math.abs(playerA.Rating - playerB.Rating)
    local avgRD = (playerA.RD + playerB.RD) / 2

    -- Quality decreases with rating diff and uncertainty
    local quality = 1 - (ratingDiff / 1000) - (avgRD / 500)

    return math.clamp(quality, 0, 1)
end
```

---

## Spreadsheet Templates

### XP/Level Calculator

```
| Level | XP Required | Total XP | Time to Level (hrs) | Cumulative Time |
|-------|-------------|----------|---------------------|-----------------|
| 1     | 100         | 100      | 0.1                 | 0.1             |
| 2     | 200         | 300      | 0.2                 | 0.3             |
| 3     | 400         | 700      | 0.4                 | 0.7             |
| ...   | ...         | ...      | ...                 | ...             |

Formula (Google Sheets/Excel):
- XP Required: =ROUND(100 * POWER(A2, 2))
- Total XP: =B2 + C1
- Time to Level: =B2 / [XP_PER_HOUR]
- Cumulative Time: =D2 + E1
```

### Item Stat Scaling

```
| Level | Weapon DMG | Armor DEF | Accessory Bonus |
|-------|------------|-----------|-----------------|
| 1     | 10         | 5         | 2%              |
| 10    | 25         | 15        | 5%              |
| 25    | 60         | 40        | 10%             |
| 50    | 150        | 100       | 18%             |
| 100   | 400        | 280       | 30%             |

Formulas:
- Weapon DMG: =ROUND(10 * POWER(1.04, A2-1))
- Armor DEF: =ROUND(5 * POWER(1.04, A2-1))
- Accessory: =2% + (A2-1) * 0.3%
```

### Economy Balance Sheet

```
| Source          | Per Instance | Per Hour | % of Income |
|-----------------|--------------|----------|-------------|
| Monster Kills   | 10           | 600      | 40%         |
| Quests          | 100          | 300      | 20%         |
| Dungeons        | 500          | 250      | 17%         |
| Daily Login     | 500          | 21       | 1%          |
| Selling Items   | varies       | 300      | 20%         |
| Events          | varies       | 30       | 2%          |
|-----------------|--------------|----------|-------------|
| TOTAL           | -            | 1501     | 100%        |

| Sink            | Cost         | Per Hour | % of Spending |
|-----------------|--------------|----------|---------------|
| Consumables     | 50           | 400      | 30%           |
| Repairs         | 100          | 100      | 7%            |
| Upgrades        | 1000+        | 300      | 22%           |
| Cosmetics       | 5000+        | 200      | 15%           |
| Trading Fees    | 5%           | 150      | 11%           |
| Gambling/Gacha  | varies       | 200      | 15%           |
|-----------------|--------------|----------|---------------|
| TOTAL           | -            | 1350     | 100%          |

Net Gain: 151/hr (healthy 10% accumulation rate)
```

### TTK Matrix

```
| Attacker Level → | 1    | 10   | 25   | 50   | 100  |
| Defender Level ↓ |      |      |      |      |      |
|------------------|------|------|------|------|------|
| 1                | 3.0s | 0.5s | 0.1s | 0.1s | 0.1s |
| 10               | 15s  | 3.0s | 0.8s | 0.2s | 0.1s |
| 25               | 45s  | 10s  | 3.0s | 0.6s | 0.1s |
| 50               | 120s | 30s  | 8s   | 3.0s | 0.4s |
| 100              | 300s | 90s  | 25s  | 7s   | 3.0s |

Target: 3 seconds for equal level combat
Colors: Green = balanced, Yellow = one-sided, Red = trivial
```

### Drop Rate Calculator

```
| Rarity    | Base % | With Luck +10% | With Luck +50% | Pity Guarantee |
|-----------|--------|----------------|----------------|----------------|
| Common    | 60.0%  | 60.0%          | 60.0%          | Always         |
| Uncommon  | 25.0%  | 27.5%          | 37.5%          | 10 attempts    |
| Rare      | 10.0%  | 11.0%          | 15.0%          | 25 attempts    |
| Epic      | 4.0%   | 4.4%           | 6.0%           | 50 attempts    |
| Legendary | 1.0%   | 1.1%           | 1.5%           | 100 attempts   |
| Mythic    | 0.1%   | 0.11%          | 0.15%          | 200 attempts   |

Expected Attempts for Legendary:
- No luck: 100 attempts average
- +10% luck: 91 attempts average
- +50% luck: 67 attempts average
- With pity: Maximum 100 attempts (guaranteed)
```

---

## Quick Reference Formulas

### Must-Know Formulas

```lua
-- 1. Percentage reduction
damage = baseDamage * (100 / (100 + defense))

-- 2. XP for level (polynomial)
xp = baseXP * (level ^ exponent)

-- 3. Stat per level (linear)
stat = baseStat + (level * growthRate)

-- 4. Drop rate with luck
effectiveRate = baseRate * (1 + luckBonus)

-- 5. ELO expected score
expected = 1 / (1 + 10 ^ ((enemyRating - myRating) / 400))

-- 6. Diminishing returns
effective = raw * (cap / (raw + cap))

-- 7. Cooldown reduction (multiplicative)
actualCD = baseCD * (1 - cdr1) * (1 - cdr2)

-- 8. Price from earn rate
price = earnPerHour * desiredPlayHours

-- 9. TTK calculation
ttk = targetHP / (damagePerHit * hitsPerSecond * accuracy)

-- 10. Compound growth
finalValue = initialValue * ((1 + growthRate) ^ periods)
```

---

*This document is part of the Game Designer (Mecha) knowledge base for the Roblox Game Studio squad.*
