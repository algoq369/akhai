/**
 * Intelligence Fusion orchestration — Side Canal, Refinements, Grimoire, Fusion call
 *
 * Extracted from app/api/simple-query/route.ts
 */

import { log } from '@/lib/logger';
import { getContextForQuery } from '@/lib/side-canal';
import {
  fuseIntelligence,
  generateEnhancedSystemPrompt,
  type IntelligenceFusionResult,
} from '@/lib/intelligence-fusion';
import { createAutoInstinctConfig } from '@/lib/instinct-mode';
import { selectMethodology } from '@/lib/query-pipeline';
import { LAYER_METADATA, Layer } from '@/lib/layer-registry';
import type { ThoughtEvent } from '@/lib/thought-stream';

// Re-export for route.ts convenience
export type { IntelligenceFusionResult };

/** Default Layers weights when not provided by client */
const DEFAULT_WEIGHTS: Record<number, number> = {
  1: 0.5,
  2: 0.5,
  3: 0.5,
  4: 0.5,
  5: 0.5,
  6: 0.5,
  7: 0.5,
  8: 0.5,
  9: 0.5,
  10: 0.5,
  11: 0.5,
};

export interface FusionInput {
  query: string;
  methodology: string;
  layersWeights?: Record<number, number>;
  instinctConfig?: any;
  liveRefinements?: { type: string; text: string }[];
  grimoireContext?: any;
  userId: string | null;
}

export interface FusionOutput {
  fusionResult: IntelligenceFusionResult | null;
  sideCanalContext: string | null;
  selectedMethod: { id: string; reason?: string };
  weights: Record<number, number>;
}

/**
 * Gather Side Canal context + live refinements + grimoire, then run Intelligence Fusion.
 * Returns fusion result, selected methodology, and enriched side canal context.
 */
