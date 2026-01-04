/**
 * Ministry Multi-Step Flow Tests
 *
 * Tests the Ministry flow:
 *   PLACE_AGENT(ministry) → DISCARD_MINISTRY_CARD
 */

const { processPlaceAgent } = require('../../../server/actions/worker');
const { processDiscardMinistryCard } = require('../../../server/actions/cards');
const { GameRuleError } = require('../../../server/errors');

describe('Ministry Multi-Step Flow', () => {
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
            { name: 'Clerk', symbol: 'propeller', effect: 'Gain £1' }
          ],
          deck: [
            { name: 'Navigator', symbol: 'wrench' },
            { name: 'Rigger', symbol: 'coin' }
          ],
          discardPile: []
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
      gasMarket: {
        hydrogen: 5,
        helium: 10
      },
      log: []
    };
  });

  describe('PLACE_AGENT at Ministry', () => {
    it('should draw 2 cards to drawnMinistryCards', () => {
      const result = processPlaceAgent(mockState, playerId, {
        locationId: 'ministry',
        cardIndex: 0
      });

      expect(result.newState.players[playerId].drawnMinistryCards).toHaveLength(2);
      expect(result.newState.players[playerId].drawnMinistryCards[0].name).toBe('Rigger');
      expect(result.newState.players[playerId].drawnMinistryCards[1].name).toBe('Navigator');
    });

    it('should NOT add cards to hand directly', () => {
      const initialHandSize = mockState.players[playerId].hand.length;
      const result = processPlaceAgent(mockState, playerId, {
        locationId: 'ministry',
        cardIndex: 0
      });

      // Hand should only have lost the card used for placement
      expect(result.newState.players[playerId].hand.length).toBe(initialHandSize - 1);
    });

    it('should NOT advance turn', () => {
      const result = processPlaceAgent(mockState, playerId, {
        locationId: 'ministry',
        cardIndex: 0
      });

      // Turn should NOT advance - player must choose which card to discard
      expect(result.newState.workerPlacement.currentPlacerIndex).toBe(0);
    });

    it('should reduce helium market price', () => {
      const initialHeliumPrice = mockState.gasMarket.helium;
      const result = processPlaceAgent(mockState, playerId, {
        locationId: 'ministry',
        cardIndex: 0
      });

      expect(result.newState.gasMarket.helium).toBeLessThan(initialHeliumPrice);
    });

    it('should set firstPlayer token', () => {
      const result = processPlaceAgent(mockState, playerId, {
        locationId: 'ministry',
        cardIndex: 0
      });

      expect(result.newState.firstPlayer).toBe(playerId);
    });
  });

  describe('DISCARD_MINISTRY_CARD action', () => {
    beforeEach(() => {
      // Set up state as if player just visited Ministry
      mockState.players[playerId].drawnMinistryCards = [
        { name: 'Navigator', symbol: 'wrench' },
        { name: 'Rigger', symbol: 'coin' }
      ];
    });

    it('should keep card at other index', () => {
      const result = processDiscardMinistryCard(mockState, playerId, { cardIndex: 0 });

      // Should keep Rigger (index 1)
      expect(result.newState.players[playerId].hand).toContainEqual(
        expect.objectContaining({ name: 'Rigger' })
      );
    });

    it('should discard card at specified index', () => {
      const result = processDiscardMinistryCard(mockState, playerId, { cardIndex: 0 });

      // Should discard Navigator (index 0)
      expect(result.newState.players[playerId].discardPile).toContainEqual(
        expect.objectContaining({ name: 'Navigator' })
      );
    });

    it('should clear drawnMinistryCards', () => {
      const result = processDiscardMinistryCard(mockState, playerId, { cardIndex: 0 });

      expect(result.newState.players[playerId].drawnMinistryCards).toBeUndefined();
    });

    it('should advance to next player', () => {
      const result = processDiscardMinistryCard(mockState, playerId, { cardIndex: 0 });

      expect(result.newState.workerPlacement.currentPlacerIndex).toBe(1);
    });

    it('should work with cardIndex 1', () => {
      const result = processDiscardMinistryCard(mockState, playerId, { cardIndex: 1 });

      // Should keep Navigator (index 0)
      expect(result.newState.players[playerId].hand).toContainEqual(
        expect.objectContaining({ name: 'Navigator' })
      );
      // Should discard Rigger (index 1)
      expect(result.newState.players[playerId].discardPile).toContainEqual(
        expect.objectContaining({ name: 'Rigger' })
      );
    });

    it('should throw if no drawn ministry cards', () => {
      delete mockState.players[playerId].drawnMinistryCards;

      expect(() => {
        processDiscardMinistryCard(mockState, playerId, { cardIndex: 0 });
      }).toThrow(GameRuleError);
    });

    it('should throw if cardIndex is invalid', () => {
      expect(() => {
        processDiscardMinistryCard(mockState, playerId, { cardIndex: 5 });
      }).toThrow(GameRuleError);
    });

    it('should throw if cardIndex is negative', () => {
      expect(() => {
        processDiscardMinistryCard(mockState, playerId, { cardIndex: -1 });
      }).toThrow(GameRuleError);
    });
  });
});
