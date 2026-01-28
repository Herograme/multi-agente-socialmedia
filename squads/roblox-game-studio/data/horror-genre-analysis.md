# Horror Genre Deep Dive - Roblox Analysis

> Comprehensive analysis of the horror genre on Roblox platform
> Last Updated: January 2025

---

## Genre Overview

### Market Position
- **Growth Rate**: One of the highest-growing genres since 2018
- **Platform Fit**: Horror works exceptionally well on Roblox despite younger audience
- **Viral Potential**: High - horror content performs well on YouTube/TikTok
- **Revenue Range**: $1,500 - $15,000+ monthly for successful games

### Target Demographics
| Age Group | Engagement | Notes |
|-----------|------------|-------|
| 13-17 | Very High | Core horror audience |
| 9-12 | High | "Scary but safe" appeal |
| 18-24 | Medium-High | Nostalgic, content creators |
| 25+ | Medium | Casual players |

---

## Top Horror Games Analysis

### 1. DOORS (LSPLASH)

**Stats (2025):**
- **Total Visits**: 6.7+ billion
- **Peak CCU**: ~500K
- **Average CCU**: ~100K
- **Revenue Estimate**: $5M+ lifetime

**What Makes It Work:**

| Factor | Implementation |
|--------|----------------|
| **Procedural Generation** | 100 randomly generated rooms per run |
| **Diverse Entities** | 15+ unique monsters with distinct mechanics |
| **Learning Curve** | Each entity teaches new survival rules |
| **Replayability** | Randomness + skill-based progression |
| **Atmosphere** | Hotel setting, low lighting, ambient sound |
| **Multiplayer** | 1-4 players, communication essential |
| **Permadeath** | One life with paid revives |

**Key Entities & Mechanics:**
```
RUSH: Hide in closets when lights flicker
AMBUSH: Multiple hiding phases, faster each time
SCREECH: Look at it when you hear "psst"
FIGURE: Blind, uses sound - crouch and stay quiet
SEEK: Chase sequence, don't look back
HALT: Follow light instructions, turn at darkness
```

**Monetization:**
- Revives (Developer Product): 50 Robux
- Cosmetics (Game Passes): 25-500 Robux
- Limited-time event items

**Lessons:**
1. Each monster is memorable and requires different strategies
2. Death feels fair - you learn why you died
3. Speedrunning community extends game life
4. Regular content updates maintain engagement

---

### 2. Apeirophobia (Polaroid Studios)

**Stats (2025):**
- **Total Visits**: 900M+
- **Peak CCU**: ~150K
- **Average CCU**: ~30K

**What Makes It Work:**

| Factor | Implementation |
|--------|----------------|
| **Source Material** | Backrooms creepypasta - built-in audience |
| **Liminal Spaces** | Endless yellow rooms, office corridors |
| **Atmospheric Tension** | Silence is scarier than jumpscares |
| **Puzzle Integration** | Progress requires thinking, not just running |
| **Visual Style** | Realistic lighting, motion blur |
| **Level Variety** | Each level feels distinct |

**Level Design Philosophy:**
- **Level 0**: Classic yellow rooms, establishes tone
- **Level 1**: Dark hallways, introduces entities
- **Level 2**: Pool rooms, different aesthetic
- **Level 3+**: Increasing complexity and horror

**Unique Mechanics:**
```lua
-- Stealth system
- Crouching reduces sound
- Flashlight attracts entities
- Leaning around corners
- Environmental hiding spots

-- Puzzle types
- Keycard collection
- Button sequences
- Navigation challenges
- Time-based escapes
```

**Monetization:**
- Progression skips
- Cosmetic effects
- Radio items
- Premium revives

**Lessons:**
1. Existing IP (Backrooms) provides instant recognition
2. Liminal spaces are inherently unsettling
3. Varied gameplay prevents fatigue
4. Mobile optimization extends audience

---

