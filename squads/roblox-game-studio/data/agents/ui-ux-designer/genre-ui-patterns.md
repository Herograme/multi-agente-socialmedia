---
title: "Genre-Specific UI Patterns for Roblox"
agent: "ui-ux-designer"
alias: "Pixel"
category: "genre-patterns"
version: "1.0.0"
lastUpdated: "2025-01-28"
description: "UI patterns and best practices for specific Roblox game genres"
tags: ["genre", "simulator", "tycoon", "horror", "rpg", "fps", "social"]
---

# Genre-Specific UI Patterns for Roblox

## Overview

Different game genres have established UI conventions that players expect. This guide covers optimal UI patterns for the most popular Roblox genres: Simulators, Tycoons, Horror, RPGs, FPS, and Social games.

## 1. Simulator UI Patterns

Simulators focus on progression, collection, and incremental upgrades. Players spend significant time in menus managing resources.

### 1.1 Core UI Elements

**Essential Components**:
- Main resource display (always visible)
- Inventory system with sorting/filtering
- Stats and multiplier displays
- Upgrade/shop interface
- Collection/pet display
- Rebirth/prestige interface

### 1.2 Inventory System

```lua
local SimulatorInventory = {}
SimulatorInventory.__index = SimulatorInventory

function SimulatorInventory.new(config)
    local self = setmetatable({}, SimulatorInventory)

    self.Config = config or {}
    self.Items = {}
    self.SortMode = "Rarity" -- Rarity, Recent, Value, Name
    self.FilterMode = "All"

    self:CreateUI()

    return self
end

function SimulatorInventory:CreateUI()
    local playerGui = game.Players.LocalPlayer:WaitForChild("PlayerGui")

    -- Main container
    local screen = Instance.new("ScreenGui")
    screen.Name = "SimulatorInventory"
    screen.Parent = playerGui

    local main = Instance.new("Frame")
    main.Name = "MainInventory"
    main.Size = UDim2.new(0.7, 0, 0.8, 0)
    main.Position = UDim2.new(0.5, 0, 0.5, 0)
    main.AnchorPoint = Vector2.new(0.5, 0.5)
    main.BackgroundColor3 = Color3.fromRGB(25, 25, 35)
    main.Visible = false
    main.Parent = screen

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 16)
    corner.Parent = main

    -- Header
    local header = Instance.new("Frame")
    header.Name = "Header"
    header.Size = UDim2.new(1, 0, 0, 60)
    header.BackgroundColor3 = Color3.fromRGB(35, 35, 50)
    header.BorderSizePixel = 0
    header.Parent = main

    local headerCorner = Instance.new("UICorner")
    headerCorner.CornerRadius = UDim.new(0, 16)
    headerCorner.Parent = header

    -- Fix bottom corners of header
    local headerFix = Instance.new("Frame")
    headerFix.Size = UDim2.new(1, 0, 0, 16)
    headerFix.Position = UDim2.new(0, 0, 1, -16)
    headerFix.BackgroundColor3 = header.BackgroundColor3
    headerFix.BorderSizePixel = 0
    headerFix.Parent = header

    -- Title
    local title = Instance.new("TextLabel")
    title.Name = "Title"
    title.Size = UDim2.new(0, 200, 1, 0)
    title.Position = UDim2.new(0, 20, 0, 0)
    title.BackgroundTransparency = 1
    title.Text = "INVENTORY"
    title.TextColor3 = Color3.fromRGB(255, 255, 255)
    title.Font = Enum.Font.GothamBlack
    title.TextSize = 24
    title.TextXAlignment = Enum.TextXAlignment.Left
    title.Parent = header

    -- Capacity display
    local capacity = Instance.new("TextLabel")
    capacity.Name = "Capacity"
    capacity.Size = UDim2.new(0, 150, 0, 30)
    capacity.Position = UDim2.new(1, -170, 0.5, 0)
    capacity.AnchorPoint = Vector2.new(0, 0.5)
    capacity.BackgroundColor3 = Color3.fromRGB(50, 50, 70)
    capacity.Text = "128/200"
    capacity.TextColor3 = Color3.fromRGB(200, 200, 200)
    capacity.Font = Enum.Font.GothamBold
    capacity.TextSize = 14
    capacity.Parent = header

    local capacityCorner = Instance.new("UICorner")
    capacityCorner.CornerRadius = UDim.new(0, 6)
    capacityCorner.Parent = capacity

    -- Filter/Sort bar
    local filterBar = Instance.new("Frame")
    filterBar.Name = "FilterBar"
    filterBar.Size = UDim2.new(1, -40, 0, 40)
    filterBar.Position = UDim2.new(0, 20, 0, 70)
    filterBar.BackgroundTransparency = 1
    filterBar.Parent = main

    local filterLayout = Instance.new("UIListLayout")
    filterLayout.FillDirection = Enum.FillDirection.Horizontal
    filterLayout.Padding = UDim.new(0, 8)
    filterLayout.Parent = filterBar

    -- Rarity filters
    local rarities = {"All", "Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"}
    local rarityColors = {
        All = Color3.fromRGB(100, 100, 100),
        Common = Color3.fromRGB(180, 180, 180),
        Uncommon = Color3.fromRGB(100, 200, 100),
        Rare = Color3.fromRGB(100, 150, 255),
        Epic = Color3.fromRGB(180, 100, 255),
        Legendary = Color3.fromRGB(255, 200, 50),
        Mythic = Color3.fromRGB(255, 100, 150),
    }

    for _, rarity in ipairs(rarities) do
        local filterBtn = Instance.new("TextButton")
        filterBtn.Name = rarity .. "Filter"
        filterBtn.Size = UDim2.new(0, 0, 1, 0)
        filterBtn.AutomaticSize = Enum.AutomaticSize.X
        filterBtn.BackgroundColor3 = rarityColors[rarity]
        filterBtn.BackgroundTransparency = rarity == "All" and 0 or 0.7
        filterBtn.Text = rarity
        filterBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
        filterBtn.Font = Enum.Font.GothamSemibold
        filterBtn.TextSize = 12
        filterBtn.Parent = filterBar

        local btnCorner = Instance.new("UICorner")
        btnCorner.CornerRadius = UDim.new(0, 6)
        btnCorner.Parent = filterBtn

        local btnPadding = Instance.new("UIPadding")
        btnPadding.PaddingLeft = UDim.new(0, 12)
        btnPadding.PaddingRight = UDim.new(0, 12)
        btnPadding.Parent = filterBtn
    end

    -- Item grid
    local itemGrid = Instance.new("ScrollingFrame")
    itemGrid.Name = "ItemGrid"
    itemGrid.Size = UDim2.new(1, -40, 1, -140)
    itemGrid.Position = UDim2.new(0, 20, 0, 120)
    itemGrid.BackgroundTransparency = 1
    itemGrid.ScrollBarThickness = 6
    itemGrid.ScrollBarImageColor3 = Color3.fromRGB(100, 100, 100)
    itemGrid.CanvasSize = UDim2.new(0, 0, 0, 0)
    itemGrid.AutomaticCanvasSize = Enum.AutomaticSize.Y
    itemGrid.Parent = main

    local gridLayout = Instance.new("UIGridLayout")
    gridLayout.CellSize = UDim2.new(0, 100, 0, 120)
    gridLayout.CellPadding = UDim2.new(0, 10, 0, 10)
    gridLayout.SortOrder = Enum.SortOrder.LayoutOrder
    gridLayout.Parent = itemGrid

    self.Screen = screen
    self.Main = main
    self.ItemGrid = itemGrid
    self.CapacityLabel = capacity
end

function SimulatorInventory:CreateItemCard(item)
    local card = Instance.new("Frame")
    card.Name = item.Id
    card.BackgroundColor3 = Color3.fromRGB(40, 40, 55)

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 10)
    corner.Parent = card

    -- Rarity glow
    local rarityColors = {
        Common = Color3.fromRGB(180, 180, 180),
        Uncommon = Color3.fromRGB(100, 200, 100),
        Rare = Color3.fromRGB(100, 150, 255),
        Epic = Color3.fromRGB(180, 100, 255),
        Legendary = Color3.fromRGB(255, 200, 50),
        Mythic = Color3.fromRGB(255, 100, 150),
    }

    local stroke = Instance.new("UIStroke")
    stroke.Color = rarityColors[item.Rarity] or rarityColors.Common
    stroke.Thickness = 2
    stroke.Transparency = 0.5
    stroke.Parent = card

    -- Item image
    local imageContainer = Instance.new("Frame")
    imageContainer.Size = UDim2.new(1, -16, 0, 70)
    imageContainer.Position = UDim2.new(0.5, 0, 0, 8)
    imageContainer.AnchorPoint = Vector2.new(0.5, 0)
    imageContainer.BackgroundColor3 = Color3.fromRGB(30, 30, 40)
    imageContainer.Parent = card

    local imageCorner = Instance.new("UICorner")
    imageCorner.CornerRadius = UDim.new(0, 8)
    imageCorner.Parent = imageContainer

    local itemImage = Instance.new("ImageLabel")
    itemImage.Size = UDim2.new(0.8, 0, 0.8, 0)
    itemImage.Position = UDim2.new(0.5, 0, 0.5, 0)
    itemImage.AnchorPoint = Vector2.new(0.5, 0.5)
    itemImage.BackgroundTransparency = 1
    itemImage.Image = item.Image or ""
    itemImage.ScaleType = Enum.ScaleType.Fit
    itemImage.Parent = imageContainer

    -- Count badge
    if item.Count and item.Count > 1 then
        local countBadge = Instance.new("TextLabel")
        countBadge.Size = UDim2.new(0, 30, 0, 20)
        countBadge.Position = UDim2.new(1, -5, 0, 5)
        countBadge.AnchorPoint = Vector2.new(1, 0)
        countBadge.BackgroundColor3 = Color3.fromRGB(60, 60, 80)
        countBadge.Text = "x" .. item.Count
        countBadge.TextColor3 = Color3.fromRGB(255, 255, 255)
        countBadge.Font = Enum.Font.GothamBold
        countBadge.TextSize = 12
        countBadge.Parent = imageContainer

        local badgeCorner = Instance.new("UICorner")
        badgeCorner.CornerRadius = UDim.new(0, 4)
        badgeCorner.Parent = countBadge
    end

    -- Item name
    local itemName = Instance.new("TextLabel")
    itemName.Size = UDim2.new(1, -8, 0, 18)
    itemName.Position = UDim2.new(0.5, 0, 1, -30)
    itemName.AnchorPoint = Vector2.new(0.5, 0)
    itemName.BackgroundTransparency = 1
    itemName.Text = item.Name or "Item"
    itemName.TextColor3 = rarityColors[item.Rarity] or Color3.fromRGB(255, 255, 255)
    itemName.Font = Enum.Font.GothamBold
    itemName.TextSize = 11
    itemName.TextTruncate = Enum.TextTruncate.AtEnd
    itemName.Parent = card

    -- Equipped indicator
    if item.Equipped then
        local equippedBadge = Instance.new("Frame")
        equippedBadge.Size = UDim2.new(0, 20, 0, 20)
        equippedBadge.Position = UDim2.new(0, 5, 0, 5)
        equippedBadge.BackgroundColor3 = Color3.fromRGB(50, 200, 100)
        equippedBadge.Parent = card

        local equippedCorner = Instance.new("UICorner")
        equippedCorner.CornerRadius = UDim.new(1, 0)
        equippedCorner.Parent = equippedBadge

        local checkmark = Instance.new("ImageLabel")
        checkmark.Size = UDim2.new(0.6, 0, 0.6, 0)
        checkmark.Position = UDim2.new(0.5, 0, 0.5, 0)
        checkmark.AnchorPoint = Vector2.new(0.5, 0.5)
        checkmark.BackgroundTransparency = 1
        checkmark.Image = "rbxassetid://6031094667"
        checkmark.ImageColor3 = Color3.fromRGB(255, 255, 255)
        checkmark.Parent = equippedBadge
    end

    return card
end

return SimulatorInventory
```

