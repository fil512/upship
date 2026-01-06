<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { IconName } from '$lib/icons';
	import type { TechTile } from '$lib/data/techTiles';

	export let tile: TechTile;

	// Slot type colors matching AirshipBlueprint
	const slotColors: Record<string, string> = {
		frameSlots: '#3b82f6',
		fabricSlots: '#8b5cf6',
		driveSlots: '#f59e0b',
		componentSlots: '#10b981'
	};

	// Build array of icons to display (matching blueprint logic)
	function getIconsList(stats: Record<string, number>, weight: number): { type: string }[] {
		const icons: { type: string }[] = [];
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

	$: slotColor = slotColors[tile.slotType] || '#666';
	$: icons = getIconsList(tile.stats, tile.weight);
</script>

<div
	class="tile-box"
	style="--slot-color: {slotColor}"
	title="{tile.name}"
>
	<div class="tile-icons">
		{#each icons as icon}
			<Icon name={icon.type as IconName} size={14} />
		{/each}
	</div>
	<span class="tile-name">{tile.name}</span>
</div>

<style>
	/* Tile box matching blueprint rendered size: ~108x59px */
	.tile-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		width: 108px;
		height: 59px;
		padding: 4px;
		background: color-mix(in srgb, var(--slot-color) 20%, rgba(30, 41, 59, 0.9));
		border: 2px solid var(--slot-color);
		border-radius: 6px;
	}

	/* Icons area - centered horizontally */
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
</style>
