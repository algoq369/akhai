# AkhAI ENGINE FIX PLAN — Pre-Development Stabilization
# Created: March 28, 2026 (Day 75/150)
# Goal: Every existing feature works before adding new ones
# Verification: Each fix has a gate check. No fix proceeds without prior gate passing.

---

## AUDIT RESULTS (March 28)

| # | Issue | Severity | Category |
|---|-------|----------|----------|
| 1 | MetadataStrip shows nothing during queries | P0 | Metadata |
| 2 | Layer names wrong in SSE events | P1 | Engine |
| 3 | Reasoning narrative is generic labels | P1 | Metadata |
| 4 | No `complete` SSE event consistently | P1 | Metadata |
| 5 | Fusion overrides user methodology choice | P2 | Engine |
| 6 | VIEW tabs don't populate (AI Layers/Insight/Mindmap) | P2 | Frontend |
| 7 | Depth annotations not verified working | P2 | Frontend |
| 8 | Canvas view not verified working | P2 | Frontend |
| 9 | Side Canal empty without auth | P2 | Expected |
| 10 | better-sqlite3 keeps needing rebuild | P3 | DevX |

---

## FIX ORDER (dependencies mapped)

```
FIX 1: better-sqlite3 auto-rebuild ──→ unblocks all dev work
FIX 2: SSE complete event ──→ unblocks MetadataStrip phase transition
FIX 3: MetadataStrip live rendering ──→ depends on FIX 2
FIX 4: Layer names in SSE ──→ independent
FIX 5: Reasoning narrative enrichment ──→ independent
FIX 6: Fusion methodology override ──→ independent
FIX 7: VIEW tabs population ──→ depends on FIX 4
FIX 8: Depth annotations verification ──→ independent
FIX 9: Canvas view verification ──→ independent
```


---

## FIX 1: better-sqlite3 Auto-Rebuild on Dev Start (P3, 15 min)
**Problem:** Dev server crashes after Node.js updates. Manual rebuild needed every time.
**Tool:** Direct fix here (small config change)
**File:** `package.json` scripts

### Steps:
1. Add `"predev": "cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 && rm -rf build && npx node-gyp rebuild --release 2>/dev/null || true"` to packages/web/package.json scripts
2. Or: add to `dev` script as prefix

### Gate:
```bash
pnpm dev  # Should start without manual rebuild
curl -s http://localhost:3000/api/health | grep '"status":"ok"'
```

### Status: [ ] NOT STARTED

---

## FIX 2: SSE Complete Event (P1, 30 min)
**Problem:** SSE stream may not emit `complete` event reliably. MetadataStrip can't transition from live→summary.
**Tool:** Direct fix here
**File:** `app/api/simple-query/route.ts` (line ~1018)

### Steps:
1. Read the complete event emission code
2. Verify it fires in ALL code paths (success, error, timeout)
3. Add try/finally to ensure complete always emits
4. Test: Submit query, check SSE output includes `stage: 'complete'`

### Gate:
```bash
# Submit query and capture SSE events
QUERY_ID="gate-$(date +%s)"
curl -sN "http://localhost:3000/api/thought-stream?queryId=$QUERY_ID" > /tmp/sse.txt &
curl -s -X POST http://localhost:3000/api/simple-query \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"test\",\"methodology\":\"direct\",\"conversationHistory\":[],\"queryId\":\"$QUERY_ID\"}" > /dev/null
sleep 5 && kill %1
grep "complete" /tmp/sse.txt  # MUST find complete event
```

### Status: [ ] NOT STARTED


---

## FIX 3: MetadataStrip Live Rendering (P0, 2h)
**Problem:** Components exist, SSE fires, but user sees nothing during processing.
**Tool:** CLI (`cc`) — requires reading 200+ line component + modifying phase logic
**Files:** `components/MetadataStrip.tsx`, `app/page.tsx`

### Steps:
1. Add `isStreaming` prop to MetadataStrip
2. Fix phase logic: start as 'live' when isStreaming=true (not 'hidden')
3. Show "◉ Connecting to engine..." when 0 events + streaming
4. Show each stage with minimum 500ms display time
5. Transition to 'summary' on complete event (depends on FIX 2)
6. Wire isStreaming prop in page.tsx (ChatMessages.tsx after split)

### Gate:
```
Open localhost:3000 → Submit query → MUST SEE live stage indicators:
  ◉ Received → ⟐ Routing → ⬡ Layers → ◎ Reasoning → △ Generating → ✧ Complete
After response: click to expand → MUST SEE timeline summary
```

