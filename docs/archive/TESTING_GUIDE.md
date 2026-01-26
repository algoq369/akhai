# AkhAI Testing Guide - Phase 0 Completion

This guide helps you verify that all features work before deployment.

## Prerequisites

1. **Environment Variables Set**:
   ```bash
   cd /Users/sheirraza/akhai/packages/web
   cp .env.example .env.local
   # Add your API keys to .env.local
   ```

2. **Dependencies Installed**:
   ```bash
   cd /Users/sheirraza/akhai
   pnpm install
   ```

3. **Start Development Server**:
   ```bash
   cd /Users/sheirraza/akhai
   pnpm dev
   # Or: cd packages/web && pnpm dev
   ```

4. **Open Browser**: Navigate to http://localhost:3001 (or the port shown in terminal)

---

## Test Plan

### 1. UI/UX Tests

#### Initial State
- [ ] Logo "akhai" displays
- [ ] Subtitle "sovereign intelligence" displays
- [ ] Large diamond (◊) is visible
- [ ] Input box is centered with placeholder "enter query..."
- [ ] 7 methodology buttons display (auto, direct, cod, bot, react, pot, gtp)
- [ ] "guard" indicator shows (green dot + text)
- [ ] Footer shows "7 methodologies · 4 providers"

#### Methodology Selector
- [ ] Hover over each methodology button shows tooltip with:
  - Description
  - Token count
  - Latency estimate
  - Savings percentage
- [ ] Clicking a methodology selects it (background turns dark)
- [ ] Selected methodology persists until changed

#### Smooth Expansion
- [ ] Type a query and press Enter
- [ ] Input box smoothly expands (no page redirect)
- [ ] Logo and diamond fade/shrink
- [ ] Header appears with "◊ akhai" and methodology name
- [ ] User message appears on the right in grey background
- [ ] Loading indicator shows "thinking..."

#### Chat Interface
- [ ] Response appears below query with left border
- [ ] Metrics display (tokens, latency, cost)
- [ ] Can type a follow-up query
- [ ] New message uses same expanded interface
- [ ] Auto-scrolls to bottom of conversation
- [ ] "new chat" button in header resets to initial state

---

### 2. Methodology Tests

Test each methodology with a specific query:

#### AUTO (Smart Routing)
**Query**: "What is 2+2?"
- [ ] Routes to `direct` mode automatically
- [ ] Response is quick (~2-5s)
- [ ] Metrics show low token count (~200-500)
- [ ] Cost is minimal (~$0.001)

#### DIRECT (Single AI)
**Query**: "What is the capital of France?"
- [ ] Response in ~2-5s
- [ ] Uses Mother Base (Anthropic) only
- [ ] Metrics: ~200-500 tokens
- [ ] No consensus, just direct answer

#### COD (Chain of Draft)
**Query**: "Explain quantum computing simply"
- [ ] Takes longer (~8-12s)
- [ ] Response is more refined
- [ ] Token count ~400-800
- [ ] Shows iterative improvement

#### BOT (Branch of Thought)
**Query**: "Compare Python vs JavaScript"
- [ ] Takes ~10-15s
- [ ] Response explores multiple angles
- [ ] Token count ~600-1000
- [ ] Structured comparison

#### REACT (Reasoning + Acting)
**Query**: "Calculate the compound interest on $10,000 at 5% for 10 years"
- [ ] May take ~15-20s
- [ ] Shows tool usage (calculation)
- [ ] Token count higher (2k-8k)
- [ ] Accurate math result

#### POT (Program of Thought)
**Query**: "Write Python code to check if a number is prime"
- [ ] Takes ~10-15s
- [ ] Response includes actual code
- [ ] Token count ~3k-6k
- [ ] Code is executable

#### GTP (Generative Thoughts Process)
**Query**: "What are the ethical implications of AGI?"
- [ ] Takes longest (~25-30s)
- [ ] Multi-AI consensus
- [ ] Token count highest (8k-15k)
- [ ] Comprehensive, multi-perspective answer
- [ ] Cost is higher (~$0.15-0.30)

---

### 3. Real-Time Data Tests

#### Crypto Price Queries
**Queries to Test**:
- [ ] "BTC price"
- [ ] "bitcoin price"
- [ ] "ETH price"
- [ ] "ethereum"

**Expected Behavior**:
- Routes to `direct` mode
- Fetches from CoinGecko API
- Response shows:
  - Current price
  - 24h change (with emoji 📈/📉)
  - Source: "CoinGecko"
- Metrics show:
  - 0 tokens (free)
  - $0.00 cost
  - ~1-2s latency
- Green "CoinGecko" or "free" indicator

---

### 4. Conversation History Tests

