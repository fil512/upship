<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { IconName } from '$lib/icons';
	import type { TechTile } from '$lib/data/techTiles';

	export let tile: TechTile;
	export let alreadyOwned: boolean = false;

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

	// Build array of icons to display (matching blueprint logic)
	function getIconsList(stats: Record<string, number>, weight: number): { type: string }[] {
		const icons: { type: string }[] = [];
		const order = ['gas_socket', 'lift', 'reliability', 'ceiling', 'range', 'speed', 'income', 'luxury', 'armor'];

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

	$: slotStyle = slotColors[tile.slotType] || { color: '#666', gradient: '#f5f3ee' };
	$: icons = getIconsList(tile.stats, tile.weight);
</script>

<div
	class="tile-box"
	class:already-owned={alreadyOwned}
	style="--slot-color: {slotStyle.color}; --slot-gradient: {slotStyle.gradient}"
	title="{tile.name}"
>
	{#if alreadyOwned}
		<div class="owned-overlay">Already Owned</div>
	{/if}
	<div class="cost-badge">{tile.hullCost || 1}</div>
	<div class="tile-icons">
		{#each icons as icon}
			<Icon name={icon.type as IconName} size={14} />
		{/each}
	</div>
	<span class="tile-name">{tile.name}</span>
</div>

<style>
	/* Tile box matching blueprint rendered size: ~108x68px (taller for text wrapping) */
	.tile-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		width: 108px;
		height: 68px;
		padding: 4px;
		background: var(--slot-gradient, #f5f3ee);
		border: 2px solid var(--slot-color);
		border-radius: 6px;
		position: relative;
		box-shadow:
			inset 0 1px 2px rgba(255, 255, 255, 0.5),
			inset 0 -1px 2px rgba(0, 0, 0, 0.08),
			0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.tile-box.already-owned {
		opacity: 0.5;
		filter: grayscale(50%);
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

	.owned-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.6rem;
		font-weight: bold;
		text-transform: uppercase;
		border-radius: 4px;
		z-index: 1;
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


	/* Name at bottom of tile - allows wrapping to 2 lines */
	.tile-name {
		font-size: 9px;
		font-weight: 800;
		color: var(--slot-color, #333);
		text-align: center;
		max-width: 100%;
		line-height: 1.2;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		word-break: break-word;
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
	}
</style>
