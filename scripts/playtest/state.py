"""Game state accessor functions for reading game information."""

import json
import math
import re
import urllib.request
import urllib.error

from .config import (
    PLAYERS, API_BASE, LOCATION_SYMBOLS, UPGRADE_WEIGHTS
)
from .cli import run_cli, strip_ansi, get_session_cookie, get_full_state


def get_current_player(game_id):
    """Find which player has the current turn."""
    for player in PLAYERS:
        output = run_cli(player, "state", game_id)
        if "YOUR TURN" in output:
            return player
    return None


def get_phase(game_id):
    """Get current game phase."""
    output = strip_ansi(run_cli("playtest_germany", "state", game_id))
    match = re.search(r'Phase:\s*([A-Z][A-Z &]+)', output)
    if match:
        phase_text = match.group(1).strip()
        if 'WORKER' in phase_text:
            return 'WORKER_PLACEMENT'
        elif 'REVEAL' in phase_text:
            return 'REVEAL'
        elif 'INCOME' in phase_text or 'CLEANUP' in phase_text:
            return 'INCOME_CLEANUP'
        return phase_text.replace(' ', '_').replace('&', '_')
    return "UNKNOWN"


def get_age(game_id):
    """Get current game age (1, 2, or 3)."""
    output = strip_ansi(run_cli("playtest_germany", "state", game_id))
    match = re.search(r'Age:\s*(\d+)', output)
    if match:
        return int(match.group(1))
    return 1


def get_gas_preference(player, game_id=None):
    """Return preferred gas type for player. USA prefers helium, others prefer hydrogen."""
    preferred = "helium" if player == "playtest_usa" else "hydrogen"

    if game_id:
        output = strip_ansi(run_cli(player, "state", game_id))
        if preferred == "helium" and "Helium: 0" in output:
            return "hydrogen"
        elif preferred == "hydrogen" and "Hydrogen: 0" in output:
            return "helium"

    return preferred


def get_player_ships(player, game_id):
    """Get list of ships for a player with their statuses and stats."""
    output = run_cli(player, "state", game_id)
    ships = {'hangar': [], 'launched': [], 'on_route': []}
    current_ship = None

    for line in output.split('\n'):
        if 'ship_' in line:
            match = re.search(r'(ship_\d+_\d+)', line)
            if match:
                ship_id = match.group(1)
                current_ship = {'id': ship_id, 'range': 1, 'speed': 1}
                if 'HANGAR' in line:
                    ships['hangar'].append(current_ship)
                elif 'LAUNCHED' in line:
                    ships['launched'].append(current_ship)
                elif 'ON_ROUTE' in line:
                    ships['on_route'].append(current_ship)
        if current_ship and 'Range:' in line:
            range_match = re.search(r'Range:(\d+)', line)
            speed_match = re.search(r'Speed:(\d+)', line)
            if range_match:
                current_ship['range'] = int(range_match.group(1))
            if speed_match:
                current_ship['speed'] = int(speed_match.group(1))

    return ships


def get_available_routes(game_id):
    """Get list of unclaimed routes with requirements via API."""
    try:
        url = f"{API_BASE}/api/state/{game_id}"
        req = urllib.request.Request(url)
        cookie = get_session_cookie()
        if cookie:
            req.add_header("Cookie", cookie)
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())

        gs = data.get('gameState', data)
        state = gs.get('state', gs)
        routes = state.get('map', {}).get('routes', [])

        available = []
        for route in routes:
            if not route.get('claimed'):
                available.append({
                    'id': route.get('id'),
                    'name': route.get('name', route.get('id', 'unknown')),
                    'distance': route.get('range', 1),
                    'speed': route.get('speed', 0),
                    'ceiling': route.get('ceiling', 0),
                    'income': route.get('income', 0),
                    'vp': route.get('vp', 0)
                })
        return available
    except Exception as e:
        print(f"Error getting routes: {e}")
        return []


