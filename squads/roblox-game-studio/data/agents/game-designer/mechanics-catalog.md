---
title: "Game Mechanics Catalog - Deep Knowledge"
agent: game-designer
alias: Mecha
category: mechanics
version: 1.0.0
last_updated: 2025-01-28
tags: [mechanics, gameplay, systems, lua, roblox, catalog]
---

# Game Mechanics Catalog

A comprehensive catalog of game mechanics organized by category, with descriptions, use cases, and Roblox-specific implementation examples in Lua. Use this as a reference when designing game systems.

---

## Table of Contents

1. [Movement Mechanics](#movement-mechanics)
2. [Combat Mechanics](#combat-mechanics)
3. [Collection Mechanics](#collection-mechanics)
4. [Social Mechanics](#social-mechanics)
5. [Progression Mechanics](#progression-mechanics)
6. [Economy Mechanics](#economy-mechanics)
7. [Meta Mechanics](#meta-mechanics)

---

## Movement Mechanics

### Basic Movement

#### Walk/Run

**Description:** Standard ground locomotion with variable speed.

**When to Use:**
- Every game needs basic movement
- Run toggle for open worlds
- Sprint with stamina for survival games

**Roblox Example:**

```lua
-- Enhanced movement with sprint
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")

local MovementController = {}

MovementController.Config = {
    walkSpeed = 16,
    runSpeed = 32,
    staminaMax = 100,
    staminaDrain = 10, -- per second while running
    staminaRegen = 5 -- per second while not running
}

function MovementController:Initialize(player)
    local character = player.Character or player.CharacterAdded:Wait()
    local humanoid = character:WaitForChild("Humanoid")

    local stamina = Instance.new("NumberValue")
    stamina.Name = "Stamina"
    stamina.Value = self.Config.staminaMax
    stamina.Parent = character

    local isRunning = false

    -- Sprint input handling
    UserInputService.InputBegan:Connect(function(input, processed)
        if processed then return end
        if input.KeyCode == Enum.KeyCode.LeftShift then
            isRunning = true
        end
    end)

    UserInputService.InputEnded:Connect(function(input)
        if input.KeyCode == Enum.KeyCode.LeftShift then
            isRunning = false
        end
    end)

    -- Update loop
    game:GetService("RunService").Heartbeat:Connect(function(dt)
        if isRunning and stamina.Value > 0 then
            humanoid.WalkSpeed = self.Config.runSpeed
            stamina.Value = math.max(0, stamina.Value - self.Config.staminaDrain * dt)
        else
            humanoid.WalkSpeed = self.Config.walkSpeed
            stamina.Value = math.min(self.Config.staminaMax,
                stamina.Value + self.Config.staminaRegen * dt)
        end
    end)
end

return MovementController
```

---

#### Jump

**Description:** Vertical movement to overcome obstacles and reach higher areas.

**When to Use:**
- Platformers require precise jumping
- Action games need responsive jumps
- Puzzle games may use jumping as a mechanic

**Roblox Example:**

```lua
-- Advanced jump system with double jump and coyote time
local JumpSystem = {}

JumpSystem.Config = {
    jumpPower = 50,
    doubleJumpPower = 40,
    maxJumps = 2,
    coyoteTime = 0.15, -- seconds after leaving ground player can still jump
    jumpBufferTime = 0.1 -- seconds before landing player can queue jump
}

function JumpSystem:Initialize(player)
    local character = player.Character
    local humanoid = character:WaitForChild("Humanoid")
    local rootPart = character:WaitForChild("HumanoidRootPart")

    local jumpsRemaining = self.Config.maxJumps
    local lastGroundedTime = 0
    local jumpBuffered = false
    local jumpBufferTime = 0

    -- Track grounded state
    humanoid.StateChanged:Connect(function(oldState, newState)
        if newState == Enum.HumanoidStateType.Landed then
            jumpsRemaining = self.Config.maxJumps
            lastGroundedTime = tick()

            -- Execute buffered jump
            if jumpBuffered and tick() - jumpBufferTime < self.Config.jumpBufferTime then
                self:PerformJump(humanoid, true)
            end
            jumpBuffered = false

        elseif newState == Enum.HumanoidStateType.Freefall then
            -- First jump consumed when falling off ledge (after coyote time)
            task.delay(self.Config.coyoteTime, function()
                if humanoid:GetState() == Enum.HumanoidStateType.Freefall then
                    jumpsRemaining = math.min(jumpsRemaining, self.Config.maxJumps - 1)
                end
            end)
        end
    end)

    -- Jump input
    humanoid.Jumping:Connect(function(isJumping)
        if isJumping then
            self:HandleJumpInput(humanoid, jumpsRemaining, lastGroundedTime)
        end
    end)

    return self
end

function JumpSystem:PerformJump(humanoid, isFirstJump)
    local power = isFirstJump and self.Config.jumpPower or self.Config.doubleJumpPower

    humanoid.JumpPower = power
    humanoid:ChangeState(Enum.HumanoidStateType.Jumping)

    -- Visual feedback for double jump
    if not isFirstJump then
        self:PlayDoubleJumpEffect(humanoid.Parent)
    end
end

function JumpSystem:PlayDoubleJumpEffect(character)
    local rootPart = character:FindFirstChild("HumanoidRootPart")
    if not rootPart then return end

    -- Create particle effect
    local attachment = Instance.new("Attachment")
    attachment.Parent = rootPart

    local particles = Instance.new("ParticleEmitter")
    particles.Rate = 0
    particles.Lifetime = NumberRange.new(0.3, 0.5)
    particles.Speed = NumberRange.new(10, 20)
    particles.SpreadAngle = Vector2.new(180, 180)
    particles.Color = ColorSequence.new(Color3.fromRGB(255, 255, 255))
    particles.Parent = attachment

    particles:Emit(20)

    task.delay(1, function()
        attachment:Destroy()
    end)
end

return JumpSystem
```

---

#### Dash/Dodge

**Description:** Quick burst movement for evasion or closing distance.

**When to Use:**
- Action combat games
- Bullet hell games
- Competitive PvP

**Roblox Example:**

```lua
-- Dash/Dodge system with i-frames
local DashSystem = {}

DashSystem.Config = {
    dashDistance = 30,
    dashDuration = 0.2,
    cooldown = 1.0,
    iFrameDuration = 0.15, -- invincibility during dash
    dashDirections = {
        forward = true,
        backward = true,
        left = true,
        right = true
    }
}

function DashSystem:Initialize(player)
    local character = player.Character
    local humanoid = character:WaitForChild("Humanoid")
    local rootPart = character:WaitForChild("HumanoidRootPart")

    local canDash = true
    local isInvincible = false

    -- Bind dash to key
    local UserInputService = game:GetService("UserInputService")

    UserInputService.InputBegan:Connect(function(input, processed)
        if processed then return end

        if input.KeyCode == Enum.KeyCode.Q and canDash then
            local direction = self:GetDashDirection(rootPart)
            self:PerformDash(character, direction)
        end
    end)

    -- Store reference for external access
    character:SetAttribute("CanDash", true)

    return {
        IsInvincible = function()
            return isInvincible
        end
    }
end

function DashSystem:GetDashDirection(rootPart)
    -- Get movement direction or default to forward
    local moveDirection = rootPart.Parent.Humanoid.MoveDirection

    if moveDirection.Magnitude > 0 then
        return moveDirection.Unit
    else
        return rootPart.CFrame.LookVector
    end
end

function DashSystem:PerformDash(character, direction)
    local rootPart = character.HumanoidRootPart
    local humanoid = character.Humanoid

    character:SetAttribute("CanDash", false)

    -- Apply dash velocity
    local dashVelocity = Instance.new("BodyVelocity")
    dashVelocity.MaxForce = Vector3.new(math.huge, 0, math.huge)
    dashVelocity.Velocity = direction * (self.Config.dashDistance / self.Config.dashDuration)
    dashVelocity.Parent = rootPart

    -- Enable i-frames
    character:SetAttribute("Invincible", true)

    -- Visual effect
    self:PlayDashEffect(character, direction)

    -- End dash
    task.delay(self.Config.dashDuration, function()
        dashVelocity:Destroy()
    end)

    -- End i-frames
    task.delay(self.Config.iFrameDuration, function()
        character:SetAttribute("Invincible", false)
    end)

    -- Cooldown
    task.delay(self.Config.cooldown, function()
        character:SetAttribute("CanDash", true)
    end)
end

function DashSystem:PlayDashEffect(character, direction)
    -- Create afterimage
    for i = 1, 3 do
        task.delay(i * 0.05, function()
            local clone = character:Clone()

            -- Make translucent
            for _, part in ipairs(clone:GetDescendants()) do
                if part:IsA("BasePart") then
                    part.Transparency = 0.7
                    part.CanCollide = false
                    part.Anchored = true
                elseif part:IsA("Script") or part:IsA("LocalScript") then
                    part:Destroy()
                end
            end

            clone.Parent = workspace

            -- Fade out
            task.delay(0.3, function()
                clone:Destroy()
            end)
        end)
    end
end

return DashSystem
```

---

#### Wall Jump/Climb

**Description:** Interact with walls for vertical traversal.

**When to Use:**
- Platformers with verticality
- Parkour games
- Exploration games

**Roblox Example:**

```lua
-- Wall jump and climb system
local WallMovement = {}

WallMovement.Config = {
    wallJumpPower = Vector3.new(30, 40, 0), -- outward, upward, 0
    climbSpeed = 10,
    maxClimbTime = 2.0,
    wallDetectionDistance = 2.5,
    climbStamina = 100
}

function WallMovement:Initialize(player)
    local character = player.Character
    local humanoid = character:WaitForChild("Humanoid")
    local rootPart = character:WaitForChild("HumanoidRootPart")

    local isOnWall = false
    local wallNormal = Vector3.new()
    local climbStamina = self.Config.climbStamina

    -- Wall detection
    game:GetService("RunService").Heartbeat:Connect(function(dt)
        local wallHit, normal = self:DetectWall(rootPart)

        if wallHit and humanoid:GetState() == Enum.HumanoidStateType.Freefall then
            if not isOnWall then
                self:AttachToWall(character, normal)
                isOnWall = true
                wallNormal = normal
            end

            -- Handle climbing
            if isOnWall then
                climbStamina = climbStamina - (100 / self.Config.maxClimbTime) * dt

                if climbStamina <= 0 then
                    self:DetachFromWall(character)
                    isOnWall = false
                end
            end
        else
            if isOnWall then
                self:DetachFromWall(character)
                isOnWall = false
            end
            -- Regenerate stamina on ground
            if humanoid.FloorMaterial ~= Enum.Material.Air then
                climbStamina = self.Config.climbStamina
            end
        end
    end)

    -- Wall jump input
    humanoid.Jumping:Connect(function(isJumping)
        if isJumping and isOnWall then
            self:WallJump(character, wallNormal)
            isOnWall = false
        end
    end)
end

function WallMovement:DetectWall(rootPart)
    local directions = {
        rootPart.CFrame.LookVector,
        -rootPart.CFrame.LookVector,
        rootPart.CFrame.RightVector,
        -rootPart.CFrame.RightVector
    }

    for _, dir in ipairs(directions) do
        local ray = Ray.new(rootPart.Position, dir * self.Config.wallDetectionDistance)
        local hit, pos, normal = workspace:FindPartOnRay(ray, rootPart.Parent)

        if hit and hit.CanCollide and math.abs(normal.Y) < 0.3 then
            return true, normal
        end
    end

    return false, Vector3.new()
end

function WallMovement:AttachToWall(character, wallNormal)
    local rootPart = character.HumanoidRootPart
    local humanoid = character.Humanoid

    -- Slow fall while on wall
    local bodyVelocity = Instance.new("BodyVelocity")
    bodyVelocity.Name = "WallClimbVelocity"
    bodyVelocity.MaxForce = Vector3.new(math.huge, math.huge, math.huge)
    bodyVelocity.Velocity = Vector3.new(0, self.Config.climbSpeed, 0)
    bodyVelocity.Parent = rootPart

    -- Face away from wall
    local bodyGyro = Instance.new("BodyGyro")
    bodyGyro.Name = "WallClimbGyro"
    bodyGyro.MaxTorque = Vector3.new(math.huge, math.huge, math.huge)
    bodyGyro.CFrame = CFrame.lookAt(rootPart.Position, rootPart.Position + wallNormal)
    bodyGyro.Parent = rootPart

    character:SetAttribute("OnWall", true)
end

function WallMovement:DetachFromWall(character)
    local rootPart = character.HumanoidRootPart

    local velocity = rootPart:FindFirstChild("WallClimbVelocity")
    local gyro = rootPart:FindFirstChild("WallClimbGyro")

    if velocity then velocity:Destroy() end
    if gyro then gyro:Destroy() end

    character:SetAttribute("OnWall", false)
end

function WallMovement:WallJump(character, wallNormal)
    self:DetachFromWall(character)

    local rootPart = character.HumanoidRootPart

    -- Jump away from wall
    local jumpDirection = (wallNormal * self.Config.wallJumpPower.X) +
                         (Vector3.new(0, self.Config.wallJumpPower.Y, 0))

    local jumpForce = Instance.new("BodyVelocity")
    jumpForce.MaxForce = Vector3.new(math.huge, math.huge, math.huge)
    jumpForce.Velocity = jumpDirection
    jumpForce.Parent = rootPart

    task.delay(0.1, function()
        jumpForce:Destroy()
    end)
end

return WallMovement
```

---

### Advanced Movement

#### Grapple Hook

**Description:** Projectile-based traversal that pulls player to targets.

**When to Use:**
- Open world traversal
- Vertical gameplay
- Combat mobility

```lua
-- Grapple hook system
local GrappleSystem = {}

GrappleSystem.Config = {
    maxRange = 100,
    pullSpeed = 80,
    cooldown = 2.0,
    grappleableTag = "Grappleable" -- Tag grappleable objects
}

function GrappleSystem:Fire(player)
    local character = player.Character
    local rootPart = character.HumanoidRootPart

    -- Raycast for target
    local camera = workspace.CurrentCamera
    local mousePos = game:GetService("UserInputService"):GetMouseLocation()
    local ray = camera:ViewportPointToRay(mousePos.X, mousePos.Y)

    local raycastParams = RaycastParams.new()
    raycastParams.FilterDescendantsInstances = {character}

    local result = workspace:Raycast(
        ray.Origin,
        ray.Direction * self.Config.maxRange,
        raycastParams
    )

    if result then
        local hitPart = result.Instance
        local hitPosition = result.Position

        -- Check if grappleable
        if hitPart:HasTag(self.Config.grappleableTag) or true then
            self:StartGrapple(character, hitPosition)
        end
    end
end

function GrappleSystem:StartGrapple(character, targetPosition)
    local rootPart = character.HumanoidRootPart
    local humanoid = character.Humanoid

    -- Create visual rope
    local rope = self:CreateRope(rootPart.Position, targetPosition)

    -- Disable normal movement
    humanoid.PlatformStand = true

    -- Pull toward target
    local bodyPosition = Instance.new("BodyPosition")
    bodyPosition.MaxForce = Vector3.new(math.huge, math.huge, math.huge)
    bodyPosition.Position = targetPosition
    bodyPosition.D = 1000
    bodyPosition.P = self.Config.pullSpeed * 100
    bodyPosition.Parent = rootPart

    -- Detect arrival
    local connection
    connection = game:GetService("RunService").Heartbeat:Connect(function()
        local distance = (rootPart.Position - targetPosition).Magnitude

        -- Update rope visual
        self:UpdateRope(rope, rootPart.Position, targetPosition)

        if distance < 5 then
            self:EndGrapple(character, bodyPosition, rope, connection)
        end
    end)

    -- Safety timeout
    task.delay(3, function()
        if bodyPosition.Parent then
            self:EndGrapple(character, bodyPosition, rope, connection)
        end
    end)
end

function GrappleSystem:EndGrapple(character, bodyPosition, rope, connection)
    connection:Disconnect()
    bodyPosition:Destroy()
    rope:Destroy()
    character.Humanoid.PlatformStand = false
end

function GrappleSystem:CreateRope(startPos, endPos)
    local rope = Instance.new("Part")
    rope.Name = "GrappleRope"
    rope.Anchored = true
    rope.CanCollide = false
    rope.Material = Enum.Material.Neon
    rope.BrickColor = BrickColor.new("Bright blue")
    rope.Parent = workspace

    self:UpdateRope(rope, startPos, endPos)

    return rope
end

function GrappleSystem:UpdateRope(rope, startPos, endPos)
    local distance = (endPos - startPos).Magnitude
    local midpoint = (startPos + endPos) / 2

    rope.Size = Vector3.new(0.2, 0.2, distance)
    rope.CFrame = CFrame.lookAt(midpoint, endPos)
end

return GrappleSystem
```

---

## Combat Mechanics

### Melee Combat

#### Basic Attack Combo

**Description:** Sequential attacks with timing windows.

**When to Use:**
- Action RPGs
- Fighting games
- Hack and slash games

```lua
-- Combo attack system
local ComboSystem = {}

ComboSystem.Config = {
    combos = {
        {name = "Slash", damage = 10, duration = 0.3, range = 5},
        {name = "Strike", damage = 15, duration = 0.35, range = 5},
        {name = "Thrust", damage = 12, duration = 0.25, range = 7},
        {name = "Finisher", damage = 30, duration = 0.5, range = 6}
    },
    comboWindowTime = 0.8, -- seconds to continue combo
    cooldownAfterCombo = 1.0
}

function ComboSystem:Initialize(player)
    local state = {
        currentCombo = 0,
        lastAttackTime = 0,
        isAttacking = false,
        canAttack = true
    }

    return setmetatable({
        player = player,
        state = state
    }, {__index = self})
end

function ComboSystem:Attack()
    local now = tick()

    if not self.state.canAttack or self.state.isAttacking then
        return
    end

    -- Check if continuing combo or starting new
    if now - self.state.lastAttackTime > self.Config.comboWindowTime then
        self.state.currentCombo = 0
    end

    self.state.currentCombo = self.state.currentCombo + 1
    local comboIndex = ((self.state.currentCombo - 1) % #self.Config.combos) + 1
    local attack = self.Config.combos[comboIndex]

    self.state.isAttacking = true
    self.state.lastAttackTime = now

    -- Execute attack
    self:ExecuteAttack(attack)

    -- Finish attack after duration
    task.delay(attack.duration, function()
        self.state.isAttacking = false

        -- Full combo cooldown
        if comboIndex == #self.Config.combos then
            self.state.canAttack = false
            self.state.currentCombo = 0

            task.delay(self.Config.cooldownAfterCombo, function()
                self.state.canAttack = true
            end)
        end
    end)

    return attack
end

function ComboSystem:ExecuteAttack(attack)
    local character = self.player.Character
    local rootPart = character.HumanoidRootPart

    -- Play animation
    self:PlayAttackAnimation(character, attack.name)

    -- Hitbox detection
    local hitbox = self:CreateHitbox(rootPart, attack.range)
    local hits = {}

    for _, part in ipairs(hitbox:GetTouchingParts()) do
        local humanoid = part.Parent:FindFirstChild("Humanoid")
        if humanoid and humanoid ~= character.Humanoid and not hits[humanoid] then
            hits[humanoid] = true
            self:DealDamage(humanoid, attack.damage)
        end
    end

    hitbox:Destroy()
end

function ComboSystem:CreateHitbox(rootPart, range)
    local hitbox = Instance.new("Part")
    hitbox.Size = Vector3.new(range, 4, range)
    hitbox.CFrame = rootPart.CFrame * CFrame.new(0, 0, -range/2)
    hitbox.Anchored = true
    hitbox.CanCollide = false
    hitbox.Transparency = 1
    hitbox.Parent = workspace

    return hitbox
end

function ComboSystem:DealDamage(humanoid, damage)
    humanoid:TakeDamage(damage)

    -- Hit feedback
    local character = humanoid.Parent
    local rootPart = character:FindFirstChild("HumanoidRootPart")
    if rootPart then
        -- Knockback
        local knockback = Instance.new("BodyVelocity")
        knockback.MaxForce = Vector3.new(math.huge, math.huge, math.huge)
        knockback.Velocity = (rootPart.Position - self.player.Character.HumanoidRootPart.Position).Unit * 20
        knockback.Parent = rootPart

        task.delay(0.1, function()
            knockback:Destroy()
        end)
    end
end

return ComboSystem
```

---

### Ranged Combat

#### Projectile System

**Description:** Spawn and manage ranged attacks.

**When to Use:**
- Shooters
- Magic systems
- Tower defense

```lua
-- Projectile system
local ProjectileSystem = {}

ProjectileSystem.Config = {
    types = {
        bullet = {
            speed = 200,
            damage = 25,
            lifetime = 2,
            gravity = false,
            size = Vector3.new(0.2, 0.2, 1),
            color = Color3.fromRGB(255, 200, 0)
        },
        arrow = {
            speed = 80,
            damage = 40,
            lifetime = 5,
            gravity = true,
            size = Vector3.new(0.3, 0.3, 2),
            color = Color3.fromRGB(139, 90, 43)
        },
        fireball = {
            speed = 50,
            damage = 60,
            lifetime = 4,
            gravity = false,
            size = Vector3.new(2, 2, 2),
            color = Color3.fromRGB(255, 100, 0),
            aoe = 10
        }
    }
}

function ProjectileSystem:Fire(player, projectileType, origin, direction)
    local config = self.Config.types[projectileType]
    if not config then return end

    -- Create projectile
    local projectile = Instance.new("Part")
    projectile.Name = "Projectile_" .. projectileType
    projectile.Size = config.size
    projectile.CFrame = CFrame.lookAt(origin, origin + direction)
    projectile.Color = config.color
    projectile.Material = Enum.Material.Neon
    projectile.CanCollide = false
    projectile.Anchored = false

    -- Set velocity
    local bodyVelocity = Instance.new("BodyVelocity")
    bodyVelocity.MaxForce = Vector3.new(math.huge, math.huge, math.huge)
    bodyVelocity.Velocity = direction.Unit * config.speed
    bodyVelocity.Parent = projectile

    -- Apply gravity if needed
    if not config.gravity then
        local bodyForce = Instance.new("BodyForce")
        bodyForce.Force = Vector3.new(0, projectile:GetMass() * workspace.Gravity, 0)
        bodyForce.Parent = projectile
    end

    -- Store metadata
    projectile:SetAttribute("Damage", config.damage)
    projectile:SetAttribute("Owner", player.UserId)
    projectile:SetAttribute("AOE", config.aoe or 0)

    -- Collision handling
    projectile.Touched:Connect(function(hit)
        self:OnProjectileHit(projectile, hit, player)
    end)

    projectile.Parent = workspace

    -- Lifetime
    task.delay(config.lifetime, function()
        if projectile.Parent then
            projectile:Destroy()
        end
    end)

    return projectile
end

function ProjectileSystem:OnProjectileHit(projectile, hit, owner)
    -- Ignore owner
    if hit:IsDescendantOf(owner.Character) then return end

    local damage = projectile:GetAttribute("Damage")
    local aoe = projectile:GetAttribute("AOE")

    if aoe > 0 then
        -- Area damage
        self:DealAOEDamage(projectile.Position, aoe, damage, owner)
        self:CreateExplosion(projectile.Position, aoe)
    else
        -- Direct damage
        local humanoid = hit.Parent:FindFirstChild("Humanoid")
        if humanoid then
            humanoid:TakeDamage(damage)
        end
    end

    projectile:Destroy()
end

function ProjectileSystem:DealAOEDamage(position, radius, damage, owner)
    for _, player in ipairs(game.Players:GetPlayers()) do
        if player ~= owner and player.Character then
            local rootPart = player.Character:FindFirstChild("HumanoidRootPart")
            if rootPart then
                local distance = (rootPart.Position - position).Magnitude
                if distance <= radius then
                    -- Damage falloff
                    local falloff = 1 - (distance / radius)
                    local actualDamage = damage * falloff
                    player.Character.Humanoid:TakeDamage(actualDamage)
                end
            end
        end
    end
end

function ProjectileSystem:CreateExplosion(position, radius)
    local explosion = Instance.new("Part")
    explosion.Shape = Enum.PartType.Ball
    explosion.Size = Vector3.new(1, 1, 1)
    explosion.Position = position
    explosion.Anchored = true
    explosion.CanCollide = false
    explosion.Transparency = 0.5
    explosion.Color = Color3.fromRGB(255, 150, 0)
    explosion.Material = Enum.Material.Neon
    explosion.Parent = workspace

    -- Expand animation
    local tweenService = game:GetService("TweenService")
    local tween = tweenService:Create(explosion, TweenInfo.new(0.3), {
        Size = Vector3.new(radius * 2, radius * 2, radius * 2),
        Transparency = 1
    })
    tween:Play()
    tween.Completed:Connect(function()
        explosion:Destroy()
    end)
end

return ProjectileSystem
```

---

## Collection Mechanics

### Resource Gathering

**Description:** Collect materials from the environment.

**When to Use:**
- Survival games
- Crafting games
- Simulators

```lua
-- Resource gathering system
local GatheringSystem = {}

GatheringSystem.Config = {
    resources = {
        Wood = {
            tool = "Axe",
            baseTime = 2.0,
            baseYield = {min = 5, max = 10},
            xpGain = 10
        },
        Stone = {
            tool = "Pickaxe",
            baseTime = 3.0,
            baseYield = {min = 3, max = 7},
            xpGain = 15
        },
        Ore = {
            tool = "Pickaxe",
            baseTime = 4.0,
            baseYield = {min = 1, max = 3},
            xpGain = 25
        }
    }
}

function GatheringSystem:StartGathering(player, resourceNode)
    local resourceType = resourceNode:GetAttribute("ResourceType")
    local config = self.Config.resources[resourceType]

    if not config then return end

    -- Check for required tool
    local equippedTool = self:GetEquippedTool(player)
    if equippedTool ~= config.tool then
        self:NotifyPlayer(player, "You need a " .. config.tool .. " to gather this!")
        return
    end

    -- Calculate gathering time based on tool quality
    local toolLevel = self:GetToolLevel(player, config.tool)
    local gatherTime = config.baseTime / (1 + toolLevel * 0.2)

    -- Start gathering animation
    self:PlayGatherAnimation(player, resourceType)

    -- Progress bar
    local progressId = self:ShowProgressBar(player, gatherTime)

    -- Complete after time
    task.delay(gatherTime, function()
        self:CompleteGathering(player, resourceNode, config, toolLevel)
        self:HideProgressBar(player, progressId)
    end)
end

function GatheringSystem:CompleteGathering(player, resourceNode, config, toolLevel)
    -- Calculate yield
    local yieldBonus = 1 + (toolLevel * 0.1)
    local minYield = math.floor(config.baseYield.min * yieldBonus)
    local maxYield = math.floor(config.baseYield.max * yieldBonus)
    local yield = math.random(minYield, maxYield)

    local resourceType = resourceNode:GetAttribute("ResourceType")

    -- Grant resources
    self:AddToInventory(player, resourceType, yield)

    -- Grant XP
    self:AddSkillXP(player, "Gathering", config.xpGain)

    -- Update resource node
    local remaining = resourceNode:GetAttribute("Remaining") - 1
    resourceNode:SetAttribute("Remaining", remaining)

    if remaining <= 0 then
        self:DepleteNode(resourceNode)
    end

    -- Notify player
    self:NotifyPlayer(player, "+" .. yield .. " " .. resourceType)
end

function GatheringSystem:DepleteNode(resourceNode)
    -- Visual depletion
    local tweenService = game:GetService("TweenService")
    local tween = tweenService:Create(resourceNode, TweenInfo.new(0.5), {
        Transparency = 1
    })
    tween:Play()

    -- Schedule respawn
    local respawnTime = resourceNode:GetAttribute("RespawnTime") or 60
    task.delay(respawnTime, function()
        self:RespawnNode(resourceNode)
    end)
end

function GatheringSystem:RespawnNode(resourceNode)
    resourceNode:SetAttribute("Remaining", resourceNode:GetAttribute("MaxAmount"))

    local tweenService = game:GetService("TweenService")
    local tween = tweenService:Create(resourceNode, TweenInfo.new(0.5), {
        Transparency = 0
    })
    tween:Play()
end

return GatheringSystem
```

---

### Collectible System

**Description:** Track and reward collection of scattered items.

**When to Use:**
- Exploration games
- Achievement systems
- Completionist content

```lua
-- Collectible tracking system
local CollectibleSystem = {}

CollectibleSystem.Config = {
    categories = {
        Coins = {
            modelName = "Coin",
            value = 1,
            respawns = true,
            respawnTime = 30
        },
        Gems = {
            modelName = "Gem",
            value = 10,
            respawns = false
        },
        Secrets = {
            modelName = "SecretOrb",
            value = 0,
            respawns = false,
            trackProgress = true,
            totalCount = 50
        }
    }
}

function CollectibleSystem:Initialize()
    -- Setup all collectibles in workspace
    for _, collectible in ipairs(workspace:GetDescendants()) do
        if collectible:HasTag("Collectible") then
            self:SetupCollectible(collectible)
        end
    end
end

function CollectibleSystem:SetupCollectible(collectible)
    local category = collectible:GetAttribute("Category")
    local config = self.Config.categories[category]

    if not config then return end

    -- Touch detection
    collectible.Touched:Connect(function(hit)
        local player = game.Players:GetPlayerFromCharacter(hit.Parent)
        if player then
            self:Collect(player, collectible, config)
        end
    end)

    -- Floating animation
    self:AnimateCollectible(collectible)
end

function CollectibleSystem:Collect(player, collectible, config)
    local category = collectible:GetAttribute("Category")

    -- Check if already collected (for non-respawning)
    if not config.respawns then
        local collected = self:GetCollectedList(player, category)
        if table.find(collected, collectible.Name) then
            return
        end
    end

    -- Grant value
    if config.value > 0 then
        self:AddCurrency(player, config.value)
    end

    -- Track progress
    if config.trackProgress then
        self:MarkCollected(player, category, collectible.Name)
        self:CheckCategoryCompletion(player, category, config)
    end

    -- Visual feedback
    self:PlayCollectEffect(collectible)

    -- Handle respawn or permanent collection
    if config.respawns then
        self:HideTemporarily(collectible, config.respawnTime)
    else
        collectible:Destroy()
    end

    -- Sound
    self:PlayCollectSound(collectible.Position)
end

function CollectibleSystem:MarkCollected(player, category, collectibleId)
    local key = "Collected_" .. category
    local collected = player:GetAttribute(key) or ""
    collected = collected .. collectibleId .. ";"
    player:SetAttribute(key, collected)
end

function CollectibleSystem:CheckCategoryCompletion(player, category, config)
    local collected = self:GetCollectedList(player, category)

    if #collected >= config.totalCount then
        self:GrantCategoryReward(player, category)
        self:NotifyPlayer(player, "All " .. category .. " collected! Reward granted!")
    else
        local remaining = config.totalCount - #collected
        self:NotifyPlayer(player, category .. ": " .. #collected .. "/" .. config.totalCount)
    end
end

function CollectibleSystem:AnimateCollectible(collectible)
    local originalY = collectible.Position.Y
    local startTime = math.random() * math.pi * 2

    game:GetService("RunService").Heartbeat:Connect(function()
        if collectible.Parent then
            local offset = math.sin(tick() + startTime) * 0.5
            collectible.Position = Vector3.new(
                collectible.Position.X,
                originalY + offset,
                collectible.Position.Z
            )
            collectible.Orientation = Vector3.new(0, (tick() * 50) % 360, 0)
        end
    end)
end

return CollectibleSystem
```

---

## Social Mechanics

### Trading System

**Description:** Player-to-player item exchange.

**When to Use:**
- Economy-driven games
- Collection games
- MMO-style games

```lua
-- Trading system
local TradingSystem = {}

TradingSystem.Config = {
    tradeRange = 20, -- studs
    confirmTimeout = 60, -- seconds
    maxItemsPerTrade = 10
}

function TradingSystem:InitiateTrade(player1, player2)
    -- Distance check
    local distance = (player1.Character.PrimaryPart.Position -
                      player2.Character.PrimaryPart.Position).Magnitude
    if distance > self.Config.tradeRange then
        return false, "Players too far apart"
    end

    -- Create trade session
    local tradeSession = {
        id = game:GetService("HttpService"):GenerateGUID(),
        players = {player1, player2},
        offers = {
            [player1.UserId] = {items = {}, currency = 0, confirmed = false},
            [player2.UserId] = {items = {}, currency = 0, confirmed = false}
        },
        status = "pending",
        createdAt = tick()
    }

    -- Store session
    self.activeTrades = self.activeTrades or {}
    self.activeTrades[tradeSession.id] = tradeSession

    -- Notify players
    self:OpenTradeUI(player1, tradeSession)
    self:OpenTradeUI(player2, tradeSession)

    -- Timeout
    task.delay(self.Config.confirmTimeout, function()
        if tradeSession.status == "pending" then
            self:CancelTrade(tradeSession, "timeout")
        end
    end)

    return true, tradeSession.id
end

function TradingSystem:AddItemToTrade(player, tradeId, itemId)
    local trade = self.activeTrades[tradeId]
    if not trade then return false end

    local offer = trade.offers[player.UserId]
    if #offer.items >= self.Config.maxItemsPerTrade then
        return false, "Maximum items reached"
    end

    -- Verify player owns item
    if not self:PlayerOwnsItem(player, itemId) then
        return false, "You don't own this item"
    end

    table.insert(offer.items, itemId)

    -- Reset confirmations
    for _, playerOffer in pairs(trade.offers) do
        playerOffer.confirmed = false
    end

    -- Update both players' UI
    self:UpdateTradeUI(trade)

    return true
end

function TradingSystem:SetCurrency(player, tradeId, amount)
    local trade = self.activeTrades[tradeId]
    if not trade then return false end

    -- Verify player has enough currency
    local playerCurrency = self:GetPlayerCurrency(player)
    if amount > playerCurrency then
        return false, "Insufficient funds"
    end

    trade.offers[player.UserId].currency = amount

    -- Reset confirmations
    for _, playerOffer in pairs(trade.offers) do
        playerOffer.confirmed = false
    end

    self:UpdateTradeUI(trade)
    return true
end

function TradingSystem:ConfirmTrade(player, tradeId)
    local trade = self.activeTrades[tradeId]
    if not trade then return false end

    trade.offers[player.UserId].confirmed = true

    -- Check if both confirmed
    local allConfirmed = true
    for _, offer in pairs(trade.offers) do
        if not offer.confirmed then
            allConfirmed = false
            break
        end
    end

    if allConfirmed then
        self:ExecuteTrade(trade)
    else
        self:UpdateTradeUI(trade)
    end

    return true
end

function TradingSystem:ExecuteTrade(trade)
    trade.status = "completed"

    local player1 = trade.players[1]
    local player2 = trade.players[2]
    local offer1 = trade.offers[player1.UserId]
    local offer2 = trade.offers[player2.UserId]

    -- Transfer items
    for _, itemId in ipairs(offer1.items) do
        self:TransferItem(player1, player2, itemId)
    end
    for _, itemId in ipairs(offer2.items) do
        self:TransferItem(player2, player1, itemId)
    end

    -- Transfer currency
    self:TransferCurrency(player1, player2, offer1.currency)
    self:TransferCurrency(player2, player1, offer2.currency)

    -- Log trade
    self:LogTrade(trade)

    -- Cleanup
    self:CloseTradeUI(trade)
    self.activeTrades[trade.id] = nil
end

return TradingSystem
```

---

### Party/Group System

**Description:** Team formation for cooperative play.

**When to Use:**
- Dungeon crawlers
- Raid games
- Team-based games

```lua
-- Party system
local PartySystem = {}

PartySystem.Config = {
    maxPartySize = 4,
    inviteTimeout = 30
}

PartySystem.Parties = {}
PartySystem.PlayerParties = {} -- userId -> partyId

function PartySystem:CreateParty(leader)
    local partyId = game:GetService("HttpService"):GenerateGUID()

    local party = {
        id = partyId,
        leader = leader.UserId,
        members = {leader.UserId},
        settings = {
            lootMode = "FreeForAll", -- or "RoundRobin", "NeedGreed"
            privacy = "InviteOnly" -- or "Open"
        }
    }

    self.Parties[partyId] = party
    self.PlayerParties[leader.UserId] = partyId

    self:UpdatePartyUI(party)

    return partyId
end

function PartySystem:InviteToParty(inviter, invitee)
    local partyId = self.PlayerParties[inviter.UserId]
    if not partyId then
        partyId = self:CreateParty(inviter)
    end

    local party = self.Parties[partyId]

    -- Check if inviter is leader
    if party.leader ~= inviter.UserId then
        return false, "Only the party leader can invite"
    end

    -- Check party size
    if #party.members >= self.Config.maxPartySize then
        return false, "Party is full"
    end

    -- Check if invitee already in a party
    if self.PlayerParties[invitee.UserId] then
        return false, "Player is already in a party"
    end

    -- Send invite
    self:SendInviteUI(invitee, party, inviter)

    -- Timeout
    task.delay(self.Config.inviteTimeout, function()
        -- Invite expires handled by UI
    end)

    return true
end

function PartySystem:AcceptInvite(player, partyId)
    local party = self.Parties[partyId]
    if not party then return false, "Party no longer exists" end

    if #party.members >= self.Config.maxPartySize then
        return false, "Party is now full"
    end

    table.insert(party.members, player.UserId)
    self.PlayerParties[player.UserId] = partyId

    self:NotifyParty(party, player.Name .. " joined the party!")
    self:UpdatePartyUI(party)

    return true
end

function PartySystem:LeaveParty(player)
    local partyId = self.PlayerParties[player.UserId]
    if not partyId then return false end

    local party = self.Parties[partyId]

    -- Remove from members
    for i, memberId in ipairs(party.members) do
        if memberId == player.UserId then
            table.remove(party.members, i)
            break
        end
    end

    self.PlayerParties[player.UserId] = nil

    -- Handle leader leaving
    if party.leader == player.UserId then
        if #party.members > 0 then
            party.leader = party.members[1]
            local newLeader = game.Players:GetPlayerByUserId(party.leader)
            self:NotifyParty(party, newLeader.Name .. " is now the party leader")
        else
            -- Party disbanded
            self.Parties[partyId] = nil
        end
    else
        self:NotifyParty(party, player.Name .. " left the party")
    end

    self:UpdatePartyUI(party)
    return true
end

function PartySystem:GetPartyMembers(player)
    local partyId = self.PlayerParties[player.UserId]
    if not partyId then return {player} end

    local party = self.Parties[partyId]
    local members = {}

    for _, memberId in ipairs(party.members) do
        local member = game.Players:GetPlayerByUserId(memberId)
        if member then
            table.insert(members, member)
        end
    end

    return members
end

return PartySystem
```

---

## Progression Mechanics

### Experience and Leveling

**Description:** Track player progress through XP accumulation.

**When to Use:**
- RPGs
- Progression-focused games
- Long-term engagement

```lua
-- XP and leveling system
local LevelingSystem = {}

LevelingSystem.Config = {
    maxLevel = 100,
    baseXP = 100,
    exponent = 1.5,
    statGains = {
        Health = 10,
        Attack = 2,
        Defense = 1
    }
}

function LevelingSystem:GetXPForLevel(level)
    return math.floor(self.Config.baseXP * (level ^ self.Config.exponent))
end

function LevelingSystem:GetTotalXPForLevel(level)
    local total = 0
    for i = 1, level - 1 do
        total = total + self:GetXPForLevel(i)
    end
    return total
end

function LevelingSystem:AddXP(player, amount)
    local currentXP = player:GetAttribute("XP") or 0
    local currentLevel = player:GetAttribute("Level") or 1

    currentXP = currentXP + amount

    -- Check for level ups
    while currentLevel < self.Config.maxLevel do
        local xpNeeded = self:GetXPForLevel(currentLevel)

        if currentXP >= xpNeeded then
            currentXP = currentXP - xpNeeded
            currentLevel = currentLevel + 1
            self:OnLevelUp(player, currentLevel)
        else
            break
        end
    end

    player:SetAttribute("XP", currentXP)
    player:SetAttribute("Level", currentLevel)

    -- Update UI
    self:UpdateXPBar(player)
end

function LevelingSystem:OnLevelUp(player, newLevel)
    -- Grant stat increases
    for stat, gain in pairs(self.Config.statGains) do
        local current = player:GetAttribute(stat) or 0
        player:SetAttribute(stat, current + gain)
    end

    -- Check for unlock milestones
    self:CheckUnlocks(player, newLevel)

    -- Celebration effects
    self:PlayLevelUpEffect(player)
    self:NotifyPlayer(player, "Level Up! You are now level " .. newLevel)

    -- Full heal on level up
    local humanoid = player.Character and player.Character:FindFirstChild("Humanoid")
    if humanoid then
        humanoid.Health = humanoid.MaxHealth
    end
end

function LevelingSystem:CheckUnlocks(player, level)
    local unlocks = {
        [5] = {type = "skill", id = "Fireball"},
        [10] = {type = "area", id = "DarkForest"},
        [15] = {type = "feature", id = "Trading"},
        [20] = {type = "skill", id = "Teleport"},
        [25] = {type = "area", id = "Dungeon1"}
    }

    local unlock = unlocks[level]
    if unlock then
        self:GrantUnlock(player, unlock)
        self:NotifyPlayer(player, "New unlock: " .. unlock.id)
    end
end

function LevelingSystem:PlayLevelUpEffect(player)
    local character = player.Character
    if not character then return end

    local rootPart = character:FindFirstChild("HumanoidRootPart")
    if not rootPart then return end

    -- Particle burst
    local attachment = Instance.new("Attachment")
    attachment.Parent = rootPart

    local particles = Instance.new("ParticleEmitter")
    particles.Rate = 0
    particles.Lifetime = NumberRange.new(1, 2)
    particles.Speed = NumberRange.new(10, 30)
    particles.SpreadAngle = Vector2.new(360, 360)
    particles.Color = ColorSequence.new(Color3.fromRGB(255, 215, 0))
    particles.Size = NumberSequence.new(1, 0)
    particles.Parent = attachment

    particles:Emit(50)

    -- Light flash
    local light = Instance.new("PointLight")
    light.Brightness = 5
    light.Range = 30
    light.Color = Color3.fromRGB(255, 215, 0)
    light.Parent = rootPart

    -- Fade out
    task.delay(0.5, function()
        game:GetService("TweenService"):Create(light, TweenInfo.new(0.5), {
            Brightness = 0
        }):Play()
    end)

    task.delay(1, function()
        attachment:Destroy()
        light:Destroy()
    end)
end

return LevelingSystem
```

---

### Skill Trees

**Description:** Branching upgrade paths for character customization.

**When to Use:**
- RPGs with build variety
- Long-term progression
- Player expression

```lua
-- Skill tree system
local SkillTreeSystem = {}

SkillTreeSystem.Config = {
    pointsPerLevel = 1,
    trees = {
        Warrior = {
            {id = "slash", name = "Slash", tier = 1, cost = 1, requires = {}},
            {id = "power_slash", name = "Power Slash", tier = 2, cost = 2, requires = {"slash"}},
            {id = "whirlwind", name = "Whirlwind", tier = 3, cost = 3, requires = {"power_slash"}},
            {id = "block", name = "Block", tier = 1, cost = 1, requires = {}},
            {id = "shield_bash", name = "Shield Bash", tier = 2, cost = 2, requires = {"block"}},
        },
        Mage = {
            {id = "fireball", name = "Fireball", tier = 1, cost = 1, requires = {}},
            {id = "meteor", name = "Meteor", tier = 3, cost = 3, requires = {"fireball"}},
            {id = "ice_shard", name = "Ice Shard", tier = 1, cost = 1, requires = {}},
            {id = "blizzard", name = "Blizzard", tier = 3, cost = 3, requires = {"ice_shard"}},
        }
    }
}

function SkillTreeSystem:GetAvailablePoints(player)
    local level = player:GetAttribute("Level") or 1
    local spent = player:GetAttribute("SkillPointsSpent") or 0
    return (level * self.Config.pointsPerLevel) - spent
end

function SkillTreeSystem:CanLearnSkill(player, treeName, skillId)
    local tree = self.Config.trees[treeName]
    if not tree then return false, "Invalid tree" end

    local skill = nil
    for _, s in ipairs(tree) do
        if s.id == skillId then
            skill = s
            break
        end
    end

    if not skill then return false, "Skill not found" end

    -- Check if already learned
    if self:HasSkill(player, skillId) then
        return false, "Already learned"
    end

    -- Check points
    if self:GetAvailablePoints(player) < skill.cost then
        return false, "Not enough skill points"
    end

    -- Check requirements
    for _, reqId in ipairs(skill.requires) do
        if not self:HasSkill(player, reqId) then
            return false, "Missing prerequisite: " .. reqId
        end
    end

    return true
end

function SkillTreeSystem:LearnSkill(player, treeName, skillId)
    local canLearn, reason = self:CanLearnSkill(player, treeName, skillId)
    if not canLearn then
        return false, reason
    end

    local tree = self.Config.trees[treeName]
    local skill = nil
    for _, s in ipairs(tree) do
        if s.id == skillId then
            skill = s
            break
        end
    end

    -- Deduct points
    local spent = player:GetAttribute("SkillPointsSpent") or 0
    player:SetAttribute("SkillPointsSpent", spent + skill.cost)

    -- Grant skill
    local skills = player:GetAttribute("LearnedSkills") or ""
    skills = skills .. skillId .. ";"
    player:SetAttribute("LearnedSkills", skills)

    -- Trigger skill learned event
    self:OnSkillLearned(player, skill)

    return true
end

function SkillTreeSystem:HasSkill(player, skillId)
    local skills = player:GetAttribute("LearnedSkills") or ""
    return string.find(skills, skillId .. ";") ~= nil
end

function SkillTreeSystem:GetLearnedSkills(player)
    local skills = player:GetAttribute("LearnedSkills") or ""
    local result = {}

    for skillId in string.gmatch(skills, "([^;]+)") do
        table.insert(result, skillId)
    end

    return result
end

function SkillTreeSystem:ResetSkills(player, treeName)
    -- Calculate refund
    local tree = self.Config.trees[treeName]
    local refund = 0

    for _, skill in ipairs(tree) do
        if self:HasSkill(player, skill.id) then
            refund = refund + skill.cost
        end
    end

    -- Remove skills from this tree
    local skills = player:GetAttribute("LearnedSkills") or ""
    for _, skill in ipairs(tree) do
        skills = string.gsub(skills, skill.id .. ";", "")
    end
    player:SetAttribute("LearnedSkills", skills)

    -- Refund points
    local spent = player:GetAttribute("SkillPointsSpent") or 0
    player:SetAttribute("SkillPointsSpent", spent - refund)

    return refund
end

return SkillTreeSystem
```

---

## Economy Mechanics

### Currency System

**Description:** Track and manage in-game currencies.

**When to Use:**
- Every game with purchases
- Progression systems
- Reward systems

```lua
-- Multi-currency system
local CurrencySystem = {}

CurrencySystem.Config = {
    currencies = {
        Coins = {
            displayName = "Coins",
            icon = "rbxassetid://123456",
            maxStack = 999999999,
            earned = true, -- Can be earned through gameplay
            premium = false
        },
        Gems = {
            displayName = "Gems",
            icon = "rbxassetid://123457",
            maxStack = 999999,
            earned = true, -- Limited earning, primarily purchased
            premium = true
        },
        Tokens = {
            displayName = "Event Tokens",
            icon = "rbxassetid://123458",
            maxStack = 9999,
            earned = true,
            premium = false,
            seasonal = true
        }
    }
}

function CurrencySystem:GetBalance(player, currencyType)
    return player:GetAttribute(currencyType) or 0
end

function CurrencySystem:AddCurrency(player, currencyType, amount, source)
    local config = self.Config.currencies[currencyType]
    if not config then return false, "Invalid currency" end

    local current = self:GetBalance(player, currencyType)
    local newBalance = math.min(current + amount, config.maxStack)
    local actualAdded = newBalance - current

    player:SetAttribute(currencyType, newBalance)

    -- Log transaction
    self:LogTransaction(player, {
        type = "credit",
        currency = currencyType,
        amount = actualAdded,
        source = source,
        timestamp = os.time()
    })

    -- Update UI
    self:UpdateCurrencyUI(player, currencyType)

    return true, actualAdded
end

function CurrencySystem:RemoveCurrency(player, currencyType, amount, reason)
    local config = self.Config.currencies[currencyType]
    if not config then return false, "Invalid currency" end

    local current = self:GetBalance(player, currencyType)

    if current < amount then
        return false, "Insufficient funds"
    end

    player:SetAttribute(currencyType, current - amount)

    -- Log transaction
    self:LogTransaction(player, {
        type = "debit",
        currency = currencyType,
        amount = amount,
        reason = reason,
        timestamp = os.time()
    })

    -- Update UI
    self:UpdateCurrencyUI(player, currencyType)

    return true
end

function CurrencySystem:CanAfford(player, costs)
    for currencyType, amount in pairs(costs) do
        if self:GetBalance(player, currencyType) < amount then
            return false, currencyType
        end
    end
    return true
end

function CurrencySystem:Purchase(player, costs, itemName)
    local canAfford, missing = self:CanAfford(player, costs)
    if not canAfford then
        return false, "Not enough " .. missing
    end

    -- Deduct all currencies
    for currencyType, amount in pairs(costs) do
        self:RemoveCurrency(player, currencyType, amount, "Purchase: " .. itemName)
    end

    return true
end

function CurrencySystem:LogTransaction(player, transaction)
    -- Store in DataStore for history/analytics
    local key = player.UserId .. "_transactions"
    -- Implementation depends on your data storage solution
end

return CurrencySystem
```

---

### Shop System

**Description:** Item purchasing interface.

**When to Use:**
- Any game with purchasable items
- Economy games
- Progression systems

```lua
-- Shop system
local ShopSystem = {}

ShopSystem.Config = {
    shops = {
        GeneralStore = {
            name = "General Store",
            items = {
                {id = "health_potion", price = {Coins = 50}, stock = -1},
                {id = "mana_potion", price = {Coins = 75}, stock = -1},
                {id = "basic_sword", price = {Coins = 500}, stock = -1},
            }
        },
        PremiumShop = {
            name = "Gem Shop",
            items = {
                {id = "rare_pet", price = {Gems = 100}, stock = -1},
                {id = "cosmetic_wings", price = {Gems = 250}, stock = -1},
                {id = "double_xp_boost", price = {Gems = 50}, stock = -1},
            }
        },
        LimitedShop = {
            name = "Limited Time Offers",
            items = {}, -- Populated dynamically
            refreshTime = 86400 -- 24 hours
        }
    }
}

function ShopSystem:GetShop(shopId)
    local shop = self.Config.shops[shopId]
    if not shop then return nil end

    -- Deep copy to prevent modification
    local shopCopy = {
        name = shop.name,
        items = {}
    }

    for _, item in ipairs(shop.items) do
        local itemData = self:GetItemData(item.id)
        table.insert(shopCopy.items, {
            id = item.id,
            name = itemData.name,
            description = itemData.description,
            icon = itemData.icon,
            price = item.price,
            stock = item.stock
        })
    end

    return shopCopy
end

function ShopSystem:PurchaseItem(player, shopId, itemId, quantity)
    quantity = quantity or 1

    local shop = self.Config.shops[shopId]
    if not shop then return false, "Shop not found" end

    local shopItem = nil
    for _, item in ipairs(shop.items) do
        if item.id == itemId then
            shopItem = item
            break
        end
    end

    if not shopItem then return false, "Item not found in shop" end

    -- Check stock
    if shopItem.stock ~= -1 and shopItem.stock < quantity then
        return false, "Not enough stock"
    end

    -- Calculate total cost
    local totalCost = {}
    for currency, price in pairs(shopItem.price) do
        totalCost[currency] = price * quantity
    end

    -- Check affordability
    local canAfford, missing = CurrencySystem:CanAfford(player, totalCost)
    if not canAfford then
        return false, "Not enough " .. missing
    end

    -- Process purchase
    local success, err = CurrencySystem:Purchase(player, totalCost, itemId)
    if not success then return false, err end

    -- Grant items
    for i = 1, quantity do
        self:GrantItem(player, itemId)
    end

    -- Update stock
    if shopItem.stock ~= -1 then
        shopItem.stock = shopItem.stock - quantity
    end

    return true
end

function ShopSystem:GenerateLimitedShop(player)
    -- Rotate daily deals
    local seed = os.date("%Y%m%d") .. player.UserId
    math.randomseed(tonumber(seed))

    local allItems = self:GetAllShoppableItems()
    local dailyDeals = {}

    -- Pick 3-5 random items with discounts
    local count = math.random(3, 5)
    for i = 1, count do
        local item = allItems[math.random(#allItems)]
        local discount = math.random(10, 50) -- 10-50% off

        table.insert(dailyDeals, {
            id = item.id,
            price = self:ApplyDiscount(item.basePrice, discount),
            originalPrice = item.basePrice,
            discount = discount,
            stock = 1 -- Limited to 1 per day
        })
    end

    return dailyDeals
end

function ShopSystem:ApplyDiscount(price, discountPercent)
    local discounted = {}
    for currency, amount in pairs(price) do
        discounted[currency] = math.floor(amount * (1 - discountPercent / 100))
    end
    return discounted
end

return ShopSystem
```

---

## Meta Mechanics

### Daily Rewards

**Description:** Incentivize daily logins with escalating rewards.

**When to Use:**
- Retention focus
- Live service games
- Free-to-play games

```lua
-- Daily reward system
local DailyRewardSystem = {}

DailyRewardSystem.Config = {
    rewards = {
        {day = 1, rewards = {{type = "Coins", amount = 100}}},
        {day = 2, rewards = {{type = "Coins", amount = 150}}},
        {day = 3, rewards = {{type = "Coins", amount = 200}, {type = "item", id = "potion"}}},
        {day = 4, rewards = {{type = "Coins", amount = 250}}},
        {day = 5, rewards = {{type = "Gems", amount = 10}}},
        {day = 6, rewards = {{type = "Coins", amount = 300}}},
        {day = 7, rewards = {{type = "Coins", amount = 500}, {type = "Gems", amount = 25}, {type = "item", id = "rare_crate"}}},
    },
    resetHour = 0, -- Midnight UTC
    gracePeriod = 48 -- Hours before streak resets
}

function DailyRewardSystem:CanClaim(player)
    local lastClaim = player:GetAttribute("LastDailyReward") or 0
    local now = os.time()

    local lastClaimDate = os.date("*t", lastClaim)
    local nowDate = os.date("*t", now)

    -- Check if already claimed today
    if lastClaimDate.year == nowDate.year and
       lastClaimDate.yday == nowDate.yday then
        return false, "Already claimed today"
    end

    return true
end

function DailyRewardSystem:GetCurrentStreak(player)
    local streak = player:GetAttribute("DailyStreak") or 0
    local lastClaim = player:GetAttribute("LastDailyReward") or 0
    local now = os.time()

    local hoursSinceLastClaim = (now - lastClaim) / 3600

    -- Check if streak should reset
    if hoursSinceLastClaim > self.Config.gracePeriod then
        return 0
    end

    return streak
end

function DailyRewardSystem:Claim(player)
    local canClaim, reason = self:CanClaim(player)
    if not canClaim then
        return false, reason
    end

    local streak = self:GetCurrentStreak(player)
    local now = os.time()
    local lastClaim = player:GetAttribute("LastDailyReward") or 0

    -- Determine if continuing streak or starting new
    local hoursSinceLastClaim = (now - lastClaim) / 3600
    if hoursSinceLastClaim > self.Config.gracePeriod then
        streak = 1
    else
        streak = streak + 1
    end

    -- Get reward for this day (cycle through week)
    local dayIndex = ((streak - 1) % #self.Config.rewards) + 1
    local dayRewards = self.Config.rewards[dayIndex]

    -- Grant rewards
    local grantedRewards = {}
    for _, reward in ipairs(dayRewards.rewards) do
        if reward.type == "Coins" or reward.type == "Gems" then
            CurrencySystem:AddCurrency(player, reward.type, reward.amount, "Daily Reward")
            table.insert(grantedRewards, {
                type = reward.type,
                amount = reward.amount
            })
        elseif reward.type == "item" then
            InventorySystem:AddItem(player, reward.id, 1)
            table.insert(grantedRewards, {
                type = "item",
                id = reward.id
            })
        end
    end

    -- Update player data
    player:SetAttribute("LastDailyReward", now)
    player:SetAttribute("DailyStreak", streak)

    return true, {
        streak = streak,
        rewards = grantedRewards,
        nextReward = self.Config.rewards[((streak) % #self.Config.rewards) + 1]
    }
end

return DailyRewardSystem
```

---

### Achievement System

**Description:** Track and reward player accomplishments.

**When to Use:**
- Long-term engagement
- Player guidance
- Completionist content

```lua
-- Achievement system
local AchievementSystem = {}

AchievementSystem.Achievements = {
    -- Combat achievements
    first_kill = {
        name = "First Blood",
        description = "Defeat your first enemy",
        icon = "rbxassetid://123",
        reward = {Coins = 100},
        hidden = false
    },
    kill_100 = {
        name = "Centurion",
        description = "Defeat 100 enemies",
        icon = "rbxassetid://124",
        reward = {Coins = 1000, Gems = 10},
        hidden = false,
        progress = {current = 0, target = 100}
    },

    -- Exploration achievements
    discover_all_areas = {
        name = "Explorer",
        description = "Discover all areas",
        icon = "rbxassetid://125",
        reward = {Gems = 50},
        hidden = false,
        progress = {current = 0, target = 10}
    },

    -- Hidden achievements
    secret_room = {
        name = "???",
        description = "???",
        icon = "rbxassetid://126",
        reward = {Coins = 5000},
        hidden = true,
        revealedName = "Secret Seeker",
        revealedDescription = "Find the hidden developer room"
    }
}

function AchievementSystem:CheckAchievement(player, achievementId, value)
    local achievement = self.Achievements[achievementId]
    if not achievement then return end

    -- Check if already completed
    if self:IsCompleted(player, achievementId) then
        return
    end

    local completed = false

    if achievement.progress then
        -- Progress-based achievement
        local current = self:GetProgress(player, achievementId)
        current = current + (value or 1)
        self:SetProgress(player, achievementId, current)

        if current >= achievement.progress.target then
            completed = true
        end
    else
        -- Instant achievement
        completed = true
    end

    if completed then
        self:Complete(player, achievementId)
    end
end

function AchievementSystem:Complete(player, achievementId)
    local achievement = self.Achievements[achievementId]

    -- Mark as completed
    local completed = player:GetAttribute("CompletedAchievements") or ""
    completed = completed .. achievementId .. ";"
    player:SetAttribute("CompletedAchievements", completed)

    -- Grant rewards
    for rewardType, amount in pairs(achievement.reward) do
        CurrencySystem:AddCurrency(player, rewardType, amount, "Achievement: " .. achievementId)
    end

    -- Display notification
    local displayName = achievement.hidden and achievement.revealedName or achievement.name
    local displayDesc = achievement.hidden and achievement.revealedDescription or achievement.description

    self:ShowAchievementPopup(player, {
        name = displayName,
        description = displayDesc,
        icon = achievement.icon,
        reward = achievement.reward
    })

    -- Fire event for other systems
    self.AchievementCompleted:Fire(player, achievementId)
end

function AchievementSystem:GetProgress(player, achievementId)
    return player:GetAttribute("AchievementProgress_" .. achievementId) or 0
end

function AchievementSystem:SetProgress(player, achievementId, value)
    player:SetAttribute("AchievementProgress_" .. achievementId, value)
end

function AchievementSystem:IsCompleted(player, achievementId)
    local completed = player:GetAttribute("CompletedAchievements") or ""
    return string.find(completed, achievementId .. ";") ~= nil
end

function AchievementSystem:GetAllAchievements(player)
    local result = {}

    for id, achievement in pairs(self.Achievements) do
        local isCompleted = self:IsCompleted(player, id)

        local entry = {
            id = id,
            completed = isCompleted,
            icon = achievement.icon,
            reward = achievement.reward
        }

        if achievement.hidden and not isCompleted then
            entry.name = "???"
            entry.description = "???"
        else
            entry.name = achievement.hidden and achievement.revealedName or achievement.name
            entry.description = achievement.hidden and achievement.revealedDescription or achievement.description
        end

        if achievement.progress then
            entry.progress = {
                current = self:GetProgress(player, id),
                target = achievement.progress.target
            }
        end

        table.insert(result, entry)
    end

    return result
end

return AchievementSystem
```

---

## Quick Reference

### Mechanics by Genre

| Genre | Essential Mechanics |
|-------|---------------------|
| **Simulator** | Collection, Currency, Upgrades, Rebirth |
| **Tycoon** | Building, Passive Income, Unlocks |
| **RPG** | Combat, Leveling, Skills, Quests |
| **Horror** | Movement, Stealth, Resource Management |
| **Obby** | Jump, Dash, Checkpoints |
| **Fighting** | Combos, Blocking, Special Moves |
| **Social** | Trading, Parties, Chat, Emotes |

### Mechanic Complexity Guide

| Complexity | Implementation Time | Examples |
|------------|---------------------|----------|
| **Simple** | 1-2 hours | Basic movement, Coins, Single attack |
| **Moderate** | 4-8 hours | Combos, Skill tree, Shop |
| **Complex** | 1-3 days | Full combat system, Trading, Matchmaking |
| **System** | 1+ weeks | Complete progression, Economy balance |

---

*This document is part of the Game Designer (Mecha) knowledge base for the Roblox Game Studio squad.*
