# Bot Logic Synchronization Command

Keep bot logic synchronized between the server (TypeScript) and playtest (Python) implementations.

## Bot Logic Files

**Server (TypeScript):**
- `server/services/botService.ts` - Strategy functions (placements, launches, acquisitions)
- `server/services/botExecutor.ts` - Orchestrates bot moves by phase

**Playtest (Python):**
- `playtest/strategy.py` - Strategy functions (placements, launches, acquisitions)
- `playtest/phases.py` - Phase handlers that use strategy functions

## Function Mapping

| Server (botService.ts) | Playtest (strategy.py) | Sync ID |
|------------------------|------------------------|---------|
| `findStrategicPlacement()` | `find_strategic_placement()` | BOT-PLACEMENT-01 |
| `evaluateLaunchReadiness()` | `evaluate_launch_readiness()` | BOT-LAUNCH-READY-01 |
| `getBlueprintDesignBlueprint()` | `get_blueprint_design_blueprint()` | BOT-BLUEPRINT-01 |
| `findLaunchDecision()` | `_attempt_route_launches()` | BOT-LAUNCH-01 |
| `getRevealAcquisitions()` | `get_reveal_acquisitions()` | BOT-REVEAL-01 |
| `getHazardResponse()` | `_handle_hazard_response()` | BOT-HAZARD-01 |
| `calculateTechScore()` | (inline in get_reveal_acquisitions) | BOT-TECH-SCORE-01 |
| `getMarketCardPriority()` | `get_card_priority()` (inline) | BOT-CARD-PRIORITY-01 |
| `buildLocationAction()` | (inline in _execute_placement) | BOT-LOC-ACTION-01 |
| - | `evaluate_combat_mission_readiness()` | BOT-COMBAT-01 |
| - | `find_best_combat_mission()` | BOT-COMBAT-02 |

## Analysis Steps

### Step 1: Analyze Recent Commits

Find commits that changed bot logic in either place:

```bash
git log --oneline -20 -- server/services/botService.ts server/services/botExecutor.ts playtest/strategy.py playtest/phases.py
```

### Step 2: Compare Current Implementations

For each function pair with a Sync ID, compare:

1. **Priority lists** - Are location/tech/card priorities the same?
2. **Thresholds** - Are numeric thresholds (cash, gas, officers) the same?
3. **Conditions** - Are the same checks being made?
4. **Feature parity** - Does one have features the other lacks?

### Step 3: Identify Gaps

Report any logic that exists in one place but not the other:

- Server-only features that need porting to playtest
- Playtest-only features that need porting to server
- Divergent logic where implementations differ

### Step 4: Add/Update Sync IDs

When syncing, add comments with Sync IDs to make future comparison easier:

**TypeScript format:**
```typescript
// [BOT-PLACEMENT-01] Strategic placement priorities
const priorityLocations = [
  // Phase 1: Launch if ready
  ...
];
```

**Python format:**
```python
# [BOT-PLACEMENT-01] Strategic placement priorities
priority_locations = [
    # Phase 1: Launch if ready
    ...
]
```

## Execution Instructions

1. **Run the git log analysis** to see recent changes
2. **Read both implementations** to compare current state
3. **Identify sync gaps** between the two
4. **Report findings** with specific code references
5. **If requested**, make the changes to sync the implementations

When making sync changes:
- Always preserve the existing logic in the "source" file
- Port logic carefully, accounting for language differences
- Add/update Sync ID comments in both files
- Test after syncing to ensure both work correctly

## Key Sync Points to Check

### 1. Location Priority Order (BOT-PLACEMENT-01)
Both should have the same priority order for ground board locations.

### 2. Tech Acquisition Logic (BOT-REVEAL-01)
- Tech scoring formula
- Priority keywords (drive, structure, fabric, gas)
- Research budget calculation

### 3. Market Card Priority (BOT-CARD-PRIORITY-01)
- Symbol priorities (operations > technical > business > any > reserve)
- VP bonus handling

### 4. Launch Readiness Checks (BOT-LAUNCH-READY-01)
- Officer requirements per age
- Gas requirements
- Blueprint slot requirements
- Route achievability checks

### 5. Hazard Response (BOT-HAZARD-01)
- Engineer threshold for spending
- Auto-pass conditions

## Output Format

```
=== BOT LOGIC SYNC ANALYSIS ===

RECENT CHANGES (last 10 commits):
- [commit] [date] [message] → [files changed]

SYNC STATUS BY FUNCTION:

[BOT-PLACEMENT-01] findStrategicPlacement
  Server: Last changed [commit]
  Playtest: Last changed [commit]
  Status: [IN SYNC | PLAYTEST AHEAD | SERVER AHEAD | DIVERGED]
  Gaps: [description of differences]

[BOT-REVEAL-01] getRevealAcquisitions
  ...

RECOMMENDED ACTIONS:
1. [action description]
2. [action description]
```
