"""Display and output functions for playtest results."""

import json
import re
import urllib.error
from pathlib import Path

from .config import PLAYERS, PROJECT_ROOT, API_BASE
from .cli import run_cli, strip_ansi, get_game_id, get_session_cookie
from .logging import get_logger
from .state import get_player_ships


def show_status(game_id=None, player=None):
    """Show current game status."""
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    if player is None:
        player = "playtest_germany"

    output = run_cli(player, "state", game_id)
    print(output)


def show_sessions():
    """Show all playtest session info."""
    sessions_dir = PROJECT_ROOT / ".upship-sessions"
    print("=== Playtest Sessions ===\n")
    for session_file in sorted(sessions_dir.glob("playtest_*.json")):
        with open(session_file) as f:
            session = json.load(f)
            username = session.get("username", "unknown")
            user_id = session.get("userId", "unknown")
            print(f"{username}: {user_id[:8]}...")


def show_summary(game_id=None):
    """Show summary of all players' status."""
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    print("=== UP SHIP! Game Summary ===\n")

    output = strip_ansi(run_cli("playtest_germany", "state", game_id))
    for line in output.split('\n'):
        if 'Age' in line and 'Turn' in line:
            print(line.strip())
            break

    print("\n" + "=" * 60)
    print(f"{'Player':<12} {'Cash':>6} {'Income':>7} {'Ships':>6} {'H₂':>4} {'He':>4} {'Res':>4} {'Tech':>5}")
    print("=" * 60)

    for player in PLAYERS:
        output = strip_ansi(run_cli(player, "state", game_id))

        faction = player.replace('playtest_', '').upper()
        cash = income = ships = hydrogen = helium = research = tech = 0

        cash_match = re.search(r'Cash:\s*£(\d+)', output)
        if cash_match:
            cash = int(cash_match.group(1))

        income_match = re.search(r'Income:\s*(\d+)', output)
        if income_match:
            income = int(income_match.group(1))

        ships_match = re.search(r'Ships:\s*(\d+)', output)
        if ships_match:
            ships = int(ships_match.group(1))

        h2_match = re.search(r'H₂:(\d+)', output)
        if h2_match:
            hydrogen = int(h2_match.group(1))

        he_match = re.search(r'He:(\d+)', output)
        if he_match:
            helium = int(he_match.group(1))

        res_match = re.search(r'Research:\s*(\d+)', output)
        if res_match:
            research = int(res_match.group(1))

        tech_match = re.search(r'Technologies:\s*(\d+)', output)
        if tech_match:
            tech = int(tech_match.group(1))

        print(f"{faction:<12} £{cash:>5} {income:>5}/t {ships:>6} {hydrogen:>4} {helium:>4} {research:>4} {tech:>5}")

    print("=" * 60)

    print("\n=== Ships by Player ===")
    for player in PLAYERS:
        faction = player.replace('playtest_', '').upper()
        ships = get_player_ships(player, game_id)
        hangar = len(ships['hangar'])
        launched = len(ships['launched'])
        on_route = len(ships['on_route'])
        print(f"{faction}: Hangar={hangar}, Launched={launched}, On Route={on_route}")


