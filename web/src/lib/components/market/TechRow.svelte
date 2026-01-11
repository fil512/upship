<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Technology, Faction } from '$lib/types/game';
	import CostBadge from '$lib/components/ui/CostBadge.svelte';
	import TechTileBox from '$lib/components/ui/TechTileBox.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { getTilesForCard } from '$lib/utils/techCardToTiles';
	import { TECH_CARDS } from '$lib/data/techTiles';
	import { getTechCardImageFilename } from '$lib/utils/cardImages';

	function getVp(cardId: string): number {
		return TECH_CARDS[cardId]?.vp || 0;
	}

	export let cards: Technology[] = [];
	export let claimed: Record<string, string> = {};
	export let pendingAcquisitions: { cardId: string; cost: number }[] = [];
	export let interactive: boolean = false;
	export let myPlayerId: string = '';
	export let players: Record<string, { faction: Faction }> = {};
	export let playerTechCards: string[] = [];
	export let installedTileIds: string[] = [];

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

	function getBaseCost(card: Technology): number {
		return (card as { cost?: number; researchCost?: number }).cost ||
			(card as { cost?: number; researchCost?: number }).researchCost ||
			3;
	}

	function calculateDiscount(cardType: string): number {
		const cardsInTrack = playerTechCards.filter(id => {
			const techCard = TECH_CARDS[id];
			return techCard?.type === cardType;
		}).length;
		if (cardsInTrack >= 5) return 2;
		if (cardsInTrack >= 3) return 1;
		return 0;
	}

	function getDisplayCost(card: Technology): { cost: number; discounted: boolean } {
		const baseCost = getBaseCost(card);
		const cardData = TECH_CARDS[card.id];
		const discount = cardData ? calculateDiscount(cardData.type) : 0;
		const finalCost = Math.max(0, baseCost - discount);
		return { cost: finalCost, discounted: discount > 0 };
	}</script>

<div class="tech-row">
	{#each cards as card, idx (card.instanceId ?? `${card.id}-${idx}`)}
		{@const claimedByMe = isClaimedByMe(card.id)}
		{@const claimedByOther = isClaimedByOther(card.id)}
		{@const costInfo = getDisplayCost(card)}
		{@const tiles = getTilesForCard(card.id)}
		{@const imageFilename = getTechCardImageFilename(card.name)}

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
				<div class="card-badges">
					{#if getVp(card.id) > 0}
						<div class="vp-badge" title="{getVp(card.id)} Victory Points">
							<Icon name="vp" size={18} />
							<span>{getVp(card.id)}</span>
						</div>
					{/if}
					<CostBadge type="research" value={costInfo.cost} size={26} discounted={costInfo.discounted} />
				</div>
			</div>

			<!-- Image area -->
			<div class="card-image-area">
				<img
					src="/cards/tech/{imageFilename}.png"
					alt=""
					class="card-image"
					on:error={(e) => (e.currentTarget as HTMLImageElement).style.display = 'none'}
				/>
				<div class="age-badge">Age {card.age}</div>
			</div>

			<!-- Effect -->
			{#if card.effect || card.description}
				<div class="card-effect">{card.effect || card.description}</div>
			{/if}

			<!-- Tech tiles this card provides -->
			{#if tiles.length > 0}
				<div class="tiles-section">
					{#each tiles as tile}
						<TechTileBox {tile} alreadyOwned={installedTileIds.includes(tile.id)} />
					{/each}
				</div>
			{/if}

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
		align-items: stretch;
		gap: 0.5rem;
		padding: 0.5rem;
	}

	.tech-card {
		position: relative;
		flex: 0 0 auto;
		width: 160px;
		min-height: 225px;
		background: #e8e4d9;
		border: 2px solid #9a8c70;
		border-radius: 8px;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		cursor: default;
		transition: all 0.2s ease;
		overflow: hidden;
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
		background: #f0ebe0;
		border-style: dashed;
		border-color: #c4b8a0;
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
		padding: 4px 6px;
		margin: 0;
		gap: 4px;
		background: rgba(0, 0, 0, 0.08);
		border-bottom: 1px solid #c4b8a0;
		border-radius: 0;
	}

	.card-name {
		flex: 1;
		font-size: 0.65rem;
		font-weight: 700;
		color: #333;
		text-transform: uppercase;
		line-height: 1.1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-badges {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
	}

	.vp-badge {
		display: flex;
		align-items: center;
		gap: 1px;
		font-size: 0.6rem;
		font-weight: 700;
		color: #333;
	}

	.card-image-area {
		flex: 1;
		min-height: 90px;
		margin: 0;
		background: rgba(154, 140, 112, 0.15);
		border-radius: 0;
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.card-effect {
		padding: 4px 6px;
		margin: 0;
		font-size: 0.6rem;
		color: #555;
		line-height: 1.3;
		background: rgba(255, 255, 255, 0.5);
		border-top: 1px solid #c4b8a0;
		border-radius: 0;
	}

	.age-badge {
		position: absolute;
		bottom: 4px;
		right: 4px;
		font-size: 0.5rem;
		color: #666;
		text-transform: uppercase;
		background: rgba(255, 255, 255, 0.7);
		padding: 1px 4px;
		border-radius: 2px;
	}

	/* Tech tiles section */
	.tiles-section {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 4px;
		margin: 0;
		border-top: 1px solid #c4b8a0;
		padding: 4px 6px;
		background: rgba(0, 0, 0, 0.08);
		border-radius: 0;
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
