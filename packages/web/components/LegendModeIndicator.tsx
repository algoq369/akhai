'use client'

interface LegendModeIndicatorProps {
  isActive: boolean
  onToggle: () => void
}

export default function LegendModeIndicator({ isActive, onToggle }: LegendModeIndicatorProps) {
  if (!isActive) return null

  return (
    <div className="fixed top-4 right-80 z-50 bg-amber-50 border border-amber-400 px-3 py-1.5 rounded-md">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-xs font-mono text-amber-700">INSTINCT MODE</span>
        <button
          onClick={onToggle}
          className="text-xs text-amber-400 hover:text-amber-600"
          title="Disable Instinct Mode"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
