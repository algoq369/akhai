# AkhAI Day 36 — Fix 4 Bugs + Full System Audit Plan

## CONTEXT
You are working on AkhAI, a sovereign AI research engine. Project root: `/Users/sheirraza/akhai/packages/web`
Backend API: `app/api/simple-query/route.ts` (1341 lines)
Fusion engine: `lib/intelligence-fusion.ts` (450 lines)
Reasoning panel: `components/PipelineHistoryPanel.tsx` (379 lines)

The app runs on localhost:3000. After each fix, verify with `npx next dev --turbopack` that it compiles clean.

---

## BUG 1: Layer weights showing user-config (1%) instead of fusion activations (70%)

**Problem:** In `app/api/simple-query/route.ts` around line 248, the layers SSE event sends `weight: val as number` which is the RAW user slider value (all defaulting to 1%). But fusion calculates actual `effectiveWeight` via `layerActivations`. Backend logs show `Binah 70%` dominant but panel shows all layers at 1%.

**Fix:** Change the weight sent in the layers event to use fusion's computed activation weight when available:

In `app/api/simple-query/route.ts`, find the layerDetails building loop (around line 248-258). Change:
```typescript
// CURRENT (broken):
weight: val as number,

// FIX: Use fusion activation weight when available, fall back to user weight
weight: activation ? Math.round(activation.weight * 100) : (val as number),
```

Also check `fusionResult.layerActivations` structure in `lib/intelligence-fusion.ts` to confirm each activation has a `weight` field. If the field is named differently (like `score` or `activation`), use that instead.

---

## BUG 2: Fusion miscalibration — complex queries scored as "factual" with 20% complexity

**Problem:** The query "What are the best strategies for building a sovereign AI platform in Europe?" was classified as `factual` at 20% complexity. This is clearly a complex analytical/strategy question that should be `research` or `analytical` at 60%+ complexity.

**Fix:** In `lib/intelligence-fusion.ts`, find the query analysis/classification logic. Issues to fix:

1. **Complexity scoring**: Look for how `complexity` is calculated. Words like "strategies", "building", "platform", multi-word queries (>10 words), and question-mark presence should boost complexity. A 13-word strategy question should score 50-70%, not 20%.

2. **Query type detection**: Look for how `queryType` is determined. The word "strategies" maps to analytical/research, not factual. Check keyword lists for each type:
   - "strategies", "approaches", "methods", "ways to", "how to build" → should map to `analytical` or `research`
   - "what is", "define", "who is" → factual
   - "compare", "vs", "differences" → comparative

3. Find the scoring weights. Typically the issue is that the "factual" detector triggers on "What are" at the start even though the rest is clearly analytical. The fix is: if analytical/research signals are present, they should override the "What are" factual signal.

Search for: `queryType`, `complexity`, `classifyQuery`, `analyzeQuery` in the fusion file to find the exact functions.

---

## BUG 3: DuckDuckGo search returning 0 results for all queries

**Problem:** Backend logs show ALL 6 enhanced-link searches returning 0 real results, falling back to smart fallback links every time:
```
[EnhancedLinks] Found 0 real search results
[EnhancedLinks] No results parsed from DDG, using smart fallback
```

**Fix:** Check `app/api/enhanced-links/route.ts` or wherever DDG search is implemented. Common issues:

1. **DDG HTML parsing broken**: DuckDuckGo changes their HTML structure frequently. Check if the CSS selectors or regex patterns for extracting results from DDG response HTML are outdated.

2. **Rate limiting / blocking**: DDG may be blocking the server-side requests. Check User-Agent headers.

3. **URL construction**: Verify the DDG search URL format is correct: `https://html.duckduckgo.com/html/?q=...`

4. **Response parsing**: Add a `console.log` of the raw DDG response body (first 500 chars) to see what's actually coming back. If it's an error page or captcha, we need to handle that.

Find the DDG search function, check the fetch call and the HTML parsing. If DDG is genuinely broken, consider:
- Adding retry logic with different User-Agent
- Using the lite version: `https://lite.duckduckgo.com/lite/?q=...`
- Caching results to reduce request frequency

---

## BUG 4: False positive antipattern — "toxicity" detected on normal strategy question

**Problem:** Backend logs show:
```
⚠️ [ANTIPATTERN] Detected: toxicity (severity: 20%)
ℹ️ [ANTIPATTERN] Purifying response...
```
On a perfectly normal response about sovereign AI platform strategies. The word "sovereign" or the business strategy content is falsely triggering the toxicity detector.

**Fix:** Find the antipattern/toxicity detection in the codebase. Search for `antipattern`, `toxicity`, `purif` in the codebase.

