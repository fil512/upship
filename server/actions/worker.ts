/**
 * Worker Placement Actions
 * PLACE_AGENT, PASS, RECALL_AGENTS action processors
 */

import type { GameState, PlayerState, Card, LogEntry } from '@upship/api';

const logger = require('../logger');
const { GameRuleError } = require('../errors');
const { shuffleArray } = require('../utils/random');
const { GROUND_BOARD_LOCATIONS, canPlaceAtLocation } = require('../data/groundBoard');
const { getCurrentPlacer, advanceToNextPlacer } = require('./helpers/turnOrder');
const { reduceHeliumMarket } = require('./helpers/marketHelpers');
const { WEATHER_BUREAU_COST } = require('../config/constants');
const { processBuildShip } = require('./building');
const { processBuyGas } = require('./gas');
const { processRecruitCrew, processUpgradeOfficerIncome, processUpgradeEngineerIncome, processGovernmentLiaison } = require('./crew');
const { processBuyInsurance } = require('./economy');
const { processUpgradeResearchLevel } = require('./technology');
const { processUpdateBlueprint } = require('./blueprint');

interface ActionResult {
  newState: GameState;
}

interface CardEffectResult {
  success: boolean;
  message?: string;
}

interface LocationActionResult {
  success?: boolean;
  message?: string;
  error?: string;
  skipTurnAdvance?: boolean;
}

// Extended player state
type WorkerPlayerState = Omit<PlayerState, 'peekedHazard'> & {
  launchBonuses?: Record<string, unknown>;
  researchDiscount?: number;
  buildDiscount?: number;
  peekedHazard?: { name?: string; type?: string; id?: string } | null;
  gasDiscount?: number;
  ministryActionsRemaining?: number;
  loanBonus?: number;
  insurancePolicies?: number;
  crewRecruitDiscount?: number;
  engineerRecruitDiscount?: number;
  canReorderRD?: boolean;
  canAcquireForeignTech?: boolean;
  canIgnoreTechRequirement?: boolean;
  drawnMinistryCards?: Card[];
  research?: number;
};

// Extended state with worker placement
type WorkerState = GameState & {
  nextRoundFirstPlayer?: string;
  workerPlacement: {
    currentPlacerIndex: number;
    placementOrder?: string[];
    passedPlayers?: string[];
    ministryVisitors: string[];
  };
  launchpadActive?: Record<string, boolean>;
};

interface GroundBoardLocation {
  name: string;
  symbol: string;
}

interface PlaceAgentData {
  locationId: string;
  cardIndex: number;
  buildCount?: number;
  gasType?: 'hydrogen' | 'helium';
  gasAmount?: number;
  crewType?: 'officer' | 'engineer';
  crewCount?: number;
  levels?: number;
  policyCount?: number;
  officerCount?: number;
  blueprint?: string | Record<string, unknown>;
}

interface LocationActionOptions {
  buildCount?: number;
  gasType?: 'hydrogen' | 'helium';
  gasAmount?: number;
  crewType?: 'officer' | 'engineer';
  crewCount?: number;
  levels?: number;
  policyCount?: number;
  officerCount?: number;
  blueprint?: string | Record<string, unknown>;
}

/**
 * Process Agent Card effects when used for agent placement (Section 8.1)
 * Handles both Starter Deck Agent Cards and Market Agent Cards per Appendix H
 */