### 1.3 Stats Display

```lua
local SimulatorStats = {}

function SimulatorStats.CreateStatsPanel(parent, stats)
    local panel = Instance.new("Frame")
    panel.Name = "StatsPanel"
    panel.Size = UDim2.new(0, 250, 0, 0)
    panel.AutomaticSize = Enum.AutomaticSize.Y
    panel.BackgroundColor3 = Color3.fromRGB(25, 25, 35)
    panel.Parent = parent

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = panel

    local padding = Instance.new("UIPadding")
    padding.PaddingLeft = UDim.new(0, 16)
    padding.PaddingRight = UDim.new(0, 16)
    padding.PaddingTop = UDim.new(0, 16)
    padding.PaddingBottom = UDim.new(0, 16)
    padding.Parent = panel

    local layout = Instance.new("UIListLayout")
    layout.SortOrder = Enum.SortOrder.LayoutOrder
    layout.Padding = UDim.new(0, 12)
    layout.Parent = panel

    -- Title
    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(1, 0, 0, 24)
    title.BackgroundTransparency = 1
    title.Text = "STATS"
    title.TextColor3 = Color3.fromRGB(255, 255, 255)
    title.Font = Enum.Font.GothamBlack
    title.TextSize = 18
    title.TextXAlignment = Enum.TextXAlignment.Left
    title.LayoutOrder = 0
    title.Parent = panel

    -- Stats rows
    local statConfig = {
        { Name = "Power", Icon = "rbxassetid://6034684930", Color = Color3.fromRGB(255, 100, 100) },
        { Name = "Speed", Icon = "rbxassetid://6034684935", Color = Color3.fromRGB(100, 200, 255) },
        { Name = "Luck", Icon = "rbxassetid://6034684942", Color = Color3.fromRGB(200, 100, 255) },
        { Name = "Capacity", Icon = "rbxassetid://6034684928", Color = Color3.fromRGB(100, 255, 150) },
    }

    for i, config in ipairs(statConfig) do
        local statValue = stats[config.Name] or 0

        local row = Instance.new("Frame")
        row.Name = config.Name .. "Row"
        row.Size = UDim2.new(1, 0, 0, 36)
        row.BackgroundColor3 = Color3.fromRGB(35, 35, 50)
        row.LayoutOrder = i
        row.Parent = panel

        local rowCorner = Instance.new("UICorner")
        rowCorner.CornerRadius = UDim.new(0, 8)
        rowCorner.Parent = row

        -- Icon
        local icon = Instance.new("ImageLabel")
        icon.Size = UDim2.new(0, 24, 0, 24)
        icon.Position = UDim2.new(0, 8, 0.5, 0)
        icon.AnchorPoint = Vector2.new(0, 0.5)
        icon.BackgroundTransparency = 1
        icon.Image = config.Icon
        icon.ImageColor3 = config.Color
        icon.Parent = row

        -- Name
        local name = Instance.new("TextLabel")
        name.Size = UDim2.new(0, 80, 1, 0)
        name.Position = UDim2.new(0, 40, 0, 0)
        name.BackgroundTransparency = 1
        name.Text = config.Name
        name.TextColor3 = Color3.fromRGB(180, 180, 180)
        name.Font = Enum.Font.GothamMedium
        name.TextSize = 12
        name.TextXAlignment = Enum.TextXAlignment.Left
        name.Parent = row

        -- Value
        local value = Instance.new("TextLabel")
        value.Name = "Value"
        value.Size = UDim2.new(0, 80, 1, 0)
        value.Position = UDim2.new(1, -8, 0, 0)
        value.AnchorPoint = Vector2.new(1, 0)
        value.BackgroundTransparency = 1
        value.Text = SimulatorStats.FormatNumber(statValue)
        value.TextColor3 = config.Color
        value.Font = Enum.Font.GothamBold
        value.TextSize = 14
        value.TextXAlignment = Enum.TextXAlignment.Right
        value.Parent = row
    end

    return panel
end

function SimulatorStats.FormatNumber(num)
    local suffixes = {"", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc"}

    if num < 1000 then
        return tostring(math.floor(num))
    end

    local suffixIndex = 1
    while num >= 1000 and suffixIndex < #suffixes do
        num = num / 1000
        suffixIndex = suffixIndex + 1
    end

    if num >= 100 then
        return string.format("%.0f%s", num, suffixes[suffixIndex])
    elseif num >= 10 then
        return string.format("%.1f%s", num, suffixes[suffixIndex])
    else
        return string.format("%.2f%s", num, suffixes[suffixIndex])
    end
end

return SimulatorStats
```

### 1.4 Upgrade Interface

**Reference Screenshot Description**:
```
+------------------------------------------+
|  UPGRADES                    [1.5M Coins]|
+------------------------------------------+
|  [Power Icon] POWER           Level 45   |
|  =========[===-------]                   |
|  +10 Power    [UPGRADE 50K]              |
+------------------------------------------+
|  [Speed Icon] SPEED           Level 32   |
|  =========[====------]                   |
|  +5 Speed     [UPGRADE 35K]              |
+------------------------------------------+
|  [Luck Icon] LUCK             Level 28   |
|  =========[===-------]                   |
|  +2% Luck     [UPGRADE 45K]              |
+------------------------------------------+
|  [AUTO UPGRADE]  [BUY MAX]               |
+------------------------------------------+
```

---

## 2. Tycoon UI Patterns

Tycoons focus on building, managing economy, and expansion. UI must show income rates and building options clearly.

### 2.1 Core UI Elements

**Essential Components**:
- Income/money display with rate
- Build menu with categories
- Property management
- Research/upgrade tree
- Worker/automation display
- Milestone progress

### 2.2 Economy Display

```lua
local TycoonEconomy = {}

function TycoonEconomy.CreateMoneyDisplay(parent)
    local container = Instance.new("Frame")
    container.Name = "MoneyDisplay"
    container.Size = UDim2.new(0, 200, 0, 70)
    container.Position = UDim2.new(1, -20, 0, 20)
    container.AnchorPoint = Vector2.new(1, 0)
    container.BackgroundColor3 = Color3.fromRGB(20, 30, 20)
    container.Parent = parent

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = container

    local stroke = Instance.new("UIStroke")
    stroke.Color = Color3.fromRGB(80, 200, 80)
    stroke.Thickness = 2
    stroke.Transparency = 0.5
    stroke.Parent = container

    -- Currency icon
    local icon = Instance.new("ImageLabel")
    icon.Size = UDim2.new(0, 32, 0, 32)
    icon.Position = UDim2.new(0, 12, 0, 12)
    icon.BackgroundTransparency = 1
    icon.Image = "rbxassetid://6034684949"
    icon.ImageColor3 = Color3.fromRGB(80, 200, 80)
    icon.Parent = container

    -- Main amount
    local amount = Instance.new("TextLabel")
    amount.Name = "Amount"
    amount.Size = UDim2.new(1, -56, 0, 30)
    amount.Position = UDim2.new(0, 50, 0, 8)
    amount.BackgroundTransparency = 1
    amount.Text = "$1,234,567"
    amount.TextColor3 = Color3.fromRGB(80, 200, 80)
    amount.Font = Enum.Font.GothamBlack
    amount.TextSize = 22
    amount.TextXAlignment = Enum.TextXAlignment.Left
    amount.Parent = container

    -- Income rate
    local rate = Instance.new("TextLabel")
    rate.Name = "Rate"
    rate.Size = UDim2.new(1, -56, 0, 20)
    rate.Position = UDim2.new(0, 50, 0, 38)
    rate.BackgroundTransparency = 1
    rate.Text = "+$12,345/sec"
    rate.TextColor3 = Color3.fromRGB(150, 255, 150)
    rate.Font = Enum.Font.GothamMedium
    rate.TextSize = 14
    rate.TextXAlignment = Enum.TextXAlignment.Left
    rate.Parent = container

    return {
        Container = container,
        AmountLabel = amount,
        RateLabel = rate,

        SetAmount = function(self, value)
            self.AmountLabel.Text = "$" .. TycoonEconomy.FormatMoney(value)
        end,

        SetRate = function(self, value)
            local sign = value >= 0 and "+" or ""
            self.RateLabel.Text = sign .. "$" .. TycoonEconomy.FormatMoney(value) .. "/sec"
            self.RateLabel.TextColor3 = value >= 0
                and Color3.fromRGB(150, 255, 150)
                or Color3.fromRGB(255, 150, 150)
        end,
    }
end

function TycoonEconomy.FormatMoney(amount)
    if amount < 1000 then
        return string.format("%.0f", amount)
    elseif amount < 1000000 then
        return string.format("%.1fK", amount / 1000)
    elseif amount < 1000000000 then
        return string.format("%.2fM", amount / 1000000)
    else
        return string.format("%.2fB", amount / 1000000000)
    end
end

return TycoonEconomy
```

