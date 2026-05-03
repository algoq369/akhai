# ◊ AKHAI — Master Plan V5.5
## Day 100/150 — April 19, 2026 — 46 days to launch

**566 commits | Launch: June 4, 2026**

---

## SESSION RECAP — Day 100 (30 commits across 3 sub-sessions)

### ✅ SUB-SESSION 1 (morning) — LLM-powered Depth Annotations (6 commits)
- **81dbc82** — Fix brittle `para.includes(term)` pre-filter dropping annotations after markdown strip
- **8cb0f8c** — DB migration: `annotations TEXT` + `annotations_version INTEGER` columns
- **18a3d3d** — New `lib/depth/llm-extractor.ts` (104 LOC) + `prompts.ts` (49 LOC) — Haiku 4.5 → Sonnet 4.6 chain, lazy env reads
- **d9c5c46** — New `/api/depth-extract` endpoint (93 LOC) with SQLite cache + fallback chain, always 200
- **491da0b** — `useHomePageEffects` fetches `/api/depth-extract`, replaces local regex, 2-3s natural buffer
- **9133a85** — max_tokens 2000→4096, timeout 25s→40s, JSON salvage parser, sigil 10px→14px

**Result:** 23 annotations/query (vs 6 from regex), $0.0005/query blended cost, 388ms cache hit, 7 of 11 layers used dynamically


### ✅ SUB-SESSION 2 (evening) — Cognitive Signature System (6 commits)
- **2b8960e** — DB migration: `cognitive_signature` + `cognitive_signature_version` columns + `conversation_syntheses` table
- **be8e407** — 12-lens definitions (7 Yechidah: Mirror ✦, Word Alchemy ⟡, Method Oracle ◎, User Gnosis ☍, Concept Weaver ⊛, Experiment ⚗, Evolution ♾ + 5 Hermetic: Mentalism ☿, Polarity ⚖, Rhythm ⟲, Cause-Effect ⟶, Correspondence ∿) + exchange/synthesis/restructure prompt builders
- **e650dbb** — `/api/cognitive-signature` + `/api/conversation-synthesis` endpoints, Haiku→Sonnet chain, salvage parser
- **203f9dc** — `InlineDialogue` component — 3-line preview, click to expand, indigo left bar
- **59ddb4e** — `MetadataMirror` (Zone 1) + `ConversationSynthesis` (Zone 2) + `CognitivePanel` wrapper; `PipelineHistoryPanel` refactored 623 → 467 lines
- **c394b78** — Removed dead `METHODOLOGY_PROSE`/`LAYER_PROSE` templates, `reasoning-narrator.ts` 487 → 132 lines

**Result:** 7 lens entries per query, 2730 chars cached signature, 328ms cache hit, zero forbidden patterns (no %, no layer/methodology names, no guard scores in prose output)

### ✅ SUB-SESSION 3 (night) — Live Extended Thinking D+C (6 commits)
- **deb1a84** — `ExtendedThinkingOrb` inline with methodology selector, per-session Zustand toggle
- **47062c7** — `callAnthropic` thinking block extraction + `raw_thinking` DB column + SSE chunked emission
- **5120d5b** — Client SSE interception in `useQueryHandlers` — `messageRawThinking` state, plumbed through prop bundle
- **30bbe4d** — InlineDialogue split into 3 components: orchestrator (116 LOC) + `RawThinkingView` (89 LOC, live cursor) + `LensView` (101 LOC), 200ms cross-fade toggle
- **a0f5f80** — Haiku restructure pass: `buildRestructurePrompt` derives lens entries from actual Opus thinking passages
- **7dce3d5** — RESUME.md logged

**Result:** live streaming works — 3 thinking deltas over 0.76s progressive (not post-hoc burst), 295 chars raw thinking persisted, Opus 4.7 → 4.6 downgrade for enabled-thinking path (per docs)


