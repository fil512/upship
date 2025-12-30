const { pool } = require('../db');

// Faction-specific starting configurations
// Per rules Section 10: Each nation has unique starting technologies and blueprint configuration
const FACTION_CONFIG = {
  germany: {
    // Rules 10.1: Duralumin Framework, Goldbeater's Skin, Blaugas Fuel System
    startingTechnologies: ['duralumin_girders', 'goldbeater_skin', 'blaugas_storage'],
    // Pre-installed upgrades so Germany can launch on turn 1
    startingUpgrades: {
      frame: 'duralumin_frame',
      fabric: 'premium_envelope'
    },
    bonuses: { structure: 1 },
    // The Flaw: Cannot acquire helium_handling technology
    bannedTechnologies: ['helium_handling']
  },
  britain: {
    // Rules 10.2: Wire Bracing, Doped Canvas, Imperial Mooring System
    startingTechnologies: ['wire_bracing', 'doped_canvas', 'imperial_mooring'],
    // Pre-installed upgrades including printed Dining Saloon (Starting Advantage)
    startingUpgrades: {
      frame: 'tensioned_frame',
      fabric: 'doped_covering',
      component: 'dining_saloon'  // "Pre-Installed Luxury"
    },
    bonuses: { luxury: 1 },
    // The Flaw: Red Tape - only 1 swap instead of 2
    upgradeSwaps: 1
  },
  usa: {
    // Rules 10.3: Duralumin Framework, Gelatinized Latex, Trapeze Fighter, Helium Handling
    startingTechnologies: ['duralumin_girders', 'gelatinized_latex', 'trapeze_system', 'helium_handling'],
    // Pre-installed upgrades so USA can launch on turn 1
    startingUpgrades: {
      frame: 'duralumin_frame',
      fabric: 'synthetic_envelope'
    },
    bonuses: { safety: 1 },
    // Starting Advantage: Helium Monopoly - market doesn't advance when USA buys helium
    heliumMonopoly: true
  },
  italy: {
    // Rules 10.4: Internal Keel, Rubberized Cotton, Articulated Keel Design
    startingTechnologies: ['internal_keel', 'rubberized_cotton', 'articulated_keel'],
    // Pre-installed upgrades so Italy can launch on turn 1
    startingUpgrades: {
      frame: 'semi_rigid_keel',
      fabric: 'cotton_envelope'
    },
    bonuses: { speed: 1 },
    // Starting Advantage: Rapid Refit - 4 swaps instead of 2
    upgradeSwaps: 4,
    // The Flaw: Low Ceiling - fewer payload slots (handled in blueprint)
    lowCeiling: true
  }
};

// Create initial player state
function createPlayerState(faction) {
  const config = FACTION_CONFIG[faction] || {};

  // USA starts with helium due to their Helium Monopoly advantage
  const startingGas = faction === 'usa'
    ? { hydrogen: 0, helium: 2 }
    : { hydrogen: 2, helium: 0 };

  return {
    faction,
    cash: 15,
    income: 5,
    officerIncome: 0,  // Starts at 0 - requires Flight School investment
    engineerIncome: 1,
    officers: 1,
    engineers: 2,
    gasCubes: startingGas,
    agents: 2,  // Per rules Section 2.1: Start with 2 agents, 3rd earned at Officer Income +3
    research: 0, // Saved research tokens (carries over between rounds)
    researchLevel: 0, // Per rules Section 4.6: Research Level Track starts at 0
    influence: 0, // Influence tokens from revealed cards (resets each round)
    agentsRemaining: 2, // Per rules Section 2.1: Start with 2 agents
    hasPassed: false, // Whether player has passed in worker placement this round
    technologies: config.startingTechnologies || [],
    ships: [],
    routes: [],
    blueprint: createInitialBlueprint(faction),
    hand: [],
    deck: createStarterDeck(),
    discardPile: [],
    hazardDeck: createHazardDeck(),
    bonuses: config.bonuses || {},
    // Faction-specific attributes
    upgradeSwaps: config.upgradeSwaps || 2,  // Default 2, Britain=1, Italy=4
    heliumMonopoly: config.heliumMonopoly || false,
    bannedTechnologies: config.bannedTechnologies || []
  };
}

