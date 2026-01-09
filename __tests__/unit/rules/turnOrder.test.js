/**
 * Rules Compliance Tests - Turn Order
 * Tests for correct implementation of Section 3.3 and 5.1 (Seating and Turn Order)
 *
 * Turn order rules:
 * 1. playerOrder represents fixed seating around the table (randomized at game start)
 * 2. The player with the First Player token goes first
 * 3. Play proceeds clockwise (in playerOrder) from the First Player
 */

const { createTestGameState } = require('../../fixtures/testData');
const { calculateTurnOrder } = require('../../../server/actions/helpers/turnOrder');

describe('Rules Compliance - Turn Order', () => {

  describe('GAP-009: First Player Token priority', () => {
    it('should give turn priority to player with First Player token per Section 5.1', () => {
      const state = createTestGameState();
      // Default playerOrder is [1, 2, 3, 4]

      // Player 2 has the First Player token (from visiting Ministry)
      state.firstPlayer = 2;

      // Income doesn't matter anymore - it's clockwise from First Player
      state.players[3].income = 1;
      state.players[2].income = 5;
      state.players[1].income = 10;

      const order = calculateTurnOrder(state);

      // First Player token holder should go first regardless of income
      expect(order[0]).toBe(2);
    });

    it('should persist First Player token across rounds', () => {
      const state = createTestGameState();

      // Set First Player in previous round
      state.firstPlayer = 3;
      state.workerPlacement = {
        ministryVisitors: [], // No one visited Ministry this round
        passedPlayers: []
      };

      const order = calculateTurnOrder(state);

      // Player 3 should still go first (persisted from previous round)
      expect(order[0]).toBe(3);
    });

    it('should transfer First Player token when Ministry is visited', () => {
      const state = createTestGameState();

      // Player 1 was First Player
      state.firstPlayer = 1;

      // Player 4 visited Ministry this round - should claim First Player
      state.workerPlacement = {
        ministryVisitors: [4],
        passedPlayers: []
      };

      const order = calculateTurnOrder(state);

      // Player 4 should now go first (claimed token via Ministry)
      expect(order[0]).toBe(4);
    });

    it('should proceed clockwise (in playerOrder) after First Player', () => {
      const state = createTestGameState();

      // playerOrder is [1, 2, 3, 4] (seating order)
      state.firstPlayer = 3;

      const order = calculateTurnOrder(state);

      // First: Player 3 (First Player token)
      expect(order[0]).toBe(3);

      // Remaining players clockwise from 3: 4, 1, 2
      expect(order[1]).toBe(4);
      expect(order[2]).toBe(1);
      expect(order[3]).toBe(2);
    });

    it('should maintain clockwise order regardless of income', () => {
      const state = createTestGameState();

      state.firstPlayer = 1;

      // Set up incomes - these should NOT affect order anymore
      state.players[1].income = 10; // highest income
      state.players[2].income = 8;
      state.players[3].income = 3;  // lowest income
      state.players[4].income = 5;

      const order = calculateTurnOrder(state);

      // Order should be clockwise from Player 1, NOT income-based
      expect(order[0]).toBe(1);
      expect(order[1]).toBe(2);
      expect(order[2]).toBe(3);
      expect(order[3]).toBe(4);
    });
  });
});
