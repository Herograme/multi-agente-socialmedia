---
id: roblox-design-mechanic
name: Design Game Mechanic
agent: "@game-designer"
category: design
complexity: medium
tools:
  - mda-framework
  - balance-calculator
  - playtesting-simulator
checklists:
  - mechanic-design-checklist
  - balance-checklist
---

# Task: Design Game Mechanic

## Purpose

Designs a specific game mechanic in detail using the MDA (Mechanics-Dynamics-Aesthetics) framework. Creates comprehensive mechanic specifications including player interactions, system responses, balancing parameters, and integration points with other game systems. Ensures the mechanic supports the game's design pillars and enhances player experience.

---

## Execution Modes

**Choose your execution mode:**

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)
- Autonomous decision making with logging
- Minimal user interaction
- **Best for:** Simple mechanics, iterations

### 2. Interactive Mode - Balanced, Educational (5-10 prompts) **[DEFAULT]**
- Explicit decision checkpoints for key design choices
- Educational explanations about design theory
- **Best for:** New mechanics, learning game design

### 3. Pre-Flight Planning - Comprehensive Upfront Planning
- Complete design vision alignment upfront
- All stakeholder input gathered first
- **Best for:** Core mechanics, team alignment

**Parameter:** `mode` (optional, default: `interactive`)

---

## Task Definition (AIOS Task Format V1.0)

```yaml
task: designMechanic()
responsavel: "@game-designer"
responsavel_type: Agent
atomic_layer: Design

**Entrada:**
- campo: mechanic_name
  tipo: string
  origem: User Input
  obrigatorio: true
  validacao: Descriptive name for the mechanic
  exemplo: "Gacha Summoning System"

- campo: mechanic_type
  tipo: string
  origem: User Input
  obrigatorio: true
  validacao: One of [core, progression, social, economy, meta, combat, collection]
  exemplo: "collection"

- campo: gdd_reference
  tipo: string
  origem: File Reference
  obrigatorio: true
  validacao: Path to GDD document
  exemplo: "docs/gdd/tower-defense-legends-gdd.md"

- campo: target_experience
  tipo: string
  origem: User Input
  obrigatorio: false
  validacao: Desired player emotion/experience
  exemplo: "Excitement and anticipation from randomized rewards"

- campo: complexity_target
  tipo: string
  origem: User Input
  obrigatorio: false
  validacao: One of [simple, moderate, complex]
  default: "moderate"

- campo: related_systems
  tipo: array
  origem: GDD / User Input
  obrigatorio: false
  validacao: Systems this mechanic interacts with
  exemplo: ["currency", "inventory", "progression"]

**Saida:**
- campo: mechanic_document
  tipo: file
  destino: docs/mechanics/{mechanic-name}.md
  persistido: true

- campo: balance_spreadsheet
  tipo: file
  destino: docs/mechanics/{mechanic-name}-balance.md
  persistido: true

- campo: integration_diagram
  tipo: file
  destino: docs/mechanics/diagrams/{mechanic-name}.mmd
  persistido: true

- campo: playtesting_plan
  tipo: file
  destino: docs/mechanics/{mechanic-name}-playtesting.md
  persistido: true
```

---

## Pre-Conditions

**Purpose:** Validate prerequisites BEFORE task execution (blocking)

**Checklist:**

```yaml
pre-conditions:
  - [ ] GDD exists with core game systems defined
    tipo: pre-condition
    blocker: true
    validacao: |
      Verify GDD has relevant systems for mechanic integration
    error_message: "Pre-condition failed: GDD with core systems required"

  - [ ] Design pillars are established
    tipo: pre-condition
    blocker: true
    validacao: |
      Check that design pillars exist to validate mechanic alignment
    error_message: "Pre-condition failed: Design pillars must be defined"

  - [ ] Mechanic type is valid and appropriate for game
    tipo: pre-condition
    blocker: false
    validacao: |
      Verify mechanic type fits the game genre
    error_message: "Warning: Mechanic type may not fit game genre"
```

---

## Post-Conditions

**Purpose:** Validate execution success AFTER task completes

**Checklist:**

