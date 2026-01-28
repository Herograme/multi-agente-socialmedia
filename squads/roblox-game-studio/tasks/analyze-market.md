---
id: roblox-analyze-market
name: Analyze Market
agent: "@market-analyst"
category: research
complexity: high
tools:
  - romonitor-stats
  - web-search
  - data-analysis
checklists:
  - market-analysis-validation
---

# Task: Analyze Market

## Purpose

Performs comprehensive Roblox market analysis to validate game ideas, identify opportunities, understand competitive landscape, and provide data-driven recommendations for game development decisions. Uses real CCU data from RoMonitor Stats and structured competitive analysis frameworks.

---

## Execution Modes

**Choose your execution mode:**

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)
- Autonomous decision making with logging
- Minimal user interaction
- **Best for:** Quick competitive scans, trend checks

### 2. Interactive Mode - Balanced, Educational (5-10 prompts) **[DEFAULT]**
- Explicit decision checkpoints
- Educational explanations about market dynamics
- **Best for:** Full market analysis, learning Roblox ecosystem

### 3. Pre-Flight Planning - Comprehensive Upfront Planning
- Complete research scope definition upfront
- Zero ambiguity execution
- **Best for:** Investment decisions, major pivots

**Parameter:** `mode` (optional, default: `interactive`)

---

## Task Definition (AIOS Task Format V1.0)

```yaml
task: analyzeMarket()
responsavel: "@market-analyst"
responsavel_type: Agent
atomic_layer: Research

**Entrada:**
- campo: game_concept
  tipo: string
  origem: User Input
  obrigatorio: true
  validacao: Brief description of game idea (10-500 chars)
  exemplo: "Anime-style tower defense with gacha mechanics"

- campo: genre
  tipo: string
  origem: User Input
  obrigatorio: true
  validacao: One of [Simulator, RPG, Tycoon, Obby, FPS, Horror, Social, Racing, Fighting, Adventure]
  exemplo: "Tower Defense"

- campo: target_audience
  tipo: string
  origem: User Input
  obrigatorio: false
  validacao: Age range and demographics
  default: "8-16, global"

- campo: analysis_depth
  tipo: string
  origem: User Input
  obrigatorio: false
  validacao: One of [quick, standard, comprehensive]
  default: "standard"

- campo: competitors
  tipo: array
  origem: User Input
  obrigatorio: false
  validacao: List of 3-10 competitor game names
  exemplo: ["All Star Tower Defense", "Toilet Tower Defense"]

**Saida:**
- campo: market_report
  tipo: object
  destino: File (docs/market-analysis/{game-name}.md)
  persistido: true

- campo: swot_analysis
  tipo: object
  destino: Memory
  persistido: true

- campo: recommendations
  tipo: array
  destino: Memory + File
  persistido: true

- campo: risk_assessment
  tipo: object
  destino: File
  persistido: true
```

---

## Pre-Conditions

**Purpose:** Validate prerequisites BEFORE task execution (blocking)

**Checklist:**

```yaml
pre-conditions:
  - [ ] Game concept is clearly defined with genre and target audience
    tipo: pre-condition
    blocker: true
    validacao: |
      Verify game concept has minimum 10 characters, genre is valid
    error_message: "Pre-condition failed: Game concept must be clearly defined"

  - [ ] Access to RoMonitor Stats or equivalent CCU data source available
    tipo: pre-condition
    blocker: false
    validacao: |
      Check if RoMonitor data is accessible; fallback to public estimates
    error_message: "Warning: Using estimated CCU data"

  - [ ] At least 3 competitor games identified for analysis
    tipo: pre-condition
    blocker: false
    validacao: |
      Verify competitor list; auto-discover if not provided
    error_message: "Warning: Will auto-discover competitors in genre"
```

---

## Post-Conditions

**Purpose:** Validate execution success AFTER task completes

**Checklist:**

```yaml
post-conditions:
  - [ ] Market report generated with all required sections
    tipo: post-condition
    blocker: true
    validacao: |
      Verify report has: Executive Summary, Market Size, Competitor Analysis, SWOT, Recommendations
    error_message: "Post-condition failed: Market report incomplete"

  - [ ] CCU data collected for at least 5 competitor games
    tipo: post-condition
    blocker: false
    validacao: |
      Check competitor data completeness
    error_message: "Warning: Limited competitor data available"

  - [ ] Risk assessment and go/no-go recommendation provided
    tipo: post-condition
    blocker: true
    validacao: |
      Verify risk matrix and final recommendation exist
    error_message: "Post-condition failed: Missing risk assessment"
```

