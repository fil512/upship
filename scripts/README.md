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

## railway.py

Python client for managing Railway deployments via the GraphQL API. Requires a `RAILWAY_TOKEN` environment variable (create one at https://railway.com/account/tokens).

### Quick Reference

```bash
python scripts/railway.py status              # Check deployment status + health
python scripts/railway.py logs [-n 50]        # View deployment logs
python scripts/railway.py deployments         # List recent deployments
python scripts/railway.py setvar KEY VALUE    # Set environment variable
python scripts/railway.py getvar              # List all environment variables
python scripts/railway.py getvar KEY          # Get specific variable
python scripts/railway.py delvar KEY          # Delete environment variable
python scripts/railway.py redeploy            # Trigger new deployment
python scripts/railway.py health              # Check health endpoint
python scripts/railway.py projects            # List all Railway projects
python scripts/railway.py raw 'query {...}'   # Execute raw GraphQL query
python scripts/railway.py schema TypeName     # Inspect GraphQL schema type
```

### Common Tasks

**Check if deployment is healthy:**
```bash
python scripts/railway.py status
# Output:
# Upship Production: ✓ SUCCESS
#   Deployment: 27592886...
#   Created: 2025-12-29 21:30:19 UTC
#   Health: ✓ healthy (db: connected)
```

**View logs for a failing deployment:**
```bash
python scripts/railway.py logs -n 50
```

**Set an environment variable:**
```bash
python scripts/railway.py setvar SESSION_SECRET "mysecret"
# This automatically triggers a new deployment
```

**List all environment variables:**
```bash
python scripts/railway.py getvar
# Sensitive values (containing "secret", "password", "token", "key") are masked
```

### Project Configuration

The script has Upship project IDs hardcoded:
- Project: `3eb48405-c292-4c4e-a1a0-59f42a94fcfb`
- Environment (production): `b33bbf9d-05a8-451d-a2b6-16f6d56b4d81`
- Service (upship): `22fd253c-5243-4a50-a0b7-06efe95373c3`
- Service (postgres): `67603638-0da9-43b8-bc59-08416ed7ea27`

Uses Bearer authentication by default (account token).