### 2.3 Build Menu

```lua
local TycoonBuildMenu = {}

function TycoonBuildMenu.Create(parent, categories)
    local menu = Instance.new("Frame")
    menu.Name = "BuildMenu"
    menu.Size = UDim2.new(0, 350, 0.7, 0)
    menu.Position = UDim2.new(0, 20, 0.5, 0)
    menu.AnchorPoint = Vector2.new(0, 0.5)
    menu.BackgroundColor3 = Color3.fromRGB(25, 30, 40)
    menu.Visible = false
    menu.Parent = parent

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 16)
    corner.Parent = menu

    -- Category tabs
    local tabBar = Instance.new("Frame")
    tabBar.Name = "TabBar"
    tabBar.Size = UDim2.new(1, 0, 0, 50)
    tabBar.BackgroundColor3 = Color3.fromRGB(35, 40, 55)
    tabBar.BorderSizePixel = 0
    tabBar.Parent = menu

    local tabCorner = Instance.new("UICorner")
    tabCorner.CornerRadius = UDim.new(0, 16)
    tabCorner.Parent = tabBar

    local tabFix = Instance.new("Frame")
    tabFix.Size = UDim2.new(1, 0, 0, 16)
    tabFix.Position = UDim2.new(0, 0, 1, -16)
    tabFix.BackgroundColor3 = tabBar.BackgroundColor3
    tabFix.BorderSizePixel = 0
    tabFix.Parent = tabBar

    local tabLayout = Instance.new("UIListLayout")
    tabLayout.FillDirection = Enum.FillDirection.Horizontal
    tabLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
    tabLayout.VerticalAlignment = Enum.VerticalAlignment.Center
    tabLayout.Padding = UDim.new(0, 4)
    tabLayout.Parent = tabBar

    local categoryIcons = {
        Production = "rbxassetid://6034684930",
        Storage = "rbxassetid://6034684928",
        Decoration = "rbxassetid://6034684935",
        Special = "rbxassetid://6034684942",
    }

    for _, category in ipairs(categories) do
        local tab = Instance.new("TextButton")
        tab.Name = category.Name .. "Tab"
        tab.Size = UDim2.new(0, 70, 0, 40)
        tab.BackgroundColor3 = Color3.fromRGB(50, 55, 70)
        tab.BackgroundTransparency = 0.5
        tab.Text = ""
        tab.Parent = tabBar

        local tabBtnCorner = Instance.new("UICorner")
        tabBtnCorner.CornerRadius = UDim.new(0, 8)
        tabBtnCorner.Parent = tab

        local tabIcon = Instance.new("ImageLabel")
        tabIcon.Size = UDim2.new(0, 24, 0, 24)
        tabIcon.Position = UDim2.new(0.5, 0, 0.5, 0)
        tabIcon.AnchorPoint = Vector2.new(0.5, 0.5)
        tabIcon.BackgroundTransparency = 1
        tabIcon.Image = categoryIcons[category.Name] or ""
        tabIcon.ImageColor3 = Color3.fromRGB(200, 200, 200)
        tabIcon.Parent = tab
    end

    -- Building list
    local buildList = Instance.new("ScrollingFrame")
    buildList.Name = "BuildList"
    buildList.Size = UDim2.new(1, -20, 1, -70)
    buildList.Position = UDim2.new(0, 10, 0, 60)
    buildList.BackgroundTransparency = 1
    buildList.ScrollBarThickness = 4
    buildList.ScrollBarImageColor3 = Color3.fromRGB(80, 80, 100)
    buildList.CanvasSize = UDim2.new(0, 0, 0, 0)
    buildList.AutomaticCanvasSize = Enum.AutomaticSize.Y
    buildList.Parent = menu

    local buildLayout = Instance.new("UIListLayout")
    buildLayout.SortOrder = Enum.SortOrder.LayoutOrder
    buildLayout.Padding = UDim.new(0, 8)
    buildLayout.Parent = buildList

    return {
        Menu = menu,
        TabBar = tabBar,
        BuildList = buildList,

        AddBuildItem = function(self, building)
            local item = TycoonBuildMenu.CreateBuildItem(building)
            item.Parent = self.BuildList
            return item
        end,
    }
end

function TycoonBuildMenu.CreateBuildItem(building)
    local item = Instance.new("Frame")
    item.Name = building.Id
    item.Size = UDim2.new(1, 0, 0, 80)
    item.BackgroundColor3 = Color3.fromRGB(35, 40, 55)

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 10)
    corner.Parent = item

    -- Preview image
    local preview = Instance.new("ImageLabel")
    preview.Size = UDim2.new(0, 70, 0, 70)
    preview.Position = UDim2.new(0, 5, 0.5, 0)
    preview.AnchorPoint = Vector2.new(0, 0.5)
    preview.BackgroundColor3 = Color3.fromRGB(25, 30, 40)
    preview.Image = building.Image or ""
    preview.ScaleType = Enum.ScaleType.Fit
    preview.Parent = item

    local previewCorner = Instance.new("UICorner")
    previewCorner.CornerRadius = UDim.new(0, 8)
    previewCorner.Parent = preview

    -- Info section
    local name = Instance.new("TextLabel")
    name.Size = UDim2.new(0, 150, 0, 22)
    name.Position = UDim2.new(0, 85, 0, 10)
    name.BackgroundTransparency = 1
    name.Text = building.Name
    name.TextColor3 = Color3.fromRGB(255, 255, 255)
    name.Font = Enum.Font.GothamBold
    name.TextSize = 14
    name.TextXAlignment = Enum.TextXAlignment.Left
    name.Parent = item

    local income = Instance.new("TextLabel")
    income.Size = UDim2.new(0, 150, 0, 18)
    income.Position = UDim2.new(0, 85, 0, 32)
    income.BackgroundTransparency = 1
    income.Text = "+$" .. building.Income .. "/sec"
    income.TextColor3 = Color3.fromRGB(100, 200, 100)
    income.Font = Enum.Font.GothamMedium
    income.TextSize = 12
    income.TextXAlignment = Enum.TextXAlignment.Left
    income.Parent = item

    -- Buy button
    local buyBtn = Instance.new("TextButton")
    buyBtn.Size = UDim2.new(0, 80, 0, 36)
    buyBtn.Position = UDim2.new(1, -10, 0.5, 0)
    buyBtn.AnchorPoint = Vector2.new(1, 0.5)
    buyBtn.BackgroundColor3 = building.CanAfford
        and Color3.fromRGB(80, 200, 80)
        or Color3.fromRGB(80, 80, 80)
    buyBtn.Text = "$" .. TycoonEconomy.FormatMoney(building.Cost)
    buyBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    buyBtn.Font = Enum.Font.GothamBold
    buyBtn.TextSize = 12
    buyBtn.Parent = item

    local buyCorner = Instance.new("UICorner")
    buyCorner.CornerRadius = UDim.new(0, 8)
    buyCorner.Parent = buyBtn

    return item
end

return TycoonBuildMenu
```

**Reference Screenshot Description**:
```
+---------------------------+
| BUILD MENU                |
| [Prod][Store][Deco][Spec] |
+---------------------------+
| [img] Factory Lv.2        |
|       +$500/sec           |
|                   [$50K]  |
+---------------------------+
| [img] Conveyor Belt       |
|       +$100/sec           |
|                   [$10K]  |
+---------------------------+
| [img] Storage Unit        |
|       +100 capacity       |
|                   [$25K]  |
+---------------------------+
```

---

## 3. Horror UI Patterns

Horror games require minimal, atmospheric UI that doesn't break immersion. Information should be conveyed subtly.

### 3.1 Core Principles

**Design Philosophy**:
- Minimal HUD presence
- Diegetic UI when possible
- Subtle, atmospheric elements
- Information revealed contextually
- Dark color palette
- Slow, ominous animations

### 3.2 Atmospheric HUD

