# UP SHIP! Browser UI Playtest Command (Chrome DevTools)

Run a playtest through the **web browser interface** using **Chrome DevTools MCP** tools. Unlike `/playtest-rest` which uses the REST API directly, this command tests that the UI controls function properly and provide a good user experience.

**See `_playtest-ui-shared.md` for common documentation** (game setup, server architecture, test credentials, UI elements checklist, reporting format).

## Prerequisites

1. **Chrome DevTools MCP server must be connected** (chrome-devtools)
2. **Both servers running:**
   - Express API: http://localhost:3000
   - SvelteKit Frontend: http://localhost:5173

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

## Quick Start (Summary)

1. **Restart servers**:
   - `scripts/restart_server.sh`

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

7. **Play through UI**: Follow the playtest flow in `_playtest-ui-shared.md`, taking snapshots and screenshots at each major step

8. **Document any issues encountered**
