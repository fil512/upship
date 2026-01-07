/**
 * Action Processor Service
 * Handles all game action processing logic
 * Extracted from gameState.js routes for better separation of concerns
 */

import type { GameState, PlayerState, Card, Ship, Route } from '@upship/api';

const {
  TECH_TILES,
  TECH_CARDS
} = require('../data/upgrades');
const {
  GROUND_BOARD_LOCATIONS,
  canPlaceAtLocation
} = require('../data/groundBoard');

const {
  shuffleArray,
  getCurrentPlacer,
  advanceToNextPlacer,
  allPlayersPassed,
  transitionToRevealPhase,
  transitionToIncomeCleanup,
  startNewRound,
  advanceHeliumMarket,
  processCardEffect,
  executeLocationAction,
  addAgeTechCards,
  refillRDBoard,
  calculateSpecializationDiscount,
  calculateBlueprintStats,
  calculateRequiredGasCubes
} = require('./gameStateHelpers');

// Action result type
interface ActionResult {
  newState?: GameState;
  error?: string;
}

// Log entry structure
interface LogEntry {
  timestamp: string;
  message: string;
  playerId?: string;
  type: string;
}

// Extended game state with log
type StateWithLog = GameState & { log: LogEntry[] };

// Tech tile definition
interface TechTile {
  id: string;
  name: string;
  slotType: string;
  age: number;
  requiredCard: string;
  hullCost?: number;
  [key: string]: unknown;
}

// Tech card definition
interface TechCard {
  id: string;
  name: string;
  cost: number;
  type?: string;
  vp?: number;
  [key: string]: unknown;
}

// Ship stats
interface ShipStats {
  speed: number;
  range: number;
  ceiling: number;
  reliability: number;
  luxury?: number;
  [key: string]: number | undefined;
}

// Blueprint structure
interface Blueprint {
  frameSlots: (string | null)[];
  fabricSlots: (string | null)[];
  driveSlots: (string | null)[];
  componentSlots: (string | null)[];
  [key: string]: unknown;
}

// Hazard card structure
interface HazardCardCheck {
  type: string;
  difficulty: number;
  id?: string;
}

// Hazard check result
interface HazardCheckResult {
  hazardType: string;
  difficulty: number;
  safetyRating: number;
  success: boolean;
  timestamp: string;
}

// Score breakdown
interface ScoreBreakdown {
  routes: number;
  techCards: number;
  cash: number;
  ships: number;
}

// Player score
interface PlayerScore {
  total: number;
  breakdown: ScoreBreakdown;
  faction: string;
}

// Main action dispatcher
function processAction(
  state: GameState,
  playerId: string,
  actionType: string,
  data: Record<string, unknown>
): ActionResult {
  const newState = structuredClone(state); // Deep clone (faster than JSON.parse/stringify)
  const playerState = newState.players[playerId];

  if (!playerState) {
    return { error: 'Player not found in game' };
  }

  switch (actionType) {
    case 'END_TURN':
      return processEndTurn(newState, playerId);

    case 'BUY_GAS':
      return processBuyGas(newState, playerId, data);

    case 'ACQUIRE_TECHNOLOGY':
      return processAcquireTechnology(newState, playerId, data);

    case 'INSTALL_UPGRADE':
      return processInstallUpgrade(newState, playerId, data);

    case 'REMOVE_UPGRADE':
      return processRemoveUpgrade(newState, playerId, data);

    case 'TAKE_LOAN':
      return processTakeLoan(newState, playerId, data);

    case 'COLLECT_INCOME':
      return processCollectIncome(newState, playerId, data);

    case 'PLAY_CARD':
      return processPlayCard(newState, playerId, data);

    case 'DRAW_CARDS':
      return processDrawCards(newState, playerId, data);

    case 'PLACE_AGENT':
      return processPlaceAgent(newState, playerId, data);

    case 'PASS':
      return processPass(newState, playerId);

    case 'RECALL_AGENTS':
      return processRecallAgents(newState, playerId, data);

    case 'RECRUIT_CREW':
      return processRecruitCrew(newState, playerId, data);

    case 'BUILD_SHIP':
      return processBuildShip(newState, playerId, data);

    case 'UPGRADE_OFFICER_INCOME':
      return processUpgradeOfficerIncome(newState, playerId, data);

    case 'UPGRADE_ENGINEER_INCOME':
      return processUpgradeEngineerIncome(newState, playerId, data);

    case 'BUY_INSURANCE':
      return processBuyInsurance(newState, playerId, data);

    case 'ACQUIRE_TECHNOLOGY_RESEARCH':
      return processAcquireTechnologyResearch(newState, playerId, data);

    case 'GAIN_RESEARCH':
      return processGainResearch(newState, playerId, data);

    case 'LOAD_GAS':
      return { error: 'LOAD_GAS is deprecated. Gas is spent from reserve when launching - use LAUNCH_SHIP with gasType parameter.' };

    case 'UNLOAD_GAS':
      return { error: 'UNLOAD_GAS is deprecated. Gas is spent from reserve when launching.' };

    case 'LAUNCH_SHIP':
      return processLaunchShip(newState, playerId, data);

    case 'CLAIM_ROUTE':
      return processClaimRoute(newState, playerId, data);

    case 'PERFORM_HAZARD_CHECK':
      return processHazardCheck(newState, playerId, data);

    case 'BUY_MARKET_CARD':
      return processBuyMarketCard(newState, playerId, data);

    case 'DISCARD_HAZARD':
      return processDiscardHazard(newState, playerId, data);

    case 'DISCARD_MARKET_CARD':
      return processDiscardMarketCard(newState, playerId, data);

    case 'CALCULATE_SCORES':
      return processCalculateScores(newState, playerId, data);

    default:
      return { error: `Unknown action type: ${actionType}` };
  }
}

// Extended player state with peekedHazard
type PlayerWithPeekedHazard = PlayerState & { peekedHazard?: HazardCardCheck };

// Discard a peeked hazard card (from Weather Bureau)
function processDiscardHazard(state: GameState, playerId: string, _data: Record<string, unknown>): ActionResult {
  const playerState = state.players[playerId] as PlayerWithPeekedHazard;
  const stateWithLog = state as StateWithLog;

  if (!playerState.peekedHazard) {
    return { error: 'No peeked hazard to discard. Visit Weather Bureau first.' };
  }

  // Remove the top card from hazard deck
  const hazardDeck = (playerState.hazardDeck || []) as HazardCardCheck[];
  if (hazardDeck.length > 0 && hazardDeck[0].id === playerState.peekedHazard.id) {
    const discarded = hazardDeck.shift()!;
    stateWithLog.log.push({
      timestamp: new Date().toISOString(),
      message: `Discarded hazard: ${discarded.type} (difficulty ${discarded.difficulty})`,
      playerId,
      type: 'action'
    });
  }

  // Clear peeked hazard
  delete playerState.peekedHazard;

  return { newState: state };
}

