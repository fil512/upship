/**
 * Rules Compliance Tests - Round Structure
 * Tests for correct implementation of Sections 4-6 (Game Round, Ground Board)
 */

const { createTestGameState, createTestPlayerState } = require('../../fixtures/testData');

// Import the phase transition helpers
const { collectRevealResources, transitionToIncomeCleanup, startNewRound } = require('../../../server/actions/helpers/phaseTransition');

// Import crew actions
const { processUpgradeOfficerIncome } = require('../../../server/actions/crew');

// Import the ground board data
const { GROUND_BOARD_LOCATIONS } = require('../../../server/data/groundBoard');

describe('Rules Compliance - Round Structure', () => {

  describe('GAP-001: Research Level Track', () => {
    it('should have researchLevel property separate from research tokens per Section 4.6', () => {
      const playerState = createTestPlayerState('germany');

      // Per rules Section 4.6: Research Level Track starts at 0
      // This should be separate from research tokens
      expect(playerState).toHaveProperty('researchLevel');
      expect(playerState.researchLevel).toBe(0);
    });

    it('should use researchLevel in reveal calculation per Section 5.1', () => {
      const state = createTestGameState();
      state.phase = 'reveal';

      // Set up a player with Research Level 2 and 3 Engineers
      state.players['1'].researchLevel = 2;
      state.players['1'].engineers = 3;
      state.players['1'].hand = [];

      // Set up reveal phase tracking
      state.revealPhase = {
        revealedHands: { '1': [] },
        resourcesCollected: { '1': false },
        techAcquisitionsComplete: {},
        marketPurchasesComplete: {}
      };

      collectRevealResources(state);

      // Per Section 5.1: Research = Research Level + Engineers in Barracks + card bonuses
      // Expected: 2 (researchLevel) + 3 (engineers) + 0 (no cards) = 5
      expect(state.players['1'].research).toBe(5);
    });
  });

  describe('GAP-004: Income calculation', () => {
    it('should calculate net income (income minus engineer upkeep) per Section 5.2', () => {
      const state = createTestGameState();
      state.phase = 'reveal';

      // Set up player with income 10 and 3 engineers
      state.players['1'].income = 10;
      state.players['1'].engineers = 3;
      state.players['1'].cash = 5;

      // Initialize reveal phase data
      state.revealPhase = {
        revealedHands: { '1': [], '2': [], '3': [], '4': [] },
        resourcesCollected: { '1': true, '2': true, '3': true, '4': true },
        techAcquisitionsComplete: {},
        marketPurchasesComplete: {}
      };

      transitionToIncomeCleanup(state);

      // Per rules 5.2: "Gain £ equal to your Income Track minus Engineers in Barracks"
      // Net income = 10 - 3 = 7
      // Starting cash was 5, should now be 5 + 7 = 12
      // The current implementation pays upkeep separately (wrong):
      // - Pays 3 from cash (5 - 3 = 2)
      // - Then adds income (2 + 10 = 12)
      // But this is semantically different - if cash < upkeep, result differs

      // Test with low cash to expose the bug
      const state2 = createTestGameState();
      state2.phase = 'reveal';
      state2.players['1'].income = 10;
      state2.players['1'].engineers = 5;
      state2.players['1'].cash = 2; // Less than upkeep
      state2.revealPhase = {
        revealedHands: { '1': [], '2': [], '3': [], '4': [] },
        resourcesCollected: { '1': true, '2': true, '3': true, '4': true },
        techAcquisitionsComplete: {},
        marketPurchasesComplete: {}
      };

      transitionToIncomeCleanup(state2);

      // Per rules: Net income = 10 - 5 = 5
      // Final cash should be: 2 + 5 = 7
      expect(state2.players['1'].cash).toBe(7);
    });
  });

  describe('GAP-005: Reveal phase card icons', () => {
    it('should process card.reveal property not just card.revealBonus per Section 5.1', () => {
      const state = createTestGameState();
      state.phase = 'reveal';

      // Set up a player with a Mechanic card (uses card.reveal, not card.revealBonus)
      const mechanicCard = {
        id: 'starter_3',
        name: 'Mechanic',
        symbol: 'wrench',
        reveal: { cash: 1 },  // The starter deck uses 'reveal' property
        effect: '+1 swap'
      };

      state.players['1'].hand = [mechanicCard];
      state.players['1'].cash = 10;
      state.players['1'].engineers = 0;
      state.players['1'].researchLevel = 0;

      state.revealPhase = {
        revealedHands: { '1': [mechanicCard] },
        resourcesCollected: { '1': false },
        techAcquisitionsComplete: {},
        marketPurchasesComplete: {}
      };

      collectRevealResources(state);

      // Per Section 5.1: Mechanic reveals £ icon, should gain £1
      expect(state.players['1'].cash).toBe(11);
    });
  });

  describe('GAP-006: Officers and cash reveal icons', () => {
    it('should collect officers from reveal icons per Section 5.1', () => {
      const state = createTestGameState();
      state.phase = 'reveal';

      // Set up a player with a Helmsman card (reveals 1 Officer)
      const helmsmanCard = {
        id: 'starter_10',
        name: 'Helmsman',
        symbol: 'propeller',
        reveal: { officers: 1 },
        effect: '+1 ship stat'
      };

      state.players['1'].hand = [helmsmanCard];
      state.players['1'].officers = 1;
      state.players['1'].engineers = 0;
      state.players['1'].researchLevel = 0;

      state.revealPhase = {
        revealedHands: { '1': [helmsmanCard] },
        resourcesCollected: { '1': false },
        techAcquisitionsComplete: {},
        marketPurchasesComplete: {}
      };

      collectRevealResources(state);

      // Per Section 5.1: Helmsman reveals Officer icon
      expect(state.players['1'].officers).toBe(2);
    });
  });

  describe('GAP-002: Research Institute location action', () => {
    it('should cost £4 per level per Section 6.1', () => {
      const location = GROUND_BOARD_LOCATIONS.research_institute;

      // Per Section 6.1: "Cost: £4 per level"
      expect(location.action.cost).toBe(4);
    });

    it('should increase Research Level Track, not grant tokens per Section 6.1', () => {
      const location = GROUND_BOARD_LOCATIONS.research_institute;

      // Per Section 6.1: "Effect: Increase your Research Level Track by 1 step."
      expect(location.action.type).toBe('UPGRADE_RESEARCH_LEVEL');
    });
  });

  describe('GAP-007: Third Agent milestone', () => {
    it('should grant 3rd agent when Officer Income reaches +3 per Section 6.6', () => {
      const state = createTestGameState();
      const playerId = '1';

      // Start with Officer Income at 2 and 2 agents
      state.players[playerId].officerIncome = 2;
      state.players[playerId].cash = 15;
      state.players[playerId].agents = 2;

      // Process upgrade to Officer Income +3
      // Use _internal: true since action now validates agent placement
      processUpgradeOfficerIncome(state, playerId, { _internal: true });

      // Per Section 6.6: "When your Officer Income Track reaches +3, immediately gain your 3rd Agent."
      expect(state.players[playerId].officerIncome).toBe(3);
      expect(state.players[playerId].agents).toBe(3);
    });

    it('should not grant 3rd agent if already have 3 agents', () => {
      const state = createTestGameState();
      const playerId = '1';

      // Already have 3 agents at Officer Income 2
      state.players[playerId].officerIncome = 2;
      state.players[playerId].cash = 15;
      state.players[playerId].agents = 3;

      // Use _internal: true since action now validates agent placement
      processUpgradeOfficerIncome(state, playerId, { _internal: true });

      // Should not get a 4th agent
      expect(state.players[playerId].agents).toBe(3);
    });
  });
});
