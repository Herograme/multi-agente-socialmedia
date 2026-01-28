---
title: "Economy Balancing for Game Monetization"
agent: monetization-strategist
alias: Coin
category: economy
version: 1.0.0
last_updated: 2025-01-28
tags: [economy, balancing, currency, inflation, virtual-goods, sinks, faucets]
---

# Economy Balancing for Game Monetization

## Introduction

A well-balanced game economy is the foundation of sustainable monetization. Like real-world economies, game economies require careful management of currency creation, consumption, and value. This guide provides comprehensive frameworks for designing, monitoring, and maintaining healthy game economies in Roblox.

---

## 1. Dual Currency Systems

### 1.1 Why Dual Currency?

Most successful F2P games use two currencies:

```
DUAL CURRENCY ARCHITECTURE
══════════════════════════

SOFT CURRENCY (Earned)          HARD CURRENCY (Purchased)
───────────────────────         ─────────────────────────
• Coins, Gold, Credits          • Gems, Diamonds, Robux
• Earned through gameplay       • Primarily purchased
• Used for common purchases     • Used for premium items
• High earning rate             • Low/no earning rate
• Creates engagement loop       • Creates monetization
• Infinite supply possible      • Controlled supply
```

### 1.2 Currency Role Definition

| Aspect | Soft Currency | Hard Currency |
|--------|--------------|---------------|
| **Primary Source** | Gameplay | Real money |
| **Secondary Source** | Daily rewards, events | Rare achievements, rewards |
| **Main Uses** | Upgrades, consumables | Cosmetics, speed-ups, exclusives |
| **Earn Rate** | Medium-high | Very low or none |
| **Psychological Role** | Progress feeling | Premium/VIP feeling |
| **Inflation Risk** | High | Low |

### 1.3 Implementing Dual Currency

```lua
-- Dual currency system structure
local CurrencySystem = {
    soft = {
        name = "Coins",
        icon = "coin_icon",
        color = Color3.fromRGB(255, 215, 0),
        maxStack = 9999999,
        earnMethods = {
            gameplay = true,
            quests = true,
            daily = true,
            achievements = true,
            watching_ads = true
        },
        uses = {
            basic_items = true,
            upgrades = true,
            consumables = true,
            some_cosmetics = true
        }
    },

    hard = {
        name = "Gems",
        icon = "gem_icon",
        color = Color3.fromRGB(147, 112, 219),
        maxStack = 999999,
        earnMethods = {
            purchase = true,           -- Primary
            rare_achievements = true,  -- Secondary (limited)
            special_events = true,     -- Rare
            season_pass = true         -- Bonus
        },
        uses = {
            premium_cosmetics = true,
            exclusive_items = true,
            instant_unlock = true,
            extra_attempts = true,
            vip_features = true
        }
    }
}
```

### 1.4 Currency Interaction Design

```
CURRENCY INTERACTION PATTERNS
═════════════════════════════

Pattern 1: HARD → SOFT CONVERSION (Common)
├─ Allow: Exchanging premium for soft currency
├─ Rate: Generous (1 Gem = 100 Coins)
├─ Purpose: Gives hard currency more utility
└─ Risk: Can devalue hard currency if too generous

Pattern 2: SOFT → HARD CONVERSION (Rare/Limited)
├─ Allow: Very limited or not at all
├─ Rate: Poor if allowed (10,000 Coins = 1 Gem)
├─ Purpose: Sink for soft currency
└─ Risk: Can undermine monetization

Pattern 3: DUAL PRICING (Strategic)
├─ Same item available for both currencies
├─ Soft price: Much higher (reflects time value)
├─ Hard price: Lower (reflects money value)
├─ Example: Sword for 50,000 Coins OR 500 Gems
└─ Purpose: Player choice, respects time investment

Pattern 4: EXCLUSIVE PRICING (Common)
├─ Some items only purchasable with one currency
├─ Premium exclusives: Hard currency only
├─ Gameplay items: Soft currency only
└─ Purpose: Clear value differentiation
```

### 1.5 Dual Currency Best Practices

1. **Don't make soft currency feel worthless** - It should buy meaningful items
2. **Don't make hard currency mandatory** - All content completable without it
3. **Maintain clear visual distinction** - Different icons, colors, sounds
4. **Show both balances prominently** - Easy access to see holdings
5. **Avoid confusing exchange rates** - Simple, memorable ratios

