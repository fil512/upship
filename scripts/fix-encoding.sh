#!/bin/bash

# fix-encoding.sh
# Fixes common UTF-8 encoding corruption issues in text files
# Usage: ./scripts/fix-encoding.sh <file>
# Or: ./scripts/fix-encoding.sh (will process upship_rules.md by default)

set -e

# Default to upship_rules.md if no argument provided
FILE="${1:-upship_rules.md}"

if [ ! -f "$FILE" ]; then
    echo "Error: File '$FILE' not found"
    exit 1
fi

echo "Fixing encoding issues in: $FILE"

# Create backup
BACKUP="${FILE}.backup"
cp "$FILE" "$BACKUP"
echo "Created backup: $BACKUP"

# Fix common UTF-8 corruption patterns
# These occur when UTF-8 is incorrectly interpreted as Latin-1 and re-encoded

# First, remove invisible control characters (U+009D and similar)
sed -i '' \
    -e $'s/\xC2\x9D//g' \
    -e $'s/\xC2\x9C//g' \
    -e $'s/\xC2\x9E//g' \
    -e $'s/\xC2\x9F//g' \
    "$FILE"

# Then fix visible character corruptions
sed -i '' \
    -e 's/Ã¢â‚¬â€œ/–/g' \
    -e 's/Ã¢â‚¬â€/—/g' \
    -e 's/Ã¢â‚¬"/—/g' \
    -e 's/Ã¢â€°Â¥/≥/g' \
    -e 's/Ã¢ËœÂ/✓/g' \
    -e 's/Ã¢Ëœ/✓/g' \
    -e 's/Ã‚Â£/£/g' \
    -e 's/Ã¢Ë†â€™/−/g' \
    -e 's/Ã¢â€ â€™/→/g' \
    -e 's/Ã¢â€°Â /≥ /g' \
    -e 's/Ã¢â€°Â¤/≤/g' \
    "$FILE"

echo "✓ Encoding fixed successfully"
echo "Original file backed up to: $BACKUP"
echo ""
echo "To remove backup after verification: rm $BACKUP"
