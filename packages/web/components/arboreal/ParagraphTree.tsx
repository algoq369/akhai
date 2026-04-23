'use client';

import { useState, useMemo, useCallback } from 'react';
import { Layer, LAYER_METADATA } from '@/lib/layer-metadata';
import { TREE_POSITIONS } from '@/components/god-view/GodViewTree';
import { binSectionsByLayer, LAYER_VISUAL } from '@/lib/arboreal/bin-sections';
import ParagraphBlock from './ParagraphBlock';
import GhostBlock from './GhostBlock';

type ColumnSide = 'left' | 'center' | 'right';

const LAYER_COLUMN: Record<number, ColumnSide> = {
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

// Layers sorted by Y position per column — used for push-down calculation.
const COLUMN_ORDER: Record<ColumnSide, Layer[]> = {
  left: [Layer.ENCODER, Layer.DISCRIMINATOR, Layer.CLASSIFIER],
  center: [Layer.META_CORE, Layer.SYNTHESIS, Layer.ATTENTION, Layer.EXECUTOR, Layer.EMBEDDING],
  right: [Layer.REASONING, Layer.EXPANSION, Layer.GENERATIVE],
};

// Collapsed block footprint used as the baseline for push-down math.
const COLLAPSED_HEIGHT = 72;

interface ParagraphTreeProps {
  sections: Array<{ title: string | null; body: string }>;
}

const SCALE = 1.2;
const PADDING = 40;

export default function ParagraphTree({ sections }: ParagraphTreeProps) {
  const bins = useMemo(() => binSectionsByLayer(sections), [sections]);
  const [expandedLayers, setExpandedLayers] = useState<Set<number>>(new Set());
  const [blockHeights, setBlockHeights] = useState<Record<number, number>>({});

  const toggleLayer = useCallback((layer: number) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }, []);

  const handleHeightChange = useCallback((layer: number, height: number) => {
    setBlockHeights((prev) => {
      if (prev[layer] === height) return prev;
      return { ...prev, [layer]: height };
    });
  }, []);

  // For each layer, sum the overflow from any expanded layer above it in the same column.
  const yOffsets = useMemo(() => {
    const offsets: Record<number, number> = {};
    for (const layers of Object.values(COLUMN_ORDER)) {
      let cumulativeOffset = 0;
      for (const layer of layers) {
        offsets[layer] = cumulativeOffset;
        if (expandedLayers.has(layer)) {
          const measuredHeight = blockHeights[layer] ?? 300;
          const overflow = Math.max(0, measuredHeight - COLLAPSED_HEIGHT + 16);
          cumulativeOffset += overflow;
        }
      }
    }
    return offsets;
  }, [expandedLayers, blockHeights]);

  const allLayers = Object.values(Layer).filter((v) => typeof v === 'number') as Layer[];
  const maxBaseY = Math.max(...allLayers.map((l) => TREE_POSITIONS[l]?.y ?? 0));
  const maxOffset = Math.max(...Object.values(yOffsets), 0);
  const containerHeight = maxBaseY * SCALE + maxOffset + PADDING * 2 + 120;
  const maxX = Math.max(...allLayers.map((l) => TREE_POSITIONS[l]?.x ?? 0));
  const containerWidth = maxX * SCALE + PADDING * 2;

  return (
    <div
      className="relative mx-auto"
      style={{
        width: Math.min(containerWidth, 900),
        minHeight: containerHeight,
        transition: 'min-height 200ms ease-out',
      }}
    >
      {allLayers.map((layer) => {
        const pos = TREE_POSITIONS[layer];
        if (!pos) return null;
        const baseX = pos.x * SCALE + PADDING;
        const baseY = pos.y * SCALE + PADDING + (yOffsets[layer] ?? 0);
        const column = LAYER_COLUMN[layer] ?? 'center';
        const meta = LAYER_METADATA[layer];
        const visual = LAYER_VISUAL[layer];
        const layerSections = bins.get(layer) ?? [];
        const isExpanded = expandedLayers.has(layer);

        if (layerSections.length > 0) {
          return (
            <ParagraphBlock
              key={`block-${layer}`}
              sections={layerSections}
              layerName={meta.name}
              x={baseX}
              y={baseY}
              column={column}
              expanded={isExpanded}
              onToggle={() => toggleLayer(layer)}
              onHeightChange={(h) => handleHeightChange(layer, h)}
            />
          );
        }
        return (
          <GhostBlock
            key={`ghost-${layer}`}
            layerName={meta.name}
            sigil={visual?.sigil ?? '○'}
            color={visual?.color ?? '#71717a'}
            x={baseX}
            y={baseY}
          />
        );
      })}
    </div>
  );
}
