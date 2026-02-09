'use client'

/**
 * CANVAS WORKSPACE
 *
 * Main container for the draggable canvas mindmap UI.
 * Provides toggle between Classic and Canvas modes.
 * All panels are draggable with responsive starting positions.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DraggablePanel from './DraggablePanel'
import QueryCardsPanel from './QueryCardsPanel'
import type { QueryCard } from './QueryCardsPanel'
import type { VisualNode, VisualEdge } from './VisualsPanel'
import AILayersPanel from './AILayersPanel'
import type { AIInsight } from './AILayersPanel'
import { LayerTreeSVG } from '@/components/tree-workbench/LayerTreeSVG'
import { AntipatternTreeSVG } from '@/components/tree-workbench/AntipatternTreeSVG'
import { useLayerStore } from '@/lib/stores/layer-store'
import { Layer, LAYER_METADATA } from '@/lib/layer-registry'

// Stable empty arrays to prevent Zustand infinite re-render loop
const EMPTY_INSIGHTS: AIInsight[] = []

// ═══════════════════════════════════════════════════════════════════
// RESPONSIVE LAYOUT
// ═══════════════════════════════════════════════════════════════════

const GAP = 10
const TOP_Y = 80

/**
 * Calculate panel positions and sizes that fit within the available width.
 * Three tiers: wide (3-col side-by-side), medium (3-col compressed), narrow (stacked).
 */
function getResponsiveLayout(containerWidth: number) {
  // Wide: ≥1200px → compact panels side-by-side
  if (containerWidth >= 1200) {
    return {
      positions: {
        queries: { x: GAP, y: TOP_Y },
        visuals: { x: GAP * 2 + 280, y: TOP_Y },
        trees:   { x: GAP * 3 + 280 + 360, y: TOP_Y },
      },
      sizes: {
        queries: { width: 280, height: 350 },
        visuals: { width: 360, height: 350 },
        trees:   { width: 320, height: 350 },
      },
    }
  }

  // Medium: 700-1199px → compressed 3-column layout
  if (containerWidth >= 700) {
    const usable = containerWidth - GAP * 4
    const qW = Math.floor(usable * 0.33)
    const vW = Math.floor(usable * 0.38)
    const tW = usable - qW - vW
    return {
      positions: {
        queries: { x: GAP, y: TOP_Y },
        visuals: { x: GAP * 2 + qW, y: TOP_Y },
        trees:   { x: GAP * 3 + qW + vW, y: TOP_Y },
      },
      sizes: {
        queries: { width: qW, height: 350 },
        visuals: { width: vW, height: 350 },
        trees:   { width: tW, height: 350 },
      },
    }
  }

  // Narrow: <700px → vertical stack
  return {
    positions: {
      queries: { x: GAP, y: TOP_Y },
      visuals: { x: GAP, y: TOP_Y + 320 },
      trees:   { x: GAP, y: TOP_Y + 640 },
    },
    sizes: {
      queries: { width: Math.max(280, containerWidth - GAP * 2), height: 300 },
      visuals: { width: Math.max(280, containerWidth - GAP * 2), height: 300 },
      trees:   { width: Math.max(280, containerWidth - GAP * 2), height: 300 },
    },
  }
}

