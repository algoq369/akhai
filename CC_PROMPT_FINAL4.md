# AkhAI — Final 4 Critical Fixes
# Read /Users/sheirraza/akhai/CLAUDE.md for project rules.
# WORKFLOW: Fix each issue, test, commit SEPARATELY.

## REAL DATA FROM API (verified via curl):
- gnostic: EXISTS and truthy (keys: metaCoreState, progressState, layerAnalysis)
- gnostic.layerAnalysis.activations: {6: 0.3, 7: 0.3, 8: 0.3}
- fusion.layerActivations: 5 items with effectiveWeight ~0.07 each
  Names: "reasoning", "context", "expansion", "verification", "knowledge"
- fusion.dominantLayers: [] (empty!)
- sideCanal.topicsExtracted: false, suggestions: 0
- Response: plain prose, NO markdown, NO [TECHNICAL] tags for "direct" method
- Guard: passed, all scores 0

## ISSUE 1: Depth annotations invisible on plain text responses (30 min)

Root cause: detectAnnotations in lib/depth-annotations.ts detects [TECHNICAL],
[STRATEGIC] etc BUT the "direct" methodology returns PLAIN PROSE with no tags.
The current fallback patterns (capitalized terms, technical regexes) are too strict.

FIX in lib/depth-annotations.ts:
Add a new DETECTION_PATTERN entry for PLAIN PROSE responses:

- Match sentences containing strong assertion words: "is", "are", "requires", "enables",
  "means", "demonstrates", "indicates" — annotate the KEY TERM before the verb
- Match numbers with units: "$70K", "3.5%", "0.07", "2026", "15-64" → metric annotation
- Match proper nouns (2+ capitalized words): "Federal Reserve", "South China Sea" → connection
- Match parenthetical definitions: "text (explanation)" → detail annotation
- Each plain-prose annotation uses sigils: ◊ for key terms, → for assertions,
  △ for warnings/caveats, ⊕ for connections, ○ for metrics

Also: In the useEffect at page.tsx ~line 280, the depth annotations only run for
the LAST message. Fix: run for ALL assistant messages when depthConfig changes.
Change the dependency to process all unprocessed messages, not just the last one.

COMMIT: git add -A && git commit -m "fix: depth annotations detect plain prose — key terms, numbers, proper nouns"

## ISSUE 2: ProcessingIndicator disappears when streaming starts (30 min)

Currently at page.tsx ~line 2072:
  {message.isStreaming && !message.content ? (
    <ProcessingIndicator ... />
  ) : ...

This means: show ProcessingIndicator ONLY when streaming but NO content yet.
Once the first token arrives, it vanishes. The user wants to see the AI thinking
process ALONGSIDE the streaming response — like Claude shows thinking + answer.

FIX: Change the rendering logic to show ProcessingIndicator ABOVE the text content
when streaming, not INSTEAD OF it:

Replace the ternary with:
  {message.isStreaming && (
    <ProcessingIndicator messageId={message.id} isVisible={true} />
  )}
  {/* Always show text content when available */}
  {message.content && (depthConfig.enabled ? <DepthText .../> : <plain text/>)}

This way both ProcessingIndicator and response text are visible simultaneously.
ProcessingIndicator shows above the response while streaming, then auto-collapses
when streaming ends (check isStreaming flag).

Also make ProcessingIndicator COMPACT — single line, not a block:
"◊ Routing through direct (100%) → △ Guard passed → ○ Complete"

COMMIT: git add -A && git commit -m "fix: ProcessingIndicator persists alongside streaming response"

## ISSUE 3: Mindmap tab always empty — Side Canal extracts 0 topics (30 min)

Root cause: sideCanal.topicsExtracted is always false. The Side Canal uses
a separate LLM call (lib/side-canal.ts) to extract topics, but it may be
failing silently or returning empty results.

FIX approach:
1. Check lib/side-canal.ts — is extractTopics being called? Is it erroring?
2. If Side Canal fails: add LOCAL fallback topic extraction in ResponseMindmap.tsx
   - Extract proper nouns (consecutive capitalized words)
   - Extract terms in brackets [RELATED], [NEXT]
   - Extract terms after colons in structured text
   - Need minimum 2 topics (lowered from 3) to show mindmap
3. In shouldShowMindmap: if topics param is empty, try local extraction
   before returning false

COMMIT: git add -A && git commit -m "fix: Mindmap fallback — local topic extraction when Side Canal returns empty"

## ISSUE 4: Metadata panel needs Claude-like thinking narrative (1 hour)

The reasoning-narrator.ts exists but its output is too dry:
  "Detected factual query (20% complexity)"
  "Routed to DIRECT (70% confidence)"

Claude shows thinking like:
  "I'm analyzing your macro BTC query. The keywords 'macro', 'technical', 'analyse'
   suggest a multi-dimensional financial perspective..."

Rewrite lib/god-view/reasoning-narrator.ts generateReasoningNarrative() to produce
Claude-quality thinking narrative. Use the ACTUAL response data:

Template per section:
◊ QUERY: "I'm analyzing '{query}'. This is a {queryType} request — I'm routing
  through {methodology} because {reason}. Confidence: {confidence}%."

→ LAYERS: "My {dominantLayer} layer activated strongest at {weight}% — {explanation}.
  Supporting layers: {layer2} ({weight2}%), {layer3} ({weight3}%)."
  If dominantLayers is empty, say: "Processing distributed evenly across layers —
  no single perspective dominates, ensuring balanced analysis."

△ GUARD: "Checked for hallucination risks: hype={hype}%, echo={echo}%,
  drift={drift}%, factual={fact}%. {interpretation}."

◇ CONTEXT: If topics extracted: "Connected your query to: {topics}."
  If no topics: "No prior context detected — treating as fresh inquiry."

○ METRICS: "{tokens} tokens · {latency}s · ${cost} via {model} ({tier})."

Wire this into:
- PipelineHistoryPanel: show full narrative per query block
- MetadataStrip expanded view: show narrative summary
- ProcessingIndicator: show first 2 narrative lines during streaming

COMMIT: git add -A && git commit -m "feat: Claude-quality thinking narrative in metadata — explains WHY behind each decision"

## VERIFICATION
Restart server, test with query "check macro analysis on BTC":
1. Depth sigils appear inline in plain prose response (◊ → △ ⊕ ○)
2. ProcessingIndicator shows during streaming ABOVE the response text
3. Mindmap tab shows at least 2 locally-extracted topics
4. AI REASONING panel shows Claude-quality narrative, not dry stats
5. Only ONE "Live Refinement" section (compact, below response area)

Deploy: cd /Users/sheirraza/akhai && ./deploy/quick-deploy.sh