---

## 2. Sink and Faucet Balancing

### 2.1 The Sink/Faucet Model

```
ECONOMY FLOW MODEL
══════════════════

                    FAUCETS (Currency Creation)
                    ════════════════════════════
                    │   Gameplay rewards
                    │   Quest completion
                    │   Daily login
                    │   Achievements
                    │   Events
                    │   Ad watching
                    │   Real money purchase
                    ▼
            ┌───────────────────┐
            │                   │
            │   PLAYER WALLET   │
            │   (Currency Pool) │
            │                   │
            └─────────┬─────────┘
                      │
                      ▼
                    SINKS (Currency Removal)
                    ════════════════════════
                    │   Item purchases
                    │   Upgrades
                    │   Consumables
                    │   Repair costs
                    │   Trading fees
                    │   Gacha/loot boxes
                    │   Premium services
                    ▼
```

### 2.2 Faucet Types and Management

| Faucet Type | Flow Rate | Control Level | Notes |
|-------------|-----------|---------------|-------|
| **Gameplay Loop** | High, continuous | Medium | Core engagement driver |
| **Quests** | Medium, periodic | High | Content-gated |
| **Daily Rewards** | Low, consistent | High | Predictable |
| **Achievements** | Low, one-time | High | Finite resource |
| **Events** | Variable, temporary | High | Monitor closely |
| **Ad Rewards** | Low, limited | High | Usually capped |
| **IAP** | Variable, unlimited | High | Primary revenue |

### 2.3 Sink Types and Effectiveness

```
SINK EFFECTIVENESS ANALYSIS
═══════════════════════════

HIGH-VOLUME SINKS:
├─ Consumables (health, energy, boosters)
│   └─ Pro: Repeatable, necessary
│   └─ Con: Can feel punishing
│
├─ Upgrade costs (scaling)
│   └─ Pro: Natural progression
│   └─ Con: Can create walls
│
├─ Maintenance/repair
│   └─ Pro: Passive drain
│   └─ Con: Player frustration risk

LOW-VOLUME, HIGH-VALUE SINKS:
├─ Cosmetics
│   └─ Pro: Desired purchases
│   └─ Con: One-time only
│
├─ Permanent unlocks
│   └─ Pro: Satisfying
│   └─ Con: Limited supply
│
├─ Trading fees
│   └─ Pro: Per-transaction
│   └─ Con: Can discourage trading
```

### 2.4 Balancing Calculations

```
SINK/FAUCET BALANCE FORMULA
═══════════════════════════

Daily Faucet Rate = Σ (Faucet Sources × Expected Frequency)

Example:
├─ Gameplay: 100 coins/hour × 1 hour = 100
├─ Daily login: 50 coins × 1 = 50
├─ Quests: 200 coins × 0.5 (50% completion) = 100
├─ Events: 300 coins × 0.2 (20% of days) = 60
└─ Total Daily Faucet: 310 coins

Daily Sink Target = Daily Faucet × Drain Ratio

For healthy economy:
├─ Growing players: Drain ratio 0.7-0.8 (accumulating)
├─ Established players: Drain ratio 0.9-1.0 (maintaining)
├─ Veterans: Drain ratio 1.0-1.2 (spending reserves)

If Sink < Faucet consistently → Inflation
If Sink > Faucet consistently → Deflation/frustration
```

### 2.5 Sink/Faucet Implementation

```lua
-- Economy balance tracking
local EconomyManager = {}

function EconomyManager:trackTransaction(player, type, amount, source)
    local data = {
        playerId = player.UserId,
        type = type,  -- "faucet" or "sink"
        amount = amount,
        source = source,
        timestamp = os.time()
    }

    -- Log to analytics
    AnalyticsService:logEconomyEvent(data)

    -- Update running totals
    self:updateDailyTotals(type, amount)
end

function EconomyManager:getDailyBalance()
    local today = os.date("%Y-%m-%d")
    return {
        faucets = self.dailyTotals[today].faucets,
        sinks = self.dailyTotals[today].sinks,
        netFlow = self.dailyTotals[today].faucets - self.dailyTotals[today].sinks,
        ratio = self.dailyTotals[today].sinks / self.dailyTotals[today].faucets
    }
end

function EconomyManager:checkHealthAlerts()
    local balance = self:getDailyBalance()

    if balance.ratio < 0.5 then
        self:alert("INFLATION_RISK", "Sink ratio below 50%")
    elseif balance.ratio > 1.5 then
        self:alert("DEFLATION_RISK", "Sink ratio above 150%")
    end
end
```

