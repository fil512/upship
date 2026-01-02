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
	style:--card-color={SYMBOL_COLORS[card.symbol] || SYMBOL_COLORS.any}
	on:click={handleClick}
	disabled={!selectable}
>
	<div class="card-symbol">
		<Icon name={iconName} size={28} color={SYMBOL_COLORS[card.symbol] || SYMBOL_COLORS.any} />
	</div>
	<div class="card-name">{card.name}</div>
	{#if card.ability}
		<div class="card-ability">{card.ability}</div>
	{/if}
</button>

<style>
	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-sm);
		background: var(--color-bg-card);
		border: 2px solid var(--color-bg-hover);
		border-radius: var(--radius-md);
		min-width: 80px;
		min-height: 100px;
		cursor: default;
		transition: all var(--transition-fast);
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
		background: color-mix(in srgb, var(--card-color) 20%, var(--color-bg-card));
		border-color: var(--card-color);
		box-shadow: 0 0 12px color-mix(in srgb, var(--card-color) 50%, transparent);
		transform: translateY(-4px);
	}

	.card:disabled {
		cursor: not-allowed;
	}

	.card-symbol {
		margin-bottom: var(--spacing-xs);
	}

	.card-name {
		font-size: 0.625rem;
		font-weight: 600;
		color: var(--card-color);
		text-transform: uppercase;
		text-align: center;
		line-height: 1.2;
	}

	.card-ability {
		font-size: 0.5rem;
		color: var(--color-text-muted);
		text-align: center;
		margin-top: var(--spacing-xs);
	}
</style>
