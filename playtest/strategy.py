"""Bot strategy logic for making game decisions.

This module contains the AI logic for autonomous playtesting,
including card/location selection and launch readiness evaluation.

SYNC: Keep in sync with server/services/botService.ts
Run `/bot-logic` command to analyze sync status between server and playtest bots.
"""

from typing import Any

from client import Player, Ship, Blueprint, Route, Card, CombatMission

from .state import get_state, get_available_routes, get_mission_row, get_player_id, get_rd_board, get_market_cards, get_ship_details
from .client import get_player_user_id, get_manifest


def find_playable_card(cards: list[dict], locations: list[dict]) -> tuple[dict | None, dict | None]:
    """Find a card that can be played at an available location.

    Args:
        cards: List of card dicts with 'symbol' key.
        locations: List of location dicts with 'symbol' key.

    Returns:
        Tuple of (card, location) or (None, None) if no match found.
    """
    for card in cards:
        card_symbol = card.get('symbol', 'any')
        for loc in locations:
            loc_symbol = loc.get('symbol', 'any')
            if card_symbol == loc_symbol or card_symbol == 'any':
                return card, loc
    return None, None


def get_blueprint_design_blueprint(player_data: Player, current_age: int = 1, is_age_transition: bool = False) -> dict | None:
    """Determine the desired blueprint configuration for Blueprint Design action.

    Returns the complete blueprint with all slots filled, or None if no changes needed.

    In Age I, prioritizes Frame and Fabric slots (required for launch).
    In Age II/III, prioritizes Drive slots (for range/speed needed for missions/routes).

    During age transitions, ALL empty Frame and Fabric slots MUST be filled per Section 12.1 step 5.

    [BOT-BLUEPRINT-01] SYNC: Keep in sync with getBlueprintDesignBlueprint() in server/services/botService.ts

    Args:
        player_data: Player object with blueprint and technologies.
        current_age: Current game age (1, 2, or 3).
        is_age_transition: If True, always return blueprint (even if incomplete - server validates).

    Returns:
        Blueprint dict: {'frameSlots': [...], 'fabricSlots': [...], ...} or None if no changes.
    """
    if not player_data or not player_data.blueprint:
        return None

    blueprint = player_data.blueprint
    technologies = player_data.technologies or []

    # Start with current blueprint state
    new_blueprint = {
        'frameSlots': list(blueprint.frame_slots or []),
        'fabricSlots': list(blueprint.fabric_slots or []),
        'driveSlots': list(blueprint.drive_slots or []),
        'componentSlots': list(blueprint.component_slots or []),
    }

    # Find empty slot indices
    empty_frame_indices = [i for i, s in enumerate(new_blueprint['frameSlots']) if s is None]
    empty_fabric_indices = [i for i, s in enumerate(new_blueprint['fabricSlots']) if s is None]
    empty_drive_indices = [i for i, s in enumerate(new_blueprint['driveSlots']) if s is None]

    # No empty slots = no changes needed
    if not empty_frame_indices and not empty_fabric_indices and not empty_drive_indices:
        return None

    # If no technologies, can't fill anything
    if not technologies:
        import sys
        print(f"  WARNING: Player has no technologies - cannot fill blueprint slots!", file=sys.stderr)
        return new_blueprint if is_age_transition else None

    # Track installed drive upgrades (no duplicates allowed)
    installed_drive_upgrades = set(s for s in new_blueprint['driveSlots'] if s is not None)

    manifest = get_manifest()
    # Collect available upgrades from technologies
    frame_upgrades = []
    fabric_upgrades = []
    drive_upgrades = []

    for tech_id in technologies:
        upgrade_info = manifest.get_upgrade_for_tech(tech_id)
        if upgrade_info:
            upgrade_id = upgrade_info['id']
            slot_type = upgrade_info['slotType']
            if slot_type == 'frameSlots':
                frame_upgrades.append(upgrade_id)
            elif slot_type == 'fabricSlots':
                fabric_upgrades.append(upgrade_id)
            elif slot_type == 'driveSlots':
                if upgrade_id not in installed_drive_upgrades:
                    drive_upgrades.append(upgrade_id)

    changes_made = False

    # Fill empty frame slots (duplicates allowed)
    for idx in empty_frame_indices:
        if frame_upgrades:
            new_blueprint['frameSlots'][idx] = frame_upgrades[0]  # Reuse first available
            changes_made = True

    # Fill empty fabric slots (duplicates allowed)
    for idx in empty_fabric_indices:
        if fabric_upgrades:
            new_blueprint['fabricSlots'][idx] = fabric_upgrades[0]  # Reuse first available
            changes_made = True

    # Fill empty drive slots (no duplicates)
    drive_idx = 0
    for idx in empty_drive_indices:
        if drive_idx < len(drive_upgrades):
            upgrade_id = drive_upgrades[drive_idx]
            if upgrade_id not in installed_drive_upgrades:
                new_blueprint['driveSlots'][idx] = upgrade_id
                installed_drive_upgrades.add(upgrade_id)
                changes_made = True
                drive_idx += 1

    # For age transition, always return the blueprint (even if incomplete - server validates)
    # For normal play, only return if we made changes
    if is_age_transition:
        return new_blueprint

    return new_blueprint if changes_made else None


