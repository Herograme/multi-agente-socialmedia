---
id: roblox-create-style-guide
name: Create Style Guide
agent: "@ui-ux-designer"
category: design
complexity: medium
tools:
  - figma-integration
  - color-palette-generator
  - typography-system
checklists:
  - style-guide-completeness
  - accessibility-checklist
---

# Task: Create Style Guide

## Purpose

Creates a comprehensive visual style guide for Roblox games that ensures consistent UI/UX across all screens and states. Defines color systems, typography, component patterns, animations, and responsive guidelines optimized for Roblox's multi-platform environment (PC, mobile, console).

---

## Execution Modes

**Choose your execution mode:**

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)
- Autonomous decision making with logging
- Minimal user interaction
- **Best for:** Style updates, simple games

### 2. Interactive Mode - Balanced, Educational (5-10 prompts) **[DEFAULT]**
- Explicit decision checkpoints for color and typography
- Educational explanations about design choices
- **Best for:** New style guides, learning

### 3. Pre-Flight Planning - Comprehensive Upfront Planning
- Complete brand vision alignment upfront
- All stakeholder input on aesthetics first
- **Best for:** Team projects, branded games

**Parameter:** `mode` (optional, default: `interactive`)

---

## Task Definition (AIOS Task Format V1.0)

```yaml
task: createStyleGuide()
responsavel: "@ui-ux-designer"
responsavel_type: Agent
atomic_layer: Design

**Entrada:**
- campo: game_name
  tipo: string
  origem: User Input
  obrigatorio: true
  validacao: Valid game name
  exemplo: "Tower Defense Legends"

- campo: gdd_reference
  tipo: string
  origem: File Reference
  obrigatorio: true
  validacao: Path to GDD document
  exemplo: "docs/gdd/tower-defense-legends-gdd.md"

- campo: visual_style
  tipo: string
  origem: User Input
  obrigatorio: false
  validacao: One of [anime, realistic, cartoon, pixel, minimalist, custom]
  default: "cartoon"

- campo: color_mood
  tipo: string
  origem: User Input
  obrigatorio: false
  validacao: Mood description or hex colors
  exemplo: "Vibrant and energetic" or "#FF5733, #33FF57"

- campo: target_platforms
  tipo: array
  origem: User Input
  obrigatorio: false
  validacao: Array of [mobile, pc, console, vr]
  default: ["mobile", "pc"]

- campo: reference_games
  tipo: array
  origem: User Input
  obrigatorio: false
  validacao: List of reference game names
  exemplo: ["Adopt Me", "Pet Simulator X"]

**Saida:**
- campo: style_guide_document
  tipo: file
  destino: docs/style-guide/{game-name}-style-guide.md
  persistido: true

- campo: color_palette
  tipo: file
  destino: docs/style-guide/{game-name}-colors.md
  persistido: true

- campo: component_library
  tipo: file
  destino: docs/style-guide/{game-name}-components.md
  persistido: true

- campo: lua_theme_module
  tipo: file
  destino: templates/roblox/{game-name}/Theme.lua
  persistido: true
```

---

## Pre-Conditions

**Purpose:** Validate prerequisites BEFORE task execution (blocking)

**Checklist:**

```yaml
pre-conditions:
  - [ ] GDD exists with game identity defined
    tipo: pre-condition
    blocker: true
    validacao: |
      Verify GDD has design pillars and target audience
    error_message: "Pre-condition failed: GDD with design pillars required"

  - [ ] Target audience and platforms defined
    tipo: pre-condition
    blocker: true
    validacao: |
      Check audience age range and target platforms
    error_message: "Pre-condition failed: Target audience must be defined"

  - [ ] Visual style direction established
    tipo: pre-condition
    blocker: false
    validacao: |
      Check if visual style is specified; elicit if not
    error_message: "Warning: Visual style will be determined during process"
```

---

## Post-Conditions

**Purpose:** Validate execution success AFTER task completes

**Checklist:**

```yaml
post-conditions:
  - [ ] Color palette is complete with all required colors
    tipo: post-condition
    blocker: true
    validacao: |
      Verify primary, secondary, accent, semantic, and neutral colors defined
    error_message: "Post-condition failed: Color palette incomplete"

  - [ ] Typography system covers all text needs
    tipo: post-condition
    blocker: true
    validacao: |
      Check header, body, button, and special text styles
    error_message: "Post-condition failed: Typography incomplete"

  - [ ] Component patterns documented
    tipo: post-condition
    blocker: true
    validacao: |
      Verify buttons, inputs, cards, modals documented
    error_message: "Post-condition failed: Component patterns missing"
```

