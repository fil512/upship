/**
 * Blueprint Actions
 * INSTALL_TECH_TILE, REMOVE_TECH_TILE, UPDATE_BLUEPRINT action processors
 * Implements Section 6.2 (Design Bureau) including Hull Upgrade Rule
 * Note: Swap limits have been removed - players can make unlimited modifications
 */

const { GameRuleError, InsufficientFundsError } = require('../errors');
const { TECH_TILES, TECH_CARDS } = require('../data/upgrades');

/**
 * Calculate hull cost for a tech tile
 * Only Frame and Fabric tech tiles contribute to hull cost per Section 7.1
 */
function getTechTileHullCost(tileId) {
  if (!tileId) return 0;
  const tile = TECH_TILES[tileId];
  return tile?.hullCost || 0;
}

/**
 * Calculate total hull cost for a blueprint
 */
function calculateHullCost(blueprint) {
  let cost = 2; // Base cost per Section 7.1

  // Add Frame hull costs
  for (const tileId of blueprint.frameSlots || []) {
    cost += getTechTileHullCost(tileId);
  }

  // Add Fabric hull costs
  for (const tileId of blueprint.fabricSlots || []) {
    cost += getTechTileHullCost(tileId);
  }

  return cost;
}

/**
 * Validate that blueprint has no empty frame or fabric slots.
 * Blueprints must always be complete after any modification.
 *
 * @param {Object} blueprint - Player's blueprint
 * @returns {Object} { valid: boolean, emptyFrameSlots: number, emptyFabricSlots: number }
 */
function validateBlueprintComplete(blueprint) {
  const frameSlots = blueprint.frameSlots || [];
  const fabricSlots = blueprint.fabricSlots || [];

  const emptyFrameSlots = frameSlots.filter(s => s === null || s === undefined).length;
  const emptyFabricSlots = fabricSlots.filter(s => s === null || s === undefined).length;

  return {
    valid: emptyFrameSlots === 0 && emptyFabricSlots === 0,
    emptyFrameSlots,
    emptyFabricSlots
  };
}

/**
 * Install tech tile on blueprint
 * Per Section 6.2:
 * - Hull Upgrade Rule: When upgrading Frame/Fabric, pay hull cost difference per ship in hangar
 *
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 * Direct API calls are rejected - must go through PLACE_AGENT with blueprint param.
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { slotType, slotIndex, tileId, _internal }
 * @returns {Object} { newState } or throws error
 */
