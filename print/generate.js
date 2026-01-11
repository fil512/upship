#!/usr/bin/env node
/**
 * Card Generation Script for UP SHIP! Print Edition
 *
 * Generates print-ready card images (750x1050px at 300 DPI = 2.5" x 3.5")
 * using Playwright to render HTML templates.
 *
 * Usage:
 *   node generate.js [target]
 *
 * Targets:
 *   (none)      - Generate everything (cards, tiles, boards, sheets)
 *   cards       - All card types (agent, hazard, tech, mission) + sheets
 *   boards      - Action board and player boards
 *   tiles       - Tech tiles + tile sheets
 *   sheets      - Print sheets only (requires existing cards/tiles)
 *   agent       - Agent cards only
 *   hazard      - Hazard cards only
 *   tech        - Tech cards only
 *   mission     - Mission cards only
 *   playerboard - Player boards only
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'fs';

// Directory setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PATHS = {
  templates: join(__dirname, 'templates'),
  output: join(__dirname, 'output'),
  webStatic: resolve(__dirname, '../web/static'),
  serverData: resolve(__dirname, '../server/data'),
  serverServices: resolve(__dirname, '../server/services'),
};

// Card dimensions (2.5" x 3.5" at 300 DPI)
const CARD_WIDTH = 750;
const CARD_HEIGHT = 1050;

// Tile dimensions (1.5" x 0.95" at 300 DPI)
const TILE_WIDTH = 450;
const TILE_HEIGHT = 285;

// Board dimensions (11" x 8.5" at 300 DPI = Letter, landscape)
const BOARD_WIDTH = 3300;
const BOARD_HEIGHT = 2550;

// Player board dimensions (11" x 8.5" at 300 DPI = Letter, landscape)
const PLAYER_BOARD_WIDTH = 3300;
const PLAYER_BOARD_HEIGHT = 2550;

// Parse command line arguments
const args = process.argv.slice(2);

// Support both positional argument and legacy --type= flag
const positionalArg = args.find(a => !a.startsWith('--'));
const typeArg = args.find(a => a.startsWith('--type='));
const target = positionalArg || (typeArg ? typeArg.split('=')[1] : null);

// Legacy flags (still supported for backwards compatibility)
const sheetsOnly = target === 'sheets' || args.includes('--sheets-only');
const tilesOnly = target === 'tiles' || args.includes('--tiles-only');
const cardsOnly = target === 'cards';
const boardsOnly = target === 'boards';

// Specific card/component types
const cardType = ['agent', 'hazard', 'tech', 'mission', 'starter', 'tile', 'board', 'playerboard'].includes(target) ? target : null;

/**
 * Load card data from server files
 */
