# CLI PROMPT: Make Layer Configuration Actually Work
# Copy this entire file content into Claude Code CLI

## CONTEXT
AkhAI sovereign AI engine. Project: `/Users/sheirraza/akhai/packages/web`
The AI Config page at `/tree-of-life` has 11 layer sliders (0-100%).
Sliders now send weights to the API (P0 fixed). BUT `generateEnhancedSystemPrompt()` 
in `lib/intelligence-fusion.ts` only outputs generic "Apply with emphasis" — 
the AI has NO idea what each layer percentage means behaviorally.

## THE MAPPING (UI name → Layer enum → number)
```
reception      → EMBEDDING(1)     — Input parsing depth
comprehension  → EXECUTOR(2)      — Semantic encoding depth  
context        → CLASSIFIER(3)    — Relationship mapping breadth
knowledge      → ENCODER(8)       — Facts & expertise retrieval
reasoning      → REASONING(9)     — Problem decomposition depth
expansion      → EXPANSION(7)     — Alternative exploration
analysis       → DISCRIMINATOR(6) — Critical evaluation rigor
synthesis      → ATTENTION(5)     — Insight combination complexity
verification   → SYNTHESIS(11)    — Error checking thoroughness
articulation   → GENERATIVE(4)    — Response crafting richness
output         → META_CORE(10)    — Final delivery completeness
```

## TASK 1: Add 5-Tier Graduated Behavioral System

In `lib/intelligence-fusion.ts`, add this BEFORE `generateEnhancedSystemPrompt()`:

