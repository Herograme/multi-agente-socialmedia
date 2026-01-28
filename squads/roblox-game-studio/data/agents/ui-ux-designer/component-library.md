---
title: "Roblox UI Component Library"
agent: "ui-ux-designer"
alias: "Pixel"
category: "component-catalog"
version: "1.0.0"
lastUpdated: "2025-01-28"
description: "Comprehensive catalog of reusable UI components for Roblox experiences"
tags: ["components", "ui", "library", "reusable", "patterns"]
---

# Roblox UI Component Library

## Overview

This comprehensive component library provides production-ready UI components for Roblox experiences. Each component includes detailed specifications, state management, Lua implementation, and usage guidelines following Roblox best practices.

## Design Tokens

### Color System

```lua
local Colors = {
    -- Primary palette
    Primary = {
        Main = Color3.fromRGB(59, 130, 246),      -- Blue 500
        Light = Color3.fromRGB(147, 197, 253),    -- Blue 300
        Dark = Color3.fromRGB(29, 78, 216),       -- Blue 700
        Contrast = Color3.fromRGB(255, 255, 255), -- White
    },

    -- Secondary palette
    Secondary = {
        Main = Color3.fromRGB(139, 92, 246),      -- Purple 500
        Light = Color3.fromRGB(196, 181, 253),    -- Purple 300
        Dark = Color3.fromRGB(91, 33, 182),       -- Purple 700
        Contrast = Color3.fromRGB(255, 255, 255),
    },

    -- Semantic colors
    Success = Color3.fromRGB(34, 197, 94),        -- Green 500
    Warning = Color3.fromRGB(234, 179, 8),        -- Yellow 500
    Error = Color3.fromRGB(239, 68, 68),          -- Red 500
    Info = Color3.fromRGB(59, 130, 246),          -- Blue 500

    -- Neutral palette
    Neutral = {
        White = Color3.fromRGB(255, 255, 255),
        Gray50 = Color3.fromRGB(249, 250, 251),
        Gray100 = Color3.fromRGB(243, 244, 246),
        Gray200 = Color3.fromRGB(229, 231, 235),
        Gray300 = Color3.fromRGB(209, 213, 219),
        Gray400 = Color3.fromRGB(156, 163, 175),
        Gray500 = Color3.fromRGB(107, 114, 128),
        Gray600 = Color3.fromRGB(75, 85, 99),
        Gray700 = Color3.fromRGB(55, 65, 81),
        Gray800 = Color3.fromRGB(31, 41, 55),
        Gray900 = Color3.fromRGB(17, 24, 39),
        Black = Color3.fromRGB(0, 0, 0),
    },

    -- Background colors
    Background = {
        Primary = Color3.fromRGB(15, 23, 42),     -- Slate 900
        Secondary = Color3.fromRGB(30, 41, 59),   -- Slate 800
        Tertiary = Color3.fromRGB(51, 65, 85),    -- Slate 700
        Elevated = Color3.fromRGB(71, 85, 105),   -- Slate 600
    },
}
```

### Spacing Scale

```lua
local Spacing = {
    None = UDim.new(0, 0),
    XS = UDim.new(0, 4),
    SM = UDim.new(0, 8),
    MD = UDim.new(0, 12),
    LG = UDim.new(0, 16),
    XL = UDim.new(0, 24),
    XXL = UDim.new(0, 32),
    XXXL = UDim.new(0, 48),
}
```

### Typography Scale

```lua
local Typography = {
    H1 = { Size = 32, Weight = Enum.FontWeight.Bold },
    H2 = { Size = 28, Weight = Enum.FontWeight.Bold },
    H3 = { Size = 24, Weight = Enum.FontWeight.SemiBold },
    H4 = { Size = 20, Weight = Enum.FontWeight.SemiBold },
    H5 = { Size = 18, Weight = Enum.FontWeight.Medium },
    H6 = { Size = 16, Weight = Enum.FontWeight.Medium },
    Body = { Size = 14, Weight = Enum.FontWeight.Regular },
    BodySmall = { Size = 12, Weight = Enum.FontWeight.Regular },
    Caption = { Size = 10, Weight = Enum.FontWeight.Regular },
    Button = { Size = 14, Weight = Enum.FontWeight.SemiBold },
}
```

---

## 1. Buttons

### 1.1 Primary Button

**Purpose**: Main call-to-action, most prominent action on screen.

**Specifications**:

| Property | Value |
|----------|-------|
| Min Width | 120px |
| Height | 44px (mobile), 40px (desktop) |
| Padding | 16px horizontal, 12px vertical |
| Border Radius | 8px |
| Font | GothamBold, 14px |
| States | Default, Hover, Pressed, Disabled, Loading |

**State Colors**:

| State | Background | Text | Border |
|-------|------------|------|--------|
| Default | Primary.Main | White | None |
| Hover | Primary.Dark | White | None |
| Pressed | Primary.Dark (90% opacity) | White | None |
| Disabled | Gray400 | Gray600 | None |
| Loading | Primary.Main (70% opacity) | Spinner | None |

**Implementation**:

```lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local ButtonModule = {}
ButtonModule.__index = ButtonModule

-- Button configuration
local ButtonConfig = {
    Primary = {
        BackgroundColor = Color3.fromRGB(59, 130, 246),
        HoverColor = Color3.fromRGB(29, 78, 216),
        PressedColor = Color3.fromRGB(29, 78, 216),
        DisabledColor = Color3.fromRGB(156, 163, 175),
        TextColor = Color3.fromRGB(255, 255, 255),
        DisabledTextColor = Color3.fromRGB(75, 85, 99),
    },
}

function ButtonModule.new(config)
    local self = setmetatable({}, ButtonModule)

    self.Config = config or {}
    self.State = "Default"
    self.Enabled = true
    self.Loading = false

    self:CreateButton()
    self:SetupInteractions()

    return self
end

function ButtonModule:CreateButton()
    local button = Instance.new("TextButton")
    button.Name = self.Config.Name or "PrimaryButton"
    button.Size = UDim2.new(0, self.Config.Width or 120, 0, 44)
    button.Position = self.Config.Position or UDim2.new(0.5, 0, 0.5, 0)
    button.AnchorPoint = Vector2.new(0.5, 0.5)
    button.BackgroundColor3 = ButtonConfig.Primary.BackgroundColor
    button.BorderSizePixel = 0
    button.AutoButtonColor = false
    button.Text = self.Config.Text or "Button"
    button.TextColor3 = ButtonConfig.Primary.TextColor
    button.Font = Enum.Font.GothamBold
    button.TextSize = 14

    -- Corner radius
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 8)
    corner.Parent = button

    -- Padding
    local padding = Instance.new("UIPadding")
    padding.PaddingLeft = UDim.new(0, 16)
    padding.PaddingRight = UDim.new(0, 16)
    padding.PaddingTop = UDim.new(0, 12)
    padding.PaddingBottom = UDim.new(0, 12)
    padding.Parent = button

    -- Shadow (optional)
    if self.Config.Shadow then
        local shadow = Instance.new("ImageLabel")
        shadow.Name = "Shadow"
        shadow.Size = UDim2.new(1, 16, 1, 16)
        shadow.Position = UDim2.new(0.5, 0, 0.5, 4)
        shadow.AnchorPoint = Vector2.new(0.5, 0.5)
        shadow.BackgroundTransparency = 1
        shadow.Image = "rbxassetid://6015897843"
        shadow.ImageColor3 = Color3.fromRGB(0, 0, 0)
        shadow.ImageTransparency = 0.7
        shadow.ZIndex = button.ZIndex - 1
        shadow.Parent = button
    end

    self.Button = button
    return button
end

function ButtonModule:SetupInteractions()
    local button = self.Button
    local tweenInfo = TweenInfo.new(0.15, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)

    button.MouseEnter:Connect(function()
        if not self.Enabled or self.Loading then return end
        self.State = "Hover"
        TweenService:Create(button, tweenInfo, {
            BackgroundColor3 = ButtonConfig.Primary.HoverColor
        }):Play()
    end)

    button.MouseLeave:Connect(function()
        if not self.Enabled or self.Loading then return end
        self.State = "Default"
        TweenService:Create(button, tweenInfo, {
            BackgroundColor3 = ButtonConfig.Primary.BackgroundColor
        }):Play()
    end)

    button.MouseButton1Down:Connect(function()
        if not self.Enabled or self.Loading then return end
        self.State = "Pressed"
        TweenService:Create(button, tweenInfo, {
            BackgroundColor3 = ButtonConfig.Primary.PressedColor,
            Size = UDim2.new(0, button.AbsoluteSize.X - 2, 0, button.AbsoluteSize.Y - 2)
        }):Play()
    end)

    button.MouseButton1Up:Connect(function()
        if not self.Enabled or self.Loading then return end
        self.State = "Hover"
        TweenService:Create(button, tweenInfo, {
            BackgroundColor3 = ButtonConfig.Primary.HoverColor,
            Size = UDim2.new(0, button.AbsoluteSize.X + 2, 0, button.AbsoluteSize.Y + 2)
        }):Play()
    end)
end

function ButtonModule:SetEnabled(enabled)
    self.Enabled = enabled
    local config = ButtonConfig.Primary

    if enabled then
        self.Button.BackgroundColor3 = config.BackgroundColor
        self.Button.TextColor3 = config.TextColor
    else
        self.Button.BackgroundColor3 = config.DisabledColor
        self.Button.TextColor3 = config.DisabledTextColor
    end
end

function ButtonModule:SetLoading(loading)
    self.Loading = loading

    if loading then
        self.Button.Text = ""
        -- Add spinner (implementation below)
        self:CreateSpinner()
    else
        self.Button.Text = self.Config.Text or "Button"
        self:RemoveSpinner()
    end
end

function ButtonModule:CreateSpinner()
    local spinner = Instance.new("ImageLabel")
    spinner.Name = "Spinner"
    spinner.Size = UDim2.new(0, 20, 0, 20)
    spinner.Position = UDim2.new(0.5, 0, 0.5, 0)
    spinner.AnchorPoint = Vector2.new(0.5, 0.5)
    spinner.BackgroundTransparency = 1
    spinner.Image = "rbxassetid://6034973115"
    spinner.Parent = self.Button

    -- Rotate animation
    local rotationTween = TweenService:Create(
        spinner,
        TweenInfo.new(1, Enum.EasingStyle.Linear, Enum.EasingDirection.InOut, -1),
        { Rotation = 360 }
    )
    rotationTween:Play()

    self.Spinner = spinner
end

function ButtonModule:RemoveSpinner()
    if self.Spinner then
        self.Spinner:Destroy()
        self.Spinner = nil
    end
end

return ButtonModule
```

**Usage Guidelines**:
- Use for primary actions: "Play", "Buy", "Confirm", "Continue"
- Limit to one primary button per view/section
- Position in easily reachable areas (bottom right for desktop, bottom center for mobile)
- Minimum touch target: 44x44 pixels

---

### 1.2 Secondary Button

**Purpose**: Secondary actions, less prominent than primary.

**Specifications**:

| Property | Value |
|----------|-------|
| Min Width | 100px |
| Height | 40px |
| Padding | 12px horizontal |
| Border Radius | 8px |
| Border | 2px solid |
| Font | GothamSemibold, 14px |

**Implementation**:

```lua
local SecondaryButton = {}

function SecondaryButton.new(config)
    local button = Instance.new("TextButton")
    button.Name = config.Name or "SecondaryButton"
    button.Size = UDim2.new(0, config.Width or 100, 0, 40)
    button.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
    button.BorderSizePixel = 0
    button.Text = config.Text or "Cancel"
    button.TextColor3 = Color3.fromRGB(148, 163, 184)
    button.Font = Enum.Font.GothamSemibold
    button.TextSize = 14
    button.AutoButtonColor = false

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 8)
    corner.Parent = button

    -- Border stroke
    local stroke = Instance.new("UIStroke")
    stroke.Color = Color3.fromRGB(71, 85, 105)
    stroke.Thickness = 2
    stroke.Parent = button

    -- Hover effects
    local TweenService = game:GetService("TweenService")
    local tweenInfo = TweenInfo.new(0.15)

    button.MouseEnter:Connect(function()
        TweenService:Create(stroke, tweenInfo, {
            Color = Color3.fromRGB(148, 163, 184)
        }):Play()
        TweenService:Create(button, tweenInfo, {
            TextColor3 = Color3.fromRGB(255, 255, 255)
        }):Play()
    end)

    button.MouseLeave:Connect(function()
        TweenService:Create(stroke, tweenInfo, {
            Color = Color3.fromRGB(71, 85, 105)
        }):Play()
        TweenService:Create(button, tweenInfo, {
            TextColor3 = Color3.fromRGB(148, 163, 184)
        }):Play()
    end)

    return button
end

return SecondaryButton
```

