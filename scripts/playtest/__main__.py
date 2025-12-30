"""Main entry point for the playtest package."""

import sys
from datetime import datetime

from .config import PLAYERS, FACTIONS, API_BASE, USE_LOCAL
from .cli import (
    run_cli, strip_ansi, get_game_id, save_game_id,
    extract_game_id, login_all_players
)
from .logging import get_logger
from .state import get_phase
from .autoplay import autoplay
from .display import (
    show_status, show_summary, show_sessions, show_routes,
    debug_state, tail_log, show_claude_output
)


def setup_game(game_name=None):
    """Create a new 4-player game."""
    if game_name is None:
        game_name = f"Playtest_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    print("=== UP SHIP! Playtest Setup ===")
    print(f"Server: {API_BASE} {'(LOCAL)' if USE_LOCAL else '(PRODUCTION)'}\n")

    login_all_players()

    print(f"\n>>> Creating game: {game_name}")
    output = run_cli("playtest_germany", "create", game_name)
    game_id = extract_game_id(output)

    if not game_id:
        print("ERROR: Could not extract game ID")
        sys.exit(1)

    print(f"Game ID: {game_id}")

    print("\n>>> Joining other players...")
    for player in PLAYERS[1:]:
        output = strip_ansi(run_cli(player, "join", game_id))
        status = "✓" if "✓" in output else "✗"
        print(f"  {player}: {status}")

    print("\n>>> Selecting factions...")
    for player, faction in zip(PLAYERS, FACTIONS):
        output = strip_ansi(run_cli(player, "faction", game_id, faction))
        status = "✓" if "✓" in output else "✗"
        print(f"  {player} -> {faction}: {status}")

    print("\n>>> Starting game...")
    output = strip_ansi(run_cli("playtest_germany", "start", game_id))
    if "✓" in output:
        print("Game started!")
    else:
        print(f"Start failed: {output}")

    save_game_id(game_id)

    logger = get_logger()
    logger.init_log_file(game_id, game_name)
    logger.log_action(None, "Game created and started", "setup")

    print(f"\n{'='*45}")
    print("Playtest ready!")
    print(f"Game ID: {game_id}")
    print(f"{'='*45}")

    return game_id


def end_phase(game_id=None):
    """Have all players end their turn or pass depending on phase."""
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    phase = get_phase(game_id)
    print(f">>> Current phase: {phase}")

    if phase == "WORKER_PLACEMENT":
        print(">>> All players revealing (atomic pass + acquisitions)...")
        for player in PLAYERS:
            output = strip_ansi(run_cli(player, "reveal", game_id))
            if "✓" in output or "passed" in output.lower() or "reveal" in output.lower():
                print(f"  {player}: revealed")
    else:
        print(">>> All players ending turn...")
        for player in PLAYERS:
            output = strip_ansi(run_cli(player, "endturn", game_id))
            if "✓" in output:
                print(f"  {player}: done")


def run_action(player, command, *args, game_id=None):
    """Run a single action for a player."""
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    parts = command.split()
    if len(parts) > 1:
        command = parts[0]
        args = tuple(parts[1:]) + args

    output = run_cli(player, command, game_id, *args)
    print(output)


def launch_ship(player, ship_id, route_id, gas_type="hydrogen"):
    """Launch a ship to claim a route."""
    game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return
    output = run_cli(player, "launch", game_id, ship_id, route_id, gas_type)
    print(output)


def main():
    """Main entry point for the playtest CLI."""
    if len(sys.argv) < 2:
        print(__doc__)
        return

    cmd = sys.argv[1].lower()

    if cmd == "setup":
        game_name = sys.argv[2] if len(sys.argv) > 2 else None
        setup_game(game_name)

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
            print("Usage: playtest.py action <player> <command> [args...]")
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
            print("Usage: playtest.py launch <player> <shipId> <routeId> [gasType]")
            return
        player = sys.argv[2]
        ship_id = sys.argv[3]
        route_id = sys.argv[4]
        gas_type = sys.argv[5] if len(sys.argv) > 5 else "hydrogen"
        launch_ship(player, ship_id, route_id, gas_type)

    elif cmd == "claim":
        print("Note: Route claiming is now part of the launch action.")
        print("Usage: playtest.py launch <player> <shipId> <routeId> [gasType]")

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