### ✅ SUB-SESSION 4 (Day 100 continuation) — Live Streaming Fix + chatId Wiring (6 commits)
- **da4ce47** — Streaming mode: `callAnthropic` with `onThinkingDelta` callback + ReadableStream SSE parser. Replaces plain `response.json()` buffered path.
- **bae2681** — `/api/simple-query` emits `extended_thinking` SSE events live per delta. Removed post-hoc 120-char CHUNK_SIZE loop.
- **be3588e** — Model override to `claude-opus-4-6` for `type:'enabled'` thinking (4.7 only supports `type:'adaptive'` per Anthropic docs — confirmed via web search)
- **b6f3a86** — Confirmation: Opus 4.7 adaptive streaming untested path, keep 4.6 enabled path as default
- **b2822ca** — "Think thoroughly" directive prepended to system prompt when extendedThinking enabled
- **fcbc6d7** — `chatId` plumbed from `activeChatId` state through `overlaysProps` bundle to `CognitivePanel` (Zone 2 synthesis caching was broken without it)

**Result:** thinking streams arrive PROGRESSIVELY during Opus generation (not after), matches Claude Code / DeepSeek R1 feel

### ✅ SUB-SESSION 5 (Tree of Life refinement) — 5 commits
- **3d29334** — Shrink viewBox to tightly bound nodes (tree +47% wider, +16% taller in same container)
- **5a4afe8** — Respace rows 110 units apart + grow container 31% to resolve label overlaps
- **b4fe051** — Widen side columns 50px outward + tighten rows + reduce container 15-18%
- **8fa8720** — Expand viewBox margins (prevents Meta-Core halo top-clip and Embedding label bottom-clip)
- **c2f55e0** — Compress vertical: 90-unit row gaps + smaller viewBox + h-[500px] container

**Result:** tree fits viewport without scroll, all labels clear of halos, mathematically verified clearances

### ✅ SUB-SESSION 6 (Canvas cleanup + backend fix) — 4 commits
- **26b264c** — Row-wrap layout (3 queries per row), deterministic topic placement (no more Math.random jitter), auto-fit-to-view on initial load, cross-query edges capped at 5 (was O(n²))
- **2122157** — Empty state ("Send a query..."), smarter mini-chat bottom-right default position, full-area loading indicator
- **e0499eb** — Stop-word filter (28 common words) + punctuation strip for topic extraction
- **5de8d28** — `/api/canvas-viz` fix: remove `temperature: 0` (Opus 4.7 rejects), bump maxTokens 300→1500, add JSON salvage parser with brace/bracket rebalancing

**Result:** Canvas HTTP 200 rate 0% → 100%. All 5 viz types (diagram, chart, table, timeline, radar) return structured JSON on VPS in 3-5s.


---

## CUMULATIVE DAY 100 DELIVERABLES (28 commits shipped to akhai.app)

### AI / Intelligence Layer
| System | Status | Notes |
|---|---|---|
| **Live Extended Thinking (D+C)** | ✅ DEPLOYED | Opus 4.6 enabled thinking streams live via SSE, Haiku restructures into 12 lenses post-completion |
| **12-Lens Cognitive Signature** | ✅ DEPLOYED | 7 Yechidah + 5 Hermetic, inline dialogue + Zone 1 mirror + Zone 2 synthesis |
| **LLM Depth Annotations** | ✅ DEPLOYED | 23 per query, Haiku→Sonnet chain, SQLite cache, 14px sigils |
| **ExtendedThinkingOrb** | ✅ DEPLOYED | Per-session toggle inline with methodology selector |
| **Conversation Synthesis** | ✅ DEPLOYED | Chapter-structured, chatId-cached, click-to-scroll into Zone 1 |

### Canvas Mode
| System | Status | Notes |
|---|---|---|
| **Row-wrap layout** | ✅ DEPLOYED | 3 queries per row, auto-fit on load, deterministic topic placement |
| **Empty state UX** | ✅ DEPLOYED | "Send a query..." prompt when no history, bottom-right mini-chat |
| **Stop-word filter** | ✅ DEPLOYED | 28 common words excluded from topic extraction |
| **Canvas-viz API** | ✅ DEPLOYED | 100% HTTP 200 rate (was 0%), all 5 viz types working |

