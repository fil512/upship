const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const gameStateService = require('../services/gameStateService');
const { pool } = require('../db');
const {
  UPGRADES,
  TECHNOLOGIES,
  getAvailableUpgrades,
  calculateShipStats,
  canLaunch
} = require('../data/upgrades');
const {
  GROUND_BOARD_LOCATIONS,
  SYMBOL_ICONS,
  canPlaceAtLocation
} = require('../data/groundBoard');

// All game state routes require authentication
router.use(requireAuth);

// Get game state
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;

    // Verify user is in this game
    const playerCheck = await pool.query(
      'SELECT * FROM game_players WHERE game_id = $1 AND user_id = $2',
      [gameId, req.session.userId]
    );

    if (playerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not a player in this game' });
    }

    const gameState = await gameStateService.getGameState(gameId);

    if (!gameState) {
      return res.status(404).json({ error: 'Game state not found' });
    }

    // Filter state to only show what this player should see
    const filteredState = filterStateForPlayer(gameState.state, req.session.userId);

    res.json({
      gameState: {
        ...gameState,
        state: filteredState
      }
    });
  } catch (error) {
    console.error('Get game state error:', error);
    res.status(500).json({ error: 'Failed to get game state' });
  }
});

// Get available upgrades for a player
router.get('/:gameId/upgrades', async (req, res) => {
  try {
    const { gameId } = req.params;

    // Verify user is in this game
    const playerCheck = await pool.query(
      'SELECT * FROM game_players WHERE game_id = $1 AND user_id = $2',
      [gameId, req.session.userId]
    );

    if (playerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not a player in this game' });
    }

    const gameState = await gameStateService.getGameState(gameId);

    if (!gameState) {
      return res.status(404).json({ error: 'Game state not found' });
    }

    const playerState = gameState.state.players[req.session.userId];
    if (!playerState) {
      return res.status(404).json({ error: 'Player state not found' });
    }

    // Get available upgrades based on owned technologies
    const available = getAvailableUpgrades(
      playerState.technologies,
      gameState.state.age
    );

    // Get all upgrade definitions for reference
    res.json({
      available,
      allUpgrades: UPGRADES,
      allTechnologies: TECHNOLOGIES
    });
  } catch (error) {
    console.error('Get upgrades error:', error);
    res.status(500).json({ error: 'Failed to get upgrades' });
  }
});

// Get Ground Board data
router.get('/:gameId/ground-board', async (req, res) => {
  try {
    const { gameId } = req.params;

    // Verify user is in this game
    const playerCheck = await pool.query(
      'SELECT * FROM game_players WHERE game_id = $1 AND user_id = $2',
      [gameId, req.session.userId]
    );

    if (playerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not a player in this game' });
    }

    const gameState = await gameStateService.getGameState(gameId);

    if (!gameState) {
      return res.status(404).json({ error: 'Game state not found' });
    }

    res.json({
      locations: GROUND_BOARD_LOCATIONS,
      symbols: SYMBOL_ICONS,
      placements: gameState.state.groundBoard?.placements || {}
    });
  } catch (error) {
    console.error('Get ground board error:', error);
    res.status(500).json({ error: 'Failed to get ground board' });
  }
});

// Get action history
router.get('/:gameId/actions', async (req, res) => {
  try {
    const { gameId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    // Verify user is in this game
    const playerCheck = await pool.query(
      'SELECT * FROM game_players WHERE game_id = $1 AND user_id = $2',
      [gameId, req.session.userId]
    );

    if (playerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not a player in this game' });
    }

    const actions = await gameStateService.getGameActions(gameId, limit);
    res.json({ actions });
  } catch (error) {
    console.error('Get game actions error:', error);
    res.status(500).json({ error: 'Failed to get game actions' });
  }
});

// Perform a game action
router.post('/:gameId/action', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { actionType, actionData } = req.body;

    if (!actionType) {
      return res.status(400).json({ error: 'Action type is required' });
    }

    // Get current game state
    const gameState = await gameStateService.getGameState(gameId);

    if (!gameState) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const state = gameState.state;

    // Verify it's this player's turn
    const currentPlayerId = state.playerOrder[state.currentPlayerIndex];
    if (currentPlayerId !== req.session.userId) {
      return res.status(403).json({ error: 'Not your turn' });
    }

    // Process the action
    const result = processAction(state, req.session.userId, actionType, actionData);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    // Save the new state
    const newState = await gameStateService.updateGameState(gameId, result.newState, {
      playerId: req.session.userId,
      type: actionType,
      data: actionData
    });

    res.json({
      success: true,
      gameState: {
        ...gameState,
        state: filterStateForPlayer(newState, req.session.userId)
      }
    });
  } catch (error) {
    console.error('Game action error:', error);
    res.status(500).json({ error: 'Failed to process action' });
  }
});

