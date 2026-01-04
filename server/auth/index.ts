import type { Request, Response, NextFunction, RequestHandler } from 'express';

const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcrypt');
const { pool } = require('../db');

const SALT_ROUNDS = 10;

// Extended request with session
interface AuthenticatedRequest extends Request {
  session: Request['session'] & {
    userId?: string;
    destroy: (callback: (err?: Error) => void) => void;
  };
}

// Session configuration
function createSessionMiddleware(): RequestHandler {
  return session({
    store: new pgSession({
      pool: pool,
      tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production'
      ? (() => { throw new Error('SESSION_SECRET environment variable is required in production'); })()
      : 'dev-secret-only'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const
    }
  });
}

// Password utilities
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Auth middleware - requires logged in user
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.session.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}

export {
  createSessionMiddleware,
  hashPassword,
  verifyPassword,
  requireAuth
};

export type { AuthenticatedRequest };

// CommonJS compatibility
module.exports = {
  createSessionMiddleware,
  hashPassword,
  verifyPassword,
  requireAuth
};