```yaml
post-conditions:
  - [ ] Mechanic is fully specified with MDA framework
    tipo: post-condition
    blocker: true
    validacao: |
      Verify Mechanics, Dynamics, and Aesthetics documented
    error_message: "Post-condition failed: MDA framework incomplete"

  - [ ] Balance parameters are defined and reasonable
    tipo: post-condition
    blocker: true
    validacao: |
      Check balance spreadsheet has initial values
    error_message: "Post-condition failed: Balance parameters missing"

  - [ ] Integration points are documented
    tipo: post-condition
    blocker: true
    validacao: |
      Verify all system connections specified
    error_message: "Post-condition failed: Integration not documented"
```

---

## Acceptance Criteria

**Purpose:** Definitive pass/fail criteria for task completion

**Checklist:**

```yaml
acceptance-criteria:
  - [ ] Mechanic aligns with design pillars
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Assert mechanic supports at least one design pillar
    error_message: "Acceptance criterion not met: Mechanic doesn't align with pillars"

  - [ ] Mechanic is implementable in Roblox
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Verify mechanic works within Roblox constraints
    error_message: "Acceptance criterion not met: Mechanic not feasible in Roblox"

  - [ ] Playtesting plan is actionable
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Check playtesting plan has clear metrics and methods
    error_message: "Acceptance criterion not met: Playtesting plan inadequate"
```

---

## Tools

**External/shared resources used by this task:**

- **Tool:** mda-framework
  - **Purpose:** Apply MDA analysis framework
  - **Source:** squads/roblox-game-studio/templates/mda-template.md

- **Tool:** balance-calculator
  - **Purpose:** Calculate initial balance values
  - **Source:** squads/roblox-game-studio/scripts/balance-calculator.js

- **Tool:** mechanic-patterns
  - **Purpose:** Reference common mechanic patterns
  - **Source:** squads/roblox-game-studio/data/mechanic-patterns.json

---

## Scripts

**Agent-specific code for this task:**

- **Script:** mechanic-designer.js
  - **Purpose:** Generate mechanic documentation
  - **Language:** JavaScript
  - **Location:** squads/roblox-game-studio/scripts/mechanic-designer.js

- **Script:** dynamics-simulator.js
  - **Purpose:** Simulate mechanic dynamics
  - **Language:** JavaScript
  - **Location:** squads/roblox-game-studio/scripts/dynamics-simulator.js

---

## Error Handling

**Strategy:** iterative-refinement

**Common Errors:**

1. **Error:** Mechanic Conflicts with Design Pillar
   - **Cause:** Mechanic undermines established design direction
   - **Resolution:** Redesign mechanic to align with pillars
   - **Recovery:** Provide alternative mechanic approach

2. **Error:** Balance Parameters Unreasonable
   - **Cause:** Initial values create poor player experience
   - **Resolution:** Recalculate using genre benchmarks
   - **Recovery:** Provide recommended ranges

3. **Error:** Mechanic Too Complex for Target Audience
   - **Cause:** Mechanic requires too much learning
   - **Resolution:** Simplify or add progressive disclosure
   - **Recovery:** Split into base + advanced versions

4. **Error:** Integration Creates Conflicts
   - **Cause:** Mechanic creates unintended interactions
   - **Resolution:** Redesign integration points
   - **Recovery:** Add safeguards and limits

---

## Performance

**Expected Metrics:**

```yaml
duration_expected: 15-40 min (estimated)
cost_estimated: $0.01-0.04
token_usage: ~8,000-25,000 tokens
```

**Optimization Notes:**
- Use cached mechanic patterns
- Reference genre-specific examples
- Parallelize MDA analysis sections

---

## Metadata

```yaml
story: N/A
version: 1.0.0
dependencies:
  - gdd-document
tags:
  - game-design
  - mechanics
  - balance
  - roblox
updated_at: 2025-01-28
```

---

## Process

### Phase 1: Context Analysis (5-8 min)

**Purpose:** Understand the mechanic's role in the game

**Steps:**

1. **Load GDD Context**
   - Review design pillars
   - Understand core loop
   - Identify existing systems
   - Note economy constraints
   - Output: Context brief

2. **Analyze Mechanic Purpose**
   - Define why this mechanic exists
   - Identify problems it solves
   - Determine player needs it addresses
   - Establish success criteria
   - Output: Purpose statement

3. **Research Similar Mechanics**
   - Find reference implementations
   - Analyze competitor approaches
   - Note successful patterns
   - Identify pitfalls to avoid
   - Output: Reference analysis