---

## Acceptance Criteria

**Purpose:** Definitive pass/fail criteria for task completion

**Checklist:**

```yaml
acceptance-criteria:
  - [ ] Style guide is implementable in Roblox
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Assert all specifications work within Roblox constraints
    error_message: "Acceptance criterion not met: Specifications not Roblox-compatible"

  - [ ] Responsive guidelines cover all target platforms
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Check mobile, PC, and console adaptations documented
    error_message: "Acceptance criterion not met: Missing platform guidelines"

  - [ ] Accessibility requirements met
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Verify contrast ratios, text sizes, touch targets
    error_message: "Acceptance criterion not met: Accessibility issues"
```

---

## Tools

**External/shared resources used by this task:**

- **Tool:** color-palette-generator
  - **Purpose:** Generate harmonious color palettes
  - **Source:** squads/roblox-game-studio/scripts/color-generator.js

- **Tool:** typography-system
  - **Purpose:** Generate typography scale
  - **Source:** squads/roblox-game-studio/scripts/typography-generator.js

- **Tool:** roblox-ui-reference
  - **Purpose:** Reference Roblox UI best practices
  - **Source:** Roblox Developer Hub UI Guidelines

---

## Scripts

**Agent-specific code for this task:**

- **Script:** style-guide-generator.js
  - **Purpose:** Generate style guide documentation
  - **Language:** JavaScript
  - **Location:** squads/roblox-game-studio/scripts/style-guide-generator.js

- **Script:** theme-exporter.js
  - **Purpose:** Export theme to Lua module
  - **Language:** JavaScript
  - **Location:** squads/roblox-game-studio/scripts/theme-exporter.js

---

## Error Handling

**Strategy:** iterative-refinement

**Common Errors:**

1. **Error:** Color Contrast Fails Accessibility
   - **Cause:** Color combinations don't meet WCAG guidelines
   - **Resolution:** Adjust colors to improve contrast
   - **Recovery:** Provide alternative color pairs

2. **Error:** Font Not Available in Roblox
   - **Cause:** Specified font not in Roblox font library
   - **Resolution:** Use closest Roblox alternative
   - **Recovery:** Map to available fonts with similar style

3. **Error:** Component Too Complex for Roblox
   - **Cause:** Design exceeds Roblox UI capabilities
   - **Resolution:** Simplify component design
   - **Recovery:** Provide achievable alternative

---

## Performance

**Expected Metrics:**

```yaml
duration_expected: 20-45 min (estimated)
cost_estimated: $0.01-0.04
token_usage: ~10,000-25,000 tokens
```

**Optimization Notes:**
- Use pre-computed color harmonies
- Cache platform-specific templates
- Reuse common component patterns

---

## Metadata

```yaml
story: N/A
version: 1.0.0
dependencies:
  - gdd-document
tags:
  - ui-ux
  - style-guide
  - design
  - roblox
updated_at: 2025-01-28
```

---

## Process

### Phase 1: Design Analysis (5-10 min)

**Purpose:** Understand game identity and visual requirements

**Steps:**

1. **Parse GDD for Visual Direction**
   - Extract design pillars
   - Identify target emotions
   - Note genre conventions
   - Review competitor aesthetics
   - Output: Visual direction brief

2. **Analyze Target Audience**
   - Consider age-appropriate visuals
   - Review platform preferences
   - Note cultural considerations
   - Assess accessibility needs
   - Output: Audience visual profile

3. **Review Reference Games**
   - Analyze specified reference games
   - Extract successful visual patterns
   - Identify differentiation opportunities
   - Note common conventions
   - Output: Reference analysis

4. **Define Visual Pillars**
   - Establish 3-5 visual design pillars
   - Examples: "Playful", "Premium", "Readable", "Immersive"
   - Create do's and don'ts for each
   - Output: Visual pillar definitions

5. **Establish Platform Requirements**
   - Mobile: Touch targets, thumb zones
   - PC: Mouse hover states, keyboard nav
   - Console: Controller navigation, safe zones
   - Output: Platform requirement matrix

---

### Phase 2: Color System (5-10 min)

**Purpose:** Create comprehensive color palette

**Steps:**

1. **Define Primary Colors**
   - Select main brand color
   - Create light and dark variants (5-7 shades)
   - Ensure sufficient contrast range
   - Test on dark and light backgrounds
   - Output: Primary color scale

   ```
   Primary:
   - 50:  #E8F4FF (lightest)
   - 100: #C7E4FF
   - 200: #9ACFFF
   - 300: #5DB3FF
   - 400: #2196F3 (main)
   - 500: #1976D2
   - 600: #1565C0
   - 700: #0D47A1
   - 800: #0A3D91
   - 900: #052E6E (darkest)
   ```

