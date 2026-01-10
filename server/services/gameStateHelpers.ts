/**
 * Game State Helper Functions
 * Extracted from gameState.js routes for better separation of concerns
 */

import type { GameState, PlayerState, Card, LogEntry } from '@upship/api';

const {
  TECH_TILES
} = require('../data/upgrades');
const {
  GROUND_BOARD_LOCATIONS,
  canPlaceAtLocation
} = require('../data/groundBoard');
const {
  TECH_CARD_BAG
} = require('../config/constants');

// Import phase transition functions from canonical source
const {
  transitionToRevealPhase,
  collectRevealResources,
  transitionToCleanup,
  startNewRound
} = require('../actions/helpers/phaseTransition');

// Helium market track: linear progression (Section 9.4)
// Price per row: £1 → £2 → £3 → £4 → £5 → £6
const HELIUM_PRICE_TRACK = [1, 2, 3, 4, 5, 6];

// Tech tile stat structure
interface TechTileStats {
  speed?: number;
  range?: number;
  ceiling?: number;
  reliability?: number;
  luxury?: number;
  [key: string]: number | undefined;
}

// Tech tile definition
interface TechTile {
  id: string;
  name: string;
  stats?: TechTileStats;
  weight?: number;
  [key: string]: unknown;
}

// Blueprint structure
interface Blueprint {
  age?: number;
  frameSlots?: (string | null)[];
  fabricSlots?: (string | null)[];
  driveSlots?: (string | null)[];
  componentSlots?: (string | null)[];
  [key: string]: unknown;
}

// Card effect result
interface CardEffectResult {
  success: boolean;
  message?: string;
}

// Location action result
interface LocationActionResult {
  success?: boolean;
  message?: string;
  error?: string;
}

/**
 * Add a log entry with automatic round/age context
 */
function addLogEntry(
  state: GameState,
  message: string,
  playerId: string | null = null,
  type: string = 'action'
): void {
  (state as GameState & { log: LogEntry[] }).log = (state as GameState & { log: LogEntry[] }).log || [];
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    message,
    type,
    round: state.round || 1,
    age: state.age || 1
  };
  if (playerId) {
    entry.playerId = playerId;
  }
  (state as GameState & { log: LogEntry[] }).log.push(entry);
}

// TECH_CARD_BAG is imported from ../config/constants.js (single source of truth)
// See constants.js for the full 54-card definition per Appendix C

// Filter state to hide other players' private information
// Also excludes full log (fetched separately via /log endpoint)
function filterStateForPlayer(state: GameState, playerId: string): GameState & { logCount?: number } {
  const filtered = { ...state } as GameState & { log: LogEntry[]; logCount?: number };

  // Exclude full log - only send count and last few entries for notifications
  // Full log is fetched on demand via GET /:gameId/log
  if (filtered.log) {
    const recentEntries = filtered.log.slice(-5); // Last 5 for recent activity display
    filtered.log = recentEntries;
    filtered.logCount = (state as GameState & { log: LogEntry[] }).log.length;
  }

  // For each player, hide their hand and deck from others
  if (filtered.players) {
    filtered.players = {} as Record<string, PlayerState>;
    for (const [pid, playerState] of Object.entries(state.players)) {
      if (pid === playerId) {
        // Show full state for requesting player
        filtered.players[pid] = playerState;
      } else {
        // Hide private info for other players
        filtered.players[pid] = {
          ...playerState,
          hand: playerState.hand ? playerState.hand.length : 0,
          deck: playerState.deck ? playerState.deck.length : 0,
          hazardDeck: playerState.hazardDeck ? playerState.hazardDeck.length : 0
        } as unknown as PlayerState;
      }
    }
  }

  return filtered;
}

// Calculate turn order for worker placement phase
// Rules per Section 3.3 and 5.1:
// 1. playerOrder represents fixed seating around the table (randomized at game start)
// 2. The player with the First Player token goes first
// 3. Play proceeds clockwise (in playerOrder) from the First Player
// Ministry visitors this round claim the First Player token for next round.
function calculateTurnOrder(state: GameState): string[] {
  // Get ministry visitors from this round (they claim First Player token)
  const ministryVisitors = state.workerPlacement?.ministryVisitors || [];

  // Determine who has the First Player token
  // If someone visited Ministry this round, they get the token
  // Otherwise, the persistent firstPlayer holder has it
  const firstPlayerHolder = ministryVisitors.length > 0
    ? ministryVisitors[ministryVisitors.length - 1] // Most recent Ministry visitor gets token
    : state.firstPlayer;

  // playerOrder is the fixed seating order (clockwise around the table)
  const seatingOrder = state.playerOrder;

  // If there's a First Player token holder, rotate seating to start with them
  if (firstPlayerHolder && seatingOrder.includes(firstPlayerHolder)) {
    const firstPlayerIndex = seatingOrder.indexOf(firstPlayerHolder);
    // Rotate array to start with First Player, maintaining clockwise order
    return [
      ...seatingOrder.slice(firstPlayerIndex),
      ...seatingOrder.slice(0, firstPlayerIndex)
    ];
  }

  // No First Player token - use original seating order
  return [...seatingOrder];
}

