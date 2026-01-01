# Play With Me - Interactive UP SHIP! Game

Play a 4-player game where you (kenny) play as **Britain** and Claude controls Germany, USA, and Italy through browser automation.

## Prerequisites

1. **Chrome DevTools MCP server must be connected** (chrome-devtools)
2. **Both servers running:**
   - Express API: http://localhost:3000
   - SvelteKit Frontend: http://localhost:5173

## Server Architecture

The new SvelteKit frontend runs on port 5173 with real-time updates via Socket.io:

```
Browser (5173) → Vite Dev Server → Express API (3000)
                     ↓ proxy           ↓
              /api/* → :3000/api/*   Socket.io
              /socket.io → :3000/socket.io
```

**Key difference from old UI**: State updates happen in real-time via WebSocket, no polling!

## Quick Start

### Step 1: Start both servers

In separate terminals:

```bash
# Terminal 1: Express API server
npm run dev:local

# Terminal 2: SvelteKit frontend
npm run dev -w web
```

### Step 2: Set up the game

```bash
UPSHIP_LOCAL=1 python -m playtest setup-interactive
```

This will:
- Create a new game with 3 AI players (Germany, USA, Italy)
- Wait for kenny to join as Britain
- Automatically start the game once kenny has joined and selected Britain

**Instruct the user:**
> Game is being set up! Please:
> 1. Open http://localhost:5173 in your browser
> 2. Login as **kenny**
> 3. Click "Open Games" and join the "Play With Kenny" game
> 4. Select **Britain** as your faction
>
> The game will start automatically once you've joined!

Wait for the setup script to report "GAME READY!" before proceeding.

### Step 3: Open browser tabs for AI players

Once the game has started, get the game ID and open browser tabs for each AI player:

```bash
GAME_ID=$(UPSHIP_LOCAL=1 python -m playtest gameid)
echo "Game ID: $GAME_ID"
```

Open browser tabs for the 3 AI players. Each tab will use DEV mode impersonation:

```
mcp__chrome-devtools__new_page url="http://localhost:5173/game/$GAME_ID"
```

After opening each tab:
1. Login as the AI player (e.g., `playtest_germany` / `test123456`)
2. Or use the dev mode player switcher dropdown in the game UI

## Game Loop

### Check Current Turn

Take a snapshot of any game tab to see:
- Current phase indicator in header (Worker Placement, Reveal, Income & Cleanup)
- "Your Turn" or "Waiting for [faction]" indicator
- Current turn/round/age in header

The SvelteKit UI shows real-time updates - you'll see toast notifications when turns change!

### If It's Kenny's Turn

Prompt the user:
> **Your turn, kenny!**
> Phase: [current phase]
>
> Take your action in the browser and let me know when you're done.

Wait for user to confirm they've completed their action.

### If It's an AI Player's Turn

1. Switch to that player's tab:
```
mcp__chrome-devtools__select_page pageIdx=N
```

2. Take a snapshot to see current state

3. Execute the appropriate action (see AI Strategy below)

4. Continue to next turn

## AI Strategy

### Worker Placement Phase

**Priority order for locations (from GroundBoard component):**

**Technical (🔧 wrench):**
1. **Design Bureau** - Install upgrades to improve ships
2. **Construction Hall** - Build ships when blueprint is ready
3. **Technical Institute** - Upgrade engineer income
4. **Gas Depot** - Buy fuel for launches

**Operations (⚙️ propeller):**
1. **Launchpad** - Essential for launching ships
2. **Research Institute** - Acquire new technologies
3. **Ministry** - Political maneuvering
4. **Weather Bureau** - Check hazard forecasts

**Business (🪙 coin):**
1. **Academy** - Recruit officers/engineers
2. **Flight School** - Upgrade officer income
3. **Government Liaison** - Spend officers for income
4. **Insurance Bureau** - Protect ships

**Placing agents in the new UI:**
1. Click a card in HandSection that matches the location symbol
2. Card highlights when selected, showing which locations are available
3. Click an available location on the GroundBoard (highlighted locations)
4. Or click "Pass" button in the Actions panel

### Reveal Phase

Process locations where the AI placed agents. Location actions are now executed via Socket.io and update in real-time.

