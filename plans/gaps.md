# Rules Implementation Gaps

Last updated: 2025-12-29

## Summary
- Total gaps found: 10
- Resolved: 9
- Unresolved: 1

## Analysis Progress

### Level 1 - Core Structure
- [ANALYZED 2025-12-29] ROUND_STRUCTURE

---

## Unresolved Gaps

### GAP-009: Turn order calculation missing First Player Token priority
- **Area:** ROUND_STRUCTURE
- **Severity:** LOW
- **Rules:** Section 5.1
- **Code:** server/actions/helpers/turnOrder.js:14-42
- **Issue:** Rules state "The player with the First Player pawn goes first" for turn order. While Ministry grants turn priority, the code doesn't track or apply a First Player token across rounds. First Player should be a persistent state that Ministry can claim, not just a visitor list.
- [ ] Unresolved

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
- **Issue:** Reveal phase resource collection didn't check for or apply `officers` or `cash` reveal bonuses.
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

### GAP-010: Age transition uses TURNS_PER_AGE instead of Progress Track
- **Area:** ROUND_STRUCTURE
- **Severity:** HIGH
- **Rules:** Section 1.3, 12.1
- **Code:** server/actions/helpers/phaseTransition.js:237-239
- **Issue:** Rules say ages transition when Progress Track reaches threshold (12/24/30 for 4 players). But `startNewRound` checked `state.turn > TURNS_PER_AGE`.
- **Fix:** Replaced turn-based age transition with `checkAgeTransitionByProgressTrack()` that uses progressTrack and progressThresholds. Also fixed agentsRemaining reset to use player's actual agent count instead of INITIAL_AGENTS.
- [x] Resolved (2025-12-29)
