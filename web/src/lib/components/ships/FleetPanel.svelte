<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { PendingLaunch } from '$lib/types/game';
	import Icon from '$lib/components/ui/Icon.svelte';

	// Ships are fungible tokens - we just track counts, not individual objects
	export let hangarShips: number = 0;
	export let repairShips: number = 0;
	export let pendingLaunch: PendingLaunch | undefined = undefined;
	export let routesOwned: number = 0;  // Ships on routes (from claimed routes count)
	export let selectable: boolean = false;

	const dispatch = createEventDispatcher<{
		selectHangar: void;
		selectPendingLaunch: void;
	}>();

	function handleHangarClick() {
		if (selectable && hangarShips > 0) {
			dispatch('selectHangar');
		}
	}

	function handlePendingClick() {
		if (pendingLaunch) {
			dispatch('selectPendingLaunch');
		}
	}

	// Total ships = hangar + repair + pending + on routes
	$: totalShips = hangarShips + repairShips + (pendingLaunch ? 1 : 0) + routesOwned;
</script>

<div class="fleet-panel">
	<div class="fleet-header">
		<h4>Fleet</h4>
		<span class="ship-count">{totalShips} {totalShips === 1 ? 'ship' : 'ships'}</span>
	</div>

	{#if totalShips === 0}
		<div class="empty-fleet">No ships built yet</div>
	{:else}
		{#if hangarShips > 0}
			<button
				class="ship-group"
				class:selectable
				on:click={handleHangarClick}
				disabled={!selectable || hangarShips === 0}
			>
				<div class="group-label">
					<Icon name="ship" size={14} />
					In Hangar ({hangarShips})
				</div>
				<div class="ship-tokens">
					{#each Array(hangarShips) as _, i}
						<div class="ship-token">
							<Icon name="ship" size={20} />
						</div>
					{/each}
				</div>
			</button>
		{/if}

		{#if pendingLaunch}
			<button class="ship-group warning" on:click={handlePendingClick}>
				<div class="group-label">
					<Icon name="hazard" size={14} />
					Awaiting Hazard Check
				</div>
				<div class="pending-launch-info">
					<div class="ship-token pending">
						<Icon name="ship" size={20} />
					</div>
					<div class="launch-details">
						<span class="gas-badge" class:hydrogen={pendingLaunch.gasType === 'hydrogen'} class:helium={pendingLaunch.gasType === 'helium'}>
							<Icon name={pendingLaunch.gasType || 'hydrogen'} size={10} />
							{pendingLaunch.gasType}
						</span>
					</div>
				</div>
			</button>
		{/if}

		{#if routesOwned > 0}
			<div class="ship-group success">
				<div class="group-label">
					<Icon name="route" size={14} />
					On Routes ({routesOwned})
				</div>
				<div class="ship-tokens">
					{#each Array(routesOwned) as _, i}
						<div class="ship-token on-route">
							<Icon name="ship" size={20} />
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if repairShips > 0}
			<div class="ship-group error">
				<div class="group-label">
					<Icon name="ship" size={14} />
					In Repair ({repairShips})
				</div>
				<div class="ship-tokens">
					{#each Array(repairShips) as _, i}
						<div class="ship-token damaged">
							<Icon name="ship" size={20} />
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.fleet-panel {
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
	}

	.fleet-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--spacing-sm);
	}

	.fleet-header h4 {
		font-size: 0.875rem;
		color: var(--color-accent-gold);
	}

	.ship-count {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.empty-fleet {
		text-align: center;
		color: var(--color-text-muted);
		padding: var(--spacing-lg);
		font-size: 0.875rem;
	}

	.ship-group {
		display: block;
		width: 100%;
		margin-bottom: var(--spacing-sm);
		padding: var(--spacing-sm);
		background: var(--color-bg-hover);
		border-radius: var(--radius-sm);
		border: 2px solid transparent;
		cursor: default;
		text-align: left;
	}

	button.ship-group {
		cursor: pointer;
	}

	button.ship-group:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.ship-group.selectable {
		border-color: var(--color-accent-gold);
	}

	.ship-group.selectable:hover:not(:disabled) {
		background: var(--color-bg-card);
		transform: translateY(-1px);
	}

	.ship-group.warning {
		border-left: 3px solid var(--color-warning);
	}

	.ship-group.success {
		border-left: 3px solid var(--color-success);
	}

	.ship-group.error {
		border-left: 3px solid var(--color-error);
	}

	.group-label {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: 0.625rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		margin-bottom: var(--spacing-xs);
	}

	.ship-tokens {
		display: flex;
		gap: var(--spacing-xs);
		flex-wrap: wrap;
	}

	.ship-token {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: var(--color-bg-card);
		border: 2px solid var(--color-text-secondary);
		border-radius: var(--radius-sm);
		color: var(--color-text-primary);
	}

	.ship-token.on-route {
		border-color: var(--color-success);
		color: var(--color-success);
	}

	.ship-token.damaged {
		border-color: var(--color-error);
		color: var(--color-error);
		opacity: 0.7;
	}

	.ship-token.pending {
		border-color: var(--color-warning);
		color: var(--color-warning);
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}

	.pending-launch-info {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.launch-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.gas-badge {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.gas-badge.hydrogen {
		background: #e3f2fd;
		color: #1565c0;
	}

	.gas-badge.helium {
		background: #fff3e0;
		color: #e65100;
	}
</style>