```typescript
/**
 * 5-tier graduated behavioral instructions per layer.
 * Each percentage range produces measurably different AI behavior.
 * The exact % is also injected so the AI can fine-tune within tiers.
 */
const LAYER_BEHAVIORS: Record<number, {
  name: string;           // UI display name
  tiers: [string, string, string, string, string]; // 0-20, 21-40, 41-60, 61-80, 81-100
}> = {
  1: { // EMBEDDING → reception
    name: 'reception',
    tiers: [
      'Skip input analysis. Take the query at face value with no preprocessing.',
      'Basic input parsing. Identify the main question only.',
      'Standard input analysis. Parse intent, entities, and context clues.',
      'Deep input parsing. Identify implicit questions, subtext, and emotional tone.',
      'Maximum reception. Analyze every word choice, detect hidden assumptions, identify what the user is NOT asking but should be.',
    ]
  },
  2: { // EXECUTOR → comprehension
    name: 'comprehension',
    tiers: [
      'Surface-level understanding only. Don\'t read between the lines.',
      'Basic comprehension. Understand the literal meaning.',
      'Standard comprehension. Grasp meaning and basic implications.',
      'Deep comprehension. Understand nuance, context, and underlying motivations.',
      'Maximum comprehension. Full semantic encoding — understand the question at every level: literal, implied, emotional, strategic.',
    ]
  },
  3: { // CLASSIFIER → context
    name: 'context',
    tiers: [
      'Ignore broader context. Answer the question in isolation.',
      'Minimal context. Consider only the most obvious related factors.',
      'Standard context. Consider relevant background and related topics.',
      'Wide context mapping. Connect to related domains, trends, and historical patterns.',
      'Maximum context. Map every relationship — cross-domain connections, systemic implications, second and third-order effects.',
    ]
  },
  8: { // ENCODER → knowledge
    name: 'knowledge',
    tiers: [
      'Minimal facts. Opinion and reasoning over data.',
      'Light factual grounding. A few key facts where essential.',
      'Balanced knowledge. Mix of facts and analysis. Include relevant data points.',
      'Knowledge-heavy. Ground every claim in specific facts, statistics, and examples. Cite numbers.',
      'Maximum knowledge. Data-driven response. Every statement backed by specific facts, percentages, dates, studies, or named examples. Be encyclopedic.',
    ]
  },
  9: { // REASONING → reasoning
    name: 'reasoning',
    tiers: [
      'No reasoning chain. Give direct answer only.',
      'Light reasoning. One step of logic connecting question to answer.',
      'Standard reasoning. Break problem into 2-3 logical steps.',
      'Deep reasoning. Multi-step decomposition. Show cause-and-effect chains. Consider counterarguments.',
      'Maximum reasoning. Full first-principles decomposition. Question every assumption. Build argument from fundamentals. Show complete logical chain with edge cases.',
    ]
  },
  7: { // EXPANSION → expansion
    name: 'expansion',
    tiers: [
      'No expansion. Single direct answer. No alternatives.',
      'Minimal expansion. Mention one alternative briefly.',
      'Standard expansion. Present 2-3 options or perspectives.',
      'Broad expansion. Explore multiple angles, scenarios, and "what-if" paths. Consider unconventional approaches.',
      'Maximum expansion. Exhaustive exploration. Every viable path, creative alternatives, contrarian views, edge cases, and surprising connections. Think like a brainstorming session.',
    ]
  },
  6: { // DISCRIMINATOR → analysis
    name: 'analysis',
    tiers: [
      'No critical analysis. Accept all premises. Be supportive only.',
      'Light analysis. Note one obvious limitation or risk.',
      'Balanced analysis. Identify key pros and cons. Note important trade-offs.',
      'Rigorous analysis. Challenge assumptions. Identify risks, flaws, and blind spots. Devil\'s advocate on key claims.',
      'Maximum critical analysis. Question everything. Stress-test every assumption. Identify failure modes, hidden costs, second-order risks. Be ruthlessly honest about weaknesses.',
    ]
  },
  5: { // ATTENTION → synthesis
    name: 'synthesis',
    tiers: [
      'No synthesis. Present information as separate points.',
      'Light synthesis. Basic summary connecting main ideas.',
      'Standard synthesis. Weave insights into a coherent narrative with clear conclusions.',
      'Deep synthesis. Find non-obvious connections between ideas. Create novel frameworks. Identify emergent patterns.',
      'Maximum synthesis. Full integration across all domains. Reveal hidden unity between disparate concepts. Deliver original insights that transcend the individual parts.',
    ]
  },
  11: { // SYNTHESIS → verification
    name: 'verification',
    tiers: [
      'No verification. Trust all generated content as-is.',
      'Light check. Flag only obvious errors or contradictions.',
      'Standard verification. Check key claims for accuracy and internal consistency.',
      'Thorough verification. Verify facts, check logic, identify potential errors, flag uncertain claims explicitly.',
      'Maximum verification. Triple-check everything. Cross-reference claims, verify logical consistency, flag any uncertainty with confidence levels. Admit what you don\'t know.',
    ]
  },
  4: { // GENERATIVE → articulation
    name: 'articulation',
    tiers: [
      'Minimal articulation. Bullet points, terse. No prose style.',
      'Concise. Short paragraphs, direct language. No flourish.',
      'Balanced articulation. Clear prose with some illustrative examples.',
      'Rich articulation. Vivid language, metaphors, storytelling elements. Make the response engaging and memorable.',
      'Maximum articulation. Masterful prose. Use analogies, narratives, thought experiments, and vivid imagery. Make complex ideas feel intuitive through brilliant communication.',
    ]
  },
  10: { // META_CORE → output
    name: 'output',
    tiers: [
      'Minimal output. Answer only what was asked. Nothing extra.',
      'Light output. Answer plus one useful follow-up thought.',
      'Standard output. Complete answer with relevant context and next steps.',
      'Comprehensive output. Full response with implications, recommendations, and actionable items.',
      'Maximum output. Exhaustive delivery. Answer, context, implications, recommendations, risks, opportunities, next steps, and what to watch for. Leave nothing unsaid.',
    ]
  }
}

function getTierIndex(percentage: number): number {
  if (percentage <= 20) return 0
  if (percentage <= 40) return 1
  if (percentage <= 60) return 2
  if (percentage <= 80) return 3
  return 4
}

function getTierLabel(index: number): string {
  return ['SUPPRESS', 'MINIMAL', 'BALANCED', 'ELEVATED', 'DOMINANT'][index]
}
```

## TASK 2: Rewrite generateEnhancedSystemPrompt()

Replace the existing `generateEnhancedSystemPrompt()` function entirely:

