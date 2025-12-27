/**
 * Upgrade Tiles Data
 *
 * Each upgrade has:
 * - id: unique identifier
 * - name: display name
 * - type: drive | frame | fabric | component
 * - slotType: which slot type it goes in (frameSlots, fabricSlots, driveSlots, componentSlots)
 * - requiredTech: technology ID that must be owned to install
 * - weight: how much Lift is consumed (negative number)
 * - hullCost: additional cost when building ships (for frame/fabric)
 * - stats: bonuses to Speed, Range, Ceiling, Reliability, Luxury, Income
 * - special: any special abilities
 * - age: minimum age when available (1, 2, or 3)
 */

const UPGRADES = {
  // === PROPULSION/DRIVE UPGRADES ===
  basic_engine: {
    id: 'basic_engine',
    name: 'Basic Engine',
    type: 'drive',
    slotType: 'driveSlots',
    requiredTech: 'daimler_engine',
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
    requiredTech: 'improved_propeller',
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
    requiredTech: 'dual_engine_mount',
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
    requiredTech: 'maybach_engine',
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
    requiredTech: 'diesel_powerplant',
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
    requiredTech: 'swiveling_propeller',
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
    requiredTech: 'contra_rotating',
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
    requiredTech: 'streamlined_nacelle',
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
    requiredTech: 'supercharged_engine',
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
    requiredTech: 'diesel_electric',
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
    requiredTech: 'variable_pitch',
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
    requiredTech: 'wooden_framework',
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
    requiredTech: 'wire_bracing',
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
    requiredTech: 'duralumin_girders',
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
    requiredTech: 'steel_framework',
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
    requiredTech: 'internal_keel',
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
    requiredTech: 'geodetic_structure',
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
    requiredTech: 'modular_construction',
    weight: -1,
    hullCost: 2,
    stats: {},
    special: 'extra_swaps',
    age: 3
  },
  flexible_frame: {
    id: 'flexible_frame',
    name: 'Flexible Frame',
    type: 'frame',
    slotType: 'frameSlots',
    requiredTech: 'articulated_keel',
    weight: -1,
    hullCost: 1,
    stats: { reliability: 1 },
    special: 'weather_immunity',
    age: 3
  },

  // === FABRIC UPGRADES ===
  cotton_envelope: {
    id: 'cotton_envelope',
    name: 'Cotton Envelope',
    type: 'fabric',
    slotType: 'fabricSlots',
    requiredTech: 'rubberized_cotton',
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
    requiredTech: 'doped_canvas',
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
    requiredTech: 'goldbeater_skin',
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
    requiredTech: 'fireproof_coating',
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
    requiredTech: 'aluminum_doping',
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
    requiredTech: 'gelatinized_latex',
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
    requiredTech: 'composite_covering',
    weight: 0,
    hullCost: 2,
    stats: { reliability: 2 },
    special: 'multi_layer',
    age: 3
  },

  // === COMPONENT/PAYLOAD UPGRADES ===
  passenger_gondola: {
    id: 'passenger_gondola',
    name: 'Passenger Gondola',
    type: 'component',
    slotType: 'componentSlots',
    requiredTech: 'passenger_gondola',
    weight: -2,
    stats: { luxury: 1, income: 1 },
    special: null,
    age: 1
  },
  observation_deck: {
    id: 'observation_deck',
    name: 'Observation Deck',
    type: 'component',
    slotType: 'componentSlots',
    requiredTech: 'observation_deck',
    weight: -1,
    stats: { luxury: 2 },
    special: null,
    age: 1
  },
  cargo_hold: {
    id: 'cargo_hold',
    name: 'Cargo Hold',
    type: 'component',
    slotType: 'componentSlots',
    requiredTech: 'cargo_systems',
    weight: -2,
    stats: { income: 2 },
    special: null,
    age: 1
  },
  dining_saloon: {
    id: 'dining_saloon',
    name: 'Dining Saloon',
    type: 'component',
    slotType: 'componentSlots',
    requiredTech: 'dining_saloon',
    weight: -3,
    stats: { luxury: 3 },
    special: null,
    age: 2
  },
  radio_room: {
    id: 'radio_room',
    name: 'Radio Room',
    type: 'component',
    slotType: 'componentSlots',
    requiredTech: 'radio_equipment',
    weight: -1,
    stats: { reliability: 1 },
    special: 'communication',
    age: 2
  },
  sleeping_quarters: {
    id: 'sleeping_quarters',
    name: 'Sleeping Quarters',
    type: 'component',
    slotType: 'componentSlots',
    requiredTech: 'sleeping_quarters',
    weight: -2,
    stats: { luxury: 2, range: 1 },
    special: null,
    age: 2
  },
  luxury_lounge: {
    id: 'luxury_lounge',
    name: 'Luxury Lounge',
    type: 'component',
    slotType: 'componentSlots',
    requiredTech: 'luxury_fittings',
    weight: -3,
    stats: { luxury: 4, income: 2 },
    special: null,
    age: 3
  },
  mail_compartment: {
    id: 'mail_compartment',
    name: 'Mail Compartment',
    type: 'component',
    slotType: 'componentSlots',
    requiredTech: 'mail_systems',
    weight: -1,
    stats: { income: 3 },
    special: 'airmail',
    age: 2
  },
  navigation_suite: {
    id: 'navigation_suite',
    name: 'Navigation Suite',
    type: 'component',
    slotType: 'componentSlots',
    requiredTech: 'advanced_navigation',
    weight: -1,
    stats: { reliability: 2, range: 1 },
    special: null,
    age: 3
  },
  pressurized_cabin: {
    id: 'pressurized_cabin',
    name: 'Pressurized Cabin',
    type: 'component',
    slotType: 'componentSlots',
    requiredTech: 'pressurization',
    weight: -2,
    stats: { ceiling: 2, luxury: 1 },
    special: null,
    age: 3
  }
};

