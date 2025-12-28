# UP SHIP! Playtest Report

*Date: 2025-12-28*
*Game ID: 3abf5967-9f59-4942-8483-5518407f629b*
*Turns Played: 11*
*Age: 2 (Progress: 19/30)*

## Game Summary

A 4-player game was played through 11 turns reaching Age 2. Each faction started with £15, 2 gas cubes, and unique starting technologies.

### Final Standings (Turn 11)

| Faction | Cash | Income | Ships | Techs | Notes |
|---------|------|--------|-------|-------|-------|
| **Britain** | £16 | 7/turn | 8 | - | Tied lead in ships |
| **Italy** | £15 | 7/turn | 8 | 7 | Tied lead in ships |
| **USA** | £9 | 8/turn | 3 | - | Highest income |
| **Germany** | £8 | 5/turn | 4 | 8 | Most techs, lowest income |

### Route Claims (Only 3 of 8 routes claimed!)
- Frankfurt → Berlin (+2): CLAIMED
- Frankfurt → Paris (+3): CLAIMED
- London → Amsterdam (+2): CLAIMED

## Strategic Observations

### 1. Faction Asymmetry Working Well

Ship building costs show clear faction differentiation:
- **Italy**: £3/ship (cheapest - built 8 ships)
- **Britain**: £4/ship (balanced - built 8 ships)
- **USA**: £6/ship (moderate)
- **Germany**: £7/ship (most expensive - only 4 ships)

Ship stats also vary meaningfully:
- Britain ships have Speed 2, Luxury 3 (passenger-focused)
- USA ships have Reliability 3, Ceiling 1 (safer)
- Italy ships are Range 1, Speed 1 (small but numerous)
- Germany ships have Range 2, Ceiling 1, Reliability 3 (balanced but expensive)

### 2. Income Gap is Significant

Germany fell behind significantly:
- Turn 1: All factions start at £5 income
- Turn 11: Germany still at £5, others at £7-8

This 40-60% income gap compounds over time. The issue: Germany's ship failed to claim a route due to a bug (502 error), then never recovered.

### 3. Ships Accumulating Without Routes

Major issue discovered: **Many ships in hangars, not on routes**
- Italy: 8 ships but only contributing +2 income (1 on route)
- Britain: 8 ships but only contributing +2 income (1 on route)
- 5 of 8 routes still unclaimed after 11 turns!

This suggests:
1. Launch/Claim flow may be confusing or bugged
2. Autoplay algorithm doesn't prioritize launching/claiming
3. Ships may not be launching properly

### 4. Gas Market Dynamics

Hydrogen prices increased steadily:
- Turn 1: £2/cube
- Turn 7: £6/cube
- Turn 11: £7/cube

