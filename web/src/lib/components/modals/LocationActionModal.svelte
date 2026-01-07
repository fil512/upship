<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { myState, isMyTurn } from '$lib/stores/gameState';
	import Icon from '$lib/components/ui/Icon.svelte';

	export let locationId: string;
	export let locationName: string;

	const dispatch = createEventDispatcher<{
		confirm: { params: Record<string, unknown> };
		cancel: void;
	}>();

	// Form state for each location type
	let gasType: 'hydrogen' | 'helium' = 'hydrogen';
	let gasAmount: number = 1;
	let crewType: 'officer' | 'engineer' = 'officer';
	let crewCount: number = 1;
	let officerCount: number = 1;
	let levels: number = 1;
	let buildCount: number = 1;

	// Resource availability
	$: playerCash = $myState?.cash || 0;
	$: playerOfficers = $myState?.officers || 0;
	$: playerEngineers = $myState?.engineers || 0;
	$: playerHydrogen = $myState?.gasCubes?.hydrogen || 0;
	$: playerHelium = $myState?.gasCubes?.helium || 0;

	// Tech card checks
	$: hasHeliumHandling = $myState?.techCards?.includes('helium_handling') || false;

	// Reset to hydrogen if helium was selected but player doesn't have Helium Handling
	$: if (gasType === 'helium' && !hasHeliumHandling) {
		gasType = 'hydrogen';
	}

	// Gas depot costs (per cube)
	const GAS_COST = 3; // Base cost per cube

	// Academy costs
	const OFFICER_COST = 2;
	const ENGINEER_COST = 4;

	// Research institute cost
	const RESEARCH_COST = 4;

	// Calculated costs
	$: gasCost = gasAmount * GAS_COST;
	$: canAffordGas = playerCash >= gasCost;

	$: crewCost = crewType === 'officer' ? crewCount * OFFICER_COST : crewCount * ENGINEER_COST;
	$: canAffordCrew = playerCash >= crewCost;

	$: researchCost = levels * RESEARCH_COST;
	$: canAffordResearch = playerCash >= researchCost;

	$: canAffordOfficers = playerOfficers >= officerCount;

	function handleConfirm() {
		let params: Record<string, unknown> = {};

		switch (locationId) {
			case 'gas_depot':
				params = { gasType, gasAmount };
				break;
			case 'academy':
				params = { crewType, crewCount };
				break;
			case 'government_liaison':
				params = { officerCount };
				break;
			case 'research_institute':
				params = { levels };
				break;
			case 'construction_hall':
				params = { buildCount };
				break;
		}

		dispatch('confirm', { params });
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

	// Auto-close modal when turn passes (race condition fix)
	// This prevents submitting actions after bots have taken their turns
	$: if (!$isMyTurn) {
		handleCancel();
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-backdrop" on:click={handleBackdropClick} role="presentation">
	<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
		<div class="modal-header">
			<h2 id="modal-title">{locationName}</h2>
			<button class="close-button" on:click={handleCancel} aria-label="Close">
				&times;
			</button>
		</div>

		<div class="modal-body">
			{#if locationId === 'gas_depot'}
				<div class="form-section">
					<label class="form-label">Gas Type</label>
					<div class="button-group">
						<button
							class="option-btn"
							class:selected={gasType === 'hydrogen'}
							on:click={() => (gasType = 'hydrogen')}
						>
							<Icon name="hydrogen" size={32} />
							Hydrogen
						</button>
						<button
							class="option-btn"
							class:selected={gasType === 'helium'}
							class:disabled={!hasHeliumHandling}
							disabled={!hasHeliumHandling}
							on:click={() => hasHeliumHandling && (gasType = 'helium')}
							title={!hasHeliumHandling ? 'Requires Helium Handling tech card' : ''}
						>
							<Icon name="helium" size={32} />
							Helium
							{#if !hasHeliumHandling}
								<span class="lock-icon">🔒</span>
							{/if}
						</button>
					</div>
					{#if !hasHeliumHandling}
						<div class="info-text">
							<Icon name="technology" size={14} />
							<span>Helium requires the <strong>Helium Handling</strong> tech card</span>
						</div>
					{/if}
				</div>

				<div class="form-section">
					<label class="form-label">Amount</label>
					<div class="number-selector">
						<button
							class="num-btn"
							disabled={gasAmount <= 1}
							on:click={() => (gasAmount = Math.max(1, gasAmount - 1))}
						>
							-
						</button>
						<span class="num-value">{gasAmount}</span>
						<button
							class="num-btn"
							disabled={gasAmount >= 5}
							on:click={() => (gasAmount = Math.min(5, gasAmount + 1))}
						>
							+
						</button>
					</div>
				</div>

				<div class="cost-display">
					<span>Cost: £{gasCost}</span>
					<span class="available">You have: £{playerCash}</span>
				</div>
				{#if !canAffordGas}
					<div class="error-text">Not enough cash!</div>
				{/if}

			{:else if locationId === 'academy'}
				<div class="form-section">
					<label class="form-label">Crew Type</label>
					<div class="button-group">
						<button
							class="option-btn"
							class:selected={crewType === 'officer'}
							on:click={() => (crewType = 'officer')}
						>
							<Icon name="officers" size={32} />
							Officer (£{OFFICER_COST} each)
						</button>
						<button
							class="option-btn"
							class:selected={crewType === 'engineer'}
							on:click={() => (crewType = 'engineer')}
						>
							<Icon name="engineers" size={32} />
							Engineer (£{ENGINEER_COST} each)
						</button>
					</div>
				</div>

				<div class="form-section">
					<label class="form-label">Count</label>
					<div class="number-selector">
						<button
							class="num-btn"
							disabled={crewCount <= 1}
							on:click={() => (crewCount = Math.max(1, crewCount - 1))}
						>
							-
						</button>
						<span class="num-value">{crewCount}</span>
						<button
							class="num-btn"
							disabled={crewCount >= 3}
							on:click={() => (crewCount = Math.min(3, crewCount + 1))}
						>
							+
						</button>
					</div>
				</div>

				<div class="cost-display">
					<span>Cost: £{crewCost}</span>
					<span class="available">You have: £{playerCash}</span>
				</div>
				{#if !canAffordCrew}
					<div class="error-text">Not enough cash!</div>
				{/if}

			{:else if locationId === 'government_liaison'}
				<div class="form-section">
					<label class="form-label">Officers to Spend</label>
					<p class="form-hint">Spend officers to increase your income track</p>
					<div class="number-selector">
						<button
							class="num-btn"
							disabled={officerCount <= 1}
							on:click={() => (officerCount = Math.max(1, officerCount - 1))}
						>
							-
						</button>
						<span class="num-value">{officerCount}</span>
						<button
							class="num-btn"
							disabled={officerCount >= 3}
							on:click={() => (officerCount = Math.min(3, officerCount + 1))}
						>
							+
						</button>
					</div>
				</div>

				<div class="cost-display">
					<span>Spend: {officerCount} Officer{officerCount > 1 ? 's' : ''}</span>
					<span class="available">You have: {playerOfficers} Officers</span>
				</div>
				<div class="benefit-display">
					Gain: +{officerCount} Income
				</div>
				{#if !canAffordOfficers}
					<div class="error-text">Not enough officers!</div>
				{/if}

			{:else if locationId === 'research_institute'}
				<div class="form-section">
					<label class="form-label">Research Levels to Upgrade</label>
					<div class="number-selector">
						<button
							class="num-btn"
							disabled={levels <= 1}
							on:click={() => (levels = Math.max(1, levels - 1))}
						>
							-
						</button>
						<span class="num-value">{levels}</span>
						<button
							class="num-btn"
							disabled={levels >= 3}
							on:click={() => (levels = Math.min(3, levels + 1))}
						>
							+
						</button>
					</div>
				</div>

				<div class="cost-display">
					<span>Cost: £{researchCost}</span>
					<span class="available">You have: £{playerCash}</span>
				</div>
				{#if !canAffordResearch}
					<div class="error-text">Not enough cash!</div>
				{/if}

			{:else if locationId === 'construction_hall'}
				<div class="form-section">
					<label class="form-label">Ships to Build</label>
					<div class="number-selector">
						<button
							class="num-btn"
							disabled={buildCount <= 1}
							on:click={() => (buildCount = Math.max(1, buildCount - 1))}
						>
							-
						</button>
						<span class="num-value">{buildCount}</span>
						<button
							class="num-btn"
							disabled={buildCount >= 3}
							on:click={() => (buildCount = Math.min(3, buildCount + 1))}
						>
							+
						</button>
					</div>
				</div>
			{/if}
		</div>

		<div class="modal-actions">
			<button type="button" class="btn btn-outline" on:click={handleCancel}>
				Cancel
			</button>
			<button
				type="button"
				class="btn btn-primary"
				disabled={
					(locationId === 'gas_depot' && !canAffordGas) ||
					(locationId === 'academy' && !canAffordCrew) ||
					(locationId === 'government_liaison' && !canAffordOfficers) ||
					(locationId === 'research_institute' && !canAffordResearch)
				}
				on:click={handleConfirm}
			>
				Confirm
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
		max-width: 420px;
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

	.form-section {
		margin-bottom: var(--spacing-lg);
	}

	.form-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-sm);
	}

	.form-hint {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin: 0 0 var(--spacing-sm) 0;
	}

	.button-group {
		display: flex;
		gap: var(--spacing-sm);
	}

	.option-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-md);
		background: var(--color-bg-tertiary);
		border: 2px solid var(--color-bg-hover);
		border-radius: var(--radius-md);
		color: var(--color-text-primary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.option-btn:hover {
		border-color: var(--color-accent-gold);
	}

	.option-btn.selected {
		border-color: var(--color-accent-gold);
		background: rgba(212, 175, 55, 0.1);
	}

	.option-btn.disabled {
		opacity: 0.5;
		cursor: not-allowed;
		border-color: var(--color-bg-hover);
	}

	.option-btn.disabled:hover {
		border-color: var(--color-bg-hover);
	}

	.lock-icon {
		font-size: 0.75rem;
		margin-left: var(--spacing-xs);
	}

	.info-text {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		margin-top: var(--spacing-sm);
		padding: var(--spacing-sm);
		background: rgba(59, 130, 246, 0.1);
		border: 1px solid var(--color-info, #3b82f6);
		border-radius: var(--radius-md);
		font-size: 0.75rem;
		color: var(--color-info, #3b82f6);
	}

	.info-text strong {
		color: inherit;
	}

	.number-selector {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-md);
	}

	.num-btn {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg-tertiary);
		border: 2px solid var(--color-bg-hover);
		border-radius: var(--radius-md);
		color: var(--color-text-primary);
		font-size: 1.25rem;
		font-weight: bold;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.num-btn:hover:not(:disabled) {
		border-color: var(--color-accent-gold);
		background: rgba(212, 175, 55, 0.1);
	}

	.num-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.num-value {
		font-size: 1.5rem;
		font-weight: bold;
		min-width: 40px;
		text-align: center;
	}

	.cost-display {
		display: flex;
		justify-content: space-between;
		padding: var(--spacing-sm);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
	}

	.available {
		color: var(--color-text-muted);
	}

	.benefit-display {
		margin-top: var(--spacing-sm);
		padding: var(--spacing-sm);
		background: rgba(34, 197, 94, 0.1);
		border: 1px solid var(--color-success);
		border-radius: var(--radius-md);
		text-align: center;
		font-size: 0.875rem;
		color: var(--color-success);
	}

	.error-text {
		margin-top: var(--spacing-sm);
		color: var(--color-error);
		font-size: 0.875rem;
		text-align: center;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-md);
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

	.btn-primary {
		background: var(--color-accent-gold);
		border: none;
		color: var(--color-bg-primary);
	}

	.btn-primary:hover:not(:disabled) {
		filter: brightness(1.1);
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
