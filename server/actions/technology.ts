/**
 * Tech Card Actions
 * ACQUIRE_TECH_CARD, ACQUIRE_TECH_CARD_RESEARCH, GAIN_RESEARCH action processors
 */

import type { GameState, PlayerState, LogEntry } from '@upship/api';

const { GameRuleError, InsufficientFundsError } = require('../errors');
const { shuffleArray } = require('../utils/random');
const { refillRDBoard } = require('./helpers/marketHelpers');
const { TECH_CARD_BAG, RESEARCH_INSTITUTE_COST } = require('../config/constants');
const { performAgeTransition } = require('./helpers/ageTransition');

interface ActionResult {
  newState: GameState;
}

// Tech card with metadata
interface TechCardWithMeta {
  id: string;
  name: string;
  type: string;
  cost: number;
  age?: number;
  [key: string]: unknown;
}

// Extended player state
type TechPlayerState = PlayerState & {
  research?: number;
  researchLevel?: number;
  bannedTechCards?: string[];
};

// Extended state with tech bag and R&D board (techBag already in GameState)
type TechState = GameState & {
  rdBoard: TechCardWithMeta[];
  progressTrack?: number;
  progressThresholds?: {
    age2: number;
    age3: number;
    end: number;
  };
  playerCount?: number;
};

/**
 * Add new age tech cards to the tech card bag
 * Per Section 3.1: Include (N-1) copies of each card where N = player count
 */
function addAgeTechCards(state: GameState, age: number): void {
  const techState = state as TechState;
  const newCards = TECH_CARD_BAG[age] as TechCardWithMeta[] || [];
  if (newCards.length === 0) return;

  const playerCount = techState.playerCount || Object.keys(state.players || {}).length;
  const copiesPerCard = Math.max(1, playerCount - 1);

  // Count how many copies of each card are already owned
  const ownedCounts: Record<string, number> = {};
  for (const pid of Object.keys(state.players || {})) {
    for (const card of state.players[pid].techCards || []) {
      ownedCounts[card] = (ownedCounts[card] || 0) + 1;
    }
  }

  // Add (N-1) - ownedCount copies of each new age card
  const cardsToAdd: TechCardWithMeta[] = [];
  for (const card of newCards) {
    const ownedCount = ownedCounts[card.id] || 0;
    const copiesToAdd = Math.max(0, copiesPerCard - ownedCount);

    for (let i = 0; i < copiesToAdd; i++) {
      cardsToAdd.push({ ...card, age });
    }
  }

  // Shuffle and add to tech card bag
  techState.techBag = techState.techBag || [];
  techState.techBag.push(...shuffleArray(cardsToAdd));
}

/**
 * Check and handle age transition based on progress track
 * Per Section 12.1, this triggers all age transition steps when threshold reached
 */
function checkAgeTransition(state: GameState): void {
  const techState = state as TechState;
  const thresholds = techState.progressThresholds || { age2: 4, age3: 8, end: 12 };
  const progressTrack = techState.progressTrack || 0;

  if (state.age === 1 && progressTrack >= thresholds.age2) {
    // Perform full age transition per Section 12.1
    performAgeTransition(state, 2);

    // Add new age tech cards to bag
    addAgeTechCards(state, 2);
    refillRDBoard(state);

    // Reset gas market prices for new age (Section 4.4: Helium resets to £2 at Age Transitions)
    state.gasMarket = { hydrogen: 1, helium: 2 };

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `New tech cards available. Gas market reset.`,
      type: 'system'
    } as LogEntry);
  } else if (state.age === 2 && progressTrack >= thresholds.age3) {
    // Perform full age transition per Section 12.1
    performAgeTransition(state, 3);

    // Add new age tech cards to bag
    addAgeTechCards(state, 3);
    refillRDBoard(state);

    // Reset gas market prices for new age (Section 4.4: Helium resets to £2 at Age Transitions)
    state.gasMarket = { hydrogen: 1, helium: 2 };

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Final era tech cards unlocked. Gas market reset.`,
      type: 'system'
    } as LogEntry);
  }
}

interface AcquireTechCardData {
  cardId?: string;
  techId?: string;  // Legacy support
}

/**
 * Acquire tech card from R&D board using cash
 */
function processAcquireTechCard(state: GameState, playerId: string, data: AcquireTechCardData): ActionResult {
  const { cardId, techId } = data;
  // Support both cardId (new) and techId (legacy) for backwards compatibility
  const targetId = cardId || techId;
  const playerState = state.players[playerId] as TechPlayerState;
  const techState = state as TechState;

  const cardIndex = techState.rdBoard.findIndex(t => t.id === targetId);
  if (cardIndex === -1) {
    throw new GameRuleError('Tech card not available');
  }

  const card = techState.rdBoard[cardIndex];

  // SECURITY: Check faction-specific banned tech cards (e.g., Germany cannot acquire helium_handling)
  if (playerState.bannedTechCards?.includes(targetId!)) {
    throw new GameRuleError(`Your faction cannot acquire ${card.name || targetId}`);
  }

  if (playerState.cash < card.cost) {
    throw new InsufficientFundsError(card.cost, playerState.cash);
  }

  // Check if player already has this tech card
  if (playerState.techCards.includes(targetId!)) {
    throw new GameRuleError('Already own this tech card');
  }

  playerState.cash -= card.cost;
  playerState.techCards.push(targetId!);

  // Remove from R&D board
  techState.rdBoard.splice(cardIndex, 1);

  // Draw replacement from tech card bag if available
  if (techState.techBag && techState.techBag.length > 0) {
    techState.rdBoard.push(techState.techBag.shift()!);
  }

  // Advance progress track
  techState.progressTrack = (techState.progressTrack || 0) + 1;

  // Check for age transition
  checkAgeTransition(state);

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Acquired ${card.name} tech card. Progress: ${techState.progressTrack}`,
    playerId,
    type: 'action'
  } as LogEntry);

  return { newState: state };
}