function processCardEffect(state: GameState, playerId: string, card: Card, _locationId: string): CardEffectResult {
  const workerState = state as WorkerState;
  const playerState = state.players[playerId] as WorkerPlayerState;
  const effect = card.effect;

  if (!effect || effect === 'None' || effect === 'No action effect') {
    return { success: true };
  }

  // Initialize launchBonuses if needed
  if (!playerState.launchBonuses) playerState.launchBonuses = {};

  // eslint-disable-next-line sonarjs/max-switch-cases -- Game has many card effect types
  switch (effect) {
    // === STARTER DECK EFFECTS ===
    case 'Draw 1 card':
      // Draftsman: Draw 1 card immediately
      if (playerState.deck.length === 0 && playerState.discardPile.length > 0) {
        playerState.deck = shuffleArray([...playerState.discardPile]);
        playerState.discardPile = [];
      }
      if (playerState.deck.length > 0) {
        const drawn = playerState.deck.pop()!;
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
        const hazardDeck = (playerState as PlayerState & { hazardDeck?: unknown[] }).hazardDeck || [];
        if (hazardDeck.length === 0) {
          return { success: true, message: 'Hazard deck is empty' };
        }
        const topHazard = hazardDeck[0] as { name?: string; type?: string };
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
      playerState.launchBonuses!.statBonus = ((playerState.launchBonuses!.statBonus as number) || 0) + 1;
      return { success: true, message: '+1 ship stat for next launch' };

    // === MARKET CARD EFFECTS (GAP-050) ===

    // Technical Personnel
    case '+2 Reliability for this launch':
      // Test Pilot / Safety Inspector: +2 Reliability for this launch
      playerState.launchBonuses!.reliability = ((playerState.launchBonuses!.reliability as number) || 0) + 2;
      return { success: true, message: '+2 Reliability for this launch' };

    case '+1 Range for this launch':
      // Navigator (market): +1 Range for this launch
      playerState.launchBonuses!.range = ((playerState.launchBonuses!.range as number) || 0) + 1;
      return { success: true, message: '+1 Range for this launch' };

    case 'Ignore Weather hazards this launch':
      // Weather Expert: Ignore Weather hazards this launch
      playerState.launchBonuses!.ignoreWeather = true;
      return { success: true, message: 'Ignore Weather hazards this launch' };

    case 'Install Gas upgrade: -1 Weight':
      // Gas Engineer: Gas upgrades cost -1 Weight
      playerState.launchBonuses!.gasWeightReduction = 1;
      return { success: true, message: 'Gas upgrades -1 Weight' };

    case 'Install Propulsion upgrade: -1 Weight':
      // Engine Specialist: Propulsion upgrades cost -1 Weight
      playerState.launchBonuses!.propulsionWeightReduction = 1;
      return { success: true, message: 'Propulsion upgrades -1 Weight' };

    case '-2 Hull Cost':
      // Ground Crew Chief: -2 Hull Cost
      if (!playerState.buildDiscount) playerState.buildDiscount = 0;
      playerState.buildDiscount += 2;
      return { success: true, message: '-2 Hull Cost' };

    case 'Install Structure upgrade: +1 Lift':
      // Structural Engineer: Structure upgrades give +1 Lift
      playerState.launchBonuses!.structureLiftBonus = 1;
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
      playerState.launchBonuses!.combatIncomeBonus = 2;
      return { success: true, message: 'Gained 8; +2 Income on combat missions' };

    case 'Take 2 Ministry actions':
      // Government Minister: Take 2 Ministry actions
      playerState.ministryActionsRemaining = (playerState.ministryActionsRemaining || 0) + 2;
      return { success: true, message: 'Take 2 Ministry actions' };

    case '+2 Income from this route':
      // Shipping Tycoon: +2 Income from this route
      playerState.launchBonuses!.routeIncomeBonus = 2;
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
      workerState.nextRoundFirstPlayer = playerId;
      return { success: true, message: 'Go first in turn order next round' };

    case '-1 per crew recruited this action':
      // Union Representative: -1 per crew recruited
      if (!playerState.crewRecruitDiscount) playerState.crewRecruitDiscount = 0;
      playerState.crewRecruitDiscount += 1;
      return { success: true, message: '-1 per crew recruited' };

    case 'Claim route even if tied':
      // Customs Official: Claim route even if tied
      playerState.launchBonuses!.tiebreaker = true;
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
      playerState.launchBonuses!.luxury = ((playerState.launchBonuses!.luxury as number) || 0) + 1;
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
 */
function executeLocationAction(
  state: GameState,
  playerId: string,
  locationId: string,
  _card: Card,
  options: LocationActionOptions = {}
): LocationActionResult {
  const workerState = state as WorkerState;
  const playerState = state.players[playerId] as WorkerPlayerState;

  // Debug: Log what locationId we received
  state.log = state.log || [];
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `[DEBUG] executeLocationAction called with locationId="${locationId}" (type: ${typeof locationId})`,
    playerId,
    type: 'debug'
  } as LogEntry);

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
        return { success: false, error: (error as Error).message };
      }
    }

    case 'blueprint_design': {
      const { blueprint } = options;

      // Blueprint format: { frameSlots: [...], fabricSlots: [...], ... }
      if (blueprint) {
        try {
          const blueprintData = typeof blueprint === 'string' ? JSON.parse(blueprint) : blueprint;
          processUpdateBlueprint(state, playerId, {
            blueprint: blueprintData,
            _internal: true
          });
          return { success: true, message: 'Blueprint updated' };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      }

      // No modifications requested
      return { success: true, message: 'Visited Blueprint Design (no modifications)' };
    }

    case 'construction_hall': {
      // Per Section 5.1: Execute action immediately when placing agent
      const buildCount = options.buildCount || 1;
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `[DEBUG] construction_hall case hit, buildCount=${buildCount}`,
        playerId,
        type: 'debug'
      } as LogEntry);
      try {
        // Call processBuildShip with _internal flag to bypass validation
        // (agent placement already happened, so we're authorized)
        processBuildShip(state, playerId, { count: buildCount, _internal: true });
        return { success: true, message: `Built ${buildCount} ship(s)` };
      } catch (error) {
        state.log.push({
          timestamp: new Date().toISOString(),
          message: `[DEBUG] construction_hall build error: ${(error as Error).message}`,
          playerId,
          type: 'debug'
        } as LogEntry);
        return { success: false, error: (error as Error).message };
      }
    }

    case 'launchpad': {
      // Launchpad is a multi-step location - enables multiple launches
      // Set launchpadActive and DON'T advance turn until NO_MORE_LAUNCHES is called
      workerState.launchpadActive = workerState.launchpadActive || {};
      workerState.launchpadActive[playerId] = true;

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
        return { success: false, error: (error as Error).message };
      }
    }

    case 'flight_school': {
      // Per Section 5.1: Execute action immediately when placing agent
      try {
        processUpgradeOfficerIncome(state, playerId, { _internal: true });
        const newOfficerIncome = (playerState as PlayerState & { officerIncome?: number }).officerIncome || 0;
        return { success: true, message: `Upgraded Officer Income to ${newOfficerIncome}/round` };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }

    case 'technical_institute': {
      // Per Section 5.1: Execute action immediately when placing agent
      try {
        processUpgradeEngineerIncome(state, playerId, { _internal: true });
        const newEngineerIncome = (playerState as PlayerState & { engineerIncome?: number }).engineerIncome || 1;
        return { success: true, message: `Upgraded Engineer Income to ${newEngineerIncome}/round` };
      } catch (error) {
        return { success: false, error: (error as Error).message };
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
        return { success: false, error: (error as Error).message };
      }
    }

    case 'ministry': {
      workerState.workerPlacement.ministryVisitors.push(playerId);
      // GAP-081: Set persistent First Player token when visiting Ministry (Section 6.9)
      (state as GameState & { firstPlayer?: string }).firstPlayer = playerId;

      // Draw 2 cards to temporary storage (player must choose which to discard)
      const drawnCards: Card[] = [];
      for (let i = 0; i < 2; i++) {
        if (playerState.deck.length === 0 && playerState.discardPile.length > 0) {
          playerState.deck = shuffleArray([...playerState.discardPile]);
          playerState.discardPile = [];
        }
        if (playerState.deck.length > 0) {
          drawnCards.push(playerState.deck.pop()!);
        }
      }

      // Store drawn cards for player to choose from
      playerState.drawnMinistryCards = drawnCards;

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Ministry: Drew ${drawnCards.length} cards. Choose one to discard with DISCARD_MINISTRY_CARD.`,
        playerId,
        type: 'action'
      } as LogEntry);

      // Reduce Helium Market Track by 1 step
      reduceHeliumMarket(state, 1);
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Ministry: Helium price reduced to £${state.gasMarket.helium}`,
        playerId,
        type: 'action'
      } as LogEntry);

      // Multi-step flow: player must call DISCARD_MINISTRY_CARD
      return {
        success: true,
        message: `Gained turn priority. Drew ${drawnCards.length} cards. Choose DISCARD_MINISTRY_CARD(cardIndex: 0 or 1). Helium market reduced.`,
        skipTurnAdvance: true  // Don't advance turn until discard is made
      };
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
        return { success: false, error: (error as Error).message };
      }
    }

    case 'insurance_bureau': {
      // Per Section 5.1: Execute action immediately when placing agent
      try {
        processBuyInsurance(state, playerId, { _internal: true });
        const policies = (playerState as PlayerState & { insurance?: number }).insurance || 0;
        return { success: true, message: `Purchased insurance policy (${policies} total)` };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }

    case 'weather_bureau': {
      if (playerState.cash < (WEATHER_BUREAU_COST as number)) {
        return { success: false, message: `Not enough cash for Weather Bureau (need £${WEATHER_BUREAU_COST})` };
      }

      playerState.cash -= WEATHER_BUREAU_COST as number;

      const hazardDeck = (playerState as PlayerState & { hazardDeck?: Array<{ type: string; difficulty: number }> }).hazardDeck || [];
      if (hazardDeck.length > 0) {
        const topHazard = hazardDeck[0];
        playerState.peekedHazard = { ...topHazard };

        state.log.push({
          timestamp: new Date().toISOString(),
          message: `Weather Bureau: Peeked at top hazard (${topHazard.type}, difficulty ${topHazard.difficulty}). Choose KEEP_HAZARD or DISCARD_HAZARD.`,
          playerId,
          type: 'action'
        } as LogEntry);

        // Multi-step flow: player must call KEEP_HAZARD or DISCARD_HAZARD
        return {
          success: true,
          message: `Peeked: ${topHazard.type} (difficulty ${topHazard.difficulty}). Choose KEEP_HAZARD or DISCARD_HAZARD.`,
          skipTurnAdvance: true  // Don't advance turn until decision is made
        };
      }
      return { success: true, message: 'Hazard deck is empty' };
    }

    default:
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `[DEBUG] default case hit, locationId=${locationId}`,
        playerId,
        type: 'debug'
      } as LogEntry);
      return { error: `Unknown location: ${locationId}` };
  }
}

