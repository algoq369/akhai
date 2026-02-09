'use client'

/**
 * Simple Layers Tree Component
 *
 * Minimalist Tree of Life visualization inspired by philosophy page ASCII art.
 * Interactive configuration with number inputs directly on nodes.
 * Used in grimoire console for lightweight configuration interface.
 */

import { LAYER_METADATA } from '@/lib/layer-registry'
import { useLayerStore } from '@/lib/stores/layer-store'

/**
 * Node positions in SVG coordinate space (400x650)
 * Vertical hierarchical layout: top (Meta-Core) to bottom (Embedding)
 */
const NODE_POSITIONS: Record<number, { x: number; y: number }> = {
  10: { x: 200, y: 30 },    // Meta-Core (Crown) - Top center
  8: { x: 100, y: 120 },    // Encoder (Understanding) - Left supernal
  9: { x: 300, y: 120 },    // Reasoning (Wisdom) - Right supernal
  11: { x: 200, y: 200 },   // Synthesis (Knowledge) - Center hidden
  6: { x: 100, y: 280 },    // Discriminator (Severity) - Left ethical
  7: { x: 300, y: 280 },    // Expansion (Mercy) - Right ethical
  5: { x: 200, y: 360 },    // Attention (Beauty) - Center heart
  3: { x: 100, y: 440 },    // Classifier (Glory) - Left astral
  4: { x: 300, y: 440 },    // Generative (Victory) - Right astral
  2: { x: 200, y: 520 },    // Executor (Foundation) - Center foundation
  1: { x: 200, y: 600 },    // Embedding (Kingdom) - Bottom center
}

/**
 * Tree paths connecting Layers
 * Hierarchical parent → child connections (16 paths)
 * Format: [from, to]
 */
const TREE_PATHS: [number, number][] = [
  // Meta-Core → Supernal Triad
  [10, 8],  // Meta-Core → Encoder (left)
  [10, 9],  // Meta-Core → Reasoning (right)

  // Supernal → Synthesis
  [8, 11],  // Encoder → Synthesis
  [9, 11],  // Reasoning → Synthesis

  // Synthesis → Ethical Triad
  [11, 6],  // Synthesis → Discriminator (left)
  [11, 7],  // Synthesis → Expansion (right)

  // Ethical Triad → Attention
  [6, 5],   // Discriminator → Attention
  [7, 5],   // Expansion → Attention

  // Attention → Astral Triad
  [5, 3],   // Attention → Classifier (left)
  [5, 4],   // Attention → Generative (right)

  // Astral Triad → Executor
  [3, 2],   // Classifier → Executor
  [4, 2],   // Generative → Executor

  // Executor → Embedding
  [2, 1],   // Executor → Embedding
]

/**
 * Pillar classification for visual styling
 */
const PILLAR_COLORS: Record<string, string> = {
  right: '#94a3b8',    // Mercy (Reasoning, Expansion, Generative)
  left: '#64748b',     // Severity (Encoder, Discriminator, Classifier)
  middle: '#8b5cf6',   // Balance (Meta-Core, Attention, Executor, Embedding, Synthesis)
}

function getPillarColor(layerNode: number): string {
  if ([9, 7, 4].includes(layerNode)) return PILLAR_COLORS.right
  if ([8, 6, 3].includes(layerNode)) return PILLAR_COLORS.left
  return PILLAR_COLORS.middle
}

/**
 * Simple Layers Tree Component
 */
