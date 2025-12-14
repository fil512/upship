# Scripts

Utility scripts for the UP SHIP! project.

## fix-encoding.sh

Fixes common UTF-8 encoding corruption issues that occur when UTF-8 text is incorrectly interpreted as Latin-1 and re-encoded.

### Usage

```bash
# Fix the default file (upship_rules.md)
./scripts/fix-encoding.sh

# Fix a specific file
./scripts/fix-encoding.sh path/to/file.md
```

### What it fixes

The script corrects these common encoding corruptions:

**Visible character corruptions:**

| Corrupted | Correct | Character |
|-----------|---------|-----------|
| Ã¢â‚¬â€œ | – | En-dash |
| Ã¢â‚¬â€ | — | Em-dash |
| Ã¢â‚¬" | — | Em-dash (variant) |
| Ã¢â€°Â¥ | ≥ | Greater than or equal |
| Ã¢ËœÂ | ✓ | Checkmark |
| Ã¢Ëœ | ✓ | Checkmark (variant) |
| Ã‚Â£ | £ | Pound sterling |
| Ã¢Ë†â€™ | − | Minus sign |
| Ã¢â€ â€™ | → | Right arrow |
| Ã¢â€°Â¤ | ≤ | Less than or equal |

**Invisible control characters removed:**
- U+009C (String Terminator)
- U+009D (Operating System Command)
- U+009E (Privacy Message)
- U+009F (Application Program Command)

These invisible characters sometimes appear after em-dashes or other special characters.

### Safety

- Automatically creates a `.backup` file before making changes
- Will not overwrite existing backups
- Non-destructive: original file is preserved

### Example

```bash
$ ./scripts/fix-encoding.sh upship_rules.md
Fixing encoding issues in: upship_rules.md
Created backup: upship_rules.md.backup
✓ Encoding fixed successfully
Original file backed up to: upship_rules.md.backup

To remove backup after verification: rm upship_rules.md.backup
```
