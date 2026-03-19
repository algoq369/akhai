# AkhAI — Fix 5 Critical UI Issues
# Read /Users/sheirraza/akhai/CLAUDE.md for project rules.
# WORKFLOW: Fix each issue, test, commit SEPARATELY. One commit per fix.

## ISSUE 1: SVG errors in GodViewTree.tsx (CONSOLE ERRORS)

Console shows:
- Error: <svg> attribute width: Unexpected end of attribute. Expected length, "".
- Error: <circle> attribute r: Expected length, "undefined".

In components/god-view/GodViewTree.tsx:
- Find where SVG width/height are set — they're getting empty string or undefined
- Find where <circle r={...}> gets undefined radius
- Fix: Add default values. SVG viewBox should be "0 0 500 600" with width/height="100%"
- Circle radius should default to a number (e.g. 20) if activation data is missing
- Test: No SVG errors in console after fix

COMMIT: git add -A && git commit -m "fix: GodViewTree SVG attribute defaults for width/height/radius"

## ISSUE 2: AI Layers panel shows tree but no activation data

The VIEW tabs (AI Layers / Insight / Mindmap) appear but:
- AI Layers tab shows the tree with 0% activations on all nodes
- This is because the tree reads from the RESPONSE data, not from a separate API

Root cause: The response JSON has fusion.layerActivations but effectiveWeight is 0 for all.
Check lib/intelligence-fusion.ts — the fuseIntelligence function.
When AKHAI_FREE_MODE=true, fusion may be running but returning empty weights.

Fix approach:
- In app/api/simple-query/route.ts, check if fusion returns empty layerActivations
- If empty, generate basic activations from the response content analysis
  (e.g. if response mentions "analysis" → Discriminator gets 60%, if creative → Expansion 70%)
- OR: Check if the layer weights from user config (all 50% default) are being passed correctly
  to the tree visualization

COMMIT: git add -A && git commit -m "fix: layer activations fallback when fusion returns empty weights"

## ISSUE 3: Insight and Mindmap panels empty

Insight panel (InsightMindmap component) requires:
- Bold text (** **), headers (#), or bullets in response — OR gnostic data
- Check: shouldShowInsightMap() in components/InsightMindmap.tsx
- The free tier Llama model outputs [TECHNICAL], [STRATEGIC] tags not markdown headers
- Fix: Update shouldShowInsightMap to also detect [TECHNICAL], [STRATEGIC], [CRITICAL] etc.

Mindmap panel (ResponseMindmap component) requires:
- 3+ topics from Side Canal OR 4+ concepts extracted from content
- Side Canal now uses OpenRouter but may still fail silently
- Check server logs for Side Canal extraction results
- Fix: If Side Canal extraction returns 0 topics, fall back to local content extraction
  using the existing extractConcepts() function in ResponseMindmap.tsx
- Also update shouldShowMindmap to be less strict (2+ topics instead of 3+)

COMMIT: git add -A && git commit -m "fix: Insight/Mindmap panels detect free-tier response format + relaxed thresholds"

## ISSUE 4: Depth annotations not working

Depth annotations are enabled (depth on · maximum visible in UI) but no sigils appear.
Root cause: The processText() function in hooks/useDepthAnnotations.ts uses regex
patterns to match specific text patterns. The free tier Llama model outputs different
format than Claude (e.g. [TECHNICAL]:, [STRATEGIC]:, numbered lists).

Fix:
- Check lib/depth-annotations.ts — what patterns does detectAnnotations look for?
- Add patterns that match the free tier output format:
  - [TECHNICAL] → depth marker
  - [STRATEGIC] → depth marker  
  - [CRITICAL] → depth marker
  - Numbered steps (1. 2. 3.) → progression markers
  - [RELATED]: and [NEXT]: → connection markers
- The sigil markers should be: ◊ △ ○ ⊕ ☿ (no emojis)

COMMIT: git add -A && git commit -m "fix: depth annotations detect free-tier response patterns"

## ISSUE 5: Metadata panel needs richer information

The PipelineHistoryPanel and MetadataStrip should show MORE internal process data.
Currently showing: model name, tokens/sec, guard passed.
Should ALSO show:

Rich metadata to display per query:
  ◊ FUSION: methodology selected + why + confidence % + alternatives considered
  △ GUARD: individual scores (hype/echo/drift/fact) + pass/fail + any issues
  → LAYERS: top 3 activated layers with weights + keywords that triggered them
  ⊕ PROVIDER: model name + family + reasoning for selection + fallback chain
  ○ METRICS: tokens (input/output split) + latency breakdown + cost
  ◇ SIDE CANAL: topics extracted (names) + suggestions count + context injected?
  ☿ GNOSTIC: ascent level + intent detected + boundary set + reflection mode
  ⊗ SEARCH: queries made + results count + sources used

This data is ALL available in the response JSON — it just needs to be formatted
and displayed in MetadataStrip.tsx and PipelineHistoryPanel.tsx.

Update MetadataStrip.tsx to show a COMPACT but RICH summary under each response:
Format: single line that expands on click
Collapsed: "◊ gtp · 92% · △ passed · → Expansion 70% · ○ 2.4k tokens · $0.04"
Expanded: Full breakdown with all 8 categories above

Update PipelineHistoryPanel.tsx to show the FULL detailed version:
Each query gets a block with all 8 categories, properly formatted with sigils.
Scrollable, persistent across the conversation.

COMMIT: git add -A && git commit -m "feat: rich metadata display — 8 categories per query in MetadataStrip + PipelineHistory"

## VERIFICATION AFTER ALL 5 FIXES

Restart server:
  lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 2
  cd /Users/sheirraza/akhai/packages/web && rm -rf .next
  NODE_ENV=development npx next dev --turbopack -p 3000

Test checklist:
1. No SVG errors in console
2. Submit query → AI Layers tab shows tree WITH activation percentages > 0
3. Submit query → Insight tab shows parsed content (or "not enough structure" message)
4. Submit query → Mindmap shows at least local concept extraction
5. Response text has depth annotation sigils inline
6. MetadataStrip under response shows compact rich summary
7. PipelineHistoryPanel (toggle) shows full detailed metadata
8. Submit second query → both queries' metadata persist in history

IMPORTANT: Commit after EACH fix, not all at once. 5 separate commits.
