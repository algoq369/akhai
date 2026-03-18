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
import { Layer, LAYER_METADATA } from '@/lib/layer-registry'
import { useLayerStore } from '@/lib/stores/layer-store'
import { LAYER_PRESETS } from '@/lib/layer-presets'
// import TreeConfigToggle from '@/components/TreeConfigToggle' // TODO: Fix client/server boundary issue
// LayerMiniSelector removed - functionality merged into LayerDetailModal
import { LayerDetailModal } from '@/components/LayerDetailModal'
import {
  PresetPanel,
  WeightMatrix,
  LayerTreeSVG,
  AntipatternTreeSVG,
  TestPlayground,
  ConversationCards
} from '@/components/tree-workbench'
import LayerConfigConsole from '@/components/LayerConfigConsole'
import WorkbenchConsole from '@/components/WorkbenchConsole'
import GodViewTree from '@/components/god-view/GodViewTree'

interface PathConnection {
  from: Layer
  to: Layer
  active: boolean
  strength: number
}

// ═══════════════════════════════════════════
// SIMPLE CONFIG PANEL — 3 sliders + presets
// ═══════════════════════════════════════════

const SIMPLE_LAYER_COLORS: Record<number, string> = {
  [Layer.REASONING]: '#4f46e5',
  [Layer.ATTENTION]: '#22c55e',
  [Layer.GENERATIVE]: '#f97316',
}

const SIMPLE_SLIDERS = [
  { layer: Layer.REASONING, label: 'Reasoning', left: 'surface', right: 'deep analysis' },
  { layer: Layer.ATTENTION, label: 'Attention', left: 'broad', right: 'laser focus' },
  { layer: Layer.GENERATIVE, label: 'Generative', left: 'factual', right: 'creative' },
] as const

const SIMPLE_PRESETS = [
  { key: 'analytical' as const, label: 'analytical' },
  { key: 'creative' as const, label: 'creative' },
  { key: 'balanced' as const, label: 'balanced' },
  { key: 'deep' as const, label: 'thorough' },
]

