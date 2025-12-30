/**
 * Worker Placement Actions
 * PLACE_AGENT, PASS, RECALL_AGENTS action processors
 */

const logger = require('../logger');
const { GameRuleError } = require('../errors');
const { shuffleArray } = require('../utils/random');
const { GROUND_BOARD_LOCATIONS, canPlaceAtLocation } = require('../data/groundBoard');
const { getCurrentPlacer, advanceToNextPlacer, allPlayersPassed } = require('./helpers/turnOrder');
const { transitionToRevealPhase } = require('./helpers/phaseTransition');
const { reduceHeliumMarket } = require('./helpers/marketHelpers');
const { WEATHER_BUREAU_COST } = require('../config/constants');
const { processBuildShip } = require('./building');
const { processBuyGas } = require('./gas');
const { processRecruitCrew, processUpgradeOfficerIncome, processUpgradeEngineerIncome, processGovernmentLiaison } = require('./crew');
const { processBuyInsurance } = require('./economy');
const { processUpgradeResearchLevel } = require('./technology');
const { processInstallUpgrade, processRemoveUpgrade } = require('./blueprint');

/**
 * Process card effects when used for agent placement (Section 8.1)
 * Handles both starter deck cards and market cards per Appendix H
 */
function processCardEffect(state, playerId, card, _locationId) {
  const playerState = state.players[playerId];
  const effect = card.effect;

  if (!effect || effect === 'None' || effect === 'No action effect') {
    return { success: true };
  }

  // Initialize launchBonuses if needed
  if (!playerState.launchBonuses) playerState.launchBonuses = {};

  switch (effect) {
    // === STARTER DECK EFFECTS ===
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
      // Navigator (starter): Peek at top hazard card (GAP-049)
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
      playerState.launchBonuses.statBonus = (playerState.launchBonuses.statBonus || 0) + 1;
      return { success: true, message: '+1 ship stat for next launch' };

    // === MARKET CARD EFFECTS (GAP-050) ===

    // Technical Personnel
    case '+2 tile swaps':
      // Chief Engineer: +2 tile swaps at Design Bureau
      if (!playerState.bonusSwaps) playerState.bonusSwaps = 0;
      playerState.bonusSwaps += 2;
      return { success: true, message: '+2 tile swaps this action' };

    case '+2 Reliability for this launch':
      // Test Pilot / Safety Inspector: +2 Reliability for this launch
      playerState.launchBonuses.reliability = (playerState.launchBonuses.reliability || 0) + 2;
      return { success: true, message: '+2 Reliability for this launch' };

    case '+1 Range for this launch':
      // Navigator (market): +1 Range for this launch
      playerState.launchBonuses.range = (playerState.launchBonuses.range || 0) + 1;
      return { success: true, message: '+1 Range for this launch' };

    case 'Ignore Weather hazards this launch':
      // Weather Expert: Ignore Weather hazards this launch
      playerState.launchBonuses.ignoreWeather = true;
      return { success: true, message: 'Ignore Weather hazards this launch' };

    case 'Install Gas upgrade: -1 Weight':
      // Gas Engineer: Gas upgrades cost -1 Weight
      playerState.launchBonuses.gasWeightReduction = 1;
      return { success: true, message: 'Gas upgrades -1 Weight' };

    case 'Install Propulsion upgrade: -1 Weight':
      // Engine Specialist: Propulsion upgrades cost -1 Weight
      playerState.launchBonuses.propulsionWeightReduction = 1;
      return { success: true, message: 'Propulsion upgrades -1 Weight' };

    case '-2 Hull Cost':
      // Ground Crew Chief: -2 Hull Cost
      if (!playerState.buildDiscount) playerState.buildDiscount = 0;
      playerState.buildDiscount += 2;
      return { success: true, message: '-2 Hull Cost' };

    case 'Install Structure upgrade: +1 Lift':
      // Structural Engineer: Structure upgrades give +1 Lift
      playerState.launchBonuses.structureLiftBonus = 1;
      return { success: true, message: 'Structure upgrades +1 Lift' };

    case '-2 Lifting Gas cost':
      // Fuel Specialist: -2 Lifting Gas cost
      if (!playerState.gasDiscount) playerState.gasDiscount = 0;
      playerState.gasDiscount += 2;
      return { success: true, message: '-2 Lifting Gas cost' };

    // Political/Financial Personnel
    case 'Gain 5':
      // The Aristocrat: Gain 5
      playerState.cash += 5;
      return { success: true, message: 'Gained 5' };

    case 'Gain 3':
      // Industrial Magnate: Gain 3
      playerState.cash += 3;
      return { success: true, message: 'Gained 3' };

    case 'Gain 8; Combat missions: +2 Income':
      // Combat Veteran: Gain 8, Combat missions give +2 Income
      playerState.cash += 8;
      playerState.launchBonuses.combatIncomeBonus = 2;
      return { success: true, message: 'Gained 8; +2 Income on combat missions' };

    case 'Take 2 Ministry actions':
      // Government Minister: Take 2 Ministry actions
      playerState.ministryActionsRemaining = (playerState.ministryActionsRemaining || 0) + 2;
      return { success: true, message: 'Take 2 Ministry actions' };

    case '+2 Income from this route':
      // Shipping Tycoon: +2 Income from this route
      playerState.launchBonuses.routeIncomeBonus = 2;
      return { success: true, message: '+2 Income from this route' };

    case 'Loan gives 35 instead of 30':
      // Foreign Investor: Loans give 35 instead of 30
      if (!playerState.loanBonus) playerState.loanBonus = 0;
      playerState.loanBonus += 5;
      return { success: true, message: 'Loans give 35 instead of 30' };

    case 'Gain 1 Insurance policy':
      // Insurance Agent: Gain 1 Insurance policy
      if (!playerState.insurancePolicies) playerState.insurancePolicies = 0;
      playerState.insurancePolicies += 1;
      return { success: true, message: 'Gained 1 Insurance policy' };

    case 'Go first in turn order next round':
      // Bureaucrat: Go first in turn order next round
      state.nextRoundFirstPlayer = playerId;
      return { success: true, message: 'Go first in turn order next round' };

    case '-1 per crew recruited this action':
      // Union Representative: -1 per crew recruited
      if (!playerState.crewRecruitDiscount) playerState.crewRecruitDiscount = 0;
      playerState.crewRecruitDiscount += 1;
      return { success: true, message: '-1 per crew recruited' };

    case 'Claim route even if tied':
      // Customs Official: Claim route even if tied
      playerState.launchBonuses.tiebreaker = true;
      return { success: true, message: 'Claim route even if tied' };

    // Research Personnel
    case '-2 per Technology this round':
      // University Partnership: -2 per Technology this round
      if (!playerState.researchDiscount) playerState.researchDiscount = 0;
      playerState.researchDiscount += 2;
      return { success: true, message: '-2 per Technology this round' };

    case '-1 to Technology Research cost':
      // Patent Attorney: -1 to Technology Research cost
      if (!playerState.researchDiscount) playerState.researchDiscount = 0;
      playerState.researchDiscount += 1;
      return { success: true, message: '-1 to Technology Research cost' };

    case '+1 Research this round':
      // Research Assistant: +1 Research this round
      playerState.research = (playerState.research || 0) + 1;
      return { success: true, message: '+1 Research this round' };

    case 'Look at top 3 R&D tiles; reorder them':
      // Technical Library: Look at top 3 R&D tiles; reorder them
      // This sets a flag, the actual reordering happens via separate action
      playerState.canReorderRD = true;
      return { success: true, message: 'May reorder top 3 R&D tiles' };

    case 'Acquire Tech another player owns (pay double)':
      // Foreign Consultant: Acquire Tech from another player (pay double)
      playerState.canAcquireForeignTech = true;
      return { success: true, message: 'May acquire Tech from another player (pay double)' };

    // Organizations
    case 'Install 1 Upgrade ignoring Tech requirement':
      // Royal Geographic Society: Install 1 Upgrade ignoring Tech requirement
      playerState.canIgnoreTechRequirement = true;
      return { success: true, message: 'May install 1 Upgrade ignoring Tech requirement' };

    case '+1 Luxury stat for this launch':
      // Luxury Travel Agency: +1 Luxury stat for this launch
      playerState.launchBonuses.luxury = (playerState.launchBonuses.luxury || 0) + 1;
      return { success: true, message: '+1 Luxury for this launch' };

    case 'Recruit 1 Officer free':
      // Aviation Club: Recruit 1 Officer free
      playerState.officers = (playerState.officers || 0) + 1;
      return { success: true, message: 'Recruited 1 Officer free' };

    case 'Recruit 1 Engineer at -1':
      // Engineering Guild: Recruit 1 Engineer at -1
      if (!playerState.engineerRecruitDiscount) playerState.engineerRecruitDiscount = 0;
      playerState.engineerRecruitDiscount += 1;
      return { success: true, message: 'Recruit 1 Engineer at -1' };

    default:
      return { success: true, message: `Unknown effect: ${effect}` };
  }
}

