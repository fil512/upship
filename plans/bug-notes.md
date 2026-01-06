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

### Example: Tech Bag Property Mismatch (2026-01-05)

**Symptom**: Tech cards never replenished on the R&D board. Round 2 showed only 1 tech card instead of 4.

**Root Cause**: Initialization used one property name, but helper functions used a different name:
- `gameStateService.ts` initialized state with `techBag: techCardBag` (property named `techBag`)
- `refreshRnDBoard()` and other helpers read from `state.techCardBag` (non-existent property)

**Affected files** (all reading from wrong property):
- `server/actions/helpers/marketHelpers.ts`
- `server/actions/helpers/ageTransition.ts`
- `server/services/gameStateHelpers.ts`
- `server/actions/technology.ts`
- `server/services/actionProcessorService.ts`

**Result**:
- `state.techCardBag` was always `undefined` (property doesn't exist)
- Fallback `state.techCardBag = state.techCardBag || []` created empty array
- No cards ever moved from tech bag to R&D board
- Players ran out of tech cards to acquire

**Why this was hard to catch**:
- The code initialized the fallback array, so no runtime errors occurred
- TypeScript interfaces defined `techCardBag?` as optional, masking the issue
- The API type (`api/src/game.ts`) correctly used `techBag`, but extended interfaces overrode it

**Fix**: Changed all files to use `state.techBag` consistently. Updated tests that also used wrong name.

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

3. **Check for optional property overrides that mask bugs**:
   ```bash
   # Find extended interfaces that make properties optional
   grep -rE "interface.*extends.*\{" server/ --include="*.ts" -A 5 | grep "?"

   # Compare to API type definitions
   grep -rE "^\s+\w+:" api/src/game.ts | head -50
   ```

4. **Verify read/write symmetry**:
   - For each property written, verify it's read by corresponding logic
   - For each property read, verify it's written by initialization logic

5. **Look for orphaned properties**:
   - Properties that are written but never read
   - Properties that are read but never written (would cause undefined errors)

### Properties to Audit

Based on this bug, these state properties should be audited for consistency:

| Canonical Name | Potential Variants | Status |
|---------------|-------------------|--------|
| `rdBoard` | `rnDBoard`, `RDBoard`, `rdBoardAvailable` | FIXED |
| `techBag` | `techCardBag`, `technologyBag`, `TechBag` | FIXED 2026-01-05 |
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

## Bug Pattern: Complete Implementation Bypassed by Stub/Simplified Version (2025-12-31)

### Description
A complete, correct implementation exists but another part of the code calls a simplified or stub version of the same functionality, bypassing critical steps.

### Example: Age Transition Free Blueprint Design Phase Skipped

**Symptom**: Players never get free Blueprint Design upgrades during age transitions. Blueprint frame/fabric slots stay empty throughout the game. Ships can never launch because slots aren't filled.

**Root Cause**: Two separate age transition implementations existed:

1. **Complete implementation** (`ageTransition.js`):
   - `performAgeTransition()` which calls `startAgeTransition()`
   - Scores VP for routes and technologies (Section 12.1 step 1)
   - Recovers ships and officers (Section 12.1 step 2)
   - Calculates transition income (Section 12.1 step 3)
   - Expands blueprint slots (Section 12.1 step 4)
   - **Enters `age_transition_blueprint_design` phase** (Section 12.1 step 5)
   - Properly handles faction-specific flaws (Britain's Red Tape, etc.)

2. **Simplified stub** (`phaseTransition.js`):
   - `checkAgeTransitionByProgressTrack()` which only:
   - Sets `state.age = 2` or `3`
   - Sets up combat mission row for Age II
   - **Does NOT call the complete implementation**

**Call site issue**: `startNewRound()` in `phaseTransition.js` called the stub version:
```javascript
// WRONG: Uses simplified stub that skips critical steps
checkAgeTransitionByProgressTrack(state);
```

Should call:
```javascript
// CORRECT: Uses complete implementation from ageTransition.js
performAgeTransition(state, newAge);
```

**Result**:
- Blueprint slots were never expanded (stayed at 1/1 instead of 2/2 in Age III)
- Players never got free Blueprint Design upgrades during transitions
- Ships could never launch because frame/fabric slots weren't filled
- VP was never scored for routes/technologies at age boundaries

### How to Hunt for Similar Bugs

1. **Search for duplicate implementations with similar names**:
   ```bash
   # Find all functions related to a feature
   grep -rE "function.*(age|Age|transition|Transition)" server/ --include="*.js" | grep -v test

   # Look for "check" vs "perform" vs "do" variants
   grep -rE "function (check|perform|do|handle|process)\w+(Transition|Phase|Turn)" server/
   ```

2. **Compare complete vs partial implementations**:
   ```bash
   # Find where a complete implementation exists
   grep -rE "(state\.phase\s*=|phase transitions)" server/actions/helpers/ --include="*.js" -A 3

   # Find where the same state is modified elsewhere
   grep -rE "state\.age\s*=" server/ --include="*.js"
   ```

3. **Look for feature flags or conditional logic that might skip complete path**:
   - Simple conditional: `if (condition) { simpleVersion() } else { completeVersion() }`
   - The simple version may have been left in for debugging or edge cases

4. **Check call sites for critical features**:
   ```bash
   # Who calls the complete version?
   grep -r "performAgeTransition\|startAgeTransition" server/ --include="*.js"

   # Who calls the stub version?
   grep -r "checkAgeTransitionByProgressTrack" server/ --include="*.js"
   ```

5. **Verify state machine completeness**:
   - If a feature has a dedicated phase (like `age_transition_blueprint_design`), verify the phase is actually entered
   - Search for the phase name to see where it's set vs where it's handled

### Functions to Audit

| Complete Implementation | Stub/Simplified Version | Status |
|------------------------|------------------------|--------|
| `performAgeTransition()` | `checkAgeTransitionByProgressTrack()` | FIXED 2025-12-31 |
| `completeAgeTransition()` | (inline age setting) | FIXED 2025-12-31 |

---

## Bug Pattern: Data Model Mismatch Between Server and Client (2025-12-31)

### Description
Server stores data in one structure/format, but client expects a different structure/format.

### Example: Route Data Not Parsed by Python Client

**Symptom**: `state.routes` is empty in Python client, so ships can never launch (no available routes).

**Root Cause**: Server vs Client data model mismatch:

| Aspect | Server (Node.js) | Client (Python) |
|--------|------------------|-----------------|
| Location | `state.map.routes` | `state.routes` |
| Distance | `route.range` | `route.distance` |
| Availability | `route.claimed === null` | `route.available === true` |
| Speed req | `route.speed` | `route.speed_requirement` |

**Client code** (GameState.from_dict in models.py):
```python
routes = [Route.from_dict(r) for r in data.get('routes', [])]  # Wrong: looks at state.routes
```

**Server code** (gameStateService.js):
```javascript
state.map = createAgeIMap();  // Routes are in state.map.routes
```

**Result**: Python client sees 0 routes, bots never try to launch ships.

### How to Hunt for Similar Bugs

1. **Compare client models to server data**:
   ```bash
   # Find client model definitions
   grep -r "class.*State\|@dataclass" client/ --include="*.py"

   # Compare to server state creation
   grep -r "state\.\w\+ =" server/services/gameStateService.js
   ```

2. **Check property name mapping**:
   ```bash
   # Find property accesses in client
   grep -rE "\.\w+_\w+" client/ --include="*.py"  # snake_case

   # Find corresponding server properties
   grep -rE "\.\w+[A-Z]\w+" server/ --include="*.js"  # camelCase
   ```

3. **Test data round-trip**:
   - Serialize state from server, deserialize in client
   - Compare parsed object to raw JSON
   - Look for None/empty values that should have data

### Properties to Audit

| Server Path | Expected Client Path | Status |
|-------------|---------------------|--------|
| `state.map.routes` | `state.routes` | BUG: Client reads wrong path |
| `route.range` | `route.distance` | BUG: Property name mismatch |
| `route.claimed === null` | `route.available` | BUG: Derived property missing |

### Warning Signs

- Functions with names like `check...` that also mutate state (checking should be read-only)
- Similar functions in different files doing "almost the same thing"
- Phase/state values that are defined but never set during normal gameplay
- Features that work in tests but not in playtests (tests may call correct version directly)

---

## Adding New Bug Patterns

When you discover a new bug pattern:

1. Add a section with:
   - **Description**: What the pattern is
   - **Example**: A specific instance with symptom, root cause, and fix
   - **How to Hunt**: Concrete grep/search commands to find similar issues

2. Update the "Properties to Audit" or similar tracking tables

3. Consider adding automated lint rules or tests to prevent recurrence
