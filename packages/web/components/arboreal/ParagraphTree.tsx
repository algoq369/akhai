'use client';

import { useMemo } from 'react';
import { Layer, LAYER_METADATA } from '@/lib/layer-metadata';
import { TREE_POSITIONS } from '@/components/god-view/GodViewTree';
import { binSectionsByLayer, LAYER_VISUAL } from '@/lib/arboreal/bin-sections';
import ParagraphBlock from './ParagraphBlock';
import GhostBlock from './GhostBlock';

interface ParagraphTreeProps {
  sections: Array<{ title: string | null; body: string }>;
}

const SCALE = 1.8;
const PADDING = 40;

export default function ParagraphTree({ sections }: ParagraphTreeProps) {
  const bins = useMemo(() => binSectionsByLayer(sections), [sections]);

  const allLayers = Object.values(Layer).filter((v) => typeof v === 'number') as Layer[];
  const maxY = Math.max(...allLayers.map((l) => TREE_POSITIONS[l]?.y ?? 0));
  const maxX = Math.max(...allLayers.map((l) => TREE_POSITIONS[l]?.x ?? 0));
  const containerHeight = maxY * SCALE + PADDING * 2;
  const containerWidth = maxX * SCALE + PADDING * 2;

  return (
    <div
      className="relative mx-auto"
      style={{
        width: Math.min(containerWidth, 1100),
        minHeight: containerHeight,
      }}
    >
      {allLayers.map((layer) => {
        const pos = TREE_POSITIONS[layer];
        if (!pos) return null;
        const x = pos.x * SCALE + PADDING;
        const y = pos.y * SCALE + PADDING;
        const meta = LAYER_METADATA[layer];
        const visual = LAYER_VISUAL[layer];
        const layerSections = bins.get(layer) ?? [];
        if (layerSections.length > 0) {
          return (
            <ParagraphBlock
              key={`block-${layer}`}
              sections={layerSections}
              layerName={meta.name}
              x={x}
              y={y}
            />
          );
        }
        return (
          <GhostBlock
            key={`ghost-${layer}`}
            layerName={meta.name}
            sigil={visual.sigil}
            color={visual.color}
            x={x}
            y={y}
          />
        );
      })}
    </div>
  );
}
