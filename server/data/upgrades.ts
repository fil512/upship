/**
 * Tech Tiles Data
 *
 * Each tech tile has:
 * - id: unique identifier
 * - name: display name
 * - type: drive | frame | fabric | component
 * - slotType: which slot type it goes in (frameSlots, fabricSlots, driveSlots, componentSlots)
 * - requiredCard: tech card ID that must be owned to install
 * - weight: how much Lift is consumed (negative number)
 * - hullCost: additional cost when building ships (for frame/fabric)
 * - stats: bonuses to Speed, Range, Ceiling, Reliability, Luxury, Income
 * - special: any special abilities
 * - age: minimum age when available (1, 2, or 3)
 */

import type { Faction } from '@upship/api';

// Slot property names (matching Blueprint interface)
export type SlotPropertyName = 'frameSlots' | 'fabricSlots' | 'driveSlots' | 'componentSlots';

export type TechTileType = 'drive' | 'frame' | 'fabric' | 'gas' | 'component';

export interface TechTileStats {
  speed?: number;
  range?: number;
  ceiling?: number;
  reliability?: number;
  luxury?: number;
  income?: number;
  lift?: number;
  armor?: number;
}

export interface TechTile {
  id: string;
  name: string;
  type: TechTileType;
  slotType: SlotPropertyName;
  requiredCard: string;
  weight: number;
  hullCost?: number;
  stats: TechTileStats;
  special: string | null;
  age: number;
}

export type TechCardType =
  | 'structure'
  | 'fabric'
  | 'gas'
  | 'drive'
  | 'component'
  | 'special';

export interface TechCard {
  id: string;
  name: string;
  type: TechCardType;
  cost: number;
  age: number;
  faction?: Faction;
  vp?: number;
}

export interface AgeBaseline {
  name: string;
  speed: number;
  range: number;
  ceiling: number;
  reliability: number;
  frameSlots: number;
  fabricSlots: number;
  driveSlots: number;
  componentSlots: number;
}

export interface Blueprint {
  frameSlots?: (string | null)[];
  fabricSlots?: (string | null)[];
  driveSlots?: (string | null)[];
  componentSlots?: (string | null)[];
  gasSockets?: string[];
}

export interface ShipStats {
  speed: number;
  range: number;
  ceiling: number;
  reliability: number;
  luxury: number;
  income: number;
  weight: number;
  hullCost: number;
}

export interface FactionBonuses {
  speed?: number;
  range?: number;
  ceiling?: number;
  reliability?: number;
  luxury?: number;
}

export interface LaunchCheck {
  canLaunch: boolean;
  lift: number;
  weight: number;
  message: string;
}