async function loadCardData() {
  // Card data extracted from server TypeScript files
  // (Can't easily import TypeScript directly in Node.js ESM context)

  const agentCards = [
    // Technical Personnel
    { id: 'market_chief_engineer', name: 'Chief Engineer', category: 'technical', cost: 4, symbol: 'wrench', effect: null, reveal: { engineers: 1, research: 2 } },
    { id: 'market_test_pilot', name: 'Kite Jockey', category: 'technical', cost: 5, symbol: 'propeller', effect: '+2 Reliability for this launch', reveal: { officers: 1 } },
    { id: 'market_navigator', name: 'Navigator', category: 'technical', cost: 3, symbol: 'propeller', effect: '+1 Range for this launch', reveal: { cash: 1 } },
    { id: 'market_weather_expert', name: 'The Weatherman', category: 'technical', cost: 4, symbol: 'propeller', effect: 'Ignore Weather hazards this launch', reveal: { engineers: 1, research: 1 } },
    { id: 'market_gas_engineer', name: 'Gasbag Man', category: 'technical', cost: 3, symbol: 'wrench', effect: 'Gain 1 Hydrogen', reveal: { gas: 1, research: 1 } },
    { id: 'market_engine_specialist', name: 'Engine Room Mechanic', category: 'technical', cost: 3, symbol: 'wrench', effect: 'If used to build: ignore base cost', reveal: { cash: 1, research: 1 } },
    { id: 'market_safety_inspector', name: 'The Scrutineer', category: 'technical', cost: 4, symbol: 'wrench', effect: '+2 Reliability for this launch', reveal: { engineers: 1 } },
    { id: 'market_ground_crew_chief', name: 'Rigger Chief', category: 'technical', cost: 2, symbol: 'wrench', effect: '-2 Hull Cost', reveal: { cash: 2 } },
    { id: 'market_structural_engineer', name: 'Duralumin Man', category: 'technical', cost: 3, symbol: 'wrench', effect: 'If used to build: ignore frame cost', reveal: { research: 1 } },
    { id: 'market_fuel_specialist', name: 'Blaugas Handler', category: 'technical', cost: 3, symbol: 'wrench', effect: '-2 Lifting Gas cost', reveal: { gas: 1, cash: 1 } },
    // Political/Financial Personnel
    { id: 'market_aristocrat', name: 'The Nob', category: 'political', cost: 5, symbol: 'coin', effect: 'Gain 5', reveal: { influence: 2 } },
    { id: 'market_industrial_magnate', name: 'Captain of Industry', category: 'political', cost: 6, symbol: 'any', effect: 'Gain 3', reveal: { influence: 3 } },
    { id: 'market_government_minister', name: 'The Mandarin', category: 'political', cost: 5, symbol: 'propeller', effect: 'Take 2 Ministry actions', reveal: { influence: 2, cash: 1 } },
    { id: 'market_shipping_tycoon', name: 'Merchant Prince', category: 'political', cost: 4, symbol: 'propeller', effect: '+2 Income from this route', reveal: { influence: 2 } },
    { id: 'market_press_baron', name: 'Fleet Street Baron', category: 'political', cost: 4, symbol: 'any', effect: 'No action effect', reveal: { influence: 2, cash: 2 } },
    { id: 'market_foreign_investor', name: 'The Moneybags', category: 'political', cost: 3, symbol: 'coin', effect: 'Treasury gives +3', reveal: { influence: 2 } },
    { id: 'market_insurance_agent', name: "Lloyd's Man", category: 'political', cost: 3, symbol: 'coin', effect: 'Gain 1 Insurance policy', reveal: { influence: 2 } },
    { id: 'market_bureaucrat', name: 'The Pen-Pusher', category: 'political', cost: 2, symbol: 'propeller', effect: 'Go first in turn order next round', reveal: { influence: 2 } },
    { id: 'market_union_representative', name: 'Shop Steward', category: 'political', cost: 2, symbol: 'coin', effect: '-1 per crew recruited this action', reveal: { influence: 2, officers: 1 } },
    { id: 'market_customs_official', name: 'The Exciseman', category: 'political', cost: 3, symbol: 'propeller', effect: null, reveal: { influence: 2 } },
    // Research Personnel
    { id: 'market_university_partnership', name: 'The Boffin', category: 'research', cost: 4, symbol: 'propeller', effect: '-2 per Technology this round', reveal: { research: 3 } },
    { id: 'market_patent_attorney', name: 'Patent Clerk', category: 'research', cost: 3, symbol: 'propeller', effect: '-1 to Technology Research cost', reveal: { influence: 1, research: 1 } },
    { id: 'market_research_assistant', name: 'The Lab Coat', category: 'research', cost: 2, symbol: 'propeller', effect: '+1 Research this round', reveal: { research: 1 } },
    { id: 'market_technical_library', name: 'The Archives', category: 'research', cost: 3, symbol: 'propeller', effect: 'Remove previous age tech cards from R&D', reveal: { research: 2 } },
    { id: 'market_foreign_consultant', name: 'Continental Expert', category: 'research', cost: 4, symbol: 'propeller', effect: '+2 Reveal Research this round', reveal: { research: 1, cash: 1, influence: 2 } },
    // Organizations
    { id: 'market_royal_geographic', name: 'Royal Geographic Society', category: 'organizations', cost: 6, symbol: 'wrench', effect: 'Gain tech card costing 3 or less', reveal: { engineers: 1, influence: 2, research: 1 } },
    { id: 'market_combat_veteran', name: 'Old Contemptible', category: 'organizations', cost: 5, symbol: 'propeller', effect: 'Gain 8; Combat missions: +2 Income', reveal: { officers: 1, cash: 1, influence: 1 } },
    { id: 'market_luxury_travel_agency', name: "Cook's Man", category: 'organizations', cost: 5, symbol: 'propeller', effect: '+1 Luxury stat for this launch', reveal: { influence: 2 } },
    { id: 'market_aviation_club', name: 'Aero Club', category: 'organizations', cost: 4, symbol: 'coin', effect: 'Recruit 1 Officer free', reveal: { influence: 2, officers: 1 } },
    { id: 'market_engineering_guild', name: 'Engineering Guild', category: 'organizations', cost: 4, symbol: 'coin', effect: 'Gain 1 Engineer', reveal: { influence: 1, engineers: 1 } },
    // Reserve Card
    { id: 'reserve_aeronaut', name: 'The Aeronaut', category: 'organizations', cost: 2, symbol: 'any', effect: null, reveal: { influence: 2 } },
  ];

  // Starter deck cards (10 per player, no cost)
  const starterCards = [
    { id: 'starter_apprentice', name: 'Apprentice', category: 'starter', cost: null, symbol: 'any', effect: null, reveal: { influence: 2 } },
    { id: 'starter_mechanic', name: 'Mechanic', category: 'starter', cost: null, symbol: 'wrench', effect: null, reveal: { cash: 1, influence: 1 } },
    { id: 'starter_draftsman', name: 'Draftsman', category: 'starter', cost: null, symbol: 'wrench', effect: 'Draw 1 card', reveal: { influence: 1, research: 1 } },
    { id: 'starter_rigger', name: 'Rigger', category: 'starter', cost: null, symbol: 'wrench', effect: '-£2 ship build cost', reveal: { research: 1, influence: 1 } },
    { id: 'starter_purser', name: 'Purser', category: 'starter', cost: null, symbol: 'coin', effect: 'Gain £2', reveal: { influence: 2 } },
    { id: 'starter_clerk', name: 'Clerk', category: 'starter', cost: null, symbol: 'coin', effect: 'Gain £1', reveal: { cash: 1, influence: 1 } },
    { id: 'starter_investor', name: 'Investor', category: 'starter', cost: null, symbol: 'coin', effect: null, reveal: { influence: 2 } },
    { id: 'starter_researcher', name: 'Researcher', category: 'starter', cost: null, symbol: 'propeller', effect: '-£1 per Research', reveal: { research: 2, influence: 1 } },
    { id: 'starter_helmsman', name: 'Helmsman', category: 'starter', cost: null, symbol: 'propeller', effect: '+1 ship stat this launch', reveal: { officers: 1, influence: 1 } },
    { id: 'starter_navigator', name: 'Navigator', category: 'starter', cost: null, symbol: 'propeller', effect: 'Look at top Hazard card', reveal: { influence: 2 } },
  ];

  const hazardCards = [
    // Clear Weather (4)
    { id: 'clear_weather_0', name: 'Clear Skies', category: 'clear', autoPass: true, difficulty: 0, flak: 0 },
    { id: 'clear_weather_1', name: 'Favorable Winds', category: 'clear', autoPass: true, difficulty: 0, flak: 0 },
    { id: 'clear_weather_2', name: 'Calm Conditions', category: 'clear', autoPass: true, difficulty: 0, flak: 0 },
    { id: 'clear_weather_3', name: 'Perfect Visibility', category: 'clear', autoPass: true, difficulty: 0, flak: 0 },
    // Standard Hazards (16) - Total Difficulty = Hazard Difficulty + Mission Difficulty - Ship Reliability
    { id: 'hazard_0', name: 'Light Turbulence', category: 'hazard', difficulty: 2, flak: 0 },
    { id: 'hazard_1', name: 'Minor Engine Trouble', category: 'hazard', difficulty: 1, flak: 0 },
    { id: 'hazard_2', name: 'Crosswind', category: 'hazard', difficulty: 3, flak: 0 },
    { id: 'hazard_3', name: 'Gas Leak', category: 'hazard', difficulty: 2, flak: 1 },
    { id: 'hazard_4', name: 'Low Visibility', category: 'hazard', difficulty: 2, flak: 0 },
    { id: 'hazard_5', name: 'Fuel Concern', category: 'hazard', difficulty: 2, flak: 0 },
    { id: 'hazard_6', name: 'Headwind', category: 'hazard', difficulty: 3, flak: 0 },
    { id: 'hazard_7', name: 'Structural Stress', category: 'hazard', difficulty: 2, flak: 1 },
    { id: 'hazard_8', name: 'Strong Headwind', category: 'hazard', difficulty: 4, flak: 1 },
    { id: 'hazard_9', name: 'Icing Conditions', category: 'hazard', difficulty: 3, flak: 1 },
    { id: 'hazard_10', name: 'Engine Failure', category: 'hazard', difficulty: 3, flak: 2 },
    { id: 'hazard_11', name: 'Storm System', category: 'hazard', difficulty: 4, flak: 2 },
    { id: 'hazard_12', name: 'Structural Damage', category: 'hazard', difficulty: 3, flak: 2 },
    { id: 'hazard_13', name: 'Navigation Error', category: 'hazard', difficulty: 3, flak: 1 },
    { id: 'hazard_14', name: 'Squall Line', category: 'hazard', difficulty: 4, flak: 2 },
    { id: 'hazard_15', name: 'Severe Icing', category: 'hazard', difficulty: 2, flak: 1 },
    // Fire Hazards (5) - Hydrogen ships only
    { id: 'engine_fire_0', name: 'Engine Fire', category: 'fire', difficulty: 2, flak: 1 },
    { id: 'engine_fire_1', name: 'Engine Fire', category: 'fire', difficulty: 2, flak: 1 },
    { id: 'gas_cell_rupture_0', name: 'Gas Cell Rupture', category: 'fire', difficulty: 3, flak: 2 },
    { id: 'gas_cell_rupture_1', name: 'Gas Cell Rupture', category: 'fire', difficulty: 3, flak: 2 },
    { id: 'static_discharge_0', name: 'Static Discharge', category: 'fire', difficulty: 2, flak: 2 },
    // Catastrophic (1)
    { id: 'catastrophic_explosion_0', name: 'Catastrophic Explosion', category: 'catastrophic', difficulty: 99, flak: 3 },
    // Standard Hazard (1)
    { id: 'critical_structural_stress_0', name: 'Critical Structural Stress', category: 'hazard', difficulty: 3, flak: 2 },
  ];

  // Tech tiles that each tech card unlocks
  const TECH_TILES = {
    daimler_engine: { name: 'Basic Engine', slotType: 'drive', weight: 1, hullCost: 1, stats: { speed: 1, range: 1 } },
    improved_propeller: { name: 'Efficient Propeller', slotType: 'drive', weight: 1, hullCost: 2, stats: { speed: 1, range: 1 } },
    dual_engine_mount: { name: 'Twin Engine', slotType: 'drive', weight: 3, hullCost: 3, stats: { speed: 2, reliability: 1 } },
    diesel_powerplant: { name: 'Diesel Engine', slotType: 'drive', weight: 2, hullCost: 3, stats: { range: 2, reliability: 1 } },
    swiveling_propeller: { name: 'Vectored Thrust', slotType: 'drive', weight: 2, hullCost: 2, stats: { speed: 1, ceiling: 1 } },
    contra_rotating: { name: 'Balanced Propulsion', slotType: 'drive', weight: 2, hullCost: 3, stats: { speed: 2, reliability: 1 } },
    streamlined_nacelle: { name: 'Aerodynamic Engine', slotType: 'drive', weight: 2, hullCost: 3, stats: { speed: 3 } },
    supercharged_engine: { name: 'High-Altitude Engine', slotType: 'drive', weight: 3, hullCost: 4, stats: { speed: 2, ceiling: 2 } },
    diesel_electric: { name: 'Hybrid Powerplant', slotType: 'drive', weight: 3, hullCost: 4, stats: { range: 3, reliability: 1 } },
    variable_pitch: { name: 'Adaptive Propeller', slotType: 'drive', weight: 2, hullCost: 3, stats: { speed: 1, range: 2 } },
    wooden_framework: { name: 'Wooden Frame', slotType: 'frame', weight: 2, hullCost: 1, stats: { reliability: 1, gas_socket: 1 } },
    steel_framework: { name: 'Steel Frame', slotType: 'frame', weight: 3, hullCost: 1, stats: { reliability: 2, gas_socket: 1 } },
    geodetic_structure: { name: 'Geodetic Frame', slotType: 'frame', weight: 1, hullCost: 3, stats: { reliability: 2, ceiling: 1, gas_socket: 1 } },
    fireproof_coating: { name: 'Fire-Resistant Fabric', slotType: 'fabric', weight: 1, hullCost: 2, stats: { reliability: 1 } },
    aluminum_doping: { name: 'Reflective Covering', slotType: 'fabric', weight: 0, hullCost: 1, stats: { reliability: 1 } },
    grounding_systems: { name: 'Conductive Covering', slotType: 'fabric', weight: 0, hullCost: 1, stats: { reliability: 1 } },
    gelatinized_latex: { name: 'Synthetic Envelope', slotType: 'fabric', weight: 0, hullCost: 2, stats: { reliability: 1, range: 1 } },
    composite_covering: { name: 'Advanced Fabric', slotType: 'fabric', weight: 0, hullCost: 2, stats: { reliability: 2 } },
    improved_valving: { name: 'Pressure Control', slotType: 'component', weight: 1, hullCost: 1, stats: { ceiling: 1 } },
    manual_ballonets: { name: 'Altitude Ballonets', slotType: 'component', weight: 1, hullCost: 1, stats: { ceiling: 1 } },
    multiple_gas_cells: { name: 'Compartmented Gas', slotType: 'component', weight: 1, hullCost: 2, stats: { lift: 2, reliability: 1 } },
    automatic_valves: { name: 'Smart Valving', slotType: 'component', weight: 1, hullCost: 2, stats: { reliability: 1, ceiling: 1 } },
    pressure_altitude_system: { name: 'High-Ceiling Gas', slotType: 'component', weight: 2, hullCost: 3, stats: { lift: 3, ceiling: 2 } },
    triple_gas_cell: { name: 'Redundant Cells', slotType: 'component', weight: 2, hullCost: 3, stats: { lift: 4, reliability: 2 } },
    emergency_venting: { name: 'Rapid Descent System', slotType: 'component', weight: 1, hullCost: 2, stats: { reliability: 2 } },
    gas_recovery: { name: 'Reclamation System', slotType: 'component', weight: 1, hullCost: 3, stats: { range: 2 } },
    water_recovery_system: { name: 'Exhaust Condensers', slotType: 'component', weight: 2, hullCost: 3, stats: {} },
    observation_platform: { name: 'Spotter Gondola', slotType: 'component', weight: 1, hullCost: 1, stats: { income: 1 } },
    mail_compartment: { name: 'Postal Service', slotType: 'component', weight: 1, hullCost: 1, stats: { income: 2 } },
    cargo_nets: { name: 'External Cargo', slotType: 'component', weight: 2, hullCost: 1, stats: { income: 2 } },
    passenger_gondola: { name: 'Basic Cabin', slotType: 'component', weight: 2, hullCost: 2, stats: { income: 2, luxury: 1 } },
    bomb_bay_design: { name: 'Bombing Equipment', slotType: 'component', weight: 3, hullCost: 2, stats: {} },
    trapeze_system: { name: 'Sparrowhawk Hangar', slotType: 'component', weight: 3, hullCost: 3, stats: {} },
    radio_equipment: { name: 'Communications Suite', slotType: 'component', weight: 1, hullCost: 2, stats: { reliability: 1 } },
    armored_gondola: { name: 'Light Armor Plating', slotType: 'component', weight: 2, hullCost: 2, stats: { armor: 1 } },
    reinforced_hull: { name: 'Heavy Armor Plating', slotType: 'component', weight: 3, hullCost: 3, stats: { armor: 2 } },
    luxury_accommodation: { name: 'Luxury Cabin', slotType: 'component', weight: 3, hullCost: 3, stats: { income: 3, luxury: 2 } },
    dining_saloon: { name: 'Restaurant', slotType: 'component', weight: 2, hullCost: 2, stats: { income: 2, luxury: 2 } },
    promenade_deck: { name: 'Observation Lounge', slotType: 'component', weight: 2, hullCost: 3, stats: { income: 1, luxury: 3 } },
    sleeping_quarters: { name: 'Private Berths', slotType: 'component', weight: 2, hullCost: 2, stats: { income: 2, luxury: 1 } },
    smoking_room: { name: 'Pressurized Lounge', slotType: 'component', weight: 2, hullCost: 3, stats: { income: 1, luxury: 2 } },
  };

  const techCards = [
    // Drive techs (VP per Appendix C)
    { id: 'daimler_engine', name: 'Daimler Engine', type: 'drive', cost: 3, age: 1, vp: 0, tile: TECH_TILES.daimler_engine },
    { id: 'improved_propeller', name: 'Improved Propeller', type: 'drive', cost: 4, age: 1, vp: 0, tile: TECH_TILES.improved_propeller },
    { id: 'dual_engine_mount', name: 'Dual Engine Mount', type: 'drive', cost: 5, age: 2, vp: 1, tile: TECH_TILES.dual_engine_mount },
    { id: 'diesel_powerplant', name: 'Diesel Powerplant', type: 'drive', cost: 6, age: 2, vp: 1, tile: TECH_TILES.diesel_powerplant },
    { id: 'swiveling_propeller', name: 'Swiveling Propeller', type: 'drive', cost: 5, age: 2, vp: 1, tile: TECH_TILES.swiveling_propeller },
    { id: 'contra_rotating', name: 'Contra-Rotating Props', type: 'drive', cost: 6, age: 2, vp: 0, tile: TECH_TILES.contra_rotating },
    { id: 'streamlined_nacelle', name: 'Streamlined Nacelle', type: 'drive', cost: 6, age: 3, vp: 0, tile: TECH_TILES.streamlined_nacelle },
    { id: 'supercharged_engine', name: 'Supercharged Engine', type: 'drive', cost: 7, age: 3, vp: 1, tile: TECH_TILES.supercharged_engine },
    { id: 'diesel_electric', name: 'Diesel-Electric Drive', type: 'drive', cost: 7, age: 3, vp: 1, tile: TECH_TILES.diesel_electric },
    { id: 'variable_pitch', name: 'Variable-Pitch Propeller', type: 'drive', cost: 6, age: 3, vp: 0, tile: TECH_TILES.variable_pitch },
    // Frame techs (VP per Appendix C)
    { id: 'wooden_framework', name: 'Wooden Framework', type: 'structure', cost: 3, age: 1, vp: 0, tile: TECH_TILES.wooden_framework },
    { id: 'steel_framework', name: 'Steel Framework', type: 'structure', cost: 5, age: 2, vp: 2, tile: TECH_TILES.steel_framework },
    { id: 'geodetic_structure', name: 'Geodetic Structure', type: 'structure', cost: 7, age: 3, vp: 0, tile: TECH_TILES.geodetic_structure },
    { id: 'modular_construction', name: 'Modular Construction', type: 'structure', cost: 5, age: 3, vp: 3, tile: TECH_TILES.modular_frame },
    { id: 'dynamic_lift_surfaces', name: 'Dynamic Lift Surfaces', type: 'structure', cost: 6, age: 3, vp: 2, tile: TECH_TILES.aerodynamic_lift_system },
    { id: 'aerodynamic_hull_design', name: 'Aerodynamic Hull Design', type: 'structure', cost: 4, age: 2, vp: 1, tile: TECH_TILES.streamlined_hull },
    // Fabric techs (VP per Appendix C)
    { id: 'fireproof_coating', name: 'Fireproof Coating', type: 'fabric', cost: 4, age: 2, vp: 2, tile: TECH_TILES.fireproof_coating },
    { id: 'aluminum_doping', name: 'Aluminum Doping', type: 'fabric', cost: 5, age: 2, vp: 1, tile: TECH_TILES.aluminum_doping },
    { id: 'grounding_systems', name: 'Grounding Systems', type: 'fabric', cost: 5, age: 2, vp: 1, tile: TECH_TILES.grounding_systems },
    { id: 'gelatinized_latex', name: 'Gelatinized Latex', type: 'fabric', cost: 6, age: 3, vp: 0, tile: TECH_TILES.gelatinized_latex },
    { id: 'composite_covering', name: 'Composite Covering', type: 'fabric', cost: 7, age: 3, vp: 1, tile: TECH_TILES.composite_covering },
    // Gas System techs (VP per Appendix C)
    { id: 'improved_valving', name: 'Improved Valving', type: 'gas', cost: 3, age: 1, vp: 0, tile: TECH_TILES.improved_valving },
    { id: 'manual_ballonets', name: 'Manual Ballonets', type: 'gas', cost: 4, age: 1, vp: 0, tile: TECH_TILES.manual_ballonets },
    { id: 'multiple_gas_cells', name: 'Multiple Gas Cells', type: 'gas', cost: 5, age: 2, vp: 0, tile: TECH_TILES.multiple_gas_cells },
    { id: 'automatic_valves', name: 'Automatic Valves', type: 'gas', cost: 5, age: 2, vp: 1, tile: TECH_TILES.automatic_valves },
    { id: 'pressure_altitude_system', name: 'Pressure Altitude System', type: 'gas', cost: 6, age: 3, vp: 1, tile: TECH_TILES.pressure_altitude_system },
    { id: 'triple_gas_cell', name: 'Triple Gas Cell', type: 'gas', cost: 6, age: 3, vp: 0, tile: TECH_TILES.triple_gas_cell },
    { id: 'emergency_venting', name: 'Emergency Venting', type: 'gas', cost: 5, age: 3, vp: 2, tile: TECH_TILES.emergency_venting },
    { id: 'gas_recovery', name: 'Gas Recovery', type: 'gas', cost: 6, age: 3, vp: 2, tile: TECH_TILES.gas_recovery },
    { id: 'water_recovery_system', name: 'Water Recovery System', type: 'gas', cost: 7, age: 3, vp: 1, tile: TECH_TILES.water_recovery_system },
    // Component techs (VP per Appendix C)
    { id: 'observation_platform', name: 'Observation Platform', type: 'component', cost: 2, age: 1, vp: 0, tile: TECH_TILES.observation_platform },
    { id: 'mail_compartment', name: 'Mail Compartment', type: 'component', cost: 3, age: 1, vp: 0, tile: TECH_TILES.mail_compartment },
    { id: 'cargo_nets', name: 'Cargo Nets', type: 'component', cost: 3, age: 1, vp: 1, tile: TECH_TILES.cargo_nets },
    { id: 'passenger_gondola', name: 'Passenger Gondola', type: 'component', cost: 4, age: 1, vp: 0, tile: TECH_TILES.passenger_gondola },
    { id: 'bomb_bay_design', name: 'Bomb Bay Design', type: 'component', cost: 4, age: 2, vp: 3, tile: TECH_TILES.bomb_bay_design },
    { id: 'trapeze_system', name: 'Trapeze System', type: 'component', cost: 5, age: 2, vp: 2, tile: TECH_TILES.trapeze_system },
    { id: 'radio_equipment', name: 'Radio Equipment', type: 'component', cost: 4, age: 2, vp: 1, tile: TECH_TILES.radio_equipment },
    { id: 'armored_gondola', name: 'Armored Gondola', type: 'component', cost: 5, age: 2, vp: 1, tile: TECH_TILES.armored_gondola },
    { id: 'reinforced_hull', name: 'Reinforced Hull', type: 'component', cost: 6, age: 3, vp: 2, tile: TECH_TILES.reinforced_hull },
    { id: 'luxury_accommodation', name: 'Luxury Accommodation', type: 'component', cost: 5, age: 2, vp: 0, tile: TECH_TILES.luxury_accommodation },
    { id: 'dining_saloon', name: 'Dining Saloon', type: 'component', cost: 4, age: 2, vp: 0, tile: TECH_TILES.dining_saloon },
    { id: 'promenade_deck', name: 'Promenade Deck', type: 'component', cost: 6, age: 3, vp: 2, tile: TECH_TILES.promenade_deck },
    { id: 'sleeping_quarters', name: 'Sleeping Quarters', type: 'component', cost: 5, age: 3, vp: 1, tile: TECH_TILES.sleeping_quarters },
    { id: 'smoking_room', name: 'Smoking Room', type: 'component', cost: 7, age: 3, vp: 3, tile: TECH_TILES.smoking_room },
  ];

  const missionCards = [
    // Bombing Runs
    { id: 'railway_bombardment', name: 'Railway Bombardment', type: 'bombing_run', range: 2, ceiling: 1, difficulty: 2, income: 6, vp: 1, special: null },
    { id: 'factory_strike', name: 'Factory Strike', type: 'bombing_run', range: 3, ceiling: 2, difficulty: 2, income: 8, vp: 2, special: null },
    { id: 'port_assault', name: 'Port Assault', type: 'bombing_run', range: 3, ceiling: 1, difficulty: 3, income: 8, vp: 2, special: null },
    { id: 'deep_strike_mission', name: 'Deep Strike Mission', type: 'bombing_run', range: 4, ceiling: 2, difficulty: 2, income: 10, vp: 3, special: 'bombing_equipment_bonus', specialBonus: { income: 2, description: '+£2 with Bombing Equipment' } },
    { id: 'strategic_bombardment', name: 'Strategic Bombardment', type: 'bombing_run', range: 4, ceiling: 2, difficulty: 3, income: 11, vp: 4, special: 'bombing_equipment_bonus', specialBonus: { income: 3, description: '+£3 with Bombing Equipment' } },
    { id: 'capital_raid', name: 'Capital Raid', type: 'bombing_run', range: 5, ceiling: 3, difficulty: 4, income: 14, vp: 5, special: null },
    // Reconnaissance
    { id: 'front_line_survey', name: 'Front Line Survey', type: 'reconnaissance', range: 2, speed: 1, difficulty: 1, income: 4, vp: 1, special: null },
    { id: 'artillery_spotting', name: 'Artillery Spotting', type: 'reconnaissance', range: 2, ceiling: 2, difficulty: 2, income: 5, vp: 1, special: null },
    { id: 'enemy_position_mapping', name: 'Enemy Position Mapping', type: 'reconnaissance', range: 3, speed: 2, difficulty: 2, income: 7, vp: 2, special: null },
    { id: 'strategic_photography', name: 'Strategic Photography', type: 'reconnaissance', range: 4, ceiling: 3, difficulty: 3, income: 9, vp: 3, special: 'radio_bonus', specialBonus: { vp: 1, description: '+1 VP with Radio Equipment' } },
    { id: 'deep_reconnaissance', name: 'Deep Reconnaissance', type: 'reconnaissance', range: 5, speed: 2, difficulty: 3, income: 10, vp: 4, special: null },
    // Resupply
    { id: 'field_hospital_supply', name: 'Field Hospital Supply', type: 'resupply', range: 2, difficulty: 1, income: 5, vp: 1, special: null },
    { id: 'ammunition_delivery', name: 'Ammunition Delivery', type: 'resupply', range: 3, difficulty: 2, income: 6, vp: 1, special: null },
    { id: 'forward_base_resupply', name: 'Forward Base Resupply', type: 'resupply', range: 3, difficulty: 2, income: 7, vp: 2, special: 'cargo_bonus', specialBonus: { income: 2, description: '+£2 with Cargo Nets' } },
    { id: 'emergency_provisions', name: 'Emergency Provisions', type: 'resupply', range: 4, speed: 2, difficulty: 3, income: 9, vp: 2, special: null },
    { id: 'siege_relief', name: 'Siege Relief', type: 'resupply', range: 5, difficulty: 4, income: 12, vp: 4, special: null },
    // Naval Patrols
    { id: 'coastal_patrol', name: 'Coastal Patrol', type: 'naval_patrol', range: 3, difficulty: 2, income: 6, vp: 1, special: null },
    { id: 'submarine_hunter', name: 'Submarine Hunter', type: 'naval_patrol', range: 4, ceiling: 1, difficulty: 3, income: 10, vp: 3, special: 'spotter_bonus', specialBonus: { vp: 1, description: '+1 VP with Observation Platform' } },
    // Artillery Observation
    { id: 'battery_direction', name: 'Battery Direction', type: 'artillery_observation', range: 2, ceiling: 2, difficulty: 2, income: 6, vp: 2, special: null },
    { id: 'long_range_observation', name: 'Long-Range Observation', type: 'artillery_observation', range: 4, ceiling: 3, difficulty: 3, income: 9, vp: 3, special: null },
  ];

  return { agentCards, hazardCards, techCards, missionCards, starterCards };
}

