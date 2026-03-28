import { Layer, LAYER_METADATA } from '@/lib/layer-registry';

// Reverse lookup: AI name → Layer enum value
export const AI_NAME_TO_LAYER: Record<string, Layer> = Object.fromEntries(
  Object.entries(LAYER_METADATA).map(([key, meta]) => [meta.aiName, parseInt(key) as Layer])
) as Record<string, Layer>;

// Analytics helper — PostHog tracking for queries
export const trackQuery = (data: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture('query_event', data);
  }
};

/** Helper to build the intelligence object from fusion data */
export function buildIntelligence(fusion: any) {
  if (!fusion) return undefined;
  return {
    analysis: {
      complexity: fusion.confidence || 0,
      queryType: fusion.methodology || 'direct',
      keywords: fusion.layerActivations?.[0]?.keywords || [],
    },
    layerActivations: (fusion.layerActivations || []).map((s: any) => ({
      layerNode: AI_NAME_TO_LAYER[s.name] ?? 0,
      name: s.name,
      activation: s.effectiveWeight || 0,
      effectiveWeight: s.effectiveWeight || 0,
    })),
    dominantLayers: fusion.dominantLayers || [],
    pathActivations: [],
    methodologySelection: {
      selected: fusion.methodology || 'direct',
      confidence: fusion.confidence || 0,
      alternatives: [],
    },
    guard: {
      recommendation: fusion.guardRecommendation || 'proceed',
      reasons: [],
    },
    instinct: {
      enabled: (fusion.activeLenses || []).length > 0,
      activeLenses: fusion.activeLenses || [],
    },
    processing: {
      mode: fusion.processingMode || 'weighted',
      extendedThinkingBudget: fusion.extendedThinkingBudget || 3000,
    },
    timing: {
      fusionMs: fusion.processingTimeMs || 0,
    },
  };
}
