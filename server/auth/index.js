const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcrypt');
const { pool } = require('../db');

const SALT_ROUNDS = 10;

// Session configuration
function createSessionMiddleware() {
  return session({
    store: new pgSession({
      pool: pool,
      tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  });
}

// Password utilities
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Auth middleware - requires logged in user
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

module.exports = {
  createSessionMiddleware,
  hashPassword,
  verifyPassword,
  requireAuth
};
