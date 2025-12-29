/**
 * Phase Transition Helpers
 * Functions for transitioning between game phases
 */

const { shuffleArray } = require('../../utils/random');
const { calculateTurnOrder } = require('./turnOrder');
const { refreshRnDBoard, refreshMarketRow } = require('./marketHelpers');
const { HAND_SIZE, INITIAL_AGENTS, TURNS_PER_AGE } = require('../../config/constants');

/**
 * Transition from worker placement to reveal phase
 *
 * @param {Object} state - Game state (mutated)
 */
function transitionToRevealPhase(state) {
  state.phase = 'reveal';

  // Initialize reveal phase tracking
  state.revealPhase = {
    revealedHands: {},
    resourcesCollected: {},
    techAcquisitionsComplete: {},
    marketPurchasesComplete: {}
  };

  // Auto-reveal all hands
  for (const playerId of state.playerOrder) {
    const playerState = state.players[playerId];
    state.revealPhase.revealedHands[playerId] = [...(playerState.hand || [])];
    state.revealPhase.resourcesCollected[playerId] = false;
    state.revealPhase.techAcquisitionsComplete[playerId] = false;
    state.revealPhase.marketPurchasesComplete[playerId] = false;
  }

  state.log.push({
    timestamp: new Date().toISOString(),
    message: 'All players have passed. Entering Reveal phase.',
    type: 'phase'
  });

  // Auto-collect resources from revealed cards
  collectRevealResources(state);
}

/**
 * Collect resources from revealed cards (Research, Influence, Gas, Cash, Officers, Engineers)
 * Per Section 5.1: Research = Research Level + Engineers in Barracks + card bonuses
 *
 * @param {Object} state - Game state (mutated)
 */
