/**
 * Market Purchase Actions (Tentative purchases during reveal phase)
 *
 * These actions allow players to tentatively purchase cards during reveal phase.
 * Purchases are not finalized until END_TURN, allowing undo before committing.
 */

import type { GameState, PlayerState, Card, LogEntry } from '@upship/api';

const { GameRuleError, InsufficientFundsError } = require('../errors');
const { resourceFlowLogger, createFlowContext } = require('../services/resourceFlowLogger');

interface ActionResult {
  newState: GameState;
}

interface PendingPurchase {
  cardId: string;
  cost: number;
}

// Extended player state with pending purchases
type MarketPlayerState = PlayerState & {
  pendingMarketPurchases?: PendingPurchase[];
  pendingTechAcquisitions?: PendingPurchase[];
  research?: number;
};

// Extended tech card type for R&D board
type TechCard = {
  id: string;
  name: string;
  cost?: number;
  researchCost?: number;
};

// Extended state with market claims
type MarketState = Omit<GameState, 'rdBoard'> & {
  marketCardsClaimed?: Record<string, string>;
  techCardsClaimed?: Record<string, string>;
  marketCards: Array<Card & { cost?: number }>;
  rdBoard: TechCard[];
};

interface BuyMarketCardTentativeData {
  cardId: string;
}

/**
 * Tentatively buy a market card (Agent Card) during reveal phase
 * Card is marked as claimed and influence is deducted, but card stays in market
 * until END_TURN finalizes the purchase.
 */
function processBuyMarketCardTentative(state: GameState, playerId: string, data: BuyMarketCardTentativeData): ActionResult {
  const { cardId } = data;
  const marketState = state as MarketState;
  const playerState = state.players[playerId] as MarketPlayerState;

  // Must be in reveal phase OR in worker_placement after revealing (hasPassed)
  const canPurchase = state.phase === 'reveal' ||
    (state.phase === 'worker_placement' && playerState.hasPassed === true);
  if (!canPurchase) {
    throw new GameRuleError('Can only buy market cards after revealing');
  }

  // Find the card in market or reserve
  let card = marketState.marketCards.find(c => c.id === cardId);
  const isReserveCard = !card && state.reserveCard?.id === cardId;
  if (isReserveCard) {
    card = state.reserveCard;
  }
  if (!card) {
    throw new GameRuleError('Card not found in market');
  }

  // Check if card is already claimed (reserve card can be bought by multiple players)
  marketState.marketCardsClaimed = marketState.marketCardsClaimed || {};
  if (!isReserveCard && marketState.marketCardsClaimed[cardId]) {
    const claimingPlayer = state.players[marketState.marketCardsClaimed[cardId]];
    const faction = claimingPlayer?.faction || 'another player';
    throw new GameRuleError(`This card is already claimed by ${faction}`);
  }

  // Calculate cost
  const cost = card.cost || 3;

  // Check influence
  const availableInfluence = (playerState as PlayerState & { influence?: number }).influence || 0;
  if (availableInfluence < cost) {
    throw new InsufficientFundsError(cost, availableInfluence, 'Influence');
  }

  // Deduct influence
  (playerState as PlayerState & { influence?: number }).influence = availableInfluence - cost;

  // Log influence sink
  const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
  const faction = playerState.faction || 'unknown';
  resourceFlowLogger.logSink(flowContext, playerId, faction, 'influence', cost, 'purchase', `Buy market card: ${card.name}`, (playerState as PlayerState & { influence?: number }).influence);

  // Mark card as claimed
  marketState.marketCardsClaimed[cardId] = playerId;

  // Track pending purchase
  playerState.pendingMarketPurchases = playerState.pendingMarketPurchases || [];
  playerState.pendingMarketPurchases.push({ cardId, cost });

  state.log = state.log || [];
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Tentatively claimed ${card.name} for ${cost} Influence`,
    playerId,
    type: 'action'
  } as LogEntry);

  return { newState: state };
}

interface AcquireTechCardTentativeData {
  cardId?: string;
  techCardId?: string;  // Alias for backwards compatibility
}

/**
 * Tentatively acquire a tech card during reveal phase
 * Card is marked as claimed and research is deducted, but card stays on R&D board
 * until END_TURN finalizes the acquisition.
 */
function processAcquireTechCardTentative(state: GameState, playerId: string, data: AcquireTechCardTentativeData): ActionResult {
  // Accept both cardId and techCardId for backwards compatibility
  const cardId = data.cardId || data.techCardId;
  const marketState = state as MarketState;
  const playerState = state.players[playerId] as MarketPlayerState;

  // Must be in reveal phase OR in worker_placement after revealing (hasPassed)
  const canPurchase = state.phase === 'reveal' ||
    (state.phase === 'worker_placement' && playerState.hasPassed === true);
  if (!canPurchase) {
    throw new GameRuleError('Can only acquire tech cards after revealing');
  }

  // Find the card on R&D board
  const card = marketState.rdBoard.find(c => c.id === cardId);
  if (!card) {
    throw new GameRuleError('Tech card not found on R&D board');
  }

  // Check if card is already claimed
  marketState.techCardsClaimed = marketState.techCardsClaimed || {};
  if (marketState.techCardsClaimed[cardId]) {
    const claimingPlayer = state.players[marketState.techCardsClaimed[cardId]];
    const faction = claimingPlayer?.faction || 'another player';
    throw new GameRuleError(`This tech card is already claimed by ${faction}`);
  }

  // Calculate cost (specialization discount not applied here - will be added later)
  const baseCost = card.cost || card.researchCost || 3;
  const cost = baseCost;

  // Check research budget
  // Available research = saved research + engineers (per Section 5.1)
  const savedResearch = playerState.research || 0;
  const availableEngineers = playerState.engineers || 0;
  const availableResearch = savedResearch + availableEngineers;

  if (availableResearch < cost) {
    throw new InsufficientFundsError(cost, availableResearch, 'Research');
  }

  // Spend research from saved first, then from engineers
  let remaining = cost;
  const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
  const faction = playerState.faction || 'unknown';

  if (savedResearch > 0) {
    const fromSaved = Math.min(savedResearch, remaining);
    playerState.research = savedResearch - fromSaved;
    remaining -= fromSaved;
    if (fromSaved > 0) {
      resourceFlowLogger.logSink(flowContext, playerId, faction, 'research', fromSaved, 'purchase', `Acquire tech: ${card?.name}`, playerState.research);
    }
  }
  if (remaining > 0) {
    playerState.engineers -= remaining;
    resourceFlowLogger.logSink(flowContext, playerId, faction, 'engineers', remaining, 'purchase', `Acquire tech (engineer research): ${card?.name}`, playerState.engineers);
  }

  // Mark card as claimed
  marketState.techCardsClaimed[cardId] = playerId;

  // Track pending acquisition
  playerState.pendingTechAcquisitions = playerState.pendingTechAcquisitions || [];
  playerState.pendingTechAcquisitions.push({ cardId, cost });

  state.log = state.log || [];
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Tentatively claimed ${card.name} for ${cost} Research`,
    playerId,
    type: 'action'
  } as LogEntry);

  return { newState: state };
}

