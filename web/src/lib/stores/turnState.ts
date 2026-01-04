/**
 * Turn State Store
 *
 * Derives the current turn state from game state and provides
 * reactive UI state including available actions and button configurations.
 */

import { derived, type Readable } from 'svelte/store';
import { gameState, effectiveUserId } from './gameState';
import type { GameState, PlayerState, Ship, HazardCard, Card, TurnState } from '$lib/types/game';

// Button configuration for UI
export interface ActionButton {
	action: string;
	label: string;
	description: string;
	icon: string;
	primary: boolean;
	requiresSelection: boolean;
	selectionType?: 'location_and_card' | 'ship_and_route';
	actionData?: Record<string, unknown>;
	variant?: 'success' | 'warning' | 'danger';
	disabled?: boolean;
	disabledReason?: string;
}

// Context data for current state
export interface ActionContext {
	peekedHazard?: HazardCard;
	drawnMinistryCards?: Card[];
	shipAwaitingHazard?: Ship;
	pendingHazard?: HazardCard;
	pendingRouteId?: string;
	launchableShips?: Ship[];
}

// Complete UI state
export interface TurnUIState {
	turnState: TurnState;
	isMyTurn: boolean;
	isBlocked: boolean;
	prompt: string;
	buttons: ActionButton[];
	actionContext: ActionContext;
}

/**
 * Allowed events for each turn state
 */
const ALLOWED_EVENTS: Record<TurnState, string[]> = {
	idle: [],
	awaiting_action: ['PLACE_AGENT', 'REVEAL'],
	at_weather_bureau: ['KEEP_HAZARD', 'DISCARD_HAZARD'],
	at_ministry: ['DISCARD_MINISTRY_CARD'],
	at_launchpad: ['LAUNCH_SHIP', 'NO_MORE_LAUNCHES'],
	awaiting_hazard: ['RESPOND_TO_HAZARD']
};

/**
 * Check if it's a player's turn
 */
function isPlayersTurn(state: GameState, playerId: string): boolean {
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
function deriveTurnState(state: GameState | null, playerId: string | null): TurnState {
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
function buildActionContext(
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

/**
 * Map actions to button configurations
 */
function mapActionsToButtons(
	allowedActions: string[],
	actionContext: ActionContext
): ActionButton[] {
	const buttons: ActionButton[] = [];

	for (const action of allowedActions) {
		switch (action) {
			case 'PLACE_AGENT':
				buttons.push({
					action: 'PLACE_AGENT',
					label: 'Place Agent',
					description: 'Place an agent on a Ground Board location',
					icon: 'agent',
					primary: true,
					requiresSelection: true,
					selectionType: 'location_and_card'
				});
				break;

			case 'REVEAL':
				buttons.push({
					action: 'REVEAL',
					label: 'Reveal & Pass',
					description: 'Reveal your hand and exit worker placement',
					icon: 'reveal',
					primary: false,
					requiresSelection: false
				});
				break;

			case 'KEEP_HAZARD':
				buttons.push({
					action: 'KEEP_HAZARD',
					label: 'Keep Hazard',
					description: `Keep "${actionContext.peekedHazard?.name || 'hazard'}" on top`,
					icon: 'keep',
					primary: false,
					requiresSelection: false,
					variant: 'warning'
				});
				break;

			case 'DISCARD_HAZARD':
				buttons.push({
					action: 'DISCARD_HAZARD',
					label: 'Discard Hazard',
					description: `Remove "${actionContext.peekedHazard?.name || 'hazard'}" from deck`,
					icon: 'discard',
					primary: true,
					requiresSelection: false,
					variant: 'success'
				});
				break;

			case 'DISCARD_MINISTRY_CARD':
				if (actionContext.drawnMinistryCards?.length === 2) {
					const [card0, card1] = actionContext.drawnMinistryCards;
					buttons.push({
						action: 'DISCARD_MINISTRY_CARD',
						label: `Keep "${card1?.name || 'Card 2'}"`,
						description: `Discard "${card0?.name || 'Card 1'}"`,
						icon: 'card',
						primary: false,
						requiresSelection: false,
						actionData: { cardIndex: 0 }
					});
					buttons.push({
						action: 'DISCARD_MINISTRY_CARD',
						label: `Keep "${card0?.name || 'Card 1'}"`,
						description: `Discard "${card1?.name || 'Card 2'}"`,
						icon: 'card',
						primary: false,
						requiresSelection: false,
						actionData: { cardIndex: 1 }
					});
				}
				break;

			case 'LAUNCH_SHIP':
				buttons.push({
					action: 'LAUNCH_SHIP',
					label: 'Launch Ship',
					description: 'Launch a ship to claim a route',
					icon: 'launch',
					primary: true,
					requiresSelection: true,
					selectionType: 'ship_and_route',
					disabled: (actionContext.launchableShips?.length || 0) === 0,
					disabledReason: 'No ships available to launch'
				});
				break;

			case 'NO_MORE_LAUNCHES':
				buttons.push({
					action: 'NO_MORE_LAUNCHES',
					label: 'Done Launching',
					description: 'End your turn at the launchpad',
					icon: 'done',
					primary: false,
					requiresSelection: false
				});
				break;

			case 'RESPOND_TO_HAZARD':
				if (actionContext.pendingHazard) {
					buttons.push({
						action: 'RESPOND_TO_HAZARD',
						label: 'Accept Risk',
						description: 'Attempt without spending engineers',
						icon: 'dice',
						primary: false,
						requiresSelection: false,
						actionData: { spendEngineers: false }
					});

					const engineerCost = actionContext.pendingHazard.engineerCost;
					if (engineerCost) {
						buttons.push({
							action: 'RESPOND_TO_HAZARD',
							label: `Spend ${engineerCost} Engineer(s)`,
							description: 'Guarantee passing the check',
							icon: 'engineer',
							primary: true,
							requiresSelection: false,
							actionData: { spendEngineers: true },
							variant: 'success'
						});
					}
				}
				break;
		}
	}

	return buttons;
}

/**
 * Get human-readable prompt for current state
 */
function getStatePrompt(turnState: TurnState, actionContext: ActionContext): string {
	switch (turnState) {
		case 'idle':
			return 'Waiting for your turn...';
		case 'awaiting_action':
			return 'Place an agent or reveal your hand';
		case 'at_weather_bureau':
			return `Weather Bureau: Keep or discard "${actionContext.peekedHazard?.name || 'this hazard'}"?`;
		case 'at_ministry':
			return 'Ministry: Choose which card to keep';
		case 'at_launchpad':
			return 'Launchpad: Launch ships or finish';
		case 'awaiting_hazard':
			return `Hazard Check: ${actionContext.pendingHazard?.name || 'Resolve hazard'}`;
		default:
			return '';
	}
}

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

		const isBlocked = ['at_weather_bureau', 'at_ministry', 'awaiting_hazard'].includes(turnState);
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
