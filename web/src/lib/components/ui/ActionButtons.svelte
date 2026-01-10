<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { turnUIState, type ActionButton } from '$lib/stores/turnState';
	import Icon from './Icon.svelte';
	import HazardCard from '$lib/components/cards/HazardCard.svelte';
	import type { IconName } from '$lib/icons';

	const dispatch = createEventDispatcher<{
		action: { action: string; actionData?: Record<string, unknown> };
	}>();

	// Map button icon names to available icons (some need mapping)
	function getIconName(buttonIcon: string): IconName {
		const iconMap: Record<string, IconName> = {
			agent: 'wrench',
			reveal: 'eye',
			keep: 'hazard',
			discard: 'hazard',
			card: 'income', // placeholder for card icon
			launch: 'launch',
			done: 'route',
			dice: 'hazard',
			engineer: 'engineers'
		};
		return (iconMap[buttonIcon] || buttonIcon) as IconName;
	}

	function handleButtonClick(button: ActionButton) {
		if (button.disabled) return;
		dispatch('action', {
			action: button.action,
			actionData: button.actionData
		});
	}

	$: uiState = $turnUIState;
	$: buttons = uiState.buttons;
	$: prompt = uiState.prompt;
	$: isMyTurn = uiState.isMyTurn;
	$: isBlocked = uiState.isBlocked;
</script>

<div class="action-panel" class:blocked={isBlocked} class:inactive={!isMyTurn}>
	<div class="prompt-bar">
		<span class="prompt-text">{prompt}</span>
		{#if isBlocked}
			<span class="blocked-badge">Action Required</span>
		{/if}
	</div>

	{#if buttons.length > 0}
		<div class="button-row">
			{#each buttons as button (button.action + JSON.stringify(button.actionData || {}))}
				<button
					class="action-button"
					class:primary={button.primary}
					class:success={button.variant === 'success'}
					class:warning={button.variant === 'warning'}
					class:danger={button.variant === 'danger'}
					class:disabled={button.disabled}
					disabled={button.disabled}
					title={button.disabled ? button.disabledReason : button.description}
					on:click={() => handleButtonClick(button)}
				>
					<Icon name={getIconName(button.icon)} size={18} />
					<span class="button-label">{button.label}</span>
				</button>
			{/each}
		</div>
	{/if}

	{#if uiState.actionContext.peekedHazard}
		<div class="hazard-card-display">
			<span class="hazard-context-label">Peeked Hazard</span>
			<HazardCard
				name={uiState.actionContext.peekedHazard.name}
				category={uiState.actionContext.peekedHazard.category}
				difficulty={uiState.actionContext.peekedHazard.difficulty}
				compact={true}
			/>
		</div>
	{/if}

	{#if uiState.actionContext.drawnMinistryCards?.length === 2}
		<div class="context-info ministry-cards">
			<span class="context-label">Choose one card to keep:</span>
			<div class="ministry-card-preview">
				{#each uiState.actionContext.drawnMinistryCards as card, i (card.id)}
					<div class="mini-card">
						<span class="card-name">{card.name}</span>
						{#if card.symbol}
							<Icon name={card.symbol} size={16} />
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if uiState.actionContext.pendingHazard}
		<div class="hazard-card-display">
			<span class="hazard-context-label warning">Hazard Check</span>
			<HazardCard
				name={uiState.actionContext.pendingHazard.name}
				category={uiState.actionContext.pendingHazard.category}
				difficulty={uiState.actionContext.pendingHazard.difficulty}
				compact={true}
			/>
		</div>
	{/if}
</div>

<style>
	.action-panel {
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
		border: 2px solid var(--color-accent-gold);
	}

	.action-panel.blocked {
		border-color: var(--color-warning);
		background: linear-gradient(135deg, var(--color-bg-card), rgba(var(--color-warning-rgb), 0.1));
	}

	.action-panel.inactive {
		border-color: var(--color-border);
		opacity: 0.7;
	}

	.prompt-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
	}

	.prompt-text {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.blocked-badge {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--color-warning);
		color: var(--color-bg-primary);
		border-radius: var(--radius-sm);
	}

	.button-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
	}

	.action-button {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm) var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg-secondary);
		color: var(--color-text-primary);
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.action-button:hover:not(.disabled) {
		background: var(--color-bg-hover);
		border-color: var(--color-accent-gold);
	}

	.action-button.primary {
		background: var(--color-accent-gold);
		color: var(--color-bg-primary);
		border-color: var(--color-accent-gold);
		font-weight: 500;
	}

	.action-button.primary:hover:not(.disabled) {
		filter: brightness(1.1);
	}

	.action-button.success {
		background: var(--color-success);
		color: var(--color-bg-primary);
		border-color: var(--color-success);
	}

	.action-button.warning {
		background: var(--color-warning);
		color: var(--color-bg-primary);
		border-color: var(--color-warning);
	}

	.action-button.danger {
		background: var(--color-danger);
		color: var(--color-bg-primary);
		border-color: var(--color-danger);
	}

	.action-button.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.button-label {
		white-space: nowrap;
	}

	.context-info {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-md);
		padding: var(--spacing-sm);
		background: var(--color-bg-secondary);
		border-radius: var(--radius-sm);
	}

	.context-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.context-label {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
	}

	.context-value {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.context-meta {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.ministry-cards {
		flex-direction: column;
	}

	.ministry-card-preview {
		display: flex;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-xs);
	}

	.mini-card {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 0.8rem;
	}

	.card-name {
		font-weight: 500;
	}

	/* Hazard card display */
	.hazard-card-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-md);
		padding: var(--spacing-md);
		background: var(--color-bg-secondary);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
	}

	.hazard-context-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--color-text-muted);
		letter-spacing: 0.5px;
	}

	.hazard-context-label.warning {
		color: var(--color-warning);
	}
</style>
