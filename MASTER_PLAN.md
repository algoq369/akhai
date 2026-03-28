# AkhAI UNIFIED MASTER PLAN — Day 75→Launch (June 4, 2026)
# Merges: All past milestone plans + new methodology research + God View + pro standards
# Updated: March 20, 2026 | 75 days remaining

---

## STATUS: WHAT'S BUILT vs WHAT'S PLANNED

### ✅ COMPLETED (Days 1-75)
- Core query engine + streaming responses
- 11 AI Computational Layers (Sefirot) + slider configuration
- Antipattern Guard (5-check system)
- Side Canal (topic extraction + context injection)
- Auth (Email, Wallet, GitHub, X/Twitter OAuth)
- Mindmap CLUSPLOT (bubble clusters, hover cards, analyse/continue)
- Mindmap tabs (Graph | History | Grimoire placeholder)
- Canvas/VisionBoard with draggable panels
- Philosophy page (ASCII trees — Traditional, Computational, Qliphoth)
- Depth annotations system (◊ △ ⊕ ○ sigils inline)
- Finance banner (BTC, MCAP, GOLD, OIL, DXY, F&G)
- News ticker (Brave Search API)
- Live Refinement Canal (refine/enhance/correct buttons)
- God View Phase 1 (tree visualization + activity feed)
- Whitepaper page
- PostHog analytics (12 custom events)
- All pro standards hardening (security headers, Sentry, UptimeRobot, OpenPanel, tests, backups)
- Deployed to akhai.app (FlokiNET Iceland VPS)