2. **Define Secondary Colors**
   - Select complementary color
   - Create shade scale
   - Ensure harmony with primary
   - Output: Secondary color scale

3. **Define Accent Colors**
   - Select attention-grabbing accent
   - Use sparingly for emphasis
   - Ensure stands out from primary/secondary
   - Output: Accent color scale

4. **Define Semantic Colors**
   - Success (green tones)
   - Warning (yellow/orange tones)
   - Error (red tones)
   - Info (blue tones)
   - Create scales for each
   - Output: Semantic color scales

5. **Define Neutral Colors**
   - Background colors
   - Text colors (primary, secondary, disabled)
   - Border colors
   - Shadow colors
   - Output: Neutral color scale

6. **Create Color Usage Guidelines**
   - Document when to use each color
   - Specify color combinations
   - Define color accessibility pairs
   - Create color contrast matrix
   - Output: Color usage guide

7. **Test Accessibility**
   - Check WCAG AA contrast ratios
   - Test color-blind safe combinations
   - Verify readability at small sizes
   - Output: Accessibility compliance report

---

### Phase 3: Typography System (5-10 min)

**Purpose:** Define consistent typography rules

**Steps:**

1. **Select Font Families**
   - Choose from Roblox available fonts:
     - Gotham (modern, clean)
     - SourceSans (readable, versatile)
     - BuilderSans (playful)
     - FredokaOne (fun, rounded)
     - Montserrat (professional)
   - Assign: Primary (headings), Secondary (body)
   - Output: Font selection

2. **Define Type Scale**
   - Create modular scale (1.25x or 1.333x ratio)
   - Define sizes for: H1, H2, H3, H4, Body, Small, Tiny
   - Account for mobile/PC differences
   - Output: Type scale specification

   ```
   Type Scale (1.25 ratio):
   - H1: 32px / 40 line-height
   - H2: 26px / 32 line-height
   - H3: 21px / 28 line-height
   - H4: 17px / 24 line-height
   - Body: 14px / 20 line-height
   - Small: 12px / 16 line-height
   - Tiny: 10px / 14 line-height
   ```

3. **Define Text Styles**
   - Header styles (weight, spacing, transform)
   - Body styles (default, emphasis, secondary)
   - Button text styles
   - Label styles
   - Output: Text style definitions

4. **Define Line Heights**
   - Headers: 1.2-1.3
   - Body text: 1.4-1.5
   - UI elements: 1.2
   - Output: Line height guide

5. **Define Letter Spacing**
   - Headers: -0.5 to 0
   - Body: 0
   - All caps: +1 to +2
   - Output: Letter spacing guide

6. **Platform Adaptations**
   - Mobile: Minimum 14px body text
   - PC: Can use smaller sizes
   - Console: Larger text for distance
   - Output: Platform typography rules

---

### Phase 4: Component Design (10-15 min)

**Purpose:** Define reusable UI component patterns

**Steps:**

1. **Button Components**
   - Primary button (main CTA)
   - Secondary button (alternative action)
   - Tertiary button (low emphasis)
   - Icon button
   - Define states: Default, Hover, Pressed, Disabled, Loading
   - Sizes: Small, Medium, Large
   - Output: Button specification

   ```lua
   -- Button Specification
   Button = {
       Primary = {
           Background = Colors.Primary[400],
           Text = Colors.Neutral.White,
           Border = "none",
           Hover = Colors.Primary[500],
           Pressed = Colors.Primary[600],
           Disabled = {
               Background = Colors.Neutral[300],
               Text = Colors.Neutral[500],
           },
       },
       Sizes = {
           Small = { Height = 32, Padding = 12, FontSize = 12 },
           Medium = { Height = 40, Padding = 16, FontSize = 14 },
           Large = { Height = 48, Padding = 20, FontSize = 16 },
       },
       BorderRadius = 8,
   }
   ```

2. **Input Components**
   - Text input
   - Number input
   - Dropdown/Select
   - Toggle/Switch
   - Checkbox
   - Radio button
   - Define states for each
   - Output: Input specification

3. **Card Components**
   - Content card
   - Item card (inventory)
   - Character card
   - Reward card
   - Define padding, borders, shadows
   - Output: Card specification