interface UndoMarketPurchaseData {
  cardId: string;
  type: 'market' | 'tech';
}

/**
 * Undo a tentative purchase during reveal phase
 * Restores resources and releases the claimed card.
 */
function processUndoMarketPurchase(state: GameState, playerId: string, data: UndoMarketPurchaseData): ActionResult {
  const { cardId, type } = data;
  const marketState = state as MarketState;
  const playerState = state.players[playerId] as MarketPlayerState;

  // Must be in reveal phase OR in worker_placement after revealing (hasPassed)
  const canUndo = state.phase === 'reveal' ||
    (state.phase === 'worker_placement' && playerState.hasPassed === true);
  if (!canUndo) {
    throw new GameRuleError('Can only undo purchases after revealing');
  }

  if (type === 'market') {
    // Find the pending purchase
    const pendingList = playerState.pendingMarketPurchases || [];
    const purchaseIndex = pendingList.findIndex(p => p.cardId === cardId);

    if (purchaseIndex === -1) {
      throw new GameRuleError('Purchase not found in pending list');
    }

    // Verify the claim belongs to this player
    if (marketState.marketCardsClaimed?.[cardId] !== playerId) {
      throw new GameRuleError('You did not claim this card');
    }

    // Get the purchase and restore influence
    const purchase = pendingList[purchaseIndex];
    (playerState as PlayerState & { influence?: number }).influence =
      ((playerState as PlayerState & { influence?: number }).influence || 0) + purchase.cost;

    // Remove from pending list
    pendingList.splice(purchaseIndex, 1);

    // Release the claim
    delete marketState.marketCardsClaimed![cardId];

    const card = marketState.marketCards.find(c => c.id === cardId);
    state.log = state.log || [];
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Undid purchase of ${card?.name || cardId}`,
      playerId,
      type: 'action'
    } as LogEntry);

  } else if (type === 'tech') {
    // Find the pending acquisition
    const pendingList = playerState.pendingTechAcquisitions || [];
    const acquisitionIndex = pendingList.findIndex(p => p.cardId === cardId);

    if (acquisitionIndex === -1) {
      throw new GameRuleError('Acquisition not found in pending list');
    }

    // Verify the claim belongs to this player
    if (marketState.techCardsClaimed?.[cardId] !== playerId) {
      throw new GameRuleError('You did not claim this tech card');
    }

    // Get the acquisition and restore research
    // Note: We restore to research first, as that's simpler than tracking
    // whether it came from engineers. The end result is the same.
    const acquisition = pendingList[acquisitionIndex];
    playerState.research = (playerState.research || 0) + acquisition.cost;

    // Remove from pending list
    pendingList.splice(acquisitionIndex, 1);

    // Release the claim
    delete marketState.techCardsClaimed![cardId];

    const card = marketState.rdBoard.find(c => c.id === cardId);
    state.log = state.log || [];
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Undid acquisition of ${card?.name || cardId}`,
      playerId,
      type: 'action'
    } as LogEntry);

  } else {
    throw new GameRuleError('Invalid purchase type. Must be "market" or "tech".');
  }

  return { newState: state };
}

export {
  processBuyMarketCardTentative,
  processAcquireTechCardTentative,
  processUndoMarketPurchase
};

// CommonJS compatibility
module.exports = {
  processBuyMarketCardTentative,
  processAcquireTechCardTentative,
  processUndoMarketPurchase
};
