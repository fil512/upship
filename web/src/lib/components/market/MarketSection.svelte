<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Card, Technology, Faction, PendingPurchase } from '$lib/types/game';
	import MarketRow from './MarketRow.svelte';
	import TechRow from './TechRow.svelte';
	import CardComponent from '$lib/components/cards/Card.svelte';
	import CostBadge from '$lib/components/ui/CostBadge.svelte';
	import TechTileBox from '$lib/components/ui/TechTileBox.svelte';
	import { getTilesForCard } from '$lib/utils/techCardToTiles';
	import { getTechCardImageFilename } from '$lib/utils/cardImages';

	export let marketCards: Card[] = [];
	export let reserveCard: Card | null = null;
	export let techCards: Technology[] = [];
	export let reserveTechCard: Technology | null = null;
	export let claimedMarket: Record<string, string> = {};
	export let claimedTech: Record<string, string> = {};
	export let pendingMarketPurchases: PendingPurchase[] = [];
	export let pendingTechAcquisitions: PendingPurchase[] = [];
	export let interactive: boolean = false;
	export let myPlayerId: string = '';
	export let players: Record<string, { faction: Faction }> = {};
	export let playerTechCards: string[] = [];
	export let installedTileIds: string[] = [];

	// Check if player already owns the reserve tech
	$: ownsReserveTech = reserveTechCard ? playerTechCards.includes(reserveTechCard.id) : false;
	// Check if player has pending acquisition for reserve tech
	$: pendingReserveTech = reserveTechCard ? pendingTechAcquisitions.some(p => p.cardId === reserveTechCard.id) : false;
	// Check if player has pending purchase for reserve agent card
	$: pendingReserveAgent = reserveCard ? pendingMarketPurchases.some(p => p.cardId === reserveCard.id) : false;
	$: reserveTechTiles = reserveTechCard ? getTilesForCard(reserveTechCard.id) : [];
	$: reserveTechCost = (reserveTechCard as { cost?: number })?.cost || 5;
	$: reserveTechImage = reserveTechCard ? getTechCardImageFilename(reserveTechCard.name) : null;

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
	<div class="market-cards-row">
		{#if reserveCard}
			<div class="reserve-section">
				<div class="reserve-label">Always Available</div>
				<CardComponent
					card={reserveCard}
					marketMode={true}
					selectable={interactive && !pendingReserveAgent}
					claimedByMe={pendingReserveAgent}
					on:buy={handleBuyMarket}
					on:undo={handleUndoMarket}
				/>
			</div>
		{/if}
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
	</div>

	<div class="section-header">
		<h4>Tech Cards</h4>
		{#if interactive}
			<span class="hint">Click to acquire with Research</span>
		{/if}
	</div>
	<div class="tech-cards-row">
		{#if reserveTechCard}
			<div class="reserve-section tech-reserve">
				<div class="reserve-label">Always Available</div>
				<button
					class="reserve-tech-card"
					class:owned={ownsReserveTech}
					class:pending={pendingReserveTech}
					class:interactive
					disabled={!interactive || ownsReserveTech || pendingReserveTech}
					on:click={() => dispatch('buyTech', { cardId: reserveTechCard.id })}
				>
					<div class="reserve-tech-header">
						<span class="reserve-tech-name">{reserveTechCard.name}</span>
						<CostBadge type="research" value={reserveTechCost} size={26} />
					</div>
					{#if reserveTechImage}
						<div class="reserve-tech-image-area">
							<img
								src="/cards/tech/{reserveTechImage}.png"
								alt=""
								class="reserve-tech-image"
								on:error={(e) => (e.currentTarget as HTMLImageElement).style.display = 'none'}
							/>
						</div>
					{/if}
					{#if reserveTechTiles.length > 0}
						<div class="reserve-tech-tiles">
							{#each reserveTechTiles as tile}
								<TechTileBox {tile} alreadyOwned={installedTileIds.includes(tile.id)} />
							{/each}
						</div>
					{/if}
					{#if ownsReserveTech}
						<div class="owned-overlay">Owned</div>
					{:else if pendingReserveTech}
						<div class="pending-overlay">
							<span>Purchased</span>
							<button
								class="undo-btn"
								on:click|stopPropagation={() => dispatch('undoPurchase', { cardId: reserveTechCard.id, type: 'tech' })}
							>Undo</button>
						</div>
					{/if}
				</button>
			</div>
		{/if}
		<TechRow
			cards={techCards}
			claimed={claimedTech}
			pendingAcquisitions={pendingTechAcquisitions}
			{interactive}
			{myPlayerId}
			{players}
			{playerTechCards}
			{installedTileIds}
			on:buy={handleBuyTech}
			on:undo={handleUndoTech}
		/>
	</div>
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

	/* Add spacing above Tech Cards header */
	.market-cards-row + .section-header {
		margin-top: 1rem;
	}

	.hint {
		font-size: 0.7rem;
		color: var(--color-text-secondary, #666);
		font-style: italic;
	}

	.market-cards-row {
		display: flex;
		align-items: stretch;
		gap: 0.5rem;
		flex-wrap: nowrap;
	}

	.reserve-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.5rem;
		background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
		border: 2px solid #81c784;
		border-radius: 8px;
		flex-shrink: 0;
	}

	.reserve-label {
		font-size: 0.65rem;
		font-weight: 600;
		color: #2e7d32;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 0.25rem;
	}

	.tech-cards-row {
		display: flex;
		align-items: stretch;
		gap: 0.5rem;
		flex-wrap: nowrap;
	}

	.tech-reserve {
		background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
		border: 2px solid #64b5f6;
	}

	.tech-reserve .reserve-label {
		color: #1565c0;
	}

	/* Reserve tech card - matches TechRow.svelte .tech-card exactly */
	.reserve-tech-card {
		position: relative;
		width: 160px;
		height: 225px;
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

	.reserve-tech-card.interactive:not(.owned) {
		cursor: pointer;
	}

	.reserve-tech-card.interactive:not(.owned):hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		border-color: #555;
	}

	.reserve-tech-card.owned {
		opacity: 0.7;
		filter: grayscale(30%);
	}

	.reserve-tech-header {
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

	.reserve-tech-image-area {
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

	.reserve-tech-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.reserve-tech-name {
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

	.reserve-tech-effect {
		padding: 4px 6px;
		margin: 0;
		font-size: 0.6rem;
		color: #555;
		line-height: 1.3;
		background: rgba(255, 255, 255, 0.5);
		border-top: 1px solid #c4b8a0;
		border-radius: 0;
	}

	.reserve-tech-tiles {
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

	.owned-overlay {
		position: absolute;
		inset: 0;
		background: rgba(76, 175, 80, 0.85);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
		font-weight: 600;
		border-radius: 4px;
	}

	.reserve-tech-card.pending {
		opacity: 0.9;
	}

	.pending-overlay {
		position: absolute;
		inset: 0;
		background: rgba(76, 175, 80, 0.85);
		color: white;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		font-weight: 600;
		border-radius: 4px;
	}

	.pending-overlay .undo-btn {
		background: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.5);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.7rem;
		font-weight: 600;
		transition: background 0.2s;
	}

	.pending-overlay .undo-btn:hover {
		background: rgba(255, 255, 255, 0.3);
	}
</style>
