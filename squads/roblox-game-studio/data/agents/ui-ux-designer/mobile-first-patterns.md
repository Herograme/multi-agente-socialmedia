---
title: "Mobile-First Design Patterns for Roblox"
agent: "ui-ux-designer"
alias: "Pixel"
category: "mobile-design"
version: "1.0.0"
lastUpdated: "2025-01-28"
description: "Comprehensive mobile-first design patterns and implementation guidelines for Roblox experiences"
tags: ["mobile", "touch", "gestures", "responsive", "hud", "joystick"]
---

# Mobile-First Design Patterns for Roblox

## Overview

With over 70% of Roblox players on mobile devices, designing mobile-first is essential. This guide covers touch gestures, thumb zones, mobile HUD patterns, and device-specific adaptations for creating optimal mobile experiences.

## 1. Touch Gestures Implementation

### 1.1 Gesture Detection Framework

```lua
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")

local GestureDetector = {}
GestureDetector.__index = GestureDetector

-- Configuration
local Config = {
    TapMaxDuration = 0.3,      -- Maximum duration for tap (seconds)
    TapMaxMovement = 20,        -- Maximum movement for tap (pixels)
    LongPressDelay = 0.5,       -- Delay for long press (seconds)
    DoubleTapInterval = 0.3,    -- Max interval between taps
    SwipeMinDistance = 50,      -- Minimum swipe distance (pixels)
    SwipeMaxDuration = 0.5,     -- Maximum swipe duration (seconds)
    PinchThreshold = 10,        -- Minimum pinch distance change
}

function GestureDetector.new()
    local self = setmetatable({}, GestureDetector)

    self.Touches = {}
    self.LastTapTime = 0
    self.LastTapPosition = nil
    self.Callbacks = {
        OnTap = nil,
        OnDoubleTap = nil,
        OnLongPress = nil,
        OnSwipe = nil,
        OnPinch = nil,
        OnPan = nil,
    }

    self:SetupInputListeners()

    return self
end

function GestureDetector:SetupInputListeners()
    UserInputService.TouchStarted:Connect(function(input, processed)
        if processed then return end
        self:HandleTouchStart(input)
    end)

    UserInputService.TouchMoved:Connect(function(input, processed)
        if processed then return end
        self:HandleTouchMove(input)
    end)

    UserInputService.TouchEnded:Connect(function(input, processed)
        self:HandleTouchEnd(input)
    end)
end

function GestureDetector:HandleTouchStart(input)
    local touchId = input.UserInputState

    self.Touches[touchId] = {
        StartPosition = input.Position,
        CurrentPosition = input.Position,
        StartTime = tick(),
        LongPressTriggered = false,
    }

    -- Start long press detection
    local touchData = self.Touches[touchId]
    task.delay(Config.LongPressDelay, function()
        if touchData and not touchData.LongPressTriggered then
            local movement = (touchData.CurrentPosition - touchData.StartPosition).Magnitude
            if movement < Config.TapMaxMovement then
                touchData.LongPressTriggered = true
                if self.Callbacks.OnLongPress then
                    self.Callbacks.OnLongPress(touchData.CurrentPosition)
                end
            end
        end
    end)

    -- Check for pinch start (two fingers)
    local touchCount = 0
    for _ in pairs(self.Touches) do
        touchCount = touchCount + 1
    end

    if touchCount == 2 then
        self:InitializePinch()
    end
end

function GestureDetector:HandleTouchMove(input)
    local touchId = input.UserInputState
    local touchData = self.Touches[touchId]

    if touchData then
        touchData.CurrentPosition = input.Position

        -- Check for pan gesture
        local movement = touchData.CurrentPosition - touchData.StartPosition
        if movement.Magnitude > Config.TapMaxMovement and self.Callbacks.OnPan then
            self.Callbacks.OnPan(movement, touchData.CurrentPosition)
        end

        -- Update pinch if active
        if self.PinchActive then
            self:UpdatePinch()
        end
    end
end

function GestureDetector:HandleTouchEnd(input)
    local touchId = input.UserInputState
    local touchData = self.Touches[touchId]

    if touchData then
        local duration = tick() - touchData.StartTime
        local movement = (touchData.CurrentPosition - touchData.StartPosition).Magnitude

        -- Detect tap
        if duration < Config.TapMaxDuration and movement < Config.TapMaxMovement then
            if not touchData.LongPressTriggered then
                self:HandleTap(touchData.CurrentPosition)
            end
        end

        -- Detect swipe
        if movement >= Config.SwipeMinDistance and duration < Config.SwipeMaxDuration then
            self:HandleSwipe(touchData.StartPosition, touchData.CurrentPosition, duration)
        end

        self.Touches[touchId] = nil

        -- End pinch if active
        if self.PinchActive then
            self.PinchActive = false
        end
    end
end

function GestureDetector:HandleTap(position)
    local currentTime = tick()

    -- Check for double tap
    if self.LastTapPosition then
        local timeSinceLastTap = currentTime - self.LastTapTime
        local distanceFromLastTap = (position - self.LastTapPosition).Magnitude

        if timeSinceLastTap < Config.DoubleTapInterval and distanceFromLastTap < Config.TapMaxMovement * 2 then
            if self.Callbacks.OnDoubleTap then
                self.Callbacks.OnDoubleTap(position)
            end
            self.LastTapTime = 0
            self.LastTapPosition = nil
            return
        end
    end

    -- Single tap
    self.LastTapTime = currentTime
    self.LastTapPosition = position

    -- Delay to check for double tap
    task.delay(Config.DoubleTapInterval + 0.01, function()
        if self.LastTapTime == currentTime then
            if self.Callbacks.OnTap then
                self.Callbacks.OnTap(position)
            end
        end
    end)
end

function GestureDetector:HandleSwipe(startPos, endPos, duration)
    local delta = endPos - startPos
    local direction = self:GetSwipeDirection(delta)
    local velocity = delta.Magnitude / duration

    if self.Callbacks.OnSwipe then
        self.Callbacks.OnSwipe({
            Direction = direction,
            StartPosition = startPos,
            EndPosition = endPos,
            Delta = delta,
            Velocity = velocity,
        })
    end
end

function GestureDetector:GetSwipeDirection(delta)
    local absX = math.abs(delta.X)
    local absY = math.abs(delta.Y)

    if absX > absY then
        return delta.X > 0 and "Right" or "Left"
    else
        return delta.Y > 0 and "Down" or "Up"
    end
end

function GestureDetector:InitializePinch()
    local touches = {}
    for _, touch in pairs(self.Touches) do
        table.insert(touches, touch)
    end

    if #touches == 2 then
        self.PinchActive = true
        self.PinchStartDistance = (touches[1].CurrentPosition - touches[2].CurrentPosition).Magnitude
        self.PinchStartCenter = (touches[1].CurrentPosition + touches[2].CurrentPosition) / 2
    end
end

function GestureDetector:UpdatePinch()
    local touches = {}
    for _, touch in pairs(self.Touches) do
        table.insert(touches, touch)
    end

    if #touches == 2 then
        local currentDistance = (touches[1].CurrentPosition - touches[2].CurrentPosition).Magnitude
        local currentCenter = (touches[1].CurrentPosition + touches[2].CurrentPosition) / 2

        local scale = currentDistance / self.PinchStartDistance
        local distanceChange = currentDistance - self.PinchStartDistance

        if math.abs(distanceChange) > Config.PinchThreshold and self.Callbacks.OnPinch then
            self.Callbacks.OnPinch({
                Scale = scale,
                Center = currentCenter,
                DistanceChange = distanceChange,
            })
        end
    end
end

-- Callback setters
function GestureDetector:OnTap(callback)
    self.Callbacks.OnTap = callback
end

function GestureDetector:OnDoubleTap(callback)
    self.Callbacks.OnDoubleTap = callback
end

function GestureDetector:OnLongPress(callback)
    self.Callbacks.OnLongPress = callback
end

function GestureDetector:OnSwipe(callback)
    self.Callbacks.OnSwipe = callback
end

function GestureDetector:OnPinch(callback)
    self.Callbacks.OnPinch = callback
end

function GestureDetector:OnPan(callback)
    self.Callbacks.OnPan = callback
end

return GestureDetector
```

