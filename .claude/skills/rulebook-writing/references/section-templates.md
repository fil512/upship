# Section Templates for UP SHIP! Rulebook

Templates for each major section type with UP SHIP!-specific examples.

## 1. Overview Section Template

```markdown
# [NUMBER]. [SECTION TITLE]

[1-2 sentence summary of what this section covers]

[Core concept or mechanic introduced in 2-3 sentences]

**Key Point:** [Single most important takeaway in bold]

[Rest of section content...]
```

### UP SHIP! Example: Overview

```markdown
# 1. OVERVIEW

Players act as Directors of rival Airship Conglomerates representing the great
powers of the early 20th century: **Germany**, **Britain**, **the United States**,
and **Italy**. Over three historical Ages, you must research technology, design
airship blueprints, and launch fleets to claim routes on an evolving map.

**Victory Condition:** The player with the most **Victory Points** at the end
of Age III wins.
```

---

## 2. Components Section Template

```markdown
# [NUMBER]. COMPONENTS

## [X.1] Per Player
- [Quantity] [Component Name] ([brief description])
- [Quantity] [Component Name]
...

## [X.2] Shared Components
- [Quantity] [Component Name] ([brief description])
...
```

### UP SHIP! Example: Components

```markdown
# 2. COMPONENTS

## 2.1 Per Player
- 1 Player Board (The Factory Interface)
- 3 Age-Specific Blueprint Boards (slotted overlays)
- 6 Airship Tokens (wooden meeples in player color)
- 3 Agent Tokens (workers)
- 1 Income Track Marker
- 1 VP Track Marker

## 2.2 Shared Components
- 3 Map Boards (Age I, Age II, Age III)
- 1 Ground Board (Worker Placement locations)
- Technology Tile Bag (48 tiles, Age-sorted)
```

---

## 3. Zone/Board Section Template

```markdown
# [NUMBER]. [BOARD NAME]

[Brief description of the board's purpose]

## [X.1] Zone 1: [Zone Name] ([Location on Board])

[Description of zone function]

**[Feature Name]:** [Explanation of key feature]

| [Column 1] | [Column 2] | [Column 3] |
|------------|------------|------------|
| [Data]     | [Data]     | [Data]     |

**Key Point:** [Critical rule about this zone]
```

### UP SHIP! Example: Player Board Zone

```markdown
## 3.2 Zone 2: The Blueprint (Center)

An Age-specific overlay representing your current Airship Model—your
"Factory Standard."

### Age-Specific Blueprints

Each Age, you replace your Blueprint overlay with the new Age's version.
Blueprints have **four slot types** for installing upgrade tiles:

- **Frame Slots:** Accept Frame tiles (structural skeleton)
- **Fabric Slots:** Accept Fabric tiles (outer covering materials)
- **Drive Slots:** Accept Propulsion tiles (engines and propellers)
- **Payload Slots:** Accept Payload tiles (cargo, passengers, equipment)

**Key Point:** Technologies never expire. You can use an old technology
into Age III, but its poor weight-to-power ratio will make the resulting
upgrades inefficient for longer routes.
```

---

## 4. Procedure Section Template

```markdown
# [NUMBER]. [PROCEDURE NAME]

## [X.1] [Procedure Overview]

[Brief description of when/why this procedure happens]

**[Procedure Name] Steps:**

1. [First step with specific instruction]
2. [Second step]
3. [Third step]
4. [Continue as needed...]

> **Example:** [Concrete example walking through the procedure]

### [X.1.1] [Sub-procedure or Special Case]

[Details of variant or exception]
```

### UP SHIP! Example: Launch Procedure

```markdown
# 7. BUILDING AND LAUNCHING SHIPS

## 7.2 Launch Procedure

When you take the Launchpad action, you may launch one ship.

**Launch Steps:**

1. **Verify Physics Check:** Confirm Total Lift ≥ Total Weight
2. **Pay Officer Cost:** Spend Officers equal to the current Age number (1/2/3)
3. **Spend Gas Cubes:** Move cubes from Gas Reserve to the launched ship
4. **Draw Hazard Card:** Resolve the Hazard Check (see Section 7.3)
5. **Claim Route:** If successful, place your ship token on an eligible route

> **Example:** In Age II, Maria launches her ship with 3 Hydrogen cubes
> (15 Lift) and upgrades weighing 12 total. She passes the Physics Check,
> pays 2 Officers, and proceeds to draw a Hazard Card.

### 7.2.1 Launching Without a Route

If no eligible routes exist, you may still launch to establish presence
on the map. The ship remains at your home port until a route becomes
available.
```

---

## 5. System Section Template

```markdown
# [NUMBER]. [SYSTEM NAME]

[1-2 sentence overview of the system's role in the game]

## [X.1] [Core Mechanic]

[Detailed explanation of how the core mechanic works]

| [Condition/Type] | [Effect/Cost] | [Notes] |
|------------------|---------------|---------|
| [Row 1]          | [Data]        | [Data]  |
| [Row 2]          | [Data]        | [Data]  |

## [X.2] [Secondary Mechanic]

[Explanation of related mechanic]

**Interaction with [Other System]:** [Cross-reference explanation]
```

