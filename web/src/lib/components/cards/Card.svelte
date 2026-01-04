<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Card } from '$lib/types/game';
	import Icon from '$lib/components/ui/Icon.svelte';
	import CostBadge from '$lib/components/ui/CostBadge.svelte';
	import ResourceBadge from '$lib/components/ui/ResourceBadge.svelte';
	import type { SymbolIconName } from '$lib/icons/types';

	export let card: Card;
	export let index: number;
	export let selected: boolean = false;
	export let selectable: boolean = false;

	const dispatch = createEventDispatcher<{
		select: { index: number; card: Card };
	}>();

	const SYMBOL_COLORS: Record<string, string> = {
		wrench: '#4a9eff',
		coin: '#ffc107',
		propeller: '#4caf50',
		any: '#c4a35a'
	};

	$: iconName = (card.symbol || 'any') as SymbolIconName;
	$: symbolColor = SYMBOL_COLORS[card.symbol] || SYMBOL_COLORS.any;

	function handleClick() {
		if (selectable) {
			dispatch('select', { index, card });
		}
	}
</script>

<button
	class="card"
	class:selected
	class:selectable
	style:--card-color={symbolColor}
	on:click={handleClick}
	disabled={!selectable}
	aria-label="{card.name} card, {card.symbol || 'any'} symbol{selected ? ', selected' : ''}"
>
	<!-- Header: Name (left) + Cost (right) -->
	<div class="card-header">
		<span class="card-name">{card.name}</span>
		{#if card.cost}
			<div class="card-cost" title="Costs {card.cost} Influence">
				<CostBadge type="influence" value={card.cost} size={24} />
			</div>
		{/if}
	</div>

	<!-- Center stripe: Symbol + Agent effect -->
	<div class="card-center">
		<div class="card-symbol">
			<Icon name={iconName} size={32} color={symbolColor} />
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
				<ResourceBadge type="cash" value={card.reveal.cash} size={16} />
			{/if}
			{#if card.reveal?.influence}
				<ResourceBadge type="influence" value={card.reveal.influence} size={16} />
			{/if}
			{#if card.reveal?.research}
				<ResourceBadge type="research" value={card.reveal.research} size={16} />
			{/if}
			{#if card.reveal?.officers}
				<ResourceBadge type="officers" value={card.reveal.officers} size={14} />
			{/if}
			{#if card.reveal?.engineers}
				<ResourceBadge type="engineers" value={card.reveal.engineers} size={14} />
			{/if}
		</div>
	</div>
</button>

<style>
	.card {
		display: flex;
		flex-direction: column;
		width: 100%;
		min-width: 100px;
		max-width: 140px;
		min-height: 150px;
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
