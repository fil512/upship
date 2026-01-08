/**
 * Scoring Actions
 * CALCULATE_SCORES action processor
 * Implements Section 1.1 (Victory), Section 12.2 (VP Scoring)
 */

import type { GameState, PlayerState, LogEntry } from '@upship/api';

const { GameRuleError } = require('../errors');
const { TECH_CARD_BAG } = require('../config/constants');
const { resourceFlowLogger } = require('../services/resourceFlowLogger');

interface ActionResult {
  newState: GameState;
}

interface TechCardDefinition {
  id: string;
  vp?: number;
  [key: string]: unknown;
}

interface ScoreBreakdown {
  previouslyAccumulated: number;
  routes: number;
  techCards: number;
}

interface PlayerScore {
  total: number;
  breakdown: ScoreBreakdown;
  faction: string;
}

interface ExtendedRoute {
  id: string;
  claimed?: string;
  vp?: number;
}

// Extended state with scoring
type ScoringState = GameState & {
  scores?: Record<string, PlayerScore>;
  winner?: string;
  hindenburgDisaster?: boolean;
  progressThresholds?: {
    age2: number;
    age3: number;
    end: number;
  };
  progressTrack?: number;
  map?: {
    routes?: ExtendedRoute[];
  };
};

// Extended player state with VP
type ScoringPlayerState = PlayerState & {
  vp?: number;
};

/**
 * Get all tech card definitions flattened from all ages
 */
function getAllTechCardDefinitions(): Record<string, TechCardDefinition> {
  const allTechCards: Record<string, TechCardDefinition> = {};
  const techCardBag = TECH_CARD_BAG as Record<number, TechCardDefinition[]>;
  for (const age of [1, 2, 3]) {
    for (const card of (techCardBag[age] || [])) {
      allTechCards[card.id] = card;
    }
  }
  return allTechCards;
}

/**
 * Calculate VP from tech cards based on their VP values per Section 12.2
 * Essential=0 VP, Useful=1 VP, Niche=2-3 VP
 */
function calculateTechCardVPForScoring(cardIds: string[]): number {
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

type PlayerWithState = [string, PlayerScore, ScoringPlayerState];

/**
 * Apply tiebreakers per Section 1.1
 * Order: 1) Income Track, 2) Cash on hand, 3) Ships on routes
 */
function applyTiebreakers(sortedPlayers: PlayerWithState[]): PlayerWithState[] {
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

interface CalculateScoresData {
  forceEnd?: boolean;
}

/**
 * Calculate scores for all players
 * Per Section 12.2: VP comes from routes and technologies only
 * Cash and ships on routes are tiebreakers, NOT VP sources
 */
function processCalculateScores(state: GameState, playerId: string, data: CalculateScoresData | undefined): ActionResult {
  const scoringState = state as ScoringState;

  // Check if game end conditions are met
  // Fixed thresholds per Section 1.3: 8 launches for Age 1, 8 more for Age 2, 6 more for Age 3
  const thresholds = scoringState.progressThresholds || { age2: 8, age3: 16, end: 22 };
  const progressTrack = scoringState.progressTrack || 0;
  const forceEnd = data?.forceEnd === true; // Allow admin/debug override

  // Game ends when progress track reaches the end threshold OR Age 3 is complete
  // Or Hindenburg Disaster triggered
  const gameCanEnd = progressTrack >= thresholds.end || state.age >= 3 || scoringState.hindenburgDisaster;

  if (!gameCanEnd && !forceEnd) {
    throw new GameRuleError(
      `Game cannot end yet. Progress: ${progressTrack}/${thresholds.end}, Age: ${state.age}/3. ` +
      `Need to reach progress ${thresholds.end} or complete Age 3.`
    );
  }

  const scores: Record<string, PlayerScore> = {};

  for (const [pid, playerState] of Object.entries(state.players)) {
    const scoringPlayerState = playerState as ScoringPlayerState;
    let totalVP = 0;
    const breakdown: ScoreBreakdown = {
      previouslyAccumulated: 0,
      routes: 0,
      techCards: 0
    };

    // Previously accumulated VP from age transitions per Section 12.2
    // Technologies and routes are "scored every Age" - VP accumulates
    const previouslyAccumulated = scoringPlayerState.vp || 0;
    breakdown.previouslyAccumulated = previouslyAccumulated;
    totalVP += previouslyAccumulated;

    // VP from routes per Section 12.2 and Appendix F
    // Routes have explicit `vp` property per Appendix F specifications
    let routeVP = 0;
    const routes = scoringState.map?.routes || [];
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
  scoringState.scores = scores;

  // Determine winner with tiebreakers per Section 1.1
  // Include playerState for tiebreaker calculations
  const playersWithState: PlayerWithState[] = Object.entries(scores).map(([pid, scoreData]) => [
    pid,
    scoreData,
    state.players[pid] as ScoringPlayerState
  ]);

  const sortedPlayers = applyTiebreakers(playersWithState);
  scoringState.winner = sortedPlayers[0][0];

  const winnerScore = scores[sortedPlayers[0][0]];
  state.log = state.log || [];
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Game ended! Winner: ${winnerScore.faction} with ${winnerScore.total} VP`,
    type: 'system'
  } as LogEntry);

  // Set phase to game_complete to stop the game loop
  state.phase = 'game_complete';

  // Save resource flow log for economy analysis
  const logPath = resourceFlowLogger.saveLog();
  if (logPath) {
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Resource flow log saved to ${logPath}`,
      type: 'system'
    } as LogEntry);
  }

  return { newState: state };
}

export {
  processCalculateScores,
  calculateTechCardVPForScoring,
  applyTiebreakers
};

// Legacy alias for backwards compatibility during migration
const calculateTechnologyVPForScoring = calculateTechCardVPForScoring;

// CommonJS compatibility
module.exports = {
  processCalculateScores,
  calculateTechCardVPForScoring,
  applyTiebreakers,
  // Legacy alias for backwards compatibility during migration
  calculateTechnologyVPForScoring
};
