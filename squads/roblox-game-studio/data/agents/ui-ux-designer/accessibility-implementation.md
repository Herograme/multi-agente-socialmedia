---
title: "Accessibility Implementation Guide for Roblox"
agent: "ui-ux-designer"
alias: "Pixel"
category: "accessibility"
version: "1.0.0"
lastUpdated: "2025-01-28"
description: "Comprehensive guide for implementing accessible UI in Roblox experiences"
tags: ["accessibility", "a11y", "screen-reader", "keyboard", "colorblind", "inclusive"]
---

# Accessibility Implementation Guide for Roblox

## Overview

Accessibility ensures that all players, regardless of ability, can enjoy your Roblox experience. This guide covers screen reader support, keyboard navigation, focus management, color contrast, colorblind modes, subtitles, scalable UI, and reduced motion options.

## 1. Screen Reader Support in Roblox

### 1.1 Understanding Roblox Accessibility Features

Roblox has built-in accessibility support through the `SelectionGroup` and `AutomaticSize` properties, along with screen reader integration via the operating system.

### 1.2 Accessible Labels and Descriptions

```lua
local AccessibilityLabels = {}

-- Set accessible name for UI elements
function AccessibilityLabels.SetAccessibleName(element, name, description)
    -- Primary accessible name
    element.Name = name

    -- Store description as attribute for screen readers
    element:SetAttribute("AccessibleDescription", description or "")

    -- For buttons with icons only, set the Text property
    if element:IsA("TextButton") or element:IsA("TextLabel") then
        if element.Text == "" then
            -- Hidden text for screen readers
            element.Text = name
            element.TextTransparency = 1
        end
    end
end

-- Create accessible text alternative for icons
function AccessibilityLabels.CreateIconWithLabel(parent, config)
    local container = Instance.new("Frame")
    container.Name = config.Name or "AccessibleIcon"
    container.Size = config.Size or UDim2.new(0, 32, 0, 32)
    container.BackgroundTransparency = 1
    container.Parent = parent

    -- Visual icon
    local icon = Instance.new("ImageLabel")
    icon.Name = "Icon"
    icon.Size = UDim2.new(1, 0, 1, 0)
    icon.BackgroundTransparency = 1
    icon.Image = config.Image
    icon.ImageColor3 = config.Color or Color3.fromRGB(255, 255, 255)
    icon.Parent = container

    -- Screen reader text (visually hidden)
    local srText = Instance.new("TextLabel")
    srText.Name = "ScreenReaderText"
    srText.Size = UDim2.new(0, 1, 0, 1)
    srText.Position = UDim2.new(0, -9999, 0, 0)
    srText.BackgroundTransparency = 1
    srText.Text = config.AccessibleName
    srText.TextTransparency = 1
    srText.Parent = container

    container:SetAttribute("AccessibleName", config.AccessibleName)
    container:SetAttribute("AccessibleDescription", config.Description or "")

    return container
end

-- Announce to screen reader (via text display)
function AccessibilityLabels.Announce(message, priority)
    priority = priority or "polite" -- "polite" or "assertive"

    -- Create announcement container if not exists
    local player = game.Players.LocalPlayer
    local playerGui = player:WaitForChild("PlayerGui")

    local announcer = playerGui:FindFirstChild("ScreenReaderAnnouncer")
    if not announcer then
        announcer = Instance.new("ScreenGui")
        announcer.Name = "ScreenReaderAnnouncer"
        announcer.DisplayOrder = -1
        announcer.Parent = playerGui

        local announceLabel = Instance.new("TextLabel")
        announceLabel.Name = "Announcement"
        announceLabel.Size = UDim2.new(0, 1, 0, 1)
        announceLabel.Position = UDim2.new(0, -9999, 0, 0)
        announceLabel.BackgroundTransparency = 1
        announceLabel.TextTransparency = 1
        announceLabel.Parent = announcer
    end

    local label = announcer:FindFirstChild("Announcement")
    label.Text = message

    -- Clear after announcement
    task.delay(0.5, function()
        if label.Text == message then
            label.Text = ""
        end
    end)
end

return AccessibilityLabels
```

### 1.3 Live Regions for Dynamic Content

```lua
local LiveRegions = {}

local regions = {}

-- Create a live region for dynamic updates
function LiveRegions.Create(name, parent, ariaLive)
    ariaLive = ariaLive or "polite" -- "polite", "assertive", or "off"

    local region = Instance.new("Frame")
    region.Name = name
    region.BackgroundTransparency = 1
    region.Size = UDim2.new(1, 0, 0, 0)
    region.AutomaticSize = Enum.AutomaticSize.Y
    region.Parent = parent

    region:SetAttribute("AriaLive", ariaLive)
    region:SetAttribute("AriaAtomic", true)

    local label = Instance.new("TextLabel")
    label.Name = "Content"
    label.Size = UDim2.new(1, 0, 0, 0)
    label.AutomaticSize = Enum.AutomaticSize.Y
    label.BackgroundTransparency = 1
    label.Text = ""
    label.TextWrapped = true
    label.Parent = region

    regions[name] = {
        Region = region,
        Label = label,
        History = {},
    }

    return region
end

-- Update live region content
function LiveRegions.Update(name, content)
    local regionData = regions[name]
    if not regionData then return end

    regionData.Label.Text = content
    table.insert(regionData.History, {
        Content = content,
        Timestamp = tick(),
    })

    -- Trigger screen reader announcement
    if regionData.Region:GetAttribute("AriaLive") == "assertive" then
        -- Immediate announcement
        AccessibilityLabels.Announce(content, "assertive")
    end
end

-- Clear live region
function LiveRegions.Clear(name)
    local regionData = regions[name]
    if regionData then
        regionData.Label.Text = ""
    end
end

return LiveRegions
```

---

## 2. Keyboard Navigation Implementation

### 2.1 Focus Management System

