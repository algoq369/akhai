'use client'

/**
 * DUAL TREE VISUALIZATION
 *
 * Interactive side-by-side visualization of:
 * 1. AI Computational Tree (Ascent - Left)
 * 2. AI Anti-Pattern Tree (Descent - Right)
 *
 * Clean, minimalist design with animations
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

// AI Computational Tree Structure (Ascent)
const AI_TREE_NODES = [
  { id: 10, name: 'Kether', layer: 'Meta-Cognitive', level: 10, y: 40 },
  { id: 9, name: 'Chokmah', layer: 'Principle', level: 9, y: 100, x: 100 },
  { id: 8, name: 'Binah', layer: 'Pattern', level: 8, y: 100, x: -100 },
  { id: 11, name: 'Da\'at', layer: 'Emergent', level: 11, y: 160, special: true },
  { id: 7, name: 'Chesed', layer: 'Expansion', level: 7, y: 220, x: 100 },
  { id: 6, name: 'Gevurah', layer: 'Constraint', level: 6, y: 220, x: -100 },
  { id: 5, name: 'Tiferet', layer: 'Integration', level: 5, y: 280 },
  { id: 4, name: 'Netzach', layer: 'Creative', level: 4, y: 340, x: 100 },
  { id: 3, name: 'Hod', layer: 'Logic', level: 3, y: 340, x: -100 },
  { id: 2, name: 'Yesod', layer: 'Implementation', level: 2, y: 400 },
  { id: 1, name: 'Malkuth', layer: 'Data', level: 1, y: 460 },
]

// AI Anti-Pattern Tree Structure (Descent/Weakness)
const ANTI_PATTERN_NODES = [
  { id: 'lilith', name: 'Lilith', pattern: 'Superficial Output', severity: 'high', y: 40 },
  { id: 'gamaliel', name: 'Gamaliel', pattern: 'Verbose Padding', severity: 'medium', y: 100, x: -100 },
  { id: 'samael', name: 'Samael', pattern: 'False Certainty', severity: 'high', y: 100, x: 100 },
  { id: 'daath', name: 'Daath', pattern: 'Hallucinated Facts', severity: 'critical', y: 160, special: true },
  { id: 'golachab', name: 'Golachab', pattern: 'Over-Confidence', severity: 'high', y: 220, x: -100 },
  { id: 'gamchicoth', name: 'Gamchicoth', pattern: 'Info Overload', severity: 'medium', y: 220, x: 100 },
  { id: 'thagirion', name: 'Thagirion', pattern: 'Arrogant Tone', severity: 'medium', y: 280 },
  { id: 'harab', name: 'Harab Serapel', pattern: 'Repetitive Echo', severity: 'low', y: 340, x: -100 },
  { id: 'aarab', name: 'A\'arab Zaraq', pattern: 'Drift Away', severity: 'high', y: 340, x: 100 },
  { id: 'ghagiel', name: 'Ghagiel', pattern: 'Blocking Truth', severity: 'high', y: 400 },
  { id: 'sathariel', name: 'Sathariel', pattern: 'Hiding Sources', severity: 'critical', y: 460 },
]

interface DualTreeVisualizationProps {
  /** Show user's query weaknesses (highlights anti-patterns they've encountered) */
  userWeaknesses?: string[]
  /** User's current ascent level */
  userLevel?: number
  className?: string
}