4. **Modal/Dialog Components**
   - Confirmation modal
   - Information modal
   - Input modal
   - Full-screen modal
   - Define overlay, animations
   - Output: Modal specification

5. **Navigation Components**
   - Tab bar
   - Bottom navigation (mobile)
   - Side navigation
   - Breadcrumbs
   - Output: Navigation specification

6. **Feedback Components**
   - Toast notifications
   - Progress bars
   - Loading spinners
   - Success/Error states
   - Output: Feedback specification

7. **List Components**
   - Simple list
   - Icon list
   - Image list
   - Selectable list
   - Output: List specification

8. **Create Component Tokens**
   - Border radius tokens
   - Shadow tokens
   - Spacing tokens
   - Transition tokens
   - Output: Component tokens

---

### Phase 5: Animation & Motion (5-10 min)

**Purpose:** Define consistent motion design

**Steps:**

1. **Define Timing Functions**
   - Ease-out: UI feedback (fast)
   - Ease-in-out: Page transitions
   - Linear: Progress animations
   - Output: Timing function library

2. **Define Duration Scale**
   - Micro: 100ms (hovers, toggles)
   - Small: 200ms (button press)
   - Medium: 300ms (modals appear)
   - Large: 500ms (page transitions)
   - Output: Duration scale

3. **Define Common Animations**
   - Fade in/out
   - Slide in/out (directions)
   - Scale in/out
   - Bounce
   - Pulse
   - Output: Animation library

4. **Define Transition Guidelines**
   - When to animate
   - What NOT to animate
   - Performance considerations
   - Mobile-specific rules
   - Output: Animation guidelines

5. **Create Roblox TweenInfo Presets**
   - Standard UI transitions
   - Button feedback
   - Modal animations
   - Output: TweenInfo preset code

   ```lua
   -- Animation Presets
   Animations = {
       Fast = TweenInfo.new(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
       Normal = TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
       Slow = TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut),
       Bounce = TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
       Spring = TweenInfo.new(0.4, Enum.EasingStyle.Elastic, Enum.EasingDirection.Out),
   }
   ```

---

### Phase 6: Responsive Guidelines (5-10 min)

**Purpose:** Ensure UI works across all platforms

**Steps:**

1. **Define Breakpoints**
   - Mobile portrait: < 500px
   - Mobile landscape: < 800px
   - Tablet: < 1200px
   - Desktop: >= 1200px
   - Output: Breakpoint definitions

2. **Mobile-Specific Guidelines**
   - Minimum touch target: 44x44px
   - Thumb zone awareness
   - Bottom navigation preference
   - Hide on-screen keyboard considerations
   - Safe area insets
   - Output: Mobile guidelines

3. **Console-Specific Guidelines**
   - Safe zone (90% inner area)
   - Focus indicators
   - Controller navigation patterns
   - Large text requirements (10-foot UI)
   - Output: Console guidelines

4. **Layout Adaptation Rules**
   - Grid system changes per platform
   - Component scaling rules
   - Text size adjustments
   - Spacing adjustments
   - Output: Responsive rules

5. **Create Platform Detection Code**
   - Device type detection
   - Screen size detection
   - Orientation handling
   - Output: Platform detection utility

   ```lua
   -- Platform Detection
   local function getPlatform()
       local userInput = game:GetService("UserInputService")

       if userInput.TouchEnabled and not userInput.KeyboardEnabled then
           return "Mobile"
       elseif userInput.GamepadEnabled then
           return "Console"
       else
           return "PC"
       end
   end
   ```

---

### Phase 7: Documentation & Export (5-10 min)

**Purpose:** Create final deliverables

**Steps:**

1. **Compile Style Guide Document**
   - Merge all sections
   - Add visual examples
   - Create table of contents
   - Output: Complete style guide

2. **Create Color Palette Document**
   - Export color values (Hex, RGB)
   - Create visual swatches
   - Document usage guidelines
   - Output: Color palette reference

3. **Create Component Library Document**
   - Export component specifications
   - Include visual examples
   - Document props and states
   - Output: Component library

