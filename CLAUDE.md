# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

This is a board game design project for **UP SHIP!**, a strategy game about airship conglomerates during the Golden Age of Airships (1900-1937). Players act as Directors of rival airship companies representing Germany, Britain, the United States, and Italy, competing across three historical Ages.

The project is in the **design phase** - no software codebase yet. The primary artifact is `upship_rules.md`.

## Document Structure

- **`upship_rules.md`** - Complete game rules
  - Sections 1-13: Core rules (overview, components, mechanics, factions, setup)
  - Appendix A: TODO list of remaining design work
  - Appendix B: Quick reference/cheat sheet
  - Appendix C: Technology Tiles
  - Appendix D: Upgrade Tiles
  - Appendix E: Hazard Deck
  - Appendix F: Market Deck

## Plans Directory

Design documents and reviews are organized in `plans/`:

- **Active plans**: `plans/*.md` - Current design work
- **Archived plans**: `plans/archive/*.md` - Completed or superseded documents
- **Naming convention**: `YYYY-MM-DD_DESCRIPTION.md`

## Available Commands

- `/review-rules` - Conducts a comprehensive rules review using the boardgame-design skill

## Available Skills

- `boardgame-design` - Provides expertise for game design, balance analysis, and rules clarity

## Utility Scripts

```bash
# Fix UTF-8 encoding corruption (creates backup automatically)
./scripts/fix-encoding.sh [file.md]
```

## Working with This Project

### When Editing Rules
- Cross-references use section numbers frequently
- Key interconnected sections to keep consistent:
  - Section 3.2 (Blueprint mechanics) ↔ Section 4 (Technology/Upgrade System)
  - Section 6 (Game Loop phases) ↔ Section 7 (Building and Launching)
  - Appendix C/D (Tile specs) ↔ Section 4 (System descriptions)
- When mechanics change, update all related sections and Appendix A TODO list

### Design Philosophy
- **Engineering Reality**: Physics (Lift vs Weight) is the core constraint
- **Industrial Management**: Blueprint represents factory capability, not individual ships
- **Historical Narrative**: Three Ages mirror actual airship history
- **Risk Management**: Hazard Checks make every launch uncertain

### Proposing Changes
When suggesting mechanical changes:
1. Identify which sections are affected
2. Check for ripple effects across interconnected systems
3. Update Appendix A TODO list if design gaps are identified
4. Consider faction balance implications
5. Verify thematic consistency with historical airship era

## Key Design Principles

1. **No Direct Attacks**: Players cannot sabotage opponents' ships; competition is positional
2. **Eurogame Philosophy**: Strategy over luck, no player elimination, multiple paths to victory
3. **Faction Asymmetry**: Each nation has unique advantages and constraints
4. **Network Connectivity**: Rules vary by Age for where ships can launch
