<script lang="ts">
	import Icon from './Icon.svelte';

	export let type: 'cash' | 'influence' | 'research' | 'officers' | 'engineers';
	export let value: number;
	export let size: number = 18;

	// For officers/engineers, we repeat the icon instead of showing a number
	$: isRepeatable = type === 'officers' || type === 'engineers';
	$: repeatCount = isRepeatable ? Math.min(value, 5) : 0; // Cap at 5 to avoid overflow

	const tooltips: Record<string, string> = {
		cash: 'Cash',
		influence: 'Influence',
		research: 'Research',
		officers: 'Officers',
		engineers: 'Engineers'
	};
</script>

<span class="resource-badge" title="+{value} {tooltips[type]}">
	{#if isRepeatable}
		<!-- Repeat icon for officers/engineers -->
		<span class="icon-repeat">
			{#each Array(repeatCount) as _, i}
				<Icon name={type} size={size} />
			{/each}
		</span>
	{:else}
		<!-- Number inside shape for cash/influence/research -->
		<span class="badge-shape {type}" style:--size="{size}px">
			<span class="badge-value">{value}</span>
		</span>
	{/if}
</span>

<style>
	.resource-badge {
		display: inline-flex;
		align-items: center;
		gap: 1px;
	}

	.icon-repeat {
		display: inline-flex;
		align-items: center;
		gap: 0;
	}

	.icon-repeat :global(.icon-wrapper) {
		margin-left: -3px;
	}

	.icon-repeat :global(.icon-wrapper:first-child) {
		margin-left: 0;
	}

	.badge-shape {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--size);
		height: var(--size);
		position: relative;
	}

	.badge-value {
		font-size: calc(var(--size) * 0.55);
		font-weight: 700;
		color: #1a1a2e;
		z-index: 1;
		line-height: 1;
	}

	/* Cash - grey circle */
	.badge-shape.cash {
		background: #888888;
		border-radius: 50%;
	}

	/* Influence - grey diamond */
	.badge-shape.influence {
		background: #888888;
		transform: rotate(45deg);
		border-radius: 2px;
	}

	.badge-shape.influence .badge-value {
		transform: rotate(-45deg);
	}

	/* Research - grey square */
	.badge-shape.research {
		background: #888888;
		border-radius: 2px;
	}
</style>
