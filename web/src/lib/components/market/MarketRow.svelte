<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Card, Faction } from '$lib/types/game';
	import Icon from '$lib/components/ui/Icon.svelte';
	import CostBadge from '$lib/components/ui/CostBadge.svelte';

	export let cards: Card[] = [];
	export let claimed: Record<string, string> = {};
	export let pendingPurchases: { cardId: string; cost: number }[] = [];
	export let interactive: boolean = false;
	export let myPlayerId: string = '';
	export let players: Record<string, { faction: Faction }> = {};

	const dispatch = createEventDispatcher<{
		buy: { cardId: string };
		undo: { cardId: string };
	}>();

	const SYMBOL_COLORS: Record<string, string> = {
		wrench: '#4a9eff',
		coin: '#ffc107',
		propeller: '#4caf50',
		any: '#c4a35a'
	};

	function isClaimedByMe(cardId: string): boolean {
		return claimed[cardId] === myPlayerId;
	}

	function isClaimedByOther(cardId: string): boolean {
		return claimed[cardId] && claimed[cardId] !== myPlayerId;
	}

	function getClaimingFaction(cardId: string): string {
		const claimerId = claimed[cardId];
		if (!claimerId) return '';
		return players[claimerId]?.faction?.toUpperCase() || 'Unknown';
	}

	function handleClick(card: Card) {
		if (!interactive) return;
		if (isClaimedByMe(card.id)) {
			dispatch('undo', { cardId: card.id });
		} else if (!isClaimedByOther(card.id)) {
			dispatch('buy', { cardId: card.id });
		}
	}
</script>

<div class="market-row">
	{#each cards as card (card.id)}
		{@const claimedByMe = isClaimedByMe(card.id)}
		{@const claimedByOther = isClaimedByOther(card.id)}
		{@const symbolColor = SYMBOL_COLORS[card.symbol] || SYMBOL_COLORS.any}

		<button
			class="market-card"
			class:interactive
			class:claimed-by-me={claimedByMe}
			class:claimed-by-other={claimedByOther}
			style:--card-color={symbolColor}
			on:click={() => handleClick(card)}
			disabled={!interactive || claimedByOther}
		>
			<!-- Header -->
			<div class="card-header">
				<span class="card-name">{card.name}</span>
				{#if card.cost}
					<CostBadge type="influence" value={card.cost} size={20} />
				{/if}
			</div>

			<!-- Symbol -->
			<div class="card-center">
				<Icon name={card.symbol || 'any'} size={24} color={symbolColor} />
				{#if card.effect}
					<div class="card-effect">{card.effect}</div>
				{/if}
			</div>

			<!-- Reveal bonus -->
			<div class="card-reveal">
				<span class="reveal-label">Reveal:</span>
				<div class="reveal-items">
					{#if card.reveal?.cash}
						<span class="reveal-item">+{card.reveal.cash}<Icon name="cash" size={12} /></span>
					{/if}
					{#if card.reveal?.influence}
						<span class="reveal-item">+{card.reveal.influence}<Icon name="influence" size={12} /></span>
					{/if}
					{#if card.reveal?.research}
						<span class="reveal-item">+{card.reveal.research}<Icon name="research" size={12} /></span>
					{/if}
					{#if card.reveal?.officers}
						<span class="reveal-item">+{card.reveal.officers}<Icon name="officers" size={12} /></span>
					{/if}
					{#if card.reveal?.engineers}
						<span class="reveal-item">+{card.reveal.engineers}<Icon name="engineers" size={12} /></span>
					{/if}
				</div>
			</div>

			<!-- Overlay for claimed cards -->
			{#if claimedByMe}
				<div class="claimed-overlay mine">
					<span>Purchased</span>
					<button class="undo-btn" on:click|stopPropagation={() => dispatch('undo', { cardId: card.id })}>
						Undo
					</button>
				</div>
			{:else if claimedByOther}
				<div class="claimed-overlay other">
					<span>Claimed by</span>
					<span class="faction">{getClaimingFaction(card.id)}</span>
				</div>
			{/if}
		</button>
	{/each}

	<!-- Empty slots -->
	{#each { length: Math.max(0, 5 - cards.length) } as _}
		<div class="market-card empty">
			<span class="empty-text">Empty</span>
		</div>
	{/each}
</div>

<style>
	.market-row {
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem;
	}

	.market-card {
		position: relative;
		flex: 1;
		min-width: 120px;
		max-width: 160px;
		background: white;
		border: 2px solid #ddd;
		border-radius: 8px;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		cursor: default;
		transition: all 0.2s ease;
	}

	.market-card.interactive:not(.claimed-by-other) {
		cursor: pointer;
	}

	.market-card.interactive:not(.claimed-by-other):hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		border-color: var(--card-color);
	}

	.market-card.claimed-by-me {
		border-color: #4caf50;
		background: #f0fff0;
	}

	.market-card.claimed-by-other {
		opacity: 0.6;
		filter: grayscale(50%);
	}

	.market-card.empty {
		background: #f5f5f5;
		border-style: dashed;
		justify-content: center;
		align-items: center;
	}

	.empty-text {
		color: #999;
		font-size: 0.75rem;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.25rem;
	}

	.card-name {
		font-size: 0.7rem;
		font-weight: 600;
		color: #333;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-center {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0;
	}

	.card-effect {
		font-size: 0.6rem;
		color: #666;
		line-height: 1.2;
	}

	.card-reveal {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding-top: 0.25rem;
		border-top: 1px solid #eee;
		font-size: 0.6rem;
	}

	.reveal-label {
		color: #888;
	}

	.reveal-items {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.reveal-item {
		display: flex;
		align-items: center;
		gap: 2px;
		color: #333;
	}

	.claimed-overlay {
		position: absolute;
		inset: 0;
		border-radius: 6px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.7rem;
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
		font-size: 0.65rem;
		opacity: 0.9;
	}

	.undo-btn {
		padding: 0.25rem 0.5rem;
		background: white;
		color: #4caf50;
		border: none;
		border-radius: 4px;
		font-size: 0.65rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.undo-btn:hover {
		background: #f0f0f0;
	}
</style>
