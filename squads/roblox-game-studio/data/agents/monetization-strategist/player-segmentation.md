---
title: "Player Segmentation for Game Monetization"
agent: monetization-strategist
alias: Coin
category: segmentation
version: 1.0.0
last_updated: 2025-01-28
tags: [segmentation, whales, dolphins, analytics, targeting, personalization]
---

# Player Segmentation for Game Monetization

## Introduction

Player segmentation is the foundation of effective game monetization. By understanding that not all players are alike, we can craft experiences and offers that resonate with each segment's unique behaviors, motivations, and spending patterns. This guide provides comprehensive frameworks for segmenting your player base and optimizing monetization for each group.

---

## 1. Whale/Dolphin/Minnow Segmentation

### 1.1 Classic Spending Tiers

The most fundamental segmentation in F2P games is based on spending levels:

```
SPENDING TIER PYRAMID
═════════════════════

                  ▲
                 /│\
                / │ \       WHALES (0.5-2%)
               /  │  \      Spend: $100+/month
              /   │   \     Focus: Exclusivity, status
             /────┼────\
            /     │     \   DOLPHINS (3-8%)
           /      │      \  Spend: $20-100/month
          /       │       \ Focus: Value, progression
         /────────┼────────\
        /         │         \  MINNOWS (15-25%)
       /          │          \ Spend: $1-20/month
      /           │           \Focus: Starter packs, deals
     /────────────┼────────────\
    /             │             \ FREE PLAYERS (65-80%)
   /              │              \Spend: $0
  /               │               \Focus: Engagement, conversion
 /─────────────────────────────────\
```

### 1.2 Detailed Tier Definitions

| Tier | Monthly Spend | % of Players | % of Revenue | Key Traits |
|------|--------------|--------------|--------------|------------|
| **Mega Whale** | $500+ | 0.1-0.3% | 15-25% | Collectors, completionists |
| **Whale** | $100-500 | 0.5-1.5% | 25-40% | Status seekers, heavy engagers |
| **Dolphin** | $20-100 | 3-8% | 20-30% | Value optimizers, invested |
| **Minnow** | $1-20 | 15-25% | 10-15% | Occasional purchasers |
| **Never Payer** | $0 (converted) | 20-30% | 0% | May convert with right offer |
| **Free Player** | $0 (never) | 40-60% | 0% | Unlikely to convert |

### 1.3 Identifying Spending Potential

```lua
-- Whale potential scoring system
local function calculateSpendingPotential(player)
    local score = 0
    local data = PlayerDataService:get(player)

    -- Engagement signals
    if data.sessionsPerWeek > 5 then score = score + 20 end
    if data.avgSessionLength > 30 then score = score + 15 end
    if data.daysSinceFirstPlay > 7 then score = score + 10 end

    -- Wealth signals
    if data.hasRobux and data.robuxBalance > 1000 then score = score + 25 end
    if data.previousPurchases > 0 then score = score + 30 end

    -- Behavior signals
    if data.viewedPremiumItems > 5 then score = score + 15 end
    if data.timeInStore > 120 then score = score + 10 end -- seconds
    if data.socialConnections > 3 then score = score + 10 end

    -- Classify
    if score >= 80 then return "whale_potential"
    elseif score >= 50 then return "dolphin_potential"
    elseif score >= 25 then return "minnow_potential"
    else return "low_potential" end
end
```

### 1.4 Tier-Specific Strategies

```
MONETIZATION BY TIER
════════════════════

WHALE STRATEGY
├─ Offer: Ultra-rare exclusives, limited editions
├─ Pricing: Premium ($50-500+)
├─ Communication: Personal, VIP treatment
├─ Features: Early access, unique customization
└─ Risk: Don't overwhelm, respect pacing

DOLPHIN STRATEGY
├─ Offer: Value bundles, season passes
├─ Pricing: Mid-range ($5-50)
├─ Communication: Value-focused messaging
├─ Features: Progression acceleration
└─ Risk: Don't push too hard, maintain trust

MINNOW STRATEGY
├─ Offer: Starter packs, daily deals
├─ Pricing: Low threshold ($1-10)
├─ Communication: Deal alerts, savings emphasis
├─ Features: Taste of premium experience
└─ Risk: Don't devalue with constant sales

FREE PLAYER STRATEGY
├─ Offer: First purchase incentives
├─ Pricing: Ultra-low entry ($0.99-5)
├─ Communication: Subtle, non-intrusive
├─ Features: Watch-to-earn, engagement rewards
└─ Focus: Convert to minnow, maintain engagement
```

