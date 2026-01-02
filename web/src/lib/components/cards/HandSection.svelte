<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Card as CardType } from '$lib/types/game';
	import Card from './Card.svelte';

	export let hand: CardType[] = [];
	export let selectedIndex: number | null = null;
	export let selectable: boolean = false;
	export let deckSize: number = 0;
	export let discardSize: number = 0;
	export let isViewingOtherPlayer: boolean = false;
	export let otherPlayerCardCount: number = 0;

	const dispatch = createEventDispatcher<{
		selectCard: { index: number; card: CardType };
	}>();

	function handleCardSelect(event: CustomEvent<{ index: number; card: CardType }>) {
		dispatch('selectCard', event.detail);
	}
</script>

<div class="hand-section">
	<div class="hand-header">
		<h4>Agent Cards</h4>
		<div class="deck-info">
			<span class="deck-count" title="Agent Cards in deck">📚 {deckSize}</span>
			<span class="discard-count" title="Agent Cards in discard">🗑️ {discardSize}</span>
		</div>
	</div>

	{#if hand.length > 0}
		<div class="cards-row">
			{#each hand as card, index}
				<Card
					{card}
					{index}
					selected={selectedIndex === index}
					{selectable}
					on:select={handleCardSelect}
				/>
			{/each}
		</div>
	{:else if isViewingOtherPlayer && otherPlayerCardCount > 0}
		<div class="hidden-hand">
			🃏 {otherPlayerCardCount} Agent Cards (hidden - viewing other player)
		</div>
	{:else}
		<div class="empty-hand">No Agent Cards in hand</div>
	{/if}

	{#if selectable && selectedIndex !== null}
		<div class="selection-hint">
			Agent Card selected - choose a location on the Ground Board
		</div>
	{/if}
</div>

<style>
	.hand-section {
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
	}

	.hand-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--spacing-sm);
	}

	.hand-header h4 {
		font-size: 0.875rem;
		color: var(--color-accent-gold);
	}

	.deck-info {
		display: flex;
		gap: var(--spacing-sm);
	}

	.deck-count,
	.discard-count {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.cards-row {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-sm);
	}

	.empty-hand {
		text-align: center;
		color: var(--color-text-muted);
		padding: var(--spacing-lg);
		font-size: 0.875rem;
	}

	.hidden-hand {
		text-align: center;
		color: var(--color-info);
		padding: var(--spacing-lg);
		font-size: 0.875rem;
		background: var(--color-bg-hover);
		border-radius: var(--radius-sm);
	}

	.selection-hint {
		margin-top: var(--spacing-sm);
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--color-bg-hover);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		color: var(--color-success);
		text-align: center;
	}
</style>
