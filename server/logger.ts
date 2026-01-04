/**
 * Centralized Pino Logger Configuration
 *
 * Uses pino-pretty for readable local development logs
 * Outputs JSON in production for Railway log aggregation
 *
 * Usage:
 *   import logger from './logger';
 *   logger.info('Server started');
 *   logger.error({ err }, 'Failed to process');
 *
 * Child loggers for context:
 *   const dbLogger = logger.child({ component: 'db' });
 *   dbLogger.info('Query executed');
 *
 * Environment variables:
 *   LOG_LEVEL - Set minimum log level (trace, debug, info, warn, error, fatal)
 *   NODE_ENV  - When 'production', outputs JSON; otherwise uses pino-pretty
 */

import pino = require('pino');

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

  // Use pino-pretty transport in development for readable output
  transport: isProduction ? undefined : {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

export default logger;

// CommonJS compatibility for gradual migration
module.exports = logger;
