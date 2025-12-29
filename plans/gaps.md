# Rules Implementation Gaps

Last updated: 2025-12-29

## Summary
- Total gaps found: 19
- Resolved: 19
- Unresolved: 0

## Analysis Progress

### Level 1 - Core Structure
- [ANALYZED 2025-12-29] ROUND_STRUCTURE
- [ANALYZED 2025-12-29] AGE_TRANSITIONS
- [ANALYZED 2025-12-29] SCORING

---

## Resolved Gaps

### GAP-001: Research Level Track not implemented
- **Area:** ROUND_STRUCTURE
- **Severity:** HIGH
- **Rules:** Section 4.6, 5.1
- **Code:** server/services/gameStateService.js:78-79, server/actions/helpers/phaseTransition.js:79-82
- **Issue:** Rules state players have a Research Level Track (starting at 0) that provides base Research when revealing. The code used `playerState.research` as a token pool instead.
- **Fix:** Added `researchLevel` property to player state, updated `collectRevealResources` to use Research Level + Engineers + card bonuses formula.
- [x] Resolved (2025-12-29)

---

### GAP-002: Research Institute location action incorrect
- **Area:** ROUND_STRUCTURE
- **Severity:** HIGH
- **Rules:** Section 6.1
- **Code:** server/data/groundBoard.js:17-23
- **Issue:** Rules say Research Institute costs £4 per level to increase Research Level Track by 1. Code showed "£3 per Research point" with wrong action type.
- **Fix:** Changed cost from 3 to 4, changed action type to 'UPGRADE_RESEARCH_LEVEL'.
- [x] Resolved (2025-12-29)

---

### GAP-003: Starter deck composition wrong
- **Area:** ROUND_STRUCTURE
- **Severity:** MEDIUM
- **Rules:** Section 11.3
- **Code:** server/services/gameStateService.js:142-161
- **Issue:** Rules specify 10 cards: 3 Wrench, 3 Coin, 3 Propeller, 1 Any with specific cards. Code created wrong distribution with missing cards (Rigger, Clerk, Investor, Navigator).
- **Fix:** Updated createStarterDeck() to include all 10 correct cards per Section 11.3.
- [x] Resolved (2025-12-29)

---

### GAP-004: Income calculation subtracts Engineers from Income (wrong formula)
- **Area:** ROUND_STRUCTURE
- **Severity:** HIGH
- **Rules:** Section 5.2
- **Code:** server/actions/helpers/phaseTransition.js:121-172
- **Issue:** Rules say: "Gain £ equal to your Income Track minus Engineers in Barracks (each Engineer costs £1 upkeep)". The code paid Engineer upkeep BEFORE collecting income as separate transactions.
- **Fix:** Changed to calculate net income (income - upkeep) as single value, matching rules semantics.
- [x] Resolved (2025-12-29)

---

### GAP-005: Reveal phase does not process card reveal icons
- **Area:** ROUND_STRUCTURE
- **Severity:** HIGH
- **Rules:** Section 5.1
- **Code:** server/actions/helpers/phaseTransition.js:51-112
- **Issue:** The `collectRevealResources` function checked for `card.revealBonus` but starter deck uses `card.reveal` property.
- **Fix:** Updated to check for both `card.reveal` and `card.revealBonus` properties.
- [x] Resolved (2025-12-29)

---

### GAP-006: Officers and cash reveal icons not implemented
- **Area:** ROUND_STRUCTURE
- **Severity:** MEDIUM
- **Rules:** Section 5.1, 11.3
- **Code:** server/actions/helpers/phaseTransition.js:51-112
- **Issue:** Reveal phase resource collection didn't check for or apply `cash`, `officers`, or `engineers` reveal bonuses.
- **Fix:** Added handling for `cash`, `officers`, and `engineers` reveal bonuses.
- [x] Resolved (2025-12-29)

---

### GAP-007: Third Agent not granted at Officer Income +3
- **Area:** ROUND_STRUCTURE
- **Severity:** MEDIUM
- **Rules:** Section 5.1, 6.6
- **Code:** server/actions/crew.js:67-97
- **Issue:** Rules state "When your Officer Income Track reaches +3, immediately gain your 3rd Agent." The code never checked for this milestone.
- **Fix:** Added milestone check in processUpgradeOfficerIncome() to grant 3rd agent when officerIncome >= 3 and agents < 3.
- [x] Resolved (2025-12-29)

