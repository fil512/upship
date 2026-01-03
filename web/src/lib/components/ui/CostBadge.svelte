<script lang="ts">
	/**
	 * CostBadge - Displays a resource cost as a shape with a number inside
	 * Three grey shapes for three resource types:
	 * - influence: grey diamond
	 * - cash: grey circle
	 * - research: grey square
	 *
	 * Optional discounted prop turns the badge green to indicate a discounted cost.
	 */

	export let type: 'influence' | 'cash' | 'research';
	export let value: number;
	export let size: number = 24;
	export let discounted: boolean = false;

	$: fontSize = value >= 10 ? 10 : 12;
	$: fillColor = discounted ? '#4caf50' : '#888888';
</script>

<svg
	viewBox="0 0 24 24"
	width={size}
	height={size}
	role="img"
	aria-label="{value} {type}"
	class="cost-badge"
>
	{#if type === 'influence'}
		<!-- Diamond shape -->
		<polygon points="12 1 23 12 12 23 1 12" fill={fillColor} />
		<text x="12" y="16" text-anchor="middle" font-size={fontSize} font-weight="bold" fill="white">
			{value}
		</text>
	{:else if type === 'cash'}
		<!-- Circle shape -->
		<circle cx="12" cy="12" r="11" fill={fillColor} />
		<text x="12" y="16" text-anchor="middle" font-size={fontSize} font-weight="bold" fill="white">
			{value}
		</text>
	{:else if type === 'research'}
		<!-- Square shape -->
		<rect x="1" y="1" width="22" height="22" rx="2" fill={fillColor} />
		<text x="12" y="17" text-anchor="middle" font-size={fontSize} font-weight="bold" fill="white">
			{value}
		</text>
	{/if}
</svg>

<style>
	.cost-badge {
		display: inline-block;
		vertical-align: middle;
	}
</style>
