"""Shared state for playtest bots.

Since all 4 bots run in the same Python process, we can maintain shared state
that's updated immediately when any bot claims a route or mission. This avoids
stale data issues from server fetches.
"""

from dataclasses import dataclass, field
from typing import Optional

from client.models import Route

from .state import get_state, get_available_routes as fetch_routes_from_server


@dataclass
class SharedPlaytestState:
    """Shared state across all playtest bots."""

    game_id: Optional[str] = None
    current_age: int = 1

    # Routes available for claiming (updated when any bot claims one)
    available_routes: list[Route] = field(default_factory=list)

    # Track who claimed what (route_id -> player username)
    claimed_routes: dict[str, str] = field(default_factory=dict)

    # Missions available for Age II (updated when any bot claims one)
    available_missions: list = field(default_factory=list)
    claimed_missions: dict[str, str] = field(default_factory=dict)

    def reset(self, game_id: str) -> None:
        """Reset state for a new game."""
        self.game_id = game_id
        self.current_age = 1
        self.available_routes = []
        self.claimed_routes = {}
        self.available_missions = []
        self.claimed_missions = {}

    def refresh_from_server(self, game_id: str) -> None:
        """Fetch fresh route/mission data from server.

        Call this at the start of autoplay and after age transitions.
        """
        self.game_id = game_id
        state = get_state(game_id)
        if not state:
            return

        self.current_age = state.age or 1

        # Get routes from server and filter out already-claimed ones
        all_routes = state.routes or []
        self.available_routes = [r for r in all_routes if r.available]

        # Track already-claimed routes
        self.claimed_routes = {
            r.id: str(r.claimed_by) for r in all_routes
            if not r.available and r.id
        }

        # Get missions for Age II
        if self.current_age == 2 and hasattr(state, 'mission_row'):
            all_missions = state.mission_row or []
            self.available_missions = [m for m in all_missions if not getattr(m, 'claimed', None)]
            self.claimed_missions = {
                m.id: str(m.claimed) for m in all_missions
                if getattr(m, 'claimed', None) and hasattr(m, 'id')
            }
        else:
            self.available_missions = []
            self.claimed_missions = {}

    def mark_route_claimed(self, route_id: str, player: str) -> None:
        """Mark a route as claimed by a player.

        Call this after a successful launch.
        """
        self.claimed_routes[route_id] = player
        self.available_routes = [r for r in self.available_routes if r.id != route_id]

    def mark_mission_claimed(self, mission_id: str, player: str) -> None:
        """Mark a mission as claimed by a player.

        Call this after a successful mission launch.
        """
        self.claimed_missions[mission_id] = player
        self.available_missions = [m for m in self.available_missions if m.id != mission_id]

    def get_available_routes(self) -> list[Route]:
        """Get routes available for claiming."""
        return self.available_routes.copy()

    def get_available_missions(self) -> list:
        """Get missions available for claiming (Age II only)."""
        return self.available_missions.copy()

    def is_route_available(self, route_id: str) -> bool:
        """Check if a specific route is available."""
        return route_id not in self.claimed_routes

    def is_mission_available(self, mission_id: str) -> bool:
        """Check if a specific mission is available."""
        return mission_id not in self.claimed_missions


# Global shared state instance
_shared_state = SharedPlaytestState()


def get_shared_state() -> SharedPlaytestState:
    """Get the global shared state instance."""
    return _shared_state


def init_shared_state(game_id: str) -> None:
    """Initialize shared state for a new game or after age transition."""
    _shared_state.refresh_from_server(game_id)


def reset_shared_state(game_id: str) -> None:
    """Reset shared state for a completely new game."""
    _shared_state.reset(game_id)
    _shared_state.refresh_from_server(game_id)