### 1.5 Whale Care and Retention

```
VIP WHALE PROGRAM
═════════════════

Benefits:
├─ Dedicated support channel
├─ Early access to new content
├─ Exclusive items not sold publicly
├─ Input into game development
├─ Recognition (special badges, titles)
└─ Personal milestone celebrations

Warning Signs of Whale Churn:
├─ Spending decrease (>30% MoM)
├─ Session frequency drop
├─ Ignored new premium content
├─ Negative feedback/complaints
└─ Friends leaving the game

Retention Actions:
├─ Personal outreach (thank you, feedback request)
├─ Exclusive "come back" offers
├─ Acknowledge their contribution
├─ Fix any reported issues immediately
└─ Create FOMO with upcoming exclusives
```

---

## 2. Behavioral Segmentation

### 2.1 Play Style Segments

Beyond spending, players differ in how they play:

```
BARTLE'S PLAYER TYPES (Extended)
════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│                       ACTING ON                              │
│                          ▲                                   │
│                          │                                   │
│    KILLERS               │            ACHIEVERS             │
│    (5-10%)               │            (40-50%)              │
│    • Competition         │            • Goals               │
│    • PvP focus           │            • Progression         │
│    • Leaderboards        │            • Completion          │
│                          │                                   │
│ PLAYERS────────────────────────────────────────────WORLD    │
│                          │                                   │
│    SOCIALIZERS           │            EXPLORERS             │
│    (30-40%)              │            (10-20%)              │
│    • Community           │            • Discovery           │
│    • Chat, friends       │            • Secrets             │
│    • Collaboration       │            • Novelty             │
│                          │                                   │
│                          ▼                                   │
│                    INTERACTING WITH                         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Monetization by Play Style

| Play Style | Primary Motivator | Best Offers | Monetization Approach |
|-----------|-------------------|-------------|----------------------|
| **Achiever** | Progress, completion | Progression boosts, completionist bundles | Time-savers, collection items |
| **Socializer** | Connection, status | Social items, gifts, emotes | Visible cosmetics, gifting |
| **Explorer** | Discovery, content | New areas, content access | Season passes, expansions |
| **Killer** | Competition, winning | Power items (if allowed), rankings | Competitive advantages |

### 2.3 Behavioral Detection System

```lua
-- Player behavior classification
local BehaviorAnalyzer = {}

function BehaviorAnalyzer:classify(player)
    local data = PlayerDataService:getActivityData(player)
    local scores = {
        achiever = 0,
        socializer = 0,
        explorer = 0,
        killer = 0
    }

    -- Achiever signals
    scores.achiever = scores.achiever + (data.achievementsEarned * 2)
    scores.achiever = scores.achiever + (data.questsCompleted * 1.5)
    scores.achiever = scores.achiever + (data.collectiblesFound * 1)

    -- Socializer signals
    scores.socializer = scores.socializer + (data.messagesSent * 0.5)
    scores.socializer = scores.socializer + (data.friendCount * 2)
    scores.socializer = scores.socializer + (data.groupActivities * 3)

    -- Explorer signals
    scores.explorer = scores.explorer + (data.areasDiscovered * 2)
    scores.explorer = scores.explorer + (data.secretsFound * 3)
    scores.explorer = scores.explorer + (data.uniqueItemsViewed * 0.5)

    -- Killer signals
    scores.killer = scores.killer + (data.pvpMatches * 2)
    scores.killer = scores.killer + (data.leaderboardRank and (100 / data.leaderboardRank) or 0)
    scores.killer = scores.killer + (data.competitiveWins * 1.5)

    -- Normalize and return primary type
    local maxScore = 0
    local primaryType = "achiever"
    for type, score in pairs(scores) do
        if score > maxScore then
            maxScore = score
            primaryType = type
        end
    end

    return {
        primary = primaryType,
        scores = scores,
        hybrid = self:detectHybrid(scores)
    }