---

### 1.3 Icon Button

**Purpose**: Compact actions using icons only.

**Specifications**:

| Property | Value |
|----------|-------|
| Size | 40x40px (standard), 32x32px (small), 48x48px (large) |
| Icon Size | 60% of button size |
| Border Radius | 50% (circular) or 8px (rounded) |
| Touch Area | Minimum 44x44px |

**Implementation**:

```lua
local IconButton = {}

local SizePresets = {
    Small = { Button = 32, Icon = 18 },
    Standard = { Button = 40, Icon = 24 },
    Large = { Button = 48, Icon = 28 },
}

function IconButton.new(config)
    local preset = SizePresets[config.Size or "Standard"]

    local button = Instance.new("ImageButton")
    button.Name = config.Name or "IconButton"
    button.Size = UDim2.new(0, preset.Button, 0, preset.Button)
    button.BackgroundColor3 = config.BackgroundColor or Color3.fromRGB(51, 65, 85)
    button.BorderSizePixel = 0
    button.Image = config.Icon or ""
    button.ImageColor3 = config.IconColor or Color3.fromRGB(255, 255, 255)
    button.ScaleType = Enum.ScaleType.Fit
    button.AutoButtonColor = false

    -- Make circular if specified
    local corner = Instance.new("UICorner")
    corner.CornerRadius = config.Circular and UDim.new(1, 0) or UDim.new(0, 8)
    corner.Parent = button

    -- Icon sizing padding
    local padding = Instance.new("UIPadding")
    local iconPadding = (preset.Button - preset.Icon) / 2
    padding.PaddingLeft = UDim.new(0, iconPadding)
    padding.PaddingRight = UDim.new(0, iconPadding)
    padding.PaddingTop = UDim.new(0, iconPadding)
    padding.PaddingBottom = UDim.new(0, iconPadding)
    padding.Parent = button

    -- Ripple effect on click
    button.MouseButton1Down:Connect(function()
        local ripple = Instance.new("Frame")
        ripple.Name = "Ripple"
        ripple.Size = UDim2.new(0, 0, 0, 0)
        ripple.Position = UDim2.new(0.5, 0, 0.5, 0)
        ripple.AnchorPoint = Vector2.new(0.5, 0.5)
        ripple.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
        ripple.BackgroundTransparency = 0.7
        ripple.ZIndex = button.ZIndex + 1
        ripple.Parent = button

        local rippleCorner = Instance.new("UICorner")
        rippleCorner.CornerRadius = UDim.new(1, 0)
        rippleCorner.Parent = ripple

        local TweenService = game:GetService("TweenService")
        local expandTween = TweenService:Create(ripple, TweenInfo.new(0.3), {
            Size = UDim2.new(2, 0, 2, 0),
            BackgroundTransparency = 1
        })

        expandTween:Play()
        expandTween.Completed:Connect(function()
            ripple:Destroy()
        end)
    end)

    return button
end

return IconButton
```

---

### 1.4 Text Button (Link Style)

**Purpose**: Tertiary actions, navigation links.

**Implementation**:

```lua
local TextButton = {}

function TextButton.new(config)
    local button = Instance.new("TextButton")
    button.Name = config.Name or "TextButton"
    button.Size = UDim2.new(0, 0, 0, 24)
    button.AutomaticSize = Enum.AutomaticSize.X
    button.BackgroundTransparency = 1
    button.Text = config.Text or "Learn more"
    button.TextColor3 = config.Color or Color3.fromRGB(59, 130, 246)
    button.Font = Enum.Font.GothamMedium
    button.TextSize = config.TextSize or 14

    -- Underline on hover
    local underline = Instance.new("Frame")
    underline.Name = "Underline"
    underline.Size = UDim2.new(1, 0, 0, 1)
    underline.Position = UDim2.new(0, 0, 1, 0)
    underline.BackgroundColor3 = button.TextColor3
    underline.BackgroundTransparency = 1
    underline.BorderSizePixel = 0
    underline.Parent = button

    local TweenService = game:GetService("TweenService")

    button.MouseEnter:Connect(function()
        TweenService:Create(underline, TweenInfo.new(0.15), {
            BackgroundTransparency = 0
        }):Play()
    end)

    button.MouseLeave:Connect(function()
        TweenService:Create(underline, TweenInfo.new(0.15), {
            BackgroundTransparency = 1
        }):Play()
    end)

    return button
end

return TextButton
```

---

## 2. Cards

### 2.1 Info Card

**Purpose**: Display grouped information with optional actions.

**Specifications**:

| Property | Value |
|----------|-------|
| Min Width | 200px |
| Padding | 16px |
| Border Radius | 12px |
| Background | Background.Secondary |
| Shadow | Soft, 4px offset |

**Implementation**:

```lua
local InfoCard = {}
InfoCard.__index = InfoCard

function InfoCard.new(config)
    local self = setmetatable({}, InfoCard)

    -- Main container
    local card = Instance.new("Frame")
    card.Name = config.Name or "InfoCard"
    card.Size = config.Size or UDim2.new(0, 280, 0, 0)
    card.AutomaticSize = Enum.AutomaticSize.Y
    card.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
    card.BorderSizePixel = 0

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = card

    local padding = Instance.new("UIPadding")
    padding.PaddingLeft = UDim.new(0, 16)
    padding.PaddingRight = UDim.new(0, 16)
    padding.PaddingTop = UDim.new(0, 16)
    padding.PaddingBottom = UDim.new(0, 16)
    padding.Parent = card

    -- Layout
    local layout = Instance.new("UIListLayout")
    layout.SortOrder = Enum.SortOrder.LayoutOrder
    layout.Padding = UDim.new(0, 12)
    layout.Parent = card

    -- Header (optional)
    if config.Header then
        local header = Instance.new("TextLabel")
        header.Name = "Header"
        header.Size = UDim2.new(1, 0, 0, 24)
        header.BackgroundTransparency = 1
        header.Text = config.Header
        header.TextColor3 = Color3.fromRGB(255, 255, 255)
        header.Font = Enum.Font.GothamBold
        header.TextSize = 18
        header.TextXAlignment = Enum.TextXAlignment.Left
        header.LayoutOrder = 1
        header.Parent = card
    end

    -- Body
    if config.Body then
        local body = Instance.new("TextLabel")
        body.Name = "Body"
        body.Size = UDim2.new(1, 0, 0, 0)
        body.AutomaticSize = Enum.AutomaticSize.Y
        body.BackgroundTransparency = 1
        body.Text = config.Body
        body.TextColor3 = Color3.fromRGB(148, 163, 184)
        body.Font = Enum.Font.Gotham
        body.TextSize = 14
        body.TextXAlignment = Enum.TextXAlignment.Left
        body.TextWrapped = true
        body.LayoutOrder = 2
        body.Parent = card
    end

    -- Image (optional)
    if config.Image then
        local image = Instance.new("ImageLabel")
        image.Name = "CardImage"
        image.Size = UDim2.new(1, 0, 0, 120)
        image.BackgroundTransparency = 1
        image.Image = config.Image
        image.ScaleType = Enum.ScaleType.Crop
        image.LayoutOrder = 0
        image.Parent = card

        local imageCorner = Instance.new("UICorner")
        imageCorner.CornerRadius = UDim.new(0, 8)
        imageCorner.Parent = image
    end

    self.Card = card
    return self
end

function InfoCard:AddAction(text, callback)
    local actionsFrame = self.Card:FindFirstChild("Actions")

    if not actionsFrame then
        actionsFrame = Instance.new("Frame")
        actionsFrame.Name = "Actions"
        actionsFrame.Size = UDim2.new(1, 0, 0, 36)
        actionsFrame.BackgroundTransparency = 1
        actionsFrame.LayoutOrder = 100
        actionsFrame.Parent = self.Card

        local actionsLayout = Instance.new("UIListLayout")
        actionsLayout.FillDirection = Enum.FillDirection.Horizontal
        actionsLayout.HorizontalAlignment = Enum.HorizontalAlignment.Right
        actionsLayout.Padding = UDim.new(0, 8)
        actionsLayout.Parent = actionsFrame
    end

    local button = Instance.new("TextButton")
    button.Size = UDim2.new(0, 0, 1, 0)
    button.AutomaticSize = Enum.AutomaticSize.X
    button.BackgroundTransparency = 1
    button.Text = text
    button.TextColor3 = Color3.fromRGB(59, 130, 246)
    button.Font = Enum.Font.GothamSemibold
    button.TextSize = 14
    button.Parent = actionsFrame

    local buttonPadding = Instance.new("UIPadding")
    buttonPadding.PaddingLeft = UDim.new(0, 12)
    buttonPadding.PaddingRight = UDim.new(0, 12)
    buttonPadding.Parent = button

    if callback then
        button.MouseButton1Click:Connect(callback)
    end

    return button
end

return InfoCard
```

---

### 2.2 Item Card

**Purpose**: Display purchasable/collectible items with preview.

**Specifications**:

| Property | Value |
|----------|-------|
| Standard Size | 160x200px |
| Image Area | 160x120px |
| Content Area | 160x80px |
| Border Radius | 12px |
| States | Default, Hover, Selected, Owned, Locked |

**Implementation**:

