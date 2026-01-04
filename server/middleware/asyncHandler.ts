/**
 * Async Handler
 * Wraps async route handlers to automatically catch errors and forward to Express error handler
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Wrap an async function to catch any errors and pass them to next()
 * This eliminates the need for try-catch blocks in every route handler
 *
 * @param fn - Async route handler function
 * @returns Express middleware function
 *
 * @example
 * router.get('/users/:id', asyncHandler(async (req, res) => {
 *   const user = await userService.getById(req.params.id);
 *   if (!user) throw new NotFoundError('User');
 *   res.json(user);
 * }));
 */
function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default asyncHandler;

// CommonJS compatibility
module.exports = asyncHandler;
