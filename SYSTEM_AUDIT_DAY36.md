# AkhAI System Audit — Day 36/150

**Date:** February 10, 2026
**Auditor:** Claude Code (automated)
**Scope:** 12 core subsystems, full data-flow tracing
**Commits this session:** `128d19c` (reasoning history), `51a5f12` (4 bug fixes)

---

## Status Summary

| # | System | Status | Issues | Priority |
|---|--------|--------|--------|----------|
| 1 | AI Layer Config | :red_circle: BROKEN | page.tsx never sends `layersWeights` to API — sliders are cosmetic | **P0** |
| 2 | Live Refinement | :warning: 75% | No re-query trigger; refinements only apply to NEXT query | P2 |
| 3 | Methodology Selection | :white_check_mark: 95% | Minor: arbitrary complexity thresholds | P3 |
| 4 | Guard System | :warning: 60% | AntipatternBadge imported but never rendered in UI | P1 |
| 5 | Side Canal | :white_check_mark: Working | Dual extraction redundancy (server + client = 2x API calls) | P3 |
| 6 | Mind Map | :white_check_mark: Working | No real-time updates (must reopen modal) | P3 |
| 7 | Writing Style | :white_check_mark: Working | Not in Zustand settings store (separate localStorage) | P3 |
| 8 | Insight Analysis | :white_check_mark: Working | No issues found | — |
| 9 | Multi-AI Consensus | :white_check_mark: Working | GTP only (by design) | — |
| 10 | Search (DDG) | :warning: Fixed | Was returning 0 results; rewritten this session | P2 |
| 11 | SSE Pipeline | :white_check_mark: Complete | All 11 stages emitted + DB fallback | — |
| 12 | Token Tracking | :white_check_mark: Complete | End-to-end: extracted, calculated, stored, displayed | — |

---

## Detailed Findings

### 1. AI Layer Configuration

**Files:** `components/AIConfigUnified.tsx` (832 lines), `lib/stores/layer-store.ts`, `app/page.tsx`, `app/api/simple-query/route.ts`, `lib/intelligence-fusion.ts`

**Status:** :red_circle: CRITICAL DISCONNECT

**What works:**
- UI sliders properly update Zustand store (`useLayerStore`)
- Store persists to localStorage (key: `layer-config`, version 5)
- API endpoint accepts `layersWeights` parameter and passes to fusion
- `calculateLayersActivations()` correctly uses weights: `effectiveWeight = activation * weight`
- Defaults to 0.5 for all 11 layers when not provided

**What's broken:**
- `page.tsx` **never imports `useLayerStore`** and **never sends `layersWeights`** in the fetch body (lines 1006-1029)
- Every query always uses identical default weights: `[0.5, 0.5, ..., 0.5]`
- The AI configuration interface is purely cosmetic with zero functional impact

**Fix needed:**
```typescript
// page.tsx — 3-line fix:
import { useLayerStore } from '@/lib/stores/layer-store'
// Inside handleSubmit, before fetch:
const { weights: layersWeights } = useLayerStore.getState()
// In fetch body:
body: JSON.stringify({ ..., layersWeights, ... })
```

---

### 2. Live Refinement

**Files:** `components/LiveRefinementCanal.tsx`, `lib/stores/side-canal-store.ts`, `app/page.tsx` (line 974, 1024)

**Status:** :warning: 75% Working

**What works:**
- Refinement input collects user feedback with auto-classification (refine/enhance/correct/instruct)
- State stored in Zustand (`useSideCanalStore.liveRefinements`)
- Refinements sent in fetch body: `liveRefinements` array (line 1024)
- Server receives and injects as context (route.ts lines 162-179)
- Formatted as `[type] text` and appended to system prompt

**What's broken:**
- **No re-query trigger**: Clicking refine/enhance/correct does NOT re-send current query. Refinements only apply to the NEXT query.
- **No visual feedback**: User doesn't see that refinements were applied to the response
- **No refinement history**: Refinements clear after query submit, no audit trail per message

**Fix needed:**
- Add "Submit Refinement" button that re-queries with accumulated refinements
- Show badge on response indicating refinement was applied
- Preserve original response alongside refined version

---

### 3. Methodology Selection

**Files:** `lib/intelligence-fusion.ts` (lines 351-433), `app/page.tsx` (line 369), `app/api/simple-query/route.ts` (line 203)

**Status:** :white_check_mark: 95% Working

**What works:**
- Auto mode: `fuseIntelligence()` → `selectMethodology()` with scoring per methodology
- Manual override: UI state `methodology` sent to API, server respects non-auto selections
- LRU cache (100 entries) prevents redundant query analysis
- Layer activation integration: dominant layers boost relevant methodologies
- Confidence metric attached to selection
- Methodology scores show alternatives with reasoning

**Minor issues:**
- Complexity thresholds somewhat arbitrary (50 chars, 15 words)
- CoD doesn't explicitly detect "step by step" keyword (checks queryType instead)

