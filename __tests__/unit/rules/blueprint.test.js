/**
 * Rules Compliance Tests - Blueprint System
 * Tests for correct implementation of Section 6.2, 6.3 (Design Bureau and Hull Upgrade Rule)
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processInstallUpgrade, processRemoveUpgrade, calculateHullCost } = require('../../../server/actions/blueprint');

describe('Rules Compliance - Blueprint System', () => {

  describe('GAP-032: Hull Upgrade Rule', () => {
    it('should charge hull cost difference when upgrading Frame with ships in hangar', () => {
      const state = createTestGameState();
      state.age = 1;

      // Give player required tech and cash
      state.players['1'].techCards = ['duralumin_girders'];
      state.players['1'].cash = 100;

      // Old frame has hull cost 0 (null slot)
      // New frame has hull cost 2 (duralumin_frame)
      state.players['1'].blueprint.frameSlots = [null];
      state.players['1'].blueprint.fabricSlots = ['premium_envelope']; // cost 1
      state.players['1'].ships = [
        { id: 'ship1', status: 'hangar' },
        { id: 'ship2', status: 'hangar' }
      ];

      // Install a frame upgrade that costs £2
      processInstallUpgrade(state, '1', { slotType: 'frame', slotIndex: 0, upgradeId: 'duralumin_frame', _internal: true });

      // Hull cost increase is 2 (new frame cost) - 0 (old frame cost) = 2
      // With 2 ships in hangar: 2 * 2 = 4
      // Cash should be 100 - 4 = 96
      expect(state.players['1'].cash).toBe(96);
    });

    it('should NOT charge when upgrading Frame with no ships in hangar', () => {
      const state = createTestGameState();
      state.age = 1;

      // Give player required tech and cash
      state.players['1'].techCards = ['duralumin_girders'];
      state.players['1'].cash = 100;

      // Clear frame slot, NO ships in hangar
      state.players['1'].blueprint.frameSlots = [null];
      state.players['1'].ships = [
        { id: 'ship1', status: 'on_route' }  // On route, not hangar
      ];

      processInstallUpgrade(state, '1', { slotType: 'frame', slotIndex: 0, upgradeId: 'duralumin_frame', _internal: true });

      // Should not charge extra - cash unchanged (installing upgrade is free at Design Bureau)
      expect(state.players['1'].cash).toBe(100);
    });

    it('should NOT charge when upgrading non-structural slots', () => {
      const state = createTestGameState();
      state.age = 1;

      // Give player required tech and cash
      state.players['1'].techCards = ['daimler_engine'];
      state.players['1'].cash = 100;

      // Ships in hangar
      state.players['1'].blueprint.driveSlots = [null];
      state.players['1'].ships = [
        { id: 'ship1', status: 'hangar' }
      ];

      // Drive slot upgrade - should NOT trigger hull cost charge
      processInstallUpgrade(state, '1', { slotType: 'drive', slotIndex: 0, upgradeId: 'basic_engine', _internal: true });

      // No hull cost charge for drive upgrades
      expect(state.players['1'].cash).toBe(100);
    });

    it('should charge when upgrading Fabric with ships in hangar', () => {
      const state = createTestGameState();
      state.age = 1;

      // Give player required tech and cash
      state.players['1'].techCards = ['goldbeater_skin'];
      state.players['1'].cash = 100;

      // Clear fabric slot and put ships in hangar
      // Old fabric has hull cost 0 (null)
      // New fabric (premium_envelope) has hull cost 3 per the UPGRADES data
      state.players['1'].blueprint.frameSlots = [null]; // No frame installed
      state.players['1'].blueprint.fabricSlots = [null];
      state.players['1'].ships = [
        { id: 'ship1', status: 'hangar' }
      ];

      // Install fabric upgrade
      processInstallUpgrade(state, '1', { slotType: 'fabric', slotIndex: 0, upgradeId: 'premium_envelope', _internal: true });

      // Hull cost increase is 3, with 1 ship: 3 * 1 = 3
      // Cash should be 100 - 3 = 97
      expect(state.players['1'].cash).toBe(97);
    });

    it('should reject upgrade if player cannot afford hull cost difference', () => {
      const state = createTestGameState();
      state.age = 1;

      // Give player required tech but not enough cash
      state.players['1'].techCards = ['duralumin_girders'];
      state.players['1'].cash = 3;  // Not enough for 2 ships * 2 cost = 4

      state.players['1'].blueprint.frameSlots = [null];
      state.players['1'].blueprint.fabricSlots = [null];
      state.players['1'].ships = [
        { id: 'ship1', status: 'hangar' },
        { id: 'ship2', status: 'hangar' }
      ];

      // The InsufficientFundsError includes "Not enough" which matches our pattern
      expect(() => {
        processInstallUpgrade(state, '1', { slotType: 'frame', slotIndex: 0, upgradeId: 'duralumin_frame', _internal: true });
      }).toThrow(/Not enough|insufficient|afford|cash/i);
    });
  });

  // NOTE: Design Bureau allows unlimited blueprint modifications per visit
});
