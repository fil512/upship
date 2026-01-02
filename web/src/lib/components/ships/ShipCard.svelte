<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Ship } from '$lib/types/game';
	import Icon from '$lib/components/ui/Icon.svelte';

	export let ship: Ship;
	export let selectable: boolean = false;

	const dispatch = createEventDispatcher<{
		select: { ship: Ship };
	}>();

	const STATUS_LABELS: Record<string, string> = {
		hangar: 'In Hangar',
		awaiting_hazard: 'Hazard Check',
		on_route: 'On Route',
		crashed: 'Crashed'
	};

	const STATUS_COLORS: Record<string, string> = {
		hangar: 'var(--color-text-secondary)',
		awaiting_hazard: 'var(--color-warning)',
		on_route: 'var(--color-success)',
		crashed: 'var(--color-error)'
	};

	function handleClick() {
		if (selectable) {
			dispatch('select', { ship });
		}
	}
</script>

<button
	class="ship-card"
	class:selectable
	class:on-route={ship.status === 'on_route'}
	class:crashed={ship.status === 'crashed'}
	on:click={handleClick}
	disabled={!selectable}
>
	<div class="ship-header">
		<Icon name="ship" size={18} />
		<span class="ship-id">Ship #{ship.id.substring(0, 4)}</span>
	</div>

	<div class="ship-stats">
		<div class="stat" title="Lift - carrying capacity">
			<Icon name="lift" size={10} />
			<span class="value">{ship.lift}</span>
		</div>
		<div class="stat" title="Weight - total mass">
			<Icon name="weight" size={10} />
			<span class="value">{ship.weight}</span>
		</div>
		<div class="stat" title="Range - flight distance">
			<Icon name="range" size={10} />
			<span class="value">{ship.range}</span>
		</div>
		<div class="stat" title="Speed - travel rate">
			<Icon name="speed" size={10} />
			<span class="value">{ship.speed}</span>
		</div>
	</div>

	<div class="ship-status" style:color={STATUS_COLORS[ship.status]}>
		{STATUS_LABELS[ship.status] || ship.status}
	</div>

	{#if ship.routeId}
		<div class="route-info">
			<Icon name="route" size={10} />
			<span>{ship.routeId.substring(0, 8)}...</span>
		</div>
	{/if}

	{#if ship.gasType}
		<div class="gas-type" class:hydrogen={ship.gasType === 'hydrogen'} class:helium={ship.gasType === 'helium'}>
			<Icon name={ship.gasType} size={12} />
		</div>
	{/if}
</button>

<style>
	.ship-card {
		display: flex;
		flex-direction: column;
		padding: var(--spacing-sm);
		background: var(--color-bg-card);
		border: 2px solid var(--color-bg-hover);
		border-radius: var(--radius-md);
		min-width: 120px;
		cursor: default;
		transition: all var(--transition-fast);
		text-align: left;
	}

	.ship-card.selectable {
		cursor: pointer;
		border-color: var(--color-accent-gold);
	}

	.ship-card.selectable:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}

	.ship-card.on-route {
		border-color: var(--color-success);
	}

	.ship-card.crashed {
		opacity: 0.5;
		border-color: var(--color-error);
	}

	.ship-card:disabled {
		cursor: not-allowed;
	}

	.ship-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-xs);
	}

	.ship-id {
		font-size: 0.625rem;
		color: var(--color-text-secondary);
	}

	.ship-stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 2px;
		margin-bottom: var(--spacing-xs);
	}

	.stat {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 1px;
		padding: 2px;
		background: var(--color-bg-hover);
		border-radius: 2px;
	}

	.stat .value {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.ship-status {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.route-info {
		display: flex;
		align-items: center;
		gap: 2px;
		font-size: 0.5rem;
		color: var(--color-text-muted);
		margin-top: 2px;
	}

	.gas-type {
		position: absolute;
		top: var(--spacing-xs);
		right: var(--spacing-xs);
		padding: 2px 4px;
		border-radius: 2px;
		font-size: 0.625rem;
		font-weight: bold;
	}

	.gas-type.hydrogen {
		background: #e3f2fd;
		color: #1565c0;
	}

	.gas-type.helium {
		background: #fff3e0;
		color: #e65100;
	}
</style>
