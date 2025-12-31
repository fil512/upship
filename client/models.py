"""Data models for the UP SHIP! client library."""

from dataclasses import dataclass, field
from typing import Any


@dataclass
class Manifest:
    """Static game data fetched once from the server.

    Contains all lookup tables for upgrades, technologies, locations, etc.
    """
    version: str
    upgrades: dict[str, dict]
    technologies: dict[str, dict]
    technology_bag: dict[str, list[dict]]
    locations: dict[str, dict]
    symbols: dict[str, dict]
    constants: dict[str, Any]

    @classmethod
    def from_dict(cls, data: dict) -> 'Manifest':
        """Create Manifest from API response dict."""
        return cls(
            version=data.get('version', '1.0.0'),
            upgrades=data.get('upgrades', {}),
            technologies=data.get('technologies', {}),
            technology_bag=data.get('technologyBag', {}),
            locations=data.get('locations', {}),
            symbols=data.get('symbols', {}),
            constants=data.get('constants', {}),
        )

    def get_upgrade(self, upgrade_id: str) -> dict | None:
        """Get upgrade definition by ID."""
        return self.upgrades.get(upgrade_id)

    def get_technology(self, tech_id: str) -> dict | None:
        """Get technology definition by ID."""
        return self.technologies.get(tech_id)

    def get_location(self, location_id: str) -> dict | None:
        """Get ground board location by ID."""
        return self.locations.get(location_id)

    def get_location_symbol(self, location_id: str) -> str | None:
        """Get the required symbol for a location."""
        loc = self.locations.get(location_id)
        return loc.get('symbol') if loc else None

    def get_upgrade_weight(self, upgrade_id: str) -> int:
        """Get the weight of an upgrade (negative = uses lift)."""
        upgrade = self.upgrades.get(upgrade_id)
        if upgrade:
            return abs(upgrade.get('weight', 0))
        return 0

    def get_tech_for_upgrade(self, upgrade_id: str) -> str | None:
        """Get the required technology for an upgrade."""
        upgrade = self.upgrades.get(upgrade_id)
        return upgrade.get('requiredTech') if upgrade else None

    def get_upgrade_for_tech(self, tech_id: str) -> dict | None:
        """Get the upgrade that a technology unlocks."""
        for upgrade_id, upgrade in self.upgrades.items():
            if upgrade.get('requiredTech') == tech_id:
                return {'id': upgrade_id, 'slotType': upgrade.get('slotType')}
        return None

    @property
    def progress_thresholds(self) -> dict:
        """Get progress thresholds by player count."""
        return self.constants.get('progressThresholds', {})


@dataclass
class Session:
    """User session information."""
    user_id: str
    username: str
    cookie: str


@dataclass
class Card:
    """A card in a player's hand or deck."""
    id: str
    name: str
    symbol: str  # wrench, coin, propeller, any
    reveal: dict[str, int] = field(default_factory=dict)
    effect: str = ''


@dataclass
class Ship:
    """A ship owned by a player."""
    id: str
    status: str  # hangar, on_route, crashed, completed
    range_stat: int = 0
    speed: int = 0
    reliability: int = 0
    ceiling: int = 0
    gas_type: str | None = None
    claimed_route: str | None = None
    gas_remaining: int = 0

    @classmethod
    def from_dict(cls, data: dict) -> 'Ship':
        """Create Ship from API response dict."""
        return cls(
            id=data.get('id', ''),
            status=data.get('status', 'hangar'),
            range_stat=data.get('range', data.get('rangeStat', 0)),
            speed=data.get('speed', 0),
            reliability=data.get('reliability', 0),
            ceiling=data.get('ceiling', 0),
            gas_type=data.get('gasType'),
            claimed_route=data.get('claimedRoute') or data.get('routeId'),
            gas_remaining=data.get('gasRemaining', 0),
        )


