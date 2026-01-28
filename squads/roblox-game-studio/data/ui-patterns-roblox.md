# UI Patterns for Roblox Development

> Comprehensive guide to responsive, accessible, and platform-aware UI design
> Last Updated: January 2025

---

## Responsive Design Fundamentals

### Scale vs Offset

| Property | Use Case | Behavior |
|----------|----------|----------|
| **Scale** (0-1) | Responsive sizing | Percentage of parent |
| **Offset** (pixels) | Fixed sizing | Absolute pixels |

```lua
-- ALWAYS prefer Scale for responsive design
local responsiveSize = UDim2.new(0.25, 0, 0.08, 0)  -- 25% width, 8% height
local fixedSize = UDim2.new(0, 100, 0, 50)           -- Fixed 100x50 pixels

-- Hybrid approach: Scale with minimum offset
local hybridSize = UDim2.new(0.2, 50, 0.1, 20)       -- 20% + 50px, 10% + 20px
```

### UDim2 Best Practices

```lua
--!strict

-- Position: Use Scale for centering
local centerPosition = UDim2.new(0.5, 0, 0.5, 0)  -- Center of parent

-- Size: Use Scale for responsiveness
local responsiveButton = UDim2.new(0.15, 0, 0.08, 0)  -- 15% width, 8% height

-- AnchorPoint: Center the element on its position
frame.AnchorPoint = Vector2.new(0.5, 0.5)  -- Center anchor
frame.Position = UDim2.new(0.5, 0, 0.5, 0) -- Centered on screen
```

---

## Mobile-First Design

### Platform Detection

```lua
--!strict

local UserInputService = game:GetService("UserInputService")
local GuiService = game:GetService("GuiService")

type Platform = "Mobile" | "Desktop" | "Console" | "VR"

local function getPlatform(): Platform
    if UserInputService.VREnabled then
        return "VR"
    elseif UserInputService.TouchEnabled and not UserInputService.KeyboardEnabled then
        return "Mobile"
    elseif UserInputService.GamepadEnabled and not UserInputService.KeyboardEnabled then
        return "Console"
    else
        return "Desktop"
    end
end

local function isMobile(): boolean
    return getPlatform() == "Mobile"
end

local function isTouch(): boolean
    return UserInputService.TouchEnabled
end
```

### Touch Target Sizes

According to mobile UX guidelines:
- **Minimum touch target**: 44x44 points (Apple), 48x48 dp (Google)
- **Recommended for Roblox**: 60-80 pixels or 8-10% of screen height

```lua
--!strict

-- Minimum touch target calculation
local function getMinTouchSize(): UDim2
    local screenSize = workspace.CurrentCamera.ViewportSize
    local minPixels = 60

    -- Use the larger of 8% or 60 pixels
    local scaleX = math.max(0.08, minPixels / screenSize.X)
    local scaleY = math.max(0.08, minPixels / screenSize.Y)

    return UDim2.new(scaleX, 0, scaleY, 0)
end

-- Apply to buttons
local function createMobileButton(name: string): TextButton
    local button = Instance.new("TextButton")
    button.Name = name
    button.Size = UDim2.new(0.15, 0, 0.08, 0)  -- 15% width, 8% height
    button.AnchorPoint = Vector2.new(0.5, 0.5)

    -- Ensure minimum size on mobile
    if isMobile() then
        -- Add padding for easier touch
        button.Size = UDim2.new(
            math.max(0.18, button.Size.X.Scale),
            0,
            math.max(0.1, button.Size.Y.Scale),
            0
        )
    end

    return button
end
```

### Touch-Friendly Spacing

```lua
--!strict

-- Minimum spacing between interactive elements
local TOUCH_SPACING = 0.02  -- 2% of parent

local function createButtonGrid(buttons: {string}, parent: GuiObject)
    local layout = Instance.new("UIGridLayout")
    layout.CellPadding = UDim2.new(TOUCH_SPACING, 0, TOUCH_SPACING, 0)
    layout.CellSize = UDim2.new(0.28, 0, 0.12, 0)  -- 3 columns with spacing
    layout.Parent = parent

    for _, buttonName in buttons do
        local button = createMobileButton(buttonName)
        button.Parent = parent
    end
end
```