```lua
local HorrorHUD = {}

function HorrorHUD.CreateMinimalHUD(parent)
    local hud = Instance.new("Frame")
    hud.Name = "HorrorHUD"
    hud.Size = UDim2.new(1, 0, 1, 0)
    hud.BackgroundTransparency = 1
    hud.Parent = parent

    -- Vignette effect
    local vignette = Instance.new("ImageLabel")
    vignette.Name = "Vignette"
    vignette.Size = UDim2.new(1, 0, 1, 0)
    vignette.BackgroundTransparency = 1
    vignette.Image = "rbxassetid://0" -- Vignette texture
    vignette.ImageColor3 = Color3.fromRGB(0, 0, 0)
    vignette.ImageTransparency = 0.3
    vignette.ZIndex = 1
    vignette.Parent = hud

    -- Health indicator (subtle screen edge red)
    local healthIndicator = Instance.new("Frame")
    healthIndicator.Name = "HealthIndicator"
    healthIndicator.Size = UDim2.new(1, 0, 1, 0)
    healthIndicator.BackgroundTransparency = 1
    healthIndicator.ZIndex = 2
    healthIndicator.Parent = hud

    local gradient = Instance.new("UIGradient")
    gradient.Color = ColorSequence.new({
        ColorSequenceKeypoint.new(0, Color3.fromRGB(150, 0, 0)),
        ColorSequenceKeypoint.new(0.3, Color3.fromRGB(0, 0, 0)),
        ColorSequenceKeypoint.new(0.7, Color3.fromRGB(0, 0, 0)),
        ColorSequenceKeypoint.new(1, Color3.fromRGB(150, 0, 0)),
    })
    gradient.Transparency = NumberSequence.new({
        NumberSequenceKeypoint.new(0, 0),
        NumberSequenceKeypoint.new(0.2, 1),
        NumberSequenceKeypoint.new(0.8, 1),
        NumberSequenceKeypoint.new(1, 0),
    })
    gradient.Rotation = 90
    gradient.Parent = healthIndicator

    healthIndicator.BackgroundColor3 = Color3.fromRGB(255, 0, 0)
    healthIndicator.BackgroundTransparency = 1 -- Adjust based on health

    -- Interaction prompt (bottom center, subtle)
    local interactPrompt = Instance.new("TextLabel")
    interactPrompt.Name = "InteractPrompt"
    interactPrompt.Size = UDim2.new(0, 200, 0, 30)
    interactPrompt.Position = UDim2.new(0.5, 0, 0.85, 0)
    interactPrompt.AnchorPoint = Vector2.new(0.5, 0.5)
    interactPrompt.BackgroundTransparency = 1
    interactPrompt.Text = ""
    interactPrompt.TextColor3 = Color3.fromRGB(200, 200, 200)
    interactPrompt.TextTransparency = 0.3
    interactPrompt.Font = Enum.Font.Gotham
    interactPrompt.TextSize = 14
    interactPrompt.Visible = false
    interactPrompt.ZIndex = 5
    interactPrompt.Parent = hud

    -- Stamina indicator (subtle breath effect)
    local staminaContainer = Instance.new("Frame")
    staminaContainer.Name = "StaminaIndicator"
    staminaContainer.Size = UDim2.new(0, 100, 0, 4)
    staminaContainer.Position = UDim2.new(0.5, 0, 0.95, 0)
    staminaContainer.AnchorPoint = Vector2.new(0.5, 0.5)
    staminaContainer.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
    staminaContainer.BackgroundTransparency = 0.5
    staminaContainer.Visible = false
    staminaContainer.ZIndex = 5
    staminaContainer.Parent = hud

    local staminaCorner = Instance.new("UICorner")
    staminaCorner.CornerRadius = UDim.new(1, 0)
    staminaCorner.Parent = staminaContainer

    local staminaFill = Instance.new("Frame")
    staminaFill.Name = "Fill"
    staminaFill.Size = UDim2.new(1, 0, 1, 0)
    staminaFill.BackgroundColor3 = Color3.fromRGB(150, 150, 150)
    staminaFill.BackgroundTransparency = 0.3
    staminaFill.BorderSizePixel = 0
    staminaFill.Parent = staminaContainer

    local fillCorner = Instance.new("UICorner")
    fillCorner.CornerRadius = UDim.new(1, 0)
    fillCorner.Parent = staminaFill

    return {
        HUD = hud,
        HealthIndicator = healthIndicator,
        InteractPrompt = interactPrompt,
        StaminaContainer = staminaContainer,
        StaminaFill = staminaFill,
        Vignette = vignette,

        SetHealth = function(self, percentage)
            -- As health decreases, red edges become more visible
            local transparency = 0.5 + (percentage * 0.5)
            self.HealthIndicator.BackgroundTransparency = transparency
        end,

        ShowInteraction = function(self, text)
            self.InteractPrompt.Text = "[E] " .. text
            self.InteractPrompt.Visible = true

            -- Fade in
            local TweenService = game:GetService("TweenService")
            self.InteractPrompt.TextTransparency = 1
            TweenService:Create(self.InteractPrompt, TweenInfo.new(0.3), {
                TextTransparency = 0.3
            }):Play()
        end,

        HideInteraction = function(self)
            local TweenService = game:GetService("TweenService")
            local fadeOut = TweenService:Create(self.InteractPrompt, TweenInfo.new(0.2), {
                TextTransparency = 1
            })
            fadeOut:Play()
            fadeOut.Completed:Connect(function()
                self.InteractPrompt.Visible = false
            end)
        end,

        SetStamina = function(self, percentage)
            self.StaminaContainer.Visible = percentage < 1
            self.StaminaFill.Size = UDim2.new(percentage, 0, 1, 0)
        end,

        SetFear = function(self, fearLevel)
            -- Increase vignette intensity with fear
            self.Vignette.ImageTransparency = 0.5 - (fearLevel * 0.3)
        end,
    }
end

return HorrorHUD
```

### 3.3 Jump Scare Screen Effect

```lua
local HorrorEffects = {}

function HorrorEffects.Jumpscare(parent, config)
    config = config or {}
    local duration = config.Duration or 0.5
    local image = config.Image
    local sound = config.Sound

    local screen = Instance.new("Frame")
    screen.Name = "JumpscareScreen"
    screen.Size = UDim2.new(1, 0, 1, 0)
    screen.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    screen.BackgroundTransparency = 1
    screen.ZIndex = 100
    screen.Parent = parent

    if image then
        local scareImage = Instance.new("ImageLabel")
        scareImage.Size = UDim2.new(1, 0, 1, 0)
        scareImage.BackgroundTransparency = 1
        scareImage.Image = image
        scareImage.ImageTransparency = 1
        scareImage.ScaleType = Enum.ScaleType.Crop
        scareImage.Parent = screen

        local TweenService = game:GetService("TweenService")

        -- Flash in
        TweenService:Create(scareImage, TweenInfo.new(0.05), {
            ImageTransparency = 0
        }):Play()

        -- Screen shake effect
        local camera = workspace.CurrentCamera
        local originalCFrame = camera.CFrame

        task.spawn(function()
            local startTime = tick()
            while tick() - startTime < duration do
                local shakeX = (math.random() - 0.5) * 0.05
                local shakeY = (math.random() - 0.5) * 0.05
                camera.CFrame = originalCFrame * CFrame.Angles(shakeX, shakeY, 0)
                task.wait()
            end
            camera.CFrame = originalCFrame
        end)

        -- Fade out
        task.delay(duration, function()
            TweenService:Create(scareImage, TweenInfo.new(0.3), {
                ImageTransparency = 1
            }):Play()

            task.delay(0.3, function()
                screen:Destroy()
            end)
        end)
    end

    if sound then
        local soundInstance = Instance.new("Sound")
        soundInstance.SoundId = sound
        soundInstance.Volume = 1
        soundInstance.Parent = parent
        soundInstance:Play()
        soundInstance.Ended:Connect(function()
            soundInstance:Destroy()
        end)
    end
end

return HorrorEffects
```

---

## 4. RPG UI Patterns

RPGs require rich information displays for skills, quests, dialogue, and character progression.

### 4.1 Core UI Elements

**Essential Components**:
- Character stats panel
- Skill/ability bar
- Quest log and tracker
- Dialogue system
- Inventory with equipment
- Map/minimap
- Party display (multiplayer)

### 4.2 Skill Bar