---

## 3. Inflation Prevention

### 3.1 Understanding Inflation

```
GAME ECONOMY INFLATION
═════════════════════

Definition: Too much currency chasing too few goods

Symptoms:
├─ Currency stockpiling (nothing to buy)
├─ Price increases needed to drain currency
├─ New content immediately affordable
├─ Currency feels worthless
├─ Monetization declines (why buy currency?)
└─ Player disengagement

Causes:
├─ Faucets > Sinks over time
├─ Bot/exploit abuse
├─ Unintended earning methods
├─ Power creep reducing sink value
├─ Lack of desirable sinks
└─ Poor scaling with progression
```

### 3.2 Inflation Detection

```lua
-- Inflation monitoring system
local InflationMonitor = {}

function InflationMonitor:checkIndicators()
    local indicators = {}

    -- Average player wealth trend
    local wealthTrend = self:calculateWealthTrend(30)  -- 30 days
    indicators.wealthGrowth = wealthTrend.percentChange

    -- Median time to purchase key items
    local purchaseTimes = self:getMedianPurchaseTimes()
    indicators.purchaseTimeReduction = purchaseTimes.trend

    -- Sink utilization rate
    local sinkUsage = self:getSinkUtilization()
    indicators.sinkUtilization = sinkUsage.percentage

    -- Currency stockpiling (gini coefficient)
    local gini = self:calculateGiniCoefficient()
    indicators.wealthConcentration = gini

    -- Hard currency purchase rate
    local hardPurchases = self:getHardCurrencyPurchaseRate()
    indicators.monetizationHealth = hardPurchases.trend

    return self:assessInflationRisk(indicators)
end

function InflationMonitor:assessInflationRisk(indicators)
    local riskScore = 0

    if indicators.wealthGrowth > 10 then riskScore = riskScore + 25 end
    if indicators.purchaseTimeReduction < -20 then riskScore = riskScore + 20 end
    if indicators.sinkUtilization < 60 then riskScore = riskScore + 20 end
    if indicators.wealthConcentration > 0.7 then riskScore = riskScore + 15 end
    if indicators.monetizationHealth < -10 then riskScore = riskScore + 20 end

    return {
        score = riskScore,
        level = riskScore > 60 and "HIGH" or (riskScore > 30 and "MEDIUM" or "LOW"),
        indicators = indicators
    }
end
```

### 3.3 Anti-Inflation Strategies

```
INFLATION COUNTERMEASURES
═════════════════════════

IMMEDIATE (Emergency):
├─ Reduce faucet rates
├─ Introduce flash sales on sinks
├─ Limited-time exclusive items
├─ Temporary earning caps
└─ Fix any exploits immediately

SHORT-TERM:
├─ Add new desirable sinks
├─ Introduce currency conversion sinks
├─ Add cosmetic collections
├─ Implement upgrade tiers
└─ Create exclusive events

LONG-TERM (Structural):
├─ Redesign progression scaling
├─ Implement economic seasons
├─ Add maintenance costs
├─ Create evergreen sinks
├─ Build prestige systems
└─ Regular economy rebalancing
```

### 3.4 Scaling Economy Design

```
ECONOMY SCALING PRINCIPLES
══════════════════════════

EXPONENTIAL COSTS (Recommended):
Level 1→2:   100 coins
Level 2→3:   150 coins  (1.5x)
Level 3→4:   225 coins  (1.5x)
Level 4→5:   337 coins  (1.5x)
...
Level 99→100: ~2.5M coins

Formula: Cost(n) = Base × Multiplier^(n-1)

Benefits:
├─ Natural difficulty curve
├─ Maintains currency value
├─ Creates long-term goals
└─ Rewards dedication

Risks:
├─ Can feel insurmountable
├─ New players intimidated
├─ Must balance with earnings
└─ Requires catch-up mechanics
```

