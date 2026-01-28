---
title: "Level Design for Roblox - Deep Knowledge"
agent: game-designer
alias: Mecha
category: level-design
version: 1.0.0
last_updated: 2025-01-28
tags: [level-design, environment, pacing, roblox-studio, world-building]
---

# Level Design Principles for Roblox

Level design is the art of creating spaces that guide, challenge, and engage players. In Roblox, effective level design can make the difference between a forgettable game and an unforgettable experience. This document covers fundamental principles and practical techniques for designing compelling game spaces.

---

## Table of Contents

1. [Principles of Level Design](#principles-of-level-design)
2. [Guiding Player Attention](#guiding-player-attention)
3. [Pacing and Difficulty](#pacing-and-difficulty)
4. [Environmental Storytelling](#environmental-storytelling)
5. [Spawn and Flow Design](#spawn-and-flow-design)
6. [Obstacles and Rewards](#obstacles-and-rewards)
7. [Roblox Studio Tools](#roblox-studio-tools)
8. [Level Design Checklist](#level-design-checklist)

---

## Principles of Level Design

### The Three Pillars

Every good level serves three purposes:

```
         ┌─────────────────┐
         │   GAMEPLAY      │
         │  (Fun to play)  │
         └────────┬────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌───────┐   ┌───────────┐   ┌───────┐
│CLARITY│   │ CHALLENGE │   │BEAUTY │
│(Clear)│   │(Engaging) │   │(Pretty)│
└───────┘   └───────────┘   └───────┘
```

### Principle 1: Clarity

Players should always know:
- Where they are
- Where they can go
- What they should do

```lua
-- Example: Clear landmark system
local LandmarkSystem = {}

function LandmarkSystem:CreateLandmark(config)
    local landmark = {
        name = config.name,
        position = config.position,
        purpose = config.purpose,

        -- Visual distinctiveness
        visual = {
            height = "Taller than surroundings",
            color = "Unique, memorable color",
            silhouette = "Recognizable from distance",
            lighting = "Well-lit or self-illuminated"
        },

        -- Visibility requirements
        visibility = {
            sightlines = "Visible from multiple angles",
            distance = "Can be seen from 500+ studs",
            obstruction = "No blocking terrain"
        }
    }

    return landmark
end

-- Landmark purposes
LandmarkSystem.Purposes = {
    Navigation = "Helps players orient themselves",
    Objective = "Marks quest/goal location",
    SafeZone = "Indicates rest area",
    Danger = "Warns of difficult area",
    Reward = "Teases valuable content"
}
```

### Principle 2: Challenge

The level should test player skills appropriately.

```lua
-- Challenge calibration
local ChallengePrinciples = {
    -- Teach before test
    introduction = {
        phase1 = "Show the mechanic in a safe environment",
        phase2 = "Let player try with low stakes",
        phase3 = "Test with real consequences"
    },

    -- Escalation
    progression = {
        start = "Easy to build confidence",
        middle = "Introduce complications",
        climax = "Combine all learned skills",
        resolution = "Rewarding conclusion"
    },

    -- Fairness
    fairness = {
        visible = "All dangers are visible",
        consistent = "Mechanics work the same way",
        recoverable = "Mistakes are survivable",
        learnable = "Patterns can be recognized"
    }
}
```

### Principle 3: Beauty

Aesthetics support gameplay and create atmosphere.

```lua
-- Visual hierarchy principles
local VisualHierarchy = {
    -- Most important elements stand out
    importance = {
        critical = "Brightest, most contrasting",
        important = "Notable but not overwhelming",
        background = "Subtle, supporting role"
    },

    -- Color usage
    color = {
        gameplay = "Reserve certain colors for gameplay elements",
        enemies = "Consistent enemy color language",
        rewards = "Gold/bright for valuables",
        danger = "Red for hazards"
    },

    -- Lighting
    lighting = {
        focus = "Light draws attention",
        mood = "Color sets emotional tone",
        guidance = "Lit paths feel safer"
    }
}
```

---

## Guiding Player Attention

### Visual Composition

The "Mickey Mouse" technique - arrange key elements in recognizable patterns.

```
                    ┌───┐
                    │ A │ ← Primary Focus
                    └───┘
                  /       \
              ┌───┐       ┌───┐
              │ B │       │ C │ ← Secondary Elements
              └───┘       └───┘

Players naturally look at "A" first, then scan to B and C
```

### Leading Lines

Use environmental geometry to guide the eye.

```lua
-- Leading line types
local LeadingLines = {
    -- Paths and roads
    paths = {
        description = "Literal paths guide physically and visually",
        implementation = "Paved roads, dirt trails, carpet runners"
    },

    -- Architecture
    architecture = {
        description = "Building edges and features create lines",
        implementation = "Roof edges, columns, arches pointing to goals"
    },

    -- Lighting
    lighting = {
        description = "Series of lights create implicit path",
        implementation = "Streetlights, torches, glowing objects"
    },

    -- Terrain
    terrain = {
        description = "Natural features direct flow",
        implementation = "Rivers, cliffs, mountain ridges"
    },

    -- Props
    props = {
        description = "Arranged objects suggest direction",
        implementation = "Arrow-like arrangements, pointing statues"
    }
}

-- Implementation example
local function createLightPath(startPos, endPos, count)
    local lights = {}
    local direction = (endPos - startPos).Unit

    for i = 0, count - 1 do
        local t = i / (count - 1)
        local position = startPos:Lerp(endPos, t)

        local light = Instance.new("Part")
        light.Position = position
        light.Size = Vector3.new(2, 4, 2)
        light.BrickColor = BrickColor.new("Bright yellow")

        local pointLight = Instance.new("PointLight")
        pointLight.Range = 20
        pointLight.Brightness = 2
        pointLight.Parent = light

        light.Parent = workspace.LightPath
        table.insert(lights, light)
    end

    return lights
end
```

### Weenies (Distant Attractors)

Named after Disneyland's use of castle spires visible throughout the park.

```lua
-- Weenie design principles
local WeenieDesign = {}

function WeenieDesign:Create(config)
    return {
        -- Size and scale
        scale = {
            requirement = "Significantly larger than surroundings",
            ratio = "At least 2-3x taller than nearby structures",
            example = config.size or Vector3.new(50, 200, 50)
        },

        -- Visibility
        visibility = {
            sightlines = "Clear view from player spawn",
            distance = "Visible from anywhere in zone",
            obstruction = "Towers above obstacles"
        },

        -- Distinctiveness
        distinctiveness = {
            silhouette = "Unique profile, recognizable from any angle",
            color = "Stands out from environment palette",
            lighting = "Well-lit or emits light"
        },

        -- Meaning
        meaning = {
            purpose = config.purpose, -- "Goal", "Hub", "Mystery"
            reward = config.reward, -- What player finds there
            journey = config.journey -- How they reach it
        }
    }
end

-- Example: Create a tower weenie
local CastleTower = WeenieDesign:Create({
    size = Vector3.new(40, 150, 40),
    purpose = "Final boss location",
    reward = "Epic loot and story conclusion",
    journey = "Must traverse three zones to reach"
})
```

### Breadcrumbing

Scatter rewards to guide players along the intended path.

```lua
-- Breadcrumb system
local BreadcrumbSystem = {}

function BreadcrumbSystem:PlaceBreadcrumbs(path, config)
    local breadcrumbs = {}

    for i, position in ipairs(path) do
        local crumb = {
            position = position,
            type = self:DetermineCrumbType(i, #path, config)
        }

        -- Every crumb should be visible from previous crumb
        if i > 1 then
            local prevPos = path[i - 1]
            crumb.visibleFrom = self:VerifyVisibility(prevPos, position)
        end

        table.insert(breadcrumbs, crumb)
    end

    return breadcrumbs
end

function BreadcrumbSystem:DetermineCrumbType(index, total, config)
    local progress = index / total

    if progress < 0.25 then
        return "small" -- Coins, common items
    elseif progress < 0.75 then
        return "medium" -- Health, ammo, keys
    else
        return "large" -- Treasure, power-ups
    end
end

BreadcrumbSystem.Types = {
    small = {value = 10, model = "Coin", sparkle = true},
    medium = {value = 50, model = "Gem", glow = true},
    large = {value = 200, model = "Chest", fanfare = true}
}
```

---

## Pacing and Difficulty

### The Intensity Graph

Plan your level's emotional journey.

```
Intensity
    ▲
    │        ┌──┐
    │        │  │    ┌──────┐
    │   ┌──┐ │  │    │      │
    │   │  │ │  │ ┌──┤      │
    │───┤  └─┘  └─┘  │      └───
    │   │            │
    │   │            │
    └───┴────────────┴──────────► Time
        ↑    ↑   ↑   ↑
     Tutorial Combat Boss Rest
              Arena
```

### Pacing Principles

```lua
local PacingPrinciples = {}

-- The Rule of Three
PacingPrinciples.RuleOfThree = {
    principle = "Introduce, reinforce, challenge",
    application = {
        intro = "Show mechanic in isolation",
        reinforce = "Use mechanic with minor twist",
        challenge = "Combine with other mechanics"
    }
}

-- Rest Points
PacingPrinciples.RestPoints = {
    principle = "Recovery between intensity peaks",
    application = {
        frequency = "Every 3-5 minutes of intense gameplay",
        features = {
            "Safe from enemies",
            "Health/resource recovery",
            "Optional exploration",
            "Story/lore delivery"
        }
    }
}

-- Difficulty Curves
PacingPrinciples.DifficultyCurves = {
    linear = {
        description = "Steady increase",
        useCase = "Short levels, skill-based games"
    },
    stepped = {
        description = "Plateaus with jumps",
        useCase = "Zone-based games, tutorials"
    },
    sawtooth = {
        description = "Peaks and valleys",
        useCase = "Long sessions, story games"
    },
    exponential = {
        description = "Slow start, fast end",
        useCase = "Arcade games, time attacks"
    }
}
```

### Zone Design

Break levels into distinct zones with clear identities.

```lua
local ZoneDesign = {}

function ZoneDesign:CreateZone(config)
    return {
        -- Identity
        identity = {
            name = config.name,
            theme = config.theme, -- "Forest", "Dungeon", etc.
            mood = config.mood, -- "Peaceful", "Tense", etc.
            palette = config.colors
        },

        -- Gameplay
        gameplay = {
            challengeType = config.challenge, -- "Combat", "Puzzle", "Exploration"
            difficulty = config.difficulty, -- 1-10
            mechanics = config.mechanics, -- What skills are tested
            duration = config.duration -- Expected time
        },

        -- Flow
        flow = {
            entrances = config.entrances, -- How player arrives
            exits = config.exits, -- Where player can go next
            shortcuts = config.shortcuts -- Unlockable paths
        },

        -- Rewards
        rewards = {
            exploration = config.hiddenRewards,
            completion = config.completionReward,
            mastery = config.masteryReward -- For speedruns, no-damage, etc.
        }
    }
end

-- Example zone layout
local ForestZone = ZoneDesign:CreateZone({
    name = "Whispering Woods",
    theme = "Enchanted Forest",
    mood = "Mysterious but welcoming",
    colors = {"ForestGreen", "Brown", "DarkGreen"},
    challenge = "Exploration",
    difficulty = 2,
    mechanics = {"Basic combat", "Jumping"},
    duration = "15-20 minutes",
    entrances = {"Main path from village"},
    exits = {"Cave to dungeon", "Bridge to mountains"},
    shortcuts = {"Tree hollow (unlocked after boss)"},
    hiddenRewards = {"3 treasure chests", "1 secret area"},
    completionReward = "Forest Key",
    masteryReward = "Speed Runner badge"
})
```

### Difficulty Communication

Tell players what they're getting into.

```lua
-- Visual difficulty indicators
local DifficultyIndicators = {
    -- Environmental cues
    environmental = {
        easy = {
            lighting = "Bright, warm",
            music = "Upbeat, calm",
            enemies = "Few, passive",
            hazards = "Clearly marked"
        },
        medium = {
            lighting = "Normal, some shadows",
            music = "Active, alert",
            enemies = "Present, aggressive",
            hazards = "Some hidden"
        },
        hard = {
            lighting = "Dark, threatening",
            music = "Tense, urgent",
            enemies = "Many, deadly",
            hazards = "Numerous, subtle"
        }
    },

    -- Explicit markers
    explicit = {
        gates = "Skull symbols increase with difficulty",
        npcs = "Warnings from friendly characters",
        signs = "Danger level posted",
        levelRequirements = "Recommended level displayed"
    }
}
```

---

## Environmental Storytelling

### Show, Don't Tell

Let the environment communicate story.

```lua
local EnvironmentalStorytelling = {}

EnvironmentalStorytelling.Techniques = {
    -- Aftermath scenes
    aftermath = {
        description = "Show results of events, not the events themselves",
        examples = {
            "Broken furniture suggests a struggle",
            "Scorch marks indicate a fire",
            "Empty food containers show someone lived here"
        }
    },

    -- Personal items
    personalItems = {
        description = "Objects reveal character without dialogue",
        examples = {
            "Child's toy shows a family lived here",
            "Medical supplies indicate illness",
            "Weapons cache suggests preparation for conflict"
        }
    },

    -- Contrast
    contrast = {
        description = "Juxtapose elements to create meaning",
        examples = {
            "Luxury items in a prison cell",
            "Children's drawings in a war zone",
            "Nature reclaiming technology"
        }
    },

    -- Progression
    progression = {
        description = "Show change over time/space",
        examples = {
            "Buildings become more damaged as you progress",
            "Evidence of civilization decreases in wilderness",
            "Technology advances in different areas"
        }
    }
}

-- Implementation example
function EnvironmentalStorytelling:CreateAbandonedRoom()
    local storyElements = {
        -- What happened here?
        {
            object = "OverturneTable",
            story = "Hasty departure or struggle"
        },
        {
            object = "HalfEatenFood",
            story = "Left suddenly, during a meal"
        },
        {
            object = "PackedBag",
            story = "Planned to leave but didn't make it"
        },
        {
            object = "CalendarWithDate",
            story = "Timeline for when this happened"
        },
        {
            object = "FamilyPhoto",
            story = "Who lived here, emotional connection"
        }
    }

    return storyElements
end
```

### Layers of Discovery

Reward different engagement levels.

```lua
local DiscoveryLayers = {
    -- Layer 1: Obvious
    obvious = {
        visibility = "Cannot be missed",
        effort = "None required",
        content = "Main story, essential mechanics",
        example = "Crashed ship in center of clearing"
    },

    -- Layer 2: Observable
    observable = {
        visibility = "Requires looking around",
        effort = "Minimal exploration",
        content = "Context, atmosphere",
        example = "Scratch marks on trees around the clearing"
    },

    -- Layer 3: Hidden
    hidden = {
        visibility = "Requires searching",
        effort = "Active exploration",
        content = "Backstory, secrets",
        example = "Diary pages hidden under debris"
    },

    -- Layer 4: Deduced
    deduced = {
        visibility = "Requires connecting information",
        effort = "Mental engagement",
        content = "Deep lore, theories",
        example = "Realizing the scratches match a creature seen earlier"
    }
}
```

---

## Spawn and Flow Design

### Player Spawn Considerations

```lua
local SpawnDesign = {}

SpawnDesign.Requirements = {
    -- Safety
    safety = {
        noEnemies = "Safe from immediate threats",
        noHazards = "No environmental damage",
        noCliffs = "Can't fall off accidentally"
    },

    -- Orientation
    orientation = {
        facingGoal = "Player faces objective direction",
        landmark = "Major landmark visible",
        ui = "Any necessary UI appears"
    },

    -- Context
    context = {
        whereAmI = "Environment communicates location",
        whatToDo = "Objective is clear",
        howToStart = "First action is obvious"
    }
}

function SpawnDesign:CreateSpawn(config)
    local spawn = {
        position = config.position,
        lookAt = config.objectiveDirection,

        -- Spawn room/area design
        area = {
            size = "10-20 studs buffer zone",
            visibility = "Open view of surroundings",
            lighting = "Well lit, welcoming"
        },

        -- First 10 seconds
        firstMoment = {
            audio = "Ambient + music cue",
            visual = "Goal/landmark visible",
            action = "Clear first step"
        }
    }

    return spawn
end
```

### Flow Patterns

How players move through space.

```lua
local FlowPatterns = {
    -- Linear
    linear = {
        description = "Point A to Point B",
        advantages = "Easy to pace, clear progression",
        disadvantages = "Can feel restrictive",
        bestFor = "Story-driven games, tutorials"
    },

    -- Hub and Spoke
    hubAndSpoke = {
        description = "Central area with branches",
        advantages = "Player choice, replayability",
        disadvantages = "Can be confusing",
        bestFor = "Exploration games, RPGs"
    },

    -- Loop
    loop = {
        description = "Circular path returning to start",
        advantages = "Natural backtracking, shortcuts",
        disadvantages = "Needs clear milestones",
        bestFor = "Racing, collection games"
    },

    -- Network
    network = {
        description = "Multiple interconnected paths",
        advantages = "High freedom, exploration",
        disadvantages = "Hard to pace, easy to get lost",
        bestFor = "Open world, sandbox"
    },

    -- Hybrid
    hybrid = {
        description = "Combination of patterns",
        advantages = "Best of multiple worlds",
        disadvantages = "Complex to design",
        bestFor = "Large games with varied content"
    }
}

-- Flow visualization helper
function FlowPatterns:VisualizeInStudio(pattern, positions)
    -- Create colored parts showing flow
    for i, pos in ipairs(positions) do
        local node = Instance.new("Part")
        node.Position = pos
        node.Size = Vector3.new(5, 5, 5)
        node.Shape = Enum.PartType.Ball
        node.Anchored = true
        node.Name = "FlowNode_" .. i
        node.BrickColor = BrickColor.new("Bright blue")
        node.Parent = workspace.FlowVisualization

        -- Connect to next node
        if positions[i + 1] then
            local beam = self:CreateBeam(pos, positions[i + 1])
            beam.Parent = workspace.FlowVisualization
        end
    end
end
```

### Chokepoints and Arenas

Strategic space design.

```lua
local CombatSpaces = {}

-- Chokepoint design
CombatSpaces.Chokepoint = {
    purpose = "Control player pace, create tension",
    design = {
        width = "1-2 player widths",
        length = "Short enough to commit",
        visibility = "Clear what's beyond",
        cover = "Limited or none"
    },
    placement = {
        beforeBoss = "Build anticipation",
        betweenZones = "Transition point",
        nearRewards = "Guard valuable content"
    }
}

-- Arena design
CombatSpaces.Arena = {
    purpose = "Dedicated combat space",
    design = {
        shape = "Circular or rectangular",
        size = "Based on enemy count and types",
        cover = "Strategic positions",
        elevation = "Height variation for tactics"
    },
    elements = {
        entrances = "Limited and lockable",
        hazards = "Environmental interaction",
        pickups = "Health/ammo spawns",
        spectacle = "Visual interest"
    }
}

function CombatSpaces:CreateArena(config)
    return {
        dimensions = {
            minSize = config.playerCount * 100, -- studs squared per player
            shape = config.shape or "circular",
            heightVariation = config.elevation or 3 -- 3 levels
        },

        combat = {
            coverPositions = math.ceil(config.playerCount * 1.5),
            hazardCount = config.hazardLevel,
            pickupSpawns = config.pickupCount
        },

        flow = {
            entranceWidth = 8, -- studs
            exitTrigger = config.exitCondition,
            lockdownMechanic = config.lockdown
        }
    }
end
```

---

## Obstacles and Rewards

### Obstacle Placement Principles

```lua
local ObstaclePlacement = {}

ObstaclePlacement.Principles = {
    -- Visibility
    visibility = {
        rule = "Player should see obstacle before encountering it",
        exception = "Intentional surprises (use sparingly)",
        implementation = "Clear sightlines, warning signs"
    },

    -- Fairness
    fairness = {
        rule = "Player should be able to avoid/overcome",
        exception = "Scripted story moments",
        implementation = "Consistent patterns, learnable timing"
    },

    -- Purpose
    purpose = {
        rule = "Every obstacle should serve gameplay",
        types = {
            gate = "Requires skill/item to pass",
            choice = "Forces player decision",
            pacing = "Controls movement speed",
            training = "Teaches mechanic"
        }
    }
}

-- Obstacle density
function ObstaclePlacement:CalculateDensity(difficulty, zoneLength)
    local baseObstacles = zoneLength / 50 -- 1 per 50 studs base
    local difficultyMultiplier = 0.5 + (difficulty * 0.1) -- 0.6 to 1.5

    return math.floor(baseObstacles * difficultyMultiplier)
end
```

### Reward Placement

```lua
local RewardPlacement = {}

RewardPlacement.Strategies = {
    -- Breadcrumb
    breadcrumb = {
        description = "Small rewards guide path",
        spacing = "Every 10-20 studs",
        value = "Low individual, adds up"
    },

    -- Milestone
    milestone = {
        description = "Significant reward after challenge",
        placement = "After defeating enemy, solving puzzle",
        value = "Medium, feels earned"
    },

    -- Exploration
    exploration = {
        description = "Hidden rewards for curious players",
        placement = "Off the main path",
        value = "High, rewards thoroughness"
    },

    -- Risk/Reward
    riskReward = {
        description = "Valuable but dangerous to obtain",
        placement = "Near hazards or enemies",
        value = "Highest, proportional to risk"
    }
}

-- Implement reward placement
function RewardPlacement:PlaceRewards(levelMap, config)
    local rewards = {}

    -- Breadcrumbs along main path
    for _, point in ipairs(levelMap.mainPath) do
        if math.random() < 0.3 then -- 30% chance at each point
            table.insert(rewards, {
                type = "breadcrumb",
                position = point,
                value = config.breadcrumbValue
            })
        end
    end

    -- Milestones after challenges
    for _, challenge in ipairs(levelMap.challenges) do
        table.insert(rewards, {
            type = "milestone",
            position = challenge.exit,
            value = config.milestoneValue * challenge.difficulty
        })
    end

    -- Exploration rewards
    for _, secretArea in ipairs(levelMap.secrets) do
        table.insert(rewards, {
            type = "exploration",
            position = secretArea.position,
            value = config.explorationValue * secretArea.hiddenness
        })
    end

    return rewards
end
```

### Secret Areas

```lua
local SecretAreas = {}

SecretAreas.Types = {
    -- Visual secrets
    visual = {
        description = "Hidden in plain sight",
        examples = {
            "Wall section slightly different",
            "Suspicious dead-end",
            "Destroyable object"
        }
    },

    -- Environmental secrets
    environmental = {
        description = "Use environment to discover",
        examples = {
            "Waterfall hiding cave",
            "Floor that crumbles",
            "Ledge only visible from specific angle"
        }
    },

    -- Ability secrets
    ability = {
        description = "Requires specific ability/item",
        examples = {
            "High ledge needs double jump",
            "Locked door needs key",
            "Dark area needs torch"
        }
    },

    -- Puzzle secrets
    puzzle = {
        description = "Requires solving a puzzle",
        examples = {
            "Pressure plates in order",
            "Light beam reflection",
            "Collectible clues"
        }
    }
}

function SecretAreas:CreateSecret(config)
    return {
        type = config.type,
        difficulty = config.difficulty, -- How hard to find

        -- Hints
        hints = {
            obvious = config.obviousHint, -- NPC mention, sign
            subtle = config.subtleHint, -- Sound cue, visual
            none = config.noHint -- For hardest secrets
        },

        -- Reward scales with difficulty
        reward = {
            value = config.baseReward * config.difficulty,
            unique = config.uniqueReward -- Exclusive to this secret
        }
    }
end
```

---

## Roblox Studio Tools

### Terrain Tools

```lua
-- Terrain design in Roblox Studio
local TerrainTools = {}

TerrainTools.BestPractices = {
    -- Performance
    performance = {
        resolution = "Use appropriate terrain resolution",
        smoothing = "Smooth terrain to reduce triangles",
        materials = "Limit material variety per area"
    },

    -- Gameplay
    gameplay = {
        collision = "Ensure walkable surfaces are smooth",
        slopes = "Max 45 degrees for walking",
        water = "Clear water depths"
    },

    -- Visual
    visual = {
        blending = "Blend materials at transitions",
        variety = "Avoid large single-material areas",
        scale = "Match real-world proportions"
    }
}

-- Terrain generation script example
function TerrainTools:CreateHill(center, radius, height)
    local terrain = workspace.Terrain

    for x = -radius, radius, 4 do
        for z = -radius, radius, 4 do
            local distance = math.sqrt(x*x + z*z)
            if distance <= radius then
                local heightFactor = 1 - (distance / radius)
                local y = height * heightFactor

                local position = center + Vector3.new(x, y/2, z)
                local size = Vector3.new(4, y, 4)

                terrain:FillBlock(
                    CFrame.new(position),
                    size,
                    Enum.Material.Grass
                )
            end
        end
    end
end
```

### Lighting Setup

```lua
-- Lighting for level design
local LightingSetup = {}

function LightingSetup:CreateMood(mood)
    local lighting = game:GetService("Lighting")

    local moods = {
        peaceful = {
            TimeOfDay = "12:00:00",
            Brightness = 2,
            Ambient = Color3.fromRGB(150, 150, 150),
            OutdoorAmbient = Color3.fromRGB(150, 150, 150),
            FogEnd = 10000
        },
        tense = {
            TimeOfDay = "18:00:00",
            Brightness = 1,
            Ambient = Color3.fromRGB(100, 100, 120),
            OutdoorAmbient = Color3.fromRGB(80, 80, 100),
            FogEnd = 500
        },
        horror = {
            TimeOfDay = "00:00:00",
            Brightness = 0,
            Ambient = Color3.fromRGB(30, 30, 50),
            OutdoorAmbient = Color3.fromRGB(20, 20, 30),
            FogEnd = 200
        }
    }

    local settings = moods[mood]
    for property, value in pairs(settings) do
        lighting[property] = value
    end
end

-- Point light for attention
function LightingSetup:CreateAttentionLight(position, color)
    local part = Instance.new("Part")
    part.Position = position
    part.Transparency = 1
    part.Anchored = true
    part.CanCollide = false

    local light = Instance.new("PointLight")
    light.Color = color or Color3.fromRGB(255, 200, 100)
    light.Brightness = 2
    light.Range = 30
    light.Parent = part

    part.Parent = workspace.Lights
    return light
end
```

### Model Organization

```lua
-- Organize level in Studio
local ModelOrganization = {
    structure = {
        Level = {
            Terrain = "Natural terrain features",
            Structures = "Buildings, bridges, etc.",
            Props = "Decorative objects",
            Gameplay = {
                Spawns = "Player spawn points",
                Objectives = "Quest targets",
                Pickups = "Items to collect",
                Triggers = "Event triggers"
            },
            Enemies = "Enemy spawn/patrol data",
            Lighting = "Light fixtures",
            Audio = "Sound sources",
            Navigation = "AI navigation mesh"
        }
    },

    naming = {
        convention = "[Type]_[Location]_[Variant]",
        examples = {
            "House_Village_01",
            "Tree_Forest_Large",
            "Chest_Dungeon_Rare"
        }
    },

    attributes = {
        common = {
            "LevelDesigner", -- Who made it
            "LastModified", -- When
            "Difficulty", -- Zone difficulty
            "Required", -- Is it essential
        }
    }
}
```

### Playtesting Tools

```lua
-- In-Studio playtesting helpers
local PlaytestTools = {}

-- Speed run path
function PlaytestTools:CreateTimingPath(waypoints)
    local path = Instance.new("Folder")
    path.Name = "TimingPath"

    for i, waypoint in ipairs(waypoints) do
        local marker = Instance.new("Part")
        marker.Name = "Checkpoint_" .. i
        marker.Position = waypoint
        marker.Size = Vector3.new(10, 1, 10)
        marker.Transparency = 0.5
        marker.BrickColor = BrickColor.new("Bright green")
        marker.Anchored = true
        marker.CanCollide = false

        -- Timing trigger
        marker.Touched:Connect(function(hit)
            local player = game.Players:GetPlayerFromCharacter(hit.Parent)
            if player then
                print(string.format("Checkpoint %d: %.2fs",
                    i, tick() - player:GetAttribute("StartTime")))
            end
        end)

        marker.Parent = path
    end

    path.Parent = workspace
end

-- Heat map data collection
function PlaytestTools:CreateHeatmapCollector()
    local heatmap = {}

    game.Players.PlayerAdded:Connect(function(player)
        spawn(function()
            while player.Character do
                local pos = player.Character.PrimaryPart.Position
                local key = string.format("%d,%d",
                    math.floor(pos.X/10)*10,
                    math.floor(pos.Z/10)*10)

                heatmap[key] = (heatmap[key] or 0) + 1
                wait(1)
            end
        end)
    end)

    return heatmap
end
```

---

## Level Design Checklist

### Pre-Production Checklist

```markdown
## Before Building

### Concept
- [ ] Core fantasy defined (what is the player experiencing?)
- [ ] Reference images/games collected
- [ ] Mood board created
- [ ] Key landmarks sketched

### Planning
- [ ] Level flow mapped (paths, zones, connections)
- [ ] Difficulty curve plotted
- [ ] Pacing plan documented
- [ ] Reward placement planned
- [ ] Estimated play time calculated

### Technical
- [ ] Performance budget known
- [ ] Art style guidelines reviewed
- [ ] Scale/proportion guidelines reviewed
- [ ] Required assets listed
```

### Production Checklist

```markdown
## During Building

### Blockout Phase
- [ ] Rough shapes placed
- [ ] Scale feels right
- [ ] Flow is walkable
- [ ] Sightlines verified
- [ ] Play time validated

### Detail Phase
- [ ] Lighting supports gameplay
- [ ] Audio placed appropriately
- [ ] Props guide attention
- [ ] Cover/obstacles positioned
- [ ] Rewards placed

### Polish Phase
- [ ] Materials/textures applied
- [ ] Lighting refined
- [ ] Audio balanced
- [ ] Particles/effects added
- [ ] Signposting clear
```

### Quality Assurance Checklist

```markdown
## Before Release

### Gameplay
- [ ] All paths are walkable
- [ ] No invisible walls
- [ ] No stuck points
- [ ] Difficulty appropriate
- [ ] Rewards are satisfying

### Technical
- [ ] Performance acceptable
- [ ] No holes in geometry
- [ ] Collision correct
- [ ] Scripts working
- [ ] Saves/checkpoints functional

### Accessibility
- [ ] Visual cues have alternatives
- [ ] Text is readable
- [ ] Difficulty options work
- [ ] Color blind considerations

### Player Experience
- [ ] First impression strong
- [ ] Objectives clear
- [ ] Navigation intuitive
- [ ] Stopping points exist
- [ ] End is satisfying
```

---

## Summary: Quick Reference

### Level Design Do's

1. **Do** make the first 30 seconds compelling
2. **Do** create clear landmarks
3. **Do** reward exploration
4. **Do** vary pacing
5. **Do** test with fresh eyes
6. **Do** iterate based on feedback

### Level Design Don'ts

1. **Don't** hide essential paths
2. **Don't** create unfair obstacles
3. **Don't** forget rest areas
4. **Don't** ignore performance
5. **Don't** overcomplicate layouts
6. **Don't** neglect lighting

### Rule of Thumb Metrics

| Aspect | Guideline |
|--------|-----------|
| Walkable slope | Max 45 degrees |
| Jump height | 7-10 studs for standard |
| Corridor width | Min 8 studs |
| Sightline to landmark | 500+ studs |
| Reward frequency | Every 30-60 seconds |
| Rest area frequency | Every 3-5 minutes |

---

*This document is part of the Game Designer (Mecha) knowledge base for the Roblox Game Studio squad.*
