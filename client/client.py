"""Main client class for the UP SHIP! API."""

from typing import Any

from .api import APIClient
from .exceptions import SessionNotFoundError, APIError, InvalidActionError
from .models import (
    Session, Game, GameState, Blueprint, Route, ActionResult, Player, Manifest
)
from .session import load_session, save_session, delete_session


class UpshipClient:
    """Client for interacting with the UP SHIP! game server.

    This client provides methods for authentication, game lobby operations,
    and in-game actions. Sessions are automatically persisted to disk for
    interoperability with the JavaScript CLI.

    The client automatically fetches and caches static game data (manifest)
    on first use. Access via the `manifest` property.

    Example:
        client = UpshipClient()
        session = client.login('testpilot42', 'airship123')
        games = client.list_games('testpilot42')
        state = client.get_state('testpilot42', game_id)
        result = client.place_agent('testpilot42', game_id, 'design-bureau', 0)

        # Access static game data
        upgrade = client.manifest.get_upgrade('basic_engine')
    """

    def __init__(self, base_url: str | None = None):
        """Initialize the client.

        Args:
            base_url: The base URL of the UP SHIP! server.
                     Defaults to UPSHIP_URL env var or production URL.
        """
        self.api = APIClient(base_url)
        self._manifest: Manifest | None = None

    @property
    def manifest(self) -> Manifest:
        """Get the game manifest (static data).

        Fetches from the server on first access and caches for future use.

        Returns:
            The Manifest containing all static game data.
        """
        if self._manifest is None:
            self._manifest = self._fetch_manifest()
        return self._manifest

    def _fetch_manifest(self) -> Manifest:
        """Fetch the manifest from the server."""
        data, _ = self.api.get('/api/manifest')
        return Manifest.from_dict(data)

    def ensure_initialized(self) -> None:
        """Ensure the client is initialized with manifest data.

        Call this explicitly if you want to eagerly load the manifest
        rather than waiting for first access.
        """
        _ = self.manifest

    def _get_cookie(self, username: str) -> str:
        """Get the session cookie for a user."""
        try:
            session = load_session(username)
            return session.cookie
        except SessionNotFoundError:
            raise SessionNotFoundError(
                f"No session found for '{username}'. Please login first."
            )

    def _update_session_cookie(self, username: str, new_cookie: str | None) -> None:
        """Update the session cookie if the server sent a new one."""
        if new_cookie:
            try:
                session = load_session(username)
                session.cookie = new_cookie
                save_session(username, session)
            except SessionNotFoundError:
                pass

    def _api_get(self, username: str, path: str) -> dict[str, Any]:
        """Make an authenticated GET request."""
        cookie = self._get_cookie(username)
        data, new_cookie = self.api.get(path, cookie=cookie)
        self._update_session_cookie(username, new_cookie)
        return data

    def _api_post(
        self,
        username: str,
        path: str,
        body: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Make an authenticated POST request."""
        cookie = self._get_cookie(username)
        data, new_cookie = self.api.post(path, body=body, cookie=cookie)
        self._update_session_cookie(username, new_cookie)
        return data

    # =========================================================================
    # Authentication
    # =========================================================================

    def login(self, username: str, password: str) -> Session:
        """Login and store the session.

        Args:
            username: The username to login with.
            password: The password.

        Returns:
            The Session object with user ID and session cookie.
        """
        data, new_cookie = self.api.post(
            '/api/auth/login',
            body={'username': username, 'password': password},
        )

        user_id = data.get('userId', data.get('user', {}).get('id', ''))
        cookie = new_cookie or ''

        session = Session(
            user_id=user_id,
            username=username,
            cookie=cookie,
        )
        save_session(username, session)
        return session

    def register(self, username: str, password: str) -> Session:
        """Register a new account and login.

        Args:
            username: The username for the new account.
            password: The password for the new account.

        Returns:
            The Session object with user ID and session cookie.
        """
        data, new_cookie = self.api.post(
            '/api/auth/register',
            body={'username': username, 'password': password},
        )

        user_id = data.get('userId', data.get('user', {}).get('id', ''))
        cookie = new_cookie or ''

        session = Session(
            user_id=user_id,
            username=username,
            cookie=cookie,
        )
        save_session(username, session)
        return session

    def logout(self, username: str) -> None:
        """Logout and delete the session.

        Args:
            username: The username to logout.
        """
        try:
            self._api_post(username, '/api/auth/logout')
        except (APIError, SessionNotFoundError):
            pass  # Ignore errors, just delete local session

        delete_session(username)

    def whoami(self, username: str) -> dict[str, Any]:
        """Get the current user info.

        Args:
            username: The username to check.

        Returns:
            User info dictionary with 'id' and 'username'.
        """
        return self._api_get(username, '/api/auth/me')

    # =========================================================================
    # Game Lobby
    # =========================================================================

    def list_games(self, username: str, status: str = 'all') -> list[Game]:
        """List games in the lobby.

        Args:
            username: The authenticated username.
            status: Filter by status ('waiting', 'active', 'finished', 'mine', 'all').

        Returns:
            List of Game objects.
        """
        if status == 'mine':
            data = self._api_get(username, '/api/games/mine')
        elif status == 'all':
            data = self._api_get(username, '/api/games')
        else:
            data = self._api_get(username, f'/api/games?status={status}')

        games = data.get('games', data if isinstance(data, list) else [])
        return [Game.from_dict(g) for g in games]

    def get_game_info(self, username: str, game_id: str) -> Game:
        """Get game lobby info (status, players, factions).

        Args:
            username: The authenticated username.
            game_id: The ID of the game.

        Returns:
            The Game object with current lobby status.
        """
        data = self._api_get(username, f'/api/games/{game_id}')
        game_data = data.get('game', data)
        return Game.from_dict(game_data)

    def create_game(self, username: str, name: str) -> Game:
        """Create a new game.

        Args:
            username: The authenticated username (will be the host).
            name: The name for the new game.

        Returns:
            The created Game object.
        """
        data = self._api_post(username, '/api/games', body={'name': name})
        game_data = data.get('game', data)
        return Game.from_dict(game_data)

    def join_game(self, username: str, game_id: str) -> Game:
        """Join an existing game.

        Args:
            username: The authenticated username.
            game_id: The ID of the game to join.

        Returns:
            The updated Game object.
        """
        data = self._api_post(username, f'/api/games/{game_id}/join')
        game_data = data.get('game', data)
        return Game.from_dict(game_data)

    def leave_game(self, username: str, game_id: str) -> None:
        """Leave a game.

        Args:
            username: The authenticated username.
            game_id: The ID of the game to leave.
        """
        self._api_post(username, f'/api/games/{game_id}/leave')

    def select_faction(self, username: str, game_id: str, faction: str) -> Game:
        """Select a faction for the game.

        Args:
            username: The authenticated username.
            game_id: The ID of the game.
            faction: The faction to select ('germany', 'britain', 'usa', 'italy').

        Returns:
            The updated Game object.
        """
        data = self._api_post(
            username,
            f'/api/games/{game_id}/faction',
            body={'faction': faction},
        )
        game_data = data.get('game', data)
        return Game.from_dict(game_data)

    def add_bot(self, username: str, game_id: str, faction: str) -> Game:
        """Add a bot player to the game (host only).

        Args:
            username: The authenticated username (must be host).
            game_id: The ID of the game.
            faction: The faction for the bot ('germany', 'britain', 'usa', 'italy').

        Returns:
            The updated Game object.
        """
        data = self._api_post(
            username,
            f'/api/games/{game_id}/bot',
            body={'faction': faction},
        )
        game_data = data.get('game', data)
        return Game.from_dict(game_data)

    def remove_bot(self, username: str, game_id: str, bot_id: str) -> Game:
        """Remove a bot player from the game (host only).

        Args:
            username: The authenticated username (must be host).
            game_id: The ID of the game.
            bot_id: The ID of the bot to remove.

        Returns:
            The updated Game object.
        """
        cookie = self._get_cookie(username)
        data, new_cookie = self.api.delete(f'/api/games/{game_id}/bot/{bot_id}', cookie=cookie)
        self._update_session_cookie(username, new_cookie)
        game_data = data.get('game', data)
        return Game.from_dict(game_data)

    def start_game(self, username: str, game_id: str) -> GameState:
        """Start a game (host only).

        Args:
            username: The authenticated username (must be host).
            game_id: The ID of the game to start.

        Returns:
            The initial GameState.
        """
        data = self._api_post(username, f'/api/games/{game_id}/start')
        state_data = data.get('state', data.get('gameState', data))
        return GameState.from_dict(game_id, state_data)

    # =========================================================================
    # Game State
    # =========================================================================

    def get_state(self, username: str, game_id: str) -> GameState:
        """Get the current game state.

        Args:
            username: The authenticated username.
            game_id: The ID of the game.

        Returns:
            The current GameState.
        """
        data = self._api_get(username, f'/api/state/{game_id}')
        # API returns { gameState: { phase, age, state: { players, ... } } }
        game_state_wrapper = data.get('gameState', data)
        # Merge top-level gameState fields with nested state
        state_data = game_state_wrapper.get('state', {})
        # Copy top-level fields that aren't in nested state
        for key in ['phase', 'age', 'turnNumber', 'currentPlayerId']:
            if key in game_state_wrapper and key not in state_data:
                state_data[key] = game_state_wrapper[key]
        # Map turnNumber to turn
        if 'turnNumber' in state_data and 'turn' not in state_data:
            state_data['turn'] = state_data['turnNumber']
        return GameState.from_dict(game_id, state_data)

    def get_blueprint(self, username: str, game_id: str) -> Blueprint:
        """Get the player's blueprint.

        Args:
            username: The authenticated username.
            game_id: The ID of the game.

        Returns:
            The player's Blueprint.
        """
        state = self.get_state(username, game_id)
        session = load_session(username)

        player = state.get_player(session.user_id)
        if player and player.blueprint:
            return player.blueprint

        return Blueprint()

    def get_routes(self, username: str, game_id: str) -> list[Route]:
        """Get available routes.

        Args:
            username: The authenticated username.
            game_id: The ID of the game.

        Returns:
            List of available Route objects.
        """
        state = self.get_state(username, game_id)
        return state.available_routes or state.routes

    def get_upgrades(self, username: str, game_id: str) -> list[dict[str, Any]]:
        """Get available upgrades for the player's technologies.

        Args:
            username: The authenticated username.
            game_id: The ID of the game.

        Returns:
            List of upgrade dictionaries.
        """
        data = self._api_get(username, f'/api/state/{game_id}/upgrades')
        return data.get('upgrades', data if isinstance(data, list) else [])

    def get_log(self, username: str, game_id: str, limit: int = 20) -> list[dict[str, Any]]:
        """Get the game action log.

        Args:
            username: The authenticated username.
            game_id: The ID of the game.
            limit: Maximum number of log entries to return.

        Returns:
            List of log entry dictionaries.
        """
        data = self._api_get(username, f'/api/state/{game_id}/actions?limit={limit}')
        return data.get('actions', data if isinstance(data, list) else [])

    def get_player(self, username: str, game_id: str) -> Player:
        """Get the current player's data.

        Args:
            username: The authenticated username.
            game_id: The ID of the game.

        Returns:
            The Player object for the authenticated user.
        """
        state = self.get_state(username, game_id)
        session = load_session(username)
        player = state.get_player(session.user_id)
        if not player:
            raise APIError(f"Player not found in game {game_id}")
        return player

    # =========================================================================
    # Actions
    # =========================================================================

    def action(
        self,
        username: str,
        game_id: str,
        action_type: str,
        **kwargs: Any,
    ) -> ActionResult:
        """Execute a generic game action.

        Args:
            username: The authenticated username.
            game_id: The ID of the game.
            action_type: The action type (e.g., 'END_TURN', 'BUY_GAS').
            **kwargs: Additional action parameters.

        Returns:
            ActionResult with success status and updated game state.
        """
        body = {'actionType': action_type, 'actionData': kwargs}
        data = self._api_post(username, f'/api/state/{game_id}/action', body=body)
        return ActionResult.from_response(game_id, data)

    def end_turn(self, username: str, game_id: str) -> ActionResult:
        """End the current turn."""
        return self.action(username, game_id, 'END_TURN')

    def pass_turn(self, username: str, game_id: str) -> ActionResult:
        """Exit worker placement without acquiring technologies or cards.

        DEPRECATED: Use reveal() instead. This method is an alias for reveal()
        with no acquisitions.
        """
        return self.reveal(username, game_id)

    def place_agent(
        self,
        username: str,
        game_id: str,
        location_id: str,
        card_index: int,
        **kwargs: Any,
    ) -> ActionResult:
        """Place an agent at a location.

        Args:
            username: The authenticated username.
            game_id: The ID of the game.
            location_id: The location to place at (e.g., 'design-bureau').
            card_index: Index of the card in hand to use.
            **kwargs: Location-specific parameters (buildCount, gasType, etc.).

        Returns:
            ActionResult with success status and updated game state.
        """
        return self.action(
            username,
            game_id,
            'PLACE_AGENT',
            locationId=location_id,
            cardIndex=card_index,
            **kwargs,
        )

    def reveal(
        self,
        username: str,
        game_id: str,
        tech_acquisitions: list[str] | None = None,
        market_purchases: list[int] | None = None,
    ) -> ActionResult:
        """Complete the reveal phase actions.

        Args:
            username: The authenticated username.
            game_id: The ID of the game.
            tech_acquisitions: List of technology IDs to acquire.
            market_purchases: List of market card indices to purchase.

        Returns:
            ActionResult with success status and updated game state.
        """
        kwargs: dict[str, Any] = {}
        if tech_acquisitions:
            kwargs['techAcquisitions'] = tech_acquisitions
        if market_purchases:
            kwargs['marketPurchases'] = market_purchases
        return self.action(username, game_id, 'REVEAL', **kwargs)

    def no_more_launches(self, username: str, game_id: str) -> ActionResult:
        """Signal done launching ships at the launchpad."""
        return self.action(username, game_id, 'NO_MORE_LAUNCHES')

    def buy_gas(
        self,
        username: str,
        game_id: str,
        gas_type: str,
        amount: int = 1,
        source: str = 'market',
    ) -> ActionResult:
        """Buy gas from the market.

        Args:
            username: The authenticated username.
            game_id: The ID of the game.
            gas_type: Type of gas ('hydrogen' or 'helium').
            amount: Number of cubes to buy.
            source: 'market' or 'domestic' (USA only for helium at £2/cube).

        Returns:
            ActionResult with success status and updated game state.
        """
        return self.action(username, game_id, 'BUY_GAS', gasType=gas_type, amount=amount, source=source)

    def draw_cards(self, username: str, game_id: str, count: int = 1) -> ActionResult:
        """Draw cards from the deck."""
        return self.action(username, game_id, 'DRAW_CARDS', count=count)

    def build_ship(self, username: str, game_id: str, count: int = 1) -> ActionResult:
        """Build ships in the hangar.

        Args:
            username: The authenticated username.
            game_id: The ID of the game.
            count: Number of ships to build.

        Returns:
            ActionResult with success status and updated game state.
        """
        return self.action(username, game_id, 'BUILD_SHIP', count=count)

    def launch_ship(
        self,
        username: str,
        game_id: str,
        ship_id: str,
        route_id: str,
        gas_type: str = 'hydrogen',
    ) -> ActionResult:
        """Launch a ship on a route.

        Args:
            username: The authenticated username.
            game_id: The ID of the game.
            ship_id: The ID of the ship to launch.
            route_id: The ID of the route to claim.
            gas_type: Type of gas to use ('hydrogen' or 'helium').

        Returns:
            ActionResult with success status and updated game state.
        """
        return self.action(
            username,
            game_id,
            'LAUNCH_SHIP',
            shipId=ship_id,
            routeId=route_id,
            gasType=gas_type,
        )

    def launch_combat_mission(
        self,
        username: str,
        game_id: str,
        ship_id: str,
        mission_id: str,
        gas_type: str = 'hydrogen',
    ) -> ActionResult:
        """Launch a ship on a combat mission (Age II only).

        Args:
            username: The authenticated username.
            game_id: The ID of the game.
            ship_id: The ID of the ship to launch.
            mission_id: The ID of the combat mission from the Mission Row.
            gas_type: Type of gas to use ('hydrogen' or 'helium').

        Returns:
            ActionResult with success status and updated game state.
        """
        return self.action(
            username,
            game_id,
            'LAUNCH_COMBAT_MISSION',
            shipId=ship_id,
            missionId=mission_id,
            gasType=gas_type,
        )

    def acquire_technology(self, username: str, game_id: str, tech_id: str) -> ActionResult:
        """Acquire a technology from the R&D board.

        Args:
            username: The authenticated username.
            game_id: The ID of the game.
            tech_id: The ID of the technology to acquire.

        Returns:
            ActionResult with success status and updated game state.
        """
        return self.action(username, game_id, 'ACQUIRE_TECHNOLOGY', techId=tech_id)

    def acquire_tech_card_tentative(self, username: str, game_id: str, tech_card_id: str) -> ActionResult:
        """Tentatively acquire a tech card during reveal.

        This marks the tech card as claimed by this player but doesn't finalize
        until END_TURN is called. Used after REVEAL but before END_TURN.

        Args:
            username: The authenticated username.
            game_id: The ID of the game.
            tech_card_id: The ID of the tech card to acquire.

        Returns:
            ActionResult with success status and updated game state.
        """
        return self.action(username, game_id, 'ACQUIRE_TECH_CARD_TENTATIVE', techCardId=tech_card_id)

    def buy_market_card_tentative(self, username: str, game_id: str, card_id: str) -> ActionResult:
        """Tentatively buy a market card (agent card) during reveal.

        This marks the market card as claimed by this player but doesn't finalize
        until END_TURN is called. Used after REVEAL but before END_TURN.
        Costs influence based on the card's cost (default 3).

        Args:
            username: The authenticated username.
            game_id: The ID of the game.
            card_id: The ID of the market card to buy.

        Returns:
            ActionResult with success status and updated game state.
        """
        return self.action(username, game_id, 'BUY_MARKET_CARD_TENTATIVE', cardId=card_id)

    def install_upgrade(
        self,
        username: str,
        game_id: str,
        slot_type: str,
        slot_index: int,
        upgrade_id: str,
    ) -> ActionResult:
        """Install an upgrade in the blueprint.

        Args:
            username: The authenticated username.
            game_id: The ID of the game.
            slot_type: The slot type ('frame', 'fabric', 'drive', 'component').
            slot_index: The slot index (0-based).
            upgrade_id: The ID of the upgrade to install.

        Returns:
            ActionResult with success status and updated game state.
        """
        return self.action(
            username,
            game_id,
            'INSTALL_UPGRADE',
            slotType=slot_type,
            slotIndex=slot_index,
            upgradeId=upgrade_id,
        )

    def remove_upgrade(
        self,
        username: str,
        game_id: str,
        slot_type: str,
        slot_index: int,
    ) -> ActionResult:
        """Remove an upgrade from the blueprint.

        Args:
            username: The authenticated username.
            game_id: The ID of the game.
            slot_type: The slot type ('frame', 'fabric', 'drive', 'component').
            slot_index: The slot index (0-based).

        Returns:
            ActionResult with success status and updated game state.
        """
        return self.action(
            username,
            game_id,
            'REMOVE_UPGRADE',
            slotType=slot_type,
            slotIndex=slot_index,
        )

    def collect_income(self, username: str, game_id: str) -> ActionResult:
        """Collect income during the income phase."""
        return self.action(username, game_id, 'COLLECT_INCOME')

    def play_card(self, username: str, game_id: str, card_index: int) -> ActionResult:
        """Play a card from hand."""
        return self.action(username, game_id, 'PLAY_CARD', cardIndex=card_index)

    def poke_bots(self, username: str, game_id: str) -> dict:
        """Trigger bot execution for a stuck game.

        This is useful when bots aren't executing after a server restart.

        Args:
            username: The authenticated username.
            game_id: The ID of the game to poke.

        Returns:
            Response dict with success status and diagnostics.
        """
        return self._api_post(username, f'/api/state/{game_id}/poke')

    def save_flow_log(self, username: str, game_id: str) -> dict:
        """Save the resource flow log for analysis.

        This is a superuser-only endpoint for saving flow data when a game
        gets stuck and doesn't reach natural end.

        Args:
            username: The authenticated superuser username.
            game_id: The ID of the game.

        Returns:
            Response dict with success status and log path.
        """
        return self._api_post(username, f'/api/state/{game_id}/save-flow-log')
