"""Game phase handlers for worker placement, reveal, and income/cleanup.

This module handles the game loop phases using the client library
for direct HTTP communication instead of CLI subprocesses.
"""

import json
from typing import Any

from client import ActionResult, GameState, Player

from .config import PLAYERS, EARLY_REVEAL_MODE, is_ai_player
from .client import get_client, get_faction_from_player
from .logging import get_logger, PlaytestLogger
from .state import (
    get_state, get_phase, get_player_agents, get_player_hand, get_available_locations,
    get_current_placer, get_available_routes, get_mission_row, get_player_id, get_ship_details,
    get_blueprint_stats, format_blueprint_log, get_last_log_entries, get_gas_preference,
    get_player_data
)
from .strategy import (
    find_strategic_placement, get_design_bureau_blueprint, get_reveal_acquisitions,
    evaluate_combat_mission_readiness, find_best_combat_mission
)


def handle_launchpad_launches(player: str, game_id: str, logger: PlaytestLogger) -> None:
    """Handle the multi-step launchpad: launch ships and call NO_MORE_LAUNCHES.

    In Age II, prioritizes combat missions over regular routes.
    In Age I and III, only regular routes are available.

    Args:
        player: Player username.
        game_id: The game ID.
        logger: PlaytestLogger instance.
    """
    client = get_client()
    state = get_state(game_id, player)
    if not state:
        _no_more_launches(player, game_id, "could not get state", logger)
        return

    player_id = get_player_id(player, state)
    player_data = state.get_player(player_id) if player_id else None

    if not player_data:
        _no_more_launches(player, game_id, "could not get player data", logger)
        return

    hangar_ships = [s for s in player_data.ships if s.status == 'hangar']

    if not hangar_ships:
        _no_more_launches(player, game_id, "no ships in hangar", logger)
        return

    # Check blueprint slot requirements
    blueprint = player_data.blueprint
    if blueprint:
        frame_slots = blueprint.frame_slots or []
        fabric_slots = blueprint.fabric_slots or []
        empty_frame = sum(1 for s in frame_slots if s is None)
        empty_fabric = sum(1 for s in fabric_slots if s is None)

        if empty_frame > 0 or empty_fabric > 0:
            slot_msg = []
            if empty_frame > 0:
                slot_msg.append(f"{empty_frame} Frame")
            if empty_fabric > 0:
                slot_msg.append(f"{empty_fabric} Fabric")
            _no_more_launches(player, game_id, f"{' and '.join(slot_msg)} slot(s) empty", logger)
            return

    # Check officer requirements
    current_age = state.age or 1
    officers_needed = current_age
    available_officers = player_data.officers or 0

    if available_officers < officers_needed:
        _no_more_launches(player, game_id, f"need {officers_needed} officer(s) for Age {current_age}, have {available_officers}", logger)
        return

    # Check gas availability
    gas_cubes = player_data.gas_cubes or {}
    total_gas = gas_cubes.get('hydrogen', 0) + gas_cubes.get('helium', 0)

    if total_gas < 1:
        _no_more_launches(player, game_id, "no gas available", logger)
        return

    launched = 0

    # Age II: Combat missions instead of routes
    if current_age == 2:
        missions = get_mission_row(game_id)
        if missions:
            mission_launches = _attempt_combat_missions(
                player, game_id, hangar_ships, missions, player_data, officers_needed, logger
            )
            launched += mission_launches
        if launched == 0:
            _no_more_launches(player, game_id, "no missions available or achievable", logger)
            return
    else:
        # Try regular routes (Age I and III)
        routes = get_available_routes(game_id)
        if routes:
            route_launches = _attempt_route_launches(
                player, game_id, hangar_ships, routes, player_data, officers_needed, logger
            )
            launched += route_launches
        elif launched == 0:
            _no_more_launches(player, game_id, "no routes available", logger)
            return

    _no_more_launches_quiet(player, game_id)
    print(f"    {player}: done launching ({launched} ships)")
    logger.log_action(player, f"done launching ({launched} ships)", "worker_placement")


