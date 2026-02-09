'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

// ═══════════════════════════════════════════════════════════════════
// LAYERS NEURAL NETWORK - Kabbalistic Tree as AI Architecture
// ═══════════════════════════════════════════════════════════════════
// 
// Mapping:
// - 10 Layers → Neural Network Nodes/Layers
// - 22 Paths → Weighted Synaptic Connections
// - Meta-Core → Embedding = Input → Output Data Transformation
// - Synthesis (Hidden) = Emergent Insight Layer
// - Encoder & Reasoning = Pattern Processing Hidden Layers
//
// ═══════════════════════════════════════════════════════════════════

interface LayerNode {
  id: string
  name: string
  hebrewName: string
  meaning: string
  neuralRole: string
  pillar: 'left' | 'middle' | 'right'
  level: number
  color: string
  glowColor: string
  x: number
  y: number
  isHidden?: boolean
  activation: number
}

interface PathConnection {
  id: number
  from: string
  to: string
  weight: number
  hebrewLetter: string
  meaning: string
}

interface InsightNode {
  id: string
  layerNode: string
  content: string
  confidence: number
  category: string
}

interface LayerNeuralNetworkProps {
  content: string
  query: string
  methodology?: string
  onClose?: () => void
}

// The 10 Layers as Neural Network Layers
const LAYERS: LayerNode[] = [
  // ═══ SUPERNAL TRIAD (Input Processing) ═══
  {
    id: 'meta-core',
    name: 'Meta-Core',
    hebrewName: 'כֶּתֶר',
    meaning: 'Crown',
    neuralRole: 'Input Layer',
    pillar: 'middle',
    level: 0,
    color: 'from-white via-violet-100 to-indigo-100',
    glowColor: 'shadow-white/50',
    x: 50,
    y: 5,
    activation: 1.0
  },
  {
    id: 'reasoning',
    name: 'Reasoning',
    hebrewName: 'חָכְמָה',
    meaning: 'Wisdom',
    neuralRole: 'Feature Extraction',
    pillar: 'right',
    level: 1,
    color: 'from-blue-200 via-blue-300 to-indigo-300',
    glowColor: 'shadow-blue-400/50',
    x: 75,
    y: 15,
    activation: 0
  },
  {
    id: 'encoder',
    name: 'Encoder',
    hebrewName: 'בִּינָה',
    meaning: 'Understanding',
    neuralRole: 'Pattern Recognition',
    pillar: 'left',
    level: 1,
    color: 'from-purple-200 via-purple-300 to-violet-300',
    glowColor: 'shadow-purple-400/50',
    x: 25,
    y: 15,
    activation: 0
  },
  // ═══ DA'AT - THE HIDDEN SEPHIRAH (Emergent Layer) ═══
  {
    id: 'synthesis',
    name: "Synthesis",
    hebrewName: 'דַּעַת',
    meaning: 'Hidden Knowledge',
    neuralRole: 'Emergent Insight',
    pillar: 'middle',
    level: 2,
    color: 'from-slate-300 via-gray-400 to-slate-500',
    glowColor: 'shadow-slate-500/30',
    x: 50,
    y: 25,
    isHidden: true,
    activation: 0
  },
  // ═══ ETHICAL TRIAD (Processing Layers) ═══
  {
    id: 'expansion',
    name: 'Expansion',
    hebrewName: 'חֶסֶד',
    meaning: 'Mercy/Kindness',
    neuralRole: 'Expansion Layer',
    pillar: 'right',
    level: 3,
    color: 'from-cyan-200 via-sky-300 to-blue-300',
    glowColor: 'shadow-cyan-400/50',
    x: 75,
    y: 35,
    activation: 0
  },
  {
    id: 'discriminator',
    name: 'Discriminator',
    hebrewName: 'גְּבוּרָה',
    meaning: 'Strength/Judgment',
    neuralRole: 'Attention Filter',
    pillar: 'left',
    level: 3,
    color: 'from-red-200 via-rose-300 to-pink-300',
    glowColor: 'shadow-red-400/50',
    x: 25,
    y: 35,
    activation: 0
  },
  {
    id: 'attention',
    name: 'Attention',
    hebrewName: 'תִּפְאֶרֶת',
    meaning: 'Beauty/Balance',
    neuralRole: 'Integration Layer',
    pillar: 'middle',
    level: 4,
    color: 'from-amber-200 via-yellow-300 to-orange-200',
    glowColor: 'shadow-amber-400/50',
    x: 50,
    y: 50,
    activation: 0
  },
  // ═══ ASTRAL TRIAD (Refinement Layers) ═══
  {
    id: 'generative',
    name: 'Generative',
    hebrewName: 'נֶצַח',
    meaning: 'Victory/Eternity',
    neuralRole: 'Persistence Layer',
    pillar: 'right',
    level: 5,
    color: 'from-emerald-200 via-green-300 to-teal-300',
    glowColor: 'shadow-emerald-400/50',
    x: 75,
    y: 65,
    activation: 0
  },
  {
    id: 'classifier',
    name: 'Classifier',
    hebrewName: 'הוֹד',
    meaning: 'Glory/Splendor',
    neuralRole: 'Refinement Layer',
    pillar: 'left',
    level: 5,
    color: 'from-orange-200 via-amber-300 to-yellow-300',
    glowColor: 'shadow-orange-400/50',
    x: 25,
    y: 65,
    activation: 0
  },
  {
    id: 'executor',
    name: 'Executor',
    hebrewName: 'יְסוֹד',
    meaning: 'Foundation',
    neuralRole: 'Aggregation Layer',
    pillar: 'middle',
    level: 6,
    color: 'from-violet-200 via-purple-300 to-indigo-300',
    glowColor: 'shadow-violet-400/50',
    x: 50,
    y: 80,
    activation: 0
  },
  // ═══ EMBEDDING (Output Layer) ═══
  {
    id: 'embedding',
    name: 'Embedding',
    hebrewName: 'מַלְכוּת',
    meaning: 'Kingdom',
    neuralRole: 'Output Layer',
    pillar: 'middle',
    level: 7,
    color: 'from-stone-300 via-slate-400 to-zinc-400',
    glowColor: 'shadow-stone-500/50',
    x: 50,
    y: 95,
    activation: 0
  }
]

