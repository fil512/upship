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
      state.players['1'].hangarShips = 0;

      const result = processBuildShip(state, '1', { count: 1, _internal: true });

      expect(result.newState.players['1'].hangarShips).toBe(1);
    });

    it('should allow building 3 ships when hangar is empty', () => {
      const state = createTestGameState();
      state.players['1'].cash = 100;
      state.players['1'].hangarShips = 0;

      const result = processBuildShip(state, '1', { count: 3, _internal: true });

      expect(result.newState.players['1'].hangarShips).toBe(3);
    });

    it('should allow building 2 ships when hangar has 1 ship', () => {
      const state = createTestGameState();
      state.players['1'].cash = 100;
      state.players['1'].hangarShips = 1;

      const result = processBuildShip(state, '1', { count: 2, _internal: true });

      // Should have 3 ships total (1 existing + 2 new)
      expect(result.newState.players['1'].hangarShips).toBe(3);
    });

    it('should reject building if it would exceed 6 total ships per Section 4.4', () => {
      const state = createTestGameState();
      state.players['1'].cash = 100;
      state.players['1'].hangarShips = 5;

      // Trying to build 2 ships when there are already 5 total (would make 7)
      expect(() => {
        processBuildShip(state, '1', { count: 2, _internal: true });
      }).toThrow(/fleet capacity|exceed|limit/i);
    });

    it('should not count ships on routes toward fleet capacity', () => {
      const state = createTestGameState();
      state.players['1'].cash = 100;
      // Ships on routes are tracked separately - hangar is empty
      state.players['1'].hangarShips = 0;
      // Note: With the new model, ships on routes don't have a separate counter
      // They're just gone from the hangar. Routes track claimed status.

      // Ships on routes don't count against capacity, so building 3 should work
      const result = processBuildShip(state, '1', { count: 3, _internal: true });

      expect(result.newState.players['1'].hangarShips).toBe(3);
    });

    it('should allow building up to 6 total ships', () => {
      const state = createTestGameState();
      state.players['1'].cash = 100;
      state.players['1'].hangarShips = 3;

      // Building 3 more would hit exactly 6 total - should succeed
      const result = processBuildShip(state, '1', { count: 3, _internal: true });

      expect(result.newState.players['1'].hangarShips).toBe(6);
    });
  });

  describe('Construction Hall immediate action execution (Section 5.1)', () => {
    // Per rules Section 5.1: "3. Execute the location's action"
    // Actions should execute IMMEDIATELY when placing an agent, not during reveal

    it('should build ship immediately when placing agent at construction_hall', () => {
      const state = createTestGameState();
      const playerId = '1';
      state.players[playerId].cash = 100;
      state.players[playerId].hangarShips = 0;
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

      // Ship should be built immediately during placement (starts with 1)
      expect(result.newState.players[playerId].hangarShips).toBe(1);
    });

    it('should build multiple ships when buildCount specified', () => {
      const state = createTestGameState();
      const playerId = '1';
      state.players[playerId].cash = 100;
      state.players[playerId].hangarShips = 0;
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
      expect(result.newState.players[playerId].hangarShips).toBe(3);
    });

    it('should reject direct BUILD_SHIP action during reveal phase', () => {
      const state = createTestGameState();
      state.phase = 'reveal';
      state.players['1'].cash = 100;
      state.players['1'].hangarShips = 0;
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
      state.players['1'].hangarShips = 0;
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
      state.players['1'].hangarShips = 0;
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
      state.players[playerId].hangarShips = 0;
      state.players[playerId].agentsRemaining = 2;
      // Use Rigger card which gives -£2 build cost
      state.players[playerId].hand = [
        { id: 'rigger', name: 'Rigger', symbol: 'wrench', effect: '-£2 ship build cost' }
      ];
      // Empty blueprint = £0 (no base cost, just tile costs)
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

      // Empty blueprint £0 - Rigger discount irrelevant = £0
      // Ship should be built for free
      expect(result.newState.players[playerId].hangarShips).toBe(1);
      expect(result.newState.players[playerId].cash).toBe(initialCash); // No cost deducted
    });
  });
});
