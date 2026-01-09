# Repeat Playtest Until Complete

Continuously run `/playtest-ui` in subcontexts until all 4 phases are complete. Each iteration runs in a fresh subcontext to preserve parent context.

## CRITICAL: Issue Resolution Gate

**NO NEW PHASE CAN BEGIN UNTIL ALL ISSUES FROM PREVIOUS PHASES ARE RESOLVED.**

Before running any playtest iteration:
1. Scan ALL "Issues Found" sections in `plans/playtest-tracking.md`
2. If ANY unresolved issues exist (not struck through or moved to "Resolved"):
   - **STOP** - Do not proceed to the next phase
   - Fix all unresolved issues first
   - Update the tracking file to mark them resolved
   - Only then continue to the next phase

This is a **blocking requirement**. The purpose of iterative playtesting is to fix issues as they're found, not to accumulate a backlog.

## Allowed Tools and Commands

This skill is allowed to run the following commands without additional permission:
- `python -m playtest *` - All playtest commands
- Chrome DevTools MCP tools (`mcp__chrome-devtools__*`)

## Prerequisites

1. **Chrome DevTools MCP server connected** (chrome-devtools)
2. **Both servers running:**
   - Express API: http://localhost:3000
   - SvelteKit Frontend: http://localhost:5173

## Server Health Check

Use the playtest tool's healthcheck command:
```bash
python -m playtest healthcheck 30  # Wait up to 30 seconds for server
```

Or restart servers if needed:
```bash
scripts/restart_server.sh
python -m playtest healthcheck 30
```

## Instructions

### Step 1: Initial Status Check (BLOCKING)

Read `plans/playtest-tracking.md` to check current status:
- Count completed phases (lines matching `- [x] Phase N:`)
- Count incomplete phases (lines matching `- [ ] Phase N:`)
- **Scan ALL "Issues Found" sections for unresolved issues**
- Note current phase number

**BLOCKING CHECK**: Before proceeding, verify there are NO unresolved issues:
- Unresolved = not struck through (~~like this~~) AND not in a "Resolved Issues" section
- Issues marked as "minor", "not a bug", or "enhancement" still count as unresolved if they describe real problems
- If ANY unresolved issues exist: **DO NOT proceed to playtest loop. Fix issues first.**

Report initial status to user, including:
- Phases complete/incomplete
- Number of unresolved issues (if any)
- What must be done before proceeding

### Step 2: Playtest Loop

Execute the following loop:

```
WHILE true:
  1. Read plans/playtest-tracking.md
  2. Count incomplete phases (- [ ] Phase)
  3. IF incomplete phases == 0:
       BREAK (success - all phases complete)
  4. BLOCKING: Scan ALL "Issues Found" sections for unresolved issues
  5. IF unresolved issues exist:
       a. Report issues to user
       b. Fix ALL issues (code changes, UI fixes, etc.)
       c. Verify fixes work
       d. Update tracking file to mark issues resolved (strikethrough or move to "Resolved")
       e. DO NOT proceed to step 6 until ALL issues are resolved
  6. Run /playtest-ui in subcontext (Task tool)
  7. Report iteration progress to user
  8. Continue loop
```

**The key change**: Issue resolution happens BEFORE running the next phase, not after. You cannot start Phase N until all issues from Phases 1 through N-1 are resolved.

### Step 3: Subcontext Execution

When running `/playtest-ui` in a subcontext, use the Task tool with:

```
Task tool:
- subagent_type: "general-purpose"
- prompt: "Execute the /playtest-ui skill. Read plans/playtest-tracking.md first to find the next incomplete phase, then execute that phase's testing workflow using Chrome DevTools MCP tools. Update the tracking file with results. Mark items [x] when verified, document ALL issues found in the 'Issues Found' section."
- description: "Run playtest phase"
```

### Step 4: Issue Resolution (CRITICAL)

**After each playtest iteration, you MUST resolve all discovered issues before continuing:**

1. Read the "Issues Found" section in the tracking file
2. For each issue:
   - Analyze the root cause
   - Implement the fix (edit code, update styles, fix logic, etc.)
   - Test the fix works (may require browser interaction)
