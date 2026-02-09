# AkhAI MILESTONE EXECUTION PLAN
## CLI-Ready • Day 35 → Day 150 • February 5, 2026

**Status:** Day 35/150 (~23%) | ~78% features complete
**Launch:** June 4, 2026 (Day 151)
**Break-even target:** Week 16

---

## CURRENT STATE AUDIT

### ✅ Built & Working
| System | File(s) | Status |
|--------|---------|--------|
| 7 Methodologies | `packages/core/src/methodologies/` | ✅ Complete |
| Grounding Guard (6-layer) | `packages/core/src/grounding/` | ✅ Complete |
| Intelligence Fusion | `lib/intelligence-fusion.ts` (450 lines) | ✅ Complete |
| Sefirot Engine (11 layers) | `lib/stores/sefirot-store.ts` | ✅ Complete |
| AI Terminology Renaming | `lib/ai-terminology.ts` | ✅ Complete |
| Side Canal | `lib/side-canal.ts` + `SideMiniChat.tsx` | ✅ Built |
| Depth Annotations | `lib/depth-annotations.ts` (389 lines) | ✅ Built, NOT integrated |
| Canvas Components | `components/canvas/` (7 files) | ⚠️ Stubbed, need wiring |
| Levels Store | `lib/stores/levels-store.ts` | ✅ Built |
| LevelProgressBar | `components/levels/LevelProgressBar.tsx` | ✅ Built |
| LevelContainer | `components/levels/LevelContainer.tsx` | ✅ Built |
| Query Store | `lib/query-store.ts` | ✅ Built |
| Canvas Page | `app/canvas/page.tsx` (175 lines) | ⚠️ Demo data only |
| QuickChat (Cmd+Shift+Q) | Multiple files | ✅ Complete |
| Stripe Integration | `app/api/checkout/` + `pricing/` | ✅ Built |
| Crypto Payments | `app/api/crypto-checkout/` | ✅ Built |
| 16 Pages | All routes | ✅ Loading |
| 47 API Endpoints | All routes | ✅ Responding |

### ❌ Not Built Yet
| Feature | Priority | Milestone |
|---------|----------|-----------|
| SelectionTool (Cmd+Shift+4) | HIGH | #4 |
| CodeAgentMode for MiniChat | HIGH | #5 |
| Query source separation (4 files) | HIGH | #3 |
| Writing style system (CLAUDE.md) | HIGH | #2 |
| Canvas panel wiring (live data) | CRITICAL | #1 |
| Grimoire System | MEDIUM | #6 |
| Deployment + Domain | HIGH | #7 |
| Family/Friends Testing | HIGH | #8 |
| Social Launch Prep | MEDIUM | #9 |

---

## MILESTONE 1: CANVAS PANEL WIRING
**Days 35-40 • Priority: CRITICAL • Est: 8-10h**

Wire existing canvas components to live data instead of demo/mock data.

### CLI Command

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Wire Canvas Panels to Live Data

CONTEXT:
- Canvas page: app/canvas/page.tsx (175 lines, uses DEMO data)
- Components exist: CanvasWorkspace, DraggablePanel, QueryCardsPanel, AILayersPanel, VisualsPanel, TreesPanel
- Levels store: lib/stores/levels-store.ts
- Query store: lib/query-store.ts
- Sefirot store: lib/stores/sefirot-store.ts

PHASE 1 - WIRE QUERY CARDS TO REAL DATA:
1. Read lib/query-store.ts - understand current shape
2. In app/canvas/page.tsx:
   - Remove DEMO_QUERY_CARDS array
   - Import useQueryStore (or create if needed)
   - Map real queries to QueryCard type
   - Each new query creates a new card in real-time

PHASE 2 - WIRE AI LAYERS PANEL:
1. AILayersPanel.tsx should read from sefirot-store
2. Show which of 11 layers activated per query
3. Show weight distribution and dominant layer
4. Update live when new query processed

PHASE 3 - WIRE TREES PANEL:
1. TreesPanel.tsx should show SefirotTreeSVG with live weights
2. Node click opens weight adjustment popup
3. Reflect current sefirot-store state

PHASE 4 - WIRE VISUALS PANEL:
1. VisualsPanel.tsx connects to levels-store
2. Show L1, L2, L3... progression
3. Each level = one query-response pair
4. Connection lines between related levels

