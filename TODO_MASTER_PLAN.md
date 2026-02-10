# AkhAI — Master TODO & System Wiring Plan
## Day 36/150 — Post-Audit Action Plan

---

## CURRENT STATE (Verified Feb 10, 2026)

**System Health: 85%** (up from 82% after P0 fix)
- Backend: 95% production-ready
- Frontend integration: 75% (layer weights now wired ✅)
- 6 commits today: reasoning panel, 4 bug fixes, audit doc, P0 fix

### What's Working ✅
1. **Intelligence Fusion** — methodology scoring, layer activations, query classification
2. **SSE Pipeline** — all 11 stages, DB persistence, live streaming
3. **Guard System** — 5 checks (hype/echo/drift/sanity/fact), purification at 40%+
4. **Side Canal** — topic extraction, suggestions, context injection
5. **Mind Map** — React Flow visualization, topic nodes
6. **Writing Style** — Normal/Legend modes with forbidden patterns
7. **Insight Analysis** — data points, metrics, confidence scoring
8. **Multi-AI Consensus** — GTP 3-round consensus across 4 providers
9. **Token Tracking** — per-query and cumulative, cost calculation
10. **AI Reasoning Panel** — rich narratives, method comparison, layer visualization
11. **Layer Config → API** — weights now flow from sliders to fusion engine ✅

### What Needs Fixing 🔧

---

## PHASE 1: Critical Wiring Fixes (Days 37-38)
*Goal: Get every existing feature actually connected end-to-end*

### 1.1 Live Refinement Re-Query [P1] — ~2hrs
**Problem:** Clicking refine/enhance/correct only stores refinement for NEXT query. No re-query.
**Files:** `components/LiveRefinementCanal.tsx`, `app/page.tsx`
**Steps:**
1. Read `LiveRefinementCanal.tsx` — understand how refinement actions emit
2. In `page.tsx`, add a `handleRefinementSubmit()` that:
   - Takes current message + accumulated refinements
   - Re-calls `/api/simple-query` with original query + refinements array
   - Replaces current assistant message with refined response
3. Wire "Submit Refinement" button in LiveRefinementCanal to trigger re-query
4. Show visual diff badge: "Refined ×2" on refined messages
5. Preserve original response in message metadata for "Show Original" toggle

### 1.2 DDG Search Production Verification [P2] — ~30min
**Problem:** Rewritten this session, needs real-world testing
**Files:** `app/api/enhanced-links/route.ts`
**Steps:**
1. Send 5 diverse queries and check backend logs for DDG results
2. Verify `result__a` parsing returns real URLs
3. Verify DDG Lite fallback triggers when main parser fails
4. Check enhanced links appear in left sidebar

### 1.3 Guard Badge Visibility [P1] — ~1hr
**Problem:** AntipatternBadge renders but only under gnostic section which may be collapsed
**Files:** `app/page.tsx` (line 2260)
**Steps:**
1. Verify gnostic section visibility toggle defaults to open
2. Add inline purification indicator on message strip (e.g., small ⚡ icon)
3. Add guard verdict line in PipelineHistoryPanel reasoning section
4. Test: send query that triggers purification → verify badge visible

### 1.4 Side Canal Deduplication [P3] — ~30min
**Problem:** Server + client both extract topics = 2x API calls
**Files:** `app/page.tsx` (lines 564-593), `app/api/simple-query/route.ts` (lines 654-700)
**Steps:**
1. Remove client-side topic extraction in page.tsx (server already handles it)
2. Keep client-side Zustand update from SSE side-canal event
3. Verify topics still appear in left sidebar after removing client extraction

---

## PHASE 2: Feature Completion (Days 38-42)
*Goal: Polish existing features to 100%*

### 2.1 Layer Config End-to-End Verification — ~1hr
**Steps:**
1. Open AI Config panel → adjust Binah slider to 90%
2. Send analytical query → check backend logs for weight=0.9 on Binah
3. Verify fusion scores change: higher Binah weight should boost analytical methods
4. Check reasoning panel shows new weights
5. Reset sliders → verify defaults restore to 0.5

