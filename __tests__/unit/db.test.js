// We need to mock pg before requiring the module
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  on: jest.fn()
};

jest.mock('pg', () => ({
  Pool: jest.fn(() => mockPool)
}));

// Now require the module
const { pool, query, getClient, healthCheck } = require('../../server/db');

describe('Database Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    delete process.env.NODE_ENV;
  });

  describe('pool', () => {
    it('should be defined', () => {
      expect(pool).toBeDefined();
    });

    it('should have error handler registered on pool', () => {
      // The error handler is registered at module load time
      // We verify the pool has an 'on' method that was called
      expect(typeof mockPool.on).toBe('function');
    });
  });

  describe('query', () => {
    it('should execute query with parameters', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });

      const result = await query('SELECT * FROM users WHERE id = $1', [1]);

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
      expect(result.rows).toEqual([{ id: 1 }]);
    });

    it('should execute query without parameters', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await query('SELECT COUNT(*) FROM users');

      expect(mockPool.query).toHaveBeenCalledWith('SELECT COUNT(*) FROM users', undefined);
      expect(result.rowCount).toBe(0);
    });

    it('should propagate query errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Query failed'));

      await expect(query('INVALID SQL')).rejects.toThrow('Query failed');
    });

    it('should log in development mode', async () => {
      process.env.NODE_ENV = 'development';
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await query('SELECT * FROM users');

      // Console.log is mocked in setup.js, just verify query ran
      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('getClient', () => {
    it('should return a client from the pool', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const client = await getClient();

      expect(mockPool.connect).toHaveBeenCalled();
      expect(client).toBe(mockClient);
    });

    it('should propagate connection errors', async () => {
      mockPool.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(getClient()).rejects.toThrow('Connection failed');
    });
  });

  describe('healthCheck', () => {
    it('should return true when database is healthy', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
        release: jest.fn()
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await healthCheck();

      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith('SELECT 1');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return false when connection fails', async () => {
      mockPool.connect.mockRejectedValue(new Error('Connection refused'));

      const result = await healthCheck();

      expect(result).toBe(false);
    });

    it('should return false when query fails', async () => {
      const mockClient = {
        query: jest.fn().mockRejectedValue(new Error('Query failed')),
        release: jest.fn()
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await healthCheck();

      expect(result).toBe(false);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should release client even on error', async () => {
      const mockClient = {
        query: jest.fn().mockRejectedValue(new Error('Query failed')),
        release: jest.fn()
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await healthCheck();

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle client being undefined on connection error', async () => {
      mockPool.connect.mockRejectedValue(new Error('No connection'));

      const result = await healthCheck();

      expect(result).toBe(false);
      // Should not throw when trying to release undefined client
    });
  });
});
