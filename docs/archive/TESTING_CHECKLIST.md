# AkhAI Testing Checklist - Phase 0 Verification

**Before Deployment to Vercel**

Generated: December 23, 2025
Project: AkhAI - Sovereign AI Research Engine

---

## 🔧 Infrastructure Tests

### Development Server
- [ ] Start server: `cd packages/web && pnpm dev`
- [ ] Server starts without errors
- [ ] Accessible at http://localhost:3001 (or displayed port)
- [ ] No console errors on startup

### Production Build
- [ ] Run: `cd packages/web && pnpm build`
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No ESLint errors (or warnings only)

### Environment Variables
- [ ] `.env.local` file exists in `packages/web/`
- [ ] All 4 API keys configured:
  - [ ] ANTHROPIC_API_KEY
  - [ ] DEEPSEEK_API_KEY
  - [ ] MISTRAL_API_KEY
  - [ ] XAI_API_KEY

**Verify Command:**
```bash
cd /Users/sheirraza/akhai/packages/web
grep "^[A-Z]" .env.local | cut -d'=' -f1
```

---

## 📡 API Tests (Using cURL)

Run these commands to test the new simplified API:

### Test 1: Simple Query (Direct Mode)
```bash
curl -X POST http://localhost:3001/api/simple-query \
  -H "Content-Type: application/json" \
  -d '{"query":"What is 2+2?","methodology":"auto"}'
```

**Expected:**
- `methodology`: "direct"
- `response`: Contains "4"
- `metrics.latency`: < 5000ms
- `guardResult.passed`: true

---

### Test 2: Crypto Price (Real-time Data)
```bash
curl -X POST http://localhost:3001/api/simple-query \
  -H "Content-Type: application/json" \
  -d '{"query":"btc price","methodology":"auto"}'
```

**Expected:**
- `methodologyUsed`: "realtime-data"
- `response`: Contains current BTC price
- `metrics.tokens`: 0
- `metrics.cost`: 0
- `metrics.source`: "CoinGecko"

---

### Test 3: Math Problem (PoT Detection)
```bash
curl -X POST http://localhost:3001/api/simple-query \
  -H "Content-Type: application/json" \
  -d '{"query":"Calculate 15% of 250","methodology":"auto"}'
```

**Expected:**
- `methodology`: "pot" or "direct"
- `selectionReason`: Contains "computation" or similar
- `response`: Contains "37.5"

---

### Test 4: Step-by-Step (CoD Detection)
```bash
curl -X POST http://localhost:3001/api/simple-query \
  -H "Content-Type: application/json" \
  -d '{"query":"Explain step by step how to make coffee","methodology":"auto"}'
```

**Expected:**
- `methodology`: "cod"
- `selectionReason`: Contains "step-by-step"
- `response`: Multi-step explanation

---

### Test 5: Hype Detection (Guard Trigger)
```bash
curl -X POST http://localhost:3001/api/simple-query \
  -H "Content-Type: application/json" \
  -d '{"query":"Tell me something amazing, revolutionary, unprecedented and incredible","methodology":"direct"}'
```

**Expected:**
- `guardResult.passed`: false (likely)
- `guardResult.issues`: Contains "hype"
- `guardResult.scores.hype`: >= 2

---

### Test 6: Debug Endpoint
```bash
curl http://localhost:3001/api/debug
```

**Expected:**
- `status`: "ok"
- `total`: Number of logged events
- `environment.hasAnthropicKey`: true
- `summary.errors`: 0 (unless there were errors)
- `logs`: Array of log entries

---

## 🛡️ Grounding Guard Tests

The Grounding Guard should detect:

### 1. Hype Detection
**Query:** Send any prompt that results in excessive superlatives

**Check in /debug:**
- [ ] `GUARD:HYPE` log entry appears
- [ ] Warning level if hype score >= 2
- [ ] Issues array includes "hype"

### 2. Echo Detection
**Query:** "Tell me about AI. Tell me about AI. Tell me about AI."

**Check in /debug:**
- [ ] `GUARD:ECHO` log entry appears
- [ ] Warning level if repetition score > 30%
- [ ] Issues array includes "echo"

### 3. Drift Detection
**Query:** Ask about topic A, but force response about topic B

**Check in /debug:**
- [ ] `GUARD:DRIFT` log entry appears
- [ ] Warning level if relevance score < 20%
- [ ] Issues array includes "drift"

---

## 🎨 UI Tests (Manual in Browser)

