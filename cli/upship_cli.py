#!/usr/bin/env python3
"""
UP SHIP! Command-Line Client

A CLI tool for playing UP SHIP! via the REST API.
Uses the Python client library for all API interactions.

Usage:
  upship login <username> <password>     - Login and store session
  upship <username> <command> [args...]  - Run command as user

Examples:
  upship login testpilot42 airship123
  upship testpilot42 games
  upship testpilot42 create "My Game"
  upship testpilot42 join <gameId>
  upship testpilot42 state <gameId>
  upship testpilot42 action <gameId> END_TURN
"""

import sys
import os

# Add parent directory to path so we can import the client package
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from client import (
    UpshipClient,
    Session,
    Game,
    GameState,
    Player,
    Ship,
    Route,
    Card,
    ActionResult,
    UpshipError,
    AuthenticationError,
    SessionNotFoundError,
    APIError,
    list_sessions,
    load_session,
)


# ============================================================================
# Color formatting
# ============================================================================

class Colors:
    RESET = '\x1b[0m'
    BRIGHT = '\x1b[1m'
    DIM = '\x1b[2m'
    RED = '\x1b[31m'
    GREEN = '\x1b[32m'
    YELLOW = '\x1b[33m'
    BLUE = '\x1b[34m'
    MAGENTA = '\x1b[35m'
    CYAN = '\x1b[36m'
    WHITE = '\x1b[37m'
    GRAY = '\x1b[90m'


FACTION_COLORS = {
    'germany': Colors.YELLOW,
    'britain': Colors.BLUE,
    'usa': Colors.CYAN,
    'italy': Colors.GREEN,
}

GAME_STATUS_COLORS = {
    'waiting': Colors.YELLOW,
    'active': Colors.GREEN,
    'finished': Colors.GRAY,
}

SHIP_STATUS_COLORS = {
    'hangar': Colors.YELLOW,
    'on_route': Colors.GREEN,
    'launched': Colors.GREEN,
    'crashed': Colors.RED,
}


def c(color: str, text: str) -> str:
    """Wrap text in color codes."""
    return f"{color}{text}{Colors.RESET}"


def format_cash(amount: int) -> str:
    return c(Colors.GREEN, f"£{amount}")


def format_faction(faction: str | None) -> str:
    if not faction:
        return c(Colors.WHITE, 'NONE')
    color = FACTION_COLORS.get(faction, Colors.WHITE)
    return c(color, faction.upper())


def format_phase(phase: str) -> str:
    phase_colors = {
        'worker_placement': Colors.YELLOW,
        'reveal': Colors.BLUE,
        'income_cleanup': Colors.GREEN,
        'planning': Colors.BLUE,
        'actions': Colors.YELLOW,
        'launch': Colors.MAGENTA,
        'income': Colors.GREEN,
        'cleanup': Colors.GRAY,
    }
    display_names = {
        'worker_placement': 'WORKER PLACEMENT',
        'reveal': 'REVEAL',
        'income_cleanup': 'INCOME & CLEANUP',
    }
    display_name = display_names.get(phase, phase.upper() if phase else 'UNKNOWN')
    return c(phase_colors.get(phase, Colors.WHITE), display_name)


# ============================================================================
# CLI Commands
# ============================================================================

