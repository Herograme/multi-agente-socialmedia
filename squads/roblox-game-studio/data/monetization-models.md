# Roblox Monetization Models & Best Practices

> Complete guide to ethical and effective monetization on Roblox
> Last Updated: January 2025

---

## Overview of Monetization Methods

### Revenue Share Structure
| Method | Developer Share | Roblox Share |
|--------|----------------|--------------|
| Game Passes | 70% | 30% |
| Developer Products | 70% | 30% |
| Paid Video Games | Up to 70% | 30% |
| Premium Payouts | Variable | Variable |
| UGC Items | 30-70% | 30-70% |

### DevEx (Developer Exchange)
- Minimum: 30,000 earned Robux
- Exchange rate: $0.0035 - $0.0038 per Robux
- 30,000 Robux = ~$105 - $114 USD
- Rate increased 8.5% in Q2 2025

---

## Game Passes

### What Are Game Passes?
One-time purchases that grant permanent benefits. Players buy once and keep forever.

### Best Use Cases
| Pass Type | Example | Price Range (Robux) |
|-----------|---------|---------------------|
| VIP Access | Exclusive areas, perks | 100-500 |
| Cosmetics | Permanent skins, effects | 25-200 |
| Gameplay Boosts | 2x XP forever | 50-250 |
| Unlocks | Extra character slots | 75-300 |
| Premium Features | Radio, flight | 100-500 |

### Pricing Strategy

#### Entry-Level Prices (High Volume)
```lua
-- Best for new/small games
local entryPasses = {
    {name = "Starter Pack", price = 25, value = "Small boost"},
    {name = "Color Pack", price = 50, value = "Cosmetic variety"},
    {name = "Basic VIP", price = 75, value = "Minor perks"}
}
```

#### Mid-Tier Prices (Balanced)
```lua
-- Sweet spot for most games
local midPasses = {
    {name = "Premium VIP", price = 150, value = "Significant perks"},
    {name = "2x Everything", price = 200, value = "Major boost"},
    {name = "Ultimate Pack", price = 299, value = "Best value bundle"}
}
```

#### High-Tier Prices (Whales)
```lua
-- Only for established games with engaged players
local premiumPasses = {
    {name = "Founder's Edition", price = 500, value = "Exclusive forever"},
    {name = "Lifetime VIP", price = 999, value = "All future content"},
    {name = "Developer Supporter", price = 1999, value = "Max support"}
}
```

### Optimal Price Points Research

| Price (Robux) | Conversion Rate | Best For |
|---------------|-----------------|----------|
| 25-50 | Highest | Impulse buys, cosmetics |
| 75-100 | High | Core features |
| 150-200 | Medium | Dedicated players |
| 300-500 | Low | Superfans |
| 500+ | Very Low | Whales only |

### Game Pass Implementation

```lua
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

-- Game Pass IDs
local PASSES = {
    VIP = 123456789,
    DOUBLE_XP = 234567890,
    PREMIUM = 345678901
}

-- Check if player owns pass
local function hasGamePass(player, passId)
    local success, hasPass = pcall(function()
        return MarketplaceService:UserOwnsGamePassAsync(player.UserId, passId)
    end)
    return success and hasPass
end

-- Apply pass benefits
local function applyPassBenefits(player)
    if hasGamePass(player, PASSES.VIP) then
        player:SetAttribute("IsVIP", true)
        -- Grant VIP benefits
    end

    if hasGamePass(player, PASSES.DOUBLE_XP) then
        player:SetAttribute("XPMultiplier", 2)
    end
end

-- Prompt purchase
local function promptGamePass(player, passId)
    MarketplaceService:PromptGamePassPurchase(player, passId)
end

-- Handle purchase completion
MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, passId, purchased)
    if purchased then
        applyPassBenefits(player)
    end
end)
```

---

## Developer Products

### What Are Developer Products?
Consumable items that can be purchased multiple times. Creates recurring revenue.

### Best Use Cases
| Product Type | Example | Price Range |
|--------------|---------|-------------|
| Currency Packs | 1000 Coins | 50-500 |
| Consumables | Speed Boost (1hr) | 10-50 |
| Respawns/Lives | Extra life | 5-25 |
| Skips | Skip level/timer | 15-50 |
| Loot Boxes | Mystery egg | 25-100 |