// Get the current player who should place an agent (during worker_placement phase)
function getCurrentPlacer(state: GameState): string | null {
  if (state.phase !== 'worker_placement') {
    return null;
  }

  const order = state.workerPlacement?.placementOrder || state.playerOrder;
  const index = state.workerPlacement?.currentPlacerIndex || 0;

  // Skip passed players
  while (index < order.length) {
    const playerId = order[index];
    if (!state.workerPlacement?.passedPlayers?.includes(playerId)) {
      return playerId;
    }
    // This shouldn't happen during normal play since currentPlacerIndex
    // should always point to a non-passed player, but handle it gracefully
    break;
  }

  return null;
}

// Advance to the next player who hasn't passed in worker placement
function advanceToNextPlacer(state: GameState): string | null {
  // Increment turn counter within the current round
  (state as GameState & { turnInRound: number }).turnInRound = ((state as GameState & { turnInRound: number }).turnInRound || 1) + 1;

  const order = state.workerPlacement!.placementOrder;
  const passedPlayers = state.workerPlacement!.passedPlayers;
  let index = state.workerPlacement!.currentPlacerIndex || 0;

  // Find next non-passed player
  for (let i = 0; i < order.length; i++) {
    index = (index + 1) % order.length;
    const playerId = order[index];
    if (!passedPlayers.includes(playerId)) {
      state.workerPlacement!.currentPlacerIndex = index;
      // Reset the next player's action flag (they haven't taken action yet this turn)
      if (state.players[playerId]) {
        (state.players[playerId] as PlayerState & { hasTakenActionThisTurn: boolean }).hasTakenActionThisTurn = false;
      }
      return playerId;
    }
  }

  // All players have passed - this shouldn't happen as we check before calling
  return null;
}

// Check if all players have passed in worker placement
function allPlayersPassed(state: GameState): boolean {
  const passedPlayers = state.workerPlacement?.passedPlayers || [];
  return state.playerOrder.every(pid => passedPlayers.includes(pid));
}

// Shuffle array helper (Math.random() is appropriate for game card shuffling)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // eslint-disable-line sonarjs/pseudo-random
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Extended state type for R&D board operations (techBag already in GameState)
interface StateWithRnD extends GameState {
  rnDBoard?: { available: unknown[] };
}

// Refresh R&D Board with new tech cards
function refreshRnDBoard(state: StateWithRnD): void {
  // Fill empty slots on R&D board from tech card bag
  const rnDBoard = state.rnDBoard || { available: [] };
  const targetSize = 6; // 6 tech cards available

  while (rnDBoard.available.length < targetSize && state.techBag && state.techBag.length > 0) {
    rnDBoard.available.push(state.techBag.pop());
  }

  state.rnDBoard = rnDBoard;
}

// Refresh Market Row with new cards
function refreshMarketRow(state: GameState): void {
  // Fill empty slots in market row from market deck
  const extState = state as GameState & { marketRow?: Card[]; marketDeck?: Card[] };
  const marketRow = extState.marketRow || [];
  const targetSize = 4; // 4 cards in market row

  while (marketRow.length < targetSize && extState.marketDeck && extState.marketDeck.length > 0) {
    marketRow.push(extState.marketDeck.pop()!);
  }

  extState.marketRow = marketRow;
}

// ============================================================================
// HELIUM MARKET FUNCTIONS (Brass Lancashire-style supply market)
// ============================================================================

/**
 * Get current helium price (price of lowest row with cubes available)
 * Returns null if market is empty
 */
function getCurrentHeliumPrice(state: GameState): number | null {
  const { cubes, prices } = state.gasMarket.heliumMarket;
  for (let i = 0; i < cubes.length; i++) {
    if (cubes[i] > 0) {
      return prices[i];
    }
  }
  return null; // Market is empty
}

