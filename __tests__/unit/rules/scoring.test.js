/**
 * Rules Compliance Tests - Scoring
 * Tests for correct implementation of Sections 1.1, 1.2, and 12.2 (Victory, Game End, Scoring)
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processCalculateScores, calculateTechnologyVPForScoring, applyTiebreakers } = require('../../../server/actions/scoring');

describe('Rules Compliance - Scoring', () => {

  describe('GAP-017: Technology VP calculation', () => {
    it('should calculate VP based on tile VP values, not formula per Section 12.2', () => {
      const state = createTestGameState();

      // Per constants.js: wooden_framework=0, duralumin_girders=1, geodetic_structure=2
      state.players['1'].technologies = ['wooden_framework', 'duralumin_girders', 'geodetic_structure'];

      // Force end for testing
      state.progressTrack = 30;
      state.progressThresholds = { end: 30 };
      state.age = 3;

      const result = processCalculateScores(state, '1', { forceEnd: true });

      // Technology VP should be 0+1+2=3, NOT Math.floor(3/2)=1
      expect(result.newState.scores['1'].breakdown.technologies).toBe(3);
    });

    it('should use VP values: Essential=0, Useful=1, Niche=2-3 per Section 12.2', () => {
      // Essential (0 VP): wooden_framework, wire_bracing, rubberized_cotton, doped_canvas, etc.
      // Useful (1 VP): duralumin_girders, goldbeater_skin, maybach_engine, etc.
      // Niche (2-3 VP): geodetic_structure, composite_covering, etc.

      const essentialTechs = ['wooden_framework'];
      const usefulTechs = ['duralumin_girders'];
      const nicheTechs = ['geodetic_structure'];

      expect(calculateTechnologyVPForScoring(essentialTechs)).toBe(0);
      expect(calculateTechnologyVPForScoring(usefulTechs)).toBe(1);
      expect(calculateTechnologyVPForScoring(nicheTechs)).toBe(2);
    });
  });

  describe('GAP-018: Tiebreakers in final scoring', () => {
    it('should apply tiebreakers in order per Section 1.1', () => {
      const state = createTestGameState([1, 2]);

      // Both players have same VP
      state.players['1'].technologies = [];
      state.players['2'].technologies = [];

      // No routes claimed
      state.map.routes = [];

      // Set up tie situation
      state.players['1'].income = 8;
      state.players['1'].cash = 20;

      state.players['2'].income = 10; // Higher income - should win tiebreaker 1
      state.players['2'].cash = 15;

      state.progressTrack = 30;
      state.age = 3;

      const result = processCalculateScores(state, '1', { forceEnd: true });

      // Player 2 should win due to higher income (tiebreaker 1)
      expect(result.newState.winner).toBe('2');
    });

    it('should use cash as second tiebreaker when income is tied', () => {
      const state = createTestGameState([1, 2]);

      state.players['1'].technologies = [];
      state.players['2'].technologies = [];
      state.map.routes = [];

      // Same income
      state.players['1'].income = 8;
      state.players['2'].income = 8;

      // Player 1 has more cash (tiebreaker 2)
      state.players['1'].cash = 25;
      state.players['2'].cash = 15;

      state.progressTrack = 30;
      state.age = 3;

      const result = processCalculateScores(state, '1', { forceEnd: true });

      // Player 1 should win due to more cash
      expect(result.newState.winner).toBe('1');
    });

    it('should use ships on routes as third tiebreaker', () => {
      const state = createTestGameState([1, 2]);

      state.players['1'].technologies = [];
      state.players['2'].technologies = [];
      state.map.routes = [];

      // Same income and cash
      state.players['1'].income = 8;
      state.players['2'].income = 8;
      state.players['1'].cash = 20;
      state.players['2'].cash = 20;

      // Player 2 has more ships on routes
      state.players['1'].ships = [{ status: 'on_route' }];
      state.players['2'].ships = [{ status: 'on_route' }, { status: 'on_route' }];

      state.progressTrack = 30;
      state.age = 3;

      const result = processCalculateScores(state, '1', { forceEnd: true });

      // Player 2 should win due to more ships on routes
      expect(result.newState.winner).toBe('2');
    });
  });

  describe('GAP-053: Route VP scoring uses route.vp property', () => {
    it('should use route.vp for VP scoring, not route.distance per Section 12.2 and Appendix F', () => {
      const state = createTestGameState([1]);

      // Route with vp property (correct) vs distance property (incorrect)
      // This route has vp: 5 but distance: 2
      state.map.routes = [
        { id: 'r1', vp: 5, distance: 2, claimed: '1' },
        { id: 'r2', vp: 3, distance: 1, claimed: '1' }
      ];

      state.players['1'].technologies = [];
      state.progressTrack = 30;
      state.age = 3;

      const result = processCalculateScores(state, '1', { forceEnd: true });

      // Should use vp (5+3=8), NOT distance (2+1=3)
      expect(result.newState.scores['1'].breakdown.routes).toBe(8);
    });

    it('should handle routes that only have vp property', () => {
      const state = createTestGameState([1]);

      // Routes with only vp, no distance (as per Appendix F)
      state.map.routes = [
        { id: 'r1', vp: 4, claimed: '1' },
        { id: 'r2', vp: 2, claimed: '1' }
      ];

      state.players['1'].technologies = [];
      state.progressTrack = 30;
      state.age = 3;

      const result = processCalculateScores(state, '1', { forceEnd: true });

      // Should sum vp values: 4+2=6
      expect(result.newState.scores['1'].breakdown.routes).toBe(6);
    });
  });

  describe('GAP-019: Final scoring VP sources', () => {
    it('should NOT award VP for cash per Section 1.1', () => {
      const state = createTestGameState([1]);

      state.players['1'].technologies = [];
      state.players['1'].cash = 100; // High cash should not give VP
      state.map.routes = [];

      state.progressTrack = 30;
      state.age = 3;

      const result = processCalculateScores(state, '1', { forceEnd: true });

      // Cash should NOT contribute to VP
      expect(result.newState.scores['1'].breakdown.cash).toBeUndefined();
      // Or if we track it for display, it should be 0
      if (result.newState.scores['1'].breakdown.cash !== undefined) {
        expect(result.newState.scores['1'].breakdown.cash).toBe(0);
      }
    });

    it('should NOT award VP for ships on routes per Section 1.1', () => {
      const state = createTestGameState([1]);

      state.players['1'].technologies = [];
      state.players['1'].ships = [
        { status: 'on_route' },
        { status: 'on_route' },
        { status: 'on_route' }
      ];
      state.map.routes = [];

      state.progressTrack = 30;
      state.age = 3;

      const result = processCalculateScores(state, '1', { forceEnd: true });

      // Ships on routes should NOT contribute to VP (they're a tiebreaker, not VP source)
      expect(result.newState.scores['1'].breakdown.ships).toBeUndefined();
      // Or if we track it for display, it should be 0
      if (result.newState.scores['1'].breakdown.ships !== undefined) {
        expect(result.newState.scores['1'].breakdown.ships).toBe(0);
      }
    });

    it('should only award VP from routes and technologies per Section 12.2', () => {
      const state = createTestGameState([1]);

      // 3 VP from technologies
      state.players['1'].technologies = ['duralumin_girders', 'geodetic_structure']; // 1+2=3

      // 5 VP from routes (using vp property per Appendix F)
      state.map.routes = [
        { id: 'r1', vp: 3, claimed: '1' },
        { id: 'r2', vp: 2, claimed: '1' }
      ];

      // These should NOT contribute to VP
      state.players['1'].cash = 100;
      state.players['1'].ships = [{ status: 'on_route' }, { status: 'on_route' }];

      state.progressTrack = 30;
      state.age = 3;

      const result = processCalculateScores(state, '1', { forceEnd: true });

      // Total should be 3 (tech) + 5 (routes) = 8 VP
      expect(result.newState.scores['1'].total).toBe(8);
      expect(result.newState.scores['1'].breakdown.routes).toBe(5);
      expect(result.newState.scores['1'].breakdown.technologies).toBe(3);
    });
  });
});