export const TECH_TILES: Record<string, TechTile> = {
  // === PROPULSION/DRIVE UPGRADES ===
  basic_engine: {
    id: 'basic_engine',
    name: 'Basic Engine',
    type: 'drive',
    slotType: 'driveSlots',
    requiredCard: 'daimler_engine',
    weight: -1,
    stats: { speed: 1 },
    special: null,
    age: 1
  },
  efficient_propeller: {
    id: 'efficient_propeller',
    name: 'Efficient Propeller',
    type: 'drive',
    slotType: 'driveSlots',
    requiredCard: 'improved_propeller',
    weight: -1,
    stats: { speed: 1, range: 1 },
    special: null,
    age: 1
  },
  twin_engine: {
    id: 'twin_engine',
    name: 'Twin Engine',
    type: 'drive',
    slotType: 'driveSlots',
    requiredCard: 'dual_engine_mount',
    weight: -3,
    stats: { speed: 2, reliability: 1 },
    special: null,
    age: 2
  },
  maybach_cx: {
    id: 'maybach_cx',
    name: 'Maybach CX Engine',
    type: 'drive',
    slotType: 'driveSlots',
    requiredCard: 'maybach_engine',
    weight: -2,
    stats: { speed: 2, range: 1 },
    special: null,
    age: 1
  },
  diesel_engine: {
    id: 'diesel_engine',
    name: 'Diesel Engine',
    type: 'drive',
    slotType: 'driveSlots',
    requiredCard: 'diesel_powerplant',
    weight: -2,
    stats: { range: 2, reliability: 1 },
    special: null,
    age: 2
  },
  vectored_thrust: {
    id: 'vectored_thrust',
    name: 'Vectored Thrust',
    type: 'drive',
    slotType: 'driveSlots',
    requiredCard: 'swiveling_propeller',
    weight: -2,
    stats: { speed: 1, ceiling: 1 },
    special: null,
    age: 2
  },
  balanced_propulsion: {
    id: 'balanced_propulsion',
    name: 'Balanced Propulsion',
    type: 'drive',
    slotType: 'driveSlots',
    requiredCard: 'contra_rotating',
    weight: -2,
    stats: { speed: 2, reliability: 1 },
    special: null,
    age: 2
  },
  aerodynamic_engine: {
    id: 'aerodynamic_engine',
    name: 'Aerodynamic Engine',
    type: 'drive',
    slotType: 'driveSlots',
    requiredCard: 'streamlined_nacelle',
    weight: -2,
    stats: { speed: 3 },
    special: null,
    age: 3
  },
  high_altitude_engine: {
    id: 'high_altitude_engine',
    name: 'High-Altitude Engine',
    type: 'drive',
    slotType: 'driveSlots',
    requiredCard: 'supercharged_engine',
    weight: -3,
    stats: { speed: 2, ceiling: 2 },
    special: null,
    age: 3
  },
  hybrid_powerplant: {
    id: 'hybrid_powerplant',
    name: 'Hybrid Powerplant',
    type: 'drive',
    slotType: 'driveSlots',
    requiredCard: 'diesel_electric',
    weight: -3,
    stats: { range: 3, reliability: 1 },
    special: null,
    age: 3
  },
  adaptive_propeller: {
    id: 'adaptive_propeller',
    name: 'Adaptive Propeller',
    type: 'drive',
    slotType: 'driveSlots',
    requiredCard: 'variable_pitch',
    weight: -2,
    stats: { speed: 1, range: 2 },
    special: null,
    age: 3
  },

  // === FRAME UPGRADES ===
  wooden_frame: {
    id: 'wooden_frame',
    name: 'Wooden Frame',
    type: 'frame',
    slotType: 'frameSlots',
    requiredCard: 'wooden_framework',
    weight: -2,
    hullCost: 1,
    stats: { reliability: 1 },
    special: null,
    age: 1
  },
  tensioned_frame: {
    id: 'tensioned_frame',
    name: 'Tensioned Frame',
    type: 'frame',
    slotType: 'frameSlots',
    requiredCard: 'wire_bracing',
    weight: -1,
    hullCost: 1,
    stats: { ceiling: 1 },
    special: null,
    age: 1
  },
  duralumin_frame: {
    id: 'duralumin_frame',
    name: 'Duralumin Frame',
    type: 'frame',
    slotType: 'frameSlots',
    requiredCard: 'duralumin_girders',
    weight: -2,
    hullCost: 2,
    stats: { reliability: 2, ceiling: 1 },
    special: null,
    age: 1
  },
  steel_frame: {
    id: 'steel_frame',
    name: 'Steel Frame',
    type: 'frame',
    slotType: 'frameSlots',
    requiredCard: 'steel_framework',
    weight: -3,
    hullCost: 1,
    stats: { reliability: 2 },
    special: 'heavy_but_cheap',
    age: 2
  },
  semi_rigid_keel: {
    id: 'semi_rigid_keel',
    name: 'Semi-Rigid Keel',
    type: 'frame',
    slotType: 'frameSlots',
    requiredCard: 'internal_keel',
    weight: -2,
    hullCost: 1,
    stats: { reliability: 1 },
    special: 'italy_specialty',
    age: 2
  },
  geodetic_frame: {
    id: 'geodetic_frame',
    name: 'Geodetic Frame',
    type: 'frame',
    slotType: 'frameSlots',
    requiredCard: 'geodetic_structure',
    weight: -1,
    hullCost: 3,
    stats: { reliability: 2, ceiling: 1 },
    special: 'lightest_expensive',
    age: 3
  },
  modular_frame: {
    id: 'modular_frame',
    name: 'Modular Frame',
    type: 'frame',
    slotType: 'frameSlots',
    requiredCard: 'modular_construction',
    weight: -1,
    hullCost: 2,
    stats: {},
    special: null,
    age: 3
  },
  flexible_frame: {
    id: 'flexible_frame',
    name: 'Flexible Frame',
    type: 'frame',
    slotType: 'frameSlots',
    requiredCard: 'articulated_keel',
    weight: 0,  // Per Appendix D: weight is 0, not -1
    hullCost: 1,
    stats: { ceiling: 1 },  // Per Section 13.4: +1 Ceiling (not reliability)
    special: 'weather_penalty',  // Per Section 13.4: -1 to Reliability checks during Weather hazards
    age: 1  // Italy starting tech, available from Age 1
  },
  streamlined_hull: {
    id: 'streamlined_hull',
    name: 'Streamlined Hull',
    type: 'frame',
    slotType: 'frameSlots',
    requiredCard: 'aerodynamic_hull_design',
    weight: -1,
    hullCost: 2,
    stats: { lift: 2 },  // Provides lift without gas
    special: null,
    age: 2
  },
  aerodynamic_lift_system: {
    id: 'aerodynamic_lift_system',
    name: 'Aerodynamic Lift System',
    type: 'frame',
    slotType: 'frameSlots',
    requiredCard: 'dynamic_lift_surfaces',
    weight: -2,
    hullCost: 3,
    stats: { lift: 4 },  // Provides lift without gas
    special: null,
    age: 3
  },

  // === FABRIC UPGRADES ===
  cotton_envelope: {
    id: 'cotton_envelope',
    name: 'Cotton Envelope',
    type: 'fabric',
    slotType: 'fabricSlots',
    requiredCard: 'rubberized_cotton',
    weight: 0,
    hullCost: 0,
    stats: {},
    special: null,
    age: 1
  },
  doped_covering: {
    id: 'doped_covering',
    name: 'Doped Covering',
    type: 'fabric',
    slotType: 'fabricSlots',
    requiredCard: 'doped_canvas',
    weight: 0,
    hullCost: 1,
    stats: { speed: 1 },
    special: 'improved_aerodynamics',
    age: 1
  },
  premium_envelope: {
    id: 'premium_envelope',
    name: 'Premium Envelope',
    type: 'fabric',
    slotType: 'fabricSlots',
    requiredCard: 'goldbeater_skin',
    weight: 0,
    hullCost: 3,
    stats: { reliability: 1, range: 1 },
    special: 'best_gas_tightness',
    age: 1
  },
  fire_resistant_fabric: {
    id: 'fire_resistant_fabric',
    name: 'Fire-Resistant Fabric',
    type: 'fabric',
    slotType: 'fabricSlots',
    requiredCard: 'fireproof_coating',
    weight: -1,
    hullCost: 2,
    stats: { reliability: 1 },
    special: 'fire_protection',
    age: 2
  },
  reflective_covering: {
    id: 'reflective_covering',
    name: 'Reflective Covering',
    type: 'fabric',
    slotType: 'fabricSlots',
    requiredCard: 'aluminum_doping',
    weight: 0,
    hullCost: 1,
    stats: { reliability: 1 },
    special: 'heat_protection',
    age: 2
  },
  synthetic_envelope: {
    id: 'synthetic_envelope',
    name: 'Synthetic Envelope',
    type: 'fabric',
    slotType: 'fabricSlots',
    requiredCard: 'gelatinized_latex',
    weight: 0,
    hullCost: 2,
    stats: { reliability: 1, range: 1 },
    special: null,
    age: 3
  },
  advanced_fabric: {
    id: 'advanced_fabric',
    name: 'Advanced Fabric',
    type: 'fabric',
    slotType: 'fabricSlots',
    requiredCard: 'composite_covering',
    weight: 0,
    hullCost: 2,
    stats: { reliability: 2 },
    special: 'multi_layer',
    age: 3
  },
  conductive_covering: {
    id: 'conductive_covering',
    name: 'Conductive Covering',
    type: 'fabric',
    slotType: 'fabricSlots',
    requiredCard: 'grounding_systems',
    weight: 0,
    hullCost: 1,
    stats: { reliability: 1 },
    special: 'static_immunity',
    age: 2
  },

  // === GAS SYSTEM UPGRADES ===
  // Per Appendix D: Gas System upgrades enhance or modify gas cell performance
  pressure_control: {
    id: 'pressure_control',
    name: 'Pressure Control',
    type: 'gas',
    slotType: 'componentSlots',  // Gas upgrades go in component/payload slots
    requiredCard: 'improved_valving',
    weight: -1,
    stats: { ceiling: 1 },
    special: null,
    age: 1
  },
  altitude_ballonets: {
    id: 'altitude_ballonets',
    name: 'Altitude Ballonets',
    type: 'gas',
    slotType: 'componentSlots',
    requiredCard: 'manual_ballonets',
    weight: -1,
    stats: { ceiling: 1 },
    special: null,
    age: 1
  },
  compartmented_gas: {
    id: 'compartmented_gas',
    name: 'Compartmented Gas',
    type: 'gas',
    slotType: 'componentSlots',
    requiredCard: 'multiple_gas_cells',
    weight: -1,
    stats: { lift: 2, reliability: 1 },
    special: null,
    age: 2
  },
  helium_gas_cell: {
    id: 'helium_gas_cell',
    name: 'Helium Gas Cell',
    type: 'gas',
    slotType: 'componentSlots',
    requiredCard: 'helium_handling',
    weight: -1,
    stats: {},
    special: 'fire_immunity',  // Safe: immune to Fire hazards; use Helium cubes
    age: 2
  },
  blaugas_tank: {
    id: 'blaugas_tank',
    name: 'Blaugas Tank',
    type: 'gas',
    slotType: 'componentSlots',
    requiredCard: 'blaugas_storage',
    weight: 0,
    stats: { range: 1 },
    special: 'gas_retention',  // Pay £2 to keep gas cubes after mission (Germany)
    age: 2
  },
  smart_valving: {
    id: 'smart_valving',
    name: 'Smart Valving',
    type: 'gas',
    slotType: 'componentSlots',
    requiredCard: 'automatic_valves',
    weight: -1,
    stats: { reliability: 1, ceiling: 1 },
    special: null,
    age: 2
  },
  high_ceiling_gas: {
    id: 'high_ceiling_gas',
    name: 'High-Ceiling Gas',
    type: 'gas',
    slotType: 'componentSlots',
    requiredCard: 'pressure_altitude_system',
    weight: -2,
    stats: { lift: 3, ceiling: 2 },
    special: null,
    age: 3
  },
  redundant_cells: {
    id: 'redundant_cells',
    name: 'Redundant Cells',
    type: 'gas',
    slotType: 'componentSlots',
    requiredCard: 'triple_gas_cell',
    weight: -2,
    stats: { lift: 4, reliability: 2 },
    special: null,
    age: 3
  },
  rapid_descent_system: {
    id: 'rapid_descent_system',
    name: 'Rapid Descent System',
    type: 'gas',
    slotType: 'componentSlots',
    requiredCard: 'emergency_venting',
    weight: -1,
    stats: { reliability: 2 },
    special: 'weather_auto_pass',  // Auto-pass Weather-type hazards
    age: 3
  },
  reclamation_system: {
    id: 'reclamation_system',
    name: 'Reclamation System',
    type: 'gas',
    slotType: 'componentSlots',
    requiredCard: 'gas_recovery',
    weight: -1,
    stats: { range: 2 },
    special: 'gas_cost_reduction',  // -£2 Lifting Gas cost
    age: 3
  },
  exhaust_condensers: {
    id: 'exhaust_condensers',
    name: 'Exhaust Condensers',
    type: 'gas',
    slotType: 'componentSlots',
    requiredCard: 'water_recovery_system',
    weight: -2,
    stats: {},
    special: 'helium_cost_reduction',  // -£3 Helium cost (USA specialty)
    age: 3
  },

  // === COMPONENT/PAYLOAD UPGRADES ===
  // Per Appendix D: Payload upgrades - names match spec exactly

  // Age I Payload Upgrades
  spotter_gondola: {
    id: 'spotter_gondola',
    name: 'Spotter Gondola',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'observation_platform',
    weight: -1,
    stats: { income: 1 },
    special: null,
    age: 1
  },
  postal_service: {
    id: 'postal_service',
    name: 'Postal Service',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'mail_compartment',
    weight: -1,
    stats: { income: 2 },
    special: null,
    age: 1
  },
  external_cargo: {
    id: 'external_cargo',
    name: 'External Cargo',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'cargo_nets',
    weight: -2,
    stats: { income: 2 },
    special: null,
    age: 1
  },

  // Age II Payload Upgrades
  passenger_gondola: {
    id: 'passenger_gondola',
    name: 'Basic Cabin',  // Upgrade name per Appendix D
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'passenger_gondola',
    weight: -2,
    stats: { income: 2, luxury: 1 },  // Fixed: income was 1, now 2
    special: null,
    age: 2
  },
  bombing_equipment: {
    id: 'bombing_equipment',
    name: 'Bombing Equipment',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'bomb_bay_design',
    weight: -3,
    stats: {},
    special: 'combat_income_bonus',  // Combat Missions: +£3 Income
    age: 2
  },
  sparrowhawk_hangar: {
    id: 'sparrowhawk_hangar',
    name: 'Sparrowhawk Hangar',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'trapeze_system',
    weight: -3,
    stats: {},
    special: 'ignore_route_requirement',  // Ignore one route requirement (USA specialty)
    age: 2
  },
  communications_suite: {
    id: 'communications_suite',
    name: 'Communications Suite',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'radio_equipment',
    weight: -1,
    stats: { reliability: 1 },
    special: 'navigation_bonus',  // +1 to Navigation hazards
    age: 2
  },
  light_armor_plating: {
    id: 'light_armor_plating',
    name: 'Light Armor Plating',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'armored_gondola',
    weight: -2,
    stats: { armor: 1 },
    special: null,
    age: 2
  },
  heavy_armor_plating: {
    id: 'heavy_armor_plating',
    name: 'Heavy Armor Plating',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'reinforced_hull',
    weight: -3,
    stats: { armor: 2 },
    special: null,
    age: 2
  },

  // Age III Payload Upgrades
  luxury_cabin: {
    id: 'luxury_cabin',
    name: 'Luxury Cabin',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'luxury_accommodation',
    weight: -3,
    stats: { income: 3, luxury: 2 },
    special: null,
    age: 3
  },
  restaurant: {
    id: 'restaurant',
    name: 'Restaurant',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'dining_saloon',
    weight: -2,
    stats: { income: 2, luxury: 2 },
    special: null,
    age: 3
  },
  observation_lounge: {
    id: 'observation_lounge',
    name: 'Observation Lounge',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'promenade_deck',
    weight: -2,
    stats: { income: 1, luxury: 3 },
    special: null,
    age: 3
  },
  sleeping_quarters: {
    id: 'sleeping_quarters',
    name: 'Private Berths',  // Upgrade name per Appendix D
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'sleeping_quarters',
    weight: -2,
    stats: { income: 2, luxury: 1 },  // Fixed: was luxury: 2, range: 1
    special: null,
    age: 3
  },
  pressurized_lounge: {
    id: 'pressurized_lounge',
    name: 'Pressurized Lounge',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'smoking_room',
    weight: -2,
    stats: { income: 1, luxury: 2 },
    special: 'requires_helium',  // Requires Helium Gas Cell installed
    age: 3
  },
  imperial_mast: {
    id: 'imperial_mast',
    name: 'Imperial Mast',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'imperial_mooring',
    weight: -1,
    stats: {},
    special: 'british_territories_home',  // British Territories count as Home Base (Britain specialty)
    age: 2
  },

  // Legacy aliases for backwards compatibility (map old names to new)
  // These remain for any existing save data referencing old names
  observation_deck: {
    id: 'observation_deck',
    name: 'Observation Deck (Legacy)',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'observation_platform',
    weight: -1,
    stats: { income: 1 },  // Updated to match spotter_gondola
    special: null,
    age: 1
  },
  cargo_hold: {
    id: 'cargo_hold',
    name: 'Cargo Hold (Legacy)',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'cargo_nets',
    weight: -2,
    stats: { income: 2 },
    special: null,
    age: 1
  },
  dining_saloon: {
    id: 'dining_saloon',
    name: 'Dining Saloon (Legacy)',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'dining_saloon',
    weight: -2,  // Fixed: was -3
    stats: { income: 2, luxury: 2 },  // Fixed: was luxury: 3, no income
    special: null,
    age: 3
  },
  radio_room: {
    id: 'radio_room',
    name: 'Radio Room (Legacy)',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'radio_equipment',
    weight: -1,
    stats: { reliability: 1 },
    special: 'navigation_bonus',
    age: 2
  },
  luxury_lounge: {
    id: 'luxury_lounge',
    name: 'Luxury Lounge (Legacy)',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'luxury_accommodation',
    weight: -3,
    stats: { income: 3, luxury: 2 },
    special: null,
    age: 3
  },
  mail_compartment: {
    id: 'mail_compartment',
    name: 'Mail Compartment (Legacy)',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'mail_compartment',
    weight: -1,
    stats: { income: 2 },
    special: null,
    age: 1
  },
  navigation_suite: {
    id: 'navigation_suite',
    name: 'Navigation Suite',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'advanced_navigation',
    weight: -1,
    stats: { reliability: 2, range: 1 },
    special: null,
    age: 3
  },
  pressurized_cabin: {
    id: 'pressurized_cabin',
    name: 'Pressurized Cabin (Legacy)',
    type: 'component',
    slotType: 'componentSlots',
    requiredCard: 'smoking_room',
    weight: -2,
    stats: { income: 1, luxury: 2 },
    special: 'requires_helium',
    age: 3
  }
};