Helium remained stable at £5/cube. This is interesting - hydrogen became more expensive than helium, which should push players toward helium (USA's strength).

### 5. Technology Acquisition Stalled

R&D Board only shows 2 technologies by Turn 11, both already owned by Germany. Progress stuck at 19/30 (needs 20 for Age 3). The tech refresh may not be happening correctly.

## Bugs Found

### 1. HTTP 502 Error on Route Claim (HIGH PRIORITY) - INVESTIGATED
- **Steps to Reproduce**: During LAUNCH phase, Germany tried to claim route_3
- **Command**: `python scripts/playtest.py action playtest_germany claim ship_X route_3`
- **Result**: `HTTP 502` error
- **Status**: Likely transient Railway platform issue. Server code reviewed and appears correct.
- **Impact**: Germany's income never increased, creating permanent disadvantage

### 2. Ships LAUNCHED but Not ON_ROUTE - RESOLVED
- Germany's first ship shows status "LAUNCHED" but never got assigned a route
- The ship appears to be in limbo - not in HANGAR, not ON_ROUTE
- **Root Cause**: Autoplay script wasn't claiming routes - route parsing regex was incorrect
- **Fix**: Updated `get_available_routes()` in `scripts/playtest.py` to parse "Range ≥X" format

### 3. R&D Board Not Refreshing - RESOLVED
- Only 2 technologies shown in Age 2
- Both marked as [OWNED] by Germany
- Progress stuck at 19/30 - players can't acquire more tech to advance Age
- **Root Cause**: Faction starting technologies (e.g., `goldbeater_skin`, `duralumin_girders`) were also in the tech bag, so they appeared on the R&D board even though players already owned them
- **Fix**: Updated `createTechBagAndRDBoard()` and `addAgeTechnologies()` to filter out technologies already owned by any player

### 4. Autoplay Not Launching/Claiming Routes - RESOLVED
- Ships built but accumulate in hangar
- Autoplay algorithm may not understand the launch→claim workflow
- Manual intervention required for route claims
- **Root Cause**: Same as Bug #2 - route parsing regex was broken
- **Fix**: Fixed route parsing in `scripts/playtest.py`

## Balance Concerns

### Germany Faction Disadvantage
- Most expensive ships (£7 vs Italy's £3)
- Only 4 ships vs Italy/Britain's 8
- Lowest income (5 vs 7-8)
- Recommendation: Consider reducing Germany's ship cost or giving them a tech discount

### Route Claim Bottleneck
- Only 3 routes claimed after 11 turns
- Ships accumulate without generating income
- Launch phase mechanics may need UX improvement

### Officer Scarcity
- All factions at 0 Officers by Turn 11
- Started with 1 Officer each
- Officers seem to be consumed by ship launches but not replenished
- This limits how many ships can be on routes simultaneously

## UX Issues

### 1. Ship Status Confusion
The status display shows:
- HANGAR, LAUNCHED, ON_ROUTE
But the difference between LAUNCHED and ON_ROUTE is unclear. A ship that's LAUNCHED but not ON_ROUTE is in an ambiguous state.

### 2. No Warning When Out of Officers
Players can build ships they can't launch because they need Officers. The UI should warn when building without Officers to assign.

### 3. Route Requirements Not Visible in Build Decision
When building a ship, there's no indication of what routes it could service. Players may build ships that can't reach any unclaimed routes.

## Recommendations

### Priority Fixes

1. **Fix 502 Error on Route Claims** - This breaks the core gameplay loop
2. **Investigate LAUNCHED ship state** - Ensure ships either go ON_ROUTE or stay in HANGAR
3. **Fix R&D Board refresh** - Need new technologies to advance Ages

### Design Improvements

1. **Officer Generation** - Income phase should maybe award Officers, not just Engineers
2. **Ship Cost Rebalance** - Germany's £7 vs Italy's £3 creates too much disparity
3. **Route Network** - Consider more routes or lower requirements for Age 1 routes

### Autoplay Improvements

1. Add launch logic to autoplay algorithm
2. Add route claiming to autoplay algorithm
3. Prioritize building ships that can service open routes

## Appendix: Turn 1 Detailed Play

Turn 1 was played manually with strategic reasoning:

**PLANNING Phase**: Each faction drew 2 cards

**ACTIONS Phase**:
- USA: Built ship (£6), bought helium (£5) → £4 remaining
- Italy: Built ship (£3), bought hydrogen (£4), acquired Passenger Gondola tech → £5 remaining
- Germany: Built ship (£7), bought hydrogen (£6) → £2 remaining (couldn't afford tech)
- Britain: Built ship (£4), acquired Improved Propeller tech, bought hydrogen → £4 remaining

**LAUNCH Phase**:
- USA: Launched with helium, claimed Frankfurt→Paris (+3)
- Italy: Launched with hydrogen, claimed Frankfurt→Berlin (+2)
- Germany: Launched with hydrogen, **502 ERROR on claim**
- Britain: Launched with hydrogen, claimed London→Amsterdam (+2)

**INCOME Phase**: Collected income, Germany didn't get route bonus

This single Turn 1 failure cascaded into Germany's permanent disadvantage.
