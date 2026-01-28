---
title: "Competitive Frameworks - Strategic Analysis Toolkit"
agent: market-analyst
persona: Prism
category: strategic-analysis
version: 1.0.0
last_updated: 2025-01
frameworks:
  - SWOT Analysis
  - Porter's Five Forces
  - Blue Ocean Strategy
  - Value Curve Analysis
  - Competitive Positioning
  - Feature Gap Analysis
---

# Competitive Frameworks for Roblox Game Development

> Strategic analysis tools adapted for the Roblox platform ecosystem
> Data-driven methodologies for competitive advantage

---

## Table of Contents

1. [SWOT Analysis Deep Dive](#1-swot-analysis-deep-dive)
2. [Porter's Five Forces for Roblox](#2-porters-five-forces-for-roblox)
3. [Blue Ocean Strategy Applied](#3-blue-ocean-strategy-applied)
4. [Competitive Positioning Matrix](#4-competitive-positioning-matrix)
5. [Value Curve Analysis](#5-value-curve-analysis)
6. [Feature Gap Analysis Methodology](#6-feature-gap-analysis-methodology)
7. [Competitive Response Planning](#7-competitive-response-planning)

---

## 1. SWOT Analysis Deep Dive

### Framework Overview

SWOT analysis evaluates internal **Strengths** and **Weaknesses** against external **Opportunities** and **Threats** to inform strategic decisions.

```
                    HELPFUL                     HARMFUL
                 (to objective)             (to objective)
           ┌─────────────────────────┬─────────────────────────┐
           │                         │                         │
 INTERNAL  │      STRENGTHS          │      WEAKNESSES         │
 (origin)  │                         │                         │
           │  What you do well       │  What limits you        │
           │  Unique capabilities    │  Resource gaps          │
           │  Competitive advantages │  Areas for improvement  │
           │                         │                         │
           ├─────────────────────────┼─────────────────────────┤
           │                         │                         │
 EXTERNAL  │     OPPORTUNITIES       │       THREATS           │
 (origin)  │                         │                         │
           │  Market trends          │  Competitor actions     │
           │  Platform changes       │  Platform changes       │
           │  Unmet needs            │  Market saturation      │
           │                         │                         │
           └─────────────────────────┴─────────────────────────┘
```

### SWOT for Roblox Games - Detailed Categories

#### Strengths Assessment

| Category | Questions to Ask | Examples |
|----------|------------------|----------|
| **Technical** | What can we build that others can't? | Advanced AI, custom physics, optimization |
| **Creative** | What unique ideas/IP do we have? | Original characters, novel mechanics |
| **Team** | What expertise exists in the team? | Art skills, marketing experience |
| **Resources** | What assets/capital do we have? | Existing player base, Robux budget |
| **Market Position** | What reputation have we built? | Known for quality, established brand |

```lua
-- Strength Assessment Checklist
local StrengthCategories = {
    Technical = {
        "Unique technical capability (AI, physics, optimization)",
        "Proprietary tools or workflows",
        "Cross-platform excellence",
        "Performance optimization skills"
    },
    Creative = {
        "Original IP or concept",
        "Distinctive art style",
        "Innovative mechanics",
        "Strong narrative design"
    },
    Team = {
        "Experienced developers",
        "Multi-disciplinary skills",
        "Established workflows",
        "Community management expertise"
    },
    Market = {
        "Existing player base",
        "Brand recognition",
        "Content creator relationships",
        "Community goodwill"
    }
}
```

#### Weaknesses Assessment

| Category | Questions to Ask | Red Flags |
|----------|------------------|-----------|
| **Technical** | What can't we build efficiently? | Performance issues, bugs |
| **Creative** | Where do we lack originality? | Copying trends, no USP |
| **Team** | What skills are missing? | No artist, no marketing |
| **Resources** | What constraints exist? | Limited budget, time |
| **Market Position** | What reputation issues exist? | Past failures, controversies |

```
COMMON WEAKNESSES (Roblox Context):
├── Technical Gaps
│   ├── Mobile optimization issues
│   ├── Multiplayer netcode problems
│   ├── Memory management
│   └── Security vulnerabilities
│
├── Team Limitations
│   ├── Solo developer bottleneck
│   ├── No dedicated artist
│   ├── Limited marketing knowledge
│   └── Timezone coordination issues
│
├── Resource Constraints
│   ├── Limited development budget
│   ├── No marketing budget
│   ├── Time constraints (part-time)
│   └── Asset creation bottleneck
│
└── Market Challenges
    ├── New/unknown developer
    ├── No existing audience
    ├── Limited social presence
    └── No content creator relationships
```

#### Opportunities Assessment

| Category | Questions to Ask | Signals |
|----------|------------------|---------|
| **Market Trends** | What's growing? | Rising CCU in segments |
| **Platform Changes** | What new features exist? | API updates, new tools |
| **Competitor Gaps** | What are others missing? | Complaints, unfilled niches |
| **Audience Shifts** | Who's underserved? | Demographic changes |
| **Technology** | What's newly possible? | VR, AI integration |

```
OPPORTUNITY IDENTIFICATION FRAMEWORK:

1. TREND ANALYSIS
   └── Monitor: TikTok, YouTube, DevForum
   └── Look for: Rising search terms, viral content
   └── Timeline: 1-4 week opportunity window

2. COMPETITOR GAPS
   └── Analyze: Top 10 games in target genre
   └── Look for: Player complaints, missing features
   └── Method: Review reading, Discord monitoring

3. PLATFORM UPDATES
   └── Monitor: Roblox Developer Blog, Release Notes
   └── Look for: New APIs, tools, capabilities
   └── Advantage: First-mover on new features

4. DEMOGRAPHIC SHIFTS
   └── Monitor: Roblox quarterly reports
   └── Look for: Age group growth, regional expansion
   └── Strategy: Target underserved segments
```

#### Threats Assessment

| Category | Questions to Ask | Warning Signs |
|----------|------------------|---------------|
| **Competition** | Who could copy/outcompete us? | Larger teams, faster execution |
| **Platform** | What policy changes could hurt us? | Algorithm changes, rule updates |
| **Market** | Is our market shrinking? | Declining CCU in genre |
| **Technology** | What disruptions are possible? | New platforms, tech shifts |
| **External** | What macro factors matter? | Economy, regulations |

```
THREAT MONITORING SYSTEM:

COMPETITIVE THREATS:
├── Direct Competitors
│   ├── Established games pivoting
│   ├── Well-funded new entrants
│   └── Copycats with more resources
│
├── Indirect Competitors
│   ├── Cross-genre competition
│   ├── Non-Roblox alternatives
│   └── Other entertainment options
│
└── Substitute Products
    ├── Similar gameplay elsewhere
    ├── Free alternatives
    └── Platform switches

PLATFORM THREATS:
├── Algorithm Changes
│   ├── Discovery algorithm updates
│   ├── Sort mechanism changes
│   └── Recommendation shifts
│
├── Policy Changes
│   ├── Monetization rule changes
│   ├── Content restrictions
│   └── Age rating adjustments
│
└── Technical Changes
    ├── API deprecations
    ├── Performance requirements
    └── Compatibility issues
```

### SWOT Matrix Template

```markdown
## SWOT Analysis: [Game Name]
Date: [YYYY-MM-DD]
Genre: [Genre]
Development Stage: [Concept/Development/Live]

### STRENGTHS (Internal Positives)

| Strength | Impact | Leverage Strategy |
|----------|--------|-------------------|
| [Strength 1] | High/Med/Low | How to maximize |
| [Strength 2] | High/Med/Low | How to maximize |
| [Strength 3] | High/Med/Low | How to maximize |

### WEAKNESSES (Internal Negatives)

| Weakness | Impact | Mitigation Strategy |
|----------|--------|---------------------|
| [Weakness 1] | High/Med/Low | How to address |
| [Weakness 2] | High/Med/Low | How to address |
| [Weakness 3] | High/Med/Low | How to address |

### OPPORTUNITIES (External Positives)

| Opportunity | Probability | Capture Strategy |
|-------------|-------------|------------------|
| [Opportunity 1] | High/Med/Low | How to pursue |
| [Opportunity 2] | High/Med/Low | How to pursue |
| [Opportunity 3] | High/Med/Low | How to pursue |

### THREATS (External Negatives)

| Threat | Probability | Response Strategy |
|--------|-------------|-------------------|
| [Threat 1] | High/Med/Low | How to defend |
| [Threat 2] | High/Med/Low | How to defend |
| [Threat 3] | High/Med/Low | How to defend |

### STRATEGIC IMPLICATIONS

**SO Strategies** (Strengths + Opportunities):
- [Use strength X to capture opportunity Y]

**WO Strategies** (Weaknesses + Opportunities):
- [Address weakness X to enable opportunity Y]

**ST Strategies** (Strengths + Threats):
- [Use strength X to defend against threat Y]

**WT Strategies** (Weaknesses + Threats):
- [Address weakness X before threat Y materializes]
```

---

## 2. Porter's Five Forces for Roblox

### Framework Overview

Porter's Five Forces analyzes the competitive intensity and attractiveness of a market. For Roblox, this framework helps understand genre-level competition dynamics.

```
                    ┌──────────────────────┐
                    │  THREAT OF NEW       │
                    │  ENTRANTS            │
                    │  (Barrier to Entry)  │
                    └──────────┬───────────┘
                               │
                               ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  SUPPLIER POWER  │   │  COMPETITIVE     │   │  BUYER POWER     │
│  (Roblox Corp)   │◄──┤  RIVALRY         │──►│  (Players)       │
│                  │   │  (Other Games)   │   │                  │
└──────────────────┘   └──────────────────┘   └──────────────────┘
                               ▲
                               │
                    ┌──────────┴───────────┐
                    │  THREAT OF           │
                    │  SUBSTITUTES         │
                    │  (Other Platforms)   │
                    └──────────────────────┘
```

### Force 1: Competitive Rivalry

**Definition:** Intensity of competition among existing games in the genre.

| Factor | Low Rivalry | High Rivalry |
|--------|-------------|--------------|
| Number of competitors | Few games | Many games |
| Market growth | Fast growing | Slow/declining |
| Differentiation | High unique value | Similar offerings |
| Exit barriers | Easy to pivot | Invested resources |
| Fixed costs | Low dev costs | High ongoing costs |

**Rivalry Assessment by Genre:**

| Genre | Rivalry Level | Key Factors |
|-------|---------------|-------------|
| Simulator | Very High | 1000+ games, established leaders |
| Roleplay | Very High | Many similar offerings, low differentiation |
| Horror | Medium-High | Growing, but room for innovation |
| RPG | High | Quality bar is high, content intensive |
| FPS | High | Technical barriers, but many competitors |
| Tycoon | High | Saturated, but predictable patterns |
| Obby | Very High | Extremely low barrier, massive volume |

```
RIVALRY INTENSITY INDICATORS:

HIGH RIVALRY SIGNALS:
├── Top 10 games are established (1+ years)
├── New games struggle to break 10K CCU
├── Marketing/ads required for visibility
├── Feature parity is common
└── Price/monetization wars occur

LOW RIVALRY SIGNALS:
├── New entries regularly reach top charts
├── Clear differentiation between leaders
├── Organic discovery still works
├── Premium pricing accepted
└── Room for multiple successful games
```

### Force 2: Threat of New Entrants

**Definition:** How easy is it for new competitors to enter the market?

**Barriers to Entry in Roblox:**

| Barrier Type | Strength | Impact |
|--------------|----------|--------|
| **Capital** | Low | Anyone can publish |
| **Technical** | Medium | Varies by genre |
| **Brand** | Medium | Established names have advantage |
| **Distribution** | Low | Same platform access |
| **Network Effects** | High | Existing games have communities |
| **Switching Costs** | Low | Players easily try new games |

```
ENTRY BARRIER ANALYSIS BY GENRE:

SIMULATOR:
├── Capital: Low (basic can be simple)
├── Technical: Medium (optimization matters)
├── Content: High (need constant updates)
└── Overall: MEDIUM barrier

HORROR:
├── Capital: Low-Medium
├── Technical: Medium (AI, atmosphere)
├── Creative: High (need unique concept)
└── Overall: MEDIUM barrier

RPG:
├── Capital: Medium-High (content)
├── Technical: High (systems complexity)
├── Content: Very High (100+ hours)
└── Overall: HIGH barrier

FPS:
├── Capital: Medium
├── Technical: Very High (netcode, mobile)
├── Content: Medium (maps, weapons)
└── Overall: HIGH barrier
```

### Force 3: Supplier Power (Roblox Corporation)

**Definition:** Roblox's control over the platform and developer economics.

| Factor | Assessment | Impact on Developers |
|--------|------------|---------------------|
| **Revenue Share** | 70-30 split | Significant cut |
| **Platform Rules** | Strict, changing | Must comply |
| **API Control** | Complete | Feature limitations |
| **Discovery** | Algorithm-driven | Visibility depends on Roblox |
| **Payment Processing** | Exclusive | No alternatives |
| **DevEx Rate** | Set by Roblox | Affects profitability |

```
ROBLOX SUPPLIER POWER:

HIGH CONTROL AREAS:
├── Monetization rules
├── Content moderation
├── Discovery algorithms
├── Revenue split (30%+)
├── API availability
└── Terms of service

MITIGATION STRATEGIES:
├── Diversify across games (portfolio)
├── Build external community (Discord)
├── Develop email/notification list
├── Create content creator relationships
├── Monitor policy changes early
└── Maintain positive platform standing
```

### Force 4: Buyer Power (Players)

**Definition:** Players' ability to influence game development and pricing.

| Factor | Assessment | Implication |
|--------|------------|-------------|
| **Switching Costs** | Very Low | Easy to leave |
| **Price Sensitivity** | High | Robux is limited |
| **Information** | High | Reviews, YouTube visible |
| **Alternatives** | Many | Every genre is competitive |
| **Brand Loyalty** | Medium | Can be built |

```
PLAYER POWER DYNAMICS:

HIGH PLAYER POWER SITUATIONS:
├── Many similar games available
├── Low investment (time/money) in game
├── Active review/complaint culture
├── Content creators influence opinions
└── Easy to compare alternatives

LOW PLAYER POWER SITUATIONS:
├── Unique gameplay not found elsewhere
├── High player investment (progress, social)
├── Strong community ties
├── Limited alternatives in niche
└── High switching costs (learning curve)

PLAYER RETENTION STRATEGIES:
├── Build progression systems
├── Create social connections
├── Develop unique content
├── Maintain community relationships
├── Regular updates and communication
└── Fair monetization practices
```

### Force 5: Threat of Substitutes

**Definition:** Risk of players choosing non-Roblox alternatives.

| Substitute Type | Threat Level | Examples |
|-----------------|--------------|----------|
| **Other Roblox Games** | Very High | Directly competes |
| **Fortnite Creative** | Medium | Similar UGC platform |
| **Mobile Games** | Medium | F2P alternatives |
| **Console/PC Games** | Low-Medium | Different audience |
| **Non-Gaming** | Medium | TikTok, YouTube, social |

```
SUBSTITUTE THREAT ANALYSIS:

DIRECT SUBSTITUTES (Same Need):
├── Other games in same genre
├── Similar mechanics elsewhere
├── Cross-platform versions
└── Clones and copycats

INDIRECT SUBSTITUTES (Same Time):
├── Other entertainment (streaming)
├── Social media platforms
├── Real-world activities
└── Other hobbies

MITIGATION:
├── Offer unique value not found elsewhere
├── Build strong community ties
├── Create platform-specific features
├── Leverage Roblox social graph
└── Regular content to maintain interest
```

### Porter's Five Forces Template

```markdown
## Porter's Five Forces: [Genre/Niche]
Date: [YYYY-MM-DD]

### Force Assessment Summary

| Force | Intensity | Trend |
|-------|-----------|-------|
| Competitive Rivalry | 1-5 | Increasing/Stable/Decreasing |
| Threat of Entrants | 1-5 | Increasing/Stable/Decreasing |
| Supplier Power | 1-5 | Increasing/Stable/Decreasing |
| Buyer Power | 1-5 | Increasing/Stable/Decreasing |
| Threat of Substitutes | 1-5 | Increasing/Stable/Decreasing |
| **Overall Attractiveness** | **X/5** | **[Assessment]** |

### Detailed Analysis

#### 1. Competitive Rivalry: [Score]/5
- Key competitors: [List]
- Differentiation level: [High/Medium/Low]
- Market growth: [Growing/Stable/Declining]
- Strategic implications: [Analysis]

#### 2. Threat of New Entrants: [Score]/5
- Barriers to entry: [List]
- Recent successful entrants: [List]
- Our competitive moat: [Analysis]
- Strategic implications: [Analysis]

#### 3. Supplier Power (Roblox): [Score]/5
- Key dependencies: [List]
- Recent policy changes: [List]
- Risk mitigation: [Analysis]
- Strategic implications: [Analysis]

#### 4. Buyer Power (Players): [Score]/5
- Switching costs: [Assessment]
- Player expectations: [List]
- Retention strategies: [Analysis]
- Strategic implications: [Analysis]

#### 5. Threat of Substitutes: [Score]/5
- Direct substitutes: [List]
- Indirect substitutes: [List]
- Differentiation strategy: [Analysis]
- Strategic implications: [Analysis]

### Strategic Recommendations

1. [Based on analysis]
2. [Based on analysis]
3. [Based on analysis]
```

---

## 3. Blue Ocean Strategy Applied

### Framework Overview

Blue Ocean Strategy focuses on creating uncontested market space rather than competing in existing "red oceans" of competition.

```
RED OCEAN                          BLUE OCEAN
(Existing Markets)                 (New Markets)
┌─────────────────┐               ┌─────────────────┐
│ Compete in      │               │ Create          │
│ existing space  │               │ uncontested     │
│                 │               │ market space    │
│ Beat the        │               │ Make the        │
│ competition     │               │ competition     │
│                 │               │ irrelevant      │
│ Exploit         │               │ Create and      │
│ existing        │               │ capture new     │
│ demand          │               │ demand          │
│                 │               │                 │
│ Make the        │               │ Break the       │
│ value-cost      │               │ value-cost      │
│ trade-off       │               │ trade-off       │
└─────────────────┘               └─────────────────┘
```

### The Four Actions Framework

| Action | Question | Purpose |
|--------|----------|---------|
| **Eliminate** | What factors should be eliminated? | Remove costly features players don't value |
| **Reduce** | What factors should be reduced? | Cut over-designed elements |
| **Raise** | What factors should be raised? | Increase value above industry standard |
| **Create** | What factors should be created? | Add never-offered features |

```
FOUR ACTIONS EXAMPLE: Horror Game

ELIMINATE:
├── Complex inventory systems
├── Excessive lore dumps
├── Long tutorial sequences
└── Multiplayer when not needed

REDUCE:
├── Number of monsters (focus on quality)
├── Map size (tighter experience)
├── Session length expectations
└── Grinding/progression gates

RAISE:
├── Atmosphere quality
├── Sound design
├── Unique monster mechanics
├── Replayability through variation

CREATE:
├── Novel fear mechanic (never seen)
├── Community-driven content
├── Spectator mode for streamers
├── Cross-genre hybrid element
```

### Roblox Blue Ocean Examples

| Game | Red Ocean Avoided | Blue Ocean Created |
|------|-------------------|-------------------|
| **DOORS** | Generic horror game | Procedural + diverse entities |
| **Grow a Garden** | Complex farming sim | Ultra-simple, viral mechanics |
| **Dress to Impress** | Fashion dress-up | Competitive runway format |
| **Blade Ball** | Standard obby/combat | Unique hybrid mechanic |

### Six Paths Framework for Blue Oceans

#### Path 1: Look Across Alternative Industries

```
QUESTION: What games from OTHER genres could inspire this one?

EXAMPLE:
├── RPG + Roguelike = Deepwoken
├── Horror + Tycoon = 99 Nights
├── Fashion + Competition = Dress to Impress
└── Shooter + Parkour = Movement shooters

APPLICATION:
1. List your target genre
2. List 5 unrelated genres
3. For each: "What if [genre] had [other genre] elements?"
4. Evaluate novelty and feasibility
```

#### Path 2: Look Across Strategic Groups

```
QUESTION: Can we serve a different player segment?

STRATEGIC GROUPS IN ROBLOX:
├── Casual players (short sessions, simple)
├── Core gamers (long sessions, depth)
├── Social players (community focus)
├── Competitive players (skill expression)
├── Creative players (building, expression)
└── Collectors (completion, achievement)

APPLICATION:
1. Identify dominant player type in genre
2. Find underserved player type
3. Design features for that segment
```

#### Path 3: Look Across the Chain of Buyers

```
QUESTION: Who else influences the decision?

BUYER CHAIN IN ROBLOX:
├── Players (primary users)
├── Parents (spending approval)
├── Content creators (influence)
├── Friend groups (social play)
└── Communities (Discord, etc.)

APPLICATION:
1. Who currently influences game choice?
2. Who is overlooked?
3. How can we appeal to that influencer?
```

#### Path 4: Look Across Complementary Products

```
QUESTION: What happens before, during, after playing?

COMPLEMENTARY EXPERIENCES:
├── Before: Discovery, learning, anticipation
├── During: Play, social, streaming
├── After: Sharing, discussing, content creation

APPLICATION:
1. Map the player journey beyond gameplay
2. Find pain points or gaps
3. Create features addressing those moments
```

#### Path 5: Look Across Functional-Emotional Appeal

```
QUESTION: Is our genre functional or emotional? Can we flip it?

FUNCTIONAL APPEAL: Efficient, practical, achievement
EMOTIONAL APPEAL: Fun, social, expressive, meaningful

EXAMPLE:
├── Tycoon (functional) + Story (emotional) = Narrative tycoon
├── Horror (emotional) + Strategy (functional) = Horror strategy
└── Obby (functional) + Social (emotional) = Cooperative obby

APPLICATION:
1. Determine current genre appeal type
2. Explore adding opposite appeal
3. Create features that blend both
```

#### Path 6: Look Across Time

```
QUESTION: What trend could change this genre?

TREND CONSIDERATIONS:
├── Technology: VR, AI, mobile advances
├── Platform: Roblox features, policies
├── Culture: Social trends, memes, IP
├── Demographics: Aging audience, new markets
└── Competition: What others aren't doing yet

APPLICATION:
1. Identify 3-5 relevant trends
2. Project impact on genre in 12-24 months
3. Design for future state, not current
```

### Blue Ocean Strategy Canvas

```markdown
## Blue Ocean Canvas: [Game Concept]

### Current Industry Factors (1-10 scale)

| Factor | Industry Avg | Competitor A | Competitor B | Our Game |
|--------|--------------|--------------|--------------|----------|
| Graphics Quality | 7 | 8 | 6 | ? |
| Content Depth | 8 | 9 | 7 | ? |
| Monetization Pressure | 6 | 7 | 5 | ? |
| Learning Curve | 5 | 6 | 4 | ? |
| Session Length | 7 | 8 | 6 | ? |
| Social Features | 5 | 4 | 6 | ? |
| Unique Mechanics | 4 | 3 | 5 | ? |
| [New Factor] | - | - | - | ? |

### Four Actions Grid

| Eliminate | Reduce |
|-----------|--------|
| [Factor 1] | [Factor 1] |
| [Factor 2] | [Factor 2] |

| Raise | Create |
|-------|--------|
| [Factor 1] | [Factor 1] |
| [Factor 2] | [Factor 2] |

### Value Curve Visualization

[ASCII chart or description of differentiated value curve]

### Blue Ocean Hypothesis

**Target Non-Customer:** [Who currently doesn't play games like this?]
**Why They Don't Play:** [Barriers or reasons]
**Our Value Proposition:** [How we attract them]
**Differentiation:** [What makes us unique]
```

---

## 4. Competitive Positioning Matrix

### Framework Overview

Competitive positioning maps games on key dimensions to identify market gaps and positioning opportunities.

### Common Positioning Dimensions

| Dimension Pair | Low End | High End |
|----------------|---------|----------|
| Complexity | Simple | Deep |
| Session Length | Quick | Long |
| Social Focus | Solo | Multiplayer |
| Progression | Casual | Hardcore |
| Content Style | Realistic | Stylized |
| Monetization | Fair | Aggressive |

### Two-Dimensional Positioning Map

```
                    COMPETITIVE/SKILL
                          ▲
                          │
               ┌──────────┼──────────┐
               │  FPS     │  RPG     │
               │  Games   │  Games   │
               │          │          │
    SIMPLE ◄───┼──────────┼──────────┼───► COMPLEX
               │          │          │
               │  Obby    │  Simulator│
               │  Games   │  Games   │
               └──────────┼──────────┘
                          │
                          ▼
                    CASUAL/RELAXED
```

### Multi-Factor Positioning

```
POSITIONING SCORECARD:

Factor              Your Game    Comp A    Comp B    Comp C
─────────────────────────────────────────────────────────────
Complexity          ████░░░░░░   ███████░  ████░░░░  ██████░░
Session Length      ███░░░░░░░   █████░░░  ██░░░░░░  ████████
Social Focus        ████████░░   ███░░░░░  █████░░░  ██░░░░░░
Progression Depth   █████░░░░░   ████████  ███░░░░░  ██████░░
Mobile Friendly     ████████░░   ████░░░░  █████████ ██░░░░░░
Monetization Fair   ██████░░░░   ███░░░░░  ████████  █████░░░

GAP ANALYSIS:
- Opportunity: High social + mobile friendly + fair monetization
- Position: [Your unique combination]
```

### Positioning Strategy Template

```markdown
## Competitive Positioning: [Game Name]

### Market Map

**Dimension 1:** [e.g., Complexity] - Why chosen: [Reason]
**Dimension 2:** [e.g., Social Focus] - Why chosen: [Reason]

### Competitor Positions

| Competitor | Dim 1 (1-10) | Dim 2 (1-10) | Position Description |
|------------|--------------|--------------|---------------------|
| [Comp A] | X | Y | [Description] |
| [Comp B] | X | Y | [Description] |
| [Comp C] | X | Y | [Description] |
| **Our Game** | **X** | **Y** | **[Description]** |

### Position Statement

For [target player segment]
Who want [need/desire]
Our game is a [category]
That [key benefit]
Unlike [competitors]
We [key differentiator]

### Positioning Defense

How will we defend this position?
1. [Technical moat]
2. [Content moat]
3. [Community moat]
```

---

## 5. Value Curve Analysis

### Framework Overview

Value curves visualize how competing games allocate resources across key factors, revealing opportunities for differentiation.

### Building a Value Curve

```
STEP 1: Identify Key Factors
├── What do players care about?
├── What do competitors emphasize?
├── What determines success in genre?
└── List 8-12 factors

STEP 2: Rate Competitors
├── Score each competitor 1-10 on each factor
├── Use objective measures where possible
├── Include market leader and emerging threats
└── Create consistent criteria

STEP 3: Plot and Analyze
├── Create visual curve for each game
├── Identify where curves overlap (red ocean)
├── Find factors with low competition
└── Design your unique curve
```

### Value Curve Example: Horror Games

```
Factor              DOORS   Piggy   Mimic   New Game
────────────────────────────────────────────────────
Graphics            ████    ███     █████   ████
Sound Design        █████   ███     █████   ██████
Monster Variety     █████   ████    ███     ███
Replayability       █████   ████    ███     █████
Story Depth         ██      █████   █████   ███
Multiplayer         ████    █████   ████    ██
Mobile Friendly     ████    █████   ███     █████
Session Length      ███     ████    █████   ███
Learning Curve      ████    ██      ████    ██
Update Frequency    █████   ███     ████    ████

INSIGHT: Opportunity in mobile + sound + replayability
```

### Value Innovation Principles

| Principle | Application |
|-----------|-------------|
| **Buyer Value** | Only invest in what players truly value |
| **Cost Reduction** | Eliminate/reduce what doesn't add value |
| **Differentiation** | Raise/create what sets you apart |
| **Focus** | Don't try to be best at everything |

---

## 6. Feature Gap Analysis Methodology

### Framework Overview

Systematic process to identify missing features that represent opportunities.

### Feature Gap Analysis Process

```
PHASE 1: COMPETITOR INVENTORY
└── List all features of top 5-10 competitors
└── Categorize: Core, Secondary, Nice-to-have
└── Note quality level of each

PHASE 2: PLAYER EXPECTATIONS
└── Review player feedback (reviews, forums)
└── Survey or interview players
└── Identify requested features
└── Note frustrations and complaints

PHASE 3: GAP IDENTIFICATION
└── Compare inventory vs expectations
└── Find features no one offers well
└── Identify over-served areas
└── Prioritize by player value

PHASE 4: OPPORTUNITY EVALUATION
└── Assess development cost
└── Estimate player impact
└── Consider competitive response
└── Rank opportunities
```

### Feature Gap Matrix

```markdown
## Feature Gap Analysis: [Genre]

### Feature Inventory

| Feature | Comp A | Comp B | Comp C | Player Want | Gap? |
|---------|--------|--------|--------|-------------|------|
| Feature 1 | Yes/★★★ | Yes/★★ | No | High | No |
| Feature 2 | No | Yes/★ | No | High | Yes! |
| Feature 3 | Yes/★★ | Yes/★★ | Yes/★★ | Medium | Saturated |
| Feature 4 | No | No | No | Medium | Yes! |

### Gap Prioritization

| Gap | Player Value | Dev Cost | Competition Risk | Priority |
|-----|--------------|----------|------------------|----------|
| Feature 2 | High | Medium | Low | ★★★★★ |
| Feature 4 | Medium | Low | Low | ★★★★ |

### Implementation Recommendations

1. **High Priority:** [Feature/Gap]
   - Why: [Justification]
   - How: [Approach]
   - When: [Timeline]

2. **Medium Priority:** [Feature/Gap]
   - Why: [Justification]
   - How: [Approach]
   - When: [Timeline]
```

### Player Feedback Mining

```
SOURCES FOR GAP IDENTIFICATION:

DIRECT FEEDBACK:
├── Roblox game reviews
├── Discord server discussions
├── DevForum threads
├── YouTube video comments
└── Twitter/X mentions

INDIRECT SIGNALS:
├── Features in successful games
├── Common mod requests
├── Streamer complaints
├── Competitor update patterns
└── Platform feature requests

ANALYSIS KEYWORDS:
├── "I wish..."
├── "Why doesn't..."
├── "It would be great if..."
├── "Missing feature..."
├── "Compared to [other game]..."
└── "The only thing holding back..."
```

---

## 7. Competitive Response Planning

### Framework Overview

Anticipating and planning responses to competitive threats.

### Competitive Response Matrix

```
                    OUR RESPONSE SPEED
                    Fast            Slow
              ┌─────────────────┬─────────────────┐
    THREAT    │                 │                 │
    IMPACT    │   IMMEDIATE     │   STRATEGIC     │
    High      │   ACTION        │   RESPONSE      │
              │                 │                 │
              │   Deploy        │   Plan major    │
              │   countermeasure│   pivot or      │
              │   now           │   enhancement   │
              ├─────────────────┼─────────────────┤
              │                 │                 │
    THREAT    │   MONITOR       │   IGNORE        │
    IMPACT    │   & PREPARE     │   (for now)     │
    Low       │                 │                 │
              │   Track, have   │   Note but      │
              │   plan ready    │   focus on      │
              │                 │   priorities    │
              └─────────────────┴─────────────────┘
```

### Competitive Threat Scenarios

```
SCENARIO PLANNING:

SCENARIO 1: Direct Copy
├── Likelihood: [High/Medium/Low]
├── Detection: How will we know?
├── Response Time: [X days/weeks]
├── Our Advantage: [Moat]
└── Action Plan: [Steps]

SCENARIO 2: Feature Matching
├── Likelihood: [High/Medium/Low]
├── Detection: How will we know?
├── Response Time: [X days/weeks]
├── Our Advantage: [Moat]
└── Action Plan: [Steps]

SCENARIO 3: Price/Monetization War
├── Likelihood: [High/Medium/Low]
├── Detection: How will we know?
├── Response Time: [X days/weeks]
├── Our Advantage: [Moat]
└── Action Plan: [Steps]

SCENARIO 4: Content Creator Shift
├── Likelihood: [High/Medium/Low]
├── Detection: How will we know?
├── Response Time: [X days/weeks]
├── Our Advantage: [Moat]
└── Action Plan: [Steps]
```

### Competitive Intelligence System

```markdown
## Competitive Monitoring Plan

### Primary Competitors (Monitor Weekly)

| Competitor | Monitoring Actions | Alert Triggers |
|------------|-------------------|----------------|
| [Comp A] | CCU tracking, update notes | >20% CCU change |
| [Comp B] | Discord activity | Major announcements |
| [Comp C] | Content creator coverage | New partnerships |

### Secondary Competitors (Monitor Monthly)

| Competitor | Monitoring Actions | Alert Triggers |
|------------|-------------------|----------------|
| [Comp D] | General awareness | Breaking into top 50 |
| [Comp E] | General awareness | Viral moment |

### Emerging Threats (Quarterly Scan)

- New game launches in genre
- Cross-genre innovations
- Platform changes affecting all

### Information Sources

| Source | Frequency | Owner |
|--------|-----------|-------|
| RoMonitor Stats | Daily | [Person] |
| DevForum | Weekly | [Person] |
| Discord servers | Daily | [Person] |
| YouTube trends | Weekly | [Person] |
| Content creators | Weekly | [Person] |
```

### Response Playbooks

```
PLAYBOOK: Competitor Launches Similar Feature

DETECTION:
└── How discovered: [Process]
└── Verification: [Confirm it's real]

ANALYSIS (24 hours):
└── How good is their implementation?
└── How does it compare to ours?
└── What's player reaction?
└── Does it threaten our position?

RESPONSE OPTIONS:
├── Ignore: If inferior implementation
├── Acknowledge: If comparable, differentiate messaging
├── Accelerate: If we have better version planned
├── Innovate: If they matched, go beyond
└── Pivot: If they leapfrogged significantly

COMMUNICATION:
└── Internal: [Team messaging]
└── External: [Community messaging if needed]
└── Timeline: [When to communicate]
```

---

## Quick Reference: Framework Selection Guide

```
USE SWOT WHEN:
├── Starting a new project
├── Quarterly strategic review
├── Evaluating pivot decisions
└── Assessing team capabilities

USE PORTER'S FIVE FORCES WHEN:
├── Evaluating genre attractiveness
├── Understanding competitive dynamics
├── Planning market entry
└── Assessing long-term viability

USE BLUE OCEAN WHEN:
├── Looking for differentiation
├── Avoiding direct competition
├── Creating new category
└── Innovative concept development

USE POSITIONING MATRIX WHEN:
├── Defining market position
├── Finding gaps in market
├── Crafting marketing message
└── Comparing against competitors

USE VALUE CURVE WHEN:
├── Detailed competitive comparison
├── Resource allocation decisions
├── Feature prioritization
└── Differentiation strategy

USE GAP ANALYSIS WHEN:
├── Feature planning
├── Understanding player needs
├── Identifying quick wins
└── Competitive response planning

USE RESPONSE PLANNING WHEN:
├── Competitor makes moves
├── Market dynamics shift
├── Protecting market position
└── Proactive defense strategy
```

---

*Last Updated: January 2025*
*Agent: Prism (Market Analyst)*
*Version: 1.0.0*