### 1.2 Gesture Usage Examples

```lua
local GestureDetector = require(path.to.GestureDetector)

local detector = GestureDetector.new()

-- Tap to select/interact
detector:OnTap(function(position)
    print("Tap at", position)
    -- Raycast to find object under tap
    local camera = workspace.CurrentCamera
    local ray = camera:ViewportPointToRay(position.X, position.Y)
    -- Handle selection...
end)

-- Double tap to zoom
detector:OnDoubleTap(function(position)
    print("Double tap - zoom in")
    -- Animate camera zoom
end)

-- Long press for context menu
detector:OnLongPress(function(position)
    print("Long press - show context menu")
    -- Display context menu at position
end)

-- Swipe for navigation
detector:OnSwipe(function(swipeData)
    print("Swipe", swipeData.Direction, "with velocity", swipeData.Velocity)

    if swipeData.Direction == "Left" then
        -- Navigate to next page
    elseif swipeData.Direction == "Right" then
        -- Navigate to previous page
    end
end)

-- Pinch to zoom (maps, inventory)
detector:OnPinch(function(pinchData)
    print("Pinch scale:", pinchData.Scale)
    -- Adjust zoom level based on scale
end)
```

---

## 2. Thumb Zone Optimization

### 2.1 Thumb Zone Theory

The thumb zone defines areas of the screen that are comfortably reachable with one-handed use.

```
Mobile Screen Thumb Zones (Portrait):
+---------------------------+
|                           |
|      Stretch Zone         |
|         (Hard)            |
|                           |
+---------------------------+
|                           |
|    Natural Zone           |
|     (Comfortable)         |
|                           |
+---------------------------+
|                           |
|    Primary Zone           |
|       (Easy)              |
|                           |
+---------------------------+

Landscape orientation shifts zones horizontally
```

### 2.2 Zone Detection Module

```lua
local ThumbZone = {}

local ViewportSize = workspace.CurrentCamera.ViewportSize

-- Zone boundaries (percentage of screen)
local Zones = {
    Portrait = {
        Primary = { minY = 0.6, maxY = 1.0 },     -- Bottom 40%
        Natural = { minY = 0.3, maxY = 0.6 },     -- Middle 30%
        Stretch = { minY = 0.0, maxY = 0.3 },     -- Top 30%
    },
    Landscape = {
        LeftPrimary = { minX = 0.0, maxX = 0.3 },   -- Left 30%
        RightPrimary = { minX = 0.7, maxX = 1.0 },  -- Right 30%
        Center = { minX = 0.3, maxX = 0.7 },        -- Center 40%
    }
}

function ThumbZone.GetOrientation()
    local size = workspace.CurrentCamera.ViewportSize
    return size.X > size.Y and "Landscape" or "Portrait"
end

function ThumbZone.GetZone(position)
    local size = workspace.CurrentCamera.ViewportSize
    local normalizedX = position.X / size.X
    local normalizedY = position.Y / size.Y

    local orientation = ThumbZone.GetOrientation()

    if orientation == "Portrait" then
        if normalizedY >= Zones.Portrait.Primary.minY then
            return "Primary"
        elseif normalizedY >= Zones.Portrait.Natural.minY then
            return "Natural"
        else
            return "Stretch"
        end
    else
        if normalizedX <= Zones.Landscape.LeftPrimary.maxX then
            return "LeftPrimary"
        elseif normalizedX >= Zones.Landscape.RightPrimary.minX then
            return "RightPrimary"
        else
            return "Center"
        end
    end
end

function ThumbZone.GetOptimalPosition(element, priority)
    local size = workspace.CurrentCamera.ViewportSize
    local orientation = ThumbZone.GetOrientation()

    -- Priority: "action" for primary actions, "info" for info display
    priority = priority or "action"

    if orientation == "Portrait" then
        if priority == "action" then
            -- Place in primary zone (bottom)
            return UDim2.new(0.5, 0, 0.85, 0)
        else
            -- Place in natural zone (middle)
            return UDim2.new(0.5, 0, 0.45, 0)
        end
    else
        if priority == "action" then
            -- Place on sides for landscape
            return UDim2.new(0.9, 0, 0.8, 0)
        else
            return UDim2.new(0.5, 0, 0.5, 0)
        end
    end
end

function ThumbZone.OptimizeLayout(elements)
    -- Sorts and positions elements based on priority and thumb zones
    local layout = {
        Primary = {},
        Natural = {},
        Stretch = {},
    }

    for _, element in ipairs(elements) do
        local zone = element.Priority == "high" and "Primary"
                   or element.Priority == "medium" and "Natural"
                   or "Stretch"
        table.insert(layout[zone], element)
    end

    return layout
end

return ThumbZone
```

### 2.3 Adaptive UI Positioning

```lua
local AdaptiveUI = {}

local ThumbZone = require(path.to.ThumbZone)

function AdaptiveUI.PositionActionButton(button, handedness)
    handedness = handedness or "right" -- or "left"

    local orientation = ThumbZone.GetOrientation()
    local size = workspace.CurrentCamera.ViewportSize

    if orientation == "Portrait" then
        -- Bottom of screen, slightly offset to dominant hand side
        local xOffset = handedness == "right" and 0.7 or 0.3
        button.Position = UDim2.new(xOffset, 0, 0.85, 0)
        button.AnchorPoint = Vector2.new(0.5, 0.5)
    else
        -- Side of screen based on handedness
        local xPos = handedness == "right" and 0.9 or 0.1
        button.Position = UDim2.new(xPos, 0, 0.7, 0)
        button.AnchorPoint = Vector2.new(0.5, 0.5)
    end
end

function AdaptiveUI.CreateResponsiveContainer(config)
    local container = Instance.new("Frame")
    container.Name = config.Name or "ResponsiveContainer"
    container.BackgroundTransparency = 1

    local function updateLayout()
        local size = workspace.CurrentCamera.ViewportSize
        local orientation = ThumbZone.GetOrientation()

        if orientation == "Portrait" then
            container.Size = config.PortraitSize or UDim2.new(1, 0, 0.4, 0)
            container.Position = config.PortraitPosition or UDim2.new(0, 0, 0.6, 0)
        else
            container.Size = config.LandscapeSize or UDim2.new(0.3, 0, 1, 0)
            container.Position = config.LandscapePosition or UDim2.new(0.7, 0, 0, 0)
        end
    end

    workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(updateLayout)
    updateLayout()

    return container
end

return AdaptiveUI
```

