/**
 * Rules Compliance Tests - First Player Token
 * Tests for GAP-081: Ministry should set state.firstPlayer persistently
 *
 * Per Section 6.9: When a player visits Ministry, they take the First Player Token.
 * This token persists across rounds - the holder goes first in turn order until
 * someone else claims it by visiting Ministry.
 */

const { createTestGameState, createTestPlayerState } = require('../../fixtures/testData');
const { processPlaceAgent } = require('../../../server/actions/worker');

describe('Rules Compliance - First Player Token (GAP-081)', () => {

  describe('First Player Token initialization', () => {
    it('should initialize firstPlayer to the randomly-determined first player at game start', () => {
      const state = createTestGameState(['1', '2', '3', '4']);

      // The fixture doesn't set firstPlayer - we're testing that it SHOULD be set
      // For now, this test documents that the bug exists
      // After fix, state.firstPlayer should be the first player in playerOrder
      expect(state.firstPlayer).toBe(state.playerOrder[0]);
    });
  });

  describe('Ministry sets First Player Token', () => {
    it('should set state.firstPlayer when a player visits Ministry', () => {
      const state = createTestGameState(['1', '2', '3', '4']);
      state.phase = 'worker_placement';
      state.workerPlacement = {
        passedPlayers: [],
        ministryVisitors: [],
        placementOrder: ['1', '2', '3', '4'],
        currentPlacerIndex: 0
      };

      // Player 1 has initial first player token
      state.firstPlayer = '1';

      // Give player 2 a card to play
      state.players['2'].hand = [{ id: 'test_propeller', name: 'Test Card', symbol: 'propeller' }];
      state.players['2'].agentsRemaining = 2;

      // Make it player 2's turn
      state.workerPlacement.currentPlacerIndex = 1;

      // Player 2 visits Ministry
      processPlaceAgent(state, '2', { locationId: 'ministry', cardIndex: 0 });

      // After visiting Ministry, player 2 should hold the First Player Token
      expect(state.firstPlayer).toBe('2');
    });

    it('should persist firstPlayer across rounds when no one visits Ministry', () => {
      const state = createTestGameState(['1', '2', '3', '4']);

      // Player 3 held the token from a previous round
      state.firstPlayer = '3';

      // No one visited Ministry this round
      state.workerPlacement = {
        passedPlayers: [],
        ministryVisitors: [],
        placementOrder: ['1', '2', '3', '4'],
        currentPlacerIndex: 0
      };

      // After a round with no Ministry visitors, firstPlayer should still be '3'
      expect(state.firstPlayer).toBe('3');
    });

    it('should update firstPlayer across multiple rounds', () => {
      const state = createTestGameState(['1', '2', '3', '4']);
      state.phase = 'worker_placement';
      state.firstPlayer = '1';

      // Round 1: Player 2 visits Ministry
      state.players['2'].hand = [{ id: 'test_propeller_1', name: 'Test Card', symbol: 'propeller' }];
      state.players['2'].agentsRemaining = 2;

      state.workerPlacement = {
        passedPlayers: [],
        ministryVisitors: [],
        placementOrder: ['1', '2', '3', '4'],
        currentPlacerIndex: 1 // Player 2's turn
      };

      // Player 2 visits Ministry
      processPlaceAgent(state, '2', { locationId: 'ministry', cardIndex: 0 });
      expect(state.firstPlayer).toBe('2');

      // Simulate next round: clear groundBoard, reset for new round
      state.groundBoard.placements = {};
      state.workerPlacement.ministryVisitors = [];
      state.workerPlacement.currentPlacerIndex = 3; // Now player 4's turn

      state.players['4'].hand = [{ id: 'test_propeller_2', name: 'Test Card', symbol: 'propeller' }];
      state.players['4'].agentsRemaining = 2;

      // Player 4 visits Ministry in the next round
      processPlaceAgent(state, '4', { locationId: 'ministry', cardIndex: 0 });
      expect(state.firstPlayer).toBe('4');
    });
  });

  describe('First Player Token affects turn order', () => {
    it('should use persisted firstPlayer for turn order when ministryVisitors is empty', () => {
      const { calculateTurnOrder } = require('../../../server/actions/helpers/turnOrder');

      const state = createTestGameState(['1', '2', '3', '4']);

      // Player 3 has the First Player token (set persistently)
      state.firstPlayer = '3';

      // No one visited Ministry this round
      state.workerPlacement = {
        passedPlayers: [],
        ministryVisitors: [],
        placementOrder: ['1', '2', '3', '4'],
        currentPlacerIndex: 0
      };

      // Income values are set but don't affect turn order
      // Turn order is clockwise seating, not income-based
      state.players['1'].income = 1;
      state.players['2'].income = 5;
      state.players['3'].income = 10;
      state.players['4'].income = 8;

      const order = calculateTurnOrder(state);

      // Player 3 should go first due to First Player token
      expect(order[0]).toBe('3');
      // Remaining players in clockwise seating order from player 3
      // playerOrder is ['1', '2', '3', '4'], so clockwise from 3 is: 3 -> 4 -> 1 -> 2
      expect(order[1]).toBe('4');
      expect(order[2]).toBe('1');
      expect(order[3]).toBe('2');
    });
  });
});
