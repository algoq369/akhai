# AKHAI Query Routing - Smart Methodology Selection

## Overview

The AKHAI web app now includes **automatic query classification** that routes simple queries to DIRECT mode for fast responses (<10s), while complex queries still use multi-AI consensus.

## Problem Fixed

**Before:** Query "btc price" (2 words) triggered full 4-AI consensus with 3 rounds (~60-90 seconds)

**After:** Query "btc price" is automatically detected as simple and uses DIRECT mode (~5-10 seconds)

## How It Works

### 1. Query Classifier (`lib/query-classifier.ts`)

Analyzes incoming queries BEFORE execution to determine optimal methodology.

**Detection Rules:**

#### Simple Queries → DIRECT Mode (~5-10s)
- Price queries: "btc price", "eth cost", "price of X"
- Definitions: "what is X", "who is Y", "define Z"
- Short factual questions (< 5 words)
- NO comparison words detected

**Examples:**
```
"btc price" → DIRECT (Price query)
"what is bitcoin" → DIRECT (Short factual)
"define AI" → DIRECT (Definition)
"who is elon musk" → DIRECT (Short factual)
```

#### Comparison Queries → GTP Mode (~25s)
- Contains: vs, versus, compare, difference, better, worse
- Requires multiple perspectives

**Examples:**
```
"compare react vs vue" → GTP (Comparison)
"bitcoin vs ethereum" → GTP (Comparison)
"which is better python or javascript" → GTP (Comparison)
```

#### Complex Analysis → CoT Mode (~30-60s)
- Contains: analyze, evaluate, strategy, recommend
- Long queries (> 10 words)
- Requires step-by-step reasoning

**Examples:**
```
"analyze my business strategy" → CoT (Complex analysis)
"evaluate these investment options" → CoT (Complex analysis)
```

### 2. API Route Auto-Detection (`app/api/query/route.ts`)

The query API now:
1. Classifies query BEFORE processing
2. Auto-selects methodology (unless user explicitly sets one)
3. Routes to appropriate execution path

**Code Flow:**
```typescript
POST /api/query
  ↓
classifyQuery(query) → { isSimple, suggestedMethodology, reason }
  ↓
if (isSimple && methodology === 'auto')
  → finalMethodology = 'direct'
  ↓
processQuery(queryId, 'direct')
  ↓
FAST PATH: Direct Mother Base call (no advisors)
  ↓
Response in ~5-10 seconds ✅
```

### 3. Direct Mode Optimization

**Fast Path Features:**
- ✅ Single AI call (Mother Base only, NO advisors)
- ✅ No consensus rounds
- ✅ Optimized system prompt for factual queries
- ✅ Real-time cost estimation
- ✅ SSE event: `fast-path` to notify UI
- ✅ Response time: 5-10 seconds
- ✅ Cost: ~$0.001 per query (95% cheaper than consensus)

**Direct Mode Code:**
```typescript
if (flowType === 'direct') {
  // Emit fast-path event
  addQueryEvent(queryId, 'fast-path', {
    mode: 'direct',
    estimatedTime: '5-10 seconds'
  });

  // Single AI call - NO advisors
  const provider = createProviderFromFamily('anthropic', apiKeys);
  const response = await provider.complete({
    messages: [{ role: 'user', content: query }],
    systemPrompt: 'Be helpful and concise.'
  });

  // Done! Update status and return
  updateQueryStatus(queryId, 'complete', { finalAnswer: response.content });
}
```

## Methodology Comparison

| Methodology | Speed | Cost | Best For |
|------------|-------|------|----------|
| **DIRECT** | 5-10s | $0.001 | Simple factual queries, prices, definitions |
| **GTP** | 25s | $0.02 | Comparisons, multi-perspective questions |
| **CoT** | 30-60s | $0.03 | Step-by-step reasoning, complex analysis |
| **AoT** | 60-90s | $0.05 | Decomposition, multi-stage problems |

## User Experience

### Auto Mode (Default)
When user submits a query without selecting a methodology, AKHAI automatically:
1. Analyzes query complexity
2. Selects optimal methodology
3. Logs decision to console

**Example Console Output:**
```
=== QUERY RECEIVED === { query: 'btc price', methodology: undefined }
=== QUERY CLASSIFICATION === {
  isSimple: true,
  reason: 'Price/cost query detected',
  suggestedMethodology: 'direct'
}
=== AUTO-ROUTING: btc price → direct ===
=== REASON: Price/cost query detected ===
=== FAST PATH: DIRECT MODE ===
=== CALLING MOTHER BASE DIRECTLY (no advisors) ===
=== DIRECT SUCCESS in 6.4s === ...
```

### Manual Override
Users can still manually select any methodology in the UI, overriding auto-detection.

## Files Modified

1. **`lib/query-classifier.ts`** (NEW)
   - `classifyQuery()` - Main classification logic
   - `shouldUseDirect()` - Quick boolean check

2. **`app/api/query/route.ts`**
   - Added auto-detection before processing
   - Optimized direct mode fast path
   - Added `fast-path` SSE event

3. **`lib/query-store.ts`**
   - Updated QueryData flow type to include all methodologies
   - Added `fast-path` to QueryEvent types

## Testing

Run test cases to verify routing:
```bash
cd packages/web
node --loader ts-node/esm lib/query-classifier.test.ts
```

**Expected Results:**
- "btc price" → DIRECT ✅
- "what is bitcoin" → DIRECT ✅
- "compare react vs vue" → GTP ✅
- "analyze my business" → CoT ✅

## Benefits

✅ **95% faster** for simple queries (90s → 5-10s)
✅ **95% cheaper** for simple queries ($0.02 → $0.001)
✅ **Better UX** - Users don't wait unnecessarily
✅ **Automatic** - No manual methodology selection needed
✅ **Backward compatible** - Manual selection still works

## Future Improvements

- [ ] Add web search detection for real-time queries
- [ ] Cache common factual answers (e.g., "what is bitcoin")
- [ ] Add confidence scores to classification
- [ ] Support for specialized direct modes (code, math, etc.)
