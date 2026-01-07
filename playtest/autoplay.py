"""Main autoplay game loop and stuck detection.

This module provides the main autoplay loop for autonomous playtesting,
including stuck detection to identify when the game gets into an unplayable state.
"""

import json
import time
from typing import Any

from client import GameState

from .config import PLAYERS, DEFAULT_MAX_TURNS
from .client import get_client, get_game_id, login_all_players, get_faction_from_player
from .logging import get_logger
from .state import get_state, get_phase, get_age, check_game_ended, get_state_fingerprint, get_current_placer, get_current_placer_faction
from .phases import (
    handle_worker_placement_round, handle_reveal_phase, handle_income_cleanup_phase,
    handle_age_transition_blueprint_design
)
from .display import show_summary
from .shared_state import init_shared_state


class StuckDetector:
    """Detects when the game is stuck in the same state.

    Tracks a rolling window of state fingerprints and alerts when
    all fingerprints are identical, indicating no progress.
    """

    def __init__(self, threshold: int = 10):
        """Initialize the stuck detector.

        Args:
            threshold: Number of identical fingerprints to trigger stuck detection.
        """
        self.threshold = threshold
        self.fingerprints: list[str] = []

    def check(self, game_id: str) -> tuple[bool, str | None]:
        """Check if game appears stuck.

        Args:
            game_id: The game ID to check.

        Returns:
            Tuple of (is_stuck, details_string_or_none)
        """
        fingerprint, state = get_state_fingerprint(game_id)
        self.fingerprints.append(fingerprint)

        if len(self.fingerprints) > self.threshold:
            self.fingerprints = self.fingerprints[-self.threshold:]

        if len(self.fingerprints) >= self.threshold:
            if len(set(self.fingerprints)) == 1:
                details = self._build_verbose_report(game_id, state, fingerprint)
                return True, details
        return False, None

    def reset(self) -> None:
        """Reset the stuck detector after successful phase change."""
        self.fingerprints = []

    def _build_verbose_report(self, game_id: str, state: GameState | None, fingerprint: str) -> str:
        """Build a verbose diagnostic report when stuck.

        Args:
            game_id: The game ID.
            state: GameState object if available.
            fingerprint: The repeated state fingerprint.

        Returns:
            Formatted diagnostic string.
        """
        lines = []
        lines.append(f"\n{'='*60}")
        lines.append("GAME STUCK - VERBOSE DIAGNOSTIC REPORT")
        lines.append(f"{'='*60}")
        lines.append(f"\nState fingerprint: {fingerprint}")

        if state:
            lines.append(f"\nPhase: {state.phase}")
            lines.append(f"Age: {state.age} | Round: {state.round}")
            lines.append(f"Progress Track: {state.progress_track}")

            wp = state.worker_placement
            if wp:
                lines.append(f"\nWorker Placement Status:")
                lines.append(f"  Current Placer Index: {wp.current_placer_index}")
                lines.append(f"  Placement Order: {wp.placement_order[:4]}...")

            lines.append(f"\nPlayer Resources:")
            for uid, player in state.players.items():
                faction = (player.faction or 'unknown').upper()
                cash = player.cash or 0
                income = player.income or 0
                agents = player.agents_remaining or 0
                h2 = player.gas_cubes.get('hydrogen', 0) if player.gas_cubes else 0
                he = player.gas_cubes.get('helium', 0) if player.gas_cubes else 0
                ships = len(player.ships or [])
                hand = len(player.hand or [])
                passed = player.has_passed
                lines.append(f"  {faction}: £{cash}, Income:{income}, Agents:{agents}, H2:{h2}, He:{he}, Ships:{ships}, Hand:{hand}, Passed:{passed}")

            placements = state.ground_board.get('placements', {}) if state.ground_board else {}
            if placements:
                lines.append(f"\nGround Board Placements ({len(placements)}):")
                for loc, info in placements.items():
                    lines.append(f"  {loc}: {info}")
            else:
                lines.append("\nGround Board: No placements")

            available_routes = [r for r in state.routes if r.available]
            lines.append(f"\nAvailable Routes ({len(available_routes)}):")
            for route in available_routes[:5]:
                lines.append(f"  {route.id}: Range>={route.distance}, Speed>={route.speed_requirement}")

        lines.append(f"\n{'='*60}")
        lines.append("POSSIBLE CAUSES:")
        lines.append("  - No player can make a valid move (check hand/locations)")
        lines.append("  - All players passed but phase didn't advance")
        lines.append("  - Action validation blocking all moves")
        lines.append("  - Phase transition logic bug")
        lines.append(f"{'='*60}")

        return '\n'.join(lines)