4. **Define Target Experience**
   - Clarify desired player emotions
   - Describe ideal interaction
   - Set engagement goals
   - Define satisfaction metrics
   - Output: Experience goals

5. **Validate Pillar Alignment**
   - Map mechanic to design pillars
   - Ensure no conflicts
   - Identify enhancement opportunities
   - Document alignment rationale
   - Output: Pillar alignment matrix

---

### Phase 2: MDA Framework - Mechanics (8-12 min)

**Purpose:** Define the concrete rules and systems

**Steps:**

1. **Define Core Rules**
   - Specify what the mechanic does
   - Document all rules clearly
   - List conditions and triggers
   - Define boundaries and limits
   - Output: Rule specification

   ```
   Example: Gacha Summoning Rules
   - Player spends currency to perform summon
   - Each summon has defined probability distribution
   - Results are determined server-side
   - Player receives immediate visual/audio feedback
   - Obtained items are added to inventory
   - Duplicate handling: Convert to upgrade currency
   ```

2. **Define Player Inputs**
   - List all player actions
   - Specify input requirements
   - Define valid input ranges
   - Document input validation
   - Output: Input specification

3. **Define System Outputs**
   - List all possible outcomes
   - Specify output conditions
   - Define feedback mechanisms
   - Document edge cases
   - Output: Output specification

4. **Define State Changes**
   - Document state before/after
   - Specify data modifications
   - List affected systems
   - Define persistence rules
   - Output: State change specification

5. **Define Probability Systems** (if applicable)
   - Specify probability distributions
   - Document pity/guarantee systems
   - Define rate-up mechanics
   - Ensure transparency compliance
   - Output: Probability specification

   ```
   Rarity Distribution:
   - Common:    60%
   - Uncommon:  25%
   - Rare:      10%
   - Epic:      4%
   - Legendary: 1%

   Pity System:
   - Soft pity at 50 summons (2x legendary rate)
   - Hard pity at 100 summons (guaranteed legendary)
   ```

6. **Define Resource Costs**
   - Specify currency costs
   - Define time costs (cooldowns)
   - List prerequisites
   - Document cost scaling
   - Output: Cost specification

---

### Phase 3: MDA Framework - Dynamics (5-8 min)

**Purpose:** Analyze emergent behaviors and player interactions

**Steps:**

1. **Identify Emergent Behaviors**
   - Predict player strategies
   - Anticipate meta-gaming
   - Identify optimization paths
   - Note potential exploits
   - Output: Emergent behavior analysis

   ```
   Predicted Behaviors:
   - Hoarding currency until rate-up events
   - Targeting pity timer thresholds
   - Trading information about rates
   - Showing off rare pulls socially
   ```

2. **Map Player Decision Points**
   - Identify meaningful choices
   - Analyze decision depth
   - Evaluate risk/reward balance
   - Ensure agency preservation
   - Output: Decision tree

3. **Analyze Feedback Loops**
   - Identify positive loops (growth)
   - Identify negative loops (balance)
   - Ensure healthy loop balance
   - Plan intervention points
   - Output: Feedback loop diagram

4. **Predict Social Dynamics**
   - Anticipate sharing behaviors
   - Identify comparison effects
   - Plan for community interaction
   - Design social integration
   - Output: Social dynamics analysis

5. **Identify Degenerate Strategies**
   - Find potential exploits
   - Identify unfun optimal play
   - Design countermeasures
   - Plan monitoring metrics
   - Output: Exploit prevention plan

---

### Phase 4: MDA Framework - Aesthetics (5-8 min)

**Purpose:** Define the emotional experiences created

**Steps:**

1. **Define Core Aesthetic Goals**
   - Primary emotion target
   - Secondary emotional beats
   - Emotional journey mapping
   - Player satisfaction drivers
   - Output: Aesthetic goals

   ```
   Gacha Aesthetic Goals:
   - Primary: Excitement/Anticipation during reveal
   - Secondary: Joy from success, Collection satisfaction
   - Journey: Build-up -> Tension -> Release -> Satisfaction
   - Satisfaction: Completion, showing off, power increase
   ```

2. **Design Sensory Feedback**
   - Visual feedback design
   - Audio feedback design
   - Haptic feedback (if applicable)
   - Timing and pacing
   - Output: Feedback design

