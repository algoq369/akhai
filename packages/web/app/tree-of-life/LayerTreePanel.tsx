'use client';

/**
 * LayerTreePanel — left-side AI Processing Layers visualization
 * Contains GodViewTree, hover/pinned tooltips, and status legend.
 * Extracted from tree-of-life/page.tsx
 */

import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layer, LAYER_METADATA } from '@/lib/layer-registry';
import GodViewTree from '@/components/god-view/GodViewTree';
import { getColor, ANTIPATTERN_METADATA, getAntipatternColor } from './tree-data';

interface TooltipState {
  layerNode: Layer | null;
  mode: 'hover' | 'pinned' | null;
}

interface LayerTreePanelProps {
  activations: Record<Layer, number>;
  isLoading: boolean;
  showPaths: boolean;
  selectedLayer: Layer | null;
  hoveredLayer: Layer | null;
  hoveredQliphah: string | null;
  tooltipState: TooltipState;
  setSelectedLayer: (layer: Layer | null) => void;
  setHoveredLayer: (layer: Layer | null) => void;
  setTooltipState: (state: TooltipState) => void;
  setModalLayer: (layer: Layer | null) => void;
  setModalOpen: (open: boolean) => void;
  setClickedLayer: (layer: Layer | null) => void;
}

export function LayerTreePanel({
  activations,
  isLoading,
  showPaths,
  selectedLayer,
  hoveredLayer,
  hoveredQliphah,
  tooltipState,
  setSelectedLayer,
  setHoveredLayer,
  setTooltipState,
  setModalLayer,
  setModalOpen,
  setClickedLayer,
}: LayerTreePanelProps) {
  const svgContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="bg-white border border-relic-mist p-2">
      <div className="text-center text-sm font-mono mb-4 text-relic-slate uppercase tracking-wider">
        AI Processing Layers
      </div>
      <div
        ref={svgContainerRef}
        className="relative mx-auto"
        style={{ width: '450px', height: '600px' }}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-relic-slate border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[9px] uppercase tracking-wider text-relic-slate font-mono">
                Loading Tree Activations...
              </p>
            </div>
          </div>
        )}

        {/* SVG Tree — rendered by GodViewTree (extracted component) */}
        <GodViewTree
          activations={activations}
          showPaths={showPaths}
          onNodeClick={(layer) => {
            setSelectedLayer(selectedLayer === layer ? null : layer);
            setTooltipState({ layerNode: layer, mode: 'pinned' });
            setModalLayer(layer);
            setModalOpen(true);
            setClickedLayer(layer);
            setTimeout(() => setClickedLayer(null), 600);
          }}
          onNodeHover={(layer) => {
            setHoveredLayer(layer);
            if (layer) {
              if (tooltipState.mode !== 'pinned') {
                setTooltipState({ layerNode: layer, mode: 'hover' });
              }
            } else {
              if (tooltipState.mode === 'hover') {
                setTooltipState({ layerNode: null, mode: null });
              }
            }
          }}
        />

        {/* v7: Fixed Side Panel Tooltip (Never Covers Trees) */}
        <AnimatePresence>
          {hoveredLayer && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed right-0 top-20 w-64 bg-white border-l border-relic-mist shadow-lg z-50 max-h-[calc(100vh-100px)] overflow-y-auto"
            >
              {/* Arrow pointing to tree */}
              <div
                className="absolute left-0 top-12 w-0 h-0"
                style={{
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderRight: '8px solid white',
                  transform: 'translateX(-100%)',
                }}
              />

              <div className="bg-white border border-relic-mist p-2 shadow-sm text-[8px] font-mono">
                {/* Header - Ultra Compact */}
                <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-relic-mist">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getColor(hoveredLayer) }}
                    />
                    <span className="text-[9px] text-relic-void font-semibold uppercase tracking-wider">
                      {LAYER_METADATA[hoveredLayer].name}
                    </span>
                  </div>
                  <span className="text-[7px] text-relic-silver">
                    {LAYER_METADATA[hoveredLayer].meaning}
                  </span>
                </div>

                {/* Compact metrics row */}
                <div className="flex items-center justify-between mb-1.5 text-[7px]">
                  <span className="text-relic-silver">ACT:</span>
                  <span className="text-relic-void font-semibold">
                    {(activations[hoveredLayer] * 100).toFixed(0)}%
                  </span>
                  <span className="text-relic-mist">│</span>
                  <span className="text-relic-silver">PIL:</span>
                  <span className="text-relic-void uppercase">
                    {LAYER_METADATA[hoveredLayer].pillar[0]}
                  </span>
                  <span className="text-relic-mist">│</span>
                  <span className="text-relic-silver">LVL:</span>
                  <span className="text-relic-void">
                    {hoveredLayer === 11 ? '∞' : hoveredLayer}
                  </span>
                </div>

                {/* AI Layer (condensed) */}
                <div className="mb-1.5">
                  <div className="text-[7px] uppercase tracking-wider text-relic-silver mb-0.5">
                    ▸ AI Layer
                  </div>
                  <div className="text-[8px] text-relic-void leading-tight">
                    {LAYER_METADATA[hoveredLayer].aiRole.split('•')[0].trim()}
                  </div>
                </div>

                {/* Reasoning (condensed - first sentence only) */}
                <div className="pt-1.5 border-t border-relic-mist">
                  <div className="text-[7px] uppercase tracking-wider text-relic-silver mb-0.5">
                    ▸ Why Active
                  </div>
                  <div className="text-[8px] text-relic-void leading-tight line-clamp-2">
                    {LAYER_METADATA[hoveredLayer].aiRole.split('.')[0]}.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Antipattern Tooltip - v7 Fixed Panel */}
          {hoveredQliphah && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed right-0 top-20 w-64 bg-white border-l border-red-900/20 shadow-lg z-50 max-h-[calc(100vh-100px)] overflow-y-auto"
            >
              {/* Arrow pointing to tree */}
              <div
                className="absolute left-0 top-12 w-0 h-0"
                style={{
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderRight: '8px solid white',
                  transform: 'translateX(-100%)',
                }}
              />

              <div className="bg-white border border-red-900/20 p-2 shadow-sm text-[8px] font-mono">
                {(() => {
                  const node = ANTIPATTERN_METADATA[hoveredQliphah];
                  const color = getAntipatternColor(node.severity);

                  return (
                    <>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-relic-mist">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[9px] text-red-900 font-semibold uppercase tracking-wider">
                            {node.name}
                          </span>
                        </div>
                        <span className="text-[7px] text-relic-silver uppercase">
                          {node.severity}
                        </span>
                      </div>

                      {/* Anti-Pattern */}
                      <div className="mb-1.5">
                        <div className="text-[7px] uppercase tracking-wider text-relic-silver mb-0.5">
                          ▸ Anti-Pattern
                        </div>
                        <div className="text-[8px] text-relic-void leading-tight font-semibold">
                          {node.pattern}
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="mb-1.5">
                        <div className="text-[7px] uppercase tracking-wider text-relic-silver mb-0.5">
                          ▸ What It Is
                        </div>
                        <div className="text-[8px] text-red-700 leading-tight">
                          {node.explanation}
                        </div>
                      </div>

                      {/* Detection */}
                      <div className="pt-1.5 border-t border-relic-mist">
                        <div className="text-[7px] uppercase tracking-wider text-relic-silver mb-0.5">
                          ▸ Detection
                        </div>
                        <div className="text-[8px] text-relic-void leading-tight line-clamp-2">
                          {node.detection}
                        </div>
                      </div>

                      {/* Protection */}
                      <div className="pt-1.5 border-t border-relic-mist mt-1.5">
                        <div className="text-[7px] uppercase tracking-wider text-green-700 mb-0.5">
                          ▸ Protection
                        </div>
                        <div className="text-[8px] text-green-700 leading-tight">
                          {node.protection}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status legend */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 text-[9px] font-mono text-relic-slate">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Active
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            Developing
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            Planned
          </div>
        </div>
      </div>
    </div>
  );
}
