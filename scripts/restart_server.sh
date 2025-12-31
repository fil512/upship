#!/bin/bash
# Restart the local development server
# Usage: ./scripts/restart_server.sh

set -e

echo "Restarting local development server..."

# Kill any existing server on port 3000
echo "Stopping any existing server on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Run database migrations
echo "Running database migrations..."
npm run migrate:local

# Start the server in background
echo "Starting dev server..."
npm run dev:local &

# Wait for server to be healthy (up to 30 seconds)
echo "Waiting for server to be healthy..."
UPSHIP_LOCAL=1 python -m playtest healthcheck

echo "Server is ready!"