def _attempt_combat_missions(
    player: str,
    game_id: str,
    hangar_ships: list,
    missions: list,
    player_data: Player,
    officers_needed: int,
    logger: PlaytestLogger
) -> int:
    """Attempt to launch ships on combat missions.

    Args:
        player: Player username.
        game_id: The game ID.
        hangar_ships: List of ships in hangar.
        missions: List of available combat missions.
        player_data: Player object.
        officers_needed: Number of officers required per launch.
        logger: PlaytestLogger instance.

    Returns:
        Number of successful mission launches.
    """
    client = get_client()
    launched = 0

    for ship in hangar_ships[:]:
        ship_stats = get_ship_details(ship, player_data)

        # Find a mission this ship can attempt
        evaluations = evaluate_combat_mission_readiness(
            player_data,
            missions,
            {
                'range': ship_stats.get('range', 0),
                'speed': ship_stats.get('speed', 0),
                'ceiling': ship_stats.get('ceiling', 0),
                'reliability': ship_stats.get('reliability', 0)
            },
            current_age=2
        )

        for eval_result in evaluations:
            if not eval_result['can_attempt']:
                continue

            mission = eval_result['mission']
            gas_type = get_gas_preference(player, game_id)

            stats_str = (f"Ship: Lift={ship_stats['lift']} Weight={ship_stats['weight']} "
                        f"Gas={ship_stats['required_gas']} Range={ship_stats['range']} "
                        f"Speed={ship_stats['speed']} Rel={ship_stats.get('reliability', 0)}")
            mission_str = (f"Mission: {mission.name} ({mission.mission_type}) "
                          f"Range≥{mission.range} Speed≥{mission.speed} Ceil≥{mission.ceiling} "
                          f"Rel≥{mission.reliability} → +{mission.income}£, {mission.vp}VP")

            # Launch the ship on the mission - wrap in try/except for validation errors
            try:
                result = client.launch_combat_mission(player, game_id, ship.id, mission.id, gas_type)
            except Exception as e:
                error_str = str(e).lower()
                # Handle various validation errors gracefully
                if any(phrase in error_str for phrase in [
                    "not found", "already", "not enough", "insufficient",
                    "cannot", "no hazard cards"
                ]):
                    print(f"    {player}: mission blocked ({str(e)[:50]}...)")
                    logger.log_action(player, f"MISSION BLOCKED: {str(e)[:60]}", "worker_placement")
                    # For gas/resource issues, break out - no point trying more missions with same ship
                    if "not enough" in error_str or "insufficient" in error_str:
                        break
                    continue
                else:
                    # Re-raise unexpected errors
                    raise

            if result.success:
                # Get updated state
                post_state = result.game_state or get_state(game_id, player)
                post_player_id = get_player_id(player, post_state) if post_state else None
                post_player_data = post_state.get_player(post_player_id) if post_state and post_player_id else None

                post_ship = None
                if post_player_data:
                    post_ship = next((s for s in post_player_data.ships if s.id == ship.id), None)

                ship_status = post_ship.status if post_ship else 'unknown'

                # Handle hazard response if ship is awaiting_hazard
                ship_status = _check_and_handle_hazard(
                    client, player, game_id, ship.id, post_player_id, post_player_data, logger
                )

                # Determine launch outcome
                log_entries = get_last_log_entries(post_state, count=10) if post_state else []
                launch_outcome = _determine_launch_outcome(log_entries, ship.id, ship_status)

                action_str = f"COMBAT MISSION {ship.id} → {mission.id} ({gas_type})"
                print(f"    {player}: {action_str} [{launch_outcome}]")

                logger.log_action(player, action_str, "worker_placement")
                logger.log_action(None, f"  └─ {stats_str}", "worker_placement")
                logger.log_action(None, f"  └─ {mission_str}", "worker_placement")
                logger.log_action(None, f"  └─ Outcome: {launch_outcome} (status={ship_status})", "worker_placement")

                if launch_outcome == "SUCCESS" or ship_status == 'on_route':
                    # Remove mission from list
                    missions = [m for m in missions if m.id != mission.id]
                    launched += 1
                    faction = get_faction_from_player(player)
                    logger.track_mission_claimed(mission.name, faction)

                    # Check if we have officers left for more launches
                    if post_player_data:
                        post_officers = post_player_data.officers or 0
                        if post_officers < officers_needed:
                            return launched
                break
            else:
                error_msg = result.error or "unknown error"
                print(f"    {player}: combat mission failed for {ship.id} to {mission.id}")
                logger.log_action(player, f"COMBAT MISSION FAILED {ship.id} → {mission.id}", "worker_placement")
                logger.log_action(None, f"  └─ Error: {error_msg[:100]}", "worker_placement")

    return launched


