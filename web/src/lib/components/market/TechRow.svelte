<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Technology, Faction } from '$lib/types/game';
	import CostBadge from '$lib/components/ui/CostBadge.svelte';

	export let cards: Technology[] = [];
	export let claimed: Record<string, string> = {};
	export let pendingAcquisitions: { cardId: string; cost: number }[] = [];
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
		return claimed[cardId] && claimed[cardId] !== myPlayerId;
	}

	function getClaimingFaction(cardId: string): string {
		const claimerId = claimed[cardId];
		if (!claimerId) return '';
		return players[claimerId]?.faction?.toUpperCase() || 'Unknown';
	}

	function handleClick(card: Technology) {
		if (!interactive) return;
		if (isClaimedByMe(card.id)) {
			dispatch('undo', { cardId: card.id });
		} else if (!isClaimedByOther(card.id)) {
			dispatch('buy', { cardId: card.id });
		}
	}

	function getCost(card: Technology): number {
		return (card as { cost?: number; researchCost?: number }).cost ||
			(card as { cost?: number; researchCost?: number }).researchCost ||
			3;
	}
</script>

<div class="tech-row">
	{#each cards as card (card.id)}
		{@const claimedByMe = isClaimedByMe(card.id)}
		{@const claimedByOther = isClaimedByOther(card.id)}
		{@const cost = getCost(card)}

		<button
			class="tech-card"
			class:interactive
			class:claimed-by-me={claimedByMe}
			class:claimed-by-other={claimedByOther}
			on:click={() => handleClick(card)}
			disabled={!interactive || claimedByOther}
		>
			<!-- Header -->
			<div class="card-header">
				<span class="card-name">{card.name}</span>
				<CostBadge type="research" value={cost} size={20} />
			</div>

			<!-- Effect -->
			{#if card.effect || card.description}
				<div class="card-effect">{card.effect || card.description}</div>
			{/if}

			<!-- Age badge -->
			<div class="age-badge">Age {card.age}</div>

			<!-- Overlay for claimed cards -->
			{#if claimedByMe}
				<div class="claimed-overlay mine">
					<span>Acquired</span>
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
		<div class="tech-card empty">
			<span class="empty-text">Empty</span>
		</div>
	{/each}
</div>

<style>
	.tech-row {
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem;
	}

	.tech-card {
		position: relative;
		flex: 1;
		min-width: 120px;
		max-width: 160px;
		min-height: 80px;
		background: #f8f8f8;
		border: 2px solid #888;
		border-radius: 8px;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		cursor: default;
		transition: all 0.2s ease;
	}

	.tech-card.interactive:not(.claimed-by-other) {
		cursor: pointer;
	}

	.tech-card.interactive:not(.claimed-by-other):hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		border-color: #555;
	}

	.tech-card.claimed-by-me {
		border-color: #4caf50;
		background: #f0fff0;
	}

	.tech-card.claimed-by-other {
		opacity: 0.6;
		filter: grayscale(50%);
	}

	.tech-card.empty {
		background: #f5f5f5;
		border-style: dashed;
		border-color: #ccc;
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
		align-items: flex-start;
		gap: 0.25rem;
	}

	.card-name {
		font-size: 0.7rem;
		font-weight: 700;
		color: #333;
		text-transform: uppercase;
		line-height: 1.2;
	}

	.card-effect {
		flex: 1;
		font-size: 0.6rem;
		color: #666;
		line-height: 1.3;
	}

	.age-badge {
		position: absolute;
		bottom: 4px;
		right: 4px;
		font-size: 0.5rem;
		color: #888;
		text-transform: uppercase;
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
