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
CONFIG_FILE = PROJECT_ROOT / ".upship-config"
PASSWORD = "test123456"

# Superuser credentials (for viewing any game state)
SUPERUSER = "superuser"
SUPERUSER_PASSWORD = "superuser123"


def _load_config_file() -> dict:
    """Load configuration from .upship-config file.

    Returns:
        Dictionary of key=value pairs from the config file.
    """
    config = {}
    if CONFIG_FILE.exists():
        for line in CONFIG_FILE.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                config[key.strip()] = value.strip()
    return config


# Load config from file
_file_config = _load_config_file()

# Server configuration
# Use production server if:
# 1. UPSHIP_PROD=1 in .upship-config file, OR
# 2. UPSHIP_PROD=1 environment variable, OR
# 3. --prod flag on command line
# Otherwise, use local server by default (development mode)
USE_PROD = (
    _file_config.get("UPSHIP_PROD") == "1" or
    os.environ.get("UPSHIP_PROD") == "1" or
    "--prod" in sys.argv
)
USE_LOCAL = not USE_PROD  # Backwards compatibility
API_BASE = "https://upship-production.up.railway.app" if USE_PROD else "http://localhost:3000"
# Frontend URL (SvelteKit dev server on 5173, production served from Express on 3000)
FRONTEND_URL = "https://upship-production.up.railway.app" if USE_PROD else "http://localhost:5173"

# Clean up --prod from argv
if "--prod" in sys.argv:
    sys.argv = [a for a in sys.argv if a != "--prod"]

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

# Verbose strategy mode: show incremental analysis during bot decision-making
# Enable with UPSHIP_VERBOSE=1 env var, .upship-config, or --verbose flag
# Default: True (enabled) for debugging stuck games
VERBOSE_STRATEGY = (
    _file_config.get("UPSHIP_VERBOSE", "1") == "1" and
    os.environ.get("UPSHIP_VERBOSE", "1") == "1" and
    "--quiet" not in sys.argv
)

if "--quiet" in sys.argv:
    sys.argv = [a for a in sys.argv if a != "--quiet"]
if "--verbose" in sys.argv:
    VERBOSE_STRATEGY = True
    sys.argv = [a for a in sys.argv if a != "--verbose"]

# Default autoplay configuration
DEFAULT_MAX_TURNS = 20