def _attempt_route_launches(
    player: str,
    game_id: str,
    hangar_ships: list,
    routes: list,
    player_data: Player,
    officers_needed: int,
    logger: PlaytestLogger
) -> int:
    """Attempt to launch ships on regular routes.

    Args:
        player: Player username.
        game_id: The game ID.
        hangar_ships: List of ships in hangar.
        routes: List of available routes.
        player_data: Player object.
        officers_needed: Number of officers required per launch.
        logger: PlaytestLogger instance.

    Returns:
        Number of successful route launches.
    """
    client = get_client()
    launched = 0

    # Sort routes by difficulty (easier first)
    routes_list = sorted(routes, key=lambda r: (r.distance or 1, r.speed_requirement or 0))

    current_officers = player_data.officers or 0

    for ship in hangar_ships[:]:
        # Check we still have officers for this launch
        if current_officers < officers_needed:
            break

        ship_stats = get_ship_details(ship, player_data)

        # Filter routes to only those this ship can fly
        ship_range = ship_stats.get('range', 0)
        ship_speed = ship_stats.get('speed', 0)
        ship_ceiling = ship_stats.get('ceiling', 0)

        flyable_routes = [
            r for r in routes_list
            if r.distance <= ship_range
            and r.speed_requirement <= ship_speed
            and r.ceiling_requirement <= ship_ceiling
        ]

        if not flyable_routes:
            # Ship can't fly any available routes
            continue

        for route in flyable_routes:
            gas_type = get_gas_preference(player, game_id)

            stats_str = (f"Ship: Lift={ship_stats['lift']} Weight={ship_stats['weight']} "
                        f"Gas={ship_stats['required_gas']} Range={ship_stats['range']} "
                        f"Speed={ship_stats['speed']} Rel={ship_stats.get('reliability', 0)}")
            route_str = (f"Route: {route.name} (dist={route.distance}, "
                        f"speed={route.speed_requirement}, income=+{route.income})")

            # Launch the ship - wrap in try/except for validation errors
            try:
                result = client.launch_ship(player, game_id, ship.id, route.id, gas_type)
            except Exception as e:
                error_str = str(e).lower()
                # Handle various validation errors gracefully
                if any(phrase in error_str for phrase in [
                    "already claimed", "not enough", "insufficient",
                    "not found", "no hazard cards", "helium handling",
                    "cannot use helium"
                ]):
                    print(f"    {player}: launch blocked ({str(e)[:50]}...)")
                    logger.log_action(player, f"LAUNCH BLOCKED: {str(e)[:60]}", "worker_placement")
                    # For gas/resource issues, break out - no point trying more routes with same ship
                    if "not enough" in error_str or "insufficient" in error_str:
                        break
                    continue
                else:
                    # Re-raise unexpected errors
                    raise

            if result.success:
                # Get updated state
                post_state = result.game_state or get_state(game_id, player)
                post_player_id = get_player_id(player, post_state) if post_state else None
                post_player_data = post_state.get_player(post_player_id) if post_state and post_player_id else None

                post_ship = None
                if post_player_data:
                    post_ship = next((s for s in post_player_data.ships if s.id == ship.id), None)

                ship_status = post_ship.status if post_ship else 'unknown'

                # Handle hazard response if ship is awaiting_hazard
                ship_status = _check_and_handle_hazard(
                    client, player, game_id, ship.id, post_player_id, post_player_data, logger
                )

                # Determine launch outcome
                log_entries = get_last_log_entries(post_state, count=10) if post_state else []
                launch_outcome = _determine_launch_outcome(log_entries, ship.id, ship_status)

                action_str = f"LAUNCH {ship.id} → {route.id} ({gas_type})"
                print(f"    {player}: {action_str} [{launch_outcome}]")

                logger.log_action(player, action_str, "worker_placement")
                logger.log_action(None, f"  └─ {stats_str}", "worker_placement")
                logger.log_action(None, f"  └─ {route_str}", "worker_placement")
                logger.log_action(None, f"  └─ Outcome: {launch_outcome} (status={ship_status})", "worker_placement")

                # Update current officers after any launch attempt (officer consumed even if aborted)
                if post_player_data:
                    current_officers = post_player_data.officers or 0

                if launch_outcome == "SUCCESS" or ship_status == 'on_route':
                    routes_list = [r for r in routes_list if r.id != route.id]
                    launched += 1
                    faction = get_faction_from_player(player)
                    logger.track_route_claimed(route.name, faction)

                    # Check if we have officers left for more launches
                    if current_officers < officers_needed:
                        return launched
                break
            else:
                error_msg = result.error or "unknown error"
                print(f"    {player}: launch failed for {ship.id} to {route.id}")
                logger.log_action(player, f"LAUNCH FAILED {ship.id} → {route.id}", "worker_placement")
                logger.log_action(None, f"  └─ Error: {error_msg[:100]}", "worker_placement")

    return launched


def _no_more_launches(player: str, game_id: str, reason: str, logger: PlaytestLogger) -> None:
    """Signal no more launches with logging."""
    client = get_client()
    client.no_more_launches(player, game_id)
    print(f"    {player}: no launches ({reason})")
    logger.log_action(player, f"no launches ({reason})", "worker_placement")


def _no_more_launches_quiet(player: str, game_id: str) -> None:
    """Signal no more launches without logging."""
    client = get_client()
    try:
        client.no_more_launches(player, game_id)
    except Exception:
        pass


