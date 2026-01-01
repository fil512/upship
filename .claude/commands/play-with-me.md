# Play With Me - Interactive UP SHIP! Game

Play a 4-player game where you (kenny) play as **Britain** and Claude controls Germany, USA, and Italy through browser automation.

## Prerequisites

1. **Chrome DevTools MCP server must be connected** (chrome-devtools)
2. **Local server running** at http://localhost:3000

## Quick Start

### Step 1: Restart local server and set up the game

Run the setup in a background shell:

```bash
./scripts/restart_server.sh && UPSHIP_LOCAL=1 python -m playtest setup-interactive
```

This will:
- Restart the local server
- Create a new game with 3 AI players (Germany, USA, Italy)
- Wait for kenny to join as Britain
- Automatically start the game once kenny has joined and selected Britain

**Instruct the user:**
> Game is being set up! Please:
> 1. Open http://localhost:3000 in your browser
> 2. Login as **kenny**
> 3. Click "Open Games" and join the "Play With Kenny" game
> 4. Select **Britain** as your faction
>
> The game will start automatically once you've joined!

Wait for the setup script to report "GAME READY!" before proceeding.

### Step 2: Open browser tabs for AI players

Once the game has started, get the game ID and open browser tabs for each AI player:

```bash
GAME_ID=$(UPSHIP_LOCAL=1 python -m playtest gameid)
echo "Game ID: $GAME_ID"
```

Open browser tabs for the 3 AI players:
```
mcp__chrome-devtools__new_page url="http://localhost:3000/game.html?id=GAME_ID"
```

Repeat for each AI player (Germany, USA, Italy) using DEV mode impersonation.

## Game Loop

### Check Current Turn

Take a snapshot of any game tab to see:
- Current phase (worker_placement, reveal, income_cleanup)
- Whose turn it is
- Current turn/round/age

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

**Priority order for locations:**
1. **Launchpad** (propeller) - Essential for launching ships
2. **Construction Hall** (wrench) - Build ships
3. **Design Bureau** (wrench) - Install upgrades
4. **Gas Depot** (propeller) - Buy fuel
5. **Research Institute** (wrench) - Acquire technology
6. **Academy/Schools** (coin) - Recruit crew

**Placing agents:**
1. Click a card in hand that matches the location symbol
2. Click the location on the Ground Board
3. Or click "Pass" if no good placements remain

### Reveal Phase

Process locations where the AI placed agents:

- **Gas Depot**: Click "Buy H₂" or "Buy He" based on faction preference
  - Germany: Prefer hydrogen
  - USA: Prefer helium (monopoly discount)
  - Italy: Either, based on ship needs

- **Design Bureau**:
  - Click a blueprint slot
  - Select an upgrade from the modal
  - Prioritize: Frame > Drive > Fabric

- **Construction Hall**:
  - Click "Build Ship" if Lift > Weight

- **Launchpad**:
  - Click a ship in hangar
  - Select a route matching ship capabilities
  - Choose gas type and launch

- **Academy/Flight School/Technical Institute**:
  - Recruit officers or engineers as needed

- **Research Institute**:
  - Acquire technology if affordable

### Income & Cleanup Phase

Click "End Turn" to:
- Collect income
- Draw cards
- Advance to next turn

## Browser Tab Reference

| Tab Index | Player | Faction |
|-----------|--------|---------|
| 0 | playtest_germany | Germany |
| 1 | playtest_usa | USA |
| 2 | playtest_italy | Italy |
| (user's browser) | kenny | Britain |

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
mcp__chrome-devtools__wait_for text="some text"
```

## Turn Notification Template

When it's kenny's turn, use this format:

---

**Your turn, kenny!**

📍 **Phase**: [worker_placement / reveal / income_cleanup]
🎯 **Turn**: [N] | **Round**: [N] | **Age**: [N]

**Your resources:**
- Cash: $[X] | Income: $[X]
- Gas: [H₂: X, He: X]
- Officers: [X] | Engineers: [X]

**What you can do:**
- [Phase-specific actions available]

Let me know when you've taken your action!

---

## Game End

When the game ends (Age 3 victory conditions met), report:
- Winner and final VP totals
- Each faction's score breakdown
- Notable achievements during the game

## Troubleshooting

**If a player can't take actions:**
- Check they're viewing the correct game
- Verify it's actually their turn
- Reload the page

**If the game state seems stuck:**
- Use `python -m playtest status` to check server-side state
- Compare with what the UI shows

**If an AI player's session expires:**
- Close the tab
- Open new tab and login again
- Navigate to the game
