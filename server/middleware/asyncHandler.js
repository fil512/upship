/**
 * Async Handler
 * Wraps async route handlers to automatically catch errors and forward to Express error handler
 */

/**
 * Wrap an async function to catch any errors and pass them to next()
 * This eliminates the need for try-catch blocks in every route handler
 *
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 *
 * @example
 * router.get('/users/:id', asyncHandler(async (req, res) => {
 *   const user = await userService.getById(req.params.id);
 *   if (!user) throw new NotFoundError('User');
 *   res.json(user);
 * }));
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