def get_rd_board(game_id):
    """Get available technologies from R&D board."""
    output = strip_ansi(run_cli("playtest_germany", "state", game_id))
    techs = []
    in_rd_section = False
    for line in output.split('\n'):
        if 'R&D Board' in line:
            in_rd_section = True
            continue
        if in_rd_section:
            if line.startswith('│') and '£' in line and 'OWNED' not in line:
                parts = line.split('│')
                if len(parts) >= 2:
                    tech_id = parts[1].strip()
                    cost_match = re.search(r'£(\d+)', parts[2] if len(parts) > 2 else '')
                    if tech_id and cost_match:
                        techs.append({'id': tech_id, 'cost': int(cost_match.group(1))})
            elif '└' in line or '┌' in line and 'R&D' not in line:
                break
    return techs


def get_current_placer(game_id):
    """Find which player should place an agent (during worker_placement phase)."""
    for player in PLAYERS:
        output = strip_ansi(run_cli(player, "state", game_id))
        if 'YOUR TURN' in output and 'simultaneous' not in output and 'ended your turn' not in output.lower():
            return player

    output = strip_ansi(run_cli("playtest_germany", "state", game_id))
    for line in output.split('\n'):
        if 'Waiting for' in line:
            for player in PLAYERS:
                faction = player.replace('playtest_', '')
                if faction.upper() in line.upper():
                    return player

    return None


def get_player_hand(player, game_id):
    """Get list of cards in player's hand with their symbols."""
    output = strip_ansi(run_cli(player, "state", game_id))
    cards = []
    in_hand_section = False
    for line in output.split('\n'):
        if 'Your Hand' in line:
            in_hand_section = True
            continue
        if in_hand_section:
            if line.strip().startswith('│') or line.strip().startswith('-'):
                match = re.search(r'\[(\d+)\]\s*([^(]+)\s*\((\w+)\)', line)
                if match:
                    cards.append({
                        'index': int(match.group(1)),
                        'name': match.group(2).strip(),
                        'symbol': match.group(3).strip()
                    })
            elif '└' in line:
                break
    return cards


def get_player_agents(player, game_id):
    """Get the number of agents remaining for a player."""
    output = strip_ansi(run_cli(player, "state", game_id))
    match = re.search(r'Agents Remaining:\s*(\d+)', output, re.IGNORECASE)
    if match:
        return int(match.group(1))
    if 'Worker Placement' not in output and 'WORKER' not in output:
        return 0
    return 2


def get_available_locations(game_id):
    """Get list of unoccupied Ground Board locations."""
    output = strip_ansi(run_cli("playtest_germany", "state", game_id))
    locations = []

    occupied = set()
    in_ground_board = False
    for line in output.split('\n'):
        if 'Ground Board' in line:
            in_ground_board = True
            continue
        if in_ground_board:
            if '┌─' in line and 'Ground Board' not in line:
                break
            for loc_id in LOCATION_SYMBOLS:
                if f'{loc_id}:' in line.lower():
                    occupied.add(loc_id)

    for loc_id, symbol in LOCATION_SYMBOLS.items():
        if loc_id not in occupied:
            locations.append({'id': loc_id, 'symbol': symbol})

    return locations


def get_player_placements(player, game_id):
    """Get list of locations where this player has placed agents."""
    output = strip_ansi(run_cli(player, "state", game_id))
    placements = []
    faction = player.replace('playtest_', '').upper()

    in_ground_board = False
    for line in output.split('\n'):
        if 'Ground Board' in line:
            in_ground_board = True
            continue
        if in_ground_board:
            if '┌─' in line and 'Ground Board' not in line:
                break
            if faction in line:
                for loc_id in LOCATION_SYMBOLS.keys():
                    if loc_id in line.lower():
                        placements.append(loc_id)
    return placements


def get_player_id(player, state):
    """Get player ID from username/faction."""
    faction = player.replace('playtest_', '')
    players = state.get('players', {})
    for pid, pdata in players.items():
        if pdata.get('faction', '').lower() == faction:
            return pid
    return None


