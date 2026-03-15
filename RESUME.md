# AkhAI — RESUME.md
> Session continuity file. Read this FIRST when resuming work.
> Last updated: March 15, 2026 (Day 70/150)

## PROJECT STATE
- **Day 70/150** | Launch: June 4, 2026 | ~88% features complete
- **Repo:** `/Users/sheirraza/akhai` | GitHub: `algoq369/akhai`
- **92 commits this weekend** (March 14-15) | 244 total

## WHAT'S WORKING (verified March 15)
| Feature | File | Lines | Status |
|---|---|---|---|
| Canvas Workspace | `components/canvas/CanvasWorkspace.tsx` | 780 | ✅ 100% |
| Mindmap Graph (CLUSPLOT) | `components/MindMapDiagramView.tsx` | 1128 | ✅ 95% |
| Mindmap Mini-Chat | `components/MindMapMiniChat.tsx` | 241 | ✅ 100% |
| History Tab | `components/MindMapHistoryView.tsx` | 819 | ✅ 85% |
| Vision Board | `components/VisionBoard.tsx` | 1023 | ✅ 80% |
| News Ticker | `components/NewsNotification.tsx` | 166 | ✅ 100% |
| OpenRouter Fallback | `app/api/quick-query/route.ts` | 136 | ✅ 100% |
| Auth (dev-login) | `app/api/auth/dev-login/route.ts` | 43 | ✅ Working |

## KEY ARCHITECTURE DECISIONS
- **Free API chain:** Anthropic → OpenRouter Nemotron → StepFun → Nano → GPT-OSS (all free)
- **News:** Brave Search API (`BSA-6CzEPSLHhm-q_MZxGhGHb1i0xRc`) in `.env`
- **OpenRouter:** `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` in `.env.local`
- **Disabled panels:** TopicsPanel (`{false && ...}`), PipelineHistoryPanel (`{false && ...}`)
- **Ticker:** z-40, fixed top-0. All pages have paddingTop:22px or top:23px to clear it.
- **Auth:** Dev login at `/api/auth/dev-login` (creates session for algoq369). GitHub OAuth needs GITHUB_CLIENT_ID + SECRET.

## KNOWN ISSUES (carry forward)
1. **History hover tooltip** — portal-based, may need further testing for interactivity
2. **History conversation click** — navigates to `/?q=...` (loses conversation context). Needs chat_id wiring
3. **Vision Board timeline pins** — localStorage persistence fixed with lazy init, needs visual verification
4. **Sign-in** — Shows "sign in" until user visits `/api/auth/dev-login`. GitHub account suspended.
5. **better-sqlite3** — Run `npm rebuild better-sqlite3` from repo root after Node.js updates
6. **Grimoire tab** — Shell exists (30% complete), needs content wiring + auto-create default grimoire

## NEXT PRIORITIES (Day 71+)
1. Create RESUME.md ✅ (this file)
2. Push to GitHub
3. Grimoire tab wiring (auto-create, save insights, inline view)
4. History polish (verify hover, fix conversation navigation)
5. Settings page review
6. Pricing + Stripe integration
7. Mobile responsive pass
8. Performance audit (page.tsx 3667 lines → split)

## QUICK COMMANDS
```bash
# Start dev server
cd ~/akhai && cd packages/web && NODE_ENV=development npx next dev --turbopack -p 3000

# Kill & restart server
lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 2 && cd ~/akhai/packages/web && NODE_ENV=development npx next dev --turbopack -p 3000 2>&1 &

# Fix better-sqlite3
cd ~/akhai && npm rebuild better-sqlite3

# Clear cache
rm -rf packages/web/.next/cache

# Claude Code
cd ~/akhai && cc

# Dev login (sets session cookie)
open http://localhost:3000/api/auth/dev-login

# Test APIs
curl -s -X POST http://localhost:3000/api/quick-query -H "Content-Type: application/json" -d '{"query":"test"}'
curl -s http://localhost:3000/api/news | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d['items']), 'news items')"
curl -s http://localhost:3000/api/mindmap/data | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d['nodes']), 'nodes')"
```

## 150-DAY TIMELINE
- Days 1-100: Silent dev (current phase, Day 70)
- Days 101-120: Prep (landing page, SEO, docs, demo video)
- Day 121 (~May 6): Social launch
- Day 150 (June 4): Full website launch
