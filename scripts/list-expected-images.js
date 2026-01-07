#!/usr/bin/env node
/**
 * List expected card image filenames based on actual code data.
 *
 * Usage:
 *   node scripts/list-expected-images.js agents   # List agent card images
 *   node scripts/list-expected-images.js techs    # List tech card images
 *   node scripts/list-expected-images.js all      # List all
 */

// Import the data (using require for CommonJS compatibility)
const path = require('path');

// Load market cards
const marketCardsPath = path.join(__dirname, '../server/data/marketCards.ts');
const upgradesPath = path.join(__dirname, '../server/data/upgrades.ts');

// Since we're loading TypeScript, we need to use ts-node or extract the data
// For simplicity, let's define the transformation function and hardcode the names
// that we extract from the TypeScript files

/**
 * Convert a card display name to its image filename (without extension)
 */
function getImageFilename(name) {
	return name
		.toLowerCase()
		.replace(/['']/g, '') // Remove apostrophes
		.replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
		.replace(/^_|_$/g, ''); // Trim leading/trailing underscores
}

// Starter card names from gameStateService.ts (createStarterDeck)
const STARTER_CARD_NAMES = [
	'Apprentice',
	'Mechanic',
	'Draftsman',
	'Rigger',
	'Purser',
	'Clerk',
	'Investor',
	'Researcher',
	'Helmsman',
	'Navigator' // Note: Also exists in MARKET_CARDS
];

// Agent card names from marketCards.ts (MARKET_CARDS + RESERVE_CARD)
const AGENT_CARD_NAMES = [
	// Technical Personnel
	'Chief Engineer',
	'Kite Jockey',
	'Navigator',
	'The Weatherman',
	'Gasbag Man',
	'Engine Room Mechanic',
	'The Scrutineer',
	'Rigger Chief',
	'Duralumin Man',
	'Blaugas Handler',
	// Political/Financial Personnel
	'The Nob',
	'Captain of Industry',
	'The Mandarin',
	'Merchant Prince',
	'Fleet Street Baron',
	'The Moneybags',
	"Lloyd's Man",
	'The Pen-Pusher',
	'Shop Steward',
	'The Exciseman',
	// Research Personnel
	'The Boffin',
	'Patent Clerk',
	'The Lab Coat',
	'The Archives',
	'Continental Expert',
	// Organizations
	'Royal Geographic Society',
	'Old Contemptible',
	"Cook's Man",
	'Aero Club',
	'Engineering Guild',
	// Reserve Card
	'The Aeronaut'
];

// Tech tile image filenames (from Appendix D Tech Tile names)
// These are the actual image filenames used; TechRow.svelte maps Tech Card names to these
// See: web/src/lib/utils/cardImages.ts TECH_CARD_TO_IMAGE mapping
const TECH_TILE_IMAGES = [
	// Drive tiles
	'basic_engine',
	'improved_propeller',
	'twin_engine',
	'maybach_cx_engine',
	'diesel_engine',
	'vectored_thrust',
	'balanced_propulsion',
	'aerodynamic_engine',
	'high_altitude_engine',
	'hybrid_powerplant',
	'adaptive_propeller',
	// Frame tiles
	'wooden_frame',
	'tensioned_frame',
	'duralumin_frame',
	'steel_frame',
	'semi_rigid_keel',
	'geodetic_frame',
	'modular_frame',
	'flexible_frame',
	'streamlined_hull',
	'aerodynamic_lift_system',
	// Fabric tiles
	'cotton_envelope',
	'doped_covering',
	'goldbeaters_skin',
	'fire_resistant_fabric',
	'reflective_covering',
	'conductive_covering',
	'synthetic_envelope',
	'advanced_fabric',
	// Gas System tiles
	'pressure_control',
	'altitude_ballonets',
	'compartmented_gas',
	'helium_gas_cell',
	'blaugas_tank',
	'automatic_valves',
	'high_ceiling_gas',
	'redundant_cells',
	'rapid_descent_system',
	'reclamation_system',
	'exhaust_condensers',
	// Payload tiles
	'spotter_gondola',
	'postal_service',
	'external_cargo',
	'basic_cabin',
	'passenger_cabin',
	'bombing_equipment',
	'sparrowhawk_hangar',
	'communications_suite',
	'light_armor_plating',
	'heavy_armor_plating',
	'luxury_cabin',
	'dining_saloon',
	'observation_lounge',
	'private_berths',
	'pressurized_lounge',
	'imperial_mast'
];

const mode = process.argv[2] || 'all';

if (mode === 'agents' || mode === 'all') {
	console.log('# Starter card images (from createStarterDeck)');
	STARTER_CARD_NAMES.forEach(name => {
		console.log(getImageFilename(name));
	});
	console.log('');
	console.log('# Agent card images (from MARKET_CARDS display names)');
	AGENT_CARD_NAMES.forEach(name => {
		console.log(getImageFilename(name));
	});
}

if (mode === 'all') {
	console.log('');
}

if (mode === 'techs' || mode === 'all') {
	console.log('# Tech tile images (from Appendix D)');
	TECH_TILE_IMAGES.forEach(filename => {
		console.log(filename);
	});
}
