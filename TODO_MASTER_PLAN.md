# AkhAI — UPDATED Master Plan v2
## Day 37/150 — Priority: Layer Calibration + Depth Annotations + Canvas

---

## 🔴 THE 3 CRITICAL DISCONNECTIONS FOUND

### 1. Layer Config = Cosmetic Behavioral Impact
**Status:** Weights now flow to API ✅ BUT `generateEnhancedSystemPrompt()` only says:
```
ACTIVE LAYERS: Netzach (80%)
Apply these computational layers with emphasis.
```
This is useless — the AI doesn't know WHAT "apply Netzach" means. When user slides creativity to 90%, the AI should get specific instructions like: "Prioritize creative exploration, use metaphors, explore unconventional angles, surprise the user."

**Root cause:** `intelligence-fusion.ts` line 634 — generic "Apply with emphasis" prompt
**Each layer needs behavioral instructions** mapped from `aiRole` in layer-registry.ts

### 2. Depth Annotations = Built but Never Rendered
**Status:** 1403-line library (`lib/depth-annotations.ts`) + React component (`DepthAnnotation.tsx` + `DepthSigil.tsx`) both exist and are imported in page.tsx... but `<DepthText>` is never actually used in the render tree.

**Root cause:** page.tsx imports `DepthText` (line 48) and `useDepthAnnotations` (line 49) but the message rendering uses raw markdown — never wraps content in `<DepthText>`

### 3. Canvas ↔ Text Mode = One-Way
**Status:** Canvas renders when toggled ✅ BUT:
- `onQuerySelect` → `console.log` (does nothing)
- `onNodeSelect` → `console.log` (does nothing)
- No data flows FROM canvas back to text mode
- Queries in text mode don't auto-populate canvas cards

---

## PHASE 1: LAYER CALIBRATION (Day 37) — THE DIFFERENTIATOR
*"When I increase creativity, output MUST be more creative"*

### Step 1.1: Define Behavioral Instructions per Layer
**File:** `lib/intelligence-fusion.ts` — `generateEnhancedSystemPrompt()`

Add a `LAYER_BEHAVIORS` map that translates each layer + weight into specific AI instructions:

```typescript
const LAYER_BEHAVIORS: Record<number, { low: string; high: string }> = {
  1: { // Embedding — Facts
    low: 'Minimize raw facts. Focus on synthesis over data.',
    high: 'Ground response in verified facts, data points, specific numbers. Cite sources.'
  },
  2: { // Executor — How-to
    low: 'Stay conceptual. Avoid step-by-step.',
    high: 'Be extremely practical. Give step-by-step instructions, CLI commands, code snippets.'
  },
  3: { // Classifier — Logic
    low: 'Avoid comparisons. Give direct answer.',
    high: 'Compare systematically. Use pros/cons, trade-off tables, decision matrices.'
  },
  4: { // Generative — Creativity ← THIS IS THE KEY ONE
    low: 'Stay conventional. Use standard approaches.',
    high: 'Be highly creative. Use metaphors, analogies, unconventional angles. Explore surprising connections. Think like an inventor.'
  },
  5: { // Attention — Integration
    low: 'Focus narrowly on the specific question.',
    high: 'Synthesize across domains. Connect ideas from different fields. Show big picture.'
  },
  6: { // Discriminator — Critical
    low: 'Be supportive. Minimize criticism.',
    high: 'Be critically rigorous. Challenge assumptions. Point out flaws, risks, and blind spots.'
  },
  7: { // Expansion — Possibilities
    low: 'Give the single best answer.',
    high: 'Explore multiple possibilities. Branch into scenarios. "What if" analysis.'
  },
  8: { // Encoder — Patterns
    low: 'Focus on surface level.',
    high: 'Identify deep patterns. Show structural similarities across systems. Reveal hidden structures.'
  },
  9: { // Reasoning — First Principles
    low: 'Accept premises at face value.',
    high: 'Reason from first principles. Question assumptions. Build arguments from fundamentals.'
  },
  10: { // Meta Core — Meta-cognition
    low: 'Just answer directly.',
    high: 'Reflect on the thinking process itself. Explain WHY you approached it this way. Show metacognitive awareness.'
  },
  11: { // Synthesis — Emergence
    low: 'Stay within established frameworks.',
    high: 'Seek emergent insights. Find the non-obvious truth. Deliver epiphanies.'
  }
}
```

### Step 1.2: Modify `generateEnhancedSystemPrompt()`
Instead of "Apply these computational layers with emphasis", generate specific instructions based on weight values:

```typescript
// For each layer with weight > 0.6 → inject HIGH instruction
// For each layer with weight < 0.3 → inject LOW instruction
// Middle weights (0.3-0.6) → no instruction (default behavior)
```

### Step 1.3: Verification Test Matrix
Send SAME query with different layer configs and compare outputs:

