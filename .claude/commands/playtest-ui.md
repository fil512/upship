# UP SHIP! Browser UI Playtest Command

Run a playtest through the **web browser interface** using Chrome DevTools MCP tools. Unlike `/playtest-dev` which uses the REST API directly, this command tests that the UI controls function properly and provide a good user experience.

## Prerequisites

1. **Chrome DevTools MCP server must be connected** (chrome-devtools)
2. **For local testing**: Local dev server must be running (`./scripts/restart_server.sh`)

## Game Setup

Use the Python playtest module to automatically set up a 4-player game:

```bash
# For production server
python -m playtest setup

# For local dev server
UPSHIP_LOCAL=1 python -m playtest setup
```

This creates 4 test players, a new game, joins all players, selects factions, and starts the game.

**Test Credentials** (created by setup):
- `playtest_germany` / `test123456` (Germany)
- `playtest_britain` / `test123456` (Britain)
- `playtest_usa` / `test123456` (USA)
- `playtest_italy` / `test123456` (Italy)

**Get the game ID** after setup:
```bash
python -m playtest gameid
```

**Server URLs**:
- Production: https://upship-production.up.railway.app
- Local: http://localhost:3000

## What This Command Tests

### Functional Testing
- All game actions available via REST API are also available through the UI
- UI controls respond correctly to user interactions
- Game state updates are reflected in the UI
- Error messages are displayed appropriately
- Modal dialogs work correctly (create game, upgrade selection, etc.)

### User Experience Assessment
- UI is intuitive and controls are discoverable
- Game phase is clearly indicated
- Current player turn is obvious
- Available actions are visually distinguishable from unavailable ones
- Resource displays are clear and accurate
- Blueprint visualization is understandable

## Playtest Flow

### Phase 1: Browser Setup

1. Run `python -m playtest setup` to create and start a 4-player game
2. Get the game ID with `python -m playtest gameid`
3. List browser pages: `mcp__chrome-devtools__list_pages`
4. Navigate to the server URL: `mcp__chrome-devtools__new_page` with url
5. Take a snapshot to see page elements: `mcp__chrome-devtools__take_snapshot`
6. Login as `playtest_germany` with password `test123456`
7. Verify lobby UI displays correctly
8. Click "My Games" to find the active game
9. Click "View" or "Enter Game" to join the game board

### Phase 2: Worker Placement Testing

1. Verify Ground Board locations are displayed
2. Test card selection from hand
3. Test placing agents on locations (click card, then click location)
4. Verify location shows as occupied after placement
5. Test the "Pass" button
6. Verify turn progression through all players
7. Use player switching dropdown to control all 4 players

### Phase 3: Reveal Phase Testing

1. Verify phase indicator shows "Reveal"
2. Test each location's action through the UI:
   - **Gas Depot**: Buy gas (hydrogen/helium buttons)
   - **Design Bureau**: Install upgrades (slot clicks, upgrade modal)
   - **Construction Hall**: Build ships button
   - **Academy/Flight School/Technical Institute**: Recruit crew
   - **Launchpad**: Launch ships (ship selection, route selection, gas type)
   - **Research Institute**: Acquire technology

3. Verify blueprint displays correctly with installed upgrades
4. Verify ship stats calculate and display properly
5. Test modal interactions (open, select, close, cancel)

### Phase 4: Income & Cleanup Testing

1. Verify income is collected and displayed
2. Verify cards are drawn
3. Verify turn/round counters update
4. Verify Age progression displays

### Phase 5: Full Game Cycle

Play through multiple rounds testing:
- Building and launching ships
- Route claiming
- Resource management through the UI
- Age transitions
- End game conditions

## UI Elements to Verify

### Header
- [ ] Game title displays
- [ ] Turn/Round/Age indicators update correctly
- [ ] Phase indicator shows current phase
- [ ] Current player turn indicator is visible
- [ ] Player switching dropdown works (dev mode)

### Left Sidebar (Resources)
- [ ] Cash displays correctly
- [ ] Income displays correctly
- [ ] Gas cubes (hydrogen/helium) display with counts
- [ ] Officers/Engineers counts display
- [ ] Technology list displays acquired techs

### Main Area (Blueprint)
- [ ] Blueprint slots display correctly
- [ ] Filled vs empty slots are visually distinct
- [ ] Clicking slot opens upgrade modal
- [ ] Ship stats (Speed, Range, Ceiling, Reliability) calculate
- [ ] Lift vs Weight (physics check) displays
- [ ] Gas sockets display correctly
- [ ] Ships list shows hangar/on-route ships

