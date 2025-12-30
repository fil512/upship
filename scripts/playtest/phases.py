"""Game phase handlers for worker placement, reveal, and income/cleanup."""

import json
import time

from .config import PLAYERS, EARLY_REVEAL_MODE
from .cli import run_cli, strip_ansi, get_full_state
from .logging import get_logger
from .state import (
    get_phase, get_player_agents, get_player_hand, get_available_locations,
    get_current_placer, get_available_routes, get_player_id, get_ship_details,
    get_blueprint_stats, format_blueprint_log, get_last_log_entries, get_gas_preference
)
from .strategy import (
    find_strategic_placement, get_design_bureau_swaps, get_reveal_acquisitions
)


def handle_launchpad_launches(player, game_id, logger):
    """Handle the multi-step launchpad: launch ships and call NO_MORE_LAUNCHES."""
    pre_state, _ = get_full_state(game_id, player)
    player_id = get_player_id(player, pre_state) if pre_state else None
    player_data = pre_state.get('players', {}).get(player_id, {}) if pre_state and player_id else {}

    hangar_ships = []
    for ship in player_data.get('ships', []):
        if ship.get('status') == 'hangar':
            hangar_ships.append({
                'id': ship.get('id'),
                'range': ship.get('stats', {}).get('range', 1),
                'speed': ship.get('stats', {}).get('speed', 1)
            })

    if not hangar_ships:
        run_cli(player, "nolaunches", game_id)
        print(f"    {player}: no launches (no ships in hangar)")
        logger.log_action(player, "no launches (no ships in hangar)", "worker_placement")
        return

    routes = get_available_routes(game_id)
    if not routes:
        run_cli(player, "nolaunches", game_id)
        print(f"    {player}: no launches (no routes available)")
        logger.log_action(player, "no launches (no routes available)", "worker_placement")
        return

    # Check blueprint slot requirements
    blueprint = player_data.get('blueprint', {})
    frame_slots = blueprint.get('frameSlots', [])
    fabric_slots = blueprint.get('fabricSlots', [])
    empty_frame = sum(1 for s in frame_slots if s is None)
    empty_fabric = sum(1 for s in fabric_slots if s is None)

    if empty_frame > 0 or empty_fabric > 0:
        run_cli(player, "nolaunches", game_id)
        slot_msg = []
        if empty_frame > 0:
            slot_msg.append(f"{empty_frame} Frame")
        if empty_fabric > 0:
            slot_msg.append(f"{empty_fabric} Fabric")
        print(f"    {player}: no launches ({' and '.join(slot_msg)} slot(s) empty)")
        logger.log_action(player, f"no launches ({' and '.join(slot_msg)} slot(s) empty)", "worker_placement")
        return

    # Check officer requirements
    current_age = pre_state.get('age', 1) if pre_state else 1
    officers_needed = current_age
    available_officers = player_data.get('officers', 0)

    if available_officers < officers_needed:
        run_cli(player, "nolaunches", game_id)
        print(f"    {player}: no launches (need {officers_needed} officer(s) for Age {current_age}, have {available_officers})")
        logger.log_action(player, f"no launches (need {officers_needed} officer(s), have {available_officers})", "worker_placement")
        return

    # Check gas availability
    gas_cubes = player_data.get('gasCubes', {})
    total_gas = gas_cubes.get('hydrogen', 0) + gas_cubes.get('helium', 0)

    if total_gas < 1:
        run_cli(player, "nolaunches", game_id)
        print(f"    {player}: no launches (no gas available)")
        logger.log_action(player, "no launches (no gas available)", "worker_placement")
        return

    routes.sort(key=lambda r: (r.get('distance', 1), r.get('speed', 1)))

    launched = 0
    for ship in hangar_ships[:]:
        ship_obj = next((s for s in player_data.get('ships', []) if s.get('id') == ship['id']), None)
        ship_stats = get_ship_details(ship_obj, player_data) if ship_obj else None

        for route in routes[:]:
            gas_type = get_gas_preference(player, game_id)

            if ship_stats:
                stats_str = (f"Ship: Lift={ship_stats['lift']} Weight={ship_stats['weight']} "
                            f"Gas={ship_stats['required_gas']} Range={ship_stats['range']} "
                            f"Speed={ship_stats['speed']} Rel={ship_stats.get('reliability', 0)}")
                route_str = (f"Route: {route['name']} (dist={route['distance']}, "
                            f"speed={route['speed']}, income=+{route['income']})")
            else:
                stats_str = "Ship stats: unknown"
                route_str = f"Route: {route['id']}"

            result = strip_ansi(run_cli(player, "launch", game_id, ship['id'], route['id'], gas_type))

            if "✓" in result or "success" in result.lower():
                post_state, _ = get_full_state(game_id, player)
                post_player_id = get_player_id(player, post_state) if post_state else None
                post_player_data = post_state.get('players', {}).get(post_player_id, {}) if post_state and post_player_id else {}

                post_ship = next((s for s in post_player_data.get('ships', []) if s.get('id') == ship['id']), None)
                ship_status = post_ship.get('status', 'unknown') if post_ship else 'unknown'

                # Handle hazard response
                pending_hazard = post_ship.get('pendingHazard') if post_ship else None
                if ship_status == 'awaiting_hazard' and pending_hazard:
                    ship_status = _handle_hazard_response(player, game_id, ship, pending_hazard, post_player_data, logger)

                # Determine launch outcome
                log_entries = get_last_log_entries(post_state, count=10) if post_state else []
                launch_outcome = _determine_launch_outcome(log_entries, ship, ship_status)

                action_str = f"LAUNCH {ship['id']} → {route['id']} ({gas_type})"
                print(f"    {player}: {action_str} [{launch_outcome}]")

                logger.log_action(player, action_str, "worker_placement")
                logger.log_action(None, f"  └─ {stats_str}", "worker_placement")
                logger.log_action(None, f"  └─ {route_str}", "worker_placement")
                logger.log_action(None, f"  └─ Outcome: {launch_outcome} (status={ship_status})", "worker_placement")

                if launch_outcome == "SUCCESS" or ship_status == 'on_route':
                    routes.remove(route)
                    launched += 1
                    faction = player.replace('playtest_', '')
                    logger.track_route_claimed(route.get('name', route['id']), faction)

                    post_officers = post_player_data.get('officers', 0)
                    if post_officers < officers_needed:
                        print(f"    {player}: stopping launches (only {post_officers} officer(s) left)")
                        run_cli(player, "nolaunches", game_id)
                        print(f"    {player}: done launching ({launched} ships)")
                        return
                break
            else:
                print(f"    {player}: launch failed for {ship['id']} to {route['id']}")
                logger.log_action(player, f"LAUNCH FAILED {ship['id']} → {route['id']}", "worker_placement")
                logger.log_action(None, f"  └─ Error: {result[:100]}", "worker_placement")

    run_cli(player, "nolaunches", game_id)
    print(f"    {player}: done launching ({launched} ships)")
    logger.log_action(player, f"done launching ({launched} ships)", "worker_placement")


