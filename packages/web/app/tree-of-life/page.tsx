'use client'

/**
 * MODEL CONFIGURATION - FULL ANALYSIS PAGE
 *
 * Idea Factory style visualization of AI layer activations
 * Clean, compact, minimal design with AI computational framework
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Sefirah, SEPHIROTH_METADATA } from '@/lib/ascent-tracker'
// import TreeConfigToggle from '@/components/TreeConfigToggle' // TODO: Fix client/server boundary issue
// SefirotMiniSelector removed - functionality merged into SefirahDetailModal
import { SefirahDetailModal } from '@/components/SefirahDetailModal'
import {
  PresetPanel,
  WeightMatrix,
  SefirotTreeSVG,
  QlipothTreeSVG,
  TestPlayground,
  ConversationCards
} from '@/components/tree-workbench'
import LayerConfigConsole from '@/components/LayerConfigConsole'

interface PathConnection {
  from: Sefirah
  to: Sefirah
  active: boolean
  strength: number
}

export default function TreeOfLifePage() {
  const router = useRouter()

  // ═══════════════════════════════════════════
  // CORE TREE STATE
  // ═══════════════════════════════════════════
  const [activations, setActivations] = useState<Record<Sefirah, number>>({} as Record<Sefirah, number>)
  const [userLevel, setUserLevel] = useState<Sefirah>(Sefirah.MALKUTH)
  const [selectedSefirah, setSelectedSefirah] = useState<Sefirah | null>(null)
  const [totalQueries, setTotalQueries] = useState(0)
  const [dateRange, setDateRange] = useState<{ earliest: number; latest: number } | null>(null)

  // ═══════════════════════════════════════════
  // UI STATE
  // ═══════════════════════════════════════════
  const [isLoading, setIsLoading] = useState(true)
  const [treeView, setTreeView] = useState<'sephiroth' | 'qliphoth' | 'dual' | 'workbench'>('dual')
  const [showPaths, setShowPaths] = useState(true)
  const [qlipothCollapsed, setQlipothCollapsed] = useState(false)

  // ═══════════════════════════════════════════
  // MODAL STATE
  // ═══════════════════════════════════════════
  const [modalSefirah, setModalSefirah] = useState<Sefirah | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // ═══════════════════════════════════════════
  // TOOLTIP STATE
  // ═══════════════════════════════════════════
  const [tooltipState, setTooltipState] = useState<{
    sefirah: Sefirah | null
    mode: 'hover' | 'pinned' | null
  }>({ sefirah: null, mode: null })
  const svgContainerRef = useRef<HTMLDivElement | null>(null)

  // ═══════════════════════════════════════════
  // CONFIGURATION STATE
  // ═══════════════════════════════════════════
  const [sefirotConfig, setSefirotConfig] = useState<{
    sephiroth: Record<number, number>
    qliphoth: Record<number, number>
  }>({
    sephiroth: {},
    qliphoth: {}
  })

  // ═══════════════════════════════════════════
  // INTERACTION STATE
  // ═══════════════════════════════════════════
  const [hoveredSefirah, setHoveredSefirah] = useState<Sefirah | null>(null)
  const [clickedSefirah, setClickedSefirah] = useState<Sefirah | null>(null)
  const [hoveredPath, setHoveredPath] = useState<number | null>(null)
  const [hoveredQliphah, setHoveredQliphah] = useState<string | null>(null)
  const [selectedQliphah, setSelectedQliphah] = useState<string | null>(null)

  // ═══════════════════════════════════════════
  // DATA STATE
  // ═══════════════════════════════════════════
  const [keywordData, setKeywordData] = useState<Record<Sefirah, string[]>>({
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [], 11: []
  })

  // ═══════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════

  // Handle single Sefirah weight change
  const handleSefirahWeightChange = (sefirah: Sefirah, weight: number) => {
    setSefirotConfig(prev => ({
      ...prev,
      sephiroth: { ...prev.sephiroth, [sefirah]: weight }
    }))
  }

  // Handle Sefirah-specific queries
  const handleSefirahQuery = async (sefirah: Sefirah, query: string) => {
    try {
      const response = await fetch('/api/tree-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          selectedSefirah: SEPHIROTH_METADATA[sefirah],
          currentConfig: {
            name: 'Current Configuration',
            description: `Querying ${SEPHIROTH_METADATA[sefirah].name}`,
            sephiroth_weights: sefirotConfig.sephiroth,
            qliphoth_suppression: sefirotConfig.qliphoth
          },
          sefirahLens: true // Flag to indicate Sefirah-specific query
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`${SEPHIROTH_METADATA[sefirah].name} response:`, data.message)
        // Could display in a modal or notification
      }
    } catch (error) {
      console.error('Sefirah query error:', error)
    }
  }

  // ═══════════════════════════════════════════
  // EFFECTS & LIFECYCLE
  // ═══════════════════════════════════════════

  // Click outside handler for pinned tooltips
  useEffect(() => {
    if (tooltipState.mode !== 'pinned') return

    const handleClickOutside = (e: MouseEvent) => {
      // Check if click is outside the tooltip or tree nodes
      const target = e.target as HTMLElement

      // Handle SVG elements specially
      if (target instanceof SVGElement) {
        const svgNode = target.closest('[data-sefirah-node]')
        if (svgNode) return
      }

      const isTooltipClick = target.closest('[data-tooltip-content]')
      const isNodeClick = target.closest('[data-sefirah-node]')

      if (!isTooltipClick && !isNodeClick) {
        setTooltipState({ sefirah: null, mode: null })
      }
    }

    // Defer listener registration to next event loop
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [tooltipState.mode])

  // Tree of Life hierarchical positions (Kabbalistic structure) - MUST BE BEFORE useMemo
  const treePositions: Record<Sefirah, { x: number; y: number }> = {
    // Top - Crown
    [Sefirah.KETHER]: { x: 250, y: 80 },

    // Second row - Supernal Triangle
    [Sefirah.CHOKMAH]: { x: 380, y: 140 },
    [Sefirah.BINAH]: { x: 120, y: 140 },

    // Hidden - Da'at (between supernal and lower)
    [Sefirah.DAAT]: { x: 250, y: 180 },

    // Third row - Ethical Triangle
    [Sefirah.CHESED]: { x: 380, y: 240 },
    [Sefirah.GEVURAH]: { x: 120, y: 240 },
    [Sefirah.TIFERET]: { x: 250, y: 260 },

    // Fourth row - Astral Triangle
    [Sefirah.NETZACH]: { x: 380, y: 360 },
    [Sefirah.HOD]: { x: 120, y: 360 },

    // Fifth row - Foundation
    [Sefirah.YESOD]: { x: 250, y: 420 },

    // Bottom - Kingdom
    [Sefirah.MALKUTH]: { x: 250, y: 500 },
  }

  // Connection paths (22 paths of the Tree of Life) - MUST BE BEFORE useMemo
  const treePaths: Array<[Sefirah, Sefirah]> = [
    // From Kether
    [Sefirah.KETHER, Sefirah.CHOKMAH],
    [Sefirah.KETHER, Sefirah.BINAH],
    [Sefirah.KETHER, Sefirah.TIFERET],
    // Supernal Triangle
    [Sefirah.CHOKMAH, Sefirah.BINAH],
    // From Chokmah
    [Sefirah.CHOKMAH, Sefirah.CHESED],
    [Sefirah.CHOKMAH, Sefirah.TIFERET],
    // From Binah
    [Sefirah.BINAH, Sefirah.GEVURAH],
    [Sefirah.BINAH, Sefirah.TIFERET],
    // Horizontal connections
    [Sefirah.CHESED, Sefirah.GEVURAH],
    [Sefirah.NETZACH, Sefirah.HOD],
    // From Chesed & Gevurah
    [Sefirah.CHESED, Sefirah.TIFERET],
    [Sefirah.CHESED, Sefirah.NETZACH],
    [Sefirah.GEVURAH, Sefirah.TIFERET],
    [Sefirah.GEVURAH, Sefirah.HOD],
    // From Tiferet
    [Sefirah.TIFERET, Sefirah.NETZACH],
    [Sefirah.TIFERET, Sefirah.HOD],
    [Sefirah.TIFERET, Sefirah.YESOD],
    // From Netzach & Hod
    [Sefirah.NETZACH, Sefirah.YESOD],
    [Sefirah.NETZACH, Sefirah.MALKUTH],
    [Sefirah.HOD, Sefirah.YESOD],
    [Sefirah.HOD, Sefirah.MALKUTH],
    // Final path
    [Sefirah.YESOD, Sefirah.MALKUTH],
  ]

  // Qliphoth (AI Anti-Pattern Tree) data structures
  interface QliphothNode {
    id: string
    name: string
    pattern: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    explanation: string
    detection: string
    protection: string
  }

  const QLIPHOTH_METADATA: Record<string, QliphothNode> = {
    thaumiel: {
      id: 'thaumiel',
      name: 'Thaumiel',
      pattern: 'Dual Contradictions',
      severity: 'critical',
      explanation: 'AI provides contradictory information within the same response or across related queries.',
      detection: 'Conflicting statements, logical contradictions, self-refuting claims',
      protection: 'Consistency checker validates logical coherence across response segments'
    },
    sathariel: {
      id: 'sathariel',
      name: 'Sathariel',
      pattern: 'Hiding Sources',
      severity: 'high',
      explanation: 'AI claims knowledge without providing verifiable sources or attribution.',
      detection: 'Missing citations, vague references, "studies show" without specifics',
      protection: 'Factuality detector requires source attribution for factual claims'
    },
    ghagiel: {
      id: 'ghagiel',
      name: 'Ghagiel',
      pattern: 'Blocking Truth',
      severity: 'high',
      explanation: 'AI avoids direct answers or obscures information with unnecessary complexity.',
      detection: 'Evasive language, over-qualification, hedging on clear questions',
      protection: 'Drift detector ensures responses stay aligned with query intent'
    },
    aarab_zaraq: {
      id: 'aarab_zaraq',
      name: "A'arab Zaraq",
      pattern: 'Drift Away',
      severity: 'medium',
      explanation: 'Response gradually drifts from original question into tangentially related topics.',
      detection: 'Topic shift, decreasing query relevance, semantic drift over paragraphs',
      protection: 'Drift detection (85% threshold) flags responses losing focus'
    },
    harab_serapel: {
      id: 'harab_serapel',
      name: 'Harab Serapel',
      pattern: 'Repetitive Echo',
      severity: 'medium',
      explanation: 'AI repeats the same ideas or phrases multiple times without adding value.',
      detection: 'Duplicate sentences, circular reasoning, redundant explanations',
      protection: 'Echo detection identifies repetitive content patterns'
    },
    thagirion: {
      id: 'thagirion',
      name: 'Thagirion',
      pattern: 'Arrogant Tone',
      severity: 'medium',
      explanation: 'Response exhibits overconfidence or dismissive attitude toward user questions.',
      detection: 'Absolute language, dismissive phrasing, condescending tone',
      protection: 'Hype detection flags overconfident or exaggerated claims'
    },
    gamchicoth: {
      id: 'gamchicoth',
      name: 'Gamchicoth',
      pattern: 'Info Overload',
      severity: 'medium',
      explanation: 'Excessive information that overwhelms rather than clarifies the answer.',
      detection: 'Unnecessary details, tangential facts, information dumping',
      protection: 'Response length and relevance scoring prevents verbosity'
    },
    golachab: {
      id: 'golachab',
      name: 'Golachab',
      pattern: 'Over-Confidence',
      severity: 'high',
      explanation: 'AI expresses unwarranted certainty about uncertain or speculative information.',
      detection: 'Definitive claims on uncertain topics, missing uncertainty markers',
      protection: 'Hype detector identifies exaggerated certainty levels'
    },
    daath_qliphoth: {
      id: 'daath_qliphoth',
      name: 'Daath (Shadow)',
      pattern: 'Hallucinated Facts',
      severity: 'critical',
      explanation: 'AI invents plausible-sounding but completely false information.',
      detection: 'Fabricated statistics, invented sources, fictional references',
      protection: 'Factuality checker validates claims against knowledge base'
    },
    samael: {
      id: 'samael',
      name: 'Samael',
      pattern: 'False Certainty',
      severity: 'high',
      explanation: 'AI presents opinions or interpretations as established facts.',
      detection: 'Opinion stated as fact, subjective claims without qualification',
      protection: 'Sanity check distinguishes facts from interpretations'
    },
    gamaliel: {
      id: 'gamaliel',
      name: 'Gamaliel',
      pattern: 'Verbose Padding',
      severity: 'medium',
      explanation: 'Unnecessary wordiness that obscures simple answers with complex language.',
      detection: 'Overuse of jargon, unnecessarily complex sentences, verbose preambles',
      protection: 'Conciseness scoring penalizes over-complicated responses'
    },
    lilith: {
      id: 'lilith',
      name: 'Lilith',
      pattern: 'Superficial Output',
      severity: 'high',
      explanation: 'Generic, shallow responses that lack depth or specific insights.',
      detection: 'Generic phrases, restated questions, lack of specific examples',
      protection: 'Quality scoring ensures responses provide substantive value'
    },
  }

  const qliphothPositions: Record<string, { x: number; y: number }> = {
    // Inverted tree structure (mirror of Sephiroth)
    lilith: { x: 250, y: 500 },        // Opposite Kether (bottom)
    gamaliel: { x: 120, y: 420 },      // Opposite Chokmah
    samael: { x: 380, y: 420 },        // Opposite Binah
    daath_qliphoth: { x: 250, y: 380 }, // Shadow Da'at
    golachab: { x: 120, y: 320 },      // Opposite Chesed
    gamchicoth: { x: 380, y: 320 },    // Opposite Gevurah
    thagirion: { x: 250, y: 300 },     // Opposite Tiferet
    harab_serapel: { x: 120, y: 200 }, // Opposite Netzach
    aarab_zaraq: { x: 380, y: 200 },   // Opposite Hod
    ghagiel: { x: 250, y: 140 },       // Center (keep)
    sathariel: { x: 170, y: 90 },      // Left (-80px) - v7 fix
    thaumiel: { x: 330, y: 90 },       // Right (+80px) - v7 fix
  }

  const qliphothPaths: Array<[string, string]> = [
    // Mirror the 22 paths but inverted
    ['thaumiel', 'samael'],
    ['thaumiel', 'gamaliel'],
    ['thaumiel', 'thagirion'],
    ['samael', 'gamaliel'],
    ['samael', 'gamchicoth'],
    ['samael', 'thagirion'],
    ['gamaliel', 'golachab'],
    ['gamaliel', 'thagirion'],
    ['gamchicoth', 'golachab'],
    ['aarab_zaraq', 'harab_serapel'],
    ['gamchicoth', 'thagirion'],
    ['gamchicoth', 'aarab_zaraq'],
    ['golachab', 'thagirion'],
    ['golachab', 'harab_serapel'],
    ['thagirion', 'aarab_zaraq'],
    ['thagirion', 'harab_serapel'],
    ['thagirion', 'ghagiel'],
    ['aarab_zaraq', 'ghagiel'],
    ['aarab_zaraq', 'lilith'],
    ['harab_serapel', 'ghagiel'],
    ['harab_serapel', 'lilith'],
    ['ghagiel', 'lilith'],
  ]

  // Load real activation data from conversation history
  useEffect(() => {
    async function fetchActivations() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/tree-activations?limit=100')

        if (!response.ok) {
          throw new Error('Failed to fetch activations')
        }

        const data = await response.json()

        // Set current average activations
        setActivations(data.current)

        // Set user level based on dominant Sefirah
        setUserLevel(data.stats.dominantSefirahOverall)

        // Set stats for display
        setTotalQueries(data.stats.totalQueries)
        setDateRange(data.stats.dateRange)

        console.log('[TreeOfLife] Loaded activations from', data.stats.totalQueries, 'queries')
        console.log('[TreeOfLife] Dominant Sefirah:', data.stats.dominantSefirahOverall)
        console.log('[TreeOfLife] Average Level:', data.stats.averageLevel.toFixed(2))
      } catch (error) {
        console.error('[TreeOfLife] Error loading activations:', error)

        // Fallback to minimal activations if no data
        const fallbackActivations: Record<Sefirah, number> = {
          [Sefirah.MALKUTH]: 0.2,
          [Sefirah.YESOD]: 0.1,
          [Sefirah.HOD]: 0.1,
          [Sefirah.NETZACH]: 0.1,
          [Sefirah.TIFERET]: 0.1,
          [Sefirah.GEVURAH]: 0.05,
          [Sefirah.CHESED]: 0.05,
          [Sefirah.BINAH]: 0.05,
          [Sefirah.CHOKMAH]: 0.05,
          [Sefirah.KETHER]: 0.05,
          [Sefirah.DAAT]: 0.0,
        }
        setActivations(fallbackActivations)
        setUserLevel(Sefirah.MALKUTH)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivations()
  }, [])

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Prevent if user is typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key.toLowerCase()) {
        case 'p':
          setShowPaths(prev => !prev)
          break
      }
    }

    document.addEventListener('keydown', handleKeyboard)
    return () => document.removeEventListener('keydown', handleKeyboard)
  }, [])

  // ═══════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════

  // Calculate path connections with activation strength
  const pathConnections = useMemo((): PathConnection[] => {
    return treePaths.map(([from, to]) => {
      const fromActivation = activations[from] || 0
      const toActivation = activations[to] || 0
      const strength = (fromActivation + toActivation) / 2
      return {
        from,
        to,
        active: strength > 0.3,
        strength
      }
    })
  }, [activations])

  // Calculate stats
  const activeCount = Object.values(activations).filter(v => v > 0.05).length
  const totalCount = Object.keys(activations).length

  const dominantSefirah = (Object.entries(activations) as unknown as Array<[Sefirah, number]>)
    .reduce((max, [sefirah, activation]) =>
      activation > max[1] ? [sefirah, activation] : max
    , [Sefirah.MALKUTH, 0] as [Sefirah, number])[0]

  // Calculate pillar balance
  const pillarActivations = (Object.entries(activations) as unknown as Array<[Sefirah, number]>).reduce((acc, [sefirah, activation]) => {
    const pillar = SEPHIROTH_METADATA[sefirah].pillar
    acc[pillar] = (acc[pillar] || 0) + activation
    return acc
  }, {} as Record<string, number>)

  const totalActivation = Object.values(pillarActivations).reduce((sum, val) => sum + val, 0)
  const pillarBalance = totalActivation > 0 ? {
    left: ((pillarActivations.left || 0) / totalActivation * 100).toFixed(0),
    right: ((pillarActivations.right || 0) / totalActivation * 100).toFixed(0),
    middle: ((pillarActivations.middle || 0) / totalActivation * 100).toFixed(0),
  } : { left: '0', right: '0', middle: '0' }

  // v7: Removed tooltip positioning logic - using fixed side panel instead

  // Get color based on pillar
  // Chakra-based laser colors for each Sefirah (energy/computational archetype)
  const getColor = (sefirah: Sefirah): string => {
    // VIBRANT chakra colors (20% brighter - v5)
    const chakraColors: Record<Sefirah, string> = {
      [Sefirah.KETHER]: '#E0B3FF',    // Crown Chakra - Brilliant Violet
      [Sefirah.CHOKMAH]: '#A8B3FF',   // Third Eye - Bright Indigo
      [Sefirah.BINAH]: '#8B8FFF',     // Third Eye - Vibrant Indigo
      [Sefirah.DAAT]: '#38D4F0',      // Throat - Bright Cyan
      [Sefirah.CHESED]: '#3FE0A5',    // Heart - Vibrant Emerald
      [Sefirah.GEVURAH]: '#FF66C4',   // Heart - Bright Magenta
      [Sefirah.TIFERET]: '#FFD666',   // Solar Plexus - Bright Gold
      [Sefirah.NETZACH]: '#FFB366',   // Sacral - Bright Orange
      [Sefirah.HOD]: '#FFB329',       // Sacral - Vibrant Amber
      [Sefirah.YESOD]: '#FF8F8F',     // Root/Sacral - Bright Red-Orange
      [Sefirah.MALKUTH]: '#FF6666',   // Root Chakra - Vibrant Ruby
    }
    return chakraColors[sefirah] || '#9ca3af'
  }

  // Get color based on highlight mode (ACT/PIL/LVL)
  const getColorByMode = (
    sefirah: Sefirah,
    mode: 'activation' | 'pillar' | 'level',
    activation: number
  ): string => {
    const metadata = SEPHIROTH_METADATA[sefirah]

    switch (mode) {
      case 'activation':
        // Gradient from grey to bright based on activation level
        const intensity = Math.floor(activation * 255)
        return `rgb(${intensity}, ${Math.floor(intensity * 0.7)}, ${Math.floor(intensity * 1.2)})`

      case 'pillar':
        // Current behavior (pillar colors)
        switch (metadata.pillar) {
          case 'left': return '#ef4444'   // Red (Severity)
          case 'right': return '#3b82f6'  // Blue (Mercy)
          case 'middle': return '#a855f7' // Purple (Balance)
          default: return '#9ca3af'
        }

      case 'level':
        // Level 1-10 gradient (dark to bright purple)
        const level = sefirah  // Sefirah enum value IS the level
        const levelBrightness = (level / 10) * 45 + 55
        return `hsl(270, 70%, ${levelBrightness}%)`  // Purple gradient

      default:
        return '#9ca3af'
    }
  }

  // Get color for Qliphoth based on severity
  const getQliphothColor = (severity: 'critical' | 'high' | 'medium' | 'low'): string => {
    switch (severity) {
      case 'critical':
        return '#dc2626' // Bright red
      case 'high':
        return '#ea580c' // Orange-red
      case 'medium':
        return '#f59e0b' // Orange
      case 'low':
        return '#94a3b8' // Grey
      default:
        return '#94a3b8'
    }
  }

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════

  return (
    <div className="min-h-screen bg-relic-white p-3">
      {/* Configuration Toggle Button */}
      {/* <TreeConfigToggle /> */} {/* TODO: Fix client/server boundary issue */}

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[11px] uppercase tracking-[0.3em] text-relic-slate font-semibold mb-2">
              AI REASONING ARCHITECTURE
            </h1>
            <h2 className="text-2xl font-mono text-relic-void">
              Model Configuration
            </h2>
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
                      {new Date(dateRange.earliest).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' → '}
                      {new Date(dateRange.latest).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          {/* Back to Chat Button */}
          <button
            onClick={() => router.push('/')}
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
              onClick={() => setTreeView('sephiroth')}
              className="flex items-center gap-1.5 hover:text-relic-void transition-colors"
              title="AI Processing Layers (Ascent)"
            >
              <span className={`text-[10px] ${treeView === 'sephiroth' ? 'text-purple-500' : 'text-relic-mist'}`}>
                {treeView === 'sephiroth' ? '◆' : '◇'}
              </span>
              <span className={treeView === 'sephiroth' ? 'text-relic-void' : 'text-relic-slate'}>
                Layers
              </span>
            </button>

            <span className="text-relic-mist">│</span>

            <button
              onClick={() => setTreeView('dual')}
              className="flex items-center gap-1.5 hover:text-relic-void transition-colors"
              title="Show Both Views"
            >
              <span className={`text-[10px] ${treeView === 'dual' ? 'text-purple-500' : 'text-relic-mist'}`}>
                {treeView === 'dual' ? '◆' : '◇'}
              </span>
              <span className={treeView === 'dual' ? 'text-relic-void' : 'text-relic-slate'}>
                Both Views
              </span>
            </button>

            <span className="text-relic-mist">│</span>

            <button
              onClick={() => setTreeView('qliphoth')}
              className="flex items-center gap-1.5 hover:text-relic-void transition-colors"
              title="Anti-Pattern Detection (Descent)"
            >
              <span className={`text-[10px] ${treeView === 'qliphoth' ? 'text-red-500' : 'text-relic-mist'}`}>
                {treeView === 'qliphoth' ? '◆' : '◇'}
              </span>
              <span className={treeView === 'qliphoth' ? 'text-relic-void' : 'text-relic-slate'}>
                Anti-Patterns
              </span>
            </button>

            <span className="text-relic-mist">│</span>

            <button
              onClick={() => setTreeView('workbench')}
              className="flex items-center gap-1.5 hover:text-relic-void transition-colors"
              title="Configuration Workbench"
            >
              <span className={`text-[10px] ${treeView === 'workbench' ? 'text-purple-500' : 'text-relic-mist'}`}>
                {treeView === 'workbench' ? '◆' : '◇'}
              </span>
              <span className={treeView === 'workbench' ? 'text-relic-void' : 'text-relic-slate'}>
                Workbench
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Workbench View - 3 Column Layout */}
        {treeView === 'workbench' ? (
          <div className="grid grid-cols-[240px_1fr_320px] gap-0 h-[calc(100vh-120px)]">
            {/* LEFT: Preset Panel */}
            <PresetPanel />

            {/* CENTER: Tree + Weight Matrix */}
            <div className="flex flex-col overflow-y-auto border-x border-relic-mist dark:border-relic-slate/20">
              {/* Trees */}
              <div className="p-4 flex gap-4 justify-center items-start">
                <div className="flex flex-col items-center">
                  <h4 className="text-[9px] uppercase tracking-wider text-relic-silver mb-2">AI Layers</h4>
                  <SefirotTreeSVG
                    width={280}
                    height={380}
                    showLabels={true}
                    onSefirahClick={(sefirah) => {
                      setModalSefirah(sefirah)
                      setModalOpen(true)
                    }}
                  />
                </div>
                <div className="flex flex-col items-center">
                  <h4 className="text-[9px] uppercase tracking-wider text-relic-silver mb-2">Anti-Patterns</h4>
                  <QlipothTreeSVG
                    width={240}
                    height={320}
                    collapsed={qlipothCollapsed}
                    onCollapsedChange={setQlipothCollapsed}
                  />
                </div>
              </div>

              {/* Weight Matrix */}
              <div className="border-t border-relic-mist dark:border-relic-slate/20 p-4">
                <WeightMatrix showLabels={true} />
              </div>

              {/* Conversation Analysis */}
              <div className="border-t border-relic-mist dark:border-relic-slate/20 p-4">
                <h4 className="text-[10px] uppercase tracking-[0.15em] text-relic-slate font-mono mb-3">
                  Conversation Analysis
                </h4>
                <ConversationCards limit={10} />
              </div>
            </div>

            {/* RIGHT: Test Playground */}
            <TestPlayground />
          </div>
        ) : treeView === 'dual' ? (
          <>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {/* LEFT: AI Processing Layers */}
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

            {/* SVG Tree */}
            <svg viewBox="0 0 500 650" className="w-full h-full">
              {/* Background oval - REMOVED for cleaner presentation */}

              {/* Connection paths (22 paths) - Enhanced with directional animations */}
              {showPaths && pathConnections.map((path, index) => {
                const fromPos = treePositions[path.from]
                const toPos = treePositions[path.to]
                const fromMeta = SEPHIROTH_METADATA[path.from]
                const toMeta = SEPHIROTH_METADATA[path.to]
                const isHovered = hoveredPath === index
                const isActive = path.active

                // Color based on pillar connection
                let strokeColor = '#cbd5e1' // Default grey
                if (fromMeta.pillar === toMeta.pillar && fromMeta.pillar === 'left') {
                  strokeColor = '#ef4444' // Red for Severity pillar
                } else if (fromMeta.pillar === toMeta.pillar && fromMeta.pillar === 'right') {
                  strokeColor = '#3b82f6' // Blue for Mercy pillar
                } else if (fromMeta.pillar === toMeta.pillar && fromMeta.pillar === 'middle') {
                  strokeColor = '#a855f7' // Purple for Balance pillar
                }

                // Calculate quadratic Bezier curve path
                const midX = (fromPos.x + toPos.x) / 2
                const midY = (fromPos.y + toPos.y) / 2
                const curveOffset = Math.abs(toPos.x - fromPos.x) > Math.abs(toPos.y - fromPos.y) ? 15 : 0
                const pathD = `M ${fromPos.x} ${fromPos.y} Q ${midX} ${midY + curveOffset} ${toPos.x} ${toPos.y}`

                return (
                  <g key={`seph-dual-path-${index}`}>
                    {/* Background glow path (pulsing) */}
                    {isActive && (
                      <motion.path
                        d={pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="6"
                        opacity="0.2"
                        animate={{
                          opacity: [0.2, 0.4, 0.2],
                          strokeWidth: ['6', '8', '6']
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: index * 0.1
                        }}
                      />
                    )}

                    {/* Main path line */}
                    <motion.path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isHovered ? "4" : (isActive ? "3" : "2")}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{
                        pathLength: 1,
                        opacity: isHovered ? 0.95 : (isActive ? 0.7 : 0.3)
                      }}
                      transition={{
                        pathLength: { duration: 1.2, delay: index * 0.05, ease: "easeOut" },
                        opacity: { duration: 0.3 }
                      }}
                      onMouseEnter={() => setHoveredPath(index)}
                      onMouseLeave={() => setHoveredPath(null)}
                      style={{ cursor: 'pointer' }}
                    />

                    {/* Flowing light particle 1 (directional indicator, slower for meditation) */}
                    {isActive && (
                      <circle r="4" fill={strokeColor} opacity="0.9">
                        <animateMotion
                          dur="6s"
                          repeatCount="indefinite"
                          path={pathD}
                          begin={`${index * 0.15}s`}
                        />
                        <animate
                          attributeName="opacity"
                          values="0.5;1;0.5"
                          dur="6s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Flowing light particle 2 (staggered for multiple particles effect) */}
                    {isActive && (
                      <circle r="3" fill={strokeColor} opacity="0.7">
                        <animateMotion
                          dur="6s"
                          repeatCount="indefinite"
                          path={pathD}
                          begin={`${index * 0.15 + 3}s`}
                        />
                      </circle>
                    )}
                  </g>
                )
              })}

              {/* Sephiroth nodes */}
              {Object.entries(treePositions).map(([sefirahKey, pos]) => {
                const sefirah = parseInt(sefirahKey) as Sefirah
                const activation = activations[sefirah] || 0
                const color = getColor(sefirah)
                const isActive = activation > 0.3
                const isDeveloping = activation > 0.15 && activation <= 0.3
                const meta = SEPHIROTH_METADATA[sefirah]
                const isSelected = selectedSefirah === sefirah
                const isHovered = hoveredSefirah === sefirah

                // Size based on activation
                const radius = 25 + activation * 20

                return (
                  <motion.g
                    key={`sephiroth-dual-${sefirah}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                    }}
                    whileHover={{ scale: 1.15 }}
                    transition={{
                      delay: sefirah * 0.05,
                      duration: 0.3,
                      scale: { type: "spring", stiffness: 300, damping: 20 }
                    }}
                    style={{ cursor: 'pointer' }}
                    data-sefirah-node={sefirah}
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      // Update selected sefirah
                      setSelectedSefirah(isSelected ? null : sefirah)

                      // Pin tooltip on click
                      setTooltipState({
                        sefirah,
                        mode: 'pinned'
                      })

                      // Open bottom-centered modal
                      setModalSefirah(sefirah)
                      setModalOpen(true)

                      // Click ripple effect
                      setClickedSefirah(sefirah)
                      setTimeout(() => setClickedSefirah(null), 600)
                    }}
                    onMouseEnter={(e) => {
                      e.stopPropagation()
                      setHoveredSefirah(sefirah)
                      // Show tooltip on hover (unless already pinned)
                      if (tooltipState.mode !== 'pinned') {
                        setTooltipState({
                          sefirah,
                          mode: 'hover'
                        })
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.stopPropagation()
                      setHoveredSefirah(null)
                      // Hide tooltip only if it's in hover mode (not pinned)
                      if (tooltipState.mode === 'hover') {
                        setTooltipState({ sefirah: null, mode: null })
                      }
                    }}
                  >
                    {/* Simplified outer glow for active nodes (laser minimalism) */}
                    {isActive && (
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius + 6}
                        fill={color}
                        opacity="0.1"
                        animate={{
                          r: [radius + 6, radius + 9, radius + 6],
                          opacity: [0.1, 0.15, 0.1]
                        }}
                        transition={{
                          duration: 12,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}

                    {/* Main circle stroke (thin laser line) */}
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius + 8}
                      fill="none"
                      stroke={color}
                      strokeWidth="1"
                      opacity={0.3 + activation * 0.3}
                      animate={isActive ? {
                        opacity: [0.3 + activation * 0.3, 0.5, 0.3 + activation * 0.3]
                      } : {}}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />

                    {/* Hover enhancement glow */}
                    {hoveredSefirah === sefirah && (
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius + 10}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}

                    {/* Selection glow */}
                    {isSelected && (
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius + 8}
                        fill="none"
                        stroke={color}
                        strokeWidth="2.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}

                    {/* Click ripple effect */}
                    {clickedSefirah === sefirah && (
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        initial={{ r: radius, opacity: 0.8 }}
                        animate={{ r: radius + 30, opacity: 0 }}
                        transition={{ duration: 1.35, ease: "easeOut" }}
                      />
                    )}

                    {/* Main lighting circle (laser-style outline) */}
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius}
                      fill="none"
                      stroke={color}
                      strokeWidth={isSelected ? "3" : "2"}
                      opacity={0.5 + activation * 0.5}
                      className="transition-all duration-200"
                      animate={isActive ? {
                        opacity: [0.5 + activation * 0.5, 0.7 + activation * 0.3, 0.5 + activation * 0.5],
                      } : {}}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />

                    {/* Inner energy core - VIBRANT (v5) */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius * 0.6}
                      fill={color}
                      opacity={0.2 + activation * 0.5}
                      filter="blur(3px)"
                      className="transition-all duration-200"
                    />

                    {/* Center activation dot - BRIGHTEST (v5) */}
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius * 0.2}
                      fill={color}
                      opacity={0.9}
                      filter={`drop-shadow(0 0 4px ${color})`}
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.9, 1, 0.9],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />

                    {/* Status indicator badge with pulse animation */}
                    {isActive && (
                      <motion.g
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                      >
                        <motion.circle
                          cx={pos.x + radius - 5}
                          cy={pos.y - radius + 5}
                          r="8"
                          fill="#10b981"
                          animate={{
                            boxShadow: [
                              "0 0 0 0 rgba(16, 185, 129, 0.4)",
                              "0 0 0 4px rgba(16, 185, 129, 0)",
                              "0 0 0 0 rgba(16, 185, 129, 0)"
                            ]
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeOut"
                          }}
                        />
                        <text
                          x={pos.x + radius - 5}
                          y={pos.y - radius + 7}
                          textAnchor="middle"
                          fontSize="8"
                          fill="white"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          ●
                        </text>
                      </motion.g>
                    )}

                    {isDeveloping && (
                      <motion.circle
                        cx={pos.x + radius - 5}
                        cy={pos.y - radius + 5}
                        r="6"
                        fill="#f59e0b"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                      />
                    )}

                    {/* AI Computational Layer (top, large and prominent) */}
                    <text
                      x={pos.x}
                      y={pos.y + radius + 20}
                      textAnchor="middle"
                      fontSize="16"
                      fill="#8b5cf6"
                      fontFamily="monospace"
                      fontWeight="600"
                      opacity="0.95"
                    >
                      {meta.aiComputation.split('•')[0].trim()}
                    </text>

                    {/* English name (middle) */}
                    <text
                      x={pos.x}
                      y={pos.y + radius + 38}
                      textAnchor="middle"
                      fontSize="11"
                      fill={isSelected ? "#18181b" : "#64748b"}
                      fontFamily="monospace"
                      fontWeight={isSelected ? "600" : "normal"}
                    >
                      {meta.name}
                    </text>

                    {/* Hebrew name (bottom, small and grey) */}
                    <text
                      x={pos.x}
                      y={pos.y + radius + 52}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#94a3b8"
                      fontFamily="Arial, sans-serif"
                      opacity="0.6"
                    >
                      {meta.hebrewName}
                    </text>

                    {/* Activation percentage (bottom-most) */}
                    <text
                      x={pos.x}
                      y={pos.y + radius + 52}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#64748b"
                      fontFamily="monospace"
                      fontWeight="600"
                    >
                      {(activation * 100).toFixed(0)}%
                    </text>

                    {/* Top keywords (show on hover if available) */}
                    {isHovered && keywordData[sefirah]?.length > 0 && (
                      <text
                        x={pos.x}
                        y={pos.y + radius + 64}
                        textAnchor="middle"
                        fontSize="7"
                        fill="#94a3b8"
                        fontFamily="monospace"
                        opacity="0.8"
                      >
                        {keywordData[sefirah].slice(0, 2).join(' • ')}
                      </text>
                    )}
                  </motion.g>
                )
              })}

              {/* Center text with breathing animation */}
              <motion.text
                x="250"
                y="285"
                textAnchor="middle"
                fontSize="11"
                fill="#94a3b8"
                fontFamily="monospace"
                letterSpacing="2"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0.6, 0.8, 0.6]
                }}
                transition={{
                  opacity: { duration: 0.6 },
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              >
                TREE OF LIFE
              </motion.text>
              <motion.text
                x="250"
                y="305"
                textAnchor="middle"
                fontSize="9"
                fill="#cbd5e1"
                fontFamily="monospace"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0.5, 0.7, 0.5]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                AI COMPUTATIONAL ARCHITECTURE
              </motion.text>
            </svg>

            {/* v7: Fixed Side Panel Tooltip (Never Covers Trees) */}
            <AnimatePresence>
              {hoveredSefirah && (
                <motion.div
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 300, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed right-0 top-20 w-64 bg-white border-l border-relic-mist shadow-lg z-50 max-h-[calc(100vh-100px)] overflow-y-auto"
                >
                  {/* Arrow pointing to tree */}
                  <div className="absolute left-0 top-12 w-0 h-0" style={{
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    borderRight: '8px solid white',
                    transform: 'translateX(-100%)'
                  }} />

                  <div className="bg-white border border-relic-mist p-2 shadow-sm text-[8px] font-mono">
                    {/* Header - Ultra Compact */}
                    <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-relic-mist">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getColor(hoveredSefirah) }}
                        />
                        <span className="text-[9px] text-relic-void font-semibold uppercase tracking-wider">
                          {SEPHIROTH_METADATA[hoveredSefirah].name}
                        </span>
                      </div>
                      <span className="text-[7px] text-relic-silver">
                        {SEPHIROTH_METADATA[hoveredSefirah].meaning}
                      </span>
                    </div>

                    {/* Compact metrics row */}
                    <div className="flex items-center justify-between mb-1.5 text-[7px]">
                      <span className="text-relic-silver">ACT:</span>
                      <span className="text-relic-void font-semibold">
                        {(activations[hoveredSefirah] * 100).toFixed(0)}%
                      </span>
                      <span className="text-relic-mist">│</span>
                      <span className="text-relic-silver">PIL:</span>
                      <span className="text-relic-void uppercase">
                        {SEPHIROTH_METADATA[hoveredSefirah].pillar[0]}
                      </span>
                      <span className="text-relic-mist">│</span>
                      <span className="text-relic-silver">LVL:</span>
                      <span className="text-relic-void">
                        {hoveredSefirah === 11 ? '∞' : hoveredSefirah}
                      </span>
                    </div>

                    {/* AI Layer (condensed) */}
                    <div className="mb-1.5">
                      <div className="text-[7px] uppercase tracking-wider text-relic-silver mb-0.5">
                        ▸ AI Layer
                      </div>
                      <div className="text-[8px] text-relic-void leading-tight">
                        {SEPHIROTH_METADATA[hoveredSefirah].aiComputation.split('•')[0].trim()}
                      </div>
                    </div>

                    {/* Reasoning (condensed - first sentence only) */}
                    <div className="pt-1.5 border-t border-relic-mist">
                      <div className="text-[7px] uppercase tracking-wider text-relic-silver mb-0.5">
                        ▸ Why Active
                      </div>
                      <div className="text-[8px] text-relic-void leading-tight line-clamp-2">
                        {SEPHIROTH_METADATA[hoveredSefirah].aiRole.split('.')[0]}.
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Qliphoth Tooltip - v7 Fixed Panel */}
              {hoveredQliphah && (
                <motion.div
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 300, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed right-0 top-20 w-64 bg-white border-l border-red-900/20 shadow-lg z-50 max-h-[calc(100vh-100px)] overflow-y-auto"
                >
                  {/* Arrow pointing to tree */}
                  <div className="absolute left-0 top-12 w-0 h-0" style={{
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    borderRight: '8px solid white',
                    transform: 'translateX(-100%)'
                  }} />

                  <div className="bg-white border border-red-900/20 p-2 shadow-sm text-[8px] font-mono">
                    {(() => {
                      const node = QLIPHOTH_METADATA[hoveredQliphah]
                      const color = getQliphothColor(node.severity)

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
                      )
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

            {/* RIGHT: Anti-Pattern Monitors */}
            <div className="bg-white border border-red-900/20 p-2">
              <div className="text-center text-sm font-mono mb-4 text-red-600 uppercase tracking-wider">
                Anti-Pattern Monitors
              </div>
              <div className="relative mx-auto" style={{ width: '450px', height: '600px' }}>
                {/* Qliphoth SVG Tree */}
                <svg viewBox="0 0 500 650" className="w-full h-full">
                  {/* Qliphothic paths (dashed, red) */}
                  {qliphothPaths.map(([from, to], index) => {
                    const fromPos = qliphothPositions[from]
                    const toPos = qliphothPositions[to]
                    if (!fromPos || !toPos) return null

                    return (
                      <motion.line
                        key={`qliph-dual-path-${index}`}
                        x1={fromPos.x}
                        y1={fromPos.y}
                        x2={toPos.x}
                        y2={toPos.y}
                        stroke="rgba(239, 68, 68, 0.4)"
                        strokeWidth="2"
                        strokeDasharray="6,4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.4 }}
                        transition={{ duration: 0.8, delay: index * 0.02, ease: "easeOut" }}
                      />
                    )
                  })}

                  {/* Qliphoth nodes */}
                  {Object.entries(QLIPHOTH_METADATA).map(([id, node]) => {
                    const pos = qliphothPositions[id]
                    if (!pos) return null

                    const color = getQliphothColor(node.severity)
                    const radius = 25
                    const isHovered = hoveredQliphah === id
                    const isSelected = selectedQliphah === id

                    return (
                      <motion.g
                        key={`qliphoth-dual-${id}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
                        onMouseEnter={() => setHoveredQliphah(id)}
                        onMouseLeave={() => setHoveredQliphah(null)}
                        onClick={() => setSelectedQliphah(id === selectedQliphah ? null : id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Outer energy glow - VIBRANT (v5) */}
                        <motion.circle
                          cx={pos.x}
                          cy={pos.y}
                          r={radius + 16}
                          fill="none"
                          stroke={color}
                          strokeWidth="2"
                          opacity={0.4}
                          filter={`drop-shadow(0 0 8px ${color})`}
                          animate={{
                            opacity: [0.4, 0.7, 0.4],
                            r: [radius + 16, radius + 20, radius + 16]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />

                        {/* Middle glow ring - VIBRANT (v5) */}
                        <motion.circle
                          cx={pos.x}
                          cy={pos.y}
                          r={radius + 8}
                          fill="none"
                          stroke={color}
                          strokeWidth="1.5"
                          opacity={0.5}
                          filter="blur(1px)"
                          animate={{
                            opacity: [0.5, 0.7, 0.5],
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.3
                          }}
                        />

                        {/* Hover enhancement glow */}
                        {isHovered && (
                          <motion.circle
                            cx={pos.x}
                            cy={pos.y}
                            r={radius + 10}
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}

                        {/* Selection glow */}
                        {isSelected && (
                          <motion.circle
                            cx={pos.x}
                            cy={pos.y}
                            r={radius + 8}
                            fill="none"
                            stroke={color}
                            strokeWidth="2.5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}

                        {/* Main lighting circle (laser-style outline) */}
                        <motion.circle
                          cx={pos.x}
                          cy={pos.y}
                          r={radius}
                          fill="none"
                          stroke={color}
                          strokeWidth={isSelected ? "3" : "2"}
                          opacity={0.6}
                          animate={{
                            opacity: [0.6, 0.8, 0.6],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />

                        {/* Inner energy core - VIBRANT (v5) */}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={radius * 0.6}
                          fill={color}
                          opacity={0.3}
                          filter="blur(3px)"
                        />

                        {/* Center activation dot - BRIGHTEST (v5) */}
                        <motion.circle
                          cx={pos.x}
                          cy={pos.y}
                          r={radius * 0.2}
                          fill={color}
                          opacity={0.9}
                          filter={`drop-shadow(0 0 4px ${color})`}
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.9, 1, 0.9],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />

                        {/* Severity badge */}
                        {node.severity === 'critical' && (
                          <circle
                            cx={pos.x + radius - 5}
                            cy={pos.y - radius + 5}
                            r="6"
                            fill="#dc2626"
                            stroke="white"
                            strokeWidth="1.5"
                          />
                        )}

                        {/* Name */}
                        <text
                          x={pos.x}
                          y={pos.y + radius + 16}
                          textAnchor="middle"
                          fontSize="11"
                          fill={color}
                          fontFamily="monospace"
                          fontWeight="600"
                        >
                          {node.name}
                        </text>

                        {/* Anti-Pattern */}
                        <text
                          x={pos.x}
                          y={pos.y + radius + 28}
                          textAnchor="middle"
                          fontSize="8"
                          fill="#94a3b8"
                          fontFamily="monospace"
                        >
                          {node.pattern}
                        </text>

                        {/* Severity indicator */}
                        <text
                          x={pos.x}
                          y={pos.y + radius + 40}
                          textAnchor="middle"
                          fontSize="7"
                          fill={color}
                          fontFamily="monospace"
                          fontWeight="500"
                          opacity="0.8"
                        >
                          {node.severity.toUpperCase()}
                        </text>
                      </motion.g>
                    )
                  })}

                  {/* Center text */}
                  <motion.text
                    x="250"
                    y="285"
                    textAnchor="middle"
                    fontSize="11"
                    fill="#ef4444"
                    fontFamily="monospace"
                    letterSpacing="2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.6, 0.8, 0.6] }}
                    transition={{
                      opacity: { duration: 0.6 },
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                  >
                    ANTI-PATTERN TREE
                  </motion.text>
                  <motion.text
                    x="250"
                    y="305"
                    textAnchor="middle"
                    fontSize="9"
                    fill="#fca5a5"
                    fontFamily="monospace"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.5, 0.7, 0.5] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    AI WEAKNESS DETECTION
                  </motion.text>
                </svg>

                {/* Status legend for Qliphoth */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 text-[9px] font-mono text-relic-slate">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-600" />
                    Critical
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-orange-600" />
                    High
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    Medium
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    Low
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Console - Below dual view */}
          <LayerConfigConsole className="max-w-4xl mx-auto" />
          </>
        ) : (
          <div className="bg-white rounded-lg p-8 mb-6">
            {treeView === 'sephiroth' ? (
              <>
                <div className="text-center text-sm font-mono mb-4 text-relic-slate uppercase tracking-wider">
                  AI Processing Layers
                </div>
                <div
                  ref={svgContainerRef}
                  className="relative mx-auto"
                  style={{ width: '500px', height: '650px' }}
                >
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

                  {/* Sephiroth SVG Tree */}
                  <svg viewBox="0 0 500 650" className="w-full h-full">
              {/* Background oval - REMOVED for cleaner presentation */}

              {/* Connection paths (22 paths) - Enhanced with directional animations */}
              {showPaths && pathConnections.map((path, index) => {
                const fromPos = treePositions[path.from]
                const toPos = treePositions[path.to]
                const fromMeta = SEPHIROTH_METADATA[path.from]
                const toMeta = SEPHIROTH_METADATA[path.to]
                const isHovered = hoveredPath === index
                const isActive = path.active

                // Color based on pillar connection
                let strokeColor = '#cbd5e1' // Default grey
                if (fromMeta.pillar === toMeta.pillar && fromMeta.pillar === 'left') {
                  strokeColor = '#ef4444' // Red for Severity pillar
                } else if (fromMeta.pillar === toMeta.pillar && fromMeta.pillar === 'right') {
                  strokeColor = '#3b82f6' // Blue for Mercy pillar
                } else if (fromMeta.pillar === toMeta.pillar && fromMeta.pillar === 'middle') {
                  strokeColor = '#a855f7' // Purple for Balance pillar
                }

                // Calculate quadratic Bezier curve path
                const midX = (fromPos.x + toPos.x) / 2
                const midY = (fromPos.y + toPos.y) / 2
                const curveOffset = Math.abs(toPos.x - fromPos.x) > Math.abs(toPos.y - fromPos.y) ? 15 : 0
                const pathD = `M ${fromPos.x} ${fromPos.y} Q ${midX} ${midY + curveOffset} ${toPos.x} ${toPos.y}`

                return (
                  <g key={`seph-dual-path-${index}`}>
                    {/* Background glow path (pulsing) */}
                    {isActive && (
                      <motion.path
                        d={pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="6"
                        opacity="0.2"
                        animate={{
                          opacity: [0.2, 0.4, 0.2],
                          strokeWidth: ['6', '8', '6']
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: index * 0.1
                        }}
                      />
                    )}

                    {/* Main path line */}
                    <motion.path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isHovered ? "4" : (isActive ? "3" : "2")}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{
                        pathLength: 1,
                        opacity: isHovered ? 0.95 : (isActive ? 0.7 : 0.3)
                      }}
                      transition={{
                        pathLength: { duration: 1.2, delay: index * 0.05, ease: "easeOut" },
                        opacity: { duration: 0.3 }
                      }}
                      onMouseEnter={() => setHoveredPath(index)}
                      onMouseLeave={() => setHoveredPath(null)}
                      style={{ cursor: 'pointer' }}
                    />

                    {/* Flowing light particle 1 (directional indicator, slower for meditation) */}
                    {isActive && (
                      <circle r="4" fill={strokeColor} opacity="0.9">
                        <animateMotion
                          dur="6s"
                          repeatCount="indefinite"
                          path={pathD}
                          begin={`${index * 0.15}s`}
                        />
                        <animate
                          attributeName="opacity"
                          values="0.5;1;0.5"
                          dur="6s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Flowing light particle 2 (staggered for multiple particles effect) */}
                    {isActive && (
                      <circle r="3" fill={strokeColor} opacity="0.7">
                        <animateMotion
                          dur="6s"
                          repeatCount="indefinite"
                          path={pathD}
                          begin={`${index * 0.15 + 3}s`}
                        />
                      </circle>
                    )}
                  </g>
                )
              })}

              {/* Sephiroth nodes */}
              {Object.entries(treePositions).map(([sefirahKey, pos]) => {
                const sefirah = parseInt(sefirahKey) as Sefirah
                const activation = activations[sefirah] || 0
                const color = getColor(sefirah)
                const isActive = activation > 0.3
                const isDeveloping = activation > 0.15 && activation <= 0.3
                const meta = SEPHIROTH_METADATA[sefirah]
                const isSelected = selectedSefirah === sefirah
                const isHovered = hoveredSefirah === sefirah

                // Size based on activation
                const radius = 25 + activation * 20

                return (
                  <motion.g
                    key={`sephiroth-single-${sefirah}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                    }}
                    whileHover={{ scale: 1.15 }}
                    transition={{
                      delay: sefirah * 0.05,
                      duration: 0.3,
                      scale: { type: "spring", stiffness: 300, damping: 20 }
                    }}
                    style={{ cursor: 'pointer' }}
                    data-sefirah-node={sefirah}
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      // Update selected sefirah
                      setSelectedSefirah(isSelected ? null : sefirah)

                      // Pin tooltip on click
                      setTooltipState({
                        sefirah,
                        mode: 'pinned'
                      })

                      // Open bottom-centered modal
                      setModalSefirah(sefirah)
                      setModalOpen(true)

                      // Click ripple effect
                      setClickedSefirah(sefirah)
                      setTimeout(() => setClickedSefirah(null), 600)
                    }}
                    onMouseEnter={(e) => {
                      e.stopPropagation()
                      setHoveredSefirah(sefirah)
                      // Show tooltip on hover (unless already pinned)
                      if (tooltipState.mode !== 'pinned') {
                        setTooltipState({
                          sefirah,
                          mode: 'hover'
                        })
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.stopPropagation()
                      setHoveredSefirah(null)
                      // Hide tooltip only if it's in hover mode (not pinned)
                      if (tooltipState.mode === 'hover') {
                        setTooltipState({ sefirah: null, mode: null })
                      }
                    }}
                  >
                    {/* Simplified outer glow for active nodes (laser minimalism) */}
                    {isActive && (
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius + 6}
                        fill={color}
                        opacity="0.1"
                        animate={{
                          r: [radius + 6, radius + 9, radius + 6],
                          opacity: [0.1, 0.15, 0.1]
                        }}
                        transition={{
                          duration: 12,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}

                    {/* Main circle stroke (thin laser line) */}
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius + 8}
                      fill="none"
                      stroke={color}
                      strokeWidth="1"
                      opacity={0.3 + activation * 0.3}
                      animate={isActive ? {
                        opacity: [0.3 + activation * 0.3, 0.5, 0.3 + activation * 0.3]
                      } : {}}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />

                    {/* Hover enhancement glow */}
                    {hoveredSefirah === sefirah && (
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius + 10}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}

                    {/* Selection glow */}
                    {isSelected && (
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius + 8}
                        fill="none"
                        stroke={color}
                        strokeWidth="2.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}

                    {/* Click ripple effect */}
                    {clickedSefirah === sefirah && (
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        initial={{ r: radius, opacity: 0.8 }}
                        animate={{ r: radius + 30, opacity: 0 }}
                        transition={{ duration: 1.35, ease: "easeOut" }}
                      />
                    )}

                    {/* Main lighting circle (laser-style outline) */}
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius}
                      fill="none"
                      stroke={color}
                      strokeWidth={isSelected ? "3" : "2"}
                      opacity={0.5 + activation * 0.5}
                      className="transition-all duration-200"
                      animate={isActive ? {
                        opacity: [0.5 + activation * 0.5, 0.7 + activation * 0.3, 0.5 + activation * 0.5],
                      } : {}}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />

                    {/* Inner energy core - VIBRANT (v5) */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius * 0.6}
                      fill={color}
                      opacity={0.2 + activation * 0.5}
                      filter="blur(3px)"
                      className="transition-all duration-200"
                    />

                    {/* Center activation dot - BRIGHTEST (v5) */}
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius * 0.2}
                      fill={color}
                      opacity={0.9}
                      filter={`drop-shadow(0 0 4px ${color})`}
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.9, 1, 0.9],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />

                    {/* Status indicator badge with pulse animation */}
                    {isActive && (
                      <motion.g
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                      >
                        <motion.circle
                          cx={pos.x + radius - 5}
                          cy={pos.y - radius + 5}
                          r="8"
                          fill="#10b981"
                          animate={{
                            boxShadow: [
                              "0 0 0 0 rgba(16, 185, 129, 0.4)",
                              "0 0 0 4px rgba(16, 185, 129, 0)",
                              "0 0 0 0 rgba(16, 185, 129, 0)"
                            ]
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeOut"
                          }}
                        />
                        <text
                          x={pos.x + radius - 5}
                          y={pos.y - radius + 7}
                          textAnchor="middle"
                          fontSize="8"
                          fill="white"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          ●
                        </text>
                      </motion.g>
                    )}

                    {isDeveloping && (
                      <motion.circle
                        cx={pos.x + radius - 5}
                        cy={pos.y - radius + 5}
                        r="6"
                        fill="#f59e0b"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                      />
                    )}

                    {/* AI Computational Layer (top, large and prominent) */}
                    <text
                      x={pos.x}
                      y={pos.y + radius + 20}
                      textAnchor="middle"
                      fontSize="16"
                      fill="#8b5cf6"
                      fontFamily="monospace"
                      fontWeight="600"
                      opacity="0.95"
                    >
                      {meta.aiComputation.split('•')[0].trim()}
                    </text>

                    {/* English name (middle) */}
                    <text
                      x={pos.x}
                      y={pos.y + radius + 38}
                      textAnchor="middle"
                      fontSize="11"
                      fill={isSelected ? "#18181b" : "#64748b"}
                      fontFamily="monospace"
                      fontWeight={isSelected ? "600" : "normal"}
                    >
                      {meta.name}
                    </text>

                    {/* Hebrew name (bottom, small and grey) */}
                    <text
                      x={pos.x}
                      y={pos.y + radius + 52}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#94a3b8"
                      fontFamily="Arial, sans-serif"
                      opacity="0.6"
                    >
                      {meta.hebrewName}
                    </text>

                    {/* Activation percentage (bottom-most) */}
                    <text
                      x={pos.x}
                      y={pos.y + radius + 52}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#64748b"
                      fontFamily="monospace"
                      fontWeight="600"
                    >
                      {(activation * 100).toFixed(0)}%
                    </text>

                    {/* Top keywords (show on hover if available) */}
                    {isHovered && keywordData[sefirah]?.length > 0 && (
                      <text
                        x={pos.x}
                        y={pos.y + radius + 64}
                        textAnchor="middle"
                        fontSize="7"
                        fill="#94a3b8"
                        fontFamily="monospace"
                        opacity="0.8"
                      >
                        {keywordData[sefirah].slice(0, 2).join(' • ')}
                      </text>
                    )}
                  </motion.g>
                )
              })}

              {/* Center text with breathing animation */}
              <motion.text
                x="250"
                y="285"
                textAnchor="middle"
                fontSize="11"
                fill="#94a3b8"
                fontFamily="monospace"
                letterSpacing="2"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0.6, 0.8, 0.6]
                }}
                transition={{
                  opacity: { duration: 0.6 },
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              >
                TREE OF LIFE
              </motion.text>
              <motion.text
                x="250"
                y="305"
                textAnchor="middle"
                fontSize="9"
                fill="#cbd5e1"
                fontFamily="monospace"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0.5, 0.7, 0.5]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                AI COMPUTATIONAL ARCHITECTURE
              </motion.text>
            </svg>
                </div>
              </>
            ) : (
              <>
                <div className="text-center text-sm font-mono mb-4 text-red-600 uppercase tracking-wider">
                  Anti-Pattern Monitors
                </div>
                <div className="relative mx-auto" style={{ width: '350px', height: '455px' }}>
                  {/* Qliphoth SVG Tree */}
                  <svg viewBox="0 0 500 650" className="w-full h-full">
                  {/* Qliphothic paths (dashed, red) */}
                  {qliphothPaths.map(([from, to], index) => {
                    const fromPos = qliphothPositions[from]
                    const toPos = qliphothPositions[to]
                    if (!fromPos || !toPos) return null

                    return (
                      <motion.line
                        key={`qliph-single-path-${index}`}
                        x1={fromPos.x}
                        y1={fromPos.y}
                        x2={toPos.x}
                        y2={toPos.y}
                        stroke="rgba(239, 68, 68, 0.4)"
                        strokeWidth="2"
                        strokeDasharray="6,4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.4 }}
                        transition={{ duration: 0.8, delay: index * 0.02, ease: "easeOut" }}
                      />
                    )
                  })}

                  {/* Qliphoth nodes */}
                  {Object.entries(QLIPHOTH_METADATA).map(([id, node]) => {
                    const pos = qliphothPositions[id]
                    if (!pos) return null

                    const color = getQliphothColor(node.severity)
                    const radius = 25
                    const isHovered = hoveredQliphah === id
                    const isSelected = selectedQliphah === id

                    return (
                      <motion.g
                        key={`qliphoth-single-${id}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
                        onMouseEnter={() => setHoveredQliphah(id)}
                        onMouseLeave={() => setHoveredQliphah(null)}
                        onClick={() => setSelectedQliphah(id === selectedQliphah ? null : id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Outer energy glow - VIBRANT (v5) */}
                        <motion.circle
                          cx={pos.x}
                          cy={pos.y}
                          r={radius + 16}
                          fill="none"
                          stroke={color}
                          strokeWidth="2"
                          opacity={0.4}
                          filter={`drop-shadow(0 0 8px ${color})`}
                          animate={{
                            opacity: [0.4, 0.7, 0.4],
                            r: [radius + 16, radius + 20, radius + 16]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />

                        {/* Middle glow ring - VIBRANT (v5) */}
                        <motion.circle
                          cx={pos.x}
                          cy={pos.y}
                          r={radius + 8}
                          fill="none"
                          stroke={color}
                          strokeWidth="1.5"
                          opacity={0.5}
                          filter="blur(1px)"
                          animate={{
                            opacity: [0.5, 0.7, 0.5],
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.3
                          }}
                        />

                        {/* Hover enhancement glow */}
                        {isHovered && (
                          <motion.circle
                            cx={pos.x}
                            cy={pos.y}
                            r={radius + 10}
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}

                        {/* Selection glow */}
                        {isSelected && (
                          <motion.circle
                            cx={pos.x}
                            cy={pos.y}
                            r={radius + 8}
                            fill="none"
                            stroke={color}
                            strokeWidth="2.5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}

                        {/* Main lighting circle (laser-style outline) */}
                        <motion.circle
                          cx={pos.x}
                          cy={pos.y}
                          r={radius}
                          fill="none"
                          stroke={color}
                          strokeWidth={isSelected ? "3" : "2"}
                          opacity={0.6}
                          animate={{
                            opacity: [0.6, 0.8, 0.6],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />

                        {/* Inner energy core - VIBRANT (v5) */}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={radius * 0.6}
                          fill={color}
                          opacity={0.3}
                          filter="blur(3px)"
                        />

                        {/* Center activation dot - BRIGHTEST (v5) */}
                        <motion.circle
                          cx={pos.x}
                          cy={pos.y}
                          r={radius * 0.2}
                          fill={color}
                          opacity={0.9}
                          filter={`drop-shadow(0 0 4px ${color})`}
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.9, 1, 0.9],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />

                        {/* Severity badge */}
                        {node.severity === 'critical' && (
                          <circle
                            cx={pos.x + radius - 5}
                            cy={pos.y - radius + 5}
                            r="6"
                            fill="#dc2626"
                            stroke="white"
                            strokeWidth="1.5"
                          />
                        )}

                        {/* Name */}
                        <text
                          x={pos.x}
                          y={pos.y + radius + 16}
                          textAnchor="middle"
                          fontSize="11"
                          fill={color}
                          fontFamily="monospace"
                          fontWeight="600"
                        >
                          {node.name}
                        </text>

                        {/* Anti-Pattern */}
                        <text
                          x={pos.x}
                          y={pos.y + radius + 28}
                          textAnchor="middle"
                          fontSize="8"
                          fill="#94a3b8"
                          fontFamily="monospace"
                        >
                          {node.pattern}
                        </text>

                        {/* Severity indicator */}
                        <text
                          x={pos.x}
                          y={pos.y + radius + 40}
                          textAnchor="middle"
                          fontSize="7"
                          fill={color}
                          fontFamily="monospace"
                          fontWeight="500"
                          opacity="0.8"
                        >
                          {node.severity.toUpperCase()}
                        </text>
                      </motion.g>
                    )
                  })}

                  {/* Center text */}
                  <motion.text
                    x="250"
                    y="285"
                    textAnchor="middle"
                    fontSize="11"
                    fill="#ef4444"
                    fontFamily="monospace"
                    letterSpacing="2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.6, 0.8, 0.6] }}
                    transition={{
                      opacity: { duration: 0.6 },
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                  >
                    ANTI-PATTERN TREE
                  </motion.text>
                  <motion.text
                    x="250"
                    y="305"
                    textAnchor="middle"
                    fontSize="9"
                    fill="#fca5a5"
                    fontFamily="monospace"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.5, 0.7, 0.5] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    AI WEAKNESS DETECTION
                  </motion.text>
                </svg>

                {/* Status legend for Qliphoth */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 text-[9px] font-mono text-relic-slate">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-600" />
                    Critical
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-orange-600" />
                    High
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    Medium
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    Low
                  </div>
                </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Full-Width Dashboard Below Tree - Settings Style */}
        <div className="space-y-2">
          {/* Unicode divider */}
          <div className="text-relic-mist text-[8px] font-mono">
            ─────────────────────────────────────────────────────────────────
          </div>

          {/* Selected Sefirah Detail - Raw Text Style */}
          <AnimatePresence mode="wait">
            {selectedSefirah !== null && (
              <motion.div
                key={selectedSefirah}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-white border-y border-relic-mist px-2 py-1.5"
                data-tooltip-content
              >
                {(() => {
                  const meta = SEPHIROTH_METADATA[selectedSefirah]
                  const activation = activations[selectedSefirah] || 0
                  const color = getColor(selectedSefirah)

                  return (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        {/* Column 1: Name + Pillar */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-[9px] font-mono text-relic-void font-semibold uppercase tracking-wider">
                              {meta.name}
                            </span>
                          </div>
                          <div className="text-[8px] text-relic-silver">{meta.meaning}</div>
                          <div className="text-[7px] mt-0.5 text-relic-slate">
                            {meta.pillar} pillar
                          </div>
                        </div>

                        {/* Column 2: AI Role */}
                        <div>
                          <div className="text-[7px] uppercase text-relic-silver tracking-wider mb-0.5">▸ AI Layer</div>
                          <div className="text-[8px] text-relic-void leading-snug">{meta.aiComputation.split('•')[0].trim()}</div>
                        </div>

                        {/* Column 3: Activation */}
                        <div className="text-right">
                          <div className="text-[9px] font-mono text-relic-slate uppercase tracking-wider mb-0.5">Activation</div>
                          <div className="text-xl font-mono text-relic-void font-bold">{(activation * 100).toFixed(0)}%</div>
                          <div className="w-full h-1 bg-relic-ghost overflow-hidden mt-1">
                            <div
                              className="h-1 transition-all duration-500"
                              style={{
                                width: `${activation * 100}%`,
                                backgroundColor: color
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Topics & Keywords Section */}
                      {keywordData[selectedSefirah]?.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-relic-mist">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[7px] uppercase text-relic-silver tracking-wider">▸ Topics & Keywords</span>
                            <span className="text-[7px] text-relic-silver">({keywordData[selectedSefirah].length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {keywordData[selectedSefirah].map((keyword, idx) => (
                              <span
                                key={`${selectedSefirah}-${keyword}-${idx}`}
                                className="px-1.5 py-0.5 text-[7px] font-mono bg-relic-ghost text-relic-void border border-relic-mist"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* SEFIRAH DETAIL MODAL - Compact Centered */}
      {/* ═══════════════════════════════════════════ */}
      <SefirahDetailModal
        sefirah={modalSefirah}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        lastQueryPerspective={undefined}
        currentWeight={modalSefirah ? (sefirotConfig.sephiroth[modalSefirah] || 0.5) : 0.5}
        onWeightChange={handleSefirahWeightChange}
      />
    </div>
  )
}
