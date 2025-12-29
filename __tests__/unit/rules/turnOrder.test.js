/**
 * Rules Compliance Tests - Turn Order
 * Tests for correct implementation of Section 5.1 (Turn Order and First Player Token)
 */

const { createTestGameState } = require('../../fixtures/testData');
const { calculateTurnOrder } = require('../../../server/actions/helpers/turnOrder');

describe('Rules Compliance - Turn Order', () => {

  describe('GAP-009: First Player Token priority', () => {
    it('should give turn priority to player with First Player token per Section 5.1', () => {
      const state = createTestGameState();

      // Player 2 has the First Player token (from visiting Ministry)
      state.firstPlayer = '2';

      // Player 3 has lowest income (would normally go first)
      state.players['3'].income = 1;
      state.players['2'].income = 5;
      state.players['1'].income = 10;

      const order = calculateTurnOrder(state);

      // First Player token holder should go first regardless of income
      expect(order[0]).toBe('2');
    });

    it('should persist First Player token across rounds', () => {
      const state = createTestGameState();

      // Set First Player in previous round
      state.firstPlayer = '3';
      state.workerPlacement = {
        ministryVisitors: [], // No one visited Ministry this round
        passedPlayers: []
      };

      const order = calculateTurnOrder(state);

      // Player 3 should still go first (persisted from previous round)
      expect(order[0]).toBe('3');
    });

    it('should transfer First Player token when Ministry is visited', () => {
      const state = createTestGameState();

      // Player 1 was First Player
      state.firstPlayer = '1';

      // Player 4 visited Ministry this round - should claim First Player
      state.workerPlacement = {
        ministryVisitors: ['4'],
        passedPlayers: []
      };

      const order = calculateTurnOrder(state);

      // Player 4 should now go first (claimed token via Ministry)
      expect(order[0]).toBe('4');
    });

    it('should maintain income-based order for non-First Player players', () => {
      const state = createTestGameState();

      state.firstPlayer = '1';

      // Set up incomes for remaining players
      state.players['1'].income = 10;
      state.players['2'].income = 8;
      state.players['3'].income = 3;
      state.players['4'].income = 5;

      const order = calculateTurnOrder(state);

      // First: Player 1 (First Player token)
      expect(order[0]).toBe('1');

      // Remaining players ordered by income (lowest first): 3, 4, 2
      expect(order[1]).toBe('3');
      expect(order[2]).toBe('4');
      expect(order[3]).toBe('2');
    });
  });
});
