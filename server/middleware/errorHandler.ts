/**
 * Centralized Error Handler Middleware
 * Handles all errors and returns appropriate HTTP responses
 */

import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import type { Logger } from 'pino';

// Use require for CommonJS compatibility
 
const logger = require('../logger') as Logger;

import {
  isAppError,
  isPostgresError,
  fromPostgresError,
  AppError
} from '../errors';

// Extended error type for body-parser errors
interface ParseError extends Error {
  type?: string;
  statusCode?: number;
}

/**
 * Express error handling middleware
 * Must be registered after all routes: app.use(errorHandler)
 *
 * Handles:
 * - Custom AppError instances (returns appropriate status code)
 * - PostgreSQL errors (converts to appropriate response)
 * - Unknown errors (returns 500 without leaking details)
 */
export const errorHandler: ErrorRequestHandler = (
  err: ParseError | AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Type assertion for optional properties
  const reqWithLog = req as Request & { log?: Logger; session?: { userId?: string } };
  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    next(err);
    return;
  }

  // Log error with request context
  // Use req.log if available (from pino-http), otherwise fall back to main logger
  const log = reqWithLog.log || logger;
  const logContext = {
    method: req.method,
    path: req.path,
    userId: reqWithLog.session?.userId || 'anonymous',
    err // Pino serializes error objects automatically
  };

  // Log at appropriate level based on error type
  const statusCode = (err as AppError).statusCode;
  if (statusCode >= 500 || !isAppError(err)) {
    log.error(logContext, err.message);
  } else if (process.env.NODE_ENV !== 'production') {
    log.warn(logContext, err.message);
  }

  // Handle custom application errors
  if (isAppError(err)) {
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Handle PostgreSQL errors
  if (isPostgresError(err)) {
    const appError = fromPostgresError(err);
    res.status(appError.statusCode).json(appError.toJSON());
    return;
  }

  // Handle validation errors from express-validator or similar
  if ((err as ParseError).type === 'entity.parse.failed') {
    res.status(400).json({
      error: 'Invalid JSON in request body',
      code: 'INVALID_JSON'
    });
    return;
  }

  // Unknown errors - don't leak internal details
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
};

/**
 * 404 handler for unmatched routes
 * Register before error handler: app.use(notFoundHandler)
 */
export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND'
  });
}

// CommonJS compatibility
module.exports = {
  errorHandler,
  notFoundHandler
};
