# UP SHIP! Browser UI Playtest - Shared Documentation

This file contains documentation shared between `/playtest-ui` and `/playtest-ui-devtools`.

## Quick Start

**Step 1: Start both servers**

```bash
# Terminal 1: Express API server
npm run dev:local

# Terminal 2: SvelteKit frontend
npm run dev -w web
```

Or use the combined dev command:
```bash
npm run dev
```

**Step 2: Setup the game**

```bash
UPSHIP_LOCAL=1 python -m playtest setup
```

**Step 3: Open browser and begin UI testing** (see Playtest Flow below)

## Server Architecture

The new SvelteKit frontend runs on port 5173 and proxies API requests to the Express backend on port 3000:

```
Browser (5173) → Vite Dev Server → Express API (3000)
                     ↓ proxy
              /api/* → :3000/api/*
              /socket.io → :3000/socket.io
```

**URLs:**
- **Frontend**: http://localhost:5173 (SvelteKit)
- **API**: http://localhost:3000 (Express)
- **Game URL pattern**: http://localhost:5173/game/GAME_ID

## Game Setup

Use the Python playtest module to automatically set up a 4-player game:

```bash
# For local dev server
UPSHIP_LOCAL=1 python -m playtest setup

# For production server
python -m playtest setup
```

This creates 4 test players, a new game, joins all players, selects factions, and starts the game.

**Test Credentials** (created by setup):
- `playtest_germany` / `test123456` (Germany)
- `playtest_britain` / `test123456` (Britain)
- `playtest_usa` / `test123456` (USA)
- `playtest_italy` / `test123456` (Italy)

**Get the game ID** after setup:
```bash
UPSHIP_LOCAL=1 python -m playtest gameid
```

## What This Command Tests

### Functional Testing
- All game actions are available through Socket.io (real-time)
- UI controls respond correctly to user interactions
- Game state updates are reflected in real-time via WebSocket
- Toast notifications appear for turn/phase changes
- Error messages are displayed appropriately
- Modal dialogs work correctly (create game, upgrade selection, etc.)

### User Experience Assessment
- UI is intuitive and controls are discoverable
- Game phase is clearly indicated
- Current player turn is obvious (header indicator + toast)
- Available actions are visually distinguishable from unavailable ones
- Resource displays are clear and accurate
- Blueprint visualization is understandable

## Playtest Flow

### Phase 1: Browser Setup

1. Run `UPSHIP_LOCAL=1 python -m playtest setup` to create and start a 4-player game
2. Get the game ID with `UPSHIP_LOCAL=1 python -m playtest gameid`
3. Open browser to http://localhost:5173/
4. Login as `playtest_germany` with password `test123456`
5. Verify lobby UI displays correctly (game list, online status)
6. Click "My Games" to find the active game
7. Click the game to enter the game board

### Phase 2: Worker Placement Testing

1. Verify Ground Board locations are displayed (organized by symbol type)
2. Test card selection from hand (cards highlight when selectable)
3. Test placing agents on locations (click card, then click location)
4. Verify location shows agent marker after placement
5. Test the "Pass" button
6. Verify turn progression through all players (toast notifications)
7. Use player switching dropdown (dev mode) to control all 4 players

### Phase 3: Reveal Phase Testing

1. Verify phase indicator in header shows "Reveal"
2. Test each location's action through the UI:
   - **Gas Depot**: Gas purchase actions
   - **Design Bureau**: Install upgrades (slot clicks, upgrade modal)
   - **Construction Hall**: Build ships
   - **Academy/Flight School/Technical Institute**: Recruit crew
   - **Launchpad**: Launch ships (ship selection, route selection, gas type)
   - **Research Institute**: Acquire technology

3. Verify blueprint displays correctly with installed upgrades
4. Verify ship stats in ShipStats component calculate properly
5. Test modal interactions (open, select, close, cancel)

### Phase 4: Income & Cleanup Testing