### Home Page (/)
- [ ] Logo "akhai" displays
- [ ] Subtitle "sovereign intelligence" displays
- [ ] Large diamond ◊ visible
- [ ] Input box centered, placeholder "enter query..."
- [ ] 7 methodology buttons visible:
  - [ ] auto ◎
  - [ ] direct →
  - [ ] cod ⋯
  - [ ] bot ◇
  - [ ] react ⟳
  - [ ] pot △
  - [ ] gtp ◯
- [ ] Guard indicator shows (green dot + "guard" text)
- [ ] Footer shows "7 methodologies · 4 providers"

### Methodology Selector
- [ ] Hover shows tooltip for each methodology
- [ ] Tooltip shows: description, tokens, latency, savings
- [ ] Clicking selects methodology (background darkens)
- [ ] Selected state persists

### Chat Interface (Smooth Expansion)
1. Type "hello" and press Enter
- [ ] Input expands smoothly (NO page redirect!)
- [ ] Logo/diamond fade out
- [ ] Header appears with "◊ akhai" button
- [ ] User message appears on right (grey background)
- [ ] Loading indicator shows ("thinking...")
- [ ] Response appears below with left border
- [ ] Metrics display (tokens, latency, cost)

2. Type a follow-up: "what about deep learning?"
- [ ] Interface stays expanded
- [ ] New message uses conversation context
- [ ] Previous messages still visible
- [ ] Auto-scrolls to bottom

3. Click "◊ akhai" in header
- [ ] Interface resets to initial state
- [ ] Logo and diamond reappear
- [ ] Messages clear

### Debug Dashboard (/debug)
- [ ] Page loads without errors
- [ ] Status cards show counts (Total, Errors, Warnings, Guard Triggers)
- [ ] API key status shows ✅ for all 4 providers
- [ ] Auto-refresh checkbox works
- [ ] Filter dropdown works:
  - [ ] All Logs
  - [ ] Errors Only
  - [ ] Warnings Only
  - [ ] Grounding Guard
  - [ ] Query Flow
  - [ ] API Calls
- [ ] Clear logs button works
- [ ] Test query buttons work (try 2-3)

---

## 🔄 Methodology-Specific Tests

Test each methodology directly via the UI:

### AUTO
**Query:** "What is the capital of France?"
- [ ] Routes to "direct" (simple query)
- [ ] Response in ~2-5s
- [ ] Low tokens (~200-500)

### DIRECT
**Query:** "Hello"
- [ ] Single AI response
- [ ] Fast (~2s)
- [ ] Minimal tokens

### COD (Chain of Draft)
**Query:** "Explain photosynthesis step by step"
- [ ] Longer response time (~8-12s)
- [ ] Structured explanation
- [ ] Moderate tokens (~400-800)

### BOT (Buffer of Thoughts)
**Query:** "Compare Python and JavaScript"
- [ ] Multi-angle comparison
- [ ] ~10-15s response
- [ ] ~600-1000 tokens

### REACT
**Query:** "Search for news about AI"
- [ ] Shows reasoning
- [ ] ~15-20s
- [ ] Higher tokens (~2k-8k)

### POT (Program of Thought)
**Query:** "Write a function to calculate factorial"
- [ ] Returns actual code
- [ ] ~10-15s
- [ ] ~3k-6k tokens

### GTP (Consensus)
**Query:** "What are the ethical implications of AGI?"
- [ ] Longest response time (~25-30s)
- [ ] Multi-perspective answer
- [ ] Highest tokens (~8k-15k)

---

## 🌐 Real-Time Data Tests

### Crypto Price Queries
Test these queries and verify real-time data:

- [ ] "BTC price" → Returns current Bitcoin price
- [ ] "bitcoin price" → Same as above
- [ ] "ETH price" → Returns current Ethereum price
- [ ] "ethereum" → Same as above
- [ ] "SOL price" → Returns Solana price
- [ ] "ADA price" → Returns Cardano price

**For each, verify:**
- Metrics show: 0 tokens, $0 cost
- Source: "CoinGecko"
- Latency: ~1-3s
- 24h change percentage displayed

---

## 💬 Conversation History Tests

### Multi-Turn Conversation
1. Ask: "What is Python?"
   - [ ] Response explains Python programming language

2. Ask: "What are its advantages?"
   - [ ] Response specifically mentions Python (not generic)
   - [ ] Shows context awareness

3. Ask: "Show me an example"
   - [ ] Returns Python code example
   - [ ] Maintains full conversation context