```lua
local FocusManager = {}
FocusManager.__index = FocusManager

local GuiService = game:GetService("GuiService")
local UserInputService = game:GetService("UserInputService")

function FocusManager.new()
    local self = setmetatable({}, FocusManager)

    self.FocusableElements = {}
    self.CurrentFocusIndex = 0
    self.FocusGroups = {}
    self.CurrentGroup = nil
    self.FocusRing = nil

    self:CreateFocusRing()
    self:SetupKeyboardInput()

    return self
end

function FocusManager:CreateFocusRing()
    local playerGui = game.Players.LocalPlayer:WaitForChild("PlayerGui")

    local focusGui = Instance.new("ScreenGui")
    focusGui.Name = "FocusIndicator"
    focusGui.DisplayOrder = 1000
    focusGui.IgnoreGuiInset = true
    focusGui.Parent = playerGui

    local ring = Instance.new("Frame")
    ring.Name = "FocusRing"
    ring.BackgroundTransparency = 1
    ring.BorderSizePixel = 0
    ring.Visible = false
    ring.ZIndex = 100
    ring.Parent = focusGui

    local stroke = Instance.new("UIStroke")
    stroke.Color = Color3.fromRGB(59, 130, 246)
    stroke.Thickness = 3
    stroke.Parent = ring

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 8)
    corner.Parent = ring

    self.FocusRing = ring
    self.FocusGui = focusGui
end

function FocusManager:RegisterElement(element, group, order)
    group = group or "default"
    order = order or #self.FocusableElements + 1

    if not self.FocusGroups[group] then
        self.FocusGroups[group] = {}
    end

    local focusData = {
        Element = element,
        Group = group,
        Order = order,
        OnFocus = nil,
        OnBlur = nil,
        OnActivate = nil,
    }

    table.insert(self.FocusGroups[group], focusData)
    table.insert(self.FocusableElements, focusData)

    -- Sort by order
    table.sort(self.FocusGroups[group], function(a, b)
        return a.Order < b.Order
    end)

    -- Make element focusable
    element.Selectable = true

    return focusData
end

function FocusManager:SetupKeyboardInput()
    UserInputService.InputBegan:Connect(function(input, processed)
        if processed then return end

        if input.KeyCode == Enum.KeyCode.Tab then
            if UserInputService:IsKeyDown(Enum.KeyCode.LeftShift)
                or UserInputService:IsKeyDown(Enum.KeyCode.RightShift) then
                self:FocusPrevious()
            else
                self:FocusNext()
            end
        elseif input.KeyCode == Enum.KeyCode.Return
            or input.KeyCode == Enum.KeyCode.Space then
            self:ActivateFocused()
        elseif input.KeyCode == Enum.KeyCode.Escape then
            self:ClearFocus()
        elseif input.KeyCode == Enum.KeyCode.Up then
            self:FocusPrevious()
        elseif input.KeyCode == Enum.KeyCode.Down then
            self:FocusNext()
        elseif input.KeyCode == Enum.KeyCode.Left then
            self:FocusPreviousInGroup()
        elseif input.KeyCode == Enum.KeyCode.Right then
            self:FocusNextInGroup()
        end
    end)
end

function FocusManager:SetFocus(element)
    local focusData = nil

    for _, data in ipairs(self.FocusableElements) do
        if data.Element == element then
            focusData = data
            break
        end
    end

    if not focusData then return end

    -- Blur previous
    if self.CurrentFocusIndex > 0 then
        local prevData = self.FocusableElements[self.CurrentFocusIndex]
        if prevData and prevData.OnBlur then
            prevData.OnBlur()
        end
    end

    -- Update focus
    self.CurrentFocusIndex = table.find(self.FocusableElements, focusData) or 0
    self.CurrentGroup = focusData.Group

    -- Show focus ring
    self:UpdateFocusRing(element)

    -- Fire focus callback
    if focusData.OnFocus then
        focusData.OnFocus()
    end

    -- Set GUI selection
    GuiService.SelectedObject = element
end

function FocusManager:UpdateFocusRing(element)
    if not element then
        self.FocusRing.Visible = false
        return
    end

    local absPos = element.AbsolutePosition
    local absSize = element.AbsoluteSize

    self.FocusRing.Position = UDim2.new(0, absPos.X - 4, 0, absPos.Y - 4)
    self.FocusRing.Size = UDim2.new(0, absSize.X + 8, 0, absSize.Y + 8)
    self.FocusRing.Visible = true

    -- Match corner radius if element has one
    local elementCorner = element:FindFirstChildOfClass("UICorner")
    local ringCorner = self.FocusRing:FindFirstChildOfClass("UICorner")
    if elementCorner and ringCorner then
        ringCorner.CornerRadius = elementCorner.CornerRadius + UDim.new(0, 4)
    end
end

function FocusManager:FocusNext()
    if #self.FocusableElements == 0 then return end

    local nextIndex = self.CurrentFocusIndex + 1
    if nextIndex > #self.FocusableElements then
        nextIndex = 1
    end

    local nextData = self.FocusableElements[nextIndex]
    if nextData then
        self:SetFocus(nextData.Element)
    end
end

function FocusManager:FocusPrevious()
    if #self.FocusableElements == 0 then return end

    local prevIndex = self.CurrentFocusIndex - 1
    if prevIndex < 1 then
        prevIndex = #self.FocusableElements
    end

    local prevData = self.FocusableElements[prevIndex]
    if prevData then
        self:SetFocus(prevData.Element)
    end
end

function FocusManager:FocusNextInGroup()
    if not self.CurrentGroup then return end

    local group = self.FocusGroups[self.CurrentGroup]
    if not group or #group == 0 then return end

    local currentInGroup = 0
    local currentData = self.FocusableElements[self.CurrentFocusIndex]

    for i, data in ipairs(group) do
        if data == currentData then
            currentInGroup = i
            break
        end
    end

    local nextInGroup = currentInGroup + 1
    if nextInGroup > #group then
        nextInGroup = 1
    end

    self:SetFocus(group[nextInGroup].Element)
end

function FocusManager:FocusPreviousInGroup()
    if not self.CurrentGroup then return end

    local group = self.FocusGroups[self.CurrentGroup]
    if not group or #group == 0 then return end

    local currentInGroup = 0
    local currentData = self.FocusableElements[self.CurrentFocusIndex]

    for i, data in ipairs(group) do
        if data == currentData then
            currentInGroup = i
            break
        end
    end

    local prevInGroup = currentInGroup - 1
    if prevInGroup < 1 then
        prevInGroup = #group
    end

    self:SetFocus(group[prevInGroup].Element)
end

function FocusManager:ActivateFocused()
    if self.CurrentFocusIndex == 0 then return end

    local focusData = self.FocusableElements[self.CurrentFocusIndex]
    if not focusData then return end

    local element = focusData.Element

    -- Trigger click event
    if element:IsA("TextButton") or element:IsA("ImageButton") then
        -- Simulate click
        if focusData.OnActivate then
            focusData.OnActivate()
        end

        -- Fire button events
        if element.MouseButton1Click then
            element.MouseButton1Click:Fire()
        end
    end
end

function FocusManager:ClearFocus()
    if self.CurrentFocusIndex > 0 then
        local prevData = self.FocusableElements[self.CurrentFocusIndex]
        if prevData and prevData.OnBlur then
            prevData.OnBlur()
        end
    end

    self.CurrentFocusIndex = 0
    self.FocusRing.Visible = false
    GuiService.SelectedObject = nil
end

function FocusManager:SetGroup(groupName)
    self.CurrentGroup = groupName

    local group = self.FocusGroups[groupName]
    if group and #group > 0 then
        self:SetFocus(group[1].Element)
    end
end

return FocusManager
```

### 2.2 Focus Trap for Modals

