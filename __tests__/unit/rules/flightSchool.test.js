/**
 * Rules Compliance Tests - Flight School (UPGRADE_OFFICER_INCOME)
 *
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 * This tests that:
 * 1. Officer income upgrade happens atomically during agent placement
 * 2. Direct UPGRADE_OFFICER_INCOME calls are rejected (must go through PLACE_AGENT)
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processPlaceAgent } = require('../../../server/actions/worker');
const { processUpgradeOfficerIncome } = require('../../../server/actions/crew');
const { FLIGHT_SCHOOL_COST } = require('../../../server/config/constants');

describe('Rules Compliance - Flight School (Section 5.1)', () => {

  describe('Atomic Execution: Officer income upgrade during agent placement', () => {
    it('should upgrade officer income immediately when placing agent at flight_school', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1'; // Germany
      const playerState = state.players[playerId];

      playerState.cash = 20;
      const initialCash = playerState.cash;
      const initialOfficerIncome = playerState.officerIncome || 0;
      playerState.agentsRemaining = 2;

      // Set up a card with coin symbol for flight_school
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

      // Place agent at flight_school
      const result = processPlaceAgent(state, playerId, {
        locationId: 'flight_school',
        cardIndex: 0,
        levels: 1
      });

      // Officer income should increase by 1
      expect(result.newState.players[playerId].officerIncome).toBe(initialOfficerIncome + 1);
      // Cash should decrease by FLIGHT_SCHOOL_COST
      expect(result.newState.players[playerId].cash).toBe(initialCash - FLIGHT_SCHOOL_COST);
    });

    it('should fail placement if player cannot afford upgrade', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];

      playerState.cash = 1; // Not enough (FLIGHT_SCHOOL_COST is typically > 1)
      const initialOfficerIncome = playerState.officerIncome || 0;
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
        locationId: 'flight_school',
        cardIndex: 0,
        levels: 1
      });

      // Agent placement happens but action fails
      expect(result.newState.groundBoard.placements.flight_school).toBeDefined();
      // Officer income should NOT have increased
      expect(result.newState.players[playerId].officerIncome).toBe(initialOfficerIncome);
      // Log should contain error
      const errorLog = result.newState.log.find(l => l.type === 'warning');
      expect(errorLog).toBeDefined();
    });

    it('should grant 3rd agent when officer income reaches +3 per Section 6.6', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];

      playerState.cash = 20;
      playerState.officerIncome = 2; // One more upgrade will reach +3
      playerState.agents = 2; // Currently have 2 agents
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
        locationId: 'flight_school',
        cardIndex: 0,
        levels: 1
      });

      // Officer income should be 3
      expect(result.newState.players[playerId].officerIncome).toBe(3);
      // Should now have 3 agents
      expect(result.newState.players[playerId].agents).toBe(3);
      // Log should contain milestone about 3rd agent
      const milestoneLog = result.newState.log.find(l => l.type === 'milestone');
      expect(milestoneLog).toBeDefined();
    });
  });

  describe('Direct API Call Rejection', () => {
    it('should reject direct UPGRADE_OFFICER_INCOME calls during reveal phase', () => {
      const state = createTestGameState();
      state.phase = 'reveal';

      const playerId = '1';
      state.players[playerId].cash = 20;

      expect(() => {
        processUpgradeOfficerIncome(state, playerId, {});
      }).toThrow(/Actions execute immediately when placing an agent|Section 5\.1/);
    });

    it('should reject direct UPGRADE_OFFICER_INCOME calls without agent at flight_school', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      state.players[playerId].cash = 20;
      state.groundBoard = { placements: {} }; // No agents placed

      expect(() => {
        processUpgradeOfficerIncome(state, playerId, {});
      }).toThrow(/must place an agent at Flight School|PLACE_AGENT/);
    });

    it('should reject direct UPGRADE_OFFICER_INCOME calls when another player has agent', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      state.players[playerId].cash = 20;

      // Another player has agent at flight_school
      state.groundBoard = {
        placements: {
          flight_school: { playerId: '2', cardUsed: 'Some Card' }
        }
      };

      expect(() => {
        processUpgradeOfficerIncome(state, playerId, {});
      }).toThrow(/must place an agent at Flight School|PLACE_AGENT/);
    });

    it('should allow internal calls with _internal flag', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];
      playerState.cash = 20;
      const initialOfficerIncome = playerState.officerIncome || 0;

      // Internal call bypasses validation (used by executeLocationAction)
      const result = processUpgradeOfficerIncome(state, playerId, {
        _internal: true
      });

      expect(result.newState.players[playerId].officerIncome).toBe(initialOfficerIncome + 1);
    });
  });
});