3. **Plan Narrative Integration**
   - Story/lore connections
   - Character presentation
   - World-building opportunities
   - Fantasy fulfillment
   - Output: Narrative integration plan

4. **Design Anticipation Mechanics**
   - Build-up mechanisms
   - Suspense creation
   - Reveal pacing
   - Celebration moments
   - Output: Anticipation design

5. **Plan for Negative Experiences**
   - Failure mitigation
   - Frustration prevention
   - Recovery mechanisms
   - Consolation design
   - Output: Negative experience handling

---

### Phase 5: Balance Design (5-10 min)

**Purpose:** Create balanced numerical parameters

**Steps:**

1. **Identify Balance Variables**
   - List all tunable parameters
   - Categorize by impact
   - Define acceptable ranges
   - Note interdependencies
   - Output: Variable inventory

2. **Set Initial Values**
   - Research genre benchmarks
   - Apply design intuition
   - Consider progression curve
   - Account for monetization
   - Output: Initial value table

   ```
   Balance Variables:
   | Variable | Initial Value | Min | Max | Notes |
   |----------|---------------|-----|-----|-------|
   | Summon Cost | 100 gems | 50 | 200 | Per single summon |
   | Legendary Rate | 1% | 0.5% | 3% | Base rate |
   | Pity Threshold | 100 | 50 | 150 | Guaranteed after |
   | Multi-Discount | 10% | 0% | 20% | 10x summon discount |
   ```

3. **Model Progression Impact**
   - Calculate time to milestones
   - Model F2P vs paying progression
   - Ensure fair advancement
   - Plan catch-up mechanics
   - Output: Progression model

4. **Test Edge Cases**
   - Extreme luck scenarios
   - Extended bad luck
   - Whale spending patterns
   - New player experience
   - Output: Edge case analysis

5. **Create Tuning Levers**
   - Document how to adjust
   - Define safe adjustment ranges
   - Plan A/B test parameters
   - Create monitoring triggers
   - Output: Tuning guide

6. **Document Balance Philosophy**
   - Explain design intent
   - Justify key decisions
   - Note trade-offs made
   - Plan iteration approach
   - Output: Balance philosophy

---

### Phase 6: System Integration (5-8 min)

**Purpose:** Design connections with other systems

**Steps:**

1. **Map System Dependencies**
   - Identify input systems
   - Identify output systems
   - Document data flows
   - Note timing dependencies
   - Output: Dependency diagram

   ```mermaid
   graph TD
       A[Currency System] -->|Spend| B[Gacha System]
       B -->|Items| C[Inventory System]
       B -->|XP| D[Progression System]
       B -->|Duplicates| E[Upgrade System]
       F[Event System] -->|Rate Changes| B
       B -->|Analytics| G[Tracking System]
   ```

2. **Define API Contracts**
   - Specify function signatures
   - Document parameters
   - Define return values
   - Plan error handling
   - Output: API specification

3. **Plan Event Triggers**
   - Define events emitted
   - List events consumed
   - Document event payloads
   - Note event timing
   - Output: Event specification

4. **Design Failure Modes**
   - Plan for system failures
   - Design fallback behaviors
   - Create recovery paths
   - Document error messages
   - Output: Failure handling plan

5. **Coordinate with Economy**
   - Verify currency flows
   - Check sink/source balance
   - Ensure economy stability
   - Plan for inflation control
   - Output: Economy integration checklist

---

### Phase 7: Documentation & Playtesting (5-8 min)

**Purpose:** Create final deliverables and testing plan

**Steps:**

1. **Compile Mechanic Document**
   - Merge all MDA sections
   - Add visual diagrams
   - Create quick reference
   - Format for team use
   - Output: Complete mechanic document

2. **Create Balance Spreadsheet**
   - Document all variables
   - Include formulas
   - Add simulation helpers
   - Create adjustment log
   - Output: Balance spreadsheet

3. **Generate Integration Diagram**
   - Create Mermaid diagram
   - Document all connections
   - Include data types
   - Note critical paths
   - Output: Integration diagram file

4. **Create Playtesting Plan**
   - Define test scenarios
   - Create metrics to track
   - Design feedback questions
   - Plan iteration cycles
   - Output: Playtesting document

   ```
   Playtesting Plan:
   1. First-Time Experience (N=10)
      - Measure: Time to understand, initial reaction
      - Questions: Was it clear? Was it exciting?

   2. Extended Play (N=5, 1 hour each)
      - Measure: Engagement over time, frustration points
      - Questions: Still fun? What would you change?

   3. Edge Case Testing
      - Test: 100 consecutive summons
      - Test: Pity system activation
      - Test: Rate-up verification
   ```

