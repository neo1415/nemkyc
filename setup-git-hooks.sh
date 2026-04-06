#!/bin/bash
# Setup script for git hooks

echo "🔧 Setting up git hooks..."

# Check if .git directory exists
if [ ! -d ".git" ]; then
  echo "❌ Error: .git directory not found. Are you in the project root?"
  exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy pre-commit hook
if [ -f ".git-hooks/pre-commit" ]; then
  cp .git-hooks/pre-commit .git/hooks/pre-commit
  chmod +x .git/hooks/pre-commit
  echo "✅ Pre-commit hook installed"
else
  echo "❌ Error: .git-hooks/pre-commit not found"
  exit 1
fi

# Test the hook
echo ""
echo "🧪 Testing hook..."
echo "private_key: test" > .test-secret-file.tmp
git add .test-secret-file.tmp 2>/dev/null

if .git/hooks/pre-commit; then
  echo "❌ Hook test failed - secrets were not detected"
  rm .test-secret-file.tmp
  git reset .test-secret-file.tmp 2>/dev/null
  exit 1
else
  echo "✅ Hook test passed - secrets were detected and blocked"
  rm .test-secret-file.tmp
  git reset .test-secret-file.tmp 2>/dev/null
fi

echo ""
echo "✅ Git hooks setup complete!"
echo ""
echo "📝 The pre-commit hook will now scan for secrets before each commit."
echo "   To bypass (NOT RECOMMENDED): git commit --no-verify"
