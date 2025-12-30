const { Pool } = require('pg');
const logger = require('../logger');

// Child logger for database operations
const dbLogger = logger.child({ component: 'db' });

// Connection pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                      // Maximum connections in pool
  idleTimeoutMillis: 30000,     // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Connection timeout
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

// Log pool errors
pool.on('error', (err) => {
  dbLogger.error({ err }, 'Unexpected database pool error');
});

/**
 * Check database connectivity
 * @returns {Promise<boolean>} true if connected, false otherwise
 */
async function healthCheck() {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    return true;
  } catch (err) {
    dbLogger.error({ err }, 'Database health check failed');
    return false;
  } finally {
    if (client) client.release();
  }
}

/**
 * Execute a query with optional parameters
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  // Log at debug level (controlled by LOG_LEVEL env var)
  dbLogger.debug({
    query: text.substring(0, 80),
    duration,
    rows: result.rowCount
  }, 'Executed query');

  return result;
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise<PoolClient>}
 */
async function getClient() {
  return pool.connect();
}

module.exports = {
  pool,
  query,
  getClient,
  healthCheck
};
