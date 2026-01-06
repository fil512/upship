# Resource Flow Analysis Command

Analyze the game's economic balance by running a playtest and examining resource fountains (sources) and sinks (drains). This helps identify which resources are accumulating too much (need more sinks) or depleting too fast (need more fountains).

## Steps

### Step 1: Run a playtest to generate resource flow data

```bash
./scripts/restart_server.sh
python -m playtest setup
python -m playtest autoplay
```

### Step 2: Run the analysis script

```bash
python scripts/analyze_flow.py
```

The script automatically finds the most recent flow JSON and outputs:
- **Purchasing Power Analysis** - techs/cards per player per round vs goals
- **Currency Analysis** - research/influence generation vs costs
- **Resource Flow Analysis** - overflow/deficit for all resources
- **Per-Round Detail** - breakdown by faction

### Step 3: Review the output against design goals

#### Design Goals (PRIMARY METRICS):

| Purchase Type | Target per Player per Round | Rationale |
|---------------|----------------------------|-----------|
| **Tech tiles** | **1** (rarely 2) | Age progression should be gradual |
| **Market cards** | **1** (rarely 2) | Deck building should be steady |
| **Total purchases** | **2** baseline, **3** on exceptional rounds | Creates meaningful decisions |

The script compares actual purchases against these targets and diagnoses:
- Whether research generation is too high or tech costs too low
- Whether influence economy is balanced for card purchases
- Which resources have overflow (no sinks) or deficit

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

**PRIMARY TARGETS (Purchasing Power):**

| Purchase Type | Target per Player per Round | How to Achieve |
|---------------|----------------------------|----------------|
| **Tech tiles** | **1** (max 2 rarely) | Research gen ≈ avg tech cost |
| **Market cards** | **1** (max 2 rarely) | Influence gen ≈ avg card cost |
| **Total purchases** | **2** baseline | Creates meaningful scarcity |

**SECONDARY TARGETS (Resource Flow):**

| Resource Type | Target Balance | Rationale |
|---------------|----------------|-----------|
| Currency (cash) | Sinks ≈ 80-100% of Fountains | Slight scarcity creates tension |
| Crew (officers, engineers) | Sinks ≈ 60-80% of Fountains | Should feel valuable but available |
| Consumables (gas) | Sinks ≈ 90-100% of Fountains | Should be mostly consumed |
| Research | Generation ≈ 1× avg tech cost | Afford exactly 1 tech per round |
| Influence | Generation ≈ 1× avg card cost | Afford exactly 1 card per round |
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
The economy has a critical pacing problem. Players buy 2.8 techs/round
(goal: 1), causing ages to progress 3x too fast. The game ends in 3 rounds
instead of the target 8-10 rounds.

=== PURCHASING POWER (PRIMARY METRIC) ===

DESIGN GOALS:
  - Techs per player per round: 1 (max 2 on rare rounds)
  - Cards per player per round: 1 (max 2 on rare rounds)

ACTUAL RESULTS:
Round | Techs/Player | Cards/Player | Total | Status
------|--------------|--------------|-------|-------
R1    | 2.5          | 0.5          | 3.0   | ❌ TOO MANY TECHS
R2    | 2.8          | 0.5          | 3.3   | ❌ TOO MANY TECHS
R3    | 3.0          | 1.0          | 4.0   | ❌ WAY TOO MANY TECHS

CURRENCY ANALYSIS:
  Research: 4.5 generated/player/round, avg tech cost 1.4
            → Purchasing power: 3.2 techs (goal: 1) ❌
  Influence: 3.0 generated/player/round, avg card cost 2.8
            → Purchasing power: 1.1 cards (goal: 1) ✓

CRITICAL FIX NEEDED:
  Option A: Triple tech costs (from avg 1.4 to avg 4.0)
  Option B: Reduce research generation by 66%
  Option C: Only count Drive techs for age progression

=== SECONDARY METRICS ===

HEALTHY RESOURCES:
- Cash: 76 in, 76 out (perfect balance)
- Influence: 61% utilization (acceptable)

PROBLEM RESOURCES:
- Engineers: 17 in, 1 out (94% overflow - no sinks!)
- Officers: 6 in, 1 out (83% overflow - few launches)
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
