# UP SHIP! Strategic Playtest Command (Local Dev Server)

Run a playtest against the **local development server** (http://localhost:3000) using the Python automation tool. The goal is to play the game until it either **finishes** or gets **stuck** (revealing design flaws).

## Quick Start: Automated Full Game

**Step 1: Rebuild and restart the local server**

```bash
./scripts/restart_server.sh
```

**Step 2: Run the playtest**

```bash
python -m playtest setup
python -m playtest autoplay
```

See `.claude/commands/_playtest-shared.md` for what this does and documentation on:
- Option A: Fully Automated Playtest
- Option B: Interactive Strategic Playtest
- Faction strategies and game phases
- Extending playtest.py
- Documenting findings
- Troubleshooting stuck games

## Command Reference

The playtest tool uses local server by default. Use `--prod` flag or `UPSHIP_PROD=1` to target production.

### Setup
```bash
python -m playtest setup
```

### Autoplay
```bash
python -m playtest autoplay              # Run until game ends
python -m playtest autoplay 20           # Run for 20 turns max
```

### Status
```bash
python -m playtest status                # Current player's view
python -m playtest status playtest_usa   # Specific player's view
python -m playtest summary               # All players comparison
python -m playtest debug                 # Raw game state
```

### Actions
```bash
python -m playtest action <player> <command>
python -m playtest action playtest_germany state
python -m playtest action playtest_germany build 1
python -m playtest action playtest_usa buygas helium 3
python -m playtest endphase
```

### Routes and Launching
```bash
python -m playtest routes
python -m playtest launch <player> <shipId> <routeId> [hydrogen|helium]
```

### Log Monitoring
```bash
python -m playtest tail             # Last 50 lines of playtest log
python -m playtest tail 100         # Last 100 lines of playtest log
```

### Utility
```bash
python -m playtest gameid
python -m playtest sessions
```

### Production Server
```bash
python -m playtest --prod setup       # Use production server
UPSHIP_PROD=1 python -m playtest autoplay  # Alternative syntax
```
