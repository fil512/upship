# UP SHIP! Strategic Playtest Command

Run a thoughtful playtest where you analyze each game state and make strategic decisions for all 4 factions.

## STEP 1: Setup the Game

```bash
python scripts/playtest.py setup
```

This creates a new 4-player game and saves the game ID to `.upship-current-game`.

## STEP 2: Play Strategically

For each turn, follow this decision-making process:

### Check Current State

```bash
python scripts/playtest.py status
```

Identify:
- Whose turn is it? (look for "YOUR TURN" or "Waiting for:")
- What phase are we in?
- What resources does the current player have?

### Think Through the Decision

Before executing any action, analyze:

1. **What are the player's goals this turn?**
   - Need income? Consider building ships to launch
   - Need capabilities? Look at R&D board for useful tech
   - Low on cash? Maybe take a loan or skip expensive actions

2. **What's the faction strategy?**
   - **Germany**: Leverage starting tech advantage, focus on hydrogen efficiency, build larger ships
   - **Britain**: Balanced growth, steady income, passenger routes
   - **USA**: Prefer helium when affordable, prioritize safety
   - **Italy**: Fast and agile, build many small ships quickly

3. **What phase-specific actions make sense?**
   - **PLANNING**: Draw cards (usually 2), consider hand composition
   - **ACTIONS**: Buy gas, build ships, acquire tech, recruit crew, launch ships
   - **LAUNCH**: Claim routes if ships are ready
   - **INCOME**: Income auto-collects, just end turn
   - **CLEANUP**: End turn to advance

### Execute with Explanation

Run the command and explain your reasoning:

```bash
python scripts/playtest.py action <player> <cmd>
```

### Common Commands

```bash
# Check state
python scripts/playtest.py status
python scripts/playtest.py action <player> state
python scripts/playtest.py action <player> blueprint

# Planning
python scripts/playtest.py action <player> draw 2

# Actions
python scripts/playtest.py action <player> buygas hydrogen 4
python scripts/playtest.py action <player> build 1
python scripts/playtest.py action <player> tech <techId>
python scripts/playtest.py action <player> launch <shipId> hydrogen
python scripts/playtest.py action <player> loan

# End turn
python scripts/playtest.py action <player> endturn
```

### Automated Play

For rapid testing:
```bash
python scripts/playtest.py autoplay 10
```

## STEP 3: Observe and Document

As you play, note:
- **Bugs**: Commands that fail unexpectedly
- **Balance issues**: One faction consistently ahead/behind
- **UX problems**: Confusing state display, unclear errors
- **Rule questions**: Situations where intended behavior is unclear

## STEP 4: Write Report

After playing 10+ turns, create a report at `plans/YYYY-MM-DD_PLAYTEST_REPORT.md`:

```markdown
# UP SHIP! Playtest Report

*Date: [date]*
*Game ID: [id]*
*Turns Played: [n]*

## Game Summary
[What happened? How did each faction perform?]

## Strategic Observations
[What strategies worked? What felt underpowered/overpowered?]

## Bugs Found
[List each bug with steps to reproduce]

## Balance Concerns
[Faction comparison, resource economy issues]

## Recommendations
[Priority fixes and design suggestions]
```

## Key Principles

1. **Think before each move** - Don't just execute commands mechanically
2. **Play each faction authentically** - Use their strengths, work around weaknesses
3. **Document interesting situations** - Note when something feels off
4. **Play to learn** - The goal is finding issues, not "winning"

## Quick Advance

To advance all players through current phase:

```bash
python scripts/playtest.py endphase
```

But prefer making thoughtful individual moves when testing game mechanics.
