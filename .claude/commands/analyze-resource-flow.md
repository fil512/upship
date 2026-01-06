# Resource Flow Analysis Command

Analyze the game's economic balance by running a playtest and examining resource fountains (sources) and sinks (drains). This helps identify which resources are accumulating too much (need more sinks) or depleting too fast (need more fountains).

## Steps

### Step 1: Run a playtest to generate resource flow data

```bash
./scripts/restart_server.sh
python -m playtest setup
python -m playtest autoplay
```

### Step 2: Locate and read the analysis file

After the playtest completes, look for the most recent resource flow analysis file:

```bash
ls -t logs/resource-flows/*_analysis.txt | head -1
```

Read the analysis file to understand:
- **Resource Totals**: Fountains (gains) vs Sinks (drains) vs Net for each resource
- **Balance Status**: OK, OVERFLOW (accumulating), or DEFICIT (depleting)
- **Fountain Breakdown**: Where resources come from (trickle, action, route, etc.)
- **Sink Breakdown**: Where resources go (purchase, build, launch, hazard, etc.)
- **Per-Faction Summary**: How each faction's economy differs
- **Balance Warnings**: Automatic detection of problem resources

### Step 3: Analyze Research/Influence at Reveal Phase

This is a critical analysis to identify if players have too much or too little purchasing power during the reveal phase.

Read the JSON log file (not just the analysis summary) and extract per-round data:

```bash
# Get the JSON file path
JSON_FILE=$(ls -t logs/resource-flows/*.json | head -1)
```

For each round, calculate:

**Research Economy:**
- **Available at Reveal**: Sum of all `research` fountains from round start through reveal phase
- **Spent at Reveal**: Sum of all `research` sinks during reveal phase (tech acquisitions)
- **Leftover**: Available - Spent

**Influence Economy:**
- **Available at Reveal**: Sum of all `influence` fountains from round start through reveal phase
- **Spent at Reveal**: Sum of all `influence` sinks during reveal phase (card purchases using influence)
- **Leftover**: Available - Spent

**Warning Signs:**
- If leftover research is consistently > 50% of available: Players can't spend their research (need more/cheaper techs, or reduce research generation)
- If leftover research is consistently 0 AND players wanted more techs: Players are research-starved (need more research sources)
- Same analysis for influence

**Output Format:**
```
=== RESEARCH/INFLUENCE PHASE ANALYSIS ===

Round 1:
  Research: 3 available → 2 spent → 1 leftover (33% unused)
  Influence: 0 available → 0 spent → 0 leftover

Round 2:
  Research: 4 available → 4 spent → 0 leftover (fully utilized)
  Influence: 1 available → 0 spent → 1 leftover (100% unused!)

...

SUMMARY:
  Research utilization: 85% average (HEALTHY)
  Influence utilization: 20% average (WARNING: players can't use influence)

RECOMMENDATIONS:
  - Influence is underutilized. Consider: cheaper influence costs, more influence-only items
```

### Step 4: Analyze and recommend tuning

After reading the analysis file, provide a comprehensive report with:

#### 4.1 Executive Summary
- Overall game economy health (healthy, too loose, too tight)
- Key problem resources that need attention
- Estimated impact on gameplay feel

#### 4.2 Resource-by-Resource Analysis

For each resource with issues, explain:
- **Current State**: Fountain rate, sink rate, net accumulation
- **Problem**: What's happening (e.g., "engineers accumulate with no sinks")
- **Gameplay Impact**: How this affects player experience
- **Recommended Fix**: Specific actionable changes

#### 4.3 Balance Targets

For an engaging board game, aim for these targets:
| Resource Type | Target Balance | Rationale |
|---------------|----------------|-----------|
| Currency (cash) | Sinks ≈ 80-100% of Fountains | Slight scarcity creates tension |
| Crew (officers, engineers) | Sinks ≈ 60-80% of Fountains | Should feel valuable but available |
| Consumables (gas) | Sinks ≈ 90-100% of Fountains | Should be mostly consumed |
| Research | Sinks ≈ 70-90% of Fountains | Players should usually buy techs, occasional leftover OK |
| Influence | Sinks ≈ 50-80% of Fountains | Optional currency, but should be usable |
| Income tracks | Sinks = 0 is OK | These are permanent upgrades |
| VP | Fountains only | Victory condition, no sinks |

#### 4.4 Specific Recommendations

Prioritize recommendations by:
1. **Critical**: Resources with >50% overflow or 0 sinks (breaking balance)
2. **Important**: Resources with >30% overflow (degrading experience)
3. **Minor**: Resources slightly out of balance (polish)

For each recommendation, suggest concrete code changes:
- Which files to modify
- What values to change
- Expected impact on balance

### Example Analysis Output

```
=== RESOURCE FLOW ANALYSIS REPORT ===

EXECUTIVE SUMMARY:
The economy has significant imbalances. Engineers accumulate indefinitely
(39 gained, 0 spent) creating a hoarding problem. Cash is well-balanced.
Officers are slightly tight which creates good tension.

CRITICAL ISSUES:
1. ENGINEERS (39 fountains, 0 sinks = 100% overflow)
   - Problem: Engineers accumulate with nothing to spend them on
   - Impact: Players hoard engineers, reducing decision pressure
   - Fix: Increase hazard difficulty so engineers are spent on checks
         Also consider: repair cost of 1 engineer per damaged ship

2. ENGINEER_INCOME (3 fountains, 0 sinks = 100% overflow)
   - Note: This is an income track, 0 sinks is expected
   - However: Review if 3 upgrades per game is too generous

HEALTHY RESOURCES:
- Cash: 176 in, 199 out (13% deficit - good tension)
- Officers: 9 in, 10 out (tight but manageable)
- Research: 6 in, 29 out (converted to technologies)

RECOMMENDATIONS:
1. [Done] Increased hazard difficulties by +1 to consume more engineers
2. [Done] Added 1 engineer cost to ship repairs
3. Consider: engineer upkeep cost during income phase?
```

## Reference: Resource Types

| Resource | Typical Fountains | Typical Sinks |
|----------|-------------------|---------------|
| cash | income phase, loans, routes | purchases, builds, recruits |
| officers | academy, flight school, income | launches |
| engineers | technical institute, income | hazard checks, repairs |
| hydrogen | gas depot | launches |
| helium | gas depot | launches |
| income | routes, tech | N/A (track) |
| research | research level + engineers | technology acquisition |
| influence | card effects, locations | card purchases (alternative to cash) |
| officer_income | flight school | N/A (track) |
| engineer_income | technical institute | N/A (track) |

## Reference: Lost Garden Value Chain Methodology

This analysis is based on the "Value Chains" game economy design methodology:

- **Fountains**: Sources that add resources to the economy
- **Sinks**: Drains that remove resources from the economy
- **Flow Velocity**: How quickly resources move through the system
- **Pool Accumulation**: Excess resources sitting unused

Healthy economies have:
- Sinks that roughly match fountain output
- Multiple competing uses for each resource
- Temporary scarcity that creates tension
- No "dead" resources that accumulate indefinitely