end
```

### 2.4 Session Behavior Segments

```
SESSION PATTERNS
════════════════

BINGE PLAYER
├─ Pattern: Long sessions, irregular frequency
├─ Avg session: 60+ minutes
├─ Frequency: 2-3x per week
├─ Monetization: Big purchases, bundles
└─ Risk: Burnout

ROUTINE PLAYER
├─ Pattern: Consistent daily sessions
├─ Avg session: 15-30 minutes
├─ Frequency: Daily
├─ Monetization: Daily deals, passes
└─ Strength: Predictable, loyal

CASUAL PLAYER
├─ Pattern: Short, sporadic sessions
├─ Avg session: 5-15 minutes
├─ Frequency: Variable
├─ Monetization: Impulse purchases
└─ Challenge: Low attention

WEEKEND WARRIOR
├─ Pattern: Heavy weekend play
├─ Avg session: 45+ minutes
├─ Frequency: Weekends only
├─ Monetization: Weekend specials
└─ Timing: Critical for offers
```

---

## 3. Engagement-Based Segments

### 3.1 Engagement Scoring

```
ENGAGEMENT SCORE CALCULATION
════════════════════════════

Components:
├─ Recency (R): Days since last session
├─ Frequency (F): Sessions per week
├─ Duration (D): Average session length
├─ Depth (De): Features used, actions taken

Formula:
Engagement Score = (R_score × 0.25) + (F_score × 0.30) +
                   (D_score × 0.20) + (De_score × 0.25)

Where each component scored 0-100:

R_score:  Today=100, Yesterday=90, 2-3 days=70, 4-7 days=50, >7 days=20
F_score:  Daily=100, 4-6/week=80, 2-3/week=60, 1/week=40, <1/week=20
D_score:  >60min=100, 30-60=80, 15-30=60, 5-15=40, <5=20
De_score: Based on feature utilization percentage
```

### 3.2 Engagement Tiers

| Tier | Score Range | % of Players | Characteristics |
|------|------------|--------------|-----------------|
| **Super Engaged** | 90-100 | 5-10% | Daily, long sessions, uses all features |
| **Highly Engaged** | 70-89 | 15-20% | Regular play, deep feature use |
| **Moderately Engaged** | 50-69 | 25-30% | Consistent but limited |
| **Lightly Engaged** | 30-49 | 20-25% | Sporadic, surface-level |
| **At Risk** | 10-29 | 10-15% | Declining activity |
| **Dormant** | 0-9 | 15-20% | Inactive >14 days |

### 3.3 Engagement-Monetization Matrix

```
                    HIGH ENGAGEMENT          LOW ENGAGEMENT
                ┌──────────────────────┬──────────────────────┐
    HIGH        │                      │                      │
    SPENDING    │  CORE LOYALISTS      │  CHURNING WHALES     │
                │  • Maintain value    │  • Re-engage urgently│
                │  • Exclusive access  │  • Personal outreach │
                │  • Community roles   │  • Exclusive comeback│
                ├──────────────────────┼──────────────────────┤
    LOW         │                      │                      │
    SPENDING    │  CONVERSION TARGETS  │  CASUAL OBSERVERS    │
                │  • First purchase    │  • Low-touch nurture │
                │  • Value education   │  • Engagement focus  │
                │  • Soft upgrades     │  • Simplify offers   │
                └──────────────────────┴──────────────────────┘
```

### 3.4 Lifecycle Engagement Stages

```
PLAYER LIFECYCLE
════════════════

Stage 1: NEWCOMER (Day 0-1)
├─ Focus: Activation, tutorial completion
├─ Monetization: None (too early)
└─ Goal: Return tomorrow

