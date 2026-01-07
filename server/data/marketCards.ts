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
  flavor: string;
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
    reveal: { engineers: 1, research: 2, influence: 1 },
    flavor: 'Senior officer of the engineering department'
  },
  {
    id: 'market_test_pilot',
    name: 'Kite Jockey',
    category: 'technical',
    cost: 5,
    symbol: 'propeller',
    effect: '+2 Reliability for this launch',
    reveal: { officers: 1, influence: 1 },
    flavor: 'RFC slang for a daring aviator'
  },
  {
    id: 'market_navigator',
    name: 'Navigator',
    category: 'technical',
    cost: 3,
    symbol: 'propeller',
    effect: '+1 Range for this launch',
    reveal: { cash: 1, influence: 2 },
    flavor: 'Dead reckoning specialist using course, speed, and drift'
  },
  {
    id: 'market_weather_expert',
    name: 'The Weatherman',
    category: 'technical',
    cost: 4,
    symbol: 'propeller',
    effect: 'Ignore Weather hazards this launch',
    reveal: { engineers: 1, research: 1, influence: 1 },
    flavor: 'Reads the sky better than any bureau telegram'
  },
  {
    id: 'market_gas_engineer',
    name: 'Gasbag Man',
    category: 'technical',
    cost: 3,
    symbol: 'wrench',
    effect: 'Install Gas upgrade: -1 Weight',
    reveal: { gas: 1, research: 1, influence: 1 },
    flavor: 'Specialist in gas cells and lifting calculations'
  },
  {
    id: 'market_engine_specialist',
    name: 'Engine Room Mechanic',
    category: 'technical',
    cost: 3,
    symbol: 'wrench',
    effect: 'Install Propulsion upgrade: -1 Weight',
    reveal: { cash: 1, research: 1, influence: 1 },
    flavor: 'Machinist assigned to the engine gondolas'
  },
  {
    id: 'market_safety_inspector',
    name: 'The Scrutineer',
    category: 'technical',
    cost: 4,
    symbol: 'wrench',
    effect: '+2 Reliability for this launch',
    reveal: { engineers: 1, influence: 1 },
    flavor: 'Official inspector ensuring airworthiness'
  },
  {
    id: 'market_ground_crew_chief',
    name: 'Rigger Chief',
    category: 'technical',
    cost: 2,
    symbol: 'wrench',
    effect: '-2 Hull Cost',
    reveal: { cash: 2, influence: 1 },
    flavor: 'Commands the ground handling crew'
  },
  {
    id: 'market_structural_engineer',
    name: 'Duralumin Man',
    category: 'technical',
    cost: 3,
    symbol: 'wrench',
    effect: 'Install Structure upgrade: +1 Lift',
    reveal: { research: 1, influence: 1 },
    flavor: 'Expert in the lightweight alloy that makes rigids possible'
  },
  {
    id: 'market_fuel_specialist',
    name: 'Blaugas Handler',
    category: 'technical',
    cost: 3,
    symbol: 'wrench',
    effect: '-2 Lifting Gas cost',
    reveal: { gas: 1, cash: 1, influence: 1 },
    flavor: 'Manages the special fuel gas carried in the hull'
  },

  // === POLITICAL/FINANCIAL PERSONNEL (10 Agent Cards) ===
  {
    id: 'market_aristocrat',
    name: 'The Nob',
    category: 'political',
    cost: 5,
    symbol: 'coin',
    effect: 'Gain 5',
    reveal: { influence: 3 },
    flavor: 'Old money with connections in high places'
  },
  {
    id: 'market_industrial_magnate',
    name: 'Captain of Industry',
    category: 'political',
    cost: 6,
    symbol: 'any',
    effect: 'Gain 3',
    reveal: { influence: 4 },
    flavor: 'A titan of commerce and manufacturing'
  },
  {
    id: 'market_government_minister',
    name: 'The Mandarin',
    category: 'political',
    cost: 5,
    symbol: 'propeller',
    effect: 'Take 2 Ministry actions',
    reveal: { influence: 2, cash: 1 },
    flavor: 'Senior civil servant with considerable influence'
  },
  {
    id: 'market_shipping_tycoon',
    name: 'Merchant Prince',
    category: 'political',
    cost: 4,
    symbol: 'propeller',
    effect: '+2 Income from this route',
    reveal: { influence: 3 },
    flavor: 'Controls lucrative trade routes across continents'
  },
  {
    id: 'market_press_baron',
    name: 'Fleet Street Baron',
    category: 'political',
    cost: 4,
    symbol: 'any',
    effect: 'No action effect',
    reveal: { influence: 2, cash: 2 },
    flavor: 'The newspapers dance to his tune'
  },
  {
    id: 'market_foreign_investor',
    name: 'The Moneybags',
    category: 'political',
    cost: 3,
    symbol: 'coin',
    effect: 'Loan gives 35 instead of 30',
    reveal: { influence: 3 },
    flavor: 'Capital from abroad, no questions asked'
  },
  {
    id: 'market_insurance_agent',
    name: "Lloyd's Man",
    category: 'political',
    cost: 3,
    symbol: 'coin',
    effect: 'Gain 1 Insurance policy',
    reveal: { influence: 3 },
    flavor: 'Underwriter from the famous London exchange'
  },
  {
    id: 'market_bureaucrat',
    name: 'The Pen-Pusher',
    category: 'political',
    cost: 2,
    symbol: 'propeller',
    effect: 'Go first in turn order next round',
    reveal: { influence: 3 },
    flavor: 'Knows which forms to file and when'
  },
  {
    id: 'market_union_representative',
    name: 'Shop Steward',
    category: 'political',
    cost: 2,
    symbol: 'coin',
    effect: '-1 per crew recruited this action',
    reveal: { influence: 2, officers: 1 },
    flavor: 'Voice of the working men on the factory floor'
  },
  {
    id: 'market_customs_official',
    name: 'The Exciseman',
    category: 'political',
    cost: 3,
    symbol: 'propeller',
    effect: 'Claim route even if tied',
    reveal: { influence: 3 },
    flavor: "His Majesty's collector of duties and tariffs"
  },

  // === RESEARCH PERSONNEL (5 Agent Cards) ===
  {
    id: 'market_university_partnership',
    name: 'The Boffin',
    category: 'research',
    cost: 4,
    symbol: 'propeller',
    effect: '-2 per Technology this round',
    reveal: { research: 3 },
    flavor: 'Brilliant academic with theoretical insights'
  },
  {
    id: 'market_patent_attorney',
    name: 'Patent Clerk',
    category: 'research',
    cost: 3,
    symbol: 'propeller',
    effect: '-1 to Technology Research cost',
    reveal: { influence: 2, research: 1 },
    flavor: 'Knows which ideas are truly novel'
  },
  {
    id: 'market_research_assistant',
    name: 'The Lab Coat',
    category: 'research',
    cost: 2,
    symbol: 'propeller',
    effect: '+1 Research this round',
    reveal: { influence: 2, research: 1 },
    flavor: 'Tireless experimenter in applied sciences'
  },
  {
    id: 'market_technical_library',
    name: 'The Archives',
    category: 'research',
    cost: 3,
    symbol: 'propeller',
    effect: 'Look at top 3 R&D tiles; reorder them',
    reveal: { research: 2, influence: 1 },
    flavor: 'Repository of accumulated aeronautical knowledge'
  },
  {
    id: 'market_foreign_consultant',
    name: 'Continental Expert',
    category: 'research',
    cost: 4,
    symbol: 'propeller',
    effect: 'Acquire Tech another player owns (pay double)',
    reveal: { research: 1, cash: 1, influence: 2 },
    flavor: "Brings expertise from Europe's leading programs"
  },

  // === ORGANIZATIONS (5 Agent Cards) ===
  {
    id: 'market_royal_geographic',
    name: 'Royal Geographic Society',
    category: 'organizations',
    cost: 6,
    symbol: 'wrench',
    effect: 'Install 1 Upgrade ignoring Tech requirement',
    reveal: { engineers: 1, influence: 3, research: 1 },
    flavor: 'Patrons of exploration and scientific discovery'
  },
  {
    id: 'market_combat_veteran',
    name: 'Old Contemptible',
    category: 'organizations',
    cost: 5,
    symbol: 'propeller',
    effect: 'Gain 8; Combat missions: +2 Income',
    reveal: { officers: 1, cash: 1, influence: 1 },
    flavor: "Survivor of the Kaiser's 'contemptible little army'"
  },
  {
    id: 'market_luxury_travel_agency',
    name: "Cook's Man",
    category: 'organizations',
    cost: 5,
    symbol: 'propeller',
    effect: '+1 Luxury stat for this launch',
    reveal: { influence: 3 },
    flavor: 'Agent of Thomas Cook & Son, travel pioneers'
  },
  {
    id: 'market_aviation_club',
    name: 'Aero Club',
    category: 'organizations',
    cost: 4,
    symbol: 'coin',
    effect: 'Recruit 1 Officer free',
    reveal: { influence: 3, officers: 1 },
    flavor: 'Gentlemen aviators and aerial enthusiasts'
  },
  {
    id: 'market_engineering_guild',
    name: 'Engineering Guild',
    category: 'organizations',
    cost: 4,
    symbol: 'coin',
    effect: 'Recruit 1 Engineer at -1',
    reveal: { influence: 2, engineers: 1 },
    flavor: 'Brotherhood of skilled craftsmen and artificers'
  }
];

/**
 * Reserve Card (Always Available)
 * Like Dune Imperium's Arrakis Liaison, this card is always available for purchase.
 * It provides a reliable deck-building foundation when the market doesn't have good options.
 */
export const RESERVE_CARD: MarketCard = {
  id: 'reserve_aeronaut',
  name: 'The Aeronaut',
  category: 'organizations',
  cost: 2,
  symbol: 'any',
  effect: null,
  reveal: { influence: 3 },
  flavor: 'Veteran balloonist and lighter-than-air pioneer'
};

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
  RESERVE_CARD,
  createMarketDeck,
  createMarketRow
};