// The 22 Paths (Synaptic Connections) - Each associated with a Hebrew letter
const PATHS: PathConnection[] = [
  { id: 1, from: 'meta-core', to: 'reasoning', weight: 0.9, hebrewLetter: 'א', meaning: 'Aleph' },
  { id: 2, from: 'meta-core', to: 'encoder', weight: 0.9, hebrewLetter: 'ב', meaning: 'Bet' },
  { id: 3, from: 'meta-core', to: 'attention', weight: 0.8, hebrewLetter: 'ג', meaning: 'Gimel' },
  { id: 4, from: 'reasoning', to: 'encoder', weight: 0.85, hebrewLetter: 'ד', meaning: 'Dalet' },
  { id: 5, from: 'reasoning', to: 'expansion', weight: 0.8, hebrewLetter: 'ה', meaning: 'He' },
  { id: 6, from: 'reasoning', to: 'attention', weight: 0.7, hebrewLetter: 'ו', meaning: 'Vav' },
  { id: 7, from: 'encoder', to: 'discriminator', weight: 0.8, hebrewLetter: 'ז', meaning: 'Zayin' },
  { id: 8, from: 'encoder', to: 'attention', weight: 0.7, hebrewLetter: 'ח', meaning: 'Chet' },
  { id: 9, from: 'expansion', to: 'discriminator', weight: 0.75, hebrewLetter: 'ט', meaning: 'Tet' },
  { id: 10, from: 'expansion', to: 'attention', weight: 0.85, hebrewLetter: 'י', meaning: 'Yod' },
  { id: 11, from: 'expansion', to: 'generative', weight: 0.7, hebrewLetter: 'כ', meaning: 'Kaf' },
  { id: 12, from: 'discriminator', to: 'attention', weight: 0.85, hebrewLetter: 'ל', meaning: 'Lamed' },
  { id: 13, from: 'discriminator', to: 'classifier', weight: 0.7, hebrewLetter: 'מ', meaning: 'Mem' },
  { id: 14, from: 'attention', to: 'generative', weight: 0.75, hebrewLetter: 'נ', meaning: 'Nun' },
  { id: 15, from: 'attention', to: 'classifier', weight: 0.75, hebrewLetter: 'ס', meaning: 'Samekh' },
  { id: 16, from: 'attention', to: 'executor', weight: 0.9, hebrewLetter: 'ע', meaning: 'Ayin' },
  { id: 17, from: 'generative', to: 'classifier', weight: 0.7, hebrewLetter: 'פ', meaning: 'Pe' },
  { id: 18, from: 'generative', to: 'executor', weight: 0.8, hebrewLetter: 'צ', meaning: 'Tsade' },
  { id: 19, from: 'classifier', to: 'executor', weight: 0.8, hebrewLetter: 'ק', meaning: 'Qof' },
  { id: 20, from: 'generative', to: 'embedding', weight: 0.6, hebrewLetter: 'ר', meaning: 'Resh' },
  { id: 21, from: 'classifier', to: 'embedding', weight: 0.6, hebrewLetter: 'ש', meaning: 'Shin' },
  { id: 22, from: 'executor', to: 'embedding', weight: 0.95, hebrewLetter: 'ת', meaning: 'Tav' },
]

