'use client'

import { useState } from 'react'

interface ConversationDashboardProps {
  currentMethodology: string
  onMethodologyChange: (id: string) => void
  legendMode: boolean
  onLegendModeToggle: () => void
  // Intelligence toggles
  sideCanalEnabled: boolean
  contextInjectionEnabled: boolean
  realtimeDataEnabled: boolean
  newsNotificationsEnabled: boolean
  onSideCanalToggle: () => void
  onContextInjectionToggle: () => void
  onRealtimeDataToggle: () => void
  onNewsNotificationsToggle: () => void
}

const METHODOLOGIES = [
  {
    id: 'direct',
    name: 'Direct',
    color: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    tokens: '200-500',
    latency: '~2s',
    speed: 'Fast',
    cost: '$0.006'
  },
  {
    id: 'cod',
    name: 'CoD',
    color: '#F97316',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    tokens: '~400',
    latency: '~8s',
    speed: 'Medium',
    cost: '$0.012'
  },
  {
    id: 'bot',
    name: 'BoT',
    color: '#EAB308',
    glowColor: 'rgba(234, 179, 8, 0.5)',
    tokens: '~600',
    latency: '~12s',
    speed: 'Medium',
    cost: '$0.018'
  },
  {
    id: 'react',
    name: 'ReAct',
    color: '#22C55E',
    glowColor: 'rgba(34, 197, 94, 0.5)',
    tokens: '2k-8k',
    latency: '~20s',
    speed: 'Slow',
    cost: '$0.024'
  },
  {
    id: 'pot',
    name: 'PoT',
    color: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    tokens: '3k-6k',
    latency: '~15s',
    speed: 'Medium',
    cost: '$0.018'
  },
  {
    id: 'gtp',
    name: 'GTP',
    color: '#6366F1',
    glowColor: 'rgba(99, 102, 241, 0.5)',
    tokens: '8k-15k',
    latency: '~30s',
    speed: 'Slow',
    cost: '$0.042'
  },
  {
    id: 'auto',
    name: 'Auto',
    color: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    tokens: 'varies',
    latency: 'varies',
    speed: 'Auto',
    cost: 'varies'
  },
]

// Colored Dot Toggle - Gold for Legend Mode, Green for Intelligence
function DotToggle({
  enabled,
  onToggle,
  label,
  color = '#22C55E' // Default green
}: {
  enabled: boolean
  onToggle: () => void
  label: string
  color?: string
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-2 hover:bg-slate-50 transition-colors group rounded"
    >
      <span className="text-[11px] text-slate-600 group-hover:text-slate-800 transition-colors">
        {label}
      </span>
      <div className="relative">
        <div
          className={`w-2 h-2 rounded-full transition-all duration-300`}
          style={{
            backgroundColor: enabled ? color : '#cbd5e1',
            boxShadow: enabled ? `0 0 6px ${color}80` : 'none'
          }}
        />
      </div>
    </button>
  )
}

export default function ConversationDashboard(props: ConversationDashboardProps) {
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null)

  // Get current methodology details for metrics
  const currentMethodology = METHODOLOGIES.find(m => m.id === props.currentMethodology)

  return (
    <div className="fixed left-0 top-0 bottom-0 w-80 bg-white border-r border-slate-200 px-6 py-6 flex flex-col z-40 shadow-sm">
      {/* Methodology Dots */}
      <div className="mb-6">
        <h4 className="text-[9px] uppercase tracking-widest text-slate-400 mb-3 font-medium">METHODOLOGY</h4>
        <div className="flex items-center gap-3 flex-wrap">
          {METHODOLOGIES.map((method) => {
            const isActive = props.currentMethodology === method.id
            const isHovered = hoveredMethod === method.id

            return (
              <div
                key={method.id}
                className="relative"
                onMouseEnter={() => setHoveredMethod(method.id)}
                onMouseLeave={() => setHoveredMethod(null)}
              >
                <div
                  onClick={() => props.onMethodologyChange(method.id)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    isActive ? 'scale-125' : ''
                  }`}
                  style={{
                    backgroundColor: isActive ? method.color : '#cbd5e1',
                    boxShadow: isActive
                      ? `0 0 6px ${method.glowColor}`
                      : 'none'
                  }}
                />
                {isHovered && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap">
                    <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wide">{method.name}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mode */}
      <div className="mb-6">
        <h4 className="text-[9px] uppercase tracking-widest text-slate-400 mb-2 font-medium">MODE</h4>
        <DotToggle
          enabled={props.legendMode}
          onToggle={props.onLegendModeToggle}
          label="Legend Mode"
          color="#EAB308"
        />
      </div>

      {/* Intelligence */}
      <div className="mb-6">
        <h4 className="text-[9px] uppercase tracking-widest text-slate-400 mb-2 font-medium">INTELLIGENCE</h4>
        <div className="space-y-0">
          <DotToggle
            enabled={props.sideCanalEnabled}
            onToggle={props.onSideCanalToggle}
            label="Side Canal"
            color="#22C55E"
          />
          <DotToggle
            enabled={props.contextInjectionEnabled}
            onToggle={props.onContextInjectionToggle}
            label="Context Injection"
            color="#22C55E"
          />
          <DotToggle
            enabled={props.realtimeDataEnabled}
            onToggle={props.onRealtimeDataToggle}
            label="Real-time Data"
            color="#22C55E"
          />
          <DotToggle
            enabled={props.newsNotificationsEnabled}
            onToggle={props.onNewsNotificationsToggle}
            label="News Notifications"
            color="#22C55E"
          />
        </div>
      </div>

      {/* Metrics - Bottom */}
      <div className="mt-auto">
        <h4 className="text-[9px] uppercase tracking-widest text-slate-400 mb-2 font-medium">METRICS</h4>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 uppercase tracking-wider">Tokens</span>
            <span className="text-slate-600 font-mono">{currentMethodology?.tokens || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 uppercase tracking-wider">Latency</span>
            <span className="text-slate-600 font-mono">{currentMethodology?.latency || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 uppercase tracking-wider">Speed</span>
            <span className="text-slate-600 font-mono">{currentMethodology?.speed || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 uppercase tracking-wider">Cost</span>
            <span className="text-slate-600 font-mono">{currentMethodology?.cost || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
