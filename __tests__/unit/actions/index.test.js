/**
 * Action Registry and Dispatcher Tests
 * Tests for the central action processing module
 */

// Mock the dependencies
jest.mock('../../../server/db', () => ({
  pool: { query: jest.fn(), connect: jest.fn(), on: jest.fn() }
}));

const { processAction, getActionTypes, isValidActionType, ACTION_HANDLERS } = require('../../../server/actions');
const { GameRuleError } = require('../../../server/errors');

// Minimal game state for testing
function createTestState() {
  return {
    playerOrder: ['player-1', 'player-2'],
    currentPlayerIndex: 0,
    phase: 'income_cleanup',
    turn: 1,
    round: 1,
    age: 1,
    players: {
      'player-1': {
        faction: 'germany',
        cash: 100,
        income: 10,
        officers: 2,
        engineers: 3,
        research: 0,
        loans: 0,
        gasCubes: { hydrogen: 5, helium: 0 },
        techCards: ['rigid_frame'],
        ships: [],
        routes: [],
        blueprint: {
          frameSlots: [{ id: 'rigid_frame' }],
          fabricSlots: [null],
          driveSlots: [null],
          componentSlots: [],
          gasSockets: [{ type: 'hydrogen', filled: false }]
        },
        hand: [{ id: 'card-1', symbol: 'wrench' }],
        deck: [],
        discardPile: [],
        hazardDeck: [],
        collectedIncome: false,
        hasTakenActionThisTurn: false
      },
      'player-2': {
        faction: 'britain',
        cash: 80,
        income: 8,
        officers: 1,
        engineers: 2,
        research: 0,
        loans: 0,
        gasCubes: { hydrogen: 3, helium: 0 },
        techCards: [],
        ships: [],
        routes: [],
        blueprint: {
          frameSlots: [null],
          fabricSlots: [null],
          driveSlots: [null],
          componentSlots: [],
          gasSockets: []
        },
        hand: [],
        deck: [],
        discardPile: [],
        hazardDeck: [],
        collectedIncome: false,
        hasTakenActionThisTurn: false
      }
    },
    gasMarket: { hydrogen: 10, helium: 8 },
    rdBoard: [],
    groundBoard: { placements: {} },
    log: []
  };
}

describe('Action Registry', () => {
  describe('getActionTypes', () => {
    it('should return all registered action types', () => {
      const types = getActionTypes();

      expect(types).toContain('END_TURN');
      expect(types).toContain('BUY_GAS');
      expect(types).toContain('BUILD_SHIP');
      expect(types).toContain('LAUNCH_SHIP');
      expect(types).toContain('PLACE_AGENT');
      expect(types).toContain('REVEAL');
      expect(types.length).toBeGreaterThan(20);
    });

    it('should include legacy aliases', () => {
      const types = getActionTypes();

      expect(types).toContain('ACQUIRE_TECHNOLOGY'); // Alias for ACQUIRE_TECH_CARD
      expect(types).toContain('INSTALL_UPGRADE'); // Alias for INSTALL_TECH_TILE
    });
  });

  describe('isValidActionType', () => {
    it('should return true for valid action types', () => {
      expect(isValidActionType('END_TURN')).toBe(true);
      expect(isValidActionType('BUY_GAS')).toBe(true);
      expect(isValidActionType('PLACE_AGENT')).toBe(true);
    });

    it('should return false for invalid action types', () => {
      expect(isValidActionType('INVALID_ACTION')).toBe(false);
      expect(isValidActionType('')).toBe(false);
      expect(isValidActionType(null)).toBe(false);
      expect(isValidActionType(undefined)).toBe(false);
    });
  });

  describe('ACTION_HANDLERS', () => {
    it('should have all handlers as functions', () => {
      Object.values(ACTION_HANDLERS).forEach(handler => {
        expect(typeof handler).toBe('function');
      });
    });
  });
});

