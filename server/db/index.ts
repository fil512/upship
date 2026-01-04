import { Pool, PoolClient, QueryResult, PoolConfig } from 'pg';
import type { Logger } from 'pino';

// Use require for CommonJS compatibility
 
const logger = require('../logger') as Logger;

// Child logger for database operations
const dbLogger = logger.child({ component: 'db' });

// Connection pool configuration
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20,                      // Maximum connections in pool
  idleTimeoutMillis: 30000,     // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Connection timeout
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
};

export const pool = new Pool(poolConfig);

// Log pool errors
pool.on('error', (err: Error) => {
  dbLogger.error({ err }, 'Unexpected database pool error');
});

/**
 * Check database connectivity
 * @returns true if connected, false otherwise
 */
export async function healthCheck(): Promise<boolean> {
  let client: PoolClient | undefined;
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
 * @param text - SQL query
 * @param params - Query parameters
 * @returns QueryResult
 */
export async function query<T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
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
 * @returns PoolClient
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

// CommonJS compatibility
module.exports = {
  pool,
  query,
  getClient,
  healthCheck
};