def _check_and_handle_hazard(client, player: str, game_id: str, ship_id: str, player_id: str | None, player_data: Player, logger: PlaytestLogger) -> str:
    """Check if ship needs hazard response and handle it.

    This function fetches raw state to check for pending hazards because
    the typed GameState model doesn't expose pendingHazard on ships.

    Args:
        client: UpshipClient instance.
        player: Player username.
        game_id: The game ID.
        ship_id: The ship ID.
        player_id: The player's UUID (may be None).
        player_data: Player object (for engineer count).
        logger: PlaytestLogger instance.

    Returns:
        Final ship status string after hazard resolution.
    """
    # Fetch raw state to get pendingHazard (not in typed model)
    raw_state = client._api_get(player, f"/api/state/{game_id}")
    game_state_wrapper = raw_state.get('gameState', raw_state)
    state_data = game_state_wrapper.get('state', {})
    players_data = state_data.get('players', {})

    # If player_id not provided, find it by faction
    if not player_id:
        faction = get_faction_from_player(player)
        for pid, pdata in players_data.items():
            if pdata.get('faction') == faction:
                player_id = pid
                break

    if not player_id:
        logger.log_action(None, f"  └─ ERROR: Could not find player_id for {player}", "worker_placement")
        return 'unknown'

    raw_player = players_data.get(player_id, {})
    raw_ships = raw_player.get('ships', [])
    raw_ship = next((s for s in raw_ships if s.get('id') == ship_id), None)

    if not raw_ship:
        # Debug: log available ships
        ship_ids = [s.get('id', 'unknown')[:20] for s in raw_ships]
        logger.log_action(None, f"  └─ ERROR: Ship {ship_id[:20]} not found. Available: {ship_ids}", "worker_placement")
        return 'unknown'

    ship_status = raw_ship.get('status', 'unknown')

    if ship_status != 'awaiting_hazard':
        return ship_status

    pending_hazard = raw_ship.get('pendingHazard')
    if not pending_hazard:
        logger.log_action(None, f"  └─ ERROR: Ship awaiting_hazard but no pendingHazard", "worker_placement")
        return ship_status

    # Handle the hazard response
    return _handle_hazard_response(player, game_id, ship_id, pending_hazard, player_data, logger)


def _handle_hazard_response(player: str, game_id: str, ship_id: str, pending_hazard: dict, player_data: Player, logger: PlaytestLogger) -> str:
    """Handle responding to a hazard check. Returns final ship status.

    Args:
        player: Player username.
        game_id: The game ID.
        ship_id: The ship ID.
        pending_hazard: Dict with hazard info.
        player_data: Player object.
        logger: PlaytestLogger instance.

    Returns:
        Final ship status string.
    """
    client = get_client()

    hazard_name = pending_hazard.get('name', 'Unknown')
    engineers_needed = pending_hazard.get('engineersNeeded', 0)
    engineer_cost = pending_hazard.get('engineerCost')
    auto_pass_reason = pending_hazard.get('autoPassReason')
    no_save = pending_hazard.get('noSave', False)
    available_engineers = player_data.engineers if player_data else 0

    spend_engineers = False
    if auto_pass_reason:
        spend_engineers = True
        hazard_decision = f"AUTO-PASS ({auto_pass_reason})"
    elif no_save:
        spend_engineers = False
        hazard_decision = "NO SAVE POSSIBLE"
    elif engineer_cost is not None:
        if available_engineers >= engineer_cost:
            spend_engineers = True
            hazard_decision = f"CONTROL FIRE (spend {engineer_cost} engineers)"
        else:
            spend_engineers = False
            hazard_decision = f"CRASH (need {engineer_cost} engineers, have {available_engineers})"
    elif engineers_needed == 0:
        spend_engineers = True
        hazard_decision = "PASS (stat sufficient)"
    elif available_engineers >= engineers_needed:
        spend_engineers = True
        hazard_decision = f"SPEND {engineers_needed} ENGINEERS"
    else:
        spend_engineers = False
        hazard_decision = f"ABORT (need {engineers_needed} engineers, have {available_engineers})"

    yn_decision = "Y" if spend_engineers else "N"
    if engineer_cost is not None:
        eng_info = f"cost={engineer_cost}, have={available_engineers}"
    elif engineers_needed > 0:
        eng_info = f"need={engineers_needed}, have={available_engineers}"
    else:
        eng_info = "none needed"

    logger.log_action(None, f"  └─ Hazard: {hazard_name} (engineers: {eng_info}) → {yn_decision} → {hazard_decision}", "worker_placement")

    # Send hazard response
    result = client.action(player, game_id, 'RESPOND_TO_HAZARD',
                          shipId=ship_id, spendEngineers=spend_engineers)

    # Get final ship status
    final_state = result.game_state or get_state(game_id, player)
    if final_state:
        final_player_id = get_player_id(player, final_state)
        final_player_data = final_state.get_player(final_player_id) if final_player_id else None
        if final_player_data:
            final_ship = next((s for s in final_player_data.ships if s.id == ship_id), None)
            if final_ship:
                return final_ship.status

    return 'unknown'


