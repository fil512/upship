"""Display and output functions for playtest results.

This module provides formatted output for game state, player status,
and debugging information.
"""

import json
from pathlib import Path

from client import list_sessions as client_list_sessions

from .config import PLAYERS, PROJECT_ROOT
from .client import get_client, get_game_id, get_faction_from_player, login_superuser
from .config import SUPERUSER
from .logging import get_logger
from .state import get_state, get_player_data, get_player_ships, get_player_id, get_ship_details


def show_status(game_id: str = None, player: str = None) -> None:
    """Show current game status for a player.

    Args:
        game_id: The game ID (uses current game if None).
        player: The player username (defaults to playtest_germany).
    """
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    if player is None:
        player = "playtest_germany"

    state = get_state(game_id, player)
    if not state:
        print(f"Could not get state for game {game_id}")
        return

    player_data = get_player_data(player, game_id)

    print(f"\n=== UP SHIP! Game Status ===")
    print(f"Game ID: {game_id}")
    print(f"Age: {state.age} | Round: {state.round}")
    print(f"Phase: {state.phase}")
    print(f"Progress Track: {state.progress_track}")

    if player_data:
        faction = (player_data.faction or 'unknown').upper()
        print(f"\n--- {faction} ({player}) ---")
        print(f"Cash: £{player_data.cash}")
        print(f"Income: {player_data.income}/turn")
        print(f"Officers: {player_data.officers} (income: {player_data.officer_income})")
        print(f"Engineers: {player_data.engineers} (income: {player_data.engineer_income})")
        print(f"Agents Remaining: {player_data.agents_remaining}")
        print(f"Research: {player_data.research} (level: {player_data.research_level})")

        gas = player_data.gas_cubes or {}
        print(f"Gas: H₂:{gas.get('hydrogen', 0)} He:{gas.get('helium', 0)}")

        print(f"\nShips ({len(player_data.ships or [])}):")
        for ship in (player_data.ships or []):
            # Calculate stats from blueprint (ships don't store their own stats)
            stats = get_ship_details(ship, player_data)
            print(f"  - {ship.id}: {ship.status} (range:{stats['range']}, speed:{stats['speed']})")

        print(f"\nTechnologies ({len(player_data.technologies or [])}):")
        for tech in (player_data.technologies or [])[:5]:
            print(f"  - {tech}")
        if len(player_data.technologies or []) > 5:
            print(f"  ... and {len(player_data.technologies) - 5} more")

        print(f"\nHand ({len(player_data.hand or [])} cards):")
        for i, card in enumerate(player_data.hand or []):
            print(f"  [{i}] {card.name} ({card.symbol})")


def show_sessions() -> None:
    """Show all playtest session info."""
    print("=== Playtest Sessions ===\n")

    sessions = client_list_sessions()
    for session in sessions:
        if session.username.startswith('playtest_'):
            print(f"{session.username}: {session.user_id[:8]}...")


def show_summary(game_id: str = None) -> None:
    """Show summary of all players' status.

    Args:
        game_id: The game ID (uses current game if None).
    """
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    state = get_state(game_id)
    if not state:
        print(f"Could not get state for game {game_id}")
        return

    print("=== UP SHIP! Game Summary ===\n")
    print(f"Age: {state.age} | Round: {state.round} | Phase: {state.phase}")

    print("\n" + "=" * 60)
    print(f"{'Player':<12} {'Cash':>6} {'Income':>7} {'Ships':>6} {'H₂':>4} {'He':>4} {'Res':>4} {'Tech':>5}")
    print("=" * 60)

    # Use actual players from game state, not hardcoded PLAYERS list
    for player_id in state.player_order:
        player_data = state.get_player(player_id)
        if not player_data:
            continue

        faction = (player_data.faction or 'unknown').upper()
        cash = player_data.cash or 0
        income = player_data.income or 0
        ships = len(player_data.ships or [])
        gas = player_data.gas_cubes or {}
        hydrogen = gas.get('hydrogen', 0)
        helium = gas.get('helium', 0)
        research = player_data.research or 0
        tech = len(player_data.technologies or [])

        print(f"{faction:<12} £{cash:>5} {income:>5}/t {ships:>6} {hydrogen:>4} {helium:>4} {research:>4} {tech:>5}")

    print("=" * 60)

    print("\n=== Ships by Player ===")
    for player_id in state.player_order:
        player_data = state.get_player(player_id)
        if not player_data:
            continue
        faction = (player_data.faction or 'unknown').upper()
        ships = player_data.ships or []
        hangar = len([s for s in ships if s.status == 'hangar'])
        launched = len([s for s in ships if s.status == 'launched'])
        on_route = len([s for s in ships if s.status == 'on_route'])
        print(f"{faction}: Hangar={hangar}, Launched={launched}, On Route={on_route}")


