/**
 * Rules Compliance Tests - Loans and Debt
 * Tests for correct implementation of Section 5.3 Loans
 */

const { processTakeLoan, processBuyInsurance } = require('../../../server/actions/economy');

describe('Rules Compliance - Loans', () => {

  describe('GAP-063: Loan Debt Limit and Bankruptcy', () => {
    describe('Income minimum of -10', () => {
      it('should allow income to go negative when taking a loan', () => {
        const state = {
          players: {
            player1: {
              cash: 0,
              income: 0,
              loans: 0
            }
          },
          log: []
        };

        const result = processTakeLoan(state, 'player1', {});

        // Per Section 5.3: Loan reduces income by 3
        // Income can go negative, minimum -10
        expect(result.newState.players.player1.income).toBe(-3);
        expect(result.newState.players.player1.cash).toBe(30);
      });

      it('should allow income to go to -10', () => {
        const state = {
          players: {
            player1: {
              cash: 0,
              income: -7,
              loans: 1
            }
          },
          log: []
        };

        const result = processTakeLoan(state, 'player1', {});

        // -7 - 3 = -10, which is the minimum
        expect(result.newState.players.player1.income).toBe(-10);
      });

      it('should reject loan if it would push income below -10', () => {
        const state = {
          players: {
            player1: {
              cash: 0,
              income: -8,
              loans: 1
            }
          },
          log: []
        };

        // Per Section 5.3: "If a loan would push you below -10, you cannot take it"
        expect(() => processTakeLoan(state, 'player1', {})).toThrow();
      });

      it('should reject loan if income is already at -10', () => {
        const state = {
          players: {
            player1: {
              cash: 0,
              income: -10,
              loans: 1
            }
          },
          log: []
        };

        // Cannot take loan - would push below -10
        expect(() => processTakeLoan(state, 'player1', {})).toThrow();
      });
    });

    describe('Insurance income reduction respects -10 limit', () => {
      it('should reject insurance if it would push income below -10', () => {
        const state = {
          phase: 'worker_placement',
          players: {
            player1: {
              income: -10,
              insurance: 0
            }
          },
          groundBoard: {
            placements: {
              insurance_bureau: { playerId: 'player1' }
            }
          },
          log: []
        };

        // Per Section 5.3 principle: Income cannot go below -10
        expect(() => processBuyInsurance(state, 'player1', { _internal: true })).toThrow();
      });
    });
  });
});
