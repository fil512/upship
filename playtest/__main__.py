"""Main entry point for the playtest package.

Usage:
    python -m playtest setup                 # Create new 4-player game (all AI)
    python -m playtest setup-interactive     # Create game for human (kenny) + 3 AI
    python -m playtest start                 # Start the current game (host action)
    python -m playtest autoplay [num_turns]  # Run AI until game ends
    python -m playtest autoplay-until <faction>  # Run AI until faction's turn
    python -m playtest autoturn <faction>    # Play one turn for faction
    python -m playtest whose-turn            # Show whose turn it is
    python -m playtest status [player]       # Show game status
    python -m playtest summary               # Show all players' summary
    python -m playtest endphase              # All players end turn/pass
    python -m playtest action <player> <cmd> # Run single action
    python -m playtest launch <player> <ship> <route> [gas]  # Launch ship
    python -m playtest routes                # Show available routes
    python -m playtest debug                 # Show raw game state
    python -m playtest sessions              # List active sessions
    python -m playtest gameid                # Print current game ID
    python -m playtest tail [num_lines]      # Show playtest log tail
    python -m playtest output [num_lines]    # Show Claude task output
    python -m playtest healthcheck [timeout] # Wait for server to be healthy
    python -m playtest reset                 # Drop all game data (dev only)
"""

import sys
import time
from datetime import datetime

import requests

from .config import PLAYERS, FACTIONS, API_BASE, FRONTEND_URL, USE_LOCAL, PASSWORD, set_human_faction, clear_human_faction
from .client import get_client, get_game_id, save_game_id, login_all_players
from .logging import get_logger
from .state import get_state, get_phase, get_player_id
from .autoplay import autoplay, autoplay_until, autoturn, get_current_turn_faction
from .display import (
    show_status, show_summary, show_sessions, show_routes,
    debug_state, tail_log, show_claude_output
)


def setup_game() -> str:
    """Create a new 4-player game.

    Returns:
        The game ID.
    """
    # Clear any human faction setting from previous interactive games
    clear_human_faction()

    client = get_client()
    game_name = f"Playtest_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    print("=== UP SHIP! Playtest Setup ===")
    print(f"Server: {API_BASE} {'(LOCAL)' if USE_LOCAL else '(PRODUCTION)'}\n")

    login_all_players()

    print(f"\n>>> Creating game: {game_name}")
    game = client.create_game("playtest_germany", game_name)
    game_id = game.id

    if not game_id:
        print("ERROR: Could not create game")
        sys.exit(1)

    print(f"Game ID: {game_id}")

    print("\n>>> Joining other players...")
    for player in PLAYERS[1:]:
        try:
            client.join_game(player, game_id)
            print(f"  {player}: ✓")
        except Exception as e:
            print(f"  {player}: ✗ ({e})")

    print("\n>>> Selecting factions...")
    for player, faction in zip(PLAYERS, FACTIONS):
        try:
            client.select_faction(player, game_id, faction)
            print(f"  {player} -> {faction}: ✓")
        except Exception as e:
            print(f"  {player} -> {faction}: ✗ ({e})")

    print("\n>>> Starting game...")
    try:
        client.start_game("playtest_germany", game_id)
        print("Game started!")
    except Exception as e:
        print(f"Start failed: {e}")

    save_game_id(game_id)

    logger = get_logger()
    logger.init_log_file(game_id)
    logger.log_action(None, "Game created and started", "setup")

    print(f"\n{'='*45}")
    print("Playtest ready!")
    print(f"Game ID: {game_id}")
    print(f"{'='*45}")

    return game_id


