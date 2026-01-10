#!/usr/bin/env node
/**
 * Card Generation Script for UP SHIP! Print Edition
 *
 * Generates print-ready card images (750x1050px at 300 DPI = 2.5" x 3.5")
 * using Playwright to render HTML templates.
 *
 * Usage:
 *   npm run generate           # Generate all cards
 *   npm run generate:agent     # Generate only agent cards
 *   npm run generate:hazard    # Generate only hazard cards
 *   npm run generate:tech      # Generate only tech cards
 *   npm run generate:mission   # Generate only mission cards
 *   npm run generate:sheets    # Generate print sheets from existing cards
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

// Parse command line arguments
const args = process.argv.slice(2);
const typeArg = args.find(a => a.startsWith('--type='));
const cardType = typeArg ? typeArg.split('=')[1] : null;
const sheetsOnly = args.includes('--sheets-only');

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
    { id: 'reserve_aeronaut', name: 'The Aeronaut', category: 'organizations', cost: 2, symbol: 'any', effect: null, reveal: { influence: 1 } },
  ];

  const hazardCards = [
    // Clear Weather (4)
    { id: 'clear_weather_0', name: 'Clear Skies', category: 'clear', autoPass: true, difficulty: 0, flak: 0 },
    { id: 'clear_weather_1', name: 'Favorable Winds', category: 'clear', autoPass: true, difficulty: 0, flak: 0 },
    { id: 'clear_weather_2', name: 'Calm Conditions', category: 'clear', autoPass: true, difficulty: 0, flak: 0 },
    { id: 'clear_weather_3', name: 'Perfect Visibility', category: 'clear', autoPass: true, difficulty: 0, flak: 0 },
    // Minor Hazards (8)
    { id: 'minor_speed_0', name: 'Light Turbulence', category: 'minor', challengeType: 'speed', difficulty: 2, flak: 0 },
    { id: 'minor_reliability_1', name: 'Minor Engine Trouble', category: 'minor', challengeType: 'reliability', difficulty: 1, flak: 1 },
    { id: 'minor_speed_2', name: 'Crosswind', category: 'minor', challengeType: 'speed', difficulty: 3, flak: 0 },
    { id: 'minor_reliability_3', name: 'Gas Leak', category: 'minor', challengeType: 'reliability', difficulty: 2, flak: 1 },
    { id: 'minor_ceiling_4', name: 'Low Visibility', category: 'minor', challengeType: 'ceiling', difficulty: 2, flak: 1 },
    { id: 'minor_range_5', name: 'Fuel Concern', category: 'minor', challengeType: 'range', difficulty: 2, flak: 0 },
    { id: 'minor_speed_6', name: 'Headwind', category: 'minor', challengeType: 'speed', difficulty: 3, flak: 1 },
    { id: 'minor_reliability_7', name: 'Structural Stress', category: 'minor', challengeType: 'reliability', difficulty: 2, flak: 2 },
    // Major Hazards (8)
    { id: 'major_speed_0', name: 'Strong Headwind', category: 'major', challengeType: 'speed', difficulty: 4, flak: 2 },
    { id: 'major_ceiling_1', name: 'Icing Conditions', category: 'major', challengeType: 'ceiling', difficulty: 3, flak: 2 },
    { id: 'major_reliability_2', name: 'Engine Failure', category: 'major', challengeType: 'reliability', difficulty: 3, flak: 3 },
    { id: 'major_speed_3', name: 'Storm System', category: 'major', challengeType: 'speed', difficulty: 4, flak: 3 },
    { id: 'major_reliability_4', name: 'Structural Damage', category: 'major', challengeType: 'reliability', difficulty: 3, flak: 4 },
    { id: 'major_range_5', name: 'Navigation Error', category: 'major', challengeType: 'range', difficulty: 3, flak: 3 },
    { id: 'major_reliability_6', name: 'Squall Line', category: 'major', challengeType: 'reliability', difficulty: 4, flak: 3 },
    { id: 'major_ceiling_7', name: 'Severe Icing', category: 'major', challengeType: 'ceiling', difficulty: 2, flak: 2 },
    // Fire Hazards (6)
    { id: 'engine_fire_0', name: 'Engine Fire', category: 'fire', engineerCost: 1, difficulty: 0, flak: 2 },
    { id: 'engine_fire_1', name: 'Engine Fire', category: 'fire', engineerCost: 1, difficulty: 0, flak: 2 },
    { id: 'gas_cell_rupture_0', name: 'Gas Cell Rupture', category: 'fire', engineerCost: 2, difficulty: 0, flak: 3 },
    { id: 'gas_cell_rupture_1', name: 'Gas Cell Rupture', category: 'fire', engineerCost: 2, difficulty: 0, flak: 3 },
    { id: 'static_discharge_0', name: 'Static Discharge', category: 'fire', challengeType: 'reliability', difficulty: 2, flak: 4 },
    { id: 'catastrophic_explosion_0', name: 'Catastrophic Explosion', category: 'fire', difficulty: 99, flak: 5 },
    // Mechanical Hazard (1)
    { id: 'critical_structural_stress_0', name: 'Critical Structural Stress', category: 'mechanical', engineerCost: 2, difficulty: 0, flak: 4 },
  ];

  const techCards = [
    // Drive techs
    { id: 'daimler_engine', name: 'Daimler Engine', type: 'drive', cost: 3, age: 1 },
    { id: 'improved_propeller', name: 'Improved Propeller', type: 'drive', cost: 4, age: 1 },
    { id: 'dual_engine_mount', name: 'Dual Engine Mount', type: 'drive', cost: 5, age: 2 },
    { id: 'diesel_powerplant', name: 'Diesel Powerplant', type: 'drive', cost: 6, age: 2 },
    { id: 'swiveling_propeller', name: 'Swiveling Propeller', type: 'drive', cost: 5, age: 2 },
    { id: 'contra_rotating', name: 'Contra-Rotating Props', type: 'drive', cost: 6, age: 2 },
    { id: 'streamlined_nacelle', name: 'Streamlined Nacelle', type: 'drive', cost: 6, age: 3 },
    { id: 'supercharged_engine', name: 'Supercharged Engine', type: 'drive', cost: 7, age: 3 },
    { id: 'diesel_electric', name: 'Diesel-Electric Drive', type: 'drive', cost: 7, age: 3 },
    { id: 'variable_pitch', name: 'Variable-Pitch Propeller', type: 'drive', cost: 6, age: 3 },
    // Frame techs
    { id: 'wooden_framework', name: 'Wooden Framework', type: 'structure', cost: 3, age: 1 },
    { id: 'steel_framework', name: 'Steel Framework', type: 'structure', cost: 5, age: 2 },
    { id: 'geodetic_structure', name: 'Geodetic Structure', type: 'structure', cost: 7, age: 3 },
    // Fabric techs
    { id: 'fireproof_coating', name: 'Fireproof Coating', type: 'fabric', cost: 4, age: 2 },
    { id: 'aluminum_doping', name: 'Aluminum Doping', type: 'fabric', cost: 5, age: 2 },
    { id: 'grounding_systems', name: 'Grounding Systems', type: 'fabric', cost: 5, age: 2 },
    { id: 'gelatinized_latex', name: 'Gelatinized Latex', type: 'fabric', cost: 6, age: 3 },
    { id: 'composite_covering', name: 'Composite Covering', type: 'fabric', cost: 7, age: 3 },
    // Gas System techs
    { id: 'improved_valving', name: 'Improved Valving', type: 'gas', cost: 3, age: 1 },
    { id: 'manual_ballonets', name: 'Manual Ballonets', type: 'gas', cost: 4, age: 1 },
    { id: 'multiple_gas_cells', name: 'Multiple Gas Cells', type: 'gas', cost: 5, age: 2 },
    { id: 'automatic_valves', name: 'Automatic Valves', type: 'gas', cost: 5, age: 2 },
    { id: 'pressure_altitude', name: 'Pressure Altitude System', type: 'gas', cost: 6, age: 3 },
    { id: 'triple_gas_cell', name: 'Triple Gas Cell', type: 'gas', cost: 6, age: 3 },
    { id: 'emergency_venting', name: 'Emergency Venting', type: 'gas', cost: 5, age: 3 },
    { id: 'gas_recovery', name: 'Gas Recovery', type: 'gas', cost: 6, age: 3 },
    { id: 'water_recovery', name: 'Water Recovery System', type: 'gas', cost: 7, age: 3 },
    // Component techs
    { id: 'observation_platform', name: 'Observation Platform', type: 'component', cost: 2, age: 1 },
    { id: 'mail_compartment', name: 'Mail Compartment', type: 'component', cost: 3, age: 1 },
    { id: 'cargo_nets', name: 'Cargo Nets', type: 'component', cost: 3, age: 1 },
    { id: 'passenger_gondola', name: 'Passenger Gondola', type: 'component', cost: 4, age: 1 },
    { id: 'bomb_bay_design', name: 'Bomb Bay Design', type: 'component', cost: 4, age: 2 },
    { id: 'trapeze_system', name: 'Trapeze System', type: 'component', cost: 5, age: 2 },
    { id: 'radio_equipment', name: 'Radio Equipment', type: 'component', cost: 4, age: 2 },
    { id: 'armored_gondola', name: 'Armored Gondola', type: 'component', cost: 5, age: 2 },
    { id: 'reinforced_hull', name: 'Reinforced Hull', type: 'component', cost: 6, age: 3 },
    { id: 'luxury_accommodation', name: 'Luxury Accommodation', type: 'component', cost: 5, age: 2 },
    { id: 'dining_saloon', name: 'Dining Saloon', type: 'component', cost: 4, age: 2 },
    { id: 'promenade_deck', name: 'Promenade Deck', type: 'component', cost: 6, age: 3 },
    { id: 'sleeping_quarters', name: 'Sleeping Quarters', type: 'component', cost: 5, age: 3 },
    { id: 'smoking_room', name: 'Smoking Room', type: 'component', cost: 7, age: 3 },
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

  return { agentCards, hazardCards, techCards, missionCards };
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
    join(PATHS.output, 'sheets'),
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

  const cardTypes = ['agent', 'hazard', 'tech', 'mission'];
  const CARDS_PER_ROW = 3;
  const CARDS_PER_PAGE = 9;
  const PAGE_WIDTH = 2550;  // 8.5" at 300 DPI
  const PAGE_HEIGHT = 3300; // 11" at 300 DPI
  const MARGIN_X = 75;      // Horizontal margin (0.25")
  const MARGIN_TOP = 50;    // Top margin
  const GAP_Y = 25;         // Vertical gap between cards (minimal to fit 3 rows)

  for (const cardType of cardTypes) {
    const cardDir = join(PATHS.output, 'cards', cardType);
    if (!existsSync(cardDir)) continue;

    const cardFiles = readdirSync(cardDir).filter(f => f.endsWith('.png'));
    if (cardFiles.length === 0) continue;

    const numPages = Math.ceil(cardFiles.length / CARDS_PER_PAGE);
    console.log(`  Creating ${numPages} sheet(s) for ${cardType} cards...`);

    const page = await browser.newPage();
    await page.setViewportSize({ width: PAGE_WIDTH, height: PAGE_HEIGHT });

    for (let pageNum = 0; pageNum < numPages; pageNum++) {
      const startIdx = pageNum * CARDS_PER_PAGE;
      const pageCards = cardFiles.slice(startIdx, startIdx + CARDS_PER_PAGE);

      // Create sheet HTML with embedded base64 images
      let cardsHtml = '';
      for (let i = 0; i < pageCards.length; i++) {
        const cardFilePath = join(cardDir, pageCards[i]);
        // Read image and convert to base64 data URL
        const imageBuffer = readFileSync(cardFilePath);
        const base64Image = imageBuffer.toString('base64');
        const dataUrl = `data:image/png;base64,${base64Image}`;

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
      console.log(`    ${cardType}-sheet-${pageNum + 1}.png (${pageCards.length} cards)`);
    }

    await page.close();
  }

  console.log('Completed print sheets.');
}

/**
 * Main entry point
 */
async function main() {
  console.log('UP SHIP! Print Card Generator\n');
  console.log('Card size: 750x1050px (2.5" x 3.5" at 300 DPI)');
  console.log('Output: ' + PATHS.output);

  ensureOutputDirs();

  const browser = await chromium.launch();

  try {
    if (sheetsOnly) {
      await generateSheets(browser);
    } else {
      const { agentCards, hazardCards, techCards, missionCards } = await loadCardData();

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

      // Generate sheets after cards
      await generateSheets(browser);
    }
  } finally {
    await browser.close();
  }

  console.log('\nGeneration complete!');
  console.log(`Individual cards: ${PATHS.output}/cards/`);
  console.log(`Print sheets: ${PATHS.output}/sheets/`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
