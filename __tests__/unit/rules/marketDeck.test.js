/**
 * Rules Compliance Tests - Market Deck
 * Tests for correct implementation of Appendix H (Market Deck)
 */

const { MARKET_ROW_SIZE } = require('../../../server/config/constants');
const { refreshMarketRow } = require('../../../server/actions/helpers/marketHelpers');

describe('Rules Compliance - Market Deck', () => {

  describe('GAP-061: Market Row Size per Section 3.1', () => {
    it('should have MARKET_ROW_SIZE of 5 per spec Section 3.1', () => {
      // Per Section 3.1: "Shuffle the Market Deck and deal 5 cards face-up to form the Market Row"
      expect(MARKET_ROW_SIZE).toBe(5);
    });

    it('should refill market row to 5 cards', () => {
      const state = {
        marketCards: ['card1', 'card2'],
        marketDeck: ['card3', 'card4', 'card5', 'card6', 'card7']
      };

      refreshMarketRow(state);

      // Should refill to 5 cards (3 more added)
      expect(state.marketCards.length).toBe(5);
    });
  });

  describe('GAP-041: Market Deck Composition per Appendix H', () => {
    // Helper to get market card data
    const getMarketCardData = () => {
      return require('../../../server/data/marketCards');
    };

    it('should have exactly 30 market cards per Appendix H', () => {
      const { MARKET_CARDS } = getMarketCardData();
      expect(MARKET_CARDS.length).toBe(30);
    });

    it('should have 10 Technical Personnel cards', () => {
      const { MARKET_CARDS } = getMarketCardData();
      const technicalCards = MARKET_CARDS.filter(c => c.category === 'technical');
      expect(technicalCards.length).toBe(10);
    });

    it('should have 10 Political/Financial Personnel cards', () => {
      const { MARKET_CARDS } = getMarketCardData();
      const politicalCards = MARKET_CARDS.filter(c => c.category === 'political');
      expect(politicalCards.length).toBe(10);
    });

    it('should have 5 Research Personnel cards', () => {
      const { MARKET_CARDS } = getMarketCardData();
      const researchCards = MARKET_CARDS.filter(c => c.category === 'research');
      expect(researchCards.length).toBe(5);
    });

    it('should have 5 Organizations cards', () => {
      const { MARKET_CARDS } = getMarketCardData();
      const orgCards = MARKET_CARDS.filter(c => c.category === 'organizations');
      expect(orgCards.length).toBe(5);
    });

    it('should have all required Technical Personnel cards per Appendix H', () => {
      const { MARKET_CARDS } = getMarketCardData();
      const technicalNames = [
        'Chief Engineer',
        'Test Pilot',
        'Navigator',
        'Weather Expert',
        'Gas Engineer',
        'Engine Specialist',
        'Safety Inspector',
        'Ground Crew Chief',
        'Structural Engineer',
        'Fuel Specialist'
      ];

      for (const name of technicalNames) {
        const card = MARKET_CARDS.find(c => c.name === name);
        expect(card).toBeDefined();
        expect(card.category).toBe('technical');
      }
    });

    it('should have all required Political/Financial Personnel cards per Appendix H', () => {
      const { MARKET_CARDS } = getMarketCardData();
      const politicalNames = [
        'The Aristocrat',
        'Industrial Magnate',
        'Government Minister',
        'Shipping Tycoon',
        'Press Baron',
        'Foreign Investor',
        'Insurance Agent',
        'Bureaucrat',
        'Union Representative',
        'Customs Official'
      ];

      for (const name of politicalNames) {
        const card = MARKET_CARDS.find(c => c.name === name);
        expect(card).toBeDefined();
        expect(card.category).toBe('political');
      }
    });

    it('should have all required Research Personnel cards per Appendix H', () => {
      const { MARKET_CARDS } = getMarketCardData();
      const researchNames = [
        'University Partnership',
        'Patent Attorney',
        'Research Assistant',
        'Technical Library',
        'Foreign Consultant'
      ];

      for (const name of researchNames) {
        const card = MARKET_CARDS.find(c => c.name === name);
        expect(card).toBeDefined();
        expect(card.category).toBe('research');
      }
    });

    it('should have all required Organizations cards per Appendix H', () => {
      const { MARKET_CARDS } = getMarketCardData();
      const orgNames = [
        'Royal Geographic Society',
        'Combat Veteran',
        'Luxury Travel Agency',
        'Aviation Club',
        'Engineering Guild'
      ];

      for (const name of orgNames) {
        const card = MARKET_CARDS.find(c => c.name === name);
        expect(card).toBeDefined();
        expect(card.category).toBe('organizations');
      }
    });

    it('should have correct costs for all cards per Appendix H', () => {
      const { MARKET_CARDS } = getMarketCardData();

      // Verify specific card costs from Appendix H
      const expectedCosts = {
        'Chief Engineer': 4,
        'Test Pilot': 5,
        'Navigator': 3,
        'Weather Expert': 4,
        'Gas Engineer': 3,
        'Engine Specialist': 3,
        'Safety Inspector': 4,
        'Ground Crew Chief': 2,
        'Structural Engineer': 3,
        'Fuel Specialist': 3,
        'The Aristocrat': 5,
        'Industrial Magnate': 6,
        'Government Minister': 5,
        'Shipping Tycoon': 4,
        'Press Baron': 4,
        'Foreign Investor': 3,
        'Insurance Agent': 3,
        'Bureaucrat': 2,
        'Union Representative': 2,
        'Customs Official': 3,
        'University Partnership': 4,
        'Patent Attorney': 3,
        'Research Assistant': 2,
        'Technical Library': 3,
        'Foreign Consultant': 4,
        'Royal Geographic Society': 6,
        'Combat Veteran': 5,
        'Luxury Travel Agency': 5,
        'Aviation Club': 4,
        'Engineering Guild': 4
      };

      for (const [name, cost] of Object.entries(expectedCosts)) {
        const card = MARKET_CARDS.find(c => c.name === name);
        expect(card).toBeDefined();
        expect(card.cost).toBe(cost);
      }
    });

    it('should have correct symbols for all cards per Appendix H', () => {
      const { MARKET_CARDS } = getMarketCardData();

      // Verify specific card symbols from Appendix H
      const expectedSymbols = {
        'Chief Engineer': 'wrench',
        'Test Pilot': 'propeller',
        'Navigator': 'propeller',
        'Weather Expert': 'propeller',
        'Gas Engineer': 'wrench',
        'Engine Specialist': 'wrench',
        'Safety Inspector': 'wrench',
        'Ground Crew Chief': 'wrench',
        'Structural Engineer': 'wrench',
        'Fuel Specialist': 'wrench',
        'The Aristocrat': 'coin',
        'Industrial Magnate': 'any',
        'Government Minister': 'propeller',
        'Shipping Tycoon': 'propeller',
        'Press Baron': 'any',
        'Foreign Investor': 'coin',
        'Insurance Agent': 'coin',
        'Bureaucrat': 'propeller',
        'Union Representative': 'coin',
        'Customs Official': 'propeller',
        'University Partnership': 'propeller',
        'Patent Attorney': 'propeller',
        'Research Assistant': 'propeller',
        'Technical Library': 'propeller',
        'Foreign Consultant': 'propeller',
        'Royal Geographic Society': 'wrench',
        'Combat Veteran': 'propeller',
        'Luxury Travel Agency': 'propeller',
        'Aviation Club': 'coin',
        'Engineering Guild': 'coin'
      };

      for (const [name, symbol] of Object.entries(expectedSymbols)) {
        const card = MARKET_CARDS.find(c => c.name === name);
        expect(card).toBeDefined();
        expect(card.symbol).toBe(symbol);
      }
    });

    it('should have agent effects for all cards per Appendix H', () => {
      const { MARKET_CARDS } = getMarketCardData();

      // All cards should have an effect property
      for (const card of MARKET_CARDS) {
        expect(card.effect).toBeDefined();
      }
    });

    it('should have reveal bonuses for all cards per Appendix H', () => {
      const { MARKET_CARDS } = getMarketCardData();

      // All cards should have a reveal property
      for (const card of MARKET_CARDS) {
        expect(card.reveal).toBeDefined();
      }
    });
  });

  describe('GAP-050: Market Card Agent Effects Implementation', () => {
    const { processCardEffect } = require('../../../server/actions/worker');

    it('should handle Chief Engineer with no special effect', () => {
      const state = {
        players: {
          player1: { }
        }
      };
      // Chief Engineer currently has no special effect
      const card = { name: 'Chief Engineer', effect: null };

      const result = processCardEffect(state, 'player1', card, 'design_bureau');

      // Should succeed but have no special effect
      expect(result.success).toBe(true);
    });

    it('should handle Test Pilot effect (+2 Reliability for this launch)', () => {
      const state = {
        players: {
          player1: { launchBonuses: {} }
        }
      };
      const card = { name: 'Test Pilot', effect: '+2 Reliability for this launch' };

      const result = processCardEffect(state, 'player1', card, 'launchpad');

      expect(result.success).toBe(true);
      expect(state.players.player1.launchBonuses.reliability).toBe(2);
    });

    it('should handle Weather Expert effect (Ignore Weather hazards)', () => {
      const state = {
        players: {
          player1: { launchBonuses: {} }
        }
      };
      const card = { name: 'Weather Expert', effect: 'Ignore Weather hazards this launch' };

      const result = processCardEffect(state, 'player1', card, 'launchpad');

      expect(result.success).toBe(true);
      expect(state.players.player1.launchBonuses.ignoreWeather).toBe(true);
    });

    it('should handle Ground Crew Chief effect (-2 Hull Cost)', () => {
      const state = {
        players: {
          player1: { buildDiscount: 0 }
        }
      };
      const card = { name: 'Ground Crew Chief', effect: '-2 Hull Cost' };

      const result = processCardEffect(state, 'player1', card, 'construction_hall');

      expect(result.success).toBe(true);
      expect(state.players.player1.buildDiscount).toBe(2);
    });

    it('should handle The Aristocrat effect (Gain 5)', () => {
      const state = {
        players: {
          player1: { cash: 10 }
        }
      };
      const card = { name: 'The Aristocrat', effect: 'Gain 5' };

      const result = processCardEffect(state, 'player1', card, 'the_bank');

      expect(result.success).toBe(true);
      expect(state.players.player1.cash).toBe(15);
    });

    it('should handle Foreign Investor effect (Loan gives 35 instead of 30)', () => {
      const state = {
        players: {
          player1: { loanBonus: 0 }
        }
      };
      const card = { name: 'Foreign Investor', effect: 'Loan gives 35 instead of 30' };

      const result = processCardEffect(state, 'player1', card, 'the_bank');

      expect(result.success).toBe(true);
      expect(state.players.player1.loanBonus).toBe(5);
    });

    it('should handle Insurance Agent effect (Gain 1 Insurance policy)', () => {
      const state = {
        players: {
          player1: { insurancePolicies: 0 }
        }
      };
      const card = { name: 'Insurance Agent', effect: 'Gain 1 Insurance policy' };

      const result = processCardEffect(state, 'player1', card, 'insurance_bureau');

      expect(result.success).toBe(true);
      expect(state.players.player1.insurancePolicies).toBe(1);
    });

    it('should handle Bureaucrat effect (Go first in turn order next round)', () => {
      const state = {
        players: {
          player1: {}
        },
        nextRoundFirstPlayer: null
      };
      const card = { name: 'Bureaucrat', effect: 'Go first in turn order next round' };

      const result = processCardEffect(state, 'player1', card, 'ministry');

      expect(result.success).toBe(true);
      expect(state.nextRoundFirstPlayer).toBe('player1');
    });

    it('should handle Navigator market card effect (+1 Range for this launch)', () => {
      const state = {
        players: {
          player1: { launchBonuses: {} }
        }
      };
      const card = { name: 'Navigator', effect: '+1 Range for this launch', category: 'technical' };

      const result = processCardEffect(state, 'player1', card, 'launchpad');

      expect(result.success).toBe(true);
      expect(state.players.player1.launchBonuses.range).toBe(1);
    });

    it('should handle University Partnership effect (-2 per Technology this round)', () => {
      const state = {
        players: {
          player1: { researchDiscount: 0 }
        }
      };
      const card = { name: 'University Partnership', effect: '-2 per Technology this round' };

      const result = processCardEffect(state, 'player1', card, 'research_institute');

      expect(result.success).toBe(true);
      expect(state.players.player1.researchDiscount).toBe(2);
    });
  });
});
