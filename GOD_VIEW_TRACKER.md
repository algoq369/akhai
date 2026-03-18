# ◊ AkhAI GOD VIEW — Complete Implementation Tracker
# Day 73-105 | 4 Phases | AI Computational Architecture
# Based on March 2026 Technology Landscape Research
# Last updated: March 18, 2026

---

## STATUS OVERVIEW

| Phase | Feature | Days | Est. Hours | Status |
|-------|---------|------|-----------|--------|
| 1 | Neural Tree God View (live query viz) | 73-80 | ~16h | ⬜ NOT STARTED |
| 2 | Perspective Council (multi-agent reasoning) | 81-88 | ~20h | ⬜ NOT STARTED |
| 3 | Scenario Sandbox (predict anything) | 89-98 | ~28h | ⬜ NOT STARTED |
| 4 | Voice Integration (input + output) | 99-105 | ~14h | ⬜ NOT STARTED |

---

## AI COMPUTATIONAL LAYER MAP (used throughout this doc)

| Layer ID | AI Name | Role | Agent Archetype |
|----------|---------|------|----------------|
| 1 | Meta-Core | Meta-cognition, final output | The Orchestrator |
| 2 | Reasoning | Problem decomposition | The Visionary |
| 3 | Encoder | Fact retrieval, knowledge | The Analyst |
| 4 | Expansion | Creative exploration | The Advocate |
| 5 | Discriminator | Critical analysis, Guard | The Skeptic |
| 6 | Attention | Integration & synthesis | The Synthesizer |
| 7 | Generative | Response crafting | — |
| 8 | Classifier | Relationship mapping | — |
| 9 | Executor | Semantic understanding | — |
| 10 | Embedding | Input parsing | — |
| 11 | Synthesis | Self-checking, verification | — |

---

## EXISTING ASSETS (already built, reuse everything)

Neural Tree page: `app/tree-of-life/page.tsx` (1733 lines)
- 11 nodes with x/y positions in `treePositions` record
- 22 paths in `treePaths` array (Layer-to-Layer connections)
- Layer activation colors + weights already wired to SSE
- Full layer dictionary in `components/OriginTerm.tsx`

SSE metadata from `app/api/simple-query/route.ts` already emits:
- `layerActivations[]` — effectiveWeight, keywords, activated boolean
- `dominantLayers[]` — which layers fired strongest
- `pathActivations[]` — from/to/strength between layers
- `methodologyScores[]` — scored + ranked methodology candidates
- `guardReasons[]` — anti-hallucination detection results
- `confidence` — overall fusion confidence percentage
- `processingMode`, `activeLenses` — current reasoning mode

Intelligence fusion: `lib/intelligence-fusion.ts` (450 lines)
Provider selector: `lib/provider-selector.ts` (Claude Opus 4.6 + OpenRouter)
AI layers: `lib/ai-layers.ts` (11 layers with full metadata)
Current LLM: Claude Opus 4.6 via @anthropic-ai/sdk (direct SDK)

========================================================================
## PHASE 1 — NEURAL TREE GOD VIEW (Live Query Visualization)
## Days 73-80 | ~16h | 0 new API calls | Frontend only
========================================================================

### CONCEPT
Enhance the existing AI Computational Tree into a real-time reasoning
dashboard. When a query runs, the user watches layers light up, paths
activate, the Guard system pulse, and methodology routes through the
neural tree — like watching an AI brain think in real-time.
Uses EXISTING SSE metadata. Zero new API calls.

### STEP 1.1 — Extract reusable GodViewTree component (Day 73, ~2h)
Task: Extract tree rendering from tree-of-life/page.tsx (lines 300-370)
into a standalone reusable component
Source: treePositions, treePaths, node rendering, SVG path drawing
Props interface:
  activations: Record<Layer, number>   // 0-100 weight per layer
  dominantLayers: Layer[]              // which layers are dominant
  pathActivations: {from, to, strength}[]  // active connections
  isLive: boolean                      // static vs real-time mode
  compact: boolean                     // full page vs side panel size
Key: Keep static mode for /tree-of-life, add live mode for God View

FILES:
  CREATE  components/god-view/GodViewTree.tsx
  MODIFY  app/tree-of-life/page.tsx → import GodViewTree, remove inline

