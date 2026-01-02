"""Game state accessor functions using typed objects from the client library.

This module provides helper functions for accessing game state data.
Unlike the old implementation that parsed CLI text output, these functions
work directly with typed dataclasses from the client library.
"""

import json
import math
from typing import Any

from client import GameState, Player, Ship, Blueprint, Route, Card, CombatMission

from .config import PLAYERS
from .client import get_client, get_game_id, get_player_user_id, get_faction_from_player, get_manifest


def get_state(game_id: str, player: str = "playtest_germany") -> GameState | None:
    """Fetch the current game state.

    Args:
        game_id: The game ID.
        player: The player to authenticate as.

    Returns:
        GameState object or None on error.
    """
    try:
        client = get_client()
        return client.get_state(player, game_id)
    except Exception as e:
        print(f"Error getting state: {e}")
        return None


def get_phase(game_id: str) -> str:
    """Get current game phase.

    Args:
        game_id: The game ID.

    Returns:
        Phase name in uppercase format (e.g., 'WORKER_PLACEMENT', 'REVEAL', 'INCOME_CLEANUP')
    """
    state = get_state(game_id)
    if state:
        phase = state.phase or 'unknown'
        return phase.upper().replace(' ', '_')
    return "UNKNOWN"


def get_age(game_id: str) -> int:
    """Get current game age (1, 2, or 3).

    Args:
        game_id: The game ID.

    Returns:
        The current age (defaults to 1 if state unavailable).
    """
    state = get_state(game_id)
    return state.age if state else 1


def get_gas_preference(player: str, game_id: str = None) -> str:
    """Return preferred gas type for player.

    USA prefers helium (if they have the tech), others prefer hydrogen.
    Falls back to the other type if preferred is unavailable.
    Note: Only players with 'helium_handling' tech can use helium.

    Args:
        player: The player username.
        game_id: Optional game ID to check actual gas availability.

    Returns:
        'hydrogen' or 'helium'
    """
    preferred = "helium" if player == "playtest_usa" else "hydrogen"

    if game_id:
        state = get_state(game_id, player)
        if state:
            user_id = get_player_user_id(player)
            player_data = state.get_player(user_id)
            if player_data:
                gas = player_data.gas_cubes
                techs = player_data.technologies or []
                has_helium_tech = 'helium_handling' in techs

                # Can only use helium if player has the tech
                if preferred == "helium":
                    if not has_helium_tech or gas.get('helium', 0) == 0:
                        return "hydrogen"
                elif preferred == "hydrogen":
                    # Only fall back to helium if player has the tech AND hydrogen
                    if gas.get('hydrogen', 0) == 0:
                        if has_helium_tech and gas.get('helium', 0) > 0:
                            return "helium"
                        # No hydrogen and can't use helium - still return hydrogen
                        # (will fail validation, but that's expected)

    return preferred


def get_player_data(player: str, game_id: str) -> Player | None:
    """Get player data from game state.

    Args:
        player: The player username.
        game_id: The game ID.

    Returns:
        Player object or None.
    """
    state = get_state(game_id, player)
    if state:
        user_id = get_player_user_id(player)
        if user_id:
            return state.get_player(user_id)
    return None


def get_player_ships(player: str, game_id: str) -> dict[str, list[Ship]]:
    """Get list of ships for a player organized by status.

    Args:
        player: The player username.
        game_id: The game ID.

    Returns:
        Dict with keys 'hangar', 'launched', 'on_route' containing ship lists.
    """
    result = {'hangar': [], 'launched': [], 'on_route': []}

    player_data = get_player_data(player, game_id)
    if player_data:
        for ship in player_data.ships:
            if ship.status == 'hangar':
                result['hangar'].append(ship)
            elif ship.status == 'launched':
                result['launched'].append(ship)
            elif ship.status == 'on_route':
                result['on_route'].append(ship)

    return result