/**
 * Load all tech tiles for printing
 */
function loadTileData() {
  const tiles = [
    // === FACTION STARTER TILES ===
    // Germany starters
    { id: 'zeppelin_frame', name: 'Zeppelin Frame', slotType: 'frameSlots', weight: 2, hullCost: 1, stats: { gas_socket: 1 } },
    { id: 'maybach_cx', name: 'Maybach CX Engine', slotType: 'driveSlots', weight: 1, hullCost: 1, stats: { speed: 1 } },
    { id: 'premium_envelope', name: 'Premium Envelope', slotType: 'fabricSlots', weight: 1, hullCost: 3, stats: { reliability: 1, range: 1 } },
    { id: 'blaugas_tank', name: 'Blaugas Tank', slotType: 'componentSlots', weight: 0, hullCost: 1, stats: { range: 1 } },

    // Britain starters
    { id: 'tensioned_frame', name: 'Tensioned Frame', slotType: 'frameSlots', weight: 2, hullCost: 1, stats: { gas_socket: 1 } },
    { id: 'standard_engine', name: 'Standard Engine', slotType: 'driveSlots', weight: 1, hullCost: 1, stats: { speed: 1, range: 1 } },
    { id: 'doped_covering', name: 'Doped Covering', slotType: 'fabricSlots', weight: 1, hullCost: 1, stats: {} },
    { id: 'passenger_cabin', name: 'Passenger Cabin', slotType: 'componentSlots', weight: 1, hullCost: 1, stats: { income: 1 } },
    { id: 'imperial_mast', name: 'Imperial Mast', slotType: 'componentSlots', weight: 1, hullCost: 1, stats: {} },

    // USA starters
    { id: 'duralumin_frame', name: 'Duralumin Frame', slotType: 'frameSlots', weight: 2, hullCost: 1, stats: { gas_socket: 1 } },
    { id: 'reliable_engine', name: 'Reliable Engine', slotType: 'driveSlots', weight: 1, hullCost: 1, stats: { speed: 1, range: 1 } },
    { id: 'latex_envelope', name: 'Latex Envelope', slotType: 'fabricSlots', weight: 1, hullCost: 1, stats: {} },
    { id: 'helium_gas_cell', name: 'Helium Gas Cell', slotType: 'componentSlots', weight: 1, hullCost: 2, stats: {} },
    { id: 'sparrowhawk_hangar', name: 'Sparrowhawk Hangar', slotType: 'componentSlots', weight: 3, hullCost: 3, stats: {} },

    // Italy starters
    { id: 'semi_rigid_keel', name: 'Semi-Rigid Keel', slotType: 'frameSlots', weight: 2, hullCost: 1, stats: { reliability: 1, gas_socket: 1 } },
    { id: 'flexible_frame', name: 'Flexible Frame', slotType: 'frameSlots', weight: 0, hullCost: 1, stats: { lift: 1, gas_socket: 1 } },
    { id: 'expedition_engine', name: 'Expedition Engine', slotType: 'driveSlots', weight: 1, hullCost: 1, stats: { range: 1 } },
    { id: 'cotton_envelope', name: 'Cotton Envelope', slotType: 'fabricSlots', weight: 1, hullCost: 1, stats: {} },

    // === DRIVE TILES ===
    { id: 'basic_engine', name: 'Basic Engine', slotType: 'driveSlots', weight: 1, hullCost: 1, stats: { speed: 1, range: 1 } },
    { id: 'efficient_propeller', name: 'Efficient Propeller', slotType: 'driveSlots', weight: 1, hullCost: 2, stats: { speed: 1, range: 1 } },
    { id: 'twin_engine', name: 'Twin Engine', slotType: 'driveSlots', weight: 3, hullCost: 3, stats: { speed: 2, reliability: 1 } },
    { id: 'diesel_engine', name: 'Diesel Engine', slotType: 'driveSlots', weight: 2, hullCost: 3, stats: { range: 2, reliability: 1 } },
    { id: 'vectored_thrust', name: 'Vectored Thrust', slotType: 'driveSlots', weight: 2, hullCost: 2, stats: { speed: 1, ceiling: 1 } },
    { id: 'balanced_propulsion', name: 'Balanced Propulsion', slotType: 'driveSlots', weight: 2, hullCost: 3, stats: { speed: 2, reliability: 1 } },
    { id: 'aerodynamic_engine', name: 'Aerodynamic Engine', slotType: 'driveSlots', weight: 2, hullCost: 3, stats: { speed: 3 } },
    { id: 'high_altitude_engine', name: 'High-Altitude Engine', slotType: 'driveSlots', weight: 3, hullCost: 4, stats: { speed: 2, ceiling: 2 } },
    { id: 'hybrid_powerplant', name: 'Hybrid Powerplant', slotType: 'driveSlots', weight: 3, hullCost: 4, stats: { range: 3, reliability: 1 } },
    { id: 'adaptive_propeller', name: 'Adaptive Propeller', slotType: 'driveSlots', weight: 2, hullCost: 3, stats: { speed: 1, range: 2 } },

    // === FRAME TILES ===
    { id: 'wooden_frame', name: 'Wooden Frame', slotType: 'frameSlots', weight: 2, hullCost: 1, stats: { reliability: 1, gas_socket: 1 } },
    { id: 'steel_frame', name: 'Steel Frame', slotType: 'frameSlots', weight: 3, hullCost: 1, stats: { reliability: 2, gas_socket: 1 } },
    { id: 'geodetic_frame', name: 'Geodetic Frame', slotType: 'frameSlots', weight: 1, hullCost: 3, stats: { reliability: 2, ceiling: 1, gas_socket: 1 } },
    { id: 'modular_frame', name: 'Modular Frame', slotType: 'frameSlots', weight: 1, hullCost: 2, stats: { gas_socket: 1 } },
    { id: 'streamlined_hull', name: 'Streamlined Hull', slotType: 'frameSlots', weight: 1, hullCost: 2, stats: { lift: 2, gas_socket: 1 } },
    { id: 'aerodynamic_lift_system', name: 'Aerodynamic Lift System', slotType: 'frameSlots', weight: 2, hullCost: 3, stats: { lift: 4, gas_socket: 1 } },

    // === FABRIC TILES ===
    { id: 'fire_resistant_fabric', name: 'Fire-Resistant Fabric', slotType: 'fabricSlots', weight: 1, hullCost: 2, stats: { reliability: 1 } },
    { id: 'reflective_covering', name: 'Reflective Covering', slotType: 'fabricSlots', weight: 0, hullCost: 1, stats: { reliability: 1 } },
    { id: 'conductive_covering', name: 'Conductive Covering', slotType: 'fabricSlots', weight: 0, hullCost: 1, stats: { reliability: 1 } },
    { id: 'synthetic_envelope', name: 'Synthetic Envelope', slotType: 'fabricSlots', weight: 0, hullCost: 2, stats: { reliability: 1, range: 1 } },
    { id: 'advanced_fabric', name: 'Advanced Fabric', slotType: 'fabricSlots', weight: 0, hullCost: 2, stats: { reliability: 2 } },

    // === COMPONENT TILES (Gas Systems) ===
    { id: 'pressure_control', name: 'Pressure Control', slotType: 'componentSlots', weight: 1, hullCost: 1, stats: { ceiling: 1 } },
    { id: 'altitude_ballonets', name: 'Altitude Ballonets', slotType: 'componentSlots', weight: 1, hullCost: 1, stats: { ceiling: 1 } },
    { id: 'compartmented_gas', name: 'Compartmented Gas', slotType: 'componentSlots', weight: 1, hullCost: 2, stats: { lift: 2, reliability: 1 } },
    { id: 'smart_valving', name: 'Smart Valving', slotType: 'componentSlots', weight: 1, hullCost: 2, stats: { reliability: 1, ceiling: 1 } },
    { id: 'high_ceiling_gas', name: 'High-Ceiling Gas', slotType: 'componentSlots', weight: 2, hullCost: 3, stats: { lift: 3, ceiling: 2 } },
    { id: 'redundant_cells', name: 'Redundant Cells', slotType: 'componentSlots', weight: 2, hullCost: 3, stats: { lift: 4, reliability: 2 } },
    { id: 'rapid_descent_system', name: 'Rapid Descent System', slotType: 'componentSlots', weight: 1, hullCost: 2, stats: { reliability: 2 } },
    { id: 'reclamation_system', name: 'Reclamation System', slotType: 'componentSlots', weight: 1, hullCost: 3, stats: { range: 2 } },
    { id: 'exhaust_condensers', name: 'Exhaust Condensers', slotType: 'componentSlots', weight: 2, hullCost: 3, stats: {} },

    // === COMPONENT TILES (Payload) ===
    { id: 'spotter_gondola', name: 'Spotter Gondola', slotType: 'componentSlots', weight: 1, hullCost: 1, stats: { income: 1 } },
    { id: 'postal_service', name: 'Postal Service', slotType: 'componentSlots', weight: 1, hullCost: 1, stats: { income: 2 } },
    { id: 'external_cargo', name: 'External Cargo', slotType: 'componentSlots', weight: 2, hullCost: 1, stats: { income: 2 } },
    { id: 'passenger_gondola', name: 'Basic Cabin', slotType: 'componentSlots', weight: 2, hullCost: 2, stats: { income: 2, luxury: 1 } },
    { id: 'bombing_equipment', name: 'Bombing Equipment', slotType: 'componentSlots', weight: 3, hullCost: 2, stats: {} },
    { id: 'communications_suite', name: 'Communications Suite', slotType: 'componentSlots', weight: 1, hullCost: 2, stats: { reliability: 1 } },
    { id: 'light_armor_plating', name: 'Light Armor Plating', slotType: 'componentSlots', weight: 2, hullCost: 2, stats: { armor: 1 } },
    { id: 'heavy_armor_plating', name: 'Heavy Armor Plating', slotType: 'componentSlots', weight: 3, hullCost: 3, stats: { armor: 2 } },
    { id: 'luxury_cabin', name: 'Luxury Cabin', slotType: 'componentSlots', weight: 3, hullCost: 3, stats: { income: 3, luxury: 2 } },
    { id: 'restaurant', name: 'Restaurant', slotType: 'componentSlots', weight: 2, hullCost: 2, stats: { income: 2, luxury: 2 } },
    { id: 'observation_lounge', name: 'Observation Lounge', slotType: 'componentSlots', weight: 2, hullCost: 3, stats: { income: 1, luxury: 3 } },
    { id: 'sleeping_quarters', name: 'Private Berths', slotType: 'componentSlots', weight: 2, hullCost: 2, stats: { income: 2, luxury: 1 } },
    { id: 'pressurized_lounge', name: 'Pressurized Lounge', slotType: 'componentSlots', weight: 2, hullCost: 3, stats: { income: 1, luxury: 2 } },
    { id: 'navigation_suite', name: 'Navigation Suite', slotType: 'componentSlots', weight: 1, hullCost: 3, stats: { reliability: 2, range: 1 } },
  ];

  // Organize by slot type
  const tilesBySlot = {
    frameSlots: tiles.filter(t => t.slotType === 'frameSlots'),
    fabricSlots: tiles.filter(t => t.slotType === 'fabricSlots'),
    driveSlots: tiles.filter(t => t.slotType === 'driveSlots'),
    componentSlots: tiles.filter(t => t.slotType === 'componentSlots'),
  };

  return { tiles, tilesBySlot };
}