export async function runFusionPipeline(
  input: FusionInput,
  emitAndPersist: (qid: string, ev: ThoughtEvent) => void,
  queryId: string,
  startTime: number
): Promise<FusionOutput> {
  const {
    query,
    methodology,
    layersWeights,
    instinctConfig,
    liveRefinements,
    grimoireContext,
    userId,
  } = input;

  const weights = layersWeights || DEFAULT_WEIGHTS;
  let fusionResult: IntelligenceFusionResult | null = null;

  // Get Side Canal context
  let sideCanalContext: string | null = null;
  try {
    sideCanalContext = getContextForQuery(query, userId);
  } catch (error) {
    log('WARN', 'SIDE_CANAL', `Context fetch failed: ${error}`);
  }

  // Emit: side canal context
  if (sideCanalContext) {
    emitAndPersist(queryId, {
      id: `${queryId}-sidecanal`,
      queryId,
      stage: 'side-canal',
      timestamp: Date.now() - startTime,
      data: `context injected (${sideCanalContext.length} chars)`,
      details: {
        sideCanal: { topics: [], contextChars: sideCanalContext.length },
      },
    });
  }

  // Merge live refinements into Side Canal context
  if (liveRefinements && Array.isArray(liveRefinements) && liveRefinements.length > 0) {
    const refinementText = liveRefinements
      .map((r: { type: string; text: string }) => `- [${r.type}] ${r.text}`)
      .join('\n');
    const refinementContext =
      '\n\n[User Live Refinements — adjust response accordingly]:\n' + refinementText;
    sideCanalContext = sideCanalContext ? sideCanalContext + refinementContext : refinementContext;
    log('INFO', 'SIDE_CANAL', `Injected ${liveRefinements.length} live refinements`);

    emitAndPersist(queryId, {
      id: `${queryId}-refinements`,
      queryId,
      stage: 'refinements',
      timestamp: Date.now() - startTime,
      data: `${liveRefinements.length} active`,
      details: {
        refinementCount: liveRefinements.length,
      },
    });
  }

  // Inject active Grimoire context (instructions + memories)
  if (grimoireContext && grimoireContext.id) {
    const parts: string[] = [];
    if (grimoireContext.instructions) {
      parts.push(`Instructions: ${grimoireContext.instructions}`);
    }
    if (grimoireContext.memories && grimoireContext.memories.length > 0) {
      parts.push(`Memories:\n${grimoireContext.memories.map((m: string) => `- ${m}`).join('\n')}`);
    }
    if (parts.length > 0) {
      const grimoireBlock = `\n\n[Active Grimoire: ${grimoireContext.name}]\n${parts.join('\n')}`;
      sideCanalContext = sideCanalContext ? sideCanalContext + grimoireBlock : grimoireBlock;
      log(
        'INFO',
        'GRIMOIRE',
        `Injected context from "${grimoireContext.name}" (${parts.length} sections)`
      );
    }
  }

  try {
    // Only use instinct mode when user explicitly toggled it ON
    const effectiveInstinctConfig = instinctConfig || {
      enabled: false,
      activeLenses: [],
      depth: 'standard' as const,
      includeLayers: false,
      includeYechidah: false,
    };

    // Run Intelligence Fusion
    fusionResult = await fuseIntelligence(query, weights, effectiveInstinctConfig, {
      contextInjection: sideCanalContext,
      relatedTopics: [],
    });

    log(
      'INFO',
      'FUSION',
      `Methodology: ${fusionResult.selectedMethodology} (${Math.round(fusionResult.confidence * 100)}% confidence)`
    );
    log(
      'INFO',
      'FUSION',
      `Dominant Layers: ${fusionResult.dominantLayers.map((s) => LAYER_METADATA[s]?.aiName).join(', ') || 'None'}`
    );
    log(
      'INFO',
      'FUSION',
      `Guard: ${fusionResult.guardRecommendation} | Thinking Budget: ${fusionResult.extendedThinkingBudget}`
    );
    log('INFO', 'FUSION', `Processing time: ${fusionResult.processingTimeMs}ms`);
  } catch (fusionError) {
    log('WARN', 'FUSION', `Intelligence fusion failed: ${fusionError}`);
    fusionResult = null;
  }

  // Methodology selection - use fusion result if available, fallback to legacy
  const selectedMethod =
    fusionResult && methodology === 'auto'
      ? {
          id: fusionResult.selectedMethodology,
          reason: `Fusion: ${fusionResult.methodologyScores[0]?.reasons.join(', ') || 'Auto-selected'}`,
        }
      : selectMethodology(query, methodology);

  return { fusionResult, sideCanalContext, selectedMethod, weights };
}

/**
 * Emit routing + layers thought-stream events from fusion result.
 */
