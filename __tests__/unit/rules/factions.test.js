/**
 * Rules Compliance Tests - Factions
 * Tests for correct implementation of Section 13 (Faction-specific rules)
 */

const { createTestGameState, createTestPlayerState } = require('../../fixtures/testData');
const { processLaunchShip } = require('../../../server/actions/launch');
const { processRespondToHazard } = require('../../../server/actions/hazard');
const { processBuyGas } = require('../../../server/actions/gas');

describe('Rules Compliance - Factions', () => {

  describe('GAP-021: Helium Handling technology ID matching', () => {
    it('should allow USA to use helium with helium_handling technology (lowercase)', () => {
      const state = createTestGameState();

      // USA starts with 'helium_handling' technology (lowercase)
      const usaPlayer = state.players['3'];  // USA is player 3 in test fixture
      expect(usaPlayer.faction).toBe('usa');
      expect(usaPlayer.techCards).toContain('helium_handling');

      // Set up state for launch
      usaPlayer.gasCubes = { hydrogen: 0, helium: 3 };
      usaPlayer.officers = 1;
      usaPlayer.hangarShips = 1;
      usaPlayer.blueprint = {
        age: 1,
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['synthetic_envelope'],
        driveSlots: ['reliable_engine'],  // USA's starting drive (speed 1, range 1)
        componentSlots: [null]
      };

      // Route should be claimable
      state.map.routes[0].claimed = null;

      // Step 1: LAUNCH_SHIP - USA should be able to launch with helium
      const launchResult = processLaunchShip(state, '3', {
        routeId: 'route_1',
        gasType: 'helium',
        _internal: true
      });

      // Ship should be in pendingLaunch with hazardInfo
      expect(launchResult.newState.players['3'].pendingLaunch).toBeDefined();
      expect(launchResult.newState.players['3'].pendingLaunch.hazardInfo).toBeDefined();

      // Step 2: RESPOND_TO_HAZARD
      const hazardResult = processRespondToHazard(launchResult.newState, '3', {
        spendEngineers: true
      });

      // Route claimed after hazard check passes, pendingLaunch cleared
      expect(hazardResult.newState.players['3'].pendingLaunch).toBeUndefined();
      expect(hazardResult.newState.map.routes[0].claimed).toBe('3');
    });

    it('should allow USA to buy helium with helium_handling technology (lowercase)', () => {
      const state = createTestGameState();

      // USA starts with 'helium_handling' technology (lowercase)
      const usaPlayer = state.players['3'];
      expect(usaPlayer.faction).toBe('usa');
      expect(usaPlayer.techCards).toContain('helium_handling');

      // Set up state for buying gas
      usaPlayer.cash = 20;
      usaPlayer.gasCubes = { hydrogen: 0, helium: 0 };

      // USA should be able to buy helium
      // Use _internal: true since gas buying now goes through PLACE_AGENT
      const result = processBuyGas(state, '3', {
        gasType: 'helium',
        amount: 2,
        _internal: true
      });

      expect(result.newState.players['3'].gasCubes.helium).toBe(2);
    });

    it('should reject helium use for players without helium_handling technology', () => {
      const state = createTestGameState();

      // Germany player does not have helium_handling
      const germanyPlayer = state.players['1'];
      expect(germanyPlayer.faction).toBe('germany');
      expect(germanyPlayer.techCards).not.toContain('helium_handling');

      // Set up state for launch
      germanyPlayer.gasCubes = { hydrogen: 0, helium: 3 };
      germanyPlayer.officers = 1;
      germanyPlayer.hangarShips = 1;

      state.map.routes[0].claimed = null;

      // Germany should NOT be able to launch with helium
      expect(() => {
        processLaunchShip(state, '1', {
          routeId: 'route_1',
          gasType: 'helium',
          _internal: true
        });
      }).toThrow(/Helium Handling tech card/);
    });
  });

  describe('GAP-025: Italy Compact Design flaw at Age transitions', () => {
    it('should give Italy one fewer Payload slot in Age II per Section 13.4', () => {
      const state = createTestGameState();
      state.age = 1;

      // Find Italy player (player 4)
      const italyPlayer = state.players['4'];
      expect(italyPlayer.faction).toBe('italy');

      // Set up Age I blueprint for Italy (1/1/1/1)
      italyPlayer.blueprint = {
        age: 1,
        frameSlots: ['semi_rigid_keel'],
        fabricSlots: ['cotton_envelope'],
        driveSlots: [null],
        componentSlots: [null]
      };

      // Import and call age transition
      const { performAgeTransition } = require('../../../server/actions/helpers/ageTransition');
      performAgeTransition(state, 2);

      // Italy should have 1/1/2/1 in Age II per Section 13.5
      // (one fewer payload slot: 1 instead of 2)
      expect(italyPlayer.blueprint.frameSlots.length).toBe(1);
      expect(italyPlayer.blueprint.fabricSlots.length).toBe(1);
      expect(italyPlayer.blueprint.driveSlots.length).toBe(2);
      expect(italyPlayer.blueprint.componentSlots.length).toBe(1); // 1 instead of 2
    });

    it('should give Italy one fewer Payload slot in Age III per Section 13.4', () => {
      const state = createTestGameState();
      state.age = 2;

      // Find Italy player (player 4)
      const italyPlayer = state.players['4'];
      expect(italyPlayer.faction).toBe('italy');

      // Set up Age II blueprint for Italy (1/1/2/1)
      italyPlayer.blueprint = {
        age: 2,
        frameSlots: ['semi_rigid_keel'],
        fabricSlots: ['cotton_envelope'],
        driveSlots: [null, null],
        componentSlots: [null]
      };

      // Import and call age transition
      const { performAgeTransition } = require('../../../server/actions/helpers/ageTransition');
      performAgeTransition(state, 3);

      // Italy should have 2/2/2/2 in Age III per Section 13.5
      // (one fewer payload slot: 2 instead of 3)
      expect(italyPlayer.blueprint.frameSlots.length).toBe(2);
      expect(italyPlayer.blueprint.fabricSlots.length).toBe(2);
      expect(italyPlayer.blueprint.driveSlots.length).toBe(2);
      expect(italyPlayer.blueprint.componentSlots.length).toBe(2); // 2 instead of 3
    });

    it('should NOT reduce payload slots for non-Italy factions', () => {
      const state = createTestGameState();
      state.age = 1;

      // Germany player (player 1)
      const germanyPlayer = state.players['1'];
      expect(germanyPlayer.faction).toBe('germany');

      germanyPlayer.blueprint = {
        age: 1,
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope'],
        driveSlots: [null],
        componentSlots: [null]
      };

      const { performAgeTransition } = require('../../../server/actions/helpers/ageTransition');
      performAgeTransition(state, 2);

      // Germany should have normal 1/1/2/2 in Age II
      expect(germanyPlayer.blueprint.componentSlots.length).toBe(2);
    });
  });

  describe('GAP-026: Germany Blaugas Fuel System effect', () => {
    it('should allow Germany to retain gas cubes by paying £2 per Section 13.1', () => {
      const state = createTestGameState();
      const germanyPlayer = state.players['1'];
      expect(germanyPlayer.faction).toBe('germany');

      // Germany has blaugas_storage in starting technologies
      expect(germanyPlayer.techCards).toContain('blaugas_storage');

      // Set up state for launch with retain option
      germanyPlayer.gasCubes = { hydrogen: 3, helium: 0 };
      germanyPlayer.cash = 20;
      germanyPlayer.officers = 1;
      germanyPlayer.ships = [{ id: 'ship1', status: 'hangar' }];

      state.map.routes[0].claimed = null;

      const { processLaunchShip } = require('../../../server/actions/launch');

      // Launch with retainGas option
      const result = processLaunchShip(state, '1', {
        routeId: 'route_1',
        gasType: 'hydrogen',
        retainGas: true, // Germany can use Blaugas to retain gas
        _internal: true
      });

      // Gas cubes should be retained (started with 3, used ~1, paid £2 to keep)
      // Actually the gas is kept entirely, so should still have 3
      expect(result.newState.players['1'].gasCubes.hydrogen).toBe(3);
      // Cash should be reduced by £2 for Blaugas effect
      expect(result.newState.players['1'].cash).toBe(18);
    });

    it('should NOT allow non-Germany to use retainGas', () => {
      const state = createTestGameState();
      const britainPlayer = state.players['2'];
      expect(britainPlayer.faction).toBe('britain');

      // Britain does not have blaugas_storage
      expect(britainPlayer.techCards).not.toContain('blaugas_storage');

      britainPlayer.gasCubes = { hydrogen: 3, helium: 0 };
      britainPlayer.cash = 20;
      britainPlayer.officers = 1;
      britainPlayer.ships = [{ id: 'ship1', status: 'hangar' }];
      britainPlayer.blueprint = {
        age: 1,
        frameSlots: ['tensioned_frame'],
        fabricSlots: ['doped_covering'],
        driveSlots: ['standard_engine'],  // Britain's starting drive (speed 1, range 1)
        componentSlots: [null]
      };

      state.map.routes[0].claimed = null;

      const { processLaunchShip } = require('../../../server/actions/launch');

      expect(() => {
        processLaunchShip(state, '2', {
          routeId: 'route_1',
          gasType: 'hydrogen',
          retainGas: true,
          _internal: true
        });
      }).toThrow(/Blaugas|retainGas/i);
    });

    it('should consume gas normally if Germany does not opt for retainGas', () => {
      const state = createTestGameState();
      const germanyPlayer = state.players['1'];
      expect(germanyPlayer.faction).toBe('germany');

      germanyPlayer.gasCubes = { hydrogen: 3, helium: 0 };
      germanyPlayer.cash = 20;
      germanyPlayer.officers = 1;
      germanyPlayer.ships = [{ id: 'ship1', status: 'hangar' }];

      state.map.routes[0].claimed = null;

      const { processLaunchShip } = require('../../../server/actions/launch');

      // Launch WITHOUT retainGas option
      const result = processLaunchShip(state, '1', {
        routeId: 'route_1',
        gasType: 'hydrogen',
        _internal: true
        // retainGas NOT specified - default behavior
      });

      // Gas cubes should be consumed (used 1 cube)
      expect(result.newState.players['1'].gasCubes.hydrogen).toBeLessThan(3);
      // Cash should be same (no Blaugas fee)
      expect(result.newState.players['1'].cash).toBe(20);
    });
  });
});