/**
 * Ensure output directories exist
 */
function ensureOutputDirs() {
  const dirs = [
    join(PATHS.output, 'cards', 'agent'),
    join(PATHS.output, 'cards', 'hazard'),
    join(PATHS.output, 'cards', 'tech'),
    join(PATHS.output, 'cards', 'mission'),
    join(PATHS.output, 'cards', 'starter'),
    join(PATHS.output, 'tiles', 'frame'),
    join(PATHS.output, 'tiles', 'fabric'),
    join(PATHS.output, 'tiles', 'drive'),
    join(PATHS.output, 'tiles', 'component'),
    join(PATHS.output, 'sheets'),
    join(PATHS.output, 'boards'),
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Generate cards of a specific type
 */
async function generateCards(browser, cards, templateFile, outputDir, cardTypeName) {
  console.log(`\nGenerating ${cards.length} ${cardTypeName} cards...`);

  const page = await browser.newPage();
  await page.setViewportSize({ width: CARD_WIDTH, height: CARD_HEIGHT });

  const templatePath = `file://${join(PATHS.templates, templateFile)}`;
  await page.goto(templatePath);

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const filename = card.name
      .toLowerCase()
      .replace(/['']/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    const outputPath = join(outputDir, `${filename}.png`);

    // Render the card
    await page.evaluate(
      ({ card, assetsPath }) => {
        window.renderCard(card, assetsPath);
      },
      { card, assetsPath: `file://${PATHS.webStatic}` }
    );

    // Wait for images to load
    await page.waitForTimeout(100);

    // Screenshot the card
    await page.screenshot({
      path: outputPath,
      type: 'png',
    });

    console.log(`  [${i + 1}/${cards.length}] ${card.name} -> ${filename}.png`);
  }

  await page.close();
  console.log(`Completed ${cardTypeName} cards.`);
}

/**
 * Generate print sheets (9 cards per letter page)
 */
async function generateSheets(browser) {
  console.log('\nGenerating print sheets...');

  const cardTypes = ['agent', 'hazard', 'tech', 'mission', 'starter'];
  const CARDS_PER_ROW = 3;
  const CARDS_PER_PAGE = 9;
  const PAGE_WIDTH = 2550;  // 8.5" at 300 DPI
  const PAGE_HEIGHT = 3300; // 11" at 300 DPI
  const MARGIN_X = 75;      // Horizontal margin (0.25")
  const MARGIN_TOP = 50;    // Top margin
  const GAP_Y = 25;         // Vertical gap between cards (minimal to fit 3 rows)

  // Filler cards for incomplete sheets (fill remaining slots with these cards)
  // Use { file, count } to limit how many fillers to add, or just filename to fill all blanks
  const fillerCards = {
    agent: 'the_aeronaut.png',  // Fill agent sheets with aeronaut cards
    starter: { file: 'rigger.png', count: 4 },  // Add 4 rigger cards to starter sheets
  };

  for (const cardType of cardTypes) {
    const cardDir = join(PATHS.output, 'cards', cardType);
    if (!existsSync(cardDir)) continue;

    const cardFiles = readdirSync(cardDir).filter(f => f.endsWith('.png'));
    if (cardFiles.length === 0) continue;

    const numPages = Math.ceil(cardFiles.length / CARDS_PER_PAGE);
    console.log(`  Creating ${numPages} sheet(s) for ${cardType} cards...`);

    const page = await browser.newPage();
    await page.setViewportSize({ width: PAGE_WIDTH, height: PAGE_HEIGHT });

    // Pre-load filler card if available for this type
    let fillerDataUrl = null;
    let fillerMaxCount = Infinity;  // Default: fill all blanks
    let fillerName = null;
    if (fillerCards[cardType]) {
      const fillerConfig = fillerCards[cardType];
      // Support both string format and { file, count } format
      const fillerFile = typeof fillerConfig === 'string' ? fillerConfig : fillerConfig.file;
      fillerMaxCount = typeof fillerConfig === 'object' && fillerConfig.count ? fillerConfig.count : Infinity;
      fillerName = fillerFile.replace('.png', '');
      const fillerPath = join(cardDir, fillerFile);
      if (existsSync(fillerPath)) {
        const fillerBuffer = readFileSync(fillerPath);
        const fillerBase64 = fillerBuffer.toString('base64');
        fillerDataUrl = `data:image/png;base64,${fillerBase64}`;
      }
    }

    for (let pageNum = 0; pageNum < numPages; pageNum++) {
      const startIdx = pageNum * CARDS_PER_PAGE;
      const pageCards = cardFiles.slice(startIdx, startIdx + CARDS_PER_PAGE);
      const isLastPage = pageNum === numPages - 1;
      const availableBlanks = CARDS_PER_PAGE - pageCards.length;
      const blanksToFill = isLastPage && fillerDataUrl ? Math.min(availableBlanks, fillerMaxCount) : 0;

      // Create sheet HTML with embedded base64 images
      let cardsHtml = '';
      const totalCards = pageCards.length + blanksToFill;

      for (let i = 0; i < totalCards; i++) {
        let dataUrl;
        if (i < pageCards.length) {
          // Regular card
          const cardFilePath = join(cardDir, pageCards[i]);
          const imageBuffer = readFileSync(cardFilePath);
          const base64Image = imageBuffer.toString('base64');
          dataUrl = `data:image/png;base64,${base64Image}`;
        } else {
          // Filler card (aeronaut)
          dataUrl = fillerDataUrl;
        }

        const row = Math.floor(i / CARDS_PER_ROW);
        const col = i % CARDS_PER_ROW;
        const x = MARGIN_X + col * (CARD_WIDTH + MARGIN_X);
        const y = MARGIN_TOP + row * (CARD_HEIGHT + GAP_Y);

        cardsHtml += `<img src="${dataUrl}" style="position:absolute;left:${x}px;top:${y}px;width:${CARD_WIDTH}px;height:${CARD_HEIGHT}px;">`;
      }

      const sheetHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 0; background: white; }
          </style>
        </head>
        <body>${cardsHtml}</body>
        </html>
      `;

      await page.setContent(sheetHtml);
      await page.waitForTimeout(200);

      const sheetPath = join(PATHS.output, 'sheets', `${cardType}-sheet-${pageNum + 1}.png`);
      await page.screenshot({ path: sheetPath, type: 'png' });

      if (blanksToFill > 0) {
        console.log(`    ${cardType}-sheet-${pageNum + 1}.png (${pageCards.length} cards + ${blanksToFill} ${fillerName} fillers)`);
      } else {
        console.log(`    ${cardType}-sheet-${pageNum + 1}.png (${pageCards.length} cards)`);
      }
    }

    await page.close();
  }

  console.log('Completed print sheets.');
}

/**
 * Generate tech tiles
 */
async function generateTiles(browser, tilesBySlot) {
  console.log('\nGenerating tech tiles...');

  const slotTypeToDir = {
    frameSlots: 'frame',
    fabricSlots: 'fabric',
    driveSlots: 'drive',
    componentSlots: 'component',
  };

  const page = await browser.newPage();
  await page.setViewportSize({ width: TILE_WIDTH, height: TILE_HEIGHT });

  const templatePath = `file://${join(PATHS.templates, 'tech-tile.html')}`;
  await page.goto(templatePath);

  let totalCount = 0;
  for (const [slotType, tiles] of Object.entries(tilesBySlot)) {
    const dirName = slotTypeToDir[slotType];
    const outputDir = join(PATHS.output, 'tiles', dirName);

    console.log(`  Generating ${tiles.length} ${dirName} tiles...`);

    for (const tile of tiles) {
      const filename = tile.id + '.png';
      const outputPath = join(outputDir, filename);

      await page.evaluate((tileData) => {
        window.renderTile(tileData);
      }, tile);

      await page.waitForTimeout(50);

      await page.screenshot({
        path: outputPath,
        type: 'png',
      });

      totalCount++;
    }
  }

  await page.close();
  console.log(`Completed ${totalCount} tech tiles.`);
}

/**
 * Generate tile print sheets (5x10 grid on letter paper)
 */
async function generateTileSheets(browser) {
  console.log('\nGenerating tile sheets...');

  const TILES_PER_ROW = 5;
  const TILES_PER_COL = 10;
  const TILES_PER_PAGE = TILES_PER_ROW * TILES_PER_COL;
  const PAGE_WIDTH = 2550;  // 8.5" at 300 DPI
  const PAGE_HEIGHT = 3300; // 11" at 300 DPI
  const MARGIN_X = 75;      // Left margin
  const MARGIN_TOP = 37;    // Top margin
  const GAP_X = 0;          // Horizontal gap
  const GAP_Y = 3;          // Vertical gap

  // Collect all tile files
  const tileTypes = ['frame', 'fabric', 'drive', 'component'];
  const allTileFiles = [];

  for (const tileType of tileTypes) {
    const tileDir = join(PATHS.output, 'tiles', tileType);
    if (!existsSync(tileDir)) continue;

    const files = readdirSync(tileDir).filter(f => f.endsWith('.png'));
    for (const file of files) {
      allTileFiles.push({ type: tileType, file, path: join(tileDir, file) });
    }
  }

  if (allTileFiles.length === 0) {
    console.log('  No tile files found. Generate tiles first.');
    return;
  }

  const numPages = Math.ceil(allTileFiles.length / TILES_PER_PAGE);
  console.log(`  Creating ${numPages} sheet(s) for ${allTileFiles.length} tiles...`);

  const page = await browser.newPage();
  await page.setViewportSize({ width: PAGE_WIDTH, height: PAGE_HEIGHT });

  for (let pageNum = 0; pageNum < numPages; pageNum++) {
    const startIdx = pageNum * TILES_PER_PAGE;
    const pageTiles = allTileFiles.slice(startIdx, startIdx + TILES_PER_PAGE);

    let tilesHtml = '';
    for (let i = 0; i < pageTiles.length; i++) {
      const tileInfo = pageTiles[i];
      const imageBuffer = readFileSync(tileInfo.path);
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64Image}`;

      const row = Math.floor(i / TILES_PER_ROW);
      const col = i % TILES_PER_ROW;
      const x = MARGIN_X + col * (TILE_WIDTH + GAP_X);
      const y = MARGIN_TOP + row * (TILE_HEIGHT + GAP_Y);

      tilesHtml += `<img src="${dataUrl}" style="position:absolute;left:${x}px;top:${y}px;width:${TILE_WIDTH}px;height:${TILE_HEIGHT}px;">`;
    }

    const sheetHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background: white; }
        </style>
      </head>
      <body>${tilesHtml}</body>
      </html>
    `;

    await page.setContent(sheetHtml);
    await page.waitForTimeout(200);

    const sheetPath = join(PATHS.output, 'sheets', `tile-sheet-${pageNum + 1}.png`);
    await page.screenshot({ path: sheetPath, type: 'png' });
    console.log(`    tile-sheet-${pageNum + 1}.png (${pageTiles.length} tiles)`);
  }

  await page.close();
  console.log('Completed tile sheets.');
}

/**
 * Generate the Action Board
 */
async function generateBoard(browser) {
  console.log('\nGenerating Action Board (8.5" x 11" at 300 DPI)...');

  const page = await browser.newPage();
  await page.setViewportSize({ width: BOARD_WIDTH, height: BOARD_HEIGHT });

  const templatePath = `file://${join(PATHS.templates, 'action-board.html')}`;
  await page.goto(templatePath);

  // Wait for content to render
  await page.waitForTimeout(500);

  const outputPath = join(PATHS.output, 'boards', 'action-board.png');
  await page.screenshot({
    path: outputPath,
    type: 'png',
  });

  console.log(`  Saved to: ${outputPath}`);

  // Generate Helium Board
  console.log('\nGenerating Helium Board (8.5" x 11" at 300 DPI - Portrait)...');
  const heliumPage = await browser.newPage();
  await heliumPage.setViewportSize({ width: BOARD_HEIGHT, height: BOARD_WIDTH }); // Portrait: swap width/height

  const heliumTemplatePath = `file://${join(PATHS.templates, 'helium-board.html')}`;
  await heliumPage.goto(heliumTemplatePath);
  await heliumPage.waitForTimeout(500);
  const heliumOutputPath = join(PATHS.output, 'boards', 'helium-board.png');
  await heliumPage.screenshot({
    path: heliumOutputPath,
    type: 'png',
  });
  console.log(`  Saved to: ${heliumOutputPath}`);
  await heliumPage.close();

  await page.close();
  console.log('Completed Boards.');
}

/**
 * Generate player boards for all factions
 */
async function generatePlayerBoards(browser) {
  console.log('\nGenerating Player Boards (11" x 8.5" at 300 DPI)...');
  console.log('  Creating 12 boards: 4 factions × 3 ages');

  const factions = ['germany', 'britain', 'usa', 'italy'];
  const ages = [1, 2, 3];

  const page = await browser.newPage();
  await page.setViewportSize({ width: PLAYER_BOARD_WIDTH, height: PLAYER_BOARD_HEIGHT });

  const templatePath = `file://${join(PATHS.templates, 'player-board.html')}`;
  await page.goto(templatePath);

  for (const faction of factions) {
    for (const age of ages) {
      // Render the board for this faction and age
      await page.evaluate(({ f, a }) => {
        window.renderBoard(f, a);
      }, { f: faction, a: age });

      // Wait for content to render
      await page.waitForTimeout(200);

      const outputPath = join(PATHS.output, 'boards', `player-board-${faction}-age${age}.png`);
      await page.screenshot({
        path: outputPath,
        type: 'png',
      });

      console.log(`  ${faction} Age ${age} -> player-board-${faction}-age${age}.png`);
    }
  }

  await page.close();
  console.log('Completed Player Boards (12 boards).');
}

/**
 * Generate player aid boards for all factions
 */
async function generatePlayerAidBoards(browser) {
  console.log('\nGenerating Player Aid Boards (11" x 8.5" at 300 DPI)...');
  console.log('  Creating 4 boards: 1 per faction');

  const factions = ['germany', 'britain', 'usa', 'italy'];

  const page = await browser.newPage();
  await page.setViewportSize({ width: PLAYER_BOARD_WIDTH, height: PLAYER_BOARD_HEIGHT });

  const templatePath = `file://${join(PATHS.templates, 'player-aid.html')}`;
  await page.goto(templatePath);

  for (const faction of factions) {
    // Render the board for this faction
    await page.evaluate((f) => {
      window.renderBoard(f);
    }, faction);

    // Wait for content to render
    await page.waitForTimeout(200);

    const outputPath = join(PATHS.output, 'boards', `player-aid-${faction}.png`);
    await page.screenshot({
      path: outputPath,
      type: 'png',
    });

    console.log(`  ${faction} -> player-aid-${faction}.png`);
  }

  await page.close();
  console.log('Completed Player Aid Boards (4 boards).');
}

/**
 * Main entry point
 */
async function main() {
  console.log('UP SHIP! Print Card Generator\n');
  console.log('Card size: 750x1050px (2.5" x 3.5" at 300 DPI)');
  console.log('Tile size: 450x285px (1.5" x 0.95" at 300 DPI)');
  console.log('Board size: 2550x3300px (8.5" x 11" at 300 DPI)');
  console.log('Output: ' + PATHS.output);

  ensureOutputDirs();

  const browser = await chromium.launch();

  try {
    if (sheetsOnly) {
      // Sheets only - regenerate from existing card/tile PNGs
      await generateSheets(browser);
      await generateTileSheets(browser);
    } else if (tilesOnly) {
      // Tiles only
      const { tilesBySlot } = loadTileData();
      await generateTiles(browser, tilesBySlot);
      await generateTileSheets(browser);
    } else if (boardsOnly) {
      // Boards only (action board + player boards + player aid boards)
      await generateBoard(browser);
      await generatePlayerBoards(browser);
      await generatePlayerAidBoards(browser);
    } else if (cardsOnly) {
      // Cards only (all card types + card sheets)
      const { agentCards, hazardCards, techCards, missionCards, starterCards } = await loadCardData();
      await generateCards(browser, agentCards, 'agent-card.html', join(PATHS.output, 'cards', 'agent'), 'Agent');
      await generateCards(browser, hazardCards, 'hazard-card.html', join(PATHS.output, 'cards', 'hazard'), 'Hazard');
      await generateCards(browser, techCards, 'tech-card.html', join(PATHS.output, 'cards', 'tech'), 'Tech');
      await generateCards(browser, missionCards, 'mission-card.html', join(PATHS.output, 'cards', 'mission'), 'Mission');
      await generateCards(browser, starterCards, 'agent-card.html', join(PATHS.output, 'cards', 'starter'), 'Starter');
      await generateSheets(browser);
    } else {
      // Specific type or everything
      const { agentCards, hazardCards, techCards, missionCards, starterCards } = await loadCardData();

      if (!cardType || cardType === 'agent') {
        await generateCards(
          browser,
          agentCards,
          'agent-card.html',
          join(PATHS.output, 'cards', 'agent'),
          'Agent'
        );
      }

      if (!cardType || cardType === 'hazard') {
        await generateCards(
          browser,
          hazardCards,
          'hazard-card.html',
          join(PATHS.output, 'cards', 'hazard'),
          'Hazard'
        );
      }

      if (!cardType || cardType === 'tech') {
        await generateCards(
          browser,
          techCards,
          'tech-card.html',
          join(PATHS.output, 'cards', 'tech'),
          'Tech'
        );
      }

      if (!cardType || cardType === 'mission') {
        await generateCards(
          browser,
          missionCards,
          'mission-card.html',
          join(PATHS.output, 'cards', 'mission'),
          'Mission'
        );
      }

      if (!cardType || cardType === 'starter') {
        await generateCards(
          browser,
          starterCards,
          'agent-card.html',
          join(PATHS.output, 'cards', 'starter'),
          'Starter'
        );
      }

      // Generate tiles
      if (!cardType || cardType === 'tile') {
        const { tilesBySlot } = loadTileData();
        await generateTiles(browser, tilesBySlot);
      }

      // Generate board
      if (!cardType || cardType === 'board') {
        await generateBoard(browser);
      }

      // Generate player boards (blueprint + aid boards)
      if (!cardType || cardType === 'playerboard') {
        await generatePlayerBoards(browser);
        await generatePlayerAidBoards(browser);
      }

      // Generate sheets after cards and tiles (only when generating everything)
      if (!cardType) {
        await generateSheets(browser);
        await generateTileSheets(browser);
      }
    }
  } finally {
    await browser.close();
  }

  console.log('\nGeneration complete!');
  console.log(`Individual cards: ${PATHS.output}/cards/`);
  console.log(`Individual tiles: ${PATHS.output}/tiles/`);
  console.log(`Boards: ${PATHS.output}/boards/`);
  console.log(`Player boards: ${PATHS.output}/boards/player-board-*.png (12 blueprint boards)`);
  console.log(`Player aid boards: ${PATHS.output}/boards/player-aid-*.png (4 aid boards)`);
  console.log(`Print sheets: ${PATHS.output}/sheets/`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
