/**
 * Rules Compliance Tests - Academy (RECRUIT_CREW)
 *
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 * This tests that:
 * 1. Crew recruitment happens atomically during agent placement
 * 2. Direct RECRUIT_CREW calls are rejected (must go through PLACE_AGENT)
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processPlaceAgent } = require('../../../server/actions/worker');
const { processRecruitCrew } = require('../../../server/actions/crew');

describe('Rules Compliance - Academy (Section 5.1)', () => {

  describe('Atomic Execution: Crew recruitment during agent placement', () => {
    it('should recruit crew immediately when placing agent at academy', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1'; // Germany
      const playerState = state.players[playerId];

      // Ensure player has cash and hand
      playerState.cash = 20;
      const initialCash = playerState.cash;
      const initialOfficers = playerState.officers || 0;
      playerState.agentsRemaining = 2;

      // Set up a card with coin symbol for academy
      playerState.hand = [{
        id: 'test-card',
        name: 'Test Card',
        symbol: 'coin'
      }];

      // Set current placer
      state.workerPlacement = {
        currentPlacerIndex: 0,
        passedPlayers: [],
        ministryVisitors: []
      };
      state.playerOrder = [playerId];
      state.groundBoard = { placements: {} };

      // Place agent at academy with crew parameters
      const result = processPlaceAgent(state, playerId, {
        locationId: 'academy',
        cardIndex: 0,
        crewType: 'officer',
        crewCount: 2
      });

      // Officer cost is £2 each per constants (OFFICER_RECRUIT_COST = 2)
      const officerCost = 2;
      const expectedCost = officerCost * 2; // 2 officers × £2 = £4

      // Crew should be recruited immediately
      expect(result.newState.players[playerId].officers).toBe(initialOfficers + 2);
      expect(result.newState.players[playerId].cash).toBe(initialCash - expectedCost);
    });

    it('should recruit engineers when specified', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];

      playerState.cash = 20;
      const initialEngineers = playerState.engineers || 0;
      playerState.agentsRemaining = 2;

      playerState.hand = [{
        id: 'test-card',
        name: 'Test Card',
        symbol: 'coin'
      }];

      state.workerPlacement = {
        currentPlacerIndex: 0,
        passedPlayers: [],
        ministryVisitors: []
      };
      state.playerOrder = [playerId];
      state.groundBoard = { placements: {} };

      const result = processPlaceAgent(state, playerId, {
        locationId: 'academy',
        cardIndex: 0,
        crewType: 'engineer',
        crewCount: 3
      });

      // Engineer cost is £3 each per constants
      expect(result.newState.players[playerId].engineers).toBe(initialEngineers + 3);
    });

    it('should fail placement if player cannot afford crew', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];

      playerState.cash = 3; // Not enough for 2 officers at £2 each (£4 total)
      playerState.agentsRemaining = 2;

      playerState.hand = [{
        id: 'test-card',
        name: 'Test Card',
        symbol: 'coin'
      }];

      state.workerPlacement = {
        currentPlacerIndex: 0,
        passedPlayers: [],
        ministryVisitors: []
      };
      state.playerOrder = [playerId];
      state.groundBoard = { placements: {} };

      // Should fail - placement still happens but error is logged
      const result = processPlaceAgent(state, playerId, {
        locationId: 'academy',
        cardIndex: 0,
        crewType: 'officer',
        crewCount: 2
      });

      // Agent placement happens but crew recruitment fails
      expect(result.newState.groundBoard.placements.academy).toBeDefined();
      // Officers should NOT have increased
      expect(result.newState.players[playerId].officers).toBe(playerState.officers);
      // Log should contain error
      const errorLog = result.newState.log.find(l => l.type === 'warning');
      expect(errorLog).toBeDefined();
    });

    it('should require crewType and crewCount parameters', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];

      playerState.cash = 20;
      playerState.agentsRemaining = 2;

      playerState.hand = [{
        id: 'test-card',
        name: 'Test Card',
        symbol: 'coin'
      }];

      state.workerPlacement = {
        currentPlacerIndex: 0,
        passedPlayers: [],
        ministryVisitors: []
      };
      state.playerOrder = [playerId];
      state.groundBoard = { placements: {} };

      // Place without parameters
      const result = processPlaceAgent(state, playerId, {
        locationId: 'academy',
        cardIndex: 0
        // No crewType or crewCount
      });

      // Placement succeeds but action fails
      expect(result.newState.groundBoard.placements.academy).toBeDefined();
      // Log should contain error about missing parameters
      const errorLog = result.newState.log.find(l =>
        l.type === 'warning' && l.message.includes('crewType')
      );
      expect(errorLog).toBeDefined();
    });
  });

  describe('Direct API Call Rejection', () => {
    it('should reject direct RECRUIT_CREW calls during reveal phase', () => {
      const state = createTestGameState();
      state.phase = 'reveal';

      const playerId = '1';
      state.players[playerId].cash = 20;

      expect(() => {
        processRecruitCrew(state, playerId, {
          crewType: 'officer',
          count: 1
        });
      }).toThrow(/Actions execute immediately when placing an agent|Section 5\.1/);
    });

    it('should reject direct RECRUIT_CREW calls without agent at academy', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      state.players[playerId].cash = 20;
      state.groundBoard = { placements: {} }; // No agents placed

      expect(() => {
        processRecruitCrew(state, playerId, {
          crewType: 'officer',
          count: 1
        });
      }).toThrow(/must place an agent at Academy|PLACE_AGENT/);
    });

    it('should reject direct RECRUIT_CREW calls when another player has agent at academy', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      state.players[playerId].cash = 20;

      // Another player has agent at academy
      state.groundBoard = {
        placements: {
          academy: { playerId: '2', cardUsed: 'Some Card' }
        }
      };

      expect(() => {
        processRecruitCrew(state, playerId, {
          crewType: 'officer',
          count: 1
        });
      }).toThrow(/must place an agent at Academy|PLACE_AGENT/);
    });

    it('should allow internal calls with _internal flag', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];
      playerState.cash = 20;
      const initialOfficers = playerState.officers || 0;

      // Internal call bypasses validation (used by executeLocationAction)
      const result = processRecruitCrew(state, playerId, {
        crewType: 'officer',
        count: 2,
        _internal: true
      });

      expect(result.newState.players[playerId].officers).toBe(initialOfficers + 2);
    });
  });
});