/**
 * Execute the action associated with a Ground Board location
 * Per Section 5.1: Actions execute IMMEDIATELY when placing an agent
 *
 * @param {Object} state - Game state
 * @param {string} playerId - Acting player ID
 * @param {string} locationId - Location ID
 * @param {Object} _card - Card used (unused for most locations)
 * @param {Object} options - Additional options (e.g., buildCount for construction_hall)
 */
function executeLocationAction(state, playerId, locationId, _card, options = {}) {
  const playerState = state.players[playerId];

  // Debug: Log what locationId we received
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `[DEBUG] executeLocationAction called with locationId="${locationId}" (type: ${typeof locationId})`,
    playerId,
    type: 'debug'
  });

  switch (locationId) {
    case 'research_institute': {
      const { levels = 1 } = options;
      if (levels === 0) {
        return { success: true, message: 'Visited Research Institute (no upgrade)' };
      }
      try {
        processUpgradeResearchLevel(state, playerId, { levels, _internal: true });
        return { success: true, message: `Upgraded Research Level by ${levels}` };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    case 'design_bureau': {
      const { swaps: swapsJson } = options;

      // Handle no swaps - just visiting
      if (!swapsJson) {
        return { success: true, message: 'Visited Design Bureau (no modifications)' };
      }

      let swapsArray;
      try {
        swapsArray = typeof swapsJson === 'string' ? JSON.parse(swapsJson) : swapsJson;
      } catch (_e) {
        return { success: false, error: 'Invalid swaps format - expected JSON array' };
      }

      if (!Array.isArray(swapsArray) || swapsArray.length === 0) {
        return { success: true, message: 'Visited Design Bureau (no modifications)' };
      }

      // Reset swaps counter for this visit
      playerState.swapsUsedThisVisit = 0;

      const results = [];
      for (const swap of swapsArray) {
        try {
          if (swap.action === 'install') {
            processInstallUpgrade(state, playerId, {
              slotType: swap.slotType,
              slotIndex: swap.slotIndex,
              upgradeId: swap.upgradeId,
              _internal: true
            });
            results.push(`Installed ${swap.upgradeId}`);
          } else if (swap.action === 'remove') {
            processRemoveUpgrade(state, playerId, {
              slotType: swap.slotType,
              slotIndex: swap.slotIndex,
              _internal: true
            });
            results.push(`Removed from ${swap.slotType} slot ${swap.slotIndex}`);
          } else {
            results.push(`Unknown action: ${swap.action}`);
          }
        } catch (error) {
          // Log the error but continue with remaining swaps
          state.log.push({
            timestamp: new Date().toISOString(),
            message: `Design Bureau swap failed: ${error.message}`,
            playerId,
            type: 'warning'
          });
          results.push(`Failed: ${error.message}`);
          break; // Stop processing on first failure (swap limit reached or other error)
        }
      }

      return { success: true, message: results.join('; ') };
    }

    case 'construction_hall': {
      // Per Section 5.1: Execute action immediately when placing agent
      const buildCount = options.buildCount || 1;
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `[DEBUG] construction_hall case hit, buildCount=${buildCount}`,
        playerId,
        type: 'debug'
      });
      try {
        // Call processBuildShip with _internal flag to bypass validation
        // (agent placement already happened, so we're authorized)
        processBuildShip(state, playerId, { count: buildCount, _internal: true });
        return { success: true, message: `Built ${buildCount} ship(s)` };
      } catch (error) {
        state.log.push({
          timestamp: new Date().toISOString(),
          message: `[DEBUG] construction_hall build error: ${error.message}`,
          playerId,
          type: 'debug'
        });
        return { success: false, error: error.message };
      }
    }

    case 'launchpad': {
      // Launchpad is a multi-step location - enables multiple launches
      // Set launchpadActive and DON'T advance turn until NO_MORE_LAUNCHES is called
      state.launchpadActive = state.launchpadActive || {};
      state.launchpadActive[playerId] = true;

      return {
        success: true,
        message: 'Launchpad activated - may launch ships. Call NO_MORE_LAUNCHES when done.',
        skipTurnAdvance: true  // Signal to processPlaceAgent not to advance turn
      };
    }

    case 'academy': {
      // Per Section 5.1: Execute action immediately when placing agent
      const { crewType, crewCount } = options;
      if (!crewType || !crewCount) {
        return { success: false, error: 'Academy requires crewType and crewCount parameters' };
      }
      try {
        processRecruitCrew(state, playerId, { crewType, count: crewCount, _internal: true });
        return { success: true, message: `Recruited ${crewCount} ${crewType}(s)` };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    case 'flight_school': {
      // Per Section 5.1: Execute action immediately when placing agent
      try {
        processUpgradeOfficerIncome(state, playerId, { _internal: true });
        const newOfficerIncome = playerState.officerIncome || 0;
        return { success: true, message: `Upgraded Officer Income to ${newOfficerIncome}/round` };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    case 'technical_institute': {
      // Per Section 5.1: Execute action immediately when placing agent
      try {
        processUpgradeEngineerIncome(state, playerId, { _internal: true });
        const newEngineerIncome = playerState.engineerIncome || 1;
        return { success: true, message: `Upgraded Engineer Income to ${newEngineerIncome}/round` };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    case 'the_bank':
      return { success: true, message: 'May take a loan' };

    case 'government_liaison': {
      // Per Section 6.8: Spend 1-3 Officers to increase Income Track
      const { officerCount } = options;
      if (!officerCount) {
        return { success: false, error: 'Government Liaison requires officerCount parameter (1-3)' };
      }
      try {
        processGovernmentLiaison(state, playerId, { officerCount, _internal: true });
        return { success: true, message: `Spent ${officerCount} officer(s) for +${officerCount} income` };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

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

    case 'gas_depot': {
      // Per Section 5.1: Execute action immediately when placing agent
      const { gasType, gasAmount } = options;
      if (!gasType || !gasAmount) {
        return { success: false, error: 'Gas Depot requires gasType and gasAmount parameters' };
      }
      try {
        processBuyGas(state, playerId, { gasType, amount: gasAmount, _internal: true });
        return { success: true, message: `Bought ${gasAmount} ${gasType}` };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    case 'insurance_bureau': {
      // Per Section 5.1: Execute action immediately when placing agent
      try {
        processBuyInsurance(state, playerId, { _internal: true });
        const policies = playerState.insurance || 0;
        return { success: true, message: `Purchased insurance policy (${policies} total)` };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

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
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `[DEBUG] default case hit, locationId=${locationId}`,
        playerId,
        type: 'debug'
      });
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
  const { locationId, cardIndex, buildCount, gasType, gasAmount, crewType, crewCount, levels, policyCount, officerCount, swaps } = data;
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

  // Execute the location action immediately (Section 5.1)
  logger.debug({ locationId, playerId }, 'executeLocationAction will be called');
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `[DEBUG-BEFORE] About to call executeLocationAction with locationId="${locationId}"`,
    playerId,
    type: 'debug'
  });
  const actionResult = executeLocationAction(state, playerId, locationId, discardedCard, { buildCount, gasType, gasAmount, crewType, crewCount, levels, policyCount, officerCount, swaps });
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `[DEBUG-AFTER] executeLocationAction returned: ${JSON.stringify(actionResult)}`,
    playerId,
    type: 'debug'
  });
  if (actionResult.error) {
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Location action failed: ${actionResult.error}`,
      playerId,
      type: 'warning'
    });
  }

  // Special handling for launchpad - don't advance turn until NO_MORE_LAUNCHES is called
  if (actionResult.skipTurnAdvance) {
    // Launchpad is a multi-step location - player remains active
    state.log.push({
      timestamp: new Date().toISOString(),
      message: 'Ready to launch ships. Call LAUNCH_SHIP or NO_MORE_LAUNCHES.',
      playerId,
      type: 'system'
    });
    return { newState: state };
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
