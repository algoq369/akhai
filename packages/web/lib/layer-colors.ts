/**
 * Layers Color System for Depth Annotations
 * Uses TITLE_LAYER_MAP from ResponseRenderer as single source of truth
 */

import { TITLE_LAYER_MAP } from '@/components/ResponseRenderer';

export interface LayerColorInfo {
  name: string;
  meaning: string;
  color: string;
  shape: string;
  annotationType: string;
}

/**
 * Get layer color info by matching annotation content against the 11-layer keyword map.
 * Uses TITLE_LAYER_MAP — the same map ResponseRenderer uses for section coloring.
 */
export function getLayerColorForAnnotation(content: string, term?: string): LayerColorInfo {
  // Check BOTH term and content against keywords — term is often more specific
  const searchText = term ? `${term} ${content}`.toLowerCase() : content.toLowerCase();

  for (const entry of TITLE_LAYER_MAP) {
    if (entry.keywords.some((kw) => searchText.includes(kw))) {
      return {
        name: entry.layer,
        meaning: entry.layer,
        color: entry.color,
        shape: entry.sigil,
        annotationType: entry.layer.toLowerCase(),
      };
    }
  }

  // Domain-specific term matching (catches terms the abstract TITLE_LAYER_MAP keywords miss)
  // Metrics/financials → Discriminator (red ⊕)
  if (
    /\$[\d,]+[KMB]?|\b\d+%|\b\d+x\b|\brevenue\b|\bvaluation\b|\bgrowth\b|\bbillion\b|\bmillion\b/i.test(
      searchText
    )
  ) {
    return {
      name: 'Discriminator',
      meaning: 'Critical metric',
      color: '#EF4444',
      shape: '⊕',
      annotationType: 'discriminator',
    };
  }
  // Technology/implementation → Executor (purple ▽)
  if (
    /\bblockchain\b|\bprotocol\b|\bAPI\b|\bSDK\b|\bdeployment\b|\binfrastructure\b|\bpipeline\b|\btraining\b|\binference\b|\bmodel\b/i.test(
      searchText
    )
  ) {
    return {
      name: 'Executor',
      meaning: 'Implementation',
      color: '#9333EA',
      shape: '▽',
      annotationType: 'executor',
    };
  }
  // Paradigm-level concepts → Meta-Core (deep purple ◇)
  if (
    /\bAGI\b|\bsingularity\b|\bconsciousness\b|\bparadigm\b|\btranshumanism\b|\brevolution/i.test(
      searchText
    )
  ) {
    return {
      name: 'Meta-Core',
      meaning: 'Paradigm shift',
      color: '#7C3AED',
      shape: '◇',
      annotationType: 'meta-core',
    };
  }
  // Brands/orgs → Classifier (orange □)
  if (
    /\bOpenAI\b|\bAnthropic\b|\bGoogle\b|\bDeepMind\b|\bMeta\b|\bMicrosoft\b|\bApple\b|\bTesla\b|\bxAI\b|\bMistral\b/i.test(
      searchText
    )
  ) {
    return {
      name: 'Classifier',
      meaning: 'Entity classification',
      color: '#F97316',
      shape: '□',
      annotationType: 'classifier',
    };
  }
  // Countries/regions → Encoder (indigo △)
  if (
    /\bIndia\b|\bChina\b|\bUSA\b|\bEurope\b|\bAfrica\b|\bJapan\b|\bRussia\b|\bUK\b|\bGermany\b|\bFrance\b|\bBrazil\b/i.test(
      searchText
    )
  ) {
    return {
      name: 'Encoder',
      meaning: 'Geopolitical pattern',
      color: '#6366F1',
      shape: '△',
      annotationType: 'encoder',
    };
  }

  // Default: Embedding (raw-data)
  return {
    name: 'Embedding',
    meaning: 'Embedding',
    color: '#F59E0B',
    shape: '○',
    annotationType: 'raw-data',
  };
}
