<script lang="ts">
	interface Game {
		id: string;
		name: string;
		status: string;
		host_id: string;
		current_player_count: number;
		max_players: number;
		created_at: string;
	}

	export let game: Game;

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
</script>

<button class="game-card" on:click>
	<div class="game-header">
		<h3 class="game-name">{game.name}</h3>
		<span class="game-status {getStatusClass(game.status)}">{getStatusLabel(game.status)}</span>
	</div>

	<div class="game-info">
		<span class="players">
			{game.current_player_count}/{game.max_players} players
		</span>
		<span class="created">{formatDate(game.created_at)}</span>
	</div>
</button>

<style>
	.game-card {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		background: var(--color-bg-card);
		border: 2px solid transparent;
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all var(--transition-fast);
		text-align: left;
		width: 100%;
	}

	.game-card:hover {
		border-color: var(--color-accent-gold);
		transform: translateY(-2px);
	}

	.game-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.game-name {
		font-size: 1rem;
		color: var(--color-text-primary);
	}

	.game-status {
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 500;
	}

	.status-waiting {
		background: rgba(96, 165, 250, 0.2);
		color: var(--color-info);
	}

	.status-active {
		background: rgba(74, 222, 128, 0.2);
		color: var(--color-success);
	}

	.status-completed {
		background: rgba(136, 136, 136, 0.2);
		color: var(--color-text-muted);
	}

	.game-info {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}
</style>
