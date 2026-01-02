import type { Blueprint } from '$lib/types/game';

export interface ShipStatsData {
	lift: number;
	weight: number;
	netLift: number;
	speed: number;
	range: number;
	ceiling: number;
	reliability: number;
	luxury: number;
	canLaunch: boolean;
}

export function calculateShipStats(blueprint: Blueprint | null | undefined): ShipStatsData | null {
	if (!blueprint) return null;

	// Base stats
	let lift = 0;
	let weight = 0;
	let speed = 0;
	let range = 1;
	let ceiling = 0;
	let reliability = 0;
	let luxury = 0;

	// Frame provides structure (lift)
	blueprint.frameSlots.filter(Boolean).forEach(() => {
		lift += 2;
	});

	// Fabric provides envelope (lift)
	blueprint.fabricSlots.filter(Boolean).forEach(() => {
		lift += 1;
	});

	// Components add weight
	blueprint.componentSlots.filter(Boolean).forEach(() => {
		weight += 1;
	});

	// Drive provides range/speed
	blueprint.driveSlots.filter(Boolean).forEach(() => {
		range += 1;
		speed += 1;
	});

	return {
		lift,
		weight,
		netLift: lift - weight,
		speed,
		range,
		ceiling,
		reliability,
		luxury,
		canLaunch: lift > weight
	};
}
