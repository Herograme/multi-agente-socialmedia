---
title: "Core Loop Patterns - Deep Knowledge"
agent: game-designer
alias: Mecha
category: game-design
version: 1.0.0
last_updated: 2025-01-28
tags: [core-loop, engagement, retention, game-design, patterns]
---

# Core Loop Patterns for Game Design

The core loop is the fundamental cycle of actions that players repeat throughout a game. A well-designed core loop creates compelling, enduring gameplay. This document covers the anatomy of core loops, patterns by genre, and case studies from successful Roblox games.

---

## Table of Contents

1. [Anatomy of a Core Loop](#anatomy-of-a-core-loop)
2. [Core Loop Components](#core-loop-components)
3. [Patterns by Genre](#patterns-by-genre)
4. [Compulsion vs Engagement Loops](#compulsion-vs-engagement-loops)
5. [Session Pacing](#session-pacing)
6. [Hook Moments](#hook-moments)
7. [Roblox Case Studies](#roblox-case-studies)
8. [Designing Your Core Loop](#designing-your-core-loop)

---

## Anatomy of a Core Loop

### The Basic Loop Structure

Every core loop follows a fundamental pattern:

```
    ┌──────────────────────────────────────┐
    │                                      │
    ▼                                      │
┌───────┐      ┌───────┐      ┌───────┐   │
│ACTION │ ───► │REWARD │ ───► │EXPAND │───┘
└───────┘      └───────┘      └───────┘

ACTION: What the player does
REWARD: What the player gets
EXPAND: How capabilities grow
```

### Loop Timing Classifications

| Loop Type | Duration | Examples |
|-----------|----------|----------|
| **Micro Loop** | Seconds | Kill enemy, collect coin |
| **Core Loop** | Minutes | Complete level, finish quest |
| **Meta Loop** | Hours/Days | Prestige, season progress |
| **Macro Loop** | Weeks/Months | Expansion content, long-term goals |

### The Nested Loop Structure

```
┌─────────────────────────────────────────────────┐
│  MACRO LOOP (Seasonal Content)                   │
│  ┌─────────────────────────────────────────┐    │
│  │  META LOOP (Character Progression)       │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │  CORE LOOP (Gameplay Session)    │    │    │
│  │  │  ┌───────────────────────┐      │    │    │
│  │  │  │  MICRO LOOP (Action)  │      │    │    │
│  │  │  └───────────────────────┘      │    │    │
│  │  └─────────────────────────────────┘    │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

---

## Core Loop Components

### 1. The Action Phase

What the player actively does.

```lua
-- Example: Combat action in an RPG
local CombatAction = {}

CombatAction.Types = {
    Immediate = { -- Quick, reactive
        description = "Instant feedback",
        examples = {"Click to attack", "Dodge roll", "Use ability"},
        timing = "< 1 second"
    },
    Short = { -- Quick decision-making
        description = "Tactical choices",
        examples = {"Combo selection", "Target priority", "Position"},
        timing = "1-5 seconds"
    },
    Extended = { -- Longer engagement
        description = "Strategic planning",
        examples = {"Build setup", "Resource allocation", "Team coordination"},
        timing = "5-60 seconds"
    }
}

function CombatAction:Execute(player, actionType, target)
    -- 1. Validate action is possible
    if not self:CanPerformAction(player, actionType) then
        return self:ShowFeedback(player, "Cannot perform action")
    end

    -- 2. Execute with immediate feedback
    local result = self:PerformAction(player, actionType, target)

    -- 3. Visual/audio confirmation
    self:PlayEffects(actionType, result)

    -- 4. Update game state
    self:ApplyResults(result)

    return result
end
```

### 2. The Reward Phase

What the player receives for their action.

```lua
local RewardSystem = {}

RewardSystem.Types = {
    Intrinsic = {
        -- Internal satisfaction
        mastery = "Skill improvement feeling",
        discovery = "Finding something new",
        expression = "Customization, creativity",
        social = "Connection with others"
    },
    Extrinsic = {
        -- External tangible rewards
        currency = "Gold, gems, coins",
        items = "Equipment, consumables",
        progression = "XP, levels, ranks",
        unlocks = "New content access"
    }
}

-- Reward timing matters!
RewardSystem.Timing = {
    Immediate = 0, -- Instant feedback
    Delayed = 1, -- Few seconds delay (builds anticipation)
    Cumulative = 2, -- After multiple actions
    Milestone = 3 -- Major achievements
}

function RewardSystem:GrantReward(player, reward)
    -- Build anticipation
    if reward.timing == self.Timing.Delayed then
        self:PlayAnticipationEffect(player)
        task.wait(1)
    end

    -- Reveal with appropriate fanfare
    local fanfareLevel = self:CalculateFanfare(reward.rarity)
    self:PlayRewardAnimation(player, fanfareLevel)

    -- Grant the actual reward
    self:ApplyReward(player, reward)

    -- Show clear feedback
    self:DisplayRewardUI(player, reward)
end
```

### 3. The Expansion Phase

How capabilities grow to enable new actions.

```lua
local ExpansionSystem = {}

ExpansionSystem.Types = {
    Horizontal = {
        description = "More options, same power level",
        examples = {"New weapons types", "Different playstyles", "More maps"},
        benefit = "Variety, prevents boredom"
    },
    Vertical = {
        description = "Increased power/capability",
        examples = {"Higher stats", "Stronger abilities", "Better gear"},
        benefit = "Sense of growth and achievement"
    },
    Lateral = {
        description = "New systems/mechanics",
        examples = {"Unlock crafting", "Access pets", "Open PvP"},
        benefit = "Fresh experience, renewed engagement"
    }
}

function ExpansionSystem:CheckExpansion(player)
    local expansions = {}

    -- Check for horizontal expansions
    for _, unlock in ipairs(self:GetAvailableUnlocks(player)) do
        if self:MeetsRequirements(player, unlock) then
            table.insert(expansions, unlock)
        end
    end

    -- Check for vertical progression
    local levelUp = self:CheckLevelUp(player)
    if levelUp then
        table.insert(expansions, levelUp)
    end

    -- Check for lateral system unlocks
    local newSystems = self:CheckSystemUnlocks(player)
    for _, system in ipairs(newSystems) do
        table.insert(expansions, system)
    end

    return expansions
end
```

---

## Patterns by Genre

### Simulator Games

The most popular genre on Roblox.

```
Core Loop:
┌──────────┐    ┌──────────┐    ┌──────────┐
│  CLICK/  │───►│ COLLECT  │───►│ UPGRADE  │
│  GATHER  │    │ CURRENCY │    │  TOOLS   │
└──────────┘    └──────────┘    └──────────┘
      ▲                               │
      └───────────────────────────────┘
```

```lua
-- Simulator Core Loop Implementation
local SimulatorLoop = {}

function SimulatorLoop:CreateLoop(config)
    return {
        -- ACTION: Gather resources
        gather = {
            input = config.gatherAction, -- Click, hold, auto
            resource = config.resourceType,
            baseAmount = config.baseGather,
            cooldown = config.gatherCooldown
        },

        -- REWARD: Currency/resources
        reward = {
            currency = config.currencyName,
            multipliers = {"tool", "pet", "rebirth", "gamepass"},
            display = "floating numbers"
        },

        -- EXPAND: Upgrade capabilities
        expand = {
            tools = {
                type = "linear power increase",
                cost = "exponential scaling"
            },
            pets = {
                type = "multiplicative boost",
                acquisition = "eggs/gacha"
            },
            areas = {
                type = "new gathering locations",
                unlock = "currency threshold"
            },
            rebirth = {
                type = "prestige with multiplier",
                reset = "tools and currency",
                keep = "pets and gamepasses"
            }
        }
    }
end

-- Example: Pet Simulator style
local PetSimLoop = SimulatorLoop:CreateLoop({
    gatherAction = "click",
    resourceType = "coins",
    baseGather = 1,
    gatherCooldown = 0.1,
    currencyName = "Coins",
})
```

### Tycoon Games

Build and manage resources.

```
Core Loop:
┌──────────┐    ┌──────────┐    ┌──────────┐
│  BUILD   │───►│  EARN    │───►│  EXPAND  │
│ DROPPER  │    │ PASSIVE  │    │  EMPIRE  │
└──────────┘    └──────────┘    └──────────┘
      ▲                               │
      └───────────────────────────────┘
```

```lua
-- Tycoon Core Loop
local TycoonLoop = {}

function TycoonLoop:CreateLoop()
    return {
        -- ACTION: Purchase and place
        build = {
            unlockOrder = "linear path",
            placement = "predefined spots",
            costScaling = "exponential"
        },

        -- REWARD: Passive income
        income = {
            type = "per-second generation",
            sources = {"droppers", "furnaces", "conveyors"},
            stacking = "additive"
        },

        -- EXPAND: Bigger operations
        expand = {
            upgrades = "efficiency improvements",
            newSections = "unlock new areas",
            rebirth = "reset for multiplier"
        },

        -- HOOKS: Engagement points
        hooks = {
            unlockMessage = "New dropper available!",
            milestoneReward = "Every $1M earned",
            socialCompare = "Leaderboard by income/sec"
        }
    }
end

-- Income calculation
function TycoonLoop:CalculateIncome(tycoon)
    local incomePerSecond = 0

    for _, dropper in ipairs(tycoon.Droppers) do
        local dropValue = dropper.BaseValue * dropper.Level
        local dropsPerSecond = 1 / dropper.Cooldown
        incomePerSecond = incomePerSecond + (dropValue * dropsPerSecond)
    end

    -- Apply multipliers
    incomePerSecond = incomePerSecond * tycoon.GlobalMultiplier

    return incomePerSecond
end
```

### RPG/Adventure Games

Quest-driven progression.

```
Core Loop:
┌──────────┐    ┌──────────┐    ┌──────────┐
│  QUEST   │───►│  COMBAT  │───►│  LOOT    │
│  ACCEPT  │    │  ENGAGE  │    │  GEAR UP │
└──────────┘    └──────────┘    └──────────┘
      ▲                               │
      │         ┌──────────┐          │
      └─────────│  LEVEL   │◄─────────┘
                │    UP    │
                └──────────┘
```

```lua
-- RPG Core Loop
local RPGLoop = {}

function RPGLoop:CreateLoop()
    return {
        -- ACTION: Accept and pursue quest
        quest = {
            types = {"main story", "side quest", "daily", "world event"},
            structure = "objective → travel → challenge → return",
            variety = "kill, collect, escort, discover"
        },

        -- ACTION: Combat engagement
        combat = {
            style = "action or turn-based",
            depth = "skill combos, positioning, timing",
            challenge = "scaled to player level"
        },

        -- REWARD: Equipment and resources
        loot = {
            drops = "randomized with rarity",
            questRewards = "guaranteed specific items",
            currency = "for purchases"
        },

        -- EXPAND: Character growth
        progression = {
            levels = "stat increases",
            skills = "new abilities",
            gear = "equipment upgrades",
            story = "narrative progression"
        }
    }
end

-- Quest completion flow
function RPGLoop:CompleteQuest(player, quest)
    -- 1. Validate completion
    local completed = self:ValidateObjectives(player, quest)
    if not completed then return end

    -- 2. Grant rewards with ceremony
    self:PlayCompletionCinematic(quest)

    for _, reward in ipairs(quest.Rewards) do
        self:GrantReward(player, reward)
    end

    -- 3. Check for level up
    local leveledUp = self:CheckLevelUp(player)
    if leveledUp then
        self:PlayLevelUpCelebration(player)
    end

    -- 4. Present next steps
    local nextQuests = self:GetAvailableQuests(player)
    self:ShowQuestBoard(player, nextQuests)
end
```

### Horror Games

Tension and release cycles.

```
Core Loop:
┌──────────┐    ┌──────────┐    ┌──────────┐
│ EXPLORE  │───►│  THREAT  │───►│  ESCAPE  │
│  AREA    │    │ ENCOUNTER│    │/SURVIVE  │
└──────────┘    └──────────┘    └──────────┘
      ▲                               │
      │         ┌──────────┐          │
      └─────────│  RELIEF  │◄─────────┘
                │  REWARD  │
                └──────────┘
```

```lua
-- Horror Core Loop
local HorrorLoop = {}

function HorrorLoop:CreateLoop()
    return {
        -- ACTION: Careful exploration
        explore = {
            pacing = "slow, deliberate",
            resources = "limited (flashlight, keys)",
            information = "environmental storytelling"
        },

        -- TENSION: Threat appearance
        threat = {
            types = {"stalker", "jumpscare", "environmental hazard"},
            timing = "unpredictable (variable interval)",
            warning = "subtle cues (sound, lighting)"
        },

        -- ACTION: Survival response
        survive = {
            options = {"hide", "run", "solve puzzle"},
            resources = "consume survival items",
            consequence = "death/restart on failure"
        },

        -- REWARD: Safety and progress
        relief = {
            safeZones = "areas free from threat",
            checkpoints = "save progress",
            discoveries = "story revelations"
        }
    }
end

-- Tension pacing system
function HorrorLoop:ManageTension(player)
    local tension = player:GetAttribute("TensionLevel") or 0

    -- Build tension over time in dangerous areas
    if self:IsInDangerZone(player) then
        tension = tension + 0.1 * dt
    else
        tension = tension - 0.2 * dt -- Faster decay in safe zones
    end

    -- Trigger events based on tension
    if tension >= 1.0 then
        self:TriggerThreat(player)
        tension = 0.3 -- Reset but not to zero
    end

    player:SetAttribute("TensionLevel", math.clamp(tension, 0, 1))
end
```

### Obby/Platformer Games

Skill-based progression.

```
Core Loop:
┌──────────┐    ┌──────────┐    ┌──────────┐
│ ATTEMPT  │───►│ SUCCESS  │───►│  NEXT    │
│ OBSTACLE │    │ OR FAIL  │    │  STAGE   │
└──────────┘    └──────────┘    └──────────┘
      ▲                               │
      │    ┌──────────────────────┐   │
      └────│  CHECKPOINT/REWARD  │◄───┘
           └──────────────────────┘
```

```lua
-- Obby Core Loop
local ObbyLoop = {}

function ObbyLoop:CreateLoop()
    return {
        -- ACTION: Attempt challenge
        attempt = {
            input = "precise timing/movement",
            skill = "pattern recognition, reflexes",
            feedback = "immediate (success/fall)"
        },

        -- OUTCOME: Binary result
        outcome = {
            success = "proceed to next obstacle",
            failure = "respawn at checkpoint",
            punishment = "time loss, stage restart"
        },

        -- REWARD: Progress and achievement
        progress = {
            checkpoints = "every N obstacles",
            stages = "themed sections",
            completion = "win screen, badge"
        },

        -- EXPAND: Difficulty escalation
        expand = {
            newMechanics = "introduce new obstacle types",
            combination = "combine learned skills",
            speed = "faster timing requirements"
        }
    }
end

-- Difficulty curve
function ObbyLoop:GetObstacleDifficulty(stageNumber, obstacleIndex)
    -- Base difficulty increases with stage
    local baseDifficulty = stageNumber * 0.5

    -- Oscillate within stage (easy start, hard end)
    local stageProgress = obstacleIndex / OBSTACLES_PER_STAGE
    local inStageModifier = math.sin(stageProgress * math.pi) * 0.3

    return baseDifficulty + inStageModifier
end
```

### Fighting/Battle Games

Competitive engagement.

```
Core Loop:
┌──────────┐    ┌──────────┐    ┌──────────┐
│  QUEUE/  │───►│  FIGHT   │───►│  RESULT  │
│  MATCH   │    │  BATTLE  │    │  REWARD  │
└──────────┘    └──────────┘    └──────────┘
      ▲                               │
      │         ┌──────────┐          │
      └─────────│  READY   │◄─────────┘
                │   NEXT   │
                └──────────┘
```

```lua
-- Battle Core Loop
local BattleLoop = {}

function BattleLoop:CreateLoop()
    return {
        -- PREPARE: Matchmaking and loadout
        prepare = {
            matchmaking = "skill-based (MMR/ELO)",
            loadout = "character/weapon selection",
            waiting = "queue time optimization"
        },

        -- ACTION: Active combat
        fight = {
            duration = "2-5 minutes optimal",
            depth = "skill expression",
            comeback = "rubber banding mechanics"
        },

        -- REWARD: Results and progression
        result = {
            win = "significant reward, rank up",
            loss = "smaller reward, learning",
            draw = "moderate reward"
        },

        -- EXPAND: Skill and collection
        expand = {
            ranking = "visible skill progression",
            unlocks = "new characters/weapons",
            cosmetics = "customization options"
        }
    }
end

-- Match flow
function BattleLoop:RunMatch(players)
    -- 1. Character selection (30 seconds)
    self:CharacterSelectPhase(players, 30)

    -- 2. Loading/transition
    self:TransitionToArena(players)

    -- 3. Countdown
    self:Countdown(3)

    -- 4. Main battle
    local result = self:RunBattle(players, {
        timeLimit = 180, -- 3 minutes
        stockCount = 3, -- Lives
        suddenDeath = true
    })

    -- 5. Results celebration
    self:ShowResults(result)

    -- 6. Quick rematch option
    self:OfferRematch(players)
end
```

---

## Compulsion vs Engagement Loops

Understanding the ethical difference.

### Compulsion Loops (Problematic)

```lua
-- WARNING: Example of problematic design patterns
local CompulsionLoop = {
    characteristics = {
        "Exploits psychological vulnerabilities",
        "Players feel compelled, not choosing",
        "Regret after playing",
        "Interference with real life"
    },

    patterns = {
        -- Artificial urgency
        fomo = "Limited time offers that aren't limited",

        -- Incomplete feedback
        nearMiss = "Slot machine near-wins",

        -- Sunk cost exploitation
        sunkCost = "You've come so far, just one more...",

        -- Social pressure
        socialPressure = "Your friends are ahead of you!"
    }
}
```

### Engagement Loops (Ethical)

```lua
-- GOOD: Ethical engagement design
local EngagementLoop = {}

function EngagementLoop:Design()
    return {
        characteristics = {
            "Players actively choose to engage",
            "Clear value exchange",
            "Satisfying stopping points",
            "Enhances rather than interferes with life"
        },

        patterns = {
            -- Genuine skill development
            mastery = self:CreateMasteryPath(),

            -- Meaningful social connection
            social = self:CreateCommunityFeatures(),

            -- Honest progression
            progression = self:CreateFairProgression(),

            -- Respectful time investment
            respect = self:CreatePlaytimeRespect()
        }
    }
end

function EngagementLoop:CreateMasteryPath()
    return {
        -- Skills that transfer to life
        skillDevelopment = {
            timing = "improves reflexes",
            strategy = "develops planning",
            social = "teamwork skills"
        },

        -- Clear improvement visibility
        feedback = {
            personalBests = true,
            skillRatings = true,
            replayAnalysis = true
        },

        -- Achievable goals
        goals = {
            shortTerm = "this session",
            mediumTerm = "this week",
            longTerm = "this month"
        }
    }
end

function EngagementLoop:CreatePlaytimeRespect()
    return {
        -- Natural stopping points
        sessionDesign = {
            clearEndings = "levels/matches end cleanly",
            progressSaved = "never lose progress",
            noCliffhangers = "don't manipulate to continue"
        },

        -- Break reminders
        wellbeing = {
            breakReminders = {60, 120, 180}, -- minutes
            noPenalties = "no punishment for breaks",
            catchup = "easy to resume later"
        }
    }
end
```

### Comparison Table

| Aspect | Compulsion Loop | Engagement Loop |
|--------|-----------------|-----------------|
| Player state | Anxious, compelled | Curious, satisfied |
| Stopping | Difficult, guilt | Easy, accomplishment |
| After session | Regret | Fulfillment |
| Life impact | Negative | Positive/neutral |
| Retention method | Manipulation | Genuine value |
| Long-term result | Burnout, churn | Loyalty, advocacy |

---

## Session Pacing

How to structure a play session.

### The Ideal Session Arc

```
Engagement
    ▲
    │           ╱╲     ╱╲
    │      Peak│  ╲   │  ╲    Peak
    │    ╱     │   ╲  │   ╲
    │   │      │    ╲ │    ╲
    │  │       │     ╲│     ╲
    │ │        │               Natural
    │Hook      │               Exit Point
    │          │
    └──────────────────────────────────────→ Time
      0-30s   5-10min        20-30min
```

### Session Components

```lua
local SessionPacing = {}

function SessionPacing:DesignSession(targetDuration)
    local session = {
        -- HOOK: First 30 seconds
        hook = {
            duration = 30,
            goal = "immediate engagement",
            elements = {
                "instant action availability",
                "daily reward claim",
                "what's new notification",
                "friend activity"
            }
        },

        -- RISING ACTION: 5-10 minutes
        rising = {
            duration = targetDuration * 0.3,
            goal = "build investment",
            elements = {
                "quick wins",
                "progress toward goals",
                "increasing challenge"
            }
        },

        -- CLIMAX: Variable
        climax = {
            duration = targetDuration * 0.4,
            goal = "peak engagement",
            elements = {
                "boss fights",
                "major discoveries",
                "achievement unlocks"
            }
        },

        -- RESOLUTION: 5-10 minutes
        resolution = {
            duration = targetDuration * 0.2,
            goal = "satisfying conclusion",
            elements = {
                "reward collection",
                "progress summary",
                "teaser for next session"
            }
        },

        -- EXIT: Clean stopping point
        exitPoint = {
            duration = 60, -- 1 minute
            goal = "guilt-free departure",
            elements = {
                "progress saved confirmation",
                "next goal preview",
                "return incentive (not pressure)"
            }
        }
    }

    return session
end
```

### Multi-Session Pacing

```lua
-- Pacing across days/weeks
local LongTermPacing = {}

function LongTermPacing:DesignWeek()
    return {
        Monday = {
            theme = "fresh start",
            content = "weekly reset, new challenges"
        },
        Tuesday = {
            theme = "progression",
            content = "continue weekly goals"
        },
        Wednesday = {
            theme = "midweek event",
            content = "special limited event"
        },
        Thursday = {
            theme = "social",
            content = "guild/team activities"
        },
        Friday = {
            theme = "competitive",
            content = "tournament/ranked push"
        },
        Saturday = {
            theme = "exploration",
            content = "new content drop"
        },
        Sunday = {
            theme = "completion",
            content = "finish weekly goals, prepare for reset"
        }
    }
end
```

---

## Hook Moments

Critical engagement points.

### First-Time User Experience (FTUE)

```lua
local FTUE = {}

function FTUE:DesignFirstSession()
    return {
        -- 0-10 seconds: First impression
        impression = {
            visuals = "polished, inviting",
            audio = "engaging music",
            action = "player can DO something immediately"
        },

        -- 10-60 seconds: First success
        firstSuccess = {
            task = "trivially easy challenge",
            reward = "immediate feedback",
            feeling = "I can do this!"
        },

        -- 1-5 minutes: Core loop introduction
        coreIntro = {
            teach = "basic mechanics only",
            dont = "overwhelm with systems",
            goal = "understand the main activity"
        },

        -- 5-15 minutes: First meaningful achievement
        firstAchievement = {
            milestone = "complete tutorial/first level",
            reward = "significant for early game",
            unlock = "access to more content"
        },

        -- 15-30 minutes: Hook for return
        returnHook = {
            glimpse = "show what's possible",
            goal = "set short-term objective",
            incentive = "reason to come back"
        }
    }
end
```

### Return User Hooks

```lua
local ReturnHooks = {}

function ReturnHooks:OnPlayerJoin(player)
    local hooks = {}

    -- 1. Welcome back acknowledgment
    table.insert(hooks, self:CreateWelcomeBack(player))

    -- 2. Progress since last visit
    local offlineProgress = self:CalculateOfflineProgress(player)
    if offlineProgress then
        table.insert(hooks, self:ShowOfflineRewards(offlineProgress))
    end

    -- 3. Daily rewards
    if self:CanClaimDaily(player) then
        table.insert(hooks, self:CreateDailyReward(player))
    end

    -- 4. What's new
    local newContent = self:GetNewContentSince(player.LastVisit)
    if #newContent > 0 then
        table.insert(hooks, self:ShowWhatsNew(newContent))
    end

    -- 5. Friend activity
    local friendActivity = self:GetFriendActivity(player)
    if #friendActivity > 0 then
        table.insert(hooks, self:ShowFriendActivity(friendActivity))
    end

    -- 6. Continue where left off
    local lastActivity = self:GetLastActivity(player)
    if lastActivity then
        table.insert(hooks, self:CreateContinuePrompt(lastActivity))
    end

    return hooks
end
```

### Achievement Hooks

```lua
local AchievementHooks = {}

function AchievementHooks:Design()
    return {
        -- Near-completion hooks
        nearComplete = {
            trigger = "90% progress on any goal",
            message = "So close! Just X more to go!",
            purpose = "motivate completion"
        },

        -- Streak hooks
        streaks = {
            trigger = "daily login streaks",
            message = "Day X streak! Don't break it!",
            grace = "24-48 hour protection for long streaks"
        },

        -- Discovery hooks
        discovery = {
            trigger = "player enters new area",
            message = "You discovered X! 5 more secrets here...",
            purpose = "encourage exploration"
        },

        -- Social hooks
        social = {
            trigger = "friend achieves something",
            message = "Your friend just got X!",
            purpose = "positive competition"
        },

        -- Mastery hooks
        mastery = {
            trigger = "skill improvement detected",
            message = "Your combo accuracy improved 15%!",
            purpose = "acknowledge growth"
        }
    }
end
```

---

## Roblox Case Studies

### Case Study 1: Adopt Me!

**Genre:** Pet collection/life simulation

```lua
-- Adopt Me Core Loop Analysis
local AdoptMeAnalysis = {
    coreLoop = {
        action = "Hatch/raise pets, trade with players",
        reward = "New pets, customization items",
        expand = "Pet collection, house building, social status"
    },

    successFactors = {
        socialTrading = "Trading creates player-driven economy",
        regularUpdates = "New pets maintain freshness",
        accessibleGameplay = "Simple mechanics for young audience",
        emotionalConnection = "Caring for pets creates attachment"
    },

    loopTiming = {
        micro = "Pet interactions (seconds)",
        core = "Hatching eggs (minutes)",
        meta = "Completing pet collection (days/weeks)",
        macro = "Event exclusive pets (seasonal)"
    },

    monetization = {
        integration = "Robux speeds up egg hatching, special pets",
        balance = "Free players can access everything, just slower"
    }
}
```

### Case Study 2: Blox Fruits

**Genre:** Combat RPG

```lua
-- Blox Fruits Core Loop Analysis
local BloxFruitsAnalysis = {
    coreLoop = {
        action = "Combat enemies, complete quests",
        reward = "XP, Beli (currency), Devil Fruits",
        expand = "Level up, new areas, stronger abilities"
    },

    successFactors = {
        cleraProgression = "Always know what level to target",
        powerFantasy = "Dramatic ability upgrades",
        socialPvP = "Open world PvP creates excitement",
        onepiece = "Popular IP inspiration (without copyright)"
    },

    loopTiming = {
        micro = "Kill enemies (seconds)",
        core = "Complete quest chains (10-30 minutes)",
        meta = "Reach new sea/area (hours)",
        macro = "Max level, rare fruits (weeks/months)"
    },

    retentionMechanics = {
        fruitHunting = "Random spawns create return visits",
        dailyChallenges = "Daily objectives",
        pvpRankings = "Competitive leaderboards"
    }
}
```

### Case Study 3: Tower of Hell

**Genre:** Obby

```lua
-- Tower of Hell Core Loop Analysis
local TowerOfHellAnalysis = {
    coreLoop = {
        action = "Navigate randomized obby tower",
        reward = "Reach top, coins, badges",
        expand = "Skill improvement, cosmetics"
    },

    successFactors = {
        proceduralGeneration = "Every tower is different",
        shortSessions = "Tower resets every few minutes",
        spectatorFun = "Watching others fail is entertaining",
        lowBarrier = "Easy to understand, hard to master"
    },

    loopTiming = {
        micro = "Each obstacle (seconds)",
        core = "Complete one tower (2-5 minutes)",
        meta = "Skill progression (subjective)",
        macro = "Collect all badges (long-term)"
    },

    pureEngagement = {
        noMonetization = "Minimal pay-to-win",
        skillBased = "Pure skill determines success",
        fairness = "Same tower for everyone"
    }
}
```

### Case Study 4: Murder Mystery 2

**Genre:** Social deduction

```lua
-- Murder Mystery 2 Core Loop Analysis
local MM2Analysis = {
    coreLoop = {
        action = "Play rounds as Innocent/Sheriff/Murderer",
        reward = "Coins, survive/win",
        expand = "Knife collection, trading"
    },

    successFactors = {
        socialDynamics = "Each round is different due to players",
        quickRounds = "Fast gameplay loop",
        tradingEconomy = "Knives have real perceived value",
        roleVariety = "Three distinct experiences"
    },

    loopTiming = {
        micro = "Moment-to-moment survival (seconds)",
        core = "Single round (2-5 minutes)",
        meta = "Knife collection (ongoing)",
        macro = "Rare knife acquisition (long-term)"
    },

    communityDriven = {
        trading = "Player-driven knife economy",
        content = "YouTuber influence",
        social = "Playing with friends"
    }
}
```

---

## Designing Your Core Loop

### Step-by-Step Process

```lua
local CoreLoopDesign = {}

function CoreLoopDesign:CreateLoop(concept)
    local loop = {}

    -- STEP 1: Define the core fantasy
    loop.fantasy = {
        question = "What does the player want to BE/DO/FEEL?",
        answer = concept.fantasy,
        examples = {
            "Be a powerful wizard",
            "Build the biggest empire",
            "Survive against impossible odds"
        }
    }

    -- STEP 2: Identify the core action
    loop.action = {
        question = "What is the MAIN thing players do?",
        criteria = {
            intrinsicallyFun = "Fun even without rewards",
            depthPotential = "Can improve at it",
            repeatability = "Worth doing 1000+ times"
        },
        answer = concept.coreAction
    }

    -- STEP 3: Define immediate feedback
    loop.feedback = {
        question = "How does player know they did well?",
        types = {
            audio = "Satisfying sounds",
            visual = "Effects, animations",
            progression = "Numbers going up",
            narrative = "Story advancement"
        },
        answer = concept.feedback
    }

    -- STEP 4: Create reward structure
    loop.rewards = {
        question = "What tangible progress is made?",
        layers = {
            immediate = "Every action",
            shortTerm = "Every few minutes",
            mediumTerm = "Every session",
            longTerm = "Over days/weeks"
        },
        answer = concept.rewards
    }

    -- STEP 5: Design expansion paths
    loop.expansion = {
        question = "How do capabilities grow?",
        types = {
            horizontal = "More options",
            vertical = "More power",
            lateral = "New systems"
        },
        answer = concept.expansion
    }

    -- STEP 6: Validate the loop
    loop.validation = self:ValidateLoop(loop)

    return loop
end

function CoreLoopDesign:ValidateLoop(loop)
    local checks = {
        -- Is the action fun without rewards?
        intrinsicValue = self:TestWithoutRewards(loop.action),

        -- Is feedback immediate and clear?
        feedbackClarity = self:TestFeedbackTiming(loop.feedback),

        -- Do rewards feel earned?
        rewardValue = self:TestRewardPerception(loop.rewards),

        -- Is there always something to work toward?
        progressionClarity = self:TestProgressionVisibility(loop.expansion),

        -- Does the loop respect player time?
        timeRespect = self:TestSessionQuality(loop)
    }

    return checks
end
```

### Core Loop Testing Checklist

```markdown
## Core Loop Validation Checklist

### Action Quality
- [ ] Is the basic action satisfying to perform?
- [ ] Can players express skill through the action?
- [ ] Is there variety in how the action can be performed?
- [ ] Does the action fit the core fantasy?

### Feedback Quality
- [ ] Is feedback immediate (< 100ms)?
- [ ] Is success/failure clear?
- [ ] Does feedback scale with significance?
- [ ] Are there no dead moments?

### Reward Quality
- [ ] Are rewards proportional to effort?
- [ ] Is there variety in reward types?
- [ ] Do rewards enable new actions?
- [ ] Is the reward schedule appropriate?

### Progression Quality
- [ ] Is progress always visible?
- [ ] Are there short, medium, and long-term goals?
- [ ] Does progression feel meaningful?
- [ ] Can players return after absence?

### Session Quality
- [ ] Is there a clear hook in first 30 seconds?
- [ ] Are there satisfying stopping points?
- [ ] Does each session feel complete?
- [ ] Is there a reason to return?

### Ethical Quality
- [ ] Is the loop engagement (not compulsion)?
- [ ] Can players stop without guilt?
- [ ] Is monetization fair?
- [ ] Does the game respect player time?
```

---

## Summary

### Core Loop Essentials

1. **Simple to understand, deep to master**
2. **Immediate feedback on all actions**
3. **Clear progression at multiple timescales**
4. **Satisfying stopping points**
5. **Ethical engagement, not compulsion**

### By Genre Quick Reference

| Genre | Core Action | Primary Reward | Key Expansion |
|-------|-------------|----------------|---------------|
| Simulator | Gather/Click | Currency | Multipliers |
| Tycoon | Build/Place | Passive income | New areas |
| RPG | Quest/Combat | XP/Loot | Levels/Gear |
| Horror | Explore/Survive | Progress/Safety | Story |
| Obby | Navigate | Completion | Difficulty |
| Fighting | Battle | Ranking | Skills/Characters |

---

*This document is part of the Game Designer (Mecha) knowledge base for the Roblox Game Studio squad.*