/**
 * Technology Definitions
 * Maps technology IDs to their upgrade unlock and metadata
 */
const TECHNOLOGIES = {
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
  // gelatinized_latex - defined above as USA starting tech
  composite_covering: { id: 'composite_covering', name: 'Composite Covering', type: 'fabric', cost: 5, age: 3 },

  // Component techs
  passenger_gondola: { id: 'passenger_gondola', name: 'Passenger Gondola', type: 'component', cost: 3, age: 1 },
  observation_deck: { id: 'observation_deck', name: 'Observation Deck', type: 'component', cost: 4, age: 1 },
  cargo_systems: { id: 'cargo_systems', name: 'Cargo Systems', type: 'component', cost: 3, age: 1 },
  radio_equipment: { id: 'radio_equipment', name: 'Radio Equipment', type: 'component', cost: 3, age: 2 },
  sleeping_quarters: { id: 'sleeping_quarters', name: 'Sleeping Quarters', type: 'component', cost: 4, age: 2 },
  luxury_fittings: { id: 'luxury_fittings', name: 'Luxury Fittings', type: 'component', cost: 6, age: 3 },
  mail_systems: { id: 'mail_systems', name: 'Mail Systems', type: 'component', cost: 3, age: 2 },
  advanced_navigation: { id: 'advanced_navigation', name: 'Advanced Navigation', type: 'component', cost: 5, age: 3 },
  pressurization: { id: 'pressurization', name: 'Pressurization', type: 'component', cost: 5, age: 3 }
};

/**
 * Age-specific baseline stats
 */
const AGE_BASELINES = {
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

/**
 * Get available upgrades for a player based on owned technologies
 * @param {Array} playerTechnologies - List of technology IDs the player owns
 * @param {number} currentAge - Current game age (1, 2, or 3)
 * @returns {Object} Upgrades grouped by slot type
 */
function getAvailableUpgrades(playerTechnologies, currentAge) {
  const available = {
    driveSlots: [],
    frameSlots: [],
    fabricSlots: [],
    componentSlots: []
  };

  for (const [id, upgrade] of Object.entries(UPGRADES)) {
    // Check if player owns required technology
    if (!playerTechnologies.includes(upgrade.requiredTech)) continue;

    // Check if upgrade is available in current age
    if (upgrade.age > currentAge) continue;

    available[upgrade.slotType].push(upgrade);
  }

  return available;
}

/**
 * Calculate ship stats from installed upgrades
 * @param {Object} blueprint - Player's blueprint with installed upgrades
 * @param {Object} factionBonuses - Faction-specific stat bonuses
 * @param {number} age - Current age for baseline stats
 * @returns {Object} Calculated stats
 */
function calculateShipStats(blueprint, factionBonuses = {}, age = 1) {
  const baseline = AGE_BASELINES[age];

  const stats = {
    speed: baseline.speed + (factionBonuses.speed || 0),
    range: baseline.range + (factionBonuses.range || 0),
    ceiling: baseline.ceiling + (factionBonuses.ceiling || 0),
    reliability: baseline.reliability + (factionBonuses.reliability || 0),
    luxury: factionBonuses.luxury || 0,
    income: 0,
    weight: 0,
    hullCost: 2 // Base hull cost
  };

  // Sum stats from all installed upgrades
  const allSlots = ['frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots'];

  for (const slotKey of allSlots) {
    const slots = blueprint[slotKey] || [];
    for (const upgradeId of slots) {
      if (!upgradeId) continue;

      const upgrade = UPGRADES[upgradeId];
      if (!upgrade) continue;

      // Add upgrade stats
      for (const [stat, value] of Object.entries(upgrade.stats || {})) {
        stats[stat] = (stats[stat] || 0) + value;
      }

      // Add weight (negative values reduce lift budget)
      stats.weight += Math.abs(upgrade.weight || 0);

      // Add hull cost (for frame/fabric)
      if (upgrade.hullCost) {
        stats.hullCost += upgrade.hullCost;
      }
    }
  }

  return stats;
}

/**
 * Calculate lift from gas cubes
 * @param {Object} gasSockets - Gas cubes placed on frame
 * @returns {number} Total lift
 */
function calculateLift(gasSockets) {
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
 * @param {Object} blueprint - Player's blueprint
 * @param {Object} factionBonuses - Faction bonuses
 * @param {number} age - Current age
 * @returns {Object} { canLaunch, lift, weight, message }
 */
function canLaunch(blueprint, factionBonuses = {}, age = 1) {
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
      message: `Need ${requiredSlots.frameSlots} frame tile(s), have ${frameCount}`
    };
  }

  if (fabricCount < requiredSlots.fabricSlots) {
    return {
      canLaunch: false,
      lift,
      weight: stats.weight,
      message: `Need ${requiredSlots.fabricSlots} fabric tile(s), have ${fabricCount}`
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

module.exports = {
  UPGRADES,
  TECHNOLOGIES,
  AGE_BASELINES,
  getAvailableUpgrades,
  calculateShipStats,
  calculateLift,
  canLaunch
};
