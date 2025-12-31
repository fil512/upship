// Test fixtures for UP SHIP! tests

// User fixtures
const testUsers = {
  user1: {
    id: 1,
    username: 'testuser1',
    display_name: 'Test User 1',
    password: 'password123',
    password_hash: '$2b$10$hashedpassword1'
  },
  user2: {
    id: 2,
    username: 'testuser2',
    display_name: 'Test User 2',
    password: 'password456',
    password_hash: '$2b$10$hashedpassword2'
  },
  user3: {
    id: 3,
    username: 'testuser3',
    display_name: 'Test User 3',
    password: 'password789',
    password_hash: '$2b$10$hashedpassword3'
  },
  user4: {
    id: 4,
    username: 'testuser4',
    display_name: 'Test User 4',
    password: 'passwordabc',
    password_hash: '$2b$10$hashedpassword4'
  }
};

// Game fixtures
const testGames = {
  waitingGame: {
    id: 1,
    name: 'Test Game 1',
    host_id: 1,
    status: 'waiting',
    min_players: 2,
    max_players: 4,
    current_player_count: 1,
    settings: {}
  },
  fullGame: {
    id: 2,
    name: 'Full Game',
    host_id: 1,
    status: 'waiting',
    min_players: 2,
    max_players: 4,
    current_player_count: 4,
    settings: {}
  },
  inProgressGame: {
    id: 3,
    name: 'In Progress Game',
    host_id: 1,
    status: 'in_progress',
    min_players: 2,
    max_players: 4,
    current_player_count: 4,
    settings: {}
  }
};

// Game player fixtures
const testGamePlayers = {
  player1: {
    id: 1,
    game_id: 1,
    user_id: 1,
    faction: 'germany',
    player_order: 1
  },
  player2: {
    id: 2,
    game_id: 1,
    user_id: 2,
    faction: 'britain',
    player_order: 2
  },
  player3: {
    id: 3,
    game_id: 1,
    user_id: 3,
    faction: 'usa',
    player_order: 3
  },
  player4: {
    id: 4,
    game_id: 1,
    user_id: 4,
    faction: 'italy',
    player_order: 4
  }
};

// Valid factions
const validFactions = ['germany', 'britain', 'usa', 'italy'];

// Blueprint fixture for Age I
const testBlueprint = {
  age: 1,
  frameSlots: ['duralumin_frame'],
  fabricSlots: ['premium_envelope'],
  driveSlots: [null],
  componentSlots: [null],
  gasSockets: ['hydrogen', 'hydrogen']
};

// Empty blueprint
const emptyBlueprint = {
  age: 1,
  frameSlots: [null],
  fabricSlots: [null],
  driveSlots: [null],
  componentSlots: [null],
  gasSockets: []
};

// Player state fixture
const createTestPlayerState = (faction = 'germany') => ({
  faction,
  cash: 15,
  income: 5,
  officerIncome: 0,
  engineerIncome: 1,
  officers: 1,
  engineers: 2,
  gasCubes: faction === 'usa' ? { hydrogen: 0, helium: 2 } : { hydrogen: 2, helium: 0 },
  agents: 2,  // Per rules Section 2.1: Start with 2 agents, 3rd earned at Officer Income +3
  research: 0,
  researchLevel: 0,  // Per rules Section 4.6: Research Level Track starts at 0
  influence: 0,
  agentsRemaining: 2,  // Per rules Section 2.1
  hasPassed: false,
  technologies: getFactionStartingTech(faction),
  ships: [],
  routes: [],
  // Deep copy testBlueprint to avoid shared reference mutation
  blueprint: JSON.parse(JSON.stringify(testBlueprint)),
  hand: [],
  deck: [],
  discardPile: [],
  hazardDeck: [
    // Default hazard deck with clear weather cards for test compatibility
    { id: 'clear_weather_1', type: 'clear_weather', name: 'Clear Weather', autoPass: true },
    { id: 'clear_weather_2', type: 'clear_weather', name: 'Clear Weather', autoPass: true },
    { id: 'clear_weather_3', type: 'clear_weather', name: 'Clear Weather', autoPass: true }
  ],
  hazardDiscardPile: [],
  bonuses: {},
  heliumMonopoly: faction === 'usa',
  bannedTechnologies: faction === 'germany' ? ['helium_handling'] : []
});

function getFactionStartingTech(faction) {
  const configs = {
    germany: ['duralumin_girders', 'goldbeater_skin', 'blaugas_storage'],
    britain: ['wire_bracing', 'doped_canvas', 'imperial_mooring'],
    usa: ['duralumin_girders', 'gelatinized_latex', 'trapeze_system', 'helium_handling'],
    italy: ['internal_keel', 'rubberized_cotton', 'articulated_keel']
  };
  return configs[faction] || [];
}

// Full game state fixture
const createTestGameState = (playerIds = [1, 2, 3, 4]) => ({
  age: 1,
  turn: 1,
  round: 1,
  phase: 'worker_placement',
  currentPlayerIndex: 0,
  playerOrder: playerIds,
  playerCount: playerIds.length,
  firstPlayer: playerIds[0], // GAP-081: First Player token initialized to first player in turn order
  players: playerIds.reduce((acc, id, idx) => {
    const factions = ['germany', 'britain', 'usa', 'italy'];
    acc[id] = createTestPlayerState(factions[idx % 4]);
    return acc;
  }, {}),
  workerPlacement: {
    passedPlayers: [],
    ministryVisitors: [],
    placementOrder: playerIds,
    currentPlacerIndex: 0
  },
  revealPhase: {
    revealedHands: {},
    resourcesCollected: {},
    techAcquisitionsComplete: {},
    marketPurchasesComplete: {}
  },
  groundBoard: {
    placements: {}
  },
  rdBoard: [],
  techBag: [],
  marketCards: [],
  progressTrack: 0,
  progressThresholds: { age2: 4, age3: 8, end: 12 },
  gasMarket: { hydrogen: 1, helium: 2 },
  map: {
    name: 'Western Europe',
    routes: [
      { id: 'route_1', from: 'Frankfurt', to: 'Berlin', distance: 1, speed: 1, income: 2, claimed: null },
      { id: 'route_2', from: 'Frankfurt', to: 'Paris', distance: 2, speed: 1, income: 3, claimed: null }
    ],
    cities: {}
  },
  log: []
});

module.exports = {
  testUsers,
  testGames,
  testGamePlayers,
  validFactions,
  testBlueprint,
  emptyBlueprint,
  createTestPlayerState,
  createTestGameState,
  getFactionStartingTech
};
