/**
 * Scoring Actions
 * CALCULATE_SCORES action processor
 */

const { GameRuleError } = require('../errors');

/**
 * Calculate scores for all players
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { forceEnd }
 * @returns {Object} { newState } or throws error
 */
function processCalculateScores(state, playerId, data) {
  // Check if game end conditions are met
  const thresholds = state.progressThresholds || { age2: 10, age3: 20, end: 30 };
  const progressTrack = state.progressTrack || 0;
  const forceEnd = data?.forceEnd === true; // Allow admin/debug override

  // Game ends when progress track reaches the end threshold OR Age 3 is complete
  const gameCanEnd = progressTrack >= thresholds.end || state.age >= 3;

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

    // VP from routes (distance = VP value)
    let routeVP = 0;
    const routes = state.map?.routes || [];
    for (const route of routes) {
      if (route.claimed === pid) {
        routeVP += route.distance;
      }
    }
    breakdown.routes = routeVP;
    totalVP += routeVP;

    // VP from technologies (approximate 1 VP per 2 techs)
    const techVP = Math.floor(playerState.technologies.length / 2);
    breakdown.technologies = techVP;
    totalVP += techVP;

    // VP from cash (£10 = 1 VP)
    const cashVP = Math.floor(playerState.cash / 10);
    breakdown.cash = cashVP;
    totalVP += cashVP;

    // VP from ships on routes (2 VP each)
    const shipsOnRoutes = (playerState.ships || []).filter(s => s.status === 'on_route').length;
    const shipVP = shipsOnRoutes * 2;
    breakdown.ships = shipVP;
    totalVP += shipVP;

    scores[pid] = {
      total: totalVP,
      breakdown,
      faction: playerState.faction
    };
  }

  // Store scores in state
  state.scores = scores;

  // Determine winner
  const sortedPlayers = Object.entries(scores)
    .sort((a, b) => b[1].total - a[1].total);

  state.winner = sortedPlayers[0][0];

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Game ended! Winner: ${scores[sortedPlayers[0][0]].faction} with ${sortedPlayers[0][1].total} VP`,
    type: 'system'
  });

  return { newState: state };
}

module.exports = { processCalculateScores };
