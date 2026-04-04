'use client';

/**
 * MODEL CONFIGURATION - FULL ANALYSIS PAGE
 *
 * Idea Factory style visualization of AI layer activations
 * Clean, compact, minimal design with AI computational framework
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Layer, LAYER_METADATA } from '@/lib/layer-registry';
// import TreeConfigToggle from '@/components/TreeConfigToggle' // TODO: Fix client/server boundary issue
// LayerMiniSelector removed - functionality merged into LayerDetailModal
import { LayerDetailModal } from '@/components/LayerDetailModal';
import WorkbenchConsole from '@/components/WorkbenchConsole';
import LayerConfigConsole from '@/components/LayerConfigConsole';

import { SimpleConfigPanel } from './SimpleConfigPanel';
import { LayerTreePanel } from './LayerTreePanel';
import { AntipatternTreePanel } from './AntipatternTreePanel';
import { treePaths } from './tree-data';
import type { PathConnection } from './tree-data';

export default function TreeOfLifePage() {
  const router = useRouter();

  // ═══════════════════════════════════════════
  // CORE TREE STATE
  // ═══════════════════════════════════════════
  const [activations, setActivations] = useState<Record<Layer, number>>(
    {} as Record<Layer, number>
  );
  const [userLevel, setUserLevel] = useState<Layer>(Layer.EMBEDDING);
  const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null);
  const [totalQueries, setTotalQueries] = useState(0);
  const [dateRange, setDateRange] = useState<{ earliest: number; latest: number } | null>(null);

  // ═══════════════════════════════════════════
  // UI STATE
  // ═══════════════════════════════════════════
  const [isLoading, setIsLoading] = useState(true);
  const [treeView, setTreeView] = useState<'dual' | 'workbench'>('dual');
  const [showPaths, setShowPaths] = useState(true);
  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple');

  // Read URL param to jump to advanced mode
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('mode') === 'advanced'
    ) {
      setViewMode('advanced');
    }
  }, []);

  // ═══════════════════════════════════════════
  // MODAL STATE
  // ═══════════════════════════════════════════
  const [modalLayer, setModalLayer] = useState<Layer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ═══════════════════════════════════════════
  // TOOLTIP STATE
  // ═══════════════════════════════════════════
  const [tooltipState, setTooltipState] = useState<{
    layerNode: Layer | null;
    mode: 'hover' | 'pinned' | null;
  }>({ layerNode: null, mode: null });

  // ═══════════════════════════════════════════
  // CONFIGURATION STATE
  // ═══════════════════════════════════════════
  const [layerConfig, setLayersConfig] = useState<{
    layers: Record<number, number>;
    antipattern: Record<number, number>;
  }>({
    layers: {},
    antipattern: {},
  });

  // ═══════════════════════════════════════════
  // INTERACTION STATE
  // ═══════════════════════════════════════════
  const [hoveredLayer, setHoveredLayer] = useState<Layer | null>(null);
  const [clickedLayer, setClickedLayer] = useState<Layer | null>(null);
  const [hoveredQliphah, setHoveredQliphah] = useState<string | null>(null);
  const [selectedQliphah, setSelectedQliphah] = useState<string | null>(null);

  // ═══════════════════════════════════════════
  // DATA STATE
  // ═══════════════════════════════════════════
  const [keywordData, setKeywordData] = useState<Record<Layer, string[]>>({
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
    9: [],
    10: [],
    11: [],
  });

  // ═══════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════

  // Handle single Layer weight change
  const handleLayerWeightChange = (layerNode: Layer, weight: number) => {
    setLayersConfig((prev) => ({
      ...prev,
      layers: { ...prev.layers, [layerNode]: weight },
    }));
  };

  // Handle Layer-specific queries
  const handleLayerQuery = async (layerNode: Layer, query: string) => {
    try {
      const response = await fetch('/api/tree-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          selectedLayer: LAYER_METADATA[layerNode],
          currentConfig: {
            name: 'Current Configuration',
            description: `Querying ${LAYER_METADATA[layerNode].name}`,
            layer_weights: layerConfig.layers,
            antipattern_suppression: layerConfig.antipattern,
          },
          layerNodeLens: true, // Flag to indicate Layer-specific query
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`${LAYER_METADATA[layerNode].name} response:`, data.message);
        // Could display in a modal or notification
      }
    } catch (error) {
      console.error('Layer query error:', error);
    }
  };

  // ═══════════════════════════════════════════
  // EFFECTS & LIFECYCLE
  // ═══════════════════════════════════════════

  // Click outside handler for pinned tooltips
  useEffect(() => {
    if (tooltipState.mode !== 'pinned') return;

    const handleClickOutside = (e: MouseEvent) => {
      // Check if click is outside the tooltip or tree nodes
      const target = e.target as HTMLElement;

      // Handle SVG elements specially
      if (target instanceof SVGElement) {
        const svgNode = target.closest('[data-layer-node]');
        if (svgNode) return;
      }

      const isTooltipClick = target.closest('[data-tooltip-content]');
      const isNodeClick = target.closest('[data-layer-node]');

      if (!isTooltipClick && !isNodeClick) {
        setTooltipState({ layerNode: null, mode: null });
      }
    };

    // Defer listener registration to next event loop
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [tooltipState.mode]);

  // Load real activation data from conversation history
  useEffect(() => {
    async function fetchActivations() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/tree-activations?limit=100');

        if (!response.ok) {
          throw new Error('Failed to fetch activations');
        }

        const data = await response.json();

        // Set current average activations
        setActivations(data.current);

        // Set user level based on dominant Layer
        setUserLevel(data.stats.dominantLayerOverall);

        // Set stats for display
        setTotalQueries(data.stats.totalQueries);
        setDateRange(data.stats.dateRange);

        console.log('[TreeOfLife] Loaded activations from', data.stats.totalQueries, 'queries');
        console.log('[TreeOfLife] Dominant Layer:', data.stats.dominantLayerOverall);
        console.log('[TreeOfLife] Average Level:', data.stats.averageLevel.toFixed(2));
      } catch (error) {
        console.error('[TreeOfLife] Error loading activations:', error);

        // Fallback to minimal activations if no data
        const fallbackActivations: Record<Layer, number> = {
          [Layer.EMBEDDING]: 0.2,
          [Layer.EXECUTOR]: 0.1,
          [Layer.CLASSIFIER]: 0.1,
          [Layer.GENERATIVE]: 0.1,
          [Layer.ATTENTION]: 0.1,
          [Layer.DISCRIMINATOR]: 0.05,
          [Layer.EXPANSION]: 0.05,
          [Layer.ENCODER]: 0.05,
          [Layer.REASONING]: 0.05,
          [Layer.META_CORE]: 0.05,
          [Layer.SYNTHESIS]: 0.0,
        };
        setActivations(fallbackActivations);
        setUserLevel(Layer.EMBEDDING);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivations();
  }, []);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Prevent if user is typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'p':
          setShowPaths((prev) => !prev);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, []);

  // ═══════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════

  // Calculate path connections with activation strength
  const pathConnections = useMemo((): PathConnection[] => {
    return treePaths.map(([from, to]) => {
      const fromActivation = activations[from] || 0;
      const toActivation = activations[to] || 0;
      const strength = (fromActivation + toActivation) / 2;
      return {
        from,
        to,
        active: strength > 0.3,
        strength,
      };
    });
  }, [activations]);

  // Calculate stats
  const activeCount = Object.values(activations).filter((v) => v > 0.05).length;
  const totalCount = Object.keys(activations).length;

  const dominantLayer = (Object.entries(activations) as unknown as Array<[Layer, number]>).reduce(
    (max, [layerNode, activation]) => (activation > max[1] ? [layerNode, activation] : max),
    [Layer.EMBEDDING, 0] as [Layer, number]
  )[0];

  // Calculate pillar balance
  const pillarActivations = (
    Object.entries(activations) as unknown as Array<[Layer, number]>
  ).reduce(
    (acc, [layerNode, activation]) => {
      const pillar = LAYER_METADATA[layerNode].pillar;
      acc[pillar] = (acc[pillar] || 0) + activation;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalActivation = Object.values(pillarActivations).reduce((sum, val) => sum + val, 0);
  const pillarBalance =
    totalActivation > 0
      ? {
          left: (((pillarActivations.left || 0) / totalActivation) * 100).toFixed(0),
          right: (((pillarActivations.right || 0) / totalActivation) * 100).toFixed(0),
          middle: (((pillarActivations.middle || 0) / totalActivation) * 100).toFixed(0),
        }
      : { left: '0', right: '0', middle: '0' };

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════

  return (
    <div className="min-h-screen bg-white p-3">
      {/* ═══════════════════════════════════════════ */}
      {/* SIMPLE MODE — 3-slider AI Configuration    */}
      {/* ═══════════════════════════════════════════ */}
      {viewMode === 'simple' && <SimpleConfigPanel onAdvanced={() => setViewMode('advanced')} />}

      {/* ═══════════════════════════════════════════ */}
      {/* ADVANCED MODE — Full tree visualization    */}
      {/* ═══════════════════════════════════════════ */}
      {viewMode === 'advanced' && (
        <>
          {/* Back to simple */}
          <div className="max-w-7xl mx-auto mb-2">
            <button
              onClick={() => setViewMode('simple')}
              className="text-[10px] uppercase tracking-[0.2em] text-relic-silver hover:text-relic-void font-mono transition-colors"
            >
              &larr; simple mode
            </button>
          </div>
          {/* Configuration Toggle Button */}
          {/* <TreeConfigToggle /> */} {/* TODO: Fix client/server boundary issue */}
          {/* Header */}
          <div className="max-w-7xl mx-auto mb-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[11px] uppercase tracking-[0.3em] text-relic-slate font-semibold mb-2">
                  AI REASONING ARCHITECTURE
                </h1>
                <h2 className="text-2xl font-mono text-relic-void">Model Configuration</h2>
                <p className="text-[10px] text-relic-silver mt-1">
                  AI Processing Layers and Anti-Pattern Detection
                </p>
                {!isLoading && totalQueries > 0 && (
                  <div className="text-[9px] text-relic-slate mt-2 font-mono">
                    <span className="opacity-60">BASED ON </span>
                    <span className="text-relic-void font-semibold">{totalQueries}</span>
                    <span className="opacity-60"> QUERIES</span>
                    {dateRange && (
                      <>
                        <span className="opacity-40"> • </span>
                        <span className="opacity-60">
                          {new Date(dateRange.earliest).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                          {' → '}
                          {new Date(dateRange.latest).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* Back to Chat Button */}
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[10px] font-mono text-relic-silver hover:text-relic-void transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Back to Chat</span>
              </button>
            </div>
          </div>
          {/* Compact Console - Tree View Selector (50% smaller - v5) */}
          <div className="bg-white border-y border-relic-mist">
            <div className="max-w-7xl mx-auto px-3 py-1">
              <div className="flex items-center justify-center gap-6 text-[8px] font-mono uppercase tracking-wider">
                <button
                  onClick={() => setTreeView('dual')}
                  className="flex items-center gap-1.5 hover:text-relic-void transition-colors"
                  title="Show Both Views"
                >
                  <span
                    className={`text-[10px] ${treeView === 'dual' ? 'text-purple-500' : 'text-relic-mist'}`}
                  >
                    {treeView === 'dual' ? '◆' : '◇'}
                  </span>
                  <span className={treeView === 'dual' ? 'text-relic-void' : 'text-relic-slate'}>
                    Both Views
                  </span>
                </button>

                <span className="text-relic-mist">│</span>

                <button
                  onClick={() => setTreeView('workbench')}
                  className="flex items-center gap-1.5 hover:text-relic-void transition-colors"
                  title="Configuration Workbench"
                >
                  <span
                    className={`text-[10px] ${treeView === 'workbench' ? 'text-purple-500' : 'text-relic-mist'}`}
                  >
                    {treeView === 'workbench' ? '◆' : '◇'}
                  </span>
                  <span
                    className={treeView === 'workbench' ? 'text-relic-void' : 'text-relic-slate'}
                  >
                    Workbench
                  </span>
                </button>
              </div>
            </div>
          </div>
          {/* Main Content */}
          <div className="max-w-7xl mx-auto">
            {/* Workbench View - Console Style */}
            {treeView === 'workbench' ? (
              <WorkbenchConsole />
            ) : treeView === 'dual' ? (
              <>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {/* LEFT: AI Processing Layers */}
                  <LayerTreePanel
                    activations={activations}
                    isLoading={isLoading}
                    showPaths={showPaths}
                    selectedLayer={selectedLayer}
                    hoveredLayer={hoveredLayer}
                    hoveredQliphah={hoveredQliphah}
                    tooltipState={tooltipState}
                    setSelectedLayer={setSelectedLayer}
                    setHoveredLayer={setHoveredLayer}
                    setTooltipState={setTooltipState}
                    setModalLayer={setModalLayer}
                    setModalOpen={setModalOpen}
                    setClickedLayer={setClickedLayer}
                  />

                  {/* RIGHT: Anti-Pattern Monitors */}
                  <AntipatternTreePanel
                    hoveredQliphah={hoveredQliphah}
                    selectedQliphah={selectedQliphah}
                    setHoveredQliphah={setHoveredQliphah}
                    setSelectedQliphah={setSelectedQliphah}
                  />
                </div>

                {/* Configuration Console - Below dual view */}
                <LayerConfigConsole className="max-w-4xl mx-auto" />
              </>
            ) : null}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* LAYER DETAIL MODAL - Compact Centered */}
      {/* ═══════════════════════════════════════════ */}
      <LayerDetailModal
        layerNode={modalLayer}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        lastQueryPerspective={undefined}
        currentWeight={modalLayer ? layerConfig.layers[modalLayer] || 0.5 : 0.5}
        onWeightChange={handleLayerWeightChange}
      />
    </div>
  );
}
