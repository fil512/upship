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
	import { connect, disconnect, connected, sendAction, onlinePlayers, gameError } from '$lib/stores/socket';
	import { toasts, showToast } from '$lib/stores/ui';
	import type { Card } from '$lib/types/game';

	// UI Components
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';

	// Game Components
	import Blueprint from '$lib/components/blueprint/Blueprint.svelte';
	import AirshipBlueprint from '$lib/components/blueprint/AirshipBlueprint.svelte';
	import ShipStats from '$lib/components/blueprint/ShipStats.svelte';
	import { openModal } from '$lib/stores/ui';
	import GroundBoard from '$lib/components/ground-board/GroundBoard.svelte';
	import HandSection from '$lib/components/cards/HandSection.svelte';
	import MapView from '$lib/components/map/MapView.svelte';

	// Sidebar Components
	import TechList from '$lib/components/sidebar/TechList.svelte';
	import PlayersList from '$lib/components/sidebar/PlayersList.svelte';
	import GameLog from '$lib/components/sidebar/GameLog.svelte';
	import BudgetDisplay from '$lib/components/sidebar/BudgetDisplay.svelte';

	// Market Components
	import MarketSection from '$lib/components/market/MarketSection.svelte';

	// Utilities
	import { calculateShipStats } from '$lib/utils/shipStats';

	// Center pane tabs
	type CenterTab = 'actions' | 'log' | 'map' | 'blueprint';
	let activeTab: CenterTab = 'actions';

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

	// Market purchase handlers (reveal phase)
	async function handleBuyMarketCard(event: CustomEvent<{ cardId: string }>) {
		const result = await sendAction({
			actionType: 'BUY_MARKET_CARD_TENTATIVE',
			actionData: { cardId: event.detail.cardId }
		});
		if (!result.success) {
			showToast(result.error || 'Failed to purchase card', 'error');
		}
	}

	async function handleBuyTechCard(event: CustomEvent<{ cardId: string }>) {
		const result = await sendAction({
			actionType: 'ACQUIRE_TECH_CARD_TENTATIVE',
			actionData: { cardId: event.detail.cardId }
		});
		if (!result.success) {
			showToast(result.error || 'Failed to acquire tech', 'error');
		}
	}

	async function handleUndoPurchase(event: CustomEvent<{ cardId: string; type: 'market' | 'tech' }>) {
		const result = await sendAction({
			actionType: 'UNDO_MARKET_PURCHASE',
			actionData: { cardId: event.detail.cardId, type: event.detail.type }
		});
		if (!result.success) {
			showToast(result.error || 'Failed to undo purchase', 'error');
		}
	}

	// Derived values
	$: isWorkerPlacementPhase = $gameState?.phase === 'worker_placement';
	$: placements = $gameState?.groundBoard?.placements || {};
	$: routes = $gameState?.map?.routes || [];
	$: claimedRouteIds = routes.filter((r) => r.claimed).map((r) => r.id);
	$: cities = $gameState?.map?.cities || {};

	// All player ships for map display
	$: allPlayerShips = Object.entries($gameState?.players || {}).flatMap(([playerId, player]) =>
		(player.ships || []).map((ship) => ({ ship, faction: player.faction }))
	);

	// Ship stats from blueprint
	$: shipStats = calculateShipStats($myState?.blueprint);

	// Handle blueprint slot click
	function handleBlueprintSlotClick(event: CustomEvent<{ slotType: string; index: number; upgrade: string | null }>) {
		const { slotType, index, upgrade } = event.detail;
		openModal('upgrade', {
			slotType,
			slotIndex: index,
			currentUpgrade: upgrade,
			age: $gameState?.age || 1
		});
	}

	// Check if viewing another player (in dev mode)
	$: isViewingOtherPlayer = $isDevMode && $effectiveUserId !== $user?.id;
	// Get raw hand value - might be a number if viewing filtered state
	$: rawHand = $myState?.hand;
	$: otherPlayerCardCount = typeof rawHand === 'number' ? rawHand : 0;

	// Market/reveal phase derived values
	$: isRevealPhase = $gameState?.phase === 'reveal';
	$: isMarketInteractive = isRevealPhase && $isMyTurn;
	$: marketCards = $gameState?.marketCards || [];
	$: techCards = $gameState?.rdBoard || [];
	$: marketCardsClaimed = $gameState?.marketCardsClaimed || {};
	$: techCardsClaimed = $gameState?.techCardsClaimed || {};
	$: pendingMarketPurchases = $myState?.pendingMarketPurchases || [];
	$: pendingTechAcquisitions = $myState?.pendingTechAcquisitions || [];
	$: playerInfluence = $myState?.influence || 0;
	$: playerResearch = ($myState?.research || 0) + ($myState?.engineers || 0);
</script>

<svelte:head>
	<title>UP SHIP! - Game</title>
</svelte:head>

