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

	// Convert tech card ID to display format for TechCard
	function toTechCardFormat(techId: string): { id: string; name: string; effect?: string; researchCost?: number } {
		// Look up by ID
		const cardData = TECH_CARDS[techId];
		if (cardData) {
			return {
				id: cardData.id,
				name: cardData.name,
				researchCost: cardData.cost > 0 ? cardData.cost : undefined
			};
		}
		// Fallback: format the ID
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
									researchCost: cardData?.cost > 0 ? cardData.cost : undefined
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

	<!-- Owned technology cards -->
	{#if techCards.length === 0 && pendingAcquisitions.length === 0}
		<div class="empty">No technology cards acquired</div>
	{:else if techCards.length > 0}
		<div class="tech-cards-row">
			{#each techCards as techId}
				<TechCard tech={toTechCardFormat(techId)} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.tech-list {
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
	}

	.tech-list h4 {
		font-size: 0.875rem;
		color: var(--color-accent-gold);
		margin-bottom: var(--spacing-sm);
	}

	.empty {
		text-align: center;
		color: var(--color-text-muted);
		padding: var(--spacing-sm);
		font-size: 0.75rem;
	}

	.tech-cards-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
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
</style>
