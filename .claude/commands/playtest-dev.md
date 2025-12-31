# UP SHIP! Strategic Playtest Command (Local Dev Server)

Run a playtest against the **local development server** (http://localhost:3000) using the Python automation tool. The goal is to play the game until it either **finishes** or gets **stuck** (revealing design flaws).

## Quick Start: Automated Full Game

**Step 1: Rebuild and restart the local server**

```bash
# Kill any existing server on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Run database migrations
npm run migrate:local

# Start the server in background
npm run dev:local &

# Wait for server to be healthy (up to 30 seconds)
UPSHIP_LOCAL=1 python -m playtest healthcheck
```

**Step 2: Run the playtest**

```bash
UPSHIP_LOCAL=1 python -m playtest setup
UPSHIP_LOCAL=1 python -m playtest autoplay
```

See `.claude/commands/_playtest-shared.md` for what this does and documentation on:
- Option A: Fully Automated Playtest
- Option B: Interactive Strategic Playtest
- Faction strategies and game phases
- Extending playtest.py
- Documenting findings
- Troubleshooting stuck games

## Command Reference (Local Dev)

All commands use `UPSHIP_LOCAL=1` prefix to target local server:

### Setup
```bash
UPSHIP_LOCAL=1 python -m playtest setup
```

### Autoplay
```bash
UPSHIP_LOCAL=1 python -m playtest autoplay              # Run until game ends
UPSHIP_LOCAL=1 python -m playtest autoplay 20           # Run for 20 turns max
```

### Status
```bash
UPSHIP_LOCAL=1 python -m playtest status                # Current player's view
UPSHIP_LOCAL=1 python -m playtest status playtest_usa   # Specific player's view
UPSHIP_LOCAL=1 python -m playtest summary               # All players comparison
UPSHIP_LOCAL=1 python -m playtest debug                 # Raw game state
```

### Actions
```bash
UPSHIP_LOCAL=1 python -m playtest action <player> <command>
UPSHIP_LOCAL=1 python -m playtest action playtest_germany state
UPSHIP_LOCAL=1 python -m playtest action playtest_germany build 1
UPSHIP_LOCAL=1 python -m playtest action playtest_usa buygas helium 3
UPSHIP_LOCAL=1 python -m playtest endphase
```

### Routes and Launching
```bash
UPSHIP_LOCAL=1 python -m playtest routes
UPSHIP_LOCAL=1 python -m playtest launch <player> <shipId> <routeId> [hydrogen|helium]
```

### Log Monitoring
```bash
UPSHIP_LOCAL=1 python -m playtest tail             # Last 50 lines of playtest log
UPSHIP_LOCAL=1 python -m playtest tail 100         # Last 100 lines of playtest log
```

### Utility
```bash
UPSHIP_LOCAL=1 python -m playtest gameid
UPSHIP_LOCAL=1 python -m playtest sessions
```
