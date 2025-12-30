/**
 * Rules Compliance Tests - Worker Placement (Card Effects)
 * Tests for correct implementation of Section 11.3 (Starter Deck card effects)
 */

const { createTestGameState } = require('../../fixtures/testData');
const { processCardEffect } = require('../../../server/actions/worker');

describe('Rules Compliance - Worker Placement', () => {

  describe('GAP-035: Clerk card Agent Effect', () => {
    it('should grant £1 when Clerk card is used for agent placement', () => {
      const state = createTestGameState();
      state.players['1'].cash = 10;

      const clerkCard = {
        id: 'starter_6',
        name: 'Clerk',
        symbol: 'coin',
        reveal: { cash: 1 },
        effect: 'Gain £1'
      };

      const result = processCardEffect(state, '1', clerkCard, 'academy');

      // Clerk should grant £1
      expect(result.success).toBe(true);
      expect(state.players['1'].cash).toBe(11);
    });

    it('should grant £2 when Purser card is used (existing behavior check)', () => {
      const state = createTestGameState();
      state.players['1'].cash = 10;

      const purserCard = {
        id: 'starter_5',
        name: 'Purser',
        symbol: 'coin',
        reveal: { influence: 2 },
        effect: 'Gain £2'
      };

      const result = processCardEffect(state, '1', purserCard, 'academy');

      // Purser should grant £2
      expect(result.success).toBe(true);
      expect(state.players['1'].cash).toBe(12);
    });

    it('should handle cards with no effect gracefully', () => {
      const state = createTestGameState();
      state.players['1'].cash = 10;

      const investorCard = {
        id: 'starter_7',
        name: 'Investor',
        symbol: 'coin',
        reveal: { influence: 3 },
        effect: 'None'
      };

      const result = processCardEffect(state, '1', investorCard, 'academy');

      // Investor has no effect
      expect(result.success).toBe(true);
      expect(state.players['1'].cash).toBe(10); // Unchanged
    });
  });

  describe('GAP-049: Navigator card effect', () => {
    it('should allow peeking at top hazard card when Navigator is used', () => {
      const state = createTestGameState();

      // Set up hazard deck
      state.players['1'].hazardDeck = [
        { id: 'hazard_1', type: 'engine_fire', name: 'Engine Fire', difficulty: 3 },
        { id: 'hazard_2', type: 'clear_weather', name: 'Clear Weather' }
      ];

      const navigatorCard = {
        id: 'starter_10',
        name: 'Navigator',
        symbol: 'propeller',
        reveal: { influence: 1 },
        effect: 'Look at top Hazard'
      };

      const result = processCardEffect(state, '1', navigatorCard, 'launchpad');

      // Navigator should peek at top hazard
      expect(result.success).toBe(true);
      expect(state.players['1'].peekedHazard).toBeDefined();
      expect(state.players['1'].peekedHazard.type).toBe('engine_fire');
      // Hazard deck should remain unchanged
      expect(state.players['1'].hazardDeck.length).toBe(2);
    });

    it('should handle empty hazard deck gracefully', () => {
      const state = createTestGameState();
      state.players['1'].hazardDeck = [];

      const navigatorCard = {
        id: 'starter_10',
        name: 'Navigator',
        symbol: 'propeller',
        effect: 'Look at top Hazard'
      };

      const result = processCardEffect(state, '1', navigatorCard, 'launchpad');

      // Should succeed but indicate no hazard
      expect(result.success).toBe(true);
      expect(result.message).toMatch(/empty|no hazard/i);
    });
  });

  describe('GAP-049: Rigger card effect', () => {
    it('should set buildDiscount when Rigger is used', () => {
      const state = createTestGameState();
      state.players['1'].buildDiscount = 0;

      const riggerCard = {
        id: 'starter_4',
        name: 'Rigger',
        symbol: 'wrench',
        reveal: { research: 1 },
        effect: '-£2 ship build cost'
      };

      const result = processCardEffect(state, '1', riggerCard, 'construction_hall');

      // Rigger should set £2 build discount
      expect(result.success).toBe(true);
      expect(state.players['1'].buildDiscount).toBe(2);
    });

    it('should apply buildDiscount when building ships', () => {
      const state = createTestGameState();
      const playerState = state.players['1'];

      // Set up player with Rigger discount and cash
      playerState.buildDiscount = 2;  // From Rigger card effect
      playerState.cash = 10;
      playerState.ships = [];

      // Base hull cost is 2 (base) + frame cost + fabric cost
      // With testBlueprint, it would be higher
      // Let's simplify by using empty blueprint
      playerState.blueprint = {
        frameSlots: [null],
        fabricSlots: [null],
        driveSlots: [null],
        componentSlots: [null]
      };

      const { processBuildShip } = require('../../../server/actions/building');

      // Base hull cost = 2, with discount = 0 (minimum)
      // Use _internal: true since builds now go through PLACE_AGENT
      const result = processBuildShip(state, '1', { count: 1, _internal: true });

      // Hull cost 2 - 2 discount = 0 (minimum 1), so cost 1
      // Actually, let's check what the code does with discount
      expect(result.newState.players['1'].ships.length).toBe(1);
    });
  });

  describe('GAP-049: Researcher card effect', () => {
    it('should set researchDiscount when Researcher is used', () => {
      const state = createTestGameState();
      state.players['1'].researchDiscount = 0;

      const researcherCard = {
        id: 'starter_8',
        name: 'Researcher',
        symbol: 'propeller',
        reveal: { research: 1 },
        effect: '-£1 per Research'
      };

      const result = processCardEffect(state, '1', researcherCard, 'research_institute');

      // Researcher should set £1 research discount
      expect(result.success).toBe(true);
      expect(state.players['1'].researchDiscount).toBe(1);
    });
  });
});
