const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { ValidationError, UnauthorizedError, DatabaseError } = require('../errors');

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new ValidationError('Username and password required');
    }

    if (username.length < 3 || username.length > 50) {
      throw new ValidationError('Username must be 3-50 characters');
    }

    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    const user = await userService.registerUser(username, password);
    req.session.userId = user.id;
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new ValidationError('Username and password required');
    }

    const user = await userService.loginUser(username, password);

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    req.session.userId = user.id;
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(new DatabaseError(err));
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// Get current user
router.get('/me', async (req, res, next) => {
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
    next(error);
  }
});

module.exports = router;
