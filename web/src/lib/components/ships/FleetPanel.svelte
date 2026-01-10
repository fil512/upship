<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';

	// Ships are fungible tokens - we just track counts, not individual objects
	export let hangarShips: number = 0;
</script>

<div class="fleet-panel">
	<div class="fleet-header">
		<h4>Fleet</h4>
		<span class="ship-count">{hangarShips} {hangarShips === 1 ? 'ship' : 'ships'}</span>
	</div>

	{#if hangarShips === 0}
		<div class="empty-fleet">No ships built yet</div>
	{:else}
		<div class="ship-group">
			<div class="group-label">
				<Icon name="ship" size={14} />
				In Hangar ({hangarShips})
			</div>
			<div class="ship-tokens">
				{#each Array(hangarShips) as _, i}
					<div class="ship-token">
						<Icon name="ship" size={20} />
					</div>
				{/each}
			</div>
		</div>
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
		display: block;
		width: 100%;
		margin-bottom: var(--spacing-sm);
		padding: var(--spacing-sm);
		background: var(--color-bg-hover);
		border-radius: var(--radius-sm);
		border: 2px solid transparent;
		text-align: left;
	}

	.group-label {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: 0.625rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		margin-bottom: var(--spacing-xs);
	}

	.ship-tokens {
		display: flex;
		gap: var(--spacing-xs);
		flex-wrap: wrap;
	}

	.ship-token {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: var(--color-bg-card);
		border: 2px solid var(--color-text-secondary);
		border-radius: var(--radius-sm);
		color: var(--color-text-primary);
	}
</style>