def _determine_launch_outcome(log_entries: list[dict], ship_id: str, ship_status: str) -> str:
    """Determine launch outcome from log entries and ship status.

    Args:
        log_entries: List of log entry dicts.
        ship_id: The ship ID.
        ship_status: Current ship status.

    Returns:
        Outcome string (SUCCESS, ABORTED, DESTROYED, etc.)
    """
    for entry in reversed(log_entries):
        msg = entry.get('message', '').lower()
        if 'hazard check passed' in msg:
            return "SUCCESS"
        elif 'launch aborted' in msg or 'returns to hangar' in msg:
            return "ABORTED"
        elif 'destroyed' in msg and ship_id in entry.get('message', ''):
            return "DESTROYED"

    if ship_status == 'on_route':
        return "SUCCESS"
    elif ship_status == 'destroyed':
        return "DESTROYED"
    elif ship_status in ('hangar', 'in_hangar'):
        return "ABORTED"
    elif ship_status == 'damaged':
        return "DAMAGED"
    elif ship_status == 'awaiting_hazard':
        return "AWAITING_HAZARD"
    return "unknown"


def submit_reveal(player: str, game_id: str, logger: PlaytestLogger, reason: str = "") -> None:
    """Submit atomic REVEAL action with tech/market acquisitions.

    Args:
        player: Player username.
        game_id: The game ID.
        logger: PlaytestLogger instance.
        reason: Optional reason string for logging.
    """
    client = get_client()

    # Get pre-state for comparison
    pre_state = get_state(game_id, player)
    pre_player_id = get_player_id(player, pre_state) if pre_state else None
    pre_player_data = pre_state.get_player(pre_player_id) if pre_state and pre_player_id else None
    pre_techs = set(pre_player_data.technologies or []) if pre_player_data else set()

    # Calculate acquisitions
    tech_ids, card_ids = get_reveal_acquisitions(player, game_id)

    # Submit reveal action
    result = client.reveal(player, game_id, tech_acquisitions=tech_ids or None)

    if result.success:
        # After revealing, send END_TURN to advance to next placer and finalize purchases
        end_result = client.end_turn(player, game_id)
        if not end_result.success:
            print(f"  {player}: END_TURN after reveal failed - {end_result.error}")

        post_state = result.game_state or get_state(game_id, player)
        post_player_id = get_player_id(player, post_state) if post_state else None
        post_player_data = post_state.get_player(post_player_id) if post_state and post_player_id else None

        post_techs = set(post_player_data.technologies or []) if post_player_data else set()
        new_techs = post_techs - pre_techs

        # Look for resources collected in log
        log_entries = get_last_log_entries(post_state, count=20, entry_type='reveal') if post_state else []
        resources_collected = None
        for entry in reversed(log_entries):
            msg = entry.get('message', '')
            faction = get_faction_from_player(player).upper()
            if faction in msg and 'collected' in msg.lower():
                resources_collected = msg
                break

        logger.log_player_turn()
        action_desc = f"REVEAL {reason}".strip()
        print(f"  {player}: {action_desc}")
        logger.log_action(player, action_desc, "reveal")

        if resources_collected:
            logger.log_action(None, f"  └─ {resources_collected}", "reveal")
            print(f"    └─ {resources_collected}")

        if new_techs:
            tech_list = ", ".join(new_techs)
            logger.log_action(None, f"  └─ Tech acquired: {tech_list}", "reveal")
            print(f"    └─ Tech acquired: {tech_list}")
            faction = get_faction_from_player(player)
            for tech in new_techs:
                logger.track_tech_acquired(tech, faction)

        if post_player_data:
            post_research = post_player_data.research or 0
            if post_research > 0:
                logger.log_action(None, f"  └─ Research remaining: {post_research}", "reveal")

            post_hand = post_player_data.hand or []
            if post_hand:
                hand_names = [c.name for c in post_hand[:5]]
                logger.log_action(None, f"  └─ Hand ({len(post_hand)} cards): {', '.join(hand_names)}", "reveal")
    else:
        error_msg = result.error or "unknown error"
        print(f"  {player}: reveal failed - {error_msg}")
        logger.log_action(player, f"REVEAL FAILED {reason}", "reveal")
        logger.log_action(None, f"  └─ Error: {error_msg[:100]}", "reveal")


def handle_worker_placement_round(game_id: str, logger: PlaytestLogger) -> bool:
    """Handle a complete worker placement round.

    Args:
        game_id: The game ID.
        logger: PlaytestLogger instance.

    Returns:
        True if phase changed.
    """
    initial_phase = get_phase(game_id)
    attempts = 0
    max_attempts = 30

    while attempts < max_attempts:
        attempts += 1
        current_phase = get_phase(game_id)
        if current_phase != "WORKER_PLACEMENT":
            return True

        current = get_current_placer(game_id)
        if not current:
            # get_current_placer returns None for:
            # 1. No worker placement state (phase might have changed)
            # 2. Human player's turn (they play in browser)
            if get_phase(game_id) != "WORKER_PLACEMENT":
                return True
            # Still in worker placement but no AI player - must be human's turn
            return False

        agents = get_player_agents(current, game_id)

        # Early reveal mode
        if EARLY_REVEAL_MODE:
            reveal_threshold = logger.get_early_reveal_threshold()
            if agents <= reveal_threshold:
                reason = f"(early reveal with {agents} agents, threshold={reveal_threshold})"
                submit_reveal(current, game_id, logger, reason)
                continue
        elif agents <= 0:
            submit_reveal(current, game_id, logger, "(out of agents)")
            continue

        hand = get_player_hand(current, game_id)
        locations = get_available_locations(game_id)
        result = find_strategic_placement(current, hand, locations, game_id, return_decision_info=True)

        if len(result) == 3:
            card, location, decision_info = result
        else:
            card, location = result
            decision_info = None

        if card and location:
            _execute_placement(current, game_id, card, location, logger, decision_info)
        else:
            submit_reveal(current, game_id, logger, "(no playable cards)")
            state = get_state(game_id, current)
            if state:
                logger.log_progress_status(state, current)

    return get_phase(game_id) != initial_phase


