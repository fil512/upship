<script lang="ts">
	export let influence: number = 0;
	export let research: number = 0;
</script>

<div class="budget-display">
	<div class="budget-item">
		<div class="budget-icon diamond" title="Influence">
			<span class="budget-value">{influence}</span>
		</div>
		<span class="budget-label">Influence</span>
	</div>

	<div class="budget-item">
		<div class="budget-icon square" title="Research">
			<span class="budget-value">{research}</span>
		</div>
		<span class="budget-label">Research</span>
	</div>
</div>

<style>
	.budget-display {
		display: flex;
		gap: 1.5rem;
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		justify-content: center;
	}

	.budget-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.budget-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		background: #888;
		color: white;
	}

	.budget-icon.diamond {
		/* Scale down so rotated diamond has same visual height as square */
		width: 34px;
		height: 34px;
		transform: rotate(45deg);
		border-radius: 4px;
	}

	.budget-icon.diamond .budget-value {
		/* Counter-rotate text to keep it upright */
		transform: rotate(-45deg);
		font-size: 1.2rem;
	}

	.budget-icon.square {
		border-radius: 4px;
	}

	.budget-value {
		font-size: 1.5rem;
		font-weight: 700;
	}

	.budget-label {
		font-size: 0.7rem;
		color: var(--color-text-secondary, #666);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
</style>
