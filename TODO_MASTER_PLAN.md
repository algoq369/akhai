# AkhAI — Master Plan v5
## Day 44/150 — Updated Feb 22, 2026

---

## ✅ COMPLETED (Days 30-44)

### Phase 1: Layer Calibration — DONE ✅
| Task | Commit | Status |
|------|--------|--------|
| P0: Wire weights from Zustand to API | `2e319d5` | ✅ |
| 5-tier graduated behaviors (55 instructions) | `6d1203d` | ✅ |
| Kabbalistic terms → AI names in logs/prompts/SSE | `56127dd` | ✅ |
| Comparison test endpoint `/api/layer-test` | `56127dd` | ✅ |
| Comparison verified: Creative vs Analytical vs Balanced | Live test | ✅ |

### Phase 2: SSE Metadata Pipeline — DONE ✅
| Task | Commit | Status |
|------|--------|--------|
| AI Reasoning Panel (live narratives) | `a541676`→`f29548a` | ✅ |
| Pipeline History (Claude Code-style metadata) | `3395f29`→`eb5e234` | ✅ |
| 4 pipeline bugs fixed | `51a5f12` | ✅ |
| globalThis singleton for event-emitter.ts | `585a94d` | ✅ |
| globalThis singleton for thought-stream.ts connections | `ff125a7` | ✅ |
| Event buffer + replay for SSE race condition | `ff125a7` | ✅ |
| 16 debug agent log blocks cleaned | `ff125a7` | ✅ |
| thought-stream route: abort handling + 5min timeout | `ff125a7` | ✅ |

### Phase 3: Navigation & Accessibility — DONE ✅
| Task | Commit | Status |
|------|--------|--------|
| Remove hardcoded username from ProfileMenu | `44bbd8d` | ✅ |
| NavigationMenu renders without auth gate | `44bbd8d` | ✅ |
| History button added to footer NavigationMenu | `d74ff98` | ✅ |
| NODE_ENV=development enforced in package.json | `d74ff98` | ✅ |
| Mindmap auth gate removed (modal + diagram + page) | `ffee070` | ✅ |
| Mindmap data key mismatch fixed (connections→links) | `ffee070` | ✅ |
| Topic links passed through all render paths | `ffee070` | ✅ |
| Chat header: mindmap + history nav buttons | `1e67c19` | ✅ |

### Phase 4: Search — IN PROGRESS 🔧
| Task | Commit | Status |
|------|--------|--------|
| DDG search fix (headers + parser) | `e1d84c2` | ✅ |
| DDG throttle (3s gap between requests) | `1e67c19` | ✅ |
| Brave Search API integration (primary) | `1e67c19` | ✅ |
| Honest "unavailable" (no fake fallbacks) | `1e67c19` | ✅ |
| **Get Brave API key (free)** | — | ❌ ACTION NEEDED |

---

## 🟡 EXISTS BUT NEEDS ACTIVATION/TESTING

### Depth Annotations — 70% Complete
- `lib/depth-annotations.ts` (1403 lines) ✅
- `lib/depth-annotations-enhanced.ts` ✅
- `hooks/useDepthAnnotations.ts` ✅
- `components/DepthAnnotation.tsx` (190 lines) ✅
- `components/DepthSigil.tsx` (51 lines) ✅
- Wired into page.tsx line 2120 (DepthText renders) ✅
- **UNKNOWN:** Is `depthConfig.enabled` true by default?
- **UNKNOWN:** Do sigils actually appear visually?
- **NEEDS:** Browser verification + possible default toggle

### Live Refinement — 60% Complete
- `components/LiveRefinementCanal.tsx` (131 lines) ✅
- `lib/stores/side-canal-store.ts` has addRefinement/clearRefinements ✅
- Pipeline reads liveRefinements at page.tsx:975 ✅
- Renders in chat at page.tsx:2482 ✅
- **MISSING:** No "refine this response" button on AI messages
- **MISSING:** No explicit re-query trigger (refinements are passive context only)

### Canvas Mode — 50% Complete
- `components/canvas/CanvasWorkspace.tsx` (506 lines) ✅
- Toggle wired in header (page.tsx:1745) ✅
- `isCanvasMode` state controls view ✅
- **UNKNOWN:** Does it render with actual data?
- **NEEDS:** Wire query cards, Side Canal topics as nodes

### Grimoire — 40% Complete
- `app/grimoires/page.tsx` (482 lines) ✅
- `app/grimoires/[id]/page.tsx` (476 lines) ✅
- `lib/stores/grimoire-store.ts` (359 lines) ✅
- `/grimoires` route returns 200 ✅
- **MISSING:** Not in footer navigation
- **MISSING:** Context injection into query pipeline
- **NEEDS:** CRUD testing + navigation wiring

### Idea Factory — 60% Complete
- `app/idea-factory/page.tsx` (114 lines) ✅
- `api/idea-factory/agent` + `api/idea-factory/generate` routes ✅
- Linked from footer as "intelligence & robot training" ✅
- **NEEDS:** Functional testing

---

## 🔴 NOT STARTED

### Query Source Separation
- Tag queries: user/refinement/system/continuation
- Visual treatment per source type
- Filter history by source
- **Effort:** 3-4 hours

