/**
 * Game State Service
 * Handles game state initialization, persistence, and retrieval
 */

import type { Faction, GameState, PlayerState, Card, HazardCard, Route } from '@upship/api';
import type { PoolClient } from 'pg';

const { pool } = require('../db');
const { TECH_CARD_BAG, PROGRESS_THRESHOLDS } = require('../config/constants');
const { TECH_TILES, calculateShipStats } = require('../data/upgrades');
const { generateId } = require('../utils/random');

// Blueprint structure
interface Blueprint {
  age: number;
  frameSlots: (string | null)[];
  fabricSlots: (string | null)[];
  driveSlots: (string | null)[];
  componentSlots: (string | null)[];
}

// Faction bonuses
interface FactionBonuses {
  structure?: number;
  luxury?: number;
  safety?: number;
  speed?: number;
  [key: string]: number | undefined;
}

// Starting tech tiles configuration
interface StartingTechTiles {
  frame?: string;
  fabric?: string;
  drive?: string;
  component?: string;
}

// Faction configuration
interface FactionConfig {
  startingTechCards: string[];
  startingTechTiles: StartingTechTiles;
  bonuses: FactionBonuses;
  bannedTechCards?: string[];
  heliumMonopoly?: boolean;
  lowCeiling?: boolean;
}

// Faction-specific starting configurations
// Per rules Section 10: Each nation has unique starting tech cards and blueprint configuration
const FACTION_CONFIG: Record<string, FactionConfig> = {
  germany: {
    // Rules 10.1: Duralumin Framework, Goldbeater's Skin, Blaugas Fuel System
    startingTechCards: ['duralumin_girders', 'goldbeater_skin', 'blaugas_storage'],
    // Pre-installed tech tiles so Germany can launch on turn 1
    startingTechTiles: {
      frame: 'duralumin_frame',
      fabric: 'premium_envelope'
    },
    bonuses: { structure: 1 },
    // The Flaw: Cannot acquire helium_handling tech card
    bannedTechCards: ['helium_handling']
  },
  britain: {
    // Rules 10.2: Wire Bracing, Doped Canvas, Imperial Mooring System
    startingTechCards: ['wire_bracing', 'doped_canvas', 'imperial_mooring'],
    // Pre-installed tech tiles including printed Dining Saloon (Starting Advantage)
    startingTechTiles: {
      frame: 'tensioned_frame',
      fabric: 'doped_covering',
      component: 'dining_saloon'  // "Pre-Installed Luxury"
    },
    bonuses: { luxury: 1 }
    // The Flaw: Red Tape - removed (swaps no longer limited)
  },
  usa: {
    // Rules 10.3: Duralumin Framework, Gelatinized Latex, Trapeze Fighter, Helium Handling
    startingTechCards: ['duralumin_girders', 'gelatinized_latex', 'trapeze_system', 'helium_handling'],
    // Pre-installed tech tiles so USA can launch on turn 1
    startingTechTiles: {
      frame: 'duralumin_frame',
      fabric: 'synthetic_envelope'
    },
    bonuses: { safety: 1 },
    // Starting Advantage: Helium Monopoly - market doesn't advance when USA buys helium
    heliumMonopoly: true
  },
  italy: {
    // Rules 10.4: Internal Keel, Rubberized Cotton, Articulated Keel Design
    startingTechCards: ['internal_keel', 'rubberized_cotton', 'articulated_keel'],
    // Pre-installed tech tiles so Italy can launch on turn 1
    startingTechTiles: {
      frame: 'semi_rigid_keel',
      fabric: 'cotton_envelope'
    },
    bonuses: { speed: 1 },
    // Starting Advantage: Rapid Refit - removed (swaps no longer limited)
    // The Flaw: Low Ceiling - fewer payload slots (handled in blueprint)
    lowCeiling: true
  }
};

// Tech tile definition
interface TechTile {
  weight?: number;
  lift?: number;
  [key: string]: unknown;
}

// Ship stats from calculateShipStats
interface ShipStats {
  speed: number;
  range: number;
  ceiling: number;
  reliability: number;
  luxury: number;
  [key: string]: number;
}

