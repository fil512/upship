/**
 * Button Config Tests
 */

import { describe, it, expect } from 'vitest';
import { mapActionsToButtons, getStatePrompt } from './buttonConfig';
import type { ActionContext } from './types';
import type { HazardCard, Card, Ship } from '$lib/types/game';

// Type assertion helper for partial mocks
function mockHazard(partial: { id: string; name: string; difficulty?: number; engineerCost?: number }): HazardCard {
	return { type: 'weather', category: 'minor', difficulty: 2, flak: 0, ...partial } as HazardCard;
}

function mockCard(partial: { id: string; name: string }): Card {
	return { symbol: 'wrench', ...partial } as Card;
}

function mockShip(partial: Partial<Ship> & { id: string; status: string }): Ship {
	return { lift: 1, weight: 1, speed: 1, range: 1, reliability: 0, ceiling: 0, gasRequired: 1, ...partial } as Ship;
}

describe('mapActionsToButtons', () => {
	it('returns empty array for empty actions', () => {
		expect(mapActionsToButtons([], {})).toEqual([]);
	});

	it('creates PLACE_AGENT button', () => {
		const buttons = mapActionsToButtons(['PLACE_AGENT'], {});
		expect(buttons).toHaveLength(1);
		expect(buttons[0]).toMatchObject({
			action: 'PLACE_AGENT',
			label: 'Place Agent',
			primary: true,
			requiresSelection: true,
			selectionType: 'location_and_card'
		});
	});

	it('creates REVEAL button', () => {
		const buttons = mapActionsToButtons(['REVEAL'], {});
		expect(buttons).toHaveLength(1);
		expect(buttons[0]).toMatchObject({
			action: 'REVEAL',
			label: 'Reveal & Pass',
			primary: false,
			requiresSelection: false
		});
	});

	it('creates hazard buttons with context', () => {
		const context: ActionContext = {
			peekedHazard: mockHazard({ id: 'h1', name: 'Thunderstorm', difficulty: 3 })
		};
		const buttons = mapActionsToButtons(['KEEP_HAZARD', 'DISCARD_HAZARD'], context);
		expect(buttons).toHaveLength(2);
		expect(buttons[0].label).toBe('Keep Hazard');
		expect(buttons[0].description).toContain('Thunderstorm');
		expect(buttons[1].label).toBe('Discard Hazard');
	});

	it('creates ministry card buttons with context', () => {
		const context: ActionContext = {
			drawnMinistryCards: [
				mockCard({ id: 'c1', name: 'Subsidy' }),
				mockCard({ id: 'c2', name: 'Influence' })
			]
		};
		const buttons = mapActionsToButtons(['DISCARD_MINISTRY_CARD'], context);
		expect(buttons).toHaveLength(2);
		expect(buttons[0].label).toContain('Keep "Influence"');
		expect(buttons[1].label).toContain('Keep "Subsidy"');
	});

	it('creates LAUNCH_SHIP button with disabled state when no ships', () => {
		const context: ActionContext = { launchableShips: [] };
		const buttons = mapActionsToButtons(['LAUNCH_SHIP'], context);
		expect(buttons[0].disabled).toBe(true);
		expect(buttons[0].disabledReason).toBe('No ships available to launch');
	});

	it('creates enabled LAUNCH_SHIP button when ships available', () => {
		const context: ActionContext = {
			launchableShips: [mockShip({ id: 'ship1', status: 'hangar' })]
		};
		const buttons = mapActionsToButtons(['LAUNCH_SHIP'], context);
		expect(buttons[0].disabled).toBe(false);
	});

	it('creates RESPOND_TO_HAZARD buttons with context', () => {
		const context: ActionContext = {
			pendingHazard: mockHazard({ id: 'h1', name: 'Engine Fire', engineerCost: 2 })
		};
		const buttons = mapActionsToButtons(['RESPOND_TO_HAZARD'], context);
		expect(buttons).toHaveLength(2);
		expect(buttons[0].label).toBe('Accept Risk');
		expect(buttons[1].label).toBe('Spend 2 Engineer(s)');
	});
});

describe('getStatePrompt', () => {
	it('returns correct prompt for idle state', () => {
		expect(getStatePrompt('idle', {})).toBe('Waiting for your turn...');
	});

	it('returns correct prompt for awaiting_action state', () => {
		expect(getStatePrompt('awaiting_action', {})).toBe('Place an agent or reveal your hand');
	});

	it('returns correct prompt for at_weather_bureau with hazard name', () => {
		const context: ActionContext = {
			peekedHazard: mockHazard({ id: 'h1', name: 'Fog Bank', difficulty: 1 })
		};
		expect(getStatePrompt('at_weather_bureau', context)).toContain('Fog Bank');
	});

	it('returns correct prompt for at_ministry state', () => {
		expect(getStatePrompt('at_ministry', {})).toBe('Ministry: Choose which card to keep');
	});

	it('returns correct prompt for at_launchpad state', () => {
		expect(getStatePrompt('at_launchpad', {})).toBe('Launchpad: Launch ships or finish');
	});

	it('returns correct prompt for awaiting_hazard with hazard name', () => {
		const context: ActionContext = {
			pendingHazard: mockHazard({ id: 'h1', name: 'Lightning Strike' })
		};
		expect(getStatePrompt('awaiting_hazard', context)).toContain('Lightning Strike');
	});
});
