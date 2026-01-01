<script lang="ts">
	export let cash: number = 0;
	export let income: number = 0;
	export let officers: number = 0;
	export let engineers: number = 0;
	export let hydrogen: number = 0;
	export let helium: number = 0;
	export let vp: number = 0;
</script>

<div class="resource-panel">
	<h4>Resources</h4>

	<div class="resources-grid">
		<div class="resource cash">
			<span class="icon">💷</span>
			<div class="values">
				<span class="value">{cash}</span>
				<span class="income">(+{income}/turn)</span>
			</div>
			<span class="label">Cash</span>
		</div>

		<div class="resource vp">
			<span class="icon">⭐</span>
			<span class="value">{vp}</span>
			<span class="label">VP</span>
		</div>

		<div class="resource officers">
			<span class="icon">👨‍✈️</span>
			<span class="value">{officers}</span>
			<span class="label">Officers</span>
		</div>

		<div class="resource engineers">
			<span class="icon">👷</span>
			<span class="value">{engineers}</span>
			<span class="label">Engineers</span>
		</div>

		<div class="resource hydrogen">
			<span class="icon gas-h2">H₂</span>
			<span class="value">{hydrogen}</span>
			<span class="label">Hydrogen</span>
		</div>

		<div class="resource helium">
			<span class="icon gas-he">He</span>
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

	.icon {
		font-size: 1.25rem;
		margin-bottom: 2px;
	}

	.gas-h2 {
		font-size: 1rem;
		font-weight: bold;
		color: #1565c0;
		background: #e3f2fd;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.gas-he {
		font-size: 1rem;
		font-weight: bold;
		color: #e65100;
		background: #fff3e0;
		padding: 2px 6px;
		border-radius: 4px;
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