function collectRevealResources(state) {
  for (const playerId of state.playerOrder) {
    const playerState = state.players[playerId];
    const revealedCards = state.revealPhase.revealedHands[playerId] || [];

    let researchGained = 0;
    let influenceGained = 0;
    let hydrogenGained = 0;
    let heliumGained = 0;
    let cashGained = 0;
    let officersGained = 0;
    let engineersGained = 0;

    for (const card of revealedCards) {
      // Cards may have reveal icons via either 'reveal' or 'revealBonus' property
      const revealData = card.reveal || card.revealBonus;
      if (revealData) {
        researchGained += revealData.research || 0;
        influenceGained += revealData.influence || 0;
        hydrogenGained += revealData.hydrogen || 0;
        heliumGained += revealData.helium || 0;
        cashGained += revealData.cash || 0;
        officersGained += revealData.officers || 0;
        engineersGained += revealData.engineers || 0;
      }
    }

    // Per Section 5.1: Research = Research Level + Engineers in Barracks + card bonuses
    const researchLevel = playerState.researchLevel || 0;
    const engineersInBarracks = playerState.engineers || 0;
    researchGained += researchLevel + engineersInBarracks;

    // Apply gains
    playerState.research = (playerState.research || 0) + researchGained;
    playerState.influence = influenceGained; // Influence resets each round
    playerState.gasCubes.hydrogen += hydrogenGained;
    playerState.gasCubes.helium += heliumGained;
    playerState.cash += cashGained;
    playerState.officers += officersGained;
    playerState.engineers += engineersGained;

    state.revealPhase.resourcesCollected[playerId] = true;

    const resourceLog = [];
    if (researchGained > 0) resourceLog.push(`${researchGained} Research`);
    if (influenceGained > 0) resourceLog.push(`${influenceGained} Influence`);
    if (cashGained > 0) resourceLog.push(`£${cashGained}`);
    if (officersGained > 0) resourceLog.push(`${officersGained} Officer(s)`);
    if (engineersGained > 0) resourceLog.push(`${engineersGained} Engineer(s)`);
    if (hydrogenGained > 0) resourceLog.push(`${hydrogenGained} Hydrogen`);
    if (heliumGained > 0) resourceLog.push(`${heliumGained} Helium`);

    if (resourceLog.length > 0) {
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${playerState.faction.toUpperCase()} collected: ${resourceLog.join(', ')}`,
        playerId,
        type: 'reveal'
      });
    }
  }
}

/**
 * Transition from Reveal phase to Income & Cleanup phase
 * Per Section 5.2: Net income = Income Track - Engineers in Barracks (upkeep)
 *
 * @param {Object} state - Game state (mutated)
 */
function transitionToIncomeCleanup(state) {
  state.phase = 'income_cleanup';

  state.log.push({
    timestamp: new Date().toISOString(),
    message: 'Entering Income & Cleanup phase',
    type: 'phase'
  });

  // Process income collection for all players simultaneously
  for (const playerId of state.playerOrder) {
    const playerState = state.players[playerId];

    // Per Section 5.2: "Gain £ equal to your Income Track minus Engineers in Barracks"
    // This is NET income - upkeep is subtracted from income, not from cash
    const grossIncome = playerState.income || 0;
    const engineerUpkeep = playerState.engineers || 0;
    const netIncome = grossIncome - engineerUpkeep;

    if (netIncome >= 0) {
      playerState.cash += netIncome;
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${playerState.faction.toUpperCase()} collected £${netIncome} (£${grossIncome} income - £${engineerUpkeep} engineer upkeep)`,
        playerId,
        type: 'income'
      });
    } else {
      // Negative net income: must pay the difference from cash
      const deficit = Math.abs(netIncome);
      if (playerState.cash >= deficit) {
        playerState.cash -= deficit;
        state.log.push({
          timestamp: new Date().toISOString(),
          message: `${playerState.faction.toUpperCase()} paid £${deficit} (£${engineerUpkeep} upkeep exceeds £${grossIncome} income)`,
          playerId,
          type: 'income'
        });
      } else {
        // Cannot pay - handle bankruptcy (Section 5.3)
        const canPay = playerState.cash;
        playerState.cash = 0;

        state.log.push({
          timestamp: new Date().toISOString(),
          message: `${playerState.faction.toUpperCase()} needs loan: paid £${canPay}, still owes £${deficit - canPay}`,
          playerId,
          type: 'income'
        });
        // Note: Loan handling is a separate action per Section 5.3
      }
    }

    // Collect Officers and Engineers from their income tracks
    const officersGained = playerState.officerIncome || 0;
    const engineersGained = playerState.engineerIncome || 1;
    playerState.officers += officersGained;
    playerState.engineers += engineersGained;

    if (officersGained > 0 || engineersGained > 0) {
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${playerState.faction.toUpperCase()} gained +${officersGained} Officer(s), +${engineersGained} Engineer(s)`,
        playerId,
        type: 'income'
      });
    }

    // Discard remaining hand
    if (playerState.hand && playerState.hand.length > 0) {
      playerState.discardPile.push(...playerState.hand);
      playerState.hand = [];
    }

    // Reset influence (it doesn't carry over)
    playerState.influence = 0;
  }
}

/**
 * Check for age transition based on Progress Track (Section 1.3, 12.1)
 * Age transitions are triggered by technology acquisition, not turn count
 *
 * @param {Object} state - Game state (mutated)
 */
function checkAgeTransitionByProgressTrack(state) {
  const thresholds = state.progressThresholds || { age2: 12, age3: 24, end: 30 };

  if (state.age === 1 && state.progressTrack >= thresholds.age2) {
    state.age = 2;
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Age II begins! Progress Track reached ${state.progressTrack}.`,
      type: 'phase'
    });
  } else if (state.age === 2 && state.progressTrack >= thresholds.age3) {
    state.age = 3;
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Age III begins! Progress Track reached ${state.progressTrack}.`,
      type: 'phase'
    });
  }
}

/**
 * Start a new round (called after Income & Cleanup)
 * Per Section 5.2: Check Age Transition during Income & Cleanup phase
 *
 * @param {Object} state - Game state (mutated)
 */
function startNewRound(state) {
  state.turn++;
  state.round = 1;
  state.phase = 'worker_placement';

  // Per Section 5.2 step 3: Check Age Transition based on Progress Track
  // Age transitions are triggered by Progress Track thresholds, NOT turn count
  checkAgeTransitionByProgressTrack(state);

  // Reset worker placement state for all players
  // Each player gets back their own number of agents (2 or 3 if earned)
  for (const playerId of state.playerOrder) {
    const playerState = state.players[playerId];
    playerState.agentsRemaining = playerState.agents || INITIAL_AGENTS;
    playerState.hasPassed = false;
  }

  // Clear Ground Board placements
  state.groundBoard.placements = {};

  // Calculate new turn order based on income
  state.workerPlacement = {
    passedPlayers: [],
    ministryVisitors: [], // Reset - last round's visitors already got priority
    placementOrder: calculateTurnOrder(state),
    currentPlacerIndex: 0
  };

  // Reset reveal phase tracking
  state.revealPhase = {
    revealedHands: {},
    resourcesCollected: {},
    techAcquisitionsComplete: {},
    marketPurchasesComplete: {}
  };

  // Draw cards to hand size of 5 for each player
  for (const playerId of state.playerOrder) {
    const playerState = state.players[playerId];
    const cardsNeeded = HAND_SIZE - (playerState.hand?.length || 0);

    for (let i = 0; i < cardsNeeded; i++) {
      if (playerState.deck.length === 0 && playerState.discardPile.length > 0) {
        // Reshuffle discard into deck
        playerState.deck = shuffleArray([...playerState.discardPile]);
        playerState.discardPile = [];
      }

      if (playerState.deck.length > 0) {
        playerState.hand.push(playerState.deck.pop());
      }
    }
  }

  // Refresh R&D Board (replenish technologies)
  refreshRnDBoard(state);

  // Refill Market Row
  refreshMarketRow(state);

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Turn ${state.turn} begins. Worker Placement phase started.`,
    type: 'phase'
  });
}

module.exports = {
  transitionToRevealPhase,
  collectRevealResources,
  transitionToIncomeCleanup,
  startNewRound
};
