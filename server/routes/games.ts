import type { Request, Response, NextFunction, Router, Application } from 'express';
import type { Server as SocketIOServer } from 'socket.io';
import type { GameState } from '@upship/api';

const express = require('express');
const router: Router = express.Router();
const { requireAuth } = require('../auth');
const gameService = require('../services/gameService');
const gameStateService = require('../services/gameStateService');
const { broadcastLobbyUpdate, broadcastGameStarted } = require('../socket');
const { NotFoundError, ValidationError } = require('../errors');

// Extended request with session and app
interface AuthenticatedRequest extends Request {
  session: Request['session'] & {
    userId: string;
  };
  app: Application & {
    get(name: 'io'): SocketIOServer | undefined;
  };
}

// Game object from service
interface Game {
  id: string;
  name: string;
  status: 'waiting' | 'active' | 'completed';
  host_id: string;
  settings?: Record<string, unknown>;
  players?: Array<{ userId: string; faction?: string }>;
}

// Game state wrapper
interface GameStateWrapper {
  state: GameState;
  version: number;
}

// Game settings
interface GameSettings {
  minPlayers?: number | string;
  maxPlayers?: number | string;
}

// All game routes require authentication
router.use(requireAuth);

// List games (with optional status filter)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const filters = {
      status: (req.query.status as string) || 'waiting',
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50
    };
    const games: Game[] = await gameService.getGames(filters);
    res.json({ games });
  } catch (error) {
    next(error);
  }
});

// Get my games
router.get('/mine', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const games: Game[] = await gameService.getUserGames(authReq.session.userId);
    res.json({ games });
  } catch (error) {
    next(error);
  }
});

// Get single game
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const game: Game | null = await gameService.getGameById(req.params.id);
    if (!game) {
      throw new NotFoundError('Game');
    }
    res.json({ game });
  } catch (error) {
    next(error);
  }
});

// Create game
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, settings } = req.body as { name?: string; settings?: GameSettings };

    if (!name || name.trim().length === 0) {
      throw new ValidationError('Game name is required');
    }

    if (name.length > 100) {
      throw new ValidationError('Game name must be 100 characters or less');
    }

    // SECURITY: Validate game settings to prevent invalid configurations
    const validatedSettings: GameSettings = { ...settings };
    if (validatedSettings.minPlayers !== undefined) {
      const minPlayers = parseInt(String(validatedSettings.minPlayers), 10);
      if (isNaN(minPlayers) || minPlayers < 2 || minPlayers > 4) {
        throw new ValidationError('Minimum players must be between 2 and 4');
      }
      validatedSettings.minPlayers = minPlayers;
    }
    if (validatedSettings.maxPlayers !== undefined) {
      const maxPlayers = parseInt(String(validatedSettings.maxPlayers), 10);
      if (isNaN(maxPlayers) || maxPlayers < 2 || maxPlayers > 4) {
        throw new ValidationError('Maximum players must be between 2 and 4');
      }
      validatedSettings.maxPlayers = maxPlayers;
    }
    // Ensure min <= max
    if (validatedSettings.minPlayers && validatedSettings.maxPlayers &&
        (validatedSettings.minPlayers as number) > (validatedSettings.maxPlayers as number)) {
      throw new ValidationError('Minimum players cannot exceed maximum players');
    }

    const game: Game = await gameService.createGame(authReq.session.userId, name.trim(), validatedSettings);
    res.status(201).json({ game });
  } catch (error) {
    next(error);
  }
});

// Join game (optionally with faction selection)
router.post('/:id/join', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { faction } = req.body as { faction?: string };
    const validFactions = ['germany', 'britain', 'usa', 'italy'];

    // Validate faction if provided
    if (faction && !validFactions.includes(faction)) {
      throw new ValidationError('Invalid faction. Must be: germany, britain, usa, or italy');
    }

    const game: Game = await gameService.joinGame(req.params.id, authReq.session.userId, faction);

    // Broadcast lobby update to waiting players
    const io = authReq.app.get('io');
    if (io) {
      broadcastLobbyUpdate(io, req.params.id, game);
    }

    res.json({ game });
  } catch (error) {
    next(error);
  }
});

// Leave game
router.post('/:id/leave', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const game: Game = await gameService.leaveGame(req.params.id, authReq.session.userId);

    // Broadcast lobby update to remaining players
    const io = authReq.app.get('io');
    if (io && game.status === 'waiting') {
      broadcastLobbyUpdate(io, req.params.id, game);
    }

    res.json({ game });
  } catch (error) {
    next(error);
  }
});

// Select faction
router.post('/:id/faction', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { faction } = req.body as { faction?: string };
    const validFactions = ['germany', 'britain', 'usa', 'italy'];

    if (!faction || !validFactions.includes(faction)) {
      throw new ValidationError('Invalid faction. Must be: germany, britain, usa, or italy');
    }

    const game: Game = await gameService.selectFaction(req.params.id, authReq.session.userId, faction);

    // Broadcast lobby update to waiting players
    const io = authReq.app.get('io');
    if (io) {
      broadcastLobbyUpdate(io, req.params.id, game);
    }

    res.json({ game });
  } catch (error) {
    next(error);
  }
});

// Start game (host only)
router.post('/:id/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const game: Game = await gameService.startGame(req.params.id, authReq.session.userId);

    // Get the initial game state to broadcast
    const gameState: GameStateWrapper | null = await gameStateService.getGameState(req.params.id);

    // Broadcast game-started to all waiting players
    const io = authReq.app.get('io');
    if (io && gameState) {
      broadcastGameStarted(io, req.params.id, gameState.state);
    }

    res.json({ game });
  } catch (error) {
    next(error);
  }
});

export default router;

// CommonJS compatibility
module.exports = router;
