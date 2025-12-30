/**
 * Centralized Error Handler Middleware
 * Handles all errors and returns appropriate HTTP responses
 */

const logger = require('../logger');
const {
  isAppError,
  isPostgresError,
  fromPostgresError
} = require('../errors');

/**
 * Express error handling middleware
 * Must be registered after all routes: app.use(errorHandler)
 *
 * Handles:
 * - Custom AppError instances (returns appropriate status code)
 * - PostgreSQL errors (converts to appropriate response)
 * - Unknown errors (returns 500 without leaking details)
 */
function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Log error with request context
  // Use req.log if available (from pino-http), otherwise fall back to main logger
  const log = req.log || logger;
  const logContext = {
    method: req.method,
    path: req.path,
    userId: req.session?.userId || 'anonymous',
    err // Pino serializes error objects automatically
  };

  // Log at appropriate level based on error type
  if (err.statusCode >= 500 || !isAppError(err)) {
    log.error(logContext, err.message);
  } else if (process.env.NODE_ENV !== 'production') {
    log.warn(logContext, err.message);
  }

  // Handle custom application errors
  if (isAppError(err)) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle PostgreSQL errors
  if (isPostgresError(err)) {
    const appError = fromPostgresError(err);
    return res.status(appError.statusCode).json(appError.toJSON());
  }

  // Handle validation errors from express-validator or similar
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON in request body',
      code: 'INVALID_JSON'
    });
  }

  // Unknown errors - don't leak internal details
  return res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
}

/**
 * 404 handler for unmatched routes
 * Register before error handler: app.use(notFoundHandler)
 */
function notFoundHandler(req, res, _next) {
  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND'
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
