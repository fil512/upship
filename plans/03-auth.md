# Phase 03: User Authentication with Username/Password

## Overview

Implement user authentication using simple username/password. Users register with a username and password, then log in with those credentials. No external services required.

## Prerequisites

- [x] Phase 01 complete (Express server deployed)
- [x] Phase 02 complete (Database with users table)

## Goals

- [ ] Install authentication dependencies (bcrypt, express-session, connect-pg-simple)
- [ ] Create session store backed by PostgreSQL
- [ ] Implement user registration with username/password
- [ ] Implement login/logout endpoints
- [ ] Add session middleware to protect routes
- [ ] Create auth migration for sessions table
- [ ] Create frontend login/register UI
- [ ] Test authentication flow end-to-end

## Implementation Steps

### Step 1: Install Dependencies

```bash
npm install bcrypt express-session connect-pg-simple
```

- `bcrypt`: Password hashing
- `express-session`: Session middleware
- `connect-pg-simple`: PostgreSQL session store

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

Create `server/auth/index.js`:

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
```

### Step 5: Create Auth Routes

Create `server/routes/auth.js`:

```javascript
const express = require('express');
const router = express.Router();
const userService = require('../services/userService');

// Register new user
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

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
    const user = await userService.registerUser(username, password);
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
    if (user) {
      res.json({
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name
        }
      });
    } else {
      res.json({ user: null });
    }
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router;
```

### Step 6: Update Server Index

Modify `server/index.js`:

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

// Health check
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

```
DATABASE_URL=postgresql://user:password@localhost:5432/upship
SESSION_SECRET=your-secure-random-string-here
NODE_ENV=development
```

### Step 8: Create Frontend Login UI

Update `public/index.html` with:
- Login form (username/password)
- Register form (username/password)
- Display current user when logged in
- Logout button

Create `public/js/auth.js`:
- Form submission handlers
- API calls to auth endpoints
- UI updates based on auth state

## Files to Create/Modify

- `server/db/migrations/002_sessions.sql` - Session table
- `server/auth/index.js` - Session middleware and password utilities
- `server/services/userService.js` - User CRUD operations
- `server/routes/auth.js` - Auth API endpoints
- `server/index.js` - Add session middleware and routes
- `.env.example` - Add SESSION_SECRET
- `public/index.html` - Add auth UI
- `public/js/auth.js` - Frontend auth logic

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login with credentials |
| POST | `/api/auth/logout` | End session |
| GET | `/api/auth/me` | Get current user |

## Testing

1. **Registration:**
   - Register with username/password
   - Verify user is created and logged in
   - Verify duplicate username is rejected

2. **Login/Logout:**
   - Login with credentials
   - Verify session persists on refresh
   - Logout, verify session cleared

3. **Validation:**
   - Username too short → error
   - Password too short → error
   - Wrong password → error

## Notes

- Passwords hashed with bcrypt (10 rounds)
- Sessions stored in PostgreSQL, persist across server restarts
- 30-day session expiration
- Production should use strong SESSION_SECRET