/**
 * Tech Card Definitions
 * Maps tech card IDs to their tech tile unlock and metadata
 */
export const TECH_CARDS: Record<string, TechCard> = {
  // Faction starting techs (pre-printed on player boards, cost 0, don't advance Progress)
  // Germany starting techs
  duralumin_girders: { id: 'duralumin_girders', name: 'Duralumin Framework', type: 'structure', cost: 0, age: 1, faction: 'germany' },
  goldbeater_skin: { id: 'goldbeater_skin', name: "Goldbeater's Skin", type: 'fabric', cost: 0, age: 1, faction: 'germany' },
  blaugas_storage: { id: 'blaugas_storage', name: 'Blaugas Fuel System', type: 'gas', cost: 0, age: 1, faction: 'germany' },

  // Britain starting techs
  wire_bracing: { id: 'wire_bracing', name: 'Wire Bracing', type: 'structure', cost: 0, age: 1, faction: 'britain' },
  doped_canvas: { id: 'doped_canvas', name: 'Doped Canvas', type: 'fabric', cost: 0, age: 1, faction: 'britain' },
  imperial_mooring: { id: 'imperial_mooring', name: 'Imperial Mooring System', type: 'special', cost: 0, age: 1, faction: 'britain' },

  // USA starting techs
  gelatinized_latex: { id: 'gelatinized_latex', name: 'Gelatinized Latex', type: 'fabric', cost: 0, age: 1, faction: 'usa' },
  trapeze_system: { id: 'trapeze_system', name: 'Trapeze Fighter System', type: 'special', cost: 0, age: 1, faction: 'usa' },
  helium_handling: { id: 'helium_handling', name: 'Helium Handling', type: 'gas', cost: 0, age: 1, faction: 'usa' },

  // Italy starting techs
  internal_keel: { id: 'internal_keel', name: 'Internal Keel', type: 'structure', cost: 0, age: 1, faction: 'italy' },
  rubberized_cotton: { id: 'rubberized_cotton', name: 'Rubberized Cotton', type: 'fabric', cost: 0, age: 1, faction: 'italy' },
  articulated_keel: { id: 'articulated_keel', name: 'Articulated Keel Design', type: 'structure', cost: 0, age: 1, faction: 'italy' },

  // Legacy entries (kept for backwards compatibility)
  rigid_frame: { id: 'rigid_frame', name: 'Rigid Frame', type: 'structure', cost: 0, age: 1 },
  dining_saloon: { id: 'dining_saloon', name: 'Dining Saloon', type: 'component', cost: 0, age: 1 },
  rapid_refit: { id: 'rapid_refit', name: 'Rapid Refit', type: 'structure', cost: 0, age: 1 },

  // Drive techs
  daimler_engine: { id: 'daimler_engine', name: 'Daimler Engine', type: 'drive', cost: 2, age: 1 },
  improved_propeller: { id: 'improved_propeller', name: 'Improved Propeller', type: 'drive', cost: 3, age: 1 },
  maybach_engine: { id: 'maybach_engine', name: 'Maybach Engine', type: 'drive', cost: 4, age: 1 },
  dual_engine_mount: { id: 'dual_engine_mount', name: 'Dual Engine Mount', type: 'drive', cost: 4, age: 2 },
  diesel_powerplant: { id: 'diesel_powerplant', name: 'Diesel Powerplant', type: 'drive', cost: 5, age: 2 },
  swiveling_propeller: { id: 'swiveling_propeller', name: 'Swiveling Propeller', type: 'drive', cost: 4, age: 2 },
  contra_rotating: { id: 'contra_rotating', name: 'Contra-Rotating Props', type: 'drive', cost: 5, age: 2 },
  streamlined_nacelle: { id: 'streamlined_nacelle', name: 'Streamlined Nacelle', type: 'drive', cost: 5, age: 3 },
  supercharged_engine: { id: 'supercharged_engine', name: 'Supercharged Engine', type: 'drive', cost: 6, age: 3 },
  diesel_electric: { id: 'diesel_electric', name: 'Diesel-Electric Drive', type: 'drive', cost: 6, age: 3 },
  variable_pitch: { id: 'variable_pitch', name: 'Variable-Pitch Propeller', type: 'drive', cost: 5, age: 3 },

  // Frame techs (acquirable from R&D)
  wooden_framework: { id: 'wooden_framework', name: 'Wooden Framework', type: 'structure', cost: 2, age: 1 },
  // wire_bracing - defined above as Britain starting tech
  steel_framework: { id: 'steel_framework', name: 'Steel Framework', type: 'structure', cost: 4, age: 2 },
  // internal_keel - defined above as Italy starting tech
  geodetic_structure: { id: 'geodetic_structure', name: 'Geodetic Structure', type: 'structure', cost: 6, age: 3 },
  modular_construction: { id: 'modular_construction', name: 'Modular Construction', type: 'structure', cost: 4, age: 3 },
  // articulated_keel - defined above as Italy starting tech

  // Fabric techs (acquirable from R&D)
  // rubberized_cotton - defined above as Italy starting tech
  // doped_canvas - defined above as Britain starting tech
  // goldbeater_skin - defined above as Germany starting tech
  fireproof_coating: { id: 'fireproof_coating', name: 'Fireproof Coating', type: 'fabric', cost: 4, age: 2 },
  aluminum_doping: { id: 'aluminum_doping', name: 'Aluminum Doping', type: 'fabric', cost: 3, age: 2 },
  grounding_systems: { id: 'grounding_systems', name: 'Grounding Systems', type: 'fabric', cost: 3, age: 2, vp: 0 },
  // gelatinized_latex - defined above as USA starting tech
  composite_covering: { id: 'composite_covering', name: 'Composite Covering', type: 'fabric', cost: 5, age: 3 },

  // Additional Frame techs per Appendix C
  aerodynamic_hull_design: { id: 'aerodynamic_hull_design', name: 'Aerodynamic Hull Design', type: 'structure', cost: 3, age: 2 },
  dynamic_lift_surfaces: { id: 'dynamic_lift_surfaces', name: 'Dynamic Lift Surfaces', type: 'structure', cost: 5, age: 3 },

  // Gas System techs per Appendix C
  improved_valving: { id: 'improved_valving', name: 'Improved Valving', type: 'gas', cost: 1, age: 1 },
  manual_ballonets: { id: 'manual_ballonets', name: 'Manual Ballonets', type: 'gas', cost: 1, age: 1 },
  multiple_gas_cells: { id: 'multiple_gas_cells', name: 'Multiple Gas Cells', type: 'gas', cost: 3, age: 2 },
  automatic_valves: { id: 'automatic_valves', name: 'Automatic Valves', type: 'gas', cost: 4, age: 2 },
  pressure_altitude_system: { id: 'pressure_altitude_system', name: 'Pressure Altitude System', type: 'gas', cost: 5, age: 3 },
  triple_gas_cell: { id: 'triple_gas_cell', name: 'Triple Gas Cell', type: 'gas', cost: 4, age: 3 },
  emergency_venting: { id: 'emergency_venting', name: 'Emergency Venting', type: 'gas', cost: 4, age: 3 },
  gas_recovery: { id: 'gas_recovery', name: 'Gas Recovery', type: 'gas', cost: 5, age: 3 },
  water_recovery_system: { id: 'water_recovery_system', name: 'Water Recovery System', type: 'gas', cost: 5, age: 3 },

  // Payload techs per Appendix C
  observation_platform: { id: 'observation_platform', name: 'Observation Platform', type: 'component', cost: 1, age: 1 },
  mail_compartment: { id: 'mail_compartment', name: 'Mail Compartment', type: 'component', cost: 1, age: 1 },
  cargo_nets: { id: 'cargo_nets', name: 'Cargo Nets', type: 'component', cost: 2, age: 1 },
  passenger_gondola: { id: 'passenger_gondola', name: 'Passenger Gondola', type: 'component', cost: 3, age: 2 },
  bomb_bay_design: { id: 'bomb_bay_design', name: 'Bomb Bay Design', type: 'component', cost: 4, age: 2 },
  armored_gondola: { id: 'armored_gondola', name: 'Armored Gondola', type: 'component', cost: 3, age: 2 },
  reinforced_hull: { id: 'reinforced_hull', name: 'Reinforced Hull', type: 'component', cost: 4, age: 2 },
  radio_equipment: { id: 'radio_equipment', name: 'Radio Equipment', type: 'component', cost: 3, age: 2 },
  luxury_accommodation: { id: 'luxury_accommodation', name: 'Luxury Accommodation', type: 'component', cost: 4, age: 3 },
  promenade_deck: { id: 'promenade_deck', name: 'Promenade Deck', type: 'component', cost: 6, age: 3 },
  sleeping_quarters: { id: 'sleeping_quarters', name: 'Sleeping Quarters', type: 'component', cost: 4, age: 3 },
  smoking_room: { id: 'smoking_room', name: 'Smoking Room', type: 'component', cost: 5, age: 3 },
  advanced_navigation: { id: 'advanced_navigation', name: 'Advanced Navigation', type: 'component', cost: 5, age: 3 },

  // Legacy/deprecated techs kept for backwards compatibility
  observation_deck: { id: 'observation_deck', name: 'Observation Deck (Legacy)', type: 'component', cost: 1, age: 1 },
  cargo_systems: { id: 'cargo_systems', name: 'Cargo Systems (Legacy)', type: 'component', cost: 2, age: 1 },
  luxury_fittings: { id: 'luxury_fittings', name: 'Luxury Fittings (Legacy)', type: 'component', cost: 4, age: 3 },
  mail_systems: { id: 'mail_systems', name: 'Mail Systems (Legacy)', type: 'component', cost: 1, age: 1 },
  pressurization: { id: 'pressurization', name: 'Pressurization (Legacy)', type: 'component', cost: 5, age: 3 }
};

