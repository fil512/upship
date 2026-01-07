<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Card } from '$lib/types/game';
	import Icon from '$lib/components/ui/Icon.svelte';
	import CostBadge from '$lib/components/ui/CostBadge.svelte';
	import ResourceBadge from '$lib/components/ui/ResourceBadge.svelte';
	import type { SymbolIconName } from '$lib/icons/types';

	export let card: Card;
	export let index: number = 0;
	export let selected: boolean = false;
	export let selectable: boolean = false;

	// Market mode props
	export let marketMode: boolean = false;
	export let claimedByMe: boolean = false;
	export let claimedByOther: boolean = false;
	export let claimingFaction: string = '';

	const dispatch = createEventDispatcher<{
		select: { index: number; card: Card };
		buy: { cardId: string };
		undo: { cardId: string };
	}>();

	const SYMBOL_COLORS: Record<string, string> = {
		wrench: '#4a9eff',
		coin: '#ffc107',
		propeller: '#4caf50',
		any: '#c4a35a'
	};

	$: iconName = (card.symbol || 'any') as SymbolIconName;
	$: symbolColor = SYMBOL_COLORS[card.symbol] || SYMBOL_COLORS.any;
	$: isInteractive = marketMode ? (!claimedByOther) : selectable;

	// Derive image filename from card name (e.g., "Lloyd's Man" -> "lloyds_man.png")
	function getImageFilename(name: string): string {
		return name
			.toLowerCase()
			.replace(/['']/g, '')  // Remove apostrophes
			.replace(/[^a-z0-9]+/g, '_')  // Replace non-alphanumeric with underscore
			.replace(/^_|_$/g, '');  // Trim leading/trailing underscores
	}
	$: imageFilename = getImageFilename(card.name);

	function handleClick() {
		if (marketMode) {
			if (claimedByMe) {
				dispatch('undo', { cardId: card.id });
			} else if (!claimedByOther) {
				dispatch('buy', { cardId: card.id });
			}
		} else if (selectable) {
			dispatch('select', { index, card });
		}
	}

	function handleUndo(e: MouseEvent | KeyboardEvent) {
		e.stopPropagation();
		dispatch('undo', { cardId: card.id });
	}
</script>

<button
	class="card"
	class:selected
	class:selectable={isInteractive}
	class:market-mode={marketMode}
	class:claimed-by-me={claimedByMe}
	class:claimed-by-other={claimedByOther}
	style:--card-color={symbolColor}
	on:click={handleClick}
	disabled={marketMode ? claimedByOther : !selectable}
	title={card.flavor || ''}
	aria-label="{card.name} card, {card.symbol || 'any'} symbol{selected ? ', selected' : ''}"