// Filter state to hide other players' private information
function filterStateForPlayer(state, playerId) {
  const filtered = { ...state };

  // For each player, hide their hand and deck from others
  if (filtered.players) {
    filtered.players = {};
    for (const [pid, playerState] of Object.entries(state.players)) {
      if (pid === playerId) {
        // Show full state for requesting player
        filtered.players[pid] = playerState;
      } else {
        // Hide private info for other players
        filtered.players[pid] = {
          ...playerState,
          hand: playerState.hand ? playerState.hand.length : 0, // Only show count
          deck: playerState.deck ? playerState.deck.length : 0,
          hazardDeck: playerState.hazardDeck ? playerState.hazardDeck.length : 0
        };
      }
    }
  }

  return filtered;
}

// Process game actions
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

    case 'RECALL_AGENTS':
      return processRecallAgents(newState, playerId, data);

    case 'RECRUIT_CREW':
      return processRecruitCrew(newState, playerId, data);

    case 'BUILD_SHIP':
      return processBuildShip(newState, playerId, data);

    case 'UPGRADE_PILOT_INCOME':
      return processUpgradePilotIncome(newState, playerId, data);

    case 'UPGRADE_ENGINEER_INCOME':
      return processUpgradeEngineerIncome(newState, playerId, data);

    case 'BUY_INSURANCE':
      return processBuyInsurance(newState, playerId, data);

    case 'ACQUIRE_TECHNOLOGY_RESEARCH':
      return processAcquireTechnologyResearch(newState, playerId, data);

    case 'GAIN_RESEARCH':
      return processGainResearch(newState, playerId, data);

    case 'LOAD_GAS':
      return processLoadGas(newState, playerId, data);

    case 'UNLOAD_GAS':
      return processUnloadGas(newState, playerId, data);

    case 'LAUNCH_SHIP':
      return processLaunchShip(newState, playerId, data);

    case 'CLAIM_ROUTE':
      return processClaimRoute(newState, playerId, data);

    case 'PERFORM_HAZARD_CHECK':
      return processHazardCheck(newState, playerId, data);

    case 'BUY_MARKET_CARD':
      return processBuyMarketCard(newState, playerId, data);

    case 'CALCULATE_SCORES':
      return processCalculateScores(newState, playerId, data);

    default:
      return { error: `Unknown action type: ${actionType}` };
  }
}

