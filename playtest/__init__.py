"""UP SHIP! Playtest Tool.

A Python package for autonomous playtesting of the UP SHIP! board game.
Uses the client library for direct HTTP communication with the game server.

Example:
    from playtest import setup_game, autoplay

    # Create a new 4-player game
    game_id = setup_game("Test Game")

    # Run autonomous playtesting
    autoplay(num_turns=20)
"""

from .autoplay import autoplay, StuckDetector
from .client import get_client, login_all_players, get_game_id, save_game_id
from .display import show_status, show_summary, show_routes, debug_state, tail_log
from .logging import get_logger, PlaytestLogger
from .phases import (
    handle_worker_placement_round,
    handle_reveal_phase,
    handle_income_cleanup_phase,
)
from .strategy import (
    find_playable_card,
    find_strategic_placement,
    evaluate_launch_readiness,
    get_design_bureau_swaps,
)

__all__ = [
    # Main entry points
    'autoplay',
    'setup_game',

    # Client utilities
    'get_client',
    'login_all_players',
    'get_game_id',
    'save_game_id',

    # Display
    'show_status',
    'show_summary',
    'show_routes',
    'debug_state',
    'tail_log',

    # Logging
    'get_logger',
    'PlaytestLogger',

    # Phase handlers
    'handle_worker_placement_round',
    'handle_reveal_phase',
    'handle_income_cleanup_phase',

    # Strategy
    'find_playable_card',
    'find_strategic_placement',
    'evaluate_launch_readiness',
    'get_design_bureau_swaps',

    # Classes
    'StuckDetector',
]

__version__ = '2.0.0'
