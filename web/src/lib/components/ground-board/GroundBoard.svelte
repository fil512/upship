<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { gameState, myState } from '$lib/stores/gameState';
	import Location from './Location.svelte';
	import HeliumMarket from './HeliumMarket.svelte';
	import type { GroundBoardPlacements, PlayerState } from '$lib/types/game';
	import { calculateHullCost } from '$lib/utils/shipStats';
	import { symbolIcons } from '$lib/icons/symbols';

	export let placements: GroundBoardPlacements = {};
	export let players: Record<string, PlayerState> = {};
	export let selectedCardSymbol: string | null = null;
	export let isMyTurn: boolean = false;
	export let isWorkerPlacementPhase: boolean = false;
	export let heliumPrice: number = 2;
	export let heliumMarket: { cubes: number[]; prices: number[] } | null = null;

	const dispatch = createEventDispatcher<{
		placeAgent: { locationId: string };
	}>();

	// Location definitions matching server/data/groundBoard.ts
	// Organized by symbol type for column-based display
	const locations = [
		// Wrench locations (technical) - Column 1
		{
			id: 'blueprint_design',
			name: 'Blueprint Design',
			symbol: 'wrench' as const,
			description: 'Free. Install tech tiles you own into your blueprint slots.'
		},
		{
			id: 'construction_hall',
			name: 'Hangar',
			symbol: 'wrench' as const,
			description: 'Pay Hull Cost to build ships (max 3). Ships go to Launch Hangar.'
		},
		{
			id: 'gas_depot',
			name: 'Gas Depot',
			symbol: 'wrench' as const,
			description: 'Buy gas cubes. Hydrogen £1 each. Helium at market price.'
		},
		{
			id: 'technical_institute',
			name: 'Technical Institute',
			symbol: 'wrench' as const,
			description: '£6/level. Increase Engineer Income track (+1 engineer per round).'
		},
		{
			id: 'engineering_depot',
			name: 'Engineering Depot',
			symbol: 'wrench' as const,
			description: 'Free. Gain Engineers equal to your Engineer Income track.'
		},
		{
			id: 'repair',
			name: 'Repair',
			symbol: 'wrench' as const,
			description: 'Repair damaged ships. Cost: Hull Cost ÷ 2 + 1 Engineer per ship.'
		},

		// Propeller locations (operations) - Column 2
		{
			id: 'launchpad',
			name: 'Launchpad',
			symbol: 'propeller' as const,
			description: 'Launch ships to claim routes. Costs Officers (by Age) + Gas.'
		},
		{
			id: 'launchpad_2',
			name: 'Launchpad',
			symbol: 'propeller' as const,
			description: 'Launch ships to claim routes. Costs Officers (by Age) + Gas.'
		},
		{
			id: 'ministry',
			name: 'Ministry',
			symbol: 'propeller' as const,
			description: 'Draw 2 cards, keep 1. Take First Player token. Reduce He price by 1.'
		},
		{
			id: 'weather_bureau',
			name: 'Weather Bureau',
			symbol: 'propeller' as const,
			description: '£2. Peek at top of your hazard deck. Keep it or discard it.'
		},
		{
			id: 'personnel_office',
			name: 'Personnel Office',
			symbol: 'propeller' as const,
			description: 'Free. Gain Officers equal to your Officer Income track.'
		},

		// Coin locations (business) - Column 3
		{
			id: 'treasury',
			name: 'Treasury',
			symbol: 'coin' as const,
			description: 'Free. Gain Cash equal to your Income track.'
		},
		{
			id: 'research_institute',
			name: 'Research Institute',
			symbol: 'coin' as const,
			description: '£4/level. Increase Research Level (+1 research when revealing).'
		},
		{
			id: 'flight_school',
			name: 'Flight School',
			symbol: 'coin' as const,
			description: '£5/level. Increase Officer Income track (+1 officer per round).'
		},
		{
			id: 'government_liaison',
			name: 'Government Liaison',
			symbol: 'coin' as const,
			description: 'Spend 1-3 Officers to gain +1 Income per officer spent.'
		},
		{
			id: 'insurance_bureau',
			name: 'Insurance Bureau',
			symbol: 'coin' as const,
			description: '-1 Income/policy (max 3). Recover crashed ships instead of losing them.'
		}
	];

	function handleLocationSelect(event: CustomEvent<{ locationId: string }>) {
		dispatch('placeAgent', { locationId: event.detail.locationId });
	}

	// Group locations by symbol for visual organization
	$: wrenchLocations = locations.filter((l) => l.symbol === 'wrench');
	$: propellerLocations = locations.filter((l) => l.symbol === 'propeller');
	$: coinLocations = locations.filter((l) => l.symbol === 'coin');

	// Reactive map of which locations can be placed at
	// This MUST be reactive ($:) so it updates when selectedCardSymbol changes
	// Also check hasPassed - after revealing, players can't place more agents
	$: canPlaceMap = (() => {
		const map: Record<string, boolean> = {};
		const hasPassed = $myState?.hasPassed ?? false;
		for (const loc of locations) {
			if (!isMyTurn || !isWorkerPlacementPhase || !selectedCardSymbol || hasPassed) {
				map[loc.id] = false;
			} else if (selectedCardSymbol === 'any') {
				map[loc.id] = true;
			} else {
				map[loc.id] = loc.symbol === selectedCardSymbol;
			}
		}
		return map;
	})();

	// Calculate hull cost for construction_hall display (sum of tile costs)
	$: playerHullCost = $myState?.blueprint ? calculateHullCost($myState.blueprint) : 0;

	// Get current age for dynamic launchpad costs
	$: currentAge = $gameState?.age ?? 1;

	// Get income track values for engineering depot and personnel office
	$: engineerIncome = $myState?.engineerIncome ?? 1;
	$: officerIncome = $myState?.officerIncome ?? 1;