/**
 * Build a lookup map of tech card ID -> type from TECH_CARD_BAG
 * Per Section 4.1: Tech cards are organized into four Drawing Office tracks:
 * - Propulsion (drive): Engine and drive tech cards
 * - Structure: Frame, hull, and safety systems
 * - Gas Systems (gas): Lifting gas and fuel tech cards
 * - Payload (component): Passenger, cargo, and mission equipment
 * - Fabric: Outer covering materials (treated as a separate track)
 */
function buildTechCardTypeMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const age of [1, 2, 3]) {
    for (const card of (TECH_CARD_BAG[age] as TechCardWithMeta[] || [])) {
      map[card.id] = card.type;
    }
  }
  // Add faction starting tech cards that may not be in TECH_CARD_BAG
  // These are mapped to their logical tracks
  map['blaugas_storage'] = 'gas';
  map['helium_handling'] = 'gas';
  map['imperial_mooring'] = 'structure';
  map['trapeze_system'] = 'component';
  map['articulated_keel'] = 'structure';
  map['gelatinized_latex'] = 'fabric';
  return map;
}

const TECH_CARD_TYPE_MAP = buildTechCardTypeMap();

/**
 * Calculate specialization discount based on tech cards in same track
 * Per Section 4.1 Specialization Discount:
 * - 1-2 cards in track: No discount
 * - 3-4 cards in track: -1 Research discount
 * - 5+ cards in track: -2 Research discount
 */
function calculateSpecializationDiscount(playerTechCards: string[], cardType: string): number {
  // Count player's tech cards that match the target type
  const cardsInTrack = playerTechCards.filter(cardId => {
    const existingType = TECH_CARD_TYPE_MAP[cardId];
    return existingType === cardType;
  }).length;

  if (cardsInTrack >= 5) return 2;
  if (cardsInTrack >= 3) return 1;
  return 0;
}

interface AcquireTechCardResearchData {
  cardId?: string;
  techId?: string;  // Legacy support
  _internal?: boolean;
}

/**
 * Acquire tech card using research points
 */
