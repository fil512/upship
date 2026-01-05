import { writable, derived, get } from 'svelte/store';
import type { GameState, PlayerState, GamePhase, TurnInfo } from '$lib/types/game';
import { user } from './auth';

// Core game state stores
export const gameState = writable<GameState | null>(null);
export const gameVersion = writable<number>(0);
export const gameId = writable<string | null>(null);

// Turn info for Undo/End Turn buttons
export const turnInfo = writable<TurnInfo>({
	canUndo: false,
	lastActionType: null,
	canEndTurn: false
});

/**
 * The effective user ID (for use in derived stores)
 */
export const effectiveUserId = derived([user], ([$user]) => $user?.id ?? null);

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

		// Age transition design bureau phase uses ageTransitionDesignBureau.currentPlayerIndex
		if ($state.phase === 'age_transition_design_bureau' && $state.ageTransitionDesignBureau) {
			const idx = $state.ageTransitionDesignBureau.currentPlayerIndex ?? 0;
			return $state.playerOrder[idx] === $userId;
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

	// Age transition design bureau phase uses ageTransitionDesignBureau.currentPlayerIndex
	if ($state.phase === 'age_transition_design_bureau' && $state.ageTransitionDesignBureau) {
		const idx = $state.ageTransitionDesignBureau.currentPlayerIndex ?? 0;
		return $state.playerOrder[idx];
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
	const userId = get(effectiveUserId);

	console.log(`[CLIENT] updateGameState called: incoming version=${version}, current version=${currentVersion}`);

	// Only update if version is newer
	if (version > currentVersion) {
		console.log(`[CLIENT] Updating state to version ${version}`);
		// Debug: log my player state
		const myPlayerState = userId ? newState.players?.[userId] : null;
		console.log(`[CLIENT] My hand after update:`, myPlayerState?.hand);
		console.log(`[CLIENT] My agents after update:`, myPlayerState?.agents);
		console.log(`[CLIENT] Ground placements:`, Object.keys(newState.groundBoard?.placements || {}));
		gameState.set(newState);
		gameVersion.set(version);
	} else {
		console.log(`[CLIENT] SKIPPED update: version ${version} <= current ${currentVersion}`);
	}
}

/**
 * Update turn info (for Undo/End Turn buttons)
 */
export function updateTurnInfo(info: TurnInfo): void {
	turnInfo.set(info);
}

/**
 * Set the current game ID
 */
export function setGameId(id: string): void {
	gameId.set(id);
}

/**
 * Reset game state (when leaving a game)
 */
export function resetGameState(): void {
	gameState.set(null);
	gameVersion.set(0);
	gameId.set(null);
}
