<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		created: { gameId: string };
		close: void;
	}>();

	let gameName = '';
	let error = '';
	let isSubmitting = false;

	async function handleSubmit() {
		if (!gameName.trim()) {
			error = 'Please enter a game name';
			return;
		}

		error = '';
		isSubmitting = true;

		try {
			const res = await fetch('/api/games', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ name: gameName.trim() })
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || 'Failed to create game');
			}

			dispatch('created', { gameId: data.game.id });
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create game';
		} finally {
			isSubmitting = false;
		}
	}

	function handleClose() {
		dispatch('close');
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-backdrop" on:click={handleBackdropClick} role="presentation">
	<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
		<div class="modal-header">
			<h2 id="modal-title">Create New Game</h2>
			<button class="close-button" on:click={handleClose} aria-label="Close">
				&times;
			</button>
		</div>

		<form on:submit|preventDefault={handleSubmit}>
			{#if error}
				<div class="error-message">{error}</div>
			{/if}

			<div class="form-group">
				<label for="game-name">Game Name</label>
				<input
					id="game-name"
					type="text"
					bind:value={gameName}
					placeholder="Enter a name for your game"
					maxlength="100"
					required
					disabled={isSubmitting}
				/>
			</div>

			<div class="modal-actions">
				<button type="button" class="btn btn-outline" on:click={handleClose} disabled={isSubmitting}>
					Cancel
				</button>
				<button type="submit" class="btn" disabled={isSubmitting}>
					{#if isSubmitting}
						Creating...
					{:else}
						Create Game
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.7);
		z-index: 1000;
		animation: fadeIn var(--transition-fast) ease-out;
	}

	.modal {
		width: 100%;
		max-width: 400px;
		margin: var(--spacing-md);
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		animation: slideIn var(--transition-normal) ease-out;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-md) var(--spacing-lg);
		border-bottom: 1px solid var(--color-bg-hover);
	}

	.modal-header h2 {
		font-size: 1.25rem;
		margin: 0;
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: transparent;
		border: none;
		color: var(--color-text-secondary);
		font-size: 1.5rem;
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.close-button:hover {
		background: var(--color-bg-hover);
		color: var(--color-text-primary);
	}

	form {
		padding: var(--spacing-lg);
	}

	.form-group {
		margin-bottom: var(--spacing-lg);
	}

	.form-group input {
		width: 100%;
	}

	.error-message {
		margin-bottom: var(--spacing-md);
		padding: var(--spacing-sm) var(--spacing-md);
		background: rgba(248, 113, 113, 0.1);
		border: 1px solid var(--color-error);
		border-radius: var(--radius-md);
		color: var(--color-error);
		font-size: 0.875rem;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-md);
	}
</style>
