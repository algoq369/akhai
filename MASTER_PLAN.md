# AkhAI UNIFIED MASTER PLAN — Day 76→Launch (June 4, 2026)
# Updated: March 30, 2026 | 74 days remaining
# Authority: Single source of truth for all development phases

---

## COMPLETED — Pre-Development Stabilization (Days 75-76)

### WEBNA Standards Adoption (8 commits)
- ✅ Root cleaned: 26 scattered files archived → 6 MD files remain
- ✅ page.tsx split: 3,028 → 222 lines (93% reduction)
- ✅ Hooks split: useHomePageHandlers 1,199→4 files, useHomePageState 863→3 files
- ✅ GitHub Actions CI workflow created
- ✅ WEBNA_STANDARDS.md + CLAUDE.md updated

### Engine Fix Plan — 9/9 Complete (9 commits)
- ✅ FIX 1: Auto-rebuild better-sqlite3 in predev script (6b60a7a)
- ✅ FIX 2: SSE complete event verified working (all 9 stages fire)
- ✅ FIX 3: MetadataStrip live rendering with isStreaming prop (35a7fc2)
- ✅ FIX 4: All 11 AI computational layer names in SSE events (88106f8)
- ✅ FIX 5: SSE reasoning narrative enriched with natural language (35a7fc2)
- ✅ FIX 6: Fusion methodology honors user selection (f2dbb72)
- ✅ FIX 7: VIEW tabs always render — fallback views when parsing insufficient (39c7f35)
- ✅ FIX 8: Depth annotations work on plain text — position-based sigils (c7a9ee4)
- ✅ FIX 9: Canvas toolbar with zoom/reset + generation buttons always visible (5289fcb)

### UI Round 2 Fixes (8 commits)
- ✅ VIEW tabs: removed shouldShow gates, always render when content > 200 chars
- ✅ Depth annotations: broader fallback patterns (long sentences, parentheticals)
- ✅ Canvas: generation buttons always visible (greyed when no query selected)
- ✅ Canvas: goal/milestone tools + AI summary button added
- ✅ Depth: bulletproof position-based sigil rendering (no more indexOf)
- ✅ Depth: contextual sentence extraction replaces generic "Click to explore"
- ✅ VIEW tabs: guaranteed fallback divs (word count, key sentences, keyword chips)

### Infrastructure
- ✅ Claude Opus 4.6 set as primary on both localhost + VPS (AKHAI_FREE_MODE=false)
- ✅ All fixes deployed to akhai.app (FlokiNET Iceland VPS)
- ✅ PM2 restarted with fresh env (delete + start, not just restart)

---

## KNOWN DEBT (Phase F — split before launch)
6 files exceed WEBNA 500-line limit from CLI expansion:
- CanvasWorkspace.tsx: ~2,126 lines
- LayerResponse.tsx: ~1,451 lines
- depth-annotations.ts: ~1,619 lines
- intelligence-fusion.ts: ~1,109 lines
- ResponseMindmap.tsx: ~829 lines
- InsightMindmap.tsx: ~605 lines

---

## EXECUTION PLAN — 7 PHASES (Day 76→Launch)

```
Phase A: Methodology Rename        Days 76-77    3h     P0  ✅ DONE
Phase B: Metadata Persist+Replay   Days 77-79    4h     P1  ← NEXT
Phase C: Methodology Pipelines     Days 79-90    16h    P1
Phase D: God View Phase 2+3        Days 90-100   20h    P1
Phase E: Feature Completion        Days 100-108  16h    P2
Phase F: UI Polish + Performance   Days 108-114  13h    P2
Phase G: Pre-Launch                Days 114-120  20h    P3
         ─────────────────────────────────────────
         SOCIAL LAUNCH             Day 121
         AUDIENCE BUILDING         Days 121-150
         PUBLIC LAUNCH             Day 151 (June 4)
```

---

## PHASE A: METHODOLOGY RENAME (Days 76-77, ~3h) ← NEXT
P0 — Credibility. Three methods use fabricated academic names.

bot → Self-Consistency (SC) — Wang et al., ICLR 2023
pot → Plan-and-Solve (PaS) — Wang et al., ACL 2023
gtp → Tree of Thoughts (ToT) — Yao et al., NeurIPS 2023

### Final 7 Methods:
| Slot | Old ID | New ID | UI | Full Name | Paper |
|------|--------|--------|----|-----------|-------|
| 1 | auto | auto | AUTO | Automatic Router | Route-To-Reason 2025 |
| 2 | direct | direct | DIR | Direct | Brown et al. 2020 |
| 3 | cod | cod | COD | Chain of Draft | Xu et al. 2025 |
| 4 | bot | sc | SC | Self-Consistency | Wang et al. ICLR 2023 |
| 5 | react | react | REACT | ReAct Agent | Yao et al. ICLR 2023 |
| 6 | pot | pas | PAS | Plan-and-Solve | Wang et al. ACL 2023 |
| 7 | gtp | tot | TOT | Tree of Thoughts | Yao et al. NeurIPS 2023 |

### Steps:
- A1: Rename in MethodologyFrame.tsx (UI labels + IDs)
- A2: Rename in provider-selector.ts (METHODOLOGY_PROVIDER_MAP)
- A3: Rename in intelligence-fusion.ts (scoring + behaviors)
- A4: Rename in simple-query/route.ts (routing logic)
- A5: Update database records (existing queries)
- A6: Verify + deploy

