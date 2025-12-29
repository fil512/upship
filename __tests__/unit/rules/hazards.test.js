/**
 * Rules Compliance Tests - Hazards
 * Tests for correct implementation of Section 1.2 (Hindenburg Disaster), Section 8.2 (Hazard Checks), and Section 8.3 (Fire Hazards)
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processHazardCheck, checkHindenburgDisaster } = require('../../../server/actions/hazard');

describe('Rules Compliance - Hazards', () => {

  describe('GAP-031: Hazard check should use challenge type stat', () => {
    it('should compare Speed stat when challenge type is speed', () => {
      const state = createTestGameState();
      state.age = 1;

      // Ship with high speed but low reliability
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 5, reliability: 0, ceiling: 0, range: 3 }
      }];

      // Speed challenge with difficulty 4 - should pass since speed is 5
      state.players['1'].hazardDeck = [{
        id: 'major_speed_0',
        type: 'major_speed',
        category: 'major',
        name: 'Strong Headwind',
        challengeType: 'speed',
        difficulty: 4
      }];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', { shipId: 'ship1' });

      // Should pass because ship speed (5) >= difficulty (4)
      expect(result.newState.players['1'].ships[0].status).toBe('on_route');
    });

    it('should compare Ceiling stat when challenge type is ceiling', () => {
      const state = createTestGameState();
      state.age = 1;

      // Ship with high ceiling
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 5, range: 3 }
      }];

      // Ceiling challenge with difficulty 3 - should pass since ceiling is 5
      state.players['1'].hazardDeck = [{
        id: 'minor_ceiling_0',
        type: 'minor_ceiling',
        category: 'minor',
        name: 'Low Clouds',
        challengeType: 'ceiling',
        difficulty: 3
      }];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', { shipId: 'ship1' });

      // Should pass because ship ceiling (5) >= difficulty (3)
      expect(result.newState.players['1'].ships[0].status).toBe('on_route');
    });

    it('should fail when ship stat is lower than challenge difficulty', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 0; // No engineers to spend

      // Ship with low range
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 0, range: 2 }
      }];

      // Range challenge with difficulty 4 - should fail since range is 2
      state.players['1'].hazardDeck = [{
        id: 'major_range_0',
        type: 'major_range',
        category: 'major',
        name: 'Navigation Error',
        challengeType: 'range',
        difficulty: 4
      }];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', { shipId: 'ship1' });

      // Should fail - ship aborted
      expect(result.newState.players['1'].ships[0].status).toBe('hangar');
    });

    it('should allow engineers to boost check (+1 per Engineer)', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 3; // 3 engineers available

      // Ship with speed 2
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 2, reliability: 0, ceiling: 0, range: 3 }
      }];

      // Speed challenge with difficulty 4 - needs +2 from engineers
      state.players['1'].hazardDeck = [{
        id: 'major_speed_0',
        type: 'major_speed',
        category: 'major',
        name: 'Strong Headwind',
        challengeType: 'speed',
        difficulty: 4
      }];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      // Spend 2 engineers to pass (speed 2 + 2 engineers = 4 >= difficulty 4)
      const result = processHazardCheck(state, '1', { shipId: 'ship1', engineersToSpend: 2 });

      // Should pass with engineer help
      expect(result.newState.players['1'].ships[0].status).toBe('on_route');
      // Should have spent 2 engineers
      expect(result.newState.players['1'].engineers).toBe(1);
    });
  });

  describe('GAP-037: Fire Hazard Engineer spend mechanic', () => {
    it('should auto-pass fire hazards for Helium ships', () => {
      const state = createTestGameState();
      state.age = 1;

      // Helium ship
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'helium',
        stats: { speed: 1, reliability: 0, ceiling: 0, range: 3 }
      }];

      // Fire hazard - should auto-pass for helium
      state.players['1'].hazardDeck = [{
        id: 'engine_fire_0',
        type: 'engine_fire',
        category: 'fire',
        name: 'Engine Fire',
        hydrogenOnly: true,
        engineerCost: 1
      }];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', { shipId: 'ship1' });

      // Helium ships auto-pass fire hazards
      expect(result.newState.players['1'].ships[0].status).toBe('on_route');
    });

    it('should require 1 Engineer to save from Engine Fire (Damaged outcome)', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 2;

      // Hydrogen ship
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 5, ceiling: 0, range: 3 }
      }];

      // Engine Fire - costs 1 Engineer to save
      state.players['1'].hazardDeck = [{
        id: 'engine_fire_0',
        type: 'engine_fire',
        category: 'fire',
        name: 'Engine Fire',
        hydrogenOnly: true,
        engineerCost: 1
      }];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      // Spend 1 engineer to control fire
      const result = processHazardCheck(state, '1', { shipId: 'ship1', engineersToSpend: 1 });

      // Should be Damaged (not crashed, not on route)
      expect(result.newState.players['1'].ships[0].status).toBe('damaged');
      // Should have spent 1 engineer
      expect(result.newState.players['1'].engineers).toBe(1);
    });

    it('should require 2 Engineers to save from Gas Cell Rupture (Damaged outcome)', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 3;

      // Hydrogen ship
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 5, ceiling: 0, range: 3 }
      }];

      // Gas Cell Rupture - costs 2 Engineers to save
      state.players['1'].hazardDeck = [{
        id: 'gas_cell_rupture_0',
        type: 'gas_cell_rupture',
        category: 'fire',
        name: 'Gas Cell Rupture',
        hydrogenOnly: true,
        engineerCost: 2
      }];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      // Spend 2 engineers to control fire
      const result = processHazardCheck(state, '1', { shipId: 'ship1', engineersToSpend: 2 });

      // Should be Damaged
      expect(result.newState.players['1'].ships[0].status).toBe('damaged');
      // Should have spent 2 engineers
      expect(result.newState.players['1'].engineers).toBe(1);
    });

    it('should Crash if insufficient Engineers for fire hazard', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 1; // Only 1 engineer

      // Hydrogen ship
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 5, ceiling: 0, range: 3 }
      }];

      // Gas Cell Rupture requires 2 Engineers
      state.players['1'].hazardDeck = [{
        id: 'gas_cell_rupture_0',
        type: 'gas_cell_rupture',
        category: 'fire',
        name: 'Gas Cell Rupture',
        hydrogenOnly: true,
        engineerCost: 2
      }];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      // Cannot spend enough engineers - should crash
      const result = processHazardCheck(state, '1', { shipId: 'ship1', engineersToSpend: 1 });

      // Should be destroyed
      expect(result.newState.players['1'].ships[0].status).toBe('destroyed');
    });

    it('should allow Catastrophic Explosion with no save - always crashes', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 10; // Even many engineers won't help

      // Hydrogen ship
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 10, reliability: 10, ceiling: 10, range: 10 }
      }];

      // Catastrophic Explosion - no save
      state.players['1'].hazardDeck = [{
        id: 'catastrophic_explosion_0',
        type: 'catastrophic_explosion',
        category: 'fire',
        name: 'Catastrophic Explosion',
        hydrogenOnly: true,
        noSave: true,
        difficulty: 99
      }];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null,
        luxury: false
      }];

      const result = processHazardCheck(state, '1', { shipId: 'ship1' });

      // Should be destroyed - no save possible
      expect(result.newState.players['1'].ships[0].status).toBe('destroyed');
    });

    it('should auto-pass Clear Weather cards', () => {
      const state = createTestGameState();
      state.age = 1;

      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 0, reliability: 0, ceiling: 0, range: 1 }
      }];

      // Clear Weather - auto pass
      state.players['1'].hazardDeck = [{
        id: 'clear_weather_0',
        type: 'clear_weather',
        category: 'clear',
        name: 'Clear Weather',
        autoPass: true,
        difficulty: 0
      }];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', { shipId: 'ship1' });

      // Should pass automatically
      expect(result.newState.players['1'].ships[0].status).toBe('on_route');
    });
  });

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