def autoplay(num_turns: int | None = None, game_id: str | None = None) -> None:
    """Run AI for all players until game ends or gets stuck.

    Args:
        num_turns: Maximum turns to play (None = use DEFAULT_MAX_TURNS)
        game_id: Game ID (uses current game if None)
    """
    client = get_client()

    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    if num_turns is None:
        num_turns = DEFAULT_MAX_TURNS

    print(f"=== UP SHIP! Autoplay ===")
    print(f"Game: {game_id}")
    print(f"Target: {num_turns} turns (max)\n")

    logger = get_logger()
    if not logger.log_file:
        if not logger.load_log_file():
            logger.init_log_file(game_id)
        logger.log_action(None, "Autoplay started", "setup")

    login_all_players()

    # Initialize shared state for routes/missions tracking
    init_shared_state(game_id)

    stuck_detector = StuckDetector(threshold=10)
    turn_count = 0
    max_iterations = 1000
    iteration = 0
    last_phase = None
    last_age = get_age(game_id)

    while iteration < max_iterations:
        iteration += 1

        # Check for game end
        end_status = check_game_ended(game_id)
        if end_status['ended']:
            print(f"\n{'='*60}")
            print(f"GAME ENDED!")
            print(f"Winner: {end_status['winner']}")
            print(f"Reason: {end_status['reason']}")
            logger.log_action(None, f"GAME ENDED - Winner: {end_status['winner']}", "end")
            if end_status['scores']:
                print("\nFinal Scores:")
                for pid, score_data in end_status['scores'].items():
                    faction = score_data.get('faction', 'unknown').upper()
                    total = score_data.get('total', 0)
                    print(f"  {faction}: {total} VP")
                    logger.log_action(None, f"Final score: {faction} = {total} VP", "end")
            print(f"{'='*60}")
            return

        # Check for stuck state
        is_stuck, stuck_details = stuck_detector.check(game_id)
        if is_stuck:
            print(stuck_details)
            logger.log_action(None, "GAME STUCK - see console for details", "error")
            return

        phase = get_phase(game_id)

        if phase != last_phase:
            print(f"\n--- {phase.replace('_', ' ').title()} Phase ---")
            last_phase = phase

        if phase == "WORKER_PLACEMENT":
            if handle_worker_placement_round(game_id, logger):
                stuck_detector.reset()

        elif phase == "REVEAL":
            handle_reveal_phase(game_id, logger)
            stuck_detector.reset()

        elif phase == "INCOME_CLEANUP":
            handle_income_cleanup_phase(game_id, logger)

            if get_phase(game_id) != "INCOME_CLEANUP":
                turn_count += 1
                logger.log_round_start(turn_count)
                logger.reset_round_tracking()
                stuck_detector.reset()

                current_age = get_age(game_id)
                if current_age != last_age:
                    logger.log_age_change(current_age)
                    print(f"\n  *** AGE {current_age} BEGINS! ***")
                    logger.log_action(None, f"Age {last_age} -> Age {current_age} transition", "age_transition", is_phase_transition=True)
                    last_age = current_age
                    # Refresh shared state with new age's routes/missions
                    init_shared_state(game_id)

                print(f"\n  Turn {turn_count} complete")
                logger.log_action(None, f"Turn {turn_count} complete", "income_cleanup", is_phase_transition=True)

                # Show current game status
                state = get_state(game_id)
                if state:
                    print(f"  Age: {state.age} | Round: {state.round} | Progress: {state.progress_track}")

                if num_turns and turn_count >= num_turns:
                    print(f"\n{'='*60}")
                    print(f"Completed {turn_count} turns (target reached)")
                    print(f"{'='*60}")
                    break

        elif phase == "AGE_TRANSITION_BLUEPRINT_DESIGN":
            # Handle free Blueprint Design action during age transition
            if handle_age_transition_blueprint_design(game_id, logger):
                stuck_detector.reset()
            # Check if phase completed (might loop for all players)
            current_phase = get_phase(game_id)
            if current_phase != "AGE_TRANSITION_BLUEPRINT_DESIGN":
                # Transition completed
                current_age = get_age(game_id)
                if current_age != last_age:
                    logger.log_age_change(current_age)
                    print(f"\n  *** AGE {current_age} BEGINS! ***")
                    last_age = current_age
                    # Refresh shared state with new age's routes/missions
                    init_shared_state(game_id)
                stuck_detector.reset()

        else:
            print(f"  Unknown phase: {phase}, attempting to advance...")
            for player in PLAYERS:
                try:
                    client.end_turn(player, game_id)
                except Exception:
                    pass

    if iteration >= max_iterations:
        print(f"\nReached max iterations ({max_iterations})")

    print(f"\n{'='*60}")
    print(f"Autoplay Summary")
    print(f"{'='*60}")
    show_summary(game_id)


