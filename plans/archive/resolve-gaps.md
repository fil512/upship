# Resolve All Implementation Gaps

Continuously loop between finding and fixing rules implementation gaps until all gaps are resolved. Each iteration runs in a subcontext to preserve parent context.

## Instructions

### Overview

This command orchestrates the gap resolution process:
1. Run `/find-gaps` in a subcontext to discover up to 10 gaps
2. Run `/fix-gaps` in a subcontext to fix discovered gaps using TDD
3. Repeat until no unresolved gaps remain

### Step 1: Initial Status Check

Read `plans/gaps.md` to check current status:
- Count unresolved gaps (`[ ] Unresolved`)
- Note which analysis areas are complete vs pending

Report initial status to user.

### Step 2: Resolution Loop

Execute the following loop:

```
WHILE true:
  1. Run /find-gaps in subcontext (Task tool with prompt to execute the skill)
  2. Check plans/gaps.md for unresolved gap count
  3. IF unresolved gaps == 0 AND all areas analyzed:
       BREAK (success - all gaps resolved)
  4. IF unresolved gaps > 0:
       Run /fix-gaps in subcontext (Task tool with prompt to execute the skill)
  5. Report iteration progress to user
  6. Continue loop
```

### Step 3: Subcontext Execution

When running commands in subcontexts, use the Task tool with:

**For find-gaps:**
```
Task tool:
- subagent_type: "general-purpose"
- prompt: "Execute the /find-gaps skill. Read plans/gaps.md first to check progress, then systematically analyze the next unanalyzed area in spec/upship_rules.md vs server code. Stop at 10 unresolved gaps. Update plans/gaps.md with findings."
- description: "Find implementation gaps"
```

**For fix-gaps:**
```
Task tool:
- subagent_type: "general-purpose"
- prompt: "Execute the /fix-gaps skill. Read plans/gaps.md, then fix unresolved gaps using TDD (write failing test, verify failure, implement fix, verify pass). Update plans/gaps.md as gaps are resolved. Commit changes."
- description: "Fix implementation gaps"
```

### Step 4: Progress Reporting

After each iteration, report:
- Iteration number
- Gaps found this iteration
- Gaps fixed this iteration
- Total remaining unresolved gaps
- Analysis areas remaining

### Step 5: Completion

When no more gaps can be found (all areas analyzed, 0 unresolved gaps):

1. Report final summary:
   - Total gaps found across all iterations
   - Total gaps resolved
   - Total iterations required
   - Analysis areas completed

2. Verify all analysis areas show `[COMPLETE]` or `[ANALYZED]` in gaps.md

3. Run final test suite to confirm no regressions:
   ```bash
   npm test
   ```

## Stop Conditions

Stop the loop when ANY of these conditions are met:

1. **Success**: All analysis areas complete AND unresolved gaps = 0
2. **Manual intervention needed**: A gap cannot be fixed automatically (document and report)
3. **Maximum iterations**: After 20 iterations, pause and ask user whether to continue

## Example Output

```
=== Resolve Gaps: Iteration 1 ===
Running /find-gaps in subcontext...
  → Found 8 new gaps (ROUND_STRUCTURE area)
  → Total unresolved: 8

Running /fix-gaps in subcontext...
  → Fixed 8 gaps
  → Total unresolved: 0

=== Resolve Gaps: Iteration 2 ===
Running /find-gaps in subcontext...
  → Found 5 new gaps (AGE_TRANSITIONS area)
  → Total unresolved: 5

Running /fix-gaps in subcontext...
  → Fixed 5 gaps
  → Total unresolved: 0

=== Resolve Gaps: Iteration 3 ===
Running /find-gaps in subcontext...
  → Found 0 new gaps (all areas analyzed)
  → Total unresolved: 0

✓ All gaps resolved!
  Total iterations: 3
  Total gaps found: 13
  Total gaps fixed: 13
  All 20 analysis areas complete
```

## Notes

- Each subcontext starts fresh, so gaps.md is the shared state between iterations
- The parent context only tracks iteration progress and final results
- If fix-gaps encounters a gap it cannot fix, it will document the reason in gaps.md
- Commits happen within the fix-gaps subcontext after each batch of fixes
