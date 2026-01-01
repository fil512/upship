<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/auth';
	import FactionSelector from './FactionSelector.svelte';
	import PlayerList from './PlayerList.svelte';

	export let gameId: string;

	interface Player {
		id: string;
		username: string;
		faction: string | null;
	}

	interface Game {
		id: string;
		name: string;
		status: string;
		host_id: string;
		current_player_count: number;
		max_players: number;
		players: Player[];
	}

	const dispatch = createEventDispatcher<{ back: void }>();

	let game: Game | null = null;
	let isLoading = true;
	let error = '';
	let refreshInterval: ReturnType<typeof setInterval>;

	$: isHost = game?.host_id === $user?.id;
	$: isPlayer = game?.players.some((p) => p.id === $user?.id) ?? false;
	$: myFaction = game?.players.find((p) => p.id === $user?.id)?.faction ?? null;
	$: canStart =
		isHost &&
		game?.status === 'waiting' &&
		(game?.current_player_count ?? 0) >= 2 &&
		game?.players.every((p) => p.faction);
	$: canJoin = !isPlayer && game?.status === 'waiting' && (game?.current_player_count ?? 0) < 4;

	async function loadGame() {
		try {
			const res = await fetch(`/api/games/${gameId}`, { credentials: 'include' });

			if (!res.ok) {
				throw new Error('Failed to load game');
			}

			const data = await res.json();
			game = data.game;

			// If game is in progress, navigate to game board
			if (game?.status === 'in_progress') {
				goto(`/game/${gameId}`);
			}
		} catch (err) {
			console.error('Error loading game:', err);
			error = 'Failed to load game';
		} finally {
			isLoading = false;
		}
	}

	async function handleJoin() {
		try {
			const res = await fetch(`/api/games/${gameId}/join`, {
				method: 'POST',
				credentials: 'include'
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to join');
			}

			await loadGame();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to join game';
		}
	}

	async function handleLeave() {
		try {
			const res = await fetch(`/api/games/${gameId}/leave`, {
				method: 'POST',
				credentials: 'include'
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to leave');
			}

			dispatch('back');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to leave game';
		}
	}

	async function handleStart() {
		try {
			const res = await fetch(`/api/games/${gameId}/start`, {
				method: 'POST',
				credentials: 'include'
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to start');
			}

			goto(`/game/${gameId}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to start game';
		}
	}

	async function handleFactionSelect(event: CustomEvent<{ faction: string }>) {
		try {
			const res = await fetch(`/api/games/${gameId}/faction`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ faction: event.detail.faction })
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to select faction');
			}

			await loadGame();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to select faction';
		}
	}

	onMount(() => {
		loadGame();
		// Poll for updates while in lobby
		refreshInterval = setInterval(loadGame, 3000);
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});
</script>

<div class="game-detail">
	<button class="back-button" on:click={() => dispatch('back')}>
		&larr; Back to Lobby
	</button>

	{#if isLoading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading game...</p>
		</div>
	{:else if error}
		<div class="error">
			<p>{error}</p>
		</div>
	{:else if game}
		<div class="game-header">
			<h2>{game.name}</h2>
			<span class="player-count">{game.current_player_count}/4 players</span>
		</div>

		<PlayerList players={game.players} hostId={game.host_id} />

		{#if isPlayer && game.status === 'waiting'}
			<div class="faction-section">
				<h3>Select Your Faction</h3>
				<FactionSelector
					selectedFaction={myFaction}
					takenFactions={game.players.filter((p) => p.faction).map((p) => p.faction)}
					on:select={handleFactionSelect}
				/>
			</div>
		{/if}

		<div class="actions">
			{#if canJoin}
				<button class="btn" on:click={handleJoin}>Join Game</button>
			{/if}

			{#if isPlayer && !isHost}
				<button class="btn btn-outline" on:click={handleLeave}>Leave Game</button>
			{/if}

			{#if canStart}
				<button class="btn btn-success" on:click={handleStart}>Start Game</button>
			{:else if isHost && game.status === 'waiting'}
				<button class="btn" disabled>
					{#if (game?.current_player_count ?? 0) < 2}
						Waiting for more players...
					{:else}
						Waiting for faction selection...
					{/if}
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.game-detail {
		animation: fadeIn var(--transition-normal) ease-out;
	}

	.back-button {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-lg);
		padding: var(--spacing-sm) var(--spacing-md);
		background: transparent;
		border: none;
		color: var(--color-text-secondary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: color var(--transition-fast);
	}

	.back-button:hover {
		color: var(--color-accent-gold);
	}

	.game-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--spacing-lg);
	}

	.game-header h2 {
		font-size: 1.5rem;
	}

	.player-count {
		color: var(--color-text-secondary);
	}

	.faction-section {
		margin-top: var(--spacing-lg);
		padding: var(--spacing-md);
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
	}

	.faction-section h3 {
		font-size: 1rem;
		margin-bottom: var(--spacing-md);
	}

	.actions {
		display: flex;
		gap: var(--spacing-md);
		margin-top: var(--spacing-lg);
	}

	.loading,
	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-xl);
		text-align: center;
	}

	.error {
		color: var(--color-error);
	}
</style>
