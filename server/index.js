require('dotenv').config();

const express = require('express');
const path = require('path');
const pinoHttp = require('pino-http');
const logger = require('./logger');
const db = require('./db');
const { runMigrations } = require('./db/migrate');
const { createSessionMiddleware } = require('./auth');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const gameStateRoutes = require('./routes/gameState');
const manifestRoutes = require('./routes/manifest');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security: disable X-Powered-By header to avoid revealing framework info
app.disable('x-powered-by');

// Trust proxy for Railway (SSL terminated at load balancer)
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(pinoHttp({
  logger,
  // Customize logged request properties
  customProps: (req) => ({
    userId: req.session?.userId || 'anonymous'
  }),
  // Skip logging for health checks in production
  autoLogging: {
    ignore: (req) => req.url === '/health' && process.env.NODE_ENV === 'production'
  }
}));
app.use(createSessionMiddleware());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/state', gameStateRoutes);
app.use('/api/manifest', manifestRoutes);

// Health check endpoint for Railway (includes database status)
app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await db.healthCheck();

    const status = {
      status: dbHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbHealthy ? 'connected' : 'disconnected'
    };

    res.status(dbHealthy ? 200 : 503).json(status);
  } catch (error) {
    logger.error({ err: error }, 'Health check error');
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'error'
    });
  }
});

// API endpoint placeholder
app.get('/api/status', (req, res) => {
  res.json({
    game: 'UP SHIP!',
    version: '1.0.0',
    status: 'development',
    description: 'A strategy board game about airship conglomerates during the Golden Age of Airships (1900-1937)'
  });
});

// Serve the main page for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Run migrations then start server
async function start() {
  try {
    logger.info('Running database migrations...');
    await runMigrations();

    app.listen(PORT, () => {
      logger.info({ port: PORT }, 'UP SHIP! server running');
      logger.info({ url: `http://localhost:${PORT}/health` }, 'Health check available');
    });
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

// Only start if run directly (not imported for testing)
if (require.main === module) {
  start();
}

module.exports = app;
