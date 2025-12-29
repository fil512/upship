// Jest setup file - runs before all tests

// Mock console.error to reduce noise during tests (but still allow checking calls)
const originalConsoleError = console.error;
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Global test timeout
jest.setTimeout(10000);

// Helper to create mock pool
global.createMockPool = () => ({
  query: jest.fn(),
  connect: jest.fn(),
  on: jest.fn()
});

// Helper to create mock client (for transactions)
global.createMockClient = () => ({
  query: jest.fn(),
  release: jest.fn()
});

// Helper to create mock request
global.createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  session: {},
  ...overrides
});

// Helper to create mock response
global.createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis()
  };
  return res;
};
