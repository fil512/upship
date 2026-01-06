<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';

	export let cash: number = 0;
	export let income: number = 0;
	export let officers: number = 0;
	export let engineers: number = 0;
	export let hydrogen: number = 0;
	export let helium: number = 0;
	export let vp: number = 0;

	// Net income = base income - engineer upkeep (£1 per engineer)
	$: netIncome = income - engineers;
	$: incomeTooltip = `£${income} base income - £${engineers} engineers = ${netIncome >= 0 ? '+' : ''}£${netIncome}`;
</script>

<div class="resource-panel">
	<h4>Resources</h4>

	<div class="resources-grid">
		<div class="resource cash">
			<Icon name="cash" size={24} />
			<div class="values">
				<span class="value">{cash}</span>
				<span class="income" class:negative={netIncome < 0} title={incomeTooltip}>({netIncome >= 0 ? '+' : ''}{netIncome}/turn)</span>
			</div>
			<span class="label">Cash</span>
		</div>

		<div class="resource vp">
			<Icon name="vp" size={24} />
			<span class="value">{vp}</span>
			<span class="label">VP</span>
		</div>

		<div class="resource officers">
			<Icon name="officers" size={24} />
			<span class="value">{officers}</span>
			<span class="label">Officers</span>
		</div>

		<div class="resource engineers">
			<Icon name="engineers" size={24} />
			<span class="value">{engineers}</span>
			<span class="label">Engineers</span>
		</div>

		<div class="resource hydrogen">
			<Icon name="hydrogen" size={24} color="#1565c0" />
			<span class="value">{hydrogen}</span>
			<span class="label">Hydrogen</span>
		</div>

		<div class="resource helium">
			<Icon name="helium" size={24} color="#e65100" />
			<span class="value">{helium}</span>
			<span class="label">Helium</span>
		</div>
	</div>
</div>

<style>
	.resource-panel {
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
	}

	.resource-panel h4 {
		font-size: 0.875rem;
		color: var(--color-accent-gold);
		margin-bottom: var(--spacing-sm);
	}

	.resources-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-xs);
	}

	.resource {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--spacing-sm);
		background: var(--color-bg-hover);
		border-radius: var(--radius-sm);
	}


	.values {
		display: flex;
		align-items: baseline;
		gap: 4px;
	}

	.value {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.income {
		font-size: 0.625rem;
		color: var(--color-success);
	}

	.income.negative {
		color: var(--color-error);
	}

	.label {
		font-size: 0.625rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
	}

	.resource.cash .value {
		color: var(--color-accent-gold);
	}

	.resource.vp .value {
		color: var(--color-success);
	}
</style>
