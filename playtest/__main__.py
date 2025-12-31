"""Main entry point for the playtest package.

Usage:
    python -m playtest setup                 # Create new 4-player game
    python -m playtest autoplay [num_turns]  # Run AI until game ends
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
"""

import sys
from datetime import datetime

from .config import PLAYERS, FACTIONS, API_BASE, USE_LOCAL
from .client import get_client, get_game_id, save_game_id, login_all_players
from .logging import get_logger
from .state import get_state, get_phase, get_player_id
from .autoplay import autoplay
from .display import (
    show_status, show_summary, show_sessions, show_routes,
    debug_state, tail_log, show_claude_output
)


def setup_game() -> str:
    """Create a new 4-player game.

    Returns:
        The game ID.
    """
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
        elif command_lower == 'pass':
            result = client.pass_turn(player, game_id)
        elif command_lower == 'reveal':
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

    elif cmd == "autoplay":
        if len(sys.argv) > 2:
            num_turns = int(sys.argv[2])
        else:
            num_turns = None
        autoplay(num_turns)

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

    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)


if __name__ == "__main__":
    main()
