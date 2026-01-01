# Play With Me - Interactive UP SHIP! Game

Play a 4-player game where you (kenny) play as **Britain** and Claude controls Germany, USA, and Italy through browser automation.

## Prerequisites

1. **Chrome DevTools MCP server must be connected** (chrome-devtools)
2. **Local server running** at http://localhost:3000

## Quick Start

### Step 1: Restart the local server

```bash
./scripts/restart_server.sh
```

### Step 2: Create game and login AI players

1. Open browser page for Germany (host):
```
mcp__chrome-devtools__new_page url="http://localhost:3000/"
```

2. Take snapshot and login as `playtest_germany` / `test123456`

3. Create a new game with a memorable name

4. Note the game ID

### Step 3: Prompt user to join

**Ask the user:**
> Game created! Please:
> 1. Open http://localhost:3000 in your browser
> 2. Login as kenny
> 3. Click "Available Games" and join the game I just created
> 4. Select **Britain** as your faction
> 5. Let me know when you've joined and selected Britain

Wait for user confirmation before proceeding.

### Step 4: Add remaining AI players

After user confirms they joined:

1. Open new tab, login as `playtest_usa` / `test123456`:
```
mcp__chrome-devtools__new_page url="http://localhost:3000/"
```
   - Join the game, select USA faction

2. Open new tab, login as `playtest_italy` / `test123456`:
```
mcp__chrome-devtools__new_page url="http://localhost:3000/"
```
   - Join the game, select Italy faction

3. Switch back to Germany tab, select Germany faction

4. Start the game (Germany is host)

### Step 5: Enter the game on all AI tabs

Navigate each AI player's tab to the game board:
```
mcp__chrome-devtools__navigate_page type="url" url="http://localhost:3000/game.html?id=GAME_ID"
```

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
