require('dotenv').config();

const http = require('http');
const express = require('express');
const path = require('path');
const pinoHttp = require('pino-http');
const logger = require('./logger');
const db = require('./db');
const { runMigrations } = require('./db/migrate');
const { createSessionMiddleware } = require('./auth');
const { initializeSocket } = require('./socket');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const gameStateRoutes = require('./routes/gameState');
const manifestRoutes = require('./routes/manifest');
const adminRoutes = require('./routes/admin');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Create session middleware once to share with Socket.io
const sessionMiddleware = createSessionMiddleware();

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
app.use(sessionMiddleware);
app.use(express.static(path.join(__dirname, '..', 'public')));

// Initialize Socket.io with shared session
const io = initializeSocket(server, sessionMiddleware);

// Make io available to routes if needed (e.g., for broadcasting)
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/state', gameStateRoutes);
app.use('/api/manifest', manifestRoutes);
app.use('/api/admin', adminRoutes);

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

// Environment info endpoint (for dev-only features in frontend)
app.get('/api/env', (req, res) => {
  res.json({
    isDev: process.env.NODE_ENV !== 'production'
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

    server.listen(PORT, () => {
      logger.info({ port: PORT }, 'UP SHIP! server running');
      logger.info({ url: `http://localhost:${PORT}/health` }, 'Health check available');
      logger.info('Socket.io enabled for real-time updates');
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

module.exports = { app, server, io };