/**
 * Check if player has any cards that match available locations
 */
function hasPlayableCards(state: GameState, playerId: string): boolean {
  const playerState = state.players[playerId];
  const hand = playerState.hand || [];
  const placements = state.groundBoard.placements || {};

  // Get list of unoccupied locations
  const locations = GROUND_BOARD_LOCATIONS as Record<string, GroundBoardLocation>;
  const availableLocations = Object.keys(locations)
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
 */
function processPlaceAgent(state: GameState, playerId: string, data: PlaceAgentData): ActionResult {
  const { locationId, cardIndex, buildCount, gasType, gasAmount, crewType, crewCount, levels, policyCount, officerCount, blueprint } = data;
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
  const locations = GROUND_BOARD_LOCATIONS as Record<string, GroundBoardLocation>;
  const location = locations[locationId];
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
    cardUsed: discardedCard
  };

  // Decrement available agents
  playerState.agentsRemaining--;

  state.log = state.log || [];
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Placed agent at ${location.name} using ${discardedCard.name}`,
    playerId,
    type: 'action'
  } as LogEntry);

  // Process card effects (Section 8.1)
  const cardEffectResult = processCardEffect(state, playerId, discardedCard, locationId);
  if (cardEffectResult.message) {
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Card effect: ${cardEffectResult.message}`,
      playerId,
      type: 'action'
    } as LogEntry);
  }

  // Execute the location action immediately (Section 5.1)
  logger.debug({ locationId, playerId }, 'executeLocationAction will be called');
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `[DEBUG-BEFORE] About to call executeLocationAction with locationId="${locationId}"`,
    playerId,
    type: 'debug'
  } as LogEntry);
  const actionResult = executeLocationAction(state, playerId, locationId, discardedCard, { buildCount, gasType, gasAmount, crewType, crewCount, levels, policyCount, officerCount, blueprint });
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `[DEBUG-AFTER] executeLocationAction returned: ${JSON.stringify(actionResult)}`,
    playerId,
    type: 'debug'
  } as LogEntry);
  if (actionResult.error) {
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Location action failed: ${actionResult.error}`,
      playerId,
      type: 'warning'
    } as LogEntry);
  }

  // Special handling for launchpad - don't advance turn until NO_MORE_LAUNCHES is called
  if (actionResult.skipTurnAdvance) {
    // Launchpad is a multi-step location - player remains active
    state.log.push({
      timestamp: new Date().toISOString(),
      message: 'Ready to launch ships. Call LAUNCH_SHIP or NO_MORE_LAUNCHES.',
      playerId,
      type: 'system'
    } as LogEntry);
    return { newState: state };
  }

  // Mark that player has taken an action this turn (for Undo/End Turn UI)
  (playerState as PlayerState & { hasTakenActionThisTurn?: boolean }).hasTakenActionThisTurn = true;

  // Auto-advance to next placer (turn order enforcement)
  advanceToNextPlacer(state);

  return { newState: state };
}

// Note: processPass was removed - players must use REVEAL action to exit worker placement
// This ensures all players declare their tech/market acquisitions explicitly

/**
 * Recall all agents (end of round)
 */
function processRecallAgents(state: GameState, _playerId: string, _data: unknown): ActionResult {
  if (state.groundBoard) {
    state.groundBoard.placements = {};
  }

  state.log = state.log || [];
  state.log.push({
    timestamp: new Date().toISOString(),
    message: 'All agents recalled',
    type: 'system'
  } as LogEntry);

  return { newState: state };
}

export {
  processPlaceAgent,
  // Note: processPass removed - players must use REVEAL to exit worker placement
  processRecallAgents,
  processCardEffect,
  executeLocationAction,
  hasPlayableCards
};

// CommonJS compatibility
module.exports = {
  processPlaceAgent,
  // Note: processPass removed - players must use REVEAL to exit worker placement
  processRecallAgents,
  processCardEffect,
  executeLocationAction,
  hasPlayableCards
};
