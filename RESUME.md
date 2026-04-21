# AkhAI — RESUME.md
> Session continuity file. Read this FIRST when resuming work.
> Last updated: 2026-04-19 15:20 UTC (Day 100/150 — end of day)

## PROJECT STATE
- **Day 100/150** | Launch: June 4, 2026 (**46 days**) | **~90% features complete**
- **Commits:** 566 total | 28 shipped today | All pushed to `origin/main` + deployed to `akhai.app`
- **Repo:** `/Users/sheirraza/akhai` | GitHub: `algoq369/akhai`
- **VPS:** `akhai@82.221.101.3` (FlokiNET Iceland) | **akhai.app** live + healthy (uptime reset today on deploy)
- **Provider:** Claude Opus 4.7 primary | Opus 4.6 for extended thinking | Haiku 4.5 enrichment | OpenRouter Llama 3.3 70B free fallback
- **Standards:** WEBNA — 5 iron rules enforced every session
- **Master Plan:** `docs/plans/AKHAI_MASTER_PLAN_V5.md` (V5.5 — just updated)

## TODAY'S WORK (Day 100 — 28 commits across 6 sub-sessions)

### Morning: LLM-powered depth annotations (6 commits)
`81dbc82`, `8cb0f8c`, `18a3d3d`, `d9c5c46`, `491da0b`, `9133a85`
23 annotations/query, Haiku→Sonnet chain, SQLite cache, sigils 14px

### Evening: Cognitive signature system (6 commits)
`2b8960e`, `be8e407`, `e650dbb`, `203f9dc`, `59ddb4e`, `c394b78`
12 lenses (7 Yechidah + 5 Hermetic), InlineDialogue + Zone 1/2 right panel

### Night: Extended thinking D+C (6 commits)
`deb1a84`, `47062c7`, `5120d5b`, `30bbe4d`, `a0f5f80`, `7dce3d5`
ExtendedThinkingOrb toggle + raw thinking streams → Haiku restructures to lenses

### Live streaming fix + chatId (6 commits)
`da4ce47`, `bae2681`, `be3588e`, `b6f3a86`, `b2822ca`, `fcbc6d7`
Real SSE streaming (was fake post-hoc chunking), Opus 4.6 for enabled thinking

### Tree of Life refinement (5 commits)
`3d29334`, `5a4afe8`, `b4fe051`, `8fa8720`, `c2f55e0`
Balanced spacing, readable fonts, fits viewport without scroll

### Canvas cleanup + backend fix (4 commits — current session)
`26b264c`, `2122157`, `e0499eb`, `5de8d28`
Row-wrap layout, empty state, stop-word filter, canvas-viz HTTP 200 (was 500)


## VPS STATUS (post-deploy Apr 19)
- ✅ akhai.app HTTP 200, uptime 96s post-restart, all 13 commits live
- ✅ DB connected (18 queries on fresh VPS DB), migrations fired: `cognitive_signature`, `cognitive_signature_version`, `raw_thinking`
- ✅ Canvas-viz live test: 5/5 viz types HTTP 200 (diagram 5.4s, chart 3s, table 3.9s, timeline 3.7s, radar 3s)
- ✅ Extended thinking endpoint ready (verified on localhost, untested on VPS visual)
- ⚠️ Historical log: `credit balance too low` error in PM2 — top up Anthropic before launch traffic
- ⚠️ Sentry warnings: missing `onRouterTransitionStart` + `onRequestError` hooks in instrumentation

## TOP PRIORITY FOR NEXT SESSION (P0 tasks)

1. **Rotate API keys before anyone reads session logs** — Anthropic, OpenRouter, Resend, Groq, Google, Reown, PostHog. All have been in context across multiple sessions. ~45min.
2. **Visual QA on akhai.app** — Hard-refresh, toggle Extended Thinking orb with real authenticated query, confirm live streaming renders + lens restructure after. ~20min.
3. **Check Anthropic credit balance** — Historical 400 in logs is a warning. Top up. ~10min.
4. **Test Canvas mode on VPS with authenticated history** — Verify row-wrap + auto-fit + empty state with real queries. ~20min.
5. **Opus 4.7 adaptive thinking exploration** — Currently downgraded to 4.6. Try `{type:'adaptive', display:'summarized', effort:'high'}` path. ~2h.

