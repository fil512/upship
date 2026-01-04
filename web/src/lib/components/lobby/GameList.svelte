<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import GameCard from './GameCard.svelte';

	export let filter: 'open' | 'mine' = 'open';

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

	const dispatch = createEventDispatcher<{ viewGame: { gameId: string } }>();

	let games: Game[] = [];
	let isLoading = true;
	let error = '';

	async function loadGames() {
		isLoading = true;
		error = '';

		try {
			const endpoint = filter === 'mine' ? '/api/games/mine' : '/api/games?status=waiting';
			const res = await fetch(endpoint, { credentials: 'include' });

			if (!res.ok) {
				throw new Error('Failed to load games');
			}

			const data = await res.json();
			games = data.games || [];
		} catch (err) {
			console.error('Error loading games:', err);
			error = 'Failed to load games';
		} finally {
			isLoading = false;
		}
	}

	function handleViewGame(gameId: string) {
		dispatch('viewGame', { gameId });
	}

	onMount(() => {
		loadGames();
	});

	// Reload when filter changes
	$: if (filter) {
		loadGames();
	}
</script>

<div class="game-list">
	{#if isLoading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading games...</p>
		</div>
	{:else if error}
		<div class="error">
			<p>{error}</p>
			<button class="btn btn-small" on:click={loadGames}>Retry</button>
		</div>
	{:else if games.length === 0}
		<div class="empty">
			<p>
				{#if filter === 'open'}
					No open games available. Create one to get started!
				{:else}
					You haven't joined any games yet.
				{/if}
			</p>
		</div>
	{:else}
		{#each games as game (game.id)}
			<GameCard {game} isMyGame={filter === 'mine'} on:click={() => handleViewGame(game.id)} />
		{/each}
	{/if}
</div>

<style>
	.game-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.loading,
	.error,
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-xl);
		text-align: center;
		color: var(--color-text-secondary);
	}

	.error {
		color: var(--color-error);
	}
</style>
