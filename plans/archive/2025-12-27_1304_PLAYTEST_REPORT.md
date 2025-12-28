# UP SHIP! Playtest Report

*Date: 2025-12-27*
*Game ID: b88b4754-c9d5-4e8e-956f-8bf338772ae3*
*Turns Played: 13 turns (game ended via CALCULATE_SCORES)*
*Final Result: Germany wins with 4 VP*

## Summary

This playtest ran a full game from start to end across all 4 factions. The game completed 13 turns but remained stuck in Age 1 the entire time due to the R&D board depleting without refilling from the tech bag. The game was manually ended by triggering CALCULATE_SCORES. Several significant bugs were discovered that prevent normal game progression.

**Critical Finding:** The game cannot naturally progress through ages or reach a proper end state. Age transitions depend on the progress track, which only advances through technology acquisition, but the R&D board empties quickly and doesn't refill.

## Functionality Testing

### Working Features
- **Session Management:** Login, session storage, multiple simultaneous users
- **Game Lobby:** Create game, join game, faction selection, game start
- **Planning Phase:** Draw cards, end turn
- **Actions Phase:**
  - BUY_GAS (hydrogen) - correctly deducts cash, adds cubes, increases market price
  - RECRUIT_CREW (pilot and engineer) - correctly deducts cash
  - BUILD_SHIP - creates ships in hangar
  - TAKE_LOAN - grants £30, reduces income by 3
  - LOAD_GAS - loads gas cubes to blueprint sockets
  - INSTALL_UPGRADE - adds upgrade to blueprint slot
  - REMOVE_UPGRADE - removes upgrade from blueprint slot
  - ACQUIRE_TECHNOLOGY - purchases tech from R&D board
- **Launch Phase:** Players can end turn
- **Income Phase:** Auto-collects income (£ + pilots + engineers) for all players
- **Cleanup Phase:** Properly transitions to next turn
- **Turn/Round Progression:** Correctly increments turn counter, resets round, cycles phases
- **Player Order:** Maintains consistent turn order across phases
- **Score Calculation:** CALCULATE_SCORES works and determines winner

### Critical Bugs Found

#### BUG 1: Ships Can Launch Without Gas
**Severity:** Critical
**Description:** Ships can be launched immediately after BUILD_SHIP without loading any gas. The log shows patterns like:
```
BUILD_SHIP → LAUNCH_SHIP (no LOAD_GAS in between)
```
**Expected:** LAUNCH_SHIP should fail if Lift < Weight (no gas = 0 Lift)
**Impact:** Completely breaks the core physics mechanic of the game

#### BUG 2: R&D Board Does Not Refill
**Severity:** Critical
**Description:** After 5-6 technologies are acquired, the R&D board is empty and stays empty. No new technologies appear from the tech bag.
**Expected:** When a technology is acquired, a new one should be drawn from the tech bag
**Impact:** Game cannot progress ages (stuck in Age 1 for 13 turns)

#### BUG 3: CALCULATE_SCORES Callable Anytime
**Severity:** High
**Description:** Any player can trigger CALCULATE_SCORES at any time to end the game, even during another player's turn in the middle of a phase.
**Expected:** Should only be callable when proper end-game conditions are met (Age 3 complete, or progress track reaches 30)
**Impact:** Allows premature game ending

#### BUG 4: No Age Transitions
**Severity:** Critical
**Description:** Despite acquiring technologies, the game never transitioned from Age 1 to Age 2. The progress track thresholds (10 for Age 2, 20 for Age 3) were never reached because the tech bag appears empty or broken.
**Expected:** Age should advance when progress track reaches thresholds
**Impact:** Age 2 and Age 3 content never tested; game is unplayable to proper completion

### Medium Bugs

#### BUG 5: All Ships Have Identical Stats
**Severity:** Medium
**Description:** Every launched ship shows "Range 1, Speed 1" regardless of faction or installed upgrades.
**Expected:** Germany's ship with duralumin_frame should have different stats than Italy's basic ship
**Impact:** Upgrades may have no effect on ship performance

### Minor Issues

#### CLI Parameter Documentation
**Severity:** Low
**Description:** CLI help shows `id=<upgradeId>` but server expects `techId=` for ACQUIRE_TECHNOLOGY
**Workaround:** Use `techId=` instead of `id=`

## Final Game State

