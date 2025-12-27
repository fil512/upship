# UP SHIP! Implementation Command

Continue implementing the UP SHIP! online board game by working on the next unfinished phase.

## Instructions

### Step 1: Identify Next Phase

1. Read `plans/overview.md`
2. Find the first phase with status `[ ]` (not started)
3. Note the plan filename and description

### Step 2: Create the Plan File

Create the plan file (e.g., `plans/02-database.md`) with:

```markdown
# [Phase Title]

## Overview
[Brief description of what this phase accomplishes]

## Prerequisites
[What must be complete before this phase]

## Goals
- [ ] Goal 1
- [ ] Goal 2
- [ ] Goal 3

## Implementation Steps

### Step 1: [Description]
[Detailed implementation instructions]

### Step 2: [Description]
[Detailed implementation instructions]

[Continue for all steps...]

## Files to Create/Modify
- `path/to/file.js` - Description
- `path/to/file.js` - Description

## Testing
[How to verify this phase is complete]

## Notes
[Any additional context or decisions made]
```

### Step 3: Review with User

Present the plan to the user:

1. Summarize the phase objectives
2. List the key implementation steps
3. Highlight any decisions that need user input
4. Ask: "Does this plan look good, or would you like any changes before I begin implementation?"

**IMPORTANT:** Wait for user approval before proceeding to implementation.

### Step 4: Implement

Once approved:

1. Use TodoWrite to track implementation progress
2. Implement each step from the plan
3. Test as you go
4. Commit changes with clear messages
5. Update the plan file to mark completed goals

### Step 5: Update Overview

After implementation:

1. Update `plans/overview.md` to mark the phase as `[x]` complete
2. Update the "Current Session" section to point to the next phase
3. Commit all changes
4. Summarize what was accomplished

## Context Files

Always read these files for context:
- `plans/overview.md` - Implementation roadmap
- `spec/upship_rules.md` - Game rules (read relevant sections as needed)
- `CLAUDE.md` - Project conventions

## Tech Stack Reference

- **Backend:** Node.js + Express (server/index.js)
- **Frontend:** Static files in public/
- **Database:** PostgreSQL (when added)
- **Real-time:** Socket.io (when added)
- **Hosting:** Railway (auto-deploy on push)