---

### GAP-008: Players start with 3 agents instead of 2
- **Area:** ROUND_STRUCTURE
- **Severity:** MEDIUM
- **Rules:** Section 2.1, 3.2
- **Code:** server/services/gameStateService.js:77, server/config/constants.js:18
- **Issue:** Rules say "2 Agent Tokens (3rd can be earned)". Code set `agents: 3` and `INITIAL_AGENTS = 3`.
- **Fix:** Changed agents from 3 to 2, updated INITIAL_AGENTS constant to 2.
- [x] Resolved (2025-12-29)

---

### GAP-009: Turn order calculation missing First Player Token priority
- **Area:** ROUND_STRUCTURE
- **Severity:** LOW
- **Rules:** Section 5.1
- **Code:** server/actions/helpers/turnOrder.js:14-42
- **Issue:** Rules state "The player with the First Player pawn goes first" for turn order. While Ministry grants turn priority, the code didn't track or apply a First Player token across rounds. First Player should be a persistent state that Ministry can claim, not just a visitor list.
- **Fix:** Updated calculateTurnOrder() to check for `state.firstPlayer` token holder and give them priority. Ministry visitors claim the token which persists across rounds.
- [x] Resolved (2025-12-29)

---

### GAP-010: Age transition uses TURNS_PER_AGE instead of Progress Track
- **Area:** ROUND_STRUCTURE
- **Severity:** HIGH
- **Rules:** Section 1.3, 12.1
- **Code:** server/actions/helpers/phaseTransition.js:237-239
- **Issue:** Rules say ages transition when Progress Track reaches threshold (12/24/30 for 4 players). But `startNewRound` checked `state.turn > TURNS_PER_AGE`.
- **Fix:** Replaced turn-based age transition with `checkAgeTransitionByProgressTrack()` that uses progressTrack and progressThresholds. Also fixed agentsRemaining reset to use player's actual agent count instead of INITIAL_AGENTS.
- [x] Resolved (2025-12-29)

---

### GAP-011: VP scoring doesn't happen at Age transitions
- **Area:** AGE_TRANSITIONS
- **Severity:** HIGH
- **Rules:** Section 12.1, 12.2
- **Code:** server/actions/technology.js:44-70
- **Issue:** Rules state "Score VP: All players score VP for routes and Technologies" when transitioning between ages (step 1 of Section 12.1). However, the `checkAgeTransition()` function only changed the age number, added technologies, and reset gas market. VP scoring only happened at game end.
- **Fix:** Created new `server/actions/helpers/ageTransition.js` with `performAgeTransition()` that scores VP for all players. Integrated into `checkAgeTransition()`.
- [x] Resolved (2025-12-29)

---

### GAP-012: Ship and Officer recovery at age transitions not implemented
- **Area:** AGE_TRANSITIONS
- **Severity:** HIGH
- **Rules:** Section 12.1 step 2
- **Code:** server/actions/technology.js:44-70
- **Issue:** Rules say "Recover Ships and Officers: Remove current Map. All ships return to player supplies. As you return ships, add officers to supply (1 officer per Age 1 ship, 2 officers per Age 2 ship). Maximum 3 ships returned due to hangar capacity." No code implements this.
- **Fix:** Added `recoverShipsAndOfficers()` function in ageTransition.js that returns ships to hangar (max 3), recovers officers based on ship age, and handles lost ships exceeding capacity.
- [x] Resolved (2025-12-29)

---

### GAP-013: Transition income calculation missing
- **Area:** AGE_TRANSITIONS
- **Severity:** HIGH
- **Rules:** Section 12.1 step 3
- **Code:** server/actions/technology.js:44-70
- **Issue:** Rules say "Calculate Transition Income: New Income = (£ from Technology tiles) − (£1 × routes lost). Minimum £0." No code calculates this income adjustment at age transitions.
- **Fix:** Added `calculateTransitionIncome()` function that applies route loss penalty to income.
- [x] Resolved (2025-12-29)

---

