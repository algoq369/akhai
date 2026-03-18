# ◊ AkhAI — GOD VIEW Integration Plan
## Inspired by MiroFish (32k★ swarm intelligence engine)
## Adapted for Kabbalistic Sefirot Architecture

**Created:** March 18, 2026 (Day 73/150)
**Target:** Ship all 3 phases before Day 100 (silent dev ends)
**Principle:** Token-efficient (3-7 API calls, not 1000s like MiroFish)

---

## CONCEPT

MiroFish builds parallel digital worlds with thousands of AI agents.
AkhAI's God View does the same thing — but through the Tree of Life.

Instead of brute-force agent swarms, we use the Sefirot as **archetypal
perspective lenses**. Each Sefirah IS an agent with a worldview. The Tree
IS the simulation. The user watches intelligence emerge from structure.

This is not a copy of MiroFish. This is what MiroFish would be if it
were designed by a Kabbalist.

---

## PHASE 1 — Sefirot God View (Live Query Visualization)
**Days 73-80 | Frontend only | 0 new API calls**

### What the user sees
When a query runs, a split-panel or overlay shows the Tree of Life
with real-time activity:
- Sefirot nodes light up as layers activate
- Guard detections pulse red at Gevurah
- Methodology selection glows at the active path
- Token flow animates along the 22 paths between Sefirot
- Side Canal topics appear as leaves growing from relevant nodes

### Architecture
```
Existing SSE metadata ──→ GodViewPanel.tsx ──→ React Flow / D3
                                │
                    SefirotNode.tsx (11 nodes)
                    PathEdge.tsx (22 paths)
                    ActivityOverlay.tsx (pulses)
```

### Files to create

```
components/god-view/
  GodViewPanel.tsx        — Main container, toggle overlay
  SefirotTree.tsx         — 11 nodes positioned as Tree of Life
  SefirotNode.tsx         — Individual node (name, activation %, glow)
  PathEdge.tsx            — Animated edges between Sefirot
  ActivityFeed.tsx        — Live log: "Guard checking... Binah activated..."
  GodViewToggle.tsx       — Button in response area to open/close
```

### Data flow (no new API needed)
Your SSE stream already emits metadata via `globalThis.__akhaiEventBuffer`:
- `layer_weights` → maps to Sefirot activation percentages
- `guard_result` → maps to Gevurah/Din pulse
- `methodology` → maps to active path highlight
- `tokens_used` → maps to flow animation speed
- `side_canal_topics` → maps to leaf nodes

### Step-by-step implementation

**Step 1.1** — Create `SefirotTree.tsx` (static Tree of Life layout)
- 11 nodes positioned in traditional Tree formation using absolute coords
- Use CSS grid or absolute positioning, NOT React Flow (overkill here)
- Monochrome design: dark bg, light nodes, subtle connecting lines
- Each node: name (Hebrew + English), small circle, activation bar

**Step 1.2** — Create `GodViewPanel.tsx` (container + state)
- Subscribes to SSE metadata events from existing event buffer
- Maps `layer_weights` object → individual Sefirot activation states
- Slide-in panel from right side (like MindMap panel)
- Toggle via new button in response header area

**Step 1.3** — Create `ActivityFeed.tsx` (live event log)
- Bottom section of GodViewPanel
- Scrolling monospace log of system events:
  "◊ Keter initiated... weight 0.12"
  "△ Gevurah Guard: drift score 0.03 — PASS"
  "→ Methodology: Socratic selected"
  "◇ Side Canal: extracted 4 topics"
- Events come from same SSE metadata, formatted as sigil log lines

**Step 1.4** — Wire into page.tsx response area
- Add GodViewToggle button (eye icon) next to existing mindmap toggle
- Conditionally render GodViewPanel when active
- Panel overlays or splits the response column

**Step 1.5** — Animation pass
- CSS transitions on node opacity/scale when activation changes
- Pulse animation on Guard node when checking
- Path glow animation when methodology routes through specific Sefirot
- Keep it subtle — this is monochrome minimalism, not a light show

### Token cost: 0 (uses existing SSE metadata)
### Estimated effort: 2-3 days with cc

---

