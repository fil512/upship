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
      state.players['1'].technologies = ['duralumin_girders'];
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
      state.players['1'].technologies = ['duralumin_girders'];
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
      state.players['1'].technologies = ['daimler_engine'];
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
      state.players['1'].technologies = ['goldbeater_skin'];
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
      state.players['1'].technologies = ['duralumin_girders'];
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

  describe('GAP-033: Design Bureau swap limit', () => {
    it('should track swaps used during Design Bureau visit', () => {
      const state = createTestGameState();
      state.age = 1;

      // Germany has 2 swap limit
      state.players['1'].faction = 'germany';
      state.players['1'].technologies = ['duralumin_girders', 'daimler_engine'];
      state.players['1'].swapsUsedThisVisit = 0;
      state.players['1'].blueprint.frameSlots = [null];
      state.players['1'].blueprint.driveSlots = [null];

      // First swap
      processInstallUpgrade(state, '1', { slotType: 'frame', slotIndex: 0, upgradeId: 'duralumin_frame', _internal: true });
      expect(state.players['1'].swapsUsedThisVisit).toBe(1);

      // Second swap
      processInstallUpgrade(state, '1', { slotType: 'drive', slotIndex: 0, upgradeId: 'basic_engine', _internal: true });
      expect(state.players['1'].swapsUsedThisVisit).toBe(2);
    });

    it('should reject third swap for normal faction with 2 swap limit', () => {
      const state = createTestGameState();
      state.age = 1;

      // Germany has 2 swap limit
      state.players['1'].faction = 'germany';
      state.players['1'].technologies = ['duralumin_girders', 'daimler_engine', 'goldbeater_skin'];
      state.players['1'].upgradeSwaps = 2;
      state.players['1'].swapsUsedThisVisit = 2;  // Already used 2 swaps
      state.players['1'].blueprint.fabricSlots = [null];

      // Third swap should fail
      expect(() => {
        processInstallUpgrade(state, '1', { slotType: 'fabric', slotIndex: 0, upgradeId: 'premium_envelope', _internal: true });
      }).toThrow(/swap limit|limit reached|maximum/i);
    });

    it('should allow Italy 4 swaps per visit per Section 13.4', () => {
      const state = createTestGameState();
      state.age = 1;

      // Italy has 4 swap limit (Rapid Refit)
      state.players['4'].faction = 'italy';
      state.players['4'].technologies = ['internal_keel', 'rubberized_cotton', 'daimler_engine', 'passenger_gondola'];
      state.players['4'].upgradeSwaps = 4;
      state.players['4'].swapsUsedThisVisit = 3;  // Used 3 swaps
      state.players['4'].blueprint.driveSlots = [null];

      // Fourth swap should succeed for Italy
      const result = processInstallUpgrade(state, '4', { slotType: 'drive', slotIndex: 0, upgradeId: 'basic_engine', _internal: true });
      expect(result.newState.players['4'].swapsUsedThisVisit).toBe(4);
    });

    it('should reject second swap for Britain per Section 13.2', () => {
      const state = createTestGameState();
      state.age = 1;

      // Britain has 1 swap limit (Red Tape)
      state.players['2'].faction = 'britain';
      state.players['2'].technologies = ['wire_bracing', 'doped_canvas'];
      state.players['2'].upgradeSwaps = 1;
      state.players['2'].swapsUsedThisVisit = 1;  // Already used 1 swap
      state.players['2'].blueprint.fabricSlots = [null];

      // Second swap should fail for Britain
      expect(() => {
        processInstallUpgrade(state, '2', { slotType: 'fabric', slotIndex: 0, upgradeId: 'doped_covering', _internal: true });
      }).toThrow(/swap limit|limit reached|maximum/i);
    });
  });

  describe('GAP-047: Modular Frame extra swaps', () => {
    it('should grant +2 swaps when Modular Frame is installed in frameSlots', () => {
      const state = createTestGameState();
      state.age = 3; // Age III for modular frame

      // Germany with standard 2 swaps
      state.players['1'].faction = 'germany';
      state.players['1'].technologies = ['modular_construction', 'daimler_engine', 'improved_propeller', 'dual_engine_mount'];
      state.players['1'].upgradeSwaps = 2;  // Base swaps
      state.players['1'].swapsUsedThisVisit = 0;

      // Modular Frame installed - should get +2 swaps
      state.players['1'].blueprint.frameSlots = ['modular_frame', null];
      state.players['1'].blueprint.driveSlots = [null, null];

      // First swap
      processInstallUpgrade(state, '1', { slotType: 'drive', slotIndex: 0, upgradeId: 'basic_engine', _internal: true });
      expect(state.players['1'].swapsUsedThisVisit).toBe(1);

      // Second swap
      processInstallUpgrade(state, '1', { slotType: 'drive', slotIndex: 1, upgradeId: 'efficient_propeller', _internal: true });
      expect(state.players['1'].swapsUsedThisVisit).toBe(2);

      // Third swap - would normally fail, but modular frame grants +2
      // Need to clear and reinstall for third swap
      processRemoveUpgrade(state, '1', { slotType: 'drive', slotIndex: 0, _internal: true });
      expect(state.players['1'].swapsUsedThisVisit).toBe(3);

      // Fourth swap - still within limit (2 + 2 = 4)
      processInstallUpgrade(state, '1', { slotType: 'drive', slotIndex: 0, upgradeId: 'twin_engine', _internal: true });
      expect(state.players['1'].swapsUsedThisVisit).toBe(4);
    });

    it('should reject fifth swap when base is 2 and Modular Frame adds 2', () => {
      const state = createTestGameState();
      state.age = 3;

      // Germany with standard 2 swaps + 2 from modular frame = 4 total
      state.players['1'].faction = 'germany';
      state.players['1'].technologies = ['modular_construction', 'daimler_engine'];
      state.players['1'].upgradeSwaps = 2;
      state.players['1'].swapsUsedThisVisit = 4;  // Already used all 4 swaps

      // Modular Frame installed
      state.players['1'].blueprint.frameSlots = ['modular_frame', null];
      state.players['1'].blueprint.driveSlots = [null, null];

      // Fifth swap should fail
      expect(() => {
        processInstallUpgrade(state, '1', { slotType: 'drive', slotIndex: 0, upgradeId: 'basic_engine', _internal: true });
      }).toThrow(/swap limit|limit reached|maximum/i);
    });

    it('should NOT grant extra swaps if Modular Frame is not installed', () => {
      const state = createTestGameState();
      state.age = 3;

      // Germany with standard 2 swaps, no modular frame
      state.players['1'].faction = 'germany';
      state.players['1'].technologies = ['duralumin_girders', 'daimler_engine', 'improved_propeller'];
      state.players['1'].upgradeSwaps = 2;
      state.players['1'].swapsUsedThisVisit = 2;  // Already used 2 swaps

      // No Modular Frame - just regular frame
      state.players['1'].blueprint.frameSlots = ['duralumin_frame', null];
      state.players['1'].blueprint.driveSlots = [null, null];

      // Third swap should fail without modular frame
      expect(() => {
        processInstallUpgrade(state, '1', { slotType: 'drive', slotIndex: 0, upgradeId: 'basic_engine', _internal: true });
      }).toThrow(/swap limit|limit reached|maximum/i);
    });
  });
});
