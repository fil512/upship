# Bug Report: Age Progression Blocked

**Date**: 2025-12-30
**Discovered During**: Automated playtest (50 turns, local dev server)
**Severity**: Critical - Game cannot progress past Age 1

## Summary

After 50 turns of playtesting, the game remains stuck in Age 1 with:
- Progress Track: 5/12 (needs 12 to trigger Age 2)
- R&D Board: EMPTY (0 technologies available)
- Tech Bag: EMPTY (0 technologies remaining)
- All routes claimed by turn 17, no new launches possible

The game is unplayable because players cannot acquire technologies to advance the Progress Track.

---

## Issue 1: Duplicate TECHNOLOGY_BAG Definitions

### Symptom
Two different `TECHNOLOGY_BAG` constants exist with different technology IDs and structures.

### Affected Files
1. **`server/config/constants.js`** (lines 72-108)
2. **`server/services/gameStateService.js`** (lines 351-427)

### Root Cause Analysis

**constants.js TECHNOLOGY_BAG** (29 total techs):
```javascript
// Age 1: 12 techs with IDs like:
'wooden_framework', 'wire_bracing', 'duralumin_girders', 'rubberized_cotton',
'doped_canvas', 'goldbeater_skin', 'daimler_engine', 'improved_propeller',
'maybach_engine', 'passenger_gondola', 'observation_deck', 'cargo_systems'
```

**gameStateService.js TECHNOLOGY_BAG** (54 total techs):
```javascript
// Age 1: 12 techs with DIFFERENT IDs like:
'daimler_engine', 'improved_propeller', 'dual_engine_mount', 'wooden_framework',
'wire_bracing', 'rubberized_cotton', 'doped_canvas', 'improved_valving',
'manual_ballonets', 'observation_platform', 'mail_compartment', 'cargo_nets'
```

### Data Flow Issue

1. **Game Initialization** (`gameStateService.js:630`):
   ```javascript
   const { rdBoard, techBag } = createTechBagAndRDBoard(1, Array.from(allStartingTechs));
   ```
   Uses LOCAL `TECHNOLOGY_BAG` from gameStateService.js

2. **Age Transitions** (`technology.js:9`):
   ```javascript
   const { TECHNOLOGY_BAG } = require('../config/constants');
   ```
   Uses DIFFERENT `TECHNOLOGY_BAG` from constants.js

3. **Tech Type Lookups** (`technology.js:148-164`):
   ```javascript
   function buildTechTypeMap() {
     for (const tech of TECHNOLOGY_BAG[age] || []) {  // Uses constants.js version
   ```

### Specific Mismatches

| gameStateService.js (used at init) | constants.js (used at runtime) |
|------------------------------------|--------------------------------|
| `improved_valving` | (not present) |
| `manual_ballonets` | (not present) |
| `observation_platform` | `observation_deck` |
| `mail_compartment` | (not present) |
| `cargo_nets` | `cargo_systems` |

### Impact
- Technologies initialized from one bag may not be recognized by runtime code
- Age transition may add techs with IDs that don't match existing patterns
- Specialization discount calculations may fail for mismatched IDs

### Test Cases Needed
```javascript
// Test: TECHNOLOGY_BAG consistency
describe('TECHNOLOGY_BAG definitions', () => {
  it('should have identical tech IDs in constants.js and gameStateService.js', () => {
    const constantsBag = require('../config/constants').TECHNOLOGY_BAG;
    const serviceBag = require('../services/gameStateService').TECHNOLOGY_BAG;

    for (const age of [1, 2, 3]) {
      const constantsIds = new Set(constantsBag[age].map(t => t.id));
      const serviceIds = new Set(serviceBag[age].map(t => t.id));
      expect(constantsIds).toEqual(serviceIds);
    }
  });
});
```

---

## Issue 2: R&D Board Becomes Empty and Unrecoverable

### Symptom
After the playtest, both `rdBoard` and `techBag` are completely empty:
```
progressTrack: 5
rdBoard length: 0
techBag length: 0
```

With 9 available techs initially and only 5 acquired, 4 techs are missing.

### Affected Files
- `server/services/gameStateService.js` - `createTechBagAndRDBoard()`
- `server/actions/technology.js` - `processAcquireTechnologyResearch()`
- `server/actions/reveal.js` - `executeAllReveals()`
- `server/actions/helpers/marketHelpers.js` - `refillRDBoard()`

