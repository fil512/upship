/**
 * Request Logger Middleware
 * Logs all incoming requests with timing information
 */

/**
 * Create a request logger middleware
 *
 * @param {Object} options - Logger options
 * @param {boolean} options.logSuccessful - Whether to log successful requests (default: dev only)
 * @returns {Function} Express middleware
 */
function requestLogger(options = {}) {
  const logSuccessful = options.logSuccessful ?? (process.env.NODE_ENV !== 'production');

  return (req, res, next) => {
    const start = Date.now();

    // Log when response finishes
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        userId: req.session?.userId || 'anonymous'
      };

      // Skip logging successful responses in production (unless enabled)
      if (res.statusCode < 400 && !logSuccessful) {
        return;
      }

      // Log errors at error level
      if (res.statusCode >= 500) {
        console.error('[REQUEST ERROR]', JSON.stringify(logData));
      } else if (res.statusCode >= 400) {
        console.warn('[REQUEST WARN]', JSON.stringify(logData));
      } else if (logSuccessful) {
        console.log('[REQUEST]', JSON.stringify(logData));
      }
    });

    next();
  };
}

module.exports = requestLogger;