def _handle_hazard_response(player, game_id, ship, pending_hazard, player_data, logger):
    """Handle responding to a hazard check. Returns final ship status."""
    hazard_name = pending_hazard.get('name', 'Unknown')
    engineers_needed = pending_hazard.get('engineersNeeded', 0)
    engineer_cost = pending_hazard.get('engineerCost')
    auto_pass_reason = pending_hazard.get('autoPassReason')
    no_save = pending_hazard.get('noSave', False)
    available_engineers = player_data.get('engineers', 0)

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

    run_cli(player, "action", game_id, "RESPOND_TO_HAZARD",
            f"shipId={ship['id']}", f"spendEngineers={str(spend_engineers).lower()}")

    final_state, _ = get_full_state(game_id, player)
    final_player_id = get_player_id(player, final_state) if final_state else None
    final_player_data = final_state.get('players', {}).get(final_player_id, {}) if final_state and final_player_id else {}
    final_ship = next((s for s in final_player_data.get('ships', []) if s.get('id') == ship['id']), None)
    return final_ship.get('status', 'unknown') if final_ship else 'unknown'


def _determine_launch_outcome(log_entries, ship, ship_status):
    """Determine launch outcome from log entries and ship status."""
    for entry in reversed(log_entries):
        msg = entry.get('message', '').lower()
        if 'hazard check passed' in msg:
            return "SUCCESS"
        elif 'launch aborted' in msg or 'returns to hangar' in msg:
            return "ABORTED"
        elif 'destroyed' in msg and ship['id'] in entry.get('message', ''):
            return "DESTROYED"

    if ship_status == 'on_route':
        return "SUCCESS"
    elif ship_status == 'destroyed':
        return "DESTROYED"
    elif ship_status == 'hangar':
        return "ABORTED"
    elif ship_status == 'damaged':
        return "DAMAGED"
    elif ship_status == 'awaiting_hazard':
        return "AWAITING_HAZARD"
    return "unknown"


