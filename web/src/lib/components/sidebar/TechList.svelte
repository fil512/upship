<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Technology, PendingPurchase } from '$lib/types/game';
	import TechCard from '$lib/components/cards/TechCard.svelte';
	import { TECH_CARDS } from '$lib/data/techTiles';

	// Tech cards are string IDs from the server
	export let techCards: string[] = [];
	// Pending tech acquisitions (show with undo button during reveal)
	export let pendingAcquisitions: PendingPurchase[] = [];
	// R&D board to look up pending card details
	export let rdBoard: Technology[] = [];
	// Whether to show undo buttons
	export let showUndo: boolean = false;

	const dispatch = createEventDispatcher<{
		undo: { cardId: string };
	}>();

	// Track definitions with display names
	const TRACKS = [
		{ type: 'drive', name: 'Propulsion' },
		{ type: 'structure', name: 'Structure' },
		{ type: 'fabric', name: 'Fabric' },
		{ type: 'gas', name: 'Gas Systems' },
		{ type: 'component', name: 'Payload' }
	] as const;

	const SLOTS_PER_TRACK = 5;

	// Group tech cards by track type
	function getCardsByTrack(trackType: string): string[] {
		return techCards.filter(id => {
			const card = TECH_CARDS[id];
			return card?.type === trackType;
		});
	}

	// Get discount for a specific slot position (0-indexed)
	function getSlotDiscount(slotIndex: number): number {
		if (slotIndex >= 4) return 2; // 5th slot (index 4)
		if (slotIndex >= 2) return 1; // 3rd-4th slot (index 2-3)
		return 0; // 1st-2nd slot (index 0-1)
	}

	// Convert tech card ID to display format for TechCard
	function toTechCardFormat(techId: string): { id: string; name: string; effect?: string; researchCost?: number; vp?: number } {
		const cardData = TECH_CARDS[techId];
		if (cardData) {
			return {
				id: cardData.id,
				name: cardData.name,
				researchCost: cardData.cost > 0 ? cardData.cost : undefined,
				vp: cardData.vp
			};
		}
		return {
			id: techId,
			name: techId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
		};
	}

	function getPendingTechCard(cardId: string): Technology | null {
		return rdBoard.find(t => t.id === cardId) || null;
	}

	function handleUndo(cardId: string) {
		dispatch('undo', { cardId });
	}
</script>

<div class="tech-list">
	<h4>Technology Cards</h4>

	<!-- Pending acquisitions (during reveal phase) -->
	{#if pendingAcquisitions.length > 0}
		<div class="pending-section">
			<h5>Acquiring This Turn</h5>
			<div class="tech-cards-row">
				{#each pendingAcquisitions as pending}
					{@const tech = getPendingTechCard(pending.cardId)}
					{#if tech}
						{@const cardData = TECH_CARDS[tech.id]}
						<div class="pending-card-wrapper">
							<TechCard
								tech={{
									id: tech.id,
									name: tech.name,
									effect: tech.effect,
									researchCost: cardData?.cost > 0 ? cardData.cost : undefined,
									vp: cardData?.vp
								}}
							/>
							{#if showUndo}
								<button class="undo-btn" on:click={() => handleUndo(pending.cardId)}>
									Undo
								</button>
							{/if}
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}

	<!-- Tech cards organized by track -->
	<div class="tracks-container">
		{#each TRACKS as track}
			{@const cardsInTrack = getCardsByTrack(track.type)}
			<div class="track-section">
				<span class="track-label">{track.name}</span>
				<div class="track-slots">
					{#each { length: SLOTS_PER_TRACK } as _, idx}
						{#if idx < cardsInTrack.length}
							<!-- Filled slot with card -->
							<TechCard tech={toTechCardFormat(cardsInTrack[idx])} showTiles={true} fullWidth={true} />
						{:else}
							<!-- Empty slot with discount indicator -->
							{@const discount = getSlotDiscount(idx)}
							<div class="slot empty">
								{#if discount > 0}
									<span class="discount-badge">-{discount}</span>
								{/if}
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.tech-list {
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
		width: 100%;
	}

	.tech-list h4 {
		font-size: 0.875rem;
		color: var(--color-accent-gold);
		margin-bottom: var(--spacing-sm);
	}

	.pending-section {
		margin-bottom: var(--spacing-sm);
		padding-bottom: var(--spacing-sm);
		border-bottom: 1px solid var(--color-bg-hover);
	}

	.pending-section h5 {
		font-size: 0.75rem;
		color: #4caf50;
		margin-bottom: var(--spacing-xs);
		font-weight: 600;
	}

	.tech-cards-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
	}

	.pending-card-wrapper {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.undo-btn {
		padding: 4px 8px;
		background: white;
		color: #4caf50;
		border: 1px solid #4caf50;
		border-radius: 4px;
		font-size: 0.65rem;
		font-weight: 600;
		cursor: pointer;
		align-self: center;
	}

	.undo-btn:hover {
		background: #4caf50;
		color: white;
	}

	/* Track-based layout */
	.tracks-container {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		width: 100%;
	}

	.track-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		width: 100%;
	}

	.track-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
	}

	.track-slots {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.5rem;
		width: 100%;
	}

	/* Empty slot styling - match TechRow dimensions */
	.slot.empty {
		min-height: 80px;
		background: #f0ebe0;
		border: 2px dashed #c4b8a0;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.discount-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: #888888;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: bold;
		color: white;
	}
</style>
