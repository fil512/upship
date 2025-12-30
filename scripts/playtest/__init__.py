"""UP SHIP! Playtest Automation Tool.

A modular Python package for autonomous playtesting of the UP SHIP! board game.

Usage:
    python -m playtest setup [game_name]     # Create new 4-player game
    python -m playtest autoplay              # Run AI until game ends
    python -m playtest autoplay [num_turns]  # Run AI for N turns
    python -m playtest status [player]       # Show current game status
    python -m playtest summary               # Show all players' status table
    python -m playtest action <player> <cmd> # Run single command
    python -m playtest endphase              # All players end turn
    python -m playtest debug                 # Show raw game state
    python -m playtest tail [num_lines]      # Show last N lines of log
    python -m playtest output [num_lines]    # Show Claude background task output
"""

from .config import (
    PROJECT_ROOT, GAME_FILE, API_BASE, USE_LOCAL,
    PLAYERS, FACTIONS, DEFAULT_MAX_TURNS
)
from .cli import (
    run_cli, strip_ansi, get_game_id, save_game_id,
    login_all_players, get_full_state
)
from .logging import PlaytestLogger, get_logger
from .state import (
    get_phase, get_age, get_current_player, get_current_placer,
    get_player_ships, get_available_routes, check_game_ended
)
from .strategy import (
    evaluate_launch_readiness, find_strategic_placement,
    get_design_bureau_swaps
)
from .autoplay import autoplay, StuckDetector
from .display import (
    show_status, show_summary, show_sessions, show_routes,
    debug_state, tail_log, show_claude_output
)

__all__ = [
    # Config
    'PROJECT_ROOT', 'GAME_FILE', 'API_BASE', 'USE_LOCAL',
    'PLAYERS', 'FACTIONS', 'DEFAULT_MAX_TURNS',
    # CLI
    'run_cli', 'strip_ansi', 'get_game_id', 'save_game_id',
    'login_all_players', 'get_full_state',
    # Logging
    'PlaytestLogger', 'get_logger',
    # State
    'get_phase', 'get_age', 'get_current_player', 'get_current_placer',
    'get_player_ships', 'get_available_routes', 'check_game_ended',
    # Strategy
    'evaluate_launch_readiness', 'find_strategic_placement',
    'get_design_bureau_swaps',
    # Autoplay
    'autoplay', 'StuckDetector',
    # Display
    'show_status', 'show_summary', 'show_sessions', 'show_routes',
    'debug_state', 'tail_log', 'show_claude_output',
]
