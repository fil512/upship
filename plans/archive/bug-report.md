# Bug Report: Construction Hall Does Not Build Ships

## Summary

When a player places an agent at the Construction Hall location during worker placement phase, the placement succeeds but no ship is built. The `executeLocationAction` function appears to not be called at all.

## Severity

**Critical** - Core game functionality broken. Players cannot build ships, making the game unplayable.

## Environment

- Local development server (Node.js with PostgreSQL via Docker)
- Also confirmed on Railway production deployment

## Steps to Reproduce

1. Start a new 4-player game
2. Wait for worker placement phase
3. Have the current player place an agent at `construction_hall` using a wrench-symbol card

```bash
# Setup local environment
npm run db:up
npm run migrate:local
npm run dev:local

# In another terminal, setup a test game
python scripts/playtest.py --local setup BugTest

# Check whose turn it is
UPSHIP_URL=http://localhost:3000 npm run cli -- playtest_germany state <gameId>

# Find a wrench card in the current player's hand, then place at construction_hall
UPSHIP_URL=http://localhost:3000 npm run cli -- playtest_<player> action <gameId> PLACE_AGENT locationId=construction_hall cardIndex=<wrenchCardIndex> buildCount=1
```

## Expected Behavior

1. Agent is placed at Construction Hall
2. Card effect triggers (if applicable)
3. **`executeLocationAction` is called with `locationId="construction_hall"`**
4. **`processBuildShip` is called, creating a new ship**
5. Player's ship count increases by 1
6. Game log shows "Built 1 ship(s)"

## Actual Behavior

1. Agent is placed at Construction Hall ✓
2. Card effect triggers (if applicable) ✓
3. **`executeLocationAction` is NOT called** ✗
4. **No ship is built** ✗
5. Player's ship count remains 0
6. Game log does NOT show any ship building message

### Evidence

Game log after placement shows only:
```
Placed agent at Construction Hall using Mechanic
Card effect: +1 swap this action
```

Missing expected entries:
```
[DEBUG-BEFORE] About to call executeLocationAction with locationId="construction_hall"
[DEBUG] executeLocationAction called with locationId="construction_hall"
[DEBUG] construction_hall case hit, buildCount=1
Built 1 ship(s)
```

Database query confirms no debug logs exist:
```sql
SELECT state->'log' FROM game_states WHERE game_id='<gameId>';
-- Returns only "Placed agent..." and "Card effect..." entries
```

## Investigation Notes

### Debug Logging Added

Added debug logging to `server/actions/worker.js`:

1. **Before `executeLocationAction` call (line 660)**:
   ```javascript
   console.log('=== DEBUG === executeLocationAction will be called with locationId:', locationId);
   state.log.push({
     timestamp: new Date().toISOString(),
     message: `[DEBUG-BEFORE] About to call executeLocationAction with locationId="${locationId}"`,
     playerId,
     type: 'debug'
   });
   ```

2. **Inside `executeLocationAction` before switch (line 271)**:
   ```javascript
   state.log.push({
     timestamp: new Date().toISOString(),
     message: `[DEBUG] executeLocationAction called with locationId="${locationId}"`,
     playerId,
     type: 'debug'
   });
   ```

3. **Inside `construction_hall` case (line 347)**:
   ```javascript
   state.log.push({
     timestamp: new Date().toISOString(),
     message: `[DEBUG] construction_hall case hit, buildCount=${buildCount}`,
     playerId,
     type: 'debug'
   });
   ```

### Key Finding

**NONE of the debug logs appear** - not in the game state log, not in the server console output. This means the code path from line 657 (after card effect logging) to line 660 (debug logging before executeLocationAction) is NOT being executed.

The code that IS executing:
- `processPlaceAgent` is called
- Card is discarded, agent is placed
- `processCardEffect` is called and logged (we see "Card effect: +1 swap this action")

The code that is NOT executing:
- Line 660+ debug logging and `executeLocationAction` call

### Possible Causes

1. **State mutation issue**: The state object being modified might not be the one being persisted
2. **Different code path**: PLACE_AGENT might be handled by different code than expected
3. **Early return**: Something between card effect and location action causing early return
4. **Exception swallowed**: An uncaught exception being silently handled

## Files Involved

- `server/actions/worker.js` - Contains `processPlaceAgent` and `executeLocationAction`
- `server/actions/building.js` - Contains `processBuildShip`
- `server/routes/gameState.js` - Routes action requests

## Next Steps

1. Trace how PLACE_AGENT action is routed from the API endpoint to `processPlaceAgent`
2. Check if there's action processing code in `gameState.js` that might be handling PLACE_AGENT differently
3. Add console.log immediately after the card effect logging (line 657) to verify execution reaches that point
4. Check if there are multiple versions of worker.js or module caching issues