def get_current_turn_faction(game_id: str) -> str | None:
    """Get the faction of the player whose turn it is.

    Args:
        game_id: The game ID.

    Returns:
        Faction name (e.g., 'germany', 'britain') or None if can't determine.
    """
    state = get_state(game_id)
    if not state:
        return None

    phase = state.phase

    # During worker placement, use the current placer's faction
    if phase and phase.lower() == "worker_placement":
        return get_current_placer_faction(game_id)

    # During other phases, use current_player_index
    current_idx = state.current_player_index
    if current_idx is None or current_idx < 0:
        return None

    if current_idx >= len(state.player_order):
        return None

    current_player_id = state.player_order[current_idx]
    player_data = state.get_player(current_player_id)

    if player_data and player_data.faction:
        return player_data.faction.lower()

    return None


def autoplay_until(target_faction: str, game_id: str | None = None) -> bool:
    """Run AI turns until it's the target faction's turn.

    Args:
        target_faction: Faction name (e.g., 'britain', 'germany').
        game_id: Game ID (uses current game if None).

    Returns:
        True if target faction's turn was reached, False if game ended or got stuck.
    """
    client = get_client()

    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return False

    target_faction = target_faction.lower()
    print(f"=== Autoplay until {target_faction.upper()}'s turn ===")

    logger = get_logger()
    if not logger.log_file:
        if not logger.load_log_file():
            logger.init_log_file(game_id)

    login_all_players()

    stuck_detector = StuckDetector(threshold=10)
    max_iterations = 200

    for iteration in range(max_iterations):
        # Check if it's the target faction's turn
        current_faction = get_current_turn_faction(game_id)
        if current_faction == target_faction:
            phase = get_phase(game_id)
            state = get_state(game_id)
            print(f"\n>>> It's {target_faction.upper()}'s turn!")
            print(f"    Phase: {phase}")
            if state:
                print(f"    Age: {state.age} | Round: {state.round}")
            return True

        # Check for game end
        end_status = check_game_ended(game_id)
        if end_status['ended']:
            print(f"\nGame ended before {target_faction}'s turn.")
            print(f"Winner: {end_status['winner']}")
            return False

        # Check for stuck state
        is_stuck, stuck_details = stuck_detector.check(game_id)
        if is_stuck:
            print(stuck_details)
            return False

        phase = get_phase(game_id)

        if phase == "WORKER_PLACEMENT":
            # Check if it's the target faction's turn (works for both AI and human)
            placer_faction = get_current_placer_faction(game_id)
            if placer_faction == target_faction:
                # It's the target's turn
                print(f"\n>>> It's {target_faction.upper()}'s turn!")
                print(f"    Phase: Worker Placement")
                return True

            if handle_worker_placement_round(game_id, logger):
                stuck_detector.reset()

        elif phase == "REVEAL":
            handle_reveal_phase(game_id, logger)
            stuck_detector.reset()

        elif phase == "INCOME_CLEANUP":
            handle_income_cleanup_phase(game_id, logger)
            if get_phase(game_id) != "INCOME_CLEANUP":
                stuck_detector.reset()

        elif phase == "AGE_TRANSITION_BLUEPRINT_DESIGN":
            if handle_age_transition_blueprint_design(game_id, logger):
                stuck_detector.reset()

        else:
            print(f"  Unknown phase: {phase}")
            for player in PLAYERS:
                try:
                    client.end_turn(player, game_id)
                except Exception:
                    pass

    print(f"\nReached max iterations ({max_iterations})")
    return False


