# ◊ AKHAI — Master Plan V5
## Day 93/150 — April 9, 2026

**420 commits | 80 features | 137 fixes | 57/57 tests green**
**Launch: June 4, 2026 (Day 150)**

---

## TIMELINE

| Phase | Days | Focus | Status |
|-------|------|-------|--------|
| 1. Visual Sovereignty | 1–70 | UI, Canvas, Mindmap, Depth Annotations | ✅ 95% |
| 2. Validation + Polish | 71–100 | Family testing, Mini Canvas, content quality | 🔵 IN PROGRESS |
| 3. AGI Activation | 101–120 | Gnostic layer, self-improving systems, alpha testers | ⬜ NEXT |
| 4. Community + Launch | 121–150 | X account, social launch (Day 121), website (Day 151) | ⬜ QUEUED |

---

## PHASE 1 — COMPLETED (Days 1–70)

- ✅ 7 reasoning methodologies (SC, PaS, ToT, CoT, Direct, CoD, Auto) — all academically cited
- ✅ Grounding Guard (4 detectors) + Side Canal topic extraction
- ✅ 11 AI computational layers with slider calibration (verified: 3 configs = 3 distinct outputs)
- ✅ SSE metadata pipeline (globalThis singleton + event buffer replay)
- ✅ Canvas workspace (draggable panels, query cards, topic bubbles, SVG connections)
- ✅ Mindmap (CLUSPLOT clusters, hover cards, click-to-expand, living graph)
- ✅ History tab, Grimoire, Philosophy page (ASCII trees)
- ✅ Depth annotations system (sigils: △ ⊕ ○, safe ASCII)
- ✅ page.tsx refactored: 3,000+ → 222 lines + extracted components/hooks (WEBNA)
- ✅ Full auth: Email (Resend), X/Twitter OAuth, Web3 Wallet (Reown AppKit), GitHub
- ✅ Email: noreply@akhai.app via Resend, DKIM/SPF/DMARC verified
- ✅ Security audit: removed all `OR user_id IS NULL`, scoped localStorage per userId
- ✅ PostHog EU analytics (12 custom events, 7 components)
- ✅ 5-model free API fallback chain (Anthropic → OpenRouter → StepFun → Nano → GPT-OSS)
- ✅ Finance ticker (BTC, MCAP, GOLD, OIL, DXY, Fear & Greed)
- ✅ News ticker (Brave Search: AGI/ASI/crypto)
- ✅ God View Phase 1 (Neural Tree, ActivityFeed, SSE→Zustand)
- ✅ Live metadata narrative during processing (Claude thinking-style)
- ✅ Deploy pipeline: rsync + PM2 on FlokiNET Iceland VPS (akhai.app)

## PHASE 2 — IN PROGRESS (Days 71–100)

### ✅ Completed this phase
- ✅ Mini Canvas: 18 commits (23c963e → 06149c2)
  - Content classifier (facts/metrics/correlations)
  - 5 themed fact boxes (tangible, verifiable, unrefutable, non-biased, straight forward)
  - Dashboard 2-column grid layout
  - Deduplication, contrast fix, noise filtering, per-category content
- ✅ Phase A MASTER_PLAN: renamed 3 fabricated methodology IDs to real academic methods
- ✅ SVG circle radius guard (getWeight || 0 fallback)

### 🔵 Remaining (Days 93–100)
1. **Mini Canvas polish** — metric name truncation at word boundary, strip [NEXT]: tags, "4 m" parser fix
2. **Persistent metadata side panel** — accumulates all engine metadata per session, toggleable, grouped by query
3. **VIEW tabs rendering** — AI Layers, Insight, Mindmap tabs (recurring broken)
4. **Depth annotations UI** — wire DepthText into message rendering, density slider in settings
5. **DDG search fix** — DuckDuckGo search integration
6. **VPS env finalization** — add TWITTER_CLIENT_ID/SECRET, confirm Reown AppKit domain
7. **Bottom input compaction** — reduce Live Refinement vertical space

---

## PHASE 3 — AGI ACTIVATION (Days 101–120)

| Task | Priority | Est |
|------|----------|-----|
| Gnostic Esoteric Layer (Kabbalistic Tree + Barbault cyclical index) | HIGH | 5d |
| Metadata streaming LIVE during processing (not post-response) | HIGH | 2d |
| Sovereign transition: Vercel AI SDK abstraction layer | MEDIUM | 3d |
| Esoteric Library app (PDF reader, audio console, 11 categories) | MEDIUM | 4d |
| Alpha tester expansion (10→20 users) | MEDIUM | ongoing |
| Instinct Mode (holistic hermetic analysis) | LOW | 3d |

## PHASE 4 — COMMUNITY + LAUNCH (Days 121–150)

| Task | Day | Description |
|------|-----|-------------|
| Social prep | 101–120 | Content calendar, screenshots, demo videos |
| Day 121: Social launch | May 6 | X account active, first posts |
| Days 121–150 | May 6–Jun 3 | Audience building, engagement |
| Day 150: Website launch | Jun 4 | akhai.app public, pricing live |
| Open-source release | Jun 4 | Core systems Apache 2.0 on github.com/algoq369/akhai |

---

## INFRASTRUCTURE

| Component | Current | Target |
|-----------|---------|--------|
| VPS | FlokiNET Iceland €10.99/mo (1CPU, 1GB, 20GB NVMe) | Same until revenue |
| AI Provider | Claude Opus 4.6 (primary) + free fallback chain | Same |
| Domain | akhai.app (Namecheap + Resend DNS) | Same |
| Reverse proxy | Caddy (auto-SSL) | Same |
| Process mgmt | PM2 | Same |
| Deploy | rsync via quick-deploy.sh | Same |
| Auth | Email + GitHub + X/Twitter + Web3 Wallet | Same |
| Analytics | PostHog EU | Same |
| Payments | USDT ERC20 | + BTC, XMR |

## PRICING (v3)

| Tier | Price | Tokens/day | Target |
|------|-------|------------|--------|
| Free | $0 | 50K | Onboarding |
| Pro | $20/mo | 1M | Power users |
| Legend | $200/mo | Unlimited | Enterprises |

Break-even: Week 16 post-launch.

## ON THE HORIZON (Post-launch)

- Sovereign hardware: DGX Spark ($3,999) → dual-RTX 4090 (~€8,500) → Hetzner GEX131 (€889/mo)
- Sovereign models: Qwen 2.5-72B primary → full migration Q1 2027
- Sovereign terminal + phone/computer hardware
- Robotics integration
- G&BV partnership (20% APY, 1-year lock, $200K–500K seed)

## WEBNA IRON RULES (non-negotiable)

1. Every file under 500 lines
2. Commit after every working change
3. Never deploy without green gates (57/57 Vitest + clean tsc + passing build)
4. No fabricated method names
5. Surgical edits only
