import type { Blueprint } from '$lib/types/game';
import { TECH_TILES } from '$lib/data/techTiles';

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

	// Calculate lift from gas cubes (each cube = +5 lift)
	const gasSockets = blueprint.gasSockets || [];
	for (const cube of gasSockets) {
		if (cube === 'hydrogen' || cube === 'helium') {
			stats.lift += 5;
		}
	}

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
			if (tile.stats) {
				stats.speed += tile.stats.speed || 0;
				stats.range += tile.stats.range || 0;
				stats.ceiling += tile.stats.ceiling || 0;
				stats.reliability += tile.stats.reliability || 0;
				stats.luxury += tile.stats.luxury || 0;
				stats.income += tile.stats.income || 0;
				stats.lift += tile.stats.lift || 0; // Some tiles provide lift (aerodynamic hull)
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
