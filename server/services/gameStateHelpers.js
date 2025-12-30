/**
 * Game State Helper Functions
 * Extracted from gameState.js routes for better separation of concerns
 */

const {
  UPGRADES
} = require('../data/upgrades');
const {
  GROUND_BOARD_LOCATIONS,
  canPlaceAtLocation
} = require('../data/groundBoard');
const {
  TECHNOLOGY_BAG
} = require('../config/constants');

// Helium market track: stepped progression (Section 4.4)
// £2 → £3 → £4 → £5 → £6 → £8 → £10 → £15
const HELIUM_PRICE_TRACK = [2, 3, 4, 5, 6, 8, 10, 15];

// TECHNOLOGY_BAG is imported from ../config/constants.js (single source of truth)
// See constants.js for the full 54-tile definition per Appendix C

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

// Calculate turn order for worker placement phase
// Rules: Lowest income goes first, ties broken by lowest cash, then original player order
// Ministry visitors from last round get priority (go first)
function calculateTurnOrder(state) {
  const players = Object.entries(state.players).map(([playerId, playerState]) => ({
    playerId,
    income: playerState.income,
    cash: playerState.cash,
    originalIndex: state.playerOrder.indexOf(playerId)
  }));

  // Get ministry visitors from last round (they go first)
  const ministryVisitors = state.workerPlacement?.ministryVisitors || [];

  // Sort non-ministry players by income (lowest first), then cash, then original order
  const nonMinistryPlayers = players.filter(p => !ministryVisitors.includes(p.playerId));
  nonMinistryPlayers.sort((a, b) => {
    // Lowest income first
    if (a.income !== b.income) return a.income - b.income;
    // Tiebreaker 1: Lowest cash first
    if (a.cash !== b.cash) return a.cash - b.cash;
    // Tiebreaker 2: Original player order
    return a.originalIndex - b.originalIndex;
  });

  // Ministry visitors go first (in the order they visited), then sorted players
  const ministryPlayersSorted = ministryVisitors.filter(pid =>
    players.some(p => p.playerId === pid)
  );

  return [...ministryPlayersSorted, ...nonMinistryPlayers.map(p => p.playerId)];
}

// Get the current player who should place an agent (during worker_placement phase)
function getCurrentPlacer(state) {
  if (state.phase !== 'worker_placement') {
    return null;
  }

  const order = state.workerPlacement?.placementOrder || state.playerOrder;
  const index = state.workerPlacement?.currentPlacerIndex || 0;

  // Skip passed players
  while (index < order.length) {
    const playerId = order[index];
    if (!state.workerPlacement?.passedPlayers?.includes(playerId)) {
      return playerId;
    }
    // This shouldn't happen during normal play since currentPlacerIndex
    // should always point to a non-passed player, but handle it gracefully
    break;
  }

  return null;
}

// Advance to the next player who hasn't passed in worker placement
function advanceToNextPlacer(state) {
  const order = state.workerPlacement.placementOrder;
  const passedPlayers = state.workerPlacement.passedPlayers;
  let index = state.workerPlacement.currentPlacerIndex;

  // Find next non-passed player
  for (let i = 0; i < order.length; i++) {
    index = (index + 1) % order.length;
    const playerId = order[index];
    if (!passedPlayers.includes(playerId)) {
      state.workerPlacement.currentPlacerIndex = index;
      return playerId;
    }
  }

  // All players have passed - this shouldn't happen as we check before calling
  return null;
}

// Check if all players have passed in worker placement
function allPlayersPassed(state) {
  const passedPlayers = state.workerPlacement?.passedPlayers || [];
  return state.playerOrder.every(pid => passedPlayers.includes(pid));
}

// Shuffle array helper (Math.random() is appropriate for game card shuffling)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // eslint-disable-line sonarjs/pseudo-random
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Refresh R&D Board with new technologies
function refreshRnDBoard(state) {
  // Fill empty slots on R&D board from tech bag
  const rnDBoard = state.rnDBoard || { available: [] };
  const targetSize = 6; // 6 technologies available

  while (rnDBoard.available.length < targetSize && state.techBag && state.techBag.length > 0) {
    rnDBoard.available.push(state.techBag.pop());
  }

  state.rnDBoard = rnDBoard;
}

