# UP SHIP! Playtest Report

*Date: December 27, 2025*
*Game ID: 2ff6eb64-f299-440f-847a-d6b38d4f99ec*
*Turns Played: 18*
*Final State: Age 2, Turn 18, Progress 10/30*

## Game Summary

A 4-player strategic playtest with Germany, Britain, USA, and Italy. The game progressed through Age 1 and into Age 2, but **got stuck at progress 10/30** and could not advance to Age 3. The game demonstrated working core mechanics but revealed critical balance and progression issues.

### Faction Performance

| Faction | Ships | Launched | Cash | Technologies |
|---------|-------|----------|------|--------------|
| Italy   | 15    | 12       | £11  | 5            |
| Britain | 14    | ~8       | £10  | ~5           |
| Germany | 11    | 4        | £7   | 6            |
| USA     | 4     | 4        | £10  | 5            |

**Italy dominated** the ship count, confirming their faction advantage for fast, cheap ship building (£3/ship vs Germany's £7/ship).

**USA fell dramatically behind** - only 4 ships by Turn 18 while Italy had 15. This suggests the USA faction may need rebalancing or the autoplay AI made poor decisions for them.

## Strategic Observations

### What Worked Well

1. **Ship Building Costs Reflect Quality**: Italy's cheap £3 ships have lower stats (Range 1-2, Speed 1-2) while Germany's £7 ships have better stats (Range 2-3, Speed 1-2). This asymmetry creates meaningful faction identity.

2. **Gas Market Dynamics**: Hydrogen started at £2/cube and rose to £8/cube by Turn 18. The scarcity mechanic is working - heavy usage drives prices up.

3. **Technology Acquisition Advances Progress**: Each tech acquired moved the progress counter toward the next Age.

4. **Income Phase Works**: Players reliably received £5 income plus crew each turn.

5. **Ship Launching Works**: Ships correctly transition from HANGAR to LAUNCHED state when gas is spent.

### What Needs Improvement

1. **Progress Stalled at 10/30**: The game got stuck because:
   - R&D board only showed 2 techs, both already owned by Germany
   - No new tech was being added to replace acquired ones
   - Other factions couldn't buy tech to advance progress

2. **No Route Claiming**: Despite having many launched ships, no routes were ever claimed. The routes command crashes (see Bugs below), and the autoplay doesn't attempt to claim routes.

3. **Gas Shortage Caused Hangar Backup**: By Turn 18:
   - Hydrogen: £8/cube, Helium: £5/cube
   - Germany had 7 ships stuck in hangar with 0 gas
   - The autoplay AI didn't buy gas strategically

4. **Helium Underused**: Despite USA's historical preference for helium, and helium being cheaper (£5 vs £8 for hydrogen by late game), players defaulted to hydrogen.

## Bugs Found

### Critical Bugs

1. **`routes` Command Crashes** (cli/upship.js:798)
   ```
   Error: Cannot read properties of undefined (reading 'map')
   ```
   The routes command expects `state.map?.routes` but the map object appears to be undefined.
   **Impact**: Players cannot view available routes, blocking a core game mechanic.

2. **Shorthand `launch` Command Fails**
   ```bash
   npm run cli -- playtest_britain launch $GAME ship_xxx hydrogen
   # Returns: "✗ Failed: Unknown error"
   ```
   The verbose `action LAUNCH_SHIP shipId=xxx gasType=hydrogen` works correctly.
   **Impact**: Minor UX issue since workaround exists.

### Balance Bugs

3. **R&D Board Empty/Stale**
   After early game tech acquisition, the R&D board stopped replenishing new technologies. By Turn 18, only 2 techs remained, both already owned by one player.
   **Impact**: Critical - blocks Age progression since acquiring tech is the only way to advance progress.

4. **USA Faction Severely Underperforming**
   USA ended with only 4 ships (vs Italy's 15). Either:
   - The autoplay AI makes poor decisions for USA
   - USA faction has structural disadvantages not compensated elsewhere
   **Impact**: Balance concern requiring investigation.

## Balance Concerns

### Ship Cost vs Quality Tradeoff

| Faction | Cost/Ship | Range | Speed | Observations |
|---------|-----------|-------|-------|--------------|
| Italy   | £3        | 1-2   | 1-2   | Cheap, many ships, lower stats |
| Britain | £4        | 1     | 2     | Moderate, good speed |
| Germany | £7        | 2-3   | 1-2   | Expensive, high quality |
| USA     | £6        | 2     | 1     | Middle ground |

**Finding**: The cost differential is significant (233% between Italy and Germany). Italy's ability to flood the board with ships may be too strong, especially since route capacity wasn't tested.

### Gas Economy

Hydrogen price progression: £2 -> £3 -> £5 -> £7 -> £8

This extreme inflation makes later-game launches very expensive. Consider:
- Resetting gas prices each Age
- Adding gas production/discovery events
- Balancing helium usage (it stayed at £5)

### Progress Mechanics

The game reached progress 10/30 (Age 2) but couldn't advance further. The tech acquisition system needs:
- Guaranteed tech replenishment to the R&D board
- Possibly alternative ways to gain progress (route completion?)
- Minimum tech availability per Age

## Recommendations

### Priority 1: Critical Fixes

1. **Fix R&D Board Replenishment**: Ensure new technologies always appear when old ones are purchased. The game cannot progress without available tech.

2. **Fix Routes Command**: Debug `state.map?.routes` - either the map isn't being initialized or routes aren't being added.

3. **Implement Route Claiming in Autoplay**: The autoplay script should attempt to claim routes with launched ships.

### Priority 2: Balance Adjustments

4. **Review USA Faction**: Investigate why USA fell so far behind. Consider:
   - Starting resources
   - Ship cost vs capability
   - Unique faction abilities

5. **Gas Price Caps**: Consider maximum gas prices or periodic resets to prevent late-game lockout.

6. **Helium Incentives**: Add reasons for players to choose helium over hydrogen (safety bonuses? Route requirements?).

### Priority 3: UX Improvements

7. **Fix Shorthand Launch Command**: The `launch` shorthand should work like the verbose `action LAUNCH_SHIP`.

8. **Add Route Speed Requirements Display**: Ships show Range/Speed but routes don't show their requirements clearly.

9. **Progress Indicator Enhancement**: Show what actions will increase progress (currently only tech acquisition is obvious).

## Test Coverage Gaps

The following mechanics were NOT tested in this playtest:

- Route claiming and income generation
- Hazard checks
- Loan mechanics
- Worker placement on ground board
- Upgrade installation to blueprints
- Deck cycling (discards -> shuffle -> new deck)
- Multi-round Actions phase
- End game scoring

## Appendix: Key Timestamps

- Turn 1: All factions draw cards, build ships, launch first ships
- Turn 2: First tech acquisitions, Progress reaches 4/30
- Turn 5: Age 2 begins (Progress 10/30)
- Turn 8-18: Progress stuck at 10/30, no new tech available
- Final: Age 2, Turn 18, game stalled