### 3. Piggy (MiniToon)

**Stats (2025):**
- **Total Visits**: 11+ billion (all-time Roblox record holder)
- **Peak CCU**: 2M+ (2020)
- **Current CCU**: ~50K

**What Makes It Work:**

| Factor | Implementation |
|--------|----------------|
| **Familiar Format** | Granny-style escape room |
| **Story Focus** | Compelling narrative across chapters |
| **Character Design** | Peppa Pig-inspired, iconic villains |
| **Map Variety** | 12+ unique escape maps |
| **Player Roles** | Survivor vs Piggy modes |
| **Solo & Multiplayer** | Works both ways |

**Game Mode Breakdown:**
```
PLAYER MODE: 1-11 survivors escape from Piggy bot
SURVIVOR MODE: 11 survivors vs 1 player-controlled Piggy
TRAITOR MODE: Hidden traitor among survivors
INFECTION MODE: Killed survivors become Piggies
```

**Narrative Structure:**
- Book 1: 12 chapters, original story
- Book 2: 10 chapters, continuation
- Special events: Holiday-themed content

**Monetization:**
- Character skins: 50-200 Robux
- Map packs: 100-250 Robux
- Traps and items: 25-100 Robux

**Lessons:**
1. Story drives long-term engagement
2. Multiple game modes extend replayability
3. Recognizable aesthetic aids viral spread
4. Player agency (being the monster) is compelling

---

### 4. The Mimic (MUCDICH)

**Stats (2025):**
- **Total Visits**: 1.5B+
- **Peak CCU**: ~200K
- **Average CCU**: ~40K

**What Makes It Work:**

| Factor | Implementation |
|--------|----------------|
| **Japanese Horror** | Unique aesthetic in Roblox space |
| **Story-Driven** | Four chapters with distinct narratives |
| **Atmosphere** | Detailed environments, cultural elements |
| **Puzzle Density** | More puzzle-focused than action |
| **Multiplayer Focus** | Designed for 2-4 players |

**Chapter Structure:**
```
CHAPTER I - Control: Hospital setting, investigation
CHAPTER II - Jealousy: Forest/village, mythological horror
CHAPTER III - Rage: School, Japanese urban legends
CHAPTER IV - Envy: Final confrontation, narrative payoff
```

**Cultural Elements:**
- Japanese mythology (Yokai, spirits)
- Authentic environmental design
- J-horror cinematography influence
- Unique monster designs

**Lessons:**
1. Cultural specificity creates unique identity
2. Story chapters create natural content roadmap
3. Quality over quantity in environment design
4. Cooperative puzzle-solving builds community

---

### 5. 99 Nights in the Forest

**Stats (2025):**
- **Peak CCU**: Top 10 during platform record
- **Rapid Growth**: Viral in Q2 2025

**What Makes It Work:**

| Factor | Implementation |
|--------|----------------|
| **Survival Loop** | Night-by-night progression |
| **Resource Management** | Gather, craft, defend |
| **Escalating Threat** | Each night is harder |
| **Base Building** | Personalization and strategy |

---

## Common Horror Mechanics

### 1. Detection Systems

```lua
--!strict

type DetectionConfig = {
    visualRange: number,
    hearingRange: number,
    smellRange: number?,
    lightSensitivity: boolean
}

local function createDetectionSystem(entity: Model, config: DetectionConfig)
    local detection = {
        lastKnownPosition = nil,
        alertLevel = 0, -- 0-100
        isChasing = false
    }

    local function checkVisual(target: Model): boolean
        local distance = (entity.PrimaryPart.Position - target.PrimaryPart.Position).Magnitude
        if distance > config.visualRange then
            return false
        end

        -- Line of sight check
        local ray = Ray.new(entity.PrimaryPart.Position, target.PrimaryPart.Position - entity.PrimaryPart.Position)
        local hit = workspace:FindPartOnRay(ray, entity)

        return hit and hit:IsDescendantOf(target)
    end

    local function checkAudio(target: Model, targetMoving: boolean): boolean
        if not targetMoving then
            return false
        end

        local distance = (entity.PrimaryPart.Position - target.PrimaryPart.Position).Magnitude
        return distance <= config.hearingRange
    end

    return detection
end
```