---

## Safe Areas & Notches

### Handling Device Safe Areas

```lua
--!strict

local GuiService = game:GetService("GuiService")

-- Get safe area insets (for notches, home indicators, etc.)
local function getSafeAreaInsets(): {top: number, bottom: number, left: number, right: number}
    local insets = GuiService:GetGuiInset()

    return {
        top = insets.Y,
        bottom = 0,  -- May need adjustment for home indicator
        left = 0,
        right = 0
    }
end

-- Apply safe area padding to UI
local function applySafeArea(frame: Frame)
    local insets = getSafeAreaInsets()

    -- Create padding
    local padding = Instance.new("UIPadding")
    padding.PaddingTop = UDim.new(0, insets.top + 10)
    padding.PaddingBottom = UDim.new(0, insets.bottom + 10)
    padding.PaddingLeft = UDim.new(0, insets.left + 10)
    padding.PaddingRight = UDim.new(0, insets.right + 10)
    padding.Parent = frame
end
```

### Orientation Handling

```lua
--!strict

local function setupOrientationHandling(ui: ScreenGui)
    local camera = workspace.CurrentCamera

    local function updateLayout()
        local viewportSize = camera.ViewportSize
        local isPortrait = viewportSize.Y > viewportSize.X

        if isPortrait then
            -- Portrait layout
            ui:SetAttribute("Layout", "Portrait")
            -- Adjust UI for vertical orientation
        else
            -- Landscape layout
            ui:SetAttribute("Layout", "Landscape")
            -- Adjust UI for horizontal orientation
        end
    end

    camera:GetPropertyChangedSignal("ViewportSize"):Connect(updateLayout)
    updateLayout()
end
```

---

## UIAspectRatioConstraint

### Maintaining Proportions

```lua
--!strict

local function createAspectConstrainedFrame(
    aspectRatio: number,
    parent: GuiObject
): Frame
    local frame = Instance.new("Frame")
    frame.Size = UDim2.new(1, 0, 1, 0)  -- Fill parent
    frame.AnchorPoint = Vector2.new(0.5, 0.5)
    frame.Position = UDim2.new(0.5, 0, 0.5, 0)
    frame.Parent = parent

    local constraint = Instance.new("UIAspectRatioConstraint")
    constraint.AspectRatio = aspectRatio
    constraint.AspectType = Enum.AspectType.FitWithinMaxSize
    constraint.DominantAxis = Enum.DominantAxis.Width
    constraint.Parent = frame

    return frame
end

-- Usage: Create a 16:9 container
local wideContainer = createAspectConstrainedFrame(16/9, screenGui)

-- Create a square container
local squareContainer = createAspectConstrainedFrame(1, screenGui)
```

---

## TweenService Patterns

### Basic UI Tweens

```lua
--!strict

local TweenService = game:GetService("TweenService")

type TweenConfig = {
    duration: number?,
    easingStyle: Enum.EasingStyle?,
    easingDirection: Enum.EasingDirection?,
    repeatCount: number?,
    reverses: boolean?,
    delayTime: number?
}

local DEFAULT_TWEEN: TweenConfig = {
    duration = 0.3,
    easingStyle = Enum.EasingStyle.Quad,
    easingDirection = Enum.EasingDirection.Out,
    repeatCount = 0,
    reverses = false,
    delayTime = 0
}

local function createTween(
    object: GuiObject,
    properties: {[string]: any},
    config: TweenConfig?
): Tween
    local cfg = config or DEFAULT_TWEEN

    local tweenInfo = TweenInfo.new(
        cfg.duration or 0.3,
        cfg.easingStyle or Enum.EasingStyle.Quad,
        cfg.easingDirection or Enum.EasingDirection.Out,
        cfg.repeatCount or 0,
        cfg.reverses or false,
        cfg.delayTime or 0
    )

    return TweenService:Create(object, tweenInfo, properties)
end
```

