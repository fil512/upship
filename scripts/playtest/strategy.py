"""Bot strategy logic for making game decisions."""

from .config import TECH_TO_UPGRADE
from .cli import get_full_state
from .state import get_available_routes, get_player_id


def find_playable_card(cards, locations):
    """Find a card that can be played at an available location."""
    for card in cards:
        card_symbol = card.get('symbol', 'any')
        for loc in locations:
            loc_symbol = loc.get('symbol', 'any')
            if card_symbol == loc_symbol or card_symbol == 'any':
                return card, loc
    return None, None


def get_design_bureau_swaps(player_data):
    """Determine which upgrades to install at Design Bureau.

    Prioritizes Frame and Fabric slots (required for launch) over Drive slots.
    Returns a list of swap actions to pass to the PLACE_AGENT action.

    Args:
        player_data: Player state dict with blueprint and technologies

    Returns:
        List of swap dicts: [{'action': 'install', 'slotType': str, 'slotIndex': int, 'upgradeId': str}]
    """
    swaps = []
    blueprint = player_data.get('blueprint', {})
    technologies = player_data.get('technologies', [])

    if not technologies:
        return swaps

    frame_slots = blueprint.get('frameSlots', [])
    fabric_slots = blueprint.get('fabricSlots', [])
    drive_slots = blueprint.get('driveSlots', [])

    empty_frame_indices = [i for i, s in enumerate(frame_slots) if s is None]
    empty_fabric_indices = [i for i, s in enumerate(fabric_slots) if s is None]
    empty_drive_indices = [i for i, s in enumerate(drive_slots) if s is None]

    available_upgrades = []
    for tech_id in technologies:
        if tech_id in TECH_TO_UPGRADE:
            upgrade_info = TECH_TO_UPGRADE[tech_id]
            available_upgrades.append({
                'upgradeId': upgrade_info['id'],
                'slotType': upgrade_info['slotType']
            })

    # Prioritize: Frame > Fabric > Drive
    for upgrade in available_upgrades:
        if upgrade['slotType'] == 'frame' and empty_frame_indices:
            slot_index = empty_frame_indices.pop(0)
            swaps.append({
                'action': 'install',
                'slotType': 'frame',
                'slotIndex': slot_index,
                'upgradeId': upgrade['upgradeId']
            })
            if len(swaps) >= 2:
                return swaps

    for upgrade in available_upgrades:
        if upgrade['slotType'] == 'fabric' and empty_fabric_indices:
            slot_index = empty_fabric_indices.pop(0)
            swaps.append({
                'action': 'install',
                'slotType': 'fabric',
                'slotIndex': slot_index,
                'upgradeId': upgrade['upgradeId']
            })
            if len(swaps) >= 2:
                return swaps

    for upgrade in available_upgrades:
        if upgrade['slotType'] == 'drive' and empty_drive_indices:
            slot_index = empty_drive_indices.pop(0)
            swaps.append({
                'action': 'install',
                'slotType': 'drive',
                'slotIndex': slot_index,
                'upgradeId': upgrade['upgradeId']
            })
            if len(swaps) >= 2:
                return swaps

    return swaps


def evaluate_launch_readiness(player_data, routes, current_age=1):
    """Evaluate what a player needs to be able to launch a ship.

    Args:
        player_data: Player state dict
        routes: List of available routes
        current_age: Current game age (1, 2, or 3) - determines officer requirement

    Returns dict with:
        - can_launch: bool - whether player can launch right now
        - missing: list of strings describing what's missing
        - priorities: ordered list of location IDs to address missing items
    """
    hangar_ships = [s for s in player_data.get('ships', []) if s.get('status') == 'hangar']

    gas_cubes = player_data.get('gasCubes', {})
    hydrogen = gas_cubes.get('hydrogen', 0)
    helium = gas_cubes.get('helium', 0)
    total_gas = hydrogen + helium
    engineers = player_data.get('engineers', 0)
    officers = player_data.get('officers', 0)
    cash = player_data.get('cash', 0)

    missing = []
    priorities = []

    # Check 1: Do we have a ship?
    if not hangar_ships:
        missing.append('no ship in hangar')
        if cash >= 5:
            priorities.append('construction_hall')
        else:
            priorities.append('government_liaison')
            priorities.append('construction_hall')
        return {'can_launch': False, 'missing': missing, 'priorities': priorities}

    # Check 2: Are all frame and fabric slots filled?
    blueprint = player_data.get('blueprint', {})
    frame_slots = blueprint.get('frameSlots', [])
    fabric_slots = blueprint.get('fabricSlots', [])
    empty_frame = sum(1 for s in frame_slots if s is None)
    empty_fabric = sum(1 for s in fabric_slots if s is None)

    slots_ready = True
    if empty_frame > 0:
        missing.append(f'{empty_frame} empty Frame slot(s)')
        priorities.append('design_bureau')
        slots_ready = False
    if empty_fabric > 0:
        missing.append(f'{empty_fabric} empty Fabric slot(s)')
        priorities.append('design_bureau')
        slots_ready = False

    # Check 3: Do we have enough officers?
    officers_needed = current_age
    if officers < officers_needed:
        missing.append(f'need {officers_needed - officers} more officer(s) for Age {current_age}')
        priorities.append('academy')

    # Check 4: Do we have gas?
    gas_needed = 1
    if total_gas < gas_needed:
        missing.append(f'need {gas_needed - total_gas} more gas')
        priorities.append('gas_depot')

    # Check 5: Do we have routes we can reach?
    if hangar_ships and routes:
        can_reach_route = False
        best_ship = hangar_ships[0]
        ship_range = best_ship.get('stats', {}).get('range', 1)
        ship_speed = best_ship.get('stats', {}).get('speed', 1)

        for route in routes:
            route_dist = route.get('distance', 1)
            route_speed = route.get('speed', 0)
            if ship_range >= route_dist and ship_speed >= route_speed:
                can_reach_route = True
                break

        if not can_reach_route:
            missing.append('no reachable routes (need better ship stats)')
            priorities.append('design_bureau')

    # Check 6: Do we have engineers for hazard mitigation?
    if engineers < 2:
        missing.append(f'low engineers ({engineers}/2 recommended)')
        priorities.append('technical_institute')

    can_launch = (len(hangar_ships) > 0 and slots_ready and
                  officers >= officers_needed and total_gas >= gas_needed)

    return {
        'can_launch': can_launch,
        'missing': missing,
        'priorities': priorities,
        'hangar_ships': hangar_ships,
        'total_gas': total_gas,
        'engineers': engineers
    }