```lua
local FocusTrap = {}
FocusTrap.__index = FocusTrap

function FocusTrap.new(container, focusManager)
    local self = setmetatable({}, FocusTrap)

    self.Container = container
    self.FocusManager = focusManager
    self.TrapActive = false
    self.PreviousFocus = nil
    self.TrapElements = {}

    return self
end

function FocusTrap:Activate()
    if self.TrapActive then return end

    -- Store current focus
    self.PreviousFocus = self.FocusManager.CurrentFocusIndex

    -- Find all focusable elements in container
    self.TrapElements = {}

    local function findFocusable(parent)
        for _, child in ipairs(parent:GetChildren()) do
            if child:IsA("GuiObject") and child.Selectable then
                table.insert(self.TrapElements, child)
            end
            if child:IsA("GuiObject") then
                findFocusable(child)
            end
        end
    end

    findFocusable(self.Container)

    -- Focus first element
    if #self.TrapElements > 0 then
        self.FocusManager:SetFocus(self.TrapElements[1])
    end

    self.TrapActive = true

    -- Override focus navigation
    self.NavigationOverride = function()
        local currentElement = self.FocusManager.FocusableElements[self.FocusManager.CurrentFocusIndex]
        if currentElement then
            local inTrap = table.find(self.TrapElements, currentElement.Element)
            if not inTrap then
                -- Redirect focus back to trap
                self.FocusManager:SetFocus(self.TrapElements[1])
            end
        end
    end
end

function FocusTrap:Deactivate()
    if not self.TrapActive then return end

    self.TrapActive = false

    -- Restore previous focus
    if self.PreviousFocus and self.PreviousFocus > 0 then
        local prevData = self.FocusManager.FocusableElements[self.PreviousFocus]
        if prevData then
            self.FocusManager:SetFocus(prevData.Element)
        end
    end

    self.TrapElements = {}
end

return FocusTrap
```

---

## 3. Color Contrast Tools

### 3.1 Contrast Checker

```lua
local ContrastChecker = {}

-- Calculate relative luminance
function ContrastChecker.GetLuminance(color)
    local function adjust(component)
        local c = component / 255
        if c <= 0.03928 then
            return c / 12.92
        else
            return math.pow((c + 0.055) / 1.055, 2.4)
        end
    end

    local r = adjust(color.R * 255)
    local g = adjust(color.G * 255)
    local b = adjust(color.B * 255)

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
end

-- Calculate contrast ratio
function ContrastChecker.GetContrastRatio(color1, color2)
    local lum1 = ContrastChecker.GetLuminance(color1)
    local lum2 = ContrastChecker.GetLuminance(color2)

    local lighter = math.max(lum1, lum2)
    local darker = math.min(lum1, lum2)

    return (lighter + 0.05) / (darker + 0.05)
end

-- Check WCAG compliance
function ContrastChecker.CheckCompliance(color1, color2)
    local ratio = ContrastChecker.GetContrastRatio(color1, color2)

    return {
        Ratio = ratio,
        AA_Normal = ratio >= 4.5,      -- Normal text AA
        AA_Large = ratio >= 3.0,       -- Large text AA
        AAA_Normal = ratio >= 7.0,     -- Normal text AAA
        AAA_Large = ratio >= 4.5,      -- Large text AAA
    }
end

-- Suggest accessible color adjustment
function ContrastChecker.SuggestAccessibleColor(foreground, background, targetRatio)
    targetRatio = targetRatio or 4.5

    local currentRatio = ContrastChecker.GetContrastRatio(foreground, background)

    if currentRatio >= targetRatio then
        return foreground
    end

    local bgLuminance = ContrastChecker.GetLuminance(background)
    local isDarkBg = bgLuminance < 0.5

    -- Try to lighten or darken the foreground
    local h, s, v = Color3.toHSV(foreground)

    local step = 0.05
    local attempts = 0
    local maxAttempts = 20

    while attempts < maxAttempts do
        if isDarkBg then
            v = math.min(1, v + step) -- Lighten for dark backgrounds
        else
            v = math.max(0, v - step) -- Darken for light backgrounds
        end

        local newColor = Color3.fromHSV(h, s, v)
        local newRatio = ContrastChecker.GetContrastRatio(newColor, background)

        if newRatio >= targetRatio then
            return newColor
        end

        attempts = attempts + 1
    end

    -- Fallback to black or white
    return isDarkBg and Color3.fromRGB(255, 255, 255) or Color3.fromRGB(0, 0, 0)
end

-- Accessible color palette generator
function ContrastChecker.GenerateAccessiblePalette(backgroundColor)
    local palette = {}

    -- High contrast text
    local textColor = ContrastChecker.SuggestAccessibleColor(
        Color3.fromRGB(255, 255, 255),
        backgroundColor,
        7.0
    )
    palette.Text = textColor

    -- Secondary text (AA compliant)
    palette.TextSecondary = ContrastChecker.SuggestAccessibleColor(
        Color3.fromRGB(150, 150, 150),
        backgroundColor,
        4.5
    )

    -- Link color
    palette.Link = ContrastChecker.SuggestAccessibleColor(
        Color3.fromRGB(59, 130, 246),
        backgroundColor,
        4.5
    )

    -- Success color
    palette.Success = ContrastChecker.SuggestAccessibleColor(
        Color3.fromRGB(34, 197, 94),
        backgroundColor,
        4.5
    )

    -- Error color
    palette.Error = ContrastChecker.SuggestAccessibleColor(
        Color3.fromRGB(239, 68, 68),
        backgroundColor,
        4.5
    )

    -- Warning color
    palette.Warning = ContrastChecker.SuggestAccessibleColor(
        Color3.fromRGB(234, 179, 8),
        backgroundColor,
        4.5
    )

    return palette
end

return ContrastChecker
```

### 3.2 High Contrast Mode

