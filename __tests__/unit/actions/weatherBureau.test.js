/**
 * Weather Bureau Multi-Step Flow Tests
 *
 * Tests the Weather Bureau flow:
 *   PLACE_AGENT(weather_bureau) → KEEP_HAZARD or DISCARD_HAZARD
 */

const { processPlaceAgent } = require('../../../server/actions/worker');
const { processKeepHazard, processDiscardHazard } = require('../../../server/actions/cards');
const { GameRuleError } = require('../../../server/errors');

describe('Weather Bureau Multi-Step Flow', () => {
  let mockState;
  const playerId = 'player1';

  beforeEach(() => {
    mockState = {
      phase: 'worker_placement',
      playerOrder: [playerId, 'player2'],
      players: {
        [playerId]: {
          faction: 'germany',
          cash: 10,
          agents: 2,
          agentsRemaining: 2,
          hasPassed: false,
          hand: [
            { name: 'Pilot', symbol: 'propeller', effect: 'None' }  // Weather Bureau requires propeller
          ],
          deck: [],
          discardPile: [],
          hazardDeck: [
            { id: 'hazard1', type: 'engine_fire', difficulty: 3 },
            { id: 'hazard2', type: 'storm', difficulty: 2 }
          ]
        },
        player2: {
          faction: 'britain',
          agents: 2,
          agentsRemaining: 2,
          hasPassed: false
        }
      },
      groundBoard: {
        placements: {}
      },
      workerPlacement: {
        passedPlayers: [],
        ministryVisitors: [],
        placementOrder: [playerId, 'player2'],
        currentPlacerIndex: 0
      },
      log: []
    };
  });

  describe('PLACE_AGENT at Weather Bureau', () => {
    it('should set peekedHazard and NOT advance turn', () => {
      const result = processPlaceAgent(mockState, playerId, {
        locationId: 'weather_bureau',
        cardIndex: 0
      });

      expect(result.newState.players[playerId].peekedHazard).toMatchObject({
        type: 'engine_fire',
        difficulty: 3
      });
      // Turn should NOT advance - player must choose KEEP or DISCARD
      expect(result.newState.workerPlacement.currentPlacerIndex).toBe(0);
    });

    it('should deduct Weather Bureau cost', () => {
      const initialCash = mockState.players[playerId].cash;
      const result = processPlaceAgent(mockState, playerId, {
        locationId: 'weather_bureau',
        cardIndex: 0
      });

      expect(result.newState.players[playerId].cash).toBe(initialCash - 2);
    });

    it('should fail if player cannot afford Weather Bureau', () => {
      mockState.players[playerId].cash = 1;

      // The action itself will succeed but the location action will fail
      const result = processPlaceAgent(mockState, playerId, {
        locationId: 'weather_bureau',
        cardIndex: 0
      });

      // Check that the location action failure is logged in the debug log
      const debugLog = result.newState.log.find(l =>
        l.type === 'debug' && l.message.includes('Not enough cash')
      );
      expect(debugLog).toBeDefined();

      // peekedHazard should NOT be set
      expect(result.newState.players[playerId].peekedHazard).toBeUndefined();
    });
  });

  describe('KEEP_HAZARD action', () => {
    beforeEach(() => {
      // Set up state as if player just visited Weather Bureau
      mockState.players[playerId].peekedHazard = {
        id: 'hazard1',
        type: 'engine_fire',
        difficulty: 3
      };
    });

    it('should clear peekedHazard', () => {
      const result = processKeepHazard(mockState, playerId, {});

      expect(result.newState.players[playerId].peekedHazard).toBeUndefined();
    });

    it('should NOT modify hazard deck', () => {
      const originalDeckLength = mockState.players[playerId].hazardDeck.length;
      const result = processKeepHazard(mockState, playerId, {});

      expect(result.newState.players[playerId].hazardDeck.length).toBe(originalDeckLength);
    });

    it('should advance to next player', () => {
      const result = processKeepHazard(mockState, playerId, {});

      expect(result.newState.workerPlacement.currentPlacerIndex).toBe(1);
    });

    it('should throw if no peeked hazard', () => {
      delete mockState.players[playerId].peekedHazard;

      expect(() => {
        processKeepHazard(mockState, playerId, {});
      }).toThrow(GameRuleError);
    });
  });

  describe('DISCARD_HAZARD action', () => {
    beforeEach(() => {
      // Set up state as if player just visited Weather Bureau
      mockState.players[playerId].peekedHazard = {
        id: 'hazard1',
        type: 'engine_fire',
        difficulty: 3
      };
    });

    it('should clear peekedHazard', () => {
      const result = processDiscardHazard(mockState, playerId, {});

      expect(result.newState.players[playerId].peekedHazard).toBeUndefined();
    });

    it('should remove top card from hazard deck', () => {
      const originalDeckLength = mockState.players[playerId].hazardDeck.length;
      const result = processDiscardHazard(mockState, playerId, {});

      expect(result.newState.players[playerId].hazardDeck.length).toBe(originalDeckLength - 1);
      // The storm card should now be on top
      expect(result.newState.players[playerId].hazardDeck[0].type).toBe('storm');
    });

    it('should advance to next player', () => {
      const result = processDiscardHazard(mockState, playerId, {});

      expect(result.newState.workerPlacement.currentPlacerIndex).toBe(1);
    });

    it('should throw if no peeked hazard', () => {
      delete mockState.players[playerId].peekedHazard;

      expect(() => {
        processDiscardHazard(mockState, playerId, {});
      }).toThrow(GameRuleError);
    });
  });
});
