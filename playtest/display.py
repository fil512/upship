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
        age_transition_bd = state_data.get('ageTransitionBlueprintDesign', {})
        if age_transition or age_transition_bd:
            print(f"\nAge Transition: {age_transition}")
            print(f"Age Transition Blueprint Design: {age_transition_bd}")

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
            print(f"\n=== Routes (Age {state.age}) ===\n")
            available_count = 0
            claimed_count = 0
            for route in state.routes:
                if route.available:
                    available_count += 1
                    status = "available"
                else:
                    claimed_count += 1
                    status = f"CLAIMED by {route.claimed_by or 'unknown'}"
                print(f"  {route.id}: {route.name} (dist={route.distance}, speed={route.speed_requirement}, income=+{route.income}) [{status}]")
            print(f"\nTotal: {len(state.routes)} routes ({available_count} available, {claimed_count} claimed)")

            # Also show available_routes if different
            if state.available_routes and len(state.available_routes) != available_count:
                print(f"\nNote: state.available_routes has {len(state.available_routes)} routes (filtered)")
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


# ============================================================
# SUPERUSER DEBUGGING COMMANDS
# These commands access the full game state via the superuser account
# to provide debugging information not available to normal players.
# ============================================================


def _get_raw_state_as_superuser(game_id: str) -> dict:
    """Get raw game state using superuser account.

    Args:
        game_id: The game ID.

    Returns:
        The raw state dictionary from the API.
    """
    client = get_client()
    login_superuser()
    raw_state = client._api_get(SUPERUSER, f"/api/state/{game_id}")

    # Extract the state data
    game_state_wrapper = raw_state.get('gameState', raw_state)
    state_data = game_state_wrapper.get('state', {})
    return state_data


def show_rdboard(game_id: str = None) -> None:
    """Show the R&D board state (available tech cards).

    This is a superuser-only command that shows the tech cards
    available for acquisition on the R&D board.

    Args:
        game_id: The game ID (uses current game if None).
    """
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    try:
        state_data = _get_raw_state_as_superuser(game_id)

        print("=== R&D Board (Tech Cards Available) ===\n")

        rd_board = state_data.get('rdBoard', [])
        if not rd_board:
            print("R&D Board is EMPTY!")
            print("\nThis may indicate a bug - check tech bag initialization.")
        else:
            print(f"Cards on R&D Board: {len(rd_board)}\n")
            for i, card in enumerate(rd_board):
                card_id = card.get('id', 'unknown')
                name = card.get('name', 'Unknown')
                age = card.get('age', '?')
                cost = card.get('cost', '?')
                slot_type = card.get('slotType', '?')
                claimed = card.get('claimed', False)
                claimed_by = card.get('claimedBy', None)

                status = f"[CLAIMED by {claimed_by[:8]}...]" if claimed else "[available]"
                print(f"  [{i}] {name} (id={card_id})")
                print(f"      Age {age}, Cost {cost} research, Type: {slot_type} {status}")

        # Show tech bag summary
        tech_bag = state_data.get('techBag', [])
        print(f"\nTech Bag: {len(tech_bag)} cards remaining")

        # Count by age
        if tech_bag:
            age_counts = {}
            for card in tech_bag:
                age = card.get('age', '?')
                age_counts[age] = age_counts.get(age, 0) + 1
            print(f"  By age: {age_counts}")

    except Exception as e:
        print(f"Error: {e}")


def show_techstate(game_id: str = None) -> None:
    """Show technology/progress state for debugging age transitions.

    This is a superuser-only command that shows:
    - Progress track position and thresholds
    - Tech bag contents
    - Technologies owned by each player

    Args:
        game_id: The game ID (uses current game if None).
    """
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    try:
        state_data = _get_raw_state_as_superuser(game_id)

        print("=== Technology & Progress State ===\n")

        # Progress track
        progress = state_data.get('progressTrack', 0)
        thresholds = state_data.get('progressThresholds', {})
        age = state_data.get('age', 1)
        age2_threshold = thresholds.get('age2', 8)
        age3_threshold = thresholds.get('age3', 16)
        end_threshold = thresholds.get('end', 24)

        print("=== Progress Track ===")
        print(f"  Current Progress: {progress}")
        print(f"  Age 2 Threshold: {age2_threshold} {'(PASSED)' if progress >= age2_threshold else ''}")
        print(f"  Age 3 Threshold: {age3_threshold} {'(PASSED)' if progress >= age3_threshold else ''}")
        print(f"  Game End: {end_threshold}")
        print(f"  Current Age: {age}")

        # Visual progress bar
        bar_length = 30
        progress_pct = min(progress / end_threshold, 1.0)
        filled = int(bar_length * progress_pct)
        bar = '█' * filled + '░' * (bar_length - filled)
        print(f"\n  [{bar}] {progress}/{end_threshold}")

        # Show markers for age transitions
        age2_pos = int(bar_length * age2_threshold / end_threshold)
        age3_pos = int(bar_length * age3_threshold / end_threshold)
        markers = [' '] * bar_length
        markers[age2_pos - 1] = '2'
        markers[age3_pos - 1] = '3'
        print(f"   {''.join(markers)}")

        # R&D Board summary
        rd_board = state_data.get('rdBoard', [])
        tech_bag = state_data.get('techBag', [])

        print(f"\n=== Tech Supply ===")
        print(f"  R&D Board: {len(rd_board)} cards")
        print(f"  Tech Bag: {len(tech_bag)} cards remaining")

        # Tech bag by age
        if tech_bag:
            age_counts = {}
            for card in tech_bag:
                card_age = card.get('age', '?')
                age_counts[card_age] = age_counts.get(card_age, 0) + 1
            print(f"  Bag by age: {age_counts}")

        # Player technologies
        players = state_data.get('players', {})
        print(f"\n=== Player Technologies ===")
        for pid, pdata in players.items():
            faction = pdata.get('faction', 'unknown').upper()
            tech_cards = pdata.get('techCards', [])
            technologies = pdata.get('technologies', [])
            research = pdata.get('research', 0)
            research_level = pdata.get('researchLevel', 0)

            # Use whichever is populated
            techs = tech_cards if tech_cards else technologies

            print(f"\n  {faction}:")
            print(f"    Research: {research} (level: {research_level})")
            print(f"    Technologies: {len(techs)}")
            for tech in techs[:5]:
                print(f"      - {tech}")
            if len(techs) > 5:
                print(f"      ... and {len(techs) - 5} more")

    except Exception as e:
        print(f"Error: {e}")