---

## Acceptance Criteria

**Purpose:** Definitive pass/fail criteria for task completion

**Checklist:**

```yaml
acceptance-criteria:
  - [ ] Report provides actionable insights with data backing
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Assert all recommendations have supporting data points
    error_message: "Acceptance criterion not met: Recommendations lack data support"

  - [ ] SWOT analysis is complete with at least 3 items per quadrant
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Check SWOT has minimum items
    error_message: "Acceptance criterion not met: SWOT analysis incomplete"

  - [ ] Competitor analysis covers monetization, features, and player counts
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Verify competitor analysis depth
    error_message: "Acceptance criterion not met: Competitor analysis lacks depth"
```

---

## Tools

**External/shared resources used by this task:**

- **Tool:** romonitor-stats
  - **Purpose:** Real-time and historical CCU data for Roblox games
  - **Source:** https://romonitorstats.com API / Web scraping

- **Tool:** web-search (EXA)
  - **Purpose:** Research competitor information, news, updates
  - **Source:** MCP docker-gateway EXA integration

- **Tool:** roblox-api
  - **Purpose:** Game metadata, favorites, likes, player counts
  - **Source:** Roblox Public API

---

## Scripts

**Agent-specific code for this task:**

- **Script:** market-data-collector.js
  - **Purpose:** Aggregate CCU and game metrics from multiple sources
  - **Language:** JavaScript
  - **Location:** squads/roblox-game-studio/scripts/market-data-collector.js

- **Script:** competitor-analyzer.js
  - **Purpose:** Parse and structure competitor information
  - **Language:** JavaScript
  - **Location:** squads/roblox-game-studio/scripts/competitor-analyzer.js

---

## Error Handling

**Strategy:** fallback

**Common Errors:**

1. **Error:** RoMonitor Stats Unavailable
   - **Cause:** API rate limiting or service downtime
   - **Resolution:** Use cached data or Roblox public API estimates
   - **Recovery:** Continue with limited data, note confidence level

2. **Error:** No Competitors Found
   - **Cause:** Niche genre or incorrect search terms
   - **Resolution:** Expand genre definition, use broader search
   - **Recovery:** Use adjacent genre competitors for comparison

3. **Error:** Insufficient Market Data
   - **Cause:** New or emerging genre with limited games
   - **Resolution:** Analyze adjacent markets, use proxy metrics
   - **Recovery:** Provide blue ocean opportunity analysis instead

---

## Performance

**Expected Metrics:**

```yaml
duration_expected: 15-45 min (estimated)
cost_estimated: $0.01-0.05
token_usage: ~8,000-25,000 tokens
```

**Optimization Notes:**
- Cache RoMonitor data for 24 hours to reduce API calls
- Parallelize competitor research for multiple games
- Use pre-computed genre benchmarks when available

---

## Metadata

```yaml
story: N/A
version: 1.0.0
dependencies:
  - romonitor-integration
  - competitor-database
tags:
  - market-research
  - competitive-analysis
  - roblox
updated_at: 2025-01-28
```

---

## Process

### Phase 1: Research Setup (5-10 min)

**Purpose:** Define scope and gather initial data sources

**Steps:**

1. **Validate Game Concept**
   - Parse game concept description for key elements
   - Identify primary and secondary genres
   - Determine monetization model indicators
   - Output: Structured concept brief

2. **Identify Genre Benchmarks**
   - Query genre database for top performers
   - Get average CCU, revenue, and retention benchmarks
   - Identify genre-specific success patterns
   - Output: Genre benchmark card

3. **Discover Competitors**
   - If competitors not provided, search RoMonitor by genre
   - Filter by CCU (minimum 1,000 peak CCU)
   - Rank by relevance to concept
   - Select top 5-10 for deep analysis
   - Output: Competitor shortlist with initial metrics

4. **Setup Data Collection**
   - Initialize RoMonitor API connections
   - Prepare data collection templates
   - Set up parallel research tasks
   - Output: Research task queue

---

### Phase 2: CCU & Metrics Analysis (10-15 min)

**Purpose:** Collect and analyze quantitative market data

**Steps:**

1. **Collect CCU Data**
   - Fetch 30-day CCU history for each competitor
   - Calculate peak, average, and minimum CCU
   - Identify growth/decline trends
   - Note seasonal patterns
   - Output: CCU trend charts data

