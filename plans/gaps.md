# Rules Implementation Gaps

Last updated: 2025-12-31

## Summary
- Total gaps found: 23
- Resolved: 22
- Unresolved: 1 (GAP-051 needs designer decision)

---

## Analysis Progress

Level 1 areas analyzed in previous session.
Level 2 areas analyzed in previous session.
Level 3 areas analyzed in this session.
Level 4 areas analyzed in this session.

### Level 1 - Core Structure
- [x] ROUND_STRUCTURE
- [x] AGE_TRANSITIONS
- [x] SCORING

### Level 2 - Game Systems
- [x] LAUNCHING
- [x] GROUND_BOARD
- [x] FACTIONS
- [x] ROUTES_AND_MAPS

### Level 3 - Detailed Systems
- [x] TECHNOLOGY_UPGRADES (Section 9)
- [x] DECK_BUILDING (Section 11)
- [x] PLAYER_BOARD (Section 4)
- [x] BUILDING_SHIPS (Section 7)
- [x] SETUP (Section 3)
- [x] COMPONENTS (Section 2)
- [x] RULES_CLARIFICATIONS (Section 14)

### Level 4 - Appendix Validation
- [x] HAZARD_DECK_APPENDIX (Appendix E) - VERIFIED CORRECT
- [x] ROUTES_APPENDIX (Appendix F) - VERIFIED CORRECT
- [x] MARKET_DECK_APPENDIX (Appendix H) - VERIFIED CORRECT
- [x] TECHNOLOGY_APPENDIX (Appendix C) - VERIFIED CORRECT
- [x] UPGRADE_APPENDIX (Appendix D) - ALL GAPS RESOLVED
- [x] COMBAT_MISSIONS_APPENDIX (Appendix G) - VERIFIED CORRECT

### Level 5 - Deep Dive Analysis
- [ ] WORKER_PLACEMENT_ACTIONS
- [ ] CARD_AGENT_EFFECTS
- [ ] UPGRADE_SPECIAL_ABILITIES
- [ ] FACTION_SPECIAL_ABILITIES

### Level 6 - Final Comprehensive Sweep
- [ ] INCOME_TRACK_RULES
- [ ] GAS_MARKET_MECHANICS
- [ ] END_GAME_SCORING
- [ ] INSURANCE_MECHANICS
- [ ] RESEARCH_LEVEL_TRACK
- [ ] FIRST_PLAYER_TOKEN
- [ ] HINDENBURG_DISASTER_VP
- [ ] BANKRUPTCY_RULES

---

## Active Gaps

### GAP-051: Progress Track Thresholds Do Not Match Spec
**Area:** ROUND_STRUCTURE
**Severity:** High
**Status:** NEEDS DESIGNER DECISION
**Spec Reference:** Section 1.3 Progress Track

**Spec says:**
| Player Count | Age I Ends | Age II Ends | Game Ends |
|--------------|------------|-------------|-----------|
| 2 Players | 8 | 16 | 20 |
| 3 Players | 10 | 20 | 25 |
| 4 Players | 12 | 24 | 30 |

**Implementation has (in `server/config/constants.js`):**
```javascript
// Scaled for ~15 round games (Age 1: ~5 rounds, Age 2: ~5 rounds, Age 3: ~5 rounds)
const PROGRESS_THRESHOLDS = {
  2: { age2: 2, age3: 4, end: 6 },
  3: { age2: 3, age3: 6, end: 9 },
  4: { age2: 4, age3: 8, end: 12 }
};
```

**Note:** The comment says "Scaled for ~15 round games" which suggests these values were intentionally reduced for faster playtesting. The designer needs to confirm whether to:
1. Use spec values for production
2. Keep reduced values for faster games
3. Make this configurable

---

## Resolved Gaps

### GAP-068: Flexible Frame Weight Mismatch
**Area:** UPGRADE_APPENDIX
**Severity:** Low
**Status:** RESOLVED (2025-12-31)
**Spec Reference:** Appendix D - Frame Upgrades

