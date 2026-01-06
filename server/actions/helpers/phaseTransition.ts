/**
 * Phase Transition Helpers
 * Functions for transitioning between game phases
 */

import type { GameState, PlayerState, Card, LogEntry } from '@upship/api';

const { shuffleArray } = require('../../utils/random');
const { calculateTurnOrder } = require('./turnOrder');
const { refreshRnDBoard, refreshMarketRow } = require('./marketHelpers');
const { HAND_SIZE, INITIAL_AGENTS, MIN_INCOME, LOAN_AMOUNT, LOAN_INCOME_PENALTY } = require('../../config/constants');
const { performAgeTransition } = require('./ageTransition');
const { resourceFlowLogger, createFlowContext } = require('../../services/resourceFlowLogger');

// Extended state type for phase transitions (use intersection to allow optional properties)
type PhaseState = GameState & {
  turnInRound?: number;
  gameEndAfterRound?: boolean;
  gameEndReason?: string;
  progressThresholds?: {
    age2: number;
    age3: number;
    end: number;
  };
  revealPhase?: {
    revealedHands: Record<string, Card[]>;
    resourcesCollected: Record<string, boolean>;
    techAcquisitionsComplete: Record<string, boolean>;
    marketPurchasesComplete: Record<string, boolean>;
  };
};

// Extended player state for transition (use intersection to allow optional properties)
type TransitionPlayerState = PlayerState & {
  researchLevel?: number;
  officerIncome?: number;
  engineerIncome?: number;
  loans?: number;
  agentsRemaining?: number;
  hasPassed?: boolean;
  agents?: number;
};

/**
 * Transition from worker placement to reveal phase
 */
function transitionToRevealPhase(state: PhaseState): void {
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
    type: 'phase',
    round: state.round,
    age: state.age
  } as LogEntry);

  // Auto-collect resources from revealed cards
  collectRevealResources(state);
}

// Card reveal data structure
interface RevealData {
  research?: number;
  influence?: number;
  hydrogen?: number;
  helium?: number;
  cash?: number;
  officers?: number;
  engineers?: number;
  gas?: number;
}

// Card with reveal bonus
interface RevealCard extends Card {
  reveal?: RevealData;
  revealBonus?: RevealData;
}

/**
 * Collect resources from revealed cards (Research, Influence, Gas, Cash, Officers, Engineers)
 * Per Section 5.1: Research = Research Level + Engineers in Barracks + card bonuses
 */