2. **Analyze Player Engagement**
   - Fetch play time metrics (if available)
   - Calculate visit-to-favorite ratio
   - Analyze like/dislike ratios
   - Estimate DAU/MAU patterns
   - Output: Engagement metrics matrix

3. **Estimate Revenue Potential**
   - Apply genre-specific ARPPU estimates
   - Calculate potential revenue range based on CCU
   - Compare to genre benchmarks
   - Factor in monetization model
   - Output: Revenue projection model

4. **Calculate Market Size**
   - Sum total genre CCU
   - Estimate total addressable market (TAM)
   - Calculate serviceable addressable market (SAM)
   - Define target market share
   - Output: Market size estimates

5. **Identify Market Trends**
   - Compare current vs 6-month ago metrics
   - Identify growing vs declining games
   - Spot emerging patterns
   - Note platform-wide trends (mobile, console)
   - Output: Trend analysis report

---

### Phase 3: Competitive Analysis (10-15 min)

**Purpose:** Deep dive into competitor strategies and positioning

**Steps:**

1. **Feature Matrix Construction**
   - List core features of each competitor
   - Categorize: Core gameplay, Social, Progression, Monetization
   - Identify feature gaps and saturation
   - Output: Feature comparison matrix

2. **Monetization Strategy Analysis**
   - Document each competitor's monetization model
   - Catalog Game Passes and prices
   - Analyze Dev Product offerings
   - Evaluate premium currency systems
   - Calculate estimated conversion rates
   - Output: Monetization strategy cards

3. **Update Frequency Analysis**
   - Track update history for each competitor
   - Measure update impact on CCU
   - Identify successful update patterns
   - Note community response to updates
   - Output: Update cadence report

4. **Community Sentiment Analysis**
   - Review recent community feedback
   - Analyze social media presence
   - Check Discord/community activity
   - Identify common complaints and praises
   - Output: Sentiment summary

5. **Differentiation Opportunities**
   - Identify underserved player needs
   - Find feature gaps across competitors
   - Spot positioning opportunities
   - Note potential unique selling points
   - Output: Differentiation opportunity list

---

### Phase 4: Strategic Analysis (5-10 min)

**Purpose:** Apply strategic frameworks for insights

**Steps:**

1. **SWOT Analysis**
   - **Strengths:** Internal advantages of proposed concept
   - **Weaknesses:** Internal limitations and gaps
   - **Opportunities:** External market opportunities
   - **Threats:** External risks and competition
   - Ensure minimum 3 items per quadrant
   - Output: SWOT matrix

2. **Porter's Five Forces Analysis**
   - **Threat of New Entrants:** Barrier to entry in genre
   - **Bargaining Power of Players:** Player switching costs
   - **Threat of Substitutes:** Alternative entertainment
   - **Competitive Rivalry:** Intensity of competition
   - **Bargaining Power of Platform:** Roblox's influence
   - Output: Five Forces diagram

3. **Competitive Positioning Map**
   - Define 2 key differentiating axes
   - Plot all competitors on map
   - Identify white space opportunities
   - Recommend positioning strategy
   - Output: Positioning map visualization

4. **Risk Assessment Matrix**
   - Identify key risks (market, technical, competitive)
   - Rate probability (1-5) and impact (1-5)
   - Calculate risk scores
   - Prioritize mitigation strategies
   - Output: Risk matrix with mitigation plans

---

### Phase 5: Recommendations & Report (5-10 min)

**Purpose:** Synthesize findings into actionable recommendations

**Steps:**

1. **Synthesize Key Findings**
   - Distill top 5 market insights
   - Highlight critical success factors
   - Note major risks and mitigations
   - Output: Executive summary bullets

2. **Generate Recommendations**
   - **Go/No-Go Decision:** Clear recommendation with rationale
   - **Positioning Strategy:** How to differentiate
   - **Feature Priorities:** Must-have vs nice-to-have
   - **Monetization Approach:** Recommended model
   - **Launch Timing:** Optimal release window
   - Output: Recommendation cards

3. **Define Success Metrics**
   - Set CCU targets (30-day, 90-day, 1-year)
   - Define engagement benchmarks
   - Establish revenue goals
   - Create early warning indicators
   - Output: KPI framework

