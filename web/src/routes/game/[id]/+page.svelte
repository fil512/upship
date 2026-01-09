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
		effectiveUserId,
		setGameId,
		resetGameState,
		turnInfo,
		isGameComplete
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
	import TechTilesPanel from '$lib/components/sidebar/TechTilesPanel.svelte';
	import PlayersList from '$lib/components/sidebar/PlayersList.svelte';
	import GameLog from '$lib/components/sidebar/GameLog.svelte';
	import BudgetDisplay from '$lib/components/sidebar/BudgetDisplay.svelte';
	import RetrofitReceipt from '$lib/components/sidebar/RetrofitReceipt.svelte';

	// Market Components
	import MarketSection from '$lib/components/market/MarketSection.svelte';

	// Modals
	import LocationActionModal from '$lib/components/modals/LocationActionModal.svelte';
	import CitySelectionModal from '$lib/components/modals/CitySelectionModal.svelte';
	import LaunchSuccessModal from '$lib/components/modals/LaunchSuccessModal.svelte';
	import MinistryCardModal from '$lib/components/modals/MinistryCardModal.svelte';
	import GameComplete from '$lib/components/game/GameComplete.svelte';

	// Utilities
	import { calculateShipStats, calculateHullCost, calculateGasRequired } from '$lib/utils/shipStats';
	import { getAvailableTilesForPlayer } from '$lib/utils/techCardToTiles';
	import { TECH_TILES } from '$lib/data/techTiles';
	import { getFactionBorderColor } from '$lib/utils/factionColors';
	import Icon from '$lib/components/ui/Icon.svelte';
	import HazardCard from '$lib/components/cards/HazardCard.svelte';
	import TechTileSelector from '$lib/components/blueprint/TechTileSelector.svelte';
	import type { Blueprint as BlueprintType } from '$lib/types/game';

	// Locations that require parameter input before placing agent
	const LOCATIONS_REQUIRING_PARAMS: Record<string, string> = {
		gas_depot: 'Gas Depot',
		academy: 'Academy',
		government_liaison: 'Government Liaison',
		research_institute: 'Research Institute',
		construction_hall: 'Hangar'
	};

	// Location names for preview
	const LOCATION_NAMES: Record<string, string> = {
		blueprint_design: 'Blueprint Design',
		construction_hall: 'Hangar',
		launchpad: 'Launchpad',
		launchpad_2: 'Launchpad',
		ministry: 'Ministry',
		weather_bureau: 'Weather Bureau',
		flight_school: 'Flight School',
		technical_institute: 'Technical Institute',
		insurance_bureau: 'Insurance Bureau',
		...LOCATIONS_REQUIRING_PARAMS
	};

	// Build preview data for a location
	function buildActionPreview(locationId: string, cardIndex: number, blueprint: BlueprintType | null | undefined): ActionPreviewData {
		const locationName = LOCATION_NAMES[locationId] || locationId;
		let costs: ActionPreviewData['costs'] = [];
		let benefits: ActionPreviewData['benefits'] = [];

		// Calculate dynamic costs from blueprint
		const hullCost = calculateHullCost(blueprint);
		const gasRequired = calculateGasRequired(blueprint);

		switch (locationId) {
			case 'launchpad':
			case 'launchpad_2':
				costs = [
					{ icon: 'officers', label: '1 Officer', value: '1' },
					{ icon: 'gas', label: `${gasRequired} Gas`, value: String(gasRequired) }
				];
				benefits = [{ icon: 'launch', label: 'Launch ships' }];
				break;
			case 'construction_hall':
				costs = [{ icon: 'cash', label: `£${hullCost.total}`, value: String(hullCost.total) }];
				benefits = [{ icon: 'ship', label: 'Build a ship' }];
				break;
			case 'ministry':
				benefits = [{ icon: 'politics', label: 'Draw 2 cards, discard 1' }];
				break;
			case 'weather_bureau':
				costs = [{ icon: 'cash', label: '£2', value: '2' }];
				benefits = [{ icon: 'eye', label: 'Peek at hazard deck' }];
				break;
			case 'flight_school':
				costs = [{ icon: 'cash', label: '£5', value: '5' }];
				benefits = [{ icon: 'income', label: '+1 Officer Income' }];
				break;
			case 'technical_institute':
				costs = [{ icon: 'cash', label: '£6', value: '6' }];
				benefits = [{ icon: 'income', label: '+1 Engineer Income' }];
				break;
			case 'insurance_bureau':
				costs = [{ icon: 'income', label: '-1 Income', value: '-1' }];
				benefits = [{ icon: 'insurance', label: 'Insurance policy' }];
				break;
			default:
				// For locations not listed, show generic info
				benefits = [{ icon: 'blueprint', label: 'Location action' }];
		}

		return {
			locationId,
			locationName,
			costs,
			benefits,
			cardIndex
		};
	}

	// State for location action modal
	let showLocationModal = false;
	let pendingLocationId: string | null = null;
	let pendingLocationName: string = '';

	// State for action preview panel (shown before confirming worker placement)
	type ActionPreviewData = {
		locationId: string;
		locationName: string;
		costs: Array<{ icon: string; label: string; value: string }>;
		benefits: Array<{ icon: string; label: string }>;
		cardIndex: number;
	};
	type ActionPreview = ActionPreviewData | null;
	let pendingActionPreview: ActionPreview = null;

	// Blueprint Design mode state
	let blueprintDesignMode = false;
	let pendingBlueprint: BlueprintType | null = null;
	let selectedTechTileId: string | null = null;
	let blueprintDesignCardIndex: number | null = null;

	// Center pane tabs
	type CenterTab = 'actions' | 'log' | 'map' | 'blueprint' | 'market';
	let activeTab: CenterTab = 'actions';
	let wasMyTurn = false;

	// Switch back to Actions tab when player's turn/phase ends
	$: {
		const currentlyMyTurn = $isMyTurn;
		if (wasMyTurn && !currentlyMyTurn) {
			// Turn just ended - switch back to actions tab
			activeTab = 'actions';
		}
		wasMyTurn = currentlyMyTurn;
	}

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

		const locationId = event.detail.locationId;

		// Blueprint Design: enter interactive blueprint editing mode
		if (locationId === 'blueprint_design') {
			if ($myState?.blueprint) {
				blueprintDesignMode = true;
				pendingBlueprint = structuredClone($myState.blueprint);
				blueprintDesignCardIndex = selectedCardIndex;
				selectedCardIndex = null;
				selectedCardSymbol = null;
				activeTab = 'blueprint';
			}
			return;
		}

		// Check if this location requires parameter input (has modal)
		// These skip the preview since they have their own detailed modal
		if (LOCATIONS_REQUIRING_PARAMS[locationId]) {
			pendingLocationId = locationId;
			pendingLocationName = LOCATIONS_REQUIRING_PARAMS[locationId];
			showLocationModal = true;
			return;
		}

		// Show action preview instead of sending immediately
		pendingActionPreview = buildActionPreview(locationId, selectedCardIndex, $myState?.blueprint);
	}

	// Confirm the pending action preview
	async function handleConfirmPreview() {
		if (!pendingActionPreview) return;

		await sendPlaceAgentAction(pendingActionPreview.locationId, {}, pendingActionPreview.cardIndex);
		pendingActionPreview = null;
	}

	// Cancel the pending action preview
	function handleCancelPreview() {
		pendingActionPreview = null;
	}

	// Send the PLACE_AGENT action with optional params
	async function sendPlaceAgentAction(locationId: string, params: Record<string, unknown>, cardIndex?: number) {
		const effectiveCardIndex = cardIndex ?? selectedCardIndex;
		if (effectiveCardIndex === null) {
			showToast('Select a card first', 'warning');
			return;
		}

		const result = await sendAction({
			actionType: 'PLACE_AGENT',
			actionData: {
				locationId,
				cardIndex: effectiveCardIndex,
				...params
			}
		});

		if (result.success) {
			selectedCardIndex = null;
			selectedCardSymbol = null;
		} else {
			showToast(result.error || 'Failed to place agent', 'error');
		}
	}

	// Handle location modal confirmation
	function handleLocationModalConfirm(event: CustomEvent<{ params: Record<string, unknown> }>) {
		if (pendingLocationId) {
			sendPlaceAgentAction(pendingLocationId, event.detail.params);
		}
		showLocationModal = false;
		pendingLocationId = null;
		pendingLocationName = '';
	}

	// Handle location modal cancellation
	function handleLocationModalCancel() {
		showLocationModal = false;
		pendingLocationId = null;
		pendingLocationName = '';
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
		} else {
			// Clear card selection and pending action - can't place agents after revealing
			selectedCardIndex = null;
			pendingActionPreview = null;
			// Auto-switch to market tab for purchasing
			activeTab = 'market';
		}
	}

	async function handleUndo() {
		const result = await sendAction({ actionType: 'UNDO', actionData: {} });
		if (!result.success) {
			showToast(result.error || 'Failed to undo', 'error');
		}
	}

	// Launch handlers (launchpad active)
	// City modal state for hazard response
	let pendingHazardResponse: { spendEngineers: boolean } | null = null;

	async function handleLaunchShip() {
		// Ships are tokens - no individual ship ID needed
		if (!hasShipsToLaunch || !selectedRouteId || !selectedGasType) {
			showToast('Select gas type and route first', 'error');
			return;
		}
		// Send LAUNCH_SHIP directly - city choice happens after hazard check
		// Age II uses missionId instead of routeId
		const currentAge = $gameState?.age || 1;
		const actionData = currentAge === 2
			? { missionId: selectedRouteId, gasType: selectedGasType }
			: { routeId: selectedRouteId, gasType: selectedGasType };
		const result = await sendAction({
			actionType: 'LAUNCH_SHIP',
			actionData
		});
		if (result.success) {
			selectedRouteId = null;
			selectedGasType = null;
			// Hazard panel will show next - don't show success toast yet
		} else {
			showToast(result.error || 'Failed to launch ship', 'error');
		}
	}

	// City bonus definitions (matches CitySelectionModal)
	const CITY_BONUSES: Record<string, { description: string; icon: import('$lib/icons').IconName }> = {
		// Age I Cities
		London: { description: '+£3', icon: 'cash' },
		Paris: { description: '+1 Influence', icon: 'influence' },
		Berlin: { description: '+1 Research', icon: 'research' },
		Frankfurt: { description: '+£2', icon: 'cash' },
		Hamburg: { description: '+1 Hydrogen', icon: 'hydrogen' },
		Brussels: { description: '+1 Officer', icon: 'officers' },
		// Age II Cities
		Friedrichshafen: { description: '+1 Research', icon: 'research' },
		Cardington: { description: '+1 Engineer', icon: 'engineers' },
		Rome: { description: '+1 Influence', icon: 'influence' },
		Moscow: { description: '+£4', icon: 'cash' },
		Cairo: { description: 'Free Tech Swap', icon: 'technology' },
		'Scapa Flow': { description: '+1 Officer', icon: 'officers' },
		// Age III Cities
		'New York': { description: '+£5', icon: 'cash' },
		Lakehurst: { description: '+1 Engineer', icon: 'engineers' },
		'Rio de Janeiro': { description: '+2 Influence', icon: 'influence' },
		Recife: { description: '+1 Gas (any)', icon: 'gas' },
		Seville: { description: 'Draw 1 Card', icon: 'propeller' },
		Bombay: { description: '+£3, +1 Influence', icon: 'cash' }
	};

	// Called when city is selected after hazard check passes
	async function handleCitySelect(event: CustomEvent<{ city: string }>) {
		showCityModal = false;
		if (!pendingLaunch || !pendingHazardResponse) {
			return;
		}

		// Capture launch data before the request
		const launchRoute = hazardRoute;
		const launchRouteId = launchRoute?.id;
		const selectedCity = event.detail.city;
		const cityBonusData = CITY_BONUSES[selectedCity];

		// Ships are tokens - no shipId needed
		const result = await sendAction({
			actionType: 'RESPOND_TO_HAZARD',
			actionData: {
				spendEngineers: pendingHazardResponse.spendEngineers,
				cityChoice: selectedCity
			}
		});
		pendingHazardResponse = null;
		if (result.success && launchRoute) {
			// Verify the route was actually claimed by checking updated game state
			// The state is updated synchronously before sendAction returns
			const updatedRoutes = $gameState?.map?.routes || [];
			const claimedRoute = updatedRoutes.find((r: { id: string; claimed?: string }) =>
				r.id === launchRouteId && r.claimed === $effectiveUserId
			);

			if (claimedRoute) {
				// Route was successfully claimed - show success modal
				launchSuccessData = {
					routeName: launchRoute.name || `${launchRoute.from} → ${launchRoute.to}`,
					routeIncome: launchRoute.income || 0,
					cityBonus: cityBonusData ? { city: selectedCity, ...cityBonusData } : null,
					missionName: null,
					missionVp: 0
				};
				showLaunchSuccessModal = true;
			} else {
				// Hazard check failed despite frontend prediction - show abort message
				showToast('Launch aborted - ship returns to hangar', 'info');
			}
		} else if (!result.success) {
			showToast(result.error || 'Failed to respond to hazard', 'error');
		}
	}

	function handleCityModalCancel() {
		showCityModal = false;
		pendingHazardResponse = null;
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

	// Count ships on routes per player (routes track claims, not individual ships)
	$: playerRouteCounts = Object.fromEntries(
		Object.entries($gameState?.players || {}).map(([playerId, player]) => [
			playerId,
			routes.filter((r) => r.claimed === playerId).length
		])
	);

	// Player ID to faction mapping (for route claim colors)
	$: playerFactions = Object.fromEntries(
		Object.entries($gameState?.players || {}).map(([playerId, player]) => [playerId, player.faction])
	);

	// Ship stats from blueprint (uses viewed player's blueprint when viewing another player)
	$: shipStats = calculateShipStats(viewedPlayerState?.blueprint || $myState?.blueprint);

	// Installed tile IDs from blueprint (for showing "already owned" in market)
	$: installedTileIds = $myState?.blueprint ? [
		...($myState.blueprint.frameSlots || []),
		...($myState.blueprint.fabricSlots || []),
		...($myState.blueprint.driveSlots || []),
		...($myState.blueprint.componentSlots || [])
	].filter((id): id is string => id !== null) : [];

	// Game advancement track
	$: progressThresholds = $gameState?.progressThresholds || { age2: 4, age3: 8, end: 12 };
	$: progressTrack = $gameState?.progressTrack || 0;

	// Handle blueprint slot click (normal mode - not blueprint design)
	function handleBlueprintSlotClick(event: CustomEvent<{ slotType: string; index: number; upgrade: string | null }>) {
		if (blueprintDesignMode) return; // Handled by placeTile event in blueprint design mode
		const { slotType, index, upgrade } = event.detail;
		openModal('upgrade', {
			slotType,
			slotIndex: index,
			currentUpgrade: upgrade,
			age: $gameState?.age || 1
		});
	}

	// Blueprint Design mode handlers
	// Available tech tiles - compute whenever on blueprint tab or in blueprint design mode
	// Pass current blueprint to filter out already-installed tiles (no duplicates per Section 4.2)
	$: availableTechTiles = getAvailableTilesForPlayer(
		$myState?.techCards || [],
		$gameState?.age || 1,
		pendingBlueprint || $myState?.blueprint
	);

	// Is the blueprint tab active and we can show tech tiles?
	$: showBlueprintTiles = activeTab === 'blueprint';

	$: previewShipStats = blueprintDesignMode && pendingBlueprint
		? calculateShipStats(pendingBlueprint)
		: null;

	// Retrofit cost calculation for blueprint design mode
	interface RetrofitCostInfo {
		startingCash: number;
		oldHullCost: number;
		newHullCost: number;
		costIncrease: number;
		shipsToRetrofit: number;
		retrofitCost: number;
		remainingCash: number;
		isAgeTransition: boolean;
	}

	function calculateRetrofitCostInfo(
		oldBlueprint: BlueprintType | undefined,
		newBlueprint: BlueprintType,
		hangarShips: number,
		repairShips: number,
		currentCash: number,
		isAgeTransition: boolean
	): RetrofitCostInfo {
		const oldCost = calculateHullCost(oldBlueprint);
		const newCost = calculateHullCost(newBlueprint);
		const costIncrease = Math.max(0, newCost - oldCost);
		const shipsToRetrofit = hangarShips + repairShips;
		const retrofitCost = isAgeTransition ? 0 : costIncrease * shipsToRetrofit;

		return {
			startingCash: currentCash,
			oldHullCost: oldCost,
			newHullCost: newCost,
			costIncrease,
			shipsToRetrofit,
			retrofitCost,
			remainingCash: currentCash - retrofitCost,
			isAgeTransition
		};
	}

	$: retrofitCostInfo = blueprintDesignMode && pendingBlueprint && $myState?.blueprint
		? calculateRetrofitCostInfo(
			$myState.blueprint,
			pendingBlueprint,
			$myState.hangarShips || 0,
			$myState.repairShips || 0,
			$myState.cash || 0,
			isAgeTransitionBlueprintDesignPhase
		)
		: null;

	$: canAffordRetrofit = retrofitCostInfo ? retrofitCostInfo.remainingCash >= 0 : true;

	function handleTechTileSelect(event: CustomEvent<{ tileId: string }>) {
		selectedTechTileId = event.detail.tileId;
	}

	function handlePlaceTile(event: CustomEvent<{ slotType: string; index: number; tileId: string }>) {
		if (!pendingBlueprint || !$myState?.blueprint) return;
		const { slotType, index, tileId } = event.detail;
		const slotKey = `${slotType}Slots` as keyof BlueprintType;

		// Create test blueprint to check cost before applying
		const testBlueprint = structuredClone(pendingBlueprint);
		const testSlots = testBlueprint[slotKey] as (string | null)[];
		if (testSlots && index < testSlots.length) {
			testSlots[index] = tileId;
		}

		// Check if this would exceed available cash (skip for age transition - free changes)
		if (!isAgeTransitionBlueprintDesignPhase) {
			const testCostInfo = calculateRetrofitCostInfo(
				$myState.blueprint,
				testBlueprint,
				$myState.hangarShips || 0,
				$myState.repairShips || 0,
				$myState.cash || 0,
				false
			);

			if (testCostInfo.remainingCash < 0) {
				showToast('Insufficient funds for this upgrade', 'error');
				return;
			}
		}

		// Apply the change
		const slots = pendingBlueprint[slotKey] as (string | null)[];
		if (slots && index < slots.length) {
			slots[index] = tileId;
			pendingBlueprint = pendingBlueprint; // Trigger reactivity
		}
		selectedTechTileId = null; // Clear selection after placement
	}

	function handleRemoveTile(event: CustomEvent<{ slotType: string; index: number; tileId: string }>) {
		if (!pendingBlueprint) return;
		const { slotType, index } = event.detail;
		const slotKey = `${slotType}Slots` as keyof BlueprintType;

		// Remove the tile from the slot
		const slots = pendingBlueprint[slotKey] as (string | null)[];
		if (slots && index < slots.length) {
			slots[index] = null;
			pendingBlueprint = pendingBlueprint; // Trigger reactivity
		}
	}

	async function handleBlueprintDesignDone() {
		if (!pendingBlueprint) return;

		// Different action for age transition vs normal blueprint design
		if (isAgeTransitionBlueprintDesignPhase) {
			const result = await sendAction({
				actionType: 'AGE_TRANSITION_BLUEPRINT_DESIGN',
				actionData: {
					blueprint: pendingBlueprint
				}
			});

			if (result.success) {
				blueprintDesignMode = false;
				pendingBlueprint = null;
				selectedTechTileId = null;
				blueprintDesignCardIndex = null;
				showToast('Blueprint updated for new Age!', 'success');
			} else {
				showToast(result.error || 'Failed to update blueprint', 'error');
			}
		} else {
			if (blueprintDesignCardIndex === null) return;

			const result = await sendAction({
				actionType: 'PLACE_AGENT',
				actionData: {
					locationId: 'blueprint_design',
					cardIndex: blueprintDesignCardIndex,
					blueprint: pendingBlueprint
				}
			});

			if (result.success) {
				blueprintDesignMode = false;
				pendingBlueprint = null;
				selectedTechTileId = null;
				blueprintDesignCardIndex = null;
			} else {
				showToast(result.error || 'Failed to update blueprint', 'error');
			}
		}
	}

	function handleBlueprintDesignCancel() {
		// Cannot cancel during age transition - it's mandatory
		if (isAgeTransitionBlueprintDesignPhase) {
			showToast('You must fill empty Frame and Fabric slots to continue', 'warning');
			return;
		}
		blueprintDesignMode = false;
		pendingBlueprint = null;
		selectedTechTileId = null;
		blueprintDesignCardIndex = null;
	}

	// Launchpad state - when active, show launch UI
	$: isLaunchpadActive = $gameState?.launchpadActive?.[$effectiveUserId] === true;
	// Ships are tokens (counters) - no individual ship objects
	$: hangarShipsCount = $myState?.hangarShips || 0;
	$: repairShipsCount = $myState?.repairShips || 0;
	$: hasShipsToLaunch = hangarShipsCount > 0;
	$: launchGasRequired = calculateGasRequired(viewedPlayerState?.blueprint || $myState?.blueprint);
	$: canAffordHydrogen = ($myState?.gasCubes?.hydrogen || 0) >= launchGasRequired;
	$: canAffordHelium = ($myState?.gasCubes?.helium || 0) >= launchGasRequired;
	let selectedRouteId: string | null = null;
	let selectedGasType: 'hydrogen' | 'helium' | null = null;

	// State for viewing other players' blueprints
	let viewedPlayerId: string | null = null;

	// Viewed player defaults to self, or switches when clicking on another player
	$: viewedPlayerIdResolved = viewedPlayerId || $effectiveUserId;
	$: viewedPlayerState = viewedPlayerIdResolved ? $gameState?.players?.[viewedPlayerIdResolved] : null;
	$: isViewingOwnBlueprint = viewedPlayerIdResolved === $effectiveUserId;

	function handleSelectPlayer(event: CustomEvent<{ playerId: string }>) {
		viewedPlayerId = event.detail.playerId;
		// Switch to blueprint tab when selecting a player
		activeTab = 'blueprint';
	}

	// City selection modal state
	let showCityModal = false;
	$: selectedRoute = routes.find((r) => r.id === selectedRouteId);

	// Launch success modal state
	let showLaunchSuccessModal = false;
	let launchSuccessData: {
		routeName: string;
		routeIncome: number;
		cityBonus: { city: string; description: string; icon: import('$lib/icons').IconName } | null;
		missionName: string | null;
		missionVp: number;
	} | null = null;

	// Auto-switch to Map tab when gas is selected during launch
	function selectGasType(gasType: 'hydrogen' | 'helium') {
		selectedGasType = gasType;
		activeTab = 'map';
	}

	// Hazard response state - pendingLaunch contains hazard info
	$: pendingLaunch = $myState?.pendingLaunch;
	$: pendingHazard = pendingLaunch?.hazardInfo;  // Flat structure with all hazard info
	$: canAffordEngineers = ($myState?.engineers || 0) >= (pendingHazard?.engineersNeeded || 0);
	// Abort outcome info (per Section 8.2: gas lost, officers refunded, ship returns)
	$: abortGasType = pendingLaunch?.gasType || 'hydrogen';
	$: abortGasAmount = launchGasRequired;
	// Route for city choice modal during hazard response
	$: hazardRoute = pendingLaunch?.routeId
		? routes.find((r) => r.id === pendingLaunch.routeId)
		: null;

	// Peeked hazard - from Navigator card or Weather Bureau
	$: peekedHazard = $myState?.peekedHazard;

	// Ministry card selection - drawn 2 cards, must discard 1
	$: drawnMinistryCards = $myState?.drawnMinistryCards;

	async function handleDiscardMinistryCard(cardIndex: number) {
		const result = await sendAction({
			actionType: 'DISCARD_MINISTRY_CARD',
			actionData: { cardIndex }
		});
		if (result.success) {
			const keptCard = drawnMinistryCards?.[cardIndex === 0 ? 1 : 0];
			showToast(`Kept ${keptCard?.name || 'card'}`, 'success');
		} else {
			showToast(result.error || 'Failed to select card', 'error');
		}
	}

	function handleMinistryCardSelect(event: CustomEvent<{ keepIndex: number }>) {
		// Convert keepIndex to discardIndex (discard the other card)
		const discardIndex = event.detail.keepIndex === 0 ? 1 : 0;
		handleDiscardMinistryCard(discardIndex);
	}

	async function handleKeepHazard() {
		const result = await sendAction({
			actionType: 'KEEP_HAZARD',
			actionData: {}
		});
		if (result.success) {
			showToast('Hazard kept in deck', 'info');
		} else {
			showToast(result.error || 'Failed to keep hazard', 'error');
		}
	}

	async function handleDiscardHazard() {
		const result = await sendAction({
			actionType: 'DISCARD_HAZARD',
			actionData: {}
		});
		if (result.success) {
			showToast('Hazard discarded!', 'success');
		} else {
			showToast(result.error || 'Failed to discard hazard', 'error');
		}
	}

	async function handleRespondToHazard(spendEngineers: boolean) {
		if (!pendingLaunch) return;

		// Determine outcome based on hazard type and response
		const isNoSave = pendingHazard?.noSave || pendingHazard?.type === 'catastrophic_explosion';
		const isFireHazard = pendingHazard?.category === 'fire';

		// For fire hazards (hydrogen), spending engineers → Damaged (ship to repair, no route)
		// For non-fire hazards, spending engineers → Success (route claimed)
		// Auto-pass always claims route (including helium fire immunity)
		const willClaimRoute = !isNoSave && (
			pendingHazard?.autoPassReason ||
			(!isFireHazard && (
				pendingHazard?.engineersNeeded === 0 ||
				(spendEngineers && canAffordEngineers)
			))
		);

		// Age 2 missions don't need city choice - just complete the mission
		const isMission = pendingLaunch.missionId && ($gameState?.age === 2);

		if (willClaimRoute && !isMission && hazardRoute) {
			// Show city modal - city choice needed for successful route launch
			pendingHazardResponse = { spendEngineers };
			showCityModal = true;
		} else {
			// Fire hazard (damaged/destroyed), mission, or abort
			const result = await sendAction({
				actionType: 'RESPOND_TO_HAZARD',
				actionData: {
					spendEngineers
				}
			});
			if (result.success) {
				if (isNoSave) {
					showToast('Ship destroyed!', 'error');
				} else if (isMission) {
					showToast('Mission completed!', 'success');
				} else if (isFireHazard && spendEngineers) {
					showToast('Fire controlled - ship damaged, moved to repair bay', 'warning');
				} else if (isFireHazard) {
					showToast('Ship destroyed by fire!', 'error');
				} else {
					showToast('Launch aborted - ship returns to hangar', 'info');
				}
			} else {
				showToast(result.error || 'Failed to respond to hazard', 'error');
			}
		}
	}

	// Market/reveal phase derived values
	$: isRevealPhase = $gameState?.phase === 'reveal';
	$: isAgeTransitionBlueprintDesignPhase = $gameState?.phase === 'age_transition_blueprint_design';
	// Player is in purchase selection when they've revealed (hasPassed) or phase is reveal
	$: isInPurchaseSelection = $myState?.hasPassed === true || isRevealPhase;

	// Auto-enter blueprint design mode for age transition phase
	$: {
		if (isAgeTransitionBlueprintDesignPhase && $isMyTurn && !blueprintDesignMode && $myState?.blueprint) {
			// Check if we haven't already completed this phase
			const completedPlayers = $gameState?.ageTransitionBlueprintDesign?.completedPlayers || [];
			if (!completedPlayers.includes($effectiveUserId || '')) {
				blueprintDesignMode = true;
				pendingBlueprint = structuredClone($myState.blueprint);
				blueprintDesignCardIndex = -1; // Special marker for age transition (no card used)
				activeTab = 'blueprint';
			}
		}
	}
	$: isMarketInteractive = isInPurchaseSelection;
	$: hasPendingPurchases = (pendingMarketPurchases.length > 0) || (pendingTechAcquisitions.length > 0);
	$: marketCards = $gameState?.marketCards || [];
	$: reserveCard = $gameState?.reserveCard || null;
	$: reserveTechCard = $gameState?.reserveTechCard || null;
	$: techCards = $gameState?.rdBoard || [];
	$: marketCardsClaimed = $gameState?.marketCardsClaimed || {};
	$: techCardsClaimed = $gameState?.techCardsClaimed || {};
	$: pendingMarketPurchases = $myState?.pendingMarketPurchases || [];
	$: pendingTechAcquisitions = $myState?.pendingTechAcquisitions || [];
	$: playerInfluence = $myState?.influence || 0;
	$: playerResearch = ($myState?.research || 0) + ($myState?.engineers || 0);

	// Calculate projected influence and research at reveal time
	// Per Section 5.1: Research = Research Level + Engineers + card reveal bonuses
	// Influence = card reveal bonuses only
	// Subtract any pending purchases/acquisitions to show remaining budget
	$: revealBudget = (() => {
		const hand = $myState?.hand || [];
		const researchLevel = $myState?.researchLevel || 0;
		const engineers = $myState?.engineers || 0;
		let cardInfluence = 0;
		let cardResearch = 0;

		for (const card of hand) {
			const revealData = card.reveal || card.revealBonus;
			if (revealData) {
				cardInfluence += revealData.influence || 0;
				cardResearch += revealData.research || 0;
			}
		}

		// Subtract pending market purchases (influence cost)
		const spentInfluence = pendingMarketPurchases.reduce((sum, p) => sum + (p.cost || 0), 0);
		// Subtract pending tech acquisitions (research cost)
		const spentResearch = pendingTechAcquisitions.reduce((sum, p) => sum + (p.cost || 0), 0);

		const totalInfluence = cardInfluence;
		const totalResearch = researchLevel + engineers + cardResearch;

		return {
			influence: totalInfluence - spentInfluence,
			research: totalResearch - spentResearch,
			// Breakdown for tooltips
			influenceTooltip: `Influence: ${cardInfluence} (cards)` +
				(spentInfluence > 0 ? ` - ${spentInfluence} (pending)` : '') +
				` = ${totalInfluence - spentInfluence}`,
			researchTooltip: `Research: ${researchLevel} (level) + ${engineers} (engineers) + ${cardResearch} (cards)` +
				(spentResearch > 0 ? ` - ${spentResearch} (pending)` : '') +
				` = ${totalResearch - spentResearch}`
		};
	})();
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
						<div class="player-card" class:host={player.id === $lobbyGame?.host_id} class:bot={player.isBot}>
							<span class="player-name">{player.isBot ? player.botName : player.username}</span>
							{#if player.id === $lobbyGame?.host_id}
								<span class="host-badge">Host</span>
							{/if}
							{#if player.isBot}
								<span class="bot-badge">Bot</span>
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

			<!-- Game Advancement Track -->
			<div class="header-center">
				<div class="advancement-track">
					{#each Array(progressThresholds.end + 1) as _, i}
						<div
							class="track-space"
							class:current={i === progressTrack}
							class:passed={i < progressTrack}
							class:milestone={i === progressThresholds.age2 ||
								i === progressThresholds.age3 ||
								i === progressThresholds.end}
							class:age2={i === progressThresholds.age2}
							class:age3={i === progressThresholds.age3}
							class:game-end={i === progressThresholds.end}
							class:age-1-zone={i < progressThresholds.age2}
							class:age-2-zone={i >= progressThresholds.age2 && i < progressThresholds.age3}
							class:age-3-zone={i >= progressThresholds.age3}
						>
							{#if i === progressTrack}
								<span class="marker">●</span>
							{:else if i === progressThresholds.age2}
								<span class="milestone-label">II</span>
							{:else if i === progressThresholds.age3}
								<span class="milestone-label">III</span>
							{:else if i === progressThresholds.end}
								<span class="milestone-label">⚑</span>
							{:else}
								<span class="space-dot">·</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<div class="header-right">
				{#if $isMyTurn}
					<div class="turn-indicator your-turn">Your Turn</div>
				{:else}
					{@const waitingPlayer = $allPlayers.find((p) => p.id === $currentPlayerId)}
					<div class="turn-indicator waiting">
						Waiting for {waitingPlayer?.botName || waitingPlayer?.faction || 'player'}
						{#if waitingPlayer?.isBot}<span class="bot-tag">(Bot)</span>{/if}
					</div>
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
					viewedPlayerId={viewedPlayerIdResolved}
					firstPlayer={$gameState.firstPlayer}
					on:selectPlayer={handleSelectPlayer}
				/>

				{#if shipStats}
					<div class="panel ship-stats-panel">
						<h3>Ship Stats</h3>
						<ShipStats stats={shipStats} age={$gameState?.age || 1} />
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
						{$gameState?.age === 2 ? 'Missions' : 'Map'}
					</button>
					<button
						class="tab-btn"
						class:active={activeTab === 'blueprint'}
						on:click={() => (activeTab = 'blueprint')}
					>
						Blueprint
					</button>
					<button
						class="tab-btn"
						class:active={activeTab === 'market'}
						on:click={() => (activeTab = 'market')}
					>
						Market
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
									heliumPrice={$gameState.gasMarket?.helium || 2}
									on:placeAgent={handlePlaceAgent}
								/>
							</section>
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
								hasShipsInHangar={hasShipsToLaunch}
								{playerFactions}
								missionRow={$gameState?.missionRow || []}
								myFaction={$myState?.faction}
								selectable={$isMyTurn && isLaunchpadActive}
								on:selectRoute={(e) => { selectedRouteId = e.detail.route?.id; }}
							/>
							{#if isLaunchpadActive && selectedRouteId}
								<p class="route-selected">Selected route: {selectedRouteId}</p>
							{/if}
						</div>
					{:else if activeTab === 'blueprint'}
						<div class="blueprint-tab">
							{#if !isViewingOwnBlueprint && viewedPlayerState}
								<!-- Viewing another player's blueprint -->
								<div class="viewing-banner">
									<span class="viewing-label">Viewing:</span>
									<span class="viewing-faction" style:color={getFactionBorderColor(viewedPlayerState.faction)}>
										{viewedPlayerState.faction}
									</span>
									<button class="btn secondary btn-sm" on:click={() => { viewedPlayerId = null; }}>
										Back to My Blueprint
									</button>
								</div>
								<AirshipBlueprint
									blueprint={viewedPlayerState.blueprint}
									age={$gameState?.age || 1}
								/>
								<TechList
									techCards={viewedPlayerState.techCards || []}
									pendingTechAcquisitions={[]}
									rdBoard={techCards}
									showUndo={false}
								/>
							{:else if blueprintDesignMode && pendingBlueprint}
								<!-- Blueprint Design editing mode -->
								<AirshipBlueprint
									blueprint={pendingBlueprint}
									age={$gameState?.age || 1}
									editMode={true}
									selectedTileId={selectedTechTileId}
									on:slotClick={handleBlueprintSlotClick}
									on:placeTile={handlePlaceTile}
									on:removeTile={handleRemoveTile}
								/>
								<!-- Tech card rows below blueprint -->
								<TechList
									techCards={$myState?.techCards || []}
									{pendingTechAcquisitions}
									rdBoard={techCards}
									showUndo={isRevealPhase && $isMyTurn}
									on:undo={(e) => handleUndoPurchase({ detail: { cardId: e.detail.cardId, type: 'tech' } })}
								/>
							{:else if $myState?.blueprint}
								<!-- Normal view mode -->
								<AirshipBlueprint
									blueprint={$myState.blueprint}
									age={$gameState?.age || 1}
									on:slotClick={handleBlueprintSlotClick}
								/>
								<!-- Tech card rows below blueprint -->
								<TechList
									techCards={$myState?.techCards || []}
									{pendingTechAcquisitions}
									rdBoard={techCards}
									showUndo={isRevealPhase && $isMyTurn}
									on:undo={(e) => handleUndoPurchase({ detail: { cardId: e.detail.cardId, type: 'tech' } })}
								/>
							{/if}
						</div>
					{:else if activeTab === 'market'}
						<div class="market-tab">
							<MarketSection
								{marketCards}
								{reserveCard}
								{reserveTechCard}
								{techCards}
								claimedMarket={marketCardsClaimed}
								claimedTech={techCardsClaimed}
								{pendingMarketPurchases}
								{pendingTechAcquisitions}
								interactive={isMarketInteractive}
								myPlayerId={$effectiveUserId}
								players={$gameState.players}
								playerTechCards={$myState?.techCards || []}
								{installedTileIds}
								on:buyMarket={handleBuyMarketCard}
								on:buyTech={handleBuyTechCard}
								on:undoPurchase={handleUndoPurchase}
							/>
						</div>
					{/if}
				</div>
			</main>

			<!-- Right sidebar - Hand and Actions -->
			<aside class="sidebar right">
				<div class="panel actions">
					<!-- Action Preview Panel (shown when a location is selected but not yet confirmed) -->
					{#if pendingActionPreview}
						<div class="action-preview-panel">
							<h4 class="preview-title">{pendingActionPreview.locationName}</h4>

							{#if pendingActionPreview.costs.length > 0}
								<div class="preview-section">
									<span class="preview-label">Spend:</span>
									<div class="preview-items">
										{#each pendingActionPreview.costs as cost}
											<div class="preview-item cost">
												<Icon name={cost.icon} size={16} />
												<span>{cost.label}</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							{#if pendingActionPreview.benefits.length > 0}
								<div class="preview-section">
									<span class="preview-label">Gain:</span>
									<div class="preview-items">
										{#each pendingActionPreview.benefits as benefit}
											<div class="preview-item benefit">
												<Icon name={benefit.icon} size={16} />
												<span>{benefit.label}</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<div class="preview-buttons">
								<button class="btn primary w-full" on:click={handleConfirmPreview}>
									Confirm
								</button>
								<button class="btn secondary w-full" on:click={handleCancelPreview}>
									Cancel
								</button>
							</div>
						</div>
					{:else if blueprintDesignMode}
						<!-- Blueprint Design editing mode -->
						<p class="action-instruction">
							{#if isAgeTransitionBlueprintDesignPhase}
								<strong>Age Transition:</strong> Fill empty Frame and Fabric slots
							{:else if selectedTechTileId}
								Click a highlighted slot to place the tile
							{:else}
								Select a tech tile on the right, then click a blueprint slot
							{/if}
						</p>
						<!-- Retrofit Cost Receipt -->
						{#if retrofitCostInfo}
							<RetrofitReceipt
								startingCash={retrofitCostInfo.startingCash}
								oldHullCost={retrofitCostInfo.oldHullCost}
								newHullCost={retrofitCostInfo.newHullCost}
								costIncrease={retrofitCostInfo.costIncrease}
								shipsToRetrofit={retrofitCostInfo.shipsToRetrofit}
								retrofitCost={retrofitCostInfo.retrofitCost}
								remainingCash={retrofitCostInfo.remainingCash}
								isAgeTransition={retrofitCostInfo.isAgeTransition}
							/>
						{/if}
						{#if previewShipStats}
							<div class="blueprint-design-stats">
								<ShipStats stats={previewShipStats} age={$gameState?.age || 1} />
							</div>
						{/if}
						<div class="blueprint-design-buttons">
							<button
								class="btn primary w-full"
								on:click={handleBlueprintDesignDone}
								disabled={!canAffordRetrofit}
							>
								{isAgeTransitionBlueprintDesignPhase ? 'Continue to Next Age' : 'Done'}
							</button>
							{#if !isAgeTransitionBlueprintDesignPhase}
								<button class="btn secondary w-full" on:click={handleBlueprintDesignCancel}>
									Cancel
								</button>
							{/if}
						</div>
					{:else if showBlueprintTiles && !isLaunchpadActive && !pendingLaunch}
						<!-- Blueprint tab view mode - show tech tiles info -->
						<p class="action-instruction">
							View your blueprint and available tech tiles
						</p>
						<p class="action-hint">
							Place an agent at Blueprint Design to modify your blueprint
						</p>
					{:else if isInPurchaseSelection && !isLaunchpadActive && !pendingLaunch}
						<!-- Purchase selection mode (after clicking Reveal) -->
						<p class="action-instruction">Choose Agent and Tech cards to purchase</p>
						<div class="reveal-row">
							<button class="btn primary" on:click={handleEndTurn}>
								End Turn
							</button>
							<div class="reveal-budget">
								<div class="budget-icon diamond" title={revealBudget.influenceTooltip}>
									<span class="budget-value">{revealBudget.influence}</span>
								</div>
								<div class="budget-icon square" title={revealBudget.researchTooltip}>
									<span class="budget-value">{revealBudget.research}</span>
								</div>
							</div>
						</div>
						{#if hasPendingPurchases}
							<button class="btn secondary w-full" on:click={handleUndo}>
								Undo Purchases
							</button>
						{/if}
					{:else if isWorkerPlacementPhase && !isLaunchpadActive && !pendingLaunch}
						<p class="action-instruction">
							{#if ($myState?.agentsRemaining || 0) <= 0}
								No agents available. Click Reveal.
							{:else if selectedCardIndex !== null}
								Select a location to place your agent
							{:else}
								Select a card, or click Reveal to exit worker placement
							{/if}
						</p>
						<!-- Reveal button with budget indicators -->
						{#if $isMyTurn}
							<div class="reveal-row">
								<button class="btn primary" on:click={handleReveal}>
									Reveal
								</button>
								<div class="reveal-budget">
									<div class="budget-icon diamond" title={revealBudget.influenceTooltip}>
										<span class="budget-value">{revealBudget.influence}</span>
									</div>
									<div class="budget-icon square" title={revealBudget.researchTooltip}>
										<span class="budget-value">{revealBudget.research}</span>
									</div>
								</div>
							</div>
							<!-- Undo only visible when available -->
							{#if $turnInfo.canUndo}
								<button class="btn secondary w-full" on:click={handleUndo}>
									Undo {$turnInfo.lastActionType || ''}
								</button>
							{/if}
						{/if}
					{:else if $gameState.phase === 'income_cleanup'}
						<p class="action-instruction">Collecting income...</p>
					{/if}

					{#if peekedHazard}
						<!-- Peeked Hazard Display - from Navigator card or Weather Bureau -->
						<div class="peeked-hazard-panel">
							<h4>Peeked Hazard</h4>
							<div class="hazard-card-wrapper">
								<HazardCard
									name={peekedHazard.name || peekedHazard.type}
									category={peekedHazard.category || 'minor'}
									difficulty={peekedHazard.difficulty || 0}
									challengeType={peekedHazard.challengeType || ''}
									engineerCost={peekedHazard.engineerCost}
									flak={peekedHazard.flak || 0}
									showFlak={$gameState?.age === 2}
									compact={true}
								/>
							</div>
							<p class="peeked-hint">This is the top card of your hazard deck.</p>
							{#if $isMyTurn}
								<div class="hazard-buttons">
									<button class="btn success" on:click={handleDiscardHazard}>
										Discard Hazard
									</button>
									<button class="btn secondary" on:click={handleKeepHazard}>
										Keep in Deck
									</button>
								</div>
							{/if}
						</div>
					{/if}

						{#if $isMyTurn}
						{#if pendingLaunch && pendingHazard}
							<!-- Hazard Response UI - ship awaiting hazard check -->
							<div class="hazard-panel">
								<h4>Hazard Check</h4>
								<div class="hazard-card-wrapper">
									<HazardCard
										name={pendingHazard.name}
										category={pendingHazard.category || 'minor'}
										difficulty={pendingHazard.difficulty || 0}
										challengeType={pendingHazard.challengeType || pendingHazard.statName || ''}
										engineerCost={pendingHazard.engineersNeeded}
										flak={pendingHazard.flak || 0}
										showFlak={$gameState?.age === 2}
										compact={true}
									/>
								</div>
								{#if $gameState?.age === 2 && pendingLaunch?.missionId}
									{@const armor = pendingLaunch.armor || 0}
									{@const flak = pendingHazard.flak || 0}
									<div class="flak-warning" class:will-survive={armor >= flak} class:will-die={flak > armor}>
										{#if flak === 0}
											<span class="flak-safe">No anti-aircraft fire</span>
										{:else if flak > armor}
											<span class="flak-danger">⚠ Flak {flak} > Armor {armor} — Ship will be destroyed!</span>
										{:else}
											<span class="flak-ok">Armor {armor} ≥ Flak {flak} — Ship will survive</span>
										{/if}
									</div>
								{/if}
								<div class="hazard-actions">
									{#if pendingHazard.autoPassReason}
										<p class="hazard-auto-pass">Auto-pass: {pendingHazard.autoPassReason}</p>
										<button class="btn primary w-full" on:click={() => handleRespondToHazard(false)}>
											Continue
										</button>
									{:else if pendingHazard.noSave || pendingHazard.type === 'catastrophic_explosion'}
										<p class="hazard-catastrophic">Airship and crew lost!</p>
										<p class="hazard-info">No save possible.</p>
										<button class="btn danger w-full" on:click={() => handleRespondToHazard(false)}>
											Acknowledge
										</button>
									{:else if pendingHazard.engineersNeeded > 0}
										<p class="hazard-available">
											You have: {$myState?.engineers || 0} Engineers
										</p>
										{@const isFireHazard = pendingHazard.category === 'fire'}
										{#if !canAffordEngineers}
											<p class="hazard-abort-outcome">
												{#if isFireHazard}
													Ship destroyed: insufficient engineers to control fire.
												{:else}
													Launch aborted: {abortGasAmount} {abortGasType} lost, officers refunded, ship returns to hangar.
												{/if}
											</p>
										{/if}
										<div class="hazard-buttons">
											{#if canAffordEngineers}
												<button class="btn primary w-full" on:click={() => handleRespondToHazard(true)}>
													Spend {pendingHazard.engineersNeeded} Engineer{pendingHazard.engineersNeeded > 1 ? 's' : ''} → {isFireHazard ? 'Damaged' : 'Success'}
												</button>
											{/if}
											<button class="btn {canAffordEngineers ? 'secondary' : 'danger'} w-full" on:click={() => handleRespondToHazard(false)}>
												{#if canAffordEngineers}
													Don't Spend → {isFireHazard ? 'Destroyed' : 'Aborted'}
												{:else}
													Confirm {isFireHazard ? 'Destroyed' : 'Aborted'}
												{/if}
											</button>
										</div>
									{:else}
										<p class="hazard-info">
											{pendingHazard.statName ? `${pendingHazard.statName.charAt(0).toUpperCase() + pendingHazard.statName.slice(1)} check passed: ${pendingHazard.relevantStat} ≥ ${pendingHazard.difficulty}` : 'Check passed automatically.'}
										</p>
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

								{#if !hasShipsToLaunch}
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
													<Icon name="hydrogen" size={24} />
												{/each}
											</button>
										{/if}
										{#if canAffordHelium}
											<button
												class="gas-slot helium"
												on:click={() => selectGasType('helium')}
											>
												{#each Array(launchGasRequired) as _}
													<Icon name="helium" size={24} />
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
						{/if}
					{/if}
					{#if $isMyTurn && isLaunchpadActive}
						<!-- Launchpad-specific instruction -->
						<p class="action-instruction">Launch ships or click Exit when done</p>
					{/if}

				</div>

				<!-- Budget Display (reveal phase only) -->
				{#if isRevealPhase}
					<BudgetDisplay influence={playerInfluence} research={playerResearch} />
				{/if}

				<!-- Show Tech Tiles Panel on blueprint tab, Hand Section otherwise -->
				{#if showBlueprintTiles}
					<TechTilesPanel
						tiles={availableTechTiles}
						selectedTileId={selectedTechTileId}
						selectable={blueprintDesignMode}
						on:select={handleTechTileSelect}
					/>
				{:else}
					<HandSection
						hand={Array.isArray($myState?.hand) ? $myState.hand : []}
						selectedIndex={selectedCardIndex}
						selectable={$isMyTurn && isWorkerPlacementPhase && !$myState?.hasPassed}
						deckSize={typeof $myState?.deck === 'number' ? $myState.deck : ($myState?.deck?.length || 0)}
						discardSize={typeof $myState?.discardPile === 'number' ? $myState.discardPile : ($myState?.discardPile?.length || 0)}
						on:selectCard={handleCardSelect}
					/>
				{/if}
			</aside>
		</div>
	</div>

	<ToastContainer />

	{#if showLocationModal && pendingLocationId}
		<LocationActionModal
			locationId={pendingLocationId}
			locationName={pendingLocationName}
			on:confirm={handleLocationModalConfirm}
			on:cancel={handleLocationModalCancel}
		/>
	{/if}

	{#if showCityModal && hazardRoute}
		<CitySelectionModal
			fromCity={hazardRoute.from || 'Unknown'}
			toCity={hazardRoute.to || 'Unknown'}
			on:select={handleCitySelect}
			on:cancel={handleCityModalCancel}
		/>
	{/if}

	{#if showLaunchSuccessModal && launchSuccessData}
		<LaunchSuccessModal
			routeName={launchSuccessData.routeName}
			routeIncome={launchSuccessData.routeIncome}
			cityBonus={launchSuccessData.cityBonus}
			missionName={launchSuccessData.missionName}
			missionVp={launchSuccessData.missionVp}
			on:dismiss={() => {
				showLaunchSuccessModal = false;
				launchSuccessData = null;
			}}
		/>
	{/if}

	{#if $isMyTurn && drawnMinistryCards?.length === 2}
		<MinistryCardModal
			cards={drawnMinistryCards}
			on:select={handleMinistryCardSelect}
		/>
	{/if}

	{#if $isGameComplete}
		<GameComplete />
	{/if}
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

	.bot-badge {
		font-size: 0.75rem;
		padding: 2px 6px;
		background: var(--color-info, #3b82f6);
		color: white;
		border-radius: var(--radius-sm);
		text-transform: uppercase;
	}

	.player-card.bot {
		border-left-style: dashed;
	}

	.faction-badge {
		font-size: 0.75rem;
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		text-transform: capitalize;
	}

	.faction-badge.germany { background: var(--color-faction-germany, #dc2626); color: white; } /* Red */
	.faction-badge.britain { background: var(--color-faction-britain, #1a365d); color: white; } /* Blue */
	.faction-badge.usa { background: var(--color-faction-usa, #ffffff); color: #1a1a2e; border: 1px solid #ccc; } /* White with dark text */
	.faction-badge.italy { background: var(--color-faction-italy, #16a34a); color: white; } /* Green */

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

	.header-left {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
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

	.bot-tag {
		color: var(--color-info, #3b82f6);
		font-size: 0.75rem;
		margin-left: var(--spacing-xs);
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

	/* Advancement Track */
	.advancement-track {
		display: flex;
		align-items: center;
		gap: 2px;
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--color-bg-secondary);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-bg-hover);
	}

	.track-space {
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
		color: var(--color-text-muted);
		border-radius: 3px;
		transition: all var(--transition-fast);
	}

	.track-space.passed {
		background: var(--color-bg-hover);
	}

	.track-space.current {
		background: var(--color-success);
		color: var(--color-bg-primary);
		font-weight: bold;
		animation: pulse 2s ease-in-out infinite;
	}

	.track-space.current .marker {
		font-size: 0.9rem;
	}

	.track-space.milestone {
		width: 28px;
		height: 24px;
		border: 2px solid var(--color-text-muted);
		background: rgba(255, 255, 255, 0.08);
		font-weight: 600;
	}

	.track-space.age2 {
		border-color: var(--color-info);
		color: var(--color-info);
		background: rgba(59, 130, 246, 0.15);
	}

	.track-space.age3 {
		border-color: var(--color-accent-gold);
		color: var(--color-accent-gold);
		background: rgba(245, 158, 11, 0.15);
	}

	.track-space.game-end {
		border-color: var(--color-warning);
		color: var(--color-warning);
		background: rgba(234, 179, 8, 0.15);
	}

	.track-space.passed.milestone {
		background: var(--color-bg-hover);
	}

	.track-space.passed.age2 {
		background: color-mix(in srgb, var(--color-info) 30%, transparent);
	}

	.track-space.passed.age3 {
		background: color-mix(in srgb, var(--color-accent-gold) 30%, transparent);
	}

	/* Age zone colors - subtle styling for regular spaces */
	.track-space.age-1-zone {
		border: 1px solid rgba(34, 197, 94, 0.25);
		color: rgba(34, 197, 94, 0.5);
	}

	.track-space.age-2-zone {
		border: 1px solid rgba(239, 68, 68, 0.25);
		color: rgba(239, 68, 68, 0.5);
	}

	.track-space.age-3-zone {
		border: 1px solid rgba(245, 158, 11, 0.25);
		color: rgba(245, 158, 11, 0.5);
	}

	.track-space.passed.age-1-zone {
		background: rgba(34, 197, 94, 0.15);
	}

	.track-space.passed.age-2-zone {
		background: rgba(239, 68, 68, 0.15);
	}

	.track-space.passed.age-3-zone {
		background: rgba(245, 158, 11, 0.15);
	}

	/* Current marker inherits zone color but with full opacity background */
	.track-space.current.age-1-zone {
		background: var(--color-success);
		color: var(--color-bg-primary);
	}

	.track-space.current.age-2-zone {
		background: var(--color-error);
		color: var(--color-bg-primary);
	}

	.track-space.current.age-3-zone {
		background: var(--color-accent-gold);
		color: var(--color-bg-primary);
	}

	.milestone-label {
		font-weight: 600;
		font-size: 0.65rem;
	}

	.space-dot {
		font-size: 1rem;
		line-height: 1;
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

	.viewing-banner {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-bg-hover);
		border-radius: var(--radius-md);
		border-left: 3px solid var(--color-accent-gold);
	}

	.viewing-label {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
	}

	.viewing-faction {
		font-size: 0.9rem;
		font-weight: 700;
		text-transform: capitalize;
	}

	.viewing-banner .btn {
		margin-left: auto;
	}

	.btn-sm {
		padding: var(--spacing-xs) var(--spacing-sm);
		font-size: 0.75rem;
	}

	.market-tab {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
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
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	/* Action Preview Panel */
	.action-preview-panel {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm);
		background: rgba(59, 130, 246, 0.1);
		border: 2px solid var(--color-info);
		border-radius: var(--radius-md);
	}

	.preview-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-info);
		text-align: center;
	}

	.preview-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.preview-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.preview-items {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.preview-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs);
		background: rgba(0, 0, 0, 0.2);
		border-radius: var(--radius-sm);
		font-size: 0.85rem;
	}

	.preview-item.cost {
		color: var(--color-warning);
	}

	.preview-item.benefit {
		color: var(--color-success);
	}

	.preview-buttons {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		margin-top: var(--spacing-xs);
	}

	.action-instruction {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-text-primary);
		text-align: center;
		margin: 0;
		padding: var(--spacing-xs) 0;
	}

	.reveal-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.reveal-row .btn {
		flex: 1;
	}

	.reveal-budget {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.reveal-budget .budget-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: #888;
		color: white;
	}

	.reveal-budget .budget-icon.diamond {
		width: 17px;
		height: 17px;
		transform: rotate(45deg);
		border-radius: 2px;
	}

	.reveal-budget .budget-icon.diamond .budget-value {
		transform: rotate(-45deg);
		font-size: 0.7rem;
	}

	.reveal-budget .budget-icon.square {
		border-radius: 2px;
	}

	.reveal-budget .budget-value {
		font-size: 0.8rem;
		font-weight: 700;
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

	/* Hazard Card Wrapper - centers the HazardCard component */
	.hazard-card-wrapper {
		display: flex;
		justify-content: center;
		padding: var(--spacing-xs) 0;
	}

	.hazard-actions {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
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

	.hazard-abort-outcome {
		font-size: 0.8rem;
		color: var(--color-text-primary);
		background: var(--color-bg-secondary);
		padding: var(--spacing-sm);
		border-radius: var(--radius-sm);
		margin: var(--spacing-sm) 0;
		border-left: 3px solid var(--color-warning);
	}

	.hazard-info {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
		margin: 0;
	}

	/* Flak warning for Age II missions */
	.flak-warning {
		font-size: 0.8rem;
		padding: var(--spacing-sm);
		border-radius: var(--radius-sm);
		margin: var(--spacing-sm) 0;
		text-align: center;
		font-weight: 600;
	}

	.flak-warning.will-survive {
		background: rgba(76, 175, 80, 0.15);
		border: 1px solid var(--color-success);
	}

	.flak-warning.will-die {
		background: rgba(244, 67, 54, 0.15);
		border: 1px solid var(--color-error);
	}

	.flak-safe {
		color: var(--color-success);
	}

	.flak-ok {
		color: var(--color-success);
	}

	.flak-danger {
		color: var(--color-error);
	}

	.hazard-catastrophic {
		font-size: 1rem;
		font-weight: bold;
		color: var(--color-error);
		margin: 0;
	}

	.btn.danger {
		background: var(--color-error);
		color: white;
		border-color: var(--color-error);
	}

	.btn.danger:hover {
		background: #c9302c;
		border-color: #c9302c;
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

	/* Blueprint Design Mode */
	.blueprint-design-stats {
		margin-bottom: var(--spacing-sm);
	}

	.blueprint-design-buttons {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
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
