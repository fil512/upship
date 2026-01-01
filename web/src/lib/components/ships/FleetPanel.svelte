<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Ship } from '$lib/types/game';
	import ShipCard from './ShipCard.svelte';

	export let ships: Ship[] = [];
	export let selectable: boolean = false;

	const dispatch = createEventDispatcher<{
		selectShip: { ship: Ship };
	}>();

	function handleShipSelect(event: CustomEvent<{ ship: Ship }>) {
		dispatch('selectShip', event.detail);
	}

	// Group ships by status
	$: hangarShips = ships.filter((s) => s.status === 'hangar');
	$: routeShips = ships.filter((s) => s.status === 'on_route');
	$: awaitingShips = ships.filter((s) => s.status === 'awaiting_hazard');
	$: crashedShips = ships.filter((s) => s.status === 'crashed');
</script>

<div class="fleet-panel">
	<div class="fleet-header">
		<h4>Fleet</h4>
		<span class="ship-count">{ships.length} {ships.length === 1 ? 'ship' : 'ships'}</span>
	</div>

	{#if ships.length === 0}
		<div class="empty-fleet">No ships built yet</div>
	{:else}
		{#if hangarShips.length > 0}
			<div class="ship-group">
				<div class="group-label">In Hangar ({hangarShips.length})</div>
				<div class="ships-row">
					{#each hangarShips as ship}
						<ShipCard {ship} {selectable} on:select={handleShipSelect} />
					{/each}
				</div>
			</div>
		{/if}

		{#if awaitingShips.length > 0}
			<div class="ship-group warning">
				<div class="group-label">Awaiting Hazard Check ({awaitingShips.length})</div>
				<div class="ships-row">
					{#each awaitingShips as ship}
						<ShipCard {ship} selectable={true} on:select={handleShipSelect} />
					{/each}
				</div>
			</div>
		{/if}

		{#if routeShips.length > 0}
			<div class="ship-group success">
				<div class="group-label">On Route ({routeShips.length})</div>
				<div class="ships-row">
					{#each routeShips as ship}
						<ShipCard {ship} selectable={false} on:select={handleShipSelect} />
					{/each}
				</div>
			</div>
		{/if}

		{#if crashedShips.length > 0}
			<div class="ship-group error">
				<div class="group-label">Crashed ({crashedShips.length})</div>
				<div class="ships-row">
					{#each crashedShips as ship}
						<ShipCard {ship} selectable={false} on:select={handleShipSelect} />
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.fleet-panel {
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
	}

	.fleet-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--spacing-sm);
	}

	.fleet-header h4 {
		font-size: 0.875rem;
		color: var(--color-accent-gold);
	}

	.ship-count {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.empty-fleet {
		text-align: center;
		color: var(--color-text-muted);
		padding: var(--spacing-lg);
		font-size: 0.875rem;
	}

	.ship-group {
		margin-bottom: var(--spacing-sm);
		padding: var(--spacing-xs);
		background: var(--color-bg-hover);
		border-radius: var(--radius-sm);
	}

	.ship-group.warning {
		border-left: 3px solid var(--color-warning);
	}

	.ship-group.success {
		border-left: 3px solid var(--color-success);
	}

	.ship-group.error {
		border-left: 3px solid var(--color-error);
	}

	.group-label {
		font-size: 0.625rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		margin-bottom: var(--spacing-xs);
	}

	.ships-row {
		display: flex;
		gap: var(--spacing-sm);
		overflow-x: auto;
		padding-bottom: var(--spacing-xs);
	}
</style>
