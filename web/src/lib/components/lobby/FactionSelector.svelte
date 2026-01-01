<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let selectedFaction: string | null = null;
	export let takenFactions: (string | null)[] = [];

	const dispatch = createEventDispatcher<{ select: { faction: string } }>();

	const factions = [
		{
			id: 'germany',
			name: 'Germany',
			color: 'var(--color-germany)',
			description: 'Pioneers of rigid airship design'
		},
		{
			id: 'britain',
			name: 'Britain',
			color: 'var(--color-britain)',
			description: 'Masters of imperial routes'
		},
		{
			id: 'usa',
			name: 'USA',
			color: 'var(--color-usa)',
			description: 'Helium monopoly holders'
		},
		{
			id: 'italy',
			name: 'Italy',
			color: 'var(--color-italy)',
			description: 'Semi-rigid specialists'
		}
	];

	function handleSelect(factionId: string) {
		if (!takenFactions.includes(factionId) || factionId === selectedFaction) {
			dispatch('select', { faction: factionId });
		}
	}
</script>

<div class="faction-grid">
	{#each factions as faction}
		{@const isTaken = takenFactions.includes(faction.id) && faction.id !== selectedFaction}
		{@const isSelected = faction.id === selectedFaction}

		<button
			class="faction-button"
			class:selected={isSelected}
			class:taken={isTaken}
			style="--faction-color: {faction.color}"
			disabled={isTaken}
			on:click={() => handleSelect(faction.id)}
		>
			<span class="faction-name">{faction.name}</span>
			<span class="faction-desc">{faction.description}</span>
			{#if isSelected}
				<span class="checkmark">&#10003;</span>
			{/if}
			{#if isTaken}
				<span class="taken-label">Taken</span>
			{/if}
		</button>
	{/each}
</div>

<style>
	.faction-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-md);
	}

	.faction-button {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		padding: var(--spacing-md);
		background: var(--color-bg-tertiary);
		border: 3px solid transparent;
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all var(--transition-fast);
		text-align: left;
	}

	.faction-button:hover:not(:disabled) {
		border-color: var(--faction-color);
	}

	.faction-button.selected {
		border-color: var(--faction-color);
		background: color-mix(in srgb, var(--faction-color) 20%, var(--color-bg-tertiary));
	}

	.faction-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.faction-name {
		font-weight: 600;
		color: var(--faction-color);
	}

	.faction-desc {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.checkmark {
		position: absolute;
		top: var(--spacing-sm);
		right: var(--spacing-sm);
		color: var(--color-success);
		font-size: 1.25rem;
	}

	.taken-label {
		position: absolute;
		top: var(--spacing-sm);
		right: var(--spacing-sm);
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}
</style>
