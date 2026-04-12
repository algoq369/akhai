# ◊ AKHAI — Master Plan V5.1
## Day 94/150 — April 10, 2026 — 55 days to launch

**445 commits | 57/57 tests green | Launch: June 4, 2026**

---

## TIMELINE OVERVIEW

| Phase | Days | Focus | Status |
|-------|------|-------|--------|
| 1. Visual Sovereignty | 1–70 | UI, Canvas, Mindmap, Depth Annotations | ✅ COMPLETE |
| 2. Validation + Polish | 71–93 | Mini Canvas, Council, God View, metadata | ✅ COMPLETE |
| 3. AGI Activation | 94–120 | Esoteric Layer, Sandbox, Voice, Gnostic | 🔵 IN PROGRESS |
| 4. Community + Launch | 121–150 | Social, audience building, website launch | ⬜ QUEUED |

---

## PHASE 1 — COMPLETE (Days 1–70)

- ✅ 7 reasoning methodologies (SC, PaS, ToT, CoT, Direct, CoD, Auto)
- ✅ Grounding Guard (4 detectors) + Side Canal topic extraction
- ✅ 11 AI computational layers with slider calibration
- ✅ SSE metadata pipeline (globalThis singleton + event buffer replay)
- ✅ Canvas workspace (draggable panels, query cards, SVG connections)
- ✅ Mindmap (CLUSPLOT clusters, hover cards, click-to-expand)
- ✅ History tab, Grimoire, Philosophy page (ASCII trees)
- ✅ Full auth: Email (Resend), X/Twitter OAuth, Web3 Wallet, GitHub
- ✅ Email: noreply@akhai.app via Resend, DKIM/SPF/DMARC
- ✅ Security audit: removed all `OR user_id IS NULL`
- ✅ PostHog EU analytics (12 events, 7 components)
- ✅ 5-model free API fallback chain
- ✅ Finance ticker + News ticker
- ✅ Deploy pipeline: rsync + PM2 on FlokiNET Iceland VPS

## PHASE 2 — COMPLETE (Days 71–93)

### Mini Canvas (18 commits: 23c963e → 8b8c1d6)
- ✅ Content classifier (facts/metrics/correlations extraction)
- ✅ 5 themed fact boxes (tangible, verifiable, unrefutable, non-biased, straight forward)
- ✅ Dashboard 2-column grid layout
- ✅ Metric word-boundary truncation, [NEXT]/[RELATED] tag stripping
- ✅ Client-side classifyContent fallback + poll endpoint fix
- ✅ Contrast fix, noise filtering, per-category deduplication

### Perspective Council (5 commits: 86f7bed → 212edc0)
- ✅ 5 AI computational agents (Visionary, Analyst, Advocate, Skeptic, Synthesizer)
- ✅ Vercel AI SDK installed (ai, @ai-sdk/anthropic, @ai-sdk/google, @ai-sdk/openai)
- ✅ Promise.allSettled fan-out (4 parallel + 1 synthesis)
- ✅ CouncilButton + CouncilPanel with auto-expand + loading skeleton
- ✅ Provider fallback: all agents use anthropic when google/deepseek keys missing
- ✅ Tree node highlighting with agent-colored glow + sigils during council
- ✅ Agent drill-down chat (click agent → mini-chat with that perspective)
- ✅ AgentChat.tsx + POST /api/god-view/agent-chat
- ✅ Council description text + 30s timeout safety

### God View Phase 1 — Neural Tree (4 commits: 679fb48 → 4f9aaa5)
- ✅ GodViewTree.tsx (extracted, reusable, 17KB)
- ✅ GodViewPanel.tsx (slide-in overlay)
- ✅ ActivityFeed.tsx (sigil event log)
- ✅ SSE → live tree wiring via Zustand
- ✅ Animations: node glow, path pulse, guard pulse, sequential cascade
- ✅ Hebrew/Kabbalistic labels removed from all visible UI (10 locations, 8 files)
- ✅ Node spacing increased 25% + text contrast improved
- ✅ Mobile responsive (bottom drawer) — partial