def evaluate_launch_readiness(
    player_data: Player,
    routes: list[Route],
    current_age: int = 1,
    missions: list[CombatMission] | None = None
) -> dict:
    """Evaluate what a player needs to be able to launch a ship.

    [BOT-LAUNCH-READY-01] SYNC: Keep in sync with evaluateLaunchReadiness() in server/services/botService.ts

    Args:
        player_data: Player object.
        routes: List of available Route objects.
        current_age: Current game age (1, 2, or 3) - determines officer requirement.
        missions: List of combat missions (for Age II).

    Returns:
        Dict with:
        - can_launch: bool - whether player can launch right now
        - has_achievable_target: bool - whether any route/mission is achievable
        - missing: list of strings describing what's missing
        - priorities: ordered list of location IDs to address missing items
        - hangar_ships: list of ships in hangar
        - total_gas: total gas cubes available
        - engineers: number of engineers
    """
    hangar_ships = [s for s in (player_data.ships or []) if s.status == 'hangar']

    gas_cubes = player_data.gas_cubes or {}
    hydrogen = gas_cubes.get('hydrogen', 0)
    helium = gas_cubes.get('helium', 0)
    total_gas = hydrogen + helium
    engineers = player_data.engineers or 0
    officers = player_data.officers or 0
    cash = player_data.cash or 0

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
        return {
            'can_launch': False,
            'has_achievable_target': False,
            'missing': missing,
            'priorities': priorities,
            'hangar_ships': hangar_ships,
            'total_gas': total_gas,
            'engineers': engineers
        }

    # Check 2: Are all frame and fabric slots filled?
    blueprint = player_data.blueprint
    slots_ready = True

    if blueprint:
        frame_slots = blueprint.frame_slots or []
        fabric_slots = blueprint.fabric_slots or []
        empty_frame = sum(1 for s in frame_slots if s is None)
        empty_fabric = sum(1 for s in fabric_slots if s is None)

        if empty_frame > 0:
            missing.append(f'{empty_frame} empty Frame slot(s)')
            priorities.append('blueprint_design')
            slots_ready = False
        if empty_fabric > 0:
            missing.append(f'{empty_fabric} empty Fabric slot(s)')
            priorities.append('blueprint_design')
            slots_ready = False
    else:
        missing.append('no blueprint data')
        slots_ready = False

    # Check 3: Do we have enough officers?
    officers_needed = current_age
    if officers < officers_needed:
        missing.append(f'need {officers_needed - officers} more officer(s) for Age {current_age}')
        priorities.append('personnel_office')  # Collect officers from income track
        priorities.append('flight_school')  # Increase officer income track

    # Check 4: Do we have gas?
    gas_needed = 1
    if total_gas < gas_needed:
        missing.append(f'need {gas_needed - total_gas} more gas')
        priorities.append('gas_depot')

    # Check 5: Do we have achievable routes/missions?
    has_achievable_target = False
    if hangar_ships:
        # Calculate best ship stats
        best_ship = hangar_ships[0]
        ship_stats = get_ship_details(best_ship, player_data)
        ship_range = ship_stats.get('range', 1)
        ship_speed = ship_stats.get('speed', 1)
        ship_ceiling = ship_stats.get('ceiling', 0)
        ship_reliability = ship_stats.get('reliability', 0)

        if current_age == 2 and missions:
            # Age II: Check combat missions
            for mission in missions:
                if (ship_range >= (mission.range or 0) and
                    ship_speed >= (mission.speed or 0) and
                    ship_ceiling >= (mission.ceiling or 0) and
                    ship_reliability >= (mission.reliability or 0)):
                    has_achievable_target = True
                    break

            if not has_achievable_target:
                missing.append(f'no achievable missions (range={ship_range}, speed={ship_speed}, ceil={ship_ceiling}, rel={ship_reliability})')
                # Need better stats from drive upgrades
                priorities.insert(0, 'research_institute')  # Get more tech
                priorities.insert(1, 'blueprint_design')  # Install drive upgrades
        elif routes:
            # Age I/III: Check routes
            for route in routes:
                route_dist = route.distance or 1
                route_speed = route.speed_requirement or 0
                route_ceiling = route.ceiling_requirement or 0
                if (ship_range >= route_dist and
                    ship_speed >= route_speed and
                    ship_ceiling >= route_ceiling):
                    has_achievable_target = True
                    break

            if not has_achievable_target:
                missing.append(f'no reachable routes (range={ship_range}, speed={ship_speed})')
                priorities.insert(0, 'research_institute')  # Get more tech
                priorities.insert(1, 'blueprint_design')  # Install drive upgrades

    # Check 6: Do we have engineers for hazard mitigation?
    # IMPORTANT: Having at least 2 engineers greatly improves hazard check success
    # Most hazards need 2-4 engineers to pass, so launching with 0-1 is risky
    min_engineers_for_safe_launch = 2
    if engineers < min_engineers_for_safe_launch:
        missing.append(f'need {min_engineers_for_safe_launch - engineers} more engineer(s) for safe launch')
        priorities.append('engineering_depot')  # Collect engineers from income track
        priorities.append('technical_institute')  # Increase engineer income track

    can_launch = (len(hangar_ships) > 0 and slots_ready and
                  officers >= officers_needed and total_gas >= gas_needed and
                  has_achievable_target and engineers >= min_engineers_for_safe_launch)

    return {
        'can_launch': can_launch,
        'has_achievable_target': has_achievable_target,
        'missing': missing,
        'priorities': priorities,
        'hangar_ships': hangar_ships,
        'total_gas': total_gas,
        'engineers': engineers
    }


