/**
 * Rules Compliance Tests - Hazards
 * Tests for correct implementation of Section 1.2 (Hindenburg Disaster), Section 8.2 (Hazard Checks), and Section 8.3 (Fire Hazards)
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processHazardCheck, checkHindenburgDisaster } = require('../../../server/actions/hazard');

/**
 * Helper to set up pendingLaunch state for hazard tests.
 * Converts old ship/hazardDeck pattern to new pendingLaunch model.
 *
 * processHazardCheck draws from hazardDeck, so we put the hazard card there.
 * processRespondToHazard uses hazardInfo, so we also set that for tests that use it.
 *
 * When a ship is launched:
 * 1. hangarShips is decremented (ship leaves hangar)
 * 2. pendingLaunch is created with ship stats
 * 3. Hazard check determines outcome
 *
 * So this helper decrements hangarShips to simulate the launch step.
 */
function setupPendingLaunch(playerState, ship, hazardCard) {
  // Initialize counters
  playerState.hangarShips = playerState.hangarShips || 0;
  playerState.repairShips = playerState.repairShips || 0;

  // Simulate launch: ship leaves hangar and becomes pendingLaunch
  // Decrement hangar if there are ships (simulates the launch process)
  if (playerState.hangarShips > 0) {
    playerState.hangarShips -= 1;
  }

  playerState.pendingLaunch = {
    routeId: ship.pendingRouteId,
    gasType: ship.gasType,
    stats: ship.stats,
    hazardInfo: {
      card: hazardCard,
      deckEmpty: false,
      // Spread hazard card properties into hazardInfo for processRespondToHazard
      ...hazardCard
    }
  };
  // Put hazard card at top of deck for processHazardCheck (which draws from deck)
  playerState.hazardDeck = [hazardCard];
  playerState.hazardDiscardPile = [];
}

