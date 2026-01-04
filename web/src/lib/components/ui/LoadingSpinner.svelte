<script lang="ts">
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let label: string = 'Loading...';
	export let showLabel: boolean = false;

	const sizes = {
		sm: '16px',
		md: '24px',
		lg: '40px'
	};
</script>

<div class="loading-spinner" class:with-label={showLabel} aria-label={label} role="status">
	<svg
		class="spinner"
		style:width={sizes[size]}
		style:height={sizes[size]}
		viewBox="0 0 24 24"
		fill="none"
		aria-hidden="true"
	>
		<circle
			class="track"
			cx="12"
			cy="12"
			r="10"
			stroke="currentColor"
			stroke-width="3"
			opacity="0.25"
		/>
		<path
			class="indicator"
			d="M12 2a10 10 0 0 1 10 10"
			stroke="currentColor"
			stroke-width="3"
			stroke-linecap="round"
		/>
	</svg>
	{#if showLabel}
		<span class="label">{label}</span>
	{/if}
</div>

<style>
	.loading-spinner {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.label {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.with-label {
		flex-direction: column;
	}
</style>