### Tree of Life
| System | Status | Notes |
|---|---|---|
| **Balanced spacing** | ✅ DEPLOYED | Side columns wide, rows 90 apart, Executor→Embedding 120 gap |
| **Readable fonts** | ✅ DEPLOYED | Name 14px, role 11px, activation 12px at compact scale |
| **No clipping** | ✅ DEPLOYED | Meta-Core halo + Embedding labels fit viewBox with margin |
| **Container h-[500px]** | ✅ DEPLOYED | Fits viewport without scroll on typical chat layouts |

---

## ARCHITECTURE SNAPSHOT (566 commits)

| Layer | Components | Status |
|-------|-----------|--------|
| **AI Engine** | Claude Opus 4.7 primary, Opus 4.6 for extended thinking, Haiku 4.5 enrichment, OpenRouter Llama 3.3 70B fallback | ✅ |
| **8 Methodologies** | direct, sc, cod, tot, react, pas, aot, step-back | ✅ |
| **Extended Thinking D+C** | Opus streams live + Haiku restructures to 12 lenses | ✅ |
| **Cognitive Signature** | Inline dialogue + Zone 1 MetadataMirror + Zone 2 ConversationSynthesis | ✅ |
| **Classic View** | ResponseRenderer + 11 layers + dual-label + tables | ✅ |
| **Depth Annotations** | LLM-powered (Haiku), SQLite cache, 14px sigils | ✅ |
| **Macro-Cyclical** | Click-triggered, /api/esoteric/analyze, 5 frameworks | ✅ |
| **Council** | 5-agent perspective analysis, synthesis, $0.013/call | ✅ |
| **Canvas** | Row-wrap layout, viz API (diagram/chart/table/timeline/radar), empty state | ✅ |
| **Constellation** | 3-tab: Macro/Micro/Synthesis, Barbault chart, natal | ✅ |
| **Temple** | 3 rooms: Thesis/Constellation/Museum | ✅ |
| **Tree of Life** | Balanced layout, readable fonts, h-[500px] | ✅ |
| **Auth** | Email, GitHub, Wallet, Twitter (needs creds) | 90% |
| **Infra** | FlokiNET Iceland, Caddy SSL, PM2, deploy script | ✅ |


---

## UPCOMING TASKS — PRIORITY ORDER (Days 101-150)

### 🔴 P0 — IMMEDIATE (Day 101-103, this week)

1. **[SECURITY] Rotate all exposed API keys** — Keys have been in session contexts across Day 99-100 (Anthropic, OpenRouter, Resend, Groq, Google, Reown, PostHog). Must rotate on provider dashboards + update both `.env.local` (local) and VPS `.env.local`. ~45min.

2. **[BUG] Reduce visual spaghetti in Canvas cross-query edges** — Verify on VPS with real query history that the cap-to-5 ranking works. If 5 is still too busy for 10+ query canvases, drop to 3 and require 3+ shared topics. ~30min.

3. **[BUG] Verify Canvas visual on production** — With authenticated user + real queries, confirm row-wrap layout + auto-fit + empty state render correctly. Current test only covered unauth empty state. ~20min.

4. **[BUG] Anthropic credit balance check** — Historical 400 error in VPS PM2 logs (`Synthesizer failed: credit balance is too low`). Current calls work but balance is a leading indicator. Top up + set up auto-billing before launch spike. ~15min.

5. **[OPTIMIZATION] Opus 4.7 adaptive thinking path** — We currently use Opus 4.6 for `enabled` thinking. Anthropic docs say 4.7 supports `{type:'adaptive', display:'summarized', effort:'high'}`. Test the 4.7 adaptive streaming path; if it works, migrate. ~2h.

