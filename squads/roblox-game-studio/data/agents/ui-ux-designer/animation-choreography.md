---
title: "UI Animation Choreography for Roblox"
agent: "ui-ux-designer"
alias: "Pixel"
category: "animation"
version: "1.0.0"
lastUpdated: "2025-01-28"
description: "Animation principles, timing, easing functions, and micro-interactions for polished Roblox UI"
tags: ["animation", "motion", "transitions", "easing", "micro-interactions"]
---

# UI Animation Choreography for Roblox

## Overview

Animation breathes life into UI, providing feedback, guiding attention, and creating delightful experiences. This guide covers animation principles, timing, easing selection, and implementation patterns for creating polished UI animations in Roblox.

## 1. Animation Principles for UI

### 1.1 Core Principles

| Principle | Description | UI Application |
|-----------|-------------|----------------|
| **Anticipation** | Preparation before action | Button press-down before action |
| **Follow Through** | Motion continues past endpoint | Bounce effect on modal open |
| **Ease In/Out** | Gradual acceleration/deceleration | Natural movement feeling |
| **Secondary Action** | Supporting motion | Icon rotation while button animates |
| **Appeal** | Pleasing aesthetics | Smooth, consistent motion |
| **Timing** | Speed and rhythm | Appropriate duration for context |

### 1.2 Animation Purpose Categories

```lua
local AnimationPurpose = {
    -- Feedback: Confirms user action
    Feedback = {
        Duration = { Min = 0.1, Max = 0.2 },
        Examples = { "Button press", "Toggle switch", "Checkbox" },
    },

    -- Transition: Moves between states
    Transition = {
        Duration = { Min = 0.2, Max = 0.4 },
        Examples = { "Page change", "Modal open/close", "Tab switch" },
    },

    -- Attention: Draws user focus
    Attention = {
        Duration = { Min = 0.3, Max = 0.8 },
        Examples = { "Notification pulse", "Error shake", "Achievement" },
    },

    -- Decoration: Enhances experience
    Decoration = {
        Duration = { Min = 0.5, Max = 2.0 },
        Examples = { "Background particles", "Idle animations", "Ambient" },
    },
}
```

### 1.3 Motion Guidelines

```lua
local MotionGuidelines = {
    -- Speed
    Speed = {
        Fast = 0.15,      -- Immediate feedback
        Normal = 0.25,    -- Standard transitions
        Slow = 0.4,       -- Complex transitions
        Deliberate = 0.6, -- Dramatic effect
    },

    -- Distance-based timing
    DistanceTiming = function(distance)
        -- Base time + time per pixel
        return 0.15 + (distance / 1000) * 0.2
    end,

    -- Complexity-based timing
    ComplexityTiming = {
        Simple = 0.15,    -- Single property change
        Moderate = 0.25,  -- Multiple properties
        Complex = 0.35,   -- Coordinated animations
        Elaborate = 0.5,  -- Multi-element choreography
    },
}
```

---

## 2. Timing and Spacing

### 2.1 Duration Guidelines

| Animation Type | Recommended Duration | Notes |
|----------------|---------------------|-------|
| Button feedback | 100-150ms | Quick, snappy |
| Hover effects | 150-200ms | Responsive |
| Toggle/switch | 200-250ms | Visible but fast |
| Dropdown/expand | 200-300ms | Show content flow |
| Modal enter | 250-350ms | Establish presence |
| Modal exit | 200-250ms | Faster than enter |
| Page transition | 300-400ms | Complete but not slow |
| Complex reveal | 400-600ms | Staggered elements |

### 2.2 Timing System Implementation

```lua
local TweenService = game:GetService("TweenService")

local Timing = {}

-- Duration presets
Timing.Duration = {
    Instant = 0,
    Fast = 0.1,
    Quick = 0.15,
    Normal = 0.25,
    Moderate = 0.35,
    Slow = 0.5,
    Deliberate = 0.75,
}

-- Create TweenInfo with preset
function Timing.GetTweenInfo(speed, easingStyle, easingDirection)
    local duration = Timing.Duration[speed] or speed
    return TweenInfo.new(
        duration,
        easingStyle or Enum.EasingStyle.Quad,
        easingDirection or Enum.EasingDirection.Out
    )
end

-- Context-aware duration
function Timing.GetContextDuration(context)
    local durations = {
        feedback = Timing.Duration.Fast,
        interaction = Timing.Duration.Quick,
        transition = Timing.Duration.Normal,
        attention = Timing.Duration.Moderate,
        elaborate = Timing.Duration.Slow,
    }
    return durations[context] or Timing.Duration.Normal
end

-- Distance-responsive timing
function Timing.GetDistanceDuration(startPos, endPos, baseSpeed)
    baseSpeed = baseSpeed or 0.15
    local distance = (endPos - startPos).Magnitude
    local viewportSize = workspace.CurrentCamera.ViewportSize.Magnitude

    -- Normalize distance to viewport
    local normalizedDistance = distance / viewportSize

    -- Scale duration based on distance (min 0.1, max 0.5)
    return math.clamp(baseSpeed + normalizedDistance * 0.3, 0.1, 0.5)
end

return Timing
```

### 2.3 Staggering and Delays

