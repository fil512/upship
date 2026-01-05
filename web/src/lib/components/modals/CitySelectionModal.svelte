<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { IconName } from '$lib/icons';

	export let fromCity: string;
	export let toCity: string;

	const dispatch = createEventDispatcher<{
		select: { city: string };
		cancel: void;
	}>();

	// City bonus definitions per Section 10.4
	const CITY_BONUSES: Record<string, { description: string; icon: IconName }> = {
		// Age I Cities
		London: { description: '+£3', icon: 'cash' },
		Paris: { description: '+1 Influence', icon: 'influence' },
		Berlin: { description: '+1 Research', icon: 'research' },
		Frankfurt: { description: '+£2', icon: 'cash' },
		Hamburg: { description: '+1 Hydrogen', icon: 'hydrogen' },
		Brussels: { description: '+1 Officer', icon: 'officers' },

		// Age II Cities
		Friedrichshafen: { description: '+1 Research', icon: 'research' },
		Cardington: { description: '+1 Engineer', icon: 'engineers' },
		Rome: { description: '+1 Influence', icon: 'influence' },
		Moscow: { description: '+£4', icon: 'cash' },
		Cairo: { description: 'Free Tech Swap', icon: 'technology' },
		'Scapa Flow': { description: '+1 Officer', icon: 'officers' },

		// Age III Cities
		'New York': { description: '+£5', icon: 'cash' },
		Lakehurst: { description: '+1 Engineer', icon: 'engineers' },
		'Rio de Janeiro': { description: '+2 Influence', icon: 'influence' },
		Recife: { description: '+1 Gas (any)', icon: 'gas' },
		Seville: { description: 'Draw 1 Card', icon: 'propeller' },
		Bombay: { description: '+£3, +1 Influence', icon: 'cash' }
	};

	function getCityBonus(city: string): { description: string; icon: IconName } {
		return CITY_BONUSES[city] || { description: 'No bonus', icon: 'route' };
	}

	function handleSelect(city: string) {
		dispatch('select', { city });
	}

	function handleCancel() {
		dispatch('cancel');
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleCancel();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleCancel();
		}
	}

	$: fromBonus = getCityBonus(fromCity);
	$: toBonus = getCityBonus(toCity);
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-backdrop" on:click={handleBackdropClick} role="presentation">
	<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
		<div class="modal-header">
			<h2 id="modal-title">Choose City Bonus</h2>
			<button class="close-button" on:click={handleCancel} aria-label="Close">
				&times;
			</button>
		</div>

		<div class="modal-body">
			<p class="instruction">Select which city's bonus you want to receive:</p>

			<div class="city-options">
				<button class="city-option" on:click={() => handleSelect(fromCity)}>
					<div class="city-name">{fromCity}</div>
					<div class="city-bonus">
						<Icon name={fromBonus.icon} size={20} />
						<span>{fromBonus.description}</span>
					</div>
				</button>

				<div class="divider">or</div>

				<button class="city-option" on:click={() => handleSelect(toCity)}>
					<div class="city-name">{toCity}</div>
					<div class="city-bonus">
						<Icon name={toBonus.icon} size={20} />
						<span>{toBonus.description}</span>
					</div>
				</button>
			</div>
		</div>

		<div class="modal-footer">
			<button class="btn btn-outline" on:click={handleCancel}>
				Cancel
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
		color: var(--color-accent-gold);
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

	.modal-body {
		padding: var(--spacing-lg);
	}

	.instruction {
		margin: 0 0 var(--spacing-md) 0;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		text-align: center;
	}

	.city-options {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.city-option {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-md) var(--spacing-lg);
		background: var(--color-bg-tertiary);
		border: 2px solid var(--color-bg-hover);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.city-option:hover {
		border-color: var(--color-accent-gold);
		background: rgba(212, 175, 55, 0.1);
	}

	.city-name {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.city-bonus {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: 0.9rem;
		color: var(--color-success);
	}

	.divider {
		text-align: center;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.modal-footer {
		display: flex;
		justify-content: center;
		padding: var(--spacing-md) var(--spacing-lg);
		border-top: 1px solid var(--color-bg-hover);
	}

	.btn {
		padding: var(--spacing-sm) var(--spacing-lg);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-outline {
		background: transparent;
		border: 1px solid var(--color-bg-hover);
		color: var(--color-text-secondary);
	}

	.btn-outline:hover {
		border-color: var(--color-text-muted);
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
