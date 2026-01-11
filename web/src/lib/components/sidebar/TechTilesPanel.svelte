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

	// Slot type colors - professional boardgame palette
	const slotColors: Record<string, { color: string; gradient: string }> = {
		frameSlots: {
			color: '#1d4ed8',
			gradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)'
		},
		fabricSlots: {
			color: '#7c3aed',
			gradient: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #c4b5fd 100%)'
		},
		driveSlots: {
			color: '#d97706',
			gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)'
		},
		componentSlots: {
			color: '#059669',
			gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)'
		}
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
		const order = ['gas_socket', 'lift', 'reliability', 'ceiling', 'range', 'speed', 'income', 'luxury'];

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
		<h4>Available Tech Tiles</h4>
	</div>

	{#if hasTiles}
		<div class="tiles-container">
			{#each Object.entries(tiles) as [slotType, slotTiles]}
				{#if slotTiles.length > 0}
					{@const slotStyle = slotColors[slotType] || { color: '#666', gradient: '#f5f3ee' }}
					<div class="slot-group">
						<div class="slot-header" style="--slot-color: {slotStyle.color}">
							{slotLabels[slotType]}
						</div>
						<div class="tile-grid">
							{#each slotTiles as tile (tile.id)}
								{@const icons = getIconsList(tile.stats, tile.weight)}
								<button
									class="tile-box"
									class:selected={selectedTileId === tile.id}
									class:selectable
									style="--slot-color: {slotStyle.color}; --slot-gradient: {slotStyle.gradient}"
									on:click={() => handleTileClick(tile.id)}
									disabled={!selectable}
								>
									<div class="cost-badge">{tile.hullCost || 1}</div>
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
		<p class="no-tiles">All tiles from your tech cards are installed. Acquire new tech cards to unlock more tiles.</p>
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
		grid-template-columns: repeat(2, 108px);
		gap: 6px;
	}

	/* Tile box matching blueprint rendered size: ~108x59px */
	.tile-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		width: 108px;
		height: 59px;
		padding: 4px;
		background: var(--slot-gradient, #f5f3ee);
		border: 2px solid var(--slot-color);
		border-radius: 6px;
		cursor: default;
		transition: all var(--transition-fast);
		position: relative;
		box-shadow:
			inset 0 1px 2px rgba(255, 255, 255, 0.5),
			inset 0 -1px 2px rgba(0, 0, 0, 0.08),
			0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.cost-badge {
		position: absolute;
		top: 3px;
		right: 3px;
		width: 18px;
		height: 18px;
		background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
		border: 1px solid #4b5563;
		border-radius: 50%;
		font-size: 10px;
		font-weight: 700;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.tile-box.selectable {
		cursor: pointer;
	}

	.tile-box.selectable:hover {
		box-shadow:
			inset 0 1px 2px rgba(255, 255, 255, 0.5),
			inset 0 -1px 2px rgba(0, 0, 0, 0.08),
			0 4px 12px rgba(0, 0, 0, 0.2);
		transform: translateY(-1px);
	}

	.tile-box.selected {
		box-shadow: 0 0 0 3px var(--slot-color), 0 4px 12px rgba(0, 0, 0, 0.2);
		border-width: 2px;
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
		font-weight: 800;
		color: var(--slot-color, #333);
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
		line-height: 1;
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
	}

	.no-tiles {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		text-align: center;
		padding: var(--spacing-md);
		margin: 0;
	}
</style>