PHASE 5 - REMOVE ALL DEMO DATA:
- No hardcoded QueryCards
- No mock insights
- No placeholder nodes
- Everything reads from stores

PHASE 6 - VERIFY:
- pnpm build passes
- Navigate to /canvas
- Submit query via SideMiniChat
- Query appears as new card
- AI Layers update
- Tree reflects weights
- No console errors

STYLING: Maintain grey-only Code Relic aesthetic. Monospace. No emojis in UI."
```

### Verification Checklist
- [ ] Canvas page loads with empty state (no demo data)
- [ ] New query from MiniChat → card appears in QueryCardsPanel
- [ ] AILayersPanel shows live Sefirot activation
- [ ] TreesPanel reflects store weights
- [ ] VisualsPanel shows level progression
- [ ] `pnpm build` passes

---

## MILESTONE 2: WRITING STYLE SYSTEM
**Days 40-42 • Priority: HIGH • Est: 4-6h**

Implement AkhAI's distinctive writing voice: precise, humble, holistic, straight-forward.

### CLI Command

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Implement AkhAI Writing Style System

PHASE 1 - CREATE WRITING GUIDE:
File: CLAUDE.md (append section)

Add ## AkhAI Writing Style section:

PRINCIPLES:
1. Word selection over word count - every word earns its place
2. Holistic perspective - connect ideas across domains
3. Humble tone - confident but never arrogant
4. Straight-forward - no filler, no 'Great question!', no pleasantries
5. Synthetic - compress complex into clear
6. Nourishing - each sentence adds genuine value

FORBIDDEN:
- 'Great question!' / 'That is a great point!'
- 'I would be happy to help'
- 'Let me explain...'
- Filler phrases, hedging language
- Excessive adjectives
- Marketing speak

STRUCTURE:
- Lead with insight, not preamble
- Paragraphs over bullets (in responses)
- Short sentences for impact, longer for nuance
- End with actionable next step or connection

PHASE 2 - UPDATE API SYSTEM PROMPT:
File: app/api/simple-query/route.ts

Add writing style instructions to the system prompt sent to Claude:
- Inject the principles above
- Ensure responses follow the style guide
- Test with 3 sample queries

PHASE 3 - VERIFY:
- Query: 'What is machine learning?'
- Response should: lead with insight, no filler, precise word selection
- Query: 'Explain quantum computing'
- Response should: holistic, connecting to broader concepts
- No 'Great question' or filler phrases

STYLING: This is about response TEXT quality, not UI."
```

### Verification Checklist
- [ ] CLAUDE.md has Writing Style section
- [ ] System prompt includes style instructions
- [ ] Test query returns response without filler phrases
- [ ] Response is concise, precise, holistic
- [ ] `pnpm build` passes

---

## MILESTONE 3: QUERY SOURCE SEPARATION
**Days 42-45 • Priority: HIGH • Est: 6-8h**

Separate queries into 4 distinct sources for organized intelligence tracking.

### CLI Command

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Query Source Separation System

CONTEXT:
- query-store.ts exists at lib/query-store.ts
- Need 4 separate query sources tracked

PHASE 1 - EXTEND QUERY STORE:
File: lib/query-store.ts (or lib/stores/query-store.ts)

Add source field to query type:
type QuerySource = 'main-chat' | 'q-agent' | 'mini-chat' | 'contextual'

interface TrackedQuery {
  id: string
  query: string
  response: string
  source: QuerySource
  timestamp: Date
  methodology: string
  sefirotActivation?: Record<string, number>
  relatedQueryIds?: string[]
}

SOURCE_META constant:
- main-chat: { label: 'MC', color: '#6B7280', description: 'Main Chat' }
- q-agent: { label: 'QA', color: '#8B5CF6', description: 'Q Agent' }
- mini-chat: { label: 'SC', color: '#3B82F6', description: 'Side Chat' }
- contextual: { label: 'CX', color: '#F59E0B', description: 'Contextual' }

PHASE 2 - TAG MAIN CHAT QUERIES:
File: app/page.tsx (or wherever main chat submits)
- On query submit, add source: 'main-chat' to store

PHASE 3 - TAG MINI CHAT QUERIES:
File: components/SideMiniChat.tsx
- On query submit, add source: 'mini-chat' to store

PHASE 4 - TAG Q-AGENT QUERIES:
(If Q-agent exists, wire it. If not, prepare the source tag)