---

## 3. Mobile HUD Patterns

### 3.1 Safe Area Management

```lua
local SafeArea = {}

local GuiService = game:GetService("GuiService")

function SafeArea.GetInsets()
    -- Returns device-specific safe area insets (notches, rounded corners)
    local insets = GuiService:GetGuiInset()

    -- Additional device-specific handling
    local topInset = insets.Y
    local bottomInset = 0

    -- Estimate bottom inset for devices with home indicators
    local viewportSize = workspace.CurrentCamera.ViewportSize
    local aspectRatio = viewportSize.X / viewportSize.Y

    -- iPhone X-style aspect ratios have home indicator
    if aspectRatio < 0.5 or aspectRatio > 2.0 then
        bottomInset = 34 -- iOS home indicator height
    end

    return {
        Top = topInset,
        Bottom = bottomInset,
        Left = 0,
        Right = 0,
    }
end

function SafeArea.CreateSafeContainer(parent)
    local insets = SafeArea.GetInsets()

    local container = Instance.new("Frame")
    container.Name = "SafeAreaContainer"
    container.Size = UDim2.new(1, 0, 1, 0)
    container.BackgroundTransparency = 1
    container.Parent = parent

    local padding = Instance.new("UIPadding")
    padding.PaddingTop = UDim.new(0, insets.Top)
    padding.PaddingBottom = UDim.new(0, insets.Bottom)
    padding.PaddingLeft = UDim.new(0, insets.Left)
    padding.PaddingRight = UDim.new(0, insets.Right)
    padding.Parent = container

    return container
end

return SafeArea
```

### 3.2 Minimal Mobile HUD

```lua
local MobileHUD = {}
MobileHUD.__index = MobileHUD

local SafeArea = require(path.to.SafeArea)

function MobileHUD.new(playerGui)
    local self = setmetatable({}, MobileHUD)

    -- Main HUD screen
    local screen = Instance.new("ScreenGui")
    screen.Name = "MobileHUD"
    screen.ResetOnSpawn = false
    screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    screen.Parent = playerGui

    -- Safe area container
    local safeContainer = SafeArea.CreateSafeContainer(screen)

    -- Top bar (health, resources)
    self.TopBar = self:CreateTopBar(safeContainer)

    -- Quick actions (bottom right)
    self.QuickActions = self:CreateQuickActions(safeContainer)

    -- Context actions (bottom center)
    self.ContextActions = self:CreateContextActions(safeContainer)

    self.Screen = screen
    self.SafeContainer = safeContainer

    return self
end

function MobileHUD:CreateTopBar(parent)
    local topBar = Instance.new("Frame")
    topBar.Name = "TopBar"
    topBar.Size = UDim2.new(1, 0, 0, 44)
    topBar.Position = UDim2.new(0, 0, 0, 0)
    topBar.BackgroundTransparency = 1
    topBar.Parent = parent

    local padding = Instance.new("UIPadding")
    padding.PaddingLeft = UDim.new(0, 16)
    padding.PaddingRight = UDim.new(0, 16)
    padding.Parent = topBar

    -- Health bar (left side)
    local healthContainer = Instance.new("Frame")
    healthContainer.Name = "HealthContainer"
    healthContainer.Size = UDim2.new(0, 120, 0, 32)
    healthContainer.Position = UDim2.new(0, 0, 0.5, 0)
    healthContainer.AnchorPoint = Vector2.new(0, 0.5)
    healthContainer.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
    healthContainer.BackgroundTransparency = 0.3
    healthContainer.Parent = topBar

    local healthCorner = Instance.new("UICorner")
    healthCorner.CornerRadius = UDim.new(0, 8)
    healthCorner.Parent = healthContainer

    local healthBar = Instance.new("Frame")
    healthBar.Name = "HealthBar"
    healthBar.Size = UDim2.new(0.8, 0, 0.3, 0)
    healthBar.Position = UDim2.new(0.5, 0, 0.7, 0)
    healthBar.AnchorPoint = Vector2.new(0.5, 0.5)
    healthBar.BackgroundColor3 = Color3.fromRGB(51, 65, 85)
    healthBar.Parent = healthContainer

    local healthCorner2 = Instance.new("UICorner")
    healthCorner2.CornerRadius = UDim.new(1, 0)
    healthCorner2.Parent = healthBar

    local healthFill = Instance.new("Frame")
    healthFill.Name = "Fill"
    healthFill.Size = UDim2.new(1, 0, 1, 0)
    healthFill.BackgroundColor3 = Color3.fromRGB(239, 68, 68)
    healthFill.BorderSizePixel = 0
    healthFill.Parent = healthBar

    local healthFillCorner = Instance.new("UICorner")
    healthFillCorner.CornerRadius = UDim.new(1, 0)
    healthFillCorner.Parent = healthFill

    local healthIcon = Instance.new("ImageLabel")
    healthIcon.Name = "Icon"
    healthIcon.Size = UDim2.new(0, 20, 0, 20)
    healthIcon.Position = UDim2.new(0.1, 0, 0.35, 0)
    healthIcon.AnchorPoint = Vector2.new(0, 0.5)
    healthIcon.BackgroundTransparency = 1
    healthIcon.Image = "rbxassetid://6034684930"
    healthIcon.ImageColor3 = Color3.fromRGB(255, 255, 255)
    healthIcon.Parent = healthContainer

    -- Currency (right side)
    local currencyContainer = Instance.new("Frame")
    currencyContainer.Name = "CurrencyContainer"
    currencyContainer.Size = UDim2.new(0, 100, 0, 32)
    currencyContainer.Position = UDim2.new(1, 0, 0.5, 0)
    currencyContainer.AnchorPoint = Vector2.new(1, 0.5)
    currencyContainer.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
    currencyContainer.BackgroundTransparency = 0.3
    currencyContainer.Parent = topBar

    local currencyCorner = Instance.new("UICorner")
    currencyCorner.CornerRadius = UDim.new(0, 8)
    currencyCorner.Parent = currencyContainer

    local currencyIcon = Instance.new("ImageLabel")
    currencyIcon.Size = UDim2.new(0, 20, 0, 20)
    currencyIcon.Position = UDim2.new(0, 8, 0.5, 0)
    currencyIcon.AnchorPoint = Vector2.new(0, 0.5)
    currencyIcon.BackgroundTransparency = 1
    currencyIcon.Image = "rbxassetid://6034684949"
    currencyIcon.ImageColor3 = Color3.fromRGB(234, 179, 8)
    currencyIcon.Parent = currencyContainer

    local currencyText = Instance.new("TextLabel")
    currencyText.Name = "Amount"
    currencyText.Size = UDim2.new(1, -36, 1, 0)
    currencyText.Position = UDim2.new(0, 32, 0, 0)
    currencyText.BackgroundTransparency = 1
    currencyText.Text = "1,234"
    currencyText.TextColor3 = Color3.fromRGB(255, 255, 255)
    currencyText.Font = Enum.Font.GothamBold
    currencyText.TextSize = 14
    currencyText.TextXAlignment = Enum.TextXAlignment.Left
    currencyText.Parent = currencyContainer

    return topBar
end

function MobileHUD:CreateQuickActions(parent)
    local container = Instance.new("Frame")
    container.Name = "QuickActions"
    container.Size = UDim2.new(0, 56, 0, 180)
    container.Position = UDim2.new(1, -16, 1, -16)
    container.AnchorPoint = Vector2.new(1, 1)
    container.BackgroundTransparency = 1
    container.Parent = parent

    local layout = Instance.new("UIListLayout")
    layout.SortOrder = Enum.SortOrder.LayoutOrder
    layout.VerticalAlignment = Enum.VerticalAlignment.Bottom
    layout.Padding = UDim.new(0, 12)
    layout.Parent = container

    -- Action buttons
    local actions = {
        { Icon = "rbxassetid://6034684942", Name = "Menu" },
        { Icon = "rbxassetid://6034684935", Name = "Inventory" },
        { Icon = "rbxassetid://6034684928", Name = "Map" },
    }

    for i, action in ipairs(actions) do
        local button = Instance.new("ImageButton")
        button.Name = action.Name
        button.Size = UDim2.new(0, 48, 0, 48)
        button.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
        button.BackgroundTransparency = 0.2
        button.Image = action.Icon
        button.ImageColor3 = Color3.fromRGB(255, 255, 255)
        button.ScaleType = Enum.ScaleType.Fit
        button.LayoutOrder = i
        button.Parent = container

        local corner = Instance.new("UICorner")
        corner.CornerRadius = UDim.new(0, 12)
        corner.Parent = button

        local padding = Instance.new("UIPadding")
        padding.PaddingLeft = UDim.new(0, 10)
        padding.PaddingRight = UDim.new(0, 10)
        padding.PaddingTop = UDim.new(0, 10)
        padding.PaddingBottom = UDim.new(0, 10)
        padding.Parent = button
    end

    return container
end

function MobileHUD:CreateContextActions(parent)
    local container = Instance.new("Frame")
    container.Name = "ContextActions"
    container.Size = UDim2.new(0, 200, 0, 56)
    container.Position = UDim2.new(0.5, 0, 1, -16)
    container.AnchorPoint = Vector2.new(0.5, 1)
    container.BackgroundTransparency = 1
    container.Visible = false -- Hidden by default
    container.Parent = parent

    local layout = Instance.new("UIListLayout")
    layout.FillDirection = Enum.FillDirection.Horizontal
    layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
    layout.Padding = UDim.new(0, 12)
    layout.Parent = container

    return container
end

function MobileHUD:ShowContextAction(icon, text, callback)
    local button = Instance.new("TextButton")
    button.Size = UDim2.new(0, 0, 0, 48)
    button.AutomaticSize = Enum.AutomaticSize.X
    button.BackgroundColor3 = Color3.fromRGB(59, 130, 246)
    button.BorderSizePixel = 0
    button.Text = ""
    button.Parent = self.ContextActions

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = button

    local btnPadding = Instance.new("UIPadding")
    btnPadding.PaddingLeft = UDim.new(0, 16)
    btnPadding.PaddingRight = UDim.new(0, 16)
    btnPadding.Parent = button

    local layout = Instance.new("UIListLayout")
    layout.FillDirection = Enum.FillDirection.Horizontal
    layout.VerticalAlignment = Enum.VerticalAlignment.Center
    layout.Padding = UDim.new(0, 8)
    layout.Parent = button

    if icon then
        local iconLabel = Instance.new("ImageLabel")
        iconLabel.Size = UDim2.new(0, 20, 0, 20)
        iconLabel.BackgroundTransparency = 1
        iconLabel.Image = icon
        iconLabel.ImageColor3 = Color3.fromRGB(255, 255, 255)
        iconLabel.Parent = button
    end

    local textLabel = Instance.new("TextLabel")
    textLabel.Size = UDim2.new(0, 0, 0, 20)
    textLabel.AutomaticSize = Enum.AutomaticSize.X
    textLabel.BackgroundTransparency = 1
    textLabel.Text = text
    textLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    textLabel.Font = Enum.Font.GothamSemibold
    textLabel.TextSize = 14
    textLabel.Parent = button

    button.MouseButton1Click:Connect(callback)

    self.ContextActions.Visible = true

    return button
end

function MobileHUD:ClearContextActions()
    for _, child in ipairs(self.ContextActions:GetChildren()) do
        if child:IsA("TextButton") then
            child:Destroy()
        end
    end
    self.ContextActions.Visible = false
end

return MobileHUD
```