## PHASE 2 — Perspective Council (Multi-Agent Reasoning)
**Days 80-90 | 1 new API route, 1 new component | 3-5 API calls per query**

### What the user sees
Below the main response, a "Council of Perspectives" panel shows 5
archetypal viewpoints on the same topic — each mapped to a Sefirah:

```
┌─────────────────────────────────────────────────────┐
│  ◊ COUNCIL OF PERSPECTIVES                          │
├─────────────┬─────────────┬─────────────────────────┤
│ △ GEVURAH   │ ◇ CHESED    │ ○ TIFERET               │
│ The Skeptic │ The Advocate│ The Synthesizer          │
│             │             │                          │
│ "This claim │ "The upside │ "Balancing both: the     │
│  lacks hard │  potential   │  evidence is mixed but   │
│  evidence.."│  is clear.." │  trending positive..."   │
├─────────────┼─────────────┼─────────────────────────┤
│ ☿ BINAH     │ ⊕ CHOKMAH   │                          │
│ The Analyst │ The Visionary│                          │
│             │              │                          │
│ "The data   │ "What if we  │                          │
│  shows 3    │  consider    │                          │
│  patterns.."│  the bigger.."│                         │
└─────────────┴──────────────┴─────────────────────────┘
```

### The 5 Archetypal Agents

| Agent | Sefirah | Role | System prompt flavor |
|-------|---------|------|---------------------|
| The Skeptic | Gevurah (Judgment) | Challenge claims, find flaws | "You are a rigorous critic..." |
| The Advocate | Chesed (Mercy) | Best-case interpretation | "You see potential and upside..." |
| The Synthesizer | Tiferet (Beauty) | Balance opposing views | "You integrate all perspectives..." |
| The Analyst | Binah (Understanding) | Data patterns, structure | "You decompose into components..." |
| The Visionary | Chokmah (Wisdom) | Big picture, long-term | "You see beyond the immediate..." |

### Architecture
```
User query + main response
        │
        ▼
POST /api/god-view/council
        │
        ├─→ LLM call 1: Gevurah perspective (short, 150 tokens max)
        ├─→ LLM call 2: Chesed perspective
        ├─→ LLM call 3: Tiferet perspective
        ├─→ LLM call 4: Binah perspective
        └─→ LLM call 5: Chokmah perspective
        │
        ▼ (all 5 run in parallel via Promise.all)
  CouncilPanel.tsx renders 5 cards
```

### Files to create
```
app/api/god-view/council/route.ts   — 5 parallel LLM calls
components/god-view/CouncilPanel.tsx — 5-card grid layout
components/god-view/AgentCard.tsx    — Single perspective card
lib/god-view/agents.ts              — Agent definitions + prompts
```

### Step-by-step implementation

**Step 2.1** — Create `lib/god-view/agents.ts`
- Define 5 agent configs: name, sefirah, sigil, system prompt
- Each prompt is ~100 words, instructs agent to respond in 2-3 sentences
- Include the user's query + the main AI response as context
- Total prompt: ~500 tokens input per agent → ~150 tokens output each

**Step 2.2** — Create `app/api/god-view/council/route.ts`
- Accepts: { query: string, response: string }
- Fires 5 parallel LLM calls using existing provider-selector
- Each call: system prompt (agent) + user message (query + response)
- Returns: { perspectives: [{ agent, sefirah, sigil, text }] }
- Uses cheaper model (fallback chain) to keep cost minimal

**Step 2.3** — Create `CouncilPanel.tsx` + `AgentCard.tsx`
- Triggered by user clicking "◊ Council" button on any response
- Shows loading skeleton (5 cards pulsing)
- Fills in as perspectives arrive
- Monochrome cards: sigil icon, agent name, sefirah subtitle, 2-3 lines
- Click any card to expand into full conversation with that agent

**Step 2.4** — Add "Council" toggle to response area
- New button next to MindMap toggle and God View toggle
- Icon: ◊ or small tree symbol
- Only appears for responses >100 words (skip for trivial queries)

**Step 2.5** — Agent conversation mode (stretch)
- Clicking an agent card opens a mini-chat (like existing MindMap mini-chat)
- Messages prepend the agent's system prompt
- User can drill deeper with one specific perspective
- Reuses existing SideMiniChat component pattern

