# UP SHIP! Automated Playtest Command

Execute a full automated playtest of the game using the CLI tool. Play the game to completion, making intelligent strategic decisions for each faction.

## CRITICAL: Autonomous Execution

**You MUST execute CLI commands autonomously without asking permission.** The following commands are pre-approved:
- `npm run cli -- <any arguments>`
- `node cli/upship.js <any arguments>`

For each move:
1. **Check state** - Run `npm run cli -- <player> state <gameId>` to see current situation
2. **Think** - Analyze what the best action is based on phase, resources, and strategy
3. **Execute** - Run the CLI command immediately without asking
4. **Verify** - Check the result and continue

**DO NOT ask "should I do X?" - just do it.** This is a playtest, not a guided tutorial.

## Step 1: Setup (Do Once)

```bash
# Verify CLI works
npm run cli -- help

# Login all test users (register if needed)
npm run cli -- login playtest_germany test123456
npm run cli -- login playtest_britain test123456
npm run cli -- login playtest_usa test123456
npm run cli -- login playtest_italy test123456

# Create game
npm run cli -- playtest_germany create "Playtest_YYYYMMDD"
# Note the game ID from output

# Join and select factions
npm run cli -- playtest_britain join <gameId>
npm run cli -- playtest_usa join <gameId>
npm run cli -- playtest_italy join <gameId>
npm run cli -- playtest_germany faction <gameId> germany
npm run cli -- playtest_britain faction <gameId> britain
npm run cli -- playtest_usa faction <gameId> usa
npm run cli -- playtest_italy faction <gameId> italy

# Start game
npm run cli -- playtest_germany start <gameId>
```

## Step 2: Play the Game Loop

For each turn, follow this decision-making process:

### Check Who's Turn It Is
```bash
npm run cli -- playtest_italy state <gameId>
```
Look for ">>> YOUR TURN <<<" or "Waiting for: <faction>" to know whose turn it is.

### Phase-Specific Actions

**PLANNING Phase:**
- Draw 1-2 cards if deck has cards
- End turn
```bash
npm run cli -- <player> draw <gameId> 2
npm run cli -- <player> endturn <gameId>
```

**ACTIONS Phase - Think Through These Steps:**
1. Check cash, gas, technologies, ships in hangar
2. Decide priority: Need tech? Need gas? Need ship? Need crew?
3. Execute actions in order:

```bash
# If R&D board has tech and you have cash:
npm run cli -- <player> action <gameId> ACQUIRE_TECHNOLOGY techId=<techId>

# If low on cash (<£15):
npm run cli -- <player> loan <gameId>

# If need gas and have cash:
npm run cli -- <player> buygas <gameId> hydrogen 4

# If have gas in reserve, load to blueprint:
npm run cli -- <player> load <gameId> hydrogen 0
npm run cli -- <player> load <gameId> hydrogen 1
npm run cli -- <player> load <gameId> hydrogen 2
npm run cli -- <player> load <gameId> hydrogen 3

# Build a ship:
npm run cli -- <player> build <gameId> 1

# If ship in hangar AND blueprint has 4 gas loaded, launch:
npm run cli -- <player> state <gameId>  # Get ship ID from HANGAR
npm run cli -- <player> launch <gameId> <shipId>

# End turn:
npm run cli -- <player> endturn <gameId>
```

**LAUNCH Phase:**
- Can claim routes if ships are launched (not yet implemented fully)
- End turn
```bash
npm run cli -- <player> endturn <gameId>
```

**INCOME Phase:**
- Income is auto-collected
- End turn
```bash
npm run cli -- <player> endturn <gameId>
```

**CLEANUP Phase:**
- End turn to advance to next turn
```bash
npm run cli -- <player> endturn <gameId>
```

### Faction Strategies

Apply these when making decisions:

- **Germany:** Has 2 starting techs. Focus on upgrades, hydrogen efficiency, building larger ships.
- **Britain:** Balanced. Aim for passenger routes and steady income growth.
- **USA:** Prefers helium (if available). Focus on safety and reliability.
- **Italy:** Agile and fast. Build many small ships quickly.

## Step 3: Continue Until Game End

Keep playing until one of:
1. Age 3 completes and game ends naturally
2. Progress track reaches 30 (triggers game end)
3. You've played 15+ turns and want to force end with:
   ```bash
   npm run cli -- <player> action <gameId> CALCULATE_SCORES
   ```

## Step 4: Write Playtest Report

After game ends, create `plans/YYYY-MM-DD_PLAYTEST_REPORT.md` with:

```markdown
# UP SHIP! Playtest Report

*Date: [date]*
*Game ID: [id]*
*Turns Played: [n]*
*Winner: [faction] with [n] VP*

## Summary
[Overall assessment - did the game work? Major issues?]

## Bugs Found
[List each bug with severity, steps to reproduce, expected vs actual]

## Working Features
[What worked correctly]

## Balance Observations
[Faction performance comparison]

## Recommendations
[Priority fixes needed]
```

## CLI Quick Reference

```bash
# State
npm run cli -- <user> state <gameId>
npm run cli -- <user> blueprint <gameId>
npm run cli -- <user> log <gameId> 50

# Actions
npm run cli -- <user> endturn <gameId>
npm run cli -- <user> draw <gameId> 2
npm run cli -- <user> buygas <gameId> hydrogen 4
npm run cli -- <user> loan <gameId>
npm run cli -- <user> build <gameId> 1
npm run cli -- <user> recruit <gameId> pilot 1
npm run cli -- <user> load <gameId> hydrogen 0
npm run cli -- <user> launch <gameId> <shipId>
npm run cli -- <user> action <gameId> ACQUIRE_TECHNOLOGY techId=<id>
npm run cli -- <user> action <gameId> CALCULATE_SCORES
```

## Remember

1. **Think before each move** - Check state, consider options, pick best action
2. **Execute immediately** - Don't ask permission, just run the command
3. **Handle failures gracefully** - If a command fails, note it and try something else
4. **Track bugs** - Note any unexpected behavior for the report
5. **Play to completion** - Keep going until the game ends or you've tested enough