// End turn and move to next player
function processEndTurn(state, playerId) {
  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.playerOrder.length;

  // If we've gone around, advance phase or turn
  if (state.currentPlayerIndex === 0) {
    state.round++;

    // Simple phase progression for now
    const phases = ['planning', 'actions', 'launch', 'income', 'cleanup'];
    const currentPhaseIndex = phases.indexOf(state.phase);

    if (currentPhaseIndex === phases.length - 1) {
      // End of cleanup, start new turn
      state.turn++;
      state.round = 1;
      state.phase = 'planning';
    } else {
      state.phase = phases[currentPhaseIndex + 1];
    }
  }

  // Add log entry
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Player ended their turn`,
    playerId,
    type: 'turn'
  });

  return { newState: state };
}

// Buy gas cubes
function processBuyGas(state, playerId, data) {
  const { gasType, amount } = data;
  const playerState = state.players[playerId];

  if (!['hydrogen', 'helium'].includes(gasType)) {
    return { error: 'Invalid gas type' };
  }

  const price = state.gasMarket[gasType] * amount;

  if (playerState.cash < price) {
    return { error: 'Not enough cash' };
  }

  playerState.cash -= price;
  playerState.gasCubes[gasType] += amount;

  // Increase market price (unless USA buying helium)
  const isUSA = playerState.faction === 'usa';
  if (!(isUSA && gasType === 'helium')) {
    state.gasMarket[gasType] = Math.min(state.gasMarket[gasType] + 1, 10);
  }

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

  // Remove from R&D board (in full game, would draw replacement)
  state.rdBoard.splice(techIndex, 1);

  // Advance progress track
  state.progressTrack++;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Acquired ${tech.name} technology`,
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

  // Give the player £30
  const loanAmount = 30;
  playerState.cash += loanAmount;

  // Reduce income track by 3 (permanent penalty)
  const incomePenalty = 3;
  playerState.income = Math.max(0, playerState.income - incomePenalty);

  // Track loan count for reference
  playerState.loans = (playerState.loans || 0) + 1;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Took a loan: gained £${loanAmount}, income reduced by ${incomePenalty}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Collect income at end of round
function processCollectIncome(state, playerId, data) {
  const playerState = state.players[playerId];

  // Collect cash from income track
  const incomeGained = playerState.income;
  playerState.cash += incomeGained;

  // Gain crew from income tracks
  const pilotsGained = playerState.pilotIncome || 1;
  const engineersGained = playerState.engineerIncome || 1;

  playerState.pilots += pilotsGained;
  playerState.engineers += engineersGained;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Collected income: £${incomeGained}, +${pilotsGained} Pilot(s), +${engineersGained} Engineer(s)`,
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

// === GROUND BOARD ACTIONS ===

// Place an agent on a Ground Board location
function processPlaceAgent(state, playerId, data) {
  const { locationId, cardIndex } = data;
  const playerState = state.players[playerId];

  // Initialize ground board state if needed
  if (!state.groundBoard) {
    state.groundBoard = {
      placements: {} // locationId -> { playerId, cardUsed }
    };
  }

  // Check if player has agents available
  const placedAgents = Object.values(state.groundBoard.placements)
    .filter(p => p.playerId === playerId).length;

  if (placedAgents >= (playerState.agents || 3)) {
    return { error: 'No agents available' };
  }

  // Check if location is valid
  const location = GROUND_BOARD_LOCATIONS[locationId];
  if (!location) {
    return { error: 'Invalid location' };
  }

  // Check if location is already occupied (for exclusive spots)
  // Some locations allow multiple agents, but for simplicity we'll allow one per player
  const existingPlacement = state.groundBoard.placements[locationId];
  if (existingPlacement) {
    return { error: 'Location already occupied this round' };
  }

  // Validate card if provided
  let cardUsed = null;
  if (cardIndex !== undefined && cardIndex >= 0) {
    if (cardIndex >= playerState.hand.length) {
      return { error: 'Invalid card index' };
    }
    const card = playerState.hand[cardIndex];
    cardUsed = card;

    // Check if card symbol matches location
    if (!canPlaceAtLocation(card.symbol || 'any', locationId)) {
      return { error: `Card symbol (${card.symbol}) does not match location (${location.symbol})` };
    }

    // Discard the card
    playerState.discardPile.push(playerState.hand.splice(cardIndex, 1)[0]);
  }

  // Place the agent
  state.groundBoard.placements[locationId] = {
    playerId,
    cardUsed: cardUsed ? cardUsed.name : null
  };

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Placed agent at ${location.name}`,
    playerId,
    type: 'action'
  });

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
    pilot: 2,
    engineer: 4
  };

  if (!costs[crewType]) {
    return { error: 'Invalid crew type' };
  }

  const totalCost = costs[crewType] * count;

  if (playerState.cash < totalCost) {
    return { error: 'Not enough cash' };
  }

  playerState.cash -= totalCost;

  if (crewType === 'pilot') {
    playerState.pilots += count;
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

// Upgrade Pilot Income at Flight School
function processUpgradePilotIncome(state, playerId, data) {
  const playerState = state.players[playerId];
  const cost = 5;

  if (playerState.cash < cost) {
    return { error: 'Not enough cash' };
  }

  playerState.cash -= cost;
  playerState.pilotIncome = (playerState.pilotIncome || 1) + 1;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Upgraded Pilot Income to ${playerState.pilotIncome}/round for £${cost}`,
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

// Calculate specialization discount based on techs in same track
function calculateSpecializationDiscount(playerTechs, techType) {
  const techsInTrack = playerTechs.filter(t => {
    // Map tech IDs to types (rough approximation)
    const techTypeMap = {
      structure: ['rigid_frame', 'duralumin_girders', 'wooden_framework', 'wire_bracing', 'steel_framework', 'internal_keel', 'geodetic_structure', 'modular_construction'],
      fabric: ['dining_saloon', 'rubberized_cotton', 'doped_canvas', 'goldbeater_skin', 'fireproof_coating', 'aluminum_doping', 'composite_covering'],
      drive: ['maybach_engine', 'daimler_engine', 'improved_propeller', 'dual_engine_mount', 'diesel_powerplant', 'streamlined_nacelle', 'supercharged_engine'],
      component: ['passenger_gondola', 'observation_deck', 'cargo_systems', 'radio_equipment', 'sleeping_quarters', 'mail_systems', 'luxury_fittings', 'advanced_navigation', 'pressurization'],
      gas: ['helium_handling']
    };

    for (const [type, ids] of Object.entries(techTypeMap)) {
      if (ids.includes(t) && type === techType) return true;
    }
    return false;
  }).length;

  if (techsInTrack >= 5) return 2;
  if (techsInTrack >= 3) return 1;
  return 0;
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
  let transitionMessage = null;
  if (state.age === 1 && state.progressTrack >= thresholds.age2) {
    transitionMessage = 'Age II begins!';
    // Age transition would happen here
  } else if (state.age === 2 && state.progressTrack >= thresholds.age3) {
    transitionMessage = 'Age III begins!';
  }

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Acquired ${tech.name} for ${cost} research${discount > 0 ? ` (${discount} discount)` : ''}. Progress: ${state.progressTrack}`,
    playerId,
    type: 'action'
  });

  if (transitionMessage) {
    state.log.push({
      timestamp: new Date().toISOString(),
      message: transitionMessage,
      type: 'system'
    });
  }

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

