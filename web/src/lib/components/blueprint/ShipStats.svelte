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
		frameFilled?: boolean;
		fabricFilled?: boolean;
	};

	// Compute failure reasons
	$: failureReasons = (() => {
		const reasons: string[] = [];
		if (stats.netLift < 0) reasons.push('Insufficient Lift');
		if (stats.frameFilled === false) reasons.push('Fill Frame Slots');
		if (stats.fabricFilled === false) reasons.push('Fill Fabric Slots');
		if (stats.range < 1) reasons.push('Need Range >= 1');
		if (stats.speed < 1) reasons.push('Need Speed >= 1');
		return reasons;
	})();
</script>

<div class="ship-stats">
	<!-- Lift equation row -->
	<div class="lift-equation">
		<div class="equation-labels">
			<span>LIFT</span>
			<span class="operator">-</span>
			<span>WEIGHT</span>
			<span class="operator">=</span>
			<span>NET LIFT</span>
		</div>
		<div class="equation-values">
			<span class="value">{stats.lift}</span>
			<span class="operator">-</span>
			<span class="value">{stats.weight}</span>
			<span class="operator">=</span>
			<span class="value net-lift" class:positive={stats.netLift > 0} class:negative={stats.netLift <= 0}>
				{stats.netLift > 0 ? '+' : ''}{stats.netLift}
			</span>
		</div>
	</div>

	<!-- Other stats in single column -->
	<div class="stats-list">
		<div class="stat-row" class:warning={stats.range < 1}>
			<span class="stat-label">RANGE</span>
			<span class="stat-value">{stats.range}</span>
			{#if stats.range < 1}<span class="min-req">(min 1)</span>{/if}
		</div>
		<div class="stat-row" class:warning={stats.speed < 1}>
			<span class="stat-label">SPEED</span>
			<span class="stat-value">{stats.speed}</span>
			{#if stats.speed < 1}<span class="min-req">(min 1)</span>{/if}
		</div>
		<div class="stat-row">
			<span class="stat-label">CEILING</span>
			<span class="stat-value">{stats.ceiling}</span>
		</div>
		<div class="stat-row">
			<span class="stat-label">RELIABILITY</span>
			<span class="stat-value">{stats.reliability}</span>
		</div>
		<div class="stat-row">
			<span class="stat-label">LUXURY</span>
			<span class="stat-value">{stats.luxury}</span>
		</div>
	</div>

	<div class="launch-status" class:can-launch={stats.canLaunch}>
		{#if stats.canLaunch}
			Ready to Launch
		{:else if failureReasons.length > 0}
			{failureReasons.join(' / ')}
		{:else}
			Not Ready
		{/if}
	</div>
</div>

<style>
	.ship-stats {
		/* Standalone panel styling */
	}

	/* Lift equation section */
	.lift-equation {
		background: var(--color-bg-hover);
		border-radius: var(--radius-sm);
		padding: var(--spacing-xs) var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
	}

	.equation-labels {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: 0.6rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 2px;
	}

	.equation-values {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.equation-values .value {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-text-primary);
		min-width: 24px;
		text-align: center;
	}

	.equation-labels .operator,
	.equation-values .operator {
		color: var(--color-text-muted);
		font-weight: 400;
	}

	.net-lift.positive {
		color: var(--color-success);
	}

	.net-lift.negative {
		color: var(--color-error);
	}

	/* Stats list section */
	.stats-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 3px var(--spacing-sm);
		background: var(--color-bg-hover);
		border-radius: var(--radius-sm);
	}

	.stat-label {
		font-size: 0.65rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.stat-row.warning {
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid var(--color-error);
	}

	.stat-row.warning .stat-value {
		color: var(--color-error);
	}

	.min-req {
		font-size: 0.6rem;
		color: var(--color-error);
		font-weight: 500;
		margin-left: var(--spacing-xs);
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
