'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Layer, LAYER_METADATA } from '@/lib/layer-metadata';
import { TREE_POSITIONS } from '@/components/god-view/GodViewTree';
import { binSectionsByLayer, LAYER_VISUAL } from '@/lib/arboreal/bin-sections';
import {
  COLLAPSED_HEIGHT,
  COLUMN_ORDER,
  LAYER_COLUMN,
  PADDING,
  SCALE,
  collectHeights,
} from '@/lib/arboreal/tree-layout';
import { useArborealThreadCounts } from '@/hooks/useArborealThreadCounts';
import ParagraphBlock from './ParagraphBlock';
import GhostBlock from './GhostBlock';

interface ParagraphTreeProps {
  sections: Array<{ title: string | null; body: string }>;
  queryId: string;
  query: string;
}

export default function ParagraphTree({ sections, queryId, query }: ParagraphTreeProps) {
  const bins = useMemo(() => binSectionsByLayer(sections), [sections]);
  const [expandedLayers, setExpandedLayers] = useState<Set<number>>(new Set());
  const [measuredHeights, setMeasuredHeights] = useState<Record<number, number>>({});
  const threadCounts = useArborealThreadCounts(queryId);
  const treeRef = useRef<HTMLDivElement>(null);

  const siblingTitles = useMemo<string[]>(
    () => [...bins.values()].flatMap((ls) => ls.flatMap((s) => (s.title ? [s.title] : []))),
    [bins]
  );

  const toggleLayer = useCallback((layer: number) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }, []);

  useLayoutEffect(() => {
    if (!treeRef.current) return;
    setMeasuredHeights(collectHeights(treeRef.current, expandedLayers));
    const timer = setTimeout(() => {
      if (!treeRef.current) return;
      const next = collectHeights(treeRef.current, expandedLayers);
      setMeasuredHeights((prev) => {
        const changed = Object.keys(next).some((k) => prev[Number(k)] !== next[Number(k)]);
        return changed ? next : prev;
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [expandedLayers]);

  const yOffsets = useMemo(() => {
    const offsets: Record<number, number> = {};
    for (const layers of Object.values(COLUMN_ORDER)) {
      let cumulativeOffset = 0;
      for (const layer of layers) {
        offsets[layer] = cumulativeOffset;
        if (expandedLayers.has(layer)) {
          const h = measuredHeights[layer] ?? 300;
          const overflow = Math.max(0, h - COLLAPSED_HEIGHT + 16);
          cumulativeOffset += overflow;
        }
      }
    }
    return offsets;
  }, [expandedLayers, measuredHeights]);

  const allLayers = Object.values(Layer).filter((v) => typeof v === 'number') as Layer[];
  const maxBaseY = Math.max(...allLayers.map((l) => TREE_POSITIONS[l]?.y ?? 0));
  const maxOffset = Math.max(...Object.values(yOffsets), 0);
  const containerHeight = maxBaseY * SCALE + maxOffset + PADDING * 2 + 120;
  const maxX = Math.max(...allLayers.map((l) => TREE_POSITIONS[l]?.x ?? 0));
  const containerWidth = maxX * SCALE + PADDING * 2;

  return (
    <div
      ref={treeRef}
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
              queryId={queryId}
              query={query}
              siblingTitles={siblingTitles}
              threadMessageCount={threadCounts[layer] ?? 0}
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