### Selection Tool
- Cmd+Shift+4 screenshot → visual query
- DOM-aware capture
- **Effort:** 4-6 hours

### Code Agent (Mini Chat)
- Sandboxed code execution
- **Effort:** 6-8 hours

---

## 📋 EXECUTION PLAN (Day 44 Forward)

### Day 44: ✅ DONE
- [x] Commit uncommitted work (d74ff98)
- [x] Brave Search API integration (1e67c19)
- [x] Chat header nav buttons (1e67c19)

### Day 45: Browser Verification Sprint + Brave Key
1. Get Brave API key: https://brave.com/search/api/
2. Add to .env: `BRAVE_SEARCH_API_KEY=BSA...`
3. Test 10 search queries — target 100% real results
4. Browser verify: mindmap renders with nodes + lines
5. Browser verify: depth sigils visible on responses
6. Browser verify: canvas toggle works
7. Browser verify: grimoire page loads with content
8. Browser verify: live refinement panel in chat

### Day 46-47: Depth Annotations + Refinement (CLI)
1. Verify/fix depthConfig.enabled default
2. Add depth density toggle to UI
3. Add "refine this" buttons on AI responses
4. Wire re-query mechanism through refinement store
5. Test refinement chain (Refined ×2 badge)

### Day 48-49: Canvas + Grimoire Completion (CLI)
1. Wire live query data into canvas cards
2. Side Canal topics as canvas nodes
3. Canvas ↔ chat bidirectional navigation
4. Grimoire CRUD testing
5. Grimoire context → query pipeline injection
6. Add grimoire to navigation

### Day 50-55: Query Source Separation
1. Tag queries by source type
2. Visual treatment per type
3. History filtering

### Day 55-65: Selection Tool + Code Agent
1. Screenshot capture → visual query
2. Mini chat code execution
3. Sandboxed runtime

### Day 65-80: Deploy + Testing
1. Docker containerization
2. FlokiNET Iceland setup
3. CI/CD pipeline
4. E2E test suite
5. Performance optimization (page.tsx code splitting)

### Day 80-100: Pre-Launch Polish
1. Landing page design
2. Demo video
3. Beta invite system
4. Stripe/BTCPay integration testing

### Day 100-121: Launch Prep
1. Community building
2. Social presence
3. Day 121: SOCIAL LAUNCH 🚀

### Day 121-150: Post-Launch
1. Self-hosted model migration (Qwen 2.5-72B)
2. Tier enforcement
3. Day 150: Website launch (June 4, 2026)

---

## SYSTEM HEALTH: Day 44 (Corrected)

| Subsystem | Health | Change |
|-----------|--------|--------|
| Layer Calibration | 100% | — |
| AI Pipeline | 95% | — |
| SSE Metadata Pipeline | 90% | — |
| Reasoning Panel | 95% | — |
| Web Search | 60% | ↑ from 0% (Brave API + throttle, needs key) |
| Navigation | 95% | ↑ from 40% (all buttons wired, all views accessible) |
| Depth Annotations | 70% | ↑ Corrected — components + wiring exist |
| Live Refinement | 60% | ↑ Corrected — store + pipeline connected |
| Canvas Mode | 50% | ↑ Corrected — workspace + toggle exist |
| Grimoire | 40% | Pages + store exist |
| Mind Map | 90% | ↑ Auth gates removed, data flowing |
| Side Canal | 85% | — |
| Authentication | 70% | Session=null, features accessible |
| Database | 90% | SQLite healthy, 5.5MB |
| Idea Factory | 60% | Page + API routes exist |
| Pricing/Payments | 30% | BTCPay/Stripe/crypto webhooks exist, untested |

---

## CODEBASE METRICS

| Metric | Count |
|--------|-------|
| Total lines of code | ~92,000 |
| Components | 150 .tsx files |
| API routes | 67 endpoints |
| Database | 5.5 MB SQLite |
| MindMap nodes | 127 |
| MindMap links | 305 |
| Query history | 739 |
| Side Canal topics | 50 |
| Git commits (project) | 60+ |
| Git commits (Day 43-44) | 5 |

---

## VERIFICATION CHECKLIST

### ✅ Done
- [x] Layer sliders produce different AI outputs
- [x] Zero Kabbalistic terms in AI-facing code
- [x] SSE pipeline: globalThis singletons survive HMR
- [x] SSE pipeline: event buffer replays for late clients
- [x] Navigation accessible in ALL views (landing + chat)
- [x] Mindmap loads without authentication
- [x] Mindmap data key correctly mapped (links not connections)
- [x] DDG search returns real results when not rate-limited
- [x] No fake fallback results ever generated
- [x] Brave Search API integrated as primary provider

### ❌ Next Up (Browser Verification Needed)
- [ ] Get Brave API key and test search reliability
- [ ] Depth sigils (ᶠ ᵐ ᶜ) visible on response text
- [ ] Canvas mode renders when toggled
- [ ] Grimoire CRUD works
- [ ] Live refinement panel visible in chat
- [ ] MetadataStrip shows live stages during queries
- [ ] Mindmap renders nodes + connection lines visually