# UP SHIP! Playtest Report

*Date: 2025-12-28*
*Game ID: 6aa0351f-9164-4133-8c0b-aa9042d62a45*
*Turns Played: 15*

## Game Summary

Ran a 4-player playtest (Germany, Britain, USA, Italy) progressing from Age 1 through Age 2 (almost Age 3). Started with manual strategic play through Turn 1, then used autoplay for turns 2-15.

**Final State (Turn 15, Age 2):**

| Faction | Cash | Income | Ships | Technologies |
|---------|------|--------|-------|--------------|
| Italy | £19 | 7 | 12 | 7 |
| Germany | £16 | 8 | 9 | 7 |
| Britain | £8 | 7 | 9 | 5 |
| USA | £11 | 17* | 4 | 8 |

*USA income jumped to 17 after manually claiming Paris→Rome (+5) and Paris→London (+4) routes late in playtest.

**Progress Track:** 19/30 (Age 3 at 20) - STUCK because R&D board is nearly empty

## Critical Issues Found

### 1. R&D Board Not Replenishing (CRITICAL)

**Issue:** The R&D board only shows 2 technologies by Turn 15, both already owned by Germany:
```
R&D Board (Available Technologies)
│ goldbeater_skin       │ £3 [OWNED]
│ duralumin_girders     │ £4 [OWNED]
```

**Impact:**
- Progress is stuck at 19/30 (needs 20 for Age 3)
- Players cannot acquire new technologies
- Game effectively stalls

**Expected Behavior:** The R&D board should replenish with new technology tiles as the game progresses, especially when entering new Ages.

**Location to fix:** `server/routes/gameState.js` or `server/services/gameStateService.js` - need R&D replenishment logic.

### 2. Autoplay Not Claiming Routes

**Issue:** The autoplay AI builds and launches ships but never claims routes. Ships sit in LAUNCHED status indefinitely.

**Evidence:**
- Germany has 8 LAUNCHED ships (not on routes) vs 1 ON_ROUTE
- 4 routes remain OPEN despite many eligible ships

**Impact:** Ships don't generate income, reducing faction effectiveness. Manual intervention required to claim routes.

**Location:** `scripts/playtest.py` autoplay logic needs route claiming behavior.

### 3. USA Faction Underperforming

**Issue:** USA consistently has the fewest ships despite having the highest starting tech count and income.

**Evidence by Turn 15:**
- Italy: 12 ships
- Germany: 9 ships
- Britain: 9 ships
- USA: 4 ships

**Possible Causes:**
1. Helium preference (USA starts with He) may slow early expansion when He is more expensive
2. Turn order disadvantage (USA goes first, sees fewer options)
3. Autoplay AI may not optimize for USA's strengths

**Impact:** USA falls behind in route control and progress contribution.

## Balance Observations

### Gas Market Dynamics

**Interesting finding:** Hydrogen inflation reversed the expected advantage:

| Turn | Hydrogen | Helium |
|------|----------|--------|
| 1 | £2/cube | £5/cube |
| 7 | £6/cube | £5/cube |
| 15 | £8/cube | £5/cube |

By mid-game, **helium is cheaper than hydrogen!** This dramatically shifts USA's supposed disadvantage into an advantage - but only if players buy helium late instead of early.

**Design Question:** Is this intentional? Should helium inflate too, or is hydrogen-only inflation a feature?

### Ship Cost Variance by Faction

Each faction's ship build cost reflects their blueprint composition:

| Faction | Ship Cost | Reason |
|---------|-----------|--------|
| Italy | £3 | Lightest materials (semi_rigid_keel, cotton_envelope) |
| Britain | £4 | Medium materials (tensioned_frame, doped_covering) |
| USA | £6 | Premium materials (duralumin_frame, synthetic_envelope) |
| Germany | £7 | Heavy materials (duralumin_frame, premium_envelope) |

**Balance implication:** Italy can build 2+ ships for the cost of 1 German ship, explaining their fleet lead.

### Crew Accumulation — RESOLVED

By Turn 15, all factions have 15+ pilots and 16+ engineers. Crew income outpaces crew consumption.

**Observation:** Crew doesn't seem to be a limiting factor - players always have enough.

**Resolution (commit a006a99):**
1. Renamed "Pilot" to "Officer" for thematic accuracy (larger ships need command staff)
2. Officer Income now starts at 0 (was 1) — requires Flight School investment
3. Launch cost scales by Age: 1 Officer in Age I, 2 in Age II, 3 in Age III

This creates meaningful crew scarcity:
- Early game: Officers are scarce, every one matters
- Mid game: Players who invested in Flight School have advantage
- Late game: Age III's 3-officer cost creates pressure even with high income

### Route Competition

Only 4 of 8 Age 1/2 routes were claimed by Turn 15:
- route_1: Frankfurt→Berlin (CLAIMED - Italy)
- route_2: Frankfurt→Paris (CLAIMED - USA)
- route_3: Berlin→Copenhagen (CLAIMED - Germany)
- route_5: London→Amsterdam (CLAIMED - Britain)

The remaining routes (route_4, 6, 7, 8) sat unclaimed despite having eligible ships.

## Recommendations

### Priority 1: Fix R&D Replenishment

Implement automatic R&D board replenishment:
1. Draw new tiles when tech is purchased
2. Refresh board at Age transitions
3. Ensure minimum 4 tiles always available

### Priority 2: Add Route Claiming to Autoplay

Modify `scripts/playtest.py` to:
1. Check for LAUNCHED ships after launch
2. Find eligible routes (Range/Speed match)
3. Claim best available route

### Priority 3: Investigate USA Weakness

- Consider reducing USA ship cost
- Give USA bonus helium at start
- Or accept asymmetry as intentional design

### Priority 4: Consider Gas Inflation Balance

The hydrogen inflation creates interesting late-game dynamics but may not match historical reality (hydrogen was always cheaper than helium). Design decision needed.

## Successful Mechanics

1. **Ship building works smoothly** - Build, launch, claim flow is intuitive
2. **Faction differentiation is clear** - Ship costs, starting tech, gas preferences all feel distinct
3. **Route claiming provides income** - +2 to +5 income per route is meaningful
4. **Phase progression is correct** - PLANNING→ACTIONS→LAUNCH→INCOME→CLEANUP cycle works
5. **CLI tools are functional** - Both Node and Python tools work reliably

## Test Coverage Recommendations

Need automated tests for:
1. R&D board replenishment at Age transitions
2. Tech availability counts
3. Autoplay route claiming
4. Gas market inflation rules
