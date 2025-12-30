/**
 * Rules Compliance Tests - Insurance Bureau (BUY_INSURANCE)
 *
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 * This tests that:
 * 1. Insurance purchase happens atomically during agent placement
 * 2. Direct BUY_INSURANCE calls are rejected (must go through PLACE_AGENT)
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processPlaceAgent } = require('../../../server/actions/worker');
const { processBuyInsurance } = require('../../../server/actions/economy');

describe('Rules Compliance - Insurance Bureau (Section 5.1)', () => {

  describe('Atomic Execution: Insurance purchase during agent placement', () => {
    it('should buy insurance immediately when placing agent at insurance_bureau', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1'; // Germany
      const playerState = state.players[playerId];

      playerState.income = 5;
      const initialIncome = playerState.income;
      const initialInsurance = playerState.insurance || 0;
      playerState.agentsRemaining = 2;

      // Set up a card with coin symbol for insurance_bureau
      playerState.hand = [{
        id: 'test-card',
        name: 'Test Card',
        symbol: 'coin'
      }];

      state.workerPlacement = {
        currentPlacerIndex: 0,
        passedPlayers: [],
        ministryVisitors: []
      };
      state.playerOrder = [playerId];
      state.groundBoard = { placements: {} };

      // Place agent at insurance_bureau
      const result = processPlaceAgent(state, playerId, {
        locationId: 'insurance_bureau',
        cardIndex: 0,
        policyCount: 1
      });

      // Insurance should increase by 1
      expect(result.newState.players[playerId].insurance).toBe(initialInsurance + 1);
      // Income should decrease by 1 (permanent penalty)
      expect(result.newState.players[playerId].income).toBe(initialIncome - 1);
    });

    it('should fail if player already has maximum insurance policies', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];

      playerState.insurance = 3; // At maximum (MAX_INSURANCE_POLICIES = 3)
      playerState.income = 5;
      playerState.agentsRemaining = 2;

      playerState.hand = [{
        id: 'test-card',
        name: 'Test Card',
        symbol: 'coin'
      }];

      state.workerPlacement = {
        currentPlacerIndex: 0,
        passedPlayers: [],
        ministryVisitors: []
      };
      state.playerOrder = [playerId];
      state.groundBoard = { placements: {} };

      const result = processPlaceAgent(state, playerId, {
        locationId: 'insurance_bureau',
        cardIndex: 0,
        policyCount: 1
      });

      // Agent placement happens but action fails
      expect(result.newState.groundBoard.placements.insurance_bureau).toBeDefined();
      // Insurance should NOT have changed
      expect(result.newState.players[playerId].insurance).toBe(3);
      // Log should contain error
      const errorLog = result.newState.log.find(l => l.type === 'warning');
      expect(errorLog).toBeDefined();
    });
  });

  describe('Direct API Call Rejection', () => {
    it('should reject direct BUY_INSURANCE calls during reveal phase', () => {
      const state = createTestGameState();
      state.phase = 'reveal';

      const playerId = '1';

      expect(() => {
        processBuyInsurance(state, playerId, {});
      }).toThrow(/Actions execute immediately when placing an agent|Section 5\.1/);
    });

    it('should reject direct BUY_INSURANCE calls without agent at insurance_bureau', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      state.groundBoard = { placements: {} }; // No agents placed

      expect(() => {
        processBuyInsurance(state, playerId, {});
      }).toThrow(/must place an agent at Insurance Bureau|PLACE_AGENT/);
    });

    it('should reject direct BUY_INSURANCE calls when another player has agent', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';

      // Another player has agent at insurance_bureau
      state.groundBoard = {
        placements: {
          insurance_bureau: { playerId: '2', cardUsed: 'Some Card' }
        }
      };

      expect(() => {
        processBuyInsurance(state, playerId, {});
      }).toThrow(/must place an agent at Insurance Bureau|PLACE_AGENT/);
    });

    it('should allow internal calls with _internal flag', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];
      playerState.income = 5;
      const initialInsurance = playerState.insurance || 0;

      // Internal call bypasses validation (used by executeLocationAction)
      const result = processBuyInsurance(state, playerId, {
        _internal: true
      });

      expect(result.newState.players[playerId].insurance).toBe(initialInsurance + 1);
    });
  });
});
