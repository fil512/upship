/**
 * Market Deck (Agent Cards) per Appendix H
 *
 * The Market Deck contains 30 purchasable Agent Cards organized into 4 categories:
 * - Technical Personnel (10 Agent Cards)
 * - Political/Financial Personnel (10 Agent Cards)
 * - Research Personnel (5 Agent Cards)
 * - Organizations (5 Agent Cards)
 *
 * Each Agent Card has:
 * - id: unique identifier
 * - name: display name
 * - category: technical | political | research | organizations
 * - cost: Influence cost to purchase
 * - symbol: wrench | propeller | coin | any (determines valid placement locations)
 * - effect: Agent Effect when placed
 * - reveal: Resources gained when revealed during Reveal Phase
 */

import type { CardSymbol } from '@upship/api';

export type MarketCardCategory = 'technical' | 'political' | 'research' | 'organizations';

export interface MarketCardReveal {
  cash?: number;
  influence?: number;
  research?: number;
  officers?: number;
  engineers?: number;
  gas?: number;
}

export interface MarketCard {
  id: string;
  name: string;
  category: MarketCardCategory;
  cost: number;
  symbol: CardSymbol;
  effect: string | null;
  reveal: MarketCardReveal;
}

/* eslint-disable sonarjs/pseudo-random */