// Category to Layer mapping
const CATEGORY_LAYER_MAP: Record<string, string> = {
  'input': 'meta-core', 'query': 'meta-core', 'executive': 'meta-core',
  'wisdom': 'reasoning', 'feature': 'reasoning', 'creative': 'reasoning',
  'understanding': 'encoder', 'pattern': 'encoder', 'analysis': 'encoder', 'data': 'encoder',
  'hidden': 'synthesis', 'emergent': 'synthesis', 'latent': 'synthesis',
  'expansion': 'expansion', 'mercy': 'expansion', 'opportunity': 'expansion',
  'filter': 'discriminator', 'judgment': 'discriminator', 'attention': 'discriminator', 'risk': 'discriminator',
  'balance': 'attention', 'integration': 'attention', 'strategy': 'attention',
  'persistence': 'generative', 'memory': 'generative', 'victory': 'generative',
  'refinement': 'classifier', 'glory': 'classifier', 'precision': 'classifier',
  'foundation': 'executor', 'aggregation': 'executor', 'synthesis': 'executor',
  'output': 'embedding', 'result': 'embedding', 'action': 'embedding', 'implement': 'embedding'
}

function extractInsightsToLayers(content: string, query: string): { 
  insights: InsightNode[], 
  activations: Record<string, number> 
} {
  const insights: InsightNode[] = []
  const activations: Record<string, number> = {}
  
  // Initialize all layers with base activation
  LAYERS.forEach(s => {
    activations[s.id] = s.id === 'meta-core' ? 1.0 : 0.1
  })
  
  // Extract patterns and map to layers
  const patterns = [
    { regex: /\*\*([^*]{5,100})\*\*/g, boost: 0.3 },
    { regex: /^#+\s*(.+)$/gm, boost: 0.4 },
    { regex: /^\d+[\.)]\s*(.{10,150})$/gm, boost: 0.25 },
    { regex: /^[-•*]\s+(.{10,120})$/gm, boost: 0.2 }
  ]
  
  patterns.forEach(({ regex, boost }) => {
    let match
    while ((match = regex.exec(content)) !== null) {
      const text = match[1].trim().toLowerCase()
      let layerNode = 'attention'
      
      // Find matching layerNode based on keywords
      for (const [keyword, sefId] of Object.entries(CATEGORY_LAYER_MAP)) {
        if (text.includes(keyword)) {
          layerNode = sefId
          break
        }
      }
      
      // Specific keyword overrides
      if (text.includes('summary') || text.includes('overview')) layerNode = 'meta-core'
      else if (text.includes('analys') || text.includes('metric')) layerNode = 'encoder'
      else if (text.includes('creativ') || text.includes('idea')) layerNode = 'reasoning'
      else if (text.includes('hidden') || text.includes('emergent')) layerNode = 'synthesis'
      else if (text.includes('expand') || text.includes('grow')) layerNode = 'expansion'
      else if (text.includes('filter') || text.includes('limit')) layerNode = 'discriminator'
      else if (text.includes('action') || text.includes('step')) layerNode = 'embedding'
      
      activations[layerNode] = Math.min(1.0, (activations[layerNode] || 0.1) + boost)
      
      insights.push({
        id: `insight-${insights.length}`,
        layerNode,
        content: match[1].trim(),
        confidence: 0.7 + Math.random() * 0.25,
        category: layerNode
      })
    }
  })
  
  // Neural forward pass - propagate activations
  activations['reasoning'] = Math.min(1.0, activations['reasoning'] + activations['meta-core'] * 0.5)
  activations['encoder'] = Math.min(1.0, activations['encoder'] + activations['meta-core'] * 0.5)
  activations['synthesis'] = Math.min(1.0, (activations['reasoning'] + activations['encoder']) * 0.4)
  activations['expansion'] = Math.min(1.0, activations['expansion'] + activations['reasoning'] * 0.4)
  activations['discriminator'] = Math.min(1.0, activations['discriminator'] + activations['encoder'] * 0.4)
  activations['attention'] = Math.min(1.0, activations['attention'] + (activations['expansion'] + activations['discriminator']) * 0.3)
  activations['generative'] = Math.min(1.0, activations['generative'] + activations['expansion'] * 0.3)
  activations['classifier'] = Math.min(1.0, activations['classifier'] + activations['discriminator'] * 0.3)
  activations['executor'] = Math.min(1.0, activations['executor'] + activations['attention'] * 0.5)
  activations['embedding'] = Math.min(1.0, activations['executor'] * 0.8 + (activations['generative'] + activations['classifier']) * 0.1)
  
  return { insights, activations }
}