### Common UI Animations

```lua
--!strict

local UIAnimations = {}

-- Fade In
function UIAnimations.fadeIn(element: GuiObject, duration: number?)
    element.BackgroundTransparency = 1

    if element:IsA("TextLabel") or element:IsA("TextButton") then
        element.TextTransparency = 1
    end

    local tween = createTween(element, {
        BackgroundTransparency = 0
    }, {duration = duration or 0.3})

    if element:IsA("TextLabel") or element:IsA("TextButton") then
        local textTween = createTween(element, {
            TextTransparency = 0
        }, {duration = duration or 0.3})
        textTween:Play()
    end

    tween:Play()
    return tween
end

-- Fade Out
function UIAnimations.fadeOut(element: GuiObject, duration: number?): Tween
    local tween = createTween(element, {
        BackgroundTransparency = 1
    }, {duration = duration or 0.3})

    if element:IsA("TextLabel") or element:IsA("TextButton") then
        local textTween = createTween(element, {
            TextTransparency = 1
        }, {duration = duration or 0.3})
        textTween:Play()
    end

    tween:Play()
    return tween
end

-- Slide In from edge
function UIAnimations.slideIn(
    element: GuiObject,
    direction: "Left" | "Right" | "Top" | "Bottom",
    duration: number?
): Tween
    local targetPosition = element.Position
    local startPosition: UDim2

    if direction == "Left" then
        startPosition = UDim2.new(-1, 0, targetPosition.Y.Scale, targetPosition.Y.Offset)
    elseif direction == "Right" then
        startPosition = UDim2.new(2, 0, targetPosition.Y.Scale, targetPosition.Y.Offset)
    elseif direction == "Top" then
        startPosition = UDim2.new(targetPosition.X.Scale, targetPosition.X.Offset, -1, 0)
    else -- Bottom
        startPosition = UDim2.new(targetPosition.X.Scale, targetPosition.X.Offset, 2, 0)
    end

    element.Position = startPosition

    local tween = createTween(element, {
        Position = targetPosition
    }, {
        duration = duration or 0.4,
        easingStyle = Enum.EasingStyle.Back,
        easingDirection = Enum.EasingDirection.Out
    })

    tween:Play()
    return tween
end

-- Scale pop effect
function UIAnimations.popIn(element: GuiObject, duration: number?): Tween
    local targetSize = element.Size

    element.Size = UDim2.new(0, 0, 0, 0)

    local tween = createTween(element, {
        Size = targetSize
    }, {
        duration = duration or 0.3,
        easingStyle = Enum.EasingStyle.Back,
        easingDirection = Enum.EasingDirection.Out
    })

    tween:Play()
    return tween
end

-- Button hover effect
function UIAnimations.setupHoverEffect(button: GuiButton)
    local originalSize = button.Size
    local hoverSize = UDim2.new(
        originalSize.X.Scale * 1.1,
        originalSize.X.Offset,
        originalSize.Y.Scale * 1.1,
        originalSize.Y.Offset
    )

    button.MouseEnter:Connect(function()
        createTween(button, {Size = hoverSize}, {duration = 0.15}):Play()
    end)

    button.MouseLeave:Connect(function()
        createTween(button, {Size = originalSize}, {duration = 0.15}):Play()
    end)
end

-- Button click effect
function UIAnimations.setupClickEffect(button: GuiButton)
    local originalSize = button.Size
    local pressedSize = UDim2.new(
        originalSize.X.Scale * 0.95,
        originalSize.X.Offset,
        originalSize.Y.Scale * 0.95,
        originalSize.Y.Offset
    )

    button.MouseButton1Down:Connect(function()
        createTween(button, {Size = pressedSize}, {duration = 0.1}):Play()
    end)

    button.MouseButton1Up:Connect(function()
        createTween(button, {Size = originalSize}, {
            duration = 0.2,
            easingStyle = Enum.EasingStyle.Elastic
        }):Play()
    end)
end

return UIAnimations
```