---

## 4. Currency Exchange Rates

### 4.1 Setting Exchange Rates

```
EXCHANGE RATE FUNDAMENTALS
══════════════════════════

Key Relationship:
Real Money → Hard Currency → Soft Currency → Goods/Services

Exchange Rate Chain:
$1.00 → 80 Robux → 1000 Gems → 100,000 Coins → [Items]

Factors in Rate Setting:
├─ Player time value
├─ Competitor rates
├─ Desired price points
├─ Psychological thresholds
└─ Regional considerations
```

### 4.2 Time-Value Calculation

```
TIME-VALUE EXCHANGE MODEL
═════════════════════════

Principle: Hard currency should "buy time"

Average Player:
├─ Earns: 500 coins/hour through gameplay
├─ Plays: 1 hour/day average
├─ Weekly earnings: ~3,500 coins

Hard Currency Value:
├─ 100 Gems costs: ~$1.00 (via Robux)
├─ 100 Gems converts to: 10,000 coins
├─ Time equivalent: ~20 hours of play
├─ Effective hourly "wage": $0.05/hour

This means:
├─ Paying players value time > $0.05/hour
├─ Items should be priced knowing this
└─ Premium items can be 10-50x time cost
```

### 4.3 Exchange Rate Table

| From | To | Rate | Notes |
|------|-----|------|-------|
| $1 USD | Robux | ~80 | Platform-set |
| 100 Robux | Gems (example) | 1000 | Your conversion |
| 1 Gem | Coins | 100 | In-game exchange |
| 100 Robux | Coins (direct) | 100,000 | Optional direct path |

### 4.4 Dynamic Exchange Considerations

```lua
-- Exchange rate management
local ExchangeRates = {
    -- Base rates
    gemToCoins = 100,      -- 1 Gem = 100 Coins
    coinsToGems = 10000,   -- 10000 Coins = 1 Gem (if allowed)

    -- Bulk bonuses (for purchases)
    bulkBonuses = {
        {threshold = 500, bonus = 0.05},   -- 5% bonus
        {threshold = 1000, bonus = 0.10},  -- 10% bonus
        {threshold = 2500, bonus = 0.15},  -- 15% bonus
        {threshold = 5000, bonus = 0.20},  -- 20% bonus
    },

    -- Conversion fee (if soft → hard allowed)
    conversionFee = 0.10  -- 10% fee on exchange
}

function ExchangeRates:calculateExchange(fromCurrency, toCurrency, amount)
    local baseRate = self:getRate(fromCurrency, toCurrency)
    local bonus = self:getBulkBonus(amount)
    local fee = self:getFee(fromCurrency, toCurrency)

    return math.floor(amount * baseRate * (1 + bonus) * (1 - fee))
end
```

---

## 5. Pricing Virtual Goods

### 5.1 Virtual Goods Categories

```
VIRTUAL GOODS TAXONOMY
══════════════════════

FUNCTIONAL GOODS:
├─ Progression items (weapons, armor)
├─ Utility items (tools, vehicles)
├─ Consumables (potions, boosters)
├─ Time-savers (instant complete)
└─ Access passes (areas, features)

COSMETIC GOODS:
├─ Character skins
├─ Accessories (hats, trails)
├─ Emotes and animations
├─ UI customization
├─ Profile elements
└─ Pets and companions

SOCIAL GOODS:
├─ Gifts for others
├─ Group items
├─ Chat features
├─ Status symbols
└─ Naming rights

HYBRID GOODS:
├─ Cosmetics with minor stats
├─ Limited edition functional
├─ Collection sets
└─ Season passes
```

### 5.2 Pricing Methodology

```
COST-PLUS PRICING (NOT Recommended for Virtual)
──────────────────────────────────────────────
Price = Cost + Markup
Problem: Virtual goods have near-zero marginal cost

VALUE-BASED PRICING (Recommended)
─────────────────────────────────
Price = Perceived Value × Willingness to Pay

Factors:
├─ Time value (how long to earn equivalent)
├─ Utility value (what does it enable)
├─ Emotional value (how it makes player feel)
├─ Social value (status, showing off)
├─ Scarcity value (rarity)
└─ Collection value (completionism)
```

### 5.3 Price Anchoring by Category

