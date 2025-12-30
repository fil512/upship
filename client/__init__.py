"""UP SHIP! Python client library.

A synchronous Python library for interacting with the UP SHIP! game server.
Provides typed dataclasses for game state and automatic session management.

Example:
    from client import UpshipClient

    # Create client (uses UPSHIP_URL env var or production URL)
    client = UpshipClient()

    # Login (saves session to .upship-sessions/)
    session = client.login('testpilot42', 'airship123')

    # List games
    games = client.list_games('testpilot42', status='active')

    # Get game state
    state = client.get_state('testpilot42', game_id)

    # Perform actions
    result = client.place_agent('testpilot42', game_id, 'design-bureau', 0)
    if result.success:
        print(f"Placed agent, now in phase: {result.game_state.phase}")
"""

from .client import UpshipClient
from .models import (
    Session,
    Card,
    Ship,
    Blueprint,
    Route,
    Technology,
    Player,
    Game,
    GameState,
    WorkerPlacement,
    ActionResult,
)
from .exceptions import (
    UpshipError,
    AuthenticationError,
    SessionNotFoundError,
    APIError,
    GameNotFoundError,
    InvalidActionError,
)
from .session import (
    load_session,
    save_session,
    delete_session,
    list_sessions,
)

__all__ = [
    # Main client
    'UpshipClient',

    # Models
    'Session',
    'Card',
    'Ship',
    'Blueprint',
    'Route',
    'Technology',
    'Player',
    'Game',
    'GameState',
    'WorkerPlacement',
    'ActionResult',

    # Exceptions
    'UpshipError',
    'AuthenticationError',
    'SessionNotFoundError',
    'APIError',
    'GameNotFoundError',
    'InvalidActionError',

    # Session management
    'load_session',
    'save_session',
    'delete_session',
    'list_sessions',
]

__version__ = '1.0.0'