```lua
local HighContrastMode = {}
HighContrastMode.__index = HighContrastMode

local HighContrastPalette = {
    Background = Color3.fromRGB(0, 0, 0),
    Foreground = Color3.fromRGB(255, 255, 255),
    Primary = Color3.fromRGB(0, 255, 255),
    Secondary = Color3.fromRGB(255, 255, 0),
    Error = Color3.fromRGB(255, 0, 0),
    Success = Color3.fromRGB(0, 255, 0),
    Border = Color3.fromRGB(255, 255, 255),
}

function HighContrastMode.new()
    local self = setmetatable({}, HighContrastMode)

    self.Enabled = false
    self.OriginalStyles = {}
    self.StyledElements = {}

    return self
end

function HighContrastMode:Enable()
    if self.Enabled then return end
    self.Enabled = true

    -- Find all UI elements
    local playerGui = game.Players.LocalPlayer:WaitForChild("PlayerGui")

    local function styleElement(element)
        if not element:IsA("GuiObject") then return end

        -- Store original style
        self.OriginalStyles[element] = {
            BackgroundColor3 = element.BackgroundColor3,
            BackgroundTransparency = element.BackgroundTransparency,
        }

        if element:IsA("TextLabel") or element:IsA("TextButton") or element:IsA("TextBox") then
            self.OriginalStyles[element].TextColor3 = element.TextColor3
        end

        if element:IsA("ImageLabel") or element:IsA("ImageButton") then
            self.OriginalStyles[element].ImageColor3 = element.ImageColor3
        end

        -- Apply high contrast
        if element.BackgroundTransparency < 0.9 then
            element.BackgroundColor3 = HighContrastPalette.Background
        end

        if element:IsA("TextLabel") or element:IsA("TextButton") or element:IsA("TextBox") then
            element.TextColor3 = HighContrastPalette.Foreground
        end

        if element:IsA("ImageLabel") or element:IsA("ImageButton") then
            element.ImageColor3 = HighContrastPalette.Foreground
        end

        -- Add border for visibility
        local stroke = element:FindFirstChildOfClass("UIStroke")
        if not stroke then
            stroke = Instance.new("UIStroke")
            stroke.Name = "HighContrastBorder"
            stroke.Color = HighContrastPalette.Border
            stroke.Thickness = 2
            stroke.Parent = element
        else
            self.OriginalStyles[element].StrokeColor = stroke.Color
            self.OriginalStyles[element].StrokeThickness = stroke.Thickness
            stroke.Color = HighContrastPalette.Border
            stroke.Thickness = 2
        end

        table.insert(self.StyledElements, element)
    end

    local function traverseGui(parent)
        for _, child in ipairs(parent:GetChildren()) do
            styleElement(child)
            traverseGui(child)
        end
    end

    for _, screenGui in ipairs(playerGui:GetChildren()) do
        if screenGui:IsA("ScreenGui") then
            traverseGui(screenGui)
        end
    end
end

function HighContrastMode:Disable()
    if not self.Enabled then return end
    self.Enabled = false

    for element, originalStyle in pairs(self.OriginalStyles) do
        if element and element.Parent then
            element.BackgroundColor3 = originalStyle.BackgroundColor3
            element.BackgroundTransparency = originalStyle.BackgroundTransparency

            if originalStyle.TextColor3 then
                element.TextColor3 = originalStyle.TextColor3
            end

            if originalStyle.ImageColor3 then
                element.ImageColor3 = originalStyle.ImageColor3
            end

            -- Remove added borders
            local stroke = element:FindFirstChild("HighContrastBorder")
            if stroke then
                stroke:Destroy()
            elseif originalStyle.StrokeColor then
                local existingStroke = element:FindFirstChildOfClass("UIStroke")
                if existingStroke then
                    existingStroke.Color = originalStyle.StrokeColor
                    existingStroke.Thickness = originalStyle.StrokeThickness
                end
            end
        end
    end

    self.OriginalStyles = {}
    self.StyledElements = {}
end

function HighContrastMode:Toggle()
    if self.Enabled then
        self:Disable()
    else
        self:Enable()
    end
end

return HighContrastMode
```

---

## 4. Colorblind Mode Implementation

### 4.1 Colorblind Simulation and Correction

```lua
local ColorblindMode = {}
ColorblindMode.__index = ColorblindMode

-- Colorblind simulation matrices
local ColorblindMatrices = {
    -- Protanopia (red-blind)
    Protanopia = {
        { 0.567, 0.433, 0.000 },
        { 0.558, 0.442, 0.000 },
        { 0.000, 0.242, 0.758 },
    },

    -- Deuteranopia (green-blind)
    Deuteranopia = {
        { 0.625, 0.375, 0.000 },
        { 0.700, 0.300, 0.000 },
        { 0.000, 0.300, 0.700 },
    },

    -- Tritanopia (blue-blind)
    Tritanopia = {
        { 0.950, 0.050, 0.000 },
        { 0.000, 0.433, 0.567 },
        { 0.000, 0.475, 0.525 },
    },

    -- Achromatopsia (complete color blindness)
    Achromatopsia = {
        { 0.299, 0.587, 0.114 },
        { 0.299, 0.587, 0.114 },
        { 0.299, 0.587, 0.114 },
    },
}

-- Daltonization correction matrices
local CorrectionMatrices = {
    Protanopia = {
        { 0.0, 2.02344, -2.52581 },
        { 0.0, 1.0, 0.0 },
        { 0.0, 0.0, 1.0 },
    },
    Deuteranopia = {
        { 1.0, 0.0, 0.0 },
        { 0.494207, 0.0, 1.24827 },
        { 0.0, 0.0, 1.0 },
    },
    Tritanopia = {
        { 1.0, 0.0, 0.0 },
        { 0.0, 1.0, 0.0 },
        { -0.395913, 0.801109, 0.0 },
    },
}

function ColorblindMode.new()
    local self = setmetatable({}, ColorblindMode)

    self.Mode = "None" -- None, Protanopia, Deuteranopia, Tritanopia
    self.CorrectionEnabled = false
    self.OriginalColors = {}

    return self
end

-- Apply matrix transformation to color
function ColorblindMode:ApplyMatrix(color, matrix)
    local r = color.R
    local g = color.G
    local b = color.B

    local newR = matrix[1][1] * r + matrix[1][2] * g + matrix[1][3] * b
    local newG = matrix[2][1] * r + matrix[2][2] * g + matrix[2][3] * b
    local newB = matrix[3][1] * r + matrix[3][2] * g + matrix[3][3] * b

    return Color3.new(
        math.clamp(newR, 0, 1),
        math.clamp(newG, 0, 1),
        math.clamp(newB, 0, 1)
    )
end

-- Simulate colorblind vision
function ColorblindMode:SimulateColor(color, type)
    local matrix = ColorblindMatrices[type]
    if not matrix then return color end

    return self:ApplyMatrix(color, matrix)
end

-- Apply daltonization correction
function ColorblindMode:CorrectColor(color, type)
    local simMatrix = ColorblindMatrices[type]
    local corrMatrix = CorrectionMatrices[type]

    if not simMatrix or not corrMatrix then return color end

    local simulated = self:ApplyMatrix(color, simMatrix)
    local error = Color3.new(
        color.R - simulated.R,
        color.G - simulated.G,
        color.B - simulated.B
    )

    local corrected = self:ApplyMatrix(error, corrMatrix)

    return Color3.new(
        math.clamp(color.R + corrected.R, 0, 1),
        math.clamp(color.G + corrected.G, 0, 1),
        math.clamp(color.B + corrected.B, 0, 1)
    )
end

function ColorblindMode:SetMode(mode)
    self.Mode = mode

    if mode == "None" then
        self:RestoreColors()
    else
        self:ApplyMode()
    end
end

function ColorblindMode:ApplyMode()
    local playerGui = game.Players.LocalPlayer:WaitForChild("PlayerGui")

    local function processElement(element)
        if not element:IsA("GuiObject") then return end

        -- Store original color
        if not self.OriginalColors[element] then
            self.OriginalColors[element] = {
                BackgroundColor3 = element.BackgroundColor3,
            }

            if element:IsA("TextLabel") or element:IsA("TextButton") then
                self.OriginalColors[element].TextColor3 = element.TextColor3
            end

            if element:IsA("ImageLabel") or element:IsA("ImageButton") then
                self.OriginalColors[element].ImageColor3 = element.ImageColor3
            end
        end

        local original = self.OriginalColors[element]

        -- Apply correction or simulation
        if self.CorrectionEnabled then
            element.BackgroundColor3 = self:CorrectColor(original.BackgroundColor3, self.Mode)

            if original.TextColor3 then
                element.TextColor3 = self:CorrectColor(original.TextColor3, self.Mode)
            end

            if original.ImageColor3 then
                element.ImageColor3 = self:CorrectColor(original.ImageColor3, self.Mode)
            end
        end
    end

    local function traverse(parent)
        for _, child in ipairs(parent:GetChildren()) do
            processElement(child)
            traverse(child)
        end
    end

    for _, screenGui in ipairs(playerGui:GetChildren()) do
        if screenGui:IsA("ScreenGui") then
            traverse(screenGui)
        end
    end
end

function ColorblindMode:RestoreColors()
    for element, colors in pairs(self.OriginalColors) do
        if element and element.Parent then
            element.BackgroundColor3 = colors.BackgroundColor3

            if colors.TextColor3 then
                element.TextColor3 = colors.TextColor3
            end

            if colors.ImageColor3 then
                element.ImageColor3 = colors.ImageColor3
            end
        end
    end

    self.OriginalColors = {}
end

function ColorblindMode:EnableCorrection(enabled)
    self.CorrectionEnabled = enabled

    if self.Mode ~= "None" then
        self:ApplyMode()
    end
end

return ColorblindMode
```