```lua
local Stagger = {}

-- Calculate stagger delay for element index
function Stagger.GetDelay(index, config)
    config = config or {}
    local baseDelay = config.BaseDelay or 0
    local staggerAmount = config.StaggerAmount or 0.05
    local maxDelay = config.MaxDelay or 0.5

    return math.min(baseDelay + (index - 1) * staggerAmount, maxDelay)
end

-- Stagger pattern: linear
function Stagger.Linear(totalItems, totalDuration)
    local delays = {}
    local staggerAmount = totalDuration / totalItems

    for i = 1, totalItems do
        delays[i] = (i - 1) * staggerAmount
    end

    return delays
end

-- Stagger pattern: cascade (accelerating)
function Stagger.Cascade(totalItems, totalDuration)
    local delays = {}
    local factor = totalDuration / (totalItems * (totalItems + 1) / 2)

    local accumulated = 0
    for i = 1, totalItems do
        delays[i] = accumulated
        accumulated = accumulated + factor * i
    end

    return delays
end

-- Stagger pattern: burst (decelerating)
function Stagger.Burst(totalItems, totalDuration)
    local delays = {}
    local factor = totalDuration / (totalItems * (totalItems + 1) / 2)

    local accumulated = 0
    for i = 1, totalItems do
        local reverseIndex = totalItems - i + 1
        delays[i] = accumulated
        accumulated = accumulated + factor * reverseIndex
    end

    return delays
end

-- Stagger pattern: from center
function Stagger.FromCenter(totalItems, totalDuration)
    local delays = {}
    local center = (totalItems + 1) / 2
    local maxDistance = math.ceil(totalItems / 2)
    local staggerAmount = totalDuration / maxDistance

    for i = 1, totalItems do
        local distance = math.abs(i - center)
        delays[i] = distance * staggerAmount
    end

    return delays
end

-- Apply staggered animation to elements
function Stagger.AnimateElements(elements, animationFunc, pattern, totalDuration)
    pattern = pattern or "Linear"
    totalDuration = totalDuration or 0.3

    local patternFunc = Stagger[pattern] or Stagger.Linear
    local delays = patternFunc(#elements, totalDuration)

    for i, element in ipairs(elements) do
        task.delay(delays[i], function()
            animationFunc(element, i)
        end)
    end
end

return Stagger
```

---

## 3. Easing Function Selection Guide

### 3.1 Easing Reference Chart

| Easing Style | In | Out | InOut | Best For |
|--------------|----|----|-------|----------|
| **Linear** | Constant | Constant | Constant | Loading bars, time-based |
| **Quad** | Gentle | Gentle | Smooth | General purpose, most UI |
| **Cubic** | Moderate | Moderate | Natural | Transitions, movements |
| **Quart** | Strong | Strong | Dramatic | Emphasis, important actions |
| **Quint** | Very Strong | Very Strong | Impactful | Attention-grabbing |
| **Sine** | Subtle | Subtle | Organic | Subtle movements, fades |
| **Expo** | Explosive | Snappy | Dynamic | High energy, quick actions |
| **Circ** | Sharp | Sharp | Circular | Bouncy feel without bounce |
| **Back** | Overshoot | Overshoot | Anticipation | Playful, cartoon-like |
| **Elastic** | Springy | Springy | Very springy | Fun, energetic |
| **Bounce** | Bouncing | Bouncing | Bouncing | Playful, achievement |

### 3.2 Easing Selection Helper

```lua
local EasingGuide = {}

-- Recommended easing for common animations
EasingGuide.Recommendations = {
    -- Feedback animations
    ButtonPress = {
        Style = Enum.EasingStyle.Quad,
        Direction = Enum.EasingDirection.Out,
    },
    ButtonRelease = {
        Style = Enum.EasingStyle.Quad,
        Direction = Enum.EasingDirection.Out,
    },
    ToggleSwitch = {
        Style = Enum.EasingStyle.Quad,
        Direction = Enum.EasingDirection.InOut,
    },
    Checkbox = {
        Style = Enum.EasingStyle.Back,
        Direction = Enum.EasingDirection.Out,
    },

    -- Transitions
    FadeIn = {
        Style = Enum.EasingStyle.Quad,
        Direction = Enum.EasingDirection.Out,
    },
    FadeOut = {
        Style = Enum.EasingStyle.Quad,
        Direction = Enum.EasingDirection.In,
    },
    SlideIn = {
        Style = Enum.EasingStyle.Quad,
        Direction = Enum.EasingDirection.Out,
    },
    SlideOut = {
        Style = Enum.EasingStyle.Quad,
        Direction = Enum.EasingDirection.In,
    },
    ModalOpen = {
        Style = Enum.EasingStyle.Back,
        Direction = Enum.EasingDirection.Out,
    },
    ModalClose = {
        Style = Enum.EasingStyle.Quad,
        Direction = Enum.EasingDirection.In,
    },

    -- Attention
    Pulse = {
        Style = Enum.EasingStyle.Sine,
        Direction = Enum.EasingDirection.InOut,
    },
    Shake = {
        Style = Enum.EasingStyle.Quad,
        Direction = Enum.EasingDirection.Out,
    },
    Bounce = {
        Style = Enum.EasingStyle.Bounce,
        Direction = Enum.EasingDirection.Out,
    },
    Pop = {
        Style = Enum.EasingStyle.Back,
        Direction = Enum.EasingDirection.Out,
    },

    -- Continuous
    Rotation = {
        Style = Enum.EasingStyle.Linear,
        Direction = Enum.EasingDirection.InOut,
    },
    Float = {
        Style = Enum.EasingStyle.Sine,
        Direction = Enum.EasingDirection.InOut,
    },
}

function EasingGuide.Get(animationType)
    local recommendation = EasingGuide.Recommendations[animationType]
    if recommendation then
        return recommendation.Style, recommendation.Direction
    end
    return Enum.EasingStyle.Quad, Enum.EasingDirection.Out
end

function EasingGuide.CreateTweenInfo(animationType, duration)
    local style, direction = EasingGuide.Get(animationType)
    return TweenInfo.new(duration or 0.25, style, direction)
end

return EasingGuide
```

### 3.3 Custom Easing Functions