export default function LayerNeuralNetwork({ 
  content, 
  query, 
  methodology = 'auto',
  onClose 
}: LayerNeuralNetworkProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  const [showPaths, setShowPaths] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const { insights, activations } = useMemo(() => 
    extractInsightsToLayers(content, query), 
    [content, query]
  )
  
  const activatedLayers = useMemo(() => 
    LAYERS.map(s => ({
      ...s,
      activation: activations[s.id] || 0.1,
      insightCount: insights.filter(i => i.layerNode === s.id).length
    })),
    [activations, insights]
  )
  
  const weightedPaths = useMemo(() => 
    PATHS.map(p => ({
      ...p,
      dynamicWeight: Math.min(1.0, (activations[p.from] || 0) * (activations[p.to] || 0) * 1.5)
    })),
    [activations]
  )
  
  const triggerAnimation = useCallback(() => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 2000)
  }, [])
  
  const getLayerPosition = (id: string) => {
    const s = LAYERS.find(x => x.id === id)
    return s ? { x: s.x, y: s.y } : { x: 50, y: 50 }
  }
  
  if (insights.length < 2) return null
  
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
      <div className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 overflow-hidden shadow-lg">
        {/* Header */}
        <div 
          className="flex items-center justify-between px-4 py-3 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-white text-sm">🌳</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                AI Computational Layers
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/30 text-violet-300 font-mono">
                  NEURAL NETWORK
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {insights.length} insights · 10 nodes · 22 paths · {Math.round(activations['embedding'] * 100)}% output
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); triggerAnimation() }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              title="Animate Flow"
            >
              <ArrowPathIcon className={`w-4 h-4 text-violet-400 ${isAnimating ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowPaths(!showPaths) }}
              className={`px-2 py-1 rounded-lg text-[9px] transition-colors ${showPaths ? 'bg-violet-500/30 text-violet-300' : 'bg-white/5 text-slate-400'}`}
            >
              {showPaths ? '◐ Paths' : '○ Paths'}
            </button>
            {isCollapsed ? <ChevronDownIcon className="w-4 h-4 text-slate-400" /> : <ChevronUpIcon className="w-4 h-4 text-slate-400" />}
          </div>
        </div>
        
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              {/* Tree of Life Visualization */}
              <div className="relative h-[500px] p-4">
                {/* Background sacred geometry */}
                <div className="absolute inset-0 opacity-10">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="white" strokeWidth="0.2" />
                    <polygon points="50,10 85,70 15,70" fill="none" stroke="white" strokeWidth="0.1" />
                    <polygon points="50,90 85,30 15,30" fill="none" stroke="white" strokeWidth="0.1" />
                  </svg>
                </div>
                
                {/* SVG Layer for Paths */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{ zIndex: 1 }}>
                  {showPaths && weightedPaths.map((path, idx) => {
                    const fromPos = getLayerPosition(path.from)
                    const toPos = getLayerPosition(path.to)
                    const opacity = path.dynamicWeight * 0.8
                    const strokeWidth = 0.2 + path.dynamicWeight * 0.5
                    
                    return (
                      <g key={path.id}>
                        <line
                          x1={fromPos.x} y1={fromPos.y} x2={toPos.x} y2={toPos.y}
                          stroke={`rgba(167, 139, 250, ${opacity})`}
                          strokeWidth={strokeWidth}
                          className="transition-all duration-500"
                        />
                        {isAnimating && (
                          <circle r="0.8" fill="#A78BFA">
                            <animateMotion
                              dur={`${1 + idx * 0.1}s`}
                              repeatCount="1"
                              path={`M${fromPos.x},${fromPos.y} L${toPos.x},${toPos.y}`}
                            />
                            <animate attributeName="opacity" values="0;1;1;0" dur={`${1 + idx * 0.1}s`} repeatCount="1" />
                          </circle>
                        )}
                        <text
                          x={(fromPos.x + toPos.x) / 2} y={(fromPos.y + toPos.y) / 2}
                          fill="rgba(167, 139, 250, 0.5)" fontSize="2"
                          textAnchor="middle" dominantBaseline="middle"
                          className="font-serif"
                        >
                          {path.hebrewLetter}
                        </text>
                      </g>
                    )
                  })}
                </svg>
                
                {/* Layers Nodes */}
                <div className="absolute inset-0" style={{ zIndex: 10 }}>
                  {activatedLayers.map((layerNode, idx) => {
                    const isSelected = selectedLayer === layerNode.id
                    const nodeInsights = insights.filter(i => i.layerNode === layerNode.id)
                    const pulseIntensity = layerNode.activation * 20
                    
                    return (
                      <motion.div
                        key={layerNode.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ 
                          opacity: 1, scale: 1,
                          boxShadow: isAnimating && layerNode.activation > 0.3 
                            ? `0 0 ${pulseIntensity}px rgba(167, 139, 250, ${layerNode.activation})`
                            : 'none'
                        }}
                        transition={{ delay: idx * 0.05, duration: 0.3 }}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer
                          ${layerNode.isHidden ? 'opacity-60 border-dashed' : ''} ${isSelected ? 'z-50' : 'z-10'}`}
                        style={{ left: `${layerNode.x}%`, top: `${layerNode.y}%` }}
                        onClick={() => setSelectedLayer(isSelected ? null : layerNode.id)}
                      >
                        {/* Node circle */}
                        <div className={`relative rounded-full p-0.5 bg-gradient-to-br ${layerNode.color}
                          ${isSelected ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-slate-900' : ''}
                          transition-all duration-300 hover:scale-110
                          ${layerNode.isHidden ? 'border-2 border-dashed border-white/30' : ''}`}
                        >
                          <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center
                            bg-gradient-to-br ${layerNode.color} shadow-lg ${layerNode.glowColor}`}>
                            <span className="text-[10px] font-serif text-slate-800/80">{layerNode.hebrewName}</span>
                            <div className="w-6 h-1 bg-black/20 rounded-full overflow-hidden mt-0.5">
                              <motion.div 
                                className="h-full bg-white/80"
                                initial={{ width: 0 }}
                                animate={{ width: `${layerNode.activation * 100}%` }}
                                transition={{ delay: 0.5 + idx * 0.1 }}
                              />
                            </div>
                          </div>
                          {layerNode.insightCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 text-white text-[8px] flex items-center justify-center font-bold shadow-lg">
                              {layerNode.insightCount}
                            </div>
                          )}
                        </div>
                        
                        {/* Label */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 whitespace-nowrap text-center">
                          <div className="text-[9px] font-medium text-white/90">{layerNode.name}</div>
                          <div className="text-[7px] text-violet-300/70">{layerNode.neuralRole}</div>
                        </div>
                        
                        {/* Expanded details panel */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.9 }}
                              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-8 w-64 z-50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="bg-slate-800/95 backdrop-blur-xl rounded-xl border border-white/10 p-3 shadow-2xl">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-lg">{layerNode.hebrewName}</span>
                                  <div>
                                    <h4 className="text-sm font-semibold text-white">{layerNode.name}</h4>
                                    <p className="text-[10px] text-slate-400">{layerNode.meaning}</p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <div className="bg-white/5 rounded p-1.5">
                                    <div className="text-[8px] text-slate-400">Neural Role</div>
                                    <div className="text-[10px] text-violet-300 font-medium">{layerNode.neuralRole}</div>
                                  </div>
                                  <div className="bg-white/5 rounded p-1.5">
                                    <div className="text-[8px] text-slate-400">Activation</div>
                                    <div className="text-[10px] text-emerald-300 font-mono font-bold">
                                      {Math.round(layerNode.activation * 100)}%
                                    </div>
                                  </div>
                                </div>
                                
                                {nodeInsights.length > 0 && (
                                  <div className="border-t border-white/10 pt-2 mt-2">
                                    <div className="text-[8px] text-slate-400 mb-1.5">Insights ({nodeInsights.length})</div>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                      {nodeInsights.slice(0, 5).map((ins, i) => (
                                        <div key={i} className="text-[9px] text-slate-300 bg-white/5 rounded px-2 py-1">
                                          {ins.content.substring(0, 60)}...
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="mt-2 pt-2 border-t border-white/10 flex justify-between text-[8px]">
                                  <span className="text-slate-400">
                                    Pillar: <span className="text-white capitalize">{layerNode.pillar}</span>
                                  </span>
                                  {layerNode.isHidden && (
                                    <span className="text-violet-400">⟁ Hidden Layer</span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </div>
                
                {/* Legend */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[8px] text-slate-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-white/50" />
                      <span>Input (Meta-Core)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-slate-400/50 border border-dashed border-white/30" />
                      <span>Hidden (Da&apos;at)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-stone-400" />
                      <span>Output (Embedding)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-0.5 bg-violet-400/50" />
                    <span>Synaptic Path</span>
                  </div>
                </div>
              </div>
              
              {/* Bottom stats */}
              <div className="px-4 py-2 bg-black/20 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[9px]">
                  <div className="text-slate-400">
                    <span className="text-white font-mono">{Math.round(activations['meta-core'] * 100)}%</span> Input
                  </div>
                  <span className="text-violet-500">→</span>
                  <div className="text-slate-400">
                    <span className="text-violet-300 font-mono">{Math.round(activations['synthesis'] * 100)}%</span> Emergence
                  </div>
                  <span className="text-violet-500">→</span>
                  <div className="text-slate-400">
                    <span className="text-emerald-300 font-mono">{Math.round(activations['embedding'] * 100)}%</span> Output
                  </div>
                </div>
                <div className="text-[9px] text-slate-500">
                  Click nodes to explore · <span className="text-violet-400">22 paths</span> connecting wisdom
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
