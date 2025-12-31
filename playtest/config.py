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
LOG_FILE_TRACKER = PROJECT_ROOT / ".upship-current-log"
LOGS_DIR = PROJECT_ROOT / "logs"
PASSWORD = "test123456"

# Server configuration
# Use local server if UPSHIP_LOCAL=1 or --local flag
USE_LOCAL = os.environ.get("UPSHIP_LOCAL") == "1" or "--local" in sys.argv
API_BASE = "http://localhost:3000" if USE_LOCAL else "https://upship-production.up.railway.app"

# Clean up --local from argv
if "--local" in sys.argv:
    sys.argv = [a for a in sys.argv if a != "--local"]

# Players and factions
PLAYERS = ["playtest_germany", "playtest_britain", "playtest_usa", "playtest_italy"]
FACTIONS = ["germany", "britain", "usa", "italy"]

# Early reveal mode: when enabled, players cycle through revealing with 0, 1, or 2 agents remaining
EARLY_REVEAL_MODE = os.environ.get("UPSHIP_EARLY_REVEAL") == "1" or "--early-reveal" in sys.argv

if "--early-reveal" in sys.argv:
    sys.argv = [a for a in sys.argv if a != "--early-reveal"]

# Default autoplay configuration
DEFAULT_MAX_TURNS = 20
