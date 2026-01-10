<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { PlayerState } from '$lib/types/game';
	import { getFactionColor, getFactionBorderColor } from '$lib/utils/factionColors';
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { FactionIconName } from '$lib/icons/types';

	export let players: Record<string, PlayerState>;
	export let playerOrder: string[];
	export let currentPlayerId: string | null = null;
	export let onlinePlayers: string[] = [];
	export let myPlayerId: string | null = null;
	export let viewedPlayerId: string | null = null;
	export let firstPlayer: string | null = null;

	const dispatch = createEventDispatcher<{
		selectPlayer: { playerId: string };
	}>();

	function handlePlayerClick(playerId: string) {
		dispatch('selectPlayer', { playerId });
	}

	function isOnline(playerId: string): boolean {
		return onlinePlayers.includes(playerId);
	}

	function getAgentsRemaining(player: PlayerState): number {
		return player.agentsRemaining ?? 3;
	}

	function getNetIncome(player: PlayerState): number {
		return (player.income || 0) - (player.engineers || 0);
	}

	function getIncomeTooltip(player: PlayerState): string {
		const baseIncome = player.income || 0;
		const engineers = player.engineers || 0;
		const net = baseIncome - engineers;
		return `£${baseIncome} base income - £${engineers} engineers = ${net >= 0 ? '+' : ''}£${net}`;
	}

	function formatIncome(value: number): string {
		return value >= 0 ? `+${value}` : `${value}`;
	}

	// Ships are now counters, not individual objects
	function getHangarShipCount(player: PlayerState): number {
		return player.hangarShips || 0;
	}
</script>

