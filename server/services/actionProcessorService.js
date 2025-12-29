/**
 * Action Processor Service
 * Handles all game action processing logic
 * Extracted from gameState.js routes for better separation of concerns
 */

const {
  UPGRADES,
  TECHNOLOGIES
} = require('../data/upgrades');
const {
  GROUND_BOARD_LOCATIONS,
  canPlaceAtLocation
} = require('../data/groundBoard');

const {
  shuffleArray,
  getCurrentPlacer,
  advanceToNextPlacer,
  allPlayersPassed,
  transitionToRevealPhase,
  transitionToIncomeCleanup,
  startNewRound,
  advanceHeliumMarket,
  reduceHeliumMarket,
  hasPlayableCards,
  processCardEffect,
  executeLocationAction,
  addAgeTechnologies,
  refillRDBoard,
  calculateSpecializationDiscount,
  calculateBlueprintStats,
  calculateRequiredGasCubes
} = require('./gameStateHelpers');

// Main action dispatcher
function processAction(state, playerId, actionType, data) {
  const newState = JSON.parse(JSON.stringify(state)); // Deep clone
  const playerState = newState.players[playerId];

  if (!playerState) {
    return { error: 'Player not found in game' };
  }

  switch (actionType) {
    case 'END_TURN':
      return processEndTurn(newState, playerId);

    case 'BUY_GAS':
      return processBuyGas(newState, playerId, data);

    case 'ACQUIRE_TECHNOLOGY':
      return processAcquireTechnology(newState, playerId, data);

    case 'INSTALL_UPGRADE':
      return processInstallUpgrade(newState, playerId, data);

    case 'REMOVE_UPGRADE':
      return processRemoveUpgrade(newState, playerId, data);

    case 'TAKE_LOAN':
      return processTakeLoan(newState, playerId, data);

    case 'COLLECT_INCOME':
      return processCollectIncome(newState, playerId, data);

    case 'PLAY_CARD':
      return processPlayCard(newState, playerId, data);

    case 'DRAW_CARDS':
      return processDrawCards(newState, playerId, data);

    case 'PLACE_AGENT':
      return processPlaceAgent(newState, playerId, data);

    case 'PASS':
      return processPass(newState, playerId);

    case 'RECALL_AGENTS':
      return processRecallAgents(newState, playerId, data);

    case 'RECRUIT_CREW':
      return processRecruitCrew(newState, playerId, data);

    case 'BUILD_SHIP':
      return processBuildShip(newState, playerId, data);

    case 'UPGRADE_OFFICER_INCOME':
      return processUpgradeOfficerIncome(newState, playerId, data);

    case 'UPGRADE_ENGINEER_INCOME':
      return processUpgradeEngineerIncome(newState, playerId, data);

    case 'BUY_INSURANCE':
      return processBuyInsurance(newState, playerId, data);

    case 'ACQUIRE_TECHNOLOGY_RESEARCH':
      return processAcquireTechnologyResearch(newState, playerId, data);

    case 'GAIN_RESEARCH':
      return processGainResearch(newState, playerId, data);

    case 'LOAD_GAS':
      return { error: 'LOAD_GAS is deprecated. Gas is spent from reserve when launching - use LAUNCH_SHIP with gasType parameter.' };

    case 'UNLOAD_GAS':
      return { error: 'UNLOAD_GAS is deprecated. Gas is spent from reserve when launching.' };

    case 'LAUNCH_SHIP':
      return processLaunchShip(newState, playerId, data);

    case 'CLAIM_ROUTE':
      return processClaimRoute(newState, playerId, data);

    case 'PERFORM_HAZARD_CHECK':
      return processHazardCheck(newState, playerId, data);

    case 'BUY_MARKET_CARD':
      return processBuyMarketCard(newState, playerId, data);

    case 'DISCARD_HAZARD':
      return processDiscardHazard(newState, playerId, data);

    case 'DISCARD_MARKET_CARD':
      return processDiscardMarketCard(newState, playerId, data);

    case 'CALCULATE_SCORES':
      return processCalculateScores(newState, playerId, data);

    default:
      return { error: `Unknown action type: ${actionType}` };
  }
}