## KEY COMMANDS (operational)

```bash
# Local dev restart (after env changes or Next.js cache issues)
lsof -ti:3000 | xargs kill -9; sleep 2
cd /Users/sheirraza/akhai/packages/web
rm -rf .next .turbo && npm run predev
# Note: explicit `set -a && source .env.local && set +a` is a safety net for Next.js 15.5 + Turbopack
# which sometimes logs "Environments: .env.local" but doesn't propagate the values to server routes.
nohup bash -c 'cd /Users/sheirraza/akhai/packages/web && set -a && source .env.local && set +a && SKIP_ENV_VALIDATION=1 npx next dev --turbopack -p 3000' > /tmp/akhai-dev.log 2>&1 &

# Deploy to VPS
cd ~/akhai && git push origin main && bash deploy/quick-deploy.sh

# SSH VPS
ssh akhai@82.221.101.3

# VPS PM2 logs
ssh akhai@82.221.101.3 'pm2 logs akhai --lines 50 --nostream'

# Check canvas-viz live on VPS
curl -X POST https://akhai.app/api/canvas-viz -H 'Content-Type: application/json' \
  -d '{"query":"test","response":"test content","type":"diagram"}'

# Reset depth annotation cache (if stale schema)
sqlite3 /Users/sheirraza/akhai/packages/web/data/akhai.db \
  "UPDATE queries SET annotations=NULL, annotations_version=0 WHERE LENGTH(annotations) < 500"
```


## KEY LEARNINGS (Day 100)

1. **Live streaming ≠ fake streaming** — Earlier commit buffered the whole Opus response, then sliced rawThinking into 120-char chunks and emitted them post-hoc. Looked live client-side, but was actually the opposite. Real fix: `stream: true` on Anthropic request body + `onThinkingDelta` callback parsing SSE `content_block_delta` events with `delta.type === 'thinking_delta'` in real-time.

2. **Opus 4.7 API breaking changes** — Per Anthropic docs (verified via web_search):
   - `type: "enabled"` with `budget_tokens` now returns 400
   - `type: "adaptive"` is the only supported thinking mode
   - `display` defaults to `"omitted"` on 4.7 (was `"summarized"` elsewhere) — must set explicitly to see thinking
   - `temperature`, `top_p`, `top_k` ALL rejected with 400
   - We downgraded to 4.6 for enabled thinking; 4.7 adaptive streaming path is untested

3. **Fallback chains need room to write** — canvas-viz was returning 500 because `maxTokens: 300` (primary) and `500` (OpenRouter fallback) both truncated JSON mid-structure. Opus produces clean JSON at 1500 tokens; OpenRouter Llama needs 1500+ too.

4. **SSE infrastructure was correct, only the upstream was buffered** — Client `EventSource` subscription, filter, state plumbing, inline render — all built right. Bug was one layer upstream in `callAnthropic`. When auditing "it doesn't work", trace from the wire (server → SSE → client) rather than from UI backwards.

5. **Tree of Life spacing is math, not vibes** — Each label stack extends radius+52 below node center. Next row's halo starts at center - radius - 16. Minimum safe row gap for same-column pairs: label_end + halo_clearance = 52 + 41 = 93 units. All row gaps must be > 93, with extra margin for high-activation halos.

6. **chatId plumbing gap cost Zone 2 caching** — `activeChatId` existed in `useHomePageState` but was never forwarded through `overlaysProps` to `CognitivePanel`. Zone 2 synthesis couldn't cache by chat. Silent bug — nothing errored. Surfaced only through this session's audit.

7. **Next.js hot-reloads API routes but not always deterministically** — `5de8d28` commit hot-loaded on the running dev server without restart. Trust but verify via `curl` before claiming the fix works.