/**
 * Get total available helium cubes in market
 */
function getAvailableHeliumCubes(state: GameState): number {
  return state.gasMarket.heliumMarket.cubes.reduce((sum, c) => sum + c, 0);
}

/**
 * Calculate total cost for purchasing N helium cubes from market
 * Each cube is priced based on its row
 */
function calculateHeliumCost(state: GameState, count: number): number {
  const { cubes, prices } = state.gasMarket.heliumMarket;
  let totalCost = 0;
  let remaining = count;

  for (let i = 0; i < cubes.length && remaining > 0; i++) {
    const available = cubes[i];
    const toTake = Math.min(available, remaining);
    totalCost += toTake * prices[i];
    remaining -= toTake;
  }

  return totalCost;
}

/**
 * Purchase helium from market (removes cubes, returns cost)
 * Does NOT check if player can afford - caller must verify
 */
function purchaseHeliumFromMarket(state: GameState, count: number): number {
  const { cubes, prices } = state.gasMarket.heliumMarket;
  let totalCost = 0;
  let remaining = count;

  for (let i = 0; i < cubes.length && remaining > 0; i++) {
    const toTake = Math.min(cubes[i], remaining);
    totalCost += toTake * prices[i];
    cubes[i] -= toTake;
    remaining -= toTake;
  }

  return totalCost;
}

/**
 * Ministry action: Add 3 cubes to market (most expensive empty slots first)
 * This is the Brass Lancashire "sell to market" mechanism
 */
function ministryReplenishHelium(state: GameState, cubesToAdd: number = 3): void {
  const { cubes } = state.gasMarket.heliumMarket;
  let remaining = cubesToAdd;

  // Fill from most expensive (highest index) to least expensive (lowest index)
  for (let i = cubes.length - 1; i >= 0 && remaining > 0; i--) {
    const emptySlots = 3 - cubes[i]; // Max 3 cubes per row
    const toAdd = Math.min(emptySlots, remaining);
    cubes[i] += toAdd;
    remaining -= toAdd;
  }
}

/**
 * Age transition: Fill empty slots at £3+ only (preserve £1-£2)
 * This ensures age reset only lowers prices, never raises them
 */
function ageResetHeliumMarket(state: GameState): void {
  const { cubes } = state.gasMarket.heliumMarket;
  // Only fill rows at index 2+ (£3, £4, £5, £6)
  for (let i = 2; i < cubes.length; i++) {
    cubes[i] = 3; // Fill to max
  }
  // Rows 0-1 (£1-£2) are preserved as-is
}

// Legacy functions for backward compatibility (deprecated)

function getHeliumPriceIndex(price: number): number {
  const idx = HELIUM_PRICE_TRACK.indexOf(price);
  return idx >= 0 ? idx : 0;
}

function advanceHeliumMarket(state: GameState, _steps: number = 1): void {
  // Legacy: no longer used, helium now uses supply-based market
  console.warn('advanceHeliumMarket is deprecated - use purchaseHeliumFromMarket');
}

function reduceHeliumMarket(state: GameState, _steps: number = 1): void {
  // Legacy: no longer used, now use ministryReplenishHelium
  console.warn('reduceHeliumMarket is deprecated - use ministryReplenishHelium');
}

// Check if player has any cards that match available locations
function hasPlayableCards(state: GameState, playerId: string): boolean {
  const playerState = state.players[playerId];
  const hand = playerState.hand || [];
  const placements = state.groundBoard.placements || {};

  // Get list of unoccupied locations
  const availableLocations = Object.keys(GROUND_BOARD_LOCATIONS)
    .filter((locId: string) => !placements[locId]);

  // Check if any card in hand matches any available location
  for (const card of hand as Card[]) {
    const cardSymbol = card.symbol || 'any';
    for (const locId of availableLocations) {
      if (canPlaceAtLocation(cardSymbol, locId)) {
        return true;
      }
    }
  }

  return false;
}

// Phase transition functions are imported from ../actions/helpers/phaseTransition.js
// (transitionToRevealPhase, collectRevealResources, transitionToCleanup, startNewRound)