```lua
local ItemCard = {}
ItemCard.__index = ItemCard

local CardStates = {
    Default = {
        BorderColor = Color3.fromRGB(71, 85, 105),
        BorderThickness = 0,
        Glow = false,
    },
    Hover = {
        BorderColor = Color3.fromRGB(148, 163, 184),
        BorderThickness = 2,
        Glow = false,
    },
    Selected = {
        BorderColor = Color3.fromRGB(59, 130, 246),
        BorderThickness = 3,
        Glow = true,
    },
    Owned = {
        BorderColor = Color3.fromRGB(34, 197, 94),
        BorderThickness = 2,
        Glow = false,
    },
    Locked = {
        BorderColor = Color3.fromRGB(71, 85, 105),
        BorderThickness = 0,
        Glow = false,
        Overlay = true,
    },
}

function ItemCard.new(config)
    local self = setmetatable({}, ItemCard)
    self.State = "Default"

    -- Main container
    local card = Instance.new("Frame")
    card.Name = config.Name or "ItemCard"
    card.Size = UDim2.new(0, 160, 0, 200)
    card.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
    card.BorderSizePixel = 0

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = card

    local stroke = Instance.new("UIStroke")
    stroke.Name = "Border"
    stroke.Color = CardStates.Default.BorderColor
    stroke.Thickness = CardStates.Default.BorderThickness
    stroke.Parent = card

    -- Image container
    local imageContainer = Instance.new("Frame")
    imageContainer.Name = "ImageContainer"
    imageContainer.Size = UDim2.new(1, 0, 0, 120)
    imageContainer.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
    imageContainer.BorderSizePixel = 0
    imageContainer.Parent = card

    local imageCorner = Instance.new("UICorner")
    imageCorner.CornerRadius = UDim.new(0, 12)
    imageCorner.Parent = imageContainer

    -- Fix bottom corners
    local cornerFix = Instance.new("Frame")
    cornerFix.Size = UDim2.new(1, 0, 0, 12)
    cornerFix.Position = UDim2.new(0, 0, 1, -12)
    cornerFix.BackgroundColor3 = imageContainer.BackgroundColor3
    cornerFix.BorderSizePixel = 0
    cornerFix.Parent = imageContainer

    local itemImage = Instance.new("ImageLabel")
    itemImage.Name = "ItemImage"
    itemImage.Size = UDim2.new(1, -20, 1, -20)
    itemImage.Position = UDim2.new(0.5, 0, 0.5, 0)
    itemImage.AnchorPoint = Vector2.new(0.5, 0.5)
    itemImage.BackgroundTransparency = 1
    itemImage.Image = config.Image or ""
    itemImage.ScaleType = Enum.ScaleType.Fit
    itemImage.Parent = imageContainer

    -- Rarity indicator
    if config.Rarity then
        local rarityColors = {
            Common = Color3.fromRGB(156, 163, 175),
            Uncommon = Color3.fromRGB(34, 197, 94),
            Rare = Color3.fromRGB(59, 130, 246),
            Epic = Color3.fromRGB(139, 92, 246),
            Legendary = Color3.fromRGB(234, 179, 8),
            Mythic = Color3.fromRGB(239, 68, 68),
        }

        local rarityBar = Instance.new("Frame")
        rarityBar.Name = "RarityBar"
        rarityBar.Size = UDim2.new(1, 0, 0, 3)
        rarityBar.Position = UDim2.new(0, 0, 1, 0)
        rarityBar.BackgroundColor3 = rarityColors[config.Rarity] or rarityColors.Common
        rarityBar.BorderSizePixel = 0
        rarityBar.Parent = imageContainer
    end

    -- Content area
    local content = Instance.new("Frame")
    content.Name = "Content"
    content.Size = UDim2.new(1, 0, 0, 80)
    content.Position = UDim2.new(0, 0, 0, 120)
    content.BackgroundTransparency = 1
    content.Parent = card

    local contentPadding = Instance.new("UIPadding")
    contentPadding.PaddingLeft = UDim.new(0, 12)
    contentPadding.PaddingRight = UDim.new(0, 12)
    contentPadding.PaddingTop = UDim.new(0, 8)
    contentPadding.PaddingBottom = UDim.new(0, 8)
    contentPadding.Parent = content

    local contentLayout = Instance.new("UIListLayout")
    contentLayout.SortOrder = Enum.SortOrder.LayoutOrder
    contentLayout.Padding = UDim.new(0, 4)
    contentLayout.Parent = content

    -- Item name
    local itemName = Instance.new("TextLabel")
    itemName.Name = "ItemName"
    itemName.Size = UDim2.new(1, 0, 0, 20)
    itemName.BackgroundTransparency = 1
    itemName.Text = config.ItemName or "Item Name"
    itemName.TextColor3 = Color3.fromRGB(255, 255, 255)
    itemName.Font = Enum.Font.GothamSemibold
    itemName.TextSize = 14
    itemName.TextXAlignment = Enum.TextXAlignment.Left
    itemName.TextTruncate = Enum.TextTruncate.AtEnd
    itemName.LayoutOrder = 1
    itemName.Parent = content

    -- Price
    local priceFrame = Instance.new("Frame")
    priceFrame.Name = "PriceFrame"
    priceFrame.Size = UDim2.new(1, 0, 0, 20)
    priceFrame.BackgroundTransparency = 1
    priceFrame.LayoutOrder = 2
    priceFrame.Parent = content

    local priceLayout = Instance.new("UIListLayout")
    priceLayout.FillDirection = Enum.FillDirection.Horizontal
    priceLayout.VerticalAlignment = Enum.VerticalAlignment.Center
    priceLayout.Padding = UDim.new(0, 4)
    priceLayout.Parent = priceFrame

    if config.Currency then
        local currencyIcon = Instance.new("ImageLabel")
        currencyIcon.Size = UDim2.new(0, 16, 0, 16)
        currencyIcon.BackgroundTransparency = 1
        currencyIcon.Image = config.CurrencyIcon or ""
        currencyIcon.Parent = priceFrame
    end

    local priceLabel = Instance.new("TextLabel")
    priceLabel.Size = UDim2.new(0, 0, 0, 16)
    priceLabel.AutomaticSize = Enum.AutomaticSize.X
    priceLabel.BackgroundTransparency = 1
    priceLabel.Text = config.Price and tostring(config.Price) or "Free"
    priceLabel.TextColor3 = Color3.fromRGB(234, 179, 8)
    priceLabel.Font = Enum.Font.GothamBold
    priceLabel.TextSize = 14
    priceLabel.Parent = priceFrame

    -- Lock overlay
    local lockOverlay = Instance.new("Frame")
    lockOverlay.Name = "LockOverlay"
    lockOverlay.Size = UDim2.new(1, 0, 1, 0)
    lockOverlay.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    lockOverlay.BackgroundTransparency = 0.5
    lockOverlay.Visible = false
    lockOverlay.ZIndex = 10
    lockOverlay.Parent = card

    local lockCorner = Instance.new("UICorner")
    lockCorner.CornerRadius = UDim.new(0, 12)
    lockCorner.Parent = lockOverlay

    local lockIcon = Instance.new("ImageLabel")
    lockIcon.Size = UDim2.new(0, 32, 0, 32)
    lockIcon.Position = UDim2.new(0.5, 0, 0.5, 0)
    lockIcon.AnchorPoint = Vector2.new(0.5, 0.5)
    lockIcon.BackgroundTransparency = 1
    lockIcon.Image = "rbxassetid://6031082533"
    lockIcon.ImageColor3 = Color3.fromRGB(255, 255, 255)
    lockIcon.Parent = lockOverlay

    -- Click handler
    local clickDetector = Instance.new("TextButton")
    clickDetector.Name = "ClickDetector"
    clickDetector.Size = UDim2.new(1, 0, 1, 0)
    clickDetector.BackgroundTransparency = 1
    clickDetector.Text = ""
    clickDetector.ZIndex = 5
    clickDetector.Parent = card

    self.Card = card
    self.Stroke = stroke
    self.LockOverlay = lockOverlay
    self.ClickDetector = clickDetector

    self:SetupInteractions()

    return self
end

function ItemCard:SetupInteractions()
    local TweenService = game:GetService("TweenService")
    local tweenInfo = TweenInfo.new(0.15)

    self.ClickDetector.MouseEnter:Connect(function()
        if self.State == "Locked" then return end

        local stateConfig = CardStates.Hover
        TweenService:Create(self.Stroke, tweenInfo, {
            Color = stateConfig.BorderColor,
            Thickness = stateConfig.BorderThickness
        }):Play()

        TweenService:Create(self.Card, tweenInfo, {
            Position = self.Card.Position + UDim2.new(0, 0, 0, -4)
        }):Play()
    end)

    self.ClickDetector.MouseLeave:Connect(function()
        if self.State == "Locked" then return end

        local stateConfig = CardStates[self.State] or CardStates.Default
        TweenService:Create(self.Stroke, tweenInfo, {
            Color = stateConfig.BorderColor,
            Thickness = stateConfig.BorderThickness
        }):Play()

        TweenService:Create(self.Card, tweenInfo, {
            Position = self.Card.Position + UDim2.new(0, 0, 0, 4)
        }):Play()
    end)
end

function ItemCard:SetState(state)
    self.State = state
    local stateConfig = CardStates[state] or CardStates.Default

    self.Stroke.Color = stateConfig.BorderColor
    self.Stroke.Thickness = stateConfig.BorderThickness
    self.LockOverlay.Visible = stateConfig.Overlay or false
end

return ItemCard
```

---

### 2.3 Preview Card

**Purpose**: Large preview with detailed information.

**Specifications**:

| Property | Value |
|----------|-------|
| Width | 320-400px |
| Image Ratio | 16:9 |
| Content Padding | 20px |
| Border Radius | 16px |

```lua
local PreviewCard = {}

function PreviewCard.new(config)
    local card = Instance.new("Frame")
    card.Name = config.Name or "PreviewCard"
    card.Size = UDim2.new(0, config.Width or 360, 0, 0)
    card.AutomaticSize = Enum.AutomaticSize.Y
    card.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
    card.BorderSizePixel = 0

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 16)
    corner.Parent = card

    local layout = Instance.new("UIListLayout")
    layout.SortOrder = Enum.SortOrder.LayoutOrder
    layout.Parent = card

    -- Preview image (16:9)
    local imageHeight = (config.Width or 360) * 9 / 16
    local imageFrame = Instance.new("Frame")
    imageFrame.Name = "ImageFrame"
    imageFrame.Size = UDim2.new(1, 0, 0, imageHeight)
    imageFrame.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
    imageFrame.BorderSizePixel = 0
    imageFrame.ClipsDescendants = true
    imageFrame.LayoutOrder = 1
    imageFrame.Parent = card

    local imageCorner = Instance.new("UICorner")
    imageCorner.CornerRadius = UDim.new(0, 16)
    imageCorner.Parent = imageFrame

    local cornerFix = Instance.new("Frame")
    cornerFix.Size = UDim2.new(1, 0, 0, 16)
    cornerFix.Position = UDim2.new(0, 0, 1, -16)
    cornerFix.BackgroundColor3 = imageFrame.BackgroundColor3
    cornerFix.BorderSizePixel = 0
    cornerFix.Parent = imageFrame

    local previewImage = Instance.new("ImageLabel")
    previewImage.Name = "PreviewImage"
    previewImage.Size = UDim2.new(1, 0, 1, 0)
    previewImage.BackgroundTransparency = 1
    previewImage.Image = config.Image or ""
    previewImage.ScaleType = Enum.ScaleType.Crop
    previewImage.Parent = imageFrame

    -- Play button overlay (for video previews)
    if config.HasVideo then
        local playButton = Instance.new("ImageButton")
        playButton.Name = "PlayButton"
        playButton.Size = UDim2.new(0, 64, 0, 64)
        playButton.Position = UDim2.new(0.5, 0, 0.5, 0)
        playButton.AnchorPoint = Vector2.new(0.5, 0.5)
        playButton.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
        playButton.BackgroundTransparency = 0.3
        playButton.Image = "rbxassetid://6035047380"
        playButton.ImageColor3 = Color3.fromRGB(255, 255, 255)
        playButton.ZIndex = 2
        playButton.Parent = imageFrame

        local playCorner = Instance.new("UICorner")
        playCorner.CornerRadius = UDim.new(1, 0)
        playCorner.Parent = playButton
    end

    -- Content section
    local content = Instance.new("Frame")
    content.Name = "Content"
    content.Size = UDim2.new(1, 0, 0, 0)
    content.AutomaticSize = Enum.AutomaticSize.Y
    content.BackgroundTransparency = 1
    content.LayoutOrder = 2
    content.Parent = card

    local contentPadding = Instance.new("UIPadding")
    contentPadding.PaddingLeft = UDim.new(0, 20)
    contentPadding.PaddingRight = UDim.new(0, 20)
    contentPadding.PaddingTop = UDim.new(0, 16)
    contentPadding.PaddingBottom = UDim.new(0, 20)
    contentPadding.Parent = content

    local contentLayout = Instance.new("UIListLayout")
    contentLayout.SortOrder = Enum.SortOrder.LayoutOrder
    contentLayout.Padding = UDim.new(0, 12)
    contentLayout.Parent = content

    -- Title
    local title = Instance.new("TextLabel")
    title.Name = "Title"
    title.Size = UDim2.new(1, 0, 0, 0)
    title.AutomaticSize = Enum.AutomaticSize.Y
    title.BackgroundTransparency = 1
    title.Text = config.Title or "Preview Title"
    title.TextColor3 = Color3.fromRGB(255, 255, 255)
    title.Font = Enum.Font.GothamBold
    title.TextSize = 20
    title.TextXAlignment = Enum.TextXAlignment.Left
    title.TextWrapped = true
    title.LayoutOrder = 1
    title.Parent = content

    -- Description
    local description = Instance.new("TextLabel")
    description.Name = "Description"
    description.Size = UDim2.new(1, 0, 0, 0)
    description.AutomaticSize = Enum.AutomaticSize.Y
    description.BackgroundTransparency = 1
    description.Text = config.Description or ""
    description.TextColor3 = Color3.fromRGB(148, 163, 184)
    description.Font = Enum.Font.Gotham
    description.TextSize = 14
    description.TextXAlignment = Enum.TextXAlignment.Left
    description.TextWrapped = true
    description.LayoutOrder = 2
    description.Parent = content

    -- Tags (optional)
    if config.Tags and #config.Tags > 0 then
        local tagsFrame = Instance.new("Frame")
        tagsFrame.Name = "Tags"
        tagsFrame.Size = UDim2.new(1, 0, 0, 0)
        tagsFrame.AutomaticSize = Enum.AutomaticSize.Y
        tagsFrame.BackgroundTransparency = 1
        tagsFrame.LayoutOrder = 3
        tagsFrame.Parent = content

        local tagsLayout = Instance.new("UIListLayout")
        tagsLayout.FillDirection = Enum.FillDirection.Horizontal
        tagsLayout.Wraps = true
        tagsLayout.Padding = UDim.new(0, 8)
        tagsLayout.Parent = tagsFrame

        for _, tag in ipairs(config.Tags) do
            local tagLabel = Instance.new("TextLabel")
            tagLabel.Size = UDim2.new(0, 0, 0, 24)
            tagLabel.AutomaticSize = Enum.AutomaticSize.X
            tagLabel.BackgroundColor3 = Color3.fromRGB(51, 65, 85)
            tagLabel.Text = tag
            tagLabel.TextColor3 = Color3.fromRGB(148, 163, 184)
            tagLabel.Font = Enum.Font.GothamMedium
            tagLabel.TextSize = 12
            tagLabel.Parent = tagsFrame

            local tagCorner = Instance.new("UICorner")
            tagCorner.CornerRadius = UDim.new(0, 4)
            tagCorner.Parent = tagLabel

            local tagPadding = Instance.new("UIPadding")
            tagPadding.PaddingLeft = UDim.new(0, 8)
            tagPadding.PaddingRight = UDim.new(0, 8)
            tagPadding.Parent = tagLabel
        end
    end

    return card
end

return PreviewCard
```

