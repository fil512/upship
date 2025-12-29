# Find Rules Implementation Gaps

Systematically analyze the game rules in `spec/` and validate they are accurately implemented in `server/`. Stop after finding 10 gaps and record them in `plans/gaps.md`.

## Instructions

### Step 1: Load Existing Progress

Read `plans/gaps.md` if it exists. This file tracks:
- Which analysis areas have been completed
- Which gaps have been found and their status (`[ ]` = unresolved, `[x]` = resolved)

If the file doesn't exist, create it with the initial structure (see Output Format below).

### Step 2: Identify Next Analysis Area

Analysis proceeds in this hierarchy (high-level to fine-grained):

**Level 1 - Core Structure** (analyze first)
1. `ROUND_STRUCTURE` - Game round phases and flow (Section 5)
2. `AGE_TRANSITIONS` - Age progression triggers and effects (Section 12)
3. `SCORING` - Victory points and final scoring (Section 1.1)
4. `GAME_END` - End conditions and triggers (Section 1.2, 1.3)

**Level 2 - Core Mechanics** (after Level 1 complete)
5. `WORKER_PLACEMENT` - Agent placement rules (Section 5.1)
6. `GROUND_BOARD` - Location actions and requirements (Section 6)
7. `BUILDING_SHIPS` - Ship construction rules (Section 7)
8. `LAUNCHING_SHIPS` - Launch procedure and requirements (Section 8)
9. `ROUTES_MAPS` - Route claiming and income (Section 10)

**Level 3 - Supporting Systems** (after Level 2 complete)
10. `TECHNOLOGY` - Technology acquisition and effects (Section 9.1)
11. `UPGRADES` - Upgrade installation and effects (Section 9.2)
12. `GAS_SYSTEM` - Hydrogen/Helium mechanics (Section 9.3)
13. `HAZARD_CHECKS` - Hazard deck and fire mechanics (Section 8.2, 8.3)
14. `DECK_BUILDING` - Card mechanics (Section 11)
15. `ECONOMY` - Cash, income, loans (Section 4.6, 5.3)

**Level 4 - Data Validation** (after Level 3 complete)
16. `FACTION_CONFIG` - Faction starting values and abilities (Section 10)
17. `TECHNOLOGY_VALUES` - Technology tile specs (Appendix C)
18. `UPGRADE_VALUES` - Upgrade tile specs (Appendix D)
19. `ROUTE_VALUES` - Route requirements and rewards (Section 10)
20. `CARD_VALUES` - Card statistics and effects (Section 11, Appendix)

Find the first area that is NOT marked as `[COMPLETE]` in gaps.md.

### Step 3: Perform Analysis

For the selected analysis area:

1. **Read the relevant rules sections** in `spec/upship_rules.md`
2. **Read the corresponding server code**:
   - `server/actions/` - Action processors by type
   - `server/services/gameStateService.js` - State initialization
   - `server/data/` - Data definitions (upgrades.js, groundBoard.js)
   - `server/routes/gameState.js` - API handlers

3. **Compare rules to implementation**, checking for:
   - Missing validation logic
   - Incorrect values or formulas
   - Missing mechanics entirely
   - Wrong order of operations
   - Missing edge case handling

4. **Document each gap found** with:
   - Gap ID (e.g., `GAP-001`)
   - Analysis area it belongs to
   - Rules reference (section number)
   - Code location (file:line if applicable)
   - Description of discrepancy
   - Severity: `CRITICAL` | `HIGH` | `MEDIUM` | `LOW`

### Step 4: Update gaps.md

After analyzing an area:

1. **If gaps were found**: Add them to the appropriate section
2. **Mark area as analyzed**: Add `[ANALYZED]` tag with date
3. **If 10+ total unresolved gaps exist**: Stop analysis

If an area was fully analyzed with no gaps found, mark it as `[COMPLETE]`.

### Step 5: Stop Condition

Stop immediately when the total count of unresolved gaps (`[ ]` items) reaches 10.

Report to user:
- How many gaps were found in this run
- Total unresolved gaps
- Which analysis area was being examined
- Next area to analyze (if under 10 gaps)

## Output Format: plans/gaps.md

```markdown
# Rules Implementation Gaps

Last updated: YYYY-MM-DD

## Summary
- Total gaps found: N
- Resolved: N
- Unresolved: N

## Analysis Progress

### Level 1 - Core Structure
- [ ] ROUND_STRUCTURE
- [ ] AGE_TRANSITIONS
- [ ] SCORING
- [ ] GAME_END

### Level 2 - Core Mechanics
- [ ] WORKER_PLACEMENT
- [ ] GROUND_BOARD
- [ ] BUILDING_SHIPS
- [ ] LAUNCHING_SHIPS
- [ ] ROUTES_MAPS

### Level 3 - Supporting Systems
- [ ] TECHNOLOGY
- [ ] UPGRADES
- [ ] GAS_SYSTEM
- [ ] HAZARD_CHECKS
- [ ] DECK_BUILDING
- [ ] ECONOMY

### Level 4 - Data Validation
- [ ] FACTION_CONFIG
- [ ] TECHNOLOGY_VALUES
- [ ] UPGRADE_VALUES
- [ ] ROUTE_VALUES
- [ ] CARD_VALUES

---

## Unresolved Gaps

### GAP-001: [Title]
- **Area:** ROUND_STRUCTURE
- **Severity:** HIGH
- **Rules:** Section 5.2
- **Code:** server/actions/turn.js:45
- **Issue:** [Description of the discrepancy]
- [ ] Unresolved

---

## Resolved Gaps

### GAP-XXX: [Title]
- **Area:** ...
- **Severity:** ...
- **Rules:** ...
- **Code:** ...
- **Issue:** ...
- [x] Resolved (YYYY-MM-DD) - [Brief note on fix]
```

## Analysis Patterns

When comparing rules to code, look for these common gap types:

**Validation Gaps**
- Rules say "must have X" but code doesn't check
- Rules specify limits but code allows exceeding them
- Rules require prerequisites but code doesn't validate

**Calculation Gaps**
- Formulas differ from rules
- Bonuses/penalties not applied
- Rounding differs from spec

**Flow Gaps**
- Steps occur in wrong order
- Missing phases or sub-phases
- Transition conditions incorrect

**Value Gaps**
- Starting values differ
- Costs don't match
- Quantities incorrect

**Missing Features**
- Entire mechanics not implemented
- Optional rules missing
- Edge cases not handled

## Key Files to Compare

| Rules Section | Primary Code Files |
|---------------|-------------------|
| Section 5 (Round) | server/actions/turn.js, worker.js, helpers/phaseTransition.js |
| Section 6 (Locations) | server/data/groundBoard.js, server/actions/worker.js |
| Section 7 (Building) | server/actions/building.js |
| Section 8 (Launching) | server/actions/launch.js, hazard.js |
| Section 9 (Tech/Upgrades) | server/actions/technology.js, server/data/upgrades.js |
| Section 10 (Routes) | server/actions/launch.js, server/data/routes.js |
| Section 11 (Cards) | server/actions/cards.js, server/services/gameStateService.js |
| Section 12 (Ages) | server/actions/helpers/phaseTransition.js |
| Factions | server/services/gameStateService.js FACTION_CONFIG |