```lua
local CustomEasing = {}

-- For use with RunService-based animations

-- Ease Out Elastic
function CustomEasing.EaseOutElastic(t)
    local c4 = (2 * math.pi) / 3
    if t == 0 then return 0 end
    if t == 1 then return 1 end
    return math.pow(2, -10 * t) * math.sin((t * 10 - 0.75) * c4) + 1
end

-- Ease Out Bounce
function CustomEasing.EaseOutBounce(t)
    local n1 = 7.5625
    local d1 = 2.75

    if t < 1 / d1 then
        return n1 * t * t
    elseif t < 2 / d1 then
        t = t - 1.5 / d1
        return n1 * t * t + 0.75
    elseif t < 2.5 / d1 then
        t = t - 2.25 / d1
        return n1 * t * t + 0.9375
    else
        t = t - 2.625 / d1
        return n1 * t * t + 0.984375
    end
end

-- Smooth Step (Hermite)
function CustomEasing.SmoothStep(t)
    return t * t * (3 - 2 * t)
end

-- Smoother Step (Perlin)
function CustomEasing.SmootherStep(t)
    return t * t * t * (t * (t * 6 - 15) + 10)
end

-- Apply custom easing to animation
function CustomEasing.Animate(element, property, startValue, endValue, duration, easingFunc, callback)
    local RunService = game:GetService("RunService")
    local startTime = tick()
    local connection

    connection = RunService.Heartbeat:Connect(function()
        local elapsed = tick() - startTime
        local progress = math.min(elapsed / duration, 1)
        local easedProgress = easingFunc(progress)

        local currentValue
        if typeof(startValue) == "number" then
            currentValue = startValue + (endValue - startValue) * easedProgress
        elseif typeof(startValue) == "UDim2" then
            currentValue = startValue:Lerp(endValue, easedProgress)
        elseif typeof(startValue) == "Color3" then
            currentValue = startValue:Lerp(endValue, easedProgress)
        elseif typeof(startValue) == "Vector2" then
            currentValue = startValue:Lerp(endValue, easedProgress)
        end

        element[property] = currentValue

        if progress >= 1 then
            connection:Disconnect()
            if callback then callback() end
        end
    end)

    return connection
end

return CustomEasing
```

---

## 4. Staggered Animations

### 4.1 List Item Stagger

```lua
local ListAnimator = {}

function ListAnimator.AnimateListIn(container, config)
    config = config or {}
    local duration = config.Duration or 0.25
    local staggerDelay = config.StaggerDelay or 0.05
    local direction = config.Direction or "Down" -- Down, Up, Left, Right
    local offset = config.Offset or 30

    local TweenService = game:GetService("TweenService")
    local items = {}

    for _, child in ipairs(container:GetChildren()) do
        if child:IsA("GuiObject") and not child:IsA("UIListLayout") then
            table.insert(items, child)
        end
    end

    -- Sort by layout order
    table.sort(items, function(a, b)
        return a.LayoutOrder < b.LayoutOrder
    end)

    -- Set initial state
    for _, item in ipairs(items) do
        item.BackgroundTransparency = 1
        if item:IsA("TextLabel") or item:IsA("TextButton") then
            item.TextTransparency = 1
        end

        local offsetUDim
        if direction == "Down" then
            offsetUDim = UDim2.new(0, 0, 0, -offset)
        elseif direction == "Up" then
            offsetUDim = UDim2.new(0, 0, 0, offset)
        elseif direction == "Left" then
            offsetUDim = UDim2.new(0, offset, 0, 0)
        else -- Right
            offsetUDim = UDim2.new(0, -offset, 0, 0)
        end

        item.Position = item.Position + offsetUDim
    end

    -- Animate each item
    for i, item in ipairs(items) do
        task.delay((i - 1) * staggerDelay, function()
            local tweenInfo = TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)

            local targetPosition = item.Position
            if direction == "Down" then
                targetPosition = item.Position + UDim2.new(0, 0, 0, offset)
            elseif direction == "Up" then
                targetPosition = item.Position + UDim2.new(0, 0, 0, -offset)
            elseif direction == "Left" then
                targetPosition = item.Position + UDim2.new(0, -offset, 0, 0)
            else
                targetPosition = item.Position + UDim2.new(0, offset, 0, 0)
            end

            local properties = {
                Position = targetPosition,
                BackgroundTransparency = config.TargetTransparency or 0,
            }

            if item:IsA("TextLabel") or item:IsA("TextButton") then
                properties.TextTransparency = 0
            end

            TweenService:Create(item, tweenInfo, properties):Play()
        end)
    end
end

function ListAnimator.AnimateListOut(container, config)
    config = config or {}
    local duration = config.Duration or 0.2
    local staggerDelay = config.StaggerDelay or 0.03
    local reverse = config.Reverse or false

    local TweenService = game:GetService("TweenService")
    local items = {}

    for _, child in ipairs(container:GetChildren()) do
        if child:IsA("GuiObject") and not child:IsA("UIListLayout") then
            table.insert(items, child)
        end
    end

    table.sort(items, function(a, b)
        if reverse then
            return a.LayoutOrder > b.LayoutOrder
        end
        return a.LayoutOrder < b.LayoutOrder
    end)

    for i, item in ipairs(items) do
        task.delay((i - 1) * staggerDelay, function()
            local tweenInfo = TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.In)

            local properties = {
                BackgroundTransparency = 1,
            }

            if item:IsA("TextLabel") or item:IsA("TextButton") then
                properties.TextTransparency = 1
            end

            TweenService:Create(item, tweenInfo, properties):Play()
        end)
    end
end

return ListAnimator
```

### 4.2 Grid Stagger Patterns