1. Verify income is collected (ResourcePanel updates)
2. Verify cards are drawn (HandSection deck count changes)
3. Verify turn/round counters update in header
4. Verify Age progression displays

### Phase 5: Full Game Cycle

Play through multiple rounds testing:
- Building and launching ships
- Route claiming (RoutesPanel updates)
- Resource management through the UI
- Age transitions
- End game conditions

## UI Elements to Verify

### Header
- [ ] Age/Turn/Phase indicators update correctly
- [ ] "Your Turn" / "Waiting for [player]" indicator
- [ ] Player switching dropdown works (dev mode)
- [ ] Online player count shows connected players

### Left Sidebar
- [ ] ResourcePanel: Cash, income, VP display correctly
- [ ] ResourcePanel: Officers/Engineers counts display
- [ ] ResourcePanel: Hydrogen/Helium gas cubes with counts
- [ ] Blueprint: 4 slot rows (Frame, Fabric, Drive, Component)
- [ ] Blueprint: Filled vs empty slots visually distinct
- [ ] Blueprint: ShipStats calculate correctly
- [ ] TechList: Acquired technologies display

### Center Area (Main Board)
- [ ] GroundBoard: 12 locations organized by symbol
- [ ] GroundBoard: Locations grouped (Technical, Operations, Business)
- [ ] GroundBoard: Available locations highlight when card selected
- [ ] GroundBoard: Occupied locations show agent marker
- [ ] HandSection: Cards display with symbols
- [ ] HandSection: Cards selectable during worker placement
- [ ] HandSection: Deck/discard counts show
- [ ] FleetPanel: Ships grouped by status (hangar, on route, awaiting hazard)
- [ ] RoutesPanel: Available routes display with stats

### Right Sidebar
- [ ] PlayersList: All players with factions
- [ ] PlayersList: Online indicators (green dot)
- [ ] PlayersList: Current player highlighted
- [ ] Actions panel: End Turn/Pass button works
- [ ] GameLog: Recent entries display

### Toast Notifications
- [ ] "It's Your Turn!" toast appears
- [ ] Phase change toasts appear
- [ ] Error toasts appear for invalid actions

## Action Mapping (Socket.io to UI)

| Socket Action | UI Element |
|--------------|------------|
| `PLACE_AGENT` | Card click → Location click |
| `PASS` | "Pass" button |
| `END_TURN` | "End Turn" button |
| `BUY_GAS` | Gas Depot location action |
| `INSTALL_UPGRADE` | Blueprint slot click → Upgrade modal |
| `BUILD_SHIP` | Construction Hall location action |
| `LAUNCH_SHIP` | FleetPanel ship click → Route modal |
| `CLAIM_ROUTE` | Route "Claim" in modal |
| `RECRUIT_CREW` | Academy location action |
| `ACQUIRE_TECHNOLOGY` | Research Institute / Tech modal |

## Reporting

After testing, report findings in this format:

### UI Issues Found
- List any broken controls
- List any missing functionality vs REST API
- List any confusing UX patterns
- List any Socket.io connection issues

### UX Recommendations
- Suggestions for improving discoverability
- Suggestions for clearer feedback
- Suggestions for better visual hierarchy
- Suggestions for toast notification improvements

### Test Coverage
- Phases tested: [worker_placement, reveal, income_cleanup]
- Actions tested: [list of actions verified through UI]
- Any actions NOT available through UI

## Useful Playtest Commands During Testing

```bash
# Check game state
UPSHIP_LOCAL=1 python -m playtest status

# Show all players' summary
UPSHIP_LOCAL=1 python -m playtest summary

# Have all AI players take their turns (useful to advance game)
UPSHIP_LOCAL=1 python -m playtest autoplay 1

# Show available routes
UPSHIP_LOCAL=1 python -m playtest routes

# View game log
UPSHIP_LOCAL=1 python -m playtest tail 20
```