### STEP 1.2 — Create GodViewPanel slide-in overlay (Day 73, ~2h)
Task: Side panel slides in from right on main chat page
Trigger: New "◊" eye icon button next to existing mindmap toggle
Layout: 400px wide, Neural Tree on top (60%), Activity Feed below (40%)
State: New Zustand store for panel open/close + live activation data

FILES:
  CREATE  components/god-view/GodViewPanel.tsx
  CREATE  lib/stores/god-view-store.ts
  MODIFY  app/page.tsx → add toggle button + conditional render

### STEP 1.3 — Wire SSE metadata to live tree (Day 74, ~3h)
Task: Subscribe to existing SSE events and feed activation data to tree
Source: In page.tsx, the SSE reader already parses routing events.
When stage === 'routing', dispatch layer data to god-view-store:
  - layerDetails[num].weight → node glow intensity
  - layerDetails[num].activated → node highlight
  - pathActivations[].from/to → animated path connections
  - dominantLayers[] → strongest glow nodes
  - guardReasons[] → Discriminator layer pulse
Approach: Add 5-line dispatcher in SSE reader → god-view-store action

FILES:
  MODIFY  app/page.tsx → add dispatch in SSE reader loop
  MODIFY  lib/stores/god-view-store.ts → add setActivations action

### STEP 1.4 — Create ActivityFeed event log (Day 75, ~2h)
Task: Scrolling monospace log showing system events as they happen
Format: Sigil-marked entries (no emojis, no color, monochrome):
  "◊ Meta-Core initiated — weight 0.85"
  "△ Discriminator Guard: drift score 0.03 — PASS"
  "→ Methodology: ReAct Agent selected (92% confidence)"
  "◇ Side Canal: 4 topics extracted"
  "⊕ Expansion layer active — creative mode engaged"
Source: Same SSE events, reformatted as log lines
Design: Dark bg, monospace 9px, auto-scroll, max 50 lines

FILES:
  CREATE  components/god-view/ActivityFeed.tsx

### STEP 1.5 — Animation pass (Day 76-77, ~4h)
Task: CSS transitions + Framer Motion for node/path activation
Animations (all subtle, monochrome minimalism):
  - Node glow: opacity 0.3→1 + scale 1→1.08 when weight > 30%
  - Path pulse: SVG stroke-dashoffset animation along active paths
  - Guard pulse: red ring animation on Discriminator during checking
  - Methodology highlight: brighter glow on active reasoning path
  - Sequential cascade: nodes light up in processing order with 100ms delay
Uses: Existing Framer Motion (already in package.json)

FILES:
  MODIFY  components/god-view/GodViewTree.tsx → motion.div wrappers
  CREATE  components/god-view/god-view.css → keyframe animations

### STEP 1.6 — Mobile responsive + polish (Day 78, ~2h)
Task: Panel adapts to mobile screens
Mobile: Full-width bottom drawer, 60vh, swipe-to-dismiss
Desktop: 400px right panel, smooth slide-in transition
Touch: Disable custom cursor, tap-friendly node sizes

### STEP 1.7 — Deploy + verify (Day 79-80, ~2h)
```bash
cd ~/akhai && git add -A && git commit -m "feat: God View Phase 1 — live Neural Tree visualization"
./deploy/quick-deploy.sh
```
Test: Open God View panel → run a query → watch tree light up

### PHASE 1 CHECKLIST
- [ ] GodViewTree.tsx (extracted + live mode)
- [ ] GodViewPanel.tsx (slide-in container)
- [ ] ActivityFeed.tsx (sigil event log)
- [ ] god-view-store.ts (Zustand state)
- [ ] SSE → store wiring in page.tsx
- [ ] Animations (Framer Motion + CSS)
- [ ] Mobile responsive
- [ ] Deployed to akhai.app


========================================================================
## PHASE 2 — PERSPECTIVE COUNCIL (Multi-Agent Reasoning)
## Days 81-88 | ~20h | 1 new API route | 5 LLM calls per activation
========================================================================

### CONCEPT
5 AI computational agents, each mapped to a core reasoning layer,
analyze the same query from fundamentally different perspectives.
Uses the 4+1 fan-out/fan-in pattern validated by MoA research:
4 perspective agents run in parallel → 1 synthesizer aggregates.
Different LLM providers = genuine analytical diversity.

### THE 5 COMPUTATIONAL AGENTS

