# UP SHIP! Browser UI Playtest with Server Bots

Play a complete game through the **web browser interface** using **Chrome DevTools MCP** tools. You play as one faction through the UI while 3 server bots automatically play the other factions in the background.

## Goal

**Complete an entire game from start to finish** with:
- 1 player (you) controlling through the UI
- 3 server bots playing automatically

Success = game reaches completion (a winner is declared or game ends properly).

## Prerequisites

1. **Chrome DevTools MCP server must be connected** (chrome-devtools)
2. **Development servers running** (Express on 3000, SvelteKit on 5173)

## Server Architecture

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

## Server Bot System

The server has built-in AI bots that play automatically:

- **Adding Bots**: Host can add bots in the game lobby before starting
- **Bot Execution**: When it's a bot's turn, the server executes moves automatically via `botExecutor.ts`
- **Strategy**: Bots use strategic logic from `botService.ts` (ported from Python playtest)
- **Phases**: Bots handle all phases: worker placement, reveal, income/cleanup, age transitions

## Workflow

### Phase 1: Server Setup

```bash
# Restart both servers to ensure clean state
scripts/restart_server.sh

# Wait for server health
for i in {1..15}; do
  if curl -s http://localhost:3000/health | grep -q "ok"; then
    echo "Server is healthy!"
    break
  fi
  sleep 1
done
```

### Phase 2: Browser Setup & Login

```
# 1. Open browser to SvelteKit frontend
mcp__chrome-devtools__new_page url="http://localhost:5173/"

# 2. Take snapshot to see login form
mcp__chrome-devtools__take_snapshot

# 3. Login as playtest user
# Username: playtest_bot / Password: test123456
mcp__chrome-devtools__fill uid="<username_uid>" value="playtest_bot"
mcp__chrome-devtools__fill uid="<password_uid>" value="test123456"
mcp__chrome-devtools__click uid="<login_button_uid>"

# 4. Wait for lobby to load
mcp__chrome-devtools__wait_for text="Create Game"
```

### Phase 3: Create Game with Bots

```
# 1. Take snapshot to find Create Game button
mcp__chrome-devtools__take_snapshot

# 2. Click Create Game button
mcp__chrome-devtools__click uid="<create_game_button_uid>"

# 3. Fill in game name
mcp__chrome-devtools__fill uid="<game_name_input_uid>" value="Playtest Game"

# 4. Create the game
mcp__chrome-devtools__click uid="<create_button_uid>"

# 5. Wait for game detail view
mcp__chrome-devtools__wait_for text="Add Bot"

# 6. Take snapshot to find bot buttons
mcp__chrome-devtools__take_snapshot

# 7. Add 3 bots (click each available faction's "Add Bot" button)
mcp__chrome-devtools__click uid="<add_germany_bot_uid>"
mcp__chrome-devtools__click uid="<add_britain_bot_uid>"
mcp__chrome-devtools__click uid="<add_usa_bot_uid>"
# (skip your own faction)

# 8. Once 4 players (1 human + 3 bots), start the game
mcp__chrome-devtools__take_snapshot
mcp__chrome-devtools__click uid="<start_game_button_uid>"
```

### Phase 4: Play the Game

The game loop alternates between:
1. **Your turn**: Take actions through the UI
2. **Bot turns**: Wait for bots to complete (automatic on server)

#### Worker Placement Phase (Your Turn)

```
# 1. Take snapshot to see current state
mcp__chrome-devtools__take_snapshot

# 2. Check if it's your turn (look for "Your Turn" indicator)

# 3. If you have agents remaining:
#    a. Click a card in your hand
#    b. Click an available location on the ground board
#    c. Repeat until out of agents

# 4. When out of agents (or want to reveal early):
#    Click "Reveal" or "Pass" button
```

#### Worker Placement Phase (Bot Turns)

```
# Bots play automatically on the server
# Just wait for state updates via WebSocket
mcp__chrome-devtools__wait_for text="Your Turn" timeout=30000
```

#### Reveal Phase

```
# 1. During reveal, you may acquire tech tiles and market cards
# 2. Look for R&D Board or Market interactions
# 3. Select items within your budget
# 4. Click "End Turn" when done

mcp__chrome-devtools__take_snapshot
# Identify available tech tiles and select based on strategy
# End turn when satisfied
```

#### Income & Cleanup Phase

```
# This phase is usually automatic
# Just verify state updates correctly
mcp__chrome-devtools__take_snapshot
# Confirm turn/round counters updated
```

### Phase 5: Continue Until Game End

Loop through phases until:
- Age 3 completes
- A winner is declared
- Or game gets stuck

Take screenshots periodically:
```
mcp__chrome-devtools__take_screenshot fullPage=true
```

## UI Elements Reference

### Lobby View
- **Create Game button**: Opens modal to create new game
- **Game list**: Shows available/your games
- **My Games tab**: Filter to games you've joined

