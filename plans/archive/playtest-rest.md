# UP SHIP! Strategic Playtest Command (Local Dev Server)

Run a playtest against the **local development server** (http://localhost:3000) using the Python automation tool. The goal is to play the game until it either **finishes** or gets **stuck** (revealing design flaws).

## Quick Start

**Step 1: Rebuild and restart the local server**

```bash
./scripts/restart_server.sh
```

**Step 2: Run the playtest**

```bash
python -m playtest setup
python -m playtest autoplay
```

## Command Reference

See **`playtest/README.md`** for complete command reference, including:
- All setup commands (setup, setup-interactive, setup-bots)
- Autoplay commands and options
- Status and debugging commands
- Individual action commands
- Location IDs for worker placement
- Environment variables
- Troubleshooting guide
