# UP SHIP! Playtest Report

**Date:** 2025-12-28
**Game ID:** 003d2816-bd2c-420b-ba46-4572e4fc9289
**Turns Played:** 2 complete turns (1 manual, 1 partial with autoplay)

---

## Issue Summary

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Worker Placement Turn Check | Critical | RESOLVED |
| 2 | Reveal Phase Turn Check | Critical | RESOLVED |
| 3 | Location Action Execution | High | **TODO** |
| 4 | Incorrect "YOUR TURN" Display | Medium | **TODO** |
| 5 | Autoplay Script Outdated | Medium | **TODO** |

---

## Game Summary

A 4-player game was set up with Britain, USA, Germany, and Italy. The game progressed through:
- Turn 1: Full worker placement (12 agents placed across all 12 locations), reveal phase (all players acquired 1 technology each), income/cleanup
- Turn 2: Partial - autoplay struggled to progress due to script issues

**Final State:**
- Progress: 4/30 (Age 2 threshold: 10)
- All factions at £20 cash, 5 income
- No ships built yet
- Technologies acquired: 4 total (1 per faction)

## Resolved Issues

### Bug #1: Worker Placement Turn Check - RESOLVED
**Severity:** Critical (game-breaking)
**Location:** `server/routes/gameState.js:177-190`

The action endpoint was checking `currentPlayerIndex` instead of `workerPlacement.currentPlacerIndex` during worker placement phase. After the first player placed an agent and the turn advanced, all subsequent players got "Not your turn" errors even though `workerPlacement.currentPlacerIndex` had correctly advanced.

**Fix:** Added phase-specific turn checking that uses `workerPlacement.currentPlacerIndex` during worker placement.

### Bug #2: Reveal Phase Turn Check - RESOLVED
**Severity:** Critical (game-breaking)
**Location:** `server/routes/gameState.js:187-189`

The reveal phase is designed for simultaneous play - all players acquire technology and signal when done via END_TURN. However, the strict turn check was blocking all players except the first from acting.

**Fix:** Added `skipTurnCheck = true` for reveal phase to allow simultaneous actions.

## Outstanding Issues (TODO)

### Bug #3: Location Action Execution Failure - TODO
**Severity:** High
**Location:** `server/routes/gameState.js` (executeLocationAction function)

Most location IDs (construction_hall, gas_depot, design_bureau, research_institute, technical_institute) fail with "Unknown location" error when executing the location action. The agent placement succeeds, but the location-specific action (e.g., building ships at Construction Hall) doesn't fire.

**Impact:** Players can place agents but can't actually execute the actions at those locations.

**Example log:**
```
✓ PLACE_AGENT executed successfully
  Location action failed: Unknown location: construction_hall
```

### Bug #4: Incorrect "YOUR TURN" Display - TODO
**Severity:** Medium
**Location:** CLI state display

The status display shows ">>> YOUR TURN <<<" for a player even when it's actually another player's turn. The "Waiting for:" indicator is correct, but the "YOUR TURN" banner is misleading.

### Bug #5: Autoplay Script Outdated - TODO
**Severity:** Medium
**Location:** `scripts/playtest.py` (autoplay function)

The autoplay script was written for an older game loop and doesn't properly:
- Detect the current placer during worker placement
- Handle the 3-phase structure correctly
- Parse the new status output format

The script gets stuck in "Phase stuck at WORKER" loops.

## Balance Observations

### Positive
1. **Income collection works:** Players correctly received £5 income per turn
2. **Engineer upkeep works:** £3 was deducted for engineer maintenance
3. **Ministry bonus works:** Italy visited Ministry and went first next round
4. **Technology progress tracking works:** Progress increased by 1 per tech acquired

### Areas of Concern
1. **No ships built:** After 2 turns, zero ships were built. This may be due to Bug #3 (location actions not firing at Construction Hall) or because the early game focuses too heavily on tech acquisition.

2. **Slow progress:** 4/30 after 1 full turn means it would take ~8 turns to reach Age 2. This seems slow but may be intentional for a longer game.

3. **Hand management:** By end of Turn 2, Germany had 0 cards in hand (all 10 in discard). The deck refill mechanic should kick in, but worth monitoring.

## Strategic Observations

### What Worked
- Worker placement alternation worked smoothly after the fix
- Technology acquisition via Research points functioned correctly
- Phase transitions (worker_placement → reveal → income_cleanup → worker_placement) worked

### What Needs Testing
- Ship building flow (blocked by Bug #3)
- Ship launching mechanics
- Route claiming
- Hazard checks
- Age advancement

## Recommendations

### Priority 1: Fix Location Action Execution
The `executeLocationAction` function needs to recognize all location IDs. This is blocking core gameplay (building, launching, recruiting).

### Priority 2: Update Autoplay Script
Refactor `scripts/playtest.py` to:
- Use `workerPlacement.currentPlacerIndex` for turn detection
- Handle the 3-phase game loop properly
- Parse the new status output format

### Priority 3: Fix Display Bugs
- Remove or fix the misleading "YOUR TURN" banner
- Ensure UI correctly reflects whose turn it is

## Code Changes Made This Session

1. **Commit 2a7d141:** Fix worker placement turn check bug
2. **Commit 1e397a1:** Allow simultaneous actions during reveal phase
3. **playtest.py updates:** Added `debug`, `sessions` commands for debugging

## Next Steps

1. Investigate `executeLocationAction` to find why location IDs aren't recognized
2. Test ship building once location actions work
3. Complete a full game through Age 2 to validate progression
4. Stress test the autoplay once script is updated
