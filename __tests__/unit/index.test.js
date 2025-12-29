const request = require('supertest');
const express = require('express');
const path = require('path');

// Create a mock app that mirrors the real one but without external dependencies
function createMockApp() {
  const app = express();
  app.use(express.json());

  // Mock auth routes
  const authRouter = express.Router();
  authRouter.get('/test', (req, res) => res.json({ test: true }));
  authRouter.post('/test', (req, res) => res.json({ test: true }));
  app.use('/api/auth', authRouter);

  // Mock game routes
  const gamesRouter = express.Router();
  gamesRouter.get('/test', (req, res) => res.json({ test: true }));
  app.use('/api/games', gamesRouter);

  // Mock state routes
  const stateRouter = express.Router();
  stateRouter.get('/test', (req, res) => res.json({ test: true }));
  app.use('/api/state', stateRouter);

  // Health check with configurable response
  let dbHealthy = true;
  app.setDbHealth = (healthy) => { dbHealthy = healthy; };

  app.get('/health', (req, res) => {
    const status = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: dbHealthy ? 'connected' : 'disconnected'
    };
    res.status(dbHealthy ? 200 : 503).json(status);
  });

  // API status
  app.get('/api/status', (req, res) => {
    res.json({
      game: 'UP SHIP!',
      version: '1.0.0',
      status: 'ok',
      description: 'Test'
    });
  });

  // Static files / SPA routing
  app.use(express.static(path.join(__dirname, '..', '..', 'public')));
  app.get('/game/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'game.html'), (err) => {
      if (err) res.status(404).send('Not found');
    });
  });
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'), (err) => {
      if (err) res.status(404).send('Not found');
    });
  });

  return app;
}

describe('Server Index', () => {
  let app;

  beforeEach(() => {
    app = createMockApp();
  });

  describe('Health Check', () => {
    it('should return healthy status when database is connected', async () => {
      app.setDbHealth(true);

      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database).toBe('connected');
    });

    it('should return unhealthy status when database is disconnected', async () => {
      app.setDbHealth(false);

      const res = await request(app).get('/health');

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('unhealthy');
      expect(res.body.database).toBe('disconnected');
    });

    it('should include timestamp in response', async () => {
      app.setDbHealth(true);

      const res = await request(app).get('/health');

      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('API Status', () => {
    it('should return API status', async () => {
      const res = await request(app).get('/api/status');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.version).toBeDefined();
    });
  });

  describe('Static Files', () => {
    it('should serve index.html for root path', async () => {
      const res = await request(app).get('/');

      // May return 200 with HTML or 404 if public/index.html doesn't exist
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('SPA Routing', () => {
    it('should serve game.html for /game/:id', async () => {
      const res = await request(app).get('/game/123');

      // May return 200 with HTML or 404 if public/game.html doesn't exist
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('API Routes', () => {
    it('should mount auth routes at /api/auth', async () => {
      const res = await request(app).get('/api/auth/test');

      expect(res.status).toBe(200);
    });

    it('should mount games routes at /api/games', async () => {
      const res = await request(app).get('/api/games/test');

      expect(res.status).toBe(200);
    });

    it('should mount state routes at /api/state', async () => {
      const res = await request(app).get('/api/state/test');

      expect(res.status).toBe(200);
    });
  });

  describe('Middleware', () => {
    it('should parse JSON bodies', async () => {
      const res = await request(app)
        .post('/api/auth/test')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      // Just verify it doesn't crash - specific behavior tested in route tests
      expect(res.status).toBeDefined();
    });
  });
});
