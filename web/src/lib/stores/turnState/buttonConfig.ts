/**
 * Button Configuration
 *
 * Maps turn states and actions to button configurations for the UI.
 */

import type { TurnState } from '$lib/types/game';
import type { ActionButton, ActionContext } from './types';

/**
 * Map actions to button configurations
 */
export function mapActionsToButtons(
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
					// Simplified hazard system: unified formula calculates engineersNeeded
					const engineersNeeded = actionContext.pendingHazard.engineersNeeded || 0;
					const isFireHazard = actionContext.pendingHazard.category === 'fire';
					const isAutoPass = actionContext.pendingHazard.autoPass ||
						actionContext.pendingHazard.heliumFireImmunity ||
						actionContext.pendingHazard.conductiveCoveringImmunity ||
						actionContext.pendingHazard.fireResistantFabricAvailable;

					if (isAutoPass) {
						// Auto-pass hazards just need confirmation
						buttons.push({
							action: 'RESPOND_TO_HAZARD',
							label: 'Continue',
							description: 'Hazard auto-passed',
							icon: 'check',
							primary: true,
							requiresSelection: false,
							actionData: { spendEngineers: false },
							variant: 'success'
						});
					} else if (isFireHazard) {
						// Fire hazards with hydrogen: fail = destroyed (no engineer option)
						buttons.push({
							action: 'RESPOND_TO_HAZARD',
							label: 'Accept Fate',
							description: 'Hydrogen ships cannot overcome fire hazards',
							icon: 'hazard',
							primary: true,
							requiresSelection: false,
							actionData: { spendEngineers: false },
							variant: 'danger'
						});
					} else if (engineersNeeded === 0) {
						// Ship reliability overcomes hazard
						buttons.push({
							action: 'RESPOND_TO_HAZARD',
							label: 'Continue',
							description: 'Ship reliability overcomes hazard',
							icon: 'check',
							primary: true,
							requiresSelection: false,
							actionData: { spendEngineers: false },
							variant: 'success'
						});
					} else {
						// Standard hazard: spend engineers or abort
						buttons.push({
							action: 'RESPOND_TO_HAZARD',
							label: 'Abort Launch',
							description: 'Return ship to hangar (gas is lost)',
							icon: 'back',
							primary: false,
							requiresSelection: false,
							actionData: { spendEngineers: false }
						});

						buttons.push({
							action: 'RESPOND_TO_HAZARD',
							label: `Spend ${engineersNeeded} Engineer(s)`,
							description: 'Overcome hazard and complete launch',
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
export function getStatePrompt(turnState: TurnState, actionContext: ActionContext): string {
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