Issues to investigate:
1. **Threshold too low**: 20% severity should NOT trigger purification. Only 50%+ should trigger. Find the threshold and raise it.
2. **False keyword matches**: The word "sovereign" or "dominance" or "competitive advantage" may be matching toxicity keywords inappropriately. Check the word list and add exceptions for business/tech contexts.
3. **Purification trigger logic**: Even if detected, purification should only run above a minimum severity threshold (suggest 40%+).

---

## AFTER FIXES: Commit

```bash
cd /Users/sheirraza/akhai
git add -A
git commit -m "fix: 4 pipeline bugs — layer weights, fusion calibration, DDG search, antipattern threshold

- Layer weights now use fusion activation values instead of raw user slider config
- Query complexity scoring boosted for multi-word analytical/strategy queries
- DuckDuckGo search parsing fixed/diagnosed
- Antipattern toxicity threshold raised to prevent false positives on business content"
git push origin main
```

---

## PHASE 2: Full System Audit — Build the Plan

After fixing the bugs above, create a comprehensive audit document. Read and check each of these systems:

### Systems to Audit (read the files, check they're properly connected):

1. **AI Layer Configuration** (`components/AIConfigUnified.tsx`, 832 lines)
   - Do slider values actually flow to fusion engine?
   - Are saved configs persisted to DB and loaded on page refresh?
   - Test: change a layer weight → send query → verify fusion uses new weight

2. **Live Refinement** (the refine/enhance/correct/instruct buttons)
   - Where is the refinement logic? Search for `refine`, `enhance`, `correct`, `instruct` in components/
   - Does clicking "refine" actually re-query with modified instructions?
   - Is the refinement result streamed properly?

3. **Methodology Selection** (auto/direct/cod/bot/react/gtp/pot)
   - Verify auto-selection works (fusion picks best method)
   - Verify manual override works (user selects specific method)
   - Check each method actually has different system prompts/behavior

4. **Guard System** (Grounding Guard)
   - 5 checks: hype, echo, drift, sanity, fact
   - Are post-response checks running on every query?
   - Does guard verdict flow to the reasoning panel correctly?

5. **Side Canal** (topic extraction)
   - Is it extracting topics from every response?
   - Are topics persisting to DB?
   - Do topic suggestions appear in the left sidebar?

6. **Mind Map / Tree of Life visualization**
   - Does clicking "Mindmap" tab render the tree?
   - Are query nodes added after each query?
   - Is React Flow properly initialized?

7. **Writing Style System** (formal/casual/academic etc.)
   - Does selected style modify the system prompt sent to AI?
   - Is style persisted between sessions?

8. **Insight Analysis** (the data points/metrics extraction)
   - Is it extracting insights from AI responses correctly?
   - Do metrics/confidence scores make sense?

9. **Multi-AI Consensus** (4 providers: Anthropic, DeepSeek, xAI, Mistral)
   - Can user switch providers in AI Config?
   - Does consensus mode query multiple providers?

10. **Search Integration** (DuckDuckGo, enhanced links)
    - Already diagnosing DDG above
    - Check if search results are injected into AI context

11. **SSE/Streaming Pipeline**
    - Events: routing → layers → guard → reasoning → generating → analysis → complete
    - Are all events emitted and received by frontend?
    - Is the thought-stream properly persisted to DB?

12. **Token Tracking & Cost**
    - Are tokens counted correctly per query?
    - Does cost calculation match provider pricing?
    - Is cumulative cost tracked in session?

### Output Format

Create a file at `/Users/sheirraza/akhai/SYSTEM_AUDIT_DAY36.md` with:

```markdown
# AkhAI System Audit — Day 36/150

## Status Summary
| # | System | Status | Issues | Priority |
|---|--------|--------|--------|----------|
| 1 | AI Layer Config | ✅/⚠️/🔴 | description | P1/P2/P3 |
...

## Detailed Findings
### 1. AI Layer Configuration
**Files:** list files
**Status:** working/broken/partial
**What works:** ...
**What's broken:** ...
**Fix needed:** ...

### 2. Live Refinement
...

## Priority Fix Order
1. ...
2. ...

## Next Development Steps (Milestones 3-9)
Reference the milestone list:
- M3: Query Source Separation
- M4: Selection Tool (Cmd+Shift+4)
- M5: Mini Chat Code Agent
- M6: Depth Annotations + Sigils
- M7: Grimoire System
- M8: Deploy + Testing
- M9: Social Launch Prep
```

Run each audit by reading the relevant files, tracing data flow, and noting any disconnections.
