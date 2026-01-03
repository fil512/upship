<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import CostBadge from '$lib/components/ui/CostBadge.svelte';
	import { getTilesForCard, formatStats, getSlotTypeLabel } from '$lib/utils/techCardToTiles';

	export let tech: {
		id: string;
		name: string;
		effect?: string;
		researchCost?: number;
	};
	export let selected: boolean = false;
	export let selectable: boolean = false;
	export let showTiles: boolean = true;
	export let compact: boolean = false;
	export let fullWidth: boolean = false;

	const dispatch = createEventDispatcher<{
		select: { tech: typeof tech };
	}>();

	// Get tech tiles provided by this card
	$: tiles = showTiles ? getTilesForCard(tech.id) : [];

	function handleClick() {
		if (selectable) {
			dispatch('select', { tech });
		}
	}
</script>

{#if compact}
	<!-- Compact mode: small card for track display -->
	<div class="tech-card-mini" title={tech.name}>
		<span class="mini-name">{tech.name}</span>
	</div>
{:else}
	<button
		class="tech-card"
		class:selected
		class:selectable
		class:full-width={fullWidth}
		on:click={handleClick}
		disabled={!selectable}
	>
		<!-- Header: Name (left) + Research Cost (right) -->
		<div class="tech-header">
			<span class="tech-name">{tech.name}</span>
			{#if tech.researchCost}
				<div class="tech-cost" title="Costs {tech.researchCost} Research">
					<CostBadge type="research" value={tech.researchCost} size={24} />
				</div>
			{/if}
		</div>

		<!-- Effect description -->
		{#if tech.effect}
			<div class="tech-effect">{tech.effect}</div>
		{/if}

		<!-- Tech tiles this card provides -->
		{#if tiles.length > 0}
			<div class="tiles-section">
				{#each tiles as tile}
					<div class="tile-info">
						<div class="tile-header">
							<span class="tile-name">{tile.name}</span>
							<span class="tile-type">{getSlotTypeLabel(tile.slotType)}</span>
						</div>
						<div class="tile-stats">
							{#if tile.weight !== 0}
								<span class="tile-weight">Wt: {tile.weight}</span>
							{/if}
							{#if Object.keys(tile.stats).length > 0}
								<span class="tile-bonuses">{formatStats(tile.stats)}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</button>
{/if}

<style>
	.tech-card {
		display: flex;
		flex-direction: column;
		width: 100%;
		min-width: 100px;
		max-width: 140px;
		min-height: 80px;
		background: #e8e4d9;
		border: 2px solid #9a8c70;
		border-radius: var(--radius-md);
		cursor: default;
		transition: all var(--transition-fast);
		overflow: hidden;
	}

	.tech-card.full-width {
		flex: 1;
		min-width: 100px;
		max-width: none;
	}

	.tech-card.selectable {
		cursor: pointer;
		border-color: #7a6c50;
	}

	.tech-card.selectable:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 12px rgba(122, 108, 80, 0.4);
	}

	.tech-card.selected {
		background: #d8d4c9;
		border-color: #7a6c50;
		box-shadow: 0 0 12px rgba(122, 108, 80, 0.5);
		transform: translateY(-4px);
	}

	.tech-card:disabled {
		cursor: not-allowed;
	}

	/* Header section */
	.tech-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 6px 8px;
		background: rgba(0, 0, 0, 0.08);
		border-bottom: 1px solid #c4b8a0;
	}

	.tech-name {
		font-size: 0.7rem;
		font-weight: 700;
		color: #333;
		text-transform: uppercase;
		line-height: 1.2;
		flex: 1;
	}

	.tech-cost {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	/* Effect section */
	.tech-effect {
		flex: 1;
		padding: 8px;
		font-size: 0.6rem;
		color: #555;
		line-height: 1.4;
	}

	/* Tech tiles section */
	.tiles-section {
		border-top: 1px dashed #9a8c70;
		padding: 6px 8px;
		background: rgba(255, 255, 255, 0.3);
	}

	.tile-info {
		margin-bottom: 4px;
	}

	.tile-info:last-child {
		margin-bottom: 0;
	}

	.tile-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 4px;
	}

	.tile-name {
		font-size: 0.6rem;
		font-weight: 600;
		color: #333;
	}

	.tile-type {
		font-size: 0.5rem;
		color: #666;
		background: rgba(0, 0, 0, 0.1);
		padding: 1px 4px;
		border-radius: 2px;
	}

	.tile-stats {
		display: flex;
		gap: 6px;
		font-size: 0.5rem;
		color: #555;
		margin-top: 2px;
	}

	.tile-weight {
		color: #c62828;
	}

	.tile-bonuses {
		color: #2e7d32;
	}

	/* Compact mode styles */
	.tech-card-mini {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		min-width: 50px;
		min-height: 36px;
		background: #e8e4d9;
		border: 1px solid #9a8c70;
		border-radius: 3px;
		padding: 2px 4px;
		overflow: hidden;
	}

	.mini-name {
		font-size: 0.5rem;
		font-weight: 600;
		color: #333;
		text-transform: uppercase;
		text-align: center;
		line-height: 1.1;
		word-break: break-word;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}
</style>