---

## 4. Virtual Joystick Design

### 4.1 Standard Virtual Joystick

```lua
local VirtualJoystick = {}
VirtualJoystick.__index = VirtualJoystick

local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")

function VirtualJoystick.new(config)
    local self = setmetatable({}, VirtualJoystick)

    self.Position = config.Position or UDim2.new(0.15, 0, 0.75, 0)
    self.Size = config.Size or 120
    self.InnerSize = config.InnerSize or 48
    self.MaxDistance = (self.Size - self.InnerSize) / 2
    self.DeadZone = config.DeadZone or 0.1
    self.Active = false
    self.TouchId = nil
    self.Value = Vector2.new(0, 0)

    self:CreateUI(config.Parent)
    self:SetupInput()

    return self
end

function VirtualJoystick:CreateUI(parent)
    -- Outer ring
    local outer = Instance.new("Frame")
    outer.Name = "JoystickOuter"
    outer.Size = UDim2.new(0, self.Size, 0, self.Size)
    outer.Position = self.Position
    outer.AnchorPoint = Vector2.new(0.5, 0.5)
    outer.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
    outer.BackgroundTransparency = 0.5
    outer.Parent = parent

    local outerCorner = Instance.new("UICorner")
    outerCorner.CornerRadius = UDim.new(1, 0)
    outerCorner.Parent = outer

    local outerStroke = Instance.new("UIStroke")
    outerStroke.Color = Color3.fromRGB(71, 85, 105)
    outerStroke.Thickness = 2
    outerStroke.Parent = outer

    -- Inner stick
    local inner = Instance.new("Frame")
    inner.Name = "JoystickInner"
    inner.Size = UDim2.new(0, self.InnerSize, 0, self.InnerSize)
    inner.Position = UDim2.new(0.5, 0, 0.5, 0)
    inner.AnchorPoint = Vector2.new(0.5, 0.5)
    inner.BackgroundColor3 = Color3.fromRGB(59, 130, 246)
    inner.ZIndex = 2
    inner.Parent = outer

    local innerCorner = Instance.new("UICorner")
    innerCorner.CornerRadius = UDim.new(1, 0)
    innerCorner.Parent = inner

    -- Direction indicator (optional)
    local indicator = Instance.new("Frame")
    indicator.Name = "DirectionIndicator"
    indicator.Size = UDim2.new(0, 8, 0, 8)
    indicator.Position = UDim2.new(0.5, 0, 0.2, 0)
    indicator.AnchorPoint = Vector2.new(0.5, 0.5)
    indicator.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
    indicator.BackgroundTransparency = 0.5
    indicator.Parent = inner

    local indicatorCorner = Instance.new("UICorner")
    indicatorCorner.CornerRadius = UDim.new(1, 0)
    indicatorCorner.Parent = indicator

    self.Outer = outer
    self.Inner = inner
end

function VirtualJoystick:SetupInput()
    local touchRegion = Instance.new("TextButton")
    touchRegion.Name = "TouchRegion"
    touchRegion.Size = UDim2.new(0, self.Size * 1.5, 0, self.Size * 1.5)
    touchRegion.Position = UDim2.new(0.5, 0, 0.5, 0)
    touchRegion.AnchorPoint = Vector2.new(0.5, 0.5)
    touchRegion.BackgroundTransparency = 1
    touchRegion.Text = ""
    touchRegion.Parent = self.Outer

    touchRegion.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.Touch then
            self:OnTouchStart(input)
        end
    end)

    UserInputService.TouchMoved:Connect(function(input)
        if self.Active and input == self.TouchInput then
            self:OnTouchMove(input)
        end
    end)

    UserInputService.TouchEnded:Connect(function(input)
        if self.Active and input == self.TouchInput then
            self:OnTouchEnd()
        end
    end)
end

function VirtualJoystick:OnTouchStart(input)
    self.Active = true
    self.TouchInput = input
    self.CenterPosition = self.Outer.AbsolutePosition + self.Outer.AbsoluteSize / 2
    self:OnTouchMove(input)
end

function VirtualJoystick:OnTouchMove(input)
    local touchPosition = Vector2.new(input.Position.X, input.Position.Y)
    local delta = touchPosition - self.CenterPosition

    -- Clamp to max distance
    local distance = delta.Magnitude
    if distance > self.MaxDistance then
        delta = delta.Unit * self.MaxDistance
    end

    -- Update inner position
    self.Inner.Position = UDim2.new(0.5, delta.X, 0.5, delta.Y)

    -- Calculate normalized value
    local normalizedValue = delta / self.MaxDistance

    -- Apply dead zone
    if normalizedValue.Magnitude < self.DeadZone then
        normalizedValue = Vector2.new(0, 0)
    else
        -- Rescale to account for dead zone
        local adjustedMagnitude = (normalizedValue.Magnitude - self.DeadZone) / (1 - self.DeadZone)
        normalizedValue = normalizedValue.Unit * math.min(adjustedMagnitude, 1)
    end

    self.Value = normalizedValue
end

function VirtualJoystick:OnTouchEnd()
    self.Active = false
    self.TouchInput = nil
    self.Value = Vector2.new(0, 0)

    -- Animate back to center
    local TweenService = game:GetService("TweenService")
    TweenService:Create(self.Inner, TweenInfo.new(0.15, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
        Position = UDim2.new(0.5, 0, 0.5, 0)
    }):Play()
end

function VirtualJoystick:GetValue()
    return self.Value
end

function VirtualJoystick:SetEnabled(enabled)
    self.Outer.Visible = enabled
    if not enabled then
        self.Active = false
        self.Value = Vector2.new(0, 0)
    end
end

return VirtualJoystick
```