### Context Window
- [ ] Last 6 messages sent to API (verify in logs)
- [ ] Earlier messages don't affect responses

---

## 📊 Analytics Tests

### Browser Console Tests
1. Open DevTools (F12)
2. Run query
3. In Console, execute:
```javascript
localStorage.getItem('akhai_analytics_events')
```

**Expected:**
- [ ] Returns JSON array
- [ ] Contains query data
- [ ] Has all required fields:
  - query, methodology, methodologySelected
  - methodologyUsed, responseTime, tokens
  - cost, success, timestamp

### Export Analytics
In Console:
```javascript
const events = JSON.parse(localStorage.getItem('akhai_analytics_events') || '[]')
console.log(JSON.stringify(events, null, 2))
```

- [ ] Valid JSON format
- [ ] All events have complete data
- [ ] Timestamps are ISO format

---

## 🐛 Error Handling Tests

### Missing API Key
1. Temporarily remove `ANTHROPIC_API_KEY` from `.env.local`
2. Restart server
3. Try a query

**Expected:**
- [ ] Error message displays
- [ ] Suggests checking settings
- [ ] Analytics tracks failed query
- [ ] No application crash

### Network Error
1. Simulate network issue (or use invalid API key)
2. Submit query

**Expected:**
- [ ] Error message displays
- [ ] Loading indicator stops
- [ ] Can retry query
- [ ] Application remains functional

### Invalid Query
- [ ] Empty query doesn't submit
- [ ] Very long query (>10,000 chars) handled gracefully

---

## ⚡ Performance Tests

### Latency Benchmarks

| Methodology | Expected Latency | Token Range | Cost Range |
|-------------|------------------|-------------|------------|
| direct      | 2-5s            | 200-500     | $0.001-0.003 |
| cod         | 8-12s           | 400-800     | $0.005-0.015 |
| bot         | 10-15s          | 600-1k      | $0.010-0.025 |
| react       | 15-20s          | 2k-8k       | $0.020-0.080 |
| pot         | 10-15s          | 3k-6k       | $0.030-0.060 |
| gtp         | 25-30s          | 8k-15k      | $0.150-0.300 |
| realtime    | 1-3s            | 0           | $0.000       |

- [ ] All methodologies respond within expected timeframes
- [ ] Crypto queries are consistently fast (1-3s)

---

## 📱 Mobile Responsiveness

Test on mobile device or browser DevTools mobile view (iPhone 12 / Pixel 5):

- [ ] Home page displays correctly
- [ ] Input box is usable
- [ ] Methodology buttons fit on screen
- [ ] Messages are readable
- [ ] Tooltips work on touch
- [ ] No horizontal scroll
- [ ] Chat expansion works smoothly
- [ ] Debug dashboard is usable (tables scroll)

---

## 🚀 Production Build Test

### Final Pre-Deployment Check

```bash
cd /Users/sheirraza/akhai/packages/web
pnpm build
pnpm start
```

- [ ] Build completes without errors
- [ ] Production server starts
- [ ] App accessible at production URL
- [ ] All features work in production mode
- [ ] No console errors
- [ ] Performance is acceptable

---

## ✅ FINAL SIGN-OFF

**Phase 0 is deployment-ready when ALL sections above are checked.**

### Summary Checklist
- [ ] All infrastructure tests pass
- [ ] All API tests return expected results
- [ ] Grounding Guard triggers correctly
- [ ] UI works smoothly (no page redirects)
- [ ] All 7 methodologies tested and working
- [ ] Real-time crypto data fetches correctly
- [ ] Conversation history maintains context
- [ ] Analytics track all queries
- [ ] Error handling works gracefully
- [ ] Performance meets benchmarks
- [ ] Mobile responsive
- [ ] Production build succeeds

---

## 🎯 Next Steps After All Tests Pass

1. **Deploy to Vercel**: See `DEPLOYMENT.md`
2. **Monitor Logs**: Use `/debug` dashboard
3. **Invite Beta Users**: Start with 5-10 people
4. **Collect Feedback**: Track issues and feature requests
5. **Iterate**: Fix bugs, improve UX

---

**Testing Complete: YES / NO** ___________

**Date:** ___________
**Tested by:** ___________
**Notes:**

---

**Ready for Vercel deployment?**

```bash
cd /Users/sheirraza/akhai/packages/web
vercel --prod
```

See **DEPLOY_NOW.md** for deployment instructions!

---

_Generated for AkhAI Phase 0 - December 2025_
