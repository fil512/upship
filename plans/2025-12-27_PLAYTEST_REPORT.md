# UP SHIP! Playtest Report

*Date: 2025-12-27*
*Game ID: 47fab305-1731-47dc-9dbf-2fd53cb2c294*
*Turns Played: 2 complete turns (planning -> actions -> launch -> income -> cleanup each)*

## Bugs Fixed

All bugs found during this playtest have been resolved:

| Bug | Description | Status |
|-----|-------------|--------|
| BUG-001 | `upgrades` CLI command error | **FIXED** (cli/upship.js) |
| BUG-002 | Income not auto-collected | **FIXED** (server/routes/gameState.js) - requires deploy |
| BUG-003 | COLLECT_INCOME works any phase | **FIXED** (server/routes/gameState.js) - requires deploy |
| BUG-004 | Ship IDs not displayed | **FIXED** (cli/upship.js) |
| BUG-005 | R&D Board not displayed | **FIXED** (cli/upship.js) |

## Summary

Conducted an automated playtest using the CLI tool with 4 test accounts representing all factions (Germany, Britain, USA, Italy). The game successfully progresses through all phases and turns. Core mechanics (buying gas, building ships, drawing cards, recruiting crew, taking loans) work correctly. Several bugs and design issues were discovered that need attention.

## Functionality Testing

### Working Features
- [x] User registration and login
- [x] Game creation, joining, faction selection, and start
- [x] Buy hydrogen gas
- [x] Buy helium gas
- [x] Recruit pilots
- [x] Recruit engineers
- [x] Build ships
- [x] Load gas onto blueprint
- [x] Take a loan
- [x] Draw cards
- [x] End turn transitions correctly to next player
- [x] Phase progression works (planning -> actions -> launch -> income -> cleanup)
- [x] Turn counter increments properly
- [x] Cash validation (prevents actions without sufficient funds)
- [x] CLI session management with multiple concurrent users

### Bugs Found

#### BUG-001: "upgrades" CLI command fails with error
**Severity:** Medium
**Steps to Reproduce:**
1. Start a game and get to actions phase
2. Run: `npm run cli -- <user> upgrades <gameId>`
**Expected:** Display list of available upgrades
**Actual:** Error message: "available is not iterable"
**File:** `cli/upship.js` - upgrades command handler

#### BUG-002: Income not automatically collected during Income phase
**Severity:** Critical
**Steps to Reproduce:**
1. Progress game through all phases to Income phase
2. End turn for all players through Income phase
3. Check cash balances after entering Cleanup phase
**Expected:** Each player should have received their income automatically
**Actual:** Cash balances unchanged. Income must be manually collected via COLLECT_INCOME action
**Impact:** Players can "forget" to collect income, or collect it at wrong times

#### BUG-003: COLLECT_INCOME can be called during any phase
**Severity:** Medium
**Steps to Reproduce:**
1. During Actions phase, run: `npm run cli -- <user> action <gameId> COLLECT_INCOME`
**Expected:** Should only work during Income phase
**Actual:** Works during Actions phase, allowing income collection at wrong time
**Rule Violation:** Income should only be collected during the Income phase per game rules

#### BUG-004: CLI doesn't display ship IDs needed for LAUNCH_SHIP
**Severity:** Medium
**Steps to Reproduce:**
1. Build a ship
2. Try to launch with: `npm run cli -- <user> launch <gameId> <shipId>`
3. Ship ID is unknown - not displayed in state or blueprint commands
**Expected:** Ship IDs should be visible in the state display
**Actual:** Only shows ship count, not individual ship IDs
**Workaround:** None available through CLI

#### BUG-005: CLI doesn't display R&D Board (available technologies)
**Severity:** Medium
**Steps to Reproduce:**
1. Try to acquire a technology
2. Don't know which technologies are available on the R&D board
**Expected:** State or a dedicated command should show available technologies
**Actual:** No visibility into what technologies can be purchased

