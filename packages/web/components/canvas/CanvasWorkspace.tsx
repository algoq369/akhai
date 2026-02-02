'use client'

/**
 * CANVAS WORKSPACE
 * 
 * Main container for the draggable canvas mindmap UI.
 * Provides toggle between Classic and Canvas modes.
 * All panels are draggable with predefined starting positions.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DraggablePanel from './DraggablePanel'
import QueryCardsPanel from './QueryCardsPanel'
import type { QueryCard } from './QueryCardsPanel'
import VisualsPanel from './VisualsPanel'
import type { VisualNode, VisualEdge } from './VisualsPanel'
import TreesPanel from './TreesPanel'
import { useSefirotStore } from '@/lib/stores/sefirot-store'

// Panel position presets
const DEFAULT_POSITIONS = {
  queries: { x: 20, y: 80 },
  visuals: { x: 360, y: 80 },
  ascentTree: { x: 900, y: 80 },
  descentTree: { x: 900, y: 380 },
}

// Local storage key for positions
const POSITIONS_KEY = 'akhai-canvas-positions'
const VIEW_MODE_KEY = 'akhai-view-mode'

interface CanvasWorkspaceProps {
  // Query cards from conversation
  queryCards: QueryCard[]
  // Visual nodes for mindmap
  visualNodes: VisualNode[]
  visualEdges: VisualEdge[]
  // Callbacks
  onQuerySelect?: (queryId: string) => void
  onNodeSelect?: (nodeId: string) => void
  // Classic chat content (rendered when in classic mode)
  classicContent?: React.ReactNode
}

export function CanvasWorkspace({
  queryCards,
  visualNodes,
  visualEdges,
  onQuerySelect,
  onNodeSelect,
  classicContent,
}: CanvasWorkspaceProps) {
  // View mode state
  const [isCanvasMode, setIsCanvasMode] = useState(true) // Start in canvas mode
  const [positions, setPositions] = useState(DEFAULT_POSITIONS)
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  
  // Get weights from store
  const { weights } = useSefirotStore()

  // Load saved positions and view mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPositions = localStorage.getItem(POSITIONS_KEY)
      if (savedPositions) {
        try {
          setPositions(JSON.parse(savedPositions))
        } catch (e) {
          console.warn('Failed to parse saved positions')
        }
      }
      
      const savedMode = localStorage.getItem(VIEW_MODE_KEY)
      if (savedMode) {
        setIsCanvasMode(savedMode === 'canvas')
      }
    }
  }, [])

  // Save positions when they change
  const handlePositionChange = useCallback((panelId: string, position: { x: number; y: number }) => {
    setPositions(prev => {
      const next = { ...prev, [panelId]: position }
      localStorage.setItem(POSITIONS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  // Toggle view mode
  const toggleViewMode = useCallback(() => {
    setIsCanvasMode(prev => {
      const next = !prev
      localStorage.setItem(VIEW_MODE_KEY, next ? 'canvas' : 'classic')
      return next
    })
  }, [])

  // Reset positions to default
  const resetPositions = useCallback(() => {
    setPositions(DEFAULT_POSITIONS)
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(DEFAULT_POSITIONS))
    // Force re-mount panels by toggling a key
    window.location.reload()
  }, [])

  // Handle query selection
  const handleQuerySelect = useCallback((queryId: string) => {
    setSelectedQueryId(queryId)
    onQuerySelect?.(queryId)
  }, [onQuerySelect])

  // Handle node selection
  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
    onNodeSelect?.(nodeId)
  }, [onNodeSelect])

  return (
    <div className="relative w-full h-full min-h-screen">
      {/* Toggle Button - Fixed in header area */}
      <div className="fixed top-3 right-48 z-50">
        <button
          onClick={toggleViewMode}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-relic-mist rounded-lg shadow-sm hover:shadow-md transition-all text-[10px] font-medium"
        >
          <span className={isCanvasMode ? 'text-relic-silver' : 'text-purple-500'}>Classic</span>
          <div className="relative w-8 h-4 bg-relic-ghost rounded-full">
            <motion.div
              className="absolute w-3 h-3 bg-purple-500 rounded-full top-0.5"
              animate={{ left: isCanvasMode ? 16 : 2 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            />
          </div>
          <span className={isCanvasMode ? 'text-purple-500' : 'text-relic-silver'}>Canvas</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isCanvasMode ? (
          /* ═══════════════════════════════════════════════════════════════════ */
          /* CANVAS MODE */
          /* ═══════════════════════════════════════════════════════════════════ */
          <motion.div
            key="canvas"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full min-h-screen bg-[#f8f9fa] overflow-hidden"
          >
            {/* Canvas Background Pattern */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />

            {/* Reset Positions Button */}
            <button
              onClick={resetPositions}
              className="fixed bottom-4 right-4 z-50 px-2 py-1 bg-white border border-relic-mist rounded text-[8px] text-relic-silver hover:text-relic-slate shadow-sm"
            >
              Reset Layout
            </button>

            {/* Queries Panel */}
            <DraggablePanel
              id="queries"
              title="Queries"
              defaultPosition={positions.queries}
              defaultSize={{ width: 320, height: 500 }}
              onPositionChange={handlePositionChange}
              zIndex={10}
            >
              <QueryCardsPanel
                cards={queryCards}
                onCardSelect={handleQuerySelect}
                selectedCardId={selectedQueryId}
              />
            </DraggablePanel>

            {/* Visuals Panel (Mindmap) */}
            <DraggablePanel
              id="visuals"
              title="Mindmap & Insights"
              defaultPosition={positions.visuals}
              defaultSize={{ width: 500, height: 450 }}
              onPositionChange={handlePositionChange}
              zIndex={10}
            >
              <VisualsPanel
                nodes={visualNodes}
                edges={visualEdges}
                onNodeClick={handleNodeSelect}
                selectedNodeId={selectedNodeId}
              />
            </DraggablePanel>

            {/* Ascent Tree Panel */}
            <DraggablePanel
              id="ascentTree"
              title="Ascent Tree"
              defaultPosition={positions.ascentTree}
              defaultSize={{ width: 200, height: 300 }}
              onPositionChange={handlePositionChange}
              zIndex={10}
            >
              <TreesPanel type="ascent" weights={weights} compact />
            </DraggablePanel>

            {/* Descent Tree Panel */}
            <DraggablePanel
              id="descentTree"
              title="Descent Tree"
              defaultPosition={positions.descentTree}
              defaultSize={{ width: 200, height: 300 }}
              onPositionChange={handlePositionChange}
              zIndex={10}
            >
              <TreesPanel type="descent" compact />
            </DraggablePanel>

            {/* Instructions Overlay */}
            <div className="fixed bottom-4 left-4 z-40 max-w-xs">
              <div className="bg-white/90 backdrop-blur border border-relic-mist rounded-lg p-3 shadow-sm">
                <div className="text-[9px] font-medium text-relic-void mb-1">Canvas Mode</div>
                <ul className="text-[8px] text-relic-silver space-y-0.5">
                  <li>• Drag panels by their header</li>
                  <li>• Click cards to highlight connections</li>
                  <li>• Zoom & pan inside the Mindmap</li>
                  <li>• Resize panels from bottom-right corner</li>
                </ul>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════ */
          /* CLASSIC MODE */
          /* ═══════════════════════════════════════════════════════════════════ */
          <motion.div
            key="classic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