// Extended state with marketCards
type StateWithMarket = GameState & { marketCards?: Card[] };

// Discard leftmost Market card (from Academy)
function processDiscardMarketCard(state: GameState, playerId: string, _data: Record<string, unknown>): ActionResult {
  const stateWithMarket = state as StateWithMarket;
  const stateWithLog = state as StateWithLog;
  const marketCards = stateWithMarket.marketCards || [];

  if (marketCards.length === 0) {
    return { error: 'Market row is empty' };
  }

  // Remove leftmost card
  const discarded = marketCards.shift()!;

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Discarded leftmost Market card: ${discarded.name}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Extended player state with hasPassed and hasTakenActionThisTurn
type PlayerWithFlags = PlayerState & { hasPassed?: boolean; hasTakenActionThisTurn?: boolean };

// End turn - behavior depends on current phase
function processEndTurn(state: GameState, playerId: string): ActionResult {
  const playerState = state.players[playerId] as PlayerWithFlags;
  const stateWithLog = state as StateWithLog;

  switch (state.phase) {
    case 'worker_placement': {
      // During worker placement, END_TURN advances to next placer
      // Player is marked as passed for this round
      playerState.hasPassed = true;
      if (!state.workerPlacement!.passedPlayers.includes(playerId)) {
        state.workerPlacement!.passedPlayers.push(playerId);
      }
      playerState.hasTakenActionThisTurn = false;

      stateWithLog.log.push({
        timestamp: new Date().toISOString(),
        message: `${playerState.faction.toUpperCase()} ends their turn`,
        playerId,
        type: 'turn'
      });

      // Check if all players have passed or advance to next
      if (allPlayersPassed(state)) {
        transitionToRevealPhase(state);
      } else {
        advanceToNextPlacer(state);
      }
      break;
    }

    case 'reveal': {
      // During reveal phase, END_TURN signals done with tech/market purchases
      state.revealPhase!.techAcquisitionsComplete[playerId] = true;
      state.revealPhase!.marketPurchasesComplete[playerId] = true;

      stateWithLog.log.push({
        timestamp: new Date().toISOString(),
        message: `${playerState.faction.toUpperCase()} finished reveal phase actions`,
        playerId,
        type: 'turn'
      });

      // Check if all players are done with reveal phase
      const allDone = state.playerOrder.every(pid =>
        state.revealPhase!.techAcquisitionsComplete[pid] &&
        state.revealPhase!.marketPurchasesComplete[pid]
      );

      if (allDone) {
        transitionToIncomeCleanup(state);
      }
      break;
    }

    case 'income_cleanup':
      // During income/cleanup, END_TURN advances to next player
      // When all players done, start new round
      state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.playerOrder.length;

      stateWithLog.log.push({
        timestamp: new Date().toISOString(),
        message: `${playerState.faction.toUpperCase()} ended their turn`,
        playerId,
        type: 'turn'
      });

      if (state.currentPlayerIndex === 0) {
        // All players have completed income/cleanup, start new round
        startNewRound(state);
      }
      break;

    default:
      // Fallback for any other phase - advance player
      state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.playerOrder.length;
      stateWithLog.log.push({
        timestamp: new Date().toISOString(),
        message: `Player ended their turn`,
        playerId,
        type: 'turn'
      });
  }

  return { newState: state };
}

// Buy gas data
interface BuyGasData {
  gasType: 'hydrogen' | 'helium';
  amount: number;
}

// Buy gas cubes
function processBuyGas(state: GameState, playerId: string, data: Record<string, unknown>): ActionResult {
  const { gasType, amount } = data as BuyGasData;
  const playerState = state.players[playerId];
  const stateWithLog = state as StateWithLog;

  if (!['hydrogen', 'helium'].includes(gasType)) {
    return { error: 'Invalid gas type' };
  }

  // Helium requires Helium Handling tech card (Section 4.4)
  if (gasType === 'helium') {
    const techCards = (playerState as PlayerState & { techCards?: { id: string }[] }).techCards;
    const hasHeliumHandling = techCards?.some((t: { id: string }) => t.id === 'HELIUM_HANDLING');
    if (!hasHeliumHandling) {
      return { error: 'Cannot purchase Helium without Helium Handling tech card' };
    }
  }

  const price = state.gasMarket[gasType] * amount;

  if (playerState.cash < price) {
    return { error: 'Not enough cash' };
  }

  playerState.cash -= price;
  playerState.gasCubes[gasType] += amount;

  // Advance market price (unless USA buying helium)
  const isUSA = playerState.faction === 'usa';
  if (gasType === 'helium' && !isUSA) {
    // Helium uses stepped progression: advance 1 step per cube purchased
    advanceHeliumMarket(state, amount);
  }
  // Note: Hydrogen price is fixed at £1 per Section 4.4

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Bought ${amount} ${gasType} for £${price}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Tech acquisition data
interface AcquireTechData {
  techId: string;
}

// Extended state with tech card structures (techBag already in GameState)
type StateWithTech = GameState & {
  rdBoard: TechCard[];
  progressTrack?: number;
  progressThresholds?: { age2: number; age3: number; end: number };
};

// Acquire technology from R&D board
function processAcquireTechnology(state: GameState, playerId: string, data: Record<string, unknown>): ActionResult {
  const { techId } = data as AcquireTechData;
  const playerState = state.players[playerId] as PlayerState & { techCards: string[] };
  const stateWithTech = state as StateWithTech;
  const stateWithLog = state as StateWithLog;

  const cardIndex = stateWithTech.rdBoard.findIndex(t => t.id === techId);
  if (cardIndex === -1) {
    return { error: 'Tech card not available' };
  }

  const card = stateWithTech.rdBoard[cardIndex];

  if (playerState.cash < card.cost) {
    return { error: 'Not enough cash' };
  }

  // Check if player already has this tech card
  if (playerState.techCards.includes(techId)) {
    return { error: 'Already own this tech card' };
  }

  playerState.cash -= card.cost;
  playerState.techCards.push(techId);

  // Remove from R&D board
  stateWithTech.rdBoard.splice(cardIndex, 1);

  // Draw replacement from tech card bag if available
  if (stateWithTech.techBag && stateWithTech.techBag.length > 0) {
    stateWithTech.rdBoard.push(stateWithTech.techBag.shift()!);
  }

  // Advance progress track
  stateWithTech.progressTrack = (stateWithTech.progressTrack || 0) + 1;

  // Check for age transition
  const thresholds = stateWithTech.progressThresholds || { age2: 4, age3: 8, end: 12 };
  if (state.age === 1 && stateWithTech.progressTrack >= thresholds.age2) {
    state.age = 2;
    // Add Age 2 tech cards to the tech card bag
    addAgeTechCards(state, 2);
    // Refill R&D board with new tech cards
    refillRDBoard(state);
    // Reset gas market prices for new age (Section 4.4: Helium resets to £2 at Age Transitions)
    state.gasMarket = { hydrogen: 1, helium: 2 };
    stateWithLog.log.push({
      timestamp: new Date().toISOString(),
      message: `Age II begins! New tech cards available. Gas market reset.`,
      type: 'system'
    });
  } else if (state.age === 2 && stateWithTech.progressTrack >= thresholds.age3) {
    state.age = 3;
    // Add Age 3 tech cards to the tech card bag
    addAgeTechCards(state, 3);
    // Refill R&D board with new tech cards
    refillRDBoard(state);
    // Reset gas market prices for new age (Section 4.4: Helium resets to £2 at Age Transitions)
    state.gasMarket = { hydrogen: 1, helium: 2 };
    stateWithLog.log.push({
      timestamp: new Date().toISOString(),
      message: `Age III begins! Final era tech cards unlocked. Gas market reset.`,
      type: 'system'
    });
  }

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Acquired ${card.name} tech card. Progress: ${stateWithTech.progressTrack}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Install upgrade data
interface InstallUpgradeData {
  slotType: string;
  slotIndex: number;
  upgradeId: string;
}

// Install upgrade on blueprint
function processInstallUpgrade(state: GameState, playerId: string, data: Record<string, unknown>): ActionResult {
  const { slotType, slotIndex, upgradeId } = data as InstallUpgradeData;
  const playerState = state.players[playerId] as PlayerState & { blueprint: Blueprint; techCards: string[] };
  const stateWithLog = state as StateWithLog;

  const slotKey = `${slotType}Slots` as keyof Blueprint;
  if (!playerState.blueprint[slotKey]) {
    return { error: 'Invalid slot type' };
  }

  const slots = playerState.blueprint[slotKey] as (string | null)[];
  if (slotIndex < 0 || slotIndex >= slots.length) {
    return { error: 'Invalid slot index' };
  }

  // Check if slot is already occupied
  if (slots[slotIndex]) {
    return { error: 'Slot already occupied. Remove current upgrade first.' };
  }

  // Validate tech tile exists
  const upgrade = TECH_TILES[upgradeId] as TechTile | undefined;
  if (!upgrade) {
    return { error: 'Unknown tech tile' };
  }

  // Validate upgrade goes in correct slot type
  if (upgrade.slotType !== slotKey) {
    return { error: `${upgrade.name} must be installed in ${upgrade.slotType}` };
  }

  // Validate age requirement
  if (upgrade.age > state.age) {
    return { error: `${upgrade.name} not available until Age ${upgrade.age}` };
  }

  // Validate player owns required tech card
  if (!playerState.techCards.includes(upgrade.requiredCard)) {
    const card = TECH_CARDS[upgrade.requiredCard] as TechCard | undefined;
    return { error: `Requires ${card ? card.name : upgrade.requiredCard} tech card` };
  }

  // Install the upgrade
  slots[slotIndex] = upgradeId;

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Installed ${upgrade.name} in ${slotType} slot ${slotIndex + 1}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Remove upgrade data
interface RemoveUpgradeData {
  slotType: string;
  slotIndex: number;
}

// Remove upgrade from blueprint
function processRemoveUpgrade(state: GameState, playerId: string, data: Record<string, unknown>): ActionResult {
  const { slotType, slotIndex } = data as RemoveUpgradeData;
  const playerState = state.players[playerId] as PlayerState & { blueprint: Blueprint };
  const stateWithLog = state as StateWithLog;

  const slotKey = `${slotType}Slots` as keyof Blueprint;
  if (!playerState.blueprint[slotKey]) {
    return { error: 'Invalid slot type' };
  }

  const slots = playerState.blueprint[slotKey] as (string | null)[];
  if (slotIndex < 0 || slotIndex >= slots.length) {
    return { error: 'Invalid slot index' };
  }

  const currentUpgrade = slots[slotIndex];
  if (!currentUpgrade) {
    return { error: 'Slot is already empty' };
  }

  const upgrade = TECH_TILES[currentUpgrade] as TechTile | undefined;
  const upgradeName = upgrade ? upgrade.name : currentUpgrade;

  // Remove the upgrade
  slots[slotIndex] = null;

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Removed ${upgradeName} from ${slotType} slot ${slotIndex + 1}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Extended player state with loans
type PlayerWithLoans = PlayerState & { loans?: number };

// Take a loan at The Bank
function processTakeLoan(state: GameState, playerId: string, _data: Record<string, unknown>): ActionResult {
  const playerState = state.players[playerId] as PlayerWithLoans;
  const stateWithLog = state as StateWithLog;

  // Limit maximum loans to 2
  const maxLoans = 2;
  const currentLoans = playerState.loans || 0;
  if (currentLoans >= maxLoans) {
    return { error: `Maximum ${maxLoans} loans allowed. Pay off existing debt first.` };
  }

  // Give the player £30
  const loanAmount = 30;
  playerState.cash += loanAmount;

  // Reduce income track by 3 (permanent penalty, minimum 0)
  const incomePenalty = 3;
  playerState.income = Math.max(0, playerState.income - incomePenalty);

  // Track loan count for reference
  playerState.loans = currentLoans + 1;

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Took loan ${playerState.loans}/${maxLoans}: gained £${loanAmount}, income reduced by ${incomePenalty}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Collect income at end of round
function processCollectIncome(state: GameState, playerId: string, _data: Record<string, unknown>): ActionResult {
  // Income is now auto-collected when entering income phase
  // This action is kept for backwards compatibility but restricted to income phase
  if (state.phase !== 'income') {
    return { error: 'Can only collect income during the Income phase (income is auto-collected when the phase begins)' };
  }

  const playerState = state.players[playerId];
  const stateWithLog = state as StateWithLog;

  // Collect cash from income track
  const incomeGained = playerState.income;
  playerState.cash += incomeGained;

  // Gain crew from income tracks
  const officersGained = playerState.officerIncome || 1;
  const engineersGained = playerState.engineerIncome || 1;

  playerState.officers += officersGained;
  playerState.engineers += engineersGained;

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Collected income: £${incomeGained}, +${officersGained} Officer(s), +${engineersGained} Engineer(s)`,
    playerId,
    type: 'income'
  });

  return { newState: state };
}

// Play card data
interface PlayCardData {
  cardIndex: number;
}

// Play a card from hand
function processPlayCard(state: GameState, playerId: string, data: Record<string, unknown>): ActionResult {
  const { cardIndex } = data as PlayCardData;
  const playerState = state.players[playerId];
  const stateWithLog = state as StateWithLog;
  const hand = playerState.hand as Card[];

  if (cardIndex < 0 || cardIndex >= hand.length) {
    return { error: 'Invalid card index' };
  }

  const card = hand.splice(cardIndex, 1)[0];
  (playerState.discardPile as Card[]).push(card);

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Played ${card.name}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Draw cards data
interface DrawCardsData {
  count?: number;
}

// Draw cards
function processDrawCards(state: GameState, playerId: string, data: Record<string, unknown>): ActionResult {
  const { count = 1 } = data as DrawCardsData;
  const playerState = state.players[playerId];
  const stateWithLog = state as StateWithLog;
  const hand = playerState.hand as Card[];
  let deck = playerState.deck as Card[];
  let discardPile = playerState.discardPile as Card[];

  for (let i = 0; i < count; i++) {
    if (deck.length === 0) {
      // Shuffle discard pile into deck
      if (discardPile.length === 0) break;
      playerState.deck = shuffleArray(discardPile);
      deck = playerState.deck as Card[];
      playerState.discardPile = [];
      discardPile = [];
    }

    if (deck.length > 0) {
      hand.push(deck.pop()!);
    }
  }

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Drew ${count} card(s)`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Place agent data
interface PlaceAgentData {
  locationId: string;
  cardIndex?: number;
}

// Ground board location type
interface GroundBoardLocation {
  id: string;
  name: string;
  symbol: string;
  [key: string]: unknown;
}

// Place an agent on a Ground Board location
function processPlaceAgent(state: GameState, playerId: string, data: Record<string, unknown>): ActionResult {
  const { locationId, cardIndex } = data as PlaceAgentData;
  const playerState = state.players[playerId] as PlayerWithFlags;
  const stateWithLog = state as StateWithLog;

  // Validate phase
  if (state.phase !== 'worker_placement') {
    return { error: 'Can only place agents during worker placement phase' };
  }

  // Validate it's this player's turn to place
  const currentPlacer = getCurrentPlacer(state);
  if (currentPlacer !== playerId) {
    return { error: 'Not your turn to place an agent' };
  }

  // Check if player has passed
  if (playerState.hasPassed) {
    return { error: 'You have already passed this round' };
  }

  // Check if player has agents available
  if (playerState.agentsRemaining <= 0) {
    return { error: 'No agents available' };
  }

  // Check if location is valid
  const location = GROUND_BOARD_LOCATIONS[locationId] as GroundBoardLocation | undefined;
  if (!location) {
    return { error: 'Invalid location' };
  }

  // Check if location is already occupied (each location allows one agent)
  const existingPlacement = state.groundBoard.placements[locationId];
  if (existingPlacement) {
    return { error: 'Location already occupied this round' };
  }

  // Card is REQUIRED in rules-compliant mode
  if (cardIndex === undefined || cardIndex < 0) {
    return { error: 'Must play a card to place an agent' };
  }

  const hand = playerState.hand as Card[];
  if (cardIndex >= hand.length) {
    return { error: 'Invalid card index' };
  }

  const card = hand[cardIndex];

  // Check if card symbol matches location
  if (!canPlaceAtLocation(card.symbol || 'any', locationId)) {
    return { error: `Card symbol (${card.symbol}) does not match location (${location.symbol})` };
  }

  // Discard the card
  const discardedCard = hand.splice(cardIndex, 1)[0];
  (playerState.discardPile as Card[]).push(discardedCard);

  // Place the agent
  state.groundBoard.placements[locationId] = {
    playerId,
    cardUsed: discardedCard.name
  };

  // Decrement available agents
  playerState.agentsRemaining--;

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Placed agent at ${location.name} using ${discardedCard.name}`,
    playerId,
    type: 'action'
  });

  // Process card effects (Section 8.1)
  const cardEffectResult = processCardEffect(state, playerId, discardedCard, locationId);
  if (cardEffectResult.message) {
    stateWithLog.log.push({
      timestamp: new Date().toISOString(),
      message: `Card effect: ${cardEffectResult.message}`,
      playerId,
      type: 'action'
    });
  }

  // Execute the location action immediately
  const actionResult = executeLocationAction(state, playerId, locationId, discardedCard);
  if (actionResult.error) {
    // If location action fails, we still placed the agent but log the issue
    stateWithLog.log.push({
      timestamp: new Date().toISOString(),
      message: `Location action failed: ${actionResult.error}`,
      playerId,
      type: 'warning'
    });
  }

  // Mark that player has taken an action this turn (for Undo/End Turn UI)
  // Player must explicitly click End Turn to advance to next placer
  playerState.hasTakenActionThisTurn = true;

  return { newState: state };
}

// Pass action: Player chooses to stop placing agents this round
function processPass(state: GameState, playerId: string): ActionResult {
  const playerState = state.players[playerId] as PlayerWithFlags;
  const stateWithLog = state as StateWithLog;

  // Validate phase
  if (state.phase !== 'worker_placement') {
    return { error: 'Can only pass during worker placement phase' };
  }

  // Validate it's this player's turn to place
  const currentPlacer = getCurrentPlacer(state);
  if (currentPlacer !== playerId) {
    return { error: 'Not your turn' };
  }

  // Check if already passed
  if (playerState.hasPassed) {
    return { error: 'Already passed this round' };
  }

  // Mark as passed
  playerState.hasPassed = true;
  state.workerPlacement!.passedPlayers.push(playerId);

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `${playerState.faction.toUpperCase()} passes`,
    playerId,
    type: 'action'
  });

  // Check if all players have passed
  if (allPlayersPassed(state)) {
    transitionToRevealPhase(state);
  } else {
    advanceToNextPlacer(state);
  }

  return { newState: state };
}

// Recall all agents (end of round)
function processRecallAgents(state: GameState, _playerId: string, _data: Record<string, unknown>): ActionResult {
  const stateWithLog = state as StateWithLog;

  if (state.groundBoard) {
    state.groundBoard.placements = {};
  }

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: 'All agents recalled',
    type: 'system'
  });

  return { newState: state };
}

// Recruit crew data
interface RecruitCrewData {
  crewType: 'officer' | 'engineer';
  count?: number;
}

// Recruit crew at the Academy
function processRecruitCrew(state: GameState, playerId: string, data: Record<string, unknown>): ActionResult {
  const { crewType, count = 1 } = data as RecruitCrewData;
  const playerState = state.players[playerId];
  const stateWithLog = state as StateWithLog;

  const costs: Record<string, number> = {
    officer: 2,
    engineer: 4
  };

  if (!costs[crewType]) {
    return { error: 'Invalid crew type. Use "officer" or "engineer".' };
  }

  const totalCost = costs[crewType] * count;

  if (playerState.cash < totalCost) {
    return { error: 'Not enough cash' };
  }

  playerState.cash -= totalCost;

  if (crewType === 'officer') {
    playerState.officers += count;
  } else {
    playerState.engineers += count;
  }

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Recruited ${count} ${crewType}(s) for £${totalCost}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Build ship data
interface BuildShipData {
  count?: number;
}

const HANGAR_CAPACITY = 3; // Max ships in hangar

// Build a ship at the Construction Hall
// Ships are tokens - this increments the hangarShips counter
function processBuildShip(state: GameState, playerId: string, data: Record<string, unknown>): ActionResult {
  const { count = 1 } = data as BuildShipData;
  const playerState = state.players[playerId] as PlayerState & { blueprint: Blueprint; hangarShips?: number };
  const stateWithLog = state as StateWithLog;

  // Check hangar capacity
  const currentHangarCount = playerState.hangarShips || 0;
  if (currentHangarCount + count > HANGAR_CAPACITY) {
    return { error: `Cannot build ${count} ship(s): would exceed hangar capacity of ${HANGAR_CAPACITY}. Current hangar: ${currentHangarCount} ships.` };
  }

  // Calculate hull cost from installed tech tiles
  let hullCost = 2; // Base cost

  // Add Frame hull costs
  for (const tileId of playerState.blueprint.frameSlots || []) {
    if (tileId && (TECH_TILES[tileId] as TechTile)?.hullCost) {
      hullCost += (TECH_TILES[tileId] as TechTile).hullCost!;
    }
  }

  // Add Fabric hull costs
  for (const tileId of playerState.blueprint.fabricSlots || []) {
    if (tileId && (TECH_TILES[tileId] as TechTile)?.hullCost) {
      hullCost += (TECH_TILES[tileId] as TechTile).hullCost!;
    }
  }

  const totalCost = hullCost * count;

  if (playerState.cash < totalCost) {
    return { error: `Not enough cash (need £${totalCost})` };
  }

  if (count > 3) {
    return { error: 'Can only build up to 3 ships per action' };
  }

  playerState.cash -= totalCost;

  // Ships are tokens - increment the hangar counter
  playerState.hangarShips = currentHangarCount + count;

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Built ${count} ship(s) for £${totalCost} (£${hullCost}/ship)`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Upgrade Officer Income at Flight School
function processUpgradeOfficerIncome(state: GameState, playerId: string, _data: Record<string, unknown>): ActionResult {
  const playerState = state.players[playerId];
  const stateWithLog = state as StateWithLog;
  const cost = 5;

  if (playerState.cash < cost) {
    return { error: 'Not enough cash' };
  }

  playerState.cash -= cost;
  playerState.officerIncome = (playerState.officerIncome || 1) + 1;

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Upgraded Officer Income to ${playerState.officerIncome}/round for £${cost}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Upgrade Engineer Income at Technical Institute
function processUpgradeEngineerIncome(state: GameState, playerId: string, _data: Record<string, unknown>): ActionResult {
  const playerState = state.players[playerId];
  const stateWithLog = state as StateWithLog;
  const cost = 6;

  if (playerState.cash < cost) {
    return { error: 'Not enough cash' };
  }

  playerState.cash -= cost;
  playerState.engineerIncome = (playerState.engineerIncome || 1) + 1;

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Upgraded Engineer Income to ${playerState.engineerIncome}/round for £${cost}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Extended player state with insurance
type PlayerWithInsurance = PlayerState & { insurance?: number };

// Buy insurance at Insurance Bureau
function processBuyInsurance(state: GameState, playerId: string, _data: Record<string, unknown>): ActionResult {
  const playerState = state.players[playerId] as PlayerWithInsurance;
  const stateWithLog = state as StateWithLog;

  // Track insurance policies
  const currentPolicies = playerState.insurance || 0;

  if (currentPolicies >= 3) {
    return { error: 'Maximum 3 insurance policies' };
  }

  // Cost is -1 Income (permanent)
  playerState.income = Math.max(0, playerState.income - 1);
  playerState.insurance = currentPolicies + 1;

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Purchased insurance policy (${playerState.insurance}/3). Income reduced by 1.`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Acquire technology using research points
function processAcquireTechnologyResearch(state: GameState, playerId: string, data: Record<string, unknown>): ActionResult {
  const { techId } = data as AcquireTechData;
  const playerState = state.players[playerId] as PlayerState & { techCards: string[]; research?: number };
  const stateWithTech = state as StateWithTech;
  const stateWithLog = state as StateWithLog;

  const cardIndex = stateWithTech.rdBoard.findIndex(t => t.id === techId);
  if (cardIndex === -1) {
    return { error: 'Tech card not available on R&D Board' };
  }

  const card = stateWithTech.rdBoard[cardIndex];

  // Check if player already has this tech card
  if (playerState.techCards.includes(techId)) {
    return { error: 'Already own this tech card' };
  }

  // Calculate cost with specialization discount
  const discount = calculateSpecializationDiscount(playerState.techCards, card.type || '');
  const cost = Math.max(0, card.cost - discount);

  // Calculate available research
  const availableResearch = (playerState.research || 0) + (playerState.engineers || 0);

  if (availableResearch < cost) {
    return { error: `Not enough research (have ${availableResearch}, need ${cost})` };
  }

  // Spend research (from saved first, then engineers provide the rest)
  const savedResearch = playerState.research || 0;
  if (savedResearch >= cost) {
    playerState.research = savedResearch - cost;
  } else {
    playerState.research = 0;
    // The rest comes from engineers (they're not spent, just used)
  }

  // Add tech card
  playerState.techCards.push(techId);

  // Remove from R&D board
  stateWithTech.rdBoard.splice(cardIndex, 1);

  // Draw replacement from tech card bag if available
  if (stateWithTech.techBag && stateWithTech.techBag.length > 0) {
    stateWithTech.rdBoard.push(stateWithTech.techBag.shift()!);
  }

  // Advance progress track
  stateWithTech.progressTrack = (stateWithTech.progressTrack || 0) + 1;

  // Check for age transition
  const thresholds = stateWithTech.progressThresholds || { age2: 4, age3: 8, end: 12 };
  if (state.age === 1 && stateWithTech.progressTrack >= thresholds.age2) {
    state.age = 2;
    addAgeTechCards(state, 2);
    // Refill R&D board with new tech cards
    refillRDBoard(state);
    // Reset gas market prices for new age (Section 4.4: Helium resets to £2 at Age Transitions)
    state.gasMarket = { hydrogen: 1, helium: 2 };
    stateWithLog.log.push({
      timestamp: new Date().toISOString(),
      message: `Age II begins! New tech cards available. Gas market reset.`,
      type: 'system'
    });
  } else if (state.age === 2 && stateWithTech.progressTrack >= thresholds.age3) {
    state.age = 3;
    addAgeTechCards(state, 3);
    // Refill R&D board with new tech cards
    refillRDBoard(state);
    // Reset gas market prices for new age (Section 4.4: Helium resets to £2 at Age Transitions)
    state.gasMarket = { hydrogen: 1, helium: 2 };
    stateWithLog.log.push({
      timestamp: new Date().toISOString(),
      message: `Age III begins! Final era tech cards unlocked. Gas market reset.`,
      type: 'system'
    });
  }

  const discountNote = discount > 0 ? ` (${discount} discount)` : '';
  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Acquired ${card.name} for ${cost} research${discountNote}. Progress: ${stateWithTech.progressTrack}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Gain research data
interface GainResearchData {
  amount?: number;
}

// Gain research points (from Research Institute or card effects)
function processGainResearch(state: GameState, playerId: string, data: Record<string, unknown>): ActionResult {
  const { amount = 1 } = data as GainResearchData;
  const playerState = state.players[playerId] as PlayerState & { research?: number };
  const stateWithLog = state as StateWithLog;

  playerState.research = (playerState.research || 0) + amount;

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Gained ${amount} research point(s). Total saved: ${playerState.research}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Launch ship data
interface LaunchShipData {
  shipId: string;
  routeId: string;
  gasType?: 'hydrogen' | 'helium';
}

// Extended ship type with additional fields
interface ExtendedShip extends Ship {
  stats?: ShipStats;
  launchedAge?: number;
  gasType?: string;
  routeId?: string;
}

// Extended state with map
type StateWithMap = GameState & { map?: { routes?: Route[] } };

// Launch a ship from hangar
function processLaunchShip(state: GameState, playerId: string, data: Record<string, unknown>): ActionResult {
  const { shipId, routeId, gasType = 'hydrogen' } = data as LaunchShipData;
  const playerState = state.players[playerId] as PlayerState & { blueprint: Blueprint; ships?: ExtendedShip[]; techCards?: { id: string }[] };
  const stateWithMap = state as StateWithMap;
  const stateWithLog = state as StateWithLog;

  // Step 1: Choose a target route (Section 6.1 Launchpad - must select route first)
  if (!routeId) {
    return { error: 'Must specify a route to launch to (routeId required)' };
  }

  const route = stateWithMap.map?.routes?.find(r => r.id === routeId);
  if (!route) {
    return { error: `Route not found: ${routeId}` };
  }
  if (route.claimed) {
    return { error: `Route ${route.from} → ${route.to} is already claimed` };
  }

  // Double track restriction: same player cannot claim both tracks
  if (route.track) {
    const otherTrack = stateWithMap.map?.routes?.find(r =>
      r.from === route.from && r.to === route.to &&
      r.track && r.track !== route.track &&
      r.claimed === playerId
    );
    if (otherTrack) {
      return { error: `You already own the other track of ${route.from} → ${route.to}. The same player cannot claim both tracks of a double-track route.` };
    }
  }

  // Calculate ship stats to validate against route requirements
  const stats: ShipStats = calculateBlueprintStats(playerState.blueprint, state.age);

  // Validate Range meets route distance requirement
  if (stats.range < (route as Route & { distance?: number }).distance!) {
    return { error: `Ship Range (${stats.range}) does not meet route distance requirement (${(route as Route & { distance?: number }).distance})` };
  }

  // Validate Speed meets route speed requirement (if any)
  const routeSpeed = route.speed || 1;
  if (stats.speed < routeSpeed) {
    return { error: `Ship Speed (${stats.speed}) does not meet route speed requirement (${routeSpeed})` };
  }

  // Step 2: Verify launch requirements
  // Validate gas type
  if (!['hydrogen', 'helium'].includes(gasType)) {
    return { error: 'Gas type must be hydrogen or helium' };
  }

  // Helium requires Helium Handling tech card (Section 4.4)
  if (gasType === 'helium') {
    const hasHeliumHandling = playerState.techCards?.some((t: { id: string }) => t.id === 'HELIUM_HANDLING');
    if (!hasHeliumHandling) {
      return { error: 'Cannot use Helium without Helium Handling tech card' };
    }
  }

  // Validate structural slots are filled (Section 3.2, 7.2: All Frame and Fabric slots must be filled)
  const frameSlots = playerState.blueprint.frameSlots || [];
  const fabricSlots = playerState.blueprint.fabricSlots || [];

  const emptyFrameSlots = frameSlots.filter(s => s === null).length;
  const emptyFabricSlots = fabricSlots.filter(s => s === null).length;

  if (emptyFrameSlots > 0) {
    return { error: `Cannot launch: ${emptyFrameSlots} Frame slot(s) must be filled` };
  }
  if (emptyFabricSlots > 0) {
    return { error: `Cannot launch: ${emptyFabricSlots} Fabric slot(s) must be filled` };
  }

  // Step 3: Select a ship and validate resources
  const ships = playerState.ships || [];
  const shipIndex = ships.findIndex(s => s.id === shipId && s.status === 'hangar');

  if (shipIndex === -1) {
    return { error: 'Ship not found in hangar' };
  }

  // Calculate required officers (equal to Age number: 1/2/3)
  const requiredOfficers = state.age || 1;
  const availableOfficers = playerState.officers || 0;

  if (availableOfficers < requiredOfficers) {
    return { error: `Not enough Officers: need ${requiredOfficers} for Age ${state.age}, have ${availableOfficers}` };
  }

  // Calculate required gas cubes
  const requiredCubes = calculateRequiredGasCubes(playerState.blueprint);
  const availableCubes = playerState.gasCubes[gasType] || 0;

  if (availableCubes < requiredCubes) {
    return { error: `Not enough ${gasType}: need ${requiredCubes}, have ${availableCubes}` };
  }

  // Pay launch costs - deduct officers and gas
  playerState.officers -= requiredOfficers;
  playerState.gasCubes[gasType] -= requiredCubes;

  // Step 4: Hazard Check would go here (see plans/overview.md for implementation status)
  // For now, launches always succeed

  // Step 5: Success - place ship on route
  // Update ship status to on_route (not 'launched' - it goes directly to the route)
  ships[shipIndex].status = 'on_route';
  ships[shipIndex].stats = stats;
  ships[shipIndex].launchedAge = state.age;
  ships[shipIndex].gasType = gasType;
  ships[shipIndex].routeId = routeId;

  // Claim the route
  route.claimed = playerId;
  (route as Route & { claimedBy?: { playerId: string; shipId: string; round: number } }).claimedBy = {
    playerId,
    shipId,
    round: state.round
  };

  // Increase income from the route
  playerState.income += route.income;

  // Build a stats summary for the log
  const statParts = [`Range ${stats.range}`, `Speed ${stats.speed}`];
  if (stats.ceiling > 0) statParts.push(`Ceiling ${stats.ceiling}`);
  if (stats.reliability > 0) statParts.push(`Reliability ${stats.reliability}`);
  if (stats.luxury && stats.luxury > 0) statParts.push(`Luxury ${stats.luxury}`);

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Launched ship to ${route.from} → ${route.to} (${requiredOfficers} Officer${requiredOfficers > 1 ? 's' : ''}, ${requiredCubes} ${gasType}): ${statParts.join(', ')} → +${route.income} income`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Claim route data
interface ClaimRouteData {
  shipId: string;
  routeId: string;
}

// Claim a route with a launched ship
function processClaimRoute(state: GameState, playerId: string, data: Record<string, unknown>): ActionResult {
  const { shipId, routeId } = data as ClaimRouteData;
  const playerState = state.players[playerId] as PlayerState & { ships?: ExtendedShip[] };
  const stateWithMap = state as StateWithMap;
  const stateWithLog = state as StateWithLog;

  // Find launched ship
  const ships = playerState.ships || [];
  const shipIndex = ships.findIndex(s => s.id === shipId && s.status === 'launched');

  if (shipIndex === -1) {
    return { error: 'No launched ship available' };
  }

  const ship = ships[shipIndex];

  // Find route
  const route = stateWithMap.map?.routes?.find(r => r.id === routeId);
  if (!route) {
    return { error: 'Route not found' };
  }

  // Check if route already claimed
  if (route.claimed) {
    return { error: 'Route already claimed' };
  }

  // Double track restriction: same player cannot claim both tracks
  if (route.track) {
    const otherTrack = stateWithMap.map?.routes?.find(r =>
      r.from === route.from && r.to === route.to &&
      r.track && r.track !== route.track &&
      r.claimed === playerId
    );
    if (otherTrack) {
      return { error: `You already own the other track of ${route.from} → ${route.to}. The same player cannot claim both tracks of a double-track route.` };
    }
  }

  // Check ship meets route requirements
  const shipStats = ship.stats || { range: 1, speed: 1 };
  if (shipStats.range < (route as Route & { distance?: number }).distance!) {
    return { error: `Ship range (${shipStats.range}) < route distance (${(route as Route & { distance?: number }).distance})` };
  }
  if (route.speed && shipStats.speed < route.speed) {
    return { error: `Ship speed (${shipStats.speed}) < route requirement (${route.speed})` };
  }

  // Claim the route
  route.claimed = playerId;
  (route as Route & { claimedBy?: { playerId: string; shipId: string; round: number } }).claimedBy = {
    playerId,
    shipId,
    round: state.round
  };

  // Update ship to on-route status
  ships[shipIndex].status = 'on_route';
  ships[shipIndex].routeId = routeId;

  // Add route income to player
  playerState.income += route.income;

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Claimed route ${route.from} → ${route.to} for +${route.income} income`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Hazard check data
interface HazardCheckData {
  shipId: string;
}

// Extended player with hazard check tracking
type PlayerWithHazardCheck = PlayerState & {
  ships?: ExtendedShip[];
  hazardDeck?: HazardCardCheck[];
  insurance?: number;
  lastHazardCheck?: Record<string, HazardCheckResult>;
};

// Perform a hazard check for a ship on a route
function processHazardCheck(state: GameState, playerId: string, data: Record<string, unknown>): ActionResult {
  const { shipId } = data as HazardCheckData;
  const playerState = state.players[playerId] as PlayerWithHazardCheck;
  const stateWithMap = state as StateWithMap;
  const stateWithLog = state as StateWithLog;

  // Find the ship
  const ships = playerState.ships || [];
  const shipIndex = ships.findIndex(s => s.id === shipId && s.status === 'on_route');

  if (shipIndex === -1) {
    return { error: 'No ship on route to check' };
  }

  const ship = ships[shipIndex];

  // Draw from hazard deck
  if (!playerState.hazardDeck || playerState.hazardDeck.length === 0) {
    return { error: 'No hazard cards remaining' };
  }

  const hazard = playerState.hazardDeck.shift()!;

  // Calculate safety rating
  // Base reliability from ship stats + crew bonus (1 per officer)
  // Helium ships get +1 safety (helium is non-flammable, unlike hydrogen)
  const shipStats = ship.stats || { reliability: 0 };
  const heliumBonus = ship.gasType === 'helium' ? 1 : 0;
  const safetyRating = (shipStats.reliability || 0) + (playerState.officers || 0) + heliumBonus;

  // Compare to hazard difficulty
  const success = safetyRating >= hazard.difficulty;

  // Store hazard check result
  const checkResult: HazardCheckResult = {
    hazardType: hazard.type,
    difficulty: hazard.difficulty,
    safetyRating,
    success,
    timestamp: new Date().toISOString()
  };

  if (success) {
    // Ship survives
    const heliumNote = heliumBonus > 0 ? ' (helium +1)' : '';
    stateWithLog.log.push({
      timestamp: new Date().toISOString(),
      message: `Hazard check PASSED: ${hazard.type} (${hazard.difficulty}) vs Safety ${safetyRating}${heliumNote}`,
      playerId,
      type: 'hazard'
    });
  } else {
    // Ship takes damage or crashes
    const crashSeverity = hazard.difficulty - safetyRating;

    if (crashSeverity >= 3 || hazard.type === 'critical') {
      // Ship destroyed
      ships[shipIndex].status = 'destroyed';

      // Remove income from the route
      const route = stateWithMap.map?.routes?.find(r => r.id === ship.routeId);
      if (route) {
        playerState.income = Math.max(0, playerState.income - (route.income || 0));
        route.claimed = null;
        (route as Route & { claimedBy?: unknown }).claimedBy = null;
      }

      // Insurance mitigation (Section 12.7: Discard policy to recover ship to Launch Hangar)
      const insurancePolicies = playerState.insurance || 0;
      if (insurancePolicies > 0) {
        // Discard one insurance policy to recover ship
        playerState.insurance = insurancePolicies - 1;
        // Recover ship to hangar instead of destroying it
        ships[shipIndex].status = 'hangar';
        (ships[shipIndex] as ExtendedShip & { damaged?: boolean }).damaged = false;
        stateWithLog.log.push({
          timestamp: new Date().toISOString(),
          message: `Insurance claim: ship recovered to Launch Hangar (${playerState.insurance} policies remaining)`,
          playerId,
          type: 'action'
        });
      }

      stateWithLog.log.push({
        timestamp: new Date().toISOString(),
        message: `DISASTER! ${hazard.type} (${hazard.difficulty}) vs Safety ${safetyRating}. Ship destroyed!`,
        playerId,
        type: 'hazard'
      });
    } else {
      // Ship damaged but survives
      (ships[shipIndex] as ExtendedShip & { damaged?: boolean }).damaged = true;

      stateWithLog.log.push({
        timestamp: new Date().toISOString(),
        message: `Hazard check FAILED: ${hazard.type} (${hazard.difficulty}) vs Safety ${safetyRating}. Ship damaged.`,
        playerId,
        type: 'hazard'
      });
    }
  }

  // Track the hazard check result on the player state
  if (!playerState.lastHazardCheck) {
    playerState.lastHazardCheck = {};
  }
  playerState.lastHazardCheck[shipId] = checkResult;

  return { newState: state };
}

// Calculate scores data
interface CalculateScoresData {
  forceEnd?: boolean;
}

// Extended state with scores
type StateWithScores = GameState & {
  scores?: Record<string, PlayerScore>;
  winner?: string;
  progressTrack?: number;
  progressThresholds?: { age2: number; age3: number; end: number };
};

// Calculate scores for all players
function processCalculateScores(state: GameState, _playerId: string, data: Record<string, unknown>): ActionResult {
  const stateWithScores = state as StateWithScores;
  const stateWithMap = state as StateWithMap;
  const stateWithLog = state as StateWithLog;

  // Check if game end conditions are met
  const thresholds = stateWithScores.progressThresholds || { age2: 4, age3: 8, end: 12 };
  const progressTrack = stateWithScores.progressTrack || 0;
  const forceEnd = (data as CalculateScoresData)?.forceEnd === true; // Allow admin/debug override

  // Game ends when progress track reaches the end threshold OR Age 3 is complete
  const gameCanEnd = progressTrack >= thresholds.end || state.age >= 3;

  if (!gameCanEnd && !forceEnd) {
    return {
      error: `Game cannot end yet. Progress: ${progressTrack}/${thresholds.end}, Age: ${state.age}/3. Need to reach progress ${thresholds.end} or complete Age 3.`
    };
  }

  const scores: Record<string, PlayerScore> = {};

  for (const [pid, playerState] of Object.entries(state.players)) {
    let totalVP = 0;
    const breakdown: ScoreBreakdown = { routes: 0, techCards: 0, cash: 0, ships: 0 };

    // VP from routes per Section 12.2 and Appendix F
    // Routes have explicit `vp` property per Appendix F specifications
    let routeVP = 0;
    const routes = stateWithMap.map?.routes || [];
    for (const route of routes) {
      if (route.claimed === pid) {
        routeVP += route.vp || 0;
      }
    }
    breakdown.routes = routeVP;
    totalVP += routeVP;

    // VP from tech cards
    const techCards = (playerState as PlayerState & { techCards?: string[] }).techCards || [];
    // For now, approximate 1 VP per 2 tech cards
    const techVP = Math.floor(techCards.length / 2);
    breakdown.techCards = techVP;
    totalVP += techVP;

    // VP from cash (£10 = 1 VP)
    const cashVP = Math.floor(playerState.cash / 10);
    breakdown.cash = cashVP;
    totalVP += cashVP;

    // VP from ships on routes (2 VP each)
    const ships = (playerState as PlayerState & { ships?: Ship[] }).ships || [];
    const shipsOnRoutes = ships.filter(s => s.status === 'on_route').length;
    const shipVP = shipsOnRoutes * 2;
    breakdown.ships = shipVP;
    totalVP += shipVP;

    scores[pid] = {
      total: totalVP,
      breakdown,
      faction: playerState.faction
    };
  }

  // Store scores in state
  stateWithScores.scores = scores;

  // Determine winner
  const sortedPlayers = Object.entries(scores)
    .sort((a, b) => b[1].total - a[1].total);

  stateWithScores.winner = sortedPlayers[0][0];

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Game ended! Winner: ${scores[sortedPlayers[0][0]].faction} with ${sortedPlayers[0][1].total} VP`,
    type: 'system'
  });

  return { newState: state };
}

// Buy market card data
interface BuyMarketCardData {
  cardId: string;
}

// Buy a card from the market using Influence (Section 6.2, 8.3)
function processBuyMarketCard(state: GameState, playerId: string, data: Record<string, unknown>): ActionResult {
  const { cardId } = data as BuyMarketCardData;
  const playerState = state.players[playerId];
  const stateWithMarket = state as StateWithMarket;
  const stateWithLog = state as StateWithLog;

  // Can only buy market cards during reveal phase
  if (state.phase !== 'reveal') {
    return { error: 'Can only buy market cards during reveal phase' };
  }

  // Find card in market
  const marketCards = stateWithMarket.marketCards || [];
  const cardIndex = marketCards.findIndex(c => c.id === cardId);

  if (cardIndex === -1) {
    return { error: 'Card not found in market' };
  }

  const card = marketCards[cardIndex];
  const cost = (card as Card & { value?: number }).value || 3; // Default cost is 3 Influence

  // Market cards cost Influence, not cash (Section 8.3)
  const availableInfluence = playerState.influence || 0;
  if (availableInfluence < cost) {
    return { error: `Not enough Influence (need ${cost}, have ${availableInfluence})` };
  }

  // Spend Influence
  playerState.influence -= cost;

  // Card goes to discard pile (Section 8.3)
  (playerState.discardPile as Card[]).push(card);

  // Remove from market
  marketCards.splice(cardIndex, 1);

  stateWithLog.log.push({
    timestamp: new Date().toISOString(),
    message: `Bought ${card.name} for ${cost} Influence`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

module.exports = {
  processAction,
  processEndTurn,
  processBuyGas,
  processAcquireTechnology,
  processInstallUpgrade,
  processRemoveUpgrade,
  processTakeLoan,
  processCollectIncome,
  processPlayCard,
  processDrawCards,
  processPlaceAgent,
  processPass,
  processRecallAgents,
  processRecruitCrew,
  processBuildShip,
  processUpgradeOfficerIncome,
  processUpgradeEngineerIncome,
  processBuyInsurance,
  processAcquireTechnologyResearch,
  processGainResearch,
  processLaunchShip,
  processClaimRoute,
  processHazardCheck,
  processCalculateScores,
  processBuyMarketCard,
  processDiscardHazard,
  processDiscardMarketCard
};
