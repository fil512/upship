<script lang="ts">
	import { toasts, dismissToast, type Toast } from '$lib/stores/ui';

	function getToastClass(type: Toast['type']): string {
		const classes: Record<Toast['type'], string> = {
			default: 'toast-default',
			turn: 'toast-turn',
			phase: 'toast-phase',
			error: 'toast-error',
			success: 'toast-success',
			info: 'toast-info',
			warning: 'toast-warning'
		};
		return classes[type] || 'toast-default';
	}

	function getIcon(type: Toast['type']): string {
		const icons: Record<Toast['type'], string> = {
			default: '',
			turn: '⚡',
			phase: '🔄',
			error: '❌',
			success: '✓',
			info: 'ℹ',
			warning: '⚠'
		};
		return icons[type] || '';
	}
</script>

<div class="toast-container" aria-live="polite">
	{#each $toasts as toast (toast.id)}
		<div class="toast {getToastClass(toast.type)}" role="alert">
			{#if getIcon(toast.type)}
				<span class="toast-icon">{getIcon(toast.type)}</span>
			{/if}
			<span class="toast-message">{toast.message}</span>
			<button class="toast-close" on:click={() => dismissToast(toast.id)} aria-label="Dismiss">
				×
			</button>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		top: var(--spacing-md);
		right: var(--spacing-md);
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		max-width: 400px;
	}

	.toast {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		animation: slideIn var(--transition-normal) ease-out;
	}

	.toast-icon {
		flex-shrink: 0;
		font-size: 1rem;
	}

	.toast-message {
		flex: 1;
		font-size: 0.875rem;
	}

	.toast-close {
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: inherit;
		opacity: 0.7;
		font-size: 1.25rem;
		cursor: pointer;
		transition: opacity var(--transition-fast);
	}

	.toast-close:hover {
		opacity: 1;
	}

	/* Toast types */
	.toast-default {
		background: var(--color-bg-card);
		color: var(--color-text-primary);
		border: 1px solid var(--color-bg-hover);
	}

	.toast-turn {
		background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
		color: #052e16;
	}

	.toast-phase {
		background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
		color: #1e3a5f;
	}

	.toast-error {
		background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
		color: #450a0a;
	}

	.toast-success {
		background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
		color: #052e16;
	}

	.toast-info {
		background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
		color: #1e3a5f;
	}

	.toast-warning {
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		color: #451a03;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(100%);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style>
