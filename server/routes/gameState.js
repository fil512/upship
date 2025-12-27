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

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

module.exports = router;