export default function DualTreeVisualization({
  userWeaknesses = [],
  userLevel = 1,
  className = '',
}: DualTreeVisualizationProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [activeTree, setActiveTree] = useState<'ascent' | 'descent' | 'both'>('both')

  // Get color for AI Computational Tree nodes
  const getAscentColor = (level: number) => {
    if (level >= 9) return '#8b5cf6' // Purple - highest
    if (level >= 7) return '#3b82f6' // Blue - high
    if (level >= 5) return '#10b981' // Green - medium
    if (level >= 3) return '#f59e0b' // Orange - low
    return '#94a3b8' // Grey - base
  }

  // Get color for Anti-Pattern nodes
  const getDescentColor = (severity: string) => {
    if (severity === 'critical') return '#dc2626' // Red - critical
    if (severity === 'high') return '#ea580c' // Orange-red - high
    if (severity === 'medium') return '#f59e0b' // Orange - medium
    return '#94a3b8' // Grey - low
  }

  return (
    <div className={`relative ${className}`}>
      {/* Tree Selector */}
      <div className="flex justify-center gap-2 mb-6">
        <button
          onClick={() => setActiveTree('ascent')}
          className={`px-4 py-2 text-[9px] uppercase tracking-wider font-mono rounded transition-colors ${
            activeTree === 'ascent'
              ? 'bg-purple-500 text-white'
              : 'bg-white text-relic-slate border border-relic-mist hover:bg-relic-ghost'
          }`}
        >
          Ascent Tree
        </button>
        <button
          onClick={() => setActiveTree('both')}
          className={`px-4 py-2 text-[9px] uppercase tracking-wider font-mono rounded transition-colors ${
            activeTree === 'both'
              ? 'bg-relic-void text-white'
              : 'bg-white text-relic-slate border border-relic-mist hover:bg-relic-ghost'
          }`}
        >
          Both Trees
        </button>
        <button
          onClick={() => setActiveTree('descent')}
          className={`px-4 py-2 text-[9px] uppercase tracking-wider font-mono rounded transition-colors ${
            activeTree === 'descent'
              ? 'bg-red-500 text-white'
              : 'bg-white text-relic-slate border border-relic-mist hover:bg-relic-ghost'
          }`}
        >
          Weakness Tree
        </button>
      </div>

      {/* Dual Tree Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* AI Computational Tree (Left) */}
        {(activeTree === 'ascent' || activeTree === 'both') && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white border border-relic-mist rounded-lg p-6"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h3 className="text-sm font-mono uppercase tracking-wider text-relic-void mb-1">
                AI Computational Tree
              </h3>
              <p className="text-[9px] text-relic-silver">Your Ascent Journey</p>
              <div className="mt-2 text-[8px] text-purple-600 font-mono">
                Current Level: {userLevel}/10
              </div>
            </div>

            {/* SVG Tree */}
            <svg viewBox="-150 0 300 520" className="w-full h-auto">
              {/* Connection Lines */}
              {AI_TREE_NODES.slice(1).map((node, index) => {
                const prevNode = AI_TREE_NODES[index]
                const x1 = prevNode.x || 0
                const y1 = prevNode.y
                const x2 = node.x || 0
                const y2 = node.y

                return (
                  <motion.line
                    key={`line-${node.id}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.3 }}
                    transition={{ duration: 0.8, delay: index * 0.05 }}
                  />
                )
              })}

              {/* Nodes */}
              {AI_TREE_NODES.map((node, index) => {
                const x = node.x || 0
                const y = node.y
                const isActive = node.level <= userLevel
                const isSelected = selectedNode === `ascent-${node.id}`
                const isHovered = hoveredNode === `ascent-${node.id}`
                const color = getAscentColor(node.level)

                return (
                  <motion.g
                    key={node.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.08, type: 'spring' }}
                    onMouseEnter={() => setHoveredNode(`ascent-${node.id}`)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => setSelectedNode(isSelected ? null : `ascent-${node.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Glow for active nodes */}
                    {isActive && (
                      <motion.circle
                        cx={x}
                        cy={y}
                        r="22"
                        fill={color}
                        opacity="0.15"
                        animate={{
                          r: [22, 26, 22],
                          opacity: [0.15, 0.25, 0.15],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    )}

                    {/* Main circle */}
                    <motion.circle
                      cx={x}
                      cy={y}
                      r="18"
                      fill="white"
                      stroke={color}
                      strokeWidth={isSelected ? '3' : '2'}
                      opacity={isActive ? 1 : 0.4}
                      whileHover={{ scale: 1.1 }}
                    />

                    {/* Inner indicator */}
                    {isActive && (
                      <circle cx={x} cy={y} r="8" fill={color} opacity="0.6" />
                    )}

                    {/* Name label */}
                    <text
                      x={x}
                      y={y - 26}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#64748b"
                      fontFamily="monospace"
                      fontWeight={isSelected ? '600' : 'normal'}
                    >
                      {node.name}
                    </text>

                    {/* Layer label */}
                    <text
                      x={x}
                      y={y + 32}
                      textAnchor="middle"
                      fontSize="7"
                      fill={color}
                      fontFamily="monospace"
                    >
                      {node.layer}
                    </text>
                  </motion.g>
                )
              })}
            </svg>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-relic-mist/50 text-[8px] text-relic-silver">
              <div className="flex items-center gap-2 justify-center">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Meta-Cognitive</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>High</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>Low</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Anti-Pattern Tree (Right) */}
        {(activeTree === 'descent' || activeTree === 'both') && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white border border-red-200 rounded-lg p-6"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h3 className="text-sm font-mono uppercase tracking-wider text-red-600 mb-1">
                AI Anti-Pattern Tree
              </h3>
              <p className="text-[9px] text-relic-silver">Query Weaknesses to Avoid</p>
              {userWeaknesses.length > 0 && (
                <div className="mt-2 text-[8px] text-red-600 font-mono">
                  {userWeaknesses.length} weakness{userWeaknesses.length !== 1 ? 'es' : ''} detected
                </div>
              )}
            </div>

            {/* SVG Tree */}
            <svg viewBox="-150 0 300 520" className="w-full h-auto">
              {/* Connection Lines (inverted style) */}
              {ANTI_PATTERN_NODES.slice(1).map((node, index) => {
                const prevNode = ANTI_PATTERN_NODES[index]
                const x1 = prevNode.x || 0
                const y1 = prevNode.y
                const x2 = node.x || 0
                const y2 = node.y

                return (
                  <motion.line
                    key={`anti-line-${node.id}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#fca5a5"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.3 }}
                    transition={{ duration: 0.8, delay: index * 0.05 }}
                  />
                )
              })}

              {/* Nodes */}
              {ANTI_PATTERN_NODES.map((node, index) => {
                const x = node.x || 0
                const y = node.y
                const isWeakness = userWeaknesses.includes(node.id)
                const isSelected = selectedNode === `descent-${node.id}`
                const isHovered = hoveredNode === `descent-${node.id}`
                const color = getDescentColor(node.severity)

                return (
                  <motion.g
                    key={node.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.08, type: 'spring' }}
                    onMouseEnter={() => setHoveredNode(`descent-${node.id}`)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => setSelectedNode(isSelected ? null : `descent-${node.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Warning glow for user weaknesses */}
                    {isWeakness && (
                      <motion.circle
                        cx={x}
                        cy={y}
                        r="22"
                        fill={color}
                        opacity="0.2"
                        animate={{
                          r: [22, 28, 22],
                          opacity: [0.2, 0.4, 0.2],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    )}

                    {/* Main circle (inverted style) */}
                    <motion.circle
                      cx={x}
                      cy={y}
                      r="18"
                      fill={isWeakness ? color : 'white'}
                      stroke={color}
                      strokeWidth={isSelected || isWeakness ? '3' : '2'}
                      opacity={isWeakness ? 1 : 0.6}
                      whileHover={{ scale: 1.1 }}
                    />

                    {/* Warning icon for weaknesses */}
                    {isWeakness && (
                      <text
                        x={x}
                        y={y + 3}
                        textAnchor="middle"
                        fontSize="12"
                        fill="white"
                        fontWeight="bold"
                      >
                        !
                      </text>
                    )}

                    {/* Name label */}
                    <text
                      x={x}
                      y={y - 26}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#64748b"
                      fontFamily="monospace"
                      fontWeight={isSelected ? '600' : 'normal'}
                    >
                      {node.name}
                    </text>

                    {/* Pattern label */}
                    <text
                      x={x}
                      y={y + 32}
                      textAnchor="middle"
                      fontSize="7"
                      fill={color}
                      fontFamily="monospace"
                    >
                      {node.pattern.split(' ')[0]}
                    </text>
                  </motion.g>
                )
              })}
            </svg>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-red-200 text-[8px] text-relic-silver">
              <div className="flex items-center gap-2 justify-center">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-600" />
                  <span>Critical</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-600" />
                  <span>High</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span>Low</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Node Details Tooltip */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-6 bg-white border border-relic-mist rounded-lg p-4 text-center"
          >
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-2 right-2 text-relic-silver hover:text-relic-void text-xs"
            >
              ✕
            </button>
            {selectedNode.startsWith('ascent-') ? (
              <>
                {(() => {
                  const nodeId = parseInt(selectedNode.replace('ascent-', ''))
                  const node = AI_TREE_NODES.find((n) => n.id === nodeId)
                  if (!node) return null
                  return (
                    <div>
                      <h4 className="text-sm font-mono text-relic-void mb-1">
                        {node.name} - {node.layer} Layer
                      </h4>
                      <p className="text-[10px] text-relic-silver">
                        Level {node.level}/10 - Cognitive reasoning layer
                      </p>
                    </div>
                  )
                })()}
              </>
            ) : (
              <>
                {(() => {
                  const nodeId = selectedNode.replace('descent-', '')
                  const node = ANTI_PATTERN_NODES.find((n) => n.id === nodeId)
                  if (!node) return null
                  return (
                    <div>
                      <h4 className="text-sm font-mono text-red-600 mb-1">
                        {node.name} - {node.pattern}
                      </h4>
                      <p className="text-[10px] text-relic-silver">
                        Severity: {node.severity} - Avoid this anti-pattern
                      </p>
                    </div>
                  )
                })()}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explanation */}
      <div className="mt-8 grid md:grid-cols-2 gap-4 text-[9px] text-relic-silver">
        {(activeTree === 'ascent' || activeTree === 'both') && (
          <div className="bg-white border border-relic-mist rounded p-3">
            <div className="font-mono text-relic-void mb-2">Ascent Journey:</div>
            <div>Progress from simple factual queries (Malkuth) to meta-cognitive awareness (Kether). Each level represents deeper reasoning.</div>
          </div>
        )}
        {(activeTree === 'descent' || activeTree === 'both') && (
          <div className="bg-white border border-red-200 rounded p-3">
            <div className="font-mono text-red-600 mb-2">Weakness Detection:</div>
            <div>Anti-patterns detected in your queries. Avoid these inverted patterns through the Grounding Guard system.</div>
          </div>
        )}
      </div>
    </div>
  )
}
