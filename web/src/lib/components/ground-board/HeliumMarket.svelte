<script lang="ts">
	/**
	 * HeliumMarket.svelte
	 * Brass Lancashire-style helium price tracker
	 * Cubes visually cover prices, revealing higher prices as supply depletes
	 */

	export let cubes: number[] = [0, 0, 3, 3, 3, 3];  // £1-£6 rows
	export let prices: number[] = [1, 2, 3, 4, 5, 6]; // Price per row

	// Calculate current price (lowest row with cubes)
	$: currentPrice = (() => {
		for (let i = 0; i < cubes.length; i++) {
			if (cubes[i] > 0) return prices[i];
		}
		return null; // Market is empty
	})();

	// Calculate total available cubes
	$: availableCubes = cubes.reduce((sum, c) => sum + c, 0);

	// Create array of rows for display (reversed so highest price is at top)
	$: rows = prices.map((price, index) => ({
		price,
		cubes: cubes[index],
		maxCubes: 3,
		isCurrentPrice: price === currentPrice
	})).reverse();
</script>

<div class="helium-market">
	<div class="market-header">
		<span class="market-icon">He</span>
		<span class="market-title">Helium Market</span>
	</div>

	<div class="price-track">
		{#each rows as row}
			<div class="price-row" class:current-price={row.isCurrentPrice}>
				<span class="price-label">£{row.price}</span>
				<div class="cube-slots">
					{#each Array(row.maxCubes) as _, i}
						<div
							class="cube-slot"
							class:filled={i < row.cubes}
							class:empty={i >= row.cubes}
						>
							{#if i < row.cubes}
								<div class="cube"></div>
							{/if}
						</div>
					{/each}
				</div>
				{#if row.isCurrentPrice}
					<span class="current-indicator">◀</span>
				{/if}
			</div>
		{/each}
	</div>

	<div class="market-footer">
		<div class="market-stat">
			<span class="stat-label">Current:</span>
			<span class="stat-value">
				{#if currentPrice !== null}
					£{currentPrice}/cube
				{:else}
					Empty
				{/if}
			</span>
		</div>
		<div class="market-stat">
			<span class="stat-label">Available:</span>
			<span class="stat-value">{availableCubes} cubes</span>
		</div>
	</div>
</div>

<style>
	.helium-market {
		background: var(--color-bg-card);
		border-radius: var(--radius-md);
		padding: var(--spacing-sm);
		border: 2px solid #9ca3af;
		min-width: 140px;
	}

	.market-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding-bottom: var(--spacing-xs);
		margin-bottom: var(--spacing-sm);
		border-bottom: 1px solid var(--color-border);
	}

	.market-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: #ffffff;
		color: #666666;
		border-radius: var(--radius-sm);
		border: 1px solid #666666;
		font-weight: 700;
		font-size: 0.75rem;
	}

	.market-title {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.price-track {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.price-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: 2px 4px;
		border-radius: var(--radius-sm);
		transition: background-color 0.2s ease;
	}

	.price-row.current-price {
		background: rgba(255, 255, 255, 0.15);
		border: 1px solid rgba(255, 255, 255, 0.4);
	}

	.price-label {
		font-size: 0.75rem;
		font-weight: 600;
		width: 24px;
		color: var(--color-text-secondary);
	}

	.cube-slots {
		display: flex;
		gap: 4px;
		flex: 1;
	}

	.cube-slot {
		width: 16px;
		height: 16px;
		border-radius: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
	}

	.cube-slot.filled {
		background: transparent;
	}

	.cube-slot.empty {
		background: var(--color-bg-hover);
		border: 1px dashed var(--color-border);
		opacity: 0.5;
	}

	.cube {
		width: 14px;
		height: 14px;
		background: linear-gradient(135deg, #ffffff, #e0e0e0);
		border-radius: 2px;
		border: 1px solid #999999;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.5);
	}

	.current-indicator {
		font-size: 0.7rem;
		color: var(--color-text-primary);
		font-weight: bold;
	}

	.market-footer {
		margin-top: var(--spacing-sm);
		padding-top: var(--spacing-xs);
		border-top: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.market-stat {
		display: flex;
		justify-content: space-between;
		font-size: 0.7rem;
	}

	.stat-label {
		color: var(--color-text-secondary);
	}

	.stat-value {
		font-weight: 600;
		color: var(--color-text-primary);
	}
</style>