### Not Tested (Blocked)
- [ ] Launch a ship - blocked by BUG-004 (no visible ship IDs)
- [ ] Install upgrade on blueprint - blocked by BUG-005 (can't see available techs)
- [ ] Remove upgrade from blueprint
- [ ] Claim a route with launched ship
- [ ] Perform hazard check
- [ ] Acquire technology - blocked by BUG-005 (can't see R&D board)

## Rules Adherence

### Correct Implementations
- Phase progression follows correct order: planning -> actions -> launch -> income -> cleanup
- Turn progression works correctly after all phases complete
- Gas market prices increase after purchases (confirmed hydrogen went from 2 to 5)
- Loan mechanic correctly adds 30 cash and reduces income by 3
- Ship building correctly deducts cash based on hull cost
- Crew recruitment has correct costs (pilots 2, engineers 4)

### Rules Violations
1. **COLLECT_INCOME anytime:** The action can be called during any phase, not just Income phase
2. **No automatic income:** Income phase doesn't automatically process income collection
3. **Phase actions not enforced:** Players can potentially take actions from wrong phases

### Missing Mechanics
1. No visible R&D board for technology acquisition
2. No visible ship list with IDs for launching
3. No visible ground board for agent placement
4. No upgrade installation workflow visible in CLI

## Balance Observations

### Faction Performance
| Faction | Cash | Income | Ships | Techs | Assessment |
|---------|------|--------|-------|-------|------------|
| Germany | 1 | 5 | 1 | 2 | Low cash after buying gas |
| Britain | 32 | 2 | 2 | 1 | High cash from loan, low income |
| USA | 6 | 5 | 1 | 1 | Moderate position |
| Italy | 8 | 5 | 1 | 1 | Collected income manually |

### Balance Concerns
- Loan seems very powerful (+30 cash, -3 income) - Britain leveraged this effectively
- Gas market prices spike quickly (hydrogen went from 2 to 5 after purchases)
- No real faction differentiation observed in this short test

### Positive Notes
- Core game loop works end-to-end
- Turn and phase management is solid
- Multiple players can take actions without race conditions
- CLI provides good overview of game state

## Recommendations

### Priority Fixes
1. **Critical:** Auto-collect income during income phase, or restrict COLLECT_INCOME to income phase only
2. **High:** Add ship IDs to state display so ships can be launched
3. **High:** Add R&D board display so technologies can be acquired
4. **Medium:** Fix "upgrades" CLI command error

### Future Testing Needs
- Full game playthrough to age transitions
- Ship launching and route claiming
- Hazard check system
- Technology acquisition and upgrade installation
- Agent placement system
- End game scoring

## Raw Game Log (Last 30 Actions)
```
10:54:17 a.m. | END_TURN | {}
10:54:16 a.m. | END_TURN | {}
10:54:16 a.m. | END_TURN | {}
10:54:15 a.m. | END_TURN | {}
10:53:37 a.m. | COLLECT_INCOME | {}
10:52:42 a.m. | END_TURN | {}
10:52:41 a.m. | DRAW_CARDS | {"count":1}
10:52:41 a.m. | END_TURN | {}
10:52:40 a.m. | DRAW_CARDS | {"count":1}
10:52:39 a.m. | END_TURN | {}
10:52:38 a.m. | DRAW_CARDS | {"count":1}
10:52:38 a.m. | END_TURN | {}
10:52:37 a.m. | DRAW_CARDS | {"count":1}
10:52:20 a.m. | END_TURN | {}
10:52:19 a.m. | END_TURN | {}
10:52:18 a.m. | END_TURN | {}
10:52:18 a.m. | END_TURN | {}
10:52:04 a.m. | END_TURN | {}
10:52:04 a.m. | END_TURN | {}
10:52:03 a.m. | END_TURN | {}
10:52:02 a.m. | END_TURN | {}
10:51:51 a.m. | END_TURN | {}
10:51:51 a.m. | END_TURN | {}
10:51:50 a.m. | END_TURN | {}
10:51:49 a.m. | END_TURN | {}
10:47:00 a.m. | END_TURN | {}
10:46:59 a.m. | BUILD_SHIP | {"count":1}
10:46:58 a.m. | BUY_GAS | {"amount":3,"gasType":"hydrogen"}
10:46:52 a.m. | END_TURN | {}
10:46:51 a.m. | BUY_GAS | {"amount":3,"gasType":"hydrogen"}
```

## Mechanics Test Checklist
- [x] Buy hydrogen gas
- [x] Buy helium gas (if tech available) - USA bought 1 helium successfully
- [x] Recruit pilots
- [x] Recruit engineers
- [x] Build at least one ship (4 ships built total)
- [x] Load gas onto blueprint (2 hydrogen loaded)
- [ ] Launch a ship (requires Lift >= Weight) - BLOCKED: no ship IDs visible
- [x] Take a loan
- [x] Draw cards
- [x] End turn transitions correctly to next player
- [x] Phase progression works (planning -> actions -> launch -> income -> cleanup)
- [x] Turn counter increments properly
- [ ] Install upgrade on blueprint - BLOCKED: can't see available upgrades
- [ ] Remove upgrade from blueprint - NOT TESTED
- [ ] Claim a route with launched ship - BLOCKED: no ships launched
- [ ] Perform hazard check - NOT TESTED
- [ ] Acquire technology - BLOCKED: R&D board not visible
