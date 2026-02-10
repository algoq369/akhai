# AkhAI — Master Plan v3
## Day 37/150 — Updated Status & Next Steps

---

## ✅ COMPLETED (Days 30-37)

### Phase 1: Layer Calibration — DONE ✅✅✅
| Task | Commit | Status |
|------|--------|--------|
| P0: Wire weights from Zustand to API | `2e319d5` | ✅ |
| 5-tier graduated behaviors (55 behavioral instructions) | `6d1203d` | ✅ |
| Kabbalistic terms → AI names in logs/prompts/SSE | `56127dd` | ✅ |
| Comparison test endpoint `/api/layer-test` | `56127dd` | ✅ |
| Comparison verified: Creative vs Analytical vs Balanced | Live test | ✅ |
| `aiName` field added to all 11 LAYER_METADATA entries | `56127dd` | ✅ |

### Other Completed (Days 30-36)
| Task | Commit | Status |
|------|--------|--------|
| AI Reasoning Panel (live narratives, method comparison) | `a541676`→`f29548a` | ✅ |
| Pipeline History (Claude Code-style metadata) | `3395f29`→`eb5e234` | ✅ |
| 4 pipeline bugs (fusion calibration, DDG, antipattern) | `51a5f12` | ✅ |
| System audit (12 subsystems, 85% health) | `6e6748f` | ✅ |

---

## 🔴 REMAINING DISCONNECTIONS (Priority Order)

### Disconnect 1: Depth Annotations — Built but NOT Rendered
**What exists:**
- `lib/depth-annotations.ts` (1403 lines) — full annotation engine
- `lib/depth-annotations-enhanced.ts` — enhanced version
- `hooks/useDepthAnnotations.ts` — React hook ready
- 5 doc files describing the system
- Sigils defined: ᶠ(fact) ᵐ(metric) ᶜ(connection) ᵈ(detail) ˢ(source)

**What's missing:**
- No `DepthAnnotation.tsx` or `DepthSigil.tsx` components (referenced in old plan but never created)
- `useDepthAnnotations` hook exists but is NOT imported or used anywhere
- No depth processing in the API pipeline (route.ts)
- Zero UI rendering of annotations in message display

**Effort:** Medium (2-3 hours) — library exists, need components + wiring

### Disconnect 2: Canvas Mode — Does NOT Exist
**What exists:** NOTHING
- No `CanvasWorkspace` component
- No canvas-related files
- No `onQuerySelect` / `onNodeSelect` handlers
- The "canvas toggle" in the old plan was aspirational

**Effort:** Large (8-16 hours) — needs full React Flow integration, store, bidirectional sync

### Disconnect 3: Live Refinement — Not Implemented
**What exists:** UI shows "refine · enhance · correct · instruct..." text but it's static/decorative
- No re-query mechanism
- No refined query tracking
- Clicking does nothing

**Effort:** Medium (2-4 hours) — API endpoint exists, need frontend wiring

### Disconnect 4: DDG Search — Partially Failing
**Evidence from today's test logs:**
- 2 of 6 DDG queries returned real results
- 4 of 6 fell through to "smart fallback" (generated links, not real search)
- The fallback masks the failure — looks like it works but isn't real search

**Effort:** Small-Medium (1-2 hours) — debug DDG HTML parsing, test with different queries

---

## 📋 PRIORITY EXECUTION PLAN

### Day 38: Depth Annotations + Refinement
**Morning — Depth Annotations (P0)**
1. Create `components/DepthAnnotation.tsx` — renders annotated text with inline sigils
2. Create `components/DepthSigil.tsx` — individual sigil component with hover tooltip
3. Wire into message rendering: wrap AI response markdown through depth annotation engine
4. Add depth analysis call in `route.ts` after AI response received
5. Send annotations via SSE to frontend
6. Add depth toggle in AI Config panel (density: minimal/standard/maximum)
7. Test: verify sigils appear on response text