### Typewriter Effect

```lua
--!strict

local function typewriterEffect(
    textLabel: TextLabel,
    text: string,
    charDelay: number?
): ()
    local delay = charDelay or 0.03
    textLabel.Text = ""

    for i = 1, #text do
        textLabel.Text = string.sub(text, 1, i)
        task.wait(delay)
    end
end

-- Usage
typewriterEffect(myLabel, "Welcome to the game!", 0.05)
```

---

## Common UI Components

### Responsive HUD

```lua
--!strict

local function createHUD(player: Player): ScreenGui
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "HUD"
    screenGui.ResetOnSpawn = false
    screenGui.IgnoreGuiInset = true

    -- Top bar (health, mana, etc.)
    local topBar = Instance.new("Frame")
    topBar.Name = "TopBar"
    topBar.Size = UDim2.new(1, 0, 0.08, 0)
    topBar.Position = UDim2.new(0, 0, 0, 0)
    topBar.BackgroundTransparency = 0.5
    topBar.BackgroundColor3 = Color3.new(0, 0, 0)
    topBar.Parent = screenGui

    -- Safe area padding
    local topPadding = Instance.new("UIPadding")
    topPadding.PaddingTop = UDim.new(0, 10)
    topPadding.PaddingLeft = UDim.new(0, 10)
    topPadding.PaddingRight = UDim.new(0, 10)
    topPadding.Parent = topBar

    -- Health bar
    local healthBar = createProgressBar("Health", Color3.new(0.8, 0.2, 0.2))
    healthBar.Position = UDim2.new(0, 0, 0.5, 0)
    healthBar.Size = UDim2.new(0.2, 0, 0.6, 0)
    healthBar.Parent = topBar

    -- Action buttons (bottom, mobile-friendly)
    local actionBar = Instance.new("Frame")
    actionBar.Name = "ActionBar"
    actionBar.Size = UDim2.new(0.6, 0, 0.12, 0)
    actionBar.Position = UDim2.new(0.5, 0, 0.92, 0)
    actionBar.AnchorPoint = Vector2.new(0.5, 1)
    actionBar.BackgroundTransparency = 1
    actionBar.Parent = screenGui

    -- Grid layout for action buttons
    local layout = Instance.new("UIListLayout")
    layout.FillDirection = Enum.FillDirection.Horizontal
    layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
    layout.Padding = UDim.new(0.02, 0)
    layout.Parent = actionBar

    screenGui.Parent = player.PlayerGui
    return screenGui
end

local function createProgressBar(name: string, color: Color3): Frame
    local container = Instance.new("Frame")
    container.Name = name
    container.BackgroundColor3 = Color3.new(0.2, 0.2, 0.2)
    container.AnchorPoint = Vector2.new(0, 0.5)

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0.5, 0)
    corner.Parent = container

    local fill = Instance.new("Frame")
    fill.Name = "Fill"
    fill.Size = UDim2.new(1, 0, 1, 0)
    fill.BackgroundColor3 = color
    fill.Parent = container

    local fillCorner = Instance.new("UICorner")
    fillCorner.CornerRadius = UDim.new(0.5, 0)
    fillCorner.Parent = fill

    return container
end
```

### Responsive Shop UI

