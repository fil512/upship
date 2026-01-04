/**
 * City Bonuses per Section 10.4
 * One-time bonus when claiming a route, choose one endpoint city
 */

import type { PlayerState, GameState } from '@upship/api';

export interface CityBonus {
  cash?: number;
  influence?: number;
  research?: number;
  officers?: number;
  engineers?: number;
  hydrogen?: number;
  gasAny?: number;
  freeUpgradeSwap?: number;
  drawCard?: number;
}

export const CITY_BONUSES: Record<string, CityBonus> = {
  // Age I Cities (Section 10.4)
  London: { cash: 3 },                    // +£3
  Paris: { influence: 1 },                // +1 Influence
  Berlin: { research: 1 },                // +1 Research
  Frankfurt: { cash: 2 },                 // +£2
  Hamburg: { hydrogen: 1 },               // +1 Hydrogen cube
  Brussels: { officers: 1 },              // +1 Officer

  // Age II Cities (Section 10.4)
  Friedrichshafen: { research: 1 },       // +1 Research
  Cardington: { engineers: 1 },           // +1 Engineer
  Rome: { influence: 1 },                 // +1 Influence
  Moscow: { cash: 4 },                    // +£4
  Cairo: { freeUpgradeSwap: 1 },          // Free Upgrade swap
  'Scapa Flow': { officers: 1 },          // +1 Officer

  // Age III Cities (Section 10.4)
  'New York': { cash: 5 },                // +£5
  Lakehurst: { engineers: 1 },            // +1 Engineer
  'Rio de Janeiro': { influence: 2 },     // +2 Influence
  Recife: { gasAny: 1 },                  // +1 Gas cube (any)
  Seville: { drawCard: 1 },               // Draw 1 card
  Bombay: { cash: 3, influence: 1 },      // +£3, +1 Influence

  // Additional cities from Age I map that may not have explicit bonuses
  Copenhagen: {},
  Amsterdam: {},
  Vienna: {}
};

/**
 * Apply a city bonus to a player
 * @returns Bonus applied (for logging), or null if no bonus
 */
export function applyCityBonus(
  playerState: PlayerState,
  cityName: string,
  state?: GameState,
  playerId?: string
): CityBonus | null {
  const bonus = CITY_BONUSES[cityName];
  if (!bonus || Object.keys(bonus).length === 0) {
    return null; // No bonus for this city
  }

  const appliedBonus: CityBonus = {};

  if (bonus.cash) {
    playerState.cash = (playerState.cash || 0) + bonus.cash;
    appliedBonus.cash = bonus.cash;
  }

  if (bonus.influence) {
    playerState.influence = (playerState.influence || 0) + bonus.influence;
    appliedBonus.influence = bonus.influence;
  }

  if (bonus.research) {
    playerState.research = (playerState.research || 0) + bonus.research;
    appliedBonus.research = bonus.research;
  }

  if (bonus.officers) {
    playerState.officers = (playerState.officers || 0) + bonus.officers;
    appliedBonus.officers = bonus.officers;
  }

  if (bonus.engineers) {
    playerState.engineers = (playerState.engineers || 0) + bonus.engineers;
    appliedBonus.engineers = bonus.engineers;
  }

  if (bonus.hydrogen) {
    playerState.gasCubes = playerState.gasCubes || { hydrogen: 0, helium: 0 };
    playerState.gasCubes.hydrogen += bonus.hydrogen;
    appliedBonus.hydrogen = bonus.hydrogen;
  }

  if (bonus.gasAny) {
    // Player must choose gas type - for now default to hydrogen
    // This could be enhanced to prompt player choice
    playerState.gasCubes = playerState.gasCubes || { hydrogen: 0, helium: 0 };
    playerState.gasCubes.hydrogen += bonus.gasAny;
    appliedBonus.gasAny = bonus.gasAny;
  }

  if (bonus.freeUpgradeSwap) {
    // Grant one free swap (tracked as pending bonus)
    (playerState as PlayerState & { freeSwaps?: number }).freeSwaps =
      ((playerState as PlayerState & { freeSwaps?: number }).freeSwaps || 0) + bonus.freeUpgradeSwap;
    appliedBonus.freeUpgradeSwap = bonus.freeUpgradeSwap;
  }

  if (bonus.drawCard) {
    // Draw card from deck to hand
    if (playerState.deck && playerState.deck.length > 0) {
      const card = playerState.deck.shift();
      playerState.hand = playerState.hand || [];
      if (card) {
        playerState.hand.push(card);
      }
      appliedBonus.drawCard = 1;
    }
  }

  // Log the bonus if state and playerId provided
  if (state && playerId) {
    const bonusDescription = Object.entries(appliedBonus)
      .map(([key, value]) => `+${value} ${key}`)
      .join(', ');

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `City Bonus from ${cityName}: ${bonusDescription}`,
      playerId,
      type: 'bonus'
    });
  }

  return appliedBonus;
}

// CommonJS compatibility
module.exports = { CITY_BONUSES, applyCityBonus };
