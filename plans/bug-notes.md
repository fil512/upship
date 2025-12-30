# Bug Hunting Notes

This document catalogs bug patterns discovered during development to help identify similar issues across the codebase.

## Bug Pattern: Property Name Inconsistency

### Description
Different functions operate on different property names that should refer to the same data, causing silent data loss or incorrect behavior.

### Example: R&D Board Property Mismatch (2025-12-30)

**Symptom**: Game never advanced past Age I despite 50 turns of play. Progress track stuck at 5/12.

**Root Cause**: Two functions used different property names for the R&D board:
- `refreshRnDBoard()` wrote to `state.rnDBoard.available`
- All tech acquisition code read from `state.rdBoard`

**Result**:
- At each turn start, `refreshRnDBoard()` drained `techBag` into the unused `rnDBoard.available`
- Tech acquisition correctly used `rdBoard` but couldn't refill because `techBag` was empty
- Players accumulated thousands of research with no technologies to buy

**Fix**: Changed `refreshRnDBoard()` to use `state.rdBoard` consistently.

### How to Hunt for Similar Bugs

1. **Search for property name variations**:
   ```bash
   # Find all state property accesses
   grep -r "state\.\w\+" server/ --include="*.js" | sort | uniq -c | sort -rn

   # Look for similar-but-different names
   grep -rE "state\.(rd|RD|rnd|Rnd|rnD)" server/
   grep -rE "state\.(tech|Tech)" server/
   grep -rE "state\.(market|Market)" server/
   ```

2. **Check for camelCase inconsistencies**:
   - `rdBoard` vs `rnDBoard` vs `RDBoard`
   - `techBag` vs `TechBag` vs `technologyBag`
   - `marketRow` vs `MarketRow` vs `marketCards`

3. **Verify read/write symmetry**:
   - For each property written, verify it's read by corresponding logic
   - For each property read, verify it's written by initialization logic

4. **Look for orphaned properties**:
   - Properties that are written but never read
   - Properties that are read but never written (would cause undefined errors)

### Properties to Audit

Based on this bug, these state properties should be audited for consistency:

| Canonical Name | Potential Variants | Status |
|---------------|-------------------|--------|
| `rdBoard` | `rnDBoard`, `RDBoard`, `rdBoardAvailable` | FIXED |
| `techBag` | `technologyBag`, `TechBag` | TODO |
| `marketRow` | `marketCards`, `MarketRow` | TODO |
| `marketDeck` | `MarketDeck` | TODO |
| `groundBoard` | `GroundBoard`, `ground_board` | TODO |
| `workerPlacement` | `WorkerPlacement` | TODO |
| `revealPhase` | `RevealPhase` | TODO |

---

## Bug Pattern: Function Duplication with Divergent Behavior

### Description
Multiple functions exist that do nearly the same thing but have subtle differences, leading to inconsistent behavior depending on which is called.

### Example: refillRDBoard vs refreshRnDBoard

Both functions were meant to fill the R&D board from the tech bag, but:
- `refillRDBoard()` - Correctly used `state.rdBoard`, used `shift()`
- `refreshRnDBoard()` - Incorrectly used `state.rnDBoard.available`, used `pop()`

### How to Hunt for Similar Bugs

1. **Search for similar function names**:
   ```bash
   grep -rE "function (refresh|refill|update|reset)" server/ --include="*.js"
   grep -rE "(refresh|refill|update|reset)\w+\(" server/ --include="*.js"
   ```

2. **Look for functions with overlapping purposes**:
   - Multiple functions that modify the same state property
   - Functions with names suggesting the same operation (refresh vs refill vs replenish)

3. **Check import statements**:
   - If similar functions exist, which one is actually imported and used?
   - Are there unused imports of similar functions?

---

## Bug Pattern: Initialization vs Runtime State Shape

### Description
State is initialized with one shape but runtime code expects a different shape.

### How to Hunt

1. **Compare initialization code to runtime access**:
   ```bash
   # Find where state is initialized
   grep -r "state\s*=" server/services/gameStateService.js

   # Compare to where state properties are accessed
   grep -rE "state\.\w+\." server/
   ```

2. **Check for optional chaining patterns** that might mask missing properties:
   ```bash
   grep -rE "state\.\w+\?\." server/
   ```

---

## Design Issue: Age II Threshold Unreachable (2025-12-30)

**Status**: RESOLVED

**Symptom**: Game cannot progress to Age II because threshold is unreachable.

**Root Cause**:
- Age 1 TECHNOLOGY_BAG has 12 techs
- 3 are faction starting techs which were completely excluded
- Only 9 techs remained for acquisition
- Progress threshold for 4 players to reach Age II is 12 techs

**Fix Applied**: Tech tile scaling per player count (Section 3.1)
- Each tech tile now has (N-1) copies where N = player count
- Faction starters reduce copies: if 1 player has a starter, 2 copies remain in bag
- For 4 players: 33 Age 1 tiles available (vs. 9 before)
- Game now successfully transitions Age 1 → Age 2 → Age 3

**Verified**: Playtest showed Age transitions at Turn 10 (→ Age 2) and Turn 21 (→ Age 3).

---

## Adding New Bug Patterns

When you discover a new bug pattern:

1. Add a section with:
   - **Description**: What the pattern is
   - **Example**: A specific instance with symptom, root cause, and fix
   - **How to Hunt**: Concrete grep/search commands to find similar issues

2. Update the "Properties to Audit" or similar tracking tables

3. Consider adding automated lint rules or tests to prevent recurrence
