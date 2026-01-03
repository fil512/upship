<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Card, Technology, Faction, PendingPurchase } from '$lib/types/game';
	import MarketRow from './MarketRow.svelte';
	import TechRow from './TechRow.svelte';

	export let marketCards: Card[] = [];
	export let techCards: Technology[] = [];
	export let claimedMarket: Record<string, string> = {};
	export let claimedTech: Record<string, string> = {};
	export let pendingMarketPurchases: PendingPurchase[] = [];
	export let pendingTechAcquisitions: PendingPurchase[] = [];
	export let interactive: boolean = false;
	export let myPlayerId: string = '';
	export let players: Record<string, { faction: Faction }> = {};
	export let playerTechCards: string[] = [];

	const dispatch = createEventDispatcher<{
		buyMarket: { cardId: string };
		buyTech: { cardId: string };
		undoPurchase: { cardId: string; type: 'market' | 'tech' };
	}>();

	function handleBuyMarket(event: CustomEvent<{ cardId: string }>) {
		dispatch('buyMarket', { cardId: event.detail.cardId });
	}

	function handleBuyTech(event: CustomEvent<{ cardId: string }>) {
		dispatch('buyTech', { cardId: event.detail.cardId });
	}

	function handleUndoMarket(event: CustomEvent<{ cardId: string }>) {
		dispatch('undoPurchase', { cardId: event.detail.cardId, type: 'market' });
	}

	function handleUndoTech(event: CustomEvent<{ cardId: string }>) {
		dispatch('undoPurchase', { cardId: event.detail.cardId, type: 'tech' });
	}
</script>

<div class="market-section">
	<div class="section-header">
		<h4>Agent Cards</h4>
		{#if interactive}
			<span class="hint">Click to purchase with Influence</span>
		{/if}
	</div>
	<MarketRow
		cards={marketCards}
		claimed={claimedMarket}
		{pendingMarketPurchases}
		{interactive}
		{myPlayerId}
		{players}
		on:buy={handleBuyMarket}
		on:undo={handleUndoMarket}
	/>

	<div class="section-header">
		<h4>Tech Cards</h4>
		{#if interactive}
			<span class="hint">Click to acquire with Research</span>
		{/if}
	</div>
	<TechRow
		cards={techCards}
		claimed={claimedTech}
		pendingAcquisitions={pendingTechAcquisitions}
		{interactive}
		{myPlayerId}
		{players}
		{playerTechCards}
		on:buy={handleBuyTech}
		on:undo={handleUndoTech}
	/>
</div>

<style>
	.market-section {
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		padding: 0.5rem;
		margin-top: 1rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0 0.5rem;
		margin-bottom: 0.25rem;
	}

	.section-header h4 {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-primary, #333);
	}

	.hint {
		font-size: 0.7rem;
		color: var(--color-text-secondary, #666);
		font-style: italic;
	}
</style>