Stage 2: LEARNER (Day 2-7)
├─ Focus: Core loop mastery
├─ Monetization: Starter pack introduction
└─ Goal: Habit formation

Stage 3: COMMITTED (Day 8-30)
├─ Focus: Deep engagement, social connections
├─ Monetization: First purchase, value packs
└─ Goal: Convert to payer

Stage 4: VETERAN (Day 31-90)
├─ Focus: Endgame content, mastery
├─ Monetization: Recurring purchases, passes
└─ Goal: Maximize LTV

Stage 5: LOYALIST (Day 90+)
├─ Focus: Community, new content
├─ Monetization: Premium, exclusives
└─ Goal: Advocacy, retention
```

---

## 4. RFM Analysis for Games

### 4.1 RFM Fundamentals

RFM (Recency, Frequency, Monetary) analysis is a data-driven segmentation technique:

```
RFM SCORING SYSTEM
══════════════════

RECENCY (R) - How recently did they play/purchase?
Score 5: Last 24 hours
Score 4: Last 2-3 days
Score 3: Last 4-7 days
Score 2: Last 8-14 days
Score 1: 15+ days ago

FREQUENCY (F) - How often do they play/purchase?
Score 5: 20+ sessions/month
Score 4: 12-19 sessions/month
Score 3: 5-11 sessions/month
Score 2: 2-4 sessions/month
Score 1: 1 or fewer/month

MONETARY (M) - How much do they spend?
Score 5: $100+ lifetime
Score 4: $25-99 lifetime
Score 3: $5-24 lifetime
Score 2: $1-4.99 lifetime
Score 1: $0 (free player)
```

### 4.2 RFM Segment Mapping

| RFM Score | Segment Name | Description | Strategy |
|-----------|-------------|-------------|----------|
| 555 | Champions | Best players | Reward loyalty, seek feedback |
| 554, 455 | Loyal | Frequent, high spenders | Upsell, VIP programs |
| 544, 454 | Potential Loyalists | Recent, engaged | Convert to loyal |
| 525, 515 | New Spenders | New, high value | Nurture relationship |
| 355, 345 | At Risk | Were good, dropping off | Win-back campaigns |
| 155, 145 | Can't Lose Them | Were whales, now gone | Aggressive re-engagement |
| 511 | New Players | Just joined | Activate, educate |
| 311, 411 | Hibernating | Low recent activity | Re-activation offers |
| 111 | Lost | Gone, low value | Remove from active targeting |

### 4.3 RFM Implementation

```lua
-- RFM Scoring System
local RFMAnalyzer = {}

function RFMAnalyzer:calculateRFM(player)
    local data = PlayerDataService:get(player)

    local r = self:scoreRecency(data.daysSinceLastSession)
    local f = self:scoreFrequency(data.sessionsLast30Days)
    local m = self:scoreMonetary(data.lifetimeSpend)

    return {
        recency = r,
        frequency = f,
        monetary = m,
        combined = r * 100 + f * 10 + m,
        segment = self:mapToSegment(r, f, m)
    }
end

function RFMAnalyzer:scoreRecency(days)
    if days <= 1 then return 5
    elseif days <= 3 then return 4
    elseif days <= 7 then return 3
    elseif days <= 14 then return 2
    else return 1 end
end

function RFMAnalyzer:scoreFrequency(sessions)
    if sessions >= 20 then return 5
    elseif sessions >= 12 then return 4
    elseif sessions >= 5 then return 3
    elseif sessions >= 2 then return 2
    else return 1 end
end

function RFMAnalyzer:scoreMonetary(spend)
    if spend >= 100 then return 5
    elseif spend >= 25 then return 4
    elseif spend >= 5 then return 3
    elseif spend >= 1 then return 2
    else return 1 end
end