```lua
local RPGSkillBar = {}

function RPGSkillBar.Create(parent, skills)
    local container = Instance.new("Frame")
    container.Name = "SkillBar"
    container.Size = UDim2.new(0, 0, 0, 60)
    container.AutomaticSize = Enum.AutomaticSize.X
    container.Position = UDim2.new(0.5, 0, 1, -20)
    container.AnchorPoint = Vector2.new(0.5, 1)
    container.BackgroundColor3 = Color3.fromRGB(20, 20, 30)
    container.BackgroundTransparency = 0.3
    container.Parent = parent

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
    layout.FillDirection = Enum.FillDirection.Horizontal
    layout.VerticalAlignment = Enum.VerticalAlignment.Center
    layout.Padding = UDim.new(0, 6)
    layout.Parent = container

    local skillSlots = {}

    for i, skill in ipairs(skills) do
        local slot = RPGSkillBar.CreateSkillSlot(skill, i)
        slot.Parent = container
        skillSlots[i] = slot
    end

    return {
        Container = container,
        Slots = skillSlots,

        UpdateCooldown = function(self, slotIndex, remainingTime, totalTime)
            local slot = self.Slots[slotIndex]
            if slot then
                slot:SetCooldown(remainingTime, totalTime)
            end
        end,
    }
end

function RPGSkillBar.CreateSkillSlot(skill, index)
    local slot = Instance.new("Frame")
    slot.Name = "Skill" .. index
    slot.Size = UDim2.new(0, 48, 0, 48)
    slot.BackgroundColor3 = Color3.fromRGB(40, 40, 55)

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 8)
    corner.Parent = slot

    local stroke = Instance.new("UIStroke")
    stroke.Color = Color3.fromRGB(80, 80, 100)
    stroke.Thickness = 2
    stroke.Parent = slot

    -- Skill icon
    local icon = Instance.new("ImageLabel")
    icon.Name = "Icon"
    icon.Size = UDim2.new(1, -8, 1, -8)
    icon.Position = UDim2.new(0.5, 0, 0.5, 0)
    icon.AnchorPoint = Vector2.new(0.5, 0.5)
    icon.BackgroundTransparency = 1
    icon.Image = skill.Icon or ""
    icon.Parent = slot

    local iconCorner = Instance.new("UICorner")
    iconCorner.CornerRadius = UDim.new(0, 6)
    iconCorner.Parent = icon

    -- Cooldown overlay
    local cooldownOverlay = Instance.new("Frame")
    cooldownOverlay.Name = "CooldownOverlay"
    cooldownOverlay.Size = UDim2.new(1, 0, 0, 0) -- Height = remaining cooldown %
    cooldownOverlay.Position = UDim2.new(0, 0, 1, 0)
    cooldownOverlay.AnchorPoint = Vector2.new(0, 1)
    cooldownOverlay.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    cooldownOverlay.BackgroundTransparency = 0.5
    cooldownOverlay.ZIndex = 2
    cooldownOverlay.Visible = false
    cooldownOverlay.Parent = slot

    local cooldownCorner = Instance.new("UICorner")
    cooldownCorner.CornerRadius = UDim.new(0, 8)
    cooldownCorner.Parent = cooldownOverlay

    -- Cooldown time text
    local cooldownText = Instance.new("TextLabel")
    cooldownText.Name = "CooldownText"
    cooldownText.Size = UDim2.new(1, 0, 1, 0)
    cooldownText.BackgroundTransparency = 1
    cooldownText.Text = ""
    cooldownText.TextColor3 = Color3.fromRGB(255, 255, 255)
    cooldownText.Font = Enum.Font.GothamBold
    cooldownText.TextSize = 16
    cooldownText.ZIndex = 3
    cooldownText.Visible = false
    cooldownText.Parent = slot

    -- Keybind indicator
    local keybind = Instance.new("TextLabel")
    keybind.Name = "Keybind"
    keybind.Size = UDim2.new(0, 16, 0, 16)
    keybind.Position = UDim2.new(0, 2, 0, 2)
    keybind.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    keybind.BackgroundTransparency = 0.5
    keybind.Text = tostring(index)
    keybind.TextColor3 = Color3.fromRGB(255, 255, 255)
    keybind.Font = Enum.Font.GothamBold
    keybind.TextSize = 10
    keybind.ZIndex = 3
    keybind.Parent = slot

    local keybindCorner = Instance.new("UICorner")
    keybindCorner.CornerRadius = UDim.new(0, 4)
    keybindCorner.Parent = keybind

    -- Mana cost (if applicable)
    if skill.ManaCost then
        local manaCost = Instance.new("TextLabel")
        manaCost.Size = UDim2.new(0, 20, 0, 12)
        manaCost.Position = UDim2.new(1, -2, 1, -2)
        manaCost.AnchorPoint = Vector2.new(1, 1)
        manaCost.BackgroundColor3 = Color3.fromRGB(0, 100, 200)
        manaCost.BackgroundTransparency = 0.3
        manaCost.Text = tostring(skill.ManaCost)
        manaCost.TextColor3 = Color3.fromRGB(150, 200, 255)
        manaCost.Font = Enum.Font.GothamBold
        manaCost.TextSize = 10
        manaCost.ZIndex = 3
        manaCost.Parent = slot

        local manaCorner = Instance.new("UICorner")
        manaCorner.CornerRadius = UDim.new(0, 4)
        manaCorner.Parent = manaCost
    end

    return {
        Slot = slot,
        Icon = icon,
        CooldownOverlay = cooldownOverlay,
        CooldownText = cooldownText,

        SetCooldown = function(self, remaining, total)
            if remaining > 0 then
                self.CooldownOverlay.Visible = true
                self.CooldownText.Visible = true
                self.CooldownOverlay.Size = UDim2.new(1, 0, remaining / total, 0)
                self.CooldownText.Text = string.format("%.1f", remaining)
            else
                self.CooldownOverlay.Visible = false
                self.CooldownText.Visible = false
            end
        end,
    }
end

return RPGSkillBar
```

### 4.3 Quest Tracker

```lua
local QuestTracker = {}

function QuestTracker.Create(parent)
    local container = Instance.new("Frame")
    container.Name = "QuestTracker"
    container.Size = UDim2.new(0, 280, 0, 0)
    container.AutomaticSize = Enum.AutomaticSize.Y
    container.Position = UDim2.new(1, -20, 0, 100)
    container.AnchorPoint = Vector2.new(1, 0)
    container.BackgroundColor3 = Color3.fromRGB(20, 20, 30)
    container.BackgroundTransparency = 0.3
    container.Parent = parent

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = container

    local padding = Instance.new("UIPadding")
    padding.PaddingLeft = UDim.new(0, 12)
    padding.PaddingRight = UDim.new(0, 12)
    padding.PaddingTop = UDim.new(0, 12)
    padding.PaddingBottom = UDim.new(0, 12)
    padding.Parent = container

    local layout = Instance.new("UIListLayout")
    layout.SortOrder = Enum.SortOrder.LayoutOrder
    layout.Padding = UDim.new(0, 8)
    layout.Parent = container

    -- Header
    local header = Instance.new("TextLabel")
    header.Size = UDim2.new(1, 0, 0, 20)
    header.BackgroundTransparency = 1
    header.Text = "QUESTS"
    header.TextColor3 = Color3.fromRGB(200, 180, 100)
    header.Font = Enum.Font.GothamBlack
    header.TextSize = 14
    header.TextXAlignment = Enum.TextXAlignment.Left
    header.LayoutOrder = 0
    header.Parent = container

    return {
        Container = container,
        Layout = layout,

        AddQuest = function(self, quest)
            local questEntry = QuestTracker.CreateQuestEntry(quest)
            questEntry.Parent = self.Container
            return questEntry
        end,
    }
end

function QuestTracker.CreateQuestEntry(quest)
    local entry = Instance.new("Frame")
    entry.Name = quest.Id
    entry.Size = UDim2.new(1, 0, 0, 0)
    entry.AutomaticSize = Enum.AutomaticSize.Y
    entry.BackgroundTransparency = 1
    entry.LayoutOrder = quest.Priority or 1

    local entryLayout = Instance.new("UIListLayout")
    entryLayout.SortOrder = Enum.SortOrder.LayoutOrder
    entryLayout.Padding = UDim.new(0, 4)
    entryLayout.Parent = entry

    -- Quest name
    local questName = Instance.new("TextLabel")
    questName.Size = UDim2.new(1, 0, 0, 18)
    questName.BackgroundTransparency = 1
    questName.Text = quest.Name
    questName.TextColor3 = Color3.fromRGB(255, 255, 255)
    questName.Font = Enum.Font.GothamBold
    questName.TextSize = 13
    questName.TextXAlignment = Enum.TextXAlignment.Left
    questName.TextTruncate = Enum.TextTruncate.AtEnd
    questName.LayoutOrder = 1
    questName.Parent = entry

    -- Objectives
    for i, objective in ipairs(quest.Objectives) do
        local objFrame = Instance.new("Frame")
        objFrame.Size = UDim2.new(1, 0, 0, 16)
        objFrame.BackgroundTransparency = 1
        objFrame.LayoutOrder = i + 1
        objFrame.Parent = entry

        -- Checkbox
        local checkbox = Instance.new("Frame")
        checkbox.Size = UDim2.new(0, 12, 0, 12)
        checkbox.Position = UDim2.new(0, 0, 0.5, 0)
        checkbox.AnchorPoint = Vector2.new(0, 0.5)
        checkbox.BackgroundColor3 = objective.Complete
            and Color3.fromRGB(100, 200, 100)
            or Color3.fromRGB(60, 60, 70)
        checkbox.Parent = objFrame

        local checkCorner = Instance.new("UICorner")
        checkCorner.CornerRadius = UDim.new(0, 3)
        checkCorner.Parent = checkbox

        if objective.Complete then
            local checkmark = Instance.new("ImageLabel")
            checkmark.Size = UDim2.new(0.8, 0, 0.8, 0)
            checkmark.Position = UDim2.new(0.5, 0, 0.5, 0)
            checkmark.AnchorPoint = Vector2.new(0.5, 0.5)
            checkmark.BackgroundTransparency = 1
            checkmark.Image = "rbxassetid://6031094667"
            checkmark.ImageColor3 = Color3.fromRGB(255, 255, 255)
            checkmark.Parent = checkbox
        end

        -- Objective text
        local objText = Instance.new("TextLabel")
        objText.Size = UDim2.new(1, -20, 1, 0)
        objText.Position = UDim2.new(0, 18, 0, 0)
        objText.BackgroundTransparency = 1
        objText.Text = objective.Text
        objText.TextColor3 = objective.Complete
            and Color3.fromRGB(100, 200, 100)
            or Color3.fromRGB(180, 180, 180)
        objText.Font = Enum.Font.Gotham
        objText.TextSize = 12
        objText.TextXAlignment = Enum.TextXAlignment.Left
        objText.Parent = objFrame

        -- Progress (if applicable)
        if objective.Current and objective.Target then
            objText.Text = objective.Text .. " (" .. objective.Current .. "/" .. objective.Target .. ")"
        end
    end

    return entry
end

return QuestTracker
```

### 4.4 Dialogue System

