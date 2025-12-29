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
 * Collect resources from revealed cards (Research, Influence, Gas)
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

    for (const card of revealedCards) {
      // Cards may have reveal icons/bonuses
      if (card.revealBonus) {
        researchGained += card.revealBonus.research || 0;
        influenceGained += card.revealBonus.influence || 0;
        hydrogenGained += card.revealBonus.hydrogen || 0;
        heliumGained += card.revealBonus.helium || 0;
      }
    }

    // Engineers in barracks generate research
    researchGained += playerState.engineers || 0;

    // Apply gains
    playerState.research = (playerState.research || 0) + researchGained;
    playerState.influence = influenceGained; // Influence resets each round
    playerState.gasCubes.hydrogen += hydrogenGained;
    playerState.gasCubes.helium += heliumGained;

    state.revealPhase.resourcesCollected[playerId] = true;

    if (researchGained > 0 || influenceGained > 0 || hydrogenGained > 0 || heliumGained > 0) {
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${playerState.faction.toUpperCase()} collected: ${researchGained} Research, ${influenceGained} Influence` +
                 (hydrogenGained > 0 ? `, ${hydrogenGained} Hydrogen` : '') +
                 (heliumGained > 0 ? `, ${heliumGained} Helium` : ''),
        playerId,
        type: 'reveal'
      });
    }
  }
}

/**
 * Transition from Reveal phase to Income & Cleanup phase
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

    // Pay Engineer upkeep (£1 per Engineer)
    const upkeep = playerState.engineers || 0;
    if (upkeep > 0) {
      if (playerState.cash >= upkeep) {
        playerState.cash -= upkeep;
        state.log.push({
          timestamp: new Date().toISOString(),
          message: `${playerState.faction.toUpperCase()} paid £${upkeep} Engineer upkeep`,
          playerId,
          type: 'income'
        });
      } else {
        // Cannot afford upkeep - pay what they can
        const paid = playerState.cash;
        playerState.cash = 0;
        state.log.push({
          timestamp: new Date().toISOString(),
          message: `${playerState.faction.toUpperCase()} could only pay £${paid} of £${upkeep} Engineer upkeep (bankrupt!)`,
          playerId,
          type: 'income'
        });
      }
    }

    // Collect income from track (Section 12.3: handle negative income)
    const incomeGained = playerState.income || 0;
    if (incomeGained >= 0) {
      playerState.cash += incomeGained;
    } else {
      // Negative income: must pay the difference from cash
      const deficit = Math.abs(incomeGained);
      if (playerState.cash >= deficit) {
        playerState.cash -= deficit;
        state.log.push({
          timestamp: new Date().toISOString(),
          message: `${playerState.faction.toUpperCase()} paid £${deficit} (negative income penalty)`,
          playerId,
          type: 'income'
        });
      } else {
        // Cannot pay - handle bankruptcy (Section 12.3)
        const canPay = playerState.cash;
        const stillOwed = deficit - canPay;
        playerState.cash = 0;

        // Must discard technologies until solvent (each tech worth approx £2-6)
        // For simplicity, discard techs at £3 value each until debt cleared
        while (stillOwed > 0 && playerState.technologies.length > 0) {
          const discardedTech = playerState.technologies.pop();
          state.log.push({
            timestamp: new Date().toISOString(),
            message: `${playerState.faction.toUpperCase()} forced to sell technology: ${discardedTech}`,
            playerId,
            type: 'income'
          });
        }

        state.log.push({
          timestamp: new Date().toISOString(),
          message: `${playerState.faction.toUpperCase()} BANKRUPT: paid £${canPay}, still owes £${stillOwed}`,
          playerId,
          type: 'income'
        });
      }
    }

    // Collect Officers and Engineers from their income tracks
    const officersGained = playerState.officerIncome || 0;
    const engineersGained = playerState.engineerIncome || 1;
    playerState.officers += officersGained;
    playerState.engineers += engineersGained;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `${playerState.faction.toUpperCase()} collected: £${incomeGained}, +${officersGained} Officer(s), +${engineersGained} Engineer(s)`,
      playerId,
      type: 'income'
    });

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
 * Start a new round (called after Income & Cleanup)
 *
 * @param {Object} state - Game state (mutated)
 */
function startNewRound(state) {
  state.turn++;
  state.round = 1;
  state.phase = 'worker_placement';

  // Check for Age transition (every 10 turns in a 4-player game)
  if (state.turn > TURNS_PER_AGE && state.age < 3) {
    state.age++;
    state.turn = 1;
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Entering Age ${state.age}`,
      type: 'phase'
    });
  }

  // Reset worker placement state for all players
  for (const playerId of state.playerOrder) {
    const playerState = state.players[playerId];
    playerState.agentsRemaining = INITIAL_AGENTS;
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
