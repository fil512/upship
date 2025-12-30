/**
 * Rules Compliance Tests - Launching and Repair
 * Tests for correct implementation of Section 4.4, 7, 8 (Building, Launching, Hazards)
 */

const { createTestGameState } = require('../../fixtures/testData');

describe('Rules Compliance - Launching and Repair', () => {

  describe('GAP-027: Ship repair cost', () => {
    it('should allow repairing damaged ships for £3 per Section 4.4', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      // Player has a damaged ship in repair hangar
      playerState.ships = [
        { id: 'ship1', status: 'damaged' },
        { id: 'ship2', status: 'hangar' }
      ];
      playerState.cash = 15;

      const { processRepairShip } = require('../../../server/actions/building');
      const result = processRepairShip(state, '1', { shipId: 'ship1' });

      // Ship should now be in hangar, cost £3
      expect(result.newState.players['1'].ships[0].status).toBe('hangar');
      expect(result.newState.players['1'].cash).toBe(12);
    });

    it('should reject repair if player lacks £3', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.ships = [{ id: 'ship1', status: 'damaged' }];
      playerState.cash = 2;

      const { processRepairShip } = require('../../../server/actions/building');

      expect(() => {
        processRepairShip(state, '1', { shipId: 'ship1' });
      }).toThrow(/not enough cash|insufficient funds/i);
    });

    it('should reject repair if ship is not damaged', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.ships = [{ id: 'ship1', status: 'hangar' }];
      playerState.cash = 15;

      const { processRepairShip } = require('../../../server/actions/building');

      expect(() => {
        processRepairShip(state, '1', { shipId: 'ship1' });
      }).toThrow(/not damaged/i);
    });

    it('should reject repair if ship not found', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.ships = [{ id: 'ship1', status: 'hangar' }];
      playerState.cash = 15;

      const { processRepairShip } = require('../../../server/actions/building');

      expect(() => {
        processRepairShip(state, '1', { shipId: 'nonexistent' });
      }).toThrow(/not found/i);
    });
  });

  describe('GAP-020: Launch procedure with automatic Hazard Check', () => {
    it('should automatically perform hazard check and claim route on success', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 1;
      playerState.ships = [{ id: 'ship1', status: 'hangar' }];

      state.map.routes[0].claimed = null;

      const { processLaunchShip } = require('../../../server/actions/launch');

      const result = processLaunchShip(state, '1', {
        shipId: 'ship1',
        routeId: 'route_1',
        gasType: 'hydrogen',
        _internal: true
      });

      // Ship should be on_route after automatic hazard check passes (clear weather)
      expect(result.newState.players['1'].ships[0].status).toBe('on_route');
      expect(result.newState.players['1'].ships[0].routeId).toBe('route_1');
    });

    it('should claim route after hazard check passes', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 1;
      playerState.ships = [{ id: 'ship1', status: 'hangar' }];

      state.map.routes[0].claimed = null;

      const { processLaunchShip } = require('../../../server/actions/launch');

      const result = processLaunchShip(state, '1', {
        shipId: 'ship1',
        routeId: 'route_1',
        gasType: 'hydrogen',
        _internal: true
      });

      // Route should be claimed after hazard check passes
      expect(result.newState.map.routes[0].claimed).toBe('1');
    });

    it('should increase income after hazard check passes', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      const initialIncome = playerState.income;
      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 1;
      playerState.ships = [{ id: 'ship1', status: 'hangar' }];

      state.map.routes[0].claimed = null;
      const routeIncome = state.map.routes[0].income;

      const { processLaunchShip } = require('../../../server/actions/launch');

      const result = processLaunchShip(state, '1', {
        shipId: 'ship1',
        routeId: 'route_1',
        gasType: 'hydrogen',
        _internal: true
      });

      // Income should increase after hazard check passes
      expect(result.newState.players['1'].income).toBe(initialIncome + routeIncome);
    });
  });

  describe('GAP-048: Trapeze System (USA) route requirement bypass', () => {
    it('should allow USA with Trapeze System to bypass one route stat requirement', () => {
      const state = createTestGameState();
      // Use player 3 who is USA
      const playerState = state.players['3'];

      // USA has trapeze_system by default from faction config
      expect(playerState.technologies).toContain('trapeze_system');

      // Setup: ship with insufficient Speed for route
      playerState.gasCubes = { hydrogen: 0, helium: 3 };
      playerState.officers = 1;
      playerState.ships = [{ id: 'ship1', status: 'hangar' }];

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

      // With Trapeze System and bypassedRequirement option, this should work
      const result = processLaunchShip(state, '3', {
        shipId: 'ship1',
        routeId: 'route_speed',
        gasType: 'helium',
        bypassRequirement: 'speed',  // Use Trapeze System to bypass speed
        _internal: true
      });

      // Should succeed - ship on_route after automatic hazard check passes
      expect(result.newState.players['3'].ships[0].status).toBe('on_route');
      expect(result.newState.players['3'].ships[0].routeId).toBe('route_speed');
    });

    it('should NOT allow non-USA player to bypass route requirements', () => {
      const state = createTestGameState();
      // Use player 1 who is Germany (no trapeze_system)
      const playerState = state.players['1'];

      // Germany doesn't have trapeze_system
      expect(playerState.technologies).not.toContain('trapeze_system');

      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 1;
      playerState.ships = [{ id: 'ship1', status: 'hangar' }];

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
          shipId: 'ship1',
          routeId: 'route_speed',
          gasType: 'hydrogen',
          bypassRequirement: 'speed',
          _internal: true
        });
      }).toThrow(/trapeze|speed|requirement/i);
    });

    it('should only allow bypassing ONE requirement per launch', () => {
      const state = createTestGameState();
      const playerState = state.players['3']; // USA

      playerState.gasCubes = { hydrogen: 0, helium: 3 };
      playerState.officers = 1;
      playerState.ships = [{ id: 'ship1', status: 'hangar' }];

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
          shipId: 'ship1',
          routeId: 'route_hard',
          gasType: 'helium',
          bypassRequirement: 'speed',  // Bypass speed, but ceiling still fails
          _internal: true
        });
      }).toThrow(/ceiling|requirement/i);
    });
  });
});
