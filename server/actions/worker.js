/**
 * Worker Placement Actions
 * PLACE_AGENT, PASS, RECALL_AGENTS action processors
 */

const { GameRuleError } = require('../errors');
const { shuffleArray } = require('../utils/random');
const { GROUND_BOARD_LOCATIONS, canPlaceAtLocation } = require('../data/groundBoard');
const { getCurrentPlacer, advanceToNextPlacer, allPlayersPassed } = require('./helpers/turnOrder');
const { transitionToRevealPhase } = require('./helpers/phaseTransition');
const { reduceHeliumMarket } = require('./helpers/marketHelpers');
const { WEATHER_BUREAU_COST } = require('../config/constants');

/**
 * Process card effects when used for agent placement (Section 8.1)
 */
function processCardEffect(state, playerId, card, _locationId) {
  const playerState = state.players[playerId];
  const effect = card.effect;

  if (!effect || effect === 'None') {
    return { success: true };
  }

  switch (effect) {
    case '+1 swap':
      // Mechanic: grants +1 swap at Design Bureau
      if (!playerState.bonusSwaps) playerState.bonusSwaps = 0;
      playerState.bonusSwaps += 1;
      return { success: true, message: '+1 swap this action' };

    case 'Draw 1 card':
      // Draftsman: Draw 1 card immediately
      if (playerState.deck.length === 0 && playerState.discardPile.length > 0) {
        playerState.deck = shuffleArray([...playerState.discardPile]);
        playerState.discardPile = [];
      }
      if (playerState.deck.length > 0) {
        const drawn = playerState.deck.pop();
        playerState.hand.push(drawn);
        return { success: true, message: `Drew ${drawn.name}` };
      }
      return { success: true, message: 'No cards to draw' };

    case '-£1 Research cost':
    case '-£1 per Research':
      // Researcher: Research cost reduction (GAP-049)
      if (!playerState.researchDiscount) playerState.researchDiscount = 0;
      playerState.researchDiscount += 1;
      return { success: true, message: '-£1 Research cost this action' };

    case '-£2 ship build cost':
      // Rigger: Ship build cost reduction (GAP-049)
      if (!playerState.buildDiscount) playerState.buildDiscount = 0;
      playerState.buildDiscount += 2;
      return { success: true, message: '-£2 ship build cost this action' };

    case 'Look at top Hazard':
      // Navigator: Peek at top hazard card (GAP-049)
      {
        const hazardDeck = playerState.hazardDeck || [];
        if (hazardDeck.length === 0) {
          return { success: true, message: 'Hazard deck is empty' };
        }
        const topHazard = hazardDeck[0];
        playerState.peekedHazard = { ...topHazard };
        return { success: true, message: `Peeked at hazard: ${topHazard.name || topHazard.type}` };
      }

    case 'Gain £1':
      // Clerk: Immediate cash gain (GAP-035)
      playerState.cash += 1;
      return { success: true, message: 'Gained £1' };

    case 'Gain £2':
      // Purser: Immediate cash gain
      playerState.cash += 2;
      return { success: true, message: 'Gained £2' };

    case '+1 ship stat':
      // Helmsman: Temporary ship stat bonus
      if (!playerState.launchBonuses) playerState.launchBonuses = {};
      playerState.launchBonuses.statBonus = (playerState.launchBonuses.statBonus || 0) + 1;
      return { success: true, message: '+1 ship stat for next launch' };

    default:
      return { success: true, message: `Unknown effect: ${effect}` };
  }
}

/**
 * Execute the action associated with a Ground Board location
 */
