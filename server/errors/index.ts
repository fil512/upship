/**
 * Custom Error Classes
 * Provides typed errors for better error handling and client responses
 */

/**
 * Base application error with HTTP status code and error code
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode = 400, code = 'UNKNOWN_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): { error: string; code: string } {
    return {
      error: this.message,
      code: this.code
    };
  }
}

/**
 * Resource not found (404)
 */
export class NotFoundError extends AppError {
  readonly resource: string;

  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.resource = resource;
  }
}

/**
 * Access denied (403)
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Invalid input (400)
 */
export class ValidationError extends AppError {
  readonly field: string | null;

  constructor(message: string, field: string | null = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

/**
 * Game rule violation (400)
 */
export class GameRuleError extends AppError {
  constructor(message: string) {
    super(message, 400, 'GAME_RULE_VIOLATION');
  }
}

/**
 * Not player's turn (403)
 */
export class NotYourTurnError extends ForbiddenError {
  constructor() {
    super('Not your turn');
    // Override the code from parent class
    Object.defineProperty(this, 'code', { value: 'NOT_YOUR_TURN', writable: false });
  }
}

/**
 * Not enough resources (400)
 */
export class InsufficientFundsError extends GameRuleError {
  readonly required: number;
  readonly available: number;
  readonly currency: string;

  constructor(required: number, available: number, currency = 'cash') {
    super(`Not enough ${currency}: need ${required}, have ${available}`);
    // Override the code from parent class
    Object.defineProperty(this, 'code', { value: 'INSUFFICIENT_FUNDS', writable: false });
    this.required = required;
    this.available = available;
    this.currency = currency;
  }
}

/**
 * Authentication required (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Resource already exists (409)
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Database operation failed (500)
 * Wraps internal database errors without leaking details
 */
export class DatabaseError extends AppError {
  readonly originalError: Error | null;

  constructor(originalError: Error | null = null) {
    super('Database operation failed', 500, 'DATABASE_ERROR');
    this.originalError = originalError;
    // Never expose the original error to clients
    // Note: toJSON() inherited from AppError already excludes originalError
  }
}

/**
 * Check if an error is an application error
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * PostgreSQL error type
 */
interface PostgresError extends Error {
  code: string;
}

/**
 * Check if an error is a PostgreSQL error
 */
export function isPostgresError(error: unknown): error is PostgresError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as PostgresError).code === 'string' &&
    /^\d{2}[A-Z\d]{3}$/.test((error as PostgresError).code)
  );
}

/**
 * Convert PostgreSQL error codes to appropriate AppError
 */
export function fromPostgresError(error: PostgresError | null): AppError {
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

// CommonJS compatibility for gradual migration
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