export const MARKET_CARDS: MarketCard[] = [
  // === TECHNICAL PERSONNEL (10 Agent Cards) ===
  {
    id: 'market_chief_engineer',
    name: 'Chief Engineer',
    category: 'technical',
    cost: 4,
    symbol: 'wrench',
    effect: null,
    reveal: { engineers: 1 }
  },
  {
    id: 'market_test_pilot',
    name: 'Test Pilot',
    category: 'technical',
    cost: 5,
    symbol: 'propeller',
    effect: '+2 Reliability for this launch',
    reveal: { officers: 1 }
  },
  {
    id: 'market_navigator',
    name: 'Navigator',
    category: 'technical',
    cost: 3,
    symbol: 'propeller',
    effect: '+1 Range for this launch',
    reveal: { cash: 1, influence: 1 }
  },
  {
    id: 'market_weather_expert',
    name: 'Weather Expert',
    category: 'technical',
    cost: 4,
    symbol: 'propeller',
    effect: 'Ignore Weather hazards this launch',
    reveal: { engineers: 1 }
  },
  {
    id: 'market_gas_engineer',
    name: 'Gas Engineer',
    category: 'technical',
    cost: 3,
    symbol: 'wrench',
    effect: 'Install Gas upgrade: -1 Weight',
    reveal: { gas: 1 }
  },
  {
    id: 'market_engine_specialist',
    name: 'Engine Specialist',
    category: 'technical',
    cost: 3,
    symbol: 'wrench',
    effect: 'Install Propulsion upgrade: -1 Weight',
    reveal: { cash: 1, research: 1 }
  },
  {
    id: 'market_safety_inspector',
    name: 'Safety Inspector',
    category: 'technical',
    cost: 4,
    symbol: 'wrench',
    effect: '+2 Reliability for this launch',
    reveal: { engineers: 1 }
  },
  {
    id: 'market_ground_crew_chief',
    name: 'Ground Crew Chief',
    category: 'technical',
    cost: 2,
    symbol: 'wrench',
    effect: '-2 Hull Cost',
    reveal: { cash: 2 }
  },
  {
    id: 'market_structural_engineer',
    name: 'Structural Engineer',
    category: 'technical',
    cost: 3,
    symbol: 'wrench',
    effect: 'Install Structure upgrade: +1 Lift',
    reveal: { research: 1 }
  },
  {
    id: 'market_fuel_specialist',
    name: 'Fuel Specialist',
    category: 'technical',
    cost: 3,
    symbol: 'wrench',
    effect: '-2 Lifting Gas cost',
    reveal: { gas: 1, cash: 1 }
  },

  // === POLITICAL/FINANCIAL PERSONNEL (10 Agent Cards) ===
  {
    id: 'market_aristocrat',
    name: 'The Aristocrat',
    category: 'political',
    cost: 5,
    symbol: 'coin',
    effect: 'Gain 5',
    reveal: { influence: 3 }
  },
  {
    id: 'market_industrial_magnate',
    name: 'Industrial Magnate',
    category: 'political',
    cost: 6,
    symbol: 'any',
    effect: 'Gain 3',
    reveal: { influence: 4 }
  },
  {
    id: 'market_government_minister',
    name: 'Government Minister',
    category: 'political',
    cost: 5,
    symbol: 'propeller',
    effect: 'Take 2 Ministry actions',
    reveal: { influence: 2, cash: 1 }
  },
  {
    id: 'market_shipping_tycoon',
    name: 'Shipping Tycoon',
    category: 'political',
    cost: 4,
    symbol: 'propeller',
    effect: '+2 Income from this route',
    reveal: { influence: 3 }
  },
  {
    id: 'market_press_baron',
    name: 'Press Baron',
    category: 'political',
    cost: 4,
    symbol: 'any',
    effect: 'No action effect',
    reveal: { influence: 2, cash: 2 }
  },
  {
    id: 'market_foreign_investor',
    name: 'Foreign Investor',
    category: 'political',
    cost: 3,
    symbol: 'coin',
    effect: 'Loan gives 35 instead of 30',
    reveal: { influence: 2 }
  },
  {
    id: 'market_insurance_agent',
    name: 'Insurance Agent',
    category: 'political',
    cost: 3,
    symbol: 'coin',
    effect: 'Gain 1 Insurance policy',
    reveal: { influence: 2 }
  },
  {
    id: 'market_bureaucrat',
    name: 'Bureaucrat',
    category: 'political',
    cost: 2,
    symbol: 'propeller',
    effect: 'Go first in turn order next round',
    reveal: { influence: 2 }
  },
  {
    id: 'market_union_representative',
    name: 'Union Representative',
    category: 'political',
    cost: 2,
    symbol: 'coin',
    effect: '-1 per crew recruited this action',
    reveal: { influence: 1, officers: 1 }
  },
  {
    id: 'market_customs_official',
    name: 'Customs Official',
    category: 'political',
    cost: 3,
    symbol: 'propeller',
    effect: 'Claim route even if tied',
    reveal: { influence: 2 }
  },

  // === RESEARCH PERSONNEL (5 Agent Cards) ===
  {
    id: 'market_university_partnership',
    name: 'University Partnership',
    category: 'research',
    cost: 4,
    symbol: 'propeller',
    effect: '-2 per Technology this round',
    reveal: { research: 2 }
  },
  {
    id: 'market_patent_attorney',
    name: 'Patent Attorney',
    category: 'research',
    cost: 3,
    symbol: 'propeller',
    effect: '-1 to Technology Research cost',
    reveal: { influence: 2 }
  },
  {
    id: 'market_research_assistant',
    name: 'Research Assistant',
    category: 'research',
    cost: 2,
    symbol: 'propeller',
    effect: '+1 Research this round',
    reveal: { influence: 1, research: 1 }
  },
  {
    id: 'market_technical_library',
    name: 'Technical Library',
    category: 'research',
    cost: 3,
    symbol: 'propeller',
    effect: 'Look at top 3 R&D tiles; reorder them',
    reveal: { research: 2 }
  },
  {
    id: 'market_foreign_consultant',
    name: 'Foreign Consultant',
    category: 'research',
    cost: 4,
    symbol: 'propeller',
    effect: 'Acquire Tech another player owns (pay double)',
    reveal: { research: 1, cash: 1 }
  },

  // === ORGANIZATIONS (5 Agent Cards) ===
  {
    id: 'market_royal_geographic',
    name: 'Royal Geographic Society',
    category: 'organizations',
    cost: 6,
    symbol: 'wrench',
    effect: 'Install 1 Upgrade ignoring Tech requirement',
    reveal: { engineers: 1, influence: 2 }
  },
  {
    id: 'market_combat_veteran',
    name: 'Combat Veteran',
    category: 'organizations',
    cost: 5,
    symbol: 'propeller',
    effect: 'Gain 8; Combat missions: +2 Income',
    reveal: { officers: 1, cash: 1 }
  },
  {
    id: 'market_luxury_travel_agency',
    name: 'Luxury Travel Agency',
    category: 'organizations',
    cost: 5,
    symbol: 'propeller',
    effect: '+1 Luxury stat for this launch',
    reveal: { influence: 3 }
  },
  {
    id: 'market_aviation_club',
    name: 'Aviation Club',
    category: 'organizations',
    cost: 4,
    symbol: 'coin',
    effect: 'Recruit 1 Officer free',
    reveal: { influence: 2, officers: 1 }
  },
  {
    id: 'market_engineering_guild',
    name: 'Engineering Guild',
    category: 'organizations',
    cost: 4,
    symbol: 'coin',
    effect: 'Recruit 1 Engineer at -1',
    reveal: { influence: 1, engineers: 1 }
  }
];

/**
 * Create a shuffled market deck from the card definitions
 * @returns Shuffled array of market cards
 */
export function createMarketDeck(): MarketCard[] {
  const deck = MARKET_CARDS.map(card => ({ ...card }));

  // Shuffle the deck (Math.random() is appropriate for game card shuffling)
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

/**
 * Create the initial market row (5 cards)
 * @returns { marketRow, marketDeck }
 */
export function createMarketRow(): { marketRow: MarketCard[]; marketDeck: MarketCard[] } {
  const deck = createMarketDeck();
  const marketRow = deck.splice(0, 5);
  return { marketRow, marketDeck: deck };
}

// CommonJS compatibility
module.exports = {
  MARKET_CARDS,
  createMarketDeck,
  createMarketRow
};
