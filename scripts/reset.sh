#!/bin/sh

# Check if Python virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
    echo "Error: Python virtual environment is not activated."
    echo "Please run: source .env/bin/activate"
    exit 1
fi

UPSHIP_URL=http://localhost:3000 npm run cli -- reset
