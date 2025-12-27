#!/bin/bash
# Execute CLI commands from a file
# Usage: ./scripts/play-commands.sh commands.txt

INPUT_FILE="${1:-/Volumes/bork/pers/upship/playtest-commands.txt}"

if [ ! -f "$INPUT_FILE" ]; then
  echo "Error: Input file not found: $INPUT_FILE"
  exit 1
fi

while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip empty lines and comments
  [[ -z "$line" || "$line" =~ ^# ]] && continue

  echo ">>> $line"
  node cli/upship.js $line 2>&1 | grep -E "✓|✗|Age|Turn|Phase|Waiting|YOUR TURN"
done < "$INPUT_FILE"
