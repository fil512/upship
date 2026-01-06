<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { AvailableTilesBySlot } from '$lib/utils/techCardToTiles';
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { IconName } from '$lib/icons';

	export let tiles: AvailableTilesBySlot;
	export let selectedTileId: string | null = null;
	export let selectable: boolean = true;

	const dispatch = createEventDispatcher<{
		select: { tileId: string };
	}>();

	function handleTileClick(tileId: string) {
		if (!selectable) return;
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

	// Build array of icons to display (matching blueprint logic)
	interface IconInfo {
		type: string;
	}

	function getIconsList(stats: Record<string, number>, weight: number): IconInfo[] {
		const icons: IconInfo[] = [];
		const order = ['lift', 'reliability', 'ceiling', 'range', 'speed', 'income', 'luxury'];

		// Collect all stat icons
		for (const stat of order) {
			const count = stats[stat] || 0;
			for (let i = 0; i < count; i++) {
				icons.push({ type: stat });
			}
		}

		// Add weight icons
		for (let i = 0; i < weight; i++) {
			icons.push({ type: 'weight' });
		}

		return icons;
	}

	$: hasTiles = Object.values(tiles).some(arr => arr.length > 0);
</script>

<div class="tech-tiles-panel">
	<div class="panel-header">
		<h4>Your Tech Tiles</h4>
	</div>

	{#if hasTiles}
		<div class="tiles-container">
			{#each Object.entries(tiles) as [slotType, slotTiles]}
				{#if slotTiles.length > 0}
					<div class="slot-group">
						<div class="slot-header" style="--slot-color: {slotColors[slotType]}">
							{slotLabels[slotType]}
						</div>
						<div class="tile-grid">
							{#each slotTiles as tile (tile.id)}
								{@const icons = getIconsList(tile.stats, tile.weight)}
								<button
									class="tile-box"
									class:selected={selectedTileId === tile.id}
									class:selectable
									style="--slot-color: {slotColors[slotType]}"
									on:click={() => handleTileClick(tile.id)}
									disabled={!selectable}
								>
									<div class="tile-icons">
										{#each icons as icon}
											<Icon name={icon.type as IconName} size={14} />
										{/each}
									</div>
									<span class="tile-name">{tile.name}</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{:else}
		<p class="no-tiles">No tech tiles available. Acquire tech cards to unlock tiles.</p>
	{/if}
</div>

<style>
	.tech-tiles-panel {
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
	}

	.panel-header {
		margin-bottom: var(--spacing-sm);
	}

	.panel-header h4 {
		font-size: 0.875rem;
		color: var(--color-accent-gold);
		margin: 0;
	}

	.tiles-container {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.slot-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.slot-header {
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--slot-color);
		padding-left: var(--spacing-xs);
		border-left: 2px solid var(--slot-color);
	}

	/* 2-column grid layout for tiles */
	.tile-grid {
		display: grid;
		grid-template-columns: repeat(2, 100px);
		gap: 6px;
	}

	/* Tile box matching blueprint style: 100x54px */
	.tile-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		width: 100px;
		height: 54px;
		padding: 4px;
		background: color-mix(in srgb, var(--slot-color) 20%, rgba(30, 41, 59, 0.9));
		border: 2px solid var(--slot-color);
		border-radius: 6px;
		cursor: default;
		transition: all var(--transition-fast);
	}

	.tile-box.selectable {
		cursor: pointer;
	}

	.tile-box.selectable:hover {
		background: color-mix(in srgb, var(--slot-color) 30%, rgba(30, 41, 59, 0.9));
		box-shadow: 0 0 8px color-mix(in srgb, var(--slot-color) 40%, transparent);
	}

	.tile-box.selected {
		background: color-mix(in srgb, var(--slot-color) 40%, rgba(30, 41, 59, 0.9));
		box-shadow: 0 0 10px color-mix(in srgb, var(--slot-color) 60%, transparent);
		border-width: 3px;
	}

	/* Icons area - centered horizontally, takes up most of tile height */
	.tile-icons {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 2px;
		max-width: 100%;
		flex: 1;
	}

	/* Name at bottom of tile */
	.tile-name {
		font-size: 9px;
		font-weight: 600;
		color: var(--slot-color);
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
		line-height: 1;
	}

	.no-tiles {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		text-align: center;
		padding: var(--spacing-md);
		margin: 0;
	}
</style>
