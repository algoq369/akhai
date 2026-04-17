# AkhAI — RESUME.md
> Session continuity file. Read this FIRST when resuming work.
> Last updated: April 17, 2026 (Day 99/150) — 10:21 UTC

## PROJECT STATE
- **Day 99/150** | Launch: June 4, 2026 (48 days) | **~85% features complete**
- **Commits:** 517 | Repo: `/Users/sheirraza/akhai` | GitHub: `algoq369/akhai`
- **VPS:** `akhai@82.221.101.3` (FlokiNET Iceland) | **akhai.app** live + healthy
- **Provider:** Claude Opus 4.6 primary | OpenRouter Llama 3.3 70B free tier
- **Standards:** WEBNA — 5 iron rules enforced every session
- **Master Plan:** `docs/plans/AKHAI_MASTER_PLAN_V5.md` (V5.4)

## LAST SESSION — Day 98-99 (Apr 16-17, 30 commits)

### Classic View (12 commits)
- `ResponseRenderer.tsx` (472 lines) — structured text rendering
- 5-pattern section regex: ##, [TAG]:, **PATH**, bold-on-line, plain PATH N
- 11 AI computational layers with `TITLE_LAYER_MAP` (colors + sigils)
- Dual-label titles: `△ ENCODER · CONTENT TITLE` (commit 5953812)
- Markdown tables → HTML tables with pivot support (commit 559b501)
- Universal structuring instruction for ALL 8 methodologies (commit 442c1c9)

### Macro Cadre Refactor (5 commits)
- Click-triggered per-query analysis (Council pattern, commit 0460a66)
- `MacroButton.tsx` + `MacroPanel.tsx` + `lib/stores/macro-store.ts`
- Removed hard relevance gate — always analyzes on click (commit cb8d5ba)
- Expanded keywords 48 → 150 (commit 52782b9)
- Fixed duplicate RELEVANCE_KEYWORDS in cycle-engine.ts (commit ee36af9)

### Depth Annotation Overhaul (11 commits)
- Removed generic over-matching patterns (PRIORITY 1/2/3, commit 2bca5b4)
- Removed ALL sentence-matching patterns from patterns.ts (commit e02eb8a)
- Unified 3 competing sigil systems → single TITLE_LAYER_MAP (commit 0bf7437)
- `isValuableAnnotation` relevance gate (commit 560d8bc)
- Removed dead code: Hebrew detection + tag extraction (commit 48a15c7)
- Fixed sigil shapes: domain-specific fallbacks (commit ecb1362)
- Person name detection: 6 regex patterns with Unicode (commit 83af854)
- Enriched fact extractor: year→era, CEO→bio, HQ→geo (commit 0483380)
- Capped metric tooltip to 200 chars

### Security & Deploy
- Deployed all 30 commits to VPS akhai.app
- Redacted leaked API keys from 5 tracked files (commit a58281b)
- Rotated OpenRouter API key on local + VPS
- GitHub push completed (517 commits on remote)

## VPS PRODUCTION STATUS (verified Apr 17)
- Health: ✅ ok | DB: connected | Keys: both verified
- Direct query: ✅ working | Council: ✅ 4 agents + synthesis
- Macro analyze: ✅ relevant=true, synthesis generated
- All 11 pages: ✅ 200 OK | Finance/News: ✅ data flowing
- Auth: email ✅, GitHub ✅, wallet ✅, Twitter ⚠️ needs creds

## NEXT PRIORITIES (pick up here)
### P0 — Immediate
1. Live visual test on akhai.app — Classic View + depth annotations + macro + council render
2. Metadata SSE render — verify layer calibration on VPS
3. Live refinement buttons test (refine/enhance/correct/instruct)

### P1 — This Week
4. Depth annotation: person name blocklist (false positives: secretary general, etc.)
5. Depth annotation: wire expandQuery to follow-up queries on sigil click
6. Canvas refinement — visual test on VPS
7. DDG search fix (pre-session debt)
8. Esoteric Library scaffold (~4h)

### P2 — Pre-Launch Polish
9. Split 5 files >500 lines
10. History API fix (returns dict not list)
11. Twitter OAuth + Reown domain
12. Landing page + SEO + PWA

## KNOWN BUGS
- Person name false positives: "secretary general", "minister share" (patterns-general.ts)
- 5 files >500 lines: PipelineHistoryPanel 623, useCanvasState 568, content-classifier 555, CanvasNodeContent 538, ChatMessages 509
- simple-query/route.ts 598 lines (needs split)
- DDG search broken (pre-session debt)
- Depth annotation expandQuery not wired to actual follow-up queries

## KEY COMMANDS
- Dev restart: `lsof -ti:3000 | xargs kill -9; sleep 2; cd ~/akhai/packages/web && rm -rf .next .turbo; npm run predev; SKIP_ENV_VALIDATION=1 npx next dev --turbopack -p 3000`
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
- `lib/depth/patterns-general.ts` (411) — person names + facts + metrics
- `lib/layer-colors.ts` (66) — getLayerColorForAnnotation using TITLE_LAYER_MAP + domain fallbacks
- `lib/prompts/structure-instruction.ts` — UNIVERSAL_STRUCTURE_INSTRUCTION
- `lib/query-handler.ts` — METHODOLOGY_INSTRUCTIONS + direct mode prompt
- `lib/esoteric/relevance.ts` (60) — 150 keywords, single source of truth
- `app/api/esoteric/analyze/route.ts` — macro analysis, no hard gate