/**
 * Age-specific baseline stats
 */
export const AGE_BASELINES: Record<number, AgeBaseline> = {
  1: {
    name: 'Pioneer Era',
    speed: 1,
    range: 1,
    ceiling: 0,
    reliability: 0,
    frameSlots: 1,
    fabricSlots: 1,
    driveSlots: 1,
    componentSlots: 1
  },
  2: {
    name: 'Great War',
    speed: 2,
    range: 2,
    ceiling: 1,
    reliability: 1,
    frameSlots: 1,
    fabricSlots: 1,
    driveSlots: 2,
    componentSlots: 2
  },
  3: {
    name: 'Golden Age',
    speed: 3,
    range: 3,
    ceiling: 2,
    reliability: 2,
    frameSlots: 2,
    fabricSlots: 2,
    driveSlots: 2,
    componentSlots: 3
  }
};

export interface AvailableTechTiles {
  driveSlots: TechTile[];
  frameSlots: TechTile[];
  fabricSlots: TechTile[];
  componentSlots: TechTile[];
}

/**
 * Get available tech tiles for a player based on owned tech cards
 * @param playerTechCards - List of tech card IDs the player owns
 * @param currentAge - Current game age (1, 2, or 3)
 * @returns Tech tiles grouped by slot type
 */
export function getAvailableTechTiles(playerTechCards: string[], currentAge: number): AvailableTechTiles {
  const available: AvailableTechTiles = {
    driveSlots: [],
    frameSlots: [],
    fabricSlots: [],
    componentSlots: []
  };

  for (const tile of Object.values(TECH_TILES)) {
    // Check if player owns required tech card
    if (!playerTechCards.includes(tile.requiredCard)) continue;

    // Check if tech tile is available in current age
    if (tile.age > currentAge) continue;

    available[tile.slotType].push(tile);
  }

  return available;
}