### 2. Hiding Mechanics

```lua
--!strict

local HidingSystem = {}

HidingSystem.HIDE_SPOTS = {} -- Populated at runtime

function HidingSystem:FindNearestSpot(player: Player): Instance?
    local character = player.Character
    if not character then return nil end

    local nearestDistance = math.huge
    local nearestSpot = nil

    for _, spot in self.HIDE_SPOTS do
        local distance = (spot.Position - character.PrimaryPart.Position).Magnitude
        if distance < nearestDistance and distance < 10 then
            nearestDistance = distance
            nearestSpot = spot
        end
    end

    return nearestSpot
end

function HidingSystem:EnterHidingSpot(player: Player, spot: Instance)
    local character = player.Character
    if not character then return end

    -- Disable player controls
    local humanoid = character:FindFirstChild("Humanoid")
    if humanoid then
        humanoid.WalkSpeed = 0
    end

    -- Make player invisible to AI
    character:SetAttribute("IsHiding", true)

    -- Camera effect
    local camera = workspace.CurrentCamera
    camera.CameraType = Enum.CameraType.Scriptable
    camera.CFrame = spot.CFrame * CFrame.new(0, 0, 2)
end

function HidingSystem:ExitHidingSpot(player: Player)
    local character = player.Character
    if not character then return end

    character:SetAttribute("IsHiding", false)

    local humanoid = character:FindFirstChild("Humanoid")
    if humanoid then
        humanoid.WalkSpeed = 16
    end

    workspace.CurrentCamera.CameraType = Enum.CameraType.Custom
end
```

### 3. Jumpscare System

```lua
--!strict

local JumpscareManager = {}

function JumpscareManager:Play(player: Player, scareType: string, duration: number?)
    local playerGui = player:FindFirstChild("PlayerGui")
    if not playerGui then return end

    -- Create jumpscare UI
    local scareGui = Instance.new("ScreenGui")
    scareGui.Name = "Jumpscare"
    scareGui.IgnoreGuiInset = true
    scareGui.DisplayOrder = 999

    local image = Instance.new("ImageLabel")
    image.Size = UDim2.new(1, 0, 1, 0)
    image.Image = self:GetScareImage(scareType)
    image.BackgroundTransparency = 1
    image.Parent = scareGui

    -- Audio
    local sound = Instance.new("Sound")
    sound.SoundId = self:GetScareSound(scareType)
    sound.Volume = 1
    sound.Parent = scareGui
    sound:Play()

    scareGui.Parent = playerGui

    -- Screen shake
    self:ShakeCamera(player, duration or 1)

    -- Cleanup
    task.delay(duration or 1, function()
        scareGui:Destroy()
    end)
end

function JumpscareManager:ShakeCamera(player: Player, duration: number)
    local camera = workspace.CurrentCamera
    local originalCFrame = camera.CFrame

    local startTime = tick()
    local connection
    connection = game:GetService("RunService").RenderStepped:Connect(function()
        local elapsed = tick() - startTime
        if elapsed >= duration then
            connection:Disconnect()
            return
        end

        local intensity = 1 - (elapsed / duration)
        local shake = CFrame.new(
            math.random() * intensity * 0.5,
            math.random() * intensity * 0.5,
            0
        )
        camera.CFrame = camera.CFrame * shake
    end)
end
```

### 4. Atmospheric Sound Design

