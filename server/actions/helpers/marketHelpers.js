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
 * Refresh R&D Board with new technologies from tech bag
 *
 * @param {Object} state - Game state (mutated)
 */
function refreshRnDBoard(state) {
  // Fill empty slots on R&D board from tech bag
  const rnDBoard = state.rnDBoard || { available: [] };
  const targetSize = RD_BOARD_SIZE[state.age] || 6;

  while (rnDBoard.available.length < targetSize && state.techBag && state.techBag.length > 0) {
    rnDBoard.available.push(state.techBag.pop());
  }

  state.rnDBoard = rnDBoard;
}

/**
 * Refresh Market Row with new cards from market deck
 *
 * @param {Object} state - Game state (mutated)
 */
function refreshMarketRow(state) {
  // Fill empty slots in market row from market deck
  const marketRow = state.marketRow || [];

  while (marketRow.length < MARKET_ROW_SIZE && state.marketDeck && state.marketDeck.length > 0) {
    marketRow.push(state.marketDeck.pop());
  }

  state.marketRow = marketRow;
}

/**
 * Refill R&D board from tech bag (used during age transitions)
 *
 * @param {Object} state - Game state (mutated)
 */
function refillRDBoard(state) {
  state.rdBoard = state.rdBoard || [];
  state.techBag = state.techBag || [];

  const targetSize = RD_BOARD_SIZE[state.age] || 4;

  while (state.rdBoard.length < targetSize && state.techBag.length > 0) {
    state.rdBoard.push(state.techBag.shift());
  }
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