```lua
local GridAnimator = {}

-- Animate grid items from corner
function GridAnimator.FromCorner(grid, corner, duration, staggerDelay)
    corner = corner or "TopLeft" -- TopLeft, TopRight, BottomLeft, BottomRight
    duration = duration or 0.25
    staggerDelay = staggerDelay or 0.03

    local TweenService = game:GetService("TweenService")
    local items = {}
    local gridLayout = grid:FindFirstChildOfClass("UIGridLayout")
    local cellSize = gridLayout and gridLayout.CellSize or UDim2.new(0, 100, 0, 100)

    for _, child in ipairs(grid:GetChildren()) do
        if child:IsA("GuiObject") and not child:IsA("UIGridLayout") then
            table.insert(items, child)
        end
    end

    -- Calculate grid positions
    for _, item in ipairs(items) do
        local absPos = item.AbsolutePosition
        local gridPos = grid.AbsolutePosition
        local relativeX = (absPos.X - gridPos.X) / cellSize.X.Offset
        local relativeY = (absPos.Y - gridPos.Y) / cellSize.Y.Offset

        item:SetAttribute("GridX", math.floor(relativeX))
        item:SetAttribute("GridY", math.floor(relativeY))

        -- Calculate distance from corner
        local distanceX, distanceY
        if corner == "TopLeft" then
            distanceX = relativeX
            distanceY = relativeY
        elseif corner == "TopRight" then
            distanceX = -relativeX
            distanceY = relativeY
        elseif corner == "BottomLeft" then
            distanceX = relativeX
            distanceY = -relativeY
        else -- BottomRight
            distanceX = -relativeX
            distanceY = -relativeY
        end

        item:SetAttribute("AnimDelay", (distanceX + distanceY) * staggerDelay)

        -- Set initial state
        item.Size = UDim2.new(0, 0, 0, 0)
        item.AnchorPoint = Vector2.new(0.5, 0.5)
    end

    -- Sort by delay and animate
    table.sort(items, function(a, b)
        return a:GetAttribute("AnimDelay") < b:GetAttribute("AnimDelay")
    end)

    for _, item in ipairs(items) do
        task.delay(item:GetAttribute("AnimDelay"), function()
            local tweenInfo = TweenInfo.new(duration, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
            TweenService:Create(item, tweenInfo, {
                Size = cellSize
            }):Play()
        end)
    end
end

-- Animate grid items from center
function GridAnimator.FromCenter(grid, duration, staggerDelay)
    duration = duration or 0.25
    staggerDelay = staggerDelay or 0.02

    local TweenService = game:GetService("TweenService")
    local items = {}
    local gridSize = grid.AbsoluteSize
    local centerX = gridSize.X / 2
    local centerY = gridSize.Y / 2

    for _, child in ipairs(grid:GetChildren()) do
        if child:IsA("GuiObject") and not child:IsA("UIGridLayout") then
            table.insert(items, child)
        end
    end

    for _, item in ipairs(items) do
        local itemCenter = item.AbsolutePosition + item.AbsoluteSize / 2 - grid.AbsolutePosition
        local distanceFromCenter = math.sqrt(
            (itemCenter.X - centerX)^2 + (itemCenter.Y - centerY)^2
        )
        item:SetAttribute("AnimDelay", distanceFromCenter / 100 * staggerDelay)

        item.BackgroundTransparency = 1
        local scale = item:FindFirstChild("UIScale") or Instance.new("UIScale")
        scale.Scale = 0
        scale.Parent = item
    end

    for _, item in ipairs(items) do
        task.delay(item:GetAttribute("AnimDelay"), function()
            local scale = item:FindFirstChild("UIScale")
            local tweenInfo = TweenInfo.new(duration, Enum.EasingStyle.Back, Enum.EasingDirection.Out)

            TweenService:Create(scale, tweenInfo, { Scale = 1 }):Play()
            TweenService:Create(item, tweenInfo, { BackgroundTransparency = 0 }):Play()
        end)
    end
end

return GridAnimator
```

---

## 5. Parallax Effects

### 5.1 UI Parallax System

```lua
local Parallax = {}
Parallax.__index = Parallax

local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")

function Parallax.new(config)
    local self = setmetatable({}, Parallax)

    self.Layers = {}
    self.Enabled = true
    self.Smoothing = config.Smoothing or 0.1
    self.MaxOffset = config.MaxOffset or 20
    self.CurrentOffset = Vector2.new(0, 0)

    self:SetupMouseTracking()

    return self
end

function Parallax:AddLayer(element, depth)
    -- depth: 0 = no movement, 1 = full movement
    table.insert(self.Layers, {
        Element = element,
        Depth = depth,
        OriginalPosition = element.Position,
    })
end

function Parallax:SetupMouseTracking()
    local viewport = workspace.CurrentCamera.ViewportSize
    local centerX = viewport.X / 2
    local centerY = viewport.Y / 2

    self.Connection = RunService.Heartbeat:Connect(function()
        if not self.Enabled then return end

        local mousePos = UserInputService:GetMouseLocation()
        local targetOffset = Vector2.new(
            (mousePos.X - centerX) / centerX,
            (mousePos.Y - centerY) / centerY
        ) * self.MaxOffset

        -- Smooth interpolation
        self.CurrentOffset = self.CurrentOffset:Lerp(targetOffset, self.Smoothing)

        -- Apply to layers
        for _, layer in ipairs(self.Layers) do
            local offset = self.CurrentOffset * layer.Depth
            layer.Element.Position = layer.OriginalPosition + UDim2.new(0, offset.X, 0, offset.Y)
        end
    end)
end

function Parallax:SetEnabled(enabled)
    self.Enabled = enabled
    if not enabled then
        -- Reset positions
        for _, layer in ipairs(self.Layers) do
            layer.Element.Position = layer.OriginalPosition
        end
    end
end

function Parallax:Destroy()
    if self.Connection then
        self.Connection:Disconnect()
    end
end

return Parallax
```

### 5.2 Scroll Parallax

```lua
local ScrollParallax = {}
ScrollParallax.__index = ScrollParallax

function ScrollParallax.new(scrollingFrame, config)
    local self = setmetatable({}, ScrollParallax)

    self.ScrollFrame = scrollingFrame
    self.Layers = {}
    self.Config = config or {}

    self:SetupScrollTracking()

    return self
end

function ScrollParallax:AddLayer(element, speed)
    -- speed: < 1 moves slower (background), > 1 moves faster (foreground)
    table.insert(self.Layers, {
        Element = element,
        Speed = speed,
        OriginalY = element.Position.Y.Offset,
    })
end

function ScrollParallax:SetupScrollTracking()
    local lastScrollPos = self.ScrollFrame.CanvasPosition.Y

    self.ScrollFrame:GetPropertyChangedSignal("CanvasPosition"):Connect(function()
        local currentPos = self.ScrollFrame.CanvasPosition.Y
        local delta = currentPos - lastScrollPos
        lastScrollPos = currentPos

        for _, layer in ipairs(self.Layers) do
            local offset = delta * (1 - layer.Speed)
            local newY = layer.Element.Position.Y.Offset + offset

            layer.Element.Position = UDim2.new(
                layer.Element.Position.X.Scale,
                layer.Element.Position.X.Offset,
                layer.Element.Position.Y.Scale,
                newY
            )
        end
    end)
end

return ScrollParallax
```

