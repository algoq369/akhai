'use client'

interface LegendModeIndicatorProps {
  isActive: boolean
  onToggle: () => void
}

export default function LegendModeIndicator({ isActive, onToggle }: LegendModeIndicatorProps) {
  if (!isActive) return null

  return (
    <div className="fixed top-4 right-80 z-50 bg-relic-ghost border border-relic-slate px-3 py-1.5 rounded-md">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-relic-slate">LEGEND MODE</span>
        <button
          onClick={onToggle}
          className="text-xs text-relic-silver hover:text-relic-slate"
          title="Disable Legend Mode"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

