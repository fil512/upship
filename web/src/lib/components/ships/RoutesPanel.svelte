<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Route } from '$lib/types/game';
	import RouteCard from './RouteCard.svelte';

	export let routes: Route[] = [];
	export let claimedRouteIds: string[] = [];
	export let selectable: boolean = false;

	const dispatch = createEventDispatcher<{
		selectRoute: { route: Route };
	}>();

	function handleRouteSelect(event: CustomEvent<{ route: Route }>) {
		dispatch('selectRoute', event.detail);
	}

	function isRouteClaimed(routeId: string): boolean {
		return claimedRouteIds.includes(routeId);
	}
</script>

<div class="routes-panel">
	<div class="routes-header">
		<h4>Available Routes</h4>
		<span class="route-count">{routes.length} routes</span>
	</div>

	{#if routes.length === 0}
		<div class="empty-routes">No routes available</div>
	{:else}
		<div class="routes-grid">
			{#each routes as route}
				<RouteCard
					{route}
					{selectable}
					claimed={isRouteClaimed(route.id)}
					on:select={handleRouteSelect}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.routes-panel {
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
	}

	.routes-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--spacing-sm);
	}

	.routes-header h4 {
		font-size: 0.875rem;
		color: var(--color-accent-gold);
	}

	.route-count {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.empty-routes {
		text-align: center;
		color: var(--color-text-muted);
		padding: var(--spacing-lg);
		font-size: 0.875rem;
	}

	.routes-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: var(--spacing-sm);
	}
</style>