---

## 3. Modals

### 3.1 Dialog Modal

**Purpose**: Confirmation dialogs, alerts, simple forms.

**Specifications**:

| Property | Value |
|----------|-------|
| Width | 320px (mobile) / 400px (desktop) |
| Max Height | 80% viewport |
| Border Radius | 16px |
| Overlay | Black, 50% opacity |
| Animation | Scale + Fade, 200ms |

**Implementation**:

```lua
local Dialog = {}
Dialog.__index = Dialog

local TweenService = game:GetService("TweenService")

function Dialog.new(config)
    local self = setmetatable({}, Dialog)

    -- Screen overlay
    local overlay = Instance.new("Frame")
    overlay.Name = "DialogOverlay"
    overlay.Size = UDim2.new(1, 0, 1, 0)
    overlay.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    overlay.BackgroundTransparency = 1
    overlay.ZIndex = 100

    -- Dialog container
    local dialog = Instance.new("Frame")
    dialog.Name = "Dialog"
    dialog.Size = UDim2.new(0, config.Width or 400, 0, 0)
    dialog.AutomaticSize = Enum.AutomaticSize.Y
    dialog.Position = UDim2.new(0.5, 0, 0.5, 0)
    dialog.AnchorPoint = Vector2.new(0.5, 0.5)
    dialog.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
    dialog.BorderSizePixel = 0
    dialog.ZIndex = 101
    dialog.Parent = overlay

    -- Start scaled down for animation
    dialog.Size = UDim2.new(0, (config.Width or 400) * 0.9, 0, 0)

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 16)
    corner.Parent = dialog

    -- Shadow
    local shadow = Instance.new("ImageLabel")
    shadow.Name = "Shadow"
    shadow.Size = UDim2.new(1, 40, 1, 40)
    shadow.Position = UDim2.new(0.5, 0, 0.5, 8)
    shadow.AnchorPoint = Vector2.new(0.5, 0.5)
    shadow.BackgroundTransparency = 1
    shadow.Image = "rbxassetid://6015897843"
    shadow.ImageColor3 = Color3.fromRGB(0, 0, 0)
    shadow.ImageTransparency = 0.5
    shadow.ZIndex = dialog.ZIndex - 1
    shadow.Parent = dialog

    local padding = Instance.new("UIPadding")
    padding.PaddingLeft = UDim.new(0, 24)
    padding.PaddingRight = UDim.new(0, 24)
    padding.PaddingTop = UDim.new(0, 24)
    padding.PaddingBottom = UDim.new(0, 24)
    padding.Parent = dialog

    local layout = Instance.new("UIListLayout")
    layout.SortOrder = Enum.SortOrder.LayoutOrder
    layout.Padding = UDim.new(0, 16)
    layout.Parent = dialog

    -- Close button (X)
    if config.ShowClose ~= false then
        local closeBtn = Instance.new("ImageButton")
        closeBtn.Name = "CloseButton"
        closeBtn.Size = UDim2.new(0, 32, 0, 32)
        closeBtn.Position = UDim2.new(1, -8, 0, 8)
        closeBtn.AnchorPoint = Vector2.new(1, 0)
        closeBtn.BackgroundTransparency = 1
        closeBtn.Image = "rbxassetid://6031094678"
        closeBtn.ImageColor3 = Color3.fromRGB(148, 163, 184)
        closeBtn.ZIndex = dialog.ZIndex + 1
        closeBtn.Parent = dialog

        closeBtn.MouseButton1Click:Connect(function()
            self:Close()
        end)
    end

    -- Icon (optional)
    if config.Icon then
        local iconFrame = Instance.new("Frame")
        iconFrame.Name = "IconFrame"
        iconFrame.Size = UDim2.new(1, 0, 0, 64)
        iconFrame.BackgroundTransparency = 1
        iconFrame.LayoutOrder = 1
        iconFrame.Parent = dialog

        local icon = Instance.new("ImageLabel")
        icon.Size = UDim2.new(0, 64, 0, 64)
        icon.Position = UDim2.new(0.5, 0, 0.5, 0)
        icon.AnchorPoint = Vector2.new(0.5, 0.5)
        icon.BackgroundTransparency = 1
        icon.Image = config.Icon
        icon.ImageColor3 = config.IconColor or Color3.fromRGB(59, 130, 246)
        icon.Parent = iconFrame
    end

    -- Title
    local title = Instance.new("TextLabel")
    title.Name = "Title"
    title.Size = UDim2.new(1, 0, 0, 0)
    title.AutomaticSize = Enum.AutomaticSize.Y
    title.BackgroundTransparency = 1
    title.Text = config.Title or "Dialog Title"
    title.TextColor3 = Color3.fromRGB(255, 255, 255)
    title.Font = Enum.Font.GothamBold
    title.TextSize = 20
    title.TextXAlignment = config.CenterContent and Enum.TextXAlignment.Center or Enum.TextXAlignment.Left
    title.TextWrapped = true
    title.LayoutOrder = 2
    title.Parent = dialog

    -- Message
    if config.Message then
        local message = Instance.new("TextLabel")
        message.Name = "Message"
        message.Size = UDim2.new(1, 0, 0, 0)
        message.AutomaticSize = Enum.AutomaticSize.Y
        message.BackgroundTransparency = 1
        message.Text = config.Message
        message.TextColor3 = Color3.fromRGB(148, 163, 184)
        message.Font = Enum.Font.Gotham
        message.TextSize = 14
        message.TextXAlignment = config.CenterContent and Enum.TextXAlignment.Center or Enum.TextXAlignment.Left
        message.TextWrapped = true
        message.LayoutOrder = 3
        message.Parent = dialog
    end

    -- Actions
    local actionsFrame = Instance.new("Frame")
    actionsFrame.Name = "Actions"
    actionsFrame.Size = UDim2.new(1, 0, 0, 44)
    actionsFrame.BackgroundTransparency = 1
    actionsFrame.LayoutOrder = 100
    actionsFrame.Parent = dialog

    local actionsLayout = Instance.new("UIListLayout")
    actionsLayout.FillDirection = Enum.FillDirection.Horizontal
    actionsLayout.HorizontalAlignment = config.CenterContent and Enum.HorizontalAlignment.Center or Enum.HorizontalAlignment.Right
    actionsLayout.VerticalAlignment = Enum.VerticalAlignment.Center
    actionsLayout.Padding = UDim.new(0, 12)
    actionsLayout.Parent = actionsFrame

    self.Overlay = overlay
    self.Dialog = dialog
    self.ActionsFrame = actionsFrame
    self.Config = config

    -- Close on overlay click
    if config.CloseOnOverlay ~= false then
        local overlayClick = Instance.new("TextButton")
        overlayClick.Size = UDim2.new(1, 0, 1, 0)
        overlayClick.BackgroundTransparency = 1
        overlayClick.Text = ""
        overlayClick.ZIndex = overlay.ZIndex
        overlayClick.Parent = overlay

        overlayClick.MouseButton1Click:Connect(function()
            self:Close()
        end)
    end

    return self
end

function Dialog:AddButton(text, variant, callback)
    local button = Instance.new("TextButton")
    button.Size = UDim2.new(0, 0, 0, 44)
    button.AutomaticSize = Enum.AutomaticSize.X
    button.BorderSizePixel = 0
    button.Text = text
    button.Font = Enum.Font.GothamSemibold
    button.TextSize = 14
    button.AutoButtonColor = false
    button.Parent = self.ActionsFrame

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 8)
    corner.Parent = button

    local padding = Instance.new("UIPadding")
    padding.PaddingLeft = UDim.new(0, 20)
    padding.PaddingRight = UDim.new(0, 20)
    padding.Parent = button

    if variant == "primary" then
        button.BackgroundColor3 = Color3.fromRGB(59, 130, 246)
        button.TextColor3 = Color3.fromRGB(255, 255, 255)
    elseif variant == "danger" then
        button.BackgroundColor3 = Color3.fromRGB(239, 68, 68)
        button.TextColor3 = Color3.fromRGB(255, 255, 255)
    else -- secondary
        button.BackgroundColor3 = Color3.fromRGB(51, 65, 85)
        button.TextColor3 = Color3.fromRGB(148, 163, 184)
    end

    if callback then
        button.MouseButton1Click:Connect(function()
            callback()
            if self.Config.CloseOnAction ~= false then
                self:Close()
            end
        end)
    end

    return button
end

function Dialog:Show(parent)
    self.Overlay.Parent = parent or game.Players.LocalPlayer:WaitForChild("PlayerGui")

    -- Animate in
    local tweenInfo = TweenInfo.new(0.2, Enum.EasingStyle.Back, Enum.EasingDirection.Out)

    TweenService:Create(self.Overlay, TweenInfo.new(0.15), {
        BackgroundTransparency = 0.5
    }):Play()

    TweenService:Create(self.Dialog, tweenInfo, {
        Size = UDim2.new(0, self.Config.Width or 400, 0, 0)
    }):Play()
end

function Dialog:Close()
    local tweenInfo = TweenInfo.new(0.15, Enum.EasingStyle.Quad, Enum.EasingDirection.In)

    TweenService:Create(self.Overlay, tweenInfo, {
        BackgroundTransparency = 1
    }):Play()

    local closeTween = TweenService:Create(self.Dialog, tweenInfo, {
        Size = UDim2.new(0, (self.Config.Width or 400) * 0.9, 0, 0)
    })

    closeTween:Play()
    closeTween.Completed:Connect(function()
        self.Overlay:Destroy()
    end)

    if self.Config.OnClose then
        self.Config.OnClose()
    end
end

return Dialog
```

---

### 3.2 Drawer Modal

**Purpose**: Side panels for settings, inventory, detailed views.

**Implementation**:

```lua
local Drawer = {}
Drawer.__index = Drawer

local TweenService = game:GetService("TweenService")

local DrawerPositions = {
    Left = {
        Closed = UDim2.new(0, -300, 0, 0),
        Open = UDim2.new(0, 0, 0, 0),
        Size = UDim2.new(0, 300, 1, 0),
    },
    Right = {
        Closed = UDim2.new(1, 0, 0, 0),
        Open = UDim2.new(1, -300, 0, 0),
        Size = UDim2.new(0, 300, 1, 0),
    },
    Bottom = {
        Closed = UDim2.new(0, 0, 1, 0),
        Open = UDim2.new(0, 0, 1, -400),
        Size = UDim2.new(1, 0, 0, 400),
    },
}

function Drawer.new(config)
    local self = setmetatable({}, Drawer)
    self.Position = config.Position or "Right"
    self.IsOpen = false

    local positions = DrawerPositions[self.Position]

    -- Overlay
    local overlay = Instance.new("Frame")
    overlay.Name = "DrawerOverlay"
    overlay.Size = UDim2.new(1, 0, 1, 0)
    overlay.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    overlay.BackgroundTransparency = 1
    overlay.ZIndex = 100
    overlay.Visible = false

    -- Drawer panel
    local drawer = Instance.new("Frame")
    drawer.Name = "Drawer"
    drawer.Size = positions.Size
    drawer.Position = positions.Closed
    drawer.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
    drawer.BorderSizePixel = 0
    drawer.ZIndex = 101
    drawer.Parent = overlay

    -- Handle for bottom drawer
    if self.Position == "Bottom" then
        local handle = Instance.new("Frame")
        handle.Name = "Handle"
        handle.Size = UDim2.new(0, 40, 0, 4)
        handle.Position = UDim2.new(0.5, 0, 0, 12)
        handle.AnchorPoint = Vector2.new(0.5, 0)
        handle.BackgroundColor3 = Color3.fromRGB(71, 85, 105)
        handle.ZIndex = drawer.ZIndex + 1
        handle.Parent = drawer

        local handleCorner = Instance.new("UICorner")
        handleCorner.CornerRadius = UDim.new(1, 0)
        handleCorner.Parent = handle
    end

    -- Corner radius (only for appropriate edges)
    if self.Position == "Left" then
        local corner = Instance.new("UICorner")
        corner.CornerRadius = UDim.new(0, 0)
        corner.Parent = drawer
        -- Right corners only - need custom implementation
    elseif self.Position == "Bottom" then
        local corner = Instance.new("UICorner")
        corner.CornerRadius = UDim.new(0, 16)
        corner.Parent = drawer
    end

    -- Content container
    local content = Instance.new("ScrollingFrame")
    content.Name = "Content"
    content.Size = UDim2.new(1, 0, 1, self.Position == "Bottom" and -32 or 0)
    content.Position = UDim2.new(0, 0, 0, self.Position == "Bottom" and 32 or 0)
    content.BackgroundTransparency = 1
    content.ScrollBarThickness = 4
    content.ScrollBarImageColor3 = Color3.fromRGB(71, 85, 105)
    content.CanvasSize = UDim2.new(0, 0, 0, 0)
    content.AutomaticCanvasSize = Enum.AutomaticSize.Y
    content.Parent = drawer

    local contentPadding = Instance.new("UIPadding")
    contentPadding.PaddingLeft = UDim.new(0, 16)
    contentPadding.PaddingRight = UDim.new(0, 16)
    contentPadding.PaddingTop = UDim.new(0, 16)
    contentPadding.PaddingBottom = UDim.new(0, 16)
    contentPadding.Parent = content

    local contentLayout = Instance.new("UIListLayout")
    contentLayout.SortOrder = Enum.SortOrder.LayoutOrder
    contentLayout.Padding = UDim.new(0, 12)
    contentLayout.Parent = content

    -- Close on overlay click
    local overlayClick = Instance.new("TextButton")
    overlayClick.Size = UDim2.new(1, 0, 1, 0)
    overlayClick.BackgroundTransparency = 1
    overlayClick.Text = ""
    overlayClick.ZIndex = overlay.ZIndex
    overlayClick.Parent = overlay

    overlayClick.MouseButton1Click:Connect(function()
        self:Close()
    end)

    self.Overlay = overlay
    self.Drawer = drawer
    self.Content = content
    self.Config = config

    return self
end

function Drawer:Open()
    if self.IsOpen then return end
    self.IsOpen = true

    local positions = DrawerPositions[self.Position]
    local tweenInfo = TweenInfo.new(0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)

    self.Overlay.Visible = true

    TweenService:Create(self.Overlay, tweenInfo, {
        BackgroundTransparency = 0.5
    }):Play()

    TweenService:Create(self.Drawer, tweenInfo, {
        Position = positions.Open
    }):Play()
end

function Drawer:Close()
    if not self.IsOpen then return end
    self.IsOpen = false

    local positions = DrawerPositions[self.Position]
    local tweenInfo = TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.In)

    TweenService:Create(self.Overlay, tweenInfo, {
        BackgroundTransparency = 1
    }):Play()

    local closeTween = TweenService:Create(self.Drawer, tweenInfo, {
        Position = positions.Closed
    })

    closeTween:Play()
    closeTween.Completed:Connect(function()
        self.Overlay.Visible = false
    end)
end

function Drawer:Toggle()
    if self.IsOpen then
        self:Close()
    else
        self:Open()
    end
end

return Drawer
```

