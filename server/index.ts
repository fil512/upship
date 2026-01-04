import type { Request, Response, NextFunction } from 'express';
import type { Server as HttpServer } from 'http';
import type { Server as SocketIOServer } from 'socket.io';

require('dotenv').config();

const http = require('http');
const express = require('express');
const path = require('path');
const fs = require('fs');
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

// Extended request with session
interface RequestWithSession extends Request {
  session?: {
    userId?: string;
  };
}

// Check for SvelteKit build (production uses this, dev uses separate server)
const svelteKitBuildPath = path.join(__dirname, '..', 'web', 'build');
const hasSvelteKitBuild = fs.existsSync(path.join(svelteKitBuildPath, 'handler.js'));

const app = express();
const server: HttpServer = http.createServer(app);
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
  customProps: (req: RequestWithSession) => ({
    userId: req.session?.userId || 'anonymous'
  }),
  // Skip logging for health checks in production
  autoLogging: {
    ignore: (req: Request) => req.url === '/health' && process.env.NODE_ENV === 'production'
  }
}));
app.use(sessionMiddleware);

// Static files: SvelteKit build client assets in production
if (hasSvelteKitBuild) {
  app.use(express.static(path.join(svelteKitBuildPath, 'client')));
}

// Initialize Socket.io with shared session
const io: SocketIOServer = initializeSocket(server, sessionMiddleware);

// Make io available to routes if needed (e.g., for broadcasting)
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/state', gameStateRoutes);
app.use('/api/manifest', manifestRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint for Railway (includes database status)
app.get('/health', async (req: Request, res: Response) => {
  try {
    const dbHealthy: boolean = await db.healthCheck();

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
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    game: 'UP SHIP!',
    version: '1.0.0',
    status: 'development',
    description: 'A strategy board game about airship conglomerates during the Golden Age of Airships (1900-1937)'
  });
});

// Environment info endpoint (for dev-only features in frontend)
app.get('/api/env', (req: Request, res: Response) => {
  res.json({
    isDev: process.env.NODE_ENV !== 'production'
  });
});

// SvelteKit handler for all non-API routes (loaded dynamically in start())
type SvelteKitHandler = (req: Request, res: Response, next: NextFunction) => void;
let svelteKitHandler: SvelteKitHandler | null = null;

// Catch-all route: use SvelteKit handler if available
app.use((req: Request, res: Response, next: NextFunction) => {
  if (svelteKitHandler) {
    svelteKitHandler(req, res, next);
  } else {
    // No SvelteKit build - 404 for non-API routes
    next();
  }
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Run migrations then start server
async function start(): Promise<void> {
  try {
    logger.info('Running database migrations...');
    await runMigrations();

    // Load SvelteKit handler if build exists (ES module, requires dynamic import)
    if (hasSvelteKitBuild) {
      logger.info('Loading SvelteKit handler...');
      const handlerPath = path.join(svelteKitBuildPath, 'handler.js');
      const { handler } = await import(handlerPath);
      svelteKitHandler = handler;
      logger.info('SvelteKit handler loaded successfully');
    } else {
      logger.warn('No SvelteKit build found - frontend will not be served');
      logger.warn('Run "npm run build:web" to build the frontend');
    }

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

export { app, server, io };

// CommonJS compatibility
module.exports = { app, server, io };
