/**
 * Custom Error Classes
 * Provides typed errors for better error handling and client responses
 */

/**
 * Base application error with HTTP status code and error code
 */
class AppError extends Error {
  constructor(message, statusCode = 400, code = 'UNKNOWN_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code
    };
  }
}

/**
 * Resource not found (404)
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.resource = resource;
  }
}

/**
 * Access denied (403)
 */
class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Invalid input (400)
 */
class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

/**
 * Game rule violation (400)
 */
class GameRuleError extends AppError {
  constructor(message) {
    super(message, 400, 'GAME_RULE_VIOLATION');
  }
}

/**
 * Not player's turn (403)
 */
class NotYourTurnError extends ForbiddenError {
  constructor() {
    super('Not your turn');
    this.code = 'NOT_YOUR_TURN';
  }
}

/**
 * Not enough resources (400)
 */
class InsufficientFundsError extends GameRuleError {
  constructor(required, available, currency = 'cash') {
    super(`Not enough ${currency}: need ${required}, have ${available}`);
    this.code = 'INSUFFICIENT_FUNDS';
    this.required = required;
    this.available = available;
    this.currency = currency;
  }
}

/**
 * Authentication required (401)
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Resource already exists (409)
 */
class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Database operation failed (500)
 * Wraps internal database errors without leaking details
 */
class DatabaseError extends AppError {
  constructor(originalError = null) {
    super('Database operation failed', 500, 'DATABASE_ERROR');
    this.originalError = originalError;
    // Never expose the original error to clients
  }

  toJSON() {
    // Don't include originalError in JSON serialization
    return {
      error: this.message,
      code: this.code
    };
  }
}

/**
 * Check if an error is an application error
 */
function isAppError(error) {
  return error instanceof AppError;
}

/**
 * Check if an error is a PostgreSQL error
 */
function isPostgresError(error) {
  return error && typeof error.code === 'string' && /^[0-9]{2}[A-Z0-9]{3}$/.test(error.code);
}

/**
 * Convert PostgreSQL error codes to appropriate AppError
 */
function fromPostgresError(error) {
  if (!error || !error.code) {
    return new DatabaseError(error);
  }

  switch (error.code) {
    case '23505': // unique_violation
      return new ConflictError('Resource already exists');
    case '23503': // foreign_key_violation
      return new ValidationError('Referenced resource not found');
    case '23502': // not_null_violation
      return new ValidationError('Required field is missing');
    case '22P02': // invalid_text_representation
      return new ValidationError('Invalid data format');
    default:
      return new DatabaseError(error);
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
  GameRuleError,
  NotYourTurnError,
  InsufficientFundsError,
  UnauthorizedError,
  ConflictError,
  DatabaseError,
  isAppError,
  isPostgresError,
  fromPostgresError
};