```lua
local DialogueSystem = {}

function DialogueSystem.Create(parent)
    local container = Instance.new("Frame")
    container.Name = "DialogueSystem"
    container.Size = UDim2.new(0.6, 0, 0, 180)
    container.Position = UDim2.new(0.5, 0, 1, -30)
    container.AnchorPoint = Vector2.new(0.5, 1)
    container.BackgroundColor3 = Color3.fromRGB(20, 20, 30)
    container.BackgroundTransparency = 0.1
    container.Visible = false
    container.Parent = parent

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 16)
    corner.Parent = container

    local stroke = Instance.new("UIStroke")
    stroke.Color = Color3.fromRGB(80, 70, 50)
    stroke.Thickness = 3
    stroke.Parent = container

    -- Speaker portrait
    local portrait = Instance.new("ImageLabel")
    portrait.Name = "Portrait"
    portrait.Size = UDim2.new(0, 100, 0, 100)
    portrait.Position = UDim2.new(0, 15, 0, 15)
    portrait.BackgroundColor3 = Color3.fromRGB(40, 40, 50)
    portrait.Parent = container

    local portraitCorner = Instance.new("UICorner")
    portraitCorner.CornerRadius = UDim.new(0, 10)
    portraitCorner.Parent = portrait

    -- Speaker name
    local speakerName = Instance.new("TextLabel")
    speakerName.Name = "SpeakerName"
    speakerName.Size = UDim2.new(0, 200, 0, 24)
    speakerName.Position = UDim2.new(0, 130, 0, 15)
    speakerName.BackgroundTransparency = 1
    speakerName.Text = "NPC Name"
    speakerName.TextColor3 = Color3.fromRGB(200, 180, 100)
    speakerName.Font = Enum.Font.GothamBold
    speakerName.TextSize = 16
    speakerName.TextXAlignment = Enum.TextXAlignment.Left
    speakerName.Parent = container

    -- Dialogue text
    local dialogueText = Instance.new("TextLabel")
    dialogueText.Name = "DialogueText"
    dialogueText.Size = UDim2.new(1, -150, 0, 80)
    dialogueText.Position = UDim2.new(0, 130, 0, 45)
    dialogueText.BackgroundTransparency = 1
    dialogueText.Text = ""
    dialogueText.TextColor3 = Color3.fromRGB(220, 220, 220)
    dialogueText.Font = Enum.Font.Gotham
    dialogueText.TextSize = 14
    dialogueText.TextXAlignment = Enum.TextXAlignment.Left
    dialogueText.TextYAlignment = Enum.TextYAlignment.Top
    dialogueText.TextWrapped = true
    dialogueText.Parent = container

    -- Response options
    local optionsContainer = Instance.new("Frame")
    optionsContainer.Name = "Options"
    optionsContainer.Size = UDim2.new(1, -30, 0, 40)
    optionsContainer.Position = UDim2.new(0.5, 0, 1, -15)
    optionsContainer.AnchorPoint = Vector2.new(0.5, 1)
    optionsContainer.BackgroundTransparency = 1
    optionsContainer.Parent = container

    local optionsLayout = Instance.new("UIListLayout")
    optionsLayout.FillDirection = Enum.FillDirection.Horizontal
    optionsLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
    optionsLayout.Padding = UDim.new(0, 10)
    optionsLayout.Parent = optionsContainer

    return {
        Container = container,
        Portrait = portrait,
        SpeakerName = speakerName,
        DialogueText = dialogueText,
        OptionsContainer = optionsContainer,

        Show = function(self, speaker, text, options)
            self.Portrait.Image = speaker.Portrait or ""
            self.SpeakerName.Text = speaker.Name
            self.DialogueText.Text = ""
            self.Container.Visible = true

            -- Clear old options
            for _, child in ipairs(self.OptionsContainer:GetChildren()) do
                if child:IsA("TextButton") then
                    child:Destroy()
                end
            end

            -- Typewriter effect
            task.spawn(function()
                for i = 1, #text do
                    self.DialogueText.Text = string.sub(text, 1, i)
                    task.wait(0.03)
                end

                -- Show options after text complete
                if options then
                    for _, option in ipairs(options) do
                        local optBtn = Instance.new("TextButton")
                        optBtn.Size = UDim2.new(0, 0, 0, 30)
                        optBtn.AutomaticSize = Enum.AutomaticSize.X
                        optBtn.BackgroundColor3 = Color3.fromRGB(60, 50, 40)
                        optBtn.Text = option.Text
                        optBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
                        optBtn.Font = Enum.Font.GothamSemibold
                        optBtn.TextSize = 12
                        optBtn.Parent = self.OptionsContainer

                        local optCorner = Instance.new("UICorner")
                        optCorner.CornerRadius = UDim.new(0, 6)
                        optCorner.Parent = optBtn

                        local optPadding = Instance.new("UIPadding")
                        optPadding.PaddingLeft = UDim.new(0, 12)
                        optPadding.PaddingRight = UDim.new(0, 12)
                        optPadding.Parent = optBtn

                        optBtn.MouseButton1Click:Connect(function()
                            if option.Callback then
                                option.Callback()
                            end
                        end)
                    end
                end
            end)
        end,

        Hide = function(self)
            self.Container.Visible = false
        end,
    }
end

return DialogueSystem
```

---

## 5. FPS UI Patterns

FPS games require precise, non-intrusive HUD elements that don't obstruct the player's view.

### 5.1 Core UI Elements

**Essential Components**:
- Crosshair (customizable)
- Ammo display
- Health/armor
- Minimap/radar
- Kill feed
- Hit markers
- Damage indicators

### 5.2 Crosshair System

```lua
local CrosshairSystem = {}

local CrosshairStyles = {
    Dot = function(size, color, gap)
        return {
            { Type = "Circle", Size = size, Position = Vector2.new(0, 0) },
        }
    end,

    Cross = function(size, color, gap)
        local lineLength = size
        local lineThickness = 2
        return {
            { Type = "Line", Start = Vector2.new(0, -gap - lineLength), End = Vector2.new(0, -gap), Thickness = lineThickness },
            { Type = "Line", Start = Vector2.new(0, gap), End = Vector2.new(0, gap + lineLength), Thickness = lineThickness },
            { Type = "Line", Start = Vector2.new(-gap - lineLength, 0), End = Vector2.new(-gap, 0), Thickness = lineThickness },
            { Type = "Line", Start = Vector2.new(gap, 0), End = Vector2.new(gap + lineLength, 0), Thickness = lineThickness },
            { Type = "Circle", Size = 2, Position = Vector2.new(0, 0) }, -- Center dot
        }
    end,

    Circle = function(size, color, gap)
        return {
            { Type = "Circle", Size = size, Position = Vector2.new(0, 0), Hollow = true, Thickness = 2 },
            { Type = "Circle", Size = 2, Position = Vector2.new(0, 0) },
        }
    end,
}

function CrosshairSystem.Create(parent, style, config)
    config = config or {}
    local color = config.Color or Color3.fromRGB(255, 255, 255)
    local size = config.Size or 10
    local gap = config.Gap or 4
    local outline = config.Outline or true

    local container = Instance.new("Frame")
    container.Name = "Crosshair"
    container.Size = UDim2.new(0, 100, 0, 100)
    container.Position = UDim2.new(0.5, 0, 0.5, 0)
    container.AnchorPoint = Vector2.new(0.5, 0.5)
    container.BackgroundTransparency = 1
    container.Parent = parent

    local styleFunc = CrosshairStyles[style] or CrosshairStyles.Cross
    local elements = styleFunc(size, color, gap)

    for _, element in ipairs(elements) do
        if element.Type == "Circle" then
            local circle = Instance.new("Frame")
            circle.Size = UDim2.new(0, element.Size * 2, 0, element.Size * 2)
            circle.Position = UDim2.new(0.5, element.Position.X, 0.5, element.Position.Y)
            circle.AnchorPoint = Vector2.new(0.5, 0.5)
            circle.BackgroundColor3 = color
            circle.BackgroundTransparency = element.Hollow and 1 or 0
            circle.Parent = container

            local corner = Instance.new("UICorner")
            corner.CornerRadius = UDim.new(1, 0)
            corner.Parent = circle

            if element.Hollow then
                local stroke = Instance.new("UIStroke")
                stroke.Color = color
                stroke.Thickness = element.Thickness or 2
                stroke.Parent = circle
            end

            if outline then
                local outlineStroke = Instance.new("UIStroke")
                outlineStroke.Color = Color3.fromRGB(0, 0, 0)
                outlineStroke.Thickness = 1
                outlineStroke.Parent = circle
            end

        elseif element.Type == "Line" then
            local startPos = element.Start
            local endPos = element.End
            local length = (endPos - startPos).Magnitude
            local angle = math.atan2(endPos.Y - startPos.Y, endPos.X - startPos.X)

            local line = Instance.new("Frame")
            line.Size = UDim2.new(0, length, 0, element.Thickness)
            line.Position = UDim2.new(0.5, (startPos.X + endPos.X) / 2, 0.5, (startPos.Y + endPos.Y) / 2)
            line.AnchorPoint = Vector2.new(0.5, 0.5)
            line.Rotation = math.deg(angle)
            line.BackgroundColor3 = color
            line.BorderSizePixel = 0
            line.Parent = container

            if outline then
                local outlineStroke = Instance.new("UIStroke")
                outlineStroke.Color = Color3.fromRGB(0, 0, 0)
                outlineStroke.Thickness = 1
                outlineStroke.Parent = line
            end
        end
    end

    return {
        Container = container,

        SetColor = function(self, newColor)
            for _, child in ipairs(self.Container:GetChildren()) do
                if child:IsA("Frame") then
                    child.BackgroundColor3 = newColor
                    local stroke = child:FindFirstChildOfClass("UIStroke")
                    if stroke and stroke.Color ~= Color3.fromRGB(0, 0, 0) then
                        stroke.Color = newColor
                    end
                end
            end
        end,

        SetSpread = function(self, spreadMultiplier)
            -- Animate crosshair spread for accuracy feedback
            local TweenService = game:GetService("TweenService")
            TweenService:Create(self.Container, TweenInfo.new(0.1), {
                Size = UDim2.new(0, 100 * spreadMultiplier, 0, 100 * spreadMultiplier)
            }):Play()
        end,
    }
end

return CrosshairSystem
```

### 5.3 Ammo Display

