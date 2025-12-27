# Phase 03: User Authentication and Sessions

## Overview

Implement user authentication supporting both guest users (quick play) and registered accounts. Uses session-based auth with cookies for simplicity and security.

## Prerequisites

- [x] Phase 01 complete (Express server deployed)
- [x] Phase 02 complete (Database with users table)

## Goals

- [ ] Install authentication dependencies (bcrypt, express-session, connect-pg-simple)
- [ ] Create session store backed by PostgreSQL
- [ ] Implement guest user creation (play immediately without signup)
- [ ] Implement user registration with username/password
- [ ] Implement login/logout endpoints
- [ ] Add session middleware to protect routes
- [ ] Create auth migration for sessions table
- [ ] Create basic frontend login/register UI
- [ ] Test authentication flow end-to-end

## Implementation Steps

### Step 1: Install Dependencies

```bash
npm install bcrypt express-session connect-pg-simple uuid
```

- `bcrypt`: Password hashing
- `express-session`: Session middleware
- `connect-pg-simple`: PostgreSQL session store
- `uuid`: Generate guest user IDs

### Step 2: Create Session Table Migration

Create `server/db/migrations/002_sessions.sql`:

```sql
-- Session table for express-session with connect-pg-simple
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  PRIMARY KEY ("sid")
);

CREATE INDEX "IDX_session_expire" ON "session" ("expire");
```

### Step 3: Create Auth Module

Create `server/auth/index.js` with:

- Session configuration
- Password hashing utilities
- Session middleware factory

```javascript
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
```

### Step 4: Create User Service

Create `server/services/userService.js`:

```javascript
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { hashPassword, verifyPassword } = require('../auth');

// Create a guest user (no password required)
async function createGuestUser() {
  const guestName = `Guest_${Math.random().toString(36).substring(2, 8)}`;

  const result = await pool.query(
    `INSERT INTO users (username, display_name, is_guest)
     VALUES ($1, $2, true)
     RETURNING id, username, display_name, is_guest`,
    [guestName, guestName]
  );

  return result.rows[0];
}

// Register a new user
async function registerUser(username, password, email = null) {
  const passwordHash = await hashPassword(password);

  const result = await pool.query(
    `INSERT INTO users (username, password_hash, email, display_name)
     VALUES ($1, $2, $3, $1)
     RETURNING id, username, display_name, email, is_guest`,
    [username, passwordHash, email]
  );

  return result.rows[0];
}

// Login with username/password
async function loginUser(username, password) {
  const result = await pool.query(
    `SELECT id, username, password_hash, display_name, is_guest
     FROM users WHERE username = $1`,
    [username]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];

  if (user.is_guest || !user.password_hash) {
    return null; // Guest users can't login with password
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
    display_name: user.display_name,
    is_guest: user.is_guest
  };
}

// Get user by ID
async function getUserById(userId) {
  const result = await pool.query(
    `SELECT id, username, display_name, email, is_guest, created_at
     FROM users WHERE id = $1`,
    [userId]
  );

  return result.rows[0] || null;
}

// Upgrade guest to registered user
async function upgradeGuestUser(userId, username, password, email = null) {
  const passwordHash = await hashPassword(password);

  const result = await pool.query(
    `UPDATE users
     SET username = $2, password_hash = $3, email = $4, is_guest = false
     WHERE id = $1 AND is_guest = true
     RETURNING id, username, display_name, email, is_guest`,
    [userId, username, passwordHash, email]
  );

  return result.rows[0] || null;
}

module.exports = {
  createGuestUser,
  registerUser,
  loginUser,
  getUserById,
  upgradeGuestUser
};
```

### Step 5: Create Auth Routes

Create `server/routes/auth.js`:

