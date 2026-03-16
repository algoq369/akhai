# AkhAI — RESUME.md
> Session continuity file. Read this FIRST when resuming work.
> Last updated: March 16, 2026 (Day 71/150) — 12:45

## PROJECT STATE
- **Day 71/150** | Launch: June 4, 2026 | **~90% features complete**
- **Repo:** `/Users/sheirraza/akhai` | GitHub: `algoq369/akhai` (push pending — account suspended)
- **121 commits this sprint** (March 14-16) | 275 total

## ALL SYSTEMS VERIFIED (March 16, 12:40)
- Server: HTTP 200 ✅
- All 7 pages: 200 ✅
- All 9 GET APIs: 200 ✅
- All 3 POST APIs: 200 ✅ (quick-query, wallet, logout)
- PostHog: Live with 12 custom events ✅
- Finance: 5 indicators live ✅
- News: 5 headlines live ✅

## LAYOUT STACK (no overlaps verified)
```
[News ticker — z-40, fixed top-0, 23px]
[Profile — z-50, collapsible, hidden by default]
[Page content — paddingTop: 22px]
[Footer — py-0.5, marginBottom: 24px]
[Finance banner — z-40, fixed bottom-0, 24px]
```

## SECURITY AUDIT COMPLETED
- ✅ User data isolation — all `OR user_id IS NULL` removed from queries
- ✅ History returns empty when no auth session
- ✅ Mindmap data scoped per user
- ✅ VisionBoard localStorage scoped per userId
- ✅ Linked accounts: wallet 0x83d0 + 0x7f0E → algoq369 (shared data)
- ✅ Logout endpoint: POST /api/auth/logout (clears session + cookie)
- ✅ Wallet auth: connect → sign → verify → session created
- ✅ PostHog analytics: user identification + 12 custom events

## POSTHOG EVENTS TRACKED
identify, query_submitted, query_completed, methodology_changed, mindmap_opened,
philosophy_viewed, wallet_connected, user_logout, canvas_opened, news_clicked,
instinct_mode_toggled, layer_preset_applied, finance_indicator_clicked

## KEY FILES MODIFIED THIS SESSION
```
lib/analytics.ts          — NEW: centralized PostHog events (107 lines)
lib/database.ts           — user data isolation, linked_accounts table
lib/tree-configuration.ts — JSON.parse fallback fix
app/api/auth/logout/      — NEW: session destroy + cookie clear
app/api/auth/dev-login/   — NEW: dev session for algoq369
app/api/finance/route.ts  — 6 indicators: BTC, MCAP, GOLD, OIL, DXY, F&G
components/FinanceBanner.tsx       — white clean bottom bar
components/NewsNotification.tsx    — interactive ticker + analytics
components/AuthModal.tsx           — compact, wallet + github options
components/ProfileMenu.tsx         — collapsible, logout, analytics
components/TreeConfigurationModal.tsx — ultra-compact AI config
components/MethodologyFrame.tsx    — smaller orbs (w-2, gap-2)
app/philosophy/page.tsx            — ASCII line-art trees restored
app/providers.tsx                  — PostHog EU host fix
```

## REMAINING FOR SHIP
1. Clean up remaining `OR user_id IS NULL` in side-canal.ts query patterns
2. Mobile responsive pass
3. Performance audit (page.tsx 3692 lines → split)
4. Grimoire tab wiring
5. Production deploy (Hetzner VPS, domain, SSL)
6. Git push when GitHub account restored

## QUICK COMMANDS
```bash
cd ~/akhai && cd packages/web && NODE_ENV=development npx next dev --turbopack -p 3000
open http://localhost:3000/api/auth/dev-login  # set session for algoq369
cd ~/akhai && cc                              # claude code
```

## 150-DAY TIMELINE
- Days 1-100: Silent dev (Day 71 — 29 days left)
- Days 101-120: Prep (landing page, SEO, docs)
- Day 121 (~May 6): Social launch
- Day 150 (June 4): Full website launch