### Status: [ ] NOT STARTED

---

## FIX 4: Layer Names in SSE Events (P1, 30 min)
**Problem:** SSE emits old names (reception, comprehension, context) not AI computational names (Encoder, Reasoning, Attention).
**Tool:** Direct fix here
**File:** `lib/intelligence-fusion.ts` or wherever layer weights are computed

### Steps:
1. Find where SSE layer event builds its data object
2. Map internal names to AI computational names using existing LAYER_METADATA
3. Verify SSE output uses correct names

### Gate:
```bash
# Submit query and check SSE layer event
grep "layers" /tmp/sse.txt | python3 -c "
import json,sys
for l in sys.stdin:
    if l.startswith('data:'):
        d=json.loads(l[5:])
        layers=d.get('details',{}).get('layers',{})
        for k,v in list(layers.items())[:3]:
            print(f'  Layer {k}: {v.get(\"name\")}')"
# MUST show: Encoder, Reasoning, Attention (not reception, comprehension)
```

### Status: [ ] NOT STARTED

---

## FIX 5: Reasoning Narrative Enrichment (P1, 1.5h)
**Problem:** SSE reasoning says "Seeking understanding" — should be natural language.
**Tool:** CLI (`cc`) — multiple emit points across 500+ line file
**File:** `app/api/simple-query/route.ts`

### Steps:
1. Enrich each emitAndPersist `data` field:
   - received: "Analyzing your question about {topic}..."
   - routing: "Using {method} because {reason}..."
   - layers: "Activating {top_layer} at depth {level}..."
   - reasoning: "I understand you want {intent}. Approach: {approach}..."
   - generating: "Generating with {provider}..."
   - complete: "Done. {method} · {duration}ms · {tokens} tokens"
2. Use existing variables (query, selectedMethod, providerSpec, etc.)

### Gate:
```
Submit query → Check SSE events → Each stage has descriptive English text
NOT: "Seeking understanding" or "direct 100%"
YES: "Analyzing your question about solar energy. Using Direct because..."
```

### Status: [ ] NOT STARTED


---

## FIX 6: Fusion Methodology Override (P2, 1h)
**Problem:** User selects "direct" but fusion returns "gtp". Internal scoring overrides user choice.
**Tool:** Direct fix here or CLI
**File:** `lib/intelligence-fusion.ts`

### Steps:
1. Find where methodology is scored and selected
2. When user explicitly selects a method (not 'auto'), ALWAYS honor it
3. Only override if method is 'auto' (let engine decide)
4. Verify: select 'direct' → response says methodology: 'direct'

### Gate:
```bash
for method in direct cod bot react pot gtp; do
  result=$(curl -s -X POST http://localhost:3000/api/simple-query \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"test\",\"methodology\":\"$method\",\"conversationHistory\":[]}" \
    --max-time 20 | python3 -c "import json,sys; print(json.load(sys.stdin).get('methodologyUsed','?'))")
  echo "Selected: $method → Used: $result"
done
# Every line MUST show Selected == Used
```

### Status: [ ] NOT STARTED

---

## FIX 7: VIEW Tabs Population (P2, 2h)
**Problem:** AI Layers / Insight / Mindmap tabs render but show no content.
**Tool:** CLI (`cc`) — multiple components involved
**Files:** `components/sections/ViewTabs.tsx`, `components/LayerResponse.tsx`, `components/InsightMindmap.tsx`, `components/ResponseMindmap.tsx`

### Steps:
1. AI Layers tab: Read layer data from SSE 'layers' event via Zustand
   → Pass activations to LayerResponse component
2. Insight tab: Verify InsightMindmap receives parsed response content
3. Mindmap tab: Verify message.topics populated by Side Canal
4. Check `shouldShowLayers()`, `shouldShowInsightMap()`, `shouldShowMindmap()` return true

### Gate:
```
Submit query on localhost → Click AI Layers tab → MUST see layer bars
Click Insight tab → MUST see insight nodes
Click Mindmap tab → MUST see topic graph (may need auth for Side Canal data)
```

### Status: [ ] NOT STARTED

---

## FIX 8: Depth Annotations Verification (P2, 1h)
**Problem:** Sigil system built but not verified working visually.
**Tool:** Chrome verification + potential fix here
**Files:** `components/DepthText.tsx`, `hooks/useDepthAnnotations.ts`