**Afternoon — Live Refinement (P1)**
1. Wire refine/enhance/correct/instruct buttons to actual re-query
2. Each refinement type prepends modifier to original query
3. Track refinement chain (show "Refined ×2" badge)
4. Store refinement history in query metadata
5. Test: click "refine" → new response appears with refinement badge

### Day 39: DDG Search Fix + Side Canal Cleanup
**Morning — DDG Search (P1)**
1. Debug DDG HTML parser — why 4/6 queries fail
2. Test with 10 diverse query types
3. Add retry with different DDG endpoint (lite vs html)
4. Add real fallback indicator in UI (show "⚠ search unavailable" vs fake results)
5. Verify: all 10 test queries return real results

**Afternoon — Side Canal Dedup (P2)**
1. Audit client vs server topic extraction
2. Remove duplicate client-side extraction
3. Verify topic uniqueness in database
4. Test: topics don't appear twice

### Day 40-41: Canvas Mode (P1)
1. Install React Flow dependency
2. Create `components/CanvasWorkspace.tsx`
3. Create canvas store (Zustand)
4. Auto-populate query cards from chat history
5. Wire Side Canal topics as visual nodes
6. Implement canvas → text navigation (click card → scroll to response)
7. Add canvas toggle in UI header
8. Test: switch between text/canvas, verify data preserved

### Day 42-45: Query Source Separation (M3)
- Tag queries as user/refinement/system/continuation
- Different visual treatment per source type
- Filter history by source type

### Day 45-48: Selection Tool Cmd+Shift+4 (M4)
- Screenshot capture → visual query input
- Image analysis pipeline
- Paste image into query box

### Day 48-55: Mini Chat Code Agent (M5)
- Code execution in mini-chat panel
- Sandboxed runtime
- Output rendering

### Day 55-75: Grimoire System (M6)
- Project workspaces
- Objectives / deadlines / milestones
- Cross-query context persistence

### Day 75-100: Deploy + Testing (M7)
- FlokiNET Iceland hosting
- Docker containerization
- CI/CD pipeline
- E2E tests

### Day 100-121: Social Launch Prep (M8)
- Landing page
- Demo video
- Community building
- Beta invites

### Day 121: SOCIAL LAUNCH 🚀

### Day 121-150: Post-Launch (M9)
- Self-hosted model migration (Qwen 2.5-72B, Mistral)
- Hetzner GEX131 server
- Stripe payments + tier enforcement
- User analytics dashboard
- Audience building → public website launch Day 150

---

## VERIFICATION CHECKLIST (Updated)

### ✅ Done
- [x] Layer sliders produce measurably different AI outputs
- [x] Creative config → metaphors, narratives, vivid prose
- [x] Analytical config → data, statistics, logic chains
- [x] Zero Kabbalistic terms in logs/prompts/SSE
- [x] AI Reasoning panel shows live pipeline data
- [x] End-to-end flow: UI slider → Zustand → API → fusion → AI prompt

### ❌ Next Up
- [ ] Depth sigils (ᶠ ᵐ ᶜ) visible on response text
- [ ] Live refinement buttons trigger re-query
- [ ] DDG search returns real results (not fallback) for 90%+ queries
- [ ] Canvas mode exists with query cards
- [ ] Canvas ↔ text bidirectional navigation
- [ ] Side Canal topics don't duplicate
- [ ] Compiled clean with all new features

---

## SYSTEM HEALTH: 90% → Target 95% by Day 45

| Subsystem | Health | Notes |
|-----------|--------|-------|
| Layer Calibration | 100% | 5-tier system verified, comparison tested |
| AI Pipeline | 95% | Guard + Antipattern + Fusion all working |
| Reasoning Panel | 95% | Live narratives, method comparison |
| Depth Annotations | 20% | Library exists, zero UI rendering |
| Canvas Mode | 0% | Not started |
| Live Refinement | 10% | UI text exists, zero functionality |
| DDG Search | 60% | Partial failures, fallback masks issues |
| Side Canal | 85% | Working but potential dedup issue |
| Mind Map | 90% | 1197 topics, working visualization |
| Authentication | 90% | Auth flow working |
| Database | 85% | SQLite working, migration warnings |