@dataclass
class Blueprint:
    """A player's blueprint (factory template for building ships)."""
    age: int = 1
    frame_slots: list[str | None] = field(default_factory=list)
    fabric_slots: list[str | None] = field(default_factory=list)
    drive_slots: list[str | None] = field(default_factory=list)
    component_slots: list[str | None] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict) -> 'Blueprint':
        """Create Blueprint from API response dict."""
        return cls(
            age=data.get('age', 1),
            frame_slots=data.get('frameSlots', []),
            fabric_slots=data.get('fabricSlots', []),
            drive_slots=data.get('driveSlots', []),
            component_slots=data.get('componentSlots', []),
        )


@dataclass
class Route:
    """An available route for ships to travel."""
    id: str
    name: str
    distance: int = 0
    speed_requirement: int = 0
    ceiling_requirement: int = 0
    gas_type: str = 'hydrogen'
    income: int = 0
    prestige: int = 0
    available: bool = True
    claimed_by: str | None = None

    @classmethod
    def from_dict(cls, data: dict) -> 'Route':
        """Create Route from API response dict.

        Handles both client format (distance, speedRequirement, claimedBy)
        and server format (range, speed, claimed).
        """
        # Handle property name differences between server and client
        # Server uses 'range', client expects 'distance'
        distance = data.get('distance', data.get('range', 0))

        # Server uses 'speed', client expects 'speedRequirement'
        speed_req = data.get('speedRequirement', data.get('speed', 0))

        # Server uses 'claimed' (player ID or null), client expects 'claimedBy'
        claimed_by = data.get('claimedBy', data.get('claimed'))

        # Derive 'available' from 'claimed' if not explicitly set
        # Route is available if not claimed (claimed is null/None)
        if 'available' in data:
            available = data['available']
        else:
            available = claimed_by is None

        # Server uses 'ceiling', extract for route requirements
        ceiling_req = data.get('ceilingRequirement', data.get('ceiling', 0))

        return cls(
            id=data.get('id', ''),
            name=data.get('name', ''),
            distance=distance,
            speed_requirement=speed_req,
            ceiling_requirement=ceiling_req,
            gas_type=data.get('gasType', 'hydrogen'),
            income=data.get('income', 0),
            prestige=data.get('prestige', data.get('vp', 0)),
            available=available,
            claimed_by=claimed_by,
        )


@dataclass
class Technology:
    """A technology tile on the R&D board."""
    id: str
    name: str
    age: int = 1
    cost: int = 0
    category: str = ''
    owned: bool = False

    @classmethod
    def from_dict(cls, data: dict, owned: bool = False) -> 'Technology':
        """Create Technology from API response dict."""
        return cls(
            id=data.get('id', ''),
            name=data.get('name', ''),
            age=data.get('age', 1),
            cost=data.get('cost', 0),
            category=data.get('category', ''),
            owned=owned,
        )


@dataclass
class CombatMission:
    """A combat mission available in Age II."""
    id: str
    name: str
    mission_type: str  # bombing_run, reconnaissance, resupply, naval_patrol, artillery_observation
    range: int = 0
    speed: int = 0
    ceiling: int = 0
    reliability: int = 0
    income: int = 0
    vp: int = 0
    special: str | None = None

    @classmethod
    def from_dict(cls, data: dict) -> 'CombatMission':
        """Create CombatMission from API response dict."""
        return cls(
            id=data.get('id', ''),
            name=data.get('name', ''),
            mission_type=data.get('type', ''),
            range=data.get('range', 0),
            speed=data.get('speed', 0),
            ceiling=data.get('ceiling', 0),
            reliability=data.get('reliability', 0),
            income=data.get('income', 0),
            vp=data.get('vp', 0),
            special=data.get('special'),
        )