def show_players_debug(game_id: str = None) -> None:
    """Show detailed player information including bot status.

    This is a superuser-only command that shows:
    - Player IDs and usernames
    - Bot status (whether player is a server-side bot)
    - Faction, research, cash, income, etc.

    Args:
        game_id: The game ID (uses current game if None).
    """
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    try:
        client = get_client()
        login_superuser()
        data = client._api_get(SUPERUSER, f"/api/state/{game_id}/players-debug")

        print("=== Player Debug Info ===\n")
        print(f"Game ID: {game_id}")
        print(f"Phase: {data.get('phase')}")
        print(f"Bot Count: {data.get('botCount')}")

        print(f"\n{'Faction':<10} {'Username':<20} {'Bot?':<5} {'Research':>8} {'Cash':>6} {'Income':>7} {'Techs':>6}")
        print("=" * 75)

        for player in data.get('players', []):
            faction = (player.get('faction') or '?').upper()
            username = player.get('username', 'Unknown')[:20]
            is_bot = "YES" if player.get('isBot') else "no"
            research = player.get('researchLevel', 0)
            cash = player.get('cash', 0)
            income = player.get('income', 0)
            techs = player.get('techCards', 0)

            print(f"{faction:<10} {username:<20} {is_bot:<5} {research:>8} £{cash:>5} {income:>5}/t {techs:>6}")

        print("=" * 75)

        if data.get('botIds'):
            print(f"\nBot Player IDs:")
            for bid in data.get('botIds', []):
                print(f"  {bid}")

    except Exception as e:
        print(f"Error: {e}")


def show_gamelogs(game_id: str = None, filter_text: str = None, num_entries: int = 30) -> None:
    """Show game log entries with optional filtering.

    This is a superuser-only command that shows the in-game log
    entries, which can be filtered by text content.

    Args:
        game_id: The game ID (uses current game if None).
        filter_text: Optional text to filter log entries (case-insensitive).
        num_entries: Maximum number of entries to show (default 30).
    """
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    try:
        state_data = _get_raw_state_as_superuser(game_id)

        log = state_data.get('log', [])

        if filter_text:
            filter_lower = filter_text.lower()
            log = [entry for entry in log
                   if filter_lower in entry.get('message', '').lower()
                   or filter_lower in entry.get('type', '').lower()]
            print(f"=== Game Log (filtered: '{filter_text}', last {num_entries}) ===\n")
        else:
            print(f"=== Game Log (last {num_entries} entries) ===\n")

        if not log:
            print("No log entries found.")
            return

        # Show last N entries
        for entry in log[-num_entries:]:
            msg = entry.get('message', '')
            etype = entry.get('type', 'log')
            player_id = entry.get('playerId', '')
            timestamp = entry.get('timestamp', '')

            # Format timestamp if present (just show time part)
            time_str = ''
            if timestamp:
                try:
                    time_str = timestamp.split('T')[1][:8] + ' '
                except Exception:
                    pass

            # Format player ID (show short version)
            player_str = f"[{player_id[:8]}] " if player_id else ''

            print(f"  {time_str}[{etype}] {player_str}{msg}")

        print(f"\n  Total log entries: {len(state_data.get('log', []))}")

    except Exception as e:
        print(f"Error: {e}")


def show_blueprints(game_id: str = None) -> None:
    """Show blueprint tiles for all players.

    This is a superuser-only command that shows the installed tiles
    on each player's blueprint, along with their tech cards.

    Args:
        game_id: The game ID (uses current game if None).
    """
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    try:
        state_data = _get_raw_state_as_superuser(game_id)

        print("=== Player Blueprints ===\n")

        players = state_data.get('players', {})
        player_order = state_data.get('playerOrder', [])

        for player_id in player_order:
            player = players.get(player_id, {})
            faction = (player.get('faction') or '?').upper()
            tech_cards = player.get('techCards', [])
            blueprint = player.get('blueprint', {})

            print(f"  {faction}:")
            print(f"    Tech Cards ({len(tech_cards)}):")
            for tc in tech_cards:
                print(f"      - {tc}")

            print(f"    Blueprint Tiles:")
            for slot_type in ['frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots']:
                slots = blueprint.get(slot_type, [])
                slot_label = slot_type.replace('Slots', '').capitalize()
                installed = [s for s in slots if s]
                if installed:
                    print(f"      {slot_label}: {', '.join(installed)}")
                else:
                    print(f"      {slot_label}: (empty)")

            # Count total tiles
            total = sum(1 for st in ['frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots']
                        for s in blueprint.get(st, []) if s)
            print(f"    Total installed: {total} tiles")
            print()

    except Exception as e:
        print(f"Error: {e}")