function RFMAnalyzer:mapToSegment(r, f, m)
    local combined = r .. f .. m

    local segmentMap = {
        ["555"] = "champion",
        ["554"] = "loyal",
        ["455"] = "loyal",
        ["544"] = "potential_loyalist",
        ["454"] = "potential_loyalist",
        -- ... additional mappings
    }

    return segmentMap[combined] or self:inferSegment(r, f, m)
end
```

### 4.4 RFM Action Matrix

```
RFM ACTION RECOMMENDATIONS
══════════════════════════

Champions (555):
├─ Thank them publicly
├─ Involve in beta testing
├─ Exclusive previews
└─ Ambassador programs

Loyal (554, 455):
├─ VIP perks
├─ Loyalty rewards
├─ Cross-sell opportunities
└─ Personalized offers

At Risk (355, 345):
├─ Send win-back offers
├─ Ask for feedback
├─ Show what's new
└─ Personalized discounts

Can't Lose Them (155, 145):
├─ Urgent personal outreach
├─ Significant incentives
├─ Fix any reported issues
└─ Exclusive return bonus

New Players (511):
├─ Onboarding optimization
├─ Starter pack offers
├─ Educational content
└─ Social encouragement
```

---

## 5. Personalized Offers by Segment

### 5.1 Offer Personalization Framework

```
PERSONALIZATION ENGINE
═════════════════════

Input Variables:
├─ Spending tier (whale/dolphin/minnow/free)
├─ Play style (achiever/socializer/explorer/killer)
├─ Engagement level (high/medium/low)
├─ RFM segment
├─ In-game progress
├─ Past purchase history
└─ Current inventory/needs

Output:
├─ Offer type selection
├─ Price point optimization
├─ Timing recommendation
├─ Creative/messaging variant
└─ Channel selection
```

### 5.2 Segment-Specific Offer Templates

```lua
-- Offer personalization by segment
local OfferTemplates = {
    whale_achiever = {
        offerTypes = {"exclusive_collection", "limited_edition", "completion_bundle"},
        priceRange = {min = 500, max = 2500},
        messaging = "exclusive",
        urgency = "low",  -- Whales don't need pressure
        presentationStyle = "premium"
    },

    dolphin_socializer = {
        offerTypes = {"gift_bundle", "social_pack", "cosmetic_set"},
        priceRange = {min = 100, max = 500},
        messaging = "value",
        urgency = "medium",
        presentationStyle = "social_proof"
    },

    minnow_achiever = {
        offerTypes = {"starter_boost", "progression_pack", "catch_up_bundle"},
        priceRange = {min = 50, max = 150},
        messaging = "deal",
        urgency = "high",
        presentationStyle = "savings_focused"
    },

    free_explorer = {
        offerTypes = {"first_purchase", "trial_pack", "access_pass"},
        priceRange = {min = 25, max = 75},
        messaging = "discovery",
        urgency = "medium",
        presentationStyle = "value_education"
    }
}
```

### 5.3 Dynamic Offer Selection

```lua
-- Select optimal offer for player
local function selectPersonalizedOffer(player)
    local profile = PlayerProfileService:getSegmentedProfile(player)

    -- Build segment key
    local segmentKey = profile.spendingTier .. "_" .. profile.playStyle
    local template = OfferTemplates[segmentKey]

    -- Get candidate offers
    local candidates = OfferCatalog:getByTypes(template.offerTypes)

    -- Filter by price range
    candidates = filter(candidates, function(offer)
        return offer.price >= template.priceRange.min
           and offer.price <= template.priceRange.max
    end)

    -- Filter out owned items
    candidates = filter(candidates, function(offer)
        return not player:ownsItem(offer.mainItem)
    end)

    -- Score and select best
    local scored = map(candidates, function(offer)
        return {
            offer = offer,
            score = calculateOfferScore(offer, profile)
        }
    end)

    table.sort(scored, function(a, b) return a.score > b.score end)

    return scored[1].offer, template