def setup_interactive_game() -> str:
    """Create a game for human player (kenny) + 3 AI players.

    This sets up a "Play With Me" game where:
    - Germany, USA, Italy are controlled by AI (playtest_* accounts)
    - Britain is reserved for the human player (kenny)

    The function waits for kenny to join and select Britain before starting.

    Returns:
        The game ID.
    """
    client = get_client()
    game_name = f"Play With Kenny - {datetime.now().strftime('%Y%m%d_%H%M%S')}"

    # AI players and their factions (Britain reserved for kenny)
    ai_players = ["playtest_germany", "playtest_usa", "playtest_italy"]
    ai_factions = ["germany", "usa", "italy"]
    human_player = "kenny"
    human_faction = "britain"

    # Mark Britain as human-controlled for autoplay to skip
    set_human_faction(human_faction)

    print("=== UP SHIP! Interactive Game Setup ===")
    print(f"Server: {API_BASE} {'(LOCAL)' if USE_LOCAL else '(PRODUCTION)'}")
    print(f"Human player: {human_player} -> {human_faction}")
    print(f"AI players: {', '.join(ai_players)}\n")

    # Login AI players
    print(">>> Logging in AI players...")
    for player in ai_players:
        try:
            client.login(player, PASSWORD)
            print(f"  {player}: logged in")
        except Exception:
            try:
                client.register(player, PASSWORD)
                print(f"  {player}: registered")
            except Exception as e:
                print(f"  {player}: WARNING - {e}")

    # Create game as Germany (host)
    print(f"\n>>> Creating game: {game_name}")
    game = client.create_game("playtest_germany", game_name)
    game_id = game.id

    if not game_id:
        print("ERROR: Could not create game")
        sys.exit(1)

    print(f"Game ID: {game_id}")

    # Join other AI players
    print("\n>>> Joining AI players...")
    for player in ai_players[1:]:  # Skip Germany (host)
        try:
            client.join_game(player, game_id)
            print(f"  {player}: joined")
        except Exception as e:
            print(f"  {player}: ✗ ({e})")

    # Select factions for AI players
    print("\n>>> AI players selecting factions...")
    for player, faction in zip(ai_players, ai_factions):
        try:
            client.select_faction(player, game_id, faction)
            print(f"  {player} -> {faction}: ✓")
        except Exception as e:
            print(f"  {player} -> {faction}: ✗ ({e})")

    save_game_id(game_id)

    # Wait for human player
    print(f"\n{'='*50}")
    print(f"WAITING FOR {human_player.upper()} TO JOIN")
    print(f"{'='*50}")
    print(f"\nGame URL: {FRONTEND_URL}/")
    print(f"Game ID: {game_id}")
    print(f"\nInstructions for {human_player}:")
    print(f"  1. Open {FRONTEND_URL}/ in your browser")
    print(f"  2. Login as '{human_player}'")
    print(f"  3. Click 'Open Games' and join '{game_name}'")
    print(f"  4. Select '{human_faction.upper()}' as your faction")
    print(f"\nPolling for {human_player} to join...")

    # Poll until kenny joins and selects Britain (fast polling, short timeout)
    max_wait = 60  # 1 minute max
    poll_interval = 1  # Fast polling
    waited = 0
    human_ready = False

    while waited < max_wait:
        try:
            # Check the game list to see if the 4th player (Britain) has joined
            games = client.list_games("playtest_germany", "mine")
            for game in games:
                if game.id == game_id:
                    # Check if game has 4 players
                    players = game.players or []
                    if len(players) >= 4:
                        # Check if one of them has Britain faction
                        for p in players:
                            faction = p.get('faction') if isinstance(p, dict) else None
                            if faction == human_faction:
                                human_ready = True
                                break
                    break

            if human_ready:
                print(f"\n✓ {human_player} has joined and selected {human_faction}!")
                break

        except Exception as e:
            pass  # Silently retry

        time.sleep(poll_interval)
        waited += poll_interval
        if waited % 10 == 0:
            print(f"  Waiting for {human_player}... ({waited}s)")

    if not human_ready:
        print(f"\n✗ Timeout waiting for {human_player} (60s)")
        print(f"\nTo start the game manually after joining:")
        print(f"  python -m playtest start")
        return game_id

    # Start the game
    print("\n>>> Starting game...")
    try:
        client.start_game("playtest_germany", game_id)
        print("Game started!")
    except Exception as e:
        print(f"Start failed: {e}")
        return game_id

    logger = get_logger()
    logger.init_log_file(game_id)
    logger.log_action(None, f"Interactive game created - human player: {human_player}", "setup")

    print(f"\n{'='*50}")
    print("GAME READY!")
    print(f"{'='*50}")
    print(f"Game ID: {game_id}")
    print(f"Human: {human_player} -> {human_faction}")
    print(f"AI: Germany, USA, Italy (controlled by Claude)")
    print(f"\n{human_player}: Take your turn in the browser!")

    return game_id


