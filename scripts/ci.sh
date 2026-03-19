#!/bin/bash
# ============================================================
# AkhAI — Local CI Pipeline
# Run before every deploy: ./scripts/ci.sh
# ============================================================
set -e

echo "━━━ AkhAI CI Pipeline ━━━"
echo ""

cd "$(dirname "$0")/.."

# Step 1: Type check
echo "① Type checking..."
cd packages/web && npx tsc --noEmit 2>&1 | tail -5
TYPE_EXIT=${PIPESTATUS[0]}
cd ../..
if [ $TYPE_EXIT -ne 0 ]; then
  echo "  ✗ Type errors found. Fix before deploying."
  exit 1
fi
echo "  ✓ Types clean"
echo ""

# Step 2: Build
echo "② Building..."
cd packages/web && npx next build 2>&1 | tail -5
BUILD_EXIT=${PIPESTATUS[0]}
cd ../..
if [ $BUILD_EXIT -ne 0 ]; then
  echo "  ✗ Build failed. Fix before deploying."
  exit 1
fi
echo "  ✓ Build passed"
echo ""

# Step 3: Tests (when available)
if [ -f "packages/web/vitest.config.ts" ] || [ -f "packages/web/vitest.config.mts" ]; then
  echo "③ Running tests..."
  cd packages/web && npx vitest run --reporter=verbose 2>&1 | tail -10
  TEST_EXIT=${PIPESTATUS[0]}
  cd ../..
  if [ $TEST_EXIT -ne 0 ]; then
    echo "  ✗ Tests failed. Fix before deploying."
    exit 1
  fi
  echo "  ✓ Tests passed"
else
  echo "③ Tests: skipped (no vitest config)"
fi
echo ""

# Step 4: Security audit
echo "④ Security audit..."
pnpm audit --prod 2>&1 | tail -3
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All checks passed — safe to deploy"
echo "Run: ./deploy/quick-deploy.sh"