// Create initial blueprint for Age I with faction-specific pre-installed upgrades
// Per rules Section 10: Each faction has unique starting Blueprint configuration
// Per rules Section 3.2: All Frame and Fabric slots must be filled to launch
// Per rules Section 11.2: Players start with 2 H₂ cubes - "enough for an immediate launch"
function createInitialBlueprint(faction) {
  const config = FACTION_CONFIG[faction] || {};
  const startingUpgrades = config.startingUpgrades || {};

  // Blueprint Configuration by Age (Section 3.2):
  // Age I: 1 Frame, 1 Fabric, 1 Drive, 1 Payload slot
  // Age II: 1 Frame, 1 Fabric, 2 Drive, 2 Payload slots
  // Age III: 2 Frame, 2 Fabric, 2 Drive, 3 Payload slots

  const blueprint = {
    age: 1,
    frameSlots: [null],      // Age I: 1 frame slot
    fabricSlots: [null],     // Age I: 1 fabric slot
    driveSlots: [null],      // Age I: 1 drive slot
    componentSlots: [null]   // Age I: 1 payload slot (Italy: -1 in Ages II & III)
    // Note: Gas sockets removed - gas is spent directly from reserve when launching
  };

  // Pre-install starting upgrades so faction can launch on turn 1
  if (startingUpgrades.frame) {
    blueprint.frameSlots[0] = startingUpgrades.frame;
  }
  if (startingUpgrades.fabric) {
    blueprint.fabricSlots[0] = startingUpgrades.fabric;
  }
  if (startingUpgrades.drive) {
    blueprint.driveSlots[0] = startingUpgrades.drive;
  }
  if (startingUpgrades.component) {
    blueprint.componentSlots[0] = startingUpgrades.component;
  }

  // Italy's "Low Ceiling" flaw affects Ages II & III, not Age I
  // Age I: all factions have 1 payload slot
  // Italy will get -1 in blueprint transitions (Age II: 1 instead of 2, Age III: 2 instead of 3)

  return blueprint;
}

// Create starter deck of 10 cards (Section 11.3)
// Distribution: 3 Wrench, 3 Coin, 3 Propeller, 1 Any
function createStarterDeck() {
  return [
    // 1 Any card
    { id: 'starter_1', name: 'Apprentice', symbol: 'any', reveal: { influence: 1 }, effect: 'None' },
    // 3 Wrench cards
    { id: 'starter_2', name: 'Mechanic', symbol: 'wrench', reveal: { cash: 1 }, effect: '+1 swap' },
    { id: 'starter_3', name: 'Draftsman', symbol: 'wrench', reveal: { influence: 1 }, effect: 'Draw 1 card' },
    { id: 'starter_4', name: 'Rigger', symbol: 'wrench', reveal: { research: 1 }, effect: '-£2 ship build cost' },
    // 3 Coin cards
    { id: 'starter_5', name: 'Purser', symbol: 'coin', reveal: { influence: 2 }, effect: 'Gain £2' },
    { id: 'starter_6', name: 'Clerk', symbol: 'coin', reveal: { cash: 1 }, effect: 'Gain £1' },
    { id: 'starter_7', name: 'Investor', symbol: 'coin', reveal: { influence: 3 }, effect: 'None' },
    // 3 Propeller cards
    { id: 'starter_8', name: 'Researcher', symbol: 'propeller', reveal: { research: 1 }, effect: '-£1 per Research' },
    { id: 'starter_9', name: 'Helmsman', symbol: 'propeller', reveal: { officers: 1 }, effect: '+1 ship stat' },
    { id: 'starter_10', name: 'Navigator', symbol: 'propeller', reveal: { influence: 1 }, effect: 'Look at top Hazard' }
  ];
}

/**
 * Create personal hazard deck of 27 cards per Appendix E
 *
 * Composition:
 * - 4 Clear Weather (auto-pass)
 * - 8 Minor Hazards (difficulty 2-3, challenge type varies)
 * - 8 Major Hazards (difficulty 4-5, challenge type varies, includes special effects)
 * - 6 Fire Hazards (hydrogen only): Engine Fire x2, Gas Cell Rupture x2, Static Discharge x1, Catastrophic Explosion x1
 * - 1 Mechanical Hazard: Critical Structural Stress
 *
 * Each card includes a `flak` value (0-5) for Age II anti-aircraft checks.
 * Flak distribution per Appendix E:
 * - 0 Flak: 7 cards (safe passage)
 * - 1 Flak: 4 cards (Armor 1+ survives)
 * - 2 Flak: 6 cards (Armor 2+ survives)
 * - 3 Flak: 5 cards (Armor 3+ survives)
 * - 4 Flak: 3 cards (Armor 4 survives) - includes Critical Structural Stress
 * - 5 Flak: 2 cards (always destroys) - currently just 1 (Catastrophic Explosion)
 */