// Process card effects when used for agent placement (Section 8.1)
function processCardEffect(
  state: GameState,
  playerId: string,
  card: Card,
  _locationId: string
): CardEffectResult {
  const playerState = state.players[playerId] as PlayerState & {
    bonusSwaps?: number;
    researchDiscount?: number;
    launchBonuses?: { statBonus?: number };
  };
  const effect = card.effect;

  if (!effect || effect === 'None') {
    return { success: true };
  }

  switch (effect) {
    case '+1 swap':
      // Legacy card effect - no longer applicable (blueprint modifications unlimited)
      return { success: true, message: 'Effect no longer applicable' };

    case 'Draw 1 card': {
      // Draftsman: Draw 1 card immediately
      if (playerState.deck.length === 0 && playerState.discardPile.length > 0) {
        playerState.deck = shuffleArray([...playerState.discardPile]);
        playerState.discardPile = [];
      }
      if (playerState.deck.length > 0) {
        const drawn = playerState.deck.pop()!;
        (playerState.hand as Card[]).push(drawn);
        return { success: true, message: `Drew ${(drawn as Card).name}` };
      }
      return { success: true, message: 'No cards to draw' };
    }

    case '-£1 Research cost':
      // Researcher: Research cost reduction
      // Track discount for this placement
      if (!playerState.researchDiscount) playerState.researchDiscount = 0;
      playerState.researchDiscount += 1;
      return { success: true, message: '-£1 Research cost this action' };

    case 'Gain £2':
      // Purser: Immediate cash gain
      playerState.cash += 2;
      return { success: true, message: 'Gained £2' };

    case '+1 ship stat':
      // Helmsman: Temporary ship stat bonus
      // This would apply to the next launch
      if (!playerState.launchBonuses) playerState.launchBonuses = {};
      playerState.launchBonuses.statBonus = (playerState.launchBonuses.statBonus || 0) + 1;
      return { success: true, message: '+1 ship stat for next launch' };

    default:
      // Log unknown effects for debugging
      return { success: true, message: `Unknown effect: ${effect}` };
  }
}

// Extended state with log array
type StateWithLog = GameState & { log: LogEntry[] };

// Execute the action associated with a Ground Board location
// This is a dispatcher that calls the appropriate handler
function executeLocationAction(
  state: GameState,
  playerId: string,
  locationId: string,
  _card: Card
): LocationActionResult {
  const playerState = state.players[playerId] as PlayerState & { peekedHazard?: unknown };
  const stateWithLog = state as StateWithLog;

  switch (locationId) {
    case 'research_institute':
      // Buy Research tokens for £3 each (handled separately via GAIN_RESEARCH)
      return { success: true, message: 'May buy Research for £3 each' };

    case 'blueprint_design':
      // Install upgrade to blueprint (handled via INSTALL_UPGRADE)
      return { success: true, message: 'May install upgrade to blueprint' };

    case 'construction_hall':
      // Build a ship (handled via BUILD_SHIP)
      return { success: true, message: 'May build a ship' };

    case 'launchpad':
    case 'launchpad_2':
      // Launch a ship (handled via LAUNCH_SHIP)
      return { success: true, message: 'May launch a ship' };

    case 'flight_school':
      // Upgrade Officer income track (handled via UPGRADE_OFFICER_INCOME)
      return { success: true, message: 'May upgrade Officer income' };

    case 'technical_institute':
      // Upgrade Engineer income track (handled via UPGRADE_ENGINEER_INCOME)
      return { success: true, message: 'May upgrade Engineer income' };

    case 'ministry': {
      // Ministry action (Section 6.3):
      // 1. Draw 2 cards, discard 1
      // 2. Gain turn priority for next round
      // 3. Reduce Helium Market Track by 1 step
      state.workerPlacement!.ministryVisitors.push(playerId);

      // Draw 2 cards
      const cardsToDraw = 2;
      for (let i = 0; i < cardsToDraw; i++) {
        if (playerState.deck.length === 0 && playerState.discardPile.length > 0) {
          playerState.deck = shuffleArray([...playerState.discardPile]);
          playerState.discardPile = [];
        }
        if (playerState.deck.length > 0) {
          (playerState.hand as Card[]).push(playerState.deck.pop()!);
        }
      }

      // Must discard 1 card - for now, auto-discard the last card drawn
      // (Player should choose via separate action, but auto-discard for simplicity)
      if ((playerState.hand as Card[]).length > 0) {
        const discarded = (playerState.hand as Card[]).pop()!;
        playerState.discardPile.push(discarded);
        stateWithLog.log.push({
          timestamp: new Date().toISOString(),
          message: `Drew 2 cards, discarded ${discarded.name}`,
          playerId,
          type: 'action'
        });
      }

      // Add 3 helium cubes to market (most expensive empty slots first)
      ministryReplenishHelium(state, 3);
      const newPrice = getCurrentHeliumPrice(state);
      const available = getAvailableHeliumCubes(state);
      stateWithLog.log.push({
        timestamp: new Date().toISOString(),
        message: `Ministry: Added 3 helium cubes to market (now ${available} available, current price £${newPrice || 'N/A'})`,
        playerId,
        type: 'action'
      });

      return { success: true, message: `Gained turn priority. Drew 2, discarded 1. Added 3 helium cubes to market.` };
    }

    case 'gas_depot':
      // Buy gas (handled via BUY_GAS)
      return { success: true, message: 'May buy gas' };

    case 'insurance_bureau':
      // Buy insurance (handled via BUY_INSURANCE)
      return { success: true, message: 'May buy insurance' };

    case 'weather_bureau': {
      // Peek at hazard deck for £2 (Section 6.3)
      const cost = 2;
      if (playerState.cash < cost) {
        return { success: false, message: 'Not enough cash for Weather Bureau (need £2)' };
      }

      playerState.cash -= cost;

      // Peek at top hazard card
      const hazardDeck = playerState.hazardDeck || [];
      if ((hazardDeck as unknown[]).length > 0) {
        const topHazard = hazardDeck[0];
        // Store peeked card so player can decide to discard
        playerState.peekedHazard = topHazard;

        stateWithLog.log.push({
          timestamp: new Date().toISOString(),
          message: `Weather Bureau: Peeked at top hazard (${topHazard.type}, difficulty ${topHazard.difficulty}). May discard with DISCARD_HAZARD action.`,
          playerId,
          type: 'action'
        });

        return { success: true, message: `Peeked: ${topHazard.type} (difficulty ${topHazard.difficulty}). Use DISCARD_HAZARD to discard it.` };
      }
      return { success: true, message: 'Hazard deck is empty' };
    }

    default:
      return { error: `Unknown location: ${locationId}` };
  }
}