def submit_reveal(player, game_id, logger, reason=""):
    """Submit atomic REVEAL action with tech/market acquisitions."""
    pre_state, _ = get_full_state(game_id, player)
    pre_player_id = get_player_id(player, pre_state) if pre_state else None
    pre_player_data = pre_state.get('players', {}).get(pre_player_id, {}) if pre_state and pre_player_id else {}
    pre_techs = set(t.get('id', t) if isinstance(t, dict) else t for t in pre_player_data.get('technologies', []))

    tech_ids, card_ids = get_reveal_acquisitions(player, game_id)

    reveal_args = [player, "reveal", game_id]
    if tech_ids:
        reveal_args.append(",".join(tech_ids))
    else:
        reveal_args.append("")
    if card_ids:
        reveal_args.append(",".join(card_ids))

    result = strip_ansi(run_cli(*reveal_args))

    if "✓" in result or "success" in result.lower():
        post_state, _ = get_full_state(game_id, player)
        post_player_id = get_player_id(player, post_state) if post_state else None
        post_player_data = post_state.get('players', {}).get(post_player_id, {}) if post_state and post_player_id else {}

        post_techs = set(t.get('id', t) if isinstance(t, dict) else t for t in post_player_data.get('technologies', []))
        new_techs = post_techs - pre_techs

        log_entries = get_last_log_entries(post_state, count=20, entry_type='reveal') if post_state else []
        resources_collected = None
        for entry in reversed(log_entries):
            msg = entry.get('message', '')
            faction = player.replace('playtest_', '').upper()
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
            faction = player.replace('playtest_', '')
            for tech in new_techs:
                logger.track_tech_acquired(tech, faction)

        post_research = post_player_data.get('research', 0)
        if post_research > 0:
            logger.log_action(None, f"  └─ Research remaining: {post_research}", "reveal")

        post_hand = post_player_data.get('hand', [])
        if post_hand:
            hand_names = [c.get('name', 'card') for c in post_hand[:5]]
            logger.log_action(None, f"  └─ Hand ({len(post_hand)} cards): {', '.join(hand_names)}", "reveal")
    else:
        print(f"  {player}: reveal failed - {result}")
        logger.log_action(player, f"REVEAL FAILED {reason}", "reveal")
        logger.log_action(None, f"  └─ Error: {result[:100]}", "reveal")


def handle_worker_placement_round(game_id, logger):
    """Handle a complete worker placement round. Returns True if phase changed."""
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
            time.sleep(0.3)
            if get_phase(game_id) != "WORKER_PLACEMENT":
                return True
            continue

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
        card, location = find_strategic_placement(current, hand, locations, game_id)

        if card and location:
            _execute_placement(current, game_id, card, location, logger)
        else:
            submit_reveal(current, game_id, logger, "(no playable cards)")
            state, _ = get_full_state(game_id, current)
            if state:
                logger.log_progress_status(state, current)

    return get_phase(game_id) != initial_phase