### Other Phase 2 completions
- ✅ Depth annotations: patterns fixed for plain-text responses (3b91798)
- ✅ PipelineHistoryPanel restored as metadata panel (3117a14)
- ✅ Canvas crash fix — methodology normalization + null guards (aa53a38)
- ✅ Bottom input compaction — ~50px vertical savings (dbaa7a6)
- ✅ Hydration mismatch fix + API credit error handling (21eb0ba)
- ✅ Phase A MASTER_PLAN: renamed 3 fabricated methodology IDs
- ✅ VPS env audit (Twitter OAuth + Reown domain — manual steps documented)
- ✅ Master Plan V5 + God View 4-phase audit

## PHASE 3 — IN PROGRESS (Days 94–120)

### ✅ Already started
- ✅ Scenario Sandbox Part 1: page + engine + SSE predict API (4d975a0)
- ✅ Scenario Sandbox Part 2: timeline viz + scenario reports + world-state chat (dc311d2)

### 3A. Macro-Cyclical Esoteric Layer (Days 94–100, ~23h total)

5-framework analysis engine with dual-mode presentation (Standard ↔ Full Spectrum).
Frameworks: Barbault Index, Turchin SDT, Kondratieff/Perez, Strauss-Howe, Dalio Big Cycle.
All converge on 2020s as multi-dimensional crisis peak.

| Step | Task | Est | Status |
|------|------|-----|--------|
| 3A.1 | Data layer — precompute all JSON datasets | 4h | ⬜ |
|      | Barbault Index (monthly 1900-2050, ~63KB via Python ephemeris) | | |
|      | K-wave phase dating (6 waves, boundaries, driving tech) | | |
|      | Strauss-Howe turning dates + generational archetypes | | |
|      | Dalio Power Index (18 factors × 10 nations snapshot) | | |
|      | Turchin PSI proxies (FRED/Census indicator values) | | |
|      | Cross-civilizational pattern templates (Hermetic/Vedic/Islamic/Chinese) | | |
| 3A.2 | Engine + API | 4h | ⬜ |
|      | lib/esoteric/cycle-engine.ts — load data, compute positions, convergence score | | |
|      | lib/esoteric/cross-civilizational.ts — pattern templates per topic | | |
|      | app/api/esoteric/analyze/route.ts — POST, returns frameworks + AI prose | | |
|      | Query detection: keyword classifier for macro/geopolitical/economic topics | | |
| 3A.3 | UI components | 6h | ⬜ |
|      | EsotericLayer.tsx — main container with secular/esoteric toggle | | |
|      | FrameworkCards.tsx — 5 mini cards showing current values | | |
|      | CyclicalChart.tsx — SVG timeline (Barbault + K-wave overlay) | | |
|      | PowerIndex.tsx — Dalio bar chart | | |
|      | TurchinPanel.tsx — PSI metric cards | | |
|      | CrossCivilizational.tsx — esoteric-mode-only pattern cards | | |
|      | AstronomicalData.tsx — esoteric-mode-only planetary positions | | |
| 3A.4 | Guide/lexicon page + inline tooltips | 3h | ⬜ |
|      | /guide page with searchable, categorized term definitions | | |
|      | 18+ terms with plain-language explanations + real-world examples | | |
|      | Inline hover tooltips from guide data when terms appear in analysis | | |
|      | Dual labels: esoteric names ↔ secular names from same JSON | | |
| 3A.5 | Integration into ChatMessages + settings | 3h | ⬜ |
|      | Show EsotericLayer below responses when macro topics detected | | |
|      | User toggle in settings: on/off + mode preference | | |
|      | Esoteric store (Zustand) for mode state + cached analysis | | |
| 3A.6 | Polish + deploy | 3h | ⬜ |
|      | Chart animations on scroll-into-view | | |
|      | Mobile responsive | | |
|      | Deploy to VPS | | |

### 3B. Remaining God View features (Days 101–105)

| Step | Task | Est | Status |
|------|------|-----|--------|
| 3B.1 | Scenario Sandbox polish — test end-to-end with API credits | 2h | ⬜ |
| 3B.2 | Main chat "predict:" prefix → redirect to /sandbox | 1h | ⬜ |
| 3B.3 | Entity graph click → highlight across 3 scenario cards | 2h | ⬜ |

### 3C. Voice Integration Phase A (Days 106–110, ~10h)

| Step | Task | Est | Status |
|------|------|-----|--------|
| 3C.1 | Voice input — Web Speech API (Chrome/Edge), mic button next to input | 4h | ⬜ |
| 3C.2 | Voice output — SpeechSynthesis API, speaker icon per response | 4h | ⬜ |
| 3C.3 | Voice settings (speed, voice picker, auto-read toggle) | 2h | ⬜ |

