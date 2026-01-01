import { writable, derived, get } from 'svelte/store';
import type { GameState, PlayerState, GamePhase } from '$lib/types/game';
import { user } from './auth';

// Core game state stores
export const gameState = writable<GameState | null>(null);
export const gameVersion = writable<number>(0);
export const gameId = writable<string | null>(null);

// Dev mode for player switching
export const isDevMode = writable(false);
export const viewingAsUserId = writable<string | null>(null);

/**
 * The effective user ID - either the real user or dev mode override
 */
export const effectiveUserId = derived(
	[user, viewingAsUserId, isDevMode],
	([$user, $viewingAsUserId, $isDevMode]) => {
		if ($isDevMode && $viewingAsUserId) {
			return $viewingAsUserId;
		}
		return $user?.id ?? null;
	}
);

/**
 * Current player's state
 */
export const myState = derived(
	[gameState, effectiveUserId],
	([$state, $userId]): PlayerState | null => {
		if (!$state || !$userId) return null;
		return $state.players[$userId] ?? null;
	}
);

/**
 * Is it the current user's turn?
 */
export const isMyTurn = derived(
	[gameState, effectiveUserId],
	([$state, $userId]): boolean => {
		if (!$state || !$userId) return false;

		// Worker placement phase uses a different order
		if ($state.phase === 'worker_placement' && $state.workerPlacement) {
			const currentPlacerId =
				$state.workerPlacement.placementOrder[$state.workerPlacement.currentPlacerIndex];
			return currentPlacerId === $userId;
		}

		// Reveal phase - all players can act simultaneously
		if ($state.phase === 'reveal') {
			return true;
		}

		// Other phases - use player order
		return $state.playerOrder[$state.currentPlayerIndex] === $userId;
	}
);

/**
 * Get the current player's ID based on phase
 */
export const currentPlayerId = derived(gameState, ($state): string | null => {
	if (!$state) return null;

	if ($state.phase === 'worker_placement' && $state.workerPlacement) {
		return $state.workerPlacement.placementOrder[$state.workerPlacement.currentPlacerIndex];
	}

	return $state.playerOrder[$state.currentPlayerIndex];
});

/**
 * Get the current player's state
 */
export const currentPlayer = derived(
	[gameState, currentPlayerId],
	([$state, $playerId]): PlayerState | null => {
		if (!$state || !$playerId) return null;
		return $state.players[$playerId] ?? null;
	}
);

/**
 * Get the current phase display name
 */
export const currentPhaseName = derived(gameState, ($state): string => {
	if (!$state) return '';

	const phaseNames: Record<GamePhase, string> = {
		worker_placement: 'Worker Placement',
		reveal: 'Reveal Phase',
		income_cleanup: 'Income & Cleanup',
		age_transition_design_bureau: 'Age Transition'
	};

	return phaseNames[$state.phase] || $state.phase;
});

/**
 * Get all players with their states
 */
export const allPlayers = derived(gameState, ($state) => {
	if (!$state) return [];

	return $state.playerOrder.map((playerId) => ({
		id: playerId,
		...($state.players[playerId] ?? {})
	}));
});

/**
 * Update the game state and version
 */
export function updateGameState(newState: GameState, version: number): void {
	const currentVersion = get(gameVersion);

	// Only update if version is newer
	if (version > currentVersion) {
		gameState.set(newState);
		gameVersion.set(version);
	}
}

/**
 * Set the current game ID
 */
export function setGameId(id: string): void {
	gameId.set(id);
}

/**
 * Enable or disable dev mode
 */
export function setDevMode(enabled: boolean): void {
	isDevMode.set(enabled);
	if (!enabled) {
		viewingAsUserId.set(null);
	}
}

/**
 * Switch to viewing as a different player (dev mode only)
 */
export function switchToPlayer(playerId: string): void {
	if (get(isDevMode)) {
		viewingAsUserId.set(playerId);
	}
}

/**
 * Reset game state (when leaving a game)
 */
export function resetGameState(): void {
	gameState.set(null);
	gameVersion.set(0);
	gameId.set(null);
	viewingAsUserId.set(null);
}
