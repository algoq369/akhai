'use client'

/**
 * GodViewPanel — Slide-in overlay panel for the Neural Tree + Activity Feed.
 * Right side, 420px wide. Top 60% = GodViewTree, Bottom 40% = ActivityFeed.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useGodViewStore } from '@/lib/stores/god-view-store'
import GodViewTree from './GodViewTree'
import ActivityFeed from './ActivityFeed'

export default function GodViewPanel() {
  const panelOpen = useGodViewStore((s) => s.panelOpen)
  const closePanel = useGodViewStore((s) => s.closePanel)
  const activations = useGodViewStore((s) => s.activations)
  const isProcessing = useGodViewStore((s) => s.isProcessing)

  return (
    <AnimatePresence>
      {panelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={closePanel}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[420px] max-w-[90vw] bg-[#0a0a0b] border-l border-relic-slate/20 shadow-2xl flex flex-col font-mono"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-relic-slate/15">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-relic-silver/60">◊</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-relic-silver/80">
                  Neural Tree
                </span>
                {isProcessing && (
                  <span className="text-[7px] text-amber-400 animate-pulse ml-2">PROCESSING</span>
                )}
              </div>
              <button
                onClick={closePanel}
                className="text-relic-silver/40 hover:text-relic-silver text-[11px] p-1 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Tree section (60%) */}
            <div className="flex-[6] min-h-0 overflow-hidden px-2 py-2">
              <GodViewTree
                activations={activations.layerWeights}
                dominantLayers={activations.dominantLayers}
                pathActivations={activations.pathActivations}
                isLive={isProcessing}
                compact={true}
                showPaths={true}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-relic-slate/15" />

            {/* Activity Feed section (40%) */}
            <div className="flex-[4] min-h-0 overflow-hidden">
              <ActivityFeed />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