/**
 * Calculate ship stats from installed tech tiles
 * @param blueprint - Player's blueprint with installed tech tiles
 * @param factionBonuses - Faction-specific stat bonuses
 * @param age - Current age for baseline stats
 * @returns Calculated stats
 */
export function calculateShipStats(blueprint: Blueprint, factionBonuses: FactionBonuses = {}, age = 1): ShipStats {
  const baseline = AGE_BASELINES[age];

  const stats: ShipStats = {
    speed: baseline.speed + (factionBonuses.speed || 0),
    range: baseline.range + (factionBonuses.range || 0),
    ceiling: baseline.ceiling + (factionBonuses.ceiling || 0),
    reliability: baseline.reliability + (factionBonuses.reliability || 0),
    luxury: factionBonuses.luxury || 0,
    income: 0,
    weight: 0,
    hullCost: 2 // Base hull cost
  };

  // Sum stats from all installed tech tiles
  const allSlots: (keyof Pick<Blueprint, 'frameSlots' | 'fabricSlots' | 'driveSlots' | 'componentSlots'>)[] =
    ['frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots'];

  for (const slotKey of allSlots) {
    const slots = blueprint[slotKey] || [];
    for (const tileId of slots) {
      if (!tileId) continue;

      const tile = TECH_TILES[tileId];
      if (!tile) continue;

      // Add tech tile stats
      for (const [stat, value] of Object.entries(tile.stats || {})) {
        const statKey = stat as keyof ShipStats;
        if (typeof stats[statKey] === 'number' && typeof value === 'number') {
          (stats[statKey] as number) += value;
        }
      }

      // Add weight (negative values reduce lift budget)
      stats.weight += Math.abs(tile.weight || 0);

      // Add hull cost (for frame/fabric)
      if (tile.hullCost) {
        stats.hullCost += tile.hullCost;
      }
    }
  }

  return stats;
}