PHASE 5 - ADD SOURCE FILTER TO CANVAS:
File: app/canvas/page.tsx or components/canvas/QueryCardsPanel.tsx
- Add filter tabs: All | MC | QA | SC | CX
- Filter query cards by source
- Show source badge on each card (colored dot + label)

PHASE 6 - ADD SOURCE FILTER TO MIND MAP HISTORY:
File: components/MindMapHistoryView.tsx
- Same filter tabs
- Source badges on query cards
- Topic clusters show source distribution

PHASE 7 - VERIFY:
- Submit query from main chat -> tagged 'main-chat'
- Submit query from SideMiniChat -> tagged 'mini-chat'
- Canvas filters work correctly
- Mind Map shows source badges
- No console errors

STYLING: Source badges are small pill-shaped, monospace, grey tones with subtle color coding."
```

### Verification Checklist
- [ ] Query store has source field
- [ ] Main chat queries tagged 'main-chat'
- [ ] Mini chat queries tagged 'mini-chat'
- [ ] Canvas shows source filter tabs
- [ ] Mind Map shows source badges
- [ ] Filters work across both views
- [ ] `pnpm build` passes

---

## MILESTONE 4: SELECTION TOOL (CMD+SHIFT+4)
**Days 45-48 • Priority: HIGH • Est: 8-10h**

DOM-aware selector for canvas — select panels, text, tree nodes and ask contextual questions.

### CLI Command

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Implement Selection Tool (Cmd+Shift+4 style)

CONTEXT:
- Canvas page: app/canvas/page.tsx
- This is for ADVANCED VIEW (canvas) only
- Similar to Mac Cmd+Shift+4 but DOM-aware, not screenshot

PHASE 1 - CREATE SELECTION TOOL COMPONENT:
File: components/canvas/SelectionTool.tsx

On Cmd+Shift+4:
1. Overlay appears on canvas (semi-transparent)
2. User draws rectangle by click-drag
3. Tool identifies DOM elements within selection area
4. Extracts: text content, panel type, data attributes, tree node info
5. Creates structured context object from selected elements

Selection result shape:
interface SelectionContext {
  selectedPanels: string[]
  selectedText: string
  selectedNodes: string[]
  selectedQueries: string[]
  bounds: { x: number, y: number, w: number, h: number }
}

PHASE 2 - CONTEXTUAL QUERY INPUT:
After selection:
1. Small floating input appears near selection
2. User types question about selected context
3. Query sent with full SelectionContext as context
4. Response appears in query store (source: 'contextual')
5. Links back to selected elements

PHASE 3 - KEYBOARD SHORTCUT:
File: hooks/useKeyboardShortcuts.ts
- Cmd+Shift+4 (Mac) / Ctrl+Shift+4 (Win) activates selection mode
- Escape cancels selection

PHASE 4 - SELECTION VISUAL FEEDBACK:
- Blue dashed rectangle while drawing
- Selected elements get subtle highlight border
- Floating input has arrow pointing to selection
- Selection dims non-selected areas

PHASE 5 - WIRE TO QUERY STORE:
- Contextual queries stored with source: 'contextual'
- Include SelectionContext in metadata
- Appear in the CX filter tab

PHASE 6 - VERIFY:
- Cmd+Shift+4 activates overlay on /canvas
- Draw rectangle selects elements
- Floating input appears
- Query with context returns relevant response
- Query stored as 'contextual' source
- No activation on main chat page (canvas only)
- Escape cancels properly

STYLING: Selection rectangle blue dashed, floating input monospace, minimal."
```

### Verification Checklist
- [ ] Cmd+Shift+4 activates selection overlay
- [ ] Rectangle selection captures DOM elements
- [ ] Floating input appears near selection
- [ ] Contextual query returns relevant response
- [ ] Stored as 'contextual' source in query store
- [ ] Only works on /canvas page
- [ ] `pnpm build` passes

---

## MILESTONE 5: MINI CHAT CODING AGENT
**Days 48-52 • Priority: HIGH • Est: 8-10h**

Transform SideMiniChat into dual-mode: Research + Code Agent (canvas only).

### CLI Command

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Add Code Agent Mode to SideMiniChat

CONTEXT:
- SideMiniChat.tsx exists at components/SideMiniChat.tsx
- Currently: research/query assistant
- Add: code agent mode (canvas advanced view only)

