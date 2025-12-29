# Fix Rules Implementation Gap

Identify and resolve the next implementation gap between `spec/upship_rules.md` and the server implementation, then update the audit and commit.

## Instructions

### Step 1: Read the Audit Document

Read `plans/rules-implementation-audit.md` and identify the **first unchecked item** (`[ ]`) that is marked as TODO.

Priority order:
1. Items under "Implementation Issues Found" → "Critical" section (if any remain)
2. Items under "Implementation Issues Found" → "Medium" section
3. Items under "Implementation Issues Found" → "Low" section
4. Any other `[ ]` items in the phase checklists

### Step 2: Understand the Gap

1. Read the relevant section of `spec/upship_rules.md` to understand what the rules require
2. Read the relevant server code to understand the current implementation
3. Identify exactly what needs to change

### Step 3: Implement the Fix

1. Use TodoWrite to track the fix
2. Make the minimal changes necessary to resolve the gap
3. Follow existing code patterns in the codebase
4. Test the change if possible (e.g., syntax check with `node --check`)

Key files typically involved:
- `server/routes/gameState.js` - Action processing logic
- `server/services/gameStateService.js` - Game initialization and state
- `server/data/upgrades.js` - Upgrade definitions
- `server/data/groundBoard.js` - Location definitions

### Step 4: Update the Audit Document

Edit `plans/rules-implementation-audit.md`:

1. Change the item's checkbox from `[ ]` to `[x]`
2. Add `✓` and a brief note about what was fixed (e.g., "**RESOLVED: Added validation in processLaunchShip**")
3. If the item was in the "Medium" or "Low" issues section, add a note there too
4. Update the summary statistics if needed

### Step 5: Commit and Push

Create a single commit with:
- The server code changes
- The updated audit document

Commit message format:
```
Fix: [brief description of what was fixed]

Resolves [rule section reference] implementation gap.
- [bullet point of what was changed]
- [bullet point of what was changed]
```

Then push to origin/main.

### Step 6: Report

Summarize to the user:
1. What gap was identified
2. What changes were made
3. What the next unresolved gap is (for context)

## Context Files

Always read these for context:
- `plans/rules-implementation-audit.md` - The audit tracking document
- `spec/upship_rules.md` - Game rules (read relevant sections)
- `CLAUDE.md` - Project conventions

## Example Session

```
Reading audit document...
Found next gap: "Helium Requirement - Requires Helium Handling technology to purchase/use"
  → Section 4.4 of rules

Reading spec/upship_rules.md Section 4.4...
Reading server/routes/gameState.js processBuyGas function...

The gap: Players can buy Helium without having Helium Handling technology.
The fix: Add validation in processBuyGas to check player has HELIUM_HANDLING tech.

[Implements fix]
[Updates audit document]
[Commits: "Fix: Require Helium Handling tech to purchase helium"]
[Pushes to main]

Done! Fixed Helium Handling requirement validation.
Next gap: "First ship must launch from Home Base" (Age II map rules)
```
