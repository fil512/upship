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
| 3 | Location Action Execution | High | RESOLVED |
| 4 | Incorrect "YOUR TURN" Display | Medium | RESOLVED |
| 5 | Autoplay Script Outdated | Medium | RESOLVED |

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

## Previously Outstanding Issues (Now Resolved)

### Bug #3: Location Action Execution Failure - RESOLVED
**Severity:** High
**Location:** `server/routes/gameState.js:1227-1279` (executeLocationAction function)

The `executeLocationAction` function used hyphenated location IDs (`construction-hall`) but `groundBoard.js` uses underscored IDs (`construction_hall`). This mismatch caused all location actions to fail with "Unknown location" errors.

**Fix:** Updated all case statements in `executeLocationAction` to use underscored IDs matching `groundBoard.js`.

### Bug #4: Incorrect "YOUR TURN" Display - RESOLVED
**Severity:** Medium
**Location:** `cli/upship.js:413-459`

The CLI was using `currentPlayerIndex` for turn detection regardless of phase. During worker placement, it should use `workerPlacement.currentPlacerIndex`, and during reveal phase it's simultaneous.

**Fix:** Added phase-aware turn detection:
- Worker placement: Uses `workerPlacement.currentPlacerIndex`
- Reveal phase: Shows simultaneous turn status based on `playersEndedTurn`
- Other phases: Uses `currentPlayerIndex`

### Bug #5: Autoplay Script Outdated - RESOLVED
**Severity:** Medium
**Location:** `scripts/playtest.py`

The autoplay script had several issues:
1. `get_phase()` regex only captured first word of multi-word phases like "WORKER PLACEMENT"
2. Location IDs used hyphens instead of underscores
3. `get_player_hand()` regex didn't match the actual card format `[0] Name (symbol)`
4. `get_current_placer()` wasn't properly detecting whose turn it was

**Fixes:**
- Updated `get_phase()` to normalize multi-word phase names
- Updated location symbols dict to use underscored IDs
- Fixed `get_player_hand()` regex to match `[N] Name (symbol)` format
- Improved `get_current_placer()` to check each player's view for "YOUR TURN"
- Added debugging output and better loop termination in worker placement phase

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

## Next Steps

All blocking issues have been resolved. Recommended next actions:

1. **Run a new playtest** to verify all fixes work correctly
2. **Test ship building flow** - now that location actions work, verify ships can be built at Construction Hall
3. **Test launching and route claiming** - verify the full airship lifecycle works
4. **Complete a full game** through Age 2 to validate progression mechanics

## Code Changes Made This Session

1. **Commit 2a7d141:** Fix worker placement turn check bug
2. **Commit 1e397a1:** Allow simultaneous actions during reveal phase
3. **playtest.py updates:** Added `debug`, `sessions` commands for debugging
4. **server/routes/gameState.js:** Fixed location IDs in `executeLocationAction` (hyphens → underscores)
5. **cli/upship.js:** Added phase-aware turn detection for correct "YOUR TURN" display
6. **scripts/playtest.py:** Multiple fixes for autoplay:
   - Fixed phase name parsing for multi-word phases
   - Fixed location IDs to use underscores
   - Fixed card parsing regex
   - Improved current placer detection
   - Added debugging output
