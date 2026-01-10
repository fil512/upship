/**
 * Turn State Helpers Tests
 */

import { describe, it, expect } from 'vitest';
import { isPlayersTurn, deriveTurnState, buildActionContext } from './helpers';
import type { GameState, PlayerState, HazardCard, Card, Ship } from '$lib/types/game';

// Type assertion helper for partial mocks
function mockHazard(partial: { id: string; name: string; difficulty?: number }): HazardCard {
	return { type: 'weather', category: 'hazard', difficulty: 2, flak: 0, ...partial } as HazardCard;
}

function mockCard(partial: { id: string; name: string }): Card {
	return { symbol: 'wrench', ...partial } as Card;
}

function mockShip(partial: Partial<Ship> & { id: string; status: string }): Ship {
	return { lift: 1, weight: 1, speed: 1, range: 1, reliability: 0, ceiling: 0, gasRequired: 1, ...partial } as Ship;
}

// Helper to create a minimal game state
function createMockGameState(overrides: Partial<GameState> = {}): GameState {
	return {
		playerOrder: ['player1', 'player2'],
		currentPlayerIndex: 0,
		phase: 'worker_placement',
		turn: 1,
		round: 1,
		age: 1,
		players: {
			player1: createMockPlayerState(),
			player2: createMockPlayerState()
		},
		gasMarket: { hydrogen: 10, helium: 5 },
		groundBoard: { placements: {} },
		log: [],
		...overrides
	} as GameState;
}

function createMockPlayerState(overrides: Partial<PlayerState> = {}): PlayerState {
	return {
		faction: 'germany',
		cash: 10,
		income: 3,
		officers: 2,
		engineers: 1,
		gasCubes: { hydrogen: 0, helium: 0 },
		technologies: [],
		ships: [],
		routes: [],
		blueprint: {
			frameSlots: [null, null],
			fabricSlots: [null, null],
			driveSlots: [null],
			componentSlots: [null, null],
			gasSockets: [null]
		},
		hand: [],
		deck: [],
		discardPile: [],
		hasPassed: false,
		...overrides
	} as PlayerState;
}

describe('isPlayersTurn', () => {
	it('returns true when player is current in worker_placement phase', () => {
		const state = createMockGameState({
			phase: 'worker_placement',
			workerPlacement: {
				placementOrder: ['player1', 'player2'],
				currentPlacerIndex: 0,
				passedPlayers: [],
				ministryVisitors: []
			}
		});
		expect(isPlayersTurn(state, 'player1')).toBe(true);
		expect(isPlayersTurn(state, 'player2')).toBe(false);
	});

	it('returns true for all players in reveal phase', () => {
		const state = createMockGameState({ phase: 'reveal' });
		expect(isPlayersTurn(state, 'player1')).toBe(true);
		expect(isPlayersTurn(state, 'player2')).toBe(true);
	});

	it('returns true for current player in income_cleanup phase', () => {
		const state = createMockGameState({
			phase: 'income_cleanup',
			currentPlayerIndex: 1
		});
		expect(isPlayersTurn(state, 'player1')).toBe(false);
		expect(isPlayersTurn(state, 'player2')).toBe(true);
	});
});

describe('deriveTurnState', () => {
	it('returns idle for null state', () => {
		expect(deriveTurnState(null, 'player1')).toBe('idle');
	});

	it('returns idle for null playerId', () => {
		const state = createMockGameState();
		expect(deriveTurnState(state, null)).toBe('idle');
	});

	it('returns idle when player has passed', () => {
		const state = createMockGameState({
			players: {
				player1: createMockPlayerState({ hasPassed: true }),
				player2: createMockPlayerState()
			}
		});
		expect(deriveTurnState(state, 'player1')).toBe('idle');
	});

	it('returns awaiting_action when it is players turn', () => {
		const state = createMockGameState({
			workerPlacement: {
				placementOrder: ['player1', 'player2'],
				currentPlacerIndex: 0,
				passedPlayers: [],
				ministryVisitors: []
			}
		});
		expect(deriveTurnState(state, 'player1')).toBe('awaiting_action');
	});

	it('returns at_weather_bureau when player has peekedHazard', () => {
		const state = createMockGameState({
			players: {
				player1: createMockPlayerState({
					peekedHazard: mockHazard({ id: 'hazard1', name: 'Storm', difficulty: 2 })
				}),
				player2: createMockPlayerState()
			}
		});
		expect(deriveTurnState(state, 'player1')).toBe('at_weather_bureau');
	});

	it('returns at_ministry when player has drawnMinistryCards', () => {
		const state = createMockGameState({
			players: {
				player1: createMockPlayerState({
					drawnMinistryCards: [
						mockCard({ id: 'card1', name: 'Card 1' }),
						mockCard({ id: 'card2', name: 'Card 2' })
					]
				}),
				player2: createMockPlayerState()
			}
		});
		expect(deriveTurnState(state, 'player1')).toBe('at_ministry');
	});

	it('returns awaiting_hazard when ship is awaiting hazard check', () => {
		const state = createMockGameState({
			players: {
				player1: createMockPlayerState({
					ships: [
						mockShip({
							id: 'ship1',
							status: 'awaiting_hazard',
							pendingHazard: mockHazard({ id: 'hazard1', name: 'Storm' })
						})
					]
				}),
				player2: createMockPlayerState()
			}
		});
		expect(deriveTurnState(state, 'player1')).toBe('awaiting_hazard');
	});
});

describe('buildActionContext', () => {
	it('returns empty object for null state', () => {
		expect(buildActionContext(null, 'player1', 'idle')).toEqual({});
	});

	it('includes peekedHazard for at_weather_bureau state', () => {
		const hazard = mockHazard({ id: 'hazard1', name: 'Storm', difficulty: 2 });
		const state = createMockGameState({
			players: {
				player1: createMockPlayerState({ peekedHazard: hazard }),
				player2: createMockPlayerState()
			}
		});
		const context = buildActionContext(state, 'player1', 'at_weather_bureau');
		expect(context.peekedHazard).toEqual(hazard);
	});

	it('includes drawnMinistryCards for at_ministry state', () => {
		const cards = [
			mockCard({ id: 'card1', name: 'Card 1' }),
			mockCard({ id: 'card2', name: 'Card 2' })
		];
		const state = createMockGameState({
			players: {
				player1: createMockPlayerState({ drawnMinistryCards: cards }),
				player2: createMockPlayerState()
			}
		});
		const context = buildActionContext(state, 'player1', 'at_ministry');
		expect(context.drawnMinistryCards).toEqual(cards);
	});

	it('includes launchableShips for at_launchpad state', () => {
		const ships = [
			mockShip({ id: 'ship1', status: 'hangar' }),
			mockShip({ id: 'ship2', status: 'on_route' })
		];
		const state = createMockGameState({
			players: {
				player1: createMockPlayerState({ ships }),
				player2: createMockPlayerState()
			}
		});
		const context = buildActionContext(state, 'player1', 'at_launchpad');
		expect(context.launchableShips).toHaveLength(1);
		expect(context.launchableShips?.[0].id).toBe('ship1');
	});
});
