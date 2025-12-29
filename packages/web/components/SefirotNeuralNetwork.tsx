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
// SEFIROT NEURAL NETWORK - Kabbalistic Tree as AI Architecture
// ═══════════════════════════════════════════════════════════════════
// 
// Mapping:
// - 10 Sephiroth → Neural Network Nodes/Layers
// - 22 Paths → Weighted Synaptic Connections
// - Kether → Malkuth = Input → Output Data Transformation
// - Da'at (Hidden) = Emergent Insight Layer
// - Binah & Chokmah = Pattern Processing Hidden Layers
//
// ═══════════════════════════════════════════════════════════════════

interface SefirahNode {
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
  sefirah: string
  content: string
  confidence: number
  category: string
}

interface SefirotNeuralNetworkProps {
  content: string
  query: string
  methodology?: string
  onClose?: () => void
}

// The 10 Sephiroth as Neural Network Layers
const SEPHIROTH: SefirahNode[] = [
  // ═══ SUPERNAL TRIAD (Input Processing) ═══
  {
    id: 'kether',
    name: 'Kether',
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
    id: 'chokmah',
    name: 'Chokmah',
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
    id: 'binah',
    name: 'Binah',
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
    id: 'daat',
    name: "Da'at",
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
    id: 'chesed',
    name: 'Chesed',
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
    id: 'gevurah',
    name: 'Gevurah',
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
    id: 'tiferet',
    name: 'Tiferet',
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
    id: 'netzach',
    name: 'Netzach',
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
    id: 'hod',
    name: 'Hod',
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
    id: 'yesod',
    name: 'Yesod',
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
  // ═══ MALKUTH (Output Layer) ═══
  {
    id: 'malkuth',
    name: 'Malkuth',
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
  { id: 1, from: 'kether', to: 'chokmah', weight: 0.9, hebrewLetter: 'א', meaning: 'Aleph' },
  { id: 2, from: 'kether', to: 'binah', weight: 0.9, hebrewLetter: 'ב', meaning: 'Bet' },
  { id: 3, from: 'kether', to: 'tiferet', weight: 0.8, hebrewLetter: 'ג', meaning: 'Gimel' },
  { id: 4, from: 'chokmah', to: 'binah', weight: 0.85, hebrewLetter: 'ד', meaning: 'Dalet' },
  { id: 5, from: 'chokmah', to: 'chesed', weight: 0.8, hebrewLetter: 'ה', meaning: 'He' },
  { id: 6, from: 'chokmah', to: 'tiferet', weight: 0.7, hebrewLetter: 'ו', meaning: 'Vav' },
  { id: 7, from: 'binah', to: 'gevurah', weight: 0.8, hebrewLetter: 'ז', meaning: 'Zayin' },
  { id: 8, from: 'binah', to: 'tiferet', weight: 0.7, hebrewLetter: 'ח', meaning: 'Chet' },
  { id: 9, from: 'chesed', to: 'gevurah', weight: 0.75, hebrewLetter: 'ט', meaning: 'Tet' },
  { id: 10, from: 'chesed', to: 'tiferet', weight: 0.85, hebrewLetter: 'י', meaning: 'Yod' },
  { id: 11, from: 'chesed', to: 'netzach', weight: 0.7, hebrewLetter: 'כ', meaning: 'Kaf' },
  { id: 12, from: 'gevurah', to: 'tiferet', weight: 0.85, hebrewLetter: 'ל', meaning: 'Lamed' },
  { id: 13, from: 'gevurah', to: 'hod', weight: 0.7, hebrewLetter: 'מ', meaning: 'Mem' },
  { id: 14, from: 'tiferet', to: 'netzach', weight: 0.75, hebrewLetter: 'נ', meaning: 'Nun' },
  { id: 15, from: 'tiferet', to: 'hod', weight: 0.75, hebrewLetter: 'ס', meaning: 'Samekh' },
  { id: 16, from: 'tiferet', to: 'yesod', weight: 0.9, hebrewLetter: 'ע', meaning: 'Ayin' },
  { id: 17, from: 'netzach', to: 'hod', weight: 0.7, hebrewLetter: 'פ', meaning: 'Pe' },
  { id: 18, from: 'netzach', to: 'yesod', weight: 0.8, hebrewLetter: 'צ', meaning: 'Tsade' },
  { id: 19, from: 'hod', to: 'yesod', weight: 0.8, hebrewLetter: 'ק', meaning: 'Qof' },
  { id: 20, from: 'netzach', to: 'malkuth', weight: 0.6, hebrewLetter: 'ר', meaning: 'Resh' },
  { id: 21, from: 'hod', to: 'malkuth', weight: 0.6, hebrewLetter: 'ש', meaning: 'Shin' },
  { id: 22, from: 'yesod', to: 'malkuth', weight: 0.95, hebrewLetter: 'ת', meaning: 'Tav' },
]

// Category to Sefirah mapping
const CATEGORY_SEFIRAH_MAP: Record<string, string> = {
  'input': 'kether', 'query': 'kether', 'executive': 'kether',
  'wisdom': 'chokmah', 'feature': 'chokmah', 'creative': 'chokmah',
  'understanding': 'binah', 'pattern': 'binah', 'analysis': 'binah', 'data': 'binah',
  'hidden': 'daat', 'emergent': 'daat', 'latent': 'daat',
  'expansion': 'chesed', 'mercy': 'chesed', 'opportunity': 'chesed',
  'filter': 'gevurah', 'judgment': 'gevurah', 'attention': 'gevurah', 'risk': 'gevurah',
  'balance': 'tiferet', 'integration': 'tiferet', 'strategy': 'tiferet',
  'persistence': 'netzach', 'memory': 'netzach', 'victory': 'netzach',
  'refinement': 'hod', 'glory': 'hod', 'precision': 'hod',
  'foundation': 'yesod', 'aggregation': 'yesod', 'synthesis': 'yesod',
  'output': 'malkuth', 'result': 'malkuth', 'action': 'malkuth', 'implement': 'malkuth'
}

function extractInsightsToSephiroth(content: string, query: string): { 
  insights: InsightNode[], 
  activations: Record<string, number> 
} {
  const insights: InsightNode[] = []
  const activations: Record<string, number> = {}
  
  // Initialize all sephiroth with base activation
  SEPHIROTH.forEach(s => {
    activations[s.id] = s.id === 'kether' ? 1.0 : 0.1
  })
  
  // Extract patterns and map to sephiroth
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
      let sefirah = 'tiferet'
      
      // Find matching sefirah based on keywords
      for (const [keyword, sefId] of Object.entries(CATEGORY_SEFIRAH_MAP)) {
        if (text.includes(keyword)) {
          sefirah = sefId
          break
        }
      }
      
      // Specific keyword overrides
      if (text.includes('summary') || text.includes('overview')) sefirah = 'kether'
      else if (text.includes('analys') || text.includes('metric')) sefirah = 'binah'
      else if (text.includes('creativ') || text.includes('idea')) sefirah = 'chokmah'
      else if (text.includes('hidden') || text.includes('emergent')) sefirah = 'daat'
      else if (text.includes('expand') || text.includes('grow')) sefirah = 'chesed'
      else if (text.includes('filter') || text.includes('limit')) sefirah = 'gevurah'
      else if (text.includes('action') || text.includes('step')) sefirah = 'malkuth'
      
      activations[sefirah] = Math.min(1.0, (activations[sefirah] || 0.1) + boost)
      
      insights.push({
        id: `insight-${insights.length}`,
        sefirah,
        content: match[1].trim(),
        confidence: 0.7 + Math.random() * 0.25,
        category: sefirah
      })
    }
  })
  
  // Neural forward pass - propagate activations
  activations['chokmah'] = Math.min(1.0, activations['chokmah'] + activations['kether'] * 0.5)
  activations['binah'] = Math.min(1.0, activations['binah'] + activations['kether'] * 0.5)
  activations['daat'] = Math.min(1.0, (activations['chokmah'] + activations['binah']) * 0.4)
  activations['chesed'] = Math.min(1.0, activations['chesed'] + activations['chokmah'] * 0.4)
  activations['gevurah'] = Math.min(1.0, activations['gevurah'] + activations['binah'] * 0.4)
  activations['tiferet'] = Math.min(1.0, activations['tiferet'] + (activations['chesed'] + activations['gevurah']) * 0.3)
  activations['netzach'] = Math.min(1.0, activations['netzach'] + activations['chesed'] * 0.3)
  activations['hod'] = Math.min(1.0, activations['hod'] + activations['gevurah'] * 0.3)
  activations['yesod'] = Math.min(1.0, activations['yesod'] + activations['tiferet'] * 0.5)
  activations['malkuth'] = Math.min(1.0, activations['yesod'] * 0.8 + (activations['netzach'] + activations['hod']) * 0.1)
  
  return { insights, activations }
}