// Create initial player state
function createPlayerState(faction: Faction): PlayerState {
  const config = FACTION_CONFIG[faction] || {} as FactionConfig;

  // USA starts with helium due to their Helium Monopoly advantage
  const startingGas = faction === 'usa'
    ? { hydrogen: 0, helium: 2 }
    : { hydrogen: 2, helium: 0 };

  // Create blueprint first so we can build starting ship from it
  const blueprint = createInitialBlueprint(faction);

  // Calculate ship stats from starting blueprint (per rules Section 3.2)
  const shipStats: ShipStats = calculateShipStats(blueprint, config.bonuses || {}, 1);

  // Calculate weight from frame/fabric tech tiles
  let weight = 0;
  for (const tileId of [...(blueprint.frameSlots || []), ...(blueprint.fabricSlots || [])]) {
    if (tileId && (TECH_TILES[tileId] as TechTile)?.weight) {
      weight += (TECH_TILES[tileId] as TechTile).weight!;
    }
  }

  // Calculate lift from frame/fabric tech tiles
  let lift = 0;
  for (const tileId of [...(blueprint.frameSlots || []), ...(blueprint.fabricSlots || [])]) {
    if (tileId && (TECH_TILES[tileId] as TechTile)?.lift) {
      lift += (TECH_TILES[tileId] as TechTile).lift!;
    }
  }

  // Create starting ship (per rules Section 3.2: each player starts with 1 airship)
  const startingShip = {
    id: generateId('ship'),
    status: 'hangar' as const,
    routeId: undefined as string | undefined,
    lift,
    weight,
    speed: shipStats.speed,
    range: shipStats.range,
    ceiling: shipStats.ceiling,
    reliability: shipStats.reliability,
    luxury: shipStats.luxury
  };

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
    research: 0, // Research tokens from reveal phase (unspent is lost per Section 5.1)
    researchLevel: 0, // Per rules Section 4.6: Research Level Track starts at 0
    influence: 0, // Influence tokens from revealed cards (resets each round)
    agentsRemaining: 2, // Per rules Section 2.1: Start with 2 agents
    hasPassed: false, // Whether player has passed in worker placement this round
    techCards: config.startingTechCards || [],
    ships: [startingShip], // Per rules Section 3.2: Start with 1 airship in hangar
    routes: [],
    blueprint: blueprint as unknown as PlayerState['blueprint'],
    hand: [],
    deck: createStarterDeck(),
    discardPile: [],
    hazardDeck: createHazardDeck(),
    bonuses: config.bonuses || {},
    // Faction-specific attributes
    heliumMonopoly: config.heliumMonopoly || false,
    bannedTechCards: config.bannedTechCards || []
  } as PlayerState;
}

// Create initial blueprint for Age I with faction-specific pre-installed tech tiles
// Per rules Section 10: Each faction has unique starting Blueprint configuration
// Per rules Section 3.2: All Frame and Fabric slots must be filled to launch
// Per rules Section 11.2: Players start with 2 H₂ cubes - "enough for an immediate launch"
function createInitialBlueprint(faction: Faction): Blueprint {
  const config = FACTION_CONFIG[faction] || {} as FactionConfig;
  const startingTechTiles = config.startingTechTiles || {};

  // Blueprint Configuration by Age (Section 3.2):
  // Age I: 1 Frame, 1 Fabric, 1 Drive, 1 Payload slot
  // Age II: 1 Frame, 1 Fabric, 2 Drive, 2 Payload slots
  // Age III: 2 Frame, 2 Fabric, 2 Drive, 3 Payload slots

  const blueprint: Blueprint = {
    age: 1,
    frameSlots: [null],      // Age I: 1 frame slot
    fabricSlots: [null],     // Age I: 1 fabric slot
    driveSlots: [null],      // Age I: 1 drive slot
    componentSlots: [null]   // Age I: 1 payload slot (Italy: -1 in Ages II & III)
    // Note: Gas sockets removed - gas is spent directly from reserve when launching
  };

  // Pre-install starting tech tiles so faction can launch on turn 1
  if (startingTechTiles.frame) {
    blueprint.frameSlots[0] = startingTechTiles.frame;
  }
  if (startingTechTiles.fabric) {
    blueprint.fabricSlots[0] = startingTechTiles.fabric;
  }
  if (startingTechTiles.drive) {
    blueprint.driveSlots[0] = startingTechTiles.drive;
  }
  if (startingTechTiles.component) {
    blueprint.componentSlots[0] = startingTechTiles.component;
  }

  // Italy's "Low Ceiling" flaw affects Ages II & III, not Age I
  // Age I: all factions have 1 payload slot
  // Italy will get -1 in blueprint transitions (Age II: 1 instead of 2, Age III: 2 instead of 3)

  return blueprint;
}

