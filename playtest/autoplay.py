"""Main autoplay game loop and stuck detection.

This module provides the main autoplay loop for autonomous playtesting,
including stuck detection to identify when the game gets into an unplayable state.
"""

import json
import time
from typing import Any

from client import GameState

from .config import PLAYERS, DEFAULT_MAX_TURNS
from .client import get_client, get_game_id, login_all_players
from .logging import get_logger
from .state import get_state, get_phase, get_age, check_game_ended, get_state_fingerprint
from .phases import (
    handle_worker_placement_round, handle_reveal_phase, handle_income_cleanup_phase,
    handle_age_transition_design_bureau
)
from .display import show_summary


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
            lines.append(f"Age: {state.age} | Turn: {state.turn} | Round: {state.round}")
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

                print(f"\n  Turn {turn_count} complete")
                logger.log_action(None, f"Turn {turn_count} complete", "income_cleanup", is_phase_transition=True)

                # Show current game status
                state = get_state(game_id)
                if state:
                    print(f"  Age: {state.age} | Turn: {state.turn} | Progress: {state.progress_track}")

                if num_turns and turn_count >= num_turns:
                    print(f"\n{'='*60}")
                    print(f"Completed {turn_count} turns (target reached)")
                    print(f"{'='*60}")
                    break

        elif phase == "AGE_TRANSITION_DESIGN_BUREAU":
            # Handle free Design Bureau action during age transition
            if handle_age_transition_design_bureau(game_id, logger):
                stuck_detector.reset()
            # Check if phase completed (might loop for all players)
            current_phase = get_phase(game_id)
            if current_phase != "AGE_TRANSITION_DESIGN_BUREAU":
                # Transition completed
                current_age = get_age(game_id)
                if current_age != last_age:
                    logger.log_age_change(current_age)
                    print(f"\n  *** AGE {current_age} BEGINS! ***")
                    last_age = current_age
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
