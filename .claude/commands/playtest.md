# UP SHIP! Automated Playtest Command

Execute a full automated playtest of the game using the CLI tool. The goal is to validate functionality, rules adherence, and faction balance.

## Instructions

### Step 1: Prepare Test Environment

1. **Verify CLI is working:**
   ```bash
   npm run cli -- help
   ```

2. **Set up test users** (create accounts if they don't exist):
   - `playtest_germany` / `test123456`
   - `playtest_britain` / `test123456`
   - `playtest_usa` / `test123456`
   - `playtest_italy` / `test123456`

   For each user, attempt login first. If it fails, register the account:
   ```bash
   npm run cli -- login playtest_germany test123456
   # If login fails with "Invalid credentials":
   npm run cli -- register playtest_germany test123456
   ```

3. **Verify all sessions are active:**
   ```bash
   npm run cli -- sessions
   ```

### Step 2: Create and Configure Game

1. **Create a new playtest game:**
   ```bash
   npm run cli -- playtest_germany create "Playtest $(date +%Y%m%d_%H%M%S)"
   ```

2. **Record the game ID** from the output.

3. **Have all players join and select factions:**
   ```bash
   npm run cli -- playtest_britain join <gameId>
   npm run cli -- playtest_usa join <gameId>
   npm run cli -- playtest_italy join <gameId>

   npm run cli -- playtest_germany faction <gameId> germany
   npm run cli -- playtest_britain faction <gameId> britain
   npm run cli -- playtest_usa faction <gameId> usa
   npm run cli -- playtest_italy faction <gameId> italy
   ```

4. **Start the game:**
   ```bash
   npm run cli -- playtest_germany start <gameId>
   ```

### Step 3: Execute Playtest

Use the TodoWrite tool to track progress through each turn. Play the game making strategic decisions for each faction according to their strengths:

**Faction Strategies:**
- **Germany:** Focus on Hydrogen, larger ships, efficiency
- **Britain:** Balanced approach, passenger routes
- **USA:** Helium preference (domestic supply), safety focus
- **Italy:** Agile designs, speed optimization

**For each player's turn:**

1. Check game state:
   ```bash
   npm run cli -- <user> state <gameId>
   ```

2. Execute actions appropriate for the phase:
   - **Planning Phase:** Draw cards, place agents
   - **Actions Phase:** Buy gas, build ships, acquire tech, recruit crew
   - **Launch Phase:** Load gas, launch ships, claim routes
   - **Income Phase:** Collect income
   - **Cleanup Phase:** End turn

3. Record any errors or unexpected behavior.

4. End turn:
   ```bash
   npm run cli -- <user> endturn <gameId>
   ```

**Play for a minimum of:**
- 3 complete rounds (all 4 players take turns in all phases)
- OR until a significant game event occurs (ship launch, hazard check, etc.)
- OR until an error is encountered

### Step 4: Test Critical Game Mechanics

Ensure the following are tested during the playtest:

**Required Tests (mark each as tested):**
- [ ] Buy hydrogen gas
- [ ] Buy helium gas (if tech available)
- [ ] Recruit pilots
- [ ] Recruit engineers
- [ ] Build at least one ship
- [ ] Load gas onto blueprint
- [ ] Launch a ship (requires Lift >= Weight)
- [ ] Take a loan
- [ ] Draw cards
- [ ] End turn transitions correctly to next player
- [ ] Phase progression works (planning → actions → launch → income → cleanup)
- [ ] Turn counter increments properly

**Optional Tests (if game state allows):**
- [ ] Install upgrade on blueprint
- [ ] Remove upgrade from blueprint
- [ ] Claim a route with launched ship
- [ ] Perform hazard check
- [ ] Acquire technology

### Step 5: Record Observations

Track these metrics throughout the playtest:

**Per-Player Metrics:**
| Metric | Germany | Britain | USA | Italy |
|--------|---------|---------|-----|-------|
| Final Cash | | | | |
| Final Income | | | | |
| Ships Built | | | | |
| Ships Launched | | | | |
| Technologies | | | | |
| Routes Claimed | | | | |

**Game Flow Metrics:**
- Total turns played: ___
- Errors encountered: ___
- Rules violations found: ___
- Phase transition bugs: ___

### Step 6: Write Playtest Report

Create a report file at `plans/YYYY-MM-DD_PLAYTEST_REPORT.md` with:

```markdown
# UP SHIP! Playtest Report

*Date: [today's date]*
*Game ID: [gameId]*
*Turns Played: [count]*

## Summary
[Brief overall assessment]

## Functionality Testing

### Working Features
- [List features that worked correctly]

### Bugs Found
#### [Bug Title]
**Severity:** Critical/High/Medium/Low
**Steps to Reproduce:**
1. ...
2. ...
**Expected:** ...
**Actual:** ...

## Rules Adherence

### Correct Implementations
- [List game rules that are correctly implemented]

### Rules Violations
- [List any places where the implementation doesn't match the rules]

### Missing Mechanics
- [List game mechanics from the rules that aren't implemented yet]

## Balance Observations

### Faction Performance
| Faction | Cash | Income | Ships | Techs | Assessment |
|---------|------|--------|-------|-------|------------|
| Germany | | | | | |
| Britain | | | | | |
| USA | | | | | |
| Italy | | | | | |

### Balance Concerns
- [Any observed imbalances]

### Positive Notes
- [Things that work well]

## Recommendations

### Priority Fixes
1. [Most critical issue to fix]
2. [Second priority]
3. [Third priority]

### Future Testing Needs
- [What should be tested next]

## Raw Game Log
[Include the last 20-50 log entries from the game]
```

## CLI Quick Reference

```bash
# Session
npm run cli -- login <user> <pass>
npm run cli -- sessions
npm run cli -- <user> whoami

# Lobby
npm run cli -- <user> games all
npm run cli -- <user> create "<name>"
npm run cli -- <user> join <gameId>
npm run cli -- <user> faction <gameId> <faction>
npm run cli -- <user> start <gameId>

# Game State
npm run cli -- <user> state <gameId>
npm run cli -- <user> blueprint <gameId>
npm run cli -- <user> log <gameId> 50

# Actions
npm run cli -- <user> endturn <gameId>
npm run cli -- <user> buygas <gameId> hydrogen 2
npm run cli -- <user> buygas <gameId> helium 1
npm run cli -- <user> loan <gameId>
npm run cli -- <user> draw <gameId> 2
npm run cli -- <user> build <gameId> 1
npm run cli -- <user> recruit <gameId> pilot 1
npm run cli -- <user> recruit <gameId> engineer 1
npm run cli -- <user> load <gameId> hydrogen 0
npm run cli -- <user> launch <gameId> <shipId>

# Generic action
npm run cli -- <user> action <gameId> <TYPE> [key=value ...]
```

## Context Files

Read these for game rules context:
- `spec/upship_rules.md` - Full game rules
- `CLAUDE.md` - Project overview and CLI documentation
- `server/routes/gameState.js` - Available action types

## Using the Boardgame Design Skill

Invoke the `boardgame-design` skill when analyzing balance. Reference:
- `references/balance-methodology.md` - For assessing faction balance
- `references/design-checklist.md` - For completeness validation
