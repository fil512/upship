/**
 * Turn State Store
 *
 * Derives the current turn state from game state and provides
 * reactive UI state including available actions and button configurations.
 */

import { derived, type Readable } from 'svelte/store';
import { gameState, effectiveUserId } from '../gameState';
import type { TurnState } from '$lib/types/game';

// Re-export types
export type { ActionButton, ActionContext, TurnUIState } from './types';

// Import helpers
import { ALLOWED_EVENTS, BLOCKING_STATES } from './constants';
import { deriveTurnState, buildActionContext } from './helpers';
import { mapActionsToButtons, getStatePrompt } from './buttonConfig';
import type { TurnUIState } from './types';

/**
 * Derived store that provides complete turn UI state
 */
export const turnUIState: Readable<TurnUIState> = derived(
	[gameState, effectiveUserId],
	([$gameState, $effectiveUserId]) => {
		const turnState = deriveTurnState($gameState, $effectiveUserId);
		const allowedActions = ALLOWED_EVENTS[turnState] || [];
		const actionContext = buildActionContext($gameState, $effectiveUserId, turnState);
		const buttons = mapActionsToButtons(allowedActions, actionContext);

		const isBlocked = BLOCKING_STATES.includes(turnState);
		const prompt = getStatePrompt(turnState, actionContext);

		return {
			turnState,
			isMyTurn: turnState !== 'idle',
			isBlocked,
			prompt,
			buttons,
			actionContext
		};
	}
);

/**
 * Helper to check if a specific action is allowed
 */
export function isActionAllowed(turnState: TurnState, action: string): boolean {
	return ALLOWED_EVENTS[turnState]?.includes(action) ?? false;
}