// Starter card structure (separate from Card to allow flexibility in symbol values)
// Note: This interface documents the structure but isn't directly referenced
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface StarterCard {
  id: string;
  name: string;
  symbol: string;
  reveal: { influence?: number; cash?: number; research?: number; officers?: number };
  effect: string | null;
}

// Create starter deck of 10 cards (Section 11.3)
// Distribution: 3 Wrench, 3 Coin, 3 Propeller, 1 Any
function createStarterDeck(): Card[] {
  return [
    // 1 Any card
    { id: 'starter_1', name: 'Apprentice', symbol: 'any', reveal: { influence: 1 }, effect: null },
    // 3 Wrench cards
    { id: 'starter_2', name: 'Mechanic', symbol: 'wrench', reveal: { cash: 1 }, effect: null },
    { id: 'starter_3', name: 'Draftsman', symbol: 'wrench', reveal: { influence: 1 }, effect: 'Draw 1 card' },
    { id: 'starter_4', name: 'Rigger', symbol: 'wrench', reveal: { research: 1 }, effect: '-£2 ship build cost' },
    // 3 Coin cards
    { id: 'starter_5', name: 'Purser', symbol: 'coin', reveal: { influence: 2 }, effect: 'Gain £2' },
    { id: 'starter_6', name: 'Clerk', symbol: 'coin', reveal: { cash: 1 }, effect: 'Gain £1' },
    { id: 'starter_7', name: 'Investor', symbol: 'coin', reveal: { influence: 3 }, effect: null },
    // 3 Propeller cards
    { id: 'starter_8', name: 'Researcher', symbol: 'propeller', reveal: { research: 1 }, effect: '-£1 per Research' },
    { id: 'starter_9', name: 'Helmsman', symbol: 'propeller', reveal: { officers: 1 }, effect: '+1 ship stat' },
    { id: 'starter_10', name: 'Navigator', symbol: 'propeller', reveal: { influence: 1 }, effect: 'Look at top Hazard' }
  ] as Card[];
}