---

### 3.3 Fullscreen Modal

**Purpose**: Full-screen takeovers for complex interactions.

```lua
local FullscreenModal = {}
FullscreenModal.__index = FullscreenModal

function FullscreenModal.new(config)
    local self = setmetatable({}, FullscreenModal)

    local modal = Instance.new("Frame")
    modal.Name = "FullscreenModal"
    modal.Size = UDim2.new(1, 0, 1, 0)
    modal.BackgroundColor3 = Color3.fromRGB(15, 23, 42)
    modal.BackgroundTransparency = 1
    modal.ZIndex = 100
    modal.Visible = false

    -- Header
    local header = Instance.new("Frame")
    header.Name = "Header"
    header.Size = UDim2.new(1, 0, 0, 56)
    header.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
    header.BorderSizePixel = 0
    header.ZIndex = modal.ZIndex + 1
    header.Parent = modal

    -- Back button
    local backButton = Instance.new("ImageButton")
    backButton.Name = "BackButton"
    backButton.Size = UDim2.new(0, 44, 0, 44)
    backButton.Position = UDim2.new(0, 6, 0.5, 0)
    backButton.AnchorPoint = Vector2.new(0, 0.5)
    backButton.BackgroundTransparency = 1
    backButton.Image = "rbxassetid://6034818372"
    backButton.ImageColor3 = Color3.fromRGB(255, 255, 255)
    backButton.ZIndex = header.ZIndex + 1
    backButton.Parent = header

    -- Title
    local title = Instance.new("TextLabel")
    title.Name = "Title"
    title.Size = UDim2.new(1, -120, 1, 0)
    title.Position = UDim2.new(0.5, 0, 0, 0)
    title.AnchorPoint = Vector2.new(0.5, 0)
    title.BackgroundTransparency = 1
    title.Text = config.Title or "Modal Title"
    title.TextColor3 = Color3.fromRGB(255, 255, 255)
    title.Font = Enum.Font.GothamBold
    title.TextSize = 18
    title.ZIndex = header.ZIndex + 1
    title.Parent = header

    -- Content area
    local content = Instance.new("Frame")
    content.Name = "Content"
    content.Size = UDim2.new(1, 0, 1, -56)
    content.Position = UDim2.new(0, 0, 0, 56)
    content.BackgroundTransparency = 1
    content.ZIndex = modal.ZIndex + 1
    content.Parent = modal

    backButton.MouseButton1Click:Connect(function()
        self:Close()
    end)

    self.Modal = modal
    self.Content = content
    self.Config = config

    return self
end

function FullscreenModal:Show(parent)
    self.Modal.Parent = parent or game.Players.LocalPlayer:WaitForChild("PlayerGui")
    self.Modal.Visible = true

    local TweenService = game:GetService("TweenService")
    TweenService:Create(self.Modal, TweenInfo.new(0.2), {
        BackgroundTransparency = 0
    }):Play()
end

function FullscreenModal:Close()
    local TweenService = game:GetService("TweenService")
    local closeTween = TweenService:Create(self.Modal, TweenInfo.new(0.15), {
        BackgroundTransparency = 1
    })

    closeTween:Play()
    closeTween.Completed:Connect(function()
        self.Modal.Visible = false
        if self.Config.OnClose then
            self.Config.OnClose()
        end
    end)
end

return FullscreenModal
```

---

## 4. Inputs

### 4.1 Text Input

**Specifications**:

| Property | Value |
|----------|-------|
| Height | 44px |
| Padding | 12px horizontal |
| Border Radius | 8px |
| States | Default, Focus, Error, Disabled |

```lua
local TextInput = {}
TextInput.__index = TextInput

local InputStates = {
    Default = {
        BorderColor = Color3.fromRGB(71, 85, 105),
        BackgroundColor = Color3.fromRGB(30, 41, 59),
    },
    Focus = {
        BorderColor = Color3.fromRGB(59, 130, 246),
        BackgroundColor = Color3.fromRGB(30, 41, 59),
    },
    Error = {
        BorderColor = Color3.fromRGB(239, 68, 68),
        BackgroundColor = Color3.fromRGB(30, 41, 59),
    },
    Disabled = {
        BorderColor = Color3.fromRGB(51, 65, 85),
        BackgroundColor = Color3.fromRGB(15, 23, 42),
    },
}

function TextInput.new(config)
    local self = setmetatable({}, TextInput)
    self.State = "Default"

    -- Container
    local container = Instance.new("Frame")
    container.Name = config.Name or "TextInput"
    container.Size = config.Size or UDim2.new(0, 200, 0, 44)
    container.BackgroundColor3 = InputStates.Default.BackgroundColor
    container.BorderSizePixel = 0

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 8)
    corner.Parent = container

    local stroke = Instance.new("UIStroke")
    stroke.Color = InputStates.Default.BorderColor
    stroke.Thickness = 1
    stroke.Parent = container

    -- Label (optional)
    if config.Label then
        local label = Instance.new("TextLabel")
        label.Name = "Label"
        label.Size = UDim2.new(1, 0, 0, 20)
        label.Position = UDim2.new(0, 0, 0, -24)
        label.BackgroundTransparency = 1
        label.Text = config.Label
        label.TextColor3 = Color3.fromRGB(148, 163, 184)
        label.Font = Enum.Font.GothamMedium
        label.TextSize = 12
        label.TextXAlignment = Enum.TextXAlignment.Left
        label.Parent = container
    end

    -- Icon (optional)
    local iconOffset = 0
    if config.Icon then
        local icon = Instance.new("ImageLabel")
        icon.Name = "Icon"
        icon.Size = UDim2.new(0, 20, 0, 20)
        icon.Position = UDim2.new(0, 12, 0.5, 0)
        icon.AnchorPoint = Vector2.new(0, 0.5)
        icon.BackgroundTransparency = 1
        icon.Image = config.Icon
        icon.ImageColor3 = Color3.fromRGB(148, 163, 184)
        icon.Parent = container
        iconOffset = 40
    end

    -- TextBox
    local textbox = Instance.new("TextBox")
    textbox.Name = "Input"
    textbox.Size = UDim2.new(1, -(24 + iconOffset), 1, 0)
    textbox.Position = UDim2.new(0, 12 + iconOffset, 0, 0)
    textbox.BackgroundTransparency = 1
    textbox.Text = config.DefaultValue or ""
    textbox.PlaceholderText = config.Placeholder or ""
    textbox.PlaceholderColor3 = Color3.fromRGB(107, 114, 128)
    textbox.TextColor3 = Color3.fromRGB(255, 255, 255)
    textbox.Font = Enum.Font.Gotham
    textbox.TextSize = 14
    textbox.TextXAlignment = Enum.TextXAlignment.Left
    textbox.ClearTextOnFocus = config.ClearOnFocus or false
    textbox.Parent = container

    -- Error message
    local errorLabel = Instance.new("TextLabel")
    errorLabel.Name = "ErrorLabel"
    errorLabel.Size = UDim2.new(1, 0, 0, 16)
    errorLabel.Position = UDim2.new(0, 0, 1, 4)
    errorLabel.BackgroundTransparency = 1
    errorLabel.Text = ""
    errorLabel.TextColor3 = Color3.fromRGB(239, 68, 68)
    errorLabel.Font = Enum.Font.Gotham
    errorLabel.TextSize = 11
    errorLabel.TextXAlignment = Enum.TextXAlignment.Left
    errorLabel.Visible = false
    errorLabel.Parent = container

    -- Focus handling
    local TweenService = game:GetService("TweenService")
    local tweenInfo = TweenInfo.new(0.15)

    textbox.Focused:Connect(function()
        if self.State ~= "Error" then
            self.State = "Focus"
            TweenService:Create(stroke, tweenInfo, {
                Color = InputStates.Focus.BorderColor,
                Thickness = 2
            }):Play()
        end
    end)

    textbox.FocusLost:Connect(function(enterPressed)
        if self.State ~= "Error" then
            self.State = "Default"
            TweenService:Create(stroke, tweenInfo, {
                Color = InputStates.Default.BorderColor,
                Thickness = 1
            }):Play()
        end

        if config.OnSubmit and enterPressed then
            config.OnSubmit(textbox.Text)
        end
    end)

    textbox:GetPropertyChangedSignal("Text"):Connect(function()
        if config.OnChange then
            config.OnChange(textbox.Text)
        end
    end)

    self.Container = container
    self.TextBox = textbox
    self.Stroke = stroke
    self.ErrorLabel = errorLabel

    return self
end

function TextInput:SetError(message)
    self.State = "Error"
    self.ErrorLabel.Text = message
    self.ErrorLabel.Visible = true

    local TweenService = game:GetService("TweenService")
    TweenService:Create(self.Stroke, TweenInfo.new(0.15), {
        Color = InputStates.Error.BorderColor,
        Thickness = 2
    }):Play()
end

function TextInput:ClearError()
    self.State = "Default"
    self.ErrorLabel.Visible = false

    local TweenService = game:GetService("TweenService")
    TweenService:Create(self.Stroke, TweenInfo.new(0.15), {
        Color = InputStates.Default.BorderColor,
        Thickness = 1
    }):Play()
end

function TextInput:GetValue()
    return self.TextBox.Text
end

function TextInput:SetValue(value)
    self.TextBox.Text = value
end

return TextInput
```

---

### 4.2 Slider Input

