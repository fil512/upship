const express = require('express');
const request = require('supertest');

// Mock userService before requiring the router
jest.mock('../../server/services/userService', () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  getUserById: jest.fn()
}));

const userService = require('../../server/services/userService');
const authRouter = require('../../server/routes/auth');

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    // Mock session middleware
    app.use((req, res, next) => {
      req.session = {
        userId: null,
        destroy: jest.fn((cb) => cb && cb())
      };
      next();
    });

    app.use('/api/auth', authRouter);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      userService.registerUser.mockResolvedValue({
        id: 1,
        username: 'newuser',
        display_name: 'newuser'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'newuser', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe('newuser');
      expect(userService.registerUser).toHaveBeenCalledWith('newuser', 'password123');
    });

    it('should return 400 if username missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Username and password required');
    });

    it('should return 400 if password missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Username and password required');
    });

    it('should return 400 if username too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'ab', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Username must be 3-50 characters');
    });

    it('should return 400 if username too long', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'a'.repeat(51), password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Username must be 3-50 characters');
    });

    it('should return 400 if password too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: '12345' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Password must be at least 6 characters');
    });

    it('should return 409 for duplicate username', async () => {
      const error = new Error('duplicate');
      error.code = '23505';
      userService.registerUser.mockRejectedValue(error);

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'existinguser', password: 'password123' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Username already taken');
    });

    it('should return 500 for other errors', async () => {
      userService.registerUser.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password123' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Registration failed');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully', async () => {
      userService.loginUser.mockResolvedValue({
        id: 1,
        username: 'testuser',
        displayName: 'Test User'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe('testuser');
    });

    it('should return 400 if username missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Username and password required');
    });

    it('should return 400 if password missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Username and password required');
    });

    it('should return 401 for invalid credentials', async () => {
      userService.loginUser.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should return 500 for service errors', async () => {
      userService.loginUser.mockRejectedValue(new Error('Service error'));

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Login failed');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 500 if session destroy fails', async () => {
      app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.session = {
          destroy: jest.fn((cb) => cb(new Error('Destroy failed')))
        };
        next();
      });
      app.use('/api/auth', authRouter);

      const res = await request(app)
        .post('/api/auth/logout');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Logout failed');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return null user when not logged in', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(200);
      expect(res.body.user).toBeNull();
    });

    it('should return user when logged in', async () => {
      userService.getUserById.mockResolvedValue({
        id: 1,
        username: 'testuser',
        display_name: 'Test User'
      });

      app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.session = { userId: 1 };
        next();
      });
      app.use('/api/auth', authRouter);

      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe('testuser');
    });

    it('should return null user if user not found', async () => {
      userService.getUserById.mockResolvedValue(null);

      app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.session = { userId: 999 };
        next();
      });
      app.use('/api/auth', authRouter);

      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(200);
      expect(res.body.user).toBeNull();
    });

    it('should return 500 on service error', async () => {
      userService.getUserById.mockRejectedValue(new Error('Database error'));

      app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.session = { userId: 1 };
        next();
      });
      app.use('/api/auth', authRouter);

      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to get user');
    });
  });
});
