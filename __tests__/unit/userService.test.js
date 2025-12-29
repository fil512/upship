// Mock the database
jest.mock('../../server/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
    on: jest.fn()
  }
}));

// Mock the auth module
jest.mock('../../server/auth', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn()
}));

const { pool } = require('../../server/db');
const { hashPassword, verifyPassword } = require('../../server/auth');
const { registerUser, loginUser, getUserById } = require('../../server/services/userService');
const { testUsers } = require('../fixtures/testData');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should create a new user with hashed password', async () => {
      hashPassword.mockResolvedValue('hashedpassword123');
      pool.query.mockResolvedValue({
        rows: [{
          id: 1,
          username: 'newuser',
          display_name: 'newuser'
        }]
      });

      const result = await registerUser('newuser', 'password123');

      expect(hashPassword).toHaveBeenCalledWith('password123');
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['newuser', 'hashedpassword123']
      );
      expect(result).toEqual({
        id: 1,
        username: 'newuser',
        display_name: 'newuser'
      });
    });

    it('should throw error on duplicate username', async () => {
      hashPassword.mockResolvedValue('hashedpassword');
      const error = new Error('duplicate key');
      error.code = '23505';
      pool.query.mockRejectedValue(error);

      await expect(registerUser('existinguser', 'password'))
        .rejects.toThrow('duplicate key');
    });

    it('should propagate database errors', async () => {
      hashPassword.mockResolvedValue('hashedpassword');
      pool.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(registerUser('user', 'pass'))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('loginUser', () => {
    it('should return user on successful login', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            username: 'testuser',
            password_hash: 'hashedpassword',
            display_name: 'Test User'
          }]
        })
        .mockResolvedValueOnce({ rows: [] }); // UPDATE last_login

      verifyPassword.mockResolvedValue(true);

      const result = await loginUser('testuser', 'correctpassword');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['testuser']
      );
      expect(verifyPassword).toHaveBeenCalledWith('correctpassword', 'hashedpassword');
      expect(result).toEqual({
        id: 1,
        username: 'testuser',
        displayName: 'Test User'
      });
    });

    it('should return null for non-existent user', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await loginUser('nonexistent', 'password');

      expect(result).toBeNull();
      expect(verifyPassword).not.toHaveBeenCalled();
    });

    it('should return null for wrong password', async () => {
      pool.query.mockResolvedValue({
        rows: [{
          id: 1,
          username: 'testuser',
          password_hash: 'hashedpassword',
          display_name: 'Test User'
        }]
      });
      verifyPassword.mockResolvedValue(false);

      const result = await loginUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null if user has no password hash', async () => {
      pool.query.mockResolvedValue({
        rows: [{
          id: 1,
          username: 'testuser',
          password_hash: null,
          display_name: 'Test User'
        }]
      });

      const result = await loginUser('testuser', 'anypassword');

      expect(result).toBeNull();
      expect(verifyPassword).not.toHaveBeenCalled();
    });

    it('should update last_login on successful login', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            username: 'testuser',
            password_hash: 'hashedpassword',
            display_name: 'Test User'
          }]
        })
        .mockResolvedValueOnce({ rows: [] });

      verifyPassword.mockResolvedValue(true);

      await loginUser('testuser', 'password');

      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(pool.query).toHaveBeenLastCalledWith(
        expect.stringContaining('UPDATE users SET last_login'),
        [1]
      );
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      pool.query.mockResolvedValue({
        rows: [{
          id: 1,
          username: 'testuser',
          display_name: 'Test User',
          created_at: new Date()
        }]
      });

      const result = await getUserById(1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
      expect(result.id).toBe(1);
      expect(result.username).toBe('testuser');
    });

    it('should return null when user not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await getUserById(999);

      expect(result).toBeNull();
    });

    it('should not return password hash', async () => {
      pool.query.mockResolvedValue({
        rows: [{
          id: 1,
          username: 'testuser',
          display_name: 'Test User',
          created_at: new Date()
        }]
      });

      const result = await getUserById(1);

      expect(result.password_hash).toBeUndefined();
    });

    it('should handle database errors', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(getUserById(1)).rejects.toThrow('Database error');
    });
  });
});