describe('processAction', () => {
  let state;

  beforeEach(() => {
    state = createTestState();
  });

  describe('validation', () => {
    it('should throw for unknown action type', () => {
      expect(() => processAction(state, 'player-1', 'INVALID_ACTION', {}))
        .toThrow(GameRuleError);
      expect(() => processAction(state, 'player-1', 'INVALID_ACTION', {}))
        .toThrow('Unknown action type');
    });

    it('should throw if player not in game', () => {
      expect(() => processAction(state, 'nonexistent-player', 'END_TURN', {}))
        .toThrow(GameRuleError);
      expect(() => processAction(state, 'nonexistent-player', 'END_TURN', {}))
        .toThrow('Player not found');
    });
  });

  describe('state immutability', () => {
    it('should not mutate original state on success', () => {
      const originalCash = state.players['player-1'].cash;
      const originalIncome = state.players['player-1'].income;

      // Try TAKE_LOAN which modifies cash and income
      processAction(state, 'player-1', 'TAKE_LOAN', {});

      expect(state.players['player-1'].cash).toBe(originalCash);
      expect(state.players['player-1'].income).toBe(originalIncome);
    });

    it('should not mutate original state on error', () => {
      const originalLoans = state.players['player-1'].loans;
      state.players['player-1'].loans = 2; // Max loans

      try {
        processAction(state, 'player-1', 'TAKE_LOAN', {});
      } catch {
        // Expected to throw
      }

      expect(state.players['player-1'].loans).toBe(2);
    });
  });

  describe('COLLECT_INCOME', () => {
    it('should add income and crew during income phase', () => {
      state.phase = 'income';
      state.players['player-1'].officerIncome = 1;
      state.players['player-1'].engineerIncome = 2;

      const result = processAction(state, 'player-1', 'COLLECT_INCOME', {});

      expect(result.newState.players['player-1'].cash).toBe(110); // 100 + 10 income
      expect(result.newState.players['player-1'].officers).toBe(3); // 2 + 1
      expect(result.newState.players['player-1'].engineers).toBe(5); // 3 + 2
    });

    it('should reject collecting income outside income phase', () => {
      state.phase = 'worker_placement';

      expect(() => processAction(state, 'player-1', 'COLLECT_INCOME', {}))
        .toThrow(GameRuleError);
    });
  });

  describe('TAKE_LOAN', () => {
    it('should add cash and reduce income', () => {
      const result = processAction(state, 'player-1', 'TAKE_LOAN', {});

      expect(result.newState.players['player-1'].cash).toBe(130); // 100 + 30
      expect(result.newState.players['player-1'].income).toBe(7); // 10 - 3
      expect(result.newState.players['player-1'].loans).toBe(1);
    });

    it('should reject when max loans reached', () => {
      state.players['player-1'].loans = 2;

      expect(() => processAction(state, 'player-1', 'TAKE_LOAN', {}))
        .toThrow(GameRuleError);
    });
  });

  describe('BUY_GAS', () => {
    it('should require worker_placement phase', () => {
      // BUY_GAS can only be done during worker placement via agent placement
      state.phase = 'income_cleanup';

      expect(() => processAction(state, 'player-1', 'BUY_GAS', {
        gasType: 'hydrogen',
        quantity: 1
      })).toThrow(GameRuleError);
    });
  });

  describe('deprecated actions', () => {
    it('should throw for LOAD_GAS', () => {
      expect(() => processAction(state, 'player-1', 'LOAD_GAS', {}))
        .toThrow('deprecated');
    });

    it('should throw for UNLOAD_GAS', () => {
      expect(() => processAction(state, 'player-1', 'UNLOAD_GAS', {}))
        .toThrow('deprecated');
    });
  });
});

describe('Action Error Handling', () => {
  let state;

  beforeEach(() => {
    state = createTestState();
  });

  it('should propagate GameRuleError from handlers', () => {
    // BUY_GAS without enough cash
    state.players['player-1'].cash = 0;

    expect(() => processAction(state, 'player-1', 'BUY_GAS', {
      gasType: 'hydrogen',
      quantity: 1
    })).toThrow(GameRuleError);
  });

  it('should provide meaningful error messages', () => {
    state.players['player-1'].loans = 2;

    try {
      processAction(state, 'player-1', 'TAKE_LOAN', {});
      fail('Expected to throw');
    } catch (error) {
      expect(error.message).toContain('loan');
    }
  });
});