#### Multi-Turn Conversation
1. **First query**: "What is Python?"
   - [ ] Response explains Python
2. **Follow-up**: "What are its advantages?"
   - [ ] Response refers to Python (not generic "advantages")
   - [ ] Shows context awareness
3. **Follow-up**: "Show me an example"
   - [ ] Response provides Python code example
   - [ ] Maintains conversation context

#### Context Limits
- [ ] Conversation history sends last 6 messages to API
- [ ] Earlier messages don't affect responses

---

### 5. Analytics Tests

#### Track Query Events
1. Open browser DevTools (F12)
2. Run query
3. In Console, run:
   ```javascript
   localStorage.getItem('akhai_analytics_events')
   ```
4. **Expected**: JSON array with your query data

#### Analytics Data Structure
Each event should contain:
- [ ] `query`: Your original query
- [ ] `methodology`: Selected methodology
- [ ] `methodologySelected`: What you chose
- [ ] `methodologyUsed`: What was actually used (after auto-routing)
- [ ] `responseTime`: Time in milliseconds
- [ ] `tokens`: Token count
- [ ] `cost`: Cost in USD
- [ ] `success`: true/false
- [ ] `timestamp`: ISO date string

#### Export for Fine-Tuning
In browser console:
```javascript
// Copy analytics module functions
const events = JSON.parse(localStorage.getItem('akhai_analytics_events') || '[]')
const fineTuningData = events.filter(e => e.success).map(e => ({
  prompt: e.query,
  methodology: e.methodologyUsed,
  metadata: {
    responseTime: e.responseTime,
    tokens: e.tokens,
    timestamp: e.timestamp
  }
}))
console.log(JSON.stringify(fineTuningData, null, 2))
```

---

### 6. Error Handling Tests

#### Missing API Key
1. Remove one API key from `.env.local`
2. Restart server
3. Try a query that uses that provider
- [ ] Error message displays clearly
- [ ] Suggests checking Settings
- [ ] Analytics tracks failed query

#### Network Error
1. Disconnect internet (or block API endpoint)
2. Submit query
- [ ] Error message shows
- [ ] Loading indicator stops
- [ ] Can retry query

#### Invalid Query
- [ ] Empty query doesn't submit
- [ ] Very long query (>10,000 chars) handled gracefully

---

### 7. Performance Tests

#### Latency Benchmarks
| Methodology | Expected Latency | Token Range | Cost Range |
|-------------|------------------|-------------|------------|
| direct | 2-5s | 200-500 | $0.001-0.003 |
| cod | 8-12s | 400-800 | $0.005-0.015 |
| bot | 10-15s | 600-1k | $0.010-0.025 |
| react | 15-20s | 2k-8k | $0.020-0.080 |
| pot | 10-15s | 3k-6k | $0.030-0.060 |
| gtp | 25-30s | 8k-15k | $0.150-0.300 |
| auto | varies | varies | varies |

#### Crypto Price Queries
- [ ] Latency: 1-3s
- [ ] Tokens: 0
- [ ] Cost: $0.00

---

### 8. Mobile Responsiveness

Test on mobile device or browser DevTools mobile view:
- [ ] Input box is usable
- [ ] Methodology buttons fit on screen
- [ ] Messages are readable
- [ ] Tooltips work on touch
- [ ] No horizontal scroll

---

### 9. Production Build Test

Before deploying, verify production build works:

```bash
cd /Users/sheirraza/akhai/packages/web
pnpm build
pnpm start
```

- [ ] Build completes without errors
- [ ] App runs on production server
- [ ] All features work in production mode
- [ ] No console errors

---

## Success Criteria

**Phase 0 is complete when ALL of the following are true:**

✅ All 7 methodologies work via UI
✅ Conversation history maintains context
✅ Real-time crypto prices fetch correctly
✅ Analytics track all queries
✅ Smooth chat interface (no page redirects)
✅ Error handling works gracefully
✅ Production build succeeds
✅ Mobile responsive

---

## Next: Deploy to Vercel

Once all tests pass, see **DEPLOYMENT.md** for Vercel deployment instructions.

🎯 **Goal**: Working demo deployed to `https://akhai.vercel.app` by end of Week 2

---

## Troubleshooting

### TypeScript Errors
```bash
cd /Users/sheirraza/akhai
pnpm build
```
Fix any type errors before deploying.

### API Key Issues
Verify all 4 keys are set in `.env.local`:
```bash
grep -E "^(ANTHROPIC|DEEPSEEK|XAI|MISTRAL)" packages/web/.env.local
```

### Port Already in Use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

---

**Testing complete? Time to deploy! 🚀**

See DEPLOYMENT.md for next steps.
