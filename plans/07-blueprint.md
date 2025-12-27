# Phase 07: Blueprint System

## Overview
Implement the upgrade tile system for installing components on player blueprints.

## Goals
- [x] Create upgrade tile definitions with stats
- [x] Validate technology requirements for upgrades
- [x] Implement install/remove upgrade actions
- [x] Calculate ship stats from installed upgrades
- [x] Add upgrade selection modal UI
- [x] Display installed upgrades properly in slots

## Implementation

### Upgrade Tiles Data (`server/data/upgrades.js`)
Define all upgrade tiles organized by type:
- **Propulsion:** Engines affecting Speed, Range
- **Frame:** Structural tiles with gas sockets, Hull Cost
- **Fabric:** Covering materials affecting Reliability
- **Component:** Payload items for Luxury, Income

### Required Technology Validation
Each upgrade requires owning the corresponding technology:
- Check player's technologies array before installing
- Show only available upgrades in selection UI

### Ship Stat Calculation
Total stats = Baseline + Faction Bonus + Sum of Installed Upgrades
- Speed, Range, Ceiling, Reliability from all upgrades
- Weight is sum of all upgrade weights (negative values)
- Lift comes from gas cubes (5 per cube)
- Physics Check: Lift >= Weight

### UI Updates
- Slot click opens modal with available upgrades
- Filter by slot type and owned technologies
- Show upgrade stats and requirements
- Remove upgrade button for occupied slots

## Next Steps
- Phase 08: Economy System (loans, income tracks)