```lua
local AmmoDisplay = {}

function AmmoDisplay.Create(parent)
    local container = Instance.new("Frame")
    container.Name = "AmmoDisplay"
    container.Size = UDim2.new(0, 150, 0, 60)
    container.Position = UDim2.new(1, -20, 1, -20)
    container.AnchorPoint = Vector2.new(1, 1)
    container.BackgroundColor3 = Color3.fromRGB(20, 20, 25)
    container.BackgroundTransparency = 0.3
    container.Parent = parent

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 10)
    corner.Parent = container

    -- Current ammo
    local currentAmmo = Instance.new("TextLabel")
    currentAmmo.Name = "CurrentAmmo"
    currentAmmo.Size = UDim2.new(0, 80, 0, 40)
    currentAmmo.Position = UDim2.new(0, 15, 0.5, 0)
    currentAmmo.AnchorPoint = Vector2.new(0, 0.5)
    currentAmmo.BackgroundTransparency = 1
    currentAmmo.Text = "30"
    currentAmmo.TextColor3 = Color3.fromRGB(255, 255, 255)
    currentAmmo.Font = Enum.Font.GothamBlack
    currentAmmo.TextSize = 36
    currentAmmo.TextXAlignment = Enum.TextXAlignment.Left
    currentAmmo.Parent = container

    -- Separator
    local separator = Instance.new("TextLabel")
    separator.Size = UDim2.new(0, 20, 0, 40)
    separator.Position = UDim2.new(0, 85, 0.5, 0)
    separator.AnchorPoint = Vector2.new(0, 0.5)
    separator.BackgroundTransparency = 1
    separator.Text = "/"
    separator.TextColor3 = Color3.fromRGB(100, 100, 100)
    separator.Font = Enum.Font.GothamBold
    separator.TextSize = 24
    separator.Parent = container

    -- Reserve ammo
    local reserveAmmo = Instance.new("TextLabel")
    reserveAmmo.Name = "ReserveAmmo"
    reserveAmmo.Size = UDim2.new(0, 50, 0, 30)
    reserveAmmo.Position = UDim2.new(0, 100, 0.5, 5)
    reserveAmmo.AnchorPoint = Vector2.new(0, 0.5)
    reserveAmmo.BackgroundTransparency = 1
    reserveAmmo.Text = "120"
    reserveAmmo.TextColor3 = Color3.fromRGB(150, 150, 150)
    reserveAmmo.Font = Enum.Font.GothamBold
    reserveAmmo.TextSize = 18
    reserveAmmo.TextXAlignment = Enum.TextXAlignment.Left
    reserveAmmo.Parent = container

    return {
        Container = container,
        CurrentAmmo = currentAmmo,
        ReserveAmmo = reserveAmmo,

        SetAmmo = function(self, current, reserve)
            self.CurrentAmmo.Text = tostring(current)
            self.ReserveAmmo.Text = tostring(reserve)

            -- Low ammo warning
            if current <= 5 then
                self.CurrentAmmo.TextColor3 = Color3.fromRGB(255, 80, 80)
            elseif current <= 10 then
                self.CurrentAmmo.TextColor3 = Color3.fromRGB(255, 200, 80)
            else
                self.CurrentAmmo.TextColor3 = Color3.fromRGB(255, 255, 255)
            end
        end,
    }
end

return AmmoDisplay
```

### 5.4 Hit Marker and Damage Direction

```lua
local HitFeedback = {}

function HitFeedback.ShowHitMarker(parent, isKill)
    local hitMarker = Instance.new("ImageLabel")
    hitMarker.Name = "HitMarker"
    hitMarker.Size = UDim2.new(0, 30, 0, 30)
    hitMarker.Position = UDim2.new(0.5, 0, 0.5, 0)
    hitMarker.AnchorPoint = Vector2.new(0.5, 0.5)
    hitMarker.BackgroundTransparency = 1
    hitMarker.Image = "rbxassetid://0" -- X shape or custom
    hitMarker.ImageColor3 = isKill
        and Color3.fromRGB(255, 50, 50)
        or Color3.fromRGB(255, 255, 255)
    hitMarker.ImageTransparency = 0
    hitMarker.ZIndex = 50
    hitMarker.Parent = parent

    local TweenService = game:GetService("TweenService")

    -- Scale up and fade out
    TweenService:Create(hitMarker, TweenInfo.new(0.15, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
        Size = UDim2.new(0, 40, 0, 40),
        ImageTransparency = 0.5
    }):Play()

    task.delay(0.15, function()
        local fadeOut = TweenService:Create(hitMarker, TweenInfo.new(0.1), {
            ImageTransparency = 1
        })
        fadeOut:Play()
        fadeOut.Completed:Connect(function()
            hitMarker:Destroy()
        end)
    end)
end

function HitFeedback.ShowDamageDirection(parent, direction)
    -- direction: angle in degrees (0 = front, 90 = right, 180 = back, 270 = left)

    local indicator = Instance.new("ImageLabel")
    indicator.Name = "DamageDirection"
    indicator.Size = UDim2.new(0.3, 0, 0.3, 0)
    indicator.Position = UDim2.new(0.5, 0, 0.5, 0)
    indicator.AnchorPoint = Vector2.new(0.5, 0.5)
    indicator.BackgroundTransparency = 1
    indicator.Image = "rbxassetid://0" -- Arc or arrow pointing inward
    indicator.ImageColor3 = Color3.fromRGB(200, 0, 0)
    indicator.ImageTransparency = 0.3
    indicator.Rotation = direction
    indicator.ZIndex = 10
    indicator.Parent = parent

    local TweenService = game:GetService("TweenService")

    local fadeOut = TweenService:Create(indicator, TweenInfo.new(1), {
        ImageTransparency = 1
    })
    fadeOut:Play()
    fadeOut.Completed:Connect(function()
        indicator:Destroy()
    end)
end

return HitFeedback
```

---

## 6. Social/Hangout UI Patterns

Social games focus on expression, communication, and customization. UI should be inviting and facilitate interaction.

### 6.1 Core UI Elements

**Essential Components**:
- Chat system (text + emoji)
- Emote wheel
- Profile cards
- Friend list
- Avatar customization
- Activity/game browser
- Trading interface

### 6.2 Emote Wheel

```lua
local EmoteWheel = {}

function EmoteWheel.Create(parent, emotes)
    local container = Instance.new("Frame")
    container.Name = "EmoteWheel"
    container.Size = UDim2.new(0, 300, 0, 300)
    container.Position = UDim2.new(0.5, 0, 0.5, 0)
    container.AnchorPoint = Vector2.new(0.5, 0.5)
    container.BackgroundTransparency = 1
    container.Visible = false
    container.Parent = parent

    -- Center circle
    local center = Instance.new("Frame")
    center.Name = "Center"
    center.Size = UDim2.new(0, 80, 0, 80)
    center.Position = UDim2.new(0.5, 0, 0.5, 0)
    center.AnchorPoint = Vector2.new(0.5, 0.5)
    center.BackgroundColor3 = Color3.fromRGB(40, 40, 50)
    center.Parent = container

    local centerCorner = Instance.new("UICorner")
    centerCorner.CornerRadius = UDim.new(1, 0)
    centerCorner.Parent = center

    local centerText = Instance.new("TextLabel")
    centerText.Size = UDim2.new(1, 0, 1, 0)
    centerText.BackgroundTransparency = 1
    centerText.Text = "Select\nEmote"
    centerText.TextColor3 = Color3.fromRGB(150, 150, 150)
    centerText.Font = Enum.Font.GothamMedium
    centerText.TextSize = 12
    centerText.Parent = center

    -- Emote segments
    local numEmotes = math.min(#emotes, 8)
    local segmentAngle = 360 / numEmotes
    local radius = 100

    for i, emote in ipairs(emotes) do
        if i > 8 then break end

        local angle = math.rad((i - 1) * segmentAngle - 90)
        local x = math.cos(angle) * radius
        local y = math.sin(angle) * radius

        local segment = Instance.new("ImageButton")
        segment.Name = emote.Name
        segment.Size = UDim2.new(0, 60, 0, 60)
        segment.Position = UDim2.new(0.5, x, 0.5, y)
        segment.AnchorPoint = Vector2.new(0.5, 0.5)
        segment.BackgroundColor3 = Color3.fromRGB(50, 50, 65)
        segment.Image = emote.Icon or ""
        segment.ScaleType = Enum.ScaleType.Fit
        segment.Parent = container

        local segmentCorner = Instance.new("UICorner")
        segmentCorner.CornerRadius = UDim.new(1, 0)
        segmentCorner.Parent = segment

        local segmentPadding = Instance.new("UIPadding")
        segmentPadding.PaddingLeft = UDim.new(0, 10)
        segmentPadding.PaddingRight = UDim.new(0, 10)
        segmentPadding.PaddingTop = UDim.new(0, 10)
        segmentPadding.PaddingBottom = UDim.new(0, 10)
        segmentPadding.Parent = segment

        -- Emote name tooltip
        local tooltip = Instance.new("TextLabel")
        tooltip.Name = "Tooltip"
        tooltip.Size = UDim2.new(0, 0, 0, 20)
        tooltip.AutomaticSize = Enum.AutomaticSize.X
        tooltip.Position = UDim2.new(0.5, 0, 0, -25)
        tooltip.AnchorPoint = Vector2.new(0.5, 1)
        tooltip.BackgroundColor3 = Color3.fromRGB(30, 30, 40)
        tooltip.Text = emote.Name
        tooltip.TextColor3 = Color3.fromRGB(255, 255, 255)
        tooltip.Font = Enum.Font.GothamSemibold
        tooltip.TextSize = 11
        tooltip.Visible = false
        tooltip.ZIndex = 10
        tooltip.Parent = segment

        local tooltipCorner = Instance.new("UICorner")
        tooltipCorner.CornerRadius = UDim.new(0, 4)
        tooltipCorner.Parent = tooltip

        local tooltipPadding = Instance.new("UIPadding")
        tooltipPadding.PaddingLeft = UDim.new(0, 8)
        tooltipPadding.PaddingRight = UDim.new(0, 8)
        tooltipPadding.Parent = tooltip

        -- Hover effects
        segment.MouseEnter:Connect(function()
            tooltip.Visible = true
            segment.BackgroundColor3 = Color3.fromRGB(70, 70, 90)
            centerText.Text = emote.Name
        end)

        segment.MouseLeave:Connect(function()
            tooltip.Visible = false
            segment.BackgroundColor3 = Color3.fromRGB(50, 50, 65)
            centerText.Text = "Select\nEmote"
        end)

        segment.MouseButton1Click:Connect(function()
            if emote.Callback then
                emote.Callback()
            end
            container.Visible = false
        end)
    end

    return {
        Container = container,

        Show = function(self)
            self.Container.Visible = true
        end,

        Hide = function(self)
            self.Container.Visible = false
        end,

        Toggle = function(self)
            self.Container.Visible = not self.Container.Visible
        end,
    }
end

return EmoteWheel
```

