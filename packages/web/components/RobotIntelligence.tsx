'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  CpuChipIcon, 
  BoltIcon, 
  EyeIcon,
  HandRaisedIcon,
  CogIcon,
  SignalIcon,
  BeakerIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

// ============================================
// TYPES
// ============================================

interface RobotPart {
  id: string
  name: string
  category: 'core' | 'sensory' | 'motor' | 'cognitive' | 'energy'
  icon: React.ComponentType<{ className?: string }>
  description: string
  status: 'active' | 'developing' | 'planned' | 'offline'
  metrics: {
    efficiency: number
    development: number
    energyConsumption: number
    reliability: number
  }
  subComponents: SubComponent[]
  position: { x: number; y: number; size: 'lg' | 'md' | 'sm' }
  connections: string[]
}

interface SubComponent {
  id: string
  name: string
  status: 'active' | 'developing' | 'planned'
  value: number
  unit: string
}

// ============================================
// ROBOT PART DATA
// ============================================

const robotParts: RobotPart[] = [
  {
    id: 'neural-core',
    name: 'Neural Processing Core',
    category: 'cognitive',
    icon: CpuChipIcon,
    description: 'Central AI reasoning engine with 7 methodology pathways',
    status: 'active',
    metrics: { efficiency: 94, development: 100, energyConsumption: 35, reliability: 98 },
    position: { x: 50, y: 12, size: 'lg' },
    connections: ['grounding-guard', 'side-canal', 'memory-bank'],
    subComponents: [
      { id: 'direct-path', name: 'Direct Pathway', status: 'active', value: 98, unit: '%' },
      { id: 'cod-path', name: 'Chain of Draft', status: 'active', value: 95, unit: '%' },
      { id: 'gtp-path', name: 'GTP Consensus', status: 'active', value: 92, unit: '%' },
      { id: 'react-path', name: 'ReAct Loop', status: 'active', value: 89, unit: '%' },
      { id: 'pot-path', name: 'Program of Thought', status: 'developing', value: 78, unit: '%' },
      { id: 'bot-path', name: 'Buffer of Thoughts', status: 'developing', value: 82, unit: '%' },
      { id: 'auto-router', name: 'Auto Router', status: 'active', value: 96, unit: '%' }
    ]
  },
  {
    id: 'grounding-guard',
    name: 'Grounding Guard System',
    category: 'cognitive',
    icon: EyeIcon,
    description: 'Real-time verification and anti-hallucination shield',
    status: 'active',
    metrics: { efficiency: 91, development: 95, energyConsumption: 18, reliability: 96 },
    position: { x: 25, y: 28, size: 'md' },
    connections: ['neural-core', 'fact-engine'],
    subComponents: [
      { id: 'hype-detect', name: 'Hype Detection', status: 'active', value: 94, unit: '%' },
      { id: 'echo-detect', name: 'Echo Chamber', status: 'active', value: 88, unit: '%' },
      { id: 'drift-detect', name: 'Drift Monitor', status: 'active', value: 91, unit: '%' },
      { id: 'fact-check', name: 'Fact Verification', status: 'active', value: 93, unit: '%' },
      { id: 'bias-scan', name: 'Bias Scanner', status: 'active', value: 87, unit: '%' },
      { id: 'suggest-engine', name: 'Suggestions', status: 'active', value: 95, unit: '%' }
    ]
  },
  {
    id: 'side-canal',
    name: 'Side Canal Context',
    category: 'sensory',
    icon: SignalIcon,
    description: 'Autonomous topic extraction and context injection',
    status: 'active',
    metrics: { efficiency: 88, development: 90, energyConsumption: 12, reliability: 94 },
    position: { x: 75, y: 28, size: 'md' },
    connections: ['neural-core', 'mind-map'],
    subComponents: [
      { id: 'topic-extract', name: 'Topic Extraction', status: 'active', value: 92, unit: '%' },
      { id: 'synopsis-gen', name: 'Synopsis Generator', status: 'active', value: 89, unit: '%' },
      { id: 'suggest-flow', name: 'Suggestion Flow', status: 'active', value: 91, unit: '%' },
      { id: 'context-inject', name: 'Context Injection', status: 'active', value: 88, unit: '%' }
    ]
  },
  {
    id: 'mind-map',
    name: 'Mind Map Visualizer',
    category: 'sensory',
    icon: SparklesIcon,
    description: 'Interactive knowledge graph with D3 visualization',
    status: 'active',
    metrics: { efficiency: 85, development: 88, energyConsumption: 8, reliability: 92 },
    position: { x: 85, y: 48, size: 'sm' },
    connections: ['side-canal', 'memory-bank'],
    subComponents: [
      { id: 'graph-render', name: 'Graph Renderer', status: 'active', value: 94, unit: '%' },
      { id: 'ai-insights', name: 'AI Insights', status: 'active', value: 86, unit: '%' },
      { id: 'table-view', name: 'Table View', status: 'active', value: 95, unit: '%' }
    ]
  },
  {
    id: 'memory-bank',
    name: 'Memory Bank',
    category: 'core',
    icon: BeakerIcon,
    description: 'Long-term knowledge storage and retrieval system',
    status: 'developing',
    metrics: { efficiency: 72, development: 65, energyConsumption: 22, reliability: 85 },
    position: { x: 50, y: 48, size: 'md' },
    connections: ['neural-core', 'mind-map', 'query-engine'],
    subComponents: [
      { id: 'session-mem', name: 'Session Memory', status: 'active', value: 98, unit: '%' },
      { id: 'user-profile', name: 'User Profiles', status: 'developing', value: 45, unit: '%' },
      { id: 'knowledge-base', name: 'Knowledge Base', status: 'planned', value: 15, unit: '%' }
    ]
  },
  {
    id: 'query-engine',
    name: 'Query Processing Engine',
    category: 'motor',
    icon: CogIcon,
    description: 'Request handling and response orchestration',
    status: 'active',
    metrics: { efficiency: 96, development: 98, energyConsumption: 28, reliability: 99 },
    position: { x: 25, y: 48, size: 'md' },
    connections: ['neural-core', 'memory-bank', 'api-gateway'],
    subComponents: [
      { id: 'stream-handler', name: 'Stream Handler', status: 'active', value: 99, unit: '%' },
      { id: 'method-select', name: 'Method Selector', status: 'active', value: 97, unit: '%' },
      { id: 'response-format', name: 'Response Formatter', status: 'active', value: 98, unit: '%' }
    ]
  },
  {
    id: 'api-gateway',
    name: 'API Gateway',
    category: 'motor',
    icon: AdjustmentsHorizontalIcon,
    description: 'External communication and provider routing',
    status: 'active',
    metrics: { efficiency: 94, development: 92, energyConsumption: 15, reliability: 97 },
    position: { x: 15, y: 68, size: 'sm' },
    connections: ['query-engine', 'power-core'],
    subComponents: [
      { id: 'claude-api', name: 'Claude API', status: 'active', value: 100, unit: '%' },
      { id: 'litellm-route', name: 'LiteLLM Router', status: 'developing', value: 60, unit: '%' },
      { id: 'sovereign-api', name: 'Sovereign Models', status: 'planned', value: 10, unit: '%' }
    ]
  },
  {
    id: 'fact-engine',
    name: 'Fact Verification Engine',
    category: 'cognitive',
    icon: ChartBarIcon,
    description: 'External data validation and citation system',
    status: 'developing',
    metrics: { efficiency: 78, development: 70, energyConsumption: 20, reliability: 82 },
    position: { x: 15, y: 38, size: 'sm' },
    connections: ['grounding-guard', 'api-gateway'],
    subComponents: [
      { id: 'source-verify', name: 'Source Verification', status: 'developing', value: 65, unit: '%' },
      { id: 'citation-gen', name: 'Citation Generator', status: 'planned', value: 30, unit: '%' },
      { id: 'confidence-score', name: 'Confidence Scoring', status: 'active', value: 88, unit: '%' }
    ]
  },
  {
    id: 'power-core',
    name: 'Power Management',
    category: 'energy',
    icon: BoltIcon,
    description: 'Resource allocation and cost optimization',
    status: 'active',
    metrics: { efficiency: 89, development: 85, energyConsumption: 5, reliability: 95 },
    position: { x: 50, y: 75, size: 'md' },
    connections: ['api-gateway', 'neural-core'],
    subComponents: [
      { id: 'cost-track', name: 'Cost Tracking', status: 'active', value: 95, unit: '%' },
      { id: 'model-route', name: 'Model Routing', status: 'active', value: 90, unit: '%' },
      { id: 'cache-layer', name: 'Response Cache', status: 'developing', value: 55, unit: '%' }
    ]
  },
  {
    id: 'legend-mode',
    name: 'Legend Mode Engine',
    category: 'cognitive',
    icon: SparklesIcon,
    description: 'Premium R&D tier with Claude Opus 4.5',
    status: 'active',
    metrics: { efficiency: 98, development: 95, energyConsumption: 45, reliability: 99 },
    position: { x: 85, y: 68, size: 'sm' },
    connections: ['neural-core', 'power-core'],
    subComponents: [
      { id: 'opus-engine', name: 'Opus 4.5 Engine', status: 'active', value: 100, unit: '%' },
      { id: 'style-enhance', name: 'Style Enhancement', status: 'active', value: 92, unit: '%' },
      { id: 'depth-analysis', name: 'Deep Analysis', status: 'active', value: 96, unit: '%' }
    ]
  }
]