### 4.2 Floating Joystick

```lua
local FloatingJoystick = {}
FloatingJoystick.__index = FloatingJoystick

setmetatable(FloatingJoystick, { __index = VirtualJoystick })

function FloatingJoystick.new(config)
    config.Position = config.Position or UDim2.new(0, 0, 0, 0)

    local self = setmetatable(VirtualJoystick.new(config), FloatingJoystick)

    self.SpawnRegion = config.SpawnRegion or {
        MinX = 0,
        MaxX = 0.4,
        MinY = 0.4,
        MaxY = 1,
    }

    self.Outer.Visible = false -- Hidden until touch
    self:SetupFloatingInput(config.Parent)

    return self
end

function FloatingJoystick:SetupFloatingInput(parent)
    -- Touch region for spawning joystick
    local spawnRegion = Instance.new("TextButton")
    spawnRegion.Name = "JoystickSpawnRegion"
    spawnRegion.Size = UDim2.new(
        self.SpawnRegion.MaxX - self.SpawnRegion.MinX, 0,
        self.SpawnRegion.MaxY - self.SpawnRegion.MinY, 0
    )
    spawnRegion.Position = UDim2.new(self.SpawnRegion.MinX, 0, self.SpawnRegion.MinY, 0)
    spawnRegion.BackgroundTransparency = 1
    spawnRegion.Text = ""
    spawnRegion.ZIndex = 0
    spawnRegion.Parent = parent

    spawnRegion.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.Touch then
            -- Position joystick at touch location
            local touchPos = Vector2.new(input.Position.X, input.Position.Y)
            local screenSize = workspace.CurrentCamera.ViewportSize

            self.Outer.Position = UDim2.new(
                touchPos.X / screenSize.X, 0,
                touchPos.Y / screenSize.Y, 0
            )
            self.Outer.Visible = true

            -- Start joystick input
            self:OnTouchStart(input)
        end
    end)

    self.SpawnRegionUI = spawnRegion
end

function FloatingJoystick:OnTouchEnd()
    -- Call parent method
    VirtualJoystick.OnTouchEnd(self)

    -- Hide joystick with fade
    local TweenService = game:GetService("TweenService")
    local fadeTween = TweenService:Create(self.Outer, TweenInfo.new(0.2), {
        BackgroundTransparency = 1
    })

    fadeTween:Play()
    fadeTween.Completed:Connect(function()
        if not self.Active then
            self.Outer.Visible = false
            self.Outer.BackgroundTransparency = 0.5
        end
    end)
end

return FloatingJoystick
```

---

## 5. Gesture Conflicts Resolution

### 5.1 Gesture Priority System

```lua
local GesturePriority = {}

local Priorities = {
    System = 1000,     -- Roblox system gestures
    Modal = 900,       -- Modal interactions
    GameUI = 800,      -- In-game UI
    Gameplay = 700,    -- Gameplay controls
    Navigation = 600,  -- UI navigation
    Background = 100,  -- Low priority gestures
}

local ActiveGestures = {}

function GesturePriority.Register(gestureId, priority, handler)
    ActiveGestures[gestureId] = {
        Priority = priority,
        Handler = handler,
        Active = true,
    }
end

function GesturePriority.Unregister(gestureId)
    ActiveGestures[gestureId] = nil
end

function GesturePriority.SetActive(gestureId, active)
    if ActiveGestures[gestureId] then
        ActiveGestures[gestureId].Active = active
    end
end

function GesturePriority.GetHighestPriority(gestureType)
    local highestPriority = 0
    local highestHandler = nil

    for id, gesture in pairs(ActiveGestures) do
        if gesture.Active and gesture.Priority > highestPriority then
            highestPriority = gesture.Priority
            highestHandler = gesture.Handler
        end
    end

    return highestHandler, highestPriority
end

function GesturePriority.ShouldHandle(gestureId)
    local gesture = ActiveGestures[gestureId]
    if not gesture or not gesture.Active then
        return false
    end

    -- Check if any higher priority gesture is active
    for id, other in pairs(ActiveGestures) do
        if id ~= gestureId and other.Active and other.Priority > gesture.Priority then
            return false
        end
    end

    return true
end

-- Predefined priority constants
GesturePriority.Priorities = Priorities

return GesturePriority
```

### 5.2 Touch Zone Management

