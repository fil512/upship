/**
 * Rules Compliance Tests - Building Ships
 * Tests for correct implementation of Section 6.3, 4.4 (Construction Hall and Hangar capacity)
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processBuildShip } = require('../../../server/actions/building');

describe('Rules Compliance - Building Ships', () => {

  describe('GAP-034: Hangar capacity limit during build', () => {
    it('should allow building when hangar has 0 ships', () => {
      const state = createTestGameState();
      state.players['1'].cash = 100;
      state.players['1'].ships = [];

      const result = processBuildShip(state, '1', { count: 1 });

      expect(result.newState.players['1'].ships.length).toBe(1);
      expect(result.newState.players['1'].ships[0].status).toBe('hangar');
    });

    it('should allow building 3 ships when hangar is empty', () => {
      const state = createTestGameState();
      state.players['1'].cash = 100;
      state.players['1'].ships = [];

      const result = processBuildShip(state, '1', { count: 3 });

      expect(result.newState.players['1'].ships.length).toBe(3);
    });

    it('should allow building 2 ships when hangar has 1 ship', () => {
      const state = createTestGameState();
      state.players['1'].cash = 100;
      state.players['1'].ships = [
        { id: 'existing1', status: 'hangar' }
      ];

      const result = processBuildShip(state, '1', { count: 2 });

      // Should have 3 ships total (1 existing + 2 new)
      const hangarShips = result.newState.players['1'].ships.filter(s => s.status === 'hangar');
      expect(hangarShips.length).toBe(3);
    });

    it('should reject building if it would exceed 3 ships in hangar per Section 6.3', () => {
      const state = createTestGameState();
      state.players['1'].cash = 100;
      state.players['1'].ships = [
        { id: 'existing1', status: 'hangar' },
        { id: 'existing2', status: 'hangar' }
      ];

      // Trying to build 2 ships when there are already 2 in hangar (would make 4)
      expect(() => {
        processBuildShip(state, '1', { count: 2 });
      }).toThrow(/hangar capacity|exceed|limit/i);
    });

    it('should reject building 3 ships when hangar already has 1 ship', () => {
      const state = createTestGameState();
      state.players['1'].cash = 100;
      state.players['1'].ships = [
        { id: 'existing1', status: 'hangar' }
      ];

      // Trying to build 3 ships when there is already 1 in hangar
      expect(() => {
        processBuildShip(state, '1', { count: 3 });
      }).toThrow(/hangar capacity|exceed|limit/i);
    });

    it('should not count ships on routes toward hangar capacity', () => {
      const state = createTestGameState();
      state.players['1'].cash = 100;
      state.players['1'].ships = [
        { id: 'on_route_1', status: 'on_route' },
        { id: 'on_route_2', status: 'on_route' },
        { id: 'on_route_3', status: 'on_route' }
      ];

      // Ships on routes don't count, so building 3 should work
      const result = processBuildShip(state, '1', { count: 3 });

      const hangarShips = result.newState.players['1'].ships.filter(s => s.status === 'hangar');
      expect(hangarShips.length).toBe(3);
    });

    it('should not count damaged ships toward hangar capacity', () => {
      const state = createTestGameState();
      state.players['1'].cash = 100;
      state.players['1'].ships = [
        { id: 'damaged_1', status: 'damaged' },
        { id: 'damaged_2', status: 'damaged' }
      ];

      // Damaged ships are in Repair Hangar, not Launch Hangar
      const result = processBuildShip(state, '1', { count: 3 });

      const hangarShips = result.newState.players['1'].ships.filter(s => s.status === 'hangar');
      expect(hangarShips.length).toBe(3);
    });
  });
});
