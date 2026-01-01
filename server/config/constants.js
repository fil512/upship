/**
 * Game Constants
 * Centralized configuration for all magic values
 */

// Gas Market
const HYDROGEN_PRICE = 1;
const HELIUM_PRICE_TRACK = [2, 3, 4, 5, 6, 8, 10, 15];

// Loans (The Bank) - per Section 5.3
const MAX_LOANS = 2;
const LOAN_AMOUNT = 30;
const LOAN_INCOME_PENALTY = 3;
const MIN_INCOME = -10;  // Debt limit per Section 5.3

// Game Progression
const TURNS_PER_AGE = 10;
const HAND_SIZE = 5;
const INITIAL_AGENTS = 2;  // Per rules Section 2.1: Start with 2 agents, 3rd earned at Officer Income +3

// R&D Board sizes by age
const RD_BOARD_SIZE = { 1: 4, 2: 5, 3: 6 };
// Market Row size per Section 3.1: "deal 5 cards face-up to form the Market Row"
const MARKET_ROW_SIZE = 5;

// Crew Costs
const OFFICER_RECRUIT_COST = 2;
const ENGINEER_RECRUIT_COST = 4;
const FLIGHT_SCHOOL_COST = 5;
const TECHNICAL_INSTITUTE_COST = 6;
const WEATHER_BUREAU_COST = 2;
const RESEARCH_INSTITUTE_COST = 4; // £4 per level per Section 6.1

// Insurance
const MAX_INSURANCE_POLICIES = 3;

