# Phase 03: User Authentication with Google OAuth2

## Overview

Implement user authentication using Google OAuth2. Users sign in with their Google account - no passwords to manage, no guest users.

## Prerequisites

- [x] Phase 01 complete (Express server deployed)
- [x] Phase 02 complete (Database with users table)

## Goals

- [ ] Set up Google OAuth2 credentials in Google Cloud Console
- [ ] Install authentication dependencies (passport, passport-google-oauth20, express-session)
- [ ] Create session store backed by PostgreSQL
- [ ] Implement Google OAuth2 login flow
- [ ] Add session middleware to protect routes
- [ ] Create auth migration for sessions table
- [ ] Create frontend login UI with Google sign-in button
- [ ] Test authentication flow end-to-end

## Implementation Steps

### Step 1: Set Up Google OAuth2 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Configure consent screen
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (development)
   - `https://upship-production.up.railway.app/api/auth/google/callback` (production)
7. Save Client ID and Client Secret

### Step 2: Install Dependencies

```bash
npm install passport passport-google-oauth20 express-session connect-pg-simple
```

- `passport`: Authentication middleware
- `passport-google-oauth20`: Google OAuth2 strategy
- `express-session`: Session middleware
- `connect-pg-simple`: PostgreSQL session store

### Step 3: Create Session Table Migration

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

### Step 4: Create Auth Module

Create `server/auth/index.js`:

```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('../db');

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

// Configure Passport with Google OAuth2
function configurePassport() {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      const email = profile.emails[0].value;
      const googleId = profile.id;
      const displayName = profile.displayName;

      let result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      let user;
      if (result.rows.length === 0) {
        // Create new user
        result = await pool.query(
          `INSERT INTO users (username, email, display_name, google_id)
           VALUES ($1, $2, $3, $4)
           RETURNING id, username, email, display_name`,
          [email, email, displayName, googleId]
        );
        user = result.rows[0];
      } else {
        user = result.rows[0];
        // Update google_id and last_login
        await pool.query(
          `UPDATE users SET google_id = $1, last_login = NOW() WHERE id = $2`,
          [googleId, user.id]
        );
      }

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const result = await pool.query(
        'SELECT id, username, email, display_name FROM users WHERE id = $1',
        [id]
      );
      done(null, result.rows[0] || null);
    } catch (error) {
      done(error, null);
    }
  });
}

// Auth middleware - requires logged in user
function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

module.exports = {
  createSessionMiddleware,
  configurePassport,
  requireAuth,
  passport
};
```

### Step 5: Create Auth Routes

Create `server/routes/auth.js`:

```javascript
const express = require('express');
const router = express.Router();
const { passport } = require('../auth');

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/?error=auth_failed'
  }),
  (req, res) => {
    res.redirect('/');
  }
);

// Get current user
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.json({ user: null });
  }
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      displayName: req.user.display_name
    }
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy((err) => {
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });
});

module.exports = router;
```

### Step 6: Add google_id Column Migration

Create `server/db/migrations/003_google_oauth.sql`:

```sql
-- Add google_id column for OAuth
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
```

### Step 7: Update Server Index

Modify `server/index.js`:

```javascript
require('dotenv').config();

const express = require('express');
const path = require('path');
const db = require('./db');
const { createSessionMiddleware, configurePassport, passport } = require('./auth');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(createSessionMiddleware());

// Passport initialization
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

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

### Step 8: Update .env.example

```
DATABASE_URL=postgresql://user:password@localhost:5432/upship
SESSION_SECRET=your-secure-random-string-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
NODE_ENV=development
```

### Step 9: Create Frontend Login UI

Update `public/index.html` with:
- "Sign in with Google" button
- Display current user when logged in
- Logout button

Create `public/js/auth.js`:
- Check auth status on page load
- Handle login/logout button clicks
- Update UI based on auth state

## Files to Create/Modify

- `server/db/migrations/002_sessions.sql` - Session table
- `server/db/migrations/003_google_oauth.sql` - Add google_id column
- `server/auth/index.js` - Passport config and session middleware
- `server/routes/auth.js` - OAuth routes
- `server/index.js` - Add passport middleware
- `.env.example` - Add Google OAuth env vars
- `public/index.html` - Add Google sign-in button
- `public/js/auth.js` - Frontend auth logic

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | OAuth callback |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | End session |

## Environment Variables Required

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL |
| `SESSION_SECRET` | Random string for session signing |

## Testing

1. **Local Development:**
   - Set up Google OAuth credentials
   - Add localhost callback URL
   - Click "Sign in with Google"
   - Verify redirect to Google, then back
   - Check `/api/auth/me` returns user

2. **Production:**
   - Add Railway callback URL to Google Console
   - Set env vars in Railway
   - Test full OAuth flow

## Notes

- No passwords to manage - Google handles authentication
- User email becomes their username
- Display name pulled from Google profile
- Sessions stored in PostgreSQL for persistence across deploys