### 4.2 Colorblind-Friendly Color Palette

```lua
local ColorblindPalette = {}

-- Colors that work well for all colorblind types
ColorblindPalette.Safe = {
    -- Blues are generally safe
    Blue = Color3.fromRGB(0, 114, 178),
    LightBlue = Color3.fromRGB(86, 180, 233),

    -- Orange instead of red
    Orange = Color3.fromRGB(230, 159, 0),

    -- Yellow
    Yellow = Color3.fromRGB(240, 228, 66),

    -- Blue-green (cyan)
    Cyan = Color3.fromRGB(0, 158, 115),

    -- Vermilion (works better than pure red)
    Vermilion = Color3.fromRGB(213, 94, 0),

    -- Reddish purple
    ReddishPurple = Color3.fromRGB(204, 121, 167),

    -- Neutral grays
    DarkGray = Color3.fromRGB(50, 50, 50),
    MediumGray = Color3.fromRGB(128, 128, 128),
    LightGray = Color3.fromRGB(200, 200, 200),

    -- Black and white
    Black = Color3.fromRGB(0, 0, 0),
    White = Color3.fromRGB(255, 255, 255),
}

-- Semantic colors for colorblind-friendly design
ColorblindPalette.Semantic = {
    Success = ColorblindPalette.Safe.Cyan,       -- Instead of green
    Error = ColorblindPalette.Safe.Vermilion,    -- Instead of red
    Warning = ColorblindPalette.Safe.Orange,     -- Orange is visible
    Info = ColorblindPalette.Safe.Blue,          -- Blue is safe
    Primary = ColorblindPalette.Safe.Blue,
    Secondary = ColorblindPalette.Safe.LightBlue,
}

-- Pattern overlays for color + pattern distinction
function ColorblindPalette.AddPatternDistinction(frame, patternType)
    local pattern = Instance.new("ImageLabel")
    pattern.Name = "PatternOverlay"
    pattern.Size = UDim2.new(1, 0, 1, 0)
    pattern.BackgroundTransparency = 1
    pattern.ImageTransparency = 0.8
    pattern.ZIndex = frame.ZIndex + 1
    pattern.Parent = frame

    local patterns = {
        Diagonal = "rbxassetid://0", -- diagonal stripes
        Dots = "rbxassetid://0",     -- dot pattern
        Horizontal = "rbxassetid://0", -- horizontal lines
        Vertical = "rbxassetid://0",   -- vertical lines
        Cross = "rbxassetid://0",      -- cross hatch
    }

    pattern.Image = patterns[patternType] or ""
    return pattern
end

-- Shape + color combination for status indicators
function ColorblindPalette.CreateStatusIndicator(status, parent)
    local indicators = {
        Success = {
            Color = ColorblindPalette.Semantic.Success,
            Shape = "Circle",
            Icon = "rbxassetid://6031094667", -- checkmark
        },
        Error = {
            Color = ColorblindPalette.Semantic.Error,
            Shape = "Triangle",
            Icon = "rbxassetid://6031094678", -- X
        },
        Warning = {
            Color = ColorblindPalette.Semantic.Warning,
            Shape = "Diamond",
            Icon = "rbxassetid://6031094650", -- exclamation
        },
        Info = {
            Color = ColorblindPalette.Semantic.Info,
            Shape = "Square",
            Icon = "rbxassetid://6031094643", -- info i
        },
    }

    local config = indicators[status]
    if not config then return nil end

    local indicator = Instance.new("Frame")
    indicator.Name = status .. "Indicator"
    indicator.Size = UDim2.new(0, 24, 0, 24)
    indicator.BackgroundColor3 = config.Color
    indicator.Parent = parent

    -- Shape
    if config.Shape == "Circle" then
        local corner = Instance.new("UICorner")
        corner.CornerRadius = UDim.new(1, 0)
        corner.Parent = indicator
    elseif config.Shape == "Diamond" then
        indicator.Rotation = 45
    end
    -- Square and Triangle handled differently

    -- Icon for additional clarity
    local icon = Instance.new("ImageLabel")
    icon.Size = UDim2.new(0.7, 0, 0.7, 0)
    icon.Position = UDim2.new(0.5, 0, 0.5, 0)
    icon.AnchorPoint = Vector2.new(0.5, 0.5)
    icon.BackgroundTransparency = 1
    icon.Image = config.Icon
    icon.ImageColor3 = Color3.fromRGB(255, 255, 255)
    icon.Rotation = config.Shape == "Diamond" and -45 or 0
    icon.Parent = indicator

    return indicator
end

return ColorblindPalette
```

---

## 5. Subtitle and Caption Systems

### 5.1 Subtitle System

