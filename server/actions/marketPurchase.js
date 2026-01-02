/**
 * Market Purchase Actions (Tentative purchases during reveal phase)
 *
 * These actions allow players to tentatively purchase cards during reveal phase.
 * Purchases are not finalized until END_TURN, allowing undo before committing.
 */

const { GameRuleError, InsufficientFundsError } = require('../errors');

/**
 * Tentatively buy a market card (Agent Card) during reveal phase
 * Card is marked as claimed and influence is deducted, but card stays in market
 * until END_TURN finalizes the purchase.
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - { cardId: string }
 * @returns {{ newState: Object }}
 */
function processBuyMarketCardTentative(state, playerId, data) {
  const { cardId } = data;
  const playerState = state.players[playerId];

  // Must be in reveal phase
  if (state.phase !== 'reveal') {
    throw new GameRuleError('Can only buy market cards during reveal phase');
  }

  // Find the card in market
  const card = state.marketCards.find(c => c.id === cardId);
  if (!card) {
    throw new GameRuleError('Card not found in market');
  }

  // Check if card is already claimed
  state.marketCardsClaimed = state.marketCardsClaimed || {};
  if (state.marketCardsClaimed[cardId]) {
    const claimingPlayer = state.players[state.marketCardsClaimed[cardId]];
    const faction = claimingPlayer?.faction || 'another player';
    throw new GameRuleError(`This card is already claimed by ${faction}`);
  }

  // Calculate cost
  const cost = card.cost || 3;

  // Check influence
  const availableInfluence = playerState.influence || 0;
  if (availableInfluence < cost) {
    throw new InsufficientFundsError(cost, availableInfluence, 'Influence');
  }

  // Deduct influence
  playerState.influence -= cost;

  // Mark card as claimed
  state.marketCardsClaimed[cardId] = playerId;

  // Track pending purchase
  playerState.pendingMarketPurchases = playerState.pendingMarketPurchases || [];
  playerState.pendingMarketPurchases.push({ cardId, cost });

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Tentatively claimed ${card.name} for ${cost} Influence`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

/**
 * Tentatively acquire a tech card during reveal phase
 * Card is marked as claimed and research is deducted, but card stays on R&D board
 * until END_TURN finalizes the acquisition.
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - { cardId: string }
 * @returns {{ newState: Object }}
 */
function processAcquireTechCardTentative(state, playerId, data) {
  const { cardId } = data;
  const playerState = state.players[playerId];

  // Must be in reveal phase
  if (state.phase !== 'reveal') {
    throw new GameRuleError('Can only acquire tech cards during reveal phase');
  }

  // Find the card on R&D board
  const card = state.rdBoard.find(c => c.id === cardId);
  if (!card) {
    throw new GameRuleError('Tech card not found on R&D board');
  }

  // Check if card is already claimed
  state.techCardsClaimed = state.techCardsClaimed || {};
  if (state.techCardsClaimed[cardId]) {
    const claimingPlayer = state.players[state.techCardsClaimed[cardId]];
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
  if (savedResearch > 0) {
    const fromSaved = Math.min(savedResearch, remaining);
    playerState.research -= fromSaved;
    remaining -= fromSaved;
  }
  if (remaining > 0) {
    playerState.engineers -= remaining;
  }

  // Mark card as claimed
  state.techCardsClaimed[cardId] = playerId;

  // Track pending acquisition
  playerState.pendingTechAcquisitions = playerState.pendingTechAcquisitions || [];
  playerState.pendingTechAcquisitions.push({ cardId, cost });

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Tentatively claimed ${card.name} for ${cost} Research`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

/**
 * Undo a tentative purchase during reveal phase
 * Restores resources and releases the claimed card.
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - { cardId: string, type: 'market' | 'tech' }
 * @returns {{ newState: Object }}
 */
function processUndoMarketPurchase(state, playerId, data) {
  const { cardId, type } = data;
  const playerState = state.players[playerId];

  // Must be in reveal phase
  if (state.phase !== 'reveal') {
    throw new GameRuleError('Can only undo purchases during reveal phase');
  }

  if (type === 'market') {
    // Find the pending purchase
    const pendingList = playerState.pendingMarketPurchases || [];
    const purchaseIndex = pendingList.findIndex(p => p.cardId === cardId);

    if (purchaseIndex === -1) {
      throw new GameRuleError('Purchase not found in pending list');
    }

    // Verify the claim belongs to this player
    if (state.marketCardsClaimed?.[cardId] !== playerId) {
      throw new GameRuleError('You did not claim this card');
    }

    // Get the purchase and restore influence
    const purchase = pendingList[purchaseIndex];
    playerState.influence = (playerState.influence || 0) + purchase.cost;

    // Remove from pending list
    pendingList.splice(purchaseIndex, 1);

    // Release the claim
    delete state.marketCardsClaimed[cardId];

    const card = state.marketCards.find(c => c.id === cardId);
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Undid purchase of ${card?.name || cardId}`,
      playerId,
      type: 'action'
    });

  } else if (type === 'tech') {
    // Find the pending acquisition
    const pendingList = playerState.pendingTechAcquisitions || [];
    const acquisitionIndex = pendingList.findIndex(p => p.cardId === cardId);

    if (acquisitionIndex === -1) {
      throw new GameRuleError('Acquisition not found in pending list');
    }

    // Verify the claim belongs to this player
    if (state.techCardsClaimed?.[cardId] !== playerId) {
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
    delete state.techCardsClaimed[cardId];

    const card = state.rdBoard.find(c => c.id === cardId);
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Undid acquisition of ${card?.name || cardId}`,
      playerId,
      type: 'action'
    });

  } else {
    throw new GameRuleError('Invalid purchase type. Must be "market" or "tech".');
  }

  return { newState: state };
}

module.exports = {
  processBuyMarketCardTentative,
  processAcquireTechCardTentative,
  processUndoMarketPurchase
};