| Category | Soft Currency Range | Hard Currency Range | Premium Range |
|----------|--------------------|--------------------|---------------|
| Common consumable | 50-200 | 5-20 | N/A |
| Uncommon item | 500-2000 | 50-200 | N/A |
| Rare cosmetic | 2000-10000 | 200-1000 | 100-500 Robux |
| Epic equipment | 10000-50000 | 1000-5000 | 500-1500 Robux |
| Legendary item | N/A | 5000-25000 | 1500-5000 Robux |
| Ultra-rare exclusive | N/A | N/A | 5000+ Robux |

### 5.4 Dynamic Pricing Factors

```lua
-- Virtual goods pricing engine
local PricingEngine = {}

function PricingEngine:calculatePrice(item, context)
    local basePrice = item.basePrice
    local multipliers = {}

    -- Rarity multiplier
    multipliers.rarity = {
        common = 1.0,
        uncommon = 1.5,
        rare = 2.5,
        epic = 5.0,
        legendary = 10.0
    }[item.rarity]

    -- Utility multiplier (for functional items)
    if item.type == "functional" then
        multipliers.utility = 1.0 + (item.statBonus / 100)
    end

    -- Scarcity multiplier (for limited items)
    if item.limited then
        local remainingPercent = item.remaining / item.totalSupply
        multipliers.scarcity = 1.0 + ((1 - remainingPercent) * 0.5)
    end

    -- Time-based multiplier (for seasonal)
    if item.seasonal then
        local daysRemaining = item.expirationDate - os.time() / 86400
        if daysRemaining < 7 then
            multipliers.urgency = 1.0 + ((7 - daysRemaining) / 7 * 0.2)
        end
    end

    -- Calculate final price
    local finalPrice = basePrice
    for _, mult in pairs(multipliers) do
        finalPrice = finalPrice * mult
    end

    return math.floor(finalPrice)
end
```

### 5.5 Price Testing Framework

```
VIRTUAL GOODS PRICE TESTING
═══════════════════════════

Test Structure:
├─ Control: Current price
├─ Variant A: -20% price
├─ Variant B: +20% price
├─ Sample: 5000+ players per variant
└─ Duration: 2 weeks minimum

Metrics:
├─ Unit sales
├─ Revenue
├─ Revenue per user exposed
├─ Price sensitivity elasticity
└─ Downstream effects (play time, retention)

Decision Framework:
├─ If V_A revenue > Control: Consider lowering
├─ If V_B revenue > Control: Consider raising
├─ If Control > both: Price is optimal
└─ Always check for segment differences
```

---

## 6. Economy Simulation Models

### 6.1 Why Simulate?

Economy simulation allows you to:
- Test changes before deployment
- Predict long-term effects
- Identify potential exploits
- Balance new content
- Train intuition about economy dynamics

### 6.2 Basic Simulation Model

```lua
-- Simple economy simulator
local EconomySimulator = {}

function EconomySimulator:runSimulation(params)
    local players = self:initializePlayers(params.playerCount)
    local results = {days = {}}

    for day = 1, params.simulationDays do
        local dailyStats = {
            totalFaucets = 0,
            totalSinks = 0,
            averageWealth = 0,
            medianWealth = 0,
            wealthGini = 0
        }

        for _, player in ipairs(players) do
            -- Simulate daily faucets
            local earnings = self:simulateDailyEarnings(player, params)
            player.coins = player.coins + earnings
            dailyStats.totalFaucets = dailyStats.totalFaucets + earnings

            -- Simulate spending behavior
            local spending = self:simulateSpending(player, params)
            player.coins = player.coins - spending
            dailyStats.totalSinks = dailyStats.totalSinks + spending

            -- Simulate player lifecycle
            self:updatePlayerState(player)
        end

        -- Calculate daily metrics
        dailyStats.averageWealth = self:calculateAverageWealth(players)
        dailyStats.medianWealth = self:calculateMedianWealth(players)
        dailyStats.wealthGini = self:calculateGini(players)

        results.days[day] = dailyStats
    end

    return results
end

function EconomySimulator:simulateDailyEarnings(player, params)
    local earnings = 0

    -- Gameplay earnings (varies by engagement)
    local playHours = math.random() * player.avgPlayHours * 1.5
    earnings = earnings + (playHours * params.coinsPerHour)

    -- Quest completion (probability based)
    if math.random() < params.questCompletionRate then
        earnings = earnings + params.avgQuestReward
    end

    -- Daily login
    earnings = earnings + params.dailyLoginReward

    return math.floor(earnings)
end

function EconomySimulator:simulateSpending(player, params)
    local spending = 0

    -- Consumables (based on engagement)
    spending = spending + (player.avgPlayHours * params.consumableCostPerHour)

    -- Item purchases (based on savings)
    if player.coins > params.savingsThreshold then
        local purchaseProb = (player.coins - params.savingsThreshold) / params.savingsThreshold
        if math.random() < math.min(purchaseProb, 0.3) then
            spending = spending + params.avgItemCost
        end
    end

    return math.min(spending, player.coins)  -- Can't spend more than have
end
```

