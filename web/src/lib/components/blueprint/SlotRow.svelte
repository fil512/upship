<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let label: string;
	export let slotType: string;
	export let slots: (string | null)[];
	export let color: string = 'var(--color-accent-gold)';

	const dispatch = createEventDispatcher<{
		slotClick: { index: number; upgrade: string | null };
	}>();

	function handleClick(index: number, upgrade: string | null) {
		dispatch('slotClick', { index, upgrade });
	}

	function getUpgradeShortName(upgrade: string | null): string {
		if (!upgrade) return '+';
		// Extract meaningful short name from upgrade ID
		const parts = upgrade.split('_');
		if (parts.length > 1) {
			return parts[parts.length - 1].substring(0, 3).toUpperCase();
		}
		return upgrade.substring(0, 3).toUpperCase();
	}
</script>

<div class="slot-row">
	<span class="slot-label" style:color={color}>{label}</span>
	<div class="slots">
		{#each slots as upgrade, index}
			<button
				class="slot"
				class:filled={upgrade !== null}
				style:border-color={color}
				style:--slot-color={color}
				on:click={() => handleClick(index, upgrade)}
				title={upgrade || `Add ${label} upgrade`}
			>
				{getUpgradeShortName(upgrade)}
			</button>
		{/each}
	</div>
</div>

<style>
	.slot-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.slot-label {
		width: 80px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.slots {
		display: flex;
		gap: var(--spacing-xs);
		flex: 1;
	}

	.slot {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg-hover);
		border: 2px dashed;
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.slot:hover {
		background: var(--color-bg-card);
		border-style: solid;
		color: var(--slot-color);
	}

	.slot.filled {
		border-style: solid;
		background: color-mix(in srgb, var(--slot-color) 15%, transparent);
		color: var(--slot-color);
	}
</style>
