# AkhAI — Enhance Depth Annotations + Rich AI Reasoning Narrative
# Read /Users/sheirraza/akhai/CLAUDE.md for project rules.
# WORKFLOW: Fix each issue, test, commit SEPARATELY.

## ISSUE 1: Depth annotations work on "standard" but NOT on "maximum"

The user reports depth annotation sigils appear when density is set to "standard"
but disappear when set to "maximum". This is a threshold/pattern issue.

DEBUG STEPS:
1. Read hooks/useDepthAnnotations.ts — find where density config affects detection
2. Read lib/depth-annotations.ts — find DEFAULT_DEPTH_CONFIG and how density
   changes the behavior (likely: "maximum" enables MORE patterns but some patterns
   have bugs that return empty matches)
3. Check: Does "maximum" mode add extra regex patterns that fail on free-tier output?
4. Check: Does "maximum" mode change the minimum text length or word count threshold?
5. Fix: Ensure "maximum" shows MORE annotations than "standard", not fewer.
   Maximum should be the MOST permissive — detect everything.

The sigil markers used are: ◊ △ ○ ⊕ ☿ (no emojis, as per CLAUDE.md rules).

COMMIT: git add -A && git commit -m "fix: depth annotations work correctly on maximum density"

## ISSUE 2: Metadata needs ACTUAL AI reasoning narrative

Current metadata shows dry facts: "Model: Llama 3.3 70B", "Guard passed", "134 tokens/sec".
This is boring and uninformative. The user wants AkhAI to NARRATE its thinking process
like Claude does — explaining WHY it made decisions, not just WHAT it decided.

The reasoning narrative should feel like watching the AI think out loud:

CURRENT (boring):
  "Detected analytical query (15% complexity)"
  "Routed to GTP: User selected"
  "Layer weights: synthesis 7%, analysis 7%, expansion 7%"
  "Guard passed with 19% risk detected"
  "Model: Free tier: Llama 3.3 70B"

DESIRED (insightful, like Claude's thinking):
  "◊ I'm analyzing your query about financial markets. The keywords 'macro',
   'technical', and 'analyse' suggest you want a multi-dimensional perspective,
   so I'm routing through Multi-AI Consensus (GTP) to cross-reference viewpoints."
  
  "→ My Expansion layer is most active (70%) — your question opens many
   possibilities. The Discriminator (critical analysis) is secondary at 40%,
   keeping me grounded while I explore."
  
  "△ Guard check: I found no hype patterns (0%), no echo chamber risk (0%),
   and no factual drift (0%). The response is grounded in verifiable data.
   19% risk flag came from the broad scope — financial predictions carry
   inherent uncertainty, which I've acknowledged in the response."
  
  "◇ I extracted 'south china sea' as the dominant topic from your conversation
   context. This is connecting your geopolitical interest with the financial
   analysis — a cross-domain insight that traditional search wouldn't surface."
  
  "○ Total: 2,314 tokens processed in 17.2s at $0.00 via Llama 3.3 70B.
   The free tier handled this well — for deeper multi-model consensus,
   Pro tier would run this through Claude + Gemini + DeepSeek simultaneously."

IMPLEMENTATION:

Create a new function generateReasoningNarrative() in lib/god-view/reasoning-narrator.ts:

Input: The full response metadata object (fusion, guard, provider, metrics, sideCanal, gnostic, query)
Output: Array of narrative strings, each prefixed with a sigil

The function generates HUMAN-READABLE explanations of each decision:

1. ◊ QUERY UNDERSTANDING — Explain what the AI understood from the query.
   Use: fusion.methodology, fusion.confidence, query keywords, analysis.queryType
   Template: "I'm analyzing your query about {topic}. The {keywords} suggest {queryType},
   so I'm routing through {methodology} ({confidence}% confidence) because {reason}."

2. → LAYER ACTIVATION — Explain which parts of the "AI brain" activated and why.
   Use: fusion.layerActivations, fusion.dominantLayers
   Template: "My {dominant} layer is most active ({weight}%) — your question {reason}.
   {secondary} provides {secondary_reason} at {secondary_weight}%."

3. △ GUARD ANALYSIS — Explain what the Guard checked and found.
   Use: guardResult.scores (hype/echo/drift/fact), guardResult.passed
   Template: "Guard check: {hype_explanation}, {echo_explanation}, {drift_explanation}.
   {risk_explanation if any flags > 0}."

4. ◇ CONTEXT — Explain what context was found and connected.
   Use: sideCanal.topicsExtracted, sideCanal.suggestions, gnostic.progressState
   Template: "I extracted '{topic}' as the dominant topic. {connection_insight}."

5. ○ PERFORMANCE — Explain the cost/speed tradeoff.
   Use: metrics.tokens, metrics.latency, metrics.cost, provider.model
   Template: "Processed {tokens} tokens in {latency}s at ${cost}. {tier_note}."

This function runs CLIENT-SIDE after the response arrives — no extra API calls.
It just formats the existing metadata into narrative prose.

Wire it into:
- MetadataStrip.tsx — show the narrative in the expanded view
- PipelineHistoryPanel.tsx — show full narrative per query
- ActivityFeed.tsx (God View) — show narrative entries as they arrive

COMMIT: git add -A && git commit -m "feat: AI reasoning narrator — metadata shows actual thinking process"

## VERIFICATION

Restart server, submit a query, check:
1. Depth annotations: toggle to "maximum" — sigils should appear (MORE than standard)
2. MetadataStrip: click to expand — see narrative reasoning, not dry stats
3. PipelineHistoryPanel: toggle open — see full narrative per query
4. God View ActivityFeed: see narrative entries with sigil markers

Deploy after verification:
  cd /Users/sheirraza/akhai && ./deploy/quick-deploy.sh