// Refresh Market Row with new cards
function refreshMarketRow(state) {
  // Fill empty slots in market row from market deck
  const marketRow = state.marketRow || [];
  const targetSize = 4; // 4 cards in market row

  while (marketRow.length < targetSize && state.marketDeck && state.marketDeck.length > 0) {
    marketRow.push(state.marketDeck.pop());
  }

  state.marketRow = marketRow;
}

// Get current helium price step index
function getHeliumPriceIndex(price) {
  const idx = HELIUM_PRICE_TRACK.indexOf(price);
  return idx >= 0 ? idx : 0;
}

// Advance helium market by N steps
function advanceHeliumMarket(state, steps = 1) {
  const currentIdx = getHeliumPriceIndex(state.gasMarket.helium);
  const newIdx = Math.min(currentIdx + steps, HELIUM_PRICE_TRACK.length - 1);
  state.gasMarket.helium = HELIUM_PRICE_TRACK[newIdx];
}

// Reduce helium market by N steps
function reduceHeliumMarket(state, steps = 1) {
  const currentIdx = getHeliumPriceIndex(state.gasMarket.helium);
  const newIdx = Math.max(currentIdx - steps, 0);
  state.gasMarket.helium = HELIUM_PRICE_TRACK[newIdx];
}

// Check if player has any cards that match available locations
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

// Transition from worker placement to reveal phase
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

// Collect resources from revealed cards (Research, Influence, Gas)
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

// Transition from Reveal phase to Income & Cleanup phase
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

