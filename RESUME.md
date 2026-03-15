# AkhAI — RESUME.md
> Session continuity file. Read this FIRST when resuming work.
> Last updated: March 15, 2026 (Day 70/150) — 23:50

## PROJECT STATE
- **Day 70/150** | Launch: June 4, 2026 | **~89% features complete**
- **Repo:** `/Users/sheirraza/akhai` | GitHub: `algoq369/akhai` (push pending — account suspended)
- **99 commits this weekend** (March 14-15) | 246 total

## ALL SYSTEMS VERIFIED (March 15, 23:50)
- Server: HTTP 200 ✅
- Finance API: 5 prices + F&G 15 Extreme Fear ✅
- News API: 5 live headlines ✅
- Quick Query AI: 218 chars response at $0 ✅

## WHAT'S WORKING
| Feature | File | Lines | Status |
|---|---|---|---|
| Canvas Workspace | `components/canvas/CanvasWorkspace.tsx` | 780 | ✅ 100% |
| Mindmap Graph (CLUSPLOT) | `components/MindMapDiagramView.tsx` | 1128 | ✅ 95% |
| Mindmap Mini-Chat | `components/MindMapMiniChat.tsx` | 241 | ✅ 100% |
| History Tab | `components/MindMapHistoryView.tsx` | 819 | ✅ 85% |
| Vision Board | `components/VisionBoard.tsx` | 1023 | ✅ 80% |
| News Ticker (top) | `components/NewsNotification.tsx` | 166 | ✅ 100% |
| Finance Banner (bottom) | `components/FinanceBanner.tsx` | ~150 | ✅ 100% |
| Finance API | `app/api/finance/route.ts` | ~120 | ✅ 100% |
| OpenRouter Fallback | `app/api/quick-query/route.ts` | 136 | ✅ 100% |
| Auth (dev-login) | `app/api/auth/dev-login/route.ts` | 43 | ✅ Working |

## LAYOUT STACK (top to bottom, no overlaps)
```
[News ticker — z-40, fixed top-0, 23px] — live AGI/crypto headlines from Brave Search
[Profile menu — z-50, fixed top-7] — shows algoq369 when logged in
[Page content — paddingTop: 22px]
[Footer — marginBottom: 24px, 33px tall] — instinct, ai config, philosophy, intel, mindmap
[Finance banner — z-40, fixed bottom-0, 24px] — BTC, MCAP, GOLD, OIL, DXY, F&G
```

## KEY ARCHITECTURE
- **Free API chain:** Anthropic → OpenRouter Nemotron → StepFun → Nano → GPT-OSS
- **Finance data:** CoinGecko (crypto) + Yahoo Finance (macro) + alternative.me (F&G)
- **News data:** Brave Search API (4 queries: AGI, AI, crypto, sovereign)
- **Disabled panels:** TopicsPanel + PipelineHistoryPanel (both `{false && ...}`)
- **Auth:** `/api/auth/dev-login` creates session for algoq369. GitHub OAuth needs CLIENT_ID/SECRET.

## ENV KEYS (packages/web)
- `.env.local`: ANTHROPIC_API_KEY, OPENROUTER_API_KEY
- `.env`: BRAVE_SEARCH_API_KEY

## KNOWN ISSUES
1. History hover tooltip — needs portal interaction testing
2. History conversation click — uses `/?q=...` not chat_id
3. Sign-in shows "sign in" until visiting `/api/auth/dev-login`
4. GitHub account suspended — can't push
5. better-sqlite3 — run `npm rebuild better-sqlite3` after Node updates
6. Grimoire tab — 30% complete, needs wiring

## NEXT PRIORITIES (Day 71+)
1. Push to GitHub (when account restored)
2. Grimoire tab wiring (auto-create, save insights, inline view)
3. History polish (hover, conversation navigation)
4. Settings page review
5. Pricing + Stripe integration
6. Mobile responsive pass
7. Performance audit (page.tsx 3668 lines → split)

## QUICK COMMANDS
```bash
cd ~/akhai && cd packages/web && NODE_ENV=development npx next dev --turbopack -p 3000
npm rebuild better-sqlite3                    # fix sqlite after node updates
rm -rf packages/web/.next/cache               # clear turbopack cache
open http://localhost:3000/api/auth/dev-login  # set session cookie
cd ~/akhai && cc                              # claude code
```

## 150-DAY TIMELINE
- Days 1-100: Silent dev (Day 70 now — 30 days left)
- Days 101-120: Prep (landing page, SEO, docs)
- Day 121 (~May 6): Social launch
- Day 150 (June 4): Full website launch
