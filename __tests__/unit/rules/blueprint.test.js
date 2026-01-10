/**
 * Rules Compliance Tests - Blueprint System
 * Tests for correct implementation of Section 6.2, 6.3 (Blueprint Design and Hull Upgrade Rule)
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processInstallUpgrade, processRemoveUpgrade, calculateHullCost } = require('../../../server/actions/blueprint');

describe('Rules Compliance - Blueprint System', () => {

  describe('Retrofit Cost (formerly Hull Upgrade Rule)', () => {
    it('should charge retrofit cost when upgrading Frame with ships in hangar', () => {
      const state = createTestGameState();
      state.age = 1;

      // Give player required tech and cash
      state.players['1'].techCards = ['duralumin_girders'];
      state.players['1'].cash = 100;

      // Old frame has hull cost 0 (null slot)
      // New frame duralumin_frame has hullCost: 1
      state.players['1'].blueprint.frameSlots = [null];
      state.players['1'].blueprint.fabricSlots = ['premium_envelope']; // cost 3
      // Use ship tracking: hangarShips counter
      state.players['1'].hangarShips = 2;

      // Install a frame upgrade
      processInstallUpgrade(state, '1', { slotType: 'frame', slotIndex: 0, upgradeId: 'duralumin_frame', _internal: true });

      // Hull cost increase is 1 (duralumin_frame hullCost) - 0 (null slot) = 1
      // With 2 ships in hangar: 1 * 2 = 2
      // Cash should be 100 - 2 = 98
      expect(state.players['1'].cash).toBe(98);
    });

    it('should NOT charge when upgrading Frame with no ships in hangar', () => {
      const state = createTestGameState();
      state.age = 1;

      // Give player required tech and cash
      state.players['1'].techCards = ['duralumin_girders'];
      state.players['1'].cash = 100;

      // Clear frame slot, NO ships in hangar
      state.players['1'].blueprint.frameSlots = [null];
      state.players['1'].hangarShips = 0;

      processInstallUpgrade(state, '1', { slotType: 'frame', slotIndex: 0, upgradeId: 'duralumin_frame', _internal: true });

      // Should not charge extra - cash unchanged (installing upgrade is free at Blueprint Design)
      expect(state.players['1'].cash).toBe(100);
    });

    it('should charge retrofit cost for ALL slot types including drive', () => {
      const state = createTestGameState();
      state.age = 1;

      // Give player required tech and cash
      state.players['1'].techCards = ['daimler_engine'];
      state.players['1'].cash = 100;

      // Ships in hangar - retrofit cost applies to ALL slot types
      state.players['1'].blueprint.driveSlots = [null];
      state.players['1'].hangarShips = 1;

      // Drive slot upgrade - basic_engine has hullCost 1
      processInstallUpgrade(state, '1', { slotType: 'drive', slotIndex: 0, upgradeId: 'basic_engine', _internal: true });

      // Retrofit cost: 1 (new cost) - 0 (old cost) = 1, with 1 ship = £1
      expect(state.players['1'].cash).toBe(99);
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
      state.players['1'].hangarShips = 1;

      // Install fabric upgrade
      processInstallUpgrade(state, '1', { slotType: 'fabric', slotIndex: 0, upgradeId: 'premium_envelope', _internal: true });

      // Hull cost increase is 3, with 1 ship: 3 * 1 = 3
      // Cash should be 100 - 3 = 97
      expect(state.players['1'].cash).toBe(97);
    });

    it('should charge retrofit cost for multiple hangar ships', () => {
      const state = createTestGameState();
      state.age = 1;

      // Give player required tech and cash
      state.players['1'].techCards = ['duralumin_girders'];
      state.players['1'].cash = 100;

      // 2 ships in hangar to retrofit
      state.players['1'].blueprint.frameSlots = [null];
      state.players['1'].hangarShips = 2;

      // duralumin_frame has hullCost: 1
      processInstallUpgrade(state, '1', { slotType: 'frame', slotIndex: 0, upgradeId: 'duralumin_frame', _internal: true });

      // Hull cost increase is 1 (duralumin_frame hullCost) - 0 (null slot) = 1
      // With 2 hangar ships: 1 * 2 = 2
      expect(state.players['1'].cash).toBe(98);
    });

    it('should reject upgrade if player cannot afford retrofit cost', () => {
      const state = createTestGameState();
      state.age = 1;

      // Give player required tech but not enough cash
      // premium_envelope has hullCost: 3
      // With 2 ships: 3 * 2 = 6, need at least £6
      state.players['1'].techCards = ['goldbeater_skin'];
      state.players['1'].cash = 5;  // Not enough for 2 ships * 3 cost = 6

      state.players['1'].blueprint.frameSlots = [null];
      state.players['1'].blueprint.fabricSlots = [null];
      state.players['1'].hangarShips = 2;

      // The InsufficientFundsError includes "Not enough" which matches our pattern
      expect(() => {
        processInstallUpgrade(state, '1', { slotType: 'fabric', slotIndex: 0, upgradeId: 'premium_envelope', _internal: true });
      }).toThrow(/Not enough|insufficient|afford|cash/i);
    });
  });

  // NOTE: Blueprint Design allows unlimited blueprint modifications per visit
});
