# Phase 16: Hazard Deck and Hazard Checks

## Overview
Implement the hazard system that adds risk to airship launches and flights.

## Goals
- [x] Hazard check action during launch
- [x] Display hazard deck status
- [x] Hazard resolution mechanics
- [x] Ship damage/crash outcomes
- [x] Reliability stat reduces hazard risk
- [x] Insurance mitigation

## Implementation

### Hazard Check Trigger
- Hazard check when launching a ship
- Draw from personal hazard deck
- Compare difficulty to ship stats

### Hazard Resolution
- Reliability + crew bonuses vs difficulty
- Success: Safe flight
- Failure: Damage or crash
- Critical failure: Ship destroyed

### Hazard Types
- Weather (difficulty 2-4)
- Mechanical (difficulty 3-5)
- Fire (difficulty 4-6)
- Structural (difficulty 3-5)
- Critical (difficulty 6)

### Insurance Effect
- Insurance policies mitigate crash damage
- Reduce income penalty on ship loss

## Next Steps
- Phase 17: Cards
