"""Main autoplay game loop and stuck detection."""

import json
import time

from .config import PLAYERS, DEFAULT_MAX_TURNS
from .cli import run_cli, strip_ansi, get_game_id, login_all_players
from .logging import get_logger
from .state import get_phase, get_age, check_game_ended, get_state_fingerprint
from .phases import (
    handle_worker_placement_round, handle_reveal_phase, handle_income_cleanup_phase
)
from .display import show_summary


class StuckDetector:
    """Detects when the game is stuck in the same state."""

    def __init__(self, threshold=10):
        self.threshold = threshold
        self.fingerprints = []

    def check(self, game_id):
        """Check if game appears stuck. Returns (is_stuck, details)."""
        fingerprint, state = get_state_fingerprint(game_id)
        self.fingerprints.append(fingerprint)

        if len(self.fingerprints) > self.threshold:
            self.fingerprints = self.fingerprints[-self.threshold:]

        if len(self.fingerprints) >= self.threshold:
            if len(set(self.fingerprints)) == 1:
                details = self._build_verbose_report(game_id, state, fingerprint)
                return True, details
        return False, None

    def reset(self):
        """Reset the stuck detector after successful phase change."""
        self.fingerprints = []

    def _build_verbose_report(self, game_id, state, fingerprint):
        """Build a verbose diagnostic report when stuck."""
        lines = []
        lines.append(f"\n{'='*60}")
        lines.append("GAME STUCK - VERBOSE DIAGNOSTIC REPORT")
        lines.append(f"{'='*60}")
        lines.append(f"\nState fingerprint: {fingerprint}")

        if state:
            lines.append(f"\nPhase: {state.get('phase', 'unknown')}")
            lines.append(f"Age: {state.get('age', '?')} | Turn: {state.get('turn', '?')} | Round: {state.get('round', '?')}")
            lines.append(f"Progress Track: {state.get('progressTrack', 0)}")

            wp = state.get('workerPlacement', {})
            if wp:
                lines.append(f"\nWorker Placement Status:")
                lines.append(f"  Current Placer Index: {wp.get('currentPlacerIndex', '?')}")
                lines.append(f"  Passed Players: {len(wp.get('passedPlayers', []))}")
                lines.append(f"  Placement Order: {wp.get('placementOrder', [])[:4]}...")

            players = state.get('players', {})
            lines.append(f"\nPlayer Resources:")
            for pid, pdata in players.items():
                faction = pdata.get('faction', 'unknown').upper()
                cash = pdata.get('cash', 0)
                income = pdata.get('income', 0)
                agents = pdata.get('agentsRemaining', 0)
                h2 = pdata.get('gasCubes', {}).get('hydrogen', 0)
                he = pdata.get('gasCubes', {}).get('helium', 0)
                ships = len(pdata.get('ships', []))
                hand = len(pdata.get('hand', []))
                passed = pdata.get('hasPassed', False)
                lines.append(f"  {faction}: £{cash}, Income:{income}, Agents:{agents}, H2:{h2}, He:{he}, Ships:{ships}, Hand:{hand}, Passed:{passed}")

            placements = state.get('groundBoard', {}).get('placements', {})
            if placements:
                lines.append(f"\nGround Board Placements ({len(placements)}):")
                for loc, info in placements.items():
                    lines.append(f"  {loc}: {info}")
            else:
                lines.append("\nGround Board: No placements")

            routes = state.get('map', {}).get('routes', [])
            available_routes = [r for r in routes if not r.get('claimed')]
            lines.append(f"\nAvailable Routes ({len(available_routes)}):")
            for route in available_routes[:5]:
                lines.append(f"  {route.get('id')}: Range>={route.get('range', 0)}, Speed>={route.get('speed', 0)}")

        lines.append(f"\n{'='*60}")
        lines.append("POSSIBLE CAUSES:")
        lines.append("  - No player can make a valid move (check hand/locations)")
        lines.append("  - All players passed but phase didn't advance")
        lines.append("  - Action validation blocking all moves")
        lines.append("  - Phase transition logic bug")
        lines.append(f"{'='*60}")

        return '\n'.join(lines)


def autoplay(num_turns=None, game_id=None):
    """Run AI for all players until game ends or gets stuck.

    Args:
        num_turns: Maximum turns to play (None = use DEFAULT_MAX_TURNS)
        game_id: Game ID (uses current game if None)
    """
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
                output = strip_ansi(run_cli("playtest_germany", "state", game_id))
                for line in output.split('\n'):
                    if any(x in line for x in ['Age', 'Turn', 'Progress']):
                        print(f"  {line.strip()}")
                        break

                if num_turns and turn_count >= num_turns:
                    print(f"\n{'='*60}")
                    print(f"Completed {turn_count} turns (target reached)")
                    print(f"{'='*60}")
                    break

        else:
            print(f"  Unknown phase: {phase}, attempting to advance...")
            for player in PLAYERS:
                run_cli(player, "endturn", game_id)

    if iteration >= max_iterations:
        print(f"\nReached max iterations ({max_iterations})")

    print(f"\n{'='*60}")
    print(f"Autoplay Summary")
    print(f"{'='*60}")
    show_summary(game_id)
