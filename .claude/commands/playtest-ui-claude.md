# UP SHIP! Browser UI Playtest Command (Claude in Chrome)

Run a playtest through the **web browser interface** using **Claude in Chrome MCP** tools. Unlike `/playtest-rest` which uses the REST API directly, this command tests that the UI controls function properly and provide a good user experience.

**See `_playtest-ui-shared.md` for common documentation** (game setup, server architecture, test credentials, UI elements checklist, reporting format).

## Prerequisites

1. **Claude in Chrome MCP server must be connected** (claude-in-chrome)
2. **Both servers running:**
   - Express API: http://localhost:3000
   - SvelteKit Frontend: http://localhost:5173

## Claude in Chrome MCP Commands Reference

### Tab Management
```
# Get context and available tabs (ALWAYS call this first)
mcp__claude-in-chrome__tabs_context_mcp

# Create a new tab in the MCP tab group
mcp__claude-in-chrome__tabs_create_mcp

# Navigate to a URL
mcp__claude-in-chrome__navigate url="http://localhost:5173/" tabId=TAB_ID

# Navigate back/forward
mcp__claude-in-chrome__navigate url="back" tabId=TAB_ID
mcp__claude-in-chrome__navigate url="forward" tabId=TAB_ID
```

### Page Inspection
```
# Read page accessibility tree (shows elements with ref IDs)
mcp__claude-in-chrome__read_page tabId=TAB_ID

# Read only interactive elements
mcp__claude-in-chrome__read_page tabId=TAB_ID filter="interactive"

# Find elements using natural language
mcp__claude-in-chrome__find query="login button" tabId=TAB_ID
mcp__claude-in-chrome__find query="username input" tabId=TAB_ID

# Extract text content from page
mcp__claude-in-chrome__get_page_text tabId=TAB_ID

# Take screenshot
mcp__claude-in-chrome__computer action="screenshot" tabId=TAB_ID
```

### Interactions
```
# Click using coordinates
mcp__claude-in-chrome__computer action="left_click" coordinate=[100, 200] tabId=TAB_ID

# Click using element reference (from read_page or find)
mcp__claude-in-chrome__computer action="left_click" ref="ref_1" tabId=TAB_ID

# Double-click
mcp__claude-in-chrome__computer action="double_click" coordinate=[100, 200] tabId=TAB_ID

# Hover over element
mcp__claude-in-chrome__computer action="hover" coordinate=[100, 200] tabId=TAB_ID
mcp__claude-in-chrome__computer action="hover" ref="ref_1" tabId=TAB_ID

# Type text
mcp__claude-in-chrome__computer action="type" text="playtest_germany" tabId=TAB_ID

# Press keys
mcp__claude-in-chrome__computer action="key" text="Enter" tabId=TAB_ID
mcp__claude-in-chrome__computer action="key" text="Tab" tabId=TAB_ID
mcp__claude-in-chrome__computer action="key" text="cmd+a" tabId=TAB_ID

# Fill form input using reference
mcp__claude-in-chrome__form_input ref="ref_1" value="playtest_germany" tabId=TAB_ID

# Scroll
mcp__claude-in-chrome__computer action="scroll" scroll_direction="down" coordinate=[500, 400] tabId=TAB_ID

# Scroll element into view
mcp__claude-in-chrome__computer action="scroll_to" ref="ref_1" tabId=TAB_ID

# Drag and drop
mcp__claude-in-chrome__computer action="left_click_drag" start_coordinate=[100, 200] coordinate=[300, 400] tabId=TAB_ID

# Wait
mcp__claude-in-chrome__computer action="wait" duration=2 tabId=TAB_ID
```

### Debugging
```
# Read console messages (filter with pattern)
mcp__claude-in-chrome__read_console_messages tabId=TAB_ID pattern="error|warning"

# Read console errors only
mcp__claude-in-chrome__read_console_messages tabId=TAB_ID onlyErrors=true

# Read network requests
mcp__claude-in-chrome__read_network_requests tabId=TAB_ID

# Filter network requests by URL pattern
mcp__claude-in-chrome__read_network_requests tabId=TAB_ID urlPattern="/api/"

# Execute JavaScript in page context
mcp__claude-in-chrome__javascript_tool action="javascript_exec" text="document.title" tabId=TAB_ID
```

