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
	import { connect, disconnect, connected, sendAction, onlinePlayers, gameError, connectToLobby, lobbyGame, inLobby } from '$lib/stores/socket';
	import { toasts, showToast } from '$lib/stores/ui';
	import type { Card } from '$lib/types/game';
	import type { LobbyGame } from '$lib/types/socket';

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
	import ActionButtons from '$lib/components/ui/ActionButtons.svelte';

	// Market Components
	import MarketSection from '$lib/components/market/MarketSection.svelte';

	// Utilities
	import { calculateShipStats } from '$lib/utils/shipStats';

	// Center pane tabs
	type CenterTab = 'actions' | 'log' | 'map' | 'blueprint';
	let activeTab: CenterTab = 'actions';

	$: gameId = $page.params.id;

	// Page modes: loading, waiting (lobby), playing (game), error
	type PageMode = 'loading' | 'waiting' | 'playing' | 'error';
	let pageMode: PageMode = 'loading';
	let loadingState = true;
	let connectionError: string | null = null;
	let selectedCardIndex: number | null = null;
	let selectedCardSymbol: string | null = null;
	let isStartingGame = false;

	let unsubscribe: (() => void) | null = null;

	// Derived: is user the host?
	$: isHost = $lobbyGame?.host_id === $user?.id;
	$: canStartGame =
		isHost &&
		$lobbyGame?.status === 'waiting' &&
		($lobbyGame?.current_player_count ?? 0) >= 2 &&
		$lobbyGame?.players.every((p) => p.faction);

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

		// First, check game status via REST API
		const initializeGame = async () => {
			if (!gameId) {
				pageMode = 'error';
				loadingState = false;
				return;
			}

			try {
				const res = await fetch(`/api/games/${gameId}`, { credentials: 'include' });
				if (!res.ok) {
					throw new Error('Game not found');
				}
				const { game } = await res.json();

				setGameId(gameId);

				if (game.status === 'waiting') {
					// Game hasn't started yet - show waiting room
					pageMode = 'waiting';
					loadingState = false;

					// Connect to lobby for real-time updates
					connectToLobby(gameId, () => {
						// Callback when game starts
						pageMode = 'playing';
					});
				} else if (game.status === 'in_progress') {
					// Game is in progress - connect normally
					pageMode = 'playing';

					if ($user?.id) {
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
						if (loadingState && pageMode === 'playing') {
							connectionError = 'Connection timeout';
							loadingState = false;
							pageMode = 'error';
						}
					}, 10000);
				} else {
					// Game is completed or cancelled
					connectionError = `Game is ${game.status}`;
					pageMode = 'error';
					loadingState = false;
				}
			} catch (err) {
				connectionError = err instanceof Error ? err.message : 'Failed to load game';
				pageMode = 'error';
				loadingState = false;
			}
		};

		initializeGame();

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

	async function handleStartGame() {
		if (!canStartGame || isStartingGame) return;

		isStartingGame = true;
		try {
			const res = await fetch(`/api/games/${gameId}/start`, {
				method: 'POST',
				credentials: 'include'
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to start game');
			}

			// Game started - Socket.io will broadcast game-started event
			// and the callback will set pageMode to 'playing'
		} catch (err) {
			showToast(err instanceof Error ? err.message : 'Failed to start game', 'error');
			isStartingGame = false;
		}
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

	async function handleReveal() {
		// REVEAL exits worker placement - player reveals their remaining cards
		// and can optionally pre-select tech/market purchases
		const result = await sendAction({ actionType: 'REVEAL', actionData: {} });
		if (!result.success) {
			showToast(result.error || 'Failed to reveal', 'error');
		}
	}

	async function handleUndo() {
		const result = await sendAction({ actionType: 'UNDO', actionData: {} });
		if (!result.success) {
			showToast(result.error || 'Failed to undo', 'error');
		}
	}

	// Launch handlers (launchpad active)
	async function handleLaunchShip() {
		if (!selectedShip || !selectedRouteId || !selectedGasType) {
			showToast('Select gas type and route first', 'error');
			return;
		}
		const result = await sendAction({
			actionType: 'LAUNCH_SHIP',
			actionData: {
				shipId: selectedShip.id,
				routeId: selectedRouteId,
				gasType: selectedGasType
			}
		});
		if (result.success) {
			selectedRouteId = null;
			selectedGasType = null;
			showToast('Ship launched!', 'success');
		} else {
			showToast(result.error || 'Failed to launch ship', 'error');
		}
	}

	async function handleDoneLaunching() {
		const result = await sendAction({ actionType: 'NO_MORE_LAUNCHES', actionData: {} });
		if (!result.success) {
			showToast(result.error || 'Failed to end launches', 'error');
		}
	}

	function handleRouteSelect(event: CustomEvent<{ routeId: string }>) {
		selectedRouteId = event.detail.routeId;
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

	// Launchpad state - when active, show launch UI
	$: isLaunchpadActive = $gameState?.launchpadActive?.[$effectiveUserId] === true;
	$: myShips = $myState?.ships || [];
	$: launchableShips = myShips.filter((s) => s.status === 'hangar');
	$: selectedShip = launchableShips[0] || null; // Auto-select first ship in hangar
	$: launchGasRequired = selectedShip ? (shipStats?.gas || 1) : 1;
	$: canAffordHydrogen = ($myState?.gasCubes?.hydrogen || 0) >= launchGasRequired;
	$: canAffordHelium = ($myState?.gasCubes?.helium || 0) >= launchGasRequired;
	let selectedRouteId: string | null = null;
	let selectedGasType: 'hydrogen' | 'helium' | null = null;

	// Auto-switch to Map tab when gas is selected during launch
	function selectGasType(gasType: 'hydrogen' | 'helium') {
		selectedGasType = gasType;
		activeTab = 'map';
	}

	// Hazard response state - ship awaiting hazard response
	$: shipAwaitingHazard = myShips.find((s) => s.status === 'awaiting_hazard' && s.pendingHazard);
	$: pendingHazard = shipAwaitingHazard?.pendingHazard;
	$: canAffordEngineers = ($myState?.engineers || 0) >= (pendingHazard?.engineersNeeded || 0);

	// Peeked hazard - from Navigator card or Weather Bureau
	$: peekedHazard = $myState?.peekedHazard;

	async function handleRespondToHazard(spendEngineers: boolean) {
		if (!shipAwaitingHazard) return;
		const result = await sendAction({
			actionType: 'RESPOND_TO_HAZARD',
			actionData: {
				shipId: shipAwaitingHazard.id,
				spendEngineers
			}
		});
		if (!result.success) {
			showToast(result.error || 'Failed to respond to hazard', 'error');
		}
	}

	// Handle actions from ActionButtons component (state machine driven)
	async function handleStateMachineAction(event: CustomEvent<{ action: string; actionData?: Record<string, unknown> }>) {
		const { action, actionData } = event.detail;
		let result;

		switch (action) {
			case 'PLACE_AGENT':
				// This requires selection - don't handle directly, let existing flow work
				showToast('Select a card and location to place agent', 'info');
				return;

			case 'REVEAL':
				result = await sendAction({ actionType: 'REVEAL', actionData: {} });
				break;

			case 'KEEP_HAZARD':
				result = await sendAction({ actionType: 'KEEP_HAZARD', actionData: {} });
				break;

			case 'DISCARD_HAZARD':
				result = await sendAction({ actionType: 'DISCARD_HAZARD', actionData: {} });
				break;

			case 'DISCARD_MINISTRY_CARD':
				result = await sendAction({
					actionType: 'DISCARD_MINISTRY_CARD',
					actionData: { cardIndex: actionData?.cardIndex ?? 0 }
				});
				break;

			case 'LAUNCH_SHIP':
				// This requires selection - guide user
				showToast('Select gas type and route to launch', 'info');
				return;

			case 'NO_MORE_LAUNCHES':
				result = await sendAction({ actionType: 'NO_MORE_LAUNCHES', actionData: {} });
				break;

			case 'RESPOND_TO_HAZARD':
				if (!shipAwaitingHazard) {
					showToast('No ship awaiting hazard response', 'error');
					return;
				}
				result = await sendAction({
					actionType: 'RESPOND_TO_HAZARD',
					actionData: {
						shipId: shipAwaitingHazard.id,
						spendEngineers: actionData?.spendEngineers ?? false
					}
				});
				break;

			default:
				showToast(`Unknown action: ${action}`, 'error');
				return;
		}

		if (result && !result.success) {
			showToast(result.error || `Failed to ${action}`, 'error');
		}
	}

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

{#if pageMode === 'loading' || loadingState}
	<div class="loading-screen">
		<div class="spinner"></div>
		<p>Connecting to game...</p>
	</div>
{:else if pageMode === 'error' || connectionError || $gameError}
	<div class="error-screen">
		<h2>{$gameError ? 'Game Error' : 'Connection Error'}</h2>
		<p>{$gameError || connectionError}</p>
		<button class="btn" on:click={handleBackToLobby}>Back to Lobby</button>
	</div>
{:else if pageMode === 'waiting'}
	<!-- Waiting Room -->
	<div class="waiting-room">
		<div class="waiting-content">
			<button class="back-btn" on:click={handleBackToLobby}>&larr; Back to Lobby</button>

			<h1>{$lobbyGame?.name || 'Game Lobby'}</h1>

			<div class="waiting-message">
				<div class="spinner small"></div>
				<p>Waiting for game to start...</p>
			</div>

			<div class="player-list-section">
				<h3>Players ({$lobbyGame?.current_player_count || 0}/4)</h3>
				<div class="player-cards">
					{#each $lobbyGame?.players || [] as player}
						<div class="player-card" class:host={player.id === $lobbyGame?.host_id}>
							<span class="player-name">{player.username}</span>
							{#if player.id === $lobbyGame?.host_id}
								<span class="host-badge">Host</span>
							{/if}
							{#if player.faction}
								<span class="faction-badge {player.faction}">{player.faction}</span>
							{:else}
								<span class="faction-pending">Selecting...</span>
							{/if}
						</div>
					{/each}
					{#each Array(4 - ($lobbyGame?.current_player_count || 0)) as _, i}
						<div class="player-card empty">
							<span class="empty-slot">Waiting for player...</span>
						</div>
					{/each}
				</div>
			</div>

			<div class="waiting-actions">
				{#if canStartGame}
					<button class="btn btn-success" on:click={handleStartGame} disabled={isStartingGame}>
						{isStartingGame ? 'Starting...' : 'Start Game'}
					</button>
				{:else if isHost}
					<button class="btn" disabled>
						{#if ($lobbyGame?.current_player_count ?? 0) < 2}
							Waiting for more players...
						{:else}
							Waiting for faction selection...
						{/if}
					</button>
				{/if}
			</div>
		</div>
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
							<GameLog gameId={gameId} logCount={$gameState.logCount || 0} />
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
								selectable={$isMyTurn && isLaunchpadActive}
								on:selectRoute={(e) => { selectedRouteId = e.detail.route?.id || e.detail.routeId; }}
							/>
							{#if isLaunchpadActive && selectedRouteId}
								<p class="route-selected">Selected route: {selectedRouteId}</p>
							{/if}
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
				<!-- State Machine Driven Action Buttons -->
				<ActionButtons on:action={handleStateMachineAction} />

				<div class="panel actions">
					<h3>Actions</h3>
					{#if peekedHazard}
						<!-- Peeked Hazard Display - from Navigator card or Weather Bureau -->
						<div class="peeked-hazard-panel">
							<h4>👁️ Peeked Hazard</h4>
							<div class="peeked-hazard-card">
								<p class="hazard-name">{peekedHazard.name || peekedHazard.type}</p>
								<p class="hazard-details">
									Type: {peekedHazard.category || 'unknown'} | Difficulty: {peekedHazard.difficulty || '?'}
								</p>
								{#if peekedHazard.engineerCost}
									<p class="hazard-cost">Engineers needed: {peekedHazard.engineerCost}</p>
								{/if}
							</div>
							<p class="peeked-hint">This is the top card of your hazard deck.</p>
						</div>
					{/if}
					{#if $isMyTurn}
						{#if $turnInfo.canUndo}
							<button class="btn secondary w-full" on:click={handleUndo}>
								Undo {$turnInfo.lastActionType || ''}
							</button>
						{/if}
						{#if shipAwaitingHazard && pendingHazard}
							<!-- Hazard Response UI - ship awaiting hazard check -->
							<div class="hazard-panel">
								<h4>⚠️ Hazard Check</h4>
								<div class="hazard-card">
									<p class="hazard-name">{pendingHazard.name}</p>
									{#if pendingHazard.autoPassReason}
										<p class="hazard-auto-pass">Auto-pass: {pendingHazard.autoPassReason}</p>
										<button class="btn primary w-full" on:click={() => handleRespondToHazard(false)}>
											Continue
										</button>
									{:else if pendingHazard.engineersNeeded > 0}
										<p class="hazard-requirement">
											Requires: {pendingHazard.engineersNeeded} Engineers
										</p>
										<p class="hazard-available">
											You have: {$myState?.engineers || 0} Engineers
										</p>
										<div class="hazard-buttons">
											{#if canAffordEngineers}
												<button class="btn primary w-full" on:click={() => handleRespondToHazard(true)}>
													Spend {pendingHazard.engineersNeeded} Engineers (Pass)
												</button>
											{/if}
											<button class="btn secondary w-full" on:click={() => handleRespondToHazard(false)}>
												{canAffordEngineers ? 'Decline (Fail Check)' : 'Fail Check (Not Enough Engineers)'}
											</button>
										</div>
									{:else}
										<p class="hazard-info">No engineers needed.</p>
										<button class="btn primary w-full" on:click={() => handleRespondToHazard(false)}>
											Continue
										</button>
									{/if}
								</div>
							</div>
						{:else if isLaunchpadActive}
							<!-- Launch UI - shown when at launchpad -->
							<div class="launch-panel">
								<h4>Launch Ship</h4>

								{#if launchableShips.length === 0}
									<p class="action-hint">No ships in hangar to launch</p>
								{:else if !selectedGasType}
									<!-- Step 1: Gas selection via clickable slots -->
									<p class="action-hint">Select gas type for launch:</p>
									<div class="gas-slots">
										{#if canAffordHydrogen}
											<button
												class="gas-slot hydrogen"
												on:click={() => selectGasType('hydrogen')}
											>
												{#each Array(launchGasRequired) as _}
													<span class="gas-icon hydrogen">H₂</span>
												{/each}
											</button>
										{/if}
										{#if canAffordHelium}
											<button
												class="gas-slot helium"
												on:click={() => selectGasType('helium')}
											>
												{#each Array(launchGasRequired) as _}
													<span class="gas-icon helium">He</span>
												{/each}
											</button>
										{/if}
										{#if !canAffordHydrogen && !canAffordHelium}
											<p class="action-hint error">Not enough gas to launch!</p>
										{/if}
									</div>
								{:else if !selectedRouteId}
									<!-- Step 2: Route selection (on Map tab) -->
									<p class="action-hint">
										Using {selectedGasType}. Select a route on the Map.
									</p>
									<button class="btn secondary w-full" on:click={() => { selectedGasType = null; }}>
										Change Gas Type
									</button>
								{:else}
									<!-- Step 3: Ready to launch -->
									<p class="action-hint">Ready to launch!</p>
									<p class="route-info">Route: {selectedRouteId}</p>
									<button class="btn primary w-full" on:click={handleLaunchShip}>
										Launch Ship
									</button>
									<button class="btn secondary w-full" on:click={() => { selectedRouteId = null; }}>
										Change Route
									</button>
								{/if}

								<button class="btn secondary w-full" style="margin-top: var(--spacing-sm);" on:click={handleDoneLaunching}>
									Exit Launchpad (No More Launches)
								</button>
							</div>
						{:else if isWorkerPlacementPhase}
							<!-- Reveal button - always available during worker placement -->
							<button class="btn primary w-full" on:click={handleReveal}>
								Reveal
							</button>
						{:else if $turnInfo.canEndTurn}
							<button class="btn w-full" on:click={handleEndTurn}>End Turn</button>
						{/if}
					{/if}

					{#if isWorkerPlacementPhase && !isLaunchpadActive}
						<p class="action-hint">
							{#if selectedCardIndex !== null}
								Select a location to place your agent
							{:else}
								Select a card, or click Reveal to exit worker placement
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

	/* Waiting Room */
	.waiting-room {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: var(--color-bg-primary);
		padding: var(--spacing-lg);
	}

	.waiting-content {
		max-width: 600px;
		width: 100%;
		text-align: center;
	}

	.waiting-content h1 {
		font-size: 2rem;
		margin-bottom: var(--spacing-lg);
		color: var(--color-accent-gold);
	}

	.waiting-message {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-xl);
		color: var(--color-text-secondary);
	}

	.spinner.small {
		width: 20px;
		height: 20px;
	}

	.player-list-section {
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		margin-bottom: var(--spacing-lg);
	}

	.player-list-section h3 {
		font-size: 1rem;
		margin-bottom: var(--spacing-md);
		color: var(--color-text-secondary);
	}

	.player-cards {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.player-card {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
	}

	.player-card.empty {
		opacity: 0.5;
	}

	.player-name {
		flex: 1;
		text-align: left;
		font-weight: 500;
	}

	.host-badge {
		font-size: 0.75rem;
		padding: 2px 6px;
		background: var(--color-accent-gold);
		color: var(--color-bg-primary);
		border-radius: var(--radius-sm);
		text-transform: uppercase;
	}

	.faction-badge {
		font-size: 0.75rem;
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		text-transform: capitalize;
	}

	.faction-badge.germany { background: var(--color-faction-germany, #2d2d2d); color: white; }
	.faction-badge.britain { background: var(--color-faction-britain, #1a365d); color: white; }
	.faction-badge.usa { background: var(--color-faction-usa, #2f4f4f); color: white; }
	.faction-badge.italy { background: var(--color-faction-italy, #5c4033); color: white; }

	.faction-pending {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-style: italic;
	}

	.empty-slot {
		color: var(--color-text-muted);
		font-style: italic;
	}

	.waiting-actions {
		margin-top: var(--spacing-lg);
	}

	.waiting-content .back-btn {
		position: absolute;
		top: var(--spacing-md);
		left: var(--spacing-md);
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

	/* Launch Panel */
	.launch-panel {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm);
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-sm);
	}

	.launch-panel h4 {
		margin: 0 0 var(--spacing-xs) 0;
		font-size: 0.9rem;
		color: var(--color-accent-gold);
	}

	.gas-slots {
		display: flex;
		gap: var(--spacing-sm);
		justify-content: center;
	}

	.gas-slot {
		display: flex;
		gap: 4px;
		padding: var(--spacing-sm) var(--spacing-md);
		border: 2px solid transparent;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.gas-slot.hydrogen {
		background: rgba(59, 130, 246, 0.2);
		border-color: #3b82f6;
	}

	.gas-slot.hydrogen:hover {
		background: rgba(59, 130, 246, 0.4);
		transform: scale(1.05);
	}

	.gas-slot.helium {
		background: rgba(168, 85, 247, 0.2);
		border-color: #a855f7;
	}

	.gas-slot.helium:hover {
		background: rgba(168, 85, 247, 0.4);
		transform: scale(1.05);
	}

	.gas-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		font-size: 0.7rem;
		font-weight: bold;
	}

	.gas-icon.hydrogen {
		background: #3b82f6;
		color: white;
	}

	.gas-icon.helium {
		background: #a855f7;
		color: white;
	}

	.route-info {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
		margin: var(--spacing-xs) 0;
	}

	.action-hint.error {
		color: var(--color-error);
	}

	/* Peeked Hazard Panel - from Navigator or Weather Bureau */
	.peeked-hazard-panel {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm);
		background: rgba(59, 130, 246, 0.1);
		border: 2px solid var(--color-primary);
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-sm);
	}

	.peeked-hazard-panel h4 {
		margin: 0;
		font-size: 0.9rem;
		color: var(--color-primary);
	}

	.peeked-hazard-card {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		background: rgba(0, 0, 0, 0.2);
		padding: var(--spacing-xs);
		border-radius: var(--radius-sm);
	}

	.peeked-hazard-card .hazard-details {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
		margin: 0;
	}

	.peeked-hazard-card .hazard-cost {
		font-size: 0.8rem;
		color: var(--color-warning);
		margin: 0;
	}

	.peeked-hint {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-style: italic;
		margin: 0;
	}

	/* Hazard Panel */
	.hazard-panel {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm);
		background: rgba(239, 68, 68, 0.1);
		border: 2px solid var(--color-error);
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-sm);
	}

	.hazard-panel h4 {
		margin: 0;
		font-size: 1rem;
		color: var(--color-error);
	}

	.hazard-card {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.hazard-name {
		font-weight: bold;
		font-size: 0.9rem;
		color: var(--color-text-primary);
		margin: 0;
	}

	.hazard-auto-pass {
		font-size: 0.8rem;
		color: var(--color-success);
		margin: 0;
	}

	.hazard-requirement {
		font-size: 0.85rem;
		color: var(--color-warning);
		margin: 0;
	}

	.hazard-available {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
		margin: 0;
	}

	.hazard-info {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
		margin: 0;
	}

	.hazard-buttons {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		margin-top: var(--spacing-xs);
	}

	.route-selected {
		margin-top: var(--spacing-sm);
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--color-info);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		color: white;
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
