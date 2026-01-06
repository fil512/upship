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
	aria-label="{card.name} card, {card.symbol || 'any'} symbol{selected ? ', selected' : ''}"
>
	<!-- Header: Name (left) + Cost (right) -->
	<div class="card-header">
		<span class="card-name">{card.name}</span>
		{#if card.cost}
			<div class="card-cost" title="Costs {card.cost} Influence">
				<CostBadge type="influence" value={card.cost} size={28} />
			</div>
		{/if}
	</div>

	<!-- Center stripe: Symbol + Agent effect -->
	<div class="card-center">
		<div class="card-symbol">
			<Icon name={iconName} size={48} color={symbolColor} />
		</div>
		{#if card.effect}
			<div class="card-effect">{card.effect}</div>
		{/if}
	</div>

	<!-- Bottom stripe: Reveal effect -->
	<div class="card-reveal">
		<span class="reveal-label">Reveal:</span>
		<div class="reveal-items">
			{#if card.reveal?.cash}
				<ResourceBadge type="cash" value={card.reveal.cash} size={20} />
			{/if}
			{#if card.reveal?.influence}
				<ResourceBadge type="influence" value={card.reveal.influence} size={20} />
			{/if}
			{#if card.reveal?.research}
				<ResourceBadge type="research" value={card.reveal.research} size={20} />
			{/if}
			{#if card.reveal?.officers}
				<ResourceBadge type="officers" value={card.reveal.officers} size={18} />
			{/if}
			{#if card.reveal?.engineers}
				<ResourceBadge type="engineers" value={card.reveal.engineers} size={18} />
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
		min-width: 120px;
		max-width: 160px;
		min-height: 170px;
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

	/* Header section */
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 6px 8px;
		background: rgba(0, 0, 0, 0.08);
		border-bottom: 1px solid #c4b8a0;
	}

	.card-name {
		font-size: 0.7rem;
		font-weight: 700;
		color: #333;
		text-transform: uppercase;
		line-height: 1.2;
		flex: 1;
	}

	.card-cost {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	/* Center section - Symbol and Effect */
	.card-center {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 8px;
		background: color-mix(in srgb, var(--card-color) 15%, #e8e4d9);
	}

	.card-symbol {
		margin-bottom: 4px;
	}

	.card-effect {
		font-size: 0.55rem;
		color: #555;
		text-align: center;
		line-height: 1.3;
		padding: 4px;
		background: rgba(255, 255, 255, 0.5);
		border-radius: var(--radius-sm);
		max-width: 100%;
	}

	/* Bottom section - Reveal */
	.card-reveal {
		padding: 6px 8px;
		background: rgba(0, 0, 0, 0.08);
		border-top: 1px solid #c4b8a0;
	}

	.reveal-label {
		font-size: 0.5rem;
		color: #777;
		text-transform: uppercase;
		display: block;
		margin-bottom: 3px;
	}

	.reveal-items {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		align-items: center;
	}
</style>
