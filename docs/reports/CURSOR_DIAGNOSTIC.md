# AkhAI Cursor Diagnostic - Copy to Composer (Plan Mode)

## FULL DIAGNOSTIC PROMPT

Copy everything below this line into Cursor Composer with Plan mode enabled:

---

## AkhAI Comprehensive Diagnostic

I need you to audit the AkhAI project and run these tests:

### Step 1: Build Check
```bash
cd /Users/sheirraza/akhai/packages/web
npx tsc --noEmit 2>&1 | head -20
pnpm build 2>&1 | tail -10
```

### Step 2: Server Check
```bash
lsof -i :3003 || echo "Server not running"
# If not running: cd /Users/sheirraza/akhai/packages/web && pnpm dev
```

### Step 3: Test All 7 Methodologies

```bash
# Direct
curl -s -X POST http://localhost:3003/api/simple-query \
  -H "Content-Type: application/json" \
  -d '{"query": "2+2", "methodology": "direct"}' | jq '{m: .methodology, ok: (.response | length > 0)}'

# PoT
curl -s -X POST http://localhost:3003/api/simple-query \
  -H "Content-Type: application/json" \
  -d '{"query": "Calculate 15*23", "methodology": "pot"}' | jq '{m: .methodology}'

# CoD
curl -s -X POST http://localhost:3003/api/simple-query \
  -H "Content-Type: application/json" \
  -d '{"query": "Explain AI step by step", "methodology": "cod"}' | jq '{m: .methodology}'

# BoT
curl -s -X POST http://localhost:3003/api/simple-query \
  -H "Content-Type: application/json" \
  -d '{"query": "Compare React vs Vue", "methodology": "bot"}' | jq '{m: .methodology}'

# ReAct
curl -s -X POST http://localhost:3003/api/simple-query \
  -H "Content-Type: application/json" \
  -d '{"query": "Search for news", "methodology": "react"}' | jq '{m: .methodology}'

# GTP
curl -s -X POST http://localhost:3003/api/simple-query \
  -H "Content-Type: application/json" \
  -d '{"query": "Should I learn Python?", "methodology": "gtp"}' | jq '{m: .methodology}'

# Auto
curl -s -X POST http://localhost:3003/api/simple-query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is 100/5", "methodology": "auto"}' | jq '{m: .methodology}'
```

### Step 4: Test Grounding Guard
```bash
# Short query - drift should be FALSE
curl -s -X POST http://localhost:3003/api/simple-query \
  -H "Content-Type: application/json" \
  -d '{"query": "2+2", "methodology": "direct"}' | jq '{drift: .guard.driftTriggered}'
```

### Step 5: Test Real-time Data
```bash
# Current price - should use CoinGecko
curl -s -X POST http://localhost:3003/api/simple-query \
  -H "Content-Type: application/json" \
  -d '{"query": "btc price", "methodology": "auto"}' | jq '{method: .methodologyUsed}'

# Projection - should use AI (NOT CoinGecko)
curl -s -X POST http://localhost:3003/api/simple-query \
  -H "Content-Type: application/json" \
  -d '{"query": "btc price 2030", "methodology": "auto"}' | jq '{method: .methodologyUsed}'
```

### Step 6: Check Files
```bash
ls -la /Users/sheirraza/akhai/packages/web/app/page.tsx
ls -la /Users/sheirraza/akhai/packages/web/app/api/simple-query/route.ts
ls -la /Users/sheirraza/akhai/packages/web/components/GuardWarning.tsx
```

### Output Required
Create a summary:
- ✅ PASSED tests
- ❌ FAILED tests with error
- 🔧 Fixes needed
- Ready for Session 2: Yes/No
