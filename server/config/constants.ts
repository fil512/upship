/**
 * Game Constants
 * Centralized configuration for all magic values
 */

import type { Faction, GamePhase } from '@upship/api';

// Gas Market
export const HYDROGEN_PRICE = 1;

// Helium Market (Brass Lancashire-style supply market)
// Price track: £1, £2, £3, £4, £5, £6 per cube (index 0 = £1)
export const HELIUM_PRICE_TRACK = [1, 2, 3, 4, 5, 6] as const;
export const HELIUM_CUBES_PER_ROW = 3;
// Game starts with rows £1-£2 empty, rows £3-£6 full (12 cubes)
export const HELIUM_INITIAL_CUBES = [0, 0, 3, 3, 3, 3] as const;
export const MINISTRY_REPLENISH_CUBES = 3;
export const USA_DOMESTIC_HELIUM_PRICE = 2;

// Income limits
export const MIN_INCOME = -10;  // Minimum income track (for insurance validation)

// Game Progression
export const HAND_SIZE = 5;
export const INITIAL_AGENTS = 2;  // Per rules Section 2.1: Start with 2 agents, 3rd earned at Officer Income +3

// R&D Board size (5 tiles for all ages, matching Market Row)
export const RD_BOARD_SIZE = 5;
// Market Row size per Section 3.1: "deal 5 cards face-up to form the Market Row"
export const MARKET_ROW_SIZE = 5;

// Crew Costs
export const OFFICER_RECRUIT_COST = 2;
export const ENGINEER_RECRUIT_COST = 4;
export const FLIGHT_SCHOOL_COST = 5;
export const TECHNICAL_INSTITUTE_COST = 6;
export const WEATHER_BUREAU_COST = 2;
export const RESEARCH_INSTITUTE_COST = 4; // £4 per level per Section 6.1

// Insurance
export const MAX_INSURANCE_POLICIES = 3;

// Progress Track Thresholds (fixed per Section 1.3)
// Based on successful launches: 8 in Age 1, 8 in Age 2, 6 in Age 3
export const PROGRESS_THRESHOLDS = { age2: 8, age3: 16, end: 22 };

// Valid game phases
export const PHASES: Record<string, GamePhase> = {
  WORKER_PLACEMENT: 'worker_placement',
  REVEAL: 'reveal',
  CLEANUP: 'cleanup'
};

// Valid factions
export const FACTIONS: Faction[] = ['germany', 'britain', 'usa', 'italy'];

// Starting player resources
export const STARTING_CASH = 15;
export const STARTING_INCOME = 5;
export const STARTING_OFFICER_INCOME = 1;
export const STARTING_ENGINEER_INCOME = 1;
export const STARTING_OFFICERS = 1;
export const STARTING_ENGINEERS = 2;
export const STARTING_HYDROGEN = 2;
export const STARTING_HELIUM = 0;
export const STARTING_RESEARCH = 0;
export const STARTING_INFLUENCE = 0;

// Age Baselines for ship stats
// All stats come from installed tech tiles, not from the age itself
export const AGE_BASELINES: Record<number, { speed: number; range: number; ceiling: number; reliability: number }> = {
  1: { speed: 0, range: 0, ceiling: 0, reliability: 0 },
  2: { speed: 0, range: 0, ceiling: 0, reliability: 0 },
  3: { speed: 0, range: 0, ceiling: 0, reliability: 0 }
};

// Tech Card type
export interface TechCard {
  id: string;
  name: string;
  type: 'drive' | 'structure' | 'fabric' | 'gas' | 'component';
  cost: number;
  vp: number;
  income: number;
  stats?: {
    lift?: number;
    range?: number;
  };
}