// Start a new round (called after Income & Cleanup)
function startNewRound(state) {
  state.turn++;
  state.round = 1;
  state.phase = 'worker_placement';

  // Check for Age transition (every 10 turns in a 4-player game)
  const turnsPerAge = 10;
  if (state.turn > turnsPerAge && state.age < 3) {
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
    playerState.agentsRemaining = 3;
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
    const cardsNeeded = 5 - (playerState.hand?.length || 0);

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

// Process card effects when used for agent placement (Section 8.1)
function processCardEffect(state, playerId, card, _locationId) {
  const playerState = state.players[playerId];
  const effect = card.effect;

  if (!effect || effect === 'None') {
    return { success: true };
  }

  switch (effect) {
    case '+1 swap':
      // Mechanic: grants +1 swap at Design Bureau
      // Track bonus swaps for this placement
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
      // Researcher: Research cost reduction
      // Track discount for this placement
      if (!playerState.researchDiscount) playerState.researchDiscount = 0;
      playerState.researchDiscount += 1;
      return { success: true, message: '-£1 Research cost this action' };

    case 'Gain £2':
      // Purser: Immediate cash gain
      playerState.cash += 2;
      return { success: true, message: 'Gained £2' };

    case '+1 ship stat':
      // Helmsman: Temporary ship stat bonus
      // This would apply to the next launch
      if (!playerState.launchBonuses) playerState.launchBonuses = {};
      playerState.launchBonuses.statBonus = (playerState.launchBonuses.statBonus || 0) + 1;
      return { success: true, message: '+1 ship stat for next launch' };

    default:
      // Log unknown effects for debugging
      return { success: true, message: `Unknown effect: ${effect}` };
  }
}

// Execute the action associated with a Ground Board location
// This is a dispatcher that calls the appropriate handler
function executeLocationAction(state, playerId, locationId, _card) {
  const playerState = state.players[playerId];

  switch (locationId) {
    case 'research_institute':
      // Buy Research tokens for £3 each (handled separately via GAIN_RESEARCH)
      return { success: true, message: 'May buy Research for £3 each' };

    case 'design_bureau':
      // Install upgrade to blueprint (handled via INSTALL_UPGRADE)
      return { success: true, message: 'May install upgrade to blueprint' };

    case 'construction_hall':
      // Build a ship (handled via BUILD_SHIP)
      return { success: true, message: 'May build a ship' };

    case 'launchpad':
      // Launch a ship (handled via LAUNCH_SHIP)
      return { success: true, message: 'May launch a ship' };

    case 'academy':
      // Recruit crew (handled via RECRUIT_CREW)
      // Also: May discard leftmost Market card (Section 6.3)
      return { success: true, message: 'May recruit crew. May also discard leftmost Market card.' };

    case 'flight_school':
      // Upgrade Officer income track (handled via UPGRADE_OFFICER_INCOME)
      return { success: true, message: 'May upgrade Officer income' };

    case 'technical_institute':
      // Upgrade Engineer income track (handled via UPGRADE_ENGINEER_INCOME)
      return { success: true, message: 'May upgrade Engineer income' };

    case 'the_bank':
      // Take a loan (handled via TAKE_LOAN)
      return { success: true, message: 'May take a loan' };

    case 'ministry': {
      // Ministry action (Section 6.3):
      // 1. Draw 2 cards, discard 1
      // 2. Gain turn priority for next round
      // 3. Reduce Helium Market Track by 1 step
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

      // Must discard 1 card - for now, auto-discard the last card drawn
      // (Player should choose via separate action, but auto-discard for simplicity)
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
      // Buy gas (handled via BUY_GAS)
      return { success: true, message: 'May buy gas' };

    case 'insurance_bureau':
      // Buy insurance (handled via BUY_INSURANCE)
      return { success: true, message: 'May buy insurance' };

    case 'weather_bureau': {
      // Peek at hazard deck for £2 (Section 6.3)
      const cost = 2;
      if (playerState.cash < cost) {
        return { success: false, message: 'Not enough cash for Weather Bureau (need £2)' };
      }

      playerState.cash -= cost;

      // Peek at top hazard card
      const hazardDeck = playerState.hazardDeck || [];
      if (hazardDeck.length > 0) {
        const topHazard = hazardDeck[0];
        // Store peeked card so player can decide to discard
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

// Add new age technologies to the tech bag
function addAgeTechnologies(state, age) {
  const newTechs = TECHNOLOGY_BAG[age] || [];
  if (newTechs.length > 0) {
    // Collect all technologies already owned by any player
    const ownedTechs = new Set();
    for (const pid of Object.keys(state.players || {})) {
      for (const tech of state.players[pid].technologies || []) {
        ownedTechs.add(tech);
      }
    }

    // Filter out already-owned technologies and add age marker
    const techsWithAge = newTechs
      .filter(t => !ownedTechs.has(t.id))
      .map(t => ({ ...t, age }));

    // Shuffle and add to tech bag
    state.techBag = state.techBag || [];
    state.techBag.push(...shuffleArray(techsWithAge));
  }
}

// Refill R&D board from tech bag (Section 4.1)
// Age I: 4 tiles, Age II: 5 tiles, Age III: 6 tiles
function refillRDBoard(state) {
  state.rdBoard = state.rdBoard || [];
  state.techBag = state.techBag || [];

  // R&D Board size scales by Age
  const rdBoardSize = {
    1: 4,
    2: 5,
    3: 6
  };
  const targetSize = rdBoardSize[state.age] || 4;

  while (state.rdBoard.length < targetSize && state.techBag.length > 0) {
    state.rdBoard.push(state.techBag.shift());
  }
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

// Calculate required gas cubes based on weight (Lift must >= Weight, each cube = +5 Lift)
function calculateRequiredGasCubes(blueprint) {
  const weight = calculateBlueprintWeight(blueprint);
  // Minimum 1 gas cube, otherwise ceil(weight / 5)
  return Math.max(1, Math.ceil(weight / 5));
}

module.exports = {
  // Constants
  HELIUM_PRICE_TRACK,
  TECHNOLOGY_BAG,

  // State filtering
  filterStateForPlayer,

  // Turn order
  calculateTurnOrder,
  getCurrentPlacer,
  advanceToNextPlacer,
  allPlayersPassed,

  // Utilities
  shuffleArray,

  // Board refresh
  refreshRnDBoard,
  refreshMarketRow,

  // Gas market
  getHeliumPriceIndex,
  advanceHeliumMarket,
  reduceHeliumMarket,

  // Worker placement helpers
  hasPlayableCards,

  // Phase transitions
  transitionToRevealPhase,
  collectRevealResources,
  transitionToIncomeCleanup,
  startNewRound,

  // Card and location effects
  processCardEffect,
  executeLocationAction,

  // Technology management
  addAgeTechnologies,
  refillRDBoard,
  calculateSpecializationDiscount,

  // Blueprint calculations
  calculateBlueprintStats,
  calculateBlueprintWeight,
  calculateRequiredGasCubes
};