### Developer Product Implementation

```lua
local MarketplaceService = game:GetService("MarketplaceService")

-- Product IDs and handling
local PRODUCTS = {
    [111111111] = {
        name = "100 Coins",
        handler = function(player)
            local leaderstats = player:FindFirstChild("leaderstats")
            if leaderstats and leaderstats:FindFirstChild("Coins") then
                leaderstats.Coins.Value += 100
            end
            return true
        end
    },
    [222222222] = {
        name = "Speed Boost",
        handler = function(player)
            local character = player.Character
            if character then
                local humanoid = character:FindFirstChild("Humanoid")
                if humanoid then
                    humanoid.WalkSpeed = 32 -- Double speed
                    task.delay(3600, function() -- 1 hour
                        if humanoid then
                            humanoid.WalkSpeed = 16
                        end
                    end)
                end
            end
            return true
        end
    }
}

-- Process purchases
local function processReceipt(receiptInfo)
    local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
    if not player then
        return Enum.ProductPurchaseDecision.NotProcessedYet
    end

    local product = PRODUCTS[receiptInfo.ProductId]
    if product then
        local success = product.handler(player)
        if success then
            return Enum.ProductPurchaseDecision.PurchaseGranted
        end
    end

    return Enum.ProductPurchaseDecision.NotProcessedYet
end

MarketplaceService.ProcessReceipt = processReceipt
```

---

## Battle Pass / Season Pass Design

### Core Structure
| Tier | Free Track | Premium Track | Price |
|------|------------|---------------|-------|
| Tier 1 | Basic reward | Exclusive skin | - |
| Tier 10 | Currency | Rare item | - |
| Tier 25 | Consumable | Very Rare | - |
| Tier 50 | Good reward | Legendary | - |
| Tier 100 | Final free | Ultimate exclusive | - |

### Typical Pricing
- Season Pass: **499-799 Robux**
- Premium + Tier Skip: **999-1499 Robux**
- Season Duration: **8-15 weeks**

### Season Pass Implementation

```lua
local SeasonPass = {}

SeasonPass.PASS_ID = 123456789 -- Game Pass ID
SeasonPass.MAX_TIER = 100
SeasonPass.XP_PER_TIER = 1000

local rewards = {
    -- {tier, freeReward, premiumReward}
    {1, "100 Coins", "Exclusive Hat"},
    {5, "250 Coins", "Rare Skin"},
    {10, "Speed Boost", "Pet"},
    -- ... more tiers
    {100, "1000 Coins", "Legendary Exclusive"}
}

function SeasonPass:GetPlayerTier(player)
    local xp = player:GetAttribute("SeasonXP") or 0
    return math.min(math.floor(xp / self.XP_PER_TIER) + 1, self.MAX_TIER)
end

function SeasonPass:HasPremium(player)
    return hasGamePass(player, self.PASS_ID)
end

function SeasonPass:ClaimReward(player, tier)
    local playerTier = self:GetPlayerTier(player)
    if tier > playerTier then
        return false, "Tier not reached"
    end

    local claimed = player:GetAttribute("ClaimedTiers") or ""
    if claimed:find(tostring(tier)) then
        return false, "Already claimed"
    end

    -- Grant reward
    local reward = rewards[tier]
    if reward then
        local rewardIndex = self:HasPremium(player) and 3 or 2
        self:GrantReward(player, reward[rewardIndex])

        -- Mark as claimed
        player:SetAttribute("ClaimedTiers", claimed .. tier .. ",")
        return true
    end

    return false, "Invalid tier"
end
```

### Season Pass Best Practices

1. **Free Track Value**: Make free track worthwhile (40% of value)
2. **Premium Value**: Premium should feel 3-5x worth the price
3. **Achievable Progress**: 80% of players should reach tier 50
4. **FOMO Balance**: Don't make exclusive items TOO exclusive
5. **Catch-up Mechanics**: Allow tier purchases for latecomers

---

## Premium Payouts

### How It Works
Roblox pays developers based on engagement time from Premium subscribers.

### Payout Formula
```
Payout = (Your Premium Playtime / Total Platform Playtime) * Premium Pool
```

### Maximizing Premium Payouts
1. **Increase session length** - More content, better retention
2. **Target Premium users** - Premium-exclusive benefits
3. **Daily engagement** - Reasons to return daily
4. **Quality content** - Premium users are more discerning

