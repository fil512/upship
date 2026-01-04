/**
 * Turn State Types
 */

import type { HazardCard, Card, Ship, TurnState } from '$lib/types/game';

/** Button configuration for UI */
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

/** Context data for current state */
export interface ActionContext {
	peekedHazard?: HazardCard;
	drawnMinistryCards?: Card[];
	shipAwaitingHazard?: Ship;
	pendingHazard?: HazardCard;
	pendingRouteId?: string;
	launchableShips?: Ship[];
}

/** Complete UI state */
export interface TurnUIState {
	turnState: TurnState;
	isMyTurn: boolean;
	isBlocked: boolean;
	prompt: string;
	buttons: ActionButton[];
	actionContext: ActionContext;
}