function processInstallTechTile(state, playerId, data) {
  const { slotType, slotIndex, tileId, upgradeId, _internal = false } = data;
  // Support both tileId (new) and upgradeId (legacy) for backwards compatibility
  const targetId = tileId || upgradeId;
  const playerState = state.players[playerId];

  // Validate that this is called through PLACE_AGENT (Section 5.1)
  if (!_internal) {
    if (state.phase !== 'worker_placement') {
      throw new GameRuleError(
        'INSTALL_TECH_TILE not allowed: Actions execute immediately when placing an agent (Section 5.1). ' +
        'Place an agent at Design Bureau during worker placement phase to modify blueprint.'
      );
    }
    const placement = state.groundBoard?.placements?.design_bureau;
    if (!placement || placement.playerId !== playerId) {
      throw new GameRuleError(
        'INSTALL_TECH_TILE not allowed: You must place an agent at Design Bureau to modify blueprint. ' +
        'Use PLACE_AGENT with locationId "design_bureau" and blueprint parameter.'
      );
    }
  }

  const slotKey = `${slotType}Slots`;
  if (!playerState.blueprint[slotKey]) {
    throw new GameRuleError('Invalid slot type');
  }

  if (slotIndex < 0 || slotIndex >= playerState.blueprint[slotKey].length) {
    throw new GameRuleError('Invalid slot index');
  }

  // Check if slot is already occupied
  if (playerState.blueprint[slotKey][slotIndex]) {
    throw new GameRuleError('Slot already occupied. Remove current tech tile first.');
  }

  // Validate tech tile exists
  const tile = TECH_TILES[targetId];
  if (!tile) {
    throw new GameRuleError('Unknown tech tile');
  }

  // Validate tech tile goes in correct slot type
  if (tile.slotType !== slotKey) {
    throw new GameRuleError(`${tile.name} must be installed in ${tile.slotType}`);
  }

  // Validate age requirement
  if (tile.age > state.age) {
    throw new GameRuleError(`${tile.name} not available until Age ${tile.age}`);
  }

  // Validate player owns required tech card
  if (!playerState.techCards.includes(tile.requiredCard)) {
    const card = TECH_CARDS[tile.requiredCard];
    throw new GameRuleError(`Requires ${card ? card.name : tile.requiredCard} tech card`);
  }

  // GAP-080: Validate special prerequisites (e.g., requires_helium for Pressurized Lounge)
  if (tile.special === 'requires_helium') {
    // Check if helium_gas_cell is installed in any component slot
    const hasHeliumGasCell = playerState.blueprint.componentSlots?.some(
      comp => comp === 'helium_gas_cell' || comp?.id === 'helium_gas_cell'
    );
    if (!hasHeliumGasCell) {
      throw new GameRuleError(`${tile.name} requires a Helium Gas Cell to be installed first`);
    }
  }

  // GAP-032: Hull Upgrade Rule - charge hull cost difference for ships in hangar
  // Only applies to Frame and Fabric slots per Section 6.2
  const isStructuralSlot = slotKey === 'frameSlots' || slotKey === 'fabricSlots';
  const shipsInHangar = (playerState.ships || []).filter(s => s.status === 'hangar').length;

  if (isStructuralSlot && shipsInHangar > 0) {
    const oldHullCost = getTechTileHullCost(playerState.blueprint[slotKey][slotIndex]);
    const newHullCost = getTechTileHullCost(targetId);
    const hullCostIncrease = Math.max(0, newHullCost - oldHullCost);

    if (hullCostIncrease > 0) {
      const totalCharge = hullCostIncrease * shipsInHangar;

      if (playerState.cash < totalCharge) {
        throw new InsufficientFundsError(totalCharge, playerState.cash,
          `Hull Upgrade Rule: £${hullCostIncrease} per ship × ${shipsInHangar} ships in hangar`);
      }

      playerState.cash -= totalCharge;

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Hull Upgrade Rule: Paid £${totalCharge} (£${hullCostIncrease} × ${shipsInHangar} ships)`,
        playerId,
        type: 'action'
      });
    }
  }

  // Install the tech tile
  playerState.blueprint[slotKey][slotIndex] = targetId;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Installed ${tile.name} in ${slotType} slot ${slotIndex + 1}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

/**
 * Remove tech tile from blueprint
 *
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 * Direct API calls are rejected - must go through PLACE_AGENT with blueprint param.
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { slotType, slotIndex, _internal }
 * @returns {Object} { newState } or throws error
 */
function processRemoveTechTile(state, playerId, data) {
  const { slotType, slotIndex, _internal = false } = data;
  const playerState = state.players[playerId];

  // Validate that this is called through PLACE_AGENT (Section 5.1)
  if (!_internal) {
    if (state.phase !== 'worker_placement') {
      throw new GameRuleError(
        'REMOVE_TECH_TILE not allowed: Actions execute immediately when placing an agent (Section 5.1). ' +
        'Place an agent at Design Bureau during worker placement phase to modify blueprint.'
      );
    }
    const placement = state.groundBoard?.placements?.design_bureau;
    if (!placement || placement.playerId !== playerId) {
      throw new GameRuleError(
        'REMOVE_TECH_TILE not allowed: You must place an agent at Design Bureau to modify blueprint. ' +
        'Use PLACE_AGENT with locationId "design_bureau" and blueprint parameter.'
      );
    }
  }

  const slotKey = `${slotType}Slots`;
  if (!playerState.blueprint[slotKey]) {
    throw new GameRuleError('Invalid slot type');
  }

  if (slotIndex < 0 || slotIndex >= playerState.blueprint[slotKey].length) {
    throw new GameRuleError('Invalid slot index');
  }

  const currentTile = playerState.blueprint[slotKey][slotIndex];
  if (!currentTile) {
    throw new GameRuleError('Slot is already empty');
  }

  const tile = TECH_TILES[currentTile];
  const tileName = tile ? tile.name : currentTile;

  // Remove the tech tile
  playerState.blueprint[slotKey][slotIndex] = null;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Removed ${tileName} from ${slotType} slot ${slotIndex + 1}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

/**
 * Update player's blueprint to a new configuration (declarative approach)
 * No swap limits - players can make unlimited modifications in a single visit.
 *
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 * Direct API calls are rejected - must go through PLACE_AGENT with blueprint param.
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - { blueprint: { frameSlots, fabricSlots, driveSlots, componentSlots }, _internal }
 * @returns {Object} { newState } or throws error
 */
function processUpdateBlueprint(state, playerId, data) {
  const { blueprint: newBlueprint, _internal = false, skipHullRule = false } = data;
  const playerState = state.players[playerId];
  const oldBlueprint = playerState.blueprint;

  // Validate that this is called through PLACE_AGENT (Section 5.1)
  if (!_internal) {
    if (state.phase !== 'worker_placement') {
      throw new GameRuleError(
        'UPDATE_BLUEPRINT not allowed: Actions execute immediately when placing an agent (Section 5.1). ' +
        'Place an agent at Design Bureau during worker placement phase to modify blueprint.'
      );
    }
    const placement = state.groundBoard?.placements?.design_bureau;
    if (!placement || placement.playerId !== playerId) {
      throw new GameRuleError(
        'UPDATE_BLUEPRINT not allowed: You must place an agent at Design Bureau to modify blueprint. ' +
        'Use PLACE_AGENT with locationId "design_bureau" and blueprint parameter.'
      );
    }
  }

  if (!newBlueprint) {
    throw new GameRuleError('Blueprint configuration is required');
  }

  // Validate each slot type
  const slotTypes = ['frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots'];
  const changes = [];

  for (const slotKey of slotTypes) {
    const newSlots = newBlueprint[slotKey];
    if (!newSlots) continue; // Keep existing slots if not provided

    const oldSlots = oldBlueprint[slotKey] || [];

    // Ensure we don't change slot count
    if (newSlots.length !== oldSlots.length) {
      throw new GameRuleError(`Cannot change number of ${slotKey} (expected ${oldSlots.length}, got ${newSlots.length})`);
    }

    for (let i = 0; i < newSlots.length; i++) {
      const oldTileId = oldSlots[i];
      const newTileId = newSlots[i];

      // Skip if no change
      if (oldTileId === newTileId) continue;

      // If installing a new tech tile
      if (newTileId) {
        const tile = TECH_TILES[newTileId];
        if (!tile) {
          throw new GameRuleError(`Unknown tech tile: ${newTileId}`);
        }

        // Validate tech tile goes in correct slot type
        if (tile.slotType !== slotKey) {
          throw new GameRuleError(`${tile.name} must be installed in ${tile.slotType}, not ${slotKey}`);
        }

        // Validate age requirement
        // During age transition, use the NEW age for validation
        const effectiveAge = state.ageTransitionDesignBureau?.newAge || state.age;
        if (tile.age > effectiveAge) {
          throw new GameRuleError(`${tile.name} not available until Age ${tile.age}`);
        }

        // Validate player owns required tech card
        if (!playerState.techCards.includes(tile.requiredCard)) {
          const card = TECH_CARDS[tile.requiredCard];
          throw new GameRuleError(`Requires ${card ? card.name : tile.requiredCard} tech card`);
        }
      }

      changes.push({
        slotKey,
        slotIndex: i,
        oldTileId,
        newTileId
      });
    }
  }

  // Create merged blueprint (keeping unchanged slots)
  const mergedBlueprint = {
    ...oldBlueprint,
    frameSlots: newBlueprint.frameSlots || oldBlueprint.frameSlots,
    fabricSlots: newBlueprint.fabricSlots || oldBlueprint.fabricSlots,
    driveSlots: newBlueprint.driveSlots || oldBlueprint.driveSlots,
    componentSlots: newBlueprint.componentSlots || oldBlueprint.componentSlots
  };

  // Validate blueprint completeness
  const validation = validateBlueprintComplete(mergedBlueprint);
  if (!validation.valid) {
    const errors = [];
    if (validation.emptyFrameSlots > 0) {
      errors.push(`${validation.emptyFrameSlots} empty Frame slot(s)`);
    }
    if (validation.emptyFabricSlots > 0) {
      errors.push(`${validation.emptyFabricSlots} empty Fabric slot(s)`);
    }
    throw new GameRuleError(`Blueprint incomplete: ${errors.join(', ')}. All Frame and Fabric slots must be filled.`);
  }

  // Calculate Hull Upgrade Rule charges (unless skipped for age transitions)
  if (!skipHullRule) {
    const oldHullCost = calculateHullCost(oldBlueprint);
    const newHullCost = calculateHullCost(mergedBlueprint);
    const hullCostIncrease = Math.max(0, newHullCost - oldHullCost);
    const shipsInHangar = (playerState.ships || []).filter(s => s.status === 'hangar').length;

    if (hullCostIncrease > 0 && shipsInHangar > 0) {
      const totalCharge = hullCostIncrease * shipsInHangar;

      if (playerState.cash < totalCharge) {
        throw new InsufficientFundsError(totalCharge, playerState.cash,
          `Hull Upgrade Rule: £${hullCostIncrease} increase × ${shipsInHangar} ships in hangar`);
      }

      playerState.cash -= totalCharge;

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Hull Upgrade Rule: Paid £${totalCharge} (£${hullCostIncrease} × ${shipsInHangar} ships)`,
        playerId,
        type: 'action'
      });
    }
  }

  // Apply the new blueprint
  playerState.blueprint = mergedBlueprint;

  // Log changes
  for (const change of changes) {
    const oldTile = change.oldTileId ? TECH_TILES[change.oldTileId] : null;
    const newTile = change.newTileId ? TECH_TILES[change.newTileId] : null;
    const slotType = change.slotKey.replace('Slots', '');

    if (oldTile && newTile) {
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Replaced ${oldTile.name} with ${newTile.name} in ${slotType} slot ${change.slotIndex + 1}`,
        playerId,
        type: 'action'
      });
    } else if (newTile) {
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Installed ${newTile.name} in ${slotType} slot ${change.slotIndex + 1}`,
        playerId,
        type: 'action'
      });
    } else if (oldTile) {
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Removed ${oldTile.name} from ${slotType} slot ${change.slotIndex + 1}`,
        playerId,
        type: 'action'
      });
    }
  }

  return { newState: state };
}

/**
 * Process free Design Bureau action during age transition
 * Per Section 12.1 step 5: Each player gets a free Design Bureau action
 * No swap limits and no Hull Upgrade Rule charges during age transition.
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { blueprint: { frameSlots, fabricSlots, driveSlots, componentSlots } }
 * @returns {Object} { newState } or throws error
 */
function processAgeTransitionDesignBureau(state, playerId, data) {
  const { completeAgeTransition } = require('./helpers/ageTransition');

  // Verify we're in the correct phase
  if (state.phase !== 'age_transition_design_bureau') {
    throw new GameRuleError('Not in age transition Design Bureau phase');
  }

  const transitionState = state.ageTransitionDesignBureau;
  if (!transitionState) {
    throw new GameRuleError('Age transition state not found');
  }

  // Verify it's this player's turn
  const currentPlayerId = state.playerOrder[transitionState.currentPlayerIndex];
  if (playerId !== currentPlayerId) {
    throw new GameRuleError('Not your turn to upgrade blueprint');
  }

  // Already completed?
  if (transitionState.completedPlayers.includes(playerId)) {
    throw new GameRuleError('You have already completed your free Design Bureau action');
  }

  const playerState = state.players[playerId];

  // Handle both old swaps format and new blueprint format for backwards compatibility
  if (data.blueprint) {
    // New declarative blueprint format - process with skipHullRule
    processUpdateBlueprint(state, playerId, {
      blueprint: data.blueprint,
      _internal: true,
      skipHullRule: true
    });
  } else if (data.swaps && data.swaps.length > 0) {
    // Legacy swaps format - convert to blueprint format
    const oldBlueprint = playerState.blueprint;
    const newBlueprint = {
      frameSlots: [...(oldBlueprint.frameSlots || [])],
      fabricSlots: [...(oldBlueprint.fabricSlots || [])],
      driveSlots: [...(oldBlueprint.driveSlots || [])],
      componentSlots: [...(oldBlueprint.componentSlots || [])]
    };

    // Apply swaps to build new blueprint
    for (const swap of data.swaps) {
      const slotKey = `${swap.slotType}Slots`;
      if (!newBlueprint[slotKey]) continue;
      if (swap.slotIndex < 0 || swap.slotIndex >= newBlueprint[slotKey].length) continue;

      if (swap.action === 'install') {
        // Support both tileId (new) and upgradeId (legacy)
        newBlueprint[slotKey][swap.slotIndex] = swap.tileId || swap.upgradeId;
      } else if (swap.action === 'remove') {
        newBlueprint[slotKey][swap.slotIndex] = null;
      }
    }

    // Process the converted blueprint
    processUpdateBlueprint(state, playerId, {
      blueprint: newBlueprint,
      _internal: true,
      skipHullRule: true
    });
  }
  // If neither blueprint nor swaps, player is skipping their free action

  // Validate blueprint is complete (no empty frame/fabric slots)
  const validation = validateBlueprintComplete(playerState.blueprint);
  if (!validation.valid) {
    const errors = [];
    if (validation.emptyFrameSlots > 0) {
      errors.push(`${validation.emptyFrameSlots} empty Frame slot(s)`);
    }
    if (validation.emptyFabricSlots > 0) {
      errors.push(`${validation.emptyFabricSlots} empty Fabric slot(s)`);
    }
    throw new GameRuleError(`Blueprint incomplete: ${errors.join(', ')}. All Frame and Fabric slots must be filled.`);
  }

  // Mark player as complete
  transitionState.completedPlayers.push(playerId);

  // Advance to next player or complete transition
  transitionState.currentPlayerIndex++;

  if (transitionState.currentPlayerIndex >= state.playerOrder.length) {
    // All players done - complete the age transition
    completeAgeTransition(state);
  }

  return { newState: state };
}

module.exports = {
  processInstallTechTile,
  processRemoveTechTile,
  processUpdateBlueprint,
  processAgeTransitionDesignBureau,
  calculateHullCost,  // Exported for testing
  validateBlueprintComplete,  // Exported for use in worker.js
  // Legacy aliases for backwards compatibility during migration
  processInstallUpgrade: processInstallTechTile,
  processRemoveUpgrade: processRemoveTechTile
};