```lua
local Slider = {}
Slider.__index = Slider

function Slider.new(config)
    local self = setmetatable({}, Slider)

    self.Min = config.Min or 0
    self.Max = config.Max or 100
    self.Value = config.Default or self.Min
    self.Step = config.Step or 1

    -- Container
    local container = Instance.new("Frame")
    container.Name = config.Name or "Slider"
    container.Size = UDim2.new(0, config.Width or 200, 0, 40)
    container.BackgroundTransparency = 1

    -- Label
    if config.Label then
        local label = Instance.new("TextLabel")
        label.Name = "Label"
        label.Size = UDim2.new(1, -50, 0, 20)
        label.Position = UDim2.new(0, 0, 0, 0)
        label.BackgroundTransparency = 1
        label.Text = config.Label
        label.TextColor3 = Color3.fromRGB(148, 163, 184)
        label.Font = Enum.Font.GothamMedium
        label.TextSize = 12
        label.TextXAlignment = Enum.TextXAlignment.Left
        label.Parent = container
    end

    -- Value display
    local valueLabel = Instance.new("TextLabel")
    valueLabel.Name = "ValueLabel"
    valueLabel.Size = UDim2.new(0, 50, 0, 20)
    valueLabel.Position = UDim2.new(1, 0, 0, 0)
    valueLabel.AnchorPoint = Vector2.new(1, 0)
    valueLabel.BackgroundTransparency = 1
    valueLabel.Text = tostring(self.Value)
    valueLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    valueLabel.Font = Enum.Font.GothamBold
    valueLabel.TextSize = 14
    valueLabel.TextXAlignment = Enum.TextXAlignment.Right
    valueLabel.Parent = container

    -- Track
    local track = Instance.new("Frame")
    track.Name = "Track"
    track.Size = UDim2.new(1, 0, 0, 6)
    track.Position = UDim2.new(0, 0, 1, -12)
    track.BackgroundColor3 = Color3.fromRGB(51, 65, 85)
    track.BorderSizePixel = 0
    track.Parent = container

    local trackCorner = Instance.new("UICorner")
    trackCorner.CornerRadius = UDim.new(1, 0)
    trackCorner.Parent = track

    -- Fill
    local fill = Instance.new("Frame")
    fill.Name = "Fill"
    fill.Size = UDim2.new((self.Value - self.Min) / (self.Max - self.Min), 0, 1, 0)
    fill.BackgroundColor3 = Color3.fromRGB(59, 130, 246)
    fill.BorderSizePixel = 0
    fill.Parent = track

    local fillCorner = Instance.new("UICorner")
    fillCorner.CornerRadius = UDim.new(1, 0)
    fillCorner.Parent = fill

    -- Thumb
    local thumb = Instance.new("Frame")
    thumb.Name = "Thumb"
    thumb.Size = UDim2.new(0, 20, 0, 20)
    thumb.Position = UDim2.new((self.Value - self.Min) / (self.Max - self.Min), 0, 0.5, 0)
    thumb.AnchorPoint = Vector2.new(0.5, 0.5)
    thumb.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
    thumb.BorderSizePixel = 0
    thumb.ZIndex = 2
    thumb.Parent = track

    local thumbCorner = Instance.new("UICorner")
    thumbCorner.CornerRadius = UDim.new(1, 0)
    thumbCorner.Parent = thumb

    -- Shadow for thumb
    local thumbShadow = Instance.new("ImageLabel")
    thumbShadow.Size = UDim2.new(1, 8, 1, 8)
    thumbShadow.Position = UDim2.new(0.5, 0, 0.5, 2)
    thumbShadow.AnchorPoint = Vector2.new(0.5, 0.5)
    thumbShadow.BackgroundTransparency = 1
    thumbShadow.Image = "rbxassetid://6015897843"
    thumbShadow.ImageColor3 = Color3.fromRGB(0, 0, 0)
    thumbShadow.ImageTransparency = 0.7
    thumbShadow.ZIndex = 1
    thumbShadow.Parent = thumb

    -- Drag handling
    local dragging = false
    local UserInputService = game:GetService("UserInputService")

    local function updateValue(inputPosition)
        local trackAbsolutePosition = track.AbsolutePosition.X
        local trackAbsoluteSize = track.AbsoluteSize.X
        local relativePosition = math.clamp(
            (inputPosition - trackAbsolutePosition) / trackAbsoluteSize,
            0, 1
        )

        local rawValue = self.Min + (self.Max - self.Min) * relativePosition
        local steppedValue = math.round(rawValue / self.Step) * self.Step
        self.Value = math.clamp(steppedValue, self.Min, self.Max)

        local percentage = (self.Value - self.Min) / (self.Max - self.Min)
        fill.Size = UDim2.new(percentage, 0, 1, 0)
        thumb.Position = UDim2.new(percentage, 0, 0.5, 0)
        valueLabel.Text = tostring(self.Value)

        if config.OnChange then
            config.OnChange(self.Value)
        end
    end

    -- Click detector on track
    local clickDetector = Instance.new("TextButton")
    clickDetector.Size = UDim2.new(1, 0, 1, 20)
    clickDetector.Position = UDim2.new(0, 0, 0.5, 0)
    clickDetector.AnchorPoint = Vector2.new(0, 0.5)
    clickDetector.BackgroundTransparency = 1
    clickDetector.Text = ""
    clickDetector.Parent = track

    clickDetector.MouseButton1Down:Connect(function()
        dragging = true
        updateValue(UserInputService:GetMouseLocation().X)
    end)

    UserInputService.InputEnded:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 then
            dragging = false
        end
    end)

    UserInputService.InputChanged:Connect(function(input)
        if dragging and input.UserInputType == Enum.UserInputType.MouseMovement then
            updateValue(input.Position.X)
        end
    end)

    self.Container = container
    self.Fill = fill
    self.Thumb = thumb
    self.ValueLabel = valueLabel

    return self
end

function Slider:SetValue(value)
    self.Value = math.clamp(value, self.Min, self.Max)
    local percentage = (self.Value - self.Min) / (self.Max - self.Min)
    self.Fill.Size = UDim2.new(percentage, 0, 1, 0)
    self.Thumb.Position = UDim2.new(percentage, 0, 0.5, 0)
    self.ValueLabel.Text = tostring(self.Value)
end

function Slider:GetValue()
    return self.Value
end

return Slider
```

---

### 4.3 Toggle Switch

```lua
local Toggle = {}
Toggle.__index = Toggle

function Toggle.new(config)
    local self = setmetatable({}, Toggle)
    self.Value = config.Default or false

    local TweenService = game:GetService("TweenService")

    -- Container
    local container = Instance.new("Frame")
    container.Name = config.Name or "Toggle"
    container.Size = UDim2.new(0, config.Width or 200, 0, 32)
    container.BackgroundTransparency = 1

    -- Label
    if config.Label then
        local label = Instance.new("TextLabel")
        label.Name = "Label"
        label.Size = UDim2.new(1, -60, 1, 0)
        label.BackgroundTransparency = 1
        label.Text = config.Label
        label.TextColor3 = Color3.fromRGB(255, 255, 255)
        label.Font = Enum.Font.GothamMedium
        label.TextSize = 14
        label.TextXAlignment = Enum.TextXAlignment.Left
        label.Parent = container
    end

    -- Switch background
    local switchBg = Instance.new("Frame")
    switchBg.Name = "SwitchBg"
    switchBg.Size = UDim2.new(0, 48, 0, 28)
    switchBg.Position = UDim2.new(1, 0, 0.5, 0)
    switchBg.AnchorPoint = Vector2.new(1, 0.5)
    switchBg.BackgroundColor3 = self.Value
        and Color3.fromRGB(59, 130, 246)
        or Color3.fromRGB(71, 85, 105)
    switchBg.BorderSizePixel = 0
    switchBg.Parent = container

    local bgCorner = Instance.new("UICorner")
    bgCorner.CornerRadius = UDim.new(1, 0)
    bgCorner.Parent = switchBg

    -- Knob
    local knob = Instance.new("Frame")
    knob.Name = "Knob"
    knob.Size = UDim2.new(0, 22, 0, 22)
    knob.Position = self.Value
        and UDim2.new(1, -3, 0.5, 0)
        or UDim2.new(0, 3, 0.5, 0)
    knob.AnchorPoint = self.Value
        and Vector2.new(1, 0.5)
        or Vector2.new(0, 0.5)
    knob.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
    knob.BorderSizePixel = 0
    knob.Parent = switchBg

    local knobCorner = Instance.new("UICorner")
    knobCorner.CornerRadius = UDim.new(1, 0)
    knobCorner.Parent = knob

    -- Click handler
    local clickDetector = Instance.new("TextButton")
    clickDetector.Size = UDim2.new(1, 0, 1, 0)
    clickDetector.BackgroundTransparency = 1
    clickDetector.Text = ""
    clickDetector.Parent = switchBg

    clickDetector.MouseButton1Click:Connect(function()
        self:SetValue(not self.Value)

        if config.OnChange then
            config.OnChange(self.Value)
        end
    end)

    self.Container = container
    self.SwitchBg = switchBg
    self.Knob = knob

    return self
end

function Toggle:SetValue(value)
    self.Value = value

    local TweenService = game:GetService("TweenService")
    local tweenInfo = TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)

    TweenService:Create(self.SwitchBg, tweenInfo, {
        BackgroundColor3 = value
            and Color3.fromRGB(59, 130, 246)
            or Color3.fromRGB(71, 85, 105)
    }):Play()

    TweenService:Create(self.Knob, tweenInfo, {
        Position = value
            and UDim2.new(1, -3, 0.5, 0)
            or UDim2.new(0, 3, 0.5, 0),
        AnchorPoint = value
            and Vector2.new(1, 0.5)
            or Vector2.new(0, 0.5)
    }):Play()
end

function Toggle:GetValue()
    return self.Value
end

return Toggle
```

---

## 5. Lists

### 5.1 Simple List

```lua
local SimpleList = {}
SimpleList.__index = SimpleList

function SimpleList.new(config)
    local self = setmetatable({}, SimpleList)

    local container = Instance.new("ScrollingFrame")
    container.Name = config.Name or "SimpleList"
    container.Size = config.Size or UDim2.new(0, 300, 0, 400)
    container.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
    container.BorderSizePixel = 0
    container.ScrollBarThickness = 4
    container.ScrollBarImageColor3 = Color3.fromRGB(71, 85, 105)
    container.CanvasSize = UDim2.new(0, 0, 0, 0)
    container.AutomaticCanvasSize = Enum.AutomaticSize.Y

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = container

    local padding = Instance.new("UIPadding")
    padding.PaddingLeft = UDim.new(0, 8)
    padding.PaddingRight = UDim.new(0, 8)
    padding.PaddingTop = UDim.new(0, 8)
    padding.PaddingBottom = UDim.new(0, 8)
    padding.Parent = container

    local layout = Instance.new("UIListLayout")
    layout.SortOrder = Enum.SortOrder.LayoutOrder
    layout.Padding = UDim.new(0, 4)
    layout.Parent = container

    self.Container = container
    self.Items = {}
    self.Config = config

    return self
end

function SimpleList:AddItem(data)
    local item = Instance.new("Frame")
    item.Name = "ListItem_" .. #self.Items + 1
    item.Size = UDim2.new(1, 0, 0, 48)
    item.BackgroundColor3 = Color3.fromRGB(51, 65, 85)
    item.BackgroundTransparency = 1
    item.BorderSizePixel = 0
    item.LayoutOrder = #self.Items + 1
    item.Parent = self.Container

    local itemCorner = Instance.new("UICorner")
    itemCorner.CornerRadius = UDim.new(0, 8)
    itemCorner.Parent = item

    local itemPadding = Instance.new("UIPadding")
    itemPadding.PaddingLeft = UDim.new(0, 12)
    itemPadding.PaddingRight = UDim.new(0, 12)
    itemPadding.Parent = item

    -- Icon (optional)
    local textOffset = 0
    if data.Icon then
        local icon = Instance.new("ImageLabel")
        icon.Name = "Icon"
        icon.Size = UDim2.new(0, 24, 0, 24)
        icon.Position = UDim2.new(0, 0, 0.5, 0)
        icon.AnchorPoint = Vector2.new(0, 0.5)
        icon.BackgroundTransparency = 1
        icon.Image = data.Icon
        icon.ImageColor3 = data.IconColor or Color3.fromRGB(148, 163, 184)
        icon.Parent = item
        textOffset = 36
    end

    -- Text
    local text = Instance.new("TextLabel")
    text.Name = "Text"
    text.Size = UDim2.new(1, -textOffset - (data.RightElement and 40 or 0), 1, 0)
    text.Position = UDim2.new(0, textOffset, 0, 0)
    text.BackgroundTransparency = 1
    text.Text = data.Text or "List Item"
    text.TextColor3 = Color3.fromRGB(255, 255, 255)
    text.Font = Enum.Font.GothamMedium
    text.TextSize = 14
    text.TextXAlignment = Enum.TextXAlignment.Left
    text.Parent = item

    -- Hover effect
    local TweenService = game:GetService("TweenService")
    local tweenInfo = TweenInfo.new(0.15)

    local clickDetector = Instance.new("TextButton")
    clickDetector.Size = UDim2.new(1, 0, 1, 0)
    clickDetector.BackgroundTransparency = 1
    clickDetector.Text = ""
    clickDetector.Parent = item

    clickDetector.MouseEnter:Connect(function()
        TweenService:Create(item, tweenInfo, {
            BackgroundTransparency = 0
        }):Play()
    end)

    clickDetector.MouseLeave:Connect(function()
        TweenService:Create(item, tweenInfo, {
            BackgroundTransparency = 1
        }):Play()
    end)

    if data.OnClick then
        clickDetector.MouseButton1Click:Connect(function()
            data.OnClick(data)
        end)
    end

    table.insert(self.Items, { Frame = item, Data = data })
    return item
end

function SimpleList:Clear()
    for _, item in ipairs(self.Items) do
        item.Frame:Destroy()
    end
    self.Items = {}
end

return SimpleList
```