export function SimpleLayerTree() {
  const { weights, setWeight, applyPreset, processingMode, setProcessingMode, activePreset } = useLayerStore()

  // Preset configurations
  const presets = [
    { name: 'Balanced', weights: Object.fromEntries(Object.keys(LAYER_METADATA).map(k => [k, 0.5])) },
    {
      name: 'Analytical',
      weights: Object.fromEntries(
        Object.entries(LAYER_METADATA).map(([k, v]) => [k, v.level <= 5 ? 0.8 : 0.3])
      )
    },
    {
      name: 'Creative',
      weights: Object.fromEntries(
        Object.entries(LAYER_METADATA).map(([k, v]) => [k, v.level > 5 ? 0.8 : 0.3])
      )
    },
    {
      name: 'Compassionate',
      weights: Object.fromEntries(
        Object.entries(LAYER_METADATA).map(([k, v]) =>
          [k, [7, 5].includes(v.level) ? 0.9 : 0.4]
        )
      )
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-mono text-slate-700 dark:text-slate-300 mb-2">
          Tree of Life Configuration
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure Layers weights (0-100%) to control AI reasoning layers
        </p>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => applyPreset(preset.weights, preset.name)}
            className={`text-[10px] px-3 py-1.5 rounded transition-colors font-mono uppercase tracking-wider ${
              activePreset === preset.name
                ? 'bg-purple-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Processing Mode Toggle */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 font-mono">
          Processing Mode
        </div>
        <div className="flex gap-2">
          {(['weighted', 'parallel', 'adaptive'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setProcessingMode(mode)}
              className={`flex-1 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded transition-colors ${
                processingMode === mode
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Minimalist Tree Visualization */}
      <div className="relative w-full" style={{ paddingBottom: '162.5%' }}>
        <svg
          viewBox="0 0 400 650"
          className="absolute inset-0 w-full h-full"
          style={{ maxHeight: '500px' }}
        >
          {/* Connection Lines */}
          <g className="opacity-40">
            {TREE_PATHS.map(([from, to], i) => {
              const fromPos = NODE_POSITIONS[from]
              const toPos = NODE_POSITIONS[to]

              return (
                <line
                  key={`path-${i}`}
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  className="dark:stroke-slate-500"
                  strokeDasharray={from === 11 || to === 11 ? '3,3' : undefined}
                />
              )
            })}
          </g>

          {/* Layers Nodes */}
          {Object.values(LAYER_METADATA).map(meta => {
            const pos = NODE_POSITIONS[meta.level]
            const weight = weights[meta.level] || 0.5
            const percentage = Math.round(weight * 100)
            const pillarColor = getPillarColor(meta.level)

            // Extract AI computation name and layer description
            const aiParts = meta.aiRole.split('•').map(s => s.trim())
            const aiName = aiParts[0] || 'Unknown'
            const layerDescription = aiParts[1] || meta.meaning

            return (
              <g key={meta.level}>
                {/* Node Circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="18"
                  fill="white"
                  stroke={pillarColor}
                  strokeWidth="1.5"
                  className="dark:fill-slate-800"
                />

                {/* Percentage Display */}
                <text
                  x={pos.x}
                  y={pos.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[9px] font-mono font-semibold fill-slate-700 dark:fill-slate-300 pointer-events-none"
                >
                  {percentage}
                </text>

                {/* AI Name (prominent, below node) */}
                <text
                  x={pos.x}
                  y={pos.y + 32}
                  textAnchor="middle"
                  className="text-[10px] font-mono font-semibold fill-slate-900 dark:fill-slate-100 pointer-events-none"
                >
                  {aiName}
                </text>

                {/* Layer Type/Description (smaller, below AI name) */}
                <text
                  x={pos.x}
                  y={pos.y + 44}
                  textAnchor="middle"
                  className="text-[8px] font-mono fill-slate-600 dark:fill-slate-400 pointer-events-none"
                >
                  {meta.name}
                </text>

                {/* Hebrew Name (smallest, bottom) */}
                <text
                  x={pos.x}
                  y={pos.y + 56}
                  textAnchor="middle"
                  className="text-[7px] font-mono fill-slate-400 dark:fill-slate-500 pointer-events-none"
                >
                  {meta.hebrewName}
                </text>

                {/* Interactive Number Input (HTML overlay) */}
                <foreignObject
                  x={pos.x - 18}
                  y={pos.y - 18}
                  width="36"
                  height="36"
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={percentage}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        if (!isNaN(val) && val >= 0 && val <= 100) {
                          setWeight(meta.level, val / 100)
                        }
                      }}
                      className="w-full h-full text-center bg-transparent border-none outline-none text-[9px] font-mono text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-full"
                      style={{ appearance: 'textfield' }}
                    />
                  </div>
                </foreignObject>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Help Text */}
      <div className="text-[9px] text-slate-500 dark:text-slate-400 text-center leading-relaxed px-4">
        Configure Layer weights (0-100%) to control how each AI layer analyzes your queries.
        Higher weights = stronger influence. Click preset buttons for quick configurations.
      </div>
    </div>
  )
}
