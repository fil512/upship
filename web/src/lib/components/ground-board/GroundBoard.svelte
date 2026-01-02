<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { gameState, myState } from '$lib/stores/gameState';
	import Location from './Location.svelte';
	import type { GroundBoardPlacements, PlayerState } from '$lib/types/game';

	export let placements: GroundBoardPlacements = {};
	export let players: Record<string, PlayerState> = {};
	export let selectedCardSymbol: string | null = null;
	export let isMyTurn: boolean = false;
	export let isWorkerPlacementPhase: boolean = false;

	const dispatch = createEventDispatcher<{
		placeAgent: { locationId: string };
	}>();

	// Location definitions matching server/data/groundBoard.js
	const locations = [
		// Wrench locations (technical)
		{
			id: 'design_bureau',
			name: 'Design Bureau',
			symbol: 'wrench' as const,
			description: 'Modify your Blueprint'
		},
		{
			id: 'construction_hall',
			name: 'Hangar',
			symbol: 'wrench' as const,
			description: 'Build ships'
		},
		{
			id: 'technical_institute',
			name: 'Technical Institute',
			symbol: 'wrench' as const,
			description: 'Upgrade engineer income'
		},
		{
			id: 'gas_depot',
			name: 'Gas Depot',
			symbol: 'wrench' as const,
			description: 'Purchase lifting gas'
		},

		// Propeller locations (operations)
		{
			id: 'research_institute',
			name: 'Research Institute',
			symbol: 'propeller' as const,
			description: 'Expand research level'
		},
		{
			id: 'launchpad',
			name: 'Launchpad',
			symbol: 'propeller' as const,
			description: 'Launch ships'
		},
		{
			id: 'ministry',
			name: 'Ministry',
			symbol: 'propeller' as const,
			description: 'Political maneuvering'
		},
		{
			id: 'weather_bureau',
			name: 'Weather Bureau',
			symbol: 'propeller' as const,
			description: 'Check weather forecasts'
		},

		// Coin locations (business)
		{
			id: 'academy',
			name: 'Academy',
			symbol: 'coin' as const,
			description: 'Recruit crew'
		},
		{
			id: 'flight_school',
			name: 'Flight School',
			symbol: 'coin' as const,
			description: 'Upgrade officer income'
		},
		{
			id: 'government_liaison',
			name: 'Government Liaison',
			symbol: 'coin' as const,
			description: 'Secure government backing'
		},
		{
			id: 'insurance_bureau',
			name: 'Insurance Bureau',
			symbol: 'coin' as const,
			description: 'Purchase insurance'
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
	$: canPlaceMap = (() => {
		const map: Record<string, boolean> = {};
		for (const loc of locations) {
			if (!isMyTurn || !isWorkerPlacementPhase || !selectedCardSymbol) {
				map[loc.id] = false;
			} else if (selectedCardSymbol === 'any') {
				map[loc.id] = true;
			} else {
				map[loc.id] = loc.symbol === selectedCardSymbol;
			}
		}
		return map;
	})();
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