def evaluate_combat_mission_readiness(
    player_data: Player,
    missions: list[CombatMission],
    ship_stats: dict,
    current_age: int = 2
) -> list[dict]:
    """Evaluate which combat missions a ship can attempt.

    [BOT-COMBAT-01] NOTE: Server bots don't have this function yet (Age II not fully implemented)

    Args:
        player_data: Player object.
        missions: List of available CombatMission objects.
        ship_stats: Dict with ship's calculated stats (range, speed, ceiling, reliability).
        current_age: Current game age (should be 2 for combat missions).

    Returns:
        List of dicts with mission info and whether requirements are met:
        [{'mission': CombatMission, 'can_attempt': bool, 'failures': list[str]}]
    """
    if current_age != 2:
        return []

    results = []

    for mission in missions:
        failures = []

        # Check stat requirements
        if mission.range > 0 and ship_stats.get('range', 0) < mission.range:
            failures.append(f"Range {ship_stats.get('range', 0)} < required {mission.range}")
        if mission.speed > 0 and ship_stats.get('speed', 0) < mission.speed:
            failures.append(f"Speed {ship_stats.get('speed', 0)} < required {mission.speed}")
        if mission.ceiling > 0 and ship_stats.get('ceiling', 0) < mission.ceiling:
            failures.append(f"Ceiling {ship_stats.get('ceiling', 0)} < required {mission.ceiling}")
        if mission.reliability > 0 and ship_stats.get('reliability', 0) < mission.reliability:
            failures.append(f"Reliability {ship_stats.get('reliability', 0)} < required {mission.reliability}")

        results.append({
            'mission': mission,
            'can_attempt': len(failures) == 0,
            'failures': failures
        })

    # Sort by VP value (highest first) for missions we can attempt
    results.sort(key=lambda x: (-1 if x['can_attempt'] else 0, -x['mission'].vp, -x['mission'].income))

    return results


