# Testing Best Practices with Jest

## Mock Setup

### Mock Database at Top of File

Always mock before requiring the modules that use the database:

```javascript
// Mock the database FIRST
jest.mock('../../server/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
    on: jest.fn()
  }
}));

// Mock other dependencies
jest.mock('../../server/services/gameStateService', () => ({
  initializeGameState: jest.fn()
}));

// NOW require the modules
const { pool } = require('../../server/db');
const gameStateService = require('../../server/services/gameStateService');
const { createGame } = require('../../server/services/gameService');
```

### Reset Mocks Between Tests

```javascript
beforeEach(() => {
  jest.clearAllMocks();
});
```

## Testing Transaction Functions

### Setup Mock Client

```javascript
describe('GameService', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock client for transactions
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    pool.connect.mockResolvedValue(mockClient);
  });
});
```

### Test Successful Transaction

```javascript
it('should create a game and add host as first player', async () => {
  // Setup mock responses in order
  mockClient.query
    .mockResolvedValueOnce({})  // BEGIN
    .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test Game', host_id: 1 }] })  // INSERT game
    .mockResolvedValueOnce({})  // INSERT player
    .mockResolvedValueOnce({}); // COMMIT

  const result = await createGame(1, 'Test Game');

  // Verify transaction flow
  expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
  expect(mockClient.query).toHaveBeenCalledWith(
    expect.stringContaining('INSERT INTO games'),
    expect.arrayContaining(['Test Game', 1])
  );
  expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
  expect(mockClient.release).toHaveBeenCalled();
  expect(result).toEqual({ id: 1, name: 'Test Game', host_id: 1 });
});
```

### Test Transaction Rollback

```javascript
it('should rollback on error', async () => {
  mockClient.query
    .mockResolvedValueOnce({})  // BEGIN
    .mockRejectedValueOnce(new Error('Database error'));  // INSERT fails

  await expect(createGame(1, 'Test')).rejects.toThrow('Database error');

  expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  expect(mockClient.release).toHaveBeenCalled();
});
```

## Testing Query Functions

### Mock pool.query for Simple Queries

```javascript
describe('getGames', () => {
  it('should return games with default filters', async () => {
    pool.query.mockResolvedValue({
      rows: [{ id: 1, name: 'Game 1', players: [] }]
    });

    const result = await getGames();

    expect(pool.query).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('should filter by status', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    await getGames({ status: 'in_progress' });

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("g.status = $1"),
      ['in_progress']
    );
  });
});
```

### Test Null/Empty Results

```javascript
it('should return null for non-existent game', async () => {
  pool.query.mockResolvedValue({ rows: [] });

  const result = await getGameById(999);

  expect(result).toBeNull();
});

it('should return empty array if user has no games', async () => {
  pool.query.mockResolvedValue({ rows: [] });

  const result = await getUserGames(999);

  expect(result).toEqual([]);
});
```

## Testing Error Conditions

### Business Logic Errors

```javascript
it('should throw error if game not found', async () => {
  mockClient.query
    .mockResolvedValueOnce({})  // BEGIN
    .mockResolvedValueOnce({ rows: [] });  // SELECT returns empty

  await expect(joinGame(999, 1)).rejects.toThrow('Game not found');
  expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
});

it('should throw error if game is full', async () => {
  const fullGame = {
    id: 1,
    status: 'waiting',
    current_player_count: 4,
    max_players: 4
  };

  mockClient.query
    .mockResolvedValueOnce({})  // BEGIN
    .mockResolvedValueOnce({ rows: [fullGame] });  // SELECT game

  await expect(joinGame(1, 5)).rejects.toThrow('Game is full');
});

it('should throw error if not in game', async () => {
  pool.query.mockResolvedValue({ rows: [] });

  await expect(selectFaction(1, 99, 'germany')).rejects.toThrow('Not in this game');
});
```

## Testing Routes

### Mock Express Request/Response

```javascript
const request = require('supertest');
const app = require('../../server/index');

describe('Auth Routes', () => {
  it('should register a new user', async () => {
    pool.query.mockResolvedValue({ rows: [] });  // User doesn't exist
    pool.query.mockResolvedValue({
      rows: [{ id: 1, username: 'testuser' }]
    });  // Insert user

    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.user.username).toBe('testuser');
  });

  it('should return 401 for invalid login', async () => {
    pool.query.mockResolvedValue({ rows: [] });  // User not found

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'noone', password: 'wrong' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
  });
});
```

## Test Fixtures

### Create Reusable Test Data

```javascript
// __tests__/fixtures/testData.js
const testUsers = {
  host: { id: 1, username: 'testhost', password_hash: 'hash' },
  player: { id: 2, username: 'testplayer', password_hash: 'hash' }
};

const testGames = {
  waitingGame: {
    id: 1,
    name: 'Waiting Game',
    status: 'waiting',
    host_id: 1,
    current_player_count: 1,
    max_players: 4,
    min_players: 2
  },
  fullGame: {
    id: 2,
    name: 'Full Game',
    status: 'waiting',
    host_id: 1,
    current_player_count: 4,
    max_players: 4
  },
  inProgressGame: {
    id: 3,
    name: 'In Progress',
    status: 'in_progress',
    host_id: 1,
    current_player_count: 4
  }
};

module.exports = { testUsers, testGames };
```

### Use Fixtures in Tests

```javascript
const { testGames } = require('../fixtures/testData');

it('should throw error if game not waiting', async () => {
  mockClient.query
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({ rows: [testGames.inProgressGame] });

  await expect(joinGame(3, 1)).rejects.toThrow('Game is not accepting players');
});
```

## Test Coverage Goals

Target 80%+ coverage for services and routes:

```bash
npm run test:coverage
```

Focus testing on:
- Happy path (success cases)
- Error conditions
- Edge cases (null, empty, boundary values)
- Transaction rollback behavior
- Authentication/authorization