</script>

<div class="ground-board">
	{#if isWorkerPlacementPhase}
		<div class="board-header">
			<span class="phase-badge">Worker Placement</span>
		</div>
	{/if}

	<div class="location-columns">
		<!-- Column 1: Wrench (Technical) -->
		<div class="location-column wrench-column">
			<div class="column-header"><span class="column-icon">{@html symbolIcons.wrench.svg}</span> Technical</div>
			{#each wrenchLocations as loc}
				<Location
					{...loc}
					{placements}
					{players}
					canPlace={canPlaceMap[loc.id]}
					hullCost={loc.id === 'construction_hall' || loc.id === 'repair' ? playerHullCost : undefined}
					heliumPrice={loc.id === 'gas_depot' ? heliumPrice : undefined}
					age={currentAge}
					{engineerIncome}
					{officerIncome}
					on:select={handleLocationSelect}
				/>
			{/each}
		</div>

		<!-- Column 2: Propeller (Operations) -->
		<div class="location-column propeller-column">
			<div class="column-header"><span class="column-icon">{@html symbolIcons.propeller.svg}</span> Operations</div>
			{#each propellerLocations as loc}
				<Location
					{...loc}
					{placements}
					{players}
					canPlace={canPlaceMap[loc.id]}
					age={currentAge}
					{engineerIncome}
					{officerIncome}
					on:select={handleLocationSelect}
				/>
			{/each}
		</div>

		<!-- Column 3: Coin (Business) -->
		<div class="location-column coin-column">
			<div class="column-header"><span class="column-icon">{@html symbolIcons.coin.svg}</span> Business</div>
			{#each coinLocations as loc}
				<Location
					{...loc}
					{placements}
					{players}
					canPlace={canPlaceMap[loc.id]}
					age={currentAge}
					{engineerIncome}
					{officerIncome}
					on:select={handleLocationSelect}
				/>
			{/each}
		</div>

		<!-- Column 4: Helium Market -->
		{#if heliumMarket}
			<div class="market-column">
				<HeliumMarket
					cubes={heliumMarket.cubes}
					prices={heliumMarket.prices}
				/>
			</div>
		{/if}
	</div>
</div>

<style>
	.ground-board {
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
	}

	.board-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--spacing-md);
	}

	.phase-badge {
		padding: 2px 8px;
		background: var(--color-success);
		color: white;
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.location-columns {
		display: grid;
		grid-template-columns: repeat(3, 1fr) auto;
		gap: var(--spacing-md);
	}

	.location-column {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm);
		border-radius: var(--radius-md);
		background: var(--color-bg-hover);
	}

	.column-header {
		font-size: 0.85rem;
		font-weight: 600;
		padding-bottom: var(--spacing-xs);
		margin-bottom: var(--spacing-xs);
		border-bottom: 2px solid;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}

	.column-icon {
		display: inline-flex;
		width: 18px;
		height: 18px;
	}

	.column-icon :global(svg) {
		width: 100%;
		height: 100%;
	}

	.wrench-column {
		border-top: 3px solid #4a9eff;
	}
	.wrench-column .column-header {
		color: #4a9eff;
		border-color: #4a9eff;
	}

	.propeller-column {
		border-top: 3px solid #888888;
	}
	.propeller-column .column-header {
		color: #888888;
		border-color: #888888;
	}

	.coin-column {
		border-top: 3px solid #ffc107;
	}
	.coin-column .column-header {
		color: #ffc107;
		border-color: #ffc107;
	}

	.market-column {
		display: flex;
		align-items: flex-start;
	}

	/* Stack columns on narrow screens */
	@media (max-width: 900px) {
		.location-columns {
			grid-template-columns: 1fr;
		}

		.market-column {
			justify-content: center;
		}
	}
</style>
