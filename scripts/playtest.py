#!/usr/bin/env python3
"""
UP SHIP! Playtest Automation Tool

A Python-based CLI wrapper for autonomous playtesting.
Stores current game ID in .upship-current-game for persistence.

Usage:
    python scripts/playtest.py setup [game_name]     # Create new 4-player game
    python scripts/playtest.py autoplay              # Run AI until game ends (max 50 turns)
    python scripts/playtest.py autoplay [num_turns]  # Run AI for N turns
    python scripts/playtest.py status [player]       # Show current game status
    python scripts/playtest.py summary               # Show all players' status table
    python scripts/playtest.py action <player> <cmd> # Run single command
    python scripts/playtest.py endphase              # All players end turn
    python scripts/playtest.py debug                 # Show raw game state
    python scripts/playtest.py tail [num_lines]      # Show last N lines of log (default: 50)
    python scripts/playtest.py output [num_lines]    # Show Claude background task output (default: 100)
"""

# This is a thin wrapper that delegates to the playtest package
# The actual implementation is in scripts/playtest/__main__.py

if __name__ == "__main__":
    from playtest.__main__ import main
    main()
