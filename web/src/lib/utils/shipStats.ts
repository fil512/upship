import type { Blueprint } from '$lib/types/game';
import { TECH_TILES } from '$lib/data/techTiles';

/**
 * Calculate hull cost from ALL installed tech tiles
 * Formula: sum of hullCost from every installed tile
 */
export function calculateHullCost(blueprint: Blueprint | null | undefined): number {
	if (!blueprint) return 0;

	let total = 0;
	const allSlots: (keyof Pick<Blueprint, 'frameSlots' | 'fabricSlots' | 'driveSlots' | 'componentSlots'>)[] =
		['frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots'];

	for (const slotKey of allSlots) {
		for (const tileId of blueprint[slotKey] || []) {
			if (tileId) {
				const tile = TECH_TILES[tileId];
				if (tile?.hullCost) {
					total += tile.hullCost;
				}
			}
		}
	}

	return total;
}

export interface ShipStatsData {
	lift: number;
	weight: number;
	netLift: number;
	speed: number;
	range: number;
	ceiling: number;
	reliability: number;
	luxury: number;
	income: number;
	canLaunch: boolean;
}

/**
 * Calculate gas requirement (number of gas cubes needed to launch)
 * This equals the total number of gas_socket stats across all frame tiles
 */
export function calculateGasRequired(blueprint: Blueprint | null | undefined): number {
	if (!blueprint) return 0;

	let gasRequired = 0;
	for (const tileId of blueprint.frameSlots || []) {
		if (!tileId) continue;
		const tile = TECH_TILES[tileId];
		if (tile?.stats?.gas_socket) {
			gasRequired += tile.stats.gas_socket;
		}
	}
	return gasRequired;
}

/**
 * Calculate ship stats from installed tech tiles on the blueprint
 * This mirrors the server-side calculateShipStats in server/data/upgrades.ts
 */
export function calculateShipStats(blueprint: Blueprint | null | undefined, age = 3): ShipStatsData | null {
	if (!blueprint) return null;

	// Age baseline stats (simplified - Age 3 for now)
	const stats: ShipStatsData = {
		lift: 0,
		weight: 0,
		netLift: 0,
		speed: 0,
		range: 0,
		ceiling: 0,
		reliability: 0,
		luxury: 0,
		income: 0,
		canLaunch: false
	};

	// Sum stats from all installed tech tiles
	// Note: gas_socket on frame tiles provides +5 lift each
	const allSlots: (keyof Pick<Blueprint, 'frameSlots' | 'fabricSlots' | 'driveSlots' | 'componentSlots'>)[] =
		['frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots'];

	for (const slotKey of allSlots) {
		const slots = blueprint[slotKey] || [];
		for (const tileId of slots) {
			if (!tileId) continue;

			const tile = TECH_TILES[tileId];
			if (!tile) continue;

			// Add tech tile stats
			if (tile.stats) {
				stats.speed += tile.stats.speed || 0;
				stats.range += tile.stats.range || 0;
				stats.ceiling += tile.stats.ceiling || 0;
				stats.reliability += tile.stats.reliability || 0;
				stats.luxury += tile.stats.luxury || 0;
				stats.income += tile.stats.income || 0;
				stats.lift += tile.stats.lift || 0; // Some tiles provide bonus lift
				// Gas sockets on frame tiles provide +5 lift each
				stats.lift += (tile.stats.gas_socket || 0) * 5;
			}

			// Add weight
			stats.weight += tile.weight || 0;
		}
	}

	// Calculate net lift
	stats.netLift = stats.lift - stats.weight;

	// Can launch if:
	// - lift >= weight (net lift >= 0)
	// - all frame and fabric slots filled
	// - range >= 1 and speed >= 1 (minimum required to reach any destination)
	const frameCount = (blueprint.frameSlots || []).filter(s => s).length;
	const fabricCount = (blueprint.fabricSlots || []).filter(s => s).length;
	const frameFilled = frameCount === (blueprint.frameSlots || []).length;
	const fabricFilled = fabricCount === (blueprint.fabricSlots || []).length;
	stats.canLaunch = stats.lift >= stats.weight && frameFilled && fabricFilled && stats.range >= 1 && stats.speed >= 1;

	return stats;
}
