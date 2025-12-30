/**
 * Rules Compliance Tests - Design Bureau
 *
 * Per Section 6.2: Modify your Blueprint.
 * Cost: Free.
 * Limit: 2 swaps per visit (Italy gets 4; Modular Frame grants +2; Mechanic cards +1).
 * Each swap is one installation or removal.
 *
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processPlaceAgent } = require('../../../server/actions/worker');
const { processInstallUpgrade, processRemoveUpgrade } = require('../../../server/actions/blueprint');

describe('Rules Compliance - Design Bureau (Section 6.2)', () => {

  describe('Atomic Execution: Blueprint modifications during agent placement', () => {
    it('should install an upgrade when placing at design_bureau with swaps array', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.age = 1;

      const playerId = '1'; // Germany
      const playerState = state.players[playerId];

      // Add required technology (maybach_engine tech unlocks maybach_cx upgrade)
      playerState.technologies = ['maybach_engine'];
      playerState.agentsRemaining = 2;

      // Set up a card with wrench symbol for design_bureau
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

      // Place agent at design_bureau with one install swap
      // Note: maybach_cx upgrade requires maybach_engine technology
      const result = processPlaceAgent(state, playerId, {
        locationId: 'design_bureau',
        cardIndex: 0,
        swaps: JSON.stringify([{
          action: 'install',
          slotType: 'drive',
          slotIndex: 0,
          upgradeId: 'maybach_cx'
        }])
      });

      // Upgrade should be installed
      expect(result.newState.players[playerId].blueprint.driveSlots[0]).toBe('maybach_cx');
    });

    it('should handle multiple swaps in one visit', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.age = 1;

      const playerId = '1';
      const playerState = state.players[playerId];

      // Install an existing upgrade to remove (basic_engine requires daimler_engine tech)
      playerState.blueprint.driveSlots[0] = 'basic_engine';
      // Add required technologies
      playerState.technologies = ['daimler_engine', 'maybach_engine'];
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

      // Place agent with 2 swaps: remove old, install new
      // maybach_cx upgrade requires maybach_engine technology
      const result = processPlaceAgent(state, playerId, {
        locationId: 'design_bureau',
        cardIndex: 0,
        swaps: JSON.stringify([
          { action: 'remove', slotType: 'drive', slotIndex: 0 },
          { action: 'install', slotType: 'drive', slotIndex: 0, upgradeId: 'maybach_cx' }
        ])
      });

      expect(result.newState.players[playerId].blueprint.driveSlots[0]).toBe('maybach_cx');
    });

    it('should enforce swap limit (2 for Germany/USA)', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.age = 1;

      const playerId = '1';
      const playerState = state.players[playerId];

      // Technologies that unlock the upgrades we want to install
      // daimler_engine -> basic_engine, maybach_engine -> maybach_cx, improved_propeller -> efficient_propeller
      playerState.technologies = ['daimler_engine', 'maybach_engine', 'improved_propeller'];
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

      // Try 3 swaps (should fail on 3rd due to limit of 2)
      const result = processPlaceAgent(state, playerId, {
        locationId: 'design_bureau',
        cardIndex: 0,
        swaps: JSON.stringify([
          { action: 'install', slotType: 'drive', slotIndex: 0, upgradeId: 'basic_engine' },
          { action: 'install', slotType: 'drive', slotIndex: 1, upgradeId: 'maybach_cx' },
          { action: 'install', slotType: 'drive', slotIndex: 2, upgradeId: 'efficient_propeller' }
        ])
      });

      // First 2 should succeed, 3rd should fail
      expect(result.newState.players[playerId].blueprint.driveSlots[0]).toBe('basic_engine');
      expect(result.newState.players[playerId].blueprint.driveSlots[1]).toBe('maybach_cx');
      // 3rd should NOT be installed
      expect(result.newState.players[playerId].blueprint.driveSlots[2]).toBeNull();
      // Log should contain warning about swap limit
      const warningLog = result.newState.log.find(l => l.type === 'warning' && l.message.includes('swap limit'));
      expect(warningLog).toBeDefined();
    });

    it('should allow 0 swaps (just visit location)', () => {
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

      // Place with no swaps
      const result = processPlaceAgent(state, playerId, {
        locationId: 'design_bureau',
        cardIndex: 0,
        swaps: JSON.stringify([])
      });

      // Should succeed (just visited)
      expect(result.newState.groundBoard.placements.design_bureau).toBeDefined();
    });

    it('should handle missing swaps param as visiting without modifications', () => {
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

      // Place without swaps param
      const result = processPlaceAgent(state, playerId, {
        locationId: 'design_bureau',
        cardIndex: 0
      });

      // Should succeed (just visited)
      expect(result.newState.groundBoard.placements.design_bureau).toBeDefined();
    });
  });

  describe('Direct API Call Rejection', () => {
    it('should reject direct processInstallUpgrade calls during reveal phase', () => {
      const state = createTestGameState();
      state.phase = 'reveal';

      const playerId = '1';
      state.players[playerId].technologies = ['maybach_engine'];

      expect(() => {
        processInstallUpgrade(state, playerId, {
          slotType: 'drive',
          slotIndex: 0,
          upgradeId: 'maybach_engine'
        });
      }).toThrow(/Actions execute immediately when placing an agent|Section 5\.1/);
    });

    it('should reject direct processInstallUpgrade calls without agent at design_bureau', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      state.players[playerId].technologies = ['maybach_engine'];
      state.groundBoard = { placements: {} }; // No agents placed

      expect(() => {
        processInstallUpgrade(state, playerId, {
          slotType: 'drive',
          slotIndex: 0,
          upgradeId: 'maybach_engine'
        });
      }).toThrow(/must place an agent at Design Bureau|PLACE_AGENT/);
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

    it('should reject direct processRemoveUpgrade calls without agent at design_bureau', () => {
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
      }).toThrow(/must place an agent at Design Bureau|PLACE_AGENT/);
    });

    it('should allow internal calls with _internal flag', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.age = 1;

      const playerId = '1';
      const playerState = state.players[playerId];
      // maybach_engine technology unlocks maybach_cx upgrade
      playerState.technologies = ['maybach_engine'];

      // Internal call bypasses validation
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