---

## 6. Micro-Interactions Catalog

### 6.1 Button Micro-Interactions

```lua
local ButtonMicro = {}

local TweenService = game:GetService("TweenService")

-- Press down effect
function ButtonMicro.PressDown(button)
    local tweenInfo = TweenInfo.new(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
    TweenService:Create(button, tweenInfo, {
        Size = button.Size - UDim2.new(0, 4, 0, 4)
    }):Play()
end

-- Press up effect
function ButtonMicro.PressUp(button, originalSize)
    local tweenInfo = TweenInfo.new(0.15, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
    TweenService:Create(button, tweenInfo, {
        Size = originalSize
    }):Play()
end

-- Ripple effect
function ButtonMicro.Ripple(button, position)
    local ripple = Instance.new("Frame")
    ripple.Name = "Ripple"
    ripple.AnchorPoint = Vector2.new(0.5, 0.5)
    ripple.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
    ripple.BackgroundTransparency = 0.7
    ripple.BorderSizePixel = 0
    ripple.ZIndex = button.ZIndex + 1
    ripple.ClipsDescendants = true

    local buttonPos = button.AbsolutePosition
    local relativeX = position.X - buttonPos.X
    local relativeY = position.Y - buttonPos.Y

    ripple.Position = UDim2.new(0, relativeX, 0, relativeY)
    ripple.Size = UDim2.new(0, 0, 0, 0)
    ripple.Parent = button

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(1, 0)
    corner.Parent = ripple

    -- Calculate size to cover button
    local maxDimension = math.max(button.AbsoluteSize.X, button.AbsoluteSize.Y) * 2.5

    local expandTween = TweenService:Create(ripple, TweenInfo.new(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
        Size = UDim2.new(0, maxDimension, 0, maxDimension),
        BackgroundTransparency = 1
    })

    expandTween:Play()
    expandTween.Completed:Connect(function()
        ripple:Destroy()
    end)
end

-- Glow pulse effect
function ButtonMicro.GlowPulse(button, color)
    color = color or Color3.fromRGB(59, 130, 246)

    local stroke = button:FindFirstChild("UIStroke")
    if not stroke then
        stroke = Instance.new("UIStroke")
        stroke.Thickness = 0
        stroke.Color = color
        stroke.Parent = button
    end

    local tweenInfo = TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)

    TweenService:Create(stroke, tweenInfo, {
        Thickness = 4,
        Transparency = 0
    }):Play()

    task.delay(0.3, function()
        TweenService:Create(stroke, TweenInfo.new(0.4), {
            Thickness = 0,
            Transparency = 1
        }):Play()
    end)
end

-- Shake effect (for errors)
function ButtonMicro.Shake(element)
    local originalPos = element.Position
    local intensity = 5
    local duration = 0.4
    local shakes = 5

    for i = 1, shakes do
        local direction = (i % 2 == 0) and 1 or -1
        local offset = intensity * direction * (1 - i/shakes)

        task.delay((i-1) * duration/shakes, function()
            local tweenInfo = TweenInfo.new(duration/shakes/2, Enum.EasingStyle.Quad)
            TweenService:Create(element, tweenInfo, {
                Position = originalPos + UDim2.new(0, offset, 0, 0)
            }):Play()
        end)
    end

    task.delay(duration, function()
        TweenService:Create(element, TweenInfo.new(0.1), {
            Position = originalPos
        }):Play()
    end)
end

return ButtonMicro
```

### 6.2 Toggle Micro-Interactions

```lua
local ToggleMicro = {}

local TweenService = game:GetService("TweenService")

function ToggleMicro.Switch(toggle, isOn)
    local background = toggle.Background
    local knob = toggle.Knob

    local tweenInfo = TweenInfo.new(0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut)

    -- Background color
    TweenService:Create(background, tweenInfo, {
        BackgroundColor3 = isOn
            and Color3.fromRGB(59, 130, 246)
            or Color3.fromRGB(71, 85, 105)
    }):Play()

    -- Knob position with stretch effect
    local stretchTween = TweenService:Create(knob, TweenInfo.new(0.1), {
        Size = UDim2.new(0, 28, 0, 22)
    })

    stretchTween:Play()
    stretchTween.Completed:Connect(function()
        TweenService:Create(knob, tweenInfo, {
            Position = isOn
                and UDim2.new(1, -3, 0.5, 0)
                or UDim2.new(0, 3, 0.5, 0),
            AnchorPoint = isOn
                and Vector2.new(1, 0.5)
                or Vector2.new(0, 0.5),
            Size = UDim2.new(0, 22, 0, 22)
        }):Play()
    end)
end

return ToggleMicro
```

### 6.3 Notification Micro-Interactions

```lua
local NotificationMicro = {}

local TweenService = game:GetService("TweenService")

-- Badge pop effect
function NotificationMicro.BadgePop(badge, count)
    badge.Text = tostring(count)
    badge.Visible = count > 0

    if count > 0 then
        local scale = badge:FindFirstChild("UIScale") or Instance.new("UIScale", badge)
        scale.Scale = 0

        TweenService:Create(scale, TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
            Scale = 1
        }):Play()
    end
end

-- Notification bell ring
function NotificationMicro.BellRing(bellIcon)
    local originalRotation = bellIcon.Rotation

    local sequence = {
        { Rotation = 15, Duration = 0.1 },
        { Rotation = -15, Duration = 0.1 },
        { Rotation = 10, Duration = 0.1 },
        { Rotation = -10, Duration = 0.1 },
        { Rotation = 5, Duration = 0.08 },
        { Rotation = -5, Duration = 0.08 },
        { Rotation = 0, Duration = 0.08 },
    }

    local delay = 0
    for _, step in ipairs(sequence) do
        task.delay(delay, function()
            TweenService:Create(bellIcon, TweenInfo.new(step.Duration, Enum.EasingStyle.Quad), {
                Rotation = step.Rotation
            }):Play()
        end)
        delay = delay + step.Duration
    end
end

-- Slide in notification
function NotificationMicro.SlideIn(notification, direction)
    direction = direction or "Right"

    local startOffset
    if direction == "Right" then
        startOffset = UDim2.new(0, 100, 0, 0)
    elseif direction == "Left" then
        startOffset = UDim2.new(0, -100, 0, 0)
    elseif direction == "Top" then
        startOffset = UDim2.new(0, 0, 0, -100)
    else
        startOffset = UDim2.new(0, 0, 0, 100)
    end

    local targetPos = notification.Position
    notification.Position = targetPos + startOffset
    notification.BackgroundTransparency = 1

    TweenService:Create(notification, TweenInfo.new(0.35, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
        Position = targetPos,
        BackgroundTransparency = 0
    }):Play()
end

return NotificationMicro
```