### 6.3 Advanced Simulation Factors

```
SIMULATION COMPLEXITY LEVELS
════════════════════════════

LEVEL 1 (Basic):
├─ Fixed daily earnings
├─ Simple spending probability
├─ Single player type
└─ No external factors

LEVEL 2 (Intermediate):
├─ Variable earnings by activity
├─ Spending based on inventory
├─ Multiple player segments
├─ Basic lifecycle (new/retained/churned)
└─ Event impacts

LEVEL 3 (Advanced):
├─ Full player behavior model
├─ Social influences
├─ Market dynamics
├─ Exploit detection
├─ Real-time adjustment
└─ Machine learning enhancement
```

### 6.4 Simulation Outputs and Interpretation

```
SIMULATION DASHBOARD METRICS
════════════════════════════

Economy Health:
├─ Sink/Faucet Ratio: [0.95] ✓
├─ Inflation Rate: [2.3%/month] ✓
├─ Wealth Gini: [0.62] ⚠️ (watching)
└─ Currency Velocity: [1.4 turns/month] ✓

Player Segments:
├─ Accumulators: 23% (wealth > 2x median)
├─ Balanced: 54% (wealth within 50% of median)
├─ Struggling: 18% (wealth < 50% median)
└─ Newcomers: 5% (< 7 days)

Projection (90 days):
├─ Average wealth: +15%
├─ New sink needed: ~5000 coins/player
├─ Risk areas: Level 50+ players
└─ Recommendation: Add prestige system
```

---

## 7. Warning Signs of Broken Economy

### 7.1 Red Flags Dashboard

```
ECONOMY WARNING INDICATORS
══════════════════════════

🔴 CRITICAL (Immediate Action):
├─ Exploit discovery (unlimited currency)
├─ >50% of players at max currency
├─ Hard currency sales down >30% MoM
├─ Negative player sentiment spike
└─ Inflation >10%/week

🟡 WARNING (Monitor Closely):
├─ Sink utilization <60%
├─ New content trivially affordable
├─ Rising average player wealth trend
├─ Declining premium conversion rate
├─ Player complaints about "nothing to buy"

🟢 HEALTHY INDICATORS:
├─ Sink/faucet ratio 0.85-1.05
├─ Stable median player wealth
├─ Consistent premium purchases
├─ Active use of all item tiers
├─ Positive player economic sentiment
```

### 7.2 Common Economy Problems

| Problem | Symptoms | Root Cause | Solution |
|---------|----------|------------|----------|
| **Inflation** | Stockpiling, trivial prices | Faucets > sinks | Add sinks, reduce faucets |
| **Deflation** | Frustration, slow progress | Sinks > faucets | Increase rewards, add catch-up |
| **Hoarding** | Wealth concentration | Poor sinks, FOMO | Exclusive limited sinks |
| **Stagnation** | No transactions | Nothing desirable | Add aspirational content |
| **P2W Perception** | Negative reviews | Power imbalance | Rebalance paid advantages |

### 7.3 Problem Detection Queries