def get_available_routes(game_id: str) -> list[Route]:
    """Get list of unclaimed routes.

    Args:
        game_id: The game ID.

    Returns:
        List of available Route objects.
    """
    state = get_state(game_id)
    if state:
        # Prefer available_routes if populated, otherwise filter routes
        if state.available_routes:
            return [r for r in state.available_routes if r.available]
        return [r for r in state.routes if r.available]
    return []


def get_mission_row(game_id: str) -> list[CombatMission]:
    """Get list of available combat missions (Age II only).

    Args:
        game_id: The game ID.

    Returns:
        List of CombatMission objects from the Mission Row.
    """
    state = get_state(game_id)
    if state and state.mission_row:
        return state.mission_row
    return []


def get_rd_board(game_id: str) -> list[dict]:
    """Get available technologies from R&D board.

    Args:
        game_id: The game ID.

    Returns:
        List of tech dicts with 'id' and 'cost' keys.
    """
    state = get_state(game_id)
    if state and state.rd_board:
        # Handle both list (direct) and dict (with 'available' key) formats
        if isinstance(state.rd_board, list):
            available = state.rd_board
        else:
            available = state.rd_board.get('available', [])
        result = []
        for tech in available:
            if isinstance(tech, dict):
                result.append({
                    'id': tech.get('id', ''),
                    'cost': tech.get('cost', 0)
                })
        return result
    return []


def get_current_placer(game_id: str) -> str | None:
    """Find which player should place an agent (during worker_placement phase).

    Args:
        game_id: The game ID.

    Returns:
        Player username (e.g., 'playtest_germany') or None.
    """
    state = get_state(game_id)
    if not state or not state.worker_placement:
        return None

    wp = state.worker_placement
    if not wp.placement_order:
        return None

    idx = wp.current_placer_index
    if 0 <= idx < len(wp.placement_order):
        current_user_id = wp.placement_order[idx]

        # Find the player username for this user ID
        for player in PLAYERS:
            user_id = get_player_user_id(player)
            if user_id == current_user_id:
                return player

        # Also check by matching faction
        for player in PLAYERS:
            faction = get_faction_from_player(player)
            player_data = state.get_player(current_user_id)
            if player_data and player_data.faction == faction:
                return player

    return None


def get_player_hand(player: str, game_id: str) -> list[dict]:
    """Get list of cards in player's hand with their symbols.

    Args:
        player: The player username.
        game_id: The game ID.

    Returns:
        List of card dicts with 'index', 'name', 'symbol' keys.
    """
    player_data = get_player_data(player, game_id)
    if player_data:
        cards = []
        for i, card in enumerate(player_data.hand):
            cards.append({
                'index': i,
                'name': card.name,
                'symbol': card.symbol
            })
        return cards
    return []


def get_player_agents(player: str, game_id: str) -> int:
    """Get the number of agents remaining for a player.

    Args:
        player: The player username.
        game_id: The game ID.

    Returns:
        Number of agents remaining.
    """
    player_data = get_player_data(player, game_id)
    if player_data:
        return player_data.agents_remaining
    return 0


def get_available_locations(game_id: str) -> list[dict]:
    """Get list of unoccupied Ground Board locations.

    Args:
        game_id: The game ID.

    Returns:
        List of location dicts with 'id' and 'symbol' keys.
    """
    manifest = get_manifest()
    all_locations = manifest.locations

    state = get_state(game_id)
    if not state:
        return [{'id': loc_id, 'symbol': loc.get('symbol', '')}
                for loc_id, loc in all_locations.items()]

    # Get occupied locations
    placements = state.ground_board.get('placements', {}) if state.ground_board else {}
    occupied = set(placements.keys())

    # Return unoccupied locations
    locations = []
    for loc_id, loc in all_locations.items():
        if loc_id not in occupied:
            locations.append({'id': loc_id, 'symbol': loc.get('symbol', '')})

    return locations


def get_player_placements(player: str, game_id: str) -> list[str]:
    """Get list of locations where this player has placed agents.

    Args:
        player: The player username.
        game_id: The game ID.

    Returns:
        List of location IDs where player has agents.
    """
    state = get_state(game_id)
    if not state:
        return []

    user_id = get_player_user_id(player)
    if not user_id:
        return []

    placements = state.ground_board.get('placements', {}) if state.ground_board else {}
    result = []

    for loc_id, info in placements.items():
        if isinstance(info, dict) and info.get('playerId') == user_id:
            result.append(loc_id)

    return result


