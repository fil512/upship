<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Technology, PendingPurchase } from '$lib/types/game';
	import Icon from '$lib/components/ui/Icon.svelte';

	// Technologies can be either string IDs or full objects
	export let technologies: (string | Technology)[] = [];
	// Pending tech acquisitions (show with undo button during reveal)
	export let pendingAcquisitions: PendingPurchase[] = [];
	// R&D board to look up pending card details
	export let rdBoard: Technology[] = [];
	// Whether to show undo buttons
	export let showUndo: boolean = false;

	const dispatch = createEventDispatcher<{
		undo: { cardId: string };
	}>();

	// Format a technology ID to a readable name
	function formatTechName(tech: string | Technology): string {
		if (typeof tech === 'object' && tech.name) {
			return tech.name;
		}
		// Convert snake_case ID to Title Case
		return String(tech)
			.split('_')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	function getTechEffect(tech: string | Technology): string | null {
		if (typeof tech === 'object' && tech.effect) {
			return tech.effect;
		}
		return null;
	}

	function getPendingTechCard(cardId: string): Technology | null {
		return rdBoard.find(t => t.id === cardId) || null;
	}

	function handleUndo(cardId: string) {
		dispatch('undo', { cardId });
	}
</script>

<div class="tech-list">
	<h4>Technologies</h4>

	<!-- Pending acquisitions (during reveal phase) -->
	{#if pendingAcquisitions.length > 0}
		<div class="pending-section">
			<h5>Acquiring This Turn</h5>
			<div class="techs">
				{#each pendingAcquisitions as pending}
					{@const tech = getPendingTechCard(pending.cardId)}
					{#if tech}
						<div class="tech-item pending">
							<span class="tech-icon"><Icon name="research" size={18} /></span>
							<div class="tech-info">
								<span class="tech-name">{tech.name}</span>
								{#if tech.effect}
									<span class="tech-effect">{tech.effect}</span>
								{/if}
							</div>
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

	<!-- Owned technologies -->
	{#if technologies.length === 0 && pendingAcquisitions.length === 0}
		<div class="empty">No technologies acquired</div>
	{:else if technologies.length > 0}
		<div class="techs">
			{#each technologies as tech}
				<div class="tech-item" title={typeof tech === 'string' ? tech : tech.id}>
					<span class="tech-icon"><Icon name="research" size={18} /></span>
					<div class="tech-info">
						<span class="tech-name">{formatTechName(tech)}</span>
						{#if getTechEffect(tech)}
							<span class="tech-effect">{getTechEffect(tech)}</span>
						{/if}
					</div>
				</div>
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

	.techs {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.tech-item {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs);
		background: var(--color-bg-hover);
		border-radius: var(--radius-sm);
	}

	.tech-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.tech-info {
		display: flex;
		flex-direction: column;
	}

	.tech-name {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.tech-effect {
		font-size: 0.625rem;
		color: var(--color-text-muted);
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

	.tech-item.pending {
		background: rgba(76, 175, 80, 0.1);
		border: 1px solid rgba(76, 175, 80, 0.3);
	}

	.undo-btn {
		padding: 2px 6px;
		background: white;
		color: #4caf50;
		border: 1px solid #4caf50;
		border-radius: 4px;
		font-size: 0.6rem;
		font-weight: 600;
		cursor: pointer;
		flex-shrink: 0;
		margin-left: auto;
	}

	.undo-btn:hover {
		background: #4caf50;
		color: white;
	}
</style>
