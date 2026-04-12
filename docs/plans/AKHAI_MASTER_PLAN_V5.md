# ◊ AKHAI — Master Plan V5.2
## Day 96/150 — April 12, 2026 — 53 days to launch

**470 commits | 57/57 tests green | Launch: June 4, 2026**

---

## TIMELINE OVERVIEW

| Phase | Days | Focus | Status |
|-------|------|-------|--------|
| 1. Visual Sovereignty | 1–70 | UI, Canvas, Mindmap, Depth Annotations | ✅ COMPLETE |
| 2. Validation + Polish | 71–93 | Mini Canvas, Council, God View, metadata | ✅ COMPLETE |
| 3. AGI Activation | 94–120 | Esoteric Layer, Constellation, Temple, North Node | 🔵 IN PROGRESS |
| 4. Community + Launch | 121–150 | Social, audience building, website launch | ⬜ QUEUED |

---

## PHASE 1 — COMPLETE (Days 1–70)
All core systems built: 7 methodologies, Grounding Guard, Side Canal, 11 AI layers,
SSE pipeline, Canvas, Mindmap, History, Grimoire, Auth (Email/GitHub/X/Web3),
PostHog EU, 5-model fallback chain, Finance/News tickers, Deploy pipeline.

## PHASE 2 — COMPLETE (Days 71–93)
Mini Canvas (18 commits), Perspective Council (5 agents live), God View Phase 1,
Depth annotations, Scenario Sandbox (Parts 1+2), PipelineHistoryPanel, Canvas crash fix,
Bottom input compaction, Hydration fix, API credit error handling.


## PHASE 3 — IN PROGRESS (Days 94–120)

### ✅ Esoteric Layer — Macro-Cyclical Analysis (10 commits)
- ✅ Data layer: 8 JSON files, 41KB (Barbault, Turchin, K-wave, Dalio, Strauss-Howe, cross-civ, lexicon, convergence)
- ✅ Engine + API: cycle-engine.ts, cross-civilizational.ts, /api/esoteric/analyze
- ✅ UI: 7 components (FrameworkCards, Convergence, CyclicalChart, PowerIndex, Turchin, CrossCiv, Astronomical)
- ✅ Guide: /guide page (22 terms), EsotericTooltip hover popovers
- ✅ Integration: EsotericInline in ChatMessages, ◊ macro toggle, sandbox→mindmap predict tab
- ✅ Query input: interactive constellation analysis engine, instant static data loading

### ✅ Constellation — 3-Tab Dashboard (6 commits)
- ✅ Tab layout: ◈ Macro | ◇ Micro | ◊ Synthesis
- ✅ Macro: 5 framework cards + Barbault chart + query-driven AI synthesis
- ✅ Micro: birth data input + natal chart SVG + North Node analysis + nodal chat (Opus 4.6)
- ✅ Synthesis: personal × macro AI analysis + framework resonance grid
- ✅ City geocoding: Nominatim proxy via /api/geocode (67 built-in + global search)
- ✅ Birth year: dynamic through current year

### ✅ Mystic Temple — 3-Room Knowledge Sanctuary (4 commits)
- ✅ /temple page: 3 rooms (Thesis / Constellation / Museum)
- ✅ Thesis Room: 5-station journey (Question → Path → Evidence → Cosmic Moment → Call)
- ✅ Museum Room: 24 school exhibits + 4 convergence tables (33 cross-traditional entries)
- ✅ AKH 313 data: akh313.json with schools, families, convergence, cosmic cycles, sovereignty pillars

### ✅ Philosophy Page Rewrite (1 commit)
- ✅ 'STRUCTURAL CONVERGENCE' replaces 'THE GNOSTIC FOUNDATION'
- ✅ Kant→Bridge→Breakthrough intellectual spine
- ✅ Removed QliphothicVsSephirothicSection + GolemProtocolSection
- ✅ Links to /temple and /constellation

### ✅ Navigation + Deploy
- ✅ Temple in nav, constellation removed (accessible via temple)
- ✅ Deployed to VPS (akhai.app) — all pages 200


### ⬜ Remaining Phase 3 Work

| Step | Task | Est | Status |
|------|------|-----|--------|
| 3.1 | Hebrew removal — remaining files (whitepaper, OriginTerm, ConversationCards) | 2h | ⬜ NEXT |
| 3.2 | Deploy latest nav fix to VPS | 5min | ⬜ |
| 3.3 | Top up Anthropic API credits | Manual | ⬜ |
| 3.4 | Voice Integration Phase A — Browser Speech API input/output | 10h | ⬜ |
| 3.5 | Canvas enhancements — query threading, topic constellation | 8h | ⬜ |
| 3.6 | Gnostic integration + Instinct Mode | 5h | ⬜ |
| 3.7 | Esoteric Library scaffold (port 3003, PDF reader) | 4h | ⬜ |
| 3.8 | VPS: Twitter OAuth creds + Reown domain | 30min | ⬜ manual |

---

## PHASE 4 — COMMUNITY + LAUNCH (Days 121–150)

| Step | Day | Task |
|------|-----|------|
| 4.1 | 101–120 | Content calendar, screenshots, demo videos |
| 4.2 | Day 121 (May 6) | Social launch — X account active |
| 4.3 | 121–150 | Audience building |
| 4.4 | Day 150 (Jun 4) | Website launch — akhai.app public |
| 4.5 | Day 150 | Open-source release Apache 2.0 |

---

## REMAINING WORK ESTIMATE

| Block | Hours | Status |
|-------|-------|--------|
| Hebrew removal | 2h | ⬜ NEXT |
| Voice Integration | 10h | ⬜ |
| Canvas enhancements | 8h | ⬜ |
| Gnostic + Instinct Mode | 5h | ⬜ |
| Esoteric Library | 4h | ⬜ |
| Deploy + VPS config | 1h | ⬜ |
| **TOTAL remaining** | **~30h** | |

At ~3-4h/day = 8-10 working days → fits within Days 96-110.


---

## INFRASTRUCTURE

| Component | Current |
|-----------|---------|
| VPS | FlokiNET Iceland €10.99/mo (1CPU, 1GB, 20GB NVMe) |
| AI Provider | Claude Opus 4.6 (primary) + free fallback chain |
| Domain | akhai.app (Namecheap + Resend DNS) |
| Reverse proxy | Caddy (auto-SSL) |
| Process mgmt | PM2 (full delete+start for env changes) |
| Deploy | rsync via ~/akhai/deploy/quick-deploy.sh |
| Auth | Email + GitHub + X/Twitter + Web3 Wallet |
| Analytics | PostHog EU |

## WEBNA IRON RULES
1. Every file under 500 lines
2. Commit after every working change
3. Never deploy without green gates (57/57 Vitest + clean tsc + passing build)
4. No fabricated method names
5. Surgical edits only
