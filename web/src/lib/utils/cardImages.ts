/**
 * Card Image Filename Utilities
 *
 * Derives image filenames from card display names.
 * Images are stored in /cards/agent/ and /cards/tech/ directories.
 *
 * Examples:
 *   "Lloyd's Man" -> "lloyds_man"
 *   "Goldbeater's Skin" -> "goldbeaters_skin"
 *   "Maybach CX Engine" -> "maybach_cx_engine"
 */

/**
 * Convert a card display name to its image filename (without extension)
 * @param name - Card display name (e.g., "Lloyd's Man")
 * @returns Filename without extension (e.g., "lloyds_man")
 */
export function getImageFilename(name: string): string {
	return name
		.toLowerCase()
		.replace(/['']/g, '') // Remove apostrophes
		.replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
		.replace(/^_|_$/g, ''); // Trim leading/trailing underscores
}

/**
 * Tech Card name to Tech Tile image filename mapping.
 *
 * Tech Cards (displayed on R&D board) have different names than their
 * corresponding Tech Tiles (Appendix D). Images were created from Tech Tile
 * names, so we need this mapping for Tech Card display.
 *
 * Format: "Tech Card Name" -> "tech_tile_image_filename"
 */
const TECH_CARD_TO_IMAGE: Record<string, string> = {
	// Drive techs (Appendix C -> Appendix D)
	'Daimler Engine': 'basic_engine',
	'Daimler Petrol Engine': 'basic_engine',
	'Improved Propeller': 'improved_propeller', // Same name
	'Dual Engine Mount': 'twin_engine',
	'Maybach Engine': 'maybach_cx_engine',
	'Maybach Engine Design': 'maybach_cx_engine',
	'Diesel Powerplant': 'diesel_engine',
	'Swiveling Propeller': 'vectored_thrust',
	'Contra-Rotating Props': 'balanced_propulsion',
	'Streamlined Nacelle': 'aerodynamic_engine',
	'Supercharged Engine': 'high_altitude_engine',
	'Diesel-Electric Drive': 'hybrid_powerplant',
	'Variable-Pitch Propeller': 'adaptive_propeller',

	// Frame techs
	'Wooden Framework': 'wooden_frame',
	'Wire Bracing': 'tensioned_frame',
	'Duralumin Framework': 'duralumin_frame',
	'Steel Framework': 'steel_frame',
	'Internal Keel': 'semi_rigid_keel',
	'Geodetic Structure': 'geodetic_frame',
	'Modular Construction': 'modular_frame',
	'Articulated Keel Design': 'flexible_frame',
	'Aerodynamic Hull Design': 'streamlined_hull',
	'Dynamic Lift Surfaces': 'aerodynamic_lift_system',

	// Fabric techs
	'Rubberized Cotton': 'cotton_envelope',
	'Doped Canvas': 'doped_covering',
	"Goldbeater's Skin": 'goldbeaters_skin',
	'Fireproof Coating': 'fire_resistant_fabric',
	'Aluminum Doping': 'reflective_covering',
	'Grounding Systems': 'conductive_covering',
	'Gelatinized Latex': 'synthetic_envelope',
	'Composite Covering': 'advanced_fabric',

	// Gas System techs
	'Improved Valving': 'pressure_control',
	'Manual Ballonets': 'altitude_ballonets',
	'Multiple Gas Cells': 'compartmented_gas',
	'Helium Handling': 'helium_gas_cell',
	'Blaugas Fuel System': 'blaugas_tank',
	'Automatic Valves': 'automatic_valves', // Image uses tech card name
	'Pressure Altitude System': 'high_ceiling_gas',
	'Triple Gas Cell': 'redundant_cells',
	'Emergency Venting': 'rapid_descent_system',
	'Gas Recovery': 'reclamation_system',
	'Water Recovery System': 'exhaust_condensers',

	// Payload techs
	'Observation Platform': 'spotter_gondola',
	'Mail Compartment': 'postal_service',
	'Cargo Nets': 'external_cargo',
	'Passenger Gondola': 'basic_cabin',
	'Passenger Accommodation': 'passenger_cabin',
	'Bomb Bay Design': 'bombing_equipment',
	'Trapeze System': 'sparrowhawk_hangar',
	'Radio Equipment': 'communications_suite',
	'Armored Gondola': 'light_armor_plating',
	'Pressurized Cabin': 'pressurized_cabin_tech',
	'Reinforced Hull': 'heavy_armor_plating',
	'Luxury Accommodation': 'luxury_cabin',
	'Dining Saloon': 'dining_saloon', // Same name
	'Promenade Deck': 'observation_lounge',
	'Sleeping Quarters': 'private_berths',
	'Smoking Room': 'pressurized_lounge',
	'Imperial Mooring System': 'imperial_mast'
};