export function emitFusionEvents(
  fusionResult: IntelligenceFusionResult | null,
  selectedMethod: { id: string; reason?: string },
  weights: Record<number, number>,
  methodology: string,
  emitAndPersist: (qid: string, ev: ThoughtEvent) => void,
  queryId: string,
  startTime: number
): void {
  // Emit: routing decision (with rich fusion data)
  emitAndPersist(queryId, {
    id: `${queryId}-routing`,
    queryId,
    stage: 'routing',
    timestamp: Date.now() - startTime,
    data: `Using ${selectedMethod.id}${selectedMethod.reason ? ` — ${selectedMethod.reason}` : ''}${fusionResult ? `. Confidence: ${Math.round(fusionResult.confidence * 100)}%` : ''}`,
    details: {
      methodology: {
        selected: selectedMethod.id,
        reason:
          selectedMethod.reason ||
          (methodology !== 'auto' ? `user selected ${selectedMethod.id}` : 'auto-detected'),
        candidates:
          fusionResult?.methodologyScores?.slice(0, 3).map((s: any) => s.methodology) || [],
      },
      confidence: fusionResult ? fusionResult.confidence : undefined,
      queryAnalysis: fusionResult
        ? {
            complexity: fusionResult.analysis.complexity,
            queryType: fusionResult.analysis.queryType,
            keywords: fusionResult.analysis.keywords.slice(0, 8),
            requiresTools: fusionResult.analysis.requiresTools,
            requiresMultiPerspective: fusionResult.analysis.requiresMultiPerspective,
            isMathematical: fusionResult.analysis.isMathematical,
            isCreative: fusionResult.analysis.isCreative,
          }
        : undefined,
      methodologyScores:
        fusionResult?.methodologyScores?.slice(0, 4).map((s: any) => ({
          methodology: s.methodology,
          score: Math.round(s.score * 100),
          reasons: s.reasons,
        })) || [],
      guardReasons: fusionResult?.guardReasons || [],
      processingMode: fusionResult?.processingMode,
      activeLenses: fusionResult?.activeLenses || [],
      narrative: `Selected ${selectedMethod.id} methodology${fusionResult ? ` with ${Math.round(fusionResult.confidence * 100)}% confidence` : ''}. ${selectedMethod.reason || 'This approach gives the clearest signal-to-noise ratio.'}`,
    },
  });

  // Emit: layer activations (with keywords + path activations)
  if (fusionResult) {
    const dominant = fusionResult.dominantLayers[0];
    const dominantName = dominant ? LAYER_METADATA[dominant]?.aiName || 'unknown' : 'none';
    const layerDetails: Record<
      number,
      { name: string; weight: number; activated: boolean; keywords: string[] }
    > = {};
    for (const [key, val] of Object.entries(weights)) {
      const num = Number(key) as Layer;
      const meta = LAYER_METADATA[num];
      if (meta) {
        const activation = fusionResult.layerActivations.find((a: any) => a.layerNode === num);
        layerDetails[num] = {
          name: meta.aiName,
          weight: activation
            ? Math.round(activation.effectiveWeight * 100)
            : Math.round((val as number) * 100),
          activated: fusionResult.dominantLayers.includes(num),
          keywords: activation?.keywords?.slice(0, 4) || [],
        };
      }
    }
    const pathActs =
      fusionResult.pathActivations?.slice(0, 5).map((p: any) => ({
        from: LAYER_METADATA[p.from as Layer]?.aiName || String(p.from),
        to: LAYER_METADATA[p.to as Layer]?.aiName || String(p.to),
        weight: Math.round(p.weight * 100),
        description: p.description,
      })) || [];

    emitAndPersist(queryId, {
      id: `${queryId}-layers`,
      queryId,
      stage: 'layers',
      timestamp: Date.now() - startTime,
      data: `Activating ${dominantName} · ${fusionResult.dominantLayers.length} layers engaged`,
      details: {
        layers: layerDetails,
        dominantLayer: dominantName,
        pathActivations: pathActs,
        narrative: dominant
          ? `${fusionResult.dominantLayers.length} computational layers activated. ${dominantName} is dominant at ${layerDetails[dominant]?.weight || 0}% — prioritizing deep analysis.`
          : `Computational layers analyzed — no dominant layer detected, using balanced processing.`,
      },
    });
  }
}

/**
 * Enhance a system prompt with fusion data + layer configuration.
 */
export function applyFusionToPrompt(
  systemPrompt: string,
  fusionResult: IntelligenceFusionResult,
  weights: Record<number, number>
): string {
  const fusionEnhancement = generateEnhancedSystemPrompt(fusionResult, weights);
  const enhanced = `${systemPrompt}\n\n${fusionEnhancement}`;

  const layerSummary = Object.entries(weights)
    .map(([k, v]) => {
      const pct = Math.round((v as number) * 100);
      const name = LAYER_METADATA[Number(k) as Layer]?.aiName || k;
      return `${name}:${pct}%`;
    })
    .join(', ');
  log('INFO', 'FUSION', `Layer config: ${layerSummary}`);
  log(
    'INFO',
    'FUSION',
    `Enhanced system prompt with Layer behaviors (+${fusionEnhancement.length} chars)`
  );

  return enhanced;
}
