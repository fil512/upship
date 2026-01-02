/**
 * Market Helpers
 * Functions for managing gas market and R&D/Market boards
 */

const { HELIUM_PRICE_TRACK, RD_BOARD_SIZE, MARKET_ROW_SIZE } = require('../../config/constants');

/**
 * Get current helium price step index
 *
 * @param {number} price - Current helium price
 * @returns {number} Index in HELIUM_PRICE_TRACK
 */
function getHeliumPriceIndex(price) {
  const idx = HELIUM_PRICE_TRACK.indexOf(price);
  return idx >= 0 ? idx : 0;
}

/**
 * Advance helium market price by N steps
 *
 * @param {Object} state - Game state (mutated)
 * @param {number} steps - Number of steps to advance (default 1)
 */
function advanceHeliumMarket(state, steps = 1) {
  const currentIdx = getHeliumPriceIndex(state.gasMarket.helium);
  const newIdx = Math.min(currentIdx + steps, HELIUM_PRICE_TRACK.length - 1);
  state.gasMarket.helium = HELIUM_PRICE_TRACK[newIdx];
}

/**
 * Reduce helium market price by N steps
 *
 * @param {Object} state - Game state (mutated)
 * @param {number} steps - Number of steps to reduce (default 1)
 */
function reduceHeliumMarket(state, steps = 1) {
  const currentIdx = getHeliumPriceIndex(state.gasMarket.helium);
  const newIdx = Math.max(currentIdx - steps, 0);
  state.gasMarket.helium = HELIUM_PRICE_TRACK[newIdx];
}

/**
 * Refresh R&D Board with new tech cards from tech card bag
 *
 * @param {Object} state - Game state (mutated)
 */
function refreshRnDBoard(state) {
  // Fill empty slots on R&D board from tech card bag
  // NOTE: Must use state.rdBoard (not state.rnDBoard) - this is where all
  // tech acquisition logic reads from. See bug-notes.md for details.
  state.rdBoard = state.rdBoard || [];
  state.techCardBag = state.techCardBag || [];

  const targetSize = RD_BOARD_SIZE[state.age] || 4;

  while (state.rdBoard.length < targetSize && state.techCardBag.length > 0) {
    state.rdBoard.push(state.techCardBag.shift());
  }
}

/**
 * Refresh Market Row with new cards from market deck
 *
 * @param {Object} state - Game state (mutated)
 */
function refreshMarketRow(state) {
  // Fill empty slots in market row from market deck
  // NOTE: Must use state.marketCards (not state.marketRow) - this is where
  // all market card purchase logic reads from. See cards.js processBuyMarketCard.
  state.marketCards = state.marketCards || [];
  state.marketDeck = state.marketDeck || [];

  while (state.marketCards.length < MARKET_ROW_SIZE && state.marketDeck.length > 0) {
    state.marketCards.push(state.marketDeck.pop());
  }
}

/**
 * Refill R&D board from tech card bag (used during age transitions)
 * Note: This is an alias for refreshRnDBoard - they do the same thing.
 *
 * @param {Object} state - Game state (mutated)
 */
function refillRDBoard(state) {
  refreshRnDBoard(state);
}

module.exports = {
  getHeliumPriceIndex,
  advanceHeliumMarket,
  reduceHeliumMarket,
  refreshRnDBoard,
  refreshMarketRow,
  refillRDBoard,
  HELIUM_PRICE_TRACK
};
