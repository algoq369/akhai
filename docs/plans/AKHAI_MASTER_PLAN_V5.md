# ◊ AKHAI — Master Plan V5.4
## Day 99/150 — April 17, 2026 — 48 days to launch

**516 commits | Launch: June 4, 2026**

---

## SESSION RECAP — Day 98 (30 commits, a81bb00 → a58281b)

### ✅ Classic View Enhancement (12 commits)
- ResponseRenderer.tsx (472 lines) — structured text rendering
- 5-pattern section regex: ##, [TAG]:, **PATH**, bold-on-line, plain PATH N
- 11 AI computational layers with TITLE_LAYER_MAP (colors + sigils)
- Dual-label titles: `△ ENCODER · CONTENT TITLE`
- Markdown tables → HTML tables with zebra stripes + pivot support
- Entity sub-sections, Tier N/Phase N, cycling layer colors
- Strip [RELATED]/[NEXT] footer tags

### ✅ Universal Structuring (1 commit)
- UNIVERSAL_STRUCTURE_INSTRUCTION shared constant
- Injected into ALL 8 methodology prompts
- All methodologies now produce 4-6 structured sub-sections

### ✅ Macro Cadre Refactor (5 commits)
- Click-triggered per-query analysis (Council pattern)
- MacroButton.tsx + MacroPanel.tsx + macro-store.ts
- Removed hard relevance gate — always analyzes on click
- Expanded keywords 48 → 150 (geopolitical/economic/crypto)
- Fixed duplicate RELEVANCE_KEYWORDS in cycle-engine.ts

### ✅ Depth Annotation Overhaul (11 commits)
- Removed generic over-matching patterns (PRIORITY 1/2/3)
- Removed ALL sentence-matching patterns from patterns.ts
- Unified 3 competing sigil systems → single TITLE_LAYER_MAP
- Added isValuableAnnotation relevance gate
- Removed dead code (Hebrew detection + tag extraction)
- Fixed sigil shapes: domain-specific fallbacks
- Person name detection (6 regex patterns)
- Enriched fact extractor (year→era, CEO→bio, HQ→geo)
- Capped metric tooltip to 200 chars

### ✅ Security & Deploy
- Deployed 30 commits to VPS akhai.app
- Redacted leaked API keys from 5 tracked files
- Rotated OpenRouter API key (local + VPS)

---

## VPS PRODUCTION AUDIT (akhai.app — April 17, 2026)

### ✅ Working
| Feature | Status | Details |
|---------|--------|---------|
| Health API | ✅ | ok, db connected, keys verified |
| Direct query | ✅ | 182 chars, methodology=direct |
| SC/CoD/ToT/React/PaS | ✅ | All produce structured output |
| Macro analyze | ✅ | relevant=true, synthesis generated, $0.009/call |
| Council (5-agent) | ✅ | 4 perspectives + synthesis, $0.013/call |
| Finance ticker | ✅ | prices + sentiment |
| News feed | ✅ | items returned |
| All pages | ✅ | /, /constellation, /temple, /guide, /philosophy, /pricing, /canvas, /mindmap, /side-canal, /living-tree, /idea-factory |
| Auth routes | ✅ | email, GitHub, wallet, X (Twitter needs creds) |
| Caddy SSL | ✅ | HTTPS valid |

### ⚠️ Needs Testing / Polish
| Feature | Issue | Priority |
|---------|-------|----------|
| Classic View render | ✅ Code deployed but NOT visually tested on VPS | HIGH |
| Depth annotations | Person name false positives (secretary general, etc.) | MEDIUM |
| Depth annotation tooltip | Content quality for generic terms still weak | MEDIUM |
| Canvas workspace | Not tested on VPS — may have stale state | MEDIUM |
| Metadata render | SSE metadata (layer calibration) not verified on VPS | HIGH |
| Live refinement | Refine/enhance/correct buttons — functional test needed | MEDIUM |
| DDG search | Known broken (pre-session debt) | LOW |
| Twitter OAuth | Needs TWITTER_CLIENT_ID/SECRET on VPS | LOW |
| Reown domain | Needs dashboard.reown.com confirmation | LOW |

### 🔴 Known Bugs
| Bug | File | Severity |
|-----|------|----------|
| Person name false positives | patterns-general.ts | LOW — "secretary general", "minister share" |
| 5 files >500 lines | PipelineHistoryPanel (623), useCanvasState (568), content-classifier (555), CanvasNodeContent (538), ChatMessages (509) | LOW |
| simple-query/route.ts (598 lines) | Needs split | LOW |
| History API returns dict not list | /api/history | INVESTIGATE |

---

## PHASE 3 — 98% COMPLETE (Days 94–99)