def end_phase(game_id: str = None) -> None:
    """Have all players end their turn or pass depending on phase.

    Args:
        game_id: The game ID (uses current game if None).
    """
    client = get_client()

    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    phase = get_phase(game_id)
    print(f">>> Current phase: {phase}")

    if phase == "WORKER_PLACEMENT":
        print(">>> All players revealing...")
        for player in PLAYERS:
            try:
                client.reveal(player, game_id)
                print(f"  {player}: revealed")
            except Exception as e:
                print(f"  {player}: error ({e})")
    else:
        print(">>> All players ending turn...")
        for player in PLAYERS:
            try:
                client.end_turn(player, game_id)
                print(f"  {player}: done")
            except Exception:
                pass


def run_action(player: str, command: str, *args, game_id: str = None) -> None:
    """Run a single action for a player.

    Args:
        player: The player username.
        command: The command/action to run.
        args: Additional arguments.
        game_id: The game ID (uses current game if None).
    """
    client = get_client()

    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    # Parse command and args
    parts = command.split()
    if len(parts) > 1:
        command = parts[0]
        args = tuple(parts[1:]) + args

    # Map common commands to actions
    command_lower = command.lower()

    try:
        if command_lower == 'endturn':
            result = client.end_turn(player, game_id)
        elif command_lower in ('pass', 'reveal'):
            # 'pass' is an alias for 'reveal' - exits worker placement
            result = client.reveal(player, game_id)
        elif command_lower == 'nolaunches':
            result = client.no_more_launches(player, game_id)
        else:
            # Try as generic action
            action_type = command.upper()
            kwargs = {}
            for arg in args:
                if '=' in arg:
                    key, value = arg.split('=', 1)
                    # Try to parse as int or bool
                    if value.lower() in ('true', 'false'):
                        kwargs[key] = value.lower() == 'true'
                    else:
                        try:
                            kwargs[key] = int(value)
                        except ValueError:
                            kwargs[key] = value
            result = client.action(player, game_id, action_type, **kwargs)

        if result.success:
            print(f"✓ Action successful")
            if result.game_state:
                print(f"  Phase: {result.game_state.phase}")
        else:
            print(f"✗ Action failed: {result.error}")

    except Exception as e:
        print(f"Error: {e}")


def healthcheck(timeout: int = 30) -> bool:
    """Wait for the server to be healthy.

    Args:
        timeout: Maximum seconds to wait.

    Returns:
        True if server is healthy, False if timeout.
    """
    url = f"{API_BASE}/health"
    print(f"Waiting for server at {API_BASE}...")

    for i in range(timeout):
        try:
            resp = requests.get(url, timeout=2)
            if resp.status_code == 200:
                print(f"Server healthy after {i + 1}s")
                return True
        except requests.exceptions.RequestException:
            pass
        time.sleep(1)
        if (i + 1) % 5 == 0:
            print(f"  Still waiting... ({i + 1}s)")

    print(f"Server not healthy after {timeout}s")
    return False


