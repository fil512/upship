<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Card as CardType, Faction } from '$lib/types/game';
	import Card from '$lib/components/cards/Card.svelte';

	export let cards: CardType[] = [];
	export let claimed: Record<string, string> = {};
	export let pendingPurchases: { cardId: string; cost: number }[] = [];
	export let interactive: boolean = false;
	export let myPlayerId: string = '';
	export let players: Record<string, { faction: Faction }> = {};

	const dispatch = createEventDispatcher<{
		buy: { cardId: string };
		undo: { cardId: string };
	}>();

	function isClaimedByMe(cardId: string): boolean {
		return claimed[cardId] === myPlayerId;
	}

	function isClaimedByOther(cardId: string): boolean {
		return !!claimed[cardId] && claimed[cardId] !== myPlayerId;
	}

	function getClaimingFaction(cardId: string): string {
		const claimerId = claimed[cardId];
		if (!claimerId) return '';
		return players[claimerId]?.faction?.toUpperCase() || 'Unknown';
	}

	function handleBuy(event: CustomEvent<{ cardId: string }>) {
		dispatch('buy', event.detail);
	}

	function handleUndo(event: CustomEvent<{ cardId: string }>) {
		dispatch('undo', event.detail);
	}
</script>

<div class="market-row">
	{#each cards as card (card.id)}
		<Card
			{card}
			marketMode={true}
			selectable={interactive}
			claimedByMe={isClaimedByMe(card.id)}
			claimedByOther={isClaimedByOther(card.id)}
			claimingFaction={getClaimingFaction(card.id)}
			on:buy={handleBuy}
			on:undo={handleUndo}
		/>
	{/each}

	<!-- Empty slots -->
	{#each { length: Math.max(0, 5 - cards.length) } as _}
		<div class="empty-slot">
			<span class="empty-text">Empty</span>
		</div>
	{/each}
</div>

<style>
	.market-row {
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem;
		flex-wrap: nowrap;
	}

	.empty-slot {
		flex: 1;
		min-width: 120px;
		max-width: 160px;
		min-height: 170px;
		background: #f0ebe0;
		border: 2px dashed #d4c9b5;
		border-radius: 8px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.empty-text {
		color: #999;
		font-size: 0.75rem;
	}
</style>
