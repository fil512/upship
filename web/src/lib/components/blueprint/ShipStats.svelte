<script lang="ts">
	export let stats: {
		lift: number;
		weight: number;
		netLift: number;
		speed: number;
		range: number;
		ceiling: number;
		reliability: number;
		luxury: number;
		canLaunch: boolean;
	};
</script>

<div class="ship-stats">
	<div class="stats-grid">
		<div class="stat" class:positive={stats.netLift > 0} class:negative={stats.netLift <= 0}>
			<span class="stat-label">Net Lift</span>
			<span class="stat-value">{stats.netLift > 0 ? '+' : ''}{stats.netLift}</span>
		</div>

		<div class="stat">
			<span class="stat-label">Lift</span>
			<span class="stat-value">{stats.lift}</span>
		</div>

		<div class="stat">
			<span class="stat-label">Weight</span>
			<span class="stat-value">{stats.weight}</span>
		</div>

		<div class="stat">
			<span class="stat-label">Range</span>
			<span class="stat-value">{stats.range}</span>
		</div>

		<div class="stat">
			<span class="stat-label">Speed</span>
			<span class="stat-value">{stats.speed}</span>
		</div>

		<div class="stat">
			<span class="stat-label">Ceiling</span>
			<span class="stat-value">{stats.ceiling}</span>
		</div>

		<div class="stat">
			<span class="stat-label">Reliability</span>
			<span class="stat-value">{stats.reliability}</span>
		</div>

		<div class="stat">
			<span class="stat-label">Luxury</span>
			<span class="stat-value">{stats.luxury}</span>
		</div>
	</div>

	<div class="launch-status" class:can-launch={stats.canLaunch}>
		{#if stats.canLaunch}
			Ready to Launch
		{:else}
			Insufficient Lift
		{/if}
	</div>
</div>

<style>
	.ship-stats {
		margin-top: var(--spacing-md);
		padding-top: var(--spacing-md);
		border-top: 1px solid var(--color-bg-hover);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--spacing-xs);
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--spacing-xs);
		background: var(--color-bg-hover);
		border-radius: var(--radius-sm);
	}

	.stat-label {
		font-size: 0.625rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.stat.positive .stat-value {
		color: var(--color-success);
	}

	.stat.negative .stat-value {
		color: var(--color-error);
	}

	.launch-status {
		margin-top: var(--spacing-sm);
		padding: var(--spacing-xs) var(--spacing-sm);
		text-align: center;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-radius: var(--radius-sm);
		background: var(--color-error);
		color: white;
	}

	.launch-status.can-launch {
		background: var(--color-success);
	}
</style>
