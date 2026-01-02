<script lang="ts">
	export let text: string;
	export let position: 'top' | 'bottom' | 'left' | 'right' = 'top';

	let visible = false;
</script>

<span
	class="tooltip-wrapper"
	on:mouseenter={() => (visible = true)}
	on:mouseleave={() => (visible = false)}
	on:focus={() => (visible = true)}
	on:blur={() => (visible = false)}
	role="tooltip"
>
	<slot />
	{#if visible && text}
		<span class="tooltip tooltip-{position}" role="tooltip">
			{text}
		</span>
	{/if}
</span>

<style>
	.tooltip-wrapper {
		position: relative;
		display: inline-flex;
	}

	.tooltip {
		position: absolute;
		padding: 4px 8px;
		background: var(--color-bg-primary);
		color: var(--color-text-primary);
		border: 1px solid var(--color-bg-hover);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		white-space: nowrap;
		z-index: 1000;
		pointer-events: none;
		box-shadow: var(--shadow-md);
		animation: fadeIn 150ms ease-out;
	}

	.tooltip-top {
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-bottom: 6px;
	}

	.tooltip-bottom {
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-top: 6px;
	}

	.tooltip-left {
		right: 100%;
		top: 50%;
		transform: translateY(-50%);
		margin-right: 6px;
	}

	.tooltip-right {
		left: 100%;
		top: 50%;
		transform: translateY(-50%);
		margin-left: 6px;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