function createHazardDeck() {
  const hazards = [];

  // 4 Clear Weather cards (auto-pass) - all 0 Flak
  const clearWeatherNames = ['Clear Skies', 'Favorable Winds', 'Calm Conditions', 'Perfect Visibility'];
  for (let i = 0; i < 4; i++) {
    hazards.push({
      id: `clear_weather_${i}`,
      type: 'clear_weather',
      category: 'clear',
      name: clearWeatherNames[i],
      autoPass: true,
      difficulty: 0,
      flak: 0
    });
  }

  // 8 Minor Hazards per Appendix E with specific names, stats, and flak values
  const minorHazards = [
    { name: 'Light Turbulence', difficulty: 2, challengeType: 'speed', hazardType: 'weather', flak: 0 },
    { name: 'Minor Engine Trouble', difficulty: 2, challengeType: 'reliability', hazardType: 'mechanical', flak: 1 },
    { name: 'Crosswind', difficulty: 3, challengeType: 'speed', hazardType: 'weather', flak: 0 },
    { name: 'Gas Leak', difficulty: 3, challengeType: 'reliability', hazardType: 'mechanical', flak: 1 },
    { name: 'Low Visibility', difficulty: 2, challengeType: 'ceiling', hazardType: 'weather', flak: 1 },
    { name: 'Fuel Concern', difficulty: 3, challengeType: 'range', hazardType: 'supply', flak: 0 },
    { name: 'Headwind', difficulty: 3, challengeType: 'speed', hazardType: 'weather', flak: 1 },
    { name: 'Structural Stress', difficulty: 2, challengeType: 'reliability', hazardType: 'mechanical', flak: 2 }
  ];

  minorHazards.forEach((h, i) => {
    hazards.push({
      id: `minor_${h.challengeType}_${i}`,
      type: `minor_${h.challengeType}`,
      category: 'minor',
      name: h.name,
      challengeType: h.challengeType,
      hazardType: h.hazardType,
      difficulty: h.difficulty,
      flak: h.flak
    });
  });

  // 8 Major Hazards per Appendix E with specific names, stats, flak, and special effects
  const majorHazards = [
    { name: 'Strong Headwind', difficulty: 4, challengeType: 'speed', hazardType: 'weather', flak: 2 },
    { name: 'Icing Conditions', difficulty: 4, challengeType: 'ceiling', hazardType: 'weather', flak: 2,
      special: 'On failure, also lose 1 gas cube. If no gas remains, ship Destroyed.',
      gasLossOnFailure: 1 },
    { name: 'Engine Failure', difficulty: 5, challengeType: 'reliability', hazardType: 'mechanical', flak: 3 },
    { name: 'Storm System', difficulty: 5, challengeType: 'speed', hazardType: 'weather', flak: 3 },
    { name: 'Structural Damage', difficulty: 4, challengeType: 'reliability', hazardType: 'mechanical', flak: 4 },
    { name: 'Navigation Error', difficulty: 4, challengeType: 'range', hazardType: 'supply', flak: 3 },
    { name: 'Squall Line', difficulty: 5, challengeType: 'reliability', hazardType: 'weather', flak: 3,
      special: 'Ships with 3+ Payload slots suffer +1 Difficulty.',
      payloadSlotModifier: { threshold: 3, difficultyIncrease: 1 } },
    { name: 'Severe Icing', difficulty: 5, challengeType: 'ceiling', hazardType: 'weather', flak: 2,
      special: 'On failure, lose 2 gas cubes. If gas remains < ship\'s minimum, ship Destroyed.',
      gasLossOnFailure: 2 }
  ];

  majorHazards.forEach((h, i) => {
    const card = {
      id: `major_${h.challengeType}_${i}`,
      type: `major_${h.challengeType}`,
      category: 'major',
      name: h.name,
      challengeType: h.challengeType,
      hazardType: h.hazardType,
      difficulty: h.difficulty,
      flak: h.flak
    };
    if (h.special) card.special = h.special;
    if (h.gasLossOnFailure !== undefined) card.gasLossOnFailure = h.gasLossOnFailure;
    if (h.payloadSlotModifier) card.payloadSlotModifier = h.payloadSlotModifier;
    hazards.push(card);
  });

  // 6 Fire Hazards (hydrogen only)

  // 2x Engine Fire - Spend 1 Engineer to save (Damaged), Fail = Crash - 2 Flak each
  for (let i = 0; i < 2; i++) {
    hazards.push({
      id: `engine_fire_${i}`,
      type: 'engine_fire',
      category: 'fire',
      name: 'Engine Fire',
      hydrogenOnly: true,
      engineerCost: 1,
      difficulty: 0,
      flak: 2
    });
  }

  // 2x Gas Cell Rupture - Spend 2 Engineers to save (Damaged), Fail = Crash - 3 Flak each
  for (let i = 0; i < 2; i++) {
    hazards.push({
      id: `gas_cell_rupture_${i}`,
      type: 'gas_cell_rupture',
      category: 'fire',
      name: 'Gas Cell Rupture',
      hydrogenOnly: true,
      engineerCost: 2,
      difficulty: 0,
      flak: 3
    });
  }

  // 1x Static Discharge - Difficulty 4 Reliability check, Fail = Crash - 4 Flak
  hazards.push({
    id: 'static_discharge_0',
    type: 'static_discharge',
    category: 'fire',
    name: 'Static Discharge',
    hydrogenOnly: true,
    challengeType: 'reliability',
    difficulty: 4,
    flak: 4
  });

  // 1x Catastrophic Explosion - No save, Crash. Age III Luxury = Hindenburg - 5 Flak
  hazards.push({
    id: 'catastrophic_explosion_0',
    type: 'catastrophic_explosion',
    category: 'fire',
    name: 'Catastrophic Explosion',
    hydrogenOnly: true,
    noSave: true,
    difficulty: 99,
    flak: 5
  });

  // 1 Mechanical Hazard: Critical Structural Stress - 4 Flak
  hazards.push({
    id: 'critical_structural_stress_0',
    type: 'critical_structural_stress',
    category: 'mechanical',
    name: 'Critical Structural Stress',
    engineerCost: 2,
    difficulty: 0,
    flak: 4
  });

  return shuffleArray(hazards);
}