/**
 * Calculate lift from gas cubes
 * @param gasSockets - Gas cubes placed on frame
 * @returns Total lift
 */
export function calculateLift(gasSockets: string[] | undefined): number {
  let lift = 0;
  for (const cube of gasSockets || []) {
    if (cube === 'hydrogen' || cube === 'helium') {
      lift += 5;
    }
  }
  return lift;
}

/**
 * Check if ship can launch (physics check)
 * @param blueprint - Player's blueprint
 * @param factionBonuses - Faction bonuses
 * @param age - Current age
 * @returns { canLaunch, lift, weight, message }
 */
export function canLaunch(blueprint: Blueprint, factionBonuses: FactionBonuses = {}, age = 1): LaunchCheck {
  const stats = calculateShipStats(blueprint, factionBonuses, age);
  const lift = calculateLift(blueprint.gasSockets);

  // Check required slots are filled
  const requiredSlots = AGE_BASELINES[age];
  const frameCount = (blueprint.frameSlots || []).filter(s => s).length;
  const fabricCount = (blueprint.fabricSlots || []).filter(s => s).length;

  if (frameCount < requiredSlots.frameSlots) {
    return {
      canLaunch: false,
      lift,
      weight: stats.weight,
      message: `Need ${requiredSlots.frameSlots} frame tech tile(s), have ${frameCount}`
    };
  }

  if (fabricCount < requiredSlots.fabricSlots) {
    return {
      canLaunch: false,
      lift,
      weight: stats.weight,
      message: `Need ${requiredSlots.fabricSlots} fabric tech tile(s), have ${fabricCount}`
    };
  }

  // Physics check: Lift >= Weight
  if (lift < stats.weight) {
    return {
      canLaunch: false,
      lift,
      weight: stats.weight,
      message: `Insufficient lift (${lift}) for weight (${stats.weight})`
    };
  }

  return {
    canLaunch: true,
    lift,
    weight: stats.weight,
    message: 'Ready to launch'
  };
}

// CommonJS compatibility
module.exports = {
  TECH_TILES,
  TECH_CARDS,
  AGE_BASELINES,
  getAvailableTechTiles,
  calculateShipStats,
  calculateLift,
  canLaunch,
  // Legacy aliases for backwards compatibility during migration
  UPGRADES: TECH_TILES,
  TECHNOLOGIES: TECH_CARDS,
  getAvailableUpgrades: getAvailableTechTiles
};