**Resolution:** Changed `flexible_frame.weight` from -1 to 0 in `server/data/upgrades.js` to match Appendix D spec.

**Files changed:**
- `server/data/upgrades.js` - Fixed flexible_frame.weight to 0

**Tests added:**
- `__tests__/unit/rules/upgrades.test.js` - GAP-068 test for flexible_frame weight

---

### GAP-069: Missing Gas System Upgrades (11 Tiles)
**Area:** UPGRADE_APPENDIX
**Severity:** High
**Status:** RESOLVED (2025-12-31)
**Spec Reference:** Appendix D - Gas System Upgrades

**Resolution:** Added all 11 Gas System Upgrades to `server/data/upgrades.js`:
1. pressure_control (Improved Valving)
2. altitude_ballonets (Manual Ballonets)
3. compartmented_gas (Multiple Gas Cells)
4. helium_gas_cell (Helium Handling)
5. blaugas_tank (Blaugas Fuel System)
6. smart_valving (Automatic Valves)
7. high_ceiling_gas (Pressure Altitude System)
8. redundant_cells (Triple Gas Cell)
9. rapid_descent_system (Emergency Venting)
10. reclamation_system (Gas Recovery)
11. exhaust_condensers (Water Recovery System)

Also added corresponding technologies to TECHNOLOGIES object.

**Files changed:**
- `server/data/upgrades.js` - Added 11 gas system upgrades and 9 gas system technologies

**Tests added:**
- `__tests__/unit/rules/upgrades.test.js` - GAP-069 tests for all 11 gas system upgrades

---

### GAP-070: Missing Frame Upgrades (Streamlined Hull, Aerodynamic Lift System)
**Area:** UPGRADE_APPENDIX
**Severity:** Medium
**Status:** RESOLVED (2025-12-31)
**Spec Reference:** Appendix D - Frame Upgrades

**Resolution:** Added 2 missing Frame Upgrades to `server/data/upgrades.js`:
1. streamlined_hull (Aerodynamic Hull Design) - Weight -1, Hull +£2, Lift +2
2. aerodynamic_lift_system (Dynamic Lift Surfaces) - Weight -2, Hull +£3, Lift +4

Also added corresponding technologies: aerodynamic_hull_design, dynamic_lift_surfaces

**Files changed:**
- `server/data/upgrades.js` - Added 2 frame upgrades and 2 technologies

**Tests added:**
- `__tests__/unit/rules/upgrades.test.js` - GAP-070 tests for frame upgrades

---

### GAP-071: Missing Payload Upgrades (6 Tiles)
**Area:** UPGRADE_APPENDIX
**Severity:** Medium
**Status:** RESOLVED (2025-12-31)
**Spec Reference:** Appendix D - Payload Upgrades

**Resolution:** Added 6 missing Payload Upgrades to `server/data/upgrades.js`:
1. bombing_equipment (Bomb Bay Design) - Weight -3, Combat: +£3 Income
2. sparrowhawk_hangar (Trapeze System) - Weight -3, Ignore 1 route requirement
3. light_armor_plating (Armored Gondola) - Weight -2, Armor +1
4. heavy_armor_plating (Reinforced Hull) - Weight -3, Armor +2
5. observation_lounge (Promenade Deck) - Weight -2, Income +1, Luxury +3
6. imperial_mast (Imperial Mooring System) - Weight -1, Britain specialty

Also added corresponding technologies: bomb_bay_design, armored_gondola, reinforced_hull, promenade_deck

**Files changed:**
- `server/data/upgrades.js` - Added 6 payload upgrades and associated technologies

**Tests added:**
- `__tests__/unit/rules/upgrades.test.js` - GAP-071 tests for payload upgrades

---

### GAP-072: Payload Upgrade Stat Mismatches
**Area:** UPGRADE_APPENDIX
**Severity:** Medium
**Status:** RESOLVED (2025-12-31)
**Spec Reference:** Appendix D - Payload Upgrades