### 6.3 Profile Card

```lua
local ProfileCard = {}

function ProfileCard.Create(parent, playerData)
    local card = Instance.new("Frame")
    card.Name = "ProfileCard"
    card.Size = UDim2.new(0, 300, 0, 400)
    card.Position = UDim2.new(0.5, 0, 0.5, 0)
    card.AnchorPoint = Vector2.new(0.5, 0.5)
    card.BackgroundColor3 = Color3.fromRGB(30, 35, 45)
    card.Parent = parent

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 16)
    corner.Parent = card

    -- Avatar display
    local avatarFrame = Instance.new("Frame")
    avatarFrame.Size = UDim2.new(1, 0, 0, 180)
    avatarFrame.BackgroundColor3 = Color3.fromRGB(40, 45, 60)
    avatarFrame.BorderSizePixel = 0
    avatarFrame.Parent = card

    local avatarCorner = Instance.new("UICorner")
    avatarCorner.CornerRadius = UDim.new(0, 16)
    avatarCorner.Parent = avatarFrame

    local avatarFix = Instance.new("Frame")
    avatarFix.Size = UDim2.new(1, 0, 0, 16)
    avatarFix.Position = UDim2.new(0, 0, 1, -16)
    avatarFix.BackgroundColor3 = avatarFrame.BackgroundColor3
    avatarFix.BorderSizePixel = 0
    avatarFix.Parent = avatarFrame

    local avatar = Instance.new("ImageLabel")
    avatar.Size = UDim2.new(0, 120, 0, 120)
    avatar.Position = UDim2.new(0.5, 0, 0.5, 0)
    avatar.AnchorPoint = Vector2.new(0.5, 0.5)
    avatar.BackgroundTransparency = 1
    avatar.Image = playerData.AvatarThumbnail or ""
    avatar.Parent = avatarFrame

    -- Status indicator
    local statusColors = {
        Online = Color3.fromRGB(80, 200, 80),
        Away = Color3.fromRGB(255, 180, 50),
        Busy = Color3.fromRGB(200, 80, 80),
        Offline = Color3.fromRGB(100, 100, 100),
    }

    local statusDot = Instance.new("Frame")
    statusDot.Size = UDim2.new(0, 16, 0, 16)
    statusDot.Position = UDim2.new(1, -20, 0, 20)
    statusDot.BackgroundColor3 = statusColors[playerData.Status] or statusColors.Online
    statusDot.Parent = avatarFrame

    local statusCorner = Instance.new("UICorner")
    statusCorner.CornerRadius = UDim.new(1, 0)
    statusCorner.Parent = statusDot

    -- Player info
    local infoSection = Instance.new("Frame")
    infoSection.Size = UDim2.new(1, -30, 0, 180)
    infoSection.Position = UDim2.new(0, 15, 0, 195)
    infoSection.BackgroundTransparency = 1
    infoSection.Parent = card

    local infoLayout = Instance.new("UIListLayout")
    infoLayout.SortOrder = Enum.SortOrder.LayoutOrder
    infoLayout.Padding = UDim.new(0, 8)
    infoLayout.Parent = infoSection

    -- Username
    local username = Instance.new("TextLabel")
    username.Size = UDim2.new(1, 0, 0, 28)
    username.BackgroundTransparency = 1
    username.Text = playerData.Username or "Player"
    username.TextColor3 = Color3.fromRGB(255, 255, 255)
    username.Font = Enum.Font.GothamBold
    username.TextSize = 20
    username.TextXAlignment = Enum.TextXAlignment.Left
    username.LayoutOrder = 1
    username.Parent = infoSection

    -- Display name (if different)
    if playerData.DisplayName and playerData.DisplayName ~= playerData.Username then
        local displayName = Instance.new("TextLabel")
        displayName.Size = UDim2.new(1, 0, 0, 18)
        displayName.BackgroundTransparency = 1
        displayName.Text = "@" .. playerData.Username
        displayName.TextColor3 = Color3.fromRGB(150, 150, 150)
        displayName.Font = Enum.Font.Gotham
        displayName.TextSize = 12
        displayName.TextXAlignment = Enum.TextXAlignment.Left
        displayName.LayoutOrder = 2
        displayName.Parent = infoSection

        username.Text = playerData.DisplayName
    end

    -- Bio
    if playerData.Bio then
        local bio = Instance.new("TextLabel")
        bio.Size = UDim2.new(1, 0, 0, 40)
        bio.BackgroundTransparency = 1
        bio.Text = playerData.Bio
        bio.TextColor3 = Color3.fromRGB(180, 180, 180)
        bio.Font = Enum.Font.Gotham
        bio.TextSize = 12
        bio.TextXAlignment = Enum.TextXAlignment.Left
        bio.TextYAlignment = Enum.TextYAlignment.Top
        bio.TextWrapped = true
        bio.LayoutOrder = 3
        bio.Parent = infoSection
    end

    -- Stats row
    local statsRow = Instance.new("Frame")
    statsRow.Size = UDim2.new(1, 0, 0, 50)
    statsRow.BackgroundTransparency = 1
    statsRow.LayoutOrder = 4
    statsRow.Parent = infoSection

    local statsLayout = Instance.new("UIListLayout")
    statsLayout.FillDirection = Enum.FillDirection.Horizontal
    statsLayout.HorizontalAlignment = Enum.HorizontalAlignment.Left
    statsLayout.Padding = UDim.new(0, 20)
    statsLayout.Parent = statsRow

    local stats = {
        { Label = "Friends", Value = playerData.FriendsCount or 0 },
        { Label = "Followers", Value = playerData.FollowersCount or 0 },
        { Label = "Level", Value = playerData.Level or 1 },
    }

    for _, stat in ipairs(stats) do
        local statFrame = Instance.new("Frame")
        statFrame.Size = UDim2.new(0, 60, 1, 0)
        statFrame.BackgroundTransparency = 1
        statFrame.Parent = statsRow

        local statLayout = Instance.new("UIListLayout")
        statLayout.SortOrder = Enum.SortOrder.LayoutOrder
        statLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
        statLayout.Parent = statFrame

        local statValue = Instance.new("TextLabel")
        statValue.Size = UDim2.new(1, 0, 0, 24)
        statValue.BackgroundTransparency = 1
        statValue.Text = tostring(stat.Value)
        statValue.TextColor3 = Color3.fromRGB(255, 255, 255)
        statValue.Font = Enum.Font.GothamBold
        statValue.TextSize = 18
        statValue.LayoutOrder = 1
        statValue.Parent = statFrame

        local statLabel = Instance.new("TextLabel")
        statLabel.Size = UDim2.new(1, 0, 0, 16)
        statLabel.BackgroundTransparency = 1
        statLabel.Text = stat.Label
        statLabel.TextColor3 = Color3.fromRGB(120, 120, 120)
        statLabel.Font = Enum.Font.Gotham
        statLabel.TextSize = 11
        statLabel.LayoutOrder = 2
        statLabel.Parent = statFrame
    end

    -- Action buttons
    local actionsRow = Instance.new("Frame")
    actionsRow.Size = UDim2.new(1, -30, 0, 40)
    actionsRow.Position = UDim2.new(0, 15, 1, -55)
    actionsRow.BackgroundTransparency = 1
    actionsRow.Parent = card

    local actionsLayout = Instance.new("UIListLayout")
    actionsLayout.FillDirection = Enum.FillDirection.Horizontal
    actionsLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
    actionsLayout.Padding = UDim.new(0, 10)
    actionsLayout.Parent = actionsRow

    local actions = {
        { Text = "Add Friend", Color = Color3.fromRGB(80, 150, 255) },
        { Text = "Message", Color = Color3.fromRGB(80, 80, 100) },
    }

    for _, action in ipairs(actions) do
        local btn = Instance.new("TextButton")
        btn.Size = UDim2.new(0.45, 0, 0, 36)
        btn.BackgroundColor3 = action.Color
        btn.Text = action.Text
        btn.TextColor3 = Color3.fromRGB(255, 255, 255)
        btn.Font = Enum.Font.GothamSemibold
        btn.TextSize = 13
        btn.Parent = actionsRow

        local btnCorner = Instance.new("UICorner")
        btnCorner.CornerRadius = UDim.new(0, 8)
        btnCorner.Parent = btn
    end

    return card
end

return ProfileCard
```

---

## Summary

Each game genre has established UI conventions:

| Genre | Key Characteristics |
|-------|---------------------|
| **Simulator** | Dense information, inventory focus, progression metrics |
| **Tycoon** | Economy display, build menus, income rates |
| **Horror** | Minimal HUD, atmospheric, diegetic elements |
| **RPG** | Rich stats, skills, quests, dialogue systems |
| **FPS** | Precise crosshair, ammo, minimal obstruction |
| **Social** | Expression tools, profiles, communication |

Understanding and implementing these genre-specific patterns ensures players feel comfortable with familiar conventions while experiencing your unique game.
