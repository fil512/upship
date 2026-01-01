<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/auth';
	import {
		gameState,
		gameId as gameIdStore,
		isMyTurn,
		myState,
		currentPhaseName,
		currentPlayerId,
		allPlayers,
		isDevMode,
		setDevMode,
		switchToPlayer,
		effectiveUserId,
		setGameId,
		resetGameState
	} from '$lib/stores/gameState';
	import { connect, disconnect, connected, sendAction, onlinePlayers } from '$lib/stores/socket';
	import { toasts, showToast } from '$lib/stores/ui';
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';

	// Game components (to be created in Phase 3)
	// For now, we'll show basic game info

	$: gameId = $page.params.id;

	let loadingState = true;
	let connectionError: string | null = null;

	onMount(async () => {
		if (!$user) {
			goto('/');
			return;
		}

		// Check dev mode
		try {
			const res = await fetch('/api/env');
			if (res.ok) {
				const data = await res.json();
				setDevMode(data.isDev);
			}
		} catch {
			setDevMode(false);
		}

		// Set game ID and connect via Socket.io
		setGameId(gameId);
		connect(gameId, $user.id);

		// Wait for connection
		const unsubscribe = connected.subscribe((isConnected) => {
			if (isConnected) {
				loadingState = false;
			}
		});

		// Timeout for connection
		setTimeout(() => {
			if (loadingState) {
				connectionError = 'Connection timeout';
				loadingState = false;
			}
		}, 10000);

		return () => {
			unsubscribe();
		};
	});

	onDestroy(() => {
		disconnect();
		resetGameState();
	});

	function handleBackToLobby() {
		goto('/');
	}

	function handlePlayerSwitch(event: Event) {
		const select = event.target as HTMLSelectElement;
		switchToPlayer(select.value);
	}

	async function handleEndTurn() {
		const result = await sendAction({ actionType: 'END_TURN' });
		if (!result.success) {
			showToast(result.error || 'Failed to end turn', 'error');
		}
	}

	// Get faction color
	function getFactionColor(faction: string): string {
		const colors: Record<string, string> = {
			germany: 'var(--color-germany)',
			britain: 'var(--color-britain)',
			usa: 'var(--color-usa)',
			italy: 'var(--color-italy)'
		};
		return colors[faction] || 'var(--color-text-muted)';
	}
</script>

<svelte:head>
	<title>UP SHIP! - Game</title>
</svelte:head>