---

### 4. Guard System (Grounding Guard)

**Files:** `lib/antipattern-guard.ts` (596 lines), `app/api/simple-query/route.ts` (lines 538-550)

**Status:** :warning: 60% Working

**What works:**
- 5 antipattern detectors: obscurity, instability, toxicity, manipulation, vanity
- Severity scoring 0-1 per antipattern
- Purification rewrites (regex-based corrections)
- Severity threshold gate: only purifies at >= 40% (fixed this session)
- Antipattern data included in response `gnostic` metadata

**What's broken:**
- `AntipatternBadge` component imported in page.tsx (line 38) but **never rendered** in message display
- Guard verdict exists in `response.gnostic.antipatternType` but no UI shows it
- Purification happens silently — user never knows response was modified
- No "Show Original" option when purification occurs
- No guard verdict in reasoning panel

**Fix needed:**
- Render `AntipatternBadge` in message display with severity color coding
- Add "Show Original Response" toggle when purified
- Display guard verdict in PipelineHistoryPanel reasoning section
- Track diff between original and purified content

---

### 5. Side Canal

**Files:** `lib/side-canal.ts` (550+ lines), `lib/stores/side-canal-store.ts`, `app/api/side-canal/` (4 endpoints)

**Status:** :white_check_mark: Working

**What works:**
- Dual topic extraction: server-side (route.ts line 654-700) + client-side (page.tsx line 564-593)
- Context injection: `getContextForQuery()` retrieves synopses for similar past topics
- Suggestion engine: generates related topic suggestions
- Feature flags: enabled, contextInjectionEnabled, autoExtractEnabled, autoSynopsisEnabled
- Auto-synopsis disabled by design to prevent errors

**Potential concern:**
- Every response triggers 2x topic extraction (server + client)
- Could generate duplicate database inserts
- Client-side Zustand deduplicates on frontend but DB may have duplicates

---

### 6. Mind Map / Tree of Life

**Files:** `components/MindMap.tsx` (488 lines), `components/MindMapDiagramView.tsx` (430 lines), `app/api/mindmap/data/route.ts`

**Status:** :white_check_mark: Working

**What works:**
- Lazy-loaded: data fetched only when modal opens
- Topics from Side Canal feed visualization nodes
- D3-style force layout with category color coding
- Multiple views: diagram, history, table, report
- Navigation menu integration + footer button

**Minor issues:**
- No real-time updates — new query topics don't auto-refresh visualization
- Must close/reopen modal to see newly extracted topics
- `shouldShowMindmap()` only returns true if message has topics array

---

### 7. Writing Style System

**Files:** `app/page.tsx` (line 390, 692, 778), `app/api/simple-query/route.ts` (lines 1043-1143)

**Status:** :white_check_mark: Working

**What works:**
- Normal mode: Lead with insight, no filler, paragraphs over bullets
- Legend mode: Deeper analysis, historical-to-future flow, rich examples
- Forbidden patterns enforced (no "Great question!", "Let me explain", etc.)
- Method-specific prompts combined with writing style
- Persists to localStorage (`legendMode` key)
- Applied to all 7 methodologies

**Minor issues:**
- `legendMode` managed separately via `useState` + direct localStorage, not in Zustand settings store
- No visual indicator near input showing active writing mode
- Enhancement section (`[RELATED]`, `[NEXT]`) identical for both modes

---

### 8. Insight Analysis

**Files:** `lib/intelligence-fusion.ts` (analyzeQuery), `app/api/simple-query/route.ts` (routing event)

**Status:** :white_check_mark: Working

**What works:**
- Complexity scoring (0-1 scale) with multi-factor analysis
- 8 query types detected: factual, comparative, procedural, research, creative, analytical, troubleshooting, planning
- Keyword extraction with domain terms, bigrams, trigrams
- Confidence scores for methodology selection
- Routing event emits methodology + confidence percentage
- MetadataStrip displays in UI

---

### 9. Multi-AI Consensus

**Files:** `lib/provider-selector.ts`, `app/api/gtp-consensus/route.ts`

**Status:** :white_check_mark: Working (GTP only, by design)

**What works:**
- All non-GTP methodologies route to Claude Opus 4.5
- GTP: 3-round consensus (DeepSeek + Mistral + Grok → mutual review → Claude synthesis)
- User can select GTP explicitly or auto-selector triggers on consensus keywords
- Advisory responses included in response structure

---

### 10. Search Integration (DuckDuckGo)

**Files:** `app/api/enhanced-links/route.ts` (628 lines)

**Status:** :warning: Fixed This Session

**What was broken:**
- All searches returning 0 results, falling back to smart fallback links
- DDG HTML parsing used rigid regex that no longer matched DDG output
- CSS selectors/regex for `result__a` class and snippet extraction outdated

