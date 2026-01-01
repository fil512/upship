<script lang="ts">
	import type { PlayerState, GameState } from '$lib/types/game';

	export let players: Record<string, PlayerState>;
	export let playerOrder: string[];
	export let currentPlayerId: string | null = null;
	export let onlinePlayers: string[] = [];
	export let myPlayerId: string | null = null;

	function getPlayerName(playerId: string): string {
		const player = players[playerId];
		return player?.faction || playerId.substring(0, 8);
	}

	function isOnline(playerId: string): boolean {
		return onlinePlayers.includes(playerId);
	}
</script>

<div class="players-list">
	<h4>Players</h4>

	<div class="players">
		{#each playerOrder as playerId}
			{@const player = players[playerId]}
			{#if player}
				<div
					class="player-item"
					class:current={playerId === currentPlayerId}
					class:me={playerId === myPlayerId}
				>
					<div class="player-header">
						<span class="online-indicator" class:online={isOnline(playerId)}></span>
						<span class="faction">{player.faction || 'Unknown'}</span>
						{#if playerId === currentPlayerId}
							<span class="turn-badge">Turn</span>
						{/if}
						{#if playerId === myPlayerId}
							<span class="me-badge">You</span>
						{/if}
					</div>

					<div class="player-stats">
						<span class="stat">💷 {player.cash}</span>
						<span class="stat">⭐ {player.vp || 0}</span>
						<span class="stat">🚢 {player.ships?.length || 0}</span>
					</div>
				</div>
			{/if}
		{/each}
	</div>
</div>

<style>
	.players-list {
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
	}

	.players-list h4 {
		font-size: 0.875rem;
		color: var(--color-accent-gold);
		margin-bottom: var(--spacing-sm);
	}

	.players {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.player-item {
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--color-bg-hover);
		border-radius: var(--radius-sm);
		border-left: 3px solid transparent;
	}

	.player-item.current {
		border-left-color: var(--color-success);
		background: color-mix(in srgb, var(--color-success) 10%, var(--color-bg-hover));
	}

	.player-item.me {
		border-left-color: var(--color-accent-gold);
	}

	.player-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		margin-bottom: 2px;
	}

	.online-indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-text-muted);
	}

	.online-indicator.online {
		background: var(--color-success);
	}

	.faction {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-primary);
		text-transform: capitalize;
	}

	.turn-badge {
		font-size: 0.5rem;
		padding: 1px 4px;
		background: var(--color-success);
		color: white;
		border-radius: 2px;
		text-transform: uppercase;
		font-weight: 600;
	}

	.me-badge {
		font-size: 0.5rem;
		padding: 1px 4px;
		background: var(--color-accent-gold);
		color: var(--color-bg);
		border-radius: 2px;
		text-transform: uppercase;
		font-weight: 600;
	}

	.player-stats {
		display: flex;
		gap: var(--spacing-sm);
	}

	.stat {
		font-size: 0.625rem;
		color: var(--color-text-secondary);
	}
</style>
