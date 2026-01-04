<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		fallback?: string;
		onError?: (error: Error) => void;
		children: import('svelte').Snippet;
	}

	let { fallback = 'Something went wrong', onError, children }: Props = $props();

	let hasError = $state(false);
	let errorMessage = $state('');

	onMount(() => {
		// Listen for unhandled errors in this component subtree
		const handleError = (event: ErrorEvent) => {
			hasError = true;
			errorMessage = event.message || 'An unexpected error occurred';
			onError?.(new Error(errorMessage));
			event.preventDefault();
		};

		window.addEventListener('error', handleError);
		return () => window.removeEventListener('error', handleError);
	});

	function reset() {
		hasError = false;
		errorMessage = '';
	}
</script>

{#if hasError}
	<div class="error-boundary" role="alert" aria-live="assertive">
		<div class="error-icon">⚠️</div>
		<h3 class="error-title">{fallback}</h3>
		<p class="error-message">{errorMessage}</p>
		<button class="retry-button" onclick={reset} type="button">
			Try Again
		</button>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	.error-boundary {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-lg);
		background: var(--color-bg-card);
		border: 2px solid var(--color-danger);
		border-radius: var(--radius-lg);
		text-align: center;
		min-height: 120px;
	}

	.error-icon {
		font-size: 2rem;
		margin-bottom: var(--spacing-sm);
	}

	.error-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-danger);
		margin: 0 0 var(--spacing-xs) 0;
	}

	.error-message {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin: 0 0 var(--spacing-md) 0;
		max-width: 300px;
	}

	.retry-button {
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-primary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.retry-button:hover {
		background: var(--color-bg-hover);
		border-color: var(--color-accent-gold);
	}
</style>
