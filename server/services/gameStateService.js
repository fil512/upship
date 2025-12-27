const { pool } = require('../db');

// Faction-specific starting configurations
const FACTION_CONFIG = {
  germany: {
    startingTechnologies: ['rigid_frame', 'duralumin_girders'],
    bonuses: { structure: 1 }
  },
  britain: {
    startingTechnologies: ['dining_saloon'],
    bonuses: { luxury: 1 }
  },
  usa: {
    startingTechnologies: ['helium_handling'],
    bonuses: { safety: 1 },
    heliumMonopoly: true
  },
  italy: {
    startingTechnologies: ['rapid_refit'],
    bonuses: { speed: 1 },
    upgradeSwaps: 4 // Instead of 2
  }
};

// Create initial player state
function createPlayerState(faction) {
  const config = FACTION_CONFIG[faction] || {};

  return {
    faction,
    cash: 15,
    income: 5,
    pilotIncome: 1,
    engineerIncome: 1,
    pilots: 1,
    engineers: 2,
    gasCubes: { hydrogen: 2, helium: 0 },
    agents: 3,
    technologies: config.startingTechnologies || [],
    ships: [],
    routes: [],
    blueprint: createInitialBlueprint(),
    hand: [],
    deck: createStarterDeck(),
    discardPile: [],
    hazardDeck: createHazardDeck(),
    bonuses: config.bonuses || {}
  };
}

// Create initial blueprint for Age I
function createInitialBlueprint() {
  return {
    age: 1,
    frameSlots: [null, null, null, null], // 4 frame slots
    fabricSlots: [null, null],            // 2 fabric slots
    driveSlots: [null, null],             // 2 drive slots
    componentSlots: [null, null, null],   // 3 component slots
    gasSockets: [null, null, null, null]  // Gas cubes on frame
  };
}

// Create starter deck of 10 cards
function createStarterDeck() {
  return [
    { id: 'starter_1', type: 'basic', name: 'Basic Operations' },
    { id: 'starter_2', type: 'basic', name: 'Basic Operations' },
    { id: 'starter_3', type: 'basic', name: 'Basic Operations' },
    { id: 'starter_4', type: 'basic', name: 'Basic Operations' },
    { id: 'starter_5', type: 'basic', name: 'Basic Operations' },
    { id: 'starter_6', type: 'worker', name: 'Skilled Worker' },
    { id: 'starter_7', type: 'worker', name: 'Skilled Worker' },
    { id: 'starter_8', type: 'research', name: 'Research Grant' },
    { id: 'starter_9', type: 'income', name: 'Trade Contract' },
    { id: 'starter_10', type: 'income', name: 'Trade Contract' }
  ];
}

// Create personal hazard deck of 20 cards
function createHazardDeck() {
  const hazards = [];
  // Add various hazard types
  for (let i = 0; i < 5; i++) {
    hazards.push({ id: `weather_${i}`, type: 'weather', difficulty: 2 + Math.floor(i / 2) });
  }
  for (let i = 0; i < 5; i++) {
    hazards.push({ id: `mechanical_${i}`, type: 'mechanical', difficulty: 3 + Math.floor(i / 2) });
  }
  for (let i = 0; i < 4; i++) {
    hazards.push({ id: `fire_${i}`, type: 'fire', difficulty: 4 + Math.floor(i / 2) });
  }
  for (let i = 0; i < 4; i++) {
    hazards.push({ id: `structural_${i}`, type: 'structural', difficulty: 3 + Math.floor(i / 2) });
  }
  for (let i = 0; i < 2; i++) {
    hazards.push({ id: `critical_${i}`, type: 'critical', difficulty: 6 });
  }
  return shuffleArray(hazards);
}

// Shuffle array helper
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Create initial R&D board with 4 technology tiles
function createRDBoard() {
  const ageITechs = [
    { id: 'rigid_frame', name: 'Rigid Frame', type: 'structure', cost: 3 },
    { id: 'duralumin_girders', name: 'Duralumin Girders', type: 'structure', cost: 4 },
    { id: 'goldbeater_skin', name: "Goldbeater's Skin", type: 'fabric', cost: 3 },
    { id: 'rubberized_cotton', name: 'Rubberized Cotton', type: 'fabric', cost: 2 },
    { id: 'maybach_engine', name: 'Maybach Engine', type: 'drive', cost: 4 },
    { id: 'blau_gas', name: 'Blau Gas System', type: 'fuel', cost: 3 },
    { id: 'passenger_gondola', name: 'Passenger Gondola', type: 'component', cost: 3 },
    { id: 'observation_deck', name: 'Observation Deck', type: 'component', cost: 4 }
  ];

  return shuffleArray(ageITechs).slice(0, 4);
}

// Create initial market cards
function createMarketCards() {
  const marketDeck = [
    { id: 'market_1', name: 'Government Contract', type: 'contract', value: 5 },
    { id: 'market_2', name: 'Wealthy Patron', type: 'patron', value: 3 },
    { id: 'market_3', name: 'Engineering Breakthrough', type: 'tech', value: 2 },
    { id: 'market_4', name: 'Trade Agreement', type: 'trade', value: 4 },
    { id: 'market_5', name: 'Military Commission', type: 'contract', value: 6 },
    { id: 'market_6', name: 'Tourist Boom', type: 'event', value: 3 },
    { id: 'market_7', name: 'Gas Surplus', type: 'resource', value: 2 },
    { id: 'market_8', name: 'Expert Pilot', type: 'crew', value: 4 }
  ];

  return shuffleArray(marketDeck).slice(0, 5);
}

