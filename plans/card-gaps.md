# Agent Card Implementation Gaps - RESOLVED

Analysis of agent card action and reveal effect implementations.

## Summary

- **Total Agent Cards**: 41 (10 starter + 30 market + 1 reserve)
- **Reveal Effects**: All properly implemented
- **Action Effects**: All gaps resolved (see below)

---

## Reveal Effects (All Implemented)

The `collectRevealResources()` function in `server/actions/helpers/phaseTransition.ts` correctly processes all reveal effects:

- Research, Influence, Cash, Officers, Engineers, Gas (hydrogen/helium)
- All starter and market cards have their reveal properties properly defined
- Resources are correctly added to player state during reveal phase

---

## Action Effect Gaps - ALL RESOLVED

### Category 1: Launch Bonuses - FIXED

| Card | Effect | Status | Decision |
|------|--------|--------|----------|
| The Weatherman | Ignore Weather hazards this launch | FIXED - hazard.ts checks launchBonuses.ignoreWeather | FIX |
| Kite Jockey / Scrutineer | +2 Reliability for this launch | FIXED - hazard.ts adds launchBonuses.reliability | FIX |
| Navigator (market) | +1 Range for this launch | FIXED - launch.ts adds launchBonuses.range | FIX |
| Cook's Man | +1 Luxury stat for this launch | FIXED - launch.ts adds launchBonuses.luxury | FIX |
| Merchant Prince | +2 Income from this route | FIXED - hazard.ts adds launchBonuses.routeIncomeBonus | FIX |
| The Exciseman | ~~Claim route even if tied~~ | REMOVED - effect set to null | REMOVE |
| Old Contemptible | Combat missions: +2 Income | FIXED - hazard.ts adds launchBonuses.combatIncomeBonus | FIX |
| Helmsman | +1 Speed for this launch | CHANGED - now gives +1 Speed bonus | CHANGE TO +1 Speed |

### Category 2: Upgrade Weight/Lift Bonuses - CHANGED

| Card | New Effect | Status | Decision |
|------|------------|--------|----------|
| Gasbag Man | Gain 1 Hydrogen | CHANGED - gives hydrogen immediately | CHANGE TO: +1 Hydrogen |
| Engine Room Mechanic | If used to build: ignore base cost | CHANGED - £3 base hull cost waived | CHANGE TO: If used to build, ignore base cost |
| Duralumin Man | If used to build: ignore frame cost | CHANGED - frame upgrade costs waived | CHANGE TO: If used to build, ignore frame cost |

### Category 3: Special Abilities - CHANGED/FIXED

| Card | New Effect | Status | Decision |
|------|------------|--------|----------|
| The Archives | Remove previous age tech cards from R&D | CHANGED - filters rndBoard by age | CHANGE TO: Remove all tech cards from previous age from tech row |
| Continental Expert | +2 Reveal Research this round | CHANGED - adds +2 research immediately | CHANGE TO: +2 to Reveal Research this round |
| Royal Geographic Society | Gain tech card costing 3 or less | CHANGED - takes first eligible tech from rndBoard | CHANGE TO: Gain any tech card costing 3 or less |
| The Mandarin | Take 2 Ministry actions | FIXED - draws 2 extra cards only at Ministry | FIX (only counts if used to play ministry space) |
| Engineering Guild | Gain 1 Engineer | CHANGED - gives engineer immediately | CHANGE TO: Gain 1 engineer |

---

## Implementation Summary

### Files Modified

1. **server/actions/hazard.ts**
   - Added launchBonuses type with all bonus properties
   - Added ignoreWeather check for weather hazards
   - Added reliability and speed bonuses to hazard checks
   - Added routeIncomeBonus to route claiming
   - Added combatIncomeBonus to combat missions

2. **server/actions/launch.ts**
   - Added launchBonuses type
   - Applied range, luxury, speed bonuses to ship stats before validation

3. **server/actions/worker.ts**
   - Updated processCardEffect to use locationId parameter
   - Changed Helmsman to +1 Speed
   - Changed Gasbag Man to +1 Hydrogen
   - Changed Engine Room Mechanic to waive base cost
   - Changed Duralumin Man to set ignoreFrameCost flag
   - Changed The Archives to filter rndBoard by age
   - Changed Continental Expert to +2 research
   - Changed Royal Geographic Society to gain tech card
   - Fixed The Mandarin to only work at Ministry
   - Changed Engineering Guild to gain engineer immediately
   - Removed The Exciseman tiebreaker effect

4. **server/actions/building.ts**
   - Added ignoreFrameCost flag to BuildPlayerState
   - Skip frame hull costs when ignoreFrameCost is set
   - Clear build bonuses after use

5. **server/data/marketCards.ts**
   - Updated all card effect descriptions to match new implementations

6. **server/services/gameStateService.ts**
   - Changed Helmsman starter card effect to '+1 Speed for this launch'

---

## Verification

All 899 tests pass after implementation.