### 3D. Canvas enhancements (Days 111–114, ~8h)

| Step | Task | Est | Status |
|------|------|-----|--------|
| 3D.1 | Query threading — lines showing conversation evolution | 3h | ⬜ |
| 3D.2 | Topic constellation — force-directed graph of extracted topics | 3h | ⬜ |
| 3D.3 | Cross-query connections — shared topics create visible links | 2h | ⬜ |

### 3E. Remaining items (Days 115–120)

| Step | Task | Est | Status |
|------|------|-----|--------|
| 3E.1 | Gnostic integration — wire esoteric layer into gnostic state | 2h | ⬜ |
| 3E.2 | Instinct Mode (holistic hermetic analysis) | 3h | ⬜ |
| 3E.3 | Esoteric Library app scaffold (port 3003, PDF reader) | 4h | ⬜ |
| 3E.4 | Deploy ALL Phase 3 features to VPS (akhai.app) | 2h | ⬜ |
| 3E.5 | VPS: add Twitter OAuth creds + confirm Reown domain | 30min | ⬜ manual |
| 3E.6 | Alpha tester expansion (10→20 users, family feedback) | ongoing | ⬜ |

---

## PHASE 4 — COMMUNITY + LAUNCH (Days 121–150)

| Step | Day | Task | Est |
|------|-----|------|-----|
| 4.1 | 101–120 | Content calendar, screenshots, demo videos | ongoing |
| 4.2 | Day 121 (May 6) | Social launch — X account active, first posts | 1d |
| 4.3 | 121–150 | Audience building, engagement campaigns | ongoing |
| 4.4 | Day 150 (Jun 4) | Website launch — akhai.app public, pricing live | 1d |
| 4.5 | Day 150 | Open-source release: core systems Apache 2.0 | 1d |
|     |           | github.com/algoq369/akhai | |

---

## COMPLETE REMAINING WORK ESTIMATE

| Block | Days | Hours | Status |
|-------|------|-------|--------|
| Esoteric Layer (3A) | 94–100 | 23h | ⬜ NEXT |
| God View polish (3B) | 101–105 | 5h | ⬜ |
| Voice Integration (3C) | 106–110 | 10h | ⬜ |
| Canvas enhancements (3D) | 111–114 | 8h | ⬜ |
| Remaining items (3E) | 115–120 | 12h | ⬜ |
| Community + Launch (4) | 121–150 | ongoing | ⬜ |
| **TOTAL remaining dev** | **94–120** | **~58h** | |

At ~3-4h/day dev time = 15-20 working days → fits within Days 94-120.

---

## INFRASTRUCTURE

| Component | Current | Notes |
|-----------|---------|-------|
| VPS | FlokiNET Iceland €10.99/mo | 1CPU, 1GB, 20GB NVMe |
| AI Provider | Claude Opus 4.6 + free fallback chain | Top up credits needed |
| Domain | akhai.app (Namecheap + Resend DNS) | |
| Reverse proxy | Caddy (auto-SSL) | |
| Process mgmt | PM2 | Full delete+start for env changes |
| Deploy | rsync via quick-deploy.sh | Exclude .env.local |
| Auth | Email + GitHub + X/Twitter + Web3 Wallet | Twitter needs VPS env vars |
| Analytics | PostHog EU | |
| Payments | USDT ERC20 | + BTC, XMR planned |

## PRICING (v3)

| Tier | Price | Tokens/day |
|------|-------|------------|
| Free | $0 | 50K |
| Pro | $20/mo | 1M |
| Legend | $200/mo | Unlimited |

Break-even: Week 16 post-launch.

## POST-LAUNCH HORIZON

- Sovereign hardware: DGX Spark ($3,999) → dual-RTX 4090 → Hetzner GEX131
- Sovereign models: Qwen 2.5-72B → full migration Q1 2027
- Sovereign terminal + phone/computer hardware
- Robotics integration
- G&BV partnership (20% APY, 1-year lock, $200K–500K seed)
- Voice Phase B: Deepgram Nova-3 STT + OpenAI TTS-1
- Voice Phase C: self-hosted Whisper V3 + Qwen3-TTS

## WEBNA IRON RULES

1. Every file under 500 lines
2. Commit after every working change
3. Never deploy without green gates (57/57 Vitest + clean tsc + passing build)
4. No fabricated method names
5. Surgical edits only