```lua
-- Economy health checks
local EconomyHealthCheck = {}

function EconomyHealthCheck:runDailyChecks()
    local alerts = {}

    -- Check 1: Wealth accumulation
    local wealthGrowth = self:getWeeklyWealthGrowth()
    if wealthGrowth > 15 then  -- >15% weekly
        table.insert(alerts, {
            severity = "WARNING",
            type = "INFLATION_RISK",
            message = "Weekly wealth growth: " .. wealthGrowth .. "%",
            action = "Review faucet rates"
        })
    end

    -- Check 2: Sink engagement
    local sinkUsage = self:getSinkUtilization()
    if sinkUsage < 50 then  -- <50% of potential sinks used
        table.insert(alerts, {
            severity = "WARNING",
            type = "SINK_UNDERUTILIZATION",
            message = "Sink usage: " .. sinkUsage .. "%",
            action = "Add desirable sinks or reduce prices"
        })
    end

    -- Check 3: Premium purchase trend
    local premiumTrend = self:getPremiumPurchaseTrend(30)
    if premiumTrend < -20 then  -- >20% decline
        table.insert(alerts, {
            severity = "CRITICAL",
            type = "MONETIZATION_DECLINE",
            message = "Premium purchases down: " .. premiumTrend .. "%",
            action = "Investigate economy health and value proposition"
        })
    end

    -- Check 4: Exploit indicators
    local anomalies = self:detectWealthAnomalies()
    if #anomalies > 0 then
        table.insert(alerts, {
            severity = "CRITICAL",
            type = "POTENTIAL_EXPLOIT",
            message = #anomalies .. " suspicious wealth gains detected",
            action = "Investigate immediately"
        })
    end

    return alerts
end
```

### 7.4 Recovery Procedures

```
ECONOMY RECOVERY PLAYBOOK
═════════════════════════

SCENARIO 1: Severe Inflation
────────────────────────────
Immediate:
├─ Identify and fix any exploits
├─ Pause affected faucets
└─ Communicate with players

Short-term:
├─ Introduce high-value limited sinks
├─ Run "currency exchange" event
├─ Consider soft reset options (with compensation)
└─ Adjust future content pricing

Long-term:
├─ Redesign faucet/sink balance
├─ Implement better monitoring
├─ Add automatic throttling
└─ Regular economy audits

SCENARIO 2: Deflation/Frustration
─────────────────────────────────
Immediate:
├─ Increase daily rewards temporarily
├─ Reduce key sink prices
└─ Communicate changes positively

Short-term:
├─ Add catch-up mechanics
├─ Implement "welfare" floor
├─ Review progression curve
└─ Add alternative earning paths

Long-term:
├─ Rebalance progression system
├─ Create multiple viable paths
├─ Regular accessibility reviews
└─ Player segment monitoring
```

---

## 8. Economy Health Metrics

### 8.1 Core Metrics Dashboard

```
DAILY ECONOMY METRICS
═════════════════════

VOLUME METRICS:
├─ Total currency created: [X]
├─ Total currency removed: [Y]
├─ Net flow: [X-Y]
├─ Active players: [N]
├─ Transactions: [T]

BALANCE METRICS:
├─ Sink/Faucet ratio: [Y/X]
├─ Average wealth: [Avg]
├─ Median wealth: [Med]
├─ Wealth Gini coefficient: [G]
├─ Currency velocity: [T/TotalSupply]

HEALTH SCORES:
├─ Inflation risk: [0-100]
├─ Sink health: [0-100]
├─ Monetization health: [0-100]
├─ Overall economy health: [0-100]
```

### 8.2 Key Performance Indicators

| KPI | Formula | Target Range | Alert Threshold |
|-----|---------|--------------|-----------------|
| **Sink Ratio** | Sinks / Faucets | 0.85 - 1.05 | <0.7 or >1.2 |
| **Velocity** | Transactions / Supply | 0.5 - 2.0 | <0.3 |
| **Gini Index** | Wealth inequality | 0.3 - 0.6 | >0.75 |
| **Purchase Rate** | Purchases / DAU | 0.02 - 0.10 | <0.01 |
| **Earn Rate** | Daily earnings / DAU | As designed | >150% of design |

### 8.3 Health Score Calculation

