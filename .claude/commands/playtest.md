# UP SHIP! Strategic Playtest Command

Run a playtest using the Python automation tool. The goal is to play the game until it either **finishes** or gets **stuck** (revealing design flaws).

## Quick Start: Automated Full Game

For a complete playtest that runs until the game ends:

```bash
python scripts/playtest.py setup
python scripts/playtest.py autoplay
```

This will:
- Create a 4-player game with strategic bot players
- Play through all phases automatically
- Stop when the game ends (showing winner and scores) OR when stuck (showing diagnostic report)

## Option A: Fully Automated Playtest

Let the bots play the entire game:

```bash
# Setup new game
python scripts/playtest.py setup

# Run until game ends or gets stuck
python scripts/playtest.py autoplay

# Or limit to N turns
python scripts/playtest.py autoplay 20
```

After completion, review the output for:
- **Game ended**: Winner and final scores shown
- **Game stuck**: Verbose diagnostic report with possible causes

## Option B: Interactive Strategic Playtest

For manual analysis of each turn:

### 1. Setup

```bash
python scripts/playtest.py setup
```

### 2. Check State

```bash
python scripts/playtest.py status              # Current player's view
python scripts/playtest.py status playtest_usa # Specific player's view
python scripts/playtest.py summary             # All players comparison table
python scripts/playtest.py debug               # Raw game state
```

### 3. Make Strategic Decisions

**Current Game Phases:**
- **WORKER PLACEMENT**: Players take turns placing agents on Ground Board locations using cards from hand. Pass when done.
- **REVEAL**: Simultaneous phase - all players take location actions (build ships, buy gas, recruit crew, launch ships)
- **INCOME & CLEANUP**: Collect income, draw cards, advance to next turn

**Faction Strategies:**
- **Germany**: Hydrogen efficiency, large ships, starting tech advantage
- **Britain**: Balanced growth, steady income, passenger routes
- **USA**: Helium preference (monopoly discount), prioritize safety
- **Italy**: Fast and agile, many small ships, extra upgrade flexibility

### 4. Execute Actions

```bash
# Single action for a player
python scripts/playtest.py action <player> <command>

# Examples:
python scripts/playtest.py action playtest_germany state
python scripts/playtest.py action playtest_germany build 1
python scripts/playtest.py action playtest_usa buygas helium 3
python scripts/playtest.py action playtest_britain endturn

# Advance all players through current phase
python scripts/playtest.py endphase
```

### 5. Launch Ships

```bash
# Check available routes
python scripts/playtest.py routes

# Launch a ship to claim a route
python scripts/playtest.py launch <player> <shipId> <routeId> [hydrogen|helium]
```

## Extending playtest.py

**IMPORTANT**: If you need functionality that isn't available in playtest.py, extend the Python script rather than calling `npm run cli` directly. The playtest.py tool is the single interface for all playtesting.

To add new capabilities:
1. Add a new function in `scripts/playtest.py`
2. Add a new command handler in `main()`
3. Document in the docstring at the top of the file

## Document Findings

After playtesting, create a report at `plans/YYYY-MM-DD_playtest_report.md`:

```markdown
# UP SHIP! Playtest Report

**Date**: [date]
**Game ID**: [from python scripts/playtest.py gameid]
**Outcome**: [Game completed / Game stuck at phase X]

## Game Summary
- Turns played: [N]
- Winner: [faction] with [X] VP
- Final scores: [breakdown]

## Issues Found

### Bugs
[Commands that failed, unexpected behavior]

### Design Flaws
[If game got stuck, what was the diagnostic report? What caused it?]

### Balance Concerns
[Faction imbalances, resource economy issues]

## Recommendations
[Priority fixes]
```

## Troubleshooting

If the game gets stuck, the autoplay tool provides verbose diagnostics:
- State fingerprint (phase, turn, age, progress)
- All player resources
- Ground board placements
- Available routes
- Possible causes

Use this information to identify and fix the design flaw, then run another playtest.