// Discard a peeked hazard card (from Weather Bureau)
function processDiscardHazard(state, playerId, data) {
  const playerState = state.players[playerId];

  if (!playerState.peekedHazard) {
    return { error: 'No peeked hazard to discard. Visit Weather Bureau first.' };
  }

  // Remove the top card from hazard deck
  const hazardDeck = playerState.hazardDeck || [];
  if (hazardDeck.length > 0 && hazardDeck[0].id === playerState.peekedHazard.id) {
    const discarded = hazardDeck.shift();
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Discarded hazard: ${discarded.type} (difficulty ${discarded.difficulty})`,
      playerId,
      type: 'action'
    });
  }

  // Clear peeked hazard
  delete playerState.peekedHazard;

  return { newState: state };
}

// Discard leftmost Market card (from Academy)
function processDiscardMarketCard(state, playerId, data) {
  const marketCards = state.marketCards || [];

  if (marketCards.length === 0) {
    return { error: 'Market row is empty' };
  }

  // Remove leftmost card
  const discarded = marketCards.shift();

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Discarded leftmost Market card: ${discarded.name}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// End turn - behavior depends on current phase
function processEndTurn(state, playerId) {
  const playerState = state.players[playerId];

  switch (state.phase) {
    case 'worker_placement':
      // During worker placement, use PASS action instead of END_TURN
      return { error: 'Use PASS action during worker placement phase' };

    case 'reveal':
      // During reveal phase, END_TURN signals done with tech/market purchases
      state.revealPhase.techAcquisitionsComplete[playerId] = true;
      state.revealPhase.marketPurchasesComplete[playerId] = true;

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${playerState.faction.toUpperCase()} finished reveal phase actions`,
        playerId,
        type: 'turn'
      });

      // Check if all players are done with reveal phase
      const allDone = state.playerOrder.every(pid =>
        state.revealPhase.techAcquisitionsComplete[pid] &&
        state.revealPhase.marketPurchasesComplete[pid]
      );

      if (allDone) {
        transitionToIncomeCleanup(state);
      }
      break;

    case 'income_cleanup':
      // During income/cleanup, END_TURN advances to next player
      // When all players done, start new round
      state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.playerOrder.length;

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${playerState.faction.toUpperCase()} ended their turn`,
        playerId,
        type: 'turn'
      });

      if (state.currentPlayerIndex === 0) {
        // All players have completed income/cleanup, start new round
        startNewRound(state);
      }
      break;

    default:
      // Fallback for any other phase - advance player
      state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.playerOrder.length;
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Player ended their turn`,
        playerId,
        type: 'turn'
      });
  }

  return { newState: state };
}

