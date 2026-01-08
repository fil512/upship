/**
 * Rules Compliance Tests - Blueprint Design
 *
 * Per Section 6.2: Modify your Blueprint.
 * Cost: Free.
 * Players send a blueprint object describing the desired final state.
 *
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processPlaceAgent } = require('../../../server/actions/worker');
const { processInstallUpgrade, processRemoveUpgrade } = require('../../../server/actions/blueprint');

describe('Rules Compliance - Blueprint Design (Section 6.2)', () => {

  describe('Atomic Execution: Blueprint modifications during agent placement', () => {
    it('should install an upgrade when placing at blueprint_design with blueprint object', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.age = 1;

      const playerId = '1'; // Germany
      const playerState = state.players[playerId];

      // Add required technology (maybach_engine tech unlocks maybach_cx upgrade)
      playerState.techCards = ['maybach_engine'];
      playerState.agentsRemaining = 2;

      // Set up a card with wrench symbol for blueprint_design
      playerState.hand = [{
        id: 'test-card',
        name: 'Test Card',
        symbol: 'wrench'
      }];

      state.workerPlacement = {
        currentPlacerIndex: 0,
        passedPlayers: [],
        ministryVisitors: []
      };
      state.playerOrder = [playerId];
      state.groundBoard = { placements: {} };

      // Place agent at blueprint_design with desired blueprint state
      // Note: maybach_cx upgrade requires maybach_engine technology
      const result = processPlaceAgent(state, playerId, {
        locationId: 'blueprint_design',
        cardIndex: 0,
        blueprint: {
          driveSlots: ['maybach_cx']
        }
      });

      // Upgrade should be installed
      expect(result.newState.players[playerId].blueprint.driveSlots[0]).toBe('maybach_cx');
    });

    it('should handle replacing an upgrade in one visit', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.age = 1;

      const playerId = '1';
      const playerState = state.players[playerId];

      // Install an existing upgrade to replace
      playerState.blueprint.driveSlots[0] = 'basic_engine';
      // Add required technologies
      playerState.techCards = ['daimler_engine', 'maybach_engine'];
      playerState.agentsRemaining = 2;

      playerState.hand = [{
        id: 'test-card',
        name: 'Test Card',
        symbol: 'wrench'
      }];

      state.workerPlacement = {
        currentPlacerIndex: 0,
        passedPlayers: [],
        ministryVisitors: []
      };
      state.playerOrder = [playerId];
      state.groundBoard = { placements: {} };

      // Place agent with desired blueprint - replaces old upgrade with new
      // maybach_cx upgrade requires maybach_engine technology
      const result = processPlaceAgent(state, playerId, {
        locationId: 'blueprint_design',
        cardIndex: 0,
        blueprint: {
          driveSlots: ['maybach_cx']
        }
      });

      expect(result.newState.players[playerId].blueprint.driveSlots[0]).toBe('maybach_cx');
    });

    it('should allow multiple modifications in one visit', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.age = 1;

      const playerId = '1';
      const playerState = state.players[playerId];

      // Technologies that unlock the upgrades we want to install
      playerState.techCards = ['daimler_engine', 'maybach_engine', 'improved_propeller'];
      playerState.agentsRemaining = 2;

      // Expand drive slots for testing (normally 1 in Age I)
      playerState.blueprint.driveSlots = [null, null, null];

      playerState.hand = [{
        id: 'test-card',
        name: 'Test Card',
        symbol: 'wrench'
      }];

      state.workerPlacement = {
        currentPlacerIndex: 0,
        passedPlayers: [],
        ministryVisitors: []
      };
      state.playerOrder = [playerId];
      state.groundBoard = { placements: {} };

      // Place agent with desired blueprint state for all 3 slots
      const result = processPlaceAgent(state, playerId, {
        locationId: 'blueprint_design',
        cardIndex: 0,
        blueprint: {
          driveSlots: ['basic_engine', 'maybach_cx', 'efficient_propeller']
        }
      });

      // All 3 should be set
      expect(result.newState.players[playerId].blueprint.driveSlots[0]).toBe('basic_engine');
      expect(result.newState.players[playerId].blueprint.driveSlots[1]).toBe('maybach_cx');
      expect(result.newState.players[playerId].blueprint.driveSlots[2]).toBe('efficient_propeller');
    });

    it('should allow visiting with empty blueprint (no modifications)', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];

      playerState.agentsRemaining = 2;

      playerState.hand = [{
        id: 'test-card',
        name: 'Test Card',
        symbol: 'wrench'
      }];

      state.workerPlacement = {
        currentPlacerIndex: 0,
        passedPlayers: [],
        ministryVisitors: []
      };
      state.playerOrder = [playerId];
      state.groundBoard = { placements: {} };

      // Place with empty blueprint
      const result = processPlaceAgent(state, playerId, {
        locationId: 'blueprint_design',
        cardIndex: 0,
        blueprint: {}
      });

      // Should succeed (just visited)
      expect(result.newState.groundBoard.placements.blueprint_design).toBeDefined();
    });

    it('should handle missing blueprint param as visiting without modifications', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];

      playerState.agentsRemaining = 2;

      playerState.hand = [{
        id: 'test-card',
        name: 'Test Card',
        symbol: 'wrench'
      }];

      state.workerPlacement = {
        currentPlacerIndex: 0,
        passedPlayers: [],
        ministryVisitors: []
      };
      state.playerOrder = [playerId];
      state.groundBoard = { placements: {} };

      // Place without blueprint param
      const result = processPlaceAgent(state, playerId, {
        locationId: 'blueprint_design',
        cardIndex: 0
      });

      // Should succeed (just visited)
      expect(result.newState.groundBoard.placements.blueprint_design).toBeDefined();
    });
  });

  describe('Direct API Call Rejection', () => {
    it('should reject direct processInstallUpgrade calls during reveal phase', () => {
      const state = createTestGameState();
      state.phase = 'reveal';

      const playerId = '1';
      state.players[playerId].techCards = ['maybach_engine'];

      expect(() => {
        processInstallUpgrade(state, playerId, {
          slotType: 'drive',
          slotIndex: 0,
          upgradeId: 'maybach_engine'
        });
      }).toThrow(/Actions execute immediately when placing an agent|Section 5\.1/);
    });

    it('should reject direct processInstallUpgrade calls without agent at blueprint_design', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      state.players[playerId].techCards = ['maybach_engine'];
      state.groundBoard = { placements: {} }; // No agents placed

      expect(() => {
        processInstallUpgrade(state, playerId, {
          slotType: 'drive',
          slotIndex: 0,
          upgradeId: 'maybach_engine'
        });
      }).toThrow(/must place an agent at Blueprint Design|PLACE_AGENT/);
    });

    it('should reject direct processRemoveUpgrade calls during reveal phase', () => {
      const state = createTestGameState();
      state.phase = 'reveal';

      const playerId = '1';
      state.players[playerId].blueprint.driveSlots[0] = 'maybach_engine';

      expect(() => {
        processRemoveUpgrade(state, playerId, {
          slotType: 'drive',
          slotIndex: 0
        });
      }).toThrow(/Actions execute immediately when placing an agent|Section 5\.1/);
    });

    it('should reject direct processRemoveUpgrade calls without agent at blueprint_design', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      state.players[playerId].blueprint.driveSlots[0] = 'maybach_engine';
      state.groundBoard = { placements: {} }; // No agents placed

      expect(() => {
        processRemoveUpgrade(state, playerId, {
          slotType: 'drive',
          slotIndex: 0
        });
      }).toThrow(/must place an agent at Blueprint Design|PLACE_AGENT/);
    });

    it('should allow internal calls with _internal flag', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.age = 1;

      const playerId = '1';
      const playerState = state.players[playerId];
      // maybach_engine technology unlocks maybach_cx upgrade
      playerState.techCards = ['maybach_engine'];
      // Clear the drive slot for this test (testBlueprint has a drive installed)
      playerState.blueprint.driveSlots[0] = null;

      // Internal call bypasses agent placement validation
      const result = processInstallUpgrade(state, playerId, {
        slotType: 'drive',
        slotIndex: 0,
        upgradeId: 'maybach_cx',
        _internal: true
      });

      expect(result.newState.players[playerId].blueprint.driveSlots[0]).toBe('maybach_cx');
    });
  });
});