| Test | Query | Config | Expected Output Change |
|------|-------|--------|----------------------|
| A | "How to start a business?" | Creativity=90% | Metaphors, unconventional ideas |
| B | "How to start a business?" | Creativity=10% | Standard conventional advice |
| C | "How to start a business?" | Facts=90% | Data-heavy, statistics, citations |
| D | "How to start a business?" | Critical=90% | Risk warnings, challenges, flaws |
| E | "How to start a business?" | Reasoning=90% | First principles decomposition |

Each test: send query → capture response → compare tone/style/content.

---

## PHASE 2: DEPTH ANNOTATIONS (Day 37-38)
*"Sigils and annotations visible on every response"*

### Step 2.1: Wire DepthText into Message Rendering
**File:** `app/page.tsx` — find where `message.content` is rendered as markdown

Replace raw markdown rendering with `<DepthText>` wrapper that:
1. Parses response text through `buildAnnotatedSegments()`
2. Renders inline sigils (ᶠ ᵐ ᶜ ᵈ ˢ) next to annotated terms
3. Shows grey subtitle on hover/click

### Step 2.2: Enable Depth Processing in Pipeline
**File:** `app/api/simple-query/route.ts`

After AI response received, run depth analysis:
1. Call `analyzeForAnnotations(responseText)` from depth-annotations.ts
2. Store annotations in response metadata
3. Send via SSE to frontend

### Step 2.3: Depth Config UI
Add depth toggle in AI Config panel:
- Density: minimal / standard / maximum
- Types: fact ᶠ / metric ᵐ / connection ᶜ / detail ᵈ / source ˢ
- Show by default: on/off

---

## PHASE 3: CANVAS ↔ TEXT CONNECTION (Day 38-39)
*"Switching between text and canvas preserves everything"*

### Step 3.1: Query Cards Auto-Population
When query completes in text mode:
1. Auto-create QueryCard in canvas store
2. Card shows: query text, methodology, key insights
3. Cards are draggable on canvas

### Step 3.2: Canvas → Text Navigation
When user clicks query card on canvas:
1. Switch to text mode
2. Scroll to that query/response
3. Highlight the message

### Step 3.3: Visual Nodes from Side Canal
Topics extracted by Side Canal → auto-create visual nodes on canvas
Connected by relationship edges

---

## PHASE 4: EXISTING FIXES (Day 39-40)

### 4.1 Live Refinement Re-Query [P1]
- Clicking refine/enhance/correct re-sends current query with refinements
- Show "Refined ×2" badge on refined responses

### 4.2 DDG Search Verification [P2]
- Send 5 test queries, verify real results (not fallback)

### 4.3 Side Canal Deduplication [P3]
- Remove client-side extraction (server handles it)

---

## PHASE 5: MILESTONES 3-9 (Days 42-100)

| # | Milestone | Days | Description |
|---|-----------|------|-------------|
| M3 | Query Source Separation | 42-45 | Tag queries as user/refinement/system/continuation |
| M4 | Selection Tool (Cmd+Shift+4) | 45-48 | Screenshot-based visual query input |
| M5 | Mini Chat Code Agent | 48-55 | Code execution in mini-chat panel |
| M6 | Grimoire System | 55-75 | Project workspace with objectives/deadlines |
| M7 | Deploy + Testing | 75-100 | FlokiNET, Docker, CI/CD, E2E tests |
| M8 | Social Launch Prep | 100-121 | Landing page, demo video, community |

---

## PHASE 6: POST-LAUNCH (Days 121-150)
- Self-hosted model migration (Qwen 2.5-72B, Mistral)
- Hetzner GEX131 server procurement
- Stripe payments, tier enforcement
- User analytics dashboard

---

## IMMEDIATE NEXT ACTIONS (Day 37 Morning)

```
1. Add LAYER_BEHAVIORS map to intelligence-fusion.ts
2. Rewrite generateEnhancedSystemPrompt() to use behavioral instructions
3. Test: same query, different layer configs → verify output changes
4. Wire <DepthText> into message rendering in page.tsx
5. Test: depth sigils appear on response text
6. Wire canvas onQuerySelect/onNodeSelect to actual navigation
7. Commit + push
```

---

## VERIFICATION CHECKLIST

- [ ] Creativity slider HIGH → response is creative/metaphorical
- [ ] Creativity slider LOW → response is conventional/practical  
- [ ] Facts slider HIGH → response has data points and numbers
- [ ] Critical slider HIGH → response challenges assumptions
- [ ] Depth sigils (ᶠ ᵐ ᶜ) visible on response text
- [ ] Canvas shows query cards from text mode queries
- [ ] Clicking canvas card navigates to text response
- [ ] `npx next dev --turbopack` compiles clean
- [ ] AI Reasoning panel reflects layer config changes