// Buy gas cubes
function processBuyGas(state, playerId, data) {
  const { gasType, amount } = data;
  const playerState = state.players[playerId];

  if (!['hydrogen', 'helium'].includes(gasType)) {
    return { error: 'Invalid gas type' };
  }

  // Helium requires Helium Handling technology (Section 4.4)
  if (gasType === 'helium') {
    const hasHeliumHandling = playerState.technologies?.some(t => t.id === 'HELIUM_HANDLING');
    if (!hasHeliumHandling) {
      return { error: 'Cannot purchase Helium without Helium Handling technology' };
    }
  }

  const price = state.gasMarket[gasType] * amount;

  if (playerState.cash < price) {
    return { error: 'Not enough cash' };
  }

  playerState.cash -= price;
  playerState.gasCubes[gasType] += amount;

  // Advance market price (unless USA buying helium)
  const isUSA = playerState.faction === 'usa';
  if (gasType === 'helium' && !isUSA) {
    // Helium uses stepped progression: advance 1 step per cube purchased
    advanceHeliumMarket(state, amount);
  }
  // Note: Hydrogen price is fixed at £1 per Section 4.4

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Bought ${amount} ${gasType} for £${price}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Acquire technology from R&D board
function processAcquireTechnology(state, playerId, data) {
  const { techId } = data;
  const playerState = state.players[playerId];

  const techIndex = state.rdBoard.findIndex(t => t.id === techId);
  if (techIndex === -1) {
    return { error: 'Technology not available' };
  }

  const tech = state.rdBoard[techIndex];

  if (playerState.cash < tech.cost) {
    return { error: 'Not enough cash' };
  }

  // Check if player already has this technology
  if (playerState.technologies.includes(techId)) {
    return { error: 'Already own this technology' };
  }

  playerState.cash -= tech.cost;
  playerState.technologies.push(techId);

  // Remove from R&D board
  state.rdBoard.splice(techIndex, 1);

  // Draw replacement from tech bag if available
  if (state.techBag && state.techBag.length > 0) {
    state.rdBoard.push(state.techBag.shift());
  }

  // Advance progress track
  state.progressTrack = (state.progressTrack || 0) + 1;

  // Check for age transition
  const thresholds = state.progressThresholds || { age2: 10, age3: 20, end: 30 };
  if (state.age === 1 && state.progressTrack >= thresholds.age2) {
    state.age = 2;
    // Add Age 2 technologies to the tech bag
    addAgeTechnologies(state, 2);
    // Refill R&D board with new techs
    refillRDBoard(state);
    // Reset gas market prices for new age (Section 4.4: Helium resets to £2 at Age Transitions)
    state.gasMarket = { hydrogen: 1, helium: 2 };
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Age II begins! New technologies available. Gas market reset.`,
      type: 'system'
    });
  } else if (state.age === 2 && state.progressTrack >= thresholds.age3) {
    state.age = 3;
    // Add Age 3 technologies to the tech bag
    addAgeTechnologies(state, 3);
    // Refill R&D board with new techs
    refillRDBoard(state);
    // Reset gas market prices for new age (Section 4.4: Helium resets to £2 at Age Transitions)
    state.gasMarket = { hydrogen: 1, helium: 2 };
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Age III begins! Final era technologies unlocked. Gas market reset.`,
      type: 'system'
    });
  }

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Acquired ${tech.name} technology. Progress: ${state.progressTrack}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Install upgrade on blueprint
function processInstallUpgrade(state, playerId, data) {
  const { slotType, slotIndex, upgradeId } = data;
  const playerState = state.players[playerId];

  const slotKey = `${slotType}Slots`;
  if (!playerState.blueprint[slotKey]) {
    return { error: 'Invalid slot type' };
  }

  if (slotIndex < 0 || slotIndex >= playerState.blueprint[slotKey].length) {
    return { error: 'Invalid slot index' };
  }

  // Check if slot is already occupied
  if (playerState.blueprint[slotKey][slotIndex]) {
    return { error: 'Slot already occupied. Remove current upgrade first.' };
  }

  // Validate upgrade exists
  const upgrade = UPGRADES[upgradeId];
  if (!upgrade) {
    return { error: 'Unknown upgrade' };
  }

  // Validate upgrade goes in correct slot type
  if (upgrade.slotType !== slotKey) {
    return { error: `${upgrade.name} must be installed in ${upgrade.slotType}` };
  }

  // Validate age requirement
  if (upgrade.age > state.age) {
    return { error: `${upgrade.name} not available until Age ${upgrade.age}` };
  }

  // Validate player owns required technology
  if (!playerState.technologies.includes(upgrade.requiredTech)) {
    const tech = TECHNOLOGIES[upgrade.requiredTech];
    return { error: `Requires ${tech ? tech.name : upgrade.requiredTech} technology` };
  }

  // Install the upgrade
  playerState.blueprint[slotKey][slotIndex] = upgradeId;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Installed ${upgrade.name} in ${slotType} slot ${slotIndex + 1}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Remove upgrade from blueprint
function processRemoveUpgrade(state, playerId, data) {
  const { slotType, slotIndex } = data;
  const playerState = state.players[playerId];

  const slotKey = `${slotType}Slots`;
  if (!playerState.blueprint[slotKey]) {
    return { error: 'Invalid slot type' };
  }

  if (slotIndex < 0 || slotIndex >= playerState.blueprint[slotKey].length) {
    return { error: 'Invalid slot index' };
  }

  const currentUpgrade = playerState.blueprint[slotKey][slotIndex];
  if (!currentUpgrade) {
    return { error: 'Slot is already empty' };
  }

  const upgrade = UPGRADES[currentUpgrade];
  const upgradeName = upgrade ? upgrade.name : currentUpgrade;

  // Remove the upgrade
  playerState.blueprint[slotKey][slotIndex] = null;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Removed ${upgradeName} from ${slotType} slot ${slotIndex + 1}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Take a loan at The Bank
function processTakeLoan(state, playerId, data) {
  const playerState = state.players[playerId];

  // Limit maximum loans to 2
  const maxLoans = 2;
  const currentLoans = playerState.loans || 0;
  if (currentLoans >= maxLoans) {
    return { error: `Maximum ${maxLoans} loans allowed. Pay off existing debt first.` };
  }

  // Give the player £30
  const loanAmount = 30;
  playerState.cash += loanAmount;

  // Reduce income track by 3 (permanent penalty, minimum 0)
  const incomePenalty = 3;
  playerState.income = Math.max(0, playerState.income - incomePenalty);

  // Track loan count for reference
  playerState.loans = currentLoans + 1;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Took loan ${playerState.loans}/${maxLoans}: gained £${loanAmount}, income reduced by ${incomePenalty}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Collect income at end of round
function processCollectIncome(state, playerId, data) {
  // Income is now auto-collected when entering income phase
  // This action is kept for backwards compatibility but restricted to income phase
  if (state.phase !== 'income') {
    return { error: 'Can only collect income during the Income phase (income is auto-collected when the phase begins)' };
  }

  const playerState = state.players[playerId];

  // Collect cash from income track
  const incomeGained = playerState.income;
  playerState.cash += incomeGained;

  // Gain crew from income tracks
  const officersGained = playerState.officerIncome || 0;
  const engineersGained = playerState.engineerIncome || 1;

  playerState.officers += officersGained;
  playerState.engineers += engineersGained;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Collected income: £${incomeGained}, +${officersGained} Officer(s), +${engineersGained} Engineer(s)`,
    playerId,
    type: 'income'
  });

  return { newState: state };
}

// Play a card from hand
function processPlayCard(state, playerId, data) {
  const { cardIndex } = data;
  const playerState = state.players[playerId];

  if (cardIndex < 0 || cardIndex >= playerState.hand.length) {
    return { error: 'Invalid card index' };
  }

  const card = playerState.hand.splice(cardIndex, 1)[0];
  playerState.discardPile.push(card);

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Played ${card.name}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Draw cards
function processDrawCards(state, playerId, data) {
  const { count = 1 } = data;
  const playerState = state.players[playerId];

  for (let i = 0; i < count; i++) {
    if (playerState.deck.length === 0) {
      // Shuffle discard pile into deck
      if (playerState.discardPile.length === 0) break;
      playerState.deck = shuffleArray(playerState.discardPile);
      playerState.discardPile = [];
    }

    if (playerState.deck.length > 0) {
      playerState.hand.push(playerState.deck.pop());
    }
  }

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Drew ${count} card(s)`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Place an agent on a Ground Board location
function processPlaceAgent(state, playerId, data) {
  const { locationId, cardIndex } = data;
  const playerState = state.players[playerId];

  // Validate phase
  if (state.phase !== 'worker_placement') {
    return { error: 'Can only place agents during worker placement phase' };
  }

  // Validate it's this player's turn to place
  const currentPlacer = getCurrentPlacer(state);
  if (currentPlacer !== playerId) {
    return { error: 'Not your turn to place an agent' };
  }

  // Check if player has passed
  if (playerState.hasPassed) {
    return { error: 'You have already passed this round' };
  }

  // Check if player has agents available
  if (playerState.agentsRemaining <= 0) {
    return { error: 'No agents available' };
  }

  // Check if location is valid
  const location = GROUND_BOARD_LOCATIONS[locationId];
  if (!location) {
    return { error: 'Invalid location' };
  }

  // Check if location is already occupied (each location allows one agent)
  const existingPlacement = state.groundBoard.placements[locationId];
  if (existingPlacement) {
    return { error: 'Location already occupied this round' };
  }

  // Card is REQUIRED in rules-compliant mode
  if (cardIndex === undefined || cardIndex < 0) {
    return { error: 'Must play a card to place an agent' };
  }

  if (cardIndex >= playerState.hand.length) {
    return { error: 'Invalid card index' };
  }

  const card = playerState.hand[cardIndex];

  // Check if card symbol matches location
  if (!canPlaceAtLocation(card.symbol || 'any', locationId)) {
    return { error: `Card symbol (${card.symbol}) does not match location (${location.symbol})` };
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
    // If location action fails, we still placed the agent but log the issue
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
    // Auto-pass this player
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

// Pass action: Player chooses to stop placing agents this round
function processPass(state, playerId) {
  const playerState = state.players[playerId];

  // Validate phase
  if (state.phase !== 'worker_placement') {
    return { error: 'Can only pass during worker placement phase' };
  }

  // Validate it's this player's turn to place
  const currentPlacer = getCurrentPlacer(state);
  if (currentPlacer !== playerId) {
    return { error: 'Not your turn' };
  }

  // Check if already passed
  if (playerState.hasPassed) {
    return { error: 'Already passed this round' };
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

// Recall all agents (end of round)
function processRecallAgents(state, playerId, data) {
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

// Recruit crew at the Academy
function processRecruitCrew(state, playerId, data) {
  const { crewType, count = 1 } = data;
  const playerState = state.players[playerId];

  const costs = {
    officer: 2,
    engineer: 4
  };

  if (!costs[crewType]) {
    return { error: 'Invalid crew type. Use "officer" or "engineer".' };
  }

  const totalCost = costs[crewType] * count;

  if (playerState.cash < totalCost) {
    return { error: 'Not enough cash' };
  }

  playerState.cash -= totalCost;

  if (crewType === 'officer') {
    playerState.officers += count;
  } else {
    playerState.engineers += count;
  }

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Recruited ${count} ${crewType}(s) for £${totalCost}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Build a ship at the Construction Hall
function processBuildShip(state, playerId, data) {
  const { count = 1 } = data;
  const playerState = state.players[playerId];

  // Calculate hull cost from installed upgrades
  let hullCost = 2; // Base cost

  // Add Frame hull costs
  for (const upgradeId of playerState.blueprint.frameSlots || []) {
    if (upgradeId && UPGRADES[upgradeId]?.hullCost) {
      hullCost += UPGRADES[upgradeId].hullCost;
    }
  }

  // Add Fabric hull costs
  for (const upgradeId of playerState.blueprint.fabricSlots || []) {
    if (upgradeId && UPGRADES[upgradeId]?.hullCost) {
      hullCost += UPGRADES[upgradeId].hullCost;
    }
  }

  const totalCost = hullCost * count;

  if (playerState.cash < totalCost) {
    return { error: `Not enough cash (need £${totalCost})` };
  }

  if (count > 3) {
    return { error: 'Can only build up to 3 ships per action' };
  }

  playerState.cash -= totalCost;

  // Initialize ships array if needed
  if (!playerState.ships) {
    playerState.ships = [];
  }

  // Add ships to hangar
  for (let i = 0; i < count; i++) {
    playerState.ships.push({
      id: `ship_${Date.now()}_${i}`,
      status: 'hangar', // hangar, launched, damaged
      route: null
    });
  }

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Built ${count} ship(s) for £${totalCost} (£${hullCost}/ship)`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Upgrade Officer Income at Flight School
function processUpgradeOfficerIncome(state, playerId, data) {
  const playerState = state.players[playerId];
  const cost = 5;

  if (playerState.cash < cost) {
    return { error: 'Not enough cash' };
  }

  playerState.cash -= cost;
  playerState.officerIncome = (playerState.officerIncome || 0) + 1;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Upgraded Officer Income to ${playerState.officerIncome}/round for £${cost}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Upgrade Engineer Income at Technical Institute
function processUpgradeEngineerIncome(state, playerId, data) {
  const playerState = state.players[playerId];
  const cost = 6;

  if (playerState.cash < cost) {
    return { error: 'Not enough cash' };
  }

  playerState.cash -= cost;
  playerState.engineerIncome = (playerState.engineerIncome || 1) + 1;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Upgraded Engineer Income to ${playerState.engineerIncome}/round for £${cost}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Buy insurance at Insurance Bureau
function processBuyInsurance(state, playerId, data) {
  const playerState = state.players[playerId];

  // Track insurance policies
  const currentPolicies = playerState.insurance || 0;

  if (currentPolicies >= 3) {
    return { error: 'Maximum 3 insurance policies' };
  }

  // Cost is -1 Income (permanent)
  playerState.income = Math.max(0, playerState.income - 1);
  playerState.insurance = currentPolicies + 1;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Purchased insurance policy (${playerState.insurance}/3). Income reduced by 1.`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Acquire technology using research points
function processAcquireTechnologyResearch(state, playerId, data) {
  const { techId } = data;
  const playerState = state.players[playerId];

  const techIndex = state.rdBoard.findIndex(t => t.id === techId);
  if (techIndex === -1) {
    return { error: 'Technology not available on R&D Board' };
  }

  const tech = state.rdBoard[techIndex];

  // Check if player already has this technology
  if (playerState.technologies.includes(techId)) {
    return { error: 'Already own this technology' };
  }

  // Calculate cost with specialization discount
  const discount = calculateSpecializationDiscount(playerState.technologies, tech.type);
  const cost = Math.max(0, tech.cost - discount);

  // Calculate available research
  const availableResearch = (playerState.research || 0) + (playerState.engineers || 0);

  if (availableResearch < cost) {
    return { error: `Not enough research (have ${availableResearch}, need ${cost})` };
  }

  // Spend research (from saved first, then engineers provide the rest)
  const savedResearch = playerState.research || 0;
  if (savedResearch >= cost) {
    playerState.research = savedResearch - cost;
  } else {
    playerState.research = 0;
    // The rest comes from engineers (they're not spent, just used)
  }

  // Add technology
  playerState.technologies.push(techId);

  // Remove from R&D board
  state.rdBoard.splice(techIndex, 1);

  // Draw replacement from tech bag if available
  if (state.techBag && state.techBag.length > 0) {
    state.rdBoard.push(state.techBag.shift());
  }

  // Advance progress track
  state.progressTrack = (state.progressTrack || 0) + 1;

  // Check for age transition
  const thresholds = state.progressThresholds || { age2: 10, age3: 20, end: 30 };
  if (state.age === 1 && state.progressTrack >= thresholds.age2) {
    state.age = 2;
    addAgeTechnologies(state, 2);
    // Refill R&D board with new techs
    refillRDBoard(state);
    // Reset gas market prices for new age (Section 4.4: Helium resets to £2 at Age Transitions)
    state.gasMarket = { hydrogen: 1, helium: 2 };
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Age II begins! New technologies available. Gas market reset.`,
      type: 'system'
    });
  } else if (state.age === 2 && state.progressTrack >= thresholds.age3) {
    state.age = 3;
    addAgeTechnologies(state, 3);
    // Refill R&D board with new techs
    refillRDBoard(state);
    // Reset gas market prices for new age (Section 4.4: Helium resets to £2 at Age Transitions)
    state.gasMarket = { hydrogen: 1, helium: 2 };
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Age III begins! Final era technologies unlocked. Gas market reset.`,
      type: 'system'
    });
  }

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Acquired ${tech.name} for ${cost} research${discount > 0 ? ` (${discount} discount)` : ''}. Progress: ${state.progressTrack}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Gain research points (from Research Institute or card effects)
function processGainResearch(state, playerId, data) {
  const { amount = 1 } = data;
  const playerState = state.players[playerId];

  playerState.research = (playerState.research || 0) + amount;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Gained ${amount} research point(s). Total saved: ${playerState.research}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Launch a ship from hangar
function processLaunchShip(state, playerId, data) {
  const { shipId, routeId, gasType = 'hydrogen' } = data;
  const playerState = state.players[playerId];

  // Step 1: Choose a target route (Section 6.1 Launchpad - must select route first)
  if (!routeId) {
    return { error: 'Must specify a route to launch to (routeId required)' };
  }

  const route = state.map?.routes?.find(r => r.id === routeId);
  if (!route) {
    return { error: `Route not found: ${routeId}` };
  }
  if (route.claimed) {
    return { error: `Route ${route.from} → ${route.to} is already claimed` };
  }

  // Calculate ship stats to validate against route requirements
  const stats = calculateBlueprintStats(playerState.blueprint, state.age);

  // Validate Range meets route distance requirement
  if (stats.range < route.distance) {
    return { error: `Ship Range (${stats.range}) does not meet route distance requirement (${route.distance})` };
  }

  // Validate Speed meets route speed requirement (if any)
  const routeSpeed = route.speed || 1;
  if (stats.speed < routeSpeed) {
    return { error: `Ship Speed (${stats.speed}) does not meet route speed requirement (${routeSpeed})` };
  }

  // Step 2: Verify launch requirements
  // Validate gas type
  if (!['hydrogen', 'helium'].includes(gasType)) {
    return { error: 'Gas type must be hydrogen or helium' };
  }

  // Helium requires Helium Handling technology (Section 4.4)
  if (gasType === 'helium') {
    const hasHeliumHandling = playerState.technologies?.some(t => t.id === 'HELIUM_HANDLING');
    if (!hasHeliumHandling) {
      return { error: 'Cannot use Helium without Helium Handling technology' };
    }
  }

  // Validate structural slots are filled (Section 3.2, 7.2: All Frame and Fabric slots must be filled)
  const frameSlots = playerState.blueprint.frameSlots || [];
  const fabricSlots = playerState.blueprint.fabricSlots || [];

  const emptyFrameSlots = frameSlots.filter(s => s === null).length;
  const emptyFabricSlots = fabricSlots.filter(s => s === null).length;

  if (emptyFrameSlots > 0) {
    return { error: `Cannot launch: ${emptyFrameSlots} Frame slot(s) must be filled` };
  }
  if (emptyFabricSlots > 0) {
    return { error: `Cannot launch: ${emptyFabricSlots} Fabric slot(s) must be filled` };
  }

  // Step 3: Select a ship and validate resources
  const ships = playerState.ships || [];
  const shipIndex = ships.findIndex(s => s.id === shipId && s.status === 'hangar');

  if (shipIndex === -1) {
    return { error: 'Ship not found in hangar' };
  }

  // Calculate required officers (equal to Age number: 1/2/3)
  const requiredOfficers = state.age || 1;
  const availableOfficers = playerState.officers || 0;

  if (availableOfficers < requiredOfficers) {
    return { error: `Not enough Officers: need ${requiredOfficers} for Age ${state.age}, have ${availableOfficers}` };
  }

  // Calculate required gas cubes
  const requiredCubes = calculateRequiredGasCubes(playerState.blueprint);
  const availableCubes = playerState.gasCubes[gasType] || 0;

  if (availableCubes < requiredCubes) {
    return { error: `Not enough ${gasType}: need ${requiredCubes}, have ${availableCubes}` };
  }

  // Pay launch costs - deduct officers and gas
  playerState.officers -= requiredOfficers;
  playerState.gasCubes[gasType] -= requiredCubes;

  // Step 4: Hazard Check would go here (TODO: implement full hazard system)
  // For now, launches always succeed

  // Step 5: Success - place ship on route
  // Update ship status to on_route (not 'launched' - it goes directly to the route)
  ships[shipIndex].status = 'on_route';
  ships[shipIndex].stats = stats;
  ships[shipIndex].launchedAge = state.age;
  ships[shipIndex].gasType = gasType;
  ships[shipIndex].routeId = routeId;

  // Claim the route
  route.claimed = playerId;
  route.claimedBy = {
    playerId,
    shipId,
    turn: state.turn
  };

  // Increase income from the route
  playerState.income += route.income;

  // Build a stats summary for the log
  const statParts = [`Range ${stats.range}`, `Speed ${stats.speed}`];
  if (stats.ceiling > 0) statParts.push(`Ceiling ${stats.ceiling}`);
  if (stats.reliability > 0) statParts.push(`Reliability ${stats.reliability}`);
  if (stats.luxury > 0) statParts.push(`Luxury ${stats.luxury}`);

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Launched ship to ${route.from} → ${route.to} (${requiredOfficers} Officer${requiredOfficers > 1 ? 's' : ''}, ${requiredCubes} ${gasType}): ${statParts.join(', ')} → +${route.income} income`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Claim a route with a launched ship
function processClaimRoute(state, playerId, data) {
  const { shipId, routeId } = data;
  const playerState = state.players[playerId];

  // Find launched ship
  const ships = playerState.ships || [];
  const shipIndex = ships.findIndex(s => s.id === shipId && s.status === 'launched');

  if (shipIndex === -1) {
    return { error: 'No launched ship available' };
  }

  const ship = ships[shipIndex];

  // Find route
  const route = state.map?.routes?.find(r => r.id === routeId);
  if (!route) {
    return { error: 'Route not found' };
  }

  // Check if route already claimed
  if (route.claimed) {
    return { error: 'Route already claimed' };
  }

  // Check ship meets route requirements
  const shipStats = ship.stats || { range: 1, speed: 1 };
  if (shipStats.range < route.distance) {
    return { error: `Ship range (${shipStats.range}) < route distance (${route.distance})` };
  }
  if (route.speed && shipStats.speed < route.speed) {
    return { error: `Ship speed (${shipStats.speed}) < route requirement (${route.speed})` };
  }

  // Claim the route
  route.claimed = playerId;
  route.claimedBy = {
    playerId,
    shipId,
    turn: state.turn
  };

  // Update ship to on-route status
  ships[shipIndex].status = 'on_route';
  ships[shipIndex].routeId = routeId;

  // Add route income to player
  playerState.income += route.income;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Claimed route ${route.from} → ${route.to} for +${route.income} income`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Perform a hazard check for a ship on a route
function processHazardCheck(state, playerId, data) {
  const { shipId } = data;
  const playerState = state.players[playerId];

  // Find the ship
  const ships = playerState.ships || [];
  const shipIndex = ships.findIndex(s => s.id === shipId && s.status === 'on_route');

  if (shipIndex === -1) {
    return { error: 'No ship on route to check' };
  }

  const ship = ships[shipIndex];

  // Draw from hazard deck
  if (!playerState.hazardDeck || playerState.hazardDeck.length === 0) {
    return { error: 'No hazard cards remaining' };
  }

  const hazard = playerState.hazardDeck.shift();

  // Calculate safety rating
  // Base reliability from ship stats + crew bonus (1 per officer)
  // Helium ships get +1 safety (helium is non-flammable, unlike hydrogen)
  const shipStats = ship.stats || { reliability: 0 };
  const heliumBonus = ship.gasType === 'helium' ? 1 : 0;
  const safetyRating = (shipStats.reliability || 0) + (playerState.officers || 0) + heliumBonus;

  // Compare to hazard difficulty
  const success = safetyRating >= hazard.difficulty;

  // Store hazard check result
  const checkResult = {
    hazardType: hazard.type,
    difficulty: hazard.difficulty,
    safetyRating,
    success,
    timestamp: new Date().toISOString()
  };

  if (success) {
    // Ship survives
    const heliumNote = heliumBonus > 0 ? ' (helium +1)' : '';
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Hazard check PASSED: ${hazard.type} (${hazard.difficulty}) vs Safety ${safetyRating}${heliumNote}`,
      playerId,
      type: 'hazard'
    });
  } else {
    // Ship takes damage or crashes
    const crashSeverity = hazard.difficulty - safetyRating;

    if (crashSeverity >= 3 || hazard.type === 'critical') {
      // Ship destroyed
      ships[shipIndex].status = 'destroyed';

      // Remove income from the route
      const route = state.map?.routes?.find(r => r.id === ship.routeId);
      if (route) {
        playerState.income = Math.max(0, playerState.income - (route.income || 0));
        route.claimed = null;
        route.claimedBy = null;
      }

      // Insurance mitigation (Section 12.7: Discard policy to recover ship to Launch Hangar)
      const insurancePolicies = playerState.insurance || 0;
      if (insurancePolicies > 0) {
        // Discard one insurance policy to recover ship
        playerState.insurance = insurancePolicies - 1;
        // Recover ship to hangar instead of destroying it
        ships[shipIndex].status = 'hangar';
        ships[shipIndex].damaged = false;
        state.log.push({
          timestamp: new Date().toISOString(),
          message: `Insurance claim: ship recovered to Launch Hangar (${playerState.insurance} policies remaining)`,
          playerId,
          type: 'action'
        });
      }

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `DISASTER! ${hazard.type} (${hazard.difficulty}) vs Safety ${safetyRating}. Ship destroyed!`,
        playerId,
        type: 'hazard'
      });
    } else {
      // Ship damaged but survives
      ships[shipIndex].damaged = true;

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Hazard check FAILED: ${hazard.type} (${hazard.difficulty}) vs Safety ${safetyRating}. Ship damaged.`,
        playerId,
        type: 'hazard'
      });
    }
  }

  // Track the hazard check result on the player state
  if (!playerState.lastHazardCheck) {
    playerState.lastHazardCheck = {};
  }
  playerState.lastHazardCheck[shipId] = checkResult;

  return { newState: state };
}

// Calculate scores for all players
function processCalculateScores(state, playerId, data) {
  // Check if game end conditions are met
  const thresholds = state.progressThresholds || { age2: 10, age3: 20, end: 30 };
  const progressTrack = state.progressTrack || 0;
  const forceEnd = data?.forceEnd === true; // Allow admin/debug override

  // Game ends when progress track reaches the end threshold OR Age 3 is complete
  const gameCanEnd = progressTrack >= thresholds.end || state.age >= 3;

  if (!gameCanEnd && !forceEnd) {
    return {
      error: `Game cannot end yet. Progress: ${progressTrack}/${thresholds.end}, Age: ${state.age}/3. Need to reach progress ${thresholds.end} or complete Age 3.`
    };
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

    // VP from technologies
    let techVP = 0;
    for (const techId of playerState.technologies) {
      // Find tech VP value (default 0)
      const techInfo = state.rdBoard?.find(t => t.id === techId) ||
                       state.techBag?.find(t => t.id === techId) ||
                       { vp: 0 };
      techVP += techInfo.vp || 0;
    }
    // Also check TECHNOLOGY_BAG data
    // For now, approximate 1 VP per 2 techs
    techVP = Math.floor(playerState.technologies.length / 2);
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

// Buy a card from the market using Influence (Section 6.2, 8.3)
function processBuyMarketCard(state, playerId, data) {
  const { cardId } = data;
  const playerState = state.players[playerId];

  // Can only buy market cards during reveal phase
  if (state.phase !== 'reveal') {
    return { error: 'Can only buy market cards during reveal phase' };
  }

  // Find card in market
  const marketCards = state.marketCards || [];
  const cardIndex = marketCards.findIndex(c => c.id === cardId);

  if (cardIndex === -1) {
    return { error: 'Card not found in market' };
  }

  const card = marketCards[cardIndex];
  const cost = card.value || 3; // Default cost is 3 Influence

  // Market cards cost Influence, not cash (Section 8.3)
  const availableInfluence = playerState.influence || 0;
  if (availableInfluence < cost) {
    return { error: `Not enough Influence (need ${cost}, have ${availableInfluence})` };
  }

  // Spend Influence
  playerState.influence -= cost;

  // Card goes to discard pile (Section 8.3)
  playerState.discardPile.push(card);

  // Remove from market
  state.marketCards.splice(cardIndex, 1);

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Bought ${card.name} for ${cost} Influence`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

module.exports = {
  processAction,
  processEndTurn,
  processBuyGas,
  processAcquireTechnology,
  processInstallUpgrade,
  processRemoveUpgrade,
  processTakeLoan,
  processCollectIncome,
  processPlayCard,
  processDrawCards,
  processPlaceAgent,
  processPass,
  processRecallAgents,
  processRecruitCrew,
  processBuildShip,
  processUpgradeOfficerIncome,
  processUpgradeEngineerIncome,
  processBuyInsurance,
  processAcquireTechnologyResearch,
  processGainResearch,
  processLaunchShip,
  processClaimRoute,
  processHazardCheck,
  processCalculateScores,
  processBuyMarketCard,
  processDiscardHazard,
  processDiscardMarketCard
};
