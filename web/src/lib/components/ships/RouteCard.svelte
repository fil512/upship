<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Route } from '$lib/types/game';
	import Icon from '$lib/components/ui/Icon.svelte';

	export let route: Route;
	export let selectable: boolean = false;
	export let claimed: boolean = false;

	const dispatch = createEventDispatcher<{
		select: { route: Route };
	}>();

	function handleClick() {
		if (selectable && !claimed) {
			dispatch('select', { route });
		}
	}
</script>

<button
	class="route-card"
	class:selectable={selectable && !claimed}
	class:claimed
	on:click={handleClick}
	disabled={!selectable || claimed}
>
	<div class="route-header">
		<Icon name="route" size={14} color="var(--color-text-muted)" />
		<span class="route-name">{route.name}</span>
		{#if claimed}
			<span class="claimed-badge">Claimed</span>
		{/if}
	</div>

	<div class="route-stats">
		<div class="stat" title="Range requirement">
			<Icon name="range" size={12} />
			<span class="value">{route.distance}</span>
		</div>
		<div class="stat" title="Speed requirement">
			<Icon name="speed" size={12} />
			<span class="value">{route.speedRequirement || 0}</span>
		</div>
		<div class="stat income" title="Income earned">
			<Icon name="income" size={12} />
			<span class="value">+{route.income}</span>
		</div>
	</div>

	{#if route.bonus}
		<div class="route-bonus">{route.bonus}</div>
	{/if}
</button>

<style>
	.route-card {
		display: flex;
		flex-direction: column;
		padding: var(--spacing-sm);
		background: var(--color-bg-card);
		border: 2px solid var(--color-bg-hover);
		border-radius: var(--radius-md);
		min-width: 140px;
		cursor: default;
		transition: all var(--transition-fast);
		text-align: left;
	}

	.route-card.selectable {
		cursor: pointer;
		border-color: var(--color-accent-gold);
	}

	.route-card.selectable:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}

	.route-card.claimed {
		opacity: 0.6;
		border-color: var(--color-success);
	}

	.route-card:disabled {
		cursor: not-allowed;
	}

	.route-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-xs);
	}

	.route-name {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.claimed-badge {
		font-size: 0.5rem;
		padding: 1px 4px;
		background: var(--color-success);
		color: white;
		border-radius: 2px;
		text-transform: uppercase;
	}

	.route-stats {
		display: flex;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-xs);
	}

	.stat {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 2px;
		padding: 3px 6px;
		background: var(--color-bg-hover);
		border-radius: 2px;
		flex: 1;
	}

	.stat .value {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.stat.income .value {
		color: var(--color-success);
	}

	.route-bonus {
		font-size: 0.5rem;
		color: var(--color-accent-gold);
		font-style: italic;
	}
</style>
