# AkhAI — DEFINITIVE FIX (from real API data audit)
# Read /Users/sheirraza/akhai/CLAUDE.md for project rules.
# WORKFLOW: Fix each, test, commit SEPARATELY.

## VERIFIED ROOT CAUSES (from actual query test data)

API response shows:
- gnostic.layerAnalysis.activations: {6: 0.3, 7: 0.3, 8: 0.3} (only 3 layers)
- fusion.layerActivations: 5 entries, all ~0.07 (7%) — tree shows "0%"
- response: plain text, NO [TECHNICAL]/[DRAFT] tags, NO markdown
- sideCanal.topicsExtracted: false, suggestions: 0
- guard: all scores 0

## FIX 1: Tree activation display (tree shows 0%)

File: components/LayerResponse.tsx (or wherever tree % is rendered)
Problem: fusion weights are 0.07 (7%) but display shows "0%"
Also: gnostic activations use numeric keys ("6", "7", "8") not layer names

Fix: In the getActivationsForMessage function (app/page.tsx ~line 72):
- PRIORITY 1: Use gnostic.layerAnalysis.activations (values 0.3 = 30%)
- PRIORITY 2: Use fusion.layerActivations (values 0.07 = 7%)  
- Map numeric keys to layer names: 6=attention, 7=generative, 8=classifier
- Display: multiply by 100 and show as percentage with at least 1 decimal
- Minimum display: if weight > 0.01, show it (don't round to 0%)

COMMIT: git add -A && git commit -m "fix: tree displays correct activation percentages from gnostic data"

## FIX 2: Remove duplicate LIVE REFINEMENT

There are TWO refinement UIs showing:
A) Inline buttons per message (page.tsx ~line 2171): refine/enhance/correct/expand
B) LiveRefinementCanal component (page.tsx ~line 2589): collapsible panel with input

REMOVE the LiveRefinementCanal component mount (line 2589).
KEEP the inline buttons per message (line 2171) — they're cleaner and contextual.
The inline buttons already call handleRefinement which works.

Also remove the import at line 60: import LiveRefinementCanal from ...

COMMIT: git add -A && git commit -m "fix: remove duplicate live refinement — keep inline buttons only"

## FIX 3: Depth annotations for plain text responses

The "direct" methodology returns PLAIN TEXT with no tags.
Current patterns only match [TECHNICAL], [STRATEGIC], bold, bullets, etc.

In lib/depth-annotations.ts, add patterns for PLAIN TEXT detection:
- Sentences containing numbers/stats → metric annotation (◊)
- Sentences with comparison words (vs, compared, whereas, unlike) → connection (○)
- Sentences with causal words (because, therefore, causes, results in) → reasoning (→)
- Sentences with uncertainty (may, might, could, potentially) → caveat (△)
- Technical terms (2+ word capitalized phrases, acronyms of 3+ chars) → detail (⊕)

These patterns work on ANY text, not just structured responses.
Keep existing tag patterns too — they stack.

Minimum 3 annotations per response over 200 chars.

COMMIT: git add -A && git commit -m "fix: depth annotations work on plain text — detect stats, comparisons, causation"

## FIX 4: Metadata visible DURING processing (like Claude thinking)

Currently ProcessingIndicator (line 2072) only shows when isStreaming && !content.
Once content arrives, it vanishes.

CHANGE: Keep a compact metadata line visible DURING and AFTER streaming.
In components/MetadataStrip.tsx:
- DURING streaming (isStreaming=true): Show live SSE stage with animation
  Format: "◊ Analyzing... → Routing through direct (70%) → Generating..."
- AFTER streaming (isStreaming=false): Show compact summary line
  Format: "◊ direct · 70% · △ passed · → analysis 30% · ○ 667 chars · 8.2s · $0.00"

The MetadataStrip is already mounted at page.tsx line 2129.
It just needs to show DURING streaming too, not just after.

Currently gated by: pipelineEnabled && !hiddenPipelines.has(message.id)
Add: also show when message.isStreaming (for live stage display)

In MetadataStrip.tsx itself:
- Read currentMetadata from side-canal-store (SSE events during processing)
- Show the CURRENT stage as an animated line
- After response complete: switch to compact summary using responseMetadata

COMMIT: git add -A && git commit -m "feat: metadata strip visible during AND after processing — live thinking display"

## FIX 5: Insight/Mindmap panels fallback content

When Side Canal returns 0 topics and content has no structure:
- Insight tab: Show a basic content summary instead of empty
  Extract key sentences (first + last sentence of each paragraph)
  Display as simple text insight, not a graph
- Mindmap tab: Extract nouns/entities from plain text using regex
  Display as simple word cloud or flat topic list
  Even 3-4 extracted terms is better than blank

In components/InsightMindmap.tsx:
- If shouldShowInsightMap returns false BUT content > 200 chars,
  show a simplified "Quick Analysis" view with extracted key points

In components/ResponseMindmap.tsx:
- If no Side Canal topics, extract entities from content
  Pattern: capitalized phrases, quoted terms, numbers with units
  Show as flat list with "Extracted concepts" label

COMMIT: git add -A && git commit -m "fix: Insight/Mindmap show extracted content when Side Canal returns empty"

## VERIFICATION (run after all fixes)

Restart:
  lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 2
  cd /Users/sheirraza/akhai/packages/web && rm -rf .next
  NODE_ENV=development npx next dev --turbopack -p 3000

Test checklist:
1. Submit "what is quantum computing" with direct methodology
2. AI Layers tree shows activations > 0% (at least 3 nodes lit up)
3. Only ONE refinement UI (inline buttons per message, NOT a separate panel)
4. Depth annotations visible in response text (sigils: ◊ → △ ⊕ ○)
5. MetadataStrip shows live stage during processing
6. MetadataStrip shows compact summary after response
7. Insight tab shows extracted key points (even for plain text)
8. Mindmap tab shows extracted concepts (even without Side Canal topics)
9. No console errors

Deploy:
  cd /Users/sheirraza/akhai && ./deploy/quick-deploy.sh