### 🟠 P1 — THIS WEEK (Days 104-110)

6. **[DEBT] DDG search fix** — Pre-session debt, known broken. ~1h.

7. **[DEBT] History API dict-vs-list bug** — Endpoint returns inconsistent shape, breaks history page in some cases. ~1h.

8. **[DEBT] File size cleanup** — Files over WEBNA 500-line cap:
   - `useCanvasState.ts` (591) 
   - `content-classifier.ts` 
   - `CanvasNodeContent.tsx` (538)
   - `simple-query/route.ts` (649)
   - `LayerTreeFull.tsx` (~475 after prettier bloat)
   ~3h total.

9. **[FEATURE] Esoteric Library scaffold** — Standalone browsable library of civilizational patterns, historical cycles, cross-tradition analysis. Data files exist, UI doesn't. ~4h.

10. **[UX] Depth annotation expand query wire-up** — Clicking a sigil currently opens tooltip; should also be able to trigger a follow-up query with the annotation as seed. ~2h.

11. **[FEATURE] Sonnet 4.6 `claude-sonnet-4-20250514` model string debt** — 11 call sites still reference old string, may be deprecated. Audit + update. ~1h.


### 🟡 P2 — PRE-LAUNCH POLISH (Days 111-120)

12. **[AUTH] Twitter OAuth activation** — Routes exist, need `TWITTER_CLIENT_ID` + `TWITTER_CLIENT_SECRET` added to VPS `.env.local`. ~30min.

13. **[AUTH] Reown (WalletConnect) domain allow-list** — Confirm `akhai.app` is on the allow-list in Reown dashboard for project ID `87e52e87cec98e1956c14088e16e232d`. ~15min.

14. **[MARKETING] Landing page polish** — Hero, pricing tiers, feature grid, testimonial slots, CTA buttons. Current state: functional but not conversion-optimized. ~4h.

15. **[SEO] Metadata pass** — OpenGraph tags, Twitter Card, meta descriptions, sitemap.xml, robots.txt. ~2h.

16. **[SEO] Structured data** — JSON-LD for Organization, WebApplication, SoftwareApplication schemas. ~1h.

17. **[PWA] Manifest + service worker basics** — Offline fallback page, installable icon, theme colors. ~2h.

18. **[INFRA] Sentry onRouterTransitionStart hook** — Deploy log warned about missing hook in `instrumentation-client.ts`. Add `export const onRouterTransitionStart = Sentry.captureRouterTransitionStart`. ~15min.

19. **[INFRA] Sentry onRequestError hook** — Same file, add `Sentry.captureRequestError` per outdated config warning. ~15min.

20. **[PERF] Reduce First Load JS** — Currently 886KB on `/`, 431KB on `/constellation`. Audit heavy client imports, code-split aggressively. ~3h.

21. **[PERF] Webpack cache big-string warnings** — `PackFileCacheStrategy` warning about 180kiB + 139kiB strings. Use Buffer encoding where triggered. ~1h.

22. **[UX] Visual verification pass on all routes** — 36 pages, hard-refresh every one, document any visual regressions. Tracked in `docs/QA_PRE_LAUNCH.md` (new file). ~3h.

23. **[TESTING] E2E test suite on critical paths** — Playwright or similar: signup → first query → canvas → extended thinking → history. Currently zero E2E. ~6h.

24. **[DOCS] User-facing docs** — Guide page exists but content is placeholder. Write: "What is AkhAI", "How Extended Thinking works", "Canvas mode", "Your signature". ~4h.


### 🟢 P3 — LAUNCH SEQUENCE (Days 121-150)

25. **Day 121 (May 6) — Social launch**
    - X account live + bio + pinned post
    - First product walkthrough thread
    - Begin audience-building (Days 121-150 = 30 days of posts)

26. **Day 125** — Blog post: "Why AkhAI thinks in Sefirot" (founder narrative)

