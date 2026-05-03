import { Layer } from '@/lib/layer-metadata';

export type ColumnSide = 'left' | 'center' | 'right';

export const LAYER_COLUMN: Record<number, ColumnSide> = {
  [Layer.ENCODER]: 'left',
  [Layer.DISCRIMINATOR]: 'left',
  [Layer.CLASSIFIER]: 'left',
  [Layer.META_CORE]: 'center',
  [Layer.SYNTHESIS]: 'center',
  [Layer.ATTENTION]: 'center',
  [Layer.EXECUTOR]: 'center',
  [Layer.EMBEDDING]: 'center',
  [Layer.REASONING]: 'right',
  [Layer.EXPANSION]: 'right',
  [Layer.GENERATIVE]: 'right',
};

export const COLUMN_ORDER: Record<ColumnSide, Layer[]> = {
  left: [Layer.ENCODER, Layer.DISCRIMINATOR, Layer.CLASSIFIER],
  center: [Layer.META_CORE, Layer.SYNTHESIS, Layer.ATTENTION, Layer.EXECUTOR, Layer.EMBEDDING],
  right: [Layer.REASONING, Layer.EXPANSION, Layer.GENERATIVE],
};

export const COLLAPSED_HEIGHT = 72;
export const SCALE = 1.2;
export const PADDING = 40;

export function collectHeights(root: HTMLElement, layers: Set<number>): Record<number, number> {
  const heights: Record<number, number> = {};
  for (const layer of layers) {
    const el = root.querySelector(`[data-arboreal-layer="${layer}"]`) as HTMLElement | null;
    if (el) heights[layer] = el.offsetHeight;
  }
  return heights;
}