def find_strategic_placement(player, hand, locations, game_id):
    """Find a strategic card/location combination using intelligent evaluation.

    Strategy:
    1. Evaluate what's needed to launch (ships, gas, route access, engineers)
    2. Prioritize getting missing requirements
    3. If launch-ready, go to launchpad
    4. Fall back through sensible strategic options
    """
    state, _ = get_full_state(game_id, player)
    player_id = get_player_id(player, state) if state else None
    player_data = state.get('players', {}).get(player_id, {}) if state and player_id else {}

    if not player_data:
        return find_playable_card(hand, locations)

    cash = player_data.get('cash', 0)
    engineers = player_data.get('engineers', 0)
    officers = player_data.get('officers', 0)
    gas_cubes = player_data.get('gasCubes', {})
    total_gas = gas_cubes.get('hydrogen', 0) + gas_cubes.get('helium', 0)

    ships = player_data.get('ships', [])
    hangar_count = sum(1 for s in ships if s.get('status') == 'hangar')
    on_route_count = sum(1 for s in ships if s.get('status') == 'on_route')

    routes = get_available_routes(game_id)
    current_age = state.get('age', 1) if state else 1
    launch_eval = evaluate_launch_readiness(player_data, routes, current_age)

    priority_locations = []

    # Phase 1: Address launch requirements
    if launch_eval['can_launch'] and routes:
        priority_locations.append('launchpad')

    priority_locations.extend(launch_eval['priorities'])

    # Phase 2: Strategic investments based on game state
    if on_route_count >= 2:
        priority_locations.append('research_institute')
        priority_locations.append('flight_school')
        priority_locations.append('technical_institute')

    if hangar_count < 2 and cash >= 5:
        priority_locations.append('construction_hall')

    if total_gas < 3:
        priority_locations.append('gas_depot')

    if officers < 2 and cash >= 2:
        priority_locations.append('academy')

    if hangar_count > 0 or on_route_count > 0:
        priority_locations.append('insurance_bureau')

    # Phase 3: General fallback priorities
    fallback_priorities = [
        'design_bureau', 'research_institute', 'construction_hall',
        'gas_depot', 'academy', 'technical_institute', 'ministry',
        'flight_school', 'weather_bureau', 'government_liaison',
        'insurance_bureau', 'launchpad',
    ]

    for loc in fallback_priorities:
        if loc not in priority_locations:
            priority_locations.append(loc)

    # Phase 4: Find first available location with matching card
    available_loc_ids = {loc['id'] for loc in locations}

    for loc_id in priority_locations:
        if loc_id not in available_loc_ids:
            continue

        loc = next((l for l in locations if l['id'] == loc_id), None)
        if not loc:
            continue

        for card in hand:
            card_symbol = card.get('symbol', 'any')
            if card_symbol == loc['symbol'] or card_symbol == 'any':
                return card, loc

    return find_playable_card(hand, locations)


def get_reveal_acquisitions(player, game_id):
    """Calculate what technologies and market cards to acquire during reveal.

    Returns tuple of (tech_ids_list, card_ids_list) based on available resources.
    """
    from .state import get_rd_board

    tech_ids = []
    card_ids = []

    techs = get_rd_board(game_id)
    if techs:
        cheapest = min(techs, key=lambda t: t['cost'])
        tech_ids.append(cheapest['id'])

    return tech_ids, card_ids