// Tech card structure
interface TechCard {
  id: string;
  name?: string;
  age?: number;
  [key: string]: unknown;
}

// Extended state for tech card operations (techBag already in GameState)
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface StateWithTech extends GameState {}

// Add new age tech cards to the tech card bag
function addAgeTechCards(state: StateWithTech, age: number): void {
  const newCards = TECH_CARD_BAG[age] || [];
  if (newCards.length > 0) {
    // Collect all tech cards already owned by any player
    const ownedCards = new Set<string>();
    for (const pid of Object.keys(state.players || {})) {
      for (const card of (state.players[pid] as PlayerState & { techCards?: string[] }).techCards || []) {
        ownedCards.add(card);
      }
    }

    // Filter out already-owned tech cards and add age marker
    const cardsWithAge = (newCards as TechCard[])
      .filter((t: TechCard) => !ownedCards.has(t.id))
      .map((t: TechCard) => ({ ...t, age }));

    // Shuffle and add to tech card bag
    // Cast to Technology[] for type compatibility (TechCard and Technology have same shape)
    (state.techBag as unknown as TechCard[]).push(...shuffleArray(cardsWithAge));
  }
}

// Extended state for R&D board operations (intersection to allow TechCard arrays)
type StateWithRD = Omit<GameState, 'rdBoard'> & {
  rdBoard?: TechCard[];
};

// Refill R&D board from tech card bag (Section 4.1)
// Age I: 4 cards, Age II: 5 cards, Age III: 6 cards
function refillRDBoard(state: StateWithRD): void {
  state.rdBoard = state.rdBoard || [];
  state.techBag = state.techBag || [];

  // R&D Board size scales by Age
  const rdBoardSize: Record<number, number> = {
    1: 4,
    2: 5,
    3: 6
  };
  const targetSize = rdBoardSize[state.age] || 4;

  while (state.rdBoard.length < targetSize && state.techBag.length > 0) {
    state.rdBoard.push(state.techBag.shift() as unknown as TechCard);
  }
}

