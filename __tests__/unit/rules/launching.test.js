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

  describe('GAP-020: Launch procedure requires Hazard Check', () => {
    it('should set ship to awaiting_hazard status per Section 8.3', () => {
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
        gasType: 'hydrogen'
      });

      // Ship should be awaiting hazard check, not directly on route
      expect(result.newState.players['1'].ships[0].status).toBe('awaiting_hazard');
      expect(result.newState.players['1'].ships[0].pendingRouteId).toBe('route_1');
    });

    it('should NOT claim route until hazard check completes', () => {
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
        gasType: 'hydrogen'
      });

      // Route should NOT be claimed yet
      expect(result.newState.map.routes[0].claimed).toBe(null);
    });

    it('should NOT increase income until hazard check completes', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      const initialIncome = playerState.income;
      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.officers = 1;
      playerState.ships = [{ id: 'ship1', status: 'hangar' }];

      state.map.routes[0].claimed = null;

      const { processLaunchShip } = require('../../../server/actions/launch');

      const result = processLaunchShip(state, '1', {
        shipId: 'ship1',
        routeId: 'route_1',
        gasType: 'hydrogen'
      });

      // Income should NOT change until hazard check succeeds
      expect(result.newState.players['1'].income).toBe(initialIncome);
    });
  });
});
