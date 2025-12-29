# Safe Git Push

Push to the remote repository only after verifying lint and tests pass.

## Instructions

### Step 1: Run Lint Check

Run ESLint to check for code quality issues:

```bash
npm run lint
```

If lint fails:
1. Report the errors to the user
2. **DO NOT proceed to push**
3. Offer to fix the lint errors

### Step 2: Run Tests

Run the full test suite:

```bash
npm test
```

If tests fail:
1. Report the failures to the user
2. **DO NOT proceed to push**
3. Offer to investigate and fix the failing tests

### Step 3: Push

Only if both lint and tests pass:

```bash
git push
```

Report the push result to the user.

## Summary

This command enforces the pre-push validation requirements:
- Zero lint errors
- All tests passing

If either check fails, the push is blocked and the user is notified of what needs to be fixed.
