"""CLI wrapper utilities for interacting with the upship CLI tool."""

import json
import os
import re
import subprocess
import urllib.request
import urllib.error

from .config import CLI_CMD, PROJECT_ROOT, GAME_FILE, API_BASE, USE_LOCAL, PASSWORD, PLAYERS


def run_cli(*args, capture=True):
    """Run a CLI command and return output."""
    cmd = CLI_CMD + list(args)
    env = os.environ.copy()
    if USE_LOCAL:
        env["UPSHIP_URL"] = API_BASE
    result = subprocess.run(cmd, capture_output=capture, text=True, cwd=PROJECT_ROOT, env=env)
    return result.stdout + result.stderr if capture else ""


def strip_ansi(text):
    """Remove ANSI color codes from text."""
    return re.sub(r'\x1b\[[0-9;]*m', '', text)


def get_game_id():
    """Load current game ID from file."""
    if GAME_FILE.exists():
        return GAME_FILE.read_text().strip()
    return None


def save_game_id(game_id):
    """Save game ID to file."""
    GAME_FILE.write_text(game_id)
    print(f"Game ID saved to {GAME_FILE}")


def extract_game_id(output):
    """Extract UUID from CLI output."""
    match = re.search(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', output)
    return match.group(0) if match else None


def get_session_cookie(player="playtest_germany"):
    """Load session cookie for a player."""
    session_file = PROJECT_ROOT / ".upship-sessions" / f"{player}.json"
    if session_file.exists():
        with open(session_file) as f:
            session = json.load(f)
            return session.get("cookie", "")
    return ""


def login_all_players():
    """Ensure all players are logged in."""
    print(">>> Logging in players...")
    for player in PLAYERS:
        output = strip_ansi(run_cli("login", player, PASSWORD))
        if "✓" in output or "already" in output.lower():
            print(f"  {player}: logged in")
        else:
            # Try register
            output = strip_ansi(run_cli("register", player, PASSWORD))
            if "✓" in output:
                print(f"  {player}: registered")
            else:
                print(f"  {player}: WARNING - login failed")


def api_request(endpoint, player="playtest_germany"):
    """Make an API request to the game server.

    Args:
        endpoint: API endpoint (e.g., "/api/state/{game_id}")
        player: Player to use for session cookie

    Returns:
        Parsed JSON response or None on error
    """
    try:
        url = f"{API_BASE}{endpoint}"
        req = urllib.request.Request(url)
        cookie = get_session_cookie(player)
        if cookie:
            req.add_header("Cookie", cookie)
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode())
    except (urllib.error.URLError, json.JSONDecodeError) as e:
        print(f"API request error: {e}")
        return None


def get_full_state(game_id, player="playtest_germany"):
    """Fetch complete game state from API for detailed logging.

    Returns:
        Tuple of (state_dict, gameState_wrapper) or (None, None) on error
    """
    data = api_request(f"/api/state/{game_id}", player)
    if data:
        gs = data.get('gameState', data)
        state = gs.get('state', gs)
        return state, gs
    return None, None