// Hazard card for deck creation
interface HazardCardDef {
  id: string;
  type: string;
  category: string;
  name: string;
  difficulty: number;
  flak: number;
  autoPass?: boolean;
  challengeType?: string;
  hazardType?: string;
  special?: string;
  gasLossOnFailure?: number;
  payloadSlotModifier?: { threshold: number; difficultyIncrease: number };
  hydrogenOnly?: boolean;
  engineerCost?: number;
  noSave?: boolean;
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
function createHazardDeck(): HazardCard[] {
  const hazards: HazardCardDef[] = [];

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
    const card: HazardCardDef = {
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

  return shuffleArray(hazards) as HazardCard[];
}

// Shuffle array helper (Math.random() is appropriate for game card shuffling)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // eslint-disable-line sonarjs/pseudo-random
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// TECH_CARD_BAG and PROGRESS_THRESHOLDS are imported from ../config/constants.ts
// See constants.ts for definitions per Section 1.3 and Appendix C

// Tech card structure
interface TechCard {
  id: string;
  name?: string;
  cost?: number;
  age?: number;
  [key: string]: unknown;
}

// Create tech card bag and R&D board together to avoid duplicates
// Returns { rdBoard: [...], techCardBag: [...] }
// Per Section 3.1: Include (N-1) copies of each card where N = player count
// starterCounts: Map of cardId -> count of players who have it as a starter
function createTechCardBagAndRDBoard(
  age: number = 1,
  playerCount: number = 4,
  starterCounts: Record<string, number> = {}
): { rdBoard: TechCard[]; techCardBag: TechCard[] } {
  const bag: TechCard[] = [];
  const copiesPerCard = Math.max(1, playerCount - 1);

  // Add cards up to current age with appropriate copy counts
  for (let a = 1; a <= age; a++) {
    for (const card of TECH_CARD_BAG[a] as TechCard[]) {
      // Calculate how many copies to add: (N-1) minus copies given as starters
      const startersUsed = starterCounts[card.id] || 0;
      const copiesToAdd = Math.max(0, copiesPerCard - startersUsed);

      // Add the appropriate number of copies
      for (let i = 0; i < copiesToAdd; i++) {
        bag.push({ ...card, age: a });
      }
    }
  }
  const shuffledBag = shuffleArray(bag);

  // Draw 4 cards for the R&D board from the shuffled bag
  const rdBoard = shuffledBag.splice(0, 4);

  return { rdBoard, techCardBag: shuffledBag };
}

// Create initial market cards using the 30-card market deck from Appendix H
// Returns { marketCards, marketDeck } where marketCards is the visible row of 5
// and marketDeck is the remaining 25 cards to draw from
function createMarketCards(): { marketCards: Card[]; marketDeck: Card[] } {
  const { createMarketRow } = require('../data/marketCards');
  const { marketRow, marketDeck } = createMarketRow();
  return { marketCards: marketRow, marketDeck };
}

// City definition
interface City {
  type: 'major' | 'minor';
  homeBase: string | null;
}

// Map definition
interface GameMap {
  name: string;
  age: number;
  routes: Route[];
  cities: Record<string, City>;
}

/**
 * Create Age I map routes per Appendix F
 * The Pioneer Era features 17 regional routes across Western Europe forming a fully connected network.
 * Each route has VP value matching Appendix F specifications.
 */
function createAgeIMap(): GameMap {
  return {
    name: 'Western Europe',
    age: 1,
    routes: [
      // Per Appendix F - Age I Routes (fully connected network)
      // Range 1 routes (starter/regional)
      { id: 'route_london_gateway', name: 'London Gateway', from: 'London', to: 'Dover',
        range: 1, speed: 0, ceiling: 0, income: 2, vp: 1, claimed: null },
      { id: 'route_channel', name: 'Channel Crossing', from: 'Calais', to: 'Dover',
        range: 1, speed: 1, ceiling: 0, income: 3, vp: 2, claimed: null },
      { id: 'route_rhine_valley', name: 'Rhine Valley', from: 'Frankfurt', to: 'Cologne',
        range: 1, speed: 0, ceiling: 0, income: 2, vp: 1, claimed: null },
      { id: 'route_low_countries', name: 'Low Countries', from: 'Brussels', to: 'Amsterdam',
        range: 1, speed: 1, ceiling: 0, income: 3, vp: 2, claimed: null },
      { id: 'route_paris_express', name: 'Paris Express', from: 'Paris', to: 'Brussels',
        range: 1, speed: 1, ceiling: 0, income: 3, vp: 2, claimed: null },
      { id: 'route_rhineland', name: 'Rhineland', from: 'Brussels', to: 'Cologne',
        range: 1, speed: 1, ceiling: 0, income: 3, vp: 2, claimed: null },
      { id: 'route_lake_constance', name: 'Lake Constance', from: 'Friedrichshafen', to: 'Zurich',
        range: 1, speed: 0, ceiling: 0, income: 3, vp: 2, claimed: null },
      // Range 2 routes (medium distance)
      { id: 'route_london_paris', name: 'London-Paris', from: 'London', to: 'Paris',
        range: 2, speed: 2, ceiling: 0, income: 5, vp: 3, claimed: null, track: 1 },
      { id: 'route_london_paris_2', name: 'London-Paris', from: 'London', to: 'Paris',
        range: 2, speed: 2, ceiling: 0, income: 5, vp: 3, claimed: null, track: 2 },
      { id: 'route_north_sea', name: 'North Sea Run', from: 'Hamburg', to: 'Amsterdam',
        range: 2, speed: 1, ceiling: 0, income: 4, vp: 2, claimed: null },
      { id: 'route_baltic', name: 'Baltic Passage', from: 'Hamburg', to: 'Copenhagen',
        range: 2, speed: 1, ceiling: 0, income: 4, vp: 2, claimed: null },
      { id: 'route_alpine', name: 'Alpine Transit', from: 'Zurich', to: 'Milan',
        range: 2, speed: 0, ceiling: 1, income: 4, vp: 2, claimed: null },
      { id: 'route_mediterranean', name: 'Mediterranean Link', from: 'Marseille', to: 'Barcelona',
        range: 2, speed: 1, ceiling: 0, income: 4, vp: 2, claimed: null },
      { id: 'route_german_alps', name: 'German Alps', from: 'Frankfurt', to: 'Friedrichshafen',
        range: 2, speed: 0, ceiling: 1, income: 4, vp: 2, claimed: null },
      { id: 'route_rome', name: 'Rome Approach', from: 'Milan', to: 'Rome',
        range: 2, speed: 1, ceiling: 1, income: 5, vp: 3, claimed: null },
      // Range 3 routes (long distance)
      { id: 'route_riviera', name: 'Riviera Express', from: 'Paris', to: 'Marseille',
        range: 3, speed: 1, ceiling: 0, income: 4, vp: 2, claimed: null },
      { id: 'route_berlin_vienna', name: 'Berlin-Vienna', from: 'Berlin', to: 'Vienna',
        range: 3, speed: 1, ceiling: 0, income: 5, vp: 3, claimed: null },
      { id: 'route_imperial', name: 'Imperial Circuit', from: 'London', to: 'Berlin',
        range: 3, speed: 2, ceiling: 0, income: 6, vp: 3, claimed: null }
    ] as Route[],
    cities: {
      'Frankfurt': { type: 'major', homeBase: 'germany' },
      'Cologne': { type: 'minor', homeBase: null },
      'Friedrichshafen': { type: 'minor', homeBase: 'germany' },
      'Calais': { type: 'minor', homeBase: null },
      'Dover': { type: 'minor', homeBase: 'britain' },
      'Paris': { type: 'major', homeBase: null },
      'Brussels': { type: 'major', homeBase: null },
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
 * The Atlantic Era features 21 hemispheric routes including luxury ocean crossings.
 * Each route has VP value and luxury requirement matching Appendix F specifications.
 */
function createAgeIIIMap(): GameMap {
  return {
    name: 'The Atlantic',
    age: 3,
    routes: [
      // Range 1 routes (regional connectors)
      { id: 'route_eastern_gateway', name: 'Eastern Gateway', from: 'New York', to: 'Lakehurst',
        range: 1, speed: 0, ceiling: 0, income: 4, vp: 2, luxury: 0, claimed: null },
      { id: 'route_german_hub', name: 'German Hub', from: 'Frankfurt', to: 'Friedrichshafen',
        range: 1, speed: 1, ceiling: 0, income: 4, vp: 2, luxury: 0, claimed: null },
      // Range 2 routes
      { id: 'route_south_atlantic', name: 'South Atlantic', from: 'Rio de Janeiro', to: 'Recife',
        range: 2, speed: 1, ceiling: 0, income: 5, vp: 2, luxury: 0, claimed: null },
      { id: 'route_caribbean', name: 'Caribbean Connection', from: 'Miami', to: 'Havana',
        range: 2, speed: 1, ceiling: 0, income: 5, vp: 2, luxury: 0, claimed: null },
      { id: 'route_pacific_coast', name: 'Pacific Coast', from: 'Los Angeles', to: 'San Francisco',
        range: 2, speed: 1, ceiling: 1, income: 5, vp: 2, luxury: 0, claimed: null },
      // Range 3 routes
      { id: 'route_rio_buenos_aires', name: 'Rio-Buenos Aires', from: 'Rio de Janeiro', to: 'Buenos Aires',
        range: 3, speed: 1, ceiling: 0, income: 5, vp: 2, luxury: 0, claimed: null },
      { id: 'route_european_trunk', name: 'European Trunk', from: 'London', to: 'Berlin',
        range: 3, speed: 2, ceiling: 1, income: 6, vp: 3, luxury: 0, claimed: null },
      { id: 'route_eastern_seaboard', name: 'Eastern Seaboard', from: 'New York', to: 'Miami',
        range: 3, speed: 2, ceiling: 0, income: 6, vp: 3, luxury: 0, claimed: null },
      { id: 'route_north_sea_express', name: 'North Sea Express', from: 'London', to: 'Oslo',
        range: 3, speed: 1, ceiling: 1, income: 6, vp: 3, luxury: 0, claimed: null },
      { id: 'route_around_cape_horn', name: 'Around Cape Horn', from: 'Buenos Aires', to: 'Valparaiso',
        range: 3, speed: 2, ceiling: 3, income: 7, vp: 3, luxury: 0, claimed: null },
      { id: 'route_arctic_explorer', name: 'Arctic Explorer', from: 'Oslo', to: 'Svalbard',
        range: 3, speed: 1, ceiling: 3, income: 7, vp: 3, luxury: 0, claimed: null },
      // Range 4 routes
      { id: 'route_transcontinental', name: 'Transcontinental', from: 'Chicago', to: 'Los Angeles',
        range: 4, speed: 2, ceiling: 1, income: 7, vp: 3, luxury: 0, claimed: null },
      { id: 'route_mediterranean_express', name: 'Mediterranean Express', from: 'Rome', to: 'Cairo',
        range: 4, speed: 2, ceiling: 1, income: 7, vp: 3, luxury: 0, claimed: null },
      { id: 'route_trans_amazon', name: 'Trans-Amazon', from: 'Rio de Janeiro', to: 'Manaus',
        range: 4, speed: 1, ceiling: 0, income: 7, vp: 3, luxury: 0, claimed: null },
      { id: 'route_north_atlantic_express', name: 'North Atlantic Express', from: 'New York', to: 'London',
        range: 4, speed: 2, ceiling: 2, income: 8, vp: 4, luxury: 0, claimed: null, track: 1 },
      { id: 'route_north_atlantic_express_2', name: 'North Atlantic Express', from: 'New York', to: 'London',
        range: 4, speed: 2, ceiling: 2, income: 8, vp: 4, luxury: 0, claimed: null, track: 2 },
      // Luxury Routes
      { id: 'route_empire_state_express', name: 'Empire State Express', from: 'New York', to: 'Chicago',
        range: 3, speed: 3, ceiling: 1, income: 8, vp: 4, luxury: 1, claimed: null },
      { id: 'route_imperial_airship', name: 'Imperial Airship Route', from: 'London', to: 'Cairo',
        range: 4, speed: 2, ceiling: 2, income: 9, vp: 4, luxury: 1, claimed: null },
      { id: 'route_california_clipper', name: 'California Clipper', from: 'Los Angeles', to: 'Honolulu',
        range: 5, speed: 2, ceiling: 1, income: 10, vp: 5, luxury: 1, claimed: null },
      { id: 'route_graf_zeppelin', name: 'Graf Zeppelin Route', from: 'Rio de Janeiro', to: 'Friedrichshafen',
        range: 5, speed: 2, ceiling: 2, income: 10, vp: 5, luxury: 1, claimed: null },
      { id: 'route_transatlantic_luxury', name: 'Transatlantic Luxury', from: 'London', to: 'New York',
        range: 4, speed: 3, ceiling: 2, income: 11, vp: 5, luxury: 2, claimed: null, track: 1 },
      { id: 'route_transatlantic_luxury_2', name: 'Transatlantic Luxury', from: 'London', to: 'New York',
        range: 4, speed: 3, ceiling: 2, income: 11, vp: 5, luxury: 2, claimed: null, track: 2 },
      { id: 'route_hindenburg', name: 'Hindenburg Route', from: 'Frankfurt', to: 'Lakehurst',
        range: 5, speed: 3, ceiling: 2, income: 12, vp: 6, luxury: 2, claimed: null }
    ] as Route[],
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

// Game player row from database
interface GamePlayerRow {
  id: string;           // game_players.id (unique for both humans and bots)
  user_id: string | null; // NULL for bots
  faction: Faction;
  is_bot: boolean;
  bot_name: string | null;
  [key: string]: unknown;
}

// Log entry structure - documents format, imported from @upship/api
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface LocalLogEntry {
  timestamp: string;
  message: string;
  type: string;
}

// Initialize game state when game starts
async function initializeGameState(
  gameId: string,
  players: GamePlayerRow[]
): Promise<GameState> {
  const client: PoolClient = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get player IDs - use game_players.id for bots, user_id for humans
    const getPlayerId = (p: GamePlayerRow): string => p.is_bot ? p.id : (p.user_id as string);

    // Determine player order randomly
    const playerOrder = shuffleArray(players.map(getPlayerId));

    // Create player states
    const playerStates: Record<string, PlayerState> = {};
    for (const player of players) {
      const playerId = getPlayerId(player);
      playerStates[playerId] = createPlayerState(player.faction);
      // Add bot info if this is a bot player
      if (player.is_bot) {
        playerStates[playerId].isBot = true;
        playerStates[playerId].botName = player.bot_name || undefined;
      }
      // Draw initial hand of 5 cards
      const state = playerStates[playerId];
      state.deck = shuffleArray(state.deck as Card[]);
      state.hand = (state.deck as Card[]).splice(0, 5);
    }

    // Determine player count for progress thresholds
    const playerCount = Math.min(4, Math.max(2, players.length));

    // Count starting tech cards across all players
    // Per Section 3.1: Remove copies of faction starters equal to players who have them
    const starterCounts: Record<string, number> = {};
    for (const pid of Object.keys(playerStates)) {
      for (const card of (playerStates[pid] as PlayerState & { techCards?: string[] }).techCards || []) {
        starterCounts[card] = (starterCounts[card] || 0) + 1;
      }
    }

    // Create tech card bag and R&D board with player-scaled copies
    // Per Section 3.1: (N-1) copies per card, minus faction starters
    const { rdBoard, techCardBag } = createTechCardBagAndRDBoard(1, playerCount, starterCounts);

    // Create market cards (5 visible + 25 in deck)
    const { marketCards, marketDeck } = createMarketCards();

    // Calculate initial turn order by income (lowest first)
    // At game start, all players have income 5, so use original random order
    const initialPlacementOrder = [...playerOrder];

    // Create initial game state
    // Note: Server uses some different property names than API types (e.g., turn vs turnInRound)
    // Cast through unknown to allow this flexibility during migration
    const gameState = {
      age: 1,
      round: 1,        // Increments each time all players complete a cycle
      turnInRound: 1,  // Resets to 1 at start of each round
      phase: 'worker_placement', // worker_placement, reveal, income_cleanup
      currentPlayerIndex: 0,
      playerOrder,
      playerCount,
      firstPlayer: playerOrder[0], // GAP-081: Initialize First Player token to first player in turn order
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
      techBag: techCardBag,
      marketCards,
      marketDeck,
      progressTrack: 0,
      progressThresholds: PROGRESS_THRESHOLDS[playerCount],
      gasMarket: { hydrogen: 1, helium: 2 }, // Prices per cube (Section 4.4: H₂ fixed at £1, He starts at £2)
      map: createAgeIMap(),
      log: [{
        timestamp: new Date().toISOString(),
        message: 'Game started',
        type: 'system'
      }]
    } as unknown as GameState;

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

// Game state wrapper returned from database
interface GameStateWrapper {
  id: number;
  gameId: string;
  version: number;
  currentPlayerId: string;
  phase: string;
  turnNumber: number;
  age: number;
  state: GameState;
  updatedAt: Date;
}

// Database row for game state
interface GameStateRow {
  id: number;
  game_id: string;
  version: number;
  current_player_id: string;
  phase: string;
  turn_number: number;
  age: number;
  state: GameState;
  updated_at: Date;
  commit_point_version?: number;
}

// Get current game state
async function getGameState(gameId: string): Promise<GameStateWrapper | null> {
  const result = await pool.query(
    `SELECT * FROM game_states WHERE game_id = $1`,
    [gameId]
  ) as { rows: GameStateRow[] };

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

// Action data for recording
interface ActionRecord {
  playerId: string;
  type: string;
  data: unknown;
}

// Update result with version info
interface UpdateResult extends GameState {
  version: number;
  isCommitPoint: boolean;
}

// Update game state with optimistic locking
// If expectedVersion is provided, the update will fail if the current version doesn't match
// This prevents race conditions where two concurrent requests both process based on the same state
async function updateGameState(
  gameId: string,
  newState: GameState,
  action: ActionRecord | null = null,
  expectedVersion: number | null = null
): Promise<UpdateResult> {
  const client: PoolClient = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get current state and version (for undo snapshot)
    const current = await client.query<{ state: GameState; version: number; commit_point_version: number }>(
      'SELECT state, version, commit_point_version FROM game_states WHERE game_id = $1 FOR UPDATE',
      [gameId]
    );

    if (current.rows.length === 0) {
      throw new Error('Game state not found');
    }

    const previousState = current.rows[0].state;
    const currentVersion = current.rows[0].version;

    // SECURITY: Optimistic locking - verify expected version matches current version
    // This prevents race conditions where concurrent requests could double-spend resources
    if (expectedVersion !== null && currentVersion !== expectedVersion) {
      const { ConflictError } = require('../errors');
      throw new ConflictError(
        `State was modified by another request (expected version ${expectedVersion}, current ${currentVersion}). Please retry.`
      );
    }

    const newVersion = currentVersion + 1;

    // Check if this action creates a commit point (reveals hidden info)
    let isCommitPoint = false;
    let shouldStoreSnapshot = false;

    if (action) {
      const { createsCommitPoint, isUndoable } = require('../actions/undo');
      isCommitPoint = createsCommitPoint(action.type, action.data);
      shouldStoreSnapshot = isUndoable(action.type);
    }

    // Update state, and commit_point_version if this action creates a commit point
    // Use turnInRound for the turn_number field
    const turnNumber = (newState as GameState & { turnInRound?: number }).turnInRound || 1;
    await client.query(
      `UPDATE game_states
       SET state = $1, version = $2,
           current_player_id = $3, phase = $4,
           turn_number = $5, age = $6,
           commit_point_version = CASE WHEN $8 THEN $2 ELSE commit_point_version END,
           updated_at = NOW()
       WHERE game_id = $7`,
      [
        JSON.stringify(newState),
        newVersion,
        newState.playerOrder[newState.currentPlayerIndex],
        newState.phase,
        turnNumber,
        newState.age,
        gameId,
        isCommitPoint
      ]
    );

    // Record action if provided (with undo support columns)
    if (action) {
      await client.query(
        `INSERT INTO game_actions (game_id, player_id, action_type, action_data, state_version, is_undone, creates_commit_point, previous_state)
         VALUES ($1, $2, $3, $4, $5, FALSE, $6, $7)`,
        [
          gameId,
          action.playerId,
          action.type,
          JSON.stringify(action.data),
          newVersion,
          isCommitPoint,
          shouldStoreSnapshot ? previousState : null
        ]
      );
    }

    await client.query('COMMIT');
    return { ...newState, version: newVersion, isCommitPoint };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Game action row from database
interface GameActionRow {
  id: number;
  game_id: string;
  player_id: string;
  action_type: string;
  action_data: unknown;
  state_version: number;
  is_undone: boolean;
  creates_commit_point: boolean;
  previous_state: GameState | null;
  created_at: Date;
  username: string;
}

// Get action history for a game
async function getGameActions(gameId: string, limit: number = 50): Promise<GameActionRow[]> {
  const result = await pool.query(
    `SELECT ga.*, u.username
     FROM game_actions ga
     JOIN users u ON ga.player_id = u.id
     WHERE ga.game_id = $1
     ORDER BY ga.created_at DESC
     LIMIT $2`,
    [gameId, limit]
  ) as { rows: GameActionRow[] };

  return result.rows;
}

module.exports = {
  initializeGameState,
  getGameState,
  updateGameState,
  getGameActions,
  FACTION_CONFIG,
  TECH_CARD_BAG,    // Exported for testing (GAP-043)
  createHazardDeck,  // Exported for testing (GAP-030)
  createAgeIMap,     // Exported for testing (GAP-040)
  createAgeIIIMap,   // Exported for Age III routes (GAP-042)
  // Legacy aliases for backwards compatibility during migration
  TECHNOLOGY_BAG: TECH_CARD_BAG
};
