<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { gameState, myState } from '$lib/stores/gameState';
	import Location from './Location.svelte';
	import type { GroundBoardPlacements, PlayerState } from '$lib/types/game';
	import { calculateHullCost } from '$lib/utils/shipStats';

	export let placements: GroundBoardPlacements = {};
	export let players: Record<string, PlayerState> = {};
	export let selectedCardSymbol: string | null = null;
	export let isMyTurn: boolean = false;
	export let isWorkerPlacementPhase: boolean = false;
	export let heliumPrice: number = 2;

	const dispatch = createEventDispatcher<{
		placeAgent: { locationId: string };
	}>();

	// Location definitions matching server/data/groundBoard.ts
	const locations = [
		// Wrench locations (technical)
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
			id: 'technical_institute',
			name: 'Technical Institute',
			symbol: 'wrench' as const,
			description: '£6/level. Increase Engineer Income track (+1 engineer per round).'
		},
		{
			id: 'gas_depot',
			name: 'Gas Depot',
			symbol: 'wrench' as const,
			description: 'Buy gas cubes. Hydrogen £1 each. Helium at market price.'
		},

		// Propeller locations (operations)
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

		// Coin locations (business)
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

	// Calculate hull cost for construction_hall display
	$: playerHullCost = $myState?.blueprint ? calculateHullCost($myState.blueprint).total : 2;
</script>

<div class="ground-board">
	{#if isWorkerPlacementPhase}
		<div class="board-header">
			<span class="phase-badge">Worker Placement</span>
		</div>
	{/if}

	<div class="location-groups">
		<div class="location-group wrench-group">
			<div class="locations-grid">
				{#each wrenchLocations as loc}
					<Location
						{...loc}
						{placements}
						{players}
						canPlace={canPlaceMap[loc.id]}
						hullCost={loc.id === 'construction_hall' ? playerHullCost : undefined}
						heliumPrice={loc.id === 'gas_depot' ? heliumPrice : undefined}
						on:select={handleLocationSelect}
					/>
				{/each}
			</div>
		</div>

		<div class="location-group propeller-group">
			<div class="locations-grid">
				{#each propellerLocations as loc}
					<Location
						{...loc}
						{placements}
						{players}
						canPlace={canPlaceMap[loc.id]}
						on:select={handleLocationSelect}
					/>
				{/each}
			</div>
		</div>

		<div class="location-group coin-group">
			<div class="locations-grid">
				{#each coinLocations as loc}
					<Location
						{...loc}
						{placements}
						{players}
						canPlace={canPlaceMap[loc.id]}
						on:select={handleLocationSelect}
					/>
				{/each}
			</div>
		</div>
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

	.board-header h3 {
		font-size: 1rem;
		color: var(--color-accent-gold);
	}

	.phase-badge {
		padding: 2px 8px;
		background: var(--color-success);
		color: white;
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.location-groups {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.location-group {
		padding: var(--spacing-sm);
		border-radius: var(--radius-md);
		background: var(--color-bg-hover);
	}

	.wrench-group {
		border-left: 3px solid #4a9eff;
	}

	.propeller-group {
		border-left: 3px solid #888888;
	}

	.coin-group {
		border-left: 3px solid #ffc107;
	}

	.locations-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-sm);
	}

	@media (min-width: 1200px) {
		.locations-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}
</style>
