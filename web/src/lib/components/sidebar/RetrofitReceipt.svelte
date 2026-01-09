<script lang="ts">
	export let startingCash: number;
	export let oldHullCost: number;
	export let newHullCost: number;
	export let costIncrease: number;
	export let shipsToRetrofit: number;
	export let retrofitCost: number;
	export let remainingCash: number;
	export let isAgeTransition: boolean;

	$: hasChanges = costIncrease > 0;
	$: isNegative = remainingCash < 0;
</script>

<div class="retrofit-receipt" class:negative={isNegative}>
	<div class="receipt-header">RETROFIT ESTIMATE</div>

	<div class="receipt-row starting">
		<span class="label">Starting Cash</span>
		<span class="value">£{startingCash}</span>
	</div>

	<div class="receipt-divider"></div>

	<div class="receipt-row">
		<span class="label">Old Hull Cost:</span>
		<span class="value">£{oldHullCost}</span>
	</div>
	<div class="receipt-row">
		<span class="label">New Hull Cost:</span>
		<span class="value">£{newHullCost}</span>
	</div>
	<div class="receipt-row">
		<span class="label">Cost Increase:</span>
		<span class="value" class:positive={costIncrease > 0}>
			{costIncrease > 0 ? '+' : ''}£{costIncrease}
		</span>
	</div>
	<div class="receipt-row">
		<span class="label">Ships to Retrofit:</span>
		<span class="value">× {shipsToRetrofit}</span>
	</div>

	<div class="receipt-divider"></div>

	<div class="receipt-row cost">
		<span class="label">Retrofit Cost:</span>
		{#if isAgeTransition}
			<span class="value free">FREE</span>
		{:else}
			<span class="value" class:charge={retrofitCost > 0}>
				{retrofitCost > 0 ? '-' : ''}£{retrofitCost}
			</span>
		{/if}
	</div>

	<div class="receipt-divider thick"></div>

	<div class="receipt-row remaining">
		<span class="label">Remaining Cash</span>
		<span class="value" class:error={isNegative}>£{remainingCash}</span>
	</div>

	{#if isNegative}
		<div class="error-message">Insufficient funds</div>
	{:else if isAgeTransition && hasChanges}
		<div class="free-message">Age Transition - No retrofit cost</div>
	{/if}
</div>

<style>
	.retrofit-receipt {
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-sm);
		font-family: 'Courier New', monospace;
		font-size: 0.75rem;
	}

	.retrofit-receipt.negative {
		border-color: var(--color-error);
		background: color-mix(in srgb, var(--color-error) 10%, var(--color-bg-card));
	}

	.receipt-header {
		text-align: center;
		font-weight: 700;
		font-size: 0.8rem;
		color: var(--color-accent-gold);
		margin-bottom: var(--spacing-xs);
		letter-spacing: 0.05em;
	}

	.receipt-row {
		display: flex;
		justify-content: space-between;
		padding: 2px 0;
	}

	.receipt-row .label {
		color: var(--color-text-muted);
	}

	.receipt-row .value {
		color: var(--color-text);
		font-weight: 500;
	}

	.receipt-row.starting .value,
	.receipt-row.remaining .value {
		font-weight: 700;
		color: var(--color-text);
	}

	.receipt-row .value.positive {
		color: var(--color-warning);
	}

	.receipt-row .value.charge {
		color: var(--color-error);
	}

	.receipt-row .value.free {
		color: var(--color-success);
		font-weight: 700;
	}

	.receipt-row .value.error {
		color: var(--color-error);
		font-weight: 700;
	}

	.receipt-row.remaining {
		font-size: 0.85rem;
	}

	.receipt-divider {
		border-top: 1px dashed var(--color-border);
		margin: var(--spacing-xs) 0;
	}

	.receipt-divider.thick {
		border-top: 2px solid var(--color-border);
	}

	.error-message {
		text-align: center;
		color: var(--color-error);
		font-weight: 700;
		font-size: 0.8rem;
		margin-top: var(--spacing-xs);
		padding: var(--spacing-xs);
		background: color-mix(in srgb, var(--color-error) 15%, transparent);
		border-radius: var(--radius-sm);
	}

	.free-message {
		text-align: center;
		color: var(--color-success);
		font-size: 0.7rem;
		margin-top: var(--spacing-xs);
	}
</style>