def autoturn(faction: str, game_id: str | None = None) -> bool:
    """Play one turn automatically for a specific faction.

    If it's not that faction's turn, does nothing and returns False.

    Args:
        faction: Faction name (e.g., 'germany', 'britain').
        game_id: Game ID (uses current game if None).

    Returns:
        True if a turn was successfully played, False otherwise.
    """
    client = get_client()

    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return False

    faction = faction.lower()

    # Find the player username for this faction
    player = f"playtest_{faction}"
    if player not in PLAYERS:
        # Handle 'kenny' or other non-playtest players
        # For now, we only support playtest_ players
        print(f"Cannot autoturn for {faction} - only AI players supported")
        return False

    # Check if it's this faction's turn
    current_faction = get_current_turn_faction(game_id)
    if current_faction != faction:
        print(f"It's not {faction.upper()}'s turn (current: {current_faction or 'unknown'})")
        return False

    logger = get_logger()
    if not logger.log_file:
        if not logger.load_log_file():
            logger.init_log_file(game_id)

    # Login this player
    try:
        from .config import PASSWORD
        client.login(player, PASSWORD)
    except Exception:
        pass

    phase = get_phase(game_id)
    print(f">>> {faction.upper()} taking turn (phase: {phase})")

    if phase == "WORKER_PLACEMENT":
        from .phases import (
            get_player_agents, get_player_hand, get_available_locations,
            _execute_placement, submit_reveal
        )
        from .strategy import find_strategic_placement

        agents = get_player_agents(player, game_id)

        if agents <= 0:
            submit_reveal(player, game_id, logger, "(out of agents)")
            return True

        hand = get_player_hand(player, game_id)
        locations = get_available_locations(game_id)
        result = find_strategic_placement(player, hand, locations, game_id, return_decision_info=True)

        if len(result) == 3:
            card, location, decision_info = result
        else:
            card, location = result
            decision_info = None

        if card and location:
            _execute_placement(player, game_id, card, location, logger, decision_info)
            return True
        else:
            submit_reveal(player, game_id, logger, "(no playable cards)")
            return True

    elif phase == "REVEAL":
        try:
            client.end_turn(player, game_id)
            print(f"  {faction.upper()}: ended reveal phase")
            return True
        except Exception as e:
            print(f"  {faction.upper()}: reveal end failed - {e}")
            return False

    elif phase == "INCOME_CLEANUP":
        try:
            client.end_turn(player, game_id)
            print(f"  {faction.upper()}: ended income/cleanup")
            return True
        except Exception as e:
            print(f"  {faction.upper()}: end turn failed - {e}")
            return False

    elif phase == "AGE_TRANSITION_BLUEPRINT_DESIGN":
        if handle_age_transition_blueprint_design(game_id, logger):
            return True
        return False

    else:
        print(f"  Unknown phase: {phase}")
        return False