/**
 * Get the image filename for a tech card, using the mapping table.
 * Falls back to standard name conversion if not in mapping.
 * @param name - Tech Card display name (e.g., "Wooden Framework")
 * @returns Filename without extension (e.g., "wooden_frame")
 */
export function getTechCardImageFilename(name: string): string {
	// Check mapping first
	const mapped = TECH_CARD_TO_IMAGE[name];
	if (mapped) {
		return mapped;
	}
	// Fall back to standard conversion
	return getImageFilename(name);
}

/**
 * Get the full image path for an agent card
 * @param name - Card display name
 * @returns Full path (e.g., "/cards/agent/lloyds_man.png")
 */
export function getAgentImagePath(name: string): string {
	return `/cards/agent/${getImageFilename(name)}.png`;
}

/**
 * Get the full image path for a tech card
 * @param name - Card display name
 * @returns Full path (e.g., "/cards/tech/wooden_frame.png")
 */
export function getTechImagePath(name: string): string {
	return `/cards/tech/${getTechCardImageFilename(name)}.png`;
}

/**
 * Mission Card name to Mission image filename mapping.
 *
 * Mission images use a thematic naming convention (mission_type_description)
 * rather than the display name format.
 *
 * Format: "Mission Display Name" -> "mission_image_filename"
 */
const MISSION_CARD_TO_IMAGE: Record<string, string> = {
	// Bombing Runs
	'Railway Bombardment': 'mission_bombing_railway',
	'Factory Strike': 'mission_bombing_factory',
	'Port Assault': 'mission_bombing_port',
	'Deep Strike Mission': 'mission_bombing_deep_strike',
	'Strategic Bombardment': 'mission_bombing_strategic',
	'Capital Raid': 'mission_bombing_capital',

	// Reconnaissance
	'Front Line Survey': 'mission_recon_frontline',
	'Artillery Spotting': 'mission_recon_artillery',
	'Enemy Position Mapping': 'mission_recon_enemy_pos',
	'Strategic Photography': 'mission_recon_strategic_photo',
	'Deep Reconnaissance': 'mission_recon_deep',

	// Resupply Missions
	'Field Hospital Supply': 'mission_resupply_hospital',
	'Ammunition Delivery': 'mission_resupply_ammo',
	'Forward Base Resupply': 'mission_resupply_base',
	'Emergency Provisions': 'mission_resupply_emergency',
	'Siege Relief': 'mission_resupply_siege',

	// Naval Patrols
	'Coastal Patrol': 'mission_naval_coastal',
	'Submarine Hunter': 'mission_naval_sub_hunter',

	// Artillery Observation
	'Battery Direction': 'mission_artillery_battery',
	'Long-Range Observation': 'mission_artillery_longrange'
};

/**
 * Get the image filename for a mission card, using the mapping table.
 * Falls back to standard name conversion if not in mapping.
 * @param name - Mission Card display name (e.g., "Railway Bombardment")
 * @returns Filename without extension (e.g., "mission_bombing_railway")
 */
export function getMissionImageFilename(name: string): string {
	// Check mapping first
	const mapped = MISSION_CARD_TO_IMAGE[name];
	if (mapped) {
		return mapped;
	}
	// Fall back to standard conversion
	return getImageFilename(name);
}

/**
 * Get the full image path for a mission card
 * @param name - Card display name
 * @returns Full path (e.g., "/cards/mission/mission_bombing_railway.png")
 */
export function getMissionImagePath(name: string): string {
	return `/cards/mission/${getMissionImageFilename(name)}.png`;
}

/**
 * Get the image filename for a hazard card.
 * Hazard images use the pattern: hazard_<name_in_snake_case>
 * @param name - Hazard display name (e.g., "Engine Fire")
 * @returns Filename without extension (e.g., "hazard_engine_fire")
 */
export function getHazardImageFilename(name: string): string {
	return `hazard_${getImageFilename(name)}`;
}

/**
 * Get the full image path for a hazard card
 * @param name - Card display name
 * @returns Full path (e.g., "/cards/hazard/hazard_engine_fire.png")
 */
export function getHazardImagePath(name: string): string {
	return `/cards/hazard/${getHazardImageFilename(name)}.png`;
}
