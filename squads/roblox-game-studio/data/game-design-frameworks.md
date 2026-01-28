# Game Design Frameworks for Roblox Development

> Comprehensive guide to theoretical frameworks applicable to Roblox game design
> Last Updated: January 2025

---

## 1. MDA Framework (Mechanics-Dynamics-Aesthetics)

### Overview
The MDA Framework, developed by Hunicke, LeBlanc, and Zellner, provides a formal approach to understanding games by breaking them into three interconnected components.

### The Three Components

#### Mechanics
The base components of the game - rules, actions, algorithms, and systems.

**Examples in Roblox:**
- Jumping physics (height, speed, cooldown)
- Health/damage systems
- Currency earning rates
- Inventory limits
- Respawn timers

#### Dynamics
The run-time behavior that emerges when players interact with mechanics.

**Examples in Roblox:**
- Players camping spawn points (from respawn mechanics)
- Trading economies (from item/currency mechanics)
- Speedrunning strategies (from movement mechanics)
- Team coordination (from multiplayer mechanics)

#### Aesthetics
The emotional responses evoked in players (NOT visual aesthetics).

**The 8 Kinds of Fun (Aesthetics):**
| Aesthetic | Description | Roblox Example |
|-----------|-------------|----------------|
| Sensation | Game as sense-pleasure | DOORS atmosphere, visuals |
| Fantasy | Game as make-believe | Brookhaven roleplay |
| Narrative | Game as drama | Story-driven horror games |
| Challenge | Game as obstacle course | Obby games, Tower of Hell |
| Fellowship | Game as social framework | Adopt Me!, social hangouts |
| Discovery | Game as uncharted territory | Exploration games, secrets |
| Expression | Game as self-discovery | Dress to Impress, building |
| Submission | Game as pastime | Idle/clicker games |

### Designer vs Player Perspective

```
DESIGNER PERSPECTIVE (Creates):
Mechanics --> Dynamics --> Aesthetics

PLAYER PERSPECTIVE (Experiences):
Aesthetics <-- Dynamics <-- Mechanics
```

### How to Apply MDA in Roblox

#### Step 1: Define Target Aesthetics
Start with the emotions you want players to feel.

```lua
-- Example: Horror Game Target Aesthetics
local targetAesthetics = {
    primary = "Sensation", -- Fear, tension
    secondary = "Challenge", -- Survival difficulty
    tertiary = "Discovery" -- Finding secrets, learning entities
}
```

#### Step 2: Design Mechanics to Support Aesthetics

**For Sensation (Horror):**
- Low lighting mechanics
- Jumpscare triggers
- Sound cue systems
- Limited visibility

**For Challenge:**
- Permadeath or limited lives
- Time pressure
- Resource scarcity
- Skill-based survival

#### Step 3: Predict and Test Dynamics
Playtest to observe emergent behaviors and adjust mechanics.

### MDA Analysis: Adopt Me!

| Component | Implementation |
|-----------|----------------|
| **Mechanics** | Pet hatching, trading, house building, mini-games |
| **Dynamics** | Pet economy, social trading, collecting behavior |
| **Aesthetics** | Fellowship (social), Expression (customization), Submission (casual play) |

### MDA Analysis: DOORS

| Component | Implementation |
|-----------|----------------|
| **Mechanics** | Room navigation, entity detection, hiding, puzzles |
| **Dynamics** | Learning entity patterns, speedrunning, cooperative survival |
| **Aesthetics** | Sensation (horror), Challenge (survival), Discovery (learning entities) |

---

## 2. Self-Determination Theory (SDT)

### Overview
SDT, developed by Deci and Ryan, identifies three basic psychological needs that drive intrinsic motivation. Games that satisfy these needs create deep, lasting engagement.

### The Three Basic Needs

#### 1. Autonomy
The need to feel that actions are self-chosen and meaningful.

**Roblox Implementation:**
```lua
-- Provide meaningful choices
local characterOptions = {
    classes = {"Warrior", "Mage", "Rogue", "Healer"},
    playstyles = {"Aggressive", "Defensive", "Support"},
    paths = {"Main Quest", "Side Quests", "Free Roam"}
}

-- Let players choose their approach
-- Don't force linear progression
```

**Design Tips:**
- Multiple viable character builds
- Non-linear progression paths
- Customization options with impact
- Optional challenges and content

#### 2. Competence
The need to experience mastery and effectiveness.

**Roblox Implementation:**
```lua
-- Progressive difficulty curve
local difficultyLevels = {
    {name = "Tutorial", challenge = 1, rewards = "Basic"},
    {name = "Easy", challenge = 3, rewards = "Common"},
    {name = "Medium", challenge = 5, rewards = "Uncommon"},
    {name = "Hard", challenge = 8, rewards = "Rare"},
    {name = "Expert", challenge = 10, rewards = "Legendary"}
}

-- Clear feedback on improvement
local function showProgressFeedback(player, skill, oldLevel, newLevel)
    -- Celebrate skill improvement
    -- Show comparison to previous performance
end
```