```lua
--!strict

local SoundManager = {}

SoundManager.Layers = {
    ambient = nil,
    tension = nil,
    stinger = nil
}

function SoundManager:SetAmbient(soundId: string)
    if self.Layers.ambient then
        self.Layers.ambient:Destroy()
    end

    local sound = Instance.new("Sound")
    sound.SoundId = soundId
    sound.Volume = 0.3
    sound.Looped = true
    sound.Parent = workspace
    sound:Play()

    self.Layers.ambient = sound
end

function SoundManager:StartTension(intensity: number)
    -- Intensity 0-1 affects volume and pitch
    if self.Layers.tension then
        self.Layers.tension.Volume = 0.5 * intensity
        self.Layers.tension.PlaybackSpeed = 0.8 + (0.4 * intensity)
    end
end

function SoundManager:PlayStinger(stingerId: string)
    local sound = Instance.new("Sound")
    sound.SoundId = stingerId
    sound.Volume = 0.8
    sound.Parent = workspace
    sound:Play()

    sound.Ended:Connect(function()
        sound:Destroy()
    end)
end

-- Distance-based horror cues
function SoundManager:PlayProximityHorror(monsterPosition: Vector3, playerPosition: Vector3)
    local distance = (monsterPosition - playerPosition).Magnitude
    local maxDistance = 100

    if distance < maxDistance then
        local intensity = 1 - (distance / maxDistance)
        self:StartTension(intensity)

        -- Heartbeat at close range
        if distance < 20 then
            self:PlayHeartbeat(intensity)
        end
    end
end
```

---

## What Differentiates Success from Failure

### Success Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| **Unique Identity** | 25% | Memorable monsters, settings, or mechanics |
| **Fair Challenge** | 20% | Deaths feel earned, not random |
| **Atmosphere** | 20% | Sound, lighting, environment work together |
| **Replayability** | 15% | Procedural elements, multiple paths |
| **Social Elements** | 10% | Multiplayer, streaming potential |
| **Regular Updates** | 10% | New content keeps players returning |

### Failure Factors

| Factor | Impact | Example |
|--------|--------|---------|
| **Unfair Deaths** | Critical | Instant kills with no warning |
| **One-Trick Design** | High | Only scary first time |
| **Poor Performance** | High | Lag ruins tension |
| **Cheap Jumpscares** | Medium | Over-reliance on volume |
| **No Progression** | Medium | Nothing to work toward |
| **Poor Monetization** | Medium | Pay-to-win or predatory |

### Quality Checklist

```
ATMOSPHERE:
[ ] Lighting creates mood, not just darkness
[ ] Sound design is layered (ambient + events)
[ ] Environment tells a story
[ ] Music builds and releases tension

GAMEPLAY:
[ ] Player has agency (choices matter)
[ ] Deaths are learnable moments
[ ] Mechanics are intuitive
[ ] Difficulty scales appropriately

MONSTERS:
[ ] Each entity has distinct rules
[ ] Visual design is memorable
[ ] AI is predictable but not trivial
[ ] Variety prevents fatigue

TECHNICAL:
[ ] Performs well on all platforms
[ ] Mobile controls work
[ ] No game-breaking bugs
[ ] Save system works reliably

CONTENT:
[ ] Core loop is engaging
[ ] Updates planned and communicated
[ ] Community feedback incorporated
[ ] Reasonable playtime per session
```

---

## Monetization Patterns

### Successful Horror Monetization

| Method | Example | Price Range | Effectiveness |
|--------|---------|-------------|---------------|
| **Revives** | DOORS | 50 Robux | High - non-intrusive |
| **Cosmetics** | All games | 25-200 Robux | High - doesn't affect gameplay |
| **Chapter Access** | Piggy | 100-250 Robux | Medium - content lock |
| **Speedrun Tools** | Various | 75-150 Robux | Medium - skill expression |
| **Radio/Effects** | Apeirophobia | 50-100 Robux | Low impact, high margin |

### What to Avoid

- **Pay-to-skip horror**: Ruins the experience
- **Monster advantages**: Breaks multiplayer balance
- **Time gates**: Kills tension
- **Loot boxes for progression**: Feels exploitative

