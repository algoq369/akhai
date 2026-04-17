# AkhAI — RESUME.md
> Session continuity file. Read this FIRST when resuming work.
> Last updated: 2026-04-17 17:39 UTC (Day 99/150)

## PROJECT STATE
- **Day 99/150** | Launch: June 4, 2026 (48 days) | **~85% features complete**
- **Commits:** 529 | Repo: `/Users/sheirraza/akhai` | GitHub: `algoq369/akhai`
- **VPS:** `akhai@82.221.101.3` (FlokiNET Iceland) | **akhai.app** live + healthy
- **Provider:** Claude Opus 4.7 primary (upgraded 2026-04-17) | OpenRouter Llama 3.3 70B free tier
- **Standards:** WEBNA — 5 iron rules enforced every session
- **Master Plan:** `docs/plans/AKHAI_MASTER_PLAN_V5.md` (V5.4)

## LAST SESSION — Day 99 (Apr 17, 8 commits)
- Person-name blocklist (836a14a) — reject "secretary general", "prime minister", "board directors" as false-positive names
- Dropped AKHAI_FREE_MODE flag (6193b90) — route to Opus when ANTHROPIC_API_KEY set
- Sigil safe-ASCII enforcement (49ec529) — all 11 layers + 6 domain fallbacks on safe palette (△ ⊕ ○ □ ◇ ⬡ ⬢ ⊙ ⊘ ▽ ✦)
- Depth annotation legibility (5ab4828) — 8px → 11px expanded notes, dotted underline on term
- Lazy env reads (f62c763, a9a4ef5, 21de922) — provider-selector / side-canal / living-tree converted from module-scope process.env reads to lazy getters. Fixes localhost dev env-load timing races
- Haiku 404 fix (ffeacdd) — claude-3-5-haiku-20241022 → claude-haiku-4-5-20251001 (5 sites, unblocks Mini Canvas)
- Temperature strip (61404dd) — removed sampling params from Anthropic call sites (Opus 4.7 rejects them with 400)
- Opus 4.7 upgrade (a5b4293) — 21 call sites from claude-opus-4-6 → claude-opus-4-7

## KEY LEARNINGS (this session)
1. **Claude Code subshells inject `ANTHROPIC_API_KEY=""`** — every Bash subprocess spawned by this CLI harness gets an empty ANTHROPIC_API_KEY in its environment. Because dotenv never overrides existing env vars, Next.js .env.local load silently fails. Workaround: `unset ANTHROPIC_API_KEY` before `next dev`, OR use dotenv config with `override: true`. Not an akhai bug — purely a tooling quirk.
2. **Opus 4.7 breaking changes** — (a) returns 400 on any non-default temperature/top_p/top_k, omit entirely for Anthropic calls; (b) new tokenizer uses 1.0-1.35x more tokens; (c) follows prompts more literally — Opus 4.6-tuned prompts may need adjustment. Pricing unchanged.
3. **Module-scope env reads are a latent bug class** — any `const X = process.env.FOO` at file top-level is a time-bomb in Next.js dev mode, as Turbopack can import modules before .env.local finishes loading. Always use lazy getters.

## VPS PRODUCTION STATUS (verified Apr 17 17:39 UTC)
- Health: ✅ ok | DB: connected | Keys: both verified
- Direct query: ✅ claude-opus-4-7 | Council: ✅ 4 agents + synthesis
- Enhanced Links: ✅ working (Haiku 4.5) | Canvas Viz: ✅ working
- All 11 pages: ✅ 200 OK | Finance/News: ✅ data flowing
- Auth: email ✅, GitHub ✅, wallet ✅, Twitter ⚠️ needs creds

## NEXT PRIORITIES (pick up here)
### P0 — Immediate
1. **Rotate all API keys before June 4 launch** (Algoq manual task)
2. Live visual test on akhai.app — Classic View + depth annotations + macro + council render
3. Metadata SSE render — verify layer calibration on VPS

### P1 — This Week
4. `claude-sonnet-4-20250514` debt — 11 sites, potentially deprecated, next session cleanup
5. Canvas refinement — visual test on VPS
6. Esoteric Library scaffold (~4h)
7. DDG search fix (pre-session debt, P2)

### P2 — Pre-Launch Polish
8. Split 5 files >500 lines
9. History API fix (returns dict not list)
10. Twitter OAuth + Reown domain
11. Landing page + SEO + PWA

## KNOWN BUGS
- 5 files >500 lines: PipelineHistoryPanel 623, useCanvasState 568, content-classifier 555, CanvasNodeContent 538, ChatMessages 509
- simple-query/route.ts 598 lines (needs split)
- DDG search broken (pre-session debt)
- Depth annotation expandQuery not wired to actual follow-up queries

## KEY COMMANDS
- Dev restart: `lsof -ti:3000 | xargs kill -9; sleep 2; cd ~/akhai/packages/web && rm -rf .next .turbo; npm run predev; SKIP_ENV_VALIDATION=1 npx next dev --turbopack -p 3000`
- Note: If ANTHROPIC_API_KEY shows ✗ in /api/health from Claude Code CLI, prepend `unset ANTHROPIC_API_KEY &&` to the next-dev command
- Deploy: `~/akhai/deploy/quick-deploy.sh`
- SSH: `ssh akhai@82.221.101.3`
- TSC: `cd ~/akhai/packages/web && npx tsc --noEmit`
- PM2 (VPS): `pm2 delete akhai && cd ~/app/packages/web && NODE_ENV=production pm2 start "npx next start -p 3000" --name akhai`
- Dev login (local): `/api/auth/dev-login`

## KEY ARCHITECTURE FILES
- `components/ResponseRenderer.tsx` (472) — Classic View structured renderer + TITLE_LAYER_MAP (exported)
- `components/sections/ChatMessages.tsx` (509) — wires ResponseRenderer + MacroButton + CouncilButton
- `components/DepthSigil.tsx` (60) — clickable layer sigil, calls getLayerColorForAnnotation(content, term)
- `lib/depth-annotations.ts` (326) — detectAnnotations + isValuableAnnotation gate
- `lib/depth/patterns-general.ts` (417) — person names + facts + metrics + blocklist
- `lib/layer-colors.ts` (66) — getLayerColorForAnnotation using TITLE_LAYER_MAP + domain fallbacks
- `lib/prompts/structure-instruction.ts` — UNIVERSAL_STRUCTURE_INSTRUCTION
- `lib/query-handler.ts` — METHODOLOGY_INSTRUCTIONS + direct mode prompt
- `lib/esoteric/relevance.ts` (60) — 150 keywords, single source of truth
- `app/api/esoteric/analyze/route.ts` — macro analysis, no hard gate