### 2.2 Mind Map Real-Time Updates — ~1hr
**Problem:** Must close/reopen modal to see new topics
**Files:** `components/MindMap.tsx`, `components/MindMapDiagramView.tsx`
**Steps:**
1. Add Zustand subscription to topic store changes
2. When new topics extracted, auto-append nodes to existing graph
3. Animate new node appearance

### 2.3 Writing Style Zustand Migration — ~30min
**Problem:** `legendMode` uses raw localStorage instead of settings store
**Files:** `app/page.tsx`
**Steps:**
1. Move `legendMode` state to `useSettingsStore`
2. Remove direct localStorage calls
3. Verify persistence still works

---

## PHASE 3: Milestones 3-9 (Days 42-100)

### M3: Query Source Separation [High] — Days 42-45
**What:** Distinguish user queries, refinements, system context in pipeline
**Why:** Clean separation enables better debugging, analytics, and refinement tracking
**Steps:**
1. Add `querySource` field to SSE events: 'user' | 'refinement' | 'system' | 'continuation'
2. Color-code in reasoning panel by source type
3. Track refinement chains per message
4. Add refinement count to message metadata

### M4: Selection Tool (Cmd+Shift+4) [Medium] — Days 45-48
**What:** Screenshot-based query input for visual intelligence
**Steps:**
1. Implement keyboard shortcut listener for Cmd+Shift+4
2. Screen capture API → canvas → base64
3. Send as attachment to `/api/simple-query` with `attachments` field
4. AI processes image with vision model

### M5: Mini Chat Code Agent [High] — Days 48-55
**What:** Grimoire execution layer with code tools
**Steps:**
1. Design mini-chat panel UI (slide-out from right)
2. Code execution sandbox (Web Worker or server-side)
3. File read/write capabilities for project workspace
4. Integration with main query pipeline

### M6: Depth Annotations + Sigils [Medium] — Days 55-60
**What:** Visual markers for reasoning depth in responses
**Steps:**
1. Define depth scale (1-10) with visual sigils
2. AI self-reports depth level per paragraph
3. Render sigils inline in response text
4. Depth histogram in reasoning panel

### M7: Grimoire System [High] — Days 60-75
**What:** Full project workspace with objectives, deadlines
**Steps:**
1. Project schema: name, objectives, deadlines, files, queries
2. CRUD API for projects
3. Project context injection into queries
4. Dashboard view with project status

### M8: Deploy + Testing [Critical] — Days 75-100
**What:** Production deployment with test suite
**Steps:**
1. FlokiNET Iceland server setup
2. Docker containerization
3. CI/CD pipeline (GitHub Actions)
4. E2E test suite (Playwright)
5. Load testing
6. SSL + domain setup

### M9: Social Launch Prep [High] — Days 100-121
**What:** Launch materials and community
**Steps:**
1. Landing page design + build
2. Demo video (2-3 min walkthrough)
3. Documentation site
4. Twitter/X launch thread
5. Discord/community setup
6. Beta invite system

---

## PHASE 4: Post-Launch (Days 121-150)

### Sovereign Transition Planning
- Self-hosted model evaluation (Qwen 2.5-72B, Mistral)
- Hetzner GEX131 server procurement
- Vercel AI SDK abstraction layer
- Cost modeling: API vs self-hosted breakeven

### Revenue & Growth
- Stripe payment integration testing
- Free/Pro/Legend tier enforcement
- Usage analytics dashboard
- User feedback collection system

---

## DAILY EXECUTION PATTERN

```
Morning (2hrs):  Fix 1 wiring issue from Phase 1
Afternoon (3hrs): Work on current milestone
Evening (1hr):   Test, commit, update progress
```

## VERIFICATION CHECKLIST (Run after each session)

- [ ] `npx next dev --turbopack` compiles clean
- [ ] Send test query → response streams
- [ ] AI Reasoning panel shows narrative
- [ ] Side Canal extracts topics
- [ ] Layer config values flow to API (check backend logs)
- [ ] Guard runs post-response checks
- [ ] Git commit + push
