# UP SHIP! Playtest Report

*Date: 2025-12-28*
*Game IDs: 59fe4a04-3eed-4a9b-8e8f-2d989a2e108c (manual), 4bd2a8fd-a4d9-4b6c-8b20-0cd7e77a0a77 (autoplay)*
*Turns Played: 1 manual + 10 automated = ~11 turns*
*Reached: Age 2, Turn 1*

## Game Summary

Conducted strategic playtesting with 4 factions (Germany, Britain, USA, Italy). Started with manual turn 1 to understand mechanics, then ran automated playtesting for 10 turns.

### Final State (Age 2, Turn 1)

| Player  | Cash | Income | Ships | H₂ | He | Research | Tech |
|---------|------|--------|-------|----|----|----------|------|
| GERMANY | £5   | 5/turn | 6     | 19 | 0  | 60       | 5    |
| BRITAIN | £5   | 5/turn | 6     | 20 | 0  | 60       | 5    |
| USA     | £5   | 5/turn | 3     | 0  | 3  | 60       | 6    |
| ITALY   | £5   | 5/turn | 4     | 36 | 0  | 63       | 4    |

### Ships Breakdown

| Faction | Hangar | Launched | On Route |
|---------|--------|----------|----------|
| GERMANY | 4      | 2        | 0        |
| BRITAIN | 0      | 6        | 0        |
| USA     | 0      | 3        | 0        |
| ITALY   | 1      | 3        | 0        |

## Strategic Observations

### Faction Performance

1. **Germany**: Strong ship production (6 total), good hydrogen reserves (19). Weakness: 4 ships stuck in hangar, suggesting launch bottleneck. Low officer count (0) may be limiting launches.

2. **Britain**: Excellent launch rate (all 6 ships launched), balanced approach. Good hydrogen reserves (20). Most aggressive launcher in the game.

3. **USA**: Smallest fleet (3 ships) but all launched. Using helium as expected. Has the most technologies (6). Research-focused strategy working but produces fewer ships.

4. **Italy**: Largest hydrogen stockpile (36!) but only 4 ships. Insurance purchase (income reduced to 4) may have slowed development. One ship still in hangar.

### Resource Economy Observations

1. **Research Accumulation**: All players accumulated 60+ Research by Age 2, but only acquired 4-6 technologies each. Research is being generated faster than it's being spent.

2. **Hydrogen vs Helium**: USA correctly uses helium, others use hydrogen. Market prices stayed stable at £1/£2 respectively.

3. **Cash Flow**: All players ended with only £5, suggesting the economy is tight. Income of 5/turn may be appropriate tension.

4. **Ships Not Claiming Routes**: Despite many ships being launched, NO ships are "On Route". This is a significant issue - the CLAIM_ROUTE action may not be working or being used.

## Bugs Found

### Critical

1. **No Routes Being Claimed**: Launched ships are not claiming routes. The autoplay attempts to launch ships but ships stay in "LAUNCHED" state indefinitely. Need to investigate:
   - Is CLAIM_ROUTE action available during Reveal phase?
   - Do ships need to meet route requirements?
   - Is there a bug in route claiming logic?

2. **Income & Cleanup Running Multiple Times**: The autoplay log shows "Income Cleanup Phase" running 2-3 times per turn cycle, suggesting the phase detection or transition logic has issues.

### Medium

3. **Playtest Script Location Detection**: The original `get_available_locations()` function was not correctly parsing the Ground Board output format. Fixed by updating the parsing logic to match "location_id:" pattern.

4. **Card Placement Failures**: Early autoplay showed "placement failed, passing" messages even when players had matching cards. After fixing location detection, this resolved.

### Low

5. **Ministry Action Not Implemented**: `MINISTRY_ACTION` is not a valid action type. The Ministry location effect (helium price reduction) happens automatically on placement, but there may be additional ministry benefits not implemented.

## Balance Concerns

### Positive

- Faction differentiation is working (USA uses helium, Italy has insurance, etc.)
- Ship building rate seems reasonable (1-2 ships per turn)
- Technology acquisition is functional
- Worker placement creates meaningful choices

### Concerns

1. **Research Economy**: Players accumulating 60+ Research suggests either:
   - Technology costs are too low relative to Research generation
   - Not enough worthwhile technologies to buy
   - Research should have other uses

2. **Italy's Insurance**: Taking insurance reduced Italy's income by 1, but they still accumulated the most hydrogen. The insurance benefit (protecting ships) wasn't tested because no hazards occurred during launched ship operations.

3. **Route Claiming Gap**: The core victory point mechanism (claiming routes) appears non-functional in autoplay. This needs immediate investigation.

4. **Officer Shortage**: Germany ended with 0 officers. Launching ships requires officers, so this shortage may explain ships stuck in hangar.

## Recommendations

### Priority 1: Critical Fixes

1. **Investigate Route Claiming**: Debug why CLAIM_ROUTE is not being executed or why it fails. Check:
   - Route availability during Reveal phase
   - Ship stat requirements vs route requirements
   - Action validation in gameState.js

2. **Fix Phase Transition Loop**: Investigate why Income & Cleanup runs multiple times.

### Priority 2: Balance Adjustments

3. **Review Research Economy**: Consider:
   - Increasing technology costs
   - Adding more technologies
   - Giving Research alternative uses

4. **Officer Generation**: Ensure officers are being generated at income phase or make Academy more attractive to visit.

### Priority 3: Autoplay Improvements

5. **Smarter Ship Launching**: Only attempt launch if player has enough officers.

6. **Route Claiming Logic**: Add explicit route claiming step in autoplay after ships are launched.

7. **Strategic Location Priorities**: Weight construction_hall and launchpad higher for factions with resources to use them.

## Technical Notes

### Playtest Script Enhancements Made

- Fixed `get_available_locations()` to correctly parse Ground Board format
- Enhanced `autoplay()` Reveal phase to execute location actions (build, buy gas, recruit, tech, launch)
- Added `show_summary()` command for quick multi-player status comparison
- Added error message details to placement failures
- Added `status [player]` argument to view game from specific player's perspective

### Files Modified

- `scripts/playtest.py` - Multiple enhancements
- `CLAUDE.md` - Updated playtest tool documentation

---

*Report generated by Claude Code playtest automation*
