# Fix Implementation Gaps (TDD)

Fix the next unresolved gaps from `plans/gaps.md` using Test-Driven Development. Continue until 10 gaps are fixed or no unresolved gaps remain.

## Instructions

### Step 1: Load Gaps

Read `plans/gaps.md` and identify all unresolved gaps (`[ ] Unresolved`).

If no unresolved gaps exist, inform the user and suggest running `/find-gaps` first.

### Step 2: Process Each Gap (up to 10)

For each unresolved gap, in order by GAP ID:

#### 2a: Understand the Gap

1. Read the gap details from gaps.md:
   - Rules reference (section number)
   - Code location (file:line)
   - Issue description
   - Severity

2. Read the relevant rules section in `spec/upship_rules.md`

3. Read the relevant server code to understand current behavior

#### 2b: Write a Failing Test (RED)

Create a test that demonstrates the gap. The test should:
- Describe what the rules require
- Set up a scenario that triggers the incorrect behavior
- Assert the correct behavior per the rules
- **MUST FAIL** with current implementation

**Test file location:** Add tests to existing files or create new ones:
- `__tests__/unit/rules/` - For rules validation tests (create if needed)
- Or add to relevant existing test file based on the code being tested

**Test naming convention:**
```javascript
describe('Rules Compliance', () => {
  describe('GAP-XXX: [Gap Title]', () => {
    it('should [expected behavior per rules]', () => {
      // Test implementation
    });
  });
});
```

**Example test structure:**
```javascript
// __tests__/unit/rules/roundStructure.test.js
const { processEndTurn } = require('../../../server/actions/turn');
const { createTestGameState } = require('../../fixtures/testData');

describe('Rules Compliance - Round Structure', () => {
  describe('GAP-001: Income Phase Order', () => {
    it('should process income before cleanup per Section 5.2', () => {
      const state = createTestGameState();
      state.phase = 'income_cleanup';
      state.players['1'].income = 10;
      state.players['1'].cash = 5;

      const { newState } = processEndTurn(state, '1');

      // Per rules 5.2: Income is added first
      expect(newState.players['1'].cash).toBe(15);
    });
  });
});
```

#### 2c: Verify Test Fails (RED confirmation)

Run the specific test to confirm it fails:
```bash
npm test -- --testPathPattern="[test-file]" --testNamePattern="GAP-XXX"
```

If the test passes unexpectedly:
- The gap may already be fixed - verify and update gaps.md
- Or the test doesn't correctly capture the gap - revise the test

**DO NOT proceed to fix until the test fails.**

#### 2d: Implement the Fix (GREEN)

Make the minimal code changes to make the test pass:

1. Edit the relevant server file(s)
2. Follow existing code patterns
3. Add validation, logic, or correct values as needed
4. Keep changes focused on the specific gap

Key files typically involved:
- `server/actions/*.js` - Action processors
- `server/services/gameStateService.js` - State initialization
- `server/data/upgrades.js` - Upgrade definitions
- `server/data/groundBoard.js` - Location definitions
- `server/actions/helpers/*.js` - Shared logic

#### 2e: Verify Test Passes (GREEN confirmation)

Run the test again to confirm it now passes:
```bash
npm test -- --testPathPattern="[test-file]" --testNamePattern="GAP-XXX"
```

If the test still fails, continue debugging and fixing.

#### 2f: Run Full Test Suite

Ensure no regressions:
```bash
npm test
```

If other tests fail, fix them before proceeding.

#### 2g: Update gaps.md

Edit `plans/gaps.md`:
1. Change `[ ] Unresolved` to `[x] Resolved (YYYY-MM-DD)`
2. Add brief note about the fix
3. Move the gap entry from "Unresolved Gaps" to "Resolved Gaps" section
4. Update the Summary counts

### Step 3: Commit Progress

After fixing gaps (either 10 or all remaining), create a commit:

```bash
git add -A
git commit -m "$(cat <<'EOF'
Fix N rules implementation gaps (TDD)

Resolved gaps:
- GAP-XXX: [brief description]
- GAP-YYY: [brief description]
...

All fixes include regression tests.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### Step 4: Report Summary

Report to user:
- Number of gaps fixed
- List of GAP IDs and brief descriptions
- Any gaps that couldn't be fixed and why
- Remaining unresolved gap count
- Test results summary

## TDD Checklist for Each Gap

```
[ ] Read and understand the gap
[ ] Read relevant rules section
[ ] Read relevant server code
[ ] Write failing test
[ ] Verify test FAILS (RED)
[ ] Implement minimal fix
[ ] Verify test PASSES (GREEN)
[ ] Run full test suite
[ ] Update gaps.md
```

## Test File Organization

Create test files organized by rules area:

```
__tests__/
├── unit/
│   ├── rules/                    # Rules compliance tests (new)
│   │   ├── roundStructure.test.js
│   │   ├── ageTransitions.test.js
│   │   ├── scoring.test.js
│   │   ├── gameEnd.test.js
│   │   ├── workerPlacement.test.js
│   │   ├── groundBoard.test.js
│   │   ├── building.test.js
│   │   ├── launching.test.js
│   │   ├── routes.test.js
│   │   ├── technology.test.js
│   │   ├── upgrades.test.js
│   │   ├── gasSystem.test.js
│   │   ├── hazards.test.js
│   │   ├── deckBuilding.test.js
│   │   ├── economy.test.js
│   │   └── factions.test.js
│   └── ... (existing tests)
└── fixtures/
    └── testData.js
```

## Common Test Patterns

### Testing State Transitions
```javascript
it('should transition from X to Y when condition met', () => {
  const state = createTestGameState();
  state.phase = 'X';
  // Set up condition

  const { newState } = processAction(state, playerId, 'ACTION');

  expect(newState.phase).toBe('Y');
});
```

### Testing Validation
```javascript
it('should reject action when prerequisite missing', () => {
  const state = createTestGameState();
  // Missing prerequisite

  const result = processAction(state, playerId, 'ACTION', data);

  expect(result.error).toContain('expected error message');
});
```

### Testing Calculations
```javascript
it('should calculate X correctly per rules', () => {
  const state = createTestGameState();
  // Set up values

  const { newState } = processAction(state, playerId, 'ACTION');

  expect(newState.players[playerId].value).toBe(expectedValue);
});
```

### Testing Data Values
```javascript
it('should have correct starting value per rules Section N', () => {
  const config = FACTION_CONFIG.germany;

  expect(config.startingCash).toBe(15); // Per rules 3.2
});
```

## Stop Conditions

Stop processing when:
1. 10 gaps have been successfully fixed
2. No more unresolved gaps remain
3. A gap cannot be fixed (document why and continue to next)

## Notes

- Each gap fix should be atomic and focused
- Tests serve as documentation of rules requirements
- Prefer unit tests over integration tests for faster feedback
- Use descriptive test names that reference the rules section
- Keep test setup minimal but sufficient to demonstrate the issue
