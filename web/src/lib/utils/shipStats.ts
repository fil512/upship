import type { Blueprint } from '$lib/types/game';
import { TECH_TILES } from '$lib/data/techTiles';

export interface HullCostData {
	total: number;
	base: number;
	frameCost: number;
	fabricCost: number;
}

/**
 * Calculate hull cost from installed Frame and Fabric tiles
 * Formula: £2 base + sum of Frame tile hullCosts + sum of Fabric tile hullCosts
 */
export function calculateHullCost(blueprint: Blueprint | null | undefined): HullCostData {
	const result: HullCostData = {
		total: 2,
		base: 2,
		frameCost: 0,
		fabricCost: 0
	};

	if (!blueprint) return result;

	// Sum frame tile hull costs
	for (const tileId of blueprint.frameSlots || []) {
		if (tileId) {
			const tile = TECH_TILES[tileId];
			if (tile?.hullCost) {
				result.frameCost += tile.hullCost;
			}
		}
	}

	// Sum fabric tile hull costs
	for (const tileId of blueprint.fabricSlots || []) {
		if (tileId) {
			const tile = TECH_TILES[tileId];
			if (tile?.hullCost) {
				result.fabricCost += tile.hullCost;
			}
		}
	}

	result.total = result.base + result.frameCost + result.fabricCost;
	return result;
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

	// Can launch if lift >= weight and required slots are filled
	const frameCount = (blueprint.frameSlots || []).filter(s => s).length;
	const fabricCount = (blueprint.fabricSlots || []).filter(s => s).length;
	stats.canLaunch = stats.lift >= stats.weight && frameCount >= 1 && fabricCount >= 1;

	return stats;
}