function executeLocationAction(state, playerId, locationId, _card) {
  const playerState = state.players[playerId];

  switch (locationId) {
    case 'research_institute':
      return { success: true, message: 'May buy Research for £3 each' };

    case 'design_bureau':
      return { success: true, message: 'May install upgrade to blueprint' };

    case 'construction_hall':
      return { success: true, message: 'May build a ship' };

    case 'launchpad':
      return { success: true, message: 'May launch a ship' };

    case 'academy':
      return { success: true, message: 'May recruit crew. May also discard leftmost Market card.' };

    case 'flight_school':
      return { success: true, message: 'May upgrade Officer income' };

    case 'technical_institute':
      return { success: true, message: 'May upgrade Engineer income' };

    case 'the_bank':
      return { success: true, message: 'May take a loan' };

    case 'ministry': {
      state.workerPlacement.ministryVisitors.push(playerId);

      // Draw 2 cards
      const cardsToDraw = 2;
      for (let i = 0; i < cardsToDraw; i++) {
        if (playerState.deck.length === 0 && playerState.discardPile.length > 0) {
          playerState.deck = shuffleArray([...playerState.discardPile]);
          playerState.discardPile = [];
        }
        if (playerState.deck.length > 0) {
          playerState.hand.push(playerState.deck.pop());
        }
      }

      // Must discard 1 card - auto-discard the last card drawn
      if (playerState.hand.length > 0) {
        const discarded = playerState.hand.pop();
        playerState.discardPile.push(discarded);
        state.log.push({
          timestamp: new Date().toISOString(),
          message: `Drew 2 cards, discarded ${discarded.name}`,
          playerId,
          type: 'action'
        });
      }

      // Reduce Helium Market Track by 1 step
      reduceHeliumMarket(state, 1);
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Ministry: Helium price reduced to £${state.gasMarket.helium}`,
        playerId,
        type: 'action'
      });

      return { success: true, message: 'Gained turn priority. Drew 2, discarded 1. Helium market reduced.' };
    }

    case 'gas_depot':
      return { success: true, message: 'May buy gas' };

    case 'insurance_bureau':
      return { success: true, message: 'May buy insurance' };

    case 'weather_bureau': {
      if (playerState.cash < WEATHER_BUREAU_COST) {
        return { success: false, message: `Not enough cash for Weather Bureau (need £${WEATHER_BUREAU_COST})` };
      }

      playerState.cash -= WEATHER_BUREAU_COST;

      const hazardDeck = playerState.hazardDeck || [];
      if (hazardDeck.length > 0) {
        const topHazard = hazardDeck[0];
        playerState.peekedHazard = { ...topHazard };

        state.log.push({
          timestamp: new Date().toISOString(),
          message: `Weather Bureau: Peeked at top hazard (${topHazard.type}, difficulty ${topHazard.difficulty}). May discard with DISCARD_HAZARD action.`,
          playerId,
          type: 'action'
        });

        return { success: true, message: `Peeked: ${topHazard.type} (difficulty ${topHazard.difficulty}). Use DISCARD_HAZARD to discard it.` };
      }
      return { success: true, message: 'Hazard deck is empty' };
    }

    default:
      return { error: `Unknown location: ${locationId}` };
  }
}

/**
 * Check if player has any cards that match available locations
 */
function hasPlayableCards(state, playerId) {
  const playerState = state.players[playerId];
  const hand = playerState.hand || [];
  const placements = state.groundBoard.placements || {};

  // Get list of unoccupied locations
  const availableLocations = Object.keys(GROUND_BOARD_LOCATIONS)
    .filter(locId => !placements[locId]);

  // Check if any card in hand matches any available location
  for (const card of hand) {
    const cardSymbol = card.symbol || 'any';
    for (const locId of availableLocations) {
      if (canPlaceAtLocation(cardSymbol, locId)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Place an agent on a Ground Board location
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { locationId, cardIndex }
 * @returns {Object} { newState } or throws error
 */
function processPlaceAgent(state, playerId, data) {
  const { locationId, cardIndex } = data;
  const playerState = state.players[playerId];

  // Validate phase
  if (state.phase !== 'worker_placement') {
    throw new GameRuleError('Can only place agents during worker placement phase');
  }

  // Validate it's this player's turn to place
  const currentPlacer = getCurrentPlacer(state);
  if (currentPlacer !== playerId) {
    throw new GameRuleError('Not your turn to place an agent');
  }

  // Check if player has passed
  if (playerState.hasPassed) {
    throw new GameRuleError('You have already passed this round');
  }

  // Check if player has agents available
  if (playerState.agentsRemaining <= 0) {
    throw new GameRuleError('No agents available');
  }

  // Check if location is valid
  const location = GROUND_BOARD_LOCATIONS[locationId];
  if (!location) {
    throw new GameRuleError('Invalid location');
  }

  // Check if location is already occupied
  const existingPlacement = state.groundBoard.placements[locationId];
  if (existingPlacement) {
    throw new GameRuleError('Location already occupied this round');
  }

  // Card is REQUIRED in rules-compliant mode
  if (cardIndex === undefined || cardIndex < 0) {
    throw new GameRuleError('Must play a card to place an agent');
  }

  if (cardIndex >= playerState.hand.length) {
    throw new GameRuleError('Invalid card index');
  }

  const card = playerState.hand[cardIndex];

  // Check if card symbol matches location
  if (!canPlaceAtLocation(card.symbol || 'any', locationId)) {
    throw new GameRuleError(`Card symbol (${card.symbol}) does not match location (${location.symbol})`);
  }

  // Discard the card
  const discardedCard = playerState.hand.splice(cardIndex, 1)[0];
  playerState.discardPile.push(discardedCard);

  // Place the agent
  state.groundBoard.placements[locationId] = {
    playerId,
    cardUsed: discardedCard.name
  };

  // Decrement available agents
  playerState.agentsRemaining--;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Placed agent at ${location.name} using ${discardedCard.name}`,
    playerId,
    type: 'action'
  });

  // Process card effects (Section 8.1)
  const cardEffectResult = processCardEffect(state, playerId, discardedCard, locationId);
  if (cardEffectResult.message) {
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Card effect: ${cardEffectResult.message}`,
      playerId,
      type: 'action'
    });
  }

  // Execute the location action immediately
  const actionResult = executeLocationAction(state, playerId, locationId, discardedCard);
  if (actionResult.error) {
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Location action failed: ${actionResult.error}`,
      playerId,
      type: 'warning'
    });
  }

  // Check if player should auto-pass (no agents left OR no playable cards)
  const shouldAutoPass = playerState.agentsRemaining <= 0 || !hasPlayableCards(state, playerId);

  if (shouldAutoPass) {
    playerState.hasPassed = true;
    state.workerPlacement.passedPlayers.push(playerId);
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `${playerState.faction.toUpperCase()} auto-passes (no agents or playable cards)`,
      playerId,
      type: 'system'
    });
  }

  // Advance to next placer or transition phase
  if (allPlayersPassed(state)) {
    transitionToRevealPhase(state);
  } else {
    advanceToNextPlacer(state);
  }

  return { newState: state };
}

