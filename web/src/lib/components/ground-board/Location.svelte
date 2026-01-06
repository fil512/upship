<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { GroundBoardPlacements, PlayerState } from '$lib/types/game';
	import { getFactionColor, getFactionBorderColor } from '$lib/utils/factionColors';
	import Icon from '$lib/components/ui/Icon.svelte';
	import ResourceBadge from '$lib/components/ui/ResourceBadge.svelte';
	import type { SymbolIconName, IconName } from '$lib/icons/types';

	export let id: string;
	export let name: string;
	export let symbol: 'wrench' | 'coin' | 'propeller';
	export let placements: GroundBoardPlacements;
	export let players: Record<string, PlayerState> = {};
	export let canPlace: boolean = false;
	export let hullCost: number | undefined = undefined;
	export let heliumPrice: number | undefined = undefined;

	// Cost and benefit data for each location
	// resourceBadge: array of {type, value} for ResourceBadge display
	// icons: simple icon display without numbers
	type CostItem = { icon: IconName; amount?: string } | { resourceBadge: Array<{ type: 'cash' | 'officers'; value: number }>; separator?: string };
	type BenefitItem = { icon: IconName; icon2?: IconName; separator?: boolean; resourceBadge?: { type: 'officers' | 'engineers'; count: number }; arrow?: boolean } | { resourceBadge: { type: 'officers' | 'engineers'; count: number }; icon2Badge?: { type: 'officers' | 'engineers'; count: number }; separator?: boolean };

	const LOCATION_DATA: Record<
		string,
		{
			costs: CostItem[];
			benefits: BenefitItem[];
		}
	> = {
		research_institute: {
			costs: [{ resourceBadge: [{ type: 'cash', value: 4 }] }],
			benefits: [{ icon: 'research' }]
		},
		blueprint_design: {
			costs: [],
			benefits: [{ icon: 'blueprint' }]
		},
		construction_hall: {
			costs: [{ icon: 'cash' }],
			benefits: [{ icon: 'ship' }]
		},
		launchpad: {
			costs: [{ resourceBadge: [{ type: 'officers', value: 1 }] }, { icon: 'hydrogen' }],
			benefits: [{ icon: 'launch' }]
		},
		academy: {
			costs: [{ resourceBadge: [{ type: 'cash', value: 2 }, { type: 'cash', value: 4 }] }],
			benefits: [{ resourceBadge: { type: 'officers', count: 1 }, icon2Badge: { type: 'engineers', count: 1 }, separator: true }]
		},
		flight_school: {
			costs: [{ resourceBadge: [{ type: 'cash', value: 5 }] }],
			benefits: [{ icon: 'income', resourceBadge: { type: 'officers', count: 1 }, arrow: true }]
		},
		technical_institute: {
			costs: [{ resourceBadge: [{ type: 'cash', value: 6 }] }],
			benefits: [{ icon: 'income', resourceBadge: { type: 'engineers', count: 1 }, arrow: true }]
		},
		government_liaison: {
			costs: [{ resourceBadge: [{ type: 'officers', value: 1 }, { type: 'officers', value: 3 }], separator: '-' }],
			benefits: [{ icon: 'cash' }]
		},
		ministry: {
			costs: [],
			benefits: [{ icon: 'politics' }]
		},
		gas_depot: {
			costs: [{ icon: 'cash' }],
			benefits: [{ icon: 'hydrogen', icon2: 'helium', separator: true }]
		},
		insurance_bureau: {
			costs: [{ icon: 'income', amount: '-1' }],
			benefits: [{ icon: 'insurance' }]
		},
		weather_bureau: {
			costs: [{ resourceBadge: [{ type: 'cash', value: 2 }] }],
			benefits: [{ icon: 'eye', icon2: 'hazard' }]
		}
	};

	// Type guards
	function hasResourceBadge(item: CostItem): item is { resourceBadge: Array<{ type: 'cash' | 'officers'; value: number }>; separator?: string } {
		return 'resourceBadge' in item;
	}

	function hasIconWithArrow(item: BenefitItem): item is { icon: IconName; resourceBadge: { type: 'officers' | 'engineers'; count: number }; arrow: true } {
		return 'icon' in item && 'arrow' in item && item.arrow === true;
	}

	function hasBenefitResourceBadge(item: BenefitItem): item is { resourceBadge: { type: 'officers' | 'engineers'; count: number }; icon2Badge?: { type: 'officers' | 'engineers'; count: number }; separator?: boolean } {
		return 'resourceBadge' in item;
	}

	const SYMBOL_COLORS: Record<string, string> = {
		wrench: '#4a9eff',    // Blue
		coin: '#ffc107',      // Gold
		propeller: '#ffffff'  // White
	};

	const dispatch = createEventDispatcher<{
		select: { locationId: string };
	}>();

	$: locationData = LOCATION_DATA[id] || { costs: [], benefits: [] };
	$: placement = placements[id];
	$: isOccupied = !!placement;
	$: occupantPlayer = placement ? players[placement.playerId] : null;
	$: occupantFaction = occupantPlayer?.faction || null;
	$: pawnColor = getFactionColor(occupantFaction ?? undefined);
	$: pawnBorderColor = getFactionBorderColor(occupantFaction ?? undefined);

	function handleClick() {
		if (canPlace && !isOccupied) {
			dispatch('select', { locationId: id });
		}
	}