describe('Rules Compliance - Hazards', () => {

  describe('GAP-031: Hazard check should use challenge type stat', () => {
    it('should compare Speed stat when challenge type is speed', () => {
      const state = createTestGameState();
      state.age = 1;

      const hazardCard = {
        id: 'major_speed_0',
        type: 'major_speed',
        category: 'major',
        name: 'Strong Headwind',
        challengeType: 'speed',
        difficulty: 4
      };

      // Ship with high speed but low reliability
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 5, reliability: 0, ceiling: 0, range: 3 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', {});

      // Should pass because ship speed (5) >= difficulty (4)
      // Success: route claimed, pendingLaunch cleared
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.map.routes[0].claimed).toBe('1');
    });

    it('should compare Ceiling stat when challenge type is ceiling', () => {
      const state = createTestGameState();
      state.age = 1;

      const hazardCard = {
        id: 'minor_ceiling_0',
        type: 'minor_ceiling',
        category: 'minor',
        name: 'Low Clouds',
        challengeType: 'ceiling',
        difficulty: 3
      };

      // Ship with high ceiling
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 5, range: 3 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', {});

      // Should pass because ship ceiling (5) >= difficulty (3)
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.map.routes[0].claimed).toBe('1');
    });

    it('should fail when ship stat is lower than challenge difficulty', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 0; // No engineers to spend

      const hazardCard = {
        id: 'major_range_0',
        type: 'major_range',
        category: 'major',
        name: 'Navigation Error',
        challengeType: 'range',
        difficulty: 4
      };

      // Ship with low range
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 0, range: 2 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', {});

      // Should fail - ship aborted, returns to hangar
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.players['1'].hangarShips).toBe(1);
    });

    it('should allow engineers to boost check (+1 per Engineer)', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 3; // 3 engineers available

      const hazardCard = {
        id: 'major_speed_0',
        type: 'major_speed',
        category: 'major',
        name: 'Strong Headwind',
        challengeType: 'speed',
        difficulty: 4
      };

      // Ship with speed 2
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 2, reliability: 0, ceiling: 0, range: 3 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      // Spend 2 engineers to pass (speed 2 + 2 engineers = 4 >= difficulty 4)
      const result = processHazardCheck(state, '1', { engineersToSpend: 2 });

      // Should pass with engineer help
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.map.routes[0].claimed).toBe('1');
      // Should have spent 2 engineers
      expect(result.newState.players['1'].engineers).toBe(1);
    });
  });

  describe('GAP-037: Fire Hazard Engineer spend mechanic', () => {
    it('should auto-pass fire hazards for Helium ships', () => {
      const state = createTestGameState();
      state.age = 1;

      const hazardCard = {
        id: 'engine_fire_0',
        type: 'engine_fire',
        category: 'fire',
        name: 'Engine Fire',
        hydrogenOnly: true,
        engineerCost: 1
      };

      // Helium ship
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'helium',
        stats: { speed: 1, reliability: 0, ceiling: 0, range: 3 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', {});

      // Helium ships auto-pass fire hazards
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.map.routes[0].claimed).toBe('1');
    });

    it('should require 1 Engineer to save from Engine Fire (Damaged outcome)', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 2;

      const hazardCard = {
        id: 'engine_fire_0',
        type: 'engine_fire',
        category: 'fire',
        name: 'Engine Fire',
        hydrogenOnly: true,
        engineerCost: 1
      };

      // Hydrogen ship
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 5, ceiling: 0, range: 3 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      // Spend 1 engineer to control fire
      const result = processHazardCheck(state, '1', { engineersToSpend: 1 });

      // Should be Damaged (ship in repair bay)
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.players['1'].repairShips).toBe(1);
      // Should have spent 1 engineer
      expect(result.newState.players['1'].engineers).toBe(1);
    });

    it('should require 2 Engineers to save from Gas Cell Rupture (Damaged outcome)', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 3;

      const hazardCard = {
        id: 'gas_cell_rupture_0',
        type: 'gas_cell_rupture',
        category: 'fire',
        name: 'Gas Cell Rupture',
        hydrogenOnly: true,
        engineerCost: 2
      };

      // Hydrogen ship
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 5, ceiling: 0, range: 3 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      // Spend 2 engineers to control fire
      const result = processHazardCheck(state, '1', { engineersToSpend: 2 });

      // Should be Damaged (ship in repair bay)
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.players['1'].repairShips).toBe(1);
      // Should have spent 2 engineers
      expect(result.newState.players['1'].engineers).toBe(1);
    });

    it('should Crash if insufficient Engineers for fire hazard', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 1; // Only 1 engineer

      const hazardCard = {
        id: 'gas_cell_rupture_0',
        type: 'gas_cell_rupture',
        category: 'fire',
        name: 'Gas Cell Rupture',
        hydrogenOnly: true,
        engineerCost: 2
      };

      // Hydrogen ship
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 5, ceiling: 0, range: 3 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      // Cannot spend enough engineers - auto-decision to not spend
      const result = processHazardCheck(state, '1', { engineersToSpend: 0 });

      // Should be destroyed
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
    });

    it('should allow Catastrophic Explosion with no save - always crashes', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 10; // Even many engineers won't help

      const hazardCard = {
        id: 'catastrophic_explosion_0',
        type: 'catastrophic_explosion',
        category: 'fire',
        name: 'Catastrophic Explosion',
        hydrogenOnly: true,
        noSave: true,
        difficulty: 99
      };

      // Hydrogen ship
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 10, reliability: 10, ceiling: 10, range: 10 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null,
        luxury: false
      }];

      const result = processHazardCheck(state, '1', {});

      // Should be destroyed - no save possible
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
    });

    it('should auto-pass Clear Weather cards', () => {
      const state = createTestGameState();
      state.age = 1;

      const hazardCard = {
        id: 'clear_weather_0',
        type: 'clear_weather',
        category: 'clear',
        name: 'Clear Weather',
        autoPass: true,
        difficulty: 0
      };

      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 0, reliability: 0, ceiling: 0, range: 1 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', {});

      // Should pass automatically
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.map.routes[0].claimed).toBe('1');
    });
  });

  describe('GAP-016: Hindenburg Disaster game end condition', () => {
    it('should trigger Hindenburg Disaster on Catastrophic Explosion in Age III Luxury Launch with Hydrogen', () => {
      const state = createTestGameState();
      state.age = 3; // Age III

      const hazardCard = {
        type: 'catastrophic_explosion',
        category: 'fire',
        hydrogenOnly: true,
        noSave: true,
        difficulty: 99, // Impossible to pass
        name: 'Catastrophic Explosion'
      };

      // Set up a ship on a Luxury route using Hydrogen
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'luxury_route',
        gasType: 'hydrogen',
        stats: { reliability: 2 }
      }, hazardCard);

      // The route is a Luxury route
      state.map.routes = [{
        id: 'luxury_route',
        luxury: true,
        distance: 5,
        income: 10
      }];

      const result = processHazardCheck(state, '1', {});

      // Game should be flagged for ending (Hindenburg Disaster)
      expect(result.newState.hindenburgDisaster).toBe(true);
      expect(result.newState.gameEndReason).toBe('hindenburg_disaster');
    });

    it('should NOT trigger Hindenburg Disaster in Age I or II', () => {
      const state = createTestGameState();
      state.age = 2; // Age II - NOT Age III

      const hazardCard = {
        type: 'catastrophic_explosion',
        category: 'fire',
        hydrogenOnly: true,
        noSave: true,
        difficulty: 99
      };

      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'luxury_route',
        gasType: 'hydrogen',
        stats: { reliability: 0 }
      }, hazardCard);

      state.map.routes = [{
        id: 'luxury_route',
        luxury: true,
        distance: 5
      }];

      const result = processHazardCheck(state, '1', {});

      // Should NOT trigger Hindenburg in Age II
      expect(result.newState.hindenburgDisaster).toBeFalsy();
    });

    it('should NOT trigger Hindenburg Disaster with Helium', () => {
      const state = createTestGameState();
      state.age = 3;

      const hazardCard = {
        type: 'catastrophic_explosion',
        category: 'fire',
        hydrogenOnly: true,
        noSave: true,
        difficulty: 99
      };

      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'luxury_route',
        gasType: 'helium', // HELIUM - safe gas
        stats: { reliability: 0 }
      }, hazardCard);

      state.map.routes = [{
        id: 'luxury_route',
        luxury: true,
        distance: 5
      }];

      const result = processHazardCheck(state, '1', {});

      // Helium ships don't trigger Hindenburg (fire hazards auto-pass)
      expect(result.newState.hindenburgDisaster).toBeFalsy();
    });

    it('should NOT trigger Hindenburg Disaster on non-Luxury routes', () => {
      const state = createTestGameState();
      state.age = 3;

      const hazardCard = {
        type: 'catastrophic_explosion',
        category: 'fire',
        hydrogenOnly: true,
        noSave: true,
        difficulty: 99
      };

      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'normal_route',
        gasType: 'hydrogen',
        stats: { reliability: 0 }
      }, hazardCard);

      state.map.routes = [{
        id: 'normal_route',
        luxury: false, // NOT a luxury route
        distance: 3
      }];

      const result = processHazardCheck(state, '1', {});

      // Non-luxury route shouldn't trigger Hindenburg
      expect(result.newState.hindenburgDisaster).toBeFalsy();
    });

    it('should NOT trigger Hindenburg on regular hazards that fail', () => {
      const state = createTestGameState();
      state.age = 3;
      state.players['1'].engineers = 0;

      const hazardCard = {
        type: 'strong_headwind',
        challengeType: 'speed',
        difficulty: 10
      };

      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'luxury_route',
        gasType: 'hydrogen',
        stats: { speed: 0, reliability: 0 }
      }, hazardCard);

      state.map.routes = [{
        id: 'luxury_route',
        luxury: true,
        distance: 5
      }];

      const result = processHazardCheck(state, '1', {});

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

      const hazardCard = {
        type: 'catastrophic_explosion',
        category: 'fire',
        hydrogenOnly: true,
        noSave: true,
        difficulty: 99,
        name: 'Catastrophic Explosion'
      };

      // Set up a ship on a Luxury route using Hydrogen
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'luxury_route',
        gasType: 'hydrogen',
        stats: { reliability: 2 }
      }, hazardCard);

      // The route is a Luxury route
      state.map.routes = [{
        id: 'luxury_route',
        luxury: true,
        vp: 5,
        income: 10
      }];

      const result = processHazardCheck(state, '1', {});

      // Game should be flagged for ending (Hindenburg Disaster)
      expect(result.newState.hindenburgDisaster).toBe(true);

      // Triggering player should gain 3 VP per Section 14.5
      expect(result.newState.players['1'].vp).toBe(3);
    });

    it('should log the 3 VP award in game log', () => {
      const state = createTestGameState();
      state.age = 3;
      state.players['1'].vp = 5; // Existing VP

      const hazardCard = {
        type: 'catastrophic_explosion',
        category: 'fire',
        hydrogenOnly: true,
        noSave: true,
        difficulty: 99,
        name: 'Catastrophic Explosion'
      };

      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'luxury_route',
        gasType: 'hydrogen',
        stats: { reliability: 2 }
      }, hazardCard);

      state.map.routes = [{
        id: 'luxury_route',
        luxury: true,
        vp: 5,
        income: 10
      }];

      const result = processHazardCheck(state, '1', {});

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

      const hazardCard = {
        id: 'gas_cell_rupture_0',
        type: 'gas_cell_rupture',
        category: 'fire',
        name: 'Gas Cell Rupture',
        hydrogenOnly: true,
        engineerCost: 2
      };

      // Hydrogen ship
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 0, range: 3 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', { engineersToSpend: 0 });

      // Ship should be recovered to hangar (not destroyed) due to insurance
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.players['1'].hangarShips).toBe(1);
      // Insurance policy should be consumed
      expect(result.newState.players['1'].insurance).toBe(1);
    });

    it('should NOT use insurance for Catastrophic Explosion (no save possible)', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].insurance = 3; // Has full insurance

      const hazardCard = {
        id: 'catastrophic_explosion_0',
        type: 'catastrophic_explosion',
        category: 'fire',
        name: 'Catastrophic Explosion',
        hydrogenOnly: true,
        noSave: true
      };

      // Hydrogen ship
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 10, reliability: 10, ceiling: 10, range: 10 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null,
        luxury: false
      }];

      const result = processHazardCheck(state, '1', {});

      // Ship should be destroyed - insurance doesn't help with catastrophic explosion
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      // Insurance should NOT be consumed
      expect(result.newState.players['1'].insurance).toBe(3);
    });

    it('should use insurance for Static Discharge failure', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 0;
      state.players['1'].insurance = 1;

      const hazardCard = {
        id: 'static_discharge_0',
        type: 'static_discharge',
        category: 'fire',
        name: 'Static Discharge',
        hydrogenOnly: true,
        difficulty: 4
      };

      // Hydrogen ship with low reliability
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 0, range: 3 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      // No conductive covering, will fail the check
      state.players['1'].blueprint.fabricSlots = [];

      const result = processHazardCheck(state, '1', {});

      // Ship should be recovered to hangar due to insurance
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.players['1'].hangarShips).toBe(1);
      // Insurance should be consumed
      expect(result.newState.players['1'].insurance).toBe(0);
    });

    it('should NOT recover ship if no insurance policies available', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 0;
      state.players['1'].insurance = 0; // No insurance

      const hazardCard = {
        id: 'gas_cell_rupture_0',
        type: 'gas_cell_rupture',
        category: 'fire',
        name: 'Gas Cell Rupture',
        hydrogenOnly: true,
        engineerCost: 2
      };

      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 0, range: 3 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', { engineersToSpend: 0 });

      // Ship should be destroyed - no insurance to save it
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
    });
  });

  describe('GAP-046: Fire-Resistant Fabric special effect', () => {
    it('should auto-pass first fire hazard per age if player has Fire-Resistant Fabric', () => {
      const state = createTestGameState();
      state.age = 2;

      const hazardCard = {
        id: 'engine_fire_0',
        type: 'engine_fire',
        category: 'fire',
        name: 'Engine Fire',
        hydrogenOnly: true,
        engineerCost: 1
      };

      // Hydrogen ship - would normally fail fire hazard
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 0, range: 3 }
      }, hazardCard);
      state.players['1'].engineers = 0; // No engineers to spend

      // Fire-Resistant Fabric installed
      state.players['1'].blueprint.fabricSlots = ['fire_resistant_fabric'];
      state.players['1'].fireProtectionUsedThisAge = false;

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', {});

      // Should auto-pass due to Fire-Resistant Fabric
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.map.routes[0].claimed).toBe('1');
      // Should mark protection as used this age
      expect(result.newState.players['1'].fireProtectionUsedThisAge).toBe(true);
    });

    it('should NOT auto-pass second fire hazard in same age with Fire-Resistant Fabric', () => {
      const state = createTestGameState();
      state.age = 2;

      const hazardCard = {
        id: 'engine_fire_0',
        type: 'engine_fire',
        category: 'fire',
        name: 'Engine Fire',
        hydrogenOnly: true,
        engineerCost: 1
      };

      // Hydrogen ship
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 0, range: 3 }
      }, hazardCard);
      state.players['1'].engineers = 0; // No engineers to spend

      // Fire-Resistant Fabric installed but already used this age
      state.players['1'].blueprint.fabricSlots = ['fire_resistant_fabric'];
      state.players['1'].fireProtectionUsedThisAge = true;

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', { engineersToSpend: 0 });

      // Should NOT auto-pass - protection already used, ship destroyed
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
    });

    it('should reset fireProtectionUsedThisAge at age transition', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].fireProtectionUsedThisAge = true;

      // Use the age transition helpers to test reset
      // performAgeTransition starts the transition (enters Blueprint Design phase)
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

      const hazardCard = {
        id: 'static_discharge_0',
        type: 'static_discharge',
        category: 'fire',
        name: 'Static Discharge',
        hydrogenOnly: true,
        difficulty: 4
      };

      // Hydrogen ship
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 0, range: 3 }
      }, hazardCard);
      state.players['1'].engineers = 0;

      // Conductive Covering installed
      state.players['1'].blueprint.fabricSlots = ['conductive_covering'];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', {});

      // Should auto-pass due to Conductive Covering
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.map.routes[0].claimed).toBe('1');
    });
  });

  describe('GAP-064: Italy Articulated Keel -1 Reliability penalty during Weather hazards', () => {
    it('should apply -1 Reliability penalty for weather hazards when flexible_frame is installed', () => {
      const state = createTestGameState();
      state.age = 1;

      const hazardCard = {
        id: 'squall_line_0',
        type: 'major_reliability',
        category: 'major',
        name: 'Squall Line',
        challengeType: 'reliability',
        hazardType: 'weather',
        difficulty: 4
      };

      // Ship with Reliability 4 - enough to pass Difficulty 4 normally
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 4, ceiling: 0, range: 3 }
      }, hazardCard);
      state.players['1'].engineers = 0; // No engineers to boost

      // Flexible Frame (Articulated Keel) installed - should apply -1 penalty
      state.players['1'].blueprint.frameSlots = ['flexible_frame'];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', {});

      // Should FAIL due to -1 penalty (4 - 1 = 3 < 4)
      // Ship returns to hangar (aborted)
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.players['1'].hangarShips).toBe(1);
    });

    it('should NOT apply penalty for non-weather hazards (mechanical, etc.)', () => {
      const state = createTestGameState();
      state.age = 1;

      const hazardCard = {
        id: 'structural_damage_0',
        type: 'major_reliability',
        category: 'major',
        name: 'Structural Damage',
        challengeType: 'reliability',
        hazardType: 'mechanical', // NOT weather
        difficulty: 4
      };

      // Ship with Reliability 4 - exactly meets Difficulty 4
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 4, ceiling: 0, range: 3 }
      }, hazardCard);
      state.players['1'].engineers = 0;

      // Flexible Frame installed
      state.players['1'].blueprint.frameSlots = ['flexible_frame'];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', {});

      // Should PASS - no penalty for mechanical hazards (4 >= 4)
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.map.routes[0].claimed).toBe('1');
    });

    it('should pass weather hazard if Reliability is high enough after penalty', () => {
      const state = createTestGameState();
      state.age = 1;

      const hazardCard = {
        id: 'storm_system_0',
        type: 'major_speed',
        category: 'major',
        name: 'Storm System',
        challengeType: 'reliability',
        hazardType: 'weather',
        difficulty: 4
      };

      // Ship with Reliability 5 - after -1 penalty, still 4 which passes Difficulty 4
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 5, ceiling: 0, range: 3 }
      }, hazardCard);
      state.players['1'].engineers = 0;

      // Flexible Frame installed
      state.players['1'].blueprint.frameSlots = ['flexible_frame'];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', {});

      // Should PASS (5 - 1 = 4 >= 4)
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.map.routes[0].claimed).toBe('1');
    });
  });

  describe('GAP-075: Rapid Descent System auto-pass Weather hazards', () => {
    it('should auto-pass Weather-type hazards when rapid_descent_system is installed', () => {
      const state = createTestGameState();
      state.age = 3;

      const hazardCard = {
        id: 'squall_line_0',
        type: 'major_reliability',
        category: 'major',
        name: 'Squall Line',
        challengeType: 'reliability',
        hazardType: 'weather',
        difficulty: 4
      };

      // Ship with low reliability (would fail Difficulty 4 weather check)
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 1, ceiling: 0, range: 3 }
      }, hazardCard);
      state.players['1'].engineers = 0; // No engineers to boost

      // Rapid Descent System installed in componentSlots
      state.players['1'].blueprint.componentSlots = ['rapid_descent_system'];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', {});

      // Should AUTO-PASS due to Rapid Descent System
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.map.routes[0].claimed).toBe('1');
    });

    it('should NOT auto-pass non-weather hazards with rapid_descent_system', () => {
      const state = createTestGameState();
      state.age = 3;

      const hazardCard = {
        id: 'structural_damage_0',
        type: 'major_reliability',
        category: 'major',
        name: 'Structural Damage',
        challengeType: 'reliability',
        hazardType: 'mechanical',
        difficulty: 4
      };

      // Ship with low reliability
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 1, ceiling: 0, range: 3 }
      }, hazardCard);
      state.players['1'].engineers = 0;

      // Rapid Descent System installed
      state.players['1'].blueprint.componentSlots = ['rapid_descent_system'];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', {});

      // Should FAIL - Rapid Descent System only works on weather hazards
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.players['1'].hangarShips).toBe(1);
    });

    it('should NOT auto-pass fire hazards with rapid_descent_system', () => {
      const state = createTestGameState();
      state.age = 3;
      state.players['1'].engineers = 0;
      state.players['1'].insurance = 0;

      const hazardCard = {
        id: 'engine_fire_0',
        type: 'engine_fire',
        category: 'fire',
        name: 'Engine Fire',
        hydrogenOnly: true,
        engineerCost: 1
      };

      // Hydrogen ship
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 1, ceiling: 0, range: 3 }
      }, hazardCard);

      // Rapid Descent System installed
      state.players['1'].blueprint.componentSlots = ['rapid_descent_system'];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', { engineersToSpend: 0 });

      // Should CRASH - Rapid Descent System doesn't help with fire hazards
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
    });
  });

  describe('Critical Structural Stress (Mechanical Hazard)', () => {
    it('should allow spending 2 Engineers to save ship (Damaged outcome)', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 3;
      state.players['1'].hangarShips = 1;

      const hazardCard = {
        id: 'critical_structural_stress_0',
        type: 'critical_structural_stress',
        category: 'mechanical',
        name: 'Critical Structural Stress',
        engineerCost: 2,
        flak: 4
      };

      // Hydrogen ship (mechanical hazards affect all ships, not just hydrogen)
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 1, ceiling: 0, range: 3 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      // Spend 2 engineers to control structural damage
      const result = processHazardCheck(state, '1', { engineersToSpend: 2 });

      // Should be Damaged (ship in repair bay)
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.players['1'].repairShips).toBe(1);
      // Should have spent 2 engineers
      expect(result.newState.players['1'].engineers).toBe(1);
    });

    it('should Crash if insufficient Engineers for Critical Structural Stress', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 1; // Only 1 engineer, need 2
      state.players['1'].insurance = 0;

      const hazardCard = {
        id: 'critical_structural_stress_0',
        type: 'critical_structural_stress',
        category: 'mechanical',
        name: 'Critical Structural Stress',
        engineerCost: 2,
        flak: 4
      };

      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 1, ceiling: 0, range: 3 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      // Try to spend 1 engineer but need 2
      const result = processHazardCheck(state, '1', { engineersToSpend: 1 });

      // Should Crash - insufficient engineers
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      // Ship destroyed, not in repair bay
      expect(result.newState.players['1'].repairShips).toBe(0);
    });

    it('should affect Helium ships (mechanical hazards are not hydrogen-only)', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 0;
      state.players['1'].insurance = 0;

      const hazardCard = {
        id: 'critical_structural_stress_0',
        type: 'critical_structural_stress',
        category: 'mechanical',
        name: 'Critical Structural Stress',
        engineerCost: 2,
        flak: 4
      };

      // Helium ship - mechanical hazards still apply
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'helium',
        stats: { speed: 1, reliability: 1, ceiling: 0, range: 3 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', { engineersToSpend: 0 });

      // Helium ships are NOT immune to mechanical hazards (unlike fire)
      // Should Crash - no engineers to spend
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
    });
  });

  describe('Squall Line Payload Slot Modifier', () => {
    it('should apply +1 Difficulty for ships with 3+ Payload slots', () => {
      const state = createTestGameState();
      state.age = 3; // Age III has 4 payload slots
      state.players['1'].engineers = 0;

      const hazardCard = {
        id: 'squall_line_0',
        type: 'major_reliability',
        category: 'major',
        name: 'Squall Line',
        challengeType: 'reliability',
        hazardType: 'weather',
        difficulty: 4,
        payloadSlotModifier: { threshold: 3, difficultyIncrease: 1 }
      };

      // Ship with reliability 4 would normally pass (4 >= 4)
      // But with 3+ payload slots, difficulty becomes 5, so ship fails (4 < 5)
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 4, ceiling: 0, range: 3 }
      }, hazardCard);

      // Set up 3 payload slots (componentSlots)
      state.players['1'].blueprint.componentSlots = ['cargo_nets', 'passenger_gondola', 'mail_compartment'];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', {});

      // Should FAIL - reliability 4 < modified difficulty 5
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.players['1'].hangarShips).toBe(1); // Ship aborted
      expect(result.newState.map.routes[0].claimed).toBeNull();
    });

    it('should NOT apply +1 Difficulty for ships with fewer than 3 Payload slots', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 0;

      const hazardCard = {
        id: 'squall_line_0',
        type: 'major_reliability',
        category: 'major',
        name: 'Squall Line',
        challengeType: 'reliability',
        hazardType: 'weather',
        difficulty: 4,
        payloadSlotModifier: { threshold: 3, difficultyIncrease: 1 }
      };

      // Ship with reliability 4 passes normal difficulty (4 >= 4)
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 4, ceiling: 0, range: 3 }
      }, hazardCard);

      // Only 2 payload slots
      state.players['1'].blueprint.componentSlots = ['cargo_nets', 'passenger_gondola'];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', {});

      // Should PASS - reliability 4 >= difficulty 4 (no modifier)
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.map.routes[0].claimed).toBe('1');
    });
  });

  describe('Icing Conditions Gas Loss on Failure', () => {
    it('should lose 1 gas cube on failure from Icing Conditions', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 0;
      state.players['1'].gasCubes = { hydrogen: 2, helium: 0 };

      const hazardCard = {
        id: 'icing_conditions_0',
        type: 'major_ceiling',
        category: 'major',
        name: 'Icing Conditions',
        challengeType: 'ceiling',
        hazardType: 'weather',
        difficulty: 3,
        gasLossOnFailure: 1
      };

      // Ship with ceiling 2 fails (2 < 3)
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 2, range: 3 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', {});

      // Should fail and lose 1 gas cube
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.players['1'].hangarShips).toBe(1); // Ship aborted
      expect(result.newState.players['1'].gasCubes.hydrogen).toBe(1); // Lost 1 cube
    });

    it('should lose 2 gas cubes on failure from Severe Icing', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 0;
      state.players['1'].gasCubes = { hydrogen: 3, helium: 0 };

      const hazardCard = {
        id: 'severe_icing_0',
        type: 'major_ceiling',
        category: 'major',
        name: 'Severe Icing',
        challengeType: 'ceiling',
        hazardType: 'weather',
        difficulty: 2,
        gasLossOnFailure: 2
      };

      // Ship with ceiling 1 fails (1 < 2)
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 1, range: 3 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', {});

      // Should fail and lose 2 gas cubes
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.players['1'].hangarShips).toBe(1); // Ship aborted
      expect(result.newState.players['1'].gasCubes.hydrogen).toBe(1); // Lost 2 cubes
    });

    it('should destroy ship if gas loss leaves no gas remaining', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 0;
      state.players['1'].insurance = 0;
      state.players['1'].gasCubes = { hydrogen: 1, helium: 0 };

      const hazardCard = {
        id: 'severe_icing_0',
        type: 'major_ceiling',
        category: 'major',
        name: 'Severe Icing',
        challengeType: 'ceiling',
        hazardType: 'weather',
        difficulty: 2,
        gasLossOnFailure: 2
      };

      // Ship with ceiling 1 fails (1 < 2)
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 1, range: 3 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', {});

      // Should destroy ship - only had 1 gas, needed to lose 2
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      // Ship destroyed (not in hangar or repair)
      expect(result.newState.players['1'].hangarShips).toBe(0);
      expect(result.newState.players['1'].repairShips).toBe(0);
    });

    it('should NOT lose gas on successful hazard check', () => {
      const state = createTestGameState();
      state.age = 1;
      state.players['1'].engineers = 0;
      state.players['1'].gasCubes = { hydrogen: 2, helium: 0 };

      const hazardCard = {
        id: 'icing_conditions_0',
        type: 'major_ceiling',
        category: 'major',
        name: 'Icing Conditions',
        challengeType: 'ceiling',
        hazardType: 'weather',
        difficulty: 3,
        gasLossOnFailure: 1
      };

      // Ship with ceiling 3 passes (3 >= 3)
      setupPendingLaunch(state.players['1'], {
        pendingRouteId: 'route_1',
        gasType: 'hydrogen',
        stats: { speed: 1, reliability: 0, ceiling: 3, range: 3 }
      }, hazardCard);

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        income: 2,
        claimed: null
      }];

      const result = processHazardCheck(state, '1', {});

      // Should pass - no gas loss
      expect(result.newState.players['1'].pendingLaunch).toBeUndefined();
      expect(result.newState.map.routes[0].claimed).toBe('1');
      expect(result.newState.players['1'].gasCubes.hydrogen).toBe(2); // No loss
    });
  });
});