/**
 * Pass action: Player chooses to stop placing agents this round
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @returns {Object} { newState } or throws error
 */
function processPass(state, playerId) {
  const playerState = state.players[playerId];

  // Validate phase
  if (state.phase !== 'worker_placement') {
    throw new GameRuleError('Can only pass during worker placement phase');
  }

  // Validate it's this player's turn to place
  const currentPlacer = getCurrentPlacer(state);
  if (currentPlacer !== playerId) {
    throw new GameRuleError('Not your turn');
  }

  // Check if already passed
  if (playerState.hasPassed) {
    throw new GameRuleError('Already passed this round');
  }

  // Mark as passed
  playerState.hasPassed = true;
  state.workerPlacement.passedPlayers.push(playerId);

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `${playerState.faction.toUpperCase()} passes`,
    playerId,
    type: 'action'
  });

  // Check if all players have passed
  if (allPlayersPassed(state)) {
    transitionToRevealPhase(state);
  } else {
    advanceToNextPlacer(state);
  }

  return { newState: state };
}

/**
 * Recall all agents (end of round)
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data (unused)
 * @returns {Object} { newState } or throws error
 */
function processRecallAgents(state, _playerId, _data) {
  if (state.groundBoard) {
    state.groundBoard.placements = {};
  }

  state.log.push({
    timestamp: new Date().toISOString(),
    message: 'All agents recalled',
    type: 'system'
  });

  return { newState: state };
}

module.exports = {
  processPlaceAgent,
  processPass,
  processRecallAgents,
  processCardEffect,
  executeLocationAction,
  hasPlayableCards
};
