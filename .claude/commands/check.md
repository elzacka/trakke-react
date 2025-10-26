---
description: Run all quality checks before committing
---

Run all quality checks in sequence and report results:

1. Run `npm run lint` to check for linting errors
2. Run `npm run typecheck` to verify TypeScript types
3. Run `npm test -- --run` to execute all tests
4. Run `npm run build` to ensure the project builds successfully

After running all checks, provide a clear summary showing:
- ✅ Which checks passed
- ❌ Which checks failed (with error details)
- 📊 Overall status (all passed / some failed)

If any check fails, provide guidance on how to fix the issues.
