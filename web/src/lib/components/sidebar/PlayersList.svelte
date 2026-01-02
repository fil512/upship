<script lang="ts">
	import type { PlayerState } from '$lib/types/game';
	import { getFactionColor, getFactionBorderColor } from '$lib/utils/factionColors';
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { FactionIconName } from '$lib/icons/types';

	export let players: Record<string, PlayerState>;
	export let playerOrder: string[];
	export let currentPlayerId: string | null = null;
	export let onlinePlayers: string[] = [];
	export let myPlayerId: string | null = null;

	function isOnline(playerId: string): boolean {
		return onlinePlayers.includes(playerId);
	}

	function getAgentsRemaining(player: PlayerState): number {
		return player.agentsRemaining ?? 3;
	}
</script>

<div class="players-panel">
	{#each playerOrder as playerId}
		{@const player = players[playerId]}
		{#if player}
			{@const factionColor = getFactionColor(player.faction)}
			{@const borderColor = getFactionBorderColor(player.faction)}
			{@const agentsRemaining = getAgentsRemaining(player)}
			<div
				class="player-card"
				class:current={playerId === currentPlayerId}
				class:me={playerId === myPlayerId}
				style:--faction-color={factionColor}
				style:--faction-border={borderColor}
			>
				<!-- Row 1: Faction icon, name, badges, and pawns -->
				<div class="player-header">
					<div class="player-identity">
						<Icon
							name={(player.faction || 'germany') as FactionIconName}
							size={24}
							color={borderColor}
						/>
						<span class="faction-name" style:color={borderColor}>
							{player.faction || 'Unknown'}
						</span>
						<span class="online-dot" class:online={isOnline(playerId)}></span>
						{#if playerId === currentPlayerId}
							<span class="badge turn">Turn</span>
						{/if}
						{#if playerId === myPlayerId}
							<span class="badge you">You</span>
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

				<!-- Row 2: Resources as icons only -->
				<div class="player-resources">
					<div class="resource" title="Cash: £{player.cash}">
						<Icon name="cash" size={14} color="var(--color-accent-gold)" />
						<span class="value">{player.cash}</span>
					</div>
					<div class="resource" title="Victory Points: {player.vp || 0}">
						<Icon name="vp" size={14} color="var(--color-success)" />
						<span class="value">{player.vp || 0}</span>
					</div>
					<div class="resource" title="Officers: {player.officers}">
						<Icon name="officers" size={14} />
						<span class="value">{player.officers}</span>
					</div>
					<div class="resource" title="Engineers: {player.engineers}">
						<Icon name="engineers" size={14} />
						<span class="value">{player.engineers}</span>
					</div>
					<div class="resource" title="Hydrogen: {player.gasCubes?.hydrogen || 0}">
						<Icon name="hydrogen" size={14} color="#1565c0" />
						<span class="value">{player.gasCubes?.hydrogen || 0}</span>
					</div>
					<div class="resource" title="Helium: {player.gasCubes?.helium || 0}">
						<Icon name="helium" size={14} color="#e65100" />
						<span class="value">{player.gasCubes?.helium || 0}</span>
					</div>
					<div class="resource" title="Ships: {player.ships?.length || 0}">
						<Icon name="ship" size={14} />
						<span class="value">{player.ships?.length || 0}</span>
					</div>
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
	}

	.player-card.current {
		background: color-mix(in srgb, var(--color-success) 10%, var(--color-bg-card));
		box-shadow: 0 0 8px color-mix(in srgb, var(--color-success) 30%, transparent);
	}

	.player-card.me {
		border-left-color: var(--color-accent-gold);
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

	.faction-name {
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: capitalize;
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

	.badge.turn {
		background: var(--color-success);
		color: white;
	}

	.badge.you {
		background: var(--color-accent-gold);
		color: var(--color-bg-primary);
	}

	.pawns {
		display: flex;
		gap: 3px;
	}

	.pawn {
		width: 14px;
		height: 18px;
		position: relative;
		/* Body - rounded bottom */
		background: inherit;
		border-radius: 3px 3px 7px 7px;
		border: 2px solid;
	}

	/* Head - circular top */
	.pawn::before {
		content: '';
		position: absolute;
		width: 10px;
		height: 10px;
		background: inherit;
		border: inherit;
		border-radius: 50%;
		top: -8px;
		left: 50%;
		transform: translateX(-50%);
	}

	/* Neck connector */
	.pawn::after {
		content: '';
		position: absolute;
		width: 6px;
		height: 4px;
		background: inherit;
		top: -2px;
		left: 50%;
		transform: translateX(-50%);
	}

	.player-resources {
		display: flex;
		flex-wrap: wrap;
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
</style>