### GAP-014: Blueprint slot expansion at age transitions missing
- **Area:** AGE_TRANSITIONS
- **Severity:** HIGH
- **Rules:** Section 12.1 step 4, 13.5
- **Code:** server/actions/technology.js:44-70, server/services/gameStateService.js:99-140
- **Issue:** Rules say "Replace Blueprint: Install new Age's Blueprint overlay. Transfer Upgrades to new Blueprint." Section 13.5 specifies slots per age (e.g., Age II: 1/1/2/2, Age III: 2/2/2/3 for most factions). Blueprint slots are never expanded - no code adds slots when age changes.
- **Fix:** Added `expandBlueprintSlots()` function with `BLUEPRINT_SLOTS` configuration defining slot counts per age. Preserves existing upgrades while expanding slots.
- [x] Resolved (2025-12-29)

---

### GAP-015: Britain's Red Tape flaw not implemented at age transitions
- **Area:** AGE_TRANSITIONS
- **Severity:** MEDIUM
- **Rules:** Section 13.2
- **Code:** server/actions/technology.js:44-70, server/services/gameStateService.js:24-30
- **Issue:** Rules state "The Flaw — Red Tape: At each Age Transition, reduce your Income Track by 1." The code only sets `upgradeSwaps: 1` but never reduces Britain's income at age transitions.
- **Fix:** Added `applyBritainRedTape()` function called during age transitions that reduces income by 1 for Britain faction (minimum 0).
- [x] Resolved (2025-12-29)

---

### GAP-016: Hindenburg Disaster game end condition not implemented
- **Area:** AGE_TRANSITIONS
- **Severity:** HIGH
- **Rules:** Section 1.2
- **Code:** server/actions/hazard.js:16-125
- **Issue:** Rules say "The game ends immediately when... The Hindenburg Disaster: A Catastrophic Explosion destroys a ship during a Luxury Launch in Age III while using Hydrogen." The hazard check didn't check for Age III, Hydrogen gas type, or Luxury launch, and didn't trigger game end under these conditions.
- **Fix:** Added `checkHindenburgDisaster()` function that checks all four conditions (Age III, Hydrogen, Luxury route, Catastrophic Explosion). When triggered, sets `state.hindenburgDisaster = true` and `state.gameEndReason = 'hindenburg_disaster'`.
- [x] Resolved (2025-12-29)

---

### GAP-017: Technology VP calculation incorrect
- **Area:** AGE_TRANSITIONS
- **Severity:** MEDIUM
- **Rules:** Section 12.2
- **Code:** server/actions/scoring.js:49-52
- **Issue:** Rules say score "VP printed on each Technology tile" (Essential=0 VP, Useful=1 VP, Niche=2-3 VP). Code used `Math.floor(playerState.technologies.length / 2)` which is completely different formula.
- **Fix:** Added `calculateTechnologyVPForScoring()` function that looks up actual VP values from TECHNOLOGY_BAG definitions. Updated `processCalculateScores()` to use this instead of the incorrect formula.
- [x] Resolved (2025-12-29)

---

### GAP-018: Tiebreakers not implemented in final scoring
- **Area:** SCORING
- **Severity:** MEDIUM
- **Rules:** Section 1.1
- **Code:** server/actions/scoring.js:76-79
- **Issue:** Rules specify tiebreakers in order: 1) Highest Income Track position, 2) Most Cash on hand, 3) Most ships currently on routes. Code just sorted by total VP with `.sort((a, b) => b[1].total - a[1].total)` without any tiebreaker logic.
- **Fix:** Added `applyTiebreakers()` function that properly sorts by VP first, then applies all three tiebreakers in order.
- [x] Resolved (2025-12-29)

---

### GAP-019: Final scoring includes incorrect VP sources
- **Area:** SCORING
- **Severity:** MEDIUM
- **Rules:** Section 1.1, 12.2
- **Code:** server/actions/scoring.js:54-63
- **Issue:** Code awarded VP for cash (`Math.floor(cash / 10)`) and ships on routes (`shipsOnRoutes * 2`). Rules only specify VP from routes and technologies. Cash and ships on routes are tiebreakers, not VP sources.
- **Fix:** Removed cash and ships from VP calculation in `processCalculateScores()`. They are now only used for tiebreaker logic.
- [x] Resolved (2025-12-29)