def find_best_combat_mission(
    player_data: Player,
    missions: list[CombatMission],
    game_id: str
) -> CombatMission | None:
    """Find the best combat mission for a player's ships.

    Considers all hangar ships and returns the highest-value mission
    that any ship can attempt.

    [BOT-COMBAT-02] NOTE: Server bots don't have this function yet (Age II not fully implemented)

    Args:
        player_data: Player object.
        missions: List of available CombatMission objects.
        game_id: The game ID.

    Returns:
        The best CombatMission or None if none are achievable.
    """
    if not missions or not player_data:
        return None

    hangar_ships = [s for s in (player_data.ships or []) if s.status == 'hangar']
    if not hangar_ships:
        return None

    # Check USA faction restriction
    # USA cannot take missions until all other players have one
    if player_data.faction == 'usa':
        state = get_state(game_id)
        if state:
            # Check if all other players have at least one mission
            all_others_have_missions = True
            for pid, pdata in state.players.items():
                if pdata.faction != 'usa':
                    completed = getattr(pdata, 'completed_missions', None) or []
                    if len(completed) == 0:
                        all_others_have_missions = False
                        break
            if not all_others_have_missions:
                return None

    best_mission = None
    best_value = -1

    for ship in hangar_ships:
        # Calculate ship stats from blueprint (ships don't store their own stats)
        ship_stats = get_ship_details(ship, player_data)

        evaluations = evaluate_combat_mission_readiness(player_data, missions, ship_stats, current_age=2)

        for eval_result in evaluations:
            if eval_result['can_attempt']:
                mission = eval_result['mission']
                # Value = VP * 10 + income (rough prioritization)
                value = mission.vp * 10 + mission.income
                if value > best_value:
                    best_value = value
                    best_mission = mission
                break  # Take the first (best) mission this ship can do

    return best_mission


