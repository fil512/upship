# Play With Me - Interactive UP SHIP! Game

Play a 4-player game where you (kenny) play as **Britain** and Claude controls Germany, USA, and Italy via the playtest tool.

## How It Works

1. Claude restarts the servers and sets up a new game
2. You join the game in your browser and select Britain
3. Claude plays the AI turns using the playtest CLI tool
4. You play your turns in the browser UI

## Step 1: Start Servers

Run the restart script to ensure both servers are running:

```bash
./scripts/restart_server.sh
```

This starts:
- Express API on http://localhost:3000
- SvelteKit frontend on http://localhost:5173

## Step 2: Set Up the Game

Run this command ONCE to create the game:

```bash
python -m playtest setup-interactive
```

This creates a game with 3 AI players and waits for kenny to join.

**DO NOT** run this command multiple times - it will create duplicate games!

**Tell the user and WAIT for their confirmation:**
> Game is ready! Please:
> 1. Open http://localhost:5173 in your browser
> 2. Login as **kenny** (password: whatever you set, or register a new account)
> 3. Click "Open Games" and join the "[Game Name]" game
> 4. Select **Britain** as your faction
>
> **Say "joined" when you're in the game!**

**IMPORTANT:**
- After telling the user the game is ready, **STOP and wait** for them to explicitly say they've joined (e.g., "joined", "done", "I'm in")
- Do NOT proceed to the game loop until the user confirms
- Do NOT try to debug, check databases, or verify programmatically - just wait for the user
- The setup-interactive script runs in the background and may timeout - that's fine, the game is still playable

## Step 3: Game Loop

Use the playtest tool to check status and play AI turns:

### Check Whose Turn

```bash
python -m playtest whose-turn
```

Shows whose turn it is and the current phase.

### Check Current State

```bash
python -m playtest summary
```

Shows all players' status including resources and ships.

### Autoplay Until Kenny's Turn

The easiest way to play - run all AI turns automatically until it's kenny's turn:

```bash
python -m playtest autoplay-until britain
```

This will:
- Play all Germany, USA, and Italy turns automatically
- Stop when it's Britain's turn
- Report the current phase and game state

### Play Single AI Turn

To play just one turn for a specific AI faction:

```bash
python -m playtest autoturn germany
python -m playtest autoturn usa
python -m playtest autoturn italy
```

This only works if it's actually that faction's turn.

## Step 4: Kenny's Turn

When it's kenny's turn, prompt:

> **Your turn, kenny!**
>
> Phase: [phase from whose-turn]
> Turn: [N] | Round: [N] | Age: [N]
>
> Take your action in the browser and say "done" when finished.

After kenny confirms, run `autoplay-until britain` again to play AI turns.

## Command Reference

See **`playtest/README.md`** for complete playtest command reference.

Key commands for interactive play:

| Command | Description |
|---------|-------------|
| `whose-turn` | Show whose turn it is |
| `summary` | Show all players' status table |
| `autoplay-until britain` | Play AI turns until kenny's turn |
| `autoturn <faction>` | Play one turn for a specific faction |

## Turn Notification Template

When it's kenny's turn:

---

**Your turn, kenny!**

**Phase**: [worker_placement / reveal / income_cleanup]
**Turn**: [N] | **Round**: [N] | **Age**: [N]

**Your resources**:
- Cash: £[X] | Income: +£[X]/turn
- Gas: H2=[X], He=[X]
- Officers: [X] | Engineers: [X]
- VP: [X]

**What you can do:**
- [Phase-specific actions]

Take your action in the browser and say "done" when finished!

---

## Typical Game Flow

1. Run `./scripts/restart_server.sh`
2. Run `python -m playtest setup-interactive` (in background)
3. Tell kenny the game is ready with the game name and URL
4. **STOP and WAIT** for kenny to say "joined" (do NOT proceed until they confirm!)
5. **Game Loop:**
   - Run `python -m playtest autoplay-until britain`
   - Tell kenny it's their turn with status info
   - **WAIT** for kenny to say "done"
   - Repeat

## Game End

When the game ends (Age 3 victory conditions met), report:
- Winner and final VP totals
- Each faction's score breakdown
