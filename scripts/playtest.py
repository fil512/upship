#!/usr/bin/env python3
"""
UP SHIP! Playtest Automation Tool

A Python-based CLI wrapper for autonomous playtesting.
Stores current game ID in .upship-current-game for persistence.

Usage:
    python scripts/playtest.py setup [game_name]     # Create new 4-player game
    python scripts/playtest.py autoplay              # Run AI until game ends (max 50 turns)
    python scripts/playtest.py autoplay [num_turns]  # Run AI for N turns
    python scripts/playtest.py status [player]       # Show current game status
    python scripts/playtest.py summary               # Show all players' status table
    python scripts/playtest.py action <player> <cmd> # Run single command
    python scripts/playtest.py endphase              # All players end turn
    python scripts/playtest.py debug                 # Show raw game state
"""

import subprocess
import sys
import re
import os
import json
import time
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
GAME_FILE = PROJECT_ROOT / ".upship-current-game"
LOG_FILE_TRACKER = PROJECT_ROOT / ".upship-current-log"
LOGS_DIR = PROJECT_ROOT / "logs"
CLI_CMD = ["node", str(PROJECT_ROOT / "cli" / "upship.js")]
PASSWORD = "test123456"

# Use local server if UPSHIP_LOCAL=1 or --local flag
USE_LOCAL = os.environ.get("UPSHIP_LOCAL") == "1" or "--local" in sys.argv
API_BASE = "http://localhost:3000" if USE_LOCAL else "https://upship-production.up.railway.app"

if USE_LOCAL:
    # Remove --local from argv so it doesn't interfere with other arg parsing
    sys.argv = [a for a in sys.argv if a != "--local"]

PLAYERS = ["playtest_germany", "playtest_britain", "playtest_usa", "playtest_italy"]
FACTIONS = ["germany", "britain", "usa", "italy"]

# Current log file (set when game starts)
_current_log_file = None
_current_turn = 0


def init_log_file(game_id, game_name=None):
    """Initialize a new log file for this game."""
    global _current_log_file, _current_turn
    LOGS_DIR.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"playtest_{timestamp}.log"
    _current_log_file = LOGS_DIR / filename
    _current_turn = 0

    # Write header
    with open(_current_log_file, 'w') as f:
        f.write(f"# UP SHIP! Playtest Log\n")
        f.write(f"# Game ID: {game_id}\n")
        f.write(f"# Started: {datetime.now().isoformat()}\n")
        f.write(f"#\n")
        f.write(f"{'turn':<8} {'phase':<20} {'player':<18} {'action'}\n")
        f.write(f"{'-'*8} {'-'*20} {'-'*18} {'-'*40}\n")

    # Save log file path for persistence across invocations
    LOG_FILE_TRACKER.write_text(str(_current_log_file))

    print(f"Log file: {_current_log_file}")
    return _current_log_file


def load_log_file():
    """Load existing log file path from tracker."""
    global _current_log_file
    if LOG_FILE_TRACKER.exists():
        log_path = Path(LOG_FILE_TRACKER.read_text().strip())
        if log_path.exists():
            _current_log_file = log_path
            return _current_log_file
    return None


def log_action(player, action, phase=None):
    """Log an action to the current log file."""
    global _current_log_file, _current_turn
    if not _current_log_file:
        return

    faction = player.replace('playtest_', '') if player else 'system'
    phase_str = phase or ''

    with open(_current_log_file, 'a') as f:
        f.write(f"{_current_turn:<8} {phase_str:<20} {faction:<18} {action}\n")


def log_turn_start(turn_num):
    """Record that a new turn has started."""
    global _current_turn
    _current_turn = turn_num


def run_cli(*args, capture=True):
    """Run a CLI command and return output."""
    cmd = CLI_CMD + list(args)
    env = os.environ.copy()
    if USE_LOCAL:
        env["UPSHIP_URL"] = API_BASE
    result = subprocess.run(cmd, capture_output=capture, text=True, cwd=PROJECT_ROOT, env=env)
    return result.stdout + result.stderr if capture else ""


def strip_ansi(text):
    """Remove ANSI color codes from text."""
    return re.sub(r'\x1b\[[0-9;]*m', '', text)


def get_game_id():
    """Load current game ID from file."""
    if GAME_FILE.exists():
        return GAME_FILE.read_text().strip()
    return None


def save_game_id(game_id):
    """Save game ID to file."""
    GAME_FILE.write_text(game_id)
    print(f"Game ID saved to {GAME_FILE}")


