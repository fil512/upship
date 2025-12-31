/**
 * Rules Compliance Tests - Bankruptcy Rules
 * Tests for GAP-082: Bankruptcy handling during Income & Cleanup phase
 *
 * Per Section 5.3 and Section 14.4:
 * - During Income & Cleanup, if net income is negative, player must pay from cash
 * - If cash is insufficient, player must take loans until solvent
 * - Each loan gives +30 cash but reduces income by 3
 * - If taking a loan would push income below -10, player is bankrupt
 * - Bankruptcy: lose 10 VP and reset Income Track to 0
 */

const { createTestGameState, createTestPlayerState } = require('../../fixtures/testData');
const { transitionToIncomeCleanup } = require('../../../server/actions/helpers/phaseTransition');
const { MIN_INCOME, LOAN_AMOUNT, LOAN_INCOME_PENALTY } = require('../../../server/config/constants');

describe('Rules Compliance - Bankruptcy Rules (GAP-082)', () => {

  describe('Automatic loan handling during Income & Cleanup', () => {
    it('should automatically take loan when player cannot pay deficit from cash', () => {
      const state = createTestGameState(['1', '2']);
      state.phase = 'reveal';

      // Player 1: income 5, engineers 10 = net income -5
      // Cash 3 = cannot pay full deficit
      state.players['1'].income = 5;
      state.players['1'].engineers = 10;
      state.players['1'].cash = 3;
      state.players['1'].loans = 0;

      // Set up for income cleanup
      state.revealPhase = {
        revealedHands: { '1': [], '2': [] },
        resourcesCollected: { '1': true, '2': true }
      };

      transitionToIncomeCleanup(state);

      // Player should have taken a loan:
      // - Cash: 3 (initial) - 0 (can pay) + 30 (loan) = enough to cover deficit
      // - After paying remaining deficit: cash should be positive
      // - Income reduced by 3 for loan
      expect(state.players['1'].income).toBe(5 - LOAN_INCOME_PENALTY);
      expect(state.players['1'].loans).toBe(1);
      expect(state.players['1'].cash).toBeGreaterThanOrEqual(0);
    });

    it('should take multiple loans if needed to cover large deficit', () => {
      const state = createTestGameState(['1', '2']);
      state.phase = 'reveal';

      // Player 1: income 5, engineers 40 = net income -35
      // Cash 0 = needs at least 2 loans (2 * 30 = 60 covers 35)
      state.players['1'].income = 5;
      state.players['1'].engineers = 40;
      state.players['1'].cash = 0;
      state.players['1'].loans = 0;

      state.revealPhase = {
        revealedHands: { '1': [], '2': [] },
        resourcesCollected: { '1': true, '2': true }
      };

      transitionToIncomeCleanup(state);

      // Player should have taken 2 loans:
      // - Income reduced by 6 (2 * 3)
      expect(state.players['1'].income).toBe(5 - (2 * LOAN_INCOME_PENALTY));
      expect(state.players['1'].loans).toBe(2);
      expect(state.players['1'].cash).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Bankruptcy trigger', () => {
    it('should trigger bankruptcy when loan would push income below -10', () => {
      const state = createTestGameState(['1', '2']);
      state.phase = 'reveal';

      // Player 1: income -8, engineers 5 = net income -13
      // Cash 0 = needs loan, but income -8 - 3 = -11 < -10 = bankruptcy
      state.players['1'].income = -8;
      state.players['1'].engineers = 5;
      state.players['1'].cash = 0;
      state.players['1'].loans = 0;
      state.players['1'].vp = 20;

      state.revealPhase = {
        revealedHands: { '1': [], '2': [] },
        resourcesCollected: { '1': true, '2': true }
      };

      transitionToIncomeCleanup(state);

      // Player should be bankrupt:
      // - VP reduced by 10 (from 20 to 10)
      // - Income reset to 0
      expect(state.players['1'].vp).toBe(10);
      expect(state.players['1'].income).toBe(0);
    });

    it('should not allow VP to go negative on bankruptcy', () => {
      const state = createTestGameState(['1', '2']);
      state.phase = 'reveal';

      // Player with only 5 VP - bankruptcy should not make VP negative
      state.players['1'].income = -8;
      state.players['1'].engineers = 5;
      state.players['1'].cash = 0;
      state.players['1'].loans = 0;
      state.players['1'].vp = 5;

      state.revealPhase = {
        revealedHands: { '1': [], '2': [] },
        resourcesCollected: { '1': true, '2': true }
      };

      transitionToIncomeCleanup(state);

      // VP should be 0 (5 - 10 = -5, but minimum 0)
      expect(state.players['1'].vp).toBe(0);
      expect(state.players['1'].income).toBe(0);
    });

    it('should log bankruptcy event', () => {
      const state = createTestGameState(['1', '2']);
      state.phase = 'reveal';
      state.log = [];

      state.players['1'].income = -8;
      state.players['1'].engineers = 5;
      state.players['1'].cash = 0;
      state.players['1'].vp = 20;

      state.revealPhase = {
        revealedHands: { '1': [], '2': [] },
        resourcesCollected: { '1': true, '2': true }
      };

      transitionToIncomeCleanup(state);

      // Should have a bankruptcy log entry
      const bankruptcyLog = state.log.find(l => l.type === 'bankruptcy');
      expect(bankruptcyLog).toBeDefined();
      expect(bankruptcyLog.message.toLowerCase()).toContain('bankrupt');
    });
  });

  describe('Boundary conditions', () => {
    it('should allow loan when income exactly at -7 (would go to -10)', () => {
      const state = createTestGameState(['1', '2']);
      state.phase = 'reveal';

      // Income -7, taking loan would put at -10 exactly = allowed
      state.players['1'].income = -7;
      state.players['1'].engineers = 5;
      state.players['1'].cash = 0;
      state.players['1'].vp = 20;

      state.revealPhase = {
        revealedHands: { '1': [], '2': [] },
        resourcesCollected: { '1': true, '2': true }
      };

      transitionToIncomeCleanup(state);

      // Should have taken a loan (income goes to exactly -10, which is allowed)
      expect(state.players['1'].income).toBe(-10);
      expect(state.players['1'].loans).toBe(1);
      // Should NOT be bankrupt
      expect(state.players['1'].vp).toBe(20);
    });

    it('should trigger bankruptcy when income at -8 (loan would go to -11)', () => {
      const state = createTestGameState(['1', '2']);
      state.phase = 'reveal';

      // Income -8, taking loan would put at -11 < -10 = bankruptcy
      state.players['1'].income = -8;
      state.players['1'].engineers = 5;
      state.players['1'].cash = 0;
      state.players['1'].vp = 20;

      state.revealPhase = {
        revealedHands: { '1': [], '2': [] },
        resourcesCollected: { '1': true, '2': true }
      };

      transitionToIncomeCleanup(state);

      // Should be bankrupt
      expect(state.players['1'].vp).toBe(10);
      expect(state.players['1'].income).toBe(0);
    });

    it('should not affect player who can pay deficit from cash', () => {
      const state = createTestGameState(['1', '2']);
      state.phase = 'reveal';

      // Player can afford the deficit from cash
      state.players['1'].income = 5;
      state.players['1'].engineers = 10;
      state.players['1'].cash = 10; // Can pay 5 deficit

      state.revealPhase = {
        revealedHands: { '1': [], '2': [] },
        resourcesCollected: { '1': true, '2': true }
      };

      transitionToIncomeCleanup(state);

      // Cash reduced by deficit, no loans, income unchanged
      expect(state.players['1'].cash).toBe(5); // 10 - 5 = 5
      expect(state.players['1'].loans).toBeUndefined(); // or 0
      expect(state.players['1'].income).toBe(5);
    });
  });
});
