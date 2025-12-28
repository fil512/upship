#!/usr/bin/env python3
"""
UP SHIP! Playtest Automation Tool

A Python-based CLI wrapper for autonomous playtesting.
Stores current game ID in .upship-current-game for persistence.

Usage:
    python scripts/playtest.py setup [game_name]     # Create new 4-player game
    python scripts/playtest.py autoplay [num_turns]  # Run AI for current game
    python scripts/playtest.py status                # Show current game status
    python scripts/playtest.py action <player> <cmd> # Run single command
    python scripts/playtest.py endphase              # All players end turn
"""

import subprocess
import sys
import re
import os
import json
from datetime import datetime
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
GAME_FILE = PROJECT_ROOT / ".upship-current-game"
CLI_CMD = ["node", str(PROJECT_ROOT / "cli" / "upship.js")]
PASSWORD = "test123456"

PLAYERS = ["playtest_germany", "playtest_britain", "playtest_usa", "playtest_italy"]
FACTIONS = ["germany", "britain", "usa", "italy"]


def run_cli(*args, capture=True):
    """Run a CLI command and return output."""
    cmd = CLI_CMD + list(args)
    result = subprocess.run(cmd, capture_output=capture, text=True, cwd=PROJECT_ROOT)
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
    match = re.search(r'Phase:\s*(\w+)', output)
    return match.group(1) if match else "UNKNOWN"


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
        output = run_cli("login", player, PASSWORD)
        if "✓" in output or "already" in output.lower():
            print(f"  {player}: logged in")
        else:
            # Try register
            output = run_cli("register", player, PASSWORD)
            if "✓" in output:
                print(f"  {player}: registered")
            else:
                print(f"  {player}: WARNING - login failed")


def setup_game(game_name=None):
    """Create a new 4-player game."""
    if game_name is None:
        game_name = f"Playtest_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    print("=== UP SHIP! Playtest Setup ===\n")

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
        output = run_cli(player, "join", game_id)
        status = "✓" if "✓" in output else "✗"
        print(f"  {player}: {status}")

    print("\n>>> Selecting factions...")
    for player, faction in zip(PLAYERS, FACTIONS):
        output = run_cli(player, "faction", game_id, faction)
        status = "✓" if "✓" in output else "✗"
        print(f"  {player} -> {faction}: {status}")

    print("\n>>> Starting game...")
    output = run_cli("playtest_germany", "start", game_id)
    if "✓" in output:
        print("Game started!")
    else:
        print(f"Start failed: {output}")

    save_game_id(game_id)

    print(f"\n{'='*45}")
    print("Playtest ready!")
    print(f"Game ID: {game_id}")
    print(f"{'='*45}")

    return game_id


def show_status(game_id=None):
    """Show current game status."""
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    output = run_cli("playtest_germany", "state", game_id)
    print(output)


def end_phase(game_id=None):
    """Have all players end their turn."""
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    print(">>> All players ending turn...")
    for player in PLAYERS:
        output = run_cli(player, "endturn", game_id)
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
    """Get list of unclaimed routes."""
    output = run_cli("playtest_germany", "routes", game_id)
    routes = []
    current_route = None
    for line in output.split('\n'):
        if 'route_' in line and 'OPEN' in line:
            match = re.search(r'(route_\d+)', line)
            if match:
                current_route = {'id': match.group(1)}
        if current_route and 'distance' in line:
            # Parse stats: distance X, speed Y, income +Z
            dist_match = re.search(r'distance (\d+)', line)
            speed_match = re.search(r'speed (\d+)', line)
            if dist_match:
                current_route['distance'] = int(dist_match.group(1))
            if speed_match:
                current_route['speed'] = int(speed_match.group(1))
            routes.append(current_route)
            current_route = None
    return routes


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


