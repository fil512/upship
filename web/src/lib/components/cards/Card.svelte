<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Card } from '$lib/types/game';
	import Icon from '$lib/components/ui/Icon.svelte';
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
>
	<!-- Header: Name (left) + Cost (right) -->
	<div class="card-header">
		<span class="card-name">{card.name}</span>
		{#if card.cost}
			<div class="card-cost" title="Costs {card.cost} Influence">
				<Icon name="influence" size={12} />
				<span>{card.cost}</span>
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
				<div class="reveal-item" title="+{card.reveal.cash} Cash">
					<span>+{card.reveal.cash}</span>
					<Icon name="cash" size={14} />
				</div>
			{/if}
			{#if card.reveal?.influence}
				<div class="reveal-item" title="+{card.reveal.influence} Influence">
					<span>+{card.reveal.influence}</span>
					<Icon name="influence" size={14} />
				</div>
			{/if}
			{#if card.reveal?.research}
				<div class="reveal-item" title="+{card.reveal.research} Research">
					<span>+{card.reveal.research}</span>
					<Icon name="research" size={14} />
				</div>
			{/if}
			{#if card.reveal?.officers}
				<div class="reveal-item" title="+{card.reveal.officers} Officers">
					<span>+{card.reveal.officers}</span>
					<Icon name="officers" size={14} />
				</div>
			{/if}
			{#if card.reveal?.engineers}
				<div class="reveal-item" title="+{card.reveal.engineers} Engineers">
					<span>+{card.reveal.engineers}</span>
					<Icon name="engineers" size={14} />
				</div>
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
		background: var(--color-bg-card);
		border: 2px solid var(--color-bg-hover);
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
		background: color-mix(in srgb, var(--card-color) 15%, var(--color-bg-card));
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
		background: var(--color-bg-tertiary);
		border-bottom: 1px solid var(--color-bg-hover);
	}

	.card-name {
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--color-text-primary);
		text-transform: uppercase;
		line-height: 1.2;
		flex: 1;
	}

	.card-cost {
		display: flex;
		align-items: center;
		gap: 2px;
		background: var(--color-bg-hover);
		padding: 2px 5px;
		border-radius: var(--radius-sm);
		font-size: 0.65rem;
		font-weight: 700;
		color: var(--color-text-primary);
	}

	/* Center section - Symbol and Effect */
	.card-center {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 8px;
		background: color-mix(in srgb, var(--card-color) 10%, transparent);
	}

	.card-symbol {
		margin-bottom: 4px;
	}

	.card-effect {
		font-size: 0.55rem;
		color: var(--color-text-secondary);
		text-align: center;
		line-height: 1.3;
		padding: 4px;
		background: var(--color-bg-card);
		border-radius: var(--radius-sm);
		max-width: 100%;
	}

	/* Bottom section - Reveal */
	.card-reveal {
		padding: 6px 8px;
		background: var(--color-bg-tertiary);
		border-top: 1px solid var(--color-bg-hover);
	}

	.reveal-label {
		font-size: 0.5rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		display: block;
		margin-bottom: 3px;
	}

	.reveal-items {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.reveal-item {
		display: flex;
		align-items: center;
		gap: 2px;
		background: var(--color-bg-hover);
		padding: 2px 5px;
		border-radius: var(--radius-sm);
		font-size: 0.6rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}
</style>
