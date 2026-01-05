<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { TechTile } from '$lib/data/techTiles';
	import type { AvailableTilesBySlot } from '$lib/utils/techCardToTiles';
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { IconName } from '$lib/icons';

	export let tiles: AvailableTilesBySlot;
	export let selectedTileId: string | null = null;

	const dispatch = createEventDispatcher<{
		select: { tileId: string };
	}>();

	function handleTileClick(tileId: string) {
		dispatch('select', { tileId });
	}

	// Slot type colors matching AirshipBlueprint
	const slotColors: Record<string, string> = {
		frameSlots: '#3b82f6',
		fabricSlots: '#8b5cf6',
		driveSlots: '#f59e0b',
		componentSlots: '#10b981'
	};

	const slotLabels: Record<string, string> = {
		frameSlots: 'Frame',
		fabricSlots: 'Fabric',
		driveSlots: 'Drive',
		componentSlots: 'Component'
	};

	// Helper to get weight display
	function getWeightDisplay(weight: number): string {
		if (weight < 0) return `${weight}`;
		if (weight > 0) return `+${weight}`;
		return '0';
	}
</script>

<div class="tech-tile-selector">
	<h4 class="selector-title">Available Tech Tiles</h4>
	<p class="selector-hint">Click a tile, then click a blueprint slot to place it</p>

	{#each Object.entries(tiles) as [slotType, slotTiles]}
		{#if slotTiles.length > 0}
			<div class="slot-group">
				<div class="slot-header" style="--slot-color: {slotColors[slotType]}">
					{slotLabels[slotType]}
				</div>
				<div class="tile-grid">
					{#each slotTiles as tile (tile.id)}
						<button
							class="tile-card"
							class:selected={selectedTileId === tile.id}
							style="--slot-color: {slotColors[slotType]}"
							on:click={() => handleTileClick(tile.id)}
						>
							<span class="tile-name">{tile.name}</span>
							<div class="tile-stats">
								<span class="weight" class:negative={tile.weight < 0} class:positive={tile.weight > 0}>
									<Icon name="weight" size={14} />
									{getWeightDisplay(tile.weight)}
								</span>
								{#each Object.entries(tile.stats) as [stat, value]}
									{#if value !== 0}
										<span class="stat">
											<Icon name={stat as IconName} size={14} />
											+{value}
										</span>
									{/if}
								{/each}
							</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{/each}

	{#if Object.values(tiles).every(arr => arr.length === 0)}
		<p class="no-tiles">No tech tiles available. Acquire tech cards to unlock tiles.</p>
	{/if}
</div>

<style>
	.tech-tile-selector {
		background: var(--color-bg-card);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
	}

	.selector-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-accent-gold);
		margin: 0 0 var(--spacing-xs) 0;
	}

	.selector-hint {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin: 0 0 var(--spacing-md) 0;
	}

	.slot-group {
		margin-bottom: var(--spacing-md);
	}

	.slot-header {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--slot-color);
		margin-bottom: var(--spacing-xs);
		padding-left: var(--spacing-xs);
		border-left: 3px solid var(--slot-color);
	}

	.tile-grid {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	.tile-card {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--color-bg-tertiary);
		border: 2px solid transparent;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
		text-align: left;
		min-width: 100px;
	}

	.tile-card:hover {
		border-color: var(--slot-color);
		background: color-mix(in srgb, var(--slot-color) 15%, var(--color-bg-tertiary));
	}

	.tile-card.selected {
		border-color: var(--slot-color);
		background: color-mix(in srgb, var(--slot-color) 25%, var(--color-bg-tertiary));
		box-shadow: 0 0 8px color-mix(in srgb, var(--slot-color) 50%, transparent);
	}

	.tile-name {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tile-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		align-items: center;
	}

	.weight, .stat {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		font-size: 0.65rem;
		color: var(--color-text-secondary);
	}

	.weight.negative {
		color: var(--color-success);
	}

	.weight.positive {
		color: var(--color-error);
	}

	.stat {
		color: var(--color-info);
	}

	.no-tiles {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		text-align: center;
		padding: var(--spacing-md);
	}
</style>
