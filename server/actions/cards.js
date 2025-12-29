/**
 * Card Actions
 * PLAY_CARD, DRAW_CARDS, BUY_MARKET_CARD, DISCARD_HAZARD, DISCARD_MARKET_CARD action processors
 */

const { GameRuleError, InsufficientFundsError } = require('../errors');
const { shuffleArray } = require('../utils/random');

/**
 * Play a card from hand
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { cardIndex }
 * @returns {Object} { newState } or throws error
 */
function processPlayCard(state, playerId, data) {
  const { cardIndex } = data;
  const playerState = state.players[playerId];

  if (cardIndex < 0 || cardIndex >= playerState.hand.length) {
    throw new GameRuleError('Invalid card index');
  }

  const card = playerState.hand.splice(cardIndex, 1)[0];
  playerState.discardPile.push(card);

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Played ${card.name}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

/**
 * Draw cards from deck
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { count }
 * @returns {Object} { newState } or throws error
 */
function processDrawCards(state, playerId, data) {
  const { count = 1 } = data;
  const playerState = state.players[playerId];

  for (let i = 0; i < count; i++) {
    if (playerState.deck.length === 0) {
      // Shuffle discard pile into deck
      if (playerState.discardPile.length === 0) break;
      playerState.deck = shuffleArray(playerState.discardPile);
      playerState.discardPile = [];
    }

    if (playerState.deck.length > 0) {
      playerState.hand.push(playerState.deck.pop());
    }
  }

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Drew ${count} card(s)`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

/**
 * Buy a card from the market using Influence
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { cardId }
 * @returns {Object} { newState } or throws error
 */
function processBuyMarketCard(state, playerId, data) {
  const { cardId } = data;
  const playerState = state.players[playerId];

  // Can only buy market cards during reveal phase
  if (state.phase !== 'reveal') {
    throw new GameRuleError('Can only buy market cards during reveal phase');
  }

  // Find card in market
  const marketCards = state.marketCards || [];
  const cardIndex = marketCards.findIndex(c => c.id === cardId);

  if (cardIndex === -1) {
    throw new GameRuleError('Card not found in market');
  }

  const card = marketCards[cardIndex];
  const cost = card.value || 3; // Default cost is 3 Influence

  // Market cards cost Influence, not cash (Section 8.3)
  const availableInfluence = playerState.influence || 0;
  if (availableInfluence < cost) {
    throw new InsufficientFundsError(cost, availableInfluence, 'Influence');
  }

  // Spend Influence
  playerState.influence -= cost;

  // Card goes to discard pile (Section 8.3)
  playerState.discardPile.push(card);

  // Remove from market
  state.marketCards.splice(cardIndex, 1);

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Bought ${card.name} for ${cost} Influence`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

/**
 * Discard a peeked hazard card (from Weather Bureau)
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data (unused)
 * @returns {Object} { newState } or throws error
 */
function processDiscardHazard(state, playerId, _data) {
  const playerState = state.players[playerId];

  if (!playerState.peekedHazard) {
    throw new GameRuleError('No peeked hazard to discard. Visit Weather Bureau first.');
  }

  // Remove the top card from hazard deck
  const hazardDeck = playerState.hazardDeck || [];
  if (hazardDeck.length > 0 && hazardDeck[0].id === playerState.peekedHazard.id) {
    const discarded = hazardDeck.shift();
    state.log.push({
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

/**
 * Discard leftmost Market card (from Academy)
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data (unused)
 * @returns {Object} { newState } or throws error
 */
function processDiscardMarketCard(state, playerId, _data) {
  const marketCards = state.marketCards || [];

  if (marketCards.length === 0) {
    throw new GameRuleError('Market row is empty');
  }

  // Remove leftmost card
  const discarded = marketCards.shift();

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Discarded leftmost Market card: ${discarded.name}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

module.exports = {
  processPlayCard,
  processDrawCards,
  processBuyMarketCard,
  processDiscardHazard,
  processDiscardMarketCard
};