</script>

<button
	class="location"
	class:occupied={isOccupied}
	class:available={canPlace && !isOccupied}
	style:--symbol-color={SYMBOL_COLORS[symbol]}
	on:click={handleClick}
	disabled={isOccupied || !canPlace}
>
	<!-- Cost bar on the left (includes card symbol requirement) -->
	<div class="location-cost-bar">
		<div class="cost-item symbol-cost" title="Requires {symbol} card">
			<Icon name={symbol as SymbolIconName} size={16} color="var(--symbol-color)" />
		</div>
		{#if id === 'gas_depot' && heliumPrice !== undefined}
			<!-- Gas Depot: show H:1 and He:X prices -->
			<div class="cost-item gas-prices">
				<div class="gas-price-row">
					<Icon name="hydrogen" size={12} />
					<span class="gas-price-value">1</span>
				</div>
				<div class="gas-price-row">
					<Icon name="helium" size={12} />
					<span class="gas-price-value">{heliumPrice}</span>
				</div>
			</div>
		{:else}
			{#each locationData.costs as cost, i (i)}
				{#if hasResourceBadge(cost)}
					<div class="cost-item resource-cost">
						{#each cost.resourceBadge as badge, j (j)}
							{#if j > 0}<span class="cost-separator">{cost.separator || '/'}</span>{/if}
							<ResourceBadge type={badge.type} value={badge.value} size={14} />
						{/each}
					</div>
				{:else if id === 'construction_hall' && cost.icon === 'cash' && hullCost !== undefined}
					<!-- Dynamic hull cost display for Construction Hall -->
					<div class="cost-item resource-cost">
						<ResourceBadge type="cash" value={hullCost} size={14} />
					</div>
				{:else}
					<div class="cost-item icon-cost" title={cost.icon}>
						<Icon name={cost.icon} size={14} />
						{#if cost.amount}
							<span class="cost-amount">{cost.amount}</span>
						{/if}
					</div>
				{/if}
			{/each}
		{/if}
	</div>

	<!-- Main content section -->
	<div class="location-main">
		<div class="location-header">
			<span class="name">{name}</span>
		</div>

		<div class="location-content">
			{#if isOccupied && placement}
				<div class="agent-marker">
					<div
						class="pawn"
						style:--pawn-color={pawnColor}
						style:--pawn-border={pawnBorderColor}
					></div>
					<span class="agent-player" style:color={pawnBorderColor}>{occupantFaction}</span>
				</div>
			{:else if canPlace}
				<div class="place-hint">Click to place</div>
			{:else}
				<div class="location-benefit">
					{#each locationData.benefits as benefit, i (i)}
						<div class="benefit-item">
							{#if hasIconWithArrow(benefit)}
								<Icon name={benefit.icon} size={18} color="var(--color-text-primary)" />
								<ResourceBadge type={benefit.resourceBadge.type} value={benefit.resourceBadge.count} size={16} />
							{:else if hasBenefitResourceBadge(benefit)}
								<ResourceBadge type={benefit.resourceBadge.type} value={benefit.resourceBadge.count} size={16} />
								{#if benefit.separator}
									<span class="benefit-separator">/</span>
								{/if}
								{#if benefit.icon2Badge}
									<ResourceBadge type={benefit.icon2Badge.type} value={benefit.icon2Badge.count} size={16} />
								{/if}
							{:else}
								<Icon name={benefit.icon} size={24} color="var(--color-text-primary)" />
								{#if benefit.icon2}
									{#if benefit.separator}
										<span class="benefit-separator">/</span>
									{/if}
									<Icon name={benefit.icon2} size={20} color="var(--color-text-primary)" />
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</button>

<style>
	.location {
		display: flex;
		flex-direction: row;
		background: var(--color-bg-card);
		border: 2px solid var(--color-bg-hover);
		border-radius: var(--radius-md);
		cursor: default;
		transition: all var(--transition-fast);
		text-align: left;
		min-height: 80px;
		overflow: hidden;
	}

	.location.available {
		cursor: pointer;
		border-color: var(--symbol-color);
		box-shadow: 0 0 8px color-mix(in srgb, var(--symbol-color) 30%, transparent);
	}

	.location.available:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px color-mix(in srgb, var(--symbol-color) 40%, transparent);
	}

	.location.occupied {
		opacity: 0.7;
	}

	.location:disabled {
		cursor: not-allowed;
	}

	/* Cost bar on the left */
	.location-cost-bar {
		width: 64px;
		min-width: 64px;
		background: var(--color-bg-tertiary);
		border-right: 2px solid var(--symbol-color);
		padding: var(--spacing-xs);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}

	.cost-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1px;
		background: rgba(0, 0, 0, 0.3);
		padding: 3px 4px;
		border-radius: var(--radius-sm);
	}

	.cost-amount {
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.cost-separator {
		font-size: 0.6rem;
		font-weight: 300;
		color: var(--color-text-muted);
	}

	.resource-cost {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 2px;
	}

	.icon-cost {
		flex-direction: row;
		gap: 2px;
	}

	.gas-prices {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 4px;
	}

	.gas-price-row {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.gas-price-value {
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.symbol-cost {
		border-bottom: 1px solid var(--symbol-color);
		padding-bottom: 4px;
		margin-bottom: 2px;
	}

	/* Main content section */
	.location-main {
		flex: 1;
		padding: var(--spacing-sm);
		display: flex;
		flex-direction: column;
	}

	.location-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-xs);
	}

	.name {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--symbol-color);
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.location-content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.location-benefit {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.benefit-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.benefit-separator {
		font-size: 1rem;
		font-weight: 300;
		color: var(--color-text-muted);
	}

	.benefit-arrow {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-accent-gold);
	}

	.place-hint {
		font-size: 0.75rem;
		color: var(--symbol-color);
		font-weight: 500;
	}

	.agent-marker {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.pawn {
		width: 20px;
		height: 24px;
		position: relative;
		/* Body - rounded bottom */
		background-color: var(--pawn-color);
		border: 2px solid var(--pawn-border);
		border-radius: 4px 4px 10px 10px;
	}

	/* Pawn head */
	.pawn::before {
		content: '';
		position: absolute;
		width: 14px;
		height: 14px;
		background-color: var(--pawn-color);
		border: 2px solid var(--pawn-border);
		border-radius: 50%;
		top: -11px;
		left: 50%;
		transform: translateX(-50%);
	}

	/* Neck connector */
	.pawn::after {
		content: '';
		position: absolute;
		width: 8px;
		height: 5px;
		background-color: var(--pawn-color);
		top: -3px;
		left: 50%;
		transform: translateX(-50%);
	}

	.agent-player {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: capitalize;
	}
</style>