def debug_state(game_id=None):
    """Fetch and display raw game state for debugging."""
    import urllib.request

    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    try:
        url = f"{API_BASE}/api/state/{game_id}"
        req = urllib.request.Request(url)
        cookie = get_session_cookie()
        if cookie:
            req.add_header("Cookie", cookie)
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())

        print("=== Raw Game State Debug ===\n")
        print(f"Game ID: {game_id}")

        gs = data.get('gameState', data)
        state = gs.get('state', gs)

        print(f"Phase: {gs.get('phase')}")
        print(f"Age: {gs.get('age')} | Turn: {state.get('turn', gs.get('turnNumber'))} | Round: {state.get('round')}")
        print(f"Current Player ID: {gs.get('currentPlayerId')}")
        print(f"Current Player Index: {state.get('currentPlayerIndex')}")

        wp = state.get('workerPlacement', {})
        print(f"Worker Placement: {wp}")
        print(f"Player Order: {state.get('playerOrder')}")

        players = state.get('players', {})
        print("\nPlayers (id -> faction):")
        for pid, pdata in players.items():
            faction = pdata.get('faction', 'unknown')
            agents = pdata.get('agentsRemaining', '?')
            passed = pdata.get('passed', False)
            print(f"  {pid[:8]}... -> {faction.upper()}: agents={agents}, passed={passed}")

        ground = state.get('groundBoard', {})
        placements = ground.get('placements', {})
        if placements:
            print("\nGround Board Placements:")
            for loc, info in placements.items():
                print(f"  {loc}: {info}")

        print("\nShips by player:")
        for pid, pdata in players.items():
            faction = pdata.get('faction', 'unknown')
            ships = pdata.get('ships', [])
            print(f"  {faction.upper()}: {len(ships)} ships")
            for ship in ships:
                print(f"    - {ship.get('id')}: status={ship.get('status')}")

        log = state.get('log', [])
        if log:
            print(f"\nGame Log (last 15 entries):")
            for entry in log[-15:]:
                msg = entry.get('message', '')
                etype = entry.get('type', '')
                print(f"  [{etype}] {msg}")

        order = state.get('playerOrder', [])
        wp_idx = state.get('workerPlacementIndex')
        if wp_idx is not None and order:
            current_pid = order[wp_idx % len(order)]
            current_faction = players.get(current_pid, {}).get('faction', 'unknown')
            print(f"\n>>> Current placer: {current_faction.upper()} (index {wp_idx})")

    except urllib.error.URLError as e:
        print(f"Error fetching state: {e}")
    except json.JSONDecodeError as e:
        print(f"Error parsing response: {e}")


def tail_log(num_lines=50):
    """Show the last N lines of the current playtest log file."""
    logger = get_logger()
    log_file = logger.load_log_file()
    if not log_file:
        print("No current log file. Run 'setup' first.")
        return

    if not log_file.exists():
        print(f"Log file not found: {log_file}")
        return

    print(f"=== Tail of {log_file.name} (last {num_lines} lines) ===\n")
    with open(log_file, 'r') as f:
        lines = f.readlines()
        for line in lines[-num_lines:]:
            print(line.rstrip())


def show_claude_output(num_lines=100):
    """Show the last N lines from Claude's background task output files."""
    project_path = str(Path.cwd()).replace('/', '-')
    tasks_dir = Path(f"/tmp/claude/{project_path}/tasks")

    if not tasks_dir.exists():
        print(f"No Claude tasks directory found at: {tasks_dir}")
        return

    output_files = sorted(tasks_dir.glob("*.output"), key=lambda p: p.stat().st_mtime, reverse=True)

    if not output_files:
        print(f"No output files found in: {tasks_dir}")
        return

    most_recent = output_files[0]
    print(f"=== Claude Task Output: {most_recent.name} (last {num_lines} lines) ===\n")

    with open(most_recent, 'r') as f:
        lines = f.readlines()
        for line in lines[-num_lines:]:
            print(line.rstrip())


def show_routes():
    """Show available routes."""
    game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    print("\nRoutes are defined in the map. Use 'claim <player> <shipId> <routeId>' to claim.")
    print("Route IDs: route_1 through route_8")
    print("\nAge I Routes:")
    print("  route_1: Frankfurt → Berlin (distance 1, speed 1, income +2)")
    print("  route_2: Frankfurt → Paris (distance 2, speed 1, income +3)")
    print("  route_3: Berlin → Copenhagen (distance 2, speed 1, income +3)")
    print("  route_4: Paris → London (distance 2, speed 2, income +4)")
    print("  route_5: London → Amsterdam (distance 1, speed 1, income +2)")
    print("  route_6: Amsterdam → Berlin (distance 2, speed 1, income +3)")
    print("  route_7: Paris → Rome (distance 3, speed 2, income +5)")
    print("  route_8: Rome → Vienna (distance 2, speed 1, income +3)")