4. **Compile Final Report**
   - Structure: Executive Summary, Market Size, Competitors, SWOT, Recommendations
   - Include all charts and visualizations
   - Add appendix with raw data
   - Format in markdown
   - Output: Complete market analysis document

5. **Save to Project**
   - Save report to docs/market-analysis/
   - Update memory layer with key findings
   - Create summary for other agents
   - Output: Saved files and memory updates

---

## Output Structure

### Market Analysis Report

```markdown
# Market Analysis: {Game Name}

## Executive Summary
- **Recommendation:** GO / CAUTION / NO-GO
- **Market Size:** {TAM} total players, {SAM} addressable
- **Competition Level:** Low / Medium / High / Saturated
- **Revenue Potential:** ${X}K - ${Y}K monthly at {Z} CCU
- **Key Risk:** {Primary risk}

## Market Overview
### Genre: {Genre}
- Total genre CCU: {X}
- Top performer: {Game} at {CCU} peak CCU
- Genre growth: {+/-X%} over 6 months
- Average game lifespan: {X} months

### Target Audience
- Primary: {Demographics}
- Secondary: {Demographics}
- Platform preference: {Mobile/PC/Console split}

## Competitor Analysis

### Competitor 1: {Game Name}
| Metric | Value |
|--------|-------|
| Peak CCU | {X} |
| Avg CCU | {X} |
| Favorites | {X} |
| Monetization | {Model} |
| Key Features | {List} |
| Weaknesses | {List} |

[Repeat for all competitors]

### Feature Comparison Matrix
| Feature | Game 1 | Game 2 | Game 3 | Opportunity |
|---------|--------|--------|--------|-------------|
| {Feature} | Yes/No | Yes/No | Yes/No | {Gap?} |

## SWOT Analysis

### Strengths
1. {Strength 1}
2. {Strength 2}
3. {Strength 3}

### Weaknesses
1. {Weakness 1}
2. {Weakness 2}
3. {Weakness 3}

### Opportunities
1. {Opportunity 1}
2. {Opportunity 2}
3. {Opportunity 3}

### Threats
1. {Threat 1}
2. {Threat 2}
3. {Threat 3}

## Porter's Five Forces

| Force | Rating | Analysis |
|-------|--------|----------|
| New Entrants | High/Med/Low | {Explanation} |
| Player Power | High/Med/Low | {Explanation} |
| Substitutes | High/Med/Low | {Explanation} |
| Rivalry | High/Med/Low | {Explanation} |
| Platform Power | High/Med/Low | {Explanation} |

## Risk Assessment

| Risk | Probability | Impact | Score | Mitigation |
|------|-------------|--------|-------|------------|
| {Risk} | 1-5 | 1-5 | {P*I} | {Strategy} |

## Recommendations

### 1. Positioning Strategy
{Detailed positioning recommendation}

### 2. Feature Priorities
**Must-Have (MVP):**
- {Feature 1}
- {Feature 2}

**Should-Have (v1.1):**
- {Feature 1}
- {Feature 2}

**Nice-to-Have (Future):**
- {Feature 1}
- {Feature 2}

### 3. Monetization Approach
{Detailed monetization recommendation}

### 4. Success Metrics
| Metric | 30-Day Target | 90-Day Target | 1-Year Target |
|--------|---------------|---------------|---------------|
| Peak CCU | {X} | {X} | {X} |
| Avg CCU | {X} | {X} | {X} |
| Revenue | ${X} | ${X} | ${X} |

## Appendix
- Raw CCU data
- Research sources
- Methodology notes
```

---

## Usage Examples

### Example 1: Quick Competitive Scan

```bash
@market-analyst
*analyze-market "Anime tower defense with gacha" --genre "Tower Defense" --depth quick
```

### Example 2: Full Market Analysis

```bash
@market-analyst
*analyze-market "Pet simulator with breeding mechanics" --genre "Simulator" --competitors "Pet Simulator X,Adopt Me,Pet Simulator 99"
```

### Example 3: Pre-Investment Analysis

```bash
@market-analyst
*analyze-market "Horror escape room with puzzles" --genre "Horror" --depth comprehensive --mode preflight
```

---

## Integration Points

- **Input from:** Product Owner (concept), Game Designer (features)
- **Output to:** Game Designer (GDD input), Monetization Strategist (pricing), Dev team (requirements)
- **Triggers:** New game ideation, pivot consideration, competitive response
- **Updates Memory:** Market insights, competitor profiles, genre benchmarks