---

### 5.2 Infinite Scroll List

```lua
local InfiniteList = {}
InfiniteList.__index = InfiniteList

function InfiniteList.new(config)
    local self = setmetatable({}, InfiniteList)

    self.ItemHeight = config.ItemHeight or 48
    self.BufferSize = config.BufferSize or 5
    self.TotalItems = config.TotalItems or 0
    self.VisibleItems = {}
    self.DataProvider = config.DataProvider
    self.ItemRenderer = config.ItemRenderer
    self.IsLoading = false

    -- Container
    local container = Instance.new("ScrollingFrame")
    container.Name = config.Name or "InfiniteList"
    container.Size = config.Size or UDim2.new(0, 300, 0, 400)
    container.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
    container.BorderSizePixel = 0
    container.ScrollBarThickness = 4
    container.ScrollBarImageColor3 = Color3.fromRGB(71, 85, 105)
    container.CanvasSize = UDim2.new(0, 0, 0, self.TotalItems * self.ItemHeight)

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = container

    -- Loading indicator
    local loadingIndicator = Instance.new("Frame")
    loadingIndicator.Name = "LoadingIndicator"
    loadingIndicator.Size = UDim2.new(1, 0, 0, 48)
    loadingIndicator.Position = UDim2.new(0, 0, 1, 0)
    loadingIndicator.AnchorPoint = Vector2.new(0, 1)
    loadingIndicator.BackgroundTransparency = 1
    loadingIndicator.Visible = false
    loadingIndicator.Parent = container

    local spinner = Instance.new("ImageLabel")
    spinner.Size = UDim2.new(0, 24, 0, 24)
    spinner.Position = UDim2.new(0.5, 0, 0.5, 0)
    spinner.AnchorPoint = Vector2.new(0.5, 0.5)
    spinner.BackgroundTransparency = 1
    spinner.Image = "rbxassetid://6034973115"
    spinner.Parent = loadingIndicator

    -- Scroll handling
    container:GetPropertyChangedSignal("CanvasPosition"):Connect(function()
        self:OnScroll()
    end)

    self.Container = container
    self.LoadingIndicator = loadingIndicator

    -- Initial render
    self:Render()

    return self
end

function InfiniteList:OnScroll()
    local scrollPos = self.Container.CanvasPosition.Y
    local viewHeight = self.Container.AbsoluteSize.Y
    local canvasHeight = self.Container.CanvasSize.Y.Offset

    -- Check if near bottom
    if scrollPos + viewHeight >= canvasHeight - 100 and not self.IsLoading then
        self:LoadMore()
    end

    self:Render()
end

function InfiniteList:Render()
    local scrollPos = self.Container.CanvasPosition.Y
    local viewHeight = self.Container.AbsoluteSize.Y

    local startIndex = math.max(1, math.floor(scrollPos / self.ItemHeight) - self.BufferSize)
    local endIndex = math.min(self.TotalItems, math.ceil((scrollPos + viewHeight) / self.ItemHeight) + self.BufferSize)

    -- Remove items outside view
    for index, item in pairs(self.VisibleItems) do
        if index < startIndex or index > endIndex then
            item:Destroy()
            self.VisibleItems[index] = nil
        end
    end

    -- Add items in view
    for index = startIndex, endIndex do
        if not self.VisibleItems[index] then
            local data = self.DataProvider(index)
            if data then
                local item = self.ItemRenderer(data, index)
                item.Position = UDim2.new(0, 0, 0, (index - 1) * self.ItemHeight)
                item.Parent = self.Container
                self.VisibleItems[index] = item
            end
        end
    end
end

function InfiniteList:LoadMore()
    if self.IsLoading then return end
    self.IsLoading = true
    self.LoadingIndicator.Visible = true

    -- Simulate async loading
    task.spawn(function()
        task.wait(0.5)

        self.TotalItems = self.TotalItems + 20
        self.Container.CanvasSize = UDim2.new(0, 0, 0, self.TotalItems * self.ItemHeight)

        self.IsLoading = false
        self.LoadingIndicator.Visible = false
        self:Render()
    end)
end

function InfiniteList:Refresh()
    for _, item in pairs(self.VisibleItems) do
        item:Destroy()
    end
    self.VisibleItems = {}
    self.Container.CanvasPosition = Vector2.new(0, 0)
    self:Render()
end

return InfiniteList
```

---

## 6. Navigation

### 6.1 Tab Navigation

```lua
local TabNav = {}
TabNav.__index = TabNav

function TabNav.new(config)
    local self = setmetatable({}, TabNav)
    self.Tabs = config.Tabs or {}
    self.ActiveTab = config.DefaultTab or 1

    local TweenService = game:GetService("TweenService")

    -- Container
    local container = Instance.new("Frame")
    container.Name = "TabNavigation"
    container.Size = UDim2.new(1, 0, 0, 48)
    container.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
    container.BorderSizePixel = 0

    local layout = Instance.new("UIListLayout")
    layout.FillDirection = Enum.FillDirection.Horizontal
    layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
    layout.Padding = UDim.new(0, 4)
    layout.Parent = container

    local padding = Instance.new("UIPadding")
    padding.PaddingLeft = UDim.new(0, 16)
    padding.PaddingRight = UDim.new(0, 16)
    padding.Parent = container

    -- Indicator bar
    local indicator = Instance.new("Frame")
    indicator.Name = "Indicator"
    indicator.Size = UDim2.new(0, 0, 0, 3)
    indicator.Position = UDim2.new(0, 0, 1, -3)
    indicator.BackgroundColor3 = Color3.fromRGB(59, 130, 246)
    indicator.BorderSizePixel = 0
    indicator.ZIndex = 2
    indicator.Parent = container

    local indicatorCorner = Instance.new("UICorner")
    indicatorCorner.CornerRadius = UDim.new(1, 0)
    indicatorCorner.Parent = indicator

    self.TabButtons = {}

    -- Create tabs
    for i, tabData in ipairs(self.Tabs) do
        local tab = Instance.new("TextButton")
        tab.Name = "Tab_" .. tabData.Id
        tab.Size = UDim2.new(0, 0, 1, 0)
        tab.AutomaticSize = Enum.AutomaticSize.X
        tab.BackgroundTransparency = 1
        tab.Text = tabData.Label
        tab.TextColor3 = i == self.ActiveTab
            and Color3.fromRGB(255, 255, 255)
            or Color3.fromRGB(148, 163, 184)
        tab.Font = Enum.Font.GothamSemibold
        tab.TextSize = 14
        tab.LayoutOrder = i
        tab.Parent = container

        local tabPadding = Instance.new("UIPadding")
        tabPadding.PaddingLeft = UDim.new(0, 16)
        tabPadding.PaddingRight = UDim.new(0, 16)
        tabPadding.Parent = tab

        tab.MouseButton1Click:Connect(function()
            self:SetActiveTab(i)
        end)

        self.TabButtons[i] = tab
    end

    self.Container = container
    self.Indicator = indicator

    -- Initial indicator position
    task.defer(function()
        self:UpdateIndicator(false)
    end)

    return self
end

function TabNav:SetActiveTab(index)
    if index == self.ActiveTab then return end

    local TweenService = game:GetService("TweenService")
    local tweenInfo = TweenInfo.new(0.2)

    -- Update previous tab
    TweenService:Create(self.TabButtons[self.ActiveTab], tweenInfo, {
        TextColor3 = Color3.fromRGB(148, 163, 184)
    }):Play()

    -- Update new tab
    self.ActiveTab = index
    TweenService:Create(self.TabButtons[index], tweenInfo, {
        TextColor3 = Color3.fromRGB(255, 255, 255)
    }):Play()

    self:UpdateIndicator(true)

    -- Fire callback
    if self.Tabs[index].OnSelect then
        self.Tabs[index].OnSelect()
    end
end

function TabNav:UpdateIndicator(animate)
    local activeButton = self.TabButtons[self.ActiveTab]
    if not activeButton then return end

    local targetPos = UDim2.new(0, activeButton.AbsolutePosition.X - self.Container.AbsolutePosition.X, 1, -3)
    local targetSize = UDim2.new(0, activeButton.AbsoluteSize.X, 0, 3)

    if animate then
        local TweenService = game:GetService("TweenService")
        local tweenInfo = TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)

        TweenService:Create(self.Indicator, tweenInfo, {
            Position = targetPos,
            Size = targetSize
        }):Play()
    else
        self.Indicator.Position = targetPos
        self.Indicator.Size = targetSize
    end
end

return TabNav
```

---

### 6.2 Bottom Navigation

```lua
local BottomNav = {}
BottomNav.__index = BottomNav

function BottomNav.new(config)
    local self = setmetatable({}, BottomNav)
    self.Items = config.Items or {}
    self.ActiveIndex = config.Default or 1

    -- Container
    local container = Instance.new("Frame")
    container.Name = "BottomNavigation"
    container.Size = UDim2.new(1, 0, 0, 64)
    container.Position = UDim2.new(0, 0, 1, 0)
    container.AnchorPoint = Vector2.new(0, 1)
    container.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
    container.BorderSizePixel = 0

    -- Top border
    local topBorder = Instance.new("Frame")
    topBorder.Size = UDim2.new(1, 0, 0, 1)
    topBorder.BackgroundColor3 = Color3.fromRGB(51, 65, 85)
    topBorder.BorderSizePixel = 0
    topBorder.Parent = container

    local layout = Instance.new("UIListLayout")
    layout.FillDirection = Enum.FillDirection.Horizontal
    layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
    layout.VerticalAlignment = Enum.VerticalAlignment.Center
    layout.Parent = container

    self.NavItems = {}
    local TweenService = game:GetService("TweenService")

    for i, itemData in ipairs(self.Items) do
        local item = Instance.new("TextButton")
        item.Name = "NavItem_" .. i
        item.Size = UDim2.new(1 / #self.Items, 0, 1, 0)
        item.BackgroundTransparency = 1
        item.Text = ""
        item.LayoutOrder = i
        item.Parent = container

        -- Icon
        local icon = Instance.new("ImageLabel")
        icon.Name = "Icon"
        icon.Size = UDim2.new(0, 24, 0, 24)
        icon.Position = UDim2.new(0.5, 0, 0, 10)
        icon.AnchorPoint = Vector2.new(0.5, 0)
        icon.BackgroundTransparency = 1
        icon.Image = itemData.Icon
        icon.ImageColor3 = i == self.ActiveIndex
            and Color3.fromRGB(59, 130, 246)
            or Color3.fromRGB(148, 163, 184)
        icon.Parent = item

        -- Label
        local label = Instance.new("TextLabel")
        label.Name = "Label"
        label.Size = UDim2.new(1, 0, 0, 16)
        label.Position = UDim2.new(0, 0, 1, -18)
        label.BackgroundTransparency = 1
        label.Text = itemData.Label
        label.TextColor3 = i == self.ActiveIndex
            and Color3.fromRGB(59, 130, 246)
            or Color3.fromRGB(148, 163, 184)
        label.Font = Enum.Font.GothamMedium
        label.TextSize = 10
        label.Parent = item

        item.MouseButton1Click:Connect(function()
            self:SetActive(i)
        end)

        self.NavItems[i] = {
            Button = item,
            Icon = icon,
            Label = label,
            Data = itemData
        }
    end

    self.Container = container
    return self
end

function BottomNav:SetActive(index)
    if index == self.ActiveIndex then return end

    local TweenService = game:GetService("TweenService")
    local tweenInfo = TweenInfo.new(0.2)

    -- Deactivate previous
    local prev = self.NavItems[self.ActiveIndex]
    TweenService:Create(prev.Icon, tweenInfo, {
        ImageColor3 = Color3.fromRGB(148, 163, 184)
    }):Play()
    TweenService:Create(prev.Label, tweenInfo, {
        TextColor3 = Color3.fromRGB(148, 163, 184)
    }):Play()

    -- Activate new
    self.ActiveIndex = index
    local curr = self.NavItems[index]
    TweenService:Create(curr.Icon, tweenInfo, {
        ImageColor3 = Color3.fromRGB(59, 130, 246)
    }):Play()
    TweenService:Create(curr.Label, tweenInfo, {
        TextColor3 = Color3.fromRGB(59, 130, 246)
    }):Play()

    -- Scale animation
    TweenService:Create(curr.Icon, TweenInfo.new(0.1), {
        Size = UDim2.new(0, 28, 0, 28)
    }):Play()
    task.delay(0.1, function()
        TweenService:Create(curr.Icon, TweenInfo.new(0.1), {
            Size = UDim2.new(0, 24, 0, 24)
        }):Play()
    end)

    if curr.Data.OnSelect then
        curr.Data.OnSelect()
    end
end

return BottomNav
```

