"""Configuration and constants for the playtest tool.

Note: Game data (upgrades, technologies, locations, etc.) is fetched from
the server via the manifest API. See client.get_manifest() for access.
"""

import os
import sys
from pathlib import Path

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
GAME_FILE = PROJECT_ROOT / ".upship-current-game"
HUMAN_FACTION_FILE = PROJECT_ROOT / ".upship-human-faction"
LOG_FILE_TRACKER = PROJECT_ROOT / ".upship-current-log"
LOGS_DIR = PROJECT_ROOT / "logs"
PASSWORD = "test123456"

# Server configuration
# Use local server if UPSHIP_LOCAL=1 or --local flag
USE_LOCAL = os.environ.get("UPSHIP_LOCAL") == "1" or "--local" in sys.argv
API_BASE = "http://localhost:3000" if USE_LOCAL else "https://upship-production.up.railway.app"
# Frontend URL (SvelteKit dev server on 5173, production served from Express on 3000)
FRONTEND_URL = "http://localhost:5173" if USE_LOCAL else "https://upship-production.up.railway.app"

# Clean up --local from argv
if "--local" in sys.argv:
    sys.argv = [a for a in sys.argv if a != "--local"]

# Players and factions
PLAYERS = ["playtest_germany", "playtest_britain", "playtest_usa", "playtest_italy"]
FACTIONS = ["germany", "britain", "usa", "italy"]

# AI players set (for quick lookup in interactive mode)
AI_PLAYERS = set(PLAYERS)

# Factions controlled by AI in the current game
# In a normal game: all factions are AI
# In an interactive game: one faction is human (e.g., britain -> kenny)
AI_FACTIONS = set(FACTIONS)  # Default: all factions are AI
HUMAN_FACTION = None  # Set during setup-interactive


def set_human_faction(faction: str) -> None:
    """Mark a faction as human-controlled (not AI).

    Call this during setup-interactive to indicate which faction
    the human player controls. Persists to file for subsequent commands.
    """
    global HUMAN_FACTION, AI_FACTIONS
    HUMAN_FACTION = faction.lower() if faction else None
    AI_FACTIONS = {f for f in FACTIONS if f != HUMAN_FACTION}

    # Persist to file
    if HUMAN_FACTION:
        HUMAN_FACTION_FILE.write_text(HUMAN_FACTION)
    elif HUMAN_FACTION_FILE.exists():
        HUMAN_FACTION_FILE.unlink()


def load_human_faction() -> str | None:
    """Load the human faction from file (if any).

    Returns:
        The human faction name, or None if not set.
    """
    global HUMAN_FACTION, AI_FACTIONS
    if HUMAN_FACTION_FILE.exists():
        HUMAN_FACTION = HUMAN_FACTION_FILE.read_text().strip().lower()
        AI_FACTIONS = {f for f in FACTIONS if f != HUMAN_FACTION}
        return HUMAN_FACTION
    return None


def clear_human_faction() -> None:
    """Clear the human faction (for normal 4-AI games)."""
    global HUMAN_FACTION, AI_FACTIONS
    HUMAN_FACTION = None
    AI_FACTIONS = set(FACTIONS)
    if HUMAN_FACTION_FILE.exists():
        HUMAN_FACTION_FILE.unlink()


# Load human faction on module import (for persistence across commands)
load_human_faction()


def is_ai_player(username: str) -> bool:
    """Check if a player is an AI player (playtest_* account).

    In interactive games, human players (e.g., 'kenny') are not AI players.
    """
    return username in AI_PLAYERS


def is_ai_faction(faction: str) -> bool:
    """Check if a faction is AI-controlled.

    In interactive games, one faction (e.g., britain) may be human-controlled.
    """
    return faction.lower() in AI_FACTIONS

# Early reveal mode: when enabled, players cycle through revealing with 0, 1, or 2 agents remaining
EARLY_REVEAL_MODE = os.environ.get("UPSHIP_EARLY_REVEAL") == "1" or "--early-reveal" in sys.argv

if "--early-reveal" in sys.argv:
    sys.argv = [a for a in sys.argv if a != "--early-reveal"]

# Default autoplay configuration
DEFAULT_MAX_TURNS = 20
