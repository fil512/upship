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

### Blueprint Slots

Keep the existing Structure slots. Frame and Fabric tiles both occupy Structure slots:
- **Age I:** 1 Structure slot (choose Frame OR Fabric, or another Structure upgrade)
- **Age II:** 2 Structure slots
- **Age III:** 2 Structure slots

This creates a meaningful choice: do you invest in Frame (ceiling, structural reliability) or Fabric (gas-tightness, range, fire resistance)?

### Default/Baseline

If no Frame or Fabric upgrades are installed, ships use the **printed baseline** on the Blueprint:
- Implied basic wooden frame and cotton covering
- Hull Cost = £2 base only
- No stat bonuses from Frame/Fabric

### Existing Structure Tiles

Some current Structure tiles are neither Frame nor Fabric — they remain as general Structure upgrades:
- **Crew Access** (External Walkway) — crew mobility system
- **Military Armor** (Armored Gondola) — defensive plating
- **Altitude Cabin** (Pressurized Cabin) — crew environment
- **Emergency Ballast** (Crash Safety System) — safety system

These don't contribute to Hull Cost but still occupy Structure slots and provide stats.

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

## Open Questions

1. **Separate tracks or sub-categories?**
   - Option A: Keep as Structure track, mark tiles as Frame/Fabric type
   - Option B: Create separate Frame and Fabric tracks (affects specialization discounts)

2. **Slot types?**
   - Option A: Any Structure slot can hold Frame, Fabric, or other Structure
   - Option B: Dedicated Frame slot and Fabric slot on Blueprint

3. **Faction starting techs?**
   - Should factions start with specific Frame/Fabric technologies?

**Recommendation:** Option A for both — simpler, maintains current slot system, just adds Hull Cost and tile categorization.
