<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { IconName } from '$lib/icons';

	export let routeName: string;
	export let routeIncome: number;
	export let cityBonus: { city: string; description: string; icon: IconName } | null = null;
	export let missionName: string | null = null;
	export let missionVp: number = 0;

	const dispatch = createEventDispatcher<{
		dismiss: void;
	}>();

	function handleDismiss() {
		dispatch('dismiss');
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleDismiss();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' || event.key === 'Enter') {
			handleDismiss();
		}
	}

	$: isMission = missionName !== null;
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-backdrop" on:click={handleBackdropClick} role="presentation">
	<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
		<div class="modal-header success">
			<div class="success-icon">
				<Icon name={isMission ? 'hazard' : 'launch'} size={32} />
			</div>
			<h2 id="modal-title">{isMission ? 'Mission Complete!' : 'Launch Successful!'}</h2>
		</div>

		<div class="modal-body">
			<div class="route-info">
				<div class="route-name">
					<Icon name={isMission ? 'hazard' : 'route'} size={20} />
					<span>{isMission ? missionName : routeName}</span>
				</div>
			</div>

			<div class="rewards">
				<div class="reward-item">
					<Icon name="income" size={24} />
					<div class="reward-details">
						<span class="reward-value">+{routeIncome}</span>
						<span class="reward-label">Income per round</span>
					</div>
				</div>

				{#if missionVp > 0}
					<div class="reward-item">
						<Icon name="vp" size={24} />
						<div class="reward-details">
							<span class="reward-value">+{missionVp}</span>
							<span class="reward-label">Victory Points</span>
						</div>
					</div>
				{/if}

				{#if cityBonus}
					<div class="reward-item bonus">
						<Icon name={cityBonus.icon} size={24} />
						<div class="reward-details">
							<span class="reward-value">{cityBonus.description}</span>
							<span class="reward-label">from {cityBonus.city}</span>
						</div>
					</div>
				{/if}
			</div>

			<p class="flavor-text">
				{#if isMission}
					Your airship completed the mission and returns to the hangar.
				{:else}
					Your airship has claimed the route and will generate income each round!
				{/if}
			</p>
		</div>

		<div class="modal-footer">
			<button class="btn btn-primary" on:click={handleDismiss}>
				Continue
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
		max-width: 380px;
		margin: var(--spacing-md);
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		animation: slideIn var(--transition-normal) ease-out;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-lg);
		background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05));
		border-bottom: 1px solid rgba(34, 197, 94, 0.3);
	}

	.success-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 64px;
		height: 64px;
		background: rgba(34, 197, 94, 0.2);
		border-radius: 50%;
		color: var(--color-success);
		animation: pulse 1.5s ease-in-out infinite;
	}

	.modal-header h2 {
		font-size: 1.5rem;
		margin: 0;
		color: var(--color-success);
		text-align: center;
	}

	.modal-body {
		padding: var(--spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.route-info {
		display: flex;
		justify-content: center;
	}

	.route-name {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.rewards {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.reward-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
		border-left: 3px solid var(--color-accent-gold);
	}

	.reward-item.bonus {
		border-left-color: var(--color-success);
		background: rgba(34, 197, 94, 0.1);
	}

	.reward-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.reward-value {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-accent-gold);
	}

	.reward-item.bonus .reward-value {
		color: var(--color-success);
	}

	.reward-label {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.flavor-text {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
		text-align: center;
		margin: 0;
		font-style: italic;
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
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-primary {
		background: var(--color-success);
		border: 1px solid var(--color-success);
		color: white;
	}

	.btn-primary:hover {
		background: #16a34a;
		transform: translateY(-1px);
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
			transform: translateY(-20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}
</style>