// Progress Track Thresholds by player count
// Balanced for medium-length games (~20-24 progress to end)
const PROGRESS_THRESHOLDS = {
  2: { age2: 4, age3: 8, end: 12 },
  3: { age2: 6, age3: 12, end: 18 },
  4: { age2: 8, age3: 16, end: 24 }
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

// Technology Bag organized by Age (54 total tiles per Appendix C)
// IMPORTANT: This is the single source of truth for all technology definitions
// All other files should import from here, not define their own versions
const TECHNOLOGY_BAG = {
  1: [ // Age I Technologies (12 tiles)
    // Propulsion (3 tiles)
    { id: 'daimler_engine', name: 'Daimler Petrol Engine', type: 'drive', cost: 1, vp: 0, income: 1 },
    { id: 'improved_propeller', name: 'Improved Propeller', type: 'drive', cost: 1, vp: 0, income: 1 },
    { id: 'dual_engine_mount', name: 'Dual Engine Mount', type: 'drive', cost: 2, vp: 1, income: 1 },
    // Frame (2 tiles)
    { id: 'wooden_framework', name: 'Wooden Framework', type: 'structure', cost: 1, vp: 0, income: 1 },
    { id: 'wire_bracing', name: 'Wire Bracing', type: 'structure', cost: 2, vp: 1, income: 1 },
    // Fabric (2 tiles)
    { id: 'rubberized_cotton', name: 'Rubberized Cotton', type: 'fabric', cost: 1, vp: 0, income: 1 },
    { id: 'doped_canvas', name: 'Doped Canvas', type: 'fabric', cost: 2, vp: 0, income: 1 },
    // Gas Systems (2 tiles)
    { id: 'improved_valving', name: 'Improved Valving', type: 'gas', cost: 1, vp: 0, income: 1 },
    { id: 'manual_ballonets', name: 'Manual Ballonets', type: 'gas', cost: 1, vp: 0, income: 1 },
    // Payload (3 tiles)
    { id: 'observation_platform', name: 'Observation Platform', type: 'component', cost: 1, vp: 0, income: 1 },
    { id: 'mail_compartment', name: 'Mail Compartment', type: 'component', cost: 1, vp: 0, income: 1 },
    { id: 'cargo_nets', name: 'Cargo Nets', type: 'component', cost: 2, vp: 1, income: 1 }
  ],
  2: [ // Age II Technologies (23 tiles)
    // Propulsion (4 tiles)
    { id: 'maybach_engine', name: 'Maybach Engine Design', type: 'drive', cost: 3, vp: 0, income: 2 },
    { id: 'diesel_powerplant', name: 'Diesel Powerplant', type: 'drive', cost: 3, vp: 1, income: 1 },
    { id: 'swiveling_propeller', name: 'Swiveling Propeller', type: 'drive', cost: 4, vp: 1, income: 2 },
    { id: 'contra_rotating', name: 'Contra-Rotating Props', type: 'drive', cost: 4, vp: 0, income: 2 },
    // Frame (5 tiles)
    { id: 'duralumin_framework', name: 'Duralumin Framework', type: 'structure', cost: 3, vp: 0, income: 2 },
    { id: 'steel_framework', name: 'Steel Framework', type: 'structure', cost: 2, vp: 2, income: 1 },
    { id: 'internal_keel', name: 'Internal Keel', type: 'structure', cost: 3, vp: 1, income: 1 },
    { id: 'articulated_keel', name: 'Articulated Keel Design', type: 'structure', cost: 3, vp: 2, income: 1 },
    { id: 'aerodynamic_hull', name: 'Aerodynamic Hull Design', type: 'structure', cost: 3, vp: 1, income: 1, stats: { lift: 2 } },
    // Fabric (4 tiles)
    { id: 'goldbeater_skin', name: "Goldbeater's Skin", type: 'fabric', cost: 4, vp: 2, income: 2 },
    { id: 'fireproof_coating', name: 'Fireproof Coating', type: 'fabric', cost: 3, vp: 2, income: 1 },
    { id: 'aluminum_doping', name: 'Aluminum Doping', type: 'fabric', cost: 3, vp: 1, income: 1 },
    { id: 'grounding_systems', name: 'Grounding Systems', type: 'fabric', cost: 3, vp: 1, income: 1 },
    // Gas Systems (4 tiles)
    { id: 'multiple_gas_cells', name: 'Multiple Gas Cells', type: 'gas', cost: 3, vp: 0, income: 1 },
    { id: 'helium_handling', name: 'Helium Handling', type: 'gas', cost: 4, vp: 0, income: 2 },
    { id: 'blaugas_system', name: 'Blaugas Fuel System', type: 'gas', cost: 3, vp: 2, income: 2, stats: { range: 1 } },
    { id: 'automatic_valves', name: 'Automatic Valves', type: 'gas', cost: 4, vp: 1, income: 2 },
    // Payload (6 tiles)
    { id: 'passenger_gondola', name: 'Passenger Gondola', type: 'component', cost: 3, vp: 0, income: 1 },
    { id: 'bomb_bay', name: 'Bomb Bay Design', type: 'component', cost: 4, vp: 3, income: 2 },
    { id: 'trapeze_system', name: 'Trapeze System', type: 'component', cost: 4, vp: 2, income: 2 },
    { id: 'radio_equipment', name: 'Radio Equipment', type: 'component', cost: 3, vp: 1, income: 1 },
    { id: 'armored_gondola', name: 'Armored Gondola', type: 'component', cost: 3, vp: 1, income: 1 },
    { id: 'reinforced_hull', name: 'Reinforced Hull', type: 'component', cost: 4, vp: 2, income: 2 }
  ],
  3: [ // Age III Technologies (20 tiles)
    // Propulsion (4 tiles)
    { id: 'streamlined_nacelle', name: 'Streamlined Nacelle', type: 'drive', cost: 4, vp: 0, income: 2 },
    { id: 'supercharged_engine', name: 'Supercharged Engine', type: 'drive', cost: 5, vp: 1, income: 3 },
    { id: 'diesel_electric', name: 'Diesel-Electric Drive', type: 'drive', cost: 5, vp: 1, income: 2 },
    { id: 'variable_pitch', name: 'Variable-Pitch Propeller', type: 'drive', cost: 4, vp: 0, income: 2 },
    // Frame (3 tiles)
    { id: 'geodetic_structure', name: 'Geodetic Structure', type: 'structure', cost: 4, vp: 0, income: 2 },
    { id: 'modular_construction', name: 'Modular Construction', type: 'structure', cost: 5, vp: 3, income: 2 },
    { id: 'dynamic_lift', name: 'Dynamic Lift Surfaces', type: 'structure', cost: 5, vp: 2, income: 2, stats: { lift: 4 } },
    // Fabric (2 tiles)
    { id: 'gelatinized_latex', name: 'Gelatinized Latex', type: 'fabric', cost: 4, vp: 0, income: 2 },
    { id: 'composite_covering', name: 'Composite Covering', type: 'fabric', cost: 5, vp: 1, income: 2 },
    // Gas Systems (5 tiles)
    { id: 'pressure_altitude', name: 'Pressure Altitude System', type: 'gas', cost: 5, vp: 1, income: 3 },
    { id: 'triple_gas_cell', name: 'Triple Gas Cell', type: 'gas', cost: 4, vp: 0, income: 2 },
    { id: 'emergency_venting', name: 'Emergency Venting', type: 'gas', cost: 4, vp: 2, income: 2 },
    { id: 'gas_recovery', name: 'Gas Recovery', type: 'gas', cost: 5, vp: 2, income: 2 },
    { id: 'water_recovery', name: 'Water Recovery System', type: 'gas', cost: 5, vp: 1, income: 2 },
    // Payload (6 tiles)
    { id: 'luxury_accommodation', name: 'Luxury Accommodation', type: 'component', cost: 4, vp: 0, income: 2 },
    { id: 'dining_saloon', name: 'Dining Saloon', type: 'component', cost: 5, vp: 0, income: 3 },
    { id: 'promenade_deck', name: 'Promenade Deck', type: 'component', cost: 6, vp: 2, income: 3 },
    { id: 'sleeping_quarters', name: 'Sleeping Quarters', type: 'component', cost: 4, vp: 1, income: 2 },
    { id: 'smoking_room', name: 'Smoking Room', type: 'component', cost: 5, vp: 3, income: 2 }
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
  MIN_INCOME,

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
  RESEARCH_INSTITUTE_COST,

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
