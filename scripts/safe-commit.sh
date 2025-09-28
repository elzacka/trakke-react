#!/bin/bash
# Safe commit script - runs all checks before committing

echo "🔍 Running pre-commit checks..."
echo ""

# Check if commit message was provided
if [ $# -eq 0 ]; then
    echo "❌ Error: Please provide a commit message"
    echo "Usage: ./scripts/safe-commit.sh \"Your commit message\""
    exit 1
fi

COMMIT_MESSAGE="$1"

# 1. Run ESLint
echo "1️⃣ Running ESLint..."
npm run lint
LINT_EXIT_CODE=$?

if [ $LINT_EXIT_CODE -ne 0 ]; then
    echo ""
    echo "❌ ESLint found errors! Attempting auto-fix..."
    echo ""

    # Try auto-fix
    echo "🔧 Running auto-fix..."
    npm run lint -- --fix

    # Check again
    echo "🔍 Re-checking after auto-fix..."
    npm run lint
    LINT_EXIT_CODE=$?

    if [ $LINT_EXIT_CODE -ne 0 ]; then
        echo ""
        echo "❌ ESLint still has errors after auto-fix!"
        echo "Please manually fix the remaining errors before committing."
        echo ""
        exit 1
    else
        echo "✅ Auto-fix successful!"
    fi
else
    echo "✅ ESLint passed!"
fi

# 2. Run TypeScript check
echo ""
echo "2️⃣ Running TypeScript check..."
npm run typecheck
TYPECHECK_EXIT_CODE=$?

if [ $TYPECHECK_EXIT_CODE -ne 0 ]; then
    echo ""
    echo "❌ TypeScript check failed!"
    echo "Please fix TypeScript errors before committing."
    echo ""
    exit 1
else
    echo "✅ TypeScript check passed!"
fi

# 3. Run build test
echo ""
echo "3️⃣ Testing build..."
npm run build
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -ne 0 ]; then
    echo ""
    echo "❌ Build failed!"
    echo "Please fix build errors before committing."
    echo ""
    exit 1
else
    echo "✅ Build successful!"
fi

# 4. Add and commit
echo ""
echo "4️⃣ Committing changes..."
git add .

# Create commit with Claude signature
git commit -m "$COMMIT_MESSAGE

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Commit successful!"
    echo ""
    echo "📋 Summary:"
    echo "  ✅ ESLint passed"
    echo "  ✅ TypeScript check passed"
    echo "  ✅ Build successful"
    echo "  ✅ Changes committed"
    echo ""
    echo "💡 Next steps:"
    echo "  - Review your changes: git log --oneline -1"
    echo "  - Push to GitHub: git push"
else
    echo ""
    echo "❌ Commit failed!"
    exit 1
fi