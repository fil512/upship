# UP SHIP! Strategic Playtest Command (Local Dev Server)

Run a playtest against the **local development server** (http://localhost:3000) using the Python automation tool. The goal is to play the game until it either **finishes** or gets **stuck** (revealing design flaws).

**Prerequisites**: The local server must be running (`npm run dev`).

## Quick Start: Automated Full Game

For a complete playtest that runs until the game ends:

```bash
UPSHIP_LOCAL=1 python scripts/playtest.py setup
UPSHIP_LOCAL=1 python scripts/playtest.py autoplay
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
UPSHIP_LOCAL=1 python scripts/playtest.py setup [game_name]
```

### Autoplay
```bash
UPSHIP_LOCAL=1 python scripts/playtest.py autoplay              # Run until game ends
UPSHIP_LOCAL=1 python scripts/playtest.py autoplay 20           # Run for 20 turns max
```

### Status
```bash
UPSHIP_LOCAL=1 python scripts/playtest.py status                # Current player's view
UPSHIP_LOCAL=1 python scripts/playtest.py status playtest_usa   # Specific player's view
UPSHIP_LOCAL=1 python scripts/playtest.py summary               # All players comparison
UPSHIP_LOCAL=1 python scripts/playtest.py debug                 # Raw game state
```

### Actions
```bash
UPSHIP_LOCAL=1 python scripts/playtest.py action <player> <command>
UPSHIP_LOCAL=1 python scripts/playtest.py action playtest_germany state
UPSHIP_LOCAL=1 python scripts/playtest.py action playtest_germany build 1
UPSHIP_LOCAL=1 python scripts/playtest.py action playtest_usa buygas helium 3
UPSHIP_LOCAL=1 python scripts/playtest.py endphase
```

### Routes and Launching
```bash
UPSHIP_LOCAL=1 python scripts/playtest.py routes
UPSHIP_LOCAL=1 python scripts/playtest.py launch <player> <shipId> <routeId> [hydrogen|helium]
```

### Utility
```bash
UPSHIP_LOCAL=1 python scripts/playtest.py gameid
UPSHIP_LOCAL=1 python scripts/playtest.py sessions
```
