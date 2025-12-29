/**
 * Game Constants
 * Centralized configuration for all magic values
 */

// Gas Market
const HYDROGEN_PRICE = 1;
const HELIUM_PRICE_TRACK = [2, 3, 4, 5, 6, 8, 10, 15];

// Loans (The Bank)
const MAX_LOANS = 2;
const LOAN_AMOUNT = 30;
const LOAN_INCOME_PENALTY = 3;

// Game Progression
const TURNS_PER_AGE = 10;
const HAND_SIZE = 5;
const INITIAL_AGENTS = 3;

// R&D Board sizes by age
const RD_BOARD_SIZE = { 1: 4, 2: 5, 3: 6 };
const MARKET_ROW_SIZE = 4;

// Crew Costs
const OFFICER_RECRUIT_COST = 2;
const ENGINEER_RECRUIT_COST = 4;
const FLIGHT_SCHOOL_COST = 5;
const TECHNICAL_INSTITUTE_COST = 6;
const WEATHER_BUREAU_COST = 2;

// Insurance
const MAX_INSURANCE_POLICIES = 3;

// Progress Track Thresholds by player count
const PROGRESS_THRESHOLDS = {
  2: { age2: 8, age3: 16, end: 20 },
  3: { age2: 10, age3: 20, end: 25 },
  4: { age2: 12, age3: 24, end: 30 }
};

// Valid game phases
const PHASES = {
  WORKER_PLACEMENT: 'worker_placement',
  REVEAL: 'reveal',
  INCOME_CLEANUP: 'income_cleanup'
};

// Valid factions
const FACTIONS = ['germany', 'britain', 'usa', 'italy'];

// Starting player resources
const STARTING_CASH = 15;
const STARTING_INCOME = 5;
const STARTING_OFFICER_INCOME = 0;
const STARTING_ENGINEER_INCOME = 1;
const STARTING_OFFICERS = 1;
const STARTING_ENGINEERS = 2;
const STARTING_HYDROGEN = 2;
const STARTING_HELIUM = 0;
const STARTING_RESEARCH = 0;
const STARTING_INFLUENCE = 0;

// Age Baselines for ship stats
const AGE_BASELINES = {
  1: { speed: 1, range: 1, ceiling: 0, reliability: 0 },
  2: { speed: 2, range: 2, ceiling: 1, reliability: 1 },
  3: { speed: 3, range: 3, ceiling: 2, reliability: 2 }
};

// Technology Bag organized by Age
const TECHNOLOGY_BAG = {
  1: [ // Age I Technologies
    { id: 'wooden_framework', name: 'Wooden Framework', type: 'structure', cost: 2, vp: 0 },
    { id: 'wire_bracing', name: 'Wire Bracing', type: 'structure', cost: 2, vp: 0 },
    { id: 'duralumin_girders', name: 'Duralumin Girders', type: 'structure', cost: 4, vp: 1 },
    { id: 'rubberized_cotton', name: 'Rubberized Cotton', type: 'fabric', cost: 2, vp: 0 },
    { id: 'doped_canvas', name: 'Doped Canvas', type: 'fabric', cost: 3, vp: 0 },
    { id: 'goldbeater_skin', name: "Goldbeater's Skin", type: 'fabric', cost: 3, vp: 1 },
    { id: 'daimler_engine', name: 'Daimler Engine', type: 'drive', cost: 2, vp: 0 },
    { id: 'improved_propeller', name: 'Improved Propeller', type: 'drive', cost: 3, vp: 0 },
    { id: 'maybach_engine', name: 'Maybach Engine', type: 'drive', cost: 4, vp: 1 },
    { id: 'passenger_gondola', name: 'Passenger Gondola', type: 'component', cost: 3, vp: 0 },
    { id: 'observation_deck', name: 'Observation Deck', type: 'component', cost: 4, vp: 1 },
    { id: 'cargo_systems', name: 'Cargo Systems', type: 'component', cost: 3, vp: 0 }
  ],
  2: [ // Age II Technologies
    { id: 'steel_framework', name: 'Steel Framework', type: 'structure', cost: 4, vp: 1 },
    { id: 'internal_keel', name: 'Internal Keel', type: 'structure', cost: 3, vp: 0 },
    { id: 'fireproof_coating', name: 'Fireproof Coating', type: 'fabric', cost: 4, vp: 1 },
    { id: 'aluminum_doping', name: 'Aluminum Doping', type: 'fabric', cost: 3, vp: 0 },
    { id: 'dual_engine_mount', name: 'Dual Engine Mount', type: 'drive', cost: 4, vp: 1 },
    { id: 'diesel_powerplant', name: 'Diesel Powerplant', type: 'drive', cost: 5, vp: 1 },
    { id: 'radio_equipment', name: 'Radio Equipment', type: 'component', cost: 3, vp: 0 },
    { id: 'sleeping_quarters', name: 'Sleeping Quarters', type: 'component', cost: 4, vp: 1 },
    { id: 'mail_systems', name: 'Mail Systems', type: 'component', cost: 3, vp: 0 }
  ],
  3: [ // Age III Technologies
    { id: 'geodetic_structure', name: 'Geodetic Structure', type: 'structure', cost: 6, vp: 2 },
    { id: 'modular_construction', name: 'Modular Construction', type: 'structure', cost: 4, vp: 1 },
    { id: 'composite_covering', name: 'Composite Covering', type: 'fabric', cost: 5, vp: 2 },
    { id: 'streamlined_nacelle', name: 'Streamlined Nacelle', type: 'drive', cost: 5, vp: 1 },
    { id: 'supercharged_engine', name: 'Supercharged Engine', type: 'drive', cost: 6, vp: 2 },
    { id: 'luxury_fittings', name: 'Luxury Fittings', type: 'component', cost: 6, vp: 2 },
    { id: 'advanced_navigation', name: 'Advanced Navigation', type: 'component', cost: 5, vp: 1 },
    { id: 'pressurization', name: 'Pressurization', type: 'component', cost: 5, vp: 1 }
  ]
};

module.exports = {
  // Gas Market
  HYDROGEN_PRICE,
  HELIUM_PRICE_TRACK,

  // Loans
  MAX_LOANS,
  LOAN_AMOUNT,
  LOAN_INCOME_PENALTY,

  // Game Progression
  TURNS_PER_AGE,
  HAND_SIZE,
  INITIAL_AGENTS,

  // Board sizes
  RD_BOARD_SIZE,
  MARKET_ROW_SIZE,

  // Crew Costs
  OFFICER_RECRUIT_COST,
  ENGINEER_RECRUIT_COST,
  FLIGHT_SCHOOL_COST,
  TECHNICAL_INSTITUTE_COST,
  WEATHER_BUREAU_COST,

  // Insurance
  MAX_INSURANCE_POLICIES,

  // Progress Track
  PROGRESS_THRESHOLDS,

  // Game State
  PHASES,
  FACTIONS,

  // Starting Resources
  STARTING_CASH,
  STARTING_INCOME,
  STARTING_OFFICER_INCOME,
  STARTING_ENGINEER_INCOME,
  STARTING_OFFICERS,
  STARTING_ENGINEERS,
  STARTING_HYDROGEN,
  STARTING_HELIUM,
  STARTING_RESEARCH,
  STARTING_INFLUENCE,

  // Ship Stats
  AGE_BASELINES,

  // Technology
  TECHNOLOGY_BAG
};
