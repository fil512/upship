# UP SHIP! Playtest Report

*Date: December 28, 2024*
*Game ID: b21f4e03-80c8-4a64-97d9-f4090ec007e9*
*Turns Played: 7*
*Phase Reached: Age 1, Turn 7, Income Phase*
*Progress: 7/30 (Age 2 at 10)*

## Game Summary

A 4-player playtest with Italy, USA, Germany, and Britain competing in Age 1. Italy established an early lead by being first to launch a ship and claim the lucrative Paris-London route (+4 income). By Turn 7:

| Faction | Cash | Income | Ships | Routes Claimed |
|---------|------|--------|-------|----------------|
| **Italy** | £14 | 12 | 5 | 2 (Paris-London +4, Frankfurt-Paris +3) |
| **USA** | £10 | 10 | 1 | 1 (Paris-Rome +5) |
| **Germany** | £12 | 8 | 6 | 1 (Berlin-Copenhagen +3) |
| **Britain** | £9 | 7 | 4 | Unknown |

**Key Events:**
- Italy's fast start with cheap ships (£3 hull cost) allowed them to dominate routes early
- USA's helium-powered ship (Range 3, Speed 3) claimed the premium Paris-Rome route (+5)
- Britain struggled early due to no drive technology on R&D board for several turns
- Germany accumulated 5 ships in hangar but couldn't launch due to 0 Officers

## Strategic Observations

### What Worked Well
1. **Italy's "build fast, claim early" strategy** was highly effective. Cheap hull costs (£3) and efficient propeller gave good stats at low cost.
2. **USA's helium investment** paid off - the premium ship stats (Range 3, Speed 3, Reliability 3) enabled claiming the best route.
3. **Route income compounds nicely** - Italy's income grew from 5 to 12 by claiming two routes.

### What Felt Underpowered
1. **Officer generation is too slow** - Germany accumulated 9 Engineers but 0 Officers over 7 turns. Ships pile up in hangar unable to launch.
2. **Britain's starting position was punishing** - No drive technology on initial R&D board meant they couldn't build ships for multiple turns.
3. **Late-game hydrogen prices** escalated to £8/cube, making hydrogen-dependent factions struggle.

### Balance Concerns
1. **First-mover advantage is significant** - Italy being first player let them claim premium routes before others could compete.
2. **R&D board randomness** can severely disadvantage a faction if no drive tech appears.
3. **Officer scarcity** limits strategic options - players build ships they can't launch.

## Bugs Found

### BUG-1: Autoplay Hangs (Medium Priority)
**Steps to Reproduce:**
```bash
python scripts/playtest.py autoplay 10
```
**Expected:** Runs 10 automated turns
**Actual:** Script hangs indefinitely (ran for 2+ minutes without completing)
**Impact:** Cannot use automated playtesting for rapid iteration

### BUG-2: R&D Board Doesn't Refresh With Drive Technologies (Possible Design Issue)
**Observation:** R&D board showed only component/frame technologies for multiple turns, leaving Britain without access to any drive technology.
**Question:** Should the R&D board guarantee at least one drive technology is available?

### BUG-3: Ship Build Costs Not Displayed in Blueprint View
**Observation:** When viewing blueprint, the total ship hull cost isn't shown. Players must attempt a build to see if they can afford it.
**Suggestion:** Add "Ship Hull Cost: £X" to blueprint display

## UX Issues

1. **No visual indicator of "why" a launch failed** - When launching fails due to Officer shortage, the error message is clear, but status display doesn't show Officer requirements upfront.

2. **Routes view could show which faction claimed which route** - Currently just shows [CLAIMED] without indicating the owner.

3. **Income phase logs are helpful** - Good that it shows income + crew collected per faction.

## Recommendations

### High Priority
1. **Fix autoplay hang** - Critical for rapid playtesting
2. **Increase Officer generation** - Current rate (0 Officers in 7 turns via income) is too slow. Consider:
   - Base income includes 1 Officer every N turns
   - Tech that grants Officer generation
   - Lower Officer requirements in Age 1

### Medium Priority
3. **Ensure R&D board diversity** - Guarantee at least 1 drive technology is always available
4. **Add hull cost to blueprint display**
5. **Show route ownership in routes list**

### Low Priority / Design Questions
6. **Consider turn order rotation** - First player advantage is significant
7. **Review gas price escalation** - £8/cube hydrogen may be too punishing
8. **Officer vs Engineer balance** - Why do Engineers accumulate 9x faster than Officers?

## Session Notes

The core game loop (Planning → Actions → Launch → Income → Cleanup) works smoothly. The strategic decisions around:
- When to buy technology vs gas vs build ships
- Which routes to prioritize
- Hydrogen vs Helium trade-offs

...are all engaging choices. The main friction points are resource generation (Officers) and R&D board availability.

The faction differentiation is starting to show:
- **Italy**: Cheap, efficient ships - good early game
- **USA**: Premium helium ships - expensive but powerful
- **Germany**: High hull costs (£7) but quality ships
- **Britain**: Cargo/passenger focus (dining saloon, cargo hold)

Overall, the game shows promise. The economic engine and route-claiming mechanics create interesting decisions. Fixing the Officer scarcity issue would significantly improve the mid-game experience.