---

## 7. Loading States Animation

### 7.1 Spinner Variations

```lua
local Spinners = {}

local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")

-- Basic rotating spinner
function Spinners.CreateRotating(parent, size, color)
    size = size or 32
    color = color or Color3.fromRGB(59, 130, 246)

    local spinner = Instance.new("ImageLabel")
    spinner.Name = "Spinner"
    spinner.Size = UDim2.new(0, size, 0, size)
    spinner.BackgroundTransparency = 1
    spinner.Image = "rbxassetid://6034973115"
    spinner.ImageColor3 = color
    spinner.Parent = parent

    local tween = TweenService:Create(
        spinner,
        TweenInfo.new(1, Enum.EasingStyle.Linear, Enum.EasingDirection.InOut, -1),
        { Rotation = 360 }
    )
    tween:Play()

    return spinner
end

-- Dots loading indicator
function Spinners.CreateDots(parent, config)
    config = config or {}
    local dotCount = config.DotCount or 3
    local dotSize = config.DotSize or 8
    local spacing = config.Spacing or 12
    local color = config.Color or Color3.fromRGB(255, 255, 255)

    local container = Instance.new("Frame")
    container.Name = "DotsSpinner"
    container.Size = UDim2.new(0, (dotSize * dotCount) + (spacing * (dotCount - 1)), 0, dotSize)
    container.BackgroundTransparency = 1
    container.Parent = parent

    local layout = Instance.new("UIListLayout")
    layout.FillDirection = Enum.FillDirection.Horizontal
    layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
    layout.Padding = UDim.new(0, spacing)
    layout.Parent = container

    local dots = {}
    for i = 1, dotCount do
        local dot = Instance.new("Frame")
        dot.Name = "Dot" .. i
        dot.Size = UDim2.new(0, dotSize, 0, dotSize)
        dot.BackgroundColor3 = color
        dot.BackgroundTransparency = 0.5
        dot.LayoutOrder = i
        dot.Parent = container

        local corner = Instance.new("UICorner")
        corner.CornerRadius = UDim.new(1, 0)
        corner.Parent = dot

        dots[i] = dot
    end

    -- Animate dots
    local function animateDots()
        while container.Parent do
            for i, dot in ipairs(dots) do
                task.delay((i - 1) * 0.15, function()
                    TweenService:Create(dot, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
                        BackgroundTransparency = 0,
                        Size = UDim2.new(0, dotSize * 1.2, 0, dotSize * 1.2)
                    }):Play()

                    task.delay(0.3, function()
                        TweenService:Create(dot, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
                            BackgroundTransparency = 0.5,
                            Size = UDim2.new(0, dotSize, 0, dotSize)
                        }):Play()
                    end)
                end)
            end
            task.wait(dotCount * 0.15 + 0.6)
        end
    end

    task.spawn(animateDots)

    return container
end

-- Progress bar with animation
function Spinners.CreateProgressBar(parent, config)
    config = config or {}
    local width = config.Width or 200
    local height = config.Height or 4
    local color = config.Color or Color3.fromRGB(59, 130, 246)

    local container = Instance.new("Frame")
    container.Name = "ProgressBar"
    container.Size = UDim2.new(0, width, 0, height)
    container.BackgroundColor3 = Color3.fromRGB(51, 65, 85)
    container.ClipsDescendants = true
    container.Parent = parent

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(1, 0)
    corner.Parent = container

    local fill = Instance.new("Frame")
    fill.Name = "Fill"
    fill.Size = UDim2.new(0.3, 0, 1, 0)
    fill.Position = UDim2.new(-0.3, 0, 0, 0)
    fill.BackgroundColor3 = color
    fill.BorderSizePixel = 0
    fill.Parent = container

    local fillCorner = Instance.new("UICorner")
    fillCorner.CornerRadius = UDim.new(1, 0)
    fillCorner.Parent = fill

    -- Indeterminate animation
    local function animate()
        while container.Parent do
            fill.Position = UDim2.new(-0.3, 0, 0, 0)
            TweenService:Create(fill, TweenInfo.new(1.5, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut), {
                Position = UDim2.new(1, 0, 0, 0)
            }):Play()
            task.wait(1.5)
        end
    end

    task.spawn(animate)

    return container
end

-- Skeleton loading
function Spinners.CreateSkeleton(element)
    local skeleton = Instance.new("Frame")
    skeleton.Name = "Skeleton"
    skeleton.Size = UDim2.new(1, 0, 1, 0)
    skeleton.BackgroundColor3 = Color3.fromRGB(51, 65, 85)
    skeleton.Parent = element

    local corner = Instance.new("UICorner")
    if element:FindFirstChildOfClass("UICorner") then
        corner.CornerRadius = element:FindFirstChildOfClass("UICorner").CornerRadius
    else
        corner.CornerRadius = UDim.new(0, 4)
    end
    corner.Parent = skeleton

    -- Shimmer effect
    local shimmer = Instance.new("Frame")
    shimmer.Name = "Shimmer"
    shimmer.Size = UDim2.new(0.5, 0, 1, 0)
    shimmer.Position = UDim2.new(-0.5, 0, 0, 0)
    shimmer.BackgroundTransparency = 1
    shimmer.Parent = skeleton

    local gradient = Instance.new("UIGradient")
    gradient.Transparency = NumberSequence.new({
        NumberSequenceKeypoint.new(0, 1),
        NumberSequenceKeypoint.new(0.3, 0.7),
        NumberSequenceKeypoint.new(0.5, 0.5),
        NumberSequenceKeypoint.new(0.7, 0.7),
        NumberSequenceKeypoint.new(1, 1),
    })
    gradient.Color = ColorSequence.new(Color3.fromRGB(255, 255, 255))
    gradient.Parent = shimmer

    local shimmerFrame = Instance.new("Frame")
    shimmerFrame.Size = UDim2.new(1, 0, 1, 0)
    shimmerFrame.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
    shimmerFrame.Parent = shimmer

    local function animateShimmer()
        while skeleton.Parent do
            shimmer.Position = UDim2.new(-0.5, 0, 0, 0)
            TweenService:Create(shimmer, TweenInfo.new(1.2, Enum.EasingStyle.Linear), {
                Position = UDim2.new(1, 0, 0, 0)
            }):Play()
            task.wait(1.5)
        end
    end

    task.spawn(animateShimmer)

    return skeleton
end

return Spinners
```

