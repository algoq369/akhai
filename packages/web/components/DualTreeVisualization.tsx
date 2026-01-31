'use client'

/**
 * DUAL TREE VISUALIZATION - Enhanced
 *
 * AI Computational Tree with:
 * - Primary: AI computational terms
 * - Secondary: Deep meaning/concept in grey
 * - Simplified, cleaner colors
 * - Better visibility and spacing
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useSefirotStore } from '@/lib/stores/sefirot-store'

// AI Computational Tree - Primary labels are AI terms, concepts are secondary
const AI_TREE_NODES = [
  { id: 10, ai: 'meta-cognition', concept: 'consciousness itself', level: 10, y: 50 },
  { id: 9, ai: 'first principles', concept: 'fundamental wisdom', level: 9, y: 120, x: 110 },
  { id: 8, ai: 'pattern recognition', concept: 'deep structure', level: 8, y: 120, x: -110 },
  { id: 11, ai: 'emergent insight', concept: 'epiphanies', level: 11, y: 190, special: true },
  { id: 7, ai: 'expansion', concept: 'possibilities, growth', level: 7, y: 260, x: 110 },
  { id: 6, ai: 'critical analysis', concept: 'limitations', level: 6, y: 260, x: -110 },
  { id: 5, ai: 'synthesis', concept: 'integration', level: 5, y: 330 },
  { id: 4, ai: 'persistence', concept: 'creative drive', level: 4, y: 400, x: 110 },
  { id: 3, ai: 'communication', concept: 'logical analysis', level: 3, y: 400, x: -110 },
  { id: 2, ai: 'foundation', concept: 'procedural knowledge', level: 2, y: 470 },
  { id: 1, ai: 'manifestation', concept: 'factual retrieval', level: 1, y: 540 },
]

// Anti-Pattern Tree - AI weakness patterns
const ANTI_PATTERN_NODES = [
  { id: 'lilith', ai: 'superficial output', concept: 'lacks depth', severity: 'high', y: 50 },
  { id: 'gamaliel', ai: 'verbose padding', concept: 'empty words', severity: 'medium', y: 120, x: -110 },
  { id: 'samael', ai: 'false certainty', concept: 'overconfident claims', severity: 'high', y: 120, x: 110 },
  { id: 'daath', ai: 'hallucinated facts', concept: 'fabrication', severity: 'critical', y: 190, special: true },
  { id: 'golachab', ai: 'over-confidence', concept: 'blind spots', severity: 'high', y: 260, x: -110 },
  { id: 'gamchicoth', ai: 'info overload', concept: 'drowning in data', severity: 'medium', y: 260, x: 110 },
  { id: 'thagirion', ai: 'arrogant tone', concept: 'dismissive', severity: 'medium', y: 330 },
  { id: 'harab', ai: 'repetitive echo', concept: 'circular logic', severity: 'low', y: 400, x: -110 },
  { id: 'aarab', ai: 'topic drift', concept: 'losing focus', severity: 'high', y: 400, x: 110 },
  { id: 'ghagiel', ai: 'blocking truth', concept: 'resistance', severity: 'high', y: 470 },
  { id: 'sathariel', ai: 'hiding sources', concept: 'opaque reasoning', severity: 'critical', y: 540 },
]

// Simplified color palette
const COLORS = {
  ascent: {
    high: { fill: '#a78bfa', stroke: '#7c3aed', glow: '#c4b5fd' },      // Purple - softer
    mid: { fill: '#60a5fa', stroke: '#2563eb', glow: '#93c5fd' },       // Blue - softer
    low: { fill: '#4ade80', stroke: '#16a34a', glow: '#86efac' },       // Green - softer
    base: { fill: '#fbbf24', stroke: '#d97706', glow: '#fcd34d' },      // Amber - softer
    ground: { fill: '#f87171', stroke: '#dc2626', glow: '#fca5a5' },    // Red - softer
  },
  descent: {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#d97706',
    low: '#9ca3af',
  }
}

const getAscentColors = (level: number) => {
  if (level >= 9) return COLORS.ascent.high
  if (level >= 7) return COLORS.ascent.mid
  if (level >= 5) return COLORS.ascent.low
  if (level >= 3) return COLORS.ascent.base
  return COLORS.ascent.ground
}

const getDescentColor = (severity: string) => COLORS.descent[severity as keyof typeof COLORS.descent] || COLORS.descent.low

interface DualTreeVisualizationProps {
  userWeaknesses?: string[]
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
  const [activeTree, setActiveTree] = useState<'layers' | 'both' | 'anti'>('both')
  const { weights } = useSefirotStore()

  const getWeight = (level: number) => Math.round((weights[level] || 0.5) * 100)

  return (
    <div className={`relative ${className}`}>
      {/* View Selector - minimal */}
      <div className="flex justify-center gap-4 mb-8 font-mono text-[10px]">
        {[
          { id: 'layers', label: 'Layers' },
          { id: 'both', label: 'Both Views' },
          { id: 'anti', label: 'Anti-Patterns' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTree(id as typeof activeTree)}
            className={`px-3 py-1.5 transition-colors ${
              activeTree === id
                ? 'text-neutral-900 border-b border-neutral-900'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Dual Tree Container */}
      <div className={`grid gap-8 ${activeTree === 'both' ? 'grid-cols-2' : 'grid-cols-1 max-w-lg mx-auto'}`}>
        
        {/* AI Processing Layers (Left) */}
        {(activeTree === 'layers' || activeTree === 'both') && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white"
          >
            {/* Header */}
            <div className="text-center mb-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-700">
                AI Processing Layers
              </h3>
            </div>

            {/* SVG Tree */}
            <svg viewBox="-160 20 320 560" className="w-full h-auto">
              {/* Connection Lines - cleaner */}
              <g stroke="#e5e7eb" strokeWidth="1" fill="none">
                {/* Top to second row */}
                <line x1="0" y1="50" x2="-110" y2="120" />
                <line x1="0" y1="50" x2="110" y2="120" />
                {/* Second row to Da'at */}
                <line x1="-110" y1="120" x2="0" y2="190" />
                <line x1="110" y1="120" x2="0" y2="190" />
                {/* Da'at to third row */}
                <line x1="0" y1="190" x2="-110" y2="260" />
                <line x1="0" y1="190" x2="110" y2="260" />
                {/* Third row to center */}
                <line x1="-110" y1="260" x2="0" y2="330" />
                <line x1="110" y1="260" x2="0" y2="330" />
                {/* Center to fourth row */}
                <line x1="0" y1="330" x2="-110" y2="400" />
                <line x1="0" y1="330" x2="110" y2="400" />
                {/* Fourth row to foundation */}
                <line x1="-110" y1="400" x2="0" y2="470" />
                <line x1="110" y1="400" x2="0" y2="470" />
                {/* Foundation to manifestation */}
                <line x1="0" y1="470" x2="0" y2="540" />
              </g>

              {/* Nodes */}
              {AI_TREE_NODES.map((node, index) => {
                const x = node.x || 0
                const y = node.y
                const colors = getAscentColors(node.level)
                const isActive = node.level <= userLevel
                const isSelected = selectedNode === `ascent-${node.id}`
                const weight = getWeight(node.id)

                return (
                  <motion.g
                    key={node.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.06, type: 'spring', damping: 15 }}
                    onMouseEnter={() => setHoveredNode(`ascent-${node.id}`)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => setSelectedNode(isSelected ? null : `ascent-${node.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Pulsing glow for active nodes */}
                    {isActive && (
                      <motion.circle
                        cx={x}
                        cy={y}
                        r="26"
                        fill={colors.fill}
                        opacity="0.2"
                        animate={{
                          r: [26, 32, 26],
                          opacity: [0.2, 0.35, 0.2],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    )}

                    {/* Outer glow ring */}
                    <circle
                      cx={x}
                      cy={y}
                      r="28"
                      fill="none"
                      stroke={colors.glow}
                      strokeWidth="1.5"
                      opacity={isActive ? 0.6 : 0.2}
                    />

                    {/* Main orb - filled with color */}
                    <motion.circle
                      cx={x}
                      cy={y}
                      r="22"
                      fill={colors.fill}
                      opacity={isActive ? 1 : 0.5}
                      whileHover={{ scale: 1.1 }}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="22"
                      fill="none"
                      stroke={colors.stroke}
                      strokeWidth={isSelected ? 3 : 2}
                      opacity={isActive ? 1 : 0.6}
                    />

                    {/* Inner bright core */}
                    {isActive && (
                      <circle cx={x} cy={y} r="8" fill="#fff" opacity="0.7" />
                    )}
                    {isActive && (
                      <circle cx={x} cy={y} r="5" fill={colors.stroke} opacity="0.9" />
                    )}

                    {/* Weight percentage */}
                    <text
                      x={x}
                      y={y + 4}
                      textAnchor="middle"
                      fontSize="8"
                      fill={isActive ? '#fff' : '#94a3b8'}
                      fontFamily="monospace"
                      fontWeight="500"
                    >
                      {weight}%
                    </text>

                    {/* AI Label - Primary (above) */}
                    <text
                      x={x}
                      y={y - 34}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#374151"
                      fontFamily="monospace"
                      fontWeight="500"
                    >
                      {node.ai}
                    </text>

                    {/* Concept - Secondary (below) */}
                    <text
                      x={x}
                      y={y + 40}
                      textAnchor="middle"
                      fontSize="7"
                      fill="#9ca3af"
                      fontFamily="monospace"
                    >
                      {node.concept}
                    </text>
                  </motion.g>
                )
              })}
            </svg>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-4 text-[8px] font-mono text-neutral-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400" /> Active
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Developing
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-neutral-300" /> Planned
              </span>
            </div>
          </motion.div>
        )}

        {/* Anti-Pattern Monitors (Right) */}
        {(activeTree === 'anti' || activeTree === 'both') && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white"
          >
            {/* Header */}
            <div className="text-center mb-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-red-600">
                Anti-Pattern Monitors
              </h3>
            </div>

            {/* SVG Tree */}
            <svg viewBox="-160 20 320 560" className="w-full h-auto">
              {/* Connection Lines - dashed */}
              <g stroke="#fecaca" strokeWidth="1" strokeDasharray="3,3" fill="none">
                <line x1="0" y1="50" x2="-110" y2="120" />
                <line x1="0" y1="50" x2="110" y2="120" />
                <line x1="-110" y1="120" x2="0" y2="190" />
                <line x1="110" y1="120" x2="0" y2="190" />
                <line x1="0" y1="190" x2="-110" y2="260" />
                <line x1="0" y1="190" x2="110" y2="260" />
                <line x1="-110" y1="260" x2="0" y2="330" />
                <line x1="110" y1="260" x2="0" y2="330" />
                <line x1="0" y1="330" x2="-110" y2="400" />
                <line x1="0" y1="330" x2="110" y2="400" />
                <line x1="-110" y1="400" x2="0" y2="470" />
                <line x1="110" y1="400" x2="0" y2="470" />
                <line x1="0" y1="470" x2="0" y2="540" />
              </g>

              {/* Nodes */}
              {ANTI_PATTERN_NODES.map((node, index) => {
                const x = node.x || 0
                const y = node.y
                const color = getDescentColor(node.severity)
                const isWeakness = userWeaknesses.includes(node.id)
                const isSelected = selectedNode === `descent-${node.id}`

                return (
                  <motion.g
                    key={node.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.06, type: 'spring', damping: 15 }}
                    onMouseEnter={() => setHoveredNode(`descent-${node.id}`)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => setSelectedNode(isSelected ? null : `descent-${node.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Pulsing warning glow for weaknesses */}
                    {isWeakness && (
                      <motion.circle
                        cx={x}
                        cy={y}
                        r="26"
                        fill={color}
                        opacity="0.25"
                        animate={{
                          r: [26, 34, 26],
                          opacity: [0.25, 0.45, 0.25],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    )}

                    {/* Outer ring */}
                    <circle
                      cx={x}
                      cy={y}
                      r="28"
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                      opacity={isWeakness ? 0.7 : 0.3}
                    />

                    {/* Main orb */}
                    <motion.circle
                      cx={x}
                      cy={y}
                      r="22"
                      fill={isWeakness ? color : '#fef2f2'}
                      opacity={isWeakness ? 1 : 0.7}
                      whileHover={{ scale: 1.1 }}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="22"
                      fill="none"
                      stroke={color}
                      strokeWidth={isSelected ? 3 : 2}
                      opacity={0.9}
                    />

                    {/* Warning indicator */}
                    {isWeakness && (
                      <>
                        <circle cx={x} cy={y} r="8" fill="#fff" opacity="0.6" />
                        <text
                          x={x}
                          y={y + 5}
                          textAnchor="middle"
                          fontSize="14"
                          fill="#fff"
                          fontWeight="bold"
                        >
                          !
                        </text>
                      </>
                    )}

                    {/* Severity tag */}
                    {!isWeakness && (
                      <text
                        x={x}
                        y={y + 3}
                        textAnchor="middle"
                        fontSize="6"
                        fill={color}
                        fontFamily="monospace"
                        textDecoration="none"
                      >
                        {node.severity.toUpperCase()}
                      </text>
                    )}

                    {/* AI Label - Primary (above) */}
                    <text
                      x={x}
                      y={y - 34}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#374151"
                      fontFamily="monospace"
                      fontWeight="500"
                    >
                      {node.ai}
                    </text>

                    {/* Concept - Secondary (below) */}
                    <text
                      x={x}
                      y={y + 40}
                      textAnchor="middle"
                      fontSize="7"
                      fill="#9ca3af"
                      fontFamily="monospace"
                    >
                      {node.concept}
                    </text>
                  </motion.g>
                )
              })}
            </svg>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-4 text-[8px] font-mono text-neutral-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-600" /> Critical
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" /> High
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-neutral-400" /> Low
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