### Premium Benefits Implementation

```lua
local Players = game:GetService("Players")

local function isPremium(player)
    return player.MembershipType == Enum.MembershipType.Premium
end

local function applyPremiumBenefits(player)
    if isPremium(player) then
        player:SetAttribute("IsPremium", true)
        -- 10% extra currency
        player:SetAttribute("CurrencyBonus", 1.1)
        -- Exclusive cosmetics
        player:SetAttribute("PremiumCosmetics", true)
        -- Daily bonus
        player:SetAttribute("DailyBonusMultiplier", 1.5)
    end
end

Players.PlayerAdded:Connect(applyPremiumBenefits)
```

---

## New 2025 Creator Incentives

### Daily Engagement Reward
- **5 Robux** per active spender who spends 10+ minutes in experience
- Encourages longer sessions

### Audience Expansion Reward
- **35% revenue share** on up to first $100 spent by new/returning users
- Encourages bringing in new players

---

## Pricing Psychology

### Anchor Pricing
Show expensive option first to make others seem reasonable.

```lua
local pricingTiers = {
    {name = "Mega Pack", robux = 999, coins = 15000}, -- Anchor
    {name = "Value Pack", robux = 499, coins = 6000}, -- Target
    {name = "Starter Pack", robux = 99, coins = 1000}  -- Entry
}
```

### Bundle Discounts
Create perceived value with bundles.

```lua
local bundles = {
    {
        name = "Ultimate Bundle",
        items = {"VIP Pass", "2x XP", "Starter Coins"},
        individualPrice = 500, -- If bought separately
        bundlePrice = 350,     -- 30% savings
        savings = "30% OFF!"
    }
}
```

### Limited Time Offers
Create urgency (ethically).

```lua
local limitedOffers = {
    {
        name = "Weekend Special",
        discount = 0.25,
        endsIn = "48 hours",
        showCountdown = true
    }
}
```

### Price Endings
- **X99** (e.g., 299) - Perceived as a deal
- **X50** (e.g., 250) - Perceived as premium
- **Round numbers** (e.g., 300) - Perceived as straightforward

---

## Conversion Benchmarks

### Industry Averages
| Metric | Casual Games | Mid-Core | Hardcore |
|--------|--------------|----------|----------|
| Conversion Rate | 2-3% | 4-6% | 6-10% |
| ARPU | $0.02-0.05 | $0.05-0.15 | $0.10-0.30 |
| ARPPU | $2-5 | $5-15 | $15-50 |

### Roblox-Specific Benchmarks
| Metric | Good | Great | Excellent |
|--------|------|-------|-----------|
| Day 1 Retention | 25% | 35% | 45%+ |
| Day 7 Retention | 8% | 15% | 20%+ |
| Day 30 Retention | 3% | 8% | 12%+ |
| Conversion | 2% | 5% | 8%+ |

### ARPU by Genre (Estimated)
| Genre | Monthly ARPU |
|-------|--------------|
| Roleplay | $0.08-0.15 |
| Simulator | $0.05-0.12 |
| Tycoon | $0.04-0.10 |
| Horror | $0.03-0.08 |
| Obby | $0.02-0.05 |

---

## Ethical vs Predatory Practices

### ETHICAL PRACTICES (DO)

| Practice | Why It's Good |
|----------|---------------|
| **Clear pricing** | Players know what they're paying |
| **Fair value exchange** | Price matches perceived value |
| **Cosmetic monetization** | No pay-to-win |
| **Transparent odds** | Show loot box probabilities |
| **Skill-based progression** | Paying speeds up, doesn't replace skill |
| **Reasonable grinding** | Free players can progress meaningfully |
| **No artificial friction** | Don't create problems to sell solutions |
| **Refund consideration** | Handle mistakes gracefully |
| **Age-appropriate design** | Consider younger audience |
| **Time-gated, not paywall** | Free players wait, don't hit walls |

### PREDATORY PRACTICES (DON'T)

