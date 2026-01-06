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

### Step 3: Analyze and recommend tuning

After reading the analysis file, provide a comprehensive report with:

#### 3.1 Executive Summary
- Overall game economy health (healthy, too loose, too tight)
- Key problem resources that need attention
- Estimated impact on gameplay feel

#### 3.2 Resource-by-Resource Analysis

For each resource with issues, explain:
- **Current State**: Fountain rate, sink rate, net accumulation
- **Problem**: What's happening (e.g., "engineers accumulate with no sinks")
- **Gameplay Impact**: How this affects player experience
- **Recommended Fix**: Specific actionable changes

#### 3.3 Balance Targets

For an engaging board game, aim for these targets:
| Resource Type | Target Balance | Rationale |
|---------------|----------------|-----------|
| Currency (cash) | Sinks ≈ 80-100% of Fountains | Slight scarcity creates tension |
| Crew (officers, engineers) | Sinks ≈ 60-80% of Fountains | Should feel valuable but available |
| Consumables (gas) | Sinks ≈ 90-100% of Fountains | Should be mostly consumed |
| Income tracks | Sinks = 0 is OK | These are permanent upgrades |
| VP | Fountains only | Victory condition, no sinks |

#### 3.4 Specific Recommendations

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
