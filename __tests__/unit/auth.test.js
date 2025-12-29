// Mock bcrypt before importing the module
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

// Mock the database pool
jest.mock('../../server/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
    on: jest.fn()
  }
}));

// Mock express-session and connect-pg-simple
jest.mock('express-session', () => {
  const mockSession = jest.fn(() => (req, res, next) => next());
  return mockSession;
});

jest.mock('connect-pg-simple', () => {
  return () => class MockPgSession {};
});

const bcrypt = require('bcrypt');
const { hashPassword, verifyPassword, requireAuth } = require('../../server/auth');

describe('Auth Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should call bcrypt.hash with password and salt rounds', async () => {
      bcrypt.hash.mockResolvedValue('hashedpassword123');

      const result = await hashPassword('mypassword');

      expect(bcrypt.hash).toHaveBeenCalledWith('mypassword', 10);
      expect(result).toBe('hashedpassword123');
    });

    it('should throw error if bcrypt.hash fails', async () => {
      bcrypt.hash.mockRejectedValue(new Error('Hash failed'));

      await expect(hashPassword('mypassword')).rejects.toThrow('Hash failed');
    });

    it('should handle empty password', async () => {
      bcrypt.hash.mockResolvedValue('hashedempty');

      const result = await hashPassword('');

      expect(bcrypt.hash).toHaveBeenCalledWith('', 10);
      expect(result).toBe('hashedempty');
    });

    it('should handle special characters in password', async () => {
      bcrypt.hash.mockResolvedValue('hashedspecial');

      const result = await hashPassword('p@$$w0rd!#$%');

      expect(bcrypt.hash).toHaveBeenCalledWith('p@$$w0rd!#$%', 10);
      expect(result).toBe('hashedspecial');
    });
  });

  describe('verifyPassword', () => {
    it('should return true for matching password', async () => {
      bcrypt.compare.mockResolvedValue(true);

      const result = await verifyPassword('mypassword', 'hashedpassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('mypassword', 'hashedpassword');
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      bcrypt.compare.mockResolvedValue(false);

      const result = await verifyPassword('wrongpassword', 'hashedpassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
      expect(result).toBe(false);
    });

    it('should throw error if bcrypt.compare fails', async () => {
      bcrypt.compare.mockRejectedValue(new Error('Compare failed'));

      await expect(verifyPassword('password', 'hash')).rejects.toThrow('Compare failed');
    });

    it('should handle empty password comparison', async () => {
      bcrypt.compare.mockResolvedValue(false);

      const result = await verifyPassword('', 'hashedpassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('', 'hashedpassword');
      expect(result).toBe(false);
    });
  });

  describe('requireAuth middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = { session: {} };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      mockNext = jest.fn();
    });

    it('should call next() when user is authenticated', () => {
      mockReq.session.userId = 1;

      requireAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockReq.session.userId = undefined;

      requireAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when session is empty', () => {
      mockReq.session = {};

      requireAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    });

    it('should return 401 when userId is null', () => {
      mockReq.session.userId = null;

      requireAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when userId is 0', () => {
      mockReq.session.userId = 0;

      requireAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass for non-zero userId', () => {
      mockReq.session.userId = 42;

      requireAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
