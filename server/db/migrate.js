#!/usr/bin/env node

/**
 * Database Migration Runner
 *
 * Usage:
 *   node server/db/migrate.js        - Run all pending migrations
 *   node server/db/migrate.js down   - Rollback last migration
 *   node server/db/migrate.js status - Show migration status
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { pool } = require('./index');
const logger = require('../logger');

// Child logger for migrations
const migrateLogger = logger.child({ component: 'migrate' });

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Ensure migrations tracking table exists
 */
async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      run_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations(client) {
  const result = await client.query('SELECT name FROM migrations ORDER BY id');
  return result.rows.map(row => row.name);
}

/**
 * Get list of pending migrations
 */
async function getPendingMigrations(applied) {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  return files.filter(f => !applied.includes(f));
}

/**
 * Run a single migration file
 */
async function runMigration(client, filename) {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filepath, 'utf8');

  // Split on -- DOWN marker to get UP migration only
  const upMigration = sql.split('-- DOWN')[0].trim();

  migrateLogger.info({ migration: filename }, 'Running migration');
  await client.query(upMigration);
  await client.query('INSERT INTO migrations (name) VALUES ($1)', [filename]);
  migrateLogger.info({ migration: filename }, 'Completed migration');
}

/**
 * Rollback the last migration
 */
async function rollbackMigration(client) {
  const result = await client.query(
    'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'
  );

  if (result.rows.length === 0) {
    migrateLogger.info('No migrations to rollback');
    return;
  }

  const filename = result.rows[0].name;
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filepath, 'utf8');

  // Get DOWN migration (after -- DOWN marker)
  const parts = sql.split('-- DOWN');
  if (parts.length < 2) {
    migrateLogger.error({ migration: filename }, 'No DOWN migration found');
    process.exit(1);
  }

  const downMigration = parts[1].trim();

  migrateLogger.info({ migration: filename }, 'Rolling back migration');
  await client.query(downMigration);
  await client.query('DELETE FROM migrations WHERE name = $1', [filename]);
  migrateLogger.info({ migration: filename }, 'Rolled back migration');
}

/**
 * Show migration status
 */
async function showStatus(client) {
  const applied = await getAppliedMigrations(client);
  const pending = await getPendingMigrations(applied);

  migrateLogger.info({ applied: applied.length, pending: pending.length }, 'Migration status');

  if (applied.length > 0) {
    applied.forEach(m => migrateLogger.info({ migration: m, status: 'applied' }, 'Applied'));
  }

  if (pending.length > 0) {
    pending.forEach(m => migrateLogger.info({ migration: m, status: 'pending' }, 'Pending'));
  }
}

/**
 * Run all pending migrations (can be called from app startup)
 */
async function runMigrations() {
  let client;

  try {
    client = await pool.connect();
    await ensureMigrationsTable(client);

    const applied = await getAppliedMigrations(client);
    const pending = await getPendingMigrations(applied);

    if (pending.length === 0) {
      migrateLogger.info('All migrations are up to date');
      return;
    }

    migrateLogger.info({ count: pending.length }, 'Running migrations');

    for (const migration of pending) {
      await client.query('BEGIN');
      try {
        await runMigration(client, migration);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    migrateLogger.info('All migrations completed successfully');
  } finally {
    if (client) client.release();
  }
}

/**
 * Main CLI runner
 */
async function main() {
  const command = process.argv[2] || 'up';
  let client;

  try {
    switch (command) {
      case 'up':
        await runMigrations();
        break;

      case 'down':
        client = await pool.connect();
        await ensureMigrationsTable(client);
        await client.query('BEGIN');
        try {
          await rollbackMigration(client);
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        }
        break;

      case 'status':
        client = await pool.connect();
        await ensureMigrationsTable(client);
        await showStatus(client);
        break;

      default:
        migrateLogger.error({ command }, 'Unknown command');
        migrateLogger.info('Usage: migrate.js [up|down|status]');
        process.exit(1);
    }
  } catch (err) {
    migrateLogger.error({ err }, 'Migration failed');
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Export for use in app startup
module.exports = { runMigrations };

// Run CLI if called directly
if (require.main === module) {
  main();
}
