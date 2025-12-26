# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a board game design project for **UP SHIP!**, a strategy game about airship conglomerates during the Golden Age of Airships (1900-1937). Players act as Directors of rival airship companies representing Germany, Britain, the United States, and Italy, competing across three historical Ages.

The project is in the **design phase** - no software codebase yet. The primary artifact is `upship_rules.md`.

## Document Structure

- **`upship_rules.md`** - Complete game rules (~1500 lines)
  - Sections 1-13: Core rules (overview, components, mechanics, factions, setup)
  - Appendix A: TODO list of remaining design work
  - Appendix B: Quick reference/cheat sheet
  - Appendix C: Technology Tiles (45 tiles, organized by track)
  - Appendix D: Upgrade Tiles (44 tiles with stats)
  - Appendix E: Hazard Deck (20 cards)
  - Appendix F: Market Deck (30 cards)

## Utility Scripts

```bash
# Fix UTF-8 encoding corruption (creates backup automatically)
./scripts/fix-encoding.sh [file.md]
```

## Game Architecture (High-Level Concepts)

The game combines several mechanical systems that interact:

### 1. Technology/Upgrade Two-Tier System
- **Technologies** (permanent knowledge) are acquired from the R&D Board using Research
- **Upgrades** (physical components) are installed on Blueprints but require owning the corresponding Technology
- Technologies persist across Ages; Upgrades are reset at Age transitions
- Specialization discount: deeper investment in one tech track reduces costs (-1 at 3+ tiles, -2 at 5+ tiles)

### 2. Engineer Economy
- Engineers serve dual purposes:
  - **Research Generation**: Each Engineer in Barracks generates 1 Research during Reveal Phase (plus card bonuses)
  - **Emergency Response**: Can be spent reactively during Hazard Checks to prevent crashes
- This creates tension: spending Engineers on emergencies reduces innovation capacity
- Engineers cost £3 to recruit and £1/round upkeep

### 3. The Physics Check (Core Constraint)
- Every Blueprint must satisfy: **Total Lift ≥ Total Weight**
- This is the fundamental constraint that drives all engineering decisions
- Ships are "frozen prototypes" - once launched, changing the Blueprint doesn't affect ships already on the map

### 4. Age Progression
- Three distinct Ages with different maps (Western Europe → Greater Europe → The Atlantic)
- Age transitions wipe all routes, crash Income, but preserve Technologies
- Blueprint overlays are replaced each Age (with transfer option for Upgrades)
- Historical accuracy in ship silhouettes and faction designs

### 5. Deck-Building Integration
- Every card has dual functionality: Worker Placement action OR Reveal phase resources
- Using a card for placement sacrifices its Influence/Ops/Research bonuses
- Cards enable: Influence (buy new cards), Ops (contests/hazards), Research (acquire tech via bonuses)

### 6. Progress Track (Game Timer)
- Shared track representing fixed-wing aviation advancement
- Advances by 1 for each Technology acquired by any player
- Game ends when threshold is reached (20/25/30 for 2/3/4 players)
- Thematic: your innovations hasten your own obsolescence

### 7. Faction Asymmetry
- **Germany**: Maximum Lift capacity, locked to Hydrogen (Hindenburg risk), unique Blaugas fuel
- **Britain**: Pre-installed Luxury, Imperial mooring system, but bureaucratic (2 swaps instead of 3)
- **USA**: Helium monopoly (safe from fire), Trapeze Fighter System, but helium provides less lift
- **Italy**: Rapid refit (5 swaps), flexible frame ignores weather, but one fewer Payload slot

## Known Design Gaps (Appendix A)

Check Appendix A in `upship_rules.md` for the current TODO list. Key remaining work:
- **Component Art**: Maps, boards, tiles, cards need visual design
- **Economy Balancing**: Route income, tech costs need playtesting
- **Playtesting**: Engineer economy, Progress Track pacing, faction balance

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
2. Check for ripple effects (e.g., changing Engineers affects Research economy, Hazard Checks, and Income)
3. Update Appendix A TODO list if design gaps are identified
4. Consider faction balance implications
5. Verify thematic consistency with historical airship era

### Key Balance Levers
- Research costs: Age I (1-3), Age II (3-5), Age III (4-6)
- Engineer: recruit £4, upkeep £1/round (Pilot: recruit £2, consumed on launch)
- Specialization discounts: -1 at 3+ tiles, -2 at 5+ tiles
- Progress Track: Age ends at 8/16/20 (2P), 10/20/25 (3P), 12/24/30 (4P)
- Route income target: ships pay for themselves in 3-5 turns

## Critical Design Notes

1. **No Direct Attacks**: Players cannot sabotage opponents' ships; competition is positional
2. **The Hindenburg Disaster**: Failed Luxury Launch + Hydrogen + Age III = immediate game end trigger
3. **Frozen Prototype Rule**: Ships retain Blueprint stats from launch moment; changes don't apply retroactively
4. **Engineer Timing**: Research calculation happens during Reveal Phase; reactive spending during Hazard Checks
5. **Network Connectivity**: Age I (none), Age II (from capital), Age III (from any major hub)
