/**
 * Rules Compliance Tests - Hazards
 * Tests for correct implementation of Section 1.2 (Hindenburg Disaster) and hazard checks
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processHazardCheck, checkHindenburgDisaster } = require('../../../server/actions/hazard');

describe('Rules Compliance - Hazards', () => {

  describe('GAP-016: Hindenburg Disaster game end condition', () => {
    it('should trigger Hindenburg Disaster on Catastrophic Explosion in Age III Luxury Launch with Hydrogen', () => {
      const state = createTestGameState();
      state.age = 3; // Age III

      // Set up a ship on a Luxury route using Hydrogen
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'on_route',
        routeId: 'luxury_route',
        gasType: 'hydrogen',
        stats: { reliability: 2 }
      }];

      // Set up hazard deck with Catastrophic Explosion
      state.players['1'].hazardDeck = [{
        type: 'catastrophic_explosion',
        difficulty: 99, // Impossible to pass
        name: 'Catastrophic Explosion'
      }];

      // The route is a Luxury route
      state.map.routes = [{
        id: 'luxury_route',
        luxury: true,
        distance: 5,
        income: 10
      }];

      const result = processHazardCheck(state, '1', { shipId: 'ship1' });

      // Game should be flagged for ending (Hindenburg Disaster)
      expect(result.newState.hindenburgDisaster).toBe(true);
      expect(result.newState.gameEndReason).toBe('hindenburg_disaster');
    });

    it('should NOT trigger Hindenburg Disaster in Age I or II', () => {
      const state = createTestGameState();
      state.age = 2; // Age II - NOT Age III

      state.players['1'].ships = [{
        id: 'ship1',
        status: 'on_route',
        routeId: 'luxury_route',
        gasType: 'hydrogen',
        stats: { reliability: 0 }
      }];

      state.players['1'].hazardDeck = [{
        type: 'catastrophic_explosion',
        difficulty: 99
      }];

      state.map.routes = [{
        id: 'luxury_route',
        luxury: true,
        distance: 5
      }];

      const result = processHazardCheck(state, '1', { shipId: 'ship1' });

      // Should NOT trigger Hindenburg in Age II
      expect(result.newState.hindenburgDisaster).toBeFalsy();
    });

    it('should NOT trigger Hindenburg Disaster with Helium', () => {
      const state = createTestGameState();
      state.age = 3;

      state.players['1'].ships = [{
        id: 'ship1',
        status: 'on_route',
        routeId: 'luxury_route',
        gasType: 'helium', // HELIUM - safe gas
        stats: { reliability: 0 }
      }];

      state.players['1'].hazardDeck = [{
        type: 'catastrophic_explosion',
        difficulty: 99
      }];

      state.map.routes = [{
        id: 'luxury_route',
        luxury: true,
        distance: 5
      }];

      const result = processHazardCheck(state, '1', { shipId: 'ship1' });

      // Helium ships don't trigger Hindenburg
      expect(result.newState.hindenburgDisaster).toBeFalsy();
    });

    it('should NOT trigger Hindenburg Disaster on non-Luxury routes', () => {
      const state = createTestGameState();
      state.age = 3;

      state.players['1'].ships = [{
        id: 'ship1',
        status: 'on_route',
        routeId: 'normal_route',
        gasType: 'hydrogen',
        stats: { reliability: 0 }
      }];

      state.players['1'].hazardDeck = [{
        type: 'catastrophic_explosion',
        difficulty: 99
      }];

      state.map.routes = [{
        id: 'normal_route',
        luxury: false, // NOT a luxury route
        distance: 3
      }];

      const result = processHazardCheck(state, '1', { shipId: 'ship1' });

      // Non-luxury route shouldn't trigger Hindenburg
      expect(result.newState.hindenburgDisaster).toBeFalsy();
    });

    it('should NOT trigger Hindenburg on regular hazards that fail', () => {
      const state = createTestGameState();
      state.age = 3;

      state.players['1'].ships = [{
        id: 'ship1',
        status: 'on_route',
        routeId: 'luxury_route',
        gasType: 'hydrogen',
        stats: { reliability: 0 }
      }];

      // Regular hazard, not Catastrophic Explosion
      state.players['1'].hazardDeck = [{
        type: 'strong_headwind',
        difficulty: 10
      }];

      state.map.routes = [{
        id: 'luxury_route',
        luxury: true,
        distance: 5
      }];

      const result = processHazardCheck(state, '1', { shipId: 'ship1' });

      // Regular hazard failure shouldn't trigger Hindenburg
      expect(result.newState.hindenburgDisaster).toBeFalsy();
    });

    it('should check all conditions: Age III + Hydrogen + Luxury + Catastrophic Explosion', () => {
      // This is a helper function test
      const conditions = {
        age: 3,
        gasType: 'hydrogen',
        isLuxuryRoute: true,
        hazardType: 'catastrophic_explosion'
      };

      const shouldTrigger = checkHindenburgDisaster(conditions);
      expect(shouldTrigger).toBe(true);

      // Missing any condition should return false
      expect(checkHindenburgDisaster({ ...conditions, age: 2 })).toBe(false);
      expect(checkHindenburgDisaster({ ...conditions, gasType: 'helium' })).toBe(false);
      expect(checkHindenburgDisaster({ ...conditions, isLuxuryRoute: false })).toBe(false);
      expect(checkHindenburgDisaster({ ...conditions, hazardType: 'strong_wind' })).toBe(false);
    });
  });
});
