/**
 * INTELLIGENCE FUSION LAYER
 *
 * Unified intelligence system connecting:
 * - Guard System (anti-hallucination)
 * - Layers AI Computational Tree (11 nodes)
 * - Methodology Selector (7 methodologies)
 * - Side Canal (context awareness)
 * - Instinct Mode (7 Hermetic lenses)
 *
 * This is the brain of AkhAI - where all systems converge.
 */

import { InstinctConfig, generateInstinctPrompt } from './instinct-mode';

// Re-export all types
export type {
  CoreMethodology,
  QueryAnalysis,
  QueryType,
  LayersActivation,
  MethodologyScore,
  IntelligenceFusionResult,
  PathActivation,
} from './intelligence-fusion-types';

// Re-export analysis
export { analyzeQuery } from './intelligence-fusion-analysis';

// Re-export scoring & activation
export {
  calculateLayersActivations,
  selectMethodology,
  assessGuardStatus,
  calculateThinkingBudget,
  calculatePathActivations,
} from './intelligence-fusion-scoring';

// Re-export behaviors & prompt generation
export { generateEnhancedSystemPrompt } from './intelligence-fusion-behaviors';

// Import for internal use in fuseIntelligence
import { analyzeQuery } from './intelligence-fusion-analysis';
import {
  calculateLayersActivations,
  selectMethodology,
  assessGuardStatus,
  calculateThinkingBudget,
  calculatePathActivations,
} from './intelligence-fusion-scoring';
import type { IntelligenceFusionResult } from './intelligence-fusion-types';

// ============================================================
// MAIN FUSION FUNCTION
// ============================================================

export async function fuseIntelligence(
  query: string,
  layersWeights: Record<number, number>,
  instinctConfig: InstinctConfig,
  sideCanal?: { contextInjection: string | null; relatedTopics: string[] }
): Promise<IntelligenceFusionResult> {
  const startTime = Date.now();

  // 1. Analyze query
  const analysis = analyzeQuery(query);
  console.log(
    '[FUSION_DEBUG]',
    JSON.stringify({
      q: query.slice(0, 50),
      complexity: analysis.complexity,
      queryType: analysis.queryType,
      keywords: analysis.keywords?.slice(0, 5),
    })
  );

  // 2. Calculate Layers activations
  const layerActivations = calculateLayersActivations(query, layersWeights);
  const dominantLayers = layerActivations
    .filter((s) => s.effectiveWeight > 0.3)
    .map((s) => s.layerNode);

  // 3. Calculate path activations
  const pathActivations = calculatePathActivations(layerActivations);

  // 4. Select methodology
  const { methodology, scores, confidence } = selectMethodology(analysis, layerActivations);

  // 5. Assess Guard status
  const { recommendation, reasons } = assessGuardStatus(query, analysis);

  // 6. Generate Instinct prompt
  const instinctPrompt = generateInstinctPrompt(instinctConfig);

  // 7. Calculate thinking budget
  const extendedThinkingBudget = calculateThinkingBudget(analysis, layerActivations);

  // 8. Determine processing mode
  const activeCount = layerActivations.filter((s) => s.effectiveWeight > 0.1).length;
  const processingMode: 'weighted' | 'parallel' | 'adaptive' =
    analysis.complexity >= 0.7 && activeCount >= 5 ? 'parallel' : 'weighted';

  return {
    analysis,
    layerActivations,
    dominantLayers,
    pathActivations,
    selectedMethodology: methodology,
    methodologyScores: scores,
    confidence,
    guardRecommendation: recommendation,
    guardReasons: reasons,
    instinctPrompt,
    activeLenses: instinctConfig.enabled ? instinctConfig.activeLenses : [],
    contextInjection: sideCanal?.contextInjection ?? null,
    relatedTopics: sideCanal?.relatedTopics ?? [],
    extendedThinkingBudget,
    processingMode,
    timestamp: Date.now(),
    processingTimeMs: Date.now() - startTime,
  };
}
