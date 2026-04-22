/**
 * BIN SECTIONS BY LAYER
 *
 * Pure data transformation — takes response sections (from parseIntoSections)
 * and bins them into Sefirot layers via detectLayerFromTitle. Also exposes
 * LAYER_VISUAL: sigil + hex color per Layer enum, for Ghost/Paragraph blocks
 * to style themselves consistently (LAYER_METADATA has no sigil field and
 * uses Tailwind color names, not hex).
 *
 * @module bin-sections
 */

import { Layer } from '@/lib/layer-metadata';
import { detectLayerFromTitle } from '@/components/ResponseRenderer';

export interface ArborealSection {
  title: string | null;
  body: string;
  color: string;
  sigil: string;
  layer: Layer;
  originalIndex: number;
}

const LAYER_NAME_TO_ENUM: Record<string, Layer> = {
  'Meta-Core': Layer.META_CORE,
  Reasoning: Layer.REASONING,
  Encoder: Layer.ENCODER,
  Synthesis: Layer.SYNTHESIS,
  Expansion: Layer.EXPANSION,
  Discriminator: Layer.DISCRIMINATOR,
  Attention: Layer.ATTENTION,
  Generative: Layer.GENERATIVE,
  Classifier: Layer.CLASSIFIER,
  Executor: Layer.EXECUTOR,
  Embedding: Layer.EMBEDDING,
};

/** Visual metadata per Layer — sigil + hex color, used by GhostBlock. */
export const LAYER_VISUAL: Record<Layer, { sigil: string; color: string }> = {
  [Layer.META_CORE]: { sigil: '◇', color: '#7C3AED' },
  [Layer.REASONING]: { sigil: '⬡', color: '#6B7280' },
  [Layer.ENCODER]: { sigil: '△', color: '#6366F1' },
  [Layer.SYNTHESIS]: { sigil: '✦', color: '#06B6D4' },
  [Layer.EXPANSION]: { sigil: '○', color: '#3B82F6' },
  [Layer.DISCRIMINATOR]: { sigil: '◈', color: '#EF4444' },
  [Layer.ATTENTION]: { sigil: '⊙', color: '#EAB308' },
  [Layer.GENERATIVE]: { sigil: '⬢', color: '#22C55E' },
  [Layer.CLASSIFIER]: { sigil: '□', color: '#F97316' },
  [Layer.EXECUTOR]: { sigil: '▽', color: '#9333EA' },
  [Layer.EMBEDDING]: { sigil: '⊘', color: '#F59E0B' },
};

export function binSectionsByLayer(
  sections: Array<{ title: string | null; body: string }>
): Map<Layer, ArborealSection[]> {
  const result = new Map<Layer, ArborealSection[]>();
  sections.forEach((section, idx) => {
    const info = section.title
      ? detectLayerFromTitle(section.title, idx)
      : { layer: 'Embedding', color: '#F59E0B', sigil: '⊘' };
    const enumLayer = LAYER_NAME_TO_ENUM[info.layer] ?? Layer.EMBEDDING;
    const existing = result.get(enumLayer) ?? [];
    existing.push({
      title: section.title,
      body: section.body,
      color: info.color,
      sigil: info.sigil,
      layer: enumLayer,
      originalIndex: idx,
    });
    result.set(enumLayer, existing);
  });
  return result;
}
