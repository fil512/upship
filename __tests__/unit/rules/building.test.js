/**
 * Rules Compliance Tests - Building Ships
 * Tests for correct implementation of Section 6.3, 4.4 (Construction Hall and Hangar capacity)
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processBuildShip } = require('../../../server/actions/building');
const { processPlaceAgent } = require('../../../server/actions/worker');

describe('Rules Compliance - Building Ships', () => {

  describe('GAP-034: Hangar capacity limit during build', () => {
    // These tests use _internal: true to test core build logic
    // In production, builds go through PLACE_AGENT at construction_hall

    it('should allow building when hangar has 0 ships', () => {
      const state = createTestGameState();
      state.players['1'].cash = 100;
      state.players['1'].ships = [];

      const result = processBuildShip(state, '1', { count: 1, _internal: true });

      expect(result.newState.players['1'].ships.length).toBe(1);
      expect(result.newState.players['1'].ships[0].status).toBe('hangar');
    });

    it('should allow building 3 ships when hangar is empty', () => {
      const state = createTestGameState();
      state.players['1'].cash = 100;
      state.players['1'].ships = [];

      const result = processBuildShip(state, '1', { count: 3, _internal: true });

      expect(result.newState.players['1'].ships.length).toBe(3);
    });

    it('should allow building 2 ships when hangar has 1 ship', () => {
      const state = createTestGameState();
      state.players['1'].cash = 100;
      state.players['1'].ships = [
        { id: 'existing1', status: 'hangar' }
      ];

      const result = processBuildShip(state, '1', { count: 2, _internal: true });

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
        processBuildShip(state, '1', { count: 2, _internal: true });
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
        processBuildShip(state, '1', { count: 3, _internal: true });
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
      const result = processBuildShip(state, '1', { count: 3, _internal: true });

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
      const result = processBuildShip(state, '1', { count: 3, _internal: true });

      const hangarShips = result.newState.players['1'].ships.filter(s => s.status === 'hangar');
      expect(hangarShips.length).toBe(3);
    });
  });

  describe('Construction Hall immediate action execution (Section 5.1)', () => {
    // Per rules Section 5.1: "3. Execute the location's action"
    // Actions should execute IMMEDIATELY when placing an agent, not during reveal

    it('should build ship immediately when placing agent at construction_hall', () => {
      const state = createTestGameState();
      const playerId = '1';
      state.players[playerId].cash = 100;
      state.players[playerId].ships = [];
      state.players[playerId].agentsRemaining = 2;
      state.players[playerId].hand = [
        { id: 'card1', name: 'Mechanic', symbol: 'wrench', effect: '+1 swap' }
      ];
      state.phase = 'worker_placement';
      state.workerPlacement = {
        placementOrder: ['1', '2', '3', '4'],
        currentPlacerIndex: 0,
        passedPlayers: []
      };

      // Place agent at construction_hall - ship should be built immediately
      const result = processPlaceAgent(state, playerId, {
        locationId: 'construction_hall',
        cardIndex: 0,
        buildCount: 1  // Specify how many ships to build
      });

      // Ship should be built immediately during placement
      expect(result.newState.players[playerId].ships.length).toBe(1);
      expect(result.newState.players[playerId].ships[0].status).toBe('hangar');
    });

    it('should build multiple ships when buildCount specified', () => {
      const state = createTestGameState();
      const playerId = '1';
      state.players[playerId].cash = 100;
      state.players[playerId].ships = [];
      state.players[playerId].agentsRemaining = 2;
      state.players[playerId].hand = [
        { id: 'card1', name: 'Mechanic', symbol: 'wrench', effect: '+1 swap' }
      ];
      state.phase = 'worker_placement';
      state.workerPlacement = {
        placementOrder: ['1', '2', '3', '4'],
        currentPlacerIndex: 0,
        passedPlayers: []
      };

      // Place agent at construction_hall with buildCount: 3
      const result = processPlaceAgent(state, playerId, {
        locationId: 'construction_hall',
        cardIndex: 0,
        buildCount: 3
      });

      // All 3 ships should be built immediately
      expect(result.newState.players[playerId].ships.length).toBe(3);
    });

    it('should reject direct BUILD_SHIP action during reveal phase', () => {
      const state = createTestGameState();
      state.phase = 'reveal';
      state.players['1'].cash = 100;
      state.players['1'].ships = [];
      // Player has a placement at construction_hall from earlier
      state.groundBoard.placements['construction_hall'] = { playerId: '1' };

      // Direct BUILD_SHIP should be rejected during reveal
      expect(() => {
        processBuildShip(state, '1', { count: 1 });
      }).toThrow(/worker_placement|agent|not allowed|phase/i);
    });

    it('should reject direct BUILD_SHIP action without agent at construction_hall', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.players['1'].cash = 100;
      state.players['1'].ships = [];
      // No agent at construction_hall
      state.groundBoard.placements = {};

      // Direct BUILD_SHIP without agent should be rejected
      expect(() => {
        processBuildShip(state, '1', { count: 1 });
      }).toThrow(/construction_hall|agent|not allowed/i);
    });

    it('should reject BUILD_SHIP when another player has agent at construction_hall', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.players['1'].cash = 100;
      state.players['1'].ships = [];
      // Player 2 has agent at construction_hall, not player 1
      state.groundBoard.placements['construction_hall'] = { playerId: '2' };

      // Player 1 cannot build when they don't have the agent
      expect(() => {
        processBuildShip(state, '1', { count: 1 });
      }).toThrow(/construction_hall|agent|not allowed/i);
    });

    it('should apply Rigger card discount when building during placement', () => {
      const state = createTestGameState();
      const playerId = '1';
      state.players[playerId].cash = 10;
      state.players[playerId].ships = [];
      state.players[playerId].agentsRemaining = 2;
      // Use Rigger card which gives -£2 build cost
      state.players[playerId].hand = [
        { id: 'rigger', name: 'Rigger', symbol: 'wrench', effect: '-£2 ship build cost' }
      ];
      // Empty blueprint = £2 base cost
      state.players[playerId].blueprint = {
        frameSlots: [null],
        fabricSlots: [null],
        driveSlots: [null],
        componentSlots: [null]
      };
      state.phase = 'worker_placement';
      state.workerPlacement = {
        placementOrder: ['1', '2', '3', '4'],
        currentPlacerIndex: 0,
        passedPlayers: []
      };

      const initialCash = state.players[playerId].cash;

      const result = processPlaceAgent(state, playerId, {
        locationId: 'construction_hall',
        cardIndex: 0,
        buildCount: 1
      });

      // Base cost £2 - £2 Rigger discount = £0
      // Ship should be built for free
      expect(result.newState.players[playerId].ships.length).toBe(1);
      expect(result.newState.players[playerId].cash).toBe(initialCash); // No cost deducted
    });
  });
});
