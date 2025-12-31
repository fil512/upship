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

  describe('GAP-052: Hindenburg Disaster grants 3 VP to triggering player', () => {
    it('should award 3 VP to the triggering player per Section 14.5', () => {
      const state = createTestGameState();
      state.age = 3; // Age III

      // Player starts with 0 VP
      state.players['1'].vp = 0;

      // Set up a ship on a Luxury route using Hydrogen
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'luxury_route',
        gasType: 'hydrogen',
        stats: { reliability: 2 }
      }];

      // Set up hazard deck with Catastrophic Explosion
      state.players['1'].hazardDeck = [{
        type: 'catastrophic_explosion',
        category: 'fire',
        hydrogenOnly: true,
        noSave: true,
        difficulty: 99,
        name: 'Catastrophic Explosion'
      }];

      // The route is a Luxury route
      state.map.routes = [{
        id: 'luxury_route',
        luxury: true,
        vp: 5,
        income: 10
      }];

      const result = processHazardCheck(state, '1', { shipId: 'ship1' });

      // Game should be flagged for ending (Hindenburg Disaster)
      expect(result.newState.hindenburgDisaster).toBe(true);

      // Triggering player should gain 3 VP per Section 14.5
      expect(result.newState.players['1'].vp).toBe(3);
    });

    it('should log the 3 VP award in game log', () => {
      const state = createTestGameState();
      state.age = 3;
      state.players['1'].vp = 5; // Existing VP

      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'luxury_route',
        gasType: 'hydrogen',
        stats: { reliability: 2 }
      }];

      state.players['1'].hazardDeck = [{
        type: 'catastrophic_explosion',
        category: 'fire',
        hydrogenOnly: true,
        noSave: true,
        difficulty: 99,
        name: 'Catastrophic Explosion'
      }];

      state.map.routes = [{
        id: 'luxury_route',
        luxury: true,
        vp: 5,
        income: 10
      }];

      const result = processHazardCheck(state, '1', { shipId: 'ship1' });

      // VP should be added to existing (5 + 3 = 8)
      expect(result.newState.players['1'].vp).toBe(8);

      // Check log contains VP award message
      const vpLogEntry = result.newState.log.find(entry =>
        entry.message && entry.message.includes('3 VP')
      );
      expect(vpLogEntry).toBeDefined();
    });
  });

  describe('GAP-051: Insurance policy usage on ship crash', () => {
    it('should use insurance policy to recover ship to hangar when fire hazard causes crash', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 0; // No engineers to spend
      state.players['1'].insurance = 2; // Has 2 insurance policies

      // Hydrogen ship
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 0, range: 3 }
      }];

      // Gas Cell Rupture requires 2 Engineers - will crash without them
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

      const result = processHazardCheck(state, '1', { shipId: 'ship1', engineersToSpend: 0 });

      // Ship should be recovered to hangar (not destroyed) due to insurance
      expect(result.newState.players['1'].ships[0].status).toBe('hangar');
      // Insurance policy should be consumed
      expect(result.newState.players['1'].insurance).toBe(1);
    });

    it('should NOT use insurance for Catastrophic Explosion (no save possible)', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].insurance = 3; // Has full insurance

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
        noSave: true
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

      // Ship should be destroyed - insurance doesn't help with catastrophic explosion
      expect(result.newState.players['1'].ships[0].status).toBe('destroyed');
      // Insurance should NOT be consumed
      expect(result.newState.players['1'].insurance).toBe(3);
    });

    it('should use insurance for Static Discharge failure', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 0;
      state.players['1'].insurance = 1;

      // Hydrogen ship with low reliability
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 0, range: 3 }
      }];

      // Static Discharge - Difficulty 4 Reliability check
      state.players['1'].hazardDeck = [{
        id: 'static_discharge_0',
        type: 'static_discharge',
        category: 'fire',
        name: 'Static Discharge',
        hydrogenOnly: true,
        difficulty: 4
      }];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      // No conductive covering, will fail the check
      state.players['1'].blueprint.fabricSlots = [];

      const result = processHazardCheck(state, '1', { shipId: 'ship1' });

      // Ship should be recovered to hangar due to insurance
      expect(result.newState.players['1'].ships[0].status).toBe('hangar');
      // Insurance should be consumed
      expect(result.newState.players['1'].insurance).toBe(0);
    });

    it('should NOT recover ship if no insurance policies available', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 0;
      state.players['1'].insurance = 0; // No insurance

      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 0, range: 3 }
      }];

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

      const result = processHazardCheck(state, '1', { shipId: 'ship1', engineersToSpend: 0 });

      // Ship should be destroyed - no insurance to save it
      expect(result.newState.players['1'].ships[0].status).toBe('destroyed');
    });
  });

  describe('GAP-046: Fire-Resistant Fabric special effect', () => {
    it('should auto-pass first fire hazard per age if player has Fire-Resistant Fabric', () => {
      const state = createTestGameState();
      state.age = 2;

      // Hydrogen ship - would normally fail fire hazard
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 0, range: 3 }
      }];
      state.players['1'].engineers = 0; // No engineers to spend

      // Fire-Resistant Fabric installed
      state.players['1'].blueprint.fabricSlots = ['fire_resistant_fabric'];
      state.players['1'].fireProtectionUsedThisAge = false;

      // Engine Fire - would normally require 1 Engineer
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

      // Should auto-pass due to Fire-Resistant Fabric
      expect(result.newState.players['1'].ships[0].status).toBe('on_route');
      // Should mark protection as used this age
      expect(result.newState.players['1'].fireProtectionUsedThisAge).toBe(true);
    });

    it('should NOT auto-pass second fire hazard in same age with Fire-Resistant Fabric', () => {
      const state = createTestGameState();
      state.age = 2;

      // Hydrogen ship
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 0, range: 3 }
      }];
      state.players['1'].engineers = 0; // No engineers to spend

      // Fire-Resistant Fabric installed but already used this age
      state.players['1'].blueprint.fabricSlots = ['fire_resistant_fabric'];
      state.players['1'].fireProtectionUsedThisAge = true;

      // Engine Fire - would normally require 1 Engineer
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

      // Should NOT auto-pass - protection already used
      expect(result.newState.players['1'].ships[0].status).toBe('destroyed');
    });

    it('should reset fireProtectionUsedThisAge at age transition', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].fireProtectionUsedThisAge = true;

      // Use the age transition helpers to test reset
      // performAgeTransition starts the transition (enters Design Bureau phase)
      // completeAgeTransition finishes it (applies resets and faction flaws)
      const { performAgeTransition, completeAgeTransition } = require('../../../server/actions/helpers/ageTransition');
      performAgeTransition(state, 2);
      completeAgeTransition(state);

      // Should reset for next age
      expect(state.players['1'].fireProtectionUsedThisAge).toBe(false);
    });
  });

  describe('GAP-045: Conductive Covering static discharge immunity', () => {
    it('should auto-pass Static Discharge with Conductive Covering', () => {
      const state = createTestGameState();
      state.age = 1;

      // Hydrogen ship
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 0, range: 3 }
      }];
      state.players['1'].engineers = 0;

      // Conductive Covering installed
      state.players['1'].blueprint.fabricSlots = ['conductive_covering'];

      // Static Discharge hazard
      state.players['1'].hazardDeck = [{
        id: 'static_discharge_0',
        type: 'static_discharge',
        category: 'fire',
        name: 'Static Discharge',
        hydrogenOnly: true,
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

      // Should auto-pass due to Conductive Covering
      expect(result.newState.players['1'].ships[0].status).toBe('on_route');
    });
  });

  describe('GAP-064: Italy Articulated Keel -1 Reliability penalty during Weather hazards', () => {
    it('should apply -1 Reliability penalty for weather hazards when flexible_frame is installed', () => {
      const state = createTestGameState();
      state.age = 1;

      // Ship with Reliability 4 - enough to pass Difficulty 4 normally
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 4, ceiling: 0, range: 3 }
      }];
      state.players['1'].engineers = 0; // No engineers to boost

      // Flexible Frame (Articulated Keel) installed - should apply -1 penalty
      state.players['1'].blueprint.frameSlots = ['flexible_frame'];

      // Weather hazard (Reliability check, Difficulty 4)
      // With Reliability 4 and -1 penalty, effective is 3 which fails Difficulty 4
      state.players['1'].hazardDeck = [{
        id: 'squall_line_0',
        type: 'major_reliability',
        category: 'major',
        name: 'Squall Line',
        challengeType: 'reliability',
        hazardType: 'weather',
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

      // Should FAIL due to -1 penalty (4 - 1 = 3 < 4)
      // Ship returns to hangar (aborted)
      expect(result.newState.players['1'].ships[0].status).toBe('hangar');
    });

    it('should NOT apply penalty for non-weather hazards (mechanical, etc.)', () => {
      const state = createTestGameState();
      state.age = 1;

      // Ship with Reliability 4 - exactly meets Difficulty 4
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 4, ceiling: 0, range: 3 }
      }];
      state.players['1'].engineers = 0;

      // Flexible Frame installed
      state.players['1'].blueprint.frameSlots = ['flexible_frame'];

      // MECHANICAL hazard (not weather) - penalty should NOT apply
      state.players['1'].hazardDeck = [{
        id: 'structural_damage_0',
        type: 'major_reliability',
        category: 'major',
        name: 'Structural Damage',
        challengeType: 'reliability',
        hazardType: 'mechanical', // NOT weather
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

      // Should PASS - no penalty for mechanical hazards (4 >= 4)
      expect(result.newState.players['1'].ships[0].status).toBe('on_route');
    });

    it('should pass weather hazard if Reliability is high enough after penalty', () => {
      const state = createTestGameState();
      state.age = 1;

      // Ship with Reliability 5 - after -1 penalty, still 4 which passes Difficulty 4
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 5, ceiling: 0, range: 3 }
      }];
      state.players['1'].engineers = 0;

      // Flexible Frame installed
      state.players['1'].blueprint.frameSlots = ['flexible_frame'];

      // Weather hazard (Difficulty 4)
      state.players['1'].hazardDeck = [{
        id: 'storm_system_0',
        type: 'major_speed',
        category: 'major',
        name: 'Storm System',
        challengeType: 'reliability',
        hazardType: 'weather',
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

      // Should PASS (5 - 1 = 4 >= 4)
      expect(result.newState.players['1'].ships[0].status).toBe('on_route');
    });
  });

  describe('GAP-075: Rapid Descent System auto-pass Weather hazards', () => {
    it('should auto-pass Weather-type hazards when rapid_descent_system is installed', () => {
      const state = createTestGameState();
      state.age = 3;

      // Ship with low reliability (would fail Difficulty 4 weather check)
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 1, ceiling: 0, range: 3 }
      }];
      state.players['1'].engineers = 0; // No engineers to boost

      // Rapid Descent System installed in componentSlots
      state.players['1'].blueprint.componentSlots = ['rapid_descent_system'];

      // Weather hazard (Difficulty 4) - would normally fail
      state.players['1'].hazardDeck = [{
        id: 'squall_line_0',
        type: 'major_reliability',
        category: 'major',
        name: 'Squall Line',
        challengeType: 'reliability',
        hazardType: 'weather',
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

      // Should AUTO-PASS due to Rapid Descent System
      expect(result.newState.players['1'].ships[0].status).toBe('on_route');
    });

    it('should NOT auto-pass non-weather hazards with rapid_descent_system', () => {
      const state = createTestGameState();
      state.age = 3;

      // Ship with low reliability
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 1, ceiling: 0, range: 3 }
      }];
      state.players['1'].engineers = 0;

      // Rapid Descent System installed
      state.players['1'].blueprint.componentSlots = ['rapid_descent_system'];

      // MECHANICAL hazard (not weather) - should NOT auto-pass
      state.players['1'].hazardDeck = [{
        id: 'structural_damage_0',
        type: 'major_reliability',
        category: 'major',
        name: 'Structural Damage',
        challengeType: 'reliability',
        hazardType: 'mechanical',
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

      // Should FAIL - Rapid Descent System only works on weather hazards
      expect(result.newState.players['1'].ships[0].status).toBe('hangar');
    });

    it('should NOT auto-pass fire hazards with rapid_descent_system', () => {
      const state = createTestGameState();
      state.age = 3;
      state.players['1'].engineers = 0;
      state.players['1'].insurance = 0;

      // Hydrogen ship
      state.players['1'].ships = [{
        id: 'ship1',
        status: 'awaiting_hazard',
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 1, ceiling: 0, range: 3 }
      }];

      // Rapid Descent System installed
      state.players['1'].blueprint.componentSlots = ['rapid_descent_system'];

      // Fire hazard - should NOT auto-pass
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

      // Should CRASH - Rapid Descent System doesn't help with fire hazards
      expect(result.newState.players['1'].ships[0].status).toBe('destroyed');
    });
  });
});
