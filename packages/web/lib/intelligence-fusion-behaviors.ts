/**
 * INTELLIGENCE FUSION — 5-Tier Behavioral System & Enhanced Prompt Generation
 *
 * Graduated behavioral instructions per layer and system prompt generation.
 */

import { LAYER_METADATA } from './layer-registry';
import { IntelligenceFusionResult } from './intelligence-fusion-types';

// ============================================================
// 5-TIER GRADUATED BEHAVIORAL SYSTEM
// ============================================================

/**
 * 5-tier graduated behavioral instructions per layer.
 * Each percentage range produces measurably different AI behavior.
 * The exact % is also injected so the AI can fine-tune within tiers.
 */
const LAYER_BEHAVIORS: Record<
  number,
  {
    name: string; // UI display name
    tiers: [string, string, string, string, string]; // 0-20, 21-40, 41-60, 61-80, 81-100
  }
> = {
  1: {
    // EMBEDDING → reception
    name: 'Embedding',
    tiers: [
      'Skip input analysis. Take the query at face value with no preprocessing.',
      'Basic input parsing. Identify the main question only.',
      'Standard input analysis. Parse intent, entities, and context clues.',
      'Deep input parsing. Identify implicit questions, subtext, and emotional tone.',
      'Maximum reception. Analyze every word choice, detect hidden assumptions, identify what the user is NOT asking but should be.',
    ],
  },
  2: {
    // EXECUTOR → comprehension
    name: 'Executor',
    tiers: [
      "Surface-level understanding only. Don't read between the lines.",
      'Basic comprehension. Understand the literal meaning.',
      'Standard comprehension. Grasp meaning and basic implications.',
      'Deep comprehension. Understand nuance, context, and underlying motivations.',
      'Maximum comprehension. Full semantic encoding — understand the question at every level: literal, implied, emotional, strategic.',
    ],
  },
  3: {
    // CLASSIFIER → context
    name: 'Classifier',
    tiers: [
      'Ignore broader context. Answer the question in isolation.',
      'Minimal context. Consider only the most obvious related factors.',
      'Standard context. Consider relevant background and related topics.',
      'Wide context mapping. Connect to related domains, trends, and historical patterns.',
      'Maximum context. Map every relationship — cross-domain connections, systemic implications, second and third-order effects.',
    ],
  },
  8: {
    // ENCODER → knowledge
    name: 'Encoder',
    tiers: [
      'Minimal facts. Opinion and reasoning over data.',
      'Light factual grounding. A few key facts where essential.',
      'Balanced knowledge. Mix of facts and analysis. Include relevant data points.',
      'Knowledge-heavy. Ground every claim in specific facts, statistics, and examples. Cite numbers.',
      'Maximum knowledge. Data-driven response. Every statement backed by specific facts, percentages, dates, studies, or named examples. Be encyclopedic.',
    ],
  },
  9: {
    // REASONING → reasoning
    name: 'Reasoning',
    tiers: [
      'No reasoning chain. Give direct answer only.',
      'Light reasoning. One step of logic connecting question to answer.',
      'Standard reasoning. Break problem into 2-3 logical steps.',
      'Deep reasoning. Multi-step decomposition. Show cause-and-effect chains. Consider counterarguments.',
      'Maximum reasoning. Full first-principles decomposition. Question every assumption. Build argument from fundamentals. Show complete logical chain with edge cases.',
    ],
  },
  7: {
    // EXPANSION → expansion
    name: 'Expansion',
    tiers: [
      'No expansion. Single direct answer. No alternatives.',
      'Minimal expansion. Mention one alternative briefly.',
      'Standard expansion. Present 2-3 options or perspectives.',
      'Broad expansion. Explore multiple angles, scenarios, and "what-if" paths. Consider unconventional approaches.',
      'Maximum expansion. Exhaustive exploration. Every viable path, creative alternatives, contrarian views, edge cases, and surprising connections. Think like a brainstorming session.',
    ],
  },
  6: {
    // DISCRIMINATOR → analysis
    name: 'Discriminator',
    tiers: [
      'No critical analysis. Accept all premises. Be supportive only.',
      'Light analysis. Note one obvious limitation or risk.',
      'Balanced analysis. Identify key pros and cons. Note important trade-offs.',
      "Rigorous analysis. Challenge assumptions. Identify risks, flaws, and blind spots. Devil's advocate on key claims.",
      'Maximum critical analysis. Question everything. Stress-test every assumption. Identify failure modes, hidden costs, second-order risks. Be ruthlessly honest about weaknesses.',
    ],
  },
  5: {
    // ATTENTION → synthesis
    name: 'Attention',
    tiers: [
      'No synthesis. Present information as separate points.',
      'Light synthesis. Basic summary connecting main ideas.',
      'Standard synthesis. Weave insights into a coherent narrative with clear conclusions.',
      'Deep synthesis. Find non-obvious connections between ideas. Create novel frameworks. Identify emergent patterns.',
      'Maximum synthesis. Full integration across all domains. Reveal hidden unity between disparate concepts. Deliver original insights that transcend the individual parts.',
    ],
  },
  11: {
    // SYNTHESIS → verification
    name: 'Synthesis',
    tiers: [
      'No verification. Trust all generated content as-is.',
      'Light check. Flag only obvious errors or contradictions.',
      'Standard verification. Check key claims for accuracy and internal consistency.',
      'Thorough verification. Verify facts, check logic, identify potential errors, flag uncertain claims explicitly.',
      "Maximum verification. Triple-check everything. Cross-reference claims, verify logical consistency, flag any uncertainty with confidence levels. Admit what you don't know.",
    ],
  },
  4: {
    // GENERATIVE → articulation
    name: 'Generative',
    tiers: [
      'Minimal articulation. Bullet points, terse. No prose style.',
      'Concise. Short paragraphs, direct language. No flourish.',
      'Balanced articulation. Clear prose with some illustrative examples.',
      'Rich articulation. Vivid language, metaphors, storytelling elements. Make the response engaging and memorable.',
      'Maximum articulation. Masterful prose. Use analogies, narratives, thought experiments, and vivid imagery. Make complex ideas feel intuitive through brilliant communication.',
    ],
  },
  10: {
    // META_CORE → output
    name: 'Meta-Core',
    tiers: [
      'Minimal output. Answer only what was asked. Nothing extra.',
      'Light output. Answer plus one useful follow-up thought.',
      'Standard output. Complete answer with relevant context and next steps.',
      'Comprehensive output. Full response with implications, recommendations, and actionable items.',
      'Maximum output. Exhaustive delivery. Answer, context, implications, recommendations, risks, opportunities, next steps, and what to watch for. Leave nothing unsaid.',
    ],
  },
};

