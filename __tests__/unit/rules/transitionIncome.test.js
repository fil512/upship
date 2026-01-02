/**
 * Rules Compliance Tests - Age Transition Income
 * Tests for correct implementation of Section 12.1 step 3 (Income Calculation)
 * GAP-054: Age transition income should use technology income values
 */

const { createTestGameState } = require('../../fixtures/testData');
const { calculateTransitionIncome, performAgeTransition } = require('../../../server/actions/helpers/ageTransition');

describe('Rules Compliance - Age Transition Income', () => {

  describe('GAP-054: Transition income from technologies', () => {
    it('should calculate new income from technology income values per Section 12.1', () => {
      const state = createTestGameState();
      state.age = 1;

      // Player has technologies with income values from TECHNOLOGY_BAG in constants.js:
      // daimler_engine: income: 1
      // improved_propeller: income: 1
      // dual_engine_mount: income: 1
      // Total tech income: 3
      state.players['1'].techCards = ['daimler_engine', 'improved_propeller', 'dual_engine_mount'];
      state.players['1'].income = 8; // Current income from routes

      // Player loses 2 routes when map changes
      state.map.routes = [
        { id: 'route_1', income: 2, claimed: '1' },
        { id: 'route_2', income: 3, claimed: '1' }
      ];

      // Calculate transition income
      calculateTransitionIncome(state);

      // Per Section 12.1 step 3:
      // "New Income = (income from Technology tiles) - (1 per route lost)"
      // = 3 (from techs) - 2 (routes lost) = 1
      // Minimum 0
      expect(state.players['1'].income).toBe(1);
    });

    it('should sum income values from all owned technologies', () => {
      const state = createTestGameState();
      state.age = 1;

      // Mix of Age I and Age II technologies with various income values:
      // wooden_framework (Age I): income: 1
      // wire_bracing (Age I): income: 1
      // duralumin_framework (Age II): income: 2
      // Total: 4
      state.players['1'].techCards = ['wooden_framework', 'wire_bracing', 'duralumin_framework'];
      state.players['1'].income = 10;

      // No routes lost
      state.map.routes = [];

      calculateTransitionIncome(state);

      // New income = 4 (from techs) - 0 (routes lost) = 4
      expect(state.players['1'].income).toBe(4);
    });

    it('should apply route loss penalty of 1 per route', () => {
      const state = createTestGameState();
      state.age = 1;

      // Technologies totaling 5 income:
      // duralumin_framework: income: 2
      // maybach_engine: income: 2
      // wire_bracing: income: 1
      state.players['1'].techCards = ['duralumin_framework', 'maybach_engine', 'wire_bracing'];
      state.players['1'].income = 12;

      // Player loses 3 routes
      state.map.routes = [
        { id: 'r1', claimed: '1' },
        { id: 'r2', claimed: '1' },
        { id: 'r3', claimed: '1' }
      ];

      calculateTransitionIncome(state);

      // New income = 5 (from techs) - 3 (routes lost) = 2
      expect(state.players['1'].income).toBe(2);
    });

    it('should not reduce income below 0', () => {
      const state = createTestGameState();
      state.age = 1;

      // Only 1 income from techs
      state.players['1'].techCards = ['wooden_framework']; // income: 1
      state.players['1'].income = 10;

      // Player loses 5 routes (penalty > tech income)
      state.map.routes = [
        { id: 'r1', claimed: '1' },
        { id: 'r2', claimed: '1' },
        { id: 'r3', claimed: '1' },
        { id: 'r4', claimed: '1' },
        { id: 'r5', claimed: '1' }
      ];

      calculateTransitionIncome(state);

      // New income = 1 - 5 = -4, but minimum is 0
      expect(state.players['1'].income).toBe(0);
    });

    it('should NOT use hardcoded base income', () => {
      const state = createTestGameState();
      state.age = 1;

      // No technologies - income should be 0
      state.players['1'].techCards = [];
      state.players['1'].income = 10;

      // No routes lost
      state.map.routes = [];

      calculateTransitionIncome(state);

      // Income should be based on technologies, NOT a hardcoded base of 5
      // With no technologies, income should be 0 (not 5)
      expect(state.players['1'].income).toBe(0);
    });

    it('should handle player with mix of high and low income technologies', () => {
      const state = createTestGameState();
      state.age = 2;

      // Mix of technologies from Appendix C with various income values:
      // supercharged_engine (Age III): income: 3
      // dining_saloon (Age III): income: 3
      // promenade_deck (Age III): income: 3
      // wire_bracing (Age I): income: 1
      // Total: 10
      state.players['1'].techCards = ['supercharged_engine', 'dining_saloon', 'promenade_deck', 'wire_bracing'];
      state.players['1'].income = 15;

      // Loses 4 routes
      state.map.routes = [
        { id: 'r1', claimed: '1' },
        { id: 'r2', claimed: '1' },
        { id: 'r3', claimed: '1' },
        { id: 'r4', claimed: '1' }
      ];

      calculateTransitionIncome(state);

      // New income = 10 - 4 = 6
      expect(state.players['1'].income).toBe(6);
    });

    it('should only count routes claimed by the player', () => {
      const state = createTestGameState();
      state.age = 1;

      state.players['1'].techCards = ['wooden_framework', 'wire_bracing']; // income: 2
      state.players['1'].income = 8;

      // Mix of claimed and unclaimed routes
      state.map.routes = [
        { id: 'r1', claimed: '1' },      // Player 1's route
        { id: 'r2', claimed: '2' },      // Player 2's route - shouldn't count
        { id: 'r3', claimed: null },     // Unclaimed - shouldn't count
        { id: 'r4', claimed: '1' }       // Player 1's route
      ];

      calculateTransitionIncome(state);

      // Player 1 loses 2 routes, not 4
      // New income = 2 - 2 = 0
      expect(state.players['1'].income).toBe(0);
    });
  });
});