```lua
local TouchZoneManager = {}

local Zones = {}
local ZoneOrder = {}

function TouchZoneManager.CreateZone(config)
    local zone = {
        Id = config.Id,
        Frame = config.Frame,
        Priority = config.Priority or 0,
        PassThrough = config.PassThrough or false, -- Allow touches to pass to lower zones
        OnTouchStart = config.OnTouchStart,
        OnTouchMove = config.OnTouchMove,
        OnTouchEnd = config.OnTouchEnd,
    }

    Zones[config.Id] = zone
    table.insert(ZoneOrder, zone)
    table.sort(ZoneOrder, function(a, b) return a.Priority > b.Priority end)

    return zone
end

function TouchZoneManager.RemoveZone(zoneId)
    Zones[zoneId] = nil
    for i, zone in ipairs(ZoneOrder) do
        if zone.Id == zoneId then
            table.remove(ZoneOrder, i)
            break
        end
    end
end

function TouchZoneManager.GetZoneAtPosition(position)
    for _, zone in ipairs(ZoneOrder) do
        local frame = zone.Frame
        local absPos = frame.AbsolutePosition
        local absSize = frame.AbsoluteSize

        if position.X >= absPos.X and position.X <= absPos.X + absSize.X
            and position.Y >= absPos.Y and position.Y <= absPos.Y + absSize.Y then
            return zone
        end
    end
    return nil
end

function TouchZoneManager.ProcessTouch(touchType, input)
    local position = Vector2.new(input.Position.X, input.Position.Y)
    local zone = TouchZoneManager.GetZoneAtPosition(position)

    if zone then
        if touchType == "Start" and zone.OnTouchStart then
            zone.OnTouchStart(input)
        elseif touchType == "Move" and zone.OnTouchMove then
            zone.OnTouchMove(input)
        elseif touchType == "End" and zone.OnTouchEnd then
            zone.OnTouchEnd(input)
        end

        return not zone.PassThrough -- Return true if touch was consumed
    end

    return false
end

return TouchZoneManager
```

---

## 6. Mobile Performance Considerations

### 6.1 UI Performance Optimization

```lua
local UIPerformance = {}

-- Reduce UI update frequency on mobile
local UpdateThrottles = {
    High = 0,        -- Every frame
    Medium = 0.033,  -- ~30fps
    Low = 0.1,       -- 10fps
    VeryLow = 0.25,  -- 4fps
}

function UIPerformance.ThrottledUpdate(element, updateFunc, throttle)
    local lastUpdate = 0
    local throttleTime = UpdateThrottles[throttle] or throttle

    return function()
        local now = tick()
        if now - lastUpdate >= throttleTime then
            lastUpdate = now
            updateFunc(element)
        end
    end
end

-- Batch UI updates
local PendingUpdates = {}
local UpdateScheduled = false

function UIPerformance.BatchUpdate(updateFunc)
    table.insert(PendingUpdates, updateFunc)

    if not UpdateScheduled then
        UpdateScheduled = true
        task.defer(function()
            for _, func in ipairs(PendingUpdates) do
                func()
            end
            PendingUpdates = {}
            UpdateScheduled = false
        end)
    end
end

-- Object pooling for list items
function UIPerformance.CreatePool(createFunc, resetFunc, initialSize)
    local pool = {
        Available = {},
        InUse = {},
        CreateFunc = createFunc,
        ResetFunc = resetFunc,
    }

    -- Pre-populate pool
    for i = 1, initialSize or 10 do
        local item = createFunc()
        item.Parent = nil
        table.insert(pool.Available, item)
    end

    function pool:Get()
        local item
        if #self.Available > 0 then
            item = table.remove(self.Available)
        else
            item = self.CreateFunc()
        end
        table.insert(self.InUse, item)
        return item
    end

    function pool:Return(item)
        for i, inUseItem in ipairs(self.InUse) do
            if inUseItem == item then
                table.remove(self.InUse, i)
                self.ResetFunc(item)
                item.Parent = nil
                table.insert(self.Available, item)
                break
            end
        end
    end

    function pool:ReturnAll()
        for _, item in ipairs(self.InUse) do
            self.ResetFunc(item)
            item.Parent = nil
            table.insert(self.Available, item)
        end
        self.InUse = {}
    end

    return pool
end

return UIPerformance
```

### 6.2 Texture and Asset Optimization

```lua
local AssetOptimization = {}

-- Use appropriate image sizes based on device
local function GetOptimalImageSize(devicePixelRatio)
    if devicePixelRatio <= 1 then
        return "1x"
    elseif devicePixelRatio <= 2 then
        return "2x"
    else
        return "3x"
    end
end

function AssetOptimization.GetOptimizedAsset(assetTable)
    -- assetTable = { ["1x"] = "rbxassetid://...", ["2x"] = "...", ["3x"] = "..." }
    local viewportSize = workspace.CurrentCamera.ViewportSize
    local screenSize = math.max(viewportSize.X, viewportSize.Y)

    -- Estimate device pixel ratio
    local pixelRatio = screenSize > 2000 and 3 or (screenSize > 1000 and 2 or 1)
    local size = GetOptimalImageSize(pixelRatio)

    return assetTable[size] or assetTable["1x"]
end

-- Lazy load images
function AssetOptimization.LazyLoadImage(imageLabel, assetId)
    -- Show placeholder first
    imageLabel.Image = "rbxassetid://6031082533" -- Generic placeholder
    imageLabel.ImageTransparency = 0.5

    -- Load actual image
    task.spawn(function()
        local success, _ = pcall(function()
            imageLabel.Image = assetId
        end)

        if success then
            local TweenService = game:GetService("TweenService")
            TweenService:Create(imageLabel, TweenInfo.new(0.2), {
                ImageTransparency = 0
            }):Play()
        end
    end)
end

return AssetOptimization
```

---

## 7. Device-Specific Adaptations

### 7.1 Device Detection

```lua
local DeviceDetector = {}

local UserInputService = game:GetService("UserInputService")
local GuiService = game:GetService("GuiService")

function DeviceDetector.GetDeviceType()
    if UserInputService.TouchEnabled then
        local viewportSize = workspace.CurrentCamera.ViewportSize
        local screenDiagonal = math.sqrt(viewportSize.X^2 + viewportSize.Y^2)

        -- Tablet detection (larger screens)
        if screenDiagonal > 1500 then
            return "Tablet"
        else
            return "Phone"
        end
    elseif UserInputService.GamepadEnabled then
        return "Console"
    else
        return "Desktop"
    end
end

function DeviceDetector.GetDeviceCapabilities()
    return {
        Touch = UserInputService.TouchEnabled,
        Keyboard = UserInputService.KeyboardEnabled,
        Mouse = UserInputService.MouseEnabled,
        Gamepad = UserInputService.GamepadEnabled,
        Gyroscope = UserInputService.GyroscopeEnabled,
        Accelerometer = UserInputService.AccelerometerEnabled,
        VR = UserInputService.VREnabled,
    }
end

function DeviceDetector.GetScreenInfo()
    local viewportSize = workspace.CurrentCamera.ViewportSize
    local guiInset = GuiService:GetGuiInset()

    local aspectRatio = viewportSize.X / viewportSize.Y
    local isNotched = aspectRatio > 2.0 or aspectRatio < 0.5 -- iPhone X style

    return {
        Width = viewportSize.X,
        Height = viewportSize.Y,
        AspectRatio = aspectRatio,
        IsPortrait = viewportSize.Y > viewportSize.X,
        IsLandscape = viewportSize.X > viewportSize.Y,
        IsNotched = isNotched,
        TopInset = guiInset.Y,
    }
end

function DeviceDetector.OnOrientationChange(callback)
    local lastOrientation = DeviceDetector.GetScreenInfo().IsPortrait

    workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(function()
        local newInfo = DeviceDetector.GetScreenInfo()
        if newInfo.IsPortrait ~= lastOrientation then
            lastOrientation = newInfo.IsPortrait
            callback(newInfo)
        end
    end)
end

return DeviceDetector
```