@dataclass
class Player:
    """A player in the game."""
    user_id: str
    username: str
    faction: str | None = None
    cash: int = 0
    income: int = 0
    officer_income: int = 0
    engineer_income: int = 0
    officers: int = 0
    engineers: int = 0
    research: int = 0
    research_level: int = 0
    influence: int = 0
    agents: int = 2
    agents_remaining: int = 2
    has_passed: bool = False
    gas_cubes: dict[str, int] = field(default_factory=dict)
    hand: list[Card] = field(default_factory=list)
    hand_size: int = 0
    deck_size: int = 0
    discard_size: int = 0
    ships: list[Ship] = field(default_factory=list)
    technologies: list[str] = field(default_factory=list)
    routes: list[str] = field(default_factory=list)
    blueprint: Blueprint | None = None
    bonuses: dict[str, int] = field(default_factory=dict)
    upgrade_swaps: int = 2
    banned_technologies: list[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, user_id: str, data: dict, username: str = '') -> 'Player':
        """Create Player from API response dict."""
        # Parse ships
        ships = [Ship.from_dict(s) for s in data.get('ships', [])]

        # Parse hand (may be hidden for opponents)
        hand_data = data.get('hand', [])
        hand = []
        if isinstance(hand_data, list):
            for c in hand_data:
                if isinstance(c, dict):
                    hand.append(Card(
                        id=c.get('id', ''),
                        name=c.get('name', ''),
                        symbol=c.get('symbol', ''),
                        reveal=c.get('reveal', {}),
                        effect=c.get('effect', ''),
                    ))

        # Parse blueprint
        bp_data = data.get('blueprint', {})
        blueprint = Blueprint.from_dict(bp_data) if bp_data else None

        return cls(
            user_id=user_id,
            username=username or data.get('username', ''),
            faction=data.get('faction'),
            cash=data.get('cash', 0),
            income=data.get('income', 0),
            officer_income=data.get('officerIncome', 0),
            engineer_income=data.get('engineerIncome', 0),
            officers=data.get('officers', 0),
            engineers=data.get('engineers', 0),
            research=data.get('research', 0),
            research_level=data.get('researchLevel', 0),
            influence=data.get('influence', 0),
            agents=data.get('agents', 2),
            agents_remaining=data.get('agentsRemaining', 2),
            has_passed=data.get('hasPassed', False),
            gas_cubes=data.get('gasCubes', {'hydrogen': 0, 'helium': 0}),
            hand=hand,
            hand_size=data.get('handSize', len(hand)),
            deck_size=data.get('deckSize', 0) if 'deckSize' in data else (len(data.get('deck', [])) if isinstance(data.get('deck'), list) else 0),
            discard_size=data.get('discardSize', 0) if 'discardSize' in data else (len(data.get('discardPile', [])) if isinstance(data.get('discardPile'), list) else 0),
            ships=ships,
            technologies=data.get('technologies', []),
            routes=data.get('routes', []),
            blueprint=blueprint,
            bonuses=data.get('bonuses', {}),
            upgrade_swaps=data.get('upgradeSwaps', 2),
            banned_technologies=data.get('bannedTechnologies', []),
        )


@dataclass
class Game:
    """A game in the lobby."""
    id: str
    name: str
    status: str  # waiting, active, finished
    host_id: str
    players: list[dict] = field(default_factory=list)
    created_at: str = ''

    @classmethod
    def from_dict(cls, data: dict) -> 'Game':
        """Create Game from API response dict."""
        return cls(
            id=data.get('id', ''),
            name=data.get('name', ''),
            status=data.get('status', 'waiting'),
            host_id=data.get('hostId', data.get('host_id', '')),
            players=data.get('players', []),
            created_at=data.get('createdAt', data.get('created_at', '')),
        )


@dataclass
class WorkerPlacement:
    """Worker placement phase state."""
    placement_order: list[str] = field(default_factory=list)
    current_placer_index: int = 0
    placements: dict[str, dict] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: dict) -> 'WorkerPlacement':
        """Create WorkerPlacement from API response dict."""
        return cls(
            placement_order=data.get('placementOrder', []),
            current_placer_index=data.get('currentPlacerIndex', 0),
            placements=data.get('placements', {}),
        )


