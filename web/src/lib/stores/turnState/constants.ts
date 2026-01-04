/**
 * Turn State Constants
 */

import type { TurnState } from '$lib/types/game';

/**
 * Allowed events for each turn state
 */
export const ALLOWED_EVENTS: Record<TurnState, string[]> = {
	idle: [],
	awaiting_action: ['PLACE_AGENT', 'REVEAL'],
	at_weather_bureau: ['KEEP_HAZARD', 'DISCARD_HAZARD'],
	at_ministry: ['DISCARD_MINISTRY_CARD'],
	at_launchpad: ['LAUNCH_SHIP', 'NO_MORE_LAUNCHES'],
	awaiting_hazard: ['RESPOND_TO_HAZARD']
};

/** States that block normal gameplay and require immediate action */
export const BLOCKING_STATES: TurnState[] = ['at_weather_bureau', 'at_ministry', 'awaiting_hazard'];
