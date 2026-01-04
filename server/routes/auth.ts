import type { Request, Response, NextFunction, Router } from 'express';

const express = require('express');
const router: Router = express.Router();
const userService = require('../services/userService');
const { ValidationError, UnauthorizedError, DatabaseError } = require('../errors');

// Extended request with session
interface AuthenticatedRequest extends Request {
  session: Request['session'] & {
    userId?: string;
    destroy: (callback: (err?: Error) => void) => void;
  };
}

// User object returned from service
interface User {
  id: string;
  username: string;
  display_name?: string;
}

// Register new user
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      throw new ValidationError('Username and password required');
    }

    if (username.length < 3 || username.length > 50) {
      throw new ValidationError('Username must be 3-50 characters');
    }

    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    const user: User = await userService.registerUser(username, password);
    const authReq = req as AuthenticatedRequest;
    authReq.session.userId = user.id;
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      throw new ValidationError('Username and password required');
    }

    const user: User | null = await userService.loginUser(username, password);

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const authReq = req as AuthenticatedRequest;
    authReq.session.userId = user.id;
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  authReq.session.destroy((err?: Error) => {
    if (err) {
      next(new DatabaseError(err));
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// Get current user
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.session.userId) {
    res.json({ user: null });
    return;
  }

  try {
    const user: User | null = await userService.getUserById(authReq.session.userId);
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

export default router;

// CommonJS compatibility
module.exports = router;
