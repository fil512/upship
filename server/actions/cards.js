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
  const { cardId, _internal = false } = data || {};
  const playerState = state.players[playerId];

  // Per Section 5.1: Market purchases during reveal must go through atomic REVEAL action
  if (!_internal) {
    throw new GameRuleError(
      'BUY_MARKET_CARD not allowed: Use the atomic REVEAL action to buy market cards (Section 5.1). ' +
      'Submit your marketPurchases[] when calling REVEAL.'
    );
  }

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
  const cost = card.cost || 3; // Default cost is 3 Influence

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
 * This is part of the Weather Bureau multi-step flow:
 *   PLACE_AGENT(weather_bureau) → at_weather_bureau → DISCARD_HAZARD → idle
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

  // Advance to next player's turn (Weather Bureau flow complete)
  const { advanceToNextPlacer } = require('./helpers/turnOrder');
  advanceToNextPlacer(state);

  return { newState: state };
}

/**
 * Keep a peeked hazard card (from Weather Bureau)
 * Player has seen the hazard and chooses NOT to discard it.
 * This is part of the Weather Bureau multi-step flow:
 *   PLACE_AGENT(weather_bureau) → at_weather_bureau → KEEP_HAZARD → idle
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data (unused)
 * @returns {Object} { newState } or throws error
 */
function processKeepHazard(state, playerId, _data) {
  const playerState = state.players[playerId];

  if (!playerState.peekedHazard) {
    throw new GameRuleError('No peeked hazard to keep. Visit Weather Bureau first.');
  }

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Kept hazard: ${playerState.peekedHazard.type} (difficulty ${playerState.peekedHazard.difficulty})`,
    playerId,
    type: 'action'
  });

  // Clear peeked hazard (they've made their decision)
  delete playerState.peekedHazard;

  // Advance to next player's turn (Weather Bureau flow complete)
  const { advanceToNextPlacer } = require('./helpers/turnOrder');
  advanceToNextPlacer(state);

  return { newState: state };
}

/**
 * Discard one of the two cards drawn at Ministry
 * This is part of the Ministry multi-step flow:
 *   PLACE_AGENT(ministry) → at_ministry → DISCARD_MINISTRY_CARD → idle
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { cardIndex: 0|1 }
 * @returns {Object} { newState } or throws error
 */
function processDiscardMinistryCard(state, playerId, data) {
  const { cardIndex } = data;
  const playerState = state.players[playerId];

  // Validate player has drawn ministry cards
  if (!playerState.drawnMinistryCards || playerState.drawnMinistryCards.length !== 2) {
    throw new GameRuleError('No Ministry cards to discard. Visit Ministry first.');
  }

  // Validate card index
  if (cardIndex !== 0 && cardIndex !== 1) {
    throw new GameRuleError('cardIndex must be 0 or 1');
  }

  // Get the two drawn cards
  const [card0, card1] = playerState.drawnMinistryCards;

  // Discard the selected card, keep the other
  const discarded = cardIndex === 0 ? card0 : card1;
  const kept = cardIndex === 0 ? card1 : card0;

  // Add kept card to hand
  playerState.hand.push(kept);

  // Add discarded card to discard pile
  playerState.discardPile.push(discarded);

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Ministry: Kept ${kept.name}, discarded ${discarded.name}`,
    playerId,
    type: 'action'
  });

  // Clear the temporary drawn cards
  delete playerState.drawnMinistryCards;

  // Advance to next player's turn (Ministry flow complete)
  const { advanceToNextPlacer } = require('./helpers/turnOrder');
  advanceToNextPlacer(state);

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
  processKeepHazard,
  processDiscardMinistryCard,
  processDiscardMarketCard
};