def debug_state(game_id: str = None) -> None:
    """Fetch and display raw game state for debugging.

    Args:
        game_id: The game ID (uses current game if None).
    """
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    client = get_client()

    # Try playtest_germany first, fall back to superuser if not a player
    user_to_use = "playtest_germany"
    try:
        raw_state = client._api_get("playtest_germany", f"/api/state/{game_id}")
    except Exception as e:
        if "Not a player" in str(e) or "not a player" in str(e).lower():
            print("Not a playtest game - using superuser...")
            login_superuser()
            user_to_use = SUPERUSER
            raw_state = client._api_get(SUPERUSER, f"/api/state/{game_id}")
        else:
            raise

    try:

        print("=== Raw Game State Debug ===\n")
        print(f"Game ID: {game_id}")

        # API returns { gameState: { phase, age, state: { players, ... } } }
        game_state_wrapper = raw_state.get('gameState', raw_state)
        state_data = game_state_wrapper.get('state', {})

        # Phase/age may be at wrapper level or in state
        phase = game_state_wrapper.get('phase') or state_data.get('phase')
        age = game_state_wrapper.get('age') or state_data.get('age')
        turn = game_state_wrapper.get('turnNumber') or state_data.get('turn')
        print(f"Phase: {phase}")
        print(f"Age: {age} | Turn: {turn} | Round: {state_data.get('round')}")
        print(f"Current Player Index: {state_data.get('currentPlayerIndex')}")

        # Progress Track info
        progress_track = state_data.get('progressTrack', 'NOT SET')
        progress_thresholds = state_data.get('progressThresholds', 'NOT SET')
        print(f"\nProgress Track: {progress_track}")
        print(f"Progress Thresholds: {progress_thresholds}")

        wp = state_data.get('workerPlacement', {})
        print(f"Worker Placement: {wp}")
        print(f"Player Order: {state_data.get('playerOrder')}")

        # Age transition state (if present)
        age_transition = state_data.get('ageTransition', {})
        age_transition_db = state_data.get('ageTransitionDesignBureau', {})
        if age_transition or age_transition_db:
            print(f"\nAge Transition: {age_transition}")
            print(f"Age Transition Design Bureau: {age_transition_db}")

        players = state_data.get('players', {})
        print("\nPlayers (id -> faction):")
        for pid, pdata in players.items():
            faction = pdata.get('faction', 'unknown')
            agents = pdata.get('agentsRemaining', '?')
            passed = pdata.get('hasPassed', False)
            print(f"  {pid[:8]}... -> {faction.upper()}: agents={agents}, passed={passed}")

        ground = state_data.get('groundBoard', {})
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

        log = state_data.get('log', [])
        if log:
            print(f"\nGame Log (last 15 entries):")
            for entry in log[-15:]:
                msg = entry.get('message', '')
                etype = entry.get('type', '')
                print(f"  [{etype}] {msg}")

    except Exception as e:
        print(f"Error fetching state: {e}")


def tail_log(num_lines: int = 50) -> None:
    """Show the last N lines of the current playtest log file.

    Args:
        num_lines: Number of lines to display.
    """
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


def show_claude_output(num_lines: int = 100) -> None:
    """Show the last N lines from Claude's background task output files.

    Args:
        num_lines: Number of lines to display.
    """
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


def show_routes(game_id: str = None) -> None:
    """Show available routes.

    Args:
        game_id: The game ID (uses current game if None).
    """
    if game_id is None:
        game_id = get_game_id()

    if not game_id:
        print("No current game. Run 'setup' first.")
        print("\nStatic route information:")
    else:
        state = get_state(game_id)
        if state and state.routes:
            print("\n=== Available Routes ===\n")
            for route in state.routes:
                status = "CLAIMED" if not route.available else "available"
                print(f"  {route.id}: {route.name} (dist={route.distance}, speed={route.speed_requirement}, income=+{route.income}) [{status}]")
            return

    # Fallback to static info
    print("\nRoutes are defined in the map. Use 'launch <player> <shipId> <routeId>' to claim.")
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