---

## 8. Transition Orchestration

### 8.1 Screen Transition Manager

```lua
local TransitionManager = {}
TransitionManager.__index = TransitionManager

local TweenService = game:GetService("TweenService")

function TransitionManager.new(screenGui)
    local self = setmetatable({}, TransitionManager)

    self.ScreenGui = screenGui
    self.CurrentScreen = nil
    self.Transitioning = false

    return self
end

-- Fade transition
function TransitionManager:Fade(fromScreen, toScreen, duration)
    if self.Transitioning then return end
    self.Transitioning = true
    duration = duration or 0.3

    local tweenInfo = TweenInfo.new(duration / 2, Enum.EasingStyle.Quad)

    -- Fade out
    if fromScreen then
        local fadeOut = TweenService:Create(fromScreen, tweenInfo, {
            BackgroundTransparency = 1
        })
        fadeOut:Play()

        -- Fade out all children
        for _, child in ipairs(fromScreen:GetDescendants()) do
            if child:IsA("GuiObject") then
                TweenService:Create(child, tweenInfo, {
                    BackgroundTransparency = 1
                }):Play()
            end
            if child:IsA("TextLabel") or child:IsA("TextButton") then
                TweenService:Create(child, tweenInfo, {
                    TextTransparency = 1
                }):Play()
            end
        end

        fadeOut.Completed:Wait()
        fromScreen.Visible = false
    end

    -- Fade in
    if toScreen then
        toScreen.Visible = true

        -- Set initial transparency
        toScreen.BackgroundTransparency = 1
        for _, child in ipairs(toScreen:GetDescendants()) do
            if child:IsA("GuiObject") then
                child.BackgroundTransparency = 1
            end
            if child:IsA("TextLabel") or child:IsA("TextButton") then
                child.TextTransparency = 1
            end
        end

        local fadeIn = TweenService:Create(toScreen, tweenInfo, {
            BackgroundTransparency = 0
        })
        fadeIn:Play()

        for _, child in ipairs(toScreen:GetDescendants()) do
            if child:IsA("GuiObject") and child.Name ~= "Transparent" then
                TweenService:Create(child, tweenInfo, {
                    BackgroundTransparency = child:GetAttribute("TargetTransparency") or 0
                }):Play()
            end
            if child:IsA("TextLabel") or child:IsA("TextButton") then
                TweenService:Create(child, tweenInfo, {
                    TextTransparency = 0
                }):Play()
            end
        end

        fadeIn.Completed:Wait()
    end

    self.CurrentScreen = toScreen
    self.Transitioning = false
end

-- Slide transition
function TransitionManager:Slide(fromScreen, toScreen, direction, duration)
    if self.Transitioning then return end
    self.Transitioning = true
    direction = direction or "Left"
    duration = duration or 0.35

    local tweenInfo = TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut)

    local exitOffset, enterOffset
    if direction == "Left" then
        exitOffset = UDim2.new(-1, 0, 0, 0)
        enterOffset = UDim2.new(1, 0, 0, 0)
    elseif direction == "Right" then
        exitOffset = UDim2.new(1, 0, 0, 0)
        enterOffset = UDim2.new(-1, 0, 0, 0)
    elseif direction == "Up" then
        exitOffset = UDim2.new(0, 0, -1, 0)
        enterOffset = UDim2.new(0, 0, 1, 0)
    else -- Down
        exitOffset = UDim2.new(0, 0, 1, 0)
        enterOffset = UDim2.new(0, 0, -1, 0)
    end

    if toScreen then
        toScreen.Position = enterOffset
        toScreen.Visible = true
    end

    local tweens = {}

    if fromScreen then
        table.insert(tweens, TweenService:Create(fromScreen, tweenInfo, {
            Position = exitOffset
        }))
    end

    if toScreen then
        table.insert(tweens, TweenService:Create(toScreen, tweenInfo, {
            Position = UDim2.new(0, 0, 0, 0)
        }))
    end

    for _, tween in ipairs(tweens) do
        tween:Play()
    end

    tweens[1].Completed:Wait()

    if fromScreen then
        fromScreen.Visible = false
        fromScreen.Position = UDim2.new(0, 0, 0, 0)
    end

    self.CurrentScreen = toScreen
    self.Transitioning = false
end

-- Modal presentation
function TransitionManager:PresentModal(modal, duration)
    if self.Transitioning then return end
    self.Transitioning = true
    duration = duration or 0.3

    modal.Visible = true

    -- Background overlay
    local overlay = modal:FindFirstChild("Overlay")
    if overlay then
        overlay.BackgroundTransparency = 1
        TweenService:Create(overlay, TweenInfo.new(duration), {
            BackgroundTransparency = 0.5
        }):Play()
    end

    -- Modal content
    local content = modal:FindFirstChild("Content")
    if content then
        local scale = content:FindFirstChild("UIScale") or Instance.new("UIScale", content)
        scale.Scale = 0.8
        content.BackgroundTransparency = 1

        local tweenInfo = TweenInfo.new(duration, Enum.EasingStyle.Back, Enum.EasingDirection.Out)

        TweenService:Create(scale, tweenInfo, { Scale = 1 }):Play()
        TweenService:Create(content, tweenInfo, { BackgroundTransparency = 0 }):Play()
    end

    task.wait(duration)
    self.Transitioning = false
end

-- Modal dismissal
function TransitionManager:DismissModal(modal, duration)
    if self.Transitioning then return end
    self.Transitioning = true
    duration = duration or 0.2

    local overlay = modal:FindFirstChild("Overlay")
    if overlay then
        TweenService:Create(overlay, TweenInfo.new(duration), {
            BackgroundTransparency = 1
        }):Play()
    end

    local content = modal:FindFirstChild("Content")
    if content then
        local scale = content:FindFirstChild("UIScale")
        local tweenInfo = TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.In)

        if scale then
            TweenService:Create(scale, tweenInfo, { Scale = 0.8 }):Play()
        end
        TweenService:Create(content, tweenInfo, { BackgroundTransparency = 1 }):Play()
    end

    task.wait(duration)
    modal.Visible = false
    self.Transitioning = false
end

return TransitionManager
```