def find_strategic_placement(
    player: str,
    hand: list[dict],
    locations: list[dict],
    game_id: str,
    return_decision_info: bool = False
) -> tuple[dict | None, dict | None] | tuple[dict | None, dict | None, dict]:
    """Find a strategic card/location combination using intelligent evaluation.

    VP-MAXIMIZING STRATEGY:
    1. LAUNCH ships whenever possible - routes are the primary VP source
    2. Build ships to have something to launch
    3. Get gas to fuel launches
    4. Only invest in income upgrades when truly blocked

    [BOT-PLACEMENT-01] SYNC: Keep in sync with findStrategicPlacement() in server/services/botService.ts

    Args:
        player: Player username.
        hand: List of card dicts.
        locations: List of available location dicts.
        game_id: The game ID.
        return_decision_info: If True, return a third element with decision details.

    Returns:
        Tuple of (card, location) or (None, None) if no match found.
        If return_decision_info=True, returns (card, location, decision_info).
    """
    state = get_state(game_id, player)
    if not state:
        if return_decision_info:
            return find_playable_card(hand, locations) + ({'reason': 'no state'},)
        return find_playable_card(hand, locations)

    player_id = get_player_id(player, state)
    player_data = state.get_player(player_id) if player_id else None

    if not player_data:
        if return_decision_info:
            return find_playable_card(hand, locations) + ({'reason': 'no player data'},)
        return find_playable_card(hand, locations)

    cash = player_data.cash or 0
    engineers = player_data.engineers or 0
    officers = player_data.officers or 0
    research_level = player_data.research_level or 0
    gas_cubes = player_data.gas_cubes or {}
    hydrogen = gas_cubes.get('hydrogen', 0)
    helium = gas_cubes.get('helium', 0)
    total_gas = hydrogen + helium

    ships = player_data.ships or []
    hangar_count = sum(1 for s in ships if s.status == 'hangar')
    on_route_count = sum(1 for s in ships if s.status == 'on_route')

    routes = get_available_routes(game_id)
    current_age = state.age or 1

    # Get missions for Age II
    missions = get_mission_row(game_id) if current_age == 2 else None

    launch_eval = evaluate_launch_readiness(player_data, routes, current_age, missions)

    # Build decision info for logging
    decision_info = {
        'launch_eval': launch_eval,
        'player_state': {
            'cash': cash,
            'officers': officers,
            'engineers': engineers,
            'research_level': research_level,
            'hydrogen': hydrogen,
            'helium': helium,
            'hangar_ships': hangar_count,
            'on_route_ships': on_route_count,
        },
        'current_age': current_age,
        'routes_available': len(routes) if routes else 0,
        'missions_available': len(missions) if missions else 0,
        'priority_reason': None,
        'chosen_location': None,
    }

    priority_locations = []

    # =======================================================================
    # VP-MAXIMIZING STRATEGY: Prioritize actions that score VP
    # =======================================================================

    # PRIORITY 1: LAUNCH if ready - this is how you score VP!
    # There are TWO launchpad spaces - try both!
    if launch_eval['can_launch'] and (routes or missions):
        priority_locations.append('launchpad')
        priority_locations.append('launchpad_2')  # Second launchpad space
        decision_info['priority_reason'] = 'VP STRATEGY: launch ready - going to launchpad!'
    else:
        decision_info['priority_reason'] = f"not launch ready: {'; '.join(launch_eval.get('missing', []))}"

    # PRIORITY 2: Fix launch blockers in order of importance
    # Officers are needed per Age (1/2/3) - critical blocker
    officers_needed = current_age
    if officers < officers_needed:
        if 'personnel_office' not in priority_locations:
            priority_locations.append('personnel_office')  # Collect officers from track

    # Need a ship to launch
    if hangar_count == 0:
        if cash >= 5:
            priority_locations.append('construction_hall')
        else:
            priority_locations.append('treasury')  # Get cash first
            priority_locations.append('construction_hall')

    # Need gas to launch
    if total_gas < 1:
        priority_locations.append('gas_depot')

    # Need blueprint slots filled
    blueprint = player_data.blueprint
    if blueprint:
        frame_empty = sum(1 for s in (blueprint.frame_slots or []) if s is None)
        fabric_empty = sum(1 for s in (blueprint.fabric_slots or []) if s is None)
        if frame_empty > 0 or fabric_empty > 0:
            priority_locations.append('blueprint_design')

    # PRIORITY 3: Build up for NEXT launch (secondary)
    # Build more ships if we have cash and hangar is low
    if hangar_count < 2 and cash >= 5:
        priority_locations.append('construction_hall')

    # Stock up on gas for next launch
    if total_gas < 2:
        priority_locations.append('gas_depot')

    # Get engineers for hazard mitigation (2 is a good safety buffer)
    if engineers < 2:
        priority_locations.append('engineering_depot')  # Collect from track

    # PRIORITY 4: Income investments ONLY if we have excess actions
    # These are low priority - VP comes from routes, not income tracks

    # Research level helps buy techs (which may give VP)
    # But only invest if we're otherwise blocked
    if research_level < 2 and cash >= 4 and hangar_count >= 1 and total_gas >= 1:
        priority_locations.append('research_institute')

    # Officer income only if we keep running out
    if officers < officers_needed and cash >= 4:
        priority_locations.append('flight_school')

    # Engineer income only if we keep running out
    if engineers < 1 and cash >= 4:
        priority_locations.append('technical_institute')

    # PRIORITY 5: Insurance only if we have ships at risk
    if on_route_count > 0:
        priority_locations.append('insurance_bureau')

    # PRIORITY 6: Fallback - fill remaining slots
    # Treasury to collect income if low on cash
    if cash < 5:
        priority_locations.append('treasury')

    # General fallbacks (low priority)
    # Note: launchpad and launchpad_2 are at the END - only use if no better option
    # because going to launchpad without ships/gas/officers is wasteful
    fallback_priorities = [
        'construction_hall', 'gas_depot', 'blueprint_design',
        'personnel_office', 'engineering_depot', 'treasury',
        'ministry', 'weather_bureau', 'research_institute',
        'technical_institute', 'flight_school', 'government_liaison',
        'insurance_bureau', 'launchpad', 'launchpad_2',
    ]

    for loc in fallback_priorities:
        if loc not in priority_locations:
            priority_locations.append(loc)

    # Phase 4: Find first available location with matching card
    available_loc_ids = {loc['id'] for loc in locations}
    decision_info['available_locations'] = list(available_loc_ids)
    decision_info['priority_order'] = priority_locations[:10]  # Top 10

    for loc_id in priority_locations:
        if loc_id not in available_loc_ids:
            continue

        loc = next((l for l in locations if l['id'] == loc_id), None)
        if not loc:
            continue

        for card in hand:
            card_symbol = card.get('symbol', 'any')
            if card_symbol == loc['symbol'] or card_symbol == 'any':
                decision_info['chosen_location'] = loc_id
                decision_info['chosen_priority_rank'] = priority_locations.index(loc_id) + 1
                if return_decision_info:
                    return card, loc, decision_info
                return card, loc

    # Fallback
    card, loc = find_playable_card(hand, locations)
    decision_info['chosen_location'] = loc['id'] if loc else None
    decision_info['fallback'] = True
    if return_decision_info:
        return card, loc, decision_info
    return card, loc


