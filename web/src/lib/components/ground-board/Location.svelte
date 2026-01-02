<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { GroundBoardPlacements, PlayerState } from '$lib/types/game';
	import { getFactionColor, getFactionBorderColor } from '$lib/utils/factionColors';
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { SymbolIconName, IconName } from '$lib/icons/types';

	export let id: string;
	export let name: string;
	export let symbol: 'wrench' | 'coin' | 'propeller';
	export let placements: GroundBoardPlacements;
	export let players: Record<string, PlayerState> = {};
	export let canPlace: boolean = false;

	// Cost and benefit data for each location (icons only, no text)
	const LOCATION_DATA: Record<
		string,
		{
			costs: Array<{ icon: IconName; amount?: string }>;
			benefits: Array<{ icon: IconName; icon2?: IconName }>;
		}
	> = {
		research_institute: {
			costs: [{ icon: 'cash', amount: '4' }],
			benefits: [{ icon: 'research' }]
		},
		design_bureau: {
			costs: [],
			benefits: [{ icon: 'blueprint' }]
		},
		construction_hall: {
			costs: [{ icon: 'cash', amount: '£' }],
			benefits: [{ icon: 'ship' }]
		},
		launchpad: {
			costs: [{ icon: 'officers' }, { icon: 'hydrogen' }],
			benefits: [{ icon: 'launch' }]
		},
		academy: {
			costs: [{ icon: 'cash', amount: '2/4' }],
			benefits: [{ icon: 'officers', icon2: 'engineers' }]
		},
		flight_school: {
			costs: [{ icon: 'cash', amount: '5' }],
			benefits: [{ icon: 'income', icon2: 'officers' }]
		},
		technical_institute: {
			costs: [{ icon: 'cash', amount: '6' }],
			benefits: [{ icon: 'income', icon2: 'engineers' }]
		},
		government_liaison: {
			costs: [{ icon: 'officers', amount: '1-3' }],
			benefits: [{ icon: 'cash' }]
		},
		ministry: {
			costs: [],
			benefits: [{ icon: 'politics' }]
		},
		gas_depot: {
			costs: [{ icon: 'cash' }],
			benefits: [{ icon: 'hydrogen', icon2: 'helium' }]
		},
		insurance_bureau: {
			costs: [{ icon: 'income', amount: '-1' }],
			benefits: [{ icon: 'insurance' }]
		},
		weather_bureau: {
			costs: [{ icon: 'cash', amount: '2' }],
			benefits: [{ icon: 'eye', icon2: 'hazard' }]
		}
	};

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
		{#each locationData.costs as cost}
			<div class="cost-item" title={cost.icon}>
				<Icon name={cost.icon} size={14} />
				{#if cost.amount}
					<span class="cost-amount">{cost.amount}</span>
				{/if}
			</div>
		{/each}
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
					{#each locationData.benefits as benefit}
						<div class="benefit-item">
							<Icon name={benefit.icon} size={24} color="var(--color-text-primary)" />
							{#if benefit.icon2}
								<Icon name={benefit.icon2} size={20} color="var(--color-text-primary)" />
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
		width: 40px;
		min-width: 40px;
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