```lua
local SubtitleSystem = {}
SubtitleSystem.__index = SubtitleSystem

function SubtitleSystem.new(config)
    local self = setmetatable({}, SubtitleSystem)

    self.Config = config or {}
    self.Config.FontSize = self.Config.FontSize or 18
    self.Config.BackgroundOpacity = self.Config.BackgroundOpacity or 0.7
    self.Config.Position = self.Config.Position or "Bottom"
    self.Config.MaxLines = self.Config.MaxLines or 3

    self.SubtitleQueue = {}
    self.ActiveSubtitles = {}

    self:CreateUI()

    return self
end

function SubtitleSystem:CreateUI()
    local playerGui = game.Players.LocalPlayer:WaitForChild("PlayerGui")

    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "SubtitleSystem"
    screenGui.DisplayOrder = 50
    screenGui.Parent = playerGui

    local container = Instance.new("Frame")
    container.Name = "SubtitleContainer"
    container.Size = UDim2.new(0.8, 0, 0, 150)
    container.BackgroundTransparency = 1
    container.Parent = screenGui

    -- Position based on config
    if self.Config.Position == "Bottom" then
        container.Position = UDim2.new(0.5, 0, 1, -50)
        container.AnchorPoint = Vector2.new(0.5, 1)
    elseif self.Config.Position == "Top" then
        container.Position = UDim2.new(0.5, 0, 0, 50)
        container.AnchorPoint = Vector2.new(0.5, 0)
    end

    local layout = Instance.new("UIListLayout")
    layout.SortOrder = Enum.SortOrder.LayoutOrder
    layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
    layout.VerticalAlignment = self.Config.Position == "Bottom"
        and Enum.VerticalAlignment.Bottom
        or Enum.VerticalAlignment.Top
    layout.Padding = UDim.new(0, 4)
    layout.Parent = container

    self.ScreenGui = screenGui
    self.Container = container
end

function SubtitleSystem:Show(text, config)
    config = config or {}
    local duration = config.Duration or 3
    local speaker = config.Speaker
    local color = config.Color or Color3.fromRGB(255, 255, 255)

    -- Create subtitle frame
    local subtitleFrame = Instance.new("Frame")
    subtitleFrame.Name = "Subtitle"
    subtitleFrame.Size = UDim2.new(0, 0, 0, 0)
    subtitleFrame.AutomaticSize = Enum.AutomaticSize.XY
    subtitleFrame.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    subtitleFrame.BackgroundTransparency = 1 - self.Config.BackgroundOpacity
    subtitleFrame.LayoutOrder = tick()
    subtitleFrame.Parent = self.Container

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 6)
    corner.Parent = subtitleFrame

    local padding = Instance.new("UIPadding")
    padding.PaddingLeft = UDim.new(0, 16)
    padding.PaddingRight = UDim.new(0, 16)
    padding.PaddingTop = UDim.new(0, 8)
    padding.PaddingBottom = UDim.new(0, 8)
    padding.Parent = subtitleFrame

    -- Speaker name (if provided)
    local displayText = text
    if speaker then
        displayText = string.format("[%s]: %s", speaker, text)
    end

    local textLabel = Instance.new("TextLabel")
    textLabel.Name = "Text"
    textLabel.Size = UDim2.new(0, 0, 0, 0)
    textLabel.AutomaticSize = Enum.AutomaticSize.XY
    textLabel.BackgroundTransparency = 1
    textLabel.Text = displayText
    textLabel.TextColor3 = color
    textLabel.Font = Enum.Font.GothamBold
    textLabel.TextSize = self.Config.FontSize
    textLabel.TextWrapped = true
    textLabel.Parent = subtitleFrame

    -- Animate in
    subtitleFrame.BackgroundTransparency = 1
    textLabel.TextTransparency = 1

    local TweenService = game:GetService("TweenService")
    TweenService:Create(subtitleFrame, TweenInfo.new(0.2), {
        BackgroundTransparency = 1 - self.Config.BackgroundOpacity
    }):Play()
    TweenService:Create(textLabel, TweenInfo.new(0.2), {
        TextTransparency = 0
    }):Play()

    -- Track active subtitle
    table.insert(self.ActiveSubtitles, subtitleFrame)

    -- Remove after duration
    task.delay(duration, function()
        self:HideSubtitle(subtitleFrame)
    end)

    -- Limit active subtitles
    while #self.ActiveSubtitles > self.Config.MaxLines do
        local oldest = table.remove(self.ActiveSubtitles, 1)
        self:HideSubtitle(oldest)
    end

    return subtitleFrame
end

function SubtitleSystem:HideSubtitle(subtitleFrame)
    if not subtitleFrame or not subtitleFrame.Parent then return end

    local TweenService = game:GetService("TweenService")
    local textLabel = subtitleFrame:FindFirstChild("Text")

    local fadeOut = TweenService:Create(subtitleFrame, TweenInfo.new(0.2), {
        BackgroundTransparency = 1
    })
    if textLabel then
        TweenService:Create(textLabel, TweenInfo.new(0.2), {
            TextTransparency = 1
        }):Play()
    end

    fadeOut:Play()
    fadeOut.Completed:Connect(function()
        subtitleFrame:Destroy()
    end)

    -- Remove from active list
    local index = table.find(self.ActiveSubtitles, subtitleFrame)
    if index then
        table.remove(self.ActiveSubtitles, index)
    end
end

function SubtitleSystem:SetFontSize(size)
    self.Config.FontSize = size

    for _, subtitle in ipairs(self.ActiveSubtitles) do
        local textLabel = subtitle:FindFirstChild("Text")
        if textLabel then
            textLabel.TextSize = size
        end
    end
end

function SubtitleSystem:SetBackgroundOpacity(opacity)
    self.Config.BackgroundOpacity = opacity

    for _, subtitle in ipairs(self.ActiveSubtitles) do
        subtitle.BackgroundTransparency = 1 - opacity
    end
end

return SubtitleSystem
```

### 5.2 Sound Caption System

```lua
local SoundCaptions = {}
SoundCaptions.__index = SoundCaptions

-- Sound effect descriptions
local SoundDescriptions = {
    Explosion = "[Explosion]",
    Gunshot = "[Gunshot]",
    Footsteps = "[Footsteps]",
    Door = "[Door opening]",
    Alarm = "[Alarm sounding]",
    Music = "[Music playing]",
    Ambient = "[Ambient sounds]",
}

function SoundCaptions.new()
    local self = setmetatable({}, SoundCaptions)

    self.Enabled = false
    self.CaptionContainer = nil

    self:CreateUI()

    return self
end

function SoundCaptions:CreateUI()
    local playerGui = game.Players.LocalPlayer:WaitForChild("PlayerGui")

    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "SoundCaptions"
    screenGui.DisplayOrder = 51
    screenGui.Parent = playerGui

    local container = Instance.new("Frame")
    container.Name = "CaptionContainer"
    container.Size = UDim2.new(0.3, 0, 0, 200)
    container.Position = UDim2.new(1, -20, 1, -200)
    container.AnchorPoint = Vector2.new(1, 1)
    container.BackgroundTransparency = 1
    container.Visible = false
    container.Parent = screenGui

    local layout = Instance.new("UIListLayout")
    layout.SortOrder = Enum.SortOrder.LayoutOrder
    layout.VerticalAlignment = Enum.VerticalAlignment.Bottom
    layout.Padding = UDim.new(0, 4)
    layout.Parent = container

    self.ScreenGui = screenGui
    self.CaptionContainer = container
end

function SoundCaptions:Enable()
    self.Enabled = true
    self.CaptionContainer.Visible = true
end

function SoundCaptions:Disable()
    self.Enabled = false
    self.CaptionContainer.Visible = false
end

function SoundCaptions:ShowCaption(soundType, duration, direction)
    if not self.Enabled then return end

    duration = duration or 2
    local description = SoundDescriptions[soundType] or "[" .. soundType .. "]"

    -- Add direction indicator if provided
    if direction then
        local directionArrow = {
            Left = "<< ",
            Right = " >>",
            Above = "^^ ",
            Below = "vv ",
        }
        description = (directionArrow[direction] or "") .. description
    end

    local caption = Instance.new("Frame")
    caption.Name = "Caption"
    caption.Size = UDim2.new(1, 0, 0, 0)
    caption.AutomaticSize = Enum.AutomaticSize.Y
    caption.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    caption.BackgroundTransparency = 0.3
    caption.LayoutOrder = tick()
    caption.Parent = self.CaptionContainer

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 4)
    corner.Parent = caption

    local padding = Instance.new("UIPadding")
    padding.PaddingLeft = UDim.new(0, 8)
    padding.PaddingRight = UDim.new(0, 8)
    padding.PaddingTop = UDim.new(0, 4)
    padding.PaddingBottom = UDim.new(0, 4)
    padding.Parent = caption

    local text = Instance.new("TextLabel")
    text.Size = UDim2.new(1, 0, 0, 0)
    text.AutomaticSize = Enum.AutomaticSize.Y
    text.BackgroundTransparency = 1
    text.Text = description
    text.TextColor3 = Color3.fromRGB(255, 255, 255)
    text.Font = Enum.Font.GothamMedium
    text.TextSize = 14
    text.TextXAlignment = Enum.TextXAlignment.Right
    text.Parent = caption

    -- Fade out after duration
    task.delay(duration, function()
        local TweenService = game:GetService("TweenService")
        local fadeOut = TweenService:Create(caption, TweenInfo.new(0.3), {
            BackgroundTransparency = 1
        })
        TweenService:Create(text, TweenInfo.new(0.3), {
            TextTransparency = 1
        }):Play()

        fadeOut:Play()
        fadeOut.Completed:Connect(function()
            caption:Destroy()
        end)
    end)
end

-- Register sound for captioning
function SoundCaptions:RegisterSound(sound, soundType)
    if sound:IsA("Sound") then
        sound.Played:Connect(function()
            self:ShowCaption(soundType)
        end)
    end
end

return SoundCaptions
```