<div class="players-panel">
	{#each playerOrder as playerId}
		{@const player = players[playerId]}
		{#if player}
			{@const factionColor = getFactionColor(player.faction)}
			{@const borderColor = getFactionBorderColor(player.faction)}
			{@const agentsRemaining = getAgentsRemaining(player)}
			{@const netIncome = getNetIncome(player)}
			<div
				class="player-card"
				class:current={playerId === currentPlayerId}
				class:me={playerId === myPlayerId}
				class:viewing={playerId === viewedPlayerId}
				style:--faction-color={factionColor}
				style:--faction-border={borderColor}
				role="button"
				tabindex="0"
				on:click={() => handlePlayerClick(playerId)}
				on:keydown={(e) => e.key === 'Enter' && handlePlayerClick(playerId)}
			>
				<!-- Row 1: Chevron, Score, Flag, name, badges, pawns -->
				<div class="player-header">
					<div class="player-identity">
						{#if playerId === currentPlayerId}
							<span class="turn-chevron">▶</span>
						{/if}
						<span class="vp-score" title="Victory Points: {player.vp || 0}">{player.vp || 0}</span>
						<Icon
							name={(player.faction || 'germany') as FactionIconName}
							size={20}
							color={borderColor}
						/>
						<span class="faction-name" style:color={borderColor}>
							{player.faction || 'Unknown'}
						</span>
						{#if playerId === firstPlayer}
							<span class="start-player" title="Start Player">★</span>
						{/if}
						{#if !player.isBot}
							<span class="online-dot" class:online={isOnline(playerId)}></span>
						{/if}
						{#if playerId === myPlayerId}
							<span class="badge you">You</span>
						{/if}
						{#if player.isBot}
							<span class="badge bot">Bot</span>
						{/if}
					</div>

					<div class="pawns">
						{#each Array(agentsRemaining) as _}
							<div
								class="pawn"
								style:background-color={factionColor}
								style:border-color={borderColor}
							></div>
						{/each}
					</div>
				</div>

				<!-- Row 2: Cash, Officers, Engineers -->
				<div class="player-resources">
					<div class="resource" title={getIncomeTooltip(player)}>
						<span class="value">{player.cash}</span>
						<Icon name="cash" size={14} color="var(--color-accent-gold)" />
						<span class="income" class:negative={netIncome < 0}>{formatIncome(netIncome)}</span>
					</div>
					<div class="resource" title="Officers: {player.officers}, Income: +{player.officerIncome ?? 1}">
						<span class="value">{player.officers}</span>
						<Icon name="officers" size={14} />
						<span class="income">+{player.officerIncome ?? 1}</span>
					</div>
					<div class="resource" title="Engineers: {player.engineers}, Income: +{player.engineerIncome ?? 1}">
						<span class="value">{player.engineers}</span>
						<Icon name="engineers" size={14} />
						<span class="income">+{player.engineerIncome ?? 1}</span>
					</div>
				</div>

				<!-- Row 3: Research, Hydrogen, Helium, Ships -->
				<div class="player-resources">
					<div class="resource" title="Research Level: +{player.researchLevel || 0}">
						<Icon name="research" size={14} />
						<span class="income">+{player.researchLevel || 0}</span>
					</div>
					<div class="resource" title="Hydrogen: {player.gasCubes?.hydrogen || 0}">
						<span class="value">{player.gasCubes?.hydrogen || 0}</span>
						<Icon name="hydrogen" size={14} />
					</div>
					<div class="resource" title="Helium: {player.gasCubes?.helium || 0}">
						<span class="value">{player.gasCubes?.helium || 0}</span>
						<Icon name="helium" size={14} />
					</div>
					<div class="resource" title="Ships in Hangar: {getHangarShipCount(player)}">
						<span class="value">{getHangarShipCount(player)}</span>
						<Icon name="ship" size={14} />
					</div>
					{#if (player.insurance ?? 0) > 0}
						<div class="resource" title="Insurance Policies: {player.insurance}">
							<span class="value">{player.insurance}</span>
							<Icon name="insurance" size={14} />
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{/each}
</div>

<style>
	.players-panel {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.player-card {
		background: var(--color-bg-card);
		border-radius: var(--radius-md);
		padding: var(--spacing-sm);
		border-left: 4px solid var(--faction-border);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.player-card:hover {
		background: var(--color-bg-hover);
	}

	.player-card.current {
		background: color-mix(in srgb, var(--color-success) 10%, var(--color-bg-card));
	}

	.player-card.me {
		border-left-color: var(--color-accent-gold);
	}

	.player-card.viewing {
		outline: 2px solid var(--color-accent-gold);
		outline-offset: 1px;
	}

	.player-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--spacing-xs);
	}

	.player-identity {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.turn-chevron {
		color: var(--color-success);
		font-size: 0.7rem;
		margin-right: -2px;
	}

	.vp-score {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-success);
		min-width: 20px;
		text-align: center;
	}

	.faction-name {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: capitalize;
	}

	.start-player {
		color: var(--color-accent-gold);
		font-size: 0.75rem;
	}

	.online-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-text-muted);
	}

	.online-dot.online {
		background: var(--color-success);
	}

	.badge {
		font-size: 0.5rem;
		padding: 1px 4px;
		border-radius: 2px;
		text-transform: uppercase;
		font-weight: 700;
	}

	.badge.you {
		background: var(--color-accent-gold);
		color: var(--color-bg-primary);
	}

	.badge.bot {
		background: var(--color-info, #3b82f6);
		color: white;
	}

	.pawns {
		display: flex;
		gap: 3px;
	}

	.pawn {
		width: 12px;
		height: 16px;
		position: relative;
		background: inherit;
		border-radius: 2px 2px 6px 6px;
		border: 2px solid;
	}

	.pawn::before {
		content: '';
		position: absolute;
		width: 8px;
		height: 8px;
		background: inherit;
		border: inherit;
		border-radius: 50%;
		top: -6px;
		left: 50%;
		transform: translateX(-50%);
	}

	.pawn::after {
		content: '';
		position: absolute;
		width: 5px;
		height: 3px;
		background: inherit;
		top: -1px;
		left: 50%;
		transform: translateX(-50%);
	}

	.player-resources {
		display: flex;
		flex-wrap: nowrap;
		gap: var(--spacing-xs);
	}

	.resource {
		display: flex;
		align-items: center;
		gap: 2px;
		background: var(--color-bg-hover);
		padding: 2px 5px;
		border-radius: var(--radius-sm);
	}

	.resource .value {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-text-primary);
		min-width: 12px;
		text-align: center;
	}

	.resource .income {
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--color-success);
		margin-left: 1px;
	}

	.resource .income.negative {
		color: var(--color-error);
	}
</style>