### 7.2 Responsive Breakpoints

```lua
local Breakpoints = {}

local BreakpointValues = {
    XS = 320,   -- Small phones
    SM = 480,   -- Large phones
    MD = 768,   -- Tablets portrait
    LG = 1024,  -- Tablets landscape
    XL = 1280,  -- Small desktops
    XXL = 1920, -- Large desktops
}

function Breakpoints.GetCurrentBreakpoint()
    local width = workspace.CurrentCamera.ViewportSize.X

    if width < BreakpointValues.SM then
        return "XS"
    elseif width < BreakpointValues.MD then
        return "SM"
    elseif width < BreakpointValues.LG then
        return "MD"
    elseif width < BreakpointValues.XL then
        return "LG"
    elseif width < BreakpointValues.XXL then
        return "XL"
    else
        return "XXL"
    end
end

function Breakpoints.ResponsiveValue(values)
    -- values = { XS = ..., SM = ..., MD = ..., etc. }
    local breakpoint = Breakpoints.GetCurrentBreakpoint()

    -- Find the value for current breakpoint or fall back to smaller
    local breakpointOrder = { "XS", "SM", "MD", "LG", "XL", "XXL" }
    local currentIndex = table.find(breakpointOrder, breakpoint)

    for i = currentIndex, 1, -1 do
        local bp = breakpointOrder[i]
        if values[bp] ~= nil then
            return values[bp]
        end
    end

    return values.XS -- Default fallback
end

function Breakpoints.OnBreakpointChange(callback)
    local lastBreakpoint = Breakpoints.GetCurrentBreakpoint()

    workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(function()
        local newBreakpoint = Breakpoints.GetCurrentBreakpoint()
        if newBreakpoint ~= lastBreakpoint then
            local oldBreakpoint = lastBreakpoint
            lastBreakpoint = newBreakpoint
            callback(newBreakpoint, oldBreakpoint)
        end
    end)
end

Breakpoints.Values = BreakpointValues

return Breakpoints
```

---

## 8. Portrait vs Landscape Handling

### 8.1 Orientation Manager

```lua
local OrientationManager = {}
OrientationManager.__index = OrientationManager

function OrientationManager.new()
    local self = setmetatable({}, OrientationManager)

    self.Layouts = {
        Portrait = {},
        Landscape = {},
    }
    self.CurrentOrientation = nil
    self.OnOrientationChanged = Instance.new("BindableEvent")

    self:Initialize()

    return self
end

function OrientationManager:Initialize()
    self:UpdateOrientation()

    workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(function()
        self:UpdateOrientation()
    end)
end

function OrientationManager:UpdateOrientation()
    local size = workspace.CurrentCamera.ViewportSize
    local newOrientation = size.X > size.Y and "Landscape" or "Portrait"

    if newOrientation ~= self.CurrentOrientation then
        local oldOrientation = self.CurrentOrientation
        self.CurrentOrientation = newOrientation

        self:ApplyLayout(newOrientation)
        self.OnOrientationChanged:Fire(newOrientation, oldOrientation)
    end
end

function OrientationManager:RegisterLayout(element, portraitConfig, landscapeConfig)
    self.Layouts.Portrait[element] = portraitConfig
    self.Layouts.Landscape[element] = landscapeConfig

    -- Apply current layout
    if self.CurrentOrientation then
        self:ApplyLayoutToElement(element, self.CurrentOrientation)
    end
end

function OrientationManager:ApplyLayout(orientation)
    local layouts = self.Layouts[orientation]
    for element, config in pairs(layouts) do
        self:ApplyLayoutToElement(element, orientation)
    end
end

function OrientationManager:ApplyLayoutToElement(element, orientation)
    local config = self.Layouts[orientation][element]
    if not config then return end

    local TweenService = game:GetService("TweenService")
    local tweenInfo = TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)

    local properties = {}

    if config.Size then properties.Size = config.Size end
    if config.Position then properties.Position = config.Position end
    if config.AnchorPoint then element.AnchorPoint = config.AnchorPoint end
    if config.Visible ~= nil then element.Visible = config.Visible end

    if next(properties) then
        TweenService:Create(element, tweenInfo, properties):Play()
    end

    -- Apply layout-specific settings
    if config.Layout then
        local layout = element:FindFirstChildOfClass("UIListLayout")
        if layout then
            if config.Layout.FillDirection then
                layout.FillDirection = config.Layout.FillDirection
            end
            if config.Layout.HorizontalAlignment then
                layout.HorizontalAlignment = config.Layout.HorizontalAlignment
            end
            if config.Layout.VerticalAlignment then
                layout.VerticalAlignment = config.Layout.VerticalAlignment
            end
        end
    end
end

function OrientationManager:GetOrientation()
    return self.CurrentOrientation
end

return OrientationManager
```

### 8.2 Orientation-Aware UI Example

```lua
local OrientationManager = require(path.to.OrientationManager)

local manager = OrientationManager.new()

-- Register a menu panel
local menuPanel = script.Parent.MenuPanel

manager:RegisterLayout(
    menuPanel,
    -- Portrait configuration
    {
        Size = UDim2.new(1, 0, 0.5, 0),
        Position = UDim2.new(0, 0, 1, 0),
        AnchorPoint = Vector2.new(0, 1),
        Layout = {
            FillDirection = Enum.FillDirection.Horizontal,
        }
    },
    -- Landscape configuration
    {
        Size = UDim2.new(0.3, 0, 1, 0),
        Position = UDim2.new(0, 0, 0, 0),
        AnchorPoint = Vector2.new(0, 0),
        Layout = {
            FillDirection = Enum.FillDirection.Vertical,
        }
    }
)

-- Listen for orientation changes
manager.OnOrientationChanged.Event:Connect(function(newOrientation, oldOrientation)
    print("Orientation changed from", oldOrientation, "to", newOrientation)

    -- Perform additional adjustments
    if newOrientation == "Landscape" then
        -- Show additional UI elements for landscape
    else
        -- Hide or rearrange for portrait
    end
end)
```

---

## 9. Testing on Different Devices

### 9.1 Device Emulation