---

## 7. Feedback Components

### 7.1 Toast Notification

```lua
local Toast = {}

local ActiveToasts = {}
local ToastContainer = nil

function Toast.Show(config)
    local TweenService = game:GetService("TweenService")

    -- Create container if not exists
    if not ToastContainer then
        local playerGui = game.Players.LocalPlayer:WaitForChild("PlayerGui")

        ToastContainer = Instance.new("Frame")
        ToastContainer.Name = "ToastContainer"
        ToastContainer.Size = UDim2.new(1, 0, 1, 0)
        ToastContainer.BackgroundTransparency = 1
        ToastContainer.Parent = playerGui

        local layout = Instance.new("UIListLayout")
        layout.SortOrder = Enum.SortOrder.LayoutOrder
        layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
        layout.VerticalAlignment = Enum.VerticalAlignment.Bottom
        layout.Padding = UDim.new(0, 8)
        layout.Parent = ToastContainer

        local padding = Instance.new("UIPadding")
        padding.PaddingBottom = UDim.new(0, 100)
        padding.Parent = ToastContainer
    end

    -- Toast types
    local typeColors = {
        success = Color3.fromRGB(34, 197, 94),
        error = Color3.fromRGB(239, 68, 68),
        warning = Color3.fromRGB(234, 179, 8),
        info = Color3.fromRGB(59, 130, 246),
    }

    local typeIcons = {
        success = "rbxassetid://6031094667",
        error = "rbxassetid://6031094678",
        warning = "rbxassetid://6031094650",
        info = "rbxassetid://6031094643",
    }

    -- Create toast
    local toast = Instance.new("Frame")
    toast.Name = "Toast"
    toast.Size = UDim2.new(0, 0, 0, 48)
    toast.AutomaticSize = Enum.AutomaticSize.X
    toast.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
    toast.BorderSizePixel = 0
    toast.BackgroundTransparency = 1
    toast.LayoutOrder = -os.time()
    toast.Parent = ToastContainer

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 8)
    corner.Parent = toast

    local stroke = Instance.new("UIStroke")
    stroke.Color = typeColors[config.Type or "info"]
    stroke.Thickness = 2
    stroke.Parent = toast

    local toastPadding = Instance.new("UIPadding")
    toastPadding.PaddingLeft = UDim.new(0, 16)
    toastPadding.PaddingRight = UDim.new(0, 16)
    toastPadding.PaddingTop = UDim.new(0, 12)
    toastPadding.PaddingBottom = UDim.new(0, 12)
    toastPadding.Parent = toast

    local layout = Instance.new("UIListLayout")
    layout.FillDirection = Enum.FillDirection.Horizontal
    layout.VerticalAlignment = Enum.VerticalAlignment.Center
    layout.Padding = UDim.new(0, 12)
    layout.Parent = toast

    -- Icon
    local icon = Instance.new("ImageLabel")
    icon.Size = UDim2.new(0, 20, 0, 20)
    icon.BackgroundTransparency = 1
    icon.Image = typeIcons[config.Type or "info"]
    icon.ImageColor3 = typeColors[config.Type or "info"]
    icon.Parent = toast

    -- Message
    local message = Instance.new("TextLabel")
    message.Size = UDim2.new(0, 0, 0, 20)
    message.AutomaticSize = Enum.AutomaticSize.X
    message.BackgroundTransparency = 1
    message.Text = config.Message or "Notification"
    message.TextColor3 = Color3.fromRGB(255, 255, 255)
    message.Font = Enum.Font.GothamMedium
    message.TextSize = 14
    message.Parent = toast

    -- Animate in
    TweenService:Create(toast, TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
        BackgroundTransparency = 0
    }):Play()

    -- Auto dismiss
    local duration = config.Duration or 3
    task.delay(duration, function()
        local dismissTween = TweenService:Create(toast, TweenInfo.new(0.2), {
            BackgroundTransparency = 1,
            Size = UDim2.new(0, 0, 0, 0)
        })
        dismissTween:Play()
        dismissTween.Completed:Connect(function()
            toast:Destroy()
        end)
    end)

    return toast
end

return Toast
```

---

### 7.2 Progress Indicator

```lua
local Progress = {}
Progress.__index = Progress

function Progress.new(config)
    local self = setmetatable({}, Progress)
    self.Value = config.Value or 0
    self.Max = config.Max or 100

    -- Container
    local container = Instance.new("Frame")
    container.Name = config.Name or "Progress"
    container.Size = config.Size or UDim2.new(0, 200, 0, 8)
    container.BackgroundColor3 = Color3.fromRGB(51, 65, 85)
    container.BorderSizePixel = 0

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(1, 0)
    corner.Parent = container

    -- Fill bar
    local fill = Instance.new("Frame")
    fill.Name = "Fill"
    fill.Size = UDim2.new(self.Value / self.Max, 0, 1, 0)
    fill.BackgroundColor3 = config.Color or Color3.fromRGB(59, 130, 246)
    fill.BorderSizePixel = 0
    fill.Parent = container

    local fillCorner = Instance.new("UICorner")
    fillCorner.CornerRadius = UDim.new(1, 0)
    fillCorner.Parent = fill

    -- Animated shine effect (optional)
    if config.Animated then
        local shine = Instance.new("Frame")
        shine.Name = "Shine"
        shine.Size = UDim2.new(0.3, 0, 1, 0)
        shine.BackgroundTransparency = 0.5
        shine.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
        shine.BorderSizePixel = 0
        shine.ClipsDescendants = true
        shine.Parent = fill

        local shineCorner = Instance.new("UICorner")
        shineCorner.CornerRadius = UDim.new(1, 0)
        shineCorner.Parent = shine

        local gradient = Instance.new("UIGradient")
        gradient.Transparency = NumberSequence.new({
            NumberSequenceKeypoint.new(0, 1),
            NumberSequenceKeypoint.new(0.5, 0.5),
            NumberSequenceKeypoint.new(1, 1),
        })
        gradient.Parent = shine

        -- Animate shine
        local TweenService = game:GetService("TweenService")
        local function animateShine()
            shine.Position = UDim2.new(-0.3, 0, 0, 0)
            local shineTween = TweenService:Create(shine, TweenInfo.new(1.5, Enum.EasingStyle.Linear), {
                Position = UDim2.new(1, 0, 0, 0)
            })
            shineTween:Play()
            shineTween.Completed:Connect(function()
                task.wait(0.5)
                animateShine()
            end)
        end
        animateShine()
    end

    self.Container = container
    self.Fill = fill

    return self
end

function Progress:SetValue(value, animate)
    self.Value = math.clamp(value, 0, self.Max)
    local percentage = self.Value / self.Max

    if animate then
        local TweenService = game:GetService("TweenService")
        TweenService:Create(self.Fill, TweenInfo.new(0.3), {
            Size = UDim2.new(percentage, 0, 1, 0)
        }):Play()
    else
        self.Fill.Size = UDim2.new(percentage, 0, 1, 0)
    end
end

function Progress:GetPercentage()
    return (self.Value / self.Max) * 100
end

return Progress
```

---

## 8. Data Display

### 8.1 Stat Display

```lua
local StatDisplay = {}

function StatDisplay.new(config)
    local container = Instance.new("Frame")
    container.Name = config.Name or "StatDisplay"
    container.Size = config.Size or UDim2.new(0, 120, 0, 80)
    container.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
    container.BorderSizePixel = 0

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = container

    local padding = Instance.new("UIPadding")
    padding.PaddingLeft = UDim.new(0, 16)
    padding.PaddingRight = UDim.new(0, 16)
    padding.PaddingTop = UDim.new(0, 12)
    padding.PaddingBottom = UDim.new(0, 12)
    padding.Parent = container

    local layout = Instance.new("UIListLayout")
    layout.SortOrder = Enum.SortOrder.LayoutOrder
    layout.Padding = UDim.new(0, 4)
    layout.Parent = container

    -- Label
    local label = Instance.new("TextLabel")
    label.Name = "Label"
    label.Size = UDim2.new(1, 0, 0, 16)
    label.BackgroundTransparency = 1
    label.Text = config.Label or "Stat"
    label.TextColor3 = Color3.fromRGB(148, 163, 184)
    label.Font = Enum.Font.GothamMedium
    label.TextSize = 12
    label.TextXAlignment = Enum.TextXAlignment.Left
    label.LayoutOrder = 1
    label.Parent = container

    -- Value
    local value = Instance.new("TextLabel")
    value.Name = "Value"
    value.Size = UDim2.new(1, 0, 0, 28)
    value.BackgroundTransparency = 1
    value.Text = config.Value and tostring(config.Value) or "0"
    value.TextColor3 = Color3.fromRGB(255, 255, 255)
    value.Font = Enum.Font.GothamBold
    value.TextSize = 24
    value.TextXAlignment = Enum.TextXAlignment.Left
    value.LayoutOrder = 2
    value.Parent = container

    -- Trend (optional)
    if config.Trend then
        local trendFrame = Instance.new("Frame")
        trendFrame.Size = UDim2.new(1, 0, 0, 16)
        trendFrame.BackgroundTransparency = 1
        trendFrame.LayoutOrder = 3
        trendFrame.Parent = container

        local trendLayout = Instance.new("UIListLayout")
        trendLayout.FillDirection = Enum.FillDirection.Horizontal
        trendLayout.Padding = UDim.new(0, 4)
        trendLayout.Parent = trendFrame

        local trendIcon = Instance.new("ImageLabel")
        trendIcon.Size = UDim2.new(0, 12, 0, 12)
        trendIcon.BackgroundTransparency = 1
        trendIcon.Image = config.Trend > 0
            and "rbxassetid://6034818375"
            or "rbxassetid://6034818383"
        trendIcon.ImageColor3 = config.Trend > 0
            and Color3.fromRGB(34, 197, 94)
            or Color3.fromRGB(239, 68, 68)
        trendIcon.Parent = trendFrame

        local trendValue = Instance.new("TextLabel")
        trendValue.Size = UDim2.new(0, 0, 0, 16)
        trendValue.AutomaticSize = Enum.AutomaticSize.X
        trendValue.BackgroundTransparency = 1
        trendValue.Text = math.abs(config.Trend) .. "%"
        trendValue.TextColor3 = config.Trend > 0
            and Color3.fromRGB(34, 197, 94)
            or Color3.fromRGB(239, 68, 68)
        trendValue.Font = Enum.Font.GothamMedium
        trendValue.TextSize = 12
        trendValue.Parent = trendFrame
    end

    return {
        Container = container,
        SetValue = function(self, newValue)
            value.Text = tostring(newValue)
        end
    }
end

return StatDisplay
```

---

## Usage Guidelines Summary

### Component Selection Guide

| Use Case | Component |
|----------|-----------|
| Primary action | Primary Button |
| Secondary action | Secondary Button |
| Compact action | Icon Button |
| Navigation link | Text Button |
| Display info | Info Card |
| Shop items | Item Card |
| Detailed preview | Preview Card |
| Confirmation | Dialog Modal |
| Settings panel | Drawer |
| Full experiences | Fullscreen Modal |
| Form input | Text Input |
| Range selection | Slider |
| On/Off settings | Toggle |
| Simple data | Simple List |
| Large datasets | Infinite List |
| Section switching | Tab Navigation |
| Main navigation | Bottom Navigation |
| Notifications | Toast |
| Loading state | Progress |
| Stats/metrics | Stat Display |

### Best Practices

1. **Consistency**: Use the same component for similar actions across your game
2. **Feedback**: Always provide visual feedback for interactive elements
3. **Touch targets**: Minimum 44x44 pixels for mobile
4. **Animation**: Keep animations under 300ms for responsiveness
5. **Accessibility**: Ensure sufficient color contrast (4.5:1 minimum)
6. **Performance**: Batch UI updates, use object pooling for lists
7. **Testing**: Test on multiple device sizes and input methods

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-28 | Initial component library |
