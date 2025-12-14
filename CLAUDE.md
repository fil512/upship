# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a board game design project for **UP SHIP!**, a strategy game about airship conglomerates during the Golden Age of Airships (1900-1937). Players act as Directors of rival airship companies representing Germany, Britain, the United States, and Italy, competing across three historical Ages.

The project is currently in the **design phase** - there is no software codebase yet. The primary artifact is `upship_rules.md`, which contains the complete game rules and design specifications.

## Current State

- **Primary Document**: `upship_rules.md` - comprehensive rules covering mechanics, components, gameplay flow, factions, and incomplete design elements
- **No Build Process**: This is a board game design, not a software project
- **No Testing Framework**: Game balancing and playtesting are manual processes
- **No Dependencies**: Pure design documentation

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

The rules document explicitly lists incomplete elements:

1. **Age End Triggers**: No mechanism defined for when Ages transition (Headline deck removed, replacement needed)
2. **Action Selection**: Worker placement system needs redesign; Research Institute action space purpose unclear
3. **Ops Icons Purpose**: Originally for Headline Contests (removed); needs new function
4. **Component Art**: All visual assets need creation (maps, boards, tiles, cards)
5. **Economy Balancing**: Route income values, tech costs, Progress thresholds need playtesting
6. **Agent Count**: Currently 3 per player, but may need adjustment based on final action spaces

## Working with This Project

### When Editing Rules
- The document is structured in numbered sections (1-13 plus Appendices)
- Cross-references use section numbers frequently
- Maintain consistency between:
  - Section 4 (Technology/Upgrade System)
  - Section 3.2 (Blueprint mechanics)
  - Section 6 (Game Loop phases)
  - Appendix A (TODO list)
- When mechanics change, update all related sections

### Design Philosophy
- **Engineering Reality**: Physics (Lift vs Weight) is the core constraint
- **Industrial Management**: Blueprint represents factory capability, not individual ships
- **Historical Narrative**: Three Ages mirror actual airship history
- **Risk Management**: Hazard Checks make every launch uncertain

### Thematic Inspirations
The game draws from:
- **Eclipse**: Tech tracks with specialization, blueprint customization
- **Dune: Imperium**: Deck building with worker placement
- **Brass: Lancashire**: Age-based obsolescence, loan economy
- **Ticket to Ride**: Route claiming and networks

## Common Tasks

### Reviewing Mechanics
When analyzing game systems, consider interactions between:
- Engineer economy (Research generation vs emergency spending)
- Technology acquisition timing (specialization discount builds over time)
- Age transitions (Tech persists, Upgrades reset)
- Progress Track pacing (every tech acquired accelerates game end)

### Proposing Changes
When suggesting mechanical changes:
1. Identify which sections are affected
2. Check for ripple effects (e.g., changing Engineers affects Research economy, Hazard Checks, and Income)
3. Update Appendix A TODO list if design gaps are identified
4. Consider faction balance implications
5. Verify thematic consistency with historical airship era

### Balancing Work
Key balance levers:
- Research costs per Age (currently 2-4 / 4-6 / 5-8)
- Engineer costs (recruit: £3, upkeep: £1/round)
- Specialization discounts (-1 at 3+, -2 at 5+)
- Progress Track thresholds (20/25/30)
- Route income values (target: ships pay for themselves in 3-5 turns)

## Critical Design Notes

1. **No Direct Attacks**: Players cannot sabotage opponents' ships; competition is positional
2. **The Hindenburg Disaster**: Failed Luxury Launch + Hydrogen + Age III = immediate game end trigger
3. **Frozen Prototype Rule**: Ships retain Blueprint stats from launch moment; changes don't apply retroactively
4. **Engineer Timing**: Research calculation happens during Reveal Phase; reactive spending during Hazard Checks
5. **Network Connectivity**: Age I (none), Age II (from capital), Age III (from any major hub)
