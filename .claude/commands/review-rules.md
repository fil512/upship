# UP SHIP! Rules Review Command

Invoke the `boardgame-design` skill, then conduct a comprehensive review of the UP SHIP! board game rules.

## Instructions

1. **Read the rules document**: Read `upship_rules.md` thoroughly, including all appendices

2. **Determine output filename**:
   - Base filename: `YYYY-MM-DD_RULES_REVIEW.md` (using today's date)
   - Check `plans/archive/` for existing files with similar names
   - If a file with the same date exists, add a suffix: `-1`, `-2`, etc.
   - Example: if `2025-12-26_RULES_REVIEW.md` exists in archive, use `2025-12-26_RULES_REVIEW-1.md`

3. **Write the review to**: `plans/[filename]`

## Review Criteria

Analyze the rules for the following issues. For each issue found, provide:
- Clear description of the problem
- Location in the rules (section references)
- Suggested remedy or options for resolution
- Priority level (Critical / Important / Moderate / Low)

### Categories to Review

**Unclear Rules**
- Ambiguous wording that could be interpreted multiple ways
- Missing definitions for terms used in the rules
- Conflicting statements in different sections

**Missing Rules**
- Situations not covered by existing rules
- Edge cases without resolution
- Interactions between mechanics that aren't addressed

**Missing Details**
- Incomplete specifications (e.g., costs, limits, quantities)
- References to undefined values
- Vague "typically" or "usually" language that should be precise

**Balance Concerns**
- Faction asymmetry that seems unfair
- Costs that don't match benefits
- Strategies that dominate alternatives
- Runaway leader/snowball effects

**Playability Concerns**
- Mechanics that are overly complex for their purpose
- Phases that may cause analysis paralysis
- Bookkeeping that seems tedious
- Rules that are hard to remember or apply

**Numerical Inconsistencies**
- Conflicting values in different sections
- Component counts that don't match listings
- Scaling values that are inconsistent

**Other Issues**
- Thematic disconnects
- Historical inaccuracies that matter
- Any other concern that should be addressed

## Output Format Requirements

**DO NOT NUMBER the review items.** Use descriptive headers instead so that resolving one issue doesn't require renumbering subsequent sections.

Structure the review as follows:

```markdown
# UP SHIP! Rules Review

*Review date: [today's date]*

## Overview
[Brief summary of the rules review findings]

## Critical Issues
[Issues that are game-breaking or cause confusion that prevents play]

### [Descriptive Issue Title]
**Location:** [Section reference]
**Problem:** [Description]
**Remedy:** [Suggested fix or options]

## Important Issues
[Issues that cause confusion or inconsistency but don't break the game]

## Moderate Issues
[Polish items that would improve clarity]

## Low Priority Issues
[Minor items for completeness]

## Balance Observations
[Notes on potential balance concerns that require playtesting to confirm]

## Positive Notes
[Things the rules do well that should be preserved]
```

## Using the Skill

Apply the board game design expertise from the skill, particularly:
- Rules clarity best practices
- Balance methodology
- Design checklist validation
- Eurogame principles

Reference the skill's `references/design-checklist.md` to ensure comprehensive coverage.