3. Update the tracking file:
   - Mark resolved issues with ~~strikethrough~~ or move to "Resolved Issues"
   - Document what was fixed and how
4. Only proceed to the next iteration when all issues are resolved

**Types of issues to fix:**
- UI bugs (buttons not working, wrong display, etc.)
- Missing functionality (features not implemented)
- UX problems (confusing flows, unclear feedback)
- Visual polish (styling, spacing, colors)
- Console errors or warnings

### Step 5: Progress Reporting

After each iteration, report:
- Iteration number
- Phase that was tested
- Items completed in that phase
- Issues found
- Issues resolved (with brief description of fixes)
- Phases remaining

### Step 6: Completion

When all 4 phases are complete (`- [x]` for all):

1. Report final summary:
   - Total iterations required
   - Total issues found and resolved
   - Any remaining items that need manual attention

2. Verify tracking file shows all phases complete:
   ```
   - [x] Phase 1: UI Functionality
   - [x] Phase 2: UI Game Operation
   - [x] Phase 3: UI User Experience
   - [x] Phase 4: UI Design
   ```

## Stop Conditions

Stop the loop when ANY of these conditions are met:

1. **Success**: All 4 phases show `[x]` in Phase Status section
2. **Blocking issue**: An issue cannot be fixed without user input (ask user how to proceed)
3. **Maximum iterations**: After 10 iterations, pause and ask user whether to continue

## Debugging Commands

The playtest tool provides several useful debugging commands:

| Command | Use When |
|---------|----------|
| `python -m playtest status` | Check current game state and player resources |
| `python -m playtest summary` | View all players' status in a table |
| `python -m playtest whose-turn` | Find whose turn it is and current phase |
| `python -m playtest debug` | Dump raw game state JSON |
| `python -m playtest tail 100` | View last 100 lines of playtest log |
| `python -m playtest poke` | Trigger bot execution if game is stuck |
| `python -m playtest routes` | List available routes for current age |

For server-side bot issues specifically:
```bash
python -m playtest poke        # Force bot to take action
cat /tmp/upship-server.log     # Check server logs
```

## Example Output

```
=== Repeat Playtest: Iteration 1 ===
Current status: 1/4 phases complete
Running /playtest-ui in subcontext...
  → Tested Phase 2: UI Game Operation
  → 15 items verified, 3 issues found:
    1. Gas Depot action fails - no UI prompt for gas type/amount
    2. Toast notifications not appearing
    3. Route selection modal missing

Resolving issues before next iteration...
  → Fixed #1: Added gas selection dialog in GasDepot.svelte
  → Fixed #2: Connected toast store to phase change events
  → Fixed #3: Implemented RouteSelectionModal component
  → All 3 issues resolved, verified fixes work

Phase 2 marked complete.

=== Repeat Playtest: Iteration 2 ===
Current status: 2/4 phases complete
Running /playtest-ui in subcontext...
  → Tested Phase 3: UI User Experience
  → 12 items evaluated, 2 issues found:
    1. Current phase not obvious enough
    2. Available actions not visually discoverable

Resolving issues before next iteration...
  → Fixed #1: Added prominent phase banner with animation
  → Fixed #2: Added glow effect to actionable elements
  → All 2 issues resolved, verified fixes work

Phase 3 marked complete.

=== Repeat Playtest: Iteration 3 ===
Current status: 3/4 phases complete
Running /playtest-ui in subcontext...
  → Tested Phase 4: UI Design
  → 8 visual checks completed, CSS recommendations implemented
  → No blocking issues found

Phase 4 marked complete.

✓ All playtest phases complete!
  Total iterations: 3
  Phases completed: 4/4
  Issues found: 5
  Issues resolved: 5
```

## Notes

- Each subcontext starts fresh, so `plans/playtest-tracking.md` is the shared state between iterations
- The parent context handles issue resolution between playtest runs
- **Never skip issue resolution** - fixing issues is the whole point of iterative playtesting
- If an issue requires architectural changes, document it and ask the user before proceeding
- The subcontext handles browser interaction; issue resolution happens in the parent context