5. **Update Memory Layer**
   - Store mechanic specification
   - Cache balance values
   - Link to GDD
   - Output: Memory updates

---

## Output Structure

### Mechanic Design Document

```markdown
# Mechanic Design: {Mechanic Name}

**Version:** 1.0
**Last Updated:** {Date}
**Author:** @game-designer
**Type:** {Mechanic Type}
**Complexity:** {simple/moderate/complex}

---

## Overview

### Purpose
{Why this mechanic exists}

### Target Experience
{Desired player emotions and interactions}

### Design Pillar Alignment
| Pillar | Alignment | Notes |
|--------|-----------|-------|
| {Pillar} | Strong/Medium/Weak | {How it aligns} |

---

## MDA Analysis

### Mechanics (Rules)

#### Core Rules
1. {Rule 1}
2. {Rule 2}
3. {Rule 3}

#### Player Inputs
| Input | Description | Validation |
|-------|-------------|------------|
| {Input} | {Description} | {Rules} |

#### System Outputs
| Outcome | Probability | Feedback |
|---------|-------------|----------|
| {Outcome} | {%} | {Feedback} |

#### State Changes
{State change documentation}

### Dynamics (Emergent Behaviors)

#### Predicted Player Strategies
1. {Strategy 1}
2. {Strategy 2}

#### Decision Points
{Decision tree or description}

#### Feedback Loops
```mermaid
{Feedback loop diagram}
```

#### Potential Issues
| Issue | Mitigation |
|-------|------------|
| {Issue} | {Solution} |

### Aesthetics (Emotions)

#### Primary Aesthetic Goals
- {Goal 1}
- {Goal 2}

#### Sensory Feedback
| Moment | Visual | Audio | Timing |
|--------|--------|-------|--------|
| {Moment} | {VFX} | {SFX} | {Seconds} |

#### Emotional Journey
{Journey description or diagram}

---

## Balance Parameters

| Variable | Value | Range | Notes |
|----------|-------|-------|-------|
| {Variable} | {Value} | {Min-Max} | {Notes} |

### Progression Impact
{How mechanic affects progression}

### Economy Impact
{How mechanic affects economy}

---

## System Integration

### Dependencies
```mermaid
{Dependency diagram}
```

### API Specification
```lua
-- Function signatures and documentation
```

### Events
| Event | Direction | Payload |
|-------|-----------|---------|
| {Event} | Emit/Listen | {Data} |

---

## Implementation Notes

### Roblox Considerations
{Platform-specific notes}

### Performance Considerations
{Optimization notes}

### Security Considerations
{Exploit prevention}

---

## Playtesting Plan

### Test Scenarios
1. {Scenario 1}
2. {Scenario 2}

### Metrics to Track
- {Metric 1}
- {Metric 2}

### Success Criteria
- {Criterion 1}
- {Criterion 2}

---

## Appendices

### A. Reference Examples
{Competitor implementations}

### B. Balance Spreadsheet
{Link to spreadsheet}

### C. Iteration Log
| Date | Change | Reason | Result |
|------|--------|--------|--------|
```

---

## Usage Examples

### Example 1: Design Gacha System

```bash
@game-designer
*design-mechanic "Gacha Summoning" --type collection --gdd "docs/gdd/tdl-gdd.md" --target-experience "Excitement from randomized rewards"
```

### Example 2: Design Combat Mechanic

```bash
@game-designer
*design-mechanic "Combo System" --type combat --gdd "docs/gdd/fighter-gdd.md" --complexity complex
```

### Example 3: Design Social Mechanic

```bash
@game-designer
*design-mechanic "Trading System" --type social --gdd "docs/gdd/sim-gdd.md" --related-systems "inventory,economy,social"
```

---

## Integration Points

- **Input from:** Game Designer (GDD), Market Analyst (competitor analysis)
- **Output to:** Lua Scripter (implementation), UI/UX Designer (feedback), Monetization Strategist (economy)
- **Triggers:** New feature request, balance iteration, player feedback
- **Updates Memory:** Mechanic specifications, balance parameters, integration maps