### Faction Performance (End of Game)

| Faction | Cash | Income | Ships Launched | Techs | VP |
|---------|------|--------|----------------|-------|-----|
| Italy   | £26  | 2      | 4              | 3     | ? |
| Germany | £33  | 2      | 4              | 3     | 4 (Winner) |
| Britain | £24  | 5      | 3              | ? | ? |
| USA     | £23  | 5      | 2              | 2 | ? |

### Game Statistics
- **Turns Played:** 13
- **Age Reached:** 1 (never progressed)
- **Total Ships Launched:** 13 across all factions
- **Routes Claimed:** 0
- **Hazard Checks:** 0
- **Hydrogen Price:** Started at £2, ended at £10/cube
- **Technologies Acquired:** ~6 total before R&D board emptied

## Rules Adherence

### Correct Implementations
- Starting resources match faction configs
- Gas market pricing increases with purchases
- Loan mechanics work correctly
- Income collection properly applies
- Blueprint upgrade installation/removal works
- Turn/phase progression is correct

### Major Rules Violations
1. **Lift >= Weight not enforced** - Ships launch without gas
2. **Age progression broken** - Never left Age 1
3. **Tech bag empty** - R&D board doesn't refill
4. **Game end conditions** - Can force end anytime

### Untested Mechanics (Due to Bugs)
- Hazard checks (ships would need routes first)
- Route claiming (no routes were claimed)
- Age 2 and Age 3 gameplay
- Helium gas usage
- Card playing effects
- Agent placement/recall

## Recommendations

### Priority 1 - Critical Fixes
1. **Fix LAUNCH_SHIP validation** - Must check Lift >= Weight before allowing launch
2. **Fix tech bag refill** - R&D board must draw from tech bag when technology is acquired
3. **Add game end conditions** - CALCULATE_SCORES should only work when game should actually end

### Priority 2 - Important Fixes
4. **Fix age transitions** - Verify progress track increments and triggers age changes
5. **Verify upgrade effects** - Ships should gain stats from installed upgrades

### Priority 3 - Should Test
6. **Route claiming** - Needs to be tested once ships can properly launch
7. **Hazard checks** - Need routes first
8. **Card playing** - Untested mechanic
9. **Agent placement** - Untested mechanic

## Tested Mechanics Checklist

- [x] Buy hydrogen gas
- [ ] Buy helium gas (not tested)
- [x] Recruit pilots
- [x] Recruit engineers
- [x] Build ships
- [x] Load gas onto blueprint
- [x] Launch a ship (BUG: works without gas)
- [x] Take a loan
- [x] Draw cards
- [x] End turn transitions correctly
- [x] Phase progression works
- [x] Turn counter increments
- [x] Install upgrade on blueprint
- [x] Remove upgrade from blueprint
- [ ] Claim a route (not tested)
- [ ] Perform hazard check (not tested)
- [x] Acquire technology
- [ ] Age transition (BROKEN)
- [x] Calculate final scores
- [ ] Proper game end conditions (BROKEN)

## Raw Game Log (Key Events)

```
12:40:20 p.m. - Game started
12:40:45 p.m. - First DRAW_CARDS (Planning phase)
12:41:55 p.m. - First BUY_GAS
12:42:33 p.m. - First BUILD_SHIP
12:42:38 p.m. - First TAKE_LOAN (Italy)
12:43:07 p.m. - First LAUNCH_SHIP (Italy)
12:43:56 p.m. - First INSTALL_UPGRADE (Germany, duralumin_frame)
12:48:04 p.m. - ACQUIRE_TECHNOLOGY (goldbeater_skin)
12:48:23 p.m. - REMOVE_UPGRADE
12:55:49 p.m. - Last technology acquisition (improved_propeller)
1:00:01 p.m.  - R&D board empty, no more tech acquisitions
1:01:08 p.m.  - Ships launching without gas (bug observed)
1:02:32 p.m.  - CALCULATE_SCORES - Game ended, Germany wins with 4 VP
```

## Conclusion

The game's core loop of building and launching ships works at a basic level, but critical bugs prevent a proper playthrough:

1. Ships launching without gas breaks the core physics mechanic
2. The R&D board not refilling prevents age progression
3. The game cannot reach a natural ending state

These issues must be fixed before meaningful balance testing or rules validation can occur.
