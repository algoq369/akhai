'use client'

interface LegendModeIndicatorProps {
  isActive: boolean
  onToggle: () => void
}

export default function LegendModeIndicator({ isActive, onToggle }: LegendModeIndicatorProps) {
  if (!isActive) return null

  return (
    <div className="fixed top-4 right-80 z-50 border-b border-relic-mist px-2 py-1">
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-xs text-relic-silver">instinct mode</span>
        <button
          onClick={onToggle}
          className="text-xs text-relic-silver hover:text-relic-slate"
          title="Disable Instinct Mode"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