### Steps:
1. Check if depth annotations are enabled by default
2. Submit query on localhost with depth enabled
3. Verify sigils (◊ △ ⊕ ○) appear inline in response text
4. Check hover reveals annotation detail
5. If not working: trace data flow from response → annotation parser → DepthText

### Gate:
```
Submit query → Response text MUST contain colored sigils
Hover sigil → MUST show tooltip with annotation detail
Settings → Depth toggle → MUST enable/disable sigils
```

### Status: [ ] NOT STARTED

---

## FIX 9: Canvas View Verification (P2, 1h)
**Problem:** Canvas/VisionBoard files exist but not verified working.
**Tool:** Chrome verification
**Files:** `components/canvas/CanvasWorkspace.tsx`

### Steps:
1. Switch to canvas mode via UI toggle
2. Verify canvas renders with draggable panels
3. Submit query in canvas mode → verify query card appears
4. Test drag/drop, pan/zoom
5. Test switching back to text mode

### Gate:
```
Click canvas toggle → MUST render workspace with panels
Submit query in canvas → MUST see query card
Drag panel → MUST move smoothly
Switch back to text → MUST preserve conversation
```

### Status: [ ] NOT STARTED


---

## EXECUTION STRATEGY — Who Does What

### BATCH 1: Direct fixes here (this session, ~2h)
These are small, surgical changes I can make with Desktop Commander:

| Fix | Task | Est |
|-----|------|-----|
| FIX 1 | better-sqlite3 auto-rebuild in dev script | 15 min |
| FIX 2 | Verify/fix SSE complete event | 30 min |
| FIX 4 | Layer names in SSE (map to AI computational names) | 30 min |
| FIX 6 | Fusion methodology override (honor user choice) | 30 min |

### BATCH 2: CLI prompt (next step, ~3.5h)
These require reading/modifying large files — better for `cc`:

| Fix | Task | Est |
|-----|------|-----|
| FIX 3 | MetadataStrip live rendering (phase logic + isStreaming) | 2h |
| FIX 5 | Reasoning narrative enrichment (8 emit points) | 1.5h |

### BATCH 3: Chrome verification (after Batch 1+2, ~2h)
Visual testing in browser — I do this with Claude in Chrome:

| Fix | Task | Est |
|-----|------|-----|
| FIX 7 | VIEW tabs — submit query, check all 3 tabs populate | 30 min |
| FIX 8 | Depth annotations — check sigils render | 30 min |
| FIX 9 | Canvas view — test toggle, drag, query cards | 30 min |

### Total: ~7h across 3 batches

---

## PROGRESS TRACKER

```
[✅] FIX 1: better-sqlite3 auto-rebuild (6b60a7a)
[✅] FIX 2: SSE complete event (already working — 9 stages fire)
[✅] FIX 3: MetadataStrip live rendering (35a7fc2) — isStreaming prop + phase logic
[✅] FIX 4: Layer names in SSE (88106f8) — all 11 correct
[✅] FIX 5: Reasoning narrative enrichment (35a7fc2) — natural language SSE
[✅] FIX 6: Fusion methodology override (f2dbb72) — honors user choice
[⚠️] FIX 7: VIEW tabs — data flows exist, needs visual browser verification
[⚠️] FIX 8: Depth annotations — enabled by default, needs visual verification
[⚠️] FIX 9: Canvas — 780 lines imported, needs visual verification
```

## COMMIT PLAN
Each fix = 1 commit:
```
fix(devx): auto-rebuild better-sqlite3 in dev script
fix(sse): ensure complete event fires in all code paths
fix(metadata): MetadataStrip live rendering with isStreaming prop
fix(sse): use AI computational layer names in SSE events
fix(metadata): enrich SSE reasoning narrative with natural language
fix(engine): honor user methodology selection over fusion scoring
fix(ui): wire VIEW tabs data from SSE events
fix(ui): verify depth annotations rendering
fix(ui): verify canvas view functionality
```

## VALIDATION: After all fixes
```bash
# Full gate
pnpm build && npx vitest run  # Build + 57/57 tests

# Engine test
curl -s -X POST localhost:3000/api/simple-query \
  -d '{"query":"test","methodology":"direct","conversationHistory":[]}' \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['methodologyUsed'])"
# MUST print: direct

# SSE test
# All 7 stages must fire with enriched reasoning text

# Visual test (Chrome)
# MetadataStrip shows live stages
# VIEW tabs populate
# Depth annotations render
# Canvas view works
```

---

## READY TO START
Begin with BATCH 1 (direct fixes here) → then give CLI prompt for BATCH 2 → then Chrome verify BATCH 3.
