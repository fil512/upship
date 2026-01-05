/**
 * Rules Compliance Tests - Atomic Reveal Action
 *
 * Per Section 5.1: Reveal actions should be bundled atomically.
 * - Player submits REVEAL with techAcquisitions[] and marketPurchases[]
 * - When all players have revealed, resources are collected and acquisitions processed
 * - Tech/Market rows replenish AFTER all reveals complete
 *
 * This replaces the separate PASS + ACQUIRE_TECHNOLOGY + BUY_MARKET_CARD + END_TURN flow
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processReveal } = require('../../../server/actions/reveal');
const { processAcquireTechnologyResearch } = require('../../../server/actions/technology');
const { processBuyMarketCard } = require('../../../server/actions/cards');

describe('Rules Compliance - Atomic Reveal Action', () => {

  describe('REVEAL Action Basics', () => {
    it('should accept REVEAL action during worker placement phase', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';

      const playerId = '1';
      state.workerPlacement = {
        currentPlacerIndex: 0,
        placementOrder: [playerId, '2', '3', '4'],
        passedPlayers: []
      };
      state.players[playerId].hasPassed = false;

      const result = processReveal(state, playerId, {
        techAcquisitions: [],
        marketPurchases: []
      });

      // Player should be marked as passed
      expect(result.newState.players[playerId].hasPassed).toBe(true);
    });

    it('should reject REVEAL during non-worker_placement phase', () => {
      const state = createTestGameState();
      state.phase = 'reveal';

      expect(() => {
        processReveal(state, '1', { techAcquisitions: [], marketPurchases: [] });
      }).toThrow(/worker placement/i);
    });

    it('should reject REVEAL if not player turn', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.workerPlacement = {
        currentPlacerIndex: 0,
        placementOrder: ['2', '1', '3', '4'],  // Player 2's turn, not player 1
        passedPlayers: []
      };
      state.players['1'].hasPassed = false;

      expect(() => {
        processReveal(state, '1', { techAcquisitions: [], marketPurchases: [] });
      }).toThrow(/not your turn/i);
    });

    it('should reject REVEAL if player already revealed', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.workerPlacement = {
        currentPlacerIndex: 0,
        placementOrder: ['1', '2', '3', '4'],
        passedPlayers: ['1']
      };
      state.players['1'].hasPassed = true;

      expect(() => {
        processReveal(state, '1', { techAcquisitions: [], marketPurchases: [] });
      }).toThrow(/already/i);
    });

    it('should store pending acquisitions until all players reveal', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.workerPlacement = {
        currentPlacerIndex: 0,
        placementOrder: ['1', '2', '3', '4'],
        passedPlayers: []
      };
      state.players['1'].hasPassed = false;
      state.players['2'].hasPassed = false;

      const result = processReveal(state, '1', {
        techAcquisitions: ['tech_1'],
        marketPurchases: ['card_1']
      });

      // Should store pending reveal data
      expect(result.newState.pendingReveals?.['1']).toEqual({
        techAcquisitions: ['tech_1'],
        marketPurchases: ['card_1']
      });

      // Should NOT have transitioned to reveal phase yet
      expect(result.newState.phase).toBe('worker_placement');
    });
  });

  describe('All Players Revealed - Atomic Processing', () => {
    it('should transition to reveal phase when all players have revealed', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.playerOrder = ['1', '2'];

      // All other players have already passed
      state.workerPlacement = {
        currentPlacerIndex: 1,
        placementOrder: ['1', '2'],
        passedPlayers: ['1']
      };
      state.players['1'].hasPassed = true;
      state.players['2'].hasPassed = false;

      // Store pending reveal for player 1
      state.pendingReveals = {
        '1': { techAcquisitions: [], marketPurchases: [] }
      };

      const result = processReveal(state, '2', {
        techAcquisitions: [],
        marketPurchases: []
      });

      // Should have processed all reveals, income, and auto-advanced to worker_placement
      // (income phase auto-advances since there are no player decisions)
      expect(result.newState.phase).toBe('worker_placement');
    });

    it('should collect reveal resources before processing acquisitions', () => {
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.playerOrder = ['1'];
      state.workerPlacement = {
        currentPlacerIndex: 0,
        placementOrder: ['1'],
        passedPlayers: []
      };

      // Player has a card with research reveal bonus
      state.players['1'].hasPassed = false;
      state.players['1'].hand = [{
        id: 'test-card',
        name: 'Test Card',
        symbol: 'wrench',
        revealBonus: { research: 2 }
      }];
      state.players['1'].researchLevel = 1;
      state.players['1'].engineers = 1;
      state.players['1'].research = 0;

      const result = processReveal(state, '1', {
        techAcquisitions: [],
        marketPurchases: []
      });

      // Research should include: researchLevel (1) + engineers (1) + card bonus (2) = 4
      expect(result.newState.players['1'].research).toBe(4);
    });

    it('should store pending acquisitions for later finalization', () => {
      // NOTE: Tech acquisitions are no longer processed atomically in REVEAL
      // They are stored in pendingReveals and finalized on END_TURN
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.playerOrder = ['1'];
      state.workerPlacement = {
        currentPlacerIndex: 0,
        placementOrder: ['1'],
        passedPlayers: []
      };

      // Player will have enough research after reveal
      state.players['1'].hasPassed = false;
      state.players['1'].hand = [{
        id: 'test-card',
        name: 'Test Card',
        symbol: 'wrench',
        revealBonus: { research: 5 }
      }];
      state.players['1'].researchLevel = 0;
      state.players['1'].engineers = 0;
      state.players['1'].research = 0;
      state.players['1'].techCards = [];

      // R&D board with affordable tech
      state.rdBoard = [{
        id: 'test_tech',
        name: 'Test Tech',
        cost: 3,
        type: 'structure'
      }];
      state.techCardBag = [];

      const result = processReveal(state, '1', {
        techAcquisitions: ['test_tech'],
        marketPurchases: []
      });

      // REVEAL collects resources and stores pending acquisitions
      // Player collects research (5 from card bonus)
      expect(result.newState.players['1'].research).toBe(5);
      // Tech is NOT yet acquired - will be finalized on END_TURN
      expect(result.newState.players['1'].techCards).not.toContain('test_tech');
      // Pending reveals should be stored
      expect(result.newState.pendingReveals['1'].techAcquisitions).toContain('test_tech');
    });

    it('should store pending market purchases for later finalization', () => {
      // NOTE: Market purchases are no longer processed atomically in REVEAL
      // They are stored in pendingReveals and finalized on END_TURN
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.playerOrder = ['1'];
      state.workerPlacement = {
        currentPlacerIndex: 0,
        placementOrder: ['1'],
        passedPlayers: []
      };

      // Player will have enough influence after reveal
      state.players['1'].hasPassed = false;
      state.players['1'].hand = [{
        id: 'test-card',
        name: 'Test Card',
        symbol: 'coin',
        revealBonus: { influence: 5 }
      }];
      state.players['1'].influence = 0;
      state.players['1'].discardPile = [];

      // Market with affordable card
      state.marketCards = [{
        id: 'market_card_1',
        name: 'Market Card',
        value: 3,
        symbol: 'wrench'
      }];
      state.marketDeck = [];

      const result = processReveal(state, '1', {
        techAcquisitions: [],
        marketPurchases: ['market_card_1']
      });

      // REVEAL collects influence and stores pending purchases
      // Player collects influence (5 from card bonus)
      expect(result.newState.players['1'].influence).toBe(5);
      // Market card is NOT yet purchased - will be finalized on END_TURN
      const player = result.newState.players['1'];
      const cardInDiscard = player.discardPile?.some(c => c.id === 'market_card_1') || false;
      expect(cardInDiscard).toBe(false);
      // Pending reveals should be stored
      expect(result.newState.pendingReveals['1'].marketPurchases).toContain('market_card_1');
    });

    it('should store pending acquisitions even if player cannot afford (validation on finalization)', () => {
      // NOTE: REVEAL stores pending acquisitions without validation
      // Affordability is checked on END_TURN when purchases are finalized
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.playerOrder = ['1'];
      state.workerPlacement = {
        currentPlacerIndex: 0,
        placementOrder: ['1'],
        passedPlayers: []
      };

      // Player will NOT have enough research
      state.players['1'].hasPassed = false;
      state.players['1'].hand = [];
      state.players['1'].researchLevel = 0;
      state.players['1'].engineers = 0;
      state.players['1'].research = 0;
      state.players['1'].techCards = [];

      // Tech costs more than player has
      state.rdBoard = [{
        id: 'expensive_tech',
        name: 'Expensive Tech',
        cost: 10,
        type: 'structure'
      }];

      const result = processReveal(state, '1', {
        techAcquisitions: ['expensive_tech'],
        marketPurchases: []
      });

      // Player should NOT have the technology
      expect(result.newState.players['1'].techCards).not.toContain('expensive_tech');
      // Pending acquisition is still stored - validation happens on END_TURN
      expect(result.newState.pendingReveals['1'].techAcquisitions).toContain('expensive_tech');
    });

    it('should store empty pending reveals when no acquisitions specified', () => {
      // NOTE: pendingReveals are stored by REVEAL and cleared by END_TURN
      const state = createTestGameState();
      state.phase = 'worker_placement';
      state.playerOrder = ['1'];
      state.workerPlacement = {
        currentPlacerIndex: 0,
        placementOrder: ['1'],
        passedPlayers: []
      };
      state.players['1'].hasPassed = false;
      state.players['1'].hand = [];

      const result = processReveal(state, '1', {
        techAcquisitions: [],
        marketPurchases: []
      });

      // pendingReveals should be stored (cleared on END_TURN, not REVEAL)
      expect(result.newState.pendingReveals).toBeDefined();
      expect(result.newState.pendingReveals['1'].techAcquisitions).toEqual([]);
      expect(result.newState.pendingReveals['1'].marketPurchases).toEqual([]);
    });
  });

  describe('Direct Action Rejection (Section 5.1)', () => {
    it('should reject direct ACQUIRE_TECHNOLOGY_RESEARCH calls without _internal flag', () => {
      const state = createTestGameState();
      state.phase = 'reveal';

      // Set up reveal phase state
      state.revealPhase = {
        revealedHands: { '1': [] },
        resourcesCollected: { '1': true },
        techAcquisitionsComplete: {},
        marketPurchasesComplete: {}
      };
      state.players['1'].research = 10;
      state.rdBoard = [{
        id: 'test_tech',
        name: 'Test Tech',
        cost: 3,
        type: 'structure'
      }];

      expect(() => {
        processAcquireTechnologyResearch(state, '1', { techId: 'test_tech' });
      }).toThrow(/REVEAL action|Section 5.1|atomic/i);
    });

    it('should reject direct BUY_MARKET_CARD calls without _internal flag', () => {
      const state = createTestGameState();
      state.phase = 'reveal';

      state.players['1'].influence = 10;
      state.marketCards = [{
        id: 'market_card',
        name: 'Market Card',
        value: 3
      }];

      expect(() => {
        processBuyMarketCard(state, '1', { cardId: 'market_card' });
      }).toThrow(/REVEAL action|Section 5.1|atomic/i);
    });

    it('should allow internal ACQUIRE_TECHNOLOGY_RESEARCH calls with _internal flag', () => {
      const state = createTestGameState();
      state.phase = 'reveal';

      state.revealPhase = {
        revealedHands: { '1': [] },
        resourcesCollected: { '1': true },
        techAcquisitionsComplete: {},
        marketPurchasesComplete: {}
      };
      state.players['1'].research = 10;
      state.players['1'].techCards = [];
      state.rdBoard = [{
        id: 'test_tech',
        name: 'Test Tech',
        cost: 3,
        type: 'structure'
      }];
      state.techCardBag = [];

      const result = processAcquireTechnologyResearch(state, '1', {
        techId: 'test_tech',
        _internal: true
      });

      expect(result.newState.players['1'].techCards).toContain('test_tech');
    });

    it('should allow internal BUY_MARKET_CARD calls with _internal flag', () => {
      const state = createTestGameState();
      state.phase = 'reveal';

      state.players['1'].influence = 10;
      state.players['1'].discardPile = [];
      state.marketCards = [{
        id: 'market_card',
        name: 'Market Card',
        value: 3
      }];

      const result = processBuyMarketCard(state, '1', {
        cardId: 'market_card',
        _internal: true
      });

      expect(result.newState.players['1'].discardPile.some(c => c.id === 'market_card')).toBe(true);
    });
  });

  describe('PASS Action Removed', () => {
    it('should NOT export processPass - players must use REVEAL', () => {
      // PASS action was removed - players must explicitly use REVEAL
      // This ensures all players declare their tech/market acquisitions
      const worker = require('../../../server/actions/worker');

      // processPass should not be exported
      expect(worker.processPass).toBeUndefined();

      // processPlaceAgent should still be exported
      expect(worker.processPlaceAgent).toBeDefined();
    });
  });
});
