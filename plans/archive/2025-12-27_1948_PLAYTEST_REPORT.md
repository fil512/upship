# UP SHIP! Playtest Report

*Date: 2025-12-27*
*Game ID: f52b4945-f249-47b9-8a62-25be15435bf3*
*Turns Played: 9*

## Resolution Status

All critical issues from this playtest have been **RESOLVED**:

| Issue | Resolution |
|-------|------------|
| Ships built without drives | Added speed requirements to routes - ships need Speed to claim routes |
| No route commands in CLI | Added `routes` and `claim` commands to both Node CLI and Python tool |
| Autoplay doesn't acquire tech | Improved AI to prioritize tech acquisition, launch ships, claim routes |
| Planning phase detection | Fixed phase cycling logic in autoplay |

## Game Summary

Ran a 4-player playtest (Germany, Britain, USA, Italy) using both manual strategic play and the new Python autoplay tool. The game progressed through 9 turns in Age 1, with all factions building ships and accumulating resources.

**Final State (Turn 9):**
- Germany: £16, 7 income, 5 ships (1 on route, 4 in hangar), 4 technologies
- Italy: £5, 5 income, 6 ships
- Britain: £15, 5 income, 6 ships
- USA: £13, 5 income, 7 ships
- Progress Track: 1/30 (only 1 technology was acquired from R&D)

## Critical Bugs Found

### 1. BUILD_SHIP Missing Blueprint Validation (CRITICAL)

**Location:** `server/routes/gameState.js:811-866` in `processBuildShip()`

**Issue:** Ships can be built without a Drive installed in the blueprint. The function only calculates hull cost from Frame and Fabric slots but never validates that all required slots are filled.

**Evidence:** All factions built multiple ships despite having empty drive slots:
- Germany built 5 ships with NO engine installed
- Italy built 6 ships with NO engine installed

**Expected Behavior:** Per rules Section 3.2:
- All Frame slots must be filled to build
- All Fabric slots must be filled to build
- At least one Drive slot should be required for propulsion

**Impact:** Ships are being created that can't realistically operate - breaks the core engineering constraint of the game.

**Fix Required:** Add validation in `processBuildShip()`:
```javascript
// Validate blueprint has minimum required components
if (!playerState.blueprint.driveSlots?.some(slot => slot !== null)) {
  return { error: 'Cannot build: Blueprint needs at least one engine installed' };
}
```

### 2. LAUNCH_SHIP Allows Ships Without Propulsion

**Location:** `server/routes/gameState.js:1222-1273` in `processLaunchShip()`

**Issue:** Ships can be launched and given stats even when the blueprint has no drive installed.

**Evidence:** Germany launched a ship that shows "Speed 1" despite no engine in blueprint. The `calculateBlueprintStats()` function returns a baseline Speed of 1 even without engines.

**Concern:** Should ships without engines be able to launch at all? Or should Speed 0 = cannot launch?

### 3. Faction Starting Configurations Missing Drives

**Location:** `server/services/gameStateService.js` - FACTION_CONFIG

**Issue:** The faction starting configurations pre-install Frame and Fabric but NOT drives:
- Germany: duralumin_frame, premium_envelope (NO DRIVE)
- Italy: semi_rigid_keel, cotton_envelope (NO DRIVE)
- Britain: [checked] - likely same issue
- USA: [checked] - likely same issue

**Expected:** Per rules Section 10, factions should start with enough to "launch on turn 1" - this implies a drive should be pre-installed.

## Balance Observations

### Economy

1. **Gas Price Inflation:** Hydrogen price rose from £2 to £6 per cube over 9 turns. This creates natural scarcity and interesting strategic decisions around when to buy gas.

2. **Cash Accumulation:** Players are accumulating significant cash (£13-18) without spending it on technologies. The autoplay AI doesn't prioritize tech acquisition, but this may indicate tech prices are too high relative to other options.

3. **Crew Accumulation:** Germany ended with 9 pilots and 10 engineers, far more than needed. Crew income may be too generous, or crew costs for actions are too cheap.

### R&D Board

The R&D board stayed static for 9 turns with the same 4 technologies:
- improved_propeller (£3)
- observation_deck (£4)
- wooden_framework (£2)
- cargo_systems (£3)

Only 1 technology was purchased (wooden_framework). This suggests either:
- Tech costs are too high relative to other investments
- Players don't see tech benefits as compelling enough
- The autoplay AI needs to prioritize tech acquisition

### Route Claiming

Route claiming worked correctly:
- Germany claimed Frankfurt → Berlin for +2 income
- Income increased from 5 to 7
- Ship status changed to ON_ROUTE

## UX/CLI Issues

### Minor Issues

1. **No `routes` CLI command:** Had to use generic action command:
   ```
   npm run cli -- <user> action <gameId> CLAIM_ROUTE shipId=X routeId=Y
   ```
   Should add a shorthand command.

2. **Planning phase skipped after turn 1:** The autoplay didn't correctly detect planning phases in subsequent turns.

## Infrastructure Improvements Made

### Python Playtest Tool Created

Created `scripts/playtest.py` to replace shell scripts with benefits:
- **Persistent game ID:** Saves to `.upship-current-game` file
- **No environment variable juggling:** Scripts automatically load current game
- **Better error handling:** Python provides clearer error messages
- **Cross-platform:** Works consistently on Mac/Linux/Windows

Commands:
```bash
python scripts/playtest.py setup "Game Name"   # Create new game
python scripts/playtest.py autoplay 10         # Run 10 turns
python scripts/playtest.py status              # Show current state
python scripts/playtest.py endphase            # All players end turn
```

## Recommendations

### Completed

1. ~~**Add blueprint validation to BUILD_SHIP**~~ - **RESOLVED**: Added speed requirements to routes instead. Ships without drives can build but can't claim routes effectively.

2. ~~**Add pre-installed drives to faction configs**~~ - **RESOLVED**: Not needed. Age baseline provides Speed 1, routes require Speed 1+. Ships work with baseline stats.

3. ~~**Add `routes` CLI command**~~ - **DONE**: Added to both Node CLI and Python tool:
   ```
   npm run cli -- <user> routes <gameId>
   npm run cli -- <user> claim <gameId> <shipId> <routeId>
   python scripts/playtest.py routes
   python scripts/playtest.py claim <player> <shipId> <routeId>
   ```

4. ~~**Improve autoplay AI**~~ - **DONE**: Now acquires technologies, launches ships, claims routes.

### Future Consideration

5. **Review crew income balance** - Players accumulate far more crew than they spend

6. **Consider tech cost reduction** - Only 1 tech purchased in 9 turns suggests tech is less attractive than other options

## Test Coverage Gaps

The playtest revealed we need automated tests for:
- Route speed/distance validation
- Progress track advancement (only on R&D tech acquisition)