---

## PHASE B: METADATA PERSIST + REPLAY (Days 77-79, ~4h)
P1 — Phase B was 80% done during stabilization. Remaining:
- B6: Persist SSE metadata to database per query
- B7: Replay metadata timeline when viewing past queries
- B8: Verify + deploy

---

## PHASE C: METHODOLOGY PIPELINES (Days 79-90, ~16h)
P1 — Each method becomes a genuinely different AI process.

| Method | API Calls | Pipeline |
|--------|-----------|----------|
| Direct | 1 | query → generate → done |
| CoD | 1 | query → minimal-word step-by-step → done |
| SC | 3 | query → 3 parallel paths → majority vote |
| ReAct | 3-7 | [think → search → observe] × N → synthesize |
| PaS | 2 | query → plan steps → execute steps |
| ToT | 3-4 | 3 branches → evaluate → prune → expand |
| Auto | 1+ | classify → select best skill → delegate |

Steps:
- C1: Create lib/skills/ framework (types.ts, index.ts)
- C2: Implement 7 skill files
- C3: Wire skills into simple-query pipeline
- C4: Method-specific metadata in MetadataStrip
- C5: Test all 7 with same query, verify different outputs

---

## PHASE D: GOD VIEW PHASE 2+3 (Days 90-100, ~20h)
P1 — 5-agent Perspective Council + Scenario Sandbox.

Phase 2: Perspective Council (5 agents mapped to Sefirot)
- The Visionary (Chokmah/Reasoning) — big picture
- The Analyst (Binah/Encoder) — decompose + patterns
- The Advocate (Chesed/Expansion) — upside + possibilities
- The Skeptic (Gevurah/Discriminator) — challenge claims
- The Synthesizer (Tiferet/Attention) — balance + judgment

Phase 3: Scenario Sandbox (/sandbox page)
- Seed input + "What if?" branching (bull/base/bear)

---

## PHASE E: FEATURE COMPLETION (Days 100-108, ~16h)
P2 — Complete partially built features.

- E1: Grimoire system (project workspace, CRUD, context-aware chat) — 6h
- E2: Live Refinement re-query fix (refine/enhance/correct actually re-send) — 2h
- E3: Canvas ↔ Text navigation (click card → scroll to message) — 2h
- E4: Mindmap polish (CLUSPLOT verify, Grimoire tab wiring, living graph) — 2h
- E5: DDG Search hardening (throttling, retry, SearXNG fallback) — 2h
- E6: Query Source Separation (tag user/refinement/system/continuation) — 2h

---

## PHASE F: UI POLISH + PERFORMANCE (Days 108-114, ~13h)
P2 — Code quality + launch readiness.

- F1: Split 6 oversized files back under WEBNA 500-line limit — 4h
- F2: Lighthouse 90+ (lazy load, bundle analysis) — 2h
- F3: E2E tests with Playwright (auth, query, methodology switching) — 3h
- F4: Depth annotation polish (density, priority ordering) — 2h
- F5: Replace old console.log logger with structured Pino logger — 2h

---

## PHASE G: PRE-LAUNCH (Days 114-120, ~20h)
P3 — Everything needed for Day 121 social launch.

- G1: Landing page redesign ("School of Thoughts" concept) — 4h
- G2: Onboarding flow (first-time tutorial, preset selection) — 4h
- G3: Pricing page + Stripe test (Free/Pro $20/Legend $200) — 3h
- G4: Legal (privacy policy, terms, data attributions) — 2h
- G5: Social content (X thread, demo video, whitepaper update) — 4h
- G6: Documentation (API docs, methodology descriptions, self-hosting) — 3h

---

## POST-LAUNCH (Days 121-150)

### Social Launch (Day 121)
- X/Twitter thread + demo video
- Share with family/friends for feedback
- Monitor Sentry + UptimeRobot + OpenPanel

### Audience Building (Days 121-150)
- Daily engagement on AI Twitter
- Product Hunt launch prep
- Discord/community setup

### Sovereign Infrastructure (Days 130-150)
- Self-hosted model migration (Qwen 2.5-72B)
- DGX Spark ($3,999) or Hetzner GEX131 (€889/mo)
- Vercel AI SDK abstraction → full self-hosted by Q1 2027

### Revenue (Days 140-150+)
- Stripe payments live
- Tier enforcement (token limits)

---

## DEFERRED TO V2
- Selection Tool (Cmd+Shift+4 screenshot query)
- Mini Chat Code Agent (code execution in side panel)
- User analytics dashboard
- x402 crypto payments
- Gnostic Esoteric Layer (Kabbalistic + astrological data)

---

## VISUAL TIMELINE

```
  DAY 76                                                     DAY 150
   │                                                           │
   ┌─A──┬──B──┬─────────C──────────┬──────D──────┬──E───┬F──┬──G──┐
   │Name│Meta│  7 Method Pipes     │God View 2+3 │Feats │Pol│Pre │
   │ 3h │ 4h │  16h               │ 20h         │ 16h  │13h│20h │
   └────┴────┴────────────────────┴─────────────┴──────┴───┴────┘
   76   77  79       90        100      108  114  120  121
                                                        │
                                                   SOCIAL LAUNCH
                                                        │
                                              Days 121-150: Growth
                                                        │
                                                   June 4: PUBLIC
```

## TOTAL: 92h remaining across 7 phases | 74 days to launch
