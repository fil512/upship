"""Configuration and constants for the playtest tool."""

import os
import sys
from pathlib import Path

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
GAME_FILE = PROJECT_ROOT / ".upship-current-game"
LOG_FILE_TRACKER = PROJECT_ROOT / ".upship-current-log"
LOGS_DIR = PROJECT_ROOT / "logs"
CLI_CMD = ["node", str(PROJECT_ROOT / "cli" / "upship.js")]
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

# Age thresholds by player count (from server/config/constants.js)
AGE_THRESHOLDS = {
    2: {'age2': 2, 'age3': 4, 'end': 6},
    3: {'age2': 3, 'age3': 6, 'end': 9},
    4: {'age2': 4, 'age3': 8, 'end': 12}
}

# Early reveal mode: when enabled, players cycle through revealing with 0, 1, or 2 agents remaining
EARLY_REVEAL_MODE = os.environ.get("UPSHIP_EARLY_REVEAL") == "1" or "--early-reveal" in sys.argv

if "--early-reveal" in sys.argv:
    sys.argv = [a for a in sys.argv if a != "--early-reveal"]

# Default autoplay configuration
DEFAULT_MAX_TURNS = 50

# Technology -> Upgrade mapping for Design Bureau
# Frame and Fabric upgrades are required to launch ships (Section 3.2, 7.2)
TECH_TO_UPGRADE = {
    # Frame upgrades (required for launch)
    'wooden_framework': {'id': 'wooden_frame', 'slotType': 'frame'},
    'wire_bracing': {'id': 'tensioned_frame', 'slotType': 'frame'},
    'duralumin_girders': {'id': 'duralumin_frame', 'slotType': 'frame'},
    'steel_framework': {'id': 'steel_frame', 'slotType': 'frame'},
    'internal_keel': {'id': 'semi_rigid_keel', 'slotType': 'frame'},
    'geodetic_structure': {'id': 'geodetic_frame', 'slotType': 'frame'},
    'modular_construction': {'id': 'modular_frame', 'slotType': 'frame'},
    'articulated_keel': {'id': 'flexible_frame', 'slotType': 'frame'},
    # Fabric upgrades (required for launch)
    'rubberized_cotton': {'id': 'cotton_envelope', 'slotType': 'fabric'},
    'doped_canvas': {'id': 'doped_covering', 'slotType': 'fabric'},
    'goldbeaters_skin': {'id': 'goldbeater_envelope', 'slotType': 'fabric'},
    'aluminized_fabric': {'id': 'reflective_covering', 'slotType': 'fabric'},
    'synthetic_fabric': {'id': 'synthetic_envelope', 'slotType': 'fabric'},
    # Drive upgrades (optional but useful)
    'daimler_engine': {'id': 'basic_engine', 'slotType': 'drive'},
    'improved_propeller': {'id': 'efficient_propeller', 'slotType': 'drive'},
    'dual_engine_mount': {'id': 'twin_engine', 'slotType': 'drive'},
    'maybach_engine': {'id': 'maybach_cx', 'slotType': 'drive'},
    'diesel_powerplant': {'id': 'diesel_engine', 'slotType': 'drive'},
}

# Upgrade weights for calculating ship weight (from server/data/upgrades.js)
UPGRADE_WEIGHTS = {
    # Drives
    'basic_engine': 1, 'efficient_propeller': 1, 'twin_engine': 3,
    'maybach_cx': 2, 'diesel_engine': 2, 'vectored_thrust': 2,
    'balanced_propulsion': 2, 'aerodynamic_engine': 2, 'high_altitude_engine': 3,
    'hybrid_powerplant': 3, 'adaptive_propeller': 2,
    # Frames
    'wooden_frame': 2, 'tensioned_frame': 1, 'duralumin_frame': 2,
    'steel_frame': 3, 'semi_rigid_keel': 2, 'geodetic_frame': 1,
    'modular_frame': 1, 'flexible_frame': 1,
    # Fabrics (most are 0)
    'cotton_envelope': 0, 'doped_covering': 0, 'premium_envelope': 0,
    'fire_resistant_fabric': 1, 'reflective_covering': 0, 'synthetic_envelope': 0,
    'advanced_fabric': 0, 'conductive_covering': 0,
    # Components
    'passenger_gondola': 2, 'observation_deck': 1, 'cargo_hold': 2,
    'dining_saloon': 3, 'radio_room': 1, 'sleeping_quarters': 2,
    'luxury_lounge': 3, 'mail_compartment': 1, 'navigation_suite': 1,
    'pressurized_cabin': 2,
}

# Ground board location symbols (from server/data/groundBoard.js)
LOCATION_SYMBOLS = {
    # Propeller locations
    'research_institute': 'propeller',
    'launchpad': 'propeller',
    'ministry': 'propeller',
    'weather_bureau': 'propeller',
    # Wrench locations
    'design_bureau': 'wrench',
    'construction_hall': 'wrench',
    'technical_institute': 'wrench',
    'gas_depot': 'wrench',
    # Coin locations
    'academy': 'coin',
    'flight_school': 'coin',
    'government_liaison': 'coin',
    'insurance_bureau': 'coin',
}