### Right Sidebar (Cards & Actions)
- [ ] Hand cards display with names and symbols
- [ ] Cards are selectable during worker placement
- [ ] Action buttons enable/disable appropriately
- [ ] Build Ship button works
- [ ] End Turn/Pass button works
- [ ] Buy Gas buttons work

### Ground Board (Worker Placement)
- [ ] All 11 locations display
- [ ] Available locations are highlighted
- [ ] Occupied locations show card symbols
- [ ] Location tooltips explain actions

### Modals
- [ ] Upgrade selection modal opens/closes
- [ ] Available upgrades are listed with stats
- [ ] Locked upgrades show requirements
- [ ] Ship launch modal works
- [ ] Route selection works

### Game Log
- [ ] Log entries appear for actions
- [ ] Log scrolls to show recent entries
- [ ] System messages are highlighted

## Action Mapping (REST API → UI)

| REST API Action | UI Element |
|----------------|------------|
| `PLACE_AGENT` | Card click + Location click |
| `PASS_PLACEMENT` | "Pass" button |
| `END_TURN` | "End Turn" button |
| `BUY_GAS` | Gas Depot "Buy H₂/He" buttons |
| `INSTALL_UPGRADE` | Blueprint slot click → Upgrade modal |
| `BUILD_SHIP` | "Build Ship" button |
| `LAUNCH_SHIP` | Ship click → Route modal → Launch |
| `CLAIM_ROUTE` | Route "Claim" button |
| `RECRUIT_OFFICER/ENGINEER` | Crew location action |
| `ACQUIRE_TECHNOLOGY` | Research Institute / Tech modal |

## Chrome DevTools MCP Commands Reference

### Page Management
```
# List all open pages
mcp__chrome-devtools__list_pages

# Create new page with URL
mcp__chrome-devtools__new_page url="http://localhost:3000/"

# Select a page for subsequent commands
mcp__chrome-devtools__select_page pageIdx=0

# Navigate current page
mcp__chrome-devtools__navigate_page type="url" url="http://localhost:3000/game.html?id=GAME_ID"

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
mcp__chrome-devtools__wait_for text="Login successful"

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
python -m playtest setup
python -m playtest gameid  # Note the game ID

# 2. Open browser page
mcp__chrome-devtools__new_page url="http://localhost:3000/"

# 3. Take snapshot to see elements
mcp__chrome-devtools__take_snapshot

# 4. Fill login form (find UIDs from snapshot)
mcp__chrome-devtools__fill uid="username_input_uid" value="playtest_germany"
mcp__chrome-devtools__fill uid="password_input_uid" value="test123456"
mcp__chrome-devtools__click uid="login_button_uid"

# 5. Wait for login
mcp__chrome-devtools__wait_for text="My Games"

# 6. Take snapshot to find game link
mcp__chrome-devtools__take_snapshot

# 7. Click to enter game
mcp__chrome-devtools__click uid="game_link_uid"

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

### UX Recommendations
- Suggestions for improving discoverability
- Suggestions for clearer feedback
- Suggestions for better visual hierarchy

### Test Coverage
- Phases tested: [worker_placement, reveal, income_cleanup]
- Actions tested: [list of actions verified through UI]
- Any actions NOT available through UI

## Quick Start

1. **Setup the game** (choose one):
   - Production: `python -m playtest setup`
   - Local: `UPSHIP_LOCAL=1 python -m playtest setup` (requires `./scripts/restart_server.sh` first)

2. **Get game ID**: `python -m playtest gameid`

3. **Browser setup**:
   - List pages: `mcp__chrome-devtools__list_pages`
   - Create page: `mcp__chrome-devtools__new_page url="http://localhost:3000/"`
   - Take snapshot: `mcp__chrome-devtools__take_snapshot`

4. **Login**: Use `playtest_germany` / `test123456`
   - Fill username and password fields using `mcp__chrome-devtools__fill`
   - Click login button using `mcp__chrome-devtools__click`

5. **Enter the game**: Click "My Games" → Find active game → "View"

6. **Play through UI**: Follow the playtest flow above, taking snapshots and screenshots at each major step

7. **Document any issues encountered**

## Useful Playtest Commands During Testing

```bash
# Check game state
python -m playtest status

# Show all players' summary
python -m playtest summary

# Have all AI players take their turns (useful to advance game)
python -m playtest autoplay 1

# Show available routes
python -m playtest routes

# View game log
python -m playtest tail 20
```