// Shuffle array helper (Math.random() is appropriate for game card shuffling)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // eslint-disable-line sonarjs/pseudo-random
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Technology Bag organized by Age - per Appendix C table data
 * 54 total tiles: Propulsion 11, Frame 10, Fabric 8, Gas Systems 11, Payload 14
 *
 * Note: The Appendix C summary says "Age I: 11 tiles (2 Propulsion...)" but the
 * actual tables list Dual Engine Mount as Age I. We follow the table data.
 * Actual distribution per tables:
 * - Age I: 12 tiles (3 Propulsion, 2 Frame, 2 Fabric, 2 Gas, 3 Payload)
 * - Age II: 22 tiles (4 Propulsion, 5 Frame, 4 Fabric, 4 Gas, 5 Payload)
 * - Age III: 20 tiles (4 Propulsion, 3 Frame, 2 Fabric, 5 Gas, 6 Payload)
 *
 * UPDATE: Corrected to match summary totals (54 tiles) by placing tiles in
 * the age indicated in the table column, which results in exactly 54.
 */
const TECHNOLOGY_BAG = {
  1: [ // Age I Technologies (11 tiles)
    // Propulsion (2 tiles - Dual Engine Mount is Age I per table but moved to summary)
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
    { id: 'aerodynamic_hull', name: 'Aerodynamic Hull Design', type: 'structure', cost: 3, vp: 1, income: 1 },
    // Fabric (4 tiles)
    { id: 'goldbeater_skin', name: "Goldbeater's Skin", type: 'fabric', cost: 4, vp: 2, income: 2 },
    { id: 'fireproof_coating', name: 'Fireproof Coating', type: 'fabric', cost: 3, vp: 2, income: 1 },
    { id: 'aluminum_doping', name: 'Aluminum Doping', type: 'fabric', cost: 3, vp: 1, income: 1 },
    { id: 'grounding_systems', name: 'Grounding Systems', type: 'fabric', cost: 3, vp: 1, income: 1 },
    // Gas Systems (4 tiles)
    { id: 'multiple_gas_cells', name: 'Multiple Gas Cells', type: 'gas', cost: 3, vp: 0, income: 1 },
    { id: 'helium_handling', name: 'Helium Handling', type: 'gas', cost: 4, vp: 0, income: 2 },
    { id: 'blaugas_system', name: 'Blaugas Fuel System', type: 'gas', cost: 3, vp: 2, income: 2 },
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
    { id: 'dynamic_lift', name: 'Dynamic Lift Surfaces', type: 'structure', cost: 5, vp: 2, income: 2 },
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

// Progress Track thresholds by player count (Section 1.3)
// 2 Players: Age I ends at 8, Age II at 16, Game at 20
// 3 Players: Age I ends at 10, Age II at 20, Game at 25
// 4 Players: Age I ends at 12, Age II at 24, Game at 30
const PROGRESS_THRESHOLDS = {
  2: { age2: 8, age3: 16, end: 20 },
  3: { age2: 10, age3: 20, end: 25 },
  4: { age2: 12, age3: 24, end: 30 }
};

// Create technology bag and R&D board together to avoid duplicates
// Returns { rdBoard: [...], techBag: [...] }
// excludeIds: array of tech IDs to exclude (e.g., starting technologies already owned by players)
function createTechBagAndRDBoard(age = 1, excludeIds = []) {
  const bag = [];
  // Add all tiles up to current age, excluding any already owned
  for (let a = 1; a <= age; a++) {
    const techs = TECHNOLOGY_BAG[a]
      .filter(t => !excludeIds.includes(t.id))
      .map(t => ({ ...t, age: a }));
    bag.push(...techs);
  }
  const shuffledBag = shuffleArray(bag);

  // Draw 4 tiles for the R&D board from the shuffled bag
  const rdBoard = shuffledBag.splice(0, 4);

  return { rdBoard, techBag: shuffledBag };
}

// Create initial market cards using the 30-card market deck from Appendix H
function createMarketCards() {
  const { createMarketRow } = require('../data/marketCards');
  const { marketRow } = createMarketRow();
  return marketRow;
}

/**
 * Create Age I map routes per Appendix F
 * The Pioneer Era features 12 regional routes across Western Europe.
 * Each route has VP value matching Appendix F specifications.
 */
function createAgeIMap() {
  return {
    name: 'Western Europe',
    age: 1,
    routes: [
      // Per Appendix F - Age I Routes
      { id: 'route_rhine_valley', name: 'Rhine Valley', from: 'Frankfurt', to: 'Cologne',
        range: 1, speed: 0, ceiling: 0, income: 2, vp: 1, claimed: null },
      { id: 'route_bodensee', name: 'Bodensee Circuit', from: 'Friedrichshafen', to: 'Konstanz',
        range: 1, speed: 0, ceiling: 0, income: 2, vp: 1, claimed: null },
      { id: 'route_channel', name: 'Channel Crossing', from: 'Calais', to: 'Dover',
        range: 1, speed: 1, ceiling: 0, income: 3, vp: 2, claimed: null },
      { id: 'route_paris_express', name: 'Paris Express', from: 'Paris', to: 'Brussels',
        range: 1, speed: 1, ceiling: 0, income: 3, vp: 2, claimed: null },
      { id: 'route_north_sea', name: 'North Sea Run', from: 'Hamburg', to: 'Amsterdam',
        range: 2, speed: 1, ceiling: 0, income: 4, vp: 2, claimed: null },
      { id: 'route_baltic', name: 'Baltic Passage', from: 'Hamburg', to: 'Copenhagen',
        range: 2, speed: 1, ceiling: 0, income: 4, vp: 2, claimed: null },
      { id: 'route_alpine', name: 'Alpine Transit', from: 'Zurich', to: 'Milan',
        range: 2, speed: 0, ceiling: 1, income: 4, vp: 2, claimed: null },
      { id: 'route_mediterranean', name: 'Mediterranean Link', from: 'Marseille', to: 'Barcelona',
        range: 2, speed: 1, ceiling: 0, income: 4, vp: 2, claimed: null },
      { id: 'route_london_paris', name: 'London-Paris', from: 'London', to: 'Paris',
        range: 2, speed: 2, ceiling: 0, income: 5, vp: 3, claimed: null },
      { id: 'route_berlin_vienna', name: 'Berlin-Vienna', from: 'Berlin', to: 'Vienna',
        range: 3, speed: 1, ceiling: 0, income: 5, vp: 3, claimed: null },
      { id: 'route_rome', name: 'Rome Approach', from: 'Milan', to: 'Rome',
        range: 2, speed: 1, ceiling: 1, income: 5, vp: 3, claimed: null },
      { id: 'route_imperial', name: 'Imperial Circuit', from: 'London', to: 'Berlin',
        range: 3, speed: 2, ceiling: 0, income: 6, vp: 3, claimed: null }
    ],
    cities: {
      'Frankfurt': { type: 'major', homeBase: 'germany' },
      'Cologne': { type: 'minor', homeBase: null },
      'Friedrichshafen': { type: 'minor', homeBase: 'germany' },
      'Konstanz': { type: 'minor', homeBase: null },
      'Calais': { type: 'minor', homeBase: null },
      'Dover': { type: 'minor', homeBase: 'britain' },
      'Paris': { type: 'major', homeBase: null },
      'Brussels': { type: 'minor', homeBase: null },
      'Hamburg': { type: 'major', homeBase: null },
      'Amsterdam': { type: 'minor', homeBase: null },
      'Copenhagen': { type: 'minor', homeBase: null },
      'Zurich': { type: 'minor', homeBase: null },
      'Milan': { type: 'minor', homeBase: null },
      'Marseille': { type: 'minor', homeBase: null },
      'Barcelona': { type: 'minor', homeBase: null },
      'London': { type: 'major', homeBase: 'britain' },
      'Berlin': { type: 'major', homeBase: null },
      'Vienna': { type: 'minor', homeBase: null },
      'Rome': { type: 'major', homeBase: 'italy' }
    }
  };
}

/**
 * Create Age III map routes per Appendix F
 * The Atlantic Era features 16 hemispheric routes including luxury ocean crossings.
 * Each route has VP value and luxury requirement matching Appendix F specifications.
 */
function createAgeIIIMap() {
  return {
    name: 'The Atlantic',
    age: 3,
    routes: [
      // Standard Routes (8)
      { id: 'route_south_atlantic', name: 'South Atlantic', from: 'Rio de Janeiro', to: 'Recife',
        range: 2, speed: 1, ceiling: 0, income: 5, vp: 2, luxury: 0, claimed: null },
      { id: 'route_caribbean', name: 'Caribbean Connection', from: 'Miami', to: 'Havana',
        range: 2, speed: 1, ceiling: 0, income: 5, vp: 2, luxury: 0, claimed: null },
      { id: 'route_pacific_coast', name: 'Pacific Coast', from: 'Los Angeles', to: 'San Francisco',
        range: 2, speed: 1, ceiling: 1, income: 5, vp: 2, luxury: 0, claimed: null },
      { id: 'route_european_trunk', name: 'European Trunk', from: 'London', to: 'Berlin',
        range: 3, speed: 2, ceiling: 1, income: 6, vp: 3, luxury: 0, claimed: null },
      { id: 'route_eastern_seaboard', name: 'Eastern Seaboard', from: 'New York', to: 'Miami',
        range: 3, speed: 2, ceiling: 0, income: 6, vp: 3, luxury: 0, claimed: null },
      { id: 'route_mediterranean_express', name: 'Mediterranean Express', from: 'Rome', to: 'Cairo',
        range: 4, speed: 2, ceiling: 1, income: 7, vp: 3, luxury: 0, claimed: null },
      { id: 'route_trans_amazon', name: 'Trans-Amazon', from: 'Rio de Janeiro', to: 'Manaus',
        range: 4, speed: 1, ceiling: 0, income: 7, vp: 3, luxury: 0, claimed: null },
      { id: 'route_north_atlantic_express', name: 'North Atlantic Express', from: 'New York', to: 'London',
        range: 4, speed: 2, ceiling: 2, income: 8, vp: 4, luxury: 0, claimed: null },
      // Luxury Routes (8) - marked with luxury requirement
      { id: 'route_around_cape_horn', name: 'Around Cape Horn', from: 'Buenos Aires', to: 'Valparaiso',
        range: 3, speed: 2, ceiling: 3, income: 7, vp: 3, luxury: 0, claimed: null },
      { id: 'route_arctic_explorer', name: 'Arctic Explorer', from: 'Oslo', to: 'Svalbard',
        range: 3, speed: 1, ceiling: 3, income: 7, vp: 3, luxury: 0, claimed: null },
      { id: 'route_empire_state_express', name: 'Empire State Express', from: 'New York', to: 'Chicago',
        range: 3, speed: 3, ceiling: 1, income: 8, vp: 4, luxury: 1, claimed: null },
      { id: 'route_imperial_airship', name: 'Imperial Airship Route', from: 'London', to: 'Cairo',
        range: 4, speed: 2, ceiling: 2, income: 9, vp: 4, luxury: 1, claimed: null },
      { id: 'route_california_clipper', name: 'California Clipper', from: 'Los Angeles', to: 'Honolulu',
        range: 5, speed: 2, ceiling: 1, income: 10, vp: 5, luxury: 1, claimed: null },
      { id: 'route_graf_zeppelin', name: 'Graf Zeppelin Route', from: 'Rio de Janeiro', to: 'Friedrichshafen',
        range: 5, speed: 2, ceiling: 2, income: 10, vp: 5, luxury: 1, claimed: null },
      { id: 'route_transatlantic_luxury', name: 'Transatlantic Luxury', from: 'London', to: 'New York',
        range: 4, speed: 3, ceiling: 2, income: 11, vp: 5, luxury: 2, claimed: null },
      { id: 'route_hindenburg', name: 'Hindenburg Route', from: 'Frankfurt', to: 'Lakehurst',
        range: 5, speed: 3, ceiling: 2, income: 12, vp: 6, luxury: 2, claimed: null }
    ],
    cities: {
      'Rio de Janeiro': { type: 'major', homeBase: null },
      'Recife': { type: 'minor', homeBase: null },
      'Miami': { type: 'minor', homeBase: 'usa' },
      'Havana': { type: 'minor', homeBase: null },
      'Los Angeles': { type: 'major', homeBase: null },
      'San Francisco': { type: 'major', homeBase: null },
      'London': { type: 'major', homeBase: 'britain' },
      'Berlin': { type: 'major', homeBase: null },
      'New York': { type: 'major', homeBase: 'usa' },
      'Rome': { type: 'major', homeBase: 'italy' },
      'Cairo': { type: 'major', homeBase: null },
      'Manaus': { type: 'minor', homeBase: null },
      'Buenos Aires': { type: 'major', homeBase: null },
      'Valparaiso': { type: 'minor', homeBase: null },
      'Oslo': { type: 'minor', homeBase: null },
      'Svalbard': { type: 'minor', homeBase: null },
      'Chicago': { type: 'major', homeBase: null },
      'Honolulu': { type: 'minor', homeBase: null },
      'Friedrichshafen': { type: 'minor', homeBase: 'germany' },
      'Frankfurt': { type: 'major', homeBase: 'germany' },
      'Lakehurst': { type: 'minor', homeBase: 'usa' }
    }
  };
}

// Initialize game state when game starts
async function initializeGameState(gameId, players) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Determine player order randomly
    const playerOrder = shuffleArray(players.map(p => p.user_id));

    // Create player states
    const playerStates = {};
    for (const player of players) {
      playerStates[player.user_id] = createPlayerState(player.faction);
      // Draw initial hand of 5 cards
      const state = playerStates[player.user_id];
      state.deck = shuffleArray(state.deck);
      state.hand = state.deck.splice(0, 5);
    }

    // Determine player count for progress thresholds
    const playerCount = Math.min(4, Math.max(2, players.length));

    // Collect all starting technologies from all players to exclude from tech bag
    const allStartingTechs = new Set();
    for (const pid of Object.keys(playerStates)) {
      for (const tech of playerStates[pid].technologies || []) {
        allStartingTechs.add(tech);
      }
    }

    // Create tech bag and R&D board together to avoid duplicates
    // Exclude starting technologies so they don't appear on R&D board
    const { rdBoard, techBag } = createTechBagAndRDBoard(1, Array.from(allStartingTechs));

    // Calculate initial turn order by income (lowest first)
    // At game start, all players have income 5, so use original random order
    const initialPlacementOrder = [...playerOrder];

    // Create initial game state
    const gameState = {
      age: 1,
      turn: 1,
      round: 1,
      phase: 'worker_placement', // worker_placement, reveal, income_cleanup
      currentPlayerIndex: 0,
      playerOrder,
      playerCount,
      players: playerStates,
      // Worker placement phase tracking
      workerPlacement: {
        passedPlayers: [],        // Player IDs who have passed this round
        ministryVisitors: [],     // Players who visited Ministry last round (go first next round)
        placementOrder: initialPlacementOrder, // Turn order for placing agents
        currentPlacerIndex: 0     // Index into placementOrder for current placer
      },
      // Reveal phase tracking
      revealPhase: {
        revealedHands: {},        // playerId -> array of revealed cards
        resourcesCollected: {},   // playerId -> boolean
        techAcquisitionsComplete: {}, // playerId -> boolean
        marketPurchasesComplete: {}   // playerId -> boolean
      },
      // Ground Board for worker placement
      groundBoard: {
        placements: {}            // locationId -> { playerId, cardUsed }
      },
      rdBoard,
      techBag,
      marketCards: createMarketCards(),
      progressTrack: 0,
      progressThresholds: PROGRESS_THRESHOLDS[playerCount],
      gasMarket: { hydrogen: 1, helium: 2 }, // Prices per cube (Section 4.4: H₂ fixed at £1, He starts at £2)
      map: createAgeIMap(),
      log: [{
        timestamp: new Date().toISOString(),
        message: 'Game started',
        type: 'system'
      }]
    };

    // Insert into game_states table
    await client.query(
      `INSERT INTO game_states (game_id, current_player_id, phase, turn_number, age, state)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [gameId, playerOrder[0], 'worker_placement', 1, 1, JSON.stringify(gameState)]
    );

    await client.query('COMMIT');
    return gameState;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Get current game state
async function getGameState(gameId) {
  const result = await pool.query(
    `SELECT * FROM game_states WHERE game_id = $1`,
    [gameId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    gameId: row.game_id,
    version: row.version,
    currentPlayerId: row.current_player_id,
    phase: row.phase,
    turnNumber: row.turn_number,
    age: row.age,
    state: row.state,
    updatedAt: row.updated_at
  };
}

// Update game state
async function updateGameState(gameId, newState, action = null) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get current version
    const current = await client.query(
      'SELECT version FROM game_states WHERE game_id = $1 FOR UPDATE',
      [gameId]
    );

    if (current.rows.length === 0) {
      throw new Error('Game state not found');
    }

    const newVersion = current.rows[0].version + 1;

    // Update state
    await client.query(
      `UPDATE game_states
       SET state = $1, version = $2,
           current_player_id = $3, phase = $4,
           turn_number = $5, age = $6,
           updated_at = NOW()
       WHERE game_id = $7`,
      [
        JSON.stringify(newState),
        newVersion,
        newState.playerOrder[newState.currentPlayerIndex],
        newState.phase,
        newState.turn,
        newState.age,
        gameId
      ]
    );

    // Record action if provided
    if (action) {
      await client.query(
        `INSERT INTO game_actions (game_id, player_id, action_type, action_data, state_version)
         VALUES ($1, $2, $3, $4, $5)`,
        [gameId, action.playerId, action.type, JSON.stringify(action.data), newVersion]
      );
    }

    await client.query('COMMIT');
    return { ...newState, version: newVersion };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Get action history for a game
async function getGameActions(gameId, limit = 50) {
  const result = await pool.query(
    `SELECT ga.*, u.username
     FROM game_actions ga
     JOIN users u ON ga.player_id = u.id
     WHERE ga.game_id = $1
     ORDER BY ga.created_at DESC
     LIMIT $2`,
    [gameId, limit]
  );

  return result.rows;
}

module.exports = {
  initializeGameState,
  getGameState,
  updateGameState,
  getGameActions,
  FACTION_CONFIG,
  TECHNOLOGY_BAG,    // Exported for testing (GAP-043)
  createHazardDeck,  // Exported for testing (GAP-030)
  createAgeIMap,     // Exported for testing (GAP-040)
  createAgeIIIMap    // Exported for Age III routes (GAP-042)
};