## FILES THAT NEED WEBNA CLEANUP (>500 line cap)
- `components/canvas/useCanvasState.ts` (591) — split into useCanvasLayout + useCanvasInteraction
- `components/canvas/CanvasNodeContent.tsx` (538) — split by node type (query/topic/viz)
- `app/api/simple-query/route.ts` (649) — extract SSE emitter + methodology dispatch
- `components/LayerTreeFull.tsx` (~475) — prettier bloat from commit 3d29334, logic is fine

## ARCHITECTURE FILES (frequently edited, treat carefully)
- `packages/web/app/page.tsx` (~222 lines) — fragile, `grep -n` before any edit
- `packages/web/lib/multi-provider-api.ts` (531 lines) — streaming Anthropic logic
- `packages/web/lib/cognitive/llm-extractor.ts` (239) — Haiku chain for lens signatures
- `packages/web/lib/cognitive/prompts.ts` (138) — 12 lens definitions + prompt builders
- `packages/web/components/cognitive/InlineDialogue.tsx` (116) — orchestrator, not the renderer
- `packages/web/components/cognitive/RawThinkingView.tsx` (89) — live cursor + auto-scroll
- `packages/web/components/cognitive/LensView.tsx` (101) — structured 12-lens render
- `packages/web/components/cognitive/CognitivePanel.tsx` (122) — Zone 1 + Zone 2 wrapper
- `packages/web/components/LayerTreeFull.tsx` + `.constants.ts` — tree positions/viewBox

## DATABASE SCHEMA (SQLite at `packages/web/data/akhai.db`, 1107+ local / 18 on fresh VPS)

```sql
CREATE TABLE queries (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  flow TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  result TEXT,
  tokens_used INTEGER DEFAULT 0,
  cost REAL DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  completed_at INTEGER,
  user_id TEXT,
  session_id TEXT,
  chat_id TEXT,
  gnostic_metadata TEXT,
  annotations TEXT DEFAULT NULL,
  annotations_version INTEGER DEFAULT 0,
  cognitive_signature TEXT DEFAULT NULL,
  cognitive_signature_version INTEGER DEFAULT 0,
  raw_thinking TEXT DEFAULT NULL
);

CREATE TABLE conversation_syntheses (
  chat_id TEXT PRIMARY KEY,
  synthesis TEXT NOT NULL,
  exchanges_hash TEXT NOT NULL,
  version INTEGER DEFAULT 0,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

Migrations are idempotent + fire at server startup (startup log shows `✅ Added X column to queries table`). If a migration doesn't fire, the dev server was running before the code change — must restart.

---

**Last commit on main:** `5de8d28` fix(canvas-viz): remove temperature for Opus 4.7 + bump maxTokens 300→1500 + salvage parser for truncated JSON

**Next session, start by:** reading this file fully, then `docs/FINAL_AUDIT_CHECKLIST.md` and pick the next `[ ]` item from Section 1. Master Plan V5.5 at `docs/plans/AKHAI_MASTER_PLAN_V5.md` is strategic; audit doc is tactical.

---

## THE FINAL AUDIT PATH (46 days to launch)

**Source of truth:** `docs/FINAL_AUDIT_CHECKLIST.md` (12 sections, week-by-week execution plan).

**Week-by-week:**
- Days 101-107: Core chat + AI pipeline + critical APIs (Sections 1, 2, 5)
- Days 108-114: Content + configuration + interactions (Sections 3, 4, 6)
- Days 115-121: Responsive, perf, security + social launch (Sections 7, 8, 9)
- Days 122-128: Debt cleanup + SEO/PWA (Sections 10, 11)
- Days 129-135: Beta round 1
- Days 136-142: Beta round 2
- Days 143-148: Launch assets + monitoring + final security
- Day 149: Dry-run + rollback drill
- **Day 150 (June 4): PUBLIC LAUNCH**

**Definition of done:** Every MUST-DO item marked `[x]`, 80%+ of SHOULD-DO items `[x]`, all `[FAIL]` entries have commit hashes or explicit backlog notation.
