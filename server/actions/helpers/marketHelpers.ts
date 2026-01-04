/**
 * Market Helpers
 * Functions for managing gas market and R&D/Market boards
 */

import type { GameState, Technology } from '@upship/api';

const { HELIUM_PRICE_TRACK, RD_BOARD_SIZE, MARKET_ROW_SIZE } = require('../../config/constants');

// Re-export for consumers that import from this module
export { HELIUM_PRICE_TRACK };

// Extended state for market operations (use intersection to allow flexible types)
type MarketState = Omit<GameState, 'marketCards'> & {
  techCardBag?: Technology[];
  marketCards?: unknown[];
  marketDeck?: unknown[];
};

/**
 * Get current helium price step index
 */
function getHeliumPriceIndex(price: number): number {
  const idx = (HELIUM_PRICE_TRACK as number[]).indexOf(price);
  return idx >= 0 ? idx : 0;
}

/**
 * Advance helium market price by N steps
 */
function advanceHeliumMarket(state: MarketState, steps: number = 1): void {
  const currentIdx = getHeliumPriceIndex(state.gasMarket.helium);
  const newIdx = Math.min(currentIdx + steps, (HELIUM_PRICE_TRACK as number[]).length - 1);
  state.gasMarket.helium = (HELIUM_PRICE_TRACK as number[])[newIdx];
}

/**
 * Reduce helium market price by N steps
 */
function reduceHeliumMarket(state: MarketState, steps: number = 1): void {
  const currentIdx = getHeliumPriceIndex(state.gasMarket.helium);
  const newIdx = Math.max(currentIdx - steps, 0);
  state.gasMarket.helium = (HELIUM_PRICE_TRACK as number[])[newIdx];
}

/**
 * Refresh R&D Board with new tech cards from tech card bag
 */
function refreshRnDBoard(state: MarketState): void {
  // Fill empty slots on R&D board from tech card bag
  // NOTE: Must use state.rdBoard (not state.rnDBoard) - this is where all
  // tech acquisition logic reads from. See bug-notes.md for details.
  state.rdBoard = state.rdBoard || [];
  state.techCardBag = state.techCardBag || [];

  const rdBoardSizeConfig = RD_BOARD_SIZE as Record<number, number>;
  const targetSize = rdBoardSizeConfig[state.age] || 4;

  while (state.rdBoard.length < targetSize && state.techCardBag.length > 0) {
    const card = state.techCardBag.shift();
    if (card) {
      state.rdBoard.push(card);
    }
  }
}

/**
 * Refresh Market Row with new cards from market deck
 */
function refreshMarketRow(state: MarketState): void {
  // Fill empty slots in market row from market deck
  // NOTE: Must use state.marketCards (not state.marketRow) - this is where
  // all market card purchase logic reads from. See cards.js processBuyMarketCard.
  state.marketCards = state.marketCards || [];
  state.marketDeck = state.marketDeck || [];

  const marketRowSize = MARKET_ROW_SIZE as number;
  while (state.marketCards.length < marketRowSize && state.marketDeck.length > 0) {
    const card = state.marketDeck.pop();
    if (card) {
      state.marketCards.push(card);
    }
  }
}

/**
 * Refill R&D board from tech card bag (used during age transitions)
 * Note: This is an alias for refreshRnDBoard - they do the same thing.
 */
function refillRDBoard(state: MarketState): void {
  refreshRnDBoard(state);
}

export {
  getHeliumPriceIndex,
  advanceHeliumMarket,
  reduceHeliumMarket,
  refreshRnDBoard,
  refreshMarketRow,
  refillRDBoard
};

// CommonJS compatibility
module.exports = {
  getHeliumPriceIndex,
  advanceHeliumMarket,
  reduceHeliumMarket,
  refreshRnDBoard,
  refreshMarketRow,
  refillRDBoard,
  HELIUM_PRICE_TRACK
};