### Root Cause Analysis

**Initial State Calculation**:
```
Age 1 techs in gameStateService.js: 12
Excluded (starting techs matching Age 1): 3
  - wire_bracing (Britain)
  - rubberized_cotton (Italy)
  - doped_canvas (Britain)
Available: 9
  -> rdBoard: 4
  -> techBag: 5
```

**After 5 Acquisitions**:
```
Expected: rdBoard=4, techBag=0
Actual: rdBoard=0, techBag=0
Missing: 4 technologies
```

### Hypothesis: Techs Lost During Error Handling

In `reveal.js:130-140`:
```javascript
for (const techId of techAcquisitions) {
  try {
    processAcquireTechnologyResearch(state, playerId, { techId, _internal: true });
  } catch (e) {
    state.log.push({...});  // Error logged but state may be partially mutated
  }
}
```

If `processAcquireTechnologyResearch` throws AFTER modifying state but BEFORE completing:

In `technology.js:199-268`:
```javascript
function processAcquireTechnologyResearch(state, playerId, data) {
  // Lines 211-232: Validation (throws if fails) - BEFORE state mutation
  const techIndex = state.rdBoard.findIndex(t => t.id === techId);  // 211
  if (techIndex === -1) throw new GameRuleError('...');              // 213
  if (playerState.technologies.includes(techId)) throw ...;          // 219-221
  if (availableResearch < cost) throw ...;                           // 230-232

  // Lines 234-252: State mutation - AFTER validation
  playerState.research = ...;           // 236-241
  playerState.technologies.push(...);   // 244
  state.rdBoard.splice(techIndex, 1);   // 247
  state.rdBoard.push(techBag.shift());  // 250-251
  state.progressTrack++;                // 255
}
```

**Current order is safe** - throws happen before mutations.

### Alternative Hypothesis: Bot Requests Non-Existent Techs

The bot's `get_rd_board()` function parses CLI output:
```python
def get_rd_board(game_id):
    output = strip_ansi(run_cli("playtest_germany", "state", game_id))
    for line in output.split('\n'):
        if 'R&D Board' in line:
            in_rd_section = True
        # ... parse tech IDs
```

**Problem**: When rdBoard is empty, CLI doesn't display the R&D Board section:
```javascript
// cli/upship.js:565-573
if ((gs.rdBoard || []).length > 0) {
  console.log(c(COLORS.bright, '┌─ R&D Board (Available Technologies)'));
  // ...
}
```

**Result**: Bot can't see available techs, so it requests nothing or stale IDs.

### Possible State Corruption Points

1. **Phase transitions may clear rdBoard**
2. **Multiple refillRDBoard implementations**:
   - `server/services/gameStateHelpers.js:689-704`
   - `server/actions/helpers/marketHelpers.js:81-90`
   Both exist and use slightly different logic.

### Test Cases Needed
```javascript
describe('R&D Board integrity', () => {
  it('should maintain tech count: rdBoard + techBag + acquired = initial', () => {
    const state = createGameState();
    const initialCount = state.rdBoard.length + state.techBag.length;

    // Acquire 3 techs
    for (let i = 0; i < 3; i++) {
      processAcquireTechnologyResearch(state, playerId, {
        techId: state.rdBoard[0].id,
        _internal: true
      });
    }

    const finalCount = state.rdBoard.length + state.techBag.length;
    const acquiredCount = state.players[playerId].technologies.length - startingTechCount;

    expect(finalCount + acquiredCount).toBe(initialCount);
  });

  it('should refill rdBoard from techBag after acquisition', () => {
    const state = createGameState();
    const techId = state.rdBoard[0].id;
    const initialRdBoardSize = state.rdBoard.length;
    const initialTechBagSize = state.techBag.length;

    processAcquireTechnologyResearch(state, playerId, { techId, _internal: true });

    if (initialTechBagSize > 0) {
      expect(state.rdBoard.length).toBe(initialRdBoardSize); // Refilled
      expect(state.techBag.length).toBe(initialTechBagSize - 1);
    }
  });

  it('should not lose techs when acquisition fails validation', () => {
    const state = createGameState();
    const initialTotal = state.rdBoard.length + state.techBag.length;

    expect(() => {
      processAcquireTechnologyResearch(state, playerId, {
        techId: 'nonexistent_tech',
        _internal: true
      });
    }).toThrow();

    const finalTotal = state.rdBoard.length + state.techBag.length;
    expect(finalTotal).toBe(initialTotal);
  });
});
```