| Practice | Why It's Harmful |
|----------|------------------|
| **Hidden odds** | Deceptive about chances |
| **FOMO manipulation** | Excessive "buy now or miss forever" |
| **Pay-to-win** | Paying players dominate unfairly |
| **Artificial energy systems** | "Pay to play" mechanics |
| **Targeting children** | Exploiting minors' psychology |
| **Obscured pricing** | Making it hard to understand real cost |
| **Gambling mechanics** | Loot boxes designed like slots |
| **Cooldown walls** | Forcing payments to continue playing |
| **Social pressure purchases** | "Friends have X, you should too" |
| **Regressive difficulty** | Game gets harder if you don't pay |
| **Subscription traps** | Hard to cancel, unclear terms |
| **Whale hunting** | Specifically targeting addictive players |

### Ethical Loot Box Implementation

```lua
-- ALWAYS show odds
local lootBox = {
    name = "Mystery Egg",
    price = 50,
    odds = {
        {rarity = "Common", chance = 0.60, displayChance = "60%"},
        {rarity = "Uncommon", chance = 0.25, displayChance = "25%"},
        {rarity = "Rare", chance = 0.10, displayChance = "10%"},
        {rarity = "Legendary", chance = 0.05, displayChance = "5%"}
    },
    -- Pity system: guaranteed rare after X attempts
    pityThreshold = 20,
    pityReward = "Rare"
}

-- Display odds to player before purchase
local function showOddsUI(player, box)
    local ui = createOddsDisplay(box)
    ui.Parent = player.PlayerGui
    -- Player sees: "Common: 60%, Uncommon: 25%, Rare: 10%, Legendary: 5%"
end

-- Pity system prevents endless bad luck
local function rollWithPity(player, box)
    local attempts = player:GetAttribute("BoxAttempts") or 0

    if attempts >= box.pityThreshold then
        player:SetAttribute("BoxAttempts", 0)
        return box.pityReward
    end

    player:SetAttribute("BoxAttempts", attempts + 1)
    return rollNormal(box.odds)
end
```

---

## Monetization Checklist

### Before Launch
- [ ] All prices are visible before purchase
- [ ] Value proposition is clear for each item
- [ ] Free players can enjoy the full game
- [ ] Loot box odds are displayed
- [ ] No purchase is required to progress
- [ ] Tested with children/young players in mind
- [ ] No dark patterns in UI design

### Regular Review
- [ ] Player sentiment is positive about monetization
- [ ] Conversion rates are healthy (not exploitative)
- [ ] Whales aren't being over-milked
- [ ] Free player experience is still fun
- [ ] Prices reflect current market/value

### Red Flags to Watch
- Excessive spending from single users
- Negative reviews mentioning "pay to win"
- High conversion but low retention
- Community complaints about pricing
- Children asking parents for repeated purchases

---

## Revenue Optimization Tips

### 1. First Purchase Conversion
Make the first purchase irresistible.
```lua
-- First-time buyer special
local firstPurchaseOffer = {
    name = "Starter Special",
    regularPrice = 99,
    firstPurchasePrice = 49,
    items = {"100 Coins", "Exclusive Badge"},
    oneTimeOnly = true
}
```

### 2. Bundle Everything
Single items = less value perception.
```lua
-- Bundles convert better than singles
local bundle = {
    items = {"Hat", "Shirt", "Pants", "Effect"},
    bundlePrice = 199,
    individualTotal = 320,
    savings = "38%"
}
```

### 3. Create Purchase Moments
Prompt at optimal times.
```lua
-- Prompt after positive experience
local function onLevelComplete(player)
    if not hasGamePass(player, DOUBLE_XP_PASS) then
        -- Show tasteful "Want 2x XP?" offer
    end
end

-- NOT after frustrating moments (predatory)
```

### 4. Track Everything
```lua
local function trackPurchase(player, productId, price)
    Analytics:TrackEvent({
        name = "Purchase",
        player = player.UserId,
        product = productId,
        price = price,
        sessionLength = getSessionLength(player),
        daysSinceJoin = getDaysSinceJoin(player),
        platform = getPlatform(player)
    })
end
```

---

## References

- [Roblox Monetization Documentation](https://create.roblox.com/docs/production/monetization)
- [Roblox Developer Forum - Monetization](https://devforum.roblox.com)
- [Business of Apps - Roblox Revenue Data](https://www.businessofapps.com)
- [Game Design Ethics - IGDA](https://igda.org)
- [FTC Guidelines on In-Game Purchases](https://www.ftc.gov)