```typescript
export function generateEnhancedSystemPrompt(
  fusionResult: IntelligenceFusionResult,
  weights?: Record<number, number>
): string {
  const lines: string[] = []
  
  lines.push('=== AI LAYER CONFIGURATION ===')
  lines.push('Your response behavior is calibrated by the following layer settings.')
  lines.push('Each layer has a specific intensity (0-100%). Follow these instructions precisely.')
  lines.push('')

  // Generate behavioral instructions for each layer based on exact percentage
  const layerEntries = Object.entries(LAYER_BEHAVIORS)
  
  // Sort: highest weight layers first (most impactful instructions come first)
  const sortedLayers = layerEntries
    .map(([layerId, config]) => {
      const w = weights?.[Number(layerId)] ?? 0.5
      const pct = Math.round(w * 100)
      const tierIdx = getTierIndex(pct)
      return { layerId: Number(layerId), config, pct, tierIdx }
    })
    .sort((a, b) => b.pct - a.pct)

  for (const { config, pct, tierIdx } of sortedLayers) {
    const tierLabel = getTierLabel(tierIdx)
    const instruction = config.tiers[tierIdx]
    
    // Only include layers that deviate from balanced (skip 41-60% range to keep prompt concise)
    // But ALWAYS include if user explicitly set it (non-default)
    if (tierIdx !== 2 || (weights && Object.keys(weights).length > 0)) {
      lines.push(`• ${config.name.toUpperCase()} — ${pct}% [${tierLabel}]`)
      lines.push(`  ${instruction}`)
      lines.push('')
    }
  }

  // Add dominant layers emphasis
  if (fusionResult.dominantLayers.length > 0) {
    const dominantNames = fusionResult.layerActivations
      .filter(s => fusionResult.dominantLayers.includes(s.layerNode))
      .map(s => `${s.name} (${Math.round(s.effectiveWeight * 100)}%)`)
    lines.push(`PRIMARY FOCUS: ${dominantNames.join(', ')}`)
    lines.push('')
  }

  // Add methodology
  lines.push(`METHODOLOGY: ${fusionResult.selectedMethodology.toUpperCase()} (${Math.round(fusionResult.confidence * 100)}% confidence)`)
  
  const topReasons = fusionResult.methodologyScores[0]?.reasons
  if (topReasons?.length) {
    lines.push(`Reasoning: ${topReasons.join(', ')}`)
  }

  // Add Instinct prompt if enabled
  if (fusionResult.instinctPrompt) {
    lines.push('')
    lines.push(fusionResult.instinctPrompt)
  }

  // Add context injection
  if (fusionResult.contextInjection) {
    lines.push('')
    lines.push('CONTEXT FROM PREVIOUS CONVERSATIONS:')
    lines.push(fusionResult.contextInjection)
  }

  return lines.join('\n')
}
```

## TASK 3: Pass weights to generateEnhancedSystemPrompt()

In `app/api/simple-query/route.ts`, find where `generateEnhancedSystemPrompt` is called (around line 455):

Change FROM:
```typescript
const fusionEnhancement = generateEnhancedSystemPrompt(fusionResult)
```

Change TO:
```typescript
const fusionEnhancement = generateEnhancedSystemPrompt(fusionResult, weights)
```

This passes the actual user slider weights so the behavioral instructions match what the user configured.

## TASK 4: Update function signature in intelligence-fusion.ts export

Make sure the function signature accepts the optional weights parameter:
```typescript
export function generateEnhancedSystemPrompt(
  fusionResult: IntelligenceFusionResult,
  weights?: Record<number, number>
): string {
```

## TASK 5: Add debug logging

In `app/api/simple-query/route.ts`, after generating the fusion enhancement, add a log showing what behavioral instructions were generated:

```typescript
const fusionEnhancement = generateEnhancedSystemPrompt(fusionResult, weights)
systemPrompt = `${systemPrompt}\n\n${fusionEnhancement}`

// Log the layer configuration being applied
const layerSummary = Object.entries(weights).map(([k, v]) => {
  const pct = Math.round((v as number) * 100)
  const name = LAYER_METADATA[Number(k)]?.name || k
  return `${name}:${pct}%`
}).join(', ')
log('INFO', 'FUSION', `Layer config: ${layerSummary}`)
log('INFO', 'FUSION', `Enhanced system prompt with Layer behaviors (+${fusionEnhancement.length} chars)`)
```

## TASK 6: Verify Compilation

```bash
cd /Users/sheirraza/akhai/packages/web
lsof -ti:3000 | xargs kill -9 2>/dev/null
rm -rf .next
npx next dev --turbopack
```

Wait for "Ready" and verify no compile errors.

## TASK 7: Commit

```bash
cd /Users/sheirraza/akhai
git add -A  
git commit -m "feat: 5-tier graduated layer behaviors — each % produces different AI output

11 layers × 5 behavioral tiers = 55 distinct AI instructions.
Each slider % maps to specific behavioral instructions:
- 0-20% SUPPRESS: minimize that capability  
- 21-40% MINIMAL: light touch
- 41-60% BALANCED: standard behavior
- 61-80% ELEVATED: emphasize that capability
- 81-100% DOMINANT: maximum intensity

Exact % also injected so AI fine-tunes within tiers.
Example: knowledge=85% → 'Maximum knowledge. Data-driven response.
Every statement backed by specific facts, percentages, dates.'

Layers: reception, comprehension, context, knowledge, reasoning,
expansion, analysis, synthesis, verification, articulation, output"
git push origin main
```
