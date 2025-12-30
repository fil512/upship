"""Session management for the UP SHIP! client library.

Sessions are stored in .upship-sessions/ directory for interoperability
with the JavaScript CLI tool.
"""

import json
from pathlib import Path

from .models import Session
from .exceptions import SessionNotFoundError


# Session directory (relative to current working directory)
SESSIONS_DIR = Path('.upship-sessions')


def get_session_path(username: str) -> Path:
    """Get the path to a user's session file."""
    return SESSIONS_DIR / f'{username}.json'


def ensure_sessions_dir() -> None:
    """Create the sessions directory if it doesn't exist."""
    SESSIONS_DIR.mkdir(exist_ok=True)


def load_session(username: str) -> Session:
    """Load a session from disk.

    Args:
        username: The username to load the session for.

    Returns:
        The Session object.

    Raises:
        SessionNotFoundError: If no session exists for the username.
    """
    session_path = get_session_path(username)

    if not session_path.exists():
        raise SessionNotFoundError(f"No session found for user '{username}'. Please login first.")

    try:
        with open(session_path, 'r') as f:
            data = json.load(f)

        return Session(
            user_id=data.get('userId', ''),
            username=data.get('username', username),
            cookie=data.get('cookie', ''),
        )
    except (json.JSONDecodeError, KeyError) as e:
        raise SessionNotFoundError(f"Invalid session file for user '{username}': {e}")


def save_session(username: str, session: Session) -> None:
    """Save a session to disk.

    Args:
        username: The username to save the session for.
        session: The Session object to save.
    """
    ensure_sessions_dir()
    session_path = get_session_path(username)

    data = {
        'userId': session.user_id,
        'username': session.username,
        'cookie': session.cookie,
    }

    with open(session_path, 'w') as f:
        json.dump(data, f, indent=2)


def delete_session(username: str) -> None:
    """Delete a session from disk.

    Args:
        username: The username to delete the session for.
    """
    session_path = get_session_path(username)

    if session_path.exists():
        session_path.unlink()


def list_sessions() -> list[Session]:
    """List all active sessions.

    Returns:
        A list of Session objects for all stored sessions.
    """
    if not SESSIONS_DIR.exists():
        return []

    sessions = []
    for session_file in SESSIONS_DIR.glob('*.json'):
        username = session_file.stem
        try:
            session = load_session(username)
            sessions.append(session)
        except SessionNotFoundError:
            # Skip invalid session files
            pass

    return sessions