// Create Age I map routes
function createAgeIMap() {
  return {
    name: 'Western Europe',
    routes: [
      { id: 'route_1', from: 'Frankfurt', to: 'Berlin', distance: 1, income: 2, claimed: null },
      { id: 'route_2', from: 'Frankfurt', to: 'Paris', distance: 2, income: 3, claimed: null },
      { id: 'route_3', from: 'Berlin', to: 'Copenhagen', distance: 2, income: 3, claimed: null },
      { id: 'route_4', from: 'Paris', to: 'London', distance: 2, income: 4, claimed: null },
      { id: 'route_5', from: 'London', to: 'Amsterdam', distance: 1, income: 2, claimed: null },
      { id: 'route_6', from: 'Amsterdam', to: 'Berlin', distance: 2, income: 3, claimed: null },
      { id: 'route_7', from: 'Paris', to: 'Rome', distance: 3, income: 5, claimed: null },
      { id: 'route_8', from: 'Rome', to: 'Vienna', distance: 2, income: 3, claimed: null }
    ],
    cities: {
      'Frankfurt': { type: 'major', homeBase: 'germany' },
      'Berlin': { type: 'major', homeBase: null },
      'Paris': { type: 'major', homeBase: null },
      'London': { type: 'major', homeBase: 'britain' },
      'Amsterdam': { type: 'minor', homeBase: null },
      'Copenhagen': { type: 'minor', homeBase: null },
      'Rome': { type: 'major', homeBase: 'italy' },
      'Vienna': { type: 'minor', homeBase: null }
    }
  };
}

// Initialize game state when game starts
async function initializeGameState(gameId, players) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Determine player order randomly
    const playerOrder = shuffleArray(players.map(p => p.user_id));

    // Create player states
    const playerStates = {};
    for (const player of players) {
      playerStates[player.user_id] = createPlayerState(player.faction);
      // Draw initial hand of 5 cards
      const state = playerStates[player.user_id];
      state.deck = shuffleArray(state.deck);
      state.hand = state.deck.splice(0, 5);
    }

    // Create initial game state
    const gameState = {
      age: 1,
      turn: 1,
      round: 1,
      phase: 'planning', // planning, actions, launch, income, cleanup
      currentPlayerIndex: 0,
      playerOrder,
      players: playerStates,
      rdBoard: createRDBoard(),
      marketCards: createMarketCards(),
      progressTrack: 0,
      gasMarket: { hydrogen: 2, helium: 5 }, // Prices per cube
      map: createAgeIMap(),
      log: [{
        timestamp: new Date().toISOString(),
        message: 'Game started',
        type: 'system'
      }]
    };

    // Insert into game_states table
    await client.query(
      `INSERT INTO game_states (game_id, current_player_id, phase, turn_number, age, state)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [gameId, playerOrder[0], 'planning', 1, 1, JSON.stringify(gameState)]
    );

    await client.query('COMMIT');
    return gameState;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Get current game state
async function getGameState(gameId) {
  const result = await pool.query(
    `SELECT * FROM game_states WHERE game_id = $1`,
    [gameId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    gameId: row.game_id,
    version: row.version,
    currentPlayerId: row.current_player_id,
    phase: row.phase,
    turnNumber: row.turn_number,
    age: row.age,
    state: row.state,
    updatedAt: row.updated_at
  };
}

// Update game state
async function updateGameState(gameId, newState, action = null) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get current version
    const current = await client.query(
      'SELECT version FROM game_states WHERE game_id = $1 FOR UPDATE',
      [gameId]
    );

    if (current.rows.length === 0) {
      throw new Error('Game state not found');
    }

    const newVersion = current.rows[0].version + 1;

    // Update state
    await client.query(
      `UPDATE game_states
       SET state = $1, version = $2,
           current_player_id = $3, phase = $4,
           turn_number = $5, age = $6,
           updated_at = NOW()
       WHERE game_id = $7`,
      [
        JSON.stringify(newState),
        newVersion,
        newState.playerOrder[newState.currentPlayerIndex],
        newState.phase,
        newState.turn,
        newState.age,
        gameId
      ]
    );

    // Record action if provided
    if (action) {
      await client.query(
        `INSERT INTO game_actions (game_id, player_id, action_type, action_data, state_version)
         VALUES ($1, $2, $3, $4, $5)`,
        [gameId, action.playerId, action.type, JSON.stringify(action.data), newVersion]
      );
    }

    await client.query('COMMIT');
    return { ...newState, version: newVersion };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Get action history for a game
async function getGameActions(gameId, limit = 50) {
  const result = await pool.query(
    `SELECT ga.*, u.username
     FROM game_actions ga
     JOIN users u ON ga.player_id = u.id
     WHERE ga.game_id = $1
     ORDER BY ga.created_at DESC
     LIMIT $2`,
    [gameId, limit]
  );

  return result.rows;
}

module.exports = {
  initializeGameState,
  getGameState,
  updateGameState,
  getGameActions,
  FACTION_CONFIG
};
