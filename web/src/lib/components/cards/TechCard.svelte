<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import CostBadge from '$lib/components/ui/CostBadge.svelte';
	import TechTileBox from '$lib/components/ui/TechTileBox.svelte';
	import { getTilesForCard } from '$lib/utils/techCardToTiles';

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
					<CostBadge type="research" value={tech.researchCost} size={31} />
				</div>
			{/if}
		</div>

		<!-- Image area placeholder -->
		<div class="tech-image-area">
			<!-- Future: tech image will go here -->
		</div>

		<!-- Effect description -->
		{#if tech.effect}
			<div class="tech-effect">{tech.effect}</div>
		{/if}

		<!-- Tech tiles this card provides -->
		{#if tiles.length > 0}
			<div class="tiles-section">
				{#each tiles as tile}
					<TechTileBox {tile} />
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
		min-width: 140px;
		max-width: 160px;
		min-height: 225px;
		padding: 0;
		margin: 0;
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
		align-items: center;
		padding: 4px 6px;
		margin: 0;
		background: rgba(0, 0, 0, 0.08);
		border-bottom: 1px solid #c4b8a0;
		border-radius: 0;
	}

	.tech-name {
		font-size: 0.65rem;
		font-weight: 700;
		color: #333;
		text-transform: uppercase;
		line-height: 1.1;
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tech-cost {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	/* Image area placeholder */
	.tech-image-area {
		flex: 1;
		min-height: 90px;
		margin: 0;
		background: rgba(154, 140, 112, 0.15);
		border-radius: 0;
	}

	/* Effect section */
	.tech-effect {
		padding: 4px 6px;
		margin: 0;
		font-size: 0.6rem;
		color: #555;
		line-height: 1.3;
		background: rgba(255, 255, 255, 0.5);
		border-top: 1px solid #c4b8a0;
		border-radius: 0;
	}

	/* Tech tiles section */
	.tiles-section {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 4px;
		margin: 0;
		border-top: 1px solid #c4b8a0;
		padding: 4px 6px;
		background: rgba(0, 0, 0, 0.08);
		border-radius: 0;
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