end
```

### 5.4 Personalization Performance Metrics

| Metric | Non-Personalized | Personalized | Improvement |
|--------|-----------------|--------------|-------------|
| Offer CTR | 3.2% | 7.8% | +144% |
| Conversion Rate | 1.5% | 3.4% | +127% |
| Average Order Value | $4.50 | $6.20 | +38% |
| Customer Satisfaction | 3.2/5 | 4.1/5 | +28% |

---

## 6. Churn Prediction Indicators

### 6.1 Early Warning Signals

```
CHURN RISK INDICATORS
═════════════════════

HIGH RISK SIGNALS (Individual):
├─ Session frequency drop >50% WoW
├─ Session length decrease >40%
├─ No purchase in 2x normal interval
├─ Incomplete daily login streak
├─ Ignored limited time offer
└─ Support ticket/complaint filed

MODERATE RISK SIGNALS:
├─ Declining achievement completion
├─ Reduced social interactions
├─ Shorter average sessions
├─ Skipping new content
└─ Less diverse feature usage

ENVIRONMENTAL RISK SIGNALS:
├─ Friends churning
├─ Guild/group dissolution
├─ Competitor game launch
├─ School/holiday calendar
└─ Update reception (negative)
```

### 6.2 Churn Prediction Model

```lua
-- Churn risk scoring
local ChurnPredictor = {}

function ChurnPredictor:calculateRisk(player)
    local data = PlayerDataService:getHistoricalData(player)
    local risk = 0

    -- Engagement decay
    local sessionTrend = self:calculateTrend(data.sessionsPerWeek, 4) -- 4 weeks
    if sessionTrend < -0.3 then risk = risk + 30 end
    if sessionTrend < -0.5 then risk = risk + 20 end

    -- Purchase behavior
    local daysSinceLastPurchase = data.daysSinceLastPurchase or 999
    local avgPurchaseInterval = data.avgPurchaseInterval or 30
    if daysSinceLastPurchase > avgPurchaseInterval * 2 then
        risk = risk + 25
    end

    -- Feature engagement
    local featureUsageTrend = self:calculateTrend(data.featuresUsed, 4)
    if featureUsageTrend < -0.2 then risk = risk + 15 end

    -- Social factors
    local friendsActive = data.friendsActiveLastWeek / math.max(data.totalFriends, 1)
    if friendsActive < 0.3 then risk = risk + 20 end

    -- Recent negative experience
    if data.recentDeaths > data.avgDeaths * 1.5 then risk = risk + 10 end
    if data.hadSupportTicket then risk = risk + 15 end

    return math.min(100, risk)
end

function ChurnPredictor:classifyRisk(score)
    if score >= 70 then return "HIGH"
    elseif score >= 40 then return "MEDIUM"
    else return "LOW" end
end
```

### 6.3 Intervention Strategies by Risk Level

| Risk Level | Score | Intervention | Timing |
|-----------|-------|--------------|--------|
| Critical | 80-100 | Personal outreach, significant offer | Immediate |
| High | 60-79 | Win-back campaign, exclusive deal | Within 24 hours |
| Medium | 40-59 | Engagement reminder, small incentive | Within 48 hours |
| Low | 20-39 | Standard re-engagement | Standard cadence |
| Minimal | 0-19 | No intervention needed | Monitor only |

### 6.4 Churn Prevention Playbook

```
CHURN PREVENTION ACTIONS
════════════════════════

IMMEDIATE (Risk 80+):
├─ Push notification: "We miss you!"
├─ Email with personalized content
├─ Significant return bonus (50%+ value)
├─ Unlock time-gated content
└─ VIP escalation for whales

SHORT-TERM (Risk 60-79):
├─ In-game message on return
├─ Special limited-time offer
├─ Friend re-engagement ping
├─ New content highlight
└─ Progression assistance

MEDIUM-TERM (Risk 40-59):
├─ Weekly digest email
├─ Social proof ("Friends are playing")
├─ Upcoming event reminder
├─ Small loyalty bonus
└─ Survey for feedback
```

---

## 7. VIP Player Management

### 7.1 VIP Program Structure

```
VIP TIER SYSTEM
═══════════════