```lua
local DeviceEmulator = {}

local EmulationProfiles = {
    iPhoneSE = {
        Width = 375,
        Height = 667,
        PixelRatio = 2,
        SafeAreaTop = 20,
        SafeAreaBottom = 0,
        HasNotch = false,
    },
    iPhone14 = {
        Width = 390,
        Height = 844,
        PixelRatio = 3,
        SafeAreaTop = 47,
        SafeAreaBottom = 34,
        HasNotch = true,
    },
    iPhone14ProMax = {
        Width = 430,
        Height = 932,
        PixelRatio = 3,
        SafeAreaTop = 59,
        SafeAreaBottom = 34,
        HasNotch = true,
    },
    iPadMini = {
        Width = 744,
        Height = 1133,
        PixelRatio = 2,
        SafeAreaTop = 24,
        SafeAreaBottom = 20,
        HasNotch = false,
    },
    iPadPro12 = {
        Width = 1024,
        Height = 1366,
        PixelRatio = 2,
        SafeAreaTop = 24,
        SafeAreaBottom = 20,
        HasNotch = false,
    },
    SamsungGalaxyS23 = {
        Width = 360,
        Height = 780,
        PixelRatio = 3,
        SafeAreaTop = 30,
        SafeAreaBottom = 0,
        HasNotch = false, -- Punch hole camera
    },
}

function DeviceEmulator.GetProfile(deviceName)
    return EmulationProfiles[deviceName]
end

function DeviceEmulator.ListDevices()
    local devices = {}
    for name, _ in pairs(EmulationProfiles) do
        table.insert(devices, name)
    end
    return devices
end

-- For Studio testing - creates visual overlay showing device frame
function DeviceEmulator.ShowDeviceFrame(playerGui, deviceName, portrait)
    local profile = EmulationProfiles[deviceName]
    if not profile then return end

    local width = portrait and profile.Width or profile.Height
    local height = portrait and profile.Height or profile.Width

    local frame = Instance.new("Frame")
    frame.Name = "DeviceEmulatorFrame"
    frame.Size = UDim2.new(0, width, 0, height)
    frame.Position = UDim2.new(0.5, 0, 0.5, 0)
    frame.AnchorPoint = Vector2.new(0.5, 0.5)
    frame.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    frame.Parent = playerGui

    local stroke = Instance.new("UIStroke")
    stroke.Color = Color3.fromRGB(255, 0, 0)
    stroke.Thickness = 2
    stroke.Parent = frame

    -- Safe area indicators
    local safeTop = Instance.new("Frame")
    safeTop.Size = UDim2.new(1, 0, 0, portrait and profile.SafeAreaTop or 0)
    safeTop.BackgroundColor3 = Color3.fromRGB(255, 255, 0)
    safeTop.BackgroundTransparency = 0.7
    safeTop.Parent = frame

    local safeBottom = Instance.new("Frame")
    safeBottom.Size = UDim2.new(1, 0, 0, portrait and profile.SafeAreaBottom or 0)
    safeBottom.Position = UDim2.new(0, 0, 1, 0)
    safeBottom.AnchorPoint = Vector2.new(0, 1)
    safeBottom.BackgroundColor3 = Color3.fromRGB(255, 255, 0)
    safeBottom.BackgroundTransparency = 0.7
    safeBottom.Parent = frame

    -- Notch indicator
    if profile.HasNotch and portrait then
        local notch = Instance.new("Frame")
        notch.Size = UDim2.new(0, 150, 0, 30)
        notch.Position = UDim2.new(0.5, 0, 0, 0)
        notch.AnchorPoint = Vector2.new(0.5, 0)
        notch.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
        notch.Parent = frame

        local notchCorner = Instance.new("UICorner")
        notchCorner.CornerRadius = UDim.new(0, 15)
        notchCorner.Parent = notch
    end

    return frame
end

return DeviceEmulator
```

### 9.2 Touch Point Visualization (Debug)

```lua
local TouchDebugger = {}

local ActiveTouches = {}
local DebugContainer = nil

function TouchDebugger.Enable(playerGui)
    DebugContainer = Instance.new("Frame")
    DebugContainer.Name = "TouchDebugger"
    DebugContainer.Size = UDim2.new(1, 0, 1, 0)
    DebugContainer.BackgroundTransparency = 1
    DebugContainer.ZIndex = 100
    DebugContainer.Parent = playerGui

    local UserInputService = game:GetService("UserInputService")

    UserInputService.TouchStarted:Connect(function(input)
        TouchDebugger.CreateTouchIndicator(input)
    end)

    UserInputService.TouchMoved:Connect(function(input)
        TouchDebugger.UpdateTouchIndicator(input)
    end)

    UserInputService.TouchEnded:Connect(function(input)
        TouchDebugger.RemoveTouchIndicator(input)
    end)
end

function TouchDebugger.CreateTouchIndicator(input)
    local indicator = Instance.new("Frame")
    indicator.Name = "TouchIndicator"
    indicator.Size = UDim2.new(0, 60, 0, 60)
    indicator.Position = UDim2.new(0, input.Position.X, 0, input.Position.Y)
    indicator.AnchorPoint = Vector2.new(0.5, 0.5)
    indicator.BackgroundColor3 = Color3.fromRGB(59, 130, 246)
    indicator.BackgroundTransparency = 0.5
    indicator.Parent = DebugContainer

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(1, 0)
    corner.Parent = indicator

    local stroke = Instance.new("UIStroke")
    stroke.Color = Color3.fromRGB(255, 255, 255)
    stroke.Thickness = 2
    stroke.Parent = indicator

    -- Position label
    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(0, 100, 0, 20)
    label.Position = UDim2.new(0.5, 0, 0, -25)
    label.AnchorPoint = Vector2.new(0.5, 1)
    label.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    label.BackgroundTransparency = 0.5
    label.Text = string.format("%.0f, %.0f", input.Position.X, input.Position.Y)
    label.TextColor3 = Color3.fromRGB(255, 255, 255)
    label.Font = Enum.Font.Code
    label.TextSize = 12
    label.Parent = indicator

    local labelCorner = Instance.new("UICorner")
    labelCorner.CornerRadius = UDim.new(0, 4)
    labelCorner.Parent = label

    ActiveTouches[input.UserInputState] = {
        Indicator = indicator,
        Label = label,
    }
end

function TouchDebugger.UpdateTouchIndicator(input)
    local touch = ActiveTouches[input.UserInputState]
    if touch then
        touch.Indicator.Position = UDim2.new(0, input.Position.X, 0, input.Position.Y)
        touch.Label.Text = string.format("%.0f, %.0f", input.Position.X, input.Position.Y)
    end
end

function TouchDebugger.RemoveTouchIndicator(input)
    local touch = ActiveTouches[input.UserInputState]
    if touch then
        touch.Indicator:Destroy()
        ActiveTouches[input.UserInputState] = nil
    end
end

function TouchDebugger.Disable()
    if DebugContainer then
        DebugContainer:Destroy()
        DebugContainer = nil
    end
    ActiveTouches = {}
end

return TouchDebugger
```

---

## Summary

Mobile-first design in Roblox requires careful attention to:

1. **Touch Gestures**: Implement comprehensive gesture detection with proper conflict resolution
2. **Thumb Zones**: Position interactive elements within easy thumb reach
3. **HUD Design**: Keep HUD minimal and respect safe areas
4. **Virtual Controls**: Provide intuitive joysticks and floating controls
5. **Performance**: Optimize for mobile hardware limitations
6. **Device Adaptation**: Handle different screen sizes and orientations
7. **Testing**: Test on real devices and use emulation tools

Following these patterns ensures your Roblox experience provides an excellent mobile user experience for the majority of players.