| Agent | AI Layer | Role | LLM Provider | Cost/call |
|-------|----------|------|-------------|-----------|
| The Visionary | Reasoning | Novel connections, intuition | Claude Sonnet 4.6 | ~$0.02 |
| The Analyst | Encoder | Data patterns, structure | Claude Sonnet 4.6 | ~$0.02 |
| The Advocate | Expansion | Opportunities, best case | Gemini 2.5 Pro | ~$0.01 |
| The Skeptic | Discriminator | Risks, flaws, constraints | DeepSeek V3.2 | ~$0.001 |
| The Synthesizer | Attention | Integrates all perspectives | Claude Sonnet 4.6 | ~$0.02 |

Total per Council activation: ~$0.07 (5 calls)
On free tier (50K tokens/day): ~10 activations/day

### STEP 2.1 — Install Vercel AI SDK + providers (Day 81, ~1h)
Task: Add multi-provider orchestration layer
```bash
cd ~/akhai/packages/web
pnpm add ai @ai-sdk/anthropic @ai-sdk/google @ai-sdk/openai
```
Why: Provider-agnostic generateText(), parallel execution, streaming.
Research says: No framework needed. Promise.all + AI SDK = 50 lines.
Keep existing @anthropic-ai/sdk for main queries (don't break anything).

FILES:
  MODIFY  packages/web/package.json → new deps

### STEP 2.2 — Create agent definitions (Day 81, ~2h)
Task: Define 5 agents with system prompts, layer mapping, model config
Each agent prompt is ~100 words instructing:
  - What perspective to analyze from
  - Output format: 2-3 sentences, specific to their lens
  - Constraints: no overlap with other agents' domains
Include: agent name, sigil icon, AI layer ID, model provider, prompt

FILES:
  CREATE  lib/god-view/agents.ts

### STEP 2.3 — Create Council API route (Day 82-83, ~4h)
Task: POST /api/god-view/council
Input: { query: string, response: string, topics?: string[] }
Process:
  1. Build 4 perspective prompts (query + main response as context)
  2. Fire 4 parallel calls via Promise.all(perspectives.map(generateText))
  3. Collect 4 results
  4. Fire 1 synthesis call (Attention/Synthesizer) with all 4 as input
  5. Return { perspectives: [...], synthesis: string }
Key: Use prompt caching for shared preamble (saves ~40% cost)
Error handling: If any provider fails, gracefully exclude that perspective

FILES:
  CREATE  app/api/god-view/council/route.ts

### STEP 2.4 — Create CouncilPanel + AgentCard UI (Day 84-85, ~5h)
Task: Panel below main response showing 5 perspective cards
Layout: 2-column grid (4 agents) + full-width synthesis row below
Each AgentCard shows:
  - Sigil icon (◊ △ ○ ⊕ ☿) + agent name + layer subtitle
  - 2-3 sentence perspective text
  - "Drill deeper →" button
Design: Monochrome cards, rounded rectangles, 9-10px monospace text
Loading: Skeleton shimmer while perspectives generate
Trigger: "◊ Council" button appears on responses >100 words

FILES:
  CREATE  components/god-view/CouncilPanel.tsx
  CREATE  components/god-view/AgentCard.tsx
  MODIFY  app/page.tsx → add Council toggle button per response

### STEP 2.5 — Agent drill-down conversation (Day 86, ~3h)
Task: Click any agent card → opens mini-chat with that perspective
Reuse: Existing SideMiniChat / QuickChatPanel pattern
System prompt: Agent's perspective prompt + original query context
User can ask follow-ups to one specific reasoning agent
Example: Click "The Skeptic" → "What specific evidence is missing?"

FILES:
  CREATE  components/god-view/AgentChat.tsx
  MODIFY  app/api/god-view/council/route.ts → add /chat sub-handler

### STEP 2.6 — Wire Council to God View tree (Day 87, ~2h)
Task: When Council activates, light up the 5 relevant nodes on the tree
The Visionary lights up Reasoning node
The Analyst lights up Encoder node
The Advocate lights up Expansion node
The Skeptic lights up Discriminator node
The Synthesizer lights up Attention node
Shows which parts of the "AI brain" each agent represents

FILES:
  MODIFY  lib/stores/god-view-store.ts → add council activation state
  MODIFY  components/god-view/GodViewTree.tsx → highlight council nodes

### STEP 2.7 — Deploy + verify (Day 88, ~2h)
```bash
cd ~/akhai && git add -A && git commit -m "feat: God View Phase 2 — Perspective Council with multi-provider agents"
./deploy/quick-deploy.sh
```
Test: Run query → click Council → see 5 perspectives appear → drill into one
Verify: Check costs in provider dashboards (should be ~$0.07/activation)

### PHASE 2 CHECKLIST
- [ ] Vercel AI SDK + providers installed
- [ ] agents.ts (5 agent definitions + prompts)
- [ ] /api/god-view/council route (4+1 fan-out/fan-in)
- [ ] CouncilPanel.tsx + AgentCard.tsx
- [ ] Agent drill-down chat (AgentChat.tsx)
- [ ] Tree node highlighting for active agents
- [ ] Deployed to akhai.app


========================================================================
## PHASE 3 — SCENARIO SANDBOX (Predict Anything)
## Days 89-98 | ~28h | 2 new API routes | 5-7 LLM calls per prediction
========================================================================

### CONCEPT
Dedicated /sandbox page where users upload seed material (article, data,
story) + ask a "What if?" question. AkhAI extracts entities via existing
Side Canal, then runs 3 scenario branches through different reasoning
lenses: Expansion (bull/optimistic), Attention (base/balanced),
Discriminator (bear/pessimistic). Visual branching timeline shows
divergent futures with confidence scores. Chat with any scenario's
"world state." Covers: financial/crypto, geopolitical, creative fiction.

### THE 3 SCENARIO BRANCHES

| Branch | AI Layer Lens | Role | Prompt Flavor |
|--------|-------------|------|---------------|
| Optimistic | Expansion | Best-case outcomes | "Assume favorable conditions..." |
| Balanced | Attention | Evidence-weighted median | "Weigh all factors evenly..." |
| Pessimistic | Discriminator | Worst-case risks | "Assume worst-case constraints..." |

Total per prediction: ~$0.10-0.15 (1 extraction + 3 scenarios + 1 summary)
On Pro tier (1M tokens/day): ~50 predictions/day

### STEP 3.1 — Create Sandbox page shell (Day 89-90, ~4h)
Task: New page at /sandbox with:
  - Seed input: textarea for pasting text (article, report, story)
  - URL input: auto-fetch via existing /api/fetch-url endpoint
  - File upload: drag-drop area (reuse existing upload component)
  - Question field: "What if...?" natural language input
  - Domain selector: Financial | Geopolitical | Creative | Auto-detect
  - "Run Prediction" button with loading state
  - Results area: entity graph + 3 scenario cards + chat

FILES:
  CREATE  app/sandbox/page.tsx
  CREATE  components/god-view/SandboxInput.tsx
  MODIFY  components/NavigationMenu.tsx → add Sandbox link

### STEP 3.2 — Create scenario engine (Day 90-91, ~4h)
Task: Core logic for entity extraction → branch prompts → prediction
Functions:
  extractEntities(seed) — calls existing /api/side-canal/extract
  buildBranchPrompts(entities, question, domain) — creates 3 prompts
  Each prompt includes: extracted entities, relationships, the question,
  domain-specific reasoning instructions
Output format per branch: JSON with:
  { title, summary, keyEvents[], confidence, assumptions[], risks[] }

FILES:
  CREATE  lib/god-view/scenario-engine.ts

### STEP 3.3 — Create Predict API route with SSE (Day 92-93, ~5h)
Task: POST /api/god-view/predict — orchestrator with streaming progress
Process (SSE events for each step):
  1. event: "extracting" → Parse seed material, extract entities (1 call)
  2. event: "entities" → Return extracted entities + relationships
  3. event: "branching" → Build 3 scenario prompts from entities
  4. event: "optimistic" → Fire Expansion-lens prediction (1 call)
  5. event: "balanced" → Fire Attention-lens prediction (1 call)
  6. event: "pessimistic" → Fire Discriminator-lens prediction (1 call)
  7. event: "complete" → All 3 scenarios ready
Steps 4-6 run in parallel via Promise.all for speed (~3-5 seconds)
Use: Vercel AI SDK generateText() with multi-provider (from Phase 2)

FILES:
  CREATE  app/api/god-view/predict/route.ts

### STEP 3.4 — Create ScenarioTimeline visualization (Day 94, ~3h)
Task: Visual branching timeline showing 3 divergent futures
Design: Single trunk → splits into 3 branches at the "what if" point
  Trunk: solid line from seed to branch point
  Optimistic branch: upward arc, labeled with outcome + confidence %
  Balanced branch: horizontal continuation
  Pessimistic branch: downward arc
Implementation: Pure CSS + SVG (no library needed)
  Path elements with stroke-dasharray animation for "growing" branches
Interaction: Click a branch to expand its full report
Color: Monochrome (line weight + opacity, not traffic-light colors)

FILES:
  CREATE  components/god-view/ScenarioTimeline.tsx

### STEP 3.5 — Create ScenarioReport card (Day 95, ~3h)
Task: Expandable report card for each scenario branch
Sections (all monospace, sigil markers only):
  ◊ Summary — 2-3 paragraph prediction narrative
  → Key Events — numbered timeline of predicted developments
  △ Confidence — percentage with reasoning
  ○ Assumptions — what this scenario requires to be true
  ⊕ Risks — what could invalidate this prediction
Bottom: "Chat with this world →" button

FILES:
  CREATE  components/god-view/ScenarioReport.tsx

### STEP 3.6 — Create ScenarioChat (Day 96, ~3h)
Task: Chat with a scenario's "world state"
API: POST /api/god-view/scenario-chat
System prompt: "You exist in a world where [scenario summary].
The following events have occurred: [key events]. Answer questions
as if you are an analyst living inside this predicted future."
Reuse: Existing streaming infrastructure + QuickChatPanel pattern
User asks: "In this scenario, what happens to BTC?" → answers from
within that scenario's predicted reality

FILES:
  CREATE  app/api/god-view/scenario-chat/route.ts
  CREATE  components/god-view/ScenarioChat.tsx

### STEP 3.7 — Entity graph visualization (Day 97, ~3h)
Task: Show extracted entities + relationships as a mini knowledge graph
above the scenario branches. Users see what AkhAI understood from seed.
Implementation: Reuse existing MindMap component (MindMapDiagramView)
or simple force-directed layout with existing React Flow
Nodes: Entity names | Edges: Relationship labels
Interaction: Click entity → highlight across all 3 scenarios

FILES:
  MODIFY  app/sandbox/page.tsx → add entity graph section

### STEP 3.8 — Main chat integration (Day 97, ~2h)
Task: Users can trigger predictions from main chat with prefix
Detect: "predict:" or "what if" prefix in query input
Auto-redirect to /sandbox with pre-filled question
Or: inline prediction panel in response area (simpler)

FILES:
  MODIFY  app/page.tsx → detect predict prefix → route to sandbox

### STEP 3.9 — Deploy + test all domains (Day 98, ~2h)
```bash
cd ~/akhai && git add -A && git commit -m "feat: God View Phase 3 — Scenario Sandbox with 3-branch prediction"
./deploy/quick-deploy.sh
```
Test scenarios:
  Financial: "What if BTC breaks $150K by Q3 2026?"
  Geopolitical: "What if EU imposes AI compute export restrictions?"
  Creative: "What if the protagonist discovers the letter was forged?"

### PHASE 3 CHECKLIST
- [ ] /sandbox page with seed input (text/URL/file)
- [ ] scenario-engine.ts (extract → branch → predict)
- [ ] /api/god-view/predict route (SSE streaming)
- [ ] ScenarioTimeline.tsx (3-branch visual)
- [ ] ScenarioReport.tsx (expandable cards)
- [ ] ScenarioChat.tsx (chat with world state)
- [ ] Entity graph visualization
- [ ] Main chat "predict:" integration
- [ ] Deployed + tested across all 3 domains


========================================================================
## PHASE 4 — VOICE INTEGRATION (Input + Output)
## Days 99-105 | ~14h | Browser APIs first, cloud APIs later
========================================================================

### CONCEPT
Two-way voice: speak queries instead of typing (STT) + listen to
responses read aloud (TTS). Phase in from free browser APIs to
production cloud APIs to self-hosted sovereignty.

### VOICE TECHNOLOGY DECISIONS (from research)

| Function | Phase A (free) | Phase B (production) | Phase C (sovereign) |
|----------|---------------|---------------------|-------------------|
| STT | Browser Web Speech API | Deepgram Nova-3 ($0.004/min) | Whisper V3 Turbo (self-hosted) |
| TTS | Browser SpeechSynthesis | OpenAI TTS-1 ($15/M chars) | Qwen3-TTS (self-hosted, Apache 2.0) |
| Cost | $0/month | ~$5-20/month | ~$200-500/mo GPU |

We implement Phase A now (Days 99-105), upgrade later.

### STEP 4.1 — Voice input button with Web Speech API (Day 99-100, ~4h)
Task: Mic icon button next to text input. Press to speak, release to stop.
Uses: Browser SpeechRecognition API (Chrome/Edge, sends to Google)
Fallback: Show "Voice not supported" tooltip on Firefox/Safari
Behavior:
  - Tap mic → red recording indicator → speak → text appears in input
  - Auto-submit after 1.5s silence (configurable)
  - Cancel: tap mic again while recording
  - Interim results show as faded text while speaking
Accessibility: Keyboard shortcut (Cmd+Shift+V) to toggle

FILES:
  CREATE  components/god-view/VoiceInputButton.tsx
  CREATE  lib/voice/speech-recognition.ts (wrapper with fallback)
  MODIFY  components/home/InputSection.tsx → add mic button

### STEP 4.2 — Voice output button with SpeechSynthesis (Day 101-102, ~4h)
Task: Speaker icon on each response. Tap to read aloud, tap to stop.
Uses: Browser SpeechSynthesis API (works in all modern browsers)
Behavior:
  - Speaker icon appears on every AI response
  - Tap → reads response aloud with system voice
  - Highlights current sentence being read (optional)
  - Tap again to stop
  - Voice selector: dropdown to pick from system voices
AkhAI twist: Different voice for different agents in Council mode
  The Skeptic gets a deeper voice, The Visionary gets higher pitch

FILES:
  CREATE  components/god-view/VoiceOutputButton.tsx
  CREATE  lib/voice/speech-synthesis.ts (wrapper with voice selection)
  MODIFY  app/page.tsx → add speaker button per response message

### STEP 4.3 — Voice settings + preferences (Day 103, ~2h)
Task: Voice preferences in settings page
Options:
  - Enable/disable voice input
  - Enable/disable voice output
  - Auto-read responses (toggle)
  - Voice speed (0.5x to 2x)
  - Preferred voice (from system list)
Store: localStorage scoped per userId (existing pattern)

FILES:
  MODIFY  app/settings/page.tsx → add voice settings section
  CREATE  lib/voice/voice-preferences.ts

### STEP 4.4 — Cloud API upgrade path (Day 104, ~2h, optional)
Task: Prepare upgrade hooks for production voice APIs
Create: Abstract interface in speech-recognition.ts and speech-synthesis.ts
  so swapping Browser API → Deepgram / OpenAI TTS is a config change
Add: ENV vars for DEEPGRAM_API_KEY, OPENAI_TTS_KEY (unused until needed)
Future: When investing in UX, swap providers with zero code changes
Sovereign path: Qwen3-TTS on Hetzner GPU replaces OpenAI TTS

### STEP 4.5 — Deploy + verify (Day 105, ~2h)
```bash
cd ~/akhai && git add -A && git commit -m "feat: God View Phase 4 — voice input + output (browser APIs)"
./deploy/quick-deploy.sh
```
Test: Click mic → speak "What is quantum computing" → text appears → submit
Test: Click speaker on response → hear it read aloud

### PHASE 4 CHECKLIST
- [ ] VoiceInputButton.tsx (mic icon + Web Speech API)
- [ ] VoiceOutputButton.tsx (speaker icon + SpeechSynthesis)
- [ ] speech-recognition.ts (wrapper + fallback)
- [ ] speech-synthesis.ts (wrapper + voice selection)
- [ ] Voice settings in /settings page
- [ ] Cloud API upgrade hooks (Deepgram + OpenAI TTS ready)
- [ ] Deployed to akhai.app


========================================================================
## FULL TIMELINE SUMMARY
========================================================================

```
Day 73  ┃ P1: Extract GodViewTree + create GodViewPanel
Day 74  ┃ P1: Wire SSE metadata → live tree activations
Day 75  ┃ P1: ActivityFeed event log component
Day 76  ┃ P1: Animation pass (node glow, path pulse, Guard pulse)
Day 77  ┃ P1: Animation polish + sequential cascade effect
Day 78  ┃ P1: Mobile responsive (bottom drawer)
Day 79  ┃ P1: Deploy + test on akhai.app
Day 80  ┃ P1: Bug fixes + final polish
        ┃
Day 81  ┃ P2: Install Vercel AI SDK + create agent definitions
Day 82  ┃ P2: Council API route (4+1 fan-out/fan-in)
Day 83  ┃ P2: Council API route (error handling, prompt caching)
Day 84  ┃ P2: CouncilPanel + AgentCard UI
Day 85  ┃ P2: CouncilPanel polish + loading states
Day 86  ┃ P2: Agent drill-down chat (AgentChat.tsx)
Day 87  ┃ P2: Wire Council → tree node highlighting
Day 88  ┃ P2: Deploy + verify + cost check
        ┃
Day 89  ┃ P3: Sandbox page shell + SandboxInput component
Day 90  ┃ P3: Sandbox page polish + navigation link
Day 91  ┃ P3: Scenario engine (extract → branch → prompts)
Day 92  ┃ P3: Predict API route (SSE streaming progress)
Day 93  ┃ P3: Predict API route (parallel branches + error handling)
Day 94  ┃ P3: ScenarioTimeline visualization (SVG branches)
Day 95  ┃ P3: ScenarioReport expandable cards
Day 96  ┃ P3: ScenarioChat (chat with world state)
Day 97  ┃ P3: Entity graph viz + main chat "predict:" integration
Day 98  ┃ P3: Deploy + test (finance, geopolitical, creative)
        ┃
Day 99  ┃ P4: VoiceInputButton + speech-recognition.ts
Day 100 ┃ P4: Voice input polish (interim results, auto-submit)
Day 101 ┃ P4: VoiceOutputButton + speech-synthesis.ts
Day 102 ┃ P4: Voice output polish (sentence highlighting, stop)
Day 103 ┃ P4: Voice settings + preferences page
Day 104 ┃ P4: Cloud API upgrade hooks (abstract interfaces)
Day 105 ┃ P4: Deploy + full voice integration test
```

## COST ANALYSIS

| Feature | API Calls/use | Cost/use | Daily budget (free) | Daily budget (Pro) |
|---------|-------------|----------|--------------------|--------------------|
| Normal query | 1 | ~$0.02 | 2,500 queries | unlimited |
| God View (Phase 1) | 0 | $0.00 | unlimited | unlimited |
| Council (Phase 2) | 5 | ~$0.07 | ~14 activations | ~285 activations |
| Sandbox (Phase 3) | 5-7 | ~$0.12 | ~8 predictions | ~166 predictions |
| Voice (Phase 4) | 0 (browser) | $0.00 | unlimited | unlimited |

## FILE CREATION MAP (all new files)

```
components/god-view/
  GodViewTree.tsx         Phase 1  Reusable Neural Tree (extracted)
  GodViewPanel.tsx        Phase 1  Slide-in panel container
  ActivityFeed.tsx        Phase 1  Sigil event log
  god-view.css            Phase 1  Keyframe animations
  CouncilPanel.tsx        Phase 2  5-agent perspective grid
  AgentCard.tsx           Phase 2  Single perspective card
  AgentChat.tsx           Phase 2  Drill-down conversation
  SandboxInput.tsx        Phase 3  Seed material input
  ScenarioTimeline.tsx    Phase 3  3-branch visual divergence
  ScenarioReport.tsx      Phase 3  Prediction report card
  ScenarioChat.tsx        Phase 3  Chat with scenario world
  VoiceInputButton.tsx    Phase 4  Mic button (STT)
  VoiceOutputButton.tsx   Phase 4  Speaker button (TTS)

lib/god-view/
  agents.ts               Phase 2  5 agent definitions + prompts
  scenario-engine.ts      Phase 3  Extract → branch → predict logic

lib/stores/
  god-view-store.ts       Phase 1  Zustand state for panel + activations

lib/voice/
  speech-recognition.ts   Phase 4  STT wrapper (browser → cloud → sovereign)
  speech-synthesis.ts     Phase 4  TTS wrapper (browser → cloud → sovereign)
  voice-preferences.ts    Phase 4  User voice settings

app/api/god-view/
  council/route.ts        Phase 2  4+1 multi-agent reasoning
  predict/route.ts        Phase 3  Scenario prediction orchestrator
  scenario-chat/route.ts  Phase 3  Chat with predicted world

app/sandbox/
  page.tsx                Phase 3  Prediction sandbox page
```

## START COMMAND

```bash
cd ~/akhai && cc
# "Read GOD_VIEW_TRACKER.md. Start Phase 1, Step 1.1:
#  Extract GodViewTree from tree-of-life/page.tsx lines 300-370
#  into components/god-view/GodViewTree.tsx with live mode props."
```
