<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/auth';
	import FactionSelector from './FactionSelector.svelte';
	import PlayerList from './PlayerList.svelte';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

	export let gameId: string;

	interface Player {
		id: string;
		username: string;
		faction: string | null;
		isBot?: boolean;
		botName?: string;
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
	let selectedFaction: string | null = null; // For non-players selecting faction before joining
	let isJoining = false;
	let isLeaving = false;
	let isStarting = false;
	let isSelectingFaction = false;
	let isAddingBot = false;
	let removingBotId: string | null = null;

	$: isHost = game?.host_id === $user?.id;
	$: isPlayer = game?.players.some((p) => p.id === $user?.id) ?? false;
	$: myFaction = game?.players.find((p) => p.id === $user?.id)?.faction ?? null;
	$: canStart =
		isHost &&
		game?.status === 'waiting' &&
		(game?.current_player_count ?? 0) >= 2 &&
		game?.players.every((p) => p.faction);
	$: canJoin = !isPlayer && game?.status === 'waiting' && (game?.current_player_count ?? 0) < 4;
	$: takenFactions = game?.players.filter((p) => p.faction).map((p) => p.faction) ?? [];
	$: availableFactions = ['germany', 'britain', 'usa', 'italy'].filter(
		(f) => !takenFactions.includes(f)
	);
	$: canAddBot =
		isHost && game?.status === 'waiting' && (game?.current_player_count ?? 0) < 4;

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
		if (!selectedFaction) return;

		isJoining = true;
		try {
			const res = await fetch(`/api/games/${gameId}/join`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ faction: selectedFaction })
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to join');
			}

			// Navigate directly to game page (waiting room mode)
			goto(`/game/${gameId}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to join game';
			isJoining = false;
		}
	}

	function handleFactionPreselect(event: CustomEvent<{ faction: string }>) {
		selectedFaction = event.detail.faction;
	}

	async function handleLeave() {
		isLeaving = true;
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
		} finally {
			isLeaving = false;
		}
	}

	async function handleStart() {
		isStarting = true;
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
			isStarting = false;
		}
	}

	async function handleFactionSelect(event: CustomEvent<{ faction: string }>) {
		isSelectingFaction = true;
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
		} finally {
			isSelectingFaction = false;
		}
	}

	async function handleAddBot(faction: string) {
		isAddingBot = true;
		error = '';
		try {
			const res = await fetch(`/api/games/${gameId}/bot`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ faction })
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to add bot');
			}

			await loadGame();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to add bot';
		} finally {
			isAddingBot = false;
		}
	}

	async function handleRemoveBot(botId: string) {
		removingBotId = botId;
		error = '';
		try {
			const res = await fetch(`/api/games/${gameId}/bot/${botId}`, {
				method: 'DELETE',
				credentials: 'include'
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to remove bot');
			}

			await loadGame();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to remove bot';
		} finally {
			removingBotId = null;
		}
	}

	function getFactionIcon(faction: string): string {
		const icons: Record<string, string> = {
			germany: '🇩🇪',
			britain: '🇬🇧',
			usa: '🇺🇸',
			italy: '🇮🇹'
		};
		return icons[faction] || '🏳️';
	}

	function formatFaction(faction: string): string {
		const names: Record<string, string> = {
			germany: 'Germany',
			britain: 'Britain',
			usa: 'USA',
			italy: 'Italy'
		};
		return names[faction] || faction;
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
			<LoadingSpinner size="lg" label="Loading game..." showLabel={true} />
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

		<PlayerList
			players={game.players}
			hostId={game.host_id}
			showRemoveBot={isHost}
			{removingBotId}
			on:removeBot={(e) => handleRemoveBot(e.detail.botId)}
		/>

		<!-- Add Bot section for host -->
		{#if canAddBot && availableFactions.length > 0}
			<div class="bot-section">
				<h3>Add Bot Opponent</h3>
				<div class="bot-buttons">
					{#each availableFactions as faction}
						<button
							class="btn btn-outline faction-btn faction-{faction}"
							on:click={() => handleAddBot(faction)}
							disabled={isAddingBot}
						>
							{#if isAddingBot}
								<LoadingSpinner size="sm" />
							{:else}
								<span class="faction-icon">{getFactionIcon(faction)}</span>
								Add {formatFaction(faction)} Bot
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Faction selector for non-players wanting to join -->
		{#if canJoin}
			<div class="faction-section">
				<h3>Choose Your Faction to Join</h3>
				<FactionSelector
					selectedFaction={selectedFaction}
					{takenFactions}
					on:select={handleFactionPreselect}
				/>
			</div>
		{/if}

		<!-- Faction selector for players who joined without faction (legacy/host) -->
		{#if isPlayer && game.status === 'waiting' && !myFaction}
			<div class="faction-section">
				<h3>Select Your Faction</h3>
				<FactionSelector
					selectedFaction={myFaction}
					{takenFactions}
					on:select={handleFactionSelect}
				/>
			</div>
		{/if}

		<div class="actions">
			<!-- JOIN button for non-players (only after selecting faction) -->
			{#if canJoin && selectedFaction}
				<button class="btn btn-success" on:click={handleJoin} disabled={isJoining}>
					{#if isJoining}
						<LoadingSpinner size="sm" />
						Joining...
					{:else}
						JOIN
					{/if}
				</button>
			{/if}

			{#if isPlayer && !isHost}
				<button class="btn btn-outline" on:click={handleLeave} disabled={isLeaving}>
					{#if isLeaving}
						<LoadingSpinner size="sm" />
						Leaving...
					{:else}
						Leave Game
					{/if}
				</button>
			{/if}

			{#if canStart}
				<button class="btn btn-success" on:click={handleStart} disabled={isStarting}>
					{#if isStarting}
						<LoadingSpinner size="sm" />
						Starting...
					{:else}
						Start Game
					{/if}
				</button>
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

	.bot-section {
		margin-top: var(--spacing-lg);
		padding: var(--spacing-md);
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		border: 1px dashed var(--color-border);
	}

	.bot-section h3 {
		font-size: 1rem;
		margin-bottom: var(--spacing-md);
		color: var(--color-text-secondary);
	}

	.bot-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
	}

	.faction-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		font-size: 0.875rem;
	}

	.faction-icon {
		font-size: 1rem;
	}

	.faction-germany {
		border-color: #444;
	}
	.faction-britain {
		border-color: #1e4785;
	}
	.faction-usa {
		border-color: #b22234;
	}
	.faction-italy {
		border-color: #008c45;
	}
</style>