function collectRevealResources(state: PhaseState): void {
  for (const playerId of state.playerOrder) {
    const playerState = state.players[playerId] as TransitionPlayerState;
    const revealedCards = (state.revealPhase?.revealedHands[playerId] || []) as RevealCard[];

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

        // GAP-067: Handle generic 'gas' property - defaults to hydrogen
        // Per market cards, some cards have gas: N which gives player's choice of gas
        // For simplicity, we default to hydrogen (the cheaper, more common option)
        if (revealData.gas) {
          hydrogenGained += revealData.gas;
        }
      }
    }

    // Per Section 5.1: Research = Research Level + Engineers in Barracks + card bonuses
    const researchLevel = playerState.researchLevel || 0;
    const engineersInBarracks = playerState.engineers || 0;
    researchGained += researchLevel + engineersInBarracks;

    // Apply gains - both Research and Influence reset each round (unspent is lost per Section 5.1)
    playerState.research = researchGained;
    playerState.influence = influenceGained;
    playerState.gasCubes.hydrogen += hydrogenGained;
    playerState.gasCubes.helium += heliumGained;
    playerState.cash += cashGained;
    playerState.officers += officersGained;
    playerState.engineers += engineersGained;

    // Log resource fountains
    const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
    const faction = playerState.faction || 'unknown';

    // Research comes from: research level (trickle), engineers (conversion), cards (card)
    if (researchLevel > 0) {
      resourceFlowLogger.logFountain(flowContext, playerId, faction, 'research', researchLevel, 'trickle', 'Research Level', playerState.research);
    }
    if (engineersInBarracks > 0) {
      resourceFlowLogger.logFountain(flowContext, playerId, faction, 'research', engineersInBarracks, 'conversion', 'Engineers in Barracks', playerState.research);
    }
    const cardResearch = researchGained - researchLevel - engineersInBarracks;
    if (cardResearch > 0) {
      resourceFlowLogger.logFountain(flowContext, playerId, faction, 'research', cardResearch, 'card', 'Reveal card bonuses', playerState.research);
    }

    if (influenceGained > 0) {
      resourceFlowLogger.logFountain(flowContext, playerId, faction, 'influence', influenceGained, 'card', 'Reveal card bonuses', playerState.influence);
    }
    if (hydrogenGained > 0) {
      resourceFlowLogger.logFountain(flowContext, playerId, faction, 'hydrogen', hydrogenGained, 'card', 'Reveal card bonuses', playerState.gasCubes.hydrogen);
    }
    if (heliumGained > 0) {
      resourceFlowLogger.logFountain(flowContext, playerId, faction, 'helium', heliumGained, 'card', 'Reveal card bonuses', playerState.gasCubes.helium);
    }
    if (cashGained > 0) {
      resourceFlowLogger.logFountain(flowContext, playerId, faction, 'cash', cashGained, 'card', 'Reveal card bonuses', playerState.cash);
    }
    if (officersGained > 0) {
      resourceFlowLogger.logFountain(flowContext, playerId, faction, 'officers', officersGained, 'card', 'Reveal card bonuses', playerState.officers);
    }
    if (engineersGained > 0) {
      resourceFlowLogger.logFountain(flowContext, playerId, faction, 'engineers', engineersGained, 'card', 'Reveal card bonuses', playerState.engineers);
    }

    if (state.revealPhase) {
      state.revealPhase.resourcesCollected[playerId] = true;
    }

    const resourceLog: string[] = [];
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
        type: 'reveal',
        round: state.round,
        age: state.age
      } as LogEntry);
    }
  }
}

/**
 * Transition from Reveal phase to Income & Cleanup phase
 * Per Section 5.2: Net income = Income Track - Engineers in Barracks (upkeep)
 */
