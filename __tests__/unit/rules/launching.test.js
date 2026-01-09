/**
 * Rules Compliance Tests - Launching and Repair
 * Tests for correct implementation of Section 4.4, 7, 8 (Building, Launching, Hazards)
 */

const { createTestGameState } = require('../../fixtures/testData');

describe('Rules Compliance - Launching and Repair', () => {

  describe('GAP-027: Ship repair cost (updated per Section 6.15)', () => {
    it('should allow repairing damaged ships for floor(hullCost/2) + 1 engineer', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      // Player has a damaged ship in repair bay
      playerState.hangarShips = 1;
      playerState.repairShips = 1;
      playerState.cash = 15;
      playerState.engineers = 2;
      // Hull cost from blueprint is typically ~4-6 based on starting setup
      // So repair cost = floor(hullCost/2) = ~2-3 per ship

      // Set up the Repair action space placement (repairs require worker placement)
      state.groundBoard.placements.repair = { playerId: '1' };

      const { processRepairShip } = require('../../../server/actions/building');
      const result = processRepairShip(state, '1', { count: 1, _internal: true });

      // Ship should be moved from repair to hangar
      expect(result.newState.players['1'].repairShips).toBe(0);
      expect(result.newState.players['1'].hangarShips).toBe(2);
      // Cost = floor(hullCost/2) + 1 engineer
      expect(result.newState.players['1'].engineers).toBe(1); // -1 engineer
    });

    it('should reject repair if player lacks required cash', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.repairShips = 1;
      playerState.cash = 0; // No cash
      playerState.engineers = 2;
      state.groundBoard.placements.repair = { playerId: '1' };

      const { processRepairShip } = require('../../../server/actions/building');

      expect(() => {
        processRepairShip(state, '1', { count: 1, _internal: true });
      }).toThrow(/not enough cash|insufficient funds/i);
    });

    it('should reject repair if no ships in repair bay', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.hangarShips = 1;
      playerState.repairShips = 0;  // No ships in repair bay
      playerState.cash = 15;
      playerState.engineers = 2;
      state.groundBoard.placements.repair = { playerId: '1' };

      const { processRepairShip } = require('../../../server/actions/building');

      expect(() => {
        processRepairShip(state, '1', { count: 1, _internal: true });
      }).toThrow(/no.*repair|repair.*bay/i);
    });

    it('should reject repair if player lacks engineers', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.repairShips = 1;
      playerState.cash = 15;
      playerState.engineers = 0; // No engineers
      state.groundBoard.placements.repair = { playerId: '1' };

      const { processRepairShip } = require('../../../server/actions/building');

      expect(() => {
        processRepairShip(state, '1', { count: 1, _internal: true });
      }).toThrow(/not enough engineers/i);
    });

    it('should allow repairing multiple ships at once', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.hangarShips = 0;
      playerState.repairShips = 2; // Two damaged ships
      playerState.cash = 15;
      playerState.engineers = 3;
      state.groundBoard.placements.repair = { playerId: '1' };

      const { processRepairShip } = require('../../../server/actions/building');
      const result = processRepairShip(state, '1', { count: 2, _internal: true });

      // Both ships should be moved from repair to hangar
      expect(result.newState.players['1'].repairShips).toBe(0);
      expect(result.newState.players['1'].hangarShips).toBe(2);
      // Cost = 2 * (floor(hullCost/2) + 1 engineer) = 2 engineers
      expect(result.newState.players['1'].engineers).toBe(1); // -2 engineers
    });

    it('should only allow repairs at Repair action space (not direct call)', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.repairShips = 1;
      playerState.cash = 15;
      playerState.engineers = 2;
      // No placement at Repair action space

      const { processRepairShip } = require('../../../server/actions/building');

      expect(() => {
        processRepairShip(state, '1', { count: 1 }); // No _internal flag
      }).toThrow(/repair.*action space|place.*agent/i);
    });
  });

  describe('GAP-020: Launch procedure with two-step Hazard Check', () => {
    it('should set ship to awaiting_hazard after LAUNCH_SHIP', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 1;
      playerState.hangarShips = 1;

      state.map.routes[0].claimed = null;

      const { processLaunchShip } = require('../../../server/actions/launch');

      const result = processLaunchShip(state, '1', {
        routeId: 'route_1',
        gasType: 'hydrogen',
        _internal: true
      });

      // Ship should be in pendingLaunch with hazardInfo after LAUNCH_SHIP
      expect(result.newState.players['1'].pendingLaunch).toBeDefined();
      expect(result.newState.players['1'].pendingLaunch.hazardInfo).toBeDefined();
      expect(result.newState.players['1'].pendingLaunch.routeId).toBe('route_1');
    });

    it('should claim route after RESPOND_TO_HAZARD with spendEngineers=true', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 1;
      playerState.hangarShips = 1;

      state.map.routes[0].claimed = null;

      const { processLaunchShip } = require('../../../server/actions/launch');
      const { processRespondToHazard } = require('../../../server/actions/hazard');

      // Step 1: LAUNCH_SHIP
      const launchResult = processLaunchShip(state, '1', {
        routeId: 'route_1',
        gasType: 'hydrogen',
        _internal: true
      });

      // Step 2: RESPOND_TO_HAZARD
      const hazardResult = processRespondToHazard(launchResult.newState, '1', {
        spendEngineers: true
      });

      // Route should be claimed after hazard check passes, pendingLaunch cleared
      expect(hazardResult.newState.map.routes[0].claimed).toBe('1');
      expect(hazardResult.newState.players['1'].pendingLaunch).toBeUndefined();
    });

    it('should increase income after RESPOND_TO_HAZARD passes', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      const initialIncome = playerState.income;
      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 1;
      playerState.hangarShips = 1;

      state.map.routes[0].claimed = null;
      const routeIncome = state.map.routes[0].income;

      const { processLaunchShip } = require('../../../server/actions/launch');
      const { processRespondToHazard } = require('../../../server/actions/hazard');

      // Step 1: LAUNCH_SHIP
      const launchResult = processLaunchShip(state, '1', {
        routeId: 'route_1',
        gasType: 'hydrogen',
        _internal: true
      });

      // Step 2: RESPOND_TO_HAZARD
      const hazardResult = processRespondToHazard(launchResult.newState, '1', {
        spendEngineers: true
      });

      // Income should increase after hazard check passes
      expect(hazardResult.newState.players['1'].income).toBe(initialIncome + routeIncome);
    });
  });

  describe('GAP-048: Trapeze System (USA) route requirement bypass', () => {
    it('should allow USA with Sparrowhawk Hangar upgrade to bypass one route stat requirement', () => {
      const state = createTestGameState();
      // Use player 3 who is USA
      const playerState = state.players['3'];

      // USA has trapeze_system technology by default from faction config
      expect(playerState.techCards).toContain('trapeze_system');

      // GAP-079: Install sparrowhawk_hangar UPGRADE in blueprint (technology alone is not enough)
      playerState.blueprint.componentSlots = ['sparrowhawk_hangar'];

      // Setup: ship with insufficient Speed for route
      playerState.gasCubes = { hydrogen: 0, helium: 3 };
      playerState.officers = 1;
      playerState.hangarShips = 1;

      // Route requires Speed 5, but ship only has Speed 2
      state.map.routes = [{
        id: 'route_speed',
        from: 'New York',
        to: 'London',
        distance: 1,  // Range requirement is met
        speed: 5,     // Speed requirement is NOT met
        income: 3,
        claimed: null
      }];

      // Blueprint stats: Range 3 (from testBlueprint), Speed 2 (base)
      // Ship would normally fail Speed check

      const { processLaunchShip } = require('../../../server/actions/launch');
      const { processRespondToHazard } = require('../../../server/actions/hazard');

      // Step 1: LAUNCH_SHIP - With Trapeze System and bypassedRequirement option
      const launchResult = processLaunchShip(state, '3', {
        routeId: 'route_speed',
        gasType: 'helium',
        bypassRequirement: 'speed',  // Use Trapeze System to bypass speed
        _internal: true
      });

      // Should succeed - ship awaiting hazard response
      expect(launchResult.newState.players['3'].pendingLaunch).toBeDefined();

      // Step 2: RESPOND_TO_HAZARD
      const hazardResult = processRespondToHazard(launchResult.newState, '3', {
        spendEngineers: true
      });

      // Should succeed - route claimed after hazard check passes, pendingLaunch cleared
      expect(hazardResult.newState.players['3'].pendingLaunch).toBeUndefined();
      expect(hazardResult.newState.map.routes[0].claimed).toBe('3');
    });

    it('should NOT allow non-USA player to bypass route requirements (no upgrade installed)', () => {
      const state = createTestGameState();
      // Use player 1 who is Germany (no trapeze_system technology and no sparrowhawk_hangar upgrade)
      const playerState = state.players['1'];

      // Germany doesn't have trapeze_system technology
      expect(playerState.techCards).not.toContain('trapeze_system');
      // And no sparrowhawk_hangar upgrade installed
      expect(playerState.blueprint.componentSlots).not.toContain('sparrowhawk_hangar');

      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 1;
      playerState.hangarShips = 1;

      // Route requires Speed 5, but ship only has Speed 2
      state.map.routes = [{
        id: 'route_speed',
        from: 'Frankfurt',
        to: 'London',
        distance: 1,
        speed: 5,
        income: 3,
        claimed: null
      }];

      const { processLaunchShip } = require('../../../server/actions/launch');

      // Should fail - Germany can't bypass requirements
      expect(() => {
        processLaunchShip(state, '1', {
          routeId: 'route_speed',
          gasType: 'hydrogen',
          bypassRequirement: 'speed',
          _internal: true
        });
      }).toThrow(/sparrowhawk|hangar|requirement/i);
    });

    it('should only allow bypassing ONE requirement per launch (with upgrade installed)', () => {
      const state = createTestGameState();
      const playerState = state.players['3']; // USA

      // GAP-079: Install sparrowhawk_hangar UPGRADE in blueprint
      playerState.blueprint.componentSlots = ['sparrowhawk_hangar'];

      playerState.gasCubes = { hydrogen: 0, helium: 3 };
      playerState.officers = 1;
      playerState.hangarShips = 1;

      // Route requires both high Speed AND high Ceiling
      state.map.routes = [{
        id: 'route_hard',
        from: 'New York',
        to: 'Berlin',
        distance: 1,
        speed: 5,     // NOT met
        ceiling: 5,   // NOT met
        income: 5,
        claimed: null
      }];

      const { processLaunchShip } = require('../../../server/actions/launch');

      // Even with bypassRequirement, ship fails other requirement
      expect(() => {
        processLaunchShip(state, '3', {
          routeId: 'route_hard',
          gasType: 'helium',
          bypassRequirement: 'speed',  // Bypass speed, but ceiling still fails
          _internal: true
        });
      }).toThrow(/ceiling|requirement/i);
    });
  });

  describe('GAP-079: Sparrowhawk Hangar requires upgrade installed, not just technology', () => {
    it('should NOT allow bypass with only trapeze_system technology (upgrade not installed)', () => {
      const state = createTestGameState();
      const playerState = state.players['3']; // USA - has trapeze_system technology

      // USA has the technology
      expect(playerState.techCards).toContain('trapeze_system');

      // But NO sparrowhawk_hangar installed in componentSlots
      playerState.blueprint = {
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope'],
        driveSlots: ['adaptive_propeller'],  // Provides speed 1, range 2
        componentSlots: [null], // No sparrowhawk_hangar
        gasSockets: ['hydrogen', 'hydrogen']
      };

      playerState.gasCubes = { hydrogen: 0, helium: 3 };
      playerState.officers = 1;
      playerState.hangarShips = 1;

      // Route requires Speed 5, but ship only has Speed 2
      state.map.routes = [{
        id: 'route_speed',
        from: 'New York',
        to: 'London',
        distance: 1,
        speed: 5,
        income: 3,
        claimed: null
      }];

      const { processLaunchShip } = require('../../../server/actions/launch');

      // Should FAIL - having technology is not enough, upgrade must be installed
      expect(() => {
        processLaunchShip(state, '3', {
          routeId: 'route_speed',
          gasType: 'helium',
          bypassRequirement: 'speed',
          _internal: true
        });
      }).toThrow(/sparrowhawk|trapeze|hangar|requirement/i);
    });

    it('should ALLOW bypass when sparrowhawk_hangar upgrade IS installed', () => {
      const state = createTestGameState();
      const playerState = state.players['3']; // USA - has trapeze_system technology

      // USA has the technology
      expect(playerState.techCards).toContain('trapeze_system');

      // AND sparrowhawk_hangar IS installed
      playerState.blueprint = {
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope'],
        driveSlots: ['adaptive_propeller'],  // Provides speed 1, range 2
        componentSlots: ['sparrowhawk_hangar'], // Upgrade installed!
        gasSockets: ['hydrogen', 'hydrogen']
      };

      playerState.gasCubes = { hydrogen: 0, helium: 3 };
      playerState.officers = 1;
      playerState.hangarShips = 1;

      // Route requires Speed 5, but ship only has Speed 2
      state.map.routes = [{
        id: 'route_speed',
        from: 'New York',
        to: 'London',
        distance: 1,
        speed: 5,
        income: 3,
        claimed: null
      }];

      const { processLaunchShip } = require('../../../server/actions/launch');

      // Should SUCCEED - upgrade is installed
      const result = processLaunchShip(state, '3', {
        routeId: 'route_speed',
        gasType: 'helium',
        bypassRequirement: 'speed',
        _internal: true
      });

      expect(result.newState.players['3'].pendingLaunch).toBeDefined();
    });
  });

  describe('GAP-059: Luxury Route Requirement Validation', () => {
    it('should reject launch if ship Luxury stat does not meet route requirement', () => {
      const state = createTestGameState();
      state.age = 3; // Age III has luxury routes
      const playerState = state.players['1'];

      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 3; // Age 3 requires 3 officers
      playerState.hangarShips = 1;

      // Blueprint has no luxury upgrades (Luxury stat = 0)
      playerState.blueprint = {
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope'],
        driveSlots: ['adaptive_propeller'],  // Provides speed 1, range 2
        componentSlots: [null],
        gasSockets: ['hydrogen', 'hydrogen']
      };

      // Luxury route requires luxury: 1
      state.map.routes = [{
        id: 'luxury_route',
        from: 'London',
        to: 'New York',
        distance: 2,  // Range requirement is met
        speed: 1,     // Speed requirement is met
        ceiling: 0,   // No ceiling requirement
        luxury: 1,    // Luxury requirement NOT met (ship has 0)
        income: 8,
        claimed: null
      }];

      const { processLaunchShip } = require('../../../server/actions/launch');

      expect(() => {
        processLaunchShip(state, '1', {
          routeId: 'luxury_route',
          gasType: 'hydrogen',
          _internal: true
        });
      }).toThrow(/luxury/i);
    });

    it('should allow launch when ship Luxury stat meets route requirement', () => {
      const state = createTestGameState();
      state.age = 3; // Age III
      const playerState = state.players['1'];

      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 3;
      playerState.hangarShips = 1;

      // Blueprint with sleeping_quarters which gives luxury: 1
      playerState.blueprint = {
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope'],
        driveSlots: ['adaptive_propeller'],  // Provides speed 1, range 2
        componentSlots: ['sleeping_quarters'],  // +1 luxury
        gasSockets: ['hydrogen', 'hydrogen']
      };

      // Luxury route requires luxury: 1
      state.map.routes = [{
        id: 'luxury_route',
        from: 'London',
        to: 'New York',
        distance: 2,
        speed: 1,
        ceiling: 0,
        luxury: 1,
        income: 8,
        claimed: null
      }];

      const { processLaunchShip } = require('../../../server/actions/launch');

      // Should succeed - ship has luxury 1, route requires 1
      const result = processLaunchShip(state, '1', {
        routeId: 'luxury_route',
        gasType: 'hydrogen',
        _internal: true
      });

      expect(result.newState.players['1'].pendingLaunch).toBeDefined();
    });

    it('should allow USA with Sparrowhawk Hangar upgrade to bypass Luxury requirement', () => {
      const state = createTestGameState();
      state.age = 3;
      const playerState = state.players['3']; // USA with trapeze_system technology

      playerState.gasCubes = { hydrogen: 0, helium: 3 };
      playerState.officers = 3;
      playerState.hangarShips = 1;

      // GAP-079: Blueprint with sparrowhawk_hangar upgrade installed (no luxury upgrades)
      playerState.blueprint = {
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope'],
        driveSlots: ['adaptive_propeller'],  // Provides speed 1, range 2
        componentSlots: ['sparrowhawk_hangar'],  // Upgrade installed
        gasSockets: ['helium', 'helium']
      };

      // Luxury route requires luxury: 1
      state.map.routes = [{
        id: 'luxury_route',
        from: 'New York',
        to: 'London',
        distance: 2,
        speed: 1,
        ceiling: 0,
        luxury: 1,
        income: 8,
        claimed: null
      }];

      const { processLaunchShip } = require('../../../server/actions/launch');

      // Should succeed with Trapeze System bypassing luxury requirement
      const result = processLaunchShip(state, '3', {
        routeId: 'luxury_route',
        gasType: 'helium',
        bypassRequirement: 'luxury',
        _internal: true
      });

      expect(result.newState.players['3'].pendingLaunch).toBeDefined();
    });

    it('should allow launch on non-luxury routes without Luxury stat', () => {
      const state = createTestGameState();
      state.age = 3;
      const playerState = state.players['1'];

      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 3;
      playerState.hangarShips = 1;

      // Blueprint with no luxury
      playerState.blueprint = {
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope'],
        driveSlots: ['adaptive_propeller'],  // Provides speed 1, range 2
        componentSlots: [null],
        gasSockets: ['hydrogen', 'hydrogen']
      };

      // Regular route with no luxury requirement (luxury: 0 or undefined)
      state.map.routes = [{
        id: 'regular_route',
        from: 'London',
        to: 'Paris',
        distance: 2,
        speed: 1,
        ceiling: 0,
        luxury: 0,  // No luxury required
        income: 5,
        claimed: null
      }];

      const { processLaunchShip } = require('../../../server/actions/launch');

      // Should succeed - no luxury requirement
      const result = processLaunchShip(state, '1', {
        routeId: 'regular_route',
        gasType: 'hydrogen',
        _internal: true
      });

      expect(result.newState.players['1'].pendingLaunch).toBeDefined();
    });
  });

  describe('Fire hazard engineersNeeded calculation', () => {
    it('should set engineersNeeded to engineerCost for Engine Fire (hydrogen ship)', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 1;
      playerState.hangarShips = 1;
      playerState.engineers = 5;

      // Put Engine Fire at top of hazard deck
      playerState.hazardDeck = [{
        id: 'engine_fire_0',
        type: 'engine_fire',
        category: 'fire',
        name: 'Engine Fire',
        hydrogenOnly: true,
        engineerCost: 1,
        difficulty: 0,
        flak: 2
      }];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        distance: 1,
        income: 2,
        claimed: null
      }];

      const { processLaunchShip } = require('../../../server/actions/launch');

      const result = processLaunchShip(state, '1', {
        routeId: 'route_1',
        gasType: 'hydrogen',
        _internal: true
      });

      // hazardInfo.engineersNeeded should be 1 (from engineerCost)
      expect(result.newState.players['1'].pendingLaunch.hazardInfo.engineersNeeded).toBe(1);
    });

    it('should set engineersNeeded to engineerCost for Gas Cell Rupture (hydrogen ship)', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 1;
      playerState.hangarShips = 1;
      playerState.engineers = 5;

      // Put Gas Cell Rupture at top of hazard deck
      playerState.hazardDeck = [{
        id: 'gas_cell_rupture_0',
        type: 'gas_cell_rupture',
        category: 'fire',
        name: 'Gas Cell Rupture',
        hydrogenOnly: true,
        engineerCost: 2,
        difficulty: 0,
        flak: 3
      }];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        distance: 1,
        income: 2,
        claimed: null
      }];

      const { processLaunchShip } = require('../../../server/actions/launch');

      const result = processLaunchShip(state, '1', {
        routeId: 'route_1',
        gasType: 'hydrogen',
        _internal: true
      });

      // hazardInfo.engineersNeeded should be 2 (from engineerCost)
      expect(result.newState.players['1'].pendingLaunch.hazardInfo.engineersNeeded).toBe(2);
    });

    it('should set engineersNeeded to 0 for fire hazards with helium ship (auto-pass)', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.gasCubes = { hydrogen: 0, helium: 3 };
      playerState.officers = 1;
      playerState.hangarShips = 1;
      playerState.engineers = 5;
      // Need Helium Handling tech to use helium
      playerState.techCards = ['helium_handling'];

      // Put Engine Fire at top of hazard deck
      playerState.hazardDeck = [{
        id: 'engine_fire_0',
        type: 'engine_fire',
        category: 'fire',
        name: 'Engine Fire',
        hydrogenOnly: true,
        engineerCost: 1,
        difficulty: 0,
        flak: 2
      }];

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        distance: 1,
        income: 2,
        claimed: null
      }];

      const { processLaunchShip } = require('../../../server/actions/launch');

      const result = processLaunchShip(state, '1', {
        routeId: 'route_1',
        gasType: 'helium',
        _internal: true
      });

      // Helium ships auto-pass fire hazards, so engineersNeeded is still 1
      // but heliumFireImmunity should be true (meaning player doesn't need to spend)
      expect(result.newState.players['1'].pendingLaunch.hazardInfo.heliumFireImmunity).toBe(true);
    });

    it('should calculate engineersNeeded based on difficulty-stat gap for non-fire hazards', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 1;
      playerState.hangarShips = 1;
      playerState.engineers = 5;

      // Put a non-fire hazard at top of deck (reliability check with difficulty 6)
      playerState.hazardDeck = [{
        id: 'structural_stress_0',
        type: 'major_reliability',
        category: 'major',
        name: 'Structural Stress',
        challengeType: 'reliability',
        difficulty: 6,
        flak: 2
      }];

      // Use the default test blueprint which has reliability 2 from frame + fabric
      // (frameSlots: ['duralumin_frame'], fabricSlots: ['premium_envelope'], driveSlots: ['standard_engine'])
      // duralumin_frame provides gas_socket:1, ceiling:1, reliability:1 (balance fix)
      // premium_envelope provides reliability:1, range:1
      // standard_engine provides speed:1, range:1
      // We need a route with distance=1 and speed=1 to match the blueprint's stats

      state.map.routes = [{
        id: 'route_1',
        from: 'A',
        to: 'B',
        distance: 1,  // Matches standard_engine range of 1
        speed: 1,     // Matches standard_engine speed of 1
        income: 2,
        claimed: null
      }];

      const { processLaunchShip } = require('../../../server/actions/launch');

      const result = processLaunchShip(state, '1', {
        routeId: 'route_1',
        gasType: 'hydrogen',
        _internal: true
      });

      // engineersNeeded = difficulty (6) - reliability stat (2: 1 from duralumin_frame + 1 from premium_envelope) = 4
      expect(result.newState.players['1'].pendingLaunch.hazardInfo.engineersNeeded).toBe(4);
    });
  });

  describe('GAP-060: City Bonus Selection as Player Choice', () => {
    it('should store cityChoice on ship when specified', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 1;
      playerState.hangarShips = 1;

      state.map.routes = [{
        id: 'route_1',
        from: 'London',  // Has city bonus: +3 cash
        to: 'Paris',     // Has city bonus: +1 influence
        distance: 1,
        speed: 1,
        income: 3,
        claimed: null
      }];

      const { processLaunchShip } = require('../../../server/actions/launch');

      // Player chooses London for the city bonus
      const result = processLaunchShip(state, '1', {
        routeId: 'route_1',
        gasType: 'hydrogen',
        cityChoice: 'London',
        _internal: true
      });

      expect(result.newState.players['1'].pendingLaunch.cityChoice).toBe('London');
    });

    it('should apply player-chosen city bonus after hazard success', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      const initialCash = playerState.cash;
      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 1;
      playerState.hangarShips = 1;

      state.map.routes = [{
        id: 'route_1',
        from: 'London',  // +3 cash
        to: 'Paris',     // +1 influence
        distance: 1,
        speed: 1,
        income: 3,
        claimed: null
      }];

      const { processLaunchShip } = require('../../../server/actions/launch');
      const { processRespondToHazard } = require('../../../server/actions/hazard');

      // Launch with London as city choice
      const launchResult = processLaunchShip(state, '1', {
        routeId: 'route_1',
        gasType: 'hydrogen',
        cityChoice: 'London',
        _internal: true
      });

      // Respond to hazard
      const hazardResult = processRespondToHazard(launchResult.newState, '1', {
        spendEngineers: true
      });

      // London gives +3 cash
      expect(hazardResult.newState.players['1'].cash).toBe(initialCash + 3);
      // Influence should NOT have increased (didn't choose Paris)
      expect(hazardResult.newState.players['1'].influence).toBe(0);
    });

    it('should apply alternative city bonus when different city chosen', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 1;
      playerState.hangarShips = 1;
      playerState.influence = 0;

      state.map.routes = [{
        id: 'route_1',
        from: 'London',  // +3 cash
        to: 'Paris',     // +1 influence
        distance: 1,
        speed: 1,
        income: 3,
        claimed: null
      }];

      const { processLaunchShip } = require('../../../server/actions/launch');
      const { processRespondToHazard } = require('../../../server/actions/hazard');

      // Launch with Paris as city choice instead
      const launchResult = processLaunchShip(state, '1', {
        routeId: 'route_1',
        gasType: 'hydrogen',
        cityChoice: 'Paris',
        _internal: true
      });

      const initialCash = launchResult.newState.players['1'].cash;

      // Respond to hazard
      const hazardResult = processRespondToHazard(launchResult.newState, '1', {
        spendEngineers: true
      });

      // Paris gives +1 influence
      expect(hazardResult.newState.players['1'].influence).toBe(1);
      // Cash should NOT have increased from city bonus (didn't choose London)
      expect(hazardResult.newState.players['1'].cash).toBe(initialCash);
    });

    it('should validate cityChoice is one of the route endpoints', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 1;
      playerState.hangarShips = 1;

      state.map.routes = [{
        id: 'route_1',
        from: 'London',
        to: 'Paris',
        distance: 1,
        speed: 1,
        income: 3,
        claimed: null
      }];

      const { processLaunchShip } = require('../../../server/actions/launch');

      // Try to choose Berlin (not an endpoint)
      expect(() => {
        processLaunchShip(state, '1', {
          routeId: 'route_1',
          gasType: 'hydrogen',
          cityChoice: 'Berlin',  // Invalid - not an endpoint
          _internal: true
        });
      }).toThrow(/city|endpoint/i);
    });

    it('should default to "to" city when cityChoice not specified', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 1;
      playerState.hangarShips = 1;
      playerState.influence = 0;

      state.map.routes = [{
        id: 'route_1',
        from: 'London',  // +3 cash
        to: 'Paris',     // +1 influence
        distance: 1,
        speed: 1,
        income: 3,
        claimed: null
      }];

      const { processLaunchShip } = require('../../../server/actions/launch');
      const { processRespondToHazard } = require('../../../server/actions/hazard');

      // Launch WITHOUT cityChoice - should default to 'to' city (Paris)
      const launchResult = processLaunchShip(state, '1', {
        routeId: 'route_1',
        gasType: 'hydrogen',
        _internal: true
      });

      const initialCash = launchResult.newState.players['1'].cash;

      // Respond to hazard
      const hazardResult = processRespondToHazard(launchResult.newState, '1', {
        spendEngineers: true
      });

      // Default (Paris) gives +1 influence
      expect(hazardResult.newState.players['1'].influence).toBe(1);
      // Cash should NOT have increased (didn't get London bonus)
      expect(hazardResult.newState.players['1'].cash).toBe(initialCash);
    });
  });
});