def _log_decision_info(player: str, decision_info: dict, logger: PlaytestLogger) -> None:
    """Log strategy decision details to help understand bot behavior.

    Args:
        player: Player username.
        decision_info: Dict with launch_eval, player_state, priority_reason, etc.
        logger: PlaytestLogger instance.
    """
    launch_eval = decision_info.get('launch_eval', {})
    player_state = decision_info.get('player_state', {})
    priority_reason = decision_info.get('priority_reason')
    chosen_location = decision_info.get('chosen_location')
    chosen_rank = decision_info.get('chosen_priority_rank', '?')

    # Build a concise status line
    hangar = player_state.get('hangar_ships', 0)
    officers = player_state.get('officers', 0)
    h2 = player_state.get('hydrogen', 0)
    he = player_state.get('helium', 0)
    age = decision_info.get('current_age', 1)
    routes = decision_info.get('routes_available', 0)

    can_launch = launch_eval.get('can_launch', False)
    missing = launch_eval.get('missing', [])

    # Log launch readiness
    if can_launch:
        status_str = f"LAUNCH READY (hangar={hangar}, officers={officers}, gas={h2}H₂+{he}He, routes={routes})"
        logger.log_action(None, f"  └─ Strategy: {status_str}", "worker_placement")
    elif missing:
        missing_str = "; ".join(missing[:3])  # First 3 reasons
        status_str = f"NOT LAUNCH READY: {missing_str}"
        logger.log_action(None, f"  └─ Strategy: {status_str}", "worker_placement")
        # Also log player state for context
        state_str = f"State: hangar={hangar}, officers={officers}/{age}needed, gas={h2}H₂+{he}He, routes={routes}"
        logger.log_action(None, f"  └─ {state_str}", "worker_placement")

    # Log why this location was chosen
    if chosen_location != 'launchpad' and priority_reason:
        priorities = launch_eval.get('priorities', [])[:5]
        if priorities:
            logger.log_action(None, f"  └─ Priorities: {' → '.join(priorities)}", "worker_placement")