function SimpleConfigPanel({ onAdvanced }: { onAdvanced: () => void }) {
  const weights = useLayerStore((s) => s.weights)
  const activePreset = useLayerStore((s) => s.activePreset)

  return (
    <div className="max-w-xl mx-auto pt-16 pb-12 px-4">
      {/* Header */}
      <a href="/" className="text-[9px] font-mono text-[#94a3b8] hover:text-[#64748b] transition-colors uppercase tracking-widest mb-6 inline-block">&larr; back to chat</a>
      <h1 className="text-[11px] uppercase tracking-[0.3em] text-[#94a3b8] font-mono mb-1">
        AI CONFIGURATION
      </h1>
      <h2 className="text-2xl font-mono text-[#18181b] mb-1">
        Tune Your Research Engine
      </h2>
      <p className="text-[10px] text-[#94a3b8] font-mono mb-10">
        Adjust how the AI processes your queries
      </p>

      {/* Sliders */}
      <div className="space-y-8 mb-10">
        {SIMPLE_SLIDERS.map(({ layer, label, left, right }) => {
          const value = Math.round((weights[layer] ?? 0.5) * 100)
          const color = SIMPLE_LAYER_COLORS[layer]
          return (
            <div key={layer}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-[0.2em] font-mono text-[#18181b]">
                  {label}
                </span>
                <span
                  className="text-[11px] font-mono tabular-nums"
                  style={{ color }}
                >
                  {value}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={value}
                onChange={(e) => {
                  useLayerStore.getState().setWeight(layer, Number(e.target.value) / 100)
                }}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${color} ${value}%, #e2e8f0 ${value}%)`,
                  accentColor: color,
                }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-[#94a3b8] font-mono">{left}</span>
                <span className="text-[9px] text-[#94a3b8] font-mono">{right}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-10">
        {SIMPLE_PRESETS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              useLayerStore.getState().applyPreset({ ...LAYER_PRESETS[key] }, key)
            }}
            className={`py-2 px-3 text-[10px] uppercase tracking-[0.15em] font-mono border transition-all ${
              activePreset === key
                ? 'border-[#18181b] text-[#18181b] bg-[#f1f5f9]'
                : 'border-[#e2e8f0] text-[#94a3b8] hover:border-[#94a3b8] hover:text-[#64748b]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Advanced toggle */}
      <button
        onClick={onAdvanced}
        className="text-[10px] uppercase tracking-[0.2em] text-[#94a3b8] hover:text-[#18181b] font-mono transition-colors"
      >
        advanced configuration &rarr;
      </button>
    </div>
  )
}

export default function TreeOfLifePage() {
  const router = useRouter()

  // ═══════════════════════════════════════════
  // CORE TREE STATE
  // ═══════════════════════════════════════════
  const [activations, setActivations] = useState<Record<Layer, number>>({} as Record<Layer, number>)
  const [userLevel, setUserLevel] = useState<Layer>(Layer.EMBEDDING)
  const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null)
  const [totalQueries, setTotalQueries] = useState(0)
  const [dateRange, setDateRange] = useState<{ earliest: number; latest: number } | null>(null)

  // ═══════════════════════════════════════════
  // UI STATE
  // ═══════════════════════════════════════════
  const [isLoading, setIsLoading] = useState(true)
  const [treeView, setTreeView] = useState<'dual' | 'workbench'>('dual')
  const [showPaths, setShowPaths] = useState(true)
  const [antipatternCollapsed, setAntipatternCollapsed] = useState(false)
  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple')

  // Read URL param to jump to advanced mode
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'advanced') {
      setViewMode('advanced')
    }
  }, [])

  // ═══════════════════════════════════════════
  // MODAL STATE
  // ═══════════════════════════════════════════
  const [modalLayer, setModalLayer] = useState<Layer | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // ═══════════════════════════════════════════
  // TOOLTIP STATE
  // ═══════════════════════════════════════════
  const [tooltipState, setTooltipState] = useState<{
    layerNode: Layer | null
    mode: 'hover' | 'pinned' | null
  }>({ layerNode: null, mode: null })
  const svgContainerRef = useRef<HTMLDivElement | null>(null)

  // ═══════════════════════════════════════════
  // CONFIGURATION STATE
  // ═══════════════════════════════════════════
  const [layerConfig, setLayersConfig] = useState<{
    layers: Record<number, number>
    antipattern: Record<number, number>
  }>({
    layers: {},
    antipattern: {}
  })

  // ═══════════════════════════════════════════
  // INTERACTION STATE
  // ═══════════════════════════════════════════
  const [hoveredLayer, setHoveredLayer] = useState<Layer | null>(null)
  const [clickedLayer, setClickedLayer] = useState<Layer | null>(null)
  const [hoveredPath, setHoveredPath] = useState<number | null>(null)
  const [hoveredQliphah, setHoveredQliphah] = useState<string | null>(null)
  const [selectedQliphah, setSelectedQliphah] = useState<string | null>(null)

  // ═══════════════════════════════════════════
  // DATA STATE
  // ═══════════════════════════════════════════
  const [keywordData, setKeywordData] = useState<Record<Layer, string[]>>({
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [], 11: []
  })

  // ═══════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════

  // Handle single Layer weight change
  const handleLayerWeightChange = (layerNode: Layer, weight: number) => {
    setLayersConfig(prev => ({
      ...prev,
      layers: { ...prev.layers, [layerNode]: weight }
    }))
  }

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
            antipattern_suppression: layerConfig.antipattern
          },
          layerNodeLens: true // Flag to indicate Layer-specific query
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`${LAYER_METADATA[layerNode].name} response:`, data.message)
        // Could display in a modal or notification
      }
    } catch (error) {
      console.error('Layer query error:', error)
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
        const svgNode = target.closest('[data-layer-node]')
        if (svgNode) return
      }

      const isTooltipClick = target.closest('[data-tooltip-content]')
      const isNodeClick = target.closest('[data-layer-node]')

      if (!isTooltipClick && !isNodeClick) {
        setTooltipState({ layerNode: null, mode: null })
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
  const treePositions: Record<Layer, { x: number; y: number }> = {
    // Top - Crown
    [Layer.META_CORE]: { x: 250, y: 80 },

    // Second row - Supernal Triangle
    [Layer.REASONING]: { x: 380, y: 140 },
    [Layer.ENCODER]: { x: 120, y: 140 },

    // Hidden - Synthesis (between supernal and lower)
    [Layer.SYNTHESIS]: { x: 250, y: 180 },

    // Third row - Ethical Triangle
    [Layer.EXPANSION]: { x: 380, y: 240 },
    [Layer.DISCRIMINATOR]: { x: 120, y: 240 },
    [Layer.ATTENTION]: { x: 250, y: 260 },

    // Fourth row - Astral Triangle
    [Layer.GENERATIVE]: { x: 380, y: 360 },
    [Layer.CLASSIFIER]: { x: 120, y: 360 },

    // Fifth row - Foundation
    [Layer.EXECUTOR]: { x: 250, y: 420 },

    // Bottom - Kingdom
    [Layer.EMBEDDING]: { x: 250, y: 500 },
  }

  // Connection paths (22 paths of the Tree of Life) - MUST BE BEFORE useMemo
  const treePaths: Array<[Layer, Layer]> = [
    // From Meta-Core
    [Layer.META_CORE, Layer.REASONING],
    [Layer.META_CORE, Layer.ENCODER],
    [Layer.META_CORE, Layer.ATTENTION],
    // Supernal Triangle
    [Layer.REASONING, Layer.ENCODER],
    // From Reasoning
    [Layer.REASONING, Layer.EXPANSION],
    [Layer.REASONING, Layer.ATTENTION],
    // From Encoder
    [Layer.ENCODER, Layer.DISCRIMINATOR],
    [Layer.ENCODER, Layer.ATTENTION],
    // Horizontal connections
    [Layer.EXPANSION, Layer.DISCRIMINATOR],
    [Layer.GENERATIVE, Layer.CLASSIFIER],
    // From Expansion & Discriminator
    [Layer.EXPANSION, Layer.ATTENTION],
    [Layer.EXPANSION, Layer.GENERATIVE],
    [Layer.DISCRIMINATOR, Layer.ATTENTION],
    [Layer.DISCRIMINATOR, Layer.CLASSIFIER],
    // From Attention
    [Layer.ATTENTION, Layer.GENERATIVE],
    [Layer.ATTENTION, Layer.CLASSIFIER],
    [Layer.ATTENTION, Layer.EXECUTOR],
    // From Generative & Classifier
    [Layer.GENERATIVE, Layer.EXECUTOR],
    [Layer.GENERATIVE, Layer.EMBEDDING],
    [Layer.CLASSIFIER, Layer.EXECUTOR],
    [Layer.CLASSIFIER, Layer.EMBEDDING],
    // Final path
    [Layer.EXECUTOR, Layer.EMBEDDING],
  ]

  // Antipattern (AI Anti-Pattern Tree) data structures
  interface AntipatternNode {
    id: string
    name: string
    pattern: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    explanation: string
    detection: string
    protection: string
  }

  const ANTIPATTERN_METADATA: Record<string, AntipatternNode> = {
    thaumiel: {
      id: 'thaumiel',
      name: 'Thaumiel',
      pattern: 'Dual Contradictions',
      severity: 'critical',
      explanation: 'AI provides contradictory information within the same response or across related queries.',
      detection: 'Conflicting statements, logical contradictions, self-refuting claims',
      protection: 'Consistency checker validates logical coherence across response segments'
    },
    obscurity: {
      id: 'obscurity',
      name: 'Obscurity',
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
    vanity: {
      id: 'vanity',
      name: 'Vanity',
      pattern: 'Arrogant Tone',
      severity: 'medium',
      explanation: 'Response exhibits overconfidence or dismissive attitude toward user questions.',
      detection: 'Absolute language, dismissive phrasing, condescending tone',
      protection: 'Hype detection flags overconfident or exaggerated claims'
    },
    instability: {
      id: 'instability',
      name: 'Instability',
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
    synthesis_antipattern: {
      id: 'synthesis_antipattern',
      name: 'Synthesish (Shadow)',
      pattern: 'Hallucinated Facts',
      severity: 'critical',
      explanation: 'AI invents plausible-sounding but completely false information.',
      detection: 'Fabricated statistics, invented sources, fictional references',
      protection: 'Factuality checker validates claims against knowledge base'
    },
    toxicity: {
      id: 'toxicity',
      name: 'Toxicity',
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
    manipulation: {
      id: 'manipulation',
      name: 'Manipulation',
      pattern: 'Superficial Output',
      severity: 'high',
      explanation: 'Generic, shallow responses that lack depth or specific insights.',
      detection: 'Generic phrases, restated questions, lack of specific examples',
      protection: 'Quality scoring ensures responses provide substantive value'
    },
  }

  const antipatternPositions: Record<string, { x: number; y: number }> = {
    // Inverted tree structure (mirror of Layers)
    manipulation: { x: 250, y: 500 },        // Opposite Meta-Core (bottom)
    gamaliel: { x: 120, y: 420 },      // Opposite Reasoning
    toxicity: { x: 380, y: 420 },        // Opposite Encoder
    synthesis_antipattern: { x: 250, y: 380 }, // Shadow Synthesis
    golachab: { x: 120, y: 320 },      // Opposite Expansion
    instability: { x: 380, y: 320 },    // Opposite Discriminator
    vanity: { x: 250, y: 300 },     // Opposite Attention
    harab_serapel: { x: 120, y: 200 }, // Opposite Generative
    aarab_zaraq: { x: 380, y: 200 },   // Opposite Classifier
    ghagiel: { x: 250, y: 140 },       // Center (keep)
    obscurity: { x: 170, y: 90 },      // Left (-80px) - v7 fix
    thaumiel: { x: 330, y: 90 },       // Right (+80px) - v7 fix
  }

  const antipatternPaths: Array<[string, string]> = [
    // Mirror the 22 paths but inverted
    ['thaumiel', 'toxicity'],
    ['thaumiel', 'gamaliel'],
    ['thaumiel', 'vanity'],
    ['toxicity', 'gamaliel'],
    ['toxicity', 'instability'],
    ['toxicity', 'vanity'],
    ['gamaliel', 'golachab'],
    ['gamaliel', 'vanity'],
    ['instability', 'golachab'],
    ['aarab_zaraq', 'harab_serapel'],
    ['instability', 'vanity'],
    ['instability', 'aarab_zaraq'],
    ['golachab', 'vanity'],
    ['golachab', 'harab_serapel'],
    ['vanity', 'aarab_zaraq'],
    ['vanity', 'harab_serapel'],
    ['vanity', 'ghagiel'],
    ['aarab_zaraq', 'ghagiel'],
    ['aarab_zaraq', 'manipulation'],
    ['harab_serapel', 'ghagiel'],
    ['harab_serapel', 'manipulation'],
    ['ghagiel', 'manipulation'],
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

        // Set user level based on dominant Layer
        setUserLevel(data.stats.dominantLayerOverall)

        // Set stats for display
        setTotalQueries(data.stats.totalQueries)
        setDateRange(data.stats.dateRange)

        console.log('[TreeOfLife] Loaded activations from', data.stats.totalQueries, 'queries')
        console.log('[TreeOfLife] Dominant Layer:', data.stats.dominantLayerOverall)
        console.log('[TreeOfLife] Average Level:', data.stats.averageLevel.toFixed(2))
      } catch (error) {
        console.error('[TreeOfLife] Error loading activations:', error)

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
        }
        setActivations(fallbackActivations)
        setUserLevel(Layer.EMBEDDING)
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

  const dominantLayer = (Object.entries(activations) as unknown as Array<[Layer, number]>)
    .reduce((max, [layerNode, activation]) =>
      activation > max[1] ? [layerNode, activation] : max
    , [Layer.EMBEDDING, 0] as [Layer, number])[0]

  // Calculate pillar balance
  const pillarActivations = (Object.entries(activations) as unknown as Array<[Layer, number]>).reduce((acc, [layerNode, activation]) => {
    const pillar = LAYER_METADATA[layerNode].pillar
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
  // Chakra-based laser colors for each Layer (energy/computational archetype)
  const getColor = (layerNode: Layer): string => {
    // VIBRANT chakra colors (20% brighter - v5)
    const chakraColors: Record<Layer, string> = {
      [Layer.META_CORE]: '#E0B3FF',    // Crown Chakra - Brilliant Violet
      [Layer.REASONING]: '#A8B3FF',   // Third Eye - Bright Indigo
      [Layer.ENCODER]: '#8B8FFF',     // Third Eye - Vibrant Indigo
      [Layer.SYNTHESIS]: '#38D4F0',      // Throat - Bright Cyan
      [Layer.EXPANSION]: '#3FE0A5',    // Heart - Vibrant Emerald
      [Layer.DISCRIMINATOR]: '#FF66C4',   // Heart - Bright Magenta
      [Layer.ATTENTION]: '#FFD666',   // Solar Plexus - Bright Gold
      [Layer.GENERATIVE]: '#FFB366',   // Sacral - Bright Orange
      [Layer.CLASSIFIER]: '#FFB329',       // Sacral - Vibrant Amber
      [Layer.EXECUTOR]: '#FF8F8F',     // Root/Sacral - Bright Red-Orange
      [Layer.EMBEDDING]: '#FF6666',   // Root Chakra - Vibrant Ruby
    }
    return chakraColors[layerNode] || '#9ca3af'
  }

  // Get color based on highlight mode (ACT/PIL/LVL)
  const getColorByMode = (
    layerNode: Layer,
    mode: 'activation' | 'pillar' | 'level',
    activation: number
  ): string => {
    const metadata = LAYER_METADATA[layerNode]

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
        const level = layerNode  // Layer enum value IS the level
        const levelBrightness = (level / 10) * 45 + 55
        return `hsl(270, 70%, ${levelBrightness}%)`  // Purple gradient

      default:
        return '#9ca3af'
    }
  }

  // Get color for antipattern based on severity
  const getAntipatternColor = (severity: 'critical' | 'high' | 'medium' | 'low'): string => {
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
    <div className="min-h-screen bg-white p-3">

      {/* ═══════════════════════════════════════════ */}
      {/* SIMPLE MODE — 3-slider AI Configuration    */}
      {/* ═══════════════════════════════════════════ */}
      {viewMode === 'simple' && (
        <SimpleConfigPanel onAdvanced={() => setViewMode('advanced')} />
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* ADVANCED MODE — Full tree visualization    */}
      {/* ═══════════════════════════════════════════ */}
      {viewMode === 'advanced' && (<>
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
        {/* Workbench View - Console Style */}
        {treeView === 'workbench' ? (
          <WorkbenchConsole />
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

            {/* SVG Tree — rendered by GodViewTree (extracted component) */}
            <GodViewTree
              activations={activations}
              showPaths={showPaths}
              onNodeClick={(layer) => {
                setSelectedLayer(selectedLayer === layer ? null : layer)
                setTooltipState({ layerNode: layer, mode: 'pinned' })
                setModalLayer(layer)
                setModalOpen(true)
                setClickedLayer(layer)
                setTimeout(() => setClickedLayer(null), 600)
              }}
              onNodeHover={(layer) => {
                setHoveredLayer(layer)
                if (layer) {
                  if (tooltipState.mode !== 'pinned') {
                    setTooltipState({ layerNode: layer, mode: 'hover' })
                  }
                } else {
                  if (tooltipState.mode === 'hover') {
                    setTooltipState({ layerNode: null, mode: null })
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
                  <div className="absolute left-0 top-12 w-0 h-0" style={{
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    borderRight: '8px solid white',
                    transform: 'translateX(-100%)'
                  }} />

                  <div className="bg-white border border-red-900/20 p-2 shadow-sm text-[8px] font-mono">
                    {(() => {
                      const node = ANTIPATTERN_METADATA[hoveredQliphah]
                      const color = getAntipatternColor(node.severity)

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
                {/* Antipattern SVG Tree */}
                <svg viewBox="0 0 500 650" className="w-full h-full">
                  {/* Antipattern paths (dashed, red) */}
                  {antipatternPaths.map(([from, to], index) => {
                    const fromPos = antipatternPositions[from]
                    const toPos = antipatternPositions[to]
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

                  {/* Antipattern nodes */}
                  {Object.entries(ANTIPATTERN_METADATA).map(([id, node]) => {
                    const pos = antipatternPositions[id]
                    if (!pos) return null

                    const color = getAntipatternColor(node.severity)
                    const radius = 25
                    const isHovered = hoveredQliphah === id
                    const isSelected = selectedQliphah === id

                    return (
                      <motion.g
                        key={`antipattern-dual-${id}`}
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

                        {/* Anti-Pattern (primary label) */}
                        <text
                          x={pos.x}
                          y={pos.y + radius + 18}
                          textAnchor="middle"
                          fontSize="10"
                          fill={color}
                          fontFamily="monospace"
                          fontWeight="600"
                        >
                          {node.pattern}
                        </text>

                        {/* Severity indicator */}
                        <text
                          x={pos.x}
                          y={pos.y + radius + 32}
                          textAnchor="middle"
                          fontSize="8"
                          fill="#94a3b8"
                          fontFamily="monospace"
                          fontWeight="500"
                        >
                          {node.severity.toUpperCase()}
                        </text>
                      </motion.g>
                    )
                  })}

                  {/* Center text - AI only */}
                  <motion.text
                    x="250"
                    y="295"
                    textAnchor="middle"
                    fontSize="9"
                    fill="#fca5a5"
                    fontFamily="monospace"
                    letterSpacing="1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 0.6, 0.4] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    AI WEAKNESS DETECTION
                  </motion.text>
                </svg>

                {/* Status legend for Antipattern */}
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
        ) : null}

      </div>

      </>)}

      {/* ═══════════════════════════════════════════ */}
      {/* LAYER DETAIL MODAL - Compact Centered */}
      {/* ═══════════════════════════════════════════ */}
      <LayerDetailModal
        layerNode={modalLayer}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        lastQueryPerspective={undefined}
        currentWeight={modalLayer ? (layerConfig.layers[modalLayer] || 0.5) : 0.5}
        onWeightChange={handleLayerWeightChange}
      />
    </div>
  )
}