function processAcquireTechCardResearch(state: GameState, playerId: string, data: AcquireTechCardResearchData | undefined): ActionResult {
  const { cardId, techId, _internal = false } = data || {};
  // Support both cardId (new) and techId (legacy) for backwards compatibility
  const targetId = cardId || techId;
  const playerState = state.players[playerId] as TechPlayerState;
  const techState = state as TechState;

  // Per Section 5.1: Tech card acquisitions during reveal must go through atomic REVEAL action
  if (!_internal) {
    throw new GameRuleError(
      'ACQUIRE_TECH_CARD_RESEARCH not allowed: Use the atomic REVEAL action to acquire tech cards (Section 5.1). ' +
      'Submit your techCardAcquisitions[] when calling REVEAL.'
    );
  }

  const cardIndex = techState.rdBoard.findIndex(t => t.id === targetId);
  if (cardIndex === -1) {
    throw new GameRuleError('Tech card not available on R&D Board');
  }

  const card = techState.rdBoard[cardIndex];

  // SECURITY: Check faction-specific banned tech cards (e.g., Germany cannot acquire helium_handling)
  if (playerState.bannedTechCards?.includes(targetId!)) {
    throw new GameRuleError(`Your faction cannot acquire ${card.name || targetId}`);
  }

  // Check if player already has this tech card
  if (playerState.techCards.includes(targetId!)) {
    throw new GameRuleError('Already own this tech card');
  }

  // Calculate cost with specialization discount
  const discount = calculateSpecializationDiscount(playerState.techCards, card.type);
  const cost = Math.max(0, card.cost - discount);

  // Calculate available research
  const availableResearch = (playerState.research || 0) + (playerState.engineers || 0);

  if (availableResearch < cost) {
    throw new InsufficientFundsError(cost, availableResearch, 'research');
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
  playerState.techCards.push(targetId!);

  // Remove from R&D board
  techState.rdBoard.splice(cardIndex, 1);

  // Draw replacement from tech card bag if available
  if (techState.techBag && techState.techBag.length > 0) {
    techState.rdBoard.push(techState.techBag.shift()!);
  }

  // Advance progress track
  techState.progressTrack = (techState.progressTrack || 0) + 1;

  // Check for age transition
  checkAgeTransition(state);

  const discountNote = discount > 0 ? ` (${discount} discount)` : '';
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Acquired ${card.name} for ${cost} research${discountNote}. Progress: ${techState.progressTrack}`,
    playerId,
    type: 'action'
  } as LogEntry);

  return { newState: state };
}

interface GainResearchData {
  amount?: number;
}

/**
 * Gain research points (from card effects)
 */
function processGainResearch(state: GameState, playerId: string, data: GainResearchData): ActionResult {
  const { amount = 1 } = data;
  const playerState = state.players[playerId] as TechPlayerState;

  playerState.research = (playerState.research || 0) + amount;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Gained ${amount} research point(s). Total saved: ${playerState.research}`,
    playerId,
    type: 'action'
  } as LogEntry);

  return { newState: state };
}

interface UpgradeResearchLevelData {
  levels?: number;
  _internal?: boolean;
}

/**
 * Upgrade Research Level Track at Research Institute
 *
 * Per Section 6.1:
 * Cost: £4 per level.
 * Effect: Increase your Research Level Track by 1 step.
 *
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 * Direct API calls are rejected - must go through PLACE_AGENT with levels param.
 */
function processUpgradeResearchLevel(state: GameState, playerId: string, data: UpgradeResearchLevelData | undefined): ActionResult {
  const { levels = 1, _internal = false } = data || {};
  const playerState = state.players[playerId] as TechPlayerState;

  // Validate that this is called through PLACE_AGENT (Section 5.1)
  if (!_internal) {
    if (state.phase !== 'worker_placement') {
      throw new GameRuleError(
        'UPGRADE_RESEARCH_LEVEL not allowed: Actions execute immediately when placing an agent (Section 5.1). ' +
        'Place an agent at Research Institute during worker placement phase to upgrade research level.'
      );
    }
    const placement = state.groundBoard?.placements?.research_institute;
    if (!placement || placement.playerId !== playerId) {
      throw new GameRuleError(
        'UPGRADE_RESEARCH_LEVEL not allowed: You must place an agent at Research Institute to upgrade research level. ' +
        'Use PLACE_AGENT with locationId "research_institute" and levels parameter.'
      );
    }
  }

  // Handle levels=0 as a no-op (just visiting the location)
  if (levels === 0) {
    return { newState: state };
  }

  const totalCost = (RESEARCH_INSTITUTE_COST as number) * levels;

  if (playerState.cash < totalCost) {
    throw new InsufficientFundsError(totalCost, playerState.cash);
  }

  playerState.cash -= totalCost;
  playerState.researchLevel = (playerState.researchLevel || 0) + levels;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Upgraded Research Level to ${playerState.researchLevel} for £${totalCost}`,
    playerId,
    type: 'action'
  } as LogEntry);

  return { newState: state };
}

export {
  processAcquireTechCard,
  processAcquireTechCardResearch,
  processGainResearch,
  processUpgradeResearchLevel,
  addAgeTechCards,
  calculateSpecializationDiscount
};

// Legacy aliases for backwards compatibility during migration
const processAcquireTechnology = processAcquireTechCard;
const processAcquireTechnologyResearch = processAcquireTechCardResearch;
const addAgeTechnologies = addAgeTechCards;

// CommonJS compatibility
module.exports = {
  processAcquireTechCard,
  processAcquireTechCardResearch,
  processGainResearch,
  processUpgradeResearchLevel,
  addAgeTechCards,
  calculateSpecializationDiscount,
  // Legacy aliases
  processAcquireTechnology,
  processAcquireTechnologyResearch,
  addAgeTechnologies
};
