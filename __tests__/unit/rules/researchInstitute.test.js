/**
 * Rules Compliance Tests - Research Institute
 *
 * Per Section 6.1: Expand your research program.
 * Cost: £4 per level.
 * Effect: Increase your Research Level Track by 1 step.
 *
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processPlaceAgent } = require('../../../server/actions/worker');
const { processUpgradeResearchLevel } = require('../../../server/actions/technology');

describe('Rules Compliance - Research Institute (Section 6.1)', () => {

  describe('Atomic Execution: Research Level upgraded during agent placement', () => {
    it('should upgrade research level by 1 when placing at research_institute with default levels', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1'; // Germany
      const playerState = state.players[playerId];

      playerState.cash = 20;
      playerState.researchLevel = 0;
      const initialCash = playerState.cash;
      const initialResearchLevel = playerState.researchLevel;
      playerState.agentsRemaining = 2;

      // Set up a card with coin symbol for research_institute
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

      // Place agent at research_institute (default 1 level)
      const result = processPlaceAgent(state, playerId, {
        locationId: 'research_institute',
        cardIndex: 0
      });

      // Should spend £4 for 1 level
      expect(result.newState.players[playerId].cash).toBe(initialCash - 4);
      // Research Level should increase by 1
      expect(result.newState.players[playerId].researchLevel).toBe(initialResearchLevel + 1);
    });

    it('should upgrade research level by multiple levels when levels param provided', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];

      playerState.cash = 20;
      playerState.researchLevel = 1;
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

      // Place agent at research_institute with levels=2
      const result = processPlaceAgent(state, playerId, {
        locationId: 'research_institute',
        cardIndex: 0,
        levels: 2
      });

      // Should spend £8 for 2 levels
      expect(result.newState.players[playerId].cash).toBe(20 - 8);
      // Research Level should increase by 2
      expect(result.newState.players[playerId].researchLevel).toBe(1 + 2);
    });

    it('should fail if player cannot afford the upgrade', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];

      playerState.cash = 3; // Less than £4 needed
      playerState.researchLevel = 0;
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
        locationId: 'research_institute',
        cardIndex: 0
      });

      // Placement succeeds but action fails
      expect(result.newState.groundBoard.placements.research_institute).toBeDefined();
      // Cash should NOT have changed
      expect(result.newState.players[playerId].cash).toBe(3);
      // Research Level should NOT have changed
      expect(result.newState.players[playerId].researchLevel).toBe(0);
      // Log should contain error
      const errorLog = result.newState.log.find(l => l.type === 'warning');
      expect(errorLog).toBeDefined();
    });

    it('should work with levels=0 as a no-op (just visit location)', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];

      playerState.cash = 20;
      playerState.researchLevel = 2;
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

      // Place agent at research_institute with levels=0
      const result = processPlaceAgent(state, playerId, {
        locationId: 'research_institute',
        cardIndex: 0,
        levels: 0
      });

      // No cost, no change
      expect(result.newState.players[playerId].cash).toBe(20);
      expect(result.newState.players[playerId].researchLevel).toBe(2);
    });
  });

  describe('Direct API Call Rejection', () => {
    it('should reject direct processUpgradeResearchLevel calls during reveal phase', () => {
      const state = createTestGameState();
      state.phase = 'reveal';

      const playerId = '1';
      state.players[playerId].cash = 20;

      expect(() => {
        processUpgradeResearchLevel(state, playerId, { levels: 1 });
      }).toThrow(/Actions execute immediately when placing an agent|Section 5\.1/);
    });

    it('should reject direct calls without agent at research_institute', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      state.players[playerId].cash = 20;
      state.groundBoard = { placements: {} }; // No agents placed

      expect(() => {
        processUpgradeResearchLevel(state, playerId, { levels: 1 });
      }).toThrow(/must place an agent at Research Institute|PLACE_AGENT/);
    });

    it('should reject direct calls when another player has agent at research_institute', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      state.players[playerId].cash = 20;
      state.groundBoard = {
        placements: {
          research_institute: { playerId: '2', cardId: 'other-card' }
        }
      };

      expect(() => {
        processUpgradeResearchLevel(state, playerId, { levels: 1 });
      }).toThrow(/must place an agent at Research Institute|PLACE_AGENT/);
    });

    it('should allow internal calls with _internal flag', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      const playerState = state.players[playerId];
      playerState.cash = 20;
      playerState.researchLevel = 1;

      // Internal call bypasses validation
      const result = processUpgradeResearchLevel(state, playerId, {
        levels: 2,
        _internal: true
      });

      expect(result.newState.players[playerId].cash).toBe(20 - 8);
      expect(result.newState.players[playerId].researchLevel).toBe(3);
    });
  });
});
