<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Card as CardType } from '$lib/types/game';
	import Card from '$lib/components/cards/Card.svelte';

	export let cards: CardType[];

	const dispatch = createEventDispatcher<{
		select: { keepIndex: number };
	}>();

	let selectedIndex: number | null = null;

	function handleCardClick(index: number) {
		selectedIndex = index;
	}

	function handleKeep() {
		if (selectedIndex !== null) {
			dispatch('select', { keepIndex: selectedIndex });
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === '1') {
			selectedIndex = 0;
		} else if (event.key === '2') {
			selectedIndex = 1;
		} else if (event.key === 'Enter' && selectedIndex !== null) {
			handleKeep();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-backdrop" role="presentation">
	<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
		<div class="modal-header">
			<h2 id="modal-title">🏛️ Ministry</h2>
		</div>

		<div class="modal-body">
			<p class="instruction">Choose one card to keep (the other will be discarded):</p>

			<div class="card-options">
				{#each cards as card, index (card.id || index)}
					<button
						class="card-wrapper"
						class:selected={selectedIndex === index}
						on:click={() => handleCardClick(index)}
					>
						<Card {card} {index} selected={selectedIndex === index} selectable={true} />
						<div class="card-number">{index + 1}</div>
					</button>
				{/each}
			</div>
		</div>

		<div class="modal-footer">
			<button
				class="btn btn-primary"
				on:click={handleKeep}
				disabled={selectedIndex === null}
			>
				Keep Selected Card
			</button>
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.8);
		z-index: 1000;
		animation: fadeIn var(--transition-fast) ease-out;
	}

	.modal {
		width: 100%;
		max-width: 500px;
		margin: var(--spacing-md);
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		animation: slideIn var(--transition-normal) ease-out;
	}

	.modal-header {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: var(--spacing-md) var(--spacing-lg);
		border-bottom: 1px solid var(--color-bg-hover);
	}

	.modal-header h2 {
		font-size: 1.25rem;
		margin: 0;
		color: #a855f7;
	}

	.modal-body {
		padding: var(--spacing-lg);
	}

	.instruction {
		margin: 0 0 var(--spacing-md) 0;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		text-align: center;
	}

	.card-options {
		display: flex;
		justify-content: center;
		gap: var(--spacing-lg);
	}

	.card-wrapper {
		position: relative;
		padding: 0;
		background: transparent;
		border: 3px solid transparent;
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.card-wrapper:hover {
		border-color: var(--color-text-muted);
	}

	.card-wrapper.selected {
		border-color: #a855f7;
		box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
	}

	.card-number {
		position: absolute;
		top: -10px;
		left: -10px;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg-tertiary);
		border: 2px solid var(--color-text-muted);
		border-radius: 50%;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-text-secondary);
	}

	.card-wrapper.selected .card-number {
		background: #a855f7;
		border-color: #a855f7;
		color: white;
	}

	.modal-footer {
		display: flex;
		justify-content: center;
		padding: var(--spacing-md) var(--spacing-lg);
		border-top: 1px solid var(--color-bg-hover);
	}

	.btn {
		padding: var(--spacing-sm) var(--spacing-xl);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-primary {
		background: #a855f7;
		border: 1px solid #a855f7;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #9333ea;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