**Design Tips:**
- Clear skill progression systems
- Difficulty that scales with player ability
- Immediate feedback on actions
- Visible improvement metrics

#### 3. Relatedness
The need for connection and belonging.

**Roblox Implementation:**
```lua
-- Social features
local socialSystems = {
    guilds = true,
    friendsList = true,
    teamChallenges = true,
    tradingSystem = true,
    chatSystem = true,
    emotes = true
}

-- Cooperative mechanics
local function createTeamChallenge(players)
    -- Require coordination
    -- Reward group success
    -- Foster positive interactions
end
```

**Design Tips:**
- Guild/clan systems
- Cooperative challenges
- Trading and gifting
- Shared goals and achievements
- Positive-sum interactions

### SDT Application Matrix

| Need | Game Element | Metric to Track |
|------|--------------|-----------------|
| Autonomy | Choices offered | Path diversity in analytics |
| Competence | Skill ceiling | Player progression rate |
| Relatedness | Social features | Group play percentage |

---

## 3. PENS Model (Player Experience of Need Satisfaction)

### Overview
PENS is the video game-specific application of SDT, developed by Rigby and Ryan. It predicts player motivation and engagement based on need satisfaction.

### PENS Components

#### Competence
- Intuitive controls
- Optimal challenge balance
- Granular difficulty options
- Clear, immediate feedback

#### Autonomy
- Meaningful choices
- Opportunities for self-expression
- Minimal unnecessary constraints
- Player-driven pacing

#### Relatedness
- Connection to game characters
- Multiplayer social features
- Narrative engagement
- Community belonging

#### Presence/Immersion
- Intuitive controls (physical presence)
- Emotional engagement
- Narrative absorption

### PENS Questionnaire Items (For Playtesting)

```
COMPETENCE:
- "I feel competent at the game"
- "I feel very capable and effective"
- "My ability to play is well matched with the game's challenges"

AUTONOMY:
- "The game provides me with interesting options and choices"
- "I experienced a lot of freedom in the game"
- "I did things in the game because they interested me"

RELATEDNESS:
- "I find the relationships I form in this game fulfilling"
- "I feel close to other players"
- "I feel connected to the game characters"

PRESENCE:
- "When playing the game, I feel like I am there"
- "I am not aware of my surroundings"
- "I experience feelings as deeply as in real life"
```

---

## 4. Bartle's Player Types

### Overview
Richard Bartle's taxonomy categorizes players based on their preferred actions and motivations. Originally for MUDs, now widely applicable.

### The Four Types

#### Achievers (Diamonds)
**Motivation:** Points, levels, rewards, completion

**What They Want:**
- Clear progression systems
- Visible achievements
- Leaderboards and rankings
- Collectibles and 100% completion

**Roblox Design for Achievers:**
```lua
-- Achievement system
local achievements = {
    {id = "first_win", name = "First Victory", reward = 100},
    {id = "collector_100", name = "Collector", requirement = 100, reward = 500},
    {id = "max_level", name = "Master", reward = 2000}
}

-- Progression visibility
local function showProgressBar(player, current, max)
    -- Visual progress toward next milestone
end

-- Leaderboard integration
local function updateLeaderboard(player, stat, value)
    -- Global rankings
end
```

#### Explorers (Spades)
**Motivation:** Discovery, secrets, understanding systems

**What They Want:**
- Hidden areas and secrets
- Complex systems to understand
- Lore and backstory
- Easter eggs

**Roblox Design for Explorers:**
```lua
-- Hidden content system
local secrets = {
    hiddenRooms = 15,
    loreItems = 50,
    easterEggs = 10,
    mechanicsToDiscover = 20
}

-- Reward exploration
local function onSecretFound(player, secretId)
    -- Unique rewards for discovery
    -- Track exploration completion
end

-- Deep systems
local function createComplexCrafting()
    -- Multiple ingredients
    -- Rare combinations
    -- Discoverable recipes
end
```

#### Socializers (Hearts)
**Motivation:** Relationships, community, interaction

**What They Want:**
- Chat and communication tools
- Cooperative activities
- Trading and sharing
- Community events

**Roblox Design for Socializers:**
```lua
-- Social features
local socialFeatures = {
    friendSystem = true,
    privateMessaging = true,
    guilds = true,
    emotes = 50,
    customizableHomes = true
}

-- Cooperative mechanics
local function createGroupContent()
    -- Require teamwork
    -- Encourage positive interaction
    -- Shared rewards
end

-- Community spaces
local function designSocialHub()
    -- Central gathering area
    -- Activities for groups
    -- Display of player expression
end
```