def _execute_placement(player, game_id, card, location, logger):
    """Execute a single agent placement action."""
    pre_state, _ = get_full_state(game_id, player)
    pre_player_id = get_player_id(player, pre_state) if pre_state else None
    pre_player_data = pre_state.get('players', {}).get(pre_player_id, {}) if pre_state and pre_player_id else {}
    pre_blueprint = get_blueprint_stats(pre_player_data)
    pre_ships = len(pre_player_data.get('ships', []))
    pre_gas = pre_player_data.get('gasCubes', {})

    action_args = [player, "action", game_id, "PLACE_AGENT",
                  f"locationId={location['id']}", f"cardIndex={card['index']}"]

    action_desc = f"placed at {location['id']} using {card['name']}"

    # Add location-specific parameters
    if location['id'] == 'construction_hall':
        action_args.append("buildCount=1")
        action_desc = f"placed at {location['id']} and built ship"
    elif location['id'] == 'design_bureau':
        swaps = get_design_bureau_swaps(pre_player_data)
        if swaps:
            swaps_json = json.dumps(swaps)
            action_args.append(f"swaps={swaps_json}")
            upgrade_names = [s['upgradeId'] for s in swaps]
            action_desc = f"placed at {location['id']} and installed {', '.join(upgrade_names)}"
    elif location['id'] == 'gas_depot':
        gas_type = "helium" if player == "playtest_usa" else "hydrogen"
        action_args.append(f"gasType={gas_type}")
        action_args.append("gasAmount=3")
        action_desc = f"placed at {location['id']} and bought 3 {gas_type}"
    elif location['id'] == 'academy':
        action_args.append("crewType=officer")
        action_args.append("crewCount=1")
        action_desc = f"placed at {location['id']} and recruited 1 officer"
    elif location['id'] == 'flight_school':
        action_args.append("levels=1")
        action_desc = f"placed at {location['id']} and upgraded officer income"
    elif location['id'] == 'technical_institute':
        action_args.append("levels=1")
        action_desc = f"placed at {location['id']} and upgraded engineer income"
    elif location['id'] == 'insurance_bureau':
        action_args.append("policyCount=1")
        action_desc = f"placed at {location['id']} and bought insurance"
    elif location['id'] == 'government_liaison':
        action_args.append("officerCount=1")
        action_desc = f"placed at {location['id']} and spent 1 officer for income"
    elif location['id'] == 'research_institute':
        action_args.append("levels=1")
        action_desc = f"placed at {location['id']} and upgraded research level"
    elif location['id'] == 'launchpad':
        action_desc = f"placed at {location['id']} (launching ships next)"

    result = strip_ansi(run_cli(*action_args))
    if "✓" in result or "success" in result.lower():
        logger.log_player_turn()
        print(f"  {player}: {action_desc}")
        logger.log_action(player, action_desc, "worker_placement")

        # Log additional details
        post_state, _ = get_full_state(game_id, player)
        post_player_id = get_player_id(player, post_state) if post_state else None
        post_player_data = post_state.get('players', {}).get(post_player_id, {}) if post_state and post_player_id else {}
        post_blueprint = get_blueprint_stats(post_player_data)
        post_ships = len(post_player_data.get('ships', []))
        post_gas = post_player_data.get('gasCubes', {})

        logger.log_action(None, f"  └─ Card: {card['name']} ({card['symbol']})", "worker_placement")

        if location['id'] == 'design_bureau':
            bp_changes = []
            for key in ['lift', 'weight', 'range', 'speed', 'ceiling', 'cargo']:
                if pre_blueprint.get(key, 0) != post_blueprint.get(key, 0):
                    bp_changes.append(f"{key}: {pre_blueprint.get(key, 0)} → {post_blueprint.get(key, 0)}")
            if bp_changes:
                logger.log_action(None, f"  └─ Blueprint changes: {', '.join(bp_changes)}", "worker_placement")
            logger.log_action(None, f"  └─ {format_blueprint_log(post_blueprint)}", "worker_placement")

        if location['id'] == 'construction_hall' and post_ships > pre_ships:
            new_ship = post_player_data.get('ships', [])[-1] if post_player_data.get('ships') else None
            if new_ship:
                ship_id = new_ship.get('id', 'unknown')
                logger.log_action(None, f"  └─ New ship: {ship_id}", "worker_placement")
                logger.log_action(None, f"  └─ {format_blueprint_log(post_blueprint)}", "worker_placement")

        if location['id'] == 'gas_depot':
            h2_before = pre_gas.get('hydrogen', 0)
            h2_after = post_gas.get('hydrogen', 0)
            he_before = pre_gas.get('helium', 0)
            he_after = post_gas.get('helium', 0)
            if h2_after != h2_before:
                logger.log_action(None, f"  └─ Hydrogen: {h2_before} → {h2_after}", "worker_placement")
            if he_after != he_before:
                logger.log_action(None, f"  └─ Helium: {he_before} → {he_after}", "worker_placement")

        if location['id'] == 'launchpad':
            handle_launchpad_launches(player, game_id, logger)

        if post_state:
            logger.log_progress_status(post_state, player)
    else:
        submit_reveal(player, game_id, logger, "(placement failed)")
        state, _ = get_full_state(game_id, player)
        if state:
            logger.log_progress_status(state, player)


def handle_reveal_phase(game_id, logger):
    """Handle the reveal phase."""
    print("--- Reveal Phase ---")
    logger.log_action(None, "Reveal phase - collecting resources and processing acquisitions", "reveal")

    for _ in range(10):
        if get_phase(game_id) != "REVEAL":
            logger.log_action(None, "Reveal phase complete", "reveal")
            break
        time.sleep(0.3)


def handle_income_cleanup_phase(game_id, logger):
    """Handle income and cleanup - all players end turn."""
    print("--- Income & Cleanup Phase ---")
    for player in PLAYERS:
        run_cli(player, "endturn", game_id)
    print("  All players collected income")

    for _ in range(10):
        if get_phase(game_id) != "INCOME_CLEANUP":
            break
        time.sleep(0.3)