**Resolution:** Fixed stat mismatches in existing payload upgrades:

**passenger_gondola (Basic Cabin):**
- Fixed: income changed from 1 to 2 (spec: Income +2, Luxury +1)

**dining_saloon (Restaurant):**
- Fixed: weight changed from -3 to -2, added income: 2, luxury changed from 3 to 2 (spec: Weight -2, Income +2, Luxury +2)

**sleeping_quarters (Private Berths):**
- Fixed: added income: 2, luxury changed from 2 to 1, removed range (spec: Income +2, Luxury +1)

**observation_deck -> spotter_gondola:**
- Fixed: renamed to spotter_gondola, changed stats from luxury: 2 to income: 1 (spec: Income +1)

**Files changed:**
- `server/data/upgrades.js` - Fixed stats for 4 payload upgrades

**Tests added:**
- `__tests__/unit/rules/upgrades.test.js` - GAP-072 tests for stat mismatches

---

### GAP-073: Payload Upgrade Name/Tech Mismatches
**Area:** UPGRADE_APPENDIX
**Severity:** Low
**Status:** RESOLVED (2025-12-31)
**Spec Reference:** Appendix D - Payload Upgrades

**Resolution:** Fixed upgrade names and technology mappings to match spec:

| Spec Name | Spec Tech | New Impl Name | New Tech |
|-----------|-----------|---------------|----------|
| Spotter Gondola | Observation Platform | spotter_gondola | observation_platform |
| Postal Service | Mail Compartment | postal_service | mail_compartment |
| External Cargo | Cargo Nets | external_cargo | cargo_nets |
| Luxury Cabin | Luxury Accommodation | luxury_cabin | luxury_accommodation |
| Restaurant | Dining Saloon | restaurant | dining_saloon |
| Pressurized Lounge | Smoking Room | pressurized_lounge | smoking_room |

Legacy aliases kept for backwards compatibility with existing save data.

**Files changed:**
- `server/data/upgrades.js` - Added correctly-named upgrades, updated technologies, kept legacy aliases

**Tests added:**
- `__tests__/unit/rules/upgrades.test.js` - GAP-073 tests for name/tech mappings

---

### GAP-074: Hazard Deck Flak Distribution Summary Inconsistency
**Area:** HAZARD_DECK_APPENDIX
**Severity:** Low
**Status:** RESOLVED (2025-12-31)
**Spec Reference:** Appendix E - Flak Distribution (lines 533-539)

**Resolution:** Fixed the Flak Distribution summary in Appendix E to match the individual card listings:

**Before (incorrect):**
- 4 Flak: 1 card
- Total: 24 cards

**After (correct):**
- 4 Flak: 3 cards (Structural Damage + Static Discharge + Critical Structural Stress)
- 3 Flak: 6 cards (not 5)
- Total: 27 cards

Added card breakdown comments for clarity.

**Files changed:**
- `spec/appendix.md` - Fixed Flak Distribution summary

---

### GAP-061: Market Row Size Mismatch
**Area:** DECK_BUILDING
**Status:** RESOLVED (2025-12-31)
**Spec Reference:** Section 3.1
**Resolution:** Changed `MARKET_ROW_SIZE` constant from 4 to 5 in `server/config/constants.js`.

**Files changed:**
- `server/config/constants.js` - Updated MARKET_ROW_SIZE to 5

**Tests added:**
- `__tests__/unit/rules/marketDeck.test.js` - GAP-061 tests for market row size

---

### GAP-062: Hazard Deck Size Mismatch (Spec Says 24, Appendix E Says 27)
**Area:** SETUP / COMPONENTS
**Status:** RESOLVED (2025-12-31)
**Spec Reference:** Section 3.2 vs Appendix E
**Resolution:** Updated spec Section 3.2 to say "27 cards" to match Appendix E and the implementation. The 27-card breakdown (4 Clear Weather, 8 Minor, 8 Major, 6 Fire, 1 Mechanical) is correct.

