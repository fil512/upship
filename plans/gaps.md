# Rules Implementation Gaps

Last updated: 2025-12-31

## Summary
- Total gaps found: 7
- Resolved: 6
- Unresolved: 1 (needs designer decision)

---

## Analysis Progress

Level 1 areas analyzed in this session.

### Level 1 - Core Structure
- [x] ROUND_STRUCTURE
- [x] AGE_TRANSITIONS
- [x] SCORING

### Level 2 - Game Systems
- [ ] LAUNCHING
- [ ] GROUND_BOARD
- [ ] FACTIONS
- [ ] ROUTES_AND_MAPS

### Level 3 - Detailed Systems
- [ ] TECHNOLOGY_UPGRADES (Section 9)
- [ ] DECK_BUILDING (Section 11)
- [ ] PLAYER_BOARD (Section 4)
- [ ] BUILDING_SHIPS (Section 7)
- [ ] SETUP (Section 3)
- [ ] COMPONENTS (Section 2)
- [ ] RULES_CLARIFICATIONS (Section 14)

### Level 4 - Appendix Validation
- [ ] HAZARD_DECK_APPENDIX (Appendix D/E)
- [ ] ROUTES_APPENDIX (Appendix F)
- [ ] MARKET_DECK_APPENDIX (Appendix G/H)
- [ ] TECHNOLOGY_APPENDIX (Appendix C)
- [ ] UPGRADE_APPENDIX (Appendix D)

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

## Notes

### Test Coverage
New tests added in:
- `__tests__/unit/rules/gameEnd.test.js` - Tests for GAP-052, GAP-053, GAP-056, GAP-057
- `__tests__/unit/rules/transitionIncome.test.js` - Tests for GAP-054

All 604 tests pass.
