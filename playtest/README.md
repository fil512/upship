# UP SHIP! Python Playtest Tool

Autonomous playtesting tool for UP SHIP! with 4 strategic bot players. Runs until the game **finishes** or gets **stuck** (revealing design flaws).

## Why This Tool?

Claude must **always use this tool instead of the CLI** (`npm run cli`). The CLI requires permission prompts that cause interruptions. The playtest tool runs without prompts.

If you need functionality that doesn't exist, **add it to this tool** rather than using the CLI.

## Quick Start

```bash
# Local development server (default)
python -m playtest setup      # Create new 4-player game
python -m playtest autoplay   # Run until game ends or stuck

# Production server
UPSHIP_PROD=1 python -m playtest setup
UPSHIP_PROD=1 python -m playtest autoplay
```

## Command Reference

### Game Setup

| Command | Description |
|---------|-------------|
| `setup` | Create new 4-player game with all AI players |
| `setup-bots` | Create game with playtest_britain + 3 server-side bots |
| `setup-interactive` | For `/play-with-me`: game for kenny + 3 AI players |
| `start` | Start the current game (useful after timeout) |

### Autoplay

| Command | Description |
|---------|-------------|
| `autoplay` | Run AI until game ends or stuck |
| `autoplay [N]` | Run for N turns maximum |
| `autoplay-until <faction>` | Run AI until specified faction's turn |
| `autoturn <faction>` | Play one turn for a specific faction |

### Status & Debugging

| Command | Description |
|---------|-------------|
| `status [player]` | Show game status (optional: specific player) |
| `summary` | Show all players' status table |
| `whose-turn` | Show whose turn it is and current phase |
| `routes` | Show available routes for the current age |
| `debug` | Show raw game state (JSON) |
| `sessions` | List active HTTP sessions |
| `gameid` | Print current game ID |
| `setgame <id>` | Set current game ID (for debugging) |

### Actions

| Command | Description |
|---------|-------------|
| `action <player> <cmd> [args]` | Run single action for player |
| `launch <player> <ship> <route> [gas]` | Launch ship to route |
| `endphase` | All players end turn/pass |
| `poke` | Trigger bot execution (for stuck games) |

### Logging

| Command | Description |
|---------|-------------|
| `tail [N]` | Show last N lines of playtest log (default: 50) |
| `output [N]` | Show Claude background task output (default: 100) |

### Utility

| Command | Description |
|---------|-------------|
| `healthcheck [timeout]` | Wait for server to be healthy (default: 30s) |
| `reset` | Drop all game data (dev only, blocked in prod) |

## Detailed Command Documentation

### setup

Creates a new 4-player game with AI players (playtest_germany, playtest_britain, playtest_usa, playtest_italy). Automatically:
1. Logs in all AI players (registers if needed)
2. Creates a new game
3. Joins all players to the game
4. Assigns factions (Germany, Britain, USA, Italy)
5. Starts the game

### setup-interactive

**For `/play-with-me` workflow only.** Creates a game for kenny (human) playing as Britain with 3 AI opponents:
1. Logs in AI players (Germany, USA, Italy)
2. Creates game with Germany as host
3. Waits for kenny to join via browser and select Britain
4. Starts game when kenny is ready

For automated testing, use `setup` (all AI) or `setup-bots` (playtest_britain + server bots) instead.

### autoplay

Runs AI players until game ends or gets stuck:
- **Game end detection**: Reports winner and scores when game finishes
- **Stuck detection**: Verbose diagnostics when no progress is made
- Strategic bot logic for all phases

### autoplay-until <faction>

Useful for interactive games where a human plays one faction:
```bash
python -m playtest autoplay-until britain
```
Plays all AI turns and stops when it's Britain's turn.

### action <player> <cmd> [args]

Execute a single action. Supported commands:

| Action | Syntax | Example |
|--------|--------|---------|
| End turn | `endturn` | `action playtest_germany endturn` |
| Pass/Reveal | `pass` or `reveal` | `action playtest_germany pass` |
| No more launches | `nolaunches` | `action playtest_germany nolaunches` |
| Place agent | `place <loc> <cardIdx> [opts]` | `action playtest_germany place design-bureau 0` |
| Build ship | `build [count]` | `action playtest_germany build 2` |
| Buy gas | `buygas <type> [amount]` | `action playtest_usa buygas helium 3` |
| Recruit crew | `recruit <type> [count]` | `action playtest_usa recruit officer 2` |
| Install upgrade | `install <slot> <idx> <id>` | `action playtest_usa install frame 0 upgrade_id` |
| Take loan | `loan` | `action playtest_italy loan` |

### launch <player> <ship> <route> [gas]

Launch a ship to claim a route:
```bash
python -m playtest launch playtest_germany ship_123 route_456 hydrogen
```

## Location IDs

For `action ... place`:

**Technical (wrench):**
- `research-institute`, `design-bureau`, `construction-hall`

**Operations (propeller):**
- `launchpad`, `ministry`, `gas-depot`, `weather-bureau`

**Business (coin):**
- `academy`, `flight-school`, `technical-institute`, `the-bank`, `insurance-bureau`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `UPSHIP_PROD=1` | Use production server |
| `UPSHIP_URL` | Custom server URL |

## Features

- **Game end detection**: Reports winner and final scores
- **Stuck detection**: Verbose diagnostics identifying design flaws
- **Strategic bot logic**: Prioritizes building, launching, resources
- **Phase handling**: Correct behavior for worker_placement, reveal, income_cleanup
- **No permission prompts**: Runs autonomously (unlike CLI)

## Project Structure

```
playtest/
├── __init__.py      # Package init
├── __main__.py      # CLI entry point and command dispatch
├── autoplay.py      # Main game loop with stuck detection
├── client.py        # HTTP client wrapper (UpshipClient)
├── config.py        # Configuration (server URLs, players, factions)
├── display.py       # Output formatting (status, summary, routes)
├── logging.py       # Playtest log file management
├── phases.py        # Phase handlers (worker, reveal, income)
├── state.py         # Game state accessors
└── strategy.py      # Bot decision logic
```

## Extending the Tool

When adding new functionality:

1. Add the command handler in `__main__.py`
2. Add any new client methods to `client.py`
3. Update the docstring at the top of `__main__.py`
4. Update this README

## Troubleshooting

### Game stuck at a phase
```bash
python -m playtest debug    # Check raw state
python -m playtest tail 100 # Check recent log entries
python -m playtest poke     # Trigger bot execution
```

### Server not responding
```bash
python -m playtest healthcheck 60  # Wait up to 60s for server
./scripts/restart_server.sh        # Restart the server
```

### Wrong game ID
```bash
python -m playtest gameid          # Check current game
python -m playtest setgame <id>    # Set to correct game
```