// ============================================
// STATUS COLORS
// ============================================

const statusColors = {
  active: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-400', glow: 'shadow-emerald-500/30' },
  developing: { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-400', glow: 'shadow-amber-500/30' },
  planned: { bg: 'bg-slate-400', text: 'text-slate-500', border: 'border-slate-300', glow: 'shadow-slate-500/20' },
  offline: { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-400', glow: 'shadow-red-500/30' }
}

const categoryColors = {
  core: 'from-violet-500 to-purple-600',
  sensory: 'from-cyan-500 to-blue-600',
  motor: 'from-emerald-500 to-teal-600',
  cognitive: 'from-amber-500 to-orange-600',
  energy: 'from-rose-500 to-pink-600'
}

// ============================================
// COMPONENT: Robot Part Node
// ============================================

interface RobotPartNodeProps {
  part: RobotPart
  isSelected: boolean
  isHovered: boolean
  onSelect: (part: RobotPart) => void
  onHover: (partId: string | null) => void
  scale: 'human' | 'handball'
}

function RobotPartNode({ part, isSelected, isHovered, onSelect, onHover, scale }: RobotPartNodeProps) {
  const Icon = part.icon
  const status = statusColors[part.status]
  const category = categoryColors[part.category]
  
  const sizeClasses = {
    lg: scale === 'human' ? 'w-28 h-28' : 'w-20 h-20',
    md: scale === 'human' ? 'w-22 h-22' : 'w-16 h-16',
    sm: scale === 'human' ? 'w-18 h-18' : 'w-12 h-12'
  }
  
  const iconSizes = {
    lg: scale === 'human' ? 'w-10 h-10' : 'w-7 h-7',
    md: scale === 'human' ? 'w-8 h-8' : 'w-5 h-5',
    sm: scale === 'human' ? 'w-6 h-6' : 'w-4 h-4'
  }
  
  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300"
      style={{ 
        left: `${part.position.x}%`, 
        top: `${part.position.y}%`,
        zIndex: isSelected ? 50 : isHovered ? 40 : 10
      }}
      onClick={() => onSelect(part)}
      onMouseEnter={() => onHover(part.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Pulse ring for active parts */}
      {part.status === 'active' && (
        <div className={`absolute inset-0 ${sizeClasses[part.position.size]} rounded-full ${status.bg} opacity-20 animate-ping`} 
          style={{ animationDuration: '2s' }} 
        />
      )}
      
      {/* Main node */}
      <div className={`
        relative ${sizeClasses[part.position.size]} rounded-full
        bg-gradient-to-br ${category}
        flex items-center justify-center
        shadow-lg ${isSelected ? 'shadow-2xl scale-110' : ''} ${status.glow}
        border-2 ${isSelected ? 'border-white' : status.border}
        transition-all duration-300
        ${isHovered && !isSelected ? 'scale-105' : ''}
      `}>
        <Icon className={`${iconSizes[part.position.size]} text-white`} />
        
        {/* Status indicator */}
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${status.bg} rounded-full border-2 border-white`} />
        
        {/* Energy consumption indicator (small arc) */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="46"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="4"
          />
          <circle
            cx="50" cy="50" r="46"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="4"
            strokeDasharray={`${part.metrics.efficiency * 2.9} 290`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
      </div>
      
      {/* Hover tooltip */}
      {(isHovered || isSelected) && (
        <div className={`
          absolute top-full mt-2 left-1/2 transform -translate-x-1/2
          bg-slate-900/95 backdrop-blur-sm text-white
          px-3 py-2 rounded-lg shadow-xl
          text-xs whitespace-nowrap z-50
          border border-slate-700
          ${scale === 'handball' ? 'text-[10px] px-2 py-1' : ''}
        `}>
          <div className="font-semibold">{part.name}</div>
          <div className={`${status.text} text-[10px] capitalize`}>{part.status}</div>
          <div className="flex items-center gap-2 mt-1 text-slate-400">
            <span>⚡ {part.metrics.energyConsumption}%</span>
            <span>📊 {part.metrics.efficiency}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// COMPONENT: Connection Lines
// ============================================

function ConnectionLines({ parts, selectedPartId, hoveredPartId, scale }: { 
  parts: RobotPart[]
  selectedPartId: string | null
  hoveredPartId: string | null
  scale: 'human' | 'handball'
}) {
  const paths: React.ReactElement[] = []
  
  parts.forEach(part => {
    part.connections.forEach(targetId => {
      const target = parts.find(p => p.id === targetId)
      if (!target) return
      
      const isHighlighted = selectedPartId === part.id || selectedPartId === targetId ||
                           hoveredPartId === part.id || hoveredPartId === targetId
      
      const x1 = part.position.x
      const y1 = part.position.y
      const x2 = target.position.x
      const y2 = target.position.y
      
      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2
      
      // Add slight curve
      const curveOffset = Math.abs(x2 - x1) > Math.abs(y2 - y1) ? 5 : 0
      
      paths.push(
        <g key={`${part.id}-${targetId}`}>
          {isHighlighted && (
            <path
              d={`M ${x1} ${y1} Q ${midX} ${midY + curveOffset} ${x2} ${y2}`}
              fill="none"
              stroke="#3B82F6"
              strokeWidth={scale === 'human' ? 4 : 2}
              opacity={0.3}
            />
          )}
          <path
            d={`M ${x1} ${y1} Q ${midX} ${midY + curveOffset} ${x2} ${y2}`}
            fill="none"
            stroke={isHighlighted ? '#3B82F6' : '#64748B'}
            strokeWidth={scale === 'human' ? 2 : 1}
            strokeDasharray={isHighlighted ? 'none' : '4 4'}
            opacity={isHighlighted ? 1 : 0.4}
            className="transition-all duration-300"
          />
          {/* Data flow animation */}
          {isHighlighted && (
            <circle r={scale === 'human' ? 3 : 2} fill="#3B82F6">
              <animateMotion
                dur="2s"
                repeatCount="indefinite"
                path={`M ${x1} ${y1} Q ${midX} ${midY + curveOffset} ${x2} ${y2}`}
              />
            </circle>
          )}
        </g>
      )
    })
  })
  
  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none" 
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {paths}
    </svg>
  )
}

// ============================================
// COMPONENT: Details Panel
// ============================================

function DetailsPanel({ part, onClose }: { part: RobotPart; onClose: () => void }) {
  const status = statusColors[part.status]
  const Icon = part.icon
  
  return (
    <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className={`bg-gradient-to-r ${categoryColors[part.category]} px-5 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{part.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} text-white capitalize`}>
                {part.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
      
      {/* Description */}
      <div className="px-5 py-3 border-b border-slate-700">
        <p className="text-sm text-slate-300">{part.description}</p>
      </div>
      
      {/* Metrics Grid */}
      <div className="px-5 py-4 grid grid-cols-2 gap-3 border-b border-slate-700">
        {[
          { label: 'Efficiency', value: part.metrics.efficiency, color: 'emerald' },
          { label: 'Development', value: part.metrics.development, color: 'blue' },
          { label: 'Energy Use', value: part.metrics.energyConsumption, color: 'amber' },
          { label: 'Reliability', value: part.metrics.reliability, color: 'violet' }
        ].map(metric => (
          <div key={metric.label} className="bg-slate-800 rounded-xl p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-400">{metric.label}</span>
              <span className="text-sm font-bold text-white">{metric.value}%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-${metric.color}-500 rounded-full transition-all duration-500`}
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Sub-components */}
      <div className="px-5 py-4">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Sub-Components</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {part.subComponents.map(sub => (
            <div 
              key={sub.id}
              className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusColors[sub.status].bg}`} />
                <span className="text-sm text-slate-300">{sub.name}</span>
              </div>
              <span className="text-sm font-mono text-slate-400">
                {sub.value}{sub.unit}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Connections */}
      <div className="px-5 py-3 bg-slate-800/30 border-t border-slate-700">
        <span className="text-xs text-slate-500">
          Connected to: {part.connections.map(c => 
            robotParts.find(p => p.id === c)?.name
          ).filter(Boolean).join(', ')}
        </span>
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

interface RobotIntelligenceProps {
  initialScale?: 'human' | 'handball'
  embedded?: boolean
  showToggle?: boolean
  onPartSelect?: (part: RobotPart | null) => void
  theme?: 'light' | 'dark'
}

export default function RobotIntelligence({
  initialScale = 'human',
  embedded = false,
  showToggle = true,
  onPartSelect,
  theme = 'dark'
}: RobotIntelligenceProps = {}) {
  const [selectedPart, setSelectedPart] = useState<RobotPart | null>(null)
  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null)
  const [scale, setScale] = useState<'human' | 'handball'>(initialScale)
  const [showStats, setShowStats] = useState(true)

  const handlePartSelect = (part: RobotPart | null) => {
    setSelectedPart(part)
    onPartSelect?.(part)
  }
  
  // Calculate overall stats
  const overallStats = {
    totalParts: robotParts.length,
    activeParts: robotParts.filter(p => p.status === 'active').length,
    avgEfficiency: Math.round(robotParts.reduce((acc, p) => acc + p.metrics.efficiency, 0) / robotParts.length),
    totalEnergy: robotParts.reduce((acc, p) => acc + p.metrics.energyConsumption, 0),
    avgDevelopment: Math.round(robotParts.reduce((acc, p) => acc + p.metrics.development, 0) / robotParts.length)
  }
  
  const containerClass = theme === 'light'
    ? embedded
      ? "h-full bg-white text-relic-slate rounded-lg"
      : "min-h-screen bg-white text-relic-slate"
    : embedded
      ? "h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-lg"
      : "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white"

  return (
    <div className={containerClass}>
      {/* Header */}
      {!embedded && (
        <div className="px-8 py-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-violet-500/30">
                <CpuChipIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Robot Intelligence Architecture</h1>
                <p className="text-slate-400">AkhAI Neural Development System</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {showToggle && (
                <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-1">
                  <button
                    onClick={() => setScale('human')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      scale === 'human'
                        ? 'bg-violet-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Human Size
                  </button>
                  <button
                    onClick={() => setScale('handball')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      scale === 'handball'
                        ? 'bg-violet-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Compact
                  </button>
                </div>
              )}

              {/* Stats toggle */}
              <button
                onClick={() => setShowStats(!showStats)}
                className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
              >
                <ChartBarIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex h-[calc(100vh-100px)]">
        {/* Robot Visualization */}
        <div className="flex-1 relative p-8">
          {/* Grid background */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(148,163,184,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(148,163,184,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          />
          
          {/* Robot body outline */}
          <div className={`
            relative mx-auto
            ${scale === 'human' ? 'w-[600px] h-[700px]' : 'w-[400px] h-[450px]'}
            transition-all duration-500
          `}>
            {/* Body silhouette */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-800/30 to-slate-800/10 rounded-[40%_40%_35%_35%] border border-slate-700/30" />
            
            {/* Connection lines */}
            <ConnectionLines 
              parts={robotParts}
              selectedPartId={selectedPart?.id || null}
              hoveredPartId={hoveredPartId}
              scale={scale}
            />
            
            {/* Robot parts */}
            {robotParts.map(part => (
              <RobotPartNode
                key={part.id}
                part={part}
                isSelected={selectedPart?.id === part.id}
                isHovered={hoveredPartId === part.id}
                onSelect={handlePartSelect}
                onHover={setHoveredPartId}
                scale={scale}
              />
            ))}
          </div>
          
          {/* Legend */}
          <div className="absolute bottom-8 left-8 flex items-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Developing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400" />
              <span>Planned</span>
            </div>
          </div>
        </div>
        
        {/* Side Panel */}
        <div className="w-96 border-l border-slate-800 p-6 overflow-y-auto">
          {selectedPart ? (
            <DetailsPanel 
              part={selectedPart} 
              onClose={() => setSelectedPart(null)} 
            />
          ) : (
            <div className="space-y-6">
              {/* Overview stats */}
              {showStats && (
                <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                  <h3 className="text-lg font-semibold mb-4">System Overview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-400">{overallStats.activeParts}/{overallStats.totalParts}</div>
                      <div className="text-xs text-slate-400">Active Systems</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">{overallStats.avgEfficiency}%</div>
                      <div className="text-xs text-slate-400">Avg Efficiency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-amber-400">{overallStats.totalEnergy}%</div>
                      <div className="text-xs text-slate-400">Total Energy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-violet-400">{overallStats.avgDevelopment}%</div>
                      <div className="text-xs text-slate-400">Development</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Component list */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-400 px-2">All Components</h3>
                {robotParts.map(part => {
                  const Icon = part.icon
                  const status = statusColors[part.status]
                  return (
                    <button
                      key={part.id}
                      onClick={() => setSelectedPart(part)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl
                        bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/50
                        transition-all duration-200
                        ${hoveredPartId === part.id ? 'border-blue-500/50' : ''}
                      `}
                      onMouseEnter={() => setHoveredPartId(part.id)}
                      onMouseLeave={() => setHoveredPartId(null)}
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${categoryColors[part.category]}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{part.name}</div>
                        <div className="text-xs text-slate-500">{part.metrics.efficiency}% efficiency</div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${status.bg}`} />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