```lua
--!strict

local function createShopUI(): ScreenGui
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "ShopUI"

    -- Main container with aspect ratio
    local container = Instance.new("Frame")
    container.Name = "Container"
    container.Size = UDim2.new(0.8, 0, 0.8, 0)
    container.Position = UDim2.new(0.5, 0, 0.5, 0)
    container.AnchorPoint = Vector2.new(0.5, 0.5)
    container.BackgroundColor3 = Color3.new(0.1, 0.1, 0.15)
    container.Parent = screenGui

    local containerCorner = Instance.new("UICorner")
    containerCorner.CornerRadius = UDim.new(0.02, 0)
    containerCorner.Parent = container

    -- Scrolling grid for items
    local scrollFrame = Instance.new("ScrollingFrame")
    scrollFrame.Name = "ItemGrid"
    scrollFrame.Size = UDim2.new(0.95, 0, 0.85, 0)
    scrollFrame.Position = UDim2.new(0.5, 0, 0.55, 0)
    scrollFrame.AnchorPoint = Vector2.new(0.5, 0.5)
    scrollFrame.BackgroundTransparency = 1
    scrollFrame.ScrollBarThickness = 8
    scrollFrame.Parent = container

    -- Responsive grid layout
    local gridLayout = Instance.new("UIGridLayout")
    gridLayout.CellPadding = UDim2.new(0.02, 0, 0.02, 0)
    gridLayout.CellSize = UDim2.new(0.3, 0, 0.25, 0)  -- 3 columns
    gridLayout.Parent = scrollFrame

    -- Adjust for mobile
    if isMobile() then
        gridLayout.CellSize = UDim2.new(0.45, 0, 0.2, 0)  -- 2 columns on mobile
    end

    return screenGui
end
```

### Modal Dialog

```lua
--!strict

local function createModal(
    title: string,
    message: string,
    buttons: {{text: string, callback: () -> ()}}
): ScreenGui
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "Modal"
    screenGui.DisplayOrder = 100  -- Above other UI

    -- Dimmed background
    local overlay = Instance.new("Frame")
    overlay.Name = "Overlay"
    overlay.Size = UDim2.new(1, 0, 1, 0)
    overlay.BackgroundColor3 = Color3.new(0, 0, 0)
    overlay.BackgroundTransparency = 0.5
    overlay.Parent = screenGui

    -- Modal box
    local modal = Instance.new("Frame")
    modal.Name = "Modal"
    modal.Size = UDim2.new(0.4, 0, 0.3, 0)
    modal.Position = UDim2.new(0.5, 0, 0.5, 0)
    modal.AnchorPoint = Vector2.new(0.5, 0.5)
    modal.BackgroundColor3 = Color3.new(0.15, 0.15, 0.2)
    modal.Parent = screenGui

    -- Mobile: Make modal larger
    if isMobile() then
        modal.Size = UDim2.new(0.9, 0, 0.35, 0)
    end

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0.05, 0)
    corner.Parent = modal

    -- Title
    local titleLabel = Instance.new("TextLabel")
    titleLabel.Name = "Title"
    titleLabel.Size = UDim2.new(0.9, 0, 0.2, 0)
    titleLabel.Position = UDim2.new(0.5, 0, 0.1, 0)
    titleLabel.AnchorPoint = Vector2.new(0.5, 0)
    titleLabel.BackgroundTransparency = 1
    titleLabel.Text = title
    titleLabel.TextColor3 = Color3.new(1, 1, 1)
    titleLabel.TextScaled = true
    titleLabel.Font = Enum.Font.GothamBold
    titleLabel.Parent = modal

    -- Message
    local messageLabel = Instance.new("TextLabel")
    messageLabel.Name = "Message"
    messageLabel.Size = UDim2.new(0.9, 0, 0.35, 0)
    messageLabel.Position = UDim2.new(0.5, 0, 0.35, 0)
    messageLabel.AnchorPoint = Vector2.new(0.5, 0)
    messageLabel.BackgroundTransparency = 1
    messageLabel.Text = message
    messageLabel.TextColor3 = Color3.new(0.8, 0.8, 0.8)
    messageLabel.TextScaled = true
    messageLabel.TextWrapped = true
    messageLabel.Font = Enum.Font.Gotham
    messageLabel.Parent = modal

    -- Button container
    local buttonContainer = Instance.new("Frame")
    buttonContainer.Name = "Buttons"
    buttonContainer.Size = UDim2.new(0.9, 0, 0.2, 0)
    buttonContainer.Position = UDim2.new(0.5, 0, 0.8, 0)
    buttonContainer.AnchorPoint = Vector2.new(0.5, 0.5)
    buttonContainer.BackgroundTransparency = 1
    buttonContainer.Parent = modal

    local buttonLayout = Instance.new("UIListLayout")
    buttonLayout.FillDirection = Enum.FillDirection.Horizontal
    buttonLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
    buttonLayout.Padding = UDim.new(0.05, 0)
    buttonLayout.Parent = buttonContainer

    -- Create buttons
    for _, btnData in buttons do
        local button = Instance.new("TextButton")
        button.Size = UDim2.new(0.4, 0, 1, 0)
        button.BackgroundColor3 = Color3.new(0.3, 0.5, 0.8)
        button.Text = btnData.text
        button.TextColor3 = Color3.new(1, 1, 1)
        button.TextScaled = true
        button.Font = Enum.Font.GothamBold
        button.Parent = buttonContainer

        local btnCorner = Instance.new("UICorner")
        btnCorner.CornerRadius = UDim.new(0.2, 0)
        btnCorner.Parent = button

        button.MouseButton1Click:Connect(function()
            btnData.callback()
            screenGui:Destroy()
        end)

        UIAnimations.setupClickEffect(button)
    end

    -- Animate in
    modal.Size = UDim2.new(0, 0, 0, 0)
    UIAnimations.popIn(modal)

    return screenGui
end

-- Usage
local modal = createModal(
    "Confirm Purchase",
    "Buy Legendary Sword for 500 coins?",
    {
        {text = "Yes", callback = function() purchaseItem() end},
        {text = "No", callback = function() end}
    }
)
modal.Parent = player.PlayerGui
```

