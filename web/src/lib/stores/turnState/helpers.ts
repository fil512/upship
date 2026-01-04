/**
 * Turn State Helper Functions
 */

import type { GameState, TurnState } from '$lib/types/game';
import type { ActionContext } from './types';

/**
 * Check if it's a player's turn
 */
export function isPlayersTurn(state: GameState, playerId: string): boolean {
	if (state.phase === 'worker_placement') {
		const placementOrder = state.workerPlacement?.placementOrder || state.playerOrder;
		const currentIndex = state.workerPlacement?.currentPlacerIndex || 0;
		return placementOrder[currentIndex] === playerId;
	}

	if (state.phase === 'reveal') {
		return true; // All players can act simultaneously
	}

	if (state.phase === 'income_cleanup') {
		return state.playerOrder[state.currentPlayerIndex] === playerId;
	}

	return false;
}

/**
 * Derive turn state from game state
 */
export function deriveTurnState(state: GameState | null, playerId: string | null): TurnState {
	if (!state || !playerId) return 'idle';

	const playerState = state.players?.[playerId];
	if (!playerState) return 'idle';

	// Only worker_placement phase uses turn states
	if (state.phase !== 'worker_placement') return 'idle';

	// Check if player has passed
	if (playerState.hasPassed) return 'idle';

	const isMyTurn = isPlayersTurn(state, playerId);

	// Check for multi-step flow states
	// These apply even if not "your turn" because you're completing an action

	// Check for awaiting_hazard
	const shipAwaitingHazard = playerState.ships?.find(
		(s) => s.status === 'awaiting_hazard' && s.pendingHazard
	);
	if (shipAwaitingHazard) return 'awaiting_hazard';

	// Check for at_weather_bureau
	if (playerState.peekedHazard) return 'at_weather_bureau';

	// Check for at_ministry
	if (playerState.drawnMinistryCards?.length === 2) return 'at_ministry';

	// Check for at_launchpad
	const launchpadActive = (state as GameState & { launchpadActive?: Record<string, boolean> })
		.launchpadActive;
	if (launchpadActive?.[playerId]) return 'at_launchpad';

	// Normal turn state
	if (isMyTurn) return 'awaiting_action';

	return 'idle';
}

/**
 * Build action context from game state
 */
export function buildActionContext(
	state: GameState | null,
	playerId: string | null,
	turnState: TurnState
): ActionContext {
	if (!state || !playerId) return {};

	const playerState = state.players?.[playerId];
	if (!playerState) return {};

	const context: ActionContext = {};

	if (turnState === 'at_weather_bureau' && playerState.peekedHazard) {
		context.peekedHazard = playerState.peekedHazard;
	}

	if (turnState === 'at_ministry' && playerState.drawnMinistryCards) {
		context.drawnMinistryCards = playerState.drawnMinistryCards;
	}

	if (turnState === 'awaiting_hazard') {
		const ship = playerState.ships?.find((s) => s.status === 'awaiting_hazard');
		if (ship) {
			context.shipAwaitingHazard = ship;
			context.pendingHazard = ship.pendingHazard;
			context.pendingRouteId = ship.pendingRouteId;
		}
	}

	if (turnState === 'at_launchpad') {
		context.launchableShips = playerState.ships?.filter((s) => s.status === 'hangar') || [];
	}

	return context;
}
