<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Card, Technology, Faction, PendingPurchase } from '$lib/types/game';
	import MarketRow from './MarketRow.svelte';
	import TechRow from './TechRow.svelte';
	import CardComponent from '$lib/components/cards/Card.svelte';

	export let marketCards: Card[] = [];
	export let reserveCard: Card | null = null;
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
	<div class="market-with-reserve">
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
		{#if reserveCard}
			<div class="reserve-section">
				<div class="reserve-label">Always Available</div>
				<CardComponent
					card={reserveCard}
					marketMode={true}
					selectable={interactive}
					on:buy={handleBuyMarket}
				/>
			</div>
		{/if}
	</div>

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

	.market-with-reserve {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.reserve-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.5rem;
		background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
		border: 2px solid #81c784;
		border-radius: 8px;
		min-width: fit-content;
	}

	.reserve-label {
		font-size: 0.65rem;
		font-weight: 600;
		color: #2e7d32;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 0.25rem;
	}
</style>