// Local storage keys
const POSITIONS_KEY = 'akhai-canvas-positions'
const VIEW_MODE_KEY = 'akhai-view-mode'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface CanvasWorkspaceProps {
  // Query cards from conversation
  queryCards: QueryCard[]
  // Visual nodes for mindmap (legacy)
  visualNodes: VisualNode[]
  visualEdges: VisualEdge[]
  // AI Layers panel data
  aiInsights?: AIInsight[]
  totalDataPoints?: number
  overallConfidence?: number
  querySynthesis?: string
  // Callbacks
  onQuerySelect?: (queryId: string) => void
  onNodeSelect?: (nodeId: string) => void
  onInsightSelect?: (insightId: string) => void
  // Classic chat content (rendered when in classic mode)
  classicContent?: React.ReactNode
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function CanvasWorkspace({
  queryCards,
  visualNodes,
  visualEdges,
  aiInsights = [],
  totalDataPoints = 0,
  overallConfidence = 0,
  querySynthesis,
  onQuerySelect,
  onNodeSelect,
  onInsightSelect,
  classicContent,
}: CanvasWorkspaceProps) {
  // View mode state
  const [isCanvasMode, setIsCanvasMode] = useState(true)
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null)

  // Responsive container measurement
  const canvasRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)

  // Compute responsive layout
  const layout = getResponsiveLayout(containerWidth)
  const [positions, setPositions] = useState(layout.positions)
  const [panelSizes, setPanelSizes] = useState(layout.sizes)
  const [layoutKey, setLayoutKey] = useState(0) // bumped to force DraggablePanel remount

  // Get weights from store
  const { weights, processingMode, activePreset, lastMethodologyUsed } = useLayerStore()

  // ── Compute real AI insights from layer weights + query data ──
  const computedInsights = useMemo<AIInsight[]>(() => {
    // Only generate insights when we have active layers AND queries
    const activeLayers = Object.entries(weights)
      .filter(([, w]) => w > 0.1)
      .sort(([, a], [, b]) => b - a)

    if (activeLayers.length === 0 && queryCards.length === 0) return EMPTY_INSIGHTS

    const insights: AIInsight[] = []

    // Generate insights from top active layers
    activeLayers.slice(0, 5).forEach(([layerIdStr, weight], idx) => {
      const layerNum = Number(layerIdStr) as Layer
      const meta = LAYER_METADATA[layerNum]
      if (!meta) return

      const confidence = Math.round(weight * 100)
      const category: AIInsight['category'] =
        idx === 0 ? 'strategy' : idx === 1 ? 'insight' : idx === 2 ? 'data' : 'action'

      insights.push({
        id: `layer-${layerNum}`,
        text: `${meta.aiRole} — active at ${confidence}% (${meta.name})`,
        category,
        confidence,
        metricsCount: meta.queryCharacteristics.length,
        dataPercent: Math.round(weight * 80),
      })
    })

    // Generate insights from recent queries (methodology distribution)
    if (queryCards.length > 0) {
      const methodCounts: Record<string, number> = {}
      queryCards.forEach((card) => {
        const m = card.methodology || 'direct'
        methodCounts[m] = (methodCounts[m] || 0) + 1
      })

      const topMethod = Object.entries(methodCounts).sort(([, a], [, b]) => b - a)[0]
      if (topMethod) {
        insights.push({
          id: 'methodology-dist',
          text: `Primary methodology: ${topMethod[0]} (${topMethod[1]}/${queryCards.length} queries)`,
          category: 'data',
          confidence: Math.round((topMethod[1] / queryCards.length) * 100),
          metricsCount: Object.keys(methodCounts).length,
        })
      }

      // Query count insight
      insights.push({
        id: 'query-count',
        text: `${queryCards.length} queries processed across ${Object.keys(methodCounts).length} methodologies`,
        category: 'insight',
        confidence: 95,
        metricsCount: queryCards.length,
      })
    }

    // Preset/mode insight
    if (activePreset || processingMode !== 'weighted') {
      insights.push({
        id: 'config-mode',
        text: `Configuration: ${activePreset || 'custom'} preset, ${processingMode} processing mode`,
        category: 'strategy',
        confidence: 100,
        metricsCount: 1,
      })
    }

    return insights
  }, [weights, queryCards, activePreset, processingMode])

  const computedTotalDataPoints = useMemo(() => {
    return queryCards.length + Object.values(weights).filter((w) => w > 0.1).length
  }, [queryCards, weights])

  const computedOverallConfidence = useMemo(() => {
    const activeWeightValues = Object.values(weights).filter((w) => w > 0.1)
    if (activeWeightValues.length === 0) return 0
    const avg = activeWeightValues.reduce((s, v) => s + v, 0) / activeWeightValues.length
    return Math.round(avg * 100)
  }, [weights])

  const computedSynthesis = useMemo(() => {
    const active = Object.entries(weights)
      .filter(([, w]) => w > 0.5)
      .map(([id]) => {
        const meta = LAYER_METADATA[Number(id) as Layer]
        return meta?.name || `L${id}`
      })
    if (active.length === 0) return undefined
    return `Dominant layers: ${active.join(', ')}${lastMethodologyUsed ? ` | Last method: ${lastMethodologyUsed}` : ''}`
  }, [weights, lastMethodologyUsed])

  // Merge prop insights with computed ones (props take priority)
  const mergedInsights = useMemo(() => {
    return aiInsights.length > 0 ? aiInsights : computedInsights
  }, [aiInsights, computedInsights])

  const mergedDataPoints = aiInsights.length > 0 ? totalDataPoints : computedTotalDataPoints
  const mergedConfidence = aiInsights.length > 0 ? overallConfidence : computedOverallConfidence
  const mergedSynthesis = querySynthesis || computedSynthesis

  // Tree panel dynamic sizing
  const treePanelRef = useRef<HTMLDivElement>(null)
  const [treePanelDims, setTreePanelDims] = useState({
    width: panelSizes.trees.width,
    height: panelSizes.trees.height - 40, // subtract header height
  })

  // ── Measure tree panel dimensions ──
  useEffect(() => {
    if (!treePanelRef.current) return
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setTreePanelDims({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    obs.observe(treePanelRef.current)
    return () => obs.disconnect()
  }, [isCanvasMode])

  // ── Measure container width ──
  useEffect(() => {
    if (!canvasRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(canvasRef.current)
    // Initial measurement
    setContainerWidth(canvasRef.current.clientWidth)
    return () => observer.disconnect()
  }, [isCanvasMode])

  // ── Load saved positions & validate they fit ──
  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedMode = localStorage.getItem(VIEW_MODE_KEY)
    if (savedMode) {
      setIsCanvasMode(savedMode === 'canvas')
    }

    const savedPositions = localStorage.getItem(POSITIONS_KEY)
    if (savedPositions) {
      try {
        const parsed = JSON.parse(savedPositions)
        // Check if trees panel would be off-screen
        const treesX = parsed.trees?.x ?? 980
        if (treesX > containerWidth - 100) {
          // Cached positions are off-screen — use fresh responsive layout
          localStorage.removeItem(POSITIONS_KEY)
          const fresh = getResponsiveLayout(containerWidth)
          setPositions(fresh.positions)
          setPanelSizes(fresh.sizes)
          setLayoutKey(k => k + 1)
        } else {
          setPositions(parsed)
          setLayoutKey(k => k + 1)
        }
      } catch (e) {
        console.warn('Failed to parse saved positions')
      }
    } else {
      // No saved positions — use responsive defaults
      const fresh = getResponsiveLayout(containerWidth)
      setPositions(fresh.positions)
      setPanelSizes(fresh.sizes)
      setLayoutKey(k => k + 1)
    }
  }, [containerWidth])

  // Save positions when they change
  const handlePositionChange = useCallback((panelId: string, position: { x: number; y: number }) => {
    setPositions(prev => {
      const next = { ...prev, [panelId]: position }
      localStorage.setItem(POSITIONS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  // Reset positions to responsive defaults
  const resetPositions = useCallback(() => {
    localStorage.removeItem(POSITIONS_KEY)
    window.location.reload()
  }, [])

  // Handle selections
  const handleQuerySelect = useCallback((queryId: string) => {
    setSelectedQueryId(queryId)
    onQuerySelect?.(queryId)
  }, [onQuerySelect])

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
    onNodeSelect?.(nodeId)
  }, [onNodeSelect])

  const handleInsightSelect = useCallback((insightId: string) => {
    setSelectedInsightId(insightId)
    onInsightSelect?.(insightId)
  }, [onInsightSelect])

  return (
    <div ref={canvasRef} className="relative w-full h-full min-h-screen">

      <AnimatePresence mode="wait">
        {isCanvasMode ? (
          /* ═══════════════════════════════════════════════════════════════════ */
          /* CANVAS MODE                                                       */
          /* ═══════════════════════════════════════════════════════════════════ */
          <motion.div
            key="canvas"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative w-full h-full min-h-screen bg-[#f8f9fa] overflow-x-hidden overflow-y-auto"
          >
            {/* Canvas Background Pattern */}
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />

            {/* Minimalist Orb Controls */}
            <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3">
              <div className="flex flex-col items-center gap-0.5">
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-3 h-3 rounded-full bg-relic-silver/40 hover:bg-relic-silver border border-relic-mist transition-all hover:scale-125"
                  title="Classic Chat"
                />
                <span className="text-[6px] text-relic-silver/60 select-none">chat</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <button
                  onClick={() => window.location.href = '/tree-of-life'}
                  className="w-3 h-3 rounded-full bg-purple-300/40 hover:bg-purple-400 border border-purple-200/50 transition-all hover:scale-125"
                  title="AI Config"
                />
                <span className="text-[6px] text-relic-silver/60 select-none">config</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <button
                  onClick={resetPositions}
                  className="w-3 h-3 rounded-full bg-relic-ghost border border-relic-mist hover:bg-relic-silver/50 transition-all hover:scale-125"
                  title="Reset Layout"
                />
                <span className="text-[6px] text-relic-silver/60 select-none">reset</span>
              </div>
            </div>

            {/* Queries Panel - Left */}
            <DraggablePanel
              key={`queries-${layoutKey}`}
              id="queries"
              title="Queries"
              defaultPosition={positions.queries}
              defaultSize={panelSizes.queries}
              onPositionChange={handlePositionChange}
              zIndex={10}
            >
              <QueryCardsPanel
                cards={queryCards}
                onCardSelect={handleQuerySelect}
                selectedCardId={selectedQueryId}
              />
            </DraggablePanel>

            {/* AI Computational Layers Panel - Center */}
            <DraggablePanel
              key={`visuals-${layoutKey}`}
              id="visuals"
              title="AI Computational Layers"
              defaultPosition={positions.visuals}
              defaultSize={panelSizes.visuals}
              onPositionChange={handlePositionChange}
              zIndex={10}
            >
              <AILayersPanel
                insights={mergedInsights}
                totalDataPoints={mergedDataPoints}
                overallConfidence={mergedConfidence}
                querySynthesis={mergedSynthesis}
                onInsightClick={handleInsightSelect}
                selectedInsightId={selectedInsightId}
              />
            </DraggablePanel>

            {/* Combined Trees Panel - Right (Ascent + Descent side by side) */}
            <DraggablePanel
              key={`trees-${layoutKey}`}
              id="trees"
              title="Dual Trees"
              defaultPosition={positions.trees}
              defaultSize={panelSizes.trees}
              onPositionChange={handlePositionChange}
              zIndex={10}
            >
              <div ref={treePanelRef} className="flex min-h-0" style={{ overflow: 'visible', height: panelSizes.trees.height - 40 }}>
                <div className="flex-1 border-r border-neutral-100 relative" style={{ overflow: 'visible' }}>
                  <div className="text-center text-[7px] uppercase tracking-wider text-relic-slate py-0.5">
                    AI Processing Layers
                  </div>
                  <LayerTreeSVG
                    width={Math.max(120, Math.floor((treePanelDims.width || panelSizes.trees.width) / 2) - 8)}
                    height={Math.max(200, (treePanelDims.height || panelSizes.trees.height - 40) - 30)}
                    showLabels={true}
                  />
                </div>
                <div className="flex-1 relative" style={{ overflow: 'visible' }}>
                  <div className="text-center text-[7px] uppercase tracking-wider text-red-400 py-0.5">
                    Anti-Pattern Monitors
                  </div>
                  <AntipatternTreeSVG
                    width={Math.max(120, Math.floor((treePanelDims.width || panelSizes.trees.width) / 2) - 8)}
                    height={Math.max(200, (treePanelDims.height || panelSizes.trees.height - 40) - 30)}
                  />
                </div>
              </div>
            </DraggablePanel>

          </motion.div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════ */
          /* CLASSIC MODE                                                      */
          /* ═══════════════════════════════════════════════════════════════════ */
          <motion.div
            key="classic"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full h-full"
          >
            {classicContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CanvasWorkspace