class CLI:
    def __init__(self):
        self.client = UpshipClient()

    # ========================================================================
    # Authentication commands
    # ========================================================================

    def cmd_login(self, args: list[str]) -> None:
        """Login and store session."""
        if len(args) < 2:
            print('Usage: upship login <username> <password>')
            return

        username, password = args[0], args[1]

        try:
            session = self.client.login(username, password)
            print(c(Colors.GREEN, f"✓ Logged in as {username}"))
            print(f"  User ID: {session.user_id}")
        except AuthenticationError as e:
            print(c(Colors.RED, f"✗ Login failed: {e}"))
        except APIError as e:
            print(c(Colors.RED, f"✗ Login failed: {e}"))

    def cmd_register(self, args: list[str]) -> None:
        """Register a new account and login."""
        if len(args) < 2:
            print('Usage: upship register <username> <password>')
            return

        username, password = args[0], args[1]

        try:
            session = self.client.register(username, password)
            print(c(Colors.GREEN, f"✓ Registered and logged in as {username}"))
        except APIError as e:
            print(c(Colors.RED, f"✗ Registration failed: {e}"))

    def cmd_logout(self, username: str, args: list[str]) -> None:
        """Logout and delete session."""
        self.client.logout(username)
        print(c(Colors.GREEN, f"✓ Logged out {username}"))

    def cmd_whoami(self, username: str, args: list[str]) -> None:
        """Check current session."""
        try:
            data = self.client.whoami(username)
            user = data.get('user', data)
            print(f"Logged in as: {c(Colors.BRIGHT, user.get('username', username))}")
            print(f"User ID: {user.get('id', 'unknown')}")
        except SessionNotFoundError:
            print(c(Colors.RED, 'Not logged in or session expired'))
        except APIError as e:
            print(c(Colors.RED, f"Error: {e}"))

    def cmd_sessions(self, args: list[str] = None) -> None:
        """List all active sessions."""
        sessions = list_sessions()
        if not sessions:
            print('No active sessions. Use: upship login <username> <password>')
            return

        print(c(Colors.BRIGHT, 'Active sessions:'))
        for session in sessions:
            print(f"  {c(Colors.CYAN, session.username)} ({session.user_id})")

    # ========================================================================
    # Game lobby commands
    # ========================================================================

    def cmd_games(self, username: str, args: list[str]) -> None:
        """List games in the lobby."""
        status = args[0] if args else 'all'

        try:
            games = self.client.list_games(username, status=status)

            if not games:
                print('No games found.')
                return

            print(c(Colors.BRIGHT, f"Games ({len(games)}):"))
            print('─' * 70)

            for game in games:
                status_color = GAME_STATUS_COLORS.get(game.status, Colors.GRAY)
                player_count = len(game.players) if game.players else 0
                print(f"{c(Colors.CYAN, game.id[:8])} │ {game.name[:30].ljust(30)} │ {c(status_color, game.status.ljust(8))} │ {player_count}/4 players")
        except UpshipError as e:
            print(c(Colors.RED, f"✗ Failed: {e}"))

    def cmd_create(self, username: str, args: list[str]) -> None:
        """Create a new game."""
        name = ' '.join(args) if args else f"Game {int(__import__('time').time())}"

        try:
            game = self.client.create_game(username, name)
            print(c(Colors.GREEN, f"✓ Created game: {game.name}"))
            print(f"  Game ID: {c(Colors.CYAN, game.id)}")
        except UpshipError as e:
            print(c(Colors.RED, f"✗ Failed: {e}"))

    def cmd_join(self, username: str, args: list[str]) -> None:
        """Join a game."""
        if not args:
            print('Usage: upship <user> join <gameId>')
            return

        game_id = args[0]

        try:
            game = self.client.join_game(username, game_id)
            print(c(Colors.GREEN, f"✓ Joined game: {game.name}"))
        except UpshipError as e:
            print(c(Colors.RED, f"✗ Failed: {e}"))

    def cmd_leave(self, username: str, args: list[str]) -> None:
        """Leave a game."""
        if not args:
            print('Usage: upship <user> leave <gameId>')
            return

        game_id = args[0]

        try:
            self.client.leave_game(username, game_id)
            print(c(Colors.GREEN, '✓ Left game'))
        except UpshipError as e:
            print(c(Colors.RED, f"✗ Failed: {e}"))

    def cmd_faction(self, username: str, args: list[str]) -> None:
        """Select a faction."""
        if len(args) < 2:
            print('Usage: upship <user> faction <gameId> <germany|britain|usa|italy>')
            return

        game_id, faction = args[0], args[1]

        try:
            game = self.client.select_faction(username, game_id, faction)
            print(c(Colors.GREEN, f"✓ Selected faction: {format_faction(faction)}"))
        except UpshipError as e:
            print(c(Colors.RED, f"✗ Failed: {e}"))

    def cmd_start(self, username: str, args: list[str]) -> None:
        """Start a game."""
        if not args:
            print('Usage: upship <user> start <gameId>')
            return

        game_id = args[0]

        try:
            state = self.client.start_game(username, game_id)
            print(c(Colors.GREEN, '✓ Game started!'))
        except UpshipError as e:
            print(c(Colors.RED, f"✗ Failed: {e}"))

    # ========================================================================
    # Game state commands
    # ========================================================================

    def cmd_state(self, username: str, args: list[str]) -> None:
        """View game state."""
        if not args:
            print('Usage: upship <user> state <gameId>')
            return

        game_id = args[0]

        try:
            session = load_session(username)
            state = self.client.get_state(username, game_id)
            my_id = session.user_id
            my_player = state.get_player(my_id)

            # Determine whose turn it is
            is_my_turn = state.is_my_turn(my_id)
            is_simultaneous = state.phase == 'reveal'

            # Header
            progress = state.progress_track
            print('')
            print(c(Colors.BRIGHT, '═' * 75))
            print(c(Colors.BRIGHT, f"  UP SHIP! - Age {state.age} │ Turn {state.turn} │ Round {state.round} │ Phase: {format_phase(state.phase)}"))
            print(c(Colors.BRIGHT, f"  Progress: {progress}"))
            print(c(Colors.BRIGHT, '═' * 75))

            # Turn indicator
            if is_simultaneous:
                if is_my_turn:
                    print(c(Colors.GREEN + Colors.BRIGHT, '  >>> YOUR TURN <<< (simultaneous phase)'))
                else:
                    print(c(Colors.GRAY, '  You have ended your turn. Waiting for others...'))
            elif is_my_turn:
                print(c(Colors.GREEN + Colors.BRIGHT, '  >>> YOUR TURN <<<'))
            else:
                current_player = state.get_player(state.current_player_id) if state.current_player_id else None
                if current_player:
                    print(c(Colors.YELLOW, f"  Waiting for: {format_faction(current_player.faction)}"))

            # Worker placement info
            if state.phase == 'worker_placement' and state.worker_placement:
                wp = state.worker_placement
                print('')
                print(c(Colors.BRIGHT, '┌─ Worker Placement'))
                order_str = ', '.join(
                    f"{'►' if i == wp.current_placer_index else ' '}{format_faction(state.players.get(pid, Player(pid, '')).faction)}"
                    for i, pid in enumerate(wp.placement_order)
                )
                print(f"│ Placement Order: {order_str}")
                if my_player:
                    print(f"│ Agents Remaining: {my_player.agents_remaining}/{my_player.agents}")
                print('└─────────────────────────────────────')

            print('')

            # My resources
            if my_player:
                print(c(Colors.BRIGHT, f"┌─ Your Status ({format_faction(my_player.faction)})"))
                print(f"│ Cash: {format_cash(my_player.cash)}  │  Income: {c(Colors.CYAN, str(my_player.income) + '/turn')}")
                print(f"│ Officers: {c(Colors.MAGENTA, str(my_player.officers))}  │  Engineers: {c(Colors.YELLOW, str(my_player.engineers))}")
                print(f"│ Research: {c(Colors.MAGENTA, str(my_player.research))}  │  Influence: {c(Colors.CYAN, str(my_player.influence))}")
                h2 = my_player.gas_cubes.get('hydrogen', 0)
                he = my_player.gas_cubes.get('helium', 0)
                print(f"│ Gas: {c(Colors.CYAN, 'H₂:' + str(h2))} {c(Colors.GREEN, 'He:' + str(he))}")
                print(f"│ Hand: {my_player.hand_size or len(my_player.hand)} cards  │  Deck: {my_player.deck_size}  │  Discard: {my_player.discard_size}")
                hangar_count = len([s for s in my_player.ships if s.status == 'hangar'])
                print(f"│ Ships: {len(my_player.ships)} (Hangar: {hangar_count})")
                print(f"│ Technologies: {len(my_player.technologies)}")
                print('└─────────────────────────────────────')

                # Show hand
                if my_player.hand:
                    print('')
                    print(c(Colors.BRIGHT, '┌─ Your Hand'))
                    for i, card in enumerate(my_player.hand):
                        print(f"│ [{i}] {card.name} ({card.symbol or '?'})")
                    print('└─────────────────────────────────────')

                # Show ships
                if my_player.ships:
                    print('')
                    print(c(Colors.BRIGHT, '┌─ Your Ships'))
                    for ship in my_player.ships:
                        status_color = SHIP_STATUS_COLORS.get(ship.status, Colors.RED)
                        ship_info = f"│ {c(Colors.CYAN, ship.id)} │ {c(status_color, ship.status.upper())}"
                        ship_info += f" │ Range:{ship.range_stat} Speed:{ship.speed}"
                        if ship.claimed_route:
                            ship_info += f" │ Route: {ship.claimed_route}"
                        print(ship_info)
                    print('└─────────────────────────────────────')

            # Other players
            print('')
            print(c(Colors.BRIGHT, '┌─ Opponents'))
            for pid, player in state.players.items():
                if pid == my_id:
                    continue
                is_current = pid == state.current_player_id
                marker = c(Colors.YELLOW, '►') if is_current else ' '
                print(f"│{marker} {format_faction(player.faction)}: {format_cash(player.cash)} │ Income {player.income} │ Ships {len(player.ships)}")
            print('└─────────────────────────────────────')

            # Gas Market
            print('')
            print(c(Colors.BRIGHT, '┌─ Gas Market'))
            h2_price = state.gas_market.get('hydrogen', 2)
            he_price = state.gas_market.get('helium', 3)
            print(f"│ Hydrogen: {c(Colors.CYAN, '£' + str(h2_price) + '/cube')}")
            print(f"│ Helium:   {c(Colors.GREEN, '£' + str(he_price) + '/cube')}")
            print('└─────────────────────────────────────')

            # R&D Board
            rd_board = state.rd_board
            if rd_board and isinstance(rd_board, dict):
                available = rd_board.get('available', [])
                if isinstance(available, list) and available:
                    print('')
                    print(c(Colors.BRIGHT, '┌─ R&D Board (Available Technologies)'))
                    for tech in available:
                        if isinstance(tech, dict):
                            tech_id = tech.get('id', '')
                            cost = tech.get('cost', 0)
                            owned = tech_id in (my_player.technologies if my_player else [])
                            owned_str = c(Colors.GREEN, ' [OWNED]') if owned else ''
                            print(f"│ {c(Colors.CYAN, tech_id.ljust(22))} │ £{cost}{owned_str}")
                    print('└─────────────────────────────────────')

            # Recent log
            recent_logs = state.log[-5:] if state.log else []
            if recent_logs:
                print('')
                print(c(Colors.BRIGHT, '┌─ Recent Activity'))
                for log_entry in recent_logs:
                    ts = log_entry.get('timestamp', '')
                    if ts:
                        from datetime import datetime
                        try:
                            dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                            time_str = dt.strftime('%H:%M:%S')
                        except:
                            time_str = ts[:8]
                    else:
                        time_str = '??:??:??'
                    msg = log_entry.get('message', str(log_entry))
                    print(f"│ {c(Colors.GRAY, time_str)} {msg}")
                print('└─────────────────────────────────────')

            print('')

        except UpshipError as e:
            print(c(Colors.RED, f"✗ Failed: {e}"))

    def cmd_blueprint(self, username: str, args: list[str]) -> None:
        """View blueprint."""
        if not args:
            print('Usage: upship <user> blueprint <gameId>')
            return

        game_id = args[0]

        try:
            bp = self.client.get_blueprint(username, game_id)

            print('')
            print(c(Colors.BRIGHT, '═' * 63))
            print(c(Colors.BRIGHT, '                         YOUR BLUEPRINT'))
            print(c(Colors.BRIGHT, '═' * 63))

            slot_types = [
                ('Frame', bp.frame_slots, Colors.RED),
                ('Fabric', bp.fabric_slots, Colors.BLUE),
                ('Drive', bp.drive_slots, Colors.YELLOW),
                ('Component', bp.component_slots, Colors.MAGENTA),
            ]

            for name, slots, color in slot_types:
                filled = len([s for s in slots if s])
                print('')
                print(c(color + Colors.BRIGHT, f"┌─ {name} Slots ({filled}/{len(slots)})"))
                for i, upgrade in enumerate(slots):
                    status = c(Colors.GREEN, upgrade) if upgrade else c(Colors.GRAY, 'empty')
                    print(f"│ [{i}] {status}")
                print(c(color, '└─────────────────────────────────────'))

            print('')

        except UpshipError as e:
            print(c(Colors.RED, f"✗ Failed: {e}"))

    def cmd_routes(self, username: str, args: list[str]) -> None:
        """View available routes."""
        if not args:
            print('Usage: upship <user> routes <gameId>')
            return

        game_id = args[0]

        try:
            state = self.client.get_state(username, game_id)
            routes = state.available_routes or state.routes

            print('')
            print(c(Colors.BRIGHT, f"Available Routes (Age {state.age}):"))
            print(c(Colors.GRAY, '  Ships must meet minimum Range (≥ distance) and Speed requirements.'))
            print('─' * 70)

            for route in routes:
                claimed = c(Colors.RED, ' [CLAIMED]') if route.claimed_by else c(Colors.GREEN, ' [OPEN]')
                requirements = f"requires Range ≥{route.distance}, Speed ≥{route.speed_requirement} → income +{route.income}"
                print(f"  {c(Colors.CYAN, route.id.ljust(10))} │ {route.name}{claimed}")
                print(f"  {''.ljust(10)} │ {c(Colors.GRAY, requirements)}")

            print('')

        except UpshipError as e:
            print(c(Colors.RED, f"✗ Failed: {e}"))

    def cmd_upgrades(self, username: str, args: list[str]) -> None:
        """View available upgrades."""
        if not args:
            print('Usage: upship <user> upgrades <gameId>')
            return

        game_id = args[0]

        try:
            upgrades = self.client.get_upgrades(username, game_id)

            print('')
            print(c(Colors.BRIGHT, 'Available Upgrades (based on your technologies):'))
            print('─' * 60)

            if isinstance(upgrades, dict):
                slot_types = ['frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots']
                total_count = 0

                for slot_type in slot_types:
                    slot_upgrades = upgrades.get(slot_type, [])
                    if not slot_upgrades:
                        continue

                    total_count += len(slot_upgrades)
                    slot_name = slot_type.replace('Slots', '').upper()
                    print(c(Colors.YELLOW, f"\n{slot_name}:"))

                    for upgrade in slot_upgrades:
                        weight_str = f"Weight: {upgrade.get('weight', 0)}" if upgrade.get('weight') else ''
                        print(f"  {c(Colors.CYAN, upgrade.get('id', '').ljust(22))} │ Age {upgrade.get('age', 1)} │ {weight_str}")
                        stats = upgrade.get('stats', {})
                        if stats:
                            stat_str = ' '.join(f"{k}:{'+' if v > 0 else ''}{v}" for k, v in stats.items())
                            print(f"  {''.ljust(22)} │ {c(Colors.GREEN, stat_str)}")

                if total_count == 0:
                    print(c(Colors.GRAY, 'No upgrades available. Acquire technologies first.'))
            else:
                for upgrade in upgrades:
                    print(f"  {upgrade}")

            print('')

        except UpshipError as e:
            print(c(Colors.RED, f"✗ Failed: {e}"))

    def cmd_log(self, username: str, args: list[str]) -> None:
        """View action history."""
        if not args:
            print('Usage: upship <user> log <gameId> [limit]')
            return

        game_id = args[0]
        limit = int(args[1]) if len(args) > 1 else 20

        try:
            actions = self.client.get_log(username, game_id, limit=limit)

            print('')
            print(c(Colors.BRIGHT, f"Game Log (last {len(actions)} actions):"))
            print('─' * 70)

            for action in actions:
                ts = action.get('created_at', '')
                if ts:
                    from datetime import datetime
                    try:
                        dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                        time_str = dt.strftime('%H:%M:%S')
                    except:
                        time_str = ts[:8]
                else:
                    time_str = '??:??:??'
                action_type = action.get('action_type', 'UNKNOWN')
                action_data = action.get('action_data', {})
                print(f"{c(Colors.GRAY, time_str)} │ {action_type} │ {action_data}")

            print('')

        except UpshipError as e:
            print(c(Colors.RED, f"✗ Failed: {e}"))

    # ========================================================================
    # Action commands
    # ========================================================================

    def cmd_action(self, username: str, args: list[str]) -> None:
        """Execute a generic action."""
        if len(args) < 2:
            print('Usage: upship <user> action <gameId> <ACTION_TYPE> [key=value ...]')
            print('')
            print('Actions:')
            print('  END_TURN                    - End your turn')
            print('  PASS                        - Pass (worker placement only)')
            print('  REVEAL techAcquisitions=a,b marketPurchases=c - Atomic pass + acquire')
            print('  NO_MORE_LAUNCHES            - Signal done launching at launchpad')
            print('  PLACE_AGENT locationId=<id> cardIndex=<n> - Place agent at location')
            print('  BUY_GAS gasType=hydrogen amount=2 - Buy gas cubes')
            print('  TAKE_LOAN                   - Take a £30 loan')
            print('  COLLECT_INCOME              - Collect your income')
            print('  DRAW_CARDS count=2          - Draw cards')
            print('  PLAY_CARD cardIndex=0       - Play card from hand')
            print('  RECRUIT_CREW crewType=officer count=1 - Recruit crew')
            print('  BUILD_SHIP count=1          - Build ships')
            print('  LAUNCH_SHIP shipId=<id> routeId=<route> gasType=hydrogen - Launch ship')
            print('  ACQUIRE_TECHNOLOGY techId=<id> - Buy tech from R&D board')
            print('  INSTALL_UPGRADE slotType=frame slotIndex=0 upgradeId=<id>')
            print('  REMOVE_UPGRADE slotType=frame slotIndex=0')
            return

        game_id = args[0]
        action_type = args[1]
        extra_args = args[2:]

        # Parse key=value pairs
        action_data = {}
        array_keys = ['techAcquisitions', 'marketPurchases', 'swaps']

        for arg in extra_args:
            if '=' not in arg:
                continue
            key, value = arg.split('=', 1)

            # Handle array keys
            if key in array_keys:
                action_data[key] = [v.strip() for v in value.split(',') if v.strip()]
            elif value == 'true':
                action_data[key] = True
            elif value == 'false':
                action_data[key] = False
            elif value.isdigit() or (value.startswith('-') and value[1:].isdigit()):
                action_data[key] = int(value)
            else:
                action_data[key] = value

        # Map shorthand keys
        key_map = {
            'type': 'gasType',
            'amt': 'amount',
            'idx': 'cardIndex',
            'i': 'slotIndex',
            'n': 'count',
            'id': 'upgradeId',
            'tech': 'techId',
            'slot': 'slotType',
            'ship': 'shipId',
        }

        for short, long in key_map.items():
            if short in action_data and long not in action_data:
                action_data[long] = action_data.pop(short)

        try:
            result = self.client.action(username, game_id, action_type, **action_data)

            if result.success:
                print(c(Colors.GREEN, f"✓ {action_type} executed successfully"))
                if result.game_state and result.game_state.log:
                    latest = result.game_state.log[-1]
                    msg = latest.get('message', str(latest))
                    print(f"  {c(Colors.GRAY, msg)}")
            else:
                print(c(Colors.RED, f"✗ Failed: {result.error or 'Unknown error'}"))
        except UpshipError as e:
            print(c(Colors.RED, f"✗ Failed: {e}"))

    # Shorthand action commands
    def cmd_endturn(self, username: str, args: list[str]) -> None:
        """End the current turn."""
        self.cmd_action(username, [args[0], 'END_TURN'] if args else [])

    def cmd_pass(self, username: str, args: list[str]) -> None:
        """Pass in worker placement."""
        self.cmd_action(username, [args[0], 'PASS'] if args else [])

    def cmd_reveal(self, username: str, args: list[str]) -> None:
        """Atomic pass + acquire."""
        if not args:
            print('Usage: upship <user> reveal <gameId> [techId1,techId2,...] [cardId1,cardId2,...]')
            print('')
            print('Atomic reveal: pass worker placement AND acquire technologies/market cards.')
            return

        game_id = args[0]
        action_args = [game_id, 'REVEAL']
        if len(args) > 1 and args[1].strip():
            action_args.append(f"techAcquisitions={args[1]}")
        if len(args) > 2 and args[2].strip():
            action_args.append(f"marketPurchases={args[2]}")
        self.cmd_action(username, action_args)

    def cmd_nolaunches(self, username: str, args: list[str]) -> None:
        """Signal done launching."""
        if not args:
            print('Usage: upship <user> nolaunches <gameId>')
            return
        self.cmd_action(username, [args[0], 'NO_MORE_LAUNCHES'])

    def cmd_place(self, username: str, args: list[str]) -> None:
        """Place an agent."""
        if len(args) < 3:
            print('Usage: upship <user> place <gameId> <locationId> <cardIndex> [params...]')
            print('')
            print('Locations:')
            print('  research-institute, design-bureau, construction-hall (wrench)')
            print('  launchpad, ministry, gas-depot, weather-bureau (propeller)')
            print('  academy, flight-school, technical-institute, the-bank, insurance-bureau (coin)')
            print('')
            print('Location-specific parameters:')
            print('  construction-hall: buildCount=N (1-3 ships)')
            print('  gas-depot: gasType=hydrogen|helium gasAmount=N')
            print('  academy: crewType=officer|engineer crewCount=N')
            return

        game_id, location_id, card_index = args[0], args[1], args[2]
        action_args = [game_id, 'PLACE_AGENT', f"locationId={location_id}", f"cardIndex={card_index}"]
        action_args.extend(args[3:])
        self.cmd_action(username, action_args)

    def cmd_buygas(self, username: str, args: list[str]) -> None:
        """Buy gas."""
        if len(args) < 2:
            print('Usage: upship <user> buygas <gameId> <hydrogen|helium> [amount]')
            return

        game_id, gas_type = args[0], args[1]
        amount = args[2] if len(args) > 2 else '1'
        self.cmd_action(username, [game_id, 'BUY_GAS', f"gasType={gas_type}", f"amount={amount}"])

    def cmd_loan(self, username: str, args: list[str]) -> None:
        """Take a loan."""
        if not args:
            print('Usage: upship <user> loan <gameId>')
            return
        self.cmd_action(username, [args[0], 'TAKE_LOAN'])

    def cmd_draw(self, username: str, args: list[str]) -> None:
        """Draw cards."""
        if not args:
            print('Usage: upship <user> draw <gameId> [count]')
            return
        game_id = args[0]
        count = args[1] if len(args) > 1 else '1'
        self.cmd_action(username, [game_id, 'DRAW_CARDS', f"count={count}"])

    def cmd_build(self, username: str, args: list[str]) -> None:
        """Build ships."""
        if not args:
            print('Usage: upship <user> build <gameId> [count]')
            return
        game_id = args[0]
        count = args[1] if len(args) > 1 else '1'
        self.cmd_action(username, [game_id, 'BUILD_SHIP', f"count={count}"])

    def cmd_recruit(self, username: str, args: list[str]) -> None:
        """Recruit crew."""
        if len(args) < 2:
            print('Usage: upship <user> recruit <gameId> <officer|engineer> [count]')
            return
        game_id, crew_type = args[0], args[1]
        count = args[2] if len(args) > 2 else '1'
        self.cmd_action(username, [game_id, 'RECRUIT_CREW', f"crewType={crew_type}", f"count={count}"])

    def cmd_load(self, username: str, args: list[str]) -> None:
        """(Deprecated) Load gas."""
        print(f"{Colors.YELLOW}Note: Gas loading is no longer needed.{Colors.RESET}")
        print('Gas cubes are automatically spent from your reserve when you launch.')
        print('Use: upship <user> launch <gameId> <shipId> <routeId> [hydrogen|helium]')

    def cmd_launch(self, username: str, args: list[str]) -> None:
        """Launch a ship."""
        if len(args) < 3:
            print('Usage: upship <user> launch <gameId> <shipId> <routeId> [hydrogen|helium]')
            print('  Launch a ship to claim a route. Gas type defaults to hydrogen.')
            print('  Use "upship <user> routes <gameId>" to see available routes.')
            return

        game_id, ship_id, route_id = args[0], args[1], args[2]
        gas_type = args[3] if len(args) > 3 else 'hydrogen'
        self.cmd_action(username, [game_id, 'LAUNCH_SHIP', f"shipId={ship_id}", f"routeId={route_id}", f"gasType={gas_type}"])

    def cmd_tech(self, username: str, args: list[str]) -> None:
        """Acquire technology."""
        if len(args) < 2:
            print('Usage: upship <user> tech <gameId> <techId>')
            return
        game_id, tech_id = args[0], args[1]
        self.cmd_action(username, [game_id, 'ACQUIRE_TECHNOLOGY', f"techId={tech_id}"])

    def cmd_install(self, username: str, args: list[str]) -> None:
        """Install an upgrade."""
        if len(args) < 4:
            print('Usage: upship <user> install <gameId> <frame|fabric|drive|component> <slotIndex> <upgradeId>')
            return
        game_id, slot_type, slot_index, upgrade_id = args[0], args[1], args[2], args[3]
        self.cmd_action(username, [game_id, 'INSTALL_UPGRADE', f"slotType={slot_type}", f"slotIndex={slot_index}", f"upgradeId={upgrade_id}"])

    def cmd_claim(self, username: str, args: list[str]) -> None:
        """(Deprecated) Claim a route."""
        print(f"{Colors.YELLOW}Note: Route claiming is now part of the launch action.{Colors.RESET}")
        print('Use: upship <user> launch <gameId> <shipId> <routeId> [hydrogen|helium]')
        print('Ships are launched directly to routes (per Section 7.2 of the rules).')

    def cmd_help(self, args: list[str] = None) -> None:
        """Show help."""
        print(f"""
{c(Colors.BRIGHT, 'UP SHIP! CLI')} - Command-line client for playtesting

{c(Colors.YELLOW, 'Session Management:')}
  upship login <user> <pass>    Login and store session
  upship register <user> <pass> Create account and login
  upship sessions               List all active sessions
  upship <user> logout          Logout user
  upship <user> whoami          Check current session

{c(Colors.YELLOW, 'Game Lobby:')}
  upship <user> games [status]  List games (waiting/active/mine/all)
  upship <user> create <name>   Create a new game
  upship <user> join <gameId>   Join a game
  upship <user> leave <gameId>  Leave a game
  upship <user> faction <id> <faction>  Select faction (germany/britain/usa/italy)
  upship <user> start <gameId>  Start game (host only)

{c(Colors.YELLOW, 'Game State:')}
  upship <user> state <gameId>      View game state
  upship <user> blueprint <gameId>  View your blueprint slots
  upship <user> upgrades <gameId>   List available upgrades
  upship <user> routes <gameId>     View available routes
  upship <user> log <gameId> [n]    View action history

{c(Colors.YELLOW, 'Worker Placement:')}
  upship <user> place <gameId> <locationId> <cardIndex>  Place agent
  upship <user> pass <gameId>                 Pass this round
  upship <user> reveal <gameId> [techs] [cards]  Atomic pass + acquire
  upship <user> nolaunches <gameId>           Signal done launching

{c(Colors.YELLOW, 'Actions (shorthand):')}
  upship <user> endturn <gameId>              End your turn
  upship <user> buygas <id> <type> [amount]   Buy gas cubes
  upship <user> loan <gameId>                 Take a loan (£30, -3 income)
  upship <user> draw <gameId> [count]         Draw cards
  upship <user> build <gameId> [count]        Build ships
  upship <user> recruit <id> <type> [count]   Recruit crew
  upship <user> launch <gameId> <shipId> <routeId> [gas]  Launch ship
  upship <user> tech <gameId> <techId>        Acquire technology

{c(Colors.YELLOW, 'Actions (generic):')}
  upship <user> action <gameId> <TYPE> [key=value ...]

  Example: upship alice action abc123 INSTALL_UPGRADE slotType=frame slotIndex=0 upgradeId=rigid_frame

{c(Colors.GRAY, 'Environment Variables:')}
  UPSHIP_URL - API base URL (default: https://upship-production.up.railway.app)
""")


