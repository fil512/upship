/**
 * Scoring Actions
 * CALCULATE_SCORES action processor
 * Implements Section 1.1 (Victory), Section 12.2 (VP Scoring)
 */

const { GameRuleError } = require('../errors');
const { TECH_CARD_BAG } = require('../config/constants');

/**
 * Get all tech card definitions flattened from all ages
 */
function getAllTechCardDefinitions() {
  const allTechCards = {};
  for (const age of [1, 2, 3]) {
    for (const card of (TECH_CARD_BAG[age] || [])) {
      allTechCards[card.id] = card;
    }
  }
  return allTechCards;
}

/**
 * Calculate VP from tech cards based on their VP values per Section 12.2
 * Essential=0 VP, Useful=1 VP, Niche=2-3 VP
 * @param {string[]} cardIds - Array of tech card IDs
 * @returns {number} Total VP from tech cards
 */
function calculateTechCardVPForScoring(cardIds) {
  const cardDefs = getAllTechCardDefinitions();
  let totalVP = 0;

  for (const cardId of (cardIds || [])) {
    const card = cardDefs[cardId];
    if (card && typeof card.vp === 'number') {
      totalVP += card.vp;
    }
  }

  return totalVP;
}

/**
 * Apply tiebreakers per Section 1.1
 * Order: 1) Income Track, 2) Cash on hand, 3) Ships on routes
 * @param {Object[]} sortedPlayers - Array of [playerId, scoreData, playerState] sorted by VP
 * @returns {Object[]} Re-sorted array with tiebreakers applied
 */
function applyTiebreakers(sortedPlayers) {
  return sortedPlayers.sort((a, b) => {
    // First: Compare by total VP
    const vpDiff = b[1].total - a[1].total;
    if (vpDiff !== 0) return vpDiff;

    // Tiebreaker 1: Highest Income Track position
    const incomeDiff = (b[2].income || 0) - (a[2].income || 0);
    if (incomeDiff !== 0) return incomeDiff;

    // Tiebreaker 2: Most Cash on hand
    const cashDiff = (b[2].cash || 0) - (a[2].cash || 0);
    if (cashDiff !== 0) return cashDiff;

    // Tiebreaker 3: Most ships currently on routes
    const aShipsOnRoutes = (a[2].ships || []).filter(s => s.status === 'on_route').length;
    const bShipsOnRoutes = (b[2].ships || []).filter(s => s.status === 'on_route').length;
    return bShipsOnRoutes - aShipsOnRoutes;
  });
}

/**
 * Calculate scores for all players
 * Per Section 12.2: VP comes from routes and technologies only
 * Cash and ships on routes are tiebreakers, NOT VP sources
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { forceEnd }
 * @returns {Object} { newState } or throws error
 */
function processCalculateScores(state, playerId, data) {
  // Check if game end conditions are met
  const thresholds = state.progressThresholds || { age2: 4, age3: 8, end: 12 };
  const progressTrack = state.progressTrack || 0;
  const forceEnd = data?.forceEnd === true; // Allow admin/debug override

  // Game ends when progress track reaches the end threshold OR Age 3 is complete
  // Or Hindenburg Disaster triggered
  const gameCanEnd = progressTrack >= thresholds.end || state.age >= 3 || state.hindenburgDisaster;

  if (!gameCanEnd && !forceEnd) {
    throw new GameRuleError(
      `Game cannot end yet. Progress: ${progressTrack}/${thresholds.end}, Age: ${state.age}/3. ` +
      `Need to reach progress ${thresholds.end} or complete Age 3.`
    );
  }

  const scores = {};

  for (const [pid, playerState] of Object.entries(state.players)) {
    let totalVP = 0;
    const breakdown = {};

    // Previously accumulated VP from age transitions per Section 12.2
    // Technologies and routes are "scored every Age" - VP accumulates
    const previouslyAccumulated = playerState.vp || 0;
    breakdown.previouslyAccumulated = previouslyAccumulated;
    totalVP += previouslyAccumulated;

    // VP from routes per Section 12.2 and Appendix F
    // Routes have explicit `vp` property per Appendix F specifications
    let routeVP = 0;
    const routes = state.map?.routes || [];
    for (const route of routes) {
      if (route.claimed === pid) {
        routeVP += route.vp || 0;
      }
    }
    breakdown.routes = routeVP;
    totalVP += routeVP;

    // VP from tech cards per Section 12.2
    // Use actual VP values from tech cards, NOT length/2 formula
    const techVP = calculateTechCardVPForScoring(playerState.techCards);
    breakdown.techCards = techVP;
    totalVP += techVP;

    // Per Section 1.1: Cash and ships are TIEBREAKERS, not VP sources
    // We do NOT add them to totalVP anymore

    scores[pid] = {
      total: totalVP,
      breakdown,
      faction: playerState.faction
    };
  }

  // Store scores in state
  state.scores = scores;

  // Determine winner with tiebreakers per Section 1.1
  // Include playerState for tiebreaker calculations
  const playersWithState = Object.entries(scores).map(([pid, scoreData]) => [
    pid,
    scoreData,
    state.players[pid]
  ]);

  const sortedPlayers = applyTiebreakers(playersWithState);
  state.winner = sortedPlayers[0][0];

  const winnerScore = scores[sortedPlayers[0][0]];
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Game ended! Winner: ${winnerScore.faction} with ${winnerScore.total} VP`,
    type: 'system'
  });

  return { newState: state };
}

module.exports = {
  processCalculateScores,
  calculateTechCardVPForScoring,
  applyTiebreakers,
  // Legacy alias for backwards compatibility during migration
  calculateTechnologyVPForScoring: calculateTechCardVPForScoring
};