**What was fixed (commit `51a5f12`):**
- Rewrote `searchWeb()` with DDG HTML POST method + proper form encoding
- Added `result__a` class-based link parsing with fallback patterns
- Added `searchWebLite()` as secondary fallback (DDG Lite endpoint)
- Added `isValidResultUrl()` helper to filter noise
- Debug logging of first 300 chars of DDG response

---

### 11. SSE/Streaming Pipeline

**Files:** `lib/thought-stream.ts`, `app/api/thought-stream/route.ts`, `app/api/simple-query/route.ts`

**Status:** :white_check_mark: Complete

**All 11 stages emitted:**

| Stage | Line | Data |
|-------|------|------|
| received | 79 | Query snippet |
| side-canal | 150 | Context injection size |
| refinements | 169 | Refinement count |
| routing | 208 | Methodology + confidence |
| layers | 269 | Dominant layer + weights |
| guard | 516 | Risk scores |
| reasoning | 406 | Intent + reflection mode |
| generating | 463 | Provider + model |
| analysis | 613 | Post-processing results |
| complete | 802 | Duration + cost |
| error | 829 | Failure details |

**Architecture:**
- Frontend connects EventSource BEFORE fetch (line 992 page.tsx)
- Events stored in Zustand via `pushMetadata()`
- Database persistence via `emitAndPersist()` pattern — dual-write to SSE + DB
- Auto-closes on terminal stages (complete/error)

---

### 12. Token Tracking & Cost

**Files:** `lib/multi-provider-api.ts`, `app/api/simple-query/route.ts` (lines 507, 642-650), `lib/database.ts`

**Status:** :white_check_mark: Complete

**What works:**
- Token extraction from all 4 providers (Anthropic, DeepSeek, Mistral, xAI)
- Cost calculation based on provider pricing
- Per-query persistence: `queries.tokens_used`, `queries.cost`
- Aggregate tracking: `usage` table by provider/model
- UI display: History page, Profile page, MetadataStrip
- Analytics: PostHog tracking with tokens, cost, latency, provider

---

## Priority Fix Order

### P0 — Critical (Breaks core value prop)

1. **Wire layer weights to API** — page.tsx must import `useLayerStore` and send `layersWeights` in fetch body. 3-line fix, 1 minute. Without this, the entire Sefirot configuration system is decorative.

### P1 — High (Feature exists but invisible)

2. **Render AntipatternBadge in UI** — Guard detects and purifies but user never sees it. Render the imported `AntipatternBadge` component in message display. Add "Show Original" toggle.

### P2 — Medium (Functional but incomplete)

3. **DDG search verification** — Rewritten this session, needs production testing to confirm DDG HTML parsing works with real queries
4. **Live refinement re-query** — Add mechanism to re-send current query with accumulated refinements instead of only applying to next query

### P3 — Low (Quality of life)

5. **Deduplicate topic extraction** — Remove client-side extraction since server already handles it
6. **Mind Map real-time updates** — Auto-refresh when new topics extracted
7. **Migrate legendMode to settings store** — Consistent persistence pattern

---

## Next Development Steps (Milestones 3-9)

| Milestone | Name | Description | Priority |
|-----------|------|-------------|----------|
| **M3** | Query Source Separation | Distinguish between user queries, refinements, and system context in the pipeline | High |
| **M4** | Selection Tool (Cmd+Shift+4) | Screenshot-based query input for visual intelligence | Medium |
| **M5** | Mini Chat Code Agent | Grimoire execution layer with code enhancement and project tools | High |
| **M6** | Depth Annotations + Sigils | Visual markers for reasoning depth and methodology in responses | Medium |
| **M7** | Grimoire System | Full project workspace with objectives, deadlines, risk/reward | High |
| **M8** | Deploy + Testing | Production deployment with comprehensive test suite | Critical |
| **M9** | Social Launch Prep | Landing page, documentation, demo videos, community setup | High |

### Recommended Pre-Milestone Work

Before advancing to M3-M9, resolve P0 and P1 issues:
1. Wire layer weights (P0) — unlocks the entire Sefirot configuration value
2. Render guard badge (P1) — makes the anti-hallucination system visible to users
3. Verify DDG search (P2) — confirms enhanced links work in production

These 3 fixes take ~15 minutes total and dramatically improve the product's functional completeness from ~75% to ~95%.

---

## Architecture Health Score

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Backend Logic** | 95% | Fusion engine, guard, SSE pipeline all sophisticated and complete |
| **Frontend Integration** | 70% | Critical disconnect (layer weights), missing UI (guard badge) |
| **Data Persistence** | 90% | SQLite + localStorage + Zustand well-architected |
| **State Management** | 85% | Multiple Zustand stores, some inconsistency (legendMode) |
| **Error Handling** | 80% | Try/catch throughout, SSE fallback, but some silent failures |
| **Cost Efficiency** | 75% | All queries use Opus 4.5 ($15/$75 per M tokens) — no Haiku for simple queries |

**Overall System Health: 82%**

The backend is production-quality. The frontend needs targeted wiring fixes to match.
