# UP SHIP! Playtest Report

*Date: 2025-12-27*
*Game ID: 93b3c311-5539-4c57-beef-c6bd04c2f973*
*Turns Played: 9 (Age 1)*
*Status: In progress (game not completed)*

## Summary

The core game loop functions correctly. Players can draw cards, buy gas, load blueprints, build ships, launch ships, acquire technologies, and take loans. The turn structure (Planning → Actions → Launch → Income → Cleanup) works as designed. However, several bugs were identified that would prevent a full game from being playable.

## Final Standings (Turn 9, Age 1)

| Faction | Cash | Income | Ships | Technologies |
|---------|------|--------|-------|--------------|
| USA | £18 | 0 | 3 | 2 |
| Italy | £12 | 5 | 3 | 2 |
| Britain | £22 | 5 | 2 | 6 |
| Germany | £14 | 2 | 2 | 5 |

## Bugs Found

### Critical (Blocks Gameplay)

1. **R&D Board Not Refreshing Properly** (Severity: Critical)
   - Steps to reproduce: Play several turns and acquire technologies
   - Expected: R&D board shows 4 unique, unowned technologies
   - Actual: R&D board shows duplicates of technologies already owned by the viewing player
   - Example: Germany sees "duralumin_girders" 3 times, all marked [OWNED]
   - Impact: Players cannot acquire new technologies after early game

### High Priority

2. **Deck Reshuffling Not Implemented** (Severity: High)
   - By Turn 4, all player decks are empty (10 cards drawn, 0 remaining)
   - Players cannot draw cards after deck is empty
   - Discard pile never gets reshuffled back into deck
   - Impact: Planning phase becomes useless mid-game

3. **Ship Launch Doesn't Reset Gas Sockets** (Severity: High)
   - After building a ship, gas sockets remain "occupied"
   - Error: "Socket already occupied" when trying to load gas for second ship
   - Blueprint should reset after ship is built (gas consumed)
   - Impact: Players can only ever build 1 ship per blueprint configuration

### Medium Priority

4. **Progress Track Display Missing** (Severity: Medium)
   - The progress track value (currently 9) is not shown in CLI state display
   - Progress advances correctly (confirmed via log messages)
   - Should show progress in the game state output

5. **Gas Market Never Resets** (Severity: Medium)
   - Hydrogen started at £2, rose to £8 and stayed there
   - Helium started at £5, rose to £8
   - No mechanism to reset market prices (should reset each turn or age)
   - Impact: Gas becomes prohibitively expensive late game

### Low Priority

6. **Loan Stacking Breaks Income** (Severity: Low)
   - USA took 2 loans, reducing income from 5 → 2 → 0
   - Third loan would give -3 income (possible but probably shouldn't be allowed)
   - Consider capping minimum income at 0 or limiting loan count

## Working Features

- Game creation and lobby system
- Faction selection (Germany, Britain, USA, Italy)
- Turn order and phase progression
- Card drawing in Planning phase
- Gas purchasing (hydrogen and helium)
- Gas loading to blueprint sockets
- Ship building (consumes £2 per ship)
- Ship launching (with stats: Range 1, Speed 1)
- Technology acquisition (£2-4 depending on tech)
- Loan system (£30 cash, -3 income)
- Income collection (auto-triggered at Income phase)
- Turn advancement through all phases
- CLI displays current state accurately

## Balance Observations

### Faction Performance
- **Britain/Italy** (no loans): Steady income kept them competitive
- **Germany/USA** (took loans): High early cash but crippled long-term by reduced income
- Loans are very powerful early but devastating late (USA at 0 income)

### Economy
- Starting with £15 + 2 H₂ seems appropriate
- Building ships (£2) is cheap; gas is the real cost
- Late-game gas prices (£8/cube) make ship-building nearly impossible
- Technology acquisition provides progress but unclear VP benefit

### Pacing
- 9 turns still in Age 1 suggests ages may be too long
- Progress at 9 after extensive play - need 10 to trigger Age 2?
- Players acquire technologies faster than ships

## Recommendations

### Immediate Fixes (Required for Playability)

1. **Fix R&D Board Refresh**
   - When a technology is acquired, replace it with a new one from the tech bag
   - Never show owned technologies as available options

2. **Implement Deck Reshuffling**
   - When drawing and deck is empty, shuffle discard pile into deck
   - Should happen automatically

3. **Reset Blueprint Gas Sockets After Ship Build**
   - After BUILD_SHIP, clear all gas sockets
   - Gas cubes are consumed (transferred to ship)

### Secondary Fixes

4. **Gas Market Reset Mechanism**
   - Reset to base prices at start of each Age, or
   - Implement supply replenishment each turn

5. **Show Progress Track in CLI**
   - Add progress value to state display
   - Show "Progress: X/30" or similar

6. **Limit Loans**
   - Either cap at 2 loans max, or
   - Prevent income from going below 0

## Next Steps

1. Fix the three critical/high bugs before next playtest
2. Verify Age transition triggers at Progress 10
3. Test Age 2 and Age 3 mechanics once Age 1 is stable
4. Implement route claiming and ship movement
5. Add victory point calculation and game end conditions