27. **Day 130** — Beta testers round 1 (20 people, feedback form, session recordings)

28. **Day 135** — Beta round 2 fixes deployed, round 3 opens (50 people)

29. **Day 140** — Performance audit pass, Lighthouse score check, load test VPS at 10× normal traffic

30. **Day 145** — Final copy freeze, screenshots for landing, press kit assembled

31. **Day 148** — Final security review: auth flows, input validation, rate limits, CSRF, XSS

32. **Day 150 (June 4) — PUBLIC LAUNCH**
    - akhai.app opens to public
    - Apache 2.0 code release (Guard, Sefirot, Side Canal, Visual Engine)
    - Launch post on X + Product Hunt
    - Monitoring dashboards active

---

## POST-LAUNCH ROADMAP (Days 151+)

### Sovereignty Transition (14 months, Q3 2026 → Q1 2027)
- Week 1-4: Vercel AI SDK abstraction layer (model-agnostic)
- Week 5-12: Qwen 2.5-72B evaluation + primary migration path
- Week 13-26: Hetzner GEX131 €889/mo + dual-RTX 4090 local fleet €8,500
- Target: 80% inference on sovereign infra by Q1 2027

### Hardware Path
- Phone: Pixel + GrapheneOS as daily driver
- Computer: migration from MacBook to Framework 16 with Linux
- GPU: DGX Spark ($3,999) + dual RTX 4090 local inference

### Terminal Integration
- Claude Opus 4.7 via Claude Code CLI for agentic coding
- AkhAI tech stack wired into terminal for sovereign knowledge work

### Monetization (Tiers v3)
- Free: 50K tokens/day
- Pro $20/mo: 1M tokens/day
- Legend $200/mo: unlimited
- Break-even target: Week 16 post-launch

### G&BV Partnership (post-fundraise)
- 20% APY, 1-year lock
- Allocate seed capital $200K-500K for runway extension
- Not revenue share — sovereign treasury instrument

---

## INFRASTRUCTURE

- **VPS:** FlokiNET Iceland €10.99/mo | 1 CPU, 1GB RAM, 20GB NVMe
- **Domain:** akhai.app | SSL: Caddy auto-renewal
- **Deploy:** `~/akhai/deploy/quick-deploy.sh` (rsync + PM2)
- **AI Stack:** 
  - Claude Opus 4.7 (primary)
  - Claude Opus 4.6 (extended thinking path)
  - Claude Haiku 4.5 (depth + cognitive enrichment, ~$0.0005/call)
  - Claude Sonnet 4.6 (fallback on Haiku overflow)
  - OpenRouter Llama 3.3 70B (free-tier fallback)
- **DB:** SQLite via better-sqlite3 (1107+ queries local, 18 on fresh VPS)
- **Memory:** Cognee (conversational), Qdrant + BM25 (retrieval), Neo4j (graph)
- **Payments:** x402 (crypto-native), Stripe (fiat disabled for now)
- **Monitoring:** PostHog EU, Sentry DE, Pino logging, `/api/health`
- **Auth:** Email (Resend), GitHub OAuth, Reown AppKit (wallets), Twitter (pending creds)

## FINANCIAL MODEL

| Item | Per-query cost |
|---|---|
| Opus 4.7 baseline response | ~$0.005-0.010 |
| + Haiku cognitive signature | +$0.0005 |
| + Haiku depth annotations | +$0.0005 |
| + Extended thinking (Opus 4.6 + Haiku restructure) | +$0.010-0.025 |
| Conversation synthesis (chapter rewrite) | +$0.001-0.003 |
| **Total max per query** | **~$0.030** |

At launch-scale projections: 1K queries/day × $0.015 avg = $15/day = $450/month AI spend at break-even target.

---

**Standards:** WEBNA — 5 iron rules (file size ≤500, commit per change, no fabricated names, surgical edits, green gates before deploy). Enforced every session.

**Next handoff file:** `RESUME.md` (read FIRST when resuming work).
