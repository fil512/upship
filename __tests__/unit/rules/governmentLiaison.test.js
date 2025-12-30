/**
 * Rules Compliance Tests - Government Liaison
 *
 * Per Section 6.8: Send officers to secure government backing.
 * Cost: 1-3 Officers (from Barracks to shared supply)
 * Effect: Increase your Income Track by 1 step per Officer spent.
 *
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processPlaceAgent } = require('../../../server/actions/worker');
const { processGovernmentLiaison } = require('../../../server/actions/crew');

describe('Rules Compliance - Government Liaison (Section 6.8)', () => {

  describe('Atomic Execution: Officers spent for income during agent placement', () => {
    it('should spend officers and increase income when placing at government_liaison', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1'; // Germany
      const playerState = state.players[playerId];

      playerState.officers = 3;
      playerState.income = 5;
      const initialOfficers = playerState.officers;
      const initialIncome = playerState.income;
      playerState.agentsRemaining = 2;

      // Set up a card with coin symbol for government_liaison
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

      // Place agent at government_liaison spending 2 officers
      const result = processPlaceAgent(state, playerId, {
        locationId: 'government_liaison',
        cardIndex: 0,
        officerCount: 2
      });

      // Officers should decrease by 2
      expect(result.newState.players[playerId].officers).toBe(initialOfficers - 2);
      // Income should increase by 2
      expect(result.newState.players[playerId].income).toBe(initialIncome + 2);
    });

    it('should allow spending 1 officer for 1 income', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];

      playerState.officers = 2;
      playerState.income = 5;
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
        locationId: 'government_liaison',
        cardIndex: 0,
        officerCount: 1
      });

      expect(result.newState.players[playerId].officers).toBe(1);
      expect(result.newState.players[playerId].income).toBe(6);
    });

    it('should allow spending 3 officers for 3 income', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];

      playerState.officers = 5;
      playerState.income = 3;
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
        locationId: 'government_liaison',
        cardIndex: 0,
        officerCount: 3
      });

      expect(result.newState.players[playerId].officers).toBe(2);
      expect(result.newState.players[playerId].income).toBe(6);
    });

    it('should fail if player does not have enough officers', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];

      playerState.officers = 1; // Not enough for 2
      playerState.income = 5;
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
        locationId: 'government_liaison',
        cardIndex: 0,
        officerCount: 2
      });

      // Agent placement happens but action fails
      expect(result.newState.groundBoard.placements.government_liaison).toBeDefined();
      // Officers and income should NOT have changed
      expect(result.newState.players[playerId].officers).toBe(1);
      expect(result.newState.players[playerId].income).toBe(5);
      // Log should contain error
      const errorLog = result.newState.log.find(l => l.type === 'warning');
      expect(errorLog).toBeDefined();
    });

    it('should require officerCount parameter', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];

      playerState.officers = 3;
      playerState.income = 5;
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

      // No officerCount parameter
      const result = processPlaceAgent(state, playerId, {
        locationId: 'government_liaison',
        cardIndex: 0
      });

      // Placement succeeds but action fails
      expect(result.newState.groundBoard.placements.government_liaison).toBeDefined();
      // Log should contain error about missing parameters
      const errorLog = result.newState.log.find(l =>
        l.type === 'warning' && l.message.includes('officerCount')
      );
      expect(errorLog).toBeDefined();
    });

    it('should reject officerCount of 0 or more than 3', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];

      playerState.officers = 5;
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

      // Officer count of 4 (more than max 3)
      const result = processPlaceAgent(state, playerId, {
        locationId: 'government_liaison',
        cardIndex: 0,
        officerCount: 4
      });

      // Action should fail
      const errorLog = result.newState.log.find(l => l.type === 'warning');
      expect(errorLog).toBeDefined();
      expect(errorLog.message).toMatch(/1-3|must spend/i);
    });
  });

  describe('Direct API Call Rejection', () => {
    it('should reject direct processGovernmentLiaison calls during reveal phase', () => {
      const state = createTestGameState();
      state.phase = 'reveal';

      const playerId = '1';
      state.players[playerId].officers = 3;

      expect(() => {
        processGovernmentLiaison(state, playerId, { officerCount: 1 });
      }).toThrow(/Actions execute immediately when placing an agent|Section 5\.1/);
    });

    it('should reject direct calls without agent at government_liaison', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      state.players[playerId].officers = 3;
      state.groundBoard = { placements: {} }; // No agents placed

      expect(() => {
        processGovernmentLiaison(state, playerId, { officerCount: 1 });
      }).toThrow(/must place an agent at Government Liaison|PLACE_AGENT/);
    });

    it('should allow internal calls with _internal flag', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];
      playerState.officers = 3;
      playerState.income = 5;

      // Internal call bypasses validation
      const result = processGovernmentLiaison(state, playerId, {
        officerCount: 2,
        _internal: true
      });

      expect(result.newState.players[playerId].officers).toBe(1);
      expect(result.newState.players[playerId].income).toBe(7);
    });
  });
});