---

## Accessibility Guidelines

### Text Readability

```lua
--!strict

-- Minimum text sizes
local TEXT_SIZES = {
    title = 0.05,    -- 5% of screen height
    body = 0.03,     -- 3% of screen height
    caption = 0.02   -- 2% of screen height
}

-- High contrast colors
local COLORS = {
    textPrimary = Color3.new(1, 1, 1),
    textSecondary = Color3.new(0.8, 0.8, 0.8),
    background = Color3.new(0.1, 0.1, 0.15),
    accent = Color3.new(0.3, 0.5, 0.8),
    success = Color3.new(0.3, 0.8, 0.3),
    warning = Color3.new(0.9, 0.7, 0.2),
    error = Color3.new(0.9, 0.3, 0.3)
}

-- Ensure readable contrast
local function getContrastRatio(fg: Color3, bg: Color3): number
    local function luminance(c: Color3): number
        local function channel(v: number): number
            return if v <= 0.03928 then v / 12.92 else ((v + 0.055) / 1.055) ^ 2.4
        end
        return 0.2126 * channel(c.R) + 0.7152 * channel(c.G) + 0.0722 * channel(c.B)
    end

    local l1 = luminance(fg)
    local l2 = luminance(bg)
    local lighter = math.max(l1, l2)
    local darker = math.min(l1, l2)

    return (lighter + 0.05) / (darker + 0.05)
end

-- WCAG recommends 4.5:1 for normal text, 3:1 for large text
local MIN_CONTRAST = 4.5
```

### Focus Indicators

```lua
--!strict

local function addFocusIndicator(element: GuiButton)
    local focusFrame = Instance.new("Frame")
    focusFrame.Name = "FocusIndicator"
    focusFrame.Size = UDim2.new(1, 6, 1, 6)
    focusFrame.Position = UDim2.new(0.5, 0, 0.5, 0)
    focusFrame.AnchorPoint = Vector2.new(0.5, 0.5)
    focusFrame.BackgroundTransparency = 1
    focusFrame.BorderSizePixel = 3
    focusFrame.BorderColor3 = Color3.new(1, 1, 0)
    focusFrame.Visible = false
    focusFrame.Parent = element

    element.SelectionGained:Connect(function()
        focusFrame.Visible = true
    end)

    element.SelectionLost:Connect(function()
        focusFrame.Visible = false
    end)
end
```

### Colorblind-Friendly Design

