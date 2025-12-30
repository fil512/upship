# UP SHIP! Strategic Playtest Command (Production Server)

Run a playtest against the **production server** (https://upship-production.up.railway.app) using the Python automation tool. The goal is to play the game until it either **finishes** or gets **stuck** (revealing design flaws).

## Quick Start: Automated Full Game

For a complete playtest that runs until the game ends:

```bash
python scripts/playtest.py setup
python scripts/playtest.py autoplay
```

See `.claude/commands/_playtest-shared.md` for what this does and documentation on:
- Option A: Fully Automated Playtest
- Option B: Interactive Strategic Playtest
- Faction strategies and game phases
- Extending playtest.py
- Documenting findings
- Troubleshooting stuck games

## Command Reference (Production)

### Setup
```bash
python scripts/playtest.py setup [game_name]
```

### Autoplay
```bash
python scripts/playtest.py autoplay              # Run until game ends
python scripts/playtest.py autoplay 20           # Run for 20 turns max
```

### Status
```bash
python scripts/playtest.py status                # Current player's view
python scripts/playtest.py status playtest_usa   # Specific player's view
python scripts/playtest.py summary               # All players comparison
python scripts/playtest.py debug                 # Raw game state
```

### Actions
```bash
python scripts/playtest.py action <player> <command>
python scripts/playtest.py action playtest_germany state
python scripts/playtest.py action playtest_germany build 1
python scripts/playtest.py action playtest_usa buygas helium 3
python scripts/playtest.py endphase
```

### Routes and Launching
```bash
python scripts/playtest.py routes
python scripts/playtest.py launch <player> <shipId> <routeId> [hydrogen|helium]
```

### Utility
```bash
python scripts/playtest.py gameid
python scripts/playtest.py sessions
```
