<script lang="ts">
	import type { PlayerState } from '$lib/types/game';
	import { getFactionColor, getFactionBorderColor } from '$lib/utils/factionColors';

	export let players: Record<string, PlayerState>;
	export let playerOrder: string[];
	export let currentPlayerId: string | null = null;

	// Calculate agents remaining for each player
	function getAgentsRemaining(player: PlayerState): number {
		return player.agentsRemaining ?? 3; // Default to 3 if not set
	}
</script>

<div class="pawn-tracker">
	<h4>Agents</h4>

	<div class="player-pawns">
		{#each playerOrder as playerId}
			{@const player = players[playerId]}
			{#if player}
				{@const agentsRemaining = getAgentsRemaining(player)}
				{@const factionColor = getFactionColor(player.faction)}
				{@const borderColor = getFactionBorderColor(player.faction)}
				<div class="player-row" class:current={playerId === currentPlayerId}>
					<span class="faction-name" style:color={borderColor}>
						{player.faction || 'Unknown'}
					</span>
					<div class="pawns">
						{#each Array(agentsRemaining) as _, i}
							<div
								class="pawn"
								style:background-color={factionColor}
								style:border-color={borderColor}
							></div>
						{/each}
						{#if agentsRemaining === 0}
							<span class="no-pawns">-</span>
						{/if}
					</div>
				</div>
			{/if}
		{/each}
	</div>
</div>

<style>
	.pawn-tracker {
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-sm);
	}

	.pawn-tracker h4 {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		margin-bottom: var(--spacing-sm);
	}

	.player-pawns {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.player-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-xs);
		border-radius: var(--radius-sm);
		background: var(--color-bg-hover);
	}

	.player-row.current {
		background: color-mix(in srgb, var(--color-success) 15%, var(--color-bg-hover));
	}

	.faction-name {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: capitalize;
	}

	.pawns {
		display: flex;
		gap: 4px;
		align-items: center;
	}

	.pawn {
		width: 16px;
		height: 20px;
		border-radius: 50% 50% 45% 45%;
		border: 2px solid;
		position: relative;
	}

	/* Pawn head */
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

	.no-pawns {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}
</style>
