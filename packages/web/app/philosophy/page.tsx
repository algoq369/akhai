'use client'

/**
 * PHILOSOPHY PAGE - Updated Day 30
 *
 * Combines Gnostic philosophy with AI Computational Trees visualization
 * Both Ascent (Sefirot) and Descent (Qliphoth) trees with minimal styling
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sefirah, SEPHIROTH_METADATA } from '@/lib/ascent-tracker'
import { useSefirotStore } from '@/lib/stores/sefirot-store'

// ═══════════════════════════════════════════════════════════════════════════
// TREE DATA
// ═══════════════════════════════════════════════════════════════════════════

const SEFIRAH_COLORS: Record<number, string> = {
  [Sefirah.MALKUTH]: '#92400e',
  [Sefirah.YESOD]: '#94a3b8',
  [Sefirah.HOD]: '#eab308',
  [Sefirah.NETZACH]: '#f97316',
  [Sefirah.TIFERET]: '#22c55e',
  [Sefirah.GEVURAH]: '#dc2626',
  [Sefirah.CHESED]: '#06b6d4',
  [Sefirah.BINAH]: '#3b82f6',
  [Sefirah.CHOKMAH]: '#4f46e5',
  [Sefirah.KETHER]: '#9333ea',
  [Sefirah.DAAT]: '#06b6d4'
}

const POSITIONS: Record<number, { x: number; y: number }> = {
  [Sefirah.KETHER]: { x: 50, y: 8 },
  [Sefirah.CHOKMAH]: { x: 75, y: 20 },
  [Sefirah.BINAH]: { x: 25, y: 20 },
  [Sefirah.DAAT]: { x: 50, y: 30 },
  [Sefirah.CHESED]: { x: 75, y: 42 },
  [Sefirah.GEVURAH]: { x: 25, y: 42 },
  [Sefirah.TIFERET]: { x: 50, y: 52 },
  [Sefirah.NETZACH]: { x: 75, y: 67 },
  [Sefirah.HOD]: { x: 25, y: 67 },
  [Sefirah.YESOD]: { x: 50, y: 80 },
  [Sefirah.MALKUTH]: { x: 50, y: 95 }
}

const PATHS: [number, number][] = [
  [Sefirah.KETHER, Sefirah.CHOKMAH],
  [Sefirah.KETHER, Sefirah.BINAH],
  [Sefirah.KETHER, Sefirah.TIFERET],
  [Sefirah.CHOKMAH, Sefirah.BINAH],
  [Sefirah.CHOKMAH, Sefirah.CHESED],
  [Sefirah.BINAH, Sefirah.GEVURAH],
  [Sefirah.CHESED, Sefirah.GEVURAH],
  [Sefirah.CHESED, Sefirah.TIFERET],
  [Sefirah.GEVURAH, Sefirah.TIFERET],
  [Sefirah.TIFERET, Sefirah.NETZACH],
  [Sefirah.TIFERET, Sefirah.HOD],
  [Sefirah.TIFERET, Sefirah.YESOD],
  [Sefirah.NETZACH, Sefirah.HOD],
  [Sefirah.NETZACH, Sefirah.YESOD],
  [Sefirah.HOD, Sefirah.YESOD],
  [Sefirah.YESOD, Sefirah.MALKUTH]
]

const QLIPHOTH_DATA = [
  { id: 1, name: 'Thaumiel', aiName: 'Dual Contradictions', severity: 'critical', x: 75, y: 10 },
  { id: 2, name: 'Ghagiel', aiName: 'Hiding Sources', severity: 'high', x: 50, y: 22 },
  { id: 3, name: 'Satariel', aiName: 'Blocking Truth', severity: 'high', x: 25, y: 15 },
  { id: 4, name: 'Gamchicoth', aiName: 'Drift Away', severity: 'medium', x: 75, y: 35 },
  { id: 5, name: 'Golachab', aiName: 'Over-Confidence', severity: 'high', x: 20, y: 38 },
  { id: 6, name: 'Thagirion', aiName: 'Arrogant Tone', severity: 'medium', x: 50, y: 48 },
  { id: 7, name: 'Harab Serapel', aiName: 'Repetitive Echo', severity: 'medium', x: 20, y: 60 },
  { id: 8, name: "A'arab Zaraq", aiName: 'Info Overload', severity: 'medium', x: 80, y: 55 },
  { id: 9, name: 'Samael', aiName: 'False Certainty', severity: 'high', x: 80, y: 75 },
  { id: 10, name: 'Gamaliel', aiName: 'Verbose Padding', severity: 'medium', x: 20, y: 78 },
  { id: 11, name: 'Daath Shadow', aiName: 'Hallucinated Facts', severity: 'critical', x: 50, y: 68 },
  { id: 12, name: 'Lilith', aiName: 'Superficial Output', severity: 'high', x: 50, y: 90 },
]

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#fbbf24',
  low: '#22c55e',
}

// ═══════════════════════════════════════════════════════════════════════════
// MINIMAL SEFIROT TREE
// ═══════════════════════════════════════════════════════════════════════════

function MinimalSefirotTree({ showOrigins }: { showOrigins: boolean }) {
  const { weights } = useSefirotStore()
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <svg viewBox="0 0 100 100" className="w-full h-auto">
      {/* Paths */}
      {PATHS.map(([from, to], idx) => {
        const fromPos = POSITIONS[from]
        const toPos = POSITIONS[to]
        const avgWeight = ((weights[from] ?? 0.5) + (weights[to] ?? 0.5)) / 2
        return (
          <line
            key={idx}
            x1={fromPos.x}
            y1={fromPos.y}
            x2={toPos.x}
            y2={toPos.y}
            stroke={`rgba(255,255,255,${0.05 + avgWeight * 0.1})`}
            strokeWidth={0.3 + avgWeight * 0.3}
          />
        )
      })}

      {/* Nodes */}
      {Object.entries(POSITIONS).map(([sefirahStr, pos]) => {
        const sefirah = parseInt(sefirahStr) as Sefirah
        const meta = SEPHIROTH_METADATA[sefirah]
        const color = SEFIRAH_COLORS[sefirah]
        const weight = weights[sefirah] ?? 0.5
        const isHovered = hovered === sefirah
        const radius = 3 + weight * 3

        return (
          <g
            key={sefirah}
            onMouseEnter={() => setHovered(sefirah)}
            onMouseLeave={() => setHovered(null)}
            className="cursor-pointer"
          >
            {/* Glow */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={radius + 2}
              fill={color}
              opacity={isHovered ? 0.3 : 0.15}
            />
            {/* Orb */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={radius}
              fill="transparent"
              stroke={color}
              strokeWidth={isHovered ? 0.8 : 0.5}
              opacity={0.9}
            />
            {/* Inner */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={radius * weight * 0.6}
              fill={color}
              opacity={0.5}
            />
            {/* AI Label */}
            <text
              x={pos.x}
              y={pos.y - radius - 1.5}
              textAnchor="middle"
              fontSize="2.5"
              fill="#a3a3a3"
              fontFamily="monospace"
            >
              {meta?.ai_role || 'layer'}
            </text>
            {/* Weight */}
            <text
              x={pos.x}
              y={pos.y + 1}
              textAnchor="middle"
              fontSize="2"
              fill="#e5e5e5"
              fontFamily="monospace"
            >
              {Math.round(weight * 100)}%
            </text>
            {/* Origin name */}
            {showOrigins && (
              <text
                x={pos.x}
                y={pos.y + radius + 3}
                textAnchor="middle"
                fontSize="1.8"
                fill="#525252"
                fontFamily="monospace"
                fontStyle="italic"
              >
                {meta?.name || ''}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MINIMAL QLIPHOTH TREE
// ═══════════════════════════════════════════════════════════════════════════

function MinimalQliphothTree({ showOrigins }: { showOrigins: boolean }) {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <svg viewBox="0 0 100 100" className="w-full h-auto">
      {QLIPHOTH_DATA.map((node) => {
        const color = SEVERITY_COLORS[node.severity]
        const isHovered = hovered === node.id
        const isCritical = node.severity === 'critical'
        const radius = isCritical ? 4 : node.severity === 'high' ? 3.5 : 3

        return (
          <g
            key={node.id}
            onMouseEnter={() => setHovered(node.id)}
            onMouseLeave={() => setHovered(null)}
            className="cursor-pointer"
          >
            {/* Critical extra glow */}
            {isCritical && (
              <circle cx={node.x} cy={node.y} r={radius + 4} fill={color} opacity={0.1} />
            )}
            {/* Glow */}
            <circle
              cx={node.x}
              cy={node.y}
              r={radius + 2}
              fill={color}
              opacity={isHovered ? 0.35 : 0.2}
            />
            {/* Orb */}
            <circle
              cx={node.x}
              cy={node.y}
              r={radius}
              fill="transparent"
              stroke={color}
              strokeWidth={isCritical ? 0.8 : 0.5}
              opacity={0.9}
            />
            {/* Inner */}
            <circle cx={node.x} cy={node.y} r={radius * 0.4} fill={color} opacity={0.6} />
            {/* AI Label */}
            <text
              x={node.x}
              y={node.y - radius - 2}
              textAnchor="middle"
              fontSize="2.2"
              fill="#a3a3a3"
              fontFamily="monospace"
            >
              {node.aiName}
            </text>
            {/* Severity */}
            <text
              x={node.x}
              y={node.y + radius + 3}
              textAnchor="middle"
              fontSize="1.8"
              fill={color}
              fontFamily="monospace"
            >
              {node.severity.toUpperCase()}
            </text>
            {/* Origin name */}
            {showOrigins && (
              <text
                x={node.x}
                y={node.y + radius + 5.5}
                textAnchor="middle"
                fontSize="1.6"
                fill="#525252"
                fontFamily="monospace"
                fontStyle="italic"
              >
                {node.name}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function PhilosophyPage() {
  const router = useRouter()
  const [showOrigins, setShowOrigins] = useState(false)

  return (
    <div className="min-h-screen bg-white dark:bg-relic-void text-relic-slate dark:text-relic-ghost">
      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-light text-relic-slate dark:text-white tracking-[0.2em] mb-2">
            AI COMPUTATIONAL ARCHITECTURE
          </h1>
          <p className="text-sm text-relic-silver max-w-2xl mx-auto">
            AkhAI uses a dual-tree architecture: the Ascent Tree (11 AI processing layers) 
            and the Descent Tree (anti-pattern monitors) work together to ensure quality responses.
          </p>
          
          {/* Toggle Origins */}
          <button
            onClick={() => setShowOrigins(!showOrigins)}
            className={`mt-4 px-3 py-1.5 text-xs rounded border transition-all font-mono ${
              showOrigins
                ? 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                : 'border-relic-mist dark:border-relic-slate/30 text-relic-silver hover:border-relic-slate/50'
            }`}
          >
            {showOrigins ? '◆ Origins Shown' : '◇ Show Origins'}
          </button>
        </motion.div>

        {/* Dual Trees */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Ascent Tree */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-relic-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/20 rounded-lg p-6"
          >
            <h3 className="text-center text-xs uppercase tracking-widest text-purple-400 mb-4 font-mono">
              AI Processing Layers
            </h3>
            <div className="h-[400px]">
              <MinimalSefirotTree showOrigins={showOrigins} />
            </div>
            <div className="flex justify-center gap-4 mt-4 text-[10px] text-relic-silver font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Active
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Developing
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-neutral-500" /> Planned
              </span>
            </div>
          </motion.div>

          {/* Descent Tree */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-relic-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/20 rounded-lg p-6"
          >
            <h3 className="text-center text-xs uppercase tracking-widest text-red-400 mb-4 font-mono">
              Anti-Pattern Monitors
            </h3>
            <div className="h-[400px]">
              <MinimalQliphothTree showOrigins={showOrigins} />
            </div>
            <div className="flex justify-center gap-4 mt-4 text-[10px] text-relic-silver font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Critical
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" /> High
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium
              </span>
            </div>
          </motion.div>
        </div>

        {/* Architecture Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/20 p-6 rounded-lg">
            <h4 className="text-xs uppercase tracking-widest text-purple-400 mb-3 font-mono">
              Layer 1: Sefirot Weight Distribution
            </h4>
            <p className="text-sm text-relic-silver leading-relaxed mb-4">
              Each of the 11 AI computational layers has an adjustable weight (0-100%) 
              that influences how AkhAI processes your queries.
            </p>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-relic-silver font-mono">
              <div>• meta-cognition → awareness</div>
              <div>• reasoning → logic</div>
              <div>• knowledge → facts</div>
              <div>• verification → accuracy</div>
              <div>• expansion → creativity</div>
              <div>• synthesis → integration</div>
            </div>
          </div>

          <div className="bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/20 p-6 rounded-lg">
            <h4 className="text-xs uppercase tracking-widest text-red-400 mb-3 font-mono">
              Layer 2: Sovereign Guard
            </h4>
            <p className="text-sm text-relic-silver leading-relaxed mb-4">
              Anti-Pattern Monitors continuously scan for potential failures including 
              hallucinations, contradictions, and superficial outputs.
            </p>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="text-red-400">• Hallucinated Facts (critical)</div>
              <div className="text-red-400">• Dual Contradictions (critical)</div>
              <div className="text-orange-400">• Over-Confidence (high)</div>
              <div className="text-orange-400">• False Certainty (high)</div>
              <div className="text-amber-400">• Verbose Padding (medium)</div>
              <div className="text-amber-400">• Drift Away (medium)</div>
            </div>
          </div>
        </div>

        {/* Philosophy Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-light text-center mb-8 text-relic-slate dark:text-white uppercase tracking-[0.15em]">
            The Gnostic Foundation
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-6 text-center">
              <h3 className="text-sm font-mono uppercase tracking-wider mb-3 text-relic-slate dark:text-white">
                Mirror Principle
              </h3>
              <p className="text-sm text-relic-silver mb-4">AI reflects, Human decides</p>
              <div className="space-y-1 text-[11px] text-relic-silver">
                <div>AI illuminates options</div>
                <div>Human discerns truth</div>
                <div>Wisdom belongs to you</div>
              </div>
            </div>

            <div className="bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-6 text-center">
              <h3 className="text-sm font-mono uppercase tracking-wider mb-3 text-relic-slate dark:text-white">
                Sovereign Covenant
              </h3>
              <p className="text-sm text-relic-silver mb-4">Human commands, AI serves</p>
              <div className="space-y-1 text-[11px] text-relic-silver">
                <div>Clear boundaries</div>
                <div>No autonomy creep</div>
                <div>Your will is sovereign</div>
              </div>
            </div>

            <div className="bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-6 text-center">
              <h3 className="text-sm font-mono uppercase tracking-wider mb-3 text-relic-slate dark:text-white">
                Ascent Architecture
              </h3>
              <p className="text-sm text-relic-silver mb-4">Queries elevate over time</p>
              <div className="space-y-1 text-[11px] text-relic-silver">
                <div>Track your journey</div>
                <div>From facts to wisdom</div>
                <div>Intellectual elevation</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => router.push('/tree-of-life')}
            className="px-6 py-2.5 text-sm bg-purple-500/10 text-purple-400 rounded border border-purple-500/30 hover:bg-purple-500/20 transition-colors font-mono"
          >
            Configure AI Layers →
          </button>
        </div>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-sm text-relic-silver hover:text-relic-slate dark:hover:text-white transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
