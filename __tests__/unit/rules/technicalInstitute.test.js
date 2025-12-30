/**
 * Rules Compliance Tests - Technical Institute (UPGRADE_ENGINEER_INCOME)
 *
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 * This tests that:
 * 1. Engineer income upgrade happens atomically during agent placement
 * 2. Direct UPGRADE_ENGINEER_INCOME calls are rejected (must go through PLACE_AGENT)
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processPlaceAgent } = require('../../../server/actions/worker');
const { processUpgradeEngineerIncome } = require('../../../server/actions/crew');
const { TECHNICAL_INSTITUTE_COST } = require('../../../server/config/constants');

describe('Rules Compliance - Technical Institute (Section 5.1)', () => {

  describe('Atomic Execution: Engineer income upgrade during agent placement', () => {
    it('should upgrade engineer income immediately when placing agent at technical_institute', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1'; // Germany
      const playerState = state.players[playerId];

      playerState.cash = 20;
      const initialCash = playerState.cash;
      const initialEngineerIncome = playerState.engineerIncome || 1; // Defaults to 1
      playerState.agentsRemaining = 2;

      // Set up a card with wrench symbol for technical_institute
      playerState.hand = [{
        id: 'test-card',
        name: 'Test Card',
        symbol: 'wrench'
      }];

      state.workerPlacement = {
        currentPlacerIndex: 0,
        passedPlayers: [],
        ministryVisitors: []
      };
      state.playerOrder = [playerId];
      state.groundBoard = { placements: {} };

      // Place agent at technical_institute
      const result = processPlaceAgent(state, playerId, {
        locationId: 'technical_institute',
        cardIndex: 0,
        levels: 1
      });

      // Engineer income should increase by 1
      expect(result.newState.players[playerId].engineerIncome).toBe(initialEngineerIncome + 1);
      // Cash should decrease by TECHNICAL_INSTITUTE_COST
      expect(result.newState.players[playerId].cash).toBe(initialCash - TECHNICAL_INSTITUTE_COST);
    });

    it('should fail placement if player cannot afford upgrade', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];

      playerState.cash = 1; // Not enough
      const initialEngineerIncome = playerState.engineerIncome || 1;
      playerState.agentsRemaining = 2;

      playerState.hand = [{
        id: 'test-card',
        name: 'Test Card',
        symbol: 'wrench'
      }];

      state.workerPlacement = {
        currentPlacerIndex: 0,
        passedPlayers: [],
        ministryVisitors: []
      };
      state.playerOrder = [playerId];
      state.groundBoard = { placements: {} };

      const result = processPlaceAgent(state, playerId, {
        locationId: 'technical_institute',
        cardIndex: 0,
        levels: 1
      });

      // Agent placement happens but action fails
      expect(result.newState.groundBoard.placements.technical_institute).toBeDefined();
      // Engineer income should NOT have increased
      expect(result.newState.players[playerId].engineerIncome).toBe(initialEngineerIncome);
      // Log should contain error
      const errorLog = result.newState.log.find(l => l.type === 'warning');
      expect(errorLog).toBeDefined();
    });
  });

  describe('Direct API Call Rejection', () => {
    it('should reject direct UPGRADE_ENGINEER_INCOME calls during reveal phase', () => {
      const state = createTestGameState();
      state.phase = 'reveal';

      const playerId = '1';
      state.players[playerId].cash = 20;

      expect(() => {
        processUpgradeEngineerIncome(state, playerId, {});
      }).toThrow(/Actions execute immediately when placing an agent|Section 5\.1/);
    });

    it('should reject direct UPGRADE_ENGINEER_INCOME calls without agent at technical_institute', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      state.players[playerId].cash = 20;
      state.groundBoard = { placements: {} }; // No agents placed

      expect(() => {
        processUpgradeEngineerIncome(state, playerId, {});
      }).toThrow(/must place an agent at Technical Institute|PLACE_AGENT/);
    });

    it('should reject direct UPGRADE_ENGINEER_INCOME calls when another player has agent', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      state.players[playerId].cash = 20;

      // Another player has agent at technical_institute
      state.groundBoard = {
        placements: {
          technical_institute: { playerId: '2', cardUsed: 'Some Card' }
        }
      };

      expect(() => {
        processUpgradeEngineerIncome(state, playerId, {});
      }).toThrow(/must place an agent at Technical Institute|PLACE_AGENT/);
    });

    it('should allow internal calls with _internal flag', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];
      playerState.cash = 20;
      const initialEngineerIncome = playerState.engineerIncome || 1;

      // Internal call bypasses validation (used by executeLocationAction)
      const result = processUpgradeEngineerIncome(state, playerId, {
        _internal: true
      });

      expect(result.newState.players[playerId].engineerIncome).toBe(initialEngineerIncome + 1);
    });
  });
});
