# UP SHIP! Browser UI Playtest Command

Run a playtest through the **web browser interface** using Chrome DevTools MCP tools. Unlike `/playtest-dev` which uses the REST API directly, this command tests that the UI controls function properly and provide a good user experience.

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

## Prerequisites

1. **Chrome DevTools MCP server must be connected** (chrome-devtools)
2. **Both servers running:**
   - Express API: http://localhost:3000
   - SvelteKit Frontend: http://localhost:5173

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
3. List browser pages: `mcp__chrome-devtools__list_pages`
4. Navigate to SvelteKit frontend: `mcp__chrome-devtools__new_page url="http://localhost:5173/"`
5. Take a snapshot to see page elements: `mcp__chrome-devtools__take_snapshot`
6. Login as `playtest_germany` with password `test123456`
7. Verify lobby UI displays correctly (game list, online status)
8. Click "My Games" to find the active game
9. Click the game to enter the game board

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

## Action Mapping (Socket.io → UI)

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

## Chrome DevTools MCP Commands Reference

### Page Management
```
# List all open pages
mcp__chrome-devtools__list_pages

# Create new page with URL (SvelteKit frontend)
mcp__chrome-devtools__new_page url="http://localhost:5173/"

# Navigate to game page
mcp__chrome-devtools__navigate_page type="url" url="http://localhost:5173/game/GAME_ID"

# Select a page for subsequent commands
mcp__chrome-devtools__select_page pageIdx=0

# Reload page
mcp__chrome-devtools__navigate_page type="reload"
```

### Page Inspection
```
# Take text snapshot (a11y tree) - shows elements with UIDs
mcp__chrome-devtools__take_snapshot

# Take screenshot
mcp__chrome-devtools__take_screenshot

# Take screenshot of specific element
mcp__chrome-devtools__take_screenshot uid="element_uid"

# Take full-page screenshot
mcp__chrome-devtools__take_screenshot fullPage=true
```

### Interactions
```
# Click element by UID (from snapshot)
mcp__chrome-devtools__click uid="element_uid"

# Double-click
mcp__chrome-devtools__click uid="element_uid" dblClick=true

# Hover over element
mcp__chrome-devtools__hover uid="element_uid"

# Fill input/textarea/select
mcp__chrome-devtools__fill uid="input_uid" value="text to enter"

# Fill multiple form fields at once
mcp__chrome-devtools__fill_form elements=[{"uid": "username", "value": "testuser"}, {"uid": "password", "value": "pass123"}]

# Press keyboard key
mcp__chrome-devtools__press_key key="Enter"
mcp__chrome-devtools__press_key key="Control+A"

# Drag and drop
mcp__chrome-devtools__drag from_uid="source_uid" to_uid="target_uid"
```

### Waiting & Dialogs
```
# Wait for text to appear
mcp__chrome-devtools__wait_for text="Your Turn"

# Handle browser dialog (alert, confirm, prompt)
mcp__chrome-devtools__handle_dialog action="accept"
mcp__chrome-devtools__handle_dialog action="dismiss"
```

### Debugging
```
# List console messages
mcp__chrome-devtools__list_console_messages

# Get specific console message
mcp__chrome-devtools__get_console_message msgid=1

# List network requests
mcp__chrome-devtools__list_network_requests

# Get network request details
mcp__chrome-devtools__get_network_request reqid=1

# Execute JavaScript in page
mcp__chrome-devtools__evaluate_script function="() => document.title"
```

## Typical Workflow Example

```
# 1. Setup game via CLI
UPSHIP_LOCAL=1 python -m playtest setup
GAME_ID=$(UPSHIP_LOCAL=1 python -m playtest gameid)
echo "Game ID: $GAME_ID"

# 2. Open browser page (SvelteKit frontend)
mcp__chrome-devtools__new_page url="http://localhost:5173/"

# 3. Take snapshot to see elements
mcp__chrome-devtools__take_snapshot

# 4. Fill login form (find UIDs from snapshot)
mcp__chrome-devtools__fill uid="username_input_uid" value="playtest_germany"
mcp__chrome-devtools__fill uid="password_input_uid" value="test123456"
mcp__chrome-devtools__click uid="login_button_uid"

# 5. Wait for login
mcp__chrome-devtools__wait_for text="My Games"

# 6. Take snapshot to find game entry
mcp__chrome-devtools__take_snapshot

# 7. Click to enter game
mcp__chrome-devtools__click uid="game_entry_uid"

# 8. Take screenshot of game board
mcp__chrome-devtools__take_screenshot

# 9. Continue testing interactions...
```

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

## Quick Start (Summary)

1. **Start servers**:
   - Terminal 1: `npm run dev:local` (Express on :3000)
   - Terminal 2: `npm run dev -w web` (SvelteKit on :5173)

2. **Setup the game**: `UPSHIP_LOCAL=1 python -m playtest setup`

3. **Get game ID**: `UPSHIP_LOCAL=1 python -m playtest gameid`

4. **Browser setup**:
   - List pages: `mcp__chrome-devtools__list_pages`
   - Create page: `mcp__chrome-devtools__new_page url="http://localhost:5173/"`
   - Take snapshot: `mcp__chrome-devtools__take_snapshot`

5. **Login**: Use `playtest_germany` / `test123456`
   - Fill username and password fields using `mcp__chrome-devtools__fill`
   - Click login button using `mcp__chrome-devtools__click`

6. **Enter the game**: Click "My Games" → Find active game → Click to enter

7. **Play through UI**: Follow the playtest flow above, taking snapshots and screenshots at each major step

8. **Document any issues encountered**

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