### GIF Recording
```
# Start recording browser actions
mcp__claude-in-chrome__gif_creator action="start_recording" tabId=TAB_ID

# Stop recording
mcp__claude-in-chrome__gif_creator action="stop_recording" tabId=TAB_ID

# Export as GIF (downloads to browser)
mcp__claude-in-chrome__gif_creator action="export" download=true filename="playtest.gif" tabId=TAB_ID

# Clear recording
mcp__claude-in-chrome__gif_creator action="clear" tabId=TAB_ID
```

## Typical Workflow Example

```
# 1. Setup game via CLI
UPSHIP_LOCAL=1 python -m playtest setup
GAME_ID=$(UPSHIP_LOCAL=1 python -m playtest gameid)
echo "Game ID: $GAME_ID"

# 2. Get tab context (ALWAYS do this first)
mcp__claude-in-chrome__tabs_context_mcp

# 3. Create a new tab
mcp__claude-in-chrome__tabs_create_mcp

# 4. Navigate to frontend (use tab ID from step 2/3)
mcp__claude-in-chrome__navigate url="http://localhost:5173/" tabId=TAB_ID

# 5. Take screenshot to see page
mcp__claude-in-chrome__computer action="screenshot" tabId=TAB_ID

# 6. Find login form elements
mcp__claude-in-chrome__find query="username input" tabId=TAB_ID
mcp__claude-in-chrome__find query="password input" tabId=TAB_ID

# 7. Fill login form
mcp__claude-in-chrome__form_input ref="ref_username" value="playtest_germany" tabId=TAB_ID
mcp__claude-in-chrome__form_input ref="ref_password" value="test123456" tabId=TAB_ID

# 8. Find and click login button
mcp__claude-in-chrome__find query="login button" tabId=TAB_ID
mcp__claude-in-chrome__computer action="left_click" ref="ref_login" tabId=TAB_ID

# 9. Wait for page to load
mcp__claude-in-chrome__computer action="wait" duration=2 tabId=TAB_ID

# 10. Take screenshot of lobby
mcp__claude-in-chrome__computer action="screenshot" tabId=TAB_ID

# 11. Find and click My Games
mcp__claude-in-chrome__find query="My Games" tabId=TAB_ID
mcp__claude-in-chrome__computer action="left_click" ref="ref_mygames" tabId=TAB_ID

# 12. Navigate to game
mcp__claude-in-chrome__navigate url="http://localhost:5173/game/GAME_ID" tabId=TAB_ID

# 13. Take screenshot of game board
mcp__claude-in-chrome__computer action="screenshot" tabId=TAB_ID

# 14. Continue testing interactions...
```

## Quick Start (Summary)

1. **Restart servers**:
   - `scripts/restart_server.sh`

2. **Setup the game**: `UPSHIP_LOCAL=1 python -m playtest setup`

3. **Get game ID**: `UPSHIP_LOCAL=1 python -m playtest gameid`

4. **Browser setup**:
   - Get tab context: `mcp__claude-in-chrome__tabs_context_mcp`
   - Create new tab: `mcp__claude-in-chrome__tabs_create_mcp`
   - Navigate: `mcp__claude-in-chrome__navigate url="http://localhost:5173/" tabId=TAB_ID`
   - Take screenshot: `mcp__claude-in-chrome__computer action="screenshot" tabId=TAB_ID`

5. **Login**: Use `playtest_germany` / `test123456`
   - Find inputs: `mcp__claude-in-chrome__find query="username input" tabId=TAB_ID`
   - Fill form: `mcp__claude-in-chrome__form_input ref="ref_1" value="playtest_germany" tabId=TAB_ID`
   - Click login: `mcp__claude-in-chrome__computer action="left_click" ref="ref_login" tabId=TAB_ID`

6. **Enter the game**: Click "My Games" → Find active game → Click to enter

7. **Play through UI**: Follow the playtest flow in `_playtest-ui-shared.md`, taking screenshots at each major step

8. **Document any issues encountered**

## Key Differences from DevTools Version

| Feature | Claude in Chrome | Chrome DevTools |
|---------|------------------|-----------------|
| Element IDs | `ref_1`, `ref_2` (from read_page/find) | `uid` (from take_snapshot) |
| Screenshot | `computer action="screenshot"` | `take_screenshot` |
| Click | `computer action="left_click"` | `click uid="..."` |
| Form fill | `form_input ref="..." value="..."` | `fill uid="..." value="..."` |
| Natural language search | `find query="..."` | Not available |
| GIF recording | Built-in | Not available |
| Wait | `computer action="wait" duration=N` | `wait_for text="..."` |