def get_player_id(player: str, state: GameState) -> str | None:
    """Get player ID from username by matching faction.

    Args:
        player: The player username (e.g., 'playtest_germany').
        state: GameState object.

    Returns:
        The user ID or None.
    """
    faction = get_faction_from_player(player)
    for user_id, player_data in state.players.items():
        if player_data.faction == faction:
            return user_id
    return None


def get_ship_details(ship: Ship, player_data: Player) -> dict:
    """Extract detailed ship stats for logging.

    Weight = sum of upgrade weights from all slots
    Required gas cubes = max(1, ceil(weight/5))
    Lift = required gas cubes * 5

    Stats (range, speed, ceiling, reliability) are calculated from blueprint
    upgrades since ships don't store their own stats - they inherit from the
    blueprint at launch time.

    Args:
        ship: Ship object.
        player_data: Player object with blueprint.

    Returns:
        Dict with ship stats including lift, weight, etc.
    """
    blueprint = player_data.blueprint if player_data else None
    manifest = get_manifest()

    # Calculate weight and stats from blueprint upgrades
    weight = 0
    stats = {'range': 1, 'speed': 1, 'ceiling': 0, 'reliability': 0}  # Age 1 baselines

    if blueprint:
        all_slots = (
            blueprint.drive_slots +
            blueprint.frame_slots +
            blueprint.fabric_slots +
            blueprint.component_slots
        )
        for upgrade_id in all_slots:
            if upgrade_id:
                upgrade = manifest.get_upgrade(upgrade_id)
                if upgrade:
                    weight += abs(upgrade.get('weight', 0))
                    # Add stats from upgrade
                    for stat, value in upgrade.get('stats', {}).items():
                        stats[stat] = stats.get(stat, 0) + value

    required_cubes = max(1, math.ceil(weight / 5)) if weight > 0 else 1
    lift = required_cubes * 5

    return {
        'id': ship.id,
        'status': ship.status,
        'lift': lift,
        'weight': weight,
        'required_gas': required_cubes,
        'range': stats['range'],
        'speed': stats['speed'],
        'ceiling': stats['ceiling'],
        'reliability': stats['reliability'],
        'net_lift': lift - weight
    }


def get_blueprint_stats(player_data: Player) -> dict:
    """Extract blueprint stats for logging.

    Calculates all stats from installed upgrades, starting from Age 1 baselines.

    Args:
        player_data: Player object with blueprint.

    Returns:
        Dict with blueprint stats.
    """
    bp = player_data.blueprint if player_data else None
    if not bp:
        return {
            'lift': 0, 'weight': 0, 'cargo': 0,
            'range': 1, 'speed': 1, 'ceiling': 0, 'reliability': 0,
            'frame_slots': 0, 'fabric_slots': 0,
            'drive_slots': 0, 'component_slots': 0,
            'gas_sockets': 0
        }

    # Calculate weight and stats from upgrades
    manifest = get_manifest()
    weight = 0
    stats = {'range': 1, 'speed': 1, 'ceiling': 0, 'reliability': 0}  # Age 1 baselines

    all_slots = bp.drive_slots + bp.frame_slots + bp.fabric_slots + bp.component_slots
    for upgrade_id in all_slots:
        if upgrade_id:
            upgrade = manifest.get_upgrade(upgrade_id)
            if upgrade:
                weight += abs(upgrade.get('weight', 0))
                # Add stats from upgrade
                for stat, value in upgrade.get('stats', {}).items():
                    stats[stat] = stats.get(stat, 0) + value

    required_cubes = max(1, math.ceil(weight / 5)) if weight > 0 else 1
    lift = required_cubes * 5

    return {
        'lift': lift,
        'weight': weight,
        'cargo': 0,  # Not tracked in Blueprint
        'range': stats['range'],
        'speed': stats['speed'],
        'ceiling': stats['ceiling'],
        'reliability': stats['reliability'],
        'frame_slots': len([s for s in bp.frame_slots if s]),
        'fabric_slots': len([s for s in bp.fabric_slots if s]),
        'drive_slots': len([s for s in bp.drive_slots if s]),
        'component_slots': len([s for s in bp.component_slots if s]),
        'gas_sockets': 0  # Not tracked directly
    }


