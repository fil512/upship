"""Client wrapper for interacting with the UP SHIP! game server.

Provides a shared UpshipClient instance and helper functions for
game setup and player management.
"""

import sys
from pathlib import Path

# Add parent directory to path so we can import the client package
sys.path.insert(0, str(Path(__file__).parent.parent))

from client import UpshipClient, AuthenticationError, SessionNotFoundError
from .config import API_BASE, GAME_FILE, PLAYERS, PASSWORD, USE_LOCAL


# Shared client instance
_client = None


def get_client() -> UpshipClient:
    """Get the shared UpshipClient instance.

    Returns:
        UpshipClient: The shared client instance configured for the correct server.
    """
    global _client
    if _client is None:
        _client = UpshipClient(base_url=API_BASE)
    return _client


def get_game_id() -> str | None:
    """Load current game ID from file.

    Returns:
        The game ID if saved, or None if no game file exists.
    """
    if GAME_FILE.exists():
        return GAME_FILE.read_text().strip()
    return None


def save_game_id(game_id: str) -> None:
    """Save game ID to file.

    Args:
        game_id: The game ID to save.
    """
    GAME_FILE.write_text(game_id)
    print(f"Game ID saved to {GAME_FILE}")


def login_all_players() -> None:
    """Ensure all playtest players are logged in.

    Attempts to login each player. If login fails (user doesn't exist),
    attempts to register the user first.
    """
    client = get_client()
    print(">>> Logging in players...")

    for player in PLAYERS:
        try:
            session = client.login(player, PASSWORD)
            print(f"  {player}: logged in")
        except AuthenticationError:
            # Try to register
            try:
                session = client.register(player, PASSWORD)
                print(f"  {player}: registered")
            except Exception as e:
                print(f"  {player}: WARNING - failed: {e}")
        except SessionNotFoundError:
            # Session file exists but is invalid, try login again
            try:
                session = client.login(player, PASSWORD)
                print(f"  {player}: logged in (refreshed)")
            except Exception as e:
                print(f"  {player}: WARNING - failed: {e}")
        except Exception as e:
            print(f"  {player}: WARNING - unexpected error: {e}")


def get_player_user_id(player: str) -> str | None:
    """Get the user ID for a player from their session.

    Args:
        player: The player username (e.g., 'playtest_germany')

    Returns:
        The user ID if session exists, or None.
    """
    from client import load_session, SessionNotFoundError

    try:
        session = load_session(player)
        return session.user_id
    except SessionNotFoundError:
        return None


def get_faction_from_player(player: str) -> str:
    """Extract faction name from player username.

    Args:
        player: The player username (e.g., 'playtest_germany')

    Returns:
        The faction name (e.g., 'germany')
    """
    return player.replace('playtest_', '')
