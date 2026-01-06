<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { FactionIconName } from '$lib/icons/types';

	export let selectedFaction: string | null = null;
	export let takenFactions: (string | null)[] = [];
	export let compact: boolean = false;

	const dispatch = createEventDispatcher<{ select: { faction: string } }>();

	const factions = [
		{
			id: 'germany',
			name: 'Germany',
			color: 'var(--color-germany)',
			shortDesc: 'Pioneers of rigid airship design',
			ability: 'Engineering Dominance: Start with Duralumin Girders. 20% discount on Lift upgrades.',
			flaw: 'Helium Embargo: Cannot acquire Helium Handling technology.'
		},
		{
			id: 'britain',
			name: 'Britain',
			color: 'var(--color-britain)',
			shortDesc: 'Masters of imperial routes',
			ability: 'Imperial Network: Start with an Age I route claimed. Routes cost -1 Influence.',
			flaw: 'Committee Oversight: Blueprint Design costs +1 action (place 2 agents).'
		},
		{
			id: 'usa',
			name: 'USA',
			color: 'var(--color-usa)',
			shortDesc: 'Helium monopoly holders',
			ability: 'Helium Monopoly: Start with Helium Handling. Buy helium at £2 (others pay market rate).',
			flaw: 'Late to enter war. Cannot acquire a combat mission until all others have one.'
		},
		{
			id: 'italy',
			name: 'Italy',
			color: 'var(--color-italy)',
			shortDesc: 'Semi-rigid specialists',
			ability: 'Rapid Iteration: May redesign blueprint once per round for free.',
			flaw: 'Resource Scarcity: Start with £2 less and 1 fewer engineer.'
		}
	];

	function handleSelect(factionId: string) {
		if (!takenFactions.includes(factionId) || factionId === selectedFaction) {
			dispatch('select', { faction: factionId });
		}
	}

	function getTooltip(faction: typeof factions[0]): string {
		return `${faction.ability}\n\nFlaw: ${faction.flaw}`;
	}
</script>

<div class="faction-grid" class:compact>
	{#each factions as faction (faction.id)}
		{@const isTaken = takenFactions.includes(faction.id) && faction.id !== selectedFaction}
		{@const isSelected = faction.id === selectedFaction}

		<button
			class="faction-button"
			class:selected={isSelected}
			class:taken={isTaken}
			class:compact
			style="--faction-color: {faction.color}"
			disabled={isTaken}
			on:click={() => handleSelect(faction.id)}
			title={getTooltip(faction)}
			aria-label="{faction.name}: {faction.shortDesc}{isSelected ? ', currently selected' : ''}{isTaken ? ', taken by another player' : ''}"
		>
			<div class="faction-header">
				<Icon name={faction.id as FactionIconName} size={compact ? 20 : 28} color={faction.color} />
				<span class="faction-name">{faction.name}</span>
			</div>
			{#if !compact}
				<span class="faction-desc">{faction.shortDesc}</span>
			{/if}
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

	.faction-grid.compact {
		grid-template-columns: repeat(4, 1fr);
		gap: var(--spacing-sm);
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

	.faction-button.compact {
		padding: var(--spacing-sm) var(--spacing-md);
		border-width: 2px;
		border-radius: var(--radius-md);
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

	.faction-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.compact .faction-header {
		gap: var(--spacing-xs);
		justify-content: center;
	}

	.faction-name {
		font-weight: 600;
		color: var(--faction-color);
	}

	.compact .faction-name {
		font-size: 0.8rem;
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

	.compact .checkmark {
		top: 2px;
		right: 2px;
		font-size: 0.9rem;
	}

	.taken-label {
		position: absolute;
		top: var(--spacing-sm);
		right: var(--spacing-sm);
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.compact .taken-label {
		top: 2px;
		right: 2px;
		font-size: 0.6rem;
	}
</style>
