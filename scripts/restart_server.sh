#!/bin/bash
# Restart the local development servers (Express API + SvelteKit frontend)
# Usage: ./scripts/restart_server.sh
#
# Servers:
#   - Express API: http://localhost:3000
#   - SvelteKit:   http://localhost:5173

set -e

echo "Restarting local development servers..."

# Kill any existing servers on port 3000 (Express) and 5173 (SvelteKit)
echo "Stopping any existing servers..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Also kill any lingering npm dev processes
pkill -f "npm run dev:local" 2>/dev/null || true
pkill -f "npm run dev -w web" 2>/dev/null || true
pkill -f "node.*--watch server/index.js" 2>/dev/null || true
pkill -f "vite dev" 2>/dev/null || true
sleep 1

# Run database migrations
echo "Running database migrations..."
npm run migrate:local

# Start the Express API server in background
echo "Starting Express API server (port 3000)..."
nohup npm run dev:local > /tmp/upship-api.log 2>&1 &
disown
sleep 1

# Start the SvelteKit frontend in background
echo "Starting SvelteKit frontend (port 5173)..."
nohup npm run dev -w web > /tmp/upship-web.log 2>&1 &
disown
sleep 2

# Wait for Express API to be healthy (up to 30 seconds)
echo "Waiting for Express API to be healthy..."
UPSHIP_LOCAL=1 python -m playtest healthcheck

# Quick check that SvelteKit is responding
echo "Checking SvelteKit frontend..."
for i in {1..10}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "SvelteKit frontend is ready!"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "Warning: SvelteKit may still be starting (check /tmp/upship-web.log)"
    fi
    sleep 1
done

echo ""
echo "Servers are ready!"
echo "  API:      http://localhost:3000"
echo "  Frontend: http://localhost:5173"
