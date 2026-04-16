# AkhAI — RESUME.md
> Session continuity file. Read this FIRST when resuming work.
> Last updated: April 16, 2026 (Day 98/150) — 20:30

## PROJECT STATE
- **Day 98/150** | Launch: June 4, 2026 | **~85% features complete**
- **Commits:** 514 | Repo: `/Users/sheirraza/akhai` | GitHub: `algoq369/akhai`
- **VPS:** `akhai@82.221.101.3` (FlokiNET Iceland) | **akhai.app** live
- **Provider:** Claude Opus 4.6 (AKHAI_FREE_MODE=false on both local + VPS)
- **Standards:** WEBNA — 5 iron rules enforced every session

## COMPLETED: Classic View + Depth Annotation Enhancement (Day 98, 28 commits)

### Classic View — ResponseRenderer (commits a81bb00 → 5953812)
- Created `ResponseRenderer.tsx` (472 lines) — structured text rendering
- 5-pattern regex: ## headers, [TAG]:, **PATH**, bold-on-line, plain PATH N
- 11 AI computational layers with colors + sigils (TITLE_LAYER_MAP)
- Dual-label section titles: `△ ENCODER · CONTENT TITLE` (layer + topic)
- Cycling colors for PATH 1/2/3, Tier N, Phase N sub-sections
- Markdown tables → HTML tables with zebra stripes + pivot table support
- Entity sub-sections (Brand — description format)
- Strip [RELATED]/[NEXT] footer tags, DENYLIST for false sections

### Universal Structuring (commit 442c1c9)
- Created `lib/prompts/structure-instruction.ts` shared constant
- Injected into ALL 8 methodology prompts (direct, cod, sc, react, pas, tot, auto)
- AI now produces ## headers + **Bold — desc** for every methodology
- Verified: all 6 active methodologies produce 4-6 sub-sections

### Macro Cadre Refactor (commits 0460a66 → cb8d5ba)
- Converted from auto-render generic card → click-triggered per-query (Council pattern)
- Created: `MacroButton.tsx`, `MacroPanel.tsx`, `lib/stores/macro-store.ts`
- Calls `/api/esoteric/analyze` with current query on click
- Removed hard relevance gate — always analyzes when user clicks
- Expanded relevance keywords from 48 → 150 (geopolitical/economic/crypto terms)
- Fixed duplicate RELEVANCE_KEYWORDS in cycle-engine.ts (re-exports from relevance.ts)

### Depth Annotation System Overhaul (commits 2bca5b4 → 83af854, 9 commits)
- Removed 3 over-matching generic patterns (PRIORITY 1/2/3 in patterns-general.ts)
- Removed ALL sentence-matching patterns from patterns.ts (REMAINING_PATTERNS)
- Unified 3 competing sigil systems → single TITLE_LAYER_MAP
- Added `isValuableAnnotation` relevance gate (rejects content=term, <30 chars, headers)
- Removed dead code: Hebrew term detection + tag extraction
- Fixed sigil shapes: domain-specific fallbacks (metrics→◈, tech→▽, brands→□, countries→△)
- getLayerColorForAnnotation now checks BOTH term + content for layer matching
- Added person name detection: 6 regex patterns for Role+Name, Name+Role, lists, possessives
- Enriched fact extractor: year→era context, CEO→bio hint, HQ→geographic insight
- Capped metric tooltip verbosity to 200 chars

## KEY FILES MODIFIED/CREATED THIS SESSION
- `components/ResponseRenderer.tsx` (472 lines) — NEW, structured renderer
- `components/MacroButton.tsx` — NEW, click-triggered macro analysis
- `components/MacroPanel.tsx` — NEW, per-query macro display
- `components/DepthSigil.tsx` (60 lines) — passes term to layer detection
- `lib/stores/macro-store.ts` — NEW, zustand store for macro results
- `lib/prompts/structure-instruction.ts` — NEW, shared structuring constant
- `lib/depth-annotations.ts` (326 lines) — relevance gate added
- `lib/depth/patterns.ts` (16 lines) — sentence patterns removed
- `lib/depth/patterns-general.ts` (398 lines) — person names + enriched facts
- `lib/layer-colors.ts` (66 lines) — unified to TITLE_LAYER_MAP + domain fallbacks
- `lib/esoteric/relevance.ts` (60 lines) — expanded 150 keywords
- `lib/esoteric/cycle-engine.ts` — re-exports relevance (no duplicate)
- `app/api/esoteric/analyze/route.ts` — removed hard gate, relevance as hint

## NEXT PRIORITIES
1. **Deploy to VPS** — rsync latest 28 commits to akhai.app
2. **Esoteric Library scaffold** (~4h) — next Master Plan item
3. **DDG search fix** — depth annotations UI refinements
4. **Twitter OAuth** — add TWITTER_CLIENT_ID/SECRET to VPS .env.local
5. **Reown domain confirmation** — dashboard.reown.com

## KNOWN DEBT
- 5 files borderline >500 lines (PipelineHistoryPanel 623, useCanvasState 568)
- Person name false positives: "secretary general", "minister share" — needs blocklist
- ~65 `as any` casts remaining
- Depth annotation expandQuery not wired to actual follow-up queries yet

## KEY COMMANDS
- Dev restart: `lsof -ti:3000 | xargs kill -9; sleep 2; cd packages/web && rm -rf .next .turbo; npm run predev; SKIP_ENV_VALIDATION=1 npx next dev --turbopack -p 3000`
- Deploy: `~/akhai/deploy/quick-deploy.sh`
- SSH: `ssh -o StrictHostKeyChecking=no akhai@82.221.101.3`
- TSC: `npx tsc --noEmit`
- PM2 env: `pm2 delete akhai && cd ~/app/packages/web && NODE_ENV=production pm2 start "npx next start -p 3000" --name akhai`
