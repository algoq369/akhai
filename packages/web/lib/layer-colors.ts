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
export function getLayerColorForAnnotation(content: string): LayerColorInfo {
  const lower = content.toLowerCase();

  for (const entry of TITLE_LAYER_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return {
        name: entry.layer,
        meaning: entry.layer,
        color: entry.color,
        shape: entry.sigil,
        annotationType: entry.layer.toLowerCase(),
      };
    }
  }

  // Default: Embedding (raw-data)
  return {
    name: 'Embedding',
    meaning: 'Embedding',
    color: '#F59E0B',
    shape: '●',
    annotationType: 'raw-data',
  };
}
