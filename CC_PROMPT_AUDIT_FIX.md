# AkhAI — Comprehensive Audit + Fix Plan
# Read /Users/sheirraza/akhai/CLAUDE.md for project rules.
# WORKFLOW: Fix each issue, test, commit SEPARATELY.

## FULL AUDIT FROM SCREENSHOTS

### ISSUE 1: REMOVE black God View slide-in panel (REDUNDANT)
The GodViewPanel.tsx (black 420px slide-in from right) is REDUNDANT.
We already have the Tree of Life visualization in the AI Layers VIEW tab 
that shows the same data (layer activations, node names, percentages).
The user confirmed: "we dont need the god view in black — we already have the tree of life"

FIX:
- Remove the ◊ "god view" toggle button from page.tsx (around line 2587-2595)
- Remove the <GodViewPanel /> mount from page.tsx (around line 2861)
- Keep GodViewPanel.tsx + ActivityFeed.tsx files (may repurpose later)
- Keep god-view-store.ts (used for SSE data piping to tree)
- The AI Layers VIEW tab already uses this data correctly

COMMIT: git add -A && git commit -m "fix: remove redundant God View black panel — AI Layers tab is the tree"

### ISSUE 2: Metadata should show DURING processing, UNDER the query

Currently: MetadataStrip appears AFTER response, under the assistant message.
Desired: Like Claude, show live thinking process UNDER THE USER'S QUERY 
while the engine is processing. Show stages as they happen:
  "◊ Analyzing query... routing through Chain of Draft"
  "→ Searching web... 3 results found"  
  "△ Guard checking response..."
  "○ Complete — 2,314 tokens · 17.2s"
Then after response arrives, this live strip collapses into a compact summary
and the full metadata registers in the side panel.

FIX:
In app/page.tsx, find where the placeholder assistant message is created (line ~929).
BEFORE the placeholder, add a "processing indicator" that shows under the USER message:
- Create a new component: components/ProcessingIndicator.tsx
- It subscribes to the SSE thought-stream events (already connected at line 934)
- Shows a single animated line that updates as stages progress
- Format: sigil + stage description + elapsed time
- When response arrives: indicator fades out, MetadataStrip takes over
- Position: directly under the user's query bubble, above the response

The processing indicator reads from useSideCanalStore currentMetadata.
As SSE events arrive (received → routing → layers → generating → guard → complete),
it shows each stage in sequence with smooth crossfade transitions.

ALSO: Wire the FULL response metadata to the PipelineHistoryPanel (right side panel).
Currently pushResponseMetadata is called (line 1014) but ensure the PipelineHistoryPanel
reads from responseMetadata array and shows the AI THINKING narrative for each query.

COMMIT: git add -A && git commit -m "feat: live processing indicator under query — shows AI thinking during search"

### ISSUE 3: VIEW tabs (AI Layers / Insight / Mindmap) not always showing

The VIEW tabs are gated by a condition that requires shouldShowLayers OR 
shouldShowInsightMap OR shouldShowMindmap to be true. Sometimes none pass.

shouldShowLayers requires: hasGnosticData=true OR structured content (headers/bold/bullets)
shouldShowInsightMap requires: gnosticData OR bold+header+bullet count thresholds
shouldShowMindmap requires: 3+ Side Canal topics OR 4+ local concepts

Problem: The free-tier Llama model outputs [TECHNICAL]/[STRATEGIC] tags not markdown.
The gnostic field may be null/empty for some queries.

FIX: ALWAYS show the VIEW tabs for assistant responses longer than 200 chars.
The AI Layers tab should always be available (it just shows the tree with whatever 
activation data exists). Only Insight and Mindmap tabs depend on content structure.

In page.tsx around line 1972, change the gate:
FROM: globalVizMode !== 'off' && (shouldShowLayers || shouldShowInsightMap || shouldShowMindmap)
TO: globalVizMode !== 'off' && message.content.length > 200

This ensures the tabs always show. Individual tab content can still be empty
with a "not enough data" message, but the navigation always renders.

COMMIT: git add -A && git commit -m "fix: VIEW tabs always show for responses > 200 chars"

### ISSUE 4: Depth annotations / sigils not appearing in response text

The depth annotation system uses pattern matching (regex) to detect annotatable 
text. The "maximum" density mode had a bug (fixed in commit be5beb1) but annotations
may still not appear because:

a) The free tier model output format ([DRAFT 1], [TECHNICAL], [CONSENSUS]) 
   may not match the annotation regex patterns
b) The annotation processing runs AFTER content is set, but the content
   may arrive as streaming chunks that don't match patterns mid-stream
c) The depthConfig.enabled check happens in useEffect which may not re-trigger

DEBUG and FIX:
1. In hooks/useDepthAnnotations.ts, add console.log to processText() 
   to see what patterns are being matched/missed
2. Add patterns for free-tier format: [DRAFT 1], [CONSENSUS], [RELATED], 
   [NEXT], [TECHNICAL], [STRATEGIC], numbered steps
3. Ensure processText runs AFTER full content is available (not during streaming)
4. The sigil markers: ◊ (key concepts), △ (warnings/caveats), ○ (connections),
   ⊕ (opportunities), ☿ (technical terms)

COMMIT: git add -A && git commit -m "fix: depth annotations detect free-tier output patterns, run after streaming"

### ISSUE 5: Enhance AI REASONING metadata narrative quality

The AI THINKING section in PipelineHistoryPanel now shows narrative text 
(from reasoning-narrator.ts). Continue enhancing it:

1. The narrative should feel like Claude's extended thinking — conversational,
   insightful, explaining the WHY behind each decision
2. Add more context: 
   - Why THIS methodology was chosen over alternatives (show method comparison scores)
   - What the Guard SPECIFICALLY checked and what each score means
   - What topics Side Canal found and how they connect to previous queries
   - What the ascent level means for the user's learning progression
3. The narrative should update LIVE during processing (not just after response)
   Wire it to the SSE thought-stream events so each stage generates a narrative line

COMMIT: git add -A && git commit -m "feat: enhanced AI reasoning narrative — live during processing + richer explanations"

## VERIFICATION

After all fixes, restart + test:
  lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 2
  cd /Users/sheirraza/akhai/packages/web && rm -rf .next
  NODE_ENV=development npx next dev --turbopack -p 3000

Test checklist:
1. No black God View panel (◊ button removed)
2. Submit query → live processing indicator appears UNDER the query
3. Processing stages stream: "Analyzing... → Searching... → Guard... → Complete"
4. After response: VIEW tabs (AI Layers/Insight/Mindmap) always visible
5. Response text has depth annotation sigils (on standard AND maximum)
6. Right panel (AI REASONING): rich narrative with live updates
7. Submit second query → first query metadata persists in side panel

Then deploy:
  cd /Users/sheirraza/akhai && ./deploy/quick-deploy.sh
