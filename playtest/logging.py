"""Logging functionality for playtest sessions."""

from datetime import datetime
from pathlib import Path
from .config import LOGS_DIR, LOG_FILE_TRACKER
from .client import get_manifest


class PlaytestLogger:
    """Manages playtest logging to file with round/age tracking."""

    def __init__(self):
        self.log_file = None
        self.current_age = 1
        self.current_round = 1
        self.current_player_turn = 0
        self.routes_claimed_this_round = []
        self.missions_claimed_this_round = []
        self.techs_acquired_this_round = []
        self.early_reveal_counter = 0

    def init_log_file(self, game_id):
        """Initialize (truncate) the log file for this game.

        Always uses logs/playtest.log, truncating any existing content.
        Also clears old resource flow data from logs/resource-flows/.
        """
        LOGS_DIR.mkdir(exist_ok=True)

        # Clear old resource flow files
        resource_flows_dir = LOGS_DIR / "resource-flows"
        if resource_flows_dir.exists():
            for f in resource_flows_dir.glob("*"):
                f.unlink()

        self.log_file = LOGS_DIR / "playtest.log"
        self.current_age = 1
        self.current_round = 1
        self.current_player_turn = 0

        # Truncate and write header
        with open(self.log_file, 'w') as f:
            f.write(f"# UP SHIP! Playtest Log\n")
            f.write(f"# Game ID: {game_id}\n")
            f.write(f"# Started: {datetime.now().isoformat()}\n")
            f.write(f"# Format: age/round-turn (e.g., I/1-3 = Age 1, round 1, player turn 3)\n")
            f.write(f"#\n")
            f.write(f"{'a/r-t':<10} {'phase':<20} {'player':<18} {'action'}\n")
            f.write(f"{'-'*10} {'-'*20} {'-'*18} {'-'*40}\n")

        # Save log file path for persistence across invocations
        LOG_FILE_TRACKER.write_text(str(self.log_file))

        print(f"Log file: {self.log_file}")
        return self.log_file

    def load_log_file(self):
        """Load the log file (always logs/playtest.log)."""
        log_path = LOGS_DIR / "playtest.log"
        if log_path.exists():
            self.log_file = log_path
            return self.log_file
        return None

    def log_action(self, player, action, phase=None, is_phase_transition=False):
        """Log an action to the current log file.

        Args:
            player: Player username (or None for system messages)
            action: Action description
            phase: Phase name (worker_placement, reveal, income_cleanup)
            is_phase_transition: If True, show just round number (e.g., "I 1 income_cleanup")
        """
        if not self.log_file:
            return

        faction = player.replace('playtest_', '') if player else 'system'
        phase_str = phase or ''

        # Convert age to Roman numeral
        age_roman = ['I', 'II', 'III'][self.current_age - 1] if 1 <= self.current_age <= 3 else str(self.current_age)

        # Format the age/round-turn column
        if is_phase_transition or self.current_player_turn == 0:
            art_str = f"{age_roman}/{self.current_round}"
        else:
            art_str = f"{age_roman}/{self.current_round}-{self.current_player_turn}"

        with open(self.log_file, 'a') as f:
            f.write(f"{art_str:<10} {phase_str:<20} {faction:<18} {action}\n")

    def log_round_start(self, round_num):
        """Record that a new round has started."""
        self.current_round = round_num
        self.current_player_turn = 0

    def log_age_change(self, new_age):
        """Record that the age has changed."""
        self.current_age = new_age

    def sync_from_state(self, state):
        """Sync age and round from game state.

        Call this before logging to ensure correct round/age values.

        Args:
            state: GameState object with age and round properties.
        """
        if state:
            new_round = getattr(state, 'round', self.current_round)
            new_age = getattr(state, 'age', self.current_age)

            # Reset player turn counter when round changes
            if new_round != self.current_round:
                self.current_player_turn = 0

            self.current_round = new_round
            self.current_age = new_age

    def log_player_turn(self):
        """Increment the player turn counter within the current round."""
        self.current_player_turn += 1

    def reset_round_tracking(self):
        """Reset per-round tracking (routes, missions, techs) at start of new round."""
        self.routes_claimed_this_round = []
        self.missions_claimed_this_round = []
        self.techs_acquired_this_round = []

    def track_route_claimed(self, route_name, faction):
        """Track a route claimed during this round."""
        self.routes_claimed_this_round.append({'route': route_name, 'faction': faction})

    def track_mission_claimed(self, mission_name, faction):
        """Track a combat mission claimed during this round (Age II only)."""
        self.missions_claimed_this_round.append({'mission': mission_name, 'faction': faction})

    def track_tech_acquired(self, tech_name, faction):
        """Track a tech acquired during this round."""
        self.techs_acquired_this_round.append({'tech': tech_name, 'faction': faction})

    def log_progress_status(self, state, player=None):
        """Log a status line showing progress track and round activity.

        Outputs a line like:
          [Progress: 3/4 to Age II | Routes: Rhine(GER), Alps(USA) | Techs: daimler(GER)]

        Args:
            state: GameState object or dict with game state data
            player: Optional player for context
        """
        if not state:
            return

        try:
            # Handle both GameState objects and dicts
            if hasattr(state, 'progress_track'):
                progress = state.progress_track
                current_age = state.age
                player_count = len(state.players)
            else:
                progress = state.get('progressTrack', 0)
                current_age = state.get('age', 1)
                player_count = len(state.get('players', {}))

            manifest = get_manifest()
            all_thresholds = manifest.progress_thresholds
            thresholds = all_thresholds.get(str(player_count), all_thresholds.get('4', {}))

            # Determine next threshold
            if current_age == 1:
                next_threshold = thresholds['age2']
                next_label = "Age II"
            elif current_age == 2:
                next_threshold = thresholds['age3']
                next_label = "Age III"
            else:
                next_threshold = thresholds['end']
                next_label = "Game End"

            # Format routes claimed this round
            routes_str = ""
            if self.routes_claimed_this_round:
                route_items = [f"{r['route'][:10]}({r['faction'][:3].upper()})" for r in self.routes_claimed_this_round]
                routes_str = f" | Routes: {', '.join(route_items)}"

            # Format techs acquired this round
            techs_str = ""
            if self.techs_acquired_this_round:
                tech_items = [f"{t['tech'][:12]}({t['faction'][:3].upper()})" for t in self.techs_acquired_this_round]
                techs_str = f" | Techs: {', '.join(tech_items)}"

            status_line = f"  [Progress: {progress}/{next_threshold} to {next_label}{routes_str}{techs_str}]"
            print(status_line)
            self.log_action(None, status_line.strip(), None)

        except Exception:
            # Silently fail if we can't get status
            pass

    def log_detailed_action(self, player, action, details, phase=None):
        """Log an action with additional details on a second line."""
        self.log_action(player, action, phase)
        if details:
            self.log_action(None, f"  └─ {details}", phase)

    def get_early_reveal_threshold(self):
        """Get the current early reveal threshold and increment counter."""
        threshold = self.early_reveal_counter % 3
        self.early_reveal_counter += 1
        return threshold


# Global logger instance
_logger = None


def get_logger():
    """Get the global logger instance, creating it if needed."""
    global _logger
    if _logger is None:
        _logger = PlaytestLogger()
    return _logger
