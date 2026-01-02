/**
 * Rules Compliance Tests - Launchpad
 *
 * Per Section 6.4: The Launchpad is a multi-step location.
 * - Place agent to enable launching
 * - Can launch multiple ships while at launchpad
 * - Call NO_MORE_LAUNCHES to signal completion and advance turn
 *
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processPlaceAgent } = require('../../../server/actions/worker');
const { processLaunchShip, processNoMoreLaunches } = require('../../../server/actions/launch');

describe('Rules Compliance - Launchpad (Section 6.4)', () => {

  describe('Launchpad Activation', () => {
    it('should set launchpadActive when placing at launchpad', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1'; // Germany
      const playerState = state.players[playerId];

      playerState.agentsRemaining = 2;

      // Set up a card with propeller symbol for launchpad
      playerState.hand = [{
        id: 'test-card',
        name: 'Test Card',
        symbol: 'propeller'
      }];

      state.workerPlacement = {
        currentPlacerIndex: 0,
        passedPlayers: [],
        ministryVisitors: []
      };
      state.playerOrder = [playerId, '2'];  // Two players to test turn advance
      state.groundBoard = { placements: {} };

      // Place agent at launchpad
      const result = processPlaceAgent(state, playerId, {
        locationId: 'launchpad',
        cardIndex: 0
      });

      // Launchpad should be active for this player
      expect(result.newState.launchpadActive?.[playerId]).toBe(true);

      // Turn should NOT have advanced (still player 1's turn to launch)
      expect(result.newState.workerPlacement.currentPlacerIndex).toBe(0);
    });

    it('should allow LAUNCH_SHIP when launchpad is active', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.age = 1;

      const playerId = '1';
      const playerState = state.players[playerId];

      // Set up player with resources to launch
      playerState.officers = 2;
      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.ships = [{ id: 'ship1', status: 'hangar' }];
      playerState.blueprint = {
        frameSlots: ['basic_frame'],
        fabricSlots: ['basic_envelope'],
        driveSlots: ['basic_engine'],
        componentSlots: [null]
      };
      playerState.techCards = ['duralumin_girders', 'rubberized_cotton', 'daimler_engine'];

      // Launchpad is active
      state.launchpadActive = { [playerId]: true };
      state.groundBoard = {
        placements: {
          launchpad: { playerId, cardUsed: 'Test Card' }
        }
      };

      // Set up a route to claim
      state.map = {
        routes: [{ id: 'route1', from: 'City A', to: 'City B', distance: 1, speed: 1, income: 2 }]
      };

      const result = processLaunchShip(state, playerId, {
        shipId: 'ship1',
        routeId: 'route1',
        gasType: 'hydrogen',
        _internal: true
      });

      // Ship should be awaiting_hazard (two-step flow: LAUNCH_SHIP then RESPOND_TO_HAZARD)
      expect(result.newState.players[playerId].ships[0].status).toBe('awaiting_hazard');
      expect(result.newState.players[playerId].ships[0].pendingHazard).toBeDefined();
    });
  });

  describe('NO_MORE_LAUNCHES Action', () => {
    it('should deactivate launchpad and advance turn', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      state.players[playerId].hasPassed = false;
      state.players[playerId].hand = [{ id: 'card1', symbol: 'propeller' }]; // Has cards
      state.players[playerId].agentsRemaining = 1; // Has agents

      // Launchpad is active
      state.launchpadActive = { [playerId]: true };
      state.groundBoard = {
        placements: {
          launchpad: { playerId, cardUsed: 'Test Card' }
        }
      };

      // Proper workerPlacement structure
      state.workerPlacement = {
        currentPlacerIndex: 0,
        passedPlayers: [],
        ministryVisitors: [],
        placementOrder: [playerId, '2']  // placementOrder is what advanceToNextPlacer uses
      };
      state.playerOrder = [playerId, '2'];

      const result = processNoMoreLaunches(state, playerId);

      // Launchpad should be deactivated
      expect(result.newState.launchpadActive?.[playerId]).toBeFalsy();

      // Turn should advance to next player
      expect(result.newState.workerPlacement.currentPlacerIndex).toBe(1);
    });

    it('should reject NO_MORE_LAUNCHES if launchpad not active', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      state.launchpadActive = {}; // Not active

      expect(() => {
        processNoMoreLaunches(state, playerId);
      }).toThrow(/launchpad|not active|not at/i);
    });
  });

  describe('Direct LAUNCH_SHIP Rejection', () => {
    it('should reject LAUNCH_SHIP if launchpad not active', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.age = 1;

      const playerId = '1';
      const playerState = state.players[playerId];

      playerState.officers = 2;
      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.ships = [{ id: 'ship1', status: 'hangar' }];
      playerState.blueprint = {
        frameSlots: ['basic_frame'],
        fabricSlots: ['basic_envelope'],
        driveSlots: ['basic_engine'],
        componentSlots: [null]
      };
      playerState.techCards = ['duralumin_girders', 'rubberized_cotton', 'daimler_engine'];

      // Launchpad is NOT active
      state.launchpadActive = {};
      state.groundBoard = { placements: {} };

      state.map = {
        routes: [{ id: 'route1', from: 'City A', to: 'City B', distance: 1, speed: 1, income: 2 }]
      };

      expect(() => {
        processLaunchShip(state, playerId, {
          shipId: 'ship1',
          routeId: 'route1',
          gasType: 'hydrogen'
        });
      }).toThrow(/launchpad|Section 5\.1|place.*agent/i);
    });

    it('should allow internal calls with _internal flag', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.age = 1;

      const playerId = '1';
      const playerState = state.players[playerId];

      playerState.officers = 2;
      playerState.gasCubes = { hydrogen: 3, helium: 0 };
      playerState.ships = [{ id: 'ship1', status: 'hangar' }];
      playerState.blueprint = {
        frameSlots: ['basic_frame'],
        fabricSlots: ['basic_envelope'],
        driveSlots: ['basic_engine'],
        componentSlots: [null]
      };
      playerState.techCards = ['duralumin_girders', 'rubberized_cotton', 'daimler_engine'];

      state.map = {
        routes: [{ id: 'route1', from: 'City A', to: 'City B', distance: 1, speed: 1, income: 2 }]
      };

      // Internal call bypasses launchpad check
      const result = processLaunchShip(state, playerId, {
        shipId: 'ship1',
        routeId: 'route1',
        gasType: 'hydrogen',
        _internal: true
      });

      // Ship should be awaiting_hazard (two-step flow: LAUNCH_SHIP then RESPOND_TO_HAZARD)
      expect(result.newState.players[playerId].ships[0].status).toBe('awaiting_hazard');
      expect(result.newState.players[playerId].ships[0].pendingHazard).toBeDefined();
    });
  });
});
