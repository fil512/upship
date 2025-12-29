# Plan: CLI and Script Updates for New Phase System

## Summary

Update the CLI tool (`cli/upship.js`) and supporting scripts to work with the new 3-phase game loop: `worker_placement` → `reveal` → `income_cleanup`.

## Files to Modify

| File | Changes |
|------|---------|
| `cli/upship.js` | Phase formatting, PASS command, state display, help text |
| `scripts/playtest.py` | Already updated (Phase 8 complete) |
| `CLAUDE.md` | Update CLI documentation |

## Implementation Tasks

### Task 1: Update `formatPhase()` Function

**File:** `cli/upship.js` (line ~184)

Current:
```javascript
function formatPhase(phase) {
  const phaseColors = {
    planning: COLORS.blue,
    actions: COLORS.yellow,
    launch: COLORS.magenta,
    income: COLORS.green,
    cleanup: COLORS.gray
  };
  return c(phaseColors[phase] || COLORS.white, phase?.toUpperCase() || 'UNKNOWN');
}
```

Change to:
```javascript
function formatPhase(phase) {
  const phaseColors = {
    worker_placement: COLORS.yellow,
    reveal: COLORS.blue,
    income_cleanup: COLORS.green,
    // Legacy phases (backwards compatibility)
    planning: COLORS.blue,
    actions: COLORS.yellow,
    launch: COLORS.magenta,
    income: COLORS.green,
    cleanup: COLORS.gray
  };
  const displayNames = {
    worker_placement: 'WORKER PLACEMENT',
    reveal: 'REVEAL',
    income_cleanup: 'INCOME & CLEANUP'
  };
  const displayName = displayNames[phase] || phase?.toUpperCase() || 'UNKNOWN';
  return c(phaseColors[phase] || COLORS.white, displayName);
}
```

### Task 2: Add `pass` Shorthand Command

**File:** `cli/upship.js` (after `endturn` at line ~716)

Add:
```javascript
async pass(username, args) {
  return commands.action(username, [args[0], 'PASS']);
},
```

### Task 3: Add PLACE_AGENT Shorthand Command

**File:** `cli/upship.js` (after other shorthand commands)

Add:
```javascript
async place(username, args) {
  const [gameId, locationId, cardIndex] = args;
  if (!gameId || !locationId || cardIndex === undefined) {
    console.log('Usage: upship <user> place <gameId> <locationId> <cardIndex>');
    console.log('');
    console.log('Locations:');
    console.log('  research-institute, design-bureau, construction-hall (wrench)');
    console.log('  launchpad, ministry, gas-depot, weather-bureau (propeller)');
    console.log('  academy, flight-school, technical-institute, the-bank, insurance-bureau (coin)');
    return;
  }
  return commands.action(username, [gameId, 'PLACE_AGENT', `locationId=${locationId}`, `cardIndex=${cardIndex}`]);
},
```

### Task 4: Update Action Help Text

**File:** `cli/upship.js` (line ~644)

Add to the action help text:
```javascript
console.log('  PASS                        - Pass (worker placement only)');
console.log('  PLACE_AGENT locationId=<id> cardIndex=<n> - Place agent at location');
```

### Task 5: Update State Display for Worker Placement Info

**File:** `cli/upship.js` (in `state` command, after turn indicator at ~line 423)

Add worker placement-specific display:
```javascript
// Show worker placement info if in that phase
if (gs.phase === 'worker_placement' && gs.workerPlacement) {
  const placementOrder = gs.workerPlacement.placementOrder || [];
  const currentPlacerIdx = gs.workerPlacement.currentPlacerIndex || 0;
  const passedPlayers = gs.workerPlacement.passedPlayers || [];

  console.log('');
  console.log(c(COLORS.bright, '┌─ Worker Placement'));
  console.log(`│ Placement Order: ${placementOrder.map((pid, i) => {
    const pState = gs.players[pid];
    const passed = passedPlayers.includes(pid);
    const current = i === currentPlacerIdx;
    const marker = current ? '►' : ' ';
    const status = passed ? c(COLORS.gray, '(passed)') : '';
    return `${marker}${formatFaction(pState?.faction)}${status}`;
  }).join(', ')}`);
  console.log(`│ Agents Remaining: ${myState?.agentsRemaining || 0}/3`);
  console.log('└─────────────────────────────────────');
}
```

### Task 6: Show Influence and Research in State Display

**File:** `cli/upship.js` (in `state` command, resource display at ~line 428)

Update resource display to include new resources:
```javascript
console.log(`│ Research: ${c(COLORS.magenta, myState.research || 0)}  │  Influence: ${c(COLORS.cyan, myState.influence || 0)}`);
```

### Task 7: Update Ground Board Display

**File:** `cli/upship.js` (in `state` command)

Add Ground Board status display:
```javascript
// Ground Board placements
if (gs.groundBoard?.placements && Object.keys(gs.groundBoard.placements).length > 0) {
  console.log('');
  console.log(c(COLORS.bright, '┌─ Ground Board (Occupied Locations)'));
  for (const [locId, placement] of Object.entries(gs.groundBoard.placements)) {
    const pState = gs.players[placement.playerId];
    console.log(`│ ${locId}: ${formatFaction(pState?.faction)} (${placement.cardUsed || '?'})`);
  }
  console.log('└─────────────────────────────────────');
}
```

### Task 8: Update CLAUDE.md Documentation

**File:** `CLAUDE.md`

Update the CLI Game Actions section to include:
```markdown
### Worker Placement Phase
npm run cli -- <user> place <gameId> <locationId> <cardIndex>  # Place agent
npm run cli -- <user> pass <gameId>                           # Pass this round

### Location IDs
- Wrench: research-institute, design-bureau, construction-hall
- Propeller: launchpad, ministry, gas-depot, weather-bureau
- Coin: academy, flight-school, technical-institute, the-bank, insurance-bureau
```

## Testing

After implementation:

```bash
# Setup new game
python scripts/playtest.py setup

# Check state shows new phase info
npm run cli -- playtest_germany state <gameId>

# Test pass command
npm run cli -- playtest_germany pass <gameId>

# Test place command
npm run cli -- playtest_germany place <gameId> gas-depot 0

# Run autoplay
python scripts/playtest.py autoplay 3
```

## Priority

Medium - CLI updates are important for playtesting but the playtest.py tool already handles the new phases.
