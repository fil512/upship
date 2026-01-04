# UI Playtest Report - 2026-01-02

## Overview

Browser-based UI playtest using Chrome DevTools MCP tools against the local development server (SvelteKit on port 5173, Express API on port 3000).

**Game ID:** `a72a3811-da67-4915-bb19-ccd244ae92b2`
**Players:** playtest_germany (manual), playtest_britain, playtest_usa, playtest_italy (CLI-assisted)
**Turns Completed:** 2 full turns

---

## Working Features

### Header Section
- [x] Age/Turn/Phase indicators update correctly in real-time
- [x] "Your Turn" / "Waiting for [player]" indicator works
- [x] Player switching dropdown functions (dev mode)
- [x] Online player count shows connected players

### Player Panels (Left Sidebar)
- [x] All 4 player panels display with resources
- [x] "TURN" badge moves to current player via Socket.io
- [x] "YOU" badge marks logged-in player
- [x] Cash, income, officers, engineers, gas cubes all display correctly

### Ship Stats Panel
- [x] Lift, Weight, Net Lift calculation displays
- [x] Range, Speed, Ceiling, Reliability, Luxury stats show
- [x] "READY TO LAUNCH" status indicator

### Ground Board (Center)
- [x] All 12 locations display with icons and descriptions
- [x] Locations grouped by symbol type (Technical, Operations, Business)
- [x] Agent placements show faction name on location
- [x] Matching locations enable when card selected ("Click to place")
- [x] Non-matching locations stay disabled
- [x] Occupied locations show agent owner

### Hand Section (Right Sidebar)
- [x] Cards display with symbol and abilities
- [x] Deck/discard counts update (deck icon / trash icon)
- [x] Cards enable/disable based on turn
- [x] Card selection highlights with focus state
- [x] Sidebar instructions update contextually ("Select a card" -> "Select a location")

### Actions Panel
- [x] "Undo PLACE_AGENT" button appears after placement
- [x] "End Turn" button appears when agents placed
- [x] Instructions text updates based on game state

### Real-Time Updates (Socket.io)
- [x] State changes broadcast to all connected clients
- [x] Location occupancy updates in real-time
- [x] Turn indicators move without page refresh
- [x] Phase transitions visible immediately

---

## UI Issues Found

### 1. Player Switching Hides Hand (Medium Priority)

**Problem:** When using the dev dropdown to switch to another player (e.g., Italy), their hand is hidden with message: "5 Agent Cards (hidden - viewing other player)"

**Expected:** For playtesting purposes, switching to another player should show their full hand and allow taking actions as that player.

**Impact:** Cannot test multiplayer flow from a single browser session.

**Location:** `web/src/routes/game/[id]/+page.svelte` or hand display component

### 2. Stale "Undo" Button Across Phases (Low Priority)

**Problem:** The "Undo PLACE_AGENT" button remained visible during the Income & Cleanup phase after being shown during worker placement.

**Expected:** Action buttons should reset/hide when the game phase changes.

**Impact:** Confusing UX - suggests actions are available when they aren't.

**Location:** Actions panel component

### 3. No "End Turn" Button in Income Phase (High Priority)

**Problem:** During Income & Cleanup phase, there was no visible End Turn button in the UI. The sidebar just showed "Collecting income..." without a way to proceed. Had to use CLI to advance.

**Expected:** Players should have a clear button to continue/end their turn during income phase.

**Impact:** Game cannot progress through UI alone during this phase.

**Location:** Actions panel or phase-specific UI logic

### 4. Toast Notifications Not Observed (Unknown Priority)

**Problem:** Did not observe toast notifications for turn changes or phase transitions during testing.

**Possible Causes:**
- Toasts may not be implemented yet
- Toasts may be styled to be invisible
- Toasts may only fire for certain events

**Expected:** Visual feedback when it becomes your turn or phase changes.

---

## Test Coverage

### Phases Tested
| Phase | Status | Notes |
|-------|--------|-------|
| Worker Placement | Tested | Full flow works |
| Reveal | Observed | Automatic transition works |
| Income & Cleanup | Partial | No UI button to proceed |
| Turn Advancement | Tested | Works correctly |

### Actions Tested via UI
| Action | Status | Notes |
|--------|--------|-------|
| Card selection | Tested | Works correctly |
| PLACE_AGENT | Tested | Card -> Location flow works |
| End Turn | Tested | Button appears and works |
| Player switching | Tested | Dropdown works but hides hand |

### Actions NOT Tested
| Action | Location | Reason |
|--------|----------|--------|
| BUILD_SHIP | Construction Hall | Time constraints |
| LAUNCH_SHIP | Launchpad | Time constraints |
| BUY_GAS | Gas Depot | Time constraints |
| INSTALL_UPGRADE | Design Bureau | Time constraints |
| RECRUIT_CREW | Academy | Time constraints |
| Undo functionality | Actions panel | Not clicked |

---

## UX Recommendations

### High Priority

1. **Add "Continue" or "End Turn" button for Income Phase**
   - Players need a clear way to advance through the income phase
   - Consider auto-advancing if no decisions are needed
   - At minimum, show a button to confirm income collection

2. **Show opponent hands in dev mode**
   - The player dropdown should allow full control of any player
   - Critical for single-browser playtesting
   - Could be gated behind a dev/debug flag

### Medium Priority

3. **Clear action buttons between phases**
   - Undo and End Turn buttons should reset/hide when changing phases
   - Each phase should have its own set of available actions
   - Consider a phase-specific actions component

4. **Add toast notifications for key events**
   - "It's your turn!" when turn changes
   - "Phase changed to [X]" for phase transitions
   - "Player [X] placed agent at [Y]" for opponent actions
   - Error toasts for failed actions

### Low Priority

5. **Improve card selection visual feedback**
   - Selected card could have a more prominent highlight/border
   - Maybe animate or elevate the selected card

6. **Add keyboard shortcuts**
   - Number keys 1-5 to select cards from hand
   - Enter to confirm/end turn
   - Escape to deselect

7. **Show agents remaining count more prominently**
   - Current: implicit from hand size
   - Could add explicit "Agents: 2/2" indicator

---

## Technical Notes

### Socket.io Connection
- Connection established successfully
- Real-time updates working
- No disconnection issues observed during ~15 minute session

### Performance
- Page loads quickly
- No noticeable lag on state updates
- Screenshots captured successfully

### Browser Compatibility
- Tested in Chrome only (via DevTools MCP)
- No browser-specific issues observed

---

## Next Steps

1. Fix the Income phase "End Turn" button issue (blocking)
2. Implement dev mode hand visibility for playtesting
3. Test remaining actions (Build, Launch, Buy Gas, etc.)
4. Add toast notification system
5. Run full game playthrough via UI