- **Gas Depot**: Purchase gas (hydrogen for Germany, helium for USA with monopoly)
- **Design Bureau**: Click blueprint slots to install upgrades from modal
- **Construction Hall**: Build ships if Lift > Weight (check ShipStats component)
- **Launchpad**: Select ship from FleetPanel, choose route from RoutesPanel
- **Academy/Schools**: Recruit crew as needed
- **Research Institute**: Acquire technology from R&D board

### Income & Cleanup Phase

Click "End Turn" button to:
- Collect income (ResourcePanel updates automatically)
- Draw cards (HandSection updates)
- Advance to next turn

## UI Components Reference

| Component | Location | Shows |
|-----------|----------|-------|
| Header | Top | Age, Turn, Phase, Turn indicator |
| ResourcePanel | Left sidebar | Cash, income, VP, officers, engineers, gas |
| Blueprint | Left sidebar | 4 slot rows with ShipStats |
| TechList | Left sidebar | Acquired technologies |
| GroundBoard | Center | 12 locations organized by symbol |
| HandSection | Center | Player's cards with deck/discard counts |
| FleetPanel | Center | Ships grouped by status |
| RoutesPanel | Center | Available routes |
| PlayersList | Right sidebar | All players with online status |
| Actions panel | Right sidebar | Pass/End Turn buttons |
| GameLog | Right sidebar | Recent game actions |
| ToastContainer | Top right | Turn/phase notifications |

## Browser Tab Reference

| Tab Index | Player | Faction | Login |
|-----------|--------|---------|-------|
| 0 | playtest_germany | Germany | test123456 |
| 1 | playtest_usa | USA | test123456 |
| 2 | playtest_italy | Italy | test123456 |
| (user's browser) | kenny | Britain | (user's password) |

## Chrome DevTools Commands Quick Reference

```
# List pages
mcp__chrome-devtools__list_pages

# Select a tab
mcp__chrome-devtools__select_page pageIdx=0

# Take snapshot (see elements with UIDs)
mcp__chrome-devtools__take_snapshot

# Take screenshot
mcp__chrome-devtools__take_screenshot

# Click element
mcp__chrome-devtools__click uid="element_uid"

# Fill input
mcp__chrome-devtools__fill uid="input_uid" value="text"

# Wait for text
mcp__chrome-devtools__wait_for text="Your Turn"
```

## Turn Notification Template

When it's kenny's turn, use this format:

---

**Your turn, kenny!**

📍 **Phase**: [worker_placement / reveal / income_cleanup]
🎯 **Turn**: [N] | **Round**: [N] | **Age**: [N]

**Your resources** (from ResourcePanel):
- Cash: £[X] | Income: +£[X]/turn
- Gas: [H₂: X, He: X]
- Officers: [X] | Engineers: [X]
- VP: [X]

**Your hand** (from HandSection):
- [X] cards | Deck: [X] | Discard: [X]

**What you can do:**
- [Phase-specific actions available]

Let me know when you've taken your action!

---

## Real-Time Features

The new SvelteKit UI has real-time updates via Socket.io:

- **Turn notifications**: Toast appears saying "It's Your Turn!"
- **Phase changes**: Toast appears when phase transitions
- **State sync**: All components update automatically when other players act
- **Online presence**: PlayersList shows green dots for connected players

## Game End

When the game ends (Age 3 victory conditions met), report:
- Winner and final VP totals
- Each faction's score breakdown
- Notable achievements during the game

## Troubleshooting

**If a player can't take actions:**
- Check the turn indicator in the header
- Verify Socket.io is connected (check online indicator)
- Try refreshing the page (Cmd+R)

**If the game state seems stuck:**
- Use `UPSHIP_LOCAL=1 python -m playtest status` to check server-side state
- Compare with what the UI shows
- Check browser console for Socket.io errors

**If an AI player's session expires:**
- Close the tab
- Open new tab: `mcp__chrome-devtools__new_page url="http://localhost:5173/"`
- Login and navigate to game

**If Socket.io won't connect:**
- Ensure both servers are running (Express on :3000, SvelteKit on :5173)
- Check that the Vite proxy is working
- Try `mcp__chrome-devtools__list_network_requests` to see WebSocket status