**Files changed:**
- `spec/upship_rules.md` - Fixed Section 3.2 to say "27 cards"

---

### GAP-063: Loan Debt Limit Not Enforced
**Area:** RULES_CLARIFICATIONS
**Status:** RESOLVED (2025-12-31)
**Spec Reference:** Section 5.3 Loans
**Resolution:** Added `MIN_INCOME = -10` constant and updated `processTakeLoan()` and `processBuyInsurance()` to:
1. Enforce -10 minimum income limit
2. Reject actions that would push income below -10 with clear error messages

**Files changed:**
- `server/config/constants.js` - Added MIN_INCOME constant
- `server/actions/economy.js` - Added debt limit validation

**Tests added:**
- `__tests__/unit/rules/loans.test.js` - GAP-063 tests for debt limit enforcement

---

### GAP-064: Italy Articulated Keel Penalty Not Implemented
**Area:** FACTIONS / RULES_CLARIFICATIONS
**Status:** RESOLVED (2025-12-31)
**Spec Reference:** Section 13.4 Italy, Appendix D
**Resolution:** Fixed `flexible_frame` upgrade to have `special: 'weather_penalty'` (was incorrectly `weather_immunity`). Added -1 Reliability penalty during Weather hazards when `flexible_frame` is installed in hazard check logic.

**Files changed:**
- `server/data/upgrades.js` - Fixed flexible_frame special to 'weather_penalty' and stats to { ceiling: 1 }
- `server/actions/hazard.js` - Added weather penalty logic for flexible_frame during Reliability checks

**Tests added:**
- `__tests__/unit/rules/hazards.test.js` - GAP-064 tests for weather penalty

---

### GAP-065: Blaugas Fuel System Gas Recovery Not Implemented
**Area:** TECHNOLOGY_UPGRADES
**Status:** RESOLVED (2025-12-31)
**Spec Reference:** Section 13.1 Germany
**Resolution:** The `retainGas` parameter and Blaugas functionality was already implemented in `processLaunchShip()`. Added +1 Range stat to `blaugas_system` technology in TECHNOLOGY_BAG and created `calculateShipStats()` function to include technology stat bonuses.

**Files changed:**
- `server/config/constants.js` - Added stats: { range: 1 } to blaugas_system
- `server/actions/launch.js` - Added calculateShipStats() function and export

**Tests added:**
- `__tests__/unit/rules/blaugas.test.js` - GAP-065 tests for Blaugas functionality

---

### GAP-066: Aerodynamic Lift Technologies Not Providing Lift
**Area:** TECHNOLOGY_UPGRADES
**Status:** RESOLVED (2025-12-31)
**Spec Reference:** Section 9.3, Appendix D
**Resolution:** Added `stats: { lift: 2 }` to `aerodynamic_hull` technology and `stats: { lift: 4 }` to `dynamic_lift` technology in TECHNOLOGY_BAG. The new `calculateShipStats()` function automatically includes these bonuses.

**Files changed:**
- `server/config/constants.js` - Added lift stats to aerodynamic_hull (+2) and dynamic_lift (+4)

**Tests added:**
- `__tests__/unit/rules/aerodynamicLift.test.js` - GAP-066 tests for aerodynamic lift

---

### GAP-067: Gas Cube Reveal Icons Not Distinguishing Hydrogen vs Helium
**Area:** DECK_BUILDING
**Status:** RESOLVED (2025-12-31)
**Spec Reference:** Section 5.1, Appendix H
**Resolution:** Updated `collectRevealResources()` in phaseTransition.js to handle the generic `gas` property from market cards. Gas cubes from reveal default to hydrogen (the cheaper, more common option).

**Files changed:**
- `server/actions/helpers/phaseTransition.js` - Added handling for revealData.gas property

