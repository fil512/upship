<script lang="ts">
	import { icons, type IconName } from '$lib/icons';

	export let name: IconName;
	export let size: number | string = 24;
	export let color: string = 'currentColor';
	export let tooltip: string = '';
	export let label: string = '';

	let className = '';
	export { className as class };

	$: sizeValue = typeof size === 'number' ? `${size}px` : size;
	$: iconData = icons[name];
	$: tooltipText = tooltip || iconData?.tooltip || '';
</script>

<span
	class="icon-wrapper {className}"
	style:width={sizeValue}
	style:height={sizeValue}
	style:color
	title={tooltipText}
	role={label ? 'img' : 'presentation'}
	aria-label={label || tooltipText}
>
	{#if iconData}
		{@html iconData.svg}
	{:else}
		<span class="icon-fallback">?</span>
	{/if}
</span>

<style>
	.icon-wrapper {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		vertical-align: middle;
	}

	.icon-wrapper :global(svg) {
		width: 100%;
		height: 100%;
	}

	.icon-fallback {
		font-size: 0.75em;
		opacity: 0.5;
	}
</style>