>
	<!-- Header: Symbol + Name (left) + Cost (right) -->
	<div class="card-header">
		<div class="card-symbol">
			<Icon name={iconName} size={18} color={symbolColor} />
		</div>
		<span class="card-name">{card.name}</span>
		{#if card.cost}
			<div class="card-cost" title="Costs {card.cost} Influence">
				<CostBadge type="influence" value={card.cost} size={26} />
			</div>
		{/if}
	</div>

	<!-- Center: Image area -->
	<div class="card-image-area">
		<img
			src="/cards/agent/{imageFilename}.png"
			alt=""
			class="card-image"
			on:error={(e) => e.currentTarget.style.display = 'none'}
		/>
	</div>

	<!-- Effect description above reveal -->
	{#if card.effect}
		<div class="card-effect">{card.effect}</div>
	{/if}

	<!-- Bottom stripe: Reveal effect (full width) -->
	<div class="card-reveal">
		<span class="reveal-label">Reveal:</span>
		<div class="reveal-items">
			{#if card.reveal?.cash}
				<ResourceBadge type="cash" value={card.reveal.cash} size={18} />
			{/if}
			{#if card.reveal?.influence}
				<ResourceBadge type="influence" value={card.reveal.influence} size={18} />
			{/if}
			{#if card.reveal?.research}
				<ResourceBadge type="research" value={card.reveal.research} size={18} />
			{/if}
			{#if card.reveal?.officers}
				<ResourceBadge type="officers" value={card.reveal.officers} size={16} />
			{/if}
			{#if card.reveal?.engineers}
				<ResourceBadge type="engineers" value={card.reveal.engineers} size={16} />
			{/if}
		</div>
	</div>

	<!-- Overlay for claimed cards in market mode -->
	{#if marketMode && claimedByMe}
		<div class="claimed-overlay mine">
			<span>Purchased</span>
			<span class="undo-btn" role="button" tabindex="0" on:click={handleUndo} on:keydown={(e) => e.key === 'Enter' && handleUndo(e)}>Undo</span>
		</div>
	{:else if marketMode && claimedByOther}
		<div class="claimed-overlay other">
			<span>Claimed by</span>
			<span class="faction">{claimingFaction}</span>
		</div>
	{/if}
</button>

<style>
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		width: 100%;
		min-width: 140px;
		max-width: 160px;
		min-height: 225px;
		padding: 0;
		margin: 0;
		background: #e8e4d9;
		border: 2px solid #c4b8a0;
		border-radius: var(--radius-md);
		cursor: default;
		transition: all var(--transition-fast);
		overflow: hidden;
	}

	.card.selectable {
		cursor: pointer;
		border-color: var(--card-color);
	}

	.card.selectable:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 12px color-mix(in srgb, var(--card-color) 40%, transparent);
	}

	.card.selected {
		background: color-mix(in srgb, var(--card-color) 20%, #e8e4d9);
		border-color: var(--card-color);
		box-shadow: 0 0 12px color-mix(in srgb, var(--card-color) 50%, transparent);
		transform: translateY(-4px);
	}

	.card:disabled {
		cursor: not-allowed;
	}

	/* Market mode styles */
	.card.market-mode.claimed-by-me {
		border-color: #4caf50;
		background: #f0fff0;
	}

	.card.market-mode.claimed-by-other {
		opacity: 0.6;
		filter: grayscale(50%);
	}

	.claimed-overlay {
		position: absolute;
		inset: 0;
		border-radius: var(--radius-md);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.claimed-overlay.mine {
		background: rgba(76, 175, 80, 0.9);
		color: white;
	}

	.claimed-overlay.other {
		background: rgba(0, 0, 0, 0.7);
		color: white;
	}

	.claimed-overlay .faction {
		font-size: 0.7rem;
		opacity: 0.9;
		text-transform: uppercase;
	}

	.undo-btn {
		padding: 0.25rem 0.75rem;
		background: white;
		color: #4caf50;
		border: none;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.undo-btn:hover {
		background: #f0f0f0;
	}

	/* Header section - Symbol + Name + Cost */
	.card-header {
		display: flex;
		align-items: center;
		padding: 4px 6px;
		gap: 3px;
		margin: 0;
		background: rgba(0, 0, 0, 0.08);
		border-bottom: 1px solid #c4b8a0;
		border-radius: 0;
	}

	.card-symbol {
		flex-shrink: 0;
	}

	.card-name {
		flex: 1;
		font-size: 0.65rem;
		font-weight: 700;
		color: #333;
		text-transform: uppercase;
		line-height: 1.1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-cost {
		flex-shrink: 0;
	}

	/* Center section - Image area */
	.card-image-area {
		flex: 1;
		min-height: 90px;
		margin: 0;
		background: color-mix(in srgb, var(--card-color) 10%, #e8e4d9);
		border-radius: 0;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Effect description - above reveal */
	.card-effect {
		font-size: 0.6rem;
		color: #555;
		text-align: left;
		line-height: 1.2;
		padding: 4px 6px;
		margin: 0;
		background: rgba(255, 255, 255, 0.5);
		border-top: 1px solid #c4b8a0;
		border-radius: 0;
	}

	/* Bottom section - Reveal (full width) */
	.card-reveal {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 6px;
		margin: 0;
		background: rgba(0, 0, 0, 0.08);
		border-top: 1px solid #c4b8a0;
		border-radius: 0;
	}

	.reveal-label {
		font-size: 0.5rem;
		color: #777;
		text-transform: uppercase;
		flex-shrink: 0;
	}

	.reveal-items {
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
		align-items: center;
	}
</style>