```javascript
const express = require('express');
const router = express.Router();
const userService = require('../services/userService');

// Play as guest - creates a new guest user
router.post('/guest', async (req, res) => {
  try {
    const user = await userService.createGuestUser();
    req.session.userId = user.id;
    res.json({ user });
  } catch (error) {
    console.error('Guest creation error:', error);
    res.status(500).json({ error: 'Failed to create guest user' });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({ error: 'Username must be 3-50 characters' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const user = await userService.registerUser(username, password, email);
    req.session.userId = user.id;
    res.json({ user });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Username already taken' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const user = await userService.loginUser(username, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    res.json({ user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// Get current user
router.get('/me', async (req, res) => {
  if (!req.session.userId) {
    return res.json({ user: null });
  }

  try {
    const user = await userService.getUserById(req.session.userId);
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Upgrade guest to registered user
router.post('/upgrade', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const { username, password, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const user = await userService.upgradeGuestUser(
      req.session.userId,
      username,
      password,
      email
    );

    if (!user) {
      return res.status(400).json({ error: 'User is not a guest or not found' });
    }

    res.json({ user });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Username already taken' });
    }
    console.error('Upgrade error:', error);
    res.status(500).json({ error: 'Upgrade failed' });
  }
});

module.exports = router;
```

### Step 6: Update Server Index

Modify `server/index.js` to add session middleware and auth routes:

```javascript
require('dotenv').config();

const express = require('express');
const path = require('path');
const db = require('./db');
const { createSessionMiddleware } = require('./auth');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(createSessionMiddleware());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api/auth', authRoutes);

// Health check (before static file catch-all)
app.get('/health', async (req, res) => {
  const dbHealthy = await db.healthCheck();
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbHealthy ? 'connected' : 'disconnected'
  });
});

// API status
app.get('/api/status', (req, res) => {
  res.json({
    game: 'UP SHIP!',
    version: '1.0.0',
    status: 'development'
  });
});

// SPA catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`UP SHIP! server running on port ${PORT}`);
});
```

### Step 7: Update .env.example

Add session secret to environment template:

```
DATABASE_URL=postgresql://user:password@localhost:5432/upship
SESSION_SECRET=your-secure-random-string-here
NODE_ENV=development
```

### Step 8: Create Frontend Auth UI

Update `public/index.html` with login/register forms and guest play option:

- Login form (username/password)
- Register form (username/password/email optional)
- "Play as Guest" button for quick start
- Display current user status
- Logout button when logged in

### Step 9: Add Frontend JavaScript

Create `public/js/auth.js` for handling auth interactions:

- Form submission handlers
- API calls to auth endpoints
- Session state management
- UI updates based on auth state

## Files to Create/Modify

- `server/db/migrations/002_sessions.sql` - Session table schema
- `server/auth/index.js` - Session middleware and password utilities
- `server/services/userService.js` - User CRUD operations
- `server/routes/auth.js` - Auth API endpoints
- `server/index.js` - Add session and auth routes
- `.env.example` - Add SESSION_SECRET
- `public/index.html` - Add auth UI elements
- `public/js/auth.js` - Frontend auth logic

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/guest` | Create guest user and login |
| POST | `/api/auth/register` | Register new account |
| POST | `/api/auth/login` | Login with credentials |
| POST | `/api/auth/logout` | End session |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/upgrade` | Upgrade guest to registered |

## Testing

1. **Guest Flow:**
   - Click "Play as Guest"
   - Verify user is created and logged in
   - Refresh page - session persists

2. **Registration Flow:**
   - Register with username/password
   - Verify can login with same credentials
   - Verify duplicate username is rejected

3. **Login/Logout:**
   - Login, verify session
   - Logout, verify session cleared
   - Verify protected routes require auth

4. **Guest Upgrade:**
   - Play as guest
   - Upgrade to registered account
   - Verify can login with new credentials

## Notes

- Using session cookies instead of JWT for simplicity
- Guest users get auto-generated usernames like "Guest_abc123"
- Sessions expire after 30 days of inactivity
- Production requires strong SESSION_SECRET
- HTTPS required in production for secure cookies
