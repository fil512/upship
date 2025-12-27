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

    // Explicitly save session to catch any session store errors
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session error: ' + err.message });
      }
      res.json({ user });
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Username already taken' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
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

    // Explicitly save session to catch any session store errors
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session error: ' + err.message });
      }
      res.json({ user });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
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
