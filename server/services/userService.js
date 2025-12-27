const { pool } = require('../db');
const { hashPassword, verifyPassword } = require('../auth');

// Register a new user
async function registerUser(username, password) {
  const passwordHash = await hashPassword(password);

  const result = await pool.query(
    `INSERT INTO users (username, password_hash, display_name)
     VALUES ($1, $2, $1)
     RETURNING id, username, display_name`,
    [username, passwordHash]
  );

  return result.rows[0];
}

// Login with username/password
async function loginUser(username, password) {
  const result = await pool.query(
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

// Get user by ID
async function getUserById(userId) {
  const result = await pool.query(
    `SELECT id, username, display_name, created_at
     FROM users WHERE id = $1`,
    [userId]
  );

  return result.rows[0] || null;
}

module.exports = {
  registerUser,
  loginUser,
  getUserById
};