### 🔧 PARTIALLY BUILT (needs wiring/fixing)
- Metadata streaming (components exist, SSE wired, but shows nothing during processing)
- VIEW tabs (AI Layers/Insight/Mindmap tabs render but don't populate consistently)
- Live Refinement re-query (buttons exist but may not re-send with refinement context)
- Canvas ↔ Text navigation (files exist but navigation not fully wired)
- DDG search (parser rewritten but needs reliability verification)

### 📋 NOT YET BUILT (from original milestones + new plan)
- Methodology pipelines (7 methods exist as UI labels but use same AI process)
- Methodology names correction (3 fake names: bot, pot, gtp)
- God View Phase 2 (5-agent Perspective Council)
- God View Phase 3 (Scenario Sandbox /sandbox page)
- Grimoire system (project workspace with objectives/deadlines)
- Selection Tool (Cmd+Shift+4 screenshot query)
- Mini Chat Code Agent (code execution in side panel)
- Query Source Separation (tag user/refinement/system/continuation)
- Landing page redesign
- Onboarding flow
- Pricing page + Stripe test
- Privacy policy + terms

---

## UNIFIED EXECUTION PLAN — 7 PHASES

```
Phase A: Methodology Fix          Days 75-76    3h     P0
Phase B: Metadata Pipeline         Days 76-79    8h     P0
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

## PHASE A: FIX METHODOLOGY NAMES (Days 75-76, ~3h)
## P0 — Credibility. Three methods use fabricated academic names.

Research finding: "Bag of Thoughts", "Plan of Thought", "Multi-AI Consensus (GTP)"
are not real published techniques. They map to:
- bot → Self-Consistency (Wang et al., ICLR 2023, 1500+ citations)
- pot → Plan-and-Solve (Wang et al., ACL 2023)
- gtp → Tree of Thoughts (Yao et al., NeurIPS 2023 Oral) [SWAP — fills exploration gap]

### Final 7 Methods:
| Slot | ID | UI | Full Name | Paper |
|------|----|-----|-----------|-------|
| 1 | auto | AUTO | Automatic Router | Route-To-Reason 2025 |
| 2 | direct | DIR | Direct | Brown et al. 2020 |
| 3 | cod | COD | Chain of Draft | Xu et al. 2025 |
| 4 | sc | SC | Self-Consistency | Wang et al. ICLR 2023 |
| 5 | react | REACT | ReAct Agent | Yao et al. ICLR 2023 |
| 6 | pas | PAS | Plan-and-Solve | Wang et al. ACL 2023 |
| 7 | tot | TOT | Tree of Thoughts | Yao et al. NeurIPS 2023 |

### Steps:
- A1: Update MethodologyFrame.tsx (bot→sc, pot→pas, gtp→tot)
- A2: Update all codebase references
- A3: Update database records
- A4: Verify + deploy

---

## PHASE B: METADATA PIPELINE (Days 76-79, ~8h)
## P0 — Core differentiator. Users see live AI reasoning like Claude's thinking.

### What to fix:
- B1: Diagnose SSE data flow (console.log at page.tsx:952)
- B2: Fix MetadataStrip live rendering (add isStreaming prop, fix phase logic)
- B3: Enrich reasoning narrative in all 8 SSE stages (natural language, not labels)
- B4: Wire isStreaming prop in page.tsx line 2128
- B5: Fix VIEW tabs (AI Layers, Insight, Mindmap) data population
- B6: Persist + replay metadata history for past queries
- B7: Verify + deploy

---

## PHASE C: METHODOLOGY PIPELINES (Days 79-90, ~16h)
## P1 — Each method becomes a genuinely different AI process.

### What to build:
- C1: Create lib/skills/ framework (types.ts, index.ts)
- C2: Implement 7 skill files:
  | Method | API Calls | Pipeline |
  |--------|-----------|----------|
  | Direct | 1 | query → generate → done |
  | CoD | 1 | query → minimal-word step-by-step → done |
  | SC | 3 | query → 3 parallel paths → majority vote |
  | ReAct | 3-7 | [think → search → observe] × N → synthesize |
  | PaS | 2 | query → plan steps → execute steps |
  | ToT | 3-4 | 3 branches → evaluate → prune → expand |
  | Auto | 1+ | classify → select best skill → delegate |
- C3: Wire skills into simple-query pipeline
- C4: Method-specific metadata in MetadataStrip
- C5: Test all 7 with same query, verify different outputs + traces

---

## PHASE D: GOD VIEW PHASE 2+3 (Days 90-100, ~20h)
## P1 — Novel features. 5-agent Council + Scenario Sandbox.

### Phase 2: Perspective Council (14h)
5 agents mapped to Sefirot, run in parallel via Promise.all:
| Agent | Sefirah | Layer | Role |
|-------|---------|-------|------|
| The Visionary | Chokmah | Reasoning | Big picture, connections |
| The Analyst | Binah | Encoder | Decompose, patterns, data |
| The Advocate | Chesed | Expansion | Upside, possibilities |
| The Skeptic | Gevurah | Discriminator | Challenge claims, flaws |
| The Synthesizer | Tiferet | Attention | Balance + final judgment |

- D1: Install Vercel AI SDK + providers
- D2: Create lib/god-view/agents.ts (5 agent configs + prompts)
- D3: Create POST /api/god-view/council (4+1 fan-out/fan-in)
- D4: Create CouncilPanel.tsx + AgentCard.tsx (5-card grid)
- D5: Agent drill-down conversation (click card → mini-chat)
- D6: Wire Council to God View tree (light up 5 nodes)

### Phase 3: Scenario Sandbox (6h)
- D7: Create /sandbox page (seed input + "What if?" question)
- D8: Create POST /api/sandbox/predict (3 scenario branches)
- D9: Branch visualization (bull/base/bear timeline)

---

## PHASE E: FEATURE COMPLETION (Days 100-108, ~16h)
## P2 — Complete partially built + deferred features from original milestones.

### E1: Grimoire System (6h) [was Milestone 6]
- Create /grimoire page with project workspace
- Project CRUD (name, objectives, deadlines, files)
- Context-aware chat within Grimoire
- Guard monitors scope drift
- Risk/reward calculator

### E2: Live Refinement Re-Query Fix (2h) [was Phase 4.1]
- Verify refine/enhance/correct buttons re-send query with refinement context
- Show "Refined ×2" badge on refined responses
- Refinement chain tracking per message

### E3: Canvas ↔ Text Navigation (2h) [was Step 3.2]
- Click query card on canvas → switch to text mode, scroll to message
- Side Canal topics → auto-create visual nodes on canvas

### E4: Mindmap Polish (2h) [was graph view refinement]
- Verify CLUSPLOT renders clean on production
- Grimoire tab wiring (currently placeholder)
- History tab data population verification
- Living graph poll (30s refresh, pulse-glow on new nodes)

### E5: DDG Search Hardening (2h) [was Phase 4.2 / Day 45-46]
- Request throttling (max 1 req/2s)
- Retry with exponential backoff
- Verify SearXNG fallback works
- Test 20-query session without rate limiting

### E6: Query Source Separation (2h) [was Milestone 3]
- Tag queries as user/refinement/system/continuation
- Color-code in reasoning panel by source type
- Track refinement chains per message

---

## PHASE F: UI POLISH + PERFORMANCE (Days 108-114, ~13h)
## P2 — Code quality + launch readiness.

### F1: Break up page.tsx (4h)
- ~3600 lines → extract MessageThread, QueryInput, ViewTabs
- Target: page.tsx under 800 lines

### F2: Remove all `as any` casts (2h)
- 10 locations from Day 1 audit
- Define proper interfaces

### F3: Lighthouse 90+ (2h)
- Server Components by default
- Lazy load heavy components
- Bundle analysis with @next/bundle-analyzer

### F4: E2E Tests — Playwright (3h)
- Auth flow, query submission, methodology switching
- Target 80% coverage on critical paths

### F5: Depth Annotations Polish (2h)
- Verify sigils render consistently
- Fix annotation density per paragraph
- Priority ordering: ᶠ fact > ᵐ metric > ᶜ connection > ᵈ detail > ˢ source

---

## PHASE G: PRE-LAUNCH (Days 114-120, ~20h)
## P3 — Everything needed for Day 121 social launch.

### G1: Landing Page Redesign (4h)
- Hero: "School of Thoughts" concept visual
- 7 methodology cards with descriptions
- Live demo embed or video
- CTA → sign up

### G2: Onboarding Flow (4h)
- First-time user tutorial (3 steps)
- Default layer preset selection
- Sample query with methodology showcase

### G3: Pricing Page + Stripe Test (3h)
- Free (50K tokens/day) / Pro $20/mo / Legend $200/mo
- Stripe Checkout integration test
- Usage tracking against tier limits

### G4: Legal (2h)
- Privacy policy (data collection disclosure)
- Terms of use
- Data source attributions (Brave, OpenRouter, Anthropic)

### G5: Social Content (4h)
- X thread: "I built an AI with 7 different thinking styles" (15 tweets)
- Demo video: 2-min walkthrough showing metadata + Council + methods
- Whitepaper update with methodology research citations

### G6: Documentation (3h)
- API docs for future developers
- Methodology descriptions with academic references
- Self-hosting guide for open-source contributors

---

## POST-LAUNCH (Days 121-150)

### Social Launch (Day 121)
- X/Twitter thread + demo video
- Share with family/friends for initial feedback
- Monitor Sentry + UptimeRobot + OpenPanel

### Audience Building (Days 121-150)
- Daily engagement on AI Twitter
- Product Hunt launch prep
- Discord/community setup

### Sovereign Infrastructure (Days 130-150)
- Self-hosted model migration (Qwen 2.5-72B primary, Mistral fallback)
- DGX Spark procurement ($3,999)
- Dual-RTX 4090 local rig (~€8,500)
- Hetzner GEX131 (€889/mo) for post-launch scaling
- Vercel AI SDK abstraction layer → full self-hosted by Q1 2027

### Revenue (Days 140-150+)
- Stripe payments live
- Tier enforcement (token limits)
- G&BV seed capital allocation (post-fundraise)

---

## DEFERRED FEATURES (Post-Launch / V2)

These features from original milestones are deferred to post-launch:
| Feature | Original Milestone | Why Deferred |
|---------|-------------------|--------------|
| Selection Tool (Cmd+Shift+4) | M4 | Nice-to-have, not core |
| Mini Chat Code Agent | M5 | Complex, needs sandbox |
| User analytics dashboard | Post-launch | Needs user base first |
| x402 crypto payments | Post-launch | Stripe first, crypto later |

---

## VISUAL TIMELINE

```
         DAY 75                                                DAY 150
          │                                                      │
  ┌───A───┬────B────┬─────────C──────────┬──────D──────┬──E───┬F──┬──G──┐
  │ Names │Metadata │  7 Method Pipes    │God View 2+3 │Feats │Pol│Pre │
  │ 3h    │ 8h      │  16h               │ 20h         │ 16h  │13h│20h │
  └───────┴─────────┴────────────────────┴─────────────┴──────┴───┴────┘
  Day 75   76    79        90         100      108  114  120  121
                                                              │
                                                         SOCIAL LAUNCH
                                                              │
                                                    Days 121-150: Growth
                                                              │
                                                         June 4: PUBLIC
```

## EFFORT SUMMARY

| Phase | Hours | Key Deliverable |
|-------|-------|-----------------|
| A: Methodology Names | 3h | Credible academic-backed method names |
| B: Metadata Pipeline | 8h | Live AI reasoning visible during queries |
| C: Method Pipelines | 16h | 7 genuinely different AI processes |
| D: God View 2+3 | 20h | 5-agent Council + Scenario Sandbox |
| E: Feature Complete | 16h | Grimoire, refinement, canvas, mindmap, DDG |
| F: Polish | 13h | page.tsx split, tests, Lighthouse 90+ |
| G: Pre-Launch | 20h | Landing, onboarding, pricing, legal, content |
| **TOTAL** | **96h** | **Launch-ready product** |

---

## DEPENDENCY MAP

```
A (names) ──→ C (pipelines need correct method IDs)
B (metadata) ──→ C (pipelines emit method-specific metadata)
C (pipelines) ──→ independent after A+B
D (God View) ──→ needs Vercel AI SDK, independent of C
E (features) ──→ can start after D, parallel with F
F (polish) ──→ parallel with any phase
G (pre-launch) ──→ after all features stable
```

## IMMEDIATE NEXT ACTION
Start Phase A: Rename bot→sc, pot→pas, gtp→tot in MethodologyFrame.tsx
Then Phase B: Fix metadata pipeline so users see live reasoning.