{#if loadingState}
	<div class="loading-screen">
		<div class="spinner"></div>
		<p>Connecting to game...</p>
	</div>
{:else if connectionError}
	<div class="error-screen">
		<h2>Connection Error</h2>
		<p>{connectionError}</p>
		<button class="btn" on:click={handleBackToLobby}>Back to Lobby</button>
	</div>
{:else if !$gameState}
	<div class="loading-screen">
		<div class="spinner"></div>
		<p>Loading game state...</p>
	</div>
{:else}
	<div class="game-container">
		<!-- Header -->
		<header class="game-header">
			<div class="header-left">
				<button class="back-btn" on:click={handleBackToLobby}>&larr; Lobby</button>
				<div class="game-info">
					<span class="age">Age {$gameState.age}</span>
					<span class="separator">|</span>
					<span class="turn">Turn {$gameState.turn}</span>
					<span class="separator">|</span>
					<span class="phase">{$currentPhaseName}</span>
				</div>
			</div>

			<div class="header-center">
				{#if $isMyTurn}
					<div class="turn-indicator your-turn">Your Turn</div>
				{:else}
					<div class="turn-indicator waiting">
						Waiting for {$allPlayers.find((p) => p.id === $currentPlayerId)?.faction || 'player'}
					</div>
				{/if}
			</div>

			<div class="header-right">
				{#if $isDevMode}
					<select class="dev-switcher" value={$effectiveUserId} on:change={handlePlayerSwitch}>
						{#each $allPlayers as player}
							<option value={player.id}>
								{player.faction} ({player.id === $user?.id ? 'You' : 'AI'})
							</option>
						{/each}
					</select>
				{/if}

				<div class="online-indicator">
					<span class="online-dot"></span>
					{$onlinePlayers.length} online
				</div>
			</div>
		</header>

		<!-- Main game area -->
		<div class="game-layout">
			<!-- Left sidebar - Player info -->
			<aside class="sidebar left">
				<div class="panel">
					<h3>Resources</h3>
					{#if $myState}
						<div class="resource-row">
							<span class="label">Cash</span>
							<span class="value">${$myState.cash}</span>
						</div>
						<div class="resource-row">
							<span class="label">Income</span>
							<span class="value">+${$myState.income}/turn</span>
						</div>
						<div class="resource-row">
							<span class="label">Research</span>
							<span class="value">{$myState.research}</span>
						</div>
						<div class="resource-row">
							<span class="label">Influence</span>
							<span class="value">{$myState.influence}</span>
						</div>
					{/if}
				</div>

				<div class="panel">
					<h3>Crew</h3>
					{#if $myState}
						<div class="resource-row">
							<span class="label">Officers</span>
							<span class="value">{$myState.officers}</span>
						</div>
						<div class="resource-row">
							<span class="label">Engineers</span>
							<span class="value">{$myState.engineers}</span>
						</div>
						<div class="resource-row">
							<span class="label">Agents</span>
							<span class="value">{$myState.agentsRemaining}/{$myState.agents}</span>
						</div>
					{/if}
				</div>

				<div class="panel">
					<h3>Gas Reserve</h3>
					{#if $myState}
						<div class="gas-row hydrogen">
							<span class="gas-icon">H₂</span>
							<span class="gas-count">{$myState.gasCubes.hydrogen}</span>
						</div>
						<div class="gas-row helium">
							<span class="gas-icon">He</span>
							<span class="gas-count">{$myState.gasCubes.helium}</span>
						</div>
					{/if}
				</div>
			</aside>

			<!-- Center - Main game board -->
			<main class="main-board">
				<div class="placeholder-board">
					<h2>Game Board</h2>
					<p>Phase 3 will add the full game board components:</p>
					<ul>
						<li>Blueprint with upgrade slots</li>
						<li>Ground board (12 worker placement locations)</li>
						<li>Ships and routes</li>
						<li>Card hand</li>
						<li>R&D board and market</li>
					</ul>

					<div class="state-debug">
						<h4>Current State (Debug)</h4>
						<pre>{JSON.stringify(
								{
									phase: $gameState.phase,
									turn: $gameState.turn,
									age: $gameState.age,
									currentPlayer: $currentPlayerId,
									myFaction: $myState?.faction
								},
								null,
								2
							)}</pre>
					</div>
				</div>
			</main>

			<!-- Right sidebar - Players & Actions -->
			<aside class="sidebar right">
				<div class="panel">
					<h3>Players</h3>
					<div class="player-list">
						{#each $allPlayers as player}
							<div
								class="player-row"
								class:current={player.id === $currentPlayerId}
								class:online={$onlinePlayers.includes(player.id)}
							>
								<span
									class="faction-badge"
									style="background: {getFactionColor(player.faction)}"
								>
									{player.faction?.charAt(0).toUpperCase()}
								</span>
								<span class="player-name">{player.faction}</span>
								<span class="player-cash">${player.cash}</span>
							</div>
						{/each}
					</div>
				</div>

				<div class="panel actions">
					<h3>Actions</h3>
					{#if $isMyTurn && $gameState.phase !== 'reveal'}
						<button class="btn w-full" on:click={handleEndTurn}>End Turn</button>
					{/if}

					{#if $gameState.phase === 'worker_placement'}
						<p class="action-hint">Place workers or pass</p>
					{:else if $gameState.phase === 'reveal'}
						<p class="action-hint">All players act simultaneously</p>
					{:else if $gameState.phase === 'income_cleanup'}
						<p class="action-hint">Collecting income...</p>
					{/if}
				</div>

				<div class="panel">
					<h3>Technologies</h3>
					{#if $myState?.technologies?.length}
						<div class="tech-list">
							{#each $myState.technologies as techId}
								<span class="tech-badge">{techId}</span>
							{/each}
						</div>
					{:else}
						<p class="empty-state">No technologies yet</p>
					{/if}
				</div>
			</aside>
		</div>

		<!-- Game log footer -->
		<footer class="game-footer">
			<div class="log-preview">
				{#if $gameState.log?.length}
					<span class="log-entry">{$gameState.log[$gameState.log.length - 1]?.message}</span>
				{:else}
					<span class="log-entry">Game started</span>
				{/if}
			</div>
		</footer>
	</div>

	<ToastContainer />
{/if}

<style>
	.loading-screen,
	.error-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-md);
		height: 100vh;
	}

	.error-screen h2 {
		color: var(--color-error);
	}

	.game-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
	}

	/* Header */
	.game-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-bg-card);
		border-bottom: 1px solid var(--color-bg-hover);
	}

	.header-left,
	.header-right {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.back-btn {
		padding: var(--spacing-xs) var(--spacing-sm);
		background: transparent;
		border: 1px solid var(--color-bg-hover);
		border-radius: var(--radius-md);
		color: var(--color-text-secondary);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.back-btn:hover {
		border-color: var(--color-accent-gold);
		color: var(--color-accent-gold);
	}

	.game-info {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		font-size: 0.875rem;
	}

	.separator {
		color: var(--color-text-muted);
	}

	.age {
		color: var(--color-accent-gold);
		font-weight: 600;
	}

	.phase {
		color: var(--color-info);
	}

	.turn-indicator {
		padding: var(--spacing-xs) var(--spacing-md);
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.turn-indicator.your-turn {
		background: var(--color-success);
		color: var(--color-bg-primary);
		animation: pulse 2s ease-in-out infinite;
	}

	.turn-indicator.waiting {
		background: var(--color-bg-hover);
		color: var(--color-text-secondary);
	}

	.dev-switcher {
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--color-bg-tertiary);
		border: 1px solid var(--color-bg-hover);
		border-radius: var(--radius-md);
		color: var(--color-text-primary);
		font-size: 0.75rem;
	}

	.online-indicator {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.online-dot {
		width: 8px;
		height: 8px;
		background: var(--color-success);
		border-radius: 50%;
	}

	/* Layout */
	.game-layout {
		display: grid;
		grid-template-columns: 220px 1fr 260px;
		flex: 1;
		overflow: hidden;
	}

	.sidebar {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm);
		background: var(--color-bg-secondary);
		overflow-y: auto;
	}

	.panel {
		background: var(--color-bg-card);
		border-radius: var(--radius-md);
		padding: var(--spacing-sm);
	}

	.panel h3 {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		margin-bottom: var(--spacing-sm);
	}

	.resource-row {
		display: flex;
		justify-content: space-between;
		padding: var(--spacing-xs) 0;
		font-size: 0.875rem;
	}

	.resource-row .label {
		color: var(--color-text-secondary);
	}

	.resource-row .value {
		color: var(--color-accent-gold);
		font-weight: 600;
	}

	.gas-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-xs) 0;
	}

	.gas-icon {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-md);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.hydrogen .gas-icon {
		background: rgba(96, 165, 250, 0.2);
		color: var(--color-info);
	}

	.helium .gas-icon {
		background: rgba(251, 191, 36, 0.2);
		color: var(--color-warning);
	}

	.gas-count {
		font-size: 1.25rem;
		font-weight: 600;
	}

	/* Main board */
	.main-board {
		padding: var(--spacing-md);
		overflow-y: auto;
	}

	.placeholder-board {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		text-align: center;
		color: var(--color-text-secondary);
	}

	.placeholder-board h2 {
		margin-bottom: var(--spacing-md);
	}

	.placeholder-board ul {
		text-align: left;
		margin: var(--spacing-md) 0;
	}

	.placeholder-board li {
		padding: var(--spacing-xs) 0;
	}

	.state-debug {
		margin-top: var(--spacing-lg);
		padding: var(--spacing-md);
		background: var(--color-bg-card);
		border-radius: var(--radius-md);
		text-align: left;
		max-width: 400px;
	}

	.state-debug h4 {
		color: var(--color-text-muted);
		font-size: 0.75rem;
		margin-bottom: var(--spacing-sm);
	}

	.state-debug pre {
		font-size: 0.75rem;
		color: var(--color-text-primary);
		overflow-x: auto;
	}

	/* Player list */
	.player-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.player-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-xs);
		border-radius: var(--radius-sm);
		opacity: 0.6;
	}

	.player-row.online {
		opacity: 1;
	}

	.player-row.current {
		background: var(--color-bg-hover);
	}

	.faction-badge {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 600;
		color: white;
	}

	.player-name {
		flex: 1;
		font-size: 0.875rem;
		text-transform: capitalize;
	}

	.player-cash {
		font-size: 0.75rem;
		color: var(--color-accent-gold);
	}

	/* Actions panel */
	.panel.actions {
		background: var(--color-bg-tertiary);
	}

	.action-hint {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		text-align: center;
		margin-top: var(--spacing-sm);
	}

	/* Tech list */
	.tech-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	.tech-badge {
		padding: 2px 6px;
		background: var(--color-bg-hover);
		border-radius: var(--radius-sm);
		font-size: 0.625rem;
		color: var(--color-text-secondary);
	}

	.empty-state {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-style: italic;
	}

	/* Footer */
	.game-footer {
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-bg-card);
		border-top: 1px solid var(--color-bg-hover);
	}

	.log-preview {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.log-entry {
		opacity: 0.8;
	}
</style>
