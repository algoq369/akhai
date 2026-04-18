# AkhAI — RESUME.md
> Session continuity file. Read this FIRST when resuming work.
> Last updated: 2026-04-18 10:15 UTC (Day 100/150)

## PROJECT STATE
- **Day 100/150** | Launch: June 4, 2026 (47 days) | **~87% features complete**
- **Commits:** 536 | Repo: `/Users/sheirraza/akhai` | GitHub: `algoq369/akhai`
- **VPS:** `akhai@82.221.101.3` (FlokiNET Iceland) | **akhai.app** live + healthy
- **Provider:** Claude Opus 4.7 primary | Haiku 4.5 for enrichment | OpenRouter Llama 3.3 70B free fallback
- **Standards:** WEBNA — 5 iron rules enforced every session
- **Master Plan:** `docs/plans/AKHAI_MASTER_PLAN_V5.md` (V5.4)

## LAST SESSION — Day 100 (Apr 18, 6 commits) — LLM-powered depth annotations
- **Pre-filter bug fix** (81dbc82) — removed brittle `para.includes(term)` check in ResponseRenderer that silently dropped annotations after markdown stripping
- **DB migration** (8cb0f8c) — added `annotations TEXT` + `annotations_version INTEGER` columns to `queries` table for per-queryId caching
- **LLM extractor module** (18a3d3d) — new `lib/depth/llm-extractor.ts` (104 lines) + `lib/depth/prompts.ts` (49 lines). Haiku 4.5 primary → Sonnet 4.6 fallback → caller handles regex. Module-scope env reads avoided (lazy getter pattern)
- **API endpoint** (d9c5c46) — new `app/api/depth-extract/route.ts` (93 lines). POST-only, checks DB cache first, falls through extraction chain, always returns 200 (annotations are enrichment not critical)
- **Client integration** (491da0b) — `hooks/useHomePageEffects.ts` now fetches `/api/depth-extract` instead of running local regex. Natural 2-3s buffer (Haiku response time) gives sigils-sync UX without artificial delay
- **Tuning fixes** (9133a85) — max_tokens 2000→4096 (Haiku was truncating JSON mid-string), timeout 25s→40s, parser salvages valid objects from truncated JSON, sigil font 10px→14px (was nearly invisible)

## KEY LEARNINGS (this session)
1. **LLM extraction dramatically outperforms regex** — test query "AI power map April 2026" got 23 contextually-assigned annotations via Haiku vs 6 from regex. Layer diversity: 7 of 11 layers used organically (Classifier, Discriminator, Executor, Encoder, Reasoning, Embedding, Expansion) — proving dynamic assignment works, not just defaulting to Classifier.
2. **Haiku JSON output can truncate at max_tokens** — with 2000 cap, dense responses (~30 entities × 60-word insights) would cut off mid-string, fail parsing, fall through to Sonnet→regex. Fix: raise cap to 4096 AND add a salvage parser that walks the JSON and extracts complete objects even if tail is truncated.
3. **Cache strategy critical for cost** — at $0.0005/fresh Haiku call but $0/cache hit, per-query caching in SQLite keeps blended cost ~$0.00005/query for active users. Without cache, scrolling history would re-spend per message.
4. **Sigils need ≥14px to be readable** — 10px superscript was too small next to 14px body text. The earlier sigil refactor (49ec529) had correct glyphs (safe-ASCII △ ⊕ ○ □ ◇ ⬡ ⬢ ⊙ ⊘ ▽ ✦) but the sizing made them easy to miss.

## VPS PRODUCTION STATUS (pre-deploy Apr 18)
- Localhost verified: ✅ LLM extraction working (23+ annotations/query) | ✅ cache 388ms hit | ✅ sigils render at 14px
- VPS: ⚠️ pending deploy of today's 6 commits (earlier session Opus 4.7 upgrade IS live on VPS)
- Health: ✅ ok | DB: connected | Keys: both verified (pre-commit check)
- Auth: email ✅, GitHub ✅, wallet ✅, Twitter ⚠️ needs creds

## NEXT PRIORITIES (pick up here)
### P0 — Immediate
1. **Rotate all API keys before June 4 launch** (Algoq manual task — keys exposed in session contexts)
2. **VPS schema migration for annotations columns** — deploy must run migration before new code. Check `deploy/quick-deploy.sh` behavior.
3. Browser visual confirmation on akhai.app post-deploy

### P1 — This Week
4. `claude-sonnet-4-20250514` debt — 11 sites, same-era as dead Haiku (potentially deprecated), next session cleanup
5. Canvas + Mini Canvas visual test on VPS
6. Esoteric Library scaffold (~4h)
7. DDG search fix (pre-session debt)

### P2 — Pre-Launch Polish
8. Split 5 files >500 lines
9. History API fix (returns dict not list)
10. Twitter OAuth + Reown domain
11. Landing page + SEO + PWA
12. Consider dev-mode free-tier toggle (explicit, not default) to reduce Opus burn during development

## KNOWN BUGS
- 5 files >500 lines: PipelineHistoryPanel 623, useCanvasState 568, content-classifier 555, CanvasNodeContent 538, ChatMessages 509
- simple-query/route.ts 598 lines (needs split)
- DDG search broken (pre-session debt)

## KEY COMMANDS
- Dev restart: `lsof -ti:3000 | xargs kill -9; sleep 2; cd ~/akhai/packages/web && rm -rf .next .turbo; npm run predev; SKIP_ENV_VALIDATION=1 npx next dev --turbopack -p 3000`
- Note: If ANTHROPIC_API_KEY shows ✗ in /api/health from Claude Code CLI, prepend `unset ANTHROPIC_API_KEY &&` to the next-dev command
- Deploy: `~/akhai/deploy/quick-deploy.sh`
- SSH: `ssh akhai@82.221.101.3`
- TSC: `cd ~/akhai/packages/web && npx tsc --noEmit`
- PM2 (VPS): `pm2 delete akhai && cd ~/app/packages/web && NODE_ENV=production pm2 start "npx next start -p 3000" --name akhai`
- Reset stale annotation cache (force re-extract): `sqlite3 data/akhai.db "UPDATE queries SET annotations=NULL, annotations_version=0 WHERE LENGTH(annotations) < 500"`
- Dev login (local): `/api/auth/dev-login`

## KEY ARCHITECTURE FILES
- `components/ResponseRenderer.tsx` (484) — Classic View structured renderer + TITLE_LAYER_MAP (exported)
- `components/sections/ChatMessages.tsx` (509) — wires ResponseRenderer + MacroButton + CouncilButton
- `components/DepthSigil.tsx` (79) — clickable 14px colored sigil, dotted underline on term, 11px expanded insight
- `lib/depth/llm-extractor.ts` (127) — Haiku 4.5 → Sonnet 4.6 extraction with JSON salvage parser
- `lib/depth/prompts.ts` (49) — system prompt for layer-aware entity extraction
- `lib/depth/patterns-general.ts` (417) — regex fallback (when LLM chain fails)
- `app/api/depth-extract/route.ts` (93) — POST endpoint, SQLite cache + LLM + regex fallback, always 200
- `hooks/useHomePageEffects.ts` (327) — fetches /api/depth-extract on new assistant messages
- `lib/layer-colors.ts` (116) — getLayerColorForAnnotation using TITLE_LAYER_MAP + domain fallbacks
- `lib/query-handler.ts` — METHODOLOGY_INSTRUCTIONS + direct mode prompt
