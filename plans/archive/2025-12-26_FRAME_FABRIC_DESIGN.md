# Frame & Fabric System Design

## Overview

Split the current Structure track into two distinct categories that affect both BUILD cost (Hull Cost) and LAUNCH performance:

- **Frame** — The structural skeleton (wood, duralumin, steel, geodetic)
- **Fabric** — The outer covering and gas cell materials (rubberized cotton, goldbeater's skin, doped canvas, gelatinized latex)

## Design Goals

1. Create meaningful build cost decisions
2. Reflect historical material progression and national differences
3. Add texture without excessive complexity
4. Resolve the undefined "Hull Cost" problem

---

## Hull Cost Formula

> **Hull Cost = £2 base + Frame Cost + Fabric Cost**

Each Frame and Fabric upgrade tile shows a **Hull Cost modifier** (£0 to £3) representing the material expense. This replaces the vague "based on Frame + Fabric upgrades" language.

**Example:**
- Base hull: £2
- Duralumin Frame: +£2
- Doped Canvas: +£1
- **Total Hull Cost: £5 per ship**

---

## Frame Technologies & Upgrades

Frame determines structural integrity, weight efficiency, and altitude capability.

### Frame Technology Tiles

| Age | Name | Research | £ | VP | Unlocks | Historical Note |
|-----|------|----------|---|----|---------|----|
| I | Wooden Framework | 1 | 1 | — | Wooden Frame | Early non-rigid/semi-rigid designs |
| I | Wire Bracing | 2 | 1 | 1 | Tensioned Frame | Improved structural rigidity |
| II | Duralumin Framework | 4 | 2 | — | Duralumin Frame | Standard Zeppelin material |
| II | Steel Framework | 3 | 1 | 2 | Steel Frame | British R101 experiment (heavier but cheaper) |
| II | Internal Keel | 3 | 1 | 1 | Semi-Rigid Keel | Italian Nobile design |
| III | Geodetic Structure | 4 | 2 | — | Geodetic Frame | Barnes Wallis innovation (R100) |
| III | Modular Construction | 5 | 2 | 3 | Modular Frame | Late-era standardization |

### Frame Upgrade Tiles

| Name | Required Tech | Weight | Hull Cost | Stats | Special |
|------|---------------|--------|-----------|-------|---------|
| Wooden Frame | Wooden Framework | -2 | +£1 | Reliability +1 | — |
| Tensioned Frame | Wire Bracing | -1 | +£1 | Ceiling +1 | — |
| Duralumin Frame | Duralumin Framework | -2 | +£2 | Reliability +2, Ceiling +1 | — |
| Steel Frame | Steel Framework | -3 | +£1 | Reliability +2 | Heavier but cheap |
| Semi-Rigid Keel | Internal Keel | -2 | +£1 | Reliability +1, Lift +1 | Italy's specialty |
| Geodetic Frame | Geodetic Structure | -1 | +£3 | Reliability +2, Ceiling +1 | Lightest, most expensive |
| Modular Frame | Modular Construction | -1 | +£2 | — | +2 tile swaps at Design Bureau |

---

## Fabric Technologies & Upgrades

Fabric determines gas-tightness, weather resistance, and aerodynamics.

### Fabric Technology Tiles

| Age | Name | Research | £ | VP | Unlocks | Historical Note |
|-----|------|----------|---|----|---------|----|
| I | Rubberized Cotton | 1 | 1 | — | Cotton Envelope | Basic, cheap, adequate |
| I | Doped Canvas | 2 | 1 | — | Doped Covering | Cellulose treatment for tautness |
| II | Goldbeater's Skin | 4 | 2 | 2 | Premium Envelope | Cattle intestine membrane, very rare |
| II | Fireproof Coating | 3 | 1 | 2 | Fire-Resistant Fabric | Reduces fire risk |
| II | Aluminum Doping | 3 | 1 | 1 | Reflective Covering | Heat/UV protection |
| III | Gelatinized Latex | 4 | 2 | — | Synthetic Envelope | Goodyear innovation, replaced goldbeater's |
| III | Composite Covering | 5 | 2 | 1 | Advanced Fabric | Multi-layer modern design |

### Fabric Upgrade Tiles

| Name | Required Tech | Weight | Hull Cost | Stats | Special |
|------|---------------|--------|-----------|-------|---------|
| Cotton Envelope | Rubberized Cotton | 0 | +£0 | — | Basic default |
| Doped Covering | Doped Canvas | 0 | +£1 | Speed +1 | Improved aerodynamics |
| Premium Envelope | Goldbeater's Skin | 0 | +£3 | Reliability +1, Range +1 | Best gas-tightness |
| Fire-Resistant Fabric | Fireproof Coating | -1 | +£2 | Reliability +1 | Ignore first Fire hazard |
| Reflective Covering | Aluminum Doping | 0 | +£1 | Reliability +1 | Protects gas from heat |
| Synthetic Envelope | Gelatinized Latex | 0 | +£2 | Reliability +1, Range +1 | Modern replacement for goldbeater's |
| Advanced Fabric | Composite Covering | 0 | +£2 | Reliability +2 | Multi-layer protection |

---

## Interaction with Existing Rules

### Blueprint Slots (Updated)

Blueprints now have **dedicated slot types** instead of generic Structure slots:
- **Frame slots:** Only accept Frame tiles (structural skeleton)
- **Fabric slots:** Only accept Fabric tiles (outer covering)
- **Drive slots:** Accept Propulsion tiles (unchanged)
- **Payload slots:** Accept Payload tiles (unchanged)

**Slot Scaling by Age:**
| Age | Frame | Fabric | Drive | Payload |
|-----|-------|--------|-------|---------|
| Age I | 1 | 1 | 1 | 1 |
| Age II | 1 | 1 | 2 | 2 |
| Age III | 2 | 2 | 2 | 3 |

### Default/Baseline

Empty Frame/Fabric slots use the **printed baseline** on the Blueprint:
- Basic frame and cotton covering implied
- Hull Cost = £2 base only for empty slots
- No stat bonuses until tiles are installed

**Required Slots:** You must fill all Frame and Fabric slots to launch. Empty slots mean the ship isn't complete.

### Gas Cubes on Frame Tiles

Each Frame tile has a **gas cube socket**:
- When installing a Frame tile, place 1 gas cube (Hydrogen or Helium) on it
- Gas cubes provide Lift based on gas type
- This creates a physical link between structure and buoyancy
- Age III ships need 2 Frame tiles = 2 gas cubes = more lift capacity

---

## National Flavor

### Germany (Zeppelin)
- Historical: Masters of Duralumin, Goldbeater's Skin shortage in WWI
- Game effect: Start with Duralumin Framework technology (Age II advantage)
- But: Goldbeater's Skin was rationed — could have higher Research cost for them?

### Britain (Royal Airship Works)
- Historical: R100 used Geodetic, R101 tried Steel (failed)
- Game effect: Cheaper access to Geodetic Structure? Steel Framework as budget option?

### Italy (Nobile Construction)
- Historical: Semi-rigid keel designs, rubberized cotton envelope
- Game effect: Internal Keel as starting technology (supports their semi-rigid specialty)

### USA (Goodyear-Zeppelin)
- Historical: Pioneered Gelatinized Latex as goldbeater's skin replacement
- Game effect: Cheaper Gelatinized Latex? Or exclusive early access?

---

## Example Build Scenarios

### Budget Pioneer (Age I)
- Wooden Frame (+£1)
- Cotton Envelope (+£0)
- **Hull Cost: £3 per ship**
- Stats: Reliability +1

### German Workhorse (Age II)
- Duralumin Frame (+£2)
- Doped Covering (+£1)
- **Hull Cost: £5 per ship**
- Stats: Reliability +2, Ceiling +1, Speed +1

### Premium Liner (Age III)
- Geodetic Frame (+£3)
- Premium Envelope (+£3)
- **Hull Cost: £8 per ship**
- Stats: Reliability +3, Ceiling +1, Range +1
- Lightest weight, highest performance

### Fire-Safe Design (Any Age)
- Any Frame
- Fire-Resistant Fabric (+£2)
- Reduces Hydrogen fire risk

---

## Summary of Changes Needed

1. **Section 7.1:** Update Hull Cost formula
2. **Section 12.8:** Add Frame/Fabric to terminology
3. **Appendix C:** Split Structure track into Frame + Fabric categories (or add as new tracks)
4. **Appendix D:** Add Frame/Fabric upgrade tables with Hull Cost column
5. **Quick Reference:** Update Build Checklist with new Hull Cost formula

---

## RESOLVED: Design Decisions

### 1. Dedicated Slot Types (Confirmed)

Each Blueprint has **dedicated Frame slots** and **dedicated Fabric slots**:
- Frame tiles can only go in Frame slots
- Fabric tiles can only go in Fabric slots
- This replaces the generic "Structure slot" concept

### 2. Age Scaling (Confirmed)

| Age | Frame Slots | Fabric Slots | Total |
|-----|-------------|--------------|-------|
| Age I | 1 | 1 | 2 |
| Age II | 1 | 1 | 2 |
| Age III | 2 | 2 | 4 |

Age III ships are significantly more complex, requiring more Frame and Fabric investment.

### 3. Frame Tiles Have Gas Cube Slots (Confirmed)

Each **Frame tile** has an **empty square** printed on it where a **gas cube** is placed:
- This physically ties Frame to gas capacity
- More Frame tiles = more gas cubes = more Lift potential
- Creates a visual representation of the airship's internal structure

**Gas Cube Mechanic:**
- When you install a Frame tile, place 1 gas cube on it
- Each gas cube provides Lift (amount varies by gas type: Hydrogen vs Helium)
- At launch, you must have enough gas cubes to satisfy the Physics Check

### 4. Faction Starting Technologies (Confirmed)

Based on historical accuracy:

| Faction | Starting Frame Tech | Starting Fabric Tech | Historical Basis |
|---------|--------------------|--------------------|------------------|
| **Germany** | Duralumin Framework | Goldbeater's Skin | Zeppelin mastery of both |
| **Britain** | Wire Bracing | Doped Canvas | Conservative R-series approach |
| **USA** | Duralumin Framework | Gelatinized Latex | Goodyear-Zeppelin partnership |
| **Italy** | Internal Keel | Rubberized Cotton | Nobile semi-rigid designs |

**Design Notes:**
- Germany starts with premium materials (Goldbeater's Skin) but faces the Helium Embargo
- USA starts with the synthetic fabric (Gelatinized Latex) reflecting Goodyear innovation
- Italy's Internal Keel supports their semi-rigid specialty and grants +1 Lift
- Britain starts with basic materials but has early Luxury (from existing faction design)

---

## Updated Blueprint Slot Configuration

Replacing the old Drive/Structure/Payload system with explicit slot types:

| Faction | Age I | Age II | Age III |
|---------|-------|--------|---------|
| | F/Fb/D/P | F/Fb/D/D/P/P | F/F/Fb/Fb/D/D/P/P/P |
| **Germany** | 1/1/1/1 | 1/1/2/2 | 2/2/2/3 |
| **Britain** | 1/1/1/1 | 1/1/2/2 | 2/2/2/3 |
| **USA** | 1/1/1/1 | 1/1/2/2 | 2/2/2/3 |
| **Italy** | 1/1/1/1 | 1/1/2/1 | 2/2/2/2 |

**Key:** F=Frame, Fb=Fabric, D=Drive, P=Payload

**Note:** Italy retains their "Low Ceiling" flaw with fewer Payload slots.

---

## Existing Structure Tiles — Reclassification

Current Structure tiles need reclassification:

| Current Tile | New Category | Rationale |
|--------------|--------------|-----------|
| Wooden Framework → Wooden Frame | Frame | Structural skeleton |
| Wire Bracing → Tensioned Frame | Frame | Structural skeleton |
| Duralumin Framework → Duralumin Frame | Frame | Structural skeleton |
| Internal Keel → Semi-Rigid Keel | Frame | Structural skeleton |
| Geodetic Structure → Geodetic Frame | Frame | Structural skeleton |
| Modular Construction → Modular Frame | Frame | Structural skeleton |
| Fireproof Coating → Fire-Resistant Fabric | Fabric | Outer covering treatment |
| External Walkway → Crew Access | **Remove** | Merge into Frame functionality |
| Armored Gondola → Military Armor | **Payload** | Defensive equipment, not structure |
| Pressurized Cabin → Altitude Cabin | **Payload** | Crew environment system |
| Crash Safety System → Emergency Ballast | **Payload** | Safety equipment |

**New Fabric Tiles to Add:**
- Cotton Envelope (Rubberized Cotton)
- Doped Covering (Doped Canvas)
- Premium Envelope (Goldbeater's Skin)
- Reflective Covering (Aluminum Doping)
- Synthetic Envelope (Gelatinized Latex)
- Advanced Fabric (Composite Covering)