def extract_game_id(output):
    """Extract UUID from CLI output."""
    match = re.search(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', output)
    return match.group(0) if match else None


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
    # Phase display can be multi-word, e.g., "WORKER PLACEMENT", "INCOME & CLEANUP"
    match = re.search(r'Phase:\s*([A-Z][A-Z &]+)', output)
    if match:
        phase_text = match.group(1).strip()
        # Normalize to internal phase names
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
    # Look for "Age: N" pattern
    match = re.search(r'Age:\s*(\d+)', output)
    if match:
        return int(match.group(1))
    return 1  # Default to Age 1


def get_gas_preference(player, game_id=None):
    """Return preferred gas type for player. USA prefers helium, others prefer hydrogen."""
    preferred = "helium" if player == "playtest_usa" else "hydrogen"

    # If we have game_id, check if player has their preferred gas
    if game_id:
        output = strip_ansi(run_cli(player, "state", game_id))
        # Look for gas reserves in output
        if preferred == "helium" and "Helium: 0" in output:
            return "hydrogen"  # Fall back to hydrogen if no helium
        elif preferred == "hydrogen" and "Hydrogen: 0" in output:
            return "helium"  # Fall back to helium if no hydrogen

    return preferred


def login_all_players():
    """Ensure all players are logged in."""
    print(">>> Logging in players...")
    for player in PLAYERS:
        output = strip_ansi(run_cli("login", player, PASSWORD))
        if "✓" in output or "already" in output.lower():
            print(f"  {player}: logged in")
        else:
            # Try register
            output = strip_ansi(run_cli("register", player, PASSWORD))
            if "✓" in output:
                print(f"  {player}: registered")
            else:
                print(f"  {player}: WARNING - login failed")


def setup_game(game_name=None):
    """Create a new 4-player game."""
    if game_name is None:
        game_name = f"Playtest_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    print("=== UP SHIP! Playtest Setup ===")
    print(f"Server: {API_BASE} {'(LOCAL)' if USE_LOCAL else '(PRODUCTION)'}\n")

    login_all_players()

    print(f"\n>>> Creating game: {game_name}")
    output = run_cli("playtest_germany", "create", game_name)
    game_id = extract_game_id(output)

    if not game_id:
        print("ERROR: Could not extract game ID")
        sys.exit(1)

    print(f"Game ID: {game_id}")

    print("\n>>> Joining other players...")
    for player in PLAYERS[1:]:
        output = strip_ansi(run_cli(player, "join", game_id))
        status = "✓" if "✓" in output else "✗"
        print(f"  {player}: {status}")

    print("\n>>> Selecting factions...")
    for player, faction in zip(PLAYERS, FACTIONS):
        output = strip_ansi(run_cli(player, "faction", game_id, faction))
        status = "✓" if "✓" in output else "✗"
        print(f"  {player} -> {faction}: {status}")

    print("\n>>> Starting game...")
    output = strip_ansi(run_cli("playtest_germany", "start", game_id))
    if "✓" in output:
        print("Game started!")
    else:
        print(f"Start failed: {output}")

    save_game_id(game_id)
    init_log_file(game_id, game_name)
    log_action(None, "Game created and started", "setup")

    print(f"\n{'='*45}")
    print("Playtest ready!")
    print(f"Game ID: {game_id}")
    print(f"{'='*45}")

    return game_id


def show_status(game_id=None, player=None):
    """Show current game status.

    Args:
        game_id: Game ID (defaults to current game)
        player: Player username to view status as (defaults to playtest_germany)
    """
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    if player is None:
        player = "playtest_germany"

    output = run_cli(player, "state", game_id)
    print(output)


def end_phase(game_id=None):
    """Have all players end their turn or pass depending on phase."""
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    phase = get_phase(game_id)
    print(f">>> Current phase: {phase}")

    if phase == "WORKER_PLACEMENT":
        print(">>> All players revealing (atomic pass + acquisitions)...")
        for player in PLAYERS:
            # Use atomic REVEAL action instead of PASS
            output = strip_ansi(run_cli(player, "reveal", game_id))
            if "✓" in output or "passed" in output.lower() or "reveal" in output.lower():
                print(f"  {player}: revealed")
    else:
        print(">>> All players ending turn...")
        for player in PLAYERS:
            output = strip_ansi(run_cli(player, "endturn", game_id))
            if "✓" in output:
                print(f"  {player}: done")


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
        # Parse stats from line like "Range:2 Speed:2"
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
                    'distance': route.get('range', 1),  # 'range' is the field name
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
                # Parse tech line like: │ daimler_engine         │ £2
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
    # Check each player's view to find who has "YOUR TURN" during worker placement
    for player in PLAYERS:
        output = strip_ansi(run_cli(player, "state", game_id))
        # Look for ">>> YOUR TURN <<<" without "simultaneous" or "ended"
        if 'YOUR TURN' in output and 'simultaneous' not in output and 'ended your turn' not in output.lower():
            return player

    # Secondary check: look at Germany's view for "Waiting for"
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
                # Parse card info - format is: "│ [0] Card Name (symbol)"
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


def get_available_locations(game_id):
    """Get list of unoccupied Ground Board locations."""
    output = strip_ansi(run_cli("playtest_germany", "state", game_id))
    locations = []
    # Ground Board locations and their symbols (from server/data/groundBoard.js)
    location_symbols = {
        # Propeller locations
        'research_institute': 'propeller',
        'launchpad': 'propeller',
        'ministry': 'propeller',
        'weather_bureau': 'propeller',
        # Wrench locations
        'design_bureau': 'wrench',
        'construction_hall': 'wrench',
        'technical_institute': 'wrench',
        'gas_depot': 'wrench',
        # Coin locations
        'academy': 'coin',
        'flight_school': 'coin',
        'government_liaison': 'coin',
        'insurance_bureau': 'coin',
    }

    # Check which locations are occupied
    # Format in output: "│ academy: BRITAIN (Purser)" or "│ gas_depot: GERMANY (Mechanic)"
    occupied = set()
    in_ground_board = False
    for line in output.split('\n'):
        if 'Ground Board' in line:
            in_ground_board = True
            continue
        if in_ground_board:
            # Exit section when we hit the next section
            if '┌─' in line and 'Ground Board' not in line:
                break
            # Check each location for occupation
            # Lines look like: "│ academy: BRITAIN (Purser)"
            for loc_id in location_symbols:
                # Look for "loc_id:" pattern in the line
                if f'{loc_id}:' in line.lower():
                    occupied.add(loc_id)

    # Return unoccupied locations
    for loc_id, symbol in location_symbols.items():
        if loc_id not in occupied:
            locations.append({'id': loc_id, 'symbol': symbol})

    return locations


def find_playable_card(cards, locations):
    """Find a card that can be played at an available location."""
    for card in cards:
        card_symbol = card.get('symbol', 'any')
        for loc in locations:
            loc_symbol = loc.get('symbol', 'any')
            # Card can play if symbols match or card is 'any'
            if card_symbol == loc_symbol or card_symbol == 'any':
                return card, loc
    return None, None


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
                for loc_id in ['research_institute', 'design_bureau', 'construction_hall',
                              'launchpad', 'academy', 'flight_school', 'technical_institute',
                              'government_liaison', 'ministry', 'gas_depot', 'insurance_bureau',
                              'weather_bureau']:
                    if loc_id in line.lower():
                        placements.append(loc_id)
    return placements


def find_strategic_placement(player, hand, locations, game_id):
    """Find a strategic card/location combination.

    Priority order:
    1. construction_hall (if have cash to build)
    2. launchpad (if have ships in hangar)
    3. gas_depot (if low on gas)
    4. design_bureau (if have tech to install)
    5. Any valid placement
    """
    # Get player state for strategic decisions
    output = strip_ansi(run_cli(player, "state", game_id))
    cash_match = re.search(r'Cash:\s*£(\d+)', output)
    cash = int(cash_match.group(1)) if cash_match else 0

    ships = get_player_ships(player, game_id)
    hangar_count = len(ships.get('hangar', []))

    # Check gas levels
    h2_match = re.search(r'H₂:(\d+)', output)
    he_match = re.search(r'He:(\d+)', output)
    hydrogen = int(h2_match.group(1)) if h2_match else 0
    helium = int(he_match.group(1)) if he_match else 0
    total_gas = hydrogen + helium

    # Prioritized locations
    priority_locations = []

    # Priority 1: Build ships if we can afford it and have room
    if cash >= 5 and hangar_count < 3:
        priority_locations.append('construction_hall')

    # Priority 2: Launch ships if we have any in hangar
    if hangar_count > 0 and total_gas > 0:
        priority_locations.append('launchpad')

    # Priority 3: Get gas if we're low
    if total_gas < 3:
        priority_locations.append('gas_depot')

    # Priority 4: Design bureau for blueprint modifications
    priority_locations.append('design_bureau')

    # Priority 5: Research institute for tech research
    priority_locations.append('research_institute')

    # Priority 6: Academy for crew
    if cash >= 2:
        priority_locations.append('academy')

    # Try priority locations first
    for loc_id in priority_locations:
        loc = next((l for l in locations if l['id'] == loc_id), None)
        if loc:
            for card in hand:
                card_symbol = card.get('symbol', 'any')
                if card_symbol == loc['symbol'] or card_symbol == 'any':
                    return card, loc

    # Fallback: any valid placement
    return find_playable_card(hand, locations)


def handle_launchpad_launches(player, game_id):
    """Handle the multi-step launchpad: launch ships and call NO_MORE_LAUNCHES.

    Per Section 6.4, launchpad is a multi-step location:
    - Player places agent (enables launching)
    - Player launches ships (can be multiple)
    - Player calls NO_MORE_LAUNCHES to signal completion
    """
    ships = get_player_ships(player, game_id)
    hangar_ships = ships.get('hangar', [])

    if not hangar_ships:
        # No ships to launch, just call NO_MORE_LAUNCHES
        run_cli(player, "nolaunches", game_id)
        print(f"    {player}: no launches (no ships in hangar)")
        log_action(player, "no launches", "worker_placement")
        return

    routes = get_available_routes(game_id)
    if not routes:
        # No routes available, just call NO_MORE_LAUNCHES
        run_cli(player, "nolaunches", game_id)
        print(f"    {player}: no launches (no routes available)")
        log_action(player, "no launches", "worker_placement")
        return

    # Sort routes by easiest first (lowest distance/speed requirement)
    routes.sort(key=lambda r: (r.get('distance', 1), r.get('speed', 1)))

    launched = 0
    for ship in hangar_ships[:]:  # Copy to avoid mutation during iteration
        for route in routes[:]:
            gas_type = get_gas_preference(player, game_id)
            result = strip_ansi(run_cli(player, "launch", game_id, ship['id'], route['id'], gas_type))
            if "✓" in result or "success" in result.lower():
                print(f"    {player}: launched {ship['id']} to {route['id']}")
                log_action(player, f"launched {ship['id']} to {route['id']} ({gas_type})", "worker_placement")
                routes.remove(route)  # Route now claimed
                launched += 1
                break  # Move to next ship

    # Signal done launching
    run_cli(player, "nolaunches", game_id)
    print(f"    {player}: done launching ({launched} ships)")
    log_action(player, f"done launching ({launched} ships)", "worker_placement")


def handle_worker_placement_round(game_id):
    """Handle a complete worker placement round. Returns True if phase changed."""
    initial_phase = get_phase(game_id)
    attempts = 0
    max_attempts = 30  # Allow more attempts for 4 players

    while attempts < max_attempts:
        attempts += 1
        current_phase = get_phase(game_id)
        if current_phase != "WORKER_PLACEMENT":
            return True  # Phase changed

        current = get_current_placer(game_id)
        if not current:
            # No current placer - check if phase changed
            time.sleep(0.3)
            if get_phase(game_id) != "WORKER_PLACEMENT":
                return True
            continue

        # Get player's hand and available locations
        hand = get_player_hand(current, game_id)
        locations = get_available_locations(game_id)

        # Find a strategic placement
        card, location = find_strategic_placement(current, hand, locations, game_id)

        if card and location:
            # Build action args for PLACE_AGENT
            action_args = [current, "action", game_id, "PLACE_AGENT",
                          f"locationId={location['id']}", f"cardIndex={card['index']}"]

            # Per Section 5.1: Actions execute immediately when placing agent
            # Add location-specific parameters
            action_desc = f"placed at {location['id']} using {card['name']}"

            if location['id'] == 'construction_hall':
                action_args.append("buildCount=1")  # Build 1 ship when placing
                action_desc = f"placed at {location['id']} and built ship"

            elif location['id'] == 'gas_depot':
                # Determine gas type and amount
                gas_type = "helium" if current == "playtest_usa" else "hydrogen"
                gas_amount = 3  # Buy 3 gas when placing
                action_args.append(f"gasType={gas_type}")
                action_args.append(f"gasAmount={gas_amount}")
                action_desc = f"placed at {location['id']} and bought {gas_amount} {gas_type}"

            elif location['id'] == 'academy':
                # Recruit crew when placing (Section 5.1)
                action_args.append("crewType=officer")
                action_args.append("crewCount=1")  # Recruit 1 officer
                action_desc = f"placed at {location['id']} and recruited 1 officer"

            elif location['id'] == 'flight_school':
                # Upgrade officer income when placing (Section 5.1)
                action_args.append("levels=1")
                action_desc = f"placed at {location['id']} and upgraded officer income"

            elif location['id'] == 'technical_institute':
                # Upgrade engineer income when placing (Section 5.1)
                action_args.append("levels=1")
                action_desc = f"placed at {location['id']} and upgraded engineer income"

            elif location['id'] == 'insurance_bureau':
                # Buy insurance when placing (Section 5.1)
                action_args.append("policyCount=1")
                action_desc = f"placed at {location['id']} and bought insurance"

            elif location['id'] == 'government_liaison':
                # Spend officers for income when placing (Section 6.8)
                action_args.append("officerCount=1")
                action_desc = f"placed at {location['id']} and spent 1 officer for income"

            elif location['id'] == 'research_institute':
                # Upgrade research level when placing (Section 6.1)
                action_args.append("levels=1")
                action_desc = f"placed at {location['id']} and upgraded research level"

            elif location['id'] == 'launchpad':
                # Launchpad is a multi-step location (Section 6.4)
                # We'll handle launches after placement
                action_desc = f"placed at {location['id']} (launching ships next)"

            result = strip_ansi(run_cli(*action_args))
            if "✓" in result or "success" in result.lower():
                print(f"  {current}: {action_desc}")
                log_action(current, action_desc, "worker_placement")

                # Handle launchpad multi-step: launch ships and call NO_MORE_LAUNCHES
                if location['id'] == 'launchpad':
                    handle_launchpad_launches(current, game_id)
            else:
                # Placement failed - reveal instead
                submit_reveal(current, game_id, "(placement failed)")
        else:
            # No playable cards - reveal
            submit_reveal(current, game_id, "(no playable cards)")

    return get_phase(game_id) != initial_phase


def get_reveal_acquisitions(player, game_id):
    """Calculate what technologies and market cards to acquire during reveal.

    Returns tuple of (tech_ids_list, card_ids_list) based on available resources.
    Per Section 5.1, acquisitions are bundled into the atomic REVEAL action.
    """
    tech_ids = []
    card_ids = []

    # Get R&D board technologies
    techs = get_rd_board(game_id)

    # Simple strategy: try to acquire cheapest technology if we'll have enough research
    # Note: exact research won't be known until reveal resources are collected,
    # but we can estimate based on research level + engineers
    if techs:
        cheapest = min(techs, key=lambda t: t['cost'])
        # We'll let the server handle validation - if we can't afford it, it'll skip
        tech_ids.append(cheapest['id'])

    # TODO: Could add market card selection based on expected influence
    # For now, no market purchases

    return tech_ids, card_ids


def submit_reveal(player, game_id, reason=""):
    """Submit atomic REVEAL action with tech/market acquisitions.

    Per Section 5.1, reveal bundles:
    - Pass (end worker placement participation)
    - Tech acquisitions using Research
    - Market purchases using Influence
    """
    tech_ids, card_ids = get_reveal_acquisitions(player, game_id)

    # Build reveal command
    reveal_args = [player, "reveal", game_id]
    if tech_ids:
        reveal_args.append(",".join(tech_ids))
    else:
        reveal_args.append("")  # Empty tech list
    if card_ids:
        reveal_args.append(",".join(card_ids))

    result = strip_ansi(run_cli(*reveal_args))

    # Log the action
    if tech_ids or card_ids:
        action_desc = f"revealed {reason}".strip()
        if tech_ids:
            action_desc += f" (acquiring: {','.join(tech_ids)})"
    else:
        action_desc = f"revealed {reason}".strip()

    if "✓" in result or "success" in result.lower():
        print(f"  {player}: {action_desc}")
        log_action(player, action_desc, "reveal")
    else:
        # REVEAL failed - log error (PASS action no longer available)
        print(f"  {player}: reveal failed - {result}")
        log_action(player, f"reveal failed {reason}: {result[:50]}", "reveal")


def handle_reveal_phase(game_id):
    """Handle the reveal phase.

    Per Section 5.1, reveal is atomic:
    - Resources are collected from revealed cards
    - Acquisitions are processed using collected resources
    - If acquisition fails (not enough resources), it's skipped with a log message

    Note: The server automatically processes reveal when all players have submitted
    REVEAL actions during worker_placement. This function just logs and waits.
    """
    print("--- Reveal Phase ---")
    log_action(None, "Reveal phase - collecting resources and processing acquisitions", "reveal")

    # Wait for phase to change (reveal should auto-complete when all REVEAL actions submitted)
    for _ in range(10):
        if get_phase(game_id) != "REVEAL":
            log_action(None, "Reveal phase complete", "reveal")
            break
        time.sleep(0.3)


def handle_income_cleanup_phase(game_id):
    """Handle income and cleanup - all players end turn."""
    print("--- Income & Cleanup Phase ---")
    for player in PLAYERS:
        run_cli(player, "endturn", game_id)
    print("  All players collected income")

    # Wait for phase to change
    for _ in range(10):
        if get_phase(game_id) != "INCOME_CLEANUP":
            break
        time.sleep(0.3)


DEFAULT_MAX_TURNS = 50  # Auto-stop after this many turns if game hasn't ended


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

    # Default to max turns if not specified
    if num_turns is None:
        num_turns = DEFAULT_MAX_TURNS

    print(f"=== UP SHIP! Autoplay ===")
    print(f"Game: {game_id}")
    print(f"Target: {num_turns} turns (max)\n")

    # Load existing log file or create new one
    global _current_log_file
    if not _current_log_file:
        if not load_log_file():
            init_log_file(game_id)
        log_action(None, "Autoplay started", "setup")

    login_all_players()

    stuck_detector = StuckDetector(threshold=10)
    turn_count = 0
    max_iterations = 1000  # Safety limit
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
            log_action(None, f"GAME ENDED - Winner: {end_status['winner']}", "end")
            if end_status['scores']:
                print("\nFinal Scores:")
                for pid, score_data in end_status['scores'].items():
                    faction = score_data.get('faction', 'unknown').upper()
                    total = score_data.get('total', 0)
                    print(f"  {faction}: {total} VP")
                    log_action(None, f"Final score: {faction} = {total} VP", "end")
            print(f"{'='*60}")
            return

        # Check for stuck state
        is_stuck, stuck_details = stuck_detector.check(game_id)
        if is_stuck:
            print(stuck_details)
            log_action(None, "GAME STUCK - see console for details", "error")
            return

        phase = get_phase(game_id)

        # Print phase header when phase changes
        if phase != last_phase:
            print(f"\n--- {phase.replace('_', ' ').title()} Phase ---")
            last_phase = phase

        if phase == "WORKER_PLACEMENT":
            if handle_worker_placement_round(game_id):
                stuck_detector.reset()  # Reset on successful phase change

        elif phase == "REVEAL":
            handle_reveal_phase(game_id)
            stuck_detector.reset()

        elif phase == "INCOME_CLEANUP":
            handle_income_cleanup_phase(game_id)

            # Only count as complete turn if phase actually transitioned
            if get_phase(game_id) != "INCOME_CLEANUP":
                turn_count += 1
                log_turn_start(turn_count)
                stuck_detector.reset()

                # Check for age advancement
                current_age = get_age(game_id)
                if current_age != last_age:
                    print(f"\n  *** AGE {current_age} BEGINS! ***")
                    log_action(None, f"Age {last_age} -> Age {current_age} transition", "age_transition")
                    last_age = current_age

                # Show progress after each turn
                print(f"\n  Turn {turn_count} complete")
                log_action(None, f"Turn {turn_count} complete", "income_cleanup")
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
            # Unknown phase - try to advance
            print(f"  Unknown phase: {phase}, attempting to advance...")
            for player in PLAYERS:
                run_cli(player, "endturn", game_id)

    if iteration >= max_iterations:
        print(f"\nReached max iterations ({max_iterations})")

    print(f"\n{'='*60}")
    print(f"Autoplay Summary")
    print(f"{'='*60}")
    show_summary(game_id)


def run_action(player, command, *args, game_id=None):
    """Run a single action for a player.

    Command can be a single word (e.g., "state") or multi-word (e.g., "place gas-depot 3").
    If command contains spaces, it will be split into command + args.
    """
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    # Split command if it contains spaces (e.g., "place gas-depot 3" -> ["place", "gas-depot", "3"])
    parts = command.split()
    if len(parts) > 1:
        command = parts[0]
        args = tuple(parts[1:]) + args

    output = run_cli(player, command, game_id, *args)
    print(output)


def launch_ship(player, ship_id, route_id, gas_type="hydrogen"):
    """Launch a ship to claim a route (per Section 7.2 of the rules)."""
    game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return
    output = run_cli(player, "launch", game_id, ship_id, route_id, gas_type)
    print(output)


def show_routes():
    """Show available routes."""
    game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    # Get raw state to extract route info
    output = run_cli("playtest_germany", "state", game_id)
    print("\nRoutes are defined in the map. Use 'claim <player> <shipId> <routeId>' to claim.")
    print("Route IDs: route_1 through route_8")
    print("\nAge I Routes:")
    print("  route_1: Frankfurt → Berlin (distance 1, speed 1, income +2)")
    print("  route_2: Frankfurt → Paris (distance 2, speed 1, income +3)")
    print("  route_3: Berlin → Copenhagen (distance 2, speed 1, income +3)")
    print("  route_4: Paris → London (distance 2, speed 2, income +4)")
    print("  route_5: London → Amsterdam (distance 1, speed 1, income +2)")
    print("  route_6: Amsterdam → Berlin (distance 2, speed 1, income +3)")
    print("  route_7: Paris → Rome (distance 3, speed 2, income +5)")
    print("  route_8: Rome → Vienna (distance 2, speed 1, income +3)")


def get_session_cookie(player="playtest_germany"):
    """Load session cookie for a player."""
    session_file = PROJECT_ROOT / ".upship-sessions" / f"{player}.json"
    if session_file.exists():
        with open(session_file) as f:
            session = json.load(f)
            return session.get("cookie", "")
    return ""


def check_game_ended(game_id):
    """Check if the game has ended and return winner info if so.

    Returns:
        dict with keys: ended (bool), winner (faction or None),
        reason (str or None), scores (dict or None)
    """
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
    except Exception as e:
        print(f"Error checking game end: {e}")
        return {'ended': False, 'winner': None, 'reason': None, 'scores': None}


def get_state_fingerprint(game_id):
    """Get a fingerprint of the current game state for stuck detection."""
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

        # Create fingerprint from key state elements
        fingerprint = {
            'phase': state.get('phase'),
            'turn': state.get('turn'),
            'round': state.get('round'),
            'age': state.get('age', gs.get('age')),
            'progress': state.get('progressTrack', 0),
            'placements': len(state.get('groundBoard', {}).get('placements', {})),
            'passed_count': len(state.get('workerPlacement', {}).get('passedPlayers', []))
        }
        return json.dumps(fingerprint, sort_keys=True), state
    except Exception as e:
        return str(e), None


class StuckDetector:
    """Detects when the game is stuck in the same state."""

    def __init__(self, threshold=10):
        self.threshold = threshold
        self.fingerprints = []

    def check(self, game_id):
        """Check if game appears stuck. Returns (is_stuck, details)."""
        fingerprint, state = get_state_fingerprint(game_id)
        self.fingerprints.append(fingerprint)

        # Keep only last N fingerprints
        if len(self.fingerprints) > self.threshold:
            self.fingerprints = self.fingerprints[-self.threshold:]

        # Check if all recent fingerprints are identical
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

            # Worker placement status
            wp = state.get('workerPlacement', {})
            if wp:
                lines.append(f"\nWorker Placement Status:")
                lines.append(f"  Current Placer Index: {wp.get('currentPlacerIndex', '?')}")
                lines.append(f"  Passed Players: {len(wp.get('passedPlayers', []))}")
                lines.append(f"  Placement Order: {wp.get('placementOrder', [])[:4]}...")

            # Player resources
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

            # Ground board placements
            placements = state.get('groundBoard', {}).get('placements', {})
            if placements:
                lines.append(f"\nGround Board Placements ({len(placements)}):")
                for loc, info in placements.items():
                    lines.append(f"  {loc}: {info}")
            else:
                lines.append("\nGround Board: No placements")

            # Available routes
            routes = state.get('map', {}).get('routes', [])
            available_routes = [r for r in routes if not r.get('claimed')]
            lines.append(f"\nAvailable Routes ({len(available_routes)}):")
            for route in available_routes[:5]:  # Show first 5
                lines.append(f"  {route.get('id')}: Range>={route.get('range', 0)}, Speed>={route.get('speed', 0)}")

        lines.append(f"\n{'='*60}")
        lines.append("POSSIBLE CAUSES:")
        lines.append("  - No player can make a valid move (check hand/locations)")
        lines.append("  - All players passed but phase didn't advance")
        lines.append("  - Action validation blocking all moves")
        lines.append("  - Phase transition logic bug")
        lines.append(f"{'='*60}")

        return '\n'.join(lines)


def show_sessions():
    """Show all playtest session info."""
    sessions_dir = PROJECT_ROOT / ".upship-sessions"
    print("=== Playtest Sessions ===\n")
    for session_file in sorted(sessions_dir.glob("playtest_*.json")):
        with open(session_file) as f:
            session = json.load(f)
            username = session.get("username", "unknown")
            user_id = session.get("userId", "unknown")
            print(f"{username}: {user_id[:8]}...")


def show_summary(game_id=None):
    """Show summary of all players' status."""
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    print("=== UP SHIP! Game Summary ===\n")

    # Get game info from one player
    output = strip_ansi(run_cli("playtest_germany", "state", game_id))
    for line in output.split('\n'):
        if 'Age' in line and 'Turn' in line:
            print(line.strip())
            break

    print("\n" + "=" * 60)
    print(f"{'Player':<12} {'Cash':>6} {'Income':>7} {'Ships':>6} {'H₂':>4} {'He':>4} {'Res':>4} {'Tech':>5}")
    print("=" * 60)

    for player in PLAYERS:
        output = strip_ansi(run_cli(player, "state", game_id))

        # Parse status
        faction = player.replace('playtest_', '').upper()
        cash = 0
        income = 0
        ships = 0
        hydrogen = 0
        helium = 0
        research = 0
        tech = 0

        cash_match = re.search(r'Cash:\s*£(\d+)', output)
        if cash_match:
            cash = int(cash_match.group(1))

        income_match = re.search(r'Income:\s*(\d+)', output)
        if income_match:
            income = int(income_match.group(1))

        ships_match = re.search(r'Ships:\s*(\d+)', output)
        if ships_match:
            ships = int(ships_match.group(1))

        h2_match = re.search(r'H₂:(\d+)', output)
        if h2_match:
            hydrogen = int(h2_match.group(1))

        he_match = re.search(r'He:(\d+)', output)
        if he_match:
            helium = int(he_match.group(1))

        res_match = re.search(r'Research:\s*(\d+)', output)
        if res_match:
            research = int(res_match.group(1))

        tech_match = re.search(r'Technologies:\s*(\d+)', output)
        if tech_match:
            tech = int(tech_match.group(1))

        print(f"{faction:<12} £{cash:>5} {income:>5}/t {ships:>6} {hydrogen:>4} {helium:>4} {research:>4} {tech:>5}")

    print("=" * 60)

    # Show ships breakdown
    print("\n=== Ships by Player ===")
    for player in PLAYERS:
        faction = player.replace('playtest_', '').upper()
        ships = get_player_ships(player, game_id)
        hangar = len(ships['hangar'])
        launched = len(ships['launched'])
        on_route = len(ships['on_route'])
        print(f"{faction}: Hangar={hangar}, Launched={launched}, On Route={on_route}")


def debug_state(game_id=None):
    """Fetch and display raw game state for debugging."""
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    try:
        url = f"{API_BASE}/api/state/{game_id}"
        req = urllib.request.Request(url)
        cookie = get_session_cookie()
        if cookie:
            req.add_header("Cookie", cookie)
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())

        print("=== Raw Game State Debug ===\n")
        print(f"Game ID: {game_id}")

        # Handle nested state structure (API returns { gameState: { state: { ... } } })
        gs = data.get('gameState', data)
        state = gs.get('state', gs)

        print(f"Phase: {gs.get('phase')}")
        print(f"Age: {gs.get('age')} | Turn: {state.get('turn', gs.get('turnNumber'))} | Round: {state.get('round')}")
        print(f"Current Player ID: {gs.get('currentPlayerId')}")
        print(f"Current Player Index: {state.get('currentPlayerIndex')}")

        # Worker placement tracking
        wp = state.get('workerPlacement', {})
        print(f"Worker Placement: {wp}")
        print(f"Player Order: {state.get('playerOrder')}")

        # Map player IDs to factions
        players = state.get('players', {})
        print("\nPlayers (id -> faction):")
        for pid, pdata in players.items():
            faction = pdata.get('faction', 'unknown')
            agents = pdata.get('agentsRemaining', '?')
            passed = pdata.get('passed', False)
            print(f"  {pid[:8]}... -> {faction.upper()}: agents={agents}, passed={passed}")

        # Ground board placements
        ground = state.get('groundBoard', {})
        placements = ground.get('placements', {})
        if placements:
            print("\nGround Board Placements:")
            for loc, info in placements.items():
                print(f"  {loc}: {info}")

        # Show ships for each player
        print("\nShips by player:")
        for pid, pdata in players.items():
            faction = pdata.get('faction', 'unknown')
            ships = pdata.get('ships', [])
            print(f"  {faction.upper()}: {len(ships)} ships")
            for ship in ships:
                print(f"    - {ship.get('id')}: status={ship.get('status')}")

        # Show log entries
        log = state.get('log', [])
        if log:
            print(f"\nGame Log (last 15 entries):")
            for entry in log[-15:]:
                msg = entry.get('message', '')
                etype = entry.get('type', '')
                print(f"  [{etype}] {msg}")

        # Show whose turn it actually is
        order = state.get('playerOrder', [])
        wp_idx = state.get('workerPlacementIndex')
        if wp_idx is not None and order:
            current_pid = order[wp_idx % len(order)]
            current_faction = players.get(current_pid, {}).get('faction', 'unknown')
            print(f"\n>>> Current placer: {current_faction.upper()} (index {wp_idx})")

    except urllib.error.URLError as e:
        print(f"Error fetching state: {e}")
    except json.JSONDecodeError as e:
        print(f"Error parsing response: {e}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    cmd = sys.argv[1].lower()

    if cmd == "setup":
        game_name = sys.argv[2] if len(sys.argv) > 2 else None
        setup_game(game_name)

    elif cmd == "autoplay":
        # If no arg, run until game ends. If arg is a number, limit turns.
        if len(sys.argv) > 2:
            num_turns = int(sys.argv[2])
        else:
            num_turns = None  # Run until game ends
        autoplay(num_turns)

    elif cmd == "status":
        player = sys.argv[2] if len(sys.argv) > 2 else None
        show_status(player=player)

    elif cmd == "endphase":
        end_phase()

    elif cmd == "action":
        if len(sys.argv) < 4:
            print("Usage: playtest.py action <player> <command> [args...]")
            return
        player = sys.argv[2]
        command = sys.argv[3]
        args = sys.argv[4:]
        run_action(player, command, *args)

    elif cmd == "gameid":
        game_id = get_game_id()
        if game_id:
            print(game_id)
        else:
            print("No current game")

    elif cmd == "launch":
        if len(sys.argv) < 5:
            print("Usage: playtest.py launch <player> <shipId> <routeId> [gasType]")
            print("  Launch a ship to claim a route (per Section 7.2 of the rules)")
            return
        player = sys.argv[2]
        ship_id = sys.argv[3]
        route_id = sys.argv[4]
        gas_type = sys.argv[5] if len(sys.argv) > 5 else "hydrogen"
        launch_ship(player, ship_id, route_id, gas_type)

    elif cmd == "claim":
        print("Note: Route claiming is now part of the launch action.")
        print("Usage: playtest.py launch <player> <shipId> <routeId> [gasType]")

    elif cmd == "routes":
        show_routes()

    elif cmd == "debug":
        debug_state()

    elif cmd == "sessions":
        show_sessions()

    elif cmd == "summary":
        show_summary()

    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)


if __name__ == "__main__":
    main()