@dataclass
class GameState:
    """The full game state."""
    game_id: str
    age: int = 1
    turn: int = 1
    round: int = 1
    phase: str = 'worker_placement'
    progress_track: int = 0
    current_player_id: str | None = None
    current_player_index: int = 0
    player_order: list[str] = field(default_factory=list)
    players: dict[str, Player] = field(default_factory=dict)
    players_ended_turn: list[str] = field(default_factory=list)
    gas_market: dict[str, int] = field(default_factory=dict)
    ground_board: dict[str, Any] = field(default_factory=dict)
    rd_board: dict[str, Any] = field(default_factory=dict)
    routes: list[Route] = field(default_factory=list)
    available_routes: list[Route] = field(default_factory=list)
    mission_row: list[CombatMission] = field(default_factory=list)  # Age II only
    worker_placement: WorkerPlacement | None = None
    log: list[dict] = field(default_factory=list)

    @classmethod
    def from_dict(cls, game_id: str, data: dict) -> 'GameState':
        """Create GameState from API response dict."""
        # Parse players
        players_data = data.get('players', {})
        players = {}
        for uid, pdata in players_data.items():
            players[uid] = Player.from_dict(uid, pdata)

        # Parse routes - server stores in state.map.routes, client expected state.routes
        # Check both locations for compatibility
        map_data = data.get('map', {})
        routes_data = data.get('routes', []) or map_data.get('routes', [])
        routes = [Route.from_dict(r) for r in routes_data]

        # available_routes is a convenience list of unclaimed routes
        available_routes_data = data.get('availableRoutes', [])
        if available_routes_data:
            available_routes = [Route.from_dict(r) for r in available_routes_data]
        else:
            # Derive from routes list if not provided
            available_routes = [r for r in routes if r.available]

        # Parse combat mission row (Age II only)
        mission_row = [CombatMission.from_dict(m) for m in data.get('missionRow', [])]

        # Parse worker placement
        wp_data = data.get('workerPlacement', {})
        worker_placement = WorkerPlacement.from_dict(wp_data) if wp_data else None

        # Determine current player
        player_order = data.get('playerOrder', [])
        current_player_index = data.get('currentPlayerIndex', 0)
        current_player_id = None
        if player_order and 0 <= current_player_index < len(player_order):
            current_player_id = player_order[current_player_index]

        return cls(
            game_id=game_id,
            age=data.get('age', 1),
            turn=data.get('turn', 1),
            round=data.get('round', 1),
            phase=data.get('phase', 'worker_placement'),
            progress_track=data.get('progressTrack', 0),
            current_player_id=current_player_id,
            current_player_index=current_player_index,
            player_order=player_order,
            players=players,
            players_ended_turn=data.get('playersEndedTurn', []),
            gas_market=data.get('gasMarket', {'hydrogen': 0, 'helium': 0}),
            ground_board=data.get('groundBoard', {}),
            rd_board=data.get('rdBoard', data.get('rnDBoard', {})),
            routes=routes,
            available_routes=available_routes,
            mission_row=mission_row,
            worker_placement=worker_placement,
            log=data.get('log', []),
        )

    def get_player(self, user_id: str) -> Player | None:
        """Get a player by user ID."""
        return self.players.get(user_id)

    def is_my_turn(self, user_id: str) -> bool:
        """Check if it's the given player's turn."""
        if self.phase == 'worker_placement':
            if self.worker_placement:
                idx = self.worker_placement.current_placer_index
                order = self.worker_placement.placement_order
                if 0 <= idx < len(order):
                    return order[idx] == user_id
            return False
        elif self.phase == 'reveal':
            # Reveal is simultaneous - player hasn't acted if not in playersEndedTurn
            return user_id not in self.players_ended_turn
        else:
            return self.current_player_id == user_id


@dataclass
class ActionResult:
    """Result of executing a game action."""
    success: bool
    game_state: GameState | None = None
    error: str | None = None
    raw_response: dict = field(default_factory=dict)

    @classmethod
    def from_response(cls, game_id: str, data: dict) -> 'ActionResult':
        """Create ActionResult from API response."""
        success = data.get('success', False)
        error = data.get('error')

        game_state = None
        state_data = data.get('gameState')
        if state_data:
            game_state = GameState.from_dict(game_id, state_data)

        return cls(
            success=success,
            game_state=game_state,
            error=error,
            raw_response=data,
        )