PHASE 1 - CREATE CODE AGENT MODE COMPONENT:
File: components/canvas/CodeAgentMode.tsx

Features when in Code mode:
1. Code generation with syntax highlighting
2. File suggestion (which files to create/modify)
3. Command generation (terminal commands)
4. Diff preview (before/after)
5. Copy-to-clipboard for each code block

PHASE 2 - MODE TOGGLE IN SIDEMINI CHAT:
File: components/SideMiniChat.tsx

Add toggle at top of mini chat:
- [Research] [Code] toggle
- Research mode: current behavior
- Code mode: coding agent behavior
- Mode persists per session

When Code mode active:
- System prompt changes to coding-focused
- Responses formatted as code blocks
- Temperature lower (0.3 vs 0.7)

PHASE 3 - CODE-SPECIFIC API ROUTE:
File: app/api/code-agent/route.ts

Dedicated endpoint for code queries:
- System prompt: 'You are a code agent for AkhAI...'
- Include project context (file structure, tech stack)
- Return structured: { code, language, filename, explanation }

PHASE 4 - CODE DISPLAY:
In SideMiniChat when code mode:
- Syntax highlighted code blocks
- Copy button per block
- Language label, file path label
- Collapsible explanation

PHASE 5 - CANVAS-ONLY ACTIVATION:
- Code mode toggle only on /canvas page
- Main chat page: mini chat is research-only

PHASE 6 - VERIFY:
- Toggle appears on /canvas
- Toggle does NOT appear on main page
- Research mode works as before
- Code mode returns formatted code
- Copy button works
- No console errors