# ============================================================================
# Main entry point
# ============================================================================

def main():
    cli = CLI()
    args = sys.argv[1:]

    if not args or args[0] in ('help', '--help', '-h'):
        cli.cmd_help()
        return

    # Special commands that don't require username
    if args[0] == 'login':
        cli.cmd_login(args[1:])
        return

    if args[0] == 'register':
        cli.cmd_register(args[1:])
        return

    if args[0] == 'sessions':
        cli.cmd_sessions()
        return

    # All other commands require username first
    username = args[0]
    command = args[1] if len(args) > 1 else 'help'
    cmd_args = args[2:]

    # Check session exists
    try:
        load_session(username)
    except SessionNotFoundError:
        if command != 'help':
            print(c(Colors.RED, f"No session for '{username}'. Login first:"))
            print(f"  upship login {username} <password>")
            return

    # Map command to method
    cmd_method = getattr(cli, f'cmd_{command}', None)

    if cmd_method:
        try:
            # Some commands don't take username
            if command in ('help',):
                cmd_method(cmd_args)
            else:
                cmd_method(username, cmd_args)
        except Exception as e:
            print(c(Colors.RED, f"Error: {e}"))
            if os.environ.get('DEBUG'):
                import traceback
                traceback.print_exc()
    else:
        print(c(Colors.RED, f"Unknown command: {command}"))
        print('Use "upship help" to see available commands.')


if __name__ == '__main__':
    main()
