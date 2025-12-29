/**
 * Rules Compliance Tests - Age Transitions
 * Tests for correct implementation of Section 1.3 and 12 (Progress Track and Age Transitions)
 */

const { createTestGameState } = require('../../fixtures/testData');
const { startNewRound } = require('../../../server/actions/helpers/phaseTransition');

describe('Rules Compliance - Age Transitions', () => {

  describe('GAP-010: Age transition via Progress Track', () => {
    it('should NOT transition age based on turn count per Section 1.3', () => {
      const state = createTestGameState();

      // Set turn to 11 (past TURNS_PER_AGE of 10) but progress track at 0
      state.turn = 10;
      state.age = 1;
      state.progressTrack = 5; // Well below threshold of 12 for 4 players
      state.progressThresholds = { age2: 12, age3: 24, end: 30 };

      // Start new round should increment turn but NOT change age
      startNewRound(state);

      // Turn should be 11 now
      expect(state.turn).toBe(11);
      // Age should still be 1 (NOT changed based on turns)
      expect(state.age).toBe(1);
    });

    it('should transition age when Progress Track reaches threshold per Section 1.3', () => {
      const state = createTestGameState();

      state.turn = 5;
      state.age = 1;
      state.progressTrack = 12; // Exactly at Age II threshold for 4 players
      state.progressThresholds = { age2: 12, age3: 24, end: 30 };

      // Age should transition when progress track reaches threshold
      // The transition happens in technology.js checkAgeTransition
      // But startNewRound should check it during Income & Cleanup
      startNewRound(state);

      // Per Section 5.2 step 3: "Check Age Transition: If Progress Track reached threshold, trigger Age Transition"
      // The age transition is triggered when the progress track threshold is reached
      expect(state.age).toBe(2);
    });

    it('should reset player agentsRemaining to their actual agent count', () => {
      const state = createTestGameState();
      state.turn = 1;

      // Set up a player with 3 agents (earned 3rd)
      state.players['1'].agents = 3;
      state.players['1'].agentsRemaining = 0;
      state.players['1'].hasPassed = true;

      // Another player still with 2 agents
      state.players['2'].agents = 2;
      state.players['2'].agentsRemaining = 0;
      state.players['2'].hasPassed = true;

      startNewRound(state);

      // Each player should get their own agent count back
      expect(state.players['1'].agentsRemaining).toBe(3);
      expect(state.players['2'].agentsRemaining).toBe(2);
    });
  });
});
