#!/bin/bash
# Synchronize card images from print/cards to web/static/cards
#
# Usage: ./scripts/sync_card_images.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

SOURCE_DIR="$PROJECT_ROOT/print/cards"
DEST_DIR="$PROJECT_ROOT/web/static/cards"

# Check source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "Error: Source directory not found: $SOURCE_DIR"
    exit 1
fi

# Create destination directories if they don't exist
mkdir -p "$DEST_DIR/agent"
mkdir -p "$DEST_DIR/tech"

# Sync agent cards
if [ -d "$SOURCE_DIR/agent" ]; then
    echo "Syncing agent cards..."
    rsync -av --delete "$SOURCE_DIR/agent/" "$DEST_DIR/agent/"
fi

# Sync tech cards
if [ -d "$SOURCE_DIR/tech" ]; then
    echo "Syncing tech cards..."
    rsync -av --delete "$SOURCE_DIR/tech/" "$DEST_DIR/tech/"
fi

echo ""
echo "Sync complete!"
echo "  Agent cards: $(ls "$DEST_DIR/agent" 2>/dev/null | grep -c '\.png$' || echo 0)"
echo "  Tech cards:  $(ls "$DEST_DIR/tech" 2>/dev/null | grep -c '\.png$' || echo 0)"