def _execute_placement(player: str, game_id: str, card: dict, location: dict, logger: PlaytestLogger, decision_info: dict | None = None) -> None:
    """Execute a single agent placement action.

    Args:
        player: Player username.
        game_id: The game ID.
        card: Card dict with 'index', 'name', 'symbol'.
        location: Location dict with 'id', 'symbol'.
        logger: PlaytestLogger instance.
        decision_info: Optional dict with strategy decision details.
    """
    client = get_client()

    # Get pre-state for comparison
    pre_state = get_state(game_id, player)
    pre_player_id = get_player_id(player, pre_state) if pre_state else None
    pre_player_data = pre_state.get_player(pre_player_id) if pre_state and pre_player_id else None
    pre_blueprint = get_blueprint_stats(pre_player_data) if pre_player_data else {}
    pre_ships = len(pre_player_data.ships) if pre_player_data else 0
    pre_gas = pre_player_data.gas_cubes if pre_player_data else {}

    action_desc = f"placed at {location['id']} using {card['name']}"

    # Build action kwargs based on location
    kwargs: dict[str, Any] = {}
    loc_id = location['id']

    if loc_id == 'construction_hall':
        kwargs['buildCount'] = 1
        action_desc = f"placed at {loc_id} and built ship"
    elif loc_id == 'design_bureau':
        current_age = pre_state.age if pre_state else 1
        blueprint = get_design_bureau_blueprint(pre_player_data, current_age) if pre_player_data else None
        if blueprint:
            kwargs['blueprint'] = blueprint
            action_desc = f"placed at {loc_id} and updated blueprint"
    elif loc_id == 'gas_depot':
        gas_type = "helium" if player == "playtest_usa" else "hydrogen"
        kwargs['gasType'] = gas_type
        kwargs['gasAmount'] = 3
        action_desc = f"placed at {loc_id} and bought 3 {gas_type}"
    elif loc_id == 'academy':
        kwargs['crewType'] = 'officer'
        kwargs['crewCount'] = 1
        action_desc = f"placed at {loc_id} and recruited 1 officer"
    elif loc_id == 'flight_school':
        kwargs['levels'] = 1
        action_desc = f"placed at {loc_id} and upgraded officer income"
    elif loc_id == 'technical_institute':
        kwargs['levels'] = 1
        action_desc = f"placed at {loc_id} and upgraded engineer income"
    elif loc_id == 'insurance_bureau':
        kwargs['policyCount'] = 1
        action_desc = f"placed at {loc_id} and bought insurance"
    elif loc_id == 'government_liaison':
        kwargs['officerCount'] = 1
        action_desc = f"placed at {loc_id} and spent 1 officer for income"
    elif loc_id == 'research_institute':
        kwargs['levels'] = 1
        action_desc = f"placed at {loc_id} and upgraded research level"
    elif loc_id == 'launchpad':
        action_desc = f"placed at {loc_id} (launching ships next)"

    # Execute the placement
    result = client.place_agent(player, game_id, loc_id, card['index'], **kwargs)

    if result.success:
        logger.log_player_turn()
        print(f"  {player}: {action_desc}")
        logger.log_action(player, action_desc, "worker_placement")

        # Log decision info if available (shows why this location was chosen)
        if decision_info:
            _log_decision_info(player, decision_info, logger)

        # Get post-state for comparison
        post_state = result.game_state or get_state(game_id, player)
        post_player_id = get_player_id(player, post_state) if post_state else None
        post_player_data = post_state.get_player(post_player_id) if post_state and post_player_id else None
        post_blueprint = get_blueprint_stats(post_player_data) if post_player_data else {}
        post_ships = len(post_player_data.ships) if post_player_data else 0
        post_gas = post_player_data.gas_cubes if post_player_data else {}

        logger.log_action(None, f"  └─ Card: {card['name']} ({card['symbol']})", "worker_placement")

        if loc_id == 'design_bureau':
            bp_changes = []
            for key in ['lift', 'weight', 'range', 'speed', 'ceiling', 'cargo']:
                if pre_blueprint.get(key, 0) != post_blueprint.get(key, 0):
                    bp_changes.append(f"{key}: {pre_blueprint.get(key, 0)} → {post_blueprint.get(key, 0)}")
            if bp_changes:
                logger.log_action(None, f"  └─ Blueprint changes: {', '.join(bp_changes)}", "worker_placement")
            logger.log_action(None, f"  └─ {format_blueprint_log(post_blueprint)}", "worker_placement")

        if loc_id == 'construction_hall' and post_ships > pre_ships:
            if post_player_data and post_player_data.ships:
                new_ship = post_player_data.ships[-1]
                ship_id = new_ship.id
                logger.log_action(None, f"  └─ New ship: {ship_id}", "worker_placement")
                logger.log_action(None, f"  └─ {format_blueprint_log(post_blueprint)}", "worker_placement")

        if loc_id == 'gas_depot':
            h2_before = pre_gas.get('hydrogen', 0)
            h2_after = post_gas.get('hydrogen', 0)
            he_before = pre_gas.get('helium', 0)
            he_after = post_gas.get('helium', 0)
            if h2_after != h2_before:
                logger.log_action(None, f"  └─ Hydrogen: {h2_before} → {h2_after}", "worker_placement")
            if he_after != he_before:
                logger.log_action(None, f"  └─ Helium: {he_before} → {he_after}", "worker_placement")

        if loc_id == 'launchpad':
            handle_launchpad_launches(player, game_id, logger)

        if post_state:
            logger.log_progress_status(post_state, player)
    else:
        submit_reveal(player, game_id, logger, "(placement failed)")
        state = get_state(game_id, player)
        if state:
            logger.log_progress_status(state, player)


def handle_reveal_phase(game_id: str, logger: PlaytestLogger) -> None:
    """Handle the reveal phase.

    All players need to call END_TURN to signal they're done with tech/market
    purchases. When all players have done this, the server transitions to
    income_cleanup.

    Args:
        game_id: The game ID.
        logger: PlaytestLogger instance.
    """
    client = get_client()

    print("--- Reveal Phase ---")
    logger.log_action(None, "Reveal phase - collecting resources and processing acquisitions", "reveal")

    # Only AI players end turn - human players do this in the browser
    for player in PLAYERS:
        if is_ai_player(player):
            try:
                client.end_turn(player, game_id)
            except Exception:
                pass  # Player might not be in this game

    logger.log_action(None, "Reveal phase complete (AI players)", "reveal")