```lua
--!strict

-- Don't rely on color alone - use icons/patterns too
local STATUS_INDICATORS = {
    success = {
        color = Color3.new(0.3, 0.8, 0.3),
        icon = "rbxassetid://123456",  -- Checkmark
        pattern = "solid"
    },
    warning = {
        color = Color3.new(0.9, 0.7, 0.2),
        icon = "rbxassetid://234567",  -- Warning triangle
        pattern = "striped"
    },
    error = {
        color = Color3.new(0.9, 0.3, 0.3),
        icon = "rbxassetid://345678",  -- X mark
        pattern = "dotted"
    }
}
```

---

## Platform-Specific Considerations

### Desktop

```lua
--!strict

local function setupDesktopUI(screenGui: ScreenGui)
    -- Keyboard shortcuts
    local UserInputService = game:GetService("UserInputService")

    UserInputService.InputBegan:Connect(function(input, gameProcessed)
        if gameProcessed then return end

        if input.KeyCode == Enum.KeyCode.I then
            toggleInventory()
        elseif input.KeyCode == Enum.KeyCode.Escape then
            togglePauseMenu()
        end
    end)

    -- Hover states work well on desktop
    for _, button in screenGui:GetDescendants() do
        if button:IsA("GuiButton") then
            UIAnimations.setupHoverEffect(button)
        end
    end
end
```

### Mobile

```lua
--!strict

local function setupMobileUI(screenGui: ScreenGui)
    -- Larger touch targets
    for _, button in screenGui:GetDescendants() do
        if button:IsA("GuiButton") then
            local currentSize = button.Size
            button.Size = UDim2.new(
                math.max(currentSize.X.Scale, 0.12),
                currentSize.X.Offset,
                math.max(currentSize.Y.Scale, 0.08),
                currentSize.Y.Offset
            )
        end
    end

    -- Add virtual joystick for movement
    -- Use gesture-based interactions where appropriate
end
```

### Console (Xbox)

```lua
--!strict

local function setupConsoleUI(screenGui: ScreenGui)
    local GuiService = game:GetService("GuiService")

    -- Enable controller navigation
    GuiService.AutoSelectGuiEnabled = true

    -- Set default selection
    local firstButton = screenGui:FindFirstChildWhichIsA("GuiButton", true)
    if firstButton then
        GuiService.SelectedObject = firstButton
    end

    -- Ensure all interactive elements are selectable
    for _, element in screenGui:GetDescendants() do
        if element:IsA("GuiButton") then
            element.Selectable = true
            addFocusIndicator(element)
        end
    end
end
```

---

## Performance Tips

### UI Update Throttling

```lua
--!strict

local RunService = game:GetService("RunService")

-- Don't update UI every frame for non-critical elements
local UI_UPDATE_RATE = 1/30  -- 30 FPS max for UI updates
local lastUpdate = 0

RunService.Heartbeat:Connect(function(dt)
    lastUpdate += dt

    if lastUpdate >= UI_UPDATE_RATE then
        lastUpdate = 0
        updateNonCriticalUI()
    end
end)

-- Critical UI (health, damage numbers) can update every frame
RunService.RenderStepped:Connect(function()
    updateCriticalUI()
end)
```

### Instance Pooling for Dynamic UI

```lua
--!strict

local function createUIPool(template: GuiObject, size: number)
    local pool = {
        available = {},
        inUse = {}
    }

    for i = 1, size do
        local clone = template:Clone()
        clone.Visible = false
        table.insert(pool.available, clone)
    end

    function pool:acquire(): GuiObject?
        if #pool.available > 0 then
            local obj = table.remove(pool.available)
            obj.Visible = true
            pool.inUse[obj] = true
            return obj
        end
        return nil
    end

    function pool:release(obj: GuiObject)
        if pool.inUse[obj] then
            pool.inUse[obj] = nil
            obj.Visible = false
            table.insert(pool.available, obj)
        end
    end

    return pool
end

-- Usage: Damage number pool
local damageNumberPool = createUIPool(damageNumberTemplate, 20)
```

---

## References

- [Roblox UI Documentation](https://create.roblox.com/docs/ui)
- [Roblox UI Animation Guide](https://create.roblox.com/docs/ui/animation)
- [Material Design Guidelines](https://material.io/design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
