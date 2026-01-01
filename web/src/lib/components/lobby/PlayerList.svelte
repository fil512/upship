<script lang="ts">
	interface Player {
		id: string;
		username: string;
		faction: string | null;
	}

	export let players: Player[] = [];
	export let hostId: string;

	const factionColors: Record<string, string> = {
		germany: 'var(--color-germany)',
		britain: 'var(--color-britain)',
		usa: 'var(--color-usa)',
		italy: 'var(--color-italy)'
	};

	const factionNames: Record<string, string> = {
		germany: 'Germany',
		britain: 'Britain',
		usa: 'USA',
		italy: 'Italy'
	};
</script>

<div class="player-list">
	<h3>Players</h3>
	<div class="players">
		{#each players as player}
			<div class="player" style="--faction-color: {player.faction ? factionColors[player.faction] : 'var(--color-text-muted)'}">
				<div class="player-info">
					<span class="player-name">{player.username}</span>
					{#if player.id === hostId}
						<span class="host-badge">Host</span>
					{/if}
				</div>
				<div class="player-faction">
					{#if player.faction}
						<span class="faction-dot" style="background: {factionColors[player.faction]}"></span>
						<span>{factionNames[player.faction]}</span>
					{:else}
						<span class="no-faction">Selecting faction...</span>
					{/if}
				</div>
			</div>
		{/each}

		{#each Array(4 - players.length) as _}
			<div class="player empty">
				<span class="empty-slot">Waiting for player...</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.player-list h3 {
		font-size: 1rem;
		margin-bottom: var(--spacing-md);
	}

	.players {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.player {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-bg-card);
		border-radius: var(--radius-md);
		border-left: 3px solid var(--faction-color);
	}

	.player.empty {
		border-left-color: var(--color-bg-hover);
		opacity: 0.5;
	}

	.player-info {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.player-name {
		font-weight: 500;
	}

	.host-badge {
		padding: 2px 6px;
		background: var(--color-accent-gold);
		color: var(--color-bg-primary);
		border-radius: var(--radius-full);
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.player-faction {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: 0.875rem;
	}

	.faction-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}

	.no-faction {
		color: var(--color-text-muted);
		font-style: italic;
	}

	.empty-slot {
		color: var(--color-text-muted);
		font-style: italic;
	}
</style>
