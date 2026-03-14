# AkhAI Day 43 — Next Steps CLI Prompt
## Phase 1: Verify SSE Fix + Phase 2: Fix DDG Search

Work directly on the local main branch. Do NOT create new branches or push to GitHub.

---

## PHASE 1: VERIFY SSE METADATA FIX (5 minutes)

The SSE pipeline was just fixed (commit ff125a7). Verify it works.

### Step 1.1: Start dev server
```bash
cd /Users/sheirraza/akhai/packages/web && npx next dev -p 3000
```

### Step 1.2: Test MetadataStrip visibility

Open http://localhost:3000 and submit: "What is clean code?"

**Check server terminal for:**
- `[SSE]` logs showing events being emitted with subscriber/buffer counts
- `[SSE]` logs showing buffered event replay when EventSource connects

**Check browser for:**
- MetadataStrip under the response showing pipeline stages:
  `◉ RECEIVED → ⟐ ROUTING → ⬡ LAYERS → △ GENERATING → ⊘ GUARD → ◇ COMPLETE`
- After completion: clickable summary line `▾ pipeline · direct · Xs · Yt · N stages`
- Click the ◇ button next to the response → PipelineHistoryPanel should show reasoning

**If MetadataStrip does NOT show:**
1. Open browser DevTools Console → look for `[SSE:` logs
2. Check if EventSource connection appears in DevTools Network tab (filter: EventStream)
3. Check if `pipelineEnabled` state is true (it defaults to true)
4. Report findings — do not proceed to Phase 2

**If MetadataStrip DOES show:** Proceed to Phase 2.

---

## PHASE 2: FIX DDG SEARCH (1-2 hours)

DDG search is 100% broken. Every query returns 0 results and falls to fake "smart fallback" links.

### Step 2.1: Find the DDG module

```bash
grep -rn "duckduckgo\|ddg\|html\.duckduckgo\|lite\.duckduckgo" packages/web/lib/ packages/web/app/api/ --include="*.ts" | head -20
```

Read the entire DDG search file to understand the current implementation.

### Step 2.2: Diagnose the failure

Test DDG directly from the server:

```bash
curl -s "https://html.duckduckgo.com/html/?q=quantum+computing" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" \
  | head -200
```

Check:
1. Does DDG return HTML with results? (look for `result__a` or `result__snippet` classes)
2. Or does it return a captcha/redirect page?
3. What CSS selectors does the current parser use? Do they match the actual HTML?

### Step 2.3: Fix the DDG fetch + parser

Common issues:
1. **Missing/wrong User-Agent** — DDG blocks requests without browser-like UA
2. **Wrong endpoint** — should be `https://html.duckduckgo.com/html/?q=...`
3. **Parser uses outdated selectors** — DDG may have changed HTML class names
4. **No error handling** — silently falls to fake fallback

Fix the fetch headers:
```typescript
const response = await fetch(
  `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
  {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  }
)
```

Fix the HTML parser — verify against actual DDG HTML structure:
- Result links: `<a class="result__a" href="...">Title</a>`
- Snippets: `<a class="result__snippet">Description text</a>`
- If classes changed, update the regex/selector accordingly

### Step 2.4: Kill fake fallback

Find and disable the "smart fallback" that generates fake links when DDG fails:

```bash
grep -rn "smart.fallback\|fallback.*link\|generateFallback\|smartFallback\|fallbackLinks\|intelligent.*link" packages/web/lib/ --include="*.ts"
```

Replace with honest failure indicator:
```typescript
if (results.length === 0) {
  console.warn('[DDG] Search returned 0 results for:', query)
  return { results: [], searchUnavailable: true }
}
```

In the UI where links are rendered, show `"⚠ Search unavailable"` when `searchUnavailable` is true instead of displaying fabricated links.

### Step 2.5: Test with 10 queries

After fixing, test these queries and verify real results come back:

1. "quantum computing explained"
2. "best practices for React performance"  
3. "climate change latest research 2025"
4. "how to make sourdough bread"
5. "TypeScript generics tutorial"
6. "history of artificial intelligence"
7. "meditation benefits scientific studies"
8. "sovereign cloud infrastructure Europe"
9. "Next.js server components vs client"
10. "neural network backpropagation"

Target: 9/10 return real results (90%+).

### Step 2.6: Add logging

Add permanent `[DDG]` prefixed logs:
- `[DDG] Searching: "query" → N results` on success
- `[DDG] Failed: "query" → status: X, bodyLength: Y` on failure

---

## PHASE 3: COMMIT

```bash
cd /Users/sheirraza/akhai
git add -A
git commit -m "fix(P0): Fix DDG search — real results instead of fake fallback links

- Fix DDG fetch headers (User-Agent, Accept)
- Update HTML parser for current DDG structure
- Remove fake 'smart fallback' link generation
- Show honest '⚠ unavailable' when search fails
- Add [DDG] diagnostic logging
- Verify: 9/10 test queries return real results

Day 43/150"
```

Do NOT push to GitHub unless explicitly asked.

---

## AFTER THESE 2 PHASES

Report back with:
1. Did MetadataStrip show live stages? (screenshot or description)
2. How many of 10 DDG test queries returned real results?
3. What was the DDG root cause? (headers? parser? rate limit?)
4. Any new errors in terminal or browser console?