{#if loadingState}
	<div class="loading-screen">
		<div class="spinner"></div>
		<p>Connecting to game...</p>
	</div>
{:else if connectionError || $gameError}
	<div class="error-screen">
		<h2>{$gameError ? 'Game Error' : 'Connection Error'}</h2>
		<p>{$gameError || connectionError}</p>
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
					<span class="turn">Round {$gameState.round}</span>
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
			<!-- Left sidebar - Players and Ship Stats -->
			<aside class="sidebar left">
				<PlayersList
					players={$gameState.players}
					playerOrder={$gameState.playerOrder}
					currentPlayerId={$currentPlayerId}
					onlinePlayers={$onlinePlayers}
					myPlayerId={$effectiveUserId}
				/>

				{#if shipStats}
					<div class="panel ship-stats-panel">
						<h3>Ship Stats</h3>
						<ShipStats stats={shipStats} />
					</div>
				{/if}
			</aside>

			<!-- Center - Tabbed content -->
			<main class="main-board">
				<!-- Tab bar -->
				<div class="tab-bar">
					<button
						class="tab-btn"
						class:active={activeTab === 'actions'}
						on:click={() => (activeTab = 'actions')}
					>
						Actions
					</button>
					<button
						class="tab-btn"
						class:active={activeTab === 'log'}
						on:click={() => (activeTab = 'log')}
					>
						Game Log
					</button>
					<button
						class="tab-btn"
						class:active={activeTab === 'map'}
						on:click={() => (activeTab = 'map')}
					>
						Map
					</button>
					<button
						class="tab-btn"
						class:active={activeTab === 'blueprint'}
						on:click={() => (activeTab = 'blueprint')}
					>
						Blueprint
					</button>
				</div>

				<!-- Tab content -->
				<div class="tab-content">
					{#if activeTab === 'actions'}
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

							<!-- Market Section (always visible) -->
							<MarketSection
								{marketCards}
								{techCards}
								claimedMarket={marketCardsClaimed}
								claimedTech={techCardsClaimed}
								{pendingMarketPurchases}
								{pendingTechAcquisitions}
								interactive={isMarketInteractive}
								myPlayerId={$effectiveUserId}
								players={$gameState.players}
								playerTechCards={$myState?.techCards || []}
								on:buyMarket={handleBuyMarketCard}
								on:buyTech={handleBuyTechCard}
								on:undoPurchase={handleUndoPurchase}
							/>
						</div>
					{:else if activeTab === 'log'}
						<div class="log-tab">
							<GameLog log={$gameState.log || []} maxEntries={50} />
						</div>
					{:else if activeTab === 'map'}
						<div class="map-tab">
							<MapView
								age={$gameState?.age || 1}
								{routes}
								{cities}
								ships={$myState?.ships || []}
								{allPlayerShips}
								missionRow={$gameState?.missionRow || []}
								myFaction={$myState?.faction}
								selectable={$isMyTurn}
							/>
						</div>
					{:else if activeTab === 'blueprint'}
						<div class="blueprint-tab">
							{#if $myState?.blueprint}
								<AirshipBlueprint
									blueprint={$myState.blueprint}
									age={$gameState?.age || 1}
									on:slotClick={handleBlueprintSlotClick}
								/>
								<TechList
								techCards={$myState.techCards || []}
								{pendingTechAcquisitions}
								rdBoard={techCards}
								showUndo={isRevealPhase && $isMyTurn}
								on:undo={(e) => handleUndoPurchase({ detail: { cardId: e.detail.cardId, type: 'tech' } })}
							/>
							{/if}
						</div>
					{/if}
				</div>
			</main>

			<!-- Right sidebar - Hand and Actions -->
			<aside class="sidebar right">
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
						<p class="action-hint">Purchase cards below, then End Turn</p>
					{:else if $gameState.phase === 'income_cleanup'}
						<p class="action-hint">Collecting income...</p>
					{/if}
				</div>

				<!-- Budget Display (reveal phase only) -->
				{#if isRevealPhase}
					<BudgetDisplay influence={playerInfluence} research={playerResearch} />
				{/if}

				<!-- Hand Section -->
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
		grid-template-columns: 220px 1fr 340px;
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
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: var(--color-bg-primary);
	}

	/* Tab bar */
	.tab-bar {
		display: flex;
		gap: 2px;
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-bg-secondary);
		border-bottom: 1px solid var(--color-bg-hover);
	}

	.tab-btn {
		padding: var(--spacing-xs) var(--spacing-md);
		background: transparent;
		border: none;
		border-radius: var(--radius-md) var(--radius-md) 0 0;
		color: var(--color-text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.tab-btn:hover {
		background: var(--color-bg-hover);
		color: var(--color-text-primary);
	}

	.tab-btn.active {
		background: var(--color-bg-primary);
		color: var(--color-accent-gold);
		border-bottom: 2px solid var(--color-accent-gold);
	}

	/* Tab content */
	.tab-content {
		flex: 1;
		padding: var(--spacing-md);
		overflow-y: auto;
	}

	.log-tab {
		height: 100%;
	}

	.map-tab {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 500px;
	}

	.blueprint-tab {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--spacing-lg);
		max-width: 900px;
		margin: 0 auto;
	}

	.ship-stats-panel {
		background: var(--color-bg-card);
	}

	.ship-stats-panel h3 {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		margin-bottom: var(--spacing-xs);
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
			grid-template-columns: 180px 1fr 300px;
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