// Load gas cubes onto blueprint gas sockets
function processLoadGas(state, playerId, data) {
  const { gasType, socketIndex } = data;
  const playerState = state.players[playerId];

  if (!['hydrogen', 'helium'].includes(gasType)) {
    return { error: 'Invalid gas type' };
  }

  // Check player has gas cubes
  if (playerState.gasCubes[gasType] <= 0) {
    return { error: `No ${gasType} cubes available` };
  }

  // Check socket is valid
  const gasSockets = playerState.blueprint.gasSockets || [];
  if (socketIndex < 0 || socketIndex >= gasSockets.length) {
    return { error: 'Invalid socket index' };
  }

  // Check socket is empty
  if (gasSockets[socketIndex]) {
    return { error: 'Socket already occupied' };
  }

  // Load the gas
  playerState.gasCubes[gasType]--;
  playerState.blueprint.gasSockets[socketIndex] = gasType;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Loaded ${gasType} into gas socket ${socketIndex + 1}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Unload gas cube from blueprint socket back to reserve
function processUnloadGas(state, playerId, data) {
  const { socketIndex } = data;
  const playerState = state.players[playerId];

  // Check socket is valid
  const gasSockets = playerState.blueprint.gasSockets || [];
  if (socketIndex < 0 || socketIndex >= gasSockets.length) {
    return { error: 'Invalid socket index' };
  }

  // Check socket has gas
  const gasType = gasSockets[socketIndex];
  if (!gasType) {
    return { error: 'Socket is already empty' };
  }

  // Unload the gas
  playerState.blueprint.gasSockets[socketIndex] = null;
  playerState.gasCubes[gasType]++;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Unloaded ${gasType} from gas socket ${socketIndex + 1}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

// Calculate ship stats from blueprint
function calculateBlueprintStats(blueprint, age = 1) {
  const AGE_BASELINES = {
    1: { speed: 1, range: 1, ceiling: 0, reliability: 0 },
    2: { speed: 2, range: 2, ceiling: 1, reliability: 1 },
    3: { speed: 3, range: 3, ceiling: 2, reliability: 2 }
  };

  const stats = { ...AGE_BASELINES[age] };

  // Add stats from upgrades
  const slots = ['frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots'];
  for (const slotKey of slots) {
    const slotArray = blueprint[slotKey] || [];
    for (const upgradeId of slotArray) {
      if (!upgradeId) continue;
      const upgrade = UPGRADES[upgradeId];
      if (upgrade?.stats) {
        for (const [stat, value] of Object.entries(upgrade.stats)) {
          stats[stat] = (stats[stat] || 0) + value;
        }
      }
    }
  }

  return stats;
}

// Calculate weight from blueprint
function calculateBlueprintWeight(blueprint) {
  let weight = 0;
  const slots = ['frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots'];
  for (const slotKey of slots) {
    const slotArray = blueprint[slotKey] || [];
    for (const upgradeId of slotArray) {
      if (!upgradeId) continue;
      const upgrade = UPGRADES[upgradeId];
      if (upgrade?.weight) {
        weight += Math.abs(upgrade.weight);
      }
    }
  }
  return weight;
}

// Calculate lift from loaded gas cubes
function calculateBlueprintLift(blueprint) {
  let lift = 0;
  const gasSockets = blueprint.gasSockets || [];
  for (const cube of gasSockets) {
    if (cube === 'hydrogen' || cube === 'helium') {
      lift += 5;
    }
  }
  return lift;
}

// Launch a ship from hangar
function processLaunchShip(state, playerId, data) {
  const { shipId } = data;
  const playerState = state.players[playerId];

  // Find ship in hangar
  const ships = playerState.ships || [];
  const shipIndex = ships.findIndex(s => s.id === shipId && s.status === 'hangar');

  if (shipIndex === -1) {
    return { error: 'Ship not found in hangar' };
  }

  // Check Lift >= Weight
  const lift = calculateBlueprintLift(playerState.blueprint);
  const weight = calculateBlueprintWeight(playerState.blueprint);

  if (lift < weight) {
    return { error: `Cannot launch: Lift (${lift}) < Weight (${weight}). Load more gas cubes.` };
  }

  // Calculate ship stats for the launch
  const stats = calculateBlueprintStats(playerState.blueprint, state.age);

  // Update ship to launched status
  ships[shipIndex].status = 'launched';
  ships[shipIndex].stats = stats;
  ships[shipIndex].launchedAge = state.age;

  // Clear gas sockets (gas is used for launch)
  playerState.blueprint.gasSockets = playerState.blueprint.gasSockets.map(() => null);

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Launched ship with Range ${stats.range}, Speed ${stats.speed}`,
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
  const shipStats = ship.stats || { range: 1 };
  if (shipStats.range < route.distance) {
    return { error: `Ship range (${shipStats.range}) < route distance (${route.distance})` };
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
  // Base reliability from ship stats + crew bonus (1 per pilot)
  const shipStats = ship.stats || { reliability: 0 };
  const safetyRating = (shipStats.reliability || 0) + (playerState.pilots || 0);

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
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Hazard check PASSED: ${hazard.type} (${hazard.difficulty}) vs Safety ${safetyRating}`,
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

      // Insurance mitigation
      const insurancePolicies = playerState.insurance || 0;
      if (insurancePolicies > 0) {
        playerState.cash += 10 * insurancePolicies;
        state.log.push({
          timestamp: new Date().toISOString(),
          message: `Insurance payout: £${10 * insurancePolicies}`,
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

// Buy a card from the market
function processBuyMarketCard(state, playerId, data) {
  const { cardId } = data;
  const playerState = state.players[playerId];

  // Find card in market
  const marketCards = state.marketCards || [];
  const cardIndex = marketCards.findIndex(c => c.id === cardId);

  if (cardIndex === -1) {
    return { error: 'Card not found in market' };
  }

  const card = marketCards[cardIndex];
  const cost = card.value || 3; // Default cost is 3

  if (playerState.cash < cost) {
    return { error: `Not enough cash (need £${cost})` };
  }

  // Buy the card
  playerState.cash -= cost;
  playerState.discardPile.push(card);

  // Remove from market
  state.marketCards.splice(cardIndex, 1);

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Bought ${card.name} for £${cost}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

module.exports = router;