def reset_games() -> bool:
    """Drop all game data from the database (dev/test only).

    Returns:
        True if successful, False otherwise.
    """
    url = f"{API_BASE}/api/admin/games"
    print(f"Resetting all game data on {API_BASE}...")

    try:
        resp = requests.delete(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            print("✓ All game data has been deleted")
            if 'deleted' in data:
                d = data['deleted']
                print(f"  Games: {d.get('games', 0)}, States: {d.get('states', 0)}, Actions: {d.get('actions', 0)}")
            return True
        elif resp.status_code == 403:
            print("✗ Reset not allowed in production environment")
            return False
        else:
            print(f"✗ Failed: HTTP {resp.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"✗ Request failed: {e}")
        return False


def launch_ship(player: str, ship_id: str, route_id: str, gas_type: str = "hydrogen") -> None:
    """Launch a ship to claim a route.

    Args:
        player: The player username.
        ship_id: The ship ID.
        route_id: The route ID.
        gas_type: The gas type ('hydrogen' or 'helium').
    """
    client = get_client()

    game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    try:
        result = client.launch_ship(player, game_id, ship_id, route_id, gas_type)
        if result.success:
            print(f"✓ Ship {ship_id} launched to {route_id}")
        else:
            print(f"✗ Launch failed: {result.error}")
    except Exception as e:
        print(f"Error: {e}")


def main():
    """Main entry point for the playtest CLI."""
    if len(sys.argv) < 2:
        print(__doc__)
        return

    cmd = sys.argv[1].lower()

    if cmd == "setup":
        setup_game()

    elif cmd == "setup-interactive" or cmd == "play-with-me":
        setup_interactive_game()

    elif cmd == "start":
        # Start the current game (useful after setup-interactive times out)
        game_id = get_game_id()
        if not game_id:
            print("No current game. Run 'setup' or 'setup-interactive' first.")
            return
        client = get_client()
        try:
            client.start_game("playtest_germany", game_id)
            print(f"✓ Game started: {game_id}")
        except Exception as e:
            print(f"✗ Failed to start game: {e}")

    elif cmd == "autoplay":
        if len(sys.argv) > 2:
            num_turns = int(sys.argv[2])
        else:
            num_turns = None
        autoplay(num_turns)

    elif cmd == "autoplay-until":
        if len(sys.argv) < 3:
            print("Usage: playtest autoplay-until <faction>")
            print("  faction: germany, britain, usa, italy")
            return
        target_faction = sys.argv[2]
        autoplay_until(target_faction)

    elif cmd == "autoturn":
        if len(sys.argv) < 3:
            print("Usage: playtest autoturn <faction>")
            print("  faction: germany, britain, usa, italy")
            return
        faction = sys.argv[2]
        autoturn(faction)

    elif cmd == "whose-turn" or cmd == "turn":
        game_id = get_game_id()
        if not game_id:
            print("No current game. Run 'setup' first.")
            return

        # First check if game has started by getting game info
        client = get_client()
        try:
            # Use any logged-in player to get game info
            for player in PLAYERS:
                try:
                    game_info = client.get_game_info(player, game_id)
                    break
                except Exception:
                    continue
            else:
                print("Could not get game info (no logged-in players)")
                return

            if game_info.status == 'waiting':
                print("=== Game Not Started Yet ===")
                print(f"Game: {game_info.name}")
                print(f"Status: WAITING for players\n")
                print("Players joined:")
                for p in game_info.players:
                    username = p.get('username', 'Unknown')
                    faction = p.get('faction', 'no faction')
                    print(f"  {username}: {faction if faction else 'no faction selected'}")
                print(f"\nTotal: {len(game_info.players)}/4 players")
                return
        except Exception as e:
            # Fall through to normal handling if we can't get game info
            pass

        faction = get_current_turn_faction(game_id)
        phase = get_phase(game_id)
        if faction:
            print(f"Current turn: {faction.upper()}")
            print(f"Phase: {phase}")
        else:
            print(f"Could not determine whose turn it is")
            print(f"Phase: {phase}")

    elif cmd == "status":
        player = sys.argv[2] if len(sys.argv) > 2 else None
        show_status(player=player)

    elif cmd == "endphase":
        end_phase()

    elif cmd == "action":
        if len(sys.argv) < 4:
            print("Usage: playtest action <player> <command> [args...]")
            return
        player = sys.argv[2]
        command = sys.argv[3]
        args = sys.argv[4:]
        run_action(player, command, *args)

    elif cmd == "gameid":
        game_id = get_game_id()
        if game_id:
            print(game_id)
        else:
            print("No current game")

    elif cmd == "launch":
        if len(sys.argv) < 5:
            print("Usage: playtest launch <player> <shipId> <routeId> [gasType]")
            return
        player = sys.argv[2]
        ship_id = sys.argv[3]
        route_id = sys.argv[4]
        gas_type = sys.argv[5] if len(sys.argv) > 5 else "hydrogen"
        launch_ship(player, ship_id, route_id, gas_type)

    elif cmd == "claim":
        print("Note: Route claiming is now part of the launch action.")
        print("Usage: playtest launch <player> <shipId> <routeId> [gasType]")

    elif cmd == "routes":
        show_routes()

    elif cmd == "debug":
        debug_state()

    elif cmd == "sessions":
        show_sessions()

    elif cmd == "summary":
        show_summary()

    elif cmd == "tail":
        num_lines = int(sys.argv[2]) if len(sys.argv) > 2 else 50
        tail_log(num_lines)

    elif cmd == "output":
        num_lines = int(sys.argv[2]) if len(sys.argv) > 2 else 100
        show_claude_output(num_lines)

    elif cmd == "healthcheck":
        timeout = int(sys.argv[2]) if len(sys.argv) > 2 else 30
        success = healthcheck(timeout)
        sys.exit(0 if success else 1)

    elif cmd == "reset":
        success = reset_games()
        sys.exit(0 if success else 1)

    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)


if __name__ == "__main__":
    main()