---

## 6. Scalable UI Implementation

### 6.1 UI Scale Manager

```lua
local UIScaleManager = {}
UIScaleManager.__index = UIScaleManager

local DEFAULT_SCALE = 1.0
local MIN_SCALE = 0.75
local MAX_SCALE = 2.0
local SCALE_STEP = 0.25

function UIScaleManager.new()
    local self = setmetatable({}, UIScaleManager)

    self.Scale = DEFAULT_SCALE
    self.ScaledContainers = {}
    self.OnScaleChanged = Instance.new("BindableEvent")

    self:LoadSavedScale()

    return self
end

function UIScaleManager:LoadSavedScale()
    local player = game.Players.LocalPlayer
    local savedScale = player:GetAttribute("UIScale")

    if savedScale then
        self.Scale = math.clamp(savedScale, MIN_SCALE, MAX_SCALE)
    end
end

function UIScaleManager:SaveScale()
    local player = game.Players.LocalPlayer
    player:SetAttribute("UIScale", self.Scale)
end

function UIScaleManager:RegisterContainer(container)
    -- Add UIScale if not exists
    local uiScale = container:FindFirstChild("UIScale")
    if not uiScale then
        uiScale = Instance.new("UIScale")
        uiScale.Name = "UIScale"
        uiScale.Parent = container
    end

    uiScale.Scale = self.Scale
    self.ScaledContainers[container] = uiScale

    -- Auto-unregister when destroyed
    container.Destroying:Connect(function()
        self.ScaledContainers[container] = nil
    end)
end

function UIScaleManager:SetScale(scale)
    self.Scale = math.clamp(scale, MIN_SCALE, MAX_SCALE)

    for _, uiScale in pairs(self.ScaledContainers) do
        if uiScale and uiScale.Parent then
            local TweenService = game:GetService("TweenService")
            TweenService:Create(uiScale, TweenInfo.new(0.2), {
                Scale = self.Scale
            }):Play()
        end
    end

    self:SaveScale()
    self.OnScaleChanged:Fire(self.Scale)
end

function UIScaleManager:IncreaseScale()
    self:SetScale(self.Scale + SCALE_STEP)
end

function UIScaleManager:DecreaseScale()
    self:SetScale(self.Scale - SCALE_STEP)
end

function UIScaleManager:ResetScale()
    self:SetScale(DEFAULT_SCALE)
end

function UIScaleManager:GetScale()
    return self.Scale
end

-- Create scale adjustment UI
function UIScaleManager:CreateScaleControl(parent)
    local container = Instance.new("Frame")
    container.Name = "ScaleControl"
    container.Size = UDim2.new(0, 200, 0, 40)
    container.BackgroundColor3 = Color3.fromRGB(30, 41, 59)
    container.Parent = parent

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 8)
    corner.Parent = container

    local layout = Instance.new("UIListLayout")
    layout.FillDirection = Enum.FillDirection.Horizontal
    layout.VerticalAlignment = Enum.VerticalAlignment.Center
    layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
    layout.Padding = UDim.new(0, 12)
    layout.Parent = container

    -- Decrease button
    local decreaseBtn = Instance.new("TextButton")
    decreaseBtn.Size = UDim2.new(0, 40, 0, 40)
    decreaseBtn.BackgroundTransparency = 1
    decreaseBtn.Text = "-"
    decreaseBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    decreaseBtn.Font = Enum.Font.GothamBold
    decreaseBtn.TextSize = 24
    decreaseBtn.Parent = container

    decreaseBtn.MouseButton1Click:Connect(function()
        self:DecreaseScale()
    end)

    -- Scale display
    local scaleDisplay = Instance.new("TextLabel")
    scaleDisplay.Size = UDim2.new(0, 60, 0, 30)
    scaleDisplay.BackgroundTransparency = 1
    scaleDisplay.Text = string.format("%.0f%%", self.Scale * 100)
    scaleDisplay.TextColor3 = Color3.fromRGB(255, 255, 255)
    scaleDisplay.Font = Enum.Font.GothamBold
    scaleDisplay.TextSize = 16
    scaleDisplay.Parent = container

    -- Increase button
    local increaseBtn = Instance.new("TextButton")
    increaseBtn.Size = UDim2.new(0, 40, 0, 40)
    increaseBtn.BackgroundTransparency = 1
    increaseBtn.Text = "+"
    increaseBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    increaseBtn.Font = Enum.Font.GothamBold
    increaseBtn.TextSize = 24
    increaseBtn.Parent = container

    increaseBtn.MouseButton1Click:Connect(function()
        self:IncreaseScale()
    end)

    -- Update display when scale changes
    self.OnScaleChanged.Event:Connect(function(newScale)
        scaleDisplay.Text = string.format("%.0f%%", newScale * 100)
    end)

    return container
end

return UIScaleManager
```

---

## 7. Reduced Motion Mode

### 7.1 Motion Preferences Manager