def get_ship_details(ship, player_data):
    """Extract detailed ship stats for logging.

    Weight = sum of upgrade weights from all slots
    Required gas cubes = max(1, ceil(weight/5))
    Lift = required gas cubes * 5
    """
    blueprint = player_data.get('blueprint', {})
    ship_stats = ship.get('stats', {})

    weight = 0
    for slot_type in ['driveSlots', 'frameSlots', 'fabricSlots', 'componentSlots']:
        for upgrade_id in blueprint.get(slot_type, []):
            if upgrade_id:
                weight += UPGRADE_WEIGHTS.get(upgrade_id, 0)

    required_cubes = max(1, math.ceil(weight / 5)) if weight > 0 else 1
    lift = required_cubes * 5

    return {
        'id': ship.get('id', 'unknown'),
        'status': ship.get('status', 'unknown'),
        'lift': lift,
        'weight': weight,
        'required_gas': required_cubes,
        'range': ship_stats.get('range', 1),
        'speed': ship_stats.get('speed', 1),
        'ceiling': ship_stats.get('ceiling', 0),
        'reliability': ship_stats.get('reliability', 0),
        'luxury': ship_stats.get('luxury', 0),
        'net_lift': lift - weight
    }


def get_blueprint_stats(player_data):
    """Extract blueprint stats for logging."""
    bp = player_data.get('blueprint', {})
    return {
        'lift': bp.get('lift', 0),
        'weight': bp.get('weight', 0),
        'cargo': bp.get('cargo', 0),
        'range': bp.get('range', 1),
        'speed': bp.get('speed', 1),
        'ceiling': bp.get('ceiling', 0),
        'frame_slots': len(bp.get('frameSlots', [])),
        'fabric_slots': len(bp.get('fabricSlots', [])),
        'drive_slots': len(bp.get('driveSlots', [])),
        'component_slots': len(bp.get('componentSlots', [])),
        'gas_sockets': bp.get('gasSockets', 0)
    }


def format_blueprint_log(bp_stats):
    """Format blueprint stats for log entry."""
    return (f"Blueprint: Lift={bp_stats['lift']} Weight={bp_stats['weight']} "
            f"Net={bp_stats['lift']-bp_stats['weight']} Range={bp_stats['range']} "
            f"Speed={bp_stats['speed']} Ceiling={bp_stats['ceiling']}")


def get_last_log_entries(state, count=5, entry_type=None):
    """Get recent log entries from game state, optionally filtered by type."""
    log = state.get('log', [])
    if entry_type:
        log = [e for e in log if e.get('type') == entry_type]
    return log[-count:] if log else []


def check_game_ended(game_id):
    """Check if the game has ended and return winner info if so.

    Returns:
        dict with keys: ended (bool), winner (faction or None),
        reason (str or None), scores (dict or None)
    """
    state, _ = get_full_state(game_id)
    if not state:
        return {'ended': False, 'winner': None, 'reason': None, 'scores': None}

    winner_id = state.get('winner')
    if winner_id:
        winner_player = state.get('players', {}).get(winner_id, {})
        scores = state.get('scores', {})
        reason = state.get('gameEndReason', 'progress_complete')
        return {
            'ended': True,
            'winner': winner_player.get('faction', 'unknown').upper(),
            'reason': reason,
            'scores': scores
        }
    return {'ended': False, 'winner': None, 'reason': None, 'scores': None}


def get_state_fingerprint(game_id):
    """Get a fingerprint of the current game state for stuck detection."""
    state, _ = get_full_state(game_id)
    if not state:
        return "error", None

    fingerprint = {
        'phase': state.get('phase'),
        'turn': state.get('turn'),
        'round': state.get('round'),
        'age': state.get('age'),
        'progress': state.get('progressTrack', 0),
        'placements': len(state.get('groundBoard', {}).get('placements', {})),
        'passed_count': len(state.get('workerPlacement', {}).get('passedPlayers', []))
    }
    return json.dumps(fingerprint, sort_keys=True), state