def autoplay(num_turns=5, game_id=None):
    """Run smart AI for all players - acquires tech, launches ships, claims routes."""
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    print(f"=== UP SHIP! Autoplay ===")
    print(f"Game: {game_id}")
    print(f"Turns: {num_turns}\n")

    login_all_players()

    for turn in range(1, num_turns + 1):
        print(f"\n{'='*45}")
        print(f"=== TURN {turn} ===")
        print(f"{'='*45}")

        # Process all phases until we complete a full turn cycle
        phases_seen = set()
        max_iterations = 20  # Safety limit

        for _ in range(max_iterations):
            phase = get_phase(game_id)

            # Check if we've completed a cycle
            if phase in phases_seen and phase == "PLANNING":
                break
            phases_seen.add(phase)

            print(f"\n--- {phase.title()} Phase ---")

            if phase == "PLANNING":
                # Each player draws cards
                for _ in range(4):
                    current = get_current_player(game_id)
                    if current:
                        print(f"  {current}: drawing cards...")
                        run_cli(current, "draw", game_id, "2")
                        run_cli(current, "endturn", game_id)

            elif phase == "ACTIONS":
                # Each player: buy gas, acquire tech, build, launch
                for _ in range(4):
                    current = get_current_player(game_id)
                    if not current:
                        break

                    gas = get_gas_preference(current, game_id)
                    print(f"  {current}: taking actions...")

                    # Buy gas (smaller amount to save money for tech)
                    run_cli(current, "buygas", game_id, gas, "2")

                    # Try to acquire a technology (advances progress!)
                    techs = get_rd_board(game_id)
                    if techs:
                        cheapest = min(techs, key=lambda t: t['cost'])
                        result = run_cli(current, "tech", game_id, cheapest['id'])
                        if "✓" in result:
                            print(f"    Acquired tech: {cheapest['id']}")

                    # Try to build a ship
                    result = run_cli(current, "build", game_id, "1")
                    if "✓" in result:
                        print(f"    Built a ship")

                    # Try to launch ships from hangar
                    ships = get_player_ships(current, game_id)
                    for ship in ships['hangar'][:1]:  # Launch up to 1 per turn
                        ship_id = ship['id'] if isinstance(ship, dict) else ship
                        result = run_cli(current, "launch", game_id, ship_id, gas)
                        if "✓" in result:
                            print(f"    Launched: {ship_id}")
                            # Refresh ships after launch to get updated stats
                            ships = get_player_ships(current, game_id)

                    # Also try to claim routes with already-launched ships
                    routes = get_available_routes(game_id)
                    for ship in ships['launched']:
                        for route in routes:
                            ship_range = ship.get('range', 1)
                            ship_speed = ship.get('speed', 1)
                            route_dist = route.get('distance', 1)
                            route_speed = route.get('speed', 1)

                            if ship_range >= route_dist and ship_speed >= route_speed:
                                result = run_cli(current, "action", game_id, "CLAIM_ROUTE",
                                               f"shipId={ship['id']}", f"routeId={route['id']}")
                                if "✓" in result:
                                    print(f"    Claimed {route['id']} with {ship['id']}")
                                    routes.remove(route)
                                    break

                    run_cli(current, "endturn", game_id)

            elif phase == "LAUNCH":
                # Each player tries to claim routes with launched ships
                for _ in range(4):
                    current = get_current_player(game_id)
                    if not current:
                        break

                    ships = get_player_ships(current, game_id)
                    routes = get_available_routes(game_id)

                    # Try to claim routes that match ship capabilities
                    for ship in ships['launched']:
                        for route in routes:
                            # Check if ship can handle this route
                            ship_range = ship.get('range', 1)
                            ship_speed = ship.get('speed', 1)
                            route_dist = route.get('distance', 1)
                            route_speed = route.get('speed', 1)

                            if ship_range >= route_dist and ship_speed >= route_speed:
                                result = run_cli(current, "action", game_id, "CLAIM_ROUTE",
                                               f"shipId={ship['id']}", f"routeId={route['id']}")
                                if "✓" in result:
                                    print(f"  {current}: claimed {route['id']} with {ship['id']}")
                                    routes.remove(route)  # Mark as claimed
                                    break  # Move to next ship

                    run_cli(current, "endturn", game_id)

            else:  # INCOME, CLEANUP
                # Just advance through these phases
                for _ in range(8):
                    current = get_current_player(game_id)
                    if current:
                        run_cli(current, "endturn", game_id)
                    else:
                        break

            # Check if phase changed
            new_phase = get_phase(game_id)
            if new_phase == phase:
                # Phase didn't change, we might be stuck
                break

        # Show brief status
        output = strip_ansi(run_cli("playtest_germany", "state", game_id))
        for line in output.split('\n'):
            if any(x in line for x in ['Age', 'Turn', 'Round', 'Phase', 'Progress']):
                print(line.strip())
                break

    print(f"\n{'='*45}")
    print(f"Autoplay complete: {num_turns} turns")
    print(f"{'='*45}\n")

    show_status(game_id)


def run_action(player, command, *args, game_id=None):
    """Run a single action for a player."""
    if game_id is None:
        game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return

    output = run_cli(player, command, game_id, *args)
    print(output)


def launch_ship(player, ship_id, gas_type="hydrogen"):
    """Launch a ship."""
    game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return
    output = run_cli(player, "launch", game_id, ship_id, gas_type)
    print(output)


def claim_route(player, ship_id, route_id):
    """Claim a route with a launched ship."""
    game_id = get_game_id()
    if not game_id:
        print("No current game. Run 'setup' first.")
        return
    output = run_cli(player, "action", game_id, "CLAIM_ROUTE", f"shipId={ship_id}", f"routeId={route_id}")
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


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    cmd = sys.argv[1].lower()

    if cmd == "setup":
        game_name = sys.argv[2] if len(sys.argv) > 2 else None
        setup_game(game_name)

    elif cmd == "autoplay":
        num_turns = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        autoplay(num_turns)

    elif cmd == "status":
        show_status()

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
        if len(sys.argv) < 4:
            print("Usage: playtest.py launch <player> <shipId> [gasType]")
            return
        player = sys.argv[2]
        ship_id = sys.argv[3]
        gas_type = sys.argv[4] if len(sys.argv) > 4 else "hydrogen"
        launch_ship(player, ship_id, gas_type)

    elif cmd == "claim":
        if len(sys.argv) < 5:
            print("Usage: playtest.py claim <player> <shipId> <routeId>")
            return
        player = sys.argv[2]
        ship_id = sys.argv[3]
        route_id = sys.argv[4]
        claim_route(player, ship_id, route_id)

    elif cmd == "routes":
        show_routes()

    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)


if __name__ == "__main__":
    main()