### Game Detail (Pre-Start)
- **Faction selector**: Choose your faction
- **Add Bot buttons**: Add AI opponents (one per available faction)
- **Player list**: Shows joined players (human and bot)
- **Start Game button**: Appears when 2+ players, all have factions

### Game Board

**Header:**
- Age/Turn/Phase indicators
- "Your Turn" / "Waiting for [player]" indicator

**Left Sidebar:**
- ResourcePanel: Cash, income, VP, officers, engineers, gas
- Blueprint: 4 slot rows with filled/empty indicators
- TechList: Acquired technologies

**Center Area:**
- GroundBoard: 12 locations organized by symbol type
- HandSection: Cards in hand, deck/discard counts
- FleetPanel: Ships by status
- RoutesPanel: Available routes

**Right Sidebar:**
- PlayersList: All players with factions and online status
- Action buttons: End Turn, Pass, Reveal
- GameLog: Recent entries

### Phase-Specific UI

**Worker Placement:**
- Cards highlight when selectable
- Locations highlight when card selected
- Click card → click location to place agent
- "Pass" or "Reveal" to end placement

**Reveal Phase:**
- Purchase budget display (diamonds for tech, squares for cards)
- Tech tiles clickable for tentative acquisition
- Market cards clickable for purchase
- "End Turn" to finalize purchases

**Income/Cleanup:**
- Usually automatic
- Resources update in sidebar

## Action Mapping

| Game Action | UI Interaction |
|-------------|----------------|
| `PLACE_AGENT` | Click card → Click location |
| `PASS` | Click "Pass" button |
| `END_TURN` | Click "End Turn" button |
| `BUY_GAS` | Automatic via Gas Depot placement |
| `INSTALL_UPGRADE` | Automatic via Design Bureau placement |
| `BUILD_SHIP` | Automatic via Construction Hall placement |
| `LAUNCH_SHIP` | FleetPanel ship → Route modal |
| `ACQUIRE_TECH_CARD_TENTATIVE` | Click tech tile during reveal |
| `ACQUIRE_MARKET_CARD_TENTATIVE` | Click market card during reveal |

## Handling Stuck States

If the game gets stuck (no progress for extended period):

1. **Check Console**:
   ```
   mcp__chrome-devtools__list_console_messages types=["error", "warn"]
   mcp__chrome-devtools__get_console_message msgid=<id>
   ```

2. **Check Network**:
   ```
   mcp__chrome-devtools__list_network_requests resourceTypes=["fetch", "xhr"]
   mcp__chrome-devtools__get_network_request reqid=<id>
   ```

3. **Check Server Logs**:
   ```bash
   cat /tmp/upship-server.log | tail -50
   ```

4. **Common Issues**:
   - Bot not moving: Check `botExecutor.ts` for action failures
   - Phase stuck: Check phase transition logic in `server/actions/`
   - WebSocket disconnect: Check Socket.io connection in browser console
   - State not updating: Verify `broadcastStateUpdate` is called after actions

5. **Fix the Issue**: Edit server code to resolve the bug

6. **Restart and Retry**:
   ```bash
   scripts/restart_server.sh
   ```
   Then repeat from Phase 2.

## Strategic Guidance

### Early Game (Age 1)
1. **Design Bureau** first - fill Frame and Fabric slots
2. **Construction Hall** - build a ship
3. **Gas Depot** - get gas for launches
4. **Academy** - recruit officers for Age requirements

### Mid Game (Age 2)
1. **Launchpad** - launch ships on profitable routes
2. **Research Institute** - upgrade drive components for range/speed
3. Balance resource acquisition with launches

### Late Game (Age 3)
1. Focus on high-VP routes
2. Ensure enough officers for Age 3 launches
3. Build additional ships if resources allow

## Chrome DevTools Quick Reference

| Action | Command |
|--------|---------|
| Take snapshot | `mcp__chrome-devtools__take_snapshot` |
| Take screenshot | `mcp__chrome-devtools__take_screenshot` |
| Click element | `mcp__chrome-devtools__click uid="..."` |
| Fill input | `mcp__chrome-devtools__fill uid="..." value="..."` |
| Wait for text | `mcp__chrome-devtools__wait_for text="..." timeout=...` |
| Press key | `mcp__chrome-devtools__press_key key="Enter"` |
| List console | `mcp__chrome-devtools__list_console_messages` |
| List network | `mcp__chrome-devtools__list_network_requests` |
| Reload page | `mcp__chrome-devtools__navigate_page type="reload"` |

## Success Criteria

The playtest is **successful** when:
- A complete game is played from setup to completion
- All phases work correctly (worker placement, reveal, income/cleanup)
- Bots take their turns automatically without manual intervention
- Game ends with a winner declared or proper termination

## Reporting Format

After testing, document findings as:

### Issues Found
- [ ] Description of issue
- [ ] Steps to reproduce
- [ ] Error messages (if any)
- [ ] Fix applied

### Test Coverage
- Phases tested: [worker_placement, reveal, income_cleanup]
- Actions tested: [list of actions verified through UI]
- Turns completed: [number]
- Ages reached: [1, 2, 3]