4. **Generate Lua Theme Module**
   - Export colors to Lua
   - Export typography to Lua
   - Export component tokens
   - Create helper functions
   - Output: Theme.lua module

   ```lua
   -- Theme.lua
   local Theme = {}

   Theme.Colors = {
       Primary = {
           [50] = Color3.fromHex("#E8F4FF"),
           [100] = Color3.fromHex("#C7E4FF"),
           -- ...
           [400] = Color3.fromHex("#2196F3"),
           -- ...
       },
       -- Secondary, Accent, Semantic, Neutral...
   }

   Theme.Typography = {
       H1 = { Font = Enum.Font.GothamBold, Size = 32 },
       H2 = { Font = Enum.Font.GothamBold, Size = 26 },
       Body = { Font = Enum.Font.Gotham, Size = 14 },
       -- ...
   }

   Theme.Spacing = {
       xs = 4,
       sm = 8,
       md = 16,
       lg = 24,
       xl = 32,
   }

   Theme.BorderRadius = {
       sm = UDim.new(0, 4),
       md = UDim.new(0, 8),
       lg = UDim.new(0, 12),
       full = UDim.new(0.5, 0),
   }

   return Theme
   ```

5. **Update Memory Layer**
   - Store style guide reference
   - Cache color palette
   - Link to GDD
   - Output: Memory updates

---

## Output Structure

### Style Guide Document

```markdown
# Style Guide: {Game Name}

**Version:** 1.0
**Last Updated:** {Date}
**Author:** @ui-ux-designer

---

## Visual Identity

### Visual Pillars
1. {Pillar 1} - {Description}
2. {Pillar 2} - {Description}
3. {Pillar 3} - {Description}

### Style Direction
{Description of overall visual style}

---

## Color System

### Primary Palette
| Shade | Hex | RGB | Usage |
|-------|-----|-----|-------|
| 50 | #E8F4FF | rgb(232,244,255) | Backgrounds |
| 400 | #2196F3 | rgb(33,150,243) | Main actions |
| ... | ... | ... | ... |

### Secondary Palette
{Secondary colors}

### Semantic Colors
| Type | Color | Usage |
|------|-------|-------|
| Success | #4CAF50 | Positive feedback |
| Warning | #FF9800 | Caution states |
| Error | #F44336 | Error states |
| Info | #2196F3 | Information |

### Color Accessibility
| Combination | Contrast | WCAG |
|-------------|----------|------|
| Primary on White | 4.5:1 | AA |
| ... | ... | ... |

---

## Typography

### Font Families
- **Primary:** Gotham (headers, emphasis)
- **Secondary:** SourceSans (body, UI)

### Type Scale
| Style | Font | Size | Weight | Line Height |
|-------|------|------|--------|-------------|
| H1 | Gotham | 32px | Bold | 1.25 |
| Body | SourceSans | 14px | Regular | 1.5 |
| ... | ... | ... | ... | ... |

---

## Components

### Buttons
{Button specifications with visuals}

### Inputs
{Input specifications with visuals}

### Cards
{Card specifications with visuals}

### Modals
{Modal specifications with visuals}

---

## Animation

### Timing Functions
{Timing function specifications}

### Duration Scale
{Duration specifications}

### Common Animations
{Animation library}

---

## Responsive Guidelines

### Breakpoints
{Breakpoint definitions}

### Mobile Guidelines
{Mobile-specific rules}

### Console Guidelines
{Console-specific rules}

---

## Implementation

### Theme Module
`templates/roblox/{game-name}/Theme.lua`

### Usage Example
```lua
local Theme = require(game.ReplicatedStorage.Theme)

local button = Instance.new("TextButton")
button.BackgroundColor3 = Theme.Colors.Primary[400]
button.Font = Theme.Typography.Button.Font
button.TextSize = Theme.Typography.Button.Size
```

---

## Appendices

### A. Color Palette Export
{All colors in various formats}

### B. Complete Component Library
{All components detailed}

### C. Platform-Specific Overrides
{Override specifications}
```

---

## Usage Examples

### Example 1: Cartoon Style Guide

```bash
@ui-ux-designer
*create-style-guide "Tower Defense Legends" --gdd "docs/gdd/tdl-gdd.md" --visual-style cartoon --color-mood "Vibrant and playful"
```

### Example 2: Anime Style Guide

```bash
@ui-ux-designer
*create-style-guide "Anime Fighters" --gdd "docs/gdd/af-gdd.md" --visual-style anime --reference-games "Anime Adventures,All Star Tower Defense"
```

### Example 3: Minimalist Style Guide

```bash
@ui-ux-designer
*create-style-guide "Zen Garden Simulator" --gdd "docs/gdd/zgs-gdd.md" --visual-style minimalist --color-mood "Calm and serene"
```

---

## Integration Points

- **Input from:** Game Designer (GDD), Market Analyst (competitor aesthetics)
- **Output to:** Lua Scripter (Theme.lua), UI developers, Asset artists
- **Triggers:** GDD completion, visual direction change, platform addition
- **Updates Memory:** Color palette, typography, component patterns