┌─────────────────────────────────────────────────────────────┐
│  TIER 5: LEGENDARY                                           │
│  ├─ Requirement: $1000+ lifetime                            │
│  ├─ Benefits: All below + personal account manager          │
│  ├─ Perks: Name in credits, design input                    │
│  └─ Recognition: Special title, unique effects              │
├─────────────────────────────────────────────────────────────┤
│  TIER 4: ELITE                                               │
│  ├─ Requirement: $500-999 lifetime                          │
│  ├─ Benefits: All below + exclusive monthly item            │
│  ├─ Perks: Priority support, early access                   │
│  └─ Recognition: Elite badge, forum title                   │
├─────────────────────────────────────────────────────────────┤
│  TIER 3: PREMIUM                                             │
│  ├─ Requirement: $200-499 lifetime                          │
│  ├─ Benefits: All below + VIP chat channel                  │
│  ├─ Perks: Bonus currency on purchase, special sales        │
│  └─ Recognition: Premium badge                              │
├─────────────────────────────────────────────────────────────┤
│  TIER 2: SUPPORTER                                           │
│  ├─ Requirement: $50-199 lifetime                           │
│  ├─ Benefits: Supporter badge, occasional bonus             │
│  └─ Recognition: Supporter title                            │
├─────────────────────────────────────────────────────────────┤
│  TIER 1: BACKER                                              │
│  ├─ Requirement: Any purchase                               │
│  └─ Benefits: Backer badge, thank you message               │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 VIP Communication Cadence

| Tier | Check-in Frequency | Channel | Content |
|------|-------------------|---------|---------|
| Legendary | Weekly | Personal | Custom updates, input requests |
| Elite | Bi-weekly | Direct message | Exclusive previews, feedback |
| Premium | Monthly | VIP newsletter | Special offers, new content |
| Supporter | Quarterly | General newsletter | Appreciation, updates |
| Backer | On events | In-game | Event notifications |

### 7.3 VIP Retention Tactics

```lua
-- VIP relationship management
local VIPManager = {}

function VIPManager:manageVIP(player)
    local tier = self:getVIPTier(player)
    local data = PlayerDataService:get(player)

    -- Milestone recognition
    if self:isSpendMilestone(data.lifetimeSpend) then
        self:sendMilestoneReward(player, data.lifetimeSpend)
        self:notifyCommunityManager(player, "milestone")
    end

    -- Anniversary recognition
    if self:isAnniversary(data.firstPurchaseDate) then
        self:sendAnniversaryGift(player, tier)
    end

    -- Engagement check
    if data.daysSinceLastSession > tier.maxInactivityDays then
        self:triggerVIPWinback(player, tier)
    end

    -- Satisfaction monitoring
    if data.recentSupportTicket or data.negativeReview then
        self:escalateVIPIssue(player, tier)
    end
end

function VIPManager:getVIPBenefits(tier)
    local benefits = {
        legendary = {
            bonusCurrency = 0.25,  -- 25% extra on purchases
            exclusiveItems = true,
            earlyAccess = true,
            personalManager = true,
            designInput = true
        },
        elite = {
            bonusCurrency = 0.15,
            exclusiveItems = true,
            earlyAccess = true,
            personalManager = false,
            designInput = false
        },
        -- ... etc
    }
    return benefits[tier]
end
```

---

## 8. Reactivation Strategies

### 8.1 Lapsed Player Segments

```
LAPSED PLAYER CLASSIFICATION
════════════════════════════

RECENTLY LAPSED (7-14 days inactive)
├─ Recovery rate: 40-60%
├─ Approach: Light touch, reminder
└─ Offer: Small incentive, what's new

MODERATELY LAPSED (15-30 days inactive)
├─ Recovery rate: 20-35%
├─ Approach: Medium effort, value proposition
└─ Offer: Moderate incentive, catch-up help

LONG LAPSED (31-90 days inactive)
├─ Recovery rate: 10-20%
├─ Approach: Strong offer, fresh start
└─ Offer: Significant incentive, reset options

DEEPLY LAPSED (90+ days inactive)
├─ Recovery rate: 5-10%
├─ Approach: Major update announcement
└─ Offer: Major incentive, complete restart
```