// Tech Card Bag organized by Age (54 total cards per Appendix C)
// IMPORTANT: This is the single source of truth for all tech card definitions
// All other files should import from here, not define their own versions
export const TECH_CARD_BAG: Record<number, TechCard[]> = {
  1: [ // Age I Technologies (15 tiles) - Cost range: 3-5 Research
    // Propulsion (3 tiles)
    { id: 'daimler_engine', name: 'Daimler Petrol Engine', type: 'drive', cost: 3, vp: 0, income: 1 },
    { id: 'improved_propeller', name: 'Improved Propeller', type: 'drive', cost: 3, vp: 0, income: 1 },
    { id: 'dual_engine_mount', name: 'Dual Engine Mount', type: 'drive', cost: 5, vp: 1, income: 1 },
    // Frame (2 tiles)
    { id: 'wooden_framework', name: 'Wooden Framework', type: 'structure', cost: 3, vp: 0, income: 1 },
    { id: 'wire_bracing', name: 'Wire Bracing', type: 'structure', cost: 5, vp: 1, income: 1 },
    // Fabric (2 tiles)
    { id: 'rubberized_cotton', name: 'Rubberized Cotton', type: 'fabric', cost: 3, vp: 0, income: 1 },
    { id: 'doped_canvas', name: 'Doped Canvas', type: 'fabric', cost: 5, vp: 0, income: 1 },
    // Gas Systems (2 tiles)
    { id: 'improved_valving', name: 'Improved Valving', type: 'gas', cost: 3, vp: 0, income: 1 },
    { id: 'manual_ballonets', name: 'Manual Ballonets', type: 'gas', cost: 3, vp: 0, income: 1 },
    // Payload (4 tiles)
    { id: 'gondola_shielding', name: 'Gondola Shielding', type: 'component', cost: 3, vp: 0, income: 1 },
    { id: 'observation_platform', name: 'Observation Platform', type: 'component', cost: 3, vp: 0, income: 1 },
    { id: 'mail_compartment', name: 'Mail Compartment', type: 'component', cost: 3, vp: 0, income: 1 },
    { id: 'cargo_nets', name: 'Cargo Nets', type: 'component', cost: 5, vp: 1, income: 1 },
    // New ceiling/reliability upgrade paths (balance fix)
    { id: 'altitude_compensator', name: 'Altitude Compensator', type: 'gas', cost: 3, vp: 0, income: 1 },
    { id: 'safety_valves', name: 'Safety Valves', type: 'gas', cost: 3, vp: 0, income: 1 }
  ],
  2: [ // Age II Technologies (22 tiles) - Cost range: 4-6 Research
    // Note: Helium Handling is NOT in the bag - it's the Reserve Tech Card (always available)
    // Propulsion (4 tiles)
    { id: 'maybach_engine', name: 'Maybach Engine Design', type: 'drive', cost: 5, vp: 0, income: 2 },
    { id: 'diesel_powerplant', name: 'Diesel Powerplant', type: 'drive', cost: 5, vp: 1, income: 1 },
    { id: 'swiveling_propeller', name: 'Swiveling Propeller', type: 'drive', cost: 6, vp: 1, income: 2 },
    { id: 'contra_rotating', name: 'Contra-Rotating Props', type: 'drive', cost: 6, vp: 0, income: 2 },
    // Frame (5 tiles)
    { id: 'duralumin_framework', name: 'Duralumin Framework', type: 'structure', cost: 5, vp: 0, income: 2 },
    { id: 'steel_framework', name: 'Steel Framework', type: 'structure', cost: 4, vp: 2, income: 1 },
    { id: 'internal_keel', name: 'Internal Keel', type: 'structure', cost: 5, vp: 1, income: 1 },
    { id: 'articulated_keel', name: 'Articulated Keel Design', type: 'structure', cost: 5, vp: 2, income: 1 },
    { id: 'aerodynamic_hull', name: 'Aerodynamic Hull Design', type: 'structure', cost: 5, vp: 1, income: 1 },
    // Fabric (4 tiles)
    { id: 'goldbeater_skin', name: "Goldbeater's Skin", type: 'fabric', cost: 6, vp: 2, income: 2 },
    { id: 'fireproof_coating', name: 'Fireproof Coating', type: 'fabric', cost: 5, vp: 2, income: 1 },
    { id: 'aluminum_doping', name: 'Aluminum Doping', type: 'fabric', cost: 5, vp: 1, income: 1 },
    { id: 'grounding_systems', name: 'Grounding Systems', type: 'fabric', cost: 5, vp: 1, income: 1 },
    // Gas Systems (3 tiles) - Helium Handling is Reserve Tech Card, not in bag
    { id: 'multiple_gas_cells', name: 'Multiple Gas Cells', type: 'gas', cost: 5, vp: 0, income: 1 },
    { id: 'blaugas_system', name: 'Blaugas Fuel System', type: 'gas', cost: 5, vp: 2, income: 2 },
    { id: 'automatic_valves', name: 'Automatic Valves', type: 'gas', cost: 6, vp: 1, income: 2 },
    // Payload (6 tiles)
    { id: 'passenger_gondola', name: 'Passenger Gondola', type: 'component', cost: 5, vp: 0, income: 1 },
    { id: 'bomb_bay', name: 'Bomb Bay Design', type: 'component', cost: 6, vp: 3, income: 2 },
    { id: 'trapeze_system', name: 'Trapeze System', type: 'component', cost: 6, vp: 2, income: 2 },
    { id: 'radio_equipment', name: 'Radio Equipment', type: 'component', cost: 5, vp: 1, income: 1 },
    { id: 'armored_gondola', name: 'Armored Gondola', type: 'component', cost: 4, vp: 1, income: 1 },
    { id: 'reinforced_hull', name: 'Reinforced Hull', type: 'component', cost: 6, vp: 2, income: 2 },
    // New ceiling/reliability upgrade paths (balance fix)
    { id: 'pressurized_cabin_tech', name: 'Pressurized Cabin', type: 'component', cost: 5, vp: 1, income: 2 },
    { id: 'redundant_systems', name: 'Redundant Systems', type: 'component', cost: 5, vp: 1, income: 1 }
  ],
  3: [ // Age III Technologies (19 tiles) - Cost range: 5-7 Research
    // Propulsion (4 tiles)
    { id: 'streamlined_nacelle', name: 'Streamlined Nacelle', type: 'drive', cost: 5, vp: 0, income: 2 },
    { id: 'supercharged_engine', name: 'Supercharged Engine', type: 'drive', cost: 6, vp: 1, income: 3 },
    { id: 'diesel_electric', name: 'Diesel-Electric Drive', type: 'drive', cost: 6, vp: 1, income: 2 },
    { id: 'variable_pitch', name: 'Variable-Pitch Propeller', type: 'drive', cost: 5, vp: 0, income: 2 },
    // Frame (3 tiles)
    { id: 'geodetic_structure', name: 'Geodetic Structure', type: 'structure', cost: 5, vp: 0, income: 2 },
    { id: 'modular_construction', name: 'Modular Construction', type: 'structure', cost: 6, vp: 3, income: 2 },
    { id: 'dynamic_lift', name: 'Dynamic Lift Surfaces', type: 'structure', cost: 6, vp: 2, income: 2 },
    // Fabric (2 tiles)
    { id: 'gelatinized_latex', name: 'Gelatinized Latex', type: 'fabric', cost: 5, vp: 0, income: 2 },
    { id: 'composite_covering', name: 'Composite Covering', type: 'fabric', cost: 6, vp: 1, income: 2 },
    // Gas Systems (5 tiles)
    { id: 'pressure_altitude', name: 'Pressure Altitude System', type: 'gas', cost: 6, vp: 1, income: 3 },
    { id: 'triple_gas_cell', name: 'Triple Gas Cell', type: 'gas', cost: 5, vp: 0, income: 2 },
    { id: 'emergency_venting', name: 'Emergency Venting', type: 'gas', cost: 5, vp: 2, income: 2 },
    { id: 'gas_recovery', name: 'Gas Recovery', type: 'gas', cost: 6, vp: 2, income: 2 },
    { id: 'water_recovery', name: 'Water Recovery System', type: 'gas', cost: 6, vp: 1, income: 2 },
    // Payload (5 tiles)
    { id: 'luxury_accommodation', name: 'Luxury Accommodation', type: 'component', cost: 5, vp: 0, income: 2 },
    { id: 'dining_saloon', name: 'Dining Saloon', type: 'component', cost: 6, vp: 0, income: 3 },
    { id: 'promenade_deck', name: 'Promenade Deck', type: 'component', cost: 7, vp: 2, income: 3 },
    { id: 'sleeping_quarters', name: 'Sleeping Quarters', type: 'component', cost: 5, vp: 1, income: 2 },
    { id: 'smoking_room', name: 'Smoking Room', type: 'component', cost: 6, vp: 3, income: 2 }
  ]
};

// Legacy alias for backwards compatibility during migration
export const TECHNOLOGY_BAG = TECH_CARD_BAG;

// CommonJS compatibility for gradual migration
module.exports = {
  // Gas Market
  HYDROGEN_PRICE,
  HELIUM_PRICE_TRACK,
  HELIUM_CUBES_PER_ROW,
  HELIUM_INITIAL_CUBES,
  MINISTRY_REPLENISH_CUBES,
  USA_DOMESTIC_HELIUM_PRICE,

  // Income limits
  MIN_INCOME,

  // Game Progression
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

  // Tech Cards
  TECH_CARD_BAG,
  // Legacy alias for backwards compatibility during migration
  TECHNOLOGY_BAG: TECH_CARD_BAG
};