#### Killers (Clubs)
**Motivation:** Competition, dominance, PvP

**What They Want:**
- PvP systems
- Rankings and ELO
- Competitive modes
- Ways to demonstrate skill

**Roblox Design for Killers:**
```lua
-- Competitive systems
local competitiveFeatures = {
    rankedMode = true,
    eloSystem = true,
    tournaments = true,
    killLeaderboards = true
}

-- Skill expression
local function enableSkillCeiling()
    -- High skill cap mechanics
    -- Outplay potential
    -- Visible skill difference
end

-- Fair competition
local function matchmaking(player)
    -- Match similar skill levels
    -- Prevent griefing in non-PvP zones
end
```

### Player Type Distribution (Typical)

| Type | Percentage | Design Priority |
|------|------------|-----------------|
| Socializers | 50-60% | High |
| Explorers | 20-30% | Medium |
| Achievers | 10-20% | Medium |
| Killers | 5-10% | Low (but vocal) |

### Balancing for Multiple Types

```lua
-- Multi-type content design
local contentMatrix = {
    mainQuest = {achiever = 5, explorer = 3, socializer = 2, killer = 1},
    pvpArena = {achiever = 3, explorer = 1, socializer = 2, killer = 5},
    socialHub = {achiever = 1, explorer = 2, socializer = 5, killer = 1},
    secretArea = {achiever = 3, explorer = 5, socializer = 2, killer = 1}
}
```

---

## 5. Octalysis Framework

### Overview
Created by Yu-kai Chou, Octalysis identifies 8 core drives that motivate human behavior. It's presented as an octagon, with drives categorized as White Hat (positive) or Black Hat (negative).

### The 8 Core Drives

#### WHITE HAT DRIVES (Top - Positive Motivation)

**1. Epic Meaning & Calling**
Players believe they're doing something greater than themselves.

```lua
-- Roblox Implementation
local epicElements = {
    narrativeGoal = "Save the world from darkness",
    playerRole = "The Chosen One",
    communityGoal = "Collective progress unlocks new areas",
    philanthropy = "In-game charity events"
}
```

**2. Development & Accomplishment**
Sense of progress and skill mastery.

```lua
-- Progression systems
local accomplishment = {
    levelSystem = true,
    skillTrees = true,
    badges = 100,
    milestones = true,
    challengeModes = true
}
```

**3. Empowerment of Creativity & Feedback**
Players express creativity and see results.

```lua
-- Creative expression
local creativity = {
    buildingSystem = true,
    characterCustomization = true,
    userGeneratedContent = true,
    shareMechanics = true
}
```

**4. Ownership & Possession**
Players own and accumulate things.

```lua
-- Ownership mechanics
local ownership = {
    inventory = true,
    collections = true,
    virtualProperty = true,
    tradingSystem = true,
    upgradeSystem = true
}
```

**5. Social Influence & Relatedness**
Social connections and comparisons.

```lua
-- Social features
local social = {
    friendSystem = true,
    guilds = true,
    leaderboards = true,
    mentorship = true,
    socialProof = true
}
```

#### BLACK HAT DRIVES (Bottom - Negative Motivation)

**6. Scarcity & Impatience**
Wanting something because it's rare or limited.

```lua
-- Scarcity mechanics (use ethically)
local scarcity = {
    limitedTimeEvents = true,
    rareItems = true,
    exclusiveRewards = true,
    countdownTimers = true
}
```

**7. Unpredictability & Curiosity**
Not knowing what happens next.

```lua
-- Unpredictability (avoid exploitative gambling)
local unpredictability = {
    mysteryBoxes = true, -- Show odds!
    randomEvents = true,
    proceduralGeneration = true,
    hiddenMechanics = true
}
```

**8. Loss & Avoidance**
Motivation to avoid losing something.

```lua
-- Loss aversion (use carefully)
local avoidance = {
    dailyStreaks = true,
    decayingSystems = false, -- Often frustrating
    limitedInventory = true,
    riskReward = true
}
```

### White Hat vs Black Hat Balance

| Drive Type | Effect | Best Use |
|------------|--------|----------|
| White Hat | Positive, sustainable, fulfilling | Core gameplay loop |
| Black Hat | Urgent, can feel manipulative | Short-term boosts only |

### Octalysis Score Example

```
              Epic Meaning (7)
                    |
   Accomplishment(8)|Social (6)
                 \  |  /
    Creativity(5) \ | / Scarcity(4)
                   \|/
    Ownership(7)----+----Unpredictability(5)
                   /|\
                  / | \
                 /  |  \
            Loss(3) | (empty)
```

---