### 8.2 Reactivation Campaign Framework

```
REACTIVATION FUNNEL
═══════════════════

Day 1 (Last Active):
└─ No action (too early)

Day 3:
├─ Push notification: "Your friends are playing!"
└─ In-game mail: Daily reward waiting

Day 7:
├─ Email: "We miss you" + what's new
├─ Special offer: 25% bonus on next purchase
└─ Friend notification: "Invite [player] back"

Day 14:
├─ Email: Major update/feature highlight
├─ Special offer: 50% bonus + exclusive item
└─ Time-limited "comeback pack"

Day 30:
├─ Email: "A lot has changed" summary
├─ Offer: Free premium item
└─ Progression catch-up bundle

Day 60:
├─ Final email: Personal appeal
├─ Offer: Best-ever returning player deal
└─ Option to receive major update emails only

Day 90+:
├─ Remove from active campaigns
├─ Only contact for major game updates
└─ Focus resources on other segments
```

### 8.3 Reactivation Messaging

```
REACTIVATION EMAIL TEMPLATES
════════════════════════════

DAY 7 EMAIL:
Subject: "[Player], your adventure awaits!"

Hi [Player],

It's been a week since we've seen you in [Game Name]!

While you were away:
• [New Feature 1] was added
• [Limited Event] is happening now
• Your friends [Friend1, Friend2] have been playing

Come back today and claim your returning player bonus:
🎁 [Bonus Item] + [Currency Amount]

[Return to Game Button]

We'd love to have you back!
- The [Game] Team

────────────────────────────────

DAY 30 EMAIL:
Subject: "A gift is waiting for you, [Player]"

Hi [Player],

We've been working hard to make [Game Name] even better!

Here's what's new since you've been away:
• [Major Update 1]
• [Major Update 2]
• [Community Milestone]

As a thank you for being part of our community,
we've prepared a special gift just for you:

🎁 [Premium Item] - Yours FREE when you return!

[Claim Your Gift Button]

This gift expires in 7 days. We hope to see you soon!

- The [Game] Team
```

### 8.4 Reactivation Performance Metrics

| Metric | Target | Good | Excellent |
|--------|--------|------|-----------|
| Day 7 return rate | 15% | 20% | 30%+ |
| Day 14 return rate | 10% | 15% | 25%+ |
| Day 30 return rate | 5% | 8% | 15%+ |
| Returning player conversion | 20% | 30% | 40%+ |
| Returning player 30-day retention | 25% | 35% | 45%+ |

---

## 9. Segmentation Implementation Checklist

### Initial Setup

- [ ] Define spending tiers for your game
- [ ] Implement player behavior tracking
- [ ] Set up RFM scoring system
- [ ] Create segment definitions
- [ ] Build personalization engine

### Ongoing Operations

- [ ] Daily: Monitor churn risk scores
- [ ] Weekly: Review segment migration
- [ ] Monthly: Analyze segment performance
- [ ] Quarterly: Refine segment definitions
- [ ] Continuous: A/B test personalization

### Measurement

- [ ] Track conversion by segment
- [ ] Monitor LTV by segment
- [ ] Measure personalization lift
- [ ] Track reactivation success
- [ ] Report VIP health metrics

---

## 10. Summary: Segmentation Best Practices

```
SEGMENTATION PRINCIPLES
═══════════════════════

1. ACTIONABLE
   └─ Every segment should have a distinct strategy

2. MEASURABLE
   └─ Clear criteria for segment membership

3. SUBSTANTIAL
   └─ Segments large enough to matter

4. ACCESSIBLE
   └─ Can reach segments through available channels

5. DIFFERENTIABLE
   └─ Segments respond differently to strategies

6. STABLE (but not static)
   └─ Consistent enough for planning,
      updated as behavior changes
```

---

*Document version: 1.0.0 | Last updated: 2025-01-28 | Agent: Coin (monetization-strategist)*
