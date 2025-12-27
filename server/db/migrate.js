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

  console.log(`Running migration: ${filename}`);
  await client.query(upMigration);
  await client.query('INSERT INTO migrations (name) VALUES ($1)', [filename]);
  console.log(`Completed: ${filename}`);
}

/**
 * Rollback the last migration
 */
async function rollbackMigration(client) {
  const result = await client.query(
    'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'
  );

  if (result.rows.length === 0) {
    console.log('No migrations to rollback');
    return;
  }

  const filename = result.rows[0].name;
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filepath, 'utf8');

  // Get DOWN migration (after -- DOWN marker)
  const parts = sql.split('-- DOWN');
  if (parts.length < 2) {
    console.error(`No DOWN migration found in ${filename}`);
    process.exit(1);
  }

  const downMigration = parts[1].trim();

  console.log(`Rolling back: ${filename}`);
  await client.query(downMigration);
  await client.query('DELETE FROM migrations WHERE name = $1', [filename]);
  console.log(`Rolled back: ${filename}`);
}

/**
 * Show migration status
 */
async function showStatus(client) {
  const applied = await getAppliedMigrations(client);
  const pending = await getPendingMigrations(applied);

  console.log('\n=== Migration Status ===\n');

  if (applied.length === 0) {
    console.log('Applied: (none)');
  } else {
    console.log('Applied:');
    applied.forEach(m => console.log(`  [x] ${m}`));
  }

  console.log('');

  if (pending.length === 0) {
    console.log('Pending: (none)');
  } else {
    console.log('Pending:');
    pending.forEach(m => console.log(`  [ ] ${m}`));
  }

  console.log('');
}

/**
 * Main migration runner
 */
async function main() {
  const command = process.argv[2] || 'up';
  let client;

  try {
    client = await pool.connect();
    await ensureMigrationsTable(client);

    switch (command) {
      case 'up': {
        const applied = await getAppliedMigrations(client);
        const pending = await getPendingMigrations(applied);

        if (pending.length === 0) {
          console.log('All migrations are up to date');
          break;
        }

        console.log(`Running ${pending.length} migration(s)...\n`);

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

        console.log('\nAll migrations completed successfully');
        break;
      }

      case 'down':
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
        await showStatus(client);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.error('Usage: migrate.js [up|down|status]');
        process.exit(1);
    }
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

main();