### Token cost per query: ~3,500 tokens total (5 × 700)
### On free tier (50K/day): ~14 council activations per day
### Estimated effort: 3-4 days with cc

---

## PHASE 3 — Scenario Sandbox (Predict Anything)
**Days 90-100 | 2 new API routes, 1 new page | 5-7 API calls per prediction**

### What the user sees
A dedicated page (/sandbox or /predict) where users can:
1. Upload seed material (paste text, URL, or file)
2. Ask a "What if?" question in natural language
3. Watch AkhAI build a knowledge graph from the seed
4. See 3 scenario branches diverge on a visual timeline
5. Read prediction reports for each branch
6. Chat with any scenario's "world state"

### The Flow
```
┌──────────────────────────────────────────────────┐
│  SCENARIO SANDBOX                                │
│                                                  │
│  Seed: [paste text / URL / upload]               │
│  Question: "What if the Fed cuts rates by 50bps?"│
│                                                  │
│  [▶ Run Prediction]                              │
├──────────────────────────────────────────────────┤
│                                                  │
│  KNOWLEDGE GRAPH (extracted entities)             │
│  ┌─Federal Reserve─┐                             │
│  │                 ├──Interest Rates              │
│  │                 ├──Inflation                   │
│  └─────────────────┼──Markets                    │
│                    └──Housing                     │
│                                                  │
│  SCENARIO BRANCHES                               │
│                                                  │
│  ━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━                │
│           ┃                                      │
│     ┏━━━━━╋━━━━━┓                                │
│     ┃     ┃     ┃                                │
│   🟢Bull  ⚪Base  🔴Bear                          │
│   +12%    +3%    -8%                             │
│                                                  │
│  [Read Bull Report] [Read Base] [Read Bear]      │
│  [Chat with Bull World] [Chat with Base] [...]   │
└──────────────────────────────────────────────────┘
```

### Architecture

```
Step A: Seed → Entity Extraction (reuse Side Canal)
Step B: Entities → 3 Scenario Prompts (Chesed/Tiferet/Gevurah lenses)
Step C: 3 Parallel LLM calls → 3 Prediction Reports
Step D: Reports → Visual timeline + MindMap branches
Step E: User can chat with any scenario's "world state"
```

### Files to create
```
app/sandbox/page.tsx                    — Sandbox page (seed input + results)
app/api/god-view/predict/route.ts       — Orchestrator: extract → branch → report
app/api/god-view/scenario-chat/route.ts — Chat with a scenario's world state
components/god-view/SandboxInput.tsx     — Seed material input (text/URL/file)
components/god-view/ScenarioTimeline.tsx — Visual 3-branch divergence
components/god-view/ScenarioReport.tsx   — Prediction report card
components/god-view/ScenarioChat.tsx     — Chat with scenario (reuse MiniChat)
lib/god-view/scenario-engine.ts         — Prompt templates for 3 branches
```

### Step-by-step implementation

**Step 3.1** — Create `app/sandbox/page.tsx` (UI shell)
- Text area for pasting seed material (article, data, story)
- URL input field (auto-fetches via existing /api/fetch-url)
- Natural language question field: "What if...?"
- "Run Prediction" button
- Results area: knowledge graph + 3 scenario cards
- Add to navigation menu

**Step 3.2** — Create `lib/god-view/scenario-engine.ts`
- `extractEntities(seed)` — calls existing Side Canal extract
- `buildScenarioPrompts(entities, question)` — creates 3 prompts:
  - Bull/Optimistic (Chesed lens): "Assume the best outcomes..."
  - Base/Neutral (Tiferet lens): "Weigh evidence evenly..."
  - Bear/Pessimistic (Gevurah lens): "Assume worst case..."
- Each prompt includes: extracted entities, relationships, the question
- Output format: structured JSON with title, summary, key events, confidence

**Step 3.3** — Create `app/api/god-view/predict/route.ts`
- Step 1: Extract entities from seed (1 API call via Side Canal)
- Step 2: Build 3 scenario prompts from entities + question
- Step 3: Fire 3 parallel LLM calls (Promise.all)
- Step 4: Return { entities, scenarios: [bull, base, bear] }
- Uses SSE to stream progress: "Extracting entities..." → "Running scenarios..."
- Total: 4-5 API calls (1 extraction + 3 scenarios + optional summary)