---

## Issue 3: Routes Exhausted - No Return Mechanism

### Symptom
From turn 18 onwards, all players show "no launches (no routes available)":
```
18       worker_placement     italy              no launches (no routes available)
19       worker_placement     usa                no launches (no routes available)
...repeated for 30+ turns...
```

### Affected Files
- `server/data/routes.js` - Route definitions
- `server/actions/launch.js` - Route claiming logic
- `server/actions/helpers/ageTransition.js` - Route reset at age transition

### Root Cause Analysis

**Routes are claimed permanently within an age**:
```javascript
// launch.js - when ship lands on route
route.claimed = playerId;  // Permanent claim
```

**Routes only reset at age transition** (`ageTransition.js:303-308`):
```javascript
if (state.map && state.map.routes) {
  for (const route of state.map.routes) {
    route.claimed = null;  // Only cleared here
  }
}
```

**But age transition never triggers** because:
1. Progress Track stuck at 5/12
2. Need 12 tech acquisitions to trigger Age 2
3. rdBoard is empty, so no techs can be acquired
4. Therefore routes never reset

### Game Design Issue

The playtest revealed a **death spiral**:
1. Players build ships → Launch to routes → Routes get claimed
2. Players can't launch (no routes) → Focus on other actions
3. Other actions don't advance Progress Track efficiently
4. Can't buy techs (rdBoard empty) → Progress stuck
5. Age never advances → Routes never reset → Game stalls

### Number of Routes vs. Launches

From the log, 12 successful launches happened:
```
route_rhine_valley (Britain)
route_bodensee (USA)
route_channel (Germany)
route_paris_express (USA)
route_north_sea (Italy)
route_baltic (Italy)
route_alpine (Germany)
route_mediterranean (Britain)
route_rome (Britain)
route_london_paris (Britain)
route_berlin_vienna (Britain x2)
route_imperial (Britain)
```

After turn 17, all Age 1 routes were claimed by the 4 players.

### Test Cases Needed
```javascript
describe('Route availability', () => {
  it('should have enough routes for multiple rounds of launches', () => {
    const routes = getAge1Routes();
    const playersCount = 4;
    const expectedLaunchesPerAge = playersCount * 3; // Each player launches ~3 ships

    expect(routes.length).toBeGreaterThanOrEqual(expectedLaunchesPerAge);
  });

  it('should reset routes at age transition', () => {
    const state = createGameState();

    // Claim some routes
    state.map.routes[0].claimed = 'player1';
    state.map.routes[1].claimed = 'player2';

    performAgeTransition(state, 2);

    for (const route of state.map.routes) {
      expect(route.claimed).toBeNull();
    }
  });

  it('should return ships to hangar at age transition', () => {
    const state = createGameState();
    const player = state.players[Object.keys(state.players)[0]];
    player.ships = [{ id: 'ship1', status: 'on_route', routeId: 'route1' }];

    performAgeTransition(state, 2);

    expect(player.ships[0].status).toBe('in_hangar');
  });
});
```

---

## Recommended Fix Priority

### Priority 1: Unify TECHNOLOGY_BAG (Critical)
- Delete duplicate definition in `gameStateService.js`
- Import from `constants.js` everywhere
- Update all tech IDs to be consistent

### Priority 2: Fix R&D Board Refill (Critical)
- Add logging to track tech acquisition/refill
- Ensure refillRDBoard is called after every acquisition
- Add invariant check: `rdBoard.length + techBag.length + acquired === initial`

### Priority 3: Game Balance - Route Scarcity (Design)
- Consider: Ships returning from routes after X turns
- Consider: More routes available in Age 1
- Consider: Ships can share routes with reduced income

---

## Reproduction Steps

```bash
# Start local server
npm run dev:local

# Setup playtest
UPSHIP_LOCAL=1 python scripts/playtest.py setup

# Run autoplay (will get stuck)
UPSHIP_LOCAL=1 python scripts/playtest.py autoplay 50

# Check state
UPSHIP_LOCAL=1 python scripts/playtest.py debug
```

Expected: Game progresses through ages
Actual: Stuck in Age 1, Turn 51, no technologies available
