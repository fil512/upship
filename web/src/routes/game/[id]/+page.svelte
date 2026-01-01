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
		resetGameState,
		turnInfo
	} from '$lib/stores/gameState';
	import { connect, disconnect, connected, sendAction, onlinePlayers } from '$lib/stores/socket';
	import { toasts, showToast } from '$lib/stores/ui';
	import type { Card } from '$lib/types/game';

	// UI Components
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';

	// Game Components
	import Blueprint from '$lib/components/blueprint/Blueprint.svelte';
	import GroundBoard from '$lib/components/ground-board/GroundBoard.svelte';
	import HandSection from '$lib/components/cards/HandSection.svelte';
	import FleetPanel from '$lib/components/ships/FleetPanel.svelte';
	import RoutesPanel from '$lib/components/ships/RoutesPanel.svelte';

	// Sidebar Components
	import ResourcePanel from '$lib/components/sidebar/ResourcePanel.svelte';
	import TechList from '$lib/components/sidebar/TechList.svelte';
	import PlayersList from '$lib/components/sidebar/PlayersList.svelte';
	import GameLog from '$lib/components/sidebar/GameLog.svelte';

	$: gameId = $page.params.id;

	let loadingState = true;
	let connectionError: string | null = null;
	let selectedCardIndex: number | null = null;
	let selectedCardSymbol: string | null = null;

	let unsubscribe: (() => void) | null = null;

	onMount(() => {
		if (!$user) {
			goto('/');
			return;
		}

		// Check dev mode asynchronously
		fetch('/api/env')
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data) setDevMode(data.isDev);
			})
			.catch(() => setDevMode(false));

		// Set game ID and connect via Socket.io
		if (gameId && $user.id) {
			setGameId(gameId);
			connect(gameId, $user.id);
		}

		// Wait for connection
		unsubscribe = connected.subscribe((isConnected) => {
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
			if (unsubscribe) unsubscribe();
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

	// Card selection for worker placement
	function handleCardSelect(event: CustomEvent<{ index: number; card: Card }>) {
		if ($gameState?.phase !== 'worker_placement') return;

		if (selectedCardIndex === event.detail.index) {
			// Deselect
			selectedCardIndex = null;
			selectedCardSymbol = null;
		} else {
			selectedCardIndex = event.detail.index;
			selectedCardSymbol = event.detail.card.symbol;
		}
	}

	// Place agent at location
	async function handlePlaceAgent(event: CustomEvent<{ locationId: string }>) {
		if (selectedCardIndex === null) {
			showToast('Select a card first', 'warning');
			return;
		}

		const result = await sendAction({
			actionType: 'PLACE_AGENT',
			actionData: {
				locationId: event.detail.locationId,
				cardIndex: selectedCardIndex
			}
		});

		if (result.success) {
			selectedCardIndex = null;
			selectedCardSymbol = null;
		} else {
			showToast(result.error || 'Failed to place agent', 'error');
		}
	}

	async function handleEndTurn() {
		const result = await sendAction({ actionType: 'END_TURN', actionData: {} });
		if (!result.success) {
			showToast(result.error || 'Failed to end turn', 'error');
		}
	}

	async function handleUndo() {
		const result = await sendAction({ actionType: 'UNDO', actionData: {} });
		if (!result.success) {
			showToast(result.error || 'Failed to undo', 'error');
		}
	}

	// Derived values
	$: isWorkerPlacementPhase = $gameState?.phase === 'worker_placement';
	$: placements = $gameState?.groundBoard?.placements || {};
	$: routes = $gameState?.map?.routes || [];
	$: claimedRouteIds = routes.filter((r) => r.claimed).map((r) => r.id);

	// Check if viewing another player (in dev mode)
	$: isViewingOtherPlayer = $isDevMode && $effectiveUserId !== $user?.id;
	// Get raw hand value - might be a number if viewing filtered state
	$: rawHand = $myState?.hand;
	$: otherPlayerCardCount = typeof rawHand === 'number' ? rawHand : 0;
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
				{#if $myState}
					<ResourcePanel
						cash={$myState.cash}
						income={$myState.income}
						officers={$myState.officers}
						engineers={$myState.engineers}
						hydrogen={$myState.gasCubes.hydrogen}
						helium={$myState.gasCubes.helium}
						vp={$myState.vp || 0}
					/>

					<Blueprint />

					<TechList technologies={$myState.technologies || []} />
				{/if}
			</aside>

			<!-- Center - Main game board -->
			<main class="main-board">
				<div class="board-sections">
					<!-- Ground Board -->
					<section class="board-section">
						<GroundBoard
							{placements}
							players={$gameState.players}
							{selectedCardSymbol}
							isMyTurn={$isMyTurn}
							{isWorkerPlacementPhase}
							on:placeAgent={handlePlaceAgent}
						/>
					</section>

					<!-- Hand Section -->
					<section class="board-section">
						<HandSection
							hand={Array.isArray($myState?.hand) ? $myState.hand : []}
							selectedIndex={selectedCardIndex}
							selectable={$isMyTurn && isWorkerPlacementPhase}
							deckSize={typeof $myState?.deck === 'number' ? $myState.deck : ($myState?.deck?.length || 0)}
							discardSize={typeof $myState?.discardPile === 'number' ? $myState.discardPile : ($myState?.discardPile?.length || 0)}
							{isViewingOtherPlayer}
							{otherPlayerCardCount}
							on:selectCard={handleCardSelect}
						/>
					</section>

					<!-- Fleet and Routes -->
					<div class="fleet-routes-row">
						<section class="board-section fleet">
							<FleetPanel
								ships={$myState?.ships || []}
								selectable={$isMyTurn}
							/>
						</section>

						<section class="board-section routes">
							<RoutesPanel
								{routes}
								{claimedRouteIds}
								selectable={$isMyTurn}
							/>
						</section>
					</div>
				</div>
			</main>

			<!-- Right sidebar - Players & Actions -->
			<aside class="sidebar right">
				<PlayersList
					players={$gameState.players}
					playerOrder={$gameState.playerOrder}
					currentPlayerId={$currentPlayerId}
					onlinePlayers={$onlinePlayers}
					myPlayerId={$effectiveUserId}
				/>

				<div class="panel actions">
					<h3>Actions</h3>
					{#if $isMyTurn}
						{#if $turnInfo.canUndo}
							<button class="btn secondary w-full" on:click={handleUndo}>
								Undo {$turnInfo.lastActionType || ''}
							</button>
						{/if}
						{#if $turnInfo.canEndTurn}
							<button class="btn w-full" on:click={handleEndTurn}>End Turn</button>
						{/if}
					{/if}

					{#if isWorkerPlacementPhase}
						<p class="action-hint">
							{#if selectedCardIndex !== null}
								Select a location to place your agent
							{:else}
								Select a card from your hand
							{/if}
						</p>
					{:else if $gameState.phase === 'reveal'}
						<p class="action-hint">All players act simultaneously</p>
					{:else if $gameState.phase === 'income_cleanup'}
						<p class="action-hint">Collecting income...</p>
					{/if}
				</div>

				<GameLog log={$gameState.log || []} maxEntries={15} />
			</aside>
		</div>
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
		grid-template-columns: 280px 1fr 280px;
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

	/* Main board */
	.main-board {
		padding: var(--spacing-md);
		overflow-y: auto;
		background: var(--color-bg-primary);
	}

	.board-sections {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.board-section {
		/* Wrapper for each major section */
	}

	.fleet-routes-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-md);
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

	/* Button styles */
	.btn.secondary {
		background: var(--color-bg-hover);
		color: var(--color-text-secondary);
	}

	.btn.secondary:hover {
		background: var(--color-bg-card);
	}

	.w-full {
		width: 100%;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	/* Responsive */
	@media (max-width: 1200px) {
		.game-layout {
			grid-template-columns: 240px 1fr 240px;
		}
	}

	@media (max-width: 900px) {
		.game-layout {
			grid-template-columns: 1fr;
		}

		.sidebar {
			display: none;
		}

		.fleet-routes-row {
			grid-template-columns: 1fr;
		}
	}
</style>