---

## 9. Performance-Conscious Animation

### 9.1 Animation Performance Tips

```lua
local AnimationPerformance = {}

-- Batch animations to reduce overhead
function AnimationPerformance.BatchAnimate(elements, propertyChanges, duration, easing)
    local TweenService = game:GetService("TweenService")
    local tweenInfo = TweenInfo.new(duration or 0.25, easing or Enum.EasingStyle.Quad, Enum.EasingDirection.Out)

    -- Create all tweens first
    local tweens = {}
    for _, element in ipairs(elements) do
        tweens[element] = TweenService:Create(element, tweenInfo, propertyChanges)
    end

    -- Play all at once
    for _, tween in pairs(tweens) do
        tween:Play()
    end

    return tweens
end

-- Throttle rapid animations
local AnimationThrottles = {}

function AnimationPerformance.ThrottledAnimate(element, propertyChanges, duration, minInterval)
    minInterval = minInterval or 0.05
    local elementId = tostring(element)

    if AnimationThrottles[elementId] and tick() - AnimationThrottles[elementId] < minInterval then
        return nil
    end

    AnimationThrottles[elementId] = tick()

    local TweenService = game:GetService("TweenService")
    local tweenInfo = TweenInfo.new(duration or 0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
    local tween = TweenService:Create(element, tweenInfo, propertyChanges)
    tween:Play()

    return tween
end

-- Cancel redundant animations
local ActiveTweens = {}

function AnimationPerformance.SmartAnimate(element, propertyChanges, duration, easing)
    local elementId = tostring(element)

    -- Cancel existing tween for this element
    if ActiveTweens[elementId] then
        ActiveTweens[elementId]:Cancel()
    end

    local TweenService = game:GetService("TweenService")
    local tweenInfo = TweenInfo.new(
        duration or 0.25,
        easing or Enum.EasingStyle.Quad,
        Enum.EasingDirection.Out
    )

    local tween = TweenService:Create(element, tweenInfo, propertyChanges)
    ActiveTweens[elementId] = tween

    tween.Completed:Connect(function()
        if ActiveTweens[elementId] == tween then
            ActiveTweens[elementId] = nil
        end
    end)

    tween:Play()
    return tween
end

-- Reduce animation quality for low-end devices
function AnimationPerformance.GetQualityLevel()
    local quality = settings().Rendering.QualityLevel
    if quality == Enum.QualityLevel.Automatic then
        -- Estimate based on frame rate
        local fps = 1 / game:GetService("RunService").Heartbeat:Wait()
        if fps < 30 then
            return "Low"
        elseif fps < 50 then
            return "Medium"
        else
            return "High"
        end
    end
    return quality.Name
end

function AnimationPerformance.AdjustForQuality(baseDuration)
    local quality = AnimationPerformance.GetQualityLevel()

    if quality == "Low" then
        return baseDuration * 0.5 -- Faster, less frames
    elseif quality == "Medium" then
        return baseDuration * 0.75
    else
        return baseDuration
    end
end

-- Skip animations on low-end devices
function AnimationPerformance.ShouldAnimate()
    local quality = AnimationPerformance.GetQualityLevel()
    return quality ~= "Low"
end

return AnimationPerformance
```

### 9.2 Frame Budget Management

```lua
local FrameBudget = {}

local RunService = game:GetService("RunService")
local animationQueue = {}
local isProcessing = false

-- Maximum time per frame for animations (in seconds)
local MAX_ANIMATION_TIME = 0.004 -- 4ms

function FrameBudget.QueueAnimation(animFunc, priority)
    priority = priority or 0
    table.insert(animationQueue, {
        Func = animFunc,
        Priority = priority,
    })

    -- Sort by priority
    table.sort(animationQueue, function(a, b)
        return a.Priority > b.Priority
    end)

    if not isProcessing then
        FrameBudget.ProcessQueue()
    end
end

function FrameBudget.ProcessQueue()
    isProcessing = true

    RunService.Heartbeat:Connect(function()
        if #animationQueue == 0 then
            return
        end

        local startTime = tick()

        while #animationQueue > 0 and tick() - startTime < MAX_ANIMATION_TIME do
            local animation = table.remove(animationQueue, 1)
            animation.Func()
        end
    end)
end

return FrameBudget
```

---

## Summary

Effective UI animation in Roblox requires:

1. **Purpose**: Every animation should serve feedback, transition, attention, or decoration
2. **Timing**: Use appropriate durations based on animation type and context
3. **Easing**: Select easing functions that match the intended feel
4. **Staggering**: Create visual rhythm with properly timed sequential animations
5. **Micro-interactions**: Add polish with small, delightful feedback animations
6. **Performance**: Optimize animations for all device capabilities

Following these principles creates polished, professional UI experiences that enhance gameplay without compromising performance.