### ✅ Completed (Days 94-98)
- Esoteric Layer (10 commits): 8 JSON data files, cycle engine, 7 UI components, guide page
- Constellation 3-Tab Dashboard: Macro/Micro/Synthesis + natal chart + geocoding proxy
- Mystic Temple: 3 rooms (Thesis/Constellation/Museum) + AKH 313 data
- Canvas Enhancements: threading + topic constellation + cross-query + stopwords + layout
- Instinct Mode: 7 hermetic lenses via system prompt enrichment
- Classic View: ResponseRenderer + 11 layers + dual-label titles + tables + entity sub-sections
- Universal Structuring: all methodologies produce colored sections
- Macro Cadre: click-triggered per-query macro-cyclical analysis
- Depth Annotations: unified sigils, person names, enriched facts, relevance gate
- Philosophy page, Hebrew removal, contrast audit, AI Config scaling
- Multiple VPS deployments, key rotation

### ⬜ Remaining Phase 3
| Task | Est | Priority |
|------|-----|----------|
| Esoteric Library scaffold | 4h | MEDIUM |
| VPS: Twitter OAuth + Reown | 30min | LOW |

---

## NEXT STEPS — PRIORITY ORDER (Days 99-120)

### 🔴 P0 — Immediate (Day 99-100)
1. **Live production test on akhai.app** — verify Classic View, depth annotations, macro button, council all render correctly in production (not just localhost)
2. **Metadata SSE render** — verify layer calibration percentages, methodology badges, token/cost display work on VPS
3. **Live refinement test** — refine/enhance/correct/instruct buttons functional on VPS

### 🟠 P1 — This Week (Days 100-105)
4. **Depth annotation person name blocklist** — filter "secretary general", "minister share", "advisory roles" false positives (~30min)
5. **Depth annotation expand query** — wire expandQuery to actual follow-up queries when user clicks sigil (~2h)
6. **Canvas refinement** — visual test on VPS, verify query threading + topic constellation + cross-query connections (~2h)
7. **DDG search fix** — known pre-session debt (~1h)
8. **Esoteric Library scaffold** — 4h

### 🟡 P2 — Pre-Launch Polish (Days 105-120)
9. **File size cleanup** — split 5 files >500 lines (PipelineHistoryPanel, useCanvasState, content-classifier, CanvasNodeContent, simple-query/route)
10. **History API** — investigate dict vs list return, verify history page works
11. **Twitter OAuth** — add creds to VPS
12. **Reown domain** — confirm on dashboard
13. **Landing page polish** — pricing, features, copy
14. **SEO** — OpenGraph, Twitter Card, meta descriptions
15. **PWA manifest** — offline support basics

### 🟢 P3 — Launch Prep (Days 121-150)
16. Day 121 (May 6): Social launch — X account active
17. Day 130: Beta testers, feedback loop
18. Day 140: Final polish, performance audit
19. Day 150 (Jun 4): Website launch — akhai.app public + Apache 2.0

---

## ARCHITECTURE SNAPSHOT (516 commits)

| Layer | Components | Status |
|-------|-----------|--------|
| **AI Engine** | Claude Opus 4.6 primary, OpenRouter Llama fallback | ✅ |
| **8 Methodologies** | direct, sc, cod, tot, react, pas, aot, step-back | ✅ |
| **Classic View** | ResponseRenderer + 11 layers + dual-label + tables | ✅ |
| **Depth Annotations** | patterns-general + tech + science, person names | ✅ |
| **Macro-Cyclical** | Click-triggered, /api/esoteric/analyze, 5 frameworks | ✅ |
| **Council** | 5-agent perspective analysis, synthesis, $0.013/call | ✅ |
| **Canvas** | Query threading, topic constellation, cross-query | ✅ |
| **Constellation** | 3-tab: Macro/Micro/Synthesis, Barbault chart, natal | ✅ |
| **Temple** | 3 rooms: Thesis/Constellation/Museum | ✅ |
| **Auth** | Email, GitHub, Wallet, Twitter (needs creds) | 90% |
| **Infra** | FlokiNET Iceland, Caddy SSL, PM2, deploy script | ✅ |

## INFRASTRUCTURE
- **VPS:** FlokiNET Iceland €10.99/mo | 1 CPU, 1GB RAM, 20GB NVMe
- **AI:** Claude Opus 4.6 (production) | OpenRouter Llama 3.3 70B (free tier)
- **Domain:** akhai.app | SSL: Caddy auto-renewal
- **Deploy:** ~/akhai/deploy/quick-deploy.sh (rsync + PM2)
- **Monitoring:** PostHog EU, Pino logging, /api/health
