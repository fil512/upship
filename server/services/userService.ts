/**
 * User Service
 * Handles user registration, authentication, and lookup
 */

import { pool } from '../db';

// Use require for CommonJS auth module
 
const { hashPassword, verifyPassword } = require('../auth');

// User row from database
interface UserRow {
  id: string;
  username: string;
  password_hash: string | null;
  display_name: string;
  created_at?: Date;
  last_login?: Date;
}

// Public user info (no password)
interface UserInfo {
  id: string;
  username: string;
  displayName: string;
}

// User info with created_at
interface UserWithCreatedAt extends UserInfo {
  created_at: Date;
}

/**
 * Register a new user
 */
export async function registerUser(username: string, password: string): Promise<UserInfo> {
  const passwordHash = await hashPassword(password);

  const result = await pool.query<UserRow>(
    `INSERT INTO users (username, password_hash, display_name)
     VALUES ($1, $2, $1)
     RETURNING id, username, display_name`,
    [username, passwordHash]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name
  };
}

/**
 * Login with username/password
 * Returns user info if credentials are valid, null otherwise
 */
export async function loginUser(username: string, password: string): Promise<UserInfo | null> {
  const result = await pool.query<UserRow>(
    `SELECT id, username, password_hash, display_name
     FROM users WHERE username = $1`,
    [username]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];

  if (!user.password_hash) {
    return null;
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return null;
  }

  // Update last login
  await pool.query(
    `UPDATE users SET last_login = NOW() WHERE id = $1`,
    [user.id]
  );

  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserWithCreatedAt | null> {
  const result = await pool.query<UserRow>(
    `SELECT id, username, display_name, created_at
     FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    created_at: row.created_at!
  };
}

// CommonJS compatibility
module.exports = {
  registerUser,
  loginUser,
  getUserById
};