function transitionToIncomeCleanup(state: PhaseState): void {
  state.phase = 'income_cleanup';

  state.log.push({
    timestamp: new Date().toISOString(),
    message: 'Entering Income & Cleanup phase',
    type: 'phase',
    round: state.round,
    age: state.age
  } as LogEntry);

  // Process income collection for all players simultaneously
  for (const playerId of state.playerOrder) {
    const playerState = state.players[playerId] as TransitionPlayerState;

    // Per Section 5.2: "Gain £ equal to your Income Track minus Engineers in Barracks"
    // This is NET income - upkeep is subtracted from income, not from cash
    const grossIncome = playerState.income || 0;
    const engineerUpkeep = playerState.engineers || 0;
    const netIncome = grossIncome - engineerUpkeep;

    // Log resource flows
    const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
    const faction = playerState.faction || 'unknown';

    // Log gross income as fountain (trickle)
    if (grossIncome > 0) {
      resourceFlowLogger.logFountain(flowContext, playerId, faction, 'cash', grossIncome, 'trickle', 'Income Track', playerState.cash + (netIncome >= 0 ? netIncome : 0));
    }

    // Log engineer upkeep as sink
    if (engineerUpkeep > 0) {
      resourceFlowLogger.logSink(flowContext, playerId, faction, 'cash', engineerUpkeep, 'upkeep', 'Engineer upkeep', playerState.cash);
    }

    if (netIncome >= 0) {
      playerState.cash += netIncome;
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${playerState.faction.toUpperCase()} collected £${netIncome} (£${grossIncome} income - £${engineerUpkeep} engineer upkeep)`,
        playerId,
        type: 'income',
        round: state.round,
        age: state.age
      } as LogEntry);
    } else {
      // Negative net income: must pay the difference from cash
      const deficit = Math.abs(netIncome);
      if (playerState.cash >= deficit) {
        playerState.cash -= deficit;
        state.log.push({
          timestamp: new Date().toISOString(),
          message: `${playerState.faction.toUpperCase()} paid £${deficit} (£${engineerUpkeep} upkeep exceeds £${grossIncome} income)`,
          playerId,
          type: 'income',
          round: state.round,
          age: state.age
        } as LogEntry);
      } else {
        // GAP-082: Cannot pay full deficit from cash - handle loans and potential bankruptcy
        // Per Section 5.3: Must take loans until solvent, or go bankrupt if loans would exceed limit
        const canPay = playerState.cash;
        let remainingDebt = deficit - canPay;
        playerState.cash = 0;

        state.log.push({
          timestamp: new Date().toISOString(),
          message: `${playerState.faction.toUpperCase()} cannot pay full upkeep: paid £${canPay}, needs £${remainingDebt} more`,
          playerId,
          type: 'income',
          round: state.round,
          age: state.age
        } as LogEntry);

        // Initialize loans counter if not present
        if (typeof playerState.loans !== 'number') {
          playerState.loans = 0;
        }

        // Try to take loans to cover the debt
        let currentIncome = playerState.income;
        while (remainingDebt > 0) {
          // Check if taking a loan would exceed the debt limit
          const potentialNewIncome = currentIncome - (LOAN_INCOME_PENALTY as number);
          if (potentialNewIncome < (MIN_INCOME as number)) {
            // Bankruptcy! Cannot take loan without exceeding debt limit
            // Per Section 5.3: lose 10 VP and reset Income Track to 0
            const vpLost = Math.min(10, playerState.vp || 0);
            playerState.vp = Math.max(0, (playerState.vp || 0) - 10);
            playerState.income = 0;

            state.log.push({
              timestamp: new Date().toISOString(),
              message: `${playerState.faction.toUpperCase()} is BANKRUPT! Cannot take loans (income would drop below ${MIN_INCOME}). Lost ${vpLost} VP, income reset to 0.`,
              playerId,
              type: 'bankruptcy',
              round: state.round,
              age: state.age
            } as LogEntry);
            break;
          }

          // Take a loan
          playerState.loans++;
          playerState.cash += LOAN_AMOUNT as number;
          currentIncome -= LOAN_INCOME_PENALTY as number;
          playerState.income = currentIncome;

          // Log loan as fountain for cash, sink for income
          resourceFlowLogger.logFountain(flowContext, playerId, faction, 'cash', LOAN_AMOUNT as number, 'loan', 'Take loan', playerState.cash);
          resourceFlowLogger.logSink(flowContext, playerId, faction, 'income', LOAN_INCOME_PENALTY as number, 'loan_penalty', 'Loan income penalty', playerState.income);

          state.log.push({
            timestamp: new Date().toISOString(),
            message: `${playerState.faction.toUpperCase()} took loan #${playerState.loans}: gained £${LOAN_AMOUNT}, income reduced to £${playerState.income}`,
            playerId,
            type: 'loan',
            round: state.round,
            age: state.age
          } as LogEntry);

          // Pay off remaining debt from the loan money
          if (playerState.cash >= remainingDebt) {
            playerState.cash -= remainingDebt;
            remainingDebt = 0;
          } else {
            remainingDebt -= playerState.cash;
            playerState.cash = 0;
          }
        }
      }
    }

    // Collect Officers and Engineers from their income tracks
    const officersGained = playerState.officerIncome || 0;
    const engineersGained = playerState.engineerIncome || 1;
    playerState.officers += officersGained;
    playerState.engineers += engineersGained;

    // Log officer/engineer income as fountains
    if (officersGained > 0) {
      resourceFlowLogger.logFountain(flowContext, playerId, faction, 'officers', officersGained, 'trickle', 'Officer Income Track', playerState.officers);
    }
    if (engineersGained > 0) {
      resourceFlowLogger.logFountain(flowContext, playerId, faction, 'engineers', engineersGained, 'trickle', 'Engineer Income Track', playerState.engineers);
    }

    if (officersGained > 0 || engineersGained > 0) {
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${playerState.faction.toUpperCase()} gained +${officersGained} Officer(s), +${engineersGained} Engineer(s)`,
        playerId,
        type: 'income',
        round: state.round,
        age: state.age
      } as LogEntry);
    }

    // Discard remaining hand
    if (playerState.hand && playerState.hand.length > 0) {
      playerState.discardPile.push(...playerState.hand);
      playerState.hand = [];
    }

    // Reset influence (it doesn't carry over)
    playerState.influence = 0;
  }

  // Auto-advance: Income phase has no player decisions, so immediately start next round
  // startNewRound() will either:
  // - Trigger age transition (phase = 'age_transition_blueprint_design') if thresholds met
  // - Start worker placement (phase = 'worker_placement') for normal rounds
  startNewRound(state);
}

/**
 * Trigger final scoring and determine winner
 * Called when game end conditions are met per Section 1.2
 */
function triggerFinalScoring(state: PhaseState): void {
  const { processCalculateScores } = require('../scoring');
  // Call scoring with forceEnd since we've already validated the game end condition
  processCalculateScores(state, state.playerOrder[0], { forceEnd: true });
}

/**
 * Start a new round (called after Income & Cleanup)
 * Per Section 5.2: Check Age Transition during Income & Cleanup phase
 * Per Section 1.2: Check game end conditions
 */
function startNewRound(state: PhaseState): void {
  state.round++;
  state.turnInRound = 1;

  // Per Section 5.2 step 3: Check Age Transition based on Progress Track
  // Age transitions are triggered by Progress Track thresholds, NOT turn count
  const thresholds = state.progressThresholds || { age2: 4, age3: 8, end: 12 };
  let needsAgeTransition = false;
  let newAge: number | null = null;

  // Per Section 1.2: Check game end via Progress Track FIRST
  // "The Rise of Fixed-Wing Aircraft: The Progress Track reaches its threshold."
  // Since we're at the end of a round (Income & Cleanup just completed), the round is complete
  if (state.progressTrack >= thresholds.end) {
    state.gameEndAfterRound = true;
    state.gameEndReason = 'progress_track';

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Progress Track reached ${state.progressTrack}/${thresholds.end}. The Rise of Fixed-Wing Aircraft signals the end of the airship era!`,
      type: 'game_end',
      round: state.round,
      age: state.age
    } as LogEntry);

    // Trigger final scoring
    triggerFinalScoring(state);
    return;
  }

  if (state.age === 1 && state.progressTrack >= thresholds.age2) {
    needsAgeTransition = true;
    newAge = 2;
  } else if (state.age === 2 && state.progressTrack >= thresholds.age3) {
    needsAgeTransition = true;
    newAge = 3;
  }

  if (needsAgeTransition && newAge !== null) {
    // Use complete age transition implementation which includes:
    // - VP scoring, ship/officer recovery, income adjustment
    // - Blueprint slot expansion
    // - Free Blueprint Design phase (age_transition_blueprint_design)
    performAgeTransition(state, newAge);
    // State phase is now 'age_transition_blueprint_design'
    // Worker placement setup will happen after transition completes
    return;
  }

  // No age transition - proceed with normal worker placement
  state.phase = 'worker_placement';

  // Reset worker placement state for all players
  // Each player gets back their own number of agents (2 or 3 if earned)
  for (const playerId of state.playerOrder) {
    const playerState = state.players[playerId] as TransitionPlayerState;
    playerState.agentsRemaining = playerState.agents || (INITIAL_AGENTS as number);
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
    const cardsNeeded = (HAND_SIZE as number) - (playerState.hand?.length || 0);

    for (let i = 0; i < cardsNeeded; i++) {
      if (playerState.deck.length === 0 && playerState.discardPile.length > 0) {
        // Reshuffle discard into deck
        playerState.deck = shuffleArray([...playerState.discardPile]) as Card[];
        playerState.discardPile = [];
      }

      if (playerState.deck.length > 0) {
        const card = playerState.deck.pop();
        if (card) {
          playerState.hand.push(card);
        }
      }
    }
  }

  // Refresh R&D Board (replenish technologies)
  refreshRnDBoard(state);

  // Refill Market Row
  refreshMarketRow(state);

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Round ${state.round} begins. Worker Placement phase started.`,
    type: 'phase',
    round: state.round,
    age: state.age
  } as LogEntry);
}

export {
  transitionToRevealPhase,
  collectRevealResources,
  transitionToIncomeCleanup,
  startNewRound
};

// CommonJS compatibility
module.exports = {
  transitionToRevealPhase,
  collectRevealResources,
  transitionToIncomeCleanup,
  startNewRound
};