// Calculate specialization discount based on techs in same track
function calculateSpecializationDiscount(playerTechs: string[], techType: string): number {
  const techsInTrack = playerTechs.filter(t => {
    // Map tech IDs to types (rough approximation)
    const techTypeMap: Record<string, string[]> = {
      structure: ['rigid_frame', 'duralumin_girders', 'wooden_framework', 'wire_bracing', 'steel_framework', 'internal_keel', 'geodetic_structure', 'modular_construction'],
      fabric: ['dining_saloon', 'rubberized_cotton', 'doped_canvas', 'goldbeater_skin', 'fireproof_coating', 'aluminum_doping', 'composite_covering'],
      drive: ['maybach_engine', 'daimler_engine', 'improved_propeller', 'dual_engine_mount', 'diesel_powerplant', 'streamlined_nacelle', 'supercharged_engine'],
      component: ['passenger_gondola', 'observation_deck', 'cargo_systems', 'radio_equipment', 'sleeping_quarters', 'mail_systems', 'luxury_fittings', 'advanced_navigation', 'pressurization'],
      gas: ['helium_handling']
    };

    for (const [type, ids] of Object.entries(techTypeMap)) {
      if (ids.includes(t) && type === techType) return true;
    }
    return false;
  }).length;

  if (techsInTrack >= 5) return 2;
  if (techsInTrack >= 3) return 1;
  return 0;
}

// Ship stats structure
interface ShipStats {
  speed: number;
  range: number;
  ceiling: number;
  reliability: number;
  [key: string]: number;
}

// Age baseline stats
const AGE_BASELINES: Record<number, ShipStats> = {
  1: { speed: 1, range: 1, ceiling: 0, reliability: 0 },
  2: { speed: 2, range: 2, ceiling: 1, reliability: 1 },
  3: { speed: 3, range: 3, ceiling: 2, reliability: 2 }
};

// Calculate ship stats from blueprint
function calculateBlueprintStats(blueprint: Blueprint, age: number = 1): ShipStats {
  const stats: ShipStats = { ...AGE_BASELINES[age] };

  // Add stats from tech tiles
  const slots: (keyof Blueprint)[] = ['frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots'];
  for (const slotKey of slots) {
    const slotArray = (blueprint[slotKey] as (string | null)[] | undefined) || [];
    for (const tileId of slotArray) {
      if (!tileId) continue;
      const tile = TECH_TILES[tileId] as TechTile | undefined;
      if (tile?.stats) {
        for (const [stat, value] of Object.entries(tile.stats)) {
          if (value !== undefined) {
            stats[stat] = (stats[stat] || 0) + value;
          }
        }
      }
    }
  }

  return stats;
}

// Calculate weight from blueprint
function calculateBlueprintWeight(blueprint: Blueprint): number {
  let weight = 0;
  const slots: (keyof Blueprint)[] = ['frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots'];
  for (const slotKey of slots) {
    const slotArray = (blueprint[slotKey] as (string | null)[] | undefined) || [];
    for (const tileId of slotArray) {
      if (!tileId) continue;
      const tile = TECH_TILES[tileId] as TechTile | undefined;
      if (tile?.weight) {
        weight += Math.abs(tile.weight);
      }
    }
  }
  return weight;
}

// Calculate required gas cubes based on weight (Lift must >= Weight, each cube = +5 Lift)
function calculateRequiredGasCubes(blueprint: Blueprint): number {
  const weight = calculateBlueprintWeight(blueprint);
  // Minimum 1 gas cube, otherwise ceil(weight / 5)
  return Math.max(1, Math.ceil(weight / 5));
}

module.exports = {
  // Constants
  HELIUM_PRICE_TRACK,
  TECH_CARD_BAG,

  // State filtering
  filterStateForPlayer,

  // Turn order
  calculateTurnOrder,
  getCurrentPlacer,
  advanceToNextPlacer,
  allPlayersPassed,

  // Utilities
  shuffleArray,

  // Board refresh
  refreshRnDBoard,
  refreshMarketRow,

  // Gas market (Brass Lancashire-style helium market)
  getCurrentHeliumPrice,
  getAvailableHeliumCubes,
  calculateHeliumCost,
  purchaseHeliumFromMarket,
  ministryReplenishHelium,
  ageResetHeliumMarket,
  // Legacy (deprecated)
  getHeliumPriceIndex,
  advanceHeliumMarket,
  reduceHeliumMarket,

  // Logging helper
  addLogEntry,

  // Worker placement helpers
  hasPlayableCards,

  // Phase transitions
  transitionToRevealPhase,
  collectRevealResources,
  transitionToCleanup,
  startNewRound,

  // Card and location effects
  processCardEffect,
  executeLocationAction,

  // Tech card management
  addAgeTechCards,
  refillRDBoard,
  calculateSpecializationDiscount,

  // Blueprint calculations
  calculateBlueprintStats,
  calculateBlueprintWeight,
  calculateRequiredGasCubes,

  // Legacy aliases for backwards compatibility during migration
  TECHNOLOGY_BAG: TECH_CARD_BAG,
  addAgeTechnologies: addAgeTechCards
};
