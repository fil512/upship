# UP SHIP! Strategic Playtest Command (Production Server)

Run a playtest against the **production server** (https://upship-production.up.railway.app) using the Python automation tool. The goal is to play the game until it either **finishes** or gets **stuck** (revealing design flaws).

## Quick Start: Automated Full Game

For a complete playtest that runs until the game ends:

```bash
# Verify production server is healthy
python -m playtest healthcheck

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

## Command Reference (Production)

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

### Utility
```bash
python -m playtest gameid
python -m playtest sessions
```
