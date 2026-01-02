<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { GroundBoardPlacements, PlayerState } from '$lib/types/game';
	import { getFactionColor, getFactionBorderColor } from '$lib/utils/factionColors';

	export let id: string;
	export let name: string;
	export let symbol: 'wrench' | 'coin' | 'propeller';
	export let description: string;
	export let placements: GroundBoardPlacements;
	export let players: Record<string, PlayerState> = {};
	export let canPlace: boolean = false;

	const dispatch = createEventDispatcher<{
		select: { locationId: string };
	}>();

	const SYMBOL_ICONS: Record<string, string> = {
		wrench: '🔧',
		coin: '🪙',
		propeller: '⚙️'
	};

	const SYMBOL_COLORS: Record<string, string> = {
		wrench: '#4a9eff',
		coin: '#ffc107',
		propeller: '#4caf50'
	};

	$: placement = placements[id];
	$: isOccupied = !!placement;
	$: occupantPlayer = placement ? players[placement.playerId] : null;
	$: occupantFaction = occupantPlayer?.faction || null;
	$: pawnColor = getFactionColor(occupantFaction);
	$: pawnBorderColor = getFactionBorderColor(occupantFaction);

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
	title={description}
>
	<div class="location-header">
		<span class="symbol">{SYMBOL_ICONS[symbol]}</span>
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
			<div class="location-desc">{description}</div>
		{/if}
	</div>
</button>

<style>
	.location {
		display: flex;
		flex-direction: column;
		padding: var(--spacing-sm);
		background: var(--color-bg-card);
		border: 2px solid var(--color-bg-hover);
		border-radius: var(--radius-md);
		cursor: default;
		transition: all var(--transition-fast);
		text-align: left;
		min-height: 80px;
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

	.location-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-xs);
	}

	.symbol {
		font-size: 1rem;
	}

	.name {
		font-size: 0.75rem;
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

	.location-desc {
		font-size: 0.625rem;
		color: var(--color-text-muted);
		text-align: center;
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
		background-color: var(--pawn-color);
		border: 2px solid var(--pawn-border);
		border-radius: 50% 50% 45% 45%;
		position: relative;
	}

	/* Pawn head */
	.pawn::before {
		content: '';
		position: absolute;
		width: 12px;
		height: 12px;
		background-color: var(--pawn-color);
		border: 2px solid var(--pawn-border);
		border-radius: 50%;
		top: -10px;
		left: 50%;
		transform: translateX(-50%);
	}

	.agent-player {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: capitalize;
	}
</style>