### Recommended Approach

```lua
local HorrorMonetization = {
    -- High priority: Cosmetics
    cosmetics = {
        {name = "Flashlight Skin", price = 50},
        {name = "Character Costume", price = 100},
        {name = "Death Effect", price = 75}
    },

    -- Medium priority: Convenience
    convenience = {
        {name = "Revive (1)", price = 50},
        {name = "Revive Pack (5)", price = 200},
        {name = "Chapter Skip", price = 100}
    },

    -- Low priority: Premium
    premium = {
        {name = "VIP Badge", price = 299},
        {name = "Developer Supporter", price = 499}
    }
}
```

---

## CCU Benchmarks

### Horror Genre Standards

| Stage | CCU | Monthly Revenue | Characteristics |
|-------|-----|-----------------|-----------------|
| Launch | 100-1K | $0-500 | Initial buzz |
| Growing | 1K-10K | $500-3K | Word of mouth |
| Established | 10K-50K | $3K-10K | Content creator attention |
| Successful | 50K-200K | $10K-50K | Viral potential realized |
| Top Tier | 200K+ | $50K+ | Platform leader |

### Retention Benchmarks

| Metric | Poor | Average | Good | Excellent |
|--------|------|---------|------|-----------|
| D1 | <15% | 20-25% | 30-40% | 45%+ |
| D7 | <5% | 8-12% | 15-20% | 25%+ |
| D30 | <2% | 4-6% | 8-12% | 15%+ |

### Session Length

- **Target**: 15-30 minutes per session
- **Horror sweet spot**: 20-25 minutes
- **Avoid**: Sessions over 45 minutes (fatigue)
- **Avoid**: Sessions under 10 minutes (not satisfying)

---

## 2025 Horror Trends

### Emerging Themes
1. **Analog Horror**: VHS aesthetics, found footage style
2. **Liminal Spaces**: Backrooms-inspired endless environments
3. **Asymmetric Multiplayer**: Players vs player-controlled monster
4. **Psychological Horror**: Less jumpscares, more dread
5. **Horror Comedy**: Blending humor with scares

### Technical Innovations
1. **Better AI**: More believable monster behavior
2. **Procedural Generation**: Every playthrough unique
3. **Dynamic Sound**: Responsive to player state
4. **Improved Lighting**: Real-time shadows and effects

### Content Patterns
1. **Chapter Releases**: Episodic content model
2. **Seasonal Events**: Halloween, etc.
3. **Community Creation**: Player-made maps/modes
4. **Cross-Platform**: Mobile-first design

---

## Design Recommendations

### For New Horror Games

1. **Start Small**: One map, one monster, perfect it
2. **Unique Hook**: What makes YOUR horror different?
3. **Test Extensively**: Watch real players, learn their reactions
4. **Build Community**: Discord, YouTube, TikTok
5. **Plan Updates**: Content roadmap before launch

### Technical Priorities

1. **Performance**: Horror is ruined by lag
2. **Mobile Support**: 70% of Roblox is mobile
3. **Saving**: Players hate losing progress
4. **Audio**: 50% of horror is sound

### Avoiding Common Mistakes

| Mistake | Solution |
|---------|----------|
| Too dark to see anything | Darkness should obscure, not blind |
| Monster too fast | Give players time to react |
| Endless hallways | Variety and landmarks |
| Forced walking | Allow running with stamina |
| Loud = scary | Build tension, release with volume |
| Copy existing games | Take inspiration, add innovation |

---

## References

- [DOORS Game Analysis](https://doors-game.fandom.com)
- [Roblox Developer Forum - Horror Discussion](https://devforum.roblox.com)
- [GAM3S.GG - Roblox Charts](https://gam3s.gg)
- [Horror Game Design Theory](https://www.gamedeveloper.com/design)
- [RoMonitor Stats](https://romonitorstats.com)