**Step 3.4** — Create `ScenarioTimeline.tsx`
- Visual branching timeline using CSS/SVG (no library needed)
- Single trunk → splits into 3 branches at the "what if" point
- Each branch shows: scenario name, confidence %, key outcome
- Color coded: green (bull), gray (base), red (bear)
- Monochrome variant: use line weight instead of color

**Step 3.5** — Create `ScenarioReport.tsx`
- Expandable card for each scenario
- Sections: Summary, Key Events (timeline), Confidence, Assumptions
- "Chat with this world" button at bottom
- Clean monospace typography, no emojis (sigil markers only)

**Step 3.6** — Create `app/api/god-view/scenario-chat/route.ts`
- Accepts: { scenarioContext, messages }
- Prepends scenario world state as system prompt
- User chats as if inside that scenario's reality
- "You are in a world where [scenario]. Answer questions from within."
- Reuse existing streaming infrastructure

**Step 3.7** — Add to navigation + methodology integration
- Add "Sandbox" to NavigationMenu (between MindMap and Philosophy)
- Can also trigger from main chat: "predict: what if..." prefix
- Results link to full sandbox page with shareable URL

### Token cost per prediction: ~5,000 tokens total
### On free tier: ~10 predictions per day
### Estimated effort: 5-7 days with cc

---

## IMPLEMENTATION TIMELINE

```
Day 73-75: Phase 1 — SefirotTree + GodViewPanel (static + wired)
Day 76-78: Phase 1 — ActivityFeed + animations + polish
Day 79-80: Phase 1 — Ship, deploy, test on akhai.app
Day 81-83: Phase 2 — Agent definitions + /api/god-view/council
Day 84-86: Phase 2 — CouncilPanel UI + agent conversation mode
Day 87-88: Phase 2 — Ship, deploy, test
Day 89-91: Phase 3 — Sandbox page + entity extraction
Day 92-95: Phase 3 — Scenario engine + 3-branch prediction
Day 96-98: Phase 3 — ScenarioTimeline + Reports + Chat
Day 99-100: Phase 3 — Ship, deploy, full integration test
```

---

## KEY DESIGN RULES

1. **Monochrome** — No colorful gradients. Dark bg, light text, subtle glows
2. **Sigil markers** — ◊ △ ○ ☿ ⊕ instead of emojis
3. **Token efficient** — Max 7 API calls per feature activation
4. **Reuse everything** — Side Canal, MiniChat, SSE pipeline, provider-selector
5. **Progressive disclosure** — God View is opt-in, never forced
6. **Mobile responsive** — Panels collapse to accordion on small screens
7. **No new dependencies** — Use existing React Flow, Framer Motion, Tailwind

---

## WHY THIS IS A DIFFERENTIATOR

| Feature | Perplexity | ChatGPT | MiroFish | AkhAI God View |
|---------|-----------|---------|----------|----------------|
| Live reasoning viz | ✗ | ✗ | ✗ | ✅ Phase 1 |
| Multi-perspective | ✗ | ✗ | ✅ (1000s agents) | ✅ Phase 2 (5 archetypal) |
| Scenario prediction | ✗ | ✗ | ✅ (heavy compute) | ✅ Phase 3 (lightweight) |
| Kabbalistic framework | ✗ | ✗ | ✗ | ✅ Unique |
| Token cost per use | — | — | $$$$ | < $0.01 |
| Self-hostable | ✗ | ✗ | ✅ | ✅ |

AkhAI delivers the MiroFish "God View" experience at 1/1000th the compute
cost by using archetypal intelligence (Sefirot) instead of brute-force
agent swarms. Ancient wisdom as computational shortcut.

---

## NEXT ACTION

Start Phase 1: `cc` session to create the god-view component directory
and build SefirotTree.tsx with the 11-node Tree of Life layout.

Command to begin:
```bash
cd ~/akhai && cc
# First task: create components/god-view/SefirotTree.tsx
```