```lua
-- Economy health score calculator
local HealthScoreCalculator = {}

function HealthScoreCalculator:calculate()
    local scores = {}

    -- Component 1: Sink/Faucet Balance (25%)
    local sinkRatio = self:getSinkRatio()
    if sinkRatio >= 0.85 and sinkRatio <= 1.05 then
        scores.balance = 100
    elseif sinkRatio >= 0.7 and sinkRatio <= 1.2 then
        scores.balance = 70
    else
        scores.balance = 40
    end

    -- Component 2: Wealth Distribution (25%)
    local gini = self:getGiniCoefficient()
    scores.distribution = math.max(0, 100 - (gini * 100))

    -- Component 3: Currency Velocity (25%)
    local velocity = self:getCurrencyVelocity()
    if velocity >= 0.5 and velocity <= 2.0 then
        scores.velocity = 100
    elseif velocity >= 0.3 then
        scores.velocity = 70
    else
        scores.velocity = 40
    end

    -- Component 4: Monetization Health (25%)
    local purchaseRate = self:getPurchaseRate()
    scores.monetization = math.min(100, purchaseRate * 1000)

    -- Overall health score
    local overall = (scores.balance * 0.25 +
                    scores.distribution * 0.25 +
                    scores.velocity * 0.25 +
                    scores.monetization * 0.25)

    return {
        overall = overall,
        components = scores,
        grade = self:getGrade(overall)
    }
end

function HealthScoreCalculator:getGrade(score)
    if score >= 90 then return "A"
    elseif score >= 80 then return "B"
    elseif score >= 70 then return "C"
    elseif score >= 60 then return "D"
    else return "F" end
end
```

### 8.4 Reporting Template

```
WEEKLY ECONOMY REPORT
═════════════════════

Period: [Date Range]
Health Score: [Score] ([Grade])

EXECUTIVE SUMMARY:
[Brief 2-3 sentence summary of economy status]

KEY METRICS:
┌───────────────────┬──────────┬──────────┬────────┐
│ Metric            │ This Week│ Last Week│ Change │
├───────────────────┼──────────┼──────────┼────────┤
│ Sink/Faucet Ratio │    0.92  │    0.89  │  +3%   │
│ Avg Player Wealth │  15,234  │  14,890  │  +2%   │
│ Wealth Gini       │    0.54  │    0.52  │  +4%   │
│ Premium Sales     │  $X,XXX  │  $X,XXX  │  +X%   │
│ Transaction Count │  XX,XXX  │  XX,XXX  │  +X%   │
└───────────────────┴──────────┴──────────┴────────┘

ALERTS:
├─ [Alert 1 if any]
├─ [Alert 2 if any]
└─ [None if healthy]

RECOMMENDATIONS:
├─ [Action 1]
├─ [Action 2]
└─ [Action 3]

UPCOMING:
├─ [Planned economy changes]
└─ [Monitoring focus areas]
```

---

## 9. Economy Balancing Checklist

### Pre-Launch

- [ ] Dual currency system designed
- [ ] All faucets identified and quantified
- [ ] All sinks identified and balanced
- [ ] Progression curve modeled
- [ ] Simulation run for 365+ days
- [ ] Exchange rates set
- [ ] Price points determined
- [ ] Monitoring infrastructure ready

### Launch Monitoring

- [ ] Daily health checks automated
- [ ] Alert thresholds configured
- [ ] Manual review schedule set
- [ ] Exploit detection active
- [ ] Player feedback monitored

### Ongoing Operations

- [ ] Weekly economy review
- [ ] Monthly deep analysis
- [ ] Quarterly rebalancing consideration
- [ ] Annual economic reset evaluation
- [ ] Continuous simulation validation

---

## 10. Summary: Economy Principles

```
GOLDEN RULES OF GAME ECONOMY
════════════════════════════

1. BALANCE OVER TIME
   └─ Slight sink surplus is healthier than faucet surplus

2. MEANINGFUL CHOICES
   └─ Players should feel their economic decisions matter

3. MULTIPLE PATHS
   └─ Never just one way to earn or spend

4. ASPIRATIONAL CONTENT
   └─ Always something valuable to save for

5. FAIR VALUE PERCEPTION
   └─ Purchases should feel worth it

6. REGULAR MONITORING
   └─ Economies drift; constant vigilance required

7. GRADUAL CHANGES
   └─ Sudden shifts damage trust

8. COMMUNICATE OPENLY
   └─ Players handle changes better when informed
```

---

*Document version: 1.0.0 | Last updated: 2025-01-28 | Agent: Coin (monetization-strategist)*