### UP SHIP! Example: Technology System

```markdown
# 4. TECHNOLOGY AND UPGRADES

Technology drives your airship development, unlocking new capabilities
across four specialized tracks.

## 4.1 Acquiring Technologies

At the Research Institute, spend Research tokens to acquire Technology
tiles from the R&D Board. Place acquired tiles in your Drawing Office,
organized by track.

| Technologies in Track | Research Discount |
|----------------------|-------------------|
| 1-2                  | None              |
| 3-4                  | -1 Research       |
| 5+                   | -2 Research       |

## 4.2 Installing Upgrades

Owning a Technology tile unlocks its corresponding Upgrade for installation.

**Interaction with Blueprint:** Each Upgrade must be installed in a
matching slot type on your Blueprint (see Section 3.2).
```

---

## 6. Phase Section Template

```markdown
# [NUMBER]. [PHASE NAME] PHASE

## [X.1] Phase Overview

[When this phase occurs in the round structure]

**Duration:** [How long/what ends the phase]

## [X.2] [Action Type 1]

[Description of action and how to perform it]

## [X.3] [Action Type 2]

[Description of next action type]

## [X.4] Phase End

[What triggers the end of this phase and what happens next]
```

### UP SHIP! Example: Worker Placement Phase

```markdown
# 6. THE GAME LOOP

## 6.1 Worker Placement Phase

Players take turns placing Agents on the Ground Board to claim actions.

**Duration:** Continue until all players have placed all Agents or passed.

### Available Actions

| Location | Symbol | Effect |
|----------|--------|--------|
| Research Institute | Wrench | Acquire Technology tiles |
| Design Bureau | Wrench | Install/remove Upgrades |
| Construction Hall | Wrench | Build ships |
| Launchpad | Propeller | Launch ships to claim routes |

### Passing

If you cannot or choose not to place an Agent, you may pass. You cannot
place additional Agents this round after passing.

### Phase End

The Worker Placement Phase ends when all players have either placed all
Agents or passed. Proceed to the Reveal Phase.
```

---

## 7. Appendix Section Template

```markdown
# APPENDIX [LETTER]: [TITLE]

[Brief description of what this appendix contains]

## [Category 1]

| [Column 1] | [Column 2] | [Column 3] | [Column 4] |
|------------|------------|------------|------------|
| [Entry 1]  | [Data]     | [Data]     | [Data]     |
| [Entry 2]  | [Data]     | [Data]     | [Data]     |

## [Category 2]

[Continue with additional categories or entries...]
```

### UP SHIP! Example: Technology Appendix

```markdown
# APPENDIX C: TECHNOLOGY TILES

Complete reference for all Technology tiles organized by track and Age.

## Propulsion Track

| Name | Age | Cost | Unlocks | Effect |
|------|-----|------|---------|--------|
| Steam Engine | I | 3 | Basic Engine | Speed +1 |
| Diesel Engine | II | 4 | Diesel Drive | Speed +2, Weight +1 |
| Blau Gas | III | 5 | Blau System | Range +3, reduces fuel weight |

## Structure Track

| Name | Age | Cost | Unlocks | Effect |
|------|-----|------|---------|--------|
| Duralumin | I | 3 | Light Frame | Weight -1, Reliability +1 |
```

---

## 8. Quick Reference Template

```markdown
# QUICK REFERENCE

## Turn Sequence
1. **[Phase 1]:** [Brief description]
2. **[Phase 2]:** [Brief description]
3. **[Phase 3]:** [Brief description]

## Key Formulas
- **[Formula Name]:** [Formula] (e.g., Lift ≥ Weight)

## Costs Summary
| Action | Cost |
|--------|------|
| [Action 1] | [Cost] |

## [Other Quick Reference Category]
[Relevant quick reference info]
```

### UP SHIP! Example: Quick Reference

```markdown
# APPENDIX B: QUICK REFERENCE

## Round Sequence
1. **Worker Placement:** Place Agents on Ground Board locations
2. **Reveal:** Flip cards, gain resources, execute card effects
3. **Income/Cleanup:** Collect Income, discard cards, retrieve Agents

## Physics Check
**Lift ≥ Weight** (required to launch)
- Each Gas Cube provides +5 Lift
- Weight = sum of all installed Upgrade weights

## Officer Costs
| Age | Officers to Launch |
|-----|-------------------|
| I   | 1                 |
| II  | 2                 |
| III | 3                 |

## Ground Board Locations
| Symbol | Locations |
|--------|-----------|
| Wrench | Research Institute, Design Bureau, Construction Hall |
| Propeller | Launchpad, Ministry, Gas Depot, Weather Bureau |
| Coin | Academy, Flight School, Technical Institute, The Bank |
```