def handle_income_cleanup_phase(game_id: str, logger: PlaytestLogger) -> None:
    """Handle income and cleanup - all players end turn in order.

    During income_cleanup, the server expects players to end turn in the
    player order (round-robin). We call end_turn for each AI player in turn
    until all have completed and the phase transitions.

    In interactive games, human players must end turn in the browser.

    Args:
        game_id: The game ID.
        logger: PlaytestLogger instance.
    """
    # Only process if we're actually in income_cleanup phase
    if get_phase(game_id) != "INCOME_CLEANUP":
        return

    client = get_client()

    # Keep calling end_turn until phase changes
    max_iterations = 10  # Safety limit
    for _ in range(max_iterations):
        if get_phase(game_id) != "INCOME_CLEANUP":
            break

        state = get_state(game_id)
        if not state:
            break

        # Get current player (the one whose turn it is)
        current_idx = state.current_player_index
        if current_idx < 0 or current_idx >= len(state.player_order):
            break

        current_player_id = state.player_order[current_idx]

        # Find the username for this player ID
        current_username = None
        for player in PLAYERS:
            player_data = state.players.get(current_player_id)
            if player_data and player_data.faction:
                faction = player_data.faction.lower()
                if f"playtest_{faction}" == player:
                    current_username = player
                    break

        if not current_username:
            # Current player might be a human - skip and return
            # Human must end turn in browser
            break
        elif is_ai_player(current_username):
            try:
                client.end_turn(current_username, game_id)
            except Exception:
                pass
        else:
            # Human player's turn - stop and let them play
            break

    print("  AI players collected income")


def handle_age_transition_design_bureau(game_id: str, logger: PlaytestLogger) -> bool:
    """Handle the age transition Design Bureau phase.

    Each player gets a free Design Bureau action (no Hull Upgrade Rule charges).
    Players take turns installing upgrades using their faction swap limit.

    Args:
        game_id: The game ID.
        logger: PlaytestLogger instance.

    Returns:
        True if phase completed (all players done).
    """
    client = get_client()

    # Get current state
    state = get_state(game_id)
    if not state:
        return False

    # Get raw state for transition info
    try:
        raw_state = client._api_get("playtest_germany", f"/api/state/{game_id}")
        game_state_wrapper = raw_state.get('gameState', raw_state)
        state_data = game_state_wrapper.get('state', {})
        transition_info = state_data.get('ageTransitionDesignBureau', {})
    except Exception:
        return False

    if not transition_info:
        return False

    current_idx = transition_info.get('currentPlayerIndex', 0)
    new_age = transition_info.get('newAge', 2)
    completed_players = transition_info.get('completedPlayers', [])

    # Get current player ID
    if current_idx >= len(state.player_order):
        return True  # All done

    current_player_id = state.player_order[current_idx]

    # Find username for this player
    current_username = None
    for player in PLAYERS:
        player_data = state.players.get(current_player_id)
        if player_data and player_data.faction:
            faction = player_data.faction.lower()
            if f"playtest_{faction}" == player:
                current_username = player
                break

    if not current_username:
        # Try to find by faction
        for player in PLAYERS:
            expected_faction = player.replace("playtest_", "")
            player_data = state.get_player(current_player_id)
            if player_data and player_data.faction == expected_faction:
                current_username = player
                break

    if not current_username:
        # Current player is not an AI player (might be human)
        # Return False to let human player take their turn in browser
        return False

    if not is_ai_player(current_username):
        # Human player's turn - wait for them
        return False

    # Get player data
    player_data = get_player_data(current_username, game_id)
    if not player_data:
        return False

    # Calculate desired blueprint for this player
    # new_age is the age we're transitioning TO, so that's the appropriate priority
    # is_age_transition=True ensures structural slots are filled first
    blueprint = get_design_bureau_blueprint(player_data, new_age, is_age_transition=True)

    # Submit the action
    result = client.action(current_username, game_id, 'AGE_TRANSITION_DESIGN_BUREAU', blueprint=blueprint)

    if result.success:
        faction = get_faction_from_player(current_username).upper()
        if blueprint:
            print(f"  {current_username}: Age {new_age} blueprint updated")
            logger.log_action(current_username, f"Age {new_age} blueprint updated", "age_transition")
        else:
            print(f"  {current_username}: Age {new_age} blueprint unchanged")
            logger.log_action(current_username, f"Age {new_age} blueprint unchanged", "age_transition")
        return True
    else:
        error_msg = result.error or "unknown error"
        print(f"  {current_username}: free upgrade failed - {error_msg}")
        logger.log_action(current_username, f"Age {new_age} free upgrade FAILED", "age_transition")
        logger.log_action(None, f"  └─ Error: {error_msg[:100]}", "age_transition")

        # Enhanced diagnostics for mandatory slot fill failures
        if player_data and player_data.blueprint:
            bp = player_data.blueprint
            frame_empty = [i for i, s in enumerate(bp.frame_slots or []) if s is None]
            fabric_empty = [i for i, s in enumerate(bp.fabric_slots or []) if s is None]
            if frame_empty or fabric_empty:
                logger.log_action(None, f"  └─ Empty slots: Frame={frame_empty}, Fabric={fabric_empty}", "age_transition")
                logger.log_action(None, f"  └─ Technologies: {player_data.technologies or []}", "age_transition")
                logger.log_action(None, f"  └─ Attempted blueprint: {blueprint}", "age_transition")
        return False
