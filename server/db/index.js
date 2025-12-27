const { Pool } = require('pg');

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
  console.error('Unexpected database pool error:', err);
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
    console.error('Database health check failed:', err.message);
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

  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query', { text: text.substring(0, 50), duration, rows: result.rowCount });
  }

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
