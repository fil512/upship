<script lang="ts">
	interface Game {
		id: string;
		name: string;
		status: string;
		host_id: string;
		current_player_count: number;
		max_players: number;
		created_at: string;
		isMyTurn?: boolean;
		age?: number | null;
		round?: number | null;
		my_faction?: string | null;
	}

	export let game: Game;
	export let isMyGame: boolean = false;

	const factionLabels: Record<string, string> = {
		germany: 'Germany',
		britain: 'Britain',
		usa: 'USA',
		italy: 'Italy'
	};

	const factionColors: Record<string, string> = {
		germany: '#dc2626',
		britain: '#2563eb',
		usa: '#16a34a',
		italy: '#ca8a04'
	};

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusClass(status: string): string {
		switch (status) {
			case 'waiting':
				return 'status-waiting';
			case 'in_progress':
				return 'status-active';
			case 'completed':
				return 'status-completed';
			default:
				return '';
		}
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'waiting':
				return 'Waiting';
			case 'in_progress':
				return 'In Progress';
			case 'completed':
				return 'Completed';
			default:
				return status;
		}
	}

	function getButtonText(): string {
		if (!isMyGame) {
			return 'Join';
		}
		if (game.status === 'in_progress' && game.isMyTurn) {
			return 'Play your turn';
		}
		return 'View';
	}
</script>

<button class="game-card" class:my-turn={isMyGame && game.isMyTurn} on:click>
	<div class="game-header">
		<h3 class="game-name">{game.name}</h3>
		<span class="game-status {getStatusClass(game.status)}">{getStatusLabel(game.status)}</span>
	</div>

	{#if isMyGame && game.status === 'in_progress' && game.my_faction}
		<div class="game-details">
			<span class="faction" style="--faction-color: {factionColors[game.my_faction] || '#888'}">
				{factionLabels[game.my_faction] || game.my_faction}
			</span>
			{#if game.age && game.round}
				<span class="progress">Age {game.age} · Round {game.round}</span>
			{/if}
		</div>
	{/if}

	<div class="game-info">
		<span class="players">
			{game.current_player_count}/{game.max_players} players
		</span>
		<span class="action-text" class:highlight={isMyGame && game.isMyTurn}>{getButtonText()}</span>
	</div>
</button>

<style>
	.game-card {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: var(--spacing-md) var(--spacing-lg);
		background: rgba(42, 42, 78, 0.4);
		backdrop-filter: blur(4px);
		border: 1px solid rgba(196, 163, 90, 0.2);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all var(--transition-normal);
		text-align: left;
		width: 100%;
	}

	.game-card:hover {
		border-color: var(--color-accent-gold);
		background: rgba(58, 58, 94, 0.5);
		transform: translateY(-4px);
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
	}

	.game-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.game-name {
		font-family: 'Cinzel', serif;
		font-size: 1.25rem;
		color: var(--color-accent-gold);
		letter-spacing: 0.05em;
	}

	.game-status {
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		font-family: 'Cinzel', serif;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-waiting {
		background: rgba(96, 165, 250, 0.15);
		color: var(--color-info);
		border: 1px solid rgba(96, 165, 250, 0.3);
	}

	.status-active {
		background: rgba(74, 222, 128, 0.15);
		color: var(--color-success);
		border: 1px solid rgba(74, 222, 128, 0.3);
	}

	.status-completed {
		background: rgba(136, 136, 136, 0.15);
		color: var(--color-text-muted);
		border: 1px solid rgba(136, 136, 136, 0.3);
	}

	.game-details {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		font-size: 0.85rem;
		margin: var(--spacing-xs) 0;
	}

	.faction {
		color: var(--faction-color);
		font-weight: 700;
		font-family: 'Cinzel', serif;
	}

	.progress {
		color: var(--color-text-primary);
		opacity: 0.8;
	}

	.game-info {
		display: flex;
		justify-content: space-between;
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		margin-top: var(--spacing-xs);
	}

	.action-text {
		font-weight: 700;
		font-family: 'Cinzel', serif;
		text-transform: uppercase;
		font-size: 0.8rem;
		letter-spacing: 0.1em;
	}

	.action-text.highlight {
		color: var(--color-accent-gold);
		text-shadow: 0 0 10px rgba(196, 163, 90, 0.4);
	}

	.game-card.my-turn {
		border-color: var(--color-accent-gold);
		background: rgba(58, 58, 94, 0.6);
		box-shadow: 0 0 20px rgba(196, 163, 90, 0.2);
	}
</style>