STYLING: Code blocks dark bg (#0a0a0a), monospace, green accent. Toggle pills grey."
```

### Verification Checklist
- [ ] Mode toggle visible on /canvas only
- [ ] Research mode works as before
- [ ] Code mode returns syntax-highlighted code
- [ ] Copy button works per code block
- [ ] Mode persists in session
- [ ] `pnpm build` passes

---

## MILESTONE 6: DEPTH ANNOTATIONS + SIGILS INTEGRATION
**Days 52-55 • Priority: HIGH • Est: 6-8h**

Wire existing depth-annotations.ts into actual responses with coherent sigils.

### CLI Command

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Integrate Depth Annotations with Sigils

CONTEXT:
- lib/depth-annotations.ts (389 lines) EXISTS but NOT integrated
- lib/depth-annotations-enhanced.ts also exists
- components/DepthAnnotation.tsx (428 lines) EXISTS
- hooks/useDepthAnnotations.ts (215 lines) EXISTS

PHASE 1 - REVIEW EXISTING CODE:
- Read all depth annotation files
- Determine which is latest/best version

PHASE 2 - DEFINE SIGIL SYSTEM:
Coherent, pertinent, enriching:
- f (fact) — factual claims, verifiable statements
- m (metric) — numbers, measurements, quantitative data
- c (connection) — cross-domain links, analogies
- s (source) — references, citations
- d (depth) — deeper implications
- I (insight) — novel observations, key takeaways

Rules:
- Max 3 annotations per paragraph
- Complement humble straight-forward tone
- No emojis in annotation content
- Sigil appears as superscript after annotated phrase
- Hover/click reveals annotation detail

PHASE 3 - WIRE INTO MESSAGE RENDERING:
File: app/page.tsx — main chat message display
File: components/SideMiniChat.tsx — mini chat responses
- After AI response, run through annotation processor
- Attach sigils, render with DepthAnnotation component

PHASE 4 - ANNOTATION PROVIDER:
File: app/layout.tsx — wrap with DepthProvider

PHASE 5 - SETTINGS TOGGLE:
File: app/settings/page.tsx
- Depth Annotations toggle
- Density slider: minimal | balanced | rich

PHASE 6 - VERIFY:
- Sigils appear in responses
- Each type used correctly
- Hover shows detail
- Settings toggle works
- Both main chat and mini chat annotated
- No console errors

STYLING: Sigils zinc-400, popover dark bg, monospace, subtle border."
```

### Verification Checklist
- [ ] Sigils appear in AI responses
- [ ] Each sigil type used correctly
- [ ] Hover/click reveals annotation detail
- [ ] Settings toggle works
- [ ] Both views annotated
- [ ] `pnpm build` passes

---

## MILESTONE 7: GRIMOIRE SYSTEM
**Days 55-65 • Priority: MEDIUM • Est: 15-20h**

Project execution layer — where research becomes action.

### CLI Command

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Build Grimoire Execution System

PHASE 1 - GRIMOIRE PAGE:
File: app/grimoire/page.tsx
Layout: Left (file tree) | Center (workspace) | Right (chat) | Bottom (console)

PHASE 2 - PROJECT STORE:
File: lib/stores/grimoire-store.ts
Zustand store for projects with objectives, deadlines, files, risk/reward

PHASE 3 - OBJECTIVE TRACKING:
Status: planned | active | complete | blocked
Progress bars, dependency graph

PHASE 4 - RISK/REWARD CALCULATOR:
Input: effort, cost, probability
Output: visual score

PHASE 5 - GRIMOIRE CHAT:
Context-aware chat knowing current project and objectives

PHASE 6 - GUARD INTEGRATION:
Guard monitors grimoire for scope drift

PHASE 7 - NAVIGATION:
Add Grimoire to main nav, link from canvas

VERIFY: Page loads, CRUD works, objectives track, chat is contextual, build passes.
STYLING: Code Relic aesthetic. Grey panels. Monospace."
```

### Verification Checklist
- [ ] /grimoire page loads
- [ ] Project CRUD works
- [ ] Objectives tracking works
- [ ] Risk/reward calculator works
- [ ] Context-aware chat
- [ ] `pnpm build` passes

---

## MILESTONE 8: DEPLOYMENT + FAMILY/FRIENDS TESTING
**Days 65-85 • Priority: HIGH • Est: 10-15h**

Deploy to production, share with testers, iterate.

### Tasks
1. Production build (0 errors)
2. Deploy to Vercel + custom domain
3. In-app feedback system
4. Onboard 3-5 testers
5. Daily feedback review + iterate

### Verification Checklist
- [ ] Production URL live
- [ ] All features work on production
- [ ] Feedback system active
- [ ] 3+ testers onboarded

---

## MILESTONE 9: SOCIAL LAUNCH PREPARATION
**Days 85-120 • Priority: MEDIUM • Est: Ongoing**

### Tasks
1. Social accounts (Twitter/X, Telegram, Product Hunt)
2. Content assets (demo video, PH images, launch thread)
3. Community building (200+ PH supporters, daily engagement)
4. Technical prep (load testing, monitoring, rate limiting)
5. Launch day plan documented

### Verification Checklist
- [ ] All social accounts created
- [ ] Demo video produced
- [ ] Product Hunt assets ready
- [ ] Technical prep complete

---

## EXECUTION TIMELINE

```
DAY 35-40   ████████░░░░░░  M1: Canvas Wiring (CRITICAL)
DAY 40-42   ██████░░░░░░░░  M2: Writing Style
DAY 42-45   ████████░░░░░░  M3: Query Separation
DAY 45-48   ████████░░░░░░  M4: Selection Tool
DAY 48-52   ████████░░░░░░  M5: Code Agent
DAY 52-55   ██████░░░░░░░░  M6: Depth Annotations
DAY 55-65   ████████████░░  M7: Grimoire System
DAY 65-85   ██████████████  M8: Deploy + Testing
DAY 85-120  ██████████████  M9: Social Prep
DAY 121     █               SOCIAL LAUNCH
DAY 151     █               WEBSITE LAUNCH (June 4, 2026)
```

## DEPENDENCIES

| Milestone | Depends On | Can Parallel |
|-----------|-----------|--------------|
| 1 Canvas Wiring | — | — |
| 2 Writing Style | — | Yes with #1 |
| 3 Query Separation | #1 | Partially |
| 4 Selection Tool | #1, #3 | No |
| 5 Code Agent | #1 | Partially with #3 |
| 6 Depth Annotations | #2 | Yes with #4/#5 |
| 7 Grimoire | #1, #3 | No |
| 8 Deploy | #1-#7 | No |
| 9 Social Prep | #8 | Partially |

## CLI QUICK REFERENCE

```bash
# Start dev
cd /Users/sheirraza/akhai/packages/web && npx next dev -p 3000

# Build check
pnpm build --filter=@akhai/web

# Git push
git add -A && git commit -m '[milestone-N]: description' && git push origin main

# Verify milestone
claude "Verify Milestone N complete. Check files, build, test. Report."
```

---

*Generated: February 5, 2026 • Day 35/150*
*Next review: Day 50 (after Milestones 1-3)*