function getTierIndex(percentage: number): number {
  if (percentage <= 20) return 0;
  if (percentage <= 40) return 1;
  if (percentage <= 60) return 2;
  if (percentage <= 80) return 3;
  return 4;
}

function getTierLabel(index: number): string {
  return ['SUPPRESS', 'MINIMAL', 'BALANCED', 'ELEVATED', 'DOMINANT'][index];
}

// ============================================================
// UTILITY: Generate Enhanced System Prompt
// ============================================================

export function generateEnhancedSystemPrompt(
  fusionResult: IntelligenceFusionResult,
  weights?: Record<number, number>
): string {
  const lines: string[] = [];

  lines.push('=== AI LAYER CONFIGURATION ===');
  lines.push('Your response behavior is calibrated by the following layer settings.');
  lines.push('Each layer has a specific intensity (0-100%). Follow these instructions precisely.');
  lines.push('');

  // Generate behavioral instructions for each layer based on exact percentage
  const layerEntries = Object.entries(LAYER_BEHAVIORS);

  // Sort: highest weight layers first (most impactful instructions come first)
  const sortedLayers = layerEntries
    .map(([layerId, config]) => {
      const w = weights?.[Number(layerId)] ?? 0.5;
      const pct = Math.round(w * 100);
      const tierIdx = getTierIndex(pct);
      return { layerId: Number(layerId), config, pct, tierIdx };
    })
    .sort((a, b) => b.pct - a.pct);

  for (const { config, pct, tierIdx } of sortedLayers) {
    const tierLabel = getTierLabel(tierIdx);
    const instruction = config.tiers[tierIdx];

    // Only include layers that deviate from balanced (skip 41-60% range to keep prompt concise)
    // But ALWAYS include if user explicitly set it (non-default)
    if (tierIdx !== 2 || (weights && Object.keys(weights).length > 0)) {
      lines.push(`• ${config.name.toUpperCase()} — ${pct}% [${tierLabel}]`);
      lines.push(`  ${instruction}`);
      lines.push('');
    }
  }

  // Add dominant layers emphasis
  if (fusionResult.dominantLayers.length > 0) {
    const dominantNames = fusionResult.layerActivations
      .filter((s) => fusionResult.dominantLayers.includes(s.layerNode))
      .map((s) => {
        const aiName = LAYER_BEHAVIORS[s.layerNode]?.name || s.name;
        return `${aiName} (${Math.round(s.effectiveWeight * 100)}%)`;
      });
    lines.push(`PRIMARY FOCUS: ${dominantNames.join(', ')}`);
    lines.push('');
  }

  // Add methodology
  lines.push(
    `METHODOLOGY: ${fusionResult.selectedMethodology.toUpperCase()} (${Math.round(fusionResult.confidence * 100)}% confidence)`
  );

  const topReasons = fusionResult.methodologyScores[0]?.reasons;
  if (topReasons?.length) {
    lines.push(`Reasoning: ${topReasons.join(', ')}`);
  }

  // Add Instinct prompt if enabled
  if (fusionResult.instinctPrompt) {
    lines.push('');
    lines.push(fusionResult.instinctPrompt);
  }

  // Add context injection
  if (fusionResult.contextInjection) {
    lines.push('');
    lines.push('CONTEXT FROM PREVIOUS CONVERSATIONS:');
    lines.push(fusionResult.contextInjection);
  }

  lines.push('');
  lines.push(
    'STYLE REMINDER: Your base voice is short and eloquent. The layer weights above adjust HOW you deliver — more creative, more analytical, more focused — but never make you verbose. Compression is your art. Say more with less.'
  );

  return lines.join('\n');
}
