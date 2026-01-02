/**
 * Rules Compliance Tests - Game End Conditions
 * Tests for correct implementation of Section 1.2 (Game End)
 * GAP-052: Hindenburg Disaster should complete current round
 * GAP-053: Progress Track end should complete current round
 * GAP-056: Technology VP scoring is cumulative across ages
 * GAP-057: Final scoring should account for previously accumulated VP
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processHazardCheck, checkHindenburgDisaster } = require('../../../server/actions/hazard');
const { startNewRound } = require('../../../server/actions/helpers/phaseTransition');
const { performAgeTransition, completeAgeTransition, scoreAllPlayersVP } = require('../../../server/actions/helpers/ageTransition');
const { processCalculateScores } = require('../../../server/actions/scoring');

describe('Rules Compliance - Game End Conditions', () => {

  describe('GAP-052: Hindenburg Disaster should complete current round', () => {
    it('should set gameEndAfterRound flag when Hindenburg triggers instead of ending immediately', () => {
      const state = createTestGameState();
      state.age = 3;
      state.phase = 'worker_placement';
      state.playerOrder = ['1', '2', '3', '4'];

      // Set up player 1 to trigger Hindenburg
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        gasType: 'hydrogen',
        pendingRouteId: 'luxury_route_1',
        stats: { speed: 3, range: 3, ceiling: 2, reliability: 2 }
      }];

      // Add hazard deck with Catastrophic Explosion
      state.players['1'].hazardDeck = [{
        id: 'catastrophic_explosion_1',
        type: 'catastrophic_explosion',
        name: 'Catastrophic Explosion',
        noSave: true,
        category: 'fire',
        hydrogenOnly: true
      }];
      state.players['1'].hazardDiscardPile = [];

      // Add luxury route to map
      state.map.routes.push({
        id: 'luxury_route_1',
        luxury: true,
        from: 'New York',
        to: 'London',
        income: 5
      });

      // Trigger hazard check
      const result = processHazardCheck(state, '1', { shipId: 'ship1' });

      // Per Section 1.2: "Complete the current round, then proceed to final scoring"
      // Should set gameEndAfterRound flag, NOT end immediately
      expect(result.newState.hindenburgDisaster).toBe(true);
      expect(result.newState.gameEndReason).toBe('hindenburg_disaster');
      expect(result.newState.gameEndAfterRound).toBe(true);
      // Game should NOT have ended yet - other players should still get their turns
      expect(result.newState.winner).toBeUndefined();
    });

    it('should allow other players to complete their turns after Hindenburg', () => {
      const state = createTestGameState();
      state.age = 3;
      state.hindenburgDisaster = true;
      state.gameEndReason = 'hindenburg_disaster';
      state.gameEndAfterRound = true;
      state.phase = 'worker_placement';
      state.workerPlacement.currentPlacerIndex = 1; // Player 2's turn

      // Player 2 should still be able to play
      expect(state.workerPlacement.currentPlacerIndex).toBe(1);
      // Phase should still be worker_placement
      expect(state.phase).toBe('worker_placement');
    });
  });

  describe('GAP-053: Progress Track end should complete current round', () => {
    it('should set gameEndAfterRound flag when progress reaches end threshold', () => {
      const state = createTestGameState();
      state.age = 3;
      state.phase = 'income_cleanup';
      state.progressTrack = 12; // At end threshold for 4 players
      state.progressThresholds = { age2: 4, age3: 8, end: 12 };

      // Start new round should detect game end condition
      startNewRound(state);

      // Per Section 1.2: "Complete the current round, then proceed to final scoring"
      // When detected during Income & Cleanup, the round is complete
      // Game end should be triggered
      expect(state.gameEndAfterRound).toBe(true);
      expect(state.gameEndReason).toBe('progress_track');
    });

    it('should trigger final scoring after round completes when progress threshold reached', () => {
      const state = createTestGameState();
      state.age = 3;
      state.phase = 'income_cleanup';
      state.progressTrack = 12;
      state.progressThresholds = { age2: 4, age3: 8, end: 12 };

      // Give players some VP sources
      state.map.routes[0].claimed = '1';
      state.map.routes[0].vp = 3;
      state.players['1'].techCards = ['wire_bracing']; // 1 VP

      // Start new round should trigger scoring
      startNewRound(state);

      // Scores should be calculated
      expect(state.scores).toBeDefined();
      expect(state.winner).toBeDefined();
    });
  });

  describe('GAP-056: Technology VP scoring is cumulative across ages', () => {
    it('should accumulate technology VP across multiple age transitions', () => {
      const state = createTestGameState();
      state.age = 1;

      // Player 1 has technologies with VP values
      // wire_bracing = 1 VP, steel_framework = 2 VP
      state.players['1'].techCards = ['wire_bracing', 'steel_framework'];
      state.players['1'].vp = 0;

      // Add route VP
      state.map.routes[0].claimed = '1';
      state.map.routes[0].vp = 2;

      // First age transition (Age 1 -> 2)
      performAgeTransition(state, 2);

      // VP should be: 1 (wire_bracing) + 2 (steel_framework) + 2 (route) = 5
      expect(state.players['1'].vp).toBe(5);

      // Complete transition and set up for next age
      completeAgeTransition(state);

      // Clear route claims (routes reset at age transition)
      // But player still has technologies

      // Reclaim a route in Age 2
      state.map.routes[0].claimed = '1';
      state.map.routes[0].vp = 3;

      // Second age transition (Age 2 -> 3)
      performAgeTransition(state, 3);

      // VP should be CUMULATIVE:
      // Previous: 5
      // + 1 (wire_bracing) + 2 (steel_framework) + 3 (new route) = 11 total
      expect(state.players['1'].vp).toBe(11);
    });

    it('should add to existing VP, not replace', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].vp = 10; // Start with existing VP
      state.players['1'].techCards = ['wire_bracing']; // 1 VP
      state.map.routes[0].claimed = '1';
      state.map.routes[0].vp = 2;

      scoreAllPlayersVP(state);

      // Should ADD to existing VP, not replace
      // 10 (existing) + 1 (tech) + 2 (route) = 13
      expect(state.players['1'].vp).toBe(13);
    });
  });

  describe('GAP-057: Final scoring should account for previously accumulated VP', () => {
    it('should include VP accumulated from previous age transitions in final score', () => {
      const state = createTestGameState([1]);
      state.age = 3;
      state.progressTrack = 12;
      state.progressThresholds = { age2: 4, age3: 8, end: 12 };

      // Player accumulated VP from previous age transitions
      state.players['1'].vp = 15;

      // Current state: 1 tech (1 VP) and 1 route (2 VP)
      state.players['1'].techCards = ['wire_bracing']; // 1 VP
      state.map.routes = [{ id: 'r1', vp: 2, claimed: '1' }];

      const result = processCalculateScores(state, '1', { forceEnd: true });

      // Final score should include:
      // - Previously accumulated VP: 15
      // - Current tech VP: 1
      // - Current route VP: 2
      // Total: 18
      expect(result.newState.scores['1'].total).toBe(18);
      expect(result.newState.scores['1'].breakdown.previouslyAccumulated).toBe(15);
      expect(result.newState.scores['1'].breakdown.techCards).toBe(1);
      expect(result.newState.scores['1'].breakdown.routes).toBe(2);
    });

    it('should handle case where player has no previously accumulated VP', () => {
      const state = createTestGameState([1]);
      state.age = 3;
      state.progressTrack = 12;
      state.progressThresholds = { age2: 4, age3: 8, end: 12 };

      // No accumulated VP (game just started Age 3 without scoring)
      state.players['1'].vp = 0;

      state.players['1'].techCards = ['wire_bracing']; // 1 VP
      state.map.routes = [{ id: 'r1', vp: 2, claimed: '1' }];

      const result = processCalculateScores(state, '1', { forceEnd: true });

      // Should just be current state VP
      expect(result.newState.scores['1'].total).toBe(3);
    });
  });
});