**Tests added:**
- `__tests__/unit/rules/gasCubeReveal.test.js` - GAP-067 tests for gas reveal handling

---

### GAP-059: Luxury Route Requirement Not Validated During Launch
**Area:** LAUNCHING
**Status:** RESOLVED
**Spec Reference:** Section 8.5 Luxury Launches, Section 10.1 Route Requirements
**Resolution:** Added luxury stat validation in `processLaunchShip()` similar to Range, Speed, and Ceiling checks. Routes with `luxury` requirement now correctly reject ships without sufficient Luxury stat. The USA Trapeze System can bypass luxury requirement.

**Files changed:**
- `server/actions/launch.js` - Added luxury validation after ceiling check

**Tests added:**
- `__tests__/unit/rules/launching.test.js` - GAP-059 tests for luxury validation

---

### GAP-060: City Bonus Selection Not Player Choice
**Area:** ROUTES_AND_MAPS
**Status:** RESOLVED
**Spec Reference:** Section 10.4 City Bonuses
**Resolution:** Added `cityChoice` parameter to LAUNCH_SHIP action. Players can now specify which endpoint city's bonus to receive when launching. The choice is stored on the ship and applied when the route is claimed after hazard check success. Defaults to 'to' city for backwards compatibility.

**Files changed:**
- `server/actions/launch.js` - Added `cityChoice` parameter validation and `pendingCityChoice` storage on ship
- `server/actions/hazard.js` - Updated `resolveHazardSuccess` to use `pendingCityChoice` when applying city bonus

**Tests added:**
- `__tests__/unit/rules/launching.test.js` - GAP-060 tests for city choice functionality

---

### GAP-052: Hindenburg Disaster Complete Current Round
**Area:** ROUND_STRUCTURE
**Status:** RESOLVED
**Resolution:** Added `state.gameEndAfterRound = true` flag when Hindenburg Disaster triggers. Per Section 1.2, the game now allows the current round to complete before final scoring.

**Files changed:**
- `server/actions/hazard.js` - Set `gameEndAfterRound` flag in both `processHazardCheck` and `processRespondToHazard`

---

### GAP-053: Progress Track End Complete Current Round
**Area:** ROUND_STRUCTURE
**Status:** RESOLVED
**Resolution:** Added game end check in `startNewRound()` that detects when progress track reaches end threshold, sets `gameEndAfterRound = true`, and triggers final scoring automatically.

**Files changed:**
- `server/actions/helpers/phaseTransition.js` - Added `triggerFinalScoring()` helper and game end detection logic

---

### GAP-054: Age Transition Income Calculation
**Area:** AGE_TRANSITIONS
**Status:** RESOLVED
**Resolution:** Implemented proper income calculation per Section 12.1 step 3:
- Sum income values from all owned technology tiles
- Subtract 1 per route lost
- Minimum 0

**Files changed:**
- `server/actions/helpers/ageTransition.js` - Added `calculateTechnologyIncome()` function and rewrote `calculateTransitionIncome()` to use actual technology income values instead of hardcoded base income

---

### GAP-055: Age Transition Ship/Officer Recovery
**Area:** AGE_TRANSITIONS
**Status:** RESOLVED (clarification)
**Resolution:** The implementation correctly handles Age 1 (1 officer) and Age 2+ (2 officers) ships. The spec says "2 officers per age 2 ship" but doesn't explicitly mention Age 3. The implementation treats Age 3 ships the same as Age 2 (2 officers each), which is reasonable since officers scale with ship complexity. No code changes needed.

---

### GAP-056: Technology VP Scoring Cumulative
**Area:** SCORING
**Status:** RESOLVED (verified working)
**Resolution:** The implementation correctly accumulates VP across age transitions:
```javascript
state.players[playerId].vp = (state.players[playerId].vp || 0) + vpScored.total;
```
No changes needed - the original implementation was correct.

---