def get_reveal_acquisitions(player: str, game_id: str) -> tuple[list[str], list[str]]:
    """Calculate what technologies and market cards to acquire during reveal.

    Calculates available research (research_level + engineers + ~1 card bonus estimate)
    and buys as many techs as affordable, prioritizing by strategic value.

    Also calculates available influence and buys market cards (agent cards).

    [BOT-REVEAL-01] SYNC: Keep in sync with getRevealAcquisitions() in server/services/botService.ts

    Args:
        player: Player username.
        game_id: The game ID.

    Returns:
        Tuple of (tech_ids_list, card_ids_list) based on available resources.
    """
    tech_ids = []
    card_ids = []

    # Get player data to check resources and owned techs
    state = get_state(game_id, player)
    player_id = get_player_id(player, state) if state else None
    player_data = state.get_player(player_id) if state and player_id else None

    if not player_data:
        return tech_ids, card_ids

    # ============ TECH ACQUISITIONS (Research) ============
    techs = get_rd_board(game_id)
    if techs:
        owned_techs = set(player_data.technologies) if player_data.technologies else set()

        # Calculate available research per Section 5.1:
        # Research = Research Level + Engineers in Barracks + card bonuses
        # Card bonuses vary, but estimate ~1-2 from typical hand (Rigger, Researcher cards)
        research_level = player_data.research_level or 0
        engineers = player_data.engineers or 0
        card_bonus_estimate = 1  # Conservative estimate for card bonuses

        available_research = research_level + engineers + card_bonus_estimate

        if available_research > 0:
            # Filter to available techs not already owned
            available_techs = [t for t in techs if t.get('id') not in owned_techs]

            if available_techs:
                # VP-MAXIMIZING TECH ACQUISITION STRATEGY
                # Priority order:
                # 1. Techs that give VP directly (highest value)
                # 2. Drive techs (range/speed enable more route options = more VP)
                # 3. Structure techs (lift enables larger ships)
                # 4. Fabric techs (weight reduction)
                # 5. Gas techs (efficiency)
                # 6. Component techs (income/luxury)

                drive_keywords = {'engine', 'propeller', 'diesel', 'supercharg', 'turbo', 'pitch'}
                structure_keywords = {'frame', 'girder', 'bracing', 'keel', 'geodetic', 'modular', 'hull'}
                fabric_keywords = {'fabric', 'skin', 'canvas', 'cotton', 'latex', 'coating', 'doping', 'covering'}
                gas_keywords = {'gas', 'valv', 'ballonet', 'cell', 'vent', 'recovery', 'helium', 'blaugas'}

                def get_tech_priority(tech: dict) -> tuple[int, int]:
                    """Returns (priority, -vp) for sorting. Lower = better."""
                    tech_id = tech.get('id', '').lower()
                    tech_name = tech.get('name', '').lower()
                    combined = tech_id + ' ' + tech_name
                    tech_vp = tech.get('vp', 0) or 0

                    # Techs with VP get highest priority (negative VP for descending sort)
                    if tech_vp > 0:
                        return (0, -tech_vp)

                    if any(kw in combined for kw in drive_keywords):
                        return (1, 0)  # High priority - range/speed for routes
                    if any(kw in combined for kw in structure_keywords):
                        return (2, 0)  # Frame/lift
                    if any(kw in combined for kw in fabric_keywords):
                        return (3, 0)  # Fabric/weight
                    if any(kw in combined for kw in gas_keywords):
                        return (4, 0)  # Gas efficiency
                    return (5, 0)  # Components and other

                # Sort by priority first, then by cost (prefer cheaper within same priority)
                available_techs.sort(key=lambda t: (get_tech_priority(t), t.get('cost', 0)))

                # Buy as many techs as we can afford
                remaining_research = available_research
                for tech in available_techs:
                    cost = tech.get('cost', 0)
                    if cost <= remaining_research:
                        tech_ids.append(tech['id'])
                        remaining_research -= cost
                        if remaining_research <= 0:
                            break

    # ============ MARKET CARD PURCHASES (Influence) ============
    # Return ALL market cards sorted by priority as fallback options.
    # The actual purchase will be limited by available influence on the server.
    # This ensures that if the first-choice card is already claimed by another
    # player, the bot will try the next best option instead of giving up.
    market_cards = get_market_cards(game_id)
    if market_cards:
        # VP-MAXIMIZING CARD ACQUISITION STRATEGY
        # Priority order:
        # 1. Cards that give VP directly (highest value)
        # 2. Operations cards (propeller) - useful for launchpad
        # 3. Technical cards (wrench) - useful for construction, blueprint
        # 4. Business cards (coin) - useful for gas depot, treasury
        # 5. Any/wild cards
        # 6. Reserve card (always available fallback)

        def get_card_priority(card: dict) -> tuple[int, int]:
            """Returns (priority, -vp) for sorting. Lower = better."""
            # Reserve card (always available) is lowest priority - it's a fallback
            if card.get('is_reserve') or card.get('id') == 'reserve_aeronaut':
                return (6, 0)

            card_vp = card.get('vp', 0) or 0

            # Cards with VP get highest priority
            if card_vp > 0:
                return (0, -card_vp)

            symbol = card.get('symbol', '').lower()
            if symbol == 'propeller' or symbol == 'operations':
                return (1, 0)  # Operations - useful for launchpad
            if symbol == 'wrench' or symbol == 'technical':
                return (2, 0)  # Technical - useful for construction, blueprint
            if symbol == 'coin' or symbol == 'business':
                return (3, 0)  # Business - useful for gas depot, insurance
            return (4, 0)  # Any/wild or unknown

        # Sort by priority, then by cost (prefer cheaper)
        market_cards.sort(key=lambda c: (get_card_priority(c), c.get('cost', 3)))

        # Return ALL cards sorted by priority - the purchase phase will try each
        # in order and stop when influence runs out or all cards are attempted
        card_ids = [card['id'] for card in market_cards]

    return tech_ids, card_ids
