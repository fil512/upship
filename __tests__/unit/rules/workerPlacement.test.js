/**
 * Rules Compliance Tests - Worker Placement (Card Effects)
 * Tests for correct implementation of Section 11.3 (Starter Deck card effects)
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processCardEffect } = require('../../../server/actions/worker');

describe('Rules Compliance - Worker Placement', () => {

  describe('GAP-035: Clerk card Agent Effect', () => {
    it('should grant £1 when Clerk card is used for agent placement', () => {
      const state = createTestGameState();
      state.players['1'].cash = 10;

      const clerkCard = {
        id: 'starter_6',
        name: 'Clerk',
        symbol: 'coin',
        reveal: { cash: 1 },
        effect: 'Gain £1'
      };

      const result = processCardEffect(state, '1', clerkCard, 'academy');

      // Clerk should grant £1
      expect(result.success).toBe(true);
      expect(state.players['1'].cash).toBe(11);
    });

    it('should grant £2 when Purser card is used (existing behavior check)', () => {
      const state = createTestGameState();
      state.players['1'].cash = 10;

      const purserCard = {
        id: 'starter_5',
        name: 'Purser',
        symbol: 'coin',
        reveal: { influence: 2 },
        effect: 'Gain £2'
      };

      const result = processCardEffect(state, '1', purserCard, 'academy');

      // Purser should grant £2
      expect(result.success).toBe(true);
      expect(state.players['1'].cash).toBe(12);
    });

    it('should handle cards with no effect gracefully', () => {
      const state = createTestGameState();
      state.players['1'].cash = 10;

      const investorCard = {
        id: 'starter_7',
        name: 'Investor',
        symbol: 'coin',
        reveal: { influence: 3 },
        effect: 'None'
      };

      const result = processCardEffect(state, '1', investorCard, 'academy');

      // Investor has no effect
      expect(result.success).toBe(true);
      expect(state.players['1'].cash).toBe(10); // Unchanged
    });
  });
});
