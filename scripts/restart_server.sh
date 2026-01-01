#!/bin/bash
# Restart the local development server
# Usage: ./scripts/restart_server.sh

set -e

echo "Restarting local development server..."

# Kill any existing server on port 3000 AND any npm dev:local processes
echo "Stopping any existing server on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
# Also kill any lingering npm dev:local processes (parent npm may survive if child was killed)
pkill -f "npm run dev:local" 2>/dev/null || true
pkill -f "node.*--watch server/index.js" 2>/dev/null || true
sleep 1

# Run database migrations
echo "Running database migrations..."
npm run migrate:local

# Start the server in background (fully detached)
echo "Starting dev server..."
nohup npm run dev:local > /dev/null 2>&1 &
disown
sleep 1

# Wait for server to be healthy (up to 30 seconds)
echo "Waiting for server to be healthy..."
UPSHIP_LOCAL=1 python -m playtest healthcheck

echo "Server is ready!"