```lua
local ReducedMotion = {}
ReducedMotion.__index = ReducedMotion

function ReducedMotion.new()
    local self = setmetatable({}, ReducedMotion)

    self.Enabled = false
    self.OnPreferenceChanged = Instance.new("BindableEvent")

    self:LoadPreference()

    return self
end

function ReducedMotion:LoadPreference()
    local player = game.Players.LocalPlayer
    local savedPref = player:GetAttribute("ReducedMotion")

    if savedPref ~= nil then
        self.Enabled = savedPref
    end
end

function ReducedMotion:SavePreference()
    local player = game.Players.LocalPlayer
    player:SetAttribute("ReducedMotion", self.Enabled)
end

function ReducedMotion:SetEnabled(enabled)
    self.Enabled = enabled
    self:SavePreference()
    self.OnPreferenceChanged:Fire(enabled)
end

function ReducedMotion:Toggle()
    self:SetEnabled(not self.Enabled)
end

function ReducedMotion:IsEnabled()
    return self.Enabled
end

-- Helper function to create motion-safe animations
function ReducedMotion:CreateTween(element, tweenInfo, properties)
    local TweenService = game:GetService("TweenService")

    if self.Enabled then
        -- Instant change for reduced motion
        for property, value in pairs(properties) do
            element[property] = value
        end
        return nil
    else
        return TweenService:Create(element, tweenInfo, properties)
    end
end

-- Animate with fallback
function ReducedMotion:Animate(element, properties, duration, easing)
    duration = duration or 0.25
    easing = easing or Enum.EasingStyle.Quad

    if self.Enabled then
        -- Apply changes instantly
        for property, value in pairs(properties) do
            element[property] = value
        end
    else
        local TweenService = game:GetService("TweenService")
        local tweenInfo = TweenInfo.new(duration, easing, Enum.EasingDirection.Out)
        local tween = TweenService:Create(element, tweenInfo, properties)
        tween:Play()
        return tween
    end
end

-- Fade animation (always subtle, even with reduced motion)
function ReducedMotion:Fade(element, targetTransparency, duration)
    if self.Enabled then
        -- Quick fade even in reduced motion
        local TweenService = game:GetService("TweenService")
        local tween = TweenService:Create(element, TweenInfo.new(0.1), {
            BackgroundTransparency = targetTransparency
        })
        tween:Play()
        return tween
    else
        return self:Animate(element, { BackgroundTransparency = targetTransparency }, duration)
    end
end

-- Check if animation should run
function ReducedMotion:ShouldAnimate()
    return not self.Enabled
end

return ReducedMotion
```

---

## 8. Testing Accessibility

### 8.1 Accessibility Audit Tool

```lua
local AccessibilityAudit = {}

function AccessibilityAudit.Run(container)
    local issues = {}
    local warnings = {}
    local ContrastChecker = require(path.to.ContrastChecker)

    local function auditElement(element, depth)
        depth = depth or 0
        local prefix = string.rep("  ", depth)

        -- Check text contrast
        if element:IsA("TextLabel") or element:IsA("TextButton") then
            local textColor = element.TextColor3
            local bgColor = element.BackgroundColor3

            if element.BackgroundTransparency < 0.5 then
                local compliance = ContrastChecker.CheckCompliance(textColor, bgColor)

                if not compliance.AA_Normal then
                    table.insert(issues, {
                        Type = "ContrastError",
                        Element = element:GetFullName(),
                        Message = string.format(
                            "Text contrast ratio %.2f:1 fails WCAG AA (needs 4.5:1)",
                            compliance.Ratio
                        ),
                        Severity = "Error",
                    })
                elseif not compliance.AAA_Normal then
                    table.insert(warnings, {
                        Type = "ContrastWarning",
                        Element = element:GetFullName(),
                        Message = string.format(
                            "Text contrast ratio %.2f:1 passes AA but fails AAA",
                            compliance.Ratio
                        ),
                        Severity = "Warning",
                    })
                end
            end

            -- Check text size
            if element.TextSize < 12 then
                table.insert(warnings, {
                    Type = "TextSize",
                    Element = element:GetFullName(),
                    Message = "Text size " .. element.TextSize .. "px may be too small",
                    Severity = "Warning",
                })
            end
        end

        -- Check button touch target
        if element:IsA("TextButton") or element:IsA("ImageButton") then
            local absSize = element.AbsoluteSize
            if absSize.X < 44 or absSize.Y < 44 then
                table.insert(warnings, {
                    Type = "TouchTarget",
                    Element = element:GetFullName(),
                    Message = string.format(
                        "Button size %.0fx%.0f is smaller than recommended 44x44",
                        absSize.X, absSize.Y
                    ),
                    Severity = "Warning",
                })
            end

            -- Check if selectable for keyboard
            if not element.Selectable then
                table.insert(issues, {
                    Type = "KeyboardAccess",
                    Element = element:GetFullName(),
                    Message = "Button is not keyboard accessible (Selectable = false)",
                    Severity = "Error",
                })
            end
        end

        -- Check accessible name
        if element:IsA("GuiButton") then
            local hasText = element:IsA("TextButton") and element.Text ~= ""
            local hasAccessibleName = element:GetAttribute("AccessibleName") ~= nil

            if not hasText and not hasAccessibleName then
                table.insert(issues, {
                    Type = "AccessibleName",
                    Element = element:GetFullName(),
                    Message = "Button has no accessible name (empty text and no AccessibleName attribute)",
                    Severity = "Error",
                })
            end
        end

        -- Check image alt text
        if element:IsA("ImageLabel") or element:IsA("ImageButton") then
            if not element:GetAttribute("AccessibleName") and not element:GetAttribute("AccessibleDescription") then
                table.insert(warnings, {
                    Type = "ImageAlt",
                    Element = element:GetFullName(),
                    Message = "Image missing accessible name/description",
                    Severity = "Warning",
                })
            end
        end

        -- Recurse
        for _, child in ipairs(element:GetChildren()) do
            if child:IsA("GuiObject") then
                auditElement(child, depth + 1)
            end
        end
    end

    auditElement(container)

    return {
        Issues = issues,
        Warnings = warnings,
        Summary = {
            TotalIssues = #issues,
            TotalWarnings = #warnings,
            Passed = #issues == 0,
        }
    }
end

function AccessibilityAudit.PrintReport(results)
    print("=== Accessibility Audit Report ===")
    print("")

    if #results.Issues > 0 then
        print("ERRORS (" .. #results.Issues .. "):")
        for _, issue in ipairs(results.Issues) do
            print("  [" .. issue.Type .. "] " .. issue.Element)
            print("    " .. issue.Message)
        end
        print("")
    end

    if #results.Warnings > 0 then
        print("WARNINGS (" .. #results.Warnings .. "):")
        for _, warning in ipairs(results.Warnings) do
            print("  [" .. warning.Type .. "] " .. warning.Element)
            print("    " .. warning.Message)
        end
        print("")
    end

    print("=== Summary ===")
    print("Issues: " .. results.Summary.TotalIssues)
    print("Warnings: " .. results.Summary.TotalWarnings)
    print("Status: " .. (results.Summary.Passed and "PASSED" or "FAILED"))
end

return AccessibilityAudit
```

---

## Summary

Implementing accessibility in Roblox requires attention to:

1. **Screen Reader Support**: Provide accessible names, descriptions, and live regions
2. **Keyboard Navigation**: Implement focus management and keyboard controls
3. **Color Contrast**: Ensure text meets WCAG guidelines
4. **Colorblind Support**: Use safe color palettes and add non-color indicators
5. **Subtitles/Captions**: Provide text alternatives for audio content
6. **Scalable UI**: Allow users to adjust UI size
7. **Reduced Motion**: Respect motion preferences
8. **Testing**: Regularly audit for accessibility issues

Following these guidelines ensures your Roblox experience is enjoyable for all players, regardless of their abilities.
