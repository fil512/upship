<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import CostBadge from '$lib/components/ui/CostBadge.svelte';

	export let tech: {
		id: string;
		name: string;
		effect?: string;
		researchCost?: number;
	};
	export let selected: boolean = false;
	export let selectable: boolean = false;

	const dispatch = createEventDispatcher<{
		select: { tech: typeof tech };
	}>();

	function handleClick() {
		if (selectable) {
			dispatch('select', { tech });
		}
	}
</script>

<button
	class="tech-card"
	class:selected
	class:selectable
	on:click={handleClick}
	disabled={!selectable}
>
	<!-- Header: Name (left) + Research Cost (right) -->
	<div class="tech-header">
		<span class="tech-name">{tech.name}</span>
		{#if tech.researchCost}
			<div class="tech-cost" title="Costs {tech.researchCost} Research">
				<CostBadge type="research" value={tech.researchCost} size={24} />
			</div>
		{/if}
	</div>

	<!-- Effect description -->
	{#if tech.effect}
		<div class="tech-effect">{tech.effect}</div>
	{/if}
</button>

<style>
	.tech-card {
		display: flex;
		flex-direction: column;
		width: 100%;
		min-width: 100px;
		max-width: 140px;
		min-height: 80px;
		background: var(--color-bg-card);
		border: 2px solid var(--color-bg-hover);
		border-radius: var(--radius-md);
		cursor: default;
		transition: all var(--transition-fast);
		overflow: hidden;
	}

	.tech-card.selectable {
		cursor: pointer;
		border-color: #888888;
	}

	.tech-card.selectable:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 12px rgba(136, 136, 136, 0.4);
	}

	.tech-card.selected {
		background: color-mix(in srgb, #888888 15%, var(--color-bg-card));
		border-color: #888888;
		box-shadow: 0 0 12px rgba(136, 136, 136, 0.5);
		transform: translateY(-4px);
	}

	.tech-card:disabled {
		cursor: not-allowed;
	}

	/* Header section */
	.tech-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 6px 8px;
		background: var(--color-bg-tertiary);
		border-bottom: 1px solid var(--color-bg-hover);
	}

	.tech-name {
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--color-text-primary);
		text-transform: uppercase;
		line-height: 1.2;
		flex: 1;
	}

	.tech-cost {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	/* Effect section */
	.tech-effect {
		flex: 1;
		padding: 8px;
		font-size: 0.6rem;
		color: var(--color-text-secondary);
		line-height: 1.4;
	}
</style>
