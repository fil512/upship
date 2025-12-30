/**
 * Rules Compliance Tests - Gas Depot
 * Tests for correct implementation of Section 6.10 (Gas Depot location action)
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processBuyGas } = require('../../../server/actions/gas');
const { processPlaceAgent } = require('../../../server/actions/worker');

describe('Rules Compliance - Gas Depot', () => {

  describe('GAP-034: Gas purchase core logic', () => {
    // These tests use _internal: true to test core buy logic
    // In production, gas buying goes through PLACE_AGENT at gas_depot

    it('should allow buying hydrogen at £1 per cube', () => {
      const state = createTestGameState();
      state.players['1'].cash = 10;
      state.players['1'].gasCubes = { hydrogen: 0, helium: 0 };
      state.gasMarket = { hydrogen: 1, helium: 5 };

      const result = processBuyGas(state, '1', { gasType: 'hydrogen', amount: 3, _internal: true });

      expect(result.newState.players['1'].gasCubes.hydrogen).toBe(3);
      expect(result.newState.players['1'].cash).toBe(7); // 10 - 3
    });

    it('should allow buying helium with Helium Handling technology', () => {
      const state = createTestGameState();
      state.players['1'].cash = 20;
      state.players['1'].gasCubes = { hydrogen: 0, helium: 0 };
      state.players['1'].technologies = ['helium_handling'];
      state.gasMarket = { hydrogen: 1, helium: 5 };

      const result = processBuyGas(state, '1', { gasType: 'helium', amount: 2, _internal: true });

      expect(result.newState.players['1'].gasCubes.helium).toBe(2);
      expect(result.newState.players['1'].cash).toBe(10); // 20 - (5*2)
    });

    it('should reject helium purchase without Helium Handling', () => {
      const state = createTestGameState();
      state.players['1'].cash = 20;
      state.players['1'].technologies = [];
      state.gasMarket = { hydrogen: 1, helium: 5 };

      expect(() => {
        processBuyGas(state, '1', { gasType: 'helium', amount: 1, _internal: true });
      }).toThrow(/helium handling/i);
    });
  });

  describe('Gas Depot immediate action execution (Section 5.1)', () => {
    // Per rules Section 5.1: "3. Execute the location's action"
    // Actions should execute IMMEDIATELY when placing an agent, not during reveal

    it('should buy gas immediately when placing agent at gas_depot', () => {
      const state = createTestGameState();
      const playerId = '1';
      state.players[playerId].cash = 20;
      state.players[playerId].gasCubes = { hydrogen: 0, helium: 0 };
      state.players[playerId].agentsRemaining = 2;
      state.players[playerId].hand = [
        { id: 'card1', name: 'Mechanic', symbol: 'wrench', effect: '+1 swap' }
      ];
      state.phase = 'worker_placement';
      state.workerPlacement = {
        placementOrder: ['1', '2', '3', '4'],
        currentPlacerIndex: 0,
        passedPlayers: []
      };
      state.gasMarket = { hydrogen: 1, helium: 5 };

      // Place agent at gas_depot - gas should be bought immediately
      const result = processPlaceAgent(state, playerId, {
        locationId: 'gas_depot',
        cardIndex: 0,
        gasType: 'hydrogen',
        gasAmount: 3
      });

      // Gas should be bought immediately during placement
      expect(result.newState.players[playerId].gasCubes.hydrogen).toBe(3);
      expect(result.newState.players[playerId].cash).toBe(17); // 20 - 3
    });

    it('should buy helium when placing agent at gas_depot with Helium Handling', () => {
      const state = createTestGameState();
      const playerId = '1';
      state.players[playerId].cash = 20;
      state.players[playerId].gasCubes = { hydrogen: 0, helium: 0 };
      state.players[playerId].technologies = ['helium_handling'];
      state.players[playerId].agentsRemaining = 2;
      state.players[playerId].hand = [
        { id: 'card1', name: 'Mechanic', symbol: 'wrench', effect: '+1 swap' }
      ];
      state.phase = 'worker_placement';
      state.workerPlacement = {
        placementOrder: ['1', '2', '3', '4'],
        currentPlacerIndex: 0,
        passedPlayers: []
      };
      state.gasMarket = { hydrogen: 1, helium: 5 };

      // Place agent at gas_depot with helium
      const result = processPlaceAgent(state, playerId, {
        locationId: 'gas_depot',
        cardIndex: 0,
        gasType: 'helium',
        gasAmount: 2
      });

      expect(result.newState.players[playerId].gasCubes.helium).toBe(2);
      expect(result.newState.players[playerId].cash).toBe(10); // 20 - (5*2)
    });

    it('should reject direct BUY_GAS action during reveal phase', () => {
      const state = createTestGameState();
      state.phase = 'reveal';
      state.players['1'].cash = 20;
      state.players['1'].gasCubes = { hydrogen: 0, helium: 0 };
      state.gasMarket = { hydrogen: 1, helium: 5 };
      // Player has a placement at gas_depot from earlier
      state.groundBoard.placements['gas_depot'] = { playerId: '1' };

      // Direct BUY_GAS should be rejected during reveal
      expect(() => {
        processBuyGas(state, '1', { gasType: 'hydrogen', amount: 3 });
      }).toThrow(/worker_placement|agent|not allowed|phase/i);
    });

    it('should reject direct BUY_GAS action without agent at gas_depot', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.players['1'].cash = 20;
      state.players['1'].gasCubes = { hydrogen: 0, helium: 0 };
      state.gasMarket = { hydrogen: 1, helium: 5 };
      // No agent at gas_depot
      state.groundBoard.placements = {};

      // Direct BUY_GAS without agent should be rejected
      expect(() => {
        processBuyGas(state, '1', { gasType: 'hydrogen', amount: 3 });
      }).toThrow(/gas_depot|agent|not allowed/i);
    });

    it('should reject BUY_GAS when another player has agent at gas_depot', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.players['1'].cash = 20;
      state.players['1'].gasCubes = { hydrogen: 0, helium: 0 };
      state.gasMarket = { hydrogen: 1, helium: 5 };
      // Player 2 has agent at gas_depot, not player 1
      state.groundBoard.placements['gas_depot'] = { playerId: '2' };

      // Player 1 cannot buy gas when they don't have the agent
      expect(() => {
        processBuyGas(state, '1', { gasType: 'hydrogen', amount: 3 });
      }).toThrow(/gas_depot|agent|not allowed/i);
    });
  });
});