export default function SefirotNeuralNetwork({ 
  content, 
  query, 
  methodology = 'auto',
  onClose 
}: SefirotNeuralNetworkProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedSefirah, setSelectedSefirah] = useState<string | null>(null)
  const [showPaths, setShowPaths] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const { insights, activations } = useMemo(() => 
    extractInsightsToSephiroth(content, query), 
    [content, query]
  )
  
  const activatedSephiroth = useMemo(() => 
    SEPHIROTH.map(s => ({
      ...s,
      activation: activations[s.id] || 0.1,
      insightCount: insights.filter(i => i.sefirah === s.id).length
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
  
  const getSefirahPosition = (id: string) => {
    const s = SEPHIROTH.find(x => x.id === id)
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
                Sefirot Neural Network
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/30 text-violet-300 font-mono">
                  KABBALISTIC AI
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {insights.length} insights · 10 nodes · 22 paths · {Math.round(activations['malkuth'] * 100)}% output
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
                    const fromPos = getSefirahPosition(path.from)
                    const toPos = getSefirahPosition(path.to)
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
                
                {/* Sephiroth Nodes */}
                <div className="absolute inset-0" style={{ zIndex: 10 }}>
                  {activatedSephiroth.map((sefirah, idx) => {
                    const isSelected = selectedSefirah === sefirah.id
                    const nodeInsights = insights.filter(i => i.sefirah === sefirah.id)
                    const pulseIntensity = sefirah.activation * 20
                    
                    return (
                      <motion.div
                        key={sefirah.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ 
                          opacity: 1, scale: 1,
                          boxShadow: isAnimating && sefirah.activation > 0.3 
                            ? `0 0 ${pulseIntensity}px rgba(167, 139, 250, ${sefirah.activation})`
                            : 'none'
                        }}
                        transition={{ delay: idx * 0.05, duration: 0.3 }}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer
                          ${sefirah.isHidden ? 'opacity-60 border-dashed' : ''} ${isSelected ? 'z-50' : 'z-10'}`}
                        style={{ left: `${sefirah.x}%`, top: `${sefirah.y}%` }}
                        onClick={() => setSelectedSefirah(isSelected ? null : sefirah.id)}
                      >
                        {/* Node circle */}
                        <div className={`relative rounded-full p-0.5 bg-gradient-to-br ${sefirah.color}
                          ${isSelected ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-slate-900' : ''}
                          transition-all duration-300 hover:scale-110
                          ${sefirah.isHidden ? 'border-2 border-dashed border-white/30' : ''}`}
                        >
                          <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center
                            bg-gradient-to-br ${sefirah.color} shadow-lg ${sefirah.glowColor}`}>
                            <span className="text-[10px] font-serif text-slate-800/80">{sefirah.hebrewName}</span>
                            <div className="w-6 h-1 bg-black/20 rounded-full overflow-hidden mt-0.5">
                              <motion.div 
                                className="h-full bg-white/80"
                                initial={{ width: 0 }}
                                animate={{ width: `${sefirah.activation * 100}%` }}
                                transition={{ delay: 0.5 + idx * 0.1 }}
                              />
                            </div>
                          </div>
                          {sefirah.insightCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 text-white text-[8px] flex items-center justify-center font-bold shadow-lg">
                              {sefirah.insightCount}
                            </div>
                          )}
                        </div>
                        
                        {/* Label */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 whitespace-nowrap text-center">
                          <div className="text-[9px] font-medium text-white/90">{sefirah.name}</div>
                          <div className="text-[7px] text-violet-300/70">{sefirah.neuralRole}</div>
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
                                  <span className="text-lg">{sefirah.hebrewName}</span>
                                  <div>
                                    <h4 className="text-sm font-semibold text-white">{sefirah.name}</h4>
                                    <p className="text-[10px] text-slate-400">{sefirah.meaning}</p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <div className="bg-white/5 rounded p-1.5">
                                    <div className="text-[8px] text-slate-400">Neural Role</div>
                                    <div className="text-[10px] text-violet-300 font-medium">{sefirah.neuralRole}</div>
                                  </div>
                                  <div className="bg-white/5 rounded p-1.5">
                                    <div className="text-[8px] text-slate-400">Activation</div>
                                    <div className="text-[10px] text-emerald-300 font-mono font-bold">
                                      {Math.round(sefirah.activation * 100)}%
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
                                    Pillar: <span className="text-white capitalize">{sefirah.pillar}</span>
                                  </span>
                                  {sefirah.isHidden && (
                                    <span className="text-violet-400">⟁ Hidden Sefirah</span>
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
                      <span>Input (Kether)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-slate-400/50 border border-dashed border-white/30" />
                      <span>Hidden (Da&apos;at)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-stone-400" />
                      <span>Output (Malkuth)</span>
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
                    <span className="text-white font-mono">{Math.round(activations['kether'] * 100)}%</span> Input
                  </div>
                  <span className="text-violet-500">→</span>
                  <div className="text-slate-400">
                    <span className="text-violet-300 font-mono">{Math.round(activations['daat'] * 100)}%</span> Emergence
                  </div>
                  <span className="text-violet-500">→</span>
                  <div className="text-slate-400">
                    <span className="text-emerald-300 font-mono">{Math.round(activations['malkuth'] * 100)}%</span> Output
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