## 6. Flow Theory (Csikszentmihalyi)

### Overview
Flow is a mental state of complete immersion and energized focus. Games that achieve flow are deeply engaging.

### Flow Requirements

1. **Clear Goals** - Players know what to do
2. **Immediate Feedback** - Players know how they're doing
3. **Challenge-Skill Balance** - Neither too easy nor too hard

### The Flow Channel

```
CHALLENGE
    ^
    |     ANXIETY
    |       /
    |      /
    |     /  FLOW
    |    /   ZONE
    |   /
    |  /
    | / BOREDOM
    |/____________> SKILL
```

### Implementing Flow in Roblox

#### Adaptive Difficulty System

```lua
local FlowManager = {}

function FlowManager:calculateOptimalDifficulty(player)
    local skill = self:estimatePlayerSkill(player)
    local recentPerformance = self:getRecentPerformance(player)

    -- Aim for 70-80% success rate for flow
    local targetSuccessRate = 0.75
    local actualSuccessRate = recentPerformance.successRate

    if actualSuccessRate > 0.85 then
        return skill + 1 -- Increase challenge
    elseif actualSuccessRate < 0.6 then
        return skill - 1 -- Decrease challenge
    else
        return skill -- Maintain current level
    end
end

function FlowManager:estimatePlayerSkill(player)
    return {
        reflexes = self:measureReflexes(player),
        strategy = self:measureStrategy(player),
        knowledge = self:measureKnowledge(player)
    }
end
```

#### Stair-Step Difficulty Curve

```lua
-- Each level slightly harder than the last
-- But new levels start slightly easier than previous level ended
local function designDifficultyCurve()
    local levels = {}
    local baseDifficulty = 1

    for i = 1, 10 do
        levels[i] = {
            start = baseDifficulty + (i-1) * 0.8,  -- Slight reset
            peak = baseDifficulty + i * 1.0,       -- Full challenge
            buffer = 0.2                            -- Safety margin
        }
    end

    return levels
end
```

### Flow State Indicators

| Indicator | Sign | Design Implication |
|-----------|------|-------------------|
| Time Perception | "Hours felt like minutes" | Good flow state |
| Anxiety | "Too hard, frustrated" | Reduce difficulty |
| Boredom | "Too easy, want to quit" | Increase challenge |
| Engagement | "Just one more try" | Optimal flow |

### Common Flow-Breaking Mistakes

1. **Difficulty spikes** - Sudden jumps in challenge
2. **No clear objective** - Players don't know what to do
3. **Delayed feedback** - Players don't know if they're succeeding
4. **Forced waiting** - Timers that break concentration
5. **Mandatory tutorials** - Boring for experienced players

---

## Framework Integration Matrix

| Framework | Primary Focus | Best For |
|-----------|--------------|----------|
| MDA | Game structure | Overall design direction |
| SDT | Player motivation | Retention mechanics |
| PENS | Gaming-specific motivation | Player research |
| Bartle | Player segmentation | Feature prioritization |
| Octalysis | Behavior drivers | Monetization, engagement |
| Flow | Engagement state | Difficulty tuning |

### Using Multiple Frameworks Together

```lua
-- Example: Designing a new feature
local function designFeature(featureName)
    -- Step 1: MDA - What aesthetic are we targeting?
    local targetAesthetic = "Challenge" -- or Fellowship, etc.

    -- Step 2: SDT - Which needs does it satisfy?
    local needsSatisfied = {
        autonomy = 3,    -- 1-5 scale
        competence = 5,
        relatedness = 2
    }

    -- Step 3: Bartle - Which player types will enjoy it?
    local targetTypes = {"Achiever", "Explorer"}

    -- Step 4: Octalysis - Which core drives does it use?
    local coredrives = {"Accomplishment", "Unpredictability"}

    -- Step 5: Flow - How do we maintain the flow channel?
    local flowDesign = {
        adaptiveDifficulty = true,
        clearGoals = true,
        immediateFeedback = true
    }

    return {
        name = featureName,
        aesthetic = targetAesthetic,
        needs = needsSatisfied,
        playerTypes = targetTypes,
        drives = coredrives,
        flow = flowDesign
    }
end
```

---

## References

- Hunicke, R., LeBlanc, M., & Zubek, R. (2004). MDA: A Formal Approach to Game Design
- Deci, E. L., & Ryan, R. M. (2000). Self-Determination Theory
- Rigby, S., & Ryan, R. M. (2011). Glued to Games (PENS Model)
- Bartle, R. (1996). Hearts, Clubs, Diamonds, Spades: Players Who Suit MUDs
- Chou, Y. (2015). Actionable Gamification: Beyond Points, Badges, and Leaderboards
- Csikszentmihalyi, M. (1990). Flow: The Psychology of Optimal Experience