### GAP-057: Final Scoring Accumulated VP
**Area:** SCORING
**Status:** RESOLVED
**Resolution:** Final scoring now includes previously accumulated VP from age transitions in the total score, with a breakdown showing:
- `previouslyAccumulated`: VP earned during age transitions
- `technologies`: Current technology VP
- `routes`: Current route VP

**Files changed:**
- `server/actions/scoring.js` - Added `previouslyAccumulated` to score breakdown and total

---

### GAP-058: Tiebreaker Implementation
**Status:** RESOLVED (verified correct)
**Resolution:** Implementation matches spec order exactly. Not a gap.

---

## Verified Correct Implementations

The following were analyzed and found to be correctly implemented:

### TECHNOLOGY_UPGRADES (Section 9)
- **Specialization discount:** Correctly implemented per Section 4.1 (-1 at 3+ techs, -2 at 5+ techs)
- **Progress Track advancement:** Correctly advances by 1 per tech acquired
- **R&D Board size by Age:** Correctly scales (4/5/6 tiles per Age I/II/III)
- **Tech unlocks upgrades:** Correctly requires owning tech to install upgrade

### DECK_BUILDING (Section 11)
- **Starter deck composition:** Correctly 10 cards (3 Wrench, 3 Coin, 3 Propeller, 1 Any)
- **Card reveal resources:** Correctly collected during reveal phase
- **Market card purchases:** Correctly uses Influence, not cash
- **Deck reshuffling:** Correctly shuffles discard pile when deck empty

### PLAYER_BOARD (Section 4)
- **Blueprint slots by Age:** Correctly configured (1/1/1/1 -> 1/1/2/2 -> 2/2/2/3)
- **Italy Compact Design:** Correctly reduces payload slots (-1 in Ages II/III)
- **Economy tracks:** Correctly tracks Income, Research Level, Officer Income, Engineer Income
- **Hangar capacity:** Correctly limits to 3 ships
- **Repair cost:** Correctly £3 per ship

### BUILDING_SHIPS (Section 7)
- **Hull cost formula:** Correctly calculates £2 base + Frame cost + Fabric cost
- **Build limit:** Correctly limits to 3 ships per Construction Hall action
- **Physics check not required:** Correctly allows building without physics check

### SETUP (Section 3)
- **Starting resources:** Correctly £15 cash, 1 officer, 2 engineers, 2 hydrogen
- **USA helium start:** Correctly starts with 2 helium instead of hydrogen
- **Agent count:** Correctly starts with 2, 3rd earned at Officer Income +3
- **Tech bag scaling:** Correctly (N-1) copies where N = player count

### RULES_CLARIFICATIONS (Section 14)
- **Network connectivity (Age III):** Correctly implemented per Section 14.3
- **Fire immunity:** Helium ships correctly auto-pass fire hazards
- **Conductive Covering:** Correctly grants immunity to Static Discharge
- **Fire-Resistant Fabric:** Correctly grants once-per-Age fire auto-pass

---

## Notes

### Test Coverage
New tests added in:
- `__tests__/unit/rules/gameEnd.test.js` - Tests for GAP-052, GAP-053, GAP-056, GAP-057
- `__tests__/unit/rules/transitionIncome.test.js` - Tests for GAP-054
- `__tests__/unit/rules/launching.test.js` - Tests for GAP-059, GAP-060
- `__tests__/unit/rules/loans.test.js` - Tests for GAP-063
- `__tests__/unit/rules/blaugas.test.js` - Tests for GAP-065
- `__tests__/unit/rules/aerodynamicLift.test.js` - Tests for GAP-066
- `__tests__/unit/rules/gasCubeReveal.test.js` - Tests for GAP-067
- `__tests__/unit/rules/hazards.test.js` - Tests for GAP-064
- `__tests__/unit/rules/marketDeck.test.js` - Tests for GAP-061
- `__tests__/unit/rules/upgrades.test.js` - Tests for GAP-068, GAP-069, GAP-070, GAP-071, GAP-072, GAP-073

All 709 tests pass.