def format_blueprint_log(bp_stats: dict) -> str:
    """Format blueprint stats for log entry.

    Args:
        bp_stats: Dict from get_blueprint_stats().

    Returns:
        Formatted string for logging.
    """
    if not bp_stats or 'lift' not in bp_stats:
        return "Blueprint: (no data)"
    return (f"Blueprint: Lift={bp_stats['lift']} Weight={bp_stats['weight']} "
            f"Net={bp_stats['lift']-bp_stats['weight']} Range={bp_stats['range']} "
            f"Speed={bp_stats['speed']} Ceiling={bp_stats['ceiling']}")


def get_last_log_entries(state: GameState, count: int = 5, entry_type: str = None) -> list[dict]:
    """Get recent log entries from game state, optionally filtered by type.

    Args:
        state: GameState object.
        count: Number of entries to return.
        entry_type: Optional type filter.

    Returns:
        List of log entry dicts.
    """
    if not state or not state.log:
        return []

    log = state.log
    if entry_type:
        log = [e for e in log if e.get('type') == entry_type]

    return log[-count:] if log else []


def check_game_ended(game_id: str) -> dict:
    """Check if the game has ended and return winner info if so.

    Args:
        game_id: The game ID.

    Returns:
        Dict with keys: ended (bool), winner (faction or None),
        reason (str or None), scores (dict or None)
    """
    state = get_state(game_id)
    if not state:
        return {'ended': False, 'winner': None, 'reason': None, 'scores': None}

    # Check for winner in state
    # Note: This depends on server implementation details
    raw = state.__dict__ if hasattr(state, '__dict__') else {}

    # Try to get winner from the raw state
    client = get_client()
    try:
        raw_state = client._api_get("playtest_germany", f"/api/state/{game_id}")
        game_state_wrapper = raw_state.get('gameState', raw_state)
        state_data = game_state_wrapper.get('state', {})

        winner_id = state_data.get('winner')
        if winner_id:
            winner_player = state_data.get('players', {}).get(winner_id, {})
            scores = state_data.get('scores', {})
            reason = state_data.get('gameEndReason', 'progress_complete')
            return {
                'ended': True,
                'winner': winner_player.get('faction', 'unknown').upper(),
                'reason': reason,
                'scores': scores
            }
    except Exception:
        pass

    return {'ended': False, 'winner': None, 'reason': None, 'scores': None}


def get_state_fingerprint(game_id: str) -> tuple[str, GameState | None]:
    """Get a fingerprint of the current game state for stuck detection.

    Args:
        game_id: The game ID.

    Returns:
        Tuple of (fingerprint_string, GameState or None)
    """
    state = get_state(game_id)
    if not state:
        return "error", None

    # Get passed count from worker placement
    passed_count = 0
    if state.worker_placement:
        # Need to get this from raw state
        try:
            client = get_client()
            raw_state = client._api_get("playtest_germany", f"/api/state/{game_id}")
            game_state_wrapper = raw_state.get('gameState', raw_state)
            state_data = game_state_wrapper.get('state', {})
            wp = state_data.get('workerPlacement', {})
            passed_count = len(wp.get('passedPlayers', []))
        except Exception:
            pass

    placements_count = len(state.ground_board.get('placements', {})) if state.ground_board else 0

    fingerprint = {
        'phase': state.phase,
        'turn': state.turn,
        'round': state.round,
        'age': state.age,
        'progress': state.progress_track,
        'placements': placements_count,
        'passed_count': passed_count
    }

    return json.dumps(fingerprint, sort_keys=True), state
